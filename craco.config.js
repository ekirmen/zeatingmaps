const path = require('path');

module.exports = {
  webpack: {
    configure: (webpackConfig) => {

      
      // Excluir setupProxy.js del build (solo para desarrollo)
      webpackConfig.module.rules.push({
        test: /setupProxy\.js$/,
        use: 'ignore-loader'
      });

      // Configurar fallbacks para módulos de Node.js
      webpackConfig.resolve.fallback = {
        ...webpackConfig.resolve.fallback,
        "http": false,
        "https": false,
        "stream": false,
        "crypto": false,
        "fs": false,
        "path": false,
        "os": false,
        "url": false,
        "zlib": false,
        "querystring": false,
        "net": false,
        "tls": false,
        "child_process": false,
        "cluster": false,
        "dgram": false,
        "dns": false,
        "domain": false,
        "events": false,
        "http2": false,
        "https": false,
        "module": false,
        "process": false,
        "punycode": false,
        "readline": false,
        "repl": false,
        "string_decoder": false,
        "sys": false,
        "timers": false,
        "tty": false,
        "util": false,
        "v8": false,
        "vm": false,
        "worker_threads": false
      };
      
      // Optimizar para producción
      if (process.env.NODE_ENV === 'production') {
        // Deshabilitar source maps en producción si no se especifica GENERATE_SOURCEMAP
        if (process.env.GENERATE_SOURCEMAP !== 'true') {
          webpackConfig.devtool = false;
        }
        
        // Optimizar chunks más agresivamente
        webpackConfig.optimization = {
          ...webpackConfig.optimization,
          splitChunks: {
            chunks: 'all',
            maxInitialRequests: 10,
            maxAsyncRequests: 10,
            cacheGroups: {
              vendor: {
                test: /[\\/]node_modules[\\/]/,
                name: 'vendors',
                chunks: 'all',
                priority: 10,
              },
              antd: {
                test: /[\\/]node_modules[\\/]antd[\\/]/,
                name: 'antd',
                chunks: 'all',
                priority: 20,
              },
              react: {
                test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
                name: 'react',
                chunks: 'all',
                priority: 30,
              },
              common: {
                name: 'common',
                minChunks: 2,
                chunks: 'all',
                enforce: true,
                priority: 5,
              },
            },
          },
          // Optimizar minimización
          minimize: true,
          minimizer: [
            ...webpackConfig.optimization.minimizer,
          ],
        };
        
        // Optimizar resolución de módulos
        webpackConfig.resolve = {
          ...webpackConfig.resolve,
          alias: {
            ...webpackConfig.resolve.alias,
            '@': path.resolve(__dirname, 'src'),
          },
          extensions: ['.js', '.jsx', '.json'],
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
      '@babel/preset-env',
      '@babel/preset-react'
    ],
    plugins: []
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