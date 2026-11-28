# T2896R — Fact-check nội dung mới của T2896

Status: DONE
Agent: opencode
Owns: `js/data/lessons-jvm.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2896 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

Sửa trực tiếp trong js/data/lessons-jvm.js (nội dung mới của T2896: lesson-jvm-021, lesson-jvm-022):
- lesson-jvm-021 goals[3]: bỏ prét "deadlock chắc chắn" từ cùng nhóm thread BLOCKED trên cùng lock ≥2 dump — đúng là dấu hiệu nghi ngờ deadlock/hang chặt; xác định chắc chắn cần vẽ lock owner chain và tìm chu trình wait-for.
- lesson-jvm-021 body §"Deadlock chắc chắn cần ≥2 dump": viết lại cho đúng kỹ thuật (≥2 dump cùng thread BLOCKED là nghi ngờ, không chắc chắn deadlock; chu trình wait-for mới xác định deadlock, không có chu trình có thể là critical section dài hoặc I/O đồng bộ).
- lesson-jvm-021 goals/body: RUNNABLE là "đợi CPU hoặc I/O ở mức OS" (socket read cũng hiển thị RUNNABLE trong jstack), không phải "đợi CPU chứ không phải đợi I/O".
- lesson-jvm-021 check[2] explain: sửa theo ý trên.
- lesson-jvm-022 body bullet put: mô tả đúng (removeEldestEntry khi vượt capacity), xóa diễn giải sai "put dọn entry hết hạn".
- lesson-jvm-022 trả lời mẫu: put thêm entry và LRU nếu vượt capacity.
- lesson-jvm-022 hints: sửa typo "mô ph.inject" → "mô phỏng".
Không có lỗi kiến thức khác; không chỉnh văn phong/dộ dài/bố cục.
node --check OK, node scripts/test-lessons.js lesson-jvm-021 (6/6) và lesson-jvm-022 (5/5) pass, node scripts/validate.js → OK.
