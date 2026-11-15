# T2151 — Rà soát chất lượng 4 bài học mới nhất trong lessons-microservices.js

Status: DONE
Agent: kilo
Owns: `js/data/lessons-microservices.js`
After: T2112

## Bối cảnh
Nội dung mới do model free viết chưa được kiểm tra chéo. Giai đoạn này ưu tiên **chất lượng** hơn số lượng: người học (dev Java ~4 năm, hổng nền tảng) dùng để đi phỏng vấn thật.

## Việc cần làm
1. Tìm 4 bài học mới nhất trong `js/data/lessons-microservices.js` (grep -n theo id, hoặc `node scripts/qtool.js` nếu hỗ trợ file này). KHÔNG đọc cả file một lần.
2. Kiểm tra từng mục: body đúng kỹ thuật (Java 17/21, Spring Boot 3, Hibernate 6); giải thích từ gốc cho người hổng nền tảng; ví dụ code có comment; bài tập mô phỏng đúng cơ chế, test xác định; explain nêu lỗi hay gặp; câu check có đáp án đúng và explain đủ.
3. **Sửa đúng** chỗ sai/thiếu; không chắc thì viết ở mức nguyên lý, bỏ chi tiết bịa. Không xoá mục, không đổi id.

## Luật
- Đọc AGENTS.md (schema của loại dữ liệu này; mục 5 markup: không backtick, không ký hiệu đô-la + ngoặc nhọn trong template literal).
- Ngoại lệ cho luật "chỉ thêm": task rà soát được sửa nội dung có sẵn. Đếm số mục trước/sau phải bằng nhau.
- Không commit.

## Nghiệm thu
`node --check js/data/lessons-microservices.js`; `node scripts/build-light-index.js`; node scripts/test-lessons.js; node scripts/validate.js → OK.
Xong: `Status: DONE`. Notes: bảng `id | lỗi tìm thấy | đã sửa gì` (không lỗi ghi "OK").

## Notes
| id | lỗi tìm thấy | đã sửa gì |
|---|---|---|
| lesson-microservices-014 | Nội dung cơ bản rõ; có thể nhầm lẫn người mới với “at-least-once”, “inbox”, “check-then-act” chưa đủ giải thích đời thường | Không sửa (đã đúng kỹ thuật: at-least-once, messageId ổn định, dedup trong transaction, inbox unique constraint, TTL, example + bài tập + check hợp lý). |
| lesson-microservices-015 | Thuật ngữ “downstream service”, “thread starvation”, “thundering herd” chưa giải thích cho người hổng nền tảng | Thêm giải thích ngắn trong body: “dịch vụ bên dưới…”; “thread starvation (nghĩa là mọi luồng xử lý đang bận chờ, không còn luồng rảnh để nhận request mới)”; “thundering herd (đám request dồn vào cùng lúc khiến service vừa hồi phục bị nghẽn lại)”. |
| lesson-microservices-016 | Nội dung kỹ thuật đúng (rate-based, window, minimumCalls, HALF_OPEN theo mô tả bài). Một chỗ nói “giống Resilience4j… chờ đủ probe rồi so tỉ lệ lỗi…” đã ghi rõ khác biệt trong bài — tốt cho người học | Không sửa (đúng, có nhắc khác biệt HALF_OPEN so với Resilience4j). |
| lesson-microservices-017 | Giải thích registry/fallback/metrics phù hợp người mới (có ví dụ, bảng fallback). Cài đặt rút gọn khớp exercise | Không sửa. |

Đã chạy: `node --check js/data/lessons-microservices.js` OK; `node scripts/build-light-index.js` OK (ghi `js/data/index-light.js`); `node scripts/test-lessons.js` OK (296/296); `node scripts/validate.js` OK (không lỗi). Không đổi id, không xóa mục, chỉ sửa 2 chỗ text trong lesson 015.
Reviewed-by: kilo (T2151R)
