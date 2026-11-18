# T2406R — Fact-check nội dung mới của T2406

Status: DONE
Agent: opencode
Owns: `js/data/labs-incident.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2406 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- lab-incident-043 (mới của T2406, model free viết): đã review kỹ thuật. Nội dung đúng (Lettuce block khi Redis ElastiCache failover do thiếu socket-timeout/command-timeout; định luật Little 4.500 req/s × 40s ≈ 180.000 thread cần trong khi pool Tomcat chỉ 2.400; Hikari idle, DB CPU 18%; sửa bằng timeout ngắn, circuit breaker + fallback DB, bulkhead, stale-while-revalidate). Không có lỗi kiến thức, markup, backtick/`${}` hay trường lạ. `js/data/labs-incident.js` passare `node --check` và `scripts/validate.js` không báo lỗi cho labs-incident.js (43 lab, cuối là lab-incident-043).
- `node scripts/validate.js` chưa in OK do `quiz-ccap-2.js` (working tree, không thuộc T2406R) bị lỗi cú pháp, chặn `build-light-index.js` và kiểm tra chéo `index-light.js`. Theo quy tắc 3 AGENTS.md không sửa file không sở hữu; cần chủ sở hữu quiz-ccap-2.js sửa rồi chạy `node scripts/build-light-index.js` + `node scripts/validate.js`.
- Không tạo branch, không commit.
