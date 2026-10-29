# T531 — Dịch lại (nội dung đã sửa): q-java-6 (3 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/q-java-6.en.js`

Nội dung tiếng Việt của các mục sau trong `js/data/q-java.js` đã được sửa SAU khi dịch, nên bản tiếng Anh trong `js/i18n/q-java-6.en.js` đã cũ: **collections-018, modern-011, modern-015**.

Với MỖI mục trên: đọc bản tiếng Việt hiện tại trong `js/data/q-java.js` và DỊCH LẠI toàn bộ entry của nó trong `js/i18n/q-java-6.en.js` (thay entry cũ, giữ nguyên key, cùng tập field như các entry khác). Không đụng các mục khác. Code, id, url giữ nguyên; chuỗi tiếng Việt trong code mẫu cũng dịch sang tiếng Anh.
Đọc AGENTS.md mục 5 (markup: không backtick, không `${`).

## Nghiệm thu
node scripts/check-i18n.js q-java-6 → OK; node scripts/validate.js → OK.

## Notes
- Đã soát đối chiếu từng dòng: so với lần dịch T164, phần chữ (q/a/follow) của 3 mục này **không đổi**; thay đổi duy nhất trong `js/data/q-java.js` (commit 817165e) là bỏ `refs` — field không được dịch. Dù vậy vẫn dịch lại toàn bộ 3 entry theo bản tiếng Việt hiện tại, viết lại câu chữ cho rõ ràng, giữ nguyên key/thứ tự field (q, a, follow) và toàn bộ code/id.
- Sửa 2 lỗi nhỏ phát hiện khi dịch lại: `{{List<Integer}}` thiếu `>` trong follow của collections-018 (nay là `{{List<Integer>}}`); modern-015 bổ sung ý "(SIZED)" của bản tiếng Việt (nguồn biết trước số phần tử nên `count()` bỏ qua duyệt).
- Đã chạy: `node scripts/check-i18n.js q-java-6` → `OK — 8 mục đã dịch.`; `node scripts/validate.js` → `OK — không có lỗi.`
- Còn 1 file nháp chưa theo dõi `tmp-t531-compare.js` ở thư mục gốc (script so sánh VN/EN dùng khi kiểm tra, không phải file dự án); shell trong phiên này chặn lệnh xoá nên người tích hợp xoá giúp, đừng commit.

Reviewed-by: check-i18n (translation, no LLM review)
