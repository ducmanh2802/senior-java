# T2286 — Rà soát chất lượng các bài bug (đọc story + rootCause + fix) trong bugs.js

Status: DONE
Agent: kilo
Owns: `js/data/bugs.js`
After: T2226

## Bối cảnh
Giai đoạn ưu tiên **chất lượng**: nội dung do model free viết cần kiểm tra chéo trước khi người học (dev Java ~4 năm, hổng nền tảng) dùng đi phỏng vấn thật.

## Việc cần làm
1. Tìm các bài bug (đọc story + rootCause + fix) (`node scripts/qtool.js list js/data/bugs.js` nếu là câu hỏi; file khác dùng grep -n theo id). KHÔNG đọc cả file một lần.
2. Kiểm tra từng mục: rootCause trích đúng dòng artifact; fix ≥800 ký tự có phòng ngừa; KHÔNG sửa starter/tests/reference (chạy node scripts/test-bugs.js nếu đụng code); Ghi vào Notes danh sách cụ thể các chỗ đã sửa (id + mô tả); nếu không sửa gì phải nêu 3 id đã kiểm tra kỹ và lý do đúng.
3. **Sửa đúng** chỗ sai/thiếu; không chắc thì viết ở mức nguyên lý, bỏ chi tiết bịa. Không xoá mục, không đổi id.

## Luật
- Đọc AGENTS.md (schema; mục 5 markup: không backtick, không ký hiệu đô-la + ngoặc nhọn trong template literal).
- Ngoại lệ cho luật "chỉ thêm": task rà soát được sửa nội dung có sẵn. Đếm số mục trước/sau phải bằng nhau.
- Không commit.

## Nghiệm thu
`node --check js/data/bugs.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` (bài học thêm `node scripts/test-lessons.js`, bug thêm `node scripts/test-bugs.js`) → OK.
Xong: `Status: DONE`. Notes: bảng `id | lỗi tìm thấy | đã sửa gì`.

## Notes

Đã đọc toàn bộ 35 bài (bug-001 … bug-035), kiểm tra tính nhất quán story/rootCause/fix ↔ artifact ↔ code, dấu tiếng Việt và lỗi cú pháp markup. Kết quả chạy: `node --check js/data/bugs.js` → OK; `node scripts/test-bugs.js` → 35/35; `node scripts/validate.js` → OK.

| id | lỗi tìm thấy | đã sửa gì |
|---|---|---|
| bug-030 | Story/rootCause/fix/hints viết không dấu; số liệu không khớp: story "chênh 237.500" nhưng log 100000000.00 vs 99999999.98 chỉ lệch 0,02; "chưa kết paio"; "hàng tỷ" trong khi tổng chỉ 100 triệu; artifact thứ hai nói về equals/scale (100.00 vs 100.0) không đúng chủ đề double; lỗi chính tả "duoc duoc", "tieu luu", "vai dong", "tien tien". | Viết lại story/rootCause/fix/hints có dấu đầy đủ; sửa chênh thành 0,02; sửa "chưa kết chuyển"; sửa "hàng trăm triệu", "vài xu"; thay artifact thứ hai bằng ví dụ double đúng chủ đề (0.30000000000000004 vs 0.30; 1000.0000000001588); sửa toàn bộ lỗi chính tả. |
| bug-031 | Story/rootCause/fix viết không dấu; typo "he thystem"; dòng `related` thụt lề sai (0 space); có ký tự backtick trong template literal gây lỗi cú pháp. | Viết lại story/rootCause/fix có dấu; sửa "he thystem" → "hệ thống"; sửa thụt lề `related`; thay backtick bằng markup `{{...}}` cho đúng quy định mục 5. |
| bug-034 | Artifact không khớp code: CSV ghi `10000,4,"3000\|3000\|3000\|3000",12000,+2000` nhưng starter dùng `Math.round((double)10000/4)=2500` (tổng 10000, lệch 0); story ví dụ 10.000/4=3.000 cũng sai; rootCause bịa "phiên bản trước làm tròn hàng nghìn ở tầng hiển thị" để hợp lý hoá số liệu sai. | Sửa CSV đúng hành vi starter: RV-100231 100000/3 → 33334\|33333\|33333 (tổng 100000, dư 1 đồng cho đối tác đầu); RV-100244 10000/4 → 2500×4; RV-100259 250000/6 → 41667×4+41666×2; RV-100260 7/3 → 3\|2\|2. Sửa ví dụ story thành 100.000/3 → 33.333×3=99.999 và 7/3 → 2×3=6. Viết lại rootCause bám theo code, bỏ đoạn bịa. |
| bug-035 | Thông điệp `ArithmeticException` sai: "decimal record" — thông điệp Java thật là "decimal result"; typo "trôi trôi". | Sửa story + 2 dòng artifact thành "no exact representable decimal result"; sửa "trôi trôi" → "trôi". |

3 bài đã kiểm tra kỹ và giữ nguyên vì đúng: **bug-027** (equals/hashCode entity + HashSet; rootCause trích đúng `pending contains(order-551203)=false` và `pending set size=1193`; fix 2 lớp business key + persist trước khi add), **bug-028** (cache-aside evict trước/ghi DB sau; rootCause khớp đúng mốc log .204/.207/.211; fix delayed double delete + CDC Debezium + TTL), **bug-033** (token bucket race; rootCause 3 lỗi khớp artifact code review; fix CAS nano-tokens + wall-clock, có khuyến nghị Redis/Lua cho phân tán).

Không sửa starter/tests/reference của bất kỳ bài nào (chỉ sửa story/rootCause/fix/hints/artifact). Số mục trước/sau: 35 → 35.
Reviewed-by: verify-only (review task)
