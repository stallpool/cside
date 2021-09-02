const i_path = require('path');
const i_fs = require('fs');

const i_util = require('./util');

const SESSION_AGE = 2 * 24 * 3600 * 1000;
const SESSION_N = 20;

const AUTH_ADMINS = (process.env.CSIDE_ADMINS || '').split(',').filter(
   (x) => !!x.trim()
);
const AUTH_PROFILE_DIR = (process.env.CSIDE_AUTH_DIR?
   i_path.resolve(process.env.CSIDE_AUTH_DIR):null
);

class ProfileCache {
   constructor() {
      this.cache = {};
      this.mtime = {};
      if (AUTH_PROFILE_DIR) {
         this.basedir = AUTH_PROFILE_DIR;
      } else {
         this.basedir = null;
      }
   }

   get(username) {
      const userObj = this.load(username);
      return userObj;
   }

   set(username, data) {
      this.cache[username] = data;
      this.save(username);
   }

   checkAuthSession(username, token) {
      const profileObj = this.get(username);
      if (!profileObj) return false;
      const sessionObj = profileObj.session;
      if (!sessionObj) return false;
      const ts0 = sessionObj[token];
      if (new Date().getTime() - ts0 < SESSION_AGE) {
         return true;
      }
      return false;
   }

   isAdmin(username) {
      return AUTH_ADMINS.includes(username);
   }

   users() {
      if (!this.basedir) return [];
      const list = i_fs.readdirSync(this.basedir);
      return list.filter(
         (x) => !!x && x.endsWith('.json')
      ).map(
         (x) => decodeURIComponent(x.substring(0, x.length-5))
      );
   }

   path(username) {
      return `${
         encodeURIComponent(username).replace(/[.]/g, '_')
      }.json`;
   }

   load(username) {
      if (!this.basedir) return null;
      try {
         const userP = i_path.join(this.basedir, this.path(username));
         if (!i_fs.existsSync(userP)) {
            return null;
         }
         const userS = i_fs.statSync(userP);
         const mtime = this.mtime[username];
         if (mtime === userS.mtimeMs) {
            return this.cache[username];
         }
         const userObj = JSON.parse(i_fs.readFileSync(userP));
         this.cache[username] = userObj;
         this.mtime[username] = userS.mtimeMs;
         return userObj;
      } catch(err) {
         this.cache[username] = null;
         return null;
      }
   }

   save(username) {
      if (!this.basedir) return;
      try {
         const userP = i_path.join(this.basedir, this.path(username));
         const userObj = this.cache[username];
         if (!userObj) return;
         i_fs.writeFileSync(userP, JSON.stringify(userObj));
      } catch(err) {
         console.error('session cache save:', username, err);
      }
   }
}
const profile = new ProfileCache();

function makeError(res, code) {
   res.writeHead(code);
   res.end();
}

const api = {
   ProfileCache,
   profile,
   check: async (req, res, opt) => {
      if (req.method !== 'POST') {
         return makeError(res, 403);
      }
      const needCheckAdmin = opt.path[0] === 'admin';
      try {
         const params = i_util.build_params((await i_util.read_request_binary(req)).toString());
         if (!params.target || !params.user || !params.token) {
            return makeError(res, 400);
         }
         params.user = encodeURIComponent(params.user);
         if (params.user.indexOf('..') >= 0) {
            return makeError(res, 400);
         }

         const profileObj = profile.get(params.user);
         const targetProfileObj = profile.get(params.target);
         if (!targetProfileObj) { 
            return makeError(res, 401);
         }
         if (needCheckAdmin && !AUTH_ADMINS.includes(params.user)) {
            return makeError(res, 401);
         }
         const acl = targetProfileObj.acl || [];
         if (!acl.includes(params.target)) acl.push(params.target);
         if (!acl.includes(params.user)) {
            return makeError(res, 401);
         }

         if (!profileObj || !profileObj.session || !profileObj.session[params.token]) {
            return makeError(res, 401);
         }
         const ts = new Date().getTime();
         const diffts = ts - profileObj.session[params.token];
         if (diffts < SESSION_AGE) {
            if (diffts > SESSION_AGE / 10) {
               profileObj.session[params.token] = ts;
               profile.set(params.user, profileObj);
            }
            res.end('ok');
         } else {
            delete profileObj.session[params.token];
            profile.set(params.user, profileObj);
            return makeError(res, 401);
         }
      } catch(err) {
         console.error(err);
      }
      return makeError(res, 500);
   },
};

module.exports = api;
