# T12 — Nội dung: Ngân hàng câu trắc nghiệm

Status: DONE
Agent: opencode
Owns: `js/data/quiz.js`

> **Quan trọng — ghi theo lô nhỏ:** model miễn phí sẽ timeout (lỗi 504) nếu sinh cả file trong một lần.
> Viết **3–4 câu mỗi lần edit**, nối vào cuối danh sách (trước dòng `);`), rồi chạy `node --check <file>` sau mỗi lô.
> Lặp lại cho đến đủ số lượng. Không cần web search dài dòng; chỉ tra cứu khi thực sự không chắc về API.

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

### Đã hoàn thành (opencode)

- **Số lượng**: `js/data/quiz.js` giờ có **90 câu trắc nghiệm** — đúng **6 câu cho mỗi topic** trong `js/data/topics.js`, trừ `behavioral` và `english`
  theo yêu cầu (15 topic × 6 câu). Câu mẫu `qz-collections-001` được giữ nguyên, không sửa.
- **ID**: `qz-<topic>-NNN` (`qz-core-001`…`qz-testing-006`), 90 ID duy nhất, không trùng.
- **Đáp án**: phân bố đều — index 0: 24 câu, index 1: 22, index 2: 22, index 3: 22.
- **Độ dài options**: đã cân bằng lại (mọi câu có tỉ lệ max/min ≤ 4, phần lớn ≤ 2.5) để không lộ đáp án qua độ dài.
- **Cấu trúc `explain`**: mỗi câu có `**Đáp án đúng: …**` khớp đúng với option tại `answer`, rồi tới mục
  `### Vì sao đúng` → `### Vì sao các phương án còn lại sai` (3–4 bullet, giải thích riêng từng distractor)
  → `> Senior tip:`. Độ dài explain trung bình ~1.800 ký tự.
- **Nội dung**: bám tình huống thực tế (đoạn code "in ra gì", cấu hình gây lỗi, chọn giải pháp), đúng với Java 17/21,
  Spring Boot 3 (Jakarta, ProblemDetail), Hibernate 6, Kafka/Resilience4j, AWS hiện hành, LLM/RAG.
- **Markup**: chỉ dùng cú pháp được `App.md()` hỗ trợ (`**đậm**`, `{{code}}`, `###`, `- `, `> `, `| bảng |`, `~~~java`).
  Không có backtick hay `${` trong nội dung. Inline code không chứa `{`/`}` (validator cấm) — các đoạn cần ngoặc
  nhọn đã chuyển sang code block.
- **Kiểm tra**: `node --check js/data/quiz.js` OK; `node scripts/validate.js` → `OK — không có lỗi.`;
  render thử toàn bộ 90 câu qua `App.md()` (dùng `scripts/browser-shim.js`) — không có HTML thô, code block rỗng
  hay ký tự `undefined`.
- Không sửa file nào ngoài `js/data/quiz.js` và file task này. Không commit.

Verify-failed: legacy — đã commit từ trước, autopilot bỏ qua
