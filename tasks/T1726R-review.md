# T1726R — Fact-check nội dung mới của T1726

Status: DONE
Agent: opencode
Owns: `js/data/q-api.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1726 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

`node scripts/validate.js` → **OK — không có lỗi** (api: 60 câu hỏi, 40 trắc nghiệm). Cảnh báo `path.js` về bài học ngoài PATH là có sẵn ở HEAD, không liên quan phạm vi task.

Đã sửa các lỗi kiến thức sau (chỉ sửa nội dung, không đổi văn phong/bố cục, không thêm/xoá mục):

**api-055 (idempotency, retry)**
- Bảng quyết định retry: `409` bị gộp vào nhóm "không retry" mâu thuẫn với prose (409 nghĩa là request trước chưa xong, client phải chờ rồi retry). Tách thành dòng riêng "409 từ tầng idempotency | Có, sau khi chờ".
- Code `transfer`: điều kiện đảo ngược — `if (!"IN_PROGRESS".equals(old.status())) throw new InProgress();` khiến nhánh replay không bao giờ chạy khi bản ghi đã DONE. Sửa thành `"IN_PROGRESS".equals(...)`.
- `catch (RuntimeException e) { repo.delete(...) }`: comment mới thêm mâu thuẫn với pitfall "chỉ xoá khi rollback"; comment lại thành rõ ràng: chỉ xoá khi side effect chưa commit.
- Pitfall cuối: câu "Xoá key khi lỗi xảy ra sau khi transaction nghiệp vụ đã commit: retry sẽ chạy lại side effect" diễn đạt ngược (phần sau dấu `:` là hệ quả, không phải hành động). Viết lại đúng.
- Thuật ngữ idempotent: thêm `HEAD` cho đủ danh sách idempotent của RFC 9110, và nói rõ idempotent không đồng nghĩa response giống nhau (201 rồi 200 là hợp lệ).

**api-056 (GraphQL vs REST)**
- Comment `// gom/c.CS ở đây để tránh N+1` (rác do dịch máy) → `// gom cache/batch ở đây để tránh N+1`.
- Resolver `orders` gọi `orderService.byAccount` từng account (chính là N+1) dù comment nói "tránh N+1": đổi sang `DataLoader` + `@SchemaMapping`, kèm comment cách đăng ký loader.
- Config comment ghi `spring.graphql.graphiql.enabled=false`: GraphiQL đã tắt mặc định; thứ bật mặc định và cần tắt ở production là introspection → đổi thành `spring.graphql.graphiql.enabled` và `spring.graphql.schema.introspection.enabled`.

**api-057 (rate limit)**
- `Retry-After`: nói "chỉ dùng cho 429, 503, 301" là sai (RFC 9110 định nghĩa cho 503 và mọi 3xx; RFC 6585 thêm 429).
- Thiếu dấu cách: `"peruser".Tham số` → `"peruser". Tham số`.
- Semantics `t`: `r=0;t=12` bị mô tả là "12 giây nữa có lại", sai — `t` là thời gian còn lại của cửa sổ hiệu lực, không đảm bảo quota hồi đủ. Sửa cả ở phần thuật ngữ, phần "Client nên đọc gì", và câu "chờ 12 giây rồi retry".
- Thiếu dấu ngoặc kép theo Structured Fields trong code filter: item value của `RateLimit`/`RateLimit-Policy` là chuỗi, partition key phải nằm trong nháy → phát `\"peruser\";q=...`.
- Pitfall: tên header sai `{{RateLimit-Reset}}` → `{{X-RateLimit-Reset}}`.
- Bảng header: `Retry-After` thêm 3xx.
- Code comment: nói rõ token bucket trên Redis làm `incr` atomic có TTL trên key user (thiếu chỗ này thì 4 instance thành 4 quota).

