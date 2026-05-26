import { createClient } from '@supabase/supabase-js'

// Supabase credentials (hardcoded — public anon key is safe)
const url = 'https://zssasbllfjeaailfteep.supabase.co'
const key = 'sb_publishable_RmkUSCdjd71U6_gYlkb7Nw_Of8u4QLx'

// TEMPORARY: Disable Supabase for testing (use mockData instead)
// Will re-enable after adding orgId to existing data
export const supabase = null  // Disabled for testing
