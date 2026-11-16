# T2278 — Rà soát chất lượng các bài thuật toán pattern Sliding Window, Two Pointers, Binary Search trong algo.js

Status: DONE
Agent: kilo
Owns: `js/data/algo.js`
After: T2111

## Bối cảnh
Giai đoạn ưu tiên **chất lượng**: nội dung do model free viết cần kiểm tra chéo trước khi người học (dev Java ~4 năm, hổng nền tảng) dùng đi phỏng vấn thật.

## Việc cần làm
1. Tìm các bài thuật toán pattern Sliding Window, Two Pointers, Binary Search (`node scripts/qtool.js list js/data/algo.js` nếu là câu hỏi; file khác dùng grep -n theo id). KHÔNG đọc cả file một lần.
2. Kiểm tra từng mục: solution Java đúng, complexity đúng, hints tăng dần; KHÔNG sửa tests/starter (chạy node scripts/test-algos.js nếu đụng code); Ghi vào Notes danh sách cụ thể các chỗ đã sửa (id + mô tả); nếu không sửa gì phải nêu 3 id đã kiểm tra kỹ và lý do đúng.
3. **Sửa đúng** chỗ sai/thiếu; không chắc thì viết ở mức nguyên lý, bỏ chi tiết bịa. Không xoá mục, không đổi id.

## Luật
- Đọc AGENTS.md (schema; mục 5 markup: không backtick, không ký hiệu đô-la + ngoặc nhọn trong template literal).
- Ngoại lệ cho luật "chỉ thêm": task rà soát được sửa nội dung có sẵn. Đếm số mục trước/sau phải bằng nhau.
- Không commit.

## Nghiệm thu
`node --check js/data/algo.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` (bài học thêm `node scripts/test-lessons.js`, bug thêm `node scripts/test-bugs.js`) → OK.
Xong: `Status: DONE`. Notes: bảng `id | lỗi tìm thấy | đã sửa gì`.

## Notes

Đã rà soát **toàn bộ 21 bài** thuộc 3 pattern (không sửa tests/starter, không đổi id, không xoá mục). Số bài algo trước/sau: **146 = 146**.

Kiểm chứng: `node scripts/test-algos.js` → Harness OK 146/146 (2 lần, trước và sau khi sửa); `node scripts/validate.js` → `OK — không có lỗi.`; `node --check js/data/algo.js` OK.

Danh sách bài đã kiểm tra kỹ:
- Two Pointers: algo-005, algo-006, algo-007, algo-008, algo-052
- Sliding Window: algo-009, algo-010, algo-011, algo-012, algo-055, algo-075, algo-079, algo-149
- Binary Search: algo-017, algo-018, algo-019, algo-036, algo-059, algo-060, algo-065, algo-081

### Bảng lỗi tìm thấy & đã sửa

| id | lỗi tìm thấy | đã sửa gì |
|---|---|---|
| algo-008 | Ghi chú "Lưu ý khi phỏng vấn" khẳng định tổng nước `2*10^4 * 10^5 = 2*10^9` "vẫn có thể tràn int (gần 2.1 tỷ)" — SAI: `Integer.MAX_VALUE ≈ 2.147*10^9` nên `2*10^9` chưa tràn int | Sửa thành: tổng nước tối đa `2*10^9`, tuy chưa vượt `Integer.MAX_VALUE` nhưng rất sát; nên dùng `long` cho an toàn. (Code giữ nguyên vì với ràng buộc đề, `int` không tràn.) |
| algo-055 | Comment trong code `solution`: `long sum = 0; // long: tổng 2*10^5 * 10^4 = 2*10^9 vượt int` — SAI: `2*10^9 < 2.147*10^9` nên chưa vượt int | Sửa comment thành: tổng tối đa `2*10^9`, sát `Integer.MAX_VALUE` nên dùng `long` cho chắc. (Chỉ đổi comment, không đổi logic.) |

### Các bài KHÔNG sửa (đã kiểm tra kỹ, xác nhận đúng)

