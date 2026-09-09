FROM node:22-alpine

RUN adduser -D -s /bin/sh sandbox

USER sandbox
WORKDIR /home/sandbox
