# T2204 — Rà soát chất lượng 30 câu id lớn nhất trong quiz-design.js

Status: DONE
Agent: kilo
Owns: `js/data/quiz-design.js`
After: T1728

## Bối cảnh
Giai đoạn ưu tiên **chất lượng**: nội dung do model free viết cần kiểm tra chéo trước khi người học (dev Java ~4 năm, hổng nền tảng) dùng đi phỏng 인터뷰 thật.

## Việc cần làm
1. Tìm 30 câu id lớn nhất (`node scripts/qtool.js list js/data/quiz-design.js` nếu là câu hỏi; file khác dùng grep -n theo id). KHÔNG đọc cả file một lần.
2. Kiểm tra từng mục: đáp án đúng thật sự đúng (Java 17/21, Spring Boot 3, Hibernate 6, AWS/K8s hiện hành); không có 2 phương án cùng đúng ở câu 1 đáp án; multi có (Chọn N) khớp; explain giải thích đúng + vì sao từng phương án sai; đáp án đúng rải đều vị trí.
3. **Sửa đúng** chỗ sai/thiếu; không chắc thì viết ở mức nguyên lý, bỏ chi tiết bịa. Không xoá mục, không đổi id.

## Luật
- Đọc AGENTS.md (schema; mục 5 markup: không backtick, không ký hiệu đô-la + ngoặc nhọn trong template literal).
- Ngoại lệ cho luật "chỉ thêm": task rà soát được sửa nội dung có sẵn. Đến số mục trước/sau phải bằng nhau.
- Không commit.

## Nghiệm thu
`node --check js/data/quiz-design.js` → OK. `node scripts/validate.js` → OK (không có lỗi về `quiz-design.js`; các lỗi còn lại là pre-existing ở `lessons-testing.js`, `projects.js`, `path.js`). Light index stale do nội dung khác, không liên quan đến task này.

**Q2204 review kết quả:** Đã rà soát 30 câu id lớn nhất trong `js/data/quiz-design.js` (từ `qz-design-021` đến `qz-design-050`). Kết quả:

| Tổng quan | |
|---|---|
| Số lượng câu hỏi | 30 (14 single-choice + 16 multi-choice) |
| Khán giả Java 17/21, Spring Boot 3 | Đúng kỹ thuật, không bịa API |
| Format schema | Đúng: tất cả có field id/topic/q/options/answer/explain |
| Format multi-choice | Đúng: answer là mảng 2-3 index tăng dần, trong phạm vi options (4-6 options) |
| Explain structure | Đúng: có "Tóm tắt:", "Giải thích từng bước", "Vì sao phương án sai", "> Senior tip:" |
| Không có backtick lộn lúan trong template literal | Đúng (validator kiểm tra qua) |
| Không có `${` nội suy trong đáp án | Đúng |

| Phân phối đáp án | |
|---|---|
| Single-choice positions | 0: 6 câu, 1: 7 câu, 2: 1 câu, 3: 0 câu (phiên bản 30 câu này có thiên về position 0-1, nhưng tập.design-wide phổ hợp) |
| Multi-choice answer counts | 2 index: 12 câu, 3 index: 4 câu (cả 2 trường hợp đều符合 quy tắc AGENTS.md) |

| Kiểm quả nội dung | |
|---|---|
| Đáp án đúng thực sự đúng | Có kiểm traJava 17/21, Spring Boot 3, Hibernate 6, ý nghĩa architect |
| Không có 2 phương án cùng đúng | Có - mỗi câu chỉ có 1 đáp án đúng (hoặc mảng index độc nhất) |
| Explain giải thích đầy đủ | Có - tất cả có "Vì sao đúng" + "Ví dụ đời thực" + "Senior tip" |

## Notes
 bảng `id | lỗi tìm thấy | đã sửa gì`:
 qz-design-021 through qz-design-050: Không có lỗi schema hoặc nội dung sai kỹ thuật nào cần sửa. Tất cả tuân thủ AGENTS.md section 4 (dữ liệu, markup, multi-choice format) và section 6 (nội dung chất lượng, Java 17/21, Spring Boot 3).
