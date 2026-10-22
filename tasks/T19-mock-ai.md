# T19 — Phỏng vấn thử: trả lời bằng giọng nói + AI chấm + hỏi đào sâu

Status: TODO
Agent: opencode
Owns: `js/views/mock.js`, `css/views/mock.css`

> **Quan trọng — ghi theo lô nhỏ:** sửa file bằng nhiều edit nhỏ (mỗi lần ≤ 120 dòng). Không viết lại toàn bộ file.
> File hiện tại đã chạy tốt, chỉ được **bổ sung**, không phá luồng có sẵn.

Đọc `AGENTS.md` mục 7 và **mục 9** (App.ai / App.speech / App.ui), `js/core/ai.js`, rồi đọc kỹ `js/views/mock.js` hiện tại.

## Yêu cầu
Trong phiên phỏng vấn, mỗi câu hỏi tự luận (không phải bài coding) đã có textarea ghi chú. Biến nó thành **"Câu trả lời của bạn"** và bổ sung:

1. **🎤 Trả lời bằng giọng nói** (nút `.btn.mic-btn`, ẩn nếu `!App.speech.supported`):
   - Bấm để bắt đầu: `App.speech.start({lang, onText})`, với `lang = 'en'` khi câu hỏi có `lang:'en'` hoặc phiên ở chế độ English.
     Chữ nhận dạng được đổ dần vào textarea (phần final, cộng phần interim hiển thị mờ hoặc nối tạm). Bấm lần nữa để dừng.
   - Khi dừng, lưu metrics `{seconds, words, wpm, fillers}` cho câu đó và hiển thị bằng `App.ui.speechStats(metrics)`.
   - Gợi ý nhỏ phía dưới: "Mục tiêu: 1–2 phút, 110–160 từ/phút, ít từ đệm".
2. **🤖 Chấm bằng AI** (chỉ gọi khi người dùng bấm; disable khi textarea trống):
   - Gọi `App.ai.grade({question: q.q, reference: q.a, answer, lang, topic: q.topic, level: q.level, speech: metrics || undefined})`.
   - Khi đang chờ hiển thị `<span class="ai-loading">AI đang chấm…</span>`. Kết quả hiển thị bằng `App.ui.feedback(result, lang)`. Lỗi thì `App.ui.error(e)`.
   - Điểm AI tự **gợi ý** điểm tự chấm 1–5: highlight nút tương ứng. Người dùng vẫn phải bấm để xác nhận, có thể chấm khác.
3. **Hỏi đào sâu** (tối đa 2 lượt mỗi câu): nếu kết quả có `follow_up`, hiện nút "Trả lời câu hỏi đào sâu".
   Bấm vào thì mở thêm một ô trả lời (cũng có mic) dưới câu hỏi đào sâu, rồi "Chấm" bằng `App.ai.grade` với
   `question = follow_up`, `history = [{question: q.q, answer: câu trả lời đầu}, ...các lượt trước]`. Hiển thị feedback từng lượt.
4. Lưu cho từng câu trong phiên: `answer`, `speech`, `ai` (kết quả lượt đầu) và `followups[]`. Giữ nguyên khi chuyển qua lại giữa các câu.
5. **Tổng kết phiên**:
   - Thêm cột "AI" (điểm AI nếu có) cạnh điểm tự chấm, và tóm tắt "Điểm AI trung bình" nếu có ít nhất 1 câu được chấm.
   - Trong phần mở rộng của mỗi câu: hiển thị lại feedback AI và speech stats.
   - `App.store.addMockResult` thêm field `aiAvg` (hoặc `null`).
6. Chế độ English: các nhãn mới cũng phải có bản tiếng Anh ("Answer with voice", "Grade with AI", "Answer follow-up").
7. Responsive: trên mobile, các nút mic và AI full-width.

## Nghiệm thu
- `node --check js/views/mock.js` OK. Không có lỗi khi mở `#/mock`, bắt đầu một phiên và chuyển câu (khi chạy trên `file://` thì nút AI báo lỗi thân thiện là đúng).
- Không gọi AI tự động. Không phá luồng tự chấm, timer và vòng coding hiện có.

## Notes
(agent ghi chú ở đây)
