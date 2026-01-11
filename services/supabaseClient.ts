
import { createClient } from '@supabase/supabase-js';

const PROJECT_URL = 'https://kpdzfdmadtygimfkyyqj.supabase.co';
const PUBLIC_API_KEY = 'sb_publishable_mkYNm_T12It0mZiAvEkIxw_QQmrZKxx';

export const supabase = createClient(PROJECT_URL, PUBLIC_API_KEY);
