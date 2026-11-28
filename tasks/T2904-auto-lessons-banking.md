# T2904 — 2 bài học (banking) vào lessons-banking.js

Status: DONE
Agent: kilo
Owns: `js/data/lessons-banking.js`
After: T2828

Thêm **2 bài học mới** (track `banking`, id/order nối tiếp bài cuối — 037, 038). **Đọc kỹ bài mẫu `lesson-collections-001`** (`node scripts/qtool.js show js/data/lessons-collections.js lesson-collections-001`) và các bài đã có trong file để không trùng.

Nội dung: (1) Sổ cái double-entry — bài tập ghi bút toán nợ/có, kiểm tra cân bằng, không cho số dư âm; (2) Đối soát — bài tập so khớp 2 danh sách giao dịch (nội bộ vs đối tác) theo mã tham chiếu, phân loại khớp / lệch số tiền / chỉ có một bên.

> Vòng 4 của chủ đề này: các ý trên có thể đã được viết ở vòng trước — đọc file và chọn góc **chưa có** (tình huống khác, mức sâu hơn, lỗi production khác).

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

Đã thêm 2 bài (order nối tiếp 036 → 037, 038), chọn góc CHƯA có trong file (các bài 005/017/019/021/023/025 về sổ cái và 002/016/018/020/022/024/026 về đối soát đã có, nên 037/038 đi hướng khác):

- **lesson-banking-037** — Sổ cái kép CÓ TRẠNG THÁI TÀI KHOẢN: phong tỏa (FROZEN) chỉ chặn ghi Nợ, đóng (CLOSED) chặn cả hai; CA/ không âm, SYS/ được âm; kiểm tra trước khi ghi (nguyên tử); txId idempotency. Exercise `Ledger` (setStatus/status/post/balance/txCount).
- **lesson-banking-038** — Đối soát KHI CÓ GIAO DỊCH TRÙNG: khớp theo đa tập (multiset) cặp (ref, amount), phân loại 5 nhóm matched/amountMismatch/onlyInternal/onlyPartner/duplicateRefs (Map(ref→amount) đơn giản sai khi ref lặp). Exercise `Reconciler.reconcile`.

Nghiệm thu:
- `node --check js/data/lessons-banking.js` → OK.
- `node scripts/test-lessons.js lesson-banking-037` → reference 27/27 pass, starter biên dịch được và KHÔNG pass hết.
- `node scripts/test-lessons.js lesson-banking-038` → reference 13/13 pass, starter biên dịch được và KHÔNG pass hết.
- `node scripts/validate.js`: nạp đủ, `banking 38 bài học` (tăng từ 36), KHÔNG có lỗi schema/markup nào ở 037/038.

BLOKER (không thuộc file tôi sở hữu, đã tuân thủ AGENTS.md luật 3 — KHÔNG tự sửa):
- `js/data/quiz-ccdv-1.js` đang lỗi cú pháp của agent khác ("missing ) after argument list" tại dòng 2864) → `node scripts/build-light-index.js` fail, nên `index-light.js` không regenerate được.
- `node scripts/validate.js` do đó còn 2 lỗi: `quiz-ccdv-1.js` (cú pháp) và `index-light.js` (cũ). Cả hai nằm ngoài `lessons-banking.js`.
- Đề xuất: integrator sửa `quiz-ccdv-1.js` rồi chạy `node scripts/build-light-index.js` và `node scripts/validate.js` để đóng nốt 2 lỗi này (không phải lỗi của task T2904).
Reviewed-by: kilo (T2904R)
