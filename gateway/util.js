function build_params(query) {
   const r = {};
   if (!query) return r;
   query.split('&').forEach((one) => {
      const parts = one.split('=');
      const key = decodeURIComponent(parts[0]);
      const val = decodeURIComponent(parts.slice(1).join('='));
      r[key] = val;
   });
   return r;
}

async function read_request_binary(req) {
   return new Promise((resolve, reject) => {
      let body = [];
      req.on('data', (chunk) => { body.push(chunk); });
      req.on('end', () => {
         body = Buffer.concat(body);
         resolve(body);
      });
      req.on('error', reject);
   });
}

module.exports = {
   build_params,
   read_request_binary,
};
