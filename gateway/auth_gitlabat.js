const i_uuid = require('uuid');
const i_https = require('https');

const i_session = require('./session');
const i_util = require('./util');

// auth with gitlab access token

const AUTH_GITLAB_HOST = process.env.CSIDE_GITLAB_HOST;
const SESSION_AGE = 2 * 24 * 3600 * 1000;
const SESSION_N = 20;

function makeRedirect(res, url) {
   res.writeHead(303, {
      Location: url
   });
   res.end();
}

async function getResponseData(res) {
   return new Promise((r, e) => {
      let error = false;
      const buf = [];
      res.on('error', (err) => {
         error = true;
         e(err);
      });
      res.on('data', (chunk) => {
         buf.push(chunk);
      });
      res.on('end', () => {
         if (error) return;
         try {
            const json = JSON.parse(Buffer.concat(buf));
            r(json);
         } catch (err) {
            e(err);
         }
      });
   });
}

async function getUserInfoFromGitlab(user, accessToken) {
   return new Promise((r, e) => {
      const req = i_https.request({
         hostname: AUTH_GITLAB_HOST,
         port: 443,
         path: '/api/v4/user',
         method: 'GET',
         headers: {
            'PRIVATE-TOKEN': accessToken
         },
      }, async (res) => {
         if (~~(res.statusCode/100) !== 2) {
            r(null);
         }
         try {
            const userObj = await getResponseData(res);
            if (!userObj) return r(null);
            if (userObj.state !== 'active') return r(null);
            if (userObj.username !== user) return r(null);
            return r(userObj);
         } catch(err) {
            console.error('getUserInfoFromGitlab:', user, err);
            r(null);
         }
      });
      req.on('error', (err) => {
         console.error('getUserInfoFromGitlab:', user, err);
         r(null);
      });
      req.end();
   });
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
         const gitlabUserObj = await getUserInfoFromGitlab(params.user, params.pass);
         if (!gitlabUserObj) {
            return makeRedirect(res, '/login.html?error=401');
         }
         let profileObj = i_session.profile.get(params.user);
         if (!profileObj) {
            profileObj = { session: {} };
            i_session.profile.set(params.user, profileObj);
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
         i_session.profile.set(gitlabUserObj.username, profileObj);
         return makeRedirect(res, `/#user=${
            encodeURIComponent(gitlabUserObj.username)
         }&token=${
            encodeURIComponent(token)
         }`);
      } catch(err) {
         console.error(err);
      }
      return makeRedirect(res, '/login.html?error=500');
   }
};

module.exports = { api: AUTH_GITLAB_HOST?api:null };
