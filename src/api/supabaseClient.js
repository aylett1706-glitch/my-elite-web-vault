import { createClient } from '@supabase/supabase-js'

// Your custom Supabase backend (no base44!)
const SUPABASE_URL = 'https://mboczsycpryxmteafnoi.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_BO2Y-M_pSdC_BUyxz6yYzw_Df6jEvEQ'

// Initialize free, unlimited backend client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

export default supabase
