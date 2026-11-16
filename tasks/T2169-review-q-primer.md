# T2169 — Rà soát chất lượng 15 câu mới nhất trong q-primer.js

Status: DONE
Agent: kilo
Owns: `js/data/q-primer.js`
After: T1524

## Bối cảnh
Giai đoạn ưu tiên **chất lượng**: nội dung do model free viết cần kiểm tra chéo trước khi người học (dev Java ~4 năm, hổng nền tảng) dùng đi phỏng vấn thật.

## Việc cần làm
1. Tìm 15 câu mới nhất (`node scripts/qtool.js list js/data/q-primer.js` nếu là câu hỏi; file khác dùng grep -n theo id). KHÔNG đọc cả file một lần.
2. Kiểm tra từng mục: đúng kỹ thuật Java 17/21, Spring Boot 3, Hibernate 6; không bịa API/flag/số liệu; có **Tóm tắt:**, ### Trả lời mẫu khi phỏng vấn, > Senior tip:; câu nền tảng phải giải thích rất dễ hiểu.
3. **Sửa đúng** chỗ sai/thiếu; không chắc thì viết ở mức nguyên lý, bỏ chi tiết bịa. Không xoá mục, không đổi id.

## Luật
- Đọc AGENTS.md (schema; mục 5 markup: không backtick, không ký hiệu đô-la + ngoặc nhọn trong template literal).
- Ngoại lệ cho luật "chỉ thêm": task rà soát được sửa nội dung có sẵn. Đếm số mục trước/sau phải bằng nhau.
- Không commit.

## Nghiệm thu
`node --check js/data/q-primer.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` (bài học thêm `node scripts/test-lessons.js`, bug thêm `node scripts/test-bugs.js`) → OK.
Xong: `Status: DONE`. Notes: bảng `id | lỗi tìm thấy | đã sửa gì`.

## Notes

Đã rà soát 15 câu mới nhất `primer-019`…`primer-033`. Đếm trước/sau: **33 câu** (không thêm/xoá mục, không đổi id). Sửa bằng `node scripts/qtool.js apply` (khoá file + kiểm chứng id/fields).

| id | lỗi tìm thấy | đã sửa gì |
|---|---|---|
| primer-019 | Sơ đồ ASCII stack/heap dễ hiểu sai: mũi tên từ `u` chạy xuống trỏ vào ô `String@0x3C`, còn `arr` trỏ vào ký tự `^` vô nghĩa; ví dụ Java không khai báo `arr` | Vẽ lại sơ đồ 2 cột (stack: x/u/arr; heap: User@0x1A, int[]@0x2B, String@0x3C) + ghi chú; thêm `int[] arr = {1, 2, 3};` vào ví dụ |
| primer-020 | Câu "100 req/s * 30ms overhead = 3 giây CPU/mạng lãng phí mỗi giây" sai bản chất (handshake là chờ I/O, không phải CPU); câu giải thích 1 RTT rối | Sửa thành 3.000ms bắt tay/giây → cần ~3 kết nối song song; viết lại: client chờ SYN-ACK nên tốn ít nhất 1 RTT, ACK thứ 3 có thể kèm dữ liệu |
| primer-021 | `RestClient.get()` không phải API (RestClient là interface, lấy instance bằng `RestClient.create()`); câu DNS Kubernetes gộp chung ClusterIP và IP pod | Sửa thành `restClient.get()...retrieve().body(String.class)`; nói rõ service có ClusterIP ổn định, headless service mới trả IP pod |
| primer-022 | Cờ debug sai cú pháp `-Djavax.net.debug=ssl,handshake` (2 chỗ; JSSE dùng dấu hai chấm `ssl:handshake`); giải thích PKIX lẫn root/intermediate và ghi "chứng chỉ server hợp lệ" là sai; cách xử lý chỉ nói phía client | Sửa 2 chỗ thành `ssl:handshake`; nêu đúng: server gửi thiếu intermediate + image JRE cũ thiếu CA trong `cacerts`; cách xử lý thêm phương án yêu cầu gateway gửi đủ chuỗi trung gian |
| primer-023 | "Độ chọn lọc (selectivity)" dễ gây nhầm (tài liệu DB thường định nghĩa selectivity là tỉ lệ dòng khớp — càng thấp càng chọn lọc); sơ đồ B-tree ghi "đi nhánh giữa" trong khi 'O' nằm ở nhánh trái [N-Q] | Đổi thành "Độ phân biệt giá trị (cardinality)"; sửa "đi nhánh trái" |
| primer-024 | "UTF-8 biến độ dài" tối nghĩa; bảng ghi "cột tính byte" trong khi `varchar(255)` của Postgres/MySQL tính ký tự | Sửa thành "độ dài biến thiên (1–4 byte cho một ký tự)"; sửa thành: varchar(255) tính ký tự, còn HTTP header/message queue/row size tính byte |
| primer-025 | Không có lỗi kỹ thuật (O(1)/O(log n)/O(n)/O(n log n)/O(n^2), TimSort, bảng số liệu đều đúng) | Không sửa |
| primer-026 | Không có lỗi kỹ thuật (URI/URL/URN, fragment không gửi lên server, percent-encoding, `getRawQuery`) | Không sửa |
| primer-027 | Không có lỗi kỹ thuật (TCP/UDP, `setSoTimeout`, QUIC/HTTP/3, stream vs datagram) | Không sửa |
| primer-028 | Không có lỗi kỹ thuật (301/302 vs 307/308, `HttpClient.Redirect.NEVER`, idempotency) | Không sửa |
| primer-029 | Không có lỗi kỹ thuật (fd 0/1/2, `pipefail`, `2>&1`, exit code, 137 = SIGKILL) | Không sửa |
| primer-030 | Câu "Em cũng xác minh prefix…" bị bỏ ngoài đoạn trả lời mẫu và dính sát `> Senior tip:` | Gộp vào đoạn trả lời mẫu, thêm dòng trống trước Senior tip |
| primer-031 | Câu "Sau đó em nâng cấp…" bị bỏ ngoài đoạn trả lời mẫu | Gộp vào đoạn trả lời mẫu, thêm dòng trống trước Senior tip |
| primer-032 | `metrics.record("partner.call", elapsedMillis)` là API bịa (Micrometer không có) | Thay bằng `registry.timer("partner.call").record(elapsedNanos, java.util.concurrent.TimeUnit.NANOSECONDS)` |
| primer-033 | Không có lỗi kỹ thuật (NFC/NFD, U+1EBF, `java.text.Normalizer`, UTF-16 code unit) | Không sửa |

Nghiệm thu:
- `node --check js/data/q-primer.js` → OK.
- `node scripts/qtool.js check js/data/q-primer.js` → OK (không lỗi/cảnh báo của file này).
- `node scripts/build-light-index.js` và `node scripts/validate.js` **chưa thể OK**: `js/data/lessons-sql.js` (task T2167, đang TODO, ngoài quyền sở hữu) lỗi cú pháp `Unexpected token ']'` ở dòng 2218, làm script nạp nhóm lessons dừng; `path.js` (7 lỗi) và `index-light.js` (stale) cũng bắt nguồn từ các task khác. 15 câu primer không đổi id/topic/level nên không ảnh hưởng `index-light.js`.
- Không commit.
Reviewed-by: kilo (T2169R)