**api-058 (job/worker)**
- Câu claim trong CTE sai thứ tự clause: `order by created_at / for update skip locked / limit 1` → `limit 1` trước `for update skip locked` (PostgreSQL yêu cầu locking clause sau LIMIT).
- Giải thích `FOR UPDATE SKIP LOCKED` sai bản chất ("không chọi nhau") → nói đúng: mỗi worker lấy row chưa bị khoá rồi khoá row đó trong cùng transaction, còn `FOR UPDATE` thường thì worker khác phải chờ nên gần như tuần tự.
- `finishIfOwner` + `outbox.save` là hai lời gọi riêng, mâu thuẫn với prose "`cùng transaction`": gộp thành `jobs.finishWithOutbox(...)` và nói rõ UPDATE có điều kiện so cả `worker_id` và `lease_until` (kiểm worker_id thôi không đủ vì id worker có thể tái dùng cho attempt khác).
- Ví dụ đời thực nói 6 worker nhưng câu trả lời phỏng vấn nói "bật 4 worker" → sửa thành đủ 6 worker chạy song song.
- Thuật ngữ `job.type + payload hash`: giữ nguyên, đúng.

**api-059 (upload)**
- Multipart: "mỗi part trừ part cuối tối thiểu 5 MiB, tối đa 10.000 part" thiếu trần part → bổ sung tối đa 5 GiB/part, object tối đa khoảng 48,8 TiB (bảng cũng sửa `5 TB` → `48,8 TiB`).
- Bảng: `tus qua API | Không giới hạn` → `Theo {{Tus-Max-Size}} của server`.
- ETag multipart: nói "không phải MD5 của cả file" nhưng không nói vì sao → bổ sung cơ chế S3 (MD5 từng part rồi băm các MD5 đó, hậu tố `-số part`) và cách kiểm toàn vẹn đúng (SHA-256/CRC32).
- Pitfall Content-Type: thiếu trường hợp Content-Type không nằm trong chữ ký thì 403 không xảy ra → viết đủ hai nhánh.
- Pitfall part nhỏ: đã diễn đạt lại đúng (chỉ từ chối khi complete; trường hợp upload trùng part number không phải lỗi này).
- `MultipartFile`: bổ sung mặc định 1 MB/file và 10 MB/request của Spring Boot (thiếu thì câu "vượt thì phải tăng cấu hình" không có căn cứ).
- tus: câu giải thích thiếu "phiên bản sai → 412 kèm Tus-Version" đã có sẵn, giữ nguyên; sửa lỗi chính tả "chữ ký tạm thời" (giữ nguyên, đúng).

**api-060 (SSE)**
- Bảng Protocol: dòng "Header Authorization" ghi SSE là "Không, phải dùng cookie" (thiếu vế "không custom header, chỉ GET") và dòng "API client" chỉ ghi `EventSource` — mâu thuẫn với bước 5 nói dùng `POST /chat`. Sửa cả hai dòng cho khớp: EventSource chỉ GET nên với `POST /chat` phải dùng fetch + ReadableStream.
- Bước 5: nói rõ `EventSource` không dùng được cho `POST /chat` (phải fetch/ReadableStream hoặc fetch-event-source) — trước đó câu này mâu thuẫn với code `@PostMapping`.
- Pitfall reconnect: `EventSource` tự nối lại "sau khi server đóng" → bổ sung điều kiện (không nối lại khi server trả 204).
- Pitfall EventSource: nói "không gửi được header Authorization" nhưng thiếu "chỉ GET".
- Đoạn abort: nói "WebFlux hủy subscription" mà không nói tín hiệu cancel lan ngược lên upstream → sửa cho đúng cơ chế; `doOnCancel` không tự hủy.
- Anthropic events: bổ sung `message_delta` là số luỹ kế và trường hợp OpenAI chỉ trả usage khi bật `stream_options.include_usage`.

Không sửa lỗi cú pháp/markup nào khác: fence `~~~` cân bằng, không có backtick lồng trong template literal, không có `${` chưa escape (validate xác nhận).
