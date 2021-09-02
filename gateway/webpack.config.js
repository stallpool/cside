const i_path = require('path');

function getWebJs(path, outname) {
   return {
      // target: 'node',
      target: ['web', 'es5'],
      mode: 'production',
      entry: path,
      optimization: {
         minimize: false,
      },
      resolve: {
         extensions: [ '.js' ]
      },
      output: {
         filename: outname,
         path: i_path.resolve(__dirname, 'static', 'dist', 'js')
      },
      plugins: [
      ]
   };
}

module.exports = [
   getWebJs('./static/js/index.js', 'index.js'),
   getWebJs('./static/js/admin.js', 'admin.js'),
];
