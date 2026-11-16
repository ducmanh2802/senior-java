# T2244 — Rà soát chất lượng các câu về chuyển tiền, ledger, reconciliation, idempotency trong q-banking.js

Status: DONE
Agent: kilo
Owns: `js/data/q-banking.js`
After: T2211

## Bối cảnh
Giai đoạn ưu tiên **chất lượng**: nội dung do model free viết cần kiểm tra chéo trước khi người học (dev Java ~4 năm, hổng nền tảng) dùng đi phỏng vấn thật.

## Việc cần làm
1. Tìm các câu về chuyển tiền, ledger, reconciliation, idempotency (`node scripts/qtool.js list js/data/q-banking.js` nếu là câu hỏi; file khác dùng grep -n theo id). KHÔNG đọc cả file một lần.
2. Kiểm tra từng mục: bút toán kép (double-entry) cân bằng; số tiền dùng BigDecimal/long minor units, không double; outbox/saga đúng; thêm tag 'core' cho ~15 câu quan trọng nhất nếu chưa có.
3. **Sửa đúng** chỗ sai/thiếu; không chắc thì viết ở mức nguyên lý, bỏ chi tiết bịa. Không xoá mục, không đổi id.

## Luật
- Đọc AGENTS.md (schema; mục 5 markup: không backtick, không ký hiệu đô-la + ngoặc nhọn trong template literal).
- Ngoại lệ cho luật "chỉ thêm": task rà soát được sửa nội dung có sẵn. Đếm số mục trước/sau phải bằng nhau.
- Không commit.

## Nghiệm thu
`node --check js/data/q-banking.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` (bài học thêm `node scripts/test-lessons.js`, bug thêm `node scripts/test-bugs.js`) → OK.
Xong: `Status: DONE`. Notes: bảng `id | lỗi tìm thấy | đã sửa gì`.

## Notes

| id | lỗi tìm thấy | đã sửa gì |
|---|---|---|
| banking-004 | Lỗi gõ lặp từ 'sai sai' ở bullet idempotency (line ~298) | Sửa `từ chối sai sai` → `từ chối sai` |
| banking-040 | Tiêu đề mục không dấu (không chuẩn AGENTS.md mục 5) | `### Vi du doi thuc` → `### Ví dụ đời thực`; `### Tra loi muon khi pham van` → `### Trả lời mẫu khi phỏng vấn` |
| banking-041 | Tiêu đề mục không dấu (không chuẩn AGENTS.md mục 5) | `### Vi du doi thuc` → `### Ví dụ đời thực`; `### Tra loi muon khi pham van` → `### Trả lời mẫu khi phỏng vấn` |
| banking-003, -004, -005, -023, -024, -025, -031, -032, -033, -036, -037, -039, -040, -041, -052 | Chưa có tag 'core' cho câu quan trọng nhất | Thêm `'core'` làm phần tử đầu tiên của mảng `tags` (15 câu) |

Kiểm tra kỹ thuật toàn bộ 56 câu (double-entry, BigDecimal/long minor units, outbox/saga, idempotency key, PENDING/UNKNOWN state): đều đúng, không sửa thêm nội dung đáp án. Không xoá mục, không đổi id. Số câu giữ nguyên 56.

`node --check js/data/q-banking.js` OK; `node scripts/build-light-index.js` OK; `node scripts/validate.js` → `OK — không có lỗi.`
Reviewed-by: verify-only (review task)
