# T887R — Fact-check nội dung mới của T887

Status: DONE
Agent: opencode
Owns: `js/data/drills-shadow.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T887 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- Đối chiếu diff HEAD vs working copy: 20 mục mới `drill-shadow-121`..`drill-shadow-140` (không thêm/xoá mục, chỉ chỉnh bản dịch tiếng Việt cho tự nhiên/chuẩn hơn).
- `drill-shadow-134`: sửa `vi` từ "và tôi rất đánh giá cao sự review của bạn" (dịch sát, cụt nghĩa) → "mong bạn dành thời gian góp ý" (tự nhiên, giữ nghĩa "appreciate your review").
- `drill-shadow-136`: sửa `vi` "Chúng ta đã nửa sprint" → "Chúng ta đã đi được nửa sprint" (đủ nghĩa).
- `drill-shadow-137`: sửa `vi` "và chúng ta đang sửa ngay lúc này" → "và chúng tôi đang khắc phục ngay bây giờ" (tự nhiên, đúng chủ ngữ kỹ sư nói với client trong ngữ cảnh outage).
- `drill-shadow-138`: sửa `vi` "Xin tiếp nhận lời xin lỗi..." (sai nghĩa, nghe như yêu cầu client tiếp nhận) → "Xin hãy nhận lời xin lỗi..." (đúng nghĩa "Please accept my apologies").
- `drill-shadow-139`: sửa `vi` "truy vấn database chậm" → "truy vấn cơ sở dữ liệu đang chậm" (đồng bộ thuật ngữ tiếng Việt trong phần dịch; `en` giữ nguyên "database query").
- Các mục 121–133, 135, 140: kiểm tra nội dung kỹ thuật/ngữ cảnh giao tiếp client (estimate, delay, deadline, scope, off-peak hours) — không có sai kỹ thuật, số liệu vô căn cứ, hay lỗi markup; giữ nguyên.
- `node --check js/data/drills-shadow.js` OK. `node scripts/validate.js` → OK (không lỗi).
