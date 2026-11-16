# T2215 — Rà soát chất lượng 4 bài học mới nhất trong lessons-architecture.js

Status: DONE
Agent: kilo
Owns: `js/data/lessons-architecture.js`
After: T1564

## Bối cảnh
Giai đoạn ưu tiên **chất lượng**: nội dung do model free viết cần kiểm tra chéo trước khi người học (dev Java ~4 năm, hổng nền tảng) dùng đi phỏng vấn thật.

## Việc cần làm
1. Tìm 4 bài học mới nhất (`node scripts/qtool.js list js/data/lessons-architecture.js` nếu là câu hỏi; file khác dùng grep -n theo id). KHÔNG đọc cả file một lần.
2. Kiểm tra từng mục: đúng kỹ thuật; giải thích từ gốc cho người hổng nền tảng; ví dụ code có comment; bài tập mô phỏng đúng cơ chế, test ≥ 3 case xác định; câu check đúng, explain đủ.
3. **Sửa đúng** chỗ sai/thiếu; không chắc thì viết ở mức nguyên lý, bỏ chi tiết bịa. Không xoá mục, không đổi id.

## Luật
- Đọc AGENTS.md (schema; mục 5 markup: không backtick, không ký hiệu đô-la + ngoặc nhọn trong template literal).
- Ngoại lệ cho luật "chỉ thêm": task rà soát được sửa nội dung có sẵn. Đếm số mục trước/sau phải bằng nhau.
- Không commit.

## Nghiệm thu
`node --check js/data/lessons-architecture.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` (bài học thêm `node scripts/test-lessons.js`, bug thêm `node scripts/test-bugs.js`) → OK.
Xong: `Status: DONE`. Notes: bảng `id | lỗi tìm thấy | đã sửa gì`.

## Notes

4 bài mới nhất: `lesson-architecture-009` … `012` (file 12 bài, mỗi bài 1 bài tập + 3 câu check — không xoá/đổi mục nào).

| id | lỗi tìm thấy | đã sửa gì |
|---|---|---|
| lesson-architecture-009 | "gần như **100%** key đổi máy" khi N 6→7 (thực tế ~86%); "tỉ lệ hit 96% → 94,5%" mâu thuẫn với việc 14% key đổi máy (dưới tải đều phải ~83%); "gần như mọi key" nói quá (đúng ra N/(N+1): 3→4 là 75%); chưa giải thích "băm" cho người mới | sửa "~86%", "hit ~83%", "phần lớn" kèm tỉ lệ N/(N+1); thêm định nghĩa băm (hash) ở lần đầu dùng |
| lesson-architecture-010 | Ví dụ đời thực: GC pause 6,2 s nhưng TTL 10 s → lock chưa chắc hết hạn, kịch bản "A ghi đè" không nhất quán; "heartbeat" chưa giải thích; phần mô phỏng thiếu code block | đổi `PX 5000` + "Hết 5 giây" + nói rõ gia hạn mỗi 2–3 s (pause > TTL); thêm giải thích heartbeat; thêm snippet `Storage.write` có comment |
| lesson-architecture-011 | "trên nhiều partition … event cùng một đơn có thể sai thứ tự" dễ hiểu sai (Kafka bảo đảm thứ tự trong một partition); "payload" chưa giải thích | nói rõ điều kiện "không cùng partition" (cả body và câu trả lời phỏng vấn), ghi chú Kafka/khóa partition theo aggregateId; thêm định nghĩa payload |
| lesson-architecture-012 | Không tìm thấy lỗi kỹ thuật; thuật toán bù trừ ngược, orchestration/choreography, 2PC, pivot đều đúng | giữ nguyên nội dung |

Kiểm chứng:
- `node scripts/test-lessons.js lesson-architecture-009` → 14/14; `-010` → 21/21; `-011` → 10/10; `-012` → 13/13 (reference pass hết, starter biên dịch được và không pass hết).
- `node --check js/data/lessons-architecture.js` → OK; `node scripts/build-light-index.js` (sinh lại `index-light.js`); `node scripts/validate.js` → **OK — không có lỗi**.
- Bài tập deterministic (không random/thời gian/sleep), test ≥ 10 case; số mục trước/sau như nhau (12 bài, 12 bài tập, 12 câu check).
Reviewed-by: verify-only (review task)
