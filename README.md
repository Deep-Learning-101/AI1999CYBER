# Deep Learning 101 線上預約平台

社群聚會議題徵集、審核與進度追蹤平台。提交者憑 Magic Link 管理自己的申請，管理員透過秘密路徑審核並推進狀態，全程 Email 通知。

**Deep Learning 101 線上聚會主站**：https://deep-learning-101.github.io/

> 本專案為開源模板，其他社群可 fork 後依下方說明自行部署。

---

## 功能特色

- **議題提交**：填寫標題、摘要、標籤、偏好聚會日（週一～週五）
- **Magic Link 驗證**：無需帳號密碼，憑信箱收到的專屬連結管理申請
- **公開看板**：首頁顯示近期已排定聚會與候選議題
- **候選議題訂閱**：訪客可留 Email，排程後自動收通知
- **進度追蹤時程**：申請者可查看 收件 → 討論中 → 準備中 → 已排程 的流程
- **管理後台**：隱藏路徑 + Admin Key 雙重保護，支援狀態更新、設定聚會日期/連結、刪除
- **Email 通知**：透過 Google Apps Script Webhook 寄送，無需付費 Email 服務
- **嵌入小工具**：`embed/meetup-widget.html` 可直接放入 GitHub Pages

---

## 畫面截圖

| 首頁 | 提交表單 |
|---|---|
| ![首頁](docs/screenshots/001.jpg) | ![提交表單](docs/screenshots/002.jpg) |

| 送出表單確認 | 進度追蹤 |
|---|---|
| ![送出表單](docs/screenshots/003.jpg) | ![進度追蹤](docs/screenshots/004.jpg) |

![管理後台](docs/screenshots/005.jpg)

---

## 技術棧

| 層級 | 技術 |
|---|---|
| 前後端 | Next.js 15 App Router (TypeScript) |
| 樣式 | Tailwind CSS |
| 資料庫 | PostgreSQL (Supabase) + Prisma ORM |
| 部署 | Vercel（推薦）或 Docker (GCP Cloud Run) |
| Email | Google Apps Script Webhook |

---

## 自行部署教學

### 1. Fork 此 repo

點右上角 **Fork**，建立你自己的副本。

### 2. 建立 Supabase 資料庫

1. 前往 [supabase.com](https://supabase.com) 建立新專案
2. 進入 **Project Settings → Database → Connection string**
3. 選 **Session pooler**（Port 5432），複製連線字串
4. 連線字串格式：`postgresql://postgres.xxx:[PASSWORD]@aws-0-xxx.pooler.supabase.com:5432/postgres?sslmode=require`

### 3. 設定環境變數

複製 `.env.example` 為 `.env`，填入以下內容：

```env
# Supabase Session Pooler URL
DATABASE_URL=postgresql://postgres.xxx:[PASSWORD]@aws-0-xxx.pooler.supabase.com:5432/postgres?sslmode=require

# 管理後台密碼（自訂，越長越好）
ADMIN_SECRET_KEY=你的管理員密碼

# 管理後台路徑（自訂難猜的字串，例如 my-secret-panel-2024）
ADMIN_PATH=your-secret-path

# Google Apps Script Webhook URL（見步驟 5）
GAS_WEBHOOK_URL=https://script.google.com/macros/s/xxxxx/exec

# 部署後的網址（Vercel 給的或你的自訂網域）
NEXTAUTH_URL=https://你的部署網址
```

### 4. 初始化資料庫

```bash
npm install
npx prisma db push
```

### 5. 設定 GAS Email 通知

1. 前往 [script.google.com](https://script.google.com) → 新增專案
2. 把 `gas/Code.js` 的內容貼入編輯器
3. **部署 → 新增部署作業 → 網頁應用程式**
   - 執行身分：**我**
   - 誰可以存取：**所有人**
4. 複製部署 URL，填入 `.env` 的 `GAS_WEBHOOK_URL`
5. 若要更新 GAS 程式碼：**部署 → 管理部署作業 → 編輯（鉛筆）→ 建立新版本 → 部署**（URL 不變）

### 6. 部署到 Vercel

1. 前往 [vercel.com](https://vercel.com) 用 GitHub 帳號登入
2. **Add New Project** → 選你 fork 的 repo → Import
3. Framework 自動偵測為 **Next.js**
4. 展開 **Environment Variables**，把步驟 3 的變數全部填入
5. 按 **Deploy**
6. 部署完成後把 Vercel 給的網址填回 `NEXTAUTH_URL` 並重新部署

之後只要 `git push` 到 main，Vercel 會自動重新部署。

### 7. 嵌入小工具（選用）

把 `embed/meetup-widget.html` 放到你的 GitHub Pages repo，修改其中的 API 網址：

```js
return params.get('api') || 'https://你的Vercel網址'
```

或透過 iframe 參數傳入：

```html
<iframe
  src="https://你的GitHubPages/embed/meetup-widget.html?api=https://你的Vercel網址"
  width="100%" height="500" frameborder="0">
</iframe>
```

---

## 管理後台

網址：`https://你的網址/你設定的ADMIN_PATH`

輸入 `ADMIN_SECRET_KEY` 登入後可以：
- 查看所有申請、依狀態篩選
- 更新狀態（等待審核 / 審核中 / 已核准 / 已排程 / 已完成 / 已拒絕）
- 設定聚會日期與線上會議連結
- 刪除申請

> **注意**：`ADMIN_PATH` 建議設成難以猜測的長字串，不要用 `admin`、`manage` 等常見名稱。

---

## 申請者流程

1. 前往首頁 → **提交議題**
2. 填寫表單送出，收到含 Magic Link 的確認信
3. 憑 Magic Link 可隨時修改申請或查看進度
4. 管理員審核通過後，陸續收到 Email 通知
5. 排程確認後，Email 包含聚會日期與連結

---

## 本地開發

```bash
npm install
cp .env.example .env   # 填入你的環境變數
npx prisma db push     # 初始化資料庫
npm run dev            # 啟動 http://localhost:3000
```

---

## License

MIT — 歡迎 fork 使用，若用於公開場合歡迎告知或 star ⭐
