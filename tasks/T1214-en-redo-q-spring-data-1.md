# T1214 — Dịch lại (nội dung đã sửa): q-spring-data-1 (6 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/q-spring-data-1.en.js`

Nội dung tiếng Việt của các mục sau trong `js/data/q-spring-data.js` đã được sửa SAU khi dịch, nên bản tiếng Anh trong `js/i18n/q-spring-data-1.en.js` đã cũ: **spring-001, spring-003, spring-004, spring-005, spring-006, spring-011**.

Đã dịch lại toàn bộ entry của 6 mục trên (key và tập field giữ nguyên; code, id, url giữ nguyên; chuỗi tiếng Việt trong code mẫu/comment dịch sang tiếng Anh). Các mục khác không đụng.

## Nghiệm thu
- `node scripts/check-i18n.js q-spring-data-1` → OK — 11 mục đã dịch.
- `node --check js/i18n/q-spring-data-1.en.js` → SYNTAX_OK.
- `node scripts/validate.js` → các lỗi báo ra đều nằm trong file không sở hữu của task này (`lessons-api.js`, `lessons-sql.js`, `projects.js`, `path.js`, về id `api-XXX` không tồn tại), không liên quan đến file của task; không có lỗi nào tham chiếu `q-spring-data` / `spring-00x`. Không được sửa file của task khác theo quy tắc 3 AGENTS.md.

## Notes
validate.js không in OK toàn cục do lỗi cũ trong file khác sở hữu (không do task này gây ra); i18n chunk của task này đã validate sạch.
Reviewed-by: check-i18n (translation, no LLM review)
