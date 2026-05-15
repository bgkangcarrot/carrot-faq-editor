/* app.js - 메인 앱 로직 */

/* ══════════════════════════════════════════════
   공용 유틸
══════════════════════════════════════════════ */
const STD_COLS = ['id','title','content','mainCategory','category','isUse','regDate','regUser','modDate','modUser'];
const EMOJIS = {
  '안내/연락':['📱','💻','📞','✉️','📧','💬','🔔','📢','💡','ℹ️','❓','❗'],
  '체크/상태':['✅','❌','⭕','✔️','☑️','⚠️','🚨','🆗','🆕','📌','📍','🔖'],
  '이동/링크':['▶️','▷','→','↪️','🔗','🌐','📲','⏩','⬇️','⬆️','📂','📄'],
  '시간/일정':['⏰','📅','📆','⏱','🕐','📊','📈','💰','💳','🎁','🏆','⭐']
};
const COLOR_SWATCHES = [
  '#3A2F2C','#60514D','#948179','#C0392B','#5D6BB4','#FFFFFF',
  '#F37323','#F89B6C','#FBB584','#2E8B57','#3498DB','#9B59B6',
  '#E74C3C','#E67E22','#F1C40F','#27AE60','#0984E3','#6C5CE7'
];

function toast(msg, type) {
  const c = document.getElementById('toast-wrap');
  const t = document.createElement('div');
  t.className = 'toast' + (type ? ' ' + type : '');
  t.textContent = msg;
  c.appendChild(t);
  setTimeout(function() { t.style.opacity='0'; t.style.transition='opacity .2s'; setTimeout(function(){t.remove();},200); }, 2600);
}
function todayStr() {
  const d = new Date();
  return ''+d.getFullYear()+String(d.getMonth()+1).padStart(2,'0')+String(d.getDate()).padStart(2,'0');
}
function esc(s) {
  if(s==null) return '';
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function setLoading(show, text) {
  document.getElementById('loading-overlay').classList.toggle('hidden', !show);
  if(text) document.getElementById('loading-text').textContent = text;
}
function mcLabel(mcs, v) { const f=mcs.find(m=>m.value===String(v||'')); return f?f.label:String(v||''); }
function catLabel(cats, id, mcv) {
  const s=String(id||''),mv=String(mcv||'');
  let f=mv?cats.find(c=>c.id===s&&c.mainCategory===mv):null;
  if(!f) f=cats.find(c=>c.id===s);
  return f?f.name:s;
}
function catsForMc(cats,mc){ const mv=String(mc||''); return mv?cats.filter(c=>c.mainCategory===mv):cats.slice(); }
function refreshCatSelects(mcId,catId,mcs,cats,filterMc,filterCat){
  const ms=document.getElementById(mcId), cs=document.getElementById(catId);
  if(!ms||!cs) return;
  ms.innerHTML='<option value="">전체 대분류</option>'+mcs.map(m=>'<option value="'+esc(m.value)+'"'+(filterMc===m.value?' selected':'')+'>'+esc(m.label)+'</option>').join('');
  const cl=catsForMc(cats,filterMc);
  cs.innerHTML='<option value="">전체 소분류</option>'+cl.map(c=>{
    const ctx=filterMc?'':' ('+esc(mcLabel(mcs,c.mainCategory))+')';
    return '<option value="'+esc(c.id)+'"'+(filterCat===c.id?' selected':'')+'>'+esc(c.name)+ctx+'</option>';
  }).join('');
}
function openModal(html){document.getElementById('modal-box').innerHTML=html;document.getElementById('modal-overlay').classList.add('open');}
function closeModal(){document.getElementById('modal-overlay').classList.remove('open');}

/* ══════════════════════════════════════════════
   HTML 변환
══════════════════════════════════════════════ */
function importHtml(raw) {
  if(!raw) return '';
  let s=String(raw);
  s=s.replace(/<\/br\s*>/gi,'<br>').replace(/<br\s*\/>/gi,'<br>');
  s=s.replace(/&#(\d+);/g,(_,c)=>{try{return String.fromCodePoint(parseInt(c,10));}catch{return _;}});
  s=s.replace(/&#x([0-9a-fA-F]+);/g,(_,c)=>{try{return String.fromCodePoint(parseInt(c,16));}catch{return _;}});
  s=s.replace(/<a\s+onclick="window\.faqMove\((\d+)\)"\s*>([\s\S]*?)<\/a>/gi,(_,id,txt)=>'<a data-faq-id="'+id+'" href="#faq-'+id+'">'+txt+'</a>');
  const pv=[]; s=s.replace(/<(style|script)[\s\S]*?<\/\1>/gi,m=>{pv.push(m);return '\x00P'+(pv.length-1)+'\x00';});
  s=s.replace(/\r\n/g,'\n').replace(/>\s*\n\s*/g,'>').replace(/\s*\n\s*</g,'<').replace(/\n+/g,' ').replace(/[ \t]{2,}/g,' ');
  s=s.replace(/\x00P(\d+)\x00/g,(_,i)=>pv[+i]);
  return s;
}
function exportHtml(h) {
  if(!h) return '';
  let s=String(h);
  s=s.replace(/<div><br\s*\/?><\/div>/gi,'<br/>');
  s=s.replace(/<div>([\s\S]*?)<\/div>/gi,'<br/>$1');
  s=s.replace(/<p>([\s\S]*?)<\/p>/gi,'$1<br/><br/>');
  s=s.replace(/<br\s*\/?>/gi,'<br/>');
  s=s.replace(/<a\s+([^>]*?)data-faq-id="(\d+)"([^>]*?)>([\s\S]*?)<\/a>/gi,(_,b,id,a,txt)=>'<a onclick="window.faqMove('+id+')">'+txt+'</a>');
  const pv=[]; s=s.replace(/<(style|script)[\s\S]*?<\/\1>/gi,m=>{pv.push(m);return '\x00P'+(pv.length-1)+'\x00';});
  s=s.replace(/\r\n/g,'\n').replace(/>\s*\n\s*/g,'>').replace(/\s*\n\s*</g,'<').replace(/\n+/g,' ').replace(/[ \t]{2,}/g,' ');
  s=s.replace(/\x00P(\d+)\x00/g,(_,i)=>pv[+i]);
  s=s.replace(/(<br\/?>){3,}$/gi,'<br/><br/>').replace(/^(<br\/?>)+/i,'');
  return s;
}

/* ══════════════════════════════════════════════
   STATE
══════════════════════════════════════════════ */
const S = {
  rows: [], columns: STD_COLS, mainCategories: [], categories: [], assigneeMap: {},
  dist: { filterMc:'', filterCat:'', search:'', filterAssignee:'' },
  ed: { activeId:null, dirtyIds:new Set(), origSnap:{}, filterMc:'', filterCat:'', search:'', filterType:'all', filterAssignee:'' },
  merge: { pkgFiles:[], diffs:[] }
};

/* ══════════════════════════════════════════════
   탭 전환
══════════════════════════════════════════════ */
function switchTab(tab){
  document.querySelectorAll('.tab-btn').forEach(b=>b.classList.toggle('active',b.dataset.tab===tab));
  document.querySelectorAll('.tab-pane').forEach(p=>p.classList.toggle('active',p.id==='pane-'+tab));
  if(tab==='accounts') loadUserTable();
}

/* ══════════════════════════════════════════════
   데이터 로드
══════════════════════════════════════════════ */
async function loadData() {
  setLoading(true,'FAQ 데이터를 불러오는 중...');
  try {
    const data = await loadAllFaqData();
    S.rows = data.rows;
    S.columns = data.columns;
    S.mainCategories = data.mainCategories;
    S.categories = data.categories;
    S.assigneeMap = data.assigneeMap;
    refreshDistCatSelects(); renderDistTable(); refreshAssigneeFilter();
    refreshEdCatSelects(); refreshEdAssigneeFilter(); refreshEdList();
    if(!S.rows.length) { setLoading(false); return; }
    toast(S.rows.length+'개 항목 로드 완료', 'suc');
  } catch(e) {
    console.error(e);
    toast('데이터 로드 실패: '+e.message, 'err');
  } finally {
    setLoading(false);
  }
}

/* ══════════════════════════════════════════════
   DIST TAB
══════════════════════════════════════════════ */
function refreshDistCatSelects() {
  refreshCatSelects('dist-mc','dist-cat',S.mainCategories,S.categories,S.dist.filterMc,S.dist.filterCat);
}
function getAssigneeList() {
  return [...new Set(Object.values(S.assigneeMap).filter(Boolean))].sort();
}
function renderDistTable() {
  const tbody = document.getElementById('dist-tbody');
  if(!S.rows.length){tbody.innerHTML='<tr><td colspan="4" style="padding:40px;text-align:center;color:var(--ink3)">데이터가 없습니다. 엑셀을 업로드하세요.</td></tr>';updateDistSummary();return;}
  tbody.innerHTML = S.rows.map(r=>{
    const ml=mcLabel(S.mainCategories,r.mainCategory)||'-';
    const cl=catLabel(S.categories,r.category,r.mainCategory)||'-';
    const asgn=S.assigneeMap[r.id]||'';
    return '<tr class="dist-table-row" data-id="'+esc(r.id)+'" data-mc="'+esc(r.mainCategory||'')+'" data-cat="'+esc(r.category||'')+'" data-title="'+esc((r.title||'').toLowerCase())+'" data-asgn="'+esc(asgn)+'">'+
      '<td><span class="fid">#'+esc(r.id)+'</span></td>'+
      '<td style="max-width:340px"><div class="ftitle" style="-webkit-line-clamp:2">'+esc(r.title||'(제목 없음)')+'</div></td>'+
      '<td><span style="font-size:11.5px;color:var(--ink3)">'+esc(ml)+'›<br>'+esc(cl)+'</span></td>'+
      '<td><input class="asgn-input'+(asgn?' has-val':'')+'" data-id="'+esc(r.id)+'" value="'+esc(asgn)+'" placeholder="담당자 입력…"></td>'+
    '</tr>';
  }).join('');
  tbody.querySelectorAll('.asgn-input').forEach(inp=>{
    inp.addEventListener('input',function(){
      const id=this.dataset.id,val=this.value;
      if(val.trim()) S.assigneeMap[id]=val.trim(); else delete S.assigneeMap[id];
      this.classList.toggle('has-val',!!val.trim());
      this.closest('tr').dataset.asgn=val.trim();
      updateDistSummary(); refreshAssigneeFilter();
    });
    inp.addEventListener('change',function(){
      this.value=this.value.trim();
      const id=this.dataset.id,val=this.value;
      if(val) S.assigneeMap[id]=val; else delete S.assigneeMap[id];
      this.classList.toggle('has-val',!!val);
      this.closest('tr').dataset.asgn=val;
    });
  });
  applyDistFilter(); updateDistSummary();
}
function applyDistFilter() {
  const q=S.dist.search.trim().toLowerCase(),mc=S.dist.filterMc,cat=S.dist.filterCat,af=S.dist.filterAssignee;
  document.querySelectorAll('#dist-tbody .dist-table-row').forEach(row=>{
    const asgn=(S.assigneeMap[row.dataset.id]||'').trim();
    let show=true;
    if(mc&&row.dataset.mc!==mc) show=false;
    if(cat&&row.dataset.cat!==cat) show=false;
    if(af!==''){if(af==='__NONE__'){if(asgn)show=false;}else{if(asgn!==af)show=false;}}
    if(q&&row.dataset.title.indexOf(q)===-1&&row.dataset.id.indexOf(q)===-1) show=false;
    row.classList.toggle('filtered-out',!show);
  });
  const v=document.querySelectorAll('#dist-tbody .dist-table-row:not(.filtered-out)').length;
  document.getElementById('dist-cnt').textContent=v+'개 표시';
}
function updateDistSummary() {
  const total=S.rows.length,assigned=Object.keys(S.assigneeMap).filter(id=>S.assigneeMap[id]).length;
  document.getElementById('dist-cnt').textContent=total+'개';
  document.getElementById('dist-assigned-cnt').textContent=assigned?assigned+'건 담당자 지정':'';
}
function refreshAssigneeFilter() {
  const container=document.getElementById('assignee-filter-list');
  const assignees=getAssigneeList(),cur=S.dist.filterAssignee;
  let html='<button class="chip'+(cur===''?' active':'')+'" style="margin-bottom:4px;width:100%;text-align:left" data-af="">전체</button>';
  html+='<button class="chip'+(cur==='__NONE__'?' active':'')+'" style="margin-bottom:4px;width:100%;text-align:left;color:var(--ink3)" data-af="__NONE__">미지정</button>';
  assignees.forEach(a=>{
    const cnt=S.rows.filter(r=>(S.assigneeMap[r.id]||'')===a).length;
    html+='<button class="chip'+(cur===a?' active':'')+'" style="margin-bottom:4px;width:100%;display:flex;justify-content:space-between" data-af="'+esc(a)+'"><span>'+esc(a)+'</span><span style="font-size:11px;color:var(--ink3)">'+cnt+'건</span></button>';
  });
  container.innerHTML=html;
  container.querySelectorAll('[data-af]').forEach(btn=>{
    btn.addEventListener('click',function(){S.dist.filterAssignee=this.dataset.af;refreshAssigneeFilter();applyDistFilter();});
  });
}

/* ══════════════════════════════════════════════
   EDITOR TAB
══════════════════════════════════════════════ */
function refreshEdCatSelects(){refreshCatSelects('ed-mc','ed-cat',S.mainCategories,S.categories,S.ed.filterMc,S.ed.filterCat);}
function refreshEdAssigneeFilter(){
  const wrap=document.getElementById('ed-assignee-filter-wrap'),list=document.getElementById('ed-assignee-filter-list');
  if(!wrap||!list) return;
  const assignees=[...new Set(Object.values(S.assigneeMap).filter(Boolean))].sort();
  if(!assignees.length){wrap.style.display='none';return;}
  wrap.style.display='';
  const cur=S.ed.filterAssignee;
  let html='<button class="chip'+(cur===''?' active':'')+'" style="margin-bottom:3px;width:100%;text-align:left" data-eaf="">전체</button>';
  assignees.forEach(a=>{
    const cnt=S.rows.filter(r=>(S.assigneeMap[r.id]||'')===a).length;
    html+='<button class="chip'+(cur===a?' active':'')+'" style="margin-bottom:3px;width:100%;display:flex;justify-content:space-between" data-eaf="'+esc(a)+'"><span>'+esc(a)+'</span><span style="font-size:11px;color:var(--ink3)">'+cnt+'건</span></button>';
  });
  list.innerHTML=html;
  list.querySelectorAll('[data-eaf]').forEach(btn=>{
    btn.addEventListener('click',function(){S.ed.filterAssignee=this.dataset.eaf;refreshEdAssigneeFilter();refreshEdList();});
  });
}
function edFilteredRows(){
  const q=S.ed.search.trim().toLowerCase();
  return S.rows.filter(r=>{
    if(S.ed.filterType==='dirty'&&!S.ed.dirtyIds.has(r.id)) return false;
    if(S.ed.filterType==='use'&&r.isUse!=='1') return false;
    if(S.ed.filterMc&&String(r.mainCategory)!==S.ed.filterMc) return false;
    if(S.ed.filterCat&&String(r.category)!==S.ed.filterCat) return false;
    if(S.ed.filterAssignee&&(S.assigneeMap[r.id]||'')!==S.ed.filterAssignee) return false;
    if(q&&((r.title||'')+' '+(r.id||'')).toLowerCase().indexOf(q)===-1) return false;
    return true;
  });
}
function refreshEdList(){
  const rows=edFilteredRows(),el=document.getElementById('ed-list');
  document.getElementById('ed-cnt').textContent=rows.length+'개';
  const dc=S.ed.dirtyIds.size; document.getElementById('ed-dirty').textContent=dc?dc+'건 편집됨':'';
  if(!rows.length){el.innerHTML='<div class="empty">'+(S.rows.length?'검색 결과 없음':'데이터가 없습니다')+'</div>';return;}
  el.innerHTML=rows.map(r=>{
    const dirty=S.ed.dirtyIds.has(r.id),active=S.ed.activeId===r.id,use=r.isUse==='1';
    const ml=mcLabel(S.mainCategories,r.mainCategory)||'-',cl=catLabel(S.categories,r.category,r.mainCategory)||'-';
    const asgn=S.assigneeMap[r.id]||'';
    return '<div class="faq-item'+(active?' active':'')+(dirty?' edited':'')+'" data-id="'+esc(r.id)+'">'+
      '<div class="fi-body"><div class="fi-meta"><span class="fid">#'+esc(r.id)+'</span>'+
      '<span class="fdot'+(use?' use':'')+'" title="'+(use?'사용중':'미사용')+'"></span>'+
      (dirty?'<span class="fdot dirty" title="편집됨"></span>':'')+
      '<span class="fcat">'+esc(ml)+' › '+esc(cl)+'</span>'+
      (asgn?'<span style="font-size:11px;color:var(--ord);font-weight:600">'+esc(asgn)+'</span>':'')+'</div>'+
      '<div class="ftitle">'+esc(r.title||'(제목 없음)')+'</div></div></div>';
  }).join('');
  el.querySelectorAll('.faq-item').forEach(item=>{item.addEventListener('click',()=>selectItem(item.dataset.id));});
}
/* 모바일: 사이드바 ↔ 편집 화면 전환 */
function isMobile(){ return window.innerWidth <= 767; }

function showEditorView(){
  if(!isMobile()) return;
  document.getElementById('sidebar').classList.add('slide-out');
  document.getElementById('ed-main').classList.add('slide-in');
  // 뒤로가기 바 표시
  const backBar = document.getElementById('mobile-back-bar');
  if(backBar) backBar.style.display='flex';
}
function showListView(){
  if(!isMobile()) return;
  document.getElementById('sidebar').classList.remove('slide-out');
  document.getElementById('ed-main').classList.remove('slide-in');
}

function showEdEmpty(){
  document.getElementById('ed-empty').style.display='flex';
  document.getElementById('ed-active').style.display='none';
  S.ed.activeId=null;
  if(isMobile()) showListView();
}
function showEdActive(){
  document.getElementById('ed-empty').style.display='none';
  document.getElementById('ed-active').style.display='flex';
  if(isMobile()) showEditorView();
}
function selectItem(id){
  saveActive(true);
  const row=S.rows.find(r=>r.id===id); if(!row) return;
  S.ed.activeId=id;
  document.getElementById('ed-title').value=row.title||'';
  document.getElementById('ed-id').value=row.id||'';
  document.getElementById('ed-mc-h').value=row.mainCategory||'';
  document.getElementById('ed-cat-h').value=row.category||'';
  document.getElementById('ed-reguser-h').value=row.regUser||'';
  document.getElementById('ed-isuse-h').value=row.isUse||'';
  const phq=document.getElementById('ph-q'); if(phq) phq.textContent=row.title||'';
  // 모바일 뒤로가기 타이틀
  const mbt=document.getElementById('mobile-back-title'); if(mbt) mbt.textContent=row.title||'';
  const edBody=document.getElementById('ed-body');
  edBody.innerHTML=importHtml(row.content||'');
  updateOutput(); showEdActive(); refreshEdList();
}
function saveActive(silent){
  if(!S.ed.activeId) return;
  const row=S.rows.find(r=>r.id===S.ed.activeId); if(!row) return;
  const newTitle=document.getElementById('ed-title').value;
  const srcPane=document.getElementById('ed-source');
  let newContent=srcPane&&srcPane.style.display!=='none'?document.getElementById('ed-src').value:exportHtml(document.getElementById('ed-body').innerHTML);
  const before=JSON.stringify(row);
  row.title=newTitle; row.content=newContent;
  if(before!==JSON.stringify(row)){
    row.modDate=todayStr(); row.modUser=currentProfile?currentProfile.name:'편집자';
  }
  if(S.ed.origSnap[row.id]!==JSON.stringify(row)) S.ed.dirtyIds.add(row.id);
  else S.ed.dirtyIds.delete(row.id);
  if(!silent) toast('저장됨','suc');
  refreshEdList();
}
async function saveItemToDB(){
  if(!S.ed.activeId) return;
  saveActive(true);
  const row=S.rows.find(r=>r.id===S.ed.activeId);
  if(!row) return;
  setLoading(true,'저장 중...');
  try {
    await saveFaqItem(row);
    S.ed.origSnap[row.id]=JSON.stringify(row);
    S.ed.dirtyIds.delete(row.id);
    toast('DB에 저장됨','suc'); refreshEdList();
  } catch(e){ toast('저장 실패: '+e.message,'err'); }
  finally{ setLoading(false); }
}
function updateOutput(){
  const h=document.getElementById('ed-body').innerHTML;
  const ex=exportHtml(h);
  document.getElementById('ed-out').value=ex;
  if(document.activeElement!==document.getElementById('ed-src')) document.getElementById('ed-src').value=ex;
}

/* savedRange */
let _sr=null;
function saveRange(){
  const ed=document.getElementById('ed-body'); if(!ed) return;
  const sel=window.getSelection();
  if(sel&&sel.rangeCount){const r=sel.getRangeAt(0);if(ed.contains(r.commonAncestorContainer)){_sr=r.cloneRange();return;}} _sr=null;
}
function insertAtCursor(html){
  const ed=document.getElementById('ed-body'); if(!ed) return;
  let range=null;
  if(_sr&&ed.contains(_sr.commonAncestorContainer)){ed.focus();const sel=window.getSelection();sel.removeAllRanges();sel.addRange(_sr);range=_sr;}
  else{ed.focus();const sel=window.getSelection();if(sel&&sel.rangeCount){const r=sel.getRangeAt(0);if(ed.contains(r.commonAncestorContainer))range=r;}}
  if(range){
    range.deleteContents();
    const tmp=document.createElement('div');tmp.innerHTML=html;
    const frag=document.createDocumentFragment();let last=null;
    while(tmp.firstChild){last=tmp.firstChild;frag.appendChild(last);}
    range.insertNode(frag);
    if(last){range.setStartAfter(last);range.setEndAfter(last);const sel=window.getSelection();sel.removeAllRanges();sel.addRange(range);_sr=range.cloneRange();}
  } else { ed.insertAdjacentHTML('beforeend',html); }
  updateOutput();
}

/* ══════════════════════════════════════════════
   MERGE TAB
══════════════════════════════════════════════ */
function loadMergePkgFile(file){
  const reader=new FileReader();
  reader.onload=function(e){
    try{
      const data=JSON.parse(e.target.result);
      if(S.merge.pkgFiles.find(f=>f.name===file.name)){toast(file.name+': 이미 추가됨');return;}
      S.merge.pkgFiles.push({name:file.name,assignee:data.assignee,editedAt:data.editedAt,editedRows:data.editedRows});
      renderMergeChips();
      toast(data.assignee+'님 파일 추가 ('+data.editedRows.length+'건)','suc');
      document.getElementById('btn-run-merge').disabled=false;
    }catch(err){toast(file.name+': 파싱 실패','err');}
  };
  reader.readAsText(file,'utf-8');
}
function renderMergeChips(){
  const c=document.getElementById('merge-file-chips');
  c.innerHTML=S.merge.pkgFiles.map((f,i)=>'<div class="mchip"><span class="fname">'+esc(f.assignee)+'('+esc(f.name)+')</span><span class="rm" data-i="'+i+'">✕</span></div>').join('');
  c.querySelectorAll('.rm').forEach(btn=>{btn.addEventListener('click',function(){S.merge.pkgFiles.splice(+this.dataset.i,1);renderMergeChips();if(!S.merge.pkgFiles.length)document.getElementById('btn-run-merge').disabled=true;});});
}
function runMerge(){
  S.merge.diffs=[];
  const origMap={};S.rows.forEach(r=>origMap[r.id]=r);
  S.merge.pkgFiles.forEach(pkg=>{
    pkg.editedRows.forEach(edited=>{
      const orig=origMap[edited.id]; if(!orig) return;
      ['title','content'].forEach(field=>{
        const ov=(orig[field]||'').trim(),nv=(edited[field]||'').trim();
        if(ov!==nv) S.merge.diffs.push({pkgName:pkg.name,assignee:pkg.assignee,id:edited.id,field,oldVal:orig[field]||'',newVal:edited[field]||'',accept:true});
      });
    });
  });
  renderDiff(); updateMergeSummary();
  document.getElementById('btn-merge-dl').disabled=S.merge.diffs.length===0;
}
function renderDiff(){
  const body=document.getElementById('merge-body');
  if(!S.merge.diffs.length){body.innerHTML='<div class="diff-empty">변경된 항목이 없습니다</div>';return;}
  const FL={title:'제목',content:'내용'};
  const byA={};
  S.merge.diffs.forEach((d,i)=>{const k=d.assignee+'||'+d.pkgName;if(!byA[k])byA[k]={assignee:d.assignee,items:[]};byA[k].items.push({d,i});});
  let html='<table class="diff-table"><thead><tr><th style="width:58px">ID</th><th style="width:70px">담당자</th><th style="width:46px">필드</th><th>이전</th><th>변경</th><th style="width:90px">적용</th></tr></thead><tbody>';
  Object.values(byA).forEach(grp=>{
    html+='<tr class="dsec"><td colspan="6">✏️ '+esc(grp.assignee)+'님 변경사항 ('+grp.items.length+'건)</td></tr>';
    grp.items.forEach(({d,i})=>{
      const od=d.field==='content'?d.oldVal.replace(/<[^>]+>/g,''):d.oldVal;
      const nd=d.field==='content'?d.newVal.replace(/<[^>]+>/g,''):d.newVal;
      html+='<tr data-di="'+i+'"><td class="did">#'+esc(d.id)+'</td><td style="font-size:12px;color:var(--ink2)">'+esc(d.assignee)+'</td><td class="dfield">'+esc(FL[d.field]||d.field)+'</td>'+
        '<td><div class="dold" title="'+esc(d.oldVal)+'">'+esc(od)+'</div></td>'+
        '<td><div class="dnew" title="'+esc(d.newVal)+'">'+esc(nd)+'</div></td>'+
        '<td class="dact"><button class="dapply acc'+(d.accept?' on':'')+'">적용</button><button class="dapply rej'+(!d.accept?' on':'')+'">제외</button></td></tr>';
    });
  });
  html+='</tbody></table>';
  body.innerHTML=html;
  body.querySelectorAll('tr[data-di]').forEach(row=>{
    const i=+row.dataset.di;
    row.querySelector('.acc').addEventListener('click',function(){S.merge.diffs[i].accept=true;this.classList.add('on');row.querySelector('.rej').classList.remove('on');updateMergeSummary();});
    row.querySelector('.rej').addEventListener('click',function(){S.merge.diffs[i].accept=false;this.classList.add('on');row.querySelector('.acc').classList.remove('on');updateMergeSummary();});
  });
}
function updateMergeSummary(){
  const total=S.merge.diffs.length,acc=S.merge.diffs.filter(d=>d.accept).length;
  document.getElementById('merge-summary').innerHTML='총 <strong>'+total+'</strong>건 · 적용 <strong>'+acc+'</strong>건 · 제외 <strong>'+(total-acc)+'</strong>건';
  document.getElementById('btn-merge-dl').disabled=acc===0;
}
async function applyMergeToDB(){
  const accepted=S.merge.diffs.filter(d=>d.accept);
  if(!accepted.length){toast('적용할 항목이 없습니다','err');return;}
  setLoading(true,'DB에 반영 중...');
  try{
    await mergeEdits(accepted.map(d=>({faqId:d.id,field:d.field,newVal:d.newVal,accept:true})));
    // 로컬 state도 업데이트
    accepted.forEach(d=>{const row=S.rows.find(r=>r.id===d.id);if(row) row[d.field]=d.newVal;});
    renderDistTable(); refreshEdList();
    toast(accepted.length+'건 DB 반영 완료','suc');
    S.merge.diffs=[]; S.merge.pkgFiles=[];
    renderMergeChips(); document.getElementById('merge-body').innerHTML='<div class="diff-empty">반영 완료</div>';
    document.getElementById('btn-merge-dl').disabled=true;
    document.getElementById('btn-run-merge').disabled=true;
  }catch(e){toast('반영 실패: '+e.message,'err');}
  finally{setLoading(false);}
}

/* ══════════════════════════════════════════════
   ACCOUNTS TAB
══════════════════════════════════════════════ */
async function loadUserTable(){
  try{
    const users=await loadUserList();
    const tbody=document.getElementById('user-tbody');
    if(!users.length){tbody.innerHTML='<tr><td colspan="5" style="padding:24px;text-align:center;color:var(--ink3)">등록된 사용자가 없습니다</td></tr>';return;}
    tbody.innerHTML=users.map(u=>'<tr>'+
      '<td style="font-weight:500">'+esc(u.name)+'</td>'+
      '<td style="color:var(--ink2)">'+esc(u.email)+'</td>'+
      '<td><select class="role-sel" data-uid="'+esc(u.id)+'" '+(u.id===currentUser.id?'disabled':'')+'>'+
        '<option value="editor"'+(u.role==='editor'?' selected':'')+'>편집자</option>'+
        '<option value="admin"'+(u.role==='admin'?' selected':'')+'>관리자</option>'+
      '</select></td>'+
      '<td style="font-size:12px;color:var(--ink3)">'+(u.created_at?u.created_at.slice(0,10):'')+'</td>'+
      '<td>'+
        (u.id!==currentUser.id?'<button class="btn btn-sm btn-ghost" style="color:var(--dan)" data-del="'+esc(u.id)+'">삭제</button>':'')+
      '</td>'+
    '</tr>').join('');
    tbody.querySelectorAll('.role-sel').forEach(sel=>{
      sel.addEventListener('change',async function(){
        try{await updateUserRole(this.dataset.uid,this.value);toast('권한 변경됨','suc');}
        catch(e){toast('변경 실패: '+e.message,'err');}
      });
    });
    tbody.querySelectorAll('[data-del]').forEach(btn=>{
      btn.addEventListener('click',async function(){
        if(!confirm('이 사용자를 삭제할까요?')) return;
        // Supabase admin API가 없으면 profiles만 삭제
        try{
          await sb.from('profiles').delete().eq('id',this.dataset.del);
          toast('삭제됨','suc'); loadUserTable();
        }catch(e){toast('삭제 실패: '+e.message,'err');}
      });
    });
  }catch(e){toast('사용자 목록 로드 실패','err');}
}

/* ══════════════════════════════════════════════
   모달들
══════════════════════════════════════════════ */
function openAddUserModal(){
  openModal(
    '<div class="mh"><div class="mh-title">계정 추가</div><button class="btn btn-ghost btn-icon" id="m-close">✕</button></div>'+
    '<div class="mb">'+
      '<p style="font-size:13px;color:var(--ink2);margin-bottom:14px;line-height:1.5">계정을 생성하면 해당 이메일로 비밀번호 설정 링크가 발송됩니다.</p>'+
      '<div class="fg"><label>이메일</label><input type="email" id="new-email" placeholder="example@hanwha.com"></div>'+
      '<div class="fg"><label>이름</label><input type="text" id="new-name" placeholder="홍길동"></div>'+
      '<div class="fg"><label>권한</label><select id="new-role"><option value="editor">편집자</option><option value="admin">관리자</option></select></div>'+
      '<div class="error-inline" id="add-user-err"></div>'+
    '</div>'+
    '<div class="mf"><button class="btn btn-ghost" id="m-cancel">취소</button><button class="btn btn-primary" id="m-confirm">계정 생성</button></div>'
  );
  document.getElementById('m-close').addEventListener('click',closeModal);
  document.getElementById('m-cancel').addEventListener('click',closeModal);
  document.getElementById('m-confirm').addEventListener('click',async function(){
    const email=document.getElementById('new-email').value.trim();
    const name=document.getElementById('new-name').value.trim();
    const role=document.getElementById('new-role').value;
    const errEl=document.getElementById('add-user-err');
    if(!email||!name){errEl.textContent='이메일과 이름을 입력하세요';errEl.classList.add('show');return;}
    this.disabled=true; this.textContent='생성 중...';
    try{
      await createUserAccount(email,name,role);
      closeModal(); toast(name+'님 계정 생성 완료. 비밀번호 설정 메일이 발송됩니다.','suc');
      loadUserTable();
    }catch(e){errEl.textContent=e.message;errEl.classList.add('show');this.disabled=false;this.textContent='계정 생성';}
  });
}
function withSavedRange(fn){return function(){saveRange();fn();};}
function openEmojiModal(){
  let s='';
  Object.keys(EMOJIS).forEach(cat=>{
    s+='<div class="esec"><div class="esec-title">'+esc(cat)+'</div><div class="egrid">'+EMOJIS[cat].map(e=>'<button class="ebtn" data-e="'+esc(e)+'">'+e+'</button>').join('')+'</div></div>';
  });
  openModal('<div class="mh"><div class="mh-title">이모지 삽입</div><button class="btn btn-ghost btn-icon" id="m-close">✕</button></div><div class="mb">'+s+'</div>');
  document.getElementById('m-close').addEventListener('click',closeModal);
  document.querySelectorAll('.ebtn').forEach(b=>{b.addEventListener('click',function(){closeModal();insertAtCursor(this.dataset.e);});});
}
function openLinkExtModal(){
  const sel=window.getSelection(),st=sel&&sel.toString()?sel.toString():'';
  openModal('<div class="mh"><div class="mh-title">외부 링크 삽입</div><button class="btn btn-ghost btn-icon" id="m-close">✕</button></div>'+
    '<div class="mb"><div class="fg"><label>표시 텍스트</label><input type="text" id="lt" value="'+esc(st)+'" placeholder="바로가기"></div>'+
    '<div class="fg"><label>URL</label><input type="url" id="lu" placeholder="https://..."></div></div>'+
    '<div class="mf"><button class="btn" id="m-cancel">취소</button><button class="btn btn-primary" id="m-ok">삽입</button></div>');
  document.getElementById('m-close').addEventListener('click',closeModal);
  document.getElementById('m-cancel').addEventListener('click',closeModal);
  document.getElementById('lu').focus();
  document.getElementById('m-ok').addEventListener('click',function(){
    const t=(document.getElementById('lt').value.trim())||document.getElementById('lu').value;
    const u=(document.getElementById('lu').value.trim());
    if(!u){toast('URL을 입력하세요','err');return;}
    closeModal();insertAtCursor('<a href="'+esc(u)+'">'+esc(t)+'</a>');
  });
}
function openLinkFaqModal(){
  const sel=window.getSelection(),st=sel&&sel.toString()?sel.toString():'';
  const opts=S.rows.filter(r=>r.id!==S.ed.activeId).map(r=>'<option value="'+esc(r.id)+'">#'+esc(r.id)+' - '+esc((r.title||'').substring(0,50))+'</option>').join('');
  openModal('<div class="mh"><div class="mh-title">FAQ 링크 삽입</div><button class="btn btn-ghost btn-icon" id="m-close">✕</button></div>'+
    '<div class="mb"><div class="fg"><label>표시 텍스트</label><input type="text" id="ft" value="'+esc(st)+'"></div>'+
    '<div class="fg"><label>연결할 FAQ</label><select id="fs"><option value="">-- 선택 --</option>'+opts+'</select></div>'+
    '<div class="fg"><label>또는 ID 직접 입력</label><input type="number" id="fi" placeholder="99"></div></div>'+
    '<div class="mf"><button class="btn" id="m-cancel">취소</button><button class="btn btn-primary" id="m-ok">삽입</button></div>');
  document.getElementById('m-close').addEventListener('click',closeModal);
  document.getElementById('m-cancel').addEventListener('click',closeModal);
  document.getElementById('m-ok').addEventListener('click',function(){
    const t=document.getElementById('ft').value.trim();
    let id=document.getElementById('fi').value.trim()||document.getElementById('fs').value.trim();
    if(!id){toast('FAQ를 선택하거나 ID를 입력하세요','err');return;}
    if(!t){toast('표시 텍스트를 입력하세요','err');return;}
    closeModal();insertAtCursor('<a data-faq-id="'+id+'" href="#faq-'+id+'">'+esc(t)+'</a>');
  });
}
function openTableModal(){
  openModal('<div class="mh"><div class="mh-title">표 삽입</div><button class="btn btn-ghost btn-icon" id="m-close">✕</button></div>'+
    '<div class="mb"><div class="fg"><label>행 수</label><input type="number" id="tr" value="3" min="1" max="20"></div>'+
    '<div class="fg"><label>열 수</label><input type="number" id="tc" value="2" min="1" max="10"></div>'+
    '<div class="fg"><label><input type="checkbox" id="th" checked> 첫 행 헤더</label></div></div>'+
    '<div class="mf"><button class="btn" id="m-cancel">취소</button><button class="btn btn-primary" id="m-ok">삽입</button></div>');
  document.getElementById('m-close').addEventListener('click',closeModal);
  document.getElementById('m-cancel').addEventListener('click',closeModal);
  document.getElementById('m-ok').addEventListener('click',function(){
    const rows=+document.getElementById('tr').value||3,cols=+document.getElementById('tc').value||2,hd=document.getElementById('th').checked;
    let h='<table style="border-collapse:collapse;width:100%;margin:8px 0;">';
    for(let r=0;r<rows;r++){h+='<tr>';for(let c=0;c<cols;c++){const tag=r===0&&hd?'th':'td';const st=r===0&&hd?'border:1px solid #ddd;padding:6px 8px;background:#f5f5f5;font-weight:600;':'border:1px solid #ddd;padding:6px 8px;';h+='<'+tag+' style="'+st+'">내용</'+tag+'>';}h+='</tr>';}
    h+='</table>';closeModal();insertAtCursor(h);
  });
}

/* ══════════════════════════════════════════════
   이벤트 바인딩
══════════════════════════════════════════════ */
function initEvents(){
  // 탭
  document.querySelectorAll('.tab-btn').forEach(b=>{b.addEventListener('click',()=>switchTab(b.dataset.tab));});
  // 로그아웃
  document.getElementById('btn-signout').addEventListener('click',signOut);
  // 엑셀 업로드 (관리자)
  document.getElementById('btn-upload').addEventListener('click',()=>document.getElementById('file-input').click());
  document.getElementById('file-input').addEventListener('change',async function(e){
    if(!e.target.files||!e.target.files[0]) return;
    const file=e.target.files[0]; e.target.value='';
    setLoading(true,'엑셀 파싱 중...');
    try{
      const reader=new FileReader();
      reader.onload=async function(ev){
        const wb=XLSX.read(new Uint8Array(ev.target.result),{type:'array'});
        const lsn=wb.SheetNames.find(n=>n.toLowerCase()==='list');
        if(!lsn){toast('list 시트를 찾을 수 없습니다','err');setLoading(false);return;}
        const sheet=wb.Sheets[lsn];
        const rows=XLSX.utils.sheet_to_json(sheet,{defval:'',raw:false});
        // 헤더
        const hr=XLSX.utils.decode_range(sheet['!ref']);
        const headers=[];
        for(let C=hr.s.c;C<=hr.e.c;C++){const cell=sheet[XLSX.utils.encode_cell({r:hr.s.r,c:C})];if(cell&&cell.v)headers.push(String(cell.v));}
        const cols=headers.length?headers:Object.keys(rows[0]);
        const appRows=rows.map(r=>{const o={};cols.forEach(c=>{o[c]=(r[c]==null)?'':String(r[c]);});return o;});
        // 분류
        let mcs=[],cats=[];
        const mcsn=wb.SheetNames.find(n=>n.toLowerCase()==='maincategory');
        if(mcsn) XLSX.utils.sheet_to_json(wb.Sheets[mcsn],{defval:'',raw:false}).forEach(r=>{const v=String(r.value||r.id||''),l=String(r.label||r.name||r.value||'');if(v&&l&&l!=='-')mcs.push({value:v,label:l});});
        const csn=wb.SheetNames.find(n=>n.toLowerCase()==='category');
        if(csn) XLSX.utils.sheet_to_json(wb.Sheets[csn],{defval:'',raw:false}).forEach(r=>{const id=String(r.id||''),mc=String(r.mainCategory||''),nm=String(r.name||'');if(id&&nm&&nm!=='-')cats.push({id,mainCategory:mc,name:nm});});
        setLoading(true,'DB에 업로드 중...');
        await uploadFaqData(appRows,cols,mcs,cats,file.name);
        await loadData();
        toast('엑셀 업로드 완료 ('+appRows.length+'건)','suc');
      };
      reader.readAsArrayBuffer(file);
    }catch(e){toast('업로드 실패: '+e.message,'err');setLoading(false);}
  });
  // 엑셀 다운로드
  document.getElementById('btn-export').addEventListener('click',async function(){setLoading(true,'엑셀 생성 중...');try{await exportToExcel();}catch(e){toast('실패: '+e.message,'err');}finally{setLoading(false);}});
  // 담당자 저장 (관리자)
  document.getElementById('btn-save-assignees').addEventListener('click',async function(){
    setLoading(true,'담당자 지정 저장 중...');
    try{await updateAssignees(S.assigneeMap);toast('담당자 지정 저장됨','suc');}
    catch(e){toast('저장 실패: '+e.message,'err');}
    finally{setLoading(false);}
  });
  document.getElementById('btn-bulk-assign').addEventListener('click',function(){
    const name=(document.getElementById('bulk-assignee').value||'').trim();
    if(!name){toast('담당자 이름을 입력하세요','err');return;}
    let cnt=0;
    document.querySelectorAll('#dist-tbody .dist-table-row:not(.filtered-out)').forEach(row=>{
      const id=row.dataset.id; S.assigneeMap[id]=name;
      const inp=row.querySelector('.asgn-input'); if(inp){inp.value=name;inp.classList.add('has-val');}
      row.dataset.asgn=name; cnt++;
    });
    document.getElementById('bulk-assignee').value='';
    updateDistSummary();refreshAssigneeFilter();toast(cnt+'건에 "'+name+'" 일괄 지정','suc');
  });
  document.getElementById('bulk-assignee').addEventListener('keydown',function(e){if(e.key==='Enter')document.getElementById('btn-bulk-assign').click();});
  document.getElementById('dist-clear-all').addEventListener('click',function(){
    if(!confirm('모든 담당자 지정을 초기화할까요?')) return;
    S.assigneeMap={};
    document.querySelectorAll('#dist-tbody .asgn-input').forEach(inp=>{inp.value='';inp.classList.remove('has-val');});
    document.querySelectorAll('#dist-tbody .dist-table-row').forEach(row=>{row.dataset.asgn='';});
    S.dist.filterAssignee='';
    updateDistSummary();refreshAssigneeFilter();toast('초기화됨');
  });
  // editor 이벤트
  document.getElementById('ed-search').addEventListener('input',function(){S.ed.search=this.value;refreshEdList();});
  document.getElementById('ed-mc').addEventListener('change',function(){S.ed.filterMc=this.value;S.ed.filterCat='';refreshEdCatSelects();refreshEdList();});
  document.getElementById('ed-cat').addEventListener('change',function(){S.ed.filterCat=this.value;refreshEdList();});
  document.querySelectorAll('[data-ef]').forEach(c=>{c.addEventListener('click',function(){document.querySelectorAll('[data-ef]').forEach(x=>x.classList.remove('active'));this.classList.add('active');S.ed.filterType=this.dataset.ef;refreshEdList();});});
  document.getElementById('btn-revert').addEventListener('click',function(){
    if(!S.ed.activeId) return;
    const snap=S.ed.origSnap[S.ed.activeId]; if(!snap) return;
    const orig=JSON.parse(snap);
    const idx=S.rows.findIndex(r=>r.id===S.ed.activeId);
    if(idx>=0){S.rows[idx]=orig;S.ed.dirtyIds.delete(S.ed.activeId);selectItem(S.ed.activeId);toast('원본으로 되돌림');}
  });
  document.getElementById('btn-save-item').addEventListener('click',saveItemToDB);
  // 제목 input
  let tt;
  document.getElementById('ed-title').addEventListener('input',function(){
    const p=document.getElementById('ph-q');if(p)p.textContent=this.value;
    clearTimeout(tt);tt=setTimeout(()=>saveActive(true),400);
  });
  document.getElementById('ed-title').addEventListener('blur',()=>saveActive(true));
  // 에디터 body
  const edBody=document.getElementById('ed-body');
  ['mouseup','keyup','focus'].forEach(ev=>edBody.addEventListener(ev,saveRange));
  edBody.addEventListener('input',function(){
    if(!this._updating){saveRange();updateOutput();clearTimeout(window.__as);window.__as=setTimeout(()=>saveActive(true),600);}
  });
  edBody.addEventListener('paste',function(e){
    e.preventDefault();
    const text=(e.clipboardData||window.clipboardData).getData('text/plain');
    const h=text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\n/g,'<br>');
    insertAtCursor(h);
  });
  // 탭 전환 (visual ↔ source)
  document.querySelectorAll('.etab').forEach(t=>{
    t.addEventListener('click',function(){
      const tab=this.dataset.etab;
      document.querySelectorAll('.etab').forEach(x=>x.classList.remove('active'));this.classList.add('active');
      if(tab==='visual'){
        edBody._updating=true;edBody.innerHTML=importHtml(document.getElementById('ed-src').value);edBody._updating=false;
        document.getElementById('ed-visual').style.display='';document.getElementById('ed-source').style.display='none';updateOutput();
      } else {
        document.getElementById('ed-src').value=exportHtml(edBody.innerHTML);
        document.getElementById('ed-visual').style.display='none';document.getElementById('ed-source').style.display='';
      }
    });
  });
  document.getElementById('ed-src').addEventListener('input',function(){document.getElementById('ed-out').value=this.value;clearTimeout(window.__as);window.__as=setTimeout(()=>saveActive(true),600);});
  // 툴바
  document.querySelectorAll('.tb[data-cmd]').forEach(b=>{b.addEventListener('click',function(){document.getElementById('ed-body').focus();document.execCommand(b.dataset.cmd,false,null);updateOutput();});});
  const clrPop=document.getElementById('clr-pop');
  clrPop.innerHTML=COLOR_SWATCHES.map(c=>'<div class="cswatch" style="background:'+c+'" data-c="'+c+'"></div>').join('');
  document.getElementById('btn-color').addEventListener('click',function(e){e.stopPropagation();clrPop.classList.toggle('open');});
  document.addEventListener('click',()=>clrPop.classList.remove('open'));
  clrPop.querySelectorAll('.cswatch').forEach(s=>{s.addEventListener('click',function(){document.getElementById('ed-body').focus();document.execCommand('foreColor',false,this.dataset.c);clrPop.classList.remove('open');updateOutput();});});
  document.getElementById('btn-emoji').addEventListener('click',withSavedRange(openEmojiModal));
  document.getElementById('btn-link-ext').addEventListener('click',withSavedRange(openLinkExtModal));
  document.getElementById('btn-link-faq').addEventListener('click',withSavedRange(openLinkFaqModal));
  document.getElementById('btn-table').addEventListener('click',withSavedRange(openTableModal));
  document.getElementById('btn-divider').addEventListener('click',function(){saveRange();insertAtCursor('<br>○ 관련 질문을 확인해보세요!<br><br>');});
  // merge 관련 이벤트 제거됨 (취합 탭 삭제)

  // 담당자 지정 테이블 토글 (관리자 전용)
  document.getElementById('btn-toggle-table').addEventListener('click',function(){
    const panel=document.getElementById('admin-dist-panel');
    panel.style.display='flex';
    renderDistTable();
  });
  document.getElementById('btn-close-table').addEventListener('click',function(){
    document.getElementById('admin-dist-panel').style.display='none';
  });
  // 계정관리
  document.getElementById('btn-add-user').addEventListener('click',openAddUserModal);
  // 새 항목 (관리자)
  document.getElementById('btn-new-item').addEventListener('click',function(){
    if(!S.rows.length){toast('엑셀을 먼저 업로드하세요','err');return;}
    const maxId=S.rows.reduce((m,r)=>{const n=parseInt(r.id,10);return isNaN(n)?m:Math.max(m,n);},0);
    const newId=String(maxId+1);
    const newRow={id:newId,title:'(새 질문)',content:'',mainCategory:'',category:'',isUse:'1',regDate:todayStr(),modDate:todayStr(),regUser:currentProfile?currentProfile.name:'관리자',modUser:currentProfile?currentProfile.name:'관리자'};
    S.rows.unshift(newRow);
    S.ed.origSnap[newId]=JSON.stringify(Object.assign({},newRow,{title:'__NEW__'}));
    S.ed.dirtyIds.add(newId);
    switchTab('editor');refreshEdList();selectItem(newId);
    document.getElementById('ed-title').focus();document.getElementById('ed-title').select();
  });
  // 모달
  document.getElementById('modal-overlay').addEventListener('click',function(e){if(e.target.id==='modal-overlay')closeModal();});
  document.addEventListener('keydown',function(e){
    if((e.ctrlKey||e.metaKey)&&(e.key==='s'||e.key==='S')){e.preventDefault();saveItemToDB();}
    if(e.key==='Escape')closeModal();
  });
  // 모바일 뒤로가기
  const mBackBtn = document.getElementById('btn-mobile-back');
  if(mBackBtn) mBackBtn.addEventListener('click', function(){
    saveActive(true);
    showEdEmpty();
  });
  // 윈도우 리사이즈: 데스크탑으로 전환 시 슬라이드 클래스 제거
  window.addEventListener('resize', function(){
    if(!isMobile()){
      document.getElementById('sidebar').classList.remove('slide-out');
      document.getElementById('ed-main').classList.remove('slide-in');
      const bb=document.getElementById('mobile-back-bar'); if(bb) bb.style.display='none';
    }
  });
  // 시계
  setInterval(function(){const d=new Date(),h=document.getElementById('ph-time');if(h)h.textContent=d.getHours()+':'+(d.getMinutes()<10?'0':'')+d.getMinutes();},30000);
}

/* ══════════════════════════════════════════════
   담당자용 편집결과 저장 (JSON으로 내보내기)
══════════════════════════════════════════════ */
function exportEditResult(){
  saveActive(true);
  const edited=S.rows.filter(r=>S.ed.dirtyIds.has(r.id));
  if(!edited.length){toast('변경된 항목이 없습니다','err');return;}
  const result={
    assignee:currentProfile?currentProfile.name:'편집자',
    editedAt:todayStr(),
    editedRows:edited,
    ids:edited.map(r=>r.id)
  };
  const blob=new Blob([JSON.stringify(result,null,2)],{type:'application/json'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');
  a.href=url;a.download='FAQ편집결과_'+(currentProfile?currentProfile.name:'편집자')+'_'+todayStr()+'.json';
  document.body.appendChild(a);a.click();document.body.removeChild(a);URL.revokeObjectURL(url);
  toast('편집결과 파일 저장됨 ('+edited.length+'건)','suc');
}

/* ══════════════════════════════════════════════
   초기화
══════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', async function(){
  setLoading(true,'로그인 확인 중...');

  const ok = await initAuth();
  if(!ok) return;

  const admin = isAdmin();

  if(admin){
    // 관리자: 편집 탭 + 계정관리 탭 + 관리자 전용 기능 표시
    document.getElementById('tab-accounts').style.display='';
    document.getElementById('btn-upload').style.display='';
    document.getElementById('btn-new-item').style.display='';
    document.getElementById('btn-export').style.display='';
    document.getElementById('admin-assign-panel').style.display='';
    document.getElementById('admin-table-toggle').style.display='';
  } else {
    // 편집자: 편집 탭만, 관리자 기능 모두 숨김
    document.getElementById('tab-accounts').style.display='none';
    document.getElementById('btn-upload').style.display='none';
    document.getElementById('btn-new-item').style.display='none';
    document.getElementById('btn-export').style.display='none';
    document.getElementById('admin-assign-panel').style.display='none';
    document.getElementById('admin-table-toggle').style.display='none';
  }

  initEvents();
  await loadData();

  // 관리자: 전체 목록, 편집자: 본인 담당 자동 필터
  if(admin){
    switchTab('editor');
  } else {
    switchTab('editor');
    const myName = currentProfile.name;
    const hasMyItems = Object.values(S.assigneeMap).some(a=>a===myName);
    if(hasMyItems){
      S.ed.filterAssignee = myName;
      refreshEdAssigneeFilter();
      refreshEdList();
      toast(myName+'님 담당 항목 자동 필터 적용','suc');
    }
  }
});
