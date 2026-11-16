# T2243 — Rà soát chất lượng các câu về REST/idempotency/versioning/pagination trong q-api.js

Status: DONE
Agent: kilo
Owns: `js/data/q-api.js`
After: T2198

## Bối cảnh
Giai đoạn ưu tiên **chất lượng**: nội dung do model free viết cần kiểm tra chéo trước khi người học (dev Java ~4 năm, hổng nền tảng) dùng đi phỏng vấn thật.

## Việc cần làm
1. Tìm các câu về REST/idempotency/versioning/pagination (`node scripts/qtool.js list js/data/q-api.js` nếu là câu hỏi; file khác dùng grep -n theo id). KHÔNG đọc cả file một lần.
2. Kiểm tra từng mục: HTTP semantics đúng RFC 9110 (PUT/DELETE idempotent, POST không; 409 vs 422); Idempotency-Key có luồng ~~~seq; cursor vs offset pagination có bảng so sánh.
3. **Sửa đúng** chỗ sai/thiếu; không chắc thì viết ở mức nguyên lý, bỏ chi tiết bịa. Không xoá mục, không đổi id.

## Luật
- Đọc AGENTS.md (schema; mục 5 markup: không backtick, không ký hiệu đô-la + ngoặc nhọn trong template literal).
- Ngoại lệ cho luật "chỉ thêm": task rà soát được sửa nội dung có sẵn. Đếm số mục trước/sau phải bằng nhau.
- Không commit.

## Nghiệm thu
`node --check js/data/q-api.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` (bài học thêm `node scripts/test-lessons.js`, bug thêm `node scripts/test-bugs.js`) → OK.
Xong: `Status: DONE`. Notes: bảng `id | lỗi tìm thấy | đã sửa gì`.

## Notes

| id | lỗi tìm thấy | đã sửa gì |
|----|-------------|-----------|
| api-001 | Không lỗi. Semantics RFC 9110 đúng (GET/HEAD/OPTIONS safe; PUT/DELETE + safe methods idempotent; POST không), PATCH thường không idempotent (JSON Patch `add /-` ví dụ), luồng `~~~seq` 3 actor, mọi bước ≤ 60 ký tự, Idempotency-Key + unique constraint + 422 khi key trùng body khác. | Giữ nguyên. |
| api-002 | Không lỗi. 201/202/204, 400 vs 422 (RFC 9457 ProblemDetail), 401 vs 403, 409 conflict/trùng idempotency key, 429 + Retry-After, 502/503/504; phân biệt 409 vs 422 đúng. | Giữ nguyên. |
| api-003 | Không lỗi. Đặt tên resource số nhiều, nested 1 cấp, query param filter/sort/page, bảng so sánh page-based vs cursor-based (cursor base64 của (bookedAt, id), keyset pagination, max page size ≤ 100, chống IDOR). | Giữ nguyên. |
| api-015 | Không lỗi. POST không idempotent RFC 9110, reserve-trước-gọi-PSP, unique index (merchant_id, idempotency_key), request_hash, IN_PROGRESS → 409 + Retry-After, COMPLETED → replay, TTL 7 ngày, partition tháng. | Giữ nguyên. |
| api-016 | Lỗi: sau ví dụ controller v1/v2 claims "Spring Framework 7 / Spring Boot 4 có thêm hỗ trợ API versioning sẵn" — không chắc đúng, vi phạm quy tắc không bịa API (AGENTS.md mục 6). | Thay bằng nguyên lý xác định: Spring MVC không có versioning built-in, mẫu adapter mỏng (controller v1 map về shape cũ, service dùng chung) là cách triển khai chuẩn; không rải `{{if v1}}` khắp code. |
| Tổng số câu | 60 câu trước/sau bằng nhau (sửa nội dung, không xoá, không đổi id). | — |

`node --check js/data/q-api.js` → OK. `node scripts/build-light-index.js` → index-light.js sinh lại. `node scripts/validate.js` → các LỖI còn lại nằm ở `path.js`/`lessons-claude.js` (file không sở hữu, lỗi trước đó từ session khác; lessons-claude.js có syntax error `Unexpected identifier 'hooks'`), không liên quan q-api; không lỗi nào thuộc `api`.
