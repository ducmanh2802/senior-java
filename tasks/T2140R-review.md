# T2140R — Fact-check nội dung mới của T2140

Status: DONE
Agent: opencode
Owns: `js/data/q-soft.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2140 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- Reviewed `git diff HEAD -- js/data/q-soft.js`: new content added in `soft-004` ("Ví dụ đời thực" + "Trả lời mẫu khi phỏng vấn").
- `soft-004`: fixed mixed-language typo "race hiếu xảy ra rarely" → "race hiếm khi xảy ra"; corrected inline code `{{@AtomicInteger}}` → `{{AtomicInteger}}` (class, not annotation). Technical claims (Clock injection, Awaitility polling vs Thread.sleep, CyclicBarrier/CountDownLatch for synchronized start, @RepeatedTest, SELECT FOR UPDATE) are correct for stated stack.
- `node scripts/validate.js` → OK (warnings only: PATH lessons not in PATH, pre-existing). No other knowledge/markup issues found.
