class AjaxRequest {
   constructor(xhr, req) {
      this.xhr = xhr;
      this.req = req;
   }

   Cancel() {
      this.xhr.abort();
      // TODO: add error handler in function Ajax
      //       to make sure Promise can be handled correctly
      //       no infinite wait for (r, e)
   }

   Req() {
      return this.req;
   }
}

/* opt = interface AjaxRequestOpt {
   url: string;
   method?: string;
   headers?: any;
   data?: any;
   json?: any;
   raw?: any;
   return?: any;
} */

function dataToUriParam (data) {
   if (!data) return '';
   const param = '?' + Object.keys(data).map((key) => {
      const val = data[key];
      return encodeURIComponent(key) + '=' + encodeURIComponent(val);
   }).join('&');
   if (param === '?') return '';
   return param;
}

function Ajax(opt) {
   const xhr = new XMLHttpRequest();
   const req = new Promise((r, e) => {
      let payload = null;
      xhr.open(
         opt.method || 'POST',
         opt.url + dataToUriParam(opt.data),
         true
      );
      const onReadyStateChange = (evt) => {
         if (evt.target.readyState === 4 /*XMLHttpRequest.DONE*/) {
            xhr.addEventListener(
               'readystatechange', onReadyStateChange
            );
            if (~~(evt.target.status / 100) === 2) {
               if (opt.return === 'json') {
                  r(JSON.parse(evt.target.response));
               } else {
                  r(evt.target.response);
               }
            } else {
               e(evt.target.status);
            }
         }
         // TODO: check error code
      };
      xhr.addEventListener(
         'readystatechange', onReadyStateChange
      );
      if (opt.headers) {
         Object.keys(opt.headers).forEach(function (key) {
            if (!opt.headers[key]) return;
            xhr.setRequestHeader(key, opt.headers[key]);
         });
      }
      if (opt.json) {
         xhr.setRequestHeader(
            "Content-Type", "application/json;charset=UTF-8"
         );
         payload = JSON.stringify(opt.json);
      } else if (opt.raw) {
         payload = opt.raw;
      }
      xhr.send(payload);
   });
   return new AjaxRequest(xhr, req);
}

module.exports = {
   Ajax,
};
