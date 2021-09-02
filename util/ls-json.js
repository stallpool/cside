const i_fs = require('fs');
const i_path = require('path');

const target_dir = process.argv[2];
const output = process.argv[3];

const items = i_fs.readdirSync(target_dir);
const map = {};
items.forEach((f) => {
   const parts = f.split('.');
   const name = parts.slice(0, parts.length-1).join('.');
   i_fs.readFileSync(
      i_path.join(target_dir, f)
   ).toString().split('\n').forEach(
      (user) => {
         if (!user) return;
         if (map[user]) {
            map[user] += ',' + name;
         } else {
            map[user] = name;
         }
      }
   );
});
i_fs.writeFileSync(output, JSON.stringify(map));
