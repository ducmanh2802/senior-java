# T513 — Dịch lại (nội dung đã sửa): q-concurrency-jvm-1 (13 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/q-concurrency-jvm-1.en.js`

Nội dung tiếng Việt của các mục sau trong `js/data/q-concurrency-jvm.js` đã được sửa SAU khi dịch, nên bản tiếng Anh trong `js/i18n/q-concurrency-jvm-1.en.js` đã cũ: **concurrency-001, concurrency-002, concurrency-003, concurrency-004, concurrency-005, concurrency-006, concurrency-007, concurrency-008, concurrency-009, concurrency-010, concurrency-011, concurrency-012, concurrency-013**.

Với MỖI mục trên: đọc bản tiếng Việt hiện tại trong `js/data/q-concurrency-jvm.js` và DỊCH LẠI toàn bộ entry của nó trong `js/i18n/q-concurrency-jvm-1.en.js` (thay entry cũ, giữ nguyên key, cùng tập field như các entry khác). Không đụng các mục khác. Code, id, url giữ nguyên; chuỗi tiếng Việt trong code mẫu cũng dịch sang tiếng Anh.
Đọc AGENTS.md mục 5 (markup: không backtick, không `${`).

## Nghiệm thu
node scripts/check-i18n.js q-concurrency-jvm-1 → OK; node scripts/validate.js → OK.

## Notes

- Đã dịch lại toàn bộ 13 entry (concurrency-001 … concurrency-013) từ bản tiếng Việt hiện tại trong `js/data/q-concurrency-jvm.js`, thay thế bản dịch cũ, giữ nguyên key và đúng tập field `q` / `a` / `follow`.
- Nội dung mới viết cho người đọc chưa quen công nghệ: `**Summary:**` → `### Quick intuition` → `### Key terms` (giải thích thuật ngữ lần đầu xuất hiện) → cơ chế từng bước + sơ đồ ASCII/số liệu → `### Common mistakes` (triệu chứng + cách tránh) → `### One-minute spoken answer` → `> Senior tip`.
- Giữ nguyên id, URL, danh sách `follow` (dịch theo bản Việt); chuỗi tiếng Việt trong code mẫu đã dịch sang tiếng Anh, comment trong code cũng bằng tiếng Anh.
- Không dùng backtick, không có `${`; ký tự `\` trong template literal đã escape đúng.
- `node scripts/check-i18n.js q-concurrency-jvm-1` → `OK — 13 mục đã dịch.`
- `node scripts/validate.js` → `OK — không có lỗi.`
- Không commit (theo luật 4 AGENTS.md).
- Reviewed-by: check-i18n (translation, no LLM review)
