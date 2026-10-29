# T502 — Dịch lại (nội dung đã sửa): lessons-security-3 (1 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/lessons-security-3.en.js`

Nội dung tiếng Việt của các mục sau trong `js/data/lessons-security.js` đã được sửa SAU khi dịch, nên bản tiếng Anh trong `js/i18n/lessons-security-3.en.js` đã cũ: **lesson-security-003**.

Với MỖI mục trên: đọc bản tiếng Việt hiện tại trong `js/data/lessons-security.js` và DỊCH LẠI toàn bộ entry của nó trong `js/i18n/lessons-security-3.en.js` (thay entry cũ, giữ nguyên key, cùng tập field như các entry khác). Không đụng các mục khác. Code, id, url giữ nguyên; chuỗi tiếng Việt trong code mẫu cũng dịch sang tiếng Anh.
Đọc AGENTS.md mục 5 (markup: không backtick, không `${`).

## Nghiệm thu
node scripts/check-i18n.js lessons-security-3 → OK; node scripts/validate.js → OK.

## Notes
- Dịch lại toàn bộ entry `lesson-security-003` trong `js/i18n/lessons-security-3.en.js` từ bản tiếng Việt hiện tại
  (`js/data/lessons-security.js` dòng ~756–1136): title, 3 goals, body (6 mục + bảng so sánh + 2 code block),
  2 exercise (title/prompt/3 hints/explain), 3 câu check (q/options/answer/explain). Giữ nguyên key, đúng tập field
  như các file `.en.js` khác; không chép `starter`/`tests`/`reference`; id/url không đổi.
- Theo yêu cầu về người đọc (dev Java ~4 năm chưa quen hạ tầng), thêm giải thích một câu ngay lần đầu xuất hiện cho:
  SLA, refill-on-demand, NTP, JVM, monotonic clock, LRU, CAS, Redis, Lua script, jitter, `ArrayDeque`. Không đổi
  bất kỳ khẳng định kỹ thuật / số liệu nào so với bản tiếng Việt.
- Kiểm tra: `node scripts/check-i18n.js lessons-security-3` → OK; `node scripts/validate.js` → OK.
- Còn sót file nháp `.tmp-t502cmp.js` ở thư mục gốc repo (công cụ so sánh VN/EN): shell trong phiên này không được
  phép xoá file nên chưa dọn được — integrator xoá giúp hoặc bỏ qua khi commit.
Reviewed-by: check-i18n (translation, no LLM review)
