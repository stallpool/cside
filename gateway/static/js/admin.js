const i_layout = require('./layout');
const i_util = require('./util');

(function () {

const env = {};
env.ui = {};
window._debug = env;

function parseHash() {
   const obj = {};
   (window.location.hash || '#').substring(1).split('&').forEach(
      function (kv) {
         const p = kv.split('=');
         obj[decodeURIComponent(p[0])] = decodeURIComponent(p[1]);
      }
   );
   return obj;
}

function auth() {
   const hashObj = parseHash();
   if (hashObj.user && hashObj.token) {
      window.localStorage.setItem('auth', JSON.stringify({
         user: hashObj.user,
         token: hashObj.token
      }));
      window.location.hash = '#';
   }
   const authObj = JSON.parse(
      window.localStorage.getItem('auth') || '{}'
   );
   if (!authObj.user || !authObj.token) {
      window.location = '/login.html';
      return;
   }

   i_util.Ajax({
      url: '/check/admin',
      method: 'POST',
      raw: `target=${authObj.user}&user=${authObj.user}&token=${authObj.token}`
   }).Req().then(function () {
      env.auth = authObj;
      console.log(`Welcome, ${env.auth.user}!`);
      assemble();
      event();
      showRequests();
   }, function () {
      window.location = '/';
   });
}

function showRequests() {
   const au = `${env.auth.user}:${env.auth.token}`;
   i_util.Ajax({
      url: `/admin/request`,
      method: 'POST',
      headers: {
         Authorization: `Basic ${window.btoa(au)}`
      }
   }).Req().then(function (data) {
      env.request = JSON.parse(data);
      buildServiceCards();
   }, function (err) {
      console.error('showRequests', err);
   });
}

function buildServiceCards() {
   if (!env.request) return;
   const request = env.request;
   if (!request) return;
   request.forEach(function (ureq) {
      const username = ureq.user;
      Object.keys(ureq.request).forEach(function (name) {
         const utc = ureq.request[name];
         const utcOffset = - new Date().getTimezoneOffset() / 60 * 3600 * 1000;
         const card = new i_layout.Card();
         const cell = document.createElement('div');
         cell.className = 'clr-col-lg-4 clr-col-md-6 clr-col-12';
         const btn_goto = document.createElement('a');
         card.ui.header.appendChild(document.createTextNode(`${username}: ${name}`));
         card.ui.title.classList.add('hide');
         card.ui.text.appendChild(document.createTextNode(
            `Requested at ${new Date(utc + utcOffset).toString()}`
         ));
         const btn_done = document.createElement('button');
         btn_done.innerHTML = 'Done';
         btn_done.className = 'btn btn-sm btn-link btn-done';
         btn_done.setAttribute('data-user', username);
         btn_done.setAttribute('data-service', name);
         card.ui.footer.appendChild(btn_done);
         cell.appendChild(card.GetDom());
         env.ui.service.appendChild(cell);
      });
   });
}

function event() {
   const au = `${env.auth.user}:${env.auth.token}`;
   env.ui.service.addEventListener('click', function (evt) {
      if (evt.target.classList.contains('btn-done')) {
         const user = evt.target.getAttribute('data-user');
         const service = evt.target.getAttribute('data-service');
         evt.target.classList.add('disabled');
         i_util.Ajax({
            url: `/admin/request_done/${user}/${service}`,
            method: 'POST',
            headers: {
               Authorization: `Basic ${window.btoa(au)}`
            }
         }).Req().then(function () {
            alert(`The deployment of the service "${service}" marked as done for ${user}`);
         }, function (err) {
            console.error('requestDone', err);
            evt.target.classList.remove('disabled');
         });
      }
   });
}

function assemble() {
   let div;
   const app = new i_layout.MainFrame();

   env.ui.service = document.createElement('div');
   env.ui.service.className = 'clr-row';
   app.ui.content.appendChild(env.ui.service);

   document.body.appendChild(app.GetDom());
}

(function startApp() {
   auth();
})();

})();
