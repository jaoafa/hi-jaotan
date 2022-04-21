FROM node:18

WORKDIR /hi-jaotan

COPY . .
COPY config config

RUN pwd;find . | sort | sed '1d;s/^\.//;s/\/\([^/]*\)$/|--\1/;s/\/[^/|]*/|  /g'

RUN yarn
RUN apt -y update
RUN apt-get -y install python3 python3-venv
RUN chmod 777 ./run.sh

ENTRYPOINT ./run.sh