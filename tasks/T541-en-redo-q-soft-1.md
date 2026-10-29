# T541 — Dịch lại (nội dung đã sửa): q-soft-1 (1 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/q-soft-1.en.js`

Nội dung tiếng Việt của các mục sau trong `js/data/q-soft.js` đã được sửa SAU khi dịch, nên bản tiếng Anh trong `js/i18n/q-soft-1.en.js` đã cũ: **testing-009**.

Với MỖI mục trên: đọc bản tiếng Việt hiện tại trong `js/data/q-soft.js` và DỊCH LẠI toàn bộ entry của nó trong `js/i18n/q-soft-1.en.js` (thay entry cũ, giữ nguyên key, cùng tập field như các entry khác). Không đụng các mục khác. Code, id, url giữ nguyên; chuỗi tiếng Việt trong code mẫu cũng dịch sang tiếng Anh.
Đọc AGENTS.md mục 5 (markup: không backtick, không `${`).

## Nghiệm thu
node scripts/check-i18n.js q-soft-1 → OK; node scripts/validate.js → OK.

## Notes
- Đã dịch lại toàn bộ entry `testing-009` trong `js/i18n/q-soft-1.en.js` theo bản tiếng Việt hiện tại (`js/data/q-soft.js`), giữ nguyên key và cùng tập field `q` / `a` / `follow` như các entry khác.
- Cập nhật các điểm mới của bản VI: phần Tóm tắt (flaky test là nợ kỹ thuật của cả team, nguyên nhân có thể ở test/code/hạ tầng CI), tầng 5 E2E dùng Playwright/REST Assured, bước 4 nói rõ quá hạn thì xoá và viết lại ở tầng thấp hơn ổn định hơn, cùng câu hỏi follow về sharding và môi trường CI/local.
- Code block giữ nguyên mã; comment trong code mẫu đã dịch sang tiếng Anh theo yêu cầu. Không có backtick hay `${` trong nội dung.
- Kiểm tra: `node scripts/check-i18n.js q-soft-1` → OK (10 mục); `node scripts/validate.js` → OK — không có lỗi.
Reviewed-by: check-i18n (translation, no LLM review)
