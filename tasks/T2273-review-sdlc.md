# T2273 — Rà soát chất lượng các kịch bản trong sdlc.js

Status: DONE

## Notes
Đã rà soát `js/data/sdlc.js`: 11 kịch bản, mỗi kịch bản đủ 8 giai đoạn đúng thứ tự (requirement, analysis, design, dev, review, test, deploy, bugfix), tổng 88 stage. Kiểm tra cú pháp template literal (không backtick, `\${` escape đúng), artifact nhất quán, `node --check` và `validate.js` OK. Không phát hiện lỗi kỹ thuật cần sửa.

| id | lỗi tìm thấy | đã sửa gì |
|---|---|---|
| sdlc-001 | không | kiểm tra 8 stage nối nhau, số liệu nhất quán |
| sdlc-006 | không | kiểm tra artifact deploy YAML escape `${{` |
| sdlc-011 | không | kiểm tra stage order và answer markup |
Agent: kilo
Owns: `js/data/sdlc.js`

## Bối cảnh
Giai đoạn ưu tiên **chất lượng**: nội dung do model free viết cần kiểm tra chéo trước khi người học (dev Java ~4 năm, hổng nền tảng) dùng đi phỏng vấn thật.

## Việc cần làm
1. Tìm các kịch bản (`node scripts/qtool.js list js/data/sdlc.js` nếu là câu hỏi; file khác dùng grep -n theo id). KHÔNG đọc cả file một lần.
2. Kiểm tra từng mục: 8 giai đoạn nối nhau nhất quán (tên service, số liệu); answer kỹ thuật đúng; Ghi vào Notes danh sách cụ thể các chỗ đã sửa (id + mô tả); nếu không sửa gì phải nêu 3 id đã kiểm tra kỹ và lý do đúng.
3. **Sửa đúng** chỗ sai/thiếu; không chắc thì viết ở mức nguyên lý, bỏ chi tiết bịa. Không xoá mục, không đổi id.

## Luật
- Đọc AGENTS.md (schema; mục 5 markup: không backtick, không ký hiệu đô-la + ngoặc nhọn trong template literal).
- Ngoại lệ cho luật "chỉ thêm": task rà soát được sửa nội dung có sẵn. Đếm số mục trước/sau phải bằng nhau.
- Không commit.

## Nghiệm thu
`node --check js/data/sdlc.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` (bài học thêm `node scripts/test-lessons.js`, bug thêm `node scripts/test-bugs.js`) → OK.
Xong: `Status: DONE`. Notes: bảng `id | lỗi tìm thấy | đã sửa gì`.

## Notes
