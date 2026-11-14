# T2042R — Fact-check nội dung mới của T2042

Status: DONE
Agent: opencode
Owns: `js/data/q-spring-data.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2042 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- Đã review nội dung mới jpa-058..jpa-063 trong `js/data/q-spring-data.js` (diff HEAD). Kiểm tra tính đúng kỹ thuật theo Hibernate 6 / Spring Boot 3.x / PostgreSQL 15: L2/query cache (invalidation theo bảng qua UpdateTimestampsCache, per-JVM, cần L2 cho query cache, TRANSACTIONAL cần JTA), @Formula/@Subselect (read-only, @Synchronize, no index), projection vs entity/cache, pagination với collection fetch (HHH90003004, fail_on_pagination_over_collection_fetch), @SQLRestriction/@Where deprecated 6.3 và hành vi soft delete. Không thấy lỗi kiến thức/API/flag/mặc định/cơ chế, không có backtick hay `${` trong phần mới, markup hợp lệ. Không chỉnh văn phong/bố cục/độ dài.
- Kết quả: không có lỗi kiến thức cần sửa.
- `node --check js/data/q-spring-data.js` OK. `node scripts/build-light-index.js` OK. `node scripts/validate.js` → `OK — không có lỗi.` (có cảnh báo path sẵn có, không phải lỗi). Không sửa nội dung cũ (HEAD), không thêm/xoá mục. Không git commit, không mở browser, không kill tiến trình theo tên.
