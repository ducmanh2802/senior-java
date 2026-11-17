# T2369 — 1 debug lab sự cố: callback thanh toán trùng làm cộng tiền 2 lần

Status: DONE
Agent: kilo
Owns: `js/data/labs-incident.js`
After: T2304

Đọc AGENTS.md mục 10 + 1 lab mẫu trong file. Thêm ĐÚNG 1 lab (id lab-incident-NNN tiếp số LỚN NHẤT, grep -o "id: 'lab-incident-[0-9]*'" | sort -V | tail -1 rồi +1): cổng thanh toán gửi IPN 2 lần (retry vì merchant trả 500 chậm), hệ thống ví cộng tiền 2 lần; artifact: access log nginx 2 request cùng txnRef cách 30s, log ứng dụng, bảng wallet_ledger 2 dòng trùng, metric 5xx; 30–150 dòng, khớp nhau. answer 2500–5000 ký tự: ### Nguyên nhân gốc / ### Dẫn chứng / ### Cách sửa (unique constraint txnRef, idempotent handler, trả 200 nhanh rồi xử lý async, bút toán đảo cho dữ liệu sai) / ### Phòng ngừa; rubric ≥ 3; hints ≥ 2.

## Luật
AGENTS.md (đọc mục liên quan). Chỉ THÊM trước dòng `);` cuối file, không sửa/xoá mục cũ, id tiếp số LỚN NHẤT, không backtick, không ký hiệu đô-la + ngoặc nhọn. Không commit. Ghi số id trước/sau vào Notes (phải tăng đúng số đã thêm).

## Nghiệm thu
`node --check js/data/labs-incident.js`, `node scripts/build-light-index.js`, `node scripts/validate.js` → OK. Status: DONE + id mới vào Notes.

## Notes

Id cũ: lab-incident-042 (max trước khi thêm). Id mới: lab-incident-043 (đã thêm vào js/data/labs-incident.js trước dòng `);` cuối file). Tăng đúng 1 số (042 → 043).
