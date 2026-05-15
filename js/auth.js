let currentUser = null;
let currentProfile = null;

async function initAuth() {
  // 세션 확인 - getSession 대신 getUser로 확실하게 확인
  const { data: { user }, error } = await sb.auth.getUser();

  if (error || !user) {
    window.location.href = '/';
    return false;
  }
  currentUser = user;

  // 프로필 로드 재시도 로직 (DB 반영 지연 대응)
  let profile = null;
  for (let i = 0; i < 3; i++) {
    const { data, error: pErr } = await sb.from('profiles')
      .select('*')
      .eq('id', currentUser.id)
      .single();

    if (data) { profile = data; break; }
    if (i < 2) await new Promise(r => setTimeout(r, 1000)); // 1초 대기 후 재시도
  }

  if (!profile) {
    // 프로필이 없으면 직접 생성 (트리거 실패 대비)
    const { data: newProfile, error: cErr } = await sb.from('profiles')
      .insert({
        id: currentUser.id,
        email: currentUser.email,
        name: currentUser.email.split('@')[0],
        role: 'admin' // 첫 번째 계정이므로 admin
      })
      .select()
      .single();

    if (cErr || !newProfile) {
      console.error('프로필 생성 실패', cErr);
      await sb.auth.signOut();
      window.location.href = '/';
      return false;
    }
    profile = newProfile;
  }

  currentProfile = profile;

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
