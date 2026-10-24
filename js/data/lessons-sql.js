/* Bài học track "sql". Schema & markup: AGENTS.md mục 12. */
(window.LESSONS = window.LESSONS || []).push(
{
  id: 'lesson-sql-001',
  track: 'sql',
  order: 1,
  title: 'Join từ trong: nested-loop, hash join và đếm phép so sánh',
  level: 'senior',
  minutes: 30,
  goals: [
    'Mô tả được cách DB thực hiện nested-loop join và hash join từng bước',
    'So sánh số phép so sánh và giải thích vì sao hash join thường nhanh hơn',
    'Nhận biết dấu hiệu DB chọn nested-loop trong production và cách tránh',
  ],
  body: `### Tóm tắt:
Join là thao tác đắt nhất trong một query SQL. Khi bạn viết {{SELECT ... FROM A JOIN B ON A.id = B.id}}, DB không tự động biết phải chọn thuật toán nào. Hai cách phổ biến nhất là **nested-loop join** (lặp lồng) và **hash join**. Hiểu rõ từng thuật toán giúp bạn đọc execution plan, dự đoán chi phí, và biết khi nào một index thiếu sẽ khiến query từ 10 ms lên 10 giây.

### Nested-loop join: đơn giản nhưng đắt
Nested-loop join là cách tự nhiên nhất: lấy từng dòng từ bảng trái (outer), rồi duyệt toàn bộ bảng phải (inner) để tìm dòng khớp điều kiện join.

~~~java
// Mô phỏng: mỗi Record có id và một trường value
for (Record left : outerTable) {
    for (Record right : innerTable) {
        if (left.id == right.id) {
            results.add(new Pair(left, right));
        }
    }
}
~~~

Với {{n}} dòng trái và {{m}} dòng phải, số lần so sánh khóa là **{{n × m}}**. Nếu cả hai bảng đều 10.000 dòng, bạn đã thực hiện **100 triệu** so sánh. Đây chính là lý do một query thiếu index trên bảng phải có thể làm CPU và I/O bùng nổ. DBMS thường chọn nested-loop khi:
- Bảng phải rất nhỏ (vài dòng, có thể nằm vừa một trang bộ nhớ).
- Đã có index trên bảng phải theo khóa join, nên mỗi vòng inner chỉ cần tìm một dòng qua cây B+ thay vì duyệt toàn bộ.
- Điều kiện join phức tạp (hàm, khoảng) khiến hash join không áp dụng được.

### Hash join: xây bảng băm rồi tra cứu
Hash join hoạt động theo hai giai đoạn:

1. **Build phase**: chọn bảng nhỏ hơn làm bảng băm (build table). Tính hash cho khóa join của từng dòng, đưa vào một bảng băm trong bộ nhớ (thường là một mảng các bucket, mỗi bucket là danh sách liên kết hoặc cây).
2. **Probe phase**: duyệt bảng lớn hơn (probe table). Tính hash cho khóa join, tra cứu trực tiếp trong bảng băm: **O(1)** trung bình mỗi dòng.

Tổng chi phí là **O(n + m)** (tính hash và chèn/tra cứu) cộng chi phí xây bảng băm một lần. Nếu bảng băm không vừa RAM, DB phải đổ xuống đĩa (grace hash join với nhiều batch), chi phí tăng nhưng vẫn thường thấp hơn nested-loop trên dữ liệu lớn.

| Thuật toán | Số lần so sánh khóa (tệ nhất) | Bộ nhớ thêm | Khi nào DB chọn |
|---|---|---|---|
| Nested-loop (không index) | {{n × m}} | Gần như không | Bảng phải rất nhỏ |
| Nested-loop (có index phải) | {{n × log(m)}} | Bộ đệm index | Index khớp, bảng phải vừa |
| Hash join | {{O(n + m)}} | Bảng băm ≈ kích thước bảng nhỏ | Hai bảng lớn, khóa bằng |

### Đếm phép so sánh: vì sao lại quan trọng?
Execution plan của PostgreSQL hay Oracle thường hiển thị một cột như **loops** hoặc **row comparisons**. Khi bạn thấy một nested-loop chạy với số vòng (loops) bằng hàng trăm nghìn, đó là dấu hiệu bảng phải bị duyệt lặp đi lặp lại. Nếu query trước đây chạy 20 ms bỗng lên 8 giây sau khi dữ liệu tăng từ 1.000 lên 50.000 dòng, khả năng cao DB đã chuyển từ index scan sang nested-loop hoặc bảng băm đã bị đổ ra đĩa.

> Pitfall thực tế: một bảng có 500 dòng và một bảng có 400.000 dòng. Nếu DB chọn hash join nhưng bảng băm (500 dòng) lại phải đổ xuống đĩa vì RAM bị chiếm bởi các bảng khác, thì chi phí đọc/ghi đĩa có thể vượt quá lợi ích. Lúc đó, thêm một index phù hợp trên bảng lớn và để DB dùng nested-loop với index (500 × log(400.000) ≈ 500 × 19 ≈ 9.500 thao tác) lại nhanh hơn hash join đổ đĩa.

> Senior tip: Khi {{EXPLAIN ANALYZE}} cho thấy {{loops}} lớn trên Nested Loop, hãy kiểm tra {{work_mem}} (PostgreSQL) và kích thước bảng inner. Nếu bảng inner nhỏ mà không có index, hãy thêm index; nếu bảng inner lớn, hãy tăng {{work_mem}} để hash join chạy trong RAM, hoặc rewrite query để giảm cardinality của bảng inner (CTE, subquery filter sớm).

### Liên hệ phỏng vấn
Interviewer thường yêu cầu: "Bạn thấy execution plan có Nested Loop với loops = 200.000, bạn sẽ làm gì?" Câu trả lời senior không chỉ là "thêm index" mà còn phân tích: kiểm tra kích thước bảng, xem có thể giảm bảng phải bằng subquery hoặc CTE không, kiểm tra RAM và work_mem (PostgreSQL) để hash join có thể chạy trong bộ nhớ, và đo lại sau mỗi thay đổi bằng {{EXPLAIN (ANALYZE, BUFFERS)}}.
`,
  exercises: [
    {
      title: 'Tự viết nested-loop join và đếm số phép so sánh khóa',
      prompt: `Viết lớp {{JoinEngine}} mô phỏng cách DB thực hiện join:

- {{nestedLoopJoin(List<Record> left, List<Record> right)}}: trả về danh sách các cặp {{(left, right)}} có cùng {{id}} theo thuật toán nested-loop. Đồng thời đếm số lần so sánh khóa ({{left.id == right.id}}) và lưu vào trường {{comparisonCountNested}}.
- {{hashJoin(List<Record> left, List<Record> right)}}: xây một bảng băm trên bảng nhỏ hơn (dùng {{java.util.HashMap}}), rồi tra cứu bảng còn lại. Đếm số lần so sánh khóa (khi xây bảng băm không tính, chỉ tính khi tra cứu) và lưu vào {{comparisonCountHash}}.
- {{getNestedCount()}} và {{getHashCount()}}: trả về số đếm tương ứng.

{{Record}} là một class có sẵn: có field {{id}} (int) và {{value}} (String). Không được thay đổi class {{Record}}.

Yêu cầu: cả hai thuật toán phải trả về cùng kết quả (cùng số cặp, không trùng lặp theo thứ tự thêm vào; thứ tự cặp trong danh sách kết quả không quan trọng nhưng phải chứa đúng các cặp khớp).`,
      starter: `class JoinEngine {
    private int nestedCount = 0;
    private int hashCount = 0;

    int getNestedCount() { return nestedCount; }
    int getHashCount() { return hashCount; }

    List<String[]> nestedLoopJoin(List<Record> left, List<Record> right) {
        throw new UnsupportedOperationException("TODO");
    }

    List<String[]> hashJoin(List<Record> left, List<Record> right) {
        throw new UnsupportedOperationException("TODO");
    }
}

class Record {
    public final int id;
    public final String value;
    Record(int id, String value) { this.id = id; this.value = value; }
}`,
      tests: `public class Main {
    static int passed = 0, total = 0;
    static void check(String name, Runnable r) {
        total++;
        try { r.run(); passed++; System.out.println("PASS " + name); }
        catch (Throwable t) { System.out.println("FAIL " + name + ": " + t); }
    }
    static void eqArr(List<String[]> a, List<String[]> b) {
        if (a.size() != b.size()) throw new AssertionError("size " + a.size() + " vs " + b.size());
        for (String[] p : a) {
            boolean found = false;
            for (String[] q : b) {
                if (java.util.Arrays.equals(p, q)) { found = true; break; }
            }
            if (!found) throw new AssertionError("cặp thiếu: " + java.util.Arrays.toString(p));
        }
    }
    public static void main(String[] args) {
        JoinEngine engine = new JoinEngine();
        check("nested loop basic", () -> {
            List<Record> left = java.util.Arrays.asList(new Record(1, "a"), new Record(2, "b"));
            List<Record> right = java.util.Arrays.asList(new Record(2, "x"), new Record(3, "y"));
            List<String[]> res = engine.nestedLoopJoin(left, right);
            java.util.List<String[]> expected = new java.util.ArrayList<>();
            expected.add(new String[]{"b", "x"});
            eqArr(res, expected);
        });
        check("hash join same result", () -> {
            JoinEngine e2 = new JoinEngine();
            List<Record> left = java.util.Arrays.asList(new Record(1, "a"), new Record(2, "b"), new Record(3, "c"));
            List<Record> right = java.util.Arrays.asList(new Record(2, "x"), new Record(2, "y"), new Record(4, "z"));
            List<String[]> res = e2.hashJoin(left, right);
            if (res.size() != 2) throw new AssertionError("mong đợi 2 cặp, có " + res.size());
        });
        check("nested comparison count = n*m", () -> {
            JoinEngine e3 = new JoinEngine();
            List<Record> left = java.util.Arrays.asList(new Record(1, "a"), new Record(2, "b"));
            List<Record> right = java.util.Arrays.asList(new Record(3, "x"), new Record(4, "y"), new Record(5, "z"));
            e3.nestedLoopJoin(left, right);
            if (e3.getNestedCount() != 6) throw new AssertionError("mong đợi 6, có " + e3.getNestedCount());
        });
        check("hash comparison count lower", () -> {
            JoinEngine e4 = new JoinEngine();
            List<Record> left = java.util.Arrays.asList(new Record(1, "a"), new Record(2, "b"));
            List<Record> right = java.util.Arrays.asList(new Record(1, "x"), new Record(3, "y"));
            e4.hashJoin(left, right);
            if (e4.getHashCount() >= 6) throw new AssertionError("hash join phải có ít so sánh hơn nested-loop (6), có " + e4.getHashCount());
        });
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
      reference: `class JoinEngine {
    private int nestedCount = 0;
    private int hashCount = 0;

    int getNestedCount() { return nestedCount; }
    int getHashCount() { return hashCount; }

    List<String[]> nestedLoopJoin(List<Record> left, List<Record> right) {
        nestedCount = 0;
        List<String[]> result = new java.util.ArrayList<>();
        for (Record l : left) {
            for (Record r : right) {
                nestedCount++;
                if (l.id == r.id) {
                    result.add(new String[]{l.value, r.value});
                }
            }
        }
        return result;
    }

    List<String[]> hashJoin(List<Record> left, List<Record> right) {
        hashCount = 0;
        List<Record> build = left.size() <= right.size() ? left : right;
        List<Record> probe = left.size() <= right.size() ? right : left;
        java.util.Map<Integer, java.util.List<String>> map = new java.util.HashMap<>();
        for (Record r : build) {
            map.computeIfAbsent(r.id, k -> new java.util.ArrayList<>()).add(r.value);
        }
        List<String[]> result = new java.util.ArrayList<>();
        for (Record l : probe) {
            java.util.List<String> matches = map.get(l.id);
            if (matches != null) {
                hashCount++;
                for (String val : matches) {
                    result.add(new String[]{l.value, val});
                }
            }
        }
        return result;
    }
}

class Record {
    public final int id;
    public final String value;
    Record(int id, String value) { this.id = id; this.value = value; }
}`,
      hints: [
        'Nested-loop: hai vòng for lồng nhau, đếm bằng một biến int tăng mỗi lần so sánh khóa.',
        'Hash join: xây HashMap từ bảng nhỏ, rồi duyệt bảng còn lại và tra cứu. Đếm số lần tra cứu (get) thành công.',
      ],
      explain: `Nested-loop luôn là {{O(n × m)}} vì phải duyệt từng cặp. Hash join giảm xuống gần {{O(n + m)}} nhờ bảng băm, nhưng chỉ khi khóa join bằng và không có hàm trên khóa. Nếu bạn thấy một query có {{loops}} rất cao trong {{EXPLAIN ANALYZE}}, khả năng DB đang phải duyệt lặp nhiều lần vì thiếu index phù hợp hoặc bảng phải quá lớn để hash join.`
    },
  ],
  check: [
    {
      q: 'Nested-loop join trên hai bảng có 1.000 và 2.000 dòng (không index) cần bao nhiêu lần so sánh khóa?',
      options: ['1.000', '2.000', '2.000.000', '3.000'],
      answer: 2,
      explain: `Mỗi dòng trong bảng trái (1.000) phải duyệt hết bảng phải (2.000): 1.000 × 2.000 = 2.000.000.`
    },
    {
      q: 'Hash join thường nhanh hơn nested-loop khi nào?',
      options: ['Bảng phải có index phù hợp', 'Cả hai bảng đều nhỏ (dưới 100 dòng)', 'Hai bảng lớn và khóa join bằng, bảng băm vừa RAM', 'Có điều kiện {{WHERE a.id > b.id}}'],
      answer: 2,
      explain: `Hash join phát huy khi dữ liệu lớn và khóa bằng, vì tra cứu bảng băm là O(1). Index trên bảng phải giúp nested-loop nhanh hơn, nhưng không thay đổi bản chất O(n log m). Điều kiện không bằng (như >) thường khiến DB chọn nested-loop.`
    },
    {
      q: 'Trong production, bạn thấy một join có loops = 500.000 và thời gian tăng đột biến. Bước kiểm tra đầu tiên là gì?',
      options: ['Tăng RAM ngay', 'Kiểm tra execution plan xem DB chọn thuật toán nào và bảng nào làm inner', 'Xoá index trên bảng phải', 'Chia query thành hai subquery'],
      answer: 1,
      explain: `Trước khi tối ưu, phải đọc execution plan để biết thuật toán, thứ tự bảng, và liệu bảng phải bị duyệt nhiều lần do thiếu index hay bảng băm bị đổ đĩa. Tăng RAM mà không hiểu nguyên nhân có thể không giải quyết.`
    },
  ],
  related: ['collections-005', 'db-001'],
  tags: ['join', 'hash join', 'nested loop', 'execution plan'],
},
{
  id: 'lesson-sql-002',
  track: 'sql',
  order: 2,
  title: 'Keyset pagination và offset pagination trên TreeMap',
  level: 'senior',
  minutes: 25,
  goals: [
    'Giải thích được vì sao offset pagination chậm dần khi trang càng xa',
    'Cài được keyset pagination bằng TreeMap để tra cứu O(log n) theo khóa',
    'Đếm đúng số dòng phải duyệt và so sánh chi phí giữa hai cách',
  ],
  body: `### Tóm tắt:
Pagination không chỉ là "chia trang". Khi người dùng bấm "trang 5.000" trên một danh sách 10 triệu bản ghi, cách bạn viết query quyết định liệu DB phải đọc 5.000 dòng hay 5 triệu dòng. Hai chiến lược chính là **offset pagination** ({{OFFSET 0 LIMIT 20}}) và **keyset pagination** (tra cứu theo khóa đã sắp xếp). Hiểu rõ chi phí của mỗi cách giúp bạn chọn đúng khi xây dựng API phân trang.

### Offset pagination: đơn giản nhưng tốn dần
Offset pagination dùng một câu SQL như:

~~~sql
SELECT * FROM orders ORDER BY created_at DESC
LIMIT 20 OFFSET 100000;
~~~

DB phải đọc và sắp xếp toàn bộ dữ liệu (hoặc ít nhất duyệt qua 100.020 dòng) để biết dòng nào nằm ở vị trí 100.000. Khi offset càng lớn, chi phí gần như tuyến tính tăng. Trên PostgreSQL, một query với {{OFFSET 10_000_000}} có thể chạy hàng chục giây dù chỉ trả về 20 dòng, vì DB phải đọc, sắp xếp, rồi bỏ đi tất cả dòng trước đó.

> Pitfall thực tế: nhiều framework (Django, Rails mặc định) dùng offset. Khi người dùng mở trang cuối cùng hoặc một bot crawl liên tục bấm "trang tiếp", DB bị kéo vào vòng lặp đọc hàng triệu dòng chỉ để trả 20 dòng mới. Điều này là nguyên nhân phổ biến khiến một trang web "tự sập" dưới tải nhẹ.

### Keyset pagination: tra cứu theo khóa đã sắp xếp
Thay vì đếm từ đầu, bạn lưu khóa cuối cùng của trang trước và yêu cầu DB chỉ lấy các dòng có khóa "lớn hơn" (hoặc "nhỏ hơn" tùy thứ tự) khóa đó:

~~~sql
SELECT * FROM orders
WHERE (created_at < '2024-05-01 10:00:00')
   OR (created_at = '2024-05-01 10:00:00' AND id < 99999)
ORDER BY created_at DESC, id DESC
LIMIT 20;
~~~

DB có thể dùng index trên {{(created_at, id)}} để nhảy trực tiếp đến vị trí khóa đó: **O(log n)** để tìm điểm bắt đầu, rồi chỉ đọc 20 dòng tiếp theo. Chi phí không phụ thuộc vào độ sâu của trang.

### Mô phỏng bằng TreeMap: vì sao dùng cấu trúc có thứ tự?
Nếu bạn muốn mô phỏng cách DB giữ thứ tự và tra cứu theo khóa trong bộ nhớ, {{TreeMap<K, V>}} là lựa chọn đúng: mỗi thao tác {{put}}, {{get}}, {{floorKey}}, {{higherKey}} là **O(log n)** nhờ cây đỏ-đen tự cân bằng. Bạn có thể dùng {{floorEntry(amount)}} để tìm bậc phí lớn nhất ≤ số tiền (như bài trước), hoặc dùng {{higherKey(lastKey)}} để tìm khóa bắt đầu trang tiếp theo (lưu ý: TreeMap dùng natural ordering, khóa phải implements Comparable).

| Cách | Chi phí tra cứu | Chi phí mỗi trang xa | Khi nào phù hợp |
|---|---|---|---|
| Offset | O(1) câu SQL | Tăng tuyến tính (O(offset)) | Dữ liệu nhỏ, trang gần đầu |
| Keyset (index) | O(log n) tìm khóa + đọc k dòng | O(log n) + O(k), không đổi | Dữ liệu lớn, trang bất kỳ |

### Đếm số dòng phải duyệt
Một câu hỏi phỏng vấn kinh điển: "Trang 100.000 với offset 20 phải duyệt bao nhiêu dòng?" Đáp án: DB phải duyệt và sắp xếp **100.020 dòng** (hoặc nhiều hơn tùy chỉ số và điều kiện). Với keyset, dù trang 1 hay trang 1.000.000, DB chỉ phải tìm một khóa rồi đọc 20 dòng: chi phí gần như không đổi. Đây là lý do các hệ thống như Instagram, Twitter không bao giờ dùng offset cho feed vô hạn.

> Senior tip: khi thiết kế API, đừng trả về số tổng trang ({{totalPages}}) cho dữ liệu lớn, vì đếm tổng mất O(n). Thay vào đó, trả về một {{cursor}} (khóa cuối của trang hiện tại) và một cờ {{hasMore}}. Client dùng cursor đó cho lần gọi tiếp theo, không cần biết mình đang ở trang nào — đúng mô hình "vô hạn cuộn".

> Senior tip: Offset pagination còn có vấn đề khi dữ liệu thay đổi (insert/delete giữa quá trình phân trang): dòng bị trùng hoặc mất. Keyset pagination an toàn hơn nếu khóa là immutable (như id tự tăng, timestamp tạo), nhưng nếu user sửa khóa sắp xếp (ví dụ đổi created_at), cursor có thể không còn hợp lệ.

### Liên hệ phỏng vấn
Interviewer thường hỏi: "Vì sao keyset pagination không dùng được khi người dùng muốn nhảy từ trang 1 đến trang 50 trực tiếp?" Câu trả lời senior là: đúng, keyset yêu cầu bạn phải đi tuần tự hoặc lưu cursor của trang đích; nhưng trong thực tế, người dùng hiếm khi nhảy xa, và chi phí của offset quá lớn khiến bạn phải đánh đổi. Nếu thực sự cần nhảy xa, hãy dùng một bảng phụ hoặc vật liệu hóa (materialized view) giữ sẵn thứ tự.
`,
  exercises: [
    {
      title: 'Mô phỏng pagination bằng TreeMap và đếm số dòng duyệt',
      prompt: `Viết lớp {{PaginationSim}} mô phỏng cách DB giữ dữ liệu có thứ tự và thực hiện pagination:

- Constructor {{PaginationSim(List<Record> data)}}: lưu dữ liệu vào một {{TreeMap<Long, Record>}} với khóa là {{record.id}}. Nếu có trùng {{id}}, giá trị mới ghi đè giá trị cũ (giống {{TreeMap.put}}).
- {{getPageWithOffset(long offset, int limit)}}: trả về danh sách {{Record}} bắt đầu từ dòng có chỉ số {{offset}} (tính từ 0, theo thứ tự khóa tăng dần). Đếm số dòng phải duyệt (tức số lần phải đi qua các entry trong TreeMap để đến vị trí {{offset + limit - 1}}) và lưu vào {{traversedWithOffset}}.
- {{getPageWithKeyset(Long lastId, int limit)}}: nếu {{lastId == null}} thì bắt đầu từ dòng đầu tiên; ngược lại lấy các dòng có khóa > {{lastId}}. Đếm số dòng phải duyệt từ gốc cây đến vị trí cần thiết và lưu vào {{traversedWithKeyset}}.
- {{getTraversedOffset()}} và {{getTraversedKeyset()}}: trả về số đếm tương ứng.

Yêu cầu: cả hai phương pháp phải trả về đúng các dòng theo thứ tự khóa tăng dần. Không dùng {{subList}} trên một danh sách thông thường (vì nó không mô phỏng được chi phí duyệt).
`,
      starter: `class Record {
    public final int id;
    public final String value;
    Record(int id, String value) { this.id = id; this.value = value; }
}

class PaginationSim {
    private int traversedOffset = 0;
    private int traversedKeyset = 0;

    int getTraversedOffset() { return traversedOffset; }
    int getTraversedKeyset() { return traversedKeyset; }

    PaginationSim(java.util.List<Record> data) {
        throw new UnsupportedOperationException("TODO");
    }

    java.util.List<Record> getPageWithOffset(long offset, int limit) {
        throw new UnsupportedOperationException("TODO");
    }

    java.util.List<Record> getPageWithKeyset(Long lastId, int limit) {
        throw new UnsupportedOperationException("TODO");
    }
}`,
      tests: `public class Main {
    static int passed = 0, total = 0;
    static void check(String name, Runnable r) {
        total++;
        try { r.run(); passed++; System.out.println("PASS " + name); }
        catch (Throwable t) { System.out.println("FAIL " + name + ": " + t); }
    }
    public static void main(String[] args) {
        java.util.List<Record> data = new java.util.ArrayList<>();
        for (int i = 1; i <= 10; i++) data.add(new Record(i, "v" + i));
        check("keyset first page", () -> {
            PaginationSim sim = new PaginationSim(data);
            java.util.List<Record> page = sim.getPageWithKeyset(null, 3);
            if (page.size() != 3) throw new AssertionError("mong đợi 3 dòng, có " + page.size());
        });
        check("offset traverses more as offset grows", () -> {
            PaginationSim sim2 = new PaginationSim(data);
            sim2.getPageWithOffset(0, 2);
            int first = sim2.getTraversedOffset();
            sim2.getPageWithOffset(8, 2);
            int deep = sim2.getTraversedOffset();
            if (deep <= first) throw new AssertionError("offset xa phải duyệt nhiều hơn: " + deep + " vs " + first);
        });
        check("keyset lower than offset for deep page", () -> {
            PaginationSim sim3 = new PaginationSim(data);
            sim3.getPageWithOffset(8, 2);
            int offDeep = sim3.getTraversedOffset();
            PaginationSim sim4 = new PaginationSim(data);
            sim4.getPageWithKeyset(7L, 2);
            int keyDeep = sim4.getTraversedKeyset();
            if (keyDeep >= offDeep) throw new AssertionError("keyset phải duyệt ít hơn hoặc bằng: " + keyDeep + " vs " + offDeep);
        });
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
      reference: `class Record {
    public final int id;
    public final String value;
    Record(int id, String value) { this.id = id; this.value = value; }
}

class PaginationSim {
    private java.util.TreeMap<Long, Record> tree = new java.util.TreeMap<>();
    private int traversedOffset = 0;
    private int traversedKeyset = 0;

    int getTraversedOffset() { return traversedOffset; }
    int getTraversedKeyset() { return traversedKeyset; }

    PaginationSim(java.util.List<Record> data) {
        for (Record r : data) tree.put((long) r.id, r);
    }

    java.util.List<Record> getPageWithOffset(long offset, int limit) {
        traversedOffset = 0;
        java.util.List<Record> result = new java.util.ArrayList<>();
        int skipped = 0;
        for (java.util.Map.Entry<Long, Record> e : tree.entrySet()) {
            traversedOffset++;
            if (skipped < offset) { skipped++; continue; }
            result.add(e.getValue());
            if (result.size() >= limit) break;
        }
        return result;
    }

    java.util.List<Record> getPageWithKeyset(Long lastId, int limit) {
        traversedKeyset = 0;
        java.util.List<Record> result = new java.util.ArrayList<>();
        java.util.Map.Entry<Long, Record> start = lastId == null ? tree.firstEntry() : tree.higherEntry(lastId);
        // Đếm từ gốc đến vị trí bắt đầu (mô phỏng chi phí tìm khóa)
        traversedKeyset = Math.max(0, lastId == null ? 1 : 2);
        java.util.Iterator<java.util.Map.Entry<Long, Record>> it = (start == null ? java.util.Collections.<java.util.Map.Entry<Long, Record>>emptyList().iterator() : java.util.Collections.singleton(start).iterator());
        // Cách đơn giản: duyệt từ start trở đi
        java.util.NavigableSet<Long> keys = tree.navigableKeySet();
        java.util.Iterator<Long> it2 = (lastId == null ? keys.iterator() : keys.tailSet(lastId, false).iterator());
        while (it2.hasNext() && result.size() < limit) {
            traversedKeyset++;
            Long k = it2.next();
            result.add(tree.get(k));
        }
        return result;
    }
}`,
      hints: [
        'Dùng {{TreeMap<Long, Record>}} với khóa là {{(long) r.id}}. Khi có trùng id, {{put}} tự ghi đè.',
        'Offset pagination phải duyệt từ đầu đến vị trí {{offset + limit - 1}} để biết phải bỏ những dòng nào.',
        'Keyset pagination dùng {{tailSet(lastId, false)}} để lấy các khóa lớn hơn hẳn {{lastId}}.',
      ],
      explain: `TreeMap giữ thứ tự khóa và cho phép tra cứu khoảng bằng {{tailSet}} hay {{higherEntry}}. Chi phí tìm khóa bắt đầu là O(log n), còn offset phải duyệt từ đầu — đó chính là lý do offset chậm dần. Nếu bạn muốn mô phỏng chính xác hơn, hãy đếm từng lần duyệt entry trong vòng lặp.`
    },
  ],
  check: [
    {
      q: 'Một API dùng {{LIMIT 20 OFFSET 500000}} trên bảng 10 triệu dòng. Chi phí chính của DB là gì?',
      options: ['Chỉ đọc 20 dòng từ đĩa', 'Phải đọc, sắp xếp và bỏ đi 500.020 dòng', 'Tính hash cho 500.000 dòng', 'Tạo một bảng tạm mới'],
      answer: 1,
      explain: `DB phải xử lý ít nhất 500.020 dòng để biết dòng nào ở vị trí 500.000, dù chỉ trả về 20.`
    },
    {
      q: 'Vì sao keyset pagination không phù hợp khi người dùng muốn nhảy từ trang 1 sang trang 100 trực tiếp?',
      options: ['Vì TreeMap không hỗ trợ nhảy xa', 'Vì phải biết khóa cuối của trang 99, mà không có sẵn', 'Vì chi phí của keyset tăng theo khoảng cách nhảy', 'Vì DB không cho phép ORDER BY trên nhiều cột'],
      answer: 1,
      explain: `Keyset yêu cầu bạn có khóa cuối của trang trước; nếu người dùng chỉ có số trang, bạn không thể tính khóa đó mà không duyệt từ đầu — tức là bạn lại rơi vào vấn đề của offset.`
    },
    {
      q: 'Một bảng có chỉ số trên {{(created_at DESC, id DESC)}}. Câu SQL nào là keyset pagination đúng?',
      options: ['SELECT * FROM t ORDER BY created_at DESC LIMIT 20 OFFSET 1000', 'SELECT * FROM t WHERE created_at < ? ORDER BY created_at DESC, id DESC LIMIT 20', 'SELECT * FROM t WHERE id > 5000 ORDER BY id DESC LIMIT 20', 'SELECT * FROM t GROUP BY created_at OFFSET 1000 LIMIT 20'],
      answer: 1,
      explain: `Keyset pagination dùng điều kiện khóa (< hoặc > tùy thứ tự) và giữ nguyên ORDER BY để DB dùng index.`
    },
  ],
  related: ['sql-001', 'db-001', 'collections-004'],
  tags: ['pagination', 'keyset', 'offset', 'TreeMap'],
},
{
  id: 'lesson-sql-003',
  track: 'sql',
  order: 3,
  title: 'Window function: ROW_NUMBER và running total bằng stream',
  level: 'lead',
  minutes: 30,
  goals: [
    'Giải thích cơ chế window function: partition, order, frame',
    'Tự cài ROW_NUMBER() và SUM() over bằng stream trên danh sách đã sắp xếp',
    'Nhận biết lỗi phổ biến khi tự viết window bằng vòng lặp (race condition, sai thứ tự)',
  ],
  body: `### Tóm tắt:
Window function (hay analytic function) cho phép bạn tính toán trên một "cửa sổ" các dòng liên quan mà không phải gộp nhóm như {{GROUP BY}}. Ba thành phần chính là:
- **Partition**: chia dữ liệu thành các nhóm (ví dụ theo {{user_id}}).
- **Order**: thứ tự trong mỗi nhóm (ví dụ theo {{created_at DESC}}).
- **Frame**: phạm vi các dòng tính toán (ví dụ từ đầu nhóm đến dòng hiện tại cho running total, hoặc toàn bộ nhóm cho xếp hạng).

Nếu bạn từng viết một vòng lặp {{for}} để tính tổng tích lũy hoặc đánh số thứ tự, bạn đang tự mô phỏng một window function bằng tay — và đó là nơi nhiều lỗi logic và hiệu năng phát sinh.

### ROW_NUMBER(): đánh số thứ tự trong mỗi nhóm
{{ROW_NUMBER() OVER (PARTITION BY dept ORDER BY salary DESC)}} gán số 1 cho dòng có lương cao nhất trong mỗi phòng ban, số 2 cho dòng tiếp theo, v.v. Nếu bạn tự viết bằng vòng lặp:

~~~java
// Tự viết: sắp xếp toàn bộ danh sách theo (dept, salary DESC)
// rồi duyệt và tăng số khi dept thay đổi
~~~

Vấn đề là bạn phải sắp xếp toàn bộ dữ liệu trước, và mỗi lần thêm một dòng mới bạn phải tính lại từ đầu hoặc duy trì một cấu trúc phụ phức tạp. Với stream trong Java, bạn có thể mô phỏng bằng cách:
1. Sắp xếp danh sách theo khóa phân vùng và khóa sắp xếp.
2. Duyệt một lần, giữ trạng thái nhóm hiện tại và đếm số dòng trong nhóm đó.

### Running total (SUM() OVER): tổng tích lũy theo thứ tự
{{SUM(amount) OVER (PARTITION BY user ORDER BY date)}} tính tổng tích lũy cho từng người dùng theo thời gian. Nếu bạn tự viết bằng mảng và vòng lặp, bạn phải duy trì một bản đồ từ người dùng đến tổng hiện tại, và mỗi dòng mới phải cập nhật bản đồ đó. Với dữ liệu lớn (hàng triệu dòng), chi phí cập nhật bản đồ có thể trở thành nút thắt cổ chai nếu bạn dùng cấu trúc không hiệu quả.

| Thành phần window | Ý nghĩa | Tự viết bằng stream |
|---|---|---|
| {{PARTITION BY}} | Nhóm dữ liệu | Sắp xếp theo khóa nhóm, duyệt và phát hiện thay đổi |
| {{ORDER BY}} | Thứ tự trong nhóm | Sắp xếp trước, duyệt tuần tự |
| {{ROWS UNBOUNDED PRECEDING}} | Từ đầu nhóm đến hiện tại | Giữ tổng tích lũy, cộng thêm giá trị mới |
| {{RANK()}} | Xếp hạng có khoảng cách | Đếm số dòng khác giá trị trước đó |

### Vì sao DB tối ưu window function tốt hơn vòng lặp tay?
DBMS thường thực hiện window function bằng một thuật toán gọi là **stream aggregation**: một lần duyệt dữ liệu đã sắp xếp, giữ một bộ đệm nhỏ cho mỗi nhóm. Chi phí gần như tuyến tính với số dòng, vì mỗi dòng chỉ được xử lý một lần. Nếu bạn tự viết bằng vòng lặp lồng (so sánh từng cặp để tìm thứ hạng), chi phí là bình phương.

> Pitfall thực tế: một developer tự viết một hàm tính tổng tích lũy bằng cách duyệt lại từ đầu danh sách cho mỗi dòng mới (O(n²) trên n dòng). Khi dữ liệu tăng từ 10.000 lên 500.000 dòng, thời gian chạy từ 50 ms lên 10 phút. Giải pháp đúng là duy trì một bản đồ tổng tích lũy và cập nhật một lần cho mỗi dòng mới.

> Senior tip: Trong PostgreSQL, window function chạy sau WHERE/GROUP BY/HAVING nhưng trước LIMIT/OFFSET. Nếu bạn dùng ROW_NUMBER() trong subquery rồi filter ở ngoài (WHERE rn <= 10), DB vẫn tính window function cho tất cả dòng trước khi LIMIT — hãy dùng {{LIMIT}} bên trong subquery hoặc dùng {{FETCH FIRST}} (SQL standard) khi có thể.

### Tự cài bằng stream: giữ trạng thái và duyệt tuần tự
Với Java 17, bạn có thể dùng {{Stream.sorted()}} và một vòng lặp đơn giản để mô phỏng. Điều quan trọng là phải duy trì đúng trạng thái: khi khóa phân vùng thay đổi, bạn phải đặt lại đếm và tổng tích lũy về 0. Nếu bạn quên điều này, kết quả sẽ bị "rò" dữ liệu từ nhóm trước sang nhóm sau — một lỗi rất khó phát hiện trong test nhỏ nhưng rõ ràng khi dữ liệu thực tế có nhiều nhóm xen kẽ.

### Liên hệ phỏng vấn
Interviewer hay hỏi: "Làm thế nào để tính tổng tích lũy cho 100 triệu dòng mà không dùng window function?" Câu trả lời senior không chỉ là "dùng HashMap giữ tổng theo khóa", mà còn phải đề cập đến việc sắp xếp dữ liệu trước (vì thứ tự là bắt buộc), chi phí bộ nhớ cho bản đồ tổng, và cách tránh race condition nếu dữ liệu đến từ nhiều thread (dùng {{ConcurrentHashMap}} và cập nhật nguyên tử bằng {{merge}}).
`,
  exercises: [
    {
      title: 'Tự viết ROW_NUMBER và running total bằng stream',
      prompt: `Viết lớp {{WindowEngine}} mô phỏng hai window function cơ bản trên danh sách {{Record}} đã sắp xếp:

- {{rowNumber(List<Record> records, String groupKey)}}: mỗi {{Record}} có các trường {{group}} (String), {{value}} (int). Trả về danh sách các số thứ tự (bắt đầu từ 1) trong mỗi nhóm {{group}}, theo thứ tự tăng dần của {{value}}. Nếu hai dòng cùng nhóm và cùng {{value}}, số thứ tự phải liên tục và không bị nhảy (tức hai dòng cùng giá trị vẫn nhận số khác nhau, theo thứ tự xuất hiện trong danh sách đã sắp xếp).
- {{runningTotal(List<Record> records, String groupKey)}}: trả về danh sách các tổng tích lũy (tổng từ dòng đầu tiên của nhóm đến dòng hiện tại, theo thứ tự tăng {{value}}) cho mỗi dòng trong nhóm.

Yêu cầu: không dùng thư viện ngoài JDK. Dùng {{List.sort()}} hoặc {{Stream.sorted()}} để sắp xếp trước khi duyệt. Không thay đổi thứ tự trong danh sách gốc.
`,
      starter: `class Record {
    public final String group;
    public final int value;
    Record(String group, int value) { this.group = group; this.value = value; }
    String getGroup() { return group; }
    int getValue() { return value; }
}

class WindowEngine {
    List<Integer> rowNumber(List<Record> records, String groupKey) {
        throw new UnsupportedOperationException("TODO");
    }

    List<Integer> runningTotal(List<Record> records, String groupKey) {
        throw new UnsupportedOperationException("TODO");
    }
}`,
      tests: `public class Main {
    static int passed = 0, total = 0;
    static void check(String name, Runnable r) {
        total++;
        try { r.run(); passed++; System.out.println("PASS " + name); }
        catch (Throwable t) { System.out.println("FAIL " + name + ": " + t); }
    }
    public static void main(String[] args) {
        check("row number basic", () -> {
            WindowEngine w = new WindowEngine();
            List<Record> recs = java.util.Arrays.asList(
                new Record("A", 10), new Record("B", 20), new Record("A", 30)
            );
            List<Integer> rows = w.rowNumber(recs, "group");
            // Sau sắp xếp theo group rồi value: A(10) -> 1, A(30) -> 2, B(20) -> 1
            // Nhưng kết quả phải tương ứng với thứ tự sắp xếp, không phải thứ tự gốc
            if (rows.size() != 3) throw new AssertionError("mong đợi 3, có " + rows.size());
        });
        check("running total basic", () -> {
            WindowEngine w = new WindowEngine();
            List<Record> recs = java.util.Arrays.asList(
                new Record("X", 5), new Record("X", 15), new Record("Y", 7)
            );
            List<Integer> totals = w.runningTotal(recs, "group");
            // Sau sắp xếp theo group, value: X(5) -> 5, X(15) -> 20, Y(7) -> 7
            if (totals.get(0) != 5) throw new AssertionError("mong đợi 5, có " + totals.get(0));
            if (totals.get(1) != 20) throw new AssertionError("mong đợi 20, có " + totals.get(1));
        });
        check("row number with same value", () -> {
            WindowEngine w = new WindowEngine();
            List<Record> recs = java.util.Arrays.asList(
                new Record("G", 10), new Record("G", 10), new Record("G", 20)
            );
            List<Integer> rows = w.rowNumber(recs, "group");
            // Sau sắp xếp: G(10) -> 1, G(10) -> 2, G(20) -> 3
            if (rows.get(0) != 1 || rows.get(1) != 2 || rows.get(2) != 3)
                throw new AssertionError("thứ tự sai cho cùng giá trị");
        });
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
      reference: `class Record {
    public final String group;
    public final int value;
    Record(String group, int value) { this.group = group; this.value = value; }
    String getGroup() { return group; }
    int getValue() { return value; }
}

class WindowEngine {
    List<Integer> rowNumber(List<Record> records, String groupKey) {
        List<Record> sorted = new java.util.ArrayList<>(records);
        sorted.sort((a, b) -> {
            int cmp = a.getGroup().compareTo(b.getGroup());
            if (cmp != 0) return cmp;
            return Integer.compare(a.getValue(), b.getValue());
        });
        List<Integer> result = new java.util.ArrayList<>();
        String currentGroup = null;
        int rowNum = 0;
        for (Record r : sorted) {
            if (!r.getGroup().equals(currentGroup)) {
                currentGroup = r.getGroup();
                rowNum = 1;
            } else {
                rowNum++;
            }
            result.add(rowNum);
        }
        return result;
    }

    List<Integer> runningTotal(List<Record> records, String groupKey) {
        List<Record> sorted = new java.util.ArrayList<>(records);
        sorted.sort((a, b) -> {
            int cmp = a.getGroup().compareTo(b.getGroup());
            if (cmp != 0) return cmp;
            return Integer.compare(a.getValue(), b.getValue());
        });
        List<Integer> result = new java.util.ArrayList<>();
        String currentGroup = null;
        int runningSum = 0;
        for (Record r : sorted) {
            if (!r.getGroup().equals(currentGroup)) {
                currentGroup = r.getGroup();
                runningSum = 0;
            }
            runningSum += r.getValue();
            result.add(runningSum);
        }
        return result;
    }
}`,
      hints: [
        'Sắp xếp bản sao của danh sách gốc bằng {{new ArrayList<>(records)}} rồi {{sort()}}.',
        'Khi nhóm thay đổi ({{!group.equals(currentGroup)}}), đặt lại đếm hoặc tổng về 0.',
        'Nếu hai dòng cùng nhóm và cùng giá trị, số thứ tự vẫn phải liên tục (không bỏ qua số).',
      ],
      explain: `Tự viết window bằng vòng lặp đòi hỏi bạn phải duy trì đúng trạng thái: mỗi lần nhóm thay đổi, tổng tích lũy phải về 0; số thứ tự phải bắt đầu từ 1. Nếu bạn quên điều này, kết quả sẽ "rò" từ nhóm trước. Trong sản xuất, luôn dùng DBMS tích hợp (PostgreSQL, Oracle) thay vì tự viết bằng tay, trừ khi bạn đang mô phỏng trên một hệ thống không có SQL (ví dụ xử lý dữ liệu từ Kafka).`
    },
  ],
  check: [
    {
      q: 'Window function {{ROW_NUMBER() OVER (PARTITION BY dept ORDER BY salary DESC)}} gán số 1 cho dòng nào?',
      options: ['Dòng đầu tiên trong bảng', 'Dòng có lương cao nhất trong mỗi phòng ban', 'Dòng có lương thấp nhất trong toàn bảng', 'Dòng cuối cùng trong mỗi phòng ban'],
      answer: 1,
      explain: `{{PARTITION BY dept}} chia theo phòng ban, {{ORDER BY salary DESC}} sắp giảm dần, nên số 1 là dòng lương cao nhất trong phòng.`
    },
    {
      q: 'Khi tự viết running total bằng vòng lặp, lỗi phổ biến nhất khi có nhiều nhóm là gì?',
      options: ['Quên sắp xếp dữ liệu trước', 'Quên đặt lại tổng về 0 khi nhóm mới bắt đầu', 'Dùng int thay vì long cho tổng', 'Không dùng ConcurrentHashMap'],
      answer: 1,
      explain: `Nếu không đặt lại tổng khi nhóm thay đổi, tổng của nhóm sau sẽ cộng dồn từ nhóm trước.`
    },
    {
      q: 'Một query có {{SUM(amount) OVER (ORDER BY date ROWS UNBOUNDED PRECEDING)}}. Frame này có ý nghĩa gì?',
      options: ['Tổng từ dòng đầu tiên đến dòng hiện tại theo thứ tự ngày', 'Tổng toàn bộ bảng', 'Tổng từ dòng hiện tại đến cuối bảng', 'Tổng các dòng có cùng ngày'],
      answer: 0,
      explain: `{{ROWS UNBOUNDED PRECEDING}} nghĩa là từ dòng đầu tiên của cửa sổ (theo ORDER BY) đến dòng hiện tại.`
    },
  ],
  related: ['sql-002', 'collections-002', 'core-012'],
  tags: ['window function', 'row_number', 'running total', 'stream'],
},
);
