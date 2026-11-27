# T2772R — Fact-check nội dung mới của T2772

Status: DONE
Agent: opencode
Owns: `js/data/q-java.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2772 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
Đã sửa 3 lỗi kỹ thuật trong 3 câu hỏi mới:

**core-086 (String immutability & security):**
- Sửa mô tả sai về string pool: "pool gần như không bị GC" → đúng là string pool nằm trên heap từ Java 7 và VẪN bị GC, nhưng intern làm kéo dài thời gian sống do strong reference.
- Sửa `Arrays.fill(password, ' ')` → `Arrays.fill(password, '\0')` (null character) để xoá sạch bộ nhớ an toàn; space không an toàn.
- Sửa comment code: "0 sau khi fill?" → "length không đổi, nội dung đã thành \0".
- Cập nhật bảng so sánh: `Arrays.fill` → `Arrays.fill(chars, '\0')`.
- Đổi ref URL trỏ đến Java Secure Coding Guidelines thay vì concurrency.

**core-087 (Spring @Transactional):**
- Sửa code example: bỏ `throws LoiNghiepVuChecked` (checked exception) vì method dùng unchecked `BusinessException` pattern và catch chỉ `RuntimeException`; giữ `@Transactional(rollbackFor = Exception.class)` để demo rollback cả checked.

**core-088 (Generics PECS):** Không có lỗi kỹ thuật, nội dung đúng.
