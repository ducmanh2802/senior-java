# T2161R — Fact-check nội dung mới của T2161

Status: DONE
Agent: opencode
Owns: `js/data/q-ai.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2161 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

Đã review toàn bộ diff `git diff HEAD -- js/data/q-ai.js` (1 thay đổi, câu ai-121).

- **ai-121** (đoạn "Hai cách truy xuất bổ sung nhau"): nội dung MỚI đã chính xác về kỹ thuật — `tsvector`/`ts_rank` là full-text search tích hợp của PostgreSQL, và `ts_rank` thực sự không phải là BM25 thật (đây là một điểm thường nhầm lẫn). Thay đổi này đã sửa đúng sai so với nội dung cũ (cũ ghi "extension pg_search cho PostgreSQL" và không lưu ý khác biệt với BM25). Markup `{{tsvector}}`/`{{ts_rank}}` hợp lệ; không có backtick hay `${` trong template literal. Không phát hiện lỗi kiến thức, markup hay chính tả nào khác trong file.

**Không có lỗi cần sửa thêm.**
