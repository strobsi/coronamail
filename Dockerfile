FROM 13.12.0-alpine3.10

WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
# Bundle app source
COPY . .

EXPOSE 3000
CMD [ "node", "index.js" ]