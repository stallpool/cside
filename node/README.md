# cside-node

cluster node for IDE instance partitioning

- deploy instance automatically


## Code-Server Patch for auth

```
diff --git a/src/browser/pages/login.html b/src/browser/pages/login.html
index 896927e3812ce56e7d0075c8c19b07b7467bead0..f9e76ce892277320478c61388cc11f5a4298cac8 100644
--- a/src/browser/pages/login.html
+++ b/src/browser/pages/login.html
@@ -40,8 +40,9 @@
                 placeholder="PASSWORD"
                 name="password"
                 autocomplete="current-password"
+                id="txt-password"
               />
-              <input class="submit -button" value="SUBMIT" type="submit" />
+              <input class="submit -button" value="SUBMIT" type="submit" id="btn-submit" />
             </div>
             {{ERROR}}
           </form>
@@ -50,4 +51,20 @@
     </div>
   </body>
   <script data-cfasync="false" src="{{CS_STATIC_BASE}}/out/browser/pages/login.browserified.js"></script>
+  <script>
+  (function () { spv(window.location.hash);
+  function spv(x) {
+    if (!x) {
+       window.location = 'https://cside.gateway.service';
+       return;
+    }
+    var kv={};
+    x.substring(1).split('&').forEach(function(kvstr){
+      var p=kvstr.split('=');
+      kv[decodeURIComponent(p[0])]=decodeURIComponent(p[1]||'');
+    });
+    document.querySelector('#txt-password').value=btoa(kv.user+':'+kv.token);
+    document.querySelector('#btn-submit').click();
+  }; })();
+  </script>
 </html>
diff --git a/src/node/routes/login.ts b/src/node/routes/login.ts
index 999b8dfaf5b9c8e9975139b6e363a82a14f298be..aa16646749c0e83144abfbb748bbc4135a580cf5 100644
--- a/src/node/routes/login.ts
+++ b/src/node/routes/login.ts
@@ -50,7 +50,7 @@ const limiter = new RateLimiter()
 export const router = Router()
 
 router.use(async (req, res, next) => {
-  const to = (typeof req.query.to === "string" && req.query.to) || "/"
+  const to = (typeof req.query.to === "string" && req.query.to) || "/#"
   if (await authenticated(req)) {
     return redirect(req, res, to, { to: undefined })
   }
@@ -92,7 +92,7 @@ router.post("/", async (req, res) => {
         sameSite: "lax",
       })
 
-      const to = (typeof req.query.to === "string" && req.query.to) || "/"
+      const to = (typeof req.query.to === "string" && req.query.to) || "/#"
       return redirect(req, res, to, { to: undefined })
     }
 
diff --git a/src/node/routes/logout.ts b/src/node/routes/logout.ts
index d1a19dfef28646e5ceffdd0eb71915415cea2581..c5fcce1f5042a67e3f8f6c147a96cea664046c7b 100644
--- a/src/node/routes/logout.ts
+++ b/src/node/routes/logout.ts
@@ -12,6 +12,10 @@ router.get("/", async (req, res) => {
     sameSite: "lax",
   })
 
-  const to = (typeof req.query.to === "string" && req.query.to) || "/"
-  return redirect(req, res, to, { to: undefined, base: undefined })
+  const to = (typeof req.query.to === "string" && req.query.to) || (
+     'https://cside.gateway.service'
+  )
+  res.writeHead(302, { Location: to })
+  res.end()
+  // return redirect(req, res, to, { to: undefined, base: undefined })
 })
diff --git a/src/node/util.ts b/src/node/util.ts
index 1216601efc9565a57919cd3967d29d0473e0b5a7..4d825ff93e23c5c2ffcaf2aa77d56bfe60eeeb3f 100644
--- a/src/node/util.ts
+++ b/src/node/util.ts
@@ -7,6 +7,7 @@ import { promises as fs } from "fs"
 import * as net from "net"
 import * as os from "os"
 import * as path from "path"
+import * as https from "https"
 import safeCompare from "safe-compare"
 import * as util from "util"
 import xdgBasedir from "xdg-basedir"
@@ -256,12 +257,48 @@ export async function handlePasswordValidation({
 
   switch (passwordMethod) {
     case "PLAIN_TEXT": {
-      const isValid = passwordFromArgs ? safeCompare(passwordFromRequestBody, passwordFromArgs) : false
-      passwordValidation.isPasswordValid = isValid
-
-      const hashedPassword = await hash(passwordFromRequestBody)
-      passwordValidation.hashedPassword = hashedPassword
-      break
+      const hashedPassword = await hash(passwordFromRequestBody);
+      const hashedPassword0 = await hash(passwordFromArgs);
+      passwordValidation.hashedPassword = hashedPassword;
+      // eslint-disable-next-line @typescript-eslint/no-explicit-any
+      return new Promise((r: any, e: any): Promise<any> => {
+         const usertoken = Buffer.from(passwordFromRequestBody, 'base64').toString();
+         const parts = usertoken.split(':');
+         const username = parts[0];
+         const token = parts.slice(1).join(':');
+         // eslint-disable-next-line @typescript-eslint/no-explicit-any
+         const req = https.request({
+            hostname: 'cside.gateway.service',
+            port: 443,
+            path: '/check',
+            method: 'POST',
+         }, (res: any) => {
+            if (res.statusCode !== 200) {
+               passwordValidation.isPasswordValid = false;
+            } else {
+               passwordValidation.hashedPassword = hashedPassword0;
+               passwordValidation.isPasswordValid = true;
+            }
+            r(passwordValidation);
+         });
+         // eslint-disable-next-line @typescript-eslint/no-explicit-any
+         req.on('error', (err: any) => e(err));
+         req.write(`target=${
+            env.process.AUTH_TARGET_USER
+         }&user=${
+            encodeURIComponent(username)
+         }&token=${
+            encodeURIComponent(token)
+         }`);
+         req.end();
+      });
+      break;
+      // const isValid = passwordFromArgs ? safeCompare(passwordFromRequestBody, passwordFromArgs) : false
+      // passwordValidation.isPasswordValid = isValid
+
+      // const hashedPassword = await hash(passwordFromRequestBody)
+      // passwordValidation.hashedPassword = hashedPassword
+      // break
     }
     case "SHA256": {
       const isValid = isHashLegacyMatch(passwordFromRequestBody, hashedPasswordFromArgs || "")
```
