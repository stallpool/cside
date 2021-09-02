const i_fs = require('fs');
const i_cp = require('child_process');

const killTree = require('./util/kill');

const env = {
   xuser: i_fs.readFileSync('/root/xuser').toString().trim(),
   vscode_root_pid: -1
};

async function read_request_binary(req) {
   return new Promise((resolve, reject) => {
      let body = [];
      req.on('data', (chunk) => { body.push(chunk); });
      req.on('end', () => {
         body = Buffer.concat(body);
         resolve(body);
      });
      req.on('error', reject);
   });
}

const FORBIDDEN = ['PASSWORD', 'USER', 'HOME'];
async function vscodeStart(envObj) {
   // envObj = { [key]: val }
   await vscodeTerminate();
   const envStr = Object.keys(envObj).map((key) => {
      if (FORBIDDEN.includes(key)) return null;
      if (!/^[A-Za-z0-9_]+$/.test(key)) return null;
      let val = `${envObj[key]}`;
      val = '"' + val.split('"').join('"\'"\'"') + '"';
      // TODO: enhance security to avoid inject attack
      val = val.replace(/`/g, '');
      val = val.replace(/\$\(/g, '(');
      return `${key}=${val}`;
   }).filter((x) => !!x).join(' ');
   i_fs.writeFileSync('/tmp/start_vscode.sh', `#!/bin/bash
PASSWORD="FAKE" \
${envStr} \
/opt/code-server/bin/code-server --auth password \
--disable-telemetry --disable-update-check \
--bind-addr 0.0.0.0:20210 \
--user-data-dir ~/.cdr/config \
--extensions-dir ~/.cdr/ext > ~/.cdr/logs/run.log 2>&1 &
echo $! > /tmp/.pid`);
   return new Promise((r, e) => {
      i_cp.exec(`su -c "bash /tmp/start_vscode.sh" - ${env.xuser}`, () => {
         // i_fs.unlinkSync('/tmp/start_vscode.sh');
         try {
            const pid = parseInt(i_fs.readFileSync('/tmp/.pid').toString(), 10);
            env.vscode_root_pid = pid;
            r(pid);
         } catch(err) {
            env.vscode_root_pid = -1;
            r(-1);
         }
      });
   });
}

async function vscodeTerminate() {
   if (env.vscode_root_pid <= 0) return Promise.resolve(true);
   return new Promise((r, e) => {
      killTree(env.vscode_root_pid, (err) => {
         if (err) return e(err);
         env.vscode_root_pid = -1;
         r(true);
      });
   });
}

const api = {
   set_pid: (req, res, opt) => {
      const pid = parseInt(opt.path[0], 10);
      if (!pid) return res.end('400');
      env.vscode_root_pid = pid;
      res.end('ok');
   },
   terminate: (req, res, opt) => {
      vscodeTerminate().then(() => {
         res.end('ok');
      }, (err) => {
         console.error(err);
         res.end('err');
      }).catch((err) => {
         console.error(err);
         res.end('err(throw)');
      });
   },
   start: async (req, res, opt) => {
      try {
         const envObj = JSON.parse(await read_request_binary(req));
         await vscodeStart(envObj);
         res.end('ok');
      } catch(err) {
         console.error(err);
         res.end('err');
      }
   }
};

module.exports = {
   api,
};
