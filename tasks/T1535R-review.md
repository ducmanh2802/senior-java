# T1535R — Fact-check nội dung mới của T1535

Status: DONE
Agent: opencode
Owns: `js/data/lessons-ai.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1535 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

- lesson-ai-009: sửa điểm cosine sai trong ví dụ body — B=[0.9,0.1] không phải vector đơn vị nên điểm là 0.9/√0.82 ≈ 0.99, không phải 0.9 (text trước đó đã nêu cosine = tích vô hướng chỉ khi độ dài 1).
- lesson-ai-009: sửa lỗi chính tả "dữ kiện" → "dữ liệu" trong explain đáp án trắc nghiệm overlap.
- lesson-ai-010: không có lỗi kiến thức/markup.
- Kiểm tra: `node scripts/test-lessons.js lesson-ai-009` → 5/5 PASS; `lesson-ai-010` → 4/4 PASS (starter compile được nhưng không pass hết, như yêu cầu); `node scripts/validate.js` → OK — không có lỗi. Cảnh báo path.js (11 bài học ngoài PATH) đã tồn tại trước đó (bao gồm ai-007/ai-008 ở HEAD), không do thay đổi này.
