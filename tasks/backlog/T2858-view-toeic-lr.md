# T2858 — View #/toeic: thêm tab Listening & Reading (thi thử 200 câu, luyện từng part) và tab Tips

Status: TODO
Agent: kilo
Owns: `js/views/toeic.js`, `css/views/toeic.css`, `js/core/data-manifest.js`
After: T2846

Đọc AGENTS.md mục 7, docs/TOEIC-LR.md, view hiện có `js/views/toeic.js` (giữ nguyên toàn bộ phần Speaking & Writing đang chạy).

## Làm
1. Route `toeic` trong `js/core/data-manifest.js`: thêm group `'toeic-lr'` (chỉ sửa dòng route đó). Chạy `node scripts/check-budget.js`; nếu vượt budget thì giữ route cũ và nạp lười bằng `await App.need('toeic-lr')` khi mở tab L&R/Tips (xem docs/PERFORMANCE.md).
2. Tab mới **Listening & Reading** (`#/toeic/lr`, `#/toeic/lr/<test>`, `#/toeic/lr/<test>/p<part>`):
   - Chọn đề (từ `window.TOEIC_LR` theo `test`; đề thiếu part hiện "đang soạn").
   - **Thi thử full**: Listening phát audio bằng `speechSynthesis` (đọc hướng dẫn ngắn, Part 1 đọc 4 câu (A)–(D), Part 2 đọc câu hỏi + 3 đáp án, Part 3/4 đọc script theo `sp` với giọng khác nhau cho M/W/M2/W2/N, chọn voice theo `accent` en-US/en-GB/en-AU/en-CA nếu có; đọc câu hỏi Part 3/4 rồi chờ 8 giây), không cho tua lại như đề thật; không có `speechSynthesis` thì hiện script. Part 1 hiện `picture` dạng khung mô tả ảnh. Reading bấm giờ 75 phút. Phiếu trả lời lưới 200 ô.
   - **Luyện từng part**: không giờ, có nút nghe lại, hiện `explain`, `vi`, `vocab` ngay sau khi chọn.
   - **Kết quả**: số câu đúng L/R, điểm **ước lượng** 5–495 mỗi phần (bảng quy đổi tuyến tính gần đúng, ghi rõ "ước lượng, không phải thang ETS chính thức"), đúng/sai theo part và theo `type`, xem lại từng câu (script, giải thích). Lưu `App.store.data.toeicLr = {history: [{test, l, r, at, byPart}], wrong: {n: id}}` rồi `App.store.save()`; gọi `App.store.addQuizResult` nếu phù hợp schema hiện có, nếu không thì `App.store.log('quiz')`.
   - "Ôn câu sai": luyện lại các câu sai gần nhất.
3. Tab **Tips** (`#/toeic/tips`): lọc theo kỹ năng (Listening, Reading, Speaking, Writing, Chiến lược), mỗi bài render `body` bằng `App.md`, checklist tick lưu `App.store.data.toeicLr.tips`.
4. Phím tắt: A/B/C/D chọn đáp án, `n`/`p` câu sau/trước, `space` nghe lại (chỉ chế độ luyện); có gợi ý `<kbd>`. Cleanup: `speechSynthesis.cancel()`, interval, key handler.

## Luật
- Escape bằng `App.esc()`, markup qua `App.md()`; nội dung tiếng Anh gắn `lang="en"`. CSS selector bắt đầu `.view-toeic`, chỉ dùng biến màu có trong css/base.css (không hard-code màu), responsive 360px.
- Không sửa app.js / base.css / file data. Tiếng Việt CÓ DẤU.

## Nghiệm thu
Script Node tạm (không trình duyệt): nạp `scripts/browser-shim.js` + data toeic + view (wrap `App.registerView`; shim thiếu `document.removeEventListener`/`speechSynthesis` thì gán stub), render `[]`, `['lr']`, `['lr','1']`, `['tips']` không throw, HTML không chứa `undefined`/`NaN`. Xoá script tạm. `node --check js/views/toeic.js`; `node scripts/check-budget.js`; `node scripts/validate.js` không có lỗi thuộc file của bạn. KHÔNG commit, không mở trình duyệt.
Xong: `Status: DONE` + Notes.

## Notes


## Video hướng dẫn (bổ sung 2026-11-28)

Mỗi tip (`window.TOEIC_TIPS`) có field `videos: [{title, url, note?}]` (YouTube). Hiện mục "🎬 Video hướng dẫn": danh sách link `<a href target="_blank" rel="noopener">` mở YouTube, kèm note (escape bằng `App.esc`). Không nhúng iframe (nặng, chặn khi mở `file://`). Không có `videos` thì ẩn mục này.
