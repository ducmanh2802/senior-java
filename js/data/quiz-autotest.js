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
    'Lưu cookie/localStorage để tái sử dụng session đăng nhập',
    'Lưu screenshot baseline',
    'Lưu trace file',
    'Lưu HAR network'
  ],
  answer: 0,
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
    'Khi cần debug test fail bằng timeline, network, console, screenshot',
    'Khi cần tăng tốc test',
    'Khi cần chạy song song',
    'Khi cần sinh code test'
  ],
  answer: 0,
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
    'Chia suite test thành nhiều phần chạy song song trên nhiều máy',
    'Tự sửa test fail',
    'Giảm số lượng test',
    'Tạo báo cáo Allure'
  ],
  answer: 0,
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
    'Mobile native/hybrid/webview',
    'API backend',
    'Database'
  ],
  answer: 1,
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
    '{{assertThat(locator).hasText(...)}} là web-first assertion: tự retry/đợi đến khi text khớp hoặc timeout; {{textContent()}} lấy giá trị tức thời',
    'Hai cách hoàn toàn tương đương về cơ chế chờ',
    '{{textContent()}} luôn ném exception nếu phần tử chưa có text'
  ],
  answer: 1,
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
    '{{context.tracing().start(new Tracing.StartOptions().setScreenshots(true).setSnapshots(true).setSources(true));}} ... {{context.tracing().stop(new Tracing.StopOptions().setPath(Paths.get("trace.zip")));}}',
    'Chỉ cần {{page.screenshot()}} khi test fail',
    'Bật {{setHeadless(false)}} để nhìn thấy lỗi thay vì tracing'
  ],
  answer: 1,
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
    'Kiểm tra {{response.ok()}}/{{response.status()}}, đọc {{response.text()}} hoặc {{response.json()}}; có thể dùng {{assertThat(response).isOK()}}',
    '{{APIResponse}} không có body; phải gọi lại bằng {{HttpURLConnection}} để đọc',
    'Chỉ cần {{response != null}} là request thành công'
  ],
  answer: 1,
  explain: `**Tóm tắt:** {{APIResponse}} cung cấp status, header, body ({{text()}}, {{body()}}, {{json()}}); Playwright có API assertion {{assertThat(response).isOK()}} để kiểm tra HTTP 2xx.

**Giải thích từng bước:**
- **APIResponse là gì:** Kết quả trả về từ {{APIRequestContext}} ({{get/post/...}}). Nó chứa mã trạng thái HTTP (status code), header và nội dung body.
- **Cách kiểm tra:**
~~~java
APIResponse res = context.request().post("/api/orders",
    RequestOptions.create()
        .setHeader("Content-Type", "application/json")
        .setData("{\"sku\":\"A1\"}"));
assertThat(res).isOK();            // 2xx
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
}
);
