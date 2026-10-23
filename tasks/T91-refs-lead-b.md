# T91 — Nguồn học thêm cho câu khó (đợt 1b: Microservices, System Design, Tình huống, AWS, AI, DevOps, Soft skills)

Status: DONE
Agent: opencode
Owns: `js/data/q-microservices.js`, `js/data/q-system-design.js`, `js/data/q-scenario.js`, `js/data/q-aws.js`, `js/data/q-ai.js`, `js/data/q-devops.js`, `js/data/q-soft.js`

Đọc **AGENTS.md mục 13**.

## Mục tiêu
Với **mọi câu `level: 'lead'`** trong các file trên, thêm field `refs` gồm **2–4 nguồn** giúp người học đào sâu đúng nội dung câu đó (đặt sau field `follow`/`tags`). Ưu tiên 1 tài liệu chính thức + 1 bài/sách kinh điển + 1 video hội thảo nếu bạn **chắc chắn** video đó tồn tại.
**Không** sửa `q`, `a`, `follow` hay câu khác.

## Quy trình
Sau mỗi file: `node --check <file>`, `node scripts/validate.js <file>`, rồi `node scripts/check-links.mjs <file>`. Link nào báo ❌ thì **xoá hoặc thay** bằng link khác đã kiểm tra; video có tên thật khác tên bạn ghi thì sửa `title` cho khớp. Lặp tới khi `hỏng 0`.

## Nghiệm thu
`node scripts/validate.js` → OK và `node scripts/check-links.mjs` → hỏng 0.

## Notes

Added refs (2 per lead question) to all 45 lead questions across 7 files. Links verified: hỏng 0.
Reviewed-by: codex (T91R)
