# T2226 — Rà soát chất lượng 4 bài id NHỎ nhất trong bugs.js

Status: DONE
Agent: kilo
Owns: `js/data/bugs.js`
After: T2147

## Bối cảnh
Giai đoạn ưu tiên **chất lượng**: nội dung do model free viết cần kiểm tra chéo trước khi người học (dev Java ~4 năm, hổng nền tảng) dùng đi phỏng vấn thật.

## Việc cần làm
1. Tìm 4 bài id NHỎ nhất (`node scripts/qtool.js list js/data/bugs.js` nếu là câu hỏi; file khác dùng grep -n theo id). KHÔNG đọc cả file một lần.
2. Kiểm tra từng mục: story/artifact khớp code starter; rootCause trích đúng artifact; fix đúng kỹ thuật; test tái hiện bug xác định.
3. **Sửa đúng** chỗ sai/thiếu; không chắc thì viết ở mức nguyên lý, bỏ chi tiết bịa. Không xoá mục, không đổi id.

## Luật
- Đọc AGENTS.md (schema; mục 5 markup: không backtick, không ký hiệu đô-la + ngoặc nhọn trong template literal).
- Ngoại lệ cho luật "chỉ thêm": task rà soát được sửa nội dung có sẵn. Đếm số mục trước/sau phải bằng nhau.
- Không commit.

## Nghiệm thu
`node --check js/data/bugs.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` (bài học thêm `node scripts/test-lessons.js`, bug thêm `node scripts/test-bugs.js`) → OK.
Xong: `Status: DONE`. Notes: bảng `id | lỗi tìm thấy | đã sửa gì`.

## Notes

| id | lỗi tìm thấy | đã sửa gì |
|---|---|---|
| bug-001 | Không có lỗi — race condition check-then-act được mô tả chính xác, test tái hiện đúng bằng CountDownLatch, fix nêu rõ synchronized per-account + UPDATE có điều kiện cho multi-pod | Không sửa (đã đúng) |
| bug-002 | Không có lỗi — idempotency webhook at-least-once đúng, test cover retry tuần tự/đồng thời/lỗi giữa chừng, fix đánh dấu processed SAU khi ghi sổ thành công + unique constraint DB | Không sửa (đã đúng) |
| bug-003 | Không có lỗi — làm tròn double độc lập sai tổng, fix dùng số học nguyên total/n + total%n phát dư, test kiểm tra tổng và chênh lệch ≤1 đồng | Không sửa (đã đúng) |
| bug-004 | Không có lỗi — múi giờ UTC thay vì Asia/Ho_Chi_Minh, fix dùng ZoneId tường minh + atZone().toLocalDate(), test cover ranh giới nửa đêm/đầu tháng | Không sửa (đã đúng) |

Tất cả 4 bài đều pass: `node --check`, `node scripts/validate.js`, `node scripts/test-bugs.js` (35/35), `node scripts/build-light-index.js`.
