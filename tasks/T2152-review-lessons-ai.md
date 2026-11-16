# T2152 — Rà soát chất lượng 6 bài học mới nhất (gồm loạt dự án RAG) trong lessons-ai.js

Status: DONE
Agent: kilo
Owns: `js/data/lessons-ai.js`
After: T2114

## Bối cảnh
Nội dung mới do model free viết chưa được kiểm tra chéo. Giai đoạn này ưu tiên **chất lượng** hơn số lượng: người học (dev Java ~4 năm, hổng nền tảng) dùng để đi phỏng vấn thật.

## Việc cần làm
1. Tìm 6 bài học mới nhất (gồm loạt dự án RAG) trong `js/data/lessons-ai.js` (grep -n theo id, hoặc `node scripts/qtool.js` nếu hỗ trợ file này). KHÔNG đọc cả file một lần.
2. Kiểm tra từng mục: body đúng kỹ thuật (Java 17/21, Spring Boot 3, Hibernate 6); giải thích từ gốc cho người hổng nền tảng; ví dụ code có comment; bài tập mô phỏng đúng cơ chế, test xác định; explain nêu lỗi hay gặp; câu check có đáp án đúng và explain đủ; loạt RAG: các bước nối nhau thành một dự án làm được thật (Spring Boot + pgvector), không bịa API Spring AI.
3. **Sửa đúng** chỗ sai/thiếu; không chắc thì viết ở mức nguyên lý, bỏ chi tiết bịa. Không xoá mục, không đổi id.

## Luật
- Đọc AGENTS.md (schema của loại dữ liệu này; mục 5 markup: không backtick, không ký hiệu đô-la + ngoặc nhọn trong template literal).
- Ngoại lệ cho luật "chỉ thêm": task rà soát được sửa nội dung có sẵn. Đếm số mục trước/sau phải bằng nhau.
- Không commit.

## Nghiệm thu
`node --check js/data/lessons-ai.js`; `node scripts/build-light-index.js`; node scripts/test-lessons.js; node scripts/validate.js → OK.
Xong: `Status: DONE`. Notes: bảng `id | lỗi tìm thấy | đã sửa gì` (không lỗi ghi "OK").

## Notes
- 6 bài mới nhất (theo id/order): `lesson-ai-011`..`lesson-ai-012`, `lesson-ai-015`..`lesson-ai-018` (loạt RAG nối nhau: kiến trúc + gọi LLM an toàn → chunking/embedding/pgvector/HNSW → retrieve/cosine/top-k/lọc quyền/prompt/citation/prompt injection → đánh giá recall@k/citation validity/log chi phí/CV).
- Đếm số mục: 16 lesson trước/sau (không đổi id, không xoá/thêm).

| id | lỗi tìm thấy | đã sửa gì |
|---|---|---|
| lesson-ai-011 | OK | Rà soát: body kỹ thuật đúng (stateless LLM, token budget, turn-based sliding window, summary/slot/PII), exercise/test deterministic, check đúng. |
| lesson-ai-012 | OK | Rà soát: MCP-style registry/schema/dispatcher + bảo mật (authz/tenant/PII/idempotency) đúng, bài tập Java thuần mô phỏng rõ, check đúng. |
| lesson-ai-015 | Phần cuối body (mục 3–5, "Liên hệ phỏng vấn") viết không dấu/typo, giải thích thuật ngữ chưa đủ cho người mới; thiếu `> Senior tip:` cuối bài; comment code mẫu chưa rõ. | Chuẩn hóa tiếng Việt có dấu và giải thích thuật ngữ (Thread.sleep, RateLimiter/Resilience4j, hard-code, @ConfigurationProperties/placeholder, latency, dashboard, circuit breaker/fallback/backoff/jitter) ở mục 3–5; viết lại mục 4–5 (ví dụ chi phí, bảng lỗi production) rõ ràng; viết lại "Liên hệ phỏng vấn" + thêm `> Senior tip:`; thêm comment giải thích field cấu hình. Không đổi exercise/tests/check/id. (Còn 1 comment nhỏ chưa dấu trong khối code ví dụ Java: `// tiep tu ...`, không ảnh hưởng nội dung/markup.) |
| lesson-ai-016 | OK | Rà soát: chunking/overlap/heading, embedding/pgvector/HNSW, truy vấn có lọc quyền & break-tie, số liệu khớp; exercise/test xác định; check đúng. |
| lesson-ai-017 | OK | Rà soát: cosine/top-k heap, lọc metadata, prompt có trích nguồn & validate citation, phòng prompt injection đúng; exercise/test xác định; check đúng. |
| lesson-ai-018 | OK | Rà soát: golden set, recall@k/precision@k, citation validity, log chi phí, mô tả CV trung thực; exercise/test xác định; check đúng. |

- Kiểm tra: `node --check js/data/lessons-ai.js` OK; `node scripts/build-light-index.js` OK; `node scripts/test-lessons.js` → Lesson exercises OK 298/298 (266 bài, 298 từ cache); `node scripts/validate.js` → `OK — không có lỗi.`. (Chỉ sửa `js/data/lessons-ai.js` và file task này; `js/data/index-light.js` được tái sinh theo luật.)
Reviewed-by: kilo (T2152R)
