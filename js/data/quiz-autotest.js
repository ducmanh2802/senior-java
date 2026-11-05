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
}
);
