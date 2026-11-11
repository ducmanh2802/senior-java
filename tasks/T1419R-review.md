# T1419R — Fact-check nội dung mới của T1419

Status: DONE
Agent: opencode
Owns: `js/data/lessons-devops.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1419 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- lesson-devops-022: kiểm tra nội dung mới T1419 (Prometheus alerting for/pending/firing/resolved, grouping/inhibition/routing) — không phát hiện lỗi kiến thức kỹ thuật, cơ chế state machine và semantics for đúng; markup hợp lệ.
- lesson-devops-023: sửa lỗi chính tả thuật ngữ `**Fallover**` → `**failover**` (dòng mô tả khái niệm failover/chuyển đổi dự phòng) để nhất quán và đúng thuật ngữ; nội dung fall/rise, round-robin, VRRP/VIP/preempt không có lỗi kiến thức.
- Kiểm tra: `node --check js/data/lessons-devops.js` OK.
- `node scripts/validate.js` (2026-11-11): repo có nhiều lỗi/path warnings sẵn có ngoài phạm vi sở hữu (path.js lesson refs thiếu, index-light cũ) nên validator không in "OK — không có lỗi"; không có lỗi báo tại `js/data/lessons-devops.js`.
- `node scripts/test-lessons.js lesson-devops-022` / `lesson-devops-023`: không chạy được do lỗi cú pháp có sẵn trong file không thuộc sở hữu `js/data/lessons-spring.js:131` khiến `scripts/browser-shim.js` load data thất bại (không sửa theo luật sở hữu). Không sửa logic/exercise/tests của 022/023.
