const path = require("path");
const BundleAnalyzerPlugin = require("webpack-bundle-analyzer").BundleAnalyzerPlugin;
const CompressionPlugin = require("compression-webpack-plugin");

module.exports = {
  webpack: {
    configure: (webpackConfig, { env, paths }) => {
      if (env === "production") {
        // ============================================
        // 1. ANALIZADOR DE BUNDLES
        // ============================================
        if (process.env.ANALYZE) {
          webpackConfig.plugins.push(
            new BundleAnalyzerPlugin({
              analyzerMode: "static",
              reportFilename: "bundle-report.html",
              openAnalyzer: false,
              generateStatsFile: true,
              statsOptions: {
                children: false,
                chunks: false,
                modules: true,
                chunkModules: false,
              },
              logLevel: 'error'
            })
          );
        }

        // ============================================
        // 2. COMPRESIÓN GZIP & BROTLI
        // ============================================
        // Gzip compression
        webpackConfig.plugins.push(
          new CompressionPlugin({
            filename: "[path][base].gz",
            algorithm: "gzip",
            test: /\.(js|css|html|svg|json)$/,
            threshold: 10240,
            minRatio: 0.8,
            deleteOriginalAssets: false,
          })
        );
        
        // Brotli compression
        webpackConfig.plugins.push(
          new CompressionPlugin({
            filename: "[path][base].br",
            algorithm: "brotliCompress",
            test: /\.(js|css|html|svg|json)$/,
            compressionOptions: { level: 11 },
            threshold: 10240,
            minRatio: 0.8,
          })
        );

        // ============================================
        // 3. OPTIMIZACIÓN DE COMPRESIÓN
        // ============================================
        webpackConfig.optimization = {
          ...webpackConfig.optimization,
          minimize: true,
          minimizer: webpackConfig.optimization.minimizer.map((plugin) => {
            if (plugin.constructor.name === "TerserPlugin") {
              plugin.options.terserOptions = {
                parse: { ecma: 8 },
                compress: {
                  ecma: 5,
                  warnings: false,
                  comparisons: false,
                  inline: 2,
                  drop_console: false, // IMPORTANTE: Cambia a FALSE temporalmente
                  drop_debugger: true,
                  pure_funcs: [], // Vacío temporalmente
                  passes: 2, // Reduce a 2
                },
                mangle: { safari10: true },
                output: {
                  ecma: 5,
                  comments: false,
                  ascii_only: true,
                },
              };
            }
            
            if (plugin.constructor.name === "CssMinimizerPlugin") {
              plugin.options.minimizerOptions = {
                preset: [
                  "default",
                  {
                    discardComments: { removeAll: true },
                    cssDeclarationSorter: true,
                    normalizeWhitespace: true,
                  },
                ],
              };
            }
            
            return plugin;
          }),

          // ============================================
          // 4. SPLIT CHUNKS - CONFIGURACIÓN SEGURA
          // ============================================
          splitChunks: {
            chunks: "all",
            minSize: 30000,           // 30KB mínimo (reduce chunks pequeños)
            maxSize: 250000,          // 250KB máximo
            minChunks: 1,
            maxAsyncRequests: 10,     // Menos chunks paralelos
            maxInitialRequests: 6,    // Menos chunks iniciales
            automaticNameDelimiter: "~",
            enforceSizeThreshold: 250000,
            cacheGroups: {
              // ============== CORE - SOLO ESTOS 3 PARA PRUEBA ==============
              reactVendor: {
                test: /[\\/]node_modules[\\/](react|react-dom|scheduler|react-is)[\\/]/,
                name: "react-vendor",
                chunks: "all", // Cambia de "initial" a "all"
                priority: 100,
                enforce: true,
                reuseExistingChunk: true,
              },
              
              // VENDORS GENERAL - MANTENER SIMPLE
              vendors: {
                test: /[\\/]node_modules[\\/]/,
                name: "vendors",
                chunks: "all",
                priority: 10,
                minChunks: 2,
                reuseExistingChunk: true,
              },
              
              // APPLICATION CODE
              commons: {
                test: /[\\/]src[\\/]/,
                name: "commons",
                chunks: "all",
                priority: 5,
                minChunks: 2,
              },
              
              // COMENTA TEMPORALMENTE LOS DEMÁS GRUPOS ESPECÍFICOS
              /*
              antd: {
                test: /[\\/]node_modules[\\/]antd[\\/]/,
                name: "antd",
                chunks: "all",
                priority: 90,
                enforce: true,
              },
              
              konva: {
                test: /[\\/]node_modules[\\/](konva|react-konva)[\\/]/,
                name: "konva",
                chunks: "async",
                priority: 80,
                enforce: true,
              },
              
              reactRouter: {
                test: /[\\/]node_modules[\\/](react-router|react-router-dom)[\\/]/,
                name: "react-router",
                chunks: "all",
                priority: 85,
                enforce: true,
              },
              
              dndKit: {
                test: /[\\/]node_modules[\\/]@dnd-kit[\\/]/,
                name: "dnd-kit",
                chunks: "async",
                priority: 75,
                enforce: true,
              },
              
              lodash: {
                test: /[\\/]node_modules[\\/]lodash[\\/]/,
                name: "lodash",
                chunks: "async",
                priority: 70,
                enforce: true,
              },
              
              axios: {
                test: /[\\/]node_modules[\\/]axios[\\/]/,
                name: "axios",
                chunks: "initial",
                priority: 65,
                enforce: true,
              },
              */
            },
          },

          // ============================================
          // 5. RUNTIME & CACHING
          // ============================================
          runtimeChunk: {
            name: "runtime",
          },
          
          moduleIds: "deterministic",
          chunkIds: "deterministic",
          usedExports: true,
          sideEffects: true,
        };

        // ============================================
        // 6. EXCLUIR SOURCE MAPS
        // ============================================
        webpackConfig.devtool = false;
        
        // Remover source map plugins
        webpackConfig.plugins = webpackConfig.plugins.filter(
          (plugin) =>
            !(
              plugin.constructor.name === "SourceMapDevToolPlugin" ||
              plugin.constructor.name === "EvalSourceMapDevToolPlugin"
            )
        );
        
        // ============================================
        // 7. PERFOMANCE CONFIG (OPCIONAL)
        // ============================================
        webpackConfig.performance = {
          hints: false, // Desactivar warnings temporalmente
          maxEntrypointSize: 512000,
          maxAssetSize: 512000,
        };
      }

      return webpackConfig;
    },
  },
};