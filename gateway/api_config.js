const i_session = require('./session');

const SUPPORTED_SERVICE = ['vscode'];

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

function checkAuth(req) {
   const authObj = getAuth(req);
   if (!authObj || !authObj.user || !authObj.token) {
      return null;
   }
   if (!i_session.profile.checkAuthSession(authObj.user, authObj.token)) {
      return null;
   }
   return authObj;
}

const api = {
   get: (req, res, opt) => {
      const authObj = checkAuth(req);
      if (!authObj) return makeError(res, 401);
      const profileObj = Object.assign({}, i_session.profile.get(authObj.user));
      delete profileObj.pass;
      delete profileObj.session;
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(profileObj));
   }, // get
   request: (req, res, opt) => {
      if (req.method !== 'POST') return makeError(res, 403);
      const service = opt.path[0];
      if (!service) return makeError(res, 400);
      if (!SUPPORTED_SERVICE.includes(service)) return makeError(res, 400);
      const authObj = checkAuth(req);
      if (!authObj) return makeError(res, 401);
      const profileObj = i_session.profile.get(authObj.user);
      if (!profileObj) return makeError(res, 401);
      if (!profileObj.request) profileObj.request = {};
      const serverDate = new Date();
      if (profileObj.service && profileObj.service[service]) {
         res.writeHead(200, { 'Content-Type': 'application/json' });
         res.end(JSON.stringify({
            service: service,
            utc: -1
         }));
         return;
      }
      if (!profileObj.request[service]) {
         profileObj.request[service] = new Date(
            serverDate.getUTCFullYear(),
            serverDate.getUTCMonth(),
            serverDate.getUTCDate(),
            serverDate.getUTCHours(),
            serverDate.getUTCMinutes(),
            serverDate.getUTCSeconds()
         ).getTime();
         i_session.profile.set(authObj.user, profileObj);
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
         service: service,
         utc: profileObj.request[service]
      }));
   }, // request
};

module.exports = { api };
