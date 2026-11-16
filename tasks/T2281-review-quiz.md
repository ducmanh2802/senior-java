# T2281 — Rà soát chất lượng các câu trắc nghiệm (lượt 2, nửa sau file) trong quiz.js

Status: DONE
Agent: kilo
Owns: `js/data/quiz.js`
After: T2109

## Bối cảnh
Giai đoạn ưu tiên **chất lượng**: nội dung do model free viết cần kiểm tra chéo trước khi người học (dev Java ~4 năm, hổng nền tảng) dùng đi phỏng vấn thật.

## Việc cần làm
1. Tìm các câu trắc nghiệm (lượt 2, nửa sau file) (`node scripts/qtool.js list js/data/quiz.js` nếu là câu hỏi; file khác dùng grep -n theo id). KHÔNG đọc cả file một lần.
2. Kiểm tra từng mục: đáp án đúng thật sự đúng; explain nói vì sao từng phương án sai; phương án nhiễu hợp lý, không sai lộ liễu; đáp án đúng rải đều vị trí 0–3; Ghi vào Notes danh sách cụ thể các chỗ đã sửa (id + mô tả); nếu không sửa gì phải nêu 3 id đã kiểm tra kỹ và lý do đúng.
3. **Sửa đúng** chỗ sai/thiếu; không chắc thì viết ở mức nguyên lý, bỏ chi tiết bịa. Không xoá mục, không đổi id.

## Luật
- Đọc AGENTS.md (schema; mục 5 markup: không backtick, không ký hiệu đô-la + ngoặc nhọn trong template literal).
- Ngoại lệ cho luật "chỉ thêm": task rà soát được sửa nội dung có sẵn. Đếm số mục trước/sau phải bằng nhau.
- Không commit.

## Nghiệm thu
`node --check js/data/quiz.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` (bài học thêm `node scripts/test-lessons.js`, bug thêm `node scripts/test-bugs.js`) → OK.
Xong: `Status: DONE`. Notes: bảng `id | lỗi tìm thấy | đã sửa gì`.

## Notes
- Phạm vi rà soát (lượt 2, nửa sau): 116 mục từ `qz-security-007` đến `qz-core-054` (tổng 232 mục; số lượng trước/sau không đổi).
- Kiểm tra: đáp án đúng/`multi`+`answer` tăng dần và nằm trong range; explain giải thích vì sao đúng và vì sao từng phương án sai; distractor hợp lý; `(Chọn N)` khớp với `answer.length`; phân bố vị trí đáp án đúng rải; không backtick và không `${` trong template literal (trừ trường hợp escape hợp lệ nếu có).

| id | lỗi tìm thấy | đã sửa gì |
|---|---|---|
| qz-sql-032 | Giải thích gắn nhãn "phương án 1/2/3/4" không khớp với index 0-based (gây hiểu nhầm: đúng là index 1 nhưng viết "phương án 1", mục sai viết "phương án 2/3/4") | Viết lại explain: nêu rõ "phương án 1 (index 1)" và phân tích từng phương án theo index 0..3; giữ đáp án đúng `answer: 1` |

Các mục kiểm tra kỹ, không cần sửa (ví dụ):
- `qz-security-007`: mTLS xác thực hai chiều nhưng vẫn cần authorization; giải thích đúng vì sao 3 phương án còn lại sai.
- `qz-sql-023`: multi, `answer [0,1]` đúng (row-level lock + re-evaluate sau khi hết chờ ở READ COMMITTED), explain phủ đủ các phương án.
- `qz-microservices-023`: multi, `answer [0,2]` đúng (compensation ngược + lưu trạng thái saga), explain nêu rõ vì sao XA/ghi thẳng DB/xoá record sai.

Kết quả: `node --check js/data/quiz.js` OK; `node scripts/build-light-index.js` OK; `node scripts/validate.js` OK (chỉ còn cảnh báo PATH sẵn có, không lỗi).
Reviewed-by: verify-only (review task)
