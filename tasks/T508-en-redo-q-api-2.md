# T508 — Dịch lại (nội dung đã sửa): q-api-2 (5 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/q-api-2.en.js`

Nội dung tiếng Việt của các mục sau trong `js/data/q-api.js` đã được sửa SAU khi dịch, nên bản tiếng Anh trong `js/i18n/q-api-2.en.js` đã cũ: **api-011, api-013, api-014, api-015, api-016**.

Với MỖI mục trên: đọc bản tiếng Việt hiện tại trong `js/data/q-api.js` và DỊCH LẠI toàn bộ entry của nó trong `js/i18n/q-api-2.en.js` (thay entry cũ, giữ nguyên key, cùng tập field như các entry khác). Không đụng các mục khác. Code, id, url giữ nguyên; chuỗi tiếng Việt trong code mẫu cũng dịch sang tiếng Anh.
Đọc AGENTS.md mục 5 (markup: không backtick, không `${`).

## Nghiệm thu
node scripts/check-i18n.js q-api-2 → OK; node scripts/validate.js → OK.

## Notes
Đã dịch lại 5 mục: api-011 (webhook partner integration), api-013 (REST vs gRPC vs GraphQL), api-014 (API-first OpenAPI), api-015 (Idempotency-Key), api-016 (API versioning & deprecation). Loại bỏ field `tags` và `refs` khỏi bản dịch vì không phải field được dịch. Cả hai script check đều OK.
Reviewed-by: check-i18n (translation, no LLM review)
