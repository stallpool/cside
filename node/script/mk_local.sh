#!/bin/bash

XUSER=$1
XSIZE=$2

if [ -z "$XSIZE" ]; then
   XSIZE=2G
fi

mkdir -p /opt/data/$XUSER
mkdir -p /opt/data/$XUSER/loop
dd if=/dev/zero of=/opt/data/$XUSER/fs bs=$XSIZE count=1
mkfs.ext4 /opt/data/$XUSER/fs
mount /opt/data/$XUSER/fs /opt/data/$XUSER/loop
