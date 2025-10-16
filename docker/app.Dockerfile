FROM node:20-bullseye

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends python3 make g++ \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm config set fetch-retries 5 \
    && npm config set fetch-retry-mintimeout 20000 \
    && npm config set fetch-retry-maxtimeout 120000 \
    && npm install

COPY frontend/package*.json ./frontend/
RUN npm install --prefix frontend

COPY . .

ENV PATH="/app/node_modules/.bin:$PATH"

EXPOSE 3000 5173 8545

CMD ["npm", "start"]
