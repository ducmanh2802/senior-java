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

        // Pha probe: moi dong tra bang bam dung mot lan
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
);
