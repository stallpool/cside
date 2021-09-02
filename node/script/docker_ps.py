from subprocess import check_output
import re
import json

docker_ps = check_output('docker ps -a', shell=True).decode('utf8').strip()
lines = list(map(lambda x: re.split(r'\s+', x), docker_ps.split('\n')))
items = list(map(lambda x: [x[0], x[1], x[-1]], lines[1:]))
for one in items:
   docker_inspect = check_output('docker inspect {0}'.format(one[0]), shell=True).decode('utf8')
   obj = json.loads(docker_inspect)[0]
   print('{0}({1}) {2} cpu={3} mem={4} ip={5}'.format(
      one[2], one[0],
      obj["State"]["Status"],
      obj["HostConfig"]["NanoCpus"] // 1000000000,
      obj["HostConfig"]["Memory"],
      obj["NetworkSettings"]["IPAddress"]
   ))
