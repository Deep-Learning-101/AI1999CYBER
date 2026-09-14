# =========================================================
# 多階段建置 Dockerfile
# 支援 Hugging Face Spaces (PORT=7860) 與 GCP Cloud Run
# =========================================================

# --- 階段一：安裝相依套件 ---
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

# --- 階段二：建置應用程式 ---
FROM node:20-alpine AS builder
RUN apk add --no-cache openssl
WORKDIR /app

# 複製 node_modules 與原始碼
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# 建置時產生 Prisma Client
RUN npx prisma generate

# 建置 Next.js（關閉 telemetry）
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# --- 階段三：生產執行映像 ---
FROM node:20-alpine AS runner
RUN apk add --no-cache openssl
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# 建立非 root 使用者（安全最佳實踐）
RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 nextjs

# 複製建置產出物
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

USER nextjs

# PORT 優先使用環境變數（Cloud Run 注入）；預設 7860（HF Spaces）
ENV PORT=7860
EXPOSE 7860

# 啟動時執行資料庫遷移，再啟動應用
CMD ["sh", "-c", "npx prisma migrate deploy 2>/dev/null || true && node server.js"]
