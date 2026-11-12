# T1460 — Phỏng vấn tiếng Anh cấp lead: thêm 4 câu english-162…english-165

Status: DONE
Agent: kilo
Owns: `js/data/q-english.js`

Thêm **4 câu hỏi phỏng vấn tiếng Anh cấp lead** vào `js/data/q-english.js`, id `english-162` … `english-165` (hiện ngân hàng chỉ có 10 câu level lead). Đọc mẫu trước: `node scripts/qtool.js show js/data/q-english.js english-161`, và xem danh sách câu đã có bằng `node scripts/qtool.js list js/data/q-english.js` (không trùng ý).

Chủ đề 4 câu (viết thành câu hỏi kiểu interviewer thật, tiếng Anh):
1. leading a major technical migration (for example monolith to services, or a database upgrade) without stopping delivery
2. handling an underperforming team member
3. convincing management to invest in technical debt
4. making an architecture decision when information is incomplete (reversible vs irreversible decisions, ADR)

Mỗi câu: `{ id: 'english-NNN', topic: 'english', level: 'lead', lang: 'en', q: "…", a: `…`, follow: ["…", "…"], tags: ['…'] }` — không thêm field khác. `follow`: 2–3 câu hỏi đào sâu bằng tiếng Anh. Field `a` (template literal, markup theo AGENTS.md mục 5) gồm đúng các phần sau, theo thứ tự:
1. `**Tóm tắt:**` 1–2 câu tiếng Việt: interviewer muốn nghe gì và nên trả lời theo cấu trúc nào.
2. `### Sample answer`: câu trả lời mẫu tiếng Anh **150–220 từ**, ngôi thứ nhất, kể một tình huống cụ thể có số liệu (quy mô team, thời gian, kết quả đo được), nêu trade-off và bài học. Câu ngắn, dễ nói.
3. `### Useful phrases`: 5–8 gạch đầu dòng, mỗi dòng `- cụm tiếng Anh trích từ sample — nghĩa tiếng Việt`.
4. `### Lỗi người Việt hay mắc`: 2–4 gạch đầu dòng về ngữ pháp, từ vựng hoặc cách diễn đạt hay sai ở chủ đề này, kèm cách nói đúng.
5. Dòng cuối `> Senior tip:` 1–2 câu tiếng Việt, kinh nghiệm thực tế khi trả lời câu này.

## Luật
- Đọc AGENTS.md trước. **Chỉ thêm** object mới vào cuối `js/data/q-english.js`; không sửa/xoá mục đã có; không sửa file nào khác.
- Cách thêm an toàn (khuyên dùng): viết các object mới (cú pháp JavaScript, cách nhau bằng dấu phẩy) vào file tạm `logs/tmp-T1460.js`, rồi chạy `node scripts/qtool.js append js/data/q-english.js logs/tmp-T1460.js`. Tool tự kiểm tra cú pháp, id trùng và chèn đúng chỗ. **KHÔNG ghi lại toàn bộ file dữ liệu.**
- Chuỗi tiếng Anh có dấu nháy đơn (I'm, don't, it's) → bọc chuỗi bằng dấu nháy kép "...". Không dùng backtick và ký tự $ trong nội dung.
- Tiếng Anh phải **đúng ngữ pháp, tự nhiên, câu ngắn dễ nói** (trình độ B1–B2, đúng kiểu một kỹ sư nói khi phỏng vấn, không văn viết hoa mỹ). Nội dung kỹ thuật phải ĐÚNG. Tiếng Việt có dấu đầy đủ.
- Tự viết bằng lời của mình, không chép từ sách hay trang web. Không trùng ý với mục đã có.

## Nghiệm thu
- `node scripts/build-light-index.js` rồi `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
- Sửa dòng `Status: TODO` thành `Status: DONE` và ghi Notes: danh sách id đã thêm.

## Notes
- Added `english-162` (lead, en): leading a major technical migration without stopping delivery.
- Added `english-163` (lead, en): handling an underperforming team member.
- Added `english-164` (lead, en): convincing management to invest in technical debt.
- Added `english-165` (lead, en): making an architecture decision with incomplete information (reversible vs irreversible, ADR).
- Each question includes required sections: **Tóm tắt**, ### Sample answer (150–220 words, EN, metrics, trade-offs, lesson), ### Useful phrases (5–8), ### Lỗi người Việt hay mắc (2–4), and final `> Senior tip:` (VI).
- Appended via `node scripts/qtool.js append js/data/q-english.js logs/tmp-T1460.js`; temp file `logs/tmp-T1460.js` left as artifact.
- Ran `node scripts/build-light-index.js` and `node scripts/validate.js` → OK — không có lỗi. (english: 164 câu hỏi)
- No other files modified; no git commands run.
Reviewed-by: check-i18n (translation, no LLM review)
