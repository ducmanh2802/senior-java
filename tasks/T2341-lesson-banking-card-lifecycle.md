# T2341 — Bài học nghiệp vụ ngân hàng cho dev: Vòng đời giao dịch thẻ: authorization, clearing, settlement, refund và chargeback

Status: DONE
Agent: kilo
Owns: `js/data/lessons-banking.js`
After: T2340

## Bối cảnh
Người học là dev Java 4 năm **chưa có kinh nghiệm nghiệp vụ ngân hàng** nhưng muốn ứng tuyển vị trí backend ngân hàng/fintech. Bài phải dạy **từ gốc như cho người chưa biết gì**: ví dụ đời thường (Lan chuyển tiền cho Minh…), các bên tham gia, tiền và dữ liệu đi qua từng bước, chỗ nào có thể sai và xử lý thế nào. Đọc AGENTS.md mục 12, bài mẫu `lesson-collections-001`, và grep `title:` trong `js/data/lessons-banking.js` (đã có: tiền/BigDecimal, đối soát, hạn mức, khoản vay, sổ cái kép, chuyển khoản liên ngân hàng, hold/capture, hạn mức đồng thời, EOD) để KHÔNG lặp.

## Việc cần làm
Thêm ĐÚNG 1 bài (id `lesson-banking-NNN` tiếp số LỚN NHẤT, `order` tiếp theo, level senior, 30–45 phút):
Các bên: chủ thẻ, merchant, acquirer, scheme (Visa/Mastercard/NAPAS), issuer; auth giữ tiền ≠ trừ tiền; clearing/settlement T+1; refund là giao dịch mới; chargeback và tranh chấp; vì sao số dư 'khả dụng' khác số dư 'thực'. (Bài hold/capture đã có: không lặp, nói thêm settlement/chargeback). Bài tập: CardTxnLifecycle state machine (AUTHORIZED → CAPTURED → SETTLED → REFUNDED/CHARGEBACK, auth hết hạn sau N ngày bằng Clock cố định); test ≥ 5 case chuyển trạng thái hợp lệ/không hợp lệ.
- body ≥ 3000 ký tự: ### Ngoài đời diễn ra thế nào / ### Các bên và luồng (khối `~~~seq`) / ### Trạng thái và chỗ có thể sai (bảng) / ### Hệ thống backend xử lý ra sao (code ngắn có comment) / ### Câu hỏi nên hỏi lại khi nhận yêu cầu nghiệp vụ này / ### Liên hệ phỏng vấn.
- check 3 câu (4 options, explain từng phương án). goals 3–4.
- Code chỉ JDK chuẩn, Java 17, không class public ngoài Main, test deterministic (Clock cố định, không sleep).

## Luật
Chỉ THÊM trước dòng `);` cuối file, không sửa bài cũ, không backtick, không ký hiệu đô-la + ngoặc nhọn. Không commit. Ghi số bài trước/sau vào Notes (+1).

## Nghiệm thu
`node --check js/data/lessons-banking.js`, `node scripts/test-lessons.js` (reference pass hết, starter không pass hết), `node scripts/build-light-index.js`, `node scripts/validate.js` → OK. Status: DONE + id vào Notes.

## Notes
Added lesson-banking-011 (order 11) covering card transaction lifecycle: authorization/hold, clearing, settlement T+1, refund (new reverse transaction), chargeback (dispute with fees), auth expiry (7 days). Exercise: CardTxnLifecycle state machine with Clock-based auth expiry, capture/refund/chargeback amount validation, VOID/EXPIRE paths. 3 check questions with detailed explains. Validated: syntax OK, build-light-index OK, validate.js OK (pre-existing errors in lessons-jpa.js/projects.js/path.js unrelated).
