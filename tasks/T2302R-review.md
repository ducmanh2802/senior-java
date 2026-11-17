# T2302R — Fact-check nội dung mới của T2302

Status: DONE
Agent: opencode
Owns: `js/data/quiz-ccdv-1.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2302 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- qz-ccdv-135: sửa nhãn đáp án trong `explain` từ "phương án 2" thành "phương án 3" để khớp với `answer: 2`. Index 2 ("làm tiêu chí thành công phụ thuộc vào đúng một chuỗi gọi tool cụ thể") là thực hành KHÔNG khuyến khích (đáp án đúng của câu "NOT recommended"); nội dung explain đã đúng, chỉ nhãn sai. Các câu qz-ccdv-121..150 còn lại: đáp án và nhãn explain đều nhất quán, kỹ thuật chính xác (CLAUDE.md, PreToolUse hooks, .claudecodes, subagent, held-out test, LLM-as-a-judge calibration, robust metric, non-deterministic agent, ground truth, tool accuracy, eval harness, bulkhead/rate-limit/Batch API, Resilience4j retry transient 429/529/500/503, Jackson streaming, prompt caching prefix/ephemeral, API key không để client-side, stop_reason max_tokens, schema invalid → HTTP 400, Message Batches ~50% + custom_id, cache chỉ prefix, retry 500 với backoff+jitter). Không có backtick/`${` sai trong nội dung mới.
- quiz-ccao-2.js: báo lỗi cú pháp "missing ) after argument list" khi validate, nhưng KHÔNG là file sở hữu của task này (task chỉ sở hữu js/data/quiz-ccdv-1.js), nên không được sửa theo luật 3 AGENTS.md; cần steward sở hữu file đó xử lý. Không ảnh hưởng đến file quiz-ccdv-1.js.