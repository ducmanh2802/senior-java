# T54R — Fact-check: 10 câu Tình huống mới (scenario-032 .. scenario-041)

Status: TODO
Agent: opencode
Owns: `js/data/q-scenario.js`

Đọc `AGENTS.md` mục 4–6. Các câu **scenario-032 → scenario-041** do model free viết, CHƯA review; kinh nghiệm cho thấy gần như câu nào cũng có lỗi.
Với từng câu: kiểm tra và **sửa trực tiếp** mọi lỗi kỹ thuật (API/flag/property bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup (backtick, `${`, `{{…}}` chứa `{ }`, `###` thụt đầu dòng), chữ nước ngoài lẫn vào. Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x, Linux. Lưu ý: từ JDK 18 thread dump in `nid` dạng thập phân.
**Không** sửa các câu scenario-001 → 031 (đã review). Không thêm/xoá câu.

## Nghiệm thu
`node scripts/validate.js q-scenario.js` → OK. Ghi vào Notes danh sách lỗi đã sửa theo từng id.

## Notes
