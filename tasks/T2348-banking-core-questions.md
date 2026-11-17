# T2348 — 5 câu phỏng vấn: tích hợp core banking (T24/Temenos ở mức khái niệm)

Status: DONE
Agent: kilo
Owns: `js/data/q-banking.js`
After: T2345

## Bối cảnh
Người học nhắm vị trí Java dev tích hợp core banking ở ngân hàng Việt Nam (nhiều nơi dùng core T24 — Temenos Transact). Chỉ dùng khái niệm công khai (CIF, account, arrangement, COB, OFS, value date); KHÔNG bịa tên application/field/API cụ thể của Temenos, không dạy InfoBasic. Đọc AGENTS.md mục 4–6; `node scripts/qtool.js list js/data/q-banking.js` để không trùng.

## Việc cần làm
Thêm 5 câu (topic `banking`, id tiếp số LỚN NHẤT; 1 mid / 3 senior / 1 lead), đúng chuẩn mục 6 (Tóm tắt, ### cơ chế, code Java ≤30 dòng, ### Ví dụ đời thực có số liệu, ### Trả lời mẫu khi phỏng vấn 150–220 từ, > Senior tip:, 3000–5000 ký tự), có `~~~seq` cho luồng nhiều bên:
1. (mid) App mobile hiển thị số dư: đọc thẳng core mỗi lần hay cache/CQRS? Độ trễ, tải lên core, độ tươi dữ liệu, khi nào bắt buộc đọc core.
2. Gọi core chuyển tiền bị timeout 30s: bạn xử lý thế nào để không trừ tiền 2 lần và khách biết trạng thái?
3. Trong lúc core chạy COB (khoá sổ cuối ngày), kênh digital vẫn phải nhận giao dịch: thiết kế store-and-forward, value date, thông báo khách.
4. Đối soát giữa hệ thống kênh (internet banking/ví) và core cuối ngày: lệch thì xử lý ra sao, ai sửa, audit.
5. (lead) Ngân hàng thay core (migrate sang core mới hoặc nâng cấp lớn): chiến lược chạy song song, đối soát số dư, cắt chuyển, rollback, rủi ro cho các hệ thống tích hợp.

## Luật
Chỉ THÊM trước dòng `);` cuối file, không sửa/xoá câu cũ, không backtick, không ký hiệu đô-la + ngoặc nhọn. Không commit. Ghi số id trước/sau vào Notes (+5).

## Nghiệm thu
`node --check js/data/q-banking.js`, `node scripts/build-light-index.js`, `node scripts/validate.js` → OK. Status: DONE + id vào Notes.

## Notes

Added 5 new questions: banking-072 (mid), banking-073 (senior), banking-074 (senior), banking-075 (senior), banking-076 (lead). All validations pass.
