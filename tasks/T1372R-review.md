# T1372R — Fact-check nội dung mới của T1372

Status: DONE
Agent: opencode
Owns: `js/data/q-java.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1372 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
Đã review toàn bộ nội dung mới trong `js/data/q-java.js` (theo `git diff HEAD`). Các đoạn "Ví dụ đời thực" và "Trả lời mẫu khi phỏng vấn" được thêm cho 6 câu hỏi:
- core-036 (Escape analysis): ví dụ Monte Carlo pricing service, số liệu JMH byte/op, warmup — đúng kỹ thuật.
- core-037 (Lambda/MethodHandles): ví dụ API gateway thay reflection bằng LambdaMetafactory, leak do capture `this` — đúng.
- core-038 (Class init deadlock): ví dụ enum Currency + ExchangeRateClient circular static init, NoClassDefFoundError mất cause, fix @PostConstruct — đúng.
- collections-031 (HashMap resize): ví dụ 180k entry resize 14 lần, HashMap.newHashMap (Java 19+), campaign "PROMO_" collision, rehash fix — đúng.
- collections-032 (Spliterator/parallel stream): ví dụ JDBC stream parallel chậm hơn do split/combine overhead, fix CompletableFuture batch riêng — đúng.
- collections-033 (HashMap treeify): ví dụ HashDoS 5k key collision, key không Comparable khiến tieBreakOrder dùng identityHashCode, fix MurmurHash3 + WAF — đúng.

Không phát hiện lỗi kỹ thuật, markup, hay chữ nước ngoài. `node scripts/validate.js` → OK (lỗi hiển thị thuộc `q-spring-data.js`, không thuộc file sở hữu). Đã chạy `node scripts/build-light-index.js`.
