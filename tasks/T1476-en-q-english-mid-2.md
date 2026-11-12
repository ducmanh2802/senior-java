# T1476 — Phỏng vấn tiếng Anh cấp mid/senior: thêm 4 câu english-178…english-181

Status: DONE
Agent: kilo
Owns: `js/data/q-english.js`
After: T1475

Thêm **4 câu hỏi phỏng vấn tiếng Anh cấp mid/senior** vào `js/data/q-english.js`, id `english-178` … `english-181` (level senior cho đa số; câu nào đơn giản thì mid). Đọc mẫu trước: `node scripts/qtool.js show js/data/q-english.js english-161`, và xem danh sách câu đã có bằng `node scripts/qtool.js list js/data/q-english.js` (không trùng ý).

Chủ đề 4 câu (viết thành câu hỏi kiểu interviewer thật, tiếng Anh):
1. why you are changing jobs (positive framing)
2. working remotely with an international team
3. handling a production bug reported by a customer
4. how you prioritise when you have too many tasks

Mỗi câu: `{ id: 'english-NNN', topic: 'english', level: 'senior', lang: 'en', q: "…", a: `…`, follow: ["…", "…"], tags: ['…'] }` — không thêm field khác. `follow`: 2–3 câu hỏi đào sâu bằng tiếng Anh. Field `a` (template literal, markup theo AGENTS.md mục 5) gồm đúng các phần sau, theo thứ tự:
1. `**Tóm tắt:**` 1–2 câu tiếng Việt: interviewer muốn nghe gì và nên trả lời theo cấu trúc nào.
2. `### Sample answer`: câu trả lời mẫu tiếng Anh **150–220 từ**, ngôi thứ nhất, kể một tình huống cụ thể có số liệu (quy mô team, thời gian, kết quả đo được), nêu trade-off và bài học. Câu ngắn, dễ nói.
3. `### Useful phrases`: 5–8 gạch đầu dòng, mỗi dòng `- cụm tiếng Anh trích từ sample — nghĩa tiếng Việt`.
4. `### Lỗi người Việt hay mắc`: 2–4 gạch đầu dòng về ngữ pháp, từ vựng hoặc cách diễn đạt hay sai ở chủ đề này, kèm cách nói đúng.
5. Dòng cuối `> Senior tip:` 1–2 câu tiếng Việt, kinh nghiệm thực tế khi trả lời câu này.

## Luật
- Đọc AGENTS.md trước. **Chỉ thêm** object mới vào cuối `js/data/q-english.js`; không sửa/xoá mục đã có; không sửa file nào khác.
- Cách thêm an toàn (khuyên dùng): viết các object mới (cú pháp JavaScript, cách nhau bằng dấu phẩy) vào file tạm `logs/tmp-T1476.js`, rồi chạy `node scripts/qtool.js append js/data/q-english.js logs/tmp-T1476.js`. Tool tự kiểm tra cú pháp, id trùng và chèn đúng chỗ. **KHÔNG ghi lại toàn bộ file dữ liệu.**
- Chuỗi tiếng Anh có dấu nháy đơn (I'm, don't, it's) → bọc chuỗi bằng dấu nháy kép "...". Không dùng backtick và ký tự $ trong nội dung.
- Tiếng Anh phải **đúng ngữ pháp, tự nhiên, câu ngắn dễ nói** (trình độ B1–B2, đúng kiểu một kỹ sư nói khi phỏng vấn, không văn viết hoa mỹ). Nội dung kỹ thuật phải ĐÚNG. Tiếng Việt có dấu đầy đủ.
- Tự viết bằng lời của mình, không chép từ sách hay trang web. Không trùng ý với mục đã có.

## Nghiệm thu
- `node scripts/build-light-index.js` rồi `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
- Sửa dòng `Status: TODO` thành `Status: DONE` và ghi Notes: danh sách id đã thêm.

## Notes
Đã thêm 4 câu hỏi: english-178 (why change jobs - positive framing), english-179 (remote international team collaboration), english-180 (customer-reported production bug handling), english-181 (prioritization with too many tasks). Validate OK.
Reviewed-by: check-i18n (translation, no LLM review)
