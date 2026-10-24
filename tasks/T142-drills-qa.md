# T142 — Drills câu hỏi nhanh có bấm giờ

Status: TODO
Agent: opencode
Owns: `js/data/drills-qa.js`

Đọc comment schema đầu file (đã có sẵn, rỗng, đã gắn index.html) và AGENTS.md mục 2, 5. Người học: dev Java Việt Nam 4–8 năm, tiếng Anh đọc tốt nhưng nói chưa trôi, chuẩn bị phỏng vấn Senior với công ty nước ngoài/ngân hàng. Tiếng Anh tự nhiên kiểu người bản xứ nói trong phỏng vấn (American English), không văn viết cứng, không sai ngữ pháp. Dữ liệu là chuỗi thường (không markup), không dùng backtick và `${`. id tăng dần 3 chữ số, duy nhất.

Thêm **~45 câu** `kind: 'qa'`: người học nghe câu hỏi (TTS), trả lời trong `seconds` giây, rồi so với `sample`. Phân bổ: 10 intro/project ("Walk me through your resume", "Tell me about the most complex system you built"…), 15 tech (giải thích ngắn kiểu nói: "How does a HashMap work?", "Explain the difference between optimistic and pessimistic locking", "What happens when you call a @Transactional method from the same class?"…), 8 design ("How would you design a rate limiter? Start with requirements."), 8 behavioral (STAR, kết quả có số), 4 negotiation/closing ("What are your salary expectations?", "Do you have any questions for us?"). `sample` là câu trả lời NÓI tự nhiên 80–200 từ, đúng kỹ thuật (Java 17/21, Spring Boot 3), có signpost ("First…, the key point is…, in my last project…"); `phrases` là 3–6 cụm đáng học trong sample. Không trùng q với `js/data/q-english.js`. `node scripts/validate.js` → OK, rồi `Status: DONE`.

## Notes
