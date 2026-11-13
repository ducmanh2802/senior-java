# T1500 — Luyện nói tiếng Anh: thêm 8 bài hỏi–đáp (lead) drill-qa-130…137

Status: DONE
Agent: kilo
Owns: `js/data/drills-qa.js`
After: T1499

## Notes
Thêm 8 bài drill-qa (kind qa, theme design/behavioral, level lead/senior): drill-qa-130 (design, lead, 120s), drill-qa-131 (design, lead, 120s), drill-qa-132 (behavioral, lead, 120s), drill-qa-133 (behavioral, lead, 120s), drill-qa-134 (behavioral, lead, 120s), drill-qa-135 (behavioral, senior, 90s), drill-qa-136 (design, senior, 90s), drill-qa-137 (design, senior, 90s). Nội dung 영어 đơn giản B1-B2, kèm con số và trade-off, phrases trích nguyên văn từ sample. Đã chạy `node scripts/qtool.js append`, `node scripts/build-light-index.js`, `node scripts/validate.js` → OK.

Thêm **8 bài luyện nói hỏi–đáp** (kind "qa") vào `js/data/drills-qa.js`, id `drill-qa-130` … `drill-qa-137`. Người học là dev Java ~4 năm kinh nghiệm, tiếng Anh nói còn yếu, cần câu trả lời mẫu để tập nói to. Xem chú thích schema ở đầu file và vài bài có sẵn làm mẫu.

Chủ đề đợt này: **câu hỏi cấp mid/senior bằng tiếng Anh (theme design / behavioral, level lead)**. Gợi ý 8 câu hỏi (trước khi viết chạy `node scripts/qtool.js list js/data/drills-qa.js` để xem câu đã có; câu nào trùng ý thì thay bằng câu khác cùng chủ đề):
1. How do you make a big technical decision with your team?
2. How do you handle technical debt while delivering features?
3. How do you mentor developers who are stronger than you in some areas?
4. Tell me about a time you changed the direction of a project.
5. How do you measure the health of your team and your system?
6. How do you explain a delay to a client or a manager?
7. How do you review a design document from another team?
8. What does a good on-call process look like to you?

Mỗi bài: `{ id, kind: "qa", theme, level, seconds, q, sample, phrases }`
- `theme`: intro | tech | behavioral | design | project | negotiation | smalltalk (chọn đúng chủ đề của câu). `level`: mid | senior | lead (đa số senior).
- `q`: câu hỏi của interviewer, tiếng Anh, 1 câu.
- `seconds`: 60 | 90 | 120. `sample`: câu trả lời mẫu để NÓI, văn bản thuần một đoạn (không markdown, không xuống dòng), **80–200 từ** (validator kiểm tra): 60 giây ≈ 90–120 từ, 90 giây ≈ 130–160 từ, 120 giây ≈ 170–195 từ. Ngôi thứ nhất, có tình huống và con số cụ thể (ví dụ "p99 dropped from 900 to 180 milliseconds"), có trade-off; không nói chung chung.
- `phrases`: 3–6 cụm từ đáng học, **trích nguyên văn từ sample**.

## Luật
- Đọc AGENTS.md trước. **Chỉ thêm** object mới vào cuối `js/data/drills-qa.js`; không sửa/xoá mục đã có; không sửa file nào khác.
- Cách thêm an toàn (khuyên dùng): viết các object mới (cú pháp JavaScript, cách nhau bằng dấu phẩy) vào file tạm `logs/tmp-T1500.js`, rồi chạy `node scripts/qtool.js append js/data/drills-qa.js logs/tmp-T1500.js`. Tool tự kiểm tra cú pháp, id trùng và chèn đúng chỗ. **KHÔNG ghi lại toàn bộ file dữ liệu.**
- Chuỗi tiếng Anh có dấu nháy đơn (I'm, don't, it's) → bọc chuỗi bằng dấu nháy kép "...". Không dùng backtick và ký tự $ trong nội dung.
- Tiếng Anh phải **đúng ngữ pháp, tự nhiên, câu ngắn dễ nói** (trình độ B1–B2, đúng kiểu một kỹ sư nói khi phỏng vấn, không văn viết hoa mỹ). Nội dung kỹ thuật phải ĐÚNG. Tiếng Việt có dấu đầy đủ.
- Tự viết bằng lời của mình, không chép từ sách hay trang web. Không trùng ý với mục đã có.

## Nghiệm thu
- `node scripts/build-light-index.js` rồi `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
- Sửa dòng `Status: TODO` thành `Status: DONE` và ghi Notes: danh sách id đã thêm.

## Notes
Reviewed-by: check-i18n (translation, no LLM review)
