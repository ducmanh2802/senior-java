# T142 — Drills câu hỏi nhanh có bấm giờ

Status: DONE
Agent: opencode
Owns: `js/data/drills-qa.js`

Đọc comment schema đầu file (đã có sẵn, rỗng, đã gắn index.html) và AGENTS.md mục 2, 5. Người học: dev Java Việt Nam 4–8 năm, tiếng Anh đọc tốt nhưng nói chưa trôi, chuẩn bị phỏng vấn Senior với công ty nước ngoài/ngân hàng. Tiếng Anh tự nhiên kiểu người bản xứ nói trong phỏng vấn (American English), không văn viết cứng, không sai ngữ pháp. Dữ liệu là chuỗi thường (không markup), không dùng backtick và `${`. id tăng dần 3 chữ số, duy nhất.

Thêm **~45 câu** `kind: 'qa'`: người học nghe câu hỏi (TTS), trả lời trong `seconds` giây, rồi so với `sample`. Phân bổ: 10 intro/project ("Walk me through your resume", "Tell me about the most complex system you built"…), 15 tech (giải thích ngắn kiểu nói: "How does a HashMap work?", "Explain the difference between optimistic and pessimistic locking", "What happens when you call a @Transactional method from the same class?"…), 8 design ("How would you design a rate limiter? Start with requirements."), 8 behavioral (STAR, kết quả có số), 4 negotiation/closing ("What are your salary expectations?", "Do you have any questions for us?"). `sample` là câu trả lời NÓI tự nhiên 80–200 từ, đúng kỹ thuật (Java 17/21, Spring Boot 3), có signpost ("First…, the key point is…, in my last project…"); `phrases` là 3–6 cụm đáng học trong sample. Không trùng q với `js/data/q-english.js`. `node scripts/validate.js` → OK, rồi `Status: DONE`.

## Notes

- Đã thêm 45 câu `kind: 'qa'` vào `js/data/drills-qa.js`, id `drill-qa-001`…`045` tăng dần, không trùng.
- Phân bổ đúng yêu cầu: intro 6 + project 4, tech 15, design 8, behavioral 8, negotiation/closing 4. Level: 10 mid / 27 senior / 8 lead.
- Mỗi `sample` dài 111–150 từ, văn nói tự nhiên (American English), có signpost và số liệu; `phrases` 4–5 cụm, tất cả là chuỗi con thực sự xuất hiện trong `sample`. Nội dung bám Java 17/21, Spring Boot 3, Hibernate 6.
- Đã đối chiếu tự động với `q-english.js`: 0 câu trùng. Không dùng backtick, `${` hay markup; chỉ dùng đúng các field của schema.
- `node --check js/data/drills-qa.js` OK; `node scripts/validate.js` → `OK — không có lỗi.` (các cảnh báo `q-english.js` là có sẵn từ trước, ngoài phạm vi task).
- Không sửa file nào khác ngoài `js/data/drills-qa.js` và file task này. Không commit.
Reviewed-by: opencode (T142R)
