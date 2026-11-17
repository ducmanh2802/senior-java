# T2343 — Bài học nghiệp vụ ngân hàng cho dev: Chống gian lận realtime: rule engine, velocity check, chấm điểm và quyết định chặn/OTP/cho qua

Status: DONE
Agent: kilo
Owns: `js/data/lessons-banking.js`
After: T2342

## Bối cảnh
Người học là dev Java 4 năm **chưa có kinh nghiệm nghiệp vụ ngân hàng** nhưng muốn ứng tuyển vị trí backend ngân hàng/fintech. Bài phải dạy **từ gốc như cho người chưa biết gì**: ví dụ đời thường (Lan chuyển tiền cho Minh…), các bên tham gia, tiền và dữ liệu đi qua từng bước, chỗ nào có thể sai và xử lý thế nào. Đọc AGENTS.md mục 12, bài mẫu `lesson-collections-001`, và grep `title:` trong `js/data/lessons-banking.js` (đã có: tiền/BigDecimal, đối soát, hạn mức, khoản vay, sổ cái kép, chuyển khoản liên ngân hàng, hold/capture, hạn mức đồng thời, EOD) để KHÔNG lặp.

## Việc cần làm
Thêm ĐÚNG 1 bài (id `lesson-banking-NNN` tiếp số LỚN NHẤT, `order` tiếp theo, level senior, 30–45 phút):
Rule (số tiền bất thường, thiết bị mới, nhiều giao dịch trong ít phút, người nhận mới), điểm rủi ro, 3 quyết định ALLOW/CHALLENGE(OTP)/BLOCK, độ trễ yêu cầu (< vài trăm ms), false positive và trải nghiệm người dùng, vòng phản hồi từ khiếu nại. Bài tập: VelocityRule (sliding window theo userId, Clock giả) + RiskEngine cộng điểm từ nhiều rule ra quyết định; test ≥ 5 case.
- body ≥ 3000 ký tự: ### Ngoài đời diễn ra thế nào / ### Các bên và luồng (khối `~~~seq`) / ### Trạng thái và chỗ có thể sai (bảng) / ### Hệ thống backend xử lý ra sao (code ngắn có comment) / ### Câu hỏi nên hỏi lại khi nhận yêu cầu nghiệp vụ này / ### Liên hệ phỏng vấn.
- check 3 câu (4 options, explain từng phương án). goals 3–4.
- Code chỉ JDK chuẩn, Java 17, không class public ngoài Main, test deterministic (Clock cố định, không sleep).

## Luật
Chỉ THÊM trước dòng `);` cuối file, không sửa bài cũ, không backtick, không ký hiệu đô-la + ngoặc nhọn. Không commit. Ghi số bài trước/sau vào Notes (+1).

## Nghiệm thu
`node --check js/data/lessons-banking.js`, `node scripts/test-lessons.js` (reference pass hết, starter không pass hết), `node scripts/build-light-index.js`, `node scripts/validate.js` → OK. Status: DONE + id vào Notes.

## Notes
- Số bài banking trước: 12 (lesson-banking-001..012, order 1..12). Sau: 13 (+1).
- Bài đã thêm: `lesson-banking-013`, order 13, level senior, 40 phút.
- Nội dung: rule engine + velocity check (sliding window theo userId, Clock giả) + chấm điểm rủi ro + 3 quyết định ALLOW/CHALLENGE(OTP)/BLOCK + ngân sách độ trễ + false positive + vòng phản hồi khiếu nại→nhãn→retrain. body ≈ 13427 ký tự, có khối `~~~seq` (5 actor: App/Decision/Redis/Core), bảng "Trạng thái và chỗ có thể sai", code VelocityRule + RiskEngine, 6 câu hỏi nên hỏi lại, mục "Lỗi hay gặp khi phỏng vấn", Senior tip, Liên hệ phỏng vấn.
- Bài tập: 1 exercise "VelocityRule + RiskEngine" — starter biên dịch được, reference pass 21/21 test (deterministic, Clock.fixed, không sleep).
- check: 3 câu (3 mức ALLOW/CHALLENGE/BLOCK; velocity trên RAM 1 instance vs Redis; side-effect khi tính điểm).
- Nghiệm thu: `node --check` OK; `node scripts/test-lessons.js lesson-banking-013` → reference PASS 21/21, starter FAIL (đúng yêu cầu); `node scripts/build-light-index.js` OK; `node scripts/validate.js` → KHÔNG có lỗi nào thuộc bài này (banking 13 bài). Các lỗi còn lại thuộc `quiz-ccao-2.js` và `q-devops.js` — file của task khác (đã được sửa bởi task khác trước đó, không phải file tôi sở hữu).
- KHÔNG sửa file khác, KHÔNG git commit.
- Liên quan nội dung: không lặp bài 3 (hạn mức), bài 7 (hold), bài 8 (hạn mức đồng thời). Có tham chiếu chéo tới các bài này trong body. `related`: banking-016 (fraud realtime), banking-017 (OTP/TOTP), banking-030.
- Không dùng backtick, không có `${`, không code fence ```; chỉ dùng `~~~`.
- Đã chạy: `node --check` OK, `test-lessons lesson-banking-013` 21/21 PASS reference + starter fail, `build-light-index` OK, `validate` không có lỗi của bài này.
