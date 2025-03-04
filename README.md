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
