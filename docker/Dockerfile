FROM node:10-alpine as builder

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD true

RUN mkdir /source

COPY src /source/src
COPY bin /source/bin
COPY tsconfig.json /source/
COPY package.json /source/
#COPY package-lock.json /source/

RUN cd /source && npm i && npm pack --unsafe-perm && mv *.tgz package.tgz


FROM node:8-alpine

# Installs latest Chromium (68) package.
RUN apk update && apk upgrade && \
    echo @edge http://nl.alpinelinux.org/alpine/edge/community >> /etc/apk/repositories && \
    echo @edge http://nl.alpinelinux.org/alpine/edge/main >> /etc/apk/repositories && \
    apk add --no-cache \
    chromium@edge \
    nss@edge


# Tell Puppeteer to skip installing Chrome. We'll be using the installed package.
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD true


# Add user so we don't need --no-sandbox.
RUN mkdir /critical && mkdir /static

COPY --from=builder /source/package.tgz /

RUN npm i -g /package.tgz && rm package.tgz

RUN addgroup -S pptruser && adduser -S -g pptruser pptruser \
    && mkdir -p /home/pptruser/Downloads \
    && chown -R pptruser:pptruser /home/pptruser \
    && chown -R pptruser:pptruser /static \
    && chown -R pptruser:pptruser /critical

# Run everything after as non-privileged user.
USER pptruser

VOLUME /critical.config.js
# This is were the critical is written to
VOLUME /critical
# Criticals needs styling from frontend and bolighed-styling
VOLUME /static

# , "--chromium-args", "disable-dev-shm-usage", "headless", "disable-gpu"
ENTRYPOINT [ "/usr/local/bin/bo-critical", "--chromium-executable", "/usr/bin/chromium-browser"]

