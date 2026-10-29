# T526 — Dịch lại (nội dung đã sửa): q-java-1 (6 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/q-java-1.en.js`

Nội dung tiếng Việt của các mục sau trong `js/data/q-java.js` đã được sửa SAU khi dịch, nên bản tiếng Anh trong `js/i18n/q-java-1.en.js` đã cũ: **core-004, core-005, core-006, core-008, core-009, core-010**.

Với MỖI mục trên: đọc bản tiếng Việt hiện tại trong `js/data/q-java.js` và DỊCH LẠI toàn bộ entry của nó trong `js/i18n/q-java-1.en.js` (thay entry cũ, giữ nguyên key, cùng tập field như các entry khác). Không đụng các mục khác. Code, id, url giữ nguyên; chuỗi tiếng Việt trong code mẫu cũng dịch sang tiếng Anh.
Đọc AGENTS.md mục 5 (markup: không backtick, không `${`).

## Nghiệm thu
node scripts/check-i18n.js q-java-1 → OK; node scripts/validate.js → OK.

## Notes

Đã dịch lại toàn bộ 6 entry core-004, core-005, core-006, core-008, core-009, core-010 trong `js/i18n/q-java-1.en.js` theo bản tiếng Việt hiện tại của `js/data/q-java.js` (đọc lại từng mục, không dùng bản dịch cũ).
- Giữ nguyên key, cùng tập field `q`/`a`/`follow` như các entry khác; `follow` lấy đúng 3 câu hỏi đào sâu của bản tiếng Việt (core-004 bổ sung câu về `InterruptedException`, core-006 đổi câu 3 sang `List<?>` vs `List<Object>`, core-009 đổi câu 3 sang `transient`, core-010 đổi cả 3 câu).
- Code mẫu giữ nguyên API; comment tiếng Việt trong code block đã dịch sang tiếng Anh.
- Bổ sung giải thích ngắn tại chỗ cho vài thuật ngữ người mới (correlation id, RCE, phantom-reachable, CGLIB, AST, CDS, GraalVM native image, JMH) để đúng yêu cầu người đọc.
- Không backtick, không `${`; không đụng core-001..003, core-007, core-011, collections-001 hay file nào khác.
- Kiểm tra: `node scripts/check-i18n.js q-java-1` → OK (12 mục); `node scripts/validate.js` → OK — không có lỗi.
Reviewed-by: check-i18n (translation, no LLM review)
