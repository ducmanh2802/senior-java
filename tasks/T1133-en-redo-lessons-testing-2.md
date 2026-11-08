# T1133 — Dịch lại (nội dung đã sửa): lessons-testing-2 (1 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/lessons-testing-2.en.js`

Nội dung tiếng Việt của các mục sau trong `js/data/lessons-testing.js` đã được sửa SAU khi dịch, nên bản tiếng Anh trong `js/i18n/lessons-testing-2.en.js` đã cũ: **lesson-testing-003**.

Với MỖI mục trên: đọc bản tiếng Việt hiện tại trong `js/data/lessons-testing.js` và DỊCH LẠI toàn bộ entry của nó trong `js/i18n/lessons-testing-2.en.js` (thay entry cũ, giữ nguyên key, cùng tập field như các entry khác). Không đụng các mục khác. Code, id, url giữ nguyên; chuỗi tiếng Việt trong code mẫu cũng dịch sang tiếng Anh.
Đọc AGENTS.md mục 5 (markup: không backtick, không `${`).

## Nghiệm thu
node scripts/check-i18n.js lessons-testing-2 → OK; node scripts/validate.js → OK.

## Notes

- Đã dịch lại đầy đủ `lesson-testing-003` trong `js/i18n/lessons-testing-2.en.js`: title, goals (3), body (7 mục `###`, 2 code block `~~~java`, 1 bảng 6 dòng, 5 bullet giới hạn), 1 exercise (title/prompt/3 hints/explain; starter/tests/reference KHÔNG chép), 3 câu check (q/4 options/explain). Không chép `id`/`track`/`order`/`level`/`minutes`/`related`/`tags`.
- Phản ánh các sửa đổi sau khi dịch trước đó: hàng Metamorphic trong bảng property, ghi chú {{Random}}/{{ThreadLocalRandom}}/{{SplittableRandom}}, ví dụ shrinking, chi tiết prompt part 2 (seed=<seed của trial>, trial=<số trial>, ví dụ seed 42 → seed=45).
- Giữ nguyên markup và mọi `{{code}}`; comment trong code block đã dịch sang tiếng Anh; `> Senior tip:` giữ nguyên; "### Liên hệ phỏng vấn" → "### Interview relevance".
- Không backtick, không `${`, không ký tự tiếng Việt (trong text và trong code block). `node scripts/check-i18n.js lessons-testing-2` → `OK — 1 mục đã dịch.`; `node scripts/validate.js` → `OK — không có lỗi.` (cảnh báo q-java.js/path.js là cũ, không liên quan file này).
Reviewed-by: check-i18n (translation, no LLM review)
