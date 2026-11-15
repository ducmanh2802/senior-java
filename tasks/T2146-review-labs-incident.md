# T2146 — Rà soát chất lượng 4 lab mới nhất (id lớn nhất) trong labs-incident.js

Status: DONE
Agent: kilo
Owns: `js/data/labs-incident.js`
After: T2110

## Notes

Đã rà soát 4 lab mới nhất (id lớn nhất): `lab-incident-035` … `lab-incident-038`. Số mục trước/sau = 38 (không thêm, không xoá).

| id | lỗi tìm thấy | đã sửa gì |
|---|---|---|
| lab-incident-035 | 1. Trong phần giải thích `pg_stat_activity`, ghi `state \| wait \| count \| q` nhưng artifact thực tế chỉ có 4 cột (state, wait, count, q) — phần giải thích trong answer ghi nhầm thành "3 cột" (không rõ ràng). 2. Trong phần "Khái niệm cần biết trước", từ `ROLLBACK` được viết nhầm thành `ROLLBACK zurück` (ký tự tiếng Đức `zurück` không cần thiết). | Chuẩn hóa lại phần giải thích `pg_stat_activity` để chỉ rõ 4 cột (state, wait, count, q) và giải thích ý nghĩa mỗi cột. Loại bỏ ký tự `zurück` không cần thiết, viết đúng `ROLLBACK hoàn toàn`. |
| lab-incident-036 | 1. Dữ liệu số liệu không hợp lý: `Redis SLOWLOG entry 1: GET product:detail:9987, duration=12450ms` — Redis là single-threaded, GET luôn < 1 ms, không thể mất 12.450 ms. 2. `SET product:detail:9987 ..., duration=890ms` — ký tự `...` trong artifact không rõ ràng, thiếu giá trị cụ thể. 3. Phần "Dẫn chứng" trong answer trích dẫn lại số liệu cũ (12.450 ms, 890 ms) không khớp với artifact đã sửa. | Sửa artifact: `GET` mất 4.200 us, `SET` mất 3.800 us (vẫn chậm hơn bình thường < 1 ms, nhưng vẫn phản hồi nhanh — chứng minh đây không phải do Redis chậm). Cập nhật lại phần D dẫn chứng trong answer để trích dẫn đúng số liệu mới và nhấn mạnh Redis vẫn phản hồi nhanh, điểm yếu là DB. |
| lab-incident-037 | OK — artifact tự nhất quán: trace-ORD-88214 (gateway 504 ở giây 10, order-service timeout ở giây 30), jstack 200/200 thread, Prometheus tomcat_busy 200/200, balance_p99 tăng theo, timeout-config.yml cấu hình gateway 10s / order→payment 30s. answer trích đúng dòng, cách sửa đúng kỹ thuật (timeout giảm dần, circuit breaker, bulkhead, fallback, idempotency). Rubric 5 ý đo được. Không lỗi. | OK |
| lab-incident-038 | OK — artifact tự nhất quán: app-lost-update.log (exec-17 và exec-42 cùng đọc stock=1, cả hai UPDATE thành công, tồn kho 1→0→-1, hai đơn 200 OK), pg-stat-activity (một session Lock trên cùng một hàng), Product.java (không @Version), metric oversell_count=1. answer trích đúng dòng, giải thích lost update đúng, phân biệt @Version vs SELECT FOR UPDATE, rubric 5 ý. Không lỗi. | OK |

Kiểm tra cuối: `node --check js/data/labs-incident.js` → SYNTAX OK; `node scripts/build-light-index.js` → đã ghi index-light.js; `node scripts/validate.js` → `OK — không có lỗi.` (38 lab incident, số mục không thay đổi).

## Bối cảnh
Nội dung mới do model free viết chưa được kiểm tra chéo. Giai đoạn này ưu tiên **chất lượng** hơn số lượng: người học dùng để đi phỏng vấn thật.

## Việc cần làm
1. Tìm 4 lab mới nhất (id lớn nhất) trong `js/data/labs-incident.js` (dùng grep -n theo id, hoặc `node scripts/qtool.js` nếu hỗ trợ file này). KHÔNG đọc cả file một lần.
2. Kiểm tra từng mục: artifact tự nhất quán (timestamp, tên thread/service, số liệu khớp nhau và khớp answer); answer trích đúng dòng trong artifact; cách sửa đúng kỹ thuật; rubric ≥ 3 ý đo được.
3. **Sửa đúng** chỗ sai/thiếu; không chắc thì viết ở mức nguyên lý, bỏ chi tiết bịa. Không xoá mục, không đổi id.

## Luật
- Đọc AGENTS.md (schema của loại dữ liệu này, mục 5 markup: không backtick, không ký hiệu đô-la + ngoặc nhọn trong template literal).
- Ngoại lệ cho luật "chỉ thêm": task rà soát được sửa nội dung có sẵn. Đếm số mục trước/sau phải bằng nhau.
- Không commit.

## Nghiệm thu
`node --check js/data/labs-incident.js`; `node scripts/build-light-index.js`; node scripts/validate.js → OK.
Xong: `Status: DONE`. Notes: bảng `id | lỗi tìm thấy | đã sửa gì` (không lỗi ghi "OK").

## Notes
Reviewed-by: kilo (T2146R)
