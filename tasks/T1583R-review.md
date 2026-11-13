# T1583R — Fact-check nội dung mới của T1583

Status: DONE
Agent: opencode
Owns: `js/data/q-system-design.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1583 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
Đã fact-check 8 câu mới (`architecture-057`…`architecture-064`) trong `js/data/q-system-design.js`. Sửa 4 lỗi:
- `architecture-057`: ASCII hash ring ghi sai cung dịch chuyển khi thêm node N4 tại vị trí 25. Đúng phải là cung từ N1(10) đến N4(25) → "10..25", không phải "20..25".
- `architecture-058`: ví dụ đời thực ghi "Redis latency spike 12s do GC" — Redis viết bằng C, không có GC. Sửa thành "GC pause 12s (JVM) trên cả 3 node nên không gia hạn được key Redis", đúng với kịch bản lock TTL hết hạn.
- `architecture-059`: gộp sai "hinted handoff" vào anti-entropy. Đổi tiêu đề thành "Anti-entropy (repair nền)"; hinted handoff vẫn được mô tả đúng ở Pitfall 4 (sloppy quorum & hinted handoff).
- `architecture-060`: cú pháp `~~~seq` sai: `note N1,N2:` bị parser hiểu là một actor tên "N1,N2". Sửa 2 dòng thành `note N1..N2:` để note span đúng 2 actor N1, N2.

Các nội dung còn lại đúng kỹ thuật (consistent hashing/vnode, Raft + fencing, R+W>N, CAP/PACELC, Debezium + Outbox, Kafka idempotent/transactional + end-to-end idempotency, Lamport/vector/HLC/TrueTime, hot partition/salting) — không sửa.

Nghiệm thu: `node --check` OK; `node scripts/build-light-index.js --check` OK (chỉ sửa `a`, không đổi id/topic/level); `node scripts/validate.js` → `OK — không có lỗi.` (chỉ còn cảnh báo path.js có sẵn, ngoài phạm vi file này).
