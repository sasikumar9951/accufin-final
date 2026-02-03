#!/bin/bash
cd /home/ubuntu/accufin-final
export $(cat .env | xargs)
exec npm start
