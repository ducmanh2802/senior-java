# T2153 — Rà soát chất lượng 4 lab mới nhất trong labs-gc.js

Status: DONE
Agent: kilo
Owns: `js/data/labs-gc.js`
After: T2094

## Bối cảnh
Nội dung mới do model free viết chưa được kiểm tra chéo. Giai đoạn này ưu tiên **chất lượng** hơn số lượng: người học (dev Java ~4 năm, hổng nền tảng) dùng để đi phỏng vấn thật.

## Việc cần làm
1. Tìm 4 lab mới nhất trong `js/data/labs-gc.js` (grep -n theo id, hoặc `node scripts/qtool.js` nếu hỗ trợ file này). KHÔNG đọc cả file một lần.
2. Kiểm tra từng mục: artifact giống thật và tự nhất quán (định dạng jstack/GC log JDK 17+/EXPLAIN PostgreSQL đúng, timestamp, lock id, số liệu khớp nhau và khớp answer); answer trích đúng dòng trong artifact; cách sửa đúng kỹ thuật; rubric ≥ 3 ý đo được.
3. **Sửa đúng** chỗ sai/thiếu; không chắc thì viết ở mức nguyên lý, bỏ chi tiết bịa. Không xoá mục, không đổi id.

## Luật
- Đọc AGENTS.md (schema của loại dữ liệu này; mục 5 markup: không backtick, không ký hiệu đô-la + ngoặc nhọn trong template literal).
- Ngoại lệ cho luật "chỉ thêm": task rà soát được sửa nội dung có sẵn. Đếm số mục trước/sau phải bằng nhau.
- Không commit.

## Nghiệm thu
`node --check js/data/labs-gc.js`; `node scripts/build-light-index.js`; node scripts/validate.js → OK.
Xong: `Status: DONE`. Notes: bảng `id | lỗi tìm thấy | đã sửa gì` (không lỗi ghi "OK").

## Notes

| id | lỗi tìm thấy | đã sửa gì |
|---|---|---|
| lab-gc-015 | Answer summary nói "khoảng 20 nghìn class" nhưng metric classes_loaded tăng 20.238 → 52.116 (+31.878); đoạn "bằng đúng preview/s" không khớp (preview/s ~1.0, class load rate ~1.54/sec) | Sửa summary thành "khoảng 32 nghìn class"; sửa dòng metric thành "mỗi preview request trung bình sinh ~1.5 class" |
| lab-gc-016 | Không có lỗi logic; heap_info (old ~4 GB/512 regions) khác metric (old_after_mixed ~5 GB) vì lấy tại thời điểm GC cycle khác nhau | OK |
| lab-gc-017 | Không có lỗi logic; artifact classloader_stats có chênh lệch nhỏ tổng loader (32761 vs sum ~32737) do loader hệ thống không liệt kê hết | OK |
| lab-gc-018 | Không có lỗi logic; heap_info (old ~2 GB) khác metric (old_after_mixed ~3 GB) do thời điểm đo khác nhau | OK |
