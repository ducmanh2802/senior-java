# T772R — Fact-check nội dung mới của T772

Status: DONE
Agent: opencode
Owns: `js/data/lessons-jvm.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T772 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- `node --check js/data/lessons-jvm.js` → OK.
- `node scripts/test-lessons.js lesson-jvm-006` → OK (1/1, reference 10/10 tests; starter compile nhưng không pass hết).
- `node scripts/test-lessons.js lesson-jvm-007` → OK (1/1, reference 9/9 tests; starter compile nhưng không pass hết).
- `node scripts/validate.js` → "OK — không có lỗi" (có vài warning sẵn có ở file khác, không phải lỗi; không thuộc file sở hữu).
- Kiểm tra `related` IDs tồn tại: `jvm-006,009,015,021` và `concurrency-006,021,031` đều có trong `js/data/q-concurrency-jvm.js`.
- Không sửa nội dung đã có ở HEAD (phần thêm mới bắt đầu từ `lesson-jvm-006` line ~1723). Không thêm/xoá mục.

### Lỗi đã sửa (theo id)
- `lesson-jvm-006` (body, Pause Full): Sửa khẳng định sai "Trên JDK 17 full GC của G1 chạy một thread; phải tới JDK 21 nó mới được song song hoá" (sai). Thực tế: G1 Full GC chạy parallel từ JDK 10 (JEP 307), nên trên JDK 17 đã song song; dù vậy heap lớn vẫn có thể pause nhiều giây — giữ đúng ý cảnh báo. (AGENTS chuẩn Java 17/21.)
- `lesson-jvm-006` (check, explain câu live set tăng bậc thang): Bỏ cụm sai "(JDK 17 chạy full GC một thread)"; làm rõ Full GC dừng thế giới và heap càng lớn pause càng dài.
- `lesson-jvm-006` (body/check/prompt): Sửa nhầm nhãn G1: "Pause Rebuild" (không phải pause của G1 ở ngữ cảnh này) → "Pause Cleanup" (Remark/Cleanup là các STW pause đi kèm concurrent marking cycle). Áp dụng ở bullet giải thích, mục lỗi hay gặp, và prompt bài tập (ngoài phạm vi đếm pause).
- `lesson-jvm-007` (body): Sửa chữ nước ngoài/lẫn: "identical với..." → "hoàn toàn giống với..."; "đang Burn CPU" → "đang ngốn CPU" và giải thích "downstream (dịch vụ phía sau: DB, API khác)"; "always lấy khoá..." → "luôn lấy khoá..."; "phương pháp" (sai ngữ cảnh thread dump) → "phương thức (method)".
- `lesson-jvm-007` (check, option RUNNABLE socketRead0): "Burn CPU" → "ngốn CPU" cho nhất quán.

### Notes khác (ngoài phạm vi sở hữu, không sửa)
- `node scripts/build-light-index.js` thất bại do lỗi cú pháp có sẵn trong `js/data/q-system-design.js` (không do task này; `git diff --name-only HEAD -- js/data/q-system-design.js` rỗng). Theo luật 3, không sửa file ngoài phạm vi; đề xuất integrator kiểm tra/sửa `q-system-design.js` rồi chạy lại `node scripts/build-light-index.js`. T772R không thêm/sửa câu hỏi/bài học/algo/sd/drill/công ty ngoài diff T772 đã có; index-light hiện báo "đã cũ" — cần rebuild sau khi `q-system-design.js` được sửa.
