import sys

nginxfile = sys.argv[1]
user = sys.argv[2]
ip = sys.argv[3]

with open(nginxfile, 'r') as f:
   text = f.read().decode('utf8')

text = text.replace('#next_entry', """
   location ^~ /{0}/ {{
      proxy_pass http://{1}:20210/;
      proxy_set_header Host $http_host;
      proxy_set_header X-Forwarded-Proto $scheme;
      proxy_set_header X-Real-IP $remote_addr;
      proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
      proxy_set_header  Authorization $http_authorization;
      proxy_pass_header Authorization;
      proxy_http_version 1.1;
      proxy_set_header Upgrade $http_upgrade;
      proxy_set_header Connection $connection_upgrade;
   }}
#next_entry""".format(user, ip))
with open(nginxfile, 'w+') as f:
   f.write(text)
