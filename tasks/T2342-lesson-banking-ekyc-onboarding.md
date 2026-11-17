# T2342 — Bài học nghiệp vụ ngân hàng cho dev: eKYC và mở tài khoản online: các bước, trạng thái, retry, kiểm tra AML

Status: DONE
Agent: kilo
Owns: `js/data/lessons-banking.js`
After: T2341

## Bối cảnh
Người học là dev Java 4 năm **chưa có kinh nghiệm nghiệp vụ ngân hàng** nhưng muốn ứng tuyển vị trí backend ngân hàng/fintech. Bài phải dạy **từ gốc như cho người chưa biết gì**: ví dụ đời thường (Lan chuyển tiền cho Minh…), các bên tham gia, tiền và dữ liệu đi qua từng bước, chỗ nào có thể sai và xử lý thế nào. Đọc AGENTS.md mục 12, bài mẫu `lesson-collections-001`, và grep `title:` trong `js/data/lessons-banking.js` (đã có: tiền/BigDecimal, đối soát, hạn mức, khoản vay, sổ cái kép, chuyển khoản liên ngân hàng, hold/capture, hạn mức đồng thời, EOD) để KHÔNG lặp.

## Việc cần làm
Thêm ĐÚNG 1 bài (id `lesson-banking-NNN` tiếp số LỚN NHẤT, `order` tiếp theo, level senior, 30–45 phút):
Luồng: nhập thông tin → chụp giấy tờ (OCR) → selfie/liveness → so khớp khuôn mặt → kiểm tra danh sách đen/AML → tạo CIF + tài khoản; trạng thái và chỗ có thể treo; retry an toàn khi bên thứ ba timeout; lưu bằng chứng để audit; quy định ở mức nguyên lý (không trích số điều luật nếu không chắc). Bài tập: OnboardingFlow — state machine + idempotent step + giới hạn số lần thử liveness; test ≥ 5 case.
- body ≥ 3000 ký tự: ### Ngoài đời diễn ra thế nào / ### Các bên và luồng (khối `~~~seq`) / ### Trạng thái và chỗ có thể sai (bảng) / ### Hệ thống backend xử lý ra sao (code ngắn có comment) / ### Câu hỏi nên hỏi lại khi nhận yêu cầu nghiệp vụ này / ### Liên hệ phỏng vấn.
- check 3 câu (4 options, explain từng phương án). goals 3–4.
- Code chỉ JDK chuẩn, Java 17, không class public ngoài Main, test deterministic (Clock cố định, không sleep).

## Luật
Chỉ THÊM trước dòng `);` cuối file, không sửa bài cũ, không backtick, không ký hiệu đô-la + ngoặc nhọn. Không commit. Ghi số bài trước/sau vào Notes (+1).

## Nghiệm thu
`node --check js/data/lessons-banking.js`, `node scripts/test-lessons.js` (reference pass hết, starter không pass hết), `node scripts/build-light-index.js`, `node scripts/validate.js` → OK. Status: DONE + id vào Notes.

## Notes

Notes: added lesson-banking-012 (order 12)
