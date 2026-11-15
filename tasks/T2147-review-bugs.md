# T2147 — Rà soát chất lượng 4 bài bug mới nhất (id lớn nhất) trong bugs.js

Status: DONE
Agent: kilo
Owns: `js/data/bugs.js`
After: T2103

## Notes

| id | lỗi tìm thấy | đã sửa gì |
|---|---|---|
| bug-032 | Artifact `transfer-service.log` không khớp story: hai request chỉ cách 0.8s (story nói 10–45 giây); dòng thứ 7 ghi `09:11:45.183` là typo (phải là `09:12:45`); exec-23 ghi debit/credit trước ledger write exec-17 (thứ tự thời gian lồng ghép không hợp lý) | Sửa timestamp: retry cách request đầu 34s, exec-23 credit ledger TR-77121 = 09:13:18.362, đồng bộ thứ tự log với story |
| bug-033 | OK | |
| bug-034 | Story nói "lệch vài đồng trên từng hóa đơn" nhưng artifact `revenue-audit.csv` có case RV-100244 lệch 2.000 đồng (10.000/4 làm tròn lên thành 3.000×4=12.000) | Cập nhật story: lệch từ vài đồng đến 2.000 đồng,举例 10.000/4 → 3.000×4=12.000 |
| bug-035 | OK | |

## Bối cảnh
Nội dung mới do model free viết chưa được kiểm tra chéo. Giai đoạn này ưu tiên **chất lượng** hơn số lượng: người học dùng để đi phỏng vấn thật.

## Việc cần làm
1. Tìm 4 bài bug mới nhất (id lớn nhất) trong `js/data/bugs.js` (dùng grep -n theo id, hoặc `node scripts/qtool.js` nếu hỗ trợ file này). KHÔNG đọc cả file một lần.
2. Kiểm tra từng mục: story và artifact khớp với code starter (tên class/method, số liệu); rootCause trích đúng dòng artifact; fix giải thích đúng, có so sánh cách sửa; test tái hiện bug xác định.
3. **Sửa đúng** chỗ sai/thiếu; không chắc thì viết ở mức nguyên lý, bỏ chi tiết bịa. Không xoá mục, không đổi id.

## Luật
- Đọc AGENTS.md (schema của loại dữ liệu này, mục 5 markup: không backtick, không ký hiệu đô-la + ngoặc nhọn trong template literal).
- Ngoại lệ cho luật "chỉ thêm": task rà soát được sửa nội dung có sẵn. Đếm số mục trước/sau phải bằng nhau.
- Không commit.

## Nghiệm thu
`node --check js/data/bugs.js`; `node scripts/build-light-index.js`; node scripts/test-bugs.js; node scripts/validate.js → OK.
Xong: `Status: DONE`. Notes: bảng `id | lỗi tìm thấy | đã sửa gì` (không lỗi ghi "OK").

## Notes
Reviewed-by: verify-only (code/UI task)
