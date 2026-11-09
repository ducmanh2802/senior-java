/* Bài học track "sql". Schema & markup: AGENTS.md mục 12. */
(window.LESSONS = window.LESSONS || []).push(
{
  id: 'lesson-sql-001',
  track: 'sql',
  order: 1,
  title: 'Join từ bên trong: nested loop, hash join, merge join và đếm phép so sánh',
  level: 'senior',
  minutes: 30,
  goals: [
    'Mô tả từng bước cách DB thực hiện nested loop join, hash join và merge join',
    'Tính được số phép so sánh của từng thuật toán và giải thích vì sao hash join thắng trên dữ liệu lớn',
    'Đọc được dấu hiệu join chọn sai trong {{EXPLAIN ANALYZE}} (loops lớn, Batches > 1, ước lượng rows sai) và biết cách sửa',
  ],
  body: `### Join không phải phép màu: DB phải chọn một thuật toán
Khi bạn viết {{SELECT ... FROM orders o JOIN customer c ON o.customer_id = c.id}}, SQL chỉ nói **muốn gì**, không nói **làm thế nào**. Bộ tối ưu (planner/optimizer) của DB ước lượng số dòng mỗi bên rồi chọn một trong ba thuật toán join: **nested loop**, **hash join**, **merge join**. Join thường là phần đắt nhất của một query nhiều bảng, và chọn sai thuật toán là lý do phổ biến khiến query từ 10 ms lên 10 giây.

Quy ước gọi tên: bảng được duyệt ở vòng ngoài gọi là **outer**, bảng được tra ở vòng trong gọi là **inner**.

### Nested loop join: đơn giản, rẻ khi outer ít dòng
Cách tự nhiên nhất: lấy từng dòng của outer, rồi tìm các dòng khớp trong inner.

~~~java
// Nested loop KHÔNG có index: mỗi dòng outer duyệt toàn bộ inner
for (Row o : outer) {
    for (Row i : inner) {
        if (o.id == i.id) {          // một phép so sánh khoá
            result.add(pair(o, i));
        }
    }
}
~~~

Với {{n}} dòng outer và {{m}} dòng inner, số phép so sánh là **n × m**. Hai bảng 10.000 dòng là **100 triệu** phép so sánh. Nhưng nếu inner **có index** (B-tree) trên cột join, vòng trong không duyệt hết nữa mà đi xuống cây: khoảng {{log2(m)}} bước mỗi dòng outer, tổng cộng khoảng **n × log m**. Ví dụ outer 100 dòng, inner 10 triệu dòng có index: 100 × 24 ≈ 2.400 bước, nhanh hơn mọi thuật toán khác vì không phải đọc hết 10 triệu dòng.

DB chọn nested loop khi:
- Outer **rất ít dòng** (sau khi lọc WHERE) và inner có index trên khoá join. Đây là trường hợp tốt nhất, rất hay gặp với OLTP ("lấy 20 đơn của khách X kèm tên sản phẩm").
- Điều kiện join **không phải dấu bằng** ({{a.ts BETWEEN b.start AND b.end}}, {{a.x > b.y}}): hash join và merge join không áp dụng được.

### Hash join: build rồi probe
Hash join chạy hai pha:
1. **Build**: đọc bên **nhỏ hơn** (theo ước lượng), đưa từng dòng vào bảng băm trong RAM với khoá là cột join.
2. **Probe**: đọc bên lớn hơn từng dòng, tính hash của khoá rồi tra bảng băm: trung bình **O(1)** mỗi lần tra, không phải so với mọi dòng.

Tổng chi phí khoảng **O(n + m)**: đọc mỗi bên đúng một lần. Điều kiện: join bằng dấu {{=}} (equi-join), và bảng băm nên vừa bộ nhớ. Trên PostgreSQL, giới hạn là {{work_mem}} × {{hash_mem_multiplier}} (mặc định 2.0 từ PG 15). Vượt giới hạn thì PG chia dữ liệu thành nhiều **batch** và ghi tạm ra đĩa; trong {{EXPLAIN ANALYZE}}, node {{Hash}} hiện {{Batches: 1}} là vừa RAM, {{Batches: 8}} nghĩa là đã tràn đĩa và chậm hơn nhiều. MySQL chỉ có hash join từ bản 8.0.18; bản cũ hơn chỉ có nested loop (kèm block nested loop).

### Merge join: hai bên đã sắp xếp thì "kéo khoá" song song
Nếu cả hai bên đều **đã sắp xếp theo khoá join** (nhờ index hoặc nhờ một bước sort), DB dùng hai con trỏ đi song song như khi trộn hai danh sách đã sắp xếp trong merge sort: khoá bên nào nhỏ hơn thì tiến con trỏ bên đó. Chi phí O(n + m) nếu đã có thứ tự sẵn, cộng O(n log n) nếu phải sort. PostgreSQL có merge join; MySQL thì không.

| Thuật toán | Số bước (xấp xỉ) | Bộ nhớ thêm | Hợp khi |
|---|---|---|---|
| Nested loop, inner không index | n × m | gần như không | inner chỉ vài dòng |
| Nested loop, inner có index | n × log m | không đáng kể | outer ít dòng, inner lớn có index |
| Hash join | n + m | bảng băm cỡ bên nhỏ | hai bên đều lớn, join bằng {{=}} |
| Merge join | n + m (+ sort) | ít, nếu đã có thứ tự | hai bên đã sắp xếp sẵn theo khoá |

### Đọc dấu hiệu trong EXPLAIN ANALYZE
PostgreSQL không in "số phép so sánh", nhưng in đủ để bạn suy ra:

~~~text
Nested Loop  (cost=... rows=12 ...) (actual time=0.05..8123.4 rows=48210 loops=1)
  ->  Seq Scan on orders o  (... rows=12 ...) (actual ... rows=48210 loops=1)
        Filter: (status = 'NEW')
  ->  Seq Scan on customer c  (... rows=1 ...) (actual ... rows=1 loops=48210)
        Filter: (id = o.customer_id)
~~~

Đọc từng dòng:
- Planner **ước lượng** outer chỉ có {{rows=12}}, nên nested loop có vẻ rẻ. Thực tế ({{actual rows}}) là 48.210 dòng: ước lượng sai 4.000 lần, thường do thống kê cũ (bảng vừa được nạp nhiều dữ liệu mà chưa {{ANALYZE}}).
- Inner là {{Seq Scan}} với {{loops=48210}}: bảng {{customer}} bị **quét toàn bộ 48.210 lần**. Đó chính là n × m trong bảng trên.
- Cách sửa theo thứ tự: chạy {{ANALYZE orders}} để planner ước lượng đúng (khi đó nó tự chuyển sang hash join); kiểm tra {{customer.id}} có index chưa (khoá chính thì luôn có); nếu cột lọc tương quan nhau mà ước lượng vẫn sai, dùng {{CREATE STATISTICS}} (extended statistics).

> Pitfall thực tế: query chạy 20 ms suốt nhiều tháng, rồi một đêm sau đợt import lớn bỗng mất 8 giây. Code không đổi, index không đổi; thứ đổi là **thống kê**. Planner vẫn tin bảng nhỏ nên chọn nested loop. Autovacuum chạy {{ANALYZE}} theo ngưỡng phần trăm thay đổi, nên với bảng lớn nó có thể chạy trễ; sau batch import lớn, hãy chủ động gọi {{ANALYZE}}.

> Senior tip: khi đọc plan, so **rows ước lượng với actual rows** trước tiên. Lệch hơn 10 lần là nguồn gốc của hầu hết plan tệ. Với hash join, xem {{Batches}}: lớn hơn 1 thì tăng {{work_mem}} **cho riêng session/query đó** ({{SET LOCAL work_mem = '256MB'}} trong transaction), đừng tăng toàn cục vì mỗi node sort/hash của mỗi connection đều được dùng tới mức đó và có thể làm cạn RAM.

### Liên hệ phỏng vấn
Câu hay gặp: "Plan có Nested Loop với loops = 200.000, bạn làm gì?". Câu trả lời yếu là "thêm index". Câu trả lời senior: (1) so rows ước lượng với actual để biết planner có hiểu sai dữ liệu không, (2) xem inner là Seq Scan hay Index Scan, (3) cập nhật thống kê hoặc thêm index trên khoá join, (4) đo lại bằng {{EXPLAIN (ANALYZE, BUFFERS)}} và so số buffer đọc trước/sau. Biết giải thích n × m, n × log m và n + m là điểm cộng lớn vì cho thấy bạn hiểu **vì sao** plan nhanh hay chậm.`,
  exercises: [
    {
      title: 'Tự viết nested loop join và hash join, đếm số bước',
      prompt: `Viết lớp {{JoinEngine}} mô phỏng hai thuật toán join trên khoá {{id}} (equi-join {{left.id = right.id}}).

{{Row}} có sẵn: field {{id}} (int) và {{value}} (String). Mỗi cặp kết quả là mảng hai phần tử {{String[]}} gồm {{left.value}} rồi {{right.value}}, **luôn theo thứ tự trái trước, phải sau**, dù bảng băm được xây từ phía nào. Thứ tự các cặp trong danh sách không quan trọng. Khoá có thể trùng ở cả hai phía (giống join thật: 1 dòng trái khớp 2 dòng phải thì ra 2 cặp).

- {{nestedLoopJoin(left, right)}}: hai vòng lặp lồng nhau. {{getNestedCount()}} trả về **số phép so sánh khoá** đã làm, tức đúng {{left.size() * right.size()}}.
- {{hashJoin(left, right)}}: xây {{HashMap}} từ phía **ít dòng hơn** (bằng nhau thì chọn {{left}}), rồi duyệt phía còn lại và tra map. {{getHashCount()}} trả về **số lần tra bảng băm** ở pha probe, tức số dòng của phía probe (pha build không tính).
- Mỗi lần gọi phải **đặt lại** bộ đếm tương ứng về 0 trước khi đếm.`,
      starter: `class Row {
    final int id;
    final String value;
    Row(int id, String value) { this.id = id; this.value = value; }
}

class JoinEngine {
    private int nestedCount = 0;
    private int hashCount = 0;

    int getNestedCount() { return nestedCount; }
    int getHashCount() { return hashCount; }

    List<String[]> nestedLoopJoin(List<Row> left, List<Row> right) {
        throw new UnsupportedOperationException("TODO");
    }

    List<String[]> hashJoin(List<Row> left, List<Row> right) {
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
    static void eq(Object expected, Object actual) {
        if (!Objects.equals(expected, actual)) throw new AssertionError("expected " + expected + " got " + actual);
    }
    // so sanh nhu multiset: bo qua thu tu cac cap
    static List<String> norm(List<String[]> pairs) {
        List<String> out = new ArrayList<>();
        for (String[] p : pairs) out.add(p[0] + "|" + p[1]);
        Collections.sort(out);
        return out;
    }
    static List<Row> rows(Object... kv) {
        List<Row> out = new ArrayList<>();
        for (int i = 0; i < kv.length; i += 2) out.add(new Row((Integer) kv[i], (String) kv[i + 1]));
        return out;
    }
    public static void main(String[] args) {
        check("nested loop finds matching pair and counts n*m", () -> {
            JoinEngine e = new JoinEngine();
            List<String[]> res = e.nestedLoopJoin(rows(1, "a", 2, "b"), rows(2, "x", 3, "y"));
            eq(List.of("b|x"), norm(res));
            eq(4, e.getNestedCount());
        });
        check("nested loop with no match still compares every pair", () -> {
            JoinEngine e = new JoinEngine();
            List<String[]> res = e.nestedLoopJoin(rows(1, "a", 2, "b"), rows(3, "x", 4, "y", 5, "z"));
            eq(0, res.size());
            eq(6, e.getNestedCount());
        });
        check("hash join handles duplicate keys", () -> {
            JoinEngine e = new JoinEngine();
            List<String[]> res = e.hashJoin(rows(1, "a", 2, "b", 3, "c"), rows(2, "x", 2, "y", 4, "z"));
            eq(List.of("b|x", "b|y"), norm(res));
            eq(3, e.getHashCount());
        });
        check("pairs stay left|right when build side is right", () -> {
            JoinEngine e = new JoinEngine();
            List<String[]> res = e.hashJoin(rows(1, "a", 2, "b", 3, "c", 4, "d"), rows(2, "x", 4, "y"));
            eq(List.of("b|x", "d|y"), norm(res));
            eq(4, e.getHashCount());
        });
        check("both algorithms agree on bigger data; hash does far fewer steps", () -> {
            List<Row> left = new ArrayList<>(), right = new ArrayList<>();
            for (int i = 0; i < 100; i++) left.add(new Row(i, "L" + i));
            for (int i = 0; i < 1000; i++) right.add(new Row(i % 200, "R" + i));
            JoinEngine e = new JoinEngine();
            List<String> nested = norm(e.nestedLoopJoin(left, right));
            List<String> hashed = norm(e.hashJoin(left, right));
            eq(500, nested.size());
            eq(nested, hashed);
            eq(100000, e.getNestedCount());
            eq(1000, e.getHashCount());
        });
        check("counters reset on each call", () -> {
            JoinEngine e = new JoinEngine();
            e.nestedLoopJoin(rows(1, "a", 2, "b"), rows(1, "x", 2, "y"));
            e.nestedLoopJoin(rows(1, "a"), rows(1, "x"));
            eq(1, e.getNestedCount());
            e.hashJoin(rows(1, "a", 2, "b", 3, "c"), rows(1, "x"));
            e.hashJoin(rows(1, "a"), rows(1, "x", 2, "y"));
            eq(2, e.getHashCount());
        });
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
      reference: `class Row {
    final int id;
    final String value;
    Row(int id, String value) { this.id = id; this.value = value; }
}

class JoinEngine {
    private int nestedCount = 0;
    private int hashCount = 0;

    int getNestedCount() { return nestedCount; }
    int getHashCount() { return hashCount; }

    List<String[]> nestedLoopJoin(List<Row> left, List<Row> right) {
        nestedCount = 0;
        List<String[]> result = new ArrayList<>();
        for (Row l : left) {
            for (Row r : right) {
                nestedCount++;                       // moi cap (l, r) la mot phep so sanh khoa
                if (l.id == r.id) result.add(new String[]{l.value, r.value});
            }
        }
        return result;
    }

    List<String[]> hashJoin(List<Row> left, List<Row> right) {
        hashCount = 0;
        boolean buildLeft = left.size() <= right.size();   // build tu phia nho hon
        List<Row> build = buildLeft ? left : right;
        List<Row> probe = buildLeft ? right : left;

        // Pha build: khoa -> danh sach dong (khoa co the trung)
        Map<Integer, List<Row>> table = new HashMap<>();
        for (Row b : build) table.computeIfAbsent(b.id, k -> new ArrayList<>()).add(b);

        // Pha probe: mỗi dòng tra bảng băm dùng một lần
        List<String[]> result = new ArrayList<>();
        for (Row p : probe) {
            hashCount++;
            List<Row> matches = table.get(p.id);
            if (matches == null) continue;
            for (Row b : matches) {
                Row l = buildLeft ? b : p;               // giu thu tu trai | phai
                Row r = buildLeft ? p : b;
                result.add(new String[]{l.value, r.value});
            }
        }
        return result;
    }
}`,
      hints: [
        'Nested loop: hai vòng {{for}} lồng nhau, tăng bộ đếm ở **mỗi** cặp, kể cả cặp không khớp.',
        'Hash join: vì khoá có thể trùng, map phải là {{Map<Integer, List<Row>>}}; dùng {{computeIfAbsent(id, k -> new ArrayList<>())}} khi build.',
        'Nhớ lưu một cờ "build là left hay right" để khi ghép cặp vẫn đặt giá trị bên trái trước.',
      ],
      explain: `### Vì sao lời giải đúng
- Nested loop đếm ở **mọi** cặp nên luôn ra đúng n × m: đây là chi phí thật của join không có index, dù không có cặp nào khớp.
- Hash join đọc phía nhỏ một lần để build, phía lớn một lần để probe. Mỗi dòng probe chỉ tra map **một lần** (trung bình O(1)), nên tổng là n + m. Trong test lớn: nested loop cần 100.000 phép so sánh, hash join chỉ 1.000 lần tra map (cộng 100 lần chèn khi build), cùng ra 500 cặp.

### Lỗi hay gặp
- Dùng {{Map<Integer, Row>}} thay vì {{Map<Integer, List<Row>>}}: khoá trùng ghi đè nhau, mất cặp. Join thật luôn phải xử lý khoá trùng (quan hệ một-nhiều).
- Khi build từ phía phải, ghép cặp theo thứ tự (dòng probe, dòng build) nên trái/phải bị đảo. Test "pairs stay left|right" bắt lỗi này.
- Quên reset bộ đếm, nên lần gọi thứ hai cộng dồn số của lần trước.

### Liên hệ DB thật
Đây chính là lý do planner muốn build từ bên **nhỏ** hơn: bảng băm nhỏ thì vừa {{work_mem}}. Nếu ước lượng sai (tưởng bên lớn là bên nhỏ), bảng băm phình ra, tràn đĩa thành nhiều batch, và hash join chậm hẳn.`,
    },
  ],
  check: [
    {
      q: 'Nested loop join **không có index** trên hai bảng 1.000 và 2.000 dòng cần bao nhiêu phép so sánh khoá?',
      options: ['1.000', '2.000', '2.000.000', '3.000'],
      answer: 2,
      explain: `**2.000.000 đúng**: mỗi dòng trong 1.000 dòng outer phải so với cả 2.000 dòng inner, tức 1.000 × 2.000. **1.000** hay **2.000** sai vì chỉ đếm một bên, như thể mỗi dòng chỉ so một lần. **3.000** là n + m, chi phí xấp xỉ của **hash join** (đọc mỗi bên một lần), không phải nested loop.`,
    },
    {
      q: 'Hash join thường là lựa chọn tốt nhất trong tình huống nào?',
      options: ['Outer chỉ vài dòng và inner có index trên khoá join', 'Cả hai bảng chỉ dưới 100 dòng', 'Hai bên đều lớn, join bằng dấu =, bảng băm vừa bộ nhớ', 'Điều kiện join là {{a.id > b.id}}'],
      answer: 2,
      explain: `**Phương án 3 đúng**: hai bên lớn thì n × m hay n × log m đều đắt, còn hash join chỉ đọc mỗi bên một lần (n + m), miễn là join bằng {{=}} và bảng băm không tràn đĩa. **Phương án 1** sai: đó là trường hợp tốt nhất của **nested loop có index** (chỉ vài lần đi xuống B-tree, không cần đọc hết bảng lớn để build). **Phương án 2** sai: dữ liệu quá nhỏ thì thuật toán nào cũng nhanh, chi phí dựng bảng băm không đáng. **Phương án 4** sai: hash chỉ tra được bằng nhau, điều kiện {{>}} buộc DB dùng nested loop.`,
    },
    {
      q: 'Production: một join có {{loops=500000}} trên inner và thời gian tăng đột biến sau đợt import lớn. Bước đầu tiên nên làm gì?',
      options: ['Tăng RAM cho server DB ngay', 'Chạy EXPLAIN ANALYZE, so rows ước lượng với actual rows và xem inner là Seq Scan hay Index Scan', 'Xoá index trên bảng inner', 'Tách query thành hai subquery cho dễ đọc'],
      answer: 1,
      explain: `**Phương án 2 đúng**: phải biết **vì sao** planner chọn nested loop. Thường gặp nhất là thống kê cũ khiến planner tưởng outer chỉ có vài dòng; {{ANALYZE}} lại bảng là sửa được. Inner là Seq Scan với loops lớn thì thiếu index trên khoá join. **Tăng RAM** sai vì nested loop không bị giới hạn bởi bộ nhớ, nó chậm do lặp nhiều lần. **Xoá index** làm tình hình tệ hơn: inner sẽ bị quét toàn bộ ở mỗi vòng. **Tách subquery** chỉ đổi cách viết; planner thường gộp lại thành cùng một plan nên không giải quyết nguyên nhân.`,
    },
  ],
  related: ['sql-015', 'sql-017', 'sql-023', 'db-001'],
  tags: ['join', 'hash join', 'nested loop', 'merge join', 'execution plan'],
},
{
  id: 'lesson-sql-002',
  track: 'sql',
  order: 2,
  title: 'Offset và keyset pagination: vì sao trang càng xa càng chậm',
  level: 'senior',
  minutes: 25,
  goals: [
    'Giải thích được vì sao {{OFFSET}} lớn chậm dần dù chỉ trả về 20 dòng',
    'Viết đúng câu keyset pagination với khoá sắp xếp không duy nhất (thêm {{id}} làm tie-breaker)',
    'Mô phỏng hai cách bằng {{TreeMap}} và đếm số dòng phải đọc của mỗi cách',
  ],
  body: `### Offset pagination: dễ viết, chậm dần
Cách quen thuộc nhất (cũng là cách {{Pageable}} của Spring Data làm mặc định):

~~~sql
SELECT * FROM orders
ORDER BY created_at DESC, id DESC
LIMIT 20 OFFSET 100000;     -- trang 5.001, mỗi trang 20 dòng
~~~

DB **không thể nhảy thẳng** tới dòng thứ 100.000: nó không biết dòng đó là dòng nào nếu không đếm từ đầu. Vì vậy:
- Có index trên {{(created_at, id)}}: DB đi theo index, đọc **100.020** entry (kèm truy cập bảng để lấy {{SELECT *}}), rồi **vứt bỏ 100.000** dòng đầu và trả 20 dòng cuối.
- Không có index: DB phải đọc toàn bảng và sắp xếp (top-N sort giữ 100.020 dòng tốt nhất), còn đắt hơn.

Chi phí tăng **tuyến tính theo offset**: trang 1 đọc 20 dòng, trang 5.001 đọc 100.020 dòng, trang 500.001 đọc 10 triệu dòng. Trên bảng lớn, trang sâu có thể mất hàng giây trong khi trang đầu chỉ vài mili giây.

Offset còn một lỗi **đúng sai** chứ không chỉ chậm: nếu có dòng mới được insert lên đầu trong lúc người dùng đang xem trang 1, khi sang trang 2 mọi dòng bị đẩy xuống một vị trí và người dùng **thấy lại** một dòng đã xem. Xoá dòng thì ngược lại: một dòng bị **bỏ sót**.

> Pitfall thực tế: {{Page<T>}} của Spring Data còn chạy thêm một câu {{SELECT COUNT(*)}} cho mỗi request để tính {{totalPages}}. Trên bảng hàng chục triệu dòng, câu đếm này có khi còn chậm hơn chính câu lấy dữ liệu. Nếu không cần tổng số trang, hãy trả {{Slice<T>}} (không đếm), và bot crawl các trang sâu là thứ hay làm DB quá tải.

### Keyset pagination: nhớ vị trí, không đếm lại
Ý tưởng: thay vì nói "bỏ qua 100.000 dòng", client gửi lại **khoá của dòng cuối trang trước** (gọi là cursor), và DB lấy các dòng **đứng sau** khoá đó:

~~~sql
-- dòng cuối trang trước: created_at = '2024-05-01 10:00:00', id = 99999
SELECT * FROM orders
WHERE (created_at, id) < ('2024-05-01 10:00:00', 99999)
ORDER BY created_at DESC, id DESC
LIMIT 20;
~~~

Với index B-tree trên {{(created_at, id)}}, DB **đi xuống cây** tới đúng vị trí cursor (O(log n), vài trang index), rồi đọc tiếp 20 entry. Trang 1 hay trang 5.001 đều tốn như nhau.

Ba chi tiết quyết định đúng sai:
- **Khoá sắp xếp phải duy nhất.** Nhiều đơn có cùng {{created_at}}; nếu chỉ lọc {{created_at < ?}} thì các dòng trùng thời điểm với dòng cuối trang sẽ bị **bỏ sót**. Luôn thêm {{id}} làm tie-breaker, cả trong {{ORDER BY}} lẫn trong điều kiện.
- **So sánh bộ giá trị** {{(a, b) < (x, y)}} nghĩa là {{a < x OR (a = x AND b < y)}}. PostgreSQL dùng index rất tốt với cú pháp này. MySQL hiểu cú pháp nhưng có phiên bản tối ưu kém; khi đó viết dạng tường minh {{created_at < ? OR (created_at = ? AND id < ?)}} rồi kiểm tra bằng {{EXPLAIN}}.
- **Hướng so sánh phải khớp hướng sắp xếp**: {{ORDER BY ... DESC}} đi với {{<}}, {{ASC}} đi với {{>}}.

Spring Data 3.1+ hỗ trợ sẵn qua {{ScrollPosition.keyset()}} và kiểu trả về {{Window<T>}}.

| | Offset | Keyset |
|---|---|---|
| Số dòng phải đọc cho trang sâu | offset + limit, tăng tuyến tính | log n để tìm vị trí + limit, gần như không đổi |
| Nhảy thẳng tới trang 50 | được | không (chỉ có trang trước/sau) |
| Dữ liệu thay đổi giữa hai trang | trùng hoặc sót dòng | ổn định |
| Độ khó cài đặt | rất dễ | cần index đúng và cursor |

### Mô phỏng bằng TreeMap
Index B-tree của DB là một cấu trúc **có thứ tự**: tìm vị trí của một khoá mất O(log n), rồi đọc tuần tự các khoá kế tiếp. Trong Java, {{TreeMap}} (cây đỏ-đen) cho đúng hai khả năng đó: {{tailMap(key, false)}} nhảy tới các khoá lớn hơn {{key}} trong O(log n) rồi duyệt tiếp theo thứ tự. Còn mô phỏng offset thì chỉ có một cách: duyệt từ đầu và đếm, đúng như DB phải làm. Bài tập dưới đây cho bạn thấy con số chênh lệch đó.

> Senior tip: đừng để cursor là {{id}} thô trong URL công khai. Hãy mã hoá cả bộ (created_at, id) thành chuỗi Base64 mờ (opaque), để sau này đổi cột sắp xếp mà không phá client, và trả kèm {{hasMore}} thay cho {{totalPages}}. Các API lớn như Stripe ({{starting_after}}) hay GitHub (cursor trong GraphQL) đều làm theo kiểu này.

### Liên hệ phỏng vấn
Câu hay gặp: "Bảng giao dịch 80 triệu dòng, API lịch sử bị chậm ở trang sâu, sửa thế nào?". Trả lời tốt: giải thích offset phải đọc rồi bỏ offset dòng; chuyển sang keyset với index {{(account_id, created_at, id)}} khớp đúng WHERE và ORDER BY; xử lý tie-breaker; nêu trade-off là mất khả năng nhảy trang và cách giảm nhẹ (giới hạn số trang tối đa cho offset ở màn hình admin, hoặc cho lọc theo khoảng ngày để nhảy gần tới vị trí cần xem).`,
  exercises: [
    {
      title: 'Mô phỏng offset và keyset pagination bằng TreeMap, đếm số dòng phải đọc',
      prompt: `Viết lớp {{PaginationSim}} mô phỏng một bảng có index trên {{id}} (sắp xếp **tăng dần**):

- Constructor {{PaginationSim(List<Row> data)}}: đưa dữ liệu vào {{TreeMap<Long, Row>}} với khoá là {{row.id}}. Trùng {{id}} thì dòng sau ghi đè dòng trước (đúng như {{TreeMap.put}}).
- {{getPageWithOffset(int offset, int limit)}}: trả về tối đa {{limit}} dòng, bắt đầu từ vị trí {{offset}} (đếm từ 0) theo thứ tự {{id}} tăng dần. {{getTraversedOffset()}} trả về **số entry đã đi qua** trong lần gọi này, gồm cả những dòng bị bỏ qua, tức bằng {{min(offset + limit, số dòng)}}.
- {{getPageWithKeyset(Long lastId, int limit)}}: {{lastId == null}} nghĩa là trang đầu; ngược lại trả về tối đa {{limit}} dòng có {{id > lastId}} ({{lastId}} có thể không tồn tại trong bảng). {{getTraversedKeyset()}} trả về **số entry đã đọc sau khi nhảy tới vị trí bắt đầu**, tức bằng số dòng trả về (bước nhảy O(log n) của cây không tính).

Không được copy dữ liệu sang {{ArrayList}} rồi dùng {{subList}}: mục đích là thấy chi phí duyệt thật.`,
      starter: `class Row {
    final long id;
    final String value;
    Row(long id, String value) { this.id = id; this.value = value; }
}

class PaginationSim {
    private int traversedOffset = 0;
    private int traversedKeyset = 0;

    int getTraversedOffset() { return traversedOffset; }
    int getTraversedKeyset() { return traversedKeyset; }

    PaginationSim(List<Row> data) {
        // TODO: dua du lieu vao TreeMap
    }

    List<Row> getPageWithOffset(int offset, int limit) {
        throw new UnsupportedOperationException("TODO");
    }

    List<Row> getPageWithKeyset(Long lastId, int limit) {
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
    static void eq(Object expected, Object actual) {
        if (!Objects.equals(expected, actual)) throw new AssertionError("expected " + expected + " got " + actual);
    }
    static List<Long> ids(List<Row> page) {
        List<Long> out = new ArrayList<>();
        for (Row r : page) out.add(r.id);
        return out;
    }
    static List<Row> data(long... ids) {
        List<Row> out = new ArrayList<>();
        for (long id : ids) out.add(new Row(id, "v" + id));
        return out;
    }
    static final List<Row> TEN = data(4, 2, 9, 1, 10, 3, 8, 5, 7, 6);

    public static void main(String[] args) {
        check("offset first page", () -> {
            PaginationSim s = new PaginationSim(TEN);
            eq(List.of(1L, 2L, 3L), ids(s.getPageWithOffset(0, 3)));
            eq(3, s.getTraversedOffset());
        });
        check("offset deep page reads and discards earlier rows", () -> {
            PaginationSim s = new PaginationSim(TEN);
            eq(List.of(9L, 10L), ids(s.getPageWithOffset(8, 2)));
            eq(10, s.getTraversedOffset());
        });
        check("offset past the end is empty but still scans everything", () -> {
            PaginationSim s = new PaginationSim(TEN);
            eq(List.of(), ids(s.getPageWithOffset(20, 5)));
            eq(10, s.getTraversedOffset());
        });
        check("keyset first page", () -> {
            PaginationSim s = new PaginationSim(TEN);
            eq(List.of(1L, 2L, 3L), ids(s.getPageWithKeyset(null, 3)));
            eq(3, s.getTraversedKeyset());
        });
        check("keyset deep page reads only the page", () -> {
            PaginationSim s = new PaginationSim(TEN);
            eq(List.of(9L, 10L), ids(s.getPageWithKeyset(8L, 2)));
            eq(2, s.getTraversedKeyset());
        });
        check("keyset works when lastId is not in the table", () -> {
            PaginationSim s = new PaginationSim(data(5, 1, 9, 3, 7));
            eq(List.of(5L, 7L), ids(s.getPageWithKeyset(4L, 2)));
            eq(List.of(), ids(s.getPageWithKeyset(9L, 2)));
            eq(0, s.getTraversedKeyset());
        });
        check("duplicate id: later row wins", () -> {
            List<Row> d = new ArrayList<>(data(1, 2));
            d.add(new Row(2, "new"));
            PaginationSim s = new PaginationSim(d);
            List<Row> page = s.getPageWithOffset(0, 10);
            eq(2, page.size());
            eq("new", page.get(1).value);
        });
        check("walking all pages with keyset visits every row once", () -> {
            List<Row> d = new ArrayList<>();
            for (long i = 1000; i >= 1; i--) d.add(new Row(i * 3, "v"));
            PaginationSim s = new PaginationSim(d);
            List<Long> seen = new ArrayList<>();
            Long cursor = null;
            int reads = 0;
            while (true) {
                List<Row> page = s.getPageWithKeyset(cursor, 50);
                reads += s.getTraversedKeyset();
                if (page.isEmpty()) break;
                seen.addAll(ids(page));
                cursor = page.get(page.size() - 1).id;
            }
            eq(1000, seen.size());
            eq(3L, seen.get(0));
            eq(3000L, seen.get(999));
            eq(1000, reads);
            s.getPageWithOffset(950, 50);
            eq(1000, s.getTraversedOffset());
        });
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
      reference: `class Row {
    final long id;
    final String value;
    Row(long id, String value) { this.id = id; this.value = value; }
}

class PaginationSim {
    private final TreeMap<Long, Row> tree = new TreeMap<>();   // "index" sap xep theo id
    private int traversedOffset = 0;
    private int traversedKeyset = 0;

    int getTraversedOffset() { return traversedOffset; }
    int getTraversedKeyset() { return traversedKeyset; }

    PaginationSim(List<Row> data) {
        for (Row r : data) tree.put(r.id, r);                   // trung id: dong sau ghi de
    }

    List<Row> getPageWithOffset(int offset, int limit) {
        traversedOffset = 0;
        List<Row> page = new ArrayList<>();
        int position = 0;
        for (Row r : tree.values()) {                           // offset: buoc phai di tu dau
            if (page.size() >= limit) break;
            traversedOffset++;
            if (position++ < offset) continue;                  // doc roi vut bo
            page.add(r);
        }
        return page;
    }

    List<Row> getPageWithKeyset(Long lastId, int limit) {
        traversedKeyset = 0;
        // keyset: nhay thang toi khoa > lastId (O(log n)), roi doc tiep
        Collection<Row> rest = lastId == null ? tree.values() : tree.tailMap(lastId, false).values();
        List<Row> page = new ArrayList<>();
        for (Row r : rest) {
            if (page.size() >= limit) break;
            traversedKeyset++;
            page.add(r);
        }
        return page;
    }
}`,
      hints: [
        '{{tree.values()}} trả về các value theo thứ tự khoá tăng dần; duyệt nó bằng for-each chính là "đi theo index".',
        'Offset: dùng một biến vị trí, mỗi entry đi qua đều tăng bộ đếm, chỉ thêm vào trang khi vị trí ≥ offset; dừng khi trang đủ {{limit}}.',
        'Keyset: {{tree.tailMap(lastId, false)}} trả về phần map có khoá **lớn hơn hẳn** {{lastId}}, kể cả khi {{lastId}} không có trong map.',
      ],
      explain: `### Con số nói lên tất cả
Trong test cuối, đi hết 1.000 dòng bằng keyset (20 trang × 50 dòng) tổng cộng chỉ đọc **1.000** entry: mỗi dòng đúng một lần. Còn chỉ riêng trang cuối bằng offset ({{offset = 950}}) đã phải đọc **1.000** entry. Nếu đi hết 20 trang bằng offset, tổng số entry phải đọc là 50 + 100 + ... + 1.000 = **10.500**: chi phí bậc hai theo số trang.

### Lỗi hay gặp
- Đếm offset chỉ bằng số dòng trả về: sai, vì chi phí thật nằm ở những dòng **bị bỏ qua**.
- Dùng {{tailMap(lastId)}} (một tham số) thì khoá {{lastId}} được tính vào (inclusive), nên dòng cuối của trang trước bị lặp lại ở trang sau.
- Dùng {{tree.get(lastId)}} để tìm vị trí: hỏng khi dòng đó vừa bị xoá. Keyset đúng phải so sánh "lớn hơn", không cần dòng đó còn tồn tại.

### Khác biệt với DB thật
TreeMap có khoá duy nhất nên không cần tie-breaker; trong SQL, cột như {{created_at}} có thể trùng, nên cursor phải là bộ {{(created_at, id)}}.`,
    },
  ],
  check: [
    {
      q: 'API chạy {{ORDER BY id LIMIT 20 OFFSET 500000}} trên bảng 10 triệu dòng có index trên {{id}}. Chi phí chính là gì?',
      options: ['Chỉ đọc đúng 20 dòng nhờ index', 'Đọc 500.020 dòng theo thứ tự rồi vứt bỏ 500.000 dòng đầu', 'Tính hash cho 500.000 dòng', 'Tạo một bảng tạm chứa 10 triệu dòng'],
      answer: 1,
      explain: `**Phương án 2 đúng**: index cho thứ tự, nhưng không cho biết "dòng thứ 500.000 là dòng nào", nên DB phải đi qua 500.020 entry rồi bỏ 500.000. **Phương án 1** sai: chỉ keyset mới nhảy thẳng được tới vị trí. **Phương án 3** sai: offset không liên quan gì tới hashing. **Phương án 4** sai: có index đúng thứ tự thì DB đọc tuần tự theo index, không cần bảng tạm toàn bộ.`,
    },
    {
      q: 'Vì sao keyset pagination không hỗ trợ tốt việc nhảy thẳng từ trang 1 sang trang 100?',
      options: ['Vì B-tree không hỗ trợ tìm kiếm theo khoảng', 'Vì cần khoá của dòng cuối trang 99, mà muốn biết khoá đó thì phải duyệt từ đầu', 'Vì chi phí mỗi trang keyset tăng theo số trang', 'Vì DB không cho ORDER BY trên nhiều cột'],
      answer: 1,
      explain: `**Phương án 2 đúng**: cursor là khoá của dòng cuối trang trước; chỉ biết số trang thì không suy ra được khoá đó nếu không đếm từ đầu, tức lại quay về chi phí của offset. **Phương án 1** sai: tìm theo khoảng chính là thế mạnh của B-tree và là thứ keyset dựa vào. **Phương án 3** sai: chi phí mỗi trang keyset gần như không đổi. **Phương án 4** sai: ORDER BY nhiều cột hoàn toàn hợp lệ, keyset còn cần nó để có tie-breaker.`,
    },
    {
      q: 'Bảng có index trên {{(created_at, id)}}, nhiều dòng trùng {{created_at}}. Câu nào là keyset pagination **đúng** cho trang tiếp theo (sắp xếp mới nhất trước)?',
      options: [
        'SELECT * FROM t ORDER BY created_at DESC, id DESC LIMIT 20 OFFSET 1000',
        'SELECT * FROM t WHERE created_at < ? ORDER BY created_at DESC, id DESC LIMIT 20',
        'SELECT * FROM t WHERE (created_at, id) < (?, ?) ORDER BY created_at DESC, id DESC LIMIT 20',
        'SELECT * FROM t WHERE (created_at, id) > (?, ?) ORDER BY created_at DESC, id DESC LIMIT 20',
      ],
      answer: 2,
      explain: `**Phương án 3 đúng**: so sánh bộ {{(created_at, id)}} với dòng cuối trang trước, đúng hướng ({{<}} cho DESC), và ORDER BY khớp index. **Phương án 1** là offset, không phải keyset. **Phương án 2** trông gần đúng nhưng **bỏ sót** các dòng có cùng {{created_at}} với dòng cuối trang mà chưa được hiển thị, vì thiếu tie-breaker {{id}}. **Phương án 4** sai hướng: với DESC, {{>}} lấy lại các dòng **mới hơn**, tức dữ liệu của các trang trước.`,
    },
  ],
  related: ['db-005', 'api-017', 'db-001'],
  tags: ['pagination', 'keyset', 'offset', 'cursor', 'TreeMap'],
},
{
  id: 'lesson-sql-003',
  track: 'sql',
  order: 3,
  title: 'Window function: ROW_NUMBER, RANK và running total, tự cài bằng Java',
  level: 'senior',
  minutes: 30,
  goals: [
    'Giải thích ba thành phần của window: {{PARTITION BY}}, {{ORDER BY}}, frame, và frame mặc định là gì',
    'Phân biệt {{ROW_NUMBER}}, {{RANK}}, {{DENSE_RANK}} khi có giá trị bằng nhau',
    'Tự cài {{ROW_NUMBER}} và running total bằng Java (sắp xếp + duyệt một lần) và tránh lỗi rò trạng thái giữa các nhóm',
  ],
  body: `### Window function khác GROUP BY ở đâu
{{GROUP BY}} **gộp** nhiều dòng thành một: 1.000 giao dịch của 10 khách thành 10 dòng tổng. Window function thì **giữ nguyên từng dòng** và gắn thêm một giá trị tính trên "cửa sổ" các dòng liên quan: mỗi giao dịch vẫn còn, kèm số thứ tự của nó trong lịch sử của khách, hoặc số dư lũy kế tới thời điểm đó.

~~~sql
SELECT customer_id, created_at, amount,
       ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY created_at) AS seq,
       SUM(amount)  OVER (PARTITION BY customer_id ORDER BY created_at, id
                          ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS running_total
FROM transaction;
~~~

Ba thành phần trong {{OVER (...)}}:
- **PARTITION BY**: chia dữ liệu thành các nhóm độc lập (mỗi khách một nhóm). Không có thì cả bảng là một nhóm.
- **ORDER BY**: thứ tự các dòng **bên trong** mỗi nhóm.
- **Frame**: với hàm tổng hợp như {{SUM}}, {{AVG}}, frame cho biết cộng những dòng nào so với dòng hiện tại. Các hàm xếp hạng ({{ROW_NUMBER}}, {{RANK}}) **bỏ qua frame**.

PostgreSQL có window function từ lâu; MySQL có từ 8.0. Window function được tính **sau** WHERE, GROUP BY, HAVING và **trước** ORDER BY cuối cùng và LIMIT. Hệ quả: không thể viết {{WHERE rn <= 3}} ở cùng cấp với nơi định nghĩa {{rn}}, mà phải bọc trong subquery hoặc CTE.

### ROW_NUMBER, RANK, DENSE_RANK: khác nhau khi có hoà
Ví dụ lương trong một phòng (sắp giảm dần): 100, 100, 90, 80.

| salary | ROW_NUMBER | RANK | DENSE_RANK |
|---|---|---|---|
| 100 | 1 | 1 | 1 |
| 100 | 2 | 1 | 1 |
| 90 | 3 | 3 | 2 |
| 80 | 4 | 4 | 3 |

- {{ROW_NUMBER}}: luôn 1, 2, 3, … không trùng. Hai dòng hoà thì dòng nào được số nhỏ là **không xác định** nếu ORDER BY không đủ phân biệt; hãy thêm cột duy nhất ({{id}}) vào ORDER BY nếu cần kết quả ổn định.
- {{RANK}}: dòng hoà cùng hạng, hạng sau **nhảy cóc** (1, 1, 3).
- {{DENSE_RANK}}: dòng hoà cùng hạng, **không nhảy** (1, 1, 2). "Lương cao thứ hai" thường cần DENSE_RANK = 2.

### Frame mặc định: cái bẫy của running total
Khi có ORDER BY mà không ghi frame, chuẩn SQL dùng mặc định {{RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW}}. **RANGE** coi các dòng có cùng giá trị ORDER BY là "đồng hạng" (peer) và cộng **tất cả** chúng vào cùng lúc.

~~~text
date        amount   SUM mặc định (RANGE)   SUM với ROWS
2024-05-01  100      300                    100
2024-05-01  200      300                    300
2024-05-02  50       350                    350
~~~

Hai giao dịch cùng ngày nhận cùng số dư lũy kế 300 theo mặc định, khiến sao kê trông như sai. Muốn cộng **từng dòng một**, ghi rõ {{ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW}} và thêm {{id}} vào ORDER BY để thứ tự xác định. Không có ORDER BY trong OVER thì frame là **cả nhóm**: {{SUM(amount) OVER (PARTITION BY customer_id)}} trả tổng của khách trên mọi dòng.

### DB tính window function thế nào
Trong plan PostgreSQL, bạn sẽ thấy node {{WindowAgg}} nằm trên một node {{Sort}} (sắp theo PARTITION BY rồi ORDER BY), hoặc trên một {{Index Scan}} nếu đã có index đúng thứ tự đó. Sau khi có thứ tự, WindowAgg chỉ cần **duyệt một lần**, giữ một ít trạng thái (số thứ tự hiện tại, tổng hiện tại) và reset khi sang nhóm mới. Chi phí chính là bước sort O(n log n); index {{(customer_id, created_at)}} loại bỏ được bước này.

Bài tập bên dưới làm đúng như vậy bằng Java: sắp xếp, rồi duyệt một lần.

> Pitfall thực tế: tự tính running total trong Java bằng cách, với mỗi dòng, duyệt lại từ đầu danh sách và cộng các dòng trước nó. Đó là O(n²): 10.000 dòng mất vài chục mili giây, 500.000 dòng mất vài phút. Cách đúng là sắp xếp một lần rồi cộng dồn: O(n log n) cho sort, O(n) cho phần cộng.

> Senior tip: bài toán "top-N mỗi nhóm" ({{WHERE rn <= 3}} bên ngoài subquery) trước đây buộc PostgreSQL tính ROW_NUMBER cho **mọi** dòng rồi mới lọc. Từ PG 15, planner nhận ra điều kiện {{rn <= 3}} và dừng sớm trong từng nhóm (plan hiện {{Run Condition}}). Với ít nhóm và bảng rất lớn, cách nhanh hơn nữa là {{CROSS JOIN LATERAL (... ORDER BY ... LIMIT 3)}} cho mỗi nhóm, tận dụng index {{(group_id, sort_col)}}. Lưu ý: không được chèn {{LIMIT}} vào subquery chứa ROW_NUMBER để "tối ưu", vì như vậy lấy top-N **toàn bảng** chứ không phải mỗi nhóm.

### Liên hệ phỏng vấn
Câu hay gặp: "Lấy giao dịch lớn thứ hai của mỗi khách", "tính số dư lũy kế cho sao kê", "khác nhau giữa RANK và DENSE_RANK". Trả lời tốt cần nêu: chọn hàm xếp hạng nào khi có hoà, frame mặc định RANGE và vì sao sao kê nên dùng ROWS, thêm tie-breaker để kết quả ổn định, và index nào giúp bỏ bước sort. Nếu được hỏi cách làm khi không có window function (MySQL 5.7), có thể nêu self-join hoặc subquery tương quan nhưng phải nói rõ chúng là O(n²) trên mỗi nhóm.`,
  exercises: [
    {
      title: 'Tự cài ROW_NUMBER và running total',
      prompt: `{{Row}} có sẵn: {{group}} (String) và {{value}} (int). Viết lớp {{WindowEngine}} mô phỏng:

~~~sql
ROW_NUMBER() OVER (PARTITION BY grp ORDER BY value)
SUM(value)   OVER (PARTITION BY grp ORDER BY value ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW)
~~~

- {{rowNumber(rows)}} trả về {{List<Integer>}}, {{runningTotal(rows)}} trả về {{List<Long>}}.
- Giống SQL, kết quả gắn với **từng dòng đầu vào**: phần tử thứ {{i}} của kết quả là giá trị của {{rows.get(i)}}. Thứ tự đầu vào có thể lộn xộn và các nhóm có thể xen kẽ.
- Trong một nhóm, sắp theo {{value}} tăng dần. Hai dòng **cùng nhóm, cùng value** thì dòng đứng trước trong danh sách đầu vào được xếp trước (đây là ngữ nghĩa ROWS: cộng từng dòng một).
- **Không được sửa** danh sách đầu vào (nó có thể là danh sách bất biến như {{List.of}}).
- Tổng dùng {{long}} vì có thể vượt {{Integer.MAX_VALUE}}.`,
      starter: `class Row {
    final String group;
    final int value;
    Row(String group, int value) { this.group = group; this.value = value; }
}

class WindowEngine {
    List<Integer> rowNumber(List<Row> rows) {
        throw new UnsupportedOperationException("TODO");
    }

    List<Long> runningTotal(List<Row> rows) {
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
    static void eq(Object expected, Object actual) {
        if (!Objects.equals(expected, actual)) throw new AssertionError("expected " + expected + " got " + actual);
    }
    static Row r(String g, int v) { return new Row(g, v); }

    public static void main(String[] args) {
        WindowEngine w = new WindowEngine();
        check("row number per group, aligned with input order", () -> {
            eq(List.of(1, 1, 2), w.rowNumber(List.of(r("A", 10), r("B", 20), r("A", 30))));
        });
        check("row number with ties keeps input order and never repeats", () -> {
            eq(List.of(1, 2, 3), w.rowNumber(List.of(r("G", 10), r("G", 10), r("G", 20))));
        });
        check("row number with interleaved unsorted groups", () -> {
            // A: A1 -> 1, A3 (idx 1) -> 2, A3 (idx 3) -> 3 ; B: B1 -> 1, B5 -> 2
            eq(List.of(2, 2, 1, 3, 1),
               w.rowNumber(List.of(r("B", 5), r("A", 3), r("B", 1), r("A", 3), r("A", 1))));
        });
        check("running total resets per group", () -> {
            eq(List.of(5L, 20L, 7L), w.runningTotal(List.of(r("X", 5), r("X", 15), r("Y", 7))));
        });
        check("running total with interleaved unsorted groups", () -> {
            // X: 5 -> 5, 15 -> 20 ; Y: 3 -> 3, 7 -> 10
            eq(List.of(10L, 20L, 5L, 3L),
               w.runningTotal(List.of(r("Y", 7), r("X", 15), r("X", 5), r("Y", 3))));
        });
        check("running total with ties adds row by row (ROWS frame)", () -> {
            eq(List.of(10L, 20L, 50L), w.runningTotal(List.of(r("G", 10), r("G", 10), r("G", 30))));
        });
        check("input list is not modified", () -> {
            List<Row> input = new ArrayList<>(List.of(r("B", 2), r("A", 1), r("B", 1)));
            List<Row> before = new ArrayList<>(input);
            w.rowNumber(input);
            w.runningTotal(input);
            for (int i = 0; i < input.size(); i++) {
                if (input.get(i) != before.get(i)) throw new AssertionError("input order changed at " + i);
            }
        });
        check("running total uses long (no int overflow)", () -> {
            List<Row> big = new ArrayList<>();
            for (int i = 0; i < 3000; i++) big.add(r("A", 1_000_000));
            List<Long> t = w.runningTotal(big);
            eq(3_000_000_000L, t.get(2999));
            eq(List.of(), w.rowNumber(List.of()));
        });
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
      reference: `class Row {
    final String group;
    final int value;
    Row(String group, int value) { this.group = group; this.value = value; }
}

class WindowEngine {
    // Sap xep CHI SO dong theo (group, value). List.sort on dinh (stable),
    // nen hai dong hoa giu nguyen thu tu dau vao. Danh sach goc khong bi dong toi.
    private static List<Integer> windowOrder(List<Row> rows) {
        List<Integer> idx = new ArrayList<>();
        for (int i = 0; i < rows.size(); i++) idx.add(i);
        idx.sort(Comparator.comparing((Integer i) -> rows.get(i).group)
                           .thenComparingInt(i -> rows.get(i).value));
        return idx;
    }

    List<Integer> rowNumber(List<Row> rows) {
        Integer[] out = new Integer[rows.size()];
        String current = null;
        int n = 0;
        for (int i : windowOrder(rows)) {
            Row r = rows.get(i);
            if (!r.group.equals(current)) { current = r.group; n = 0; }   // sang nhom moi: reset
            out[i] = ++n;                                                  // ghi vao vi tri goc
        }
        return Arrays.asList(out);
    }

    List<Long> runningTotal(List<Row> rows) {
        Long[] out = new Long[rows.size()];
        String current = null;
        long sum = 0;
        for (int i : windowOrder(rows)) {
            Row r = rows.get(i);
            if (!r.group.equals(current)) { current = r.group; sum = 0; }
            sum += r.value;
            out[i] = sum;
        }
        return Arrays.asList(out);
    }
}`,
      hints: [
        'Đừng sắp xếp chính danh sách {{rows}}; hãy sắp xếp một danh sách **chỉ số** {{0..n-1}} theo {{(group, value)}}. Như vậy vừa không sửa đầu vào, vừa biết ghi kết quả về đúng vị trí gốc.',
        '{{List.sort}} của Java là sắp xếp ổn định (stable): phần tử bằng nhau giữ nguyên thứ tự ban đầu, đúng yêu cầu khi hoà.',
        'Duyệt theo thứ tự đã sắp; khi {{group}} khác nhóm trước thì reset bộ đếm/tổng về 0, rồi ghi {{out[i]}} với {{i}} là chỉ số gốc.',
      ],
      explain: `### Ý tưởng
Đây chính là cách {{WindowAgg}} làm: **sort theo (PARTITION BY, ORDER BY), rồi duyệt một lần** với trạng thái nhỏ. Mẹo là sắp xếp **chỉ số** thay vì sắp xếp dòng: danh sách đầu vào không bị đụng tới, và khi tính xong giá trị cho dòng ở chỉ số {{i}}, ta ghi thẳng vào {{out[i]}}. Kết quả vì vậy thẳng hàng với đầu vào, giống SQL trả thêm một cột cho từng dòng.

### Lỗi hay gặp
- **Quên reset khi sang nhóm mới**: tổng của nhóm B cộng dồn từ nhóm A. Test có nhóm xen kẽ bắt lỗi này.
- **Trả kết quả theo thứ tự đã sắp** thay vì thứ tự đầu vào: số đúng nhưng gắn nhầm dòng.
- **Gọi {{rows.sort(...)}} trực tiếp**: sửa dữ liệu của người gọi, và ném {{UnsupportedOperationException}} nếu đầu vào là {{List.of(...)}}.
- **Dùng {{int}} cho tổng**: 3.000 × 1.000.000 vượt {{Integer.MAX_VALUE}} (khoảng 2,1 tỉ) và tràn thành số âm mà không báo lỗi.
- **Running total O(n²)**: với mỗi dòng cộng lại tất cả dòng trước. Đúng nhưng chậm thảm hại khi dữ liệu lớn.

### Liên hệ SQL
Hai dòng hoà ({{G 10}}, {{G 10}}) cho ra 10 rồi 20 vì bài này dùng ngữ nghĩa **ROWS**. Nếu viết {{SUM(value) OVER (PARTITION BY grp ORDER BY value)}} mà không ghi frame, SQL dùng **RANGE** và cả hai dòng đều nhận 20. Trong production, nếu dữ liệu đã nằm trong DB thì để DB tính window function (gần dữ liệu, có index); tự cài trong Java chỉ hợp lý khi dữ liệu đến từ nguồn khác như file hay Kafka stream.`,
    },
  ],
  check: [
    {
      q: 'Lương trong một phòng (giảm dần): 100, 100, 90. {{RANK() OVER (ORDER BY salary DESC)}} trả về gì cho dòng 90?',
      options: ['2', '3', '1', 'NULL'],
      answer: 1,
      explain: `**3 đúng**: RANK cho hai dòng 100 cùng hạng 1, rồi **nhảy cóc** qua hạng 2, nên dòng 90 có hạng 3. **2** là kết quả của {{DENSE_RANK}} (không nhảy cóc); {{ROW_NUMBER}} cũng ra 3 nhưng vì nó đánh số liên tục 1, 2, 3. **1** sai vì 90 nhỏ hơn 100 nên không thể cùng hạng. **NULL** sai vì hàm xếp hạng luôn trả số cho mọi dòng.`,
    },
    {
      q: 'Khi tự viết running total bằng vòng lặp trên dữ liệu có nhiều nhóm, lỗi phổ biến nhất là gì?',
      options: ['Quên sắp xếp danh sách bằng stream thay vì vòng lặp', 'Quên đặt lại tổng về 0 khi bắt đầu nhóm mới', 'Dùng ArrayList thay vì LinkedList', 'Không dùng ConcurrentHashMap'],
      answer: 1,
      explain: `**Phương án 2 đúng**: không reset thì tổng của nhóm sau cộng dồn cả nhóm trước, lỗi này khó thấy khi test chỉ có một nhóm. **Phương án 1** sai: sắp xếp bằng stream hay {{List.sort}} đều cho cùng thứ tự; điều quan trọng là **có** sắp xếp. **Phương án 3** sai: loại list không ảnh hưởng tính đúng. **Phương án 4** sai: bài toán chạy trên một thread; ConcurrentHashMap không giúp gì, và running total vốn phụ thuộc thứ tự nên không thể cộng song song tuỳ ý.`,
    },
    {
      q: 'Hai giao dịch cùng ngày 100 và 200. {{SUM(amount) OVER (ORDER BY tx_date)}} (không ghi frame) trả về gì cho hai dòng đó, nếu trước ngày đó tổng là 0?',
      options: ['100 và 300', '300 và 300', '100 và 200', 'Tổng toàn bảng cho mọi dòng'],
      answer: 1,
      explain: `**300 và 300 đúng**: có ORDER BY mà không ghi frame thì mặc định là {{RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW}}; hai dòng cùng {{tx_date}} là peer nên được cộng cùng lúc. **100 và 300** là kết quả của frame {{ROWS}} (cộng từng dòng), muốn vậy phải ghi rõ ROWS. **100 và 200** chỉ là giá trị từng dòng, không phải tổng lũy kế. **Tổng toàn bảng** là hành vi khi **không có** ORDER BY trong OVER (frame là cả nhóm).`,
    },
  ],
  related: ['sql-001', 'sql-005', 'sql-006'],
  tags: ['window function', 'row_number', 'rank', 'running total', 'frame'],
},
{
  id: 'lesson-sql-004',
  track: 'sql',
  order: 4,
  title: 'Window function từ gốc: ROW_NUMBER, RANK, DENSE_RANK, LAG và running total',
  level: 'senior',
  minutes: 30,
  goals: [
    'Giải thích PARTITION BY, ORDER BY trong OVER và phân biệt ROW_NUMBER, RANK, DENSE_RANK khi có giá trị bằng nhau (tie)',
    'Mô phỏng running total (SUM OVER ORDER BY) và LAG bằng Java thuần, hiểu frame mặc định RANGE vs ROWS',
    'Giải quyết bài toán thật: top-3 giao dịch lớn nhất mỗi khách và số dư lũy kế theo ngày, tự cài rank/runningTotal đúng ngữ nghĩa SQL',
  ],
  body: `### Window function là gì và vì sao cần
Window function (hàm cửa sổ) là hàm tính giá trị **trên một tập dòng liên quan** nhưng vẫn **giữ nguyên từng dòng** (không gộp như GROUP BY). GROUP BY gom 1.000 giao dịch của 10 khách thành 10 dòng; window function giữ 1.000 dòng và thêm cột như "thứ hạng giao dịch này trong khách" hay "tổng lũy kế tới thời điểm này".

~~~sql
-- Top-3 giao dịch lớn nhất mỗi khách
SELECT * FROM (
  SELECT customer_id, tx_id, amount,
         RANK() OVER (PARTITION BY customer_id ORDER BY amount DESC) AS rk
  FROM transaction
) t WHERE rk <= 3;

-- Số dư lũy kế theo ngày (sao kê)
SELECT customer_id, tx_date, amount,
       SUM(amount) OVER (PARTITION BY customer_id ORDER BY tx_date, tx_id
                         ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS balance
FROM transaction;
~~~

Cú pháp {{OVER(...)}} có ba phần:
- **PARTITION BY**: chia dữ liệu thành các nhóm độc lập (mỗi khách một cửa sổ). Giống GROUP BY về cách chia nhóm, nhưng không gộp dòng. Bỏ qua thì cả bảng là một nhóm.
- **ORDER BY**: thứ tự dòng bên trong mỗi nhóm. Quyết định ai đứng trước, ai đứng sau khi xếp hạng hay cộng dồn.
- **Frame** (khung): với hàm tổng hợp như SUM/AVG, frame nói "cộng những dòng nào so với dòng hiện tại". Hàm xếp hạng (ROW_NUMBER, RANK, DENSE_RANK) và LAG/LEAD bỏ qua frame.

### ROW_NUMBER, RANK, DENSE_RANK: khác nhau khi tie (bằng nhau)
Tie (hòa) là khi hai dòng có cùng giá trị ORDER BY. Ví dụ top giao dịch theo amount giảm dần trong một khách: 500, 500, 300.

| amount | ROW_NUMBER | RANK | DENSE_RANK |
|---|---|---|---|
| 500 | 1 | 1 | 1 |
| 500 | 2 | 1 | 1 |
| 300 | 3 | 3 | 2 |

- {{ROW_NUMBER()}}: luôn 1, 2, 3... không bao giờ trùng, dù tie. Dòng nào nhận 1 hay 2 khi tie là **không xác định** nếu ORDER BY không đủ phân biệt; thêm cột duy nhất ({{tx_id}}) để ổn định.
- {{RANK()}}: dòng tie cùng hạng; hạng sau **nhảy** đúng bằng số dòng tie. Hai người đồng hạng 1 thì người tiếp theo là hạng 3 (bỏ hạng 2). Đây là cách xếp hạng thể thao.
- {{DENSE_RANK()}}: dòng tie cùng hạng; hạng sau **không nhảy**, luôn tăng 1. Đồng hạng 1 thì người tiếp theo là hạng 2. Dùng cho "mức giá cao thứ hai" (lấy DENSE_RANK = 2).

Bài toán "top-3 giao dịch lớn nhất mỗi khách": dùng {{RANK}} hay {{DENSE_RANK}} tùy yêu cầu. Nếu có 5 giao dịch cùng đứng top 1, {{WHERE rk <= 3}} với RANK sẽ trả cả 5 (vì tất cả đều rank 1 <= 3); đây thường là hành vi mong muốn ("ba mức cao nhất" nghĩa là mọi dòng thuộc ba mức đó).

### Running total và frame mặc định (bẫy RANGE)
Running total (tổng lũy kế) cộng dồn từ đầu nhóm tới dòng hiện tại, dùng cho sao kê số dư. Cú pháp an toàn:

~~~sql
SUM(amount) OVER (PARTITION BY customer_id ORDER BY tx_date, tx_id
                  ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW)
~~~

**Bẫy**: nếu có ORDER BY mà **không ghi frame**, chuẩn SQL mặc định dùng {{RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW}}. RANGE coi các dòng có **cùng giá trị ORDER BY** là "đồng hạng" (peer) và cộng tất cả chúng vào cùng lúc. Ví dụ hai giao dịch cùng ngày 100 và 200: với RANGE cả hai dòng đều nhận tổng 300; với ROWS thì dòng đầu nhận 100, dòng sau nhận 300 (cộng từng dòng). Sao kê cần ROWS và thêm tie-breaker ({{tx_id}}) để thứ tự xác định.

Không có ORDER BY trong OVER thì frame là **toàn bộ partition**: {{SUM(amount) OVER (PARTITION BY customer_id)}} trả tổng của khách trên mọi dòng của khách đó.

### LAG: nhìn về dòng trước
{{LAG(expr, offset, default) OVER (PARTITION BY ... ORDER BY ...)}} trả giá trị {{expr}} của dòng đứng trước {{offset}} vị trí trong cùng partition (mặc định offset=1). Dòng đầu partition không có dòng trước thì trả {{default}} (mặc định NULL). Dùng để tính chênh lệch so với giao dịch trước: {{amount - LAG(amount) OVER (...)}}. {{LEAD}} là ngược lại, nhìn về dòng sau.

~~~sql
-- Chênh lệch so với giao dịch trước của cùng khách
SELECT customer_id, tx_id, amount,
       amount - LAG(amount, 1, 0) OVER (PARTITION BY customer_id ORDER BY tx_date, tx_id) AS delta
FROM transaction;
~~~

### DB tính thế nào (để hiểu chi phí)
PostgreSQL hiện node {{WindowAgg}} trong EXPLAIN, thường nằm trên một {{Sort}} theo (PARTITION BY, ORDER BY). Sau khi sắp, WindowAgg **duyệt một lần** giữ trạng thái nhỏ (số thứ tự, rank hiện tại, tổng, giá trị dòng trước) và reset khi sang partition mới. Chi phí chính là sort O(n log n); index {{(customer_id, tx_date, tx_id)}} có thể bỏ bước sort. Tự cài trong Java (bài tập) làm đúng như vậy: sort chỉ số rồi duyệt một lần.

| Hàm | Tie (hòa) | Nhảy hạng | Dùng khi |
|---|---|---|---|
| ROW_NUMBER | không trùng, gán tùy ý | không | cần đúng N dòng, phân trang ổn định (thêm tie-breaker) |
| RANK | cùng hạng | có (nhảy) | xếp hạng kiểu thể thao, "top-N mức" |
| DENSE_RANK | cùng hạng | không | "mức cao thứ K", cấp bậc liên tục |

> Pitfall thực tế: dùng {{ROW_NUMBER}} để lấy "top-3 mỗi nhóm" rồi gặp tie — bạn cắt ngẫu nhiên một người đồng hạng và bỏ người kia, gây tranh cãi dữ liệu. Nếu ý nghĩa là "ba mức cao nhất", dùng RANK/DENSE_RANK. Pitfall khác: quên reset trạng thái khi sang partition mới (tổng/rank của khách B dính khách A) — test có partition xen kẽ sẽ bắt lỗi này.

> Senior tip: "Top-N mỗi nhóm" trước PG 15 buộc tính rank cho mọi dòng rồi lọc ngoài. PG 15+ nhận điều kiện {{rk <= N}} và dừng sớm từng nhóm ({{Run Condition}}). Với bảng rất lớn và ít nhóm, {{CROSS JOIN LATERAL (SELECT ... WHERE customer_id = c.id ORDER BY amount DESC LIMIT 3) t}} tận dụng index {{(customer_id, amount DESC)}} thường nhanh hơn. Đừng nhét {{LIMIT}} vào subquery định nghĩa ROW_NUMBER để "tối ưu" — đó là top-N toàn bảng, không phải mỗi nhóm.

### Liên hệ phỏng vấn
Câu hay gặp: "Phân biệt ROW_NUMBER, RANK, DENSE_RANK", "Tính số dư lũy kế / lấy giao dịch lớn thứ hai mỗi khách", "Frame mặc định của SUM OVER ORDER BY là gì". Trả lời tốt: nêu rõ hành vi khi tie (nhảy hay không), nhắc bẫy RANGE vs ROWS cho running total, thêm tie-breaker để ổn định, và nói DB tính bằng sort + duyệt một lần (WindowAgg). Nếu môi trường không có window function (MySQL 5.x cũ), có thể dùng biến người dùng hoặc self-join nhưng phải nói rõ đánh đổi về tính đúng và hiệu năng.`,
  exercises: [
    {
      title: 'Tự cài RANK, DENSE_RANK và running total đúng ngữ nghĩa SQL',
      prompt: `{{Row}} có sẵn: {{group}} (String, khóa partition) và {{amount}} (int, giá trị xếp hạng/cộng dồn). Viết lớp {{Window}} mô phỏng ngữ nghĩa SQL:

~~~sql
RANK()       OVER (PARTITION BY group ORDER BY amount DESC)
DENSE_RANK() OVER (PARTITION BY group ORDER BY amount DESC)
SUM(amount)  OVER (PARTITION BY group ORDER BY amount DESC
                   ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW)
~~~

- {{rank(rows, dense)}}: {{dense=false}} trả RANK, {{dense=true}} trả DENSE_RANK. Trả {{List<Integer>}} thẳng hàng với đầu vào: phần tử {{i}} là hạng của {{rows.get(i)}}.
- {{runningTotal(rows)}}: trả {{List<Long>}} thẳng hàng với đầu vào, cộng dồn theo thứ tự {{amount}} giảm dần trong mỗi nhóm (frame ROWS: cộng từng dòng một). Dùng {{long}}.
- Trong một partition, sắp theo {{amount}} **giảm dần**. Tie (cùng group, cùng amount): các dòng tie nhận **cùng hạng**; khi duyệt để cộng dồn (ROWS), dòng đứng trước trong danh sách đầu vào được xử lý trước (sắp xếp ổn định).
- RANK nhảy hạng: sau {{k}} dòng cùng hạng {{r}}, hạng tiếp theo là {{r + k}}. DENSE_RANK không nhảy: {{r + 1}}.
- Đầu vào có thể lộn xộn, partition xen kẽ. **Không được sửa** danh sách đầu vào.`,
      starter: `class Row {
    final String group;
    final int amount;
    Row(String group, int amount) { this.group = group; this.amount = amount; }
}

class Window {
    List<Integer> rank(List<Row> rows, boolean dense) {
        throw new UnsupportedOperationException("TODO");
    }

    List<Long> runningTotal(List<Row> rows) {
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
    static void eq(Object expected, Object actual) {
        if (!Objects.equals(expected, actual)) throw new AssertionError("expected " + expected + " got " + actual);
    }
    static Row r(String g, int a) { return new Row(g, a); }

    public static void main(String[] args) {
        Window w = new Window();
        check("RANK with tie skips next rank", () -> {
            // desc by amount: 500,500,300 -> ranks 1,1,3
            eq(List.of(1, 1, 3), w.rank(List.of(r("A", 500), r("A", 500), r("A", 300)), false));
        });
        check("DENSE_RANK with tie does not skip", () -> {
            eq(List.of(1, 1, 2), w.rank(List.of(r("A", 500), r("A", 500), r("A", 300)), true));
        });
        check("rank per partition, interleaved input, aligned to input order", () -> {
            // A sorted desc: 30(idx1)->1, 10(idx3)->2 ; B: 20(idx0)->1, 5(idx2)->2
            eq(List.of(1, 1, 2, 2),
               w.rank(List.of(r("B", 20), r("A", 30), r("B", 5), r("A", 10)), false));
        });
        check("RANK skip accumulates across multiple ties", () -> {
            // 9,9,9,5,5,1 -> 1,1,1,4,4,6
            eq(List.of(1, 1, 1, 4, 4, 6),
               w.rank(List.of(r("G", 9), r("G", 9), r("G", 9), r("G", 5), r("G", 5), r("G", 1)), false));
        });
        check("DENSE_RANK never skips across ties", () -> {
            eq(List.of(1, 1, 1, 2, 2, 3),
               w.rank(List.of(r("G", 9), r("G", 9), r("G", 9), r("G", 5), r("G", 5), r("G", 1)), true));
        });
        check("running total desc per group resets and aligns with input", () -> {
            // X desc: 15(idx1)->15, 5(idx2)->20 ; Y: 7(idx0)->7
            eq(List.of(7L, 15L, 20L),
               w.runningTotal(List.of(r("Y", 7), r("X", 15), r("X", 5))));
        });
        check("running total with ties adds row by row (ROWS) in input order", () -> {
            // sort desc (stable): 30(idx2)->30, 10(idx0)->40, 10(idx1)->50; aligned to input [40,50,30]
            eq(List.of(40L, 50L, 30L),
               w.runningTotal(List.of(r("G", 10), r("G", 10), r("G", 30))));
        });
        check("input list is not modified", () -> {
            List<Row> input = new ArrayList<>(List.of(r("B", 2), r("A", 1), r("B", 1)));
            List<Row> before = new ArrayList<>(input);
            w.rank(input, false);
            w.runningTotal(input);
            for (int i = 0; i < input.size(); i++) {
                if (input.get(i) != before.get(i)) throw new AssertionError("input order changed at " + i);
            }
        });
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
      reference: `class Row {
    final String group;
    final int amount;
    Row(String group, int amount) { this.group = group; this.amount = amount; }
}

class Window {
    // Sap chi so theo (group asc, amount desc). List.sort on dinh (stable) -> tie giu thu tu dau vao.
    private static List<Integer> order(List<Row> rows) {
        List<Integer> idx = new ArrayList<>();
        for (int i = 0; i < rows.size(); i++) idx.add(i);
        idx.sort(Comparator.comparing((Integer i) -> rows.get(i).group)
                           .thenComparing((Integer i) -> rows.get(i).amount, Comparator.reverseOrder()));
        return idx;
    }

    List<Integer> rank(List<Row> rows, boolean dense) {
        Integer[] out = new Integer[rows.size()];
        String curGroup = null;
        int prevAmount = 0;
        int curRank = 0;   // rank của dòng vừa xử lý
        int seen = 0;      // số dòng đã thấy trong partition (dùng cho RANK nhảy)
        for (int i : order(rows)) {
            Row r = rows.get(i);
            if (!r.group.equals(curGroup)) {          // sang partition moi: reset
                curGroup = r.group; curRank = 0; seen = 0; prevAmount = 0;
            }
            seen++;
            if (curRank == 0 || r.amount != prevAmount) {
                curRank = dense ? curRank + 1 : seen; // DENSE: +1; RANK: nhay toi vi tri seen
                prevAmount = r.amount;
            }
            // tie (amount == prevAmount, curRank da dat): giu nguyen curRank
            out[i] = curRank;
        }
        return Arrays.asList(out);
    }

    List<Long> runningTotal(List<Row> rows) {
        Long[] out = new Long[rows.size()];
        String curGroup = null;
        long sum = 0;
        for (int i : order(rows)) {
            Row r = rows.get(i);
            if (!r.group.equals(curGroup)) { curGroup = r.group; sum = 0; }
            sum += r.amount;                          // ROWS: cong tung dong mot
            out[i] = sum;
        }
        return Arrays.asList(out);
    }
}`,
      hints: [
        'Sắp xếp một danh sách **chỉ số** theo {{(group, amount giảm dần)}}; dùng {{Comparator.reverseOrder()}} cho amount. {{List.sort}} ổn định nên tie giữ thứ tự đầu vào.',
        'RANK: khi gặp giá trị mới (hoặc đầu partition), đặt {{curRank = seen}} (số dòng đã thấy, tính cả dòng này) — đó là chỗ "nhảy". DENSE_RANK: đặt {{curRank = curRank + 1}}. Khi tie, giữ nguyên {{curRank}}.',
        'Luôn reset (group, rank, seen, sum) khi {{group}} đổi. Ghi kết quả vào {{out[i]}} với {{i}} là chỉ số gốc để thẳng hàng đầu vào.',
      ],
      explain: `### Vì sao RANK dùng {{seen}} còn DENSE_RANK dùng {{+1}}
{{seen}} đếm số dòng đã đi qua trong partition (1,2,3...). Khi một giá trị mới xuất hiện sau một cụm tie, hạng của nó theo RANK chính là vị trí {{seen}} — nên sau 3 dòng hạng 1, {{seen}} của dòng tiếp là 4, hạng nhảy thẳng tới 4. DENSE_RANK thì chỉ quan tâm "đây là mức giá trị khác thứ mấy", nên tăng 1 bất kể cụm tie trước lớn cỡ nào.

### Lỗi hay gặp
- **RANK không nhảy**: gán {{curRank = curRank + 1}} cho cả hai chế độ — ra kết quả DENSE_RANK dù gọi RANK. Test "skip accumulates" bắt lỗi này.
- **Quên reset {{seen}}/sum khi sang partition**: rank/tổng của nhóm B dính nhóm A. Test interleaved bắt.
- **Sửa {{rows}} trực tiếp**: hỏng với {{List.of}} và làm sai dữ liệu người gọi.
- **Trả kết quả theo thứ tự đã sắp** thay vì theo chỉ số gốc: giá trị đúng nhưng gắn nhầm dòng.
- **So sánh String group bằng {{==}}**: phải dùng {{equals}} (hoặc kiểm tra khác null an toàn). Ở đây group đến từ dữ liệu nên dùng {{equals}}.

### LAG thì sao?
Bài này tập trung vào rank/running total. LAG cùng mẫu: trong vòng duyệt đã sắp, giữ {{prevValue}} của dòng trước trong partition (reset khi đổi partition) và ghi {{prevValue}} (hoặc default nếu đầu partition) cho dòng hiện tại. Vì duyệt một lần sau sort nên mọi window function đều O(n log n) do sort + O(n) duyệt.`,
    },
  ],
  check: [
    {
      q: 'Trong một partition, amount giảm dần là 90, 90, 90, 70. {{RANK}} và {{DENSE_RANK}} của dòng 70 lần lượt là?',
      options: ['2 và 2', '3 và 2', '4 và 2', '4 và 4'],
      answer: 2,
      explain: `**4 và 2 đúng**: ba dòng 90 cùng hạng 1. RANK nhảy qua 2, 3 nên dòng 70 là hạng 4. DENSE_RANK không nhảy nên dòng 70 là hạng 2. **2 và 2** sai vì RANK phải nhảy. **3 và 2** sai vì chỉ nhảy 1 bậc (nhầm với "bỏ qua 1 hạng"); RANK nhảy đúng bằng số dòng tie (3 dòng). **4 và 4** sai vì DENSE_RANK không bao giờ nhảy.`,
    },
    {
      q: 'Tại sao {{SUM(amount) OVER (ORDER BY tx_date ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW)}} an toàn hơn khi không ghi frame, với sao kê có thể có nhiều giao dịch cùng ngày?',
      options: ['ROWS chạy nhanh hơn RANGE', 'ROWS cộng từng dòng một nên hai giao dịch cùng tx_date không bị gộp thành một tổng như RANGE mặc định', 'RANGE không hỗ trợ SUM', 'ROWS tự động thêm tie-breaker theo id'],
      answer: 1,
      explain: `**Phương án 2 đúng**: mặc định (có ORDER BY, không ghi frame) là RANGE, coi các dòng cùng giá trị ORDER BY là peer và cộng hết chúng vào cùng lúc — hai giao dịch cùng ngày nhận cùng số dư lũy kế, sai cho sao kê. ROWS cộng từng dòng theo thứ tự vật lý trong cửa sổ. **Phương án 1** thường đúng về chi phí nhưng không phải lý do tính đúng. **Phương án 3** sai, RANGE dùng được với SUM. **Phương án 4** sai: ROWS không tự thêm cột; bạn phải tự thêm {{id}} vào ORDER BY để thứ tự tie xác định.`,
    },
    {
      q: 'Lấy "3 giao dịch lớn nhất mỗi khách" và có thể có nhiều giao dịch đồng số tiền lớn nhất. Cách nào hợp nghĩa "ba mức cao nhất" và không cắt ngẫu nhiên?',
      options: ['WHERE ROW_NUMBER() ... <= 3', 'WHERE RANK() ... <= 3 (hoặc DENSE_RANK() <= 3 tùy định nghĩa mức)', 'LIMIT 3 trong subquery định nghĩa window', 'GROUP BY customer_id HAVING COUNT(*) <= 3'],
      answer: 1,
      explain: `**Phương án 2 đúng**: RANK/DENSE_RANK gán cùng hạng cho các dòng tie nên {{rk <= 3}} giữ tất cả dòng thuộc ba mức cao nhất (có thể nhiều hơn 3 dòng), không cắt ngẫu nhiên. **Phương án 1** sai cho yêu cầu này: ROW_NUMBER gán số duy nhất nên cắt bừa một dòng tie. **Phương án 3** sai nghiêm trọng: LIMIT trong subquery window lấy top-3 **toàn bảng** rồi mới partition, không phải mỗi khách. **Phương án 4** hoàn toàn sai nghĩa (đếm số giao dịch, không xếp hạng theo amount).`,
    },
  ],
  related: ['sql-001', 'sql-005', 'sql-006'],
  tags: ['window function', 'row_number', 'rank', 'dense_rank', 'running total', 'lag', 'partition by'],
},
{
  id: 'lesson-sql-005',
  track: 'sql',
  order: 5,
  title: 'Thuật toán JOIN mà database dùng: nested loop, hash join, merge join và đọc EXPLAIN',
  level: 'senior',
  minutes: 30,
  goals: [
    'Mô tả cách nested loop, hash join, merge join hoạt động và khi nào optimizer (bộ tối ưu) chọn từng loại',
    'Giải thích vì sao JOIN thiếu index trở thành nested loop chậm (n × m) và null key không khớp trong equi-join',
    'Đọc EXPLAIN (PostgreSQL) ở mức nhận ra Hash Join / Nested Loop / Merge Join / Seq Scan và biết bước xử lý đầu tiên',
  ],
  body: `### JOIN trong SQL chỉ nói "muốn gì", DB tự chọn "làm thế nào"
Khi bạn viết {{SELECT ... FROM orders o JOIN customer c ON o.customer_id = c.id}}, bạn mô tả kết quả mong muốn. **Optimizer** (bộ tối ưu truy vấn, thành phần của DB quyết định kế hoạch thực thi) ước lượng kích thước dữ liệu và chọn thuật toán join. Ba thuật toán chính: nested loop, hash join, merge join. Hiểu chúng giúp bạn đọc EXPLAIN và biết vì sao một câu JOIN bỗng chậm.

Quy ước: bảng duyệt vòng ngoài là **outer/build/probe** tùy ngữ cảnh, bảng tra vòng trong là **inner**.

### Nested loop join
Đơn giản nhất: với mỗi dòng outer, tìm dòng khớp trong inner.

~~~java
// nested loop co ban (khong index tren inner)
for (Row o : outer) {
    for (Row i : inner) {            // duyet toan bo inner cho MOI dong outer
        if (eq(o.key, i.key)) emit(o, i);
    }
}
~~~

- Không index trên inner: **n × m** phép so sánh (n dòng outer, m dòng inner). Hai bảng 10.000 dòng = 100 triệu so sánh.
- Inner có index (B-tree) trên khóa join: vòng trong tra cây ~{{log2(m)}} bước, tổng **n × log m**. Outer 100 dòng, inner 10 triệu có index: ~2.400 bước.
- DB chọn khi: outer rất nhỏ (sau lọc WHERE) và inner có index; hoặc join **không phải đẳng thức** ({{a.ts BETWEEN b.start AND b.end}}) — hash/merge không dùng được cho điều kiện phi {{=}}.

### Hash join
Chạy hai pha, chỉ dùng cho **equi-join** (so bằng {{=}}):
1. **Build**: đọc bên **nhỏ hơn**, đưa mỗi dòng vào bảng băm (hash table, cấu trúc tra cứu theo khóa trung bình O(1)) theo khóa join.
2. **Probe**: đọc bên lớn, băm khóa rồi tra bảng băm để tìm dòng khớp.

Tổng ~**O(n + m)**: đọc mỗi bên một lần. Bộ nhớ cần cỡ bên build; PostgreSQL giới hạn bởi {{work_mem}}. Tràn bộ nhớ thì chia batch ghi tạm đĩa (chậm). DB chọn hash join khi hai bên đều lớn và join bằng {{=}}.

### Merge join
Nếu **cả hai bên đã sắp xếp** theo khóa join (nhờ index hoặc nhờ sort), dùng hai con trỏ đi song song như pha merge của merge sort: khóa bên nào nhỏ hơn thì tiến con trỏ bên đó. ~**O(n + m)** nếu đã có thứ tự, cộng O(n log n) nếu phải sort. Cần join bằng {{=}}. Ít phổ biến hơn hash join trên dữ liệu không có sẵn thứ tự, nhưng rất tốt khi index đã cho thứ tự.

| Thuật toán | Xấp xỉ chi phí | Bộ nhớ | Điều kiện join | Khi optimizer chọn |
|---|---|---|---|---|
| Nested loop (no index) | n × m | rất ít | bất kỳ | inner rất nhỏ, hiếm khi tốt với bảng lớn |
| Nested loop (index) | n × log m | ít | bất kỳ | outer nhỏ, inner lớn có index (OLTP điển hình) |
| Hash join | n + m | bảng băm cỡ bên nhỏ | chỉ {{=}} | hai bên lớn, equi-join, đủ RAM |
| Merge join | n+m (+ sort) | ít nếu đã sort | chỉ {{=}} | hai bên đã sắp theo khóa / sau sort |

### Vì sao thiếu index làm JOIN chậm
Câu chuyện hay gặp: {{orders JOIN customer ON orders.customer_id = customer.id}}. {{customer.id}} là khóa chính nên có index; nhưng nếu lọc {{orders}} ra 50.000 dòng và {{customer}} bị quét theo cách ngược (hoặc planner chọn nested loop với inner là Seq Scan trên bảng lớn) mà **thiếu index trên khóa join phía inner**, vòng trong thành duyệt toàn bảng lặp lại. 50.000 × (quét bảng) = hàng tỷ phép đọc. Thêm index trên cột join (hoặc để planner chọn hash join) đưa về n log m hoặc n+m.

### Null key không khớp trong equi-join (ngữ nghĩa SQL)
Trong SQL, {{NULL = NULL}} cho kết quả **UNKNOWN** (không phải TRUE), nên dòng có khóa join là NULL **không khớp** với dòng nào, kể cả dòng khác cũng NULL. Đây là hành vi bắt buộc của equi-join. Mô phỏng join bằng Java phải giữ đúng ngữ nghĩa này (bài tập kiểm tra).

### Đọc EXPLAIN (PostgreSQL) ở mức nhận ra thuật toán
{{EXPLAIN ANALYZE}} chạy thật câu lệnh và in kế hoạch. Bạn cần nhận ra:

~~~text
Hash Join  (actual time=1.2..45.6 rows=4820 loops=1)
  Hash Cond: (o.customer_id = c.id)
  ->  Seq Scan on orders o  (actual ... rows=50000 loops=1)
  ->  Hash  (actual ... rows=12000 loops=1)
        ->  Seq Scan on customer c  (actual ... rows=12000 loops=1)
~~~

~~~text
Nested Loop  (actual time=0.1..8200.0 rows=4820 loops=1)
  ->  Seq Scan on orders o  (actual ... rows=50000 loops=1)
  ->  Seq Scan on customer c  (actual ... rows=1 loops=50000)
        Filter: (c.id = o.customer_id)
~~~

Nhận biết:
- {{Hash Join}} / {{Hash Cond}}: hash join. {{Seq Scan}} hai bên + node {{Hash}} là bình thường khi bảng vừa/lớn.
- {{Nested Loop}} với inner là {{Seq Scan}} và {{loops}} lớn (50.000): inner bị quét lặp lại 50.000 lần — dấu hiệu kinh điển của thiếu index trên khóa join hoặc ước lượng sai.
- {{Merge Join}} / {{Merge Cond}}: merge join, thường kèm {{Index Scan}} (đã có thứ tự) hoặc {{Sort}}.
- {{Seq Scan}} (quét tuần tự toàn bảng) không xấu tuyệt đối; xấu khi lặp lại nhiều lần ({{loops}} lớn) hoặc trên bảng rất lớn mà chỉ cần ít dòng có index phù hợp.

> Pitfall thực tế: tin planner tuyệt đối. Planner chọn theo **ước lượng**; thống kê cũ (chưa {{ANALYZE}} sau import lớn) khiến nó tưởng outer nhỏ nên chọn nested loop, thực tế outer lớn và query chết đứng. Bước đầu khi join chậm: {{EXPLAIN (ANALYZE, BUFFERS)}} rồi so {{rows}} ước lượng với {{actual rows}} — lệch > 10 lần là manh mối lớn. Sửa bằng {{ANALYZE}}, thêm index đúng, hoặc (cẩn thận) ép kế hoạch chỉ để chẩn đoán.

> Senior tip: trên PostgreSQL, {{enable_nestloop = off}} (đặt tạm cho session) là cách chẩn đoán nhanh: nếu tắt nested loop mà query hết chậm, vấn đề là planner chọn sai nested loop (thường do ước lượng sai hoặc thiếu index) — đừng để cờ này bật lâu dài trong production. Hash join tốn {{work_mem}}; nếu EXPLAIN hiện {{Batches > 1}} trên node Hash thì bảng băm tràn đĩa, cân nhắc tăng {{work_mem}} cho session/query đó (không tăng global bừa bãi).

### Liên hệ phỏng vấn
Câu hay gặp: "DB join hai bảng thế nào?", "Query join chậm, bạn làm gì?", "Khác nhau hash join và nested loop". Trả lời tốt: nêu ba thuật toán + chi phí (n×m, n×log m, n+m) + điều kiện ({{=}} cho hash/merge), nói optimizer chọn theo ước lượng/kích thước/index, và đưa quy trình: EXPLAIN ANALYZE → nhận thuật toán/loops/rows lệch → kiểm tra index khóa join → ANALYZE thống kê. Nhắc null key không khớp là điểm cộng thể hiện hiểu ngữ nghĩa SQL.`,
  exercises: [
    {
      title: 'Nested loop, hash join, merge join: kết quả giống nhau và đếm phép so sánh',
      prompt: `{{Row}} có sẵn: {{key}} ({{Integer}}, có thể {{null}}) và {{val}} (String). Viết lớp {{Joins}} cài ba thuật toán equi-join trên {{key}} ({{left.key = right.key}}). Mỗi cặp kết quả là một mảng 2 phần tử String: {{left.val}} rồi {{right.val}} (trái trước, phải sau). Thứ tự các cặp trong kết quả không quan trọng.

Quy tắc (giống SQL): **key {{null}} không khớp với bất kỳ dòng nào**, kể cả key {{null}} khác. Key trùng: 1 dòng trái khớp 2 dòng phải → 2 cặp.

- {{nestedLoop(left, right)}}: duyệt mọi cặp. Mỗi lần kiểm tra một cặp {{(l, r)}} (kể cả khi key null khiến không thể khớp) tính là **1 phép so sánh**. Trả số so sánh qua {{getComparisons()}} (đặt lại 0 mỗi lần gọi).
- {{hashJoin(left, right)}}: build bảng băm từ bên **nhỏ hơn** (size bằng nhau chọn {{left}}), probe bên còn lại. Mỗi lần tra/kiểm tra khớp cho một dòng probe tính **1 phép so sánh** (đếm số dòng probe được xét tra cứu; bỏ qua dòng probe có key null không tra). {{getComparisons()}} đặt lại 0 mỗi lần gọi.
- {{mergeJoin(left, right)}}: giả sử đầu vào **chưa** sắp; hãy copy và sắp hai bên theo {{key}} tăng dần ({{null}} xếp cuối), rồi merge bằng hai con trỏ. Mỗi lần bạn so sánh hai khóa để quyết định tiến con trỏ (hoặc để phát hiện khớp) tính **1 phép so sánh**. Xử lý đúng key trùng (nhóm nhiều dòng cùng key ở cả hai bên). {{getComparisons()}} đặt lại 0 mỗi lần gọi.

Ba hàm phải trả **cùng tập cặp** (bỏ qua thứ tự) trên cùng dữ liệu.`,
      starter: `class Row {
    final Integer key;   // co the null
    final String val;
    Row(Integer key, String val) { this.key = key; this.val = val; }
}

class Joins {
    private long comparisons = 0;
    long getComparisons() { return comparisons; }

    List<String[]> nestedLoop(List<Row> left, List<Row> right) {
        throw new UnsupportedOperationException("TODO");
    }

    List<String[]> hashJoin(List<Row> left, List<Row> right) {
        throw new UnsupportedOperationException("TODO");
    }

    List<String[]> mergeJoin(List<Row> left, List<Row> right) {
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
    static void eq(Object expected, Object actual) {
        if (!Objects.equals(expected, actual)) throw new AssertionError("expected " + expected + " got " + actual);
    }
    static List<String> norm(List<String[]> pairs) {
        List<String> out = new ArrayList<>();
        for (String[] p : pairs) out.add(p[0] + "|" + p[1]);
        Collections.sort(out);
        return out;
    }
    static Row r(Integer k, String v) { return new Row(k, v); }

    public static void main(String[] args) {
        Joins j = new Joins();
        List<Row> L1 = List.of(r(1, "a"), r(2, "b"), r(3, "c"));
        List<Row> R1 = List.of(r(2, "x"), r(3, "y"), r(4, "z"));

        check("nested loop basic and count n*m", () -> {
            eq(List.of("b|x", "c|y"), norm(j.nestedLoop(L1, R1)));
            eq(9L, j.getComparisons());
        });
        check("hash join basic matches nested loop", () -> {
            eq(norm(j.nestedLoop(L1, R1)), norm(j.hashJoin(L1, R1)));
        });
        check("merge join basic matches nested loop", () -> {
            eq(norm(j.nestedLoop(L1, R1)), norm(j.mergeJoin(L1, R1)));
        });
        check("null key never matches (all three)", () -> {
            List<Row> L = List.of(r(null, "n1"), r(1, "a"));
            List<Row> R = List.of(r(null, "n2"), r(1, "b"));
            List<String> expect = List.of("a|b");
            eq(expect, norm(j.nestedLoop(L, R)));
            eq(expect, norm(j.hashJoin(L, R)));
            eq(expect, norm(j.mergeJoin(L, R)));
        });
        check("duplicate keys produce all pairs (all three)", () -> {
            List<Row> L = List.of(r(1, "a1"), r(1, "a2"));
            List<Row> R = List.of(r(1, "b1"), r(1, "b2"), r(2, "c"));
            List<String> expect = List.of("a1|b1", "a1|b2", "a2|b1", "a2|b2");
            eq(expect, norm(j.nestedLoop(L, R)));
            eq(expect, norm(j.hashJoin(L, R)));
            eq(expect, norm(j.mergeJoin(L, R)));
        });
        check("hash join builds from smaller side and probes larger (count)", () -> {
            List<Row> small = List.of(r(1, "s"));
            List<Row> big = new ArrayList<>();
            for (int i = 0; i < 20; i++) big.add(r(i, "b" + i));
            j.hashJoin(small, big); // build small(1), probe big(20)
            eq(20L, j.getComparisons());
            j.hashJoin(big, small); // build small(1), probe big(20) regardless of arg order
            eq(20L, j.getComparisons());
        });
        check("nested loop far more comparisons than hash/merge on larger input", () -> {
            List<Row> left = new ArrayList<>(), right = new ArrayList<>();
            for (int i = 0; i < 30; i++) left.add(r(i, "L" + i));
            for (int i = 0; i < 40; i++) right.add(r(i % 30, "R" + i));
            List<String> nl = norm(j.nestedLoop(left, right)); eq(1200L, j.getComparisons());
            List<String> hj = norm(j.hashJoin(left, right)); long hc = j.getComparisons();
            List<String> mj = norm(j.mergeJoin(left, right)); long mc = j.getComparisons();
            eq(nl, hj); eq(nl, mj);
            if (!(hc < 1200L && mc < 1200L)) throw new AssertionError("expected hash/merge fewer comparisons than 1200, got hash=" + hc + " merge=" + mc);
        });
        check("unsorted input handled by merge join", () -> {
            List<Row> L = List.of(r(3, "c"), r(1, "a"), r(2, "b"));
            List<Row> R = List.of(r(2, "x"), r(4, "z"), r(1, "y"));
            eq(List.of("a|y", "b|x"), norm(j.mergeJoin(L, R)));
        });
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
      reference: `class Row {
    final Integer key;   // co the null
    final String val;
    Row(Integer key, String val) { this.key = key; this.val = val; }
}

class Joins {
    private long comparisons = 0;
    long getComparisons() { return comparisons; }

    private static boolean keyEq(Integer a, Integer b) {
        if (a == null || b == null) return false; // SQL: NULL khong khop NULL
        return a.equals(b);
    }

    List<String[]> nestedLoop(List<Row> left, List<Row> right) {
        comparisons = 0;
        List<String[]> out = new ArrayList<>();
        for (Row l : left) {
            for (Row r : right) {
                comparisons++;                 // mỗi cặp được kiểm tra
                if (keyEq(l.key, r.key)) out.add(new String[]{l.val, r.val});
            }
        }
        return out;
    }

    List<String[]> hashJoin(List<Row> left, List<Row> right) {
        comparisons = 0;
        boolean buildLeft = left.size() <= right.size();
        List<Row> build = buildLeft ? left : right;
        List<Row> probe = buildLeft ? right : left;
        // build: bo qua key null (khong the khop), gom theo key
        Map<Integer, List<Row>> table = new HashMap<>();
        for (Row b : build) {
            if (b.key == null) continue;
            table.computeIfAbsent(b.key, k -> new ArrayList<>()).add(b);
        }
        List<String[]> out = new ArrayList<>();
        for (Row p : probe) {
            if (p.key == null) continue;       // null khong tra cuu
            comparisons++;                     // một lần tra/kiểm tra cho dòng probe
            List<Row> matches = table.get(p.key);
            if (matches == null) continue;
            for (Row b : matches) {
                Row l = buildLeft ? b : p;
                Row r = buildLeft ? p : b;
                out.add(new String[]{l.val, r.val});
            }
        }
        return out;
    }

    List<String[]> mergeJoin(List<Row> left, List<Row> right) {
        comparisons = 0;
        Comparator<Row> cmp = (a, b) -> {
            if (a.key == null && b.key == null) return 0;
            if (a.key == null) return 1;       // null cuoi
            if (b.key == null) return -1;
            return Integer.compare(a.key, b.key);
        };
        List<Row> L = new ArrayList<>(left); L.sort(cmp);
        List<Row> R = new ArrayList<>(right); R.sort(cmp);
        // bỏ qua dưới null (null không khớp) bằng cách giới hạn phạm vi không-null
        int lEnd = L.size(); while (lEnd > 0 && L.get(lEnd - 1).key == null) lEnd--;
        int rEnd = R.size(); while (rEnd > 0 && R.get(rEnd - 1).key == null) rEnd--;
        List<String[]> out = new ArrayList<>();
        int i = 0, j = 0;
        while (i < lEnd && j < rEnd) {
            comparisons++;
            int c = Integer.compare(L.get(i).key, R.get(j).key);
            if (c < 0) { i++; }
            else if (c > 0) { j++; }
            else {
                // khớp: xuất tích Descartes của nhóm key bằng nhau ở cả hai bên
                int key = L.get(i).key;
                int jStart = j;
                while (i < lEnd && L.get(i).key.equals(key)) {
                    int jj = jStart;
                    while (jj < rEnd && R.get(jj).key.equals(key)) {
                        out.add(new String[]{L.get(i).val, R.get(jj).val});
                        jj++;
                    }
                    i++;
                }
                j = jStart;
                while (j < rEnd && R.get(j).key.equals(key)) j++;
            }
        }
        return out;
    }
}`,
      hints: [
        'Null key: trong {{keyEq}} trả false nếu bên nào null. Hash join: đừng đưa key null vào bảng băm và đừng probe bằng key null. Merge join: xếp null xuống cuối rồi chỉ duyệt phần không-null.',
        'Hash join build từ bên nhỏ: chọn {{build/probe}} theo size, nhớ cờ để ghép cặp vẫn theo thứ tự {{left.val, right.val}}. Dùng {{Map<Integer, List<Row>>}} vì key có thể trùng.',
        'Merge join với key trùng: khi hai con trỏ gặp khóa bằng nhau, phải phát hết cặp (mọi dòng trái trong nhóm × mọi dòng phải trong nhóm), rồi nhảy cả hai con trỏ qua hết nhóm đó. So sánh khóa để quyết định tiến con trỏ mới tính là comparison.',
      ],
      explain: `### Vì sao ba thuật toán ra cùng kết quả
Chúng cùng thực hiện equi-join {{left.key = right.key}} với cùng ngữ nghĩa (null không khớp, key trùng sinh nhiều cặp). Khác nhau chỉ là **cách tìm** cặp khớp: nested loop thử mọi cặp, hash join tra bảng băm, merge join tận dụng thứ tự. Đó là lý do optimizer coi chúng là các kế hoạch thay thế cho cùng một câu SQL.

### Số phép so sánh phản ánh điều gì
- Nested loop: luôn {{n*m}} (test 30×40 = 1200) — tệ nhất khi hai bên lớn, đúng như Seq Scan lồng nhau với {{loops}} lớn trong EXPLAIN.
- Hash join: ~số dòng probe (sau khi bỏ null) vì mỗi dòng tra băm O(1) — tương ứng đọc mỗi bên một lần.
- Merge join: số lần so sánh để tiến hai con trỏ trên dữ liệu đã sort ~tuyến tính theo n+m (cộng chi phí sort bạn không đếm ở đây). Khi dữ liệu đã có thứ tự sẵn (từ index), merge join rất rẻ.

### Lỗi hay gặp
- **Coi {{null == null}} là khớp**: sai ngữ nghĩa SQL; dùng {{equals}} sau khi loại null, hoặc kiểm tra null trả false.
- **Hash join quên key trùng**: dùng {{Map<Integer, Row>}} ghi đè → mất cặp.
- **Hash join đảo trái/phải** khi build từ bên right: cặp trả về bị ngược thứ tự.
- **Merge join không gom nhóm key trùng**: chỉ ghép một cặp rồi tiến một con trỏ → mất các cặp còn lại trong nhóm.
- **Đếm comparison sai quy ước**: không ảnh hưởng tính đúng kết quả nhưng làm bạn hiểu sai chi phí; bám theo mô tả (nested loop: mỗi cặp; hash: mỗi lần tra probe).

### Liên hệ EXPLAIN
Nested loop 1200 so sánh ở bài tập tương tự {{Nested Loop}} với {{loops}} lớn và inner scan lặp lại. Hash join "đọc mỗi bên một lần" tương tự node {{Hash Join}} ({{Hash}} build một lần, probe scan một lần). Merge join tương tự {{Merge Join}} trên {{Index Scan}} đã có thứ tự. Khi bạn thấy {{Nested Loop}} + {{Seq Scan}} + {{loops}} lớn, câu hỏi đầu tiên: "có index trên khóa join không, thống kê có đúng không?"`,
    },
  ],
  check: [
    {
      q: 'Trong equi-join SQL {{A JOIN B ON A.k = B.k}}, hai dòng có {{A.k = NULL}} và {{B.k = NULL}} có khớp nhau không?',
      options: ['Có, vì cả hai đều NULL', 'Không, vì {{NULL = NULL}} cho kết quả UNKNOWN nên không khớp trong join', 'Có, nếu dùng hash join', 'Chỉ khớp khi dùng {{IS NOT DISTINCT FROM}} ngầm'],
      answer: 1,
      explain: `**Phương án 2 đúng**: trong SQL ba giá trị (TRUE/FALSE/UNKNOWN), {{NULL = NULL}} là UNKNOWN; điều kiện join chỉ nhận TRUE, nên cặp NULL-NULL không được phát ra. **Phương án 1** sai vì nhầm logic hai giá trị. **Phương án 3** sai: thuật toán (hash/nested/merge) không đổi ngữ nghĩa SQL. **Phương án 4** sai: join thông thường dùng {{=}}, không tự dùng {{IS NOT DISTINCT FROM}} (toán tử coi hai NULL là bằng nhau, PostgreSQL hỗ trợ nhưng phải viết rõ).`,
    },
    {
      q: 'EXPLAIN ANALYZE hiện {{Nested Loop}}; node inner là {{Seq Scan on customer}} với {{loops=50000}}. Dấu hiệu này thường nghĩa là gì và xử lý đầu tiên là gì?',
      options: ['Hash join bị tắt; bật lại là hết chậm', 'Inner bị quét toàn bộ 50.000 lần, thường do thiếu index trên khóa join hoặc ước lượng sai; kiểm tra index và {{ANALYZE}}/so rows ước lượng với actual', 'Bảng customer quá nhỏ nên Seq Scan là tối ưu', 'Merge join sẽ tự thay thế ở lần chạy sau'],
      answer: 1,
      explain: `**Phương án 2 đúng**: {{Seq Scan}} + {{loops}} lớn = quét lặp lại toàn bảng (hành vi nested loop không index, chi phí n×m). Kiểm tra index trên cột join của inner, và so {{rows}} ước lượng vs {{actual rows}} vì thống kê sai khiến planner chọn nested loop nhầm. **Phương án 1** sai: tắt/bật không giải quyết nguyên nhân gốc (thiếu index/ước lượng sai). **Phương án 3** mâu thuẫn: nếu nhỏ thì {{loops=50000}} không xuất hiện như vậy cho một bảng nhỏ cố định; và Seq Scan lặp 50.000 lần vẫn đắt. **Phương án 4** sai: planner không "tự học" giữa các lần chạy theo kiểu đó; nó dựa vào thống kê.`,
    },
    {
      q: 'Khi nào optimizer thường chọn hash join thay vì nested loop (có index)?',
      options: ['Khi outer rất nhỏ sau lọc và inner có index tốt', 'Khi join không phải đẳng thức ({{<}}, {{BETWEEN}})', 'Khi hai bên đều lớn, equi-join ({{=}}), và bảng băm vừa bộ nhớ', 'Khi cả hai bên đã có sẵn thứ tự theo khóa join từ index'],
      answer: 2,
      explain: `**Phương án 3 đúng**: hai bên lớn thì n×log m (nested loop index) vẫn đắt nếu n lớn; hash join ~n+m với equi-join, đọc mỗi bên một lần, miễn bảng băm vừa RAM. **Phương án 1** là trường hợp nested loop có index thắng. **Phương án 2** loại hash/merge (chỉ hỗ trợ {{=}}), thường buộc nested loop. **Phương án 4** nghiêng về merge join (tận dụng thứ tự sẵn, không cần build hash table).`,
    },
  ],
  related: ['sql-015', 'sql-017', 'sql-023', 'db-001'],
  tags: ['join', 'nested loop', 'hash join', 'merge join', 'explain', 'optimizer'],
},
{
  id: 'lesson-sql-006',
  track: 'sql',
  order: 6,
  title: 'MVCC và transaction isolation: snapshot, phantom read và deadlock',
  level: 'senior',
  minutes: 30,
  goals: [
    'Giải thích MVCC (Multi-Version Concurrency Control) là gì và vì sao reader không chặn writer',
    'Phân biệt READ COMMITTED và REPEATABLE READ ở PostgreSQL, biết lỗi nào xuất hiện',
    'Nhận ra deadlock và cách DB xử lý (abort một transaction)',
  ],
  body: `### Transaction là gì (và vì sao isolation quan trọng)
**Transaction** (giao dịch) là một nhóm câu lệnh DB chạy như một đơn vị: hoặc tất cả thành công (commit, xác nhận lưu), hoặc tất cả thất bại và quay lại (rollback, hoàn tác). Ví dụ chuyển tiền: trừ tài khoản A và cộng tài khoản B phải cùng thành công; nếu chỉ trừ A mà chưa cộng B thì tiền "mất".

Khi nhiều transaction chạy **đồng thời** (cùng lúc), DB phải quyết định: transaction này có thấy dữ liệu đang được transaction khác sửa chưa? Quyết định đó gọi là **isolation level** (mức cô lập). Mức cô lập càng chặt thì dữ liệu càng "nhất quán" khi đọc, nhưng thường tốn chi phí hơn (hoặc dễ bị abort để retry). PostgreSQL 15 dùng cơ chế MVCC để cân bằng giữa đúng dữ liệu và hiệu năng.

### MVCC là gì
**MVCC** (Multi-Version Concurrency Control, điều khiển đồng thời bằng nhiều phiên bản) là cơ chế DB giữ **nhiều phiên bản** của cùng một dòng dữ liệu. Khi bạn {{UPDATE}}, DB thường **không ghi đè** phiên bản cũ tại chỗ ngay lập tức, mà tạo ra **phiên bản mới** của dòng; phiên bản cũ vẫn còn để các transaction đang đọc theo "ảnh chụp" cũ tiếp tục dùng.

- **Reader** (câu {{SELECT}} đọc dữ liệu): đọc theo **snapshot** (ảnh chụp dữ liệu nhìn thấy tại một thời điểm) của nó.
- **Writer** ({{INSERT/UPDATE/DELETE}}): tạo phiên bản mới hoặc đánh dấu phiên bản cũ không còn nhìn thấy với các snapshot sau.

Vì reader đọc snapshot riêng, reader thường **không chặn writer**, và writer cũng **không chặn reader**. Đây là lợi ích lớn của MVCC so với cách chỉ dùng lock (khóa dòng) cho mọi thao tác.

Analog đời thường: giống lịch sử phiên bản tài liệu — người đang đọc bản lúc 10:00 vẫn xem trọn vẹn bản đó, dù người khác lưu bản mới lúc 10:01. Họ chỉ thấy bản mới khi "tải lại" theo thời điểm mới.

> Lưu ý thuật ngữ: PostgreSQL gắn thông tin nhìn thấy phiên bản bằng các trường nội bộ (thường nói tới {{xmin}}/{{xmax}} trong tuple header). Bạn không cần nhớ chi tiết bit khi đi phỏng vấn junior/mid, nhưng nên hiểu ý: mỗi phiên bản có dấu vết "ai tạo, ai xoá" để quyết định snapshot nào thấy nó.

### Snapshot và isolation level (PostgreSQL 15)
**Isolation level** được đặt cho transaction (ví dụ {{BEGIN ISOLATION LEVEL REPEATABLE READ;}}) hoặc dùng mặc định của DB.

- **READ COMMITTED** (mặc định PostgreSQL): mỗi câu lệnh {{SELECT}} lấy snapshot **mới** tại thời điểm câu đó chạy. Trong cùng một transaction, câu SELECT thứ hai có thể thấy dữ liệu đã commit bởi transaction khác sau câu SELECT thứ nhất. Hiện tượng này gọi là **non-repeatable read** (đọc lại cùng điều kiện nhưng kết quả khác).
- **REPEATABLE READ** (PostgreSQL): snapshot được cố định từ câu lệnh đầu tiên của transaction; mọi {{SELECT}} sau trong transaction đó nhìn thấy **cùng** tập phiên bản (trừ thay đổi do chính transaction đó tạo). Vì vậy không bị non-repeatable read. PostgreSQL còn không cho bạn thấy **phantom read** (dòng mới "xuất hiện" như ma) theo nghĩa snapshot: bạn không thấy dòng mới commit sau snapshot. Tuy nhiên, vẫn có thể xảy ra **serialization anomaly** (ví dụ write skew: hai transaction cùng đọc trạng thái hợp lệ rồi ghi theo cách làm tổng thể không hợp lệ); PostgreSQL sẽ báo lỗi ở mức SERIALIZABLE, còn ở REPEATABLE READ dạng anomaly này có thể không bị chặn như SERIALIZABLE.
- **SERIALIZABLE**: mức chặt nhất. PostgreSQL dùng kỹ thuật phát hiện xung đột (SSI, Serializable Snapshot Isolation) để đảm bảo kết quả như thể các transaction chạy tuần tự. Khi phát hiện nguy cơ anomaly, DB **abort** transaction với lỗi {{serialization_failure}} (SQLSTATE {{40001}}). Ứng dụng bắt buộc phải **retry** (chạy lại transaction).

### Bảng so sánh nhanh (PostgreSQL 15)
| Isolation | Non-repeatable read | Phantom read (theo snapshot PG) | Ghi chú hiệu năng/ứng dụng |
|---|---|---|---|
| READ COMMITTED | có thể | có thể | mặc định, phù hợp nhiều API OLTP (xử lý giao dịch ngắn) |
| REPEATABLE READ | không | không | snapshot cố định; cẩn thận logic ghi đồng thời (write skew) |
| SERIALIZABLE | không | không | an toàn nhất về tính tuần tự; có thể abort {{40001}}, phải retry |

### Vì sao reader không chặn writer (và cái giá phải trả)
Reader đọc theo snapshot nên không cần xin lock đọc trên từng dòng dữ liệu nghiệp vụ như nhiều hệ lock-based truyền thống. Writer tạo phiên bản mới; phiên bản cũ chỉ được dọn khi chắc chắn không transaction/snapshot nào còn cần.

Cái giá:
- **Tốn dung lượng**: nhiều phiên bản tồn tại tạm thời.
- **Cần dọn dẹp**: PostgreSQL dùng {{VACUUM}} (và autovacuum) để thu hồi không gian từ các tuple chết (dead tuples). {{UPDATE/DELETE}} nhiều mà autovacuum theo không kịp có thể gây **bloat** (bảng/phình to, hiệu năng giảm).

### Deadlock là gì và DB xử lý thế nào
**Deadlock** (kẹt chết) xảy ra khi hai (hoặc nhiều) transaction chờ nhau theo vòng: T1 giữ lock trên A và chờ lock trên B; T2 giữ lock trên B và chờ lock trên A. Không ai nhường ai thì hệ đứng.

DB duy trì cấu trúc chờ (thường mô tả như **wait-for graph**) và định kỳ phát hiện **chu trình** (cycle). Khi phát hiện deadlock, DB chọn một transaction làm **victim** (nạn nhân, thường cân nhắc chi phí/tiến độ) và **abort** nó, trả lỗi {{deadlock_detected}} (SQLSTATE {{40P01}} ở PostgreSQL). Transaction còn lại có thể tiếp tục.

Ứng dụng **phải** bắt lỗi {{40P01}} (và thường cả {{40001}} với SERIALIZABLE) rồi **retry** toàn bộ transaction với backoff (chờ ngắn, có thể tăng dần). Không retry mọi lỗi SQL bừa bãi — chỉ retry lỗi tạm thời (transient) phù hợp.

~~~java
// Ý tưởng retry (minh hoạ): chỉ retry mã lỗi transient
for (int attempt = 1; attempt <= 3; attempt++) {
    try {
        runBusinessTransaction();
        break; // thành công
    } catch (SQLException e) {
        String sqlState = e.getSQLState();
        boolean transientErr = "40001".equals(sqlState) || "40P01".equals(sqlState);
        if (!transientErr || attempt == 3) throw e;
        Thread.sleep(50L * attempt); // backoff đơn giản
    }
}
~~~

### Liên hệ phỏng vấn
Khi được hỏi "Transaction isolation là gì, bạn chọn level nào?":
1. Giải thích ngắn: isolation kiểm soát mức dữ liệu một transaction thấy khi có transaction khác chạy đồng thời; PostgreSQL dùng MVCC (snapshot).
2. Nêu READ COMMITTED là mặc định, hợp OLTP thông thường.
3. Nêu REPEATABLE READ khi cần đọc nhất quán trong suốt transaction (ví dụ tính báo cáo nhiều bước) và nhắc trade-off/anomaly.
4. Nêu SERIALIZABLE khi cần đúng như tuần tự tuyệt đối, chấp nhận retry {{40001}}.
5. Nhắc deadlock ({{40P01}}) là bình thường trong hệ concurrent; ứng dụng phải retry an toàn.

> Senior tip: isolation level không thay thế thiết kế nghiệp vụ. Với thao tác "đọc rồi ghi" nhạy cảm (trừ tồn kho, giữ chỗ), hãy kết hợp chiến lược phù hợp: {{SELECT ... FOR UPDATE}} (lock có chủ đích), ràng buộc unique/check, optimistic locking (version column), hoặc SERIALIZABLE + retry — tuỳ mức độ tranh chấp và yêu cầu đúng sai.`,
  exercises: [
    {
      title: 'Mô phỏng snapshot đọc dữ liệu và phát hiện deadlock',
      prompt: `Viết lớp {{Mvcc}} mô phỏng **rất đơn giản** (không giống đầy đủ PostgreSQL, chỉ để hiểu ý snapshot):
- Danh sách {{commits}} mô tả các phiên bản đã commit theo thứ tự thời gian: {{commits.get(i)}} là giá trị commit ở mốc {{i}} (0-based). Giá trị {{null}} nghĩa là "chưa có commit nhìn thấy" ở mốc đó. Mốc càng lớn nghĩa là càng muộn.
- {{readCommitted(List<Integer> commits, int statementIndex)}}: mô phỏng **READ COMMITTED** — mỗi câu {{SELECT}} lấy snapshot tại thời điểm câu đó chạy, nên tham số {{statementIndex}} là "mốc của câu lệnh hiện tại". Trả về giá trị commit **gần nhất (muộn nhất)** trong các mốc {{<= statementIndex}} mà không null. Nếu không có thì trả {{null}}. Gọi nhiều lần với {{statementIndex}} khác nhau mô phỏng các câu SELECT khác nhau có thể thấy commit mới.
- {{repeatableRead(List<Integer> commits, int snapshotIndex)}}: mô phỏng **REPEATABLE READ** — snapshot cố định tại {{snapshotIndex}} (thường là mốc câu lệnh đầu tiên của transaction). Trả về giá trị commit gần nhất trong các mốc {{<= snapshotIndex}} mà không null. Gọi lại với cùng {{snapshotIndex}} phải cho cùng kết quả, dù {{commits}} khái niệm bên ngoài có "thêm commit muộn hơn" (ở bài này ta không đổi list, nhưng semantics là snapshot cố định).
- {{detectDeadlock(Map<String,String> waits)}}: {{waits}} ánh xạ {{tx -> tx nó đang chờ}} (ví dụ T1 chờ T2). Trả {{true}} nếu có **chu trình** chờ (deadlock), ngược lại {{false}}.

Starter biên dịch được; điền TODO.`,
      starter: `class Mvcc {
    Integer readCommitted(List<Integer> commits, int statementIndex) { throw new UnsupportedOperationException("TODO"); }
    Integer repeatableRead(List<Integer> commits, int snapshotIndex) { throw new UnsupportedOperationException("TODO"); }
    boolean detectDeadlock(Map<String,String> waits) { throw new UnsupportedOperationException("TODO"); }
}`,
      tests: `public class Main {
    static int passed=0,total=0;
    static void check(String n, Runnable r){ total++; try{r.run();passed++;System.out.println("PASS "+n);}catch(Throwable t){System.out.println("FAIL "+n+": "+t);} }
    static void eq(Object e,Object a){ if(!Objects.equals(e,a)) throw new AssertionError("exp "+e+" got "+a); }
    public static void main(String[] args){
        Mvcc m=new Mvcc();
        List<Integer> c=List.of(10,20,30);
        // READ COMMITTED: moi cau lenh co the lay snapshot muon hon
        check("read committed at statement 1", ()->eq(20,m.readCommitted(c,1)));
        check("read committed at statement 2 sees newer commit", ()->eq(30,m.readCommitted(c,2)));
        check("read committed null when none", ()->eq(null,m.readCommitted(c,-1)));
        // REPEATABLE READ: snapshot co dinh
        check("repeatable read fixed snapshot", ()->eq(20,m.repeatableRead(c,1)));
        check("repeatable read same snapshot again", ()->eq(20,m.repeatableRead(c,1)));
        Map<String,String> w1=new HashMap<>(); w1.put("T1","T2"); w1.put("T2","T1");
        check("deadlock cycle", ()->eq(true,m.detectDeadlock(w1)));
        Map<String,String> w2=new HashMap<>(); w2.put("T1","T2"); w2.put("T2","T3");
        check("no deadlock chain", ()->eq(false,m.detectDeadlock(w2)));
        Map<String,String> w3=new HashMap<>(); w3.put("T1","T2"); w3.put("T2","T3"); w3.put("T3","T1");
        check("deadlock 3 nodes", ()->eq(true,m.detectDeadlock(w3)));
        System.out.println("RESULT "+passed+"/"+total);
    }
}`,
      reference: `class Mvcc {
    Integer readCommitted(List<Integer> commits, int statementIndex) {
        if (commits == null || statementIndex < 0) return null;
        int idx = Math.min(statementIndex, commits.size() - 1);
        for (int i = idx; i >= 0; i--) {
            Integer v = commits.get(i);
            if (v != null) return v; // commit gan nhat <= moc cau lenh
        }
        return null;
    }
    Integer repeatableRead(List<Integer> commits, int snapshotIndex) {
        if (commits == null || snapshotIndex < 0) return null;
        int idx = Math.min(snapshotIndex, commits.size() - 1);
        for (int i = idx; i >= 0; i--) {
            Integer v = commits.get(i);
            if (v != null) return v; // snapshot co dinh: chi nhin toi snapshotIndex
        }
        return null;
    }
    boolean detectDeadlock(Map<String,String> waits) {
        if (waits == null || waits.isEmpty()) return false;
        for (String start : waits.keySet()) {
            Set<String> seen = new HashSet<>();
            String cur = start;
            while (cur != null) {
                if (!seen.add(cur)) return true; // gap lai node trong duong di
                cur = waits.get(cur);
                if (start.equals(cur)) return true;
            }
        }
        return false;
    }
}`,
      hints: [
        'Hai hàm đọc đều tìm giá trị **khác null** gần nhất với mốc cho phép, đi ngược từ {{idx}} về 0.',
        'Khác nhau ở semantics: READ COMMITTED truyền mốc câu lệnh (có thể đổi giữa các lần gọi); REPEATABLE READ truyền snapshot cố định. Test thể hiện điều này.',
        'Deadlock: với mỗi node bắt đầu, đi theo {{waits}} và lưu {{seen}}; nếu gặp node đã thấy hoặc quay về {{start}} thì có chu trình.',
      ],
      explain: `### Vì sao mô phỏng này đơn giản hoá
PostgreSQL thật dùng visibility rules (xmin/xmax, snapshot transaction IDs) và nhiều chi tiết khác. Ở đây ta chỉ mô phỏng ý chính: "chỉ thấy commit tới một mốc nhất định", và phân biệt READ COMMITTED (mốc câu lệnh có thể thay đổi) với REPEATABLE READ (mốc snapshot cố định).

### Lỗi hay gặp
- Quên trả {{null}} khi {{statementIndex < 0}} hoặc không có commit nào.
- Deadlock: chỉ kiểm tra cặp A-B mà bỏ sót chu trình 3 node (T1->T2->T3->T1).
- Đi xuôi thay vì đi ngược: cần commit **gần nhất** (mốc lớn nhất) trong phạm vi cho phép.

### Liên hệ phỏng vấn
Bạn không cần viết MVCC, nhưng nên nói được: READ COMMITTED lấy snapshot mỗi câu lệnh; REPEATABLE READ giữ snapshot; deadlock thì DB abort một transaction ({{40P01}} ở PostgreSQL) và ứng dụng phải retry.`,
    },
  ],
  check: [
    { q: 'MVCC cho phép reader và writer làm gì?', options: ['Reader phải chờ writer commit', 'Writer phải chờ reader xong', 'Reader đọc bản cũ theo snapshot, writer tạo bản mới, không chặn nhau', 'Cả hai đều lock dòng'], answer: 2, explain: `**Phương án 3 đúng**: MVCC giữ nhiều phiên bản nên reader đọc snapshot cũ, writer tạo phiên bản mới; không chặn nhau. Các phương án khác mô tả locking pessimistic, không phải MVCC.` },
    { q: 'Deadlock trong DB được xử lý thế nào?', options: ['DB chờ mãi cho đến khi timeout', 'DB phát hiện chu trình chờ và abort một transaction, ứng dụng retry', 'DB tự động serialize tất cả transaction', 'DB bỏ qua lock'], answer: 1, explain: `**Phương án 2 đúng**: DB phát hiện wait-for graph có chu trình và chọn victim abort; ứng dụng phải retry transaction bị abort.` },
    {
      q: 'Transaction T1 cập nhật bảng A rồi B, transaction T2 cập nhật B rồi A cùng lúc. Hai transaction chờ nhau mãi (deadlock). PostgreSQL xử lý thế nào?',
      options: [
        'Phát hiện chu trình chờ, abort một transaction với lỗi {{deadlock_detected}} ({{40P01}}), application bắt lỗi và retry toàn bộ transaction',
        'Chờ mãi đến timeout mặc định rồi hủy cả hai transaction',
        'Tự động chạy tuần tự: hoàn tất T1 rồi mới chạy T2, không bao giờ bị chờ',
        'Cho cả hai ghi song song, kết quả ghi sau ghi đè dữ liệu của cái trước'
      ],
      answer: 0,
      explain: `**Phương án 1 đúng**: PostgreSQL duy trì đồ thị chờ (wait-for graph) và định kỳ quét chu trình. Phát hiện deadlock → chọn một transaction làm nạn nhân (victim), abort nó và trả lỗi {{deadlock_detected}}, SQLSTATE {{40P01}}; transaction còn lại tiếp tục chạy. Application bắt lỗi {{40P01}} rồi **retry** toàn bộ transaction (kèm backoff ngắn). **Phương án 2** sai: PG không để chờ mãi — nó chủ động phát hiện deadlock, không cần đợi lock_timeout hết hạn. **Phương án 3** sai: PG không tự serialize tất cả transaction theo thứ tự cố định; các transaction vẫn chạy đồng thời, PG chỉ kiểm soát dữ liệu nào thấy được và phát hiện xung đột khi cần. **Phương án 4** sai: hai transaction cùng cập nhật cùng một hàng sẽ bị khóa chờ lẫn nhau, không phải "ghi sau ghi đè" im lặng.`
    },
  ],
  related: ['sql-001'],
  tags: ['mvcc', 'isolation', 'deadlock', 'snapshot'],
},
{
  id: 'lesson-sql-007',
  track: 'sql',
  order: 7,
  title: 'Index B-tree và covering index: vì sao index nhanh, khi nào không giúp',
  level: 'senior',
  minutes: 25,
  goals: [
    'Giải thích B-tree index là gì và vì sao tra cứu O(log n)',
    'Hiểu covering index và index-only scan',
    'Biết khi nào index không được dùng (low selectivity, hàm trên cột, kiểu dữ liệu)',
  ],
  body: `### Index là gì
**Index** (chỉ mục) là một cấu trúc dữ liệu phụ mà DB tạo thêm để tìm dòng nhanh hơn. Không có index phù hợp, DB thường phải **Seq Scan** (sequential scan, quét tuần tự) — đọc từng dòng trong bảng để kiểm tra điều kiện {{WHERE}}. Bảng càng lớn, Seq Scan càng tốn thời gian và I/O (đọc đĩa/bộ nhớ).

Analog đời thường: mục lục cuối sách. Muốn tìm chương nói về "deadlock", bạn tra mục lục thay vì đọc từ trang 1.

### B-tree index là gì
Loại index phổ biến nhất trong PostgreSQL 15 là **B-tree** (balanced tree, cây cân bằng). Mỗi node trong cây chứa nhiều khóa (key) đã sắp thứ tự; tìm kiếm đi từ gốc (root) xuống lá (leaf) bằng cách so sánh khóa. Vì cây cân bằng và mỗi node chứa nhiều khóa (**fanout** lớn), cây thường rất "nông": bảng hàng triệu dòng vẫn chỉ cần vài tầng.

Chi phí tra cứu theo khóa thường xấp xỉ **O(log n)** (logarit theo kích thước dữ liệu), vì mỗi tầng loại bỏ phần lớn nhánh không liên quan.

### Từ index tới dữ liệu thật (vì sao đôi khi vẫn chậm)
Với index thông thường, leaf chứa khóa và con trỏ tới vị trí dòng trong bảng (ở PostgreSQL thường nói tới **TID/ctid** — định danh vị trí tuple). Sau khi tìm thấy dòng phù hợp trong index, DB có thể phải đọc thêm **heap** (phần lưu dữ liệu bảng) để lấy các cột khác. Bước này có thể gây **random I/O** (đọc rải rác) nếu nhiều dòng khớp.

Nếu bạn {{SELECT *}} trên tập kết quả lớn, chi phí fetch heap có thể đáng kể. Planner (bộ tối ưu truy vấn) đôi khi chọn Seq Scan thay vì index scan khi ước tính phải fetch quá nhiều dòng.

### Covering index và index-only scan
**Covering index** là index chứa **đủ** mọi cột mà câu query cần (cột trong {{SELECT}}, {{WHERE}}, {{JOIN}}, {{ORDER BY}} tuỳ trường hợp) để DB có thể trả kết quả **chỉ từ index**, không cần đọc heap. PostgreSQL gọi khả năng này là **index-only scan**.

PostgreSQL hỗ trợ {{INCLUDE}} để thêm "cột payload" vào index mà không đưa vào khóa sắp xếp chính — hữu ích để tạo covering index.

~~~sql
-- Ví dụ ý tưởng: query hay chạy
-- SELECT status, total FROM orders WHERE user_id = ? ORDER BY created_at DESC;
-- Index có thể cân nhắc (tuỳ workload): (user_id, created_at DESC) INCLUDE (status, total)
~~~

> Điều kiện thực tế: index-only scan hiệu quả nhất khi **visibility map** cho phép xác nhận tuple "đủ mới" mà không phải kiểm tra heap. {{VACUUM}} cập nhật visibility map; bảng update nhiều có thể làm index-only scan kém lợi hơn.

### Khi index không giúp (hoặc ít giúp)
- **Selectivity thấp** (độ chọn lọc thấp): cột có ít giá trị khác nhau (ví dụ boolean, trạng thái chỉ vài giá trị) — index thường không loại bỏ được nhiều dòng, planner hay chọn Seq Scan. Đây là **quy tắc kinh nghiệm**, không phải hằng số tuyệt đối (phân bố dữ liệu lệch có thể khác).
- **Hàm/biểu thức trên cột**: {{WHERE UPPER(email) = 'A@B.COM'}} thường không dùng index thường trên {{email}}. Cần **expression/functional index** phù hợp, ví dụ {{CREATE INDEX ... ON users (UPPER(email));}} và viết query khớp biểu thức.
- **Kiểu dữ liệu/ép kiểu không khớp**: so sánh khác kiểu có thể gây cast ngầm, làm index khó dùng.
- **Bảng nhỏ**: đọc thẳng vài trang còn rẻ hơn đi index rồi fetch heap.
- **Write-heavy**: mỗi index thêm chi phí cho {{INSERT/UPDATE/DELETE}} (phải cập nhật cấu trúc index). Quá nhiều index làm ghi chậm và tốn dung lượng.

### B-tree và các loại index khác (PostgreSQL 15)
- **B-tree**: mặc định, tốt cho {{=}}, {{<}}, {{>}}, range, {{ORDER BY}}, nhiều pattern chung.
- **Hash**: chủ yếu tối ưu cho so sánh bằng {{=}} (không hỗ trợ ordering/range như B-tree). Ít dùng hơn B-tree trong đa số schema OLTP.
- **GiN**: phù hợp full-text search, {{jsonb}}, mảng (array), các toán tử containment.
- **GiST**: phù hợp dữ liệu hình học, range types, một số truy vấn nearest-neighbor tuỳ operator class.
- **BRIN**: rất nhỏ, phù hợp bảng lớn **append theo thứ tự vật lý** tương quan với giá trị (ví dụ time-series theo thời gian insert), không phù hợp dữ liệu ngẫu nhiên.

### Liên hệ phỏng vấn
Câu hay: "Khi nào thêm index, khi nào không?".
Trả lời có cấu trúc:
1. Xuất phát từ **query pattern** thật ({{WHERE/JOIN/ORDER BY}}), không thêm theo cảm tính.
2. Kiểm tra bằng {{EXPLAIN (ANALYZE, BUFFERS)}} trước/sau để xác nhận planner dùng index và thời gian/I-O cải thiện.
3. Cân nhắc **selectivity**, **covering/index-only scan**, chi phí ghi và bảo trì.
4. Nhắc index không phải phép màu: có thể bị bỏ qua vì hàm trên cột, kiểu dữ liệu, hoặc planner ước tính Seq Scan rẻ hơn.

> Senior tip: Đừng chỉ nhìn "có index hay không". Hãy nhìn **cardinality ước lượng vs thực tế** trong {{EXPLAIN ANALYZE}}, số buffer đọc ({{BUFFERS}}), và tác động lên ghi. Một index "đúng" trên staging có thể vô dụng trên production nếu phân bố dữ liệu khác. Xoá index không được dùng (kiểm tra thống kê sử dụng như {{pg_stat_user_indexes}}) để giảm gánh nặng ghi.`,
  exercises: [
    {
      title: 'Mô phỏng độ sâu B-tree, covering index và heuristic selectivity',
      prompt: `Viết lớp {{Idx}} (mô phỏng khái niệm, không phải code PostgreSQL):
- {{btreeSteps(int n)}}: ước lượng số "bước/tầng" tra cứu trong B-tree lý tưởng có **fanout 100** (mỗi node dẫn xuống ~100 nhánh). Dùng công thức: nếu {{n <= 0}} trả {{0}}; ngược lại trả {{floor(log100(n)) + 1}}. (Ví dụ: n=50 -> 1; n=1,000,000 -> 4.)
- {{isCovering(List<String> queryCols, List<String> indexCols)}}: trả {{true}} nếu **mọi** cột trong {{queryCols}} đều có mặt trong {{indexCols}} (index chứa đủ cột query cần, ở mức khái niệm). Ngược lại {{false}}. Nếu {{queryCols}} rỗng, coi như covering (trả {{true}}) cho đơn giản.
- {{shouldUseIndex(int distinct, int total)}}: heuristic đơn giản: trả {{true}} nếu tỉ lệ {{distinct/total > 0.05}} (selectivity > 5%). Nếu {{total <= 0}} trả {{false}}.

Đây chỉ là **quy tắc minh hoạ**; planner thật dùng thống kê và chi phí, không dùng ngưỡng cứng 5%.`,
      starter: `class Idx {
    int btreeSteps(int n) { throw new UnsupportedOperationException("TODO"); }
    boolean isCovering(List<String> queryCols, List<String> indexCols) { throw new UnsupportedOperationException("TODO"); }
    boolean shouldUseIndex(int distinct, int total) { throw new UnsupportedOperationException("TODO"); }
}`,
      tests: `public class Main {
    static int passed=0,total=0;
    static void check(String n, Runnable r){ total++; try{r.run();passed++;System.out.println("PASS "+n);}catch(Throwable t){System.out.println("FAIL "+n+": "+t);} }
    static void eq(Object e,Object a){ if(!Objects.equals(e,a)) throw new AssertionError("exp "+e+" got "+a); }
    public static void main(String[] args){
        Idx x=new Idx();
        check("btree steps 1M", ()->eq(4,x.btreeSteps(1000000)));
        check("btree steps small", ()->eq(1,x.btreeSteps(50)));
        check("btree steps zero", ()->eq(0,x.btreeSteps(0)));
        check("covering true", ()->eq(true,x.isCovering(List.of("a","b"),List.of("a","b","c"))));
        check("covering false", ()->eq(false,x.isCovering(List.of("a","d"),List.of("a","b"))));
        check("covering empty query", ()->eq(true,x.isCovering(List.of(),List.of("a"))));
        check("use index high selectivity", ()->eq(true,x.shouldUseIndex(500,1000)));
        check("no index low selectivity", ()->eq(false,x.shouldUseIndex(2,1000)));
        System.out.println("RESULT "+passed+"/"+total);
    }
}`,
      reference: `class Idx {
    int btreeSteps(int n) {
        if (n <= 0) return 0;
        // log100(n) = ln(n)/ln(100)
        return (int) Math.floor(Math.log(n) / Math.log(100.0) + 1e-12) + 1;
    }
    boolean isCovering(List<String> queryCols, List<String> indexCols) {
        if (queryCols == null || queryCols.isEmpty()) return true;
        Set<String> idx = new HashSet<>();
        if (indexCols != null) idx.addAll(indexCols);
        for (String c : queryCols) if (!idx.contains(c)) return false;
        return true;
    }
    boolean shouldUseIndex(int distinct, int total) {
        if (total <= 0) return false;
        return (double) distinct / (double) total > 0.05;
    }
}`,
      hints: [
        '{{btreeSteps}}: dùng {{Math.log(n)/Math.log(100)}}; nhớ trả 0 khi {{n <= 0}}.',
        '{{isCovering}}: đưa {{indexCols}} vào {{HashSet}} rồi kiểm tra từng cột query.',
        'Heuristic 5% chỉ để minh hoạ — ngoài đời planner xem thống kê, chi phí I/O, và có thể bỏ index dù selectivity "đẹp".',
      ],
      explain: `### Lỗi hay gặp
- {{btreeSteps}} trả 0 cho {{n}} nhỏ: test yêu cầu n=50 -> 1.
- {{isCovering}} quên trường hợp {{queryCols}} rỗng hoặc quên kiểm tra **tất cả** cột query.
- Nhầm heuristic 5% là luật tuyệt đối: trong PostgreSQL thật, quyết định dùng index do planner dựa trên {{pg_stats}}, chi phí random page, correlation, v.v.

### Liên hệ phỏng vấn
Khi nói về index, hãy nhấn mạnh: "đo bằng EXPLAIN (ANALYZE, BUFFERS) trên dữ liệu thực tế", vì cùng một query có thể dùng index ở môi trường này nhưng Seq Scan ở môi trường khác.`,
    },
  ],
  check: [
    { q: 'Khi nào DB thường KHÔNG dùng index B-tree?', options: ['Query có WHERE trên cột index với selectivity cao', 'Bảng nhỏ hoặc cột selectivity thấp (ít giá trị distinct)', 'ORDER BY trùng thứ tự index', 'Covering index chứa đủ cột'], answer: 1, explain: `**Phương án 2 đúng**: bảng nhỏ Seq Scan rẻ hơn; selectivity thấp khiến index không chọn lọc. Các phương án khác là trường hợp index được dùng.` },
    { q: 'Covering index giúp gì?', options: ['Tăng tốc INSERT', 'Cho phép index-only scan, không fetch heap', 'Giảm kích thước bảng', 'Thay thế primary key'], answer: 1, explain: `**Phương án 2 đúng**: nếu index chứa đủ cột query, DB trả kết quả chỉ từ index (index-only scan), giảm I/O.` },
    {
      q: 'Câu {{SELECT * FROM users WHERE UPPER(email) = ?}} đã có index trên cột {{email}} nhưng DB vẫn chạy Seq Scan. Nguyên nhân phổ biến nhất là gì?',
      options: [
        'Index B-tree không hỗ trợ tìm theo cột kiểu text',
        'Bảng users quá nhỏ nên planner không dùng index',
        'Index chỉ giúp câu có {{ORDER BY}}',
        'Hàm {{UPPER}} trên cột làm chỉ số thường không dùng được; cần expression index trên {{UPPER(email)}} và viết query khớp biểu thức'
      ],
      answer: 3,
      explain: `**Phương án 4 đúng**: index thường lưu giá trị gốc của {{email}}; câu so sánh {{UPPER(email)}} = ? không khớp biểu thức được lưu trong chỉ số, nên planner thường không dùng index đó (cần expression index {{CREATE INDEX ON users (UPPER(email))}} và query phải viết chính xác {{UPPER(email) = ?}}). **Phương án 1** sai: B-tree hoàn toàn hỗ trợ cột text và so sánh bằng. **Phương án 2** sai: bảng nhỏ chọn Seq Scan là bình thường và rẻ hơn, nhưng đây là trường hợp index **có sẵn** lại bị bỏ qua do hàm trên cột. **Phương án 3** sai: index giúp WHERE và join, không chỉ ORDER BY.`
    },
  ],
  related: ['sql-001'],
  tags: ['index', 'btree', 'covering index', 'selectivity'],
}
);
