module.exports = {
  webpack: {
    configure: (config, { env }) => {
      if (env === 'production') {
        // Sin sourcemaps
        config.devtool = false;
        
        // Configuración SIMPLE de splitChunks
        config.optimization.splitChunks = {
          chunks: 'all',
          minSize: 100000, // 100KB mínimo
          cacheGroups: {
            // Solo 3 grupos principales
            react: {
              test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
              name: 'react',
              chunks: 'all',
              priority: 100,
            },
            antd: {
              test: /[\\/]node_modules[\\/](antd|@ant-design)[\\/]/,
              name: 'antd',
              chunks: 'all',
              priority: 90,
            },
            vendors: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              chunks: 'all',
              priority: 10,
            },
          },
        };
      }
      return config;
    },
  },
};