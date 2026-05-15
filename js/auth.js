let currentUser = null;
let currentProfile = null;

async function initAuth() {
  // URL에 토큰이 있는 경우 처리 (이메일 링크 등)
  const hash = window.location.hash;
  if (hash && hash.includes('access_token')) {
    const { data, error } = await sb.auth.setSession({
      access_token: new URLSearchParams(hash.slice(1)).get('access_token'),
      refresh_token: new URLSearchParams(hash.slice(1)).get('refresh_token')
    });
  }

  // 세션 확인 - 최대 5초 대기
  let user = null;
  for (let i = 0; i < 10; i++) {
    const { data } = await sb.auth.getSession();
    if (data.session) {
      user = data.session.user;
      break;
    }
    await new Promise(r => setTimeout(r, 500));
  }

  if (!user) {
    window.location.href = '/';
    return false;
  }
  currentUser = user;

  // 프로필 로드
  const { data: profile } = await sb.from('profiles')
    .select('*')
    .eq('id', currentUser.id)
    .single();

  if (!profile) {
    // 프로필 없으면 직접 생성
    const { data: newProfile, error } = await sb.from('profiles')
      .insert({
        id: currentUser.id,
        email: currentUser.email,
        name: currentUser.email.split('@')[0],
        role: 'admin'
      })
      .select()
      .single();

    if (error || !newProfile) {
      await sb.auth.signOut();
      window.location.href = '/';
      return false;
    }
    currentProfile = newProfile;
  } else {
    currentProfile = profile;
  }

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

sb.auth.onAuthStateChange(function(event, session) {
  if (event === 'SIGNED_OUT') {
    window.location.href = '/';
  }
});
