import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co'
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkEstimates() {
  const { data, error } = await supabase
    .from('estimates')
    .select('id, display_id, title, estimated_total, hst_amount, status')
    .ilike('title', '%Initial Consultation%')

  if (error) {
    console.error('Error:', error)
    return
  }

  console.log('Estimates found:')
  console.log(JSON.stringify(data, null, 2))
}

checkEstimates()
