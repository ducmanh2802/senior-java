# T550 — Dịch lại (nội dung đã sửa): q-spring-data-9 (9 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/q-spring-data-9.en.js`

Nội dung tiếng Việt của các mục sau trong `js/data/q-spring-data.js` đã được sửa SAU khi dịch, nên bản tiếng Anh trong `js/i18n/q-spring-data-9.en.js` đã cũ: **spring-028, spring-032, spring-033, jpa-022, jpa-023, jpa-024, jpa-025, jpa-026, jpa-027**.

Với MỖI mục trên: đọc bản tiếng Việt hiện tại trong `js/data/q-spring-data.js` và DỊCH LẠI toàn bộ entry của nó trong `js/i18n/q-spring-data-9.en.js` (thay entry cũ, giữ nguyên key, cùng tập field như các entry khác). Không đụng các mục khác. Code, id, url giữ nguyên; chuỗi tiếng Việt trong code mẫu cũng dịch sang tiếng Anh.
Đọc AGENTS.md mục 5 (markup: không backtick, không `${`).

## Nghiệm thu
node scripts/check-i18n.js q-spring-data-9 → OK; node scripts/validate.js → OK.

## Notes

Đã dịch lại 9 entry (spring-028, spring-032, spring-033, jpa-022, jpa-023, jpa-024, jpa-025, jpa-026, jpa-027) từ bản tiếng Việt hiện tại trong `js/data/q-spring-data.js`; các entry còn lại giữ nguyên.

Bổ sung so với bản cũ (theo nội dung tiếng Việt đã sửa):
- spring-028: bảng so sánh JDK proxy/CGLIB sửa dòng "call through interface" (subclass cũng implement interface); ghi rõ annotation trên final/private method không có tác dụng.
- spring-032: nêu mốc Boot 3.2 + Java 21, danh sách integration được hỗ trợ; pinning chi tiết (JFR `jdk.VirtualThreadPinned`, JEP 491 ở Java 24 bỏ pinning do `synchronized`, native frame vẫn pin).
- spring-033: cấu hình cụ thể `server.shutdown=graceful` (mặc định từ Boot 3.4), `spring.lifecycle.timeout-per-shutdown-phase` (mặc định 30s), `preStop` sleep trên Kubernetes.
- jpa-022: thêm ví dụ remove/persist cùng giá trị unique `code = 'VIP'` → INSERT chạy trước DELETE.
- jpa-023: OSIV bật mặc định trong Boot, khuyến nghị `spring.jpa.open-in-view=false` cho REST API.
- jpa-024: tên exception `StaleObjectStateException`/`OptimisticLockException` → `ObjectOptimisticLockingFailureException`.
- jpa-025: `order_inserts`/`order_updates`, `reWriteBatchedInserts` (PostgreSQL), `rewriteBatchedStatements` (MySQL).
- jpa-026: `EntityGraphType.FETCH` vs `LOAD`, `MultipleBagFetchException`, `fail_on_pagination_over_collection_fetch`.
- jpa-027: query cache bị vô hiệu theo timestamp của bảng.

Giữ nguyên key, thứ tự và tập field (q, a, follow). Thuật ngữ được giải thích ngắn khi xuất hiện lần đầu; không có backtick, không có `${`, không còn chữ tiếng Việt ngoài code block.

Kiểm tra: `node scripts/check-i18n.js q-spring-data-9` → OK (12 mục); `node scripts/validate.js` → OK — không có lỗi.
Reviewed-by: check-i18n (translation, no LLM review)
