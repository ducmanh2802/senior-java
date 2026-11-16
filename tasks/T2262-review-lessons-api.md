# T2262 — Rà soát chất lượng các bài (grep -n "id: 'lesson-") trong lessons-api.js

Status: DONE
Agent: kilo
Owns: `js/data/lessons-api.js`
After: T2168

## Bối cảnh
Giai đoạn ưu tiên **chất lượng**: nội dung do model free viết cần kiểm tra chéo trước khi người học (dev Java ~4 năm, hổng nền tảng) dùng đi phỏng vấn thật.

## Việc cần làm
1. Tìm các bài (grep -n "id: 'lesson-") (`node scripts/qtool.js list js/data/lessons-api.js` nếu là câu hỏi; file khác dùng grep -n theo id). KHÔNG đọc cả file một lần.
2. Kiểm tra từng mục: body dạy từ gốc cho người hổng nền tảng, mỗi khái niệm có ví dụ + lý do VÌ SAO; check có explain nói vì sao từng phương án sai; KHÔNG sửa tests/reference (nếu đụng code chạy node scripts/test-lessons.js). Ghi vào Notes danh sách cụ thể các chỗ đã sửa (id + mô tả); nếu không sửa gì phải nêu 3 điểm đã kiểm tra kỹ; HTTP status/idempotency đúng RFC 9110.
3. **Sửa đúng** chỗ sai/thiếu; không chắc thì viết ở mức nguyên lý, bỏ chi tiết bịa. Không xoá mục, không đổi id.

## Luật
- Đọc AGENTS.md (schema; mục 5 markup: không backtick, không ký hiệu đô-la + ngoặc nhọn trong template literal).
- Ngoại lệ cho luật "chỉ thêm": task rà soát được sửa nội dung có sẵn. Đếm số mục trước/sau phải bằng nhau.
- Không commit.

## Nghiệm thu
`node --check js/data/lessons-api.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` (bài học thêm `node scripts/test-lessons.js`, bug thêm `node scripts/test-bugs.js`) → OK.
Xong: `Status: DONE`. Notes: bảng `id | lỗi tìm thấy | đã sửa gì`.

## Notes

| id | lỗi tìm thấy | đã sửa gì |
|---|---|---|
| lesson-api-004 | Nội dung trùng lặp theme idempotency key với lesson-api-003 và lesson-api-010 (cùng state machine IN_PROGRESS/DONE, 422 khi trùng body, 409 khi đang xử lý, TTL > cửa sổ retry; 4 câu check gần như giống nhau) | Viết lại tiêu đề, goals, body và check về phía **client**: sinh key một lần cho một thao tác logic, giữ nguyên key mọi lần retry, xử lý phản hồi 200/201 (kết quả cũ), 409 (đợi Retry-After), 422 (key dùng nhầm), 429 + Retry-After; không sinh key mới trong interceptor retry; GET không cần key. Giữ id, track, order, level, exercises/tests/reference không đổi nên `test-lessons.js` vẫn 6/6. |
| lesson-api-001, 002, 003, 005, 006, 007, 008, 009, 010, 011 | — | Kiểm tra kỹ: body dạy từ gốc (giải thích thuật ngữ lần đầu gặp, ví dụ + lý do vì sao), check có explain sai cho mỗi sai lựa chọn, HTTP status/idempotency đúng RFC 9110 (405 kèm Allow, 422 Unprocessable Content, 412/428, 304 If-None-Match, no-store cho dữ liệu nhạy cảm...). `node --check`, `node scripts/build-light-index.js`, `node scripts/validate.js` và `node scripts/test-lessons.js` (tất cả 11 bài) đều OK. |Reviewed-by: verify-only (review task)
