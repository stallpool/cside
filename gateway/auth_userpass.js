const i_uuid = require('uuid');
const i_session = require('./session');
const i_util = require('./util');

const SESSION_AGE = 2 * 24 * 3600 * 1000;
const SESSION_N = 20;

function makeRedirect(res, url) {
   res.writeHead(303, {
      Location: url
   });
   res.end();
}

const api = {
   login: async (req, res, opt) => {
      if (req.method !== 'POST') {
         return makeRedirect(res, '/login.html?error=403');
      }
      try {
         const params = i_util.build_params((await i_util.read_request_binary(req)).toString());
         if (!params.user || !params.pass) {
            return makeRedirect(res, '/login.html?error=400');
         }
         const profileObj = i_session.profile.get(params.user);
         if (!profileObj || !profileObj.pass || profileObj.pass != params.pass) {
            return makeRedirect(res, '/login.html?error=401');
         }
         const sessionObj = profileObj.session || {};
         profileObj.session = sessionObj;
         const token = i_uuid.v4();
         const timestamp = new Date().getTime();
         const tokens = Object.keys(sessionObj);
         tokens.forEach((t) => {
            if (timestamp - sessionObj[t] < SESSION_AGE) return;
            delete sessionObj[t];
         });
         // avoid too many login/logout
         // and remove oldest sessions
         if (tokens.length > SESSION_N) {
            let diff = tokens.length - SESSION_N;
            while (diff > 0) {
               const t = tokens.shift();
               delete sessionObj[t];
               diff --;
            }
         }
         sessionObj[token] = timestamp;
         i_session.profile.set(params.user, profileObj);
         return makeRedirect(res, `/#user=${
            encodeURIComponent(params.user)
         }&token=${
            encodeURIComponent(token)
         }`);
      } catch(err) {
         console.error(err);
      }
      return makeRedirect(res, '/login.html?error=500');
   }
};

module.exports = { api };
