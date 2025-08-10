// Configuración de proxy para desarrollo
// Este archivo permite que las rutas /api/* funcionen en desarrollo

const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  // Proxy para rutas API
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://localhost:3000',
      changeOrigin: true,
      pathRewrite: {
        '^/api': '/api', // Mantener la ruta /api
      },
      // Log de las peticiones para debugging
      onProxyReq: (proxyReq, req, res) => {
        console.log(`[PROXY] ${req.method} ${req.url} -> ${proxyReq.path}`);
      },
      onProxyRes: (proxyRes, req, res) => {
        console.log(`[PROXY] Respuesta: ${proxyRes.statusCode} para ${req.url}`);
      },
      onError: (err, req, res) => {
        console.error(`[PROXY] Error: ${err.message} para ${req.url}`);
        // Si hay un error, devolver una respuesta de fallback
        res.writeHead(500, {
          'Content-Type': 'application/json',
        });
        res.end(JSON.stringify({
          success: false,
          error: 'Error del proxy: ' + err.message
        }));
      }
    })
  );
};
