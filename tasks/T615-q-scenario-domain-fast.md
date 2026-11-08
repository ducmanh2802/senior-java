# T615 — 6 câu: cách hiểu nhanh luồng nghiệp vụ khi vào dự án mới

Status: DONE
Agent: kilo
Owns: `js/data/q-scenario.js`
After: T613

Thêm 6 câu topic scenario về **cách hiểu nhanh luồng nghiệp vụ** khi vào dự án/công ty mới (người học là dev Java 4 năm, hay bị "code được nhưng không hiểu nghiệp vụ"). Mỗi câu có quy trình từng bước làm theo được, ví dụ áp dụng vào một nghiệp vụ ngân hàng/bảo hiểm cụ thể (chuyển tiền, đối soát, giải ngân khoản vay, bồi thường bảo hiểm), có sơ đồ ASCII trong ~~~text. Gợi ý:
- Tuần đầu vào dự án: lộ trình 5 ngày để nắm nghiệp vụ (đọc tài liệu BA/SRS, glossary, hỏi ai, làm thử trên môi trường UAT với vai trò người dùng).
- Lần theo một request end-to-end: từ màn hình → API → service → bảng DB → event/batch; dùng log có traceId, debugger, đọc test; ghi lại thành sequence diagram.
- Đọc DB schema để hiểu nghiệp vụ: cột status và các chuyển trạng thái (state machine), bảng lịch sử/audit, đặt câu hỏi từ dữ liệu thật (chỉ-đọc).
- Event storming / vẽ luồng với BA và nghiệp vụ: domain event, command, actor, policy; biến kết quả thành glossary và danh sách câu hỏi.
- Đặt câu hỏi cho BA/PO/nghiệp vụ hiệu quả: hỏi về ngoại lệ (huỷ, hoàn, timeout, cut-off, ngày lễ), số liệu thực tế, ai chịu trách nhiệm; tránh câu hỏi chung chung.
- Trong phỏng vấn: trả lời "Bạn làm thế nào để nhanh chóng hiểu domain mới?" bằng ví dụ có số liệu (kèm câu trả lời mẫu tiếng Anh ngắn ở cuối đáp án).

## Quy tắc chung (bắt buộc)
- Đọc AGENTS.md mục 4, 5, 6. Người đọc: dev Java 4 năm, ít va chạm doanh nghiệp lớn, cần giải thích **từ gốc, rất chi tiết, có ví dụ đời thực**.
- **Chỉ THÊM** câu mới vào cuối mảng trong `js/data/q-scenario.js`; id tiếp nối số lớn nhất hiện có của topic (kiểm tra trùng id trước khi ghi). Không sửa câu cũ.
- TRƯỚC khi viết, đọc hết câu cùng topic để **không trùng ý**.
- Mỗi đáp án: `**Tóm tắt:**` → các mục ### (bối cảnh thật, cách làm từng bước, ví dụ số liệu/artifact, bảng trade-off, pitfall) → `> Senior tip:`. 2500–4500 ký tự. `follow` 2–3 câu.
- Không backtick, không `${` trong template literal. Không chạy file .js trực tiếp, luôn dùng `node`. Đúng kỹ thuật với Java 17/21, Spring Boot 3.x; không bịa API/flag; không chắc thì bỏ.

## Nghiệm thu
`node --check js/data/q-scenario.js`, `node scripts/build-light-index.js` rồi `node scripts/validate.js` → OK. KHÔNG commit. Ghi Status: DONE + danh sách id mới vào Notes.

## Notes
- Added 6 questions: scenario-103, scenario-104, scenario-105, scenario-106, scenario-107, scenario-108 (cách hiểu nhanh luồng nghiệp vụ khi vào dự án mới: lộ trình 5 ngày, đọc schema để hiểu nghiệp vụ, Event Storming, đặt câu hỏi hiệu quả, trả lời phỏng vấn STAR-style, phát hiện business rules ẩn). Mỗi câu có giải thích chi tiết từ gốc, ví dụ thực tế ngân hàng/bảo hiểm, sơ đồ ASCII đơn giản, follow-up 2-3 câu. Chỉ thêm vào cuối q-scenario.js.
- Verified: `node --check js/data/q-scenario.js` → OK; `node scripts/build-light-index.js` → OK; `node scripts/validate.js` → OK (không có Lỗi nào liên quan đến q-scenario.js; các lỗi còn lại thuộc sdlc.js/q-java.js/collections.js/modern.js/path.js là của các task khác, không phải file của T615).
- Status: DONE
Reviewed-by: kilo (T615R)
