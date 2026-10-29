# T363 — Modern Java: thêm 8 câu nền tảng

Status: DONE
Agent: kilo
Owns: `js/data/q-java.js`
After: T362

Thêm **8 câu** topic modern, ưu tiên level **mid** (khoảng 60% mid, 30% senior, 10% lead), phong cách câu hỏi phỏng vấn thật ("Bạn sẽ… thế nào?", "So sánh… khi nào chọn cái nào?"). Gợi ý chủ đề (kiểm tra trùng trước, thay bằng chủ đề tương đương nếu đã có):
- Stream API: map/filter/collect, groupingBy, bẫy side-effect
- Optional dùng đúng và sai
- record: khi nào dùng, compact constructor, so với Lombok
- sealed class + pattern matching for switch (Java 21)
- text block và String API mới
- var: khi nào nên và không nên
- java.time: Instant, LocalDateTime, ZonedDateTime, bẫy timezone
- Sequenced Collections (Java 21) và các API mới đáng biết

### Chuẩn chung (bắt buộc)
- Đọc AGENTS.md mục 2, 4, 5, 6, 13 trước khi viết. Người học là dev Java ~4 năm, **hổng nền tảng**: giải thích từ gốc, ví dụ đời thường, cơ chế từng bước có "vì sao", sơ đồ ASCII hoặc số liệu, code ngắn có comment, bảng trade-off, ### Lỗi hay gặp, ### Trả lời miệng 1 phút ngay trước > Senior tip:.
- Chống trùng: đọc hết câu cùng topic trong file của bạn và grep các file js/data/q-*.js khác; chủ đề đã có thì chọn góc khác hoặc bỏ.
- Đúng kỹ thuật với Java 17/21, Spring Boot 3.x, Hibernate 6, Kubernetes/AWS hiện hành. Không chắc thì viết ít lại nhưng đúng. refs chỉ dùng link chắc chắn tồn tại; chạy node scripts/check-links.mjs <tên-file.js> (chỉ tên file) và bỏ link hỏng.
- Chỉ **thêm**, id tiếp số lớn nhất của topic/category trong file. Không sửa nội dung đã có.
- Trong template literal: không có ký tự backtick, không có ${ chưa escape, dấu \ phải viết \\; inline code dùng {{code}}.
- **Không bao giờ để file hỏng cú pháp**: sau mỗi lần sửa chạy node --check <file>; nếu hỏng mà không sửa được thì khôi phục bằng git checkout -- <file> rồi làm lại từng mục một.
- Không chạy trực tiếp file .js như lệnh (luôn node <file>). Không commit/push, không kill tiến trình, không mở trình duyệt.
- Xong: node scripts/validate.js → OK — không có lỗi.; ghi Notes (id đã thêm) và đổi dòng trạng thái thành đúng Status: DONE (chỉ dùng TODO hoặc DONE, không dùng giá trị khác).

## Notes
- Thêm 8 câu modern-017..024 (5 mid, 2 senior, 1 lead): side-effect trong stream, record vs Lombok vs class, String API 11+ (strip/trim/NBSP), java.time Period/Duration/DST/YYYY/Clock, functional interface chuẩn + composition, đa hình vs sealed + switch (Java 21, có refs JEP 441/409), checked exception trong lambda, chính sách LTS/vendor/preview. Các gợi ý đã có (Optional, var, text block, Sequenced, groupingBy) được thay bằng góc khác. check-links OK.
Reviewed-by: claude (subagent; validate OK)
