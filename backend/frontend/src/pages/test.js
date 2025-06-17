import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

const TestPage = () => {
  const [data, setData] = useState([])
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchData = async () => {
      const { data, error } = await supabase
        .from('tu_tabla') // ← Sustituye con tu tabla real
        .select('*')

      if (error) setError(error)
      else setData(data)
    }

    fetchData()
  }, [])

  if (error) return <div>Error: {error.message}</div>
  return (
    <div>
      <h1>Datos desde Supabase</h1>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  )
}

export default TestPage
