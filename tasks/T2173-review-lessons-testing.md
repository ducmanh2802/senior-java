# T2173 — Rà soát chất lượng 4 bài học mới nhất trong lessons-testing.js

Status: DONE
Agent: kilo
Owns: `js/data/lessons-testing.js`
After: T2071

## Bối cảnh
Giai đoạn ưu tiên **chất lượng**: nội dung do model free viết cần kiểm tra chéo trước khi người học (dev Java ~4 năm, hổng nền tảng) dùng đi phỏng vấn thật.

## Việc cần làm
1. Tìm 4 bài học mới nhất (`node scripts/qtool.js list js/data/lessons-testing.js` nếu là câu hỏi; file khác dùng grep -n theo id). KHÔNG đọc cả file một lần.
2. Kiểm tra từng mục: đúng kỹ thuật; giải thích từ gốc cho người hổng nền tảng; ví dụ code có comment; bài tập mô phỏng đúng cơ chế, test xác định; câu check đúng, explain đủ.
3. **Sửa đúng** chỗ sai/thiếu; không chắc thì viết ở mức nguyên lý, bỏ chi tiết bịa. Không xoá mục, không đổi id.

## Luật
- Đọc AGENTS.md (schema; mục 5 markup: không backtick, không ký hiệu đô-la + ngoặc nhọn trong template literal).
- Ngoại lệ cho luật "chỉ thêm": task rà soát được sửa nội dung có sẵn. Đếm số mục trước/sau phải bằng nhau.
- Không commit.

## Nghiệm thu
`node --check js/data/lessons-testing.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` (bài học thêm `node scripts/test-lessons.js`, bug thêm `node scripts/test-bugs.js`) → OK.
Xong: `Status: DONE`. Notes: bảng `id | lỗi tìm thấy | đã sửa gì`.

## Notes

| id | lỗi tìm thấy | đã sửa gì |
|---|---|---|
| lesson-testing-010 (Clock) | Không lỗi. Đúng kỹ thuật Java 17, kiểm soát biên (trước/đúng/sau hết hạn), test xác định, starter không pass hết, reference pass 10/10 test. | Không cần sửa. |
| lesson-testing-011 (Test double/N+1) | Không lỗi. Phân biệt stub/mock/fake đúng, fake đếm truy vấn, query budget, test xác định. | Không cần sửa. |
| lesson-testing-012 (Spring Boot test pyramid) | Prompt bài tập ghi "Bỏ qua annotation lạ (@WebMvcTest, @DataJpaTest, @SpringBootTest, @SomethingElse)" — trùng lẫn, liệt kê cả annotationknown dưới chữ "lạ". | Sửa thành: "Các annotation không phải ba cái trên (ví dụ @SomethingElse) được bỏ qua, không ảnh hưởng kết quả." |
| lesson-testing-013 (WithdrawalService deterministic) | Không lỗi. Clock cố định + fake repo + độc lập, biên 8:00/17:00 đúng ([8,17)), kiểm tra đủ tiền trước khi save, starter không pass hết, reference pass 11/11 test. | Không cần sửa. |

Chạy kiểm tra: `node --check` OK; `node scripts/test-lessons.js` 298/298 OK; `node scripts/build-light-index.js` OK; `node scripts/validate.js` → "OK — không có lỗi."
Reviewed-by: kilo (T2173R)
