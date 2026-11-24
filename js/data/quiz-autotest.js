/* Multiple-choice bank: automation test. Format: AGENTS.md mục 4 */
(window.QUIZ = window.QUIZ || []).push(
{
  id: 'qz-autotest-001',
  topic: 'autotest',
  q: 'Trong Playwright, Locator {{getByRole}} khác {{locator}} thường ở điểm nào?',
  options: [
    'Locator luôn trả về phần tử đầu tiên và không tự retry',
    'Locator là mô tả lazy, tự retry action cho đến khi điều kiện thoả hoặc timeout',
    'Locator chỉ dùng được với CSS selector',
    'Locator không thể được truyền cho assertion'
  ],
  answer: 1,
  explain: `**Đáp án đúng: Locator lazy + auto-retry.** Locator không query DOM ngay; nó lưu "cách tìm" và Playwright tự chờ phần tử sẵn sàng trước khi click/fill/assert.

### Vì sao các phương án còn lại sai
- **Trả phần tử đầu tiên không retry**: đó là hành vi của {{querySelector}} một lần, không phải Locator.
- **Chỉ CSS**: Playwright Locator hỗ trợ role, text, test-id, XPath và CSS.
- **Không truyền assertion**: {{expect(locator)}} là cách chuẩn để assert.`
},
{
  id: 'qz-autotest-002',
  topic: 'autotest',
  q: 'Auto-wait của Playwright chờ những điều kiện nào trước khi thực hiện click? (Chọn 3)',
  multi: true,
  options: [
    'Phần tử attached vào DOM',
    'Phần tử visible và stable (không animation)',
    'Phần tử có text mong muốn',
    'Phần tử enabled và không bị che bởi overlay'
  ],
  answer: [0, 1, 3],
  explain: `**Đáp án đúng: attached + visible/stable + enabled/không bị che.** Playwright click auto-wait kiểm tra attached, visible, stable, enabled, nhận events (không bị overlay). Text cụ thể không phải điều kiện auto-wait.

### Vì sao các phương án còn lại sai
- **Có text mong muốn**: Playwright không chờ text cụ thể; đó là assertion của bạn.`
},
{
  id: 'qz-autotest-003',
  topic: 'autotest',
  q: 'Page Object Model (POM) giúp gì nhiều nhất trong test automation?',
  options: [
    'Tăng tốc độ chạy test bằng cách bỏ retry',
    'Tách locator và hành động theo màn hình, giảm trùng lặp và dễ bảo trì khi UI đổi',
    'Thay thế framework test runner',
    'Tự động sinh test case từ UI'
  ],
  answer: 1,
  explain: `**Đáp án đúng: tách locator/hành động theo màn hình.** POM đóng gói selector và interaction trong class; khi UI đổi chỉ sửa một chỗ.

### Vì sao các phương án còn lại sai
- **Tăng tốc bỏ retry**: retry là cơ chế framework, POM không liên quan.
- **Thay test runner**: POM là pattern, JUnit/TestNG vẫn chạy.
- **Tự sinh test**: đó là codegen/recorder, không phải POM.`
},
{
  id: 'qz-autotest-004',
  topic: 'autotest',
  q: 'Trong JUnit 5, annotation nào dùng để chạy method trước mỗi test?',
  options: ['@BeforeAll', '@BeforeEach', '@AfterEach', '@Test'],
  answer: 1,
  explain: `**Đáp án đúng: @BeforeEach.** Chạy trước từng @Test method; @BeforeAll chạy một lần trước tất cả test trong class.

### Vì sao các phương án còn lại sai
- **@BeforeAll**: một lần cho cả class, thường init tài nguyên nặng.
- **@AfterEach**: chạy sau mỗi test.
- **@Test**: đánh dấu test method, không phải setup.`
},
{
  id: 'qz-autotest-005',
  topic: 'autotest',
  q: 'REST Assured thường được dùng để làm gì trong automation?',
  options: [
    'Chạy browser E2E',
    'Kiểm thử API REST với cú pháp given/when/then',
    'Quản lý browser context',
    'Sinh báo cáo Allure'
  ],
  answer: 1,
  explain: `**Đáp án đúng: kiểm thử API REST.** REST Assured cung cấp DSL given().when().then() để assert status, body, header.

### Vì sao các phương án còn lại sai
- **Browser E2E**: đó là Playwright/Selenium.
- **Browser context**: thuộc Playwright.
- **Allure report**: thư viện report riêng, không phải REST Assured.`
},
{
  id: 'qz-autotest-006',
  topic: 'autotest',
  q: 'Cucumber-JVM dùng ngôn ngữ Gherkin để làm gì?',
  options: [
    'Viết code Java trực tiếp',
    'Mô tả hành vi bằng Given/When/Then mà business có thể đọc',
    'Chạy test song song',
    'Quản lý dependency Maven'
  ],
  answer: 1,
  explain: `**Đáp án đúng: mô tả hành vi Given/When/Then.** File .feature là spec sống, glue code Java map từng step.

### Vì sao các phương án còn lại sai
- **Code Java trực tiếp**: Gherkin không phải Java.
- **Chạy song song**: do test runner/config.
- **Maven dependency**: do pom.xml.`
},
{
  id: 'qz-autotest-007',
  topic: 'autotest',
  q: 'Khi test flaky (thỉnh thoảng fail), cách xử lý nào hợp lý nhất? (Chọn 2)',
  multi: true,
  options: [
    'Thêm retry vô điều kiện cho mọi test',
    'Phân tích root cause: timing, shared state, data phụ thuộc',
    'Cô lập test và thêm wait/assertion rõ ràng',
    'Xoá test để CI xanh'
  ],
  answer: [1, 2],
  explain: `**Đáp án đúng: phân tích root cause + cô lập.** Flaky thường do race condition, shared state, dữ liệu không deterministic.

### Vì sao các phương án còn lại sai
- **Retry vô điều kiện**: che giấu lỗi, làm chậm CI.
- **Xoá test**: mất coverage, không giải quyết vấn đề.`
},
{
  id: 'qz-autotest-008',
  topic: 'autotest',
  q: 'Playwright storageState thường dùng để làm gì?',
  options: [
    'Lưu screenshot baseline',
    'Lưu trace file',
    'Lưu cookie/localStorage để tái sử dụng session đăng nhập',
    'Lưu HAR network'
  ],
  answer: 2,
  explain: `**Đáp án đúng: lưu trạng thái auth.** storageState lưu cookie/localStorage; test sau load vào context để bỏ qua bước login.

### Vì sao các phương án còn lại sai
- **Screenshot baseline**: dùng toMatchSnapshot.
- **Trace**: dùng tracing.start/stop.
- **HAR**: dùng recordHar.`
},
{
  id: 'qz-autotest-009',
  topic: 'autotest',
  q: 'Playwright tracing (trace.zip) hữu ích nhất khi nào?',
  options: [
    'Khi cần tăng tốc test',
    'Khi cần chạy song song',
    'Khi cần debug test fail bằng timeline, network, console, screenshot',
    'Khi cần sinh code test'
  ],
  answer: 2,
  explain: `**Đáp án đúng: debug test fail.** Trace viewer cho xem timeline, DOM snapshot, network, console.

### Vì sao các phương án còn lại sai
- **Tăng tốc**: tracing thêm overhead.
- **Song song**: do worker/sharding.
- **Sinh code**: đó là codegen.`
},
{
  id: 'qz-autotest-010',
  topic: 'autotest',
  q: 'Sharding trong CI với Playwright/TestNG giúp gì?',
  options: [
    'Tự sửa test fail',
    'Giảm số lượng test',
    'Chia suite test thành nhiều phần chạy song song trên nhiều máy',
    'Tạo báo cáo Allure'
  ],
  answer: 2,
  explain: `**Đáp án đúng: chia suite chạy song song.** Sharding phân bổ test theo shard index/total để giảm tổng thời gian.

### Vì sao các phương án còn lại sai
- **Tự sửa test**: không.
- **Giảm số test**: không giảm, chỉ phân bổ.
- **Allure**: report tool riêng.`
},
{
  id: 'qz-autotest-011',
  topic: 'autotest',
  q: 'WireMock thường được dùng trong automation để làm gì?',
  options: [
    'Mock HTTP endpoint của dependency bên ngoài',
    'Chạy browser',
    'Quản lý DB migration',
    'Sinh test data faker'
  ],
  answer: 0,
  explain: `**Đáp án đúng: mock HTTP endpoint.** WireMock trả response giả lập để test độc lập với service thật.

### Vì sao các phương án còn lại sai
- **Browser**: Playwright/Selenium.
- **DB migration**: Flyway/Liquibase.
- **Faker**: thư viện data faker.`
},
{
  id: 'qz-autotest-012',
  topic: 'autotest',
  q: 'Testcontainers trong automation test giúp gì?',
  options: [
    'Khởi động dependency thật (DB, Kafka, Redis) trong container cho test',
    'Chạy test trên cloud',
    'Mock toàn bộ network',
    'Sinh báo cáo'
  ],
  answer: 0,
  explain: `**Đáp án đúng: dependency thật trong container.** Testcontainers spin up DB/message broker thật để test integration đáng tin cậy.

### Vì sao các phương án còn lại sai
- **Cloud test**: không phải mục đích.
- **Mock network**: đó là WireMock/mock server.
- **Báo cáo**: Allure/report tool.`
},
{
  id: 'qz-autotest-013',
  topic: 'autotest',
  q: 'Appium 2 được dùng để automation loại ứng dụng nào?',
  options: [
    'Web desktop',
    'API backend',
    'Database',
    'Mobile native/hybrid/webview'
  ],
  answer: 3,
  explain: `**Đáp án đúng: mobile.** Appium 2 tự động hóa mobile app (iOS/Android) qua WebDriver protocol.

### Vì sao các phương án còn lại sai
- **Web desktop**: Playwright/Selenium.
- **API backend**: REST Assured/Postman.
- **Database**: JDBC/test query.`
},
{
  id: 'qz-autotest-014',
  topic: 'autotest',
  q: 'Trong Playwright, getByTestId thường phụ thuộc vào attribute nào?',
  options: ['data-testid', 'id', 'class', 'name'],
  answer: 0,
  explain: `**Đáp án đúng: data-testid.** Mặc định getByTestId tìm attribute data-testid (có thể cấu hình).

### Vì sao các phương án còn lại sai
- **id/class/name**: có locator riêng (getById không tồn tại; dùng locator('#id')).`
},
{
  id: 'qz-autotest-015',
  topic: 'autotest',
  multi: true,
  q: 'Những practice nào giúp test automation bền vững trong CI? (Chọn 2)',
  options: [
    'Test độc lập, không phụ thuộc thứ tự',
    'Dùng locator ổn định (role/test-id) thay vì CSS giòn',
    'Chia sẻ state giữa các test để nhanh hơn',
    'Bỏ assertion để tránh fail'
  ],
  answer: [0, 1],
  explain: `**Đáp án đúng: test độc lập + locator ổn định.** Độc lập giúp chạy song song/shard; locator ổn định giảm flaky.

### Vì sao các phương án còn lại sai
- **Chia sẻ state**: gây coupling và flaky.
- **Bỏ assertion**: mất ý nghĩa test.`
},
{
  id: 'qz-autotest-016',
  topic: 'autotest',
  q: 'Trong Playwright for Java, mối quan hệ giữa {{Browser}}, {{BrowserContext}} và {{Page}} được mô tả đúng nhất là gì?',
  options: [
    'Mỗi Browser chỉ tạo được một Page, và Page quản lý cookie chung',
    'BrowserContext là một tab; mỗi Context chứa nhiều Browser',
    'Browser đại diện tiến trình trình duyệt, BrowserContext là phiên cô lập (cookie/storage riêng), Page là một tab trong Context',
    'Page và BrowserContext là cùng một đối tượng, chỉ khác tên method'
  ],
  answer: 2,
  explain: `**Tóm tắt:** {{Browser}} (trình duyệt) -> {{BrowserContext}} (phiên cô lập) -> {{Page}} (tab). Đây là mô hình giúp test chạy song song mà không dính session.

**Giải thích từng bước:**
- **Browser (cái gì):** đối tượng đại diện một tiến trình trình duyệt (Chromium/Firefox/WebKit) mà Playwright điều khiển. Bạn thường tạo một Browser cho cả suite để tiết kiệm thời gian khởi động.
- **BrowserContext (vì sao cần):** giống một "profile ẩn danh" riêng: có cookie, localStorage, sessionStorage, quyền (permission) riêng. Hai Context trong cùng Browser không nhìn thấy dữ liệu của nhau. Nhờ vậy mỗi test có thể đăng nhập tài khoản khác nhau mà không cần mở trình duyệt mới.
- **Page (hoạt động thế nào):** một tab/trang trong Context. Mọi thao tác như {{page.navigate()}}, {{page.locator()}} đều diễn ra trên Page.

**Ví dụ (Java):**
~~~java
try (Playwright pw = Playwright.create()) {
  Browser browser = pw.chromium().launch();
  // Mỗi test tạo context riêng -> session cô lập
  BrowserContext ctx = browser.newContext();
  Page page = ctx.newPage();
  page.navigate("https://example.com");
}
~~~

**Lỗi hay gặp:** Tái sử dụng cùng một Context cho nhiều test làm cookie/state "rò rỉ" sang test sau, gây flaky (test lúc pass lúc fail). Nên tạo Context mới trong {{@BeforeEach}} và đóng trong {{@AfterEach}}.

> Senior tip: Tạo 1 Browser cho worker, nhưng 1 BrowserContext cho mỗi test. Pattern này cho tốc độ tốt (không launch browser lặp lại) mà vẫn cô lập dữ liệu.

### Vì sao các phương án còn lại sai
- **Một Browser một Page, cookie chung**: Sai cả hai ý. Một Browser tạo được nhiều Context/Page; cookie thuộc Context, không chia sẻ toàn Browser.
- **Context là tab chứa nhiều Browser**: Đảo ngược hoàn toàn thứ bậc.
- **Page và Context cùng đối tượng**: Sai. Chúng là class khác nhau với API khác nhau (Context quản lý storage/route; Page quản lý điều hướng/DOM).`
},
{
  id: 'qz-autotest-017',
  topic: 'autotest',
  q: 'Bạn muốn chọn nút "Đăng nhập" một cách bền vững (ít gãy khi UI đổi class/CSS). Trong Playwright for Java, locator nào ưu tiên nhất theo khuyến nghị accessibility?',
  options: [
    '{{page.getByRole(AriaRole.BUTTON, new Page.GetByRoleOptions().setName("Đăng nhập"))}}',
    '{{page.locator("button.btn-primary.login-btn")}}',
    '{{page.locator("//button[contains(@class,\'login\')]")}}',
    '{{page.locator("div > div:nth-child(2) > button")}}'
  ],
  answer: 0,
  explain: `**Tóm tắt:** Ưu tiên {{getByRole}} (vai trò accessibility) vì nó gắn với ý nghĩa của phần tử, không phụ thuộc chi tiết CSS/DOM dễ thay đổi.

**Giải thích từng bước:**
- **Accessibility role là gì:** Trình duyệt gán "vai trò" cho phần tử (button, link, textbox...) để công cụ hỗ trợ (screen reader - phần mềm đọc màn hình cho người khiếm thị) hiểu. Playwright tận dụng chính thông tin này để tìm phần tử.
- **Vì sao bền vững:** Tên nút "Đăng nhập" và vai trò button thường ổn định theo yêu cầu nghiệp vụ; class CSS {{btn-primary}} hay cấu trúc {{div > div:nth-child(2)}} thay đổi khi designer chỉnh giao diện.
- **Cách hoạt động:** {{getByRole(AriaRole.BUTTON, ...setName("Đăng nhập"))}} tìm phần tử có role button và accessible name khớp "Đăng nhập". Playwright cũng auto-wait phần tử xuất hiện và sẵn sàng.

**Ví dụ (Java):**
~~~java
page.getByRole(AriaRole.BUTTON,
    new Page.GetByRoleOptions().setName("Đăng nhập")).click();
~~~

**Lỗi hay gặp:** Dùng CSS selector dài; khi thêm một {{div}} bọc ngoài, selector gãy hàng loạt. Hoặc text hiển thị có khoảng trắng khác biệt - có thể dùng regex {{Pattern.compile("Đăng nhập")}}.

> Senior tip: Thứ tự ưu tiên locator: getByRole/getByLabel (ngữ nghĩa) > getByTestId (hợp đồng test) > CSS/XPath (phương án cuối). Nếu không có role phù hợp, đề nghị team thêm {{data-testid}} thay vì viết XPath brittle (giòn).

### Vì sao các phương án còn lại sai
- **CSS class {{.btn-primary.login-btn}}**: Phụ thuộc tên class; refactor CSS hoặc đổi theme làm test gãy.
- **XPath theo class**: Vẫn bám class và cú pháp dài, khó đọc/bảo trì.
- **CSS theo vị trí {{nth-child(2)}}**: Cực kỳ giòn; thêm/xóa phần tử anh em làm index đổi.`
},
{
  id: 'qz-autotest-018',
  topic: 'autotest',
  multi: true,
  q: 'Khi dùng {{getByTestId}} trong Playwright for Java, những phát biểu nào đúng? (Chọn 2)',
  options: [
    '{{getByTestId("submit")}} tìm phần tử theo attribute {{id="submit"}} mặc định',
    '{{getByTestId}} là hợp đồng giữa dev và QA: ổn định khi text/CSS đổi, miễn là attribute test id được giữ',
    'Có thể đổi tên attribute mặc định ({{data-testid}}) sang tên khác bằng cấu hình {{setTestIdAttribute}}',
    '{{getByTestId}} tự động dịch text nên dùng tốt cho ứng dụng đa ngôn ngữ'
  ],
  answer: [1, 2],
  explain: `**Tóm tắt:** {{getByTestId}} mặc định tìm {{data-testid}}, là "neo" ổn định do team kiểm soát; có thể đổi attribute qua {{setTestIdAttribute}}.

**Giải thích từng bước:**
- **getByTestId là gì:** Cách định vị phần tử dựa trên một attribute dành riêng cho test (mặc định {{data-testid}}). Ví dụ HTML: {{<button data-testid="submit">Gửi</button>}} -> {{page.getByTestId("submit")}}.
- **Vì sao cần:** Khi UI không có role/label rõ (icon button, canvas...), hoặc text thay đổi theo ngôn ngữ, test id cho một điểm bám ổn định.
- **Đổi attribute mặc định:** Một số codebase dùng {{data-test}}, {{data-qa}}... Playwright cho phép cấu hình toàn cục:
~~~java
playwright.selectors().setTestIdAttribute("data-test");
// sau đó getByTestId("submit") sẽ tìm data-test="submit"
~~~

**Lỗi hay gặp:** Lạm dụng test id cho mọi thứ thay vì dùng getByRole/getByLabel trước - làm mất cơ hội phát hiện vấn đề accessibility. Hoặc dev xóa attribute khi refactor vì "không dùng ở production".

> Senior tip: Dùng test id như phương án thứ hai: ưu tiên role/label. Thống nhất tên attribute trong dự án và thêm rule lint/review để không ai xóa nhầm {{data-testid}}.

### Vì sao các phương án còn lại sai
- **Tìm theo {{id}} mặc định**: Sai. Mặc định là {{data-testid}}. Muốn tìm {{id}} dùng {{page.locator("#submit")}}.
- **Tự dịch text cho đa ngôn ngữ**: Sai. Test id là chuỗi cố định bạn gán, không liên quan i18n/translation.`
},
{
  id: 'qz-autotest-019',
  topic: 'autotest',
  q: 'Đoạn code Playwright for Java sau gặp vấn đề gì? {{Locator msg = page.locator(".toast"); if (msg.isVisible()) msg.click();}}',
  options: [
    'Thiếu {{page.waitForTimeout(5000)}} trước khi kiểm tra',
    'Phải dùng {{getByText}} thay vì {{locator}} với class',
    '{{locator()}} không trả về đối tượng Locator hợp lệ',
    '{{isVisible()}} không auto-wait như action/assertion: có thể trả {{false}} ngay cả khi toast sắp hiện (race condition)'
  ],
  answer: 3,
  explain: `**Tóm tắt:** {{isVisible()}} (kiểm tra tức thời) không có cơ chế auto-wait; trong khi UI render bất đồng bộ, bạn dễ gặp race condition (đua thời gian - kiểm tra trước khi phần tử kịp xuất hiện).

**Giải thích từng bước:**
- **Auto-wait là gì:** Với action ({{click}}, {{fill}}) và web-first assertion ({{assertThat(locator).isVisible()}}), Playwright tự lặp kiểm tra cho đến khi điều kiện thỏa hoặc hết timeout. Điều này giúp test ổn định khi mạng/UI chậm.
- **isVisible() khác gì:** {{locator.isVisible()}} trả về kết quả ngay tại thời điểm gọi, không chờ. Nếu toast (thông báo bật lên) render sau 200ms, lệnh {{if}} có thể bỏ lỡ.
- **Cách sửa đúng:**
~~~java
Locator msg = page.locator(".toast");
assertThat(msg).isVisible(); // web-first, tự chờ
msg.click();
~~~
Hoặc nếu toast có thể không xuất hiện: dùng {{waitFor}} với timeout phù hợp và xử lý logic rõ ràng.

**Lỗi hay gặp:** Rải {{Thread.sleep}}/{{waitForTimeout}} khắp nơi để "vá" timing - làm test chậm và vẫn flaky khi môi trường chậm hơn bình thường.

> Senior tip: Quy tắc vàng - dùng action/assertion để chờ, tránh {{isVisible()}}/{{count()}} tức thời trong logic rẽ nhánh trừ khi bạn chủ đích kiểm tra trạng thái hiện tại. Không dùng {{waitForTimeout}} cố định.

### Vì sao các phương án còn lại sai
- **Thiếu {{waitForTimeout(5000)}}**: Chờ cứng là anti-pattern (cách làm tệ), không giải quyết gốc và làm suite chậm.
- **Phải dùng {{getByText}}**: Không bắt buộc; vấn đề ở đây là cơ chế chờ, không phải loại locator.
- **{{locator()}} không hợp lệ**: Sai. {{page.locator()}} trả về Locator hợp lệ; cú pháp đúng.`
},
{
  id: 'qz-autotest-020',
  topic: 'autotest',
  q: 'Trong Playwright for Java, điểm khác biệt chính giữa web-first assertion {{assertThat(locator).hasText("OK")}} và kiểm tra thủ công {{locator.textContent().equals("OK")}} là gì?',
  options: [
    '{{assertThat}} chỉ dùng được với {{getByRole}}, còn {{textContent}} dùng cho mọi locator',
    'Hai cách hoàn toàn tương đương về cơ chế chờ',
    '{{textContent()}} luôn ném exception nếu phần tử chưa có text',
    '{{assertThat(locator).hasText(...)}} là web-first assertion: tự retry/đợi đến khi text khớp hoặc timeout; {{textContent()}} lấy giá trị tức thời'
  ],
  answer: 3,
  explain: `**Tóm tắt:** Web-first assertion ({{assertThat(locator)...}}) tự động chờ giá trị khớp; lấy {{textContent()}} rồi so sánh là kiểm tra một lần, dễ fail khi nội dung cập nhật bất đồng bộ.

**Giải thích từng bước:**
- **Web-first assertion là gì:** API {{com.microsoft.playwright.assertions.PlaywrightAssertions.assertThat}} được thiết kế cho UI động. Nó lặp lại việc đọc DOM và so sánh cho đến khi pass hoặc hết timeout (mặc định ~5s).
- **Vì sao cần:** Sau khi bấm "Lưu", label có thể đổi từ "Đang lưu..." sang "OK" sau vài trăm ms. {{assertThat(locator).hasText("OK")}} sẽ chờ; còn {{textContent()}} có thể đọc trúng "Đang lưu...".
- **Ví dụ (Java):**
~~~java
import static com.microsoft.playwright.assertions.PlaywrightAssertions.assertThat;
page.getByRole(AriaRole.BUTTON, new Page.GetByRoleOptions().setName("Lưu")).click();
assertThat(page.locator(".status")).hasText("OK"); // tự chờ
~~~

**Lỗi hay gặp:** Lấy {{String t = locator.textContent();}} rồi {{assertEquals("OK", t)}} - biến {{t}} là snapshot cũ, không bao giờ tự cập nhật. Cũng dễ gặp {{null}} nếu gọi quá sớm.

> Senior tip: Với mọi kiểm tra trạng thái UI, dùng {{assertThat(locator)...}} ({{isVisible}}, {{hasText}}, {{hasAttribute}}, {{hasCount}}). Chỉ dùng {{textContent()}} khi bạn cần trích xuất dữ liệu để xử lý logic, và khi đó hãy đảm bảo đã chờ điều kiện ổn định trước.

### Vì sao các phương án còn lại sai
- **{{assertThat}} chỉ dùng với {{getByRole}}**: Sai. Nó nhận bất kỳ {{Locator}} nào.
- **Hoàn toàn tương đương**: Sai về cơ chế chờ - đây là điểm khác biệt cốt lõi.
- **{{textContent()}} luôn ném exception nếu chưa có text**: Không chính xác; nó có thể trả {{null}} hoặc chuỗi rỗng tùy trạng thái, và không có retry.`
},
{
  id: 'qz-autotest-021',
  topic: 'autotest',
  q: 'Bạn có file {{auth.json}} lưu {{storageState}} sau khi đăng nhập. Cách dùng lại session này trong Playwright for Java để bỏ qua bước login ở test khác là gì?',
  options: [
    '{{browser.newContext(new Browser.NewContextOptions().setStorageStatePath(Paths.get("auth.json")))}}',
    '{{page.navigate("auth.json")}} rồi {{page.reload()}}',
    '{{browser.launch(new BrowserType.LaunchOptions().setStorageState("auth.json"))}}',
    'Copy nội dung {{auth.json}} vào {{localStorage}} bằng {{page.evaluate}} sau mỗi {{click}}'
  ],
  answer: 0,
  explain: `**Tóm tắt:** Truyền {{storageState}} (trạng thái lưu trữ: cookie + localStorage) vào {{BrowserContext}} khi tạo; Context mới sẽ khởi động với session đã đăng nhập.

**Giải thích từng bước:**
- **storageState là gì:** Một file JSON chứa cookie và origin storage mà Playwright xuất ra từ một Context đã đăng nhập. Nó giống việc bạn "mang theo" phiên đăng nhập.
- **Vì sao cần:** Đăng nhập qua UI tốn thời gian và hay flaky; nếu 50 test đều login, suite chậm và dễ fail do trang login. Dùng lại session giúp test tập trung vào chức năng cần kiểm tra.
- **Hoạt động thế nào:**
~~~java
// Lưu (chạy 1 lần, ví dụ global setup)
context.storageState(new BrowserContext.StorageStateOptions()
    .setPath(Paths.get("auth.json")));
// Tái sử dụng
BrowserContext ctx = browser.newContext(
    new Browser.NewContextOptions()
        .setStorageStatePath(Paths.get("auth.json")));
Page page = ctx.newPage();
page.navigate("https://app.example.com/dashboard"); // đã đăng nhập
~~~

**Lỗi hay gặp:** Session hết hạn (token expiry) làm test fail hàng loạt - cần cơ chế refresh {{auth.json}} định kỳ. Hoặc commit {{auth.json}} chứa token thật vào git (lộ bí mật).

> Senior tip: Tạo storageState trong global setup bằng API login (nhanh, ổn định) thay vì login qua UI. Thêm {{auth.json}} vào {{.gitignore}}. Với nhiều vai trò (admin/user), tạo nhiều file state.

### Vì sao các phương án còn lại sai
- **{{page.navigate("auth.json")}}**: Điều hướng trang web, không nạp trạng thái xác thực vào context.
- **{{setStorageState}} trên {{launch}}**: {{LaunchOptions}} không có option này; storageState thuộc {{BrowserContext}}, không thuộc Browser.
- **{{page.evaluate}} chèn localStorage sau mỗi click**: Cách thủ công, dễ sai (thiếu cookie/httpOnly, sai origin/timing) và không thực tế.`
},
{
  id: 'qz-autotest-022',
  topic: 'autotest',
  q: 'Bạn cần chặn mọi request ảnh ({{*.png}}, {{*.jpg}}) để test chạy nhanh hơn. API Playwright for Java nào phù hợp nhất?',
  options: [
    '{{page.waitForRequest("**/*.{png,jpg}")}}',
    '{{browser.newContext().route(...)}} nhưng phải gọi sau {{page.navigate()}}',
    '{{page.route("**/*.{png,jpg}", route -> route.abort())}}',
    '{{page.setExtraHTTPHeaders(...)}} với header {{Accept: text/html}}'
  ],
  answer: 2,
  explain: `**Tóm tắt:** {{page.route(urlPattern, handler)}} cho phép chặn, sửa, hoặc giả lập (mock) network request; gọi {{route.abort()}} để hủy request.

**Giải thích từng bước:**
- **Network routing là gì:** Playwright có thể can thiệp vào các request mà trang gửi đi (ảnh, API, script...). Bạn đăng ký một pattern (mẫu URL) và một handler (hàm xử lý).
- **Vì sao cần:** Chặn tài nguyên nặng (ảnh, font, analytics) giúp test nhanh và ổn định hơn khi không cần kiểm tra chúng. Cũng dùng để mock API trả dữ liệu cố định.
- **Hoạt động thế nào:**
~~~java
// Đăng ký TRƯỚC khi điều hướng để không bỏ lỡ request
page.route("**/*.{png,jpg,jpeg}", route -> route.abort());
page.navigate("https://example.com");
~~~
Pattern {{**}} khớp mọi đường dẫn. Handler nhận {{Route}}; bạn có thể {{abort()}}, {{fulfill()}} (trả response giả), hoặc {{resume()}} (cho đi tiếp, có thể sửa header).

**Lỗi hay gặp:** Đăng ký route sau {{navigate()}} - các request ảnh đã gửi đi rồi. Hoặc {{abort()}} nhầm request API quan trọng làm trang lỗi.

> Senior tip: Đăng ký route trước hành động kích hoạt request. Để mock API có chọn lọc, match theo URL/path cụ thể thay vì wildcard rộng. Có thể đặt route ở {{context.route(...)}} để áp dụng cho mọi page trong context.

### Vì sao các phương án còn lại sai
- **{{waitForRequest}}**: Chỉ chờ/lắng nghe request xảy ra, không chặn hay sửa nó.
- **{{context.route}} phải gọi sau {{navigate()}}**: Sai về timing; route phải đăng ký trước khi request phát sinh. (Đặt ở context là hợp lệ, nhưng mô tả thời điểm sai.)
- **{{setExtraHTTPHeaders}} với {{Accept}}**: Chỉ thêm header cho request trang gửi; không chặn request ảnh theo pattern.`
},
{
  id: 'qz-autotest-023',
  topic: 'autotest',
  q: 'Trang thanh toán nhúng form thẻ trong một {{<iframe>}}. Cách tương tác đúng với ô nhập số thẻ trong Playwright for Java là gì?',
  options: [
    '{{page.locator("#card-number").fill("4111111111111111")}} vì Playwright tự tìm trong mọi iframe',
    '{{page.evaluate("document.querySelector(\'iframe\').contentDocument...")}}',
    'Chuyển hẳn sang {{browser.newPage()}} với URL của iframe',
    '{{page.frameLocator("iframe[name=\'card\']").getByLabel("Card number").fill("4111111111111111")}}'
  ],
  answer: 3,
  explain: `**Tóm tắt:** Dùng {{frameLocator}} để "đi vào" iframe rồi định vị phần tử bên trong; nó vẫn là Locator (lazy, auto-wait) và an toàn hơn truy cập DOM chéo frame.

**Giải thích từng bước:**
- **iframe là gì:** Một trang HTML nhúng bên trong trang khác (inline frame). Nội dung iframe có DOM (cây phần tử) riêng; JavaScript thông thường và locator trên {{page}} không tự động xuyên vào iframe.
- **frameLocator là gì:** API của Playwright tạo một "locator phạm vi iframe". Nó không trả về đối tượng {{Frame}} cứng mà trả về {{FrameLocator}} có thể chain (nối) tiếp {{getByRole/getByLabel/locator}}.
- **Hoạt động thế nào:**
~~~java
page.frameLocator("iframe[name='card']")
    .getByLabel("Card number")
    .fill("4111111111111111");
~~~
Playwright auto-wait iframe xuất hiện và phần tử bên trong sẵn sàng.

**Lỗi hay gặp:** Dùng {{page.frame("name")}} rồi giữ tham chiếu Frame cũ - nếu iframe bị reload/replace, tham chiếu hết hiệu lực (stale). {{frameLocator}} tránh vấn đề này vì nó resolve lại mỗi lần action.

> Senior tip: Ưu tiên {{frameLocator}} (locator semantics, resilient - bền khi frame reload) hơn {{page.frame()}}. Với iframe lồng nhau, chain: {{page.frameLocator("#outer").frameLocator("#inner").getByRole(...)}}.

### Vì sao các phương án còn lại sai
- **{{page.locator}} tự tìm trong mọi iframe**: Sai. Locator trên {{page}} chỉ tìm trong DOM chính (main frame), không tự xuyên iframe.
- **{{page.evaluate}} với {{contentDocument}}**: Thường bị chặn bởi same-origin policy (chính sách cùng nguồn gốc) nếu iframe khác domain, và mất auto-wait của Playwright.
- **{{browser.newPage()}} với URL iframe**: Nhiều iframe (đặc biệt payment) cần context/cookie/script của trang cha; mở URL riêng thường không tái hiện được hành vi thật.`
},
{
  id: 'qz-autotest-024',
  topic: 'autotest',
  multi: true,
  q: 'Trang có nút "Tải báo cáo" mở tab mới và nút "Xuất CSV" kích hoạt tải file. Cách xử lý đúng trong Playwright for Java là gì? (Chọn 2)',
  options: [
    'Dùng {{page.waitForPopup(() -> page.getByText("Tải báo cáo").click())}} để bắt {{Page}} của tab mới',
    'Gọi {{Thread.sleep(3000)}} sau click rồi tìm tab mới bằng {{browser.contexts().get(0).pages()}}',
    'Dùng {{page.waitForDownload(() -> page.getByText("Xuất CSV").click())}} để nhận đối tượng {{Download}}',
    'Dùng {{page.waitForRequest(...)}} để nhận nội dung file CSV thay cho download'
  ],
  answer: [0, 2],
  explain: `**Tóm tắt:** Bắt sự kiện {{popup}} (tab/cửa sổ mới) bằng {{waitForPopup}} và sự kiện tải file bằng {{waitForDownload}} - cả hai cần đăng ký "chờ" cùng lúc với hành động click để không bỏ lỡ.

**Giải thích từng bước:**
- **Popup là gì:** Khi click mở {{target="_blank"}} hoặc {{window.open}}, trình duyệt tạo tab/Page mới. Playwright phát sự kiện popup trên Page gốc.
- **Download là gì:** Khi server trả header khiến trình duyệt tải file, Playwright phát sự kiện download.
- **Vì sao phải chờ song song với click:** Nếu click xong mới chờ, sự kiện có thể đã bắn ra và bị mất (race condition). Pattern chuẩn là truyền action vào hàm wait:
~~~java
Page popup = page.waitForPopup(() -> {
  page.getByText("Tải báo cáo").click();
});
popup.waitForLoadState();
assertThat(popup).hasTitle("Báo cáo");

Download download = page.waitForDownload(() -> {
  page.getByText("Xuất CSV").click();
});
download.saveAs(Paths.get("report.csv"));
~~~

**Lỗi hay gặp:** Sleep cố định rồi dò danh sách page - chậm và không ổn định. Hoặc quên {{waitForLoadState}} trên popup trước khi assert.

> Senior tip: Luôn dùng pattern {{waitForX(() -> action)}}. Với download, kiểm tra {{download.suggestedFilename()}} và nội dung file lưu ra để assert đúng dữ liệu, không chỉ tin rằng click không lỗi.

### Vì sao các phương án còn lại sai
- **{{Thread.sleep}} rồi dò {{pages()}}**: Chờ cứng, flaky, và code phức tạp không cần thiết khi đã có API sự kiện.
- **{{waitForRequest}} thay cho download**: Bắt được request mạng nhưng không cho bạn đối tượng {{Download}} (tên file gợi ý, luồng lưu file). Với response stream/attachment, xử lý thủ công rất rắc rối.`
},
{
  id: 'qz-autotest-025',
  topic: 'autotest',
  q: 'Để debug một test Playwright for Java hay fail trên CI (khó tái hiện ở máy local), bạn bật tracing. Cấu hình nào thu thập trace đầy đủ cho việc phân tích sau đó?',
  options: [
    '{{browser.startTracing()}} và {{browser.stopTracing()}} là đủ, không cần gắn với context',
    'Chỉ cần {{page.screenshot()}} khi test fail',
    'Bật {{setHeadless(false)}} để nhìn thấy lỗi thay vì tracing',
    '{{context.tracing().start(new Tracing.StartOptions().setScreenshots(true).setSnapshots(true).setSources(true));}} ... {{context.tracing().stop(new Tracing.StopOptions().setPath(Paths.get("trace.zip")));}}'
  ],
  answer: 3,
  explain: `**Tóm tắt:** Tracing (ghi vết) được bật trên {{BrowserContext}}: {{start}} với screenshots/snapshots/sources, {{stop}} kèm đường dẫn {{trace.zip}}; mở bằng Trace Viewer để xem timeline, DOM snapshot, network, console.

**Giải thích từng bước:**
- **Tracing là gì:** Cơ chế ghi lại toàn bộ diễn biến test: từng action, ảnh chụp màn hình, snapshot DOM (trạng thái trang tại thời điểm đó), request/response mạng, log console, và mapping về dòng source code.
- **Vì sao cần:** CI thường chạy headless (không giao diện), khác hệ điều hành/mạng so với máy bạn. Trace cho phép "tua lại" chính xác lúc fail mà không cần chạy lại.
- **Hoạt động thế nào (Java):**
~~~java
context.tracing().start(new Tracing.StartOptions()
    .setScreenshots(true)  // ảnh từng bước
    .setSnapshots(true)    // DOM snapshot (xem lại được)
    .setSources(true));    // gắn dòng code
// ... chạy test ...
context.tracing().stop(new Tracing.StopOptions()
    .setPath(Paths.get("trace.zip")));
~~~
Mở file: {{mvn exec:java -e -D exec.mainClass=com.microsoft.playwright.CLI -D exec.args="show-trace trace.zip"}} (hoặc CLI tương ứng).

**Lỗi hay gặp:** Chỉ {{start}} mà quên {{stop}} khi test fail - cần đặt {{stop}} trong {{finally/@AfterEach}}. Hoặc luôn bật tracing cho mọi test (tốn I/O, chậm); thực tế hay bật "on-first-retry" hoặc khi fail.

> Senior tip: Trong CI, lưu {{trace.zip}} như build artifact chỉ khi test fail/retry. Kết hợp với {{setScreenshots}} và video nếu cần, nhưng trace thường đủ và giàu thông tin nhất.

### Vì sao các phương án còn lại sai
- **{{browser.startTracing()}} là đủ**: API tracing chính xác nằm trên {{context.tracing()}} (chuẩn Playwright Java). Đồng thời phải {{stop}} ra file mới phân tích được.
- **Chỉ {{page.screenshot()}} khi fail**: Chỉ có 1 ảnh tại thời điểm fail, thiếu timeline/network/DOM history - khó tìm nguyên nhân gốc.
- **Bật headed thay vì tracing**: CI thường không có display; và nhìn lúc chạy không giúp "tua lại" failure đã xảy ra.`
},
{
  id: 'qz-autotest-026',
  topic: 'autotest',
  q: 'Suite Playwright có 200 test, chạy trên CI mất 40 phút. Bạn muốn chia đều cho 4 máy chạy song song. Cơ chế nào mô tả đúng cách sharding (chia mảnh) của Playwright?',
  options: [
    'Mỗi máy chạy với tham số dạng {{--shard=1/4}}, {{--shard=2/4}}... để nhận một phần test không trùng nhau',
    'Chạy cùng lệnh trên cả 4 máy; Playwright tự khóa file để tránh trùng',
    'Copy 50 file test vào 4 repo khác nhau bằng tay',
    'Sharding chỉ hoạt động với {{BrowserContext}} trong cùng một tiến trình, không dùng cho nhiều máy'
  ],
  answer: 0,
  explain: `**Tóm tắt:** Sharding chia danh sách test thành N mảnh; mỗi máy/tiến trình chạy một mảnh qua {{--shard=current/total}} (CLI) để giảm tổng thời gian (wall time).

**Giải thích từng bước:**
- **Sharding là gì:** Kỹ thuật phân mảnh (splitting) tập test. Ví dụ 200 test, {{1/4}} lấy khoảng 50 test đầu theo thứ tự xác định, {{2/4}} lấy 50 tiếp theo... Các mảnh không giao nhau.
- **Vì sao cần:** Một máy chạy tuần tự 40 phút; 4 máy shard song song có thể còn ~10 phút (cộng thêm chút overhead). CI pipeline phản hồi nhanh hơn.
- **Hoạt động thế nào:** Trong Playwright Test (Node) dùng {{--shard=1/4}}. Với Playwright for Java, sharding thường thực hiện ở tầng runner/build (ví dụ Maven Surefire chia theo module/fork, hoặc CI matrix gán shard index) hoặc dùng công cụ điều phối; nguyên tắc cốt lõi là mỗi worker nhận tập con không trùng.
~~~bash
# minh họa ý tưởng (CLI Playwright Test)
npx playwright test --shard=1/4
npx playwright test --shard=2/4
~~~

**Lỗi hay gặp:** Test phụ thuộc thứ tự hoặc chia sẻ dữ liệu - shard nào chạy trước/sau cũng được thì mới an toàn. Hoặc gộp report từ nhiều shard sai cách làm mất kết quả.

> Senior tip: Sharding chỉ hiệu quả khi test độc lập. Kết hợp sharding (nhiều máy) với parallel/workers (nhiều luồng trên một máy) nhưng chú ý tài nguyên CPU/RAM. Cân bằng mảnh nếu thời gian test lệch nhau (shard theo thời gian chạy lịch sử).

### Vì sao các phương án còn lại sai
- **Chạy cùng lệnh, tự khóa file**: Playwright không tự phân phối test qua nhiều máy độc lập bằng file lock như vậy.
- **Copy file test bằng tay**: Thủ công, dễ sai/trùng/thiếu và không bảo trì được.
- **Chỉ trong cùng tiến trình**: Sai. Mục đích chính của sharding là scale ra nhiều máy/agent CI; trong một tiến trình người ta dùng workers/threads.`
},
{
  id: 'qz-autotest-027',
  topic: 'autotest',
  q: 'Bạn muốn gọi trực tiếp REST API (ví dụ lấy token, tạo dữ liệu test) trong Playwright for Java mà không mở trình duyệt. Đối tượng nào phù hợp?',
  options: [
    '{{page.locator("body").evaluate(...)}} để gửi fetch',
    '{{Browser.newPage()}} rồi điều hướng tới endpoint API',
    'Dùng {{java.net.HttpClient}} riêng và không thể chia sẻ cookie với browser context',
    '{{playwright.request().newContext()}} hoặc {{context.request()}} để dùng {{APIRequestContext}}'
  ],
  answer: 3,
  explain: `**Tóm tắt:** {{APIRequestContext}} là client HTTP tích hợp của Playwright; có thể tạo độc lập ({{playwright.request()}}) hoặc gắn với {{BrowserContext}} ({{context.request()}}) để chia sẻ cookie/storage.

**Giải thích từng bước:**
- **APIRequestContext là gì:** Một đối tượng gửi HTTP request (GET/POST/PUT...) có sẵn trong Playwright, hỗ trợ baseURL, header mặc định, và parse response.
- **Vì sao cần:** Nhiều bước chuẩn bị dữ liệu (seed data) hoặc xác minh (verify) làm qua API nhanh và ổn định hơn UI. Ví dụ: tạo đơn hàng qua API, rồi mở UI kiểm tra hiển thị.
- **Hoạt động thế nào (Java):**
~~~java
APIRequestContext api = playwright.request().newContext(
    new APIRequest.NewContextOptions()
        .setBaseURL("https://api.example.com"));
APIResponse res = api.post("/login",
    RequestOptions.create().setData(Map.of("u","a","p","b")));
assertEquals(200, res.status());
// Hoặc dùng context.request() để tự mang cookie của phiên browser
APIResponse me = context.request().get("/api/me");
~~~

**Lỗi hay gặp:** Quên {{dispose()}} {{APIRequestContext}} tạo độc lập. Hoặc cần gọi API với cùng session trình duyệt nhưng lại dùng {{playwright.request()}} (không chia sẻ cookie) thay vì {{context.request()}}.

> Senior tip: Dùng API để setup/teardown dữ liệu, dùng UI để kiểm tra hành vi người dùng. Kiểm tra {{res.ok()}} và log {{res.text()}} khi fail để debug nhanh. Cẩn thận: API chạy ngoài UI vẫn có thể tạo dữ liệu "bẩn" nếu teardown hỏng.

### Vì sao các phương án còn lại sai
- **{{page.evaluate}} gửi fetch**: Cần có Page đang mở, chịu ràng buộc CORS/origin của trang, và không phù hợp khi bạn muốn bỏ qua UI.
- **{{newPage()}} điều hướng tới endpoint**: Trình duyệt sẽ hiển thị/handle response như tài liệu, không phải cách gọi API có kiểm soát method/header/body.
- **Chỉ {{HttpClient}} và không thể chia sẻ cookie**: {{HttpClient}} dùng được nhưng bạn phải tự quản lý cookie/header. Playwright cung cấp {{APIRequestContext}} tích hợp; và nếu dùng {{context.request()}} thì chia sẻ cookie với browser context được.`
},
{
  id: 'qz-autotest-028',
  topic: 'autotest',
  q: 'Test đăng nhập thành công bằng Playwright for Java. Sau đó test khác cần trạng thái đã đăng nhập. Cách tổ chức nào hợp lý để vừa nhanh vừa tránh lộ bí mật?',
  options: [
    'Đăng nhập UI trong {{@BeforeAll}} và dùng chung một {{Page}} cho mọi test',
    'Hard-code username/password trong mã test và commit lên git cho tiện',
    'Thực hiện đăng nhập một lần (ưu tiên qua API), lưu {{storageState}} ra file tạm không commit, rồi tạo {{BrowserContext}} mới từ file đó cho các test',
    'Tắt xác thực trên môi trường test để khỏi cần đăng nhập'
  ],
  answer: 2,
  explain: `**Tóm tắt:** Tách bước xác thực thành setup tạo {{storageState}} (trạng thái phiên), tái sử dụng cho mỗi test qua {{BrowserContext}} riêng; giữ bí mật ngoài git.

**Giải thích từng bước:**
- **Vấn đề cần giải:** Login UI lặp lại -> chậm/flaky. Dùng chung session -> test dính nhau. Hard-code credential -> rò rỉ bí mật.
- **Giải pháp cân bằng:**
  1. Global setup: gọi API login (hoặc UI một lần) để lấy session.
  2. {{context.storageState(...setPath("playwright/.auth/user.json"))}}.
  3. Mỗi test: {{browser.newContext(newContextOptions().setStorageStatePath(...))}} -> cô lập nhưng đã đăng nhập.
- **Bảo mật:** Đọc credential từ biến môi trường/secret manager CI; thêm file state vào {{.gitignore}} (chứa token phiên).
~~~java
String user = System.getenv("TEST_USER");
String pass = System.getenv("TEST_PASS"); // không hard-code
~~~

**Lỗi hay gặp:** Chia sẻ một {{Page}}/{{Context}} giữa test -> state rò rỉ. Hoặc token trong {{storageState}} hết hạn giữa chừng làm cả batch fail.

> Senior tip: Mỗi worker/role có file state riêng. Kiểm tra hết hạn: nếu vào trang bị redirect về login, regenerate state. Không bao giờ commit token/cookie hay mật khẩu.

### Vì sao các phương án còn lại sai
- **{{@BeforeAll}} dùng chung một {{Page}}**: Chia sẻ state giữa test, phá tính cô lập; một test làm bẩn session ảnh hưởng test khác.
- **Hard-code và commit**: Lộ thông tin đăng nhập trong lịch sử git - rủi ro bảo mật nghiêm trọng.
- **Tắt xác thực trên môi trường test**: Làm test không còn phản ánh hành vi thật; bỏ sót lỗi phân quyền/auth.`
},
{
  id: 'qz-autotest-029',
  topic: 'autotest',
  multi: true,
  q: 'Trong Playwright for Java, những phát biểu nào đúng về {{BrowserContext}}? (Chọn 2)',
  options: [
    'Cookie/localStorage của một {{BrowserContext}} không tự động chia sẻ sang {{BrowserContext}} khác cùng {{Browser}}',
    '{{BrowserContext}} không thể cấu hình viewport hay locale; chỉ cấu hình được ở {{Page}}',
    'Có thể đăng ký {{context.route(...)}} để áp dụng chặn/mock network cho mọi {{Page}} tạo từ context đó',
    'Mỗi {{BrowserContext}} bắt buộc phải chạy trên một tiến trình {{Browser}} riêng'
  ],
  answer: [0, 2],
  explain: `**Tóm tắt:** {{BrowserContext}} là đơn vị cô lập (cookie/storage/permission) và là nơi đặt cấu hình/route áp dụng cho các Page bên trong; nhiều Context có thể chung một Browser.

**Giải thích từng bước:**
- **Cô lập:** Context giống profile tách biệt. Đây là nền tảng để chạy test song song đáng tin cậy mà không phải launch nhiều trình duyệt nặng.
- **Cấu hình ở Context:** Khi {{newContext}}, bạn có thể đặt {{setViewportSize}}, {{setLocale}}, {{setTimezoneId}}, {{setPermissions}}, {{setStorageStatePath}}, {{setRecordVideoDir}}... Các Page tạo sau kế thừa cấu hình này.
- **Route ở Context:** {{context.route(pattern, handler)}} bắt mọi request từ mọi Page trong Context - tiện khi muốn mock/chặn nhất quán.
~~~java
BrowserContext ctx = browser.newContext(
    new Browser.NewContextOptions().setLocale("vi-VN"));
ctx.route("**/analytics/**", Route::abort);
Page p1 = ctx.newPage();
Page p2 = ctx.newPage(); // cùng locale, cùng rule route
~~~

**Lỗi hay gặp:** Nghĩ phải mở nhiều Browser để cô lập - tốn tài nguyên. Hoặc đặt route chỉ trên một Page rồi quên Page khác vẫn gọi API thật.

> Senior tip: Đặt cấu hình chung (locale, auth, route mock) ở Context; dùng Page cho hành vi từng tab. Đóng Context sau test để giải phóng bộ nhớ/video/trace.

### Vì sao các phương án còn lại sai
- **Không cấu hình viewport/locale ở Context**: Sai. {{NewContextOptions}} hỗ trợ viewport, locale, timezone, geolocation, permissions, v.v.
- **Mỗi Context bắt buộc một Browser riêng**: Sai. Một Browser host được nhiều Context; đó chính là lợi ích hiệu năng của mô hình Playwright.`
},
{
  id: 'qz-autotest-030',
  topic: 'autotest',
  q: 'Bạn gọi API tạo đơn hàng bằng {{context.request().post(...)}} và muốn xác minh response. Cách kiểm tra đúng với {{APIResponse}} trong Playwright for Java là gì?',
  options: [
    'Dùng {{assertThat(page).hasURL(...)}} vì APIResponse tự cập nhật trang',
    'Kiểm tra {{response.ok()}}/{{response.status()}}, đọc {{response.text()}} hoặc {{response.json()}} để xác minh HTTP 2xx và nội dung',
    '{{APIResponse}} không có body; phải gọi lại bằng {{HttpURLConnection}} để đọc',
    'Chỉ cần {{response != null}} là request thành công'
  ],
  answer: 1,
  explain: `**Tóm tắt:** {{APIResponse}} cung cấp status, header, body ({{text()}}, {{body()}}, {{json()}}); dùng {{response.ok()}} hoặc {{response.status()}} để xác minh HTTP 2xx.

**Giải thích từng bước:**
- **APIResponse là gì:** Kết quả trả về từ {{APIRequestContext}} ({{get/post/...}}). Nó chứa mã trạng thái HTTP (status code), header và nội dung body.
- **Cách kiểm tra:**
~~~java
APIResponse res = context.request().post("/api/orders",
    RequestOptions.create()
        .setHeader("Content-Type", "application/json")
        .setData("{\"sku\":\"A1\"}"));
assertTrue(res.ok());              // HTTP 2xx
assertEquals(201, res.status());   // chính xác hơn nếu cần
String body = res.text();          // body dạng chuỗi
System.out.println(res.headers()); // debug header
~~~
- **json():** Trả về object đã parse (kiểu tùy binding); tiện khi assert trường cụ thể.

**Lỗi hay gặp:** Chỉ nhìn {{response != null}} - request có thể trả 400/500 vẫn cho object response. Hoặc đọc body hai lần theo cách không hỗ trợ; nên lưu {{text()}} vào biến nếu cần dùng lại.

> Senior tip: Assert cả status và các trường quan trọng trong body (id, state). Khi fail, log {{res.status()}} + {{res.text()}} để CI artifact giúp debug. Dispose {{APIRequestContext}} tạo thủ công bằng {{playwright.request().newContext()}}.

### Vì sao các phương án còn lại sai
- **{{assertThat(page).hasURL(...)}}**: API call bằng {{request()}} không điều hướng Page; URL trang không đổi.
- **Không có body, phải dùng {{HttpURLConnection}}**: Sai. {{APIResponse}} có {{text()}}, {{body()}}, {{json()}}.
- **{{response != null}} là thành công**: Null-check không phản ánh HTTP status; 4xx/5xx vẫn trả response.`
},
{
  id: 'qz-autotest-031',
  topic: 'autotest',
  q: 'Trong JUnit 5, tại sao annotation {{ @BeforeAll }} mặc định yêu cầu method phải là static?',
  options: [
    'Để có thể gọi method mà không cần khởi tạo instance của class test',
    'Vì JUnit 5 mặc định tạo một instance mới của class test cho mỗi phương thức {{ @Test }}',
    'Để đảm bảo thread safety khi chạy song song',
    'Để tăng tốc độ thực thi của suite test'
  ],
  answer: 1,
  explain: `**Tóm tắt:** JUnit 5 mặc định áp dụng {{ @TestInstance(Lifecycle.PER_METHOD) }}, nghĩa là mỗi phương thức test được chạy trên một instance (đối tượng) class mới, nên {{ @BeforeAll }} (chạy một lần duy nhất trước toàn bộ test) không thể gọi các method instance được.
  
### Vì sao các phương án còn lại sai
- **Gọi không cần instance**: Đây là kết quả, không phải lý do thiết kế.
- **Thread safety**: Không liên quan trực tiếp; {{ @TestInstance(Lifecycle.PER_CLASS) }} cho phép {{ @BeforeAll }} là non-static.
- **Tăng tốc**: Không ảnh hưởng.`
},
{
  id: 'qz-autotest-032',
  topic: 'autotest',
  q: 'Trong JUnit 5, làm thế nào để chạy một test method nhiều lần với các đầu vào khác nhau?',
  options: [
    'Dùng {{ @RepeatedTest }}',
    'Dùng {{ @ParameterizedTest }} cùng với các nguồn dữ liệu như {{ @ValueSource }}',
    'Dùng vòng lặp for bên trong phương thức {{ @Test }}',
    'Tự gọi phương thức nhiều lần'
  ],
  answer: 1,
  explain: `**Tóm tắt:** {{ @ParameterizedTest }} là giải pháp chuẩn để chạy test với danh sách dữ liệu, giúp báo cáo chi tiết cho từng trường hợp.
  
### Vì sao các phương án còn lại sai
- **@RepeatedTest**: Chạy cùng một test nhiều lần (không thay đổi input).
- **Vòng lặp trong @Test**: Làm JUnit coi cả lần chạy là một test duy nhất; nếu lỗi ở lần giữa thì các lần sau không được kiểm tra, báo cáo khó đọc.
- **Tự gọi method**: Không dùng được các cơ chế lifecycle của JUnit.`
},
{
  id: 'qz-autotest-033',
  topic: 'autotest',
  q: 'Annotation {{ @Nested }} trong JUnit 5 dùng để làm gì?',
  options: [
    'Chạy các test song song',
    'Tổ chức test theo nhóm logic, cho phép định nghĩa lifecycle riêng cho nhóm đó',
    'Bỏ qua các test không cần thiết',
    'Tự động sinh test case'
  ],
  answer: 1,
  explain: `**Tóm tắt:** {{ @Nested }} dùng để nhóm các test liên quan vào một class con bên trong class test, giúp code gọn và quản lý lifecycle (setup/teardown) riêng cho nhóm đó.
  
### Vì sao các phương án còn lại sai
- **Chạy song song**: Liên quan đến config {{ junit-platform.properties }}.
- **Bỏ qua test**: Dùng {{ @Disabled }}.
- **Sinh test**: Không liên quan.`
},
{
  id: 'qz-autotest-034',
  topic: 'autotest',
  q: 'Trong Mockito 5, "Strict Stubs" mang lại lợi ích gì?',
  options: [
    'Cho phép dùng lại stub cho mọi test',
    'Ném lỗi nếu stub không được dùng hoặc có lỗi tham số, giúp test an toàn hơn',
    'Tăng tốc độ chạy test đáng kể',
    'Cho phép mock các class final'
  ],
  answer: 1,
  explain: `**Tóm tắt:** Strict Stubs là tính năng giúp phát hiện stub dư thừa hoặc bị lỗi tham số (mismatch), giúp test không bị pass giả (false positive).
  
### Vì sao các phương án còn lại sai
- **Dùng lại stub**: Đây là hành vi lỏng lẻo (loose) mà Strict Stubs ngăn chặn.
- **Tăng tốc**: Không ảnh hưởng đến tốc độ.
- **Class final**: Tính năng riêng của Mockito, không phải Strict Stubs.`
},
{
  id: 'qz-autotest-035',
  topic: 'autotest',
  multi: true,
  q: 'Những phát biểu nào đúng về {{ ArgumentCaptor }} trong Mockito? (Chọn 2)',
  options: [
    'Dùng để chặn đối tượng tham số truyền vào method mock để assert sau đó',
    'Dùng để ép buộc method trả về giá trị nhất định',
    'Hữu ích khi đối tượng tham số phức tạp không thể dùng {{ eq() }} đơn giản',
    'Chỉ dùng được với method trả về {{ void }}'
  ],
  answer: [0, 2],
  explain: `**Tóm tắt:** {{ ArgumentCaptor }} "bắt" các đối tượng được truyền vào method trong test để bạn có thể kiểm tra chi tiết các thuộc tính bên trong đối tượng đó.
  
### Vì sao các phương án còn lại sai
- **Ép trả về giá trị**: Đó là {{ when().thenReturn() }}.
- **Chỉ void**: Dùng được cho cả method trả về giá trị.`
},
{
  id: 'qz-autotest-036',
  topic: 'autotest',
  q: 'Sự khác biệt cơ bản giữa {{ @Mock }} và {{ @Spy }} trong Mockito là gì?',
  options: [
    'Không khác nhau',
    '{{ @Mock }} tạo object rỗng, còn {{ @Spy }} bao bọc object thật và gọi method thật trừ khi bị stub',
    '{{ @Spy }} không thể stub được',
    '{{ @Mock }} chậm hơn {{ @Spy }}'
  ],
  answer: 1,
  explain: `**Tóm tắt:** {{ @Mock }} hoàn toàn là object "giả" (trả về giá trị mặc định của kiểu dữ liệu), còn {{ @Spy }} là "bản sao" của object thật, giữ nguyên hành vi thật trừ khi bạn stub nó.
  
### Vì sao các phương án còn lại sai
- **Spy không stub được**: Sai hoàn toàn; Spy có thể stub.
- **@Mock chậm hơn**: Không đúng.`
},
{
  id: 'qz-autotest-037',
  topic: 'autotest',
  q: 'Trong Spring Boot 3.1+, cách nào để kết nối Testcontainers với ứng dụng nhanh và tự động nhất?',
  options: [
    'Dùng {{ @ServiceConnection }}',
    'Cấu hình thủ công trong {{ application-test.yml }}',
    'Viết custom {{ ApplicationContextInitializer }}',
    'Dùng {{ @SpringBootTest(properties = "...") }}'
  ],
  answer: 0,
  explain: `**Tóm tắt:** {{ @ServiceConnection }} tự động cấu hình các thuộc tính kết nối của Spring Boot (như URL, username, pass) trỏ vào container mà không cần viết code cấu hình tay.
  
### Vì sao các phương án còn lại sai
- **Cấu hình tay**: Cũ, tốn công và dễ lỗi khi container đổi port.
- **Custom initializer**: Cũ, phức tạp.
- **properties**: Cần biết chính xác port/địa chỉ container, khó dùng với container port ngẫu nhiên.`
},
{
  id: 'qz-autotest-038',
  topic: 'autotest',
  q: 'Cách tốt nhất để sử dụng một Testcontainer duy nhất cho cả bộ test suite là gì?',
  options: [
    'Mỗi test method khởi tạo container mới',
    'Sử dụng static field trong class test cơ sở hoặc Singleton pattern',
    'Không dùng container mà dùng H2',
    'Khởi tạo trong {{ @BeforeAll }} mà không để static'
  ],
  answer: 1,
  explain: `**Tóm tắt:** Dùng static field (thường kèm Singleton pattern) đảm bảo container khởi động một lần duy nhất cho toàn bộ class test (hoặc suite), tiết kiệm thời gian.
  
### Vì sao các phương án còn lại sai
- **Mỗi test method**: Rất chậm, overhead lớn.
- **H2**: Không giống môi trường thật, có thể sai sót khi migrate lên DB thật.
- **@BeforeAll không static**: Không hoạt động, sẽ bị khởi tạo lại hoặc lỗi.`
},
{
  id: 'qz-autotest-039',
  topic: 'autotest',
  multi: true,
  q: 'Những ưu điểm nào của Testcontainers so với H2 trong integration test? (Chọn 2)',
  options: [
    'Giống môi trường production (DB thật)',
    'Khởi động nhanh hơn H2',
    'Hỗ trợ đầy đủ các tính năng DB thực (stored procedure, type đặc biệt)',
    'Tiêu thụ ít RAM hơn'
  ],
  answer: [0, 2],
  explain: `**Tóm tắt:** Testcontainers dùng Docker để chạy DB thật, loại bỏ khác biệt giữa môi trường test và prod (ví dụ: syntax PostgreSQL, Oracle mà H2 không hỗ trợ).
  
### Vì sao các phương án còn lại sai
- **Khởi động nhanh hơn**: H2 (in-memory) nhanh hơn Docker container.
- **Ít RAM hơn**: Container tốn RAM hơn nhiều.`
},
{
  id: 'qz-autotest-040',
  topic: 'autotest',
  q: 'Sự khác biệt chính giữa {{ @DataJpaTest }} và {{ @SpringBootTest }} là gì?',
  options: [
    '{{ @DataJpaTest }} test toàn bộ ứng dụng, {{ @SpringBootTest }} chỉ test tầng dữ liệu',
    '{{ @DataJpaTest }} chỉ load các component liên quan đến JPA và dùng in-memory DB, {{ @SpringBootTest }} load toàn bộ context ứng dụng',
    '{{ @DataJpaTest }} chậm hơn {{ @SpringBootTest }}',
    'Không có sự khác biệt'
  ],
  answer: 1,
  explain: `**Tóm tắt:** {{ @DataJpaTest }} là "slice test" tập trung cho tầng dữ liệu (nhanh, gọn), còn {{ @SpringBootTest }} khởi động toàn bộ ứng dụng (chậm, nhưng toàn diện).
  
### Vì sao các phương án còn lại sai
- **Đảo ngược**: Nhầm lẫn giữa 2 cái.
- **DataJpaTest chậm hơn**: Ngược lại, nó nhanh hơn nhiều vì load ít component.`
},
{
  id: 'qz-autotest-041',
  topic: 'autotest',
  q: '{{ @DataJpaTest }} tự động cấu hình thành phần nào?',
  options: [
    'Chỉ các Repository và EntityManager, dùng in-memory DB',
    'Tất cả Controller và Service',
    'Chỉ các Security Config',
    'Không cấu hình gì cả'
  ],
  answer: 0,
  explain: `**Tóm tắt:** {{ @DataJpaTest }} tập trung vào JPA, tự load @Repository, @Entity, EntityManager và tự cấu hình DB in-memory (như H2) để test nhanh.
  
### Vì sao các phương án còn lại sai
- **Controller/Service**: Thường bị bỏ qua trừ khi @Import thêm.
- **Security**: Cần cấu hình riêng.`
},
{
  id: 'qz-autotest-042',
  topic: 'autotest',
  q: 'Đỉnh của "Test Pyramid" (Kim tự tháp kiểm thử) thường là loại test nào?',
  options: [
    'Unit Test',
    'Integration Test',
    'E2E Test (UI)',
    'Contract Test'
  ],
  answer: 2,
  explain: `**Tóm tắt:** Kim tự tháp test ưu tiên số lượng lớn Unit Test ở đáy, Integration ở giữa, và ít E2E Test ở đỉnh vì E2E chậm, dễ giòn và đắt đỏ.`
},
{
  id: 'qz-autotest-043',
  topic: 'autotest',
  multi: true,
  q: 'Trong chiến lược Test Pyramid, lý do chính để hạn chế E2E test là gì? (Chọn 2)',
  options: [
    'Chạy rất chậm',
    'Dễ bị giòn (brittle - dễ fail do UI thay đổi)',
    'Không phát hiện được lỗi logic',
    'Tốn ít tài nguyên'
  ],
  answer: [0, 1],
  explain: `**Tóm tắt:** E2E test chạy trên browser/hệ thống thật, chậm và phụ thuộc nhiều yếu tố (mạng, UI), khiến nó kém ổn định.`
},
{
  id: 'qz-autotest-044',
  topic: 'autotest',
  q: 'Tại sao dùng {{ System.currentTimeMillis() }} trực tiếp trong code lại gây khó khăn khi test?',
  options: [
    'Vì nó trả về {{ int }} thay vì {{ long }}',
    'Vì nó phụ thuộc thời gian thực của máy, khiến test không ổn định (flaky) với các logic liên quan đến thời gian',
    'Vì nó gây lỗi biên dịch',
    'Vì nó không thể được sử dụng trong class test'
  ],
  answer: 1,
  explain: `**Tóm tắt:** Logic phụ thuộc thời gian thực (time-dependent) khó kiểm soát; cần sử dụng {{ Clock }} (Java 8+) để có thể "bẻ cong" (mock) thời gian trong test.`
},
{
  id: 'qz-autotest-045',
  topic: 'autotest',
  multi: true,
  q: 'Những yếu tố nào thường gây ra test flaky? (Chọn 2)',
  options: [
    'Shared state (DB, biến static) bị các test khác làm bẩn',
    'Race condition trong test',
    'Test chạy quá nhanh',
    'Code không có lỗi'
  ],
  answer: [0, 1],
  explain: `**Tóm tắt:** Shared state làm test testA fail do testB chạy trước làm bẩn DB; race condition do bất đồng bộ không chờ đợi kỹ.`
},
{
  id: 'qz-autotest-046',
  topic: 'autotest',
  q: 'Mục đích chính của "Contract Test" trong microservices là gì?',
  options: [
    'Thay thế hoàn toàn E2E test',
    'Đảm bảo Provider và Consumer hiểu và tuân thủ đúng định dạng API mà không cần chạy cả hệ thống',
    'Tăng tốc độ khởi động ứng dụng',
    'Tự động sinh tài liệu API'
  ],
  answer: 1,
  explain: `**Tóm tắt:** Contract test (Spring Cloud Contract, Pact) kiểm tra sự tương thích định dạng API giữa service gọi (Consumer) và service cung cấp (Provider) một cách cô lập.`
},
{
  id: 'qz-autotest-047',
  topic: 'autotest',
  multi: true,
  q: 'Quy trình Contract Test thường gồm các bước nào? (Chọn 2)',
  options: [
    'Consumer tạo ra contract (file định nghĩa)',
    'Provider kiểm tra (verify) code thật chống lại contract đó',
    'Chạy toàn bộ hệ thống lên và gọi E2E',
    'Dùng tay test thủ công'
  ],
  answer: [0, 1],
  explain: `**Tóm tắt:** Consumer định nghĩa mong muốn qua contract; Provider verify code thật chống lại contract đó để đảm bảo không phá vỡ hợp đồng.`
},
{
  id: 'qz-autotest-048',
  topic: 'autotest',
  q: 'Sự khác biệt giữa "Mock" và "Stub" là gì?',
  options: [
    'Không khác nhau',
    'Stub dùng để trả về dữ liệu cứng (giả lập), Mock dùng để kiểm tra hành vi (gọi bao nhiêu lần, tham số gì)',
    'Mock dùng để trả về dữ liệu, Stub dùng để kiểm tra hành vi',
    'Mock chỉ dùng trong integration test'
  ],
  answer: 1,
  explain: `**Tóm tắt:** Stub cung cấp dữ liệu giả (hợp tác - cooperation), Mock kiểm tra hành vi (xác minh - verification).`
},
{
  id: 'qz-autotest-049',
  topic: 'autotest',
  q: 'Phát biểu nào đúng nhất về "Test Coverage"?',
  options: [
    'Coverage 100% nghĩa là test hoàn hảo',
    'Coverage cao là tốt, nhưng không đảm bảo test chất lượng (bỏ sót assertion quan trọng)',
    'Coverage thấp là tốt',
    'Chỉ cần quan tâm line coverage'
  ],
  answer: 1,
  explain: `**Tóm tắt:** Coverage chỉ đo lượng code được chạy qua; không đo độ chặt chẽ của các assertion hay các trường hợp biên (edge cases).`
},
{
  id: 'qz-autotest-050',
  topic: 'autotest',
  q: 'Tại sao cần cleanup dữ liệu sau mỗi test (ví dụ xoá DB)?',
  options: [
    'Để làm DB trống rỗng',
    'Để đảm bảo tính cô lập (test này không làm bẩn môi trường của test sau)',
    'Để tăng tốc độ test',
    'Để kiểm tra DB có xoá được không'
  ],
  answer: 1,
  explain: `**Tóm tắt:** Tính cô lập (isolation) là yếu tố sống còn của test bền vững; dữ liệu rác từ test trước là nguồn gốc của lỗi flaky.`
},
{
  id: 'qz-autotest-051',
  topic: 'autotest',
  q: 'Trong Selenium, khác biệt cốt lõi giữa implicit wait (chờ ngầm) và explicit wait (chờ tường minh) là gì?',
  options: [
    'Implicit wait chờ một điều kiện cụ thể, còn explicit wait áp dụng cho mọi lệnh tìm phần tử',
    'Hai cơ chế giống hệt nhau, chỉ khác tên gọi giữa Selenium 3 và 4',
    'Implicit wait khai báo một lần và áp dụng cho MỌI lệnh tìm phần tử; explicit wait chờ MỘT điều kiện cụ thể trên phần tử',
    'Implicit wait thay thế được explicit wait hoàn toàn'
  ],
  answer: 2,
  explain: `**Tóm tắt:** Implicit wait (chờ ngầm) khai báo một lần qua {{driver.manage().timeouts().implicitlyWait(Duration.ofSeconds(10))}} rồi áp dụng cho mọi lệnh {{findElement}}; nó chỉ chờ phần tử XUẤT HIỆN. Explicit wait (chờ tường minh) dùng {{WebDriverWait}} cộng {{ExpectedConditions}} để chờ một điều kiện cụ thể (click được, visible, có text...).

**Giải thích từng bước:**
- **Implicit wait hoạt động thế nào:** Bạn đặt một khoảng thời gian tối đa; mỗi lần gọi {{findElement}} mà phần tử chưa có, Selenium lặp dò (poll) cho tới khi thấy hoặc hết giờ thì ném {{NoSuchElementException}}. Nó chỉ giải quyết bài toán "phần tử đã có trong DOM chưa", KHÔNG xử lý được "phần tử đã enable chưa", "đã hết animation chưa".
- **Explicit wait hoạt động thế nào:** Bạn chỉ định rõ điều kiện cần chờ và áp dụng cho một phần tử/điều kiện riêng:
~~~java
WebDriverWait wait = new WebDriverWait(driver, Duration.ofSeconds(10));
wait.until(ExpectedConditions.elementToBeClickable(By.id("send")));
driver.findElement(By.id("send")).click();
~~~
- **Vì sao không nên trộn hai cái:** Khi vừa đặt implicit wait vừa dùng explicit wait, thời gian chờ thực tế có thể cộng dồn và khó đoán (WebDriverWait bị ảnh hưởng bởi implicit timeout), gây test chậm bất thường mà không rõ lý do. Khuyến nghị thực tế: đặt implicit wait = 0 và dùng explicit wait có kiểm soát.

**Lỗi hay gặp:** Dùng {{Thread.sleep(5000)}} (chờ cứng) thay cho explicit wait - vừa chậm vừa vẫn flaky khi môi trường chậm hơn 5 giây.

> Senior tip: Trong dự án thật, chuẩn hóa chỉ dùng explicit wait (hoặc web-first assertion của Playwright). Implicit wait để mặc định 0 vì nó khó kiểm soát khi kết hợp nhiều loại chờ.

### Vì sao các phương án còn lại sai
- **Đảo ngược vai trò**: Sai. Implicit mới là cái áp dụng cho mọi findElement; explicit mới là cái theo điều kiện cụ thể.
- **Giống hệt nhau, chỉ khác tên**: Sai bản chất; chúng là hai cơ chế khác nhau cả về phạm vi lẫn khả năng.
- **Implicit thay thế hoàn toàn explicit**: Sai. Implicit không chờ được các điều kiện như clickable/visible/text.`
},
{
  id: 'qz-autotest-052',
  topic: 'autotest',
  q: 'Bạn cần click nút "Gửi" nhưng nút chỉ enable sau khi nhập xong (mất khoảng 1 giây). Trong Selenium 4, cách chờ đúng và ổn định nhất là gì?',
  options: [
    'wait.until(ExpectedConditions.elementToBeClickable(btn)); rồi btn.click() (với WebDriverWait có timeout)',
    'Thread.sleep(2000) rồi btn.click()',
    'btn.click() trực tiếp vì Selenium mặc định tự retry đến khi click được',
    'Đặt driver.manage().timeouts().implicitlyWait(...) vì implicit wait xử lý được điều kiện enable'
  ],
  answer: 0,
  explain: `**Tóm tắt:** Dùng {{WebDriverWait}} với {{ExpectedConditions.elementToBeClickable}}: nó chờ nút vừa visible vừa enabled (và nhận được click) trước khi trả về phần tử an toàn để click.

**Giải thích từng bước:**
- **elementToBeClickable là gì:** Một điều kiện chờ của Selenium, chỉ thỏa khi phần tử có trên DOM, hiển thị (visible) và đang bấm được (enabled). Đây đúng nhu cầu "nút chưa sẵn sàng thì đừng click".
- **Vì sao click không tự retry:** {{element.click()}} trong Selenium KHÔNG tự lặp lại; nếu phần tử chưa enabled tại đúng thời điểm gọi, nó ném {{ElementNotInteractableException}} ngay. Trách nhiệm chờ thuộc về bạn.
- **Ví dụ (Java):**
~~~java
WebDriverWait wait = new WebDriverWait(driver, Duration.ofSeconds(10));
WebElement btn = wait.until(
    ExpectedConditions.elementToBeClickable(By.id("send")));
btn.click();
~~~

**Lỗi hay gặp:** Click bằng locator cũ (WebElement đã tìm trước đó) sau khi DOM đổi - dễ gặp {{StaleElementReferenceException}}; nên để {{until}} trả về phần tử mới nhất rồi mới click.

> Senior tip: Chọn đúng ExpectedCondition theo tình huống: clickable (click), visibilityOf (đọc/điền), presenceOfElementLocated (chỉ cần có trong DOM). Đặt timeout hợp lý theo SLA trang, không quá dài để fail nhanh.

### Vì sao các phương án còn lại sai
- **Thread.sleep(2000)**: Chờ cứng (fixed wait) - chậm cố định, và vẫn flaky nếu thao tác mất hơn 2 giây trên máy CI chậm.
- **click() trực tiếp tự retry**: Sai. Selenium click không tự chờ điều kiện; ném exception ngay nếu chưa bấm được.
- **Implicit wait xử lý enable**: Sai. Implicit wait chỉ chờ phần tử xuất hiện (presence), không xét trạng thái enable/visible.`
},
{
  id: 'qz-autotest-053',
  topic: 'autotest',
  q: 'Trong Selenium, {{PageFactory.initElements(driver, pageObject)}} kết hợp annotation {{@FindBy}} làm gì?',
  options: [
    'Tự chuyển mọi locator CSS sang XPath để chạy nhanh hơn',
    'Cho phép chạy nhiều test song song trên cùng một page object',
    'Tự động chụp screenshot toàn trang mỗi khi tìm phần tử',
    'Tạo proxy cho các WebElement, khởi tạo phần tử theo kiểu lazy (lười): chỉ tìm khi phần tử thực sự được dùng'
  ],
  answer: 3,
  explain: `**Tóm tắt:** {{PageFactory.initElements}} quét các field {{@FindBy}} trong page object và tạo proxy; phần tử thật chỉ được định vị khi bạn gọi tới nó (lazy), giúp page object gọn và bền hơn.

**Giải thích từng bước:**
- **Page Object Model (POM) là gì:** Mẫu thiết kế tách "mô tả trang" (locator + hành động) ra khỏi "kịch bản test". Mỗi trang có một class; khi UI đổi, chỉ sửa class đó thay vì hàng chục test.
- **PageFactory làm gì:** Thay vì tự gọi {{driver.findElement}} cho từng field, bạn khai báo locator bằng annotation rồi để PageFactory khởi tạo:
~~~java
public class LoginPage {
    @FindBy(id = "user") private WebElement username;
    @FindBy(id = "pass") private WebElement password;

    public LoginPage(WebDriver driver) {
        PageFactory.initElements(driver, this); // tạo proxy cho các field
    }
    public void login(String u, String p) {
        username.sendKeys(u);
        password.sendKeys(p); // phần tử mới được định vị tại đây
    }
}
~~~
- **Lazy nghĩa là gì:** Proxy không giữ sẵn WebElement đã tìm; mỗi lần bạn gọi method trên field, nó mới đi tìm theo locator. Nhờ vậy nếu trang điều hướng làm phần tử cũ hỏng, lần dùng sau vẫn tìm lại được (giảm lỗi so với giữ WebElement đã tìm sẵn một lần).

**Lỗi hay gặp:** Khởi tạo page object một lần trong {{@BeforeAll}} rồi tái dùng cho nhiều test với driver đã đổi - locator/proxy gắn với driver cũ sẽ hỏng. Nên tạo page object mới sau mỗi lần điều hướng.

> Senior tip: POM + PageFactory giúp giảm trùng lặp, nhưng đừng biến page object thành "ông thần" chứa mọi logic nghiệp vụ. Page object chỉ nên bọc tương tác trang; assertion và luồng nghiệp vụ để trong test (hoặc một lớp service riêng).

### Vì sao các phương án còn lại sai
- **Chuyển CSS sang XPath**: Không có chức năng này; PageFactory chỉ khởi tạo WebElement theo locator bạn khai báo.
- **Chạy song song**: Liên quan đến cấu hình test runner (JUnit/TestNG), không phải PageFactory.
- **Tự chụp screenshot**: Đó là việc của thư viện report/Allure hoặc code của bạn, không phải PageFactory.`
},
{
  id: 'qz-autotest-054',
  topic: 'autotest',
  q: 'Bạn gọi POST /users bằng RestAssured và cần lấy trường {{id}} trong response JSON để dùng cho request kế tiếp. Cách viết đúng là gì?',
  options: [
    'int id = response.getId(); vì RestAssured tự map response thành object User',
    'int id = given().when().post("/users").then().extract().path("id");',
    'Không thể lấy được giá trị từ response, bắt buộc dùng RestTemplate',
    'int id = given().when().post("/users").body();'
  ],
  answer: 1,
  explain: `**Tóm tắt:** Dùng chuỗi {{given().when().post(...).then().extract().path("id")}}: {{extract()}} lấy về đối tượng {{Response}}, còn {{path("id")}} đọc giá trị theo đường dẫn JSON (JSON path) rồi gán vào biến.

**Giải thích từng bước:**
- **given / when / then là gì:** DSL (ngôn ngữ miền hẹp - cú pháp riêng dễ đọc) của RestAssured. {{given()}} thiết lập input (body, header, query), {{when()}} mô tả hành động HTTP, {{then()}} mô tả mong đợi (assert) và có thể lấy dữ liệu ra.
- **extract().path() làm gì:** {{then().extract()}} trả về {{Response}} để bạn không assert mà chỉ lấy dữ liệu; {{path("id")}} duyệt JSON theo khóa và trả về giá trị (RestAssured suy ra kiểu, ở đây Integer nên gán vào int được). Với JSON lồng nhau dùng {{path("data.user.id")}}.
- **Ví dụ (Java):**
~~~java
int id = given()
        .contentType(ContentType.JSON)
        .body("{\"name\":\"An\"}")
    .when()
        .post("/users")
    .then()
        .statusCode(201)
        .extract().path("id");   // lấy id để tái sử dụng
~~~

**Lỗi hay gặp:** Gọi {{path()}} mà không có {{extract()}} (sai chuỗi), hoặc giả định RestAssured tự populate một POJO - nó không làm điều đó nếu bạn không dùng thư viện mapping như Jackson.

> Senior tip: Tách bước "tạo dữ liệu" (qua API) khỏi bước "kiểm tra UI". Dùng API để seed/test và {{extract().path()}} để lấy id; đây là cách nhanh và ổn định hơn thao tác UI.

### Vì sao các phương án còn lại sai
- **response.getId() tự map User**: Sai. RestAssured không tự sinh object theo model của bạn; bạn phải dùng {{extract().as(User.class)}} (qua Jackson) nếu muốn object.
- **Không lấy được, phải RestTemplate**: Sai. {{extract().path()}} là cách chuẩn, tích hợp sẵn.
- **given().when().post(...).body()**: {{body()}} trên {{RequestSpecification}} là để gửi body request, không phải đọc response; đọc response dùng {{extract().body()/path()}}.`
},
{
  id: 'qz-autotest-055',
  topic: 'autotest',
  multi: true,
  q: 'Trong Allure (công cụ báo cáo test), những cách nào giúp báo cáo dễ đọc và dễ chẩn đoán hơn? (Chọn 2)',
  options: [
    'Dùng {{@Step}} để gom các hành động thành cây bước (step) có thể mở/đóng trong báo cáo',
    'Dùng {{@Attachment}} để đính kèm screenshot, log hoặc JSON vào kết quả test',
    'Ghi mọi thông tin ra {{System.out.println}} vì Allure tự thu thập thành bước',
    'Tắt hết assertion để báo cáo luôn xanh, dễ nhìn'
  ],
  answer: [0, 1],
  explain: `**Tóm tắt:** {{@Step}} tổ chức test thành các bước nghiệp vụ có cấu trúc, còn {{@Attachment}} gắn bằng chứng (ảnh, log, payload) vào đúng test - hai thứ này giúp người đọc báo cáo hiểu ngay chuyện gì đã xảy ra.

**Giải thích từng bước:**
- **@Step là gì:** Đánh dấu một method là một "bước" trong luồng. Allure dựng cây bước lồng nhau, mỗi bước có trạng thái pass/fail và thời gian - nhìn vào là biết khâu nào hỏng.
~~~java
@Step("Đăng nhập user {user}")
void login(String user) { /* ... */ }

@Attachment(value = "Response", type = "application/json")
String attach(String json) { return json; }
~~~
- **@Attachment là gì:** Đính kèm dữ liệu (screenshot khi fail, response API, log) vào test; khi đọc báo cáo không cần chạy lại vẫn thấy bối cảnh.
- **Vì sao có giá trị:** Báo cáo thô kiểu "1 test failed" rất khó điều tra; Allure biến nó thành tài liệu có cấu trúc, nhất là khi CI chạy hàng trăm test.

**Lỗi hay gặp:** Đặt tên step chung chung ("bước 1", "thao tác") - mất tác dụng; nên đặt tên nghiệp vụ rõ ràng ("Thanh toán bằng thẻ thành công").

> Senior tip: Đính screenshot tự động khi fail (dùng listener/TestWatcher trong JUnit 5) và đính trace/log quan trọng. Báo cáo tốt rút ngắn thời gian điều tra fail từ hàng chục phút xuống vài phút.

### Vì sao các phương án còn lại sai
- **System.out.println thay @Step**: Allure không tự biến log stdout thành bước có cấu trúc; bạn phải dùng API của nó (@Step/@Attachment) để có cây bước và đính kèm.
- **Tắt assertion để xanh**: Che giấu lỗi - phản tác dụng; báo cáo xanh nhưng phần mềm vẫn sai.`
},
{
  id: 'qz-autotest-056',
  topic: 'autotest',
  multi: true,
  q: 'Khi tích hợp test automation vào CI (GitHub Actions, GitLab CI...), practice nào giúp pipeline ổn định và đáng tin cậy hơn? (Chọn 2)',
  options: [
    'Chạy test trong môi trường/container sạch, cô lập và cùng cấu hình mỗi lần để tránh "chỉ fail trên máy tôi"',
    'Tự động retry vô hạn mọi test fail để pipeline luôn xanh',
    'Cache dependency (Maven/Gradle) và lưu lại báo cáo/artifact để debug, tránh build lại từ đầu mỗi lần',
    'Chạy toàn bộ E2E cho mọi commit nhỏ, kể cả đổi một dòng chữ'
  ],
  answer: [0, 2],
  explain: `**Tóm tắt:** Hai practice đúng là (1) môi trường cô lập, tái lập được, và (2) cache phụ thuộc cùng lưu artifact để debug - chúng làm kết quả CI nhất quán và nhanh hơn.

**Giải thích từng bước:**
- **Môi trường cô lập:** Nếu mỗi lần chạy dùng cùng container/image, cùng biến môi trường, cùng dữ liệu seed, thì fail là do code chứ không do "máy khác". Đây là nền tảng để loại bỏ flaky do môi trường.
- **Cache + artifact:** Cache {{~/.m2}} (Maven) hay {{~/.gradle}} giúp không tải lại thư viện mỗi lần; lưu lại báo cáo (Allure/HTML), screenshot, log làm build artifact để điều tra khi fail mà không cần chạy lại.
- **Ví dụ (ý tưởng CI):**
~~~yaml
steps:
  - run: mvn -B verify         # chạy test
  - uses: actions/upload-artifact@v4
    if: failure()              # chỉ lưu khi fail cho đỡ tốn
    with: { name: test-reports, path: target/ }
~~~

**Lỗi hay gặp:** Chạy E2E nặng cho mọi commit nhỏ làm pipeline chậm hàng chục phút; nên phân tầng: unit/integration cho mọi commit, E2E cho PR/định kỳ. Hoặc retry vô hạn che giấu bug thật.

> Senior tip: Retry chỉ áp dụng có kiểm soát cho flake đã biết (ví dụ 1 lần) kèm cảnh báo, không phải "retry tới khi xanh". Theo dõi tỷ lệ flaky theo thời gian; CI xanh nhờ retry liên tục là dấu hiệu hệ thống test đang mất niềm tin.

### Vì sao các phương án còn lại sai
- **Retry vô hạn cho mọi test fail**: Che giấu lỗi thật, làm pipeline chậm và người ta mất tin vào màu xanh.
- **Chạy toàn bộ E2E cho mọi commit nhỏ**: Rất chậm và tốn tài nguyên; vi phạm nguyên tắc kim tự tháp test (đẩy test nhanh/nhiều xuống dưới).`
},
{
  id: 'qz-autotest-057',
  topic: 'autotest',
  q: 'Bạn bật chạy test song song trong JUnit 5 ({{junit.jupiter.execution.parallel.enabled=true}}). Rủi ro lớn nhất cần phòng là gì?',
  options: [
    'JUnit 5 không hỗ trợ chạy nhiều thread nên cấu hình vô nghĩa',
    'Test sẽ luôn chạy nhanh hơn nên không cần lo lắng gì thêm',
    'State dùng chung dạng static/biến toàn cục bị nhiều test truy cập đồng thời gây kết quả sai, không xác định',
    'Chạy song song làm toàn bộ assertion bị bỏ qua'
  ],
  answer: 2,
  explain: `**Tóm tắt:** Khi chạy song song, nhiều test chạy cùng lúc trên các thread khác nhau; nếu chúng chia sẻ state (static field, DB chung, file chung) mà không đồng bộ, kết quả sẽ phụ thuộc thứ tự chạy và trở nên flaky.

**Giải thích từng bước:**
- **Song song hoạt động thế nào:** JUnit 5 có thể chạy các class/method trên nhiều thread. Mặc định mỗi test method dùng một instance mới ({{PER_METHOD}}), nên field instance thường an toàn - nhưng {{static}} field và tài nguyên ngoài (DB, port, file tạm) thì KHÔNG tự cô lập.
- **Vì sao nguy hiểm:** Ví dụ hai test cùng ghi vào một bảng rồi cùng đếm số dòng - test A thấy cả dữ liệu của test B, assertion sai. Hoặc hai test cùng chiếm một port cố định.
- **Cách phòng (thực tế):**
  - Tránh {{static}} mutable; nếu buộc dùng, đồng bộ hoặc dùng ThreadLocal.
  - Cô lập dữ liệu: mỗi test một schema/transaction rollback, hoặc dùng Testcontainers với DB riêng.
  - Cấu hình độ song song (parallelism) vừa với tài nguyên CPU/RAM.
~~~java
// junit-platform.properties
junit.jupiter.execution.parallel.enabled=true
junit.jupiter.execution.parallel.mode.default=concurrent
~~~

**Lỗi hay gặp:** Bật song song cho cả suite cũ vốn thiết kế tuần tự, phụ thuộc thứ tự - bùng nổ flaky không rõ nguyên nhân.

> Senior tip: Trước khi bật parallel, làm cho từng test độc lập (không phụ thuộc thứ tự, không share mutable state). Test có I/O nặng hoặc dùng chung tài nguyên nên đánh dấu chạy riêng (resource lock) thay vì cho tất cả đại trà.

### Vì sao các phương án còn lại sai
- **JUnit 5 không hỗ trợ**: Sai. JUnit 5 hỗ trợ parallel execution chính thức qua cấu hình.
- **Luôn nhanh hơn, không cần lo**: Sai. Nhanh hơn nhưng phải trả giá bằng yêu cầu thread-safety; bỏ qua sẽ sinh lỗi.
- **Song song làm mất assertion**: Sai. Assertion vẫn chạy bình thường; vấn đề nằm ở state dùng chung.`
},
{
  id: 'qz-autotest-058',
  topic: 'autotest',
  q: 'Test Selenium giữ một WebElement nút "Lưu"; sau khi bấm và danh sách tải lại, gọi {{element.click()}} bị {{StaleElementReferenceException}}. Nguyên nhân và cách xử lý đúng là gì?',
  options: [
    'Do biến element bị null; chỉ cần kiểm tra null trước khi click',
    'Phần tử đã bị tách khỏi DOM (DOM bị dựng lại) nên tham chiếu cũ hết hiệu lực; cần tìm lại phần tử hoặc dùng {{ExpectedConditions.refreshed}}/{{stalenessOf}}',
    'Do driver bị đóng; mở lại driver là hết lỗi',
    'Do thiếu implicit wait cho thao tác click'
  ],
  answer: 1,
  explain: `**Tóm tắt:** {{StaleElementReferenceException}} xảy ra khi WebElement bạn giữ trỏ tới một nút đã bị trình duyệt thay thế/dựng lại trong DOM; tham chiếu cũ không còn hợp lệ, phải định vị lại.

**Giải thích từng bước:**
- **"Stale" (cũ/thay) nghĩa là gì:** Khi bạn {{findElement}} lần đầu, Selenium trả về một con trỏ tới đúng phần tử đó trong DOM. Nếu trang render lại (AJAX cập nhật, điều hướng, đóng/mở modal), DOM tạo phần tử mới và phần tử cũ bị "detach" (tách rời) - con trỏ cũ trỏ vào hư không.
- **Vì sao xảy ra:** Rất phổ biến với ứng dụng đơn trang (SPA) - React/Angular thay thế node khi state đổi. Test giữ WebElement qua nhiều bước dễ dính.
- **Cách sửa đúng:**
~~~java
// Cách 1: tìm lại ngay trước khi dùng
By saveBtn = By.id("save");
wait.until(ExpectedConditions.elementToBeClickable(saveBtn)).click();

// Cách 2: chờ cho tới khi phần tử cũ "tỉnh lại" (refreshed)
wait.until(ExpectedConditions.refreshed(
    ExpectedConditions.stalenessOf(oldElement)));
~~~
- **Nguyên tắc:** Đừng giữ WebElement qua các thao tác có thể làm reload DOM; dùng {{By}} locator và tìm lại, hoặc dùng framework tự retry (Playwright locator giải quyết gốc vấn đề này).

**Lỗi hay gặp:** Bọc {{try/catch}} rồi bỏ qua exception để "test khỏi đỏ" - chỉ giấu bug; hoặc chèn {{Thread.sleep}} để né timing thay vì định vị lại đúng cách.

> Senior tip: Với ứng dụng động, ưu tiên locator khai báo theo {{By}} và để framework tự resolve mỗi lần dùng. Nếu buộc giữ WebElement (ví dụ thao tác trong danh sách lớn), hãy thao tác trọn trong một "lượt" không có render lại xen giữa.

### Vì sao các phương án còn lại sai
- **Biến null, kiểm tra null**: Sai bản chất; phần tử không null, nó chỉ trỏ tới node đã bị thay.
- **Driver bị đóng**: Nếu driver đóng sẽ là {{NoSuchSessionException}}/ WebDriverException khác, không phải stale element.
- **Thiếu implicit wait**: Stale element không liên quan thời gian chờ; phần tử đã từng tồn tại nhưng bị thay.`
},
{
  id: 'qz-autotest-059',
  topic: 'autotest',
  q: 'Bạn muốn chạy bộ test Selenium trên nhiều máy và nhiều trình duyệt khác nhau song song (một máy Chrome, một máy Firefox). Phát biểu nào đúng?',
  options: [
    'Selenium chỉ chạy được một trình duyệt trên một máy, không thể phân tán',
    'Phải viết lại toàn bộ test bằng Playwright mới chạy song song được',
    'Selenium Grid chỉ dùng để chụp screenshot',
    'Dùng Selenium Grid: một hub điều phối, các node (mỗi máy/trình duyệt) thực thi; test tạo {{RemoteWebDriver}} trỏ tới endpoint của hub kèm capability mong muốn'
  ],
  answer: 3,
  explain: `**Tóm tắt:** Selenium Grid phân tán việc chạy test: hub (trung tâm) nhận yêu cầu, node (các máy có trình duyệt) thực thi; client dùng {{RemoteWebDriver}} chỉ tới URL hub và khai báo browser/OS qua capabilities.

**Giải thích từng bước:**
- **Vì sao cần Grid:** Một bộ test lớn chạy tuần tự trên một máy rất lâu; Grid chia tải ra nhiều máy/trình duyệt (ma trận) để chạy song song và kiểm thử đa nền tảng.
- **Kiến trúc:** Hub giữ danh sách node và điều phối phiên; mỗi node đăng ký capability nó có (ví dụ browserName=chrome, platform=WINDOWS). Client xin một phiên khớp capability, Grid cấp cho node phù hợp.
- **Ví dụ (Java):**
~~~java
ChromeOptions opts = new ChromeOptions();
WebDriver driver = new RemoteWebDriver(
    new URL("http://grid-hub:4444/wd/hub"), opts);
// driver thực thi trên node từ xa, code test không đổi nhiều
~~~
- **Lưu ý Selenium 4:** Grid có kiến trúc mới (Router, Distributor, Session Map, Event Bus) nhưng khái niệm hub/node và RemoteWebDriver vẫn là cách dùng phổ biến để nói về phân tán.

**Lỗi hay gặp:** Quên rằng test trên Grid chậm hơn do độ trễ mạng; screenshot/trace hữu ích để chẩn đoán. Hoặc thiết kế test phụ thuộc máy local (đường dẫn file cứng, port cố định) sẽ hỏng trên node khác.

> Senior tip: Với CI, kết hợp containerize node theo trình duyệt cần test và chạy song song theo ma trận (browser x OS). Test phải độc lập máy: không giả định localhost, không hardcode đường dẫn tuyệt đối.

### Vì sao các phương án còn lại sai
- **Chỉ một trình duyệt, không phân tán**: Sai; Grid sinh ra chính để phân tán đa trình duyệt/đa máy.
- **Phải viết lại bằng Playwright**: Sai. Playwright có cơ chế riêng để song song, nhưng Selenium hoàn toàn phân tán được bằng Grid.
- **Grid chỉ chụp screenshot**: Sai; Grid điều phối việc chạy test trên nhiều node, không phải công cụ chụp ảnh.`
},
{
  id: 'qz-autotest-060',
  topic: 'autotest',
  multi: true,
  q: 'Trong RestAssured, những phát biểu nào đúng? (Chọn 2)',
  options: [
    '{{matchesJsonSchema(...)}} dùng để xác minh body response khớp một JSON Schema cho trước',
    'RestAssured chỉ gọi được HTTP GET, không gọi được POST/PUT/DELETE',
    'Có thể dùng Hamcrest matcher như {{equalTo}}/{{hasItem}} trong {{then().body(...)}} để assert nội dung',
    'RestAssured là công cụ chạy test giao diện browser E2E'
  ],
  answer: [0, 2],
  explain: `**Tóm tắt:** RestAssured hỗ trợ xác minh cấu trúc bằng {{matchesJsonSchema}} (đối chiếu JSON Schema) và assert giá trị bằng Hamcrest matcher trong {{then().body(...)}} - rất mạnh cho kiểm thử API.

**Giải thích từng bước:**
- **matchesJsonSchema là gì:** JSON Schema là "khuôn mẫu" mô tả cấu trúc và kiểu dữ liệu mà response phải theo. {{then().body(matchesJsonSchema(...))}} kiểm tra toàn bộ response có đúng khuôn không - hữu ích khi bạn cần đảm bảo contract ổn định.
- **Hamcrest matcher là gì:** Bộ "mô tả điều kiện" như {{equalTo(5)}}, {{hasItem("A")}}, {{greaterThan(0)}}; ghép vào {{body("data[0].id", equalTo(5))}} để assert một trường, hoặc {{body("tags", hasItem("vip"))}} cho mảng.
- **Ví dụ (Java):**
~~~java
given().when().get("/users/1")
    .then().statusCode(200)
        .body("id", equalTo(1))
        .body("roles", hasItem("ADMIN"))
        .body(matchesJsonSchema(new ClassPathResource("user-schema.json")));
~~~
- **Vì sao mạnh:** Kiểm tra cả status, từng trường lẫn cấu trúc tổng thể chỉ bằng DSL dễ đọc, thay vì tự parse JSON thủ công.

**Lỗi hay gặp:** Dùng JsonPath sai cú pháp ({{data[0].id}} vs {{data.id}}) làm matcher chạy trên giá trị null; nên in response ra log khi assert fail để dò.

> Senior tip: Dùng JSON Schema validation cho các API contract quan trọng để bắt sớm thay đổi phá vỡ client; kết hợp Hamcrest cho từng trường nghiệp vụ. Tách file schema ra resources để tái dùng.

### Vì sao các phương án còn lại sai
- **Chỉ GET, không POST/PUT**: Sai. RestAssured hỗ trợ đủ method ({{get/post/put/patch/delete}}).
- **Là công cụ chạy browser E2E**: Sai. Đó là Selenium/Playwright; RestAssured chuyên kiểm thử API REST.`
},
);
