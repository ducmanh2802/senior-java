# T533 — Dịch lại (nội dung đã sửa): q-kotlin-1 (4 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/q-kotlin-1.en.js`

Nội dung tiếng Việt của các mục sau trong `js/data/q-kotlin.js` đã được sửa SAU khi dịch, nên bản tiếng Anh trong `js/i18n/q-kotlin-1.en.js` đã cũ: **kotlin-004, kotlin-005, kotlin-007, kotlin-010**.

Với MỖI mục trên: đọc bản tiếng Việt hiện tại trong `js/data/q-kotlin.js` và DỊCH LẠI toàn bộ entry của nó trong `js/i18n/q-kotlin-1.en.js` (thay entry cũ, giữ nguyên key, cùng tập field như các entry khác). Không đụng các mục khác. Code, id, url giữ nguyên; chuỗi tiếng Việt trong code mẫu cũng dịch sang tiếng Anh.
Đọc AGENTS.md mục 5 (markup: không backtick, không `${`).

## Nghiệm thu
node scripts/check-i18n.js q-kotlin-1 → OK; node scripts/validate.js → OK.

## Notes

- Dịch lại toàn bộ 4 entry theo bản tiếng Việt hiện tại (commit 61000af): kotlin-004 (thêm đoạn pinning của virtual thread trong `synchronized`, JDK 21–23, JEP 491 ở JDK 24), kotlin-005 (kotlin-jpa là preset no-arg, không tự mở class; thêm khối `allOpen` với `jakarta.persistence.*`; no-arg synthetic không chạy property initializer/`init` trừ `invokeInitializers`), kotlin-007 (thêm `File.useLines`, không trả lazy pipeline ra ngoài scope resource), kotlin-010 (rà lại toàn bộ, nội dung khớp).
- Sửa thêm kotlin-008 bị hỏng từ lần chạy trước bị gián đoạn: câu trả lời bị cắt giữa mục "Production pitfalls" và dính marker rác `=== kotlin-009 ===`; đã viết lại phần đuôi (2 bullet còn thiếu + Senior tip) và sửa lại `follow` (đang lẫn câu hỏi về sealed class).
- Không đổi id, code mẫu (chỉ dịch comment), không thêm field lạ.
- Đã chạy: `node scripts/check-i18n.js q-kotlin-1` → OK (10 mục); `node scripts/validate.js` → OK — không có lỗi.
Reviewed-by: check-i18n (translation, no LLM review)
