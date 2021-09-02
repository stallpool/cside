const i_path = require('path');
const i_fs = require('fs');

const key = process.argv[2];
const files = process.argv.slice(3);

files.forEach((filename) => {
   try {
      const json = JSON.parse(i_fs.readFileSync(filename));
      console.log(`${
         i_path.basename(filename)
      } - ${
         json[key]?json[key]:'(none)'
      }`);
   } catch(err) {
      console.error(`[E] ${filename}`);
   }
});
