export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const envVars = {
    SUPABASE_URL: process.env.SUPABASE_URL ? 'defined' : 'undefined',
    REACT_APP_SUPABASE_URL: process.env.REACT_APP_SUPABASE_URL ? 'defined' : 'undefined',
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'defined' : 'undefined',
    REACT_APP_SUPABASE_SERVICE_ROLE_KEY: process.env.REACT_APP_SUPABASE_SERVICE_ROLE_KEY ? 'defined' : 'undefined',
    NODE_ENV: process.env.NODE_ENV,
  };

  return res.status(200).json({
    message: 'Environment variables check',
    envVars,
    timestamp: new Date().toISOString()
  });
} 