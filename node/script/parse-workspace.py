import sys
import json
import subprocess
import os
import os.path

user = sys.argv[2]
wssrc = sys.argv[1]
onlylist = len(sys.argv) >= 4 and sys.argv[3] == '-l'

xws = os.getenv('XWS')
if xws:
   obj = { user: xws }
else:
   with open(wssrc, 'r') as f:
      obj = json.loads(f.read())

r = []
if user in obj:
   basedir = '/opt/sys/mount/ws'
   for ws in obj[user].split(','):
      target = os.path.join(basedir, ws)
      if not onlylist and not os.path.isdir(os.path.join(target, user)):
         subprocess.check_output('mkdir -p {1} && mount {0}.storage.service:/ws/{0} {1}'.format(ws, target), shell=True)
      r.append(ws)

if os.path.isdir('/opt/data/{0}/loop'.format(user)):
   r.append('local')
if len(r) > 0:
   print(' '.join(r))
