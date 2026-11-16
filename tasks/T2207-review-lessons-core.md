# T2207 — Rà soát chất lượng 4 bài học mới nhất trong lessons-core.js

Status: DONE
Agent: kilo
Owns: `js/data/lessons-core.js`
After: T2046

## Bối cảnh
Giai đoạn ưu tiên **chất lượng**: nội dung do model free viết cần kiểm tra chéo trước khi người học (dev Java ~4 năm, hổng nền tảng) dùng đi phỏng vấn thật.

## Việc cần làm
1. Tìm 4 bài học mới nhất (`node scripts/qtool.js list js/data/lessons-core.js` nếu là câu hỏi; file khác dùng grep -n theo id). KHÔNG đọc cả file một lần.
2. Kiểm tra từng mục: đúng kỹ thuật Java 17/21; giải thích từ gốc cho người hổng nền tảng; ví dụ code có comment; bài tập mô phỏng đúng cơ chế, test ≥ 3 case xác định; câu check đúng, explain đủ.
3. **Sửa đúng** chỗ sai/thiếu; không chắc thì viết ở mức nguyên lý, bỏ chi tiết bịa. Không xoá mục, không đổi id.

## Luật
- Đọc AGENTS.md (schema; mục 5 markup: không backtick, không ký hiệu đô-la + ngoặc nhọn trong template literal).
- Ngoại lệ cho luật "chỉ thêm": task rà soát được sửa nội dung có sẵn. Đếm số mục trước/sau phải bằng nhau.
- Không commit.

## Nghiệm thu
`node --check js/data/lessons-core.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` (bài học thêm `node scripts/test-lessons.js`, bug thêm `node scripts/test-bugs.js`) → OK.
Xong: `Status: DONE`. Notes: bảng `id | lỗi tìm thấy | đã sửa gì`.

## Notes

4 bài mới nhất: `lesson-core-010` … `lesson-core-013`. Đọc từng bài (không đọc cả file), chạy thử
`node scripts/test-lessons.js <id>`, soát tay phần body + quiz, rồi sửa tại chỗ.

| id | Lỗi tìm thấy | Đã sửa gì |
|---|---|---|
| lesson-core-010 | Câu check 3 có **hai đáp án đúng**: phương án B ("equals/hashCode dùng cả hai field; compareTo lần lượt so tenant rồi order") vốn là cách cài đặt hợp lệ, nên người học chọn B cũng bị chấm sai. Ngoài ra "va chạm", "entry", "replay" dùng nhưng chưa giải thích; code mẫu không có comment. | Sửa B thành phương án sai thật ("compareTo chỉ so mã đơn → hai tenant cùng mã đơn bị TreeMap gộp") và viết lại `explain` (B sai vì lệch hợp đồng, D mới là nguyên tắc đúng). Thêm gloss: entry = cặp key–value; **va chạm** (collision) = hai khóa vào cùng bucket; replay = phát lại dữ liệu cũ. Thêm 2 comment (hashCode phải cùng field với equals; compareTo so nhiều field theo thứ tự). Exercise: 6/6 pass, starter fail. |
| lesson-core-011 | "Snapshot" xuất hiện ngay câu đầu nhưng chưa định nghĩa; "O(n)", "async", "deep copy" cũng chưa giải thích — người đọc hổng nền tảng dễ đứng hình. Code mẫu thiếu comment ở dòng quan trọng nhất (`List.copyOf`). | Thêm định nghĩa snapshot (ảnh chụp dữ liệu tại một thời điểm) vào Tóm tắt; gloss O(n) = tỉ lệ thuận với số phần tử, async = xử lý ở thời điểm khác, deep copy = sao chép sâu tới từng phần tử. Thêm comment cho dòng copy constructor. Exercise: 6/6 pass. |
| lesson-core-012 | Nội dung kỹ thuật đúng (checked/unchecked, wrap giữ cause, TWR đóng ngược + suppressed, Spring rollback). Chỉ thiếu giải thích 2 thuật ngữ: "flush" và "middleware". | Thêm gloss flush (đẩy dữ liệu trong vùng đệm xuống đĩa) và middleware (lớp xử lý ở rìa hệ thống) ngay chỗ dùng. Exercise 4/4 pass (kiểm cả 4 kịch bản work/close lỗi). |
| lesson-core-013 | Câu "Đọc ra thì chắc chắn nhận được ít nhất là T" dễ gây hiểu sai (phần tử là T hoặc subtype của T, không phải "ít nhất"); "allocation" chưa giải thích. | Sửa thành "phần tử luôn là T hoặc một kiểu con của T, nên gán vào biến kiểu T là an toàn" (2 chỗ: danh sách PECS và bước 4 nối hai phía). Thêm gloss allocation (tạo object mới trong bộ nhớ). Exercise 5/5 pass. |

Không đổi id, không xoá mục, không thêm/bớt item: vẫn 13 bài trong `lessons-core.js`, 4 bài mới
mỗi bài 1 exercise + 13 câu check (giữ nguyên số lượng trước/sau).

Nghiệm thu: `node --check` OK · `node scripts/build-light-index.js` OK ·
`node scripts/validate.js` → `OK — không có lỗi.` (chỉ còn cảnh báo cũ về 73 bài học ngoài PATH, không liên quan file này) ·
`node scripts/test-lessons.js` → `Lesson exercises OK: 300/300`.

Ghi chú kỹ thuật đã kiểm tra và thấy **đúng**, không sửa: `Objects.hash` nhất quán với equals;
`compareTo` không dùng phép trừ; record không tự sinh `Comparable`; `List.copyOf` từ chối null và
tách cấu trúc (unmodifiable view khác snapshot); try-with-resources: thân lỗi là lỗi chính,
`close()` lỗi thành suppressed theo thứ tự đóng ngược, thân thành công thì close lỗi đầu là lỗi chính;
`@Transactional` mặc định rollback RuntimeException/Error; generic invariant + PECS + type erasure.
Reviewed-by: verify-only (review task)
