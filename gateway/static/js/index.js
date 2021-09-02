const i_layout = require('./layout');
const i_util = require('./util');

(function () {

const env = {};
env.ui = {};
window._debug = env;

const srvDesc = {
   vscode: 'Visual Studio Code (vscode) is a code editor redefined and optimized for building and debugging modern web and cloud applications'
};

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
      window.location = 'login.html';
      return;
   }

   i_util.Ajax({
      url: '/check',
      method: 'POST',
      raw: `target=${authObj.user}&user=${authObj.user}&token=${authObj.token}`
   }).Req().then(function () {
      env.auth = authObj;
      console.log(`Welcome, ${env.auth.user}!`);
      assemble();
      event();
      profile();
   }, function () {
      window.location = 'login.html';
   });
}

function profile() {
   const au = `${env.auth.user}:${env.auth.token}`;
   i_util.Ajax({
      url: '/profile/get',
      method: 'GET',
      headers: {
         Authorization: `Basic ${window.btoa(au)}`
      }
   }).Req().then(function (data) {
      env.profile = JSON.parse(data);
      buildServiceCards();
   }, function (err) {
      console.error(err);
   });
}

function buildServiceCards() {
   if (!env.profile) return;
   const service = env.profile.service;
   if (!service) return;
   Object.keys(service).forEach(function (name) {
      const srvObj = service[name];
      const card = new i_layout.Card();
      const cell = document.createElement('div');
      cell.className = 'clr-col-lg-4 clr-col-md-6 clr-col-12';
      const btn_goto = document.createElement('a');
      btn_goto.className = 'btn btn-sm btn-link';
      btn_goto.innerHTML = 'Open';
      btn_goto.href = `${srvObj.return}#user=${env.auth.user}&token=${env.auth.token}`;
      card.ui.header.appendChild(document.createTextNode(name));
      card.ui.title.classList.add('hide');
      card.ui.text.appendChild(document.createTextNode(srvDesc[name] || '(none)'));
      card.ui.footer.appendChild(btn_goto);
      cell.appendChild(card.GetDom());
      env.ui.service.appendChild(cell);
   });
}

function requestService() {
   return new Promise(function (r, e) {
      const au = `${env.auth.user}:${env.auth.token}`;
      i_util.Ajax({
         url: `/profile/request/${env.ui.select_request.value}`,
         method: 'POST',
         headers: {
            Authorization: `Basic ${window.btoa(au)}`
         }
      }).Req().then(function (data) {
         const json = JSON.parse(data);
         if (json.utc < 0) {
            alert('The service has been already running there.');
         } else {
            alert('The request has been sent; please wait for administrator processing it.');
         }
         r();
      }, function (err) {
         console.error(err);
         e(err);
      });
   });
}

function event() {
   env.ui.btn_req.addEventListener('click', function (evt) {
      if (evt.target.getAttribute('busy') === 'true') return;
      evt.target.setAttribute('busy', 'true');
      requestService().then(function () {
         evt.target.removeAttribute('busy');
      }, function () {
         evt.target.removeAttribute('busy');
      });
   });
}

function assemble() {
   let div;
   const app = new i_layout.MainFrame();
   const card = new i_layout.Card();
   env.ui.btn_req = document.createElement('button');
   env.ui.btn_req.className = 'btn btn-sm btn-link';
   env.ui.btn_req.innerHTML = 'Request';
   card.ui.title.classList.add('hide');
   card.ui.header.innerHTML = 'Development Service';
   div = document.createElement('div');
   div.className = 'select';
   env.ui.select_request = document.createElement('select');
   env.ui.select_request.innerHTML = '<option>vscode</option>';
   env.ui.select_request.value = 'vscode';
   div.appendChild(env.ui.select_request);
   card.ui.text.appendChild(div);
   card.ui.footer.appendChild(env.ui.btn_req);

   const row = document.createElement('div');
   row.className = 'clr-row';
   const cell = document.createElement('div');
   cell.className = 'clr-col-lg-4 clr-col-md-6 clr-col-12';
   cell.appendChild(card.GetDom());
   row.appendChild(cell);
   app.ui.content.appendChild(row);

   env.ui.service = document.createElement('div');
   env.ui.service.className = 'clr-row';
   app.ui.content.appendChild(env.ui.service);

   document.body.appendChild(app.GetDom());
}

(function startApp() {
   auth();
})();

})();
