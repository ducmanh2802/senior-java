# T1562R — Fact-check nội dung mới của T1562

Status: DONE
Agent: opencode
Owns: `js/data/q-ai.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1562 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
Reviewed nội dung mới của T1562 trong js/data/q-ai.js: ai-083, ai-084, ai-085, ai-086, ai-087, ai-088.
Không tìm thấy lỗi kỹ thuật: không có API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ (tất cả con số đều ghi rõ là ví dụ minh hoạ), không backtick/`${`/HTML trong đáp án, sơ đồ seq ai-087 hợp lệ (3 acteur, mỗi bước ≤ 60 ký tự), thuật ngữ tiếng Anh giữ nguyên theo quy ước.
Không sửa gì (không chỉnh văn phong, độ dài, bố cục).
node --check js/data/q-ai.js → OK. node scripts/validate.js → OK — không có lỗi.
