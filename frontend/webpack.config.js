const HtmlWebpackPlugin = require('html-webpack-plugin');
const { ModuleFederationPlugin } = require('webpack').container;
const path = require('path');

module.exports = {
  entry: './src/index.js',
  mode: 'development',
  devServer: {
    port: 3000,
    historyApiFallback: true,
    hot: true,
  },
  output: {
    publicPath: 'auto',
    path: path.resolve(__dirname, 'dist'),
    clean: true,
  },
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-react'],
          },
        },
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
  plugins: [
    // Module Federation for Micro Frontend Architecture
    new ModuleFederationPlugin({
      name: 'shell',
      filename: 'remoteEntry.js',
      remotes: {
        dashboard: 'dashboard@http://quizplatform-dashboard-mfe-1:3001/remoteEntry.js',
        quiz: 'quiz@http://quizplatform-quiz-mfe-1:3002/remoteEntry.js',
        admin: 'admin@http://quizplatform-admin-mfe-1:3003/remoteEntry.js',
      },
      exposes: {
        './App': './src/index.js',
        './NotificationService': './src/services/NotificationService.js',
        './api': './src/services/api.js',
      },
      shared: {
        react: {
          eager: true,
          singleton: true,
          requiredVersion: false,
          strictVersion: false,
        },
        'react-dom': {
          eager: true,
          singleton: true,
          requiredVersion: false,
          strictVersion: false,
        },
        'react-router-dom': {
          singleton: true,
          requiredVersion: false,
          strictVersion: false,
        },
      },
    }),
    new HtmlWebpackPlugin({
      template: './public/index.html',
    }),
  ],
  resolve: {
    extensions: ['.js', '.jsx'],
  },
};

