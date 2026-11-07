# T893 — Ngách "cứu app viết bằng AI": audit, sửa, đóng gói dịch vụ (8 câu)

Status: DONE
Agent: kilo
Owns: `js/data/q-remote.js`
After: T892

Topic **remote** (file `js/data/q-remote.js`). Đọc câu mẫu `remote-001` và MỌI câu remote đã có (T882–T892), không trùng ý. id tiếp nối số lớn nhất. Không nêu tên người hay công ty thật.

Bối cảnh: khách (founder không chuyên kỹ thuật) tự dựng app bằng công cụ AI (trình tạo app bằng prompt, AI code editor), thường là Next.js/React + Supabase/Firebase + Vercel/Netlify, đôi khi Node/Python, gọi API LLM. Khi có người dùng thật thì app gặp lỗi, chậm, lộ dữ liệu, hoá đơn tăng vọt. Người đọc là **dev Java backend** muốn nhận loại việc này: phải **đọc được TypeScript/JavaScript ở mức sửa lỗi**, còn thế mạnh là database, bảo mật, hiệu năng, kiến trúc, vận hành production.

Thêm **8 câu** (2 `mid` + 4 `senior` + 2 `lead`), mỗi câu 3500–6000 ký tự, cấu trúc như các câu remote (`**Tóm tắt:**` → `###` → `### Checklist` → `> Senior tip:`), mẫu tiếng Anh trong ~~~text, code ngắn có comment (~~~sql / ~~~json / ~~~bash; TypeScript viết trong ~~~text), `follow` 3 câu:
1. **Các lỗi điển hình của app do AI viết** và cách phát hiện nhanh: khoá bí mật (API key, service-role key) lộ ở frontend hoặc trong repo; thiếu kiểm tra quyền phía server (IDOR: đổi id trên URL là xem được dữ liệu người khác); Row Level Security của Postgres/Supabase bị tắt hoặc policy sai; không giới hạn tần suất gọi (rate limit) API LLM nên bị lạm dụng, hoá đơn tăng vọt; truy vấn không có index, không phân trang, N+1; xử lý nặng ngay trong request; không có log, backup, migration, test.
2. **Audit "production readiness" trong 1–2 ngày**: quy trình từng bước (xin quyền truy cập an toàn, đọc kiến trúc, chạy kiểm tra bảo mật, đo hiệu năng, xem chi phí), công cụ (secret scanning, EXPLAIN ANALYZE, log của nền tảng), mẫu **báo cáo audit** (mức độ nghiêm trọng, bằng chứng, cách sửa, ước lượng giờ).
3. **Bảo mật ưu tiên số 1**: xoay vòng (rotate) khoá đã lộ, chuyển gọi API bí mật về server, bật RLS và viết policy theo user, kiểm tra quyền ở mọi endpoint, validate input; ví dụ policy SQL và cách test bằng hai tài khoản.
4. **Hiệu năng và chi phí**: thêm index đúng, phân trang, cache, đưa việc nặng sang background job, giới hạn và cache lời gọi LLM, đặt ngân sách và cảnh báo chi phí; đo trước và sau bằng số.
5. **Đóng gói dịch vụ và báo giá**: gói Audit giá cố định → các milestone sửa theo mức ưu tiên → retainer bảo trì hằng tháng; vì sao **không nhận "fix everything" giá cố định** khi chưa audit; khung giá tham khảo (ghi rõ là ví dụ giả định).
6. **Tìm khách**: từ khoá khách hay dùng khi đăng job ("fix my app", "MVP bugs", "make it production ready", "security audit", "app is slow", tên các công cụ AI tạo app), đọc job post để đoán mức hỗn loạn của code; proposal mẫu tiếng Anh cho job "my AI-built app breaks with real users".
7. **Làm việc với founder không chuyên**: giải thích rủi ro bằng ngôn ngữ kinh doanh (mất dữ liệu khách, bị phạt, hoá đơn), quản lý kỳ vọng ("secure" không phải trạng thái tuyệt đối), xử lý khi khách muốn tiếp tục tự sửa bằng AI song song (quy ước nhánh, review).
8. (lead) **Ranh giới và rủi ro nghề**: trách nhiệm pháp lý (điều khoản giới hạn trách nhiệm, không cam kết "không bao giờ bị hack"), giữ quyền truy cập và dữ liệu của khách an toàn, bàn giao (README, runbook, danh sách việc còn tồn), khi nào khuyên **viết lại** thay vì vá, và cách nói điều đó với khách.

