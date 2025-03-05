## 主旨

這些是專案所使用的 Supabase Table 定義，可以使用這些 SQL 檔在 Supabase 快速建立 Table。請執行所有的 .sql 檔建立需要的 Tables。

## 筆記

- 所有 .sql 檔對應到的 Table：
  - [dilab_github_users_rows.sql](./dilab_github_users_rows.sql)：GitHub 使用者帳號超資料。
  - [dilab_user_upload_notes_rows.sql](./dilab_user_upload_notes_rows.sql)：使用者上傳的每個筆記超資料。
- 要尋找並建立新的 GitHub 使用者到 Table 的話，可以使用 https://api.github.com/users/你的-GitHub-username
  - 範例：https://api.github.com/users/john123
  - 如何找尋 GitHub username:
    - 在 GitHub 右上角，按下個人頭像，查詢個人資料。
