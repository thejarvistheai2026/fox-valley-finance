import { createClient } from '@supabase/supabase-js'

// Read from environment or use hardcoded values
const supabaseUrl = 'https://your-project.supabase.co'
const supabaseKey = 'your-anon-key'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkTodos() {
  console.log('Checking todos table...')
  const { data, error } = await supabase
    .from('todos')
    .select('*')

  if (error) {
    console.error('Error:', error)
    return
  }

  console.log('Found', data.length, 'todos:')
  console.log(JSON.stringify(data, null, 2))
}

checkTodos()
