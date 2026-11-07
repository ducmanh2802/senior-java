# T648 — Cập nhật 16 công ty có sẵn + thêm 6 công ty mới từ review phỏng vấn voz 2023–2026

Status: DONE
Agent: kilo
Owns: `js/data/companies.js`

Nguồn dữ liệu: **`docs/research/voz-interview-reviews.md`** (118 bài review phỏng vấn dài trích từ thread voz "Event box CNTT 2023 — chia sẻ kinh nghiệm phỏng vấn", 2023–2026, mỗi bài có URL). Đọc HẾT file.

Việc 1 — cập nhật công ty đã có (`js/data/companies.js`, 16 công ty): với mỗi công ty có review trong digest (ví dụ NAB/NICV, Naver, Axon, Rakuten, Grab, EPAM, Shopee…), **thêm** vòng/câu hỏi/tip mới vào `process`, `questions`, `tips` và URL vào `sources`; nếu dữ liệu mới hơn mâu thuẫn dữ liệu cũ, ghi cả hai kèm năm. Nâng `confidence` lên 'medium' nếu nay có ≥ 2 review chi tiết. Không xoá nội dung cũ.

Việc 2 — thêm **6 công ty mới** có review backend/Java chi tiết nhất trong digest (ưu tiên: Thoughtworks, SAP, Samsung R&D Vietnam, Employment Hero, Optimizely, Ninja Van; nếu digest không đủ chi tiết thì thay bằng công ty khác có review backend tốt). id dạng kebab-case không trùng.

## Schema công ty (giống các mục đang có, đọc kỹ `techcombank` làm mẫu)
`{ id, name, type: 'bank'|'fintech'|'bigtech'|'product'|'service', icon, summary, stack: [], process: [{round, detail}], focus: [topic ids trong js/data/topics.js], algoWeight: 0..1, englishRequired: bool, questions: [], tips: [], pay?: [{role, yoe, amount, year, note?, url}], sources: [{title, url}], confidence: 'low'|'medium'|'high' }`
- `summary`, `process.detail`, `questions`, `tips`: tiếng Việt, **diễn đạt lại** (không chép nguyên văn), thuật ngữ giữ tiếng Anh. Câu hỏi phải là câu **thật sự được hỏi** theo review, viết lại thành câu hỏi rõ ràng.
- Mỗi chi tiết phải truy được về một nguồn trong `sources` (URL của bài voz cụ thể, dạng `.../page-N#post-M`, có sẵn trong file digest). Ghi năm phỏng vấn trong detail ("review 2024 kể…").
- Không bịa. Thiếu dữ liệu thì để mảng ngắn và `confidence: 'low'`. Ẩn tên người đăng.
- Không dùng backtick trong chuỗi. Dùng nháy đơn và escape \' khi cần.

> **CẢNH BÁO GHI ĐÈ:** `js/data/companies.js` có thể đang chứa nội dung chưa commit của task khác. KHÔNG viết lại cả file bằng công cụ ghi đè; sửa bằng chỉnh sửa cục bộ (thêm phần tử vào mảng, chèn công ty mới trước dòng `];` cuối). Trước khi đánh DONE: đếm số công ty trước/sau (`grep -c "^    id: '" js/data/companies.js`), không được mất công ty nào.
> Đánh DONE bằng cách **sửa dòng `Status:` ở đầu file** (không thêm dòng Status mới ở cuối).

## Nghiệm thu
`node --check js/data/companies.js`, `node scripts/validate.js` → OK. KHÔNG commit. Ghi Status: DONE + danh sách id công ty đã thêm/sửa vào Notes.

## Notes
- Đã đọc hết `docs/research/voz-interview-reviews.md` (118 review, 2023–2026).
- Kiểm tra số công ty: **trước 16, sau 22** (`grep -c "^    id: '" js/data/companies.js` = 22). Không mất công ty cũ; chỉ chỉnh sửa cục bộ (thêm round/câu hỏi/tip/source, thay block `axon`, chèn 6 công ty mới trước `];`).
- **Công ty đã cập nhật (có review voz liên quan trong digest):** `nab-vietnam` (voz #15/#42/#81/#73, confidence giữ `high`, bổ sung process/câu hỏi/tip/sources, gộp/dọn trùng lặp cũ), `naver-vietnam` (voz #26/#37/#103, bổ sung OA/technical/culture fit theo năm, confidence giữ `medium`), `axon` (voz #67/#68/#105, tái cấu trúc process 2022–2026, thêm panel concurrency/system design/CS low-level, confidence giữ `high`), `grab-vietnam` (voz #100 SDET screening: tip cách trả lời test case/tiếng Anh), `shopee` (voz #117 ghi chú trải nghiệm gián tiếp, không phải quy trình PV), `vng-zalo` (voz #48 ZaloPay/VNG behavior round — tham chiếu gián tiếp), `epam-vietnam` (đã có voz #4/#94; giữ nguyên, không thêm bừa), `rakuten-fintech-vietnam` (thêm **cảnh báo**: voz #7/#19 là Rakuten có thể khác pháp nhân/vị trí — không suy ra quy trình Rakuten Fintech Vietnam). Các công ty khác không có review backend/Java đủ rõ trong digest: giữ nguyên dữ liệu cũ.
- **6 công ty mới thêm:** `ninja-van` (voz #2, backend 2022, confidence `low`), `thoughtworks` (voz #85/#107, 2025–2026, `medium`), `sap` (voz #51/#53, 2024, `low`), `samsung-rd-vietnam` (voz #74 Fresh Staff Backend 2025, `low`), `optimizely` (voz #65 Senior .NET 2024 — ghi rõ role .NET, `low`), `chotot` (voz #52 Backend Java/Golang/Python 2024, `medium`). Chọn thay Employment Hero vì digest chỉ có review FE (#14) không phù hợp backend/Java; Chợ Tốt có review backend chi tiết hơn.
- Mỗi chi tiết mới gắn nguồn voz URL cụ thể (dạng `.../page-N#post-M`) trong `sources`; nội dung diễn đạt lại, ẩn danh người đăng, ghi năm.
- Đã chạy: `node --check js/data/companies.js` OK; `node scripts/build-light-index.js` OK (ghi `js/data/index-light.js`).
- `node scripts/validate.js` vẫn **FAIL** do lỗi **không thuộc file sở hữu** (`js/data/lessons-autotest.js`: `lesson-autotest-006/007` markup `{{...{...}...}}` và `lesson-autotest-007.check` cần 2–4 câu) — không sửa theo rule 3. Phần `companies.js` không còn lỗi cú pháp/validate do chính file này gây ra (lỗi `companies.js` trước đó đã sửa).
- Không git commit/push, không mở browser, không kill process theo tên.
Reviewed-by: verify-only (code/UI task)
