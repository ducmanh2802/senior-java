# T882 — Upwork từ A–Z phần 1: profile, Connects, chọn job, giá, chống lừa đảo (8 câu)

Status: DONE
Agent: kilo
Owns: `js/data/q-remote.js`

Topic **remote** (file `js/data/q-remote.js`, topic mới "Remote & Freelance (Upwork)"). **Đọc kỹ câu mẫu `remote-001`** (chuẩn chất lượng: giải thích tiếng Việt, mẫu câu/email/proposal tiếng Anh trong ~~~text, bảng nên/không nên, sai lầm hay gặp) và mọi câu remote đã có; không trùng ý. id tiếp nối số lớn nhất (`remote-002`…).

**Độ chính xác (bắt buộc):** phí dịch vụ, giá và số Connects, ngưỡng Top Rated/Rising Talent/Expert-Vetted, chính sách rút tiền, điều khoản chống lách nền tảng (non-circumvention) **thay đổi theo thời gian**. Chỉ ghi con số khi đã đọc trang chính thức (support.upwork.com, upwork.com/legal) bằng công cụ web của bạn, và ghi "(tại thời điểm viết, kiểm tra lại trên trang Upwork)". Không kiểm tra được thì mô tả **cơ chế**, không ghi số. Thuế và pháp lý ở Việt Nam: chỉ nêu nguyên tắc chung (thu nhập từ nước ngoài vẫn phải kê khai thuế TNCN, giữ chứng từ), khuyên hỏi chuyên gia; không bịa thuế suất. Không nêu tên người thật.

Người đọc: dev Java Việt Nam 3–6 năm, tiếng Anh đọc được nhưng chưa tự tin, chưa từng làm freelance. Mỗi câu: `**Tóm tắt:**` → các `###` (vì sao, làm từng bước, mẫu tiếng Anh dùng được ngay, bảng so sánh, sai lầm hay gặp, dấu hiệu lừa đảo nếu liên quan) → `> Senior tip:`. **3500–6000 ký tự** (người đọc hoàn toàn mới với freelance: giải thích mỗi thuật ngữ khi xuất hiện lần đầu, ví dụ minh hoạ đi từng bước với số liệu giả định rõ ràng, kết bằng mục `### Checklist` 5–8 việc làm ngay), `follow` 3 câu, `tags`. Câu hỏi theo kiểu tình huống ("Khách … bạn xử lý thế nào?").

Thêm **8 câu** (3 `mid` + 4 `senior` + 1 `lead`):
1. Đặt hourly rate khởi điểm cho dev Java Việt Nam: tham chiếu thị trường, giá thấp để "mua review" có lợi hay hại, khi nào và tăng giá thế nào với khách cũ và khách mới.
2. Đọc một job post để quyết định có gửi proposal không: các tín hiệu về client (xác minh thanh toán, tổng chi, tỉ lệ thuê, review từ freelancer khác, quốc gia/múi giờ), độ rõ của phạm vi; tính "Connects bỏ ra / khả năng thắng".
3. **Lừa đảo hay gặp với dev**: rủ chuyển sang Telegram/WhatsApp, gửi file "test task" chứa mã độc, nhờ đứng tên tài khoản hay cho "thuê" tài khoản, trả tiền ngoài nền tảng hoặc bằng crypto, gửi séc rồi đòi hoàn lại tiền thừa. Cách nhận biết, mẫu câu tiếng Anh từ chối lịch sự, báo cáo.
4. Viết cover letter / proposal cho job dài hạn (dự án lớn) khác job nhỏ thế nào; dùng câu hỏi screening; đính kèm gì; độ dài.
5. Phỏng vấn với client qua video call: chuẩn bị, mẫu câu mở đầu, xử lý khi không nghe rõ, trình bày giải pháp và ước lượng, chốt bước tiếp theo.
6. Boosted proposal, Availability badge, profile visibility, Upwork Academy/skill test: cái nào đáng tiền với người mới (mô tả cơ chế, không bịa số).
7. Xây portfolio khi chưa có khách: dự án mẫu giải quyết vấn đề thật (ví dụ tối ưu một API chậm, viết integration Stripe/PayPal sandbox), case study 1 trang, GitHub README.
8. (lead) Chiến lược 6 tháng đầu: mục tiêu số hợp đồng và review, khi nào chuyển từ job nhỏ sang hợp đồng dài, khi nào cân nhắc agency profile, cân bằng với việc full-time hiện tại (kiểm tra hợp đồng lao động về làm thêm và bảo mật).

**Số liệu Upwork đã kiểm tra (2026-11-07, từ support.upwork.com và upwork.com/resources; vẫn ghi "(tại thời điểm viết)"):**
- Phí dịch vụ freelancer: **biến động 0–15% mỗi hợp đồng**, hiển thị trước khi gửi proposal hoặc nhận offer và cố định khi hợp đồng bắt đầu. Direct contract: 5% (Basic) hoặc 0% (Freelancer Plus). Hợp đồng Enterprise thường 10%.
- Connects: **0,15 USD/Connect**, mua tối thiểu 10. Số Connects mỗi proposal **tuỳ job** (có job 0 Connect); trả lời lời mời (invite) của client không tốn Connect. Gói Basic có 10 Connects/tháng; Freelancer Plus 19,99 USD/tháng kèm 100 Connects/tháng. Connects hết hạn sau 1 năm.
- Chương trình thưởng Connects cho người mới đang thay đổi (các trang ghi khác nhau): không ghi số cụ thể.

> **CẢNH BÁO GHI ĐÈ:** file này có thể đang chứa nội dung chưa commit của task khác. **Chỉ THÊM** bằng cách chèn object mới ngay trước dòng `);` cuối file, KHÔNG viết lại cả file, KHÔNG xoá/sửa object có sẵn. Trước khi đánh DONE: đếm số id trước và sau (`grep -c "id: '"`), số sau = số trước + số mục bạn thêm. Id luôn dùng nháy đơn.
> Đánh DONE bằng cách **sửa dòng `Status:` ở đầu file** (không thêm dòng Status mới ở cuối).
> Sơ đồ luồng nhiều bên (≥ 3 hệ thống): dùng khối `~~~seq` (cú pháp trong AGENTS.md mục 5).

## Quy tắc chung (bắt buộc)
- Đọc AGENTS.md mục 4, 5, 6. Người đọc: dev Java 4 năm, ít va chạm doanh nghiệp lớn, cần giải thích **từ gốc, rất chi tiết, có ví dụ đời thực**.
- **Chỉ THÊM** câu mới vào cuối mảng trong `js/data/q-remote.js`; id tiếp nối số lớn nhất hiện có của topic (kiểm tra trùng id trước khi ghi). Không sửa câu cũ.
- TRƯỚC khi viết, đọc hết câu cùng topic để **không trùng ý**.
- Mỗi đáp án: `**Tóm tắt:**` → các mục ### (bối cảnh thật, cách làm từng bước, ví dụ số liệu/artifact, bảng trade-off, pitfall) → `> Senior tip:`. 2500–4500 ký tự. `follow` 2–3 câu.
- Không backtick, không `${` trong template literal. Không chạy file .js trực tiếp, luôn dùng `node`. Đúng kỹ thuật với Java 17/21, Spring Boot 3.x; không bịa API/flag; không chắc thì bỏ.

## Nghiệm thu
`node --check js/data/q-remote.js`, `node scripts/build-light-index.js` rồi `node scripts/validate.js` → OK. KHÔNG commit. Ghi Status: DONE + danh sách id mới vào Notes.

## Notes
- Đã THÊM 8 câu vào `js/data/q-remote.js` (chèn trước `);` cuối file), không sửa/xoá `remote-001`.
- Số ID trước: 1 (`remote-001`). Số ID sau: 9 (`remote-001`..`remote-009`) → +8 đúng yêu cầu.
- ID mới: `remote-002` (mid, hourly rate khởi điểm/tăng giá), `remote-003` (mid, đọc job post/Connects/khả năng thắng), `remote-004` (senior, chống lừa đảo: Telegram/WA, test task mã độc, thuê tài khoản, trả ngoài/crypto, séc tiền thừa), `remote-005` (senior, proposal job dài hạn vs nhỏ, screening, đính kèm, độ dài), `remote-006` (senior, phỏng vấn video call: chuẩn bị, mở đầu, không nghe rõ, giải pháp/ước lượng, chốt bước), `remote-007` (mid, Boosted proposal/Availability/visibility/Academy-skill test — cơ chế, không bịa số), `remote-008` (senior, portfolio/case study 1 trang/GitHub README), `remote-009` (lead, chiến lược 6 tháng, chuyển job nhỏ→dài hạn, agency, cân bằng full-time/NDA/xung đột lợi ích).
- Nội dung tuân thủ độ chính xác: phí 0–15%/hợp đồng, 0,15 USD/Connect, 10 Connects tối thiểu, invite không tốn Connect, Basic 10/tháng, Plus 19,99 USD/100/tháng, hết hạn 1 năm — đều ghi "(tại thời điểm viết 2026-11-07, theo support.upwork.com; kiểm tra lại)". Thuế VN: chỉ nguyên tắc chung + khuyên chuyên gia, không bịa thuế suất. Thuật ngữ giải thích lần đầu; mẫu câu/email tiếng Anh trong `~~~text`; bảng so sánh; checklist 5–8 mục/câu; follow 3 câu/câu.
- Kiểm tra: `node --check js/data/q-remote.js` OK; `node scripts/build-light-index.js` OK (remote 9 câu); `node scripts/validate.js` → `OK — không có lỗi.` (cảnh báo còn lại là `modern-033` trong `q-java.js`, file ngoài phạm vi, có từ trước). Không git commit.
Reviewed-by: kilo (T882R)
