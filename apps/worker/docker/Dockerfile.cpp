FROM alpine:3.20

RUN apk add --no-cache g++ && \
    adduser -D -s /bin/sh sandbox

USER sandbox
WORKDIR /home/sandbox
