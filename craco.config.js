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
            maxInitialRequests: 20,
            maxAsyncRequests: 30,
            minSize: 20000,
            maxSize: 200000,
            cacheGroups: {
              react: { test: /[\\/]node_modules[\\/](react|react-dom|react-router|react-router-dom)[\\/]/, name: 'react-vendor', chunks: 'all', priority: 40, reuseExistingChunk: true, enforce: true },
              antd: { test: /[\\/]node_modules[\\/]antd[\\/]/, name: 'antd-vendor', chunks: 'all', priority: 35, reuseExistingChunk: true, enforce: true },
              supabase: { test: /[\\/]node_modules[\\/]@supabase[\\/]/, name: 'supabase-vendor', chunks: 'all', priority: 30, reuseExistingChunk: true, enforce: true },
              vendors: { test: /[\\/]node_modules[\\/]/, name: 'vendors', chunks: 'all', priority: 10, reuseExistingChunk: true, minChunks: 2 },
              common: { name: 'common', minChunks: 2, chunks: 'all', priority: 5, reuseExistingChunk: true, enforce: true },
            },
          },
          minimize: true,
          runtimeChunk: { name: 'runtime' },
          moduleIds: 'deterministic',
          chunkIds: 'deterministic',
          usedExports: true,
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
