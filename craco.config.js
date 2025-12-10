const path = require("path");
const BundleAnalyzerPlugin = require("webpack-bundle-analyzer").BundleAnalyzerPlugin;
const CompressionPlugin = require("compression-webpack-plugin");

module.exports = {
  webpack: {
    configure: (webpackConfig, { env, paths }) => {
      if (env === "production") {
        // ============================================
        // 1. ANALIZADOR DE BUNDLES (TEMPORAL)
        // ============================================
        if (process.env.ANALYZE) {
          webpackConfig.plugins.push(
            new BundleAnalyzerPlugin({
              analyzerMode: "static",
              reportFilename: "bundle-report.html",
              openAnalyzer: false,
              generateStatsFile: true, // IMPORTANTE: generar stats.json
              statsOptions: {
                // Ignorar errores de chunks faltantes
                children: false,
                chunks: false,
                modules: true, // Esto es lo que más nos importa
                chunkModules: false,
              },
              // Opcional: desactivar la verificación de existencia
              logLevel: 'error' // Solo mostrar errores críticos
            })
          );
        }

        // ============================================
        // 2. OPTIMIZACIÓN DE COMPRESIÓN
        // ============================================
        webpackConfig.optimization = {
          ...webpackConfig.optimization,
          minimize: true,
          minimizer: webpackConfig.optimization.minimizer.map((plugin) => {
            if (plugin.constructor.name === "TerserPlugin") {
              plugin.options.terserOptions = {
                parse: {
                  ecma: 8,
                },
                compress: {
                  ecma: 5,
                  warnings: false,
                  comparisons: false,
                  inline: 2,
                  drop_console: true,
                  drop_debugger: true,
                  pure_funcs: [
                    "console.log",
                    "console.debug",
                    "console.info",
                    "console.warn",
                  ],
                  passes: 3, // Aumentado a 3
                },
                mangle: {
                  safari10: true,
                },
                output: {
                  ecma: 5,
                  comments: false,
                  ascii_only: true,
                },
              };
            }
            
            // Optimizar CSS también (si usas CssMinimizerPlugin)
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
          // 3. SPLIT CHUNKS MEJORADO - ESTRATEGIA AGRESIVA
          // ============================================
          splitChunks: {
            chunks: "all",
            minSize: 20000, // REDUCIDO: 10KB mínimo
            maxSize: 200000, // REDUCIDO: 250KB máximo por chunk
            minChunks: 1,
            maxAsyncRequests: 15, // Aumentado
            maxInitialRequests: 10, // Aumentado
            enforceSizeThreshold: 200000,
            automaticNameDelimiter: "~",
            cacheGroups: {
              // ============== LIBRERÍAS PESADAS ==============
              
              // REACT - Mantener pequeño
              reactCore: {
                test: /[\\/]node_modules[\\/](react|react-dom|scheduler|react-is)[\\/]/,
                name: "react-core",
                chunks: "initial",
                priority: 400,
                enforce: true,
              },
              
              // REACT ROUTER - Separado
              reactRouter: {
                test: /[\\/]node_modules[\\/](react-router|react-router-dom|history)[\\/]/,
                name: "react-router",
                chunks: "all",
                priority: 390,
                enforce: true,
              },
              
              // ANT DESIGN - DESAGRUPADO (ESTO ES CLAVE)
              antd: {
                test: /[\\/]node_modules[\\/]antd[\\/]/,
                name: "antd",
                chunks: "all",
                priority: 300,
                enforce: true,
                maxSize: 150000, // Limitar a 150KB máximo
              },
              
              // KONVA - Separado
              konva: {
                test: /[\\/]node_modules[\\/](konva|react-konva)[\\/]/,
                name: "konva",
                chunks: "all", // Cambia de 'async' a 'all'
                priority: 280,
                enforce: true,
                reuseExistingChunk: true, // IMPORTANTE
                maxSize: 200000, // Limitar a 200KB
              },
              
              // DND KIT - Separado
              dndKit: {
                test: /[\\/]node_modules[\\/](@dnd-kit)[\\/]/,
                name: "dnd-kit",
                chunks: "async", // Cargar solo cuando se use
                priority: 270,
                enforce: true,
              },
              
              // ============== UTILIDADES COMUNES ==============
              lodash: {
                test: /[\\/]node_modules[\\/](lodash)[\\/]/,
                name: "lodash",
                chunks: "async", // Cargar cuando se necesite
                priority: 250,
                enforce: true,
              },
              
              axios: {
                test: /[\\/]node_modules[\\/](axios)[\\/]/,
                name: "axios",
                chunks: "initial",
                priority: 230,
                enforce: true,
              },
              
              // ============== VENDORS GENERALES PEQUEÑOS ==============
              vendors: {
                test: /[\\/]node_modules[\\/]/,
                name: "vendors",
                chunks: "all",
                priority: 10,
                minChunks: 2,
                reuseExistingChunk: true,
                maxSize: 100000, // Limitar a 100KB
              },
              
              // ============== CHUNKS DE APLICACIÓN ==============
              commons: {
                test: /[\\/]src[\\/]/,
                name: "commons",
                chunks: "all",
                priority: 5,
                minChunks: 2,
                minSize: 10000,
              },
            },
          },

          // ============================================
          // 4. RUNTIME CHUNK
          // ============================================
          runtimeChunk: {
            name: (entrypoint) => `runtime-${entrypoint.name}`,
          },

          // ============================================
          // 5. TREE SHAKING AVANZADO
          // ============================================
          usedExports: true,
          sideEffects: true,
          providedExports: true,
          concatenateModules: true,
          moduleIds: "deterministic",
          chunkIds: "deterministic",
        };

       // ============================================
// 6. PLUGINS ADICIONALES (TEMPORALMENTE COMENTADOS)
// ============================================

    if (env === "production") {
      const CompressionPlugin = require("compression-webpack-plugin");
      
      // Gzip compression
      webpackConfig.plugins.push(
        new CompressionPlugin({
          filename: "[path][base].gz",
          algorithm: "gzip",
          test: /\.(js|css|html|svg|json)$/,
          threshold: 10240, // Solo comprimir archivos > 10KB
          minRatio: 0.8,
          deleteOriginalAssets: false, // NO eliminar originales
        })
      );
      
      // Brotli compression (opcional, mejor que gzip)
      webpackConfig.plugins.push(
        new CompressionPlugin({
          filename: "[path][base].br",
          algorithm: "brotliCompress",
          test: /\.(js|css|html|svg|json)$/,
          compressionOptions: {
            level: 11,
          },
          threshold: 10240,
          minRatio: 0.8,
        })
      );
    }
        // ============================================
        // 7. EXCLUIR SOURCE MAPS DE PRODUCCIÓN
        // ============================================
        webpackConfig.devtool = false;
        
        // Asegurar que no se generen source maps
        webpackConfig.plugins = webpackConfig.plugins.filter(
          (plugin) =>
            !(
              plugin.constructor.name === "SourceMapDevToolPlugin" ||
              plugin.constructor.name === "EvalSourceMapDevToolPlugin"
            )
        );
      }

      return webpackConfig;
    },
  },
};