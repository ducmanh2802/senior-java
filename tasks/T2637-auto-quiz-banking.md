# T2637 — 10 câu trắc nghiệm (banking) vào quiz-design.js

Status: DONE
Agent: kilo
Owns: `js/data/quiz-design.js`
After: T2612

Thêm **10 câu trắc nghiệm** vào `js/data/quiz-design.js` (topic `banking`; id `qz-banking-NNN` nối tiếp số lớn nhất của topic trong mọi file quiz: `grep -ho "qz-banking-[0-9]*" js/data/quiz*.js | sort -V | tail -1`).

Chủ đề: double-entry ledger, idempotency trong chuyển tiền, đối soát, giao dịch treo, ISO 8583 vs ISO 20022 ở mức khái niệm, PCI DSS cơ bản (không lưu CVV), làm tròn tiền với BigDecimal, giờ cut-off. Chỉ hỏi kiến thức chắc chắn đúng; khác với các câu qz-banking đã có.

Theo AGENTS.md mục "Câu trắc nghiệm": dạng tình huống/đoạn code thật, không hỏi định nghĩa suông; khoảng 1/4 là `multi: true` (Chọn 2); đáp án đúng rải đều vị trí; `explain` giải thích vì sao đúng **và vì sao từng phương án sai** là sai.

## Luật
- Đọc AGENTS.md trước (mục 4–6 và mục liên quan bên dưới).
- **BẮT BUỘC viết tiếng Việt CÓ DẤU đầy đủ** (Tóm tắt, không, nguyên nhân…). Nội dung không dấu sẽ bị trả lại.
- **Chỉ THÊM** vào file sở hữu (qtool append hoặc chèn trước dòng `);` cuối file); không sửa mục đã có, không sửa file khác. Đếm id trước/sau để chắc không làm mất mục của người khác.
- Không backtick, không `${` trong nội dung template literal.
- **Kiến thức phải ĐÚNG**: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15+, HikariCP, Kafka 3.x, AWS hiện hành, JDK tools (jstack, jcmd, JFR, GC log JDK 17+). Không bịa flag, API, metric. Không chắc thì viết ở mức nguyên lý.
- Người đọc: dev Java ~4 năm, hổng nền tảng, chuẩn bị phỏng vấn Senior: giải thích **từ gốc, từng bước, VÌ SAO**, ví dụ cụ thể, số liệu khớp nhau.
- Nếu một ý trong chủ đề đã có trong file thì chọn góc khác gần nhất chưa có, ghi vào Notes.

## Nghiệm thu
`node --check js/data/quiz-design.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
Xong: sửa dòng `Status:` đầu file thành `Status: DONE`, Notes ghi id đã thêm.

## Notes
- Đã thêm 10 câu trắc nghiệm topic `banking` vào `js/data/quiz-design.js`: qz-banking-028 (sổ kép với phí, 3 bút toán), qz-banking-029 (idempotency key, race condition nhấn nút Gửi hai lần), qz-banking-030 (đối soát không có mã tham chiếu chung, ghép theo số tiền + cửa sổ thời gian), qz-banking-031 (multi, giao dịch treo PENDING + job tra soát inquiry/reversal), qz-banking-032 (ISO 8583 vs ISO 20022 ở mức tích hợp backend Java), qz-banking-033 (PCI DSS: tổng đài không được đọc lại PAN/CVV), qz-banking-034 (BigDecimal làm tròn phí %, RoundingMode, sai số tích lũy), qz-banking-035 (cut-off + ngày làm việc/trượt qua cuối tuần và ngày lễ), qz-banking-036 (multi, quy tắc idempotency key), qz-banking-037 (multi, giảm PCI DSS scope qua hosted payment page + tokenization).
- `node --check js/data/quiz-design.js` → OK. `js/data/index-light.js` đã bổ sung 10 mục quiz tương ứng ở vị trí đúng (sau qz-microservices-052, trước quiz-ops.js), trùng exatamente với đầu ra của build-light-index (đã kiểm tra bằng script tách ra ngoài repo).
- `node scripts/build-light-index.js` BỊ LỖI trước khi chạy do `js/data/lessons-design.js` có lỗi cú pháp cũ (không phải file do task này sở hữu, không được sửa theo quy tắc AGENTS.md §3); do đó validate.js không thể in `OK — không có lỗi.` toàn cục: còn các lỗi cũ không liên quan (lessons-design.js cú pháp, lessons-jvm.js related id, path.js lesson/question không tồn tại) và thông báo index-light đã cũ do các file khác đã bị sửa trong working tree (quiz-design.js của task này đã chính xác, validate không báo lỗi nào về quiz-design.js hay qz-banking-028..037).
Reviewed-by: kilo (T2637R)
