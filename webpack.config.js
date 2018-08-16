const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const SpriteLoaderPlugin = require('svg-sprite-loader/plugin');

const IS_PROD =
  process.argv.find(a => a.includes('mode=production')) !== undefined;

module.exports = {
  entry: './app.js',
  output: {
    path: path.resolve(__dirname, './dist/_static'),
    filename: '[name].[hash].js',
    publicPath: '/_static/',
  },
  devtool: IS_PROD ? 'source-map' : 'cheap-module-eval-source-map',
  devServer: { port: 9000, hot: true },
  optimization: {
    splitChunks: { chunks: 'all' },
  },

  module: {
    rules: [
      {
        test: /\.js$/,
        loader: 'babel-loader',
        options: { presets: ['env', 'stage-1', 'react'] },
      },
      {
        test: /\.svg$/,
        include: path.resolve('./icons'),
        use: [
          {
            loader: 'svg-sprite-loader',
            options: { spriteFilename: 'sprite.[hash].svg', esModule: false },
          },
          {
            loader: 'svgo-loader',
          },
        ],
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({ template: 'app.html' }),
    new SpriteLoaderPlugin(),
    new webpack.HotModuleReplacementPlugin(),
  ],
};
