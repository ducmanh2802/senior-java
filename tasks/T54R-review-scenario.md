# T54R — Fact-check: 10 câu Tình huống mới (scenario-032 .. scenario-041)

Status: DONE
Agent: opencode
Owns: `js/data/q-scenario.js`

Đọc `AGENTS.md` mục 4–6. Các câu **scenario-032 → scenario-041** do model free viết, CHƯA review; kinh nghiệm cho thấy gần như câu nào cũng có lỗi.
Với từng câu: kiểm tra và **sửa trực tiếp** mọi lỗi kỹ thuật (API/flag/property bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup (backtick, `${`, `{{…}}` chứa `{ }`, `###` thụt đầu dòng), chữ nước ngoài lẫn vào. Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x, Linux. Lưu ý: từ JDK 18 thread dump in `nid` dạng thập phân.
**Không** sửa các câu scenario-001 → 031 (đã review). Không thêm/xoá câu.

## Nghiệm thu
`node scripts/validate.js q-scenario.js` → OK. Ghi vào Notes danh sách lỗi đã sửa theo từng id.

## Notes

- scenario-032: sửa mặc định/cách cấu hình DNS TTL, hành vi Hikari validation, giới hạn targetServerType và soft eviction.
- scenario-033: sửa mô hình glibc arenas/thread stack; nêu giới hạn phạm vi NMT và cách đối chiếu RSS.
- scenario-034: bổ sung điều kiện unique index, transaction failed sau constraint error, và row lock không khóa key chưa tồn tại.
- scenario-035: bỏ mặc định HALF_UP và công thức remainder mơ hồ; làm rõ minor unit, amount âm, audit quy tắc làm tròn.
- scenario-036: sửa khẳng định truststore riêng/reload SSL chung; bổ sung kiểm tra SAN và chuỗi cert.
- scenario-037: sửa kiểm tra iat, API clock skew JJWT/Spring Security và giới hạn leeway.
- scenario-038: cập nhật Redis eviction, semantics noeviction, Redis Cluster chỉ DB 0; bỏ ngưỡng 80% tuyệt đối và lưu ý lock.
- scenario-039: bổ sung CDC catch-up trong backfill, atomic alias switch và xử lý delete/tombstone theo connector.
- scenario-040: bỏ số liệu chi phí/tiết kiệm không căn cứ; retention, logging cost và mức log được đặt theo workload.
- scenario-041: sửa mô tả thread dump, timeout theo client/SLO, phân biệt bulkhead và điều kiện Virtual Threads.
