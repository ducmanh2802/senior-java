/* Câu hỏi topic `sql`. Schema & markup: AGENTS.md mục 4–6. */
(window.QUESTIONS = window.QUESTIONS || []).push(
{
  id: 'sql-001',
  topic: 'sql',
  level: 'senior',
  q: 'Bảng employee(id, full_name, dept_id, salary): cần tìm người có mức lương cao thứ 2 trong mỗi phòng ban (nếu có nhiều người cùng mức lương thì lấy hết). Bạn viết SQL thế nào? DENSE_RANK, RANK và ROW_NUMBER khác nhau ra sao?',
  a: `**Tóm tắt:** Dùng window function {{DENSE_RANK() OVER (PARTITION BY dept_id ORDER BY salary DESC)}} rồi lọc {{rank = 2}} ở **lớp ngoài**. {{DENSE_RANK}} xếp hạng **theo giá trị** nên hai người cùng lương vẫn cùng hạng – đúng nghĩa "mức lương thứ 2". {{RANK}} nhảy số (1, 1, 3) nên nếu có hai người cùng lương cao nhất thì **không tồn tại hạng 2**. {{ROW_NUMBER}} luôn cho 1, 2, 3… không trùng, nên lấy đúng một người mỗi phòng ban.

### Vì sao phải lọc ở lớp ngoài
Window function **không** được phép xuất hiện trong {{WHERE}} (PostgreSQL báo "window functions are not allowed in WHERE", MySQL báo "Invalid use of window function"). Thứ tự xử lý logic của một câu SELECT là: FROM → WHERE → GROUP BY → HAVING → **window functions** → SELECT → DISTINCT → ORDER BY → LIMIT. Vì window function chạy *sau* WHERE, muốn lọc theo kết quả của nó thì phải bọc trong subquery/CTE rồi lọc ở bên ngoài.

### So sánh 3 hàm xếp hạng
Ví dụ phòng Kế toán (KT) có dữ liệu:
| id | salary | DENSE_RANK | RANK | ROW_NUMBER |
|---|---|---|---|---|
| 1 | 50 | 1 | 1 | 1 |
| 2 | 50 | 1 | 1 | 2 |
| 3 | 40 | 2 | 3 | 3 |
| 4 | 40 | 2 | 3 | 4 |
| 5 | 30 | 3 | 5 | 5 |

- {{DENSE_RANK = 2}} → id 3, 4: đúng "mức lương thứ 2", 2 người cùng hạng.
- {{RANK = 2}} → **không có ai**: hạng 2 bị nhảy mất, đây là bẫy kinh điển.
- {{ROW_NUMBER <= 2}} → id 1, 2: hai người lương cao nhất, **không** phải "lương thứ 2".

Quy tắc chọn: nghiệp vụ nói "**mức** lương/hạng" (đồng hạng, không nhảy số) → DENSE_RANK; cần đúng N **người** → ROW_NUMBER; cần xếp hạng kiểu thi đấu (đồng hạng rồi **nhảy số**: 1, 1, 3) → RANK.

### SQL mẫu
~~~sql
WITH ranked AS (
    SELECT e.id,
           e.full_name,
           e.dept_id,
           e.salary,
           DENSE_RANK() OVER (
               PARTITION BY e.dept_id
               ORDER BY e.salary DESC NULLS LAST
           ) AS salary_rank
    FROM employee e
    WHERE e.salary IS NOT NULL      -- loại người chưa có lương
)
SELECT r.* FROM ranked r WHERE r.salary_rank = 2;
~~~

### NULL và tiền tệ
- PostgreSQL coi NULL là **lớn hơn mọi giá trị khác**, nên {{ORDER BY salary DESC}} sẽ đẩy dòng lương NULL lên **đầu** ⇒ hạng 1 là người không lương. Luôn ghi rõ {{NULLS LAST}} (MySQL mặc định NULL nằm cuối khi DESC).
- Lương phải kiểu {{DECIMAL}}/{{NUMERIC}}, tuyệt đối không dùng {{FLOAT}} – so sánh {{0.1 + 0.2}} với {{0.3}} sẽ sai.

### Hiệu năng
Window function buộc DB **sort theo (dept_id, salary)**. Nên có index {{(dept_id, salary DESC)}} để phần sort không tốn I/O; nếu bảng chỉ cần vài cột thì có thể đạt index-only scan. Với câu lấy dữ liệu ở Java, dùng native query + projection interface để đỡ thao tác map tay.

### Pitfall production
- Chọn nhầm {{RANK}} khi nghiệp vụ là "lương thứ 2" → báo cáo **rỗng** mà không báo lỗi, rất dễ bị bỏ sót. Luôn test bằng dữ liệu có trùng lương.
- Query này quét toàn bộ bảng nhân sự mỗi lần mở báo cáo: nên cache theo ngày hoặc tính sẵn vào bảng tổng hợp.
- Không có tie-break thì kết quả {{ROW_NUMBER}} có thể đổi giữa hai lần chạy cùng dữ liệu ⇒ luôn thêm cột khóa tăng dần: {{ORDER BY salary DESC, id}}.

> Senior tip: khi phỏng vấn, hãy trả lời theo thứ tự: "Tôi dùng window function, lọc ở lớp ngoài vì WHERE không nhìn thấy kết quả của window function; DENSE_RANK vì nghiệp vụ hỏi theo **mức lương** chứ không phải theo **thứ tự người**". Việc phân biệt được DENSE_RANK với RANK là dấu hiệu bạn thực sự hiểu window function chứ không chỉ biết cú pháp. Trong dự án thật, hãy ưu tiên giải pháp đơn giản hơn: nếu bảng nhân sự chỉ vài nghìn dòng, một correlated subquery cũng đủ và dễ đọc hơn cho đồng nghiệp không rành SQL.`,
  follow: [
    'Vì sao {{RANK}} không bao giờ trả về hạng 2 khi hai người cùng lương cao nhất?',
    'Làm thế nào để lấy "người có lương cao thứ 2" mà vẫn giữ đúng 1 người mỗi phòng ban?'
  ],
  tags: ['window function', 'DENSE_RANK', 'RANK', 'ROW_NUMBER', 'NULL']
},
{
  id: 'sql-002',
  topic: 'sql',
  level: 'senior',
  q: 'Bảng transaction_import bị import lặp nên có nhiều bản ghi trùng nhau (cùng external_id). Cần tìm và xoá bản ghi trùng, chỉ giữ lại một bản (bản có id nhỏ nhất). Làm thế nào an toàn trên PostgreSQL và Oracle?',
  a: `**Tóm tắt:** Dùng {{ROW_NUMBER() OVER (PARTITION BY external_id ORDER BY id)}} để đánh dấu bản ghi "giữ lại" (rn = 1), rồi xoá các bản ghi có {{rn > 1}}. PostgreSQL dùng {{DELETE FROM t USING (...)}}; Oracle và MySQL 8 dùng {{DELETE FROM t WHERE id IN (SELECT id FROM (…ROW_NUMBER…))}} – MySQL bắt buộc bọc thêm một lớp derived table, nếu không sẽ lỗi **1093** ("You can't specify target table for update in FROM clause").

### Vì sao không dùng DISTINCT hay GROUP BY
- {{SELECT DISTINCT *}} không giải quyết được: hai bản ghi trùng *logic* thường khác nhau ở cột thời gian hay sequence tự sinh ⇒ DISTINCT giữ cả hai.
- {{GROUP BY external_id HAVING COUNT(*) > 1}} chỉ **phát hiện** nhóm trùng, không chỉ ra **dòng nào** cần xoá ⇒ phải kết hợp thêm window function.
- Chọn {{ROW_NUMBER}} (không phải RANK/DENSE_RANK) vì cần dãy 1, 2, 3… tuyệt đối, không có lỗ hổng ⇒ xoá {{rn > 1}} luôn để lại đúng một bản ghi mỗi khóa.

### SQL mẫu (PostgreSQL)
~~~sql
-- Bước 1: xem trước sẽ xoá bao nhiêu dòng (chạy trên staging trước)
SELECT count(*) AS rows_to_delete FROM (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY external_id ORDER BY id) AS rn
    FROM transaction_import
) t WHERE t.rn > 1;

-- Bước 2: xoá, giữ lại bản ghi có id nhỏ nhất
WITH dup AS (
    SELECT id FROM (
        SELECT id, ROW_NUMBER() OVER (PARTITION BY external_id ORDER BY id) AS rn
        FROM transaction_import
    ) t WHERE t.rn > 1
)
DELETE FROM transaction_import ti
USING dup d
WHERE ti.id = d.id;
~~~

### Oracle và MySQL 8
~~~sql
-- Oracle: bọc thêm lớp inline view
DELETE FROM transaction_import ti
WHERE ti.id IN (
    SELECT id FROM (
        SELECT id, ROW_NUMBER() OVER (PARTITION BY external_id ORDER BY id) AS rn
        FROM transaction_import
    ) t WHERE t.rn > 1   -- MySQL bắt buộc alias cho derived table; Oracle chấp nhận
);
~~~

### Xoá theo lô, đừng xoá hết một lúc
Xoá hàng triệu dòng trong **một** transaction sẽ giữ lock lâu, sinh lượng dead tuple lớn trên PostgreSQL (bảng phình, vacuum nặng, query chậm dần), MySQL phình undo log và binlog. Nên xoá theo lô 1.000–10.000 dòng, mỗi lô một transaction, chia theo khoảng {{id}} ⇒ nhiều job chạy song song mà không đụng nhau.

Với PostgreSQL có thể xoá theo {{ctid}} (địa chỉ vật lý) để không cần index, nhưng {{ctid}} **đổi mỗi lần UPDATE hay VACUUM FULL** ⇒ không dùng làm định danh lâu dài. Oracle có {{ROWID}} tương tự (cũng đổi khi row di chuyển).

### Cách phòng ngừa tái phát (quan trọng hơn việc dọn dẹp)
- Thêm **unique constraint** trên khóa nghiệp vụ là cách duy nhất đảm bảo không có trùng: {{ALTER TABLE transaction_import ADD CONSTRAINT uk_ext_id UNIQUE (external_id);}}
- Nếu dùng xoá mềm (cột {{deleted_at}}), unique index phải là **partial**: {{CREATE UNIQUE INDEX uk_ext_active ON transaction_import (external_id) WHERE deleted_at IS NULL;}} (PostgreSQL) – nếu không, lần import sau vẫn vi phạm.
- Cho import **idempotent** bằng upsert ({{INSERT … ON CONFLICT}}) chứ không phải cứ xoá rồi insert lại.
- Nếu bản ghi trùng đã được bảng khác tham chiếu (FK), phải xoá/xoá mềm ở bảng con trước, hoặc chuyển FK sang bản ghi được giữ lại.

### Pitfall production
- Chạy {{DELETE}} khi cột khóa chưa có index ⇒ full scan, giữ row lock trên rất nhiều dòng trong thời gian dài (MySQL InnoDB còn khoá mọi dòng quét qua – gần như khoá cả bảng), giết dịch vụ lúc cao điểm.
- Quên điều kiện phạm vi (ví dụ chỉ xoá bản ghi tạo trong batch import hôm nay) ⇒ xoá nhầm cả dữ liệu hợp lệ.
- Trong Oracle, {{DELETE}} ghi cả redo/undo ⇒ cần cân nhắc batch và theo dõi {{UNDO}} để tránh vỡ {{ORA-01555}}.
- Luôn chạy thử trên **staging copy** có dữ liệu giống production và đối chiếu số dòng xoá trước khi commit.

> Senior tip: câu hỏi "bạn sẽ xoá trùng thế nào?" thường là câu hỏi bẫy – interviewer muốn nghe bạn nói về **unique constraint + idempotent upsert**, chứ không phải về cú pháp DELETE. Câu trả lời mạnh là: "Tôi sẽ xoá bằng ROW_NUMBER để dọn dữ liệu hiện tại, nhưng cách sửa gốc là thêm unique constraint trên external_id và đổi luồng import sang upsert, vì nếu chỉ xoá thì lần import sau sẽ lại trùng". Đó là tư duy của kỹ sư 4–8 năm: xử lý nguyên nhân, không chỉ triệu chứng.`,
  follow: [
    'Vì sao MySQL 8 báo lỗi 1093 khi xoá trên chính bảng đang được đọc trong subquery?',
    'Khi nào nên xoá mềm (soft delete) thay vì xoá thật, và rủi ro của việc đó?'
  ],
  tags: ['DELETE', 'ROW_NUMBER', 'duplicate', 'unique constraint', 'idempotent']
},
{
  id: 'sql-003',
  topic: 'sql',
  level: 'senior',
  q: 'Cần tìm khách hàng chưa từng có giao dịch. Bạn viết query bằng NOT EXISTS, NOT IN hay LEFT JOIN ... IS NULL? Khi nào cái nào đúng, và bẫy NULL là gì?',
  a: `**Tóm tắt:** Dùng {{NOT EXISTS}} cho anti-join: an toàn với NULL, rõ nghĩa, và optimizer thường biến nó thành anti-join có index. {{NOT IN}} là cái bẫy: nếu tập kết quả của subquery chứa **một** giá trị NULL thì **không dòng nào** được trả về. {{LEFT JOIN … IS NULL}} cho kết quả tương đương NOT EXISTS nhưng dễ sinh "row explosion" khi join nhiều bảng con và khó đọc hơn.

### Ba cách viết
| Cách | Subquery có NULL | Ghi chú |
|---|---|---|
| {{NOT EXISTS}} | Không ảnh hưởng | Lựa chọn mặc định cho anti-join |
| {{NOT IN}} | Trả về **0 dòng** | Chỉ dùng khi tập giá trị chắc chắn không NULL |
| {{LEFT JOIN … IS NULL}} | Không ảnh hưởng | Tương đương kết quả, nhưng dễ "nhân dòng" |

### Bẫy NULL của NOT IN – giải thích 3-valued logic
SQL dùng **ba giá trị logic**: TRUE, FALSE và **UNKNOWN**. NULL nghĩa là "chưa biết", nên mọi phép so sánh với NULL cho UNKNOWN:
- {{c.id = NULL}} → UNKNOWN (không bao giờ TRUE) ⇒ không dòng nào khớp.
- {{c.id <> NULL}} → UNKNOWN ⇒ mất hết dòng.
- {{c.id NOT IN (1, NULL)}}: với dòng có id = 5, SQL kiểm tra 5 = 1 (FALSE) rồi 5 = NULL (UNKNOWN) ⇒ kết quả UNKNOWN ⇒ **không trả dòng nào**.
- Chỉ cần **một** NULL trong tập kết quả là đủ để làm cả câu rỗng.
- Trong WHERE chỉ dòng có kết quả TRUE mới được giữ ⇒ UNKNOWN bị loại im lặng.

~~~sql
-- Bẫy: nếu orders có một bản ghi customer_id NULL, câu này trả về 0 dòng
SELECT c.id, c.full_name
FROM customers c
WHERE c.id NOT IN (SELECT o.customer_id FROM orders o);
~~~

### Cách viết đúng
~~~sql
-- Khách hàng chưa có giao dịch nào kể từ 01/01/2026 (giờ VN)
SELECT c.id, c.full_name
FROM customers c
WHERE NOT EXISTS (
    SELECT 1
    FROM orders o
    WHERE o.customer_id = c.id
      AND o.created_at >= TIMESTAMPTZ '2026-01-01 00:00:00+07'
);
~~~
{{NOT EXISTS}} là **anti-join** ({{EXISTS}} mới là semi-join): subquery chỉ cần trả lời "có/không", dừng ngay ở dòng khớp đầu tiên ⇒ index {{(customer_id, created_at)}} là đủ, không cần DISTINCT, không cần so sánh NULL.

### LEFT JOIN … IS NULL
~~~sql
SELECT c.id, c.full_name
FROM customers c
LEFT JOIN orders o ON o.customer_id = c.id
WHERE o.customer_id IS NULL;
~~~
- Cho **cùng kết quả** với NOT EXISTS nếu chỉ join một bảng con và cột khóa join không NULL.
- Nhưng khi join **hai** bảng con cùng lúc (đơn hàng và thẻ), mỗi khách có 3 đơn và 2 thẻ sẽ sinh **6 dòng**; {{COUNT(*)}} ra 6 thay vì 3. Với NOT EXISTS, mỗi điều kiện là một subquery độc lập, không nhân dòng.
- Phải chọn đúng cột khóa để kiểm tra NULL; nếu cột đó vốn đã nullable ở bảng phải thì điều kiện sai.
- Mọi điều kiện lọc thêm **khác** điều kiện join phải nằm ở {{ON}}, không nằm ở {{WHERE}} – nếu đặt ở WHERE thì LEFT JOIN bị biến thành INNER JOIN.

### Hiệu năng
- NOT EXISTS với index trên cột join ⇒ plan "Anti Join" (Nested Loop Anti Join hoặc Hash Anti Join).
- Không có index, subquery có thể bị chạy lại cho từng dòng ngoài ⇒ tốn. Hãy kiểm tra bằng {{EXPLAIN (ANALYZE)}}.
- PostgreSQL **không** chuyển {{NOT IN (subquery)}} thành anti-join (vì ngữ nghĩa NULL khác) ⇒ plan là "hashed SubPlan"; nếu tập con không vừa {{work_mem}} thì thành subplan chạy lại cho từng dòng ⇒ cực chậm. Thêm một lý do để dùng NOT EXISTS.

### Pitfall production
- Đặt điều kiện thời gian **ngoài** subquery (ví dụ ở {{WHERE o.created_at >= ...}}) làm mất đúng những khách hàng ta muốn tìm – điều kiện thời gian phải nằm **bên trong** subquery của NOT EXISTS.
- {{NOT IN}} với danh sách id lấy từ bảng khác có cột nullable (ví dụ bảng blacklist) ⇒ mất sạch kết quả mà **không báo lỗi**, rất khó phát hiện. Khi thấy query trả về 0 dòng bất thường, hãy kiểm tra NULL trước.
- Danh sách chặn lớn (hàng nghìn id) ⇒ đưa vào bảng tạm rồi JOIN thay vì {{NOT IN}}.
- Trong JPA, hãy xem SQL thực sự được sinh ra cho {{@Query}} có {{EXISTS}}; với logic anti-join phức tạp, native query dễ kiểm soát hơn.

> Senior tip: câu "NOT IN hay NOT EXISTS" là câu hỏi *knock-out* cổ điển. Câu trả lời mạnh là: "Tôi dùng NOT EXISTS vì NOT IN không an toàn với NULL – chỉ cần một NULL trong tập kết quả là toàn bộ câu trả về rỗng; ngoài ra NOT EXISTS được optimizer biến thành anti-join nên dừng sớm và dùng index tốt hơn". Nếu interviewer hỏi tiếp "còn LEFT JOIN IS NULL thì sao", hãy trả lời tiếp về khả năng nhân dòng khi join nhiều bảng con – đó mới là chỗ ứng viên trung bình trả lời sai.`,
  follow: [
    'Giải thích chi tiết ba-valued logic và vì sao NULL trong NOT IN làm cả câu trả về rỗng.',
    'Với một câu anti-join, làm thế nào để biết optimizer chọn Nested Loop Anti Join hay Hash Anti Join?'
  ],
  tags: ['JOIN', 'NOT EXISTS', 'NOT IN', 'anti-join', 'NULL', 'LEFT JOIN']
},
{
  id: 'sql-004',
  topic: 'sql',
  level: 'mid',
  q: 'WHERE và HAVING khác nhau thế nào, thứ tự thực thi logic của một câu SELECT là gì? Những lỗi nào hay gặp khi dùng GROUP BY mà bạn đã phải sửa cho team?',
  a: `**Tóm tắt:** {{WHERE}} lọc **dòng** trước khi gom nhóm; {{HAVING}} lọc **nhóm** sau khi đã tính aggregate. Thứ tự logic: FROM → WHERE → GROUP BY → HAVING → window functions → SELECT → DISTINCT → ORDER BY → LIMIT. Nguyên tắc nhớ: **điều kiện nào trên cột của bảng gốc thì đặt ở WHERE** – đặt ở HAVING vừa dễ sai logic vừa làm DB gom toàn bộ dữ liệu rồi mới loại.

### Ví dụ kinh điển: doanh thu tháng 3
~~~sql
-- SAI: tính tổng cả năm rồi mới lọc
SELECT customer_id, SUM(amount) AS total
FROM orders
GROUP BY customer_id
HAVING EXTRACT(MONTH FROM created_at) = 3;

-- ĐÚNG: lọc dòng trước khi gom nhóm
SELECT customer_id, SUM(amount) AS total
FROM orders
WHERE created_at >= DATE '2026-03-01'
  AND created_at <  DATE '2026-04-01'
GROUP BY customer_id
HAVING SUM(amount) > 1000000;
~~~
Câu SAI còn bị báo lỗi "column must appear in the GROUP BY clause" (PostgreSQL) hoặc lỗi **ONLY_FULL_GROUP_BY** (MySQL bật mặc định từ 5.7). Nếu "sửa" bằng cách thêm {{created_at}} vào GROUP BY thì mỗi giao dịch thành một nhóm ⇒ HAVING trả về mọi đơn lớn hơn 1 triệu thay vì tổng theo khách.

### Những lỗi hay gặp
1. Dùng aggregate trong WHERE: {{WHERE SUM(amount) > 100}} ⇒ lỗi "aggregate functions are not allowed in WHERE". Muốn lọc theo tổng thì phải qua HAVING.
2. Cột không aggregate trong SELECT: PostgreSQL báo lỗi ngay. Sửa: thêm cột vào GROUP BY, gom bằng {{MAX()/MIN()}}, hoặc dùng window function thay cho GROUP BY.
3. Đếm sai với LEFT JOIN: {{COUNT(*)}} đếm **cả** dòng NULL sinh ra do join, còn {{COUNT(o.id)}} mới đếm đơn hàng thật – cùng một câu, hai kết quả khác nhau. Đây là bug "thống kê số 0" kinh điển ở báo cáo tổng hợp.
4. Dùng alias của SELECT trong WHERE: không DB nào cho phép (WHERE chạy trước SELECT). Trong HAVING: MySQL cho phép (mở rộng riêng), PostgreSQL báo "column does not exist" ⇒ viết lại biểu thức hoặc bọc subquery/CTE. (Alias dùng được trong ORDER BY.)
5. {{HAVING status = 'X'}} với status không nằm trong GROUP BY ⇒ lỗi; điều kiện này phải ở WHERE.
6. Nhầm {{HAVING COUNT(*) > 0}} với {{WHERE EXISTS}}: hai câu cho kết quả giống nhau nhưng plan khác nhau (semi-join vs group + filter).

### Vì sao đặt ở WHERE lại nhanh hơn
WHERE giảm số dòng đi vào bước gom nhóm (hash aggregate / sort) ⇒ ít I/O và ít bộ nhớ. HAVING chỉ lọc **sau** khi đã gom xong nên tốn CPU hơn. Nếu {{EXPLAIN (ANALYZE)}} cho thấy HashAggregate nhận hàng triệu dòng, hãy tự hỏi: điều kiện đó có nên nằm ở WHERE không?

### Aggregate với NULL
- {{COUNT(*)}}, {{COUNT(col)}}, {{COUNT(DISTINCT col)}} khác nhau rõ rệt.
- {{SUM}} bỏ qua NULL và trả về NULL (không phải 0) nếu tất cả dòng đều NULL ⇒ bọc {{COALESCE(SUM(x), 0)}}.
- Trong HAVING, so sánh với NULL cho UNKNOWN ⇒ dòng bị loại. Đừng viết {{HAVING SUM(x) = NULL}} để ý "bằng rỗng".

### Thứ tự logic khác thứ tự vật lý
- Thứ tự trên là thứ tự **logic** bạn phải tôn trọng khi viết. Optimizer có quyền đảo (đẩy điều kiện đơn giản xuống gần nguồn dữ liệu, đổi thứ tự join) nên **không** được dựa vào thứ tự vật lý.
- Điểm dễ sai: {{DISTINCT}} được áp **trước** {{ORDER BY}} ⇒ {{SELECT DISTINCT a, b FROM t ORDER BY c}} là lỗi vì c không nằm trong danh sách chọn (PostgreSQL báo lỗi; MySQL 5.7+ cũng báo lỗi 3065 khi bật ONLY_FULL_GROUP_BY – mặc định).

### Pitfall production
- GROUP BY theo cột có NULL: **mọi** dòng NULL được gom chung vào **một** nhóm (GROUP BY coi các NULL là "không phân biệt", dù {{NULL = NULL}} là UNKNOWN) ⇒ dùng {{COALESCE(col, 'CHƯA PHÂN LOẠI')}} để đặt nhãn dễ đọc cho nhóm đó.
- GROUP BY theo cột có **rất nhiều giá trị** (ví dụ {{transaction_id}}) là vô nghĩa và tốn bộ nhớ ⇒ đó là lúc nên dùng window function.
- Index trên cột GROUP BY giúp DB dùng index scan thay vì sort + hash ⇒ báo cáo tổng hợp theo cột phân loại nên có index.
- Báo cáo chạy định kỳ (cron) nên ghi kết quả vào bảng tổng hợp thay vì tính lại mỗi lần người dùng mở trang.

> Senior tip: hãy nhớ câu "**WHERE lọc dòng, HAVING lọc nhóm**" và luôn dùng nó để quyết định điều kiện nằm ở đâu. Khi gặp câu hỏi phỏng vấn về SQL performance, câu trả lời ăn điểm là: "điều kiện trên cột gốc luôn đặt ở WHERE để giảm số dòng đi vào bước aggregate; HAVING chỉ dùng cho điều kiện phụ thuộc kết quả tính tổng". Kèm theo một ví dụ thật từ hệ thống bạn đã sửa – đó là thứ khiến câu trả lời đi từ "biết lý thuyết" sang "đã gặp và xử lý".`,
  follow: [
    'Vì sao {{COUNT(*) }} và {{COUNT(o.id)}} cho hai kết quả khác nhau khi dùng LEFT JOIN?',
    'Khi nào GROUP BY là cách sai và phải chuyển sang window function?'
  ],
  tags: ['WHERE', 'HAVING', 'GROUP BY', 'NULL', 'logical order']
},
{
  id: 'sql-005',
  topic: 'sql',
  level: 'senior',
  q: 'Bảng transaction(id, customer_id, amount, created_at): cần lấy 3 giao dịch có số tiền lớn nhất của **mỗi** khách hàng. Viết query thế nào? Nếu khách chỉ có 2 giao dịch thì trả 2 dòng, không bị lỗi.',
  a: `**Tóm tắt:** Dùng window function {{ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY amount DESC, id)}} rồi lọc {{rn <= 3}} ở lớp ngoài. {{ROW_NUMBER}} đảm bảo mỗi dòng có số thứ tự duy nhất, không bị trùng nên lọc {{rn <= 3}} trả về đúng 3 dòng (hoặc ít hơn nếu khách ít giao dịch hơn). Đừng dùng {{RANK}} hay {{DENSE_RANK}} vì có thể trả về nhiều hơn 3 dòng khi có trùng số tiền.

### Vì sao ROW_NUMBER là lựa chọn đúng
- Nghiệp vụ: "3 giao dịch lớn nhất" – tính theo **thứ tự dòng**, không phải "mức số tiền" ⇒ {{ROW_NUMBER}} cho dãy 1, 2, 3… không có lỗ hổng.
- Nếu dùng {{DENSE_RANK}} và 3 giao dịch cùng số tiền cao nhất thì {{DENSE_RANK}} = 1 cho cả 3 ⇒ lọc {{<= 3}} trả về **tất cả** 3 dòng (đúng), nhưng nếu có 4 giao dịch cùng số tiền thì vẫn 4 dòng ra ⇒ **sai**.
- {{RANK}} cũng vậy khi trùng ở **biên**: số tiền 100, 90, 80, 80 ⇒ rank 1, 2, 3, 3 ⇒ lọc {{<= 3}} ra 4 dòng.

### SQL mẫu
~~~sql
WITH ranked AS (
    SELECT t.*,
           ROW_NUMBER() OVER (
               PARTITION BY t.customer_id
               ORDER BY t.amount DESC NULLS LAST, t.id
           ) AS rn
    FROM transaction t
)
SELECT r.id, r.customer_id, r.amount, r.created_at
FROM ranked r
WHERE r.rn <= 3
ORDER BY r.customer_id, r.rn;
~~~

### Tie-break là bắt buộc
Luôn thêm cột khóa {{id}} (hoặc {{created_at}} nếu duy nhất) vào {{ORDER BY}}: {{ORDER BY amount DESC, id}}. Nếu không, hai dòng cùng số tiền có thể đổi chỗ giữa các lần chạy ⇒ kết quả {{rn = 1, 2, 3}} không ổn định, gây bug báo cáo lật đật.

### Hiệu năng
- Cần index {{(customer_id, amount DESC, id)}} để index-only scan, tránh sort. PostgreSQL 11+ hỗ trợ covering index ⇒ có thể {{INCLUDE (created_at)}} để trả thêm cột không sort.
- Khi chỉ cần top 3 cho một tập khách nhỏ, {{CROSS JOIN LATERAL (SELECT … WHERE t.customer_id = c.id ORDER BY amount DESC, id LIMIT 3)}} đọc đúng 3 entry index cho mỗi khách thay vì sort cả bảng.
- Với bảng lớn (hàng chục triệu giao dịch), query này vẫn quét toàn bộ bảng. Nên:
  - Chỉ chạy cho tập khách hàng cần (thêm {{WHERE customer_id IN (…)}} hoặc join với bảng khách hàng hoạt động).
  - Hoặc tính trước vào bảng tổng hợp theo ngày/khách (materialized view), refresh định kỳ.

### Pitfall production
- Quên {{NULLS LAST}} ⇒ dòng {{amount NULL}} bị xếp lên đầu (PostgreSQL) hoặc cuối (MySQL) ⇒ top 3 bị lệch. Luôn ghi rõ.
- Dùng {{RANK}} hoặc {{DENSE_RANK}} cho "top N dòng" ⇒ kết quả sai yên lặng, không báo lỗi.
- Không bọc {{ORDER BY}} trong window function ⇒ kết quả không xác định, khác nhau giữa lần chạy.
- Trong JPA/Hibernate, dùng native query thay vì cố gắng viết JPQL cho window function (Hibernate 6 hỗ trợ nhưng vẫn hạn chế và sinh SQL kém tối ưu).

> Senior tip: câu này hay bị hỏi như "làm thế nào để lấy top N theo nhóm". Câu trả lời điểm cao: "ROW_NUMBER + lọc ở lớp ngoài, luôn có tie-break, có index composite đúng thứ tự". Với team thực sự, hãy nói thêm: "Nếu bảng rất lớn, tôi sẽ không chạy query này trực tiếp trên production mỗi khi người dùng click – tôi sẽ pre-aggregate vào bảng summary theo ngày và chỉ query bảng summary đó".
`,
  follow: [
    'Tại sao không dùng DENSE_RANK cho "top N dòng"?',
    'Làm thế nào để tối ưu query này nếu bảng transaction có 100 triệu dòng?'
  ],
  tags: ['window function', 'ROW_NUMBER', 'top N per group', 'tie-break'],
},
{
  id: 'sql-006',
  topic: 'sql',
  level: 'senior',
  q: 'Cần viết query sao kê tài khoản: mỗi giao dịch hiển thị số dư đầu kỳ, phát sinh nợ/có, số dư cuối kỳ và số dư lũy kế (running balance). Bảng transaction(id, account_id, type IN/OUT, amount, created_at). Số dư đầu kỳ là số dư sau giao dịch trước đó (hoặc 0 nếu là giao dịch đầu tiên).',
  a: `**Tóm tắt:** Dùng window function {{SUM() OVER (PARTITION BY account_id ORDER BY created_at, id ROWS UNBOUNDED PRECEDING)}} để tính số dư lũy kế. Số dư cuối kỳ của dòng trước **chính là** số dư đầu kỳ của dòng sau ⇒ lấy {{LAG(running_balance) OVER (...)}} hoặc dùng {{SUM(...) OVER (...) - amount * sign}} tùy cách tổ chức cột.

### Khái niệm running balance
Running balance (số dư lũy kế) = tổng cộng dồn của các giao dịch trước đó tính cả giao dịch hiện tại.
- Nếu type = 'IN' (nạp, thu): + amount
- Nếu type = 'OUT' (rút, chi): - amount
Số dư đầu kỳ = running balance của giao dịch trước = {{LAG(running_balance) OVER (PARTITION BY account_id ORDER BY created_at, id)}}.

### SQL mẫu
~~~sql
WITH signed AS (
    SELECT t.*,
           CASE
               WHEN t.type = 'IN'  THEN t.amount
               WHEN t.type = 'OUT' THEN -t.amount
               ELSE 0
           END AS delta
    FROM transaction t
),
running AS (
    SELECT s.*,
           SUM(s.delta) OVER (
               PARTITION BY s.account_id
               ORDER BY s.created_at, s.id
               ROWS UNBOUNDED PRECEDING
           ) AS running_balance
    FROM signed s
)
SELECT r.id,
       r.account_id,
       r.type,
       r.amount,
       r.created_at,
       -- Số dư đầu kỳ = running_balance - delta
       r.running_balance - r.delta AS opening_balance,
       CASE WHEN r.type = 'IN'  THEN r.amount ELSE 0 END AS credit,
       CASE WHEN r.type = 'OUT' THEN r.amount ELSE 0 END AS debit,
       r.running_balance AS closing_balance,
       r.running_balance AS running_balance_final
FROM running r
ORDER BY r.account_id, r.created_at, r.id;
~~~

### ROWS UNBOUNDED PRECEDING vs RANGE
- {{ROWS UNBOUNDED PRECEDING}}: khung cửa sổ là **số dòng vật lý** từ đầu đến dòng hiện tại. Hiệu năng tốt, xác định.
- {{RANGE UNBOUNDED PRECEDING}}: khung cửa sổ tính theo **giá trị** của ORDER BY – mọi dòng **peer** (cùng giá trị ORDER BY) với dòng hiện tại đều được cộng vào. Nếu chỉ {{ORDER BY created_at}} và hai giao dịch cùng timestamp, cả hai dòng hiện **cùng** running balance (đã cộng cả hai) ⇒ sai sao kê.
- **Bẫy mặc định**: có ORDER BY mà không ghi frame thì frame mặc định là {{RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW}}, không phải ROWS.
- Luôn ghi rõ {{ROWS}} và có khóa duy nhất cuối ORDER BY ({{id}}); khi ORDER BY đã duy nhất thì ROWS và RANGE cho cùng kết quả, nhưng ROWS rõ nghĩa và thường rẻ hơn.

### Số dư đầu kỳ = 0 cho giao dịch đầu tiên
{{LAG(running_balance) OVER (PARTITION BY account_id ORDER BY created_at, id)}} trả về NULL cho dòng đầu ⇒ dùng {{COALESCE(..., 0)}}.
Với query trên, {{opening_balance = running_balance - delta}} tự xử lý: giao dịch đầu tiên có running_balance = delta ⇒ opening_balance = 0.

### Hiệu năng & index
Index composite: {{(account_id, created_at, id)}}. Cửa sổ {{ROWS UNBOUNDED PRECEDING}} cho phép DB dùng index scan tuần tự, không sort, tính running sum trên luồng (streaming aggregate) ⇒ rất nhanh.

### Pitfall production
- Không có {{id}} trong ORDER BY ⇒ giao dịch cùng giây (cùng {{created_at}}) không có thứ tự ổn định ⇒ running balance "nhảy" khi chạy lại. Luôn thêm {{id}}.
- Kiểu tiền tệ: {{amount}} phải {{DECIMAL}}/{{NUMERIC}}, không bao giờ {{FLOAT}}/{{DOUBLE}}. Running sum của float sinh sai số tích lũy.
- Nếu hệ thống có "điều chỉnh" (adjustment) sửa giao dịch cũ ⇒ running balance từ đó về sau đều sai. Giải pháp: cột {{version}} hoặc {{effective_from}}, tính lại running balance từ giao dịch bị sửa trở đi (hoặc dùng event sourcing).
- Sao kê theo kỳ (ví dụ tháng 3): nếu lọc {{created_at}} ở WHERE **trong** CTE trước window function thì running sum bắt đầu từ 0 ⇒ sai số dư. Phải cộng số dư đầu kỳ (snapshot cuối kỳ trước hoặc tổng giao dịch trước kỳ) rồi mới cộng dồn, hoặc tính window trên toàn lịch sử rồi lọc kỳ ở lớp ngoài.
- Cần phân biệt "số dư khả dụng" (available balance) và "số dư sổ sách" (ledger balance). Số dư khả dụng trừ đi giao dịch chờ duyệt (pending) ⇒ cần cột {{status}}.

> Senior tip: khi phỏng vấn, hãy vẽ minh họa: "Giao dịch 1: nạp 100 → running 100; GD 2: rút 30 → running 70; GD 3: nạp 50 → running 120". Sau đó nói: "Tôi dùng SUM OVER ROWS UNBOUNDED PRECEDING vì nó streaming, không cần self-join, index (account_id, created_at, id) cho plan tối ưu". Interviewer senior sẽ gật gù vì bạn nói được streaming aggregate và tie-break.
`,
  follow: [
    'Tại sao phải dùng ROWS UNBOUNDED PRECEDING thay vì RANGE?',
    'Nếu một giao dịch cũ bị sửa (adjustment), bạn sẽ cập nhật running balance thế nào mà không lock toàn bảng?'
  ],
  tags: ['window function', 'running total', 'running balance', 'SUM OVER', 'ROWS UNBOUNDED PRECEDING'],
},
{
  id: 'sql-007',
  topic: 'sql',
  level: 'senior',
  q: 'Bảng login_history(user_id, login_date): tìm chuỗi ngày đăng nhập liên tiếp dài nhất của mỗi người dùng (streak). Ví dụ: user A đăng nhập 1/1, 2/1, 3/1, 5/1 → streak dài nhất là 3 ngày (1–3/1). Viết query bằng kỹ thuật Gaps and Islands.',
  a: `**Tóm tắt:** Kỹ thuật **Gaps and Islands**: dùng {{ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY login_date)}} trừ vào {{login_date}} (hoặc date_diff) để tạo **grouping key** – các ngày liên tiếp sẽ cho **cùng một giá trị**, ngày cách nhau cho giá trị khác. Sau đó {{GROUP BY user_id, grouping_key}} đếm {{COUNT(*)}} lấy max.

### Nguyên lý: tại sao trừ row_number ra được island
Giả sử login_date là các ngày: 1, 2, 3, 5, 6, 9. Row_number: 1, 2, 3, 4, 5, 6.
Tính {{login_date - row_number}} (PostgreSQL: {{login_date - INTERVAL '1 day' * rn}}, MySQL: {{DATE_SUB(login_date, INTERVAL rn DAY)}}):
| login_date | rn | login_date - rn |
|---|---|---|
| 1/1 | 1 | 31/12 (năm trước) |
| 2/1 | 2 | 31/12 |
| 3/1 | 3 | 31/12 |
| 5/1 | 4 | 1/1 |
| 6/1 | 5 | 1/1 |
| 9/1 | 6 | 3/1 |

Các ngày **liên tiếp** cho **cùng giá trị** (31/12, 1/1) ⇒ đó chính là **island**. Ngày cách nhau (gap) cho giá trị khác.

### SQL mẫu (PostgreSQL)
~~~sql
WITH numbered AS (
    SELECT lh.user_id,
           lh.login_date,
           ROW_NUMBER() OVER (PARTITION BY lh.user_id ORDER BY lh.login_date) AS rn
    FROM login_history lh
),
grouped AS (
    SELECT n.user_id,
           n.login_date,
           -- grouping key: ngày trừ đi row_number (interval 1 ngày)
           n.login_date - (n.rn || ' days')::interval AS grp
    FROM numbered n
)
SELECT g.user_id,
       MIN(g.login_date) AS streak_start,
       MAX(g.login_date) AS streak_end,
       COUNT(*) AS streak_length
FROM grouped g
GROUP BY g.user_id, g.grp
ORDER BY g.user_id, streak_length DESC;
~~~

### Lấy streak dài nhất mỗi user
~~~sql
WITH streaks AS (
    -- CTE grouped như trên
    SELECT g.user_id,
           MIN(g.login_date) AS start_date,
           MAX(g.login_date) AS end_date,
           COUNT(*) AS length
    FROM grouped g
    GROUP BY g.user_id, g.grp
)
SELECT s.user_id, s.start_date, s.end_date, s.length
FROM (
    SELECT *, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY length DESC) AS rn
    FROM streaks
) s
WHERE s.rn = 1;
~~~

### MySQL / SQL Server
MySQL: {{DATE_SUB(login_date, INTERVAL rn DAY)}} hoặc {{login_date - INTERVAL rn DAY}}.
SQL Server: {{DATEADD(day, -rn, login_date)}}.

### Lưu ý về duplicate ngày
Nếu user đăng nhập **nhiều lần trong một ngày**, {{ROW_NUMBER}} sẽ đếm từng dòng ⇒ grouping key bị sai. Cần **distinct ngày trước**:
~~~sql
SELECT DISTINCT user_id, login_date::date AS login_date FROM login_history
~~~
Sau đó mới áp dụng window function.

### Ứng dụng rộng
Kỹ thuật này dùng cho mọi bài toán "chuỗi liên tiếp":
- Giao dịch liên tiếp (fraud detection: 5 giao dịch trong 5 phút)
- Sự kiện sensor IoT (mất tín hiệu bao lâu)
- Hành vi người dùng (ngày dùng app liên tiếp)

### Pitfall production
- Quên {{DISTINCT}} ngày ⇒ nhiều đăng nhập/ngày làm vỡ streak.
- Không xử lý múi giờ: {{login_date}} lưu UTC, user ở múi giờ +07 ⇒ streak tính theo UTC sai so với quan điểm user. Luôn convert về múi giờ user trước khi chạy.
- Dùng {{RANGE}} thay vì {{ROWS}} (không áp dụng ở đây vì không dùng window aggregate, nhưng nếu dùng SUM OVER thì nhớ ROWS).
- Bảng lớn: cần index {{(user_id, login_date)}}.

> Senior tip: đây là câu hỏi "có biết pattern không". Câu trả lời nhanh: "Gaps and Islands – trừ row_number khỏi ngày để tạo grouping key, rồi group by key đó". Nếu interviewer hỏi "làm sao khi có nhiều lần đăng nhập một ngày", bạn trả lời ngay "distinct ngày trước khi window function". Đó là dấu hiệu bạn đã thực sự giải quyết bài toán này trên production.
`,
  follow: [
    'Tại sao {{login_date - row_number}} lại cho cùng giá trị cho các ngày liên tiếp?',
    'Làm thế nào nếu cần tìm streak "ít nhất 1 lần/ngày trong 7 ngày" (cho phép bỏ lỡ 1 ngày)?'
  ],
  tags: ['gaps and islands', 'streak', 'consecutive days', 'window function', 'ROW_NUMBER'],
},
{
  id: 'sql-008',
  topic: 'sql',
  level: 'senior',
  q: 'Bảng sales(sale_date, product_id, amount): cần pivot doanh số theo tháng thành cột (Tháng 1, Tháng 2... Tháng 12), đồng thời so sánh cùng kỳ năm trước (YoY). Viết query động (dynamic) không hard-code 12 cột.',
  a: `**Tóm tắt:** Pivot dùng {{SUM(CASE WHEN EXTRACT(MONTH FROM sale_date) = m THEN amount ELSE 0 END)}} cho từng tháng. **Dynamic pivot** (không hard-code 12 cột) **không làm được trong SQL thuần** vì SQL yêu cầu danh sách cột xác định tại compile time. Giải pháp: (1) viết 12 cột tường minh – đủ cho báo cáo cố định, (2) dùng {{crosstab}} extension (PostgreSQL) hoặc dynamic SQL trong stored procedure, (3) tốt nhất: pivot ở **application layer** (Java) sau khi query dữ liệu gọn.

### Pivot tường minh (fixed 12 cột) – cách dùng nhiều nhất
~~~sql
SELECT s.product_id,
       SUM(CASE WHEN EXTRACT(MONTH FROM s.sale_date) = 1  THEN s.amount ELSE 0 END) AS m1,
       SUM(CASE WHEN EXTRACT(MONTH FROM s.sale_date) = 2  THEN s.amount ELSE 0 END) AS m2,
       SUM(CASE WHEN EXTRACT(MONTH FROM s.sale_date) = 3  THEN s.amount ELSE 0 END) AS m3,
       -- ... đến m12
       SUM(CASE WHEN EXTRACT(MONTH FROM s.sale_date) = 12 THEN s.amount ELSE 0 END) AS m12,
       SUM(s.amount) AS total_year
FROM sales s
WHERE s.sale_date >= DATE '2026-01-01'
  AND s.sale_date <  DATE '2027-01-01'
GROUP BY s.product_id
ORDER BY s.product_id;
~~~

### So sánh YoY (Year over Year)
Thêm cột năm vào GROUP BY, rồi self-join hoặc dùng window function {{LAG}} trên cột năm:
~~~sql
WITH yearly AS (
    SELECT EXTRACT(YEAR FROM s.sale_date)::int AS yr,
           EXTRACT(MONTH FROM s.sale_date)::int AS mo,
           s.product_id,
           SUM(s.amount) AS amount
    FROM sales s
    WHERE s.sale_date >= DATE '2025-01-01'
      AND s.sale_date <  DATE '2027-01-01'
    GROUP BY yr, mo, s.product_id
),
pivoted AS (
    SELECT product_id,
           yr,
           SUM(CASE WHEN mo = 1  THEN amount ELSE 0 END) AS m1,
           -- ... m12
           SUM(CASE WHEN mo = 12 THEN amount ELSE 0 END) AS m12
    FROM yearly
    GROUP BY product_id, yr
)
SELECT cur.product_id,
       cur.m1  AS m1_2026,  prv.m1  AS m1_2025,
       cur.m2  AS m2_2026,  prv.m2  AS m2_2025,
       -- ...
       cur.m12 AS m12_2026, prv.m12 AS m12_2025
FROM pivoted cur
LEFT JOIN pivoted prv ON prv.product_id = cur.product_id AND prv.yr = cur.yr - 1
WHERE cur.yr = 2026;
~~~

### Dynamic pivot với crosstab (PostgreSQL)
Cần extension {{tablefunc}}: {{CREATE EXTENSION tablefunc;}}
~~~sql
SELECT * FROM crosstab(
    $$
    SELECT product_id,
           EXTRACT(MONTH FROM sale_date)::int AS month,
           SUM(amount)
    FROM sales
    WHERE sale_date >= '2026-01-01' AND sale_date < '2027-01-01'
    GROUP BY product_id, month
    ORDER BY product_id, month
    $$,
    $$ SELECT generate_series(1,12) $$
) AS ct(product_id bigint, m1 numeric, m2 numeric, /* ... */ m12 numeric);
-- product_id phải khai báo đúng kiểu cột gốc; liệt kê đủ m1..m12
~~~
- Câu 1: dữ liệu (row header, category, value).
- Câu 2: danh sách category (1..12) – đảm bảo đủ 12 cột kể cả tháng không có dữ liệu.
- Nhược điểm: vẫn phải khai báo kiểu trả về ({{AS ct(...)}}), không thực sự dynamic.

### Dynamic SQL trong stored procedure
Viết PL/pgSQL build câu SELECT dưới dạng chuỗi rồi {{EXECUTE}}. Chỉ dùng khi **bắt buộc** trả về cột động cho client không biết trước schema (hiếm).

### Cách làm thực tế: pivot ở Java
Query SQL chỉ trả dữ liệu **long format** (product_id, year, month, amount) – rất gọn, index-friendly, không hard-code:
~~~sql
SELECT product_id,
       EXTRACT(YEAR FROM sale_date)::int AS yr,
       EXTRACT(MONTH FROM sale_date)::int AS mo,
       SUM(amount) AS amount
FROM sales
WHERE sale_date >= DATE '2025-01-01'
  AND sale_date <  DATE '2027-01-01'
GROUP BY product_id, yr, mo
ORDER BY product_id, yr, mo;
~~~
Ở Java: dùng {{Map<Integer, Map<Integer, BigDecimal>>}} hoặc stream {{Collectors.groupingBy}} để pivot thành matrix, tính YoY, fill 0 cho tháng thiếu. Linh hoạt, test được, không phụ thuộc DB vendor.

### Pitfall production
- Hard-code 12 cột trong SQL ⇒ khi thêm năm mới phải sửa code SQL, migration phiền.
- {{CASE WHEN}} không có {{ELSE 0}}: SUM bỏ qua NULL nên các tháng có dữ liệu vẫn đúng, nhưng tháng **không có** giao dịch nào sẽ ra NULL thay vì 0 ⇒ cộng/chia ở bước sau (YoY %) thành NULL. Dùng {{ELSE 0}} hoặc {{COALESCE}}.
- So sánh YoY: sản phẩm mới năm nay không có dòng năm trước ⇒ INNER JOIN làm **mất** sản phẩm đó; dùng LEFT JOIN và xử lý {{prv}} NULL. Năm hiện tại chưa hết thì các tháng tương lai = 0 – đừng hiển thị là "giảm 100%".
- Múi giờ: {{sale_date}} lưu UTC, extract month theo UTC có thể khác tháng địa phương ⇒ convert timezone trước khi extract.

> Senior tip: interviewer hỏi "dynamic pivot thế nào", câu trả lời mạnh là: "SQL không làm được dynamic pivot thực sự; tôi query long format rồi pivot ở Java. Nếu buộc phải SQL, tôi dùng crosstab extension hoặc 12 cột CASE WHEN tường minh". Điều này cho thấy bạn hiểu giới hạn của SQL và biết tách trách nhiệm đúng chỗ.
`,
  follow: [
    'Tại sao SQL không hỗ trợ dynamic pivot (cột không biết trước compile time)?',
    'Khi nào nên dùng crosstab extension, khi nào nên pivot ở application?'
  ],
  tags: ['pivot', 'crosstab', 'dynamic SQL', 'YoY', 'CASE WHEN'],
},
{
  id: 'sql-009',
  topic: 'sql',
  level: 'senior',
  q: 'Bảng category(id, name, parent_id): cây danh mục nhiều cấp không giới hạn độ sâu. Cần tìm tất cả danh mục con (tất cả cấp) của một danh mục cho trước. Viết query bằng Recursive CTE. Nếu cây có vòng lặp (cycle) thì sao?',
  a: `**Tóm tắt:** Dùng **Recursive CTE** ({{WITH RECURSIVE}}): phần **anchor** chọn node gốc, phần **recursive** join ngược lại {{parent_id = id}} để đi xuống. PostgreSQL/MySQL 8+ dùng {{WITH RECURSIVE}}; Oracle 11gR2+ và SQL Server dùng {{WITH}} (không có từ khoá RECURSIVE). Phòng vòng lặp bằng {{cycle}} clause (PostgreSQL 14+) hoặc cột {{path}} kiểm tra {{id}} đã xuất hiện chưa.

### Recursive CTE cơ bản
~~~sql
WITH RECURSIVE subcats AS (
    -- Anchor: node gốc
    SELECT c.id, c.name, c.parent_id, 1 AS level, ARRAY[c.id] AS path
    FROM category c
    WHERE c.id = 5  -- danh mục gốc cần tìm con

    UNION ALL

    -- Recursive: tìm con của các node đã tìm được
    SELECT c.id, c.name, c.parent_id, s.level + 1, s.path || c.id
    FROM category c
    JOIN subcats s ON c.parent_id = s.id
    -- Phòng cycle: không đi vào node đã có trong path
    WHERE c.id <> ALL (s.path)
)
SELECT id, name, parent_id, level
FROM subcats
WHERE level > 1  -- loại node gốc nếu chỉ muốn con cháu
ORDER BY level, path;
~~~

### Giải thích từng phần
1. **Anchor**: chạy một lần, chọn node gốc. Cột {{level}} = 1, {{path}} = mảng chứa id gốc (dùng để detect cycle và sắp xếp). Dùng **mảng** chứ không nối chuỗi rồi {{LIKE}}: path text '5>12' sẽ khớp nhầm {{LIKE '%1%'}} và chặn oan node id 1.
2. **UNION ALL**: không dùng {{UNION}} (để loại duplicate) vì cây không có duplicate theo thiết kế; {{UNION ALL}} nhanh hơn.
3. **Recursive term**: join {{c.parent_id = s.id}} – đi từ cha sang con. {{level}} tăng 1, {{path}} nối thêm id con.
4. **WHERE {{c.id <> ALL (s.path)}}**: phòng vòng lặp. Nếu dữ liệu bẩn (A cha B, B cha A), path sẽ chứa id lặp lại ⇒ điều kiện này chặn đệ quy vô hạn.
5. **Điều kiện dừng**: recursive term không trả về dòng nào nữa ⇒ CTE dừng.

### PostgreSQL 14+: clause CYCLE (chuẩn SQL)
~~~sql
WITH RECURSIVE subcats AS (
    SELECT id, name, parent_id, 1 AS level
    FROM category WHERE id = 5
    UNION ALL
    SELECT c.id, c.name, c.parent_id, s.level + 1
    FROM category c JOIN subcats s ON c.parent_id = s.id
)
CYCLE id SET is_cycle USING path
SELECT * FROM subcats WHERE NOT is_cycle;
~~~
- {{CYCLE id SET is_cycle USING path}}: tự động detect cycle, gán {{is_cycle = true}} cho dòng gây cycle, lưu path đã đi qua. Rất gọn, là cú pháp chuẩn SQL (có từ SQL:1999), Oracle 11gR2+ cũng có ({{CYCLE id SET is_cycle TO 'Y' DEFAULT 'N'}}).

### Oracle: CONNECT BY (cú pháp cũ nhưng vẫn dùng)
~~~sql
SELECT id, name, parent_id, LEVEL,
       CONNECT_BY_ISCYCLE AS is_cycle   -- chỉ dùng được khi có NOCYCLE
FROM category
START WITH id = 5
CONNECT BY NOCYCLE PRIOR id = parent_id;
~~~
- Không có {{NOCYCLE}}, gặp vòng lặp Oracle báo {{ORA-01436: CONNECT BY loop in user data}}. {{NOCYCLE}} dừng nhánh tại điểm lặp, {{CONNECT_BY_ISCYCLE}} = 1 đánh dấu dòng có con quay lại tổ tiên.
- Oracle 11gR2+ cũng hỗ trợ recursive {{WITH}} chuẩn (không có từ khoá RECURSIVE, phải liệt kê cột của CTE).

### Hiệu năng & index
- Index **bắt buộc** trên {{parent_id}} (FK index). Nếu không có, mỗi bước đệ quy full scan bảng category.
- Với cây lớn (hàng trăm nghìn node), Recursive CTE vẫn nhanh vì mỗi node chỉ được thăm một lần.
- Giới hạn độ sâu: thêm {{WHERE s.level < 100}} trong recursive term để an toàn (SQL Server có sẵn {{OPTION (MAXRECURSION n)}}, mặc định 100; MySQL có biến {{cte_max_recursion_depth}}, mặc định 1000).

### Ứng dụng khác
- Tìm tất cả cấp trên (ancestors): đổi join thành {{c.id = s.parent_id}}.
- Tính đường dẫn vật liệu (BOM): product -> components -> sub-components.
- Tìm đường đi giữa hai node (shortest path): cần thuật toán BFS, Recursive CTE không tối ưu.

### Pitfall production
- Không phòng cycle ⇒ query chạy vô hạn, CPU 100%, temp file phình to cho tới khi bị cancel ({{pg_cancel_backend}}) ⇒ luôn đặt {{statement_timeout}} cho các query loại này.
- Quên {{UNION ALL}} dùng {{UNION}} ⇒ tốn sort/unique mỗi vòng lặp, chậm gấp nhiều lần.
- Select * trong recursive term ⇒ kéo theo cột không cần, tốn memory. Chỉ select cột cần thiết.
- {{path}} nối chuỗi text vừa tốn bộ nhớ vừa dễ khớp nhầm khi kiểm tra bằng LIKE ⇒ dùng mảng ({{ARRAY[id]}} và toán tử {{||}}) như ví dụ trên.

> Senior tip: khi phỏng vấn, hãy viết Recursive CTE trên giấy/whiteboard mà không cần nhớ cú pháp chính xác – interviewer quan tâm bạn biết **anchor**, **recursive term**, **termination condition**, và **cycle detection**. Nêu rõ: "Tôi dùng UNION ALL, có path để detect cycle, index trên parent_id là bắt buộc". Đó là câu trả lời của người đã deploy recursive query lên production.
`,
  follow: [
    'Tại sao dùng UNION ALL thay vì UNION trong Recursive CTE?',
    'Làm thế nào để tìm "đường đi ngắn nhất" giữa hai node trong cây (không phải tìm tất cả con)?'
  ],
  tags: ['recursive CTE', 'WITH RECURSIVE', 'tree', 'hierarchy', 'cycle detection', 'CYCLE clause'],
},
{
  id: 'sql-010',
  topic: 'sql',
  level: 'senior',
  q: 'Cần upsert (INSERT nếu chưa có, UPDATE nếu đã có) bản ghi vào bảng account_balance(account_id, currency, balance, updated_at) với khóa duy nhất (account_id, currency). Viết câu lệnh cho PostgreSQL (ON CONFLICT) và Oracle (MERGE). Giải thích race condition khi tự viết SELECT → INSERT/UPDATE.',
  a: `**Tóm tắt:** Upsert bằng một câu lệnh ở DB: PostgreSQL {{INSERT … ON CONFLICT (account_id, currency) DO UPDATE …}}, Oracle {{MERGE INTO … USING … ON (…) WHEN MATCHED THEN UPDATE … WHEN NOT MATCHED THEN INSERT …}}. Tự viết {{SELECT}} check tồn tại rồi {{INSERT}}/{{UPDATE}} **có race condition**: hai luồng cùng thấy "chưa có" → cả hai INSERT → unique violation hoặc dữ liệu sai.

### PostgreSQL: INSERT … ON CONFLICT (UPSERT)
~~~sql
INSERT INTO account_balance (account_id, currency, balance, updated_at)
VALUES ('ACC123', 'VND', 1000000, NOW())
ON CONFLICT (account_id, currency) DO UPDATE
SET balance = EXCLUDED.balance,
    updated_at = EXCLUDED.updated_at;
~~~
- {{ON CONFLICT (account_id, currency)}}: chỉ định **unique constraint/index** làm điều kiện conflict. Phải có unique index trên (account_id, currency).
- {{EXCLUDED}}: pseudo-table chứa giá trị {{VALUES}} muốn insert. Dùng {{EXCLUDED.balance}} để lấy giá trị mới.
- Có thể thêm {{WHERE}} sau {{DO UPDATE}} để chỉ update khi điều kiện thỏa mãn (ví dụ chỉ cập nhật nếu balance mới lớn hơn).

### Oracle: MERGE
~~~sql
MERGE INTO account_balance ab
USING (SELECT 'ACC123' AS account_id, 'VND' AS currency, 1000000 AS balance, SYSTIMESTAMP AS updated_at FROM dual) src
ON (ab.account_id = src.account_id AND ab.currency = src.currency)
WHEN MATCHED THEN
    UPDATE SET ab.balance = src.balance, ab.updated_at = src.updated_at
WHEN NOT MATCHED THEN
    INSERT (account_id, currency, balance, updated_at)
    VALUES (src.account_id, src.currency, src.balance, src.updated_at);
~~~
- {{USING}} có thể là subquery, bảng tạm, hoặc {{dual}} cho single row.
- MERGE có từ Oracle 9i; 10g cho phép chỉ một nhánh WHEN và thêm {{DELETE WHERE}}. Oracle **không** có cú pháp ON CONFLICT.
- **Lưu ý concurrency**: MERGE không "khoá trước" dòng chưa tồn tại. Hai session cùng MERGE một khóa mới có thể cùng rơi vào nhánh NOT MATCHED ⇒ session sau dính {{ORA-00001}} (unique violation) ⇒ phải bắt lỗi và retry. PostgreSQL {{ON CONFLICT}} thì đảm bảo atomic insert-or-update ngay cả khi chạy song song (PostgreSQL 15 cũng có MERGE, nhưng MERGE của PG cũng có thể ném unique violation khi chạy đồng thời).

### Race condition của pattern SELECT-then-INSERT/UPDATE (anti-pattern)
~~~java
// SAI: race condition
Optional<AccountBalance> existing = repo.findByAccountIdAndCurrency(id, ccy);
if (existing.isPresent()) {
    existing.get().setBalance(newBal);
    repo.save(existing.get());
} else {
    repo.save(new AccountBalance(id, ccy, newBal));
}
~~~
**Timeline lỗi:**
1. Luồng A: {{SELECT}} → không thấy bản ghi.
2. Luồng B: {{SELECT}} → không thấy bản ghi (A chưa commit).
3. Luồng A: {{INSERT}} → thành công.
4. Luồng B: {{INSERT}} → **unique constraint violation** (hoặc nếu catch exception thì retry, nhưng đã mất atomicity).

**Kết quả:** hoặc ném exception (PostgreSQL: {{ERROR: duplicate key value violates unique constraint}}), hoặc (nếu dùng {{INSERT IGNORE}} MySQL) thì luồng B lặng lẽ không cập nhật → dữ liệu cũ.

### Giải pháp đúng ở application layer
1. **Dùng upsert native query** (JPA {{@Query(nativeQuery = true)}} hoặc JdbcTemplate) – atomic ở DB.
2. **Optimistic locking**: cột {{version}}, {{WHERE version = ?}} khi update. Nếu {{UPDATE}} trả 0 dòng affected → retry toàn bộ logic. Vẫn cần upsert cho INSERT.
3. **Pessimistic locking**: {{SELECT … FOR UPDATE}} chỉ khóa dòng **đã tồn tại** – dòng chưa có thì PostgreSQL/Oracle không khóa gì, nên không chặn được hai INSERT song song (MySQL InnoDB ở REPEATABLE READ có gap lock nhưng hay gây deadlock). Tốn lock, không khuyến khích cho high throughput.
4. **Idempotent key**: client sinh {{idempotency_key}}, server {{INSERT … ON CONFLICT (idempotency_key) DO NOTHING}} – dùng cho payment, webhook.

### MySQL: INSERT … ON DUPLICATE KEY UPDATE
~~~sql
INSERT INTO account_balance (account_id, currency, balance, updated_at)
VALUES ('ACC123', 'VND', 1000000, NOW())
ON DUPLICATE KEY UPDATE
    balance = VALUES(balance),
    updated_at = VALUES(updated_at);
~~~
- Yêu cầu unique key trên (account_id, currency).
- Hàm {{VALUES(col)}} trong ON DUPLICATE KEY UPDATE bị deprecated từ MySQL 8.0.20; cú pháp mới dùng row alias: {{VALUES (...) AS new ON DUPLICATE KEY UPDATE balance = new.balance}}.

### Pitfall production
- Không có unique index trên khóa upsert ⇒ ON CONFLICT không biết conflict cột nào ⇒ lỗi hoặc insert trùng.
- PostgreSQL: conflict target phải khớp **chính xác** một unique constraint/index (PK cũng là unique constraint). Nếu PK là {{id}} surrogate thì {{ON CONFLICT (account_id, currency)}} cần unique index riêng trên cặp này; với partial unique index phải lặp lại điều kiện WHERE của index trong ON CONFLICT.
- {{DO UPDATE SET col = EXCLUDED.col}} ghi đè **tất cả** cột trong SET. Nếu muốn "chỉ cộng dồn balance": {{SET balance = account_balance.balance + EXCLUDED.balance}}.
- Oracle MERGE: nếu {{USING}} trả nhiều dòng khớp cùng một target row → {{ORA-30926}} ("unable to get a stable set of rows"). Luôn đảm bảo source unique theo khóa join.
- Trong Hibernate: dùng {{@Query(nativeQuery = true)}} cho upsert; {{save()}}/{{saveAndFlush()}} không phải upsert.

> Senior tip: câu hỏi "upsert làm thế nào" là câu hỏi check "bạn có biết race condition không". Câu trả lời điểm cao: "Tôi dùng INSERT ON CONFLICT (PostgreSQL) – atomic ở DB; với Oracle MERGE tôi vẫn bắt ORA-00001 và retry vì MERGE song song trên khóa mới có thể đụng unique. Tự viết SELECT-INSERT/UPDATE có race condition: hai request cùng lúc đều thấy chưa có → cả hai INSERT → unique violation hoặc mất cập nhật. Ở Java tôi dùng native query hoặc JdbcTemplate, không dùng JPA save vì nó không atomic".
`,
  follow: [
    'Vì sao ON CONFLICT yêu cầu unique index/constraint mà không chấp nhận chỉ CHECK constraint?',
    'Khi nào nên dùng "INSERT … ON CONFLICT DO NOTHING" thay vì DO UPDATE?'
  ],
  tags: ['upsert', 'ON CONFLICT', 'MERGE', 'race condition', 'idempotent', 'unique constraint'],
},
{
  id: 'sql-011',
  topic: 'sql',
  level: 'mid',
  q: 'Trong SQL, NULL không bằng NULL. Giải thích COUNT(*) vs COUNT(col) vs COUNT(DISTINCT col) khi cột có NULL. Tại sao SUM(col) trả về NULL thay vì 0 khi tất cả giá trị là NULL? ORDER BY … ASC/DESC đặt NULL ở đâu?',
  a: `**Tóm tắt:** NULL = "chưa biết/không có giá trị" – không bằng bất cứ giá trị nào, kể cả NULL. {{COUNT(*)}} đếm **tất cả dòng**; {{COUNT(col)}} chỉ đếm dòng **col NOT NULL**; {{COUNT(DISTINCT col)}} đếm giá trị **khác nhau** (loại NULL). {{SUM}}/{{AVG}} bỏ qua NULL nhưng trả **NULL** nếu **tất cả** dòng đều NULL (không có giá trị để tính). PostgreSQL/Oracle coi NULL **lớn nhất** ({{ASC}} → NULL cuối, {{DESC}} → NULL đầu); MySQL/SQL Server coi NULL **nhỏ nhất** ({{ASC}} → NULL đầu, {{DESC}} → NULL cuối) – luôn ghi rõ {{NULLS FIRST/LAST}} ở DB hỗ trợ.

### Ba loại COUNT – ví dụ minh họa
Bảng {{orders(customer_id, amount)}}:
| customer_id | amount |
|---|---|
| 1 | 100 |
| 1 | NULL |
| 2 | 200 |
| 2 | 200 |
| 3 | NULL |

~~~sql
SELECT
    COUNT(*)           AS cnt_all,        -- 5 (tất cả dòng)
    COUNT(amount)      AS cnt_amt,        -- 3 (chỉ dòng amount NOT NULL)
    COUNT(DISTINCT amount) AS cnt_dist,   -- 2 (100, 200; NULL không đếm)
    SUM(amount)        AS sum_amt,        -- 500 (bỏ qua NULL)
    AVG(amount)        AS avg_amt         -- 166.67 (500/3, không chia 5)
FROM orders;
~~~

### NULL trong aggregate
- {{SUM}}, {{AVG}}, {{MIN}}, {{MAX}} **bỏ qua** NULL trong tính toán.
- Nhưng nếu **không có dòng nào NOT NULL** (tất cả NULL hoặc không dòng) ⇒ kết quả **NULL** (không phải 0).
- {{COUNT}} không bao giờ trả NULL – trả 0 nếu không dòng.

**Tại sao SUM trả NULL?** SQL tuân thủ chuẩn: aggregate của tập rỗng là NULL. Điều này giúp phân biệt "tổng 0" (có dữ liệu, tổng bằng 0) với "không có dữ liệu". Luôn dùng {{COALESCE(SUM(col), 0)}} khi cần 0.

### NULL trong ORDER BY
| DB | ASC mặc định | DESC mặc định | Cú pháp chuẩn |
|---|---|---|---|
| PostgreSQL | NULLS LAST | NULLS FIRST | {{ORDER BY col ASC NULLS LAST}} |
| MySQL | NULLS FIRST | NULLS LAST | Không hỗ trợ NULLS FIRST/LAST (kể cả 8.x) – dùng {{ORDER BY col IS NULL, col}} |
| Oracle | NULLS LAST | NULLS FIRST | {{ORDER BY col ASC NULLS LAST}} |
| SQL Server | NULLS FIRST | NULLS LAST | Không hỗ trợ NULLS FIRST/LAST (dùng {{CASE WHEN col IS NULL THEN 1 ELSE 0 END}}) |

**Luôn ghi rõ thứ tự NULL** (NULLS FIRST/LAST hoặc biểu thức CASE) để không phụ thuộc default của DB.

### So sánh với NULL
- {{col = NULL}} → luôn UNKNOWN (không bao giờ TRUE). Dùng {{col IS NULL}}.
- {{col <> NULL}} → luôn UNKNOWN. Dùng {{col IS NOT NULL}}.
- {{col IN (1, 2, NULL)}}: nếu col = 3 → UNKNOWN (vì 3 = NULL là UNKNOWN) ⇒ không khớp; đảo thành {{NOT IN}} thì vẫn UNKNOWN ⇒ cũng không khớp. Đây là bẫy {{NOT IN}}.
- {{NULL = NULL}} → UNKNOWN. {{NULL IS NULL}} → TRUE.

### NOT IN vs NOT EXISTS (lưu ý lại)
{{NOT IN (subquery)}}: nếu subquery trả về **một** NULL ⇒ cả câu trả **0 dòng**. Đây là lý do {{NOT EXISTS}} an toàn hơn.

### Pitfall production
- {{WHERE col = NULL}} không báo lỗi mà trả 0 dòng – bug "mất dữ liệu" yên lặng.
- {{GROUP BY col}}: mọi NULL được gom chung thành **một nhóm** (khác với phép so sánh {{=}}, GROUP BY/DISTINCT coi các NULL là "không phân biệt"). Nếu muốn đặt label: {{GROUP BY COALESCE(col, 'UNKNOWN')}}.
- {{COUNT(DISTINCT col)}} với cột **toàn** NULL ⇒ trả 0, không phải 1.
- Index và NULL: PostgreSQL B-tree **có** lưu NULL và dùng được cho {{IS NULL}}; MySQL InnoDB cũng vậy. Oracle B-tree **không** lưu entry khi mọi cột của key đều NULL ⇒ {{WHERE col IS NULL}} không dùng được index đơn cột (mẹo: index {{(col, 0)}}). Cột hầu hết NULL trên PG thì partial index {{WHERE col IS NOT NULL}} giúp index nhỏ hơn.

> Senior tip: "NULL không bằng NULL" là triết lý cốt lõi. Khi phỏng vấn, hãy demo nhanh: {{SELECT NULL = NULL}} → UNKNOWN, {{SELECT NULL IS NULL}} → TRUE. Và nhớ: {{COUNT(*)}} đếm dòng, {{COUNT(col)}} đếm giá trị không NULL – đây là câu hỏi filter ứng viên junior/mid rất hay.
`,
  follow: [
    'Tại sao SUM của tập rỗng là NULL chứ không phải 0?',
    'Làm thế nào để index cho truy vấn WHERE col IS NULL trên PostgreSQL?'
  ],
  tags: ['NULL', 'COUNT', 'aggregate', 'ORDER BY', 'three-valued logic'],
},
{
  id: 'sql-012',
  topic: 'sql',
  level: 'mid',
  q: 'So sánh DELETE vs TRUNCATE vs DROP. Khi nào dùng cái nào? View vs Materialized View: khác nhau ra sao, refresh thế nào, trade-off gì?',
  a: `**Tóm tắt:** {{DELETE}}: xoá dòng, có WHERE, ghi WAL/redo, trigger chạy, có thể rollback, chậm. {{TRUNCATE}}: xoá **toàn bộ** bảng, không WHERE, tối thiểu WAL, không trigger, **không rollback** được (trừ PostgreSQL trong transaction), nhanh. {{DROP}}: xoá **cấu trúc** bảng (schema, index, constraint, grant), dữ liệu mất luôn. {{View}}: truy vấn ảo, chạy real-time, không lưu dữ liệu. {{Materialized View}}: lưu snapshot dữ liệu, cần {{REFRESH}}, nhanh khi đọc nhưng dữ liệu có thể cũ.

### DELETE vs TRUNCATE vs DROP

| Đặc điểm | DELETE | TRUNCATE | DROP |
|---|---|---|---|
| Xoá gì | Dòng (có WHERE) | Toàn bộ bảng | Bảng (cấu trúc + dữ liệu) |
| WHERE | Có | Không | Không |
| WAL/Redo log | Ghi từng dòng | Chỉ ghi metadata (deallocate pages) | Ghi metadata |
| Trigger | {{BEFORE/AFTER DELETE}} chạy | **Không chạy** | N/A |
| Rollback | Có (trong transaction) | PostgreSQL: có trong TX; Oracle/MySQL: **không** (DDL implicit commit) | Không (DDL) |
| Identity/Sequence | Không reset | MySQL: **reset** AUTO_INCREMENT; PostgreSQL: chỉ reset khi ghi {{TRUNCATE … RESTART IDENTITY}} (mặc định CONTINUE IDENTITY); Oracle: không reset | Mất sequence gắn liền |
| Speed | Chậm (tương ứng số dòng) | Rất nhanh (O(1) metadata) | Nhanh |
| Lock | Row lock (SQL Server có thể escalate lên table lock) | AccessExclusive lock (PG) / Table lock | AccessExclusive lock |
| Foreign Key | Check FK each row | Cần disable FK hoặc {{TRUNCATE … CASCADE}} | Lỗi nếu bảng khác còn FK tham chiếu; cần {{DROP TABLE … CASCADE}} (PG) / {{CASCADE CONSTRAINTS}} (Oracle) |

### Khi nào dùng cái nào
- **DELETE**: xoá một số dòng, cần trigger/audit, cần rollback, có WHERE.
- **TRUNCATE**: dọn toàn bảng (staging, log, temp), không cần trigger, dữ liệu lớn (cần reset identity trên PG thì thêm RESTART IDENTITY).
- **DROP**: xoá hẳn bảng không dùng nữa, migration drop column/type.

### View vs Materialized View

| | View | Materialized View |
|---|---|---|
| Lưu dữ liệu | **Không** | **Có** (snapshot) |
| Đọc | Chạy query định nghĩa real-time | Đọc từ dữ liệu đã lưu – **rất nhanh** |
| Ghi | {{INSERT/UPDATE/DELETE}} trên view (nếu simple) hoặc {{INSTEAD OF trigger}} | **Không ghi trực tiếp** (cần refresh) |
| Độ mới dữ liệu | Luôn mới nhất | Tùy lịch refresh (có thể cũ) |
| Dung lượng | 0 | Bằng kích thước kết quả |
| Index | Không (dùng index bảng gốc) | **Có thể tạo index** trên MV |
| Refresh | N/A | {{REFRESH MATERIALIZED VIEW name}} (full) hoặc {{CONCURRENTLY}} (PG 9.4+) |

### Refresh Materialized View
- **Full refresh**: {{REFRESH MATERIALIZED VIEW mv_name}} – lock exclusive, chặn đọc lúc refresh.
- **Concurrently** (PostgreSQL): {{REFRESH MATERIALIZED VIEW CONCURRENTLY mv_name}} – cần **unique index** trên MV, không lock đọc, chậm hơn, tốn dung lượng tạm.
- **Incremental**: PostgreSQL không hỗ trợ sẵn; tự viết bảng tổng hợp cập nhật bằng trigger/job, hoặc dùng extension {{pg_ivm}} (Incremental View Maintenance); {{pg_cron}} chỉ để **lên lịch** REFRESH, không làm incremental. Oracle có {{FAST REFRESH}} với materialized view log.

### Trade-off chọn MV
- **Dùng MV khi**: query phức tạp (join nhiều bảng, aggregate lớn), chạy thường xuyên, chấp nhận dữ liệu chậm vài phút/giờ.
- **Không dùng MV khi**: dữ liệu cần real-time (số dư tài khoản, giá cổ phiếu), bảng gốc ít dòng, query đơn giản.

### Pitfall production
- {{TRUNCATE}} trên bảng có FK: PostgreSQL yêu cầu {{TRUNCATE parent CASCADE}} hoặc disable FK trước. Oracle: {{TRUNCATE TABLE … CASCADE}} (12c+).
- {{TRUNCATE}} trong transaction dài: giữ lock {{AccessExclusive}} lâu ⇒ chặn **mọi** truy cập kể cả {{SELECT}} cho tới khi transaction kết thúc. TRUNCATE cũng **không MVCC-safe**: sau khi commit, transaction khác đang dùng snapshot cũ sẽ thấy bảng rỗng.
- MV {{REFRESH CONCURRENTLY}} không có unique index ⇒ lỗi. Unique index trên MV thường là khóa chính của kết quả.
- MV stale data: báo cáo sai số liệu. Luôn có monitoring: {{last_refresh_time}}, {{lag_seconds}}.

> Senior tip: interviewer hỏi "TRUNCATE có rollback không?" – câu trả lời chuẩn: "PostgreSQL có rollback trong transaction (MVCC), Oracle/MySQL không (DDL implicit commit)". Với MV: "Tôi dùng MV cho báo cáo tổng hợp ngày (refresh 1 lần/đêm), không dùng cho số dư real-time". Nêu được trade-off mới là senior.
`,
  follow: [
    'TRUNCATE có reset identity/sequence không trên PostgreSQL, MySQL và Oracle?',
    'Làm thế nào để refresh Materialized View tăng dần (incremental) trên PostgreSQL?'
  ],
  tags: ['DELETE', 'TRUNCATE', 'DROP', 'VIEW', 'MATERIALIZED VIEW', 'REFRESH'],
},
{
  id: 'sql-013',
  topic: 'sql',
  level: 'senior',
  q: 'Cần phát hiện giao dịch bất thường: giao dịch có số tiền lớn hơn 3 lần trung bình 30 ngày trước của **chính khách hàng đó**. Bảng transaction(id, customer_id, amount, created_at). Viết query dùng CTE + window function.',
  a: `**Tóm tắt:** Dùng CTE tính {{avg_30d}} cho mỗi giao dịch: window {{AVG(amount) OVER (PARTITION BY customer_id ORDER BY created_at RANGE BETWEEN INTERVAL '30 days' PRECEDING AND INTERVAL '1 day' PRECEDING)}}. Sau đó lọc {{amount > 3 * avg_30d}}. Lưu ý: {{RANGE}} với offset cần đúng một cột ORDER BY kiểu số/date/timestamp; PostgreSQL hỗ trợ offset {{INTERVAL}} trong frame từ bản 11.

### Window frame RANGE vs ROWS
- {{ROWS BETWEEN 30 PRECEDING AND 1 PRECEDING}}: lấy **30 dòng trước** (số lượng dòng), không phù hợp vì số giao dịch/ngày không đều.
- {{RANGE BETWEEN INTERVAL '30 days' PRECEDING AND INTERVAL '1 day' PRECEDING}}: lấy các dòng có {{created_at}} trong khoảng **30 ngày trước đến 1 ngày trước** (dựa trên giá trị timestamp). Đây là đúng cho "trung bình 30 ngày trước".
- {{INTERVAL '1 day' PRECEDING}} tính theo **thời điểm**, không theo ngày lịch: loại chính giao dịch hiện tại và mọi giao dịch trong 24 giờ ngay trước nó; cửa sổ là [t - 30 ngày, t - 1 ngày].

### SQL mẫu (PostgreSQL)
~~~sql
WITH txn_with_avg AS (
    SELECT t.*,
           AVG(t.amount) OVER (
               PARTITION BY t.customer_id
               ORDER BY t.created_at
               RANGE BETWEEN INTERVAL '30 days' PRECEDING
                         AND INTERVAL '1 day' PRECEDING
           ) AS avg_30d
    FROM transaction t
)
SELECT t.id,
       t.customer_id,
       t.amount,
       t.created_at,
       t.avg_30d,
       t.amount / NULLIF(t.avg_30d, 0) AS ratio
FROM txn_with_avg t
WHERE t.avg_30d IS NOT NULL
  AND t.amount > 3 * t.avg_30d
ORDER BY t.customer_id, t.created_at;
~~~

### Xử lý edge case
- {{NULLIF(avg_30d, 0)}}: tránh chia cho 0 khi trung bình là 0.
- {{avg_30d IS NOT NULL}}: loại giao dịch không có giao dịch nào trong cửa sổ (khách mới hoặc lâu không giao dịch). AVG chỉ dựa trên 1–2 giao dịch thì rất nhiễu ⇒ thường thêm {{COUNT(*) OVER (cùng frame)}} và yêu cầu tối thiểu N giao dịch.
- Muốn lấy đủ 30 ngày tới sát giao dịch hiện tại nhưng loại chính nó: {{RANGE BETWEEN INTERVAL '30 days' PRECEDING AND CURRENT ROW EXCLUDE CURRENT ROW}} (PG 11+). Đừng chỉ dùng {{AND CURRENT ROW}}: giao dịch lớn sẽ tự kéo trung bình của chính nó lên.

### MySQL 8 / SQL Server
MySQL 8.0+ hỗ trợ {{RANGE}} với offset interval (cú pháp {{INTERVAL 30 DAY PRECEDING}}).
SQL Server: không hỗ trợ {{RANGE INTERVAL}}; dùng {{ROWS}} kết hợp với subquery hoặc {{DATEADD}} trong join.
Cách thay thế: self-join hoặc correlated subquery (cú pháp dưới là MySQL; PostgreSQL viết {{t.created_at - INTERVAL '30 days'}}):
~~~sql
SELECT t.*
FROM transaction t
WHERE t.amount > 3 * (
    SELECT AVG(t2.amount)
    FROM transaction t2
    WHERE t2.customer_id = t.customer_id
      AND t2.created_at >= DATE_SUB(t.created_at, INTERVAL 30 DAY)
      AND t2.created_at < DATE_SUB(t.created_at, INTERVAL 1 DAY)
);
~~~
Thường chậm hơn window function nhưng ý tưởng dùng được ở mọi DB.

### Hiệu năng & index
Index composite: {{(customer_id, created_at, amount)}}.
- Window function với {{RANGE}} buộc sort theo {{created_at}} cho mỗi partition. Index trên {{(customer_id, created_at)}} cho phép index scan không sort.
- {{amount}} trong index (INCLUDE hoặc cột cuối) giúp index-only scan.

### Mở rộng: isolation forest / z-score
Phương pháp "3 lần trung bình" đơn giản nhưng hay false positive (giao dịch lớn định kỳ). Production thường dùng:
- **Z-score**: {{(amount - avg) / stddev}} > 3. Cần {{STDDEV}} window function.
- **Percentile**: {{PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY amount)}} theo khách – PostgreSQL không cho dùng ordered-set aggregate làm window function, phải GROUP BY rồi join lại (Oracle thì cho {{OVER (PARTITION BY …)}}).
- **Isolation Forest / ML**: offline training, online scoring.

### Pitfall production
- Offset {{INTERVAL}} chỉ dùng với cột {{TIMESTAMP}}/{{DATE}}; cột số (epoch seconds) thì offset phải là số ({{RANGE BETWEEN 2592000 PRECEDING AND 86400 PRECEDING}}) hoặc cast sang timestamp.
- PostgreSQL: {{RANGE}} frame yêu cầu ORDER BY chỉ **một** cột và kiểu dữ liệu hỗ trợ interval arithmetic.
- Không có index {{(customer_id, created_at)}} ⇒ full scan + sort toàn bộ dữ liệu theo (customer_id, created_at) ⇒ rất chậm và tràn work_mem ra đĩa trên bảng hàng chục triệu dòng.
- Chạy real-time trên luồng giao dịch: dùng materialized view refresh mỗi 5 phút hoặc stream processing (Flink, Kafka Streams) thay vì query ad-hoc.

> Senior tip: "Tôi dùng window AVG với RANGE INTERVAL '30 days' PRECEDING vì nó tính trung bình theo thời gian thực chứ không phải theo số dòng. Index (customer_id, created_at) là bắt buộc. Trên production tôi sẽ không chạy query này per-request – tôi sẽ pre-compute vào bảng anomaly_score refresh 5 phút một lần, hoặc đẩy sang Flink stream processing".
`,
  follow: [
    'Tại sao dùng RANGE INTERVAL thay vì ROWS 30 PRECEDING?',
    'Làm thế nào để tính z-score thay vì ratio đơn giản?'
  ],
  tags: ['window function', 'RANGE', 'anomaly detection', 'fraud', 'AVG OVER'],
},
{
  id: 'sql-014',
  topic: 'sql',
  level: 'senior',
  q: 'Viết query lọc giao dịch tháng 3/2026 đúng cách. Giải thích tại sao không dùng WHERE MONTH(created_at) = 3, không dùng BETWEEN, và phải dùng "nửa mở" (>= start AND < end). Múi giờ ảnh hưởng thế nào?',
  a: `**Tóm tắt:** Cách đúng: {{WHERE created_at >= TIMESTAMPTZ '2026-03-01 00:00:00+07' AND created_at < TIMESTAMPTZ '2026-04-01 00:00:00+07'}}. **Không** dùng {{MONTH(created_at) = 3}} (không dùng index, sai múi giờ), **không** dùng {{BETWEEN}} (giới hạn trên inclusive dễ bị trùng/lỡ mili-giây). **Nửa mở** (half-open) [start, end) là chuẩn: bao gồm start, loại trừ end. Múi giờ: {{created_at}} lưu UTC, convert sang múi giờ user ({{AT TIME ZONE}}) **trước** khi so sánh, hoặc dùng literal {{TIMESTAMPTZ}} có offset.

### Sai lầm phổ biến

| Cách viết | Vấn đề |
|---|---|
| {{WHERE MONTH(created_at) = 3}} | Bọc hàm quanh cột → **không dùng được index** (full scan). Sai múi giờ: {{created_at}} là UTC, {{MONTH()}} lấy tháng UTC, user ở +07 thấy tháng khác. |
| {{WHERE created_at BETWEEN '2026-03-01' AND '2026-03-31'}} | {{BETWEEN}} inclusive cả hai đầu. {{'2026-03-31'}} = {{'2026-03-31 00:00:00'}} → **mất gần trọn ngày 31/3** (mọi thời điểm sau 00:00:00). Nếu ghi {{'2026-03-31 23:59:59'}} → **mất phần lẻ giây** 23:59:59.000001–.999999 (PostgreSQL lưu tới micro-giây). |
| {{WHERE DATE(created_at) BETWEEN …}} | Vẫn bọc hàm → mất index. |
| {{WHERE created_at >= '2026-03-01' AND created_at <= '2026-03-31 23:59:59'}} | Cố gắng sửa BETWEEN nhưng vẫn sót mili-giây, và cứng nhắc (tháng 2, năm nhuận). |

### Cách đúng: nửa mở (half-open interval)
~~~sql
-- Tháng 3/2026 theo múi giờ Việt Nam (+07)
SELECT *
FROM transaction
WHERE created_at >= TIMESTAMPTZ '2026-03-01 00:00:00+07'
  AND created_at <  TIMESTAMPTZ '2026-04-01 00:00:00+07';
~~~
- {{>= start}}: bao gồm đúng 00:00:00.000 ngày 1/3.
- {{< end}}: loại trừ 00:00:00.000 ngày 1/4 → **bao trọn vẹn ngày 31/3 đến 23:59:59.999999**.
- Tự động đúng cho tháng 28/29/30/31 ngày, năm nhuận.

### Múi giờ (timezone) – điểm dễ sai nhất
- {{created_at}} nên lưu **UTC** ({{TIMESTAMPTZ}} / {{DATETIME}} UTC).
- User ở múi giờ +07: "tháng 3" của user = {{2026-03-01 00:00:00+07}} đến {{2026-04-01 00:00:00+07}}.
- Cách 1 (khuyên): Dùng literal {{TIMESTAMPTZ}} có offset như trên. DB tự convert về UTC để so sánh.
- Cách 2: Convert cột (mất index nếu không có functional index):
  {{WHERE (created_at AT TIME ZONE 'Asia/Ho_Chi_Minh') >= '2026-03-01' ...}}.
- Cách 3 (application): Java tính mốc đầu/cuối theo múi giờ user rồi bind parameter – **tốt nhất** vì DB thấy giá trị UTC thuần, dùng index tốt nhất.

### Index & SARGable
- {{WHERE created_at >= ? AND created_at < ?}} là **SARGable** (Search ARGument ABLE) – optimizer dùng index range scan.
- Bất kỳ hàm nào trên cột ({{MONTH()}}, {{DATE()}}, {{YEAR()}}, {{TRUNC()}}, {{CAST()}}) → **không SARGable** → full scan (trừ functional index / expression index).
- Composite index {{(customer_id, created_at)}}: điều kiện {{customer_id = ? AND created_at >= ? AND created_at < ?}} cho index range scan trên partition key.

### Java/Spring: bind parameter đúng cách
~~~java
// Tốt: tính Instant ở Java, bind parameter
ZoneId vn = ZoneId.of("Asia/Ho_Chi_Minh");
OffsetDateTime start = LocalDate.of(2026, 3, 1).atStartOfDay(vn).toOffsetDateTime();
OffsetDateTime end   = LocalDate.of(2026, 4, 1).atStartOfDay(vn).toOffsetDateTime();

List<Txn> txns = jdbc.query(
    "SELECT * FROM transaction WHERE created_at >= ? AND created_at < ?",
    rowMapper,
    start, end  // OffsetDateTime -> TIMESTAMPTZ (PgJDBC)
);
~~~
- Không concat string SQL → tránh SQL injection, plan cache hit.
- PgJDBC hỗ trợ {{OffsetDateTime}} cho {{TIMESTAMPTZ}} qua setObject; {{Instant}} thì nên để Hibernate 6/JPA map, hoặc đổi sang {{OffsetDateTime}} UTC khi dùng JDBC thuần.

### Pitfall production
- Literal không có offset như {{created_at >= '2026-03-01'}} so với cột {{TIMESTAMPTZ}} được hiểu theo {{TimeZone}} của **session** ⇒ server/session để UTC thì lệch 7 giờ so với tháng của user VN. Luôn ghi offset hoặc bind giá trị từ Java.
- Báo cáo "tuần này": tính {{startOfWeek}} (Thứ 2 hoặc CN tuỳ locale) ở Java, bind parameter.
- Partition table theo tháng: điều kiện {{created_at}} nửa mở giúp **partition pruning** tự động.
- CDC / replication: {{wal2json}}, {{Debezium}} phát event theo commit time – vẫn dùng nửa mở để query lại dữ liệu nhất quán.

> Senior tip: đây là câu hỏi "bạn có bao giờ debug báo cáo sai số liệu do múi giờ không". Câu trả lời mạnh: "Tôi luôn dùng half-open interval [start, end), bind mốc thời gian từ Java (không dùng hàm DB trên cột), index trên created_at. BETWEEN và MONTH() là hai cái bẫy tôi không bao giờ dùng". Nêu được "SARGable", "partition pruning", "plan cache" là điểm cộng lớn.
`,
  follow: [
    "Tại sao BETWEEN '2026-03-01' AND '2026-03-31' lại mất dữ liệu?",
    'Làm thế nào để tạo functional index cho WHERE DATE(created_at) = ? trên PostgreSQL?'
  ],
  tags: ['half-open interval', 'timezone', 'SARGable', 'index', 'BETWEEN', 'MONTH()'],
},
{
  id: 'sql-015',
  topic: 'sql',
  level: 'mid',
  q: 'Bạn chạy {{EXPLAIN (ANALYZE, BUFFERS)}} cho câu query lọc đơn hàng và nhận được plan in {{Seq Scan on orders}} kèm dòng {{Rows Removed by Filter: 19980000}}, chỗ khác lại là {{Index Only Scan}}. Đọc plan giúp tôi: từng dòng trong plan nói lên điều gì, khi nào {{Seq Scan}} lại là lựa chọn đúng, và {{Index Only Scan}} khác {{Index Scan}} ở đâu?',
  a: `**Tóm tắt:** {{EXPLAIN}} in ra **cây node**, thực thi từ lá lên gốc; mỗi node có hai hàng: cost/rows/width (ước lượng trước khi chạy) và actual time/rows (đo khi chạy thật). {{Seq Scan}} đọc tuần tự toàn bộ bảng, {{Index Scan}} seek theo index rồi lấy dòng từ heap, {{Index Only Scan}} chỉ đọc index. Dòng {{Rows Removed by Filter: X}} là số dòng **đã đọc rồi bị vứt** ⇒ X rất lớn nghĩa là "đọc gần cả bảng để trả về vài chục nghìn dòng".

### Đọc một plan cụ thể
~~~sql
Seq Scan on orders (cost=0.00..486320.00 rows=19980000 width=64)
                (actual time=0.42..15230.8 rows=20000 loops=1)
  Filter: ((status = 'PAID'::text) AND (created_at >= '2026-01-01'::date))
  Rows Removed by Filter: 19980000
  Buffers: shared hit=121000 read=198000
~~~
| Dòng trong plan | Ý nghĩa |
|---|---|
| {{cost=0.00..486320 rows=19980000}} | chi phí ước lượng và **số dòng ước tính** |
| {{actual time=.. rows=20000 loops=1}} | thời gian thật (ms) và **số dòng thực** |
| {{loops=1}} | node này chạy bao nhiêu lần; nested loop con có {{loops}} lớn thì actual {{rows}} chỉ là trung bình mỗi vòng ⇒ tổng = {{rows}} × {{loops}} |
| {{Rows Removed by Filter}} | số dòng bị đọc rồi bỏ đi – chỉ hiện ở node có Filter (Seq Scan / Index Scan / Bitmap Heap Scan) |
| {{Buffers: shared hit / read}} | đọc từ RAM / đọc từ đĩa – thước đo I/O thật |

Ở ví dụ trên planner **ước khoảng 20 triệu dòng trả về nhưng thực tế chỉ 20.000** ⇒ selectivity thật chỉ ~0,1% ⇒ index đúng cột có lý do tồn tại. Nhưng kết luận cuối cùng vẫn phải lấy từ {{actual time}} và {{Buffers}} trước/sau, không phải từ cái tên node.

### Index Scan và Index Only Scan khác nhau thế nào
- **Index Scan**: seek trong B-tree theo điều kiện, mỗi dòng phù hợp lại đọc một bản ghi ở **heap** (I/O ngẫu nhiên) ⇒ hợp khi trả về ít dòng trên bảng rộng.
- **Index Only Scan**: mọi cột query cần đều nằm trong index (dùng {{INCLUDE}} hoặc đặt đúng thứ tự) ⇒ bỏ qua heap. Nhưng PostgreSQL vẫn phải kiểm tra dòng đã "visible" với snapshot hiện tại, bằng **visibility map**: trang heap nào còn recent update thì phải đọc heap ⇒ cột {{Heap Fetches}} lớn hơn 0, khi đó index-only chỉ là "nửa mùa".
- Chi phí: với random read PostgreSQL coi nặng gấp ~4 lần read tuần tự ({{random_page_cost}} mặc định 4) ⇒ seek + random đọc có thể đắt hơn một lần quét liên tục.

### Khi nào Seq Scan là lựa chọn đúng
1. Query cần phần lớn dòng bảng (planner ước > vài % tổng): đọc liên tục rẻ hơn tìm ngẫu nhiên.
2. Bảng nhỏ (vài MB): chi phí quản lý index không bù lại.
3. Index không chứa đủ cột cần ⇒ vẫn phải chạm heap, đôi khi seq scan nhanh hơn.
4. {{Buffers}} cho thấy phần lớn là {{hit}} (đã nằm trong RAM) ⇒ seq scan chỉ tốn CPU, không tốn đĩa.

### Cách kiểm chứng
- So **node gốc** (tổng thời gian) và {{Buffers}} trước/sau khi thêm index; đừng tối ưu theo cảm giác.
- {{Rows Removed by Filter}} khổng lồ ⇒ cân nhắc đưa cột lọc vào index hoặc index bao phủ để loại sớm ngay từ index.
- Node con có {{loops}} lớn ⇒ thiếu index cho vế trong của nested loop.

### Pitfall production
- {{EXPLAIN ANALYZE}} trên câu {{UPDATE}}/{{DELETE}} là **thực thi thật** ⇒ luôn bọc {{BEGIN}} rồi {{ROLLBACK}}.
- Plan trên staging khác production (thống kê, phân bố dữ liệu) – luôn đo lại trên dữ liệu thật.
- Thấy chữ {{Seq Scan}} chưa phải lỗi; thêm index chỉ vì "tôi không thích seq scan" là cách làm chậm ghi vô ích.

> Senior tip: quy tắc đọc plan của tôi: nhìn node gốc trước (tổng thời gian), tìm node con tốn nhất, rồi so rows ước tính với rows thực tế. Chữ "Seq Scan" không phải lỗi; lỗi thật là "Rows Removed by Filter: 19980000" cộng thời gian 15 giây trong khi ứng dụng chỉ cần 20.000 dòng.
`,
  follow: [
    'Vì sao index-only scan vẫn có thể phải đọc heap ({{Heap Fetches}} > 0)?',
    'Khi nào bạn quyết định **không** thêm index dù plan vẫn là {{Seq Scan}}?'
  ],
  tags: ['EXPLAIN', 'Seq Scan', 'Index Only Scan', 'execution plan', 'visibility map'],
},
{
  id: 'sql-016',
  topic: 'sql',
  level: 'mid',
  q: 'Hai hệ thống export đơn hàng ra {{staging_order_a}} và {{staging_order_b}} với cùng khoá {{order_id}}. Bạn cần đối soát và tách đúng 4 nhóm: khớp nhau, chỉ có ở A, chỉ có ở B, có cả hai nhưng **số tiền lệch**. Viết query thế nào, vì sao {{FULL OUTER JOIN}} tiện hơn hai lần anti-join, và khi nào thì dùng {{EXCEPT}}?',
  a: `**Tóm tắt:** {{FULL OUTER JOIN}} hai bảng theo khóa, {{COALESCE}} hai khóa lại (dòng thiếu một phía thì khóa bên kia là NULL) rồi phân loại bằng {{CASE}} – cả **4 nhóm ra trong một lần quét**. Hai lần anti-join chỉ cho hai nhóm "thiếu", muốn so giá trị lại phải join thêm lần nữa.

### Query
~~~sql
SELECT COALESCE(a.order_id, b.order_id) AS order_id,
       CASE
         WHEN a.order_id IS NULL THEN 'ONLY_B'
         WHEN b.order_id IS NULL THEN 'ONLY_A'
         WHEN a.amount IS DISTINCT FROM b.amount THEN 'MISMATCH'
         ELSE 'MATCHED'
       END AS status,
       a.amount AS amount_a,
       b.amount AS amount_b
FROM staging_order_a a
FULL OUTER JOIN staging_order_b b
  ON b.order_id = a.order_id;
~~~
- {{FULL OUTER JOIN}} = {{LEFT JOIN}} (giữ hết dòng A kể cả không khớp) **ghép** {{RIGHT JOIN}} (giữ hết dòng B).
- {{IS DISTINCT FROM}} là so sánh không quan tâm NULL: {{NULL}} với {{NULL}} là **bằng**, {{100}} với {{NULL}} là **khác**. MySQL có toán tử tương đương {{a <=> b}}; DB nào không có thì viết ngược lại: {{NOT (a = b OR (a IS NULL AND b IS NULL))}}.
- Đếm 4 nhóm bằng CTE rồi {{GROUP BY status}}:
~~~sql
WITH diff AS ( /* query đối soát ở trên */ )
SELECT status, COUNT(*) AS orders FROM diff GROUP BY status ORDER BY orders DESC;
~~~

### So với anti-join và EXCEPT
| Cách | Trả được gì | Hạn chế |
|---|---|---|
| {{NOT EXISTS}} hai chiều | nhóm chỉ A, nhóm chỉ B | quét hai lần, không so được giá trị từng cột |
| {{FULL OUTER JOIN}} | cả 4 nhóm, kèm giá trị cả hai phía | phải chắc khóa bên trong là duy nhất |
| {{EXCEPT}} / {{INTERSECT}} | danh sách khóa thiếu / phần chung | không mang cột bên kia sang so sánh |

{{EXCEPT}} tiện khi chỉ cần **danh sách ID** (EXCEPT tự loại bản sao):
~~~sql
SELECT order_id FROM staging_order_a
EXCEPT
SELECT order_id FROM staging_order_b;   -- chỉ có ở A
~~~

### Hiệu năng
- Cả hai bảng cần index (hoặc unique) trên {{order_id}}; planner thường làm hash join: quét A xây hash, quét B probe, tốn bộ nhớ theo cỡ bảng A.
- Staging hàng triệu dòng: nên đếm theo nhóm trước, hoặc so **tổng theo ngày** ({{SUM(amount)}} {{GROUP BY}} ngày) để phát hiện lệch rồi mới đối soát chi tiết.
- Thu hẹp khoảng ngày trước khi join để giảm quét; chỉ đọc thì thêm {{WHERE}} ở hai vế.

### Pitfall production
- {{order_id}} bị import lặp trong staging ⇒ join **nhân đôi** dòng, báo "mismatch" ảo. Dedupe hoặc tạo unique index trước.
- Kiểu dữ liệu hai bên lệch ({{BIGINT}} vs {{VARCHAR}}) ⇒ hash join không khớp được, phải {{CAST}} cùng kiểu (ép kiểu có thể làm mất index của vế kia).
- So tiền: dùng {{NUMERIC}} hoặc số nguyên minor units, không dùng {{double}} – phép tính dấu phẩy động sẽ sinh lệch ảo.
- So chuỗi thì để ý collation và khoảng trắng cuối chuỗi ({{TRIM}} khi source là hệ legacy).

> Senior tip: khi được hỏi "đối soát hai nguồn thế nào", tôi nói luôn "tôi tách 4 nhóm: khớp, thiếu trái, thiếu phải, lệch giá trị" rồi mới viết SQL – interviewer thấy bạn nghĩ bằng **kết quả nghiệp vụ** trước, cú pháp sau. Tôi còn hỏi ngược lại: "khóa có unique không, nguồn có import lặp không?" – đó là câu quyết định báo cáo đối soát có đúng không.`,
  follow: [
    '{{FULL OUTER JOIN}} được thực thi thế nào (hash join) trên dữ liệu lớn?',
    'Nếu staging có hàng trăm triệu dòng, bạn đối soát theo lô ra sao?'
  ],
  tags: ['FULL OUTER JOIN', 'anti-join', 'EXCEPT', 'data reconciliation', 'IS DISTINCT FROM'],
},
{
  id: 'sql-017',
  topic: 'sql',
  level: 'senior',
  q: 'Plan của bạn ghi {{rows=12000000}} nhưng {{actual rows=20000}} – planner ước lượng sai gấp 600 lần và chọn sai plan, trong khi bạn đã chạy {{ANALYZE}}. Giải thích planner PostgreSQL ước số dòng bằng những thống kê nào ({{pg_stats}}), những tình huống nào khiến estimate lệch dù statistics mới, và bạn xử lý ra sao?',
  a: `**Tóm tắt:** Planner ước **selectivity** cho từng điều kiện WHERE từ thống kê do {{ANALYZE}} sinh ra ({{most_common_vals}}, {{histogram_bounds}}, {{n_distinct}}, {{null_frac}}, {{correlation}} trong {{pg_stats}}), **nhân các tỉ lệ lại** rồi nhân với {{reltuples}} của bảng. Lệch lớn thường do cột **tương quan** (mất giả định độc lập), phân phối **lệch mạnh** (giá trị cần tìm nằm ngoài top giá trị hay gặp), thống kê cũ giữa hai lần nạp dữ liệu, và **generic plan** với {{PreparedStatement}}.

### Planner tính thế nào
Với {{WHERE status = 'PAID' AND amount > 1000000}} trên bảng {{reltuples}} = 20 triệu:
1. {{status = 'PAID'}}: nếu 'PAID' nằm trong most common values thì lấy đúng tỉ lệ (vd 30%); nếu không nằm thì ước bằng histogram, xem thêm {{null_frac}} và {{n_distinct}}.
2. {{amount > 1000000}}: tìm mốc trong histogram rồi lấy tỉ lệ khoảng chia.
3. Nhân hai tỉ lệ: {{20.000.000 x 0,3 x 0,01 = 60.000}} – giả định **hai cột độc lập**. Nếu 90% đơn PAID đều có amount > 1.000.000 thì con số thật là 5.400.000, tức ước lượng 60.000 **thấp hơn thực tế 90 lần**.

### Tình huống lệch dù statistics mới
| Tình huống | Vì sao estimate sai | Cách xử lý |
|---|---|---|
| Hai cột **tương quan** (PAID luôn đi với amount lớn) | nhân độc lập ⇒ sai số tích luỹ | {{CREATE STATISTICS st_pair (dependencies) ON status, amount FROM sales;}} rồi {{ANALYZE sales;}} |
| Phân phối lệch: 99% dòng là giá trị phổ biến, giá trị cần tìm nằm ngoài top MCV | giá trị ngoài MCV chỉ ước được bằng histogram trung bình | tăng {{default_statistics_target}} cho bảng hot rồi {{ANALYZE}} |
| Bulk load / đổi pattern giữa hai lần {{ANALYZE}} | thống kê mô tả quá khứ | {{ANALYZE}} sau ETL; kiểm tra {{pg_stats}} theo bảng con của partition |
| {{PreparedStatement}} thành **generic plan** | planner không biết giá trị tham số | {{SET plan_cache_mode = force_custom_plan;}} cho câu critical, hoặc viết lại bằng literal/JOIN |
| Điều kiện bọc hàm / ép kiểu ({{lower(email) = ...}}) | không có thống kê cho biểu thức đó | viết lại query SARGable, hoặc tạo index biểu thức riêng cho {{lower(email)}} |
| Join nhiều bảng | sai số **nhân dồn** qua từng bước | thống kê cho cột join, viết lại query gộp, đổi thứ tự join |

- Tăng {{default_statistics_target}} (100 → 500) cho bảng truy vấn đa dạng: histogram dày hơn nhưng {{ANALYZE}} lâu hơn và catalog to hơn – chỉ làm cho vài bảng nóng.
- {{CREATE STATISTICS st_pair (dependencies, ndistinct) ON status, amount FROM sales;}} (kinds ra mắt là {{dependencies}} và {{ndistinct}} từ PostgreSQL 10, {{mcv}} từ PostgreSQL 12) cho tổ hợp cột hay xuất hiện cùng nhau, rồi {{ANALYZE sales;}} để planner đọc lại.
- Xem nhanh thống kê: {{SELECT attname, n_distinct, most_common_vals FROM pg_stats WHERE tablename = 'sales';}}

### Ước sai có nhất dẫn đến plan sai?
Không hẳn. Cost cũng được tính trên chính ước lượng đó, nên planner vẫn chọn "plan tốt nhất **theo mô hình của nó**". Vấn đề là estimate lệch lớn ⇒ plan tốt với dữ liệu giả định, đến khi dữ liệu thật đổi thì sập. Chỉ xử lý khi đồng thời thấy: lệch mạnh ở node quan trọng **và** thời gian thực tế cao.

### Pitfall production
- Chạy {{ANALYZE}} giữa chừng bulk insert ⇒ thống kê nửa vời, plan "nửa vời" theo.
- Tăng statistics target cho toàn bộ database ⇒ catalog phình, planning time tăng không đáng có.
- Sau khi đổi index hay thêm trigger, plan có thể đổi dù câu SQL không đổi – luôn đo lại sau mỗi thay đổi hạ tầng.

> Senior tip: tôi chẩn đoán theo thứ tự: (1) so {{rows}} ước với {{actual}} ở node gốc; (2) mở {{pg_stats}} của các cột trong WHERE – có MCV không, {{n_distinct}} bao nhiêu, tương quan ra sao; (3) thử {{CREATE STATISTICS}} cho cặp cột hay đi kèm rồi {{ANALYZE}}. Khoảng 70% ca lệch estimate lớn tôi gặp là do cột tương quan hoặc giá trị hiếm, chứ không phải do "statistics cũ".`,
  follow: [
    '{{CREATE STATISTICS}} thay đổi plan của planner như thế nào sau {{ANALYZE}}?',
    'Generic plan và custom plan khác nhau ra sao và chỉnh bằng tham số nào?'
  ],
  tags: ['EXPLAIN', 'statistics', 'estimate', 'pg_stats', 'ANALYZE', 'query optimization'],
},
{
  id: 'sql-018',
  topic: 'sql',
  level: 'senior',
  q: 'Bảng {{message(id, thread_id, recipient_id, is_read, created_at, preview)}} hàng trăm triệu dòng với hai query hot: inbox của một user chỉ lấy tin **chưa đọc**, và báo cáo theo thread chỉ cần {{thread_id}} + {{created_at}}. Bạn thiết kế index nào, {{partial index}} và {{covering index (INCLUDE)}} hoạt động thế nào, vì sao query bind parameter không dùng được partial index, và kiểm chứng ra sao?',
  a: `**Tóm tắt:** Query (1) chỉ chạm khoảng 1% dòng tin chưa đọc ⇒ **partial index** (index chỉ chứa dòng thoả {{WHERE is_read = false}}) vừa nhỏ vừa đúng mục đích. Query (2) chỉ cần hai cột ⇒ **covering index** với {{INCLUDE (created_at)}} để chạy {{Index Only Scan}}, không cần chạm bảng.

### Index đề xuất
~~~sql
-- (1) inbox chưa đọc của một user
CREATE INDEX CONCURRENTLY idx_msg_unread
  ON message (recipient_id, created_at DESC)
  WHERE is_read = false;

-- (2) báo cáo theo thread, chỉ cần thread_id + created_at
CREATE INDEX CONCURRENTLY idx_msg_thread_cover
  ON message (thread_id) INCLUDE (created_at);
~~~

### Partial index hoạt động thế nào
- Index chỉ lưu những dòng khớp predicate **tại thời điểm build** (và các dòng mới được chèn thêm khi match). Nếu 98% tin đã đọc thì index chỉ cỡ 2–5% bảng ⇒ tốn ít RAM, ít lần đọc trang, và ghi cũng rẻ hơn index full.
- Planner dùng được chỉ khi **WHERE của query bào hàm được predicate của index**:
  - {{WHERE recipient_id = $1 AND is_read = false}} → đúng, dùng được.
  - {{WHERE recipient_id = $1 AND is_read = $2}} với {{is_read = false}}: ở **generic plan** planner không biết giá trị của {{is_read}} ⇒ không chứng minh được ⇒ **bỏ qua index**; custom plan (vài lần chạy đầu với giá trị cụ thể) thì có thể dùng.
  - Thực tế: giữ predicate là **hằng số trong SQL** (viết {{is_read = false}} trực tiếp) dù phần còn lại vẫn bind tham số.
- {{is_read}} nằm trong predicate nên không cần làm cột khóa; cột khóa đầu tiên phải là {{recipient_id}} vì hầu hết query đều theo user.

### Covering index và Index Only Scan
- {{INCLUDE (created_at)}} đặt cột **phụ** vào lá index: không tham gia seek (không làm đổi bài toán chọn key) nhưng cho phép trả lời query hoàn toàn từ index.
- Điều kiện còn lại là **visibility map**: planner chỉ chắc không cần heap khi mọi trang liên quan đã được {{VACUUM}} đánh dấu visible ⇒ xem {{Heap Fetches}} trong plan.
- Không cover cột lớn như {{preview}} hay cột {{jsonb}} chứa JSON dài – index phình thì mọi {{INSERT}}/{{UPDATE}} trên bảng hot đều mang theo gánh nặng đó.

### Kiểm chứng
~~~sql
EXPLAIN (ANALYZE, BUFFERS)
SELECT thread_id, created_at FROM message
WHERE thread_id = 42 ORDER BY created_at DESC LIMIT 50;
-- mong đợi: Index Only Scan using idx_msg_thread_cover ... Heap Fetches: 0
~~~
- Lượt dùng index: {{SELECT relname, idx_scan FROM pg_stat_user_indexes WHERE relname = 'message';}} – {{idx_scan}} đứng yên ở 0 kéo dài thì index đó nên bị drop.
- Trước/sau: so {{actual time}}, {{Buffers}} của query đọc **và** độ trễ ghi (INSERT/UPDATE) trên bảng ghi nhiều.

### Pitfall production
- Partial index bị bỏ qua khi WHERE của query không **bào hàm** được predicate của index: {{WHERE is_read = false OR recipient_id = $1}}, {{WHERE COALESCE(is_read, false) = false}}… planner không chứng minh được ⇒ đành quét full.
- Chưa {{ANALYZE}} sau khi tạo partial index ⇒ planner ước số dòng trong index sai, vẫn chọn seq scan.
- {{CREATE INDEX}} khoá ghi; bảng đang chạy phải dùng {{CONCURRENTLY}} (chạy nền, không khoá) – đổi lại, nếu bị ngắt nó để lại index INVALID phải drop và làm lại.
- Covering index thay được {{SELECT *}} cho cột đã cover, **không** thay được cột filter/orderBy không có trong index.

> Senior tip: "inbox chưa đọc của một user chậm" là câu kinh điển. Câu trả lời mạnh gồm hai phần: partial index trên {{(recipient_id, created_at)}} {{WHERE is_read = false}} – nhỏ gấp vài chục lần; và giải thích được **vì sao query bind parameter lại không dùng được partial index**. Chi tiết thứ hai mới là thứ tách người từng dùng index khỏi người từng debug plan.`,
  follow: [
    '{{INCLUDE}} khác gì cột thường trong composite index, khi nào chọn cái nào?',
    'Khi predicate của partial index là giá trị người dùng chọn (vd theo tenant) thì xử lý ra sao?'
  ],
  tags: ['partial index', 'covering index', 'INCLUDE', 'index-only scan', 'visibility map'],
},
{
  id: 'sql-019',
  topic: 'sql',
  level: 'senior',
  q: 'Bảng {{app_session(user_id, start_ts, end_ts)}} ghi phiên dùng app; các phiên **có thể chồng lên nhau** (nhiều thiết bị, client gửi sai thứ tự). Cần gộp các khoảng chồng lấp thành phiên thống nhất cho mỗi user ({{MIN(start_ts)}}, {{MAX(end_ts)}}) rồi tính tổng thời gian online. Viết query thế nào, và nó khác gì so với gaps-and-islands cho chuỗi ngày liên tiếp?',
  a: `**Tóm tắt:** Với khoảng **chồng lấp** thì mẹo {{ngày - row_number}} không dùng được. Thay vào đó dùng **island marker bằng max tích luỹ**: nếu {{start_ts}} của dòng hiện tại vượt quá {{MAX(end_ts)}} của **mọi dòng trước nó** thì mở đảo mới, ngược lại gộp vào đảo đang mở. Cộng cờ rồi {{SUM}} tích luỹ thành số đảo ({{grp}}), cuối cùng {{GROUP BY user_id, grp}}.

### Query (PostgreSQL)
~~~sql
WITH seq AS (
  SELECT s.user_id, s.start_ts, s.end_ts,
         -- max end_ts của MỌI dòng đứng trước (frame loại dòng hiện tại)
         MAX(s.end_ts) OVER (
           PARTITION BY s.user_id
           ORDER BY s.start_ts, s.end_ts
           ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING
         ) AS prev_max_end
  FROM app_session s
),
flagged AS (
  SELECT f.*,
         CASE WHEN f.prev_max_end IS NULL
                   OR f.start_ts > f.prev_max_end
              THEN 1 ELSE 0 END AS new_island
  FROM seq f
),
islands AS (
  SELECT g.*,
         SUM(g.new_island) OVER (
           PARTITION BY g.user_id ORDER BY g.start_ts, g.end_ts
           ROWS UNBOUNDED PRECEDING) AS grp
  FROM flagged g
)
SELECT user_id, grp,
       MIN(start_ts) AS session_start,
       MAX(end_ts)   AS session_end,
       -- duration của đảo gộp = bề rộng nửa mở [min start, max end)
       -- (KHÔNG cộng duration từng dòng – sẽ đếm đúp phần chồng)
       EXTRACT(EPOCH FROM (MAX(end_ts) - MIN(start_ts))) AS online_seconds
FROM islands
GROUP BY user_id, grp
ORDER BY user_id, session_start;
~~~

### Tại sao marker lại đúng
Giả sử ba phiên chồng nhau rồi một phiên rời: [1,10], [2,3], [5,6], [11,12].
| start | prev_max_end | start > prev_max_end | đảo |
|---|---|---|---|
| 1 | NULL | – | 1 (mở) |
| 2 | 10 | không | 1 (gộp) |
| 5 | 10 | không | 1 (gộp) |
| 11 | 10 | có | 2 (mở) |

{{prev_max_end}} là max **của mọi dòng trước**, nên khi một khoảng bắt đầu sau giá trị đó thì nó không chồng với bất kỳ khoảng nào đã thấy ⇒ bắt đầu đảo mới. Frame {{ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING}} là điểm then chốt: nó **loại dòng hiện tại** ra khỏi max, nếu không thì dòng nào cũng "trùng" với chính nó.

### So với gaps-and-islands chuỗi ngày liên tiếp
| | Streak ngày liên tiếp (câu sql-007) | Khoảng chồng lấp |
|---|---|---|
| Đầu vào | mốc ngày rời, không chồng | interval có thể chồng nhau |
| Grouping key | {{ngày - row_number}} | cờ {{start > max(end) trước đó}} |
| Vì sao dùng cách đó | mọi island cách đều đúng 1 đơn vị | độ dài và độ lệch đều bất kỳ |
| Hàm window chính | {{ROW_NUMBER}} | {{MAX(end_ts)}} với frame {{... AND 1 PRECEDING}} |

### Edge cases
- {{end_ts IS NULL}} (phiên đang mở): chuẩn hoá **trước** khi chạy window ({{COALESCE(end_ts, now())}} hoặc loại dòng), vì {{MAX}} của PostgreSQL bỏ qua NULL sẽ làm {{prev_max_end}} nhỏ sai.
- Client gửi {{start_ts > end_ts}}: lọc {{WHERE end_ts >= start_ts}} và báo cáo lỗi dữ liệu nguồn.
- Dòng trùng y hệt: {{SELECT DISTINCT}} hoặc unique index {{(user_id, start_ts)}}.
- **Cộng duration từng dòng là sai** vì phần chồng bị đếm 2 lần – phải gộp trước rồi mới cộng (đúng như query trên).
- Muốn gộp theo thiết bị thì thêm {{device_id}} vào {{PARTITION BY}}.

### Hiệu năng
- Index {{(user_id, start_ts, end_ts)}}: vừa phục vụ sort cho window (bỏ sort), vừa cover đủ cột cho {{Index Only Scan}}.
- Window buộc sort theo {{PARTITION BY}} + {{ORDER BY}}; với hàng trăm triệu phiên, hãy gộp theo ngày rồi merge, hoặc pre-compute phiên đã gộp vào bảng riêng.

> Senior tip: câu hỏi quan trọng nhất khi gặp "bài toán chuỗi liên tiếp" là **các khoảng có chồng nhau không**. Nếu có, mọi công thức {{date - row_number}} đều sai. Tôi luôn vẽ ba interval lên bảng trắng rồi tính {{max(end)}} tích luỹ để interviewer thấy mình nắm bản chất: island marker nghĩa là "đầu khoảng mới đã vượt quá bề rộng mình từng thấy".`,
  follow: [
    'Nếu {{end_ts}} có thể NULL thì sửa query thế nào?',
    'Làm sao tính thời gian online theo **ngày** khi một phiên rơi sang nửa đêm?'
  ],
  tags: ['gaps and islands', 'sessionization', 'overlapping intervals', 'window function', 'frame'],
},
{
  id: 'sql-020',
  topic: 'sql',
  level: 'senior',
  q: 'Bảng {{sales(region, product, sale_date, amount)}}: phòng kinh doanh cần báo cáo gồm tổng theo {{(region, product)}}, tổng theo {{region}}, tổng theo {{product}} và tổng cộng – tất cả trong **một** lần quét thay vì bốn câu {{UNION ALL}}. Bạn viết thế nào, {{GROUPING()}} dùng để làm gì, và {{ROLLUP}} khác {{GROUPING SETS}}/{{CUBE}} ra sao?',
  a: `**Tóm tắt:** Dùng {{GROUP BY GROUPING SETS (...)}}, {{ROLLUP}} hoặc {{CUBE}} – planner gom **nhiều cấp tổng hợp vào một lần đọc dữ liệu**, thay vì quét bốn lần. Cột nào bị gộp thì giá trị là NULL ⇒ phân biệt NULL "tổng" với NULL thật bằng {{GROUPING(col)}}.

### Query
~~~sql
SELECT CASE WHEN GROUPING(region)  = 1 THEN 'Tất cả' ELSE region  END AS region_label,
       CASE WHEN GROUPING(product) = 1 THEN 'Tất cả' ELSE product END AS product_label,
       GROUPING(region)  AS g_region,
       GROUPING(product) AS g_product,
       SUM(amount) AS amount
FROM sales
WHERE sale_date >= DATE '2026-01-01'
GROUP BY GROUPING SETS (
  (region, product),   -- chi tiết
  (region),            -- tổng theo region
  (product),           -- tổng theo product
  ()                   -- tổng cộng
)
ORDER BY region_label, product_label;
~~~
Bốn cấp số liệu trong **một** câu, điều kiện lọc {{sale_date}} viết một lần. Cách cũ là 4 câu {{UNION ALL}}: điều kiện lặp 4 lần, code dài, planner cũng phải đọc/aggregate nhiều lượt.

### ROLLUP, CUBE và GROUPING SETS
| Cú pháp | Các cấp sinh ra | Số nhóm với n cột |
|---|---|---|
| {{GROUPING SETS ((a,b),(a),())}} | đúng theo danh sách bạn liệt kê | theo liệt kê |
| {{ROLLUP(a, b)}} | {{((a,b), (a), ())}} – tổng **phân cấp** từ trái sang phải | n + 1 |
| {{CUBE(a, b)}} | mọi tổ hợp: {{(a,b), (a), (b), ()}} | 2^n |
- {{ROLLUP(region, product)}} có cấp {{(region)}} nhưng **không** có cấp {{(product)}} – đó chính là khác biệt lớn nhất với {{CUBE}}.
- {{GROUPING(region, product)}} trả về bitmask của các cột **bị** gộp, với bit thấp nhất ứng với cột&nbsp;**cuối cùng** của danh sách ({{product}}): 0 = cả hai có mặt (dòng chi tiết), 1 = {{product}} bị gộp (dòng tổng theo {{region}}), 2 = {{region}} bị gộp (dòng tổng theo {{product}}), 3 = cả hai bị gộp (tổng cộng).
- Hỗ trợ: PostgreSQL/Oracle có cả ba; MySQL 8 có {{WITH ROLLUP}} và {{GROUPING()}} nhưng **không** có {{CUBE}}/{{GROUPING SETS}}.

### Hiệu năng và giới hạn
- Xem trong {{EXPLAIN}}: dữ liệu được đọc **một lần** rồi nuôi các cấp aggregate (planner có thể chạy {{GroupAggregate}} nhiều lần trên cùng thứ tự sort, hoặc dùng {{HashAggregate}}), không phải quét bảng bốn lần như bốn câu {{UNION ALL}}.
- Dữ liệu lớn và báo cáo chạy giờ cao điểm: {{GROUPING SETS}} tiết kiệm code và một lần quét, **không** tiết kiệm I/O nếu mỗi ngày cần quét 500 triệu dòng ⇒ pre-aggregate theo ngày vào bảng tổng hợp / materialized view rồi union từ bảng nhỏ.
- {{CUBE}} với 6 cột sinh **64** grouping set ({{2^n}}) – chỉ dùng khi thật sự cần mọi chiều.

### Pitfall production
- **NULL thật vs NULL tổng**: không có {{GROUPING()}} thì không phân biệt được "khách không rõ vùng" với "dòng tổng của cả vùng" – lỗi số liệu kinh điển khi xuất JSON thẳng cho frontend.
- {{ORDER BY}} sau {{GROUP BY}}: dùng cột {{GROUPING(...)}} để đặt nhóm chi tiết trước dòng tổng, đừng sort theo label nếu label đã bị thay bằng "Tất cả".
- Nhầm {{ROLLUP}} hai chiều: muốn tổng theo {{product}} riêng lẻ thì phải viết {{GROUPING SETS}} hoặc {{CUBE}}, {{ROLLUP(region, product)}} không sinh ra.
- Query báo cáo không có {{WHERE}} ngày trên bảng lịch sử ⇒ quét toàn bộ dữ liệu dù planner có aggregate giỏi đến đâu.

> Senior tip: khi khách hỏi "cho tôi tổng theo vùng và tổng cộng trong một câu", tôi viết ngay {{GROUPING SETS}} kèm {{CASE WHEN GROUPING(x) = 1}} rồi nói thêm giới hạn của nó: "câu này tiết kiệm code và một lần quét; với bảng 500 triệu dòng/ngày tôi sẽ tách bảng tổng hợp". Phỏng vấn senior/lead thích nghe bạn nêu được **giới hạn** của giải pháp, không chỉ cú pháp.`,
  follow: [
    '{{CUBE}} với 6 cột sinh ra bao nhiêu nhóm, có nên dùng không?',
    'Làm sao phân biệt NULL thật với NULL do {{ROLLUP}} sinh ra khi trả JSON cho frontend?'
  ],
  tags: ['ROLLUP', 'GROUPING SETS', 'CUBE', 'GROUPING()', 'reporting', 'aggregate'],
},
{
  id: 'sql-021',
  topic: 'sql',
  level: 'lead',
  q: 'Bạn viết query có nhiều {{WITH}} (CTE) và thấy nó chậm hẳn so với cách viết bằng subquery; trường hợp khác thì CTE lại nhanh hơn. Giải thích PostgreSQL xử lý {{WITH}} trong planner thế nào – optimization fence, inline từ bản 12, {{MATERIALIZED}}/{{NOT MATERIALIZED}} – và khi nào bạn chủ động ép hay không ép, đặc biệt với CTE tham chiếu hai lần hay chứa aggregate nặng.',
  a: `**Tóm tắt:** Trước PostgreSQL 12, **mọi CTE là optimization fence**: planner không nhìn vào bên trong, thực thi đúng một lần, lưu kết quả (materialized) rồi dùng lại. Từ PostgreSQL 12, planner **được phép inline** CTE thành subquery (giống viết lồng) nếu nó chỉ được tham chiếu một lần và là SELECT thuần ⇒ điều kiện lọc của query ngoài đẩy được vào trong, planner tự do chọn join order. {{MATERIALIZED}} / {{NOT MATERIALIZED}} là công tắc bắt buộc ép planner theo ý bạn.

### Quy tắc inline từ PostgreSQL 12
CTE được inline khi **đủ mọi** điều kiện sau:
1. Không phải {{WITH RECURSIVE}}.
2. Được tham chiếu **đúng một lần** ở query cha (hai lần thì planner materialize để không tính lại).
3. **Không có side-effect**: là SELECT không chứa hàm volatile, và không chứa câu ghi dữ liệu ({{WITH x AS (INSERT ... RETURNING ...)}} luôn được thực thi riêng đúng một lần).
4. Bạn không ghi {{MATERIALIZED}}.

### Khi nào giữ CTE materialized
- CTE tham chiếu **hai lần** (join hai nhánh): planner tự materialize, tính một lần rồi dùng lại – đây là công dụng "thực sự" của CTE, và trước PostgreSQL 12 mọi CTE đều như vậy.
- Ép {{MATERIALIZED}} khi bạn muốn **chốt hành vi**: CTE chứa việc tính tốn kém ({{DISTINCT}}, aggregate, window trên tập lớn) và bạn không muốn nâng cấp hay đổi statistics làm nó bị lồng/tính lại – mục tiêu là plan **ổn định**, không phải nhanh hơn.
- Trung thực một điểm: CTE chỉ tham chiếu một lần mà chủ yếu là lớp lọc thì materialize thường **chậm hơn**, vì planner không đẩy được điều kiện của query ngoài vào trong.

### Khi nào nên để planner inline
- CTE chỉ là **lớp đặt tên** cho phần lọc/sắp xếp phức tạp, rồi query ngoài thêm điều kiện nữa ⇒ inline cho planner gộp điều kiện và chọn join order tốt hơn.
- Viết {{NOT MATERIALIZED}} để ép inline kể cả khi CTE tham chiếu hai lần: planner có thể đẩy điều kiện vào từng chỗ dùng (ví dụ CTE join với chính nó) – đổi lại có thể tính CTE nhiều lần, nên chỉ làm khi đã đo thấy lợi.
- Đừng mặc định coi CTE là "nhanh hơn subquery": cả hai chỉ là **cấu trúc code**; điểm khác thật sự nằm ở fence và inline.

### Cách kiểm chứng
~~~sql
EXPLAIN (ANALYZE, BUFFERS) WITH x AS (...) SELECT ...;
-- CTE Scan on x        -> đã materialize (tính một lần, lưu tạm)
-- node bên trong hiện thẳng (vd Seq Scan) và điều kiện ngoài được
--   đẩy vào trong, không còn CTE Scan  -> đã inline
~~~
- Chạy cả hai cách viết và so node, {{actual rows}} của CTE, cùng {{Planning Time}} – CTE lồng sâu làm planning lâu hơn.
- Với ORM (Hibernate/JPA) hay sinh {{WITH}} tham chiếu hai lần ⇒ luôn materialized; đừng giả định nó sẽ inline.

### Pitfall production
- **Nâng cấp PostgreSQL 12+ làm plan đổi**: query cũ có thể nhanh hơn hoặc chậm hơn dù SQL không đổi. Sau nâng cấp phải đo lại các query trọng yếu.
- Ép {{MATERIALIZED}} sai chỗ: planner phải tính toàn bộ tập con dù query ngoài chỉ cần 1% ⇒ tốn CPU và RAM (CTE materialized nằm trong work_mem, lớn thì spill ra đĩa).
- CTE tham chiếu 2 lần + tập kết quả lớn: nhân mức tiêu thụ bộ nhớ; cân nhắc viết lại thành join với tập đã lọc.
- Plan không ổn định còn do generic/custom plan và statistics – phải loại từng nguyên nhân, đừng đổ lỗi cho CTE ngay.

> Senior tip: nguyên tắc của tôi là "CTE là công cụ **đọc code**, không phải công cụ tối ưu". Tôi viết CTE cho rõ ràng rồi đo bằng {{EXPLAIN (ANALYZE)}}; khi plan bị đổi sau nâng cấp hoặc ước lượng sai, tôi dùng {{MATERIALIZED}}/{{NOT MATERIALIZED}} để chốt hành vi và ghi chú **lý do** ngay trong SQL. Khi trao đổi với interviewer, câu trả lời ấn tượng là: "từ PostgreSQL 12 CTE không còn là fence mặc định, nên tôi luôn nhìn node {{CTE Scan}} hay {{Subquery Scan}} trong plan trước khi kết luận".`,
  follow: [
    'Làm sao kiểm tra CTE của bạn đã được inline hay chưa?',
    'Vì sao CTE tham chiếu hai lần khiến planner materialize?'
  ],
  tags: ['CTE', 'optimization fence', 'MATERIALIZED', 'PostgreSQL', 'query planner'],
},
{
  id: 'sql-022',
  topic: 'sql',
  level: 'lead',
  q: 'Báo cáo trên bảng 400 triệu dòng của bạn luôn chạy bằng một worker duy nhất dù máy còn nhiều core rảnh. Giải thích PostgreSQL quyết định chạy song song thế nào (mô hình chi phí, node {{Gather}}), những điều kiện planner không thể chạy song song, bạn chỉnh gì – và khi nào thì **không** nên ép song song.',
  a: `**Tóm tắt:** Parallel query là **cost-based**, không phải công tắc bật/tắt: planner tính chi phí cho phương án chia việc ({{parallel_setup_cost}} + {{parallel_tuple_cost}} + lợi ích chia nhỏ bước quét) rồi so với phương án tuần tự. Chọn song song thì plan có node {{Gather}} (hoặc {{Gather Merge}} khi phải gộp kết quả theo thứ tự). Số core rảnh **không tự nhiên** làm plan song song – nếu bạn thấy một worker duy nhất thì hoặc chi phí không đủ, hoặc có điều kiện cấm parallel.

### Plan song song trông thế nào
~~~sql
Gather  (cost=1000.00..412000.00 rows=3800000 width=48)
             (actual time=84.2..1210.5 rows=3760000 loops=1)
  Workers Planned: 2
  Workers Launched: 2
  -> Parallel Seq Scan on sales (cost=0.00..411000.00 rows=...)
~~~
- {{Workers Planned}} / {{Workers Launched}}: số worker dự kiến và **đã chạy thật**.
- {{Gather Merge}}: gộp output từ nhiều worker mà vẫn giữ đúng thứ tự, dùng khi phía trên có {{ORDER BY}}/{{LIMIT}}.
- Worker là process riêng đọc chung snapshot; có chi phí spawn + giao tiếp nên query nhỏ luôn rẻ hơn khi chạy tuần tự.

### Điều kiện và tham số quyết định
| Yếu tố | Chi tiết |
|---|---|
| Chi phí | {{parallel_setup_cost}} (mặc định 1000), {{parallel_tuple_cost}} (0,1); bảng phải lớn hơn {{min_parallel_table_scan_size}} (8MB) |
| Node trong parallel portion | {{Parallel Seq Scan}}, {{Parallel Bitmap Heap Scan}}, {{Parallel Index Scan}} (chỉ btree), {{Parallel Hash Join}}; aggregate chia {{Partial Aggregate}} rồi {{Finalize Aggregate}} trên leader |
| GUC | {{max_parallel_workers_per_gather}} = 2, {{max_parallel_workers}} = 8, {{max_worker_processes}} = 8 (dùng chung cho mọi backend) |
| Hàm tuỳ chỉnh | mặc định là {{PARALLEL UNSAFE}} ⇒ planner phải chạy tuần tự; chỉ đánh dấu {{PARALLEL SAFE}} khi chắc chắn an toàn |
| Câu ghi dữ liệu hoặc khoá dòng | {{UPDATE}}/{{DELETE}}, câu có {{FOR UPDATE}}/{{FOR SHARE}}, hoặc CTE chứa câu ghi dữ liệu ⇒ không sinh plan song song |
| Aggregate có {{DISTINCT}}/{{ORDER BY}}, ordered-set aggregate, {{GROUPING SETS}} | không chia được bước aggregate (không có partial aggregate), dù phần quét vẫn có thể song song |
| Bảng nhỏ / {{LIMIT 5}} | chi phí setup worker đắt hơn lợi ích thu được |

- Plan song song nhưng **không lấy được worker** lúc chạy (hết {{max_worker_processes}}/{{max_parallel_workers}}) thì leader tự chạy phần dưới {{Gather}}: kết quả vẫn đúng mà bạn không được lợi gì.
- Override theo bảng khi bạn **đã đo**: {{ALTER TABLE sales SET (parallel_workers = 4);}}.
- Thúc planner dùng parallel hơn bằng cách giảm cost ({{SET parallel_setup_cost = 250;}}) – nhưng đó là can thiệp, phải kèm bằng chứng đo lường.

### Khi nào **không** nên ép song song
- Query trả vài nghìn dòng và đã chạy dưới ~100ms: overhead spawn + {{Gather}} có thể ăn hết phần lợi ích.
- Đĩa chậm hoặc IOPS có hạn: nhiều worker cùng đọc làm **nội tranh** I/O, tổng thời gian tệ hơn.
- **Oversubscription**: 32 connection mỗi câu spawn 4 worker trên 8 core ⇒ hàng trăm process tranh CPU/đĩa, p99 tăng. Đây là tai nạn tôi thấy nhiều nhất khi team "bật parallel cho mọi thứ".

### Quy trình làm việc
1. {{EXPLAIN (ANALYZE, BUFFERS)}}: có node {{Gather}} không, {{Workers Launched}} bao nhiêu, thời gian node gốc là bao nhiêu.
2. Thử có kiểm soát: {{SET max_parallel_workers_per_gather = 4;}} rồi so {{actual time}}; không tốt hơn thì trả về mặc định, và xem {{pg_stat_activity}} để biết bao nhiêu worker đang chạy song song.
3. Nếu query chậm vì quét **quá nhiều dòng** thì parallel chỉ chia nỗi khổ – hướng đúng là thu hẹp dữ liệu: filter đúng cột, partition pruning, index, pre-aggregate.

> Senior tip: "nhiều core rảnh" chưa bao giờ là lý do để ép parallel. Tôi từng chứng kiến đội hạ tầng đặt chi phí parallel về 0 cho hệ 32 connection trên 8 core ⇒ mỗi câu bung worker, tổng process vượt sức máy, p99 chậm gấp đôi. Nguyên tắc của tôi: đo bằng {{EXPLAIN (ANALYZE)}}, theo dõi số worker chạy đồng thời, và nhớ rằng parallel query là **thuật toán chia việc** chứ không phải đòn bẩy tăng tốc tất yếu.`,
  follow: [
    '{{Gather}} và {{Gather Merge}} khác nhau khi nào, vì sao cần bản merge?',
    'Khi nào thì việc đánh dấu hàm {{PARALLEL SAFE}} là sai lầm?'
  ],
  tags: ['parallel query', 'Gather', 'PostgreSQL', 'performance', 'planner'],
}
);
