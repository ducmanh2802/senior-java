# T1471 — Luyện nói tiếng Anh: thêm 8 bài hỏi–đáp (intro) drill-qa-090…097

Status: DONE
Agent: kilo
Owns: `js/data/drills-qa.js`

Thêm **8 bài luyện nói hỏi–đáp** (kind "qa") vào `js/data/drills-qa.js`, id `drill-qa-090` … `drill-qa-097`. Người học là dev Java ~4 năm kinh nghiệm, tiếng Anh nói còn yếu, cần câu trả lời mẫu để tập nói to. Xem chú thích schema ở đầu file và vài bài có sẵn làm mẫu.

Chủ đề đợt này: **giới thiệu bản thân và động lực (theme intro / smalltalk)**. Gợi ý 8 câu hỏi (trước khi viết chạy `node scripts/qtool.js list js/data/drills-qa.js` để xem câu đã có; câu nào trùng ý thì thay bằng câu khác cùng chủ đề):
1. Tell me about yourself in two minutes.
2. Why do you want to join our company?
3. What are you most proud of in your career so far?
4. Where do you see yourself in three years?
5. What kind of team do you work best in?
6. What is your biggest weakness as an engineer?
7. How do you keep your technical skills up to date?
8. Could you repeat or clarify the question? (practise asking for clarification politely, then answer)

Mỗi bài: `{ id, kind: "qa", theme, level, seconds, q, sample, phrases }`
- `theme`: intro | tech | behavioral | design | project | negotiation | smalltalk (chọn đúng chủ đề của câu). `level`: mid | senior | lead (đa số senior).
- `q`: câu hỏi của interviewer, tiếng Anh, 1 câu.
- `seconds`: 60 | 90 | 120. `sample`: câu trả lời mẫu để NÓI, văn bản thuần một đoạn (không markdown, không xuống dòng), **80–200 từ** (validator kiểm tra): 60 giây ≈ 90–120 từ, 90 giây ≈ 130–160 từ, 120 giây ≈ 170–195 từ. Ngôi thứ nhất, có tình huống và con số cụ thể (ví dụ "p99 dropped from 900 to 180 milliseconds"), có trade-off; không nói chung chung.
- `phrases`: 3–6 cụm từ đáng học, **trích nguyên văn từ sample**.

## Luật
- Đọc AGENTS.md trước. **Chỉ thêm** object mới vào cuối `js/data/drills-qa.js`; không sửa/xoá mục đã có; không sửa file nào khác.
- Cách thêm an toàn (khuyên dùng): viết các object mới (cú pháp JavaScript, cách nhau bằng dấu phẩy) vào file tạm `logs/tmp-T1471.js`, rồi chạy `node scripts/qtool.js append js/data/drills-qa.js logs/tmp-T1471.js`. Tool tự kiểm tra cú pháp, id trùng và chèn đúng chỗ. **KHÔNG ghi lại toàn bộ file dữ liệu.**
- Chuỗi tiếng Anh có dấu nháy đơn (I'm, don't, it's) → bọc chuỗi bằng dấu nháy kép "...". Không dùng backtick và ký tự $ trong nội dung.
- Tiếng Anh phải **đúng ngữ pháp, tự nhiên, câu ngắn dễ nói** (trình độ B1–B2, đúng kiểu một kỹ sư nói khi phỏng vấn, không văn viết hoa mỹ). Nội dung kỹ thuật phải ĐÚNG. Tiếng Việt có dấu đầy đủ.
- Tự viết bằng lời của mình, không chép từ sách hay trang web. Không trùng ý với mục đã có.

## Nghiệm thu
- `node scripts/build-light-index.js` rồi `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
- Sửa dòng `Status: TODO` thành `Status: DONE` và ghi Notes: danh sách id đã thêm.

## Notes

Đã thêm 8 bài: drill-qa-090, drill-qa-091, drill-qa-092, drill-qa-093, drill-qa-094, drill-qa-095, drill-qa-096, drill-qa-097. Đã chạy node scripts/build-light-index.js và node scripts/validate.js: OK — không có lỗi.
Reviewed-by: check-i18n (translation, no LLM review)
