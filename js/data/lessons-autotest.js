/* Lessons track autotest: automation test mô phỏng bằng Java thuần (fake DOM, fake clock, mini runner). Format: AGENTS.md mục 12 */
(window.LESSONS = window.LESSONS || []).push(
{
  id: 'lesson-autotest-001',
  track: 'autotest',
  order: 1,
  title: 'Automation test là gì, kim tự tháp test và kỹ thuật thiết kế ca kiểm thử',
  level: 'mid',
  minutes: 30,
  goals: [
    'Phân biệt manual vs automation và tính được ROI của một script tự động',
    'Áp dụng equivalence partitioning và boundary value analysis để chọn bộ input tối thiểu mà vẫn phủ',
    'Đọc decision table, hiểu ký hiệu don\'t care và sinh bộ ca kiểm thử phủ hết rule',
    'Nói được smoke / sanity / regression suite và vai trò QA vs SDET trong team',
  ],
  body: `### Manual test và automation test là gì
**Kiểm thử (testing)** = chạy chương trình với đầu vào cho trước rồi so **kết quả thực tế** với **kết quả mong đợi (expected result)**. Một **ca kiểm thử (test case)** gồm: tiền điều kiện, các bước thao tác, dữ liệu và kết quả mong đợi.

**Manual test**: người thật bấm theo checklist. **Automation test**: một chương trình (script) làm thay — mở trình duyệt hoặc gọi HTTP, nhập liệu, bấm nút, đọc kết quả rồi so với mong đợi và in **PASS/FAIL**. Script chạy được nhiều lần, nhiều môi trường mà không cần người — đó là toàn bản chất của nó: **phóng đại sức lao động trí óc thành chạy lặp**.

| Khía cạnh | Manual | Automation |
|---|---|---|
| Chi phí mỗi lần chạy | thời gian người test | gần 0 sau khi viết xong script |
| Bắt lỗi mới, lạ, cảm tính (usability) | rất tốt | gần như không |
| Chạy lại bộ regression 500 ca mỗi tuần | bất khả thi về người | chuyện thường |
| Dễ sai sót khi lặp lại | cao (mệt, nhầm bước) | 0 (máy lặp y hệt) |

### ROI: vì sao không tự động hoá tất cả
Chi phí một test tự động = **viết + bảo trì + chạy/hosting CI**; lợi ích = **thời gian tiết kiệm × số lần chạy + số lỗi bắt được sớm hơn**. Ví dụ có số: luồng đăng nhập test tay mất 1 giờ; script mất 4 giờ viết, cộng ~2 giờ/năm sửa khi UI đổi, mỗi lần chạy trong CI (Continuous Integration — hệ thống tự build + chạy test mỗi lần push code) mất 15 phút. Nếu suite chạy ~100 lần/năm thì tiết kiệm ~100 giờ cho 6 giờ bỏ ra — lãi rõ. Ngược lại một ca chỉ chạy 1 lần/năm thì lỗ nặng.

Ba tiêu chí để quyết định **đáng tự động hoá**: chạy **nhiều lần** ( regression), đối tượng **ổn định** (API/giao diện ít đổi), kết quả **xác định được bằng code** (đúng/sai rõ). Không đáng: đánh giá trải nghiệm, luồng mới toanh có thể bị xoá sprint sau, test một lần.

### Kim tự tháp test: tự động hoá tầng nào
~~~text
        / UI E2E \         ít, chậm, đắt bảo trì — chỉ luồng sống còn
       / API / integration \   vừa: nhanh hơn UI, phủ nghiệp vụ lõi
      /  unit tests (rộng nhất)  mili-giây, chạy mọi commit
~~~

- **Unit test** (dev viết, JUnit 5): test một hàm/lớp cô lập, không chạm DB/mạng. Ví dụ: hàm tính phí giao dịch.
- **API/integration test** (QA/SDET viết, hay dùng REST Assured): gọi HTTP thật tới service, kiểm tra status code + body, không cần giao diện. Ổn định hơn UI vì API đổi chậm hơn CSS.
- **UI E2E** (Selenium/Playwright): giả lập người dùng click xuyên màn hình. Bao quát nhất nhưng chậm và vỡ nhanh nhất khi UI đổi.

Ba loại suite hay bị lẫn: **smoke suite** là vài ca nhanh nhất kiểm "hệ thống còn sống không" (login + mở trang chủ + đặt được 1 đơn), chạy trước mọi suite khác; **sanity check** là kiểm nhanh một nhóm chức năng vừa sửa có chạy được không; **regression suite** là bộ đầy đủ chạy lại toàn bộ để bảo đảm sửa cái mới không làm hỏng cái cũ.

Automation sống trong pipeline CI — luồng giữa nhiều hệ thống như sau:

~~~seq
title: Pipeline CI cua suite automation
actors: Dev | CI Runner | App | Test Suite
Dev -> CI Runner: push code len branch
CI Runner -> App: build va khoi dong service
CI Runner -> Test Suite: chay unit roi API test
Test Suite -> App: goi HTTP that va UI smoke
Test Suite --> CI Runner: bao cao PASS/FAIL
CI Runner --> Dev: ket qua sau 10 phut
note CI Runner..Test Suite: UI E2E chi chay dem dem de tranh nghet CI
~~~

### Vai trò QA và SDET
**QA (Quality Assurance)** thiết kế ca kiểm thử, test khám phá (exploratory — tester tự do dò theo kinh nghiệm), đứng phía chất lượng sản phẩm. **SDET (Software Development Engineer in Test)** là lập trình viên viết **hạ tầng test**: framework, page object, driver CI, công cụ dữ liệu test, báo cáo (Allure). Dev Java 4 năm chuyển sang SDET có lợi thế lớn: framework bản chất là OOP + design pattern (strategy cho wait, facade cho page object) — bạn đã có sẵn ngôn ngữ, chỉ thiếu ngữ cảnh trình duyệt.

### Thiết kế ca kiểm thử: đừng test theo cảm tính
Automation nhân giá trị của ca kiểm thử tốt — và nhân chi phí của ca kiểm thử tệ. Ba kỹ thuật nền:

**1. Equivalence partitioning (EP — phân vùng tương đương).** Gom input thành các **lớp** mà hệ thống xử lý như nhau; mỗi lớp chỉ cần 1 đại diện. Form đăng ký: tuổi hợp lệ 18–60 chia thành 3 lớp {nhỏ hơn 18: chặn}, {18–60: chấp nhận}, {lớn hơn 60: chặn}. Mật khẩu 8–64 ký tự cũng 3 lớp. Không cần thử tuổi 20, 25, 31, 44 — cùng một lớp thì một đại diện là đủ.

**2. Boundary value analysis (BVA — phân tích giá trị biên).** Bug tập trung ở **biên** vì hay sai dấu so sánh (< thay vì ≤, off-by-one). Với khoảng đóng [min, max], lấy 7 điểm biên:

~~~text
tuoi:   ... 17  18  19 ... 39 ... 59  60  61 ...
        invalid| valid begin |  | valid end |invalid
        min-1    min   min+1  mid         max-1 max  max+1
~~~

**3. Decision table (bảng quyết định).** Khi kết quả phụ thuộc **tổ hợp nhiều điều kiện**, liệt kê rule và sinh case từ rule — tránh quên tổ hợp. Form đăng ký với 3 điều kiện:

| Rule | age_ok | pw_ok | terms_ok | Kết quả |
|---|---|---|---|---|
| R1 | T | T | T | chấp nhận |
| R2 | F | - | - | từ chối: tuổi |
| R3 | - | F | - | từ chối: mật khẩu |
| R4 | - | - | F | từ chối: thiếu đồng ý |

Dấu **-** (don't care) nghĩa là điều kiện đó không ảnh hưởng kết quả của rule — một dòng rule phủ nhiều tổ hợp, nên bộ case tối thiểu chỉ bằng số rule, thay vì 2 mũ 3 = 8 tổ hợp.

### Lỗi hay gặp
- Chỉ test **happy path** (đường đi đúng), bỏ hết biên và lớp invalid — nơi lỗi thật trú ngụ.
- Test **mọi tổ hợp**: 3 field × 3 lớp = 27 ca; EP + BVA rút còn ~10 ca mà độ phủ tương đương.
- "Cơ học hoá Excel": bê nguyên 500 dòng checklist thủ công thành 500 script không ai bảo trì.
- Script **PASS mà không kiểm gì**: thiếu assert, hoặc chỉ so "mở được trang".

### Liên hệ phỏng vấn
Câu hỏi điển hình: "Bạn bắt đầu automation từ đâu?", "Vì sao không tự động hoá 100% manual suite?", "Kể một bug mà BVA bắt được". Công thức trả lời: nêu tiêu chí chọn đối tượng (tần suất × ổn định × rõ kết quả), dẫn kim tự tháp, cho một con số thật (thời gian suite, số lần chạy/tuần). Trả lời được ROI bằng số liệu luôn ghi điểm với vị trí SDET.

> Senior tip: đề xuất của người phỏng vấn muốn nghe thường là "chậm mà chắc": bắt đầu bằng 5–10 API smoke test chạy trong CI mỗi commit, chứng minh giá trị, rồi mới mở rộng sang UI. Tự động hoá 100% ngay tuần đầu là cách nhanh nhất để suite bị tắt sau tháng thứ hai.`,
  exercises: [
    {
      title: 'Máy sinh ca biên và mở rộng decision table',
      prompt: `Viết class {{TestDesign}} với 2 hàm tĩnh để sinh bộ ca kiểm thử tối thiểu cho form đăng ký (tuổi 18–60, mật khẩu 8–64 ký tự).

**1.** {{boundaries(min, max)}}: trả về mảng **đúng 7 giá trị theo thứ tự**: {{min-1, min, min+1, mid, max-1, max, max+1}} với {{mid = (min + max) / 2}} (phép chia số nguyên). Nếu {{min >= max}} thì ném {{IllegalArgumentException}}.

**2.** {{expandRules(rules)}}: nhận một danh sách rule decision table; mỗi rule là chuỗi các token cách nhau bởi khoảng trắng, token thuộc {{"T"}} (đúng), {{"F"}} (sai), {{"D"}} (don't care). Biến mỗi rule thành **hàng cụ thể** bằng cách thay mọi {{"D"}} bằng {{"T"}}, giữ nguyên thứ tự input và **xoá hàng trùng** (giữ lần xuất hiện đầu tiên). Trả về danh sách chuỗi các token đã cách nhau bởi một dấu cách.

Ví dụ: rules = [{{"T T D", "T F F", "T T T"}}] → kết quả = [{{"T T T", "T F F"}}] (hàng thứ 3 trùng hàng thứ 1 sau khi điền D).`,
      starter: `final class TestDesign {
    static int[] boundaries(int min, int max) {
        throw new UnsupportedOperationException("TODO");
    }

    static List<String> expandRules(List<String> rules) {
        throw new UnsupportedOperationException("TODO");
    }
}`,
      tests: `public class Main {
    static int passed = 0, total = 0;
    static void check(String name, boolean ok, String detail) {
        total++;
        if (ok) { passed++; System.out.println("PASS " + name); }
        else System.out.println("FAIL " + name + ": " + detail);
    }
    public static void main(String[] args) {
        check("boundary tuoi 18-60", Arrays.equals(TestDesign.boundaries(18, 60), new int[] {17, 18, 19, 39, 59, 60, 61}),
            "got " + Arrays.toString(TestDesign.boundaries(18, 60)));
        check("boundary mat khau 8-64", Arrays.equals(TestDesign.boundaries(8, 64), new int[] {7, 8, 9, 36, 63, 64, 65}),
            "got " + Arrays.toString(TestDesign.boundaries(8, 64)));
        String thrown = "";
        try { TestDesign.boundaries(18, 18); thrown = "khong nem"; }
        catch (IllegalArgumentException e) { thrown = "iae"; }
        catch (Exception e) { thrown = "sai loai: " + e.getClass().getSimpleName(); }
        check("min >= max nem IllegalArgumentException", "iae".equals(thrown), thrown);
        check("D được điền bằng T", TestDesign.expandRules(List.of("T T D", "T F F")).equals(List.of("T T T", "T F F")),
            "got " + TestDesign.expandRules(List.of("T T D", "T F F")));
        check("loai hang trung giu lan dau", TestDesign.expandRules(List.of("T D F", "T T F", "D D D")).equals(List.of("T T F", "T T T")),
            "got " + TestDesign.expandRules(List.of("T D F", "T T F", "D D D")));
        check("rule khong co D giu nguyen", TestDesign.expandRules(List.of("F T", "T F")).equals(List.of("F T", "T F")),
            "got " + TestDesign.expandRules(List.of("F T", "T F")));
        check("toan D thanh 1 hang day T", TestDesign.expandRules(List.of("D D D")).equals(List.of("T T T")),
            "got " + TestDesign.expandRules(List.of("D D D")));
        check("số hàng bằng số rule không trùng", TestDesign.expandRules(List.of("T D", "D T", "F F", "T T")).size() == 2,
            "got " + TestDesign.expandRules(List.of("T D", "D T", "F F", "T T")));
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
      reference: `final class TestDesign {
    static int[] boundaries(int min, int max) {
        if (min >= max) throw new IllegalArgumentException("min phai nho hon max");
        int mid = (min + max) / 2;
        return new int[] {min - 1, min, min + 1, mid, max - 1, max, max + 1};
    }

    static List<String> expandRules(List<String> rules) {
        Set<String> rows = new LinkedHashSet<>();
        for (String rule : rules) {
            String[] tokens = rule.trim().split(" +");
            StringBuilder sb = new StringBuilder();
            for (int i = 0; i < tokens.length; i++) {
                if (i > 0) sb.append(' ');
                sb.append(tokens[i].equals("D") ? "T" : tokens[i]);
            }
            rows.add(sb.toString());
        }
        return new ArrayList<>(rows);
    }
}`,
      hints: [
        'Boundaries: dùng cú pháp mảng khai báo của Java (new int[] rồi liệt kê phần tử trong cặp móc); mid là phép chia số nguyên {{(min + max) / 2}}.',
        'Decision table: dùng {{LinkedHashSet}} để vừa loại trùng vừa giữ thứ tự thêm vào, cuối cùng bọc bằng {{new ArrayList<>(set)}}.',
        'Tách rule bằng {{rule.trim().split(" +")}} (regex "một hoặc nhiều dấu cách"); nối lại bằng một dấu cách.',
      ],
      explain: `{{LinkedHashSet}} là mấu chốt của câu 2: nó loại trùng như {{HashSet}} nhưng giữ **thứ tự chèn đầu tiên**, đúng yêu cầu "giữ lần xuất hiện đầu tiên". Đây cũng là mô hình đúng của decision table: mỗi rule chỉ cần **một** hàng chứng minh — các hàng trùng không thêm thông tin.

Lỗi hay gặp với boundaries: quên rằng {{mid}} có thể trùng biên khi {{max - min}} nhỏ, hoặc nhầm điều kiện ném {{IllegalArgumentException}} (phải là {{min >= max}}, chứ không chỉ {{min > max}}). Trong phỏng vấn, người ta hay hỏi tiếp: "Còn input kiểu chuỗi/date thì biên là gì?" — nguyên tắc chung vẫn là giá trị ngay trước / tại / ngay sau ngưỡng chuyển xử lý.`,
    },
  ],
  check: [
    {
      q: 'Theo BVA, với trường văn bản chấp nhận độ dài 8–64 ký tự, bộ 7 giá trị biên kinh điển là?',
      options: ['7, 8, 9, 36, 63, 64, 65', '8, 16, 24, 32, 40, 48, 64', 'chỉ cần 7, 36, 65', 'chỉ cần 8 và 64'],
      answer: 0,
      explain: 'min−1, min, min+1, một giá trị giữa khoảng, max−1, max, max+1. Các giá trị trong lòng một equivalence class chỉ cần một đại diện, nhưng **biên** phải thử cả hai phía.',
    },
    {
      q: 'Ý chính của equivalence partitioning là gì?',
      options: [
        'Chia nhỏ test để chạy song song cho nhanh',
        'Gom input thành các lớp được xử lý như nhau, mỗi lớp chỉ cần một đại diện',
        'Sinh input ngẫu nhiên rồi ghi lại kết quả làm chuẩn',
        'Test mọi tổ hợp giá trị để không sót',
      ],
      answer: 1,
      explain: 'EP giả định hệ thống đối xử như nhau với mọi giá trị trong cùng lớp, nên 1 đại diện/lớp là đủ — nhờ đó giảm 27 tổ hợp còn vài ca mà độ phủ không đổi. Kiểm chứng giả định này chính là lý do BVA tồn tại.',
    },
    {
      q: 'Trong decision table, ký hiệu "-" (don\'t care) ở ô điều kiện nghĩa là gì?',
      options: [
        'Điều kiện luôn sai khi chạy',
        'Không quan tâm điều kiện đó đúng hay sai — kết quả của rule không đổi',
        'Điều kiện bị lỗi nên bỏ qua',
        'Cả dòng rule bị vô hiệu',
      ],
      answer: 1,
      explain: 'Don\'t care cho phép một dòng rule đại diện nhiều tổ hợp; khi triển khai thành ca kiểm thử, bạn điền tuỳ ý (bài tập trên quy ước điền T) để có bộ case tối thiểu phủ hết rule.',
    },
    {
      q: 'Tình huống nào có ROI automation **kém nhất**?',
      options: [
        'Smoke suite chạy ở mỗi build CI',
        'Regression API suite chạy hàng đêm',
        'Test khám phá giao diện mới sẽ bị redesign sprint tới',
        'Check luồng thanh toán core trước mỗi release',
      ],
      answer: 2,
      explain: 'Automation có lãi khi chạy lặp trên đối tượng ổn định. UI mới thay đổi liên tục chi phí bảo trì (sửa locator, sửa flow) sẽ ăn hết lợi ích — để manual/exploratory, chỉ tự động hoá khi nó ổn định.',
    },
  ],
  related: ['autotest-001'],
  tags: ['automation', 'test pyramid', 'equivalence partitioning', 'boundary value', 'decision table', 'ROI', 'SDET'],
},
{
  id: 'lesson-autotest-002',
  track: 'autotest',
  order: 2,
  title: 'Locator: id, CSS, XPath, data-testid — và vì sao locator vỡ',
  level: 'mid',
  minutes: 30,
  goals: [
    'Giải thích DOM là cây và trình duyệt tìm phần tử theo selector như thế nào',
    'So sánh độ bền của id, CSS, XPath, data-testid và getByRole với ví dụ thật',
    'Viết được CSS selector nhiều tầng và XPath có predicate',
    'Nêu được ít nhất 3 nguyên nhân locator vỡ và cách phòng',
  ],
  body: `### DOM: cái cây mà trình duyệt tìm phần tử trong đó
Khi tải trang, trình duyệt phân tích HTML thành **DOM (Document Object Model)** — một **cây node**: mỗi thẻ là một node có nhãn ({{tag}}), các **attribute** ({{id}}, {{class}}, {{type}}, {{href}}...) và node con. Ví dụ:

~~~text
html
 └─ body
     └─ div#app.shell
         ├─ nav.menu
         │   └─ a[href=/home]
         └─ form.login
             ├─ input#user[type=text]
             └─ button#submit.btn.primary
~~~

**Locator** (bộ định vị) là một chuỗi **selector** mô tả "node nào trong cây". Automation engine đi qua cây, node nào khớp thì trả về. Điều đó giải thích mọi thứ về locator: selector càng **ít phụ thuộc vào hình dạng hiện tại của cây** thì càng bền.

### Selenium: các loại By và độ bền
~~~java
driver.findElement(By.id("submit"));                              // nhanh nhat: getElementById
driver.findElement(By.cssSelector("form.login button.primary"));  // querySelectorAll cua trinh duyet
driver.findElement(By.xpath("//form[@class='login']//button"));   // XPath: tim theo canay va duong dan
driver.findElement(By.name("email"));                             // attribute name — form legacy
driver.findElement(By.linkText("Đăng nhập"));                     // chi dung cho the a, so text nguyen van
~~~

| Loại | Ví dụ | Độ bền | Ghi chú |
|---|---|---|---|
| id tĩnh | {{By.id("submit")}} | cao | id sinh động ({{id-18392}}) còn tệ hơn class |
| CSS thuộc tính ngữ nghĩa | {{button\[type=submit\]}} | cao | selector "nhìn như HTML viết ra" |
| XPath | {{//div\[@role='dialog'\]//button}} | trung bình | mạnh nhất nhưng dễ tuyệt đối hoá |
| text | {{By.linkText("Thêm vào giỏ")}} | thấp | đổi wording / đa ngôn ngữ là vỡ |
| class từ framework CSS | {{.css-1x9k2b}} | rất thấp | build lại là đổi tên |
| **data-testid** | {{\[data-testid=checkout-btn\]}} | **cao nhất** | do team chủ động gắn, không dùng cho style |

**CSS selector** đọc từ trái sang phải: {{tag}} trần khớp nhãn, {{#id}} khớp attribute id, {{.class}} khớp một token trong attribute class ({{class="btn primary"}} khớp cả {{.btn}} lẫn {{.primary}}), {{\[k=v\]}} khớp attribute k bằng v; các phần ghép liền nhau là **AND** ({{button#submit.primary}}), ghép cách nhau dấu cách là **con cháu** ({{form button}} = mọi button nằm trong form, bất kỳ độ sâu).

**XPath** cho phép những gì CSS cổ điển không có: đi lên ({{//button/ancestor::form}}), chọn theo vị trí ({{(//li)\[2\]}}), khớp theo nội dung text ({{//span\[text()='Tổng'\]}}), {{contains()}}, và khớp attribute bất kỳ với {{@}}. Sức mạnh đó cũng là cái bẫy — vì nó mời bạn viết đường dẫn tuyệt đối.

### Vì sao locator vỡ: 4 thủ phạm
1. **Đường dẫn tuyệt đối**: {{/html/body/div\[3\]/button\[1\]}} — thêm một banner ở trên là lệch chỉ số, vỡ âm thầm hoặc ném {{NoSuchElementException}} (không tìm thấy phần tử). Đây là kiểu locator bị ghét nhất trong review code automation.
2. **Class do build sinh ra**: styled-components / CSS modules sinh {{css-1x9k2b}} — mỗi lần build có thể đổi tên.
3. **id động**: form dùng id tự sinh ({{input_58f2}}) theo counter/uuid — đổi số field khác là đổi id.
4. **Text hiển thị**: thêm một khoảng trắng, đổi hoa thường, switch ngôn ngữ — locator theo text chết.

**Phòng bệnh**: ưu tiên định danh **có chủ đích cho test** — attribute {{data-testid}}. Frontend (React/Vue) gắn thuộc tính {{data-testid="checkout-btn"}} ngay vào component, tester viết {{\[data-testid=checkout-btn\]}}; pipeline production có thể cấu hình loại bỏ thuộc tính này để không lộ ra ngoài. Chiến lược thực dụng khi không được gắn testid: **id ngữ nghĩa → CSS thuộc tính → XPath ngắn có predicate → text** là lựa cuối.

### Playwright: locator theo con mắt người dùng
Playwright for Java cổ vũ locator dựa trên **accessibility role** — đúng cái người dùng (và công cụ hỗ trợ đọc màn hình) nhìn thấy:

~~~java
page.getByRole(AriaRole.BUTTON, new Page.GetByRoleOptions().setName("Đăng nhập")).click();
page.getByLabel("Email").fill("bean@example.com");
page.getByTestId("checkout-btn").click();
~~~

{{getByRole}} khớp vai trò (button, textbox, link...) + tên hiển thị — đổi class không sao, đổi **chữ trên nút** thì có (phải đồng bộ wording với team frontend). Khác biệt kiến trúc: Selenium {{findElement}} **chụp ảnh ngay** — trả về một object chỉ node tại thời điểm gọi; Playwright {{Locator}} là **mô tả lười** (lazy) — chỉ phân giải khi hành động chạy, vì thế nó tự tìm lại phần tử sau mỗi lần DOM đổi (nền tảng của auto-wait — bài sau).

### Lỗi hay gặp
- Một phần tử khớp selector nhưng **nhiều hơn một** node cùng khớp: {{findElement}} trả node đầu — test click nhầm node, "flaky" khó hiểu. Playwright bắt lỗi này: selector khớp nhiều node thì action fail ngay với thông báo rõ ràng.
- Quên selector nằm trong **iframe**: phải {{driver.switchTo().frame(...)}} trước, vì mỗi iframe là một cây DOM riêng.
- Copy selector từ DevTools bằng "Copy XPath" — sinh ra đường dẫn tuyệt đối xấu nhất có thể.

### Liên hệ phỏng vấn
Câu kinh điển: "Locator nào bền nhất và vì sao?" — trả lời theo nguyên tắc chứ không theo danh sách: locator bền nhất là locator **ít thông tin không liên quan đến ý nghĩa** nhất, và do team chủ động đặt cho test (data-testid). Khi bị hỏi "UI đổi liên tục, suite của bạn sống sót thế nào", các ý ghi điểm: gắn testid vào component, gom locator một chỗ trong page object (bài 4), chạy báo cáo locator-broken khi fail để biết vỡ ở đâu.

> Senior tip: đề xuất gắn {{data-testid}} phải kèm cam kết cắt nó khỏi bundle production; nếu không, reviewer frontend sẽ chặn vì lo lộ cấu trúc DOM. Cách thương lượng được việc: "testid là API contract giữa UI và test, tôi chịu trách nhiệm sửa test khi nó đổi".`,
  exercises: [
    {
      title: 'Tự viết bộ định vị CSS subset trên fake DOM',
      prompt: `Cho {{DomNode}} mô phỏng một node DOM: {{tag}}, {{attrs}} (Map id/class/type/href...), {{children}}. Viết {{Locator.css(root, selector)}} trả về **danh sách node khớp, theo thứ tự tài liệu** (đệ quy sâu trước: node trước, rồi con của nó...).

Ngôn ngữ selector (tập con của CSS, phân biệt hoa thường):

- Selector gồm các **segment** cách nhau bởi dấu cách: quan hệ **con cháu** (descendant) — node khớp segment cuối phải nằm trong cây con của node khớp segment trước.
- Một segment = phần tổ hợp (compound): tùy chọn {{tag}} đứng đầu + {{#id}} + {{.class}} + {{\[attr=value\]}}, tất cả là **AND**. {{.class}} khớp nếu giá trị nằm trong attribute {{class}} tách theo dấu cách.
- Ví dụ trên cây trong phần ví dụ: {{css(root, "form button")}} trả về các button nằm trong form ở mọi độ sâu; {{css(root, "#submit")}} trả đúng node có {{id=submit}}.

Không cần hỗ trợ selector khác (">", ",", tiền tố *, value có dấu nháy...). Trả {{List.of()}} (danh sách rỗng) nếu không có node khớp.

{{DomNode}} và chữ ký hàm đã cho sẵn; chỉ viết phần thân {{Locator.css}} (được phép thêm hàm private).`,
      starter: `final class DomNode {
    final String tag;
    final Map<String, String> attrs;
    final List<DomNode> children;

    DomNode(String tag) {
        this(tag, Map.of(), List.of());
    }

    DomNode(String tag, Map<String, String> attrs, List<DomNode> children) {
        this.tag = tag;
        this.attrs = attrs;
        this.children = children;
    }
}

final class Locator {
    static List<DomNode> css(DomNode root, String selector) {
        throw new UnsupportedOperationException("TODO");
    }
}`,
      tests: `public class Main {
    static int passed = 0, total = 0;
    static void check(String name, boolean ok, String detail) {
        total++;
        if (ok) { passed++; System.out.println("PASS " + name); }
        else System.out.println("FAIL " + name + ": " + detail);
    }
    public static void main(String[] args) {
        DomNode submit = new DomNode("button", Map.of("id", "submit", "class", "btn primary"), List.of());
        DomNode user = new DomNode("input", Map.of("id", "user", "type", "text"), List.of());
        DomNode email = new DomNode("input", Map.of("id", "email", "type", "email"), List.of());
        DomNode help = new DomNode("span", Map.of("class", "help btn"), List.of());
        DomNode form = new DomNode("form", Map.of("class", "login"), List.of(user, email, submit, help));
        DomNode homeLink = new DomNode("a", Map.of("href", "/home"), List.of());
        DomNode teamLink = new DomNode("a", Map.of("href", "/team"), List.of());
        DomNode nav = new DomNode("nav", Map.of("class", "menu"), List.of(homeLink, teamLink));
        DomNode support = new DomNode("button", Map.of("class", "btn secondary"), List.of());
        DomNode footer = new DomNode("footer", Map.of(), List.of(support));
        DomNode app = new DomNode("div", Map.of("id", "app", "class", "shell"), List.of(nav, form));
        DomNode root = new DomNode("body", Map.of(), List.of(app, footer));

        List<DomNode> buttons = Locator.css(root, "button");
        check("loc theo tag tra dung danh sach theo thu tu tai lieu",
            buttons.size() == 2 && buttons.get(0) == submit && buttons.get(1) == support, "got " + buttons.size());
        List<DomNode> byId = Locator.css(root, "#submit");
        check("loc theo id", byId.size() == 1 && byId.get(0) == submit, "got " + byId.size());
        List<DomNode> byClass = Locator.css(root, ".btn");
        check("class khop token trong class attribute",
            byClass.size() == 3 && byClass.get(0) == submit && byClass.get(1) == help && byClass.get(2) == support,
            "got " + byClass.size());
        List<DomNode> byAttr = Locator.css(root, "input[type=email]");
        check("AND giua tag va attr", byAttr.size() == 1 && byAttr.get(0) == email, "got " + byAttr.size());
        List<DomNode> inForm = Locator.css(root, "form button");
        check("descendant loai button ngoai form", inForm.size() == 1 && inForm.get(0) == submit, "got " + inForm.size());
        List<DomNode> chain = Locator.css(root, "div#app form.login #submit");
        check("chuoi 3 segment", chain.size() == 1 && chain.get(0) == submit, "got " + chain.size());
        List<DomNode> none = Locator.css(root, "form a");
        check("không có thì trả danh sách rỗng", none.isEmpty(), "got " + none.size());
        List<DomNode> footBtn = Locator.css(root, "footer .btn");
        check("pham vi bi cha gioi han", footBtn.size() == 1 && footBtn.get(0) == support, "got " + footBtn.size());
        List<DomNode> links = Locator.css(root, "body div .menu a");
        check("descendant nhiều tầng không kể node chính",
            links.size() == 2 && links.get(0) == homeLink && links.get(1) == teamLink, "got " + links.size());
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
      reference: `final class DomNode {
    final String tag;
    final Map<String, String> attrs;
    final List<DomNode> children;

    DomNode(String tag) {
        this(tag, Map.of(), List.of());
    }

    DomNode(String tag, Map<String, String> attrs, List<DomNode> children) {
        this.tag = tag;
        this.attrs = attrs;
        this.children = children;
    }
}

final class Locator {
    static List<DomNode> css(DomNode root, String selector) {
        String[] segs = selector.trim().split(" +");
        List<DomNode> all = new ArrayList<>();
        collect(root, all);
        List<DomNode> layer = new ArrayList<>();
        for (int s = 0; s < segs.length; s++) {
            List<DomNode> next = new ArrayList<>();
            for (DomNode n : all) {
                if (!matches(n, segs[s])) continue;
                if (s == 0 || descendantOfAny(n, layer)) next.add(n);
            }
            layer = next;
        }
        return layer;
    }

    private static void collect(DomNode n, List<DomNode> out) {
        out.add(n);
        for (DomNode c : n.children) collect(c, out);
    }

    private static boolean descendantOfAny(DomNode n, List<DomNode> ancestors) {
        for (DomNode a : ancestors) if (contains(a, n)) return true;
        return false;
    }

    private static boolean contains(DomNode a, DomNode n) {
        for (DomNode c : a.children) if (c == n || contains(c, n)) return true;
        return false;
    }

    private static boolean matches(DomNode n, String compound) {
        int p = 0;
        if (compound.charAt(0) != '#' && compound.charAt(0) != '.' && compound.charAt(0) != '[') {
            int q = markStart(compound, 1);
            if (!compound.substring(0, q).equals(n.tag)) return false;
            p = q;
        }
        while (p < compound.length()) {
            char ch = compound.charAt(p);
            if (ch == '#') {
                int q = markStart(compound, p + 1);
                if (!compound.substring(p + 1, q).equals(n.attrs.get("id"))) return false;
                p = q;
            } else if (ch == '.') {
                int q = markStart(compound, p + 1);
                String want = compound.substring(p + 1, q);
                boolean found = false;
                for (String t : n.attrs.getOrDefault("class", "").split(" +")) if (t.equals(want)) found = true;
                if (!found) return false;
                p = q;
            } else if (ch == '[') {
                int close = compound.indexOf(']', p);
                int eq = compound.indexOf('=', p);
                if (close < 0 || eq < 0 || eq > close) throw new IllegalArgumentException("Selector hong: " + compound);
                String key = compound.substring(p + 1, eq);
                String val = compound.substring(eq + 1, close);
                if (!val.equals(n.attrs.get(key))) return false;
                p = close + 1;
            } else {
                throw new IllegalArgumentException("Selector hong: " + compound);
            }
        }
        return true;
    }

    private static int markStart(String s, int from) {
        for (int k = from; k < s.length(); k++) {
            char c = s.charAt(k);
            if (c == '#' || c == '.' || c == '[') return k;
        }
        return s.length();
    }
}`,
      hints: [
        'Lời giải kiểu Selenium: duyệt cây một lần lấy danh sách node theo thứ tự tài liệu ({{collect}}), rồi với mỗi segment lọc danh sách hiện tại.',
        'Với segment thứ k>0, node chỉ được lấy nếu nó là **con cháu thật sự** ({{==}} trên cây con) của một node thuộc lớp k−1 — không tính chính node đó.',
        'Parse compound: đọc tag đến ký tự #/./*[ đầu tiên; mỗi phần tử sau đó cắt đến ký tự #/./*[ kế tiếp. Attribute {{[k=v]}} tìm vị trí = và ].',
      ],
      explain: `Cấu trúc "lọc theo lớp" (layer-by-layer) mô phỏng đúng cách trình duyệt/CSS engine xử lý descendant combinator: tập node khớp các segment phía trước, rồi mở rộng. Lưu ý hai chi tiết dễ sai:

1. {{.btn}} phải so theo **token** của attribute class ({{class="btn primary"}}), không phải {{contains(chuoi)}} — nếu không, {{.bt}} cũng khớp, giống hệt lỗi mà locator {{class*=}} gây ra trên Selenium thật.
2. Con cháu phải là **quan hệ thật trong cây** ({{contains}} dùng {{==}} theo node identity): nếu chỉ kiểm "ancestor khớp segment trước" trên đường cha đơn nhất sẽ sai khi nhiều branch cùng khớp.

Đây chính là phần lõi của một locator engine: DOM thật còn thêm pseudo-class, shadow DOM, và frame — nhưng 95% selector của suite thực tế nằm trong tập con bạn vừa viết.`,
    },
  ],
  check: [
    {
      q: 'Locator nào thường **bền nhất** trước thay đổi diện mạo (class, layout, text)?',
      options: ['XPath tuyệt đối', 'CSS theo class build sinh (css-1x9k2)', 'data-testid gắn chủ đích cho test', 'linkText'],
      answer: 2,
      explain: 'data-testid tồn tại chỉ để phục vụ test, do team kiểm soát, không bị style/refactor làm đổi; ba loại còn lại gắn trực tiếp vào thứ thay đổi thường xuyên nhất.',
    },
    {
      q: 'Trong CSS selector {{form.login button#submit}}, dấu cách giữa hai segment nghĩa là gì?',
      options: ['Chỉ con trực tiếp', 'Con cháu ở bất kỳ độ sâu', 'Hai selector độc lập', 'Segment đầu bị bỏ qua'],
      answer: 1,
      explain: 'Dấu cách = descendant combinator: tìm button#submit nằm trong cây con của form.login, bất kể sâu bao nhiêu. Trong CSS thật, con trực tiếp (child) dùng toán tử > — nằm ngoài tập selector của bài này.',
    },
    {
      q: 'Vì sao {{/html/body/div[3]/button[1]}} bị coi là locator xấu?',
      options: [
        'XPath không hỗ trợ cú pháp này',
        'Chỉ cần thêm/bớt/dổi thứ tự một phần tử phía trên là nó trỏ sai hoặc chết',
        'Nó luôn chậm hơn id',
        'Trình duyệt từ chối path có số',
      ],
      answer: 1,
      explain: 'Nó mã hoá **vị trí vật lý** hiện tại của DOM thay vì ý nghĩa của phần tử. Một banner quảng cáo chèn thêm ở body là cả locator lệch sang div[4].',
    },
    {
      q: 'Điểm khác biệt kiến trúc của Playwright Locator so với Selenium findElement?',
      options: [
        'Locator chạy nhanh hơn vì cache node',
        'Locator là mô tả lười: mỗi hành động tự phân giải lại và tự chờ phần tử; findElement chụp ảnh tức thời',
        'Locator không cần trình duyệt',
        'findElement tự chờ cho tới khi phần tử visible',
      ],
      answer: 1,
      explain: 'Vì re-resolve mỗi lần dùng, DOM render lại thì locator tự tìm node mới — đó là nền tảng auto-wait. WebElement của Selenium là tham chiếu cũ: DOM đổi là stale.',
    },
  ],
  tags: ['locator', 'CSS selector', 'XPath', 'data-testid', 'Selenium', 'Playwright', 'DOM'],
},
{
  id: 'lesson-autotest-003',
  track: 'autotest',
  order: 3,
  title: 'Wait: implicit, explicit, fluent và auto-wait của Playwright',
  level: 'mid',
  minutes: 35,
  goals: [
    'Giải thích vì sao Thread.sleep làm test vừa chậm vừa flaky',
    'Phân biệt implicit wait, explicit wait và fluent wait — khi nào dùng cái nào',
    'Hiểu polling interval, ignoring exception và StaleElementReferenceException',
    'Diễn tả được vòng wait bằng mã giả và biết vì sao không trộn implicit với explicit',
  ],
  body: `### Vì sao test UI phải chờ
Trang web ngày nay **render dần**: HTML về trước, JavaScript chạy sau, dữ liệu tải qua XHR/fetch rồi mới điền vào DOM. Khi script bấm "Tìm kiếm", kết quả có thể **chưa tồn tại** vài trăm ms tới vài giây. Nếu nói "click ngay phần tử kết quả" thì ở mili-giây đó node chưa có — engine ném {{NoSuchElementException}} (không tìm thấy phần tử). **Wait** là cơ chế "kiên nhẫn hỏi lại cho tới khi điều kiện đạt".

### Thread.sleep: đoán non đoán già
~~~java
driver.get("https://shop.example/checkout");
Thread.sleep(3000);          // "chắc 3 giây là xong"
driver.findElement(By.id("pay-now")).click();
~~~

Vấn đề là con số 3000 là **đoán**: máy CI chậm → 4 giây → test fail dù app đúng (flaky — lúc pass lúc fail không do code); máy nhanh chờ thừa. Nhân lên: suite 200 test × 3 giây = **600 giây ngủ không cần thiết mỗi lần chạy**. Và sleep **không nói lên điều kiện đang chờ**: chờ gì? — không ai biết, kể cả người đọc test. Vì thế nó là anti-pattern phổ biến nhất trong suite automation mới.

### Implicit wait: "mỗi lần tìm phần tử được phép nài tới X giây"
~~~java
driver.manage().timeouts().implicitlyWait(Duration.ofSeconds(5));
~~~

Từ lúc đặt, **mọi** {{findElement}} bị thiếu sẽ polling tới 5 giây rồi mới ném lỗi. Tiện vì đặt một lần, nhưng có bốn hạn chế: (1) nó chỉ trả lời "phần tử **tồn tại** trong DOM chưa", còn invisible hay disabled thì vẫn trả về — click vào node ẩn lại lỗi khác; (2) {{findElements}} (số nhiều) polling hết 5 giây ngay cả khi đáp án đúng là "rỗng" — chờ 5 giây để kết luận không có gì rất tốn; (3) đặt trên driver thì ảnh hưởng cả những chỗ bạn muốn fail nhanh; (4) **hỗn hợp với explicit wait sinh thời gian chờ khôn lường** (mục dưới).

### Explicit wait: chờ đúng điều kiện, ở đúng chỗ
~~~java
WebDriverWait wait = new WebDriverWait(driver, Duration.ofSeconds(10), Duration.ofMillis(200));
WebElement pay = wait.until(ExpectedConditions.elementToBeClickable(By.id("pay-now")));
// cac ham thong dung khac:
// visibilityOfElementLocated, presenceOfElementLocated, textToBePresentInElement,
// titleIs, numberOfElementsToBe..., stalenessOf(element)
~~~

{{WebDriverWait}} lặp: thử điều kiện, chưa đạt thì **ngủ polling interval** (tham số 3, mặc định 500 ms) rồi thử lại, quá timeout ném {{TimeoutException}}. Khác biệt cốt lõi so với implicit: điều kiện không chỉ "có node" mà là **trạng thái dùng được** ({{elementToBeClickable}} = visible + không disabled), và bạn chọn chờ cái gì, ở đâu, tối đa bao lâu. Mặc định {{WebDriverWait}} nuốt {{NoSuchElementException}} khi polling (đó là "điều kiện chưa đạt", chưa phải lỗi).

### FluentWait: quyền điều khiển đầy đủ
~~~java
Wait<WebDriver> wait = new FluentWait<>(driver)
    .withTimeout(Duration.ofSeconds(10))
    .pollingEvery(Duration.ofMillis(250))
    .ignoring(StaleElementReferenceException.class)
    .withMessage("gio hang chua cap nhat sau 10s");
WebElement cart = wait.until(d -> d.findElement(By.id("cart-count")));
~~~

{{StaleElementReferenceException}} là lỗi phải hiểu để mà ignore đúng chỗ: lấy được {{WebElement}} rồi, nhưng SPA render lại làm node đó **bị vứt khỏi cây** — object bạn giữ thành "tham chiếu cũ" (stale), mọi thao tác ném lỗi. FluentWait bắt và thử lại: lần tìm mới sẽ lấy node mới. Quy tắc: ignore **lỗi thuộc loại "chưa đạt điều kiện"**, đừng bỏ qua {{TimeoutException}} hay {{NullPointerException}} — test sẽ nuốt cả bug thật.

**Vì sao không trộn implicit + explicit**: implicit áp cho mọi findElement. Đặt implicit 10 s rồi chạy WebDriverWait 10 s trong đó gọi findElement: mỗi **lần polling** của explicit có thể kẹt lại 10 giây trong implicit → một phép chờ thành hơn 20 giây, thất thường, và Selenium cảnh báo thẳng trong docs. Chuẩn thực dụng: **implicit = 0, mọi chỗ chờ bằng explicit**; chỉ đặt implicit ngắn ở suite cũ không có thời gian refactor.

### Playwright: auto-wait mặc định
Playwright đảo ngược mặc định — **không cần viết wait**, vì:

- {{page.click("#pay-now")}} trước khi click tự kiểm tra **actionability**: phần tử attached (có trong DOM), **visible**, **stable** (không còn trượt vị trí — đợi animation xong), **enabled**, nhận được event (không bị overlay che). Chưa đạt thì retry tới timeout mặc định (action: 30 giây).
- {{locator.waitFor()}} chủ động chờ một tình trạng; {{expect(locator).toBeVisible()}} (assertion "web-first") tự retry tới 5 giây — assertion chờ được, hết flaky kiểu "hỏi trước render".

~~~java
page.getByRole(AriaRole.BUTTON, new Page.GetByRoleOptions().setName("Them gio hang")).click();
page.locator(".toast-success").waitFor();
expect(page.getByTestId("cart-count")).toHaveText("3");   // tu retry, khong can sleep
~~~

### Lỗi hay gặp
- Sleep sau mỗi click "cho chắc" → suite phình thành 40 phút, CI nghẹt.
- Chờ phần tử **biến mất** (đóng modal): implicit không giúp vì nó khớp node đầu còn tồn tại; phải dùng điều kiện phủ định ({{stalenessOf}}, Playwright {{isHidden}}).
- Chờ dữ liệu "chín" bằng wait giao diện: element hiện nhưng data sau 200 ms — cần chờ điều kiện nghiệp vụ (text đổi, số dòng bảng), không chỉ hiện hình.
- Timeout đặt "cho an toàn" 60 giây cho mọi thứ: che mất lỗi chậm thật; chọn timeout theo phân vị p95 của thao tác.

### Liên hệ phỏng vấn
Hỏi: "Test của bạn ổn định bằng gì?" — đừng trả lời "em đặt wait 10s"; trả lời theo tầng: implicit tắt, explicit chờ **điều kiện trạng thái** (clickable/visible/text), ignore đúng loại exception, và đo flaky rate. Hỏi "thế nào khi Playwright đã auto-wait?" — auto-wait chỉ xử lý **element**, không xử lý **race nghiệp vụ** (hai request cùng về), vì vậy web-first assertion và chờ điều kiện dữ liệu vẫn cần. Làm xong bài tập dưới đây (tự viết vòng wait bằng FakeClock) là bạn nắm được vòng lặp mà cả Selenium lẫn Playwright đang chạy bên dưới.

> Senior tip: thời gian chờ là budget của suite. Một suite tốt có p95 mỗi test gần bằng thời gian thao tác nghiệp vụ thật + độ trễ hạ tầng, không phải bằng tổng timeout đặt sẵn. Khi CI phình, việc đầu tiên là grep {{sleep}} và tìm implicit wait — hai thứ này thường chiếm một nửa thời gian.`,
  exercises: [
    {
      title: 'FluentWait trên FakeClock: timeout, polling, ignoring',
      prompt: `Viết lại {{FluentWait}} hoạt động với {{FakeClock}} (đồng hồ giả lập — test tự tiến thời gian bằng {{clock.advance(ms)}}, không ngủ thật). {{until}} lặp cho tới khi điều kiện đạt hoặc hết budget:

~~~text
poll tai elapsed 0 -> chua dat? -> advance(every) -> neu elapsed > atMost: throw WaitTimeoutException
poll -> chua dat? -> advance -> ...
đạt thì: trả value ngay (không advance thêm)
~~~

Quy tắc chính xác:

1. {{until(condition)}}: gọi {{condition.get()}}. Trả về **khác null** → trả value, kết thúc.
2. Điều kiện ném {{RuntimeException}}: nếu là instance của **một trong các lớp đã {{ignoring}}** (kể cả lớp con — dùng {{isInstance}}) → coi như chưa đạt; ngược lại **ném tiếp ngay** (trước khi advance).
3. Sau mỗi lần chưa đạt: {{clock.advance(every)}}; nếu {{clock.now() - start > atMost}} → ném {{WaitTimeoutException}}.
4. Setter fluent {{atMost}}, {{every}}, {{ignoring}} trả {{this}}. Mặc định: {{atMost = 5000}}, {{every = 500}}, không ignore gì. {{start}} ghi tại thời điểm gọi {{until}}.

{{FakeClock}}, {{WaitTimeoutException}}, {{StaleException}} đã cho sẵn và đã đúng. Ví dụ với {{every = 200}}: điều kiện đạt ở poll thứ 3 → {{clock.now() == 400}}; điều kiện luôn null với {{atMost = 1000}} → poll 6 lần tại 0,200,400,600,800,1000, advance tới 1200 rồi ném {{WaitTimeoutException}}.`,
      starter: `final class FakeClock {
    private long now;
    long now() { return now; }
    void advance(long millis) { now += millis; }
}

class WaitTimeoutException extends RuntimeException {
    WaitTimeoutException(String message) { super(message); }
}

class StaleException extends RuntimeException {
    StaleException(String message) { super(message); }
}

final class FluentWait {
    FluentWait(FakeClock clock) {
        throw new UnsupportedOperationException("TODO");
    }

    FluentWait atMost(long millis) {
        throw new UnsupportedOperationException("TODO");
    }

    FluentWait every(long millis) {
        throw new UnsupportedOperationException("TODO");
    }

    FluentWait ignoring(Class<? extends RuntimeException> type) {
        throw new UnsupportedOperationException("TODO");
    }

    String until(Supplier<String> condition) {
        throw new UnsupportedOperationException("TODO");
    }
}`,
      tests: `public class Main {
    static int passed = 0, total = 0;
    static void check(String name, boolean ok, String detail) {
        total++;
        if (ok) { passed++; System.out.println("PASS " + name); }
        else System.out.println("FAIL " + name + ": " + detail);
    }
    static class DetachedException extends StaleException {
        DetachedException() { super("node detached"); }
    }
    public static void main(String[] args) {
        FakeClock c1 = new FakeClock();
        AtomicInteger n1 = new AtomicInteger();
        String v1 = new FluentWait(c1).atMost(5000).every(200).until(() -> { n1.incrementAndGet(); return "visible"; });
        check("thanh cong ngay poll dau", "visible".equals(v1) && n1.get() == 1 && c1.now() == 0,
            "v=" + v1 + " calls=" + n1.get() + " now=" + c1.now());

        FakeClock c2 = new FakeClock();
        AtomicInteger n2 = new AtomicInteger();
        String v2 = new FluentWait(c2).atMost(5000).every(200).until(() -> n2.incrementAndGet() >= 3 ? "done" : null);
        check("thanh cong o poll thu 3", "done".equals(v2) && n2.get() == 3 && c2.now() == 400,
            "calls=" + n2.get() + " now=" + c2.now());

        FakeClock c3 = new FakeClock();
        AtomicInteger n3 = new AtomicInteger();
        String err = "";
        try { new FluentWait(c3).atMost(1000).every(200).until(() -> { n3.incrementAndGet(); return null; }); err = "khong nem"; }
        catch (WaitTimeoutException e) { err = "ok"; }
        catch (Exception e) { err = "sai loai: " + e.getClass().getSimpleName(); }
        check("timeout sau 6 poll", "ok".equals(err) && n3.get() == 6 && c3.now() == 1200,
            "err=" + err + " calls=" + n3.get() + " now=" + c3.now());

        FakeClock c4 = new FakeClock();
        AtomicInteger n4 = new AtomicInteger();
        String v4 = new FluentWait(c4).atMost(5000).every(200).ignoring(StaleException.class)
            .until(() -> { if (n4.incrementAndGet() < 3) throw new StaleException("re-render"); return "found"; });
        check("exception duoc ignore -> retry den khi dat", "found".equals(v4) && n4.get() == 3 && c4.now() == 400,
            "calls=" + n4.get() + " now=" + c4.now());

        FakeClock c5 = new FakeClock();
        AtomicInteger n5 = new AtomicInteger();
        String kind = "";
        try { new FluentWait(c5).atMost(5000).every(200).until(() -> { n5.incrementAndGet(); throw new IllegalStateException("boom"); }); kind = "khong nem"; }
        catch (IllegalStateException e) { kind = "propagated"; }
        check("exception khong ignore bay ra ngay", "propagated".equals(kind) && n5.get() == 1 && c5.now() == 0,
            "kind=" + kind + " calls=" + n5.get() + " now=" + c5.now());

        FakeClock c6 = new FakeClock();
        AtomicInteger n6 = new AtomicInteger();
        String v6 = new FluentWait(c6).atMost(5000).every(200).ignoring(StaleException.class)
            .until(() -> { if (n6.incrementAndGet() == 1) throw new DetachedException(); return "sub"; });
        check("lớp con của exception được ignore cũng", "sub".equals(v6) && n6.get() == 2 && c6.now() == 200,
            "calls=" + n6.get() + " now=" + c6.now());

        FakeClock c7 = new FakeClock();
        AtomicInteger n7 = new AtomicInteger();
        String kind7 = "";
        try { new FluentWait(c7).until(() -> { n7.incrementAndGet(); return null; }); kind7 = "khong nem"; }
        catch (WaitTimeoutException e) { kind7 = "timeout"; }
        check("mac dinh atMost 5000 every 500", "timeout".equals(kind7) && n7.get() == 11 && c7.now() == 5500,
            "kind=" + kind7 + " calls=" + n7.get() + " now=" + c7.now());

        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
      reference: `final class FakeClock {
    private long now;
    long now() { return now; }
    void advance(long millis) { now += millis; }
}

class WaitTimeoutException extends RuntimeException {
    WaitTimeoutException(String message) { super(message); }
}

class StaleException extends RuntimeException {
    StaleException(String message) { super(message); }
}

final class FluentWait {
    private final FakeClock clock;
    private final List<Class<? extends RuntimeException>> ignored = new ArrayList<>();
    private long atMostMillis = 5000;
    private long everyMillis = 500;

    FluentWait(FakeClock clock) { this.clock = clock; }

    FluentWait atMost(long millis) { atMostMillis = millis; return this; }

    FluentWait every(long millis) { everyMillis = millis; return this; }

    FluentWait ignoring(Class<? extends RuntimeException> type) { ignored.add(type); return this; }

    String until(Supplier<String> condition) {
        long start = clock.now();
        while (true) {
            String result;
            try {
                result = condition.get();
            } catch (RuntimeException e) {
                boolean swallow = false;
                for (Class<? extends RuntimeException> c : ignored) {
                    if (c.isInstance(e)) { swallow = true; break; }
                }
                if (!swallow) throw e;
                result = null;
            }
            if (result != null) return result;
            clock.advance(everyMillis);
            if (clock.now() - start > atMostMillis) {
                throw new WaitTimeoutException("timed out after " + (clock.now() - start) + " ms");
            }
        }
    }
}`,
      hints: [
        'Vòng lặp: {{while (true)}} — mỗi lượt thử điều kiện, đạt thì {{return}}, chưa đạt thì advance rồi xét timeout. Ghi {{start = clock.now()}} **trước** vòng lặp.',
        'Bắt {{RuntimeException}} (không bắt Exception) để NPE/IllegalState không bị nuốt; kiểm tra ignore bằng {{c.isInstance(e)}}.',
        'Lỗi hay gặp: xét {{> atMost}} thành {{>=}} — đổi một phép là số poll và mốc thời gian sai hết (bài này kiểm đúng sai từng mili-giây giả lập).',
      ],
      explain: `{{isInstance}} (không so {{==}} trên class) khiến {{ignoring(StaleException.class)}} bắt cả {{DetachedException}} — trong Selenium thật, driver ném đúng vài dẫn xuất của cùng một loại lỗi, vì vậy ignore theo **họ** exception là hành vi phải có.

{{FakeClock}} là Clock injection (đã học ở track testing) đặt vào thế giới wait: toàn bộ bài chạy trong mili-giây thật và **tái lập chính xác** kịch bản timeout mà không chờ — đây cũng là cách viết unit test cho code retry/backoff trong service thật ({{RetryTemplate}}, resilience4j).

Chú ý ranh giới {{>}} hay {{>=}}: spec chọn "advance xong mới xét" nên poll cuối xảy ra khi elapsed == atMost và ném lỗi ngay sau khi vừa vượt. Khi review suite, hãy hỏi người viết wait timeout: "poll cuối của anh lúc nào thì bị coi là hết hạn?" — người không trả lời được thường là người copy con số 10 giây.`,
    },
  ],
  check: [
    {
      q: 'Vì sao {{Thread.sleep(3000)}} là anti-pattern trong test UI?',
      options: [
        'Vì sleep chiếm nhiều bộ nhớ',
        'Vì sleep là đoán: ngắn thì flaky trên máy chậm, dài thì làm chậm CI, và không diễn tả điều kiện đang chờ',
        'Vì Java cấm sleep trong test',
        'Vì Playwright không có API này',
      ],
      answer: 1,
      explain: 'Vấn đề cả hai chiều: máy nhanh chờ thừa (Suite 200 test × 3 s = 10 phút vứt đi), máy chậm không đủ (fail giả). Wait đúng là chờ **điều kiện**, không chờ **thời gian**.',
    },
    {
      q: 'Chuyện gì xảy ra khi đặt implicit wait 10 s rồi dùng WebDriverWait 10 s (bên trong có findElement)?',
      options: [
        'Hai cơ chế triệt tiêu nhau',
        'Mỗi lần polling của explicit có thể kẹt thêm tới 10 s trong implicit → chờ hơn 20 s, thất thường',
        'Không ảnh hưởng gì',
        'Driver báo lỗi cấu hình ngay',
      ],
      answer: 1,
      explain: 'Implicit áp lên **mọi** findElement; explicit gọi findElement nhiều lần khi polling → chi số nhân thời gian, và Selenium docs khuyến nghị implicit = 0 khi đã dùng explicit.',
    },
    {
      q: 'Trước khi click, auto-wait của Playwright kiểm tra gì? Chọn phương án **KHÔNG** thuộc danh sách.',
      options: ['Phần tử visible', 'Phần tử enabled', 'Phần tử stable (đứng yên)', 'Phần tử có màu nền khớp theme'],
      answer: 3,
      explain: 'Actionability = attached, visible, stable, enabled, nhận event. Màu/theme không phải điều kiện tương tác nên không được kiểm.',
    },
    {
      q: 'Vì sao StaleElementReferenceException có thể xảy ra **sau khi** findElement đã thành công?',
      options: [
        'Driver mất kết nối mạng',
        'SPA render lại làm node bị vứt khỏi DOM — tham chiếu WebElement giữ thành bản cũ',
        'Phần tử bị ẩn đi',
        'Implicit wait quá dài',
      ],
      answer: 1,
      explain: 'WebElement là con trỏ vào node cụ thể của cây DOM; framework render lại tạo node mới cùng vị trí, con trỏ cũ thành stale. Vì vậy wait đúng kiểu này phải catching-then-retry bằng cách **tìm lại**.',
    },
  ],
  tags: ['wait', 'implicit', 'explicit', 'FluentWait', 'StaleElementReferenceException', 'Playwright', 'auto-wait', 'flaky'],
},
{
  id: 'lesson-autotest-004',
  track: 'autotest',
  order: 4,
  title: 'Page Object Model và Page Factory / Screenplay: tổ chức code UI test để không vỡ khi UI đổi',
  level: 'senior',
  minutes: 30,
  goals: [
    'Tách locator + hành động khỏi test và chỉ rõ chỗ nào đặt assertion',
    'Viết page object fluent trả về trang tiếp theo và giải thích được lợi ích',
    'Phê bình được POM kiểu one-step wrapper và PageFactory deprecated',
    'So sánh POM với Screenplay và nói khi nào dùng cái nào',
  ],
  body: `### Vấn đề: test dính chặt vào trang
~~~java
// test dinh chat - moi locator nam ngay trong test
@Test
void loginSuccess() {
    driver.get("https://shop.example/login");
    driver.findElement(By.id("user")).sendKeys("bean");
    driver.findElement(By.id("pass")).sendKeys("secret123");
    driver.findElement(By.cssSelector("button.primary")).click();
    assertEquals("bean", driver.findElement(By.id("welcome-user")).getText());
}
// ... 39 test khac cung copy doan locator nay
~~~

Tuần sau frontend đổi id {{user}} → {{username}}: phải sửa **40 chỗ**, mỗi chỗ một rủi ro sửa sót. Test fail không nói "màn hình login hỏng" mà nói "không tìm thấy node" — developer đọc không biết lỗi thật nằm ở đâu. Đây là lý do một suite UI không có cấu trúc chết dần: sửa không nổi thì người ta tắt nó.

### Page Object Model: một trang một class
**POM (Page Object Model)** — pattern chuẩn của Selenium/WebDriver: mỗi trang (hoặc khu vực) màn hình là một class; class đó **sở hữu locator + hành động mức nghiệp vụ của trang**; test chỉ còn **ý định + assertion**.

~~~java
public class LoginPage {
    private final WebDriver driver;
    private final By userInput = By.id("username");          // locator KHAI BAO MOT CHOI
    private final By passInput = By.id("password");
    private final By loginBtn = By.cssSelector("form button[type=submit]");

    public LoginPage(WebDriver driver) {
        this.driver = driver;
    }

    public LoginPage typeUser(String user) {                  // fluent: tra chinh no de xoi
        driver.findElement(userInput).clear();
        driver.findElement(userInput).sendKeys(user);
        return this;
    }

    public LoginPage typePassword(String pass) {
        driver.findElement(passInput).clear();
        driver.findElement(passInput).sendKeys(pass);
        return this;
    }

    public DashboardPage clickLogin() {                       // tra VE TRANG KE TIEP
        driver.findElement(loginBtn).click();
        return new DashboardPage(driver);
    }
}

// test chi con mo ta Y DINH NGHIEP VU:
@Test
void loginSuccess() {
    DashboardPage dash = new LoginPage(driver)
        .typeUser("bean").typePassword("secret123").clickLogin();
    assertTrue(dash.isLoaded());                              // assertion o TEST, khong o page
}
~~~

Đổi id {{username}}? Sửa **một dòng** trong LoginPage, 40 test không đổi. Test đọc như ngôn ngữ nghiệp vụ ("loginAs... then..."), và khi fail, lỗi trỏ thẳng tới trang.

### Bốn quy tắc làm nên POM tốt
1. **Không assert trong page object.** Page object **mô tả trang**, không **phán xử**. Vì sao: hành động trong page hay **dùng lại ở cả trường hợp thành công lẫn thất bại** — cùng là {{clickLogin()}}, có phiên đăng nhập thật (chờ dashboard) và kiểm thử sai mật khẩu (mong ở lại login). Nhét assert "phải thấy dashboard" vào {{clickLogin()}} thì mọi test login-error nổ vì assertion nằm **sai chỗ**, message không nói gì về lỗi nghiệp vụ.
2. **Hàm điều hướng trả về page object trang tiếp theo.** Muốn hỗ trợ cả nhánh lỗi: khai báo trả về type cha {{Page}} rồi test kiểm {{instanceof}}, hoặc cho phép test tự hỏi "{{loginPage.hasError()}}". Tránh bắt page object ném exception theo kết quả.
3. **Không one-step wrapper.** Đừng viết {{clickSubmitButton()}}, {{enterUsername(String)}} cho từng widget — page object thành bản sao DOM, và mỗi refactor UI nhân đôi công sửa. Mỗi page object **khớp với một hành động nghiệp vụ** người dùng thực hiện ({{loginAs(user, pass)}}, {{placeOrder(item)}}), không khớp một cú click.
4. **Gom fragment cho phần lặp lại** — header, menu, phân trang — vào lớp riêng ({{new CartFragment(driver).goToCheckout()}}), dùng trong nhiều page.

### PageFactory và @FindBy: đã deprecated
~~~java
// KIỂU CŨ (Selenium 2/3) — KHÔNG nên dùng nữa:
public class LoginPage {
    @FindBy(id = "username") private WebElement userInput;    // proxied, chi tim khi cham den
    public LoginPage(WebDriver driver) { PageFactory.initElements(driver, this); }
}
~~~

Cơ chế cũ dùng **dynamic proxy**: field {{WebElement}} không tra node that cho tới khi cham, để "tìm lại mỗi lần dùng" — ý hay nhưng đi kèm {{StaleElementReferenceException}} khó lần và reflection làm chậm trang. Selenium 4 **deprecated PageFactory**: cách hiện đại đúng bằng tay — giữ **{{By}}** (mô tả), gọi {{findElement}} tại thời điểm dùng (lazy giống Playwright locator).

### Playwright + POM
Không có PageFactory để kế thừa; mẫu chung là class page giữ {{Page}} + locator field, assertion dùng **web-first** ngay trong test:

~~~java
public class LoginPage {
    private final Page page;
    final Locator userInput, passInput, loginBtn;
    public LoginPage(Page page) {
        this.page = page;
        userInput = page.getByLabel("Tên đăng nhập");
        passInput = page.getByLabel("Mật khẩu");
        loginBtn  = page.getByRole(AriaRole.BUTTON, new Page.GetByRoleOptions().setName("Đăng nhập"));
    }
    public LoginPage loginAs(String u, String p) {
        userInput.fill(u); passInput.fill(p); loginBtn.click();
        return this;
    }
}
// test: expect(loginPage.loginAs("bean", "secret").errorBox()).toBeVisible();
~~~

### Screenplay: tổ chức theo hành động, không theo trang
**Screenplay pattern** (do Serenity BDD, Netserf phổ biến — bản tiến hóa của POM) chia code theo **góc nhìn người dùng**: một **Actor** có **Ability** (biết dùng browser — {{BrowseTheWeb}}), thực hiện **Task** (LogInAs, AddToCart) và đọc kết quả bằng **Question** (CartTotal). Một task ghép từ nhiều bước ở nhiều trang; tái tổ hợp dễ vì task nhỏ độc lập.

~~~text
Actor.named("Bean").can(BrowseTheWeb.with(page))
     .attemptsTo(LogIn.as("bean", "secret"))
     .asks(for(Cart.items()).to(haveSize(3)));
~~~

| Khía cạnh | POM | Screenplay |
|---|---|---|
| Đơn vị tổ chức | trang | hành động nghiệp vụ (Task/Question) |
| Đọc như lời văn | khá tốt | rất tốt ("actor attempts to...") |
| Độ phức tạp hạ tầng | thấp | cao (interfaces, composition) |
| Phù hợp | đa số suite, đội mới | luồng dài nhiều trang, BDD sâu, đội đông |

### Lỗi hay gặp
- **God page**: một class chứa mọi thứ của site → merge conflict và không ai dám sửa.
- Page object giữ **{{WebDriver}} tĩnh (static)** → chạy song song hai thread dẫm nhau; driver phải truyền qua constructor.
- Trả về page "lột xác" không kiểm soát: {{clickLogin()}} luôn trả DashboardPage dù login sai → test đọc sai trạng thái.
- Nhét wait vào page object theo cách giấu timeout: nên mặc định chờ bởi engine (Playwright) hoặc hàm chờ tường minh, đừng mỗi hàm {{Thread.sleep}}.

### Liên hệ phỏng vấn
Vị trí SDET hay hỏi: "Trình bày cấu trúc framework automation của bạn." Khung trả lời 60 giây: tầng 1 driver/manager (quản lý lifecycle), tầng 2 base page (chờ, lỗi chung), tầng 3 page object + fragment, tầng 4 test dữ liệu (JUnit 5 {{@ParameterizedTest}}), cộng báo cáo (Allure) và CI. Nói kèm hai quyết định: **assertion ở test** và **lazy locator thay PageFactory** — chứng tỏ bạn cập nhật Selenium 4. Câu "khi nào Screenplay hơn POM": khi luồng đi qua nhiều trang và cần tái tổ hợp bước nghiệp vụ; suite nhỏ thì POM đơn giản hơn, đừng over-engineer.

> Senior tip: giá trị thật của POM không phải "gom locator" — mà là **mô tả lại trang bằng ngôn ngữ nghiệp vụ của team**. Khi QA, dev và PO cùng đọc được test mà không cần biết CSS, thì test trở thành tài liệu sống; đó cũng là lúc nó sống sót qua các bản redesign.`,
  exercises: [
    {
      title: 'LoginPage và DashboardPage fluent trên fake browser',
      prompt: `{{MiniBrowser}} mô phỏng một web app đăng nhập: {{open(path)}}, {{typeUser}}, {{typePass}}, {{submit}} (kiểm user {{bean/secret123}}, {{qa/qa12345}}; user {{ghost}} bị khoá; vào đúng thì url = {{/dashboard}} và xóa lỗi cũ), cùng getter {{currentUrl}}, {{error}}, {{welcome}}.

Viết page object theo chuẩn POM:

- {{LoginPage(MiniBrowser)}}:
  - {{LoginPage type(String user)}} — điền user, **trả chính nó** (fluent).
  - {{LoginPage password(String pass)}} — điền pass, trả chính nó.
  - {{Page clickLogin()}} — gọi {{browser.submit()}}; nếu {{currentUrl()}} là {{/dashboard}} trả {{new DashboardPage(browser)}}, ngược lại trả {{new LoginPage(browser)}} (nguyên tắc: trang tiếp theo là trang mà browser thật sự đang ở).
  - {{String error()}} — đọc thông báo lỗi từ browser.
- {{DashboardPage(MiniBrowser)}}:
  - {{String welcome()}} — đọc {{browser.welcome()}}, phải đúng dạng {{Xin chào <user>}}.
  - {{LoginPage logout()}} — gọi {{browser.open("/login")}} rồi trả {{new LoginPage(browser)}}.

Ràng buộc thiết kế (sẽ được hỏi trong phỏng vấn): page object **không assert, không ném exception theo kết quả nghiệp vụ** — chỉ phản chiếu trạng thái browser; assertion thuộc về test. {{Page}} (abstract, giữ browser) đã cho sẵn.`,
      starter: `abstract class Page {
    protected final MiniBrowser browser;

    protected Page(MiniBrowser browser) {
        this.browser = browser;
    }
}

final class MiniBrowser {
    private final Map<String, String> users = new HashMap<>();
    private final Set<String> locked = new HashSet<>();
    private String url = "/login";
    private String userField = "", passField = "", error = "", welcome = "";

    MiniBrowser() {
        users.put("bean", "secret123");
        users.put("qa", "qa12345");
        locked.add("ghost");
    }

    void open(String path) {
        url = path;
        userField = "";
        passField = "";
        error = "";
        if (!path.equals("/dashboard")) welcome = "";
    }

    void typeUser(String v) { userField = v; }

    void typePass(String v) { passField = v; }

    void submit() {
        if (locked.contains(userField)) {
            error = "Tài khoản bị khoá";
            return;
        }
        if (!userField.isEmpty() && users.getOrDefault(userField, "").equals(passField)) {
            welcome = "Xin chào " + userField;
            error = "";
            url = "/dashboard";
        } else {
            error = "Sai mật khẩu";
        }
    }

    String currentUrl() { return url; }

    String error() { return error; }

    String welcome() { return welcome; }
}

final class LoginPage extends Page {
    LoginPage(MiniBrowser browser) {
        super(browser);
        throw new UnsupportedOperationException("TODO");
    }

    LoginPage type(String user) {
        throw new UnsupportedOperationException("TODO");
    }

    LoginPage password(String pass) {
        throw new UnsupportedOperationException("TODO");
    }

    Page clickLogin() {
        throw new UnsupportedOperationException("TODO");
    }

    String error() {
        throw new UnsupportedOperationException("TODO");
    }
}

final class DashboardPage extends Page {
    DashboardPage(MiniBrowser browser) {
        super(browser);
        throw new UnsupportedOperationException("TODO");
    }

    String welcome() {
        throw new UnsupportedOperationException("TODO");
    }

    LoginPage logout() {
        throw new UnsupportedOperationException("TODO");
    }
}`,
      tests: `public class Main {
    static int passed = 0, total = 0;
    static void check(String name, boolean ok, String detail) {
        total++;
        if (ok) { passed++; System.out.println("PASS " + name); }
        else System.out.println("FAIL " + name + ": " + detail);
    }
    public static void main(String[] args) {
        MiniBrowser b1 = new MiniBrowser();
        Page d1 = new LoginPage(b1).type("bean").password("secret123").clickLogin();
        check("login đúng -> DashboardPage", d1 instanceof DashboardPage, "nhan: " + d1.getClass().getSimpleName());
        check("dashboard xin chao dung user va doi url",
            d1 instanceof DashboardPage && ((DashboardPage) d1).welcome().equals("Xin chào bean")
                && b1.currentUrl().equals("/dashboard"), "welcome=" + b1.welcome() + " url=" + b1.currentUrl());

        MiniBrowser b2 = new MiniBrowser();
        Page p2 = new LoginPage(b2).type("bean").password("wrongpass").clickLogin();
        check("sai mat khau -> van LoginPage", p2 instanceof LoginPage, "nhan: " + p2.getClass().getSimpleName());
        check("sai mat khau -> error hien qua page object",
            p2 instanceof LoginPage && ((LoginPage) p2).error().equals("Sai mật khẩu") && b2.currentUrl().equals("/login"),
            "error=" + b2.error() + " url=" + b2.currentUrl());

        MiniBrowser b3 = new MiniBrowser();
        Page p3 = new LoginPage(b3).type("ghost").password("whatever").clickLogin();
        check("tai khoan khoa -> thong bao rieng",
            p3 instanceof LoginPage && ((LoginPage) p3).error().equals("Tài khoản bị khoá"), "error=" + b3.error());

        MiniBrowser b4 = new MiniBrowser();
        LoginPage lp4 = new LoginPage(b4);
        check("fluent: type/password tra chinh no", lp4.type("qa") == lp4 && lp4.password("qa12345") == lp4, "khac doi tuong");
        Page d4 = lp4.clickLogin();
        check("login qa duoc dashboard", d4 instanceof DashboardPage && ((DashboardPage) d4).welcome().equals("Xin chào qa"),
            "url=" + b4.currentUrl());
        Page l4 = d4 instanceof DashboardPage ? ((DashboardPage) d4).logout() : null;
        check("logout -> LoginPage va ve /login",
            l4 instanceof LoginPage && b4.currentUrl().equals("/login"), "url=" + b4.currentUrl());

        MiniBrowser b5 = new MiniBrowser();
        LoginPage lp5 = new LoginPage(b5);
        lp5.type("bean").password("bad").clickLogin();
        Page d5 = lp5.type("bean").password("secret123").clickLogin();
        check("login lại đúng thì error cũ được xoá",
            d5 instanceof DashboardPage && lp5.error().isEmpty(), "error=" + b5.error());

        MiniBrowser b6 = new MiniBrowser();
        Page p6 = new LoginPage(b6).type("").password("").clickLogin();
        check("bỏ trống không được phép vượt dashboard",
            p6 instanceof LoginPage && b6.currentUrl().equals("/login") && b6.error().equals("Sai mật khẩu"),
            "url=" + b6.currentUrl() + " error=" + b6.error());

        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
      reference: `abstract class Page {
    protected final MiniBrowser browser;

    protected Page(MiniBrowser browser) {
        this.browser = browser;
    }
}

final class MiniBrowser {
    private final Map<String, String> users = new HashMap<>();
    private final Set<String> locked = new HashSet<>();
    private String url = "/login";
    private String userField = "", passField = "", error = "", welcome = "";

    MiniBrowser() {
        users.put("bean", "secret123");
        users.put("qa", "qa12345");
        locked.add("ghost");
    }

    void open(String path) {
        url = path;
        userField = "";
        passField = "";
        error = "";
        if (!path.equals("/dashboard")) welcome = "";
    }

    void typeUser(String v) { userField = v; }

    void typePass(String v) { passField = v; }

    void submit() {
        if (locked.contains(userField)) {
            error = "Tài khoản bị khoá";
            return;
        }
        if (!userField.isEmpty() && users.getOrDefault(userField, "").equals(passField)) {
            welcome = "Xin chào " + userField;
            error = "";
            url = "/dashboard";
        } else {
            error = "Sai mật khẩu";
        }
    }

    String currentUrl() { return url; }

    String error() { return error; }

    String welcome() { return welcome; }
}

final class LoginPage extends Page {
    LoginPage(MiniBrowser browser) {
        super(browser);
    }

    LoginPage type(String user) {
        browser.typeUser(user);
        return this;
    }

    LoginPage password(String pass) {
        browser.typePass(pass);
        return this;
    }

    Page clickLogin() {
        browser.submit();
        return browser.currentUrl().equals("/dashboard") ? new DashboardPage(browser) : new LoginPage(browser);
    }

    String error() {
        return browser.error();
    }
}

final class DashboardPage extends Page {
    DashboardPage(MiniBrowser browser) {
        super(browser);
    }

    String welcome() {
        return browser.welcome();
    }

    LoginPage logout() {
        browser.open("/login");
        return new LoginPage(browser);
    }
}`,
      hints: [
        '{{type}}/{{password}}: gọi {{browser.typeUser}}, {{browser.typePass}} rồi {{return this;}} — kiểu fluent cho phép xối {{.type(..).password(..)}}.',
        '{{clickLogin}} quyết định kiểu trả về dựa trên **trang thật của browser** sau submit: {{browser.currentUrl().equals("/dashboard") ? new DashboardPage(browser) : new LoginPage(browser)}}.',
        '{{logout}}: {{browser.open("/login"); return new LoginPage(browser);}}. Page object không so sánh / không ném lỗi nghiệp vụ — phần đó test lo.',
      ],
      explain: `Toàn bộ bài là ba quy tắc POM kết tinh lại: (1) **kết quả nghiệp vụ quyết định kiểu trả về**, page object không "hy vọng" sẽ ở dashboard; (2) page object **không assert** — thử nghiệm: test sai mật khẩu vẫn đúng lớp {{LoginPage}}, không cần bất kỳ exception nào; (3) **fluent trả chính nó** cho bước điền liệu, **trả trang tiếp theo** cho bước điều hướng.

Dùng {{==}} trong check "fluent" kiểm chính xác rằng type/password không tạo đối tượng mới — trong framework thật, điều này bảo đảm mọi lời gọi {{driver.findElement}} dùng locator của **cùng một** browser instance, không phải một trang giả lập. {{MiniBrowser}} (được cho sẵn) đóng vai "DOM + server": phần bạn viết sẽ được review như code thật, nên biết tách phần mock khỏi phần mình viết là một kỹ năng SDET đáng giá.`,
    },
  ],
  check: [
    {
      q: 'Trong POM, assertion (assertEquals, expect...) nên đặt ở đâu?',
      options: [
        'Trong page object, vì nó biết rõ nhất trang của nó',
        'Trong test: page object chỉ expose trạng thái và hành động',
        'Trong class base page, chạy tự động sau mỗi action',
        'Không cần assertion, test pass là đủ',
      ],
      answer: 1,
      explain: 'Page object mô tả trang, không phán xử. Assert trong test thì cùng một action dùng được cho cả case thành công lẫn thất bại, và lỗi fail nói lên ý định nghiệp vụ.',
    },
    {
      q: '{{clickLogin()}} dẫn tới dashboard nên trả về gì để hỗ trợ cả case login sai?',
      options: [
        'void',
        'String url',
        'Type cha Page (hoặc page tiếp theo) để test tự kiểm instanceof/trạng thái',
        'Bắt buộc ném exception nếu không vào được dashboard',
      ],
      answer: 2,
      explain: 'Kết quả thật (url của browser) quyết định object trả về: DashboardPage nếu thành công, LoginPage nếu lỗi. Test quyết định mong đợi; ép exception trong page object sẽ giết mọi test tiêu cực.',
    },
    {
      q: 'Tình trạng hiện tại của PageFactory / @FindBy trong Selenium 4?',
      options: ['Cách được khuyến nghị nhất', 'Deprecated — hiện đại là giữ By và findElement lười trong page object', 'Chỉ dùng được với Chrome', 'API riêng của Playwright'],
      answer: 1,
      explain: 'PageFactory dùng dynamic proxy + reflection và che StaleElementReferenceException khó debug; Selenium 4 đánh dấu deprecated. Giữ mô tả By và gọi findElement đúng thời điểm cho hiệu quả tương tự, dễ đọc hơn.',
    },
    {
      q: 'Điểm khác biệt chính giữa Screenplay và POM?',
      options: [
        'Screenplay không cần trình duyệt',
        'Screenplay tổ chức code quanh hành động nghiệp vụ (Task/Question) của một Actor, POM tổ chức quanh trang',
        'Screenplay chỉ chạy với TestNG',
        'POM không hỗ trợ assertion',
      ],
      answer: 1,
      explain: 'Cùng một trang, cùng một driver; khác ở trục tổ chức: Screenplay ghép các Task theo hành động của người dùng nên tái tổ hợp tốt cho luồng dài nhiều trang — đổi lại nhiều hạ tầng hơn.',
    },
  ],
  tags: ['POM', 'page object', 'PageFactory', 'Screenplay', 'Selenium', 'Playwright', 'framework design'],
},
{
  id: 'lesson-autotest-005',
  track: 'autotest',
  order: 5,
  title: 'Test runner: vòng đời JUnit 5 vs TestNG, data-driven, tag và retry',
  level: 'mid',
  minutes: 35,
  goals: [
    'Kể đúng thứ tự các bước vòng đời một class test và giải thích vì sao JUnit 5 tạo instance mới cho mỗi test method',
    'Chuyển một test cứng thành data-driven với @CsvSource, @MethodSource và @DataProvider của TestNG',
    'Dùng tag/group để chọn smoke suite hay regression suite ngay từ dòng lệnh CI',
    'Giải thích vì sao retry che giấu flaky test và vì sao nên tránh dependsOnMethods',
  ],
  body: `### Test runner làm gì hộ bạn
Một hàm test chỉ mô tả **kiểm tra cái gì**. Toàn bộ phần còn lại do **test runner** (engine của JUnit 5 hay TestNG) lo: **tìm** hàm test bằng annotation, **tạo object** chứa nó, **chạy** các bước setup/teardown theo đúng thứ tự, **bắt exception** và phân loại pass/fail/skip, **in báo cáo** mà CI đọc được. Hiểu vòng đời của nó là hiểu vì sao một số test chạy được khi đứng một mình nhưng hỏng khi chạy cả suite — nguyên nhân hầu hết nằm ở thứ tự và ở state dùng chung.

### Vòng đời một class test trong JUnit 5
~~~text
@BeforeAll      (1 lần / class, trước mọi test)
  |
  |  @BeforeEach (trước MỖI test)
  |  @Test      (thân test)
  |  @AfterEach (sau MỖI test, kể cả khi test fail)
  |
@AfterAll       (1 lần / class, sau mọi test)
~~~

~~~java
import com.microsoft.playwright.*;
import static com.microsoft.playwright.assertions.PlaywrightAssertions.assertThat;

class SearchSmokeTest {
    static Playwright playwright;              // state dùng chung: 1 tiến trình Playwright / class
    static Browser browser;

    BrowserContext context;                    // state riêng: 1 context / test
    Page page;

    @BeforeAll static void startBrowser() {    // START + static: JUnit 5 yeu cau the (xem phan duoi)
        playwright = Playwright.create();
        browser = playwright.chromium().launch(new BrowserType.LaunchOptions().setHeadless(true));
    }

    @BeforeEach void openPage() {              // chạy trước từng @Test
        context = browser.newContext();        // context moi = cookie/localStorage/storageState rieng
        page = context.newPage();
    }

    @AfterEach void closePage() { context.close(); }

    @AfterAll static void stopBrowser() { browser.close(); playwright.close(); }

    @Test void searchFindsJavaBook() {
        page.navigate("https://shop.example/search?q=java");
        assertThat(page.getByTestId("result-count")).containsText("ket qua");
    }
}
~~~

Ba chi tiết quyết định chất lượng suite:
- **@BeforeAll phải là static** theo mặc định, vì JUnit 5 tạo **một object test mới cho từng @Test** (chế độ {{PER_METHOD}}). Nếu method test cần chạy trong @BeforeAll (mở Playwright cho all @ParameterizedTest) thì bật lớp bằng {{@TestInstance(TestInstance.Lifecycle.PER_CLASS)}} — lúc đó @BeforeAll không cần static.
- **@AfterEach chạy dù test fail.** Đây là chỗ đóng context/ghi screenshot, không được bỏ.
- **Không đặt data của test vào @BeforeAll** nếu suite chạy song song: state chung giữa các test là nguồn gốc của lỗi "chạy một mình thì pass, chạy cả suite thì fail".

JUnit 5 còn có {{@BeforeAll/@AfterAll}} kiểu **per-test** ({{Lifecycle.PER_TEST}} + {{@RegisterExtension}}) — Playwright Java cung cấp extension {{@UsePlaywright}} để page/context tự được tạo và đóng quanh mỗi test; nếu bản bạn dùng không có module đó thì tự viết fixture như code trên, vẫn đúng pattern.

### JUnit 5 hay TestNG
| Khía cạnh | JUnit 5 | TestNG |
|---|---|---|
| Trạng thái | Chuẩn de facto, ecosystem lớn nhất | Phổ biến trong suite Selenium cũ, vẫn nhiều công ty VN dùng |
| Vòng đời | @BeforeAll/@BeforeEach/@BeforeSuite | @BeforeSuite/@BeforeClass/@BeforeMethod (+ alwaysRun) |
| Data-driven | @ParameterizedTest + @CsvSource/@MethodSource | @DataProvider |
| Bỏ/chọn test | @Disabled, @Tag, tag expression | @Test(enabled=false), groups/excludedGroups |
| Song song | @Execution(CONCURRENT) + junit-platform.properties, cấu hình thô hơn | Song song theo methods/classes/dataprovider rất dễ bật |
| Retry | Không có sẵn (tự viết extension) | IRetryAnalyzer có sẵn |
| Extension model | @ExtendWith, parameter resolver | Listener/invocation — mạnh nhưng khó debug |

Trả lời phỏng vấn kiểu "team bạn dùng gì": nói **JUnit 5 cho unit + API test** vì dev quen và tích hợp Maven/Gradle/CI tốt, và nói **TestNG chỉ khi kế thừa suite cũ hoặc cần phân nhóm/song song phức tạp**. Đừng nói "TestNG hiện đại hơn" — nhận định đó thuộc thời JUnit 4.

### Data-driven: một logic, nhiều bộ dữ liệu
Thay vì viết 6 test giống nhau, viết **một** test và cho nó chạy trên bảng dữ liệu.

~~~java
@ParameterizedTest(name = "{0} + {1} = {2}")        // tên ca kiểm thử hiển thị trong báo cáo
@CsvSource({
    "1, 2, 3",
    "10, 20, 30",
    "-5, 5, 0"
})
void adds(int a, int b, int expected) {
    assertEquals(expected, calculator.sum(a, b));
}

@ParameterizedTest
@MethodSource("loginCases")                          // phuong tien: du lieu phuc tap (object, duong dan)
void loginFlow(LoginCase c) {
    LoginPage login = new LoginPage(page).open().as(c.user, c.pass);
    if (c.expectError) assertThat(login.errorBox()).isVisible();
    else assertThat(page.getByTestId("welcome-user")).containsText(c.user);
}

static Stream<LoginCase> loginCases() {                // ten phuong tien khop voi @MethodSource("loginCases")
    return Stream.of(
        new LoginCase("bean", "secret123", false),
        new LoginCase("ghost", "secret123", true));    // LoginCase là record hoặc POJO của team
}
~~~

{{@CsvSource}} tiện cho dữ liệu vô hướng (chuỗi, số) nhưng có bẫy: dấu phẩy là ký tự tách, muốn có dấu phẩy trong giá trị phải bọc nháy đơn, và giá trị rỗng được hiểu là null. Dữ liệu có cấu trúc → dùng {{@MethodSource}}. TestNG tương đương:

~~~java
@DataProvider(name = "browsers")
public static Object[][] browsers() {
    return new Object[][] { { "chromium" }, { "firefox" }, { "webkit" } };
}

@Test(dataProvider = "browsers")
void openHomepage(String browserName) {
    Browser b = Playwright.create().chromium().launch();   // chon browser theo browserName trong code that
    Page p = b.newContext().newPage();
    p.navigate("https://shop.example");
    assertThat(p.getByRole(AriaRole.HEADING)).isVisible();
}
~~~

Chạy một test UI trên 3 engine là ví dụ điển hình data-driven **tiết kiệm tiền**: cùng một code, 3 lần bằng chứng.

### Tag/group: bổ suite từ dòng lệnh
~~~java
@Test @Tag("smoke") void loginWorks() { ... }
@Test @Tag("regression") void paginationOnSearchPage() { ... }
~~~

CI chọn bằng {{mvn -Dgroups=smoke test}} (Surefire) hoặc {{-DexcludedGroups=slow}}; TestNG dùng {{groups}}/{{excludedGroups}} trong testng.xml hoặc {{-Dgroups=}}. Một ca có thể mang nhiều tag. Đây là cách "smoke 5 phút, regression chạy đêm" được hiện thực hoá mà không cần two repo riêng.

### Retry và @RepeatedTest: hai thứ hay bị nhầm
{{@RepeatedTest(5)}} chạy lại test **5 lần để tìm bug lặp** (nó không biến fail thành pass). **Retry** thì ngược lại: fail lần 1, tự chạy lại, pass lần 2 thì suite báo xanh. TestNG có {{IRetryAnalyzer}}; JUnit 5 phải tự viết extension. Retry là con dao: nó làm đỏ CI ít hơn nhưng **che flaky test** — mà flaky không sửa sẽ thành test nobody tin. Chuẩn nên dùng: tối đa 1 lần retry, **ghi log số lần retry của mỗi ca** vào báo cáo (Allure có metadata), và đặt trần "tuần trước có bao nhiêu ca phải retry" — nếu > 2% tổng số ca thì dừng viết test mới, đi sửa flaky trước.

### Vì sao nên tránh dependsOnMethods
TestNG cho phép {{@Test(dependsOnMethods = "login")}}. Nó hoạt động, nhưng tạo ba vấn đề: (1) test con bị **skip im lặng** khi test cha fail, báo cáo mất thông tin; (2) **không chạy song song** được, vì thứ tự thành phụ thuộc; (3) nó khuyến khích **state dây chuyền** — login lưu user vào field tĩnh rồi test "checkout" đọc tiếp, nên một thay đổi nhỏ ở login làm 10 test fail khó lần. Cách thay thế: mỗi test **tự chuẩn bị tiền điều kiện** (gọi API tạo dữ liệu, hoặc {{storageState}} đã login sẵn — nhanh hơn UI login), hoặc đưa phần setup chung lên {{@BeforeEach}}.

### Ba lỗi hay gặp
- Đặt **driver/context ở field tĩnh** để "khỏi tạo lại" → hai thread dẫm nhau khi bật parallel; luôn truyền driver qua constructor như bài POM.
- Quên **đóng Playwright/Browser** ở @AfterAll → CI leak tiến trình, build sau fail vì hết bộ nhớ.
- @BeforeEach **chỉ log in** (chạy lệnh) để "nhìn xem có vào không" mà không assert → test xanh rỗng.

### Liên hệ phỏng vấn
Câu hỏi thường gặp: "JUnit 5 khác TestNG thế nào", "Viết test chạy với 3 browser mà không copy code", "Test của bạn phụ thuộc nhau không", "Team bạn xử lý flaky test ra sao". Khung trả lời: nêu cơ chế (annotation → vòng đời → data provider → tag), đưa một ví dụ cụ thể của bạn (số ca, thời gian suite), kết bằng một quyết định có lý do ("tôi tắt dependsOnMethods vì parallel, thay bằng storage state"). Người phỏng vấn SDET đánh giá cao câu trả lời có **đánh đổi** hơn câu trả lời liệt kê API.

> Senior tip: thời gian suite hầu như luôn bị ăn bởi **setup**, không phải bởi assert. Đo thử một @BeforeEach mở trang mất bao lâu so với một context đã chuẩn bị sẵn qua API + storage state: khác biệt thường 5–20 lần, và đó là lý do JUnit 5/TestNG có {{@BeforeAll}}/{{@BeforeSuite}} — đặt phần đắt ở cấp suite, phần rẻ (context sạch) ở cấp test.`,
  exercises: [
    {
      title: 'Mini runner: đọc bảng CSV và báo PASS/FAIL theo tên ca kiểm thử có tham số',
      prompt: `Một test runner thật làm đúng ba việc: **đọc bảng dữ liệu**, **chạy hàm kiểm thử cho từng dòng**, **đặt tên ca kiểm thử theo dữ liệu** ({{@ParameterizedTest(name = ...)}}). Bạn sẽ viết tối thiểu phần đó.

Viết class {{TestTable}} với 4 hàm tĩnh:

**1.** {{List<Map<String, String>> rows(String csv)}} — dòng đầu là header, các dòng sau là dữ liệu; mỗi dòng trả về một {{LinkedHashMap}} giữ đúng thứ tự cột.
- Field được tách bằng dấu phẩy, và **giá trị được cắt khoảng trắng hai đầu**.
- Field bọc trong nháy kép cho phép chứa dấu phẩy; hai dấu nháy kép liền nhau bên trong field bọc nháy là **một** dấu nháy thật.
- Dòng trống (hoặc chỉ toàn khoảng trắng) bị bỏ qua, kể cả dòng cuối nằm sau ký tự xuống dòng.
- {{csv}} không có dòng nào → ném {{IllegalArgumentException}}.
- Số field của một dòng khác số cột của header → ném {{IllegalArgumentException}}, message nêu số cột của dòng đó và của header.

**2.** {{String render(String template, Map<String, String> row)}} — template chứa các token dạng {tên-cột} (ngoặc nhọn đơn); mỗi token được thay bằng giá trị của cột đó ở dòng đang chạy.
- Tên cột không có trong header → ném {{IllegalArgumentException}} với message bắt đầu bằng {{Cot khong ton tai: }} rồi tới tên cột.
- Template có ngoặc nhọn mở mà không có ngoặc đóng → ném {{IllegalArgumentException}}.

**3.** {{List<String> run(String csv, String nameTemplate, Function<Map<String, String>, Boolean> check)}} — với từng dòng: dựng tên ca bằng {{render}}, rồi gọi {{check}}.
- {{check}} trả {{true}} → dòng báo cáo {{PASS tên}}; trả {{false}} → {{FAIL tên}}.
- {{check}} ném {{RuntimeException}} → {{FAIL tên: message}}; nếu message null thì dùng tên simple của exception ({{getClass().getSimpleName()}}).
- Trả về danh sách dòng báo cáo **theo đúng thứ tự dòng dữ liệu**.

**4.** {{String summary(List<String> report)}} — đếm dòng bắt đầu bằng {{PASS }} và {{FAIL }}, trả chuỗi dạng {{passed=1 failed=2}}. Danh sách rỗng → {{passed=0 failed=0}}.

Ràng buộc: chỉ dùng JDK, hàm static, không đọc file, không dùng thời gian thực hay random.`,
      starter: `final class TestTable {
    static List<Map<String, String>> rows(String csv) {
        throw new UnsupportedOperationException("TODO");
    }

    static String render(String template, Map<String, String> row) {
        throw new UnsupportedOperationException("TODO");
    }

    static List<String> run(String csv, String nameTemplate, Function<Map<String, String>, Boolean> check) {
        throw new UnsupportedOperationException("TODO");
    }

    static String summary(List<String> report) {
        throw new UnsupportedOperationException("TODO");
    }
}`,
      tests: `public class Main {
    static int passed = 0, total = 0;
    interface Body { boolean get() throws Exception; }
    static void check(String name, Body b) {
        total++;
        boolean ok; String detail = "";
        try { ok = b.get(); }
        catch (Throwable t) { ok = false; detail = "ngoai loi " + t.getClass().getSimpleName() + " " + t.getMessage(); }
        if (ok) { passed++; System.out.println("PASS " + name); }
        else System.out.println("FAIL " + name + ": " + detail);
    }
    static String thrown(Runnable r) {
        try { r.run(); return "khong-nem"; }
        catch (IllegalArgumentException e) { return "iae"; }
        catch (Throwable t) { return "sai-loai-" + t.getClass().getSimpleName(); }
    }
    static final String CSV = "user,pass,expect\\nbean,secret123,ok\\nqa,\\"pa,ss\\",ok\\nghost,x,fail";
    public static void main(String[] args) {
        check("rows doc duoc 3 dong va giu thu tu cot", () -> {
            List<Map<String, String>> rs = TestTable.rows(CSV);
            return rs.size() == 3 && new ArrayList<>(rs.get(0).keySet()).equals(List.of("user", "pass", "expect"));
        });
        check("rows dấu phẩy trong ngoặc kép không tách cột", () -> TestTable.rows(CSV).get(1).get("pass").equals("pa,ss"));
        check("rows gia tri duoc cat khoang trang hai dau", () -> TestTable.rows("k1, k2\\n  v1 , v2  ").get(0).get("k2").equals("v2"));
        check("rows hai dau nhay kep la mot dau nhay that", () ->
            TestTable.rows("note\\n\\"say \\"\\"hi\\"\\"\\"").get(0).get("note").equals("say \\"hi\\""));
        check("rows bo dong trong", () -> TestTable.rows("a,b\\n\\n1,2\\n").size() == 1);
        check("rows khong co dong nao nem IAE", () -> thrown(() -> TestTable.rows("  ")).equals("iae"));
        check("rows lech so cot nem IAE", () -> thrown(() -> TestTable.rows("a,b\\n1,2,3")).equals("iae"));
        check("render thay token bang gia tri cot", () -> {
            Map<String, String> row = TestTable.rows(CSV).get(0);
            return TestTable.render("login {user} (expect {expect})", row).equals("login bean (expect ok)");
        });
        check("render cột không tồn tại ném IAE đúng message", () -> {
            try {
                TestTable.render("{nope}", Map.of("user", "bean"));
                return false;
            } catch (IllegalArgumentException e) {
                return "Cot khong ton tai: nope".equals(e.getMessage());
            }
        });
        check("render ngoac mo khong dong nem IAE", () -> thrown(() -> TestTable.render("{user", Map.of("user", "bean"))).equals("iae"));
        check("run PASS va FAIL dung theo ket qua check", () ->
            TestTable.run(CSV, "{user} -> {expect}", row -> row.get("user").equals("bean"))
                .equals(List.of("PASS bean -> ok", "FAIL qa -> ok", "FAIL ghost -> fail")));
        check("run exception cua check thanh FAIL kem message", () ->
            TestTable.run("user\\nbean", "{user}", row -> { throw new IllegalStateException("boom"); })
                .equals(List.of("FAIL bean: boom")));
        check("run exception không có message dùng tên class", () -> {
            List<String> rep = TestTable.run("user\\nbean", "{user}", row -> { throw new NullPointerException(); });
            return rep.equals(List.of("FAIL bean: NullPointerException"));
        });
        check("summary dem passed va failed", () ->
            TestTable.summary(List.of("PASS a", "FAIL b", "FAIL c", "PASS d")).equals("passed=2 failed=2"));
        check("summary bao cao rong", () -> TestTable.summary(List.of()).equals("passed=0 failed=0"));
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
      reference: `final class TestTable {
    static List<Map<String, String>> rows(String csv) {
        List<String[]> recs = new ArrayList<>();
        for (String line : String.valueOf(csv).split("\\r?\\n", -1)) {
            if (line.trim().isEmpty()) continue;
            recs.add(fields(line));
        }
        if (recs.isEmpty()) throw new IllegalArgumentException("CSV rong: khong co dong tieu de");
        String[] header = recs.get(0);
        List<Map<String, String>> out = new ArrayList<>();
        for (int i = 1; i < recs.size(); i++) {
            String[] rec = recs.get(i);
            if (rec.length != header.length) {
                throw new IllegalArgumentException("Dong " + (i + 1) + " co " + rec.length + " cot, tieu de co " + header.length + " cot");
            }
            Map<String, String> row = new LinkedHashMap<>();
            for (int c = 0; c < header.length; c++) row.put(header[c], rec[c]);
            out.add(row);
        }
        return out;
    }

    static String render(String template, Map<String, String> row) {
        StringBuilder sb = new StringBuilder();
        int i = 0;
        while (i < template.length()) {
            char ch = template.charAt(i);
            if (ch != '{') { sb.append(ch); i++; continue; }
            int close = template.indexOf('}', i + 1);
            if (close < 0) throw new IllegalArgumentException("Template mo ngoac khong dong: " + template);
            String col = template.substring(i + 1, close);
            if (!row.containsKey(col)) throw new IllegalArgumentException("Cot khong ton tai: " + col);
            sb.append(row.get(col));
            i = close + 1;
        }
        return sb.toString();
    }

    static List<String> run(String csv, String nameTemplate, Function<Map<String, String>, Boolean> check) {
        List<Map<String, String>> table = rows(csv);
        List<String> report = new ArrayList<>();
        for (Map<String, String> row : table) {
            String name = render(nameTemplate, row);
            try {
                report.add(Boolean.TRUE.equals(check.apply(row)) ? "PASS " + name : "FAIL " + name);
            } catch (RuntimeException e) {
                String msg = e.getMessage() == null ? e.getClass().getSimpleName() : e.getMessage();
                report.add("FAIL " + name + ": " + msg);
            }
        }
        return report;
    }

    static String summary(List<String> report) {
        int ok = 0, bad = 0;
        for (String line : report) {
            if (line.startsWith("PASS ")) ok++;
            else if (line.startsWith("FAIL ")) bad++;
        }
        return "passed=" + ok + " failed=" + bad;
    }

    private static String[] fields(String line) {
        List<String> parts = new ArrayList<>();
        StringBuilder cur = new StringBuilder();
        boolean quoted = false;
        for (int i = 0; i < line.length(); i++) {
            char ch = line.charAt(i);
            if (quoted) {
                if (ch == '"') {
                    if (i + 1 < line.length() && line.charAt(i + 1) == '"') { cur.append('"'); i++; }
                    else quoted = false;
                } else cur.append(ch);
            } else if (ch == '"') quoted = true;
            else if (ch == ',') { parts.add(cur.toString().trim()); cur.setLength(0); }
            else cur.append(ch);
        }
        parts.add(cur.toString().trim());
        return parts.toArray(new String[0]);
    }
}`,
      hints: [
        'Tách field: duyệt ký tự với cờ quoted (đang trong nháy kép). Gặp hai dấu nháy kép liền nhau khi đang quoted thì thêm một ký tự nháy vào kết quả và nhảy qua ký tự kế. Khi ngoài nháy, dấu phẩy mới là ký tự tách.',
        'Chia dòng: {{String.valueOf(csv).split("\\r?\\n", -1)}} rồi bỏ qua dòng có {{trim()}} rỗng; {{-1}} giữ dòng cuối để không tự mất ký tự rỗng.',
        'Giữ thứ tự cột: dùng {{LinkedHashMap}} (không phải HashMap). Kiểm tra cột có tồn tại bằng {{containsKey}}, đừng dùng {{get}} trả null.',
        'Trong run: {{Boolean.TRUE.equals(check.apply(row))}} an toàn hơn {{check.apply(row)}} trần vì Function có thể trả null.',
      ],
      explain: `Ba điểm khiến bài này giống runner thật:

1. **Tên ca kiểm thử sinh từ dữ liệu.** {{render}} mô phỏng đúng tham số {{name}} của {{@ParameterizedTest}}: JUnit thay các token tham số bằng giá trị thật. Báo cáo ghi {{FAIL qa -> ok}} chứ không ghi {{FAIL loginFlow}}, để người đọc CI biết ngay dòng dữ liệu nào sai mà không phải mở code.
2. **{{LinkedHashMap}} everywhere.** HashMap làm lộ vị trí cột, và khi bảng có hai cột trùng tên thì runner phải fail sớm ({{put}} ghi đè là hành vi bạn nên biết để tránh, không kiểm ở đây).
3. **Exception của check trở thành FAIL, không làm sập suite.** Runner thật làm đúng như vậy: mỗi ca một vùng bọc lỗi, còn exception của **chính runner** (bảng CSV sai, thiếu cột) thì ném {{IllegalArgumentException}} để fail nhanh — phân biệt hai loại này là điểm hay bị hỏi trong phỏng vấn.

{{summary}} đếm theo prefix {{PASS }}/{{FAIL }} chứ không theo nội dung, mô phỏng đúng cách CI parse stdout của JUnit XML: báo cáo là **chuỗi có hợp đồng**, đó là lý do không bao giờ được in log lộn xộn vào stdout khi dùng text report.`,
    },
  ],
  check: [
    {
      q: 'Vì sao @BeforeAll phải là static trong JUnit 5 ở chế độ mặc định?',
      options: [
        'Vì JUnit 5 không hỗ trợ annotation không static',
        'Vì mặc định JUnit 5 tạo một object test mới cho từng @Test (PER_METHOD), nên không có instance chung để gọi method',
        'Vì static chạy nhanh hơn',
        'Vì @BeforeAll chạy sau @BeforeEach',
      ],
      answer: 1,
      explain: 'Instance là per-test, còn @BeforeAll chạy một lần trước khi có instance nào. Chuyển sang @TestInstance(PER_CLASS) thì @BeforeAll bỏ được static — đổi lại state trong object được chia sẻ giữa các test, phải cẩn thận khi bật parallel.',
    },
    {
      q: 'Tình huống nào hợp với @MethodSource hơn @CsvSource?',
      options: [
        'Bảng dữ liệu là các cặp số nguyên đơn giản',
        'Dữ liệu cần object có cấu trúc, ví dụ LoginCase(user, pass, expectError)',
        'Khi muốn test chạy song song',
        'Khi cần tag smoke cho test',
      ],
      answer: 1,
      explain: '@CsvSource chỉ mang giá trị vô hướng trong chuỗi và có bẫy dấu phẩy/null. @MethodSource cho trả về Arguments/Object chứa object thật, đọc rõ và refactor được.',
    },
    {
      q: 'Khác nhau giữa @RepeatedTest(5) và retry khi fail là gì?',
      options: [
        'Giống nhau, chỉ khác tên gọi',
        '@RepeatedTest chạy 5 lần để tìm lỗi lặp; retry chạy lại khi fail và báo pass nếu lần sau đúng',
        'Retry chỉ hoạt động với TestNG',
        '@RepeatedTest luôn fail khi một lần fail',
      ],
      answer: 1,
      explain: '@RepeatedTest là công cụ tìm race condition (5 lần đều phải pass). Retry là cơ chế che flaky: fail lần 1 nhưng suite vẫn xanh — cần ghi số lần retry vào báo cáo chứ không dùng để làm CI hết đỏ.',
    },
    {
      q: 'Vì sao dependsOnMethods (TestNG) bị coi là anti-pattern cho suite UI?',
      options: [
        'Nó không tồn tại trong TestNG',
        'Test con bị skip im lặng khi test cha fail, chặn parallel và tạo state dây chuyền khó debug',
        'Nó làm tăng timeout của driver',
        'Nó bắt buộc dùng @DataProvider',
      ],
      answer: 1,
      explain: 'Thứ tự trở thành phụ thuộc: một thay đổi ở login kéo 10 test biến mất khỏi báo cáo (skip), và bạn không thể chạy song song. Thay bằng setup tự thân hoặc storage state đã đăng nhập.',
    },
  ],
  related: ['autotest-007'],
  tags: ['JUnit 5', 'TestNG', 'lifecycle', 'parameterized test', 'data-driven', 'tags', 'retry', 'CI'],
},
{
  id: 'lesson-autotest-006',
  track: 'autotest',
  order: 6,
  title: 'API automation với REST Assured: given/when/then, JsonPath, schema, chain request',
  level: 'senior',
  minutes: 40,
  goals: [
    'Giải thích vì sao suite API nên đông hơn suite UI và định lượng được chi phí bảo trì',
    'Viết một ca kiểm thử REST Assured kiểm status code, header và nhiều JsonPath trong body',
    'Chain hai request (tạo rồi dùng id vừa tạo) và dọn dữ liệu test một cách an toàn khi chạy song song',
    'Dùng APIRequestContext của Playwright để chuẩn bị phiên đăng nhập cho test UI thay vì login qua giao diện',
  ],
  body: `### Vì sao tầng API phải là tầng đông nhất trong suite automation
**API test** là chương trình gọi thẳng HTTP tới backend ({{POST /books}}) rồi so đáp án với mong đợi — **không mở trình duyệt, không render HTML, không click**. Vì đi tắt nên nó nhanh hơn UI test thường 20–100 lần (vài chục mili-giây so với vài giây), và vì không nhân tố giao diện nên nó **không vỡ khi designer đổi CSS**. Quan trọng hơn: phần lớn lỗi nghiệp vụ nằm ở tầng này — validate sai, tính tiền sai, phân quyền sót, mã hoá ngày giờ sai, phân trang thiếu phần tử cuối... UI chỉ là lớp sơn bên trên.

| | API test | UI test |
|---|---|---|
| Thời gian một ca | 20–200 ms | 2–15 s |
| Vỡ khi đổi giao diện | không | có |
| Bắt được lỗi logic/phân quyền | trực tiếp | phải đi qua 5 cú click |
| Chi phí bảo trì mỗi 100 ca | thấp | cao nhất trong suite |
| Chạy được trong CI mỗi commit | dễ | chỉ smoke |

Tỉ lệ thực tế của một suite khỏe: **~70% API, ~25% unit của dev, ~5% UI E2E**.UI chỉ giữ những luồng mà lỗi chỉ hiện ra khi có trình duyệt (JavaScript, redirect, upload, iframe).

### given / when / then: đọc như một câu tiếng Anh
~~~java
// REST Assured 5.x (io.restassured:rest-assured) — đọc để hiểu, không chạy được trong trình duyệt
import static io.restassured.RestAssured.*;
import static org.hamcrest.Matchers.*;

given()                                  // GIVEN = tien dieu kien: base url, header, body, auth
    .header("Content-Type", "application/json")
    .body("{ \\"title\\": \\"Effective Java\\" }")
.when()                                  // WHEN = hanh dong: phuong thuc + duong dan
    .post("/books")
.then()                                  // THEN = phan xu: status, header, body
    .statusCode(201)
    .header("Location", "/books/99")
    .contentType("application/json")
    .body("id", notNullValue())
    .body("title", equalTo("Effective Java"));
~~~

Ba từ khóa chỉ là **cấu trúc câu** cho người đọc: {{given}} gom mọi thứ gửi đi, {{when}} tách phần gửi khỏi phần nhận, {{then}} là chuỗi assert — mỗi assert fail sẽ ném {{AssertionError}} ngay tại chỗ và stop ca đó. {{assertThat()}} là alias của {{then()}}, dùng khi muốn nhấn mạnh "từ đây toàn là assert".

### JsonPath: lấy đúng ô trong cây JSON
**JsonPath** là cú pháp trỏ vào một node của tài liệu JSON, giống như CSS selector trỏ vào node DOM: {{data.items[1].title}} = "cho tôi key data, trong đó key items, phần tử thứ hai của mảng, rồi key title". REST Assured đánh giá JsonPath trên body rồi so với matcher Hamcrest: {{equalTo}}, {{notNullValue()}}, {{hasSize()}}, {{containsString()}}, {{greaterThanOrEqualTo()}}.

Để **lưu giá trị dùng tiếp** (chứ không chỉ so), dùng {{extract()}}:

~~~java
String id = given().when().get("/books").then().extract().path("data.items[0].id");
int total = given().when().get("/books").then().extract().jsonPath().getInt("total");
Book[] books = given().when().get("/books").then().extract().as(Book[].class);   // map sang POJO
~~~

{{as(Book[].class)}} (object mapping) tiện nhưng có giá: test dính vào class Java, thêm field là phải sửa POJO. Nhiều team chỉ dùng {{path(...)}} cho vài giá trị cần thiết để giữ test nhẹ.

### Vì sao status 200 là chưa đủ: schema validation
Bẫy kinh điển: dev đổi tên field {{title}} thành {{name}}. JsonPath của bạn trỏ vào {{title}} → trả về **null**; nếu chỉ assert {{statusCode(200)}} thì test vẫn **xanh**. Schema validation kiểm **hình dạng** đáp án: field nào bắt buộc có, kiểu gì, có pattern nào.

~~~java
// can them dependency rest-assured-json-schema-validator (io.restassured.module.jsv)
given().when().get("/books")
    .then()
    .statusCode(200)
    .body(matchesJsonSchemaInClasspath("schemas/books-list.json"));
// schema JSON Draft-07 kiem required + type:
//   "required": ["id", "title"], "properties": { "id": {"type": "integer"}, "title": {"type": "string"} }
~~~

Kèm theo đó là hai kiểm tra rẻ mà nhiều suite bỏ: {{contentType("application/json")}} (dev trả text/plain là JsonPath vẫn chạy nhưng client thật hỏng) và kiểm **pagination**: {{hasSize(20)}} cho trang đầu, {{data.items[19].id}} tồn tại, và trang 2 không trùng trang 1.

### Chain request và dọn dữ liệu test
Luồng thật: tạo → đọc → sửa → xoá. Giá trị ở bước sau đến từ bước trước, nên phải **extract**, không được đoán.

~~~seq
title: Chuan bi va don du lieu test qua API
actors: Test | API Gateway | Order Service | Database
Test -> API Gateway: POST /orders tao don hang
API Gateway -> Order Service: chuyen tiep request kem token
Order Service -> Database: insert row order
Database --> Order Service: id = 4217
Order Service --> API Gateway: 201 { id: 4217 }
API Gateway --> Test: 201 va header Location
Test -> API Gateway: DELETE /orders/4217 o AfterEach
API Gateway -> Database: delete hoac soft delete
note Test..Database: id lấy bằng extract, không hard-code
~~~

Nguyên tắc dữ liệu test (SDET bị hỏi câu này liên tục):
- **Mỗi ca tự tạo dữ liệu riêng** qua API, không dùng "user test chung trên staging" — người khác đổi mật khẩu là 40 ca fail cùng lúc.
- **Dọn trong {{@AfterEach}}** (hoặc {{@AfterSuite}} cho fixture cấp suite), và **dọn bằng API/SQL chứ không qua UI**.
- Dữ liệu có ràng buộc unique (email, số điện thoại) → sinh giá trị riêng mỗi ca, ví dụ {{email = "qa-" + UUID.randomUUID() + "@example.com"}}. Dùng random ở **dữ liệu** thì ổn; chỉ cấm random ở **kết quả mong đợi**.
- Chạy song song: hai thread cùng {{DELETE /orders/}} một id → một thread 404, fail oan. Mỗi thread một resource, không chia sẻ state tĩnh.

### Playwright APIRequestContext: API phục vụ test UI
Playwright for Java có sẵn client HTTP dùng chung tiến trình browser, hợp để **setup dữ liệu/đăng nhập** cho test UI mà không cần thêm REST Assured:

~~~java
Playwright playwright = Playwright.create();
APIRequestContext api = playwright.request()
    .newContext(new APIRequestOptions().setBaseURL("https://api.shop.example/"));

APIResponse login = api.post("v1/login", RequestOptions.create()
    .setHeader("Content-Type", "application/json")
    .setData(Map.of("user", "bean", "pass", "secret123")));      // Object duoc tu serialize JSON

if (login.status() != 200) throw new IllegalStateException("login that bai: " + login.status());
Map<String, Object> payload = (Map<String, Object>) login.json();   // json() tra ve Map/List
String token = String.valueOf(payload.get("token"));                // token dung cho cac goi API khac

Browser browser = playwright.chromium().launch();
BrowserContext fresh = browser.newContext();
// Lưu cookie + localStorage của ngay sau login để tái dùng cho mọi test UI
fresh.storageState(new BrowserContext.StorageStateOptions().setPath(Paths.get("auth.json")));

// Test UI bất kỳ: mở context dùng nạp sẵn session, không cần login qua giao diện
BrowserContext reused = browser.newContext(
    new Browser.NewContextOptions().setStorageStatePath(Paths.get("auth.json")));
Page page = reused.newPage();
page.navigate("https://shop.example/cart");
api.dispose();                                                      // don client HTTP khi xong
~~~

Hai pattern đáng học: (1) **login một lần ở @BeforeAll, lưu storageState ra file**, mọi test UI mở context với {{setStorageStatePath(Paths.get("auth.json"))}} — bỏ được 5 giây login UI mỗi ca; (2) **tạo đơn hàng bằng API rồi chỉ UI kiểm tra phần hiển thị** — UI test không còn phải bấm 12 cú click để có dữ liệu.

### Khi nào cần fake server: WireMock và Testcontainers
- **WireMock** (package {{com.github.tomakehurst.wiremock}}): dựng HTTP server giả để test client mà không cần service thật, dùng khi đối tác chậm/chưa xong hoặc khi cần mô phỏng 500/timeout.
~~~java
stubFor(get(urlEqualTo("/v1/books")).willReturn(aResponse()
    .withStatus(200).withHeader("Content-Type", "application/json")
    .withBody("{ \\"total\\": 0, \\"data\\": { \\"items\\": [] } }")));
~~~
- **Testcontainers**: dựng Postgres/Kafka thật trong Docker cho suite integration — nhanh hơn xin môi trường, dữ liệu sạch sau mỗi class.
- **Contract test** (Pact, OpenAPI): kiểm nhà cung cấp API và consumer khớp hợp đồng trước khi tích hợp — nói tên được là đủ trong phỏng vấn, trừ khi team bạn thật sự dùng.

### Lỗi hay gặp
- **Hard-code base URL / id / token** trong test → suite chỉ chạy trên một máy. Base URL phải lấy từ biến môi trường hoặc {{baseUriPath}} cấu hình.
- **So sánh nguyên văn cả body JSON** ({{equalTo(fullJson)}}): thêm một field mới là fail oan. Chỉ assert field mình quan tâm + schema.
- **Assert ngày giờ/UUID** mà không chuẩn hóa → fail mọi lần chạy.
- **{{Thread.sleep(2000)}}** chờ dữ liệu bất đồng bộ: sai cả về tốc độ lẫn độ tin. Với luồng consumer (Kafka, job chạy nền), dùng **Awaitility**: {{await().atMost(Duration.ofSeconds(5)).untilAsserted(() -> assertEquals("DONE", orders.status(orderId)))}} — nó poll mỗi 100 ms rồi fail khi hết trần.
- **Test không dọn dữ liệu** → tuần thứ ba suite bắt đầu fail vì trùng unique key, và không ai còn tin báo cáo.
- Bỏ qua kiểm **status code của request cleanup**: {{delete}} trả 403 (không có quyền) nhưng không ai nhìn, nên rác tích âm thầm.

### Liên hệ phỏng vấn
Câu hay hỏi: "Bạn tổ chức API test thế nào trong framework?", "Kiểm tra hợp đồng API ra sao?", "Test phụ thuộc dữ liệu giữa các bước thì xử lý?", "Vì sao UI test của bạn flaky mà API test thì không?". Trả lời theo ba tầng: **cấu trúc** ({{given/when/then}} + base URL từ config + spec tái dùng qua {{RequestSpecBuilder}}), **dữ liệu** (tạo qua API, dọn ở {{@AfterEach}}, id không hard-code), **độ tin** (assert có chủ đích, schema validation, Awaitility cho luồng bất đồng bộ). Ai hỏi sâu hơn "so sánh REST Assured với Playwright APIRequestContext" — câu trả lời thẳng: REST Assured giàu matcher + schema + object mapping cho suite API chuyên biệt; Playwright client tiện vì đã có sẵn trong suite UI, chia sẻ cookie/headers với browser context.

> Senior tip: hãy thêm một ca "hợp đồng" cho mỗi API quan trọng: gọi endpoint với payload tối thiểu rồi assert **danh sách field bắt buộc** bằng schema. Ca này fail trong 3 giây ngay khi dev đổi tên field, cứu được 40 ca UI đang fail mờ hồ vì JsonPath trả null. Một suite API tốt không chỉ chứng minh tính năng chạy đúng — nó phát hiện **hợp đồng bị phá** trước khi hợp đồng đó làm hỏng cả frontend.`,
  exercises: [
    {
      title: 'Tự viết mini REST Assured: DSL given/when/then chạy trên fake HTTP handler',
      prompt: `{{FakeHttp}} là một fake HTTP server: routes là {{Map}} tra theo khóa {{METHOD + " " + duong dan}}, mỗi giá trị là một lambda {{FakeHttp.Handler}} (functional interface). Nó đã viết xong, **không sửa**. Handler tra về {{FakeHttp.Resp(status, headers, body)}} với body là {{Map}}/{{List}}/{{String}} — tức JSON **đã decode**, nên bạn không cần viết JSON parser.

Hãy viết phần còn lại của DSL, mô phỏng REST Assured:

**1.** {{final class M}} — các matcher Hamcrest thu nhỏ. {{Matcher}} đã cho: {{boolean test(Object actual)}} và {{String describe()}}.
- {{M.equalTo(expected)}}: đúng khi {{Objects.equals(actual, expected)}}; describe là {{equalTo }} nối với chuỗi của expected.
- {{M.notNullValue()}}: đúng khi actual khác null; describe là {{notNullValue}}.
- {{M.containsString(needle)}}: đúng khi actual là String và chứa needle; describe là {{containsString }} nối needle.
- {{M.hasSize(expected)}}: đúng khi actual là {{Collection}} hoặc {{Map}} và số phần tử bằng expected; describe là {{hasSize }} nối expected.

**2.** {{Json.eval(Object root, String path)}} — đánh giá JsonPath trên {{Map}}/{{List}}.
- Tách theo dấu chấm: mỗi token là tên key, có thể kèm các hậu tố {{[chi-so}}], ví dụ {{data.items[1].title}} hoặc {{[0].id}} (token đầu rỗng = đi thẳng vào mảng).
- Key trên {{Map}}: lấy giá trị; nếu node hiện tại **không phải Map** thì kết quả là null.
- {{[i]}}: chỉ áp dụng cho {{List}}; âm hoặc vượt độ dài thì null (không ném exception). Index không phải số thì null.
- Gặp null thì dừng và trả null. {{path}} có ngoặc vuông mở mà không đóng → ném {{IllegalArgumentException}}.

**3.** Chuỗi DSL ({{Rest}}, {{Given}}, {{When}}, {{Then}}) — phần khung đã cho sẵn constructor và field, bạn viết hành vi:
- {{Rest.given(server)}} tra về {{Given}}.
- {{Given.header(name, value)}} lưu header (ghi đè theo tên) và **trả chính nó**; {{Given.body(rawJson)}} lưu body gửi đi, trả chính nó; {{Given.when()}} tra về {{When}} giữ server + headers + body.
- {{When.get(path)}}, {{When.post(path)}}, {{When.put(path)}}, {{When.delete(path)}}: gọi {{server.handle(METHOD, path, headers, body)}} và bọc đáp án vào {{Then}}.
- {{Then.statusCode(expected)}}: lệch thì ném {{AssertionError}} với message chính xác {{statusCode: expected X but was Y}}; đúng thì trả chính nó.
- {{Then.header(name, matcher)}}: sai matcher thì ném {{AssertionError}} message {{header TEN: expected ... but was ...}}.
- {{Then.body(path, matcher)}}: sai thì ném {{AssertionError}} message {{DUONG-DAN: expected ... but was ...}} (label chính là path, không có tiền tố).
- {{Then.extract(path)}}: trả giá trị theo JsonPath (null nếu không có). {{Then.response()}}: trả {{FakeHttp.Resp}} gốc.

Không dùng thư viện ngoài, không mạng, không thời gian thực.`,
      starter: `interface Matcher {
    boolean test(Object actual);

    String describe();
}

final class FakeHttp {
    interface Handler {
        Resp handle(Req req);
    }

    static final class Req {
        final String method, path, body;
        final Map<String, String> headers;

        Req(String method, String path, Map<String, String> headers, String body) {
            this.method = method;
            this.path = path;
            this.headers = headers;
            this.body = body;
        }

        String header(String name) {
            return headers.get(name);
        }
    }

    static final class Resp {
        final int status;
        final Map<String, String> headers;
        final Object body;

        Resp(int status, Map<String, String> headers, Object body) {
            this.status = status;
            this.headers = headers;
            this.body = body;
        }

        String header(String name) {
            return headers.get(name);
        }
    }

    private final Map<String, Handler> routes = new LinkedHashMap<>();

    FakeHttp on(String method, String path, Handler handler) {
        routes.put(method + " " + path, handler);
        return this;
    }

    Resp handle(String method, String path, Map<String, String> headers, String body) {
        Handler hit = routes.get(method + " " + path);
        if (hit != null) return hit.handle(new Req(method, path, new LinkedHashMap<>(headers), body));
        for (String key : routes.keySet()) {
            if (key.endsWith(" " + path)) return new Resp(405, new LinkedHashMap<>(), "method not allowed: " + path);
        }
        return new Resp(404, new LinkedHashMap<>(), "no route: " + method + " " + path);
    }
}

final class M {
    static Matcher equalTo(Object expected) {
        throw new UnsupportedOperationException("TODO");
    }

    static Matcher notNullValue() {
        throw new UnsupportedOperationException("TODO");
    }

    static Matcher containsString(String needle) {
        throw new UnsupportedOperationException("TODO");
    }

    static Matcher hasSize(int expected) {
        throw new UnsupportedOperationException("TODO");
    }
}

final class Json {
    static Object eval(Object root, String path) {
        throw new UnsupportedOperationException("TODO");
    }
}

final class Rest {
    static Given given(FakeHttp server) {
        throw new UnsupportedOperationException("TODO");
    }
}

final class Given {
    private final FakeHttp server;
    private final Map<String, String> headers = new LinkedHashMap<>();
    private String body = "";

    Given(FakeHttp server) {
        this.server = server;
    }

    Given header(String name, String value) {
        throw new UnsupportedOperationException("TODO");
    }

    Given body(String rawJson) {
        throw new UnsupportedOperationException("TODO");
    }

    When when() {
        throw new UnsupportedOperationException("TODO");
    }
}

final class When {
    private final FakeHttp server;
    private final Map<String, String> headers;
    private final String body;

    When(FakeHttp server, Map<String, String> headers, String body) {
        this.server = server;
        this.headers = headers;
        this.body = body;
    }

    Then get(String path) {
        throw new UnsupportedOperationException("TODO");
    }

    Then post(String path) {
        throw new UnsupportedOperationException("TODO");
    }

    Then put(String path) {
        throw new UnsupportedOperationException("TODO");
    }

    Then delete(String path) {
        throw new UnsupportedOperationException("TODO");
    }
}

final class Then {
    private final FakeHttp.Resp resp;

    Then(FakeHttp.Resp resp) {
        this.resp = resp;
    }

    Then statusCode(int expected) {
        throw new UnsupportedOperationException("TODO");
    }

    Then header(String name, Matcher matcher) {
        throw new UnsupportedOperationException("TODO");
    }

    Then body(String path, Matcher matcher) {
        throw new UnsupportedOperationException("TODO");
    }

    Object extract(String path) {
        throw new UnsupportedOperationException("TODO");
    }

    FakeHttp.Resp response() {
        throw new UnsupportedOperationException("TODO");
    }
}`,
      tests: `public class Main {
    static int passed = 0, total = 0;
    interface Body { boolean get() throws Exception; }
    static void check(String name, Body b) {
        total++;
        boolean ok; String detail = "";
        try { ok = b.get(); }
        catch (Throwable t) { ok = false; detail = "ngoai loi " + t.getClass().getSimpleName() + " " + t.getMessage(); }
        if (ok) { passed++; System.out.println("PASS " + name); }
        else System.out.println("FAIL " + name + ": " + detail);
    }
    interface Act { void run() throws Exception; }
    static String failMessage(Act a) {
        try { a.run(); return ""; }
        catch (AssertionError e) { return String.valueOf(e.getMessage()); }
        catch (Throwable t) { return "KO-PHI-ASSERTION " + t.getClass().getSimpleName() + " " + t.getMessage(); }
    }
    static FakeHttp app() {
        FakeHttp s = new FakeHttp();
        s.on("GET", "/books", req -> new FakeHttp.Resp(200,
            new LinkedHashMap<>(Map.of("Content-Type", "application/json")),
            Map.of("total", 2, "data", Map.of("items", List.of(
                Map.of("title", "Effective Java", "tags", List.of("java")),
                Map.of("title", "Design Data Intensive", "tags", List.of("db", "kafka")))))));
        s.on("POST", "/books", req -> new FakeHttp.Resp(201,
            new LinkedHashMap<>(Map.of("Location", "/books/99")),
            Map.of("id", 99, "echo", String.valueOf(req.body), "token", String.valueOf(req.header("X-Token")))));
        s.on("DELETE", "/books/99", req -> new FakeHttp.Resp(204, new LinkedHashMap<>(), ""));
        return s;
    }
    static FakeHttp.Resp look(Map<String, String> store, String id) {
        if (!store.containsKey(id)) return new FakeHttp.Resp(404, new LinkedHashMap<>(), Map.of("error", "not found"));
        return new FakeHttp.Resp(200, new LinkedHashMap<>(), Map.of("id", id, "text", store.get(id)));
    }
    static FakeHttp notesApi() {
        AtomicLong seq = new AtomicLong(100);
        Map<String, String> store = new LinkedHashMap<>();
        FakeHttp s = new FakeHttp();
        s.on("POST", "/notes", req -> {
            String id = String.valueOf(seq.incrementAndGet());
            store.put(id, req.body);
            s.on("GET", "/notes/" + id, r -> look(store, r.path.substring(7)));
            s.on("DELETE", "/notes/" + id, r -> {
                store.remove(r.path.substring(7));
                return new FakeHttp.Resp(204, new LinkedHashMap<>(), "");
            });
            return new FakeHttp.Resp(201, new LinkedHashMap<>(), Map.of("id", id));
        });
        return s;
    }
    public static void main(String[] args) {
        check("statusCode khớp thì không ném loạn", () -> failMessage(() ->
            Rest.given(app()).when().get("/books").statusCode(200)).isEmpty());
        check("statusCode lech nem AssertionError dung message", () -> failMessage(() ->
            Rest.given(app()).when().get("/books").statusCode(201)).equals("statusCode: expected 201 but was 200"));
        check("extract lấy được giá trị lồng trong cây", () ->
            Rest.given(app()).when().get("/books").extract("data.items[1].title").equals("Design Data Intensive"));
        check("nhieu matcher noi chuoi deu pass", () -> failMessage(() -> Rest.given(app()).when().get("/books")
            .statusCode(200)
            .header("Content-Type", M.containsString("json"))
            .body("total", M.equalTo(2))
            .body("data.items", M.hasSize(2))
            .body("data.items[1].tags", M.hasSize(2))
            .body("data.items[0].title", M.notNullValue())).isEmpty());
        check("index vuot mang tra null va that bai co message", () -> failMessage(() -> Rest.given(app())
            .when().get("/books").body("data.items[5].title", M.notNullValue()))
            .equals("data.items[5].title: expected notNullValue but was null"));
        check("key không tồn tại và không phải map đều ra null", () -> {
            Object a = Rest.given(app()).when().get("/books").extract("data.missing.x");
            Object b = Rest.given(app()).when().get("/books").extract("total.length[0]");
            Object c = Rest.given(app()).when().get("/books").extract("[0].id");
            return a == null && b == null && c == null;
        });
        check("matcher that bai ghi duong dan vao message", () -> failMessage(() -> Rest.given(app())
            .when().get("/books").body("data.title", M.equalTo("x"))).startsWith("data.title: expected equalTo x but was null"));
        check("header va body cua request di toi handler", () -> {
            Then t = Rest.given(app()).header("X-Token", "abc").body("{ \\"title\\": \\"Effective Java\\" }")
                .when().post("/books").statusCode(201);
            return "abc".equals(t.extract("token"))
                && failMessage(() -> t.body("echo", M.containsString("Effective"))).isEmpty()
                && failMessage(() -> t.header("Location", M.equalTo("/books/99"))).isEmpty();
        });
        check("header không có trong response thất bại với label header", () -> failMessage(() -> Rest.given(app())
            .when().get("/books").header("X-Missing", M.notNullValue()))
            .equals("header X-Missing: expected notNullValue but was null"));
        check("khong co route 404, sai phuong thuc 405", () ->
            failMessage(() -> Rest.given(app()).when().get("/nothing").statusCode(404)).isEmpty()
                && failMessage(() -> Rest.given(app()).when().delete("/books").statusCode(405)).isEmpty());
        check("chain tao note roi doc xoa va doc lai 404", () -> {
            FakeHttp srv = notesApi();
            Object id = Rest.given(srv).body("hi").when().post("/notes").statusCode(201).extract("id");
            String path = "/notes/" + id;
            if (!"101".equals(String.valueOf(id))) return false;
            if (!failMessage(() -> Rest.given(srv).when().get(path).statusCode(200).body("text", M.equalTo("hi"))).isEmpty()) return false;
            Rest.given(srv).when().delete(path).statusCode(204);
            return failMessage(() -> Rest.given(srv).when().get(path).statusCode(404)).isEmpty();
        });
        check("response goc van truy cap duoc sau chain", () ->
            Rest.given(app()).when().get("/books").statusCode(200).response().status == 200);
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
      reference: `interface Matcher {
    boolean test(Object actual);

    String describe();
}

final class FakeHttp {
    interface Handler {
        Resp handle(Req req);
    }

    static final class Req {
        final String method, path, body;
        final Map<String, String> headers;

        Req(String method, String path, Map<String, String> headers, String body) {
            this.method = method;
            this.path = path;
            this.headers = headers;
            this.body = body;
        }

        String header(String name) {
            return headers.get(name);
        }
    }

    static final class Resp {
        final int status;
        final Map<String, String> headers;
        final Object body;

        Resp(int status, Map<String, String> headers, Object body) {
            this.status = status;
            this.headers = headers;
            this.body = body;
        }

        String header(String name) {
            return headers.get(name);
        }
    }

    private final Map<String, Handler> routes = new LinkedHashMap<>();

    FakeHttp on(String method, String path, Handler handler) {
        routes.put(method + " " + path, handler);
        return this;
    }

    Resp handle(String method, String path, Map<String, String> headers, String body) {
        Handler hit = routes.get(method + " " + path);
        if (hit != null) return hit.handle(new Req(method, path, new LinkedHashMap<>(headers), body));
        for (String key : routes.keySet()) {
            if (key.endsWith(" " + path)) return new Resp(405, new LinkedHashMap<>(), "method not allowed: " + path);
        }
        return new Resp(404, new LinkedHashMap<>(), "no route: " + method + " " + path);
    }
}

final class M {
    static Matcher equalTo(Object expected) {
        return of("equalTo " + expected, actual -> Objects.equals(actual, expected));
    }

    static Matcher notNullValue() {
        return of("notNullValue", actual -> actual != null);
    }

    static Matcher containsString(String needle) {
        return of("containsString " + needle, actual -> actual instanceof String && ((String) actual).contains(needle));
    }

    static Matcher hasSize(int expected) {
        return of("hasSize " + expected, actual -> size(actual) == expected);
    }

    private static int size(Object o) {
        if (o instanceof Collection) return ((Collection<?>) o).size();
        if (o instanceof Map) return ((Map<?, ?>) o).size();
        return -1;
    }

    private static Matcher of(String desc, Predicate<Object> p) {
        return new Matcher() {
            public boolean test(Object actual) { return p.test(actual); }

            public String describe() { return desc; }
        };
    }
}

final class Json {
    static Object eval(Object root, String path) {
        Object cur = root;
        int i = 0;
        while (i < path.length() && cur != null) {
            char ch = path.charAt(i);
            if (ch == '.') { i++; continue; }
            if (ch == '[') {
                int close = path.indexOf(']', i);
                if (close < 0) throw new IllegalArgumentException("JsonPath hong (thieu ngoac dong): " + path);
                int index;
                try { index = Integer.parseInt(path.substring(i + 1, close).trim()); }
                catch (NumberFormatException e) { cur = null; i = close + 1; continue; }
                if (!(cur instanceof List) || index < 0 || index >= ((List<?>) cur).size()) cur = null;
                else cur = ((List<?>) cur).get(index);
                i = close + 1;
                continue;
            }
            int next = i;
            while (next < path.length() && path.charAt(next) != '.' && path.charAt(next) != '[') next++;
            String key = path.substring(i, next);
            cur = (cur instanceof Map) ? ((Map<?, ?>) cur).get(key) : null;
            i = next;
        }
        return cur;
    }
}

final class Rest {
    static Given given(FakeHttp server) {
        return new Given(server);
    }
}

final class Given {
    private final FakeHttp server;
    private final Map<String, String> headers = new LinkedHashMap<>();
    private String body = "";

    Given(FakeHttp server) {
        this.server = server;
    }

    Given header(String name, String value) {
        headers.put(name, value);
        return this;
    }

    Given body(String rawJson) {
        this.body = rawJson;
        return this;
    }

    When when() {
        return new When(server, new LinkedHashMap<>(headers), body);
    }
}

final class When {
    private final FakeHttp server;
    private final Map<String, String> headers;
    private final String body;

    When(FakeHttp server, Map<String, String> headers, String body) {
        this.server = server;
        this.headers = headers;
        this.body = body;
    }

    Then get(String path) { return call("GET", path); }

    Then post(String path) { return call("POST", path); }

    Then put(String path) { return call("PUT", path); }

    Then delete(String path) { return call("DELETE", path); }

    private Then call(String method, String path) {
        return new Then(server.handle(method, path, headers, body));
    }
}

final class Then {
    private final FakeHttp.Resp resp;

    Then(FakeHttp.Resp resp) {
        this.resp = resp;
    }

    Then statusCode(int expected) {
        if (resp.status != expected) throw new AssertionError("statusCode: expected " + expected + " but was " + resp.status);
        return this;
    }

    Then header(String name, Matcher matcher) {
        return failIfNot("header " + name, resp.header(name), matcher);
    }

    Then body(String path, Matcher matcher) {
        return failIfNot(path, Json.eval(resp.body, path), matcher);
    }

    Object extract(String path) {
        return Json.eval(resp.body, path);
    }

    FakeHttp.Resp response() {
        return resp;
    }

    private Then failIfNot(String label, Object actual, Matcher matcher) {
        if (!matcher.test(actual)) {
            throw new AssertionError(label + ": expected " + matcher.describe() + " but was " + actual);
        }
        return this;
    }
}`,
      hints: [
        'Matcher có hai hàm nên không phải functional interface — không viết được lambda trực tiếp. Cách gọn: một hàm private nhận desc và một {{Predicate}} rồi trả về anonymous class {{Matcher}} bọc lại;{{equalTo}}/{{notNullValue}} chỉ còn là một dòng gọi hàm đó.',
        'Json.eval: duyệt path bằng {{charAt}}/{{indexOf}}, đừng {{split}} bằng regex (sẽ mất thông tin về ngoặc vuông). Với mỗi token, đọc tên key tới ký tự {{.}} hoặc {{[}} kế tiếp, rồi xử lý liên tiếp các {{[i]}}.',
        'Quy tắc null của JsonPath rất quan trọng: luôn trả {{null}} chứ không ném exception khi key không có hoặc index vượt mảng — đó chính là hành vi khiến test API dễ "xanh giả" như phần body đã trình bày.',
        'Then.statusCode so sánh {{resp.status}}; các assert khác dùng chung một hàm private nhận label, actual, matcher để message luôn cùng mẫu {{label: expected M but was A}} — mẫu message là thứ người đọc CI phải nhận ra trong 2 giây.',
      ],
      explain: `Ba quyết định thiết kế của bài này chính là ba quyết định của framework API test thật:

1. **{{given}} gom request, {{when}} chia ranh giới gửi/nhận, {{then}} chỉ chứa assert.** Nhờ trả về {{this}} ở mỗi hàm assert, chuỗi đọc được như một câu và **fail sớm**: {{AssertionError}} đầu tiên dừng ca kiểm thử, nên báo cáo nêu đúng assert đầu tiên sai — đây là khác biệt lớn so với soft assertion (bài 008).
2. **JsonPath trả null thay vì ném.** Test của bạn sẽ pass oan nếu chỉ kiểm {{statusCode}}, vì vậy luôn kèm matcher {{notNullValue()}} hoặc schema. Đây là bug thật, xảy ra khi backend rename field.
3. **{{extract()}} tách dữ liệu khỏi phán xử.** Chain request chỉ an toàn khi id đến từ response trước đó; nếu hard-code {{/notes/101}} thì sang môi trường khác là suite chết ngay ca đầu tiên.

{{FakeHttp}} cũng mô phỏng hai case mà API test phải phân biệt được: **404** (không route) và **405** (có đường dẫn nhưng sai phương thức). Một suite chỉ assert {{isSuccess}} sẽ gộp hai lỗi hoàn toàn khác nhau thành một màu đỏ giống hệt nhau.`,
    },
  ],
  check: [
    {
      q: 'Vì sao suite API thường đông hơn suite UI trong automation chuẩn?',
      options: [
        'Vì API không cần viết assert',
        'Vì API test nhanh hơn 20–100 lần, không vỡ khi đổi giao diện và bắt trực tiếp lỗi nghiệp vụ',
        'Vì UI test không chạy được trong CI',
        'Vì API luôn ổn định, không bao giờ đổi',
      ],
      answer: 1,
      explain: 'Đi thẳng HTTP nên không tốn thời gian render và không phụ thuộc CSS/DOM; phần lớn lỗi logic-phân quyền-tính tiền nằm ở tầng này. UI chỉ giữ các luồng mà lỗi chỉ hiện khi có trình duyệt.',
    },
    {
      q: 'Dev đổi tên field title thành name. Test chỉ có given().when().get("/books").then().statusCode(200) và body("title", equalTo("x")) — chuyện gì xảy ra?',
      options: [
        'Ca kiểm thử fail vì JsonPath không tìm thấy field',
        'Ca kiểm thử vẫn pass vì field trả về null',
        'Ca kiểm thử fail đúng nhưng chỉ khi có schema validation; với equalTo thì nó fail vì null khác "x"',
        'REST Assured ném exception khi compile',
      ],
      answer: 2,
      explain: 'JsonPath thiếu field trả null, và equalTo("x") so với null thì fail — nên ca này còn cứu được. Nguy hiểm là các ca chỉ assert statusCode hoặc chỉ assert notNullValue trên field khác: chúng xanh dù hợp đồng đã gãy. Schema validation bắt lỗi đổi tên ở cấp hình dạng.',
    },
    {
      q: 'Trong Playwright for Java, cách nào để test UI không phải login bằng giao diện mỗi ca?',
      options: [
        'Gọi Thread.sleep(5000) sau khi login để session kịp lưu',
        'Login một lần (API hoặc UI) ở @BeforeAll, lưu storageState ra file, mở BrowserContext với setStorageStatePath cho mọi test',
        'Dùng cùng một BrowserContext cho tất cả test để giữ cookie',
        'Bỏ qua login vì staging không cần',
      ],
      answer: 1,
      explain: 'storageState Snapshot cookie + localStorage, nạp lại trong vài mili-giây và vẫn cho mỗi test một context cô lập. Dùng chung một context làm dữ liệu/browser dẫm nhau khi chạy song song.',
    },
    {
      q: 'Luồng POST tạo đơn rồi DELETE chính đơn đó nên lấy id bằng cách nào?',
      options: [
        'Hard-code id = 4217 vì staging luôn giống production',
        'extract().path("id") từ response của POST rồi dùng cho DELETE',
        'Đọc id từ log của service',
        'Cho mỗi test dùng một executor',
      ],
      answer: 1,
      explain: 'Dữ liệu đi tiếp phải đến từ response trước (extract) — đó là cách duy nhất chạy được trên mọi môi trường và mọi thứ tự chạy. id trong log thì không có hợp đồng, executor không liên quan.',
    },
  ],
  related: ['autotest-008', 'autotest-009'],
  tags: ['REST Assured', 'API test', 'JsonPath', 'schema validation', 'Playwright', 'APIRequestOptions', 'test data', 'WireMock'],
},
{
  id: 'lesson-autotest-007',
  track: 'autotest',
  order: 7,
  title: 'BDD với Cucumber-JVM: Gherkin, step definition, hook — và khi nào BDD là gánh nặng',
  level: 'mid',
  minutes: 35,
  goals: [
    'Viết một Feature đúng chất hành vi: Background, Scenario, Scenario Outline + Examples, DataTable',
    'Nối một dòng Gherkin với step definition Java bằng Cucumber Expression và hiểu cách nó được chuyển thành regex',
    'Giải thích undefined step và ambiguous step xảy ra thế nào và Cucumber xử lý ra sao',
    'Nêu được 3 dấu hiệu BDD đang thành gánh nặng bảo trì và cách khắc phục',
  ],
  body: `### BDD là cách làm việc, Gherkin là giấy ghi lại
**BDD (Behavior-Driven Development)** là cách làm việc: trước khi code, **BA/PO + dev + QA** ngồi cùng nhau viết **ví dụ cụ thể** về hành vi mong muốn ("khách có voucher hết hạn thì không áp dụng được"). Lợi ích không nằm ở chữ Meaning: nó nằm ở chỗ ba người phải **chốt cùng một hiểu biết** trước khi code, nên câu hỏi mơ hồ lộ ra ở phút thứ 10 thay vì ở phút thứ 1000.

**Gherkin** là ngôn ngữ cấu trúc để ghi các ví dụ đó: {{Feature}} → {{Scenario}} → {{Given/When/Then}} (tiền điều kiện → hành động → kết quả). Nó **không phải code**, không có vòng lặp, không có if — cố tình đơn giản để người không biết kỹ thuật đọc được. Cucumber-JVM là công cụ biến file Gherkin thành test chạy được, bằng cách **nối mỗi dòng với một hàm Java**.

~~~text
Feature: Voucher at check-out
  Background:
    Given the shop has product "Ao" priced 200000 VND

  Scenario: Voucher hết hạn không áp dụng được
    Given the customer has a voucher "XMAS24" expired on 2024-01-01
    When the customer applies voucher "XMAS24" at check-out
    Then the order total is 200000 VND
    And the message is "Voucher da het han"

  Scenario Outline: Thue theo nhom hang hoa
    When the customer checks out <qty> x <sku>
    Then the tax is <tax> VND

    Examples:
      | qty | sku       | tax  |
      | 1   | "AO-SM"   | 1000 |
      | 2   | "SACH-JV" | 0    |
~~~

Bốn thứ đáng để học thuộc, vì phỏng vấn hay hỏi:
- **Background**: phần setup chung chạy trước **mỗi** scenario — dùng cho tiền điều kiện thật sự chung (đăng nhập, dữ liệu nền), đừng nhét hành động đang được test.
- **Scenario Outline + Examples**: một scenario chạy trên nhiều bộ dữ liệu — chính là {{@ParameterizedTest}} nhưng viết bằng Gherkin, PO đọc được.
- **DataTable** (bảng {{|...|}}): đưa dữ liệu có cấu trúc vào step; Cucumber chuyển thành {{List}}/{{Map}} hoặc POJO qua {{asList(Voucher.class)}}/{{asMaps}}.
- **DocString** (ba nháy kép): khối văn bản dài (JSON payload, log) gắn cho một step.

### Cucumber chạy thế nào
~~~text
cart.feature  ->  Cucumber parser (duyet Feature/Scenario/Step)
                     |
                     +--> tim step definition khop (regex sinh tu Cucumber Expression)
                     |
                     +--> chay hook @Before -> cac step -> hook @After
                     |
                     +--> bao cao: status tung step (passed/failed/skipped/undefined)
~~~

Runner hiện đại dùng **JUnit Platform Suite** (Cucumber 7):

~~~java
import org.junit.platform.suite.api.IncludeEngines;
import org.junit.platform.suite.api.SelectClasspathResource;
import org.junit.platform.suite.api.ConfigurationParameter;
import org.junit.platform.suite.api.Suite;

@Suite
@IncludeEngines("cucumber")
@SelectClasspathResource("features")
@ConfigurationParameter(key = "cucumber.glue", value = "com.shop.steps")   // noi step definitions
@ConfigurationParameter(key = "cucumber.filter.tags", value = "smoke")     // chi chay tag smoke
public class RunCucumberTest { }
~~~

(Các bản cũ dùng {{@RunWith(Cucumber.class)}} + {{@CucumberOptions(features=..., glue=...)}} — nhiều repo VN vẫn đang kiểu đó, đọc được cả hai là điểm cộng.)

### Step definition: Cucumber Expression và regex
~~~java
import io.cucumber.java.en.Given;
import io.cucumber.java.en.When;
import io.cucumber.java.en.Then;
import static org.junit.jupiter.api.Assertions.assertEquals;

public class VoucherSteps {
    private final CheckOut checkOut = new CheckOut();          // state CUA MỘT scenario

    @Given("the customer has a voucher {string} expired on {word}")
    public void voucher(String code, String expiry) {
        checkOut.addVoucher(code, expiry);
    }

    @When("the customer applies voucher {string} at check-out")
    public void apply(String code) {
        checkOut.apply(code);
    }

    @Then("the order total is {int} VND")
    public void totalIs(int amount) {
        assertEquals(amount, checkOut.total());                 // assert o buoc THEN, khong o step khac
    }
}
~~~

**Cucumber Expression** là lớp dễ đọc đè lên regex. Bảng chuyển đổi:

| Placeholder | Nhận | Kiểu tham số Java |
|---|---|---|
| {int} | số nguyên, có thể âm | int / Integer |
| {float} | số thập phân, có dấu chấm | double / BigDecimal |
| {string} | chuỗi bọc trong nháy kép (nháy đơn cũng được) | String, **đã bỏ nháy** |
| {word} | một từ không khoảng trắng | String |
| placeholder rỗng (cặp ngoặc nhọn không tên) | bất kỳ phần nào (anonymous) | String |
| hậu tố (s) | văn bản tùy chọn — "apple(s)" khớp cả "apple" lẫn "apples" | không tạo tham số |
| lựa chọn yes / no | nhiều cách viết thay thế, phân cách bằng gạch đứng trong pattern thật | String nếu cần bắt giá trị |

Cơ chế bên trong: Cucumber dựng **regex** từ expression ({int} → nhóm bắt số, {string} → nhóm bắt trong cặp nháy), khớp **toàn bộ** dòng step, rồi gọi hàm theo thứ tự nhóm bắt được. Vì vậy:
- **Undefined step**: không pattern nào khớp dòng Gherkin. Cucumber in ra **snippet Java mẫu** đúng tham số để bạn copy — đây là cách người ta viết step mới: chạy trước, lấy snippet, điền code.
- **Ambiguous step**: hai step definition cùng khớp một dòng. Cucumber **không tự chọn**, nó fail và liệt kê cả hai — và khi đó thường một trong hai pattern quá rộng ({int} hoặc placeholder rỗng đứng ở đầu).

### Hook, tag và state giữa các step
~~~java
import io.cucumber.java.Before;
import io.cucumber.java.After;
import io.cucumber.java.Scenario;

public class BrowserHooks {
    private Playwright pw;                             // Cucumber tao lai instance hook cho tung scenario
    private BrowserContext context;                    // step class khac lay page qua World

    @Before("@ui")                        // chi chay cho scenario co tag @ui
    public void open() {
        pw = Playwright.create();
        context = pw.chromium().launch().newContext();
        World.set(context.newPage());
    }

    @After("@ui")
    public void shot(Scenario scenario) {
        Page page = World.page();
        if (scenario.isFailed()) {
            scenario.attach(page.screenshot(), "image/png", "screenshot");   // gan vao bao cao
        }
        context.close();
        pw.close();                            // bat buoc: khong de tien trinh browser song toi luc tat JVM
    }
}
~~~
State của một scenario sống trong **instance của class step được Cucumber tạo lại cho mỗi scenario** (mặc định) — nên field {{checkOut}} ở trên là an toàn; chỉ nguy hiểm khi bạn cố ý dùng {{static}} hoặc SharedDataContext. Đây là điểm Cucumber làm đúng mà nhiều suite tự viết hay sai: **scenario cô lập, không dạy nhau**.

### Khi nào BDD có giá trị, khi nào thành gánh nặng
| BDD đáng dùng | BDD thành gánh nặng |
|---|---|
| Rule nghiệp vụ phức tạp, thay đổi theo quyết định của PO (phí, thuế, voucher, hoàn hàng) | Luồng thuần kỹ thuật không có người nghiệp vụ nào đọc (retry, pagination, health check) |
| Bộ quy tắc cần bằng chứng cho audit / hợp đồng với khách | Step viết theo **màn hình** ("click button Submit") thay vì theo hành vi |
| BA/PO thật sự tham gia viết và review feature | Feature do **một mình QA** dịch lại từ script Selenium có sẵn |
| Scenario 5–15 bước, đọc ra quyết định | Scenario 60 bước dùng làm setup cho scenario khác |

Ba anti-pattern giết chết BDD (đều bị hỏi trong phỏng vấn):
1. **Gherkin chỉ là lớp vỏ**: mỗi step chỉ bọc một {{page.click()}}. Khi UI đổi, sửa 3 nơi; PO không đọc ra ý nghiệp vụ. Khắc phục: step mức quyết định, page object bên dưới.
2. **Gherkin của Anh-và-Anh**: {{Given the user clicks the button and then navigates to the page}} — đặc tả lại từng thao tác. Khắc phục: {{When the customer applies voucher "X"}} (một ý định, nhiều hành động bên trong).
3. **Feature làm tài liệu chết**: scenario chỉ còn giá trị khi nó **chạy**; nếu đội không sửa step khi nghiệp vụ đổi, BDD mất hoàn toàn ý nghĩa và còn đắt hơn test thường (thêm một tầng trừu tượng để bảo trì).

### Lỗi hay gặp
- Step định nghĩa ở package không nằm trong {{cucumber.glue}} → undefined step dù code trông hoàn toàn đúng.
- Placeholder quá rộng (dòng Then chỉ kết thúc bằng cặp ngoặc nhọn rỗng) khớp gần như mọi thứ → che mất ambiguous và làm báo cáo khó đọc.
- Dùng {{Then}} cho bước chuẩn bị: về mặt từ ngữ, {{Then}} là **phán xử**; nếu bước sau phụ thuộc kết quả bước trước thì đó là {{Given}} hoặc {{And}}.
- Assert trong {{Given}}/{{When}}: báo cáo fail không nói được "kết quả sai" mà nói "tiền điều kiện sai", rất khó lần.
- Quên rằng Gherkin **không có điều kiện/vòng lặp**: muốn nhiều dữ liệu → Scenario Outline; muốn logic → đưa xuống step definition.

### Liên hệ phỏng vấn
Câu thường gặp: "BDD là gì, team bạn áp dụng ra sao", "Cucumber hoạt động thế nào", "Undefined step là gì", "Khi nào bạn **không** dùng BDD". Công thức trả lời ghi điểm: (1) nói BDD trước hết là **hội thoại ba bên**, Gherkin chỉ là sản phẩm ghi lại; (2) nói cơ chế: parser → khớp expression/regex → hook → báo cáo, kèm một chi tiết thật ("tôi đặt step ở package com.shop.steps và tag @smoke để CI chạy nhanh"); (3) nói giới hạn: chỉ BDD hóa phần **quyết định nghiệp vụ**, phần kỹ thuật để JUnit/REST Assured. Câu "BDD có làm chậm team không" — trả lời thật: có, nếu biến mọi test thành Gherkin; không, nếu chỉ dùng cho rule mà PO cần đọc.

> Senior tip: quy tắc bỏ túi để feature không thành nợ kỹ thuật — **một scenario chỉ nói về một quyết định**, không quá 12 bước, và mọi dòng {{Then}} phải trả lời được câu "PO có đồng ý đây là kết quả sai không?". Nếu không ai trong phòng đọc hiểu một dòng Gherkin, hãy xoá dòng đó: BDD tồn tại để giao tiếp, không phải để trông có vẻ chuyên nghiệp.`,
  exercises: [
    {
      title: 'Tự viết StepRegistry: chuyển Cucumber Expression thành regex và khớp dòng Gherkin',
      prompt: `Cucumber thật chỉ làm ba việc: dựng **regex** từ step definition, **khớp toàn bộ** dòng Gherkin, rồi **gọi hàm** với tham số đã đổi kiểu. Bạn sẽ viết {{Steps}} làm đúng ba việc đó.

Đã có sẵn, **không sửa**: {{StepBody}} (hàm xử lý step), {{StepMatch}} (kết quả khớp), {{UndefinedStepException}}, {{AmbiguousStepException}}.

Quy tắc expression — chỉ hai placeholder:
- {int}: khớp một số nguyên, cho phép dấu âm; truyền vào hàm với kiểu {{Integer}}.
- {string}: khớp một chuỗi **bọc trong nháy kép**; truyền vào là phần bên trong, đã bỏ nháy.
- Phần văn bản thường phải khớp **nguyên văn** (ký tự đặc biệt của regex phải được escape — dùng {{Pattern.quote}} cho gọn), khoảng trắng giữ nguyên một-một.
- Pattern khớp **toàn bộ** dòng sau khi cắt từ khóa Gherkin ở đầu ({{Given}}, {{When}}, {{Then}}, {{And}}, {{But}}, dấu {{*}}), chỉ cắt một từ khóa; dòng không có từ khóa vẫn phải khớp.

API của {{Steps}}:
- {{Steps add(String pattern, StepBody body)}} — đăng ký một step, **trả về chính nó** để xâu chuỗi.
- {{int size()}} — số step đã đăng ký.
- {{StepMatch match(String line)}} — ba trường hợp:
  - không pattern nào khớp: status {{undefined}}, args rỗng, candidates rỗng;
  - nhiều hơn một pattern khớp: status {{ambiguous}}, args rỗng, candidates là danh sách pattern khớp **theo thứ tự đăng ký**;
  - đúng một pattern khớp: status {{defined}}, args là các tham số đã đổi kiểu theo thứ tự xuất hiện trong pattern, candidates rỗng.
- {{String run(String line)}} — defined: gọi body của step khớp và trả kết quả của nó. undefined: ném {{UndefinedStepException}} với message chứa dòng đã cắt từ khóa. ambiguous: ném {{AmbiguousStepException}} (message do lớp đó tự dựng, bạn chỉ cần truyền đúng {{candidates}}).

Ví dụ: pattern "I have {int} apples" và dòng "Then I have 3 apples" → status defined, args là danh sách chứa số 3 (kiểu Integer), {{run}} trả đúng chuỗi mà body trả về.

Chỉ dùng JDK. Không đọc file, không mạng, không random, không thời gian thực.`,
      starter: `interface StepBody {
    String call(List<Object> args);
}

class UndefinedStepException extends RuntimeException {
    UndefinedStepException(String message) {
        super(message);
    }
}

class AmbiguousStepException extends RuntimeException {
    private final List<String> candidates;

    AmbiguousStepException(String step, List<String> candidates) {
        super("Ambiguous step: " + step + " khop voi " + candidates.size() + " dinh nghia");
        this.candidates = candidates;
    }

    List<String> candidates() {
        return candidates;
    }
}

final class StepMatch {
    private final String status;
    private final List<Object> args;
    private final List<String> candidates;

    StepMatch(String status, List<Object> args, List<String> candidates) {
        this.status = status;
        this.args = args;
        this.candidates = candidates;
    }

    String status() { return status; }

    List<Object> args() { return args; }

    List<String> candidates() { return candidates; }
}

final class Steps {
    private final List<String> patterns = new ArrayList<>();
    private final List<java.util.regex.Pattern> regexes = new ArrayList<>();
    private final List<StepBody> bodies = new ArrayList<>();

    Steps add(String pattern, StepBody body) {
        throw new UnsupportedOperationException("TODO");
    }

    int size() {
        throw new UnsupportedOperationException("TODO");
    }

    StepMatch match(String line) {
        throw new UnsupportedOperationException("TODO");
    }

    String run(String line) {
        throw new UnsupportedOperationException("TODO");
    }
}`,
      tests: `public class Main {
    static final char Q = '"';
    static int passed = 0, total = 0;
    interface Body { boolean get() throws Exception; }
    static void check(String name, Body b) {
        total++;
        boolean ok; String detail = "";
        try { ok = b.get(); }
        catch (Throwable t) { ok = false; detail = "ngoai loi " + t.getClass().getSimpleName() + " " + t.getMessage(); }
        if (ok) { passed++; System.out.println("PASS " + name); }
        else System.out.println("FAIL " + name + ": " + detail);
    }
    interface Act { void run() throws Exception; }
    static String msg(Act a) {
        try { a.run(); return ""; }
        catch (Throwable t) { return t.getClass().getSimpleName() + ": " + t.getMessage(); }
    }
    static final StepBody REC = args -> "call" + args;
    static Steps cart() {
        return new Steps().add("I have {int} apples", REC);
    }
    static Steps login() {
        return new Steps().add("user {string} logs in", REC);
    }
    static Steps maths() {
        return new Steps().add("{int} plus {int} equals {int}", REC);
    }
    static Steps ambiguous() {
        return new Steps().add("take {int} coins", REC).add("take -{int} coins", REC);
    }
    public static void main(String[] args) {
        check("add tra ve chinh no va size dem so step", () -> {
            Steps s = new Steps();
            return s.add("a", REC) == s && s.add("b", REC).size() == 2;
        });
        check("defined co status va args doi kieu Integer", () -> {
            StepMatch m = cart().match("Then I have 3 apples");
            return "defined".equals(m.status()) && m.args().equals(List.of(3)) && m.candidates().isEmpty();
        });
        check("int âm được khớp và đổi được kiểu", () -> cart().match("I have -2 apples").args().equals(List.of(-2)));
        check("string boc nhay kep bi lo nhay khi truyen", () ->
            login().match("Given user " + Q + "bean" + Q + " logs in").args().equals(List.of("bean")));
        check("string rong cho ra chuoi rong", () ->
            login().match("When user " + Q + Q + " logs in").args().equals(List.of("")));
        check("tu khoa Gherkin khong anh huong ket qua khop", () ->
            "defined".equals(cart().match("When I have 3 apples").status())
                && "defined".equals(cart().match("And I have 3 apples").status())
                && "defined".equals(cart().match("* I have 3 apples").status())
                && "defined".equals(cart().match("I have 3 apples").status()));
        check("ba placeholder theo dung thu tu xuat hien", () ->
            maths().match("Then 2 plus 3 equals 5").args().equals(List.of(2, 3, 5)));
        check("pattern khong placeholder cho args rong", () -> {
            Steps s = new Steps().add("the cart is empty", a -> "empty:" + a.size());
            return s.match("Given the cart is empty").args().isEmpty() && "empty:0".equals(s.run("Given the cart is empty"));
        });
        check("ký tự đặc biệt của regex được khớp nguyên văn", () -> {
            Steps s = new Steps().add("cost is 3.5 USD", REC);
            return "defined".equals(s.match("Then cost is 3.5 USD").status())
                && "undefined".equals(s.match("Then cost is 3x5 USD").status());
        });
        check("khớp toàn bộ dòng không phải chuỗi con", () -> "undefined".equals(cart().match("I have 3 apples today").status()));
        check("undefined thi match bao undefined con run nem UndefinedStepException", () -> {
            String e = msg(() -> cart().run("Then I fly away"));
            return "undefined".equals(cart().match("Then I fly away").status())
                && e.startsWith("UndefinedStepException:") && e.contains("I fly away");
        });
        check("trung pattern cho ra ambiguous voi hai candidates", () -> {
            Steps s = new Steps().add("I have {int} apples", REC).add("I have {int} apples", REC);
            StepMatch m = s.match("Given I have 1 apples");
            return "ambiguous".equals(m.status()) && m.candidates().size() == 2 && m.args().isEmpty();
        });
        check("hai pattern de len nhau (dau am) cung la ambiguous", () -> {
            StepMatch m = ambiguous().match("Given take -5 coins");
            return "ambiguous".equals(m.status()) && m.candidates().equals(List.of("take {int} coins", "take -{int} coins"));
        });
        check("run khi ambiguous nem AmbiguousStepException kem candidates", () -> {
            String e = msg(() -> ambiguous().run("take -5 coins"));
            return e.startsWith("AmbiguousStepException:") && e.contains("khop voi 2 dinh nghia");
        });
        check("run trả về kết quả của step body được khớp", () -> cart().run("Then I have 3 apples").equals("call[3]"));
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
      reference: `interface StepBody {
    String call(List<Object> args);
}

class UndefinedStepException extends RuntimeException {
    UndefinedStepException(String message) {
        super(message);
    }
}

class AmbiguousStepException extends RuntimeException {
    private final List<String> candidates;

    AmbiguousStepException(String step, List<String> candidates) {
        super("Ambiguous step: " + step + " khop voi " + candidates.size() + " dinh nghia");
        this.candidates = candidates;
    }

    List<String> candidates() {
        return candidates;
    }
}

final class StepMatch {
    private final String status;
    private final List<Object> args;
    private final List<String> candidates;

    StepMatch(String status, List<Object> args, List<String> candidates) {
        this.status = status;
        this.args = args;
        this.candidates = candidates;
    }

    String status() { return status; }

    List<Object> args() { return args; }

    List<String> candidates() { return candidates; }
}

final class Steps {
    private static final char Q = '"';
    private static final List<String> KEYWORDS = List.of("Given", "When", "Then", "And", "But", "*");
    private final List<String> patterns = new ArrayList<>();
    private final List<java.util.regex.Pattern> regexes = new ArrayList<>();
    private final List<StepBody> bodies = new ArrayList<>();

    Steps add(String pattern, StepBody body) {
        patterns.add(pattern);
        regexes.add(java.util.regex.Pattern.compile("^" + toRegex(pattern) + "$"));
        bodies.add(body);
        return this;
    }

    int size() {
        return patterns.size();
    }

    StepMatch match(String line) {
        String step = strip(line);
        List<String> hits = new ArrayList<>();
        int chosen = -1;
        for (int i = 0; i < regexes.size(); i++) {
            if (regexes.get(i).matcher(step).matches()) {
                hits.add(patterns.get(i));
                chosen = i;
            }
        }
        if (hits.isEmpty()) return new StepMatch("undefined", List.of(), List.of());
        if (hits.size() > 1) return new StepMatch("ambiguous", List.of(), hits);
        java.util.regex.Matcher m = regexes.get(chosen).matcher(step);
        m.matches();
        return new StepMatch("defined", argsOf(patterns.get(chosen), m), List.of());
    }

    String run(String line) {
        String step = strip(line);
        StepMatch match = match(line);
        if (!"defined".equals(match.status())) {
            if ("ambiguous".equals(match.status())) throw new AmbiguousStepException(step, match.candidates());
            throw new UndefinedStepException("Undefined step: " + step);
        }
        for (int i = 0; i < regexes.size(); i++) {
            if (regexes.get(i).matcher(step).matches()) return bodies.get(i).call(match.args());
        }
        throw new UndefinedStepException("Undefined step: " + step);
    }

    private static List<Object> argsOf(String pattern, java.util.regex.Matcher m) {
        List<Object> out = new ArrayList<>();
        int group = 1;
        int i = 0;
        while (i < pattern.length()) {
            if (pattern.startsWith("{int}", i)) {
                out.add(Integer.parseInt(m.group(group++)));
                i += 5;
            } else if (pattern.startsWith("{string}", i)) {
                out.add(m.group(group++));
                i += 8;
            } else i++;
        }
        return out;
    }

    private static String toRegex(String pattern) {
        StringBuilder sb = new StringBuilder();
        int i = 0;
        while (i < pattern.length()) {
            if (pattern.startsWith("{int}", i)) {
                sb.append("(-?[0-9]+)");
                i += 5;
            } else if (pattern.startsWith("{string}", i)) {
                sb.append(Q).append("([^").append(Q).append("]*)").append(Q);
                i += 8;
            } else {
                int next = i;
                while (next < pattern.length() && !pattern.startsWith("{int}", next) && !pattern.startsWith("{string}", next)) next++;
                sb.append(java.util.regex.Pattern.quote(pattern.substring(i, next)));
                i = next;
            }
        }
        return sb.toString();
    }

    private static String strip(String line) {
        String s = line == null ? "" : line.trim();
        for (String k : KEYWORDS) {
            if (s.startsWith(k + " ")) return s.substring(k.length() + 1).trim();
        }
        return s;
    }
}`,
      hints: [
        'Đừng tự escape tay từng ký tự: gom văn bản thường giữa hai placeholder rồi bọc bằng {{Pattern.quote(chunk)}} — nó sinh ra phần regex khớp nguyên văn, kể cả dấu chấm hay ngoặc.',
        'Với regex đã compiled, dùng {{matcher(step).matches()}} (khớp CẢ dòng) chứ không phải {{find()}} (khớp một đoạn). Đây là lý do "I have 3 apples today" phải ra undefined.',
        'Đổi kiểu tham số: duyệt lại pattern song song với nhóm bắt được — gặp {int} thì {{Integer.parseInt(m.group(g))}}, gặp {string} thì lấy {{m.group(g)}} trần, mỗi lần dùng tăng g. Thứ tự nhóm bắt đúng bằng thứ tự placeholder.',
        'match() nên là hàm thuần trả StepMatch; run() chỉ decision theo status rồi mới gọi body. Tách vậy giúp báo cáo in được danh sách undefined step mà không cần chạy gì.',
      ],
      explain: `Mọi thứ Cucumber-JVM làm với một dòng Gherkin nằm gọn trong bài này:

1. **Step definition chỉ là regex đội một lớp vỏ dễ đọc.** Người ta nghĩ Gherkin "thông minh hơn code", nhưng engine chỉ làm đúng ba bước: expression → regex → {{matches()}} trên cả dòng. Hiểu vậy thì bạn đọc được ngay vì sao một {{Then}} kết thúc bằng placeholder rỗng khớp gần như tất cả và vì sao nó nguy hiểm: nó **nuốt** cả những dòng lẽ ra phải undefined.
2. **undefined và ambiguous là hai lỗi khác nhau.** Undefined = thiếu step definition (CI báo, Cucumber in snippet mẫu). Ambiguous = thừa một pattern chồng lên nhau; engine **không tự chọn** cái nào, vì tự chọn nghĩa là âm thầm chạy sai ý người viết feature. Bài này bắt bạn giữ đúng hành vi đó.
3. **State của scenario nằm trong step class, không nằm trong file feature.** Dòng {{REC = args -> "call" + args}} trong harness chính là một step body thuần; khi test UI thì nó là {{page.click()}} và dữ liệu đi qua field của class step — Cucumber tạo lại instance cho mỗi scenario nên không rò rỉ giữa hai scenario.

Hai chỗ mà bộ tự viết rất hay sai, và cũng là hai lỗi kinh điển của step runner thật: không cắt từ khóa Gherkin trước khi khớp (nên "{{Given}} I have 3 apples" không khớp với pattern viết thiếu {{Given}}), và dùng {{find()}} thay vì {{matches()}} (nên mọi dòng dài hơn đều "khop" nhầm).`,
    },
  ],
  check: [
    {
      q: 'Cucumber Expression {string} nhận gì và truyền vào step definition kiểu gì?',
      options: [
        'Mọi chuỗi có dấu cách, truyền nguyên văn cả dấu nháy',
        'Chuỗi bọc trong nháy kép hoặc nháy đơn, truyền phần bên trong đã bỏ nháy',
        'Chỉ một từ không khoảng trắng',
        'Một biểu thức Java, truyền dạng Object',
      ],
      answer: 1,
      explain: '{string} đòi dấu bao (kinh nghiệm: quên nháy trong feature là thành undefined step). Phần tử nhận được là String đã bỏ dấu bao, nên step definition không phải xử lý nháy.',
    },
    {
      q: 'Undefined step xảy ra khi nào và Cucumber làm gì?',
      options: [
        'Dòng Gherkin không có step definition nào khớp; Cucumber fail ca đó và in snippet Java mẫu để bạn cài',
        'Step definition ném exception; Cucumber chạy lại một lần',
        'Hai step cùng khớp một dòng; Cucumber chọn step đầu tiên',
        'Feature file không đọc được; Cucumber bỏ qua scenario',
      ],
      answer: 0,
      explain: 'Đây là cách người ta viết step mới: chạy feature trước, lấy snippet Cucumber sinh ra (đúng thứ tự tham số) rồi điền code. Trường hợp hai step cùng khớp là ambiguous, và Cucumber không tự chọn.',
    },
    {
      q: 'Vì sao assert nên đặt ở bước Then thay vì Given/When?',
      options: [
        'Vì Gherkin cấm hàm ở bước khác',
        'Vì khi fail, báo cáo phải nói "kết quả không đúng như PO mong đợi"; assert ở bước setup chỉ cho thấy tiền điều kiện sai',
        'Vì Then chạy nhanh hơn',
        'Vì hook @After chỉ đọc được Then',
      ],
      answer: 1,
      explain: 'Given/When mô tả thế giới và hành động; Then là phán xử. Đặt sai chỗ thì người đọc CI không phân biệt được ứng dụng lỗi hay dữ liệu test lỗi — cực tốn thời gian ở suite lớn.',
    },
    {
      q: 'Dấu hiệu nào cho thấy BDD đang là gánh nặng chứ không phải tài sản?',
      options: [
        'Feature được BA/PO review và cập nhật khi nghiệp vụ đổi',
        'Mỗi step chỉ bọc đúng một thao tác giao diện như click Submit, và PO không đọc được scenario',
        'Scenario Outline thay cho nhiều scenario trùng lặp',
        'Step dùng page object bên trong, scenario giữ mức hành vi',
      ],
      answer: 1,
      explain: 'Khi Gherkin chỉ là lớp vỏ của script UI, bạn trả thêm một tầng trừu tượng để bảo trì mà mất đi giá trị giao tiếp — thứ duy nhất BDD bán. Step phải mô tả ý định nghiệp vụ, thao tác nằm ở tầng dưới.',
    },
  ],
  related: ['autotest-012'],
  tags: ['BDD', 'Cucumber', 'Gherkin', 'step definition', 'Cucumber Expression', 'regex', 'hook', 'DataTable'],
},
{
  id: 'lesson-autotest-008',
  track: 'autotest',
  order: 8,
  title: 'Assertion, soft assertion và báo cáo lỗi (screenshot, trace, Allure, JUnit XML)',
  level: 'senior',
  minutes: 40,
  goals: [
    'Phân biệt hard assert và soft assert, chọn đúng loại theo tính phụ thuộc giữa các bước kiểm tra',
    'Viết được SoftAssert tự chế: gom lỗi, dựng message tổng kết, xoá trạng thái sau khi báo cáo',
    'Giải thích cách lấy bằng chứng khi fail trên Playwright for Java: screenshot, video, trace, attachment',
    'Đọc hiểu file JUnit XML mà CI dùng để quyết định xanh/đỏ, và tự viết được bộ đếm tests/failures/errors/skipped',
    'Thiết kế báo cáo Allure đủ để người khác sửa bug mà không phải hỏi lại bạn',
  ],
  body: `**Tóm tắt:** Assertion là một lời khẳng định có thể đúng hoặc sai — "mã HTTP phải là 200", "bảng phải còn 10 dòng". Không có assertion thì automation chỉ là script bấm nút: chạy hết, in "done", và xanh dù ứng dụng sai. Loại **cứng (hard assert)** dừng ngay ở lỗi đầu tiên; loại **mềm (soft assert)** ghi hết lỗi vào danh sách rồi mới fail một lần cuối, nên một lần chạy liệt kê được 12 trường sai thay vì 1. Nhưng lỗi chỉ có giá trị khi báo cáo nói được **ở đâu, vì sao, bằng chứng gì**: screenshot/trace đính kèm, các bước (step) rõ ràng, và bộ đếm tests/failures/errors/skipped trong file JUnit XML — thứ mà CI đọc để quyết định merge hay không.

### Assertion thật ra là gì?
Hãy hình dung biên bản giao hàng. Người giao mở thùng, **đối chiếu** từng món với phiếu (đủ 3 cái, không vỡ), rồi **ký xác nhận**. Assertion chính là thao tác "đối chiếu" đó trong code; còn "ký xác nhận" là việc test được báo PASS hay FAIL.

Có hai thứ dễ lẫn:
- **Log** chỉ ghi lại để người đọc tự phán đoán. Log không làm test fail.
- **Assertion** so sánh và tự động phán: sai là ném {{AssertionError}} (lỗi "kỳ vọng không đạt" mà các test framework bắt lấy để in ra báo cáo).

Trong JUnit 5, assertion kiểu cứng phổ biến nhất:

~~~java
// Hard assert: dòng đầu tiên sai là phương thức dừng ngay, các dòng sau KHÔNG chạy
assertEquals(200, resp.getStatusCode());          // so giá trị
assertNotNull(resp.getHeader("location"));         // bắt buộc phải có mặt
assertTrue(items.size() >= 5, "can it nhat 5 phan tu trong danh sach");  // message là thứ cứu bạn trong CI
~~~

Message ở tham số cuối nghe rất nhỏ nhưng quyết định bạn mất 5 phút hay 2 tiếng: dòng "expected 200 but was 500" tự nó kể câu chuyện, còn "test failed" thì không.

### Vì sao hard assert làm mất thông tin
Test UI mở form đăng ký, điền sai cả 12 trường (họ trống, email sai, số điện thoại thiếu, tích sai điều khoản…). Với hard assert:

~~~text
Lần chạy 1: FAIL "ho va ten: duong dan khong hien loi"      <- chỉ biết trường 1
Sửa helper hiển thị lỗi -> chạy lại (25 phút)
Lần chạy 2: FAIL "email: duong dan khong hien loi"          <- đến trường 2
... 12 vòng như vậy = nửa ngày, và bạn vẫn chưa biết còn lỗi nào khác
~~~

Đây là lý do soft assert tồn tại: **một lần chạy, biết hết**. Nhưng soft assert không phải phiên bản tốt hơn mặc định — nó phá mất tính fail-fast, mà fail-fast có giá trị khi các bước sau phụ thuộc kết quả bước trước (lấy id từ response để gọi tiếp; id null thì mọi assert phía sau đều vô nghĩa).

| Tình huống | Nên dùng | Vì sao |
|---|---|---|
| Kiểm tra nhiều field độc lập của cùng một response/form | soft | gom đủ lỗi trong 1 lần chạy |
| Bước sau cần dữ liệu của bước trước (id, token) | hard | sai trước thì chạy tiếp chỉ sinh lỗi giả |
| Test smoke vài phút, môi trường hay đổi | hard | cần biết điểm gãy đầu tiên thật nhanh |
| Verify giao diện sau khi scroll, chờ AJAX | Playwright web-first | tự chờ, khỏi sleep |

### Soft assert viết thế nào (AssertJ, TestNG, JUnit 5)
AssertJ có {{SoftAssertions}} — "soft" ở đây nghĩa là **không ném ngay**, mà ghi vào bộ nhớ rồi {{assertAll()}} tổng kết một phát:

~~~java
import org.assertj.core.api.SoftAssertions;

SoftAssertions softly = new SoftAssertions();
softly.assertThat(page.locator("#name").textContent()).isEqualTo("Nguyen Van A");
softly.assertThat(page.locator("#phone").textContent()).isEqualTo("0900123456");
softly.assertThat(page.locator("#addr").isVisible()).isTrue();
softly.assertAll();   // QUEN DONG NAY = test xanh gia, 3 loi bi nuot silently
~~~

Còn đây là kiểu "mềm một phát" của JUnit 5, không cần đối tượng giữ trạng thái — mỗi lambda là một kiểm tra, lỗi được gom và báo cùng lúc:

~~~java
import static org.junit.jupiter.api.Assertions.assertAll;
import static org.junit.jupiter.api.Assertions.assertEquals;

assertAll(
    () -> assertEquals("Nguyen Van A", page.locator("#name").textContent()),
    () -> assertEquals("0900123456", page.locator("#phone").textContent()),
    () -> assertEquals(true, page.locator("#addr").isVisible())
);
~~~

TestNG có {{SoftAssert}} với cùng ý tưởng nhưng **bắt buộc** gọi {{assertAll()}} ở cuối; quên là mất lỗi. Mẹo an toàn: gọi {{assertAll()}} trong {{@AfterMethod}}, không phụ thuộc việc người viết test có nhớ hay không.

Playwright for Java có riêng một loại assertion **web-first** (assert theo cách của trình duyệt). Điểm khác biệt: nó tự động chờ cho tới khi điều kiện đúng hoặc hết timeout mặc định 5 giây, nên bạn không cần {{Thread.sleep}}:

~~~java
import static com.microsoft.playwright.assertions.PlaywrightAssertions.assertThat;

assertThat(page.locator("#cart-count")).hasText("3");   // poll đến khi text là "3", quá 5s thì TimeoutError
assertThat(page.locator("#submit")).isEnabled();
assertThat(page).hasTitle("Don hang thanh cong");
~~~

{{sleep(2000)}} rồi hard assert là nguồn lỗi flaky số 1: máy CI chậm hơn máy bạn, 2 giây không đủ; tăng lên 10 giây thì suite 500 test thêm gần một tiếng. Web-first assertion vừa nhanh (đúng là nó lấy kết quả ngay khi điều kiện thoả) vừa bền.

### Bằng chứng khi fail: screenshot, video, trace, attachment
**Screenshot** là ảnh chụp màn hình tại thời điểm fail. Trong Playwright, đừng chụp trong từng test — hãy chụp tự động bằng hook, vì người viết test sẽ quên:

~~~java
// Tu bat ghi video va HAR (nhat ky network) khi tao context
BrowserContext context = browser.newContext(new Browser.NewContextOptions()
        .setRecordVideoDir(java.nio.file.Paths.get("artifacts/video")));
Page page = context.newPage();
page.goto("https://shop.test/checkout");

// Trong @AfterEach: chỉ khi fail mới lấy bằng chứng (báo cáo ngắn hơn và dễ đọc hơn)
if (testFailed) {
    page.screenshot(new Page.ScreenshotOptions()
            .setPath(java.nio.file.Paths.get("artifacts/fail-" + testName + ".png"))
            .setFullPage(true));                      // full-page: cuộn hết chiều cao, không chỉ màn hình trong
    page.locator("#cart").screenshot();               // hoac chi chup vung nghi van
}
~~~

**Trace** của Playwright (bật qua {{browserContext.tracing()}} với tùy chọn screenshots + snapshots — tên lớp options xem Javadoc của BrowserContext.tracing) là gói .zip chứa **chuỗi thời gian** của test: từng thao tác, DOM của trang ở từng bước, network, console log. Mở bằng {{npx playwright show-trace}}. Screenshot chỉ cho biết "màn hình trông sai"; trace cho biết "nó thành sai sau cú click nào, và request nào trả về dữ liệu rỗng" — khác nhau rất nhiều khi debug.

**Allure** ({{io.qameta.allure}}) là công cụ dựng báo cáo HTML từ kết quả test: gắn nhãn các bước nghiệp vụ, phân loại lỗi, hiển thị attachment.

~~~java
import io.qameta.allure.Allure;
import io.qameta.allure.Attachment;
import io.qameta.allure.Step;

@Step("Dang nhap bang tai khoan {0}")            // {0} = tham số thứ nhất, hiện trên báo cáo
void login(String user) {
    page.fill("#user", user);
    page.fill("#pass", "pwd");
    Allure.addAttachment("Request body", "{\\"user\\": \\"" + user + "\\"}");   // dữ liệu debug, phải mask secret
}

@Attachment(value = "Man hinh khi fail", type = "image/png")
byte[] attachFailure() {
    return page.screenshot(new Page.ScreenshotOptions().setFullPage(true));
}
~~~

Allure đọc kết quả từ thư mục {{target/allure-results}} (mỗi bước/test một file JSON), rồi {{allure generate}} dựng HTML. Hai file cấu hình đáng biết: **environment.properties** (môi trường, version, branch — hiện ở đầu report để biết test chạy trên bản nào) và **categories.json** (gom lỗi theo loại: "Product defect", "Test defect", "Invalid result"), ví dụ:

~~~json
[
  { "name": "Test defect - du lieu sai", "matchedStatuses": ["failed"], "messageRegex": ".*expected.*but was.*" },
  { "name": "Moi truong - timeout", "matchedStatuses": ["broken"], "messageRegex": ".*TimeoutError.*" }
]
~~~

### Con số mà CI đọc: file JUnit XML
JUnit XML là định dạng văn bản XML mà Surefire/Failsafe (Maven), Gradle test task và các runner JUnit/TestNG xuất ra, thường ở {{target/surefire-reports/TEST-*.xml}}. Jenkins dùng bước {{junit}}, GitHub Actions dùng action đọc report — chúng chỉ cần mấy con số này để in "42 tests, 2 failed, 1 skipped" và quyết định pipeline đỏ hay xanh:

~~~text
<testsuites name="smoke">
  <testsuite name="LoginTest" tests="4" failures="1" errors="1" skipped="1" time="6.2">
    <testcase classname="LoginTest" name="dang nhap dung"/>
    <testcase classname="LoginTest" name="sai mat khau" time="1.1">
      <failure message="status: expected 200 but was 401">at LoginTest.java:34</failure>
    </testcase>
    <testcase classname="LoginTest" name="bi khoa" time="5.0">
      <error message="TimeoutError: waiting for locator">#checkout</error>
    </testcase>
    <testcase classname="LoginTest" name="todo" time="0"><skipped message=" chua xong"/></testcase>
  </testsuite>
</testsuites>
~~~

Ba trạng thái phải phân biệt được khi trả lời phỏng vấn:
- **failure**: assertion sai — ứng dụng behaving khác mong đợi (hoặc test kỳ vọng sai). Đây là bug thật hoặc test sai.
- **error** (trong XML) / **broken** (trong Allure): exception không chủ đích — {{NullPointerException}}, {{TimeoutError}}, hết hạn chờ, driver chết, môi trường thiếu service.
- **skipped**: không chạy — {{@Disabled}}, điều kiện tiền đề không đạt, tag bị lọc.

Sự khác biệt này thay đổi hành động của cả team: 5 error thường nghĩa là hạ tầng/môi trường vỡ chứ không phải 5 bug; 1 failure thì phải mở ticket. Vì thế pipeline tốt gate theo từng loại, ví dụ "fail nếu failures > 0", còn errors chỉ cảnh báo cho tới khi bạn xử lý xong flaky.

~~~seq
title: Tu test fail den ticket bug
actors: Test | XML | CI | Allure
Test -> XML: ghi testcase + failure
Test -> Allure: ghi JSON moi buoc, attachment
CI -> XML: doc so failures/errors/skipped
CI --> CI: cong boom, gan label bug hay flaky
Allure --> CI: html report + artifact
note Test..Allure: fail phải kể được lỗi đầu, không chỉ "3 failed"
~~~

### Bốn lỗi hay gặp trên production
- **Quên {{assertAll()}}** (TestNG SoftAssert, AssertJ SoftAssertions): test xanh, lỗi bị nuốt. Nguy hiểm hơn cả test fail, vì nó đánh cắp niềm tin của team vào toàn bộ suite.
- **Test không có assertion nào**: "chạy xong không nổ lỗi" được đếm là pass. Kiểm bằng cách cố tình làm ứng dụng sai rồi chạy lại — nếu vẫn xanh thì test đó vô dụng.
- **Báo cáo chỉ có stack trace**: không screenshot/trace, không request-response, không dữ liệu đầu vào. QA khác (hoặc chính bạn sau 2 tuần) không tài nào tái hiện.
- **Log cả token và mật khẩu vào attachment**: report Allure thường công khai trong nội bộ, thành rò rỉ credential. Mask trước khi attach, chỉ giữ đủ để debug (4 ký tự cuối, id đơn hàng).
- **Tự parse JUnit XML bằng regex đơn giản rồi cộng cả attribute của thẻ bao {{testsuites}}**: ra số trùng gấp đôi, CI báo sai mà không ai hiểu vì sao. Muốn parse thì dùng thư viện, hoặc đọc attribute của đúng từng thẻ suite con.

### Liên hệ phỏng vấn
- "Hard và soft assert khác nhau thế nào, khi nào chọn cái nào?" → trả lời theo trục **phụ thuộc dữ liệu**: field độc lập thì gom lỗi, bước sau cần output bước trước thì fail sớm; kèm ví dụ form 12 trường.
- "Test của bạn flaky, framework có tự retry không?" → retry che giấu flaky, chỉ dùng ở tầng runner (IRetryAnalyzer) với số lần nhỏ, và phải có danh sách test được retry để còn sửa gốc.
- "CI lấy số liệu test ở đâu?" → JUnit XML (tests/failures/errors/skipped), artefact upload với điều kiện always(), Allure report dựng từ allure-results.
- "Bao nhiêu thời gian để bug report của bạn được sửa?" → nói về thiết kế bằng chứng: screenshot đúng thời điểm + trace + request/response được mask thường tiết kiệm cả buổi chẩn đoán.

> Senior tip: Đừng tin suite xanh. Mỗi quý, tự kiểm bằng cách **gài một lỗi sai** vào một assert (đổi expected thành giá trị khác) rồi chạy: nếu test vẫn xanh, assert đó không chạy — thường vì soft assert thiếu assertAll, hoặc vì dòng assert bị đặt sau một exception bị nuốt trong {{try/catch}}. Với report: một dòng message tốt có dạng "label + expected + actual", đủ để người khác tái hiện mà không cần hỏi bạn.`,
  exercises: [
    {
      title: 'Viết SoftAssert và bộ đếm JUnit XML',
      prompt: `Hai bài nhỏ mô phỏng đúng thứ QA viết mỗi ngày: gom lỗi rồi báo cáo một lần, và đọc con số từ file JUnit XML để CI quyết định. Viết bằng Java thuần, chỉ dùng JDK, hai lớp gói (không có class public nào ngoài Main).

**1) Lớp {{SoftAssert}}** — bản tối giản của AssertJ {{SoftAssertions}} / TestNG {{SoftAssert}}:
- {{check(ok, message)}}: nếu {{ok}} là false thì ghi {{message}} vào danh sách lỗi, giữ đúng thứ tự ghi.
- {{equal(actual, expected, label)}}: nếu hai giá trị không bằng nhau (so như {{Objects.equals}} — cùng null coi như bằng), thêm lỗi có dạng chính xác: {{label + ": expected " + expected + " but was " + actual}}.
- {{notNull(actual, label)}}: nếu {{actual}} null thì thêm lỗi {{label + ": khong duoc null"}}.
- {{pending()}}: số lỗi đang chờ.
- {{errors()}}: **bản copy** của danh sách lỗi; thêm/xoá trên list trả về không được ảnh hưởng đối tượng.
- {{assertAll()}}: không có lỗi thì im lặng; có lỗi thì ném {{AssertionError}} với message gồm dòng đầu "n fail:" rồi mỗi lỗi một dòng bắt đầu bằng hai dấu cách và "- ". **Sau đó danh sách lỗi phải rỗng**, kể cả khi vừa ném lỗi (để test kế tiếp dùng lại cùng đối tượng và để gọi nhiều lần không báo trùng).

~~~text
3 fail:
  - status: expected 200 but was 500
  - token: không được null
  - role: expected admin but was guest
~~~

**2) Lớp {{JUnitXml}}** đọc chuỗi XML theo kiểu Surefire (parse tay bằng {{indexOf}}, không dùng thư viện XML):
- {{summary(xml)}} trả {{Map}} các khoá {{tests}}, {{failures}}, {{errors}}, {{skipped}}, {{passed}}, {{suites}} (giá trị là {{Integer}}), **cộng dồn trên mọi thẻ mở testsuite con**, và **bỏ qua thẻ bao** {{testsuites}} bọc ngoài (nhớ rằng tên thẻ bao cũng bắt đầu bằng đúng chuỗi mở đầu của thẻ suite con, nên phải xét thêm ký tự ngay sau đó).
- Mỗi con số đọc từ **attribute** của thẻ mở suite; attribute nào thiếu thì tính là 0. Riêng {{tests}} mà thiếu thì lấy **số thẻ mở testcase** trong phạm vi suite đó. Khi tìm attribute, phải chắc đó là tên attribute thật (ký tự ngay trước là khoảng trắng), chứ không được ăn nhầm một chuỗi trùng đuôi nằm trong tên attribute khác — ví dụ {{name}} lọt thỏm bên trong {{classname}}.
- {{passed}} = tests - failures - errors - skipped, không bao giờ nhỏ hơn 0.
- {{failedCases(xml)}} trả danh sách chuỗi dạng {{classname#name}} theo thứ tự xuất hiện trong tài liệu, cho mỗi testcase có phần thân chứa thẻ failure hoặc thẻ error (thẻ skipped **không** tính; testcase tự đóng bằng {{/>}} có phần thân rỗng nên không bao giờ là lỗi).
- Chuỗi rỗng, chuỗi không có suite, hoặc thiếu attribute: trả số 0 / danh sách rỗng, **không được ném exception**.

~~~text
<testsuites><testsuite name="a" tests="3" failures="1"/></testsuites>
~~~

Chuỗi trên phải cho tests=3, failures=1, errors=0, skipped=0, passed=2, suites=1 (thẻ bao không được tính vào đâu cả).

Yêu cầu khi làm: đừng ném lỗi ở {{check}} — toàn bộ giá trị của soft assert là không dừng; và đừng dùng {{replaceAll}} để đếm thẻ, vì thẻ bao sẽ bị tính hai lần.`,
      starter: `final class SoftAssert {
    public void check(boolean ok, String message) {
        throw new UnsupportedOperationException("TODO");
    }

    public void equal(Object actual, Object expected, String label) {
        throw new UnsupportedOperationException("TODO");
    }

    public void notNull(Object actual, String label) {
        throw new UnsupportedOperationException("TODO");
    }

    public int pending() {
        throw new UnsupportedOperationException("TODO");
    }

    public List<String> errors() {
        throw new UnsupportedOperationException("TODO");
    }

    public void assertAll() {
        throw new UnsupportedOperationException("TODO");
    }
}

final class JUnitXml {
    static Map<String, Integer> summary(String xml) {
        throw new UnsupportedOperationException("TODO");
    }

    static List<String> failedCases(String xml) {
        throw new UnsupportedOperationException("TODO");
    }
}`,
      tests: `public class Main {
    interface Body { boolean get() throws Exception; }

    static int pass = 0, total = 0;

    static void t(String name, Body b) {
        total++;
        try {
            if (b.get()) { pass++; System.out.println("PASS " + name); }
            else System.out.println("FAIL " + name + ": tra ve false");
        } catch (Throwable e) {
            System.out.println("FAIL " + name + ": " + e);
        }
    }

    static void eq(Object actual, Object expected) {
        if (!Objects.equals(actual, expected)) throw new AssertionError("expected " + expected + " but was " + actual);
    }

    static int count(String hay, String needle) {
        int c = 0, i = 0;
        while ((i = hay.indexOf(needle, i)) >= 0) { c++; i += needle.length(); }
        return c;
    }

    static final String ONE = """
            <testsuites name="smoke">
              <testsuite name="login" tests="4" failures="1" errors="1" skipped="1">
                <testcase classname="LoginTest" name="ok"/>
                <testcase classname="LoginTest" name="sai mk"><failure message="status mismatch">stack</failure></testcase>
                <testcase classname="LoginTest" name="tre"><error message="timeout">stack</error></testcase>
                <testcase classname="LoginTest" name="todo"><skipped message="pending"/></testcase>
              </testsuite>
            </testsuites>
            """;

    static final String NESTED = """
            <testsuites name="all" tests="99" failures="99" errors="99" skipped="99">
              <testsuite name="x" tests="2" failures="1" errors="0" skipped="0">
                <testcase classname="X" name="a"><failure message="m">x</failure></testcase>
                <testcase classname="X" name="b"/>
              </testsuite>
            </testsuites>
            """;

    static final String TWO = """
            <testsuite name="a" tests="3" failures="2" errors="0" skipped="0">
              <testcase classname="A" name="p"><failure message="1">x</failure></testcase>
              <testcase classname="A" name="q"><failure message="2">x</failure></testcase>
            </testsuite>
            <testsuite name="b" failures="1">
              <testcase classname="B" name="r"><error message="boom">x</error></testcase>
              <testcase classname="B" name="s"/>
            </testsuite>
            """;

    static final String NOATTR = """
            <testsuite name="n">
              <testcase classname="N" name="one"/>
              <testcase classname="N" name="two"><failure message="f">x</failure></testcase>
              <testcase classname="N" name="three"><skipped message="s"/></testcase>
            </testsuite>
            """;

    static final String CLEAN = """
            <testsuite name="c" tests="2" failures="0" errors="0" skipped="0">
              <testcase classname="C" name="one"/>
              <testcase classname="C" name="two"/>
            </testsuite>
            """;

    public static void main(String[] args) {
        t("check đúng không gom lỗi", () -> {
            SoftAssert s = new SoftAssert();
            s.check(true, "khong co gi sai");
            eq(s.pending(), 0);
            return s.errors().isEmpty();
        });

        t("check sai ghi dung message", () -> {
            SoftAssert s = new SoftAssert();
            s.check(false, "thieu nut submit");
            s.check(true, "co bang gia");
            eq(s.pending(), 1);
            return s.errors().equals(Arrays.asList("thieu nut submit"));
        });

        t("equal khac gia tri tao message chuan", () -> {
            SoftAssert s = new SoftAssert();
            s.equal(500, 200, "status");
            return s.errors().equals(Arrays.asList("status: expected 200 but was 500"));
        });

        t("equal bằng nhau không gom lỗi", () -> {
            SoftAssert s = new SoftAssert();
            s.equal("OK", "OK", "state");
            s.equal(10, 10, "tong");
            return s.pending() == 0;
        });

        t("equal voi null in ra chuoi null", () -> {
            SoftAssert s = new SoftAssert();
            s.equal(null, "abc", "body");
            s.equal("abc", null, "khach");
            return s.errors().equals(Arrays.asList("body: expected abc but was null", "khach: expected null but was abc"));
        });

        t("notNull với giá trị null báo đúng cú pháp", () -> {
            SoftAssert s = new SoftAssert();
            s.notNull(null, "token");
            return s.errors().equals(Arrays.asList("token: khong duoc null"));
        });

        t("notNull có giá trị không gom lỗi", () -> {
            SoftAssert s = new SoftAssert();
            s.notNull("", "token");
            s.notNull(0, "dem");
            return s.pending() == 0;
        });

        t("giu thu tu ghi loi", () -> {
            SoftAssert s = new SoftAssert();
            s.check(false, "a");
            s.notNull(null, "b");
            s.equal(1, 2, "c");
            return s.errors().equals(Arrays.asList("a", "b: khong duoc null", "c: expected 2 but was 1"));
        });

        t("errors tra ve ban copy", () -> {
            SoftAssert s = new SoftAssert();
            s.check(false, "a");
            List<String> snap = s.errors();
            snap.add("them tay");
            eq(s.pending(), 1);
            return snap.size() == 2;
        });

        t("assertAll nem va liet ke du loi", () -> {
            SoftAssert s = new SoftAssert();
            s.check(false, "thieu truong email");
            s.equal(1, 2, "tong");
            try {
                s.assertAll();
                return false;
            } catch (AssertionError e) {
                String m = e.getMessage();
                return m.startsWith("2 fail:")
                        && m.contains("thieu truong email")
                        && m.contains("tong: expected 2 but was 1")
                        && count(m, "\\n  - ") == 2;
            }
        });

        t("assertAll xoa danh sach sau khi nem", () -> {
            SoftAssert s = new SoftAssert();
            s.check(false, "a");
            try {
                s.assertAll();
            } catch (AssertionError ignored) {
                // báo cáo đã đi, trạng thái phải được dọn để test sau dùng lại
            }
            eq(s.pending(), 0);
            return s.errors().isEmpty();
        });

        t("assertAll im lặng khi không có lỗi", () -> {
            SoftAssert s = new SoftAssert();
            s.check(true, "a");
            s.assertAll();
            s.assertAll();
            return s.pending() == 0;
        });

        t("dùng lại được sau khi đã báo cáo", () -> {
            SoftAssert s = new SoftAssert();
            s.check(false, "a");
            try {
                s.assertAll();
            } catch (AssertionError ignored) {
                //
            }
            s.check(false, "b");
            try {
                s.assertAll();
                return false;
            } catch (AssertionError e) {
                return e.getMessage().equals("1 fail:\\n  - b");
            }
        });

        t("năm lỗi thì message có năm dòng", () -> {
            SoftAssert s = new SoftAssert();
            for (int i = 1; i <= 5; i++) s.check(false, "loi " + i);
            try {
                s.assertAll();
                return false;
            } catch (AssertionError e) {
                String m = e.getMessage();
                return m.startsWith("5 fail:") && count(m, "\\n  - ") == 5 && m.contains("loi 5");
            }
        });

        t("summary doc attribute cua suite", () -> {
            Map<String, Integer> m = JUnitXml.summary(ONE);
            eq(m.get("tests"), 4);
            eq(m.get("failures"), 1);
            eq(m.get("errors"), 1);
            eq(m.get("skipped"), 1);
            return m.get("suites") == 1;
        });

        t("summary tinh passed", () -> {
            Map<String, Integer> m = JUnitXml.summary(ONE);
            eq(m.get("passed"), 1);
            m = JUnitXml.summary(CLEAN);
            eq(m.get("passed"), 2);
            return JUnitXml.summary(TWO).get("passed") == 2;
        });

        t("bo qua attribute cua the bao testsuites", () -> {
            Map<String, Integer> m = JUnitXml.summary(NESTED);
            eq(m.get("tests"), 2);
            eq(m.get("failures"), 1);
            eq(m.get("suites"), 1);
            return m.get("passed") == 1;
        });

        t("cong don hai suite lien tiep", () -> {
            Map<String, Integer> m = JUnitXml.summary(TWO);
            eq(m.get("tests"), 5);
            eq(m.get("failures"), 3);
            eq(m.get("errors"), 0);
            eq(m.get("skipped"), 0);
            return m.get("suites") == 2;
        });

        t("thiếu tests thì đếm số testcase trong suite", () -> {
            Map<String, Integer> m = JUnitXml.summary(NOATTR);
            eq(m.get("tests"), 3);
            eq(m.get("failures"), 0);
            eq(m.get("errors"), 0);
            eq(m.get("skipped"), 0);
            return m.get("passed") == 3;
        });

        t("xml rong khong nem exception", () -> {
            Map<String, Integer> m = JUnitXml.summary("");
            eq(m.get("tests"), 0);
            eq(m.get("suites"), 0);
            eq(m.get("passed"), 0);
            return JUnitXml.failedCases("").isEmpty();
        });

        t("failedCases tra classname va name theo thu tu", () -> {
            return JUnitXml.failedCases(ONE).equals(Arrays.asList("LoginTest#sai mk", "LoginTest#tre"));
        });

        t("failedCases loai skipped va testcase tu dong", () -> {
            return JUnitXml.failedCases(NOATTR).equals(Arrays.asList("N#two"));
        });

        t("failedCases rong khi moi test pass", () -> {
            Map<String, Integer> m = JUnitXml.summary(CLEAN);
            return JUnitXml.failedCases(CLEAN).isEmpty() && m.get("failures") == 0;
        });

        t("failedCases doc duoi hai suite", () -> {
            return JUnitXml.failedCases(TWO).equals(Arrays.asList("A#p", "A#q", "B#r"));
        });

        System.out.println("RESULT " + pass + "/" + total);
    }
}`,
      reference: `final class SoftAssert {
    private final List<String> errs = new ArrayList<>();

    public void check(boolean ok, String message) {
        if (!ok) errs.add(message);
    }

    public void equal(Object actual, Object expected, String label) {
        if (!Objects.equals(actual, expected)) {
            errs.add(label + ": expected " + expected + " but was " + actual);
        }
    }

    public void notNull(Object actual, String label) {
        if (actual == null) errs.add(label + ": khong duoc null");
    }

    public int pending() {
        return errs.size();
    }

    public List<String> errors() {
        return new ArrayList<>(errs);
    }

    public void assertAll() {
        if (errs.isEmpty()) return;
        StringBuilder sb = new StringBuilder();
        sb.append(errs.size()).append(" fail:");
        for (String e : errs) sb.append("\\n  - ").append(e);
        String report = sb.toString();
        errs.clear();
        throw new AssertionError(report);
    }
}

final class JUnitXml {
    private static final char Q = '"';

    static Map<String, Integer> summary(String xml) {
        int tests = 0, failures = 0, errors = 0, skipped = 0, suites = 0;
        int i = 0;
        while (true) {
            int at = xml.indexOf("<testsuite", i);
            if (at < 0) break;
            int gt = xml.indexOf('>', at);
            if (gt < 0) break;
            String open = xml.substring(at, gt + 1);
            if (open.startsWith("<testsuites")) { i = gt + 1; continue; }
            int end = xml.indexOf("</testsuite>", gt + 1);
            if (end < 0) end = xml.length();
            suites++;
            int n = num(open, "tests", -1);
            if (n < 0) n = countTags(xml.substring(gt + 1, end), "<testcase");
            tests += n;
            failures += num(open, "failures", 0);
            errors += num(open, "errors", 0);
            skipped += num(open, "skipped", 0);
            i = end + 12;
        }
        Map<String, Integer> m = new LinkedHashMap<>();
        m.put("tests", tests);
        m.put("failures", failures);
        m.put("errors", errors);
        m.put("skipped", skipped);
        m.put("passed", Math.max(0, tests - failures - errors - skipped));
        m.put("suites", suites);
        return m;
    }

    static List<String> failedCases(String xml) {
        List<String> out = new ArrayList<>();
        int i = 0;
        while (true) {
            int at = xml.indexOf("<testcase", i);
            if (at < 0) break;
            int gt = xml.indexOf('>', at);
            if (gt < 0) break;
            String open = xml.substring(at, gt + 1);
            String body;
            int next;
            if (open.endsWith("/>")) {
                body = "";
                next = gt + 1;
            } else {
                int end = xml.indexOf("</testcase>", gt + 1);
                if (end < 0) end = xml.length();
                body = xml.substring(gt + 1, end);
                next = end + 11;
            }
            i = next;
            if (body.contains("<failure") || body.contains("<error")) {
                out.add(text(valueOf(open, "classname")) + "#" + text(valueOf(open, "name")));
            }
        }
        return out;
    }

    private static String text(String s) {
        return s == null ? "" : s;
    }

    private static int countTags(String region, String tag) {
        int c = 0, at = 0;
        while ((at = region.indexOf(tag, at)) >= 0) { c++; at += tag.length(); }
        return c;
    }

    private static String valueOf(String open, String name) {
        String needle = name + "=" + Q;
        int at = open.indexOf(needle);
        while (at > 0 && !Character.isWhitespace(open.charAt(at - 1))) {
            at = open.indexOf(needle, at + 1);
        }
        if (at < 0) return null;
        int start = at + needle.length();
        int end = open.indexOf(Q, start);
        return end < 0 ? null : open.substring(start, end);
    }

    private static int num(String open, String name, int dflt) {
        String v = valueOf(open, name);
        if (v == null) return dflt;
        try {
            return Integer.parseInt(v.trim());
        } catch (NumberFormatException e) {
            return dflt;
        }
    }
}`,
      hints: [
        'SoftAssert giữ lỗi trong một field List<String>. Điểm cốt lõi là check/không ném gì cả; chỉ assertAll mới ném.',
        'Trong assertAll: dựng message trước, rồi clear danh sách, rồi MỚI throw. Sau khi throw thì code phía dưới không chạy nữa, nên nếu để clear ở sau thì trạng thái không bao giờ được dọn.',
        'Message mỗi lỗi: xuống dòng rồi hai dấu cách rồi dấu gạch nối rồi một space, tức là mở đầu bằng "\\n  - ". Test đếm số lần chuỗi này để chắc bạn không gộp hết lỗi vào một dòng.',
        'JUnitXml không cần thư viện XML: tìm thẻ mở bằng indexOf, cắt tới dấu đóng ngoặc, rồi đọc giá trị nằm giữa hai dấu nháy sau dấu =. Bẫy: chuỗi "name=" nằm bên trong "classname=", nên phải chắc rằng ký tự ngay trước tên attribute là dấu cách — không thì mọi attribute của testcase đều đọc nhầm thành classname.',
        'Với phần thân testcase: thẻ tự đóng (kết thúc bằng />) thì thân rỗng; nếu không thì cắt tới thẻ đóng tương ứng. Cắt sai sẽ gán lỗi của testcase này cho testcase kế tiếp.',
      ],
      explain: `**SoftAssert** chỉ là một List<String> + một lần tổng kết. {{check}} ghi lỗi, {{equal}} và {{notNull}} chuẩn hoá câu chữ thành "label: expected X but was Y" — chính cái format đó giúp người đọc CI biết ngay kỳ vọng gì đã không đạt mà chẳng cần mở code. {{errors()}} trả {{new ArrayList<>(errs)}}: nếu trả thẳng list bên trong, người gọi có thể thêm/xoá làm sai trạng thái test — đây là lỗi "rò rỉ trạng thái nội bộ" gặp rất hay trong page object và test data builder.

{{assertAll}} có ba việc theo đúng thứ tự: (1) dựng message, (2) dọn danh sách, (3) ném. Lí do phải dọn **trước khi** ném: sau khi ném, mọi dòng phía dưới không chạy; mà dọn sau cũng vô nghĩa vì đối tượng thường được tái sử dụng (một trường cho cả class, hoặc một helper dùng chung). Test "dung lai duoc sau khi da bao cao" kiểm đúng điều đó — trong TestNG/AssertJ đây cũng là lý do bạn có thể gọi {{assertAll()}} trong {{@AfterMethod}} mà không sợ báo cáo hai lần.

**JUnitXml.summary** quét văn bản theo vòng: tìm chuỗi mở đầu suite, lấy thẻ mở (cắt tới dấu đóng ngoặc), rồi quyết định. Bẫy lớn nhất là thẻ bao: chuỗi mở đầu của nó **bắt đầu bằng** chuỗi mở đầu của suite con, nên chỉ tìm chuỗi thôi là ăn luôn thẻ bao và cộng trùng số liệu (đó là loại bug "CI báo 84 failed trong khi chỉ có 42"). Vì vậy phải xem thêm ký tự ngay sau, hoặc kiểm tra startsWith với tên thẻ dài hơn rồi bỏ qua. Đọc attribute theo tên, thiếu thì mặc định 0 — riêng {{tests}} thiếu thì mới phải đếm số testcase trong phạm vi suite, vì một số runner cũ không ghi attribute này. {{passed}} suy ra bằng phép trừ và kẹp dưới bằng {{Math.max(0, ...)}}, vì dữ liệu thật có thể lệch (report bị cắt giữa chừng) và CI không nên nhận số âm.

**failedCases** cần cắt đúng phần thân: testcase tự đóng thì thân rỗng nên không thể là lỗi; testcase có thẻ đóng thì lấy đoạn giữa. Trong Surefire, {{<failure}} nghĩa là assertion sai, {{<error}} nghĩa là exception — cả hai đều là "test đỏ", còn {{<skipped}} thì không: phân biệt đúng để pipeline gate "failures > 0" mà không đỏ vì test bị disable.

Lỗi phổ biến khi làm bài: (1) quên {{indexOf(needle, i)}} có tham số vị trí, thành ra lặp vô hạn tại cùng một khớp; (2) quên rằng chuỗi đóng {{</testsuite>}} dài 12 ký tự nên phải nhảy đúng cỡ đó, nếu nhảy theo thẻ mở thì testcase của suite sau bị tính vào suite trước; (3) đọc attribute bằng cách tìm chuỗi {{name=}} rồi cắt theo dấu nháy mà không kiểm tra ký tự ngay trước tên attribute — {{name}} khớp luôn bên trong {{classname}}, nên mọi testcase trả về "LoginTest#LoginTest"; (4) dùng {{split}} theo dấu nháy để đọc attribute — chết ngay khi giá trị chứa dấu cách (như {{name="sai mat khau"}}) hoặc chứa dấu nháy lồng.`,
    },
  ],
  check: [
    {
      q: 'Test mở form đăng ký, cả 12 trường đều hiển thị sai thông báo lỗi. Bạn muốn một lần chạy liệt kê đủ 12 lỗi. Cách nào đúng?',
      options: [
        'Gọi assertEquals cho từng trường, thêm sleep giữa các lần để UI kịp render',
        'Dùng SoftAssertions (hoặc TestNG SoftAssert), rồi gọi assertAll ở cuối test',
        'Bỏ assert, chụp screenshot rồi QA tự xem bằng mắt',
        'Dùng assertThat của Playwright vì nó tự chờ',
      ],
      answer: 1,
      explain: 'Soft assert ghi lỗi vào danh sách thay vì dừng ngay, nên đi hết 12 kiểm tra và báo một lần. Đáp án 4 sai vì assertThat của Playwright vẫn là hard assert cho một điều kiện: điều kiện đầu sai là dừng. Sleep là nguồn flaky. Bỏ assert thì test không còn phán xử gì nữa.',
    },
    {
      q: 'Điều nào ĐÚNG với SoftAssert của TestNG?',
      options: [
        'Nó tự động tổng kết khi test kết thúc, không cần gọi thêm gì',
        'Nếu quên gọi assertAll, test vẫn báo pass dù đã gom lỗi',
        'Nó chỉ ném lỗi khi có từ hai lỗi trở lên',
        'Nó xoá log của các bước chạy trước',
      ],
      answer: 1,
      explain: 'Đây là tai nạn kinh điển: lỗi bị nuốt và suite xanh giả. Vì thế nhiều team đặt assertAll trong @AfterMethod/@AfterEach để không phụ thuộc trí nhớ của người viết test. JUnit 5 né được bẫy này bằng assertAll bọc lambda tại chỗ.',
    },
    {
      q: 'Trong file JUnit XML, khác nhau giữa failure và error là gì?',
      options: [
        'failure là assertion sai; error là exception ngoài ý muốn (TimeoutError, NullPointerException)',
        'failure là test chạy chậm; error là test bị skip',
        'Hai cái giống nhau, chỉ đổi tên theo version của runner',
        'failure do CI sinh ra, error do framework sinh ra',
      ],
      answer: 0,
      explain: 'Phân biệt này đổi luôn hành động của team: 5 error thường nghĩa là môi trường/hạ tầng vỡ (thiếu service, driver chết), còn failure là ứng dụng xử khác kỳ vọng — phải mở ticket. Pipeline tốt gate "failures > 0" và chỉ cảnh báo với errors cho tới khi xử xong flaky.',
    },
    {
      q: 'Khi nào soft assert là quyết định TỒI?',
      options: [
        'Khi kiểm tra nhiều field độc lập trong cùng một response',
        'Khi các bước sau phụ thuộc dữ liệu của bước trước, ví dụ lấy id trong response để gọi tiếp',
        'Khi chạy suite trên CI có song song',
        'Khi test dùng page object',
      ],
      answer: 1,
      explain: 'Nếu id null mà vẫn chạy tiếp, bạn nhận thêm 8 lỗi vô nghĩa che mất 1 lỗi thật, và người đọc không phân biệt được ứng dụng sai hay dữ liệu test sai. Fail sớm ở bước tiền đề là đúng. Các trường hợp còn lại không liên quan đến tính mềm/cứng của assert.',
    },
  ],
  related: ['autotest-011', 'autotest-012'],
  tags: ['assertion', 'soft assert', 'AssertJ', 'TestNG SoftAssert', 'Playwright assertion', 'screenshot', 'trace', 'Allure', 'JUnit XML', 'CI'],
},
{
  id: 'lesson-autotest-009',
  track: 'autotest',
  order: 9,
  title: 'Thiết kế automation framework: chia lớp, config theo môi trường, vòng đời Browser/Context/Page và fixture JUnit 5',
  level: 'senior',
  minutes: 45,
  goals: [
    'Vẽ được 5 lớp của một framework UI/API test và nói cái gì sống ở lớp nào',
    'Giải thích mô hình Playwright → Browser → BrowserContext → Page và chọn đúng phạm vi sống cho từng cái',
    'Vì sao đối tượng Playwright không thread-safe và cách cấp phát driver theo thread bằng ThreadLocal',
    'Viết JUnit 5 Extension cấp Browser/Page cho test và dọn dẹp khi test xong',
    'Tách config theo môi trường mà không nhét secret vào git',
  ],
  body: `**Tóm tắt:** Framework là bộ xương để hàng trăm test chạy lặp lại ở mọi môi trường mà không phải sửa đi sửa lại code: nó tách **những thứ hay đổi** ra **những chỗ khác nhau** — cách lái trình duyệt (driver), cách thao tác từng màn hình (page object), cách gọi API, dữ liệu test, và kịch bản test. Trong Playwright for Java, xương sống là chuỗi đối tượng **Playwright → Browser → BrowserContext → Page** cộng một quy tắc sống còn: **Browser launch một lần cho cả class dùng được, Page thì không chia sẻ giữa các thread**, vì đối tượng Playwright **không thread-safe**. Cách cấp phát sạch nhất là ThreadLocal (mỗi thread một bộ) hoặc JUnit 5 Extension (cấp theo phạm vi vòng đời test).

### Framework là gì, khác gì "một đống script"
**Script** là một file .java bấm theo flow: mở trình duyệt, login, đặt hàng, kiểm tra, đóng trình duyệt. Viết 5 script thì ổn; viết 300 script thì bạn có 300 chỗ hard-code URL đăng nhập, 300 cách chờ khác nhau, và khi đội frontend đổi tên một nút, bạn sửa 120 file.

**Framework** là lớp code **không phải test** mà test gọi vào. Nó trả lời 6 câu hỏi: (1) tài liệu trình duyệt lấy ở đâu, ai mở ai đóng? (2) thao tác màn hình nằm ở đâu? (3) gọi API thế nào, token ở đâu? (4) dữ liệu test sinh ra sao cho hai test không giẫm nhau? (5) cấu hình dev/staging/prod đọc từ đâu? (6) khi fail thì bằng chứng gì, báo cáo đi đâu?

~~~text
src/test/java/com/shop/qa/
  core/        PlaywrightHolder, Config, WaitHelper, ReportHook   <- hạ tầng, ít đổi
  pages/       LoginPage, CartPage, CheckoutPage (Page Object)    <- đổi theo UI
  api/         AuthClient, OrderClient, SqlFixture                <- đổi theo API
  data/        UserBuilder, OrderBuilder, users.csv               <- đổi theo test case
  tests/       LoginTest, CheckoutSmokeTest, OrderFlowTest        <- cái QA viết mỗi ngày
src/test/resources/env/dev.properties, staging.properties
~~~

Nguyên tắc đặt tên và phụ thuộc: **tests phụ thuộc vào pages/api, pages không phụ thuộc tests, core không phụ thuộc gì cả**. Một page object chứa {{assertTrue(...)}} là lỗi thiết kế kinh điển (nói ở bài Page Object): page mô tả *bạn làm được gì*, test mô tả *bạn kỳ vọng gì*.

### Ba tầng đối tượng của Playwright for Java
Playwright (thư viện Java) điều khiển trình duyệt qua một tiến trình driver nội bộ. Bốn khái niệm, so sánh với thứ bạn dùng hằng ngày:

| Đối tượng | Là gì | Ví dụ đời thường | Chi phí tạo |
|---|---|---|---|
| {{Playwright}} | phiên làm việc với driver, giữ tiến trình nền | cắm điện + bật máy tính | ~0.3–1 s |
| {{Browser}} | một trình duyệt đang chạy (chromium/firefox/webkit) | mở trình duyệt | ~0.2–0.8 s |
| {{BrowserContext}} | một "profile" cô lập: cookie, localStorage, cache, permissions | bật chế độ ẩn danh — máy tính khác, tài khoản khác | **~10 ms**, rất rẻ |
| {{Page}} | một tab trong context | mở một tab | ~5 ms |

~~~java
// Lop Playwright dang AutoCloseable: try-with-resources bao dam don tien trinh nen
try (Playwright playwright = Playwright.create()) {
    Browser browser = playwright.chromium()
            .launch(new BrowserType.LaunchOptions().setHeadless(true));

    // Context = profile rieng: cookie/localStorage tach hoan toan voi context khac
    BrowserContext context = browser.newContext(
            new Browser.NewContextOptions().setViewportSize(1280, 720));

    Page page = context.newPage();
    page.navigate("https://shop.test/login");
    page.getByLabel("Email").fill("qa@shop.test");
    page.getByRole(AriaRole.BUTTON, new Page.GetByRoleOptions().setName("Dang nhap")).click();

    context.close();
    browser.close();
}
~~~

Context là phát minh quan trọng nhất để test nhanh: Selenium muốn có "phiên login sạch" thì phải khởi động lại driver (vài giây); Playwright chỉ cần {{browser.newContext()}} (vài mili-giây) và mọi cookie/localStorage đều mới tinh. Suite 500 test mà mỗi test một driver sẽ mất ~10 phút chỉ để mở trình duyệt; mỗi test một context thì mất ~5 giây.

### Ai nên sống bao lâu
- **Playwright + Browser**: phạm vi toàn run (hoặc toàn class). Launch 1 lần, đóng ở cuối.
- **BrowserContext + Page**: phạm vi **từng test**. Tạo ở {{@BeforeEach}}, đóng ở {{@AfterEach}}. Nhờ đó test A đăng nhập với tài khoản admin không hề thấy cookie của test B — đây là **tính độc lập của test**, điều kiện tiên quyết để chạy song song (bài 010).

Ngoại lệ hợp lý: luồng "đăng nhập 30 giây" có thể tái dùng context qua {{storageState}} — lưu trạng thái đăng nhập ra file rồi nạp khi tạo context ({{newContextOptions().setStorageStatePath(...)}}). Vừa nhanh vừa vẫn cô lập, vì mỗi test nhận **bản sao** trạng thái, không dùng chung phiên.

### Không thread-safe: chỗ dev Java hay vấp
**Thread-safe** = một object an toàn khi nhiều thread gọi đồng thời. Đối tượng Playwright **không** như vậy: {{Page}}, {{BrowserContext}}, {{Locator}} chỉ được phép chạm tới từ **đúng thread đã tạo ra nó**, và không được hai thread cùng thao tác một page. Lý do: mỗi thao tác UI (click, fill) là một lệnh gửi qua đường ống tới tiến trình driver rồi chờ phản hồi; trình duyệt không biết lệnh nào thuộc thread nào, nên trạng thái page bị hai luồng ghi chồng nhau. Biểu hiện khi bạn vi phạm: test fail sai vị trí, "Target page, context or browser has been closed", kết quả lật nhanh chậm không dự đoán được — loại bug khó chịu nhất để chẩn đoán.

Vì vậy JUnit 5 parallel hoặc TestNG parallel cần **mỗi thread một bộ Playwright/Browser**. Khuôn chuẩn:

~~~java
public final class PlaywrightHolder {
    // ThreadLocal = "một ô nhớ riêng cho từng thread": không ai giẫm lên ai
    private static final ThreadLocal<Playwright> PW = new ThreadLocal<>();
    private static final ThreadLocal<Browser> BROWSER = new ThreadLocal<>();

    private PlaywrightHolder() {}

    public static Browser browser() {
        Browser b = BROWSER.get();
        if (b == null) {                       // thread này chưa có trình duyệt
            PW.set(Playwright.create());
            b = PW.get().chromium()
                    .launch(new BrowserType.LaunchOptions().setHeadless(true));
            BROWSER.set(b);
        }
        return b;
    }

    public static void quit() {
        Browser b = BROWSER.get();
        if (b != null) { b.close(); BROWSER.remove(); }
        Playwright p = PW.get();
        if (p != null) { p.close(); PW.remove(); }   // REMOVE: thread CI được dùng lại!
    }
}
~~~

Dòng {{PW.remove()}} nghe thừa nhưng là bug thật: runner JUnit/Gradle **dùng lại thread pool** cho các test sau. Nếu bạn chỉ close mà không remove, lần {{browser()}} kế tiếp lấy ra một Browser đã đóng và nổ "has been closed"; nếu bạn không close, mỗi thread để lại một trình duyệt sống → 16 thread × 8 worker = máy hết RAM.

### JUnit 5 Extension: cấp phát như fixture
**Extension** của JUnit 5 là hook chạy quanh vòng đời test ({{BeforeAllCallback}}, {{BeforeEachCallback}}, {{AfterEachCallback}}, {{ParameterResolver}}) — viết một lần, mọi test dùng bằng {{@ExtendWith(...)}}. Đây là chỗ đúng để đặt việc mở/đóng tài nguyên và chụp ảnh khi fail, vì người viết test sẽ **quên** nếu bạn bắt họ tự viết:

~~~java
public class PlaywrightExtension implements BeforeEachCallback, AfterEachCallback, ParameterResolver {
    @Override public void beforeEach(ExtensionContext ctx) {
        BrowserContext bc = PlaywrightHolder.browser()
                .newContext(new Browser.NewContextOptions().setViewportSize(1440, 900));
        ctx.getStore(ExtensionContext.Namespace.GLOBAL).put(BrowserContext.class, bc);
        ctx.getStore(ExtensionContext.Namespace.GLOBAL).put(Page.class, bc.newPage());
    }

    @Override public void afterEach(ExtensionContext ctx) {
        var store = ctx.getStore(ExtensionContext.Namespace.GLOBAL);
        BrowserContext bc = store.remove(BrowserContext.class);
        if (bc != null) bc.close();          // dong context = don tab, cookie, socket
    }

    @Override public boolean supportsParameter(ParameterContext pc, ExtensionContext ec) {
        return pc.getParameter().getType() == Page.class;
    }

    @Override public Object resolveParameter(ParameterContext pc, ExtensionContext ec) {
        return ec.getStore(ExtensionContext.Namespace.GLOBAL).get(Page.class);
    }
}

// Test chỉ khai báo tham số, không quan tâm ai mở ai đóng
@ExtendWith(PlaywrightExtension.class)
class CheckoutSmokeTest {
    @Test void cart_shows_two_items(Page page) {
        page.navigate(Config.load("staging").baseUrl() + "/cart");
        assertThat(page.locator("#cart-count")).hasText("2");
    }
}
~~~

Playwright cũng đóng sẵn một extension JUnit 5 ({{@UsePlaywright}} trong gói {{com.microsoft.playwright.junit}} của artifact playwright) — biết để dùng, nhưng **vẫn phải tự viết** khi bạn cần thêm chuyện như bật trace, gắn Allure, chọn profile theo test. Khi đó extension tự chế của bạn chỉ khoảng 60 dòng.

### Config theo môi trường
Một suite phải chạy được trên dev, staging, prod-sandbox **không đổi một dòng code nào**. Nghĩa là: URL, tên tài khoản, độ dài timeout, số lần retry, và flag "có thanh toán thật hay không" đều là dữ liệu cấu hình.

~~~java
public record Config(String env, String baseUrl, String apiBase, int timeoutMs, String user, String pass) {
    public static Config load(String env) {
        Properties p = new Properties();
        try (java.io.InputStream in = Config.class.getResourceAsStream("/env/" + env + ".properties")) {
            if (in == null) throw new IllegalStateException("khong thay env/" + env + ".properties");
            p.load(in);
        } catch (java.io.IOException e) {
            throw new UncheckedIOException("doc config moi truong " + env + " bi loi", e);
        }
        // Secret KHÔNG nằm trong file properties, không nằm trong git: lấy từ CI
        return new Config(env, p.getProperty("baseUrl"), p.getProperty("apiBase"),
                Integer.parseInt(p.getProperty("timeoutMs", "5000")),
                System.getenv("QA_USER"), System.getenv("QA_PASS"));
    }
}
~~~

Ba điều đáng làm ngay từ đầu: (1) giá trị mặc định cho thứ không phải secret ({{timeoutMs}}), để thêm môi trường mới chỉ cần chép file; (2) secret qua biến môi trường hoặc secret store của CI; (3) **fail sớm**: thiếu file config thì ném lỗi ngay khi khởi động, đừng để 200 test fail vì {{NullPointerException}} rồi cả team ngồi đoán.

### Vòng đời tài nguyên trong một run

~~~seq
title: Cap phat tai nguyen cho test UI chay song song
actors: JUnit | Holder | Browser | Context | Page
JUnit -> Holder: beforeEach can page
Holder -> Browser: Playwright.create va chromium.launch
JUnit -> Browser: newContext cho rieng test nay
Browser -> Context: cookie va localStorage sach
Context -> Page: newPage
Page --> JUnit: tra ve cho test thao tac
JUnit -> Context: afterEach dong page va context
JUnit -> Holder: het class thi quit va remove
note JUnit..Holder: moi thread mot Playwright va Browser rieng
~~~

### Lỗi hay gặp trên production
- **Chia sẻ một Page giữa nhiều test chạy song song** (để "tiết kiệm"): kết quả sai không tái hiện được. Tiết kiệm thật phải đặt ở tầng context/driver, không phải ở tầng trạng thái dùng chung.
- **Singleton mutable trong class util**: một {{static Browser browser}} + {{static String currentToken}} là công thức sinh race. Biến ngữ cảnh phải đi kèm phạm vi sống rõ ràng.
- **Quên đóng Playwright**: tiến trình node driver ở lại, CI runner treo hoặc hết RAM, và job sau chết với lỗi khó hiểu.
- **Hard-code URL/locator theo môi trường**: {{page.navigate("https://staging.shop.test")}} trong test nghĩa là suite prod chạy… lên staging.
- **Put secret vào file config rồi commit**: report và git là nơi công khai trong nội bộ.
- **Trang hoàng framework quá mức**: abstraction 4 tầng cho 20 test khiến QA mới không dám sửa. Framework tốt là framework mà người khác đọc test của bạn và đoán được chỗ hỏng trong 2 phút.

### Liên hệ phỏng vấn
- "Bạn thiết kế framework từ đầu thế nào?" → kể 5 lớp, nói phạm vi sống của driver/context/page, nêu cách cấu hình theo môi trường, rồi kết bằng "bắt đầu từ 5 API smoke test trong CI, mở rộng dần".
- "Vì sao phải ThreadLocal?" → vì Playwright (và WebDriver) không thread-safe; JUnit/TestNG parallel dùng nhiều thread, mỗi thread cần một bộ điều khiển riêng. Nói thêm: {{ThreadLocal.remove()}} vì runner tái dùng thread.
- "Browser hay Context cho mỗi test?" → Browser dùng chung (đắt khi launch), Context mỗi test (rẻ, cô lập). Nói thêm: dùng {{storageState}} để tái dùng phiên login sẽ ghi điểm.
- "Một class test của bạn trông ra sao?" → mô tả extension/fixture, {{@BeforeEach}} tạo context, {{@AfterEach}} đóng và chụp screenshot khi fail.

> Senior tip: chỗ framework tiết kiệm tiền nhất không phải là code hay mà là **chính sách vòng đời tài nguyên** được viết ra và kiểm tra bằng test: 1 Playwright + 1 Browser mỗi thread, 1 Context mỗi test, đóng trong {{afterEach}}. Ở suite 800 UI test trên 16 worker, khuôn này rút thời gian từ ~90 phút xuống ~12 phút mà vẫn cô lập dữ liệu. Và một quy tắc phòng thủ đáng giá: đừng cho page object được quyền tạo/đóng browser — ai tạo thì người đó đóng, nếu không bạn sẽ có những "đêm trình duyệt ma" trong CI.`,
  exercises: [
    {
      title: 'BrowserPool: cấp một driver riêng cho mỗi thread, quit đúng cách',
      prompt: `Viết {{BrowserPool}} mô phỏng đúng chính sách cấp phát driver của framework ở bài trên (mỗi thread một "trình duyệt", không thread nào dùng chung), với {{FakeDriver}} là driver giả. **Không mở trình duyệt thật.** Chỉ dùng JDK, Java 17, chạy deterministic: không sleep, không random.

**1) Lớp {{FakeDriver}}** — một instance là một "trình duyệt" đang chạy:
- constructor {{FakeDriver(long id, long ownerThread)}}: {{id}} là số thứ tự do pool cấp, bắt đầu từ **1**; {{ownerThread}} là id của thread sở hữu nó.
- {{id()}}, {{ownerThread()}}, {{closed()}}: các getter, kiểu {{long}}, {{long}}, {{boolean}}.
- {{close()}}: đánh dấu driver đã đóng; gọi hai lần không sao.

**2) Lớp {{BrowserPool}}** — bộ cấp phát theo thread:
- {{BrowserPool()}}: pool mới, chưa có driver nào, bộ đếm id bắt đầu từ 1.
- {{FakeDriver acquire()}}: trả driver của **thread đang gọi**. Nếu thread đó chưa có driver thì tạo mới ({{id}} tăng dần **toàn pool**, {{ownerThread = Thread.currentThread().getId()}}) và gắn nó cho thread này — về bản chất là một {{ThreadLocal}}. Nếu thread đã có driver thì trả lại **đúng object cũ**, không tạo thêm.
- {{FakeDriver current()}}: driver của thread đang gọi, hoặc {{null}} nếu thread đó chưa acquire.
- {{void quit()}}: đóng driver của thread đang gọi (gọi {{close()}} trên driver), **gỡ** nó khỏi trạng thái theo thread, và tăng bộ đếm số driver đã đóng. Nếu thread đang gọi chưa từng acquire thì làm thinh, **không ném lỗi**. Sau khi quit, {{acquire()}} trên cùng thread phải trả về driver **có id khác**.
- {{int created()}}: tổng số driver đã tạo từ đầu, tính trên mọi thread.
- {{int closedCount()}}: tổng số driver đã đóng bằng {{quit()}}.
- {{int live()}}: {{created() - closedCount()}}.

Hai cái bẫy mà test sẽ bắt: (a) nếu pool giữ **một** driver dùng chung cho mọi thread thì hai thread cùng thao tác một page, đúng cái lỗi mà Playwright cấm; (b) nếu pool tạo driver **mỗi lần acquire** thì 500 test mở 500 trình duyệt, nổ RAM. Điểm ăn tiền là "một driver cho mỗi thread, và hết việc thì trả driver".

~~~text
thread main   : acquire -> FakeDriver#1, acquire -> FakeDriver#1 (object y het)
thread worker-3: acquire -> FakeDriver#2   (không bao giờ được #1)
quit tren worker-3: #2 closed, live() = 1
~~~`,
      starter: `final class FakeDriver {
    private final long id;
    private final long owner;

    FakeDriver(long id, long owner) {
        this.id = id;
        this.owner = owner;
    }

    long id() {
        return id;
    }

    long ownerThread() {
        return owner;
    }

    boolean closed() {
        throw new UnsupportedOperationException("TODO");
    }

    void close() {
        throw new UnsupportedOperationException("TODO");
    }
}

final class BrowserPool {
    FakeDriver acquire() {
        throw new UnsupportedOperationException("TODO");
    }

    FakeDriver current() {
        throw new UnsupportedOperationException("TODO");
    }

    void quit() {
        throw new UnsupportedOperationException("TODO");
    }

    int created() {
        throw new UnsupportedOperationException("TODO");
    }

    int closedCount() {
        throw new UnsupportedOperationException("TODO");
    }

    int live() {
        throw new UnsupportedOperationException("TODO");
    }
}`,
      tests: `public class Main {
    interface Body { boolean get() throws Exception; }

    static int pass = 0, total = 0;

    static void t(String name, Body b) {
        total++;
        try {
            if (b.get()) { pass++; System.out.println("PASS " + name); }
            else System.out.println("FAIL " + name + ": tra ve false");
        } catch (Throwable e) {
            System.out.println("FAIL " + name + ": " + e);
        }
    }

    static void eq(Object actual, Object expected) {
        if (!Objects.equals(actual, expected)) {
            throw new AssertionError("expected " + expected + " but was " + actual);
        }
    }

    public static void main(String[] args) {
        t("acquire dau tien tao driver id 1 cho chinh thread", () -> {
            BrowserPool p = new BrowserPool();
            eq(p.current(), null);
            FakeDriver d = p.acquire();
            eq(d.id(), 1L);
            eq(d.closed(), false);
            eq(d.ownerThread(), Thread.currentThread().getId());
            eq(p.current() == d, true);
            return p.created() == 1 && p.live() == 1;
        });

        t("cung thread acquire 50 lan chi mot driver", () -> {
            BrowserPool p = new BrowserPool();
            FakeDriver first = p.acquire();
            for (int i = 0; i < 49; i++) {
                if (p.acquire() != first) return false;
            }
            eq(p.created(), 1);
            return p.live() == 1;
        });

        t("quit dong va go de acquire tao driver moi", () -> {
            BrowserPool p = new BrowserPool();
            FakeDriver d = p.acquire();
            p.quit();
            eq(d.closed(), true);
            eq(p.current(), null);
            eq(p.created(), 1);
            eq(p.closedCount(), 1);
            eq(p.live(), 0);
            FakeDriver again = p.acquire();
            eq(again.id(), 2L);
            eq(again == d, false);
            return p.created() == 2 && p.live() == 1;
        });

        t("quit không có driver thì im lặng", () -> {
            BrowserPool p = new BrowserPool();
            p.quit();
            p.quit();
            eq(p.closedCount(), 0);
            eq(p.created(), 0);
            FakeDriver d = p.acquire();
            eq(d.id(), 1L);
            return p.live() == 1;
        });

        t("thread khác không nhìn thấy driver của main", () -> {
            BrowserPool p = new BrowserPool();
            FakeDriver mine = p.acquire();
            AtomicReference<FakeDriver> seenCurrent = new AtomicReference<>();
            AtomicReference<FakeDriver> theirs = new AtomicReference<>();
            CountDownLatch done = new CountDownLatch(1);
            Thread th = new Thread(() -> {
                seenCurrent.set(p.current());
                theirs.set(p.acquire());
                done.countDown();
            });
            th.start();
            try {
                done.await(15, TimeUnit.SECONDS);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
            th.join(15000);
            eq(seenCurrent.get(), null);
            eq(theirs.get() == mine, false);
            eq(theirs.get().id(), 2L);
            eq(theirs.get().ownerThread(), th.getId());
            eq(mine.ownerThread(), Thread.currentThread().getId());
            return p.created() == 2;
        });

        t("id tang dan theo lan tao moi", () -> {
            BrowserPool p = new BrowserPool();
            List<Long> ids = new ArrayList<>();
            for (int i = 0; i < 3; i++) {
                ids.add(p.acquire().id());
                p.quit();
            }
            eq(ids, Arrays.asList(1L, 2L, 3L));
            eq(p.closedCount(), 3);
            return p.live() == 0;
        });

        t("hai pool doc lap bo dem id", () -> {
            BrowserPool a = new BrowserPool();
            BrowserPool b = new BrowserPool();
            eq(a.acquire().id(), 1L);
            eq(b.acquire().id(), 1L);
            eq(a.created(), 1);
            return b.created() == 1;
        });

        t("8 thread x 50 lần không ai dùng chung driver", () -> {
            BrowserPool p = new BrowserPool();
            ExecutorService ex = Executors.newFixedThreadPool(8);
            List<Future<long[]>> futures = new ArrayList<>();
            for (int i = 0; i < 8; i++) {
                futures.add(ex.submit(() -> {
                    Set<Long> distinct = new HashSet<>();
                    long[] box = new long[3];
                    FakeDriver d = null;
                    for (int k = 0; k < 50; k++) {
                        d = p.acquire();
                        distinct.add(d.id());
                    }
                    box[0] = distinct.size();
                    box[1] = d.id();
                    box[2] = Thread.currentThread().getId();
                    p.quit();
                    return box;
                }));
            }
            ex.shutdown();
            boolean finished = false;
            try {
                finished = ex.awaitTermination(60, TimeUnit.SECONDS);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
            if (!finished) throw new AssertionError("executor khong ket thuc dung hen");
            eq(finished, true);
            Set<Long> ids = new HashSet<>();
            Set<Long> owners = new HashSet<>();
            for (Future<long[]> f : futures) {
                try {
                    long[] box = f.get();
                    eq(box[0], 1L);
                    ids.add(box[1]);
                    owners.add(box[2]);
                } catch (Exception e) {
                    throw new AssertionError("loi trong task: " + e);
                }
            }
            eq(ids.size(), 8);
            eq(owners.size(), 8);
            eq(p.created(), 8);
            eq(p.closedCount(), 8);
            return p.live() == 0;
        });

        t("driver của worker mang id của chính worker đó", () -> {
            BrowserPool p = new BrowserPool();
            ExecutorService ex = Executors.newFixedThreadPool(2);
            List<Future<long[]>> futures = new ArrayList<>();
            for (int i = 0; i < 4; i++) {
                futures.add(ex.submit(() -> new long[] {p.acquire().id(), p.acquire().ownerThread(), Thread.currentThread().getId()}));
            }
            ex.shutdown();
            try {
                if (!ex.awaitTermination(60, TimeUnit.SECONDS)) throw new AssertionError("executor treo");
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
            for (Future<long[]> f : futures) {
                try {
                    long[] box = f.get();
                    eq(box[1], box[2]);
                } catch (Exception e) {
                    throw new AssertionError("loi trong task: " + e);
                }
            }
            return p.created() >= 1 && p.created() <= 2;
        });

        System.out.println("RESULT " + pass + "/" + total);
    }
}`,
      reference: `final class FakeDriver {
    private final long id;
    private final long owner;
    private volatile boolean closed;

    FakeDriver(long id, long owner) {
        this.id = id;
        this.owner = owner;
    }

    long id() {
        return id;
    }

    long ownerThread() {
        return owner;
    }

    boolean closed() {
        return closed;
    }

    void close() {
        closed = true;
    }
}

final class BrowserPool {
    private final AtomicLong seq = new AtomicLong();
    private final AtomicInteger created = new AtomicInteger();
    private final AtomicInteger closedCount = new AtomicInteger();
    private final ThreadLocal<FakeDriver> mine = new ThreadLocal<>();

    FakeDriver acquire() {
        FakeDriver d = mine.get();
        if (d == null) {
            d = new FakeDriver(seq.incrementAndGet(), Thread.currentThread().getId());
            mine.set(d);
            created.incrementAndGet();
        }
        return d;
    }

    FakeDriver current() {
        return mine.get();
    }

    void quit() {
        FakeDriver d = mine.get();
        if (d == null) return;
        mine.remove();
        d.close();
        closedCount.incrementAndGet();
    }

    int created() {
        return created.get();
    }

    int closedCount() {
        return closedCount.get();
    }

    int live() {
        return created.get() - closedCount.get();
    }
}`,
      hints: [
        'Cốt lõi là một field {{ThreadLocal<FakeDriver>}}: mỗi thread thấy ô nhớ riêng, nên không cần khóa (synchronized) cho phần "lấy hoặc tạo driver của thread này".',
        'Bộ đếm id và bộ đếm created/closed phải là {{AtomicLong}} và {{AtomicInteger}} **của instance** (field final trong BrowserPool), vì mọi thread cùng ghi vào đó. Đừng dùng int thường: cập nhật {{x++}} từ 8 thread sẽ cho số nhỏ hơn thực tế.',
        'quit(): đọc driver bằng {{mine.get()}}, nếu null thì return ngay (không ném lỗi); nếu có thì {{mine.remove()}} trước rồi {{d.close()}} và tăng bộ đếm. Remove là mấu chốt — runner tái dùng thread, để lại driver đã đóng trong ThreadLocal thì lần acquire sau trả về driver hỏng.',
        'live() chỉ là phép trừ hai bộ đếm; đừng đếm riêng bằng một biến thứ ba dễ lệch.',
        'Bài test 8 thread × 50 lần: tạo {{ExecutorService}} với 8 thread cố định, gửi 8 task, mỗi task gọi {{acquire()}} 50 lần và bỏ id vào một {{Set}} để chứng minh **một task chỉ thấy đúng một driver**, rồi {{shutdown()}} cộng {{awaitTermination(60, TimeUnit.SECONDS)}}. Đừng dùng {{Thread.sleep}} để "chờ cho chắc".',
      ],
      explain: `**Vì sao ThreadLocal mà không phải Map theo id thread?** Một {{ConcurrentHashMap<Long, FakeDriver>}} keyed by {{thread.getId()}} cũng chạy được, nhưng nó giữ driver **sau khi thread chết** (thread pool của CI thì sống cả ngày) và bạn phải tự dọn. {{ThreadLocal}} cho thread tự mang tài nguyên của mình: đọc/ghi không cần khóa, và {{remove()}} là hành động "trả tài nguyên" rõ ràng. Đây chính xác là khuôn các DriverFactory của Selenium/Playwright dùng khi chạy parallel.

Ba việc trong {{acquire}} theo thứ tự: tạo driver với {{seq.incrementAndGet()}} (id **toàn pool**, không phải per-thread — nhờ vậy hai driver không trùng số và test "id tang dan" mới có nghĩa), {{mine.set(d)}} để lần sau lấy lại đúng object, {{created.incrementAndGet()}} cho báo cáo. Thiếu một trong ba là hỏng một test: quên {{set}} thì mỗi lần acquire mở một trình duyệt; quên đếm thì {{live()}} sai.

Trong {{quit}} thứ tự {{remove}} rồi {{close}} không phải ngẫu nhiên. Nếu bạn close trước rồi mới remove, khoảng giữa đó một thao tác khác của **cùng thread** (ví dụ một {{@AfterEach}} khác chạy trước) vẫn nhìn thấy driver đã đóng qua {{current()}} và gọi vào nó. Remove trước để "{{current()}} trả null nghĩa là thread này thật sự đang không có driver".

{{AtomicInteger}} nghe nhỏ nhưng là nơi QA dính bug dai dẳng: test "8 thread x 50 lan" đòi {{created() == 8}}. Với {{int}} thường, {{created++}} gồm ba bước (đọc, cộng, ghi) nên hai thread cùng đọc giá trị cũ rồi cùng ghi 2 → số cuối nhỏ hơn; với {{AtomicInteger.incrementAndGet()}} luôn đúng. Nếu bạn thấy {{created()}} trả 6 hoặc 7 trong khi có 8 driver tồn tại, đây chính là lý do.

Bài test cuối ({{created() <= 2}}) dạy một điều quan trọng khi đọc kết quả CI: **task != thread**. Pool 2 thread chạy 4 task, hai task đầu trên hai thread khác nhau tạo hai driver; hai task sau chạy **trên chính hai thread đó** nên ThreadLocal còn giữ driver cũ → {{created()}} vẫn là 2, không phải 4. Đó là lý do bạn bắt buộc phải {{quit()}} + {{remove()}} ở cuối mỗi test: tài nguyên và trạng thái đăng nhập "dính" trên thread là nguồn flaky mà rất nhiều team đổ cho... trình duyệt.`,
    },
  ],
  check: [
    {
      q: 'Trong Playwright for Java, phạm vi sống nào là hợp lý nhất cho Browser và cho BrowserContext khi suite chạy parallel?',
      options: [
        'Browser mỗi test, Context mỗi test — cô lập tối đa là an toàn nhất',
        'Browser dùng chung cho một thread/cả run, BrowserContext mới cho từng test',
        'Browser và Context đều là singleton static duy nhất cho cả suite',
        'Context dùng chung, Browser mới cho từng test',
      ],
      answer: 1,
      explain: 'Launch Browser đắt (vài trăm ms tới một giây) nhưng tạo Context chỉ ~10 ms, nên dùng chung Browser và làm Context mới mỗi test vừa nhanh vừa cô lập cookie/localStorage. Phương án 3 là bẫy: singleton chia sẻ trạng thái đăng nhập giữa các test và còn bị ghi đồng thời từ nhiều thread.',
    },
    {
      q: 'Vì sao đối tượng Playwright/Page không nên dùng từ nhiều thread cùng lúc?',
      options: [
        'Vì JVM cấm truy cập object từ thread khác',
        'Vì mỗi thao tác là lệnh gửi tới tiến trình driver và chờ phản hồi; hai thread ghi lên cùng page làm trạng thái UI chồng lấn, kết quả không dự đoán được',
        'Vì Playwright chỉ hoạt động ở chế độ headless khi có nhiều thread',
        'Vì JUnit 5 không hỗ trợ chạy song song',
      ],
      answer: 1,
      explain: 'JVM không cấm dùng object đa thread, nhưng object phải **tự thiết kế** cho điều đó. Playwright chọn mô hình "một page một thread" (mô hình actor-like), nên API của nó không thread-safe. Biểu hiện khi vi phạm: "browser has been closed", assertion fail sai chỗ, flaky không tái hiện.',
    },
    {
      q: 'ThreadLocal<FakeDriver> trong BrowserPool **bắt buộc** phải có bước nào để không rò rỉ trên CI?',
      options: [
        'Gọi ThreadLocal.get() thường xuyên',
        'Gọi ThreadLocal.remove() khi quit() hoặc kết thúc test, vì runner dùng lại thread trong pool',
        'Đánh dấu field là volatile',
        'Đóng browser trong @BeforeAll',
      ],
      answer: 1,
      explain: 'Thread pool của Gradle/JUnit/TestNG có thể giữ một thread chạy hàng nghìn test. Không remove thì hoặc là driver đã đóng vẫn nằm trong ThreadLocal (lần sau lấy ra dùng → lỗi), hoặc mỗi thread tích lại tài nguyên chưa đóng. volatile không liên quan: nó chỉ bảo đảm nhìn thấy giá trị mới giữa thread, còn ThreadLocal đã cách ly theo thread rồi.',
    },
    {
      q: 'JUnit 5 Extension là chỗ đúng để đặt việc mở/đóng tài nguyên vì:',
      options: [
        'Nó chạy nhanh hơn @BeforeEach viết trong class test',
        'Nó áp dụng cho mọi test khi gắn @ExtendWith, không phụ thuộc trí nhớ của người viết test, và giữ test tập trung vào nghiệp vụ',
        'Nó tự động retry test khi fail',
        'Nó cho phép chia sẻ Page giữa các test để tiết kiệm RAM',
      ],
      answer: 1,
      explain: 'Giá trị của fixture/extension là **tính bắt buộc**: code nằm trong framework thì luôn chạy, còn code buộc mỗi QA nhớ viết trong từng test thì sớm muộn cũng có người quên — và quên dọn tài nguyên hoặc quên chụp screenshot khi fail là hai loại bug tốn tiền nhất.',
    },
  ],
  related: ['autotest-016', 'autotest-009', 'autotest-017'],
  tags: ['framework', 'driver factory', 'ThreadLocal', 'BrowserContext', 'storageState', 'JUnit 5 extension', 'config', 'Playwright Java'],
},
{
  id: 'lesson-autotest-010',
  track: 'autotest',
  order: 10,
  title: 'Chạy song song và phân mảnh (sharding) trong CI: JUnit 5 parallel, image Playwright cho Docker, chia shard theo thời lượng',
  level: 'senior',
  minutes: 45,
  goals: [
    'Phân biệt song song hoá trong một tiến trình (parallel) và chia suite ra nhiều máy (sharding), biết khi nào dùng cái nào',
    'Bật và cấu hình parallel của JUnit 5 / TestNG, hiểu vì sao Playwright không thread-safe buộc mỗi thread một bộ driver',
    'Viết job CI dùng image mcr.microsoft.com/playwright/java và truyền shard index/total cho Maven',
    'Chia shard theo **thời lượng lịch sử** bằng thuật toán LPT thay vì chia đều theo số lượng',
    'Liệt kê những thứ phải sửa trong test trước khi bật parallel (dữ liệu dùng chung, thứ tự, tài nguyên giới hạn)',
  ],
  body: `**Tóm tắt:** Suite 800 UI test chạy tuần tự 53 phút thì không ai đợi. Có hai cách rẻ dần để rút nó lại: **song song hoá (parallel)** — một máy, nhiều thread, mỗi thread một bộ Playwright/Browser riêng; và **phân mảnh (sharding)** — nhiều job/machine, mỗi job chạy một tập con của suite. Song song hoá ăn CPU và RAM của một máy, còn sharding mở rộng ngang nhưng đặt thêm vấn đề: chia sao cho các job **xong gần cùng lúc**. Câu trả lời đúng là chia theo **thời lượng lịch sử** (lấy từ attribute {{time}} trong JUnit XML — bài 008), không phải chia theo số lượng test.

### Hai trục mở rộng, đừng lẫn
~~~text
PARALLEL (1 máy, N thread)          SHARDING (M job, M máy/container)
  worker-1: test A B C                 shard 1: A..S   (machine 1)
  worker-2: test D E F     --->        shard 2: T..Z2  (machine 2)
  chung CPU/RAM/nguồn DB              shard 3: ...     (machine 3)
~~~

- **Parallel** giải bài toán "một máy rảnh 15/16 nhân mà test chạy 1 luồng". Giới hạn bởi RAM (mỗi chromium ~150–300 MB) và bởi phần **tuần tự** còn sót lại (setup, đăng nhập, seed DB).
- **Sharding** giải bài toán "dù 16 thread vẫn 20 phút, và CI tính tiền theo phút của một job". GitHub Actions/Jenkins chạy song song M job; mỗi job là một container.

Hai cái cộng lại được, nhưng đừng lạm dụng: 4 shard × 8 thread = 32 trình duyệt trên 4 máy 16 nhân là công thức sinh ra timeout hàng loạt.

### Điều kiện tiên quyết: test độc lập thật sự
Chạy song song **không tạo ra** tính độc lập, nó **phơi bày** việc bạn không có tính độc lập. Bốn thứ phải sạch trước khi bật:

| Vấn đề | Triệu chứng khi bật parallel | Cách sửa |
|---|---|---|
| Thứ tự phụ thuộc (test A tạo đơn hàng, test B đọc đơn hàng đó) | B fail vì danh sách rỗng, nhưng chỉ khi chạy chung run | mỗi test tự chuẩn bị dữ liệu của mình (API/SQL seed), hoặc gộp vào một test |
| Dữ liệu dùng chung (cùng một tài khoản, cùng một mã giảm giá) | login lẫn nhau, "duy nhất 1 bản ghi" conflict, số dư âm | sinh dữ liệu **riêng theo test**: email dạng {{qa-<testName>-<UUID>@shop.test}}, id UUID |
| Trạng thái tĩnh trong framework ({{static Page page}}, {{static token}}) | kết quả sai không giải thích được | phạm vi sống theo test/bối cảnh (bài 009), hoặc {{ThreadLocal}} |
| Tài nguyên giới hạn (connection pool 10, rate limit 100/phút, một thiết bị vật lý) | timeout, 429 Too Many Requests | tăng cỡ pool, hoặc **hạn chế song song** cho riêng nhóm test đó ({{@ResourceLock}} / {{@Execution(SAME_THREAD)}}) |

JUnit 5 có sẵn hai annotation để cô lập những test không thể song song: {{@ResourceLock("db-schema")}} (các test cùng lock chạy lần lượt) và {{@Execution(SAME_THREAD)}} (test không được tách thread). Dùng chúng cho test xóa/seed schema, test upload file vào cùng thư mục, test cần webcam — thay vì tắt parallel cho cả suite.

### Bật parallel trong JUnit 5
Khai báo ở {{src/test/resources/junit-platform.properties}}:

~~~properties
junit.jupiter.execution.parallel.enabled = true
# class này được chạy song song với class khác
junit.jupiter.execution.parallel.mode.default = concurrent
junit.jupiter.execution.parallel.mode.classes.default = concurrent
# mo rong: 2 thread / nhan, tran 16
junit.jupiter.execution.parallel.config.strategy = dynamic
junit.jupiter.execution.parallel.config.dynamic.factor = 2
# cho test cùng class dùng một instance (cần cho @BeforeAll/@AfterAll không static)
junit.jupiter.testinstance.lifecycle.default = per_class
~~~

- **{{mode.default = concurrent}}**: các **phương thức** trong cùng một class cũng chạy song song. Đây là chỗ làm hỏng {{@BeforeAll}} + state của instance nếu bạn đặt {{Page page}} làm field và {{@TestInstance(PER_CLASS)}}: một page bị hai thread cùng click → đúng lỗi "không thread-safe" của Playwright.
- **{{strategy = dynamic}} + {{factor = 2}}**: số thread = 2 × số nhân CPU. **{{fixed}} + {{parallel.config.fixed.pool.size = 8}}** nếu bạn muốn con số ổn định giữa các runner — nên chọn fixed khi RAM là nút thắt, vì dynamic trên máy CI 4 nhân chỉ tạo 8 thread mà cần tới ~2 GB.
- TestNG thì khác: {{parallel="methods"}} hoặc {{parallel="classes"}} + {{thread-count="8"}} trong {{testng.xml}}, {{parallel="instances"}} khi dùng {{@Factory}}. Data provider chạy tuần tự trừ khi {{@DataProvider(parallel = true)}} — và provider song song nhân luôn số browser nếu mỗi luồng tạo context trong provider.

Maven Surefire cũng có song song trong một máy, hoạt động bằng cách fork **nhiều tiến trình JVM**: {{-DforkCount=4 -DreuseForks=false}}. Mỗi fork một JVM riêng, tài nguyên hoàn toàn cách ly, nhưng mỗi fork phải tốn 2–4 giây khởi động + Playwright.create() riêng (image container tải lại). Đây cũng là một kiểu sharding "ngầm" — đơn giản, không cần viết code chia suite.

### Sharding trong CI: chia tập test, mỗi job một phần
Playwright (bản Node.js) có {{--shard=3/10}} làm sẵn. **Playwright for Java không có cờ shard tương đương**, nên bạn tự chia bằng một trong ba cách thực dụng:

1. **Theo danh sách class** — runner nhận {{SHARD_INDEX}}/{{SHARD_TOTAL}}, tự lọc class mà chỉ số thuộc về nó. Đây là cách bài tập dưới đây mô hình hoá.
2. **Theo tag/group** — đánh dấu {{@Tag("shard-a")}} rồi {{-Dgroups=shard-a}}; đơn giản nhưng mất công bảo trì khi thêm test.
3. **forkCount trên nhiều máy** — mỗi job chạy một phần suite bằng {{-Dit.test=Checkout*,Order*}}.

~~~yaml
# .github/workflows/e2e.yml (truot)
jobs:
  ui-regression:
    runs-on: ubuntu-latest
    container:
      # Image cua Microsoft: co san Chromium/Firefox/WebKit + ffmpeg + dependency he thong
      image: mcr.microsoft.com/playwright/java:v1.47.0-noble
    strategy:
      fail-fast: false           # shard này hỏng không dừng các shard khác
      matrix:
        shard: [1, 2, 3, 4]
    env:
      SHARD_INDEX: \${{ matrix.shard }}
      SHARD_TOTAL: 4
    steps:
      - uses: actions/checkout@v4
      # Bô chon shard (bai tap duoi day) doc SHARD_INDEX/SHARD_TOTAL + JUnit XML cua run truoc,
      # in ra danh sách class thuoc shard nay, moi dong one class.
      - run: java -cp target/test-classes com.shop.qa.ShardSelector > shard.txt
      - run: mvn -B verify -Dtest="$(paste -sd, - < shard.txt)"
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: allure-\${{ matrix.shard }}
          path: target/allure-results
~~~

Ba chi tiết hay bị bỏ ở đây:
- **Pin tag image trùng version thư viện**: {{v1.47.0-noble}} phải khớp {{com.microsoft.playwright:playwright:1.47.0}}. Playwright nhúng binary trình duyệt theo version; lệch version là lỗi "Executable doesn't exist at .../chrome-linux" — chạy 20 phút mới biết.
- **Bật tracing/video trong container**: image có ffmpeg, nên {{setRecordVideoDir}} hoạt động; nếu dùng image {{ubuntu}} thường thì thiếu codec và thiếu {{libnss3}}/{{libatk}} — Playwright báo lỗi khởi động trình duyệt rất khó đọc.
- **Gộp kết quả trước khi dựng báo cáo**: mỗi shard chỉ có một phần {{allure-results}}. Phải upload artifact **với {{if: always()}}** (báo cáo thì artifact cũng fail theo), tải hết về một bước sau, gộp rồi mới {{allure generate}} — nếu không report chỉ có 1/4 số test.

Jenkins thì dùng {{parallel}}/{{matrix}} trong declarative pipeline với cùng ý tưởng: mỗi branch của {{matrix}} một container, và khối {{post}} với điều kiện {{always}} để gom report.

### Selenium Grid 4 — để so sánh, không phải để mặc định dùng
**Selenium Grid** là một service đứng giữa test và trình duyệt: test gửi yêu cầu "cho tôi một Chrome", Grid xếp nó vào một **node** (máy có Chrome + chromedriver) qua **Distributor**, còn **Router** định tuyến. Grid 4 chạy bằng một tiến trình {{selenium-server}} (hoặc {{hub}} + {{node}}), có {{SessionRequest}}, {{NodeSelector}}, khả năng pin theo capability.

| Khía cạnh | Playwright + sharding trong CI | Selenium Grid 4 |
|---|---|---|
| Ai cấp phát trình duyệt | mỗi test/job tự launch trên máy của nó | Grid tập trung, test chỉ xin session |
| Chi phí hạ tầng | 0 (dùng runner có sẵn) | phải nuôi hub + node, upgrade, theo dõi sức khỏe |
| Song song | theo thread/job của bạn | theo số slot bạn mở trên node |
| Video/trace | built-in (ffmpeg, trace zip) | cần tự viết |
| Dùng khi | CI cloud, suite vừa và lớn, team một stack | nhiều team dùng chung một cụm trình duyệt/desktop, cần test trên máy OS/phiên bản cụ thể, legacy stack |

Nhiều công ty Việt Nam vẫn Grid vì Selenium đã có từ lâu và vì họ muốn QA chạy test Windows desktop trên node thật. Khi phỏng vấn hỏi "Grid hay sharding?", câu trả lời tốt: "Grid giải bài toán **tài nguyên tập trung và đa nền tảng**; sharding giải bài toán **thời gian chạy**. CI hiện đại thường chọn sharding + container vì không muốn nuôi hạ tầng."

### Chia shard theo thời lượng: thuật toán LPT
Chia đều theo **số lượng** là sai, vì thời lượng test chênh 20 lần: {{CheckoutFlowTest}} 90 giây trong khi {{HomeBannerTest}} 4 giây. 100 test chia 4 shard đều nhau về số nhưng shard chứa các test nặng sẽ chạy 25 phút còn shard nhẹ xong trong 6 phút — bạn vẫn phải **chờ 25 phút**, và 3 máy kia ngồi chơi (makespan = thời gian của shard chậm nhất, đó là thứ ta muốn nhỏ nhất).

**LPT (Longest Processing Time)** — greedy đơn giản, bảo đảm makespan không quá 4/3 lần mức tối ưu:

~~~text
durations: A 50s, B 40s, C 30s, D 25s, E 20s, F 5s     shards = 2

1) xep giam dan theo thoi luong: A B C D E F
2) lay tung test, tha no vao shard dang NHE (tong luu nho nhat); hoa thi chon shard co so thu tu nho hon

  A -> S1            S1=[A]        luu S1=50  S2=0
  B -> S2            S2=[B]        luu S1=50  S2=40
  C -> S2            S2=[B,C]      luu S1=50  S2=70
  D -> S1            S1=[A,D]      luu S1=75  S2=70
  E -> S2            S2=[B,C,E]    luu S1=75  S2=90
  F -> S1            S1=[A,D,F]    luu S1=80  S2=90

makespan = 90 (so với chia theo số lượng A,B,C | D,E,F thì 120)
~~~

Cần **dữ liệu thời lượng lịch sử**: lấy từ JUnit XML (mỗi {{<testcase time="4.7">}}) hoặc từ báo cáo CI, tích lũy trung bình trượt 10 lần chạy gần nhất để không bị một lần chạy bất thường làm lệch. Test mới chưa có lịch sử: cho một giá trị mặc định (trung vị của suite), đừng cho 0 — nếu không nó bị xếp dồn hết vào một shard.

### Lỗi hay gặp trên production
- **Bật parallel khi test còn phụ thuộc nhau** → suite đỏ mỗi đêm theo thứ tự ngẫu nhiên, mọi người mất niềm tin rồi tắt parallel. Luôn chạy {{-DforkCount}} trên một branch riêng, so sánh kết quả với run tuần tự trước khi merge.
- **Chung một tài khoản test cho mọi thread**: hai worker cùng đổi mật khẩu của cùng một user → cả hai fail. Tài khoản phải riêng, hoặc dùng loại tài khoản **chỉ đọc**.
- **Chia shard theo {{index % total}} trên danh sách chưa sắp xếp**: thêm một test vào giữa danh sách làm đảo toàn bộ phân bố và đổi luôn các test trong mỗi shard → bạn mất khả năng so sánh "shard 2 đỏ vì sao". Hãy chia theo **thời lượng** và theo tên đã sort, kết quả xác định.
- **Quên rằng mỗi shard đều chạy {{@BeforeAll}} seed DB**: 4 shard × 2000 dòng insert = DB chết hoặc duplicate key. Seed một lần ở job riêng ({{needs:}} trong GH Actions), hoặc seed idempotent ({{ON CONFLICT DO NOTHING}}).
- **Quá nhiều browser so với /dev/shm**: container mặc định có {{/dev/shm}} 64 MB; Chromium crash "out of memory" bí ẩn. Khắc phục: chạy container với {{--shm-size=1g}} (trong GH Actions: {{options: --shm-size=1g}} cho service, hoặc cấu hình container).
- **Retry để cân bằng shard**: nghe buồn cười nhưng hay xảy ra vì test nặng fail trên shard chậm. Sửa dữ liệu chia, đừng sửa số lần retry.
- **Không giới hạn song song của API test**: 16 thread đánh staging 200 request/giây → rate limit 429, và bạn tưởng là bug ứng dụng.

### Liên hệ phỏng vấn
- "Suite UI của bạn 2 tiếng, làm sao xuống 20 phút?" → đưa theo trình tự: (1) cắt test không đáng có và đẩy xuống tầng API, (2) bật parallel trong một máy với driver-per-thread, (3) shard theo thời lượng lịch sử ra M job, (4) đo lại makespan và chỉnh số shard. Nói kèm con số và **chi phí**: 4 job × 16 phút CI so với 1 job × 53 phút.
- "Chia shard thế nào cho đều?" → kể LPT, nói vì sao chia theo số lượng là sai, nói nguồn dữ liệu thời lượng.
- "Playwright có {{--shard}} không?" → bản Node.js có; bản Java thì bạn tự chia (class filter/tag/forkCount) và nên nhớ **Browser không dùng chung được giữa các thread**.
- "Còn Selenium Grid thì sao?" → so như bảng trên, nói rõ khi nào Grid thắng (đa nền tảng, hạ tầng dùng chung, desktop app).

> Senior tip: trước khi thêm máy, hãy **cắt thời lượng của test chậm nhất**. Suite 4 shard mà mỗi shard 20 phút, nhưng test chậm nhất trong shard đó là 18 phút (một test E2E "đặt hàng + chờ duyệt + đối soát" gộp ba luồng), thì mua thêm 3 máy nữa **vẫn 18 phút** — makespan bị một test quyết định, gọi là hiệu ứng "đòn bẫy dài nhất". Dấu hiệu trên dashboard: p50 shard time 8 phút nhưng p95 22 phút. Khi đó việc cần làm là tách test, không phải thêm shard.`,
  exercises: [
    {
      title: 'Sharder: chia suite thành N shard bằng LPT, tính makespan và cận dưới',
      prompt: `Viết {{Sharder}} mô phỏng bộ chia shard mà CI gọi trước khi khởi động các job. Vào là **thời lượng lịch sử** của từng test (giây), ra là một phương án chia **hoàn toàn xác định** — cùng đầu vào, kể cả khi thứ tự thêm phần tử của map khác nhau, phải cho cùng một kết quả. Không dùng random, không đọc thời gian thực, không song song hoá.

**1) {{static List<List<String>> split(Map<String, Long> durations, int shards)}}** — thuật toán LPT:
- {{durations}} ánh xạ tên test → số giây. Kết quả là danh sách **đúng {{shards}}** shard (shard có thể rỗng); mỗi shard là danh sách tên test theo **thứ tự được gán vào**.
- Sắp xếp các test: **thời lượng giảm dần**; hai test cùng thời lượng thì **tên tăng dần** theo thứ tự tự nhiên của chuỗi ({{compareTo}}).
- Gán lần lượt từng test đã sắp xếp vào shard có **tổng thời lượng hiện tại nhỏ nhất**; nếu nhiều shard cùng nhẹ nhất thì chọn shard có **index nhỏ nhất**.
- {{shards <= 0}}: ném {{IllegalArgumentException}}.
- {{durations}} bằng {{null}} hoặc rỗng: trả về {{shards}} danh sách rỗng, không ném lỗi.

Ví dụ với {{a=5, b=3, c=2, d=2}} và {{shards = 2}}:

~~~text
thứ tự giảm dần: a(5), b(3), c(2), d(2)   (c đụng hoà với d nên c đi trước)
a -> shard 0            [a]      luu 5 | 0
b -> shard 1            [a] [b]  luu 5 | 3
c -> shard 1            [a] [b,c] luu 5 | 5
d -> shard 0 (hoa luu thi index nho nhat)  luu 7 | 5
ket qua: [[a, d], [b, c]]
~~~

**2) {{static long makespan(List<List<String>> plan, Map<String, Long> durations)}}** — tổng thời lượng **lớn nhất** trong các shard (đây chính là thời gian CI phải chờ). Cộng dồn theo {{durations.getOrDefault(name, 0L)}}: tên lạ không có trong map tính 0. {{plan}} rỗng hoặc {{durations}} {{null}} thì trả 0.

**3) {{static long lowerBound(Map<String, Long> durations, int shards)}}** — cận dưới lý thuyết của makespan: không phương án nào chia đều hơn {{max(thoi luong lon nhat, ceil(tong / shards))}}. Làm tròn lên bằng số nguyên ({{(tong + shards - 1) / shards}}). {{durations}} null/rỗng trả 0; {{shards <= 0}} ném {{IllegalArgumentException}}.

Gợi ý bẫy: (a) nếu bạn sắp xếp bằng cách duyệt map và so {{>}} mà không có quy tắc hoà theo tên thì kết quả phụ thuộc thứ tự {{put}} — CI sẽ không giải thích được vì sao hôm qua shard 3 đỏ, hôm nay lại là shard 1; (b) nếu bạn chia đều theo **số lượng test** thì một test 90 giây làm cả shard 20 phút.`,
      starter: `final class Sharder {
    static List<List<String>> split(Map<String, Long> durations, int shards) {
        throw new UnsupportedOperationException("TODO");
    }

    static long makespan(List<List<String>> plan, Map<String, Long> durations) {
        throw new UnsupportedOperationException("TODO");
    }

    static long lowerBound(Map<String, Long> durations, int shards) {
        throw new UnsupportedOperationException("TODO");
    }
}`,
      tests: `public class Main {
    interface Body { boolean get() throws Exception; }

    static int pass = 0, total = 0;

    static void t(String name, Body b) {
        total++;
        try {
            if (b.get()) { pass++; System.out.println("PASS " + name); }
            else System.out.println("FAIL " + name + ": tra ve false");
        } catch (Throwable e) {
            System.out.println("FAIL " + name + ": " + e);
        }
    }

    static void eq(Object actual, Object expected) {
        if (!Objects.equals(actual, expected)) {
            throw new AssertionError("expected " + expected + " but was " + actual);
        }
    }

    static Map<String, Long> map(String[][] pairs) {
        Map<String, Long> m = new LinkedHashMap<>();
        for (String[] p : pairs) m.put(p[0], Long.parseLong(p[1]));
        return m;
    }

    static final Map<String, Long> ABCD = map(new String[][] {{"a", "5"}, {"b", "3"}, {"c", "2"}, {"d", "2"}});
    static final Map<String, Long> WIDE = map(new String[][] {{"fast", "10"}, {"m3", "20"}, {"m2", "30"}, {"m1", "40"}, {"slow", "60"}});

    public static void main(String[] args) {
        t("LPT voi hoa thoi luong theo ten", () -> {
            List<List<String>> plan = Sharder.split(ABCD, 2);
            return plan.equals(Arrays.asList(Arrays.asList("a", "d"), Arrays.asList("b", "c")));
        });

        t("cùng thời lượng thì tên tăng dần đi trước", () -> {
            Map<String, Long> m = map(new String[][] {{"y", "5"}, {"x", "5"}, {"z", "1"}});
            List<List<String>> plan = Sharder.split(m, 2);
            eq(plan, Arrays.asList(Arrays.asList("x", "z"), Arrays.asList("y")));
            return Sharder.makespan(plan, m) == 6;
        });

        t("số shard được trả đúng bằng shards", () -> {
            List<List<String>> plan = Sharder.split(map(new String[][] {{"a", "10"}, {"b", "1"}}), 4);
            eq(plan.size(), 4);
            eq(plan, Arrays.asList(Arrays.asList("a"), Arrays.asList("b"), Arrays.asList(), Arrays.asList()));
            return Sharder.makespan(plan, map(new String[][] {{"a", "10"}, {"b", "1"}})) == 10;
        });

        t("ket qua khong ph thuoc thu tu them phan tu", () -> {
            Map<String, Long> one = map(new String[][] {{"slow", "60"}, {"m1", "40"}, {"m2", "30"}, {"m3", "20"}, {"fast", "10"}});
            Map<String, Long> two = map(new String[][] {{"fast", "10"}, {"m2", "30"}, {"slow", "60"}, {"m3", "20"}, {"m1", "40"}});
            eq(Sharder.split(one, 3), Sharder.split(two, 3));
            List<List<String>> plan = Sharder.split(two, 3);
            eq(plan.size(), 3);
            int sum = 0;
            for (List<String> s : plan) sum += s.size();
            eq(sum, 5);
            return Sharder.makespan(plan, one) == 60;
        });

        t("LPT thang cach chia deu theo so luong", () -> {
            List<List<String>> plan = Sharder.split(WIDE, 2);
            long best = Sharder.makespan(plan, WIDE);
            // chia theo so luong: 2 test dau vs 3 test sau -> 60+40=100
            eq(best, 80L);
            eq(Sharder.lowerBound(WIDE, 2), 80L);
            return best < 100;
        });

        t("lowerBound dung cong thuc max(ceil, lon nhat)", () -> {
            eq(Sharder.lowerBound(ABCD, 2), 6L);   // tong 12, ceil 6, max 5
            eq(Sharder.lowerBound(ABCD, 5), 5L);   // tong 12, ceil 3, max 5 -> 5
            eq(Sharder.lowerBound(map(new String[][] {{"a", "7"}}), 3), 7L);
            return Sharder.lowerBound(WIDE, 3) == 60;
        });

        t("makespan tinh ten la bang 0", () -> {
            List<List<String>> plan = new ArrayList<>();
            plan.add(new ArrayList<>(Arrays.asList("a", "unknown")));
            plan.add(new ArrayList<>(Arrays.asList("b")));
            eq(Sharder.makespan(plan, ABCD), 5L);
            eq(Sharder.makespan(new ArrayList<>(), ABCD), 0L);
            return Sharder.makespan(plan, null) == 0L;
        });

        t("không có test thì trả shards danh sách rỗng", () -> {
            List<List<String>> plan = Sharder.split(new LinkedHashMap<>(), 3);
            eq(plan.size(), 3);
            eq(Sharder.makespan(plan, new LinkedHashMap<>()), 0L);
            eq(Sharder.lowerBound(new LinkedHashMap<>(), 3), 0L);
            return plan.get(0).isEmpty() && plan.get(2).isEmpty();
        });

        t("map null không ném lỗi", () -> {
            List<List<String>> plan = Sharder.split(null, 2);
            eq(plan.size(), 2);
            eq(Sharder.lowerBound(null, 2), 0L);
            return Sharder.makespan(plan, null) == 0;
        });

        t("shards khong duong nem IllegalArgumentException", () -> {
            String a = "ok";
            try {
                Sharder.split(ABCD, 0);
                a = "khong nem";
            } catch (IllegalArgumentException e) {
                a = "iae";
            } catch (Exception e) {
                a = "sai loai";
            }
            String b = "ok";
            try {
                Sharder.lowerBound(ABCD, -2);
                b = "khong nem";
            } catch (IllegalArgumentException e) {
                b = "iae";
            } catch (Exception e) {
                b = "sai loai";
            }
            eq(a, "iae");
            return b.equals("iae");
        });

        t("giu thu tu gan vao trong tung shard", () -> {
            Map<String, Long> m = map(new String[][] {{"t4", "5"}, {"t3", "6"}, {"t2", "7"}, {"t1", "8"}});
            List<List<String>> plan = Sharder.split(m, 2);
            // t1->S0(8), t2->S1(7), t3->S1 vi 7 < 8 (13), t4->S0 vi 8 < 13 (13)
            eq(plan.get(0), Arrays.asList("t1", "t4"));
            eq(plan.get(1), Arrays.asList("t2", "t3"));
            eq(Sharder.makespan(plan, m), 13L);
            return Sharder.lowerBound(m, 2) == 13;
        });

        System.out.println("RESULT " + pass + "/" + total);
    }
}`,
      reference: `final class Sharder {
    static List<List<String>> split(Map<String, Long> durations, int shards) {
        if (shards <= 0) throw new IllegalArgumentException("shards phai lon hon 0");
        List<List<String>> plan = new ArrayList<>();
        long[] load = new long[shards];
        for (int i = 0; i < shards; i++) plan.add(new ArrayList<>());
        if (durations == null || durations.isEmpty()) return plan;

        List<String> names = new ArrayList<>(durations.keySet());
        names.sort((x, y) -> {
            int byTime = Long.compare(durations.get(y), durations.get(x));
            return byTime != 0 ? byTime : x.compareTo(y);
        });

        for (String name : names) {
            int lightest = 0;
            for (int i = 1; i < shards; i++) {
                if (load[i] < load[lightest]) lightest = i;
            }
            plan.get(lightest).add(name);
            load[lightest] += durations.get(name);
        }
        return plan;
    }

    static long makespan(List<List<String>> plan, Map<String, Long> durations) {
        long worst = 0;
        if (plan == null) return worst;
        for (List<String> shard : plan) {
            long sum = 0;
            for (String name : shard) {
                sum += durations == null ? 0L : durations.getOrDefault(name, 0L);
            }
            if (sum > worst) worst = sum;
        }
        return worst;
    }

    static long lowerBound(Map<String, Long> durations, int shards) {
        if (shards <= 0) throw new IllegalArgumentException("shards phai lon hon 0");
        if (durations == null || durations.isEmpty()) return 0;
        long sum = 0;
        long max = 0;
        for (Long d : durations.values()) {
            sum += d;
            if (d > max) max = d;
        }
        long even = (sum + shards - 1) / shards;
        return Math.max(max, even);
    }
}`,
      hints: [
        'Đổ key của map ra một {{List<String>}} rồi sort **một lần** bằng {{sort}} với comparator hai tầng (thời lượng giảm dần, rồi tên tăng dần). Mọi phần còn lại chỉ duyệt danh sách đã sort — nhờ đó kết quả không phụ thuộc thứ tự {{put}}.',
        'Giữ một mảng {{long[] load = new long[shards]}} để biết shard nào đang nhẹ nhất. Tìm min bằng vòng lặp từ index 1, chỉ đổi khi {{load[i] < load[lightest]}} (**nhỏ hơn chặt**) — dùng {{<=}} sẽ chọn index lớn nhất khi hoà, sai yêu cầu.',
        'Trả về đúng {{shards}} phần tử kể cả khi số test ít hơn: tạo danh sách rỗng ngay từ đầu, đừng chỉ tạo shard nào có test.',
        '{{lowerBound}} cần hai thành phần: test dài nhất không thể "cưa đôi" nên makespan ít nhất bằng nó; và trung bình mỗi shard phải gánh {{ceil(tong/shards)}}. Làm tròn lên bằng {{(sum + shards - 1) / shards}}, không dùng phép chia double.',
        'Kiểm tra null của {{durations}} ở **cả ba** hàm: CI có thể gọi {{lowerBound}} với suite chưa có dữ liệu thời lượng, và ném {{NullPointerException}} ở bước dựng pipeline thì cả team đứng chờ.',
      ],
      explain: `Hai quy tắc hoà làm nên tính xác định của thuật toán, và chúng không phải trang trí. **Hòa thời lượng thì theo tên**: vì hai test cùng 30 giây mà bạn để thứ tự duyệt map quyết định thì {{HashMap}} trên hai JVM khác nhau có thể cho hai thứ tự khác nhau, nghĩa là hai lần chạy CI chia shard khác nhau — bug flaky trở nên không tái hiện nổi. **Hòa tải thì theo index nhỏ nhất**: khi hai shard cùng rỗng (đầu thuật toán), nếu bạn dùng {{<=}} thì test đầu tiên rơi vào shard cuối, và bạn sẽ có {{shards - 1}} shard rỗng cộng một shard chứa hết.

Vì sao LPT mà không phải "chia đều tuyệt đối" (bài toán partition — NP-hard, cần DP/branch-and-bound)? Vì CI cần kết quả trong mili-giây và cần **dễ giải thích khi người khác đọc**. LPT greedy chỉ tốn O(n log n) và có bảo đảm cổ điển: makespan của nó không vượt quá 4/3 lần makespan tối ưu (với 2 máy là 7/6). Bạn gần như không bao giờ mất 30% vì cách chia; bạn mất 30% vì một test 90 giây nằm cùng shard với ba test 60 giây.

{{makespan}} là con số **duy nhất** đáng đưa lên dashboard khi bạn thêm máy: thêm shard mà makespan không giảm nghĩa là bạn đã chạm trần — hoặc vì một test quá dài, hoặc vì số shard đã vượt số test nặng. Đó là lý do bài này yêu cầu tính cả {{lowerBound}}: khoảng cách giữa makespan thực tế và cận dưới cho biết còn **bao nhiêu mét nữa** để ép. Trong ví dụ {{WIDE}}, cận dưới 80 bằng đúng kết quả LPT, nên mua thêm máy chỉ để chạy lâu hơn mà không nhanh hơn chút nào.

{{lowerBound(WIDE, 3)}} = 60 minh họa vế kia của biểu thức: khi một test quá dài so với trung bình, **cận dưới bị test đó quyết định**, và chia thêm shard vô ích. Bài học CI thật: 6 shard mà mỗi shard 20 phút vì shard nào cũng dính một test 18 phút — phải tách test, không phải thêm shard.

Lỗi phổ biến khi làm bài: (1) sort bằng {{Comparator.comparingLong(d -> d.get(name))}} trên {{entrySet}} mà quên nhánh hoà theo tên; (2) trả về số shard bằng {{min(shards, testCount)}} — sai yêu cầu "đúng {{shards}} phần tử"; (3) làm tròn {{Math.ceil((double) sum / shards)}} rồi quên rằng số thực lớn có thể lệch một đơn vị; (4) tính {{makespan}} bằng cách cộng dồn theo index của {{plan}} nhưng không xử lý tên lạ, nên một test bị xoá khỏi map vẫn còn trong plan cũ làm số phình to.`,
    },
  ],
  check: [
    {
      q: 'Suite 600 test chia 4 shard đều nhau về **số lượng** nhưng vẫn chạy 40 phút, trong khi mỗi shard trung bình 15 phút. Kết luận đúng nhất?',
      options: [
        'Cần thêm shard thứ 5',
        'Makespan bị quyết định bởi shard chứa các test nặng nhất — phải chia theo thời lượng lịch sử',
        'Cần tắt parallel trong từng shard',
        'Cần tăng timeout của Playwright',
      ],
      answer: 1,
      explain: 'Thời gian pipeline bằng thời gian của shard **chậm nhất**, không bằng trung bình. Chia theo số lượng bỏ qua việc test chênh nhau 20 lần về thời lượng. LPT theo dữ liệu {{time}} trong JUnit XML giải đúng bài toán; thêm shard khi đó chỉ tốn tiền CI mà không rút makespan.',
    },
    {
      q: 'Vì sao {{junit.jupiter.execution.parallel.mode.default = concurrent}} dễ làm vỡ suite UI test Playwright?',
      options: [
        'JUnit không hỗ trợ chạy song song nên cờ bị bỏ qua',
        'Nó cho phép các @Test trong cùng một class chạy trên nhiều thread; nếu class giữ Page/BrowserContext làm field thì nhiều thread cùng thao tác một đối tượng không thread-safe',
        'Nó buộc mọi test dùng chung một Browser',
        'Nó làm @BeforeEach không chạy nữa',
      ],
      answer: 1,
      explain: 'Playwright (và WebDriver) chỉ an toàn khi một page chỉ được một thread chạm. Chế độ concurrent biến field instance thành trạng thái chia sẻ giữa các thread. An toàn hơn: bật {{mode.classes.default = concurrent}} nhưng giữ {{mode.default = same_thread}}, hoặc cấp Page theo test qua extension/ThreadLocal và tạo Context mới cho mỗi test.',
    },
    {
      q: 'Image Docker {{mcr.microsoft.com/playwright/java}} nên được pin tag theo cách nào?',
      options: [
        'Dùng {{:latest}} để luôn có browser mới nhất',
        'Pin đúng version trùng với version artifact com.microsoft.playwright:playwright trong pom',
        'Chỉ cần pin tên hệ điều hành, ví dụ {{-noble}}',
        'Không cần pin, vì Playwright tự tải browser khi chạy test',
      ],
      answer: 1,
      explain: 'Playwright nhúng binary trình duyệt theo đúng version thư viện; image chứa browser cho một version cụ thể. Lệch version là lỗi "Executable doesn\'t exist". {{latest}} còn làm suite đổi hành vi giữa hai đêm mà không ai push gì. Cờ {{--with-deps}} (hoặc image có sẵn dep) giải quyết phần dependency hệ thống, còn version thì phải khớp.',
    },
    {
      q: 'Test nào sau đây **không nên** để chạy song song với các test khác?',
      options: [
        'Test mở trang chủ và kiểm tra banner',
        'Test gọi API danh mục sản phẩm chỉ để đọc',
        'Test xóa và tạo lại toàn bộ schema dữ liệu mẫu trong staging DB',
        'Test kiểm tra định dạng một hóa đơn PDF đã sinh ra',
      ],
      answer: 2,
      explain: 'Seed/reset schema là tài nguyên chia sẻ: trong khi test đó đang xóa bảng, mọi test khác đọc cùng DB sẽ fail vô nghĩa. JUnit 5 giải quyết bằng {{@ResourceLock("shared-db")}} để nhóm này chạy lần lượt, thay vì tắt parallel cho cả suite.',
    },
  ],
  related: ['autotest-017', 'autotest-014', 'autotest-019', 'autotest-009'],
  tags: ['parallel', 'JUnit 5 parallel', 'sharding', 'LPT', 'makespan', 'Docker', 'mcr.microsoft.com', 'GitHub Actions', 'Jenkins', 'Selenium Grid', 'CI'],
},
{
  id: 'lesson-autotest-011',
  track: 'autotest',
  order: 11,
  title: 'Flaky test: phát hiện từ lịch sử chạy, cách ly đúng cách, và sửa tận gốc',
  level: 'senior',
  minutes: 45,
  goals: [
    'Định nghĩa flaky một cách kiểm chứng được và phân biệt với regression thật',
    'Vì sao rerun-on-fail làm giảm niềm tin vào cả suite, tính được xác suất nó nuốt lỗi',
    'Phát hiện flaky từ dữ liệu (test, commit, kết quả) bằng quy tắc "cùng commit mà vừa pass vừa fail"',
    'Đo flaky rate, đề xuất quarantine có ngưỡng, và đặt chủ sở hữu + ngày hết hạn cho test bị cách ly',
    'Chạy quy trình 6 bước để sửa gốc, không phải để né',
  ],
  body: `**Tóm tắt:** **Flaky test** (test "chập chờn") là test cho kết quả **khác nhau giữa hai lần chạy mà không có gì thay đổi** — cùng code, cùng commit, cùng môi trường. Cách phát hiện đáng tin nhất không phải là "ngồi chạy lại cho xem", mà là đọc lịch sử chạy: test nào **trên cùng một commit** vừa có lần pass vừa có lần fail thì chắc chắn flaky, vì code không đổi. Cách sửa đúng là tìm **nguồn bất định** (time, thứ tự, dữ liệu chung, môi trường, chính ứng dụng) và loại bỏ nó. Retry tự động không sửa gì cả — nó chỉ biến "đỏ một lần" thành "xanh ngay", và khi code có bug thật thì nó cũng nuốt luôn bug đó.

### Ba loại đỏ, đừng gộp làm một
| Loại | Dấu hiệu | Hành động |
|---|---|---|
| **Bug thật (regression)** | fail **ổn định** từ commit X trở đi, trước commit đó pass | mở ticket, block merge |
| **Test sai (test defect)** | fail ổn định nhưng kỳ vọng sai (đổi yêu cầu, đổi thông điệp) | sửa test |
| **Flaky** | fail **không ổn định** trên cùng commit | cách ly + sửa gốc |

Nỗi nguy hiểm của flaky nằm ở chỗ nó **cạnh tranh** với hai loại trên khi bạn nhìn vào CI: pipeline đỏ, người ta bảo "flaky đấy, retry đi", và bug thật bị retry nuốt. Đây là lý do flaky được nhiều tài liệu QA xếp vào nhóm "lỗi kỹ thuật" phải trả dần, chứ không phải "sự cố nhỏ".

### Nguồn gốc: liệt kê để chẩn đoán nhanh
**1. Thời gian và chờ đợi.** Chờ kiểu {{Thread.sleep(2000)}} rồi assert: máy CI chậm hơn máy bạn. Chờ điều kiện **không bao giờ xảy ra** (CSS animation, WebSocket chưa kịp đẩy dữ liệu). Đồng hồ: test sinh báo cáo "ngày 31/2", test chạy lúc 23:59:59.9, test "sắp hết hạn sau 7 ngày" chạy qua midnight, hoặc CI chạy UTC còn bạn chạy UTC+7 — loại bug chỉ nổ ra vào ban đêm theo giờ Việt Nam.

**2. Thứ tự và phụ thuộc trạng thái.** Test A đăng nhập rồi để nguyên tab đó; test B assume đã đăng nhập. Chạy tuần tự xanh, chạy random-order đỏ. JUnit 5 mặc định sắp method theo {{MethodOrderer}} nào đó **không phải thứ tự viết code**, nên loại bug này thỉnh thoảng tự "hết" — càng nguy hiểm.

**3. Dữ liệu dùng chung.** Hai worker cùng dùng tài khoản "qa@example.com" và cùng đổi mật khẩu; cùng một voucher chỉ dùng được một lần; test "danh sách phải có đúng 10 bản ghi" trong khi DB staging có người đang thao tác; dữ liệu seed bị một test khác dọn mất.

**4. Môi trường và hạ tầng.** Shared database (deadlock, connection pool hết), rate limit API bên thứ ba khi suite đánh 200 req/s, DNS trong container, disk hết vì video/screenshot, {{/dev/shm}} 64 MB làm Chromium crash, một service phụ thuộc đang restart trong lúc chạy nightly.

**5. Chính ứng dụng bất định.** UUID/order id hiện trên UI rồi assert chuỗi đó, kết quả tìm kiếm không có thứ tự ổn định, cache TTL, eventual consistency sau khi ghi (read replica chưa kịp đồng bộ), số liệu chứng khoán tỉ giá thay đổi từng phút.

**6. Test tự gây bất định.** {{new Random()}} không seed, duyệt {{HashMap}} rồi so với danh sách cứng, {{Instant.now()}} hai lần khác nhau, string locale-dependent ({{toLowerCase}} với tiếng Thổ).

### Vì sao rerun-on-fail là con dao hai lưỡi
TestNG có {{IRetryAnalyzer}}, JUnit 5 có extension tự viết (hoặc thư viện bên thứ ba như {{@RetryingTest}} của JUnit Pioneer), Playwright (bản Node) có {{retries}} trong config. Ai cũng bật vì nó làm CI "xanh trở lại" ngay lập tức. Hãy tính bằng số: test có **20%** xác suất fail, retry 2 lần (tối đa 3 nỗ lực). Xác suất nó **vẫn đỏ** = 0.2³ = 0.8%. Suite 500 test, trong đó 10 test flaky như vậy → xác suất để **cả 10** cùng xanh là 0.992¹⁰ ≈ 92%. Nói cách khác, mỗi đêm CI xanh với xác suất cao, và người ta quên mất 10 test đó đang hỏng.

Vấn đề không phải tốn thời gian (retry làm test chậm nhất chạy 3 lần, và nó thường nằm đúng ở chỗ đắt nhất). Vấn đề là **tín hiệu**: khi flaky rate tăng, mọi người bắt đầu retry **cả test đỏ vì bug thật**, rồi bấm merge. Quy tắc lành mạnh:
- retry **có**, nhưng với số lần nhỏ (1), chỉ cho nhóm test được liệt kê (tag), và **mỗi lần retry phải được ghi vào log** để bạn đếm được;
- kết quả cuối cùng của test retry thành công phải hiển thị là "passed after retry" (màu vàng), **không phải màu xanh**;
- test retry quá 3 đêm liên tiếp thì tự động bị cách ly, có issue và có chủ.

### Phát hiện bằng dữ liệu: quy tắc "cùng commit"
Đây là phần bài tập mô phỏng. Với mỗi cặp (test, commit), gom số lần pass và số lần fail. Commit nào có **cả hai** nghĩa là code không đổi mà kết quả đổi → flaky, không còn giải thích nào khác. Ngược lại, test fail trên commit mới và pass trên commit cũ là **regression**, đừng vội gán nhãn flaky.

~~~text
LoginTest  c1: pass pass fail   <- cung commit co ca pass lan fail  -> FLAKY
PayTest    c1: fail  c2: fail   <- fail deu, code doi                       -> bug that
CartTest   c1: pass  c2: fail   <- pass roi fail deu theo commit             -> regression
OtpTest    c1: fail pass        <- FLAKY, va CI mau xanh vi retry
~~~

Hai con số tối thiểu nên đưa lên dashboard: **flaky rate** của một test = (số commit có kết quả lẫn lộn) / (số commit test đó đã chạy), và **flaky rate của suite** = số lần chạy đỏ do flaky / tổng số run. Ngưỡng cách ly hợp lý thường là rate ≥ 0.2–0.5 **và** test phải có đủ số commit (≥ 2–3) để kết luận không phải tình cờ một lần.

### Cách ly (quarantine) đúng cách
Cách ly **không phải** là {{@Disabled}} rồi quên. Khuôn đang chạy tốt ở nhiều team:

1. Gắn **tag** ({{@Tag("quarantine")}} / group TestNG), không xóa test: suite PR bỏ qua tag này, nhưng **nightly vẫn chạy** để thu thập dữ liệu.
2. Mỗi test cách ly phải có **issue + chủ sở hữu + ngày hết hạn** (2 tuần). Không có chủ thì quarantine thành nghĩa địa.
3. Dashboard hiện **danh sách đang cách ly và tuổi của nó** — chỉ số này phải giảm theo thời gian, nếu tăng thì chiến lược sai.
4. Test cách ly **không được chặn merge**, nhưng phải hiện vàng trong report để không ai tưởng nó xanh.
5. Số lượng cách ly vượt ~3% tổng suite thì dừng thêm tính năng, dành sprint trả nợ.

~~~seq
title: Luồng xử lý test đỏ trong CI
actors: CI | Detector | Owner | Board
CI -> Detector: gửi lịch sử chạy test từng commit
Detector -> Detector: tim cung commit ma vua pass vua fail
Detector -> Board: cap nhat flaky rate va danh sach cach ly
Board -> Owner: phat issue khi vuot nguong
Owner -> CI: sua goc roi bo tag quarantine
note CI..Detector: không có history thì không phân biệt được flaky/regression
~~~

### Quy trình sửa tận gốc (6 bước)
1. **Tái hiện có kiểm soát**: chạy 30–50 lần liên tiếp bằng {{@RepeatedTest(50)}} (JUnit 5) hoặc {{invocationCount}} (TestNG), ghi lại log từng lần. Không tái hiện được 1/50 thì đừng sửa mò.
2. **Loại biến số song song**: chạy lại với parallel=1. Nếu hết đỏ → race/chia sẻ trạng thái (về bài 009-010), không phải lỗi chờ đợi.
3. **Đồng bộ hoá thời gian trong test**: thay {{LocalDate.now()}} bằng một {{Clock}} tiêm vào ({{Clock.fixed(...)}}), hoặc với UI thì assert **bất biến** thay vì giá trị tuyệt đối ("cột ngày không rỗng" thay vì "bằng 05/11/2026").
4. **Thay chờ bằng điều kiện**: bỏ mọi {{sleep}}; dùng Playwright web-first assertion ({{assertThat(locator).hasText(...)}} tự poll tới timeout) hoặc chờ **network idle/chuẩn bị xong dữ liệu** một cách tường minh. Ngồi chờ là đoán, còn chờ điều kiện là biết.
5. **Dữ liệu riêng cho mỗi run**: sinh khóa độc nhất ({{"qa-" + UUID.randomUUID()}}), tự dọn dẹp sau test, và **không assert số lượng tuyệt đối** trên môi trường chia sẻ — hãy assert cái của mình (lọc theo khóa vừa tạo).
6. **Seed tính bất định của test**: nếu test cần ngẫu nhiên, seed bằng một số cố định lấy từ biến môi trường và in seed ra log để tái hiện đúng lần chạy đó.

Nếu sau 6 bước mà vẫn đỏ lẻ tẻ thì gần chắc nguyên nhân ở **ứng dụng hoặc hạ tầng**: hãy mở ticket cho dev với bằng chứng (trace, log, hai lần chạy cạnh nhau) — flaky của ứng dụng không phải việc của QA sửa trong test.

### Bốn lỗi hay gặp
- **Xóa test cho CI xanh**: nhanh nhất, tệ nhất; suite mất độ phủ và không ai biết.
- **Retry ở tầng page object**: retry một thao tác click nghĩa là bạn có thể đã bấm nút "Gửi" hai lần → đơn hàng nhân đôi. Chỉ retry thao tác **idempotent** (đọc), và retry ở tầng runner.
- **Tăng timeout lên 60 giây**: flaky biến thành test chậm. Bạn vừa mua sự ổn định bằng 40 phút CI mỗi đêm.
- **Đổ cho "CI không ổn định"**: không đo thì không biết; flaky rate theo team/màu/commit thường chỉ ra một service hoặc một nhóm test cụ thể.

### Liên hệ phỏng vấn
- "Bạn xử lý flaky test thế nào?" → đừng trả lời "retry". Trả lời: (1) phân loại bằng dữ liệu lịch sử, (2) cách ly có chủ và có ngày hết hạn, (3) quy trình chẩn đoán 6 bước, (4) đo flaky rate hằng tuần và coi nó là nợ kỹ thuật.
- "Test của bạn đỏ, CI report không giúp gì, làm sao?" → kể việc chụp **hai lần chạy cạnh nhau** (commit, thời điểm, log, trace) và loại dần biến số (parallel, dữ liệu, đồng hồ).
- "Flaky rate bao nhiêu là chấp nhận được?" → câu trả lời tốt có số và có lý do: dưới 0.5–1% run với suite chặn merge; trên 3% là dừng tính năng để trả nợ.
- Khi nào retry là **hợp lý**? → khi bạn biết chắc nguồn bất định nằm ở hạ tầng bên ngoài (network chập chờn tới API đối tác), và retry có log + có trần số lần.

> Senior tip: chỉ số nên đưa ra trong buổi review chất lượng không phải "số test pass" mà là **defect escape + flaky rate + thời gian trung bình từ lúc test đỏ tới lúc được sửa**. Một suite 1.200 test xanh 99% nhưng flaky 5% mỗi tuần thì vô dụng hơn suite 300 test xanh 100% và có dữ liệu thời lượng để shard. Và một mẹo rẻ mà hiệu quả: bật CI ở chế độ **random order** ({{junit.jupiter.testmethod.order.default = org.junit.jupiter.api.MethodOrderer$Random}}, in seed ra log) — nó sẽ lôi ra mọi test đang ẩn nấp sau lưng test khác trước khi chúng vào production.`,
  exercises: [
    {
      title: 'FlakyDetector: tìm test lẫn lộn kết quả trên cùng commit, tính rate và đề xuất cách ly',
      prompt: `Viết {{FlakyDetector}} làm đúng việc mà CI cần: đọc lịch sử chạy và chỉ ra test nào flaky, test nào là regression, test nào nên cách ly. **Không đọc thời gian thực, không random, không song song.** Mỗi lần chạy của một test là một object {{Run}}.

**1) Lớp {{Run}}** (chỉ chứa dữ liệu):
- constructor {{Run(String test, String commit, boolean pass)}}.
- getter {{test()}}, {{commit()}}, {{pass()}} (kiểu {{String}}, {{String}}, {{boolean}}).

**2) Các hàm tĩnh trong {{FlakyDetector}}** — "lẫn lộn trên cùng commit" là định nghĩa cốt lõi của tất cả:
- {{static Set<String> flaky(List<Run> runs)}}: những test tồn tại **ít nhất một commit** mà trên commit đó test vừa có lần pass vừa có lần fail. Thứ tự không quan trọng.
- {{static Map<String, Integer> commitCount(List<Run> runs)}}: với **mọi** test xuất hiện trong {{runs}}, số commit **phân biệt** mà test đó đã chạy.
- {{static Map<String, Double> rate(List<Run> runs)}}: với mọi test, {{(số commit lẫn lộn) / (số commit phân biệt)}} theo phép chia số thực. Test chưa từng lẫn lộn → {{0.0}}.
- {{static List<String> quarantine(List<Run> runs, double minRate, int minCommits)}}: các test có {{rate >= minRate}} **và** {{commitCount >= minCommits}} (ngưỡng bao gồm giá trị bằng). Sắp theo **rate giảm dần**, hoà rate thì **tên tăng dần**.
- {{static List<String> regressions(List<Run> runs)}}: các test mà (a) trên **commit cuối cùng** mà test đó xuất hiện — "cuối cùng" hiểu theo **thứ tự xuất hiện lần đầu của commit trong danh sách** {{runs}} — **mọi** lần chạy đều fail, và (b) tồn tại ít nhất một commit trước đó mà test có ít nhất một lần pass. Trả danh sách tên theo thứ tự tăng dần. Đây chính là test "đỏ đều từ một commit trở đi", tức là bug thật chứ không phải flaky.
- Danh sách {{runs}} bằng {{null}} hoặc rỗng: mọi hàm trả kết quả rỗng (Set/Map rỗng, danh sách rỗng), **không ném exception**. {{minCommits <= 0}}: coi như {{1}}.

Ví dụ với dữ liệu:

~~~text
LoginTest c1: pass pass fail   -> c1 lan lon  |  1/2 commit  -> rate 0.5   FLAKY
PayTest   c1 fail c2 fail c3 fail             -> rate 0.0   không flaky, không regression (chưa từng pass)
CartTest  c1 pass c2 pass c3 fail             -> rate 0.0   -> REGRESSION (commit cuoi fail het, tung pass o commit truoc)
SearchTest c1: pass+fail  c2: fail+pass  c3 pass  c4 pass   -> 2/4 = 0.5   FLAKY
OtpTest    c1: fail pass                     -> 1/1 = 1.0   FLAKY
AddrTest   c1: pass fail   c2: fail pass     -> 2/2 = 1.0   FLAKY
~~~

Với ngưỡng {{minRate = 0.5}}, {{minCommits = 2}} thì kết quả cách ly là {{[AddrTest, LoginTest, SearchTest]}} ({{OtpTest}} bị loại vì mới chạy 1 commit — một lần lẫn lộn chưa đủ để kết luận).

Bẫy: (a) nếu bạn tính "fail ở commit này, pass ở commit khác" thì bạn đang đếm **regression** như flaky, và team sẽ đổ oan cho một bug thật; (b) nếu bạn lấy commit cuối theo thứ tự alphabet thay vì theo thứ tự xuất hiện trong lịch sử thì với dữ liệu CI thật (commit hash) kết quả hoàn toàn vô nghĩa.`,
      starter: `final class Run {
    private final String test;
    private final String commit;
    private final boolean pass;

    Run(String test, String commit, boolean pass) {
        this.test = test;
        this.commit = commit;
        this.pass = pass;
    }

    String test() {
        return test;
    }

    String commit() {
        throw new UnsupportedOperationException("TODO");
    }

    boolean pass() {
        throw new UnsupportedOperationException("TODO");
    }
}

final class FlakyDetector {
    static Set<String> flaky(List<Run> runs) {
        throw new UnsupportedOperationException("TODO");
    }

    static Map<String, Integer> commitCount(List<Run> runs) {
        throw new UnsupportedOperationException("TODO");
    }

    static Map<String, Double> rate(List<Run> runs) {
        throw new UnsupportedOperationException("TODO");
    }

    static List<String> quarantine(List<Run> runs, double minRate, int minCommits) {
        throw new UnsupportedOperationException("TODO");
    }

    static List<String> regressions(List<Run> runs) {
        throw new UnsupportedOperationException("TODO");
    }
}`,
      tests: `public class Main {
    interface Body { boolean get() throws Exception; }

    static int pass = 0, total = 0;

    static void t(String name, Body b) {
        total++;
        try {
            if (b.get()) { pass++; System.out.println("PASS " + name); }
            else System.out.println("FAIL " + name + ": tra ve false");
        } catch (Throwable e) {
            System.out.println("FAIL " + name + ": " + e);
        }
    }

    static void eq(Object actual, Object expected) {
        if (!Objects.equals(actual, expected)) {
            throw new AssertionError("expected " + expected + " but was " + actual);
        }
    }

    static List<Run> fx() {
        List<Run> r = new ArrayList<>();
        r.add(new Run("LoginTest", "c1", true));
        r.add(new Run("LoginTest", "c1", true));
        r.add(new Run("LoginTest", "c1", false));
        r.add(new Run("LoginTest", "c2", true));
        r.add(new Run("PayTest", "c1", false));
        r.add(new Run("PayTest", "c2", false));
        r.add(new Run("PayTest", "c3", false));
        r.add(new Run("CartTest", "c1", true));
        r.add(new Run("CartTest", "c2", true));
        r.add(new Run("CartTest", "c3", false));
        r.add(new Run("SearchTest", "c1", true));
        r.add(new Run("SearchTest", "c1", false));
        r.add(new Run("SearchTest", "c2", false));
        r.add(new Run("SearchTest", "c2", true));
        r.add(new Run("SearchTest", "c3", true));
        r.add(new Run("SearchTest", "c4", true));
        r.add(new Run("OtpTest", "c1", false));
        r.add(new Run("OtpTest", "c1", true));
        r.add(new Run("AddrTest", "c1", true));
        r.add(new Run("AddrTest", "c1", false));
        r.add(new Run("AddrTest", "c2", false));
        r.add(new Run("AddrTest", "c2", true));
        return r;
    }

    public static void main(String[] args) {
        t("lan lon tren cung commit bi go ten la flaky", () -> {
            Set<String> f = FlakyDetector.flaky(fx());
            eq(f.size(), 4);
            eq(f.contains("LoginTest"), true);
            eq(f.contains("SearchTest"), true);
            eq(f.contains("OtpTest"), true);
            eq(f.contains("AddrTest"), true);
            return !f.contains("CartTest");
        });

        t("fail đều trên mọi commit không phải flaky", () -> {
            Set<String> f = FlakyDetector.flaky(fx());
            eq(f.contains("PayTest"), false);
            eq(FlakyDetector.rate(fx()).get("PayTest"), 0.0);
            eq(FlakyDetector.commitCount(fx()).get("PayTest"), 3);
            return !FlakyDetector.regressions(fx()).contains("PayTest");
        });

        t("pass rồi fail theo commit là regression không phải flaky", () -> {
            List<Run> r = Arrays.asList(new Run("X", "c1", true), new Run("X", "c2", false));
            eq(FlakyDetector.flaky(r).isEmpty(), true);
            eq(FlakyDetector.regressions(r), Arrays.asList("X"));
            eq(FlakyDetector.rate(r).get("X"), 0.0);
            eq(FlakyDetector.commitCount(r).get("X"), 2);
            return FlakyDetector.quarantine(r, 0.5, 1).isEmpty();
        });

        t("rate la so commit lan lon chia so commit", () -> {
            Map<String, Double> m = FlakyDetector.rate(fx());
            eq(m.get("LoginTest"), 0.5);
            eq(m.get("SearchTest"), 0.5);
            eq(m.get("OtpTest"), 1.0);
            eq(m.get("AddrTest"), 1.0);
            eq(m.get("CartTest"), 0.0);
            eq(m.size(), 6);
            return true;
        });

        t("quarantine dung nguong va thu tu", () -> {
            eq(FlakyDetector.quarantine(fx(), 0.5, 2), Arrays.asList("AddrTest", "LoginTest", "SearchTest"));
            eq(FlakyDetector.quarantine(fx(), 1.0, 1), Arrays.asList("AddrTest", "OtpTest"));
            eq(FlakyDetector.quarantine(fx(), 0.51, 2), Arrays.asList("AddrTest"));
            return FlakyDetector.quarantine(fx(), 0.0, 99).isEmpty();
        });

        t("minCommits chặn test mới chạy một lần", () -> {
            eq(FlakyDetector.quarantine(fx(), 0.5, 1).contains("OtpTest"), true);
            eq(FlakyDetector.quarantine(fx(), 0.5, 2).contains("OtpTest"), false);
            return FlakyDetector.quarantine(fx(), 0.5, 3).equals(Arrays.asList("SearchTest"));
        });

        t("regressions chi lay commit cuoi theo thu tu lich su", () -> {
            List<Run> up = Arrays.asList(
                    new Run("A", "c1", true), new Run("A", "c2", false), new Run("A", "c2", false),
                    new Run("B", "c1", false), new Run("B", "c2", true));
            eq(FlakyDetector.regressions(up), Arrays.asList("A"));
            eq(FlakyDetector.flaky(up).isEmpty(), true);
            List<Run> mixed = Arrays.asList(new Run("C", "c1", true), new Run("C", "c1", false), new Run("C", "c2", false));
            eq(FlakyDetector.flaky(mixed).contains("C"), true);
            eq(FlakyDetector.regressions(mixed), Arrays.asList("C"));
            return FlakyDetector.quarantine(mixed, 0.5, 1).equals(Arrays.asList("C"));
        });

        t("rerun che giau van bi phat hien", () -> {
            List<Run> r = Arrays.asList(
                    new Run("X", "c1", false), new Run("X", "c1", true),
                    new Run("X", "c2", false), new Run("X", "c2", true));
            eq(FlakyDetector.flaky(r).contains("X"), true);
            eq(FlakyDetector.rate(r).get("X"), 1.0);
            eq(FlakyDetector.regressions(r).isEmpty(), true);
            return FlakyDetector.quarantine(r, 0.5, 2).equals(Arrays.asList("X"));
        });

        t("test chỉ chạy một lần chưa đủ để kết luận", () -> {
            List<Run> r = Arrays.asList(new Run("Solo", "c1", true));
            eq(FlakyDetector.flaky(r).isEmpty(), true);
            eq(FlakyDetector.rate(r).get("Solo"), 0.0);
            eq(FlakyDetector.commitCount(r).get("Solo"), 1);
            return FlakyDetector.quarantine(r, 0.5, 1).isEmpty();
        });

        t("danh sách rỗng và null không ném lỗi", () -> {
            eq(FlakyDetector.flaky(new ArrayList<>()).isEmpty(), true);
            eq(FlakyDetector.rate(new ArrayList<>()).isEmpty(), true);
            eq(FlakyDetector.commitCount(new ArrayList<>()).isEmpty(), true);
            eq(FlakyDetector.quarantine(new ArrayList<>(), 0.1, 1).isEmpty(), true);
            eq(FlakyDetector.regressions(new ArrayList<>()).isEmpty(), true);
            eq(FlakyDetector.flaky(null).isEmpty(), true);
            eq(FlakyDetector.rate(null).isEmpty(), true);
            eq(FlakyDetector.quarantine(null, 0.5, 2).isEmpty(), true);
            eq(FlakyDetector.regressions(null).isEmpty(), true);
            return FlakyDetector.commitCount(null).isEmpty();
        });

        t("minCommits am duoc coi nhu 1", () -> {
            List<Run> r = Arrays.asList(new Run("Y", "c1", true), new Run("Y", "c1", false));
            eq(FlakyDetector.quarantine(r, 0.5, 0), Arrays.asList("Y"));
            return FlakyDetector.quarantine(r, 0.5, -3).equals(Arrays.asList("Y"));
        });

        System.out.println("RESULT " + pass + "/" + total);
    }
}`,
      reference: `final class Run {
    private final String test;
    private final String commit;
    private final boolean pass;

    Run(String test, String commit, boolean pass) {
        this.test = test;
        this.commit = commit;
        this.pass = pass;
    }

    String test() {
        return test;
    }

    String commit() {
        return commit;
    }

    boolean pass() {
        return pass;
    }
}

final class FlakyDetector {
    private static final int PASS = 0;
    private static final int FAIL = 1;

    // test -> commit -> [so lan pass, so lan fail]; LinkedHashMap giu thu tu xuat hien
    private static Map<String, Map<String, int[]>> index(List<Run> runs) {
        Map<String, Map<String, int[]>> by = new LinkedHashMap<>();
        if (runs == null) return by;
        for (Run r : runs) {
            if (r == null || r.test() == null || r.commit() == null) continue;
            Map<String, int[]> commits = by.computeIfAbsent(r.test(), k -> new LinkedHashMap<>());
            int[] cell = commits.computeIfAbsent(r.commit(), k -> new int[2]);
            cell[r.pass() ? PASS : FAIL]++;
        }
        return by;
    }

    private static int mixed(Map<String, int[]> commits) {
        int n = 0;
        for (int[] cell : commits.values()) {
            if (cell[PASS] > 0 && cell[FAIL] > 0) n++;
        }
        return n;
    }

    static Set<String> flaky(List<Run> runs) {
        Set<String> out = new LinkedHashSet<>();
        for (Map.Entry<String, Map<String, int[]>> e : index(runs).entrySet()) {
            if (mixed(e.getValue()) > 0) out.add(e.getKey());
        }
        return out;
    }

    static Map<String, Integer> commitCount(List<Run> runs) {
        Map<String, Integer> out = new LinkedHashMap<>();
        for (Map.Entry<String, Map<String, int[]>> e : index(runs).entrySet()) {
            out.put(e.getKey(), e.getValue().size());
        }
        return out;
    }

    static Map<String, Double> rate(List<Run> runs) {
        Map<String, Double> out = new LinkedHashMap<>();
        for (Map.Entry<String, Map<String, int[]>> e : index(runs).entrySet()) {
            int commits = e.getValue().size();
            out.put(e.getKey(), commits == 0 ? 0.0 : (double) mixed(e.getValue()) / commits);
        }
        return out;
    }

    static List<String> quarantine(List<Run> runs, double minRate, int minCommits) {
        Map<String, Double> rates = rate(runs);
        Map<String, Integer> counts = commitCount(runs);
        int floor = Math.max(1, minCommits);
        List<String> out = new ArrayList<>();
        for (String test : rates.keySet()) {
            if (rates.get(test) >= minRate && counts.get(test) >= floor) out.add(test);
        }
        out.sort((x, y) -> {
            int byRate = Double.compare(rates.get(y), rates.get(x));
            return byRate != 0 ? byRate : x.compareTo(y);
        });
        return out;
    }

    static List<String> regressions(List<Run> runs) {
        List<String> out = new ArrayList<>();
        for (Map.Entry<String, Map<String, int[]>> e : index(runs).entrySet()) {
            List<int[]> cells = new ArrayList<>(e.getValue().values());
            if (cells.size() < 2) continue;
            int[] last = cells.get(cells.size() - 1);
            if (last[PASS] > 0 || last[FAIL] == 0) continue;
            boolean passedBefore = false;
            for (int i = 0; i < cells.size() - 1; i++) {
                if (cells.get(i)[PASS] > 0) {
                    passedBefore = true;
                    break;
                }
            }
            if (passedBefore) out.add(e.getKey());
        }
        out.sort(Comparator.naturalOrder());
        return out;
    }
}`,
      hints: [
        'Xây một lần rồi dùng lại: một hàm riêng trả về cấu trúc {{Map<String, Map<String, int[]>>}} (test → commit → mảng [số lần pass, số lần fail]). Dùng {{LinkedHashMap}} ở cả hai tầng để giữ thứ tự xuất hiện — thứ tự này chính là định nghĩa "commit cuối" của {{regressions}}.',
        '{{computeIfAbsent}} giúp gọn: {{by.computeIfAbsent(test, k -> new LinkedHashMap<>()).computeIfAbsent(commit, k -> new int[2])}} rồi tăng {{cell[0]}} hoặc {{cell[1]}}. Nhớ {{runs == null}} trả map rỗng để mọi hàm khác không phải lo.',
        'Flaky và rate cùng chung một phép đếm: số commit mà **cả hai ô đều > 0**. Viết một hàm private đếm số commit lẫn lộn rồi dùng cho cả {{flaky}} lẫn {{rate}} — đừng tính hai lần theo hai cách khác nhau.',
        '{{rate}} là phép chia số thực: ép kiểu {{(double) mixed / commits}}, nếu không {{int/int}} sẽ làm tròn thành 0 và mọi ngưỡng cách ly đều không bao giờ kích hoạt.',
        '{{quarantine}} sắp bằng comparator hai tầng ({{Double.compare(rateY, rateX)}} rồi {{x.compareTo(y)}}) — nhớ lấy rate từ map đã tính sẵn, đừng gọi lại hàm đếm trong comparator vì sẽ thành O(n² log n).',
        '{{regressions}}: lấy {{List<int[]>>}} các ô theo thứ tự; cần {{cells.size() >= 2}}, ô cuối có {{pass == 0 && fail > 0}}, và **một trong các ô trước đó** có {{pass > 0}}. Thiếu điều kiện cuối thì test chưa từng pass (bug ngay từ đầu) sẽ bị gọi là regression.',
      ],
      explain: `Toàn bộ bài này xoay một phép đếm: **trong cùng một commit, test có cả hai kết quả không?** Vì {{commit}} là đơn vị mà code không đổi, nên hai kết quả khác nhau trên cùng commit loại trừ mọi giải thích kiểu "chắc do code mới". Đó là định nghĩa kiểm chứng được của flaky, và nó giải thích tại sao bạn **cần lịch sử chạy nhiều lần** — một lần chạy chỉ cho bạn đỏ hoặc xanh, không cho bạn biết test đó đỏ bao nhiêu phần trăm.

{{LinkedHashMap}} ở hai tầng là chi tiết có chủ đích, không phải thói quen. Nó giữ **thứ tự xuất hiện lần đầu** của commit, nên "{{commit}} cuối cùng" trong {{regressions}} có nghĩa đúng như cách CI nhìn: lần chạy gần đây nhất. Nếu dùng {{HashMap}}, thứ tự trở nên tùy tiện và kết luận "test này dạo này hỏng" sẽ sai — mà sai trên dữ liệu thì còn nguy hiểm hơn là không có dữ liệu. Nếu bạn có timestamp thật, hãy sort theo nó; ở đây ta dùng đúng thứ tự trong danh sách vì đề bài không cho thời gian.

{{regressions}} có hai điều kiện mà người làm bài hay bỏ một. Điều kiện "commit cuối fail hết" bắt được cả PayTest (chưa bao giờ pass) — nhưng PayTest không phải regression, nó là test hỏng từ đầu hoặc tính năng chưa xong. Điều kiện "từng pass ở commit trước" mới tạo ra câu nói có giá trị với dev: "trước commit X cái này còn chạy được". Trong hoạt động thật đây chính là bằng chứng bạn dán vào ticket, và là lý do người ta sửa nhanh hơn.

Ngưỡng **hai chiều** ({{minRate}} **và** {{minCommits}}) là chỗ thể hiện kinh nghiệm. Một test mới chạy một commit, fail rồi pass sau retry, rate = 1.0 — nghe rất nặng, nhưng một mẫu thì chưa là gì: có thể là đợt deploy dở, có thể là CI vừa mất điện. Bắt {{minCommits >= 2}} (thực tế thường 3) khiến danh sách cách ly chỉ gồm những test đã **chứng minh** sự bất định nhiều lần. Xem lại dữ liệu bài toán mà {{minCommits = 3}}: {{OtpTest}} bị loại vì mới chạy 1 commit, {{AddrTest}} và {{LoginTest}} bị loại vì mới có 2 commit dù rate của {{AddrTest}} là 1.0, và chỉ còn {{SearchTest}} — 4 commit, trong đó 2 commit lẫn lộn, rate đúng 0.5 nên vẫn qua {{minRate}}. Một ngưỡng duy nhất sẽ cho bạn danh sách sai người.

Ở {{rate}} còn một bài học kiểu Java: {{mixed / commits}} với hai số nguyên cho ra {{0}}, và danh sách cách ly **luôn rỗng** — bug này cực khó thấy vì không ai ném lỗi, suite chỉ đơn giản là không bao giờ cách ly gì. {{(double)}} ở tử số là thuốc đặc trị.

Lỗi hay gặp khác: (1) so {{Double}} bằng {{==}} với giá trị sinh ra từ phép chia không chính xác — với ngưỡng {{0.5}} thì an toàn vì 0.5 biểu diễn đúng trong hệ nhị phân, nhưng nếu dữ liệu của bạn cho ra {{1.0/3}} thì phải so bằng {{Math.abs(a - b) < 1e-9}}; (2) coi {{Run}} có field {{null}} là hợp lệ, để {{computeIfAbsent(null, ...)}} âm thầm gom mọi run lạ vào cùng một nhóm; (3) đếm "commit lẫn lộn" bằng phép **trừ** hai tập (tập commit có pass trừ tập commit có fail) — phải là **giao** hai tập, vì một test pass ở c1 và fail ở c2 sẽ bị phép trừ coi là lẫn lộn dù không commit nào có hai kết quả.`,
    },
  ],
  check: [
    {
      q: 'Bằng chứng nào kết luận một test là flaky mà không cần chạy lại?',
      options: [
        'Test fail trên CI nhưng pass trên máy bạn',
        'Trong lịch sử chạy, test có cả lần pass lẫn lần fail trên cùng một commit',
        'Test fail đúng một lần rồi không fail nữa',
        'Test mất hơn 60 giây để chạy',
      ],
      answer: 1,
      explain: 'Cùng commit nghĩa là code không đổi, nên kết quả khác nhau chỉ có thể đến từ yếu tố bất định (thời gian, dữ liệu chung, thứ tự, môi trường). "Fail trên CI, pass ở máy bạn" chỉ là tín hiệu nghi ngờ — có khi là bug phụ thuộc môi trường thật.',
    },
    {
      q: 'Test có 20% xác suất fail, CI bật retry 2 lần (tối đa 3 nỗ lực). Điều gì nói đúng nhất?',
      options: [
        'Suite trở nên đáng tin cậy vì xác suất đỏ chỉ còn 0.8% mỗi test',
        'Test đỏ do bug thật cũng có 99.2% cơ hội được retry thành xanh, nên tín hiệu báo lỗi bị mất',
        'Retry làm tăng thời gian chạy nhưng không ảnh hưởng chất lượng tín hiệu',
        'Retry chỉ áp dụng cho test fail vì assertion, không áp dụng cho exception',
      ],
      answer: 1,
      explain: 'Con số 0.8% đỏ không phân biệt được "đỏ vì flaky" và "đỏ vì bug": nếu bug biểu hiện dưới dạng flaky thì retry nuốt nó y như nuốt flaky vô hại. Vì thế retry phải có trần nhỏ, phải được log, và kết quả "pass after retry" phải hiển thị màu vàng chứ không phải xanh.',
    },
    {
      q: 'Cách ly (quarantine) một test flaky nên được thực hiện thế nào để không biến nó thành nợ ẩn?',
      options: [
        '{{@Disabled}} test và xóa khỏi suite để CI xanh',
        'Gắn tag để PR bỏ qua nhưng nightly vẫn chạy, kèm issue, chủ sở hữu và ngày hết hạn',
        'Tăng timeout của test đó lên 60 giây',
        'Chuyển test sang chạy lại bằng tay mỗi sáng',
      ],
      answer: 1,
      explain: 'Mục tiêu của cách ly là **không chặn dòng chảy** mà vẫn **giữ dữ liệu và trách nhiệm**. Tag + nightly cho bạn tiếp tục đo flaky rate; issue + chủ + deadline buộc phải sửa. Disabled rồi quên nghĩa là độ phủ giảm mà không ai ghi sổ.',
    },
    {
      q: 'Bước nào nên làm **đầu tiên** khi bắt đầu chẩn đoán một test thỉnh thoảng đỏ?',
      options: [
        'Tăng timeout và thêm sleep trước assert để ổn định tạm',
        'Tái hiện có kiểm soát: chạy 30–50 lần liên tiếp và ghi log từng lần, đồng thời thử chạy với parallel tắt',
        'Viết lại page object',
        'Xin dev sửa ứng dụng',
      ],
      answer: 1,
      explain: 'Không tái hiện được thì mọi thay đổi đều là đoán. {{@RepeatedTest(50)}} cho tỉ lệ đỏ; tắt song song là phép thử phân biệt race/chia sẻ trạng thái với lỗi chờ đợi. Hai dữ kiện này quyết định hướng sửa, và rẻ hơn nhiều so với việc sửa mò rồi chờ nightly tuần sau.',
    },
  ],
  related: ['autotest-018', 'autotest-027', 'autotest-014'],
  tags: ['flaky', 'quarantine', 'flaky rate', 'retry', 'regression', 'RepeatedTest', 'diagnose', 'CI'],
},
{
  id: 'lesson-autotest-012',
  track: 'autotest',
  order: 12,
  title: 'Service virtualization: WireMock, Playwright route, Testcontainers và test data builder',
  level: 'senior',
  minutes: 45,
  goals: [
    'Giải thích service virtualization là gì và khi nào nó rẻ hơn (hoặc đắt hơn) việc gọi hệ thống thật',
    'Viết stub WireMock theo method + đường dẫn + header, verify số lần gọi, và tiêm lỗi (delay, fault) để test nhánh xử lý lỗi',
    'Chặn network ngay trong Playwright bằng {{page.route}} để test UI mà không cần backend',
    'Biết khi nào dùng Testcontainers thay vì stub, và đánh đổi của nó',
    'Viết test data builder để mỗi test có dữ liệu riêng, chạy song không giẫm nhau',
  ],
  body: `**Tóm tắt:** **Service virtualization** (giả lập dịch vụ) là thay một hệ thống thật bằng một hệ thống giả **trả lời đúng giao thức** để code của bạn không phân biệt được. Bạn dùng nó khi dependency **chậm, đắt, không ổn định, hoặc nằm ngoài tầm kiểm soát** (cổng thanh toán, nhà mạng gửi SMS, đối tác bảo trì lúc 2h sáng), và khi bạn cần những tình huống **không tạo được trên hệ thống thật**: "ngân hàng trả về từ chối", "đối tác timeout 30 giây", "trả về 500". Công cụ Java chuẩn là **WireMock** (HTTP giả), **Playwright route** (chặn request ngay trong trình duyệt), **Testcontainers** (dựng hệ thống *thật* trong Docker khi bạn cần hành vi thật), cộng **test data builder** để dữ liệu không thành điểm nghẽn.

### Ví dụ đời thường
Nhà hàng muốn test quy trình nhận đặt bàn. Hai cách: (a) chờ khách thật gọi tới — không hẹn được giờ, không bảo họ nói câu từ chối để test nhánh "hết bàn", và mỗi lần test là một cuộc gọi tốn tiền; (b) thuê một **diễn viên** đóng vai khách, cầm kịch bản: "đầu tiên hỏi bàn 4 người, nếu bị từ chối thì đổi sang bàn 2". Cách (b) là service virtualization: giao tiếp y hệt, nhưng **bạn chọn được lời thoại**, kể cả lời thoại tệ nhất.

### WireMock: stub và verify
**WireMock** ({{com.github.tomakehurst:wiremock-standalone}}, hoặc {{wiremock-jre8}} cho bản cũ) là một **HTTP server nhúng** (Jetty) — bạn khởi động trong test, trỏ base URL của client/REST Assured vào nó, và mô tả "ai hỏi gì thì đáp gì". Nó có hai chế độ: chạy trong JVM ({{WireMockServer}}) hoặc chạy như tiến trình độc lập ({{java -jar wiremock-standalone-3.x.x.jar --port 8089}}) để nhiều test/dev cùng dùng.

~~~java
import static com.github.tomakehurst.wiremock.client.WireMock.*;
import com.github.tomakehurst.wiremock.junit5.WireMockTest;

@WireMockTest(httpPort = 8089)          // JUnit 5: tu khoi dong + tu don WireMock
class PaymentGatewayTest {

    @Test void hangs_when_gateway_is_slow() {
        stubFor(post(urlEqualTo("/v1/charge"))
                .withHeader("Authorization", equalTo("Bearer test-token"))
                .inScenario("charge")                    // stateful: do ket qua theo buoc
                .whenScenarioStateIs("Started")
                .willReturn(aResponse()
                        .withStatus(200)
                        .withHeader("Content-Type", "application/json")
                        .withBody("{\\"txn\\":\\"T-1\\",\\"status\\":\\"PENDING\\"}"))
                .withFixedDelay(2500));                  // de test timeout cua client

        // Nhat hanh: client goi toi http://localhost:8089/v1/charge
        verify(1, postRequestedFor(urlEqualTo("/v1/charge"))
                .withHeader("Idempotency-Key", matching("^[0-9a-f-]{36}$")));
        // verify bắt được lỗi mà không cần assert kqua: client gửi 2 request trùng lặp
    }

    @Test void gateway_error_is_handled() {
        // Chi nhánh ngân hàng từ chối -> app phải hiện lỗi quê hương đơn
        stubFor(post(urlEqualTo("/v1/charge"))
                .willReturn(aResponse()
                        .withStatus(200)
                        .withBody("{\\"status\\":\\"DECLINED\\",\\"code\\":\\"INSUFFICIENT_FUNDS\\"}")));
    }

    @Test void connection_reset_is_handled() {
        stubFor(post(urlEqualTo("/v1/charge"))
                .willReturn(aResponse().withFault(com.github.tomakehurst.wiremock.common.SingleFaultType.CONNECTION_RESET_BY_PEER)));
    }
}
~~~

Trong {{verify}}, số đầu là **số lần đúng** kỳ vọng. Ba bộ khớp URL hay dùng: {{urlEqualTo}} (chính xác), {{urlPathEqualTo}} (bỏ query string), {{urlMatching}} (regex). {{verify}} + {{findAll(postRequestedFor(...))}} là cách duy nhất để test "client phải gửi **đúng một** yêu cầu thanh toán" — một bug trùng đơn hàng rất đắt mà assert response không bao giờ thấy được.

WireMock còn có **record mode**: chạy thật một lượt với hệ thống thật, ghi lại mọi request/response thành file stub, rồi replay trong CI. Hữu ích khi đối tác không cho môi trường test, nhưng phải **mask dữ liệu nhạy cảm** trước khi commit.

### Chặn network trong Playwright: page.route
Với UI test, bạn không cần dựng server: Playwright chặn request ngay trong trình duyệt và tự trả nội dung.

~~~java
// Mock API của trang: mỗi lần trang gọi /api/orders thì nhận dữ liệu ta chọn
page.route("**/api/orders", route -> route.fulfill(
        new Route.FulfillOptions()
                .setStatus(200)
                .setContentType("application/json")
                .setBody("[{\\"id\\":\\"O-1\\",\\"status\\":\\"PAID\\"}]")));

// Lam hong yeu cau tai JS: de test canh bao mat ket noi
page.route("**/analytics.js", Route::abort);

// Gửi storageState để mọi context đăng nhập sẵn, khỏi phải click form login
BrowserContext ctx = browser.newContext(
        new Browser.NewContextOptions().setStorageStatePath(java.nio.file.Paths.get("qa/storage-state.json")));
~~~

Dùng {{page.route}} khi cần **buộc UI vẽ một trạng thái hiếm** (đơn hoàn tất, còn 0 slot, banner lỗi), vì dựng dữ liệu đó qua API thật có khi mất 5 phút test và phụ thuộc nghiệp vụ. **Không** dùng nó để test tính đúng đắn của backend — UI sẽ PASS dù server chết, vì UI chẳng bao giờ gọi server.

### Khi nào stub, khi nào hệ thống thật
| Tình huống | Chọn | Vì sao |
|---|---|---|
| Cổng thanh toán/SMS/OTP/đối tác bên ngoài | **stub** (WireMock) | đắt theo request, không có sandbox ổn định, cần test mã lỗi |
| DB quan hệ, Kafka, Redis của **chính sản phẩm** | **Testcontainers** | hành vi thật (SQL dialect, trigger, partition, eviction) stub không tái hiện nổi |
| Service nội bộ khác trong cùng hệ thống | test **thật** ở tầng integration, stub ở tầng unit/UI | stub che mất lỗi tích hợp: đổi schema, đổi auth, timeout |
| Bên thứ ba chỉ để **đọc dữ liệu hiển thị** | stub, hoặc {{page.route}} | nhanh, xác định |
| Nghi lỗi hợp đồng (đối tác đổi fields) | **contract test**, không phải stub | stub được viết từ **đoán** của QA — đoán sai thì CI xanh, production đỏ |

Câu chốt khi phỏng vấn: *stub trả lời câu hỏi "code của tôi xử lý thế nào khi nhận đáp án X"; test thật trả lời "X có thực sự trả đáp án đó không"*. Bạn cần cả hai, và chúng nằm ở hai tầng khác nhau của kim tự tháp.

### Testcontainers: Docker cho test
**Testcontainers** ({{org.testcontainers}}) khởi động container thật trong lúc test chạy, rồi hủy khi xong — bạn có Postgres/Kafka/Selenium thật mà không ai phải cài thủ công.

~~~java
@Testcontainers
class OrderRepositoryIT {
    @Container
    static final PostgreSQLContainer<?> DB = new PostgreSQLContainer<>("postgres:15-alpine")
            .withDatabaseName("shop")
            .withUsername("qa")
            .withPassword("qa");        // chỉ là credential của container, không phải secret thật

    @Test void unique_index_blocks_duplicate_order() {
        // DB.getMappedPort() trả về cổng thật được Docker cấp phát (tránh xung đột cổng)
        try (Connection c = DriverManager.getConnection(DB.getJdbcUrl(), DB.getUsername(), DB.getPassword())) {
            // chèn 2 đơn trùng idempotency key -> lần 2 phai bi loi unique
        }
    }
}
~~~

Điểm cần biết: mỗi class có container riêng nếu khai báo **static** trong class (JUnit reuse cho cả class — nhanh hơn hẳn so với tạo trong {{@BeforeEach}}); {{withReuse(true)}} giữ container giữa các lần chạy trên máy dev nhưng **mặc định tắt trên CI**; muốn nhiều service nói chuyện nhau thì chung một {{Network.newNetwork()}} hoặc dùng {{ComposeContainer}}/{{DockerComposeContainer}} để chạy file compose. Đổi lại: cần Docker daemon trên máy và runner, mất 1–10 giây khởi động, và nếu không dọn thì disk CI đầy vì ảnh layer cũ.

### Test data builder
Dữ liệu là chỗ khiến stub/container vẫn fail khi song song. Builder cho phép khai báo ý định và tự lo phần còn lại:

~~~java
static OrderDTO anOrder() {                     // "Object Mother": mac dinh hop le
    String key = UUID.randomUUID().toString();
    return new OrderDTO("qa-" + key, "Hanoi", 199000, Status.DRAFT, key);
}

@Test void paid_order_shows_receipt() {
    OrderDTO o = anOrder().toBuilder().status(Status.PAID).build();   // chi dieu chinh can thiet
    String id = orderApi.create(o);                                   // tao qua API, khong qua UI
    page.navigate(config.baseUrl() + "/orders/" + id);
    assertThat(page.locator("#receipt")).isVisible();
}
~~~

Ba nguyên tắc: **mỗi test tự tạo dữ liệu của nó** (không dựa vào "đơn có mã ORD-123 mà ai đó đã seed"), **khóa độc nhất** ({{UUID}}/suffix theo tên test) để chạy song song không xung đột ràng buộc unique, và **dọn dẹp idempotent** ở {{@AfterEach}} — dọn bằng API/SQL theo khóa của mình, đừng xóa cả bảng.

### Luong mo mot test co virtualization

~~~seq
title: Test thanh toán dùng WireMock và Testcontainers
actors: Test | App | WireMock | Container
Test -> Container: khoi dong Postgres va seed schema
Test -> App: goi dich vu tao don hang
App -> WireMock: POST /v1/charge voi Bearer token
WireMock --> App: 200 PENDING sau delay 2500ms
App --> Test: tra ve ma don hang
Test -> WireMock: verify dung 1 lan goi
Test -> Container: doc bang orders va doi chieu
note Test..WireMock: stub cho phep tiem loi 500 va timeout
~~~

### Bốn lỗi hay gặp
- **Stub chỉ trả thành công.** Bạn test được happy path và bỏ đúng chỗ dễ vỡ nhất. Mỗi luồng lỗi trong nghiệp vụ nên có một stub trả 402/500/timeout.
- **Stub khớp regex quá rộng**: {{urlMatching("/.*")}} nuốt mọi request, nên một bug "client gọi sai URL" vẫn xanh. Khớp càng chặt càng tốt.
- **Không verify**: stub trả đúng nhưng client gọi 3 lần (retry không idempotent) — không assert nào thấy.
- **Commit stub chứa dữ liệu thật** (số điện thoại, CCCD, token) từ record mode. Mask trước khi ghi file.
- **Dùng stub cho chính DB của mình**: schema đổi, migration thiếu, trigger — tất cả im lặng cho tới production.

### Liên hệ phỏng vấn
- "Test của bạn phụ thuộc payment gateway, xử lý sao?" → stub WireMock cho luồng tiền, sandbox thật cho một smoke test mỗi đêm, contract test để bắt thay đổi API đối tác; kể thêm cách test timeout bằng {{withFixedDelay}}/{{withFault}}.
- "Stub khác mock trong unit test thế nào?" → mock/stub ở tầng unit (Mockito, một object), WireMock ở tầng **giao thức HTTP** nên chạy được cả khi test qua network, cả UI và API test.
- "Khi nào Testcontainers thay vì stub?" → khi hành vi của hệ thống thật là thứ được test (SQL, Kafka, Redis eviction). Nói được đánh đổi: cần Docker, chậm hơn stub, nhưng bắt được lỗi tích hợp.
- "Làm sao test UI khi backend chưa xong?" → Playwright {{route.fulfill}} dựng JSON theo hợp đồng API (OpenAPI), song song với việc viết API test — đây là cách QA và dev làm việc độc lập.

> Senior tip: quy tắc chọn mà tôi hay dùng: **bên ngoài tổ chức thì stub, bên trong tổ chức thì thật**. Ngoại lệ duy nhất cho "thật" là khi bạn không kiểm soát được nhịp của nó (đối tác giới hạn 5 request/phút) hoặc khi cần trạng thái lỗi hiếm. Và một mẹo đáng giá: đặt **một vài stub hỏng có chủ đích** vào nightly suite — ví dụ luôn có một stub trả 500 cho dịch vụ vận chuyển — để bảo đảm code xử lý lỗi **không bao giờ** bị lãng quên. Stub toàn xanh là stub tự ru mình.`,
  exercises: [
    {
      title: 'StubServer: đăng ký stub theo method + url (exact/regex) + header, stub sau thắng, verify số lần gọi',
      prompt: `Viết {{StubServer}} mô phỏng phần lõi của WireMock: bảng stub, khớp request, và nhật ký để verify. Không mở socket, không dùng mạng, không đọc thời gian thực.

**1) Lớp {{StubResponse}}**: constructor {{StubResponse(int status, String body)}} và hai getter {{status()}}, {{body()}}.

**2) Lớp {{StubServer}}**:
- {{void on(String method, String url, StubResponse response)}}: đăng ký stub khớp **đúng nguyên văn** {{url}} (so sánh {{equals}}).
- {{void on(String method, String url, Map<String, String> requiredHeaders, StubResponse response)}}: như trên nhưng **chỉ khớp** khi request có đủ mọi cặp header trong {{requiredHeaders}}. Tên header so **không phân biệt hoa/thường**, giá trị so **chính xác**. {{requiredHeaders}} bằng {{null}} hoặc rỗng = không yêu cầu header nào.
- {{void onUrlMatching(String method, String urlPattern, StubResponse response)}}: {{urlPattern}} là **regex khớp toàn bộ chuỗi** (ngữ nghĩa {{Pattern.matches}} — cả chuỗi phải khớp, không phải một phần).
- {{StubResponse handle(String method, String url, Map<String, String> requestHeaders)}}: tìm stub khớp. **Stub đăng ký sau thắng** khi nhiều stub cùng khớp — bất kể exact hay regex. Không có stub nào khớp thì trả về stub chuẩn {{404}} với body đúng bằng chuỗi {{NOT_STUBBED}}. {{method}} hoặc {{url}} bằng {{null}}: coi như không khớp **và không ghi nhật ký**. Mọi request hợp lệ (khớp hay không khớp) đều được ghi vào nhật ký.
- {{List<String> received()}}: **bản copy** nhật ký, mỗi phần tử có dạng {{METHOD + " " + url}} (nguyên văn method và url như người gọi truyền vào), theo thứ tự nhận.
- {{int requestCount()}}: số phần tử nhật ký.
- {{int callCount(String method, String url)}}: số lần nhật ký có method khớp **không phân biệt hoa/thường** và url khớp **chính xác**.
- {{boolean verify(String method, String url, int expectedCount)}}: {{callCount(method, url) == expectedCount}}.
- {{void resetRequests()}}: xóa nhật ký, **giữ nguyên bảng stub**.

Ví dụ:

~~~text
onUrlMatching("GET", "/api/.*", r503)
on("GET", "/api/orders", r200)              -> dang ky SAU nen THANG cho /api/orders
handle("GET", "/api/orders", null)          -> r200
handle("get", "/api/customers", null)       -> r503  (method khong phan biet hoa thuong)
handle("GET", "/api/orders/77", null)       -> r200? KHONG: exact "orders" != "orders/77"
                                             -> regex "/api/.*" dang ky TRUOC nen van khop
                                             -> r503
handle("POST", "/api/orders", null)         -> 404 NOT_STUBBED
requestCount()                              -> 4
~~~

Chú ý điều kiện biên: stub có {{requiredHeaders}} mà request thiếu header (hoặc {{requestHeaders}} là {{null}}) thì **không khớp**, và nếu đó là stub duy nhất cho URL đó thì kết quả là 404. Bẫy kinh điển: sắp xếp theo thứ tự đăng ký bằng cách duyệt từ phần tử đầu tiên — khi đó stub cũ thắng, và CI của bạn sẽ trả về response của stub "từ năm trước".`,
      starter: `final class StubResponse {
    private final int status;
    private final String body;

    StubResponse(int status, String body) {
        this.status = status;
        this.body = body;
    }

    int status() {
        throw new UnsupportedOperationException("TODO");
    }

    String body() {
        throw new UnsupportedOperationException("TODO");
    }
}

final class StubServer {
    void on(String method, String url, StubResponse response) {
        throw new UnsupportedOperationException("TODO");
    }

    void on(String method, String url, Map<String, String> requiredHeaders, StubResponse response) {
        throw new UnsupportedOperationException("TODO");
    }

    void onUrlMatching(String method, String urlPattern, StubResponse response) {
        throw new UnsupportedOperationException("TODO");
    }

    StubResponse handle(String method, String url, Map<String, String> requestHeaders) {
        throw new UnsupportedOperationException("TODO");
    }

    List<String> received() {
        throw new UnsupportedOperationException("TODO");
    }

    int requestCount() {
        throw new UnsupportedOperationException("TODO");
    }

    int callCount(String method, String url) {
        throw new UnsupportedOperationException("TODO");
    }

    boolean verify(String method, String url, int expectedCount) {
        throw new UnsupportedOperationException("TODO");
    }

    void resetRequests() {
        throw new UnsupportedOperationException("TODO");
    }
}`,
      tests: `public class Main {
    interface Body { boolean get() throws Exception; }

    static int pass = 0, total = 0;

    static void t(String name, Body b) {
        total++;
        try {
            if (b.get()) { pass++; System.out.println("PASS " + name); }
            else System.out.println("FAIL " + name + ": tra ve false");
        } catch (Throwable e) {
            System.out.println("FAIL " + name + ": " + e);
        }
    }

    static void eq(Object actual, Object expected) {
        if (!Objects.equals(actual, expected)) {
            throw new AssertionError("expected " + expected + " but was " + actual);
        }
    }

    static StubResponse code(int c) {
        return new StubResponse(c, "b" + c);
    }

    public static void main(String[] args) {
        t("stub exact khop va tra dung response", () -> {
            StubServer s = new StubServer();
            StubResponse ok = code(200);
            s.on("GET", "/api/orders", ok);
            StubResponse got = s.handle("GET", "/api/orders", null);
            eq(got == ok, true);
            eq(got.status(), 200);
            eq(got.body(), "b200");
            eq(s.requestCount(), 1);
            return s.verify("GET", "/api/orders", 1);
        });

        t("url khac thi 404 NOT_STUBBED", () -> {
            StubServer s = new StubServer();
            s.on("GET", "/api/orders", code(200));
            StubResponse got = s.handle("GET", "/api/orders/77", null);
            eq(got.status(), 404);
            eq(got.body(), "NOT_STUBBED");
            eq(s.requestCount(), 1);
            return s.received().equals(Arrays.asList("GET /api/orders/77"));
        });

        t("method khac khong khop stub", () -> {
            StubServer s = new StubServer();
            s.on("GET", "/api/orders", code(200));
            eq(s.handle("POST", "/api/orders", null).status(), 404);
            eq(s.verify("POST", "/api/orders", 1), true);
            return s.verify("GET", "/api/orders", 0);
        });

        t("method khong phan biet hoa thuong", () -> {
            StubServer s = new StubServer();
            s.on("GET", "/x", code(201));
            eq(s.handle("get", "/x", null).status(), 201);
            eq(s.handle("GeT", "/x", null).status(), 201);
            eq(s.callCount("GET", "/x"), 2);
            return s.callCount("get", "/x") == 2;
        });

        t("regex khop toan bo chuoi", () -> {
            StubServer s = new StubServer();
            s.onUrlMatching("GET", "/api/.*", code(503));
            eq(s.handle("GET", "/api/customers", null).status(), 503);
            eq(s.handle("GET", "/api/orders/123", null).status(), 503);
            eq(s.handle("GET", "/other", null).status(), 404);
            StubServer t2 = new StubServer();
            t2.onUrlMatching("GET", "^/a$", code(200));
            eq(t2.handle("GET", "/ab", null).status(), 404);
            eq(t2.handle("GET", "ba", null).status(), 404);
            return t2.handle("GET", "/a", null).status() == 200;
        });

        t("stub dang ky sau thang", () -> {
            StubServer s = new StubServer();
            s.on("GET", "/api/orders", code(500));
            s.on("GET", "/api/orders", code(200));
            eq(s.handle("GET", "/api/orders", null).status(), 200);
            s.onUrlMatching("GET", "/api/.*", code(503));
            eq(s.handle("GET", "/api/orders", null).status(), 503);
            return s.handle("GET", "/api/x", null).status() == 503;
        });

        t("exact dang ky sau thang regex dang ky truoc", () -> {
            StubServer s = new StubServer();
            s.onUrlMatching("GET", "/api/.*", code(503));
            s.on("GET", "/api/orders", code(200));
            eq(s.handle("GET", "/api/orders", null).status(), 200);
            eq(s.handle("GET", "/api/other", null).status(), 503);
            return s.requestCount() == 2;
        });

        t("stub co header yeu cau", () -> {
            StubServer s = new StubServer();
            s.on("POST", "/charge", Map.of("x-api-key", "k1"), code(201));
            eq(s.handle("POST", "/charge", null).status(), 404);
            eq(s.handle("POST", "/charge", Map.of("x-api-key", "k2")).status(), 404);
            eq(s.handle("POST", "/charge", Map.of("X-Api-Key", "k1")).status(), 201);
            StubResponse ok = s.handle("POST", "/charge", Map.of("x-api-key", "k1", "trace", "z"));
            eq(ok.status(), 201);
            return s.callCount("POST", "/charge") == 4;
        });

        t("header không khớp thì rơi xuống stub chung", () -> {
            StubServer s = new StubServer();
            s.on("GET", "/v", code(200));
            s.on("GET", "/v", Map.of("role", "admin"), code(403));
            eq(s.handle("GET", "/v", Map.of("role", "admin")).status(), 403);
            eq(s.handle("GET", "/v", Map.of("role", "guest")).status(), 200);
            eq(s.handle("GET", "/v", null).status(), 200);
            return s.received().size() == 3;
        });

        t("verify dem ca request 404", () -> {
            StubServer s = new StubServer();
            s.on("GET", "/a", code(200));
            s.handle("GET", "/a", null);
            s.handle("GET", "/a", null);
            s.handle("GET", "/b", null);
            eq(s.verify("GET", "/a", 2), true);
            eq(s.verify("GET", "/a", 3), false);
            eq(s.verify("GET", "/b", 1), true);
            eq(s.verify("GET", "/zz", 0), true);
            return s.requestCount() == 3;
        });

        t("received tra ban copy doc lap", () -> {
            StubServer s = new StubServer();
            s.on("GET", "/a", code(200));
            s.handle("GET", "/a", null);
            List<String> snap = s.received();
            snap.add("TAM TAY");
            snap.remove(0);
            eq(snap.size(), 1);
            eq(s.requestCount(), 1);
            return s.received().equals(Arrays.asList("GET /a"));
        });

        t("resetRequests giu stub xoa nhat ky", () -> {
            StubServer s = new StubServer();
            s.on("GET", "/a", code(200));
            s.handle("GET", "/a", null);
            s.resetRequests();
            eq(s.requestCount(), 0);
            eq(s.received().isEmpty(), true);
            eq(s.verify("GET", "/a", 0), true);
            s.handle("GET", "/a", null);
            eq(s.verify("GET", "/a", 1), true);
            return s.handle("GET", "/a", null).status() == 200;
        });

        t("method hoặc url null không ghi nhật ký", () -> {
            StubServer s = new StubServer();
            s.on("GET", "/a", code(200));
            eq(s.handle(null, "/a", null).status(), 404);
            eq(s.handle("GET", null, null).status(), 404);
            eq(s.requestCount(), 0);
            s.handle("GET", "/a", null);
            eq(s.requestCount(), 1);
            return s.received().equals(Arrays.asList("GET /a"));
        });

        System.out.println("RESULT " + pass + "/" + total);
    }
}`,
      reference: `final class StubResponse {
    private final int status;
    private final String body;

    StubResponse(int status, String body) {
        this.status = status;
        this.body = body;
    }

    int status() {
        return status;
    }

    String body() {
        return body;
    }
}

final class StubServer {
    private static final StubResponse NOT_STUBBED = new StubResponse(404, "NOT_STUBBED");

    private static final class Stub {
        final String method;
        final String url;
        final String pattern;
        final Map<String, String> headers;
        final StubResponse response;

        Stub(String method, String url, String pattern, Map<String, String> headers, StubResponse response) {
            this.method = method;
            this.url = url;
            this.pattern = pattern;
            this.headers = headers;
            this.response = response;
        }
    }

    private final List<Stub> stubs = new ArrayList<>();
    private final List<String> log = new ArrayList<>();

    void on(String method, String url, StubResponse response) {
        on(method, url, null, response);
    }

    void on(String method, String url, Map<String, String> requiredHeaders, StubResponse response) {
        Map<String, String> copy = requiredHeaders == null || requiredHeaders.isEmpty()
                ? null : new LinkedHashMap<>(requiredHeaders);
        stubs.add(new Stub(method, url, null, copy, response));
    }

    void onUrlMatching(String method, String urlPattern, StubResponse response) {
        stubs.add(new Stub(method, null, urlPattern, null, response));
    }

    StubResponse handle(String method, String url, Map<String, String> requestHeaders) {
        if (method == null || url == null) return NOT_STUBBED;
        log.add(method + " " + url);
        for (int i = stubs.size() - 1; i >= 0; i--) {
            Stub s = stubs.get(i);
            if (fits(s, method, url, requestHeaders)) return s.response;
        }
        return NOT_STUBBED;
    }

    List<String> received() {
        return new ArrayList<>(log);
    }

    int requestCount() {
        return log.size();
    }

    int callCount(String method, String url) {
        int n = 0;
        for (String line : log) {
            int sp = line.indexOf(' ');
            if (sp < 0) continue;
            if (line.substring(0, sp).equalsIgnoreCase(method) && line.substring(sp + 1).equals(url)) n++;
        }
        return n;
    }

    boolean verify(String method, String url, int expectedCount) {
        return callCount(method, url) == expectedCount;
    }

    void resetRequests() {
        log.clear();
    }

    private static boolean fits(Stub s, String method, String url, Map<String, String> requestHeaders) {
        if (s.method == null || !s.method.equalsIgnoreCase(method)) return false;
        if (s.pattern != null) {
            if (!java.util.regex.Pattern.matches(s.pattern, url)) return false;
        } else if (s.url == null || !s.url.equals(url)) {
            return false;
        }
        if (s.headers != null) {
            for (Map.Entry<String, String> e : s.headers.entrySet()) {
                String got = headerOf(requestHeaders, e.getKey());
                if (got == null || !got.equals(e.getValue())) return false;
            }
        }
        return true;
    }

    private static String headerOf(Map<String, String> headers, String name) {
        if (headers == null || name == null) return null;
        for (Map.Entry<String, String> e : headers.entrySet()) {
            if (e.getKey() != null && e.getKey().equalsIgnoreCase(name)) return e.getValue();
        }
        return null;
    }
}`,
      hints: [
        'Một stub là một object nhỏ giữ 5 thứ: method, url (null nếu là regex), pattern (null nếu exact), map header yêu cầu, và response. Đăng ký = thêm vào cuối một {{List<Stub>}}.',
        'Để "stub sau thắng": duyệt danh sách stub **ngược** từ {{stubs.size() - 1}} về 0 và trả ngay khi khớp. Duyệt xuôi là sai ngay điều kiện đầu tiên của đề.',
        '{{Pattern.matches(pattern, url)}} khớp **toàn bộ** chuỗi, nên {{"^/a$"}} cũng khớp {{"/a"}} (cả chuỗi chỉ có /a) và KHÔNG khớp {{"/ab"}}. Đây là khác biệt với {{matcher(url).find()}} — dùng {{find}} sẽ nuốt request ngoài ý muốn.',
        'Header: với mỗi cặp bắt buộc, tìm trong request header theo tên **không phân biệt hoa/thường** ({{equalsIgnoreCase}}) rồi so giá trị chính xác; thiếu tên hoặc giá trị khác thì stub không khớp. {{requestHeaders == null}} nghĩa là không có header nào, nên stub có yêu cầu header sẽ trượt.',
        'Nhật ký nên ghi **trước khi** tìm stub, vì yêu cầu "404 cũng được đếm". Nếu chỉ ghi khi khớp thì {{verify}} sai ngay bài test đầu tiên.',
        'Nhớ trả {{new ArrayList<>(log)}} ở {{received()}} và {{log.clear()}} (không phải gán danh sách mới) ở {{resetRequests()}} — nếu không, người gọi sửa được nhật ký bên trong của server.',
      ],
      explain: `Ba quyết định thiết kế biến bài này thành mô hình trung thực của WireMock.

**Thứ nhất: duyệt ngược.** WireMock chọn stub theo độ ưu tiên (độ cụ thể của matching), còn nhiều framework nhẹ hơn thì "cấu hình sau ghi đè cấu hình trước". Đề bài chọn quy tắc thứ hai vì nó là thứ khiến QA đau đầu nhất trên thực tế: bạn thêm một stub mới cho cùng đường dẫn và **không hiểu vì sao test vẫn nhận response cũ** — vì stub cũ nằm ở đầu danh sách và được duyệt trước. Duyệt ngược khiến hành vi trùng với trực giác "cái tôi vừa đăng ký phải có hiệu lực ngay".

**Thứ hai: {{equals}} cho exact, {{Pattern.matches}} cho regex.** Sự khác biệt này là nguồn bug "stub nuốt request": {{urlMatching("/api")}} theo nghĩa {{find}} sẽ khớp {{"/api/orders"}}, {{"/apix"}}, thậm chí {{"/my/api"}}, nên test không phát hiện client gọi sai đường dẫn. {{Pattern.matches}} đòi cả chuỗi khớp, nên pattern phải viết {{"/api/.*"}} — chặt hơn, và là lý do WireMock có tới ba họ {{urlEqualTo}}/{{urlPathEqualTo}}/{{urlMatching}}: bạn phải chọn **mức chặt** vừa đủ.

**Thứ ba: ghi nhật ký cho cả request không khớp.** {{verify}} tồn tại để trả lời câu hỏi mà assert response không bao giờ trả lời được: "client đã gọi đối tác **mấy lần**?". Bug trùng đơn hàng, bug retry-không-idempotent, bug "gửi hai email xác nhận" chỉ thấy được bằng đếm request. Bỏ qua 404 trong nhật ký thì test "client phải gọi API đúng 1 lần" trở nên vô nghĩa khi client gọi tới URL sai.

**header thieu thi roi xuong stub khac** là tình huống hay nhất trong bài và cũng là bài học về thứ tự ưu tiên: stub {{role=admin}} trả 403 đăng ký sau nên thắng khi có header, nhưng khi request **không có** header thì nó không khớp, và request rơi xuống stub chung trả 200 — đúng cơ chế WireMock dùng để viết scenario "khách vs admin". Nếu bạn triển khai bằng cách "chọn stub có nhiều điều kiện nhất", bạn sẽ làm ngược kết quả này; đừng, hãy bám đúng quy tắc đăng ký sau thắng.

Lỗi phổ biến khi làm bài: (1) lưu {{requiredHeaders}} trực tiếp thay vì copy — map của người đăng ký đổi sau, stub đổi theo; (2) quên {{s.method == null}} trong {{fits}} để rồi {{null}}.equalsIgnoreCase ném NPE; (3) cắt {{callCount}} bằng {{split(" ")}} — URL có dấu cách ({{"/q?key=a b"}}) sẽ vỡ, phải cắt tại dấu cách **đầu tiên** bằng {{indexOf}} rồi lấy phần còn lại; (4) dùng {{==}} so {{StubResponse}} — ở đây test **có** kiểm tra {{got == ok}} vì yêu cầu trả đúng thể hiện đã đăng ký, nên đừng dựng một {{StubResponse}} mới mỗi lần khớp.`,
    },
  ],
  check: [
    {
      q: 'Payment gateway của đối tác chỉ có sandbox không ổn định và tính tiền theo request. Chiến lược nào hợp lý nhất cho regression suite chạy mỗi commit?',
      options: [
        'Gọi sandbox thật cho mọi test để đảm bảo trung thực',
        'Stub bằng WireMock cho hầu hết test, thêm vài test thật chạy nightly, cộng contract test để bắt đối tác đổi API',
        'Tắt các test liên quan tới thanh toán',
        'Gọi sandbox thật nhưng retry 5 lần khi fail',
      ],
      answer: 1,
      explain: 'Test mỗi commit cần nhanh, xác định và rẻ → stub. Test thật vẫn cần, nhưng ở nhịp thấp hơn (nightly) để phát hiện sandbox/thay đổi hợp đồng. Retry 5 lần chỉ biến không ổn định thành chậm, và che mất bug tích hợp thật.',
    },
    {
      q: 'So sánh {{urlMatching("/api")}} của WireMock với {{Pattern.matches("/api", url)}} — điểm khác nhau nào dễ gây nhầm nhất?',
      options: [
        'Không khác, cả hai đều khớp toàn bộ chuỗi',
        'Bản dùng find/matching một phần sẽ khớp cả đường dẫn chứa "/api" ở giữa hoặc cuối, nên stub nuốt request sai',
        'Bản regex chỉ khớp khi có query string',
        'Bản find chậm hơn nên làm test flaky',
      ],
      answer: 1,
      explain: 'Khớp một phần khiến stub "đúng" trả lời cho cả request sai, và test vẫn xanh dù client gọi tới URL không tồn tại. Đây là lý do nên viết pattern neo chặt ({{"/api/.*"}}, {{"/v1/charge"}} exact) và vì WireMock tách {{urlEqualTo}}/{{urlPathEqualTo}}/{{urlMatching}} thành ba họ.',
    },
    {
      q: 'Vì sao {{verify}}/đếm request là phần không thể thiếu, khi assert response đã có?',
      options: [
        'Vì response stub luôn giống nhau nên không có gì để assert',
        'Vì các lỗi đắt nhất nằm ở số lần và nội dung client gửi đi (gửi hai lần thanh toán, thiếu Idempotency-Key), thứ không hiện trong response',
        'Vì verify là cách duy nhất kiểm tra HTTP status',
        'Vì WireMock tự động fail nếu không gọi verify',
      ],
      answer: 1,
      explain: 'Service virtualization kiểm soát **đầu vào** của bạn chứ không chỉ đầu ra. Bug trùng đơn hàng, retry không idempotent, header thiếu token — client vẫn nhận 200 và test response vẫn xanh. Verify + {{findAll}} bắt được chúng.',
    },
    {
      q: 'Chọn Testcontainers (Postgres/Kafka thật trong Docker) thay vì stub khi nào?',
      options: [
        'Khi test cần hành vi thật của hệ thống đó: SQL dialect, ràng buộc unique, trigger, phân vùng Kafka, eviction của Redis',
        'Khi muốn test chạy nhanh nhất có thể',
        'Khi CI không có Docker',
        'Khi test chỉ đọc dữ liệu để hiển thị',
      ],
      answer: 0,
      explain: 'Stub được viết theo **đoán** của QA, nên nó không bao giờ bắt được lỗi tích hợp thật (schema đổi, migration thiếu, hành vi khóa). Testcontainers cho hệ thống thật với chi phí: cần Docker daemon, 1–10 giây khởi động, và phải dọn ảnh container trên runner.',
    },
  ],
  related: ['autotest-025', 'autotest-023', 'autotest-009'],
  tags: ['service virtualization', 'WireMock', 'stub', 'verify', 'Playwright route', 'Testcontainers', 'test data builder', 'contract test'],
},
{
  id: 'lesson-autotest-013',
  track: 'autotest',
  order: 13,
  title: 'Mock mạng trong UI test với page.route: chặn request, trả JSON giả, tiêm lỗi 500/timeout, replay HAR',
  level: 'senior',
  minutes: 40,
  goals: [
    'Giải thích được một trang web phát ra những loại request HTTP nào và vì sao UI test bị phụ thuộc vào chúng',
    'Viết page.route với glob pattern để fulfill JSON giả, abort khi mất mạng, continue khi gọi thật',
    'Tiêm được ba tình huống hỏng (500, lỗi mạng, chậm tới timeout) mà không cần backend hợp tác',
    'Biết replay HAR để test UI khi backend chưa xong, và nêu được rủi ro của nó',
    'Phân biệt rành mạch khi nào mock là hợp lý và khi nào bắt buộc gọi backend thật',
  ],
  body: `**Tóm tắt:** Khi mở một trang web, trình duyệt không "hiển thị trang" — nó **gửi hàng chục request HTTP** (lấy HTML, rồi JS/CSS/ảnh, rồi AJAX gọi API lấy dữ liệu). **Mock mạng trong UI test** = chặn một request ngay tại lớp trình duyệt và tự trả nội dung ta chọn, không cho nó tới server. Playwright làm việc đó bằng {{page.route(pattern, handler)}}: {{pattern}} là **glob** chỉ URL cần chặn, {{handler}} là code của bạn quyết định số phận request — {{fulfill}} (ta trả JSON giả), {{abort}} (giả mất mạng), {{continue}} (cứ gọi thật), {{fallback}} (chuyển cho route đăng ký trước). Giá trị lớn nhất: buộc UI vẽ **trạng thái hiếm hoặc trạng thái hỏng** (đơn bị hoàn tiền, API trả 500, mạng chập chờn) thứ mà dựng bằng dữ liệu thật thì rất lâu hoặc bất khả thi. Cái giá: UI test chỉ còn chứng minh "UI vẽ đúng theo dữ liệu ta đưa", **không** chứng minh server sinh ra dữ liệu đó.

### Trang web tạo ra request gì, và vì sao nó là điểm yếu của test
**HTTP request** = một tin nhắn "GET /api/orders?status=new" mà trình duyệt gửi tới server; **response** = tin nhắn hồi âm gồm **status code** (200 = thành công, 4xx = lỗi phía người dùng, 5xx = lỗi phía server) và **body** (thường là **JSON**: định dạng text ghi dữ liệu có cấu trúc theo cặp "tên": giá trị, ví dụ đơn hàng có id "O-1" và total 199000).

Trên một trang SPA (single page app — React/Vue/Angular), luồng thường thấy:

~~~text
Trinh duyet          Server API
    |  GET / (HTML)     |
    | ----------------> |   <html><div id=root></div><script src=app.js>
    |  GET /app.js      |
    | ----------------> |
    |  GET /api/session |   < 200 {user, role}   (AJAX/fetch: JS goi API sau khi trang da mo)
    |  GET /api/orders?status=new
    | ----------------> |   < 200 [ {...}, {...} ]
    |  GET /logo.png    |
    ~~~~~~~~~~~~~~~~~~~~~
    UI vẽ cái ta nhận được từ /api/orders, không phải cái "là thật"
~~~

UI test truyền thống là con tin của chuỗi đó ở ba điểm: (1) **data** — muốn thấy "đơn đã hoàn tiền" phải có một đơn đã hoàn tiền, tức là phải đi qua cả luồng nghiệp vụ; (2) **hỏng** — không ai biết cách "bắt" server trả 500 vào lúc 2 giờ sáng CI chạy; (3) **tốc độ** — mỗi request thật thêm độ trễ mạng và thêm cơ hội flaky (lúc pass lúc fail). Mock mạng cắt ba gông đó bằng cách đặt một **trọng tài** ngay trong trình duyệt: request đi qua tay bạn trước khi quyết định.

### page.route: hình dạng code
Trong Playwright for Java, handler nhận **hai** tham số: {{route}} (điều khiển số phận request) và {{request}} (thông tin request bị chặn).

~~~java
// Chặn API danh sách đơn: mỗi lần trang gọi **/api/orders* thì nhận JSON TA chọn
page.route("**/api/orders*", (route, request) -> route.fulfill(
        new Route.FulfillOptions()
                .setStatus(200)
                .setContentType("application/json")
                .setBody("[{\\"id\\":\\"O-1\\",\\"status\\":\\"REFUNDED\\",\\"total\\":199000}]")));

page.navigate("https://shop.test/orders");
// UI ve dong "Da hoan tien" ma khong can server nao ca
~~~

Bốn số phận của một request:

| Lệnh trong handler | Chuyện xảy ra | Dùng khi |
|---|---|---|
| {{route.fulfill(options)}} | Playwright tự tạo response (status, header, body). Server thật **không hề biết** có request | dựng dữ liệu, dựng mã lỗi |
| {{route.abort()}} hoặc {{abort(AbortOptions().setErrorCode("timedout"))}} | request chết yểu như đứt mạng / DNS lỗi / timeout → JS của trang nhảy vào {{catch}} | test cảnh báo mất kết nối, nút Retry |
| {{route.continue_()}} | cho qua như thường: gửi tới server thật ({{continue}} là từ khóa Java nên API mang tên {{continue_}}) | cho phép phần còn lại của trang chạy thật |
| {{route.fallback()}} | bỏ qua handler này, để handler **đăng ký trước** quyết định | "ghi đè" cục bộ một URL, giữ rule chung |

### Glob: cách Playwright viết "URL nào"
{{page.route}} dùng **glob**, không dùng regex. Ba ký tự đặc biệt và một quy tắc ưu tiên:

~~~text
**            bat ky gi, KE CA dau chay /        **/api/**        -> moi thu duoi /api/
*             bất kỳ gì, KHÔNG đi qua dấu chéo    /api/*/items     -> chỉ một đoạn trung gian
?             ĐÚNG một ký tự, không phải dấu chéo  /v?/list         -> /v1/list ok, /v12/list rồi
ky tu khac    so nguyen van (dau . cung la ky tu thuong)
~~~

*Quy tắc ưu tiên:* nếu nhiều route cùng khớp một URL, **route đăng ký sau thắng**. Đây là nguồn nhầm lẫn số một: bạn thêm {{page.route("**/api/orders", ...)}} ở dòng 50 mà không biết ở dòng 120 có một route chung {{**/api/**}} — kết quả là handler chạy theo cái bạn *không nhìn thấy*. Vì vậy: đăng ký route **trước** {{page.navigate}} (request đã bay đi thì không chặn kịp), đặt route chung trước, route riêng sau, và gọi {{page.unroute(glob)}} khi dọn dẹp. {{context.route}} áp dụng cho mọi page trong context — tiện cho "chặn toàn bộ analytics cho cả suite", nhưng khó lần hơn.

### Tiêm lỗi — phần khiến mock đáng giá nhất
~~~java
// 1) Server lỗi: UI phải hiện "Không tải được danh sách" + nút Thử lại
page.route("**/api/orders*", (route, request) -> route.fulfill(
        new Route.FulfillOptions().setStatus(500).setContentType("application/json")
                .setBody("{\\"code\\":\\"ORDER_SERVICE_DOWN\\"}")));

// 2) Mat ket noi: request chet nhu that, JS cua trang buoc vao nhanh catch
page.route("**/api/**", (route, request) -> route.abort());

// 3) Chậm đến mức timeout: abort với mã lỗi timedout mô phỏng network timeout
page.route("**/api/checkout", (route, request) ->
        route.abort(new Route.AbortOptions().setErrorCode("timedout")));

// 4) Cho đi thật, nhưng xin xem request để debug
page.route("**/api/**", (route, request) -> {
    System.out.println(request.method() + " " + request.url());
    route.continue_();
});
~~~

Viết {{Thread.sleep(3000)}} trong handler để "làm chậm" cũng mô phỏng được, nhưng nó **chiếm thread dispatch** và cộng thẳng 3 giây vào test; muốn test logic timeout thì {{abort("timedout")}} rẻ và đúng nghĩa hơn. Muốn test cả nhánh "request đi được nửa đường thì đứt", mock không làm được — đó là việc của tầng integration.

### Replay HAR: cho UI chạy bằng "băng ghi hình" của một phiên thật
**HAR** (HTTP Archive) là file JSON ghi lại **toàn bộ phiên bấm thật**: mỗi request kèm URL, header, status, body response. Playwright có thể thu ({{setRecordHarPath}} khi tạo context) và phát lại ({{page.routeFromHAR(Paths.get("qa/recorded.har"))}}): trang gọi URL nào thì trả đúng nội dung đã ghi, không cần server.

~~~java
// Thu: context se ghi lai moi lan len mang vao file HAR
Browser.NewContextOptions rec = new Browser.NewContextOptions()
        .setRecordHarPath(Paths.get("qa/har/checkout-session.har"));
// Phat: moi lan test mo trang, request duoc tra tu file HAR
page.routeFromHAR(Paths.get("qa/har/checkout-session.har"));
~~~

Dùng khi: backend chưa xong nhưng đã có bản recording từ môi trường dev, hoặc cần tái hiện một phiên production có lỗi. Rủi ro: HAR là **bản chụp của quá khứ** — schema API đổi là UI vẽ dữ liệu cũ mà test vẫn xanh; HAR cũng hay chứa token/PII, phải scrub trước khi commit.

### Khi nào mock, khi nào phải gọi backend thật
| Mục tiêu của test | Chọn | Vì sao |
|---|---|---|
| "UI có vẽ đúng trạng thái REFUNDED không", "có hiện toast khi API 500 không" | **mock** | trạng thái hiếm/hỏng, cần xác định và rẻ |
| "Đặt hàng xong thì đơn có vào DB, có cộng trừ tồn kho không" | **backend thật** (API test/integration) | mock tự trả dữ liệu do ta viết → test không thể thấy server sai |
| Kiểm tra **hợp đồng** giữa FE và BE (tên field, kiểu data) | **thật + schema check** | mock khớp **đoán** của QA; đoán sai thì CI xanh, production đỏ |
| Luồng có tiền thật / OTP / cổng thanh toán | stub bên thứ ba, phần còn lại thật | không được gọi thật, nhưng vẫn phải test tích hợp của mình |
| Smoke trước release | **thật, không mock gì** | vai trò của smoke là chứng minh hệ thống thật sống |

Câu thần chú: *mock trả lời "code của tôi xử lý ra sao khi nhận đáp án X"; test thật trả lời "X có thực sự trả đáp án đó không"*. Đừng bao giờ để một UI test mock **toàn bộ** API rồi assert "đơn hàng đã tạo thành công" — bạn vừa test chính JSON mình viết.

### Luồng một lần mock trong test

~~~seq
title: Test UI dung page.route
actors: Test | Browser | Handler | Backend
Test -> Browser: page route voi glob va handler
Test -> Browser: page navigate toi /orders
Browser -> Handler: GET **/api/orders*
Handler --> Browser: fulfill JSON gia status 200
Handler -> Backend: continue_ neu cho di that
Backend --> Browser: 200 du lieu that
Browser --> Test: UI ve theo du lieu ta da chon
note Handler..Backend: mock quyet truoc khi server biet co request
~~~

### Bốn lỗi hay gặp
- **Mock cả hệ thống rồi test "end-to-end".** Tên test nói E2E, code nói "không ai gọi ai". Giữ mock cho nhánh hiếm, còn luồng sống còn thì gọi thật (hoặc chạy ở tầng API).
- **Đăng ký route sau khi navigate.** Request đầu tiên của trang đã bay; UI render dữ liệu thật, test fail khó hiểu. Route luôn trước navigation.
- **Glob quá rộng**: {{**/*}} chặn cả ảnh, font, script → trang vỡ, lỗi hiển thị thành lỗi test. Chỉ chặn đúng URL API cần.
- **Body mock lệch schema thật.** Viết JSON bằng tay dễ sai tên field, thiếu field; một thời gian sau FE đổi contract, mock vẫn cũ, test xanh giả tạo. Sinh mock từ OpenAPI/JSON Schema, hoặc từ một file HAR đã scrub.
- **Quên mock chỉ áp dụng cho page hiện tại**: tạo page mới trong cùng test thì route cũ không còn; route gắn ở {{context}} mới áp cho mọi page.

### Liên hệ phỏng vấn
- "Test UI của bạn không phụ thuộc backend bằng cách nào?" → {{page.route}} cho dữ liệu hiển thị + nhánh lỗi, kết hợp storage state để khỏi login; nói rõ phần nào vẫn phải thật.
- "Làm sao test cảnh báo mất kết nối?" → {{route.abort("timedout")}} hoặc {{abort()}}, không dùng {{Thread.sleep}}.
- "Backend chưa xong, QA làm gì?" → dựng mock theo OpenAPI ({{route.fulfill}}) hoặc replay HAR, song song với việc viết API test; nói thêm rủi ro drift.
- "Mock có đánh lừa CI không?" → có, và đó là lý do cần một smoke test không mock nào cả ở mỗi pipeline.

> Senior tip: chuẩn hoá bằng một helper dạng {{mockApi(page, "**/api/orders", 200, json)}} thay vì rải {{page.route}} khắp test, và **commit file JSON mock cùng chỗ với OpenAPI spec** để khi contract đổi là mock đổi theo. Mẹo đáng giá nhất: mỗi suite UI nên có **một test cố tình mock 500 và một test mock timeout** — vì nhánh lỗi là chỗ dev hay quên, và nếu suite của bạn không bao giờ đi qua nó, nó sẽ mục dần.`,
  exercises: [
    {
      title: 'RouteTable: khớp URL theo glob (**/* và ?), route đăng ký sau thắng, không khớp thì continue, đếm số lần khớp',
      prompt: `Viết {{RouteTable}} — đúng phần lõi của {{page.route}}: bảng route, khớp URL theo glob, chọn route đăng ký muộn nhất, và bộ đếm để debug. Không mở socket, không gọi mạng, không đọc thời gian thực.

**Ngữ nghĩa glob** (giống Playwright, không có escape):
- {{"**"}}: bất kỳ chuỗi ký tự nào, **được phép** chứa dấu gạch chéo {{"/"}}, kể cả chuỗi rỗng. Hai hoặc nhiều dấu sao liền nhau tính là một {{"**"}}.
- {{"*"}}: bất kỳ chuỗi ký tự nào, **không được** chứa {{"/"}}, kể cả chuỗi rỗng.
- {{"?"}}: đúng **một** ký tự, ký tự đó không phải {{"/"}}.
- Mọi ký tự khác (kể cả {{.}} và {{:}}) so khớp **nguyên văn**.

**API phải có:**
- {{void route(String glob, String action)}}: thêm một route vào **cuối** bảng. {{action}} chỉ là nhãn chuỗi (vd {{"abort:failed"}}), không cần diễn giải.
- {{void unroute(String glob)}}: xoá **mọi** route có glob đúng bằng {{glob}} (so {{equals}}).
- {{String dispatch(String url)}}: trả {{action}} của route **khớp và được đăng ký muộn nhất**. Không route nào khớp, hoặc {{url}} là {{null}}: trả chuỗi {{"continue"}}.
- {{int hits(String glob)}}: số lần {{dispatch}} trả action của một route có glob đúng bằng {{glob}}. Đếm **theo glob**, nên hai route trùng glob gộp chung một bộ đếm. Con số **không** mất đi khi {{unroute}}.
- {{int unmatched()}}: số lần {{dispatch}} không có route nào khớp (kể cả lần {{url == null}}).

Ví dụ hành vi:

~~~text
route("**/api/*",     "fulfill:generic")
route("**/api/orders", "abort:failed")        ; dang ky SAU nen THANG

dispatch("https://x.test/api/orders")          -> abort:failed
dispatch("https://x.test/api/cart")            -> fulfill:generic
dispatch("https://x.test/app/main")            -> continue      (unmatched = 1)
hits("**/api/orders")                           -> 1
hits("**/api/*")                                -> 1
unroute("**/api/orders")
dispatch("https://x.test/api/orders")          -> fulfill:generic (ro ve route cu)
hits("**/api/orders")                           -> 1 (so cu khong bi reset)
~~~

Gợi ý triển khai: biểu diễn mỗi route bằng một record nhỏ (glob + action); {{dispatch}} duyệt bảng **từ đầu đến cuối** và giữ lại phần tử khớp cuối cùng. Phần khó thật sự là hàm khớp glob — thuật toán "con trỏ quay lui" kinh điển chỉ đúng khi {{*}} nuốt được mọi ký tự; ở đây {{*}} bị chặn bởi {{/}}, nên nó cho kết quả **sai**. Hãy duyệt bảng trạng thái {{can[i][j]}} = "i token đầu khớp với j ký tự đầu", hoặc tương đương bộ nhớ {{boolean[]}} hai hàng.`,
      starter: `final class RouteTable {
    void route(String glob, String action) {
        throw new UnsupportedOperationException("TODO");
    }

    void unroute(String glob) {
        throw new UnsupportedOperationException("TODO");
    }

    String dispatch(String url) {
        throw new UnsupportedOperationException("TODO");
    }

    int hits(String glob) {
        throw new UnsupportedOperationException("TODO");
    }

    int unmatched() {
        throw new UnsupportedOperationException("TODO");
    }
}`,
      tests: `public class Main {
    static int passed = 0, total = 0;
    static void check(String name, boolean ok, String detail) {
        total++;
        if (ok) { passed++; System.out.println("PASS " + name); }
        else System.out.println("FAIL " + name + ": " + detail);
    }
    public static void main(String[] args) {
        RouteTable list = new RouteTable();
        list.route("**/api/orders*", "fulfill:orders-list");
        String a1 = list.dispatch("https://shop.test/api/orders?status=new");
        check("**/api/orders* khop URL co query", "fulfill:orders-list".equals(a1), "got " + a1);
        check("hits tang dung theo glob", list.hits("**/api/orders*") == 1, "hits=" + list.hits("**/api/orders*"));
        check("glob chua tung khop co hits bang 0", list.hits("**/api/cart") == 0, "hits=" + list.hits("**/api/cart"));

        RouteTable prec = new RouteTable();
        prec.route("**/api/*", "fulfill:generic");
        prec.route("**/api/orders", "abort:failed");
        String a2 = prec.dispatch("https://x.test/api/orders");
        check("route dang ky sau thang", "abort:failed".equals(a2), "got " + a2);
        String a3 = prec.dispatch("https://x.test/api/cart");
        check("không khớp rõ ràng thì rơi xuống route trước đó", "fulfill:generic".equals(a3), "got " + a3);
        String a4 = prec.dispatch("https://x.test/app/main");
        check("không route nào khớp thì continue", "continue".equals(a4), "got " + a4);
        check("unmatched dem duoc 1", prec.unmatched() == 1, "unmatched=" + prec.unmatched());
        String a5 = prec.dispatch(null);
        check("url null coi nhu khong khop va dem unmatched", "continue".equals(a5) && prec.unmatched() == 2, "unmatched=" + prec.unmatched());
        check("unmatched khong tang cho lan khop", prec.unmatched() == 2, "unmatched=" + prec.unmatched());

        RouteTable seg = new RouteTable();
        seg.route("https://shop.test/*/orders", "fulfill:one-segment");
        String b1 = seg.dispatch("https://shop.test/tenant1/orders");
        check("dau sao don khop mot doan duong dan", "fulfill:one-segment".equals(b1), "got " + b1);
        String b2 = seg.dispatch("https://shop.test/a/b/orders");
        check("dấu sao đơn không được vượt dấu chéo", "continue".equals(b2), "got " + b2);
        String b3 = seg.dispatch("https://shop.test//orders");
        check("dấu sao rỗng vẫn khớp nên hai dấu chéo liền kề đi được", "fulfill:one-segment".equals(b3), "got " + b3);

        RouteTable deep = new RouteTable();
        deep.route("**/img/**", "fulfill:under-img");
        deep.route("**/img/*.png", "fulfill:flat-png");
        String c1 = deep.dispatch("https://cdn.test/img/x.png");
        check("duong dan phang thi **/img/*.png thang", "fulfill:flat-png".equals(c1), "got " + c1);
        String c2 = deep.dispatch("https://cdn.test/img/a/b/x.png");
        check("duong dan sau roi ve **", "fulfill:under-img".equals(c2), "got " + c2);

        RouteTable one = new RouteTable();
        one.route("**/orders*", "fulfill:tail");
        String d1 = one.dispatch("https://x.test/orders");
        check("dau sao khop duoi rong", "fulfill:tail".equals(d1), "got " + d1);

        RouteTable qm = new RouteTable();
        qm.route("**/v?/list", "fulfill:versioned");
        String e1 = qm.dispatch("https://api.test/v1/list");
        check("? khớp đúng một ký tự", "fulfill:versioned".equals(e1), "got " + e1);
        String e2 = qm.dispatch("https://api.test/v12/list");
        check("? khong khop hai ky tu", "continue".equals(e2), "got " + e2);
        String e3 = qm.dispatch("https://api.test/v//list");
        check("? không khớp dấu chéo", "continue".equals(e3), "got " + e3);

        RouteTable dot = new RouteTable();
        dot.route("**/a.b", "fulfill:dot");
        String f1 = dot.dispatch("https://x.test/a.b");
        check("dau cham la ky tu thuong", "fulfill:dot".equals(f1), "got " + f1);
        String f2 = dot.dispatch("https://x.test/aXb");
        check("dấu chấm không phải wildcard", "continue".equals(f2), "got " + f2);

        RouteTable cnt = new RouteTable();
        cnt.route("**/api/orders", "abort:failed");
        cnt.route("**/assets/**", "fulfill:assets");
        cnt.dispatch("https://x.test/api/orders");
        cnt.dispatch("https://x.test/api/orders");
        cnt.dispatch("https://x.test/assets/app.js");
        check("hits cong dun theo tung glob", cnt.hits("**/api/orders") == 2 && cnt.hits("**/assets/**") == 1,
            "orders=" + cnt.hits("**/api/orders") + " assets=" + cnt.hits("**/assets/**"));
        cnt.unroute("**/api/orders");
        String g1 = cnt.dispatch("https://x.test/api/orders");
        check("sau unroute thi roi ve continue", "continue".equals(g1), "got " + g1);
        check("unroute không reset số lần khớp của qua", cnt.hits("**/api/orders") == 2, "hits=" + cnt.hits("**/api/orders"));
        check("unroute khong cham vao glob khac", cnt.hits("**/assets/**") == 1, "assets=" + cnt.hits("**/assets/**"));
        check("unmatched tang sau unroute", cnt.unmatched() == 1, "unmatched=" + cnt.unmatched());

        RouteTable dup = new RouteTable();
        dup.route("**/x", "first");
        dup.route("**/x", "second");
        String h1 = dup.dispatch("https://y.test/x");
        check("hai route trung glob thi cai sau thang, hits tinh chung", "second".equals(h1) && dup.hits("**/x") == 1,
            "got " + h1 + " hits=" + dup.hits("**/x"));

        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
      reference: `final class RouteTable {
    private static final class Entry {
        final String glob;
        final String action;

        Entry(String glob, String action) {
            this.glob = glob;
            this.action = action;
        }
    }

    private final List<Entry> entries = new ArrayList<>();
    private final Map<String, Integer> counters = new LinkedHashMap<>();
    private int missCount = 0;

    void route(String glob, String action) {
        entries.add(new Entry(glob, action));
    }

    void unroute(String glob) {
        entries.removeIf(e -> e.glob.equals(glob));
    }

    String dispatch(String url) {
        Entry winner = null;
        if (url != null) {
            for (Entry e : entries) {
                if (globMatch(e.glob, url)) winner = e;
            }
        }
        if (winner == null) {
            missCount++;
            return "continue";
        }
        counters.merge(winner.glob, 1, Integer::sum);
        return winner.action;
    }

    int hits(String glob) {
        return counters.getOrDefault(glob, 0);
    }

    int unmatched() {
        return missCount;
    }

    private static boolean globMatch(String pattern, String url) {
        String[] tokens = tokenize(pattern);
        int n = url.length();
        boolean[] prev = new boolean[n + 1];
        prev[0] = true;
        for (String tk : tokens) {
            boolean star = tk.equals("*") || tk.equals("**");
            boolean crossesSlash = tk.equals("**");
            boolean[] cur = new boolean[n + 1];
            cur[0] = star && prev[0];
            for (int j = 1; j <= n; j++) {
                char c = url.charAt(j - 1);
                if (star) {
                    cur[j] = prev[j] || (cur[j - 1] && (crossesSlash || c != '/'));
                } else {
                    cur[j] = prev[j - 1] && (tk.equals("?") ? c != '/' : tk.charAt(0) == c);
                }
            }
            prev = cur;
        }
        return prev[n];
    }

    private static String[] tokenize(String pattern) {
        List<String> out = new ArrayList<>();
        int i = 0;
        while (i < pattern.length()) {
            char c = pattern.charAt(i);
            if (c == '*') {
                int j = i;
                while (j < pattern.length() && pattern.charAt(j) == '*') j++;
                out.add(j - i >= 2 ? "**" : "*");
                i = j;
            } else {
                out.add(String.valueOf(c));
                i++;
            }
        }
        return out.toArray(new String[0]);
    }
}`,
      hints: [
        'Biểu diễn mỗi route bằng một lớp {{private static final class Entry}} giữ hai field final (glob, action), đựng trong {{ArrayList<Entry>}} theo thứ tự đăng ký. {{dispatch}} duyệt xuôi và ghi {{winner = e}} mỗi lần thấy một route khớp — sau vòng lặp, {{winner}} chính là route đăng ký muộn nhất.',
        'Đếm theo glob thì dùng {{Map<String, Integer>}} với {{counters.merge(glob, 1, Integer::sum)}}; {{hits}} là {{counters.getOrDefault(glob, 0)}}. Đừng đếm theo action: hai route trùng glob phải dùng chung một bộ đếm.',
        'Khớp glob bằng bảng trạng thái. Gọi {{can[i][j]}} nghĩa là "{{i}} token đầu của pattern khớp với {{j}} ký tự đầu của url". Khởi tạo {{can[0][0] = true}}. Token thường hoặc {{?}}: {{can[i][j] = can[i-1][j-1] && kyTuKhop}}. Token {{**}}: {{can[i][j] = can[i-1][j] || can[i][j-1]}} (hoặc nó nối không ở đây, hoặc nó ăn thêm một ký tự bất kỳ). Token {{*}}: {{can[i][j] = can[i-1][j] || (can[i][j-1] && kyTuKhacDauChay)}}.',
        'Không cần ma trận đầy đủ: mỗi hàng chỉ phụ thuộc hàng liền trước, nên giữ hai mảng {{boolean[] prev}} và {{boolean[] cur}} là đủ. Nhớ đặt {{cur[0] = prev[0]}} khi token là dấu sao (dấu sao khớp chuỗi rỗng), ngược lại {{cur[0] = false}}.',
        'Khi tokenize, gom chuỗi dấu sao liền nhau thành một token {{**}} duy nhất — nếu không, {{***}} sẽ sinh ra các token trung gian không ai xử lý và kết quả phụ thuộc cách bạn tình cờ cắt chuỗi.',
        'Tự kiểm tra matcher bằng hai ca dễ: {{globMatch("*/orders", "a/b/orders")}} phải trả về {{false}} (dấu sao đơn không được qua dấu gạch chéo), còn {{globMatch("**/*/orders", "https://h.test/a/b/orders")}} phải trả về {{true}} ({{**}} ăn {{https://h.test/a}}, dấu sao đơn ăn {{b}}). Nếu thuật toán của bạn trả {{true}} cho ca thứ nhất, nhiều khả năng bạn đang dùng con trỏ quay lui kinh điển — xem phần giải thích.',
      ],
      explain: `**Vì sao không dùng thuật toán quay lui kinh điển?** Bài toán wildcard quen thuộc ({{*}} nuốt mọi ký tự) giải được bằng hai con trỏ cộng **một** điểm quay lui, vì kéo dài dấu sao luôn luôn khả thi. Ở đây {{*}} bị chặn bởi {{/}}, nên giả định đó vỡ: với pattern {{*/orders}} và url {{a/b/orders}}, con trỏ quay lui kéo {{*}} ăn {{a/b}} rồi thấy {{/orders}} khớp và trả {{true}}, trong khi đáp án đúng là {{false}} ({{*}} không được đi qua {{/}}). Chiều ngược lại cũng sai: pattern {{**/*/orders}} với {{https://h.test/a/b/orders}} là khớp, nhưng nếu bộ nhớ chỉ giữ dấu sao **cuối cùng** thì khi kẹt ở {{/}} nó chịu thua và trả {{false}}. Muốn quay lui đúng bạn phải nhớ mọi dấu sao và mọi cách chia — tức là đang viết lại quy hoạch động một cách vụng về. Bảng trạng thái {{O(t x n)}} (t là số token, n là độ dài url) ngắn, dễ kiểm chứng và không có trường hợp ẩn. Bài học để nói trong phỏng vấn: **tham lam chỉ đúng khi tập lựa chọn không bị ràng buộc thêm**; vừa có điều kiện "không qua dấu gạch chéo" là phải chuyển sang quy hoạch động.

**Vì sao "route sau thắng" là thứ đáng học.** Playwright chọn handler **đăng ký muộn nhất** trong số các handler khớp; {{route.fallback()}} tồn tại để chủ động nhường cho handler đăng ký trước. Bài tập cố tình chỉ có quy tắc "duyệt xuôi, giữ phần tử khớp cuối" — nếu bạn triển khai "duyệt ngược, trả ngay khi khớp" thì mọi test về độ ưu tiên sẽ đỏ. Trên dự án thật, đúng cơ chế này làm QA mất vài giờ: một route chung {{**/api/**}} đăng ký ở {{@BeforeEach}} **nuốt** route riêng đăng ký ở dòng 40 nếu dòng 40 chạy trước; muốn route riêng thắng thì nó phải được đăng ký **sau**.

**Ba chi tiết nhỏ hay bị bỏ sót.**
1. {{*}} khớp **cả chuỗi rỗng**, nên {{**/orders*}} vẫn khớp url kết thúc đúng bằng {{orders}}. Nhiều người viết matcher bắt buộc {{*}} phải ăn ít nhất một ký tự.
2. Đếm theo **glob** chứ không theo action: hai route cùng glob (rất hay xảy ra khi hai helper cùng đăng ký một rule) dùng chung một bộ đếm, và bộ đếm là **lịch sử** — {{unroute}} xoá rule nhưng không xoá bằng chứng rule đó từng khớp.
3. {{url == null}} phải được coi là "không khớp" và **vẫn đếm unmatched**: trong Playwright, handler nhận request luôn có URL, nhưng một helper của bạn có thể truyền {{null}} do bug, và unmatched() tăng là tín hiệu sớm.

**Dùng bài này để debug test thật.** Khi một UI test lạ lạ, thứ bạn cần biết không chỉ là "mock nào chạy" mà là "URL này có khớp rule nào không, khớp bao nhiêu lần". Thêm đúng hai bộ đếm {{hits}} và {{unmatched}} vào wrapper {{page.route}} của framework, bạn sẽ thấy ngay: {{unmatched}} tăng nghĩa là trang đã đổi đường dẫn API (FE refactor, thêm /v2/), còn {{hits}} của rule chung tăng nghĩa là rule riêng của bạn chưa bao giờ được chạy — cả hai là hai lớp lỗi hoàn toàn khác nhau.`,
    },
  ],
  check: [
    {
      q: 'Hai route cùng khớp một URL: {{page.route("**/api/**", A)}} đăng ký trước, {{page.route("**/api/orders", B)}} đăng ký sau. Khi trang gọi /api/orders, handler nào chạy?',
      options: [
        'A, vì rule chung luôn được ưu tiên để bắt mọi request',
        'B, vì route đăng ký sau thắng; muốn nhường cho A thì B gọi route.fallback()',
        'Cả hai chạy tuần tự A rồi B',
        'Playwright ném lỗi vì hai route trùng nhau',
      ],
      answer: 1,
      explain: 'Playwright giữ một danh sách route và chọn handler **đăng ký muộn nhất** mà khớp. {{route.fallback()}} là cách chủ động bỏ qua handler hiện tại để handler trước quyết định. Đây là lý do nên đăng ký route chung trước, route riêng sau.',
    },
    {
      q: 'Glob {{"/api/*/items"}} khớp URL nào sau đây?',
      options: [
        '{{/api/42/items}} và {{/api/42/x/items}}',
        'chỉ {{/api/42/items}}, vì {{*}} không đi qua dấu {{/}}',
        'chỉ {{/api/*/items}} theo nghĩa đen',
        'không khớp cái nào, phải viết {{**}}',
      ],
      answer: 1,
      explain: '{{*}} nuốt mọi ký tự **trừ** {{/}}, còn {{**}} mới nuốt được {{/}}. Muốn phủ nhiều cấp thì viết {{/api/**/items}}. Dấu {{.}} và {{:}} là ký tự thường, không phải wildcard.',
    },
    {
      q: 'Mục tiêu test là "đặt hàng xong đơn được lưu và trừ tồn kho". Chiến lược nào đúng?',
      options: [
        'Mock {{POST /api/orders}} trả 200 để test chạy nhanh và ổn định',
        'Gọi backend thật (hoặc API test ở tầng integration), UI test chỉ mock phần hiển thị không liên quan',
        'Mock toàn bộ API rồi assert danh sách đơn có bản ghi mới',
        'Chụp màn hình và so ảnh',
      ],
      answer: 1,
      explain: 'Mock tự trả chính dữ liệu bạn viết, nên nó không thể phát hiện server không ghi DB hay không trừ tồn kho — test sẽ xanh dù backend chết. Mock hợp lý cho **trạng thái hiển thị hiếm** và **nhánh lỗi**, không hợp lý cho **tính đúng đắn phía server**.',
    },
    {
      q: 'Replay HAR ({{page.routeFromHAR}}) có rủi ro gì nghiêm trọng nhất?',
      options: [
        'HAR chạy chậm hơn gọi API thật',
        'HAR là bản chụp quá khứ: schema API đổi thì UI vẫn nhận dữ liệu cũ và test tiếp tục xanh; file còn dễ chứa token/PII',
        'HAR không chứa được response body',
        'HAR chỉ dùng được với Selenium',
      ],
      answer: 1,
      explain: 'Đúng là HAR ghi cả request và response, dùng được offline; vấn đề là tính **nguồn** của nó. Phải scrub secret trước khi commit, và cập nhật/regenerate HAR khi contract đổi — hoặc giới hạn HAR cho test khám phá, không dùng làm smoke.',
    },
  ],
  related: ['autotest-023', 'autotest-025', 'autotest-008'],
  tags: ['page.route', 'network mock', 'glob', 'fulfill', 'abort', 'timeout', 'HAR replay', 'Playwright', 'UI test'],
},
{
  id: 'lesson-autotest-014',
  track: 'autotest',
  order: 14,
  title: 'Visual regression: so ảnh chụp màn hình với baseline, pixel diff, ngưỡng, vùng mask và nguồn flaky',
  level: 'senior',
  minutes: 40,
  goals: [
    'Giải thích được ảnh nằm trong máy tính thế nào (pixel, RGB, số nguyên packed) và vì sao phải so từng kênh',
    'Phân biệt ngưỡng theo pixel (maxDiffPixels), theo tỉ lệ (maxDiffPixelRatio) và theo cường độ màu (tolerance)',
    'Viết được vùng mask cho dữ liệu động mà không che mất lỗi thật',
    'Kể được ít nhất năm nguyên nhân làm visual test flaky và cách khắc phục tương ứng',
    'Thiết kế quy trình baseline: ai duyệt, lưu ở đâu, cập nhật khi nào',
  ],
  body: `**Tóm tắt:** **Visual regression testing** (kiểm tra hồi quy hình ảnh) trả lời một câu hỏi mà assertion thông thường không với tới: "trang **trông có bị đổi không**". Cách làm: chụp màn hình một trạng thái đã biết, lưu bản được duyệt làm **baseline** (ảnh chuẩn), những lần sau chụp lại và **so từng pixel** với baseline; khác quá ngưỡng thì FAIL kèm một ảnh diff chỉ chỗ đổi. Nó bắt được lỗi CSS làm nút chồng lên nhau, icon mất, font tụt về font hệ thống, bảng bị tràn — những thứ mà {{isVisible()}} và {{toHaveText()}} hoàn toàn im lặng. Cái giá: **flaky**. Khác biệt nhỏ về font, anti-aliasing, dữ liệu động đều sinh ra pixel khác, nên toàn bộ nghệ thuật của visual test nằm ở **ngưỡng**, **vùng mask** và **sự ổn định của môi trường dựng ảnh**.

### Ví dụ đời thường
Bạn in tờ rơi chương trình khuyến mãi. Bản in tuần này so với tuần trước: nếu cả tiêu đề bị lệch 3 mm thì mắt bạn thấy ngay, nhưng nếu **một chữ** trong chân trang đổi font thì phải soi rất lâu. Máy làm ngược lại: nó đếm được "5.312 pixel khác, tập trung ở góc dưới trái" trong 20 mili giây, nhưng nó **không biết** chữ nhỏ hơn là cố ý hay là lỗi. Vì thế quy trình luôn có một con người bấm "approve" cho thay đổi hợp lệ, và con người đó phải nhìn ảnh diff, không nhìn thông báo PASS.

### Ảnh nằm trong máy tính như thế nào
**Pixel** = một điểm ảnh, ô vuông nhỏ nhất màn hình hiển thị được. Mỗi pixel lưu ba **kênh màu** (channel): đỏ, lục, lam, mỗi kênh một số nguyên 0–255. Kiểu gói gọn hay dùng trong code: một số nguyên 24 bit, thường viết hex {{0xRRGGBB}} — kênh đỏ nằm ở 8 bit cao nhất (bit 16–23), lục ở bit 8–15, lam ở bit 0–7. Ví dụ {{0xFF0000}} là đỏ thuần, {{0xFFFFFF}} trắng, {{0x000000}} đen.

~~~java
int px = 0xFF8800;                      // da cam: R=255, G=136, B=0
int r = (px >> 16) & 0xFF;              // dich 16 bit roi lay 8 bit thap
int g = (px >> 8) & 0xFF;
int b = px & 0xFF;
// So sanh hai anh: lech theo tung kenh, khong so nguyen 24 bit
int dr = Math.abs(ra - rb);             // R = 255 vs 250 -> dr = 5
int maxLech = Math.max(dr, Math.max(dg, db));
boolean khacNhau = maxLech > tolerance; // tolerance = cường độ chấp nhận được
~~~

**Tolerance** (ngưỡng cường độ, theo từng kênh) khác với **số pixel được phép khác**. Hai khái niệm này hay bị lẫn, và cả hai công cụ lớn đều có:
| Loại ngưỡng | Ý nghĩa | Dùng khi |
|---|---|---|
| {{tolerance}} / {{colorThreshold}} (0–255 mỗi kênh) | một pixel được coi là **giống nhau** dù màu lệch nhẹ | anti-aliasing, nén JPEG/PNG, subpixel |
| {{maxDiffPixels}} (số pixel) | cho phép một **số lượng** pixel khác hẳn | ảnh có vài điểm nhiễu |
| {{maxDiffPixelRatio}} (0–1) | cho phép **tỉ lệ** pixel khác, ví dụ 0.01 = 1% | suite chạy nhiều màn hình kích thước khác nhau |

Playwright Java (các bản gần đây) có assertion {{Assertions.assertThat(page).hasScreenshot("checkout-cart", options)}} với {{setThreshold}}, {{setMaxDiffPixelRatio}}, {{setMaxDiffPixels}}, {{setMask}}, {{setClip}}, {{setOmitAnimations(true)}}; {{page.screenshot(new Page.ScreenshotOptions().setPath(...).setFullPage(true))}} thì bản nào cũng có. Nếu bạn ở bản cũ hoặc muốn tự kiểm soát, chạy công cụ CLI ({{reg-cli}}, {{BackstopJS}}) hoặc **tự viết bộ so như bài tập** — viết xong một lần là hiểu mãi mãi.

### Vì sao font và anti-aliasing sinh ra kết quả lúc xanh lúc đỏ
**Anti-aliasing** (khử răng cưa): để cạnh chữ/xiên trông mượt, trình duyệt tô các pixel biên bằng màu **trung gian** giữa màu chữ và nền, dựa trên vị trí **phân số** của nét chữ so với lưới pixel. Chỉ cần vị trí đó dịch 0,2 pixel, hàng chục pixel biên đổi màu — dù mắt người thấy y hệt. Những thứ dịch vị trí đó:
- **Font khác file hoặc khác hệ thống dựng ký tự**: CI dùng Docker {{node:20}} không cài font của máy dev → browser rơi về **fallback font**, mọi chữ đổi hình dạng. Đây là nguồn flaky số một.
- **Font hinting / subpixel rendering** khác nhau giữa Windows, Linux, macOS; khác giữa {{antialiased}} và {{subpixel-antialiased}} trong CSS.
- **Kích cỡ thiết bị (device scale factor)**: ảnh chụp ở DPR 1 và DPR 2 khác nhau toàn bộ số pixel.
- **Nội dung đổi độ dài**: con số {{1.234}} đổi thành {{9.876}} làm ô rộng thêm một ký tự, cả dòng dịch → diff lan ra vùng không liên quan.
- **Animation, transition, cursor nhấp nháy trong ô input, carousel tự chạy, lazy-load ảnh chưa xong** — chụp lúc 300 ms khác lúc 900 ms.
- **Thanh cuộn**: nội dung cao hơn viewport thì có/không có scrollbar, dịch toàn bộ layout 15 pixel.
- **Đồng hồ / phiên ngẫu nhiên / quảng cáo thật** trong trang.

Cách xử lý, theo thứ tự hiệu quả: (1) chạy **cùng một Docker image** cho cả lúc tạo baseline và lúc so; (2) cài font cố định trong image ({{fc-list}} để kiểm tra); (3) tắt animation ({{prefers-reduced-motion}} hoặc {{setOmitAnimations(true)}}); (4) khóa dữ liệu: cùng một seed, mock API (bài trước) để con số không đổi; (5) {{page.waitForLoadState('networkidle')}} và chờ web font xong ({{document.fonts.ready}}) trước khi chụp; (6) mask vùng còn lại vẫn động; (7) đặt tolerance hợp lý thay vì 0.

### Vùng mask: che dữ liệu động, đừng che lỗi
**Mask** (còn gọi là ignore region) là một hình chữ nhật {{x, y, w, h}} tính theo tọa độ pixel mà bộ so **bỏ hoàn toàn** — không đếm vào số pixel khác, cũng không đếm vào tổng số pixel được so.

~~~text
+--------------------------------------+
| San pham            Gia      [X]     |   <- mask avatar + ten user dang nhap
|--------------------------------------|
| O-1    Ao Thom      199.000   12/11  |   <- mask cot "ngay dat" (dong voi mock)
| O-2    Mu  <- mask gia label do PROMOTION sinh ra
~~~

Hai kỹ thuật định nghĩa vùng mask, và chúng đánh đổi khác nhau:
- **Tọa độ cứng** ({{setClip}} / mask theo pixel): đơn giản, vỡ ngay khi layout dịch 10 pixel.
- **Mask theo phần tử** ({{locator("...")}}, như Playwright nhận {{Locator}} trong {{setMask}}): bám theo phần tử nên sống sót khi layout đổi, nhưng cần phần tử có {{data-testid}}.

Nguyên tắc: mask **càng hẹp càng tốt**. Mask cả một khối bảng vì "có một cột đổi" thường che luôn lỗi mất cột. Nếu vùng động quá lớn, vấn đề nằm ở **dữ liệu**, không phải ở visual test — đi mock nó ({{page.route}}) thay vì mask nó.

### Quy trình baseline: phần "vận hành" quyết định thành bại
~~~seq
title: Mot vong do visual regression
actors: Test | Browser | Engine | Baseline
Test -> Browser: mở trang với dữ liệu đã mock
Test -> Browser: cho network idle va font xong
Browser --> Engine: anh PNG cua man hinh
Engine -> Baseline: doc anh chuan duoc duyet lan cuoi
Baseline --> Engine: PNG baseline cung Docker image
Engine --> Test: so pixel khac vuot nguong thi FAIL
Engine -> Baseline: ghi anh diff va anh moi cho nguoi xem
note Engine..Baseline: người approve thì baseline bị đè thay
~~~

Ba quyết định phải viết thành văn bản trong team: **ai được cập nhật baseline** (không phải mọi QA, vì người update có thể "tắt đèn" cho CI xanh); **baseline lưu ở đâu** (git + Git LFS, hoặc object storage theo version giao diện — lưu trong D:\\tmp thì mất khi runner chết); và **diff được xem ở đâu** (một job CI đăng ảnh actual/baseline/diff lên báo cáo, nếu không thì không ai đọc FAIL). Khi một FAIL hợp lệ bị approve, hãy gắn nó với **mã commit/PR** gây ra thay đổi — về sau đây là cách trả lời câu "change này làm giao diện đổi từ bao giờ".

### Khi nào visual test đáng, khi nào không
| Tình huống | Kết luận |
|---|---|
| Trang marketing, design system, email template, biểu đồ | **rất đáng**: lỗi hình ảnh là lỗi sản phẩm |
| Màn hình có quá nhiều dữ liệu động, không mock được | không đáng: mask nhiều hơn so |
| Luồng nghiệp vụ lõi (thanh toán, đặt hàng) | để assertion DOM; visual chỉ chụp thêm như bằng chứng |
| Team nhỏ, CI không có image dựng chuẩn | chưa vội: baseline tạo trên máy dev sẽ đỏ khi chạy CI |
| Refactor CSS lớn có chủ đích | chạy **một lần** để chứng minh "không đổi gì ngoài ý muốn", rồi thôi |

### Bốn lỗi hay gặp
- **Tolerance = 0** để "an toàn tuyệt đối". Kết quả: suite đỏ vì font, người ta tắt suite. Ngưỡng 0 chỉ dùng được khi baseline và actual cùng sinh ra từ một Docker image đóng băng.
- **Tạo baseline trên máy dev, so trên CI** — hai hệ thống dựng font khác nhau, bạn vừa mua một bộ phát hiện... hệ điều hành.
- **So ảnh nguyên kích thước khi vị trí cuộn khác nhau**: ảnh chụp với {{setFullPage(true)}} khác hẳn ảnh chỉ chụp viewport; phải chọn một chế độ cố định cho cả baseline lẫn lần so.
- **Approve diff mà không nhìn ảnh**, chỉ để CI xanh. Mỗi lần approve là một lần bạn đồng ý "giao diện này đúng" — hãy coi diff như review code.
- **Mask theo tọa độ rồi refactor layout**: vùng mask cũ che vào vùng khác, lỗi lọt qua trong im lặng. Ưu tiên mask theo phần tử.

### Liên hệ phỏng vấn
- "Visual regression hoạt động thế nào?" → baseline + pixel diff + ngưỡng + con người duyệt; nói được anti-aliasing là lý do cần ngưỡng.
- "Test của bạn hay fail vì font, xử lý sao?" → đóng băng môi trường (Docker image chung cho baseline và run), cài font, tắt animation, khóa dữ liệu bằng mock, mask hẹp, đặt tolerance có căn cứ (đo trên 20 lần chạy ổn định rồi mới chọn).
- "Ngưỡng bao nhiêu là hợp lý?" → không có số thần thánh: với màn hình tĩnh, {{maxDiffPixels}} nhỏ; với danh sách có dữ liệu, {{maxDiffPixelRatio}} vài phần trăm; phải dựa vào phân bố diff của các lần chạy **sạch**.
- "Chi phí bảo trì?" → mỗi thay đổi giao diện là một lần duyệt baseline; đó là chi phí thật, và là lý do visual test sống tốt nhất ở design system / trang có tính ổn định cao.

> Senior tip: bật visual test **cùng với** một assert ngữ nghĩa trên cùng trạng thái (ví dụ "bảng có 3 dòng, tổng tiền 199.000"). Visual trả lời "trông có đổi không", DOM trả lời "dữ liệu có đúng không"; có cả hai thì khi FAIL bạn biết ngay nên tìm dev CSS hay dev API. Mẹo thứ hai: lưu **ảnh diff** (nơi khác được tô đỏ) làm artifact, không chỉ con số — người duyệt mất 3 giây để hiểu lỗi thay vì mở hai ảnh PNG ra soi.`,
  exercises: [
    {
      title: 'PixelDiff: so hai ảnh theo từng kênh màu, ngưỡng cường độ + ngưỡng tỉ lệ, vùng mask và bbox vùng thay đổi',
      prompt: `Viết {{PixelDiff}} — bộ so ảnh của visual regression, làm việc trên mảng hai chiều số nguyên gói màu {{0xRRGGBB}}. Không đọc file, không dùng thư viện ảnh, không gọi mạng, không đọc thời gian thực.

**Cách coi một ảnh**: {{int[][] a}} có {{a.length}} hàng và {{a[0].length}} cột (ảnh chữ nhật), mỗi phần tử là một pixel theo kiểu {{0xRRGGBB}} (mọi bit trên bit 23 bị bỏ qua). Kênh đỏ nằm ở 8 bit cao nhất của 24 bit (bit 16–23), lục ở bit 8–15, lam ở bit 0–7.

**Quy ước của bài** (đúng như vậy, đừng tự đổi):
- **Hai ảnh kích thước khác nhau** được so trên lưới {{rows = max(a.rows, b.rows)}}, {{cols = max(a.cols, b.cols)}}. Pixel nằm ngoài ảnh tương ứng được coi là **nền đen** {{0x000000}}. (Trong thực tế công cụ fail ngay khi lệch kích thước; ở đây ta quy ước nền đen cho đơn giản và để bộ so vẫn trả về con số.)
- Một pixel được coi là **khác** nếu {{max(|dr|, |dg|, |db|) > channelTolerance}}. So **từng kênh riêng**, không so nguyên 24 bit, và **không** lấy tổng.
- {{masks}} là mảng các {{int[]}} gồm 4 số {{x, y, w, h}} tính theo pixel: {{x}} là **cột**, {{y}} là **hàng**. Pixel nào nằm trong **bất kỳ** mask nào thì bị bỏ qua hoàn toàn: không so, không đếm vào {{compared}}.
- {{x}} hoặc {{y}} âm, hoặc {{w}}/{{h}} tràn ra ngoài ảnh: phần tràn bị cắt, tức mask được kẹp (clamp) cho vừa lưới. {{w}} hoặc {{h}} âm hoặc {{0}} = mask rỗng. Mask là {{null}} = không có vùng nào.

**1) Lớp {{PixelDiff.Report}}** (đây là kiểu trả về, hãy viết đầy đủ vì người chấm cần nó): constructor {{Report(int compared, int changed, double ratio, boolean pass)}}, bốn getter {{compared()}}, {{changed()}}, {{ratio()}}, {{pass()}}, và {{toString()}} in ra dạng {{compared=4 changed=1 ratio=0.25 pass=false}}.

**2) {{static Report compare(int[][] a, int[][] b, int channelTolerance, double maxDiffRatio, int[][] masks)}}**:
- {{compared}} = số pixel được đưa ra so (tức là **không** nằm trong mask) trên lưới chung.
- {{changed}} = số pixel trong số đó khác theo quy tắc kênh ở trên.
- {{ratio}} = {{changed / compared}} theo số thực; nếu {{compared == 0}} thì {{ratio = 0.0}}.
- {{pass}} = {{true}} khi {{ratio <= maxDiffRatio}}, với dung sai làm tròn {{1e-9}}.

**3) {{static int[] diffBounds(int[][] a, int[][] b, int channelTolerance, int[][] masks)}}**: hình chữ nhật nhỏ nhất **bao toàn bộ các pixel khác (đã bỏ qua vùng mask)**, trả về mảng 4 số nguyên theo thứ tự {{x}}, {{y}}, {{w}}, {{h}} ({{x}} = cột nhỏ nhất, {{y}} = hàng nhỏ nhất). Không có pixel nào khác thì trả {{4 số nguyên đều bằng 0}}.

Ví dụ:

~~~text
a = 2x2 toan bo 0xFFFFFF (trang)
b = nhu a nhung b[1][0] = 0xFF0000 (do)

compare(a, b, 0, 0.0, null)                      -> compared=4 changed=1 ratio=0.25 pass=false
compare(a, b, 0, 0.25, null)                     -> pass=true  (tỷ lệ đúng bằng ngưỡng)
compare(a, b, 0, 0.0, new int[][]{{0,1,1,1}})    -> compared=3 changed=0 pass=true (pixel do da bi mask)
diffBounds(a, b, 0, null)                        -> {0, 1, 1, 1}
diffBounds(a, a, 0, null)                        -> {0, 0, 0, 0}
~~~

Bẫy: nếu bạn so nguyên giá trị {{0xRRGGBB}} bằng {{!=}} thì {{channelTolerance}} trở thành vô nghĩa, và mọi thay đổi nhỏ nhất của anti-aliasing thành FAIL. Nếu bạn đếm mask vào {{compared}} thì {{ratio}} của ảnh có vùng động luôn lớn hơn thực tế và test đỏ oan.`,
      starter: `final class PixelDiff {
    static final class Report {
        private final int compared;
        private final int changed;
        private final double ratio;
        private final boolean pass;

        Report(int compared, int changed, double ratio, boolean pass) {
            this.compared = compared;
            this.changed = changed;
            this.ratio = ratio;
            this.pass = pass;
        }

        int compared() {
            return compared;
        }

        int changed() {
            return changed;
        }

        double ratio() {
            return ratio;
        }

        boolean pass() {
            return pass;
        }

        public String toString() {
            return "compared=" + compared + " changed=" + changed + " ratio=" + ratio + " pass=" + pass;
        }
    }

    static Report compare(int[][] a, int[][] b, int channelTolerance, double maxDiffRatio, int[][] masks) {
        throw new UnsupportedOperationException("TODO");
    }

    static int[] diffBounds(int[][] a, int[][] b, int channelTolerance, int[][] masks) {
        throw new UnsupportedOperationException("TODO");
    }
}`,
      tests: `public class Main {
    static int passed = 0, total = 0;
    static void check(String name, boolean ok, String detail) {
        total++;
        if (ok) { passed++; System.out.println("PASS " + name); }
        else System.out.println("FAIL " + name + ": " + detail);
    }
    static int[][] grid(int rows, int cols, int rgb) {
        int[][] g = new int[rows][cols];
        for (int r = 0; r < rows; r++) {
            for (int c = 0; c < cols; c++) g[r][c] = rgb;
        }
        return g;
    }
    static int[][] paint(int[][] g, int row, int col, int rgb) {
        g[row][col] = rgb;
        return g;
    }
    public static void main(String[] args) {
        int[][] white = grid(2, 2, 0xFFFFFF);
        PixelDiff.Report same = PixelDiff.compare(white, grid(2, 2, 0xFFFFFF), 0, 0.0, null);
        check("hai anh giong het: 0 khac, duoc so 4", same.changed() == 0 && same.compared() == 4 && same.pass(), "" + same);
        check("ratio bằng 0 khi không có gì khác", Math.abs(same.ratio()) < 1e-9, "" + same);

        int[][] one = paint(grid(2, 2, 0xFFFFFF), 1, 0, 0xFF0000);
        PixelDiff.Report d1 = PixelDiff.compare(white, one, 0, 0.0, null);
        check("mot pixel doi mau bi dem", d1.changed() == 1 && d1.compared() == 4, "" + d1);
        check("ratio 1 tren 4 la 0.25", Math.abs(d1.ratio() - 0.25) < 1e-9, "" + d1);
        check("vuot nguong 0.0 thi FAIL", !d1.pass(), "" + d1);
        PixelDiff.Report d2 = PixelDiff.compare(white, one, 0, 0.25, null);
        check("ratio đúng bằng ngưỡng thì PASS", d2.pass(), "" + d2);

        int[][] softBlue = paint(grid(1, 1, 0x000000), 0, 0, 0x000005);
        PixelDiff.Report tol10 = PixelDiff.compare(grid(1, 1, 0x000000), softBlue, 10, 0.0, null);
        check("nguong kenh 10 coi lech 5 la giong", tol10.changed() == 0 && tol10.pass(), "" + tol10);
        PixelDiff.Report tol3 = PixelDiff.compare(grid(1, 1, 0x000000), softBlue, 3, 0.0, null);
        check("nguong kenh 3 thi lech 5 la khac", tol3.changed() == 1, "" + tol3);

        int[][] red10 = paint(grid(1, 1, 0x000000), 0, 0, 0x0A0000);
        PixelDiff.Report c9 = PixelDiff.compare(grid(1, 1, 0x000000), red10, 9, 0.0, null);
        check("so tung kenh: do lech 10 vuot nguong 9", c9.changed() == 1, "" + c9);
        PixelDiff.Report c10 = PixelDiff.compare(grid(1, 1, 0x000000), red10, 10, 0.0, null);
        check("lệch đúng bằng ngưỡng thì chưa phải khác", c10.changed() == 0, "" + c10);
        int[][] mix = paint(grid(1, 1, 0x000A00), 0, 0, 0x00000A);
        PixelDiff.Report mixRep = PixelDiff.compare(grid(1, 1, 0x000000), mix, 9, 0.0, null);
        check("khong lay tong kenh: moi lech 10 o kenh lam la khac", mixRep.changed() == 1, "" + mixRep);

        PixelDiff.Report m1 = PixelDiff.compare(white, one, 0, 0.0, new int[][] {{0, 1, 1, 1}});
        check("mask che het pixel khac", m1.changed() == 0 && m1.compared() == 3 && m1.pass(), "" + m1);
        PixelDiff.Report m2 = PixelDiff.compare(white, one, 0, 0.0, new int[][] {{-3, -3, 5, 5}});
        check("mask tran bien bi cat, che toan anh", m2.compared() == 0 && Math.abs(m2.ratio()) < 1e-9 && m2.pass(), "" + m2);
        PixelDiff.Report m3 = PixelDiff.compare(white, one, 0, 0.0, new int[][] {{0, 1, 1, 1}, {0, 1, 1, 1}});
        check("hai mask trung nhau khong tinh hai lan", m3.compared() == 3 && m3.changed() == 0, "" + m3);
        PixelDiff.Report m4 = PixelDiff.compare(white, one, 0, 0.0, new int[][] {{0, 0, 1, 1}, {0, 0, 1, 1}});
        check("mask o goi khac van con pixel khac", m4.changed() == 1 && m4.compared() == 3, "" + m4);
        PixelDiff.Report m5 = PixelDiff.compare(white, one, 0, 0.0, new int[][] {{0, 1, 0, 4}});
        check("mask rong hoac am kich thuoc la mask rong", m5.changed() == 1 && m5.compared() == 4, "" + m5);

        int[][] big = grid(4, 4, 0xFFFFFF);
        int[][] bigDiff = paint(paint(grid(4, 4, 0xFFFFFF), 0, 0, 0x000000), 3, 3, 0x000000);
        PixelDiff.Report r01 = PixelDiff.compare(big, bigDiff, 0, 0.1, null);
        check("2/16 = 0.125 vuot nguong 0.1", r01.changed() == 2 && !r01.pass(), "" + r01);
        PixelDiff.Report r015 = PixelDiff.compare(big, bigDiff, 0, 0.15, null);
        check("0.125 duoi nguong 0.15 thi PASS", r015.pass(), "" + r015);
        PixelDiff.Report r0125 = PixelDiff.compare(big, bigDiff, 0, 0.125, null);
        check("ngưỡng bằng chính xác tỷ lệ thì PASS", r0125.pass(), "" + r0125);

        check("diffBounds bam sat hai goc thay doi", Arrays.equals(PixelDiff.diffBounds(big, bigDiff, 0, null), new int[] {0, 0, 4, 4}),
            Arrays.toString(PixelDiff.diffBounds(big, bigDiff, 0, null)));
        check("diffBounds của một pixel ở hàng 1 cột 0", Arrays.equals(PixelDiff.diffBounds(white, one, 0, null), new int[] {0, 1, 1, 1}),
            Arrays.toString(PixelDiff.diffBounds(white, one, 0, null)));
        check("không khác gì thì bbox rỗng", Arrays.equals(PixelDiff.diffBounds(white, white, 0, null), new int[] {0, 0, 0, 0}),
            Arrays.toString(PixelDiff.diffBounds(white, white, 0, null)));
        check("bbox bo qua pixel bi mask", Arrays.equals(PixelDiff.diffBounds(white, one, 0, new int[][] {{0, 1, 1, 1}}), new int[] {0, 0, 0, 0}),
            Arrays.toString(PixelDiff.diffBounds(white, one, 0, new int[][] {{0, 1, 1, 1}})));
        int[][] faint = paint(grid(2, 2, 0xFFFFFF), 1, 0, 0xFFFFF8);
        check("lech duoi nguong kenh thi bbox rong", Arrays.equals(PixelDiff.diffBounds(white, faint, 10, null), new int[] {0, 0, 0, 0}),
            Arrays.toString(PixelDiff.diffBounds(white, faint, 10, null)));
        check("cùng lệch độ với ngưỡng 0 thì có bbox", Arrays.equals(PixelDiff.diffBounds(white, faint, 0, null), new int[] {0, 1, 1, 1}),
            Arrays.toString(PixelDiff.diffBounds(white, faint, 0, null)));

        PixelDiff.Report sz = PixelDiff.compare(grid(2, 2, 0xFFFFFF), grid(3, 3, 0xFFFFFF), 0, 0.0, null);
        check("anh lech kich thuoc: pixel thieu tinh la nen den", sz.compared() == 9 && sz.changed() == 5 && !sz.pass(), "" + sz);
        check("bbox hai anh lech kich thuoc bao luong lien",
            Arrays.equals(PixelDiff.diffBounds(grid(2, 2, 0xFFFFFF), grid(3, 3, 0xFFFFFF), 0, null), new int[] {0, 0, 3, 3}),
            Arrays.toString(PixelDiff.diffBounds(grid(2, 2, 0xFFFFFF), grid(3, 3, 0xFFFFFF), 0, null)));

        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
      reference: `final class PixelDiff {
    static final class Report {
        private final int compared;
        private final int changed;
        private final double ratio;
        private final boolean pass;

        Report(int compared, int changed, double ratio, boolean pass) {
            this.compared = compared;
            this.changed = changed;
            this.ratio = ratio;
            this.pass = pass;
        }

        int compared() {
            return compared;
        }

        int changed() {
            return changed;
        }

        double ratio() {
            return ratio;
        }

        boolean pass() {
            return pass;
        }

        public String toString() {
            return "compared=" + compared + " changed=" + changed + " ratio=" + ratio + " pass=" + pass;
        }
    }

    static Report compare(int[][] a, int[][] b, int channelTolerance, double maxDiffRatio, int[][] masks) {
        int rows = rows(a, b);
        int cols = cols(a, b);
        boolean[][] masked = maskGrid(rows, cols, masks);
        int compared = 0;
        int changed = 0;
        for (int r = 0; r < rows; r++) {
            for (int c = 0; c < cols; c++) {
                if (masked[r][c]) continue;
                compared++;
                if (different(a, b, r, c, channelTolerance)) changed++;
            }
        }
        double ratio = compared == 0 ? 0.0 : (double) changed / compared;
        return new Report(compared, changed, ratio, ratio <= maxDiffRatio + 1e-9);
    }

    static int[] diffBounds(int[][] a, int[][] b, int channelTolerance, int[][] masks) {
        int rows = rows(a, b);
        int cols = cols(a, b);
        boolean[][] masked = maskGrid(rows, cols, masks);
        int x1 = Integer.MAX_VALUE;
        int y1 = Integer.MAX_VALUE;
        int x2 = -1;
        int y2 = -1;
        for (int r = 0; r < rows; r++) {
            for (int c = 0; c < cols; c++) {
                if (masked[r][c] || !different(a, b, r, c, channelTolerance)) continue;
                if (c < x1) x1 = c;
                if (r < y1) y1 = r;
                if (c > x2) x2 = c;
                if (r > y2) y2 = r;
            }
        }
        if (x2 < 0) return new int[] {0, 0, 0, 0};
        return new int[] {x1, y1, x2 - x1 + 1, y2 - y1 + 1};
    }

    private static int rows(int[][] a, int[][] b) {
        return Math.max(height(a), height(b));
    }

    private static int cols(int[][] a, int[][] b) {
        return Math.max(width(a), width(b));
    }

    private static int height(int[][] img) {
        return img == null ? 0 : img.length;
    }

    private static int width(int[][] img) {
        return (img == null || img.length == 0 || img[0] == null) ? 0 : img[0].length;
    }

    private static int pixelAt(int[][] img, int r, int c) {
        if (r < 0 || r >= height(img) || c < 0 || c >= width(img)) return 0;
        return img[r][c] & 0xFFFFFF;
    }

    private static boolean different(int[][] a, int[][] b, int r, int c, int tol) {
        int p = pixelAt(a, r, c);
        int q = pixelAt(b, r, c);
        int dr = Math.abs(((p >> 16) & 0xFF) - ((q >> 16) & 0xFF));
        int dg = Math.abs(((p >> 8) & 0xFF) - ((q >> 8) & 0xFF));
        int db = Math.abs((p & 0xFF) - (q & 0xFF));
        return Math.max(dr, Math.max(dg, db)) > tol;
    }

    private static boolean[][] maskGrid(int rows, int cols, int[][] masks) {
        boolean[][] grid = new boolean[rows][cols];
        if (masks == null) return grid;
        for (int[] m : masks) {
            if (m == null || m.length < 4) continue;
            int x = Math.max(0, m[0]);
            int y = Math.max(0, m[1]);
            int x2 = Math.min(cols, x + Math.max(0, m[2]));
            int y2 = Math.min(rows, y + Math.max(0, m[3]));
            for (int r = y; r < y2; r++) {
                for (int c = x; c < x2; c++) grid[r][c] = true;
            }
        }
        return grid;
    }
}`,
      hints: [
        'Đổi mask thành một lưới {{boolean[][]}} {{rows x cols}} rồi chỉ việc hỏi {{masked[r][c]}}. Cách này tự nhiên xử lý được mask trùng nhau (gán {{true}} hai lần vẫn là một pixel bị che) và mask tràn biên ({{Math.max(0, x)}} / {{Math.min(cols, x + w)}}).',
        'Tách hàm {{pixelAt(img, r, c)}} trả {{0}} khi {{r}} hoặc {{c}} ra ngoài ảnh. Nhờ nó, "hai ảnh khác kích thước" không cần một nhánh riêng nào: lưới chung {{max(rows)}} và phần thiếu tự thành nền đen.',
        'Tách hàm {{different(a, b, r, c, tol)}} dùng {{Math.abs(((p >> 16) & 0xFF) - ((q >> 16) & 0xFF))}} cho kênh đỏ, tương tự cho lục và lam, rồi lấy {{Math.max}} của ba kết quả và so **lớn hơn** ({{>}}) với ngưỡng. So {{>=}} là sai ngay ca "lech dung bang nguong".',
        '{{compare}} và {{diffBounds}} dùng chung gần như mọi thứ — hãy để cả hai gọi cùng một vòng lặp trừ khi bạn muốn lặp lại lỗi. Trong {{diffBounds}}, theo dõi {{x1 = min(cot)}} và {{y1 = min(hang)}}, {{x2 = max(cot)}}, {{y2 = max(hang)}}; nhớ {{x}} là **cột** còn {{y}} là **hàng** trong đề.',
        'Lệnh trả về mảng 4 số 0 khi {{x2 < 0}} đặt **sau** vòng lặp: giá trị khởi tạo {{Integer.MAX_VALUE}} mà lọt ra ngoài thì người đọc không thể phân biệt với kết quả thật.',
        'Kiểm {{ratio}} bằng {{changed / compared}} với một operand là {{double}} — chia hai số nguyên sẽ cắt phần thập phân và mọi ngưỡng tỉ lệ trở thành vô nghĩa.',
      ],
      explain: `**Ba con số, ba câu hỏi khác nhau.** {{channelTolerance}} trả lời "hai màu này có được coi là **một** không" (chống anti-aliasing), {{changed/compared}} trả lời "**bao nhiêu phần** trang đổi", {{pass}} trả lời "có vượt mức chấp nhận không". Điểm chết người là thứ tự: nếu bạn so nguyên giá trị 24 bit bằng {{!=}} thì tolerance biến mất và một pixel lệch 1/255 thành "khác"; nếu bạn đếm cả pixel trong mask vào {{compared}} thì {{ratio}} giảm giả tạo và màn hình càng nhiều vùng động càng dễ "PASS may mắn". Cả hai đều tạo CI xanh không có nghĩa.

**Vì sao "nền đen" cho ảnh lệch kích thước vẫn nguy hiểm.** Quy ước của bài khiến {{2x2}} ảnh trắng so với {{3x3}} ảnh trắng ra {{changed = 5}} — bộ so tự phát hiện lệch kích thước. Nhưng nếu hai ảnh đều **đen** mà kích thước khác nhau, {{changed}} sẽ bằng {{0}} và test **PASS** dù layout đã vỡ. Đúng như vậy, và đó chính xác là lý do mọi công cụ thật (Playwright, BackstopJS, reg-cli) so **kích thước trước**, lệch là fail ngay không cần tính pixel. Khi phỏng vấn, nói được điều này chứng tỏ bạn hiểu giới hạn của thuật toán chứ không chỉ nhớ công thức.

**{{tolerance}} không phải chỗ để "cho qua".** Con số hợp lý đến từ **đo đạc**: chạy cùng một build, cùng một dữ liệu 20 lần, lấy phân bố số pixel khác giữa các lần chụp với nhau — đó là nhiễu nền của môi trường. Ngưỡng nên nằm **trên** nhiễu nền một chút. Đặt 0 trên môi trường có font không đóng băng nghĩa là bạn đã mua một bộ phát hiện... lúc trình duyệt cảm hứng.

**bbox ({{diffBounds}}) là thứ làm FAIL thành thông tin.** Con số {{changed = 312}} không giúp ai; "{{diff nằm ở vùng (x=180, y=42, 320x48)}}" nói ngay: đó là cái header. Công cụ thật vẽ ảnh diff theo đúng ý này — tô đỏ vùng thay đổi, và QA chỉ cần liếc là biết nên gọi dev CSS hay hỏi vì sao ảnh logo đổi. {{diffBounds}} của bạn bỏ qua pixel trong mask, vì nếu không, một vùng động bị mask sẽ kéo bbox phình ra và che mất vị trí lỗi thật.

**Chi tiết {{1e-9}}.** {{0.1 + 0.2 != 0.3}} trong số thực dấu phẩy động; so {{ratio <= maxDiffRatio}} trần tục có thể fail ở đúng ngưỡng bạn tính toán kỹ. Cộng một epsilon nhỏ là cách chuẩn hoá "nhỏ hơn hoặc bằng" khi số đến từ phép chia.`,
    },
  ],
  check: [
    {
      q: 'Vì sao visual regression cần một ngưỡng (tolerance) thay vì so ảnh bằng đúng từng pixel?',
      options: [
        'Vì ảnh PNG không lưu đủ màu',
        'Vì anti-aliasing và font hinting làm các pixel biên của chữ đổi màu rất nhỏ giữa các lần dựng, dù mắt người thấy giống nhau',
        'Vì so pixel rất chậm nên phải giảm số pixel cần so',
        'Vì Playwright không cho phép so nguyên ảnh',
      ],
      answer: 1,
      explain: 'Chữ được vẽ bằng màu trung gian tại biên nét, phụ thuộc vị trí phân số của nét so với lưới pixel; chỉ cần lệch 0,2 pixel là hàng chục pixel biên đổi. Ngưỡng theo **cường độ từng kênh** cho những lệch đó đi qua, còn lệch thật (đổi màu, thiếu phần tử) vẫn bị bắt.',
    },
    {
      q: '{{maxDiffPixels = 500}} và {{maxDiffPixelRatio = 0.01}} khác nhau ở điểm nào khi suite chụp cả màn hình nhỏ lẫn màn hình lớn?',
      options: [
        'Không khác, chỉ là hai tên gọi',
        'Ngưỡng tuyệt đối soi như nhau cho mọi màn hình; ngưỡng tỉ lệ cho phép màn hình lớn khác nhiều pixel hơn',
        'Ngưỡng tỉ lệ luôn nghiêm khắc hơn ngưỡng tuyệt đối',
        'Ngưỡng tuyệt đối chỉ dùng được khi có vùng mask',
      ],
      answer: 1,
      explain: '500 pixel trên một modal nhỏ là rất nhiều, trên một trang full-page là rất ít. Tỉ lệ (0.5%, 1%) tự co theo kích thước, nên phù hợp suite có nhiều màn hình khác nhau; ngưỡng tuyệt đối lại hợp khi bạn muốn "không được đổi quá N điểm" ở một thành phần cố định.',
    },
    {
      q: 'Một cột bảng hiển thị ngày giờ hiện tại luôn làm test đỏ. Cách xử lý **tốt nhất** trong số này?',
      options: [
        'Mask cả bảng để khỏi thấy gì',
        'Khóa dữ liệu bằng mock API hoặc fixed clock cho cột đó, chỉ mask nốt phần thật sự không khóa được',
        'Bật {{maxDiffPixelRatio = 0.2}} cho qua',
        'Xóa visual test của màn hình đó',
      ],
      answer: 1,
      explain: 'Vấn đề nằm ở **dữ liệu**, không ở bộ so. Mask cả bảng thì mất luôn khả năng phát hiện lỗi cột (thiếu cột, lệch padding). Nâng ngưỡng lên 20% thì gần như mọi lỗi layout đều được tha. Khóa nguồn dữ liệu rồi mới mask nốt thứ còn lại.',
    },
    {
      q: 'Baseline được tạo trên Windows của QA, khi chạy CI trên Linux container thì đỏ hàng loạt dù code không đổi. Nguyên nhân hợp lý nhất?',
      options: [
        'CI chậm nên ảnh chưa tải xong',
        'Hai môi trường dựng ký tự khác nhau: font khác (hoặc font thiếu → fallback), hinting/subpixel rendering khác, bề rộng scrollbar khác',
        'PNG không nên lưu trong git',
        'Visual regression không dùng được với Docker',
      ],
      answer: 1,
      explain: 'Đây là lỗi kinh điển của visual test. Khắc phục: sinh baseline **bằng đúng image dùng để chạy test** (lưu artifact, không lưu trên máy cá nhân), cài font cố định trong image, khóa device scale factor và chế độ chụp (viewport hay full-page).',
    },
  ],
  related: ['autotest-020', 'autotest-013', 'autotest-018'],
  tags: ['visual regression', 'pixel diff', 'baseline', 'threshold', 'maxDiffPixelRatio', 'mask', 'anti-aliasing', 'flaky', 'screenshot'],
},
{
  id: 'lesson-autotest-015',
  track: 'autotest',
  order: 15,
  title: 'Kiểm tra JSON Schema trong API test: type, required, enum, minimum, items và contract drift',
  level: 'senior',
  minutes: 35,
  goals: [
    'Giải thích JSON Schema là gì và đọc được một schema có type, properties, required, items, enum, minimum',
    'Viết assert kiểm tra response API theo schema trong REST Assured và hiểu đường dẫn lỗi kiểu $.items[1].price',
    'Phân biệt thay đổi breaking và non-breaking trong hợp đồng JSON giữa FE và BE',
    'Biết khi nào schema validation là đủ và khi nào cần contract testing thật (Pact, OpenAPI)',
    'Chọn được độ chặt của schema để test không trở thành gánh nặng bảo trì',
  ],
  body: `**Tóm tắt:** API hiện đại trao đổi **JSON** — text có cấu trúc gồm object ({{"key": value}}), mảng ({{[1, 2]}}), chuỗi, số, boolean, null. **JSON Schema** là một tài liệu JSON **mô tả một tài liệu JSON khác**: nó nói "object này bắt buộc có field {{id}} kiểu chuỗi, {{total}} là số không âm, {{status}} chỉ được nhận ba giá trị {{new}}/{{paid}}/{{cancelled}}". Đem schema soi response của API trong test tức là bạn có một **hợp đồng kiểm tra được**: FE và BE không còn phải đoán hình dạng dữ liệu của nhau. **Contract drift** (lệch hợp đồng) là tên của tai nạn mà nó chặn: BE đổi {{total}} từ số thành chuỗi "199.000" cho dễ hiển thị, test schema đỏ ngay ở PR, thay vì crash trên điện thoại người dùng lúc 20h.

### Ví dụ đời thường
Phiếu giao hàng có hai phần: **nội dung** (tên khách, mã đơn, số tiền) và **ô bắt buộc** (chữ ký, tích chọn "hàng nguyên vẹn"). Người giao cứ điền tự do thì vẫn là phiếu, nhưng công ty không xử lý được. JSON Schema giống cái **form in sẵn**: ô nào bắt buộc, ô nào chỉ được ghi số, ô nào chỉ được tích một trong ba mục. Validator là người soát phiếu và nói được "dòng 2, cột số tiền, sai rồi" — chứ không nói "phiếu này không ổn".

### Một schema trông như thế nào
~~~json
{
  "type": "object",
  "required": ["id", "total", "status"],
  "properties": {
    "id":     { "type": "string" },
    "total":  { "type": "number", "minimum": 0 },
    "qty":    { "type": "integer", "minimum": 1 },
    "status": { "type": "string", "enum": ["new", "paid", "cancelled"] },
    "note":   { "type": ["string", "null"] },
    "tags":   { "type": "array", "items": { "type": "string" } },
    "items":  { "type": "array", "items": {
        "type": "object",
        "required": ["sku", "price"],
        "properties": { "sku": { "type": "string" }, "price": { "type": "number", "minimum": 0 } }
    } }
  }
}
~~~

Sáu từ khóa phủ gần hết nhu cầu, và năm trong số đó là thứ bạn sẽ tự cài đặt ở bài tập:

| Từ khóa | Nói điều gì | Tình huống vi phạm điển hình |
|---|---|---|
| {{type}} | kiểu của node: {{object}}, {{array}}, {{string}}, {{number}}, {{integer}}, {{boolean}}, {{null}} | {{total}} thành chuỗi "199000" |
| {{required}} | mảng tên field **phải có mặt** trong object | BE quên trả {{status}} sau khi refactor mapper |
| {{properties}} | schema riêng cho từng field, đệ quy xuống | field mới xuất hiện với kiểu không ai kiểm |
| {{items}} | một schema áp cho **mọi** phần tử của mảng | một dòng trong danh sách thiếu {{price}} |
| {{enum}} | tập giá trị được phép | BE thêm {{refunded}}, FE không có nhánh xử lý |
| {{minimum}} | ngưỡng dưới cho số (tương tự: {{maximum}}, {{minLength}}, {{pattern}}) | {{qty = 0}} lọt vào luồng thanh toán |

{{integer}} là **tập con** của {{number}}: {{2}} hợp lệ với cả hai, {{2.5}} chỉ hợp lệ với {{number}}. Chi tiết này làm đỏ test nhiều hơn bạn tưởng, vì bản thân JSON không phân biệt số nguyên và số thực — trình parse mới quyết định.

### Vì sao lỗi phải có **đường dẫn**
Một response danh sách 50 phần tử, lỗi nằm ở một dòng. "Response không khớp schema" vô dụng; "{{$.items[1].price: type number}}" chỉ đúng chỗ phải sửa, và đó là ký hiệu **JSONPath**: {{$}} là node gốc, {{.name}} là field của object, {{[i]}} là phần tử thứ i của mảng (0-based). Khi tự viết validator, việc đầu tiên là truyền đường dẫn xuống: gọi {{check(schema, value, path)}}, path khởi tạo {{$}}, xuống field thì {{path + "." + name}}, xuống mảng thì {{path + "[" + i + "]"}}.

### Trong API test thật: REST Assured
~~~java
// Can them dependency io.rest-assured:json-schema-validator
 given()
    .header("Authorization", "Bearer " + token)
 .when()
    .get("/api/orders/{id}", orderId)
 .then()
    .statusCode(200)
    .body(matchesJsonSchemaInClasspath("schemas/order.schema.json"))   // soi toan bo body theo schema
    .body("$.items.size()", greaterThan(0));                            // schema khong tu noi chuyen danh sach rong
~~~

{{matchesJsonSchemaInClasspath}} đọc file schema từ **classpath** (nơi đặt resource cùng module test), nên schema là một file **.json bình thường**: review được bằng PR, dùng lại cho nhiều test, và báo lỗi kèm đường dẫn từng node. Muốn siết thêm, nhớ rằng schema **không** nói danh sách có được rỗng hay không — đó là hai loại assertion khác nhau, và bug "trang trắng vì mảng rỗng" nằm đúng chỗ giao nhau này.

### Contract drift: thay đổi nào là breaking
| BE làm gì | Breaking? | Cách bắt |
|---|---|---|
| Thêm field mới, không bắt buộc | không | FE cũ vẫn chạy |
| Đổi tên field, đổi kiểu, bỏ field | **có** | schema + test render phía FE |
| Đưa thêm field vào {{required}} | **có**, với client cũ | validate response mẫu của từng client |
| Thêm giá trị mới vào enum | **có thể**: FE chưa biết thì hiển thị trống | {{enum}} + một ca kiểm thử "giá trị lạ" |
| Cho phép {{null}} nhiều hơn ({{note}} thành null) | **có**, nếu FE cộng/trừ trực tiếp | {{type: ["string","null"]}} + assert null-safe |
| Đổi đơn vị tiền (đồng → cent) | **có**, mà schema không bắt được | cần assert nghiệp vụ, không chỉ schema |

Bài học: schema bắt được **hình dạng**, không bắt được **ý nghĩa**. Đổi {{total}} từ "đồng" sang "cent" vẫn là {{number}} — CI xanh, khách bị tính tiền gấp 100 lần.

### Schema validation khác gì contract testing
~~~seq
title: Ba cach giu hop dong JSON giua FE va BE
actors: Schema | API test | Pact | CI
Schema -> CI: file schema nam trong repo, doi qua PR
API test -> CI: goi endpoint that roi soi shape
Pact -> CI: client khai bao ky vong, server chung minh khop
CI --> Schema: in duong dan loi kieu items[1].price
note Pact..API test: schema kiểm tra response thật, Pact kiểm tra case client thiết kế
~~~

- **Schema validation trong test** (bài này): bạn giữ file schema và soi response thật. Rẻ, thêm được ngay, nhưng schema do **QA viết** — nếu QA viết theo trí nhớ, bạn chỉ đang tự kiểm tra trí nhớ của mình.
- **OpenAPI + validator**: schema sinh ra từ **mô tả API thật** (Swagger/OpenAPI của BE), không ai phải nhớ gì; chặn được cả request sai trước khi vào server (Prism, {{openapi-validator}}).
- **Pact (consumer-driven contract testing)**: chính phía **dùng** dữ liệu khai báo nó cần gì, phía **cung cấp** phải chứng minh thỏa mãn trong CI của nó. Nặng hơn, hợp với microservices nhiều team, bắt được cả trường hợp không response nào thật đi qua.
- **Fuzzing từ schema** (Schemathesis): sinh hàng nghìn payload từ OpenAPI để tìm lỗi server. Hợp với API public.

### Bốn lỗi hay gặp
- **Sinh schema từ đúng một response mẫu.** Công cụ tự động biến mọi field đang có thành {{required}}, mọi chuỗi thành {{enum}} của chính nó → test đỏ khi có {{note}} = null, và cả team học cách bỏ qua test.
- **Chỉ soi response 200.** Error envelope ({{code}}, {{message}}, {{traceId}}) cũng là hợp đồng; FE đọc {{error.message}} mà BE đổi thành {{detail}} thì UI hiện một khoảng trắng.
- **{{required}} cho mọi field.** Field "không bao giờ null **hôm nay**" thành quả bom khi BE thêm chế độ khách vãng lai. Chỉ required field mà thiếu là UI vỡ.
- **Quên mảng rỗng và phân trang.** {{items}} đúng schema nhưng danh sách 0 phần tử vẫn PASS, trong khi bug thật là "trang trống không có lời nhắn".
- **Không version schema.** Test API v2 chạy bằng schema v1: đỏ ba ngày rồi mới phát hiện FE đã đổi field từ tuần trước.

### Liên hệ phỏng vấn
- "Bạn đảm bảo FE và BE nói cùng một JSON thế nào?" → schema đặt trong repo, validate trong API test; nếu org có OpenAPI thì validate từ OpenAPI; nhiều team thì nói thêm Pact và đánh đổi chi phí của nó.
- "Schema thay được test nghiệp vụ không?" → không; nêu ví dụ đổi đơn vị tiền hoặc {{status}} mới mà UI chưa xử lý.
- "Test schema chạy ở đâu, bao nhiêu?" → API test mỗi commit cho endpoint lõi (đơn hàng, thanh toán, danh mục), không phải mọi endpoint; mỗi màn hình chính vài schema trọng yếu.
- "Kể một bug schema bắt được." → chuẩn bị câu có đường dẫn: "{{$.data.orders[3].total}} đổi từ number thành string sau refactor serialization, bắt được ở PR; nếu lọt thì app iOS crash vì ép kiểu".

> Senior tip: viết **hai mức** schema. Mức chặt ({{required}} + {{type}} + {{enum}}) áp lên một **request cố định với dữ liệu fixture**, để nó hoạt động như unit test của hợp đồng; mức lỏng (chỉ {{type}} của vài field UI thật sự đọc) áp lên regression suite chạy với dữ liệu môi trường thật. Chỉ có mức lỏng thì bạn không phát hiện field mới; chỉ có mức chặt trên dữ liệu thật thì bạn sống chung với đỏ. Và luôn commit file schema **cùng PR** đổi API: đọc diff của một file .json là cách nhanh nhất để thấy ai đó sắp phá hợp đồng.`,
  exercises: [
    {
      title: 'SchemaValidator: tự viết bộ kiểm JSON Schema (type, required, properties, items, enum, minimum) trên Map/List, lỗi kèm đường dẫn JSONPath',
      prompt: `Viết {{SchemaValidator}} — bộ kiểm schema cho JSON đã được parse sang cấu trúc Java. Không đọc file, không gọi mạng, không dùng thư viện JSON, không đọc thời gian thực.

**Cách biểu diễn JSON bằng kiểu Java**: object = {{Map<String, Object>}}, mảng = {{List}}, chuỗi = {{String}}, số nguyên = {{Integer}} hoặc {{Long}}, số thực = {{Double}} hoặc {{Float}}, boolean = {{Boolean}}, thiếu/null = {{null}}.

**Chữ ký**: {{static List<String> validate(Map<String, Object> schema, Object value)}} — trả về **danh sách chuỗi lỗi**, rỗng khi dữ liệu hợp lệ.

**Schema cũng là một {{Map}}** với các từ khóa sau; từ khóa nào **có mặt** mới được kiểm, từ khóa lạ bỏ qua:
- {{"type"}} — một chuỗi, so theo bảng:
  - {{object}} hợp lệ với {{Map}}; {{array}} với {{List}}; {{string}} với {{String}}; {{boolean}} với {{Boolean}}; {{null}} chỉ hợp lệ với giá trị {{null}}.
  - {{integer}} hợp lệ với {{Integer}} hoặc {{Long}} ({{Boolean}} **không** phải số).
  - {{number}} hợp lệ với {{Integer}}, {{Long}}, {{Double}}, {{Float}}.
  - mọi giá trị {{type}} khác (vd {{"date-time"}}): bỏ qua, không báo lỗi.
- {{"required"}} — một {{List}} tên field; thiếu **key** trong object thì lỗi. Key có mặt nhưng giá trị {{null}} **vẫn tính là có mặt** (null là việc của {{type}}).
- {{"properties"}} — một {{Map}} tên field → schema của field đó. Chỉ kiểm field **có mặt trong dữ liệu**; field thừa trong dữ liệu được bỏ qua (object để mở).
- {{"items"}} — một {{Map}}, áp dụng cho **mọi** phần tử của mảng.
- {{"enum"}} — một {{List}} giá trị được phép, so bằng {{equals}}; **không được ném lỗi** khi giá trị mang vào là {{null}}.
- {{"minimum"}} — một {{Number}}, chỉ áp dụng khi bản thân giá trị cũng là {{Number}} (so như số thực). Giá trị **bằng** {{minimum}} là hợp lệ.

**Định dạng chuỗi lỗi** — phải đúng từng ký tự vì người chấm so chuỗi:
- Sai kiểu: {{duongDan + ": type " + tenKieuTrongSchema}}, ví dụ {{$.total: type number}} và ở gốc thì {{$: type string}}.
- Thiếu field bắt buộc: {{$.id: required}}.
- Giá trị ngoài enum: {{$.status: enum}}.
- Nhỏ hơn minimum: {{$.total: minimum 20}} — số {{20}} là {{String.valueOf(giaTriMinimum)}} trong schema, không làm tròn, không đổi kiểu.

**Đường dẫn (JSONPath)**: gốc là {{$}}; field của object nối bằng {{.}} + tên ({{$.total}}); phần tử mảng nối bằng {{[i]}} ({{$.tags[1]}}, và lồng nhau thì {{$.items[1].price}}).

**Ba quy tắc cốt lõi**: (1) node **sai kiểu** theo {{type}} thì báo đúng **một** lỗi rồi **dừng** — không kiểm {{enum}}/{{minimum}}, không đi xuống {{properties}}/{{items}} của nó; (2) {{schema}} là {{null}} hoặc rỗng coi như không ràng buộc; (3) danh sách trả về phải **sắp xếp tăng dần theo chuỗi lỗi** ({{Collections.sort}}) để kết quả không phụ thuộc thứ tự duyệt map.

Ví dụ:

~~~text
schema = { type: object, required: [id, total],
           properties: { id: {type: string},
                         total: {type: number, minimum: 20},
                         status: {type: string, enum: [new, paid]},
                         items: {type: array, items: {type: object, required: [price],
                                                      properties: {price: {type: number}}}} } }

data = { total: "25", status: "refunded", items: [ {price: 10}, {price: "3"} ] }

ket qua, sau khi sap xep: [
  "$.items[1].price: type number",
  "$.status: enum",
  "$.total: type number"
]
~~~

Chú ý {{total: "25"}}: nó là **chuỗi**, không phải số, nên chỉ có lỗi {{type number}} mà **không** có lỗi {{minimum}} — quy tắc (1) bắt bạn dừng lại. Đây đúng là tình huống BE đổi {{total}} thành chuỗi có định dạng để hiển thị: field vẫn tồn tại, nên assert "response có field {{total}}" vẫn xanh; chỉ schema bắt được.`,
      starter: `final class SchemaValidator {
    static List<String> validate(Map<String, Object> schema, Object value) {
        throw new UnsupportedOperationException("TODO");
    }
}`,
      tests: `public class Main {
    static int passed = 0, total = 0;
    static void check(String name, boolean ok, String detail) {
        total++;
        if (ok) { passed++; System.out.println("PASS " + name); }
        else System.out.println("FAIL " + name + ": " + detail);
    }
    static Map<String, Object> m(Object... kv) {
        Map<String, Object> out = new LinkedHashMap<String, Object>();
        for (int i = 0; i + 1 < kv.length; i += 2) out.put(String.valueOf(kv[i]), kv[i + 1]);
        return out;
    }
    static List<Object> l(Object... items) {
        return new ArrayList<Object>(Arrays.asList(items));
    }
    static Map<String, Object> orderSchema() {
        return m("type", "object",
            "required", l("id", "total"),
            "properties", m(
                "id", m("type", "string"),
                "total", m("type", "number", "minimum", 20),
                "qty", m("type", "integer"),
                "status", m("type", "string", "enum", l("new", "paid", "cancelled")),
                "note", m("type", "string"),
                "shipping", m("type", "object", "required", l("carrier"),
                    "properties", m("carrier", m("type", "string"))),
                "tags", m("type", "array", "items", m("type", "string")),
                "items", m("type", "array", "items", m("type", "object",
                    "required", l("price"),
                    "properties", m("price", m("type", "number"), "sku", m("type", "string"))))));
    }
    static Map<String, Object> good() {
        return m("id", "O-1", "total", 25, "qty", 2, "status", "paid", "note", "goi ky",
            "shipping", m("carrier", "GHN"), "tags", l("vip", "hot"),
            "items", l(m("price", 10.5, "sku", "A"), m("price", 14.5, "sku", "B")));
    }
    public static void main(String[] args) {
        Map<String, Object> sc = orderSchema();
        List<String> e0 = SchemaValidator.validate(sc, good());
        check("dữ liệu hợp lệ thì không có lỗi", e0.isEmpty(), "" + e0);

        Map<String, Object> extra = good();
        extra.put("coupon", "XMAS");
        List<String> eX = SchemaValidator.validate(sc, extra);
        check("field lạ trong dữ liệu được bỏ qua", eX.isEmpty(), "" + eX);

        Map<String, Object> d1 = good();
        d1.put("total", "25");
        List<String> e1 = SchemaValidator.validate(sc, d1);
        check("sai kiểu thì chỉ báo type, không báo minimum", e1.equals(l("$.total: type number")), "" + e1);

        Map<String, Object> d2 = good();
        d2.remove("id");
        List<String> e2 = SchemaValidator.validate(sc, d2);
        check("thieu field bat buoc", e2.equals(l("$.id: required")), "" + e2);

        Map<String, Object> d3 = good();
        d3.put("id", null);
        List<String> e3 = SchemaValidator.validate(sc, d3);
        check("key có mặt mà null: không phải lỗi required", e3.equals(l("$.id: type string")), "" + e3);

        Map<String, Object> d4 = good();
        d4.put("status", "refunded");
        List<String> e4 = SchemaValidator.validate(sc, d4);
        check("gia tri ngoai enum", e4.equals(l("$.status: enum")), "" + e4);

        Map<String, Object> d4b = good();
        d4b.put("status", "cancelled");
        List<String> e4b = SchemaValidator.validate(sc, d4b);
        check("giá trị trong enum thì hợp lệ", e4b.isEmpty(), "" + e4b);

        Map<String, Object> d5 = good();
        d5.put("total", 12);
        List<String> e5 = SchemaValidator.validate(sc, d5);
        check("nh nho hon minimum", e5.equals(l("$.total: minimum 20")), "" + e5);

        Map<String, Object> d5b = good();
        d5b.put("total", 20);
        List<String> e5b = SchemaValidator.validate(sc, d5b);
        check("bằng đúng minimum thì hợp lệ", e5b.isEmpty(), "" + e5b);

        Map<String, Object> d6 = good();
        d6.put("qty", 2.5);
        List<String> e6 = SchemaValidator.validate(sc, d6);
        check("integer khong chap so thuc", e6.equals(l("$.qty: type integer")), "" + e6);

        Map<String, Object> d6b = good();
        d6b.put("qty", Boolean.TRUE);
        List<String> e6b = SchemaValidator.validate(sc, d6b);
        check("boolean không phải là number", e6b.equals(l("$.qty: type integer")), "" + e6b);

        Map<String, Object> d7 = good();
        d7.put("tags", l("vip", 7));
        List<String> e7 = SchemaValidator.validate(sc, d7);
        check("phan tu mang co chi so trong duong dan", e7.equals(l("$.tags[1]: type string")), "" + e7);

        Map<String, Object> d7b = good();
        d7b.put("tags", l());
        List<String> e7b = SchemaValidator.validate(sc, d7b);
        check("mảng rỗng thì không có lỗi", e7b.isEmpty(), "" + e7b);

        Map<String, Object> d7c = good();
        d7c.put("tags", m("a", "b"));
        List<String> e7c = SchemaValidator.validate(sc, d7c);
        check("khai array ma du lieu la object", e7c.equals(l("$.tags: type array")), "" + e7c);

        Map<String, Object> d8 = good();
        d8.put("items", l(m("price", 10), m("price", "3")));
        List<String> e8 = SchemaValidator.validate(sc, d8);
        check("duong dan long qua hai cap", e8.equals(l("$.items[1].price: type number")), "" + e8);

        Map<String, Object> d8b = good();
        d8b.put("items", l(m("sku", "A"), m("price", 3)));
        List<String> e8b = SchemaValidator.validate(sc, d8b);
        check("required ben trong phan tu mang", e8b.equals(l("$.items[0].price: required")), "" + e8b);

        Map<String, Object> d8c = good();
        d8c.put("items", l(m("price", 3), m("price", 4)));
        List<String> e8c = SchemaValidator.validate(sc, d8c);
        check("thiếu sku không phải lỗi vì sku không required", e8c.isEmpty(), "" + e8c);

        Map<String, Object> d9 = good();
        d9.put("shipping", "GHN");
        List<String> e9 = SchemaValidator.validate(sc, d9);
        check("sai kiểu ở node object: dừng tại đây, không xuống required", e9.equals(l("$.shipping: type object")), "" + e9);

        Map<String, Object> d10 = good();
        d10.remove("total");
        d10.put("qty", 1.5);
        d10.put("status", "shipped");
        d10.put("note", 9);
        List<String> e10 = SchemaValidator.validate(sc, d10);
        List<String> sortedCopy = new ArrayList<String>(e10);
        Collections.sort(sortedCopy);
        check("bon loi cung luc", e10.size() == 4, "" + e10);
        check("danh sách lỗi được sắp xếp và đủ nội dung",
            e10.equals(sortedCopy) && e10.containsAll(l("$.note: type string", "$.qty: type integer",
                "$.status: enum", "$.total: required")), "" + e10);

        List<String> e11 = SchemaValidator.validate(m("type", "null"), null);
        check("null hop le voi type null", e11.isEmpty(), "" + e11);
        List<String> e11b = SchemaValidator.validate(m("type", "null"), "x");
        check("khai null ma lai co gia tri", e11b.equals(l("$: type null")), "" + e11b);

        List<String> e12 = SchemaValidator.validate(null, m("id", "O-1"));
        check("schema null thì không ràng buộc", e12.isEmpty(), "" + e12);
        List<String> e13 = SchemaValidator.validate(m(), "bat ky");
        check("schema rỗng thì không ràng buộc", e13.isEmpty(), "" + e13);
        List<String> e14 = SchemaValidator.validate(m("type", "date-time"), 5);
        check("type ngoài bảng định nghĩa thì bỏ qua", e14.isEmpty(), "" + e14);
        List<String> e15 = SchemaValidator.validate(m("type", "string"), 5);
        check("goc la scalar thi duong dan la dau dollar", e15.equals(l("$: type string")), "" + e15);
        List<String> e16 = SchemaValidator.validate(m("type", "array", "items", m("type", "string")), l("a", "b", 3));
        check("chi so mang 0-based trong duong dan", e16.equals(l("$[2]: type string")), "" + e16);

        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
      reference: `final class SchemaValidator {
    static List<String> validate(Map<String, Object> schema, Object value) {
        List<String> errors = new ArrayList<String>();
        check(schema, value, "$", errors);
        Collections.sort(errors);
        return errors;
    }

    private static void check(Map<?, ?> schema, Object value, String path, List<String> out) {
        if (schema == null || schema.isEmpty()) return;
        Object type = schema.get("type");
        if (type != null && !typeMatches(String.valueOf(type), value)) {
            out.add(path + ": type " + type);
            return;
        }
        Object allowed = schema.get("enum");
        if (allowed instanceof List && !hasValue((List<?>) allowed, value)) {
            out.add(path + ": enum");
        }
        Object minimum = schema.get("minimum");
        if (minimum instanceof Number && value instanceof Number
                && ((Number) value).doubleValue() < ((Number) minimum).doubleValue()) {
            out.add(path + ": minimum " + minimum);
        }
        if (value instanceof Map) {
            Map<?, ?> obj = (Map<?, ?>) value;
            Object required = schema.get("required");
            if (required instanceof List) {
                for (Object key : (List<?>) required) {
                    if (!obj.containsKey(key)) out.add(path + "." + key + ": required");
                }
            }
            Object properties = schema.get("properties");
            if (properties instanceof Map) {
                for (Map.Entry<?, ?> e : ((Map<?, ?>) properties).entrySet()) {
                    String name = String.valueOf(e.getKey());
                    if (!obj.containsKey(name)) continue;
                    Object sub = e.getValue();
                    if (sub instanceof Map) check((Map<?, ?>) sub, obj.get(name), path + "." + name, out);
                }
            }
        }
        if (value instanceof List) {
            Object items = schema.get("items");
            if (items instanceof Map) {
                List<?> arr = (List<?>) value;
                for (int i = 0; i < arr.size(); i++) check((Map<?, ?>) items, arr.get(i), path + "[" + i + "]", out);
            }
        }
    }

    private static boolean typeMatches(String type, Object v) {
        if (type.equals("object")) return v instanceof Map;
        if (type.equals("array")) return v instanceof List;
        if (type.equals("string")) return v instanceof String;
        if (type.equals("boolean")) return v instanceof Boolean;
        if (type.equals("null")) return v == null;
        if (type.equals("integer")) return v instanceof Integer || v instanceof Long;
        if (type.equals("number")) {
            return v instanceof Integer || v instanceof Long || v instanceof Double || v instanceof Float;
        }
        return true;
    }

    private static boolean hasValue(List<?> list, Object v) {
        for (Object o : list) {
            if (v == null ? o == null : v.equals(o)) return true;
        }
        return false;
    }
}`,
      hints: [
        'Đi đệ quy theo khuôn {{check(schema, value, path, out)}}: path khởi đầu là {{"$"}}; xuống field thì {{path + "." + name}}, xuống phần tử mảng thì {{path + "[" + i + "]"}}. Truyền path xuống ngay từ đầu thì chỗ báo lỗi chỉ cần nối chuỗi, không phải dựng lại đường dẫn.',
        'Nhánh kiểm tra kiểu ở **đầu hàm** chính là hiện thực của quy tắc "sai kiểu thì dừng": thêm lỗi rồi gọi {{return}} ngay. Quên {{return}} là lỗi phổ biến nhất: node là chuỗi mà bạn vẫn đi xuống {{properties}} rồi báo thêm vài lỗi vô nghĩa.',
        'Viết riêng {{typeMatches(String type, Object v)}} trả {{boolean}}, mỗi {{type}} một dòng {{if}}. {{integer}} không chấp nhận {{Double}}; {{number}} chấp nhận bốn lớp số nhưng không chấp nhận {{Boolean}}; {{type}} lạ thì {{return true}}.',
        '{{required}}: kiểm {{obj.containsKey(key)}}, **đừng** kiểm {{obj.get(key) != null}} — key có mặt với giá trị {{null}} không phải lỗi thiếu field. Ngược lại, phần kiểm {{enum}} phải tự viết vòng lặp: {{List.of("a").contains(null)}} ném NullPointerException.',
        '{{minimum}}: so bằng {{((Number) value).doubleValue()}}, nhờ vậy {{Integer}} so được với {{Double}} mà không cần biết lớp nào, và chỉ áp dụng khi **cả hai** đều là {{Number}} — nếu không, chuỗi "25" sẽ bị so như 25 và che mất lỗi kiểu.',
        'Trong {{validate}}, gọi {{Collections.sort(errors)}} trước khi trả. Test so danh sách bằng {{equals}}, nên thứ tự phải do bạn quyết, không phải do cách {{LinkedHashMap}} hay {{Map.of}} của người dùng duyệt.',
        'Nhận schema trong hàm đệ quy bằng kiểu {{Map<?, ?>}} để khỏi cast về {{Map<String, Object>}} (tránh warning unchecked); đọc tên field bằng {{String.valueOf(e.getKey())}} khi duyệt {{properties}}.',
      ],
      explain: `**Cấu trúc ba tầng của một validator.** (1) Kiểm {{type}} — trượt thì báo một lỗi rồi **dừng**, vì mọi kiểm tra phía dưới đều vô nghĩa: một chuỗi không thể "thiếu field {{id}}". (2) Kiểm ràng buộc **trên chính node**: {{enum}}, {{minimum}}. (3) Đi xuống cấu trúc: {{required}} + {{properties}} cho object, {{items}} cho mảng. Đây đúng là hình dạng của JSON Schema thật; các phần còn lại của chuẩn ({{allOf}}, {{oneOf}}, {{$ref}}, {{format}}) chỉ là thêm nhánh ở tầng 2 và một bước dereference ở tầng 3.

**{{integer}} là tập con của {{number}}**, và đó là chỗ JSON đánh lừa người viết test. Trong tài liệu JSON, {{2}}, {{2.0}} và {{2e0}} là cùng một số; chính trình parse quyết định nó thành {{Integer}} hay {{Double}} trong Java. Vì vậy API trả {{total: 25.0}} sau một lần refactor serializer có thể làm schema {{integer}} của bạn đỏ — không phải BE sai, mà do **hợp đồng chưa nói rõ kiểu số**. Thực hành tốt: dùng {{number}} cho tiền, kèm quy ước đơn vị được test bằng assert nghiệp vụ.

**{{contains(null)}} trên list bất biến ném NullPointerException.** {{List.of("new", "paid").contains(null)}} là NPE, nên {{enum}} không thể kiểm bằng {{allowed.contains(value)}} khi dữ liệu có thể null. Vòng lặp tự viết với {{v == null ? o == null : v.equals(o)}} mới an toàn — và đó cũng là cách validator thật làm.

**Vì sao phải sắp xếp danh sách lỗi.** Đề bài bắt trả về danh sách **đã sắp xếp** vì thứ tự duyệt một {{Map}} không được đảm bảo nếu người dùng truyền {{Map.of(...)}} (thứ tự hash có thể đổi theo version). Validator thật thường giữ thứ tự tài liệu và không sắp xếp — nhưng chúng vẫn đảm bảo đầu ra **xác định** (deterministic), vì nếu không, bạn đã mua sẵn một ca flaky. Nguyên tắc chung cho test: đầu ra không được phụ thuộc vào thứ tự duyệt cấu trúc không có thứ tự.

**Ba hướng mở rộng khi cần dùng thật.**
1. {{maximum}}, {{minLength}}, {{maxLength}}, {{pattern}}: chỉ thêm nhánh ở tầng 2; với {{pattern}} nên compile một lần rồi {{matcher.reset(url)}} thay vì gọi {{String.matches}} trong vòng lặp.
2. Cho phép nhiều kiểu, kiểu hiện đại của nullable: {{type}} là một {{List}} ({{["string","null"]}}); sửa {{typeMatches}} nhận {{List}} và chấp nhận nếu **một** thành phần khớp.
3. {{$ref}}/{{definitions}}: thêm một bảng tham chiếu truyền xuống đệ quy và dereference trước khi kiểm {{type}}. Đây là thứ làm validator tự viết phình nhanh nhất, và là lý do dự án thật nên dùng {{networknt/json-schema-validator}} — còn tự viết là để **hiểu cơ chế**, tức là để trả lời phỏng vấn.

**Liên hệ với bug thật.** BE đổi {{total}} thành chuỗi có định dạng "1.234" cho đẹp. Field vẫn còn → assert "có field {{total}}" xanh. Web dùng {{Number(total)}} nên vẫn chạy → smoke xanh. iOS ép kiểu {{Int}} → crash. {{$.total: type number}} đỏ ngay ở PR, kèm đường dẫn đủ để người sửa biết phải đụng vào chỗ nào.`,
    },
  ],
  check: [
    {
      q: 'BE đổi {{total}} từ số thành chuỗi "199.000". Assertion nào sau đây **vẫn xanh**, tức là không phát hiện ra lỗi?',
      options: [
        'So response với JSON Schema khai báo {{total}} là {{number}}',
        'Assert field {{total}} tồn tại trong response',
        'Assert kiểu của {{total}} trước khi đưa sang client iOS',
        'So response với schema do OpenAPI sinh ra',
      ],
      answer: 1,
      explain: 'Kiểm "có field" không nói gì về **kiểu** của field. Đó chính xác là loại lệch hợp đồng gây tai nạn: dữ liệu vẫn ở đó nhưng không dùng được. Chỉ assert về kiểu (schema hoặc {{isNumber}}) mới bắt được.',
    },
    {
      q: 'Vì sao nên cân nhắc trước khi ghi {{integer}} cho các field tiền tệ?',
      options: [
        'Vì {{integer}} kiểm tra chậm hơn {{number}}',
        'Vì JSON không phân biệt {{2}} và {{2.0}}; trình parse chọn {{Integer}} hay {{Double}} tùy cài đặt, nên {{integer}} có thể đỏ dù dữ liệu đúng',
        'Vì {{integer}} không hỗ trợ {{minimum}}',
        'Vì tiền luôn phải là chuỗi có định dạng',
      ],
      answer: 1,
      explain: 'Số trong JSON là một khái niệm duy nhất; Jackson/Gson quyết định lớp Java. Cùng một API có thể trả {{25}} hôm nay và {{25.0}} sau khi refactor. Với tiền, hợp đồng tốt là {{number}} cộng quy ước đơn vị — mà đơn vị thì schema không bắt được, phải có assert nghiệp vụ.',
    },
    {
      q: 'Trong {{required}} của schema, bạn nên kê những field nào?',
      options: [
        'Tất cả field đang có trong response, để phát hiện mọi thay đổi',
        'Chỉ những field mà UI thật sự đọc và sẽ vỡ nếu thiếu',
        'Không nên dùng {{required}}, chỉ dùng {{type}}',
        'Chỉ field là khóa chính',
      ],
      answer: 1,
      explain: '{{required}} cho mọi field biến schema thành ảnh chụp hiện trạng: BE để {{note}} null hoặc ẩn với khách vãng lai là test đỏ, và cả team học cách phớt lờ test. Hợp đồng chỉ nên ghi điều thật sự phải đúng.',
    },
    {
      q: 'Điểm yếu lớn nhất của "schema do QA tự viết trong file test" so với Pact hoặc OpenAPI là gì?',
      options: [
        'Chạy chậm hơn các cách khác',
        'Schema là bản **đoán** của QA về API; nếu không lấy từ mô tả thật hoặc từ phía client, CI vẫn xanh khi FE và BE lệch nhau',
        'Không kiểm tra được {{enum}}',
        'Không dùng được cùng REST Assured',
      ],
      answer: 1,
      explain: 'Đó là lý do contract testing tồn tại: hợp đồng phải do phía **dùng** dữ liệu khai báo (Pact) hoặc phía **cung cấp** publish (OpenAPI). Schema tự viết vẫn có giá trị, nhưng hãy coi nó là bài kiểm tra hình dạng, không phải nguồn của hợp đồng.',
    },
  ],
  related: ['autotest-008', 'autotest-021', 'autotest-023'],
  tags: ['JSON Schema', 'type', 'required', 'enum', 'minimum', 'items', 'contract drift', 'REST Assured', 'API test', 'Pact'],
},
);
