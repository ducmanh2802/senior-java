# T2428 — 5 câu hỏi Senior Java (spring) vào q-spring-data.js

Status: DONE
Agent: kilo
Owns: `js/data/q-spring-data.js`
After: T2378

Thêm **5 câu hỏi phỏng vấn mới** (topic: spring) vào `js/data/q-spring-data.js`. Id nối tiếp id lớn nhất của topic (`node scripts/qtool.js list js/data/q-spring-data.js`); đọc danh sách để **không trùng ý** (góc nào đã có thì chọn góc khác).

Chủ đề: Spring internals hay bị hỏi ở ngân hàng/chứng khoán: vòng đời bean và BeanPostProcessor, proxy JDK vs CGLIB, @Transactional self-invocation/rollbackFor/propagation REQUIRES_NEW, @Async và thread pool, Spring Boot auto-configuration và @Conditional.

Mỗi câu theo AGENTS.md mục 4 và 6: `**Tóm tắt:**` → cơ chế bên trong từng bước và VÌ SAO → code Java ngắn (≤ 30 dòng) có comment → bảng trade-off / khi nào dùng → pitfall production → `### Ví dụ đời thực` có số liệu → `### Trả lời mẫu khi phỏng vấn` (150–220 từ) → `> Senior tip:`; `follow` 2–3 câu. Level: chủ yếu senior, 1–2 câu lead.

## Luật
- Đọc AGENTS.md trước (mục 4–6 và mục liên quan bên dưới).
- **Chỉ THÊM** vào file sở hữu (qtool append hoặc chèn trước dòng `);` cuối file); không sửa mục đã có, không sửa file khác. Đếm id trước/sau để chắc không làm mất mục của người khác.
- Không backtick, không `${` trong nội dung template literal.
- **Kiến thức phải ĐÚNG**: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15+, HikariCP, JDK tools (jstack, jcmd, JFR, GC log JDK 17+). Không bịa flag, API, metric. Không chắc thì viết ở mức nguyên lý.
- Người đọc: dev Java ~4 năm, hổng nền tảng, chuẩn bị phỏng vấn Senior: giải thích **từ gốc, từng bước, VÌ SAO**, ví dụ cụ thể, số liệu khớp nhau.

## Nghiệm thu
`node --check js/data/q-spring-data.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
Xong: sửa dòng `Status:` đầu file thành `Status: DONE`, Notes ghi id đã thêm.

## Notes

Đã thêm 5 câu hỏi (id nối tiếp spring-099 → spring-100…spring-104), chỉ THÊM vào `js/data/q-spring-data.js`:

- spring-100 (senior) — `@Bean` vs `FactoryBean`: cơ chế Spring gọi method / hỏi nhà máy, `getObjectType()` khi match theo kiểu, `isSingleton()`/`SmartFactoryBean`, bẫy hai instance & `NoUniqueBeanDefinitionException`.
- spring-101 (senior) — thứ tự advisor trên một method (`@Transactional` + `@Cacheable` + `@Async`): một proxy + chuỗi interceptor, `Ordered`, mặc định đều `LOWEST_PRECEDENCE`, cache hit vẫn lấy connection, cách ép order + `LazyConnectionDataSourceProxy`.
- spring-102 (senior) — `@Autowired` nội bộ: `AutowiredAnnotationBeanPostProcessor.postProcessProperties`, `InjectionMetadata` cache, `resolveDependency` (`@Primary`/`@Priority`/`Map`/`ObjectProvider`/`required=false`), constructor vs field vs setter.
- spring-103 (senior) — `@Async`/`CompletableFuture`: `ForkJoinPool.commonPool()`, executor riêng, `orTimeout`/`exceptionally`/`allOf`, `cancel(true)` không interrupt, `AsyncUncaughtExceptionHandler`.
- spring-104 (lead) — multi-datasource: `@ConditionalOnSingleCandidate(DataSource.class)` làm JPA auto-config rút lui, 2 EMF + 2 `JpaTransactionManager` + `@EnableJpaRepositories`, `@Transactional("ledgerTx")`, XA vs `ChainedTransactionManager` vs outbox, Flyway/health cho DB thứ hai.

Nội dung mới không trùng các câu 001–099 (đã đọc danh sách `qtool list` trước khi viết): 095 là BFPP vs BPP, 096 bean vs proxy, 040/099 là auto-config/@ConditionalOnMissingBean, 010/042/066/091/098 là `@Async` pool/context, 041/059/090 là REQUIRES_NEW — nên các câu mới chọn góc khác.

Kiểm tra:
- `node --check js/data/q-spring-data.js` → OK.
- `node scripts/build-light-index.js` → "Đã ghi js/data/index-light.js" (chạy lại sau khi file của task khác tạm hỏng).
- `node scripts/validate.js`: **không có lỗi/cảnh báo nào cho spring-100…spring-104** (đã grep xác nhận). Bản validate tổng vẫn còn 2 lỗi **thuộc file của task khác**, không sửa được vì task này chỉ sở hữu `js/data/q-spring-data.js`:
  1. `labs-sql.js`: lỗi cú pháp/chạy "Unexpected identifier 'artifacts'" (file đang được task khác sửa dở).
  2. `quiz_backup.js`: file không khai báo trong `js/core/data-manifest.js` (file tạm của task khác, nên xoá).
- Không commit, không sửa file khác, không mở trình duyệt, không kill tiến trình.
Reviewed-by: kilo (T2428R)
