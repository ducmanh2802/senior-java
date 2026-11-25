# T2715 — 10 câu trắc nghiệm (banking) vào quiz-design.js

Status: DONE
Agent: kilo
Owns: `js/data/quiz-design.js`
After: T2647

Thêm **10 câu trắc nghiệm** vào `js/data/quiz-design.js` (topic `banking`; id `qz-banking-NNN` nối tiếp số lớn nhất của topic trong mọi file quiz: `grep -ho "qz-banking-[0-9]*" js/data/quiz*.js | sort -V | tail -1`).

Chủ đề: double-entry ledger, idempotency trong chuyển tiền, đối soát, giao dịch treo, ISO 8583 vs ISO 20022 ở mức khái niệm, PCI DSS cơ bản (không lưu CVV), làm tròn tiền với BigDecimal, giờ cut-off. Chỉ hỏi kiến thức chắc chắn đúng; khác với các câu qz-banking đã có.

> Vòng 2 của chủ đề này: các ý trên có thể đã được viết ở vòng trước — đọc file và chọn góc **chưa có** (tình huống khác, mức sâu hơn, lỗi production khác).

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

Added qz-banking-038..047 (10 câu). node --check OK. validate.js còn lỗi unrelated (lessons-jpa-020 body, lessons-jvm-004 related).
Reviewed-by: kilo (T2715R)
