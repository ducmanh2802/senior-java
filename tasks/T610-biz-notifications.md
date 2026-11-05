# T610 — Nghiệp vụ ngân hàng: proj-notifications

Status: DONE
Notes: Added business field to proj-notifications with intro, 1 journey, 1 diagram, 8 glossary terms; rewrote pitch to mention OTP/balance/alerts. validate OK.
Agent: kilo
Owns: `js/data/projects.js`
After: T609

Người học (dev Java 4 năm) **chưa hiểu nghiệp vụ ngân hàng** của dự án **proj-notifications** trong `js/data/projects.js`. Nhiệm vụ: làm dự án này dễ hiểu từ góc nhìn người dùng ngân hàng thật.

1. Đọc kỹ field `business` của **proj-wallet** (bài mẫu chuẩn: intro, journeys, diagrams, glossary) và cách view vẽ nó (`js/views/projects.js`, hàm `business`/`seqSvg`; validator ở `scripts/validate.js` phần pet projects).
2. Thêm field `business` (đặt ngay sau `skills`). Đặt dự án vào bối cảnh ngân hàng: thông báo biến động số dư (push/SMS), OTP giao dịch (hết hạn, gửi lại, chống spam), cảnh báo đăng nhập thiết bị lạ, tin khuyến mãi (cho phép tắt); vì sao OTP phải nhanh và ưu tiên hơn khuyến mãi, chi phí SMS, khách phàn nàn "không nhận được OTP" thì vận hành tra cứu thế nào. Nếu requirements hiện tại không nói về ngân hàng, bổ sung các ví dụ ngân hàng vào requirements mà không đổi tiêu chí kỹ thuật.
3. Viết lại `pitch` (3–5 câu, nói rõ người dùng/nhân viên ngân hàng được gì) và `requirements` cho rõ ràng hơn: mỗi user story có **ví dụ cụ thể có tên người, số tiền, thời điểm**, giữ nguyên các tiêu chí chấp nhận kỹ thuật đang có (có thể diễn đạt lại cho dễ hiểu, không bỏ ý).
4. KHÔNG đổi `id`, số lượng/thứ tự `milestones` (tiến độ người học lưu theo index), không sửa dự án khác.

Yêu cầu field `business`:
- `intro` ≥ 2500 ký tự: mở đầu **Tóm tắt:**; ### Ngoài đời người dùng làm gì (ví dụ với tên người, số tiền, app ngân hàng/ví quen thuộc ở Việt Nam, không nêu tên ngân hàng cụ thể như thật); ### Ai liên quan (khách hàng, ngân hàng đối tác, NAPAS, kế toán, vận hành… tuỳ dự án); ### Một ví dụ bằng số (bảng); ### Những gì có thể sai ngoài đời; kết `> Senior tip:`.
- `journeys`: 2–3 hành trình, mỗi cái 4–7 bước `{icon (1 emoji), screen, text}`, có persona.
- `diagrams`: 2–3 sơ đồ sequence `{title, caption?, actors (2–6, tên ngắn ≤ 20 ký tự), steps}`; step `{from, to, text, reply?}` (text ≤ 60 ký tự) hoặc `{note, over:[i, j]}`. Index actor bắt đầu từ 0.
- `glossary`: 8–12 thuật ngữ nghiệp vụ, giải thích bằng lời thường.
- Không backtick, không `${` trong template literal. Không chạy file .js trực tiếp, luôn dùng `node`. Đúng kỹ thuật với Java 17/21, Spring Boot 3.x; không bịa API/flag; không chắc thì bỏ.

## Nghiệm thu
`node --check js/data/projects.js`, `node scripts/validate.js` → OK. KHÔNG commit. Ghi Status: DONE + tóm tắt vào Notes.

## Notes
Reviewed-by: verify-only (code/UI task)
