# T2608R — Fact-check nội dung mới của T2608

Status: DONE
Agent: opencode
Owns: `js/data/quiz-java.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2608 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

Đã sửa các lỗi trong nội dung MỚI của T2608 (js/data/quiz-java.js):

1. **Hỏng cú pháp/marcup do lần chạy trước bị gián đoạn (qz-jvm-068..077, tức bản gốc 046..055)**: 163 dòng trong các template literal `explain` bị chèn số dòng `NNNN: ` ở đầu (ví dụ `4797: - Full: ...`). Đã strip toàn bộ tiền tố `^\d+: `. `node --check` pass.

2. **Trùng id (qz-jvm-046..055)**: 10 câu mới dùng id đã tồn tại trong `js/data/quiz.js` (T12 sở hữu, id 046..057). Không sửa file người khác → đổi id 10 câu này trong quiz-java.js sang 068..077 (không thêm/xoá mục, chỉ để id duy nhất). 058..067 không đụng (quiz.js dừng ở 057).

3. **qz-jvm-074 (bản gốc 052) — G1 Full GC**: sửa "G1 Full GC là single-threaded" → "đã chạy đa luồng từ JDK 10 (JEP 307)". JDK 17 Full GC của G1 là parallel, không còn single-threaded.

4. **qz-jvm-075 (bản gốc 053) — InlineLargeMethodThreshold**: sửa "mặc định 35 bytecode" → "mặc định 350 bytecode" (35 là MaxInlineSize; InlineLargeMethodThreshold mặc định 350 với C2).

5. **qz-jvm-059 — ZGC compressed oops**: đáp án [0,1] nhưng option E "ZGC không hỗ trợ compressed oops" thực ra ĐÚNG (ZGC dùng colored pointers 64-bit, không hỗ trợ compressed oops; Shenandoah thì có) → mâu thuẫn. Sửa option E thành "ZGC hỗ trợ compressed oops ... như Shenandoah" (sai) và viết lại explain (bỏ câu tiếng Anh "Actually ... true-ish", nêu rõ ZGC không hỗ trợ compressed oops).

Không sửa nội dung đã có ở HEAD, không thêm/xoá mục, không chỉnh văn phong.

`node scripts/validate.js`: **quiz-java.js không còn lỗi**. LỖI còn lại thuộc file KHÔNG sở hữu (không được sửa theo luật 3):
- `lessons-jpa.js: lesson-jpa-020 body < 2500` — file đang được agent khác sửa (có trong working tree).
- `lessons-jvm.js: lesson-jvm-004 related "jvm-032" không tồn tại` — lỗi có sẵn ở HEAD (file không nằm trong diff).
Đề xuất integrator/task nội dung liên quan xử lý 2 lỗi này.
