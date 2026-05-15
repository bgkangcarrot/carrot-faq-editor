/* admin.js - 관리자 전용 기능 */

/* ══════════════════════════════════════════════
   계정 관리
══════════════════════════════════════════════ */

// 관리자가 새 사용자 계정 생성 (Supabase Admin API 우회 - invite 방식)
async function createUserAccount(email, name, role) {
  // Service role key 없이는 직접 signUp만 가능
  // 관리자가 임시 비밀번호로 계정 생성 → 사용자에게 비밀번호 재설정 메일 발송
  const tempPassword = Math.random().toString(36).slice(-10) + 'A1!';

  const { data, error } = await sb.auth.signUp({
    email,
    password: tempPassword,
    options: {
      data: { name },
      emailRedirectTo: window.location.origin + '/'
    }
  });

  if (error) throw error;

  // profiles 테이블에 role 업데이트 (트리거가 'editor'로 생성함)
  if (data.user && role === 'admin') {
    await sb.from('profiles').update({ role: 'admin', name }).eq('id', data.user.id);
  }

  // 비밀번호 재설정 메일 발송 (사용자가 직접 비밀번호 설정)
  await sb.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin + '/'
  });

  return data.user;
}

// 전체 사용자 목록 (관리자만)
async function loadUserList() {
  const { data, error } = await sb.from('profiles').select('*').order('created_at');
  if (error) throw error;
  return data;
}

// 사용자 role 변경
async function updateUserRole(userId, newRole) {
  const { error } = await sb.from('profiles')
    .update({ role: newRole })
    .eq('id', userId);
  if (error) throw error;
}

/* ══════════════════════════════════════════════
   FAQ 데이터 관리 (관리자)
══════════════════════════════════════════════ */

// 엑셀 파싱 후 Supabase에 전체 FAQ 업로드
async function uploadFaqData(rows, columns, mainCategories, categories, sourceFileName) {
  // 기존 데이터 전체 삭제 후 재삽입
  const { error: delError } = await sb.from('faq_items').delete().neq('id', 0);
  if (delError) throw delError;

  // 배치 삽입 (한 번에 500건씩)
  const toInsert = rows.map(function(r) {
    return {
      faq_id: r.id || '',
      title: r.title || '',
      content: r.content || '',
      main_category: r.mainCategory || '',
      category: r.category || '',
      is_use: r.isUse || '1',
      reg_date: r.regDate || '',
      reg_user: r.regUser || '',
      mod_date: r.modDate || '',
      mod_user: r.modUser || '',
      assignee: ''
    };
  });

  for (let i = 0; i < toInsert.length; i += 500) {
    const batch = toInsert.slice(i, i + 500);
    const { error } = await sb.from('faq_items').insert(batch);
    if (error) throw error;
  }

  // 메타 정보 저장
  await saveMeta('columns', columns);
  await saveMeta('mainCategories', mainCategories);
  await saveMeta('categories', categories);
  await saveMeta('sourceFileName', sourceFileName);
  await saveMeta('uploadedAt', new Date().toISOString());
}

// 담당자 일괄 업데이트
async function updateAssignees(assigneeMap) {
  // assigneeMap: {faqId: assigneeName}
  const updates = Object.entries(assigneeMap).map(function([faqId, assignee]) {
    return sb.from('faq_items')
      .update({ assignee })
      .eq('faq_id', faqId);
  });
  // 병렬 실행 (한 번에 최대 50개씩)
  for (let i = 0; i < updates.length; i += 50) {
    await Promise.all(updates.slice(i, i + 50));
  }
}

// 메타 저장
async function saveMeta(key, value) {
  const { error } = await sb.from('faq_meta')
    .upsert({ key, value: JSON.stringify(value), updated_at: new Date().toISOString() },
             { onConflict: 'key' });
  if (error) console.warn('meta 저장 실패:', key, error);
}

/* ══════════════════════════════════════════════
   취합 (merge)
══════════════════════════════════════════════ */

// 편집된 내용 취합 → 원본에 반영
async function mergeEdits(diffs) {
  // diffs: [{faqId, field, newVal, accept}]
  const accepted = diffs.filter(function(d) { return d.accept; });
  for (const d of accepted) {
    const updateData = {};
    if (d.field === 'title') updateData.title = d.newVal;
    if (d.field === 'content') updateData.content = d.newVal;
    updateData.mod_date = todayStr();
    await sb.from('faq_items').update(updateData).eq('faq_id', d.faqId);
  }
}
