#!/bin/bash
RESPONSE=\
if [ " \\ != \302\ ]; then
 echo \[01/17/2026 18:03:28] Health check failed: \. Restarting app...\
 cd /home/ubuntu/accufin-final
 pm2 restart accufin
 pm2 save
else
 echo \[01/17/2026 18:03:28] Health check passed: 302\
fi