**Kinh nghiệm thật đã kiểm tra nguồn (2026-11-07). Được dùng làm ví dụ, ghi rõ là trải nghiệm tự kể của một freelancer, không nêu tên người:**
- Một dev đổi title từ "Full-Stack Developer" kèm danh sách dài công nghệ (gần như không có lượt xem) sang một ngách cụ thể, viết profile theo vấn đề của khách (dashboard, admin panel, internal tool). Ba job đầu: sửa lỗi đăng nhập, dọn một API endpoint lỗi, làm một màn CRUD nội bộ. Proposal ngắn, nhắc đúng stack của khách, nói rõ việc làm trong ngày đầu tiên. (nguồn: dev.to, "From zero to my first 3 Upwork clients as a full-stack engineer")
- Một freelancer chưa có review nhận job script 25 USD, xin khách tăng lên 30 USD vì công sức đáng giá hơn. Giao tốt, giao tiếp rõ ràng (khách từng gặp freelancer tệ), rồi chủ động đề xuất việc liên quan tiếp theo. Từ đó thành chuỗi job 100 → 250 → ~600 USD, tổng khoảng 1.200 USD với cùng một khách. (nguồn: dev.to, "How I turned a $25 Upwork client into a $1000+ recurring customer")
- Nhiều freelancer gửi proposal sớm (trong khoảng 15 proposal đầu thay vì thứ 80) và trả lời tin nhắn phỏng vấn nhanh; scope creep là vấn đề lặp lại.
- Ngách sửa app viết bằng AI: đã có người làm thành nghề (404 Media đưa tin). Trên marketplace có nhiều gói dịch vụ "fix/secure vibe-coded app", nên phải có ngách hoặc track record. Một freelancer kể nhận 600 USD cho 2 ngày sửa một app AI. Các con số "80% app có lỗ hổng" hay doanh thu 120k chỉ là tự báo cáo hoặc marketing: nếu dùng phải ghi rõ như vậy.
- Freelancer Việt: nhiều người bắt đầu với rate thấp và mất khoảng 12–18 tháng để lên 30–40 USD/giờ (theo một bài hướng dẫn nghề nghiệp ở Việt Nam). Chỉ dùng làm tham khảo.

> **CẢNH BÁO GHI ĐÈ:** file này có thể đang chứa nội dung chưa commit của task khác. **Chỉ THÊM** bằng cách chèn object mới ngay trước dòng `);` cuối file, KHÔNG viết lại cả file, KHÔNG xoá/sửa object có sẵn. Trước khi đánh DONE: đếm số id trước và sau (`grep -c "id: '"`), số sau = số trước + số mục bạn thêm. Id luôn dùng nháy đơn.
> Đánh DONE bằng cách **sửa dòng `Status:` ở đầu file** (không thêm dòng Status mới ở cuối).
> Sơ đồ luồng nhiều bên (≥ 3 hệ thống): dùng khối `~~~seq` (cú pháp trong AGENTS.md mục 5).

## Quy tắc chung (bắt buộc)
- Đọc AGENTS.md mục 4, 5, 6. Người đọc: dev Java 4 năm, ít va chạm doanh nghiệp lớn, cần giải thích **từ gốc, rất chi tiết, có ví dụ đời thực**.
- **Chỉ THÊM** câu mới vào cuối mảng trong `js/data/q-remote.js`; id tiếp nối số lớn nhất hiện có của topic (kiểm tra trùng id trước khi ghi). Không sửa câu cũ.
- TRƯỚC khi viết, đọc hết câu cùng topic để **không trùng ý**.
- Mỗi đáp án: `**Tóm tắt:**` → các mục ### (bối cảnh thật, cách làm từng bước, ví dụ số liệu/artifact, bảng trade-off, pitfall) → `> Senior tip:`. 2500–4500 ký tự. `follow` 2–3 câu.
- Không backtick, không `${` trong template literal. Không chạy file .js trực tiếp, luôn dùng `node`. Đúng kỹ thuật với Java 17/21, Spring Boot 3.x; không bịa API/flag; không chắc thì bỏ.

## Nghiệm thu
`node --check js/data/q-remote.js`, `node scripts/build-light-index.js` rồi `node scripts/validate.js` → OK. KHÔNG commit. Ghi Status: DONE + danh sách id mới vào Notes.

## Notes
Reviewed-by: kilo (T893R)
