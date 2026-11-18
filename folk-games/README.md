# 🏮 Sân Đình: trò chơi dân gian Việt Nam

Site tĩnh (HTML/CSS/JS thuần, không build, không thư viện). Mở thẳng `index.html` là chạy được.

## Có gì
| Trò | Chế độ |
|---|---|
| 🪨 Ô ăn quan | đấu máy (Dễ/Vừa/Khó, minimax) · 2 người cùng máy |
| ⚫ Cờ gánh | đấu máy (Dễ/Vừa/Khó) · 2 người · đi lại |
| 🦀 Bầu cua tôm cá | xu ảo, có lì xì khi hết xu |
| ✊ Oẳn tù tì | đấu máy, máy "học" thói quen ra tay của bạn |
| 🪢 Kéo co | bấm nhanh, 3 mức đội đối thủ |
| 🦶 Nhảy lò cò · 🎋 Đánh chuyền · 🪙 Đánh đáo · 🐉 Rồng rắn lên mây | mini-game đấu máy / chơi một mình |
| 📜 Góc đồng dao | cách chơi các trò ngoài sân + lời đồng dao, có đọc to (Web Speech) |

- **Bản đồ làng** (trang chủ): gốc đa, sân đình, đầu ngõ, chợ Tết, bờ đê. Mỗi góc có Bà kể chuyện và các trò của góc đó.
- **Âm thanh làng quê** (nút 🔈): tiếng ve, gió, sáo diều, tiếng sỏi, trống, chiêng; tổng hợp bằng Web Audio, không cần file âm thanh.
- **Chơi online** (Ô ăn quan, Cờ gánh): tạo phòng 4 ký tự, gửi link mời. Dùng Supabase Realtime (broadcast + presence), không cần bảng hay server riêng. Cấu hình trong `js/config.js`. Chế độ online cần mở qua http(s), không chạy được với `file://`.

Thành tích, xu và giao diện sáng/tối lưu trong `localStorage`.

## Cấu trúc
```
index.html
css/style.css          # design tokens (sáng/tối) + style từng trò
js/core.js             # Hub: register(), store, record(), toast()
js/games/<id>.js       # mỗi trò tự đăng ký bằng Hub.register({...render(root, ctx)})
js/data/lore.js        # dữ liệu góc đồng dao
js/main.js             # router hash: #/  #/choi/<id>  #/dong-dao
```

## Thêm một trò mới
1. Tạo `js/games/<id>.js` gọi `Hub.register({ id, name, icon, tagline, players, rules, render(root, ctx) })`.
   `render` trả về hàm cleanup; dùng `ctx.alive()` để dừng animation khi người chơi rời trang.
2. Thêm `<script>` vào `index.html` trước `js/main.js`.

## Tách sang repo riêng
Thư mục này tự chạy độc lập, không phụ thuộc gì bên ngoài:
1. Tạo repo mới (ví dụ `san-dinh`), copy toàn bộ nội dung `folk-games/` vào thư mục gốc của repo.
2. Vercel: Import repo, Framework = Other, không cần build command, output = thư mục gốc.
3. (Tuỳ chọn) Tạo project Supabase riêng rồi thay URL và publishable key trong `js/config.js`. Realtime broadcast không cần tạo bảng.
