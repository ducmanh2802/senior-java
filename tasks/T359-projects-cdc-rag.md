# T359 — Pet project: Search + CDC và RAG bằng Java

Status: DONE
Agent: claude
Owns: `js/data/projects.js`
After: T358

Thêm 2 dự án vào cuối window.PROJECTS, đúng định dạng như proj-wallet (đọc tasks/T327-projects-deep-a.md):
1. proj-search-cdc (senior): outbox pattern, Debezium đọc WAL PostgreSQL, Kafka, đồng bộ sang OpenSearch, reindex không downtime, xử lý lệch dữ liệu.
2. proj-rag-java (senior): RAG hỏi đáp tài liệu nội bộ bằng Spring AI + pgvector, chunking/embedding, phân quyền tài liệu theo user, eval (golden set), chống prompt injection, chi phí.
Tên artifact, class, property phải lấy từ docs chính thức (debezium.io, opensearch.org, docs.spring.io/spring-ai, github.com/pgvector); không chắc thì mô tả bằng lời.

### Chuẩn chung (bắt buộc)
- Đọc AGENTS.md mục 2, 4, 5, 6, 13 trước khi viết. Người học là dev Java ~4 năm, **hổng nền tảng**: giải thích từ gốc, ví dụ đời thường, cơ chế từng bước có "vì sao", sơ đồ ASCII hoặc số liệu, code ngắn có comment, bảng trade-off, ### Lỗi hay gặp, ### Trả lời miệng 1 phút ngay trước > Senior tip:.
- Chống trùng: đọc hết câu cùng topic trong file của bạn và grep các file js/data/q-*.js khác; chủ đề đã có thì chọn góc khác hoặc bỏ.
- Đúng kỹ thuật với Java 17/21, Spring Boot 3.x, Hibernate 6, Kubernetes/AWS hiện hành. Không chắc thì viết ít lại nhưng đúng. refs chỉ dùng link chắc chắn tồn tại; chạy node scripts/check-links.mjs <tên-file.js> (chỉ tên file) và bỏ link hỏng.
- Chỉ **thêm**, id tiếp số lớn nhất của topic/category trong file. Không sửa nội dung đã có.
- Trong template literal: không có ký tự backtick, không có ${ chưa escape, dấu \ phải viết \\; inline code dùng {{code}}.
- **Không bao giờ để file hỏng cú pháp**: sau mỗi lần sửa chạy node --check <file>; nếu hỏng mà không sửa được thì khôi phục bằng git checkout -- <file> rồi làm lại từng mục một.
- Không chạy trực tiếp file .js như lệnh (luôn node <file>). Không commit/push, không kill tiến trình, không mở trình duyệt.
- Xong: node scripts/validate.js → OK — không có lỗi.; ghi Notes (id đã thêm) và đổi dòng trạng thái thành đúng Status: DONE (chỉ dùng TODO hoặc DONE, không dùng giá trị khác).

## Notes

- Added proj-search-cdc and proj-rag-java at the end of window.PROJECTS (js/data/projects.js only; existing projects untouched). design 5.4k / 4.7k chars; 6 + 5 milestones with numbered steps + commented code; 5 challenges each; STAR + Trả lời miệng 1 phút + Demo trong 5 phút; 8 questions/answers (560–660 chars).
- Verified against official docs: Debezium PostgresConnector props (plugin.name pgoutput, slot.name, publication.name, publication.autocreate.mode filtered, table.include.list, heartbeat.interval.ms, topic.prefix), EventRouter SMT class + default outbox columns/topic outbox.event.<aggregatetype>, table.expand.json.payload; OpenSearch POST _aliases atomic swap, version_type external; Spring AI spring-ai-starter-vector-store-pgvector, PgVectorStore defaults (vector_store table, HNSW, COSINE_DISTANCE, initialize-schema false, vectorTableName), QuestionAnswerAdvisor/SearchRequest/FilterExpressionBuilder, FILTER_EXPRESSION request-level override, TokenTextSplitter (chunkSize 800), TikaDocumentReader + spring-ai-tika-document-reader, VectorStore.delete(String filter), metrics gen_ai.client.token.usage / gen_ai.client.operation / db.vector.client.operation; pgvector post-filtering, hnsw.ef_search 40, hnsw.iterative_scan (0.8.0), 2000-dim HNSW limit.
- NOT verified from docs (from memory, plausible): opensearch-java fluent API (.version(..).versionType(VersionType.External), OpenSearchException.status()), Debezium JMX metric MilliSecondsBehindSource, Kafka Connect image env vars (BOOTSTRAP_SERVERS, GROUP_ID, *_STORAGE_TOPIC) and tag quay.io/debezium/connect:3.0, apache/kafka:3.8.0 / opensearchproject/opensearch:2.17.0 tags, Micrometer kafka.consumer.fetch.manager.records.lag.max, spring-ai-starter-model-openai, Usage.getPromptTokens/getCompletionTokens, OpenSearch asciifolding folding đ->d. Prices in RAG answers are labelled as examples.
- related: only existing ids (checked by validate).
- node --check OK; validate: 0 errors in projects.js; current run shows errors only in js/data/algo.js (algo-132, algo-134) from another agent in progress.
Reviewed-by: claude (subagent; validate OK)
