# T351 — Viết lại cho người mới: JVM & GC (jvm-023 … jvm-025)

Status: DONE
Agent: opencode
Owns: `js/data/q-concurrency-jvm.js`
After: T350

Người dùng là dev Java khoảng 4 năm nhưng **chưa tiếp xúc nhiều công nghệ**, muốn nội dung **thật chi tiết, dễ hiểu**. Integrator cho phép **sửa đáp án đã có** (ngoại lệ của luật 5 trong AGENTS.md) với điều kiện:
- **giữ nguyên** `id`, `topic`, `level`, `q`;
- **không xoá ý kỹ thuật nào đang đúng**;
- chỉ bổ sung và làm rõ; ý nào đang sai thì sửa cho đúng.

Phạm vi: các câu có id từ **jvm-023 … jvm-025** trong `js/data/q-concurrency-jvm.js` (id nào không tồn tại thì bỏ qua). Không đụng câu ngoài phạm vi.

Với **mỗi** câu, sửa trường `a` theo khung dưới đây:
1. Giữ `**Tóm tắt:**` ở đầu; viết lại cho dễ hiểu nếu đang quá cô đọng.
2. Ngay sau đó thêm `### Hiểu nhanh`: 3–6 câu giải thích bằng ví dụ đời thường (ví dụ: Kafka như băng chuyền có đánh số, index như mục lục sách), cho người chưa từng dùng công nghệ đó.
3. Thêm `### Thuật ngữ`: danh sách `- **Thuật ngữ**: giải thích 1 câu` cho mọi khái niệm xuất hiện trong đáp án mà dev 4 năm chưa chắc biết (ví dụ ISR, page split, MVCC, sidecar, IAM role). Tối đa 8 mục.
4. Các mục cơ chế đã có: chia thành **các bước đánh số**, giải thích **vì sao** ở mỗi bước. Nếu chưa có minh hoạ thì thêm 1 sơ đồ ASCII (~~~text) hoặc ví dụ số liệu cụ thể.
5. Thêm `### Lỗi hay gặp` (nếu chưa có): 2–4 lỗi thực tế, mỗi lỗi gồm triệu chứng và cách tránh.
6. Thêm `### Trả lời miệng 1 phút` ngay trước `> Senior tip:`: một đoạn văn mẫu tự nhiên, ngôi thứ nhất, nói trong khoảng 60 giây, có cấu trúc "định nghĩa → cơ chế → trade-off → kinh nghiệm".
7. Giữ `> Senior tip:` ở cuối. `follow` giữ nguyên hoặc bổ sung tới tối đa 3 câu.

Độ dài mỗi đáp án sau khi sửa: khoảng 3000–7000 ký tự. Tuân thủ markup AGENTS.md mục 5: không backtick, không `${`, code dùng ~~~. Nội dung đúng kỹ thuật với Java 17/21, Spring Boot 3.x và phiên bản hiện hành của công nghệ liên quan.

Làm **từng câu một**: sửa xong câu nào thì chạy `node --check js/data/q-concurrency-jvm.js` ngay, để nếu bị ngắt giữa chừng thì không hỏng file. Xong hết thì chạy `node scripts/validate.js` → OK. Ghi Notes (danh sách id đã sửa), `Status: DONE`.

## Notes

Đã viết lại đầy đủ `a` của jvm-023, jvm-024, jvm-025 theo khung (giữ mọi ý cũ, thêm bảng G1 vs Gen ZGC, ví dụ số liệu benchmark, code escape/không escape, biểu đồ warm-up, quy trình điều tra từng bước). Làm rõ: HotSpot không có stack allocation, chỉ scalar replacement; Gen ZGC mặc định từ JDK 23; AOT cache JDK 25 lưu method profile. jvm-026/027 ngoài phạm vi, không đụng.

Reviewed-by: claude (subagent; validate OK)
