# Deep Learning 101 線上預約平台 - 開發指引

**專案名稱**：Deep Learning 101 線上預約
**主站網址**：https://deep-learning-101.github.io/
**平台用途**：Deep Learning 101 社群的線上聚會議題徵集、審核與進度追蹤平台

本專案為開源模板，其他社群可 fork 後自行部署使用。部署目標為 Vercel（主要）或 Docker（GCP Cloud Run）。

## 技術棧 (Tech Stack)
- 前後端整合：Next.js 15 App Router (TypeScript)
- 樣式：Tailwind CSS
- 資料庫與 ORM：PostgreSQL (Supabase), Prisma ORM
- 部署：Vercel（推薦）或 Docker（GCP Cloud Run）
- 外部通知：Google Apps Script Webhook（寄送進度更新信件）

## 核心資料隱私與權限規則 (Security & Privacy)
1. **個資隔離**：申請者的「真實姓名/公司/公司 Email」僅後台管理者與本人可見，公開首頁僅顯示「暱稱、題目摘要、標籤、進度狀態、線上會議日期與連結」。
2. **免傳統密碼登入 (Magic Link / Access Token)**：申請者送出表單後，產生一組隨機 UUID `access_token` 並自動發信到其 Email。申請者憑該 Token 登入檢視或修訂自己的議題，降低帳密外洩風險。
3. **環境變數管理**：所有金鑰（`DATABASE_URL`, `ADMIN_SECRET_KEY`, `GAS_WEBHOOK_URL`）嚴格依賴 `.env`，嚴禁 Hard-code 於原始碼中。

## 常用指令 (Commands)
- 安裝套件：`npm install`
- 本地開發：`npm run dev`
- 資料庫遷移：`npx prisma db push` 或 `npx prisma migrate dev`
- 部署到 Vercel：`vercel`（或透過 Vercel Dashboard 連結 GitHub repo 自動部署）
- 本地 Docker 測試：`docker build -t app . && docker run -p 7860:7860 --env-file .env app`

## 程式碼撰寫風格 (Coding Guidelines)
- 所有註解、Commit 訊息、文件均使用繁體中文。
- 採用嚴格型別定義（TypeScript Strict Mode 或 Python Type Hints）。
- API 統一回傳格式：`{ success: boolean, data?: any, error?: string }`。