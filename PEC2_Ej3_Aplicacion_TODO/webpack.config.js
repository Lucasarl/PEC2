const HtmlWebpackPlugin = require("html-webpack-plugin");
const path = require("path");

const basePath = __dirname;

module.exports = {
  mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
  
  // Entry point for our TypeScript application
  entry: "./src/app.ts",
  
  // Output configuration for bundle
  output: {
    filename: "[name].bundle.js",
    path: path.resolve(basePath, "dist"),
    clean: true // Clean the output directory before emit
  },
  
  // Source maps for debugging
  devtool: process.env.NODE_ENV === 'production' ? 'source-map' : 'inline-source-map',
  
  // Development server configuration
  devServer: {
    static: {
      directory: path.join(basePath, 'dist'),
    },
    compress: true,
    port: 3000,
    open: true,
    hot: true,
    watchFiles: ['src/**/*', 'index.html', 'style.css']
  },
  
  // Module resolution
  resolve: {
    extensions: ['.ts', '.js', '.json'],
    alias: {
      '@models': path.resolve(basePath, 'src/models'),
      '@services': path.resolve(basePath, 'src/services'),
      '@views': path.resolve(basePath, 'src/views'),
      '@controllers': path.resolve(basePath, 'src/controllers')
    }
  },
  
  // Module rules for different file types
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/
      },
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader']
      },
      {
        test: /\.(png|jpg|jpeg|gif|svg)$/i,
        type: 'asset/resource',
        generator: {
          filename: 'assets/images/[name].[hash][ext]'
        }
      }
    ]
  },
  
  // Plugins
  plugins: [
    new HtmlWebpackPlugin({
      template: "./index.webpack.html",
      filename: "index.html",
      inject: 'body',
      scriptLoading: 'defer',
      minify: process.env.NODE_ENV === 'production' ? {
        removeComments: true,
        collapseWhitespace: true,
        removeRedundantAttributes: true,
        useShortDoctype: true,
        removeEmptyAttributes: true,
        removeStyleLinkTypeAttributes: true,
        keepClosingSlash: true,
        minifyJS: true,
        minifyCSS: true,
        minifyURLs: true
      } : false
    })
  ],
  
  // Optimization
  optimization: {
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendor',
          chunks: 'all',
          filename: 'vendor.bundle.js'
        },
        default: {
          minChunks: 2,
          priority: -20,
          reuseExistingChunk: true,
          filename: 'common.bundle.js'
        }
      }
    }
  },
  
  // Watch mode settings
  watchOptions: {
    ignored: /node_modules/,
    poll: 1000
  }
};