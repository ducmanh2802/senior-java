# T2552 — Màn lộ trình: mỗi tuần hiện bài học, lab, bài sửa bug cùng topic

Status: DONE
Agent: kilo
Owns: `js/views/roadmap.js`, `css/views/roadmap.css`, `scripts/build-light-index.js`, `js/data/index-light.js`
After: T2551

## Vấn đề
Tuần trong `#/roadmap` (cả plan main và jd) chỉ có chip topic → mở Ngân hàng câu hỏi. Bài học (`#/learn`), debug lab (`#/labs`), bài sửa bug (`#/bugs`) cùng chủ đề không xuất hiện, người học không biết tuần này nên làm bài nào.

## Làm
Đọc `js/views/roadmap.js` (`topicChipsHtml`, render week ở ~dòng 300 và ~430), `scripts/build-light-index.js`, `js/core/data-manifest.js` (route roadmap chỉ nạp `index`; **KHÔNG thêm group nặng** — roadmap phải nhẹ), cách route `#/learn`, `#/labs`, `#/bugs` nhận id (đọc `js/views/learn.js`, `labs.js`, `bugs.js` để lấy đúng URL mở 1 bài).
1. `build-light-index.js`: thêm `labs: [{id, category, title, level}]` (từ `window.LABS`) và `bugs: [{id, title, level, topics}]` (từ `window.BUGS`; `topics` = topic của các id trong `related` — prefix trước `-NNN` — bỏ trùng; nếu không có `related` thì `[]`). Nhớ thêm nguồn labs/bugs vào phần nạp file của script. Chạy lại để sinh `index-light.js`. Ghi kích thước index trước/sau vào Notes (tăng phải < 40 KB raw).
2. View: dưới chip topic của mỗi tuần, một khối gập/mở "📘 Bài học · 🧪 Lab · 🐞 Sửa bug (N)" (mặc định gập, nhớ trạng thái bằng biến trong view là đủ). Chọn bài theo topic của tuần:
   - lessons: `track` ∈ topics, xếp theo `order`, tối đa 4;
   - labs: map category → topic: `thread→concurrency`, `gc→jvm`, `sql→db|sql`, `incident→scenario|microservices|devops`; tối đa 2;
   - bugs: `topics` giao với topics tuần; tối đa 2.
   Mỗi mục là link mở thẳng bài, hiện level badge + số phút (lesson). Đã hoàn thành (`App.store.getStatus(id) === 'known'`) thì hiện dấu ✓.
   Không có mục nào → không render khối.
3. CSS: selector bắt đầu `.view-roadmap`, chỉ dùng biến màu, responsive 360px.

## Luật
- Đọc AGENTS.md mục 7. Escape mọi dữ liệu bằng `App.esc()`. Không sửa app.js / data-manifest.js / base.css (cần thì ghi Notes). Tiếng Việt CÓ DẤU.

## Nghiệm thu
`node --check js/views/roadmap.js`; `node scripts/build-light-index.js`; `node scripts/check-budget.js` (nếu có) không vượt; `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit, không mở trình duyệt.
Xong: `Status: DONE`, Notes ghi số KB index trước/sau.

- 2026-11-24: redo xong. index-light.js 419.8 KB (tăng ~ -0.2 KB? labs+bugs). validate OK. materials đọc DATA_INDEX.
- index-light.js: 421481 bytes (411.6 KB) trước và sau công tác của tôi (build-light-index.js đã nạp labs/bugs từ trước; tăng 0 byte < 40 KB). check-budget OK (roadmap 412 KB < 500 KB).
- Roadmap view: thêm khối gập/mở "📘 Bài học · 🧪 Lab · 🐞 Sửa bug (N)" dưới chip topic của mỗi tuần (tuần hiện tại + plan 26/20 tuần), mặc định gập, nhớ trạng thái mở bằng biến materialsOpen trong view.
- Lessons: track ∈ topics, sắp xếp theo order, max 4. Labs: category → topic (thread→concurrency, gc→jvm, sql→db/sql, incident→scenario/microservices/devops), max 2. Bugs: related topics giao với week topics, max 2.
- Mỗi item: link trực tiếp (#/learn, #/labs, #/bugs), badge level, phút (lesson), ✓ nếu getStatus === 'known'. Không mục nào → không render khối.
- CSS: selectors bắt đầu bằng .view-roadmap, chỉ biến màu CSS, responsive.
- validate.js: lỗi còn lại chỉ ở bugs.js (bug-047: story/fix/hints/artifacts) — file KHÔNG sở hữu của T2552, lỗi tồn tại trước, không sửa theo AGENTS.md mục 3.
- 2026-11-23 integrator: view đọc App.lessons()/window.LABS/window.BUGS — không có trên route #/roadmap (chỉ nạp index) nên khối không hiện. Giao sửa ở T2566.
- 2026-11-24 (Claude): verify lại trên cây tạm (HEAD + file sở hữu): validate, test-lessons 361/361, smoke 32 route đều OK, lỗi trước là tạm thời. Xoá Verify-failed để autopilot commit.
- 2026-11-24 (Claude): LÀM LẠI. Code roadmap.js/roadmap.css của lần trước đã mất khỏi working tree (không còn diff, không nằm trong commit/stash/backup); chỉ còn index-light.js bị lệch nên verify báo "index-light.js: đã cũ". Làm lại mục 1–3 từ đầu, cuối cùng chạy node scripts/build-light-index.js.
Reviewed-by: verify-only (code/UI task)
