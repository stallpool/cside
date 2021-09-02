import os
import sys

user = sys.argv[1]
home = sys.argv[2]
if home == 'none':
   home = ''
else:
   home = '-v /opt/sys/mount/home/{1}/{0}:/opt/remote/home'.format(user, home)
ws = sys.argv[3:]

mem = os.getenv('XMEM', '4G')
cpu = os.getenv('XCPU', '1')

def wsmount(ws):
   r = []
   wsmap = {}
   homews = None
   for one in ws:
      if one == 'local':
         r.append('-v /opt/data/{0}/loop:/opt/home'.format(user))
         homews = '/opt/home'
      else:
         r.append('-v /opt/sys/mount/ws/{0}/{1}:/opt/remote/{0}-ws'.format(one, user))
         if not homews:
            homews = '/opt/remote/{0}-ws'.format(one)
   return homews, r

homews, wslist = wsmount(ws)
print("""
docker run -d --name cside-{0} \\
   -m {3} --cpus {4} \\
   {1} \\
   {2} \\
   cside:0.0.1
""".format(user, home, ' '.join(wslist), mem, cpu))

for one in wslist:
   parts = one.split(' ')[1].split(':')
   wsone = parts[0].split('/')[-2]
   wsreal = parts[1]
   if wsreal == '/opt/home':
      continue
   print("docker exec cside-{0} mkdir -p /ws/{1}".format(user, wsone))
   print("docker exec cside-{0} ln -s {1} /ws/{2}/{0}".format(user, wsreal, wsone))

print("docker cp /opt/deploy/code-server.tar.gz cside-{0}:/root/code-server.tar.gz".format(user))
print("docker cp /opt/deploy/cside/node/script/inside_deploy.sh cside-{0}:/root/inside_deploy.sh".format(user))
print("export XUHOME={0}".format(homews))
