FROM node:alpine

WORKDIR /app
COPY viewer/package.json package.json
RUN npm install

COPY viewer/ /app
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]