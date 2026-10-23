# T90 — Nguồn học thêm cho câu khó (đợt 1a: Java, JVM, Spring/DB, SQL, API, Security)

Status: TODO
Agent: opencode
Owns: `js/data/q-java.js`, `js/data/q-concurrency-jvm.js`, `js/data/q-spring-data.js`, `js/data/q-sql.js`, `js/data/q-api.js`, `js/data/q-security.js`

Đọc **AGENTS.md mục 13**.

## Mục tiêu
Với **mọi câu `level: 'lead'`** trong các file trên, thêm field `refs` gồm **2–4 nguồn** giúp người học đào sâu đúng nội dung câu đó (đặt sau field `follow`/`tags`). Ưu tiên 1 tài liệu chính thức + 1 bài/sách kinh điển + 1 video hội thảo nếu bạn **chắc chắn** video đó tồn tại.
**Không** sửa `q`, `a`, `follow` hay câu khác.

## Quy trình
Sau mỗi file: `node --check <file>`, `node scripts/validate.js <file>`, rồi `node scripts/check-links.mjs <file>`. Link nào báo ❌ thì **xoá hoặc thay** bằng link khác đã kiểm tra; video có tên thật khác tên bạn ghi thì sửa `title` cho khớp. Lặp tới khi `hỏng 0`.

## Nghiệm thu
`node scripts/validate.js` → OK và `node scripts/check-links.mjs` → hỏng 0.

## Notes
