# T2199 — Rà soát chất lượng 10 câu KHÔNG có tag core, id lớn nhất trong q-system-design.js

Status: DONE
Agent: kilo
Owns: `js/data/q-system-design.js`
After: T2139

## Bối cảnh
Giai đoạn ưu tiên **chất lượng**: nội dung do model free viết cần kiểm tra chéo trước khi người học (dev Java ~4 năm, hổng nền tảng) dùng đi phỏng vấn thật.

## Việc cần làm
1. Tìm 10 câu KHÔNG có tag core, id lớn nhất (`node scripts/qtool.js list js/data/q-system-design.js` nếu là câu hỏi; file khác dùng grep -n theo id). KHÔNG đọc cả file một lần.
2. Kiểm tra từng mục: đúng kỹ thuật Java 17/21, Spring Boot 3, Hibernate 6, PostgreSQL 15+, Kafka 3.x; không bịa API/flag/giá trị mặc định; câu không có tag core cũng phải đủ **Tóm tắt:**, ### Trả lời mẫu khi phỏng vấn, > Senior tip:; ghi vào Notes nếu trùng ý câu khác.
3. **Sửa đúng** chỗ sai/thiếu; không chắc thì viết ở mức nguyên lý, bỏ chi tiết bịa. Không xoá mục, không đổi id.

## Luật
- Đọc AGENTS.md (schema; mục 5 markup: không backtick, không ký hiệu đô-la + ngoặc nhọn trong template literal).
- Ngoại lệ cho luật "chỉ thêm": task rà soát được sửa nội dung có sẵn. Đếm số mục trước/sau phải bằng nhau.
- Không commit.

## Nghiệm thu
`node --check js/data/q-system-design.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` (bài học thêm `node scripts/test-lessons.js`, bug thêm `node scripts/test-bugs.js`) → OK.
Xong: `Status: DONE`. Notes: bảng `id | lỗi tìm thấy | đã sửa gì`.

## Notes

| id | lỗi tìm thấy | đã sửa gì |
|---|---|---|
| architecture-055 | Không lỗi. Đủ Tóm tắt, Ví dụ đời thực, Trả lời mẫu, Senior tip, follow=3; tags không có 'core'. | Không cần sửa. |
| architecture-056 | Không lỗi. Đủ đầy đủ mục bắt buộc; multi-layer rate limiting đúng nguyên lý Gateway/Mesh/App/DB, hierarchical quota, fail-open/closed. | Không cần sửa. |
| architecture-057 | Không lỗi. Consistent hashing + virtual node, rebalancing, code minh họa đúng. | Không cần sửa. |
| architecture-058 | Không lỗi. Leader election Raft, split brain, fencing token, ví dụ GC pause đúng. | Không cần sửa. |
| architecture-059 | Không lỗi. Quorum R+W>N, read-repair, pitfall linearizability đúng. | Không cần sửa. |
| architecture-060 | Không lỗi. CAP và PACELC qua ví dụ thanh toán/giỏ hàng, đúng kỹ thuật. | Không cần sửa. |
| architecture-061 | Không lỗi. CDC Debezium + Outbox, dual-write, seq diagram đúng. | Không cần sửa. |
| architecture-062 | Không lỗi. Exactly-once vs effectively-once, Kafka idempotent/transactional, dedup end-to-end đúng. | Không cần sửa. |
| architecture-063 | Không lỗi. Clock skew, Lamport/vector clock, HLC/TrueTime, ví dụ multi-region đúng. | Không cần sửa. |
| architecture-064 | Không lỗi. Hot partition, salting, ordering trade-off, ví dụ flash sale đúng. | Không cần sửa. |

Kết luận: 10 câu id lớn nhất không tag `core` (architecture-055 → architecture-064; architecture-052 có tag `core` nên bị loại) đã được rà soát toàn bộ. Không tìm thấy lỗi kỹ thuật, không bịa API/flag, đủ cấu trúc bắt buộc (Tóm tắt, Ví dụ đời thực, Trả lời mẫu, Senior tip, follow ≥ 2). Không xoá mục, không đổi id. Không cần sửa nội dung.
