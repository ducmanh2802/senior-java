# T844R — Fact-check nội dung mới của T844

Status: DONE
Agent: opencode
Owns: `js/data/q-ai.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T844 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- ai-033: làm rõ chunking (recursive/semantic/parent-child), overlap, metadata, xử lý bảng/code block; thêm ngữ cảnh chi tiết, đúng kỹ thuật.
- ai-034: bổ sung giải thích recall@k/precision@k/MRR/hit rate, faithfulness/answer relevance/context precision-recall, golden set, quy trình eval, kiểm chứng LLM-as-judge.
- ai-035: chi tiết indirect prompt injection, so sánh với direct, các lớp phòng thủ (tách dữ liệu-chỉ thị, spotlighting, least privilege, HITL, output guard, ingest sanitization, tenant isolation, monitoring).
- ai-036: làm rõ agent loop, giới hạn (maxSteps/maxTokens/timeout/allowedTools), idempotency, audit, loop detection, workflow vs agent.
- ai-037: giải thích prompt caching (prefix động/tĩnh, cache key), streaming + huỷ upstream, giới hạn token theo user, bulkhead, semantic cache.
- ai-038: bổ sung timeout/retry (429+Retry-After, jitter), circuit breaker (open/half-open), fallback có kiểm soát, Resilience4j ví dụ, bulkhead/rate limit.
- ai-039: làm rõ quantization (scalar/PQ/binary), HNSW/ef_search/M, sharding/namespace, over-fetch, chiến lược reindex dual-read/cutover/rollback, đo recall.
- ai-040: nhấn mạnh ACL lọc trước retrieval, index strategy (shared/index riêng/hybrid), key cache theo tenant+ACL, cross-tenant isolation, chi phí theo tenant. 
- Đã chạy node scripts/validate.js đến khi OK. Không sửa nội dung cũ.
