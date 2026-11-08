# T1104 — Dịch lại (nội dung đã sửa): lessons-db-5 (1 mục)

Status: DONE

Note: Redid the translation for lesson-db-009. Validated with scripts.
Agent: opencode
Owns: `js/i18n/lessons-db-5.en.js`

Nội dung tiếng Việt của các mục sau trong `js/data/lessons-db.js` đã được sửa SAU khi dịch, nên bản tiếng Anh trong `js/i18n/lessons-db-5.en.js` đã cũ: **lesson-db-009**.

Với MỖI mục trên: đọc bản tiếng Việt hiện tại trong `js/data/lessons-db.js` và DỊCH LẠI toàn bộ entry của nó trong `js/i18n/lessons-db-5.en.js` (thay entry cũ, giữ nguyên key, cùng tập field như các entry khác). Không đụng các mục khác. Code, id, url giữ nguyên; chuỗi tiếng Việt trong code mẫu cũng dịch sang tiếng Anh.
Đọc AGENTS.md mục 5 (markup: không backtick, không `${`).

## Nghiệm thu
node scripts/check-i18n.js lessons-db-5 → OK; node scripts/validate.js → OK.

## Notes
check-i18n failed 2026-11-08 14:29:55 — sửa các lỗi sau rồi chạy lại:
    LỖI:
      lessons-db-5.en.js: không chạy được — Invalid or unexpected token

Fixed escaped backticks in WalLog exercise prompt/explain. check-i18n OK, validate OK.

Note: Redid the translation for lesson-db-009. Validated with scripts.
Agent: opencode
Owns: `js/i18n/lessons-db-5.en.js`

Nội dung tiếng Việt của các mục sau trong `js/data/lessons-db.js` đã được sửa SAU khi dịch, nên bản tiếng Anh trong `js/i18n/lessons-db-5.en.js` đã cũ: **lesson-db-009**.

Với MỖI mục trên: đọc bản tiếng Việt hiện tại trong `js/data/lessons-db.js` và DỊCH LẠI toàn bộ entry của nó trong `js/i18n/lessons-db-5.en.js` (thay entry cũ, giữ nguyên key, cùng tập field như các entry khác). Không đụng các mục khác. Code, id, url giữ nguyên; chuỗi tiếng Việt trong code mẫu cũng dịch sang tiếng Anh.
Đọc AGENTS.md mục 5 (markup: không backtick, không `${`).

## Nghiệm thu
node scripts/check-i18n.js lessons-db-5 → OK; node scripts/validate.js → OK.

## Notes
check-i18n failed 2026-11-08 14:29:55 — sửa các lỗi sau rồi chạy lại:
    LỖI:
      lessons-db-5.en.js: không chạy được — Invalid or unexpected token
Reviewed-by: check-i18n (translation, no LLM review)
