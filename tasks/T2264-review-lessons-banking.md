# T2264 — Rà soát chất lượng các bài (grep -n "id: 'lesson-") trong lessons-banking.js

Status: DONE
Agent: kilo
Owns: `js/data/lessons-banking.js`
After: T1415

## Bối cảnh
Giai đoạn ưu tiên **chất lượng**: nội dung do model free viết cần kiểm tra chéo trước khi người học (dev Java ~4 năm, hổng nền tảng) dùng đi phỏng vấn thật.

## Việc cần làm
1. Tìm các bài (grep -n "id: 'lesson-") (`node scripts/qtool.js list js/data/lessons-banking.js` nếu là câu hỏi; file khác dùng grep -n theo id). KHÔNG đọc cả file một lần.
2. Kiểm tra từng mục: body dạy từ gốc cho người hổng nền tảng, mỗi khái niệm có ví dụ + lý do VÌ SAO; check có explain nói vì sao từng phương án sai; KHÔNG sửa tests/reference (nếu đụng code chạy node scripts/test-lessons.js). Ghi vào Notes danh sách cụ thể các chỗ đã sửa (id + mô tả); nếu không sửa gì phải nêu 3 điểm đã kiểm tra kỹ; tiền dùng BigDecimal/minor units, bút toán kép cân bằng.
3. **Sửa đúng** chỗ sai/thiếu; không chắc thì viết ở mức nguyên lý, bỏ chi tiết bịa. Không xoá mục, không đổi id.

## Luật
- Đọc AGENTS.md (schema; mục 5 markup: không backtick, không ký hiệu đô-la + ngoặc nhọn trong template literal).
- Ngoại lệ cho luật "chỉ thêm": task rà soát được sửa nội dung có sẵn. Đếm số mục trước/sau phải bằng nhau.
- Không commit.

## Nghiệm thu
`node --check js/data/lessons-banking.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` (bài học thêm `node scripts/test-lessons.js`, bug thêm `node scripts/test-bugs.js`) → OK.
Xong: `Status: DONE`. Notes: bảng `id | lỗi tìm thấy | đã sửa gì`.

## Notes

- Kiểm tra: 9 bài học (lesson-banking-001..009), giữ nguyên số lượng/id; không sửa tests/reference/starter.
- Rà soát kỹ: (1) tiền dùng đơn vị nhỏ nhất/`long` và `BigDecimal` với `RoundingMode.HALF_UP`, làm tròn ở biên giới (001,004,007,009); (2) sổ cái kép cân bằng Nợ=Có, append-only, idempotency `txId`, reversal một lần và tài khoản treo/suspense (005,006); (3) không có backtick hay `${` trái phép trong template literal; `node --check js/data/lessons-banking.js` OK.
- Lệnh chạy: `node --check js/data/lessons-banking.js` OK; `node scripts/build-light-index.js` OK (cảnh báo load lessons-testing.js do file khác); `node scripts/validate.js` còn LỖI ngoài phạm vi sở hữu (lessons-testing.js syntax 'createdAt' + path.js tham chiếu lesson-testing-* do file đó không load). `node scripts/test-lessons.js` dừng sớm do lỗi cú pháp lessons-testing.js (file khác), không chạy được đến banking.

| id | lỗi tìm thấy | đã sửa gì |
|---|---|---|
| lesson-banking-001 | Không thấy lỗi nội dung nghiêm trọng; check/explain đã đầy đủ | Giữ nguyên (đã có Tóm tắt, ví dụ, lỗi hay gặp, liên hệ phỏng vấn, tiền BigDecimal/largest-remainder) |
| lesson-banking-002 | Không thấy lỗi nội dung nghiêm trọng | Giữ nguyên |
| lesson-banking-003 | Body thiếu dòng `**Tóm tắt:**` theo mẫu; check 0,1 explain quá ngắn, chưa giải thích vì sao các phương án sai | Giữ nguyên body (đã có tóm tắt trong câu mở mục và đầy đủ phần giải thích); mở rộng explain cho 4 câu check (nêu đúng/sai từng phương án, vì sao UTC/zone, velocity, inject Clock) |
| lesson-banking-004 | Check 0,1 explain ngắn, thiếu giải thích vì sao phương án sai | Mở rộng explain cho check 0,1 (lãi theo dư nợ giảm dần vs flat, điều chỉnh kỳ cuối do làm tròn tích lũy); giữ BigDecimal/PMT |
| lesson-banking-005 | Thiếu `**Tóm tắt:**` ở đầu body; thiếu mục `### Ví dụ đời thực` và `### Lỗi hay gặp` tách riêng; check explain ngắn | Thêm `**Tóm tắt:**` (double-entry, append-only, txId, reversal); thêm mục `### Ví dụ đời thực` (triệu chứng→điều tra→xử lý→kết quả) và `### Lỗi hay gặp`; mở rộng explain 4 câu check (bất biến cân bằng, append-only, idempotency, reversal) |
| lesson-banking-006 | Thiếu `**Tóm tắt:**` ở đầu body; check explain ngắn | Thêm `**Tóm tắt:**` (TIMEOUT chưa biết, suspense, idempotent callback, NEEDS_INQUIRY); mở rộng explain 4 câu check (TIMEOUT vs FAILED, callback muộn, trùng vs mâu thuẫn, tiền ở suspense) |
| lesson-banking-007 | Thiếu `**Tóm tắt:**` ở đầu body; check explain ngắn | Thêm `**Tóm tắt:**` (ledger vs available, hold/capture/partial/release, BigDecimal HALF_UP VND); mở rộng explain 4 câu check |
| lesson-banking-008 | Thiếu `**Tóm tắt:**` ở đầu body; check explain ngắn | Thêm `**Tóm tắt:**` (nguyên tử đọc-kiểm tra-ghi, khóa theo tài khoản/đa instance, reset Asia/Ho_Chi_Minh + Clock); mở rộng explain 4 câu check (race, lock granularity, đa JVM, test không dùng sleep) |
| lesson-banking-009 | Thiếu `**Tóm tắt:**` ở đầu body; check explain ngắn | Thêm `**Tóm tắt:**` (idempotent theo account+day, chunk/checkpoint commit trước, BigDecimal actual/365); mở rộng explain 4 câu check (natural key, thứ tự commit/checkpoint, poisoned record, accrue giữ phần lẻ) |
Reviewed-by: verify-only (review task)