- **algo-017 / algo-036 / algo-059**: binary search chuẩn; quy ước khoảng đóng/nửa mở nhất quán; `lo + (hi - lo) / 2` tránh tràn; lower bound (algo-036) trả đúng vị trí chèn cả khi target lớn hơn mọi phần tử. Tests phủ biên 1 phần tử, 2 phần tử, không xoay.
- **algo-018 / algo-059 (mảng xoay)**: điều kiện `a[l] <= a[m]`, nhánh trái/phải sorted chính xác; chạy tay `[4,5,6,7,0,1,2]`, `[3,1]`, `[5,1,3]`, `[6,7,1,2,3,4,5]` đều đúng; lưu ý duplicate → worst case O(n) đã nêu.
- **algo-019 / algo-060 (binary search on answer / Koko)**: miền đơn điệu, `while (lo < hi)` + `hi = mid` đúng mẫu "tìm min thoả mãn"; `ceil` bằng `(x + rate - 1) / rate` trên `long` tránh tràn; complexity `O(n log M)`. (algo-060 `hours()` không thoát sớm nên tổng có thể vượt int → dùng `long` là ĐÚNG.)
- **algo-011 (Longest Repeating Character Replacement)**: lập luận không giảm `maxCount` khi thu hẹp là đúng (chỉ là cận trên, không ảnh hưởng kết quả max); điều kiện `windowLen - maxCount <= k` chuẩn.
- **algo-012 (Minimum Window Substring)**: dùng `missing` thay so sánh map; `need[c]--` cho phép âm với ký tự thừa; vòng `while` lồng trong `for` vẫn O(n) vì mỗi ký tự vào/ra ≤ 1 lần.
- **algo-079 (Sliding Window Maximum)**: monotonic deque lưu index, `<=` khi loại phần tử nhỏ hơn ở cuối, `if (dq.peekFirst() <= i - k)` ở đầu; O(n), O(k). Chạy tay `[1,3,-1,-3,5,3,6,7]` khớp.
- **algo-149 (Permutation in String)**: kỹ thuật `matches` khởi tạo đúng (đếm `need[i] == window[i]` với `window` toàn 0); cập nhật trước/sau khi đổi `window[c]` chính xác; tests (kể cả `duplicate chars`, `at end`, `long s2`) pass.
- **algo-005 / algo-006 / algo-007**: two pointers chuẩn; 3Sum bỏ trùng ở cả vòng ngoài và hai con trỏ; Container greedy đúng (bỏ vách thấp hơn không mất nghiệm).
- **algo-009 / algo-010 / algo-075**: one-pass min-price; cửa sổ + `lastSeen`/`last` với `left = max(left, prev + 1)` tránh lùi cửa sổ; `algo-075` dùng HashMap nên an toàn Unicode. (`algo-010` dùng `int[128]` chỉ đúng ASCII — đã có ghi chú trade-off trong bài.)
- **algo-052 / algo-055**: merge 2 mảng sort O(n+m), dùng `<=` cho ổn định; sliding window với phần tử không âm, tổng đơn điệu, `l` chỉ tăng nên O(n); `sum` dùng `long`.
- **algo-065 (LIS)**: `tails` + lower bound (`tails[mid] < x`) cho dãy tăng nghiêm ngặt, `size` tăng khi `lo == size`; O(n log n). Ghi chú phân biệt lower/upper bound cho biến thể "không giảm" đúng.
- **algo-081 (Median of Two Sorted Arrays)**: hoán đổi để binary search trên mảng ngắn, `j = half - i` luôn hợp lệ, sentinel `MIN_VALUE/MAX_VALUE`, `long` trước khi cộng, chia `2.0`. Các test biên (một mảng rỗng, tổng lẻ/chẵn, âm) pass.

Ghi chú duplicates (giữ nguyên theo luật "không xoá mục, không đổi id"): algo-018 vs algo-059 (cùng "Search in Rotated Sorted Array"), algo-010 vs algo-075 (cùng "Longest Substring Without Repeating Characters") — nội dung tương đương nhưng trình bày/tests khác nhau, không đụng tới.
