# T18 — Test harness + starter code cho 48 bài thuật toán

Status: TODO
Agent: opencode
Owns: `js/data/algo.js` (chỉ THÊM field `starter` và `tests` vào từng bài; được sửa tối thiểu `solution` nếu cần để compile chung với harness)

> **Quan trọng — ghi theo lô nhỏ:** model miễn phí sẽ timeout nếu sinh quá nhiều trong một lần. Làm **3–4 bài mỗi lần edit**,
> sau mỗi lô chạy `node --check js/data/algo.js` và `node scripts/test-algos.js <id>` cho từng bài vừa làm.

Đọc `AGENTS.md` mục 4, 5 và 9 trước khi bắt đầu.

## Mục tiêu
Người dùng sẽ bấm **Run** trên trang Thuật toán: code của họ được ghép với harness rồi chạy trên Judge0 (Java 13).
Mỗi bài cần hai field mới:

### `starter` (string)
Code khởi đầu cho editor: class và chữ ký method đúng với harness, phần thân để trống. Ví dụ:
```
starter: 'class Solution {\n    public int[] twoSum(int[] nums, int target) {\n        \n    }\n}',
```
Với bài thiết kế (LRU Cache, Min Stack, Rate Limiter…) thì dùng tên class mà đề yêu cầu.

### `tests` (template literal chứa Java)
- Phải có **`public class Main`** với `public static void main(String[] args)`.
- Gọi code của người dùng (ví dụ `new Solution().twoSum(...)`), so sánh với **giá trị mong đợi tự tính tay**.
  **Không** gọi lời giải tham khảo để lấy kết quả.
- In ra đúng định dạng sau, mỗi case một dòng:
  - `PASS <tên case>`
  - `FAIL <tên case>: expected <x> got <y>`
  - Dòng cuối: `RESULT <passed>/<total>`
- **≥ 5 case**: ví dụ trong đề, edge case (rỗng, 1 phần tử, trùng lặp, số âm, giá trị biên/overflow) và 1 case lớn để bắt lời giải O(n²) quá chậm nếu bài yêu cầu tối ưu.
- Mỗi case bọc trong `try/catch (Throwable t)` để một case ném exception không làm dừng các case khác. Khi đó in `FAIL <tên>: threw <t>`.
- Bài có nhiều đáp án hợp lệ (thứ tự tuỳ ý…) thì so sánh sau khi chuẩn hoá (sort).
- Cú pháp **Java 11** (Judge0 chạy Java 13): không dùng `record`, text block, pattern matching `instanceof`, switch expression, `List.toList()`.
  Được dùng `var`, `List.of`, `Map.of`.
- Không cần `import`: hệ thống tự thêm `java.util.*`, `java.util.function.*`, `java.util.stream.*`, `java.util.concurrent.*` và `java.util.concurrent.atomic.*`.
- Cần `ListNode`/`TreeNode` thì **harness định nghĩa** (`class ListNode { int val; ListNode next; ListNode(int v){val=v;} }`…), kèm helper dựng và so sánh.
  Sau đó thêm câu "{{ListNode}} đã được định nghĩa sẵn" vào `prompt`, và bỏ định nghĩa trùng (nếu có) khỏi code trong `solution`.
- Không dùng ký tự backtick và không viết `${` trong template literal.

### Mẫu harness
```
tests: `public class Main {
    static int passed = 0, total = 0;
    static void check(String name, Object expected, Object actual) {
        total++;
        if (Objects.deepEquals(expected, actual)) { passed++; System.out.println("PASS " + name); }
        else System.out.println("FAIL " + name + ": expected " + Arrays.deepToString(new Object[]{expected}) + " got " + Arrays.deepToString(new Object[]{actual}));
    }
    public static void main(String[] args) {
        try { check("example", new int[]{0, 1}, new Solution().twoSum(new int[]{2, 7, 11, 15}, 9)); }
        catch (Throwable t) { total++; System.out.println("FAIL example: threw " + t); }
        // ... more cases ...
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
```

## Nghiệm thu
- `node scripts/test-algos.js` in ra `Harness OK: 48 · lỗi: 0 · chưa có tests: 0`.
  Script này ghép **lời giải tham khảo** với harness, compile bằng `javac` rồi chạy, nên lời giải tham khảo phải pass mọi case.
- `node scripts/validate.js` → OK.

## Notes
(agent ghi chú ở đây)
