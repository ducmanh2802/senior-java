# T2197 — Rà soát chất lượng 15 câu KHÔNG có tag core, id lớn nhất trong q-sql.js

Status: DONE
Agent: kilo
Owns: `js/data/q-sql.js`
After: T2137

## Bối cảnh
Giai đoạn ưu tiên **chất lượng**: nội dung do model free viết cần kiểm tra chéo trước khi người học (dev Java ~4 năm, hổng nền tảng) dùng đi phỏng vấn thật.

## Việc cần làm
1. Tìm 15 câu KHÔNG có tag core, id lớn nhất (`node scripts/qtool.js list js/data/q-sql.js` nếu là câu hỏi; file khác dùng grep -n theo id). KHÔNG đọc cả file một lần.
2. Kiểm tra từng mục: đúng kỹ thuật Java 17/21, Spring Boot 3, Hibernate 6, PostgreSQL 15+, Kafka 3.x; không bịa API/flag/giá trị mặc định; câu không có tag core cũng phải đủ **Tóm tắt:**, ### Trả lời mẫu khi phỏng vấn, > Senior tip:; ghi vào Notes nếu trùng ý câu khác.
3. **Sửa đúng** chỗ sai/thiếu; không chắc thì viết ở mức nguyên lý, bỏ chi tiết bịa. Không xoá mục, không đổi id.

## Luật
- Đọc AGENTS.md (schema; mục 5 markup: không backtick, không ký hiệu đô-la + ngoặc nhọn trong template literal).
- Ngoại lệ cho luật "chỉ thêm": task rà soát được sửa nội dung có sẵn. Đếm số mục trước/sau phải bằng nhau.
- Không commit.

## Nghiệm thu
`node --check js/data/q-sql.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` (bài học thêm `node scripts/test-lessons.js`, bug thêm `node scripts/test-bugs.js`) → OK.
Xong: `Status: DONE`. Notes: bảng `id | lỗi tìm thấy | đã sửa gì`.

## Notes

Rà soát 15 câu id lớn nhất không có tag `core`: sql-060 … sql-074 (74 object trước và sau, không đổi id, không xoá mục).
Nghiệm thu: `node --check js/data/q-sql.js` OK; `node scripts/build-light-index.js` chạy; `node scripts/validate.js` → **OK — không có lỗi** (chỉ còn cảnh báo path.js có sẵn từ trước, không thuộc file này).

| id | Lỗi tìm thấy | Đã sửa gì |
|---|---|---|
| sql-060 | Không có lỗi kỹ thuật; đủ Tóm tắt / Ví dụ / Trả lời mẫu / Senior tip | Giữ nguyên |
| sql-061 | Thiếu `> Senior tip:` (đang là heading `### Senior tip`); mục "Lỗi hay gặp" #2 giải thích NULL/UNKNOWN rối và sai; ví dụ RANGE/FIRST_VALUE không nói rõ vì sao kết quả sai | Đổi thành `> Senior tip:`; viết lại #2; viết lại ví dụ (cùng giây ⇒ FIRST_VALUE không xác định) |
| sql-062 | Chỉ 1080 ký tự, thiếu "Trả lời mẫu" và "Senior tip"; mô tả điều kiện inline CTE sai (liệt kê DISTINCT/GROUP BY/LIMIT/OFFSET/window function) | Viết lại 6291 ký tự; sửa đúng điều kiện inline PG 12+ (không đệ quy, không side-effect, tham chiếu 1 lần); thêm recursive CTE đồ thị có hướng + ví dụ |
| sql-063 | Chỉ 1267 ký tự, thiếu 2 mục; nói victim là "transaction tốn ít công việc hơn" không đúng | Viết lại 5527 ký tự; sửa victim (transaction khép kín chu trình, không đảm bảo nhỏ nhất); thêm code retry Java + 3 lớp |
| sql-064 | Chỉ 1110 ký tự, thiếu 2 mục | Viết lại 5271 ký tự; thêm MySQL generated column, migration CONCURRENTLY, bẫy JOIN với partial index |
| sql-065 | Chỉ 1010 ký tự, thiếu 2 mục | Viết lại 4843 ký tự; thêm trigger plpgsql, HLL, bảng so sánh, ví dụ số liệu |
| sql-066 | Chỉ 1369 ký tự, thiếu 2 mục | Viết lại 5793 ký tự; thêm OFFSET vs keyset, code Java record/text block, anchor_ts, HMAC |
| sql-067 | Chỉ 1107 ký tự, thiếu 2 mục; follow #1 thiếu space sau dấu "?" | Viết lại 5673 ký tự; sửa follow; thêm SET LOCAL/TransactionTemplate, mã lỗi 57014/55P03/25P03 |
| sql-068 | Chỉ 1361 ký tự, thiếu 2 mục; khẳng định NUMERIC(38,18) "an toàn cho mọi token" sai nếu lưu wei (ETH ~1.2×10^26 > 10^20) | Viết lại 4584 ký tự; sửa precision crypto (wei cần ~27 chữ số nguyên); làm rõ TIMESTAMPTZ/Java mapping |
| sql-069 | Số học sai: "mất một lần trừ 200" trong khi 1000 − 600 − 600 = −200, bản lost-update là 400 ⇒ mất 600 | Sửa cả `q` và `a` thành 600, nêu rõ kết quả đúng là −200 |
| sql-070 | Không có lỗi kỹ thuật | Giữ nguyên |
| sql-071 | Không có lỗi kỹ thuật | Giữ nguyên |
| sql-072 | Không có lỗi kỹ thuật | Giữ nguyên |
| sql-073 | Không có lỗi kỹ thuật | Giữ nguyên |
| sql-074 | Không có lỗi kỹ thuật | Giữ nguyên |

Trùng ý với câu khác (ghi nhận, không xoá):
- sql-062 trùng sql-021 (CTE fence) và sql-009 (recursive CTE cây) → bản mới tập trung vào điều kiện inline + đồ thị có hướng.
- sql-063 trùng sql-048 (deadlock) → giữ góc "3 lớp phòng thủ".
- sql-066 trùng sql-034/sql-053 (keyset/pagination) → giữ góc "cursor + INSERT song song".
- sql-068 trùng sql-025 (kiểu dữ liệu) → giữ góc "precision/scale + rounding + TIMESTAMPTZ".
Reviewed-by: kilo (T2197R)
