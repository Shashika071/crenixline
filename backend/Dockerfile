FROM node:20

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Make sure your backend listens on all interfaces
ENV HOST=0.0.0.0
EXPOSE 5000

CMD ["npm", "start"]