# T1554R — Fact-check nội dung mới của T1554

Status: DONE
Agent: opencode
Owns: `js/data/quiz-cca-5.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1554 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

Đã fact-check 12 mục mới (qz-ccafive-024 … 035) trong `js/data/quiz-cca-5.js`. Nội dung kỹ thuật về context window / max_tokens / prompt caching / MCP / lost-in-the-middle / prompt leakage đều ĐÚNG, không có API/flag bịa, không có cơ chế nói ngược. Chỉ sửa vài lỗi diễn đạt/chữ lẫn (không đổi ý, không đổi đáp án):

- qz-ccafive-024: "cắt ngang câu trả lời ngay giữa phương trình hay đoạn mã" → "ngay giữa câu hoặc đoạn mã" (bối cảnh là code, không phải phương trình); "Việc làm lớn context window không giúp câu trả lời duy nhất dài hơn" → "Tăng context window không giúp một câu trả lời đơn lẻ dài hơn" (bỏ cụm tối nghĩa).
- qz-ccafive-028: "đoạn văn bản đặt mô hình hành động như thế" → "quy định cách model hành xử"; "chỉ thị sau" → "chỉ thị mới hơn" (rõ nghĩa hơn).
- qz-ccafive-029: "xử lý bằng thị giác máy tính" → "bằng kỹ thuật thị giác máy tính (computer vision)" (thuật ngữ tiếng Anh kèm giải thích).
- qz-ccafive-030: "gửi tin nhắn tiếp theo kém context" → "gửi tin nhắn tiếp theo khi ngữ cảnh không đủ".
- qz-ccafive-031: "không nên nhớ model sẽ tự nhớ" → "không nên nghĩ model sẽ tự nhớ" (lỗi chính tả).
- qz-ccafive-025: "nếu số này lớn hơn…" → "nếu lượng này lớn hơn…" (diễn đạt tự nhiên hơn).

Ghi chú thêm (không sửa, chỉ nêu): các đáp án đơn đang lệch vị trí 1 (5/10 câu), vị trí 3 ít (1/10). Validator không chặn, AGENTS chỉ "khuyến nghị rải đều"; do task yêu cầu không đổi bố cục/ đáp án nên giữ nguyên, không xáo trộn.

Nghiệm thu: `node --check js/data/quiz-cca-5.js` OK; `node scripts/validate.js` → "OK — không có lỗi." (không có mục quiz-cca-5 nào bị báo). Render `App.md` cho cả 12 mục mới: không lỗi.
