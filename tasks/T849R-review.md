# T849R — Fact-check nội dung mới của T849

Status: DONE
Agent: opencode
Owns: `js/data/lessons-architecture.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T849 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

- lesson-architecture-009: sửa markup `*node*` / `*Shard/partition*` thành `**node**` / `**Shard/partition**` — `App.inline()` chỉ hỗ trợ `**…**`, dấu `*` đơn bị hiển thị nguyên văn như lỗi đánh máy.
- Fact-check lesson-architecture-009 (consistent hashing/vnode) và lesson-architecture-010 (distributed lock/fencing token): không tìm thấy lỗi kỹ thuật (Dynamo 2007, Cassandra num_tokens/Murmur3Partitioner, Redis Cluster 16384 slot + CRC16, Redis SET NX PX, ZooKeeper ephemeral sequential node, etcd Lease/KeepAlive, fencing token kiểm tra ở storage đều chính xác). Cả hai bài tập chạy `node scripts/test-lessons.js`: reference pass 100%, starter biên dịch được nhưng không pass hết.
- `node scripts/build-light-index.js` đã chạy lại; `node scripts/validate.js` → OK — không có lỗi (chỉ còn cảnh báo cũ của câu trả lời ngắn ở các file khác, không thuộc nhiệm vụ này).
