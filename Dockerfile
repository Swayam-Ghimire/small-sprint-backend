# Stage 1 Build Stage
FROM node:24-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install
# to use package-lock.json as a absolute source of truth, npm ci is the command

COPY tsconfig*.json nest-cli.json ./
COPY prisma ./prisma
RUN npm prisma:generate
COPY src ./src
RUN npm run build


# Stage 2 Production Stage

FROM node:24-alpine AS production
WORKDIR /app

# Set Node environment to production
ENV NODE_ENV=production

# Copy package maps again to install ONLY production dependencies
COPY package.json package-lock.json ./
RUN npm ci --only=production

# Reach back into the builder stage and grab the generated Prisma client 
COPY --from=builder /app/node_modules/@prisma/client ./node_modules/@prisma/client

# Reach back into the builder stage and grab ONLY the compiled JavaScript code
COPY --from=builder /app/dist ./dist

# Expose your NestJS port
EXPOSE 3000

# Run the compiled pure JavaScript file directly with Node (much faster)
CMD ["node", "dist/main"]