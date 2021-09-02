#!/bin/bash

set -e

SELF=$(cd `dirname $0`/..; pwd)

./node_modules/.bin/webpack
cp -r ./static/*.html ./static/css ./static/dist
