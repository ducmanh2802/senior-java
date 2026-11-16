# T2129R — Fact-check nội dung mới của T2129

Status: DONE
Agent: opencode
Owns: `js/data/q-java.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2129 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

Lỗi kỹ thuật đã sửa trong `js/data/q-java.js` (nội dung mới của T2129, ~~~seq đính kèm đáp án):
- core-006 (PECS/generic invariant): sơ đồ ~~~seq chiều gán kiểu sai — `List<? super Integer> -> List<Number>` không hợp lệ (không phải subtype), sửa thành `List<Integer> -> List<? super Integer>` (consumer ghi Integer được), bước invariant giữ nguyên.
- core-015 (try-with-resources): sai chữ lẫn tiếng Anh "n_throw" trong văn bản → "ném"; nhãn bước seq đóng `in` viết "đóng resource trước" trái với LIFO (`in` khai báo trước đóng sau) → "đóng resource sau".

Không có lỗi kiến thức khác trong phần mới; không chỉnh văn phong, không thêm/xoá mục, không sửa nội dung HEAD.
node scripts/build-light-index.js → OK; node scripts/validate.js → OK — không có lỗi.
