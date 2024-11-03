FROM node:16

WORKDIR /usr/src/app

# Add node user and set ownership
RUN chown -R node:node /usr/src/app

# Switch to node user
USER node

# Copy package files as node user
COPY --chown=node:node package*.json ./

# Install dependencies as node user
RUN npm install

# Copy rest of the files as node user
COPY --chown=node:node . .

EXPOSE 3000

CMD ["npm", "start"] 