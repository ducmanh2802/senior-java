# T1499 — Luyện nói tiếng Anh: thêm 8 bài hỏi–đáp (smalltalk) drill-qa-122…129

Status: DONE
Agent: kilo
Owns: `js/data/drills-qa.js`
After: T1474

Thêm **8 bài luyện nói hỏi–đáp** (kind "qa") vào `js/data/drills-qa.js`, id `drill-qa-122` … `drill-qa-129`. Người học là dev Java ~4 năm kinh nghiệm, tiếng Anh nói còn yếu, cần câu trả lời mẫu để tập nói to. Xem chú thích schema ở đầu file và vài bài có sẵn làm mẫu.

Chủ đề đợt này: **small talk và câu hỏi mở đầu/kết thúc buổi phỏng vấn (theme smalltalk / intro)**. Gợi ý 8 câu hỏi (trước khi viết chạy `node scripts/qtool.js list js/data/drills-qa.js` để xem câu đã có; câu nào trùng ý thì thay bằng câu khác cùng chủ đề):
1. How are you today? Did you find us easily?
2. Can you hear me well? (video call problems: ask to repeat, fix audio politely)
3. What do you know about our product?
4. What do you do outside of work?
5. Why did you choose backend development?
6. What was your favourite project at university or in your first job?
7. Is there anything else you would like us to know about you?
8. What are the next steps for you after this interview? (closing politely, thanking the interviewer)

Mỗi bài: `{ id, kind: "qa", theme, level, seconds, q, sample, phrases }`
- `theme`: intro | tech | behavioral | design | project | negotiation | smalltalk (chọn đúng chủ đề của câu). `level`: mid | senior | lead (đa số senior).
- `q`: câu hỏi của interviewer, tiếng Anh, 1 câu.
- `seconds`: 60 | 90 | 120. `sample`: câu trả lời mẫu để NÓI, văn bản thuần một đoạn (không markdown, không xuống dòng), **80–200 từ** (validator kiểm tra): 60 giây ≈ 90–120 từ, 90 giây ≈ 130–160 từ, 120 giây ≈ 170–195 từ. Ngôi thứ nhất, có tình huống và con số cụ thể (ví dụ "p99 dropped from 900 to 180 milliseconds"), có trade-off; không nói chung chung.
- `phrases`: 3–6 cụm từ đáng học, **trích nguyên văn từ sample**.

## Luật
- Đọc AGENTS.md trước. **Chỉ thêm** object mới vào cuối `js/data/drills-qa.js`; không sửa/xoá mục đã có; không sửa file nào khác.
- Cách thêm an toàn (khuyên dùng): viết các object mới (cú pháp JavaScript, cách nhau bằng dấu phẩy) vào file tạm `logs/tmp-T1499.js`, rồi chạy `node scripts/qtool.js append js/data/drills-qa.js logs/tmp-T1499.js`. Tool tự kiểm tra cú pháp, id trùng và chèn đúng chỗ. **KHÔNG ghi lại toàn bộ file dữ liệu.**
- Chuỗi tiếng Anh có dấu nháy đơn (I'm, don't, it's) → bọc chuỗi bằng dấu nháy kép "...". Không dùng backtick và ký tự $ trong nội dung.
- Tiếng Anh phải **đúng ngữ pháp, tự nhiên, câu ngắn dễ nói** (trình độ B1–B2, đúng kiểu một kỹ sư nói khi phỏng vấn, không văn viết hoa mỹ). Nội dung kỹ thuật phải ĐÚNG. Tiếng Việt có dấu đầy đủ.
- Tự viết bằng lời của mình, không chép từ sách hay trang web. Không trùng ý với mục đã có.

## Nghiệm thu
- `node scripts/build-light-index.js` rồi `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
- Sửa dòng `Status: TODO` thành `Status: DONE` và ghi Notes: danh sách id đã thêm.

## Notes

Đã thêm 8 bài qa vào cuối `js/data/drills-qa.js` (dùng `qtool.js append`):

- `drill-qa-122` smalltalk mid 60s — How are you today? Did you find us easily? (104 từ)
- `drill-qa-123` smalltalk mid 60s — Can you hear me well? (audio/video call, 103 từ)
- `drill-qa-124` smalltalk senior 60s — What do you know about our product? (120 từ)
- `drill-qa-125` smalltalk mid 60s — What do you do outside of work? (118 từ)
- `drill-qa-126` intro senior 90s — Why did you choose backend development? (139 từ)
- `drill-qa-127` project senior 90s — Favourite project at university / first job (138 từ)
- `drill-qa-128` intro senior 90s — Anything else you would like us to know? (142 từ)
- `drill-qa-129` smalltalk senior 90s — Next steps after this interview (127 từ)

Không trùng ý với mục cũ (đã `qtool list` + grep trước khi viết). Không sửa file nào khác ngoài `js/data/drills-qa.js`.
Kiểm tra: `node --check` OK, `node scripts/build-light-index.js` rồi `node scripts/validate.js` → `OK — không có lỗi.`
Khuyết điểm đã biết: cảnh báo cũ `path.js: lesson-design-007` không liên quan task này.
Reviewed-by: check-i18n (translation, no LLM review)
