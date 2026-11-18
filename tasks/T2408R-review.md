# T2408R — Fact-check nội dung mới của T2408

Status: DONE
Agent: opencode
Owns: `js/data/drills-qa.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2408 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
Không có lỗi kiến thức trong drills qa 222–241. Tất cả 20 drill mới (theme tech/design/project/behavioral, level senior/lead) về RAG, LLM eval, token cost, data protection, agent safety, PoC→prod, prompt injection, fine-tuning, observability, semantic search, model versioning, AI metrics, embedding models, agent guardrails, streaming, fallbacks, KB updates, bias reduction, RAG testing, AI feature lessons — nội dung kỹ thuật chính xác theo thực tế hiện nay.

Lưu ý: `node scripts/validate.js` báo lỗi ở `quiz-ccap-2.js` (SyntaxError: Unexpected identifier 'rm' — backtick trong template literal) và `index-light.js` cũ. Hai lỗi này không thuộc file sở hữu (`drills-qa.js`). `quiz-ccap-2.js` cần integrator sửa; `index-light.js` sẽ tự cập nhật sau khi `quiz-ccap-2.js` được sửa và chạy `build-light-index.js`.
