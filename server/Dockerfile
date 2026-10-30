
# 1. Start with a tiny, clean Linux box with Node.js 20 installed
FROM node:22-alpine

# 2. Inside this box, go to a folder named /app
WORKDIR /app

# 3. Copy our package.json so the box knows what libraries we need
COPY package*.json ./

# 4. Install those libraries inside the Linux box
RUN npm install

# 5. Copy Prisma schema so Prisma can generate its client
COPY prisma ./prisma
RUN npx prisma generate

# 6. Copy the rest of our server code into the box
COPY . .

# 7. Document that the server listens on port 8000
EXPOSE 8000

# 8. Start the server!
CMD ["node", "--experimental-strip-types", "app.js"]