# T1061 — Dịch lại (nội dung đã sửa): labs-incident-5 (1 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/labs-incident-5.en.js`

Nội dung tiếng Việt của các mục sau trong `js/data/labs-incident.js` đã được sửa SAU khi dịch, nên bản tiếng Anh trong `js/i18n/labs-incident-5.en.js` đã cũ: **lab-incident-013**.

Với MỖI mục trên: đọc bản tiếng Việt hiện tại trong `js/data/labs-incident.js` và DỊCH LẠI toàn bộ entry của nó trong `js/i18n/labs-incident-5.en.js` (thay entry cũ, giữ nguyên key, cùng tập field như các entry khác). Không đụng các mục khác. Code, id, url giữ nguyên; chuỗi tiếng Việt trong code mẫu cũng dịch sang tiếng Anh.
Đọc AGENTS.md mục 5 (markup: không backtick, không `${`).

## Nghiệm thu
node scripts/check-i18n.js labs-incident-5 → OK; node scripts/validate.js → OK.

## Notes

Đã dịch lại toàn bộ entry `lab-incident-013` trong `js/i18n/labs-incident-5.en.js` theo bản tiếng Việt hiện tại (lines 1489–1660) trong `js/data/labs-incident.js`: title, scenario, questions, hints, answer (toàn bộ body: Tóm tắt, Kiến thức nền, Chuỗi nhân quả, D dẫn chứng, Cách sửa, Phòng ngừa, Lỗi hay gặp, Trả lời miệng 1 phút, Senior tip), và rubric. Đã cập nhật header comment task ID từ T450 → T1061. Code block (~~~java RestTemplate bean), artifact content và các field không dịch (id, category, level, tags) giữ nguyên. Chạy `node scripts/check-i18n.js labs-incident-5` → OK (2 mục), `node scripts/validate.js` → OK — không có lỗi.
Reviewed-by: check-i18n (translation, no LLM review)
