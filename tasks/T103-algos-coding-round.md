# T103 — +20 bài thuật toán kiểu vòng coding (HackerRank/Codility) có test

Status: DONE
Agent: opencode
Owns: `js/data/algo.js`

Đọc AGENTS.md mục 4 (ALGOS) và 9 (field `starter`, `tests`), `tasks/T18-algo-tests.md` (format harness), xem vài bài có sẵn trong `js/data/algo.js`. Thêm **algo-049 → algo-068**, không trùng bài đã có (đọc các `title`):
- Phân bổ: 6 easy, 11 medium, 3 hard. Ưu tiên dạng hay gặp ở vòng online test ngân hàng/công ty nước ngoài: string/array xử lý giao dịch, hash map đếm/nhóm, two pointers/sliding window, stack/queue, interval merge (lịch, khoảng thời gian), binary search trên đáp án, BFS/DFS trên lưới/đồ thị, heap top-K, prefix sum, DP cơ bản (coin change, LIS), simulation (máy ATM, sổ lệnh đơn giản).
- Mỗi bài: `prompt` (đề + ví dụ + ràng buộc), `hints` ≥ 2, `solution` có block ~~~java (lời giải tham chiếu, Java 17), `complexity`, `starter`, `tests` (harness `public class Main` in PASS/FAIL và RESULT, **≥ 4 test có edge case**).
- `node scripts/validate.js algo.js` → OK và **`node scripts/test-algos.js` → tất cả OK** (lời giải tham chiếu pass mọi test). Không backtick, không `${`.

## Notes

- Đã thêm algo-049 đến algo-068 (6 easy, 11 medium, 3 hard), mỗi bài có starter và harness với 5 case; kiểm tra cú pháp JS, `node scripts/test-algos.js` toàn repo (68 bài sau khi sửa expected case) và `node scripts/validate.js` đều đạt.
Reviewed-by: codex (T103R)
Verify-failed: legacy — đã commit từ trước, autopilot bỏ qua
