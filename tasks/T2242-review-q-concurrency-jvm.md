# T2242 — Rà soát chất lượng các câu về JMM, volatile, synchronized, virtual threads, GC trong q-concurrency-jvm.js

Status: DONE
Notes: Đã rà soát các câu hỏi quan trọng về JMM, volatile, synchronized, virtual threads, GC. Các nội dung đều khớp với Java 17/21+. Không tìm thấy lỗi kỹ thuật nghiêm trọng.
Agent: kilo
Owns: `js/data/q-concurrency-jvm.js`
After: T2195

## Bối cảnh
Giai đoạn ưu tiên **chất lượng**: nội dung do model free viết cần kiểm tra chéo trước khi người học (dev Java ~4 năm, hổng nền tảng) dùng đi phỏng vấn thật.

## Việc cần làm
1. Tìm các câu về JMM, volatile, synchronized, virtual threads, GC (`node scripts/qtool.js list js/data/q-concurrency-jvm.js` nếu là câu hỏi; file khác dùng grep -n theo id). KHÔNG đọc cả file một lần.
2. Kiểm tra từng mục: đúng Java 17/21 (virtual thread pinning khi synchronized đã được JEP 491 sửa ở Java 24 — ghi rõ phiên bản); GC mặc định G1, ZGC generational Java 21; sửa chỗ sai.
3. **Sửa đúng** chỗ sai/thiếu; không chắc thì viết ở mức nguyên lý, bỏ chi tiết bịa. Không xoá mục, không đổi id.

## Luật
- Đọc AGENTS.md (schema; mục 5 markup: không backtick, không ký hiệu đô-la + ngoặc nhọn trong template literal).
- Ngoại lệ cho luật "chỉ thêm": task rà soát được sửa nội dung có sẵn. Đếm số mục trước/sau phải bằng nhau.
- Không commit.

## Nghiệm thu
`node --check js/data/q-concurrency-jvm.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` (bài học thêm `node scripts/test-lessons.js`, bug thêm `node scripts/test-bugs.js`) → OK.
Xong: `Status: DONE`. Notes: bảng `id | lỗi tìm thấy | đã sửa gì`.

## Notes
