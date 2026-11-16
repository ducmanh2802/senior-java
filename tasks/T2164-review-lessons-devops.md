# T2164 — Rà soát chất lượng 4 bài học mới nhất (order lớn nhất) trong lessons-devops.js

Status: DONE
Agent: kilo
Owns: `js/data/lessons-devops.js`
After: T1431

## Bối cảnh
Giai đoạn ưu tiên **chất lượng**: nội dung do model free viết cần kiểm tra chéo trước khi người học dùng đi phỏng vấn thật.

## Việc cần làm
1. Tìm 4 bài học mới nhất (order lớn nhất) (`node scripts/qtool.js list js/data/lessons-devops.js` nếu là câu hỏi; file khác dùng grep -n theo id). KHÔNG đọc cả file một lần.
2. Kiểm tra từng mục: đúng kỹ thuật Docker/Kubernetes/CI-CD (lệnh, trường YAML có thật); giải thích từ gốc; bài tập mô phỏng đúng cơ chế, test xác định; câu check có đáp án đúng.
3. **Sửa đúng** chỗ sai/thiếu; không chắc thì viết ở mức nguyên lý, bỏ chi tiết bịa. Không xoá mục, không đổi id.

## Luật
- Đọc AGENTS.md (schema; mục 5 markup: không backtick, không ký hiệu đô-la + ngoặc nhọn trong template literal).
- Ngoại lệ cho luật "chỉ thêm": task rà soát được sửa nội dung có sẵn. Đếm số mục trước/sau phải bằng nhau.
- Không commit.

## Nghiệm thu
`node --check js/data/lessons-devops.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` (bài học thêm `node scripts/test-lessons.js`) → OK.
Xong: `Status: DONE`. Notes: bảng `id | lỗi tìm thấy | đã sửa gì`.

## Notes
Đã rà soát 4 bài học mới nhất (order 18-21):

| id | lỗi tìm thấy | đã sửa gì |
|---|---|---|
| lesson-devops-018 | Không có lỗi kỹ thuật. Nội dung DAG, Kahn's algorithm, cycle detection, critical path đều đúng. Bài tập PipelinePlanner plan() xử lý đúng unknown dependency, cycle detection, deterministic ordering. | Không cần sửa — nội dung đã đúng, test pass, validate pass. |
| lesson-devops-019 | Không có lỗi. Quality gate logic: test fail → coverage → CRITICAL (với waiver) → HIGH count (với waiver). Waiver expiration logic dùng `!today.isAfter(expires)` (còn hạn đến hết ngày) đúng ý định. | Không cần sửa — logic waiver, thứ tự reasons, edge cases đều xử lý đúng. |
| lesson-devops-020 | Không có lỗi. Template scaffolder: validation name (DNS label rules 3-30 chars, lowercase, hyphen, no --, no trailing -), team non-empty, port 1024-65535. Placeholder detection sau render phát hiện `__CHU_HOA__` còn sót. TreeMap output deterministic. | Không cần sửa — validation chặt, placeholder scan an toàn, test pass. |
| lesson-devops-021 | Không có lỗi. DORA 4 metrics: deployment frequency, median lead time (tránh outlier kéo lệch), change failure rate (trên deploy không phải incident), MTTR. Xử lý empty list trả Duration.ZERO/0.0, days <= 0 ném exception. | Không cần sửa — công thức median cho even/odd đúng, đơn vị giây nhất quán. |

Tất cả 4 bài học: schema đúng, markup không có backtick/`${`, giải thích chi tiết có Tóm tắt/Cơ chế/Ví dụ/Phỏng vấn/Senior tip, bài tập có starter/tests/reference/hints/explain, câu check có explain đúng/sai. `node --check`, `node scripts/build-light-index.js`, `node scripts/validate.js`, `node scripts/test-lessons.js` đều OK.
