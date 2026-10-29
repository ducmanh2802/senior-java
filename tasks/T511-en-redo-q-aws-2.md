# T511 — Dịch lại (nội dung đã sửa): q-aws-2 (9 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/q-aws-2.en.js`

Nội dung tiếng Việt của các mục sau trong `js/data/q-aws.js` đã được sửa SAU khi dịch, nên bản tiếng Anh trong `js/i18n/q-aws-2.en.js` đã cũ: **aws-012, aws-013, aws-014, aws-015, aws-016, aws-017, aws-018, aws-019, aws-020**.

Với MỖI mục trên: đọc bản tiếng Việt hiện tại trong `js/data/q-aws.js` và DỊCH LẠI toàn bộ entry của nó trong `js/i18n/q-aws-2.en.js` (thay entry cũ, giữ nguyên key, cùng tập field như các entry khác). Không đụng các mục khác. Code, id, url giữ nguyên; chuỗi tiếng Việt trong code mẫu cũng dịch sang tiếng Anh.
Đọc AGENTS.md mục 5 (markup: không backtick, không `${`).

## Nghiệm thu
node scripts/check-i18n.js q-aws-2 → OK; node scripts/validate.js → OK.

## Notes

- Đã dịch lại toàn bộ 9 entry (aws-012…aws-020) trong `js/i18n/q-aws-2.en.js` theo bản tiếng Việt hiện tại, giữ nguyên key và bộ field q/a/follow.
- Bản dịch bám đủ cấu trúc mới: Summary, Quick intuition, Key terms, Step by step, các mục kỹ thuật, Production pitfalls (Symptom/Fix), One-minute spoken answer, Senior tip; giữ nguyên code block (yaml/java/json/text) và chỉ dịch chú thích/nhãn tiếng Việt trong code.
- Không dùng backtick, không `${`; `\\n` và `\\` trong code block giữ đúng escape của template literal.
- `node scripts/check-i18n.js q-aws-2` → OK — 9 mục đã dịch. `node scripts/validate.js` → OK — không có lỗi.
- Lưu ý dọn dẹp: trong lúc làm việc có tạo file nháp `tasks/.t511-write-probe.txt` (5 byte) nhưng shell bị chặn lệnh xoá/di chuyển; người tích hợp xoá giúp file này trước khi commit.
Reviewed-by: check-i18n (translation, no LLM review)
