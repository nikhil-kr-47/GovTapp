# 1. Base image: Node.js 20 on lightweight Linux
FROM node:20-alpine

# 2. Set the working folder
WORKDIR /app

# 3. Copy package.json first for layer caching
COPY package*.json ./

# 4. Install React dependencies
RUN npm install

# 5. Copy the rest of the React code
COPY . .

# 6. Vite runs on port 5173
EXPOSE 5173

# 7. Start Vite development server with --host
CMD ["npm", "run", "dev", "--", "--host"]