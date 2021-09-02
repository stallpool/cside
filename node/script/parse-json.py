import json
import sys

with open(sys.argv[1], 'r') as f:
   obj = json.loads(f.read())
keys = list(obj.keys())
keys.sort()
print(' '.join(map(lambda k: '{0}={1}'.format(k, obj[k]), keys)))
