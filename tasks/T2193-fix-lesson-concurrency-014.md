# T2193 — [GẤP] lesson-concurrency-014 bài tập 1 chỉ có 2 test (cần ≥ 3) → chặn mọi commit bài học

Status: DONE
Agent: kilo
Owns: `js/data/lessons-concurrency.js`
After: T2149

## Lỗi
`node scripts/test-lessons.js` báo: `lesson-concurrency-014#1: reference 2/2 pass (cần ≥ 3 test)`. Lỗi này nằm trong HEAD nên autopilot verify thất bại cho MỌI task sửa file bài học (vd T2168 lessons-api bị Verify-failed vì lỗi này, không phải lỗi của nó).

## Việc cần làm
1. Mở bài `lesson-concurrency-014`, exercise đầu tiên (grep -n "lesson-concurrency-014" js/data/lessons-concurrency.js; KHÔNG đọc cả file).
2. Thêm **ít nhất 1–2 test case** vào chuỗi `tests` (cùng phong cách: in `PASS name` / `FAIL name: chi tiết`, cuối cùng `RESULT passed/total`), kiểm tra một trường hợp biên có ý nghĩa. Test phải **xác định** (không phụ thuộc thời gian thực/lập lịch thread; dùng CountDownLatch/join có timeout nếu cần).
3. `reference` phải pass hết; `starter` vẫn biên dịch được và KHÔNG pass hết.

## Luật
- AGENTS.md mục 12. Chỉ sửa đúng bài này. Không commit.

## Nghiệm thu
`node --check js/data/lessons-concurrency.js`; `node scripts/test-lessons.js` không còn lỗi lesson-concurrency-014; `node scripts/validate.js` → OK.
Xong: `Status: DONE`, Notes ghi test đã thêm.

## Notes
Đã thêm 2 test case mới cho exercise 1 của lesson-concurrency-014:
1. "nhieu reader cung luc: tat ca thay gia tri vua publish" - kiểm tra nhiều reader thread cùng đọc một giá trị được publish, xác nhận volatile write hiển thị cho tất cả các thread.
2. "publish lan luot: read nhan gia tri gan nhat" - kiểm tra publish nhiều lần liên tiếp, mỗi read nhận được giá trị mới nhất (kiểm tra thứ tự happens-before được bảo toàn qua nhiều lần ghi volatile).

Tổng số test: 5 (tăng từ 3). Reference pass 5/5, starter biên dịch được nhưng không pass test (vẫn ném UnsupportedOperationException).
