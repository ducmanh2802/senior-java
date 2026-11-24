# T2566 — Sửa T2552: khối bài học/lab/bug trên lộ trình phải đọc DATA_INDEX

Status: DONE
Agent: kilo
Owns: `js/views/roadmap.js`, `css/views/roadmap.css`
After: T2552

## Vấn đề
T2552 thêm `materialsHtml()` trong `js/views/roadmap.js` nhưng lấy dữ liệu từ `App.lessons()`, `window.LABS`, `window.BUGS`.
Route `#/roadmap` chỉ nạp group `index` (xem `js/core/data-manifest.js`, dòng `roadmap: ['index']`), nên khi mở thẳng `#/roadmap` ba nguồn này rỗng → khối "📘 Bài học · 🧪 Lab · 🐞 Sửa bug" **không bao giờ hiện**. KHÔNG được thêm group nặng vào route roadmap.

## Làm
Đổi `materialsHtml()` sang đọc `window.DATA_INDEX` (sinh bởi `scripts/build-light-index.js`, đã có sẵn):
- `DATA_INDEX.lessons`: mảng object `{id, track, order, title, level, minutes}`.
- `DATA_INDEX.labs`: mảng tuple `[id, category, title, level]`.
- `DATA_INDEX.bugs`: mảng tuple `[id, title, level, topics[]]` — `topics` đã tính sẵn từ `related`, bỏ `bugMatchesWeek` tự parse `related`.
- Index không có `severity`/`minutes` của bug → bỏ badge severity và phút ở mục bug.
- `DATA_INDEX` có thể chưa có (lỗi nạp) → coi như mảng rỗng, không throw.
- Giữ nguyên luật chọn (lessons theo `order` tối đa 4; labs map category tối đa 2; bugs giao topic tối đa 2), link `#/learn/<id>`, `#/labs/<id>`, `#/bugs/<id>` (kiểm lại đúng URL bằng cách đọc `js/views/learn.js`, `labs.js`, `bugs.js`), dấu ✓ khi `getStatus === 'known'`.
- `bindMaterials`: bỏ listener capture + `preventDefault` trên `<summary>`; dùng sự kiện `toggle` của `<details>` (gắn sau render, hoặc delegation `root.addEventListener('toggle', …, true)`) để cập nhật `materialsOpen`. Không giữ hai cơ chế song song.
- Xoá chuỗi i18n không dùng (`rm.materialsEmpty` nếu không dùng).

## Luật
Đọc AGENTS.md mục 7. Escape mọi dữ liệu bằng `App.esc()`. Không sửa app.js / data-manifest.js / base.css / build-light-index.js (cần thì ghi Notes). Tiếng Việt CÓ DẤU.

## Nghiệm thu
Viết script tạm trong Node (không trình duyệt): nạp `scripts/browser-shim.js`, chỉ nạp `js/data/index-light.js` + `js/data/roadmap.js` + `js/views/roadmap.js` (KHÔNG nạp lessons/labs/bugs), gọi render tuần có topic `concurrency` hoặc `jvm`, xác nhận HTML có `rm-materials` và ít nhất 1 link `#/learn/`, `#/labs/`. Ghi kết quả vào Notes rồi xoá script tạm.
`node --check js/views/roadmap.js`; `node scripts/check-budget.js`; `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit, không mở trình duyệt.
Xong: `Status: DONE` + Notes.

## Notes

Đã hoàn thành (lần chạy trước bị gián đoạn, bản HEAD đã có sẵn phần đọc `window.DATA_INDEX`; lần này rà lại toàn bộ và sửa phần còn thiếu).

- `materialsHtml()` đọc `window.DATA_INDEX` (qua `dataIdx()`), không còn dùng `App.lessons()` / `window.LABS` / `window.BUGS`:
  - `lessons`: `{id, track, order, title, level, minutes}` → lọc theo `track ∈ week.topics`, sort `order`, tối đa 4.
  - `labs`: tuple `[id, category, title, level]`, map category qua `LAB_CAT_TOPIC`, tối đa 2.
  - `bugs`: tuple `[id, title, level, topics[]]` → lọc `topics` giao `week.topics` (không parse `related`), tối đa 2; bỏ badge severity/phút vì index không có.
  - `DATA_INDEX` thiếu/lỗi nạp → `dataIdx()` trả `{}`, coi như mảng rỗng, không throw; `total === 0` thì trả `''`.
  - Link đúng route: `#/learn/<id>` (đối chiếu learn.js), `#/labs/<id>` (labs.js), `#/bugs/<id>` (bugs.js); `✓` khi `App.store.getStatus(id) === 'known'`; mọi dữ liệu escape bằng `App.esc()`.
- `bindMaterials(root)`: bỏ listener capture + `preventDefault` trên `<summary>`, chuyển sang sự kiện `toggle` của `<details>`, gắn lên từng `.rm-materials` sau render (tránh dồn listener trên `<main>` khi router tái sử dụng root). `materialsOpen` cập nhật theo `data-week`.
- Không có chuỗi `rm.materialsEmpty` trong i18n (không cần xoá).
- Bổ sung CSS `.rm-materials / .rm-materials-body / .rm-mat-*` trong `css/views/roadmap.css` (mọi selector bắt đầu bằng `.view-roadmap`, chỉ dùng biến CSS).
- Nghiệm thu: script Node tạm (browser-shim + chỉ nạp `index-light.js` + `roadmap.js` + `roadmap.js`, KHÔNG nạp lessons/labs/bugs; render tuần topic `concurrency`) in ra: `rm-materials: true`, `#/learn/ link: true`, `#/labs/ link: true`, `#/bugs/ link: true`, `VERIFY OK` — đã xoá script tạm.
- `node --check js/views/roadmap.js` → OK; `node scripts/check-budget.js` → OK; `node scripts/validate.js` → `OK — không có lỗi.`
- Không sửa app.js / data-manifest.js / base.css / build-light-index.js. Không commit, không mở trình duyệt.
Reviewed-by: verify-only (code/UI task)
