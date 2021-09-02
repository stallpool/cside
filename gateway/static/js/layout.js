class AppAlertFrame {
   constructor() {
      let div = document.createElement('div');
      this.ui = {};
      div.className = 'alert alert-app-level alert-info hide';
      this.ui.self = div;
      div = document.createElement('div');
      div.className = 'alert-items';
      this.ui.self.appendChild(div);
      const btn_close = document.createElement('button');
      btn_close.innerHTML = '&times;';
      btn_close.className = 'close';
      this.ui.self.appendChild(btn_close);
   }

   GetDom() { return this.ui.self; }
}

class AppHeader {
   constructor() {
      this.ui = {};
      this.ui.self = document.createElement('header');
      this.ui.self.className = 'header header-6';
      let div = document.createElement('div');
      div.className = 'branding';
      let a = document.createElement('a');
      let span = document.createElement('span');
      span.className = 'title';
      span.innerHTML = 'CSIDE';
      a.appendChild(span);
      div.appendChild(a);
      this.ui.self.appendChild(div);
      this.ui.nav = document.createElement('div');
      this.ui.nav.className = 'header-nav';
      this.ui.self.appendChild(this.ui.nav);
   }

   GetDom() { return this.ui.self; }
}

class AppNav {
   constructor() {
      this.ui = {};
      this.ui.self = document.createElement('nav');
      this.ui.self.className = 'subnav';
      const ul = document.createElement('ul');
      ul.className = 'nav';
      let li = document.createElement('li');
      li.className = 'nav-item';
      let a = document.createElement('a');
      a.className = 'nav-link active';
      a.innerHTML = 'CSIDE';
      li.appendChild(a);
      ul.appendChild(li);
      this.ui.self.appendChild(ul);
   }

   GetDom() { return this.ui.self; }
}

class AppSideNav {
   constructor() {
      this.ui = {};
      this.ui.self = document.createElement('nav');
      this.ui.className = 'sidenav hide';
      const content = document.createElement('section');
      content.className = 'sidenav-content';
      let group = document.createElement('section');
      group.className = 'nav-group';
      /*
         <input id="tabexample2" type="checkbox" />
         <label for="tabexample2">Sidenav</label>
         <ul class="nav-list">
           <li><a class="nav-link">Link 1</a></li>
           <li><a class="nav-link">Link 2</a></li>
           <li><a class="nav-link active">Link 3</a></li>
           <li><a class="nav-link">Link 4</a></li>
           <li><a class="nav-link">Link 5</a></li>
           <li><a class="nav-link">Link 6</a></li>
         </ul>
      */
      content.appendChild(group);
      this.ui.self.appendChild(content);
   }

   GetDom() { return this.ui.self; }
}

class Card {
   constructor () {
      this.ui = {};
      this.ui.self = document.createElement('div');
      this.ui.self.className = 'card';
      this.ui.header = document.createElement('div');
      this.ui.header.className = 'card-header';
      this.ui.self.appendChild(this.ui.header);
      let div = document.createElement('div');
      div.className = 'card-block';
      this.ui.title = document.createElement('div');
      this.ui.title.className = 'card-title';
      div.appendChild(this.ui.title);
      this.ui.text = document.createElement('div');
      this.ui.text.className = 'card-text';
      div.appendChild(this.ui.text);
      this.ui.self.appendChild(div);
      this.ui.footer = document.createElement('div');
      this.ui.footer.className = 'card-footer';
      this.ui.self.appendChild(this.ui.footer);
   }

   GetDom() { return this.ui.self; }
}

class MainFrame {
   constructor() {
      let div = document.createElement('div');
      this.ui = {};
      div.className = 'main-container';
      this.ui.self = div;
      this.ui.alert = new AppAlertFrame();
      this.ui.self.appendChild(this.ui.alert.GetDom());
      this.ui.header = new AppHeader();
      this.ui.self.appendChild(this.ui.header.GetDom());
      this.ui.nav = new AppNav();
      this.ui.self.appendChild(this.ui.nav.GetDom());
      div = document.createElement('div');
      div.className = 'content-container';
      this.ui.content = document.createElement('div');
      this.ui.content.className = 'content-area';
      div.appendChild(this.ui.content);
      this.ui.sidenav = new AppSideNav();
      div.appendChild(this.ui.sidenav.GetDom());
      this.ui.self.appendChild(div);
   }

   GetDom() { return this.ui.self; }
}

module.exports = {
   AppAlertFrame,
   AppHeader,
   AppNav,
   AppSideNav,
   MainFrame,
   Card,
};
