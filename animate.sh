#!/usr/bin/env bash

image1=$1
image2=$2
filename=$3

# mostly runs in docker
docker run -v $PWD:/share paulfitz/makesweet \
  --zip templates/heart-locket.zip \
  --start 15 \
  --in images/$1 images/$2 \
  --gif "$filename.gif"

echo "saved in file $filename.gif"
