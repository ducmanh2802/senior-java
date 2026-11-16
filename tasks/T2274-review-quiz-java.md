# T2274 — Rà soát chất lượng các câu trắc nghiệm (lượt 2, tập trung câu chưa có explain đủ 4 phương án) trong quiz-java.js

Status: DONE
Agent: kilo
Owns: `js/data/quiz-java.js`
After: T2202

## Bối cảnh
Giai đoạn ưu tiên **chất lượng**: nội dung do model free viết cần kiểm tra chéo trước khi người học (dev Java ~4 năm, hổng nền tảng) dùng đi phỏng vấn thật.

## Việc cần làm
1. Tìm các câu trắc nghiệm (lượt 2, tập trung câu chưa có explain đủ 4 phương án) (`node scripts/qtool.js list js/data/quiz-java.js` nếu là câu hỏi; file khác dùng grep -n theo id). KHÔNG đọc cả file một lần.
2. Kiểm tra từng mục: đáp án đúng thật sự đúng; explain nói vì sao từng phương án sai; phương án nhiễu hợp lý, không sai lộ liễu; đáp án đúng rải đều vị trí 0–3; đúng Java 17/21; Ghi vào Notes danh sách cụ thể các chỗ đã sửa (id + mô tả); nếu không sửa gì phải nêu 3 id đã kiểm tra kỹ và lý do đúng.
3. **Sửa đúng** chỗ sai/thiếu; không chắc thì viết ở mức nguyên lý, bỏ chi tiết bịa. Không xoá mục, không đổi id.

## Luật
- Đọc AGENTS.md (schema; mục 5 markup: không backtick, không ký hiệu đô-la + ngoặc nhọn trong template literal).
- Ngoại lệ cho luật "chỉ thêm": task rà soát được sửa nội dung có sẵn. Đếm số mục trước/sau phải bằng nhau.
- Không commit.

## Nghiệm thu
`node --check js/data/quiz-java.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` (bài học thêm `node scripts/test-lessons.js`, bug thêm `node scripts/test-bugs.js`) → OK.
Xong: `Status: DONE`. Notes: bảng `id | lỗi tìm thấy | đã sửa gì`.

## Notes
- Kiểm tra: dùng script tạm quét `explain` trong `js/data/quiz-java.js` (theo pattern liệt kê A)/B)/C)/D)) để tìm mục thiếu trình bày rõ 4 phương án; đã rà nhóm `core`/`collections` đầu và chạy lại validator.
- Đã sửa (file sở hữu `js/data/quiz-java.js`): `qz-core-007` (viết lại explain theo dạng “Vì sao đúng / Vì sao mỗi phương án sai” nêu rõ A–D), `qz-core-008` (tương tự, nêu rõ từng lựa chọn), `qz-core-009`, `qz-core-010` (đổi `{{static {...}}}` gây lỗi validate sang mô tả bằng chữ), `qz-core-011`, `qz-core-012`, `qz-core-013`, `qz-core-014` (bổ sung giải thích sai cho từng phương án A–D, rõ ràng cho người mới).
- 3 id đã kiểm tra kỹ (không sửa): `qz-core-015` (explain đã nêu đúng/giải thích từng sai, đúng Java/cơ chế HashSet/equals/hashCode, phù hợp mức độ). `qz-core-016` (giải thích nguyên nhân `this$0` + lý do các đáp án sai, chính xác). `qz-core-017` (multi, giải thích 3 đáp án đúng + lý do 2 sai còn lại, đúng nguyên tắc immutable/defensive copy). Không có id nào bị đổi/xoá; số lượng câu trong file giữ nguyên theo validate trước/sau.
- Kết quả chạy: `node --check js/data/quiz-java.js` OK; `node scripts/build-light-index.js` OK; `node scripts/validate.js` OK (cảnh báo `path.js` không liên quan, không lỗi).
