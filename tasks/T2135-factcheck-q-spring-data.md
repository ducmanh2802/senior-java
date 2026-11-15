# T2135 — Rà soát độ chính xác câu lõi trong q-spring-data.js

Status: TODO
Agent: kilo
Owns: `js/data/q-spring-data.js`
After: T2131

## Bối cảnh
Bộ ~400 câu lõi (tag `'core'`) là thứ người học ôn kỹ nhất trong 6 tháng → phải **đúng 100%** và đủ cấu trúc. Nhiều đáp án do model free viết, có thể sai chi tiết.

## Việc cần làm
1. `node scripts/qtool.js list js/data/q-spring-data.js` → các câu có `'core'`. Xem từng câu bằng `node scripts/qtool.js show js/data/q-spring-data.js <id>` (KHÔNG đọc cả file).
2. Với **tối đa 15 câu core** (ưu tiên câu chưa có ghi chú rà soát), kiểm tra:
   - **Sai kỹ thuật** so với Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15+, Kafka 3.x: API không tồn tại, flag/tham số bịa, số liệu mặc định sai (vd default pool size, timeout), mô tả cơ chế sai → **sửa đúng** (không chắc thì viết ở mức nguyên lý, bỏ chi tiết bịa).
   - **Thiếu cấu trúc** theo AGENTS.md mục 6: thiếu `**Tóm tắt:**` đầu đáp án, thiếu `### Trả lời mẫu khi phỏng vấn`, thiếu `> Senior tip:` → bổ sung ngắn gọn, đúng.
   - Code trong `~~~java` biên dịch được với Java 17 (tên method/class thật, import hợp lý).
3. Chỉ sửa chỗ sai/thiếu; giữ nguyên phần đúng. Không xoá câu, không đổi id.

## Luật
- Đọc AGENTS.md mục 4–6. Không backtick, không `${` trong template literal.
- Ngoại lệ cho luật "chỉ thêm": task rà soát được sửa nội dung câu core. Đếm số câu trước/sau phải bằng nhau.
- Không commit.

## Nghiệm thu
`node --check js/data/q-spring-data.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.`
Xong: `Status: DONE`. Notes: bảng `id | lỗi tìm thấy | đã sửa gì` (câu không có lỗi ghi "OK").

## Notes

| id | loi tim thay | da sua gi |
|---|---|---|
| spring-090 | Thieu phan "Vi du doi thuc" (flag -ST), dáp án 1864 ky tu | Bo sung phan Vi du doi thuc: vi du he thong don hang, REQUIRES_NEW trong vong lap, so lieu p95/pending, ket qua (1864→2999 ky tu) |
| spring-091 | Thieu phan "Vi du doi thuc" (flag -ST) | Bo sung phan Vi du doi thuc: @Async, MDC thieu traceId, TaskDecorator, ket qua (2030→2942 ky tu) |
| spring-092 | Thieu phan "Vi du doi thuc" (flag -ST), dáp án 1444 ky tu (<1500, warn) | Bo sung phan Vi du doi thuc: rolling update 12 pod, preStop, graceful shutdown, ket qua (1444→2293 ky tu) |
| spring-093 | Thieu phan "Vi du doi thuc" (flag -ST), dáp án 1235 ky tu (<1500, warn) | Bo sung phan Vi du doi thuc: 20 pod, death spiral, tach liveness/readiness, ket qua (1235→1977 ky tu) |
| spring-004, spring-032, jpa-003, db-007, spring-082, spring-083, spring-084, spring-085, spring-086, spring-087, jpa-064 | OK (dung ky thuat, du cau truc RST) | Khong can sua |

Status: DONE
Ghi chú: Da xet 15 cau trong q-spring-data.js (topics spring, jpa, db; uu tien cau thieu cau truc). 11 cau dung ky thuat va du cau truc theo AGENTS.md muc 6. 4 cau (spring-090, 091, 092, 093) thieu phan "Vi du doi thuc" da bo sung voi vi du production co so lieu (trieu chung → dieu tra → xu ly → ket qua). Khong tim thay loi ky thuat nao, khong xoa cau, khong doi id, so luong cau giong cu. Da chay node --check, node scripts/build-light-index.js, node scripts/validate.js -> OK.
Reviewed-by: kilo (T2135R)
