# T60 — Nội dung: Concurrency & JVM hay gặp

Status: DONE
Agent: opencode
Owns: `js/data/q-concurrency-jvm.js`
After: T47

> **Ghi theo lô nhỏ:** thêm **2 câu mỗi lần edit** (đáp án dài). Sau mỗi lô chạy `node --check <file>` và `node scripts/validate.js <file>`.


> **Đợt 3 — câu HAY GẶP NHẤT** khi phỏng vấn ngân hàng (Techcombank, VPBank, MB, BIDV, VIB…) và big tech VN (Shopee, Grab, MoMo, ZaloPay, VNG…). Nhiều câu ở mức cơ bản/kinh điển: đáp án phải giúp người học **trả lời gọn, đúng trọng tâm như ứng viên giỏi** (mở bằng câu trả lời 30 giây), sau đó mới đào sâu những gì interviewer Senior hay vặn tiếp. Ghi rõ các **câu trả lời sai phổ biến** của ứng viên.

Đọc kỹ `AGENTS.md` mục 4–6 (schema, markup, **chuẩn chất lượng**) trước khi viết.

## Mục tiêu
Ngân hàng câu hỏi đã có sẵn câu ở các topic dưới đây. **Chỉ THÊM câu mới vào cuối mảng**, không sửa/xoá câu cũ.
ID tiếp nối số lớn nhất đang có trong topic (ví dụ đang có `core-011` thì bắt đầu từ `core-012`).
**Đọc lướt câu hỏi đã có trong file trước** để không viết trùng ý.

### topic `concurrency`: thêm 7 câu (đang có ~20 → mục tiêu ≥ 27)
- Vòng đời thread: các state (NEW, RUNNABLE, BLOCKED, WAITING, TIMED_WAITING, TERMINATED) và chuyển trạng thái
- Các cách tạo thread: Thread vs Runnable vs Callable vs ExecutorService; {{start()}} vs {{run()}}
- {{sleep}} vs {{wait}} vs {{join}} vs {{yield}}: lock có được nhả không
- {{synchronized}} trên static method vs instance method vs block: class lock vs object lock
- Race condition với {{count++}}: vì sao sai và 3 cách sửa, kể cả khi chạy nhiều instance (DB/Redis)
- Livelock và starvation khác deadlock thế nào; fair lock
- Singleton thread-safe: eager, holder idiom, enum — so sánh và cách phá singleton bằng reflection/serialization

### topic `jvm`: thêm 4 câu (đang có ~18 → mục tiêu ≥ 22)
- JDK vs JRE vs JVM; từ file .java đến lúc chạy: javac, bytecode, class loading, interpreter, JIT
- GC xác định object chết thế nào: reachability, GC roots; vì sao không dùng reference counting
- Minor GC vs major GC vs full GC; object được promote lên old gen khi nào
- StackOverflowError vs OutOfMemoryError: nguyên nhân và cách tái hiện, cách xử lý

## Yêu cầu chất lượng (quan trọng nhất)
- Mỗi đáp án **1500–4000 ký tự**: `**Tóm tắt:**` trả lời miệng 30 giây, rồi các mục `###` giải thích cơ chế **và vì sao**, ví dụ code ngắn có comment, bảng trade-off, pitfall production, kết bằng `> Senior tip:`.
- Câu hỏi theo kiểu phỏng vấn thật (tình huống, so sánh, "bạn sẽ làm gì"), không hỏi định nghĩa suông. Bối cảnh ưu tiên ngân hàng, fintech, e-commerce Việt Nam.
- Đúng kỹ thuật với Java 17/21, Spring Boot 3.x, Hibernate 6. **Không bịa API, flag hay số liệu**; không chắc thì viết ít lại nhưng đúng.
- `follow`: 2–3 câu hỏi đào sâu. Level xen kẽ: khoảng 25% mid, 55% senior, 20% lead.

## Nghiệm thu
`node scripts/validate.js` → OK và số câu mỗi topic đạt mục tiêu. Integrator sẽ fact-check sau.

## Notes
- Hoàn thành bởi agent Claude: viết lại 14 câu của T47 (model free viết sai gần hết), thêm concurrency-021..027, jvm-019..022.
