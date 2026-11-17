# T2360 — 2 bài thuật toán: order book đơn giản và sliding window VWAP

Status: DONE
Agent: kilo
Owns: `js/data/algo.js`
After: T2313

Đọc AGENTS.md mục ALGOS + tasks/T18-algo-tests.md; grep title: để không trùng. Thêm 2 bài (id algo-NNN tiếp số lớn nhất, medium) có starter + tests (≥ 5 case gồm biên): (1) OrderBook khớp lệnh limit theo giá-thời gian (price-time priority) với addOrder(side, price, qty) trả danh sách khớp; dùng TreeMap + Deque. (2) VWAP trong cửa sổ trượt N giây trên luồng tick (timestamp, price, qty). Solution Java có comment, complexity đúng, hints ≥ 3.

## Luật
AGENTS.md (đọc mục liên quan). Chỉ THÊM trước dòng `);` cuối file, không sửa/xoá mục cũ, id tiếp số LỚN NHẤT, không backtick, không ký hiệu đô-la + ngoặc nhọn. Không commit. Ghi số id trước/sau vào Notes (phải tăng đúng số đã thêm).

## Nghiệm thu
`node --check js/data/algo.js`, `node scripts/build-light-index.js`, `node scripts/test-algos.js`, `node scripts/validate.js` → OK. Status: DONE + id mới vào Notes.

## Notes
Them 2 bai thuat toan vao js/data/algo.js (chi sua file nay, them truoc dong `);` cuoi):
- algo-153 Order Book khop lenh limit theo gia-thoi gian (TreeMap + Deque), medium, 6 test, hint 4.
- algo-154 VWAP cua so truot N giay tren luong tick (Sliding Window + Deque), medium, 6 test, hint 4.
Id truoc (max cu): algo-152. Id sau (max moi): algo-154. Tang dung 2 so.
Da chay: node --check js/data/algo.js (OK); node scripts/test-algos.js algo-153 va algo-154 (6/6 ca hai); node scripts/build-light-index.js (ghi index-light.js); node scripts/validate.js (khong loi trong algo.js. Cac loi con lai o q-primer.js, quiz-ccao-2.js, projects.js la cu, khong thuoc nhiem vu nay).
Reviewed-by: verify-only (code/UI task)
