# T499 — Dịch lại (nội dung đã sửa): lessons-modern-2 (1 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/lessons-modern-2.en.js`

Nội dung tiếng Việt của các mục sau trong `js/data/lessons-modern.js` đã được sửa SAU khi dịch, nên bản tiếng Anh trong `js/i18n/lessons-modern-2.en.js` đã cũ: **lesson-modern-005**.

Với MỖI mục trên: đọc bản tiếng Việt hiện tại trong `js/data/lessons-modern.js` và DỊCH LẠI toàn bộ entry của nó trong `js/i18n/lessons-modern-2.en.js` (thay entry cũ, giữ nguyên key, cùng tập field như các entry khác). Không đụng các mục khác. Code, id, url giữ nguyên; chuỗi tiếng Việt trong code mẫu cũng dịch sang tiếng Anh.
Đọc AGENTS.md mục 5 (markup: không backtick, không `${`).

## Nghiệm thu
node scripts/check-i18n.js lessons-modern-2 → OK; node scripts/validate.js → OK.

## Notes
- Dịch lại toàn bộ entry `lesson-modern-005` theo bản tiếng Việt hiện tại: bổ sung OffsetDateTime, Period vs Duration + DST, mục "Bẫy kinh điển khi format" (YYYY/yyyy, MM/mm, HH/hh, SimpleDateFormat không thread-safe), cut-off UTC vs giờ VN + ngày lễ, mục Clock/now() injection, Senior tip mới.
- Exercise: prompt 5 gạch đầu dòng (thêm quy tắc 16:00:00 vs 16:00:01, không cần ngày lễ), hint 3 mới, explain theo thứ tự 3 bước + bug quên gán lại `d`.
- Check: 3 câu (thêm câu bẫy `YYYY`), đáp án vẫn index 1, giải thích đầy đủ cho cả phương án sai.
- Chỉ sửa `js/i18n/lessons-modern-2.en.js`. `node scripts/check-i18n.js lessons-modern-2` → OK (1 mục); `node scripts/validate.js` → OK — không có lỗi.
Reviewed-by: check-i18n (translation, no LLM review)
