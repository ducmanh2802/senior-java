# T1454 — Thêm công ty product/công nghệ: Bosch Global Software (BGSV), Tiki, Wizeline, Trusting Social

Status: DONE
Agent: kilo
Owns: `js/data/companies.js`
After: T1453

Thêm 4 công ty: **Bosch Global Software Technologies Vietnam (BGSV)** (`type: 'bigtech'`), **Tiki** (`product`), **Wizeline Vietnam** (`service`), **Trusting Social** (`fintech`). Tập trung vị trí Java/Backend: quy trình, bài test (coding online, take-home, system design), câu hỏi hay gặp, mức độ tiếng Anh.

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
Đã thêm 4 công ty vào `js/data/companies.js`:
1. **bosch-global-software-vietnam** (BGSV) — type: bigtech, confidence: medium
   Nguồn: thu4n blog intern 2024 (quy trình HR tiếng Anh → Tech Lead), voz.vn review frontend 2024, VnExpress BGSW 15 năm 2025, Bosch Careers JD Junior Java 2025, ITviec 327 reviews 3.4/5, Bosch Vietnam official site.
2. **tiki** — type: product, confidence: medium
   Nguồn: Google Cloud Case Study Tiki (GKE 200+ services), Tuyendung.tiki.vn JD Senior Backend Java/Go 2024–2025, ITviec reviews 46 reviews 2024–2025, e27 hiring process article.
3. **wizeline-vietnam** — type: service, confidence: high
   Nguồn: Wizeline Official PDF Interviewing at Wizeline for SWE (pair programming, debugging, design, architecture), Dataford 192 reports 2026 (6 rounds, difficulty 5.1/10), PracHub guide 2026, Wizeline Blog AirAsia case study (Java, Go, Python, AWS, Kafka), Glassdoor HCMC 22 reviews 3.8/5 2025, Wizeline Blog 5 years Vietnam 2021.
4. **trusting-social** — type: fintech, confidence: medium
   Nguồn: Trusting Social Careers JD Backend Engineer (Go, Java) DOP 2025, JD Senior Backend Engineer AGI 2025, JD Full-Stack AI Engineer 2025, ITviec Director of Engineering 2025 (50-person team), AmbitionBox 5 reviews 3.5/5 2025, Clodura.AI Tech Stack 2025.

Validation: `node --check` OK, `node scripts/build-light-index.js` OK, `node scripts/validate.js` OK (errors in q-soft.js are pre-existing, unrelated).
Không commit. Chỉ sửa file được sở hữu.

Reviewed-by: verify-only (code/UI task)
