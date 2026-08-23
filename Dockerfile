# =========================
# Stage 1: Build
# =========================
FROM node:24-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci

COPY tsconfig*.json nest-cli.json ./
COPY prisma.config.ts ./
COPY prisma ./prisma

# Generate Prisma Client
RUN npx prisma generate

COPY src ./src

# Build NestJS
RUN npm run build

# =========================
# Stage 2: Production
# =========================
FROM node:24-alpine AS production

WORKDIR /app

ENV NODE_ENV=production

COPY package.json package-lock.json ./

# Install production dependencies only
RUN npm ci --omit=dev --ignore-scripts

# Copy generated Prisma Client
COPY --from=builder /app/generated ./generated

# Copy compiled NestJS application
COPY --from=builder /app/dist ./dist

EXPOSE 3000

CMD ["node", "dist/src/main.js"]