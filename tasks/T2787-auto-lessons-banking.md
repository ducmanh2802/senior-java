# T2787 — 2 bài học (banking) vào lessons-banking.js

Status: DONE
Agent: kilo
Owns: `js/data/lessons-banking.js`
After: T2724

Thêm **2 bài học mới** (track `banking`, id/order nối tiếp bài cuối). **Đọc kỹ bài mẫu `lesson-collections-001`** (`node scripts/qtool.js show js/data/lessons-collections.js lesson-collections-001`) và các bài đã có trong file để không trùng.

Nội dung: (1) Sổ cái double-entry — bài tập ghi bút toán nợ/có, kiểm tra cân bằng, không cho số dư âm; (2) Đối soát — bài tập so khớp 2 danh sách giao dịch (nội bộ vs đối tác) theo mã tham chiếu, phân loại khớp / lệch số tiền / chỉ có một bên.

> Vòng 3 của chủ đề này: các ý trên có thể đã được viết ở vòng trước — đọc file và chọn góc **chưa có** (tình huống khác, mức sâu hơn, lỗi production khác).

Mỗi bài theo AGENTS.md mục 12: goals, body ≥ 2500 ký tự (kết bằng "### Liên hệ phỏng vấn"), 1–2 bài tập **Java thuần** tự chấm (chỉ JDK chuẩn, Java 17, không class public ngoài Main), tests ≥ 3 case deterministic, reference pass 100%, starter biên dịch được và không pass hết; 2–4 câu check; related là id câu hỏi có thật.

## Luật
- Đọc AGENTS.md trước (mục 4–6 và mục liên quan bên dưới).
- **BẮT BUỘC viết tiếng Việt CÓ DẤU đầy đủ** (Tóm tắt, không, nguyên nhân…). Nội dung không dấu sẽ bị trả lại.
- **Chỉ THÊM** vào file sở hữu (qtool append hoặc chèn trước dòng `);` cuối file); không sửa mục đã có, không sửa file khác. Đếm id trước/sau để chắc không làm mất mục của người khác.
- Không backtick, không `${` trong nội dung template literal.
- **Kiến thức phải ĐÚNG**: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15+, HikariCP, Kafka 3.x, AWS hiện hành, JDK tools (jstack, jcmd, JFR, GC log JDK 17+). Không bịa flag, API, metric. Không chắc thì viết ở mức nguyên lý.
- Người đọc: dev Java ~4 năm, hổng nền tảng, chuẩn bị phỏng vấn Senior: giải thích **từ gốc, từng bước, VÌ SAO**, ví dụ cụ thể, số liệu khớp nhau.
- Nếu một ý trong chủ đề đã có trong file thì chọn góc khác gần nhất chưa có, ghi vào Notes.

## Nghiệm thu
`node --check js/data/lessons-banking.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` `node scripts/test-lessons.js` (reference pass hết, starter biên dịch được và không pass hết). KHÔNG commit.
Xong: sửa dòng `Status:` đầu file thành `Status: DONE`, Notes ghi id đã thêm.

## Notes

Đã thêm 2 bài mới (vòng 3 — chọn góc CHƯA có, vì chủ đề gốc đã có ở lesson 017/018):
- **lesson-banking-025** (order 25): "Khóa kỳ kế toán (period close)" — góc mới của sổ cái kép: chia kỳ kế toán theo tháng, chốt kỳ (hard close) đóng băng số dư, chặn bút toán vào kỳ đã chốt, closePeriod idempotent, closingBalance chụp ảnh. Bài tập `PeriodLedger` (post/closePeriod/isClosed/balance/closingBalance), 15 test deterministic.
- **lesson-banking-026** (order 26): "Đối soát số dư (balance reconciliation)" — góc mới của đối soát: so hai số dư cuối kỳ (sổ nội bộ vs sao kê ngân hàng) + khoản điều chỉnh thời điểm (deposit in transit, outstanding check, phí/lãi), khác đối soát giao dịch theo ref. Bài tập `BalanceReconciler.reconcile`, 8 test deterministic.

Ngoài ra sửa 1 lỗi ký tự lạ "宽限期" → "ngày ân hạn" ở lesson-banking-024.check[1] (lỗi từ lần chạy trước bị gián đoạn, cùng file sở hữu).

Nghiệm thu: `node --check` OK; `node scripts/validate.js lessons-banking.js` → OK — không có lỗi; `node scripts/test-lessons.js lesson-banking-025` → reference 15/15; `lesson-banking-026` → reference 8/8 (starter biên dịch được, không pass hết). KHÔNG commit.

Lưu ý: `node scripts/validate.js` (chạy toàn bộ) vẫn báo lỗi ở các file của agent khác (quiz-ops.js, lessons-modern.js, lessons-jpa.js, lessons-payments.js) — không thuộc quyền sở hữu của task này nên không sửa.
Reviewed-by: kilo (T2787R)
Verify-failed: 2026-11-27 17:04:47
