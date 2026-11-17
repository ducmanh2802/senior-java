# T2347 — Bài học: Tích hợp với core banking (khái niệm T24/Temenos Transact) — timeout, COB, store-and-forward

Status: DONE
Agent: kilo
Owns: `js/data/lessons-banking.js`
After: T2343

## Bối cảnh
Người học (Java dev 4 năm, chưa có kinh nghiệm ngân hàng) nhắm vị trí **Java dev tích hợp core banking** (team digital/middleware quanh core như T24 — nay gọi Temenos Transact). Bài dạy **khái niệm công khai** để nói chuyện được với team core; KHÔNG dạy cú pháp InfoBasic, KHÔNG bịa tên application/field/API cụ thể của Temenos (chỉ nêu các khái niệm phổ biến: CUSTOMER/CIF, ACCOUNT, arrangement (AA), COB – Close of Business, OFS – Open Financial Service, TAFJ chạy trên Java; không chắc thì nói chung "core banking").
Đọc AGENTS.md mục 12, bài mẫu `lesson-collections-001`, grep `title:` trong `js/data/lessons-banking.js` để không lặp.

## Việc cần làm
Thêm ĐÚNG 1 bài (id `lesson-banking-NNN` tiếp số LỚN NHẤT, `order` tiếp theo, senior, 40 phút):
- body ≥ 3500 ký tự:
  - ### Core banking là gì và vì sao nó là "nguồn sự thật" (số dư, sổ cái; kênh ngoài chỉ giữ bản sao/cache).
  - ### Bức tranh hệ thống: mobile/internet banking → API gateway → middleware/ESB → core; NAPAS, thẻ, eKYC là hệ thống vệ tinh (khối `~~~seq`).
  - ### Khái niệm cần biết khi nói chuyện với team core: CIF/customer, account, arrangement, value date vs booking date, ngày làm việc/ngày lễ, COB, OFS/REST ở mức nguyên lý.
  - ### Gọi core bị timeout: vì sao KHÔNG retry mù (giao dịch có thể đã ghi sổ) → query trạng thái theo mã tham chiếu duy nhất, idempotency, bảng trạng thái UNKNOWN.
  - ### Cửa sổ COB: giao dịch bị chặn/xếp hàng → store-and-forward, thông báo người dùng, xử lý sau COB, value date.
  - ### Map mã lỗi core → trạng thái cho người dùng + log/audit.
  - ### Đối soát kênh với core cuối ngày.
  - ### Liên hệ phỏng vấn (T24 developer vs Java dev tích hợp: khác nhau thế nào, nên nói gì).
- 2 bài tập Java thuần (JDK 17, không class public ngoài Main, test deterministic, Clock giả):
  1. `CoreTransferService` gọi `CoreBankingClient` giả (có thể trả SUCCESS / FAILED / TIMEOUT mà thực tế đã ghi sổ): timeout → query theo ref, không ghi sổ 2 lần; test ≥ 4 case.
  2. `CobGate` store-and-forward: trong cửa sổ COB (giờ cấu hình) giao dịch vào hàng đợi, sau COB xả hàng đợi đúng thứ tự, mỗi giao dịch đúng 1 lần; test ≥ 4 case.
- check 3 câu (explain từng phương án), goals 3–4.

## Luật
Chỉ THÊM trước dòng `);` cuối file, không sửa bài cũ, không backtick, không ký hiệu đô-la + ngoặc nhọn. Không commit. Ghi số bài trước/sau vào Notes (+1).

## Nghiệm thu
`node --check js/data/lessons-banking.js`, `node scripts/test-lessons.js` (reference pass hết, starter không pass hết), `node scripts/build-light-index.js`, `node scripts/validate.js` → OK. Status: DONE + id vào Notes.

## Notes
- Trước: 13 bài trong `js/data/lessons-banking.js` (lesson-banking-001..013). Sau: 14 bài (+1).
- Đã thêm `lesson-banking-014` (order 14, level senior, 40 phút): core banking là nguồn sự thật, bức tranh kênh→gateway→middleware→core (seq), khái niệm CIF/account/arrangement/value date vs booking date/ngày làm việc/COB/OFS-REST, timeout + không retry mù + query theo ref + idempotency + UNKNOWN, COB store-and-forward, map lỗi core + audit, đối soát cuối ngày, liên hệ phỏng vấn T24 dev vs Java tích hợp.
- 2 bài tập Java thuần (JDK 17): `CoreTransferService` (timeout/query/idempotent, 4 nhóm case/10 checks) và `CobGate` store-and-forward trong cửa sổ COB (4 nhóm case/14 checks). 3 câu `check` với explain từng phương án. Goals 4.
- Đã chạy: `node --check js/data/lessons-banking.js` OK; `node scripts/test-lessons.js lesson-banking-014` → `Lesson exercises OK: 2/2`; `node scripts/build-light-index.js` OK; `node scripts/validate.js` còn 2 lỗi pre-existing ngoài phạm vi sở hữu: `new_questions.js` chưa khai báo trong manifest, `quiz-ccao-2.js` lỗi cú pháp.
- Sửa cú pháp khi chèn: bỏ dấu phẩy thừa trước bài mới và thay inline code có `{}` lồng nhau trong prompt bằng mô tả text để qua validator markup.
