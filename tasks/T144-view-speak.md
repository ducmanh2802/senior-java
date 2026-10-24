# T144 — View "Luyện nói tiếng Anh" (#/speak)

Status: TODO
Agent: opencode
Owns: `js/views/speak.js`, `css/views/speak.css`

Đọc AGENTS.md mục 2, 7, 9, 11 (phần giọng nói) và comment schema đầu `js/data/drills-shadow.js` (`window.DRILLS`; hiện có thể rỗng — view phải chạy với 0..n mục). Xem `js/views/interview.js` để biết cách dùng TTS (`speechSynthesis`, `SpeechSynthesisUtterance`, chọn voice `en-US`) và `App.speech.start({lang:'en', onText})` / `handle.stop()` → `{text, seconds, words, wpm, fillers}`. File stub đã gắn index.html + menu. **Không gọi App.ai** — màn này luyện miễn phí không giới hạn.

3 tab (chip) + bộ lọc theme/level:
1. **Shadowing**: hiện câu `en` (ẩn/hiện `vi`), nút ▶ Nghe (TTS, chọn tốc độ 0.75/1/1.15), 🎤 Nói lại → so khớp từ: chuẩn hoá lowercase bỏ dấu câu, tô xanh từ đúng / đỏ từ thiếu theo thứ tự (LCS hoặc so khớp tuần tự đơn giản), điểm % từ khớp. Nút Câu tiếp, chế độ tự động (nghe → chờ nói → chấm → câu tiếp).
2. **Hỏi nhanh**: TTS đọc `q` (ẩn chữ, có nút hiện chữ), đồng hồ đếm ngược `seconds`, ghi âm trả lời; hết giờ/bấm xong → hiện transcript + `App.ui.speechStats(metrics)` (wpm, filler) + `sample` + `phrases` (highlight phrase nào người học đã dùng). Tự đánh giá Tốt/Tạm/Chưa → `App.store.setStatus(drill.id, 'known'|'review'|'unknown')` để vào SRS.
3. **Thuật ngữ**: thẻ `term` + `say` + `wrong` + `example`, ▶ nghe từ và câu ví dụ, 🎤 đọc thử → đúng nếu transcript chứa term (không phân biệt hoa thường), đánh dấu known/review.

Thống kê đầu trang: số câu đã luyện hôm nay (`App.store.log('review')` mỗi lần chấm), streak. Phím tắt: Space = nghe, R = ghi âm/dừng, N = tiếp (có `<kbd>`, dùng `App.onKey`). Khi `!App.speech.supported` ẩn mic, vẫn cho nghe + tự đánh giá. Gắn `lang="en"` lên phần tử chứa tiếng Anh. Cleanup: dừng TTS (`speechSynthesis.cancel()`), dừng mic, clearInterval. CSS chỉ dùng biến, selector `.view-speak`, responsive 360px, dark mode. `node --check js/views/speak.js` + `node scripts/validate.js` → OK, rồi `Status: DONE`.

## Notes
