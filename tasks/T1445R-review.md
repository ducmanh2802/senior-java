# T1445R — Fact-check nội dung mới của T1445

Status: DONE
Agent: opencode
Owns: `js/data/q-api.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1445 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

api-024: sửa chữ nước ngoài lẫn vào ("révèle" → "xác định lỗi") trong ví dụ đời thực mới.
6 block "Ví dụ đời thực" mới (api-022, 023, 024, 025, 026, 027) đã fact-check: không còn lỗi kỹ thuật (mặc định nginx/Spring, exception, Range/206, Bean Validation groups, Cache-Control, content negotiation 406, PATCH 415/412), không markup lỗi, không backtick/${ trong đáp án.
node scripts/validate.js → OK.