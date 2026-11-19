# T2470R — Fact-check nội dung mới của T2470

Status: DONE
Agent: opencode
Owns: `js/data/q-java.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2470 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
Đã sửa 4 câu hỏi core-072 đến core-075 (nội dung mới của T2470):

**core-072 (String pool/intern):**
- "nhôm" → "nháy kép" (dấu nháy kép)
- "biến đếm (char array/byte array)" → "mảng ký tự/byte" (không phải biến đếm)
- "hôi triền nguyên" → "tiêu tốn" (từ đúng)
- Sửa mô tả string pool: đối tượng String ở heap, nhưng string table (bảng băm quản lý pool) nằm ở native memory (off-heap). Literal compile-time được class loader giữ, không GC; chuỗi intern runtime có thể GC nếu không còn tham chiếu.
- Xoá con số "30-50%" không có căn cứ
- "Java 21 string deduplication (-XX:+UseStringDeduplication) hoặc G1" → "G1 GC với string deduplication (-XX:+UseStringDeduplication)" (string deduplication là tính năng của G1, không tách biệt)

**core-073 (Exception handling):**
- "ngoại lệ đã bao dự kiến / không đã bao" → "ngoại lệ được kiểm tra / không được kiểm tra" (terminology chuẩn)
- "nguyên ngoại lệ gốc" → "nguyên nhân ngoại lệ gốc" (cause)
- "danh bưng" → "phân loại"
- "catch bỏ trong" → "catch rỗng" (thuật ngữ chuẩn)

**core-074 (JPA equals/hashCode):**
- "khoa nghiep vu" → "khoá nghiệp vụ" (thống nhất)
- "chửa lỗi" → "gây lỗi"
- Làm rõ: hai đối tượng transient cùng ID null => equals trả về true => chỉ đối tượng đầu được thêm vào Set (thứ hai trả về false), không phải "thêm không thành công" chung chung

**core-075 (OCP + Strategy):**
- "thêm them class" → "thêm class"
- "Không có class thêm" → "Không thêm class mới"
- Các từ thiếu dấu (nay, khi dung, can, it, them) đã sửa về chuẩn
- "chi phí" row: "Không có class thêm" → "Không thêm class mới"
