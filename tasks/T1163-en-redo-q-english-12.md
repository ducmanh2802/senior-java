# T1163 — Dịch lại (nội dung đã sửa): q-english-12 (8 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/q-english-12.en.js`

Nội dung tiếng Việt của các mục sau trong `js/data/q-english.js` đã được sửa SAU khi dịch, nên bản tiếng Anh trong `js/i18n/q-english-12.en.js` đã cũ: **english-106, english-107, english-108, english-109, english-110, english-111, english-112, english-113**.

Với MỖI mục trên: đọc bản tiếng Việt hiện tại trong `js/data/q-english.js` và DỊCH LẠI toàn bộ entry của nó trong `js/i18n/q-english-12.en.js` (thay entry cũ, giữ nguyên key, cùng tập field như các entry khác). Không đụng các mục khác. Code, id, url giữ nguyên; chuỗi tiếng Việt trong code mẫu cũng dịch sang tiếng Anh.
Đọc AGENTS.md mục 5 (markup: không backtick, không `${`).

## Nghiệm thu
node scripts/check-i18n.js q-english-12 → OK; node scripts/validate.js → OK.

## Notes
- Đã đọc bản tiếng Việt hiện tại cho `english-106..113` trong `js/data/q-english.js` và dịch lại toàn bộ 8 entry trong `js/i18n/q-english-12.en.js` (giữ nguyên key/field: `q`, `a`, `follow`; `id/topic/level/lang` không thuộc i18n overlay). Chỉ sửa file sở hữu.
- Tuân thủ markup (không backtick, không `${`); code block dùng `~~~text` như bản gốc; giữ `{{...}}` inline code.
- Đã chạy: `node --check js/i18n/q-english-12.en.js` (OK), `node scripts/check-i18n.js q-english-12` → "OK — 8 mục đã dịch", `node scripts/build-light-index.js` (cập nhật `js/data/index-light.js`), `node scripts/validate.js` → **LỖI nhưng không liên quan file sở hữu** (31 lỗi có sẵn ở `lessons-sql.js`, `lessons-api.js`, `projects.js`, `path.js` do `related/path` trỏ tới `api-*` không tồn tại). Không sửa file ngoài phạm vi.
Reviewed-by: check-i18n (translation, no LLM review)
