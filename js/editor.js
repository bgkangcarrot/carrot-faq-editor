/* editor.js - FAQ 데이터 로드/저장 */

/* ══════════════════════════════════════════════
   FAQ 데이터 로드
══════════════════════════════════════════════ */

async function loadFaqItems() {
  const { data, error } = await sb.from('faq_items')
    .select('*')
    .order('faq_id');
  if (error) throw error;
  return data;
}

async function loadMeta(key) {
  const { data, error } = await sb.from('faq_meta')
    .select('value')
    .eq('key', key)
    .single();
  if (error) return null;
  try { return JSON.parse(data.value); } catch { return data.value; }
}

// DB row → 앱 내부 row 형식으로 변환
function dbRowToAppRow(dbRow) {
  return {
    id: dbRow.faq_id,
    title: dbRow.title,
    content: dbRow.content,
    mainCategory: dbRow.main_category,
    category: dbRow.category,
    isUse: dbRow.is_use,
    regDate: dbRow.reg_date,
    regUser: dbRow.reg_user,
    modDate: dbRow.mod_date,
    modUser: dbRow.mod_user,
    _dbId: dbRow.id  // Supabase 내부 PK (업데이트 시 사용)
  };
}

// 전체 FAQ 로드 (메타 포함)
async function loadAllFaqData() {
  const [items, columns, mainCategories, categories, sourceFileName] = await Promise.all([
    loadFaqItems(),
    loadMeta('columns'),
    loadMeta('mainCategories'),
    loadMeta('categories'),
    loadMeta('sourceFileName')
  ]);

  const rows = items.map(dbRowToAppRow);
  const assigneeMap = {};
  items.forEach(function(r) {
    if (r.assignee) assigneeMap[r.faq_id] = r.assignee;
  });

  return {
    rows,
    columns: columns || ['id','title','content','mainCategory','category','isUse','regDate','regUser','modDate','modUser'],
    mainCategories: mainCategories || [],
    categories: categories || [],
    sourceFileName: sourceFileName || 'FAQ.xlsx',
    assigneeMap
  };
}

/* ══════════════════════════════════════════════
   FAQ 저장 (편집자)
══════════════════════════════════════════════ */

// 단일 항목 저장
async function saveFaqItem(row) {
  const { error } = await sb.from('faq_items')
    .update({
      title: row.title,
      content: row.content,
      mod_date: row.modDate,
      mod_user: row.modUser,
      updated_at: new Date().toISOString()
    })
    .eq('faq_id', row.id);
  if (error) throw error;
}

// 변경된 항목 일괄 저장
async function saveDirtyItems(rows, dirtyIds, modUser) {
  const dirty = rows.filter(function(r) { return dirtyIds.has(r.id); });
  if (!dirty.length) return 0;

  const today = todayStr();
  for (const row of dirty) {
    await sb.from('faq_items').update({
      title: row.title,
      content: row.content,
      mod_date: today,
      mod_user: modUser,
      updated_at: new Date().toISOString()
    }).eq('faq_id', row.id);
  }
  return dirty.length;
}

/* ══════════════════════════════════════════════
   엑셀 내보내기 (관리자 - 현재 DB 상태를 엑셀로)
══════════════════════════════════════════════ */
async function exportToExcel() {
  const data = await loadAllFaqData();
  const exportRows = data.rows.map(function(r) {
    const o = {};
    data.columns.forEach(function(c) { o[c] = r[c] || ''; });
    return o;
  });

  // 원본 워크북 구조 유지 (다른 시트는 서버에 없으니 list만)
  const ws = XLSX.utils.json_to_sheet(exportRows, { header: data.columns });
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'list');
  XLSX.writeFile(wb, (data.sourceFileName.replace(/\.xlsx?$/i,'') || 'FAQ') + '_편집_' + todayStr() + '.xlsx');
}
