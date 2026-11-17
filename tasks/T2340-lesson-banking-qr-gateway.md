# T2340 — Bài học nghiệp vụ ngân hàng cho dev: Thanh toán QR và cổng thanh toán: redirect, IPN/callback, chữ ký HMAC, callback trùng và đối soát với cổng

Status: DONE
Agent: kilo
Owns: `js/data/lessons-banking.js`
After: T2264

## Bối cảnh
Người học là dev Java 4 năm **chưa có kinh nghiệm nghiệp vụ ngân hàng** nhưng muốn ứng tuyển vị trí backend ngân hàng/fintech. Bài phải dạy **từ gốc như cho người chưa biết gì**: ví dụ đời thường (Lan chuyển tiền cho Minh…), các bên tham gia, tiền và dữ liệu đi qua từng bước, chỗ nào có thể sai và xử lý thế nào. Đọc AGENTS.md mục 12, bài mẫu `lesson-collections-001`, và grep `title:` trong `js/data/lessons-banking.js` (đã có: tiền/BigDecimal, đối soát, hạn mức, khoản vay, sổ cái kép, chuyển khoản liên ngân hàng, hold/capture, hạn mức đồng thời, EOD) để KHÔNG lặp.

## Việc cần làm
Thêm ĐÚNG 1 bài (id `lesson-banking-NNN` tiếp số LỚN NHẤT, `order` tiếp theo, level senior, 30–45 phút):
Luồng merchant → cổng thanh toán (VNPay/MoMo/Stripe nói ở mức nguyên lý, không bịa tham số thật) → ngân hàng → IPN về merchant; vì sao không tin redirect của trình duyệt mà chỉ tin IPN đã kiểm chữ ký; callback đến trễ/trùng/sai số tiền; query trạng thái chủ động khi không nhận IPN; đối soát file cuối ngày. Bài tập: PaymentCallbackHandler — kiểm HMAC-SHA256 (javax.crypto.Mac), so số tiền với đơn, idempotent theo txnRef, chuyển trạng thái đơn đúng; test ≥ 5 case (chữ ký sai, trùng, sai số tiền, thành công, thất bại).
- body ≥ 3000 ký tự: ### Ngoài đời diễn ra thế nào / ### Các bên và luồng (khối `~~~seq`) / ### Trạng thái và chỗ có thể sai (bảng) / ### Hệ thống backend xử lý ra sao (code ngắn có comment) / ### Câu hỏi nên hỏi lại khi nhận yêu cầu nghiệp vụ này / ### Liên hệ phỏng vấn.
- check 3 câu (4 options, explain từng phương án). goals 3–4.
- Code chỉ JDK chuẩn, Java 17, không class public ngoài Main, test deterministic (Clock cố định, không sleep).

## Luật
Chỉ THÊM trước dòng `);` cuối file, không sửa bài cũ, không backtick, không ký hiệu đô-la + ngoặc nhọn. Không commit. Ghi số bài trước/sau vào Notes (+1).

## Nghiệm thu
`node --check js/data/lessons-banking.js`, `node scripts/test-lessons.js` (reference pass hết, starter không pass hết), `node scripts/build-light-index.js`, `node scripts/validate.js` → OK. Status: DONE + id vào Notes.

## Notes
- Trước/sau (track banking trong `lessons-banking.js`): 9 bài → 10 bài (+1).
- Đã thêm: `lesson-banking-010` (order 10, level senior, 40 phút) — "Thanh toán QR và cổng thanh toán: redirect, IPN/callback, chữ ký HMAC, callback trùng và đối soát".
- Nội dung: body có các mục Ngoài đời diễn ra thế nào, Các bên và luồng (~~~seq merchant/cổng/ngân hàng/khách), Trạng thái và chỗ có thể sai (bảng), Hệ thống backend xử lý ra sao (code HMAC-SHA256 javax.crypto.Mac, luồng kiểm tra), Câu hỏi nên hỏi lại, Liên hệ phỏng vấn, Senior tip. 3 câu check (4 options, explain từng phương án). goals 4. related banking-007/008/009.
- Bài tập: `PaymentCallbackHandler` — canonical, HMAC-SHA256, kiểm chữ ký, so số tiền, idempotent theo `txnRef`, chuyển trạng thái PENDING->PAID/FAILED; 6 test case (chữ ký sai, trùng/idempotent, sai số tiền, thành công, thất bại, callback trễ trên đơn đã chốt). Code JDK chuẩn, Java 17, deterministic.
- Kiểm tra:
  - `node --check js/data/lessons-banking.js` → OK.
  - `node scripts/test-lessons.js lesson-banking-010` → RESULT 6/6, `Lesson exercises OK: 1/1`.
  - `node scripts/build-light-index.js` → ghi `js/data/index-light.js`.
  - `node scripts/validate.js` → tổng bài học 275 (banking 10), 307 bài tập; lỗi còn lại là pre-existing ngoài file sở hữu: `sdlc.js` (missing ) after argument list), `quiz-design.js` (qz-architecture-021, qz-design-051/053/054 inline code lồng {}), `quiz-ops.js` (qz-devops-081), và cảnh báo path.js không nằm trong PATH — không do thay đổi của task này. Không còn lỗi index-light cũ.
