# T12 — Nội dung: Ngân hàng câu trắc nghiệm

Status: TODO
Agent: opencode
Owns: `js/data/quiz.js`

## Mục tiêu
Viết câu trắc nghiệm 4 lựa chọn cho **mọi topic** trong `js/data/topics.js`, **trừ** `behavioral` và `english`, theo schema ở `AGENTS.md` mục 4–5.
File đã có sẵn `qz-collections-001` làm mẫu; giữ nguyên câu đó.

- **Số lượng**: ≥ 6 câu cho mỗi topic (tổng ≥ 80 câu). ID dạng `qz-<topic>-NNN`.
- **Độ khó**: hỏi kiến thức sâu và tình huống thực tế ("Đoạn code sau in ra gì?", "Cấu hình nào gây ra…", "Chọn giải pháp phù hợp nhất cho…"),
  không hỏi định nghĩa sách giáo khoa.
- **Distractor** phải hợp lý, là những hiểu lầm phổ biến; tránh đáp án hiển nhiên sai. Các options có độ dài tương đương nhau.
- Rải đều vị trí đáp án đúng (0–3).
- `explain`: giải thích chi tiết (4–8 câu) vì sao đáp án đúng, **và lần lượt vì sao từng phương án còn lại sai**, có thể kèm code/ví dụ.
- Câu có code thì đặt code block `~~~java` trong `q` (q được render bằng markup).
- Nội dung đúng với Java 17/21, Spring Boot 3, Hibernate 6, AWS hiện hành.

Chạy `node scripts/validate.js` cho đến khi OK.

## Notes
(agent ghi chú ở đây)
