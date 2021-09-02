const i_https = require('https');

const AUTH_ADMINS = (
   process.env.CSIDE_ADMINS || ''
).split(',').filter((x) => !!x);
const AUTH_HOST = process.env.CSIDE_AUTH_HOST;

async function checkAuth(username, token) {
   return new Promise((r, e) => {
      let error = false;
      const req = https.request({
         hostname: AUTH_HOST,
         port: 443,
         path: '/check',
         method: 'POST',
      }, (res) => {
         if (error) return;
         if (res.statusCode !== 200) {
            r(false);
         } else {
            // text(res) = 'ok'
            r(true);
         }
      });
      req.on('error', (err) => {
         error = true;
         e(err);
      });
      req.write(`target=${
         encodeURIComponent(username)
      }&user=${
         encodeURIComponent(username)
      }&token=${
         encodeURIComponent(token)
      }`);
      req.end();
   });
}

function isAdmin(username) {
   return AUTH_ADMINS.includes(username);
}

module.exports = {
   checkAuth,
   isAdmin,
};
