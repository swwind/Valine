const webpack = require('webpack');
const path = require('path');

var ROOT_PATH = path.resolve(__dirname);
var APP_PATH = path.resolve(ROOT_PATH, 'src');
var BUILD_PATH = path.resolve(ROOT_PATH, 'dist');

var plugins = [];

module.exports = env => {
  var dev = env && env.dev || false;
  return {
    entry: {
      'valine-ex': ['./src/valine-ex.scss', './src/valine-ex.js']
    },
    output: {
      path: BUILD_PATH,
      filename: '[name].min.js',
      library: '[name]',
      libraryTarget: 'umd',
      umdNamedDefine: true
    },

    module: {
      rules: [{
        test: /\.jsx?$/,
        loader: 'babel-loader',
        include: [APP_PATH],
        exclude: /node_modules/,
        query: {
          presets: ['es2015', 'stage-0']
        }
      }, {
        test: /\.scss$/,
        use: [
          'style-loader',
          'css-loader',
          'postcss-loader',
          'sass-loader'
        ],
        include: [APP_PATH]
      }, {
        test: /\.css$/,
        use: [
          'style-loader',
          'css-loader',
          'postcss-loader'
        ]
      }]
    },

    mode: 'production',
    optimization: {
      minimize: true
    }
  }
};