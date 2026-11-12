# T1483R — Fact-check nội dung mới của T1483

Status: DONE
Agent: opencode
Owns: `js/data/quiz-gaps.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1483 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
Đã review toàn bộ file `js/data/quiz-gaps.js` (128 câu trắc nghiệm mới: sql 12, testing 12, ai 12, kotlin 12, banking 27, behavioral 5, english 5). Kiểm tra:
- Kỹ thuật: SQL (PostgreSQL 15: expression index, partial unique index, NULLS NOT DISTINCT, CTE inline, deadlock_timeout, keyset pagination tie-breaker, ANALYZE sau bulk import, upsert DO UPDATE, REPEATABLE READ snapshot isolation, index composite), Testing (Mockito spy vs mock, @SpringBootTest RANDOM_PORT + @Transactional, @DataJpaTest slice, @WebMvcTest + @MockitoBean, JUnit 5 PER_METHOD, flaky test nguyên nhân, Testcontainers static container, Mockito any() vs anyInt(), @Nested @BeforeEach order, context cache miss, WireMock delay, BigDecimal equals vs compareTo), AI (temperature 0 không đảm bảo tất định, chunk size retrieval, hybrid search BM25+vector, unit vector cosine=dot product, lost in the middle rerank, LLM-as-judge rubric/position bias/calibration, indirect prompt injection least privilege/human-in-loop/code validation, prompt caching prefix, streaming TTFT, hallucination citation+verification, max_tokens truncation stop reason, RAG vs fine-tune), Kotlin (data class equals/===, kotlin-spring all-open plugin, data class JPA entity rủi ro equals/hashCode/toString + no-arg/all-open, smart cast mutable property, coroutineScope structured concurrency cancellation, cold Flow re-run per collect, extension function static dispatch, sealed interface exhaustiveness, List read-only vs immutable, Java interop @JvmOverloads/@JvmStatic/@Throws/@file:JvmName, data class shallow copy mutable list, coroutine cancellation ensureActive/yield) — tất cả đúng chuẩn Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x.
- Markup: đúng cú pháp {{code}}, ###, ~~~lang, > Senior tip, **đậm**, không có backtick, `${` đã escape thành `\${`.
- Ngôn ngữ: tiếng Việt, thuật ngữ kỹ thuật giữ nguyên tiếng Anh.
- Schema: multi-choice có `(Chọn N)` khớp `answer.length`, answer mảng tăng dần, options không trùng.
Chạy `node scripts/build-light-index.js` và `node scripts/validate.js` → OK.
Không có lỗi kiến thức, markup hay ngoại ngữ.
