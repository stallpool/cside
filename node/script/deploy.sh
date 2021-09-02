#!/bin/bash

# XMEM=2G XCPU=2 deploy.sh <USER>

set -xe

SELF=$(cd `dirname $0`; pwd)
XUSER=$1
mkdir -p $SELF/local/$XUSER
pushd $SELF/local/$XUSER

if [ ! -f $SELF/local/home-user.json ]; then
   echo "no home-user.json; {\"<username>\":\"<mountpoint>\"}"
   exit 1
fi
if [ ! -f $SELF/local/workspace-user.json ]; then
   echo "no workspace-user.json; {\"<username>\":\"<mountpoint>\"}"
   exit 1
fi

if [ -z "$XHOME" ]; then
   XHOME=`python $SELF/parse-home.py $SELF/local/home-user.json $XUSER`
fi
if [ -z "$XWS" ]; then
   XWS=`python $SELF/parse-workspace.py $SELF/local/workspace-user.json $XUSER`
fi

curl -o user.json "https://userinfo.service.notexists/user/$XUSER"
USRINFO=`python $SELF/parse-json.py user.json`
XGID=`echo $USRINFO | cut -d ' ' -f 1 | cut -d '=' -f 2`
XGROUP=`echo $USRINFO | cut -d ' ' -f 2 | cut -d '=' -f 2`
XUID=`echo $USRINFO | cut -d ' ' -f 3 | cut -d '=' -f 2`
echo "user info: $XUID $XUSER $XGID $XGROUP"

if [ -z "$XHOME" ]; then
   echo 'no home'
   exit 1
fi

if [ -z "$XWS" ]; then
   echo 'no workspace'
   exit 1
fi

XNAME=cside-$XUSER

echo '#!/bin/bash' > docker.sh
echo 'set -xe' >> docker.sh
python $SELF/generate_docker.py $XUSER $XHOME $XWS >> docker.sh
if [ -f /opt/deploy/cside/monitor/dist/manager.js ]; then
echo "docker exec $XNAME bash -c ""'""echo $XUSER > /root/xuser""'" >> docker.sh
echo "docker cp /opt/deploy/cside/monitor/dist/manager.js $XNAME:/root/manager.js" >> docker.sh
echo "docker stop $XNAME" >> docker.sh
echo "docker start $XNAME" >> docker.sh
fi
echo "docker cp /opt/deploy/cside/monitor/script/vscode_restart $XNAME:/usr/bin/vscode_restart" >> docker.sh
echo "docker exec $XNAME chmod 755 /usr/bin/vscode_restart" >> docker.sh
echo "docker exec $XNAME bash /root/inside_deploy.sh $XUSER $XUID $XGROUP $XGID \$XUHOME" >> docker.sh
bash docker.sh

XIP=`docker inspect $XNAME | grep '"IPAddress"' | cut -d ':' -f 2 | sort -u | cut -d '"' -f 2`
python $SELF/modify_nginx.py /etc/nginx/conf.d/cside.conf $XUSER $XIP
nginx -s reload

rm user.json docker.sh
popd
rmdir $SELF/local/$XUSER
