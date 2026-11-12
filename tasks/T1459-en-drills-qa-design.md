# T1459 — Luyện nói tiếng Anh: thêm 8 bài hỏi–đáp (design) drill-qa-082…089

Status: DONE
Agent: kilo
Owns: `js/data/drills-qa.js`
After: T1458

Thêm **8 bài luyện nói hỏi–đáp** (kind "qa") vào `js/data/drills-qa.js`, id `drill-qa-082` … `drill-qa-089`. Người học là dev Java ~4 năm kinh nghiệm, tiếng Anh nói còn yếu, cần câu trả lời mẫu để tập nói to. Xem chú thích schema ở đầu file và vài bài có sẵn làm mẫu.

Chủ đề đợt này: **system design nói miệng (4 bài, theme "design") và thương lượng (4 bài, theme "negotiation")**. Gợi ý 8 câu hỏi (trước khi viết chạy `node scripts/qtool.js list js/data/drills-qa.js` để xem câu đã có; câu nào trùng ý thì thay bằng câu khác cùng chủ đề):
1. How do you start when you get a system design question?
2. Explain the trade-off between consistency and availability with a real example.
3. Monolith or microservices for a team of six developers? Why?
4. How would you scale a read-heavy service?
5. What are your salary expectations?
6. Why are you leaving your current job?
7. What is your notice period, and when can you start?
8. Do you have any questions for us? (ask about team, on-call, remote work across time zones)

Mỗi bài: `{ id, kind: "qa", theme, level, seconds, q, sample, phrases }`
- `theme`: intro | tech | behavioral | design | project | negotiation | smalltalk (chọn đúng chủ đề của câu). `level`: mid | senior | lead (đa số senior).
- `q`: câu hỏi của interviewer, tiếng Anh, 1 câu.
- `seconds`: 60 | 90 | 120. `sample`: câu trả lời mẫu để NÓI, văn bản thuần một đoạn (không markdown, không xuống dòng), **80–200 từ** (validator kiểm tra): 60 giây ≈ 90–120 từ, 90 giây ≈ 130–160 từ, 120 giây ≈ 170–195 từ. Ngôi thứ nhất, có tình huống và con số cụ thể (ví dụ "p99 dropped from 900 to 180 milliseconds"), có trade-off; không nói chung chung.
- `phrases`: 3–6 cụm từ đáng học, **trích nguyên văn từ sample**.

## Luật
- Đọc AGENTS.md trước. **Chỉ thêm** object mới vào cuối `js/data/drills-qa.js`; không sửa/xoá mục đã có; không sửa file nào khác.
- Cách thêm an toàn (khuyên dùng): viết các object mới (cú pháp JavaScript, cách nhau bằng dấu phẩy) vào file tạm `logs/tmp-T1459.js`, rồi chạy `node scripts/qtool.js append js/data/drills-qa.js logs/tmp-T1459.js`. Tool tự kiểm tra cú pháp, id trùng và chèn đúng chỗ. **KHÔNG ghi lại toàn bộ file dữ liệu.**
- Chuỗi tiếng Anh có dấu nháy đơn (I'm, don't, it's) → bọc chuỗi bằng dấu nháy kép "...". Không dùng backtick và ký tự $ trong nội dung.
- Tiếng Anh phải **đúng ngữ pháp, tự nhiên, câu ngắn dễ nói** (trình độ B1–B2, đúng kiểu một kỹ sư nói khi phỏng vấn, không văn viết hoa mỹ). Nội dung kỹ thuật phải ĐÚNG. Tiếng Việt có dấu đầy đủ.
- Tự viết bằng lời của mình, không chép từ sách hay trang web. Không trùng ý với mục đã có.

## Nghiệm thu
- `node scripts/build-light-index.js` rồi `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
- Sửa dòng `Status: TODO` thành `Status: DONE` và ghi Notes: danh sách id đã thêm.

## Notes
Added 8 new qa drills (drill-qa-082 through drill-qa-089):
- drill-qa-082: design/senior/120s - "How do you start when you get a system design question?"
- drill-qa-083: design/senior/120s - "Explain the trade-off between consistency and availability with a real example."
- drill-qa-084: design/senior/120s - "Monolith or microservices for a team of six developers? Why?"
- drill-qa-085: design/senior/120s - "How would you architect a read-heavy service to handle sudden traffic spikes?"
- drill-qa-086: negotiation/senior/90s - "How do you think about total compensation versus base salary?"
- drill-qa-087: negotiation/mid/90s - "Why are you leaving your current job?"
- drill-qa-088: negotiation/mid/60s - "If we made an offer, how quickly could you join and what would your transition plan look like?"
- drill-qa-089: negotiation/senior/90s - "What would you ask us about the team's engineering practices and on-call rotation?"

Validation passes for new drills. Pre-existing errors in q-devops.js (unescaped `${`), lessons-devops.js, and path.js are unrelated to this task.
Reviewed-by: check-i18n (translation, no LLM review)
