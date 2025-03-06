## 環境建置

- 安裝並啟用 Supabase。
- 安裝並啟用 Redis。
- GitHub 端要做 OAuth 的設定，範例資料可以看 [GitHub-OAuth-Local端範例.png](./documents/GitHub-OAuth-Local端範例.png)
- 複製 ```.env.example``` 檔案，重新命名成 ```.env```，並填入所有的參數。
- 此架構是前後端分離的，接下來後續的前端環境建置請參考專案【dilab-notebook-paradise】。
- 安裝 Node.js。
- ```npm install```

---

## 執行開發

- ```npm run start```

---

## 技術棧（Tech-Stack）

- 前端：（請參考專案 ```dilab-notebook-paradise```）。
- 後端：Fastify.js, Redis, Supabase, GitHub OAuth
- Proxy：敬請期待

---

## 筆記

- 關於此系統的架構，請參考 [ArchitectureDraft.drawio](./documents/architecture/ArchitectureDraft.drawio) 。
- 原本是想用自架的 Supabase OAuth 功能去登入 GitHub，但設定方法太複雜了，改用 Fastify/OAuth2 plugin 去登入。
- 此專案有兩個 JWT key，一個是用在 Fastify 登入後授權用的，另一個是 Supabase 的（這個可能不會用到，但還是留著）。
- 此專案的 JWT 是用 ```HttpOnly Cookies 做傳遞，所以有再額外設定 CORS。```因此，.env 的 FRONT_APP_BASE_URL 參數會拿來用於設定為 CORS 的前端選項。
- 關於建立 Supabase 的 Tables，請參考 [sql_definitions](./sql_definitions)。

[//]: # (- 請注意！User 資料存在 Redis 的 ID 跟 Supabase 的 ID 不一樣。或許未來該整合為一。)
[//]: # (- [experiments]&#40;./experiments&#41; 資料夾都只是實驗用而已，可以忽略。)

---

## 解決的錯誤

- Fastify-OAuth2，原本一直出現 Invalid State Error 500，最後根據這篇論壇對話找出解方：[fastify_oauth2_invalid_state_500.pdf](./documents/fixed_errors_note/fastify_oauth2_invalid_state_500.pdf)。

---

## TODO

- 改用 S3 Storage 存取使用者筆記，取代傳統資料夾存取（可以研究看看 Supabase 的 S3 Storage 支援）。
- ~~OAuth2 登入後建立 Token，建立在 Redis 儲存，並且加入 HttpOnly Cookies。~~
- 遷移舊 Flask 版的上傳功能。
- 篩選只有限定使用者的 GitHub 帳號可以登入。
- 實驗如果 Token 過期了會發生什麼事。
- 設計更好的 Foreign Keys 規則去連接使用者帳號跟上傳筆記。
- 將 Supabase 的使用者 ID 跟 Redis 的使用者 ID 整合為一。
- 在 Supabase 建立 enum type 取代字串去儲存使用者的帳號類型（default, github）。
- 確認避免使用者上傳的資料夾中有重複資料夾名。
- 儲存檔案，不只到 backup 資料夾，也儲存 + 解壓縮到主要儲存夾。
- 改變現在的使用者 Table 與資料結構，統一成一個 User Table 有多種不同登入方式的使用者。 
- 使用 Enum 去儲存使用者類型（GitHub, Default etc.）。
- 在 TypeScript 宣告 Supabase 中各 Table 的類別，提高資料的判別度。
- 現在每次接收新上傳的筆記都會重複額外存一份備份的，等同於做了兩次。以後看有什麼更好的做法。
