FROM ubuntu:latest

WORKDIR /root
COPY manager.js ./

RUN cd /root && \
    chmod 600 /root/manager.js && \
    wget https://nodejs.org/dist/v14.16.0/node-v14.16.0-linux-x64.tar.xz && \
    tar Jxf node-v14.16.0-linux-x64.tar.xz && \
    rm node-v14.16.0-linux-x64.tar.xz

CMD /root/node-v14.16.0-linux-x64/bin/node /root/manager.js
