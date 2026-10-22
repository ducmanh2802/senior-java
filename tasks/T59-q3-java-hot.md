# T59 — Nội dung: Core Java hay gặp

Status: TODO
Agent: opencode
Owns: `js/data/q-java.js`
After: T46

> **Ghi theo lô nhỏ:** thêm **2 câu mỗi lần edit** (đáp án dài). Sau mỗi lô chạy `node --check <file>` và `node scripts/validate.js <file>`.


> **Đợt 3 — câu HAY GẶP NHẤT** khi phỏng vấn ngân hàng (Techcombank, VPBank, MB, BIDV, VIB…) và big tech VN (Shopee, Grab, MoMo, ZaloPay, VNG…). Nhiều câu ở mức cơ bản/kinh điển: đáp án phải giúp người học **trả lời gọn, đúng trọng tâm như ứng viên giỏi** (mở bằng câu trả lời 30 giây), sau đó mới đào sâu những gì interviewer Senior hay vặn tiếp. Ghi rõ các **câu trả lời sai phổ biến** của ứng viên.

Đọc kỹ `AGENTS.md` mục 4–6 (schema, markup, **chuẩn chất lượng**) trước khi viết.

## Mục tiêu
Ngân hàng câu hỏi đã có sẵn câu ở các topic dưới đây. **Chỉ THÊM câu mới vào cuối mảng**, không sửa/xoá câu cũ.
ID tiếp nối số lớn nhất đang có trong topic (ví dụ đang có `core-011` thì bắt đầu từ `core-012`).
**Đọc lướt câu hỏi đã có trong file trước** để không viết trùng ý.

### topic `core`: thêm 7 câu (đang có ~19 → mục tiêu ≥ 26)
- 4 tính chất OOP giải thích bằng ví dụ thật trong code nghiệp vụ (không đọc định nghĩa)
- Overloading vs overriding: quy tắc với static, private, final, kiểu trả về covariant, exception; static method hiding
- {{==}} vs {{equals}} với String literal, {{new String}}, Integer — dự đoán output
- {{return}} trong {{finally}}, exception trong {{finally}}, {{System.exit}} trong try — dự đoán output
- Thứ tự khởi tạo: static block, instance block, constructor khi có kế thừa — dự đoán output
- Stack vs heap: biến local, object, reference, String pool nằm ở đâu; StackOverflowError xảy ra khi nào
- Access modifier: {{protected}} và package-private hoạt động thật sự thế nào; vì sao field nên private

### topic `collections`: thêm 4 câu (đang có ~14 → mục tiêu ≥ 18)
- HashMap vs Hashtable vs {{Collections.synchronizedMap}} vs ConcurrentHashMap — câu hỏi kinh điển
- HashSet hoạt động thế nào bên trong; dùng object mutable làm key của HashMap/HashSet thì sao
- Xoá phần tử khi đang duyệt: for-each, Iterator.remove, {{removeIf}}
- {{Arrays.asList}} pitfalls: fixed-size, view của mảng, mảng primitive

### topic `modern`: thêm 3 câu (đang có ~14 → mục tiêu ≥ 17)
- Java 8 có gì mới và bạn dùng gì nhiều nhất — câu mở đầu kinh điển, trả lời sao cho ăn điểm
- {{map}} vs {{flatMap}}, {{reduce}} vs {{collect}}, {{peek}} — ví dụ và lỗi hay gặp
- Stream vs vòng for: hiệu năng, khả năng đọc, khi nào không nên dùng stream

## Yêu cầu chất lượng (quan trọng nhất)
- Mỗi đáp án **1500–4000 ký tự**: `**Tóm tắt:**` trả lời miệng 30 giây, rồi các mục `###` giải thích cơ chế **và vì sao**, ví dụ code ngắn có comment, bảng trade-off, pitfall production, kết bằng `> Senior tip:`.
- Câu hỏi theo kiểu phỏng vấn thật (tình huống, so sánh, "bạn sẽ làm gì"), không hỏi định nghĩa suông. Bối cảnh ưu tiên ngân hàng, fintech, e-commerce Việt Nam.
- Đúng kỹ thuật với Java 17/21, Spring Boot 3.x, Hibernate 6. **Không bịa API, flag hay số liệu**; không chắc thì viết ít lại nhưng đúng.
- `follow`: 2–3 câu hỏi đào sâu. Level xen kẽ: khoảng 25% mid, 55% senior, 20% lead.

## Nghiệm thu
`node scripts/validate.js` → OK và số câu mỗi topic đạt mục tiêu. Integrator sẽ fact-check sau.

## Notes
