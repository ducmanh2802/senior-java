# T1407 — Nâng cấp bài học devops: lesson-devops-008, lesson-devops-009

Status: DONE
Agent: kilo
Owns: `js/data/lessons-devops.js`

Nâng cấp 2 bài học dưới đây cho đủ chuẩn AGENTS.md mục 12 (đọc bài mẫu `lesson-collections-001` trong `js/data/lessons-collections.js` trước). Người học là dev Java ~4 năm, hổng nền tảng, tự học không có ai giảng.

- `lesson-devops-008` "Rolling update trên Kubernetes: maxSurge, maxUnavailable và probes quyết định traffic" — body 4678 ký tự, 2 câu check
- `lesson-devops-009` "Prometheus metrics & SLO: counter, gauge, histogram và error budget" — body 4242 ký tự, 2 câu check

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

- `lesson-devops-008`: thay đoạn padding rác từ lần chạy trước bị gián đoạn (dòng `Thêm giải thích chi tiết: ...`) bằng `### Cơ chế từng bước` (bước 1-4, bảng ASCII maxSurge/maxUnavailable, làm tròn phần trăm), `### Ví dụ minh hoạ` (bảng so sánh + mẫu `~~~java` tính minReady/maxTotal), `### Lỗi hay gặp trên production` (4 lỗi: 502 do thiếu preStop, liveness include CSDL, thiếu startupProbe, ENTRYPOINT shell nuốt SIGTERM), mở rộng `### Liên hệ phỏng vấn` ở cuối body với 3 câu hỏi và trả lời ngắn. Thêm 1 câu check (đáp án vị trí 0). Body ≈ 6800 ký tự, check = 3 câu.
- `lesson-devops-009`: thay đoạn padding rác bằng `### Cơ chế từng bước` (pull Prometheus, scrape_interval, rate(), histogram_quantile), bảng 3 loại metric, `### Ví dụ minh hoạ` (mẫu `~~~java` counter/gauge/histogram thuần Java), `### Lỗi hay gặp trên production` (4 lỗi: counter cho gauge, bucket thưa, thiếu nhãn version, cardinality cao), `### Liên hệ phỏng vấn` 3 câu hỏi với trả lời ngắn. Thêm 1 câu check (đáp án vị trí 2). Body ≈ 6400 ký tự, check = 3 câu.
- `node --check js/data/lessons-devops.js` OK; `node scripts/validate.js lessons-devops.js` không báo lỗi cho file này.
- `node scripts/validate.js` toàn repo **không đạt OK** do lỗi có sẵn trước trong file KHÔNG thuộc task này: `lessons-jpa.js` (lỗi cú pháp template literal) và `lessons-security.js` (lỗi cú pháp) làm `build-light-index.js` bị Crash, dẫn đến lỗi đè dõi trong `projects.js`, `path.js` và `index-light.js` cũ. Theo quy tắc 3 AGENTS.md, không được sửa file ngoài `lessons-devops.js` — cần equipe integrator sửa hai file nêu trên rồi chạy lại `build-light-index.js` + `validate.js` để toàn repo OK.
