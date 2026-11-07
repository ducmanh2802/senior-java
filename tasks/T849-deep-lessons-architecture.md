# T849 — 2 bài senior: consistent hashing và fencing token

Status: DONE
Agent: kilo
Owns: `js/data/lessons-architecture.js`

Track **architecture**: đọc hết file để không trùng. Đây là **bài học đào sâu cấp senior**: bài tập Java thuần **tự mô phỏng cơ chế bên trong** (tự viết phiên bản thu nhỏ) để người học hiểu vì sao hệ thống thật hoạt động như vậy. Thêm 2 bài level `senior`, id và order tiếp nối số lớn nhất hiện có, mỗi bài 1–2 bài tập tự chấm (≥ 5 case, có case biên). Body giải thích cơ chế thật trước (kèm tên class/cấu hình thật của JDK/framework), rồi nói rõ bản mô phỏng đơn giản hoá ở đâu. Nếu một chủ đề đã có thì chọn chủ đề sâu khác cùng track và ghi lý do vào Notes.

1. **Consistent hashing với virtual node**: vòng băm, thêm/bớt node chỉ di chuyển ~1/N key. Bài tập: `HashRing` (TreeMap, hàm băm xác định), test phân bố và tỉ lệ key di chuyển khi thêm node.
2. **Distributed lock + fencing token**: vì sao lock có TTL vẫn không an toàn khi GC pause, storage từ chối token cũ. Bài tập: `LockService` cấp token tăng dần, `Storage.write(token, data)` từ chối token nhỏ hơn; kịch bản client A bị "pause" được dựng xác định.

> **CẢNH BÁO GHI ĐÈ:** file này có thể đang chứa nội dung chưa commit của task khác. **Chỉ THÊM** bằng cách chèn object mới ngay trước dòng `);` cuối file, KHÔNG viết lại cả file, KHÔNG xoá/sửa object có sẵn. Trước khi đánh DONE: đếm số id trước và sau (`grep -c "id: '"`), số sau = số trước + số mục bạn thêm. Id luôn dùng nháy đơn.
> Đánh DONE bằng cách **sửa dòng `Status:` ở đầu file** (không thêm dòng Status mới ở cuối).
> Sơ đồ luồng nhiều bên (≥ 3 hệ thống): dùng khối `~~~seq` (cú pháp trong AGENTS.md mục 5).

## Quy tắc chung (bắt buộc)
- Đọc AGENTS.md mục 12 và bài mẫu `lesson-collections-001` (js/data/lessons-collections.js) trước. Đọc các bài đã có trong `js/data/lessons-architecture.js` để không trùng.
- **Chỉ THÊM** bài vào cuối mảng; id và `order` tiếp nối số lớn nhất hiện có. Không sửa bài cũ.
- Body ≥ 2500 ký tự, giải thích từ gốc cho người hổng nền tảng, ví dụ ~~~java ngắn có comment, bảng, > lưu ý; kết bằng "### Liên hệ phỏng vấn".
- Bài tập: chỉ JDK chuẩn, biên dịch với **Java 17**, không class public ngoài Main, test deterministic (không sleep/thời gian thực), ≥ 4 case. Starter biên dịch được và có `throw new UnsupportedOperationException("TODO")`.
- Không backtick, không `${` trong template literal; dấu \ trong code Java phải viết \\. Không chạy file .js trực tiếp, luôn dùng `node`.

## Nghiệm thu
`node scripts/test-lessons.js` (reference pass hết, starter biên dịch được và không pass hết), `node scripts/build-light-index.js`, `node scripts/validate.js` → OK. KHÔNG commit. Ghi Status: DONE + id mới vào Notes (kèm đề xuất thêm id vào js/data/path.js cho integrator).

## Notes
- Đã thêm 2 bài senior (id tiếp nối order 8 → 9,10), chỉ chèn trước `);` cuối `js/data/lessons-architecture.js`. Trước: 8 id `lesson-architecture-*`; sau: 10 id (kiểm tra `grep -c "id: 'lesson-architecture"`).
- `lesson-architecture-009` (order 9, senior): Consistent hashing + virtual node. Body giải thích mod N, vòng băm, tỉ lệ di chuyển ~1/N, vnode; cơ chế thật: Amazon Dynamo, Apache Cassandra (num_tokens/Murmur3Partitioner), Riak, Akka ConsistentHashingRouter, Ketama; phân biệt Redis Cluster 16384 hash slot. Mô phỏng: `HashRing` (TreeMap ceilingEntry/firstEntry, hash xác định `hashCode() & 0x7fffffff % ringSize`), 1 bài tập (≥10 case + phân bố + tỉ lệ di chuyển khi thêm node, xóa node, wrap vòng, biên), 3 câu check. Test balance dùng 500 vnode + biên rộng để deterministic với `String.hashCode()`.
- `lesson-architecture-010` (order 10, senior): Distributed lock + GC pause + fencing token. Body giải thích TTL/lease, kịch bản GC pause (~~~seq~~~, ≥3 actor), fencing token tăng đơn điệu kiểm tra ở storage; cơ chế thật: Redis SET NX PX/Redlock, ZooKeeper ephemeral sequential node, etcd Lease/KeepAlive, Redisson/Curator; trích dẫn logic Kleppmann. Mô phỏng: `LockService.acquire/simulateExpiry` + `Storage.write(token)` từ chối token < maxSeen, 1 bài tập (≥15 check, kịch bản A pause→B ghi→A bị chặn, nhiều vòng, resource độc lập, biên), 3 câu check.
- Không backtick, không `${`, deterministic (không sleep/random). `node --check js/data/lessons-architecture.js` OK. `node scripts/test-lessons.js` → 201/201 (178 bài, 200 cache). `node scripts/build-light-index.js` OK. `node scripts/validate.js` → OK (chỉ warnings cũ + path.js). Đề xuất integrator thêm vào `js/data/path.js`: `lesson-architecture-009`, `lesson-architecture-010`.
Reviewed-by: kilo (T849R)
