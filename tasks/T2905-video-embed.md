# T2905 — Nhúng video YouTube ngay trong app (bấm để mở rộng xem)

Status: TODO
Agent: kilo
Owns: `js/views/toeiclr.js`, `js/views/ckad.js`, `css/views/toeiclr.css`, `css/views/ckad.css`

Người dùng muốn xem video ngay trong app, không phải mở tab mới. Hiện `#/toeiclr/tips` (mục "🎬 Video hướng dẫn" của mỗi tip), `#/ckad` (video ở trang tổng quan, biến `VIDEOS`) và `#/ckad/lab/<id>` (`l.videos`) render link `<a target="_blank">`.

## Làm
1. Mỗi video thành một thẻ: tiêu đề + note + nút "▶ Xem" (và giữ link nhỏ "Mở YouTube ↗" làm dự phòng).
2. Bấm "▶ Xem": chèn ngay dưới thẻ một khung 16:9 `<iframe src="https://www.youtube-nocookie.com/embed/<ID>?autoplay=1&rel=0" title="..." allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen loading="lazy" referrerpolicy="strict-origin-when-cross-origin">`. Bấm lần nữa ("✕ Đóng") thì gỡ iframe (dừng phát). Chỉ một video mở một lúc trong view.
3. **Không** tạo iframe lúc render (nặng); chỉ tạo khi bấm. ID lấy từ url bằng regex `v=([\\w-]{11})`; giữ tham số `&t=<n>s` thành `&start=<n>`. ID không hợp lệ thì chỉ hiện link.
4. Event delegation trên root (`data-yt="<ID>"`); cleanup không để iframe sót. CSS: khung `aspect-ratio: 16/9; width: 100%`, bo góc, selector bắt đầu `.view-toeiclr` / `.view-ckad`, chỉ dùng biến màu trong css/base.css, responsive 360px.
5. Escape mọi dữ liệu bằng `App.esc`. Nút có text hoặc aria-label.

## Nghiệm thu
`node --check` 2 file view; `node scripts/check-budget.js`; `node scripts/validate.js` OK. Không mở trình duyệt. Không commit.
Xong: `Status: DONE` + Notes.

## Notes
