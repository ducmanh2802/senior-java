# T2222 — [GẤP] lesson-concurrency-004 bài tập 1: test "slow source is dropped after timeout" không xác định (flaky)

Status: DONE
Agent: kilo
Owns: `js/data/lessons-concurrency.js`

## Lỗi
`node scripts/test-lessons.js` lúc pass lúc fail: `lesson-concurrency-004#1: reference 6/7 pass — FAIL slow source is dropped after timeout: expected 125 got 130`. Test dựa vào thời gian thực (sleep/timeout) nên kết quả phụ thuộc lập lịch thread của máy. Lỗi này chặn MỌI commit có file js/data (bước verify chạy test-lessons).

## Việc cần làm
1. Mở bài `lesson-concurrency-004`, exercise 1 (grep -n "lesson-concurrency-004" js/data/lessons-concurrency.js; KHÔNG đọc cả file).
2. Viết lại test "slow source is dropped after timeout" cho **xác định**: nguồn chậm phải bị chặn bằng `CountDownLatch` không bao giờ được countDown (hoặc `CompletableFuture` không complete) thay vì `Thread.sleep` gần ngưỡng; timeout đủ lớn so với nguồn nhanh (nguồn nhanh trả ngay); kiểm tra kết quả theo tập nguồn đã trả về, không theo số đo thời gian. Nếu reference cũng cần sửa để khớp thì sửa reference.
3. Chạy `node scripts/test-lessons.js` ít nhất 5 lần liên tiếp: reference pass 7/7 mọi lần; starter biên dịch được và không pass hết.

## Luật
- AGENTS.md mục 12 (test phải deterministic). Chỉ sửa đúng bài này. Không commit.

## Nghiệm thu
`node --check js/data/lessons-concurrency.js`; 5 lần `node scripts/test-lessons.js` đều không còn lỗi bài này; `node scripts/validate.js` → OK.
Xong: `Status: DONE`, Notes ghi cách làm test xác định.

## Notes

Đã làm (chỉ sửa `js/data/lessons-concurrency.js`, exercise 1 của `lesson-concurrency-004`):

1. Nguyên nhân flaky: test cũ dùng nguồn chậm `slow(1, 5_000)` (Thread.sleep 5s) với timeout 200ms. Dưới tải (nhiều agent/CI), thread chạy nguồn nhanh `() -> 125` có thể chưa được lập lịch trong 200ms nên `completeOnTimeout(null)` nổ trước → `min` chỉ còn 130 → "expected 125 got 130". Ngoài ra còn một assert thời gian thực `ms > 1_500` cũng phụ thuộc lập lịch.
2. Cách sửa cho xác định:
   - Thêm helper `blocked(CountDownLatch never)`: nguồn chậm bị chặn trên `CountDownLatch(1)` **không bao giờ countDown**, nên chắc chắn chưa trả về khi timeout nổ (không dùng `Thread.sleep` gần ngưỡng). Giá trả về sau khi bị huỷ là `1` (rẻ nhất) để nếu lọt vào timeout thì test bắt được ngay.
   - Timeout nâng lên **1500ms** — quá dư so với hai nguồn nhanh (chỉ `return` hằng số 130/125) nên kết quả luôn là `min(130,125)=125`, không còn canh thời gian.
   - Bỏ assert số đo thời gian (`System.nanoTime()`), thay bằng kiểm tra **tập nguồn đã trả về**: `eq(125, best)` và `never.getCount() == 1` (nguồn chậm chưa được nhả). Nếu nguồn chậm lọt vào, `best` sẽ là 1.
   - Nâng `await(...)` từ 2s lên 5s cho dư an toàn so với timeout 1500ms (chỉ nới lỏng, không ảnh hưởng test khác).
   - `pool.shutdownNow()` trong `finally` interrupt thread đang bị chặn (daemon) → không treo JVM.
3. `reference` không cần sửa (đã đúng); chỉ sửa `tests`.
4. Nghiệm thu: `node --check` OK; `node scripts/test-lessons.js lesson-concurrency-004` chạy 5 lần liên tiếp đều 7/7; full `node scripts/test-lessons.js` 300/300; `node scripts/validate.js` → OK (chỉ còn cảnh báo cũ về lessons ngoài PATH, không liên quan bài này). Không commit.
