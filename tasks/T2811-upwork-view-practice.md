# T2811 — #/upwork: luyện xử lý case (tự viết + AI chấm) và thống kê tiến độ

Status: DONE
Agent: kilo
Owns: `js/views/upwork.js`, `css/views/upwork.css`

Đọc AGENTS.md mục 7 và 9, docs/UPWORK-GUIDE.md, và view hiện có `js/views/upwork.js` (đã chạy tốt; giữ nguyên route, store, phím tắt `1`/`2`).

## Làm
1. **Luyện xử lý case** (trang chi tiết case, đặt TRƯỚC khối "Xem cách xử lý từng bước"):
   - Textarea "Bạn sẽ làm gì? Viết các bước và tin nhắn gửi khách". Lưu nháp vào `App.store.data.upwork.drafts[caseId]` khi gõ (debounce ~500 ms).
   - Nút micro (`.btn.mic-btn`, thêm `.recording` khi đang ghi; ẩn khi `!App.speech.supported`) dùng `App.speech.start({lang: 'vi', onText})` để đọc chính tả vào textarea.
   - Nút "🤖 AI chấm": chỉ gọi khi người dùng bấm; disable khi đang chờ và hiện `<span class="ai-loading">AI đang chấm…</span>`.
     Gọi `await App.ai.grade({question: title + '\n' + situation, reference: steps + '\nSai lầm hay gặp: ' + mistakes.join('; '), answer, lang: 'vi', topic: 'remote', level})`.
     Hiển thị bằng `App.ui.feedback(result, 'vi')`; bọc try/catch → `App.ui.error(e)`. Lưu điểm gần nhất `App.store.data.upwork.scores[caseId] = {score, at}`.
   - Câu trả lời < 80 ký tự: không gọi AI, nhắc viết thêm.
2. **Thống kê**: đầu tab Case khó hiện số case đã nắm / tổng, điểm AI trung bình, tiến độ theo từng nhóm (category) bằng `.progress`. Đầu tab Cẩm nang hiện số chương đã đọc và số mục checklist đã tick.
3. **Case ngẫu nhiên**: nút "🎲 Case ngẫu nhiên chưa nắm" ở tab Case khó, phím tắt `r` (có gợi ý `<kbd>`).
4. Danh sách case: hiện `App.ui.scoreBadge(n)` của điểm AI gần nhất nếu có.

## Luật
- Escape mọi dữ liệu bằng `App.esc()`; markup qua `App.md()`. CSS mọi selector bắt đầu `.view-upwork`, chỉ dùng biến màu, responsive 360px.
- Cleanup đầy đủ (listener, timer debounce, speech handle) trong hàm trả về của `render`.
- Không sửa app.js / ai.js / data-manifest.js / base.css / file data (cần thì ghi Notes). Tiếng Việt CÓ DẤU.

## Nghiệm thu
Script Node tạm (không trình duyệt): nạp `scripts/browser-shim.js` + `js/data/upwork-*.js` + `js/views/upwork.js` (bắt view qua wrap `App.registerView`; shim thiếu `document.removeEventListener` thì gán hàm rỗng), render các route `[]`, `['cases']`, `['uw-ch-01']`, `['uw-case-001']` không throw, HTML không chứa `undefined`/`NaN`. Xoá script tạm, ghi kết quả vào Notes.
`node --check js/views/upwork.js`; `node scripts/check-budget.js`; `node scripts/validate.js` không có lỗi thuộc file của bạn. KHÔNG commit, không mở trình duyệt.
Xong: `Status: DONE` + Notes.

## Notes
- File đã có sẵn nội dung đầy đủ từ lần chạy trước; đã đọc lại, giữ nguyên, kiểm tra cú pháp và chạy nghiệm thu.
- `node --check js/views/upwork.js` → OK.
- `node scripts/check-budget.js` → OK (upwork route 782 KB, trong budget).
- `node scripts/validate.js` → các lỗi còn lại đều thuộc file khác (quiz-ops.js, lessons-modern/jpa/payments.js), KHÔNG có lỗi nào thuộc `js/views/upwork.js` / `css/views/upwork.css`.
- Script Node tạm (đã xoá sau khi chạy): nạp browser-shim + group `upwork` + view (wrap `App.registerView`), gán `document.removeEventListener = ()=>{}`; render `[]`, `['cases']`, `['uw-ch-01']`, `['uw-case-001']` không throw, HTML không chứa `undefined`/`NaN` → RESULT: PASS.
- Đã có đủ: luyện xử lý case (textarea + debounce 500ms lưu `upwork.drafts`, nút mic `.btn.mic-btn`/`.recording` ẩn khi `!App.speech.supported`, nút AI chấm disable + `.ai-loading`, gọi `App.ai.grade` đúng tham số, `App.ui.feedback`/`App.ui.error`, lưu `upwork.scores`, chặn < 80 ký tự); thống kê (case đã nắm/tổng, điểm AI TB, progress theo category; chương đã đọc + checklist tick); case ngẫu nhiên chưa nắm + phím tắt `r` có `<kbd>`; badge điểm AI gần nhất trong danh sách case. Khối luyện đặt TRƯỚC khối "Xem cách xử lý từng bước".
- Không sửa file ngoài quyền sở hữu; không commit; không mở trình duyệt; không kill tiến trình.
Reviewed-by: verify-only (code/UI task)
