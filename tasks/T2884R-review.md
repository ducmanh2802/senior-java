# T2884R — Fact-check nội dung mới của T2884

Status: DONE
Agent: opencode
Owns: `js/data/q-spring-data.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2884 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
Đã sửa 3 lỗi trong 3 câu hỏi mới (jpa-097, jpa-098, jpa-099):

1. **jpa-097** (batch insert 1M đơn hàng):
   - Xoá `order_inserts: true` trùng lặp trong YAML config (dòng bị lặp 2 lần)
   - Sửa `{{getReferenceById}}` → `{{em.getReference()}}` cho đúng API JPA chuẩn (EntityManager.getReference()); Spring Data JPA 3.x có `getReferenceById()` nhưng code mẫu dùng `em.getReference()`
   - Cập nhật tag `getReferenceById` → `em.getReference`

2. **jpa-098** (DTO projection cho màn hình 200k dòng):
   - Không có lỗi kỹ thuật, markup đã cân bằng, độ dài đáp án 4892 ký tự đạt chuẩn

3. **jpa-099** (Second-level cache đa instance):
   - Sửa câu hỏi: "cập nhật giá" → "cập nhật danh mục" cho nhất quán với context "bảng danh mục (Category)"; ví dụ đời thực đã đúng (Category vs Price)
   - Không có lỗi markup, độ dài đáp án 4568 ký tự đạt chuẩn

Tất cả 3 câu hỏi pass `node scripts/validate.js`, không lỗi cú pháp, `{{ }}` cân bằng, không backtick, không `${` lòi.
