# T2778 — 10 câu trắc nghiệm (banking) vào quiz-design.js

Status: DONE
Agent: kilo
Owns: `js/data/quiz-design.js`
After: T2738

Thêm **10 câu trắc nghiệm** vào `js/data/quiz-design.js` (topic `banking`; id `qz-banking-NNN` nối tiếp số lớn nhất của topic trong mọi file quiz: `grep -ho "qz-banking-[0-9]*" js/data/quiz*.js | sort -V | tail -1`).

Chủ đề: double-entry ledger, idempotency trong chuyển tiền, đối soát, giao dịch treo, ISO 8583 vs ISO 20022 ở mức khái niệm, PCI DSS cơ bản (không lưu CVV), làm tròn tiền với BigDecimal, giờ cut-off. Chỉ hỏi kiến thức chắc chắn đúng; khác với các câu qz-banking đã có.

> Vòng 3 của chủ đề này: các ý trên có thể đã được viết ở vòng trước — đọc file và chọn góc **chưa có** (tình huống khác, mức sâu hơn, lỗi production khác).

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
Đã thêm 10 câu trắc nghiệm banking với id qz-banking-058 đến qz-banking-067:
- 058: Double-entry reversal (storno) khi ghi nhầm tài khoản đích
- 059: Idempotency key - duplicate charge khi client retry với key mới hoặc TTL ngắn hơn cửa sổ retry đối tác (multi)
- 060: Đối soát timing difference - xử lý chênh lệch do cut-off khác nhau, không tạo adjustment
- 061: Giao dịch thẻ AUTHORIZED expire - hold tự giải phóng sau 7 ngày nếu merchant không capture
- 062: Migration ISO 8583 → ISO 20022 - mapping phức tạp, UETR không map 1-1 với STAN/RRN (multi)
- 063: PCI DSS tokenization - hiển thị 4 số cuối PAN qua token service, không bao giờ gọi vault giải mã
- 064: BigDecimal rounding - HALF_EVEN (banker's rounding) giảm bias tích lũy so với HALF_UP
- 065: Cut-off value date - thứ Sáu sau cut-off, value date trượt qua cuối tuần + ngày lễ (multi)
- 066: PostgreSQL NUMERIC(19,4) tương đương Oracle NUMBER(19,4) cho tiền tệ
- 067: Saga recover - orchestrator query participant (inquiry) thay vì replay command khi crash sau khi participant reply thành công

Validation: OK (quiz-design.js không lỗi; các lỗi khác là pre-existing trong file khác).
Reviewed-by: kilo (T2778R)
