var path = require('path');
var webpack = require('webpack');
module.exports = {
  plugins: [
    new webpack.optimize.UglifyJsPlugin({
      compress: {
        warnings: false
      }, mangle: {
        except: ['super', 'exports', 'require']
      }
    }),
    new webpack.optimize.CommonsChunkPlugin({
      name: "commons",
      filename: 'common.js',
      minChunks: '2'
    })
  ],
  entry: {
    dispatcher: './lp_dispatcher.js',
    imgLazyLoader: './lp_lazyimg.js'
  },
  output: {
    path: path.join(process.cwd(), 'dist'),
    filename: "[name].js"
  },
  module: {
    loaders: [
      {
        test: /\.js$/,
        exclude: /(node_modules|bower_components)/,
        loader: 'babel', // 'babel-loader' is also a legal name to reference
        query: {
          presets: ['es2015']
        }
      }
    ]
  }
}