# T11 — View: Phỏng vấn thử (mock)

Status: DONE
Agent: cline
Owns: `js/views/mock.js`, `css/views/mock.css`

Đọc `AGENTS.md` mục 7 và `js/core/app.js`, `css/base.css` trước khi bắt đầu.
Dữ liệu có thể đang rất ít (agent khác viết song song), nên phải xử lý tốt khi không đủ câu.

> **Quan trọng — giới hạn output:** model của bạn có giới hạn token cho mỗi lượt trả lời. KHÔNG viết cả file trong một lần.
> Hãy tạo file với khung tối thiểu trước, rồi thêm từng hàm/phần bằng nhiều lần edit nhỏ (mỗi lần ≤ 120 dòng).

## Luồng
### 1. Thiết lập
- **Preset** (chips, chọn 1 cái là điền sẵn các tuỳ chọn bên dưới):
  - "Java Backend Senior": core, collections, concurrency, jvm, spring, jpa, db
  - "Microservices & System Design": microservices, design, architecture
  - "Cloud & AI": aws, ai
  - "English Interview": english (bật chế độ tiếng Anh: toàn bộ nhãn trong phiên chuyển sang tiếng Anh, ví dụ "Question 3 of 10", "Show sample answer")
  - "Tình huống thực tế": scenario, db, design
  - "Coding round": chỉ dùng bài thuật toán (xem bên dưới)
  - "Full loop": trộn tất cả, đảm bảo có ít nhất 1 câu behavioral và 1 bài coding
- Chips chọn topic (nhiều), level (Tất cả / mid / senior / lead), số câu (5 / 8 / 10 / 15), thời gian mỗi câu (2 / 3 / 5 phút).
- Checkbox "Ưu tiên câu tôi chưa thuộc".
- Nút "Bắt đầu phỏng vấn" bị disable khi không có câu nào phù hợp, kèm hiển thị số câu khả dụng.

### 2. Phiên phỏng vấn
- Header: "Câu x / N", topic, level, đồng hồ đếm ngược của câu hiện tại.
  Còn < 30s thì đổi màu `--warn`, hết giờ thì chuyển sang `--bad` và đếm âm ("Quá giờ +0:12"), không tự động chuyển câu.
- Câu hỏi hiển thị lớn (`App.md`). Có `.textarea` "Ghi chú / dàn ý câu trả lời của bạn" (giữ nội dung khi sang câu khác và quay lại).
- Nút "Xem đáp án mẫu" để mở `App.md(q.a)` cùng `follow` (ghi nhận là đã xem gợi ý).
- Tự chấm 1–5 (phím `1`–`5` khi không gõ): 1 = không trả lời được … 5 = trả lời như senior. Chấm xong sang câu tiếp theo.
  Nút "Bỏ qua" tính 0 điểm.
- Nút "Kết thúc sớm" có confirm.
- Optional (làm nếu kịp): nút 🎤 dùng Web Speech API (`webkitSpeechRecognition`, lang `vi-VN` hoặc `en-US` theo chế độ)
  để đọc chính tả vào textarea. Ẩn nút nếu trình duyệt không hỗ trợ.

### 2b. Vòng coding (bài thuật toán từ `App.algos()`, schema ở `AGENTS.md` mục 4)
- Checkbox ở màn thiết lập: "Thêm vòng coding" với 1/2/3 bài, chọn độ khó (easy/medium/hard).
- Mỗi bài coding là một "câu" trong phiên, có timer riêng (mặc định 25 phút): hiển thị `App.md(prompt)`,
  textarea mono làm editor (Tab chèn 4 space), nút "Gợi ý" mở từng hint, nút "Xem lời giải" (`solution` + `complexity`).
- Tự chấm 1–5 như câu hỏi thường. Trong tổng kết, phần coding được tính riêng.
  Cập nhật status bằng id của bài (`algo-NNN`) theo cùng quy tắc.

### 3. Tổng kết
- Điểm trung bình (/5), tổng thời gian, số câu đã xem đáp án mẫu.
- Điểm theo topic (thanh ngang) và **"Chủ đề cần cải thiện"** (điểm trung bình < 3).
- Danh sách từng câu gồm điểm, thời gian, ghi chú của bạn và đáp án mẫu (có thể mở rộng).
- Cập nhật tiến độ: điểm ≥ 4 → `known`, 3 → `review`, ≤ 2 → `unknown` (`App.store.setStatus`).
- Gọi `App.store.addMockResult({ count, avg, topics, seconds, english })`.
- Các nút "Phỏng vấn lại các câu yếu" và "Phiên mới".

### Kỹ thuật
- Cleanup interval và key handler khi rời view (`return` cleanup). Cảnh báo `beforeunload` khi đang trong phiên.
- Mobile: header dính (sticky), nút chấm điểm to.

## Notes
(agent ghi chú ở đây)

- [integrator] Agent Cline dừng do hết hạn mức free trước khi tự đánh dấu. View đã được kiểm tra bằng trình duyệt headless (render đủ route, không lỗi console) và chấp nhận; phần còn thiếu do integrator hoàn thiện.
Verify-failed: legacy — đã commit từ trước, autopilot bỏ qua
