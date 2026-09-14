# 社群議題媒合與工單追蹤系統 (Community Topic Tracker) - 開發指引

本專案為開源的社群聚會議題徵集與進度追蹤平台，支援 Docker 容器化部屬至 Hugging Face Spaces 與 GCP Cloud Run。

## 技術棧 (Tech Stack)
- 前後端整合：Next.js (App Router, TypeScript) 或 FastAPI + React (Tailwind CSS, Lucide-react)
- 資料庫與 ORM：PostgreSQL (Supabase / Neon), Prisma ORM
- 容器化：Docker (Multi-stage build, 暴露 PORT 7860/8080)
- 外部通知：Google Apps Script Webhook 或 Resend (寄送進度更新信件)

## 核心資料隱私與權限規則 (Security & Privacy)
1. **個資隔離**：申請者的「真實姓名/公司/公司 Email」僅後台管理者與本人可見，公開首頁僅顯示「暱稱、題目摘要、標籤、進度狀態、線上會議日期與連結」。
2. **免傳統密碼登入 (Magic Link / Access Token)**：申請者送出表單後，產生一組隨機 UUID `access_token` 並自動發信到其 Email。申請者憑該 Token 登入檢視或修訂自己的議題，降低帳密外洩風險。
3. **環境變數管理**：所有金鑰（`DATABASE_URL`, `ADMIN_SECRET_KEY`, `GAS_WEBHOOK_URL`）嚴格依賴 `.env`，嚴禁 Hard-code 於原始碼中。

## 常用指令 (Commands)
- 安裝套件：`npm install`
- 本地開發：`npm run dev`
- 資料庫遷移：`npx prisma db push` 或 `npx prisma migrate dev`
- 本地 Docker 測試：`docker build -t app . && docker run -p 7860:7860 --env-file .env app`

## 程式碼撰寫風格 (Coding Guidelines)
- 所有註解、Commit 訊息、文件均使用繁體中文。
- 採用嚴格型別定義（TypeScript Strict Mode 或 Python Type Hints）。
- API 統一回傳格式：`{ success: boolean, data?: any, error?: string }`。