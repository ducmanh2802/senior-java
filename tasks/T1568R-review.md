# T1568R — Fact-check nội dung mới của T1568

Status: DONE
Agent: opencode
Owns: `js/data/sd-problems.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1568 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
Đã review sd-035 (Dịch vụ ghi âm và tóm tắt cuộc họp bằng AI) và sd-036 (Nền tảng feature flag dùng chung). Không phát hiện lỗi kỹ thuật, lỗi markup, hay thuật ngữ sai. Tính toán ước lượng (audio minutes, storage, throughput, cost) chính xác; kiến trúc (outbox pattern, presigned URLs, chunking with overlap, hierarchical summarization, deterministic rollout via hash, control plane/data plane separation, atomic snapshot updates) đúng theo best practice hiện đại. Validation pass, build-light-index.js chạy thành công.
