# T1411 — Nâng cấp bài học spring: lesson-spring-001, lesson-spring-002

Status: DONE
Agent: kilo
Owns: `js/data/lessons-spring.js`

Nâng cấp 2 bài học dưới đây cho đủ chuẩn AGENTS.md mục 12 (đọc bài mẫu `lesson-collections-001` trong `js/data/lessons-collections.js` trước). Người học là dev Java ~4 năm, hổng nền tảng, tự học không có ai giảng.

- `lesson-spring-001` "IoC và DI: container quản lý object" — body 3540 ký tự, 2 câu check
- `lesson-spring-002` "AOP và proxy: lời gọi nội bộ bỏ qua advice" — body 3440 ký tự, 2 câu check

Với MỖI bài:
1. **body** < 4000 ký tự → bổ sung để đạt 4500–6500 ký tự: thêm mục `### Cơ chế từng bước` (đi từng bước, VÌ SAO lại như vậy), một ví dụ `~~~java` ngắn (≤ 30 dòng, có comment) hoặc bảng so sánh, mục `### Lỗi hay gặp trên production` (2–4 lỗi cụ thể, triệu chứng → nguyên nhân → cách sửa). Không trùng với phần đã có.
2. Thiếu `### Liên hệ phỏng vấn` → thêm ở CUỐI body: 2–3 câu hỏi phỏng vấn thường gặp về chủ đề này, mỗi câu kèm ý trả lời ngắn.
3. `check` < 3 câu → thêm cho đủ 3–4 câu: `{ q, options: [4 phương án không trùng], answer: 0..3, explain }`; explain nói vì sao đáp án đúng và vì sao từng phương án sai là sai; rải đáp án đúng ở các vị trí khác nhau.
4. Tiếng Việt **có dấu đầy đủ**; thuật ngữ giữ tiếng Anh. Đúng kỹ thuật với Java 17/21, Spring Boot 3.x, Hibernate 6.

Luật:
- **Chỉ thêm**: KHÔNG sửa `exercises` (starter/tests/reference), không xoá nội dung cũ, không đụng bài khác.
- Sửa bằng công cụ edit theo đoạn nhỏ; **TUYỆT ĐỐI KHÔNG ghi lại toàn bộ file**, không sửa file khác (có cơ chế tự khôi phục file không thuộc task).
- Markup: `{{code}}` (không lồng ngoặc nhọn), `~~~java`. KHÔNG dùng backtick và `${` trong template literal.

Nghiệm thu: `node scripts/build-light-index.js` rồi `node scripts/validate.js` → OK. KHÔNG commit. Ghi `Status: DONE` + Notes ngắn.

## Notes
- `lesson-spring-001` (IoC/DI): body 3573 → 6963 ký tự. Thêm `### Cơ chế từng bước` (6 bước tạo/lắp bean, giải thích metadata/resolve/singleton, ví dụ DI bằng tay cho unit test), mở rộng `### Lỗi hay gặp trên production` (4 lỗi: NoUniqueBeanDefinitionException, vòng phụ thuộc constructor, singleton giữ state request rò dữ liệu, component scan thiếu package — mỗi lỗi có triệu chứng→nguyên nhân→cách sửa). Viết lại `### Liên hệ phỏng vấn` thành 3 Q&A. check 2→4 câu (đáp án ở vị trí 0,1,2,3). Không sửa exercises.
- `lesson-spring-002` (AOP/proxy): body 3470 → 7093 ký tự. Thêm `### Cơ chế từng bước` (4 bước proxy→caller→self-invocation, ví dụ @Transactional bị bỏ qua + cách tách bean, bảng so sánh 4 cách xử lý self-invocation). Mở rộng `### Lỗi hay gặp trên production` (4 lỗi: `new` bỏ qua Spring, private/final không bị proxy chặn, @Async self-invocation chạy đồng bộ, gọi AOP quá sớm trong lifecycle). Viết lại `### Liên hệ phỏng vấn` thành 3 Q&A. check 2→4 câu (đáp án 1,1,0,1 — rải vị trí). Không sửa exercises.
- Giải thích thuật ngữ lần đầu: dependency injection, metadata/bean definition, component scan, resolve dependency, proxy, ApplicationContext, NoUniqueBeanDefinitionException, BeanCurrentlyInCreationException. Tiếng Việt có dấu; dùng `{{ }}`/`~~~java`, không backtick/`${`. Java 17/21, Spring Boot 3.x, CGLIB mặc định.
- `node --check js/data/lessons-spring.js` OK. `node scripts/build-light-index.js` OK. `node scripts/validate.js` → OK (chỉ cảnh báo cũ `path.js: lesson-design-006,007` không thuộc task).

Reviewed-by: kilo (T1411R)
