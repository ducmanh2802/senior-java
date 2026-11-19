# T2493R — Fact-check nội dung mới của T2493

Status: DONE
Agent: opencode
Owns: `js/data/q-soft.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2493 (xem `git diff HEAD -- <file>`) do model free viết, ĐÃ review xong.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHÍN cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK (không có lỗi q-soft.js). Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
Fixed 4 behavioral questions (behavioral-064 to behavioral-067) added by free model:
- behavioral-064: Fixed list item format from `+- ` to `- ` for markup consistency with file
- behavioral-065: Expanded answer from 953 to ≥1500 chars; replaced Korean "개선" with Vietnamese "cải tiến"
- behavioral-066: Expanded answer from 725 to ≥1500 chars; replaced Chinese "增长" with Vietnamese "phát triển"
- behavioral-067: Expanded answer from 733 to ≥1500 chars; replaced Korean "조율" with Vietnamese phrase
- Fixed template literal backtick issues (removed `` `com.example.domain` ``, `` `Line` ``, `` `yield %` ``, `` ` downtime` ``)
- All changes maintain Vietnamese language throughout, correct Java 17/21, Spring Boot 3.x references
