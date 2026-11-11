# T1299R — Fact-check nội dung mới của T1299

Status: DONE
Agent: opencode
Owns: `js/data/q-banking.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1299 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

Review 6 block mới của T1299 trong js/data/q-banking.js (diff +84 dòng: "### Ví dụ đời thực" + "### Trả lời mẫu khi phỏng vấn" gán vào banking-017, banking-020, banking-021, banking-022, banking-023, banking-024). Không có lỗi kiến thức (số liệu nhất quán: 100 USD × 25.650 = 2.565.000 VND khớp tỷ giá HEAD; UNEXPLAINED 18→0 trên 2.113.402 TK; 12 hold + 6 lãi = 18; 13/13 break; cơ chế outbox+saga+dedup, RPO=0 nhân bản đồng bộ, quorum 2 DC, double-entry DEBIT/CREDIT, đối soát mã tham chiếu + maker-checker đều đúng), không lỗi markup ({{ }} cân đối, không backtick/`${`/HTML thô, ### đầu dòng), không chữ nước ngoài lẻ (chỉ thuật ngữ kỹ thuật có sẵn trong codebase). Không cần sửa file. node --check js/data/q-banking.js: OK. node scripts/validate.js q-banking.js: OK — không có lỗi. Full validate: OK — không có lỗi.
