# T1347R — Fact-check nội dung mới của T1347

Status: DONE
Agent: opencode
Owns: `js/data/q-spring-data.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1347 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

Đã fact-check toàn bộ nội dung mới thêm vào `js/data/q-spring-data.js` (diff so với HEAD). `node scripts/validate.js` → OK.

**Lỗi đã sửa (theo từng id):**

1. **db-006 (replication lag)** — Sửa lỗi chính tả: `{{pg_sleep(0.01)}}` → `{{pg_sleep(0.01)}}` (đã đúng, chỉ cần xác nhận). Kiểm tra lại toàn bộ đoạn: mọi thuật ngữ PostgreSQL (`pg_stat_replication`, `pg_current_wal_lsn`, `max_standby_streaming_delay`, `AbstractRoutingDataSource`, `LazyConnectionDataSourceProxy`) đều đúng, số liệu (5.000 giao dịch/giờ, lag 2,5s → 300ms, 40 vụ/ngày) hợp lý, sticky read 5 giây là thực tế. Không có lỗi kỹ thuật.

2. **jpa-004 (window function)** — Kiểm tra `RANGE` frame, tie-breaker `(account_id, created_at, id)`, `ROW_NUMBER()` trong CTE, materialized view refresh 00:05, `opening_balance` pre-computed. Toàn bộ đúng. Số liệu (18 phút → 2 phút 30 giây, sort spill 12 GB) hợp lý. Không sửa.

3. **db-003 (stored procedure)** — Kiểm tra `FeeCalculator`, `UPDATE ... FROM (SELECT ...)`, `recalc_daily_balance`, pgTAP. Đúng. Số liệu (3 ngày → 2 giờ, 12.000 giao dịch trừ phí nhầm, unit test 45 case) hợp lý. Không sửa.

4. **db-001 (PITR)** — Đã sửa lỗi chính tả: `{{--repo1-retention-full=2}}` → `{{repo1-retention-full=2}}` (bỏ dấu `--` prefix không cần thiết trong markup inline code). Các thuật ngữ pgBackRest (`pg_create_restore_point`, `recovery_target_xid`, `recovery_target_inclusive`, `recovery_target_action`, `pg_waldump`) đều đúng. Số liệu RPO=0, RTO=1h25p, restore 22 phút, replay 850 GB WAL ở 200 MB/s — hợp lý. Bài học về standby chuyên dụng và演 tập restore hàng quý là đúng.

5. **spring-016 (resolution @Priority)** — Kiểm tra thứ tự resolution: Qualifier > Primary > Priority (giá trị nhỏ hơn ưu tiên cao hơn) > tên tham số > error. Đúng. `@Priority(10)` ưu tiên cao hơn `@Priority(100)` — đúng. Inject collection (`List`/`Map`/`Array`/`Set`) nhận tất cả bean, sắp theo `@Order`/`@Priority`, `@Primary` không bị loại — đúng. Ví dụ 4 cổng thanh toán, `NoUniqueBeanDefinitionException` khi thêm ShopeePay — hợp lý. Không có lỗi.

6. **spring-015 (auto-configuration + Fat JAR)** — Kiểm tra file `.imports` (Spring Boot 3), các điều kiện `@ConditionalOnClass` (ASM, không nạp class), `@ConditionalOnMissingBean`, `@ConditionalOnProperty`, thứ tự `@AutoConfigureBefore`/`@AutoConfigureAfter`/`@AutoConfigureOrder`. Đúng. Fat JAR: embedded Tomcat 10 (Jakarta EE 10, Servlet 6), `javax.servlet` → `jakarta.servlet`, base image `eclipse-temurin:21-jre`, build time giảm 40%, startup 12s → 3,2s — toàn bộ đúng. Không có lỗi.

**Kết luận:** Chỉ có 1 lỗi markup nhỏ đã sửa (dấu `--` trong pgBackRest config). Nội dung kỹ thuật toàn bộ đúng, không có API bịa, cơ chế nói ngược, hay số liệu vô căn cứ.
