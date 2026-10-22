# T61 — Nội dung: Spring, JPA, DB hay gặp

Status: DONE
Agent: opencode
Owns: `js/data/q-spring-data.js`
After: T48

> **Ghi theo lô nhỏ:** thêm **2 câu mỗi lần edit** (đáp án dài). Sau mỗi lô chạy `node --check <file>` và `node scripts/validate.js <file>`.


> **Đợt 3 — câu HAY GẶP NHẤT** khi phỏng vấn ngân hàng (Techcombank, VPBank, MB, BIDV, VIB…) và big tech VN (Shopee, Grab, MoMo, ZaloPay, VNG…). Nhiều câu ở mức cơ bản/kinh điển: đáp án phải giúp người học **trả lời gọn, đúng trọng tâm như ứng viên giỏi** (mở bằng câu trả lời 30 giây), sau đó mới đào sâu những gì interviewer Senior hay vặn tiếp. Ghi rõ các **câu trả lời sai phổ biến** của ứng viên.

Đọc kỹ `AGENTS.md` mục 4–6 (schema, markup, **chuẩn chất lượng**) trước khi viết.

## Mục tiêu
Ngân hàng câu hỏi đã có sẵn câu ở các topic dưới đây. **Chỉ THÊM câu mới vào cuối mảng**, không sửa/xoá câu cũ.
ID tiếp nối số lớn nhất đang có trong topic (ví dụ đang có `core-011` thì bắt đầu từ `core-012`).
**Đọc lướt câu hỏi đã có trong file trước** để không viết trùng ý.

### topic `spring`: thêm 6 câu (đang có ~21 → mục tiêu ≥ 27)
- {{@Component}} vs {{@Service}} vs {{@Repository}} vs {{@Controller}}; {{@Repository}} thêm exception translation
- {{@Bean}} vs {{@Component}}; {{@Configuration}} proxyBeanMethods
- {{@Autowired}} resolve thế nào khi có nhiều bean cùng kiểu: {{@Qualifier}}, {{@Primary}}, inject List/Map
- {{@SpringBootApplication}} gồm gì; Spring Boot starter là gì, khác Spring thuần ở đâu
- {{@Transactional}}: rollback mặc định chỉ với unchecked exception, {{rollbackFor}}, try-catch nuốt exception
- {{@RestController}} vs {{@Controller}}; {{ResponseEntity}}; trả về JSON được serialize thế nào (Jackson)

### topic `jpa`: thêm 4 câu (đang có ~17 → mục tiêu ≥ 21)
- JPA vs Hibernate vs Spring Data JPA: mối quan hệ, ai làm gì
- {{save}} vs {{saveAndFlush}} vs {{persist}} vs {{merge}}; {{findById}} vs {{getReferenceById}}
- CascadeType các loại và bẫy (REMOVE trên ManyToMany); FetchType mặc định của từng loại quan hệ
- Derived query method, {{@Query}} JPQL vs native, phân trang với {{Pageable}} và câu count

### topic `db`: thêm 6 câu (đang có ~19 → mục tiêu ≥ 25)
- ACID giải thích bằng ví dụ chuyển tiền; mỗi chữ cái được DB đảm bảo bằng cơ chế gì
- Chuẩn hoá 1NF–3NF và khi nào nên denormalize
- Clustered vs non-clustered index (InnoDB, Oracle, PostgreSQL khác nhau ra sao)
- Khi nào index không được dùng: hàm trên cột, LIKE bắt đầu bằng %, OR, ép kiểu ngầm, selectivity thấp
- Redis: các cấu trúc dữ liệu và use case (cache, rate limit, leaderboard, lock, session)
- Redis vì sao nhanh dù single-thread; persistence RDB vs AOF; Redis có mất dữ liệu không

## Yêu cầu chất lượng (quan trọng nhất)
- Mỗi đáp án **1500–4000 ký tự**: `**Tóm tắt:**` trả lời miệng 30 giây, rồi các mục `###` giải thích cơ chế **và vì sao**, ví dụ code ngắn có comment, bảng trade-off, pitfall production, kết bằng `> Senior tip:`.
- Câu hỏi theo kiểu phỏng vấn thật (tình huống, so sánh, "bạn sẽ làm gì"), không hỏi định nghĩa suông. Bối cảnh ưu tiên ngân hàng, fintech, e-commerce Việt Nam.
- Đúng kỹ thuật với Java 17/21, Spring Boot 3.x, Hibernate 6. **Không bịa API, flag hay số liệu**; không chắc thì viết ít lại nhưng đúng.
- `follow`: 2–3 câu hỏi đào sâu. Level xen kẽ: khoảng 25% mid, 55% senior, 20% lead.

## Nghiệm thu
`node scripts/validate.js` → OK và số câu mỗi topic đạt mục tiêu. Integrator sẽ fact-check sau.

## Notes
Đã thêm 16 câu hỏi mới (spring: 6, jpa: 4, db: 6) đạt mục tiêu: spring 27/≥27, jpa 21/≥21, db 25/≥25. Tất cả câu hỏi tuân thủ schema, markup, chuẩn chất lượng theo AGENTS.md. Validate pass.
