# T1474 — Luyện nói tiếng Anh: thêm 8 bài hỏi–đáp (behavioral) drill-qa-114…121

Status: DONE
Agent: kilo
Owns: `js/data/drills-qa.js`
After: T1473

Thêm **8 bài luyện nói hỏi–đáp** (kind "qa") vào `js/data/drills-qa.js`, id `drill-qa-114` … `drill-qa-121`. Người học là dev Java ~4 năm kinh nghiệm, tiếng Anh nói còn yếu, cần câu trả lời mẫu để tập nói to. Xem chú thích schema ở đầu file và vài bài có sẵn làm mẫu.

Chủ đề đợt này: **tình huống hành vi trong team quốc tế, trả lời theo STAR**. Gợi ý 8 câu hỏi (trước khi viết chạy `node scripts/qtool.js list js/data/drills-qa.js` để xem câu đã có; câu nào trùng ý thì thay bằng câu khác cùng chủ đề):
1. Tell me about working with a team in a different time zone.
2. Describe a time you had to learn a new technology quickly.
3. Tell me about a time you took ownership of something outside your role.
4. Describe a time you pushed back on an unrealistic estimate.
5. Tell me about a mistake in communication and what you learned.
6. How do you handle a teammate who does not respond or blocks your work?
7. Tell me about a time you made a decision with incomplete data.
8. Describe a project that failed. What would you do differently?

Mỗi bài: `{ id, kind: "qa", theme, level, seconds, q, sample, phrases }`
- `theme`: intro | tech | behavioral | design | project | negotiation | smalltalk (chọn đúng chủ đề của câu). `level`: mid | senior | lead (đa số senior).
- `q`: câu hỏi của interviewer, tiếng Anh, 1 câu.
- `seconds`: 60 | 90 | 120. `sample`: câu trả lời mẫu để NÓI, văn bản thuần một đoạn (không markdown, không xuống dòng), **80–200 từ** (validator kiểm tra): 60 giây ≈ 90–120 từ, 90 giây ≈ 130–160 từ, 120 giây ≈ 170–195 từ. Ngôi thứ nhất, có tình huống và con số cụ thể (ví dụ "p99 dropped from 900 to 180 milliseconds"), có trade-off; không nói chung chung.
- `phrases`: 3–6 cụm từ đáng học, **trích nguyên văn từ sample**.

## Luật
- Đọc AGENTS.md trước. **Chỉ thêm** object mới vào cuối `js/data/drills-qa.js`; không sửa/xoá mục đã có; không sửa file nào khác.
- Cách thêm an toàn (khuyên dùng): viết các object mới (cú pháp JavaScript, cách nhau bằng dấu phẩy) vào file tạm `logs/tmp-T1474.js`, rồi chạy `node scripts/qtool.js append js/data/drills-qa.js logs/tmp-T1474.js`. Tool tự kiểm tra cú pháp, id trùng và chèn đúng chỗ. **KHÔNG ghi lại toàn bộ file dữ liệu.**
- Chuỗi tiếng Anh có dấu nháy đơn (I'm, don't, it's) → bọc chuỗi bằng dấu nháy kép "...". Không dùng backtick và ký tự $ trong nội dung.
- Tiếng Anh phải **đúng ngữ pháp, tự nhiên, câu ngắn dễ nói** (trình độ B1–B2, đúng kiểu một kỹ sư nói khi phỏng vấn, không văn viết hoa mỹ). Nội dung kỹ thuật phải ĐÚNG. Tiếng Việt có dấu đầy đủ.
- Tự viết bằng lời của mình, không chép từ sách hay trang web. Không trùng ý với mục đã có.

## Nghiệm thu
- `node scripts/build-light-index.js` rồi `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
- Sửa dòng `Status: TODO` thành `Status: DONE` và ghi Notes: danh sách id đã thêm.

## Notes
Added 8 behavioral QA drills (drill-qa-114 to drill-qa-121):
- drill-qa-114: Tell me about working with a team in a different time zone
- drill-qa-115: Describe a time you had to learn a new technology quickly
- drill-qa-116: Tell me about a time you took ownership of something outside your role
- drill-qa-117: Describe a time you pushed back on an unrealistic estimate
- drill-qa-118: Tell me about a mistake in communication and what you learned
- drill-qa-119: How do you handle a teammate who does not respond or blocks your work?
- drill-qa-120: Tell me about a time you made a decision with incomplete data
- drill-qa-121: Describe a project that failed. What would you do differently?
Reviewed-by: check-i18n (translation, no LLM review)
