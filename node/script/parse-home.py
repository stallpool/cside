import sys
import json
import subprocess
import os.path

dirmap = {
   '<dirname>': { 'host': 'home.storage.service:</path/to/home>', 'name': '<home>' },
}

user = sys.argv[2]
homesrc = sys.argv[1]

with open(homesrc, 'r') as f:
   obj = json.loads(f.read())

r = []
if user in obj:
   basedir = '/opt/sys/mount/home'
   for home in obj[user].split(','):
      dirobj = dirmap[home]
      target = os.path.join(basedir, dirobj['name'])
      if not os.path.isdir(os.path.join(target, user)):
         subprocess.check_output('mkdir -p {1} && mount {0} {1}'.format(dirobj['host'], target), shell=True)
      r.append(dirobj['name'])

if len(r) > 0:
   print(' '.join(r))
