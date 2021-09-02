const i_session = require('./session');

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
   request: (req, res, opt) => {
      const authObj = checkAuth(req);
      if (!authObj) return makeError(res, 401);
      if (!i_session.profile.isAdmin(authObj.user)) return makeError(res, 401);

      const users = i_session.profile.users().map((username) => {
         const profileObj = i_session.profile.get(username);
         if (!profileObj || !profileObj.request) return null;
         return { user: username, request: profileObj.request };
      }).filter(
         (x) => !!x
      );
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(users));
   }, // request
   request_done: (req, res, opt) => {
      res.end('not implemented yet');
   }, // request_done
};

module.exports = { api };
