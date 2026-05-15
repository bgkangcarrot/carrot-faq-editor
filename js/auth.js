/* auth.js - 인증 상태 관리 */

let currentUser = null;   // Supabase auth user
let currentProfile = null; // profiles 테이블 row

async function initAuth() {
  const { data: { session } } = await sb.auth.getSession();
  if (!session) {
    window.location.href = '/';
    return false;
  }
  currentUser = session.user;

  // 프로필(role 등) 로드
  const { data, error } = await sb.from('profiles')
    .select('*')
    .eq('id', currentUser.id)
    .single();

  if (error || !data) {
    console.error('프로필 로드 실패', error);
    await sb.auth.signOut();
    window.location.href = '/';
    return false;
  }
  currentProfile = data;

  // 상단 UI 업데이트
  const nameEl = document.getElementById('header-name');
  const roleEl = document.getElementById('header-role');
  if (nameEl) nameEl.textContent = currentProfile.name;
  if (roleEl) {
    roleEl.textContent = currentProfile.role === 'admin' ? '관리자' : '편집자';
    roleEl.className = 'role-badge ' + currentProfile.role;
  }

  return true;
}

function isAdmin() {
  return currentProfile && currentProfile.role === 'admin';
}

async function signOut() {
  await sb.auth.signOut();
  window.location.href = '/';
}

// 인증 상태 변경 감지 (다른 탭 로그아웃 등)
sb.auth.onAuthStateChange(function(event) {
  if (event === 'SIGNED_OUT') {
    window.location.href = '/';
  }
});
