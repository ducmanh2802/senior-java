# T2208 — Rà soát chất lượng 4 bài học mới nhất trong lessons-modern.js

Status: DONE
Agent: kilo
Owns: `js/data/lessons-modern.js`
After: T1047

## Bối cảnh
Giai đoạn ưu tiên **chất lượng**: nội dung do model free viết cần kiểm tra chéo trước khi người học (dev Java ~4 năm, hổng nền tảng) dùng đi phỏng vấn thật.

## Việc cần làm
1. Tìm 4 bài học mới nhất (`node scripts/qtool.js list js/data/lessons-modern.js` nếu là câu hỏi; file khác dùng grep -n theo id). KHÔNG đọc cả file một lần.
2. Kiểm tra từng mục: đúng kỹ thuật Java 17/21; giải thích từ gốc cho người hổng nền tảng; ví dụ code có comment; bài tập mô phỏng đúng cơ chế, test ≥ 3 case xác định; câu check đúng, explain đủ.
3. **Sửa đúng** chỗ sai/thiếu; không chắc thì viết ở mức nguyên lý, bỏ chi tiết bịa. Không xoá mục, không đổi id.

## Luật
- Đọc AGENTS.md (schema; mục 5 markup: không backtick, không ký hiệu đô-la + ngoặc nhọn trong template literal).
- Ngoại lệ cho luật "chỉ thêm": task rà soát được sửa nội dung có sẵn. Đếm số mục trước/sau phải bằng nhau.
- Không commit.

## Nghiệm thu
`node --check js/data/lessons-modern.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` (bài học thêm `node scripts/test-lessons.js`, bug thêm `node scripts/test-bugs.js`) → OK.
Xong: `Status: DONE`. Notes: bảng `id | lỗi tìm thấy | đã sửa gì`.

## Notes

Rà soát 4 bài mới nhất (order 4–7): `lesson-modern-004..007`. Đã đọc từng bài (không đọc cả file), kiểm tra kỹ thuật Java 17/21, tính xác định của test, và chạy `node scripts/test-lessons.js` cho từng bài (đều pass: 004 6/6, 005 10/10, 006 7/7 + 7/7, 007 8/8 + 6/6). Số mục không đổi: 268 bài học / 300 bài tập, modern = 7.

| id | lỗi tìm thấy | đã sửa gì |
|---|---|---|
| lesson-modern-004 | Không có lỗi kỹ thuật (functional interface, method reference, andThen/compose, Predicate.and/or, pitfall effectively final, Comparator đều đúng) | Giữ nguyên |
| lesson-modern-005 | Câu "{{Instant.now()}}, {{LocalDate.now()}} dùng … múi giờ mặc định máy chủ" **sai**: {{Instant.now()}} luôn trả UTC, không phụ thuộc múi giờ máy; chỉ {{LocalDate.now()}}/{{LocalDateTime.now()}} dùng {{ZoneId.systemDefault()}} | Sửa lại cho đúng: Instant = UTC; LocalDate/LocalDateTime = múi giờ mặc định |
| lesson-modern-006 | (1) Gợi ý xử lý value null của {{toMap}} bằng "{{map.keySet().removeIf(...)}} sau khi gom" là **bất khả thi**: toMap ném NPE ngay trong lúc gom, không trả về map. (2) Bảng chọn nhanh thiếu dấu ")" trong {{groupingBy(key, counting()}} | (1) Thay bằng: lọc/map null trước, hoặc dùng groupingBy + toList (groupingBy nhận value null); ghi rõ không thể xoá null sau khi gom. (2) Thêm ")" |
| lesson-modern-007 | (1) Timeout HTTP client ghi "{{HttpClient.newBuilder().connectTimeout/connectTimeout}}" lặp, chưa chính xác: {{java.net.http.HttpClient}} chỉ có {{connectTimeout}}, **không** có read timeout sẵn. (2) Comment {{close()}} ghi "bắt IOException" sai: {{ExecutorService.close()}} không ném checked exception (tự khôi phục cờ interrupt). (3) Test "nguồn chậm" của bài 2 dồn {{finally}} cùng dòng với assert | (1) Mô tả đúng: connect/socket timeout (RestClient/Apache), HttpClient chỉ connectTimeout nên phải tự bọc. (2) Sửa comment {{close()}}. (3) Tách {{finally}} ra dòng riêng |

Nghiệm thu: `node --check js/data/lessons-modern.js` OK; `node scripts/build-light-index.js` (sinh lại index-light.js); `node scripts/validate.js` → **OK — không có lỗi.** (cảnh báo "bài học không nằm trong PATH" là có sẵn, không phải lỗi).
Reviewed-by: verify-only (review task)
