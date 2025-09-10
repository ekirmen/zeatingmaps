// Health check endpoint
export default function handler(req, res) {
  res.status(200).json({
    success: true,
    message: 'VeeEventos API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'production'
  });
}
