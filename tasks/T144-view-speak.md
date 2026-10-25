# T144 — View "Luyện nói tiếng Anh" (#/speak)

Status: DONE
Agent: opencode
Owns: `js/views/speak.js`, `css/views/speak.css`

Đọc AGENTS.md mục 2, 7, 9, 11 (phần giọng nói) và comment schema đầu `js/data/drills-shadow.js` (`window.DRILLS`; hiện có thể rỗng — view phải chạy với 0..n mục). Xem `js/views/interview.js` để biết cách dùng TTS (`speechSynthesis`, `SpeechSynthesisUtterance`, chọn voice `en-US`) và `App.speech.start({lang:'en', onText})` / `handle.stop()` → `{text, seconds, words, wpm, fillers}`. File stub đã gắn index.html + menu. **Không gọi App.ai** — màn này luyện miễn phí không giới hạn.

3 tab (chip) + bộ lọc theme/level:
1. **Shadowing**: hiện câu `en` (ẩn/hiện `vi`), nút ▶ Nghe (TTS, chọn tốc độ 0.75/1/1.15), 🎤 Nói lại → so khớp từ: chuẩn hoá lowercase bỏ dấu câu, tô xanh từ đúng / đỏ từ thiếu theo thứ tự (LCS hoặc so khớp tuần tự đơn giản), điểm % từ khớp. Nút Câu tiếp, chế độ tự động (nghe → chờ nói → chấm → câu tiếp).
2. **Hỏi nhanh**: TTS đọc `q` (ẩn chữ, có nút hiện chữ), đồng hồ đếm ngược `seconds`, ghi âm trả lời; hết giờ/bấm xong → hiện transcript + `App.ui.speechStats(metrics)` (wpm, filler) + `sample` + `phrases` (highlight phrase nào người học đã dùng). Tự đánh giá Tốt/Tạm/Chưa → `App.store.setStatus(drill.id, 'known'|'review'|'unknown')` để vào SRS.
3. **Thuật ngữ**: thẻ `term` + `say` + `wrong` + `example`, ▶ nghe từ và câu ví dụ, 🎤 đọc thử → đúng nếu transcript chứa term (không phân biệt hoa thường), đánh dấu known/review.

Thống kê đầu trang: số câu đã luyện hôm nay (`App.store.log('review')` mỗi lần chấm), streak. Phím tắt: Space = nghe, R = ghi âm/dừng, N = tiếp (có `<kbd>`, dùng `App.onKey`). Khi `!App.speech.supported` ẩn mic, vẫn cho nghe + tự đánh giá. Gắn `lang="en"` lên phần tử chứa tiếng Anh. Cleanup: dừng TTS (`speechSynthesis.cancel()`), dừng mic, clearInterval. CSS chỉ dùng biến, selector `.view-speak`, responsive 360px, dark mode. `node --check js/views/speak.js` + `node scripts/validate.js` → OK, rồi `Status: DONE`.

- **Song ngữ (bắt buộc):** mọi chuỗi giao diện qua `App.t(key, vars)`; đăng ký từ điển ở đầu IIFE bằng `App.i18n.add({ vi: {...}, en: {...} })` (key dạng `<view>.<tên>`), `title` của view viết dạng `get title() { return App.t("<view>.title"); }`. Xem comment đầu `js/core/i18n.js`. Nội dung dữ liệu (câu hỏi, đáp án, bài học, drill) giữ nguyên, không dịch.

## Notes

- Đã dựng đủ 3 tab (Shadowing / Hỏi nhanh / Thuật ngữ) + lọc theme/level, chạy được với `window.DRILLS` rỗng (empty state) và 0..n mục.
- Shadowing: TTS chọn tốc độ 0.75/1/1.15, ẩn/hiện nghĩa, ghi âm rồi so khớp bằng LCS, tô xanh/đỏ từng từ và tính % từ khớp; có chế độ tự động nghe → nói → chấm → câu tiếp.
- Hỏi nhanh: ẩn/hiện câu hỏi, đếm ngược theo `seconds`, dừng mic khi hết giờ hoặc bấm xong; hiện transcript, `App.ui.speechStats`, đáp án mẫu và badge các phrase đã dùng; tự đánh giá Tốt/Tạm/Chưa → `App.store.setStatus`.
- Thuật ngữ: nghe từ / nghe câu ví dụ, đọc thử và nhận diện term trong transcript (không phân biệt hoa thường), đánh dấu Đã thuộc / Cần ôn.
- Thống kê đầu trang (review hôm nay, streak, số đã thuộc) + phím tắt Space/R/N qua `App.onKey` có `<kbd>`; ẩn mic và vẫn cho nghe/tự đánh giá khi `!App.speech.supported`.
- Song ngữ đầy đủ bằng `App.i18n.add` + `App.t`; `lang="en"` trên câu/transcript/term/sample; cleanup dừng TTS, mic và interval.
- Đã kiểm tra: `node --check js/views/speak.js`, `node scripts/validate.js` → `OK — không có lỗi.`; test render/logic bằng DOM stub trong Node (không mở trình duyệt) cho cả trạng thái có/không mic và dữ liệu rỗng.
Reviewed-by: opencode (T144R)
