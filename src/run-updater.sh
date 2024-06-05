#!/bin/bash

# this is just a temporary measure to get the thing updating prices on my system. i'm on windows so cron isnt easy
# but i can use this in git-bash.

while true
do
  npx ts-node src/get-latest-quotes.ts
  sleep 60
done