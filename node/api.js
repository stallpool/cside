const i_auth = require('./auth');
const i_quota = require('./quota');

const quota = new i_quota.ConfigCache(process.env.CSIDE_QUOTA_FILE);

function makeError(res, code, text) {
   res.writeHead(code);
   res.end(text);
}

function getAuth(req) {
   const au = req.headers.authorization;
   if (!au) return null;
   const obj = {};
   const aup = au.split(' ');
   obj.type = aup[0];
   try {
      const d = Buffer.from(aup[1] || '', 'base64').toString();
      const dp = d.split(':');
      obj.user = dp[0];
      obj.token = dp[1];
   } catch (err) {
      return null;
   }
   return obj;
}

const api = {
   deploy: async (req, res, opt) => {
      const authObj = getAuth(req);
      if (!authObj) return makeError(res, 401);
      if (!(
         await i_auth.checkAuth(authObj.user, authObj.token)
      )) return makeError(res, 401);
      // /deploy/user/service/cpu/mem
      // e.g. /deploy/fakeuser/vscode/1/2
      const config = {
         user: opt[0],
         service: opt[1],
         cpu: parseInt(opt[2], 10),
         mem: parseInt(opt[3], 10)
      };
      if (!config.user || !config.service || !config.cpu || !config.mem) {
         return makeError(res, 400);
      }
      const srvObj = quota.consume(config.cpu, config.mem);
      if (!srvObj) return res.end('no-quota');
      // TODO: async deploy
      console.log('TODO: deploy service');
      const deployOk = false;
      if (!deployOk) {
         quota.rollback(srvObj);
         return res.end('no-deploy');
      }
      return res.end('ok');
   }
};

module.exports = { api };
