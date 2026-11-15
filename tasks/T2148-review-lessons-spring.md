# T2148 — Rà soát chất lượng 4 bài học mới nhất (order lớn nhất) trong lessons-spring.js

Status: DONE
Agent: kilo
Owns: `js/data/lessons-spring.js`
After: T2096

## Bối cảnh
Nội dung mới do model free viết chưa được kiểm tra chéo. Giai đoạn này ưu tiên **chất lượng** hơn số lượng: người học dùng để đi phỏng vấn thật.

## Việc cần làm
1. Tìm 4 bài học mới nhất (order lớn nhất) trong `js/data/lessons-spring.js` (dùng grep -n theo id, hoặc `node scripts/qtool.js` nếu hỗ trợ file này). KHÔNG đọc cả file một lần.
2. Kiểm tra từng mục: body đúng kỹ thuật Spring Boot 3/Spring 6 (proxy, AOP, transaction, bean lifecycle); ví dụ code có comment; bài tập mô phỏng đúng cơ chế; explain nêu lỗi hay gặp; check có đáp án đúng và explain đủ.
3. **Sửa đúng** chỗ sai/thiếu; không chắc thì viết ở mức nguyên lý, bỏ chi tiết bịa. Không xoá mục, không đổi id.

## Luật
- Đọc AGENTS.md (schema của loại dữ liệu này, mục 5 markup: không backtick, không ký hiệu đô-la + ngoặc nhọn trong template literal).
- Ngoại lệ cho luật "chỉ thêm": task rà soát được sửa nội dung có sẵn. Đếm số mục trước/sau phải bằng nhau.
- Không commit.

## Nghiệm thu
`node --check js/data/lessons-spring.js`; `node scripts/build-light-index.js`; node scripts/test-lessons.js; node scripts/validate.js → OK.
Xong: `Status: DONE`. Notes: bảng `id | lỗi tìm thấy | đã sửa gì` (không lỗi ghi "OK").

## Notes

| id | lỗi tìm thấy | đã sửa gì |
|---|---|---|
| lesson-spring-016 | OK | Không có lỗi — body đầy đủ, đúng kỹ thuật Spring Boot 3 auto-configuration; bài tập mô phỏng đúng cơ chế điều kiện classpath/property/bean, thứ tự before/after, user bean thắng default; check/explain đầy đủ |
| lesson-spring-017 | OK | Không có lỗi — body phân biệt rõ REQUIRED/REQUIRES_NEW/NESTED theo connection & savepoint; bảng so sánh chính xác; bài tập TxManager mô phỏng đúng connection pool, suspend/resume, savepoint, rollback-only; check/explain đầy đủ |
| lesson-spring-018 | OK | Không có lỗi — body覆盖 custom annotation, pointcut expression, @Around/ProceedingJoinPoint, precedence/@Order, interceptor chain thủ công; bài tập AdviceChain tái hiện đúng thứ tự order, proceed(newArgs), chặn lời gọi, bắt exception; check/explain đầy đủ |
| lesson-spring-019 | OK | Không có lỗi — body覆盖 N+1, EntityGraph (LOAD/FETCH), fetch join, projection (closed/open), @BatchSize, @Subselect, pagination trap; trade-off table chính xác; bài tập N1Detector mô phỏng 4 chiến lược và đếm query bằng reflection; check/explain đầy đủ |

Tất cả 4 bài học đều pass: `node --check`, `node scripts/build-light-index.js`, `node scripts/test-lessons.js` (296/296), `node scripts/validate.js` → OK.
