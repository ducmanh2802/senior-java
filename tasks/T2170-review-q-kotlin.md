# T2170 — Rà soát chất lượng 15 câu mới nhất trong q-kotlin.js

Status: DONE
Agent: kilo
Owns: `js/data/q-kotlin.js`
After: T1525

## Bối cảnh
Giai đoạn ưu tiên **chất lượng**: nội dung do model free viết cần kiểm tra chéo trước khi người học (dev Java ~4 năm, hổng nền tảng) dùng đi phỏng vấn thật.

## Việc cần làm
1. Tìm 15 câu mới nhất (`node scripts/qtool.js list js/data/q-kotlin.js` nếu là câu hỏi; file khác dùng grep -n theo id). KHÔNG đọc cả file một lần.
2. Kiểm tra từng mục: đúng Kotlin 1.9/2.x (coroutines, null safety, data/sealed class) và cách dùng với Spring Boot 3; có cấu trúc đủ.
3. **Sửa đúng** chỗ sai/thiếu; không chắc thì viết ở mức nguyên lý, bỏ chi tiết bịa. Không xoá mục, không đổi id.

## Luật
- Đọc AGENTS.md (schema; mục 5 markup: không backtick, không ký hiệu đô-la + ngoặc nhọn trong template literal).
- Ngoại lệ cho luật "chỉ thêm": task rà soát được sửa nội dung có sẵn. Đếm số mục trước/sau phải bằng nhau.
- Không commit.

## Nghiệm thu
`node --check js/data/q-kotlin.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` (bài học thêm `node scripts/test-lessons.js`, bug thêm `node scripts/test-bugs.js`) → OK.
Xong: `Status: DONE`. Notes: bảng `id | lỗi tìm thấy | đã sửa gì`.

## Notes

Rà soát 15 câu mới nhất: kotlin-021 … kotlin-035 (35 câu tổng thể). Dùng `node scripts/qtool.js list` để liệt kê, đọc từng đối tượng (không đọc cả file một lần), kiểm tra schema (id/topic/level/q/a/follow/tags, không field thêm), markup (không backtick, không `${`, fences `~~~` cân bằng), cấu trúc bắt buộc (`**Tóm tắt:**`, `### Ví dụ đời thực`, `### Trả lời mẫu khi phỏng vấn`, `> Senior tip:`, follow 2–3 câu, độ dài ≥1500), và chính xác kỹ thuật Kotlin 1.9/2.x + Spring Boot 3 (coroutines, null safety/platform type, data/sealed/value class, all-open/no-arg, jackson-module-kotlin, Flow vs Reactor, virtual thread, Ktor, MockK/runTest, variance, inline/reified, lazy/lateinit, annotation use-site target).

| id | lỗi tìm thấy | đã sửa gì |
|---|---|---|
| kotlin-021 | Không lỗi. Nội dung platform type/@Nullable chạm trùng chủ đề kotlin-001 (cấp senior), nhưng kotlin-021 viết ở cấp mid với ví dụ NPE thực tế khác nhau. | Không cần sửa (không xoá mục theo quy tắc task). |
| kotlin-022 | Không lỗi. Nội dung data class làm JPA entity chạm trùng kotlin-014, nhưng kotlin-022 thêm góc so sánh với Java record. | Không cần sửa. |
| kotlin-023 | Không lỗi. | Không cần sửa. |
| kotlin-024 | Không lỗi. | Không cần sửa. |
| kotlin-025 | Không lỗi. | Không cần sửa. |
| kotlin-026 | Không lỗi. | Không cần sửa. |
| kotlin-027 | Không lỗi. | Không cần sửa. |
| kotlin-028 | Không lỗi. | Không cần sửa. |
| kotlin-029 | Không lỗi. | Không cần sửa. |
| kotlin-030 | Không lỗi. | Không cần sửa. |
| kotlin-031 | Không lỗi. | Không cần sửa. |
| kotlin-032 | Không lỗi. | Không cần sửa. |
| kotlin-033 | Không lỗi. | Không cần sửa. |
| kotlin-034 | Không lỗi. | Không cần sửa. |
| kotlin-035 | Không lỗi. | Không cần sửa. |

Kết quả chạy: `node --check js/data/q-kotlin.js` OK; `node scripts/build-light-index.js` đã sinh lại `js/data/index-light.js`; `node scripts/validate.js` in `OK — không có lỗi.` (cảnh báo `path.js` về lesson nằm ngoài PATH là cũ, không liên quan task này). Không commit.

Status: DONE
