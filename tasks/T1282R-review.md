# T1282R — Fact-check nội dung mới của T1282

Status: DONE
Agent: opencode
Owns: `js/data/q-scenario.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1282 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
Không có lỗi. Đã review 20 scenario mới (042-061) + bổ sung cho scenario 001-041. Tất cả nội dung đúng kỹ thuật: API/flag/defaults chuẩn (Spring Boot 3.x, Java 17/21, PostgreSQL 15, Kafka 3.x), cơ chế giải thích chính xác (OSIV N+1, @Async ThreadLocal context loss, Redis Lua atomicity, escrow quota multi-region, @Transactional checked exception/self-invocation, K8s startupProbe/liveness/readiness phân biệt), số liệu thực tế có cơ sở. Markup tuân thủ spec ({{code}}, ###, -, >, ~~~java/sql/text~~~, ~~~seq~~~). Thuật ngữ kỹ thuật giữ nguyên tiếng Anh. Không sửa file khác.
