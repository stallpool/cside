const i_uuid = require('uuid');
const i_https = require('https');
const i_url = require('url');

const i_crypto = require('crypto');
const i_jwtDecode = require('jwt-decode');
const i_passport = require('passport');
const i_OAuth2Strategy = require('passport-oauth2').Strategy;

const i_session = require('./session');
const i_util = require('./util');

const AUTH_SSO_AUTH_URL = process.env.CSIDE_SSO_AUTH_URL;
const AUTH_SSO_TOKEN_URL = process.env.CSIDE_SSO_TOKEN_URL;
const AUTH_SSO_CLIENT_ID = process.env.CSIDE_SSO_CLIENT_ID;
const AUTH_SSO_SECRET = process.env.CSIDE_SSO_SECRET;
const AUTH_SSO_CB_URL = process.env.CSIDE_SSO_CB_URL;
const _READY = (
   AUTH_SSO_AUTH_URL &&
   AUTH_SSO_TOKEN_URL &&
   AUTH_SSO_CLIENT_ID &&
   AUTH_SSO_CB_URL &&
   !!AUTH_SSO_SECRET
);

const SESSION_AGE = 2 * 24 * 3600 * 1000;
const SESSION_N = 20;

function makeRedirect(res, url) {
   res.writeHead(303, {
      Location: url
   });
   res.end();
}

if (_READY) {
   i_passport.use(new i_OAuth2Strategy({
      authorizationURL: AUTH_SSO_AUTH_URL,
      tokenURL: AUTH_SSO_TOKEN_URL,
      clientID: AUTH_SSO_CLIENT_ID,
      clientSecret: AUTH_SSO_SECRET,
      callbackURL: AUTH_SSO_CB_URL,
   }, (accessToken, refreshToken, params, profile, cbFn) => {
      // User.findOrCreate({ id: profile.id }, (err, user) => { cbFn(null, user); })
      if (!params.id_token) return cbFn(new Error('invalid user'), null);
      const tokenObj = i_jwtDecode(params.id_token);
      if (!tokenObj.sub) return cbFn(new Error('invalid user name'), null);
      const username = tokenObj.sub.split('@')[0];
      const userObj = { username, refreshToken };
      return cbFn(null, userObj);
   }));
   i_passport.initialize();
}

const api = {
   login: async (req, res, opt) => {
      // simulate express body-parser
      const query = {};
      i_url.parse(req.url).query.split('&').forEach((kv) => {
         const parts = kv.split('=');
         const k = decodeURIComponent(parts[0]);
         const v = decodeURIComponent(parts[1] || '');
         query[k] = v;
      });
      req.query = query;
      const cookie = {};
      req.headers.cookie.split('; ').forEach((kv) => {
         const parts = kv.trim().split('=');
         const k = decodeURIComponent(parts[0]);
         const v = decodeURIComponent(parts[1] || '');
         query[k] = v;
      });
      req.cookies = cookie;

      i_passport.authenticate('oauth2', (err, user, info) => {
         try {
            if (err) return makeRedirect(res, '/login.html?error=400');
            if (!user) return makeRedirect(res, '/login.html?error=401');
            const profileObj = i_session.profile.get(user.username);
            if (!profileObj) {
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
            i_session.profile.set(user.username, profileObj);
            return makeRedirect(res, `/#user=${
               encodeURIComponent(user.username)
            }&token=${
               encodeURIComponent(token)
            }`);
         } catch(err) {
            console.error(err);
         }
         return makeRedirect(res, '/login.html?error=500');
      })(req, res);
   }
};

module.exports = { api: _READY?api:null };
