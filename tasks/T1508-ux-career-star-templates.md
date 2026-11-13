# T1508 — Màn hình Sự nghiệp: thư viện "Mẫu câu chuyện" STAR

Status: DONE
Agent: kilo
Owns: `js/views/career.js`, `css/views/career.css`

Dữ liệu mới: `window.STAR_STORIES` (file `js/data/star-stories.js`, đã được nạp cho route `#/career`; xem chú thích schema ở đầu file). Thêm vào tab **STAR** của `js/views/career.js` một khu **"Mẫu câu chuyện"**:
- Danh sách mẫu, lọc theo `theme` (chip) và `level`; mỗi thẻ hiện `title`, `project`, theme, level.
- Mở một mẫu: hiện Situation / Task / Action / Result, bản nói tiếng Việt, bản nói tiếng Anh (phần tử chứa có `lang="en"`), danh sách **"Cần thay bằng chi tiết thật của bạn"** (`adapt`) và câu hỏi đào sâu (`follow`).
- Nút **"Dùng mẫu này"**: tạo bản nháp STAR trong trình soạn sẵn có (`draftStar`) với title, themes [theme], situation, task, action, result, spoken = bản tiếng Việt, rồi cuộn tới form để người dùng sửa và lưu như câu chuyện của mình (lưu theo quy ước AGENTS.md mục 15: id, updatedAt).
- Thêm 'Hiệu năng', 'Thiết kế', 'Chủ động' vào `THEMES`.
- Nếu đang có nút tập nói (🎤) thì cho phép tập với bản tiếng Anh của mẫu.
- Chuỗi giao diện mới: dùng tiếng Việt như các chuỗi đang có trong file (nếu file dùng `App.t` với bảng chuỗi riêng thì thêm khoá mới theo đúng cách đó, kể cả bản tiếng Anh).

## Luật
- Chỉ sửa 2 file trên; escape mọi dữ liệu bằng `App.esc()`; CSS bắt đầu bằng `.view-career`, màu qua biến CSS, responsive 360px.
- Không mở trình duyệt. Kiểm tra: `node --check js/views/career.js`, `node scripts/validate.js` → OK. KHÔNG commit.
- Xong: `Status: DONE`, Notes ghi ngắn những gì đã làm.

## Notes

- Hoàn thiện thư viện mẫu STAR với bộ lọc theme/mức độ, màn hình chi tiết, tiếng Anh có `lang="en"`, luyện nói và nạp mẫu vào trình soạn thảo để chỉnh sửa/lưu.
- Thêm nhãn giao diện tiếng Anh, kiểu responsive cho bộ lọc; `node --check js/views/career.js` và `node scripts/validate.js` đều đạt.
Reviewed-by: verify-only (code/UI task)
