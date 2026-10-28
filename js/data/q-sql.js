/* Câu hỏi topic `sql`. Schema & markup: AGENTS.md mục 4–6. */
(window.QUESTIONS = window.QUESTIONS || []).push(
{
  id: 'sql-001',
  topic: 'sql',
  level: 'senior',
  q: 'Bảng employee(id, full_name, dept_id, salary): cần tìm người có mức lương cao thứ 2 trong mỗi phòng ban (nếu có nhiều người cùng mức lương thì lấy hết). Bạn viết SQL thế nào? DENSE_RANK, RANK và ROW_NUMBER khác nhau ra sao?',
  a: `**Tóm tắt:** Dùng window function {{DENSE_RANK() OVER (PARTITION BY dept_id ORDER BY salary DESC)}} rồi lọc {{rank = 2}} ở **lớp ngoài**. {{DENSE_RANK}} xếp hạng **theo giá trị** nên hai người cùng lương vẫn cùng hạng – đúng nghĩa "mức lương thứ 2". {{RANK}} nhảy số (1, 1, 3) nên nếu có hai người cùng lương cao nhất thì **không tồn tại hạng 2**. {{ROW_NUMBER}} luôn cho 1, 2, 3… không trùng, nên lấy đúng một người mỗi phòng ban.

### Hiểu nhanh
Hãy tưởng tượng mỗi phòng ban là một lớp học, và cô giáo xếp hạng học sinh theo điểm từ cao xuống thấp. Window function giống như việc cô **ghi thêm cột "hạng" vào sổ điểm** mà **không gộp** học sinh lại (khác GROUP BY, vốn gộp cả lớp thành một dòng). {{PARTITION BY dept_id}} nghĩa là "mỗi lớp xếp hạng riêng", {{ORDER BY salary DESC}} là "điểm cao đứng trước". Khi hai bạn cùng 9 điểm, cách xếp "đồng hạng nhất, bạn 8 điểm hạng nhì" chính là DENSE_RANK; cách "đồng hạng nhất, bạn 8 điểm hạng ba" là RANK; còn "bắt buộc mỗi bạn một số khác nhau" là ROW_NUMBER.

### Thuật ngữ
- **Window function**: hàm tính toán trên một "cửa sổ" các dòng liên quan nhưng vẫn giữ nguyên từng dòng trong kết quả.
- **PARTITION BY**: chia dữ liệu thành các nhóm độc lập; hạng được đánh lại từ 1 ở mỗi nhóm.
- **CTE (WITH … AS)**: một "bảng tạm có tên" chỉ sống trong câu query, giúp chia query thành các bước dễ đọc.
- **Tie-break**: cột phụ trong ORDER BY để phân định thứ tự khi giá trị chính bằng nhau.
- **NULLS LAST**: chỉ thị đặt các dòng NULL xuống cuối khi sắp xếp.
- **Index-only scan**: DB trả kết quả chỉ bằng cách đọc index, không phải đọc bảng.

### Vì sao phải lọc ở lớp ngoài
Window function **không** được phép xuất hiện trong {{WHERE}} (PostgreSQL báo "window functions are not allowed in WHERE", MySQL báo "Invalid use of window function"). Thứ tự xử lý logic của một câu SELECT là: FROM → WHERE → GROUP BY → HAVING → **window functions** → SELECT → DISTINCT → ORDER BY → LIMIT. Vì window function chạy *sau* WHERE, muốn lọc theo kết quả của nó thì phải bọc trong subquery/CTE rồi lọc ở bên ngoài.

Cơ chế từng bước khi DB chạy câu mẫu bên dưới:
1. **Đọc và lọc dòng (FROM + WHERE)**: lấy các nhân viên có lương khác NULL. Vì sao trước: giảm số dòng phải sắp xếp ở bước sau.
2. **Chia nhóm theo phòng ban (PARTITION BY)**: DB sort (hoặc đọc index) theo {{dept_id, salary DESC}} để các dòng cùng phòng nằm cạnh nhau. Vì sao: hạng chỉ có nghĩa trong từng phòng.
3. **Gán hạng (DENSE_RANK)**: đi dọc từng nhóm, mỗi khi gặp **mức lương mới** thì tăng hạng thêm 1; gặp lương bằng dòng trước thì giữ nguyên hạng. Vì sao DENSE_RANK: hạng tính theo **giá trị**, không theo người.
4. **Lọc hạng 2 ở lớp ngoài**: lúc này cột {{salary_rank}} đã là một cột bình thường của CTE, nên WHERE bên ngoài dùng được.

~~~text
Phòng KT (sau khi sort salary DESC)
salary : 50   50   40   40   30
DENSE  :  1    1    2    2    3   <- lọc = 2 → lấy 2 người lương 40
RANK   :  1    1    3    3    5   <- không có hạng 2!
ROW_NUM:  1    2    3    4    5
~~~

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
- PostgreSQL coi NULL là **lớn hơn mọi giá trị khác**, nên {{ORDER BY salary DESC}} sẽ đẩy dòng lương NULL lên **đầu** ⇒ hạng 1 là người không lương. Luôn ghi rõ {{NULLS LAST}} (MySQL mặc định NULL nằm cuối khi DESC, nhưng MySQL **không hỗ trợ** cú pháp {{NULLS LAST}}; ở MySQL dùng {{ORDER BY salary IS NULL, salary DESC}} hoặc lọc {{salary IS NOT NULL}} như câu mẫu).
- Lương phải kiểu {{DECIMAL}}/{{NUMERIC}}, tuyệt đối không dùng {{FLOAT}} – so sánh {{0.1 + 0.2}} với {{0.3}} sẽ sai.

### Hiệu năng
Window function buộc DB **sort theo (dept_id, salary)**. Nên có index {{(dept_id, salary DESC)}} để phần sort không tốn I/O; nếu bảng chỉ cần vài cột thì có thể đạt index-only scan. Với câu lấy dữ liệu ở Java, dùng native query + projection interface để đỡ thao tác map tay.

### Lỗi hay gặp
1. **Chọn nhầm RANK khi nghiệp vụ là "lương thứ 2"**. Triệu chứng: báo cáo **rỗng** ở đúng những phòng có hai người cùng lương cao nhất, không báo lỗi gì nên rất dễ bị bỏ sót. Cách tránh: đọc kỹ nghiệp vụ ("mức" hay "người") và luôn test bằng dữ liệu có trùng lương.
2. **Viết DENSE_RANK() trong WHERE**. Triệu chứng: lỗi "window functions are not allowed in WHERE". Cách tránh: bọc CTE/subquery rồi lọc ở lớp ngoài.
3. **Quên xử lý NULL**. Triệu chứng: trên PostgreSQL người chưa có lương thành "hạng 1", nên "hạng 2" lại là người lương cao nhất. Cách tránh: {{WHERE salary IS NOT NULL}} hoặc {{NULLS LAST}}.
4. **Thiếu tie-break với ROW_NUMBER**. Triệu chứng: kết quả {{ROW_NUMBER}} đổi giữa hai lần chạy cùng dữ liệu. Cách tránh: luôn thêm cột khóa tăng dần, {{ORDER BY salary DESC, id}}.

Ngoài ra, query này quét toàn bộ bảng nhân sự mỗi lần mở báo cáo: nên cache theo ngày hoặc tính sẵn vào bảng tổng hợp.

### Trả lời miệng 1 phút
"Để lấy mức lương cao thứ hai mỗi phòng, tôi dùng window function DENSE_RANK, partition theo dept_id và order theo salary giảm dần. Vì window function được tính sau WHERE, tôi bọc nó trong một CTE rồi lọc hạng bằng 2 ở lớp ngoài. Tôi chọn DENSE_RANK vì nó xếp hạng theo giá trị: hai người cùng lương cao nhất cùng hạng 1, người kế tiếp là hạng 2. RANK sẽ nhảy từ 1 sang 3 nên có thể ra báo cáo rỗng, còn ROW_NUMBER chỉ phù hợp khi cần đúng N người và phải có tie-break. Tôi cũng loại lương NULL và đặt index (dept_id, salary) để tránh sort lớn. Thực tế tôi từng thấy báo cáo rỗng âm thầm vì dùng RANK, nên giờ tôi luôn test với dữ liệu trùng giá trị."

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

### Hiểu nhanh
Giống như danh bạ điện thoại bị đồng bộ hai lần nên một người xuất hiện 3 lần. Bạn không xoá bừa: bạn **xếp các bản trùng của từng người thành hàng**, đánh số 1, 2, 3 theo thứ tự tạo (id nhỏ trước), rồi giữ số 1, xoá số 2 và 3. {{ROW_NUMBER}} chính là cái máy đánh số đó, còn {{PARTITION BY external_id}} là "mỗi người một hàng riêng". Sau khi dọn xong, bạn khoá danh bạ bằng quy tắc "mỗi số điện thoại chỉ được một mục" – đó là unique constraint.

### Thuật ngữ
- **external_id / khóa nghiệp vụ**: định danh do hệ thống nguồn cấp (mã giao dịch ngân hàng), khác với {{id}} tự tăng của bảng.
- **Derived table**: subquery đặt trong FROM, được DB coi như một bảng tạm.
- **Dead tuple**: phiên bản dòng cũ mà PostgreSQL giữ lại sau DELETE/UPDATE cho tới khi VACUUM dọn.
- **VACUUM**: tiến trình của PostgreSQL thu hồi chỗ của dead tuple.
- **Undo log / binlog**: nhật ký của MySQL để rollback và để replica sao chép thay đổi; xoá càng nhiều thì log càng phình.
- **ctid / ROWID**: địa chỉ vật lý của một dòng (trang + vị trí) trong PostgreSQL / Oracle.
- **Upsert**: một lệnh "chưa có thì INSERT, có rồi thì UPDATE hoặc bỏ qua".
- **Idempotent**: chạy một thao tác 1 lần hay 10 lần đều cho cùng kết quả.

### Cơ chế từng bước
1. **Đo trước**: đếm số dòng sẽ xoá (câu SELECT bước 1 bên dưới). Vì sao: so với kỳ vọng nghiệp vụ, nếu con số lệch xa thì dừng lại trước khi mất dữ liệu.
2. **Đánh số trong mỗi nhóm trùng**: {{ROW_NUMBER() OVER (PARTITION BY external_id ORDER BY id)}}. Vì sao ORDER BY id: quy ước "giữ bản cũ nhất" phải xác định, chạy lại luôn ra cùng kết quả.
3. **Chọn dòng rn > 1 và xoá theo id**: DB nối kết quả đánh số với bảng gốc bằng {{id}} (khóa chính, có index) nên tìm dòng cần xoá rất nhanh.
4. **Xoá theo lô và commit từng lô**: vì sao: transaction ngắn thì lock ngắn, log nhỏ, replica không bị trễ.
5. **Thêm unique constraint**: vì sao: chỉ ràng buộc ở DB mới chặn được trùng lặp do hai luồng import chạy song song.

~~~text
external_id | id  | rn  | hành động
EXT-1       | 10  | 1   | giữ
EXT-1       | 57  | 2   | xoá
EXT-1       | 91  | 3   | xoá
EXT-2       | 11  | 1   | giữ   (không trùng, không bị đụng)
~~~

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
- Nếu dùng xoá mềm (cột {{deleted_at}}), unique index phải là **partial**: {{CREATE UNIQUE INDEX uk_ext_active ON transaction_import (external_id) WHERE deleted_at IS NULL;}} (PostgreSQL) – nếu không, lần import sau vẫn vi phạm. MySQL không có partial index; cách thay thế là unique trên một generated column (ví dụ cột bằng {{external_id}} khi chưa xoá, NULL khi đã xoá, vì unique index cho phép nhiều NULL).
- Cho import **idempotent** bằng upsert ({{INSERT … ON CONFLICT}}) chứ không phải cứ xoá rồi insert lại.
- Nếu bản ghi trùng đã được bảng khác tham chiếu (FK), phải xoá/xoá mềm ở bảng con trước, hoặc chuyển FK sang bản ghi được giữ lại.

### Lỗi hay gặp
1. **DELETE khi cột khóa chưa có index**. Triệu chứng: full scan, giữ row lock trên rất nhiều dòng trong thời gian dài (MySQL InnoDB còn khoá mọi dòng quét qua – gần như khoá cả bảng), API timeout lúc cao điểm. Cách tránh: kiểm tra plan bằng EXPLAIN, xoá theo {{id}} (khóa chính) và chia lô.
2. **Quên điều kiện phạm vi** (ví dụ chỉ xoá bản ghi tạo trong batch import hôm nay). Triệu chứng: xoá nhầm cả dữ liệu hợp lệ. Cách tránh: đếm trước, chạy thử trên **staging copy** có dữ liệu giống production và đối chiếu số dòng xoá trước khi commit; sao lưu các dòng sẽ xoá sang bảng backup.
3. **Một DELETE khổng lồ trên Oracle**. Triệu chứng: {{DELETE}} ghi cả redo/undo, undo không đủ chỗ dẫn tới {{ORA-01555}} ("snapshot too old") ở các query khác. Cách tránh: chia batch và theo dõi {{UNDO}}.
4. **Chỉ dọn mà không chặn gốc**. Triệu chứng: tuần sau lại có trùng. Cách tránh: unique constraint + upsert.

### Trả lời miệng 1 phút
"Tôi xử lý trùng lặp theo hai phần: dọn dữ liệu hiện tại và chặn tái phát. Để dọn, tôi dùng ROW_NUMBER partition theo external_id, order theo id, nên mỗi nhóm trùng có bản rn bằng 1 là bản cũ nhất; tôi xoá các dòng rn lớn hơn 1. Trên PostgreSQL tôi dùng DELETE USING, trên MySQL phải bọc thêm một derived table để tránh lỗi 1093. Tôi luôn đếm trước, chạy trên staging, rồi xoá theo lô vài nghìn dòng mỗi transaction để không giữ lock lâu và không làm phình dead tuple hay undo. Quan trọng nhất, tôi thêm unique constraint trên external_id và đổi luồng import sang upsert, vì nếu không lần import sau sẽ lại trùng."

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

### Hiểu nhanh
Bạn là quản lý quán cà phê, cầm danh sách hội viên và muốn biết ai **chưa từng mua gì**. Cách NOT EXISTS: với từng hội viên, lật sổ bán hàng và hỏi "có tờ hoá đơn nào mang tên người này không?" – thấy một tờ là dừng, chuyển người khác. Cách NOT IN: bạn chép ra một danh sách "tên trên mọi hoá đơn" rồi so; nhưng nếu có một hoá đơn **bị nhoè tên** (NULL), bạn không dám khẳng định ai "chắc chắn không có trong danh sách" nữa, nên SQL trả về không ai cả. Cách LEFT JOIN giống việc ghim mọi hoá đơn vào thẻ hội viên rồi lấy những thẻ không có hoá đơn nào.

### Thuật ngữ
- **Anti-join**: phép nối lấy các dòng bên trái **không có** dòng khớp bên phải.
- **Semi-join**: phép nối lấy các dòng bên trái **có ít nhất một** dòng khớp, mỗi dòng trái chỉ ra một lần ({{EXISTS}}).
- **Three-valued logic**: logic ba giá trị TRUE / FALSE / UNKNOWN của SQL, sinh ra khi so sánh với NULL.
- **Row explosion (nhân dòng)**: join một-nhiều khiến một dòng cha bị lặp nhiều lần.
- **Hashed SubPlan**: kế hoạch PostgreSQL nạp kết quả subquery vào bảng băm trong bộ nhớ để tra.
- **work_mem**: lượng RAM tối đa PostgreSQL cho một thao tác sort/hash trước khi phải dùng đĩa.
- **Nested Loop / Hash Anti Join**: hai thuật toán nối; nested loop tra index cho từng dòng, hash dựng bảng băm một lần.

### Cơ chế từng bước của NOT EXISTS
1. DB đọc lần lượt từng khách trong {{customers}}. Vì sao: đây là tập ta muốn lọc.
2. Với mỗi khách, tra index {{orders(customer_id, created_at)}} tìm **một** đơn khớp. Vì sao chỉ một: EXISTS chỉ cần biết có/không, nên dừng ngay ở dòng đầu.
3. Nếu không tìm thấy, điều kiện NOT EXISTS là TRUE và khách được giữ. Điều kiện EXISTS chỉ trả TRUE/FALSE, **không bao giờ UNKNOWN**, nên NULL không phá được kết quả.
4. Với bảng lớn, optimizer có thể đổi sang Hash Anti Join: băm toàn bộ {{orders.customer_id}} một lần rồi dò. Vì sao: rẻ hơn khi phần lớn khách phải kiểm tra.

~~~text
customers        orders.customer_id = {1, 2, NULL}
id=1  → NOT EXISTS? có đơn       → loại
id=3  → NOT EXISTS? không có đơn → GIỮ
NOT IN với id=3: 3<>1 TRUE, 3<>2 TRUE, 3<>NULL UNKNOWN
               → TRUE AND TRUE AND UNKNOWN = UNKNOWN → LOẠI (sai!)
~~~

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

### Lỗi hay gặp
1. **Đặt điều kiện thời gian sai chỗ**. Triệu chứng: với LEFT JOIN, viết {{WHERE o.created_at >= ...}} ở ngoài làm mất đúng những khách hàng ta muốn tìm (dòng NULL bị loại). Cách tránh: điều kiện thời gian phải nằm **bên trong** subquery của NOT EXISTS, hoặc trong {{ON}} của LEFT JOIN.
2. **NOT IN với cột nullable**. Triệu chứng: {{NOT IN}} với danh sách id lấy từ bảng khác có cột nullable (ví dụ bảng blacklist) ⇒ mất sạch kết quả mà **không báo lỗi**, rất khó phát hiện. Cách tránh: dùng NOT EXISTS; khi thấy query trả về 0 dòng bất thường, hãy kiểm tra NULL trước.
3. **NOT IN với danh sách rất lớn**. Triệu chứng: danh sách chặn hàng nghìn id truyền từ Java làm câu SQL dài, plan chậm. Cách tránh: đưa vào bảng tạm rồi anti-join (NOT EXISTS) thay vì {{NOT IN}}.
4. **Tin JPA sinh SQL tốt**. Triệu chứng: query chậm dù đã viết EXISTS trong JPQL. Cách tránh: bật log SQL và xem SQL thực sự được sinh ra cho {{@Query}} có {{EXISTS}}; với logic anti-join phức tạp, native query dễ kiểm soát hơn.

### Trả lời miệng 1 phút
"Để tìm khách chưa có giao dịch, tôi mặc định dùng NOT EXISTS. Đây là anti-join: với mỗi khách, DB chỉ cần biết có hay không một đơn khớp, nên dừng ở dòng đầu và tận dụng index trên customer_id. NOT IN thì nguy hiểm vì logic ba giá trị: chỉ cần subquery trả về một NULL, phép so sánh với NULL ra UNKNOWN và cả câu trả về rỗng, mà không có lỗi nào. Trên PostgreSQL NOT IN còn không được chuyển thành anti-join nên dễ chậm. LEFT JOIN IS NULL cho cùng kết quả nhưng dễ nhân dòng khi join nhiều bảng con, và lọc sai chỗ là biến thành inner join. Tôi từng gặp báo cáo rỗng vì NOT IN trên bảng blacklist có NULL, từ đó tôi review mọi NOT IN với subquery."

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

### Hiểu nhanh
Hình dung bạn kiểm kê hoá đơn của cả năm. **WHERE** giống việc bạn bỏ ngay vào thùng rác những hoá đơn không thuộc tháng 3 **trước khi** chia vào các rổ theo khách. **GROUP BY** là bước chia hoá đơn vào từng rổ, mỗi khách một rổ, rồi cộng tiền mỗi rổ. **HAVING** là bước nhìn vào **tổng tiền trên nhãn mỗi rổ** và loại những rổ dưới 1 triệu. Bạn không thể hỏi "rổ này tổng bao nhiêu" khi còn đang lọc từng tờ hoá đơn (vì vậy aggregate không được nằm trong WHERE), và cũng thật phí công nếu chia hết hoá đơn cả năm vào rổ rồi mới vứt những tờ không phải tháng 3.

### Thuật ngữ
- **Aggregate function**: hàm gộp nhiều dòng thành một giá trị ({{SUM}}, {{COUNT}}, {{AVG}}, {{MIN}}, {{MAX}}).
- **Thứ tự logic**: thứ tự mà chuẩn SQL quy định để hiểu ý nghĩa câu lệnh, khác với thứ tự DB thực sự chạy.
- **ONLY_FULL_GROUP_BY**: chế độ của MySQL bắt mọi cột trong SELECT phải nằm trong GROUP BY hoặc được aggregate.
- **HashAggregate**: thuật toán gom nhóm bằng bảng băm trong RAM (PostgreSQL).
- **Semi-join**: phép nối chỉ kiểm tra "có tồn tại dòng khớp" ({{EXISTS}}).
- **Predicate pushdown**: optimizer đẩy điều kiện lọc xuống càng gần nguồn dữ liệu càng tốt.

### Cơ chế từng bước (thứ tự logic)
1. **FROM / JOIN**: dựng tập dòng nguồn. Vì sao đầu tiên: mọi bước sau đều làm việc trên tập này.
2. **WHERE**: lọc từng dòng; lúc này chưa có nhóm nên không dùng được aggregate.
3. **GROUP BY**: chia dòng vào nhóm; từ đây mỗi nhóm chỉ còn một dòng đại diện.
4. **HAVING**: lọc nhóm bằng aggregate. Vì sao sau GROUP BY: tổng chỉ tồn tại khi nhóm đã gom xong.
5. **Window functions**, rồi **SELECT** (tính biểu thức, đặt alias). Vì sao alias không dùng được trong WHERE: alias sinh ra ở bước này, sau WHERE.
6. **DISTINCT → ORDER BY → LIMIT**: định dạng kết quả cuối cùng; ORDER BY chạy sau SELECT nên dùng được alias.

~~~text
1.000.000 dòng orders cả năm
   │ WHERE tháng 3          → còn 85.000 dòng
   ▼
GROUP BY customer_id     → 12.000 nhóm (SUM từng nhóm)
   │ HAVING SUM > 1 triệu   → còn 900 nhóm
   ▼
SELECT / ORDER BY        → 900 dòng kết quả
(nếu lọc tháng ở HAVING: 1.000.000 dòng phải đi qua bước gom nhóm)
~~~

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

### Lỗi hay gặp
Những lỗi tôi đã phải sửa cho team; mỗi lỗi dưới đây đi kèm triệu chứng (thông báo lỗi hoặc số liệu sai) và cách sửa:
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
- Điểm dễ sai: {{DISTINCT}} được áp **trước** {{ORDER BY}} ⇒ {{SELECT DISTINCT a, b FROM t ORDER BY c}} là lỗi vì c không nằm trong danh sách chọn (PostgreSQL báo "for SELECT DISTINCT, ORDER BY expressions must appear in select list"; MySQL 5.7+ cũng báo lỗi 3065).

### Pitfall production (báo cáo và hiệu năng)
- GROUP BY theo cột có NULL: **mọi** dòng NULL được gom chung vào **một** nhóm (GROUP BY coi các NULL là "không phân biệt", dù {{NULL = NULL}} là UNKNOWN) ⇒ dùng {{COALESCE(col, 'CHƯA PHÂN LOẠI')}} để đặt nhãn dễ đọc cho nhóm đó.
- GROUP BY theo cột có **rất nhiều giá trị** (ví dụ {{transaction_id}}) là vô nghĩa và tốn bộ nhớ ⇒ đó là lúc nên dùng window function.
- Index trên cột GROUP BY giúp DB dùng index scan thay vì sort + hash ⇒ báo cáo tổng hợp theo cột phân loại nên có index.
- Báo cáo chạy định kỳ (cron) nên ghi kết quả vào bảng tổng hợp thay vì tính lại mỗi lần người dùng mở trang.

### Trả lời miệng 1 phút
"WHERE lọc từng dòng trước khi gom nhóm, còn HAVING lọc các nhóm sau khi đã tính aggregate. Thứ tự logic là FROM, WHERE, GROUP BY, HAVING, rồi mới đến window function, SELECT, DISTINCT, ORDER BY và LIMIT; vì vậy WHERE không dùng được SUM hay alias của SELECT. Quy tắc của tôi là điều kiện nào trên cột gốc thì đặt ở WHERE, vì nó giảm số dòng đi vào bước hash aggregate hoặc sort, còn HAVING chỉ dành cho điều kiện trên tổng. Lỗi tôi hay sửa cho team là lọc tháng ở HAVING, đếm COUNT(*) sau LEFT JOIN nên khách không có đơn vẫn ra 1, và SUM trả NULL thay vì 0. Tôi luôn kiểm tra bằng EXPLAIN ANALYZE xem bước aggregate nhận bao nhiêu dòng."

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

### Hiểu nhanh
Giống bảng xếp hạng "3 bàn thắng đẹp nhất của mỗi cầu thủ": mỗi cầu thủ có một danh sách riêng (PARTITION BY customer_id), xếp từ đẹp nhất xuống (ORDER BY amount DESC), rồi đánh số 1, 2, 3, 4… và chỉ giữ số 1 đến 3. Cầu thủ nào chỉ ghi 2 bàn thì danh sách chỉ có số 1 và 2 – không có gì sai, không có lỗi. Nếu hai bàn "đẹp ngang nhau", ta vẫn phải quyết ai đứng trước bằng một quy tắc cố định (ví dụ ghi trước thì đứng trước) – đó là tie-break.

### Thuật ngữ
- **Top-N per group**: bài toán lấy N dòng đầu của mỗi nhóm, là dạng câu hỏi SQL phỏng vấn rất phổ biến.
- **ROW_NUMBER**: đánh số liên tục 1, 2, 3… không trùng trong mỗi partition.
- **Tie-break**: cột phụ (thường là khóa chính) để phân định thứ tự khi giá trị chính bằng nhau.
- **Composite index**: index trên nhiều cột theo đúng thứ tự khai báo.
- **Covering index ({{INCLUDE}})**: index chứa thêm cột phụ để DB trả kết quả mà không phải đọc bảng.
- **LATERAL**: cho phép subquery trong FROM tham chiếu tới cột của bảng đứng trước nó, giống vòng for lồng nhau.
- **Materialized view**: kết quả query được lưu sẵn thành bảng, refresh định kỳ.

### Cơ chế từng bước
1. **Chia partition theo khách**: DB sort (hoặc đọc index) theo {{customer_id, amount DESC, id}}. Vì sao: các giao dịch của cùng khách phải đứng liền nhau và đã có thứ tự.
2. **Đánh số**: đi dọc từng partition, dòng đầu là 1, mỗi dòng tiếp theo +1, sang khách mới quay lại 1. Vì sao ROW_NUMBER: không bao giờ trùng số nên {{rn <= 3}} tối đa 3 dòng.
3. **Lọc ở lớp ngoài**: window function chạy sau WHERE nên phải lọc {{rn <= 3}} ở CTE ngoài.
4. **Khách ít giao dịch**: partition chỉ có 2 dòng thì chỉ có rn 1, 2 ⇒ trả 2 dòng, không cần xử lý đặc biệt.

~~~text
customer 7: amount 500, 300, 300, 200, 100
ROW_NUMBER : 1,   2,   3,   4,   5   → rn<=3 : 3 dòng (đúng)
RANK       : 1,   2,   2,   4,   5   → <=3   : 3 dòng (may mắn)
DENSE_RANK : 1,   2,   2,   3,   4   → <=3   : 4 dòng (sai)
customer 9: amount 80, 50            → rn<=3 : 2 dòng
~~~

### Vì sao ROW_NUMBER là lựa chọn đúng
- Nghiệp vụ: "3 giao dịch lớn nhất" – tính theo **thứ tự dòng**, không phải "mức số tiền" ⇒ {{ROW_NUMBER}} cho dãy 1, 2, 3… không có lỗ hổng.
- {{DENSE_RANK <= 3}} lấy mọi dòng thuộc **3 mức số tiền** cao nhất, không phải 3 dòng: chỉ cần có trùng là ra nhiều hơn 3 (ví dụ 4 giao dịch cùng số tiền cao nhất ⇒ ít nhất 4 dòng) ⇒ **sai**.
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
- Cần index {{(customer_id, amount DESC, id)}} để đọc sẵn đúng thứ tự, tránh sort (index-only scan chỉ đạt được khi mọi cột SELECT đều nằm trong index, nên câu mẫu chọn cột cụ thể thay vì {{t.*}} sẽ có lợi). PostgreSQL 11+ hỗ trợ covering index ⇒ có thể {{INCLUDE (created_at)}} để trả thêm cột không sort.
- Khi chỉ cần top 3 cho một tập khách nhỏ, {{CROSS JOIN LATERAL (SELECT … WHERE t.customer_id = c.id ORDER BY amount DESC, id LIMIT 3)}} đọc đúng 3 entry index cho mỗi khách thay vì sort cả bảng.
- Với bảng lớn (hàng chục triệu giao dịch), query này vẫn quét toàn bộ bảng. Nên:
  - Chỉ chạy cho tập khách hàng cần (thêm {{WHERE customer_id IN (…)}} hoặc join với bảng khách hàng hoạt động).
  - Hoặc tính trước vào bảng tổng hợp theo ngày/khách (materialized view), refresh định kỳ.

### Lỗi hay gặp
1. **Quên NULLS LAST**. Triệu chứng: dòng {{amount NULL}} bị xếp lên đầu (PostgreSQL) hoặc cuối (MySQL) ⇒ top 3 bị lệch. Cách tránh: luôn ghi rõ (MySQL không có cú pháp NULLS LAST, dùng {{ORDER BY amount IS NULL, amount DESC}}).
2. **Dùng RANK hoặc DENSE_RANK cho "top N dòng"**. Triệu chứng: kết quả thừa dòng, sai yên lặng, không báo lỗi. Cách tránh: ROW_NUMBER + test với dữ liệu trùng số tiền.
3. **Thiếu ORDER BY / tie-break trong window function**. Triệu chứng: kết quả không xác định, khác nhau giữa lần chạy. Cách tránh: {{ORDER BY amount DESC, id}}.
4. **Cố viết bằng JPQL**. Triệu chứng: query khó đọc, khó tối ưu. Cách tránh: trong JPA/Hibernate, dùng native query thay vì cố gắng viết JPQL cho window function (Hibernate 6 có hỗ trợ window function trong HQL nhưng native SQL vẫn dễ kiểm soát plan hơn).

### Trả lời miệng 1 phút
"Đây là bài top-N theo nhóm. Tôi dùng ROW_NUMBER partition theo customer_id, order theo amount giảm dần và id để tie-break, rồi lọc rn nhỏ hơn hoặc bằng 3 ở lớp ngoài vì window function chạy sau WHERE. Khách chỉ có 2 giao dịch thì partition chỉ có rn 1 và 2, nên tự nhiên trả 2 dòng. Tôi không dùng RANK hay DENSE_RANK vì khi trùng số tiền chúng trả nhiều hơn 3 dòng. Về hiệu năng, tôi tạo index (customer_id, amount DESC, id) để tránh sort; nếu chỉ cần cho vài khách thì dùng LATERAL với LIMIT 3 để đọc đúng 3 entry index mỗi khách. Với bảng hàng trăm triệu dòng, tôi tính sẵn vào bảng summary thay vì chạy mỗi lần người dùng click."

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

### Hiểu nhanh
Hãy nghĩ tới cuốn sổ chi tiêu của bạn: mỗi dòng ghi một khoản thu hoặc chi, và cột cuối cùng là "còn lại bao nhiêu" sau khoản đó. Để điền cột "còn lại", bạn lấy số còn lại của dòng **ngay trên** rồi cộng/trừ khoản hiện tại. {{SUM() OVER (... ROWS UNBOUNDED PRECEDING)}} làm đúng việc đó: cộng dồn từ dòng đầu tiên đến dòng hiện tại, theo thứ tự thời gian, riêng cho từng tài khoản. Số dư đầu kỳ của một dòng chính là "còn lại" của dòng phía trên.

### Thuật ngữ
- **Running balance / running total**: tổng cộng dồn từ đầu tới dòng hiện tại.
- **Window frame (khung cửa sổ)**: tập dòng mà hàm aggregate cửa sổ được phép "nhìn thấy" khi tính cho dòng hiện tại.
- **ROWS vs RANGE**: frame tính theo số dòng vật lý hay theo giá trị của cột ORDER BY.
- **Peer rows**: các dòng có cùng giá trị ORDER BY với dòng hiện tại.
- **LAG()**: hàm lấy giá trị của dòng đứng trước trong cùng partition.
- **Streaming aggregate**: tính dần trên luồng dữ liệu đã sắp xếp, không cần giữ toàn bộ trong bộ nhớ.
- **Ledger / available balance**: số dư sổ sách (đã hạch toán) và số dư khả dụng (trừ cả khoản đang chờ).

### Cơ chế từng bước
1. **Đổi dấu (CTE signed)**: IN thành +amount, OUT thành -amount. Vì sao: để mọi giao dịch cộng được bằng một hàm SUM duy nhất.
2. **Sắp xếp trong từng tài khoản**: theo {{created_at, id}}. Vì sao thêm id: hai giao dịch cùng giây vẫn có thứ tự cố định.
3. **Cộng dồn (SUM OVER ROWS UNBOUNDED PRECEDING)**: mỗi dòng lấy tổng của mình và mọi dòng phía trên. Vì sao ROWS: chỉ tính đúng các dòng đứng trước, không kéo theo dòng cùng timestamp.
4. **Suy ra số dư đầu kỳ**: {{closing - delta}} (tương đương {{LAG(closing)}}, dòng đầu tiên ra 0).

~~~text
id | type | amount | delta | opening | closing (running)
1  | IN   | 100    | +100  |   0     | 100
2  | OUT  |  30    |  -30  | 100     |  70
3  | IN   |  50    |  +50  |  70     | 120
4  | OUT  |  20    |  -20  | 120     | 100
opening(n) = closing(n-1) ; closing(n) = opening(n) + delta(n)
~~~

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

### Lỗi hay gặp
1. **Không có id trong ORDER BY**. Triệu chứng: giao dịch cùng giây (cùng {{created_at}}) không có thứ tự ổn định ⇒ running balance "nhảy" khi chạy lại; nếu dùng frame RANGE mặc định thì hai dòng cùng giây hiện cùng một số dư. Cách tránh: luôn thêm {{id}} và ghi rõ {{ROWS}}.
2. **Kiểu tiền tệ sai**. Triệu chứng: số dư lệch vài đồng sau hàng nghìn giao dịch. Cách tránh: {{amount}} phải {{DECIMAL}}/{{NUMERIC}}, không bao giờ {{FLOAT}}/{{DOUBLE}}; running sum của float sinh sai số tích lũy. Ở Java dùng {{BigDecimal}}.
3. **Lọc kỳ trước khi cộng dồn**. Triệu chứng: sao kê tháng 3 bắt đầu từ số dư 0. Cách tránh: xem mục "Sao kê theo kỳ" bên dưới.

### Pitfall production khác
- Nếu hệ thống có "điều chỉnh" (adjustment) sửa giao dịch cũ ⇒ running balance từ đó về sau đều sai. Giải pháp: cột {{version}} hoặc {{effective_from}}, tính lại running balance từ giao dịch bị sửa trở đi (hoặc dùng event sourcing).
- Sao kê theo kỳ (ví dụ tháng 3): nếu lọc {{created_at}} ở WHERE **trong** CTE trước window function thì running sum bắt đầu từ 0 ⇒ sai số dư. Phải cộng số dư đầu kỳ (snapshot cuối kỳ trước hoặc tổng giao dịch trước kỳ) rồi mới cộng dồn, hoặc tính window trên toàn lịch sử rồi lọc kỳ ở lớp ngoài.
- Cần phân biệt "số dư khả dụng" (available balance) và "số dư sổ sách" (ledger balance). Số dư khả dụng trừ đi giao dịch chờ duyệt (pending) ⇒ cần cột {{status}}.

### Trả lời miệng 1 phút
"Running balance là tổng cộng dồn các giao dịch tính tới dòng hiện tại. Tôi đổi dấu trước, IN là cộng, OUT là trừ, rồi dùng SUM OVER partition theo account_id, order theo created_at và id, với frame ROWS UNBOUNDED PRECEDING. Số dư cuối kỳ là giá trị cộng dồn đó, số dư đầu kỳ bằng cuối kỳ trừ đi delta, tương đương LAG của dòng trước, dòng đầu tiên ra 0. Tôi ghi rõ ROWS vì mặc định là RANGE, nên hai giao dịch cùng timestamp sẽ hiện cùng số dư. Với index (account_id, created_at, id), DB đọc theo thứ tự và cộng dồn kiểu streaming, không cần self-join. Kinh nghiệm của tôi là sao kê theo kỳ phải cộng số dư đầu kỳ, nếu không mọi tháng đều bắt đầu từ 0."

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

### Hiểu nhanh
Hình dung một hàng người xếp hàng mua vé, mỗi người cầm vé số ngày đăng nhập (1, 2, 3, 5, 6, 9) và được phát thêm số thứ tự trong hàng (1, 2, 3, 4, 5, 6). Nếu các ngày liền nhau, cả hai con số **cùng tăng 1 mỗi bước**, nên hiệu "ngày trừ số thứ tự" giữ nguyên. Khi có một ngày bị bỏ (gap), số ngày nhảy 2 còn số thứ tự chỉ tăng 1, nên hiệu thay đổi – một "hòn đảo" mới bắt đầu. Gom theo hiệu đó là ra từng chuỗi liên tiếp, đếm số dòng là ra độ dài streak.

### Thuật ngữ
- **Gaps and Islands**: họ bài toán tìm các đoạn liên tiếp (island) và các khoảng trống (gap) trong dữ liệu có thứ tự.
- **Island**: một chuỗi giá trị liên tiếp không đứt (ví dụ 1/1–3/1).
- **Gap**: khoảng bị thiếu giữa hai island (ví dụ ngày 4/1).
- **Grouping key**: giá trị tính ra để các dòng cùng island có chung khóa, dùng cho GROUP BY.
- **Interval**: kiểu dữ liệu khoảng thời gian của PostgreSQL (ví dụ {{INTERVAL '3 days'}}).
- **Streak**: chuỗi ngày hoạt động liên tục của người dùng.

### Cơ chế từng bước
1. **Khử trùng ngày**: mỗi user mỗi ngày chỉ giữ một dòng. Vì sao: hai lần đăng nhập cùng ngày làm row_number tăng mà ngày không tăng ⇒ hỏng key.
2. **Đánh số theo ngày** ({{ROW_NUMBER}} partition theo user). Vì sao: tạo dãy tăng đều 1, 2, 3… làm mốc so sánh.
3. **Tính key = ngày − rn**. Vì sao: trong một island cả hai tăng cùng nhịp nên hiệu là hằng số.
4. **GROUP BY user_id, key**: mỗi nhóm là một streak; {{MIN}} là ngày bắt đầu, {{MAX}} ngày kết thúc, {{COUNT}} độ dài.
5. **Chọn streak dài nhất** bằng ROW_NUMBER theo độ dài giảm dần.

~~~text
ngày : 1  2  3  _  5  6  _  _  9
rn   : 1  2  3     4  5        6
ngày-rn: 0 0  0     1  1        3
        └─island A─┘ └─B──┘    └C┘
        dài 3        dài 2      dài 1   → streak dài nhất = 3
~~~

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
    SELECT *, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY length DESC, start_date DESC) AS rn
    FROM streaks
) s
WHERE s.rn = 1;
~~~

Ghi chú: trên PostgreSQL, {{date - interval}} trả về kiểu {{timestamp}}; vẫn group được, nhưng gọn hơn là {{n.login_date - n.rn::int}} (date trừ số nguyên ra date). Ở truy vấn "streak dài nhất", {{start_date DESC}} là tie-break: hai streak dài bằng nhau thì lấy streak gần nhất.

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

### Lỗi hay gặp
1. **Quên DISTINCT ngày**. Triệu chứng: nhiều đăng nhập/ngày làm vỡ streak (streak bị cắt vụn hoặc độ dài đếm cả số lần đăng nhập). Cách tránh: khử trùng {{(user_id, ngày)}} trước khi đánh số; nếu đếm độ dài thì {{COUNT(DISTINCT login_date)}}.
2. **Không xử lý múi giờ**. Triệu chứng: {{login_date}} lưu UTC, user ở múi giờ +07 đăng nhập lúc 6 giờ sáng bị tính sang ngày hôm trước ⇒ streak tính theo UTC sai so với quan điểm user. Cách tránh: luôn convert về múi giờ user trước khi cắt lấy ngày.
3. **Dùng RANGE thay vì ROWS** (không áp dụng ở đây vì không dùng window aggregate, nhưng nếu biến thể dùng SUM OVER thì nhớ ROWS).
4. **Thiếu index**. Triệu chứng: query chạy hàng phút trên bảng lớn. Cách tránh: cần index {{(user_id, login_date)}}; với app lớn, cập nhật streak tăng dần mỗi ngày vào bảng riêng thay vì tính lại toàn lịch sử.

### Trả lời miệng 1 phút
"Đây là bài Gaps and Islands. Đầu tiên tôi khử trùng để mỗi user mỗi ngày chỉ còn một dòng. Sau đó tôi đánh ROW_NUMBER theo ngày trong từng user và lấy ngày trừ đi số thứ tự đó. Trong một chuỗi ngày liên tiếp, ngày và số thứ tự cùng tăng 1 nên hiệu không đổi, còn khi có ngày bị bỏ thì hiệu nhảy sang giá trị mới. Tôi group theo user và hiệu đó để ra từng streak với ngày bắt đầu, kết thúc và độ dài, rồi lấy streak dài nhất bằng ROW_NUMBER. Cách này chỉ cần một lần sort, có index (user_id, login_date) là chạy tốt. Hai lỗi tôi đã gặp thật là quên khử trùng ngày và tính ngày theo UTC thay vì múi giờ của người dùng."

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

### Hiểu nhanh
Dữ liệu bán hàng trong DB giống một cuốn sổ ghi từng dòng "ngày – sản phẩm – tiền" (dạng **dọc**). Sếp lại muốn xem một bảng Excel **ngang**: mỗi sản phẩm một dòng, mỗi tháng một cột. Pivot là việc "xoay" sổ dọc thành bảng ngang. Trong SQL, mỗi cột tháng là một cái "rổ" {{SUM(CASE WHEN tháng = m ...)}}: duyệt từng dòng, dòng thuộc tháng nào thì bỏ tiền vào rổ tháng đó. Vấn đề là SQL phải biết **trước** có bao nhiêu rổ (bao nhiêu cột) trước khi chạy – giống như bạn phải kẻ sẵn khung bảng trước khi điền số.

### Thuật ngữ
- **Pivot**: xoay dữ liệu từ dạng dòng (long) sang dạng cột (wide).
- **Long format / wide format**: dạng dọc (mỗi dòng một cặp khóa–giá trị) và dạng ngang (mỗi giá trị một cột).
- **Conditional aggregation**: aggregate có điều kiện bên trong, ví dụ {{SUM(CASE WHEN … THEN amount ELSE 0 END)}}.
- **YoY (Year over Year)**: so sánh một kỳ với cùng kỳ năm trước.
- **crosstab / tablefunc**: hàm pivot của extension {{tablefunc}} trong PostgreSQL.
- **Dynamic SQL**: câu SQL được ghép thành chuỗi lúc chạy rồi mới thực thi.
- **Compile time (của câu SQL)**: lúc DB phân tích câu lệnh và phải biết chính xác các cột kết quả cùng kiểu dữ liệu.

### Cơ chế từng bước (conditional aggregation)
1. **Lọc khoảng ngày** bằng điều kiện dạng {{>= đầu năm AND < đầu năm sau}}. Vì sao: dùng được index trên {{sale_date}} (bọc hàm EXTRACT vào cột ở WHERE sẽ làm mất index).
2. **GROUP BY product_id**: mỗi sản phẩm thành một nhóm.
3. **Với mỗi dòng trong nhóm**, 12 biểu thức CASE cùng được đánh giá; chỉ biểu thức của đúng tháng đó trả {{amount}}, 11 cái còn lại trả 0.
4. **SUM từng cột**: rổ tháng nào nhận tiền của tháng đó. Vì sao ELSE 0: tháng không có giao dịch ra 0 thay vì NULL.
5. **YoY**: làm lại cho năm trước rồi LEFT JOIN theo product_id và {{yr = yr - 1}}.

~~~text
long format                    wide format
prod | tháng | tiền            prod | m1  | m2  | m3
A    | 1     | 100     ──►     A    | 100 | 0   | 70
A    | 3     | 70              B    | 0   | 50  | 0
B    | 2     | 50
YoY% = (m1_2026 - m1_2025) / NULLIF(m1_2025, 0) * 100
~~~

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

### Lỗi hay gặp
- **Chia cho 0 khi tính YoY %**. Triệu chứng: lỗi "division by zero" khi tháng năm trước bằng 0. Cách tránh: {{NULLIF(prev, 0)}} và hiển thị "mới" thay vì phần trăm.
- **Bọc hàm vào cột ở WHERE** ({{WHERE EXTRACT(YEAR FROM sale_date) = 2026}}). Triệu chứng: full scan dù có index trên {{sale_date}}. Cách tránh: dùng khoảng {{>= DATE '2026-01-01' AND < DATE '2027-01-01'}}.
- Hard-code 12 cột trong SQL ⇒ khi thêm năm mới phải sửa code SQL, migration phiền.
- {{CASE WHEN}} không có {{ELSE 0}}: SUM bỏ qua NULL nên các tháng có dữ liệu vẫn đúng, nhưng tháng **không có** giao dịch nào sẽ ra NULL thay vì 0 ⇒ cộng/chia ở bước sau (YoY %) thành NULL. Dùng {{ELSE 0}} hoặc {{COALESCE}}.
- So sánh YoY: sản phẩm mới năm nay không có dòng năm trước ⇒ INNER JOIN làm **mất** sản phẩm đó; dùng LEFT JOIN và xử lý {{prv}} NULL. Năm hiện tại chưa hết thì các tháng tương lai = 0 – đừng hiển thị là "giảm 100%".
- Múi giờ: {{sale_date}} lưu UTC, extract month theo UTC có thể khác tháng địa phương ⇒ convert timezone trước khi extract.

### Trả lời miệng 1 phút
"Pivot trong SQL thường làm bằng conditional aggregation: group theo sản phẩm, mỗi tháng một cột SUM CASE WHEN tháng bằng m thì lấy amount, ngược lại 0. Để so YoY tôi tính pivot cho hai năm rồi LEFT JOIN năm hiện tại với năm trước, để sản phẩm mới không bị mất, và dùng NULLIF khi tính phần trăm. Dynamic pivot thật sự thì SQL không làm được, vì danh sách cột và kiểu dữ liệu phải biết khi phân tích câu lệnh; crosstab của PostgreSQL vẫn bắt khai báo cột, còn dynamic SQL thì khó bảo trì và dễ bị injection. Vì vậy trong dự án, tôi để SQL trả dữ liệu dạng dọc gọn, dùng index trên sale_date, rồi pivot và fill tháng thiếu ở Java bằng groupingBy. Cách này test được và không phụ thuộc vendor."

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

### Hiểu nhanh
Giống việc tìm toàn bộ con cháu trong gia phả: bạn bắt đầu từ ông tổ (anchor), hỏi "ai là con của ông?", được danh sách đời 2; rồi với **mỗi người** đời 2 lại hỏi "ai là con của người này?", được đời 3… Cứ lặp cho tới khi không còn ai có con nữa thì dừng. Recursive CTE làm đúng vòng lặp đó bên trong DB. Nếu gia phả bị ghi sai kiểu "A là cha B, B lại là cha A", vòng hỏi sẽ quay mãi; vì vậy ta mang theo một "sổ tay" ghi những người đã đi qua (path) để không quay lại.

### Thuật ngữ
- **Adjacency list**: cách lưu cây bằng cột {{parent_id}} trỏ về cha, phổ biến nhất trong DB quan hệ.
- **Anchor member**: phần SELECT chạy một lần đầu tiên, tạo tập dòng xuất phát.
- **Recursive member**: phần SELECT tham chiếu lại chính CTE, chạy lặp trên các dòng vừa sinh ở vòng trước.
- **Working table**: tập dòng mới của vòng lặp gần nhất; vòng sau chỉ join với tập này.
- **Cycle (vòng lặp)**: dữ liệu bẩn khiến một node là tổ tiên của chính nó.
- **CONNECT BY**: cú pháp truy vấn phân cấp riêng của Oracle, có trước chuẩn recursive CTE.
- **BOM (Bill of Materials)**: cây cấu thành sản phẩm từ linh kiện và linh kiện con.

### Minh hoạ các vòng lặp
~~~text
5 (Điện tử)                     vòng 0 (anchor): {5}            path {5}
├── 12 (Điện thoại)             vòng 1: con của {5}   → {12, 13}
│   └── 40 (Ốp lưng)            vòng 2: con của {12,13} → {40, 41}
└── 13 (Laptop)                 vòng 3: con của {40,41} → {} → DỪNG
    └── 41 (Balo laptop)        path của 40 = {5,12,40}
~~~

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
5. **Điều kiện dừng**: recursive term không trả về dòng nào nữa ⇒ CTE dừng. Vì sao chắc chắn dừng: mỗi vòng chỉ join với các dòng **mới** của vòng trước (working table), và path chặn việc thăm lại một node trên cùng nhánh, nên số vòng tối đa bằng độ sâu cây.

Lưu ý: kiểu mảng ({{ARRAY}}, {{<> ALL}}) là của PostgreSQL. MySQL 8 không có mảng; thường dùng path dạng chuỗi có dấu phân cách ở hai đầu, ví dụ {{CONCAT(s.path, c.id, ',')}} với path khởi tạo {{CONCAT(',', id, ',')}}, rồi kiểm tra {{FIND_IN_SET(c.id, s.path) = 0}} hoặc {{s.path NOT LIKE CONCAT('%,', c.id, ',%')}} (có dấu phẩy hai bên nên không khớp nhầm). Nhớ khai báo độ dài đủ lớn cho cột path ở anchor ({{CAST(... AS CHAR(1000))}}), vì MySQL lấy kiểu cột từ phần anchor.

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

### Lỗi hay gặp
1. **Không phòng cycle**. Triệu chứng: query chạy vô hạn, CPU 100%, temp file phình to cho tới khi bị cancel ({{pg_cancel_backend}}). Cách tránh: path/CYCLE clause, giới hạn level, và luôn đặt {{statement_timeout}} cho các query loại này; thêm constraint/trigger chặn tạo vòng khi ghi dữ liệu.
2. **Dùng UNION thay vì UNION ALL**. Triệu chứng: tốn sort/unique mỗi vòng lặp, chậm gấp nhiều lần. Cách tránh: {{UNION ALL}} + path.
3. **SELECT * trong recursive term**. Triệu chứng: kéo theo cột không cần, tốn memory. Cách tránh: chỉ select cột cần thiết.
4. **Path dạng text kiểm tra bằng LIKE không có dấu phân cách**. Triệu chứng: {{path}} nối chuỗi text vừa tốn bộ nhớ vừa dễ khớp nhầm (id 1 khớp trong "12") nên chặn oan node. Cách tránh: dùng mảng ({{ARRAY[id]}} và toán tử {{||}}) như ví dụ trên, hoặc có dấu phân cách hai đầu ở MySQL.

### Trả lời miệng 1 phút
"Với cây lưu bằng parent_id, tôi dùng recursive CTE. Phần anchor chọn danh mục gốc, phần recursive join category với chính CTE theo parent_id bằng id để đi xuống từng tầng, nối bằng UNION ALL; vòng lặp dừng khi một tầng không sinh thêm dòng nào. Để phòng dữ liệu bẩn có vòng, tôi mang theo path là mảng id đã đi qua và chặn id đã có trong path, hoặc dùng mệnh đề CYCLE trên PostgreSQL 14 trở lên; Oracle có CONNECT BY NOCYCLE. Bắt buộc có index trên parent_id, nếu không mỗi tầng là một full scan. Tôi cũng đặt statement_timeout và giới hạn độ sâu, vì tôi từng thấy một query đệ quy chạy vô hạn làm đầy ổ temp trên production."

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

### Hiểu nhanh
Hãy tưởng tượng quầy gửi xe: nhân viên muốn "nếu xe chưa có vé thì phát vé mới, có rồi thì cập nhật giờ". Nếu hai nhân viên cùng lúc nhìn sổ, cùng thấy "chưa có", rồi cùng phát vé – xe có hai vé. Đó là race condition của kiểu "kiểm tra rồi mới làm" (check-then-act). Upsert ở DB giống việc **chỉ có một cái máy phát vé có khoá**: hỏi và phát vé là một động tác duy nhất, người thứ hai chạm vào máy sẽ tự động chuyển sang nhánh "cập nhật". Unique index chính là ổ khoá của cái máy đó.

### Thuật ngữ
- **Upsert**: INSERT nếu chưa có, UPDATE (hoặc bỏ qua) nếu đã có, trong một lệnh.
- **Race condition**: kết quả phụ thuộc vào thứ tự xen kẽ ngẫu nhiên giữa các luồng chạy đồng thời.
- **Check-then-act**: mẫu code đọc trạng thái rồi hành động dựa trên trạng thái đó; không an toàn nếu không có khoá.
- **Conflict target**: danh sách cột (hoặc tên constraint) mà ON CONFLICT dùng để nhận ra dòng trùng.
- **EXCLUDED**: bảng ảo trong PostgreSQL chứa dòng vừa định chèn nhưng bị conflict.
- **Optimistic / pessimistic locking**: kiểm tra xung đột lúc ghi bằng cột version / khoá dòng ngay khi đọc.
- **Gap lock**: khoá InnoDB đặt lên "khoảng trống" giữa các giá trị index để chặn INSERT vào khoảng đó.
- **Idempotency key**: khoá do client sinh để server nhận ra request lặp lại.

### Cơ chế từng bước của ON CONFLICT
1. PostgreSQL thử chèn dòng mới và kiểm tra unique index {{(account_id, currency)}}. Vì sao cần index: đây là chỗ duy nhất DB biết chắc "đã có dòng này chưa", kể cả dòng của transaction khác chưa commit.
2. Nếu không trùng ⇒ INSERT xong.
3. Nếu trùng với dòng **đang bị transaction khác ghi dở**, lệnh **chờ** transaction kia kết thúc rồi kiểm tra lại. Vì sao: để không bao giờ có hai dòng cùng khóa.
4. Nếu trùng với dòng đã commit ⇒ khoá dòng đó và chạy nhánh {{DO UPDATE}}. Ở READ COMMITTED, PostgreSQL đảm bảo kết quả luôn là insert **hoặc** update, không ném lỗi trùng khóa.

~~~text
Không upsert (SELECT rồi INSERT):        Có ON CONFLICT:
A: SELECT → không có                      A: INSERT … → chèn, giữ khoá index
B: SELECT → không có                      B: INSERT … → thấy A đang ghi → CHỜ
A: INSERT → OK                            A: COMMIT
B: INSERT → duplicate key!                B: kiểm tra lại → DO UPDATE → OK
~~~

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

### Lỗi hay gặp
1. **Thiếu unique index cho conflict target**. Triệu chứng: PostgreSQL báo "there is no unique or exclusion constraint matching the ON CONFLICT specification"; MySQL thì không báo gì mà cứ insert dòng trùng. Cách tránh: tạo unique constraint trước, kiểm tra trong migration.
2. **Một lệnh upsert nhiều dòng có hai dòng cùng khóa**. Triệu chứng: PostgreSQL báo "ON CONFLICT DO UPDATE command cannot affect row a second time" (Oracle MERGE tương tự là ORA-30926). Cách tránh: gộp/khử trùng dữ liệu nguồn theo khóa trước khi gửi batch.
3. **Ghi đè thay vì cộng dồn**. Triệu chứng: số dư bị thay bằng số tiền giao dịch. Cách tránh: {{SET balance = account_balance.balance + EXCLUDED.balance}} khi nghiệp vụ là cộng.
4. **Dùng JPA save() và tưởng là upsert**. Triệu chứng: thỉnh thoảng {{DataIntegrityViolationException}} dưới tải cao. Cách tránh: native upsert hoặc bắt lỗi rồi retry.

### Pitfall production khác
- Không có unique index trên khóa upsert ⇒ ON CONFLICT không biết conflict cột nào ⇒ lỗi hoặc insert trùng.
- PostgreSQL: conflict target phải khớp **chính xác** một unique constraint/index (PK cũng là unique constraint). Nếu PK là {{id}} surrogate thì {{ON CONFLICT (account_id, currency)}} cần unique index riêng trên cặp này; với partial unique index phải lặp lại điều kiện WHERE của index trong ON CONFLICT.
- {{DO UPDATE SET col = EXCLUDED.col}} ghi đè **tất cả** cột trong SET. Nếu muốn "chỉ cộng dồn balance": {{SET balance = account_balance.balance + EXCLUDED.balance}}.
- Oracle MERGE: nếu {{USING}} trả nhiều dòng khớp cùng một target row → {{ORA-30926}} ("unable to get a stable set of rows"). Luôn đảm bảo source unique theo khóa join.
- Trong Hibernate: dùng {{@Query(nativeQuery = true)}} cho upsert; {{save()}}/{{saveAndFlush()}} không phải upsert.

### Trả lời miệng 1 phút
"Upsert là chèn nếu chưa có, cập nhật nếu đã có, và tôi luôn để DB làm việc đó trong một lệnh. Trên PostgreSQL tôi dùng INSERT ON CONFLICT với conflict target là unique index (account_id, currency), lấy giá trị mới qua EXCLUDED; ở READ COMMITTED nó đảm bảo kết quả là insert hoặc update, kể cả khi chạy song song. Oracle dùng MERGE, nhưng hai session cùng MERGE một khóa mới vẫn có thể dính ORA-00001, nên tôi bắt lỗi và retry; MySQL dùng ON DUPLICATE KEY UPDATE. Còn nếu tự SELECT rồi mới INSERT hoặc UPDATE thì có race condition: hai request cùng thấy chưa có, cùng insert, request sau lỗi duplicate key. Ở Java tôi viết native query hoặc JdbcTemplate, không dùng JPA save, và tôi từng sửa đúng lỗi này trong luồng nạp tiền."

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

### Hiểu nhanh
NULL giống một **ô khảo sát bị bỏ trống**: người đó không trả lời, chứ không phải trả lời "0". Hai ô bỏ trống không có nghĩa là hai người có cùng câu trả lời – ta chỉ biết là **không biết**. Vì vậy {{NULL = NULL}} không phải TRUE mà là UNKNOWN. Khi đếm: {{COUNT(*)}} là đếm số phiếu khảo sát; {{COUNT(col)}} là đếm số phiếu có điền câu đó; {{COUNT(DISTINCT col)}} là đếm có bao nhiêu kiểu câu trả lời khác nhau. Còn "tổng tiền của những người không ai điền" thì không phải 0 mà là "không có dữ liệu" – nên SUM trả NULL.

### Thuật ngữ
- **NULL**: đánh dấu "không có giá trị / chưa biết", không phải số 0 hay chuỗi rỗng.
- **Three-valued logic**: logic ba giá trị TRUE, FALSE, UNKNOWN; WHERE chỉ giữ dòng TRUE.
- **Aggregate function**: hàm gộp nhiều dòng thành một giá trị như {{SUM}}, {{AVG}}, {{COUNT}}.
- **COALESCE(a, b)**: trả về giá trị khác NULL đầu tiên trong danh sách.
- **NULLS FIRST / NULLS LAST**: chỉ thị chuẩn SQL quy định vị trí NULL khi sắp xếp.
- **Partial index**: index PostgreSQL chỉ chứa các dòng thoả một điều kiện WHERE.
- **IS DISTINCT FROM**: phép so sánh chuẩn SQL coi hai NULL là bằng nhau (PostgreSQL hỗ trợ; MySQL dùng toán tử {{<=>}}).

### Cơ chế từng bước khi DB tính aggregate
1. **COUNT(*)**: mỗi dòng đi qua tăng bộ đếm 1, không nhìn giá trị cột. Vì sao không bao giờ NULL: bộ đếm bắt đầu từ 0.
2. **COUNT(col), SUM, AVG, MIN, MAX**: với mỗi dòng, nếu {{col}} là NULL thì **bỏ qua**, ngược lại mới đưa vào phép tính. Vì sao: NULL không có giá trị để cộng.
3. **AVG** = tổng các giá trị khác NULL / **số giá trị khác NULL** (không chia cho tổng số dòng).
4. **Kết thúc**: nếu không có giá trị nào được đưa vào, SUM/AVG/MIN/MAX trả NULL (chuẩn SQL), còn COUNT trả 0.

~~~text
amount: 100, NULL, 200, 200, NULL
COUNT(*)              = 5
COUNT(amount)         = 3      (bỏ 2 NULL)
COUNT(DISTINCT amount)= 2      {100, 200}
SUM(amount)           = 500
AVG(amount)           = 500/3 = 166.67   (không phải 500/5 = 100)
SUM trên tập toàn NULL = NULL → COALESCE(SUM(amount), 0) = 0
~~~

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

### Lỗi hay gặp
1. **WHERE col = NULL**. Triệu chứng: không báo lỗi mà trả 0 dòng – bug "mất dữ liệu" yên lặng. Cách tránh: {{IS NULL}} / {{IS NOT NULL}}; so sánh hai cột có thể NULL thì dùng {{IS NOT DISTINCT FROM}} (PostgreSQL) hoặc {{<=>}} (MySQL).
2. **Hiểu sai AVG**. Triệu chứng: điểm trung bình "cao bất thường" vì người chưa làm bài (NULL) không bị tính vào mẫu số. Cách tránh: quyết định nghiệp vụ rõ ràng; nếu NULL nghĩa là 0 thì {{AVG(COALESCE(col, 0))}}.
3. **SUM trả NULL lan ra Java**. Triệu chứng: {{NullPointerException}} khi unbox {{BigDecimal}}/{{Long}} hoặc giao diện hiện trống. Cách tránh: {{COALESCE(SUM(col), 0)}}.
4. **Cộng chuỗi/số với NULL**. Triệu chứng: {{price + NULL}} hoặc {{'a' || NULL}} (PostgreSQL) ra NULL cả biểu thức. Cách tránh: COALESCE từng toán hạng.

### Pitfall production khác
- {{GROUP BY col}}: mọi NULL được gom chung thành **một nhóm** (khác với phép so sánh {{=}}, GROUP BY/DISTINCT coi các NULL là "không phân biệt"). Nếu muốn đặt label: {{GROUP BY COALESCE(col, 'UNKNOWN')}}.
- {{COUNT(DISTINCT col)}} với cột **toàn** NULL ⇒ trả 0, không phải 1.
- Index và NULL: PostgreSQL B-tree **có** lưu NULL và dùng được cho {{IS NULL}}; MySQL InnoDB cũng vậy. Oracle B-tree **không** lưu entry khi mọi cột của key đều NULL ⇒ {{WHERE col IS NULL}} không dùng được index đơn cột (mẹo: index {{(col, 0)}}). Cột hầu hết NULL trên PG thì partial index {{WHERE col IS NOT NULL}} giúp index nhỏ hơn.

### Trả lời miệng 1 phút
"NULL nghĩa là không biết hoặc không có giá trị, nên mọi phép so sánh với NULL ra UNKNOWN, kể cả NULL bằng NULL, và WHERE chỉ giữ dòng TRUE; muốn kiểm tra phải dùng IS NULL. COUNT sao đếm mọi dòng, COUNT cột chỉ đếm dòng có giá trị, COUNT DISTINCT đếm số giá trị khác nhau và cũng bỏ NULL. SUM, AVG, MIN, MAX bỏ qua NULL; nếu không còn giá trị nào thì trả NULL chứ không phải 0, để phân biệt 'tổng bằng 0' với 'không có dữ liệu', nên tôi luôn bọc COALESCE. Về sắp xếp, PostgreSQL và Oracle coi NULL lớn nhất, MySQL và SQL Server coi NULL nhỏ nhất, nên tôi luôn ghi rõ NULLS LAST hoặc biểu thức IS NULL. Lỗi tôi gặp nhiều nhất là WHERE col = NULL trả rỗng mà không báo lỗi."

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

### Hiểu nhanh
Hãy nghĩ tới một cuốn sổ ghi chép. **DELETE** là lấy bút gạch từng dòng bạn chọn – chậm, nhưng có thể "hoàn tác" và ai đang theo dõi (trigger) đều biết. **TRUNCATE** là xé hết ruột sổ, giữ lại bìa và khung kẻ – rất nhanh, nhưng không ai được báo từng dòng. **DROP** là vứt cả cuốn sổ, kể cả bìa và mục lục (index, quyền truy cập). Về view: **View** giống một **công thức nấu ăn** – mỗi lần ai hỏi thì nấu lại từ nguyên liệu tươi; **Materialized View** giống **món đã nấu sẵn để trong tủ lạnh** – lấy ra ăn ngay, nhưng có thể đã nguội từ sáng, muốn mới thì phải nấu lại (REFRESH).

### Thuật ngữ
- **DML / DDL**: lệnh thao tác dữ liệu (INSERT, UPDATE, DELETE) / lệnh thay đổi cấu trúc (CREATE, ALTER, DROP, TRUNCATE).
- **Implicit commit**: ở Oracle/MySQL, chạy lệnh DDL sẽ tự commit transaction đang mở, nên không rollback được.
- **WAL / redo log**: nhật ký ghi trước mọi thay đổi để khôi phục khi sập và để replica sao chép.
- **AccessExclusive lock**: khoá mạnh nhất của PostgreSQL, chặn cả SELECT trên bảng.
- **MVCC**: cơ chế giữ nhiều phiên bản dòng để người đọc không bị người ghi chặn.
- **Snapshot**: "ảnh chụp" dữ liệu tại một thời điểm mà một transaction nhìn thấy.
- **Stale data**: dữ liệu đã cũ so với bảng gốc.
- **Incremental refresh**: chỉ cập nhật phần thay đổi thay vì tính lại toàn bộ.

### Cơ chế từng bước
1. **DELETE**: với mỗi dòng khớp WHERE, DB đánh dấu dòng đã xoá (PostgreSQL ghi {{xmax}}, dòng thành dead tuple chờ VACUUM; InnoDB ghi undo log), ghi WAL/redo, kiểm tra FK, chạy trigger. Vì sao chậm: công việc tỉ lệ với số dòng.
2. **TRUNCATE**: DB không đụng từng dòng mà cấp file dữ liệu mới, trống cho bảng (PostgreSQL) hoặc drop rồi tạo lại bảng (InnoDB), chỉ ghi metadata. Vì sao nhanh: gần như không phụ thuộc số dòng; cái giá là khoá cả bảng và không chạy trigger từng dòng.
3. **DROP**: xoá định nghĩa trong system catalog cùng file dữ liệu, index, constraint, grant.
4. **View**: DB lưu câu SELECT; khi bạn query view, câu đó được "dán" vào query của bạn rồi tối ưu chung.
5. **Materialized view**: DB chạy câu SELECT một lần, ghi kết quả thành bảng thật trên đĩa; REFRESH chạy lại và thay toàn bộ kết quả.

~~~text
Xoá 10 triệu dòng (ước lượng, phụ thuộc phần cứng):
DELETE   : phút → hàng chục phút, WAL vài GB, bảng phình dead tuple
TRUNCATE : < 1 giây, WAL rất nhỏ, khoá toàn bảng trong chốc lát
View     : mỗi lần đọc = chạy lại join/aggregate (ví dụ 3 s)
MatView  : mỗi lần đọc ~ 5 ms; REFRESH đêm mất 3 s, dữ liệu cũ tới 24 h
~~~

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
- **MySQL**: không có materialized view; thường dùng bảng tổng hợp + event scheduler/job để tự refresh.

### Trade-off chọn MV
- **Dùng MV khi**: query phức tạp (join nhiều bảng, aggregate lớn), chạy thường xuyên, chấp nhận dữ liệu chậm vài phút/giờ.
- **Không dùng MV khi**: dữ liệu cần real-time (số dư tài khoản, giá cổ phiếu), bảng gốc ít dòng, query đơn giản.

### Lỗi hay gặp
1. **DELETE không WHERE để "dọn bảng log" hàng chục triệu dòng**. Triệu chứng: chạy rất lâu, WAL/binlog phình, replica trễ, bảng PostgreSQL vẫn chiếm nguyên dung lượng. Cách tránh: TRUNCATE nếu xoá hết; nếu xoá theo thời gian thì xoá theo lô hoặc partition theo tháng rồi drop partition cũ.
2. **TRUNCATE nhầm và tưởng rollback được**. Triệu chứng: trên MySQL/Oracle dữ liệu mất hẳn vì implicit commit. Cách tránh: phân quyền, chỉ cho TRUNCATE trên schema staging; backup trước.
3. **Đọc MV mà quên lịch refresh**. Triệu chứng: dashboard lệch với số liệu thật, người dùng phàn nàn "đã thanh toán mà chưa thấy". Cách tránh: hiển thị "cập nhật lúc …", giám sát độ trễ refresh.
4. **REFRESH thường (không CONCURRENTLY) giờ cao điểm**. Triệu chứng: mọi SELECT vào MV bị treo trong lúc refresh. Cách tránh: dùng CONCURRENTLY + unique index, hoặc refresh ngoài giờ.

### Pitfall production khác
- {{TRUNCATE}} trên bảng có FK: PostgreSQL yêu cầu {{TRUNCATE parent CASCADE}} hoặc disable FK trước. Oracle: {{TRUNCATE TABLE … CASCADE}} (12c+).
- {{TRUNCATE}} trong transaction dài: giữ lock {{AccessExclusive}} lâu ⇒ chặn **mọi** truy cập kể cả {{SELECT}} cho tới khi transaction kết thúc. TRUNCATE cũng **không MVCC-safe**: sau khi commit, transaction khác đang dùng snapshot cũ sẽ thấy bảng rỗng.
- MV {{REFRESH CONCURRENTLY}} không có unique index ⇒ lỗi. Unique index trên MV thường là khóa chính của kết quả.
- MV stale data: báo cáo sai số liệu. Luôn có monitoring: {{last_refresh_time}}, {{lag_seconds}}.

### Trả lời miệng 1 phút
"DELETE là DML: xoá từng dòng theo WHERE, ghi log từng dòng, chạy trigger, kiểm tra FK và rollback được, nhưng chậm theo số dòng. TRUNCATE xoá toàn bộ bảng bằng cách cấp lại vùng lưu trữ, gần như tức thì, không chạy trigger, khoá cả bảng; PostgreSQL rollback được trong transaction, còn MySQL và Oracle thì không vì DDL tự commit. DROP xoá luôn cấu trúc bảng, index và quyền. View chỉ là câu query được lưu, luôn mới nhưng mỗi lần đọc phải tính lại; materialized view lưu kết quả ra đĩa nên đọc rất nhanh, đánh index được, nhưng dữ liệu cũ tới lần REFRESH kế tiếp. Tôi dùng MV cho báo cáo tổng hợp refresh theo lịch với CONCURRENTLY, và không bao giờ dùng nó cho số dư cần real-time."

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

### Hiểu nhanh
Giống ngân hàng gọi điện xác minh khi bạn bỗng quẹt thẻ 30 triệu trong khi bình thường bạn chỉ tiêu vài triệu: "bình thường" ở đây là **của chính bạn**, tính trên **khoảng thời gian gần đây**. Với mỗi giao dịch, ta nhìn lại một "cửa sổ trượt" 30 ngày trước đó của cùng khách, tính trung bình, rồi so: lớn hơn 3 lần thì gắn cờ. Cửa sổ trượt giống thước đo dài 30 ngày đặt lùi về sau mỗi giao dịch – giao dịch kế tiếp thì thước trượt theo.

### Thuật ngữ
- **Moving / rolling average**: trung bình trên một cửa sổ trượt theo thời gian hoặc theo số dòng.
- **Window frame**: phần dòng trong partition mà hàm AVG nhìn thấy khi tính cho dòng hiện tại.
- **RANGE với offset**: frame xác định bằng khoảng **giá trị** (ví dụ 30 ngày) chứ không phải số dòng.
- **EXCLUDE CURRENT ROW**: loại chính dòng hiện tại khỏi frame.
- **NULLIF(x, 0)**: trả NULL nếu x bằng 0, dùng để tránh lỗi chia cho 0.
- **Z-score**: số độ lệch chuẩn mà một giá trị cách trung bình.
- **False positive**: cảnh báo sai – giao dịch bình thường bị gắn cờ bất thường.
- **Stream processing**: xử lý dữ liệu liên tục khi sự kiện đến (Flink, Kafka Streams) thay vì query theo lô.

### Cơ chế từng bước
1. **Partition theo khách và sort theo created_at**. Vì sao: "trung bình của chính khách đó" và cửa sổ thời gian cần thứ tự thời gian.
2. **Với mỗi giao dịch tại thời điểm t**, xác định frame [t − 30 ngày, t − 1 ngày] theo **giá trị** created_at. Vì sao RANGE: số giao dịch mỗi ngày không đều, nên "30 dòng trước" không có nghĩa là "30 ngày trước".
3. **AVG các amount trong frame**: frame rỗng thì AVG là NULL.
4. **Lọc ở lớp ngoài**: {{amount > 3 * avg_30d}}, bỏ dòng có avg NULL. Vì sao lớp ngoài: window function chạy sau WHERE.

~~~text
Khách 42, giao dịch lúc 2026-03-31 10:00, amount = 9.000.000
frame = [2026-03-01 10:00, 2026-03-30 10:00]
  03-05: 1.000.000   03-12: 2.000.000   03-20: 1.500.000   03-29: 1.500.000
  avg_30d = 6.000.000 / 4 = 1.500.000
  9.000.000 > 3 * 1.500.000 = 4.500.000  → BẤT THƯỜNG (ratio = 6.0)
  (giao dịch 03-30 15:00 nằm trong 24h cuối nên không thuộc frame)
~~~

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

### Lỗi hay gặp
1. **Dùng ROWS 30 PRECEDING**. Triệu chứng: khách giao dịch 50 lần/ngày thì "trung bình 30 dòng" chỉ phủ vài giờ; khách giao dịch 1 lần/tháng thì phủ cả năm ⇒ cảnh báo vô nghĩa. Cách tránh: RANGE với offset INTERVAL.
2. **Frame kết thúc ở CURRENT ROW**. Triệu chứng: giao dịch lớn kéo trung bình của chính nó lên nên bị bỏ lọt. Cách tránh: kết thúc ở {{1 day PRECEDING}} hoặc {{EXCLUDE CURRENT ROW}} (PostgreSQL; MySQL không hỗ trợ EXCLUDE).
3. **Trung bình trên quá ít mẫu**. Triệu chứng: khách mới có 1 giao dịch 100 nghìn, giao dịch 400 nghìn kế tiếp bị gắn cờ ⇒ nhiều false positive. Cách tránh: thêm {{COUNT(*) OVER}} cùng frame và yêu cầu tối thiểu N giao dịch.
4. **Chạy trên toàn lịch sử mỗi lần**. Triệu chứng: query chạy hàng phút. Cách tránh: chỉ chấm điểm giao dịch mới (ví dụ 1 ngày gần nhất) nhưng vẫn đọc thêm 30 ngày trước đó làm ngữ cảnh – lọc ở lớp ngoài, không lọc trước window (nếu lọc trước thì frame bị cắt).

### Pitfall production khác
- Offset {{INTERVAL}} chỉ dùng với cột {{TIMESTAMP}}/{{DATE}}; cột số (epoch seconds) thì offset phải là số ({{RANGE BETWEEN 2592000 PRECEDING AND 86400 PRECEDING}}) hoặc cast sang timestamp.
- PostgreSQL: {{RANGE}} frame yêu cầu ORDER BY chỉ **một** cột và kiểu dữ liệu hỗ trợ interval arithmetic.
- Không có index {{(customer_id, created_at)}} ⇒ full scan + sort toàn bộ dữ liệu theo (customer_id, created_at) ⇒ rất chậm và tràn work_mem ra đĩa trên bảng hàng chục triệu dòng.
- Chạy real-time trên luồng giao dịch: dùng materialized view refresh mỗi 5 phút hoặc stream processing (Flink, Kafka Streams) thay vì query ad-hoc.

### Trả lời miệng 1 phút
"Tôi dùng một CTE tính trung bình trượt cho từng giao dịch: AVG amount OVER partition theo customer_id, order theo created_at, với frame RANGE từ 30 ngày trước đến 1 ngày trước. Tôi chọn RANGE vì cửa sổ phải tính theo thời gian, không theo số dòng, mà số giao dịch mỗi ngày của mỗi khách rất khác nhau; và tôi loại giao dịch hiện tại khỏi frame để nó không tự kéo trung bình lên. Lớp ngoài lọc amount lớn hơn 3 lần trung bình, bỏ trường hợp không có lịch sử, và dùng NULLIF khi tính tỉ lệ. Cần index (customer_id, created_at) để khỏi sort lớn. Thực tế quy tắc 3 lần trung bình sinh nhiều false positive, nên tôi thêm số mẫu tối thiểu, cân nhắc z-score, và chạy theo lô hoặc stream thay vì per-request."

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

### Hiểu nhanh
Index trên {{created_at}} giống **cuốn danh bạ đã xếp theo thời gian**. Hỏi "từ 1/3 đến trước 1/4" thì bạn lật thẳng tới trang 1/3 và đọc tới khi gặp 1/4 là dừng. Còn hỏi "những dòng có MONTH(...) bằng 3" thì danh bạ không được xếp theo "tháng của ngày" nên bạn phải đọc **từng trang** để tính tháng. Về ranh giới: "từ 1/3 đến **trước** 1/4" là cách nói không thể sai – không cần biết tháng có 30 hay 31 ngày, không cần biết giây có bao nhiêu chữ số thập phân. Còn múi giờ giống chuyện "nửa đêm ở Hà Nội là 17 giờ hôm trước ở London": cùng một khoảnh khắc nhưng thuộc hai ngày khác nhau.

### Thuật ngữ
- **Half-open interval [start, end)**: khoảng gồm điểm đầu, không gồm điểm cuối.
- **SARGable**: điều kiện viết sao cho DB dùng được index để tìm khoảng, thường là "cột trần" so với hằng số.
- **Index range scan**: đọc một đoạn liên tiếp trong index từ khóa đầu tới khóa cuối.
- **TIMESTAMPTZ**: kiểu PostgreSQL lưu một thời điểm tuyệt đối (quy về UTC), hiển thị theo múi giờ của session.
- **Session TimeZone**: múi giờ mặc định của kết nối, dùng để hiểu literal không ghi offset.
- **Expression / functional index**: index trên kết quả một biểu thức, ví dụ {{((created_at AT TIME ZONE 'Asia/Ho_Chi_Minh')::date)}}; với cột TIMESTAMPTZ, PostgreSQL không cho index {{date(created_at)}} trực tiếp vì kết quả phụ thuộc TimeZone của session (hàm không IMMUTABLE).
- **Partition pruning**: DB bỏ qua các partition chắc chắn không chứa dữ liệu thoả điều kiện.
- **Instant / OffsetDateTime**: kiểu Java biểu diễn thời điểm tuyệt đối / thời điểm kèm offset.

### Cơ chế từng bước khi DB chạy điều kiện nửa mở
1. **Tính hai mốc**: {{2026-03-01 00:00+07}} = {{2026-02-28 17:00 UTC}}, {{2026-04-01 00:00+07}} = {{2026-03-31 17:00 UTC}}. Vì sao: cột TIMESTAMPTZ lưu UTC, nên so sánh trên cùng hệ quy chiếu.
2. **Seek vào B-tree** tới khóa đầu tiên {{>= start}}. Vì sao nhanh: index đã sắp xếp nên tìm được trong vài lần đọc trang (O(log n)).
3. **Đọc tuần tự** sang phải cho tới khóa đầu tiên {{>= end}} thì dừng. Vì sao dùng {{<}}: điểm cuối thuộc tháng sau, loại nó ra thì không bao giờ trùng giữa hai tháng liền nhau.
4. Với {{MONTH(created_at) = 3}}, DB phải tính hàm cho **mọi** dòng (không biết dòng nào thoả trước khi tính) ⇒ full scan.

~~~text
UTC  : ...02-28 17:00 ───────── tháng 3 giờ VN ───────── 03-31 17:00...
        ▲ start (bao gồm)                         end (loại trừ) ▲
tháng 3 [-------------------------------------------------)
tháng 4                                                     [---------)
→ hai tháng nối nhau khít, không chồng, không hở
BETWEEN '03-01' AND '03-31' : dừng ở 03-31 00:00:00 → mất gần trọn ngày 31/3
~~~

### Sai lầm phổ biến

| Cách viết | Vấn đề |
|---|---|
| {{WHERE MONTH(created_at) = 3}} (MySQL; PostgreSQL viết {{EXTRACT(MONTH FROM created_at) = 3}}) | Bọc hàm quanh cột → **không dùng được index** (full scan). Còn lấy tháng 3 của **mọi năm** nếu quên điều kiện năm. Sai múi giờ: {{created_at}} là UTC, {{MONTH()}} lấy tháng UTC, user ở +07 thấy tháng khác. |
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

### Lỗi hay gặp
1. **BETWEEN với ngày cuối tháng**. Triệu chứng: doanh thu tháng 3 thiếu gần trọn ngày 31/3; đối soát với kế toán lệch. Cách tránh: nửa mở {{>= start AND < end}}.
2. **Bọc hàm quanh cột**. Triệu chứng: query báo cáo chạy chậm dần theo kích thước bảng, plan là Seq Scan. Cách tránh: đưa phép tính sang phía hằng số (tính mốc ở Java), hoặc tạo expression index nếu buộc phải giữ hàm.
3. **Lệch múi giờ**. Triệu chứng: giao dịch lúc 6 giờ sáng 1/4 giờ VN (23 giờ 31/3 UTC) bị tính vào tháng 3. Cách tránh: mốc thời gian luôn có offset/zone rõ ràng, JVM và DB thống nhất UTC.
4. **Dùng LocalDateTime trong Java cho cột TIMESTAMPTZ**. Triệu chứng: kết quả thay đổi khi đổi server sang múi giờ khác. Cách tránh: dùng {{Instant}}/{{OffsetDateTime}}.

### Pitfall production khác
- Literal không có offset như {{created_at >= '2026-03-01'}} so với cột {{TIMESTAMPTZ}} được hiểu theo {{TimeZone}} của **session** ⇒ server/session để UTC thì lệch 7 giờ so với tháng của user VN. Luôn ghi offset hoặc bind giá trị từ Java.
- Báo cáo "tuần này": tính {{startOfWeek}} (Thứ 2 hoặc CN tuỳ locale) ở Java, bind parameter.
- Partition table theo tháng: điều kiện {{created_at}} nửa mở giúp **partition pruning** tự động.
- CDC / replication: {{wal2json}}, {{Debezium}} phát event theo commit time – vẫn dùng nửa mở để query lại dữ liệu nhất quán.

### Trả lời miệng 1 phút
"Tôi lọc tháng 3 bằng khoảng nửa mở: created_at lớn hơn hoặc bằng 0 giờ ngày 1/3 và nhỏ hơn 0 giờ ngày 1/4, theo múi giờ của người dùng. Viết như vậy thì cột đứng trần nên DB dùng index range scan, đúng cho mọi độ dài tháng, và hai tháng liền nhau không chồng cũng không hở. Tôi tránh MONTH(created_at) vì bọc hàm quanh cột làm mất index và lấy tháng theo UTC; tránh BETWEEN vì nó gồm cả điểm cuối, viết 31/3 thì chỉ lấy đúng 0 giờ ngày 31, viết 23:59:59 thì vẫn sót phần lẻ giây. Với múi giờ, tôi lưu UTC trong TIMESTAMPTZ, tính hai mốc ở Java bằng ZoneId Asia/Ho_Chi_Minh rồi bind parameter. Tôi từng sửa báo cáo doanh thu lệch đúng 7 tiếng vì literal không có offset."

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

### Hiểu nhanh
EXPLAIN giống **lộ trình Google Maps** mà DB định đi trước khi chạy: đi đường nào (index hay quét bảng), dự kiến mất bao lâu. {{EXPLAIN ANALYZE}} là **đi thật** rồi ghi lại hành trình thực tế, nên bạn so được "dự kiến 20 phút" với "thực tế 2 tiếng". Seq Scan giống đọc cả cuốn sách từ trang 1 để tìm một câu; Index Scan giống tra mục lục rồi lật tới từng trang; Index Only Scan giống câu trả lời **nằm ngay trong mục lục**, không cần lật sách. Đọc cả cuốn sách không phải lúc nào cũng dở: nếu bạn cần một nửa số trang thì đọc liền một mạch còn nhanh hơn lật qua lật lại.

### Thuật ngữ
- **Plan node**: một bước xử lý trong kế hoạch (scan, join, sort…); node con chạy trước và đẩy dòng lên node cha.
- **Cost**: đơn vị chi phí ước lượng tương đối của planner, không phải mili-giây.
- **Heap**: vùng lưu dữ liệu thật của bảng trong PostgreSQL, tách khỏi index.
- **Selectivity**: tỉ lệ dòng thoả điều kiện; càng nhỏ thì index càng có lợi.
- **Buffers shared hit / read**: số trang 8 KB tìm thấy trong shared buffers / phải xin từ hệ điều hành (có thể từ page cache của OS hoặc từ đĩa).
- **Visibility map**: bản đồ đánh dấu trang heap nào "mọi dòng đều đã visible với mọi transaction", do VACUUM cập nhật.
- **Heap Fetches**: số lần Index Only Scan vẫn phải đọc heap để kiểm tra visibility.
- **random_page_cost**: tham số cho planner biết đọc ngẫu nhiên đắt hơn đọc tuần tự bao nhiêu lần.

### Cơ chế từng bước khi đọc plan
1. **Đọc từ node gốc (dòng trên cùng)**: actual time của nó là tổng thời gian query. Vì sao: biết ngay query chậm thật hay không.
2. **Tìm node con tốn nhiều thời gian nhất** (nhớ nhân với {{loops}}). Vì sao: tối ưu chỗ khác là phí công.
3. **So rows ước tính với actual rows**: lệch 10 lần trở lên nghĩa là thống kê sai ⇒ planner chọn sai chiến lược. Vì sao quan trọng: mọi quyết định của planner dựa trên ước tính này.
4. **Nhìn Rows Removed by Filter và Buffers**: biết đọc thừa bao nhiêu, I/O thật bao nhiêu.
5. **Đề xuất sửa và đo lại** cùng điều kiện (cache nóng/lạnh như nhau).

~~~text
Seq Scan  : đọc 319.000 trang → giữ 20.000 dòng, bỏ 19.980.000   (15,2 s)
Index Scan: seek index (~4 trang) → 20.000 lần nhảy vào heap       (~0,2 s nếu dữ liệu nằm gần nhau)
Index Only: seek index → đọc lá index liên tiếp, Heap Fetches: 0   (~0,05 s)
Tỉ lệ dòng cần lấy:  0,1% → index thắng | 30% → seq scan thường thắng
~~~

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
- **Index Only Scan**: mọi cột query cần đều nằm trong index (dùng {{INCLUDE}} hoặc đặt đúng thứ tự) ⇒ bỏ qua heap. Nhưng PostgreSQL vẫn phải kiểm tra dòng đã "visible" với snapshot hiện tại, bằng **visibility map**: trang heap nào bị sửa sau lần VACUUM gần nhất (chưa được đánh dấu all-visible) thì phải đọc heap ⇒ cột {{Heap Fetches}} lớn hơn 0, khi đó index-only chỉ là "nửa mùa". Bảng ghi nhiều cần autovacuum chạy đủ thường xuyên thì Index Only Scan mới phát huy.
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

### Lỗi hay gặp
1. **EXPLAIN ANALYZE câu ghi trên production**. Triệu chứng: {{EXPLAIN ANALYZE}} trên câu {{UPDATE}}/{{DELETE}} là **thực thi thật** ⇒ dữ liệu bị sửa thật. Cách tránh: luôn bọc {{BEGIN}} rồi {{ROLLBACK}}.
2. **Đo trên staging rồi kết luận cho production**. Triệu chứng: plan trên staging khác production (thống kê, phân bố dữ liệu), index "chạy tốt" ở staging nhưng production vẫn chậm. Cách tránh: luôn đo lại trên dữ liệu thật hoặc bản sao có kích thước tương đương; dùng {{auto_explain}} để bắt plan thật.
3. **Thêm index vì ghét Seq Scan**. Triệu chứng: thấy chữ {{Seq Scan}} chưa phải lỗi; thêm index chỉ vì "tôi không thích seq scan" là cách làm chậm ghi vô ích, mà planner vẫn chọn seq scan. Cách tránh: xem selectivity và thời gian thật trước.
4. **Thống kê cũ**. Triệu chứng: rows ước tính lệch hàng trăm lần so với actual sau một đợt import lớn. Cách tránh: chạy {{ANALYZE orders}} sau khi nạp dữ liệu lớn, kiểm tra autovacuum/autoanalyze.

### Trả lời miệng 1 phút
"EXPLAIN cho tôi cây kế hoạch của planner, còn EXPLAIN ANALYZE BUFFERS chạy thật và ghi thời gian, số dòng thực và số trang đọc. Tôi đọc từ node gốc để biết tổng thời gian, tìm node tốn nhất nhân với loops, rồi so rows ước tính với thực tế. Ở plan này, Seq Scan đọc hai mươi triệu dòng để giữ hai mươi nghìn, Rows Removed by Filter rất lớn, tức selectivity chỉ khoảng 0,1 phần trăm, nên một index trên cột lọc là hợp lý. Seq Scan vẫn đúng khi cần phần lớn bảng, bảng nhỏ, hoặc dữ liệu đã nằm trong RAM, vì đọc tuần tự rẻ hơn nhiều lần đọc ngẫu nhiên. Index Scan seek index rồi vào heap lấy dòng, Index Only Scan lấy đủ cột từ index và chỉ chạm heap khi visibility map chưa xác nhận trang. Tôi luôn đo trước và sau trên dữ liệu thật."

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

### Hiểu nhanh
Giống việc đối chiếu sổ tiền mặt của bạn với sao kê ngân hàng cuối tháng. Bạn đặt hai tờ cạnh nhau và dò theo mã giao dịch: có ở cả hai và số tiền giống nhau (khớp), chỉ có trong sổ của bạn (ngân hàng chưa ghi), chỉ có trong sao kê (bạn quên ghi), có ở cả hai nhưng số tiền khác (lệch). {{FULL OUTER JOIN}} chính là việc "đặt hai tờ cạnh nhau và giữ mọi dòng của cả hai bên": bên nào thiếu thì ô bên đó để trống (NULL). Nhìn vào ô trống và so số tiền là xếp được mỗi dòng vào đúng một trong 4 nhóm.

### Thuật ngữ
- **Đối soát (reconciliation)**: so hai nguồn dữ liệu để tìm chênh lệch.
- **FULL OUTER JOIN**: phép nối giữ mọi dòng của cả hai bảng, điền NULL cho phía không khớp.
- **Anti-join**: lấy dòng bên này **không có** dòng khớp bên kia ({{NOT EXISTS}}).
- **EXCEPT / INTERSECT**: phép trừ / giao hai tập kết quả, so cả dòng và tự loại bản trùng.
- **IS DISTINCT FROM**: phép so sánh coi hai NULL là bằng nhau, NULL với giá trị là khác.
- **COALESCE**: trả giá trị khác NULL đầu tiên, dùng để lấy khóa của phía có dữ liệu.
- **Hash join**: dựng bảng băm từ một bảng rồi dò bằng bảng còn lại.
- **Minor units**: lưu tiền bằng số nguyên của đơn vị nhỏ nhất (đồng, cent) để tránh sai số.

### Cơ chế từng bước
1. **Nối hai bảng theo order_id, giữ mọi dòng hai phía**. Vì sao FULL: LEFT JOIN làm mất nhóm "chỉ B", RIGHT JOIN làm mất nhóm "chỉ A".
2. **Lấy khóa chung** bằng {{COALESCE(a.order_id, b.order_id)}}. Vì sao: dòng chỉ có ở B thì {{a.order_id}} là NULL.
3. **Phân loại theo thứ tự CASE**: thiếu A trước, thiếu B sau, rồi mới so tiền. Vì sao thứ tự này: khi một phía là NULL, phép so tiền không có nghĩa.
4. **So tiền bằng IS DISTINCT FROM**. Vì sao không dùng {{<>}}: {{100 <> NULL}} là UNKNOWN nên dòng lệch "có tiền vs không có tiền" sẽ bị xếp nhầm vào MATCHED.

~~~text
A: 1→100, 2→200, 3→300          B: 2→200, 3→350, 4→400
order | amount_a | amount_b | status
1     | 100      | NULL     | ONLY_A
2     | 200      | 200      | MATCHED
3     | 300      | 350      | MISMATCH
4     | NULL     | 400      | ONLY_B
~~~

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
Oracle dùng {{MINUS}} (từ 21c có thêm {{EXCEPT}}); MySQL hỗ trợ {{EXCEPT}}/{{INTERSECT}} từ 8.0.31.

**MySQL không có FULL OUTER JOIN**: giả lập bằng {{LEFT JOIN}} (A với B) {{UNION ALL}} phần "chỉ B" lấy bằng {{RIGHT JOIN … WHERE a.order_id IS NULL}} (hoặc anti-join NOT EXISTS). Dùng UNION ALL kèm điều kiện loại phần chung chứ không dùng UNION, vì UNION sẽ gộp mất những dòng trùng hợp lệ và tốn thêm sort.

### Hiệu năng
- Cả hai bảng cần index (hoặc unique) trên {{order_id}}; planner thường làm hash join: quét A xây hash, quét B probe, tốn bộ nhớ theo cỡ bảng A.
- Staging hàng triệu dòng: nên đếm theo nhóm trước, hoặc so **tổng theo ngày** ({{SUM(amount)}} {{GROUP BY}} ngày) để phát hiện lệch rồi mới đối soát chi tiết.
- Thu hẹp khoảng ngày trước khi join để giảm quét; chỉ đọc thì thêm {{WHERE}} ở hai vế.

### Lỗi hay gặp
1. **Khóa bị lặp trong staging**. Triệu chứng: {{order_id}} bị import lặp trong staging ⇒ join **nhân đôi** dòng, báo "mismatch" ảo, tổng tiền gấp đôi. Cách tránh: dedupe hoặc tạo unique index trước; kiểm tra {{GROUP BY order_id HAVING COUNT(*) > 1}} ở mỗi nguồn.
2. **Kiểu dữ liệu hai bên lệch** ({{BIGINT}} vs {{VARCHAR}}). Triệu chứng: không dòng nào khớp, hoặc '00123' không khớp 123. Cách tránh: chuẩn hoá khi nạp staging; nếu phải {{CAST}} cùng kiểu thì nhớ ép kiểu có thể làm mất index của vế kia.
3. **So tiền bằng số thực**. Triệu chứng: hàng nghìn dòng MISMATCH lệch 0.0000001. Cách tránh: dùng {{NUMERIC}} hoặc số nguyên minor units, không dùng {{double}} – phép tính dấu phẩy động sẽ sinh lệch ảo.
4. **So chuỗi** mà bỏ qua collation và khoảng trắng cuối chuỗi. Triệu chứng: mã "ABC " không khớp "ABC". Cách tránh: {{TRIM}} khi source là hệ legacy, thống nhất collation/hoa thường.

### Trả lời miệng 1 phút
"Bài đối soát tôi luôn chia 4 nhóm: khớp, chỉ có ở A, chỉ có ở B và có cả hai nhưng lệch tiền. Tôi dùng FULL OUTER JOIN theo order_id để giữ mọi dòng của cả hai phía, lấy khóa bằng COALESCE, rồi CASE: phía A NULL là chỉ B, phía B NULL là chỉ A, còn lại so tiền bằng IS DISTINCT FROM để NULL không làm sai phép so sánh. Cách này cho cả 4 nhóm kèm số tiền hai bên trong một lần quét, thường là một hash join, trong khi hai lần anti-join chỉ cho hai nhóm thiếu. EXCEPT hợp khi tôi chỉ cần danh sách ID. Trên MySQL không có FULL JOIN thì tôi ghép LEFT JOIN với phần chỉ có ở B. Điều đầu tiên tôi kiểm tra luôn là khóa có unique không, vì import lặp sẽ làm báo cáo đầy mismatch ảo."

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

### Hiểu nhanh
Planner giống một người lập kế hoạch giao hàng chỉ có **số liệu thống kê** chứ không nhìn thấy từng kiện hàng. Hỏi "bao nhiêu đơn ở Hà Nội **và** giao bằng xe máy?", anh ta lấy "30% đơn ở Hà Nội" nhân "10% đơn đi xe máy" = 3%, vì anh ta **giả định hai chuyện không liên quan nhau**. Nhưng thực tế ở Hà Nội 80% đơn đi xe máy, nên con số đúng là 24% – gấp 8 lần. Ước sai số lượng thì chọn sai phương tiện: tưởng ít hàng nên gọi xe máy (nested loop), ai ngờ hàng nhiều phải dùng xe tải (hash join). {{ANALYZE}} chỉ cập nhật số liệu thống kê; nó không dạy planner rằng hai cột có liên quan – việc đó là của {{CREATE STATISTICS}}.

### Thuật ngữ
- **Selectivity**: tỉ lệ dòng thoả một điều kiện (0 đến 1).
- **reltuples**: số dòng ước tính của bảng, lưu trong {{pg_class}}, cập nhật bởi ANALYZE/VACUUM.
- **MCV (most common values)**: danh sách các giá trị hay gặp nhất của cột kèm tần suất.
- **Histogram bounds**: các mốc chia phần giá trị còn lại (ngoài MCV) thành các khoảng có số dòng bằng nhau.
- **n_distinct / null_frac**: số giá trị khác nhau ước tính / tỉ lệ NULL của cột.
- **Extended statistics**: thống kê nhiều cột ({{CREATE STATISTICS}}) để mô tả quan hệ giữa các cột.
- **Generic plan / custom plan**: plan dùng chung cho mọi giá trị tham số / plan lập riêng cho giá trị cụ thể.
- **default_statistics_target**: số mục MCV và số khoảng histogram mà ANALYZE thu thập (mặc định 100).

### Mô hình ước lượng
~~~text
estimate = reltuples × sel(status='PAID') × sel(amount>1e6)        (giả định độc lập)
         = 20.000.000 × 0,30 × 0,01 = 60.000
thực tế  = 20.000.000 × 0,30 × 0,90 = 5.400.000      → lệch 90 lần
hậu quả  : planner nghĩ 60k dòng → chọn Nested Loop + Index Scan
           thực tế 5,4 triệu dòng → hàng triệu lần nhảy index, chậm hàng phút
~~~

### Planner tính thế nào
Với {{WHERE status = 'PAID' AND amount > 1000000}} trên bảng {{reltuples}} = 20 triệu:
1. {{status = 'PAID'}}: nếu 'PAID' nằm trong most common values thì lấy đúng tỉ lệ (vd 30%); nếu không nằm thì ước bằng histogram, xem thêm {{null_frac}} và {{n_distinct}}.
2. {{amount > 1000000}}: tìm mốc trong histogram rồi lấy tỉ lệ khoảng chia.
3. Nhân hai tỉ lệ: {{20.000.000 x 0,3 x 0,01 = 60.000}} – giả định **hai cột độc lập**. Nếu 90% đơn PAID đều có amount > 1.000.000 thì con số thật là 5.400.000, tức ước lượng 60.000 **thấp hơn thực tế 90 lần**.
4. Nhân kết quả với {{reltuples}} để ra số dòng ước tính của node; số này đi tiếp lên các node join/aggregate phía trên. Vì sao sai số nguy hiểm: mỗi tầng join lại nhân thêm một lần ước lượng nên sai số **cộng dồn**.

### Tình huống lệch dù statistics mới
| Tình huống | Vì sao estimate sai | Cách xử lý |
|---|---|---|
| Hai cột **tương quan** (PAID luôn đi với amount lớn) | nhân độc lập ⇒ sai số tích luỹ | {{CREATE STATISTICS st_pair (dependencies, mcv) ON status, amount FROM sales;}} rồi {{ANALYZE sales;}} (xem lưu ý bên dưới về loại điều kiện) |
| Phân phối lệch: 99% dòng là giá trị phổ biến, giá trị cần tìm nằm ngoài top MCV | giá trị ngoài MCV chỉ ước được bằng histogram trung bình | tăng {{default_statistics_target}} cho bảng hot rồi {{ANALYZE}} |
| Bulk load / đổi pattern giữa hai lần {{ANALYZE}} | thống kê mô tả quá khứ | {{ANALYZE}} sau ETL; kiểm tra {{pg_stats}} theo bảng con của partition |
| {{PreparedStatement}} thành **generic plan** | planner không biết giá trị tham số | {{SET plan_cache_mode = force_custom_plan;}} cho câu critical, hoặc viết lại bằng literal/JOIN |
| Điều kiện bọc hàm / ép kiểu ({{lower(email) = ...}}) | không có thống kê cho biểu thức đó | viết lại query SARGable, hoặc tạo index biểu thức riêng cho {{lower(email)}} (ANALYZE sẽ thu thống kê cho biểu thức của index); PostgreSQL 14+ còn cho {{CREATE STATISTICS}} trên biểu thức |
| Join nhiều bảng | sai số **nhân dồn** qua từng bước | thống kê cho cột join, viết lại query gộp, đổi thứ tự join |

- Tăng {{default_statistics_target}} (100 → 500) cho bảng truy vấn đa dạng: histogram dày hơn nhưng {{ANALYZE}} lâu hơn và catalog to hơn – chỉ làm cho vài bảng nóng.
- {{CREATE STATISTICS st_pair (dependencies, ndistinct) ON status, amount FROM sales;}} (kinds ra mắt là {{dependencies}} và {{ndistinct}} từ PostgreSQL 10, {{mcv}} từ PostgreSQL 12) cho tổ hợp cột hay xuất hiện cùng nhau, rồi {{ANALYZE sales;}} để planner đọc lại.
- Lưu ý quan trọng: thống kê {{dependencies}} chỉ được planner dùng cho điều kiện **bằng** ({{=}}, và {{IN}} từ PostgreSQL 13); với điều kiện khoảng như {{amount > 1000000}} nó không giúp gì. Khi đó kind {{mcv}} (PostgreSQL 12+) có thể giúp nếu các tổ hợp giá trị lặp lại đủ nhiều; cột liên tục như số tiền thì hiệu quả hạn chế ⇒ cân nhắc cột phân loại (ví dụ {{amount_bucket}}), partial index cho tổ hợp hay dùng, hoặc viết lại query.
- Xem nhanh thống kê: {{SELECT attname, n_distinct, most_common_vals FROM pg_stats WHERE tablename = 'sales';}}

### Ước sai có nhất thiết dẫn đến plan sai?
Không hẳn. Cost cũng được tính trên chính ước lượng đó, nên planner vẫn chọn "plan tốt nhất **theo mô hình của nó**". Vấn đề là estimate lệch lớn ⇒ plan tốt với dữ liệu giả định, đến khi dữ liệu thật đổi thì sập. Chỉ xử lý khi đồng thời thấy: lệch mạnh ở node quan trọng **và** thời gian thực tế cao.

### Lỗi hay gặp
1. **Chạy ANALYZE giữa chừng bulk insert**. Triệu chứng: thống kê nửa vời, plan "nửa vời" theo; query sáng hôm sau ETL chậm bất thường. Cách tránh: ANALYZE ngay **sau** khi nạp xong, ngay trong job ETL.
2. **Tăng statistics target cho toàn bộ database**. Triệu chứng: catalog phình, ANALYZE lâu, planning time tăng không đáng có. Cách tránh: chỉ tăng cho cột nóng: {{ALTER TABLE sales ALTER COLUMN status SET STATISTICS 500;}}.
3. **Coi ANALYZE là thuốc chữa mọi lệch estimate**. Triệu chứng: chạy ANALYZE xong vẫn lệch y nguyên. Cách tránh: nhìn vào nguyên nhân (cột tương quan, giá trị hiếm, generic plan, biểu thức) theo bảng trên.
4. **Quên rằng plan đổi theo hạ tầng**. Triệu chứng: sau khi đổi index hay thêm trigger, plan có thể đổi dù câu SQL không đổi. Cách tránh: luôn đo lại sau mỗi thay đổi hạ tầng; bật {{auto_explain}} cho query chậm.

### Trả lời miệng 1 phút
"Planner ước số dòng bằng thống kê do ANALYZE thu vào pg_stats: danh sách giá trị phổ biến, histogram, n_distinct, tỉ lệ NULL. Với mỗi điều kiện nó tính một selectivity, rồi nhân các selectivity lại với số dòng của bảng, tức là giả định các cột độc lập. Vì vậy dù thống kê mới, estimate vẫn lệch khi cột tương quan, khi giá trị cần tìm hiếm và nằm ngoài danh sách phổ biến, khi điều kiện bọc hàm, khi prepared statement chuyển sang generic plan, hoặc qua nhiều tầng join. Tôi xử lý bằng CREATE STATISTICS cho cặp cột liên quan, tăng statistics target cho đúng cột nóng, viết lại điều kiện cho SARGable, và ép custom plan cho câu quan trọng. Tôi chỉ can thiệp khi lệch lớn nằm ở node tốn thời gian thật."

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

### Hiểu nhanh
Partial index giống **cuốn sổ riêng chỉ ghi thư chưa đọc** của bưu điện: thay vì lật sổ tổng hàng trăm triệu lá thư, nhân viên mở sổ nhỏ này và tìm theo tên người nhận. Thư nào đã đọc thì tự động bị gạch khỏi sổ nhỏ, nên sổ luôn mỏng. Covering index giống **mục lục sách có ghi kèm luôn ngày xuất bản** cạnh mỗi chương: nếu bạn chỉ cần chương và ngày thì đọc mục lục là đủ, không phải lật vào từng trang. Cái bẫy: sổ nhỏ chỉ dùng được khi câu hỏi nói rõ "thư **chưa đọc**"; nếu câu hỏi là "thư có trạng thái = (một giá trị sẽ cho sau)" thì nhân viên không dám dùng sổ nhỏ.

### Thuật ngữ
- **Partial index**: index chỉ chứa các dòng thoả một điều kiện WHERE khai báo khi tạo index.
- **Predicate (của index)**: điều kiện WHERE gắn với partial index.
- **Covering index / INCLUDE**: index chứa thêm cột "hành khách" ở lá để trả lời query mà không đọc bảng; cột INCLUDE không tham gia sắp xếp.
- **Index Only Scan**: quét chỉ đọc index, không đọc heap (trừ khi visibility map chưa xác nhận trang).
- **Bind parameter ($1, ?)**: giá trị truyền vào sau khi câu SQL đã được chuẩn bị (prepared).
- **Generic plan**: plan lập một lần cho mọi giá trị tham số, nên planner không biết giá trị cụ thể.
- **CREATE INDEX CONCURRENTLY**: tạo index mà không chặn ghi, đổi lại chạy lâu hơn và có thể để lại index INVALID nếu lỗi.
- **pg_stat_user_indexes**: view thống kê số lần mỗi index được dùng ({{idx_scan}}).

### Cơ chế từng bước
1. **Lúc ghi**: mỗi INSERT/UPDATE, PostgreSQL đánh giá predicate {{is_read = false}}; dòng thoả thì thêm entry vào {{idx_msg_unread}}, không thoả thì bỏ qua. Vì sao rẻ: phần lớn tin đã đọc không tốn công ghi vào index này.
2. **Lúc lập plan**: planner kiểm tra WHERE của query có **bao hàm** (implies) predicate của index không. Vì sao bắt buộc: dùng index thiếu dòng cho một query cần cả dòng ngoài predicate sẽ trả kết quả **sai**.
3. **Lúc chạy inbox**: seek theo {{recipient_id}}, các entry đã sắp theo {{created_at DESC}} nên lấy 50 tin mới nhất là dừng.
4. **Với covering index**: lá index đã có {{created_at}}, planner chọn Index Only Scan; với trang heap chưa all-visible thì vẫn phải đọc heap để kiểm tra.

~~~text
Bảng message: 300 triệu dòng, 1% chưa đọc
index full (recipient_id, created_at)        ~ 9 GB
partial ... WHERE is_read = false            ~ 90 MB  → nằm gọn trong RAM
query: WHERE recipient_id=$1 AND is_read=false  → dùng partial index ✔
query: WHERE recipient_id=$1 AND is_read=$2     → generic plan: bỏ qua ✘
~~~

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
- Planner dùng được chỉ khi **WHERE của query bao hàm được predicate của index**:
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
-- (phía trên còn node Sort, vì cột INCLUDE không được sắp xếp)
~~~
- Lưu ý: cột trong {{INCLUDE}} **không có thứ tự** trong index, nên {{ORDER BY created_at}} vẫn cần Sort. Nếu báo cáo luôn sắp xếp hoặc lọc khoảng theo {{created_at}} thì đặt nó làm **cột khóa**: {{ON message (thread_id, created_at DESC)}} – vừa cover vừa bỏ được Sort. INCLUDE hợp với cột chỉ cần **trả về**, không dùng để lọc/sắp xếp.
- Lượt dùng index: {{SELECT relname, idx_scan FROM pg_stat_user_indexes WHERE relname = 'message';}} – {{idx_scan}} đứng yên ở 0 kéo dài thì index đó nên bị drop.
- Trước/sau: so {{actual time}}, {{Buffers}} của query đọc **và** độ trễ ghi (INSERT/UPDATE) trên bảng ghi nhiều.

### Lỗi hay gặp
1. **Predicate của query không bao hàm predicate của index**. Triệu chứng: partial index bị bỏ qua khi WHERE của query là {{WHERE is_read = false OR recipient_id = $1}}, {{WHERE COALESCE(is_read, false) = false}}… planner không chứng minh được ⇒ đành quét full. Cách tránh: viết điều kiện y hệt predicate của index, dạng hằng số.
2. **Bind tham số cho cột predicate** (ví dụ Spring Data {{findByRecipientIdAndIsRead(id, false)}} sinh {{is_read = ?}}). Triệu chứng: vài lần đầu nhanh (custom plan), nhưng nếu planner chuyển sang generic plan (hoặc cấu hình {{plan_cache_mode = force_generic_plan}}) thì chậm hẳn, rất khó tái hiện khi test tay. Cách tránh: method/{{@Query}} riêng có {{is_read = false}} viết cứng trong SQL.
3. **Chưa ANALYZE sau khi tạo index** hoặc tạo index thiếu CONCURRENTLY. Triệu chứng: planner ước số dòng sai, vẫn chọn seq scan; hoặc {{CREATE INDEX}} thường khoá ghi làm API treo. Cách tránh: bảng đang chạy phải dùng {{CONCURRENTLY}} (chạy nền, không khoá ghi) – đổi lại, nếu bị ngắt nó để lại index INVALID phải drop và làm lại; chạy ANALYZE sau đó.
4. **Kỳ vọng sai về covering index**. Triệu chứng: covering index thay được {{SELECT *}} cho cột đã cover, **không** thay được cột filter/orderBy không có trong khóa index; plan vẫn có Sort/Filter. Cách tránh: cột lọc và sắp xếp đặt ở phần khóa, cột chỉ trả về đặt ở INCLUDE.

### Trả lời miệng 1 phút
"Với inbox chưa đọc, tôi tạo partial index trên (recipient_id, created_at DESC) với WHERE is_read = false: chỉ khoảng 1% dòng vào index nên nó nhỏ, nằm gọn trong RAM, ghi cũng rẻ. Planner chỉ dùng partial index khi chứng minh được WHERE của query bao hàm predicate của index, nên nếu is_read là bind parameter, ở generic plan nó không biết giá trị và bỏ qua index; vì vậy tôi viết cứng is_read = false trong SQL. Với báo cáo theo thread, tôi dùng covering index: thread_id làm khóa, created_at ở INCLUDE, hoặc làm cột khóa nếu cần sắp xếp, để chạy Index Only Scan không chạm heap, với điều kiện autovacuum giữ visibility map tốt. Tôi kiểm chứng bằng EXPLAIN ANALYZE BUFFERS, xem Heap Fetches và idx_scan trong pg_stat_user_indexes."

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

### Hiểu nhanh
Hình dung bạn tô màu các đoạn thời gian lên một thước kẻ: điện thoại online 9h–10h, laptop online 9h30–11h, máy tính bảng 13h–14h. Phần bị tô chồng chỉ tính **một lần**, nên thời gian online thật là 9h–11h và 13h–14h, tổng 3 giờ, không phải 1 + 1,5 + 1 = 3,5 giờ. Cách làm: xếp các đoạn theo giờ bắt đầu, vừa đi vừa nhớ "điểm xa nhất mà mực đã tô tới". Đoạn mới bắt đầu **sau** điểm xa nhất đó thì có khoảng trắng ⇒ mở một vệt mới; bắt đầu trước hoặc đúng điểm đó thì nối vào vệt đang tô.

### Thuật ngữ
- **Interval**: một khoảng thời gian có điểm đầu và điểm cuối.
- **Overlapping intervals**: các khoảng có phần giao nhau.
- **Sessionization**: gộp các sự kiện/khoảng rời rạc thành phiên làm việc có nghĩa.
- **Island marker (cờ mở đảo)**: cột 0/1 đánh dấu dòng bắt đầu một nhóm mới.
- **Running max / running sum**: max hoặc tổng tích luỹ theo thứ tự, tính bằng window function có frame.
- **Frame ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING**: mọi dòng đứng trước, **không** gồm dòng hiện tại.
- **EXTRACT(EPOCH FROM interval)**: đổi một khoảng thời gian PostgreSQL thành số giây.

### Cơ chế từng bước
1. **Sắp xếp theo start_ts (rồi end_ts) trong từng user**. Vì sao: chỉ khi đi theo thứ tự bắt đầu, "đã vượt qua điểm xa nhất" mới có nghĩa là có khoảng trống.
2. **Tính prev_max_end** = max end_ts của mọi dòng phía trước. Vì sao max chứ không phải end của dòng ngay trước: một phiên dài phía trước (1–10) có thể "phủ" nhiều phiên ngắn phía sau (2–3, 5–6).
3. **Gắn cờ new_island** = 1 nếu là dòng đầu tiên hoặc {{start_ts > prev_max_end}}. Vì sao dùng {{>}}: phiên bắt đầu đúng lúc phiên trước kết thúc được coi là liền mạch và gộp lại.
4. **Cộng dồn cờ** thành {{grp}}: mỗi lần gặp cờ 1, số đảo tăng thêm 1, các dòng gộp vào giữ nguyên số đảo.
5. **GROUP BY user_id, grp**: MIN(start), MAX(end) là phiên gộp; muốn tổng online mỗi user thì {{SUM(online_seconds)}} thêm một lớp nữa.

~~~text
thời gian: 1    2    3    4    5    6 ...  10   11   12
[1,10]   : ██████████████████████████████████
[2,3]    :      █████
[5,6]    :                     █████
[11,12]  :                                       █████
đảo      : └────────────── đảo 1: [1,10] ─────┘ └đảo 2┘
online   = (10-1) + (12-11) = 10   (cộng từng dòng = 9+1+1+1 = 12, sai)
~~~

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

### Lỗi hay gặp
1. **Dùng mẹo ngày trừ row_number cho khoảng chồng lấp**. Triệu chứng: các phiên chồng nhau bị tách thành nhiều đảo, tổng thời gian sai. Cách tránh: dùng cờ {{start > max(end) trước đó}}.
2. **So với end_ts của dòng ngay trước (LAG) thay vì max tích luỹ**. Triệu chứng: với [1,10], [2,3], [5,6], dòng [5,6] so với end = 3 nên bị mở đảo mới dù vẫn nằm trong [1,10]. Cách tránh: {{MAX(end_ts) OVER (... ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING)}}.
3. **Frame có cả dòng hiện tại**. Triệu chứng: {{prev_max_end}} luôn ≥ end của chính dòng nên không bao giờ mở đảo mới, mọi phiên của user dính thành một. Cách tránh: frame kết thúc ở {{1 PRECEDING}}.
4. **Cộng duration từng dòng**. Triệu chứng: tổng online vượt 24 giờ/ngày với user dùng nhiều thiết bị. Cách tránh: gộp trước rồi mới cộng.

### Trả lời miệng 1 phút
"Với khoảng thời gian có thể chồng nhau, mẹo ngày trừ row_number không dùng được vì các khoảng không cách đều. Tôi sắp các phiên theo start_ts trong từng user và tính max end_ts của mọi dòng phía trước bằng window MAX với frame từ đầu tới dòng liền trước, không gồm dòng hiện tại. Nếu start_ts của dòng hiện tại lớn hơn max đó thì có khoảng trống, tôi gắn cờ mở đảo mới; sau đó SUM tích luỹ các cờ ra số đảo, group theo user và số đảo để lấy MIN start, MAX end. Thời gian online là bề rộng của từng đảo cộng lại, không cộng từng phiên vì phần chồng sẽ bị đếm hai lần. Trước khi chạy tôi chuẩn hoá end_ts NULL và loại phiên có end trước start, và đặt index (user_id, start_ts, end_ts) để bỏ sort."

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

### Hiểu nhanh
Hãy nghĩ tới một bảng Excel PivotTable có dòng "Subtotal" và "Grand Total": số chi tiết theo vùng–sản phẩm, rồi dòng cộng của từng vùng, cột cộng của từng sản phẩm, và ô tổng cộng ở góc. Viết 4 câu SQL rồi UNION ALL giống như in hoá đơn ra 4 lần và cộng tay 4 lần. GROUPING SETS là nói với DB một lần: "đọc dữ liệu một lượt, cộng giúp tôi theo 4 cách nhóm này". Ở các dòng tổng, ô "vùng" hay "sản phẩm" để trống (NULL) – và {{GROUPING()}} là cái nhãn nhỏ cho biết "ô này trống vì là dòng tổng", để không nhầm với dữ liệu thật bị thiếu vùng.

### Thuật ngữ
- **Grouping set**: một cách nhóm (danh sách cột) trong số nhiều cách được tính cùng lúc.
- **ROLLUP**: tạo các cấp tổng phân cấp từ chi tiết lên tổng cộng, bỏ dần cột từ phải sang trái.
- **CUBE**: tạo mọi tổ hợp nhóm có thể của các cột (2^n cấp).
- **GROUPING(col)**: trả 1 nếu cột bị gộp (dòng tổng), 0 nếu là giá trị thật.
- **Bitmask**: một số nguyên mà mỗi bit biểu diễn trạng thái bật/tắt của một cột.
- **Subtotal / grand total**: tổng con theo một chiều / tổng cộng toàn bộ.
- **Pre-aggregate**: tính sẵn tổng theo ngày vào bảng nhỏ để báo cáo đọc nhanh.

### Cơ chế từng bước
1. **Đọc và lọc dữ liệu một lần** (WHERE {{sale_date}}). Vì sao: điều kiện lọc viết một lần, mọi cấp tổng dùng chung tập dòng.
2. **Planner lập kế hoạch aggregate cho từng grouping set**: sort một lần rồi chạy GroupAggregate cho các cấp cùng thứ tự (ví dụ ROLLUP), hoặc dùng HashAggregate/MixedAggregate cho các cấp còn lại.
3. **Mỗi dòng dữ liệu được cộng vào nhiều "thùng"**: thùng (HN, Áo), thùng (HN), thùng (Áo), thùng tổng. Vì sao vẫn nhanh: chỉ đọc đĩa một lần, phần cộng thêm là CPU.
4. **Xuất kết quả**: cột không thuộc grouping set của dòng đó được điền NULL, và {{GROUPING()}} trả 1 cho cột đó.

~~~text
region | product | amount | GROUPING(region,product)
HN     | Áo      | 100    | 0  (chi tiết)
HN     | Quần    |  50    | 0
HCM    | Áo      |  70    | 0
HN     | NULL    | 150    | 1  (tổng HN)
HCM    | NULL    |  70    | 1  (tổng HCM)
NULL   | Áo      | 170    | 2  (tổng Áo)
NULL   | Quần    |  50    | 2  (tổng Quần)
NULL   | NULL    | 220    | 3  (tổng cộng)
~~~

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
- {{GROUPING(region, product)}} trả về bitmask của các cột **bị** gộp, với bit thấp nhất ứng với cột **cuối cùng** của danh sách ({{product}}): 0 = cả hai có mặt (dòng chi tiết), 1 = {{product}} bị gộp (dòng tổng theo {{region}}), 2 = {{region}} bị gộp (dòng tổng theo {{product}}), 3 = cả hai bị gộp (tổng cộng).
- Hỗ trợ: PostgreSQL/Oracle có cả ba; MySQL 8 có {{WITH ROLLUP}} và {{GROUPING()}} nhưng **không** có {{CUBE}}/{{GROUPING SETS}}.

### Hiệu năng và giới hạn
- Xem trong {{EXPLAIN}}: dữ liệu được đọc **một lần** rồi nuôi các cấp aggregate (planner có thể chạy {{GroupAggregate}} nhiều lần trên cùng thứ tự sort, hoặc dùng {{HashAggregate}}), không phải quét bảng bốn lần như bốn câu {{UNION ALL}}.
- Dữ liệu lớn và báo cáo chạy giờ cao điểm: {{GROUPING SETS}} tiết kiệm code và một lần quét, **không** tiết kiệm I/O nếu mỗi ngày cần quét 500 triệu dòng ⇒ pre-aggregate theo ngày vào bảng tổng hợp / materialized view rồi union từ bảng nhỏ.
- {{CUBE}} với 6 cột sinh **64** grouping set ({{2^n}}) – chỉ dùng khi thật sự cần mọi chiều.

### Lỗi hay gặp
Mỗi lỗi dưới đây kèm triệu chứng và cách tránh:
- **NULL thật vs NULL tổng**: không có {{GROUPING()}} thì không phân biệt được "khách không rõ vùng" với "dòng tổng của cả vùng" – lỗi số liệu kinh điển khi xuất JSON thẳng cho frontend.
- {{ORDER BY}} sau {{GROUP BY}}: dùng cột {{GROUPING(...)}} để đặt nhóm chi tiết trước dòng tổng, đừng sort theo label nếu label đã bị thay bằng "Tất cả".
- Nhầm {{ROLLUP}} hai chiều: muốn tổng theo {{product}} riêng lẻ thì phải viết {{GROUPING SETS}} hoặc {{CUBE}}, {{ROLLUP(region, product)}} không sinh ra.
- Query báo cáo không có {{WHERE}} ngày trên bảng lịch sử ⇒ quét toàn bộ dữ liệu dù planner có aggregate giỏi đến đâu.
- **Cộng lại cột amount ở frontend**: triệu chứng là tổng cộng bị gấp đôi/gấp bốn vì frontend cộng cả dòng chi tiết lẫn dòng tổng. Cách tránh: trả kèm cột {{GROUPING(...)}} (hoặc tách thành các mảng chi tiết/tổng) và thống nhất "frontend không tự cộng".

### Trả lời miệng 1 phút
"Để có tổng theo vùng và sản phẩm, tổng theo vùng, tổng theo sản phẩm và tổng cộng trong một câu, tôi dùng GROUP BY GROUPING SETS với bốn nhóm đó. DB đọc dữ liệu một lần rồi cộng mỗi dòng vào nhiều cấp tổng, thay vì bốn câu UNION ALL quét bốn lần và lặp điều kiện lọc. Ở dòng tổng, cột bị gộp là NULL, nên tôi dùng GROUPING(col) để phân biệt với NULL thật và để gắn nhãn 'Tất cả'. ROLLUP(a, b) chỉ sinh các cấp phân cấp (a,b), (a) và tổng cộng, không có cấp theo b; CUBE sinh mọi tổ hợp, 2 mũ n cấp, nên với nhiều cột thì bùng nổ. MySQL chỉ có WITH ROLLUP. Với bảng rất lớn, tôi vẫn pre-aggregate theo ngày, vì GROUPING SETS tiết kiệm số lần quét chứ không giảm lượng dữ liệu phải đọc."

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

### Hiểu nhanh
CTE giống việc bạn **nấu sẵn một nồi nước dùng** (materialize) rồi múc ra dùng cho nhiều món. Nếu cả bữa chỉ có một món cần một chén nước dùng, nấu nguyên nồi là phí – tốt hơn là nấu đúng lượng cần ngay trong món đó (inline). Trước PostgreSQL 12, bếp luôn nấu nguyên nồi, kể cả khi món ăn cuối chỉ cần một muỗng (vì vậy điều kiện lọc ở ngoài không "chui" được vào trong). Từ bản 12, bếp trưởng (planner) tự quyết: dùng một lần thì nấu ngay trong món, dùng hai lần thì nấu nồi chung. {{MATERIALIZED}} / {{NOT MATERIALIZED}} là bạn ra lệnh thẳng cho bếp trưởng.

### Thuật ngữ
- **CTE (Common Table Expression)**: truy vấn con có tên khai báo bằng {{WITH}}.
- **Optimization fence**: ranh giới planner không tối ưu xuyên qua; bên trong được tính độc lập.
- **Inline**: thay CTE bằng chính câu subquery của nó, để planner tối ưu chung với query ngoài.
- **Materialize**: tính CTE một lần, lưu kết quả tạm (tuplestore) rồi đọc lại qua node {{CTE Scan}}.
- **Predicate pushdown**: đẩy điều kiện WHERE của query ngoài xuống sát nguồn dữ liệu bên trong.
- **Volatile function**: hàm có thể trả kết quả khác nhau mỗi lần gọi ({{random()}}, {{clock_timestamp()}}) hoặc có side-effect.
- **Planning time**: thời gian planner dùng để lập kế hoạch, tách khỏi thời gian thực thi.

### Cơ chế từng bước
1. **Parser đọc WITH** và đếm số chỗ tham chiếu tới mỗi CTE.
2. **Quyết định inline hay không** theo quy tắc bên dưới. Vì sao có quy tắc: inline một CTE dùng hai lần có thể khiến nó bị tính hai lần; inline một CTE có side-effect sẽ làm thay đổi ngữ nghĩa.
3. **Nếu inline**: CTE trở thành subquery; planner đẩy điều kiện ngoài vào trong, dùng index trên bảng gốc, chọn join order tự do.
4. **Nếu materialize**: CTE được tính đầy đủ một lần vào bộ nhớ (vượt work_mem thì ghi ra đĩa); query ngoài đọc kết quả bằng {{CTE Scan}}, **không có index**.

~~~text
WITH o AS (SELECT * FROM orders)          -- orders: 50 triệu dòng
SELECT * FROM o WHERE customer_id = 42;   -- cần ~200 dòng
PG 11 (fence)     : tính 50 triệu dòng → CTE Scan lọc → ~200   (giây/phút)
PG 12+ (inline)   : Index Scan orders(customer_id=42) → ~200   (mili-giây)
WITH o AS MATERIALIZED (...) trên PG 12+ : quay lại hành vi PG 11
~~~

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
- Nếu ORM hoặc query builder (Hibernate 6 có hỗ trợ CTE trong HQL, jOOQ, QueryDSL…) sinh ra {{WITH}} tham chiếu hai lần ⇒ mặc định materialized; đừng giả định nó sẽ inline, hãy xem SQL thật trong log.

### Lỗi hay gặp
Mỗi lỗi kèm triệu chứng và cách tránh:
- **Nâng cấp PostgreSQL 12+ làm plan đổi**: query cũ có thể nhanh hơn hoặc chậm hơn dù SQL không đổi. Sau nâng cấp phải đo lại các query trọng yếu; query nào từng **cố ý** dùng CTE làm fence thì thêm {{MATERIALIZED}} trước khi nâng cấp.
- Ép {{MATERIALIZED}} sai chỗ: planner phải tính toàn bộ tập con dù query ngoài chỉ cần 1% ⇒ tốn CPU và RAM (CTE materialized nằm trong work_mem, lớn thì spill ra đĩa).
- CTE tham chiếu 2 lần + tập kết quả lớn: nhân mức tiêu thụ bộ nhớ; cân nhắc viết lại thành join với tập đã lọc.
- Plan không ổn định còn do generic/custom plan và statistics – phải loại từng nguyên nhân, đừng đổ lỗi cho CTE ngay.
- **Viết lại CTE trên MySQL theo thói quen PostgreSQL**: MySQL 8 cũng có thể merge CTE vào query ngoài hoặc materialize thành bảng tạm (do optimizer tự quyết, có hint {{MERGE}}/{{NO_MERGE}}), không có cú pháp {{MATERIALIZED}} – luôn kiểm tra bằng EXPLAIN của chính DB đó.

### Trả lời miệng 1 phút
"Trước PostgreSQL 12, mọi CTE là optimization fence: planner tính CTE một lần, lưu kết quả tạm rồi query ngoài đọc qua CTE Scan, nên điều kiện lọc bên ngoài không đẩy vào trong được và không dùng được index của bảng gốc. Từ bản 12, CTE không đệ quy, không có side-effect và chỉ được tham chiếu một lần sẽ được inline như subquery, nên planner tối ưu chung với query ngoài. Tham chiếu hai lần thì mặc định vẫn materialize để khỏi tính lại. Tôi ép MATERIALIZED khi CTE chứa aggregate nặng dùng nhiều lần hoặc khi muốn chốt plan ổn định, và NOT MATERIALIZED khi đo thấy đẩy điều kiện vào từng chỗ dùng có lợi hơn. Tôi coi CTE là công cụ cho dễ đọc, còn tối ưu thì luôn xác nhận bằng EXPLAIN ANALYZE, đặc biệt sau mỗi lần nâng cấp."

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

### Hiểu nhanh
Bạn phải kiểm 400 thùng hàng. Thuê thêm 3 người giúp thì nhanh hơn, nhưng **thuê người cũng tốn công**: gọi điện, giải thích, chia việc, rồi gom lại kết quả của từng người. Kiểm 5 thùng thì tự làm còn nhanh hơn đi thuê. Planner PostgreSQL tính đúng phép tính đó: chi phí "thuê" worker ({{parallel_setup_cost}}), chi phí "chuyển từng kết quả về" ({{parallel_tuple_cost}}), so với tiền tiết kiệm được khi chia nhỏ việc quét. Có những việc **không được phép** giao cho người ngoài (ghi dữ liệu, khoá dòng, hàm không an toàn) – khi đó dù có bao nhiêu người rảnh cũng phải tự làm.

### Thuật ngữ
- **Leader**: process backend nhận câu query; nó khởi động worker và tự làm một phần việc.
- **Parallel worker**: process nền được leader mượn để xử lý một phần dữ liệu.
- **Gather / Gather Merge**: node gom kết quả từ các worker về leader; bản Merge giữ thứ tự đã sắp xếp.
- **Partial / Finalize Aggregate**: mỗi worker tính tổng tạm trên phần của mình, leader cộng các tổng tạm lại.
- **GUC**: tham số cấu hình của PostgreSQL (đặt trong postgresql.conf hoặc bằng SET).
- **PARALLEL SAFE / RESTRICTED / UNSAFE**: nhãn cho biết hàm có chạy được trong worker hay không.
- **Oversubscription**: số process đòi CPU/IO vượt quá tài nguyên thật, làm mọi thứ chậm đi.
- **p99**: độ trễ mà 99% request nhanh hơn – thước đo "đuôi chậm" của hệ thống.

### Cơ chế từng bước
1. **Planner lập cả hai phương án**: tuần tự và song song (với số worker tính theo kích thước bảng, giới hạn bởi {{max_parallel_workers_per_gather}}). Vì sao cả hai: chỉ so chi phí mới biết cái nào rẻ.
2. **Kiểm tra điều kiện cấm**: có hàm PARALLEL UNSAFE, câu ghi, FOR UPDATE… thì loại phương án song song.
3. **Chọn phương án rẻ hơn**; nếu song song, đặt node {{Gather}} phía trên phần chia việc.
4. **Lúc chạy**: leader xin worker từ pool {{max_parallel_workers}}; worker chia nhau các block của bảng (Parallel Seq Scan), mỗi worker tính Partial Aggregate.
5. **Gom kết quả**: Gather nhận các dòng/tổng tạm, leader làm Finalize Aggregate. Thiếu worker thì leader tự làm phần còn lại.

~~~text
Không song song:  [leader] quét 400 triệu dòng ───────────────── 60 s
Song song 4+1  :  [leader ] quét ~80tr ─┐
                  [worker1] quét ~80tr ─┤
                  [worker2] quét ~80tr ─┼─► Gather → Finalize ── ~14 s
                  [worker3] quét ~80tr ─┤   (không đạt 60/5 = 12 s vì
                  [worker4] quét ~80tr ─┘    chi phí gom + tranh chấp I/O)
~~~

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
- Đĩa chậm hoặc IOPS có hạn: nhiều worker cùng đọc làm **tranh chấp** I/O, tổng thời gian tệ hơn.
- **Oversubscription**: 32 connection mỗi câu spawn 4 worker trên 8 core ⇒ hàng trăm process tranh CPU/đĩa, p99 tăng. Đây là tai nạn tôi thấy nhiều nhất khi team "bật parallel cho mọi thứ".

### Quy trình làm việc
1. {{EXPLAIN (ANALYZE, BUFFERS)}}: có node {{Gather}} không, {{Workers Launched}} bao nhiêu, thời gian node gốc là bao nhiêu.
2. Thử có kiểm soát: {{SET max_parallel_workers_per_gather = 4;}} rồi so {{actual time}}; không tốt hơn thì trả về mặc định, và xem {{pg_stat_activity}} để biết bao nhiêu worker đang chạy song song.
3. Nếu query chậm vì quét **quá nhiều dòng** thì parallel chỉ chia nỗi khổ – hướng đúng là thu hẹp dữ liệu: filter đúng cột, partition pruning, index, pre-aggregate.

### Lỗi hay gặp
1. **Hàm tự viết không khai báo PARALLEL SAFE**. Triệu chứng: query gọi hàm format/convert tự viết luôn chạy một worker dù bảng khổng lồ. Cách tránh: kiểm tra {{proparallel}} trong {{pg_proc}}; chỉ {{ALTER FUNCTION … PARALLEL SAFE}} khi hàm không ghi dữ liệu, không dùng biến session/temp table.
2. **Workers Launched nhỏ hơn Workers Planned**. Triệu chứng: plan đẹp trên staging nhưng production giờ cao điểm chậm vì hết worker trong pool. Cách tránh: theo dõi số worker đang chạy, cân đối {{max_parallel_workers}} với số core và số connection.
3. **Ép parallel toàn hệ thống** (đặt cost về 0, tăng workers_per_gather cho mọi session). Triệu chứng: CPU 100%, p99 của API OLTP tăng gấp đôi. Cách tránh: chỉ bật mức cao cho session/role chạy báo cáo ({{ALTER ROLE report_user SET max_parallel_workers_per_gather = 4;}}).
4. **Đọc báo cáo qua cursor/stream của JDBC**. Triệu chứng: plan không song song dù chạy tay thì có. Cách tránh: biết rằng query chạy qua cursor (ví dụ JDBC fetchSize với autocommit tắt) có thể không được dùng parallel; kiểm tra bằng {{auto_explain}} trên đúng đường đi của ứng dụng.

### Trả lời miệng 1 phút
"Parallel query trong PostgreSQL là quyết định dựa trên chi phí: planner so phương án tuần tự với phương án chia việc cho nhiều worker, có tính chi phí khởi động worker và chi phí chuyển từng dòng về leader qua node Gather; bảng nhỏ hơn min_parallel_table_scan_size hay query trả ít dòng thì tuần tự rẻ hơn. Có những thứ cấm song song: câu ghi dữ liệu, FOR UPDATE, hàm bị đánh dấu PARALLEL UNSAFE mà hàm tự viết mặc định là vậy, và một số aggregate không chia được. Khi chỉ thấy một worker, tôi kiểm tra plan có Gather không, Workers Launched bao nhiêu, hàm nào unsafe, rồi thử tăng max_parallel_workers_per_gather cho riêng session báo cáo và đo lại. Tôi không ép parallel cho hệ OLTP nhiều connection, vì oversubscription làm p99 tệ đi, và ưu tiên giảm lượng dữ liệu phải quét trước."

> Senior tip: "nhiều core rảnh" chưa bao giờ là lý do để ép parallel. Tôi từng chứng kiến đội hạ tầng đặt chi phí parallel về 0 cho hệ 32 connection trên 8 core ⇒ mỗi câu bung worker, tổng process vượt sức máy, p99 chậm gấp đôi. Nguyên tắc của tôi: đo bằng {{EXPLAIN (ANALYZE)}}, theo dõi số worker chạy đồng thời, và nhớ rằng parallel query là **thuật toán chia việc** chứ không phải đòn bẩy tăng tốc tất yếu.`,
  follow: [
    '{{Gather}} và {{Gather Merge}} khác nhau khi nào, vì sao cần bản merge?',
    'Khi nào thì việc đánh dấu hàm {{PARALLEL SAFE}} là sai lầm?'
  ],
  tags: ['parallel query', 'Gather', 'PostgreSQL', 'performance', 'planner'],
}
);
