# T530 — Dịch lại (nội dung đã sửa): q-java-5 (4 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/q-java-5.en.js`

Nội dung tiếng Việt của các mục sau trong `js/data/q-java.js` đã được sửa SAU khi dịch, nên bản tiếng Anh trong `js/i18n/q-java-5.en.js` đã cũ: **core-021, core-023, core-024, core-025**.

Với MỖI mục trên: đọc bản tiếng Việt hiện tại trong `js/data/q-java.js` và DỊCH LẠI toàn bộ entry của nó trong `js/i18n/q-java-5.en.js` (thay entry cũ, giữ nguyên key, cùng tập field như các entry khác). Không đụng các mục khác. Code, id, url giữ nguyên; chuỗi tiếng Việt trong code mẫu cũng dịch sang tiếng Anh.
Đọc AGENTS.md mục 5 (markup: không backtick, không `${`).

## Nghiệm thu
node scripts/check-i18n.js q-java-5 → OK; node scripts/validate.js → OK.

## Notes
Đã dịch lại 4 mục core-021, core-023, core-024, core-025 theo bản tiếng Việt hiện tại; core-022 và các mục khác giữ nguyên.
- Kiểm chứng thay đổi nguồn: `git diff 9f1eea8 HEAD -- js/data/q-java.js` cho thấy sau khi dịch chỉ có `refs` của đúng 4 mục này bị sửa (bỏ JEP 444 / Java Object Specification), q/a/follow không đổi — nên đây là lần dịch lại đầy đủ, đồng thời viết lại theo chuẩn người đọc mới (giải thích thuật ngữ ở lần đầu: signature, covariant return, checked exception, vtable, invokestatic/invokevirtual, type erasure, boxing/widening, frame, operand stack, Metaspace, escape analysis/scalar replacement, virtual thread pinning), thêm sơ đồ ASCII bộ nhớ cho core-025 và sơ đồ giá trị trả về cho core-023.
- Code mẫu giữ nguyên câu lệnh; chỉ dịch comment. Không backtick, không `${`.
- core-022 không bị đụng (đã đối chiếu lại).
- Nghiệm thu: `node scripts/check-i18n.js q-java-5` → OK — 8 mục; `node scripts/validate.js` → OK — không có lỗi.
Reviewed-by: check-i18n (translation, no LLM review)
