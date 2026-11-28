# T2841 — View #/ckad: phòng thi thử CKAD thực hành + tab Lab

Status: DONE
Agent: claude
Owns: `js/views/ckad.js`, `css/views/ckad.css`, `index.html`, `js/core/i18n.js`, `js/core/data-manifest.js`
After: T2842

Đọc AGENTS.md mục 7, docs/CKAD-MOCK.md, view mẫu `js/views/upwork.js` và `js/views/exam.js` (bấm giờ, sessionStorage).

## Làm
1. **Wiring** (chỉ thêm): `js/core/data-manifest.js` thêm route `ckad: ['ckad'],` và `'ckad'` vào mảng `views` (sau `'exam'`); `index.html` thêm link nav `<a href="#/ckad" data-route="ckad">` ngay sau link `#/exam` theo mẫu các link khác (data-i18n `nav.ckad`, `navd.ckad`) và thẻ `<link>` css + `<script>` view đúng thứ tự như view khác; `js/core/i18n.js` thêm `nav.ckad` = '🚢 Thi thử CKAD', `navd.ckad` (vi + en).
2. **Tab Đề thi** `#/ckad`: danh sách đề (`window.CKAD_EXAMS`), lần thi gần nhất; khối "Chuẩn bị môi trường" render `intro`.
3. **`#/ckad/<examId>`**: nút Bắt đầu → đếm ngược `minutes` (lưu thời điểm bắt đầu trong sessionStorage), lưới điều hướng bài (số, weight, domain, trạng thái), đánh dấu xem lại. Mỗi bài: `task` qua `App.md`, nút Copy setup / Copy verify (navigator.clipboard, fallback chọn text), ô dán output verify: parse `RESULT p/t` → điểm = weight × p/t (cho nhập tay). `solution` trong `<details>`, chỉ mở sau khi nộp hoặc bật chế độ luyện tập. Nộp bài: tổng /100, đậu nếu ≥ `passPct`, điểm theo domain bằng `.progress`, bài mất điểm kèm link lời giải.
4. **Tab Lab** (`#/ckad/labs`, `#/ckad/<ckad-lab-NN>`): 12 module (`window.CKAD_LABS` theo `order`; module chưa có dữ liệu hiện "đang soạn"), tiến độ mỗi lab. Trang lab: `concepts`, từng bài có nhãn level, Copy setup/verify, ô dán kết quả (đạt khi p = t), `hints` mở từng cái, `solution` trong `<details>`.
5. Lưu `App.store.data.ckad = {history: [{id, exam, score, at, byDomain}], labs: {taskId: {p, t, at}}}` + `App.store.save()`; nộp đề gọi `App.store.log('mock')`, đạt bài lab gọi `App.store.log('review')`. Nút "Copy toàn bộ setup". Phím: `1`/`2` tab, `n`/`p` bài sau/trước, `f` đánh dấu (có `<kbd>`). Cleanup interval + key handler.

## Luật
- Escape bằng `App.esc()`; script trong `<pre>` đã escape. CSS selector bắt đầu `.view-ckad`, chỉ dùng biến màu có trong css/base.css (không hard-code màu), responsive 360px.
- Không sửa app.js / base.css / file data. Tiếng Việt CÓ DẤU.

## Nghiệm thu
Script Node tạm (không trình duyệt): nạp `scripts/browser-shim.js` + `js/data/ckad-*.js` + view (wrap `App.registerView`; shim thiếu `document.removeEventListener` thì gán hàm rỗng), render `[]`, `['ckad-1']`, `['labs']`, `['ckad-lab-01']` không throw, HTML không chứa `undefined`/`NaN`. Xoá script tạm. `node --check js/views/ckad.js`; `node scripts/check-budget.js`; `node scripts/validate.js` không có lỗi thuộc file của bạn. KHÔNG commit, không mở trình duyệt.
Xong: `Status: DONE` + Notes.

## Notes


## Video hướng dẫn (bổ sung 2026-11-28)

Mỗi lab module (`window.CKAD_LABS`) có field `videos: [{title, url, note?}]` (YouTube). Hiện mục "🎬 Video hướng dẫn": danh sách link `<a href target="_blank" rel="noopener">` mở YouTube, kèm note (escape bằng `App.esc`). Không nhúng iframe (nặng, chặn khi mở `file://`). Không có `videos` thì ẩn mục này.
Claude viết trực tiếp (2026-11-28): js/views/ckad.js + css/views/ckad.css. Tổng quan (domain, dựng kind, alias, video), đề thực hành (bấm giờ, copy setup/verify, tự đánh dấu PASS, điểm theo weight), lab 12 module (concepts, video, hints, lời giải), link trắc nghiệm #/exam/ckad. Placeholder ckad-mock-1..3 / ckad-labs-1..3 + group/route `ckad` đã tạo.
