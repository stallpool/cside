const path = require('path');

module.exports = {
  target: 'node',
  mode: 'production',
  entry: './server.js',
  optimization: {
    minimize: true,
  },
  output: {
    filename: 'server.js',
    path: path.resolve(__dirname, 'dist'),
  },
};
