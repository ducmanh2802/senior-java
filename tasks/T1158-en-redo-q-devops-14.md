# T1158 — Dịch lại (nội dung đã sửa): q-devops-14 (1 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/q-devops-14.en.js`

Nội dung tiếng Việt của các mục sau trong `js/data/q-devops.js` đã được sửa SAU khi dịch, nên bản tiếng Anh trong `js/i18n/q-devops-14.en.js` đã cũ: **devops-074**.

Với MỖI mục trên: đọc bản tiếng Việt hiện tại trong `js/data/q-devops.js` và DỊCH LẠI toàn bộ entry của nó trong `js/i18n/q-devops-14.en.js` (thay entry cũ, giữ nguyên key, cùng tập field như các entry khác). Không đụng các mục khác. Code, id, url giữ nguyên; chuỗi tiếng Việt trong code mẫu cũng dịch sang tiếng Anh.
Đọc AGENTS.md mục 5 (markup: không backtick, không `${`).

## Nghiệm thu
node scripts/check-i18n.js q-devops-14 → OK; node scripts/validate.js → OK.

## Notes
- Re-translated `devops-074` in `js/i18n/q-devops-14.en.js` from the updated Vietnamese entry in `js/data/q-devops.js` (lead, load testing before go-live).
- Kept key `devops-074`, `q`/`a`/`follow`/`tags` fields aligned with other entries; preserved code/ids/config values; translated Vietnamese strings/comments in the k6 code example to English.
- Followed markup rules (no backticks, no `${`); kept `{{...}}` inline code.
- Verified: `node --check js/i18n/q-devops-14.en.js`, `node scripts/check-i18n.js q-devops-14` OK, `node scripts/validate.js` OK. No git commands run.
Reviewed-by: check-i18n (translation, no LLM review)
