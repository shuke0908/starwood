FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

COPY . .

# SvelteKit dev server usually runs on 5173
CMD ["npm", "run", "dev", "--", "--host"]
