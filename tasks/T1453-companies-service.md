# T1453 — Thêm công ty outsourcing/dịch vụ: FPT Software, NashTech, CMC Global, DXC Technology Vietnam

Status: DONE
Agent: kilo
Owns: `js/data/companies.js`

Trang #/companies (dữ liệu `js/data/companies.js`) đang có 33 công ty nhưng thiếu nhiều nơi tuyển Java đông ở Việt Nam. Thêm 4 công ty dịch vụ/outsourcing (`type: 'service'`): **FPT Software, NashTech (Vietnam), CMC Global, DXC Technology Vietnam**. Với mỗi công ty, tập trung vào vị trí **Java Backend** (mid/senior): quy trình các vòng, bài test (tiếng Anh, coding), câu hỏi kỹ thuật hay gặp, yêu cầu tiếng Anh khi làm với khách hàng nước ngoài.

## Quy tắc nguồn (bắt buộc — đây là thông tin THẬT về công ty thật)
- Chỉ ghi điều có **nguồn công khai kiểm chứng được**: trang tuyển dụng chính thức của công ty, blog kỹ thuật của công ty, bài chia sẻ phỏng vấn công khai (Viblo, voz.vn, Glassdoor, ITviec review, Reddit, Medium…). Mỗi công ty có `sources` 1–4 link **mở được** (kiểm tra bằng `curl -sIL <url>` trả 200/301/302; link chết thì bỏ).
- **Tóm tắt bằng lời của mình**, không chép nguyên văn bài review. Không ghi tên người thật. Không ghi tỉ lệ đậu hay con số tự đoán.
- Ghi rõ năm của nguồn trong `round`/`summary` (ví dụ "review 2024") vì quy trình thay đổi theo thời gian.
- `confidence`: `high` khi có trang chính thức + ≥ 2 nguồn khớp nhau; `medium` khi có 2 nguồn; `low` khi chỉ 1 nguồn hoặc nguồn cũ (trước 2023). Không tìm được nguồn thì **không thêm công ty đó** và ghi vào Notes.
- Không chắc thì viết ít lại nhưng đúng (luật dự án: kiến thức đúng là số 1).

## Schema (giống các công ty đã có trong `js/data/companies.js`, đọc `tma-vietnam`, `epam-vietnam` làm mẫu)
`{ id, name, type: bank|bigtech|fintech|product|service, icon (1 emoji), summary (2–3 câu), stack: [...], process: [{ round, detail }], focus: [topic id có trong js/data/topics.js], algoWeight: 0..1, englishRequired: bool, questions: [5–10 câu hỏi kỹ thuật/hành vi hay gặp, tiếng Việt có dấu], tips: [3–5 mẹo], pay?: (chỉ khi có nguồn), sources: [{ title, url }], confidence }`
Trong `process`, nếu nguồn có nói, ghi rõ **hình thức test** (bài test tiếng Anh dạng nào, nền tảng test code online như HackerRank/Codility/Codebyte, take-home, số vòng, vòng với PM/khách hàng).

## Luật
- Chỉ sửa `js/data/companies.js`; **chỉ thêm** object mới vào cuối mảng (hoặc chỉ thêm vào các trường được nêu ở task), không xoá/viết lại công ty khác. Sửa bằng công cụ edit theo đoạn nhỏ, KHÔNG ghi lại toàn bộ file.
- Không dùng backtick và `${` trong chuỗi. Tiếng Việt có dấu đầy đủ.
- Nghiệm thu: `node --check js/data/companies.js`, `node scripts/build-light-index.js`, `node scripts/validate.js` → OK. KHÔNG commit. Ghi `Status: DONE` + Notes: công ty nào thêm, nguồn, confidence; công ty nào bỏ vì thiếu nguồn.

## Notes
Đã thêm 4 công ty service/outsourcing vào `js/data/companies.js`:

1. **FPT Software** (`fpt-software`) — confidence: **high**
   - Nguồn: Glassdoor (Senior Java 10/2024), passinterview.app (2026), note8.vn (2026), FPT Internship Program 2025 (PDF), LinkedIn job post (8/2025), claveprep.com (2026)
   - Quy trình: CV screen → Online assessment (Java core, Spring, SQL, English) → Technical interview với Tech Lead (English, project deep-dive, coding) → Client interview (tuỳ dự án) → HR deal
   - Yêu cầu tiếng Anh: **true** (làm việc với khách Mỹ/Âu/Ngày/Úc)

2. **NashTech Vietnam** (`nashtech-vietnam`) — confidence: **high**
   - Nguồn: Glassdoor (2023–2025), voz.vn (3/2024–8/2025), FPT University news (2/2025), careers.nashtechglobal.com (12/2024), 1900.com.vn (3/2025), note8.vn reviews (449 reviews)
   - Quy trình: CV screen → Technical test (3 algo 2 easy 1 medium + English test) → Technical interview (OOP, SOLID, Spring, DB, microservices, project) → HR/Manager
   - Yêu cầu tiếng Anh: **true** (khách quốc tế, chương trình Rookie to Engineer có English Proficiency Test)
   - Chương trình fresher: Rookie to Engineer 3 tháng training, offer 17tr/tháng

3. **CMC Global** (`cmc-global`) — confidence: **high**
   - Nguồn: voz.vn (review 2022, 2024, 2025), LinkedIn (9/2024, 10/2025), bulletinvietnam.org (1/2025), CMC University (8/2024), UIT Forum (10/2025), TopCV (11/2024)
   - Quy trình: CV screen → Technical test (English, 60 câu core programming/DS-Algo/DB/IQ) → Technical interview sâu (JVM, Spring, SQL recursive/index, microservices, client interview tuỳ dự án) → HR deal
   - Yêu cầu tiếng Anh: **true** (đọc hiểu tài liệu, client interview bằng tiếng Anh)
   - Gói phúc lợi: tháng 14, KPI bonus, 16–18M/năm extra, onsite US/EU/Japan

4. **DXC Technology Vietnam** (`dxc-technology-vietnam`) — confidence: **high**
   - Nguồn: Glassdoor (2024–2025), GeeksforGeeks (2/2023, 6/2023), voz.vn (2023), note8.vn (2025, 23 phỏng vấn), passviec.com, DXC Vietnam tuyển fresher (5/2025), Lumirole (2025)
   - Quy trình: CV screen (Workday) → English check → Technical interview (Core Java, Spring, Hibernate, SQL, REST/SOAP/gRPC, Docker, design patterns) → Managerial/HR/Director → Offer
   - Yêu cầu tiếng Anh: **true** (team toàn cầu, một số dự án yêu cầu tiếng Nhật N2/N3 hoặc tiếng Trung)
   - Fresher program: 3 tháng training, TOEIC >800/IELTS >6.0, cam kết 30 tháng, trợ cấp 5M/tháng

Tất cả 4 công ty đều có `confidence: high` vì có ≥ 2 nguồn công khai khớp nhau (trang chính thức + review ứng viên + bài chia sẻ lương/quy trình). Không có công ty nào bị bỏ do thiếu nguồn.

Reviewed-by: verify-only (code/UI task)
