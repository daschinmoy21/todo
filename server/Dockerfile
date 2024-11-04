FROM node:16-slim

RUN apt-get update && apt-get install -y \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

RUN groupadd -r nodejs && \
    useradd -r -g nodejs -m nodejs && \
    mkdir -p /usr/src/app && \
    chown -R nodejs:nodejs /usr/src/app

WORKDIR /usr/src/app

USER nodejs

COPY --chown=nodejs:nodejs package*.json ./

RUN npm install --omit=dev

COPY --chown=nodejs:nodejs . .

ENV NODE_ENV=production \
    PORT=5000

HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD node healthcheck.js

EXPOSE 5000

CMD ["npm", "start"] 