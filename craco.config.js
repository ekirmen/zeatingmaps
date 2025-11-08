const path = require('path');

// Configuración para webpack-bundle-analyzer
const BundleAnalyzerPlugin = process.env.ANALYZE 
  ? require('webpack-bundle-analyzer').BundleAnalyzerPlugin 
  : null;

module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      // Agregar Bundle Analyzer si ANALYZE=true
      if (process.env.ANALYZE && BundleAnalyzerPlugin) {
        webpackConfig.plugins.push(
          new BundleAnalyzerPlugin({
            analyzerMode: 'static',
            openAnalyzer: true,
            reportFilename: 'bundle-report.html',
          })
        );
      }

      // Optimizar para producción
      if (process.env.NODE_ENV === 'production') {
        // Deshabilitar source maps en producción si no se especifica GENERATE_SOURCEMAP
        if (process.env.GENERATE_SOURCEMAP !== 'true') {
          webpackConfig.devtool = false;
        }
        
        // Optimizar chunks más agresivamente para mejor code splitting
        webpackConfig.optimization = {
          ...webpackConfig.optimization,
          splitChunks: {
            chunks: 'all',
            maxInitialRequests: 25, // Aumentado para mejor code splitting
            maxAsyncRequests: 30,
            minSize: 20000, // Chunks menores de 20KB se combinan
            maxSize: 244000, // Chunks mayores de 244KB se dividen
            cacheGroups: {
              // React y React DOM (crítico, cargar primero)
              react: {
                test: /[\\/]node_modules[\\/](react|react-dom|react-router|react-router-dom)[\\/]/,
                name: 'react-vendor',
                chunks: 'all',
                priority: 40,
                reuseExistingChunk: true,
              },
              // Ant Design (gran librería, separar)
              antd: {
                test: /[\\/]node_modules[\\/]antd[\\/]/,
                name: 'antd',
                chunks: 'all',
                priority: 30,
                reuseExistingChunk: true,
              },
              // Konva y React Konva (mapas de asientos)
              konva: {
                test: /[\\/]node_modules[\\/](konva|react-konva)[\\/]/,
                name: 'konva',
                chunks: 'async', // Solo cargar cuando se necesite
                priority: 25,
                reuseExistingChunk: true,
              },
              // Supabase
              supabase: {
                test: /[\\/]node_modules[\\/]@supabase[\\/]/,
                name: 'supabase',
                chunks: 'all',
                priority: 20,
                reuseExistingChunk: true,
              },
              // Otros vendors
              vendor: {
                test: /[\\/]node_modules[\\/]/,
                name: 'vendors',
                chunks: 'all',
                priority: 10,
                reuseExistingChunk: true,
                minChunks: 2,
              },
              // Código común entre chunks
              common: {
                name: 'common',
                minChunks: 2,
                chunks: 'all',
                enforce: true,
                priority: 5,
                reuseExistingChunk: true,
              },
            },
          },
          // Optimizar minimización
          minimize: true,
          minimizer: [
            ...webpackConfig.optimization.minimizer,
          ],
          // Runtime chunk separado para mejor caching
          runtimeChunk: {
            name: 'runtime',
          },
          // Module IDs estables para mejor caching
          moduleIds: 'deterministic',
          chunkIds: 'deterministic',
        };
        
        // Optimizar resolución de módulos
        webpackConfig.resolve = {
          ...webpackConfig.resolve,
          alias: {
            ...webpackConfig.resolve.alias,
            '@': path.resolve(__dirname, 'src'),
          },
          extensions: ['.js', '.jsx', '.json'],
          // Tree shaking: asegurar que solo se importen exports usados
          mainFields: ['browser', 'module', 'main'],
        };

        // Optimizar tree shaking
        webpackConfig.optimization = {
          ...webpackConfig.optimization,
          usedExports: true, // Habilitar tree shaking
          sideEffects: false, // Asumir que no hay side effects (excepto en archivos específicos)
        };
        
        // Optimizar cache
        webpackConfig.cache = {
          type: 'filesystem',
          buildDependencies: {
            config: [__filename],
          },
        };
      }
      
      return webpackConfig;
    },
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  babel: {
    presets: [
      [
        '@babel/preset-env',
        {
          targets: {
            node: 'current',
          },
          useBuiltIns: 'usage',
          corejs: 3,
        },
      ],
    ],
    plugins: [
      // Optimizar imports
      ['import', { libraryName: 'antd', style: false }],
    ],
  },
  // Optimizar PostCSS
  style: {
    postcss: {
      plugins: [
        require('autoprefixer'),
        require('tailwindcss'),
      ],
    },
  },
}; 