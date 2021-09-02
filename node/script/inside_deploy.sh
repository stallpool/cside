#!/bin/bash

set -ex

# inside_deploy.sh <XUSER> <XUID> <XGROUP> <XGID> <UHOME>
SELF=$(cd `dirname $0`; pwd)
XUSER=$1
XUID=$2
XGROUP=$3
XGID=$4
UHOME=$5

# prepare software
apt-get update
# uncomment below line; lib32ncurses6 and lib32z1 are used to support 32-bit
# apt-get install -y vim lib32ncurses6 lib32z1 gdb

# deploy code-server
chmod 600 ${SELF}/inside_deploy.sh ${SELF}/code-server.tar.gz

groupadd -g ${XGID} ${XGROUP} || echo "${XGID} ${XGROUP}"
useradd -d ${UHOME} -g ${XGID} -u ${XUID} -M -s /bin/bash ${XUSER} || echo "${XUID} ${XUSER}"

cd ${SELF}
#curl -L -O https://nodejs.org/dist/v14.17.6/node-v14.17.6-linux-x64.tar.xz
#tar Jxf node-v14.17.6-linux-x64.tar.xz
export PATH=${SELF}/node-v14.16.0-linux-x64/bin:${PATH}
npm install -g yarn

cd /opt
tar zxf ${SELF}/code-server.tar.gz
cd /opt/code-server
yarn --prod

sed -i "s|<todo_username>|${XUSER}|g" /opt/code-server/out/node/util.js

su -c "mkdir -p ${UHOME}/.cdr/{config,ext,logs}" - ${XUSER}
/usr/bin/vscode_restart

rm -r /root/inside_deploy.sh /root/code-server.tar.gz
