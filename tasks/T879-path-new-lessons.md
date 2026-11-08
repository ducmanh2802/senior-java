# T879 — Đưa 43 bài học mới vào lộ trình học (PATH)

Status: DONE
Agent: kilo
Owns: `js/data/path.js`

Validator báo: `path.js: có 43 bài học không nằm trong PATH` (chạy `node scripts/validate.js` để xem đủ danh sách id). Lộ trình `window.PATH` (`js/data/path.js`) là thứ tự học gợi ý theo giai đoạn; bài không nằm trong PATH thì người học khó tìm thấy.

Việc cần làm:
1. Đọc kỹ cấu trúc `js/data/path.js` (các stage, cách tham chiếu lesson id) và commit `212a10b` (`git show 212a10b`) làm mẫu cách thêm.
2. Với mỗi lesson id bị báo thiếu: đọc `track`, `level`, `order`, `title` của bài (trong `js/data/lessons-<track>.js`) rồi chèn vào stage phù hợp nhất: cùng track, đúng độ khó (mid trước senior trước lead), ngay sau bài cùng track có `order` nhỏ hơn liền kề.
3. **Chỉ thêm** id vào các stage có sẵn; không xoá, không đổi thứ tự bài cũ, không tạo stage mới trừ khi một track hoàn toàn chưa có stage nào (ghi lý do vào Notes).
4. `node scripts/validate.js` → không còn cảnh báo "không nằm trong PATH", và `OK — không có lỗi.`

Ghi Notes: bao nhiêu bài đã thêm vào stage nào.

> **CẢNH BÁO GHI ĐÈ:** file này có thể đang chứa nội dung chưa commit của task khác. **Chỉ THÊM** bằng cách chèn object mới ngay trước dòng `);` cuối file, KHÔNG viết lại cả file, KHÔNG xoá/sửa object có sẵn. Trước khi đánh DONE: đếm số id trước và sau (`grep -c "id: '"`), số sau = số trước + số mục bạn thêm. Id luôn dùng nháy đơn.
> Đánh DONE bằng cách **sửa dòng `Status:` ở đầu file** (không thêm dòng Status mới ở cuối).
> Sơ đồ luồng nhiều bên (≥ 3 hệ thống): dùng khối `~~~seq` (cú pháp trong AGENTS.md mục 5).

## Nghiệm thu
`node --check js/data/sdlc.js`, `node scripts/validate.js` → OK. KHÔNG commit. Ghi Status: DONE + tóm tắt vào Notes.

## Notes
Đã thêm 46 bài học mới vào các stage hiện có (collections 2, sql 2, jvm 3, api 4, concurrency 2, modern 2, spring 4, jpa 2, db 4, testing 2, security 4, aws 2, design 2, microservices 4, architecture 2, ai 2, banking 3). Không còn cảnh báo "không nằm trong PATH".
Reviewed-by: kilo (T879R)
