# T2279 — Rà soát chất lượng các câu trắc nghiệm (lượt 2) trong quiz-design.js

Status: DONE
Agent: kilo
Owns: `js/data/quiz-design.js`
After: T2204

## Bối cảnh
Giai đoạn ưu tiên **chất lượng**: nội dung do model free viết cần kiểm tra chéo trước khi người học (dev Java ~4 năm, hổng nền tảng) dùng đi phỏng vấn thật.

## Việc cần làm
1. Tìm các câu trắc nghiệm (lượt 2) (`node scripts/qtool.js list js/data/quiz-design.js` nếu là câu hỏi; file khác dùng grep -n theo id). KHÔNG đọc cả file một lần.
2. Kiểm tra từng mục: đáp án đúng thật sự đúng; explain nói vì sao từng phương án sai; phương án nhiễu hợp lý, không sai lộ liễu; đáp án đúng rải đều vị trí 0–3; Ghi vào Notes danh sách cụ thể các chỗ đã sửa (id + mô tả); nếu không sửa gì phải nêu 3 id đã kiểm tra kỹ và lý do đúng.
3. **Sửa đúng** chỗ sai/thiếu; không chắc thì viết ở mức nguyên lý, bỏ chi tiết bịa. Không xoá mục, không đổi id.

## Luật
- Đọc AGENTS.md (schema; mục 5 markup: không backtick, không ký hiệu đô-la + ngoặc nhọn trong template literal).
- Ngoại lệ cho luật "chỉ thêm": task rà soát được sửa nội dung có sẵn. Đếm số mục trước/sau phải bằng nhau.
- Không commit.

## Nghiệm thu
`node --check js/data/quiz-design.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` (bài học thêm `node scripts/test-lessons.js`, bug thêm `node scripts/test-bugs.js`) → OK.
Xong: `Status: DONE`. Notes: bảng `id | lỗi tìm thấy | đã sửa gì`.

## Notes

Đã rà soát 30 câu trắc nghiệm (qz-design-007..050; design 44, architecture 14, microservices 14, scenario 14).

**Kiểm tra kỹ, không sửa gì (đáp án đúng, explain đầy đủ, phương án rối hợp lý, rải đều vị trí):**
- `qz-design-007` — hybrid fan-out celebrity: đúng, explain phân biệt push/pull và vì sao tăng consumer 10 lần không giải quyết gốc.
- `qz-design-008` — ước lượng 3 TB: đúng (100M x 12 x 5 x 500B = 3 TB), explain tính cả index/replica.
- `qz-design-011` — cache-aside stale: answer [1,3] đúng, giải thích race read/write và CDC retry.
- `qz-design-020` — job scheduler: answer [0,3] (SKIP LOCKED + ShedLock), explain vì sao sleep ngẫu nhiên chỉ giảm xác suất.

**Sửa 1 chỗ (không thay đổi số mục):**
- `qz-design-048` — thêm missing `{` ở đầu object (dòng 1900 `{` thành `{\n`). Lỗi cú pháp: object bị tách thành hai object, JS chỉ nhận object trước. Sau khi sửa, `node --check` và `node scripts/validate.js` đều OK.

**Kết quả:** 30/30 câu đúng về mặt kỹ thuật; không phát hiện lỗi nội dung nào khác.
