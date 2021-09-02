const i_fs = require('fs');

/* {
   "quota": {
      "cpu": 10,
      "mem": 32
   },
   "service": [
      { "name": "vscode", "user": "username", "cpu": 2, "mem": 4 },
   ]
} */
class ConfigCache {
   constructor(filename) {
      this.filename = filename;
      this.config = null;
      this.ts = -1;
      this.load();
   }

   get() {
      return this.config;
   }

   apply(cpu, mem) {
      if (!this.config) return false;
      const quota = this.config.quota;
      if (!quota || !quota.cpu || !quota.mem) return false;
      const service = this.config.service || [];
      if (!service || !service.length) {
         return quota.cpu >= cpu && quota.mem >= mem;
      }
      const used_cpu = service.map((x) => x.cpu).reduce((x, y) => x+y);
      const used_mem = service.map((x) => x.mem).reduce((x, y) => x+y);
      return (quota.cpu >= cpu + used_cpu) && (quota.mem >= mem + used_mem);
   }

   consume(cpu, mem, obj) {
      if (!this.config) return null;
      if (!this.apply(cpu, mem)) return null;
      const srvObj = Object.assign({}, obj, { cpu, mem });
      if (!this.config.service) this.config.service = [];
      this.config.service.push(srvObj);
      this.save();
      return srvObj;
   }

   rollback(srvObj) {
      if (!this.config) return;
      if (!this.config.service) return;
      const i = this.config.service.indexOf(srvObj);
      if (i < 0) return;
      this.config.service.splice(i, 1);
      this.save();
   }

   load() {
      try {
         const stat = i_fs.statSync(this.filename);
         if (this.config) {
            if (stat.mtimeMs === this.ts) return;
         }
         this.config = JSON.parse(
            i_fs.readFileSync(this.filename)
         );
         this.ts = stat.mtimeMs;
      } catch (err) {
         this.config = null;
         this.ts = -1;
         console.error('ConfigCache.load', err);
      }
   }

   save() {
      try {
         i_fs.writeFileSync(
            this.filename, JSON.stringify(this.config)
         );
      } catch(err) {
         console.error('ConfigCache.save', err);
      }
   }
}

module.exports = {
   ConfigCache,
};
