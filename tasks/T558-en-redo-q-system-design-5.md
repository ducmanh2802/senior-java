# T558 — Dịch lại (nội dung đã sửa): q-system-design-5 (3 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/q-system-design-5.en.js`

Nội dung tiếng Việt của các mục sau trong `js/data/q-system-design.js` đã được sửa SAU khi dịch, nên bản tiếng Anh trong `js/i18n/q-system-design-5.en.js` đã cũ: **design-019, design-020, design-021**.

Với MỖI mục trên: đọc bản tiếng Việt hiện tại trong `js/data/q-system-design.js` và DỊCH LẠI toàn bộ entry của nó trong `js/i18n/q-system-design-5.en.js` (thay entry cũ, giữ nguyên key, cùng tập field như các entry khác). Không đụng các mục khác. Code, id, url giữ nguyên; chuỗi tiếng Việt trong code mẫu cũng dịch sang tiếng Anh.
Đọc AGENTS.md mục 5 (markup: không backtick, không `${`).

## Nghiệm thu
node scripts/check-i18n.js q-system-design-5 → OK; node scripts/validate.js → OK.

## Notes
Đã dịch lại 3 mục: design-019 (log/metrics tập trung), design-020 (phát hiện gian lận realtime), design-021 (OTP/2FA ngân hàng). Chỉ giữ các field được phép dịch (q, a, follow), bỏ tags và refs theo quy định check-i18n. Cả hai script đều pass.
