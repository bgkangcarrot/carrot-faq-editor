// ★ 아래 두 값을 Supabase 대시보드 Settings > API 에서 복사해서 교체하세요
const SUPABASE_URL = 'https://zpvkqgjttqvasriwcttu.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_QcfzbwPgrFh-RTYyrub8Wg_iEWe2t9T';

const { createClient } = supabase;
const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
