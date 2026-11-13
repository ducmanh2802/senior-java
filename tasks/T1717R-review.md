# T1717R — Fact-check nội dung mới của T1717

Status: DONE
Agent: opencode
Owns: `js/data/sd-problems.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1717 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

- sd-039: `eKYC (gọi API thân danh)` → `tình danh` (sai từ); ví dụ "$9.600/tháng (dưới ngân sách)" → "(vẫn vượt ngân sách $2.000/tháng)" (mâu thuẫn với ngân sách $2.000/tháng ở yêu cầu và bảng ước lượng).
- sd-040: `related` bỏ `recsys-001` (id không tồn tại trong q-*.js); "shadow metric không **rẻ hơn** production" → "**kém hơn** production"; giai đoạn Estimation chi phí serving/training mâu thuẫn bảng chi tiết → điều chỉnh cho khớp bảng (training $1.000/ngày, serving $384–1.440/ngày, pipeline $500/ngày, tổng ~$3.000–4.000/ngày).
- node scripts/build-light-index.js + node scripts/validate.js → OK — không có lỗi. Không sửa nội dung đã có ở HEAD; chỉ hai khối mới sd-039, sd-040.
