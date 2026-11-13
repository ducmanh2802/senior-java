# T2016R — Fact-check nội dung mới của T2016

Status: DONE
Agent: kilo
Owns: `js/data/q-java.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2016 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỉ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
Đã review 8 câu hỏi mới trong js/data/q-java.js (collections-043, collections-044, collections-045, core-056, core-057, modern-055, modern-056, modern-057) và sửa 3 lỗi kiến thức:

- **core-056 (String.intern)**: Sửa lỗi về vùng nhớ string pool. File gốc viết "Pool nằm trong Metaspace (từ Java 8)" và "OOS Metaspace" — sai, string pool nằm trên heap từ Java 7 trở đi (PermGen bị loại bỏ từ Java 8, nhưng pool không phải Metaspace). Đã sửa thành "Pool nằm trên heap (từ Java 7, không còn PermGen)" và "OutOfMemoryError: Java heap space". Đồng thời sửa mảng char[][] thành byte[]/char[] (từ Java 9, String dùng byte[] kèm coder).
- **modern-057 (switch expression)**: Sửa sai về thời điểm chuẩn hóa. File gốc viết "Switch expression (Java 14 preview, chuẩn Java 21)" — switch expression chuẩn từ Java 14 (JEP 361), không phải preview ở Java 21. Đã sửa thành "Switch expression (JEP 361, chuẩn từ Java 14)". Pattern matching cho switch mới chuẩn từ Java 21 (JEP 441), đã ghi rõ.
- **collections-043 (HashMap resize)**: Điều chỉnh phần mô tả JDK 7 vs JDK 8+. File gốc nói "JDK 8 đã khử vòng lặp vô hạn nhưng vẫn có thể mất dữ liệu" — đúng, nhưng đoạn ví dụ đời thực lại nói "một thread bị treo CPU 100% do liên kết bucket vòng (máy còn chạy JDK 7)" — mâu thuẫn. Đã làm rõ: JDK 7 gây vòng lặp, JDK 8+ dùng transfer có đuôi (tail) tránh vòng lặp nhưng vẫn có thể mất dữ liệu khi resize song song.

Các câu còn lại (collections-044, collections-045, core-057, modern-055, modern-056) đã kiểm tra kỹ thuật, không phát hiện lỗi kiến thức.

node scripts/validate.js → OK — không có lỗi (lỗi bugs.js: bug-023 là pre-existing, không phải file của task này).
