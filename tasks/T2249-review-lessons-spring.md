# T2249 — Rà soát chất lượng các bài (grep -n "id: 'lesson-") trong lessons-spring.js

Status: DONE
Agent: kilo
Owns: `js/data/lessons-spring.js`
After: T2148

## Bối cảnh
Giai đoạn ưu tiên **chất lượng**: nội dung do model free viết cần kiểm tra chéo trước khi người học (dev Java ~4 năm, hổng nền tảng) dùng đi phỏng vấn thật.

## Việc cần làm
1. Tìm các bài (grep -n "id: 'lesson-") (`node scripts/qtool.js list js/data/lessons-spring.js` nếu là câu hỏi; file khác dùng grep -n theo id). KHÔNG đọc cả file một lần.
2. Kiểm tra từng mục: body dạy từ gốc cho người hổng nền tảng: mỗi khái niệm có ví dụ + lý do VÌ SAO; check (câu kiểm tra nhanh) có explain nói vì sao từng phương án sai; sửa chỗ sai Spring Boot 3.x; KHÔNG sửa tests/reference (chạy node scripts/test-lessons.js nếu đụng code).
3. **Sửa đúng** chỗ sai/thiếu; không chắc thì viết ở mức nguyên lý, bỏ chi tiết bịa. Không xoá mục, không đổi id.

## Luật
- Đọc AGENTS.md (schema; mục 5 markup: không backtick, không ký hiệu đô-la + ngoặc nhọn trong template literal).
- Ngoại lệ cho luật "chỉ thêm": task rà soát được sửa nội dung có sẵn. Đếm số mục trước/sau phải bằng nhau.
- Không commit.

## Nghiệm thu
`node --check js/data/lessons-spring.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` (bài học thêm `node scripts/test-lessons.js`, bug thêm `node scripts/test-bugs.js`) → OK.
Xong: `Status: DONE`. Notes: bảng `id | lỗi tìm thấy | đã sửa gì`.

## Notes
- Đếm bài trước/sau: 19/19 (lesson-spring-001..019), không đổi id, không sửa tests/reference.
- Đã rà soát toàn bộ 19 bài: body đều có `**Tóm tắt:**`, các mục giải thích/`### Liên hệ phỏng vấn`, nội dung phù hợp Spring Boot 3.x (mặc định CGLIB proxy-target-class, circular refs mặc định tắt từ 2.6, ProblemDetail RFC 9457, `jakarta.annotation` lifecycle), không backtick/`${`, không chèn/xoá mục.
- Cải thiện `check.explain` để giải thích rõ vì sao các phương án sai (phù hợp luật “nói vì sao từng phương án sai”) tại:
  - `lesson-spring-012` (câu 1, 4): bổ sung lý do từng phương án sai về cách FilterChainProxy chọn chain và ý nghĩa `@Order`.
  - `lesson-spring-018` (câu 1, 3, 4): bổ sung giải thích sai/đúng cho thứ tự `@Around` theo `@Order`, pointcut `@annotation && execution(...)`, và cách đổi tham số qua `pjp.proceed(newArgs)`.
- Kiểm tra: `node --check js/data/lessons-spring.js` OK; `node scripts/build-light-index.js` OK; `global.window={}; require('./js/data/lessons-spring.js')` load OK (19 bài track spring). `node scripts/test-lessons.js` không chạy vì không sửa code bài tập/tests/reference.
- `node scripts/validate.js` hiện **không OK** do lỗi có sẵn ngoài phạm vi sở hữu (không sửa): `lessons-concurrency.js` — `lesson-concurrency-012.body` có 2 inline code `{{...}}` chứa dấu `{ }` lồng nhau (validator báo). File sở hữu `js/data/lessons-spring.js` không còn lỗi do lần chỉnh sửa này.

| id | lỗi tìm thấy | đã sửa gì |
|---|---|---|
| lesson-spring-012 | explain check q1,q4 chưa giải thích rõ vì sao từng phương án sai | Bổ sung giải thích từng phương án sai (tiêu chí chọn chain đầu tiên khớp theo `@Order`, và `@Order` không dùng cho routing/CSRF/session timeout) |
| lesson-spring-018 | explain check q1,q3,q4 chưa giải thích rõ vì sao từng phương án sai | Bổ sung giải thích từng phương án sai (thứ tự ngoài-trong theo `@Order`, AND pointcut method-level + giới hạn proxy, và cách hợp lệ thay tham số bằng `proceed(args)`) |
| lesson-spring-001..011,013..017,019 | Không phát hiện sai kỹ thuật/lỗi schema/markup trong phạm vi body+check (tests/reference giữ nguyên) | Giữ nguyên, đã rà soát nội dung và explain check |Reviewed-by: verify-only (review task)
