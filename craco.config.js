const path = require('path');
const BundleAnalyzerPlugin = process.env.ANALYZE
  ? require('webpack-bundle-analyzer').BundleAnalyzerPlugin
  : null;

module.exports = {
  webpack: {
    configure: (config) => {

      if (process.env.ANALYZE && BundleAnalyzerPlugin) {
        config.plugins.push(
          new BundleAnalyzerPlugin({
            analyzerMode: 'static',
            openAnalyzer: true,
            reportFilename: 'bundle-report.html',
          })
        );
      }

      if (process.env.NODE_ENV === 'production') {
        if (process.env.GENERATE_SOURCEMAP !== 'true') config.devtool = false;

        config.optimization = {
          ...config.optimization,
          splitChunks: {
            chunks: 'all',
            maxInitialRequests: 25,
            maxAsyncRequests: 30,
            minSize: 20000,
            maxSize: 80000, // Reducido a 80KB para forzar más divisiones y reducir código sin usar
            cacheGroups: {
              // React core - separado por ser crítico
              react: { 
                test: /[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/, 
                name: 'react-vendor', 
                chunks: 'all', 
                priority: 50, 
                reuseExistingChunk: true, 
                enforce: true 
              },
              // React Router - separado
              reactRouter: { 
                test: /[\\/]node_modules[\\/](react-router|react-router-dom|@remix-run)[\\/]/, 
                name: 'react-router-vendor', 
                chunks: 'all', 
                priority: 45, 
                reuseExistingChunk: true, 
                enforce: true 
              },
              // Ant Design - muy grande, separado
              antd: { 
                test: /[\\/]node_modules[\\/]antd[\\/]/, 
                name: 'antd-vendor', 
                chunks: 'all', 
                priority: 40, 
                reuseExistingChunk: true, 
                enforce: true 
              },
              // Konva - librería de canvas muy grande
              konva: { 
                test: /[\\/]node_modules[\\/](konva|react-konva)[\\/]/, 
                name: 'konva-vendor', 
                chunks: 'all', 
                priority: 38, 
                reuseExistingChunk: true, 
                enforce: true 
              },
              // Fabric - librería de canvas
              fabric: { 
                test: /[\\/]node_modules[\\/]fabric[\\/]/, 
                name: 'fabric-vendor', 
                chunks: 'all', 
                priority: 37, 
                reuseExistingChunk: true, 
                enforce: true 
              },
              // Supabase
              supabase: { 
                test: /[\\/]node_modules[\\/]@supabase[\\/]/, 
                name: 'supabase-vendor', 
                chunks: 'all', 
                priority: 35, 
                reuseExistingChunk: true, 
                enforce: true 
              },
              // Zustand - state management
              zustand: { 
                test: /[\\/]node_modules[\\/]zustand[\\/]/, 
                name: 'zustand-vendor', 
                chunks: 'all', 
                priority: 33, 
                reuseExistingChunk: true, 
                enforce: true 
              },
              // Framer Motion - animaciones
              framerMotion: { 
                test: /[\\/]node_modules[\\/]framer-motion[\\/]/, 
                name: 'framer-motion-vendor', 
                chunks: 'all', 
                priority: 32, 
                reuseExistingChunk: true, 
                enforce: true 
              },
              // Otros vendors grandes
              largeVendors: { 
                test: /[\\/]node_modules[\\/](axios|moment|pdf-lib|qrcode|jszip|leaflet|recharts)[\\/]/, 
                name: 'large-vendors', 
                chunks: 'all', 
                priority: 20, 
                reuseExistingChunk: true, 
                enforce: true 
              },
              // Resto de vendors
              vendors: { 
                test: /[\\/]node_modules[\\/]/, 
                name: 'vendors', 
                chunks: 'all', 
                priority: 10, 
                reuseExistingChunk: true, 
                minChunks: 2 
              },
              // Código común de la app
              common: { 
                name: 'common', 
                minChunks: 2, 
                chunks: 'all', 
                priority: 5, 
                reuseExistingChunk: true, 
                enforce: true 
              },
            },
          },
          minimize: true,
          runtimeChunk: { name: 'runtime' },
          moduleIds: 'deterministic',
          chunkIds: 'deterministic',
          usedExports: true,
          sideEffects: false, // Mejor tree-shaking
          providedExports: true, // Identificar exports usados
          mangleExports: true, // Manglar exports no usados
          innerGraph: true, // Análisis más profundo de dependencias
          removeAvailableModules: true, // Eliminar módulos ya incluidos
          removeEmptyChunks: true, // Eliminar chunks vacíos
        };

        config.resolve = {
          ...config.resolve,
          alias: { ...config.resolve.alias, '@': path.resolve(__dirname, 'src') },
          extensions: ['.js', '.jsx', '.json'],
          mainFields: ['browser', 'module', 'main'],
        };

        config.cache = { type: 'filesystem', buildDependencies: { config: [__filename] } };
      }

      return config;
    },
  },
  babel: {
    presets: [['@babel/preset-env', { targets: { node: 'current' }, useBuiltIns: 'usage', corejs: 3 }]],
    plugins: [['import', { libraryName: 'antd', style: false, libraryDirectory: 'es' }]],
  },
};
