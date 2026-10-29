# T498 — Dịch lại (nội dung đã sửa): lessons-modern-1 (4 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/lessons-modern-1.en.js`

Nội dung tiếng Việt của các mục sau trong `js/data/lessons-modern.js` đã được sửa SAU khi dịch, nên bản tiếng Anh trong `js/i18n/lessons-modern-1.en.js` đã cũ: **lesson-modern-001, lesson-modern-002, lesson-modern-003, lesson-modern-004**.

Với MỖI mục trên: đọc bản tiếng Việt hiện tại trong `js/data/lessons-modern.js` và DỊCH LẠI toàn bộ entry của nó trong `js/i18n/lessons-modern-1.en.js` (thay entry cũ, giữ nguyên key, cùng tập field như các entry khác). Không đụng các mục khác. Code, id, url giữ nguyên; chuỗi tiếng Việt trong code mẫu cũng dịch sang tiếng Anh.
Đọc AGENTS.md mục 5 (markup: không backtick, không `${`).

## Nghiệm thu
node scripts/check-i18n.js lessons-modern-1 → OK; node scripts/validate.js → OK.

## Notes

- Đã dịch lại toàn bộ 4 entry (001–004) trong `js/i18n/lessons-modern-1.en.js` theo bản tiếng Việt hiện tại: bổ sung chi tiết mới của 001 (xử lý theo chiều dọc, encounter order, `unordered()`, cấu hình commonPool, TreeMap, key sắp xếp trong bài tập), 002 (map trả null → empty, orElseThrow Java 10, đánh giá đối số trước khi gọi, hậu quả production), 003 (compact constructor gán field, bất biến nông, quy tắc final/sealed/non-sealed, record pattern, case null, lợi ích khi thêm subtype) và 004 (SAM, target typing/invokedynamic, bảng functional interface + method reference, compose vs andThen, effectively final giải thích sâu, NPE với `obj::foo`, Comparator nâng cao).
- Mã mẫu trong `body` đã dịch chuỗi tiếng Việt ("loc" → "check", biến `theoKhachHang` → `byCustomer`); starter/tests/reference giữ nguyên như các entry khác. Prompt bài tập 002 nhắc "literal mặc định mà test yêu cầu" để không chép code tiếng Việt vào file dịch.
- Nghiệm thu: `node scripts/check-i18n.js lessons-modern-1` → OK (4 mục); `node scripts/validate.js` → OK — không có lỗi.
Reviewed-by: check-i18n (translation, no LLM review)
