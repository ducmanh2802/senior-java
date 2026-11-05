/* Topic autotest: Automation Test từ cơ bản tới nâng cao (Selenium/Playwright, REST Assured, BDD, CI, framework design, SDET). Format: AGENTS.md mục 4 */
(window.QUESTIONS = window.QUESTIONS || []).push(

{
  id: 'autotest-001',
  topic: 'autotest',
  level: 'mid',
  q: 'Trong dự án web, bạn ưu tiên tự động hoá loại kiểm thử nào trước (unit, API, UI) để đạt ROI tốt nhất? So sánh test pyramid và testing trophy trong bối cảnh automation test, và giải thích cách bạn chọn chiến lược cho một team vừa có dev vừa có QA.',
  a: `**Tóm tắt:** ROI (lợi tức trên công sức bỏ ra) của automation thường cao nhất ở tầng **unit và API/integration**, thấp nhất ở UI end-to-end (E2E, chạy xuyên suốt từ giao diện người dùng tới hệ thống thật). Test pyramid khuyên đáy rộng (nhiều unit) – đỉnh hẹp (ít UI); testing trophy (cách nhìn hiện đại hơn, do Kent C. Dodds phổ biến) nhấn mạnh tầng **integration** mang lại nhiều giá trị nhất. Với team dev + QA, chiến lược thực dụng là: dev giữ unit/integration gần code, QA tập trung API automation và một bộ UI E2E nhỏ cho luồng nghiệp vụ quan trọng.

### Vì sao cần chọn đúng thứ để tự động hoá
Automation (tự động hoá kiểm thử: dùng chương trình chạy test thay người bấm tay) tốn chi phí viết, bảo trì và chạy trong CI (Continuous Integration – hệ thống tự build/test mỗi lần đẩy code). Nếu tự động hoá sai tầng, test chậm, hay hỏng vặt (flaky – lúc pass lúc fail) và bị bỏ qua. Mục tiêu là bắt lỗi sớm với chi phí thấp nhất.

### Test pyramid vs testing trophy
| Khía cạnh | Test pyramid (kim tự tháp) | Testing trophy (chiếc cúp) |
|---|---|---|
| Ý tưởng gốc | Mike Cohn; nhiều test nhỏ, nhanh ở đáy | Kent C. Dodds; ưu tiên integration |
| Tầng dày nhất | Unit test (test từng hàm/lớp riêng lẻ) | Integration (nhiều phần ghép cùng nhau) |
| UI E2E | Rất ít, chỉ luồng sống còn | Ít, nhưng không coi thường |
| Điểm mạnh | Phản hồi nhanh, cô lập lỗi tốt | Bắt lỗi ở ranh giới tích hợp, gần hành vi thật |
| Rủi ro | Quá nhiều unit mock → bỏ sót lỗi ghép nối | Integration chậm hơn, cần môi trường ổn định |
| Phù hợp automation UI | Hạn chế UI E2E | Cũng hạn chế UI E2E, nhưng chấp nhận API/integration nhiều hơn |

Sơ đồ ASCII (tưởng tượng):
~~~text
   Pyramid:          Trophy:
      /             (E2E)
     /UI            /----    /----          / INTE    <- dày
   / INTE         / GRATION  /--------       --------/
 /   UNIT           (UNIT)
 /------------       (STATIC)
~~~

### Ưu tiên theo ROI (thực tế cho web Java)
1. **Unit test** (dev viết): nhanh (mili-giây), chạy mọi commit, chi phí bảo trì thấp. ROI cao cho logic nghiệp vụ (tính phí, phân quyền).
2. **API automation** (QA/SDET viết, dùng REST Assured): không phụ thuộc giao diện, ổn định hơn UI, chạy nhanh hơn E2E trình duyệt, phủ được nghiệp vụ lõi. Thường là "điểm ngọt" ROI cho QA.
3. **UI E2E** (Selenium/Playwright): cần cho luồng quan trọng end-to-end (đăng nhập, đặt hàng, thanh toán) nhưng chậm, dễ flaky, tốn bảo trì khi UI đổi. Giữ số lượng nhỏ, chọn lọc.

### Ví dụ cụ thể (số liệu minh hoạ)
Giả sử luồng "đặt hàng": 200 unit test chạy 20 giây; 50 API test chạy 2 phút; 10 UI E2E chạy 15 phút và 2 test hay flaky. Nếu team chỉ có 30 phút CI, đầu tư thêm 5 UI test mới có thể đẩy CI quá lâu và gây nhiễu; đầu tư 20 API test phủ rule giảm giá/ tồn kho cho giá trị cao hơn.

### Cách chọn chiến lược cho team dev + QA
- **RACI đơn giản:** dev sở hữu unit + test gần code; QA/SDET sở hữu API suite và UI smoke (bộ test khói – kiểm tra nhanh các luồng sống còn).
- **Quy tắc chọn lọc UI:** chỉ tự động hoá luồng doanh thu/rủi ro cao, tần suất chạy nhiều, và giao diện tương đối ổn định. Kiểm thử khám phá (exploratory – tester tự do khám phá) vẫn do người làm.
- **Đo ROI:** theo dõi thời gian chạy, tỉ lệ flaky, số lỗi bắt được trước release. Cắt/bớt test không còn giá trị.

### Lỗi hay gặp
- Tự động hoá mọi ca kiểm thử thủ công, kể cả ca hiếm khi chạy → bảo trì quá tải.
- Đảo ngược kim tự tháp (ice-cream cone): quá nhiều UI, ít unit/API → CI chậm, flaky.
- Không gắn owner → test hỏng không ai sửa, cuối cùng bị tắt.

### Trả lời phỏng vấn thế nào
Nêu rõ: "Tôi ưu tiên unit và API trước vì nhanh, ổn định, ROI cao; UI E2E chỉ cho luồng critical. Tôi chọn pyramid hay trophy tuỳ ngữ cảnh – với web nhiều tích hợp tôi nghiêng về trophy (integration/API dày). Với team dev+QA tôi phân chia ownership và đo flaky/time để điều chỉnh." Đưa ví dụ số liệu hoặc trải nghiệm thật.

> Senior tip: Đừng tranh luận giáo điều pyramid vs trophy. Hãy dùng dữ liệu pipeline của bạn (thời gian, flaky rate, defect leakage – lỗi lọt ra production) để quyết định tầng nào cần đầu tư thêm, và sẵn sàng xoá test automation có ROI âm.`,
  follow: [
    'Một UI test flaky liên tục: bạn sửa, cô lập hay xoá? Tiêu chí quyết định là gì?',
    'Làm sao đo "defect leakage" để biết chiến lược automation của team có hiệu quả?',
    'Khi chuyển từ manual sang automation, bạn bắt đầu từ đâu trong 1 sprint đầu tiên?'
  ],
  refs: [
    { type: 'article', title: 'The Practical Test Pyramid (Ham Vocke, Martin Fowler site)', url: 'https://martinfowler.com/articles/practical-test-pyramid.html' },
    { type: 'article', title: 'Write tests. Not too many. Mostly integration. (Kent C. Dodds)', url: 'https://kentcdodds.com/blog/write-tests' }
  ]
},

{
  id: 'autotest-002',
  topic: 'autotest',
  level: 'senior',
  q: 'Selenium 4 hoạt động bên trong như thế nào: trình duyệt được điều khiển qua cơ chế gì (W3C WebDriver protocol), vai trò của driver binary, và Selenium Manager giúp gì? So sánh với Selenium 3 (JSON Wire Protocol).',
  a: `**Tóm tắt:** Selenium WebDriver điều khiển trình duyệt bằng cách gửi lệnh HTTP theo chuẩn **W3C WebDriver protocol** (một đặc tả mở: định nghĩa endpoint như /session, /element, /click). Code test gọi WebDriver API → thư viện client chuyển thành HTTP request → **driver binary** (chromedriver, geckodriver – chương trình trung gian do hãng trình duyệt cung cấp) dịch lệnh thành hành động native của trình duyệt. Selenium 4 dùng chuẩn W3C trực tiếp (ổn định hơn), còn Selenium 3 chủ yếu dùng **JSON Wire Protocol** (giao thức cũ, không chuẩn hoá đầy đủ). **Selenium Manager** (tích hợp từ Selenium 4.6+) tự tải và cấu hình driver/browser phù hợp, giảm lỗi phiên bản.

### Bức tranh tổng thể: các thành phần
~~~text
[Test code Java]
      |
      v
[Selenium Client (WebDriver API)]  -- HTTP (W3C WebDriver) -->
      |                                                 |
      |                                          [Driver binary]
      |                                          chromedriver / geckodriver
      |                                                 |
      |                                          [Browser engine]
      v                                                 v
  kết quả/assert                                   Chrome / Firefox
~~~
- **Client library** (selenium-java): cung cấp lớp như {{ChromeDriver}}, {{WebElement}}. Nó không "điều khiển trình duyệt trực tiếp" mà gửi request.
- **Driver binary**: cầu nối. Mỗi trình duyệt có driver riêng vì engine khác nhau. Driver hiểu lệnh W3C và gọi API nội bộ của trình duyệt.
- **Browser**: thực thi thật (render, chạy JS, xử lý sự kiện).

### W3C WebDriver protocol là gì
- Là **chuẩn web** (W3C Recommendation) mô tả cách tự động hoá trình duyệt qua HTTP + JSON. Ví dụ: {{POST /session}} tạo phiên; {{POST /session/:id/element}} tìm phần tử; {{POST /session/:sessionId/element/:elementId/click}} click.
- Vì là chuẩn, các trình duyệt/driver triển khai cùng "ngôn ngữ" → script Selenium chạy được trên nhiều trình duyệt (cross-browser) nếu tuân API.
- Selenium 4 giao tiếp **native W3C**: ít phải dịch qua lại, giảm khác biệt hành vi giữa driver.

### Selenium 3 vs Selenium 4
| Khía cạnh | Selenium 3 | Selenium 4 |
|---|---|---|
| Giao thức chính | JSON Wire Protocol (cũ, không chuẩn W3C đầy đủ) | W3C WebDriver protocol (chuẩn) |
| Tương thích driver | Client đôi khi phải encode/decode giữa 2 giao thức | Giao tiếp W3C trực tiếp, ổn định hơn |
| Quản lý driver | Thường dùng thư viện ngoài (WebDriverManager) hoặc tự tải | **Selenium Manager** tích hợp (tự resolve driver/browser) |
| Tính năng mới | Hạn chế | Relative locators, cải thiện Actions, hỗ trợ CDP/ BiDi tốt hơn, Grid 4 thiết kế lại |
| Grid | Hub/Node kiến trúc cũ | Grid 4: Router/Distributor/Node, hỗ trợ Docker, observability |

Lưu ý: "CDP" (Chrome DevTools Protocol) và "WebDriver BiDi" (giao thức hai chiều mới) là cơ chế bổ sung cho tính năng nâng cao (network interception, console log). Chúng không thay thế W3C WebDriver cho điều khiển cơ bản.

### Selenium Manager
- Vấn đề cũ: phiên bản Chrome cập nhật liên tục → chromedriver phải khớp phiên bản; lệch phiên bản gây lỗi "session not created". Team phải tự tải driver, đặt PATH, hoặc dùng thư viện bên thứ ba.
- Selenium Manager: thành phần đi kèm Selenium, khi khởi tạo driver nó **phát hiện trình duyệt đã cài**, xác định phiên bản phù hợp, tải driver (và nếu cần browser) rồi cấu hình. Giúp "chạy được ngay" trên máy dev/CI mới.
- Vẫn có thể override (chỉ định đường dẫn driver) khi môi trường đặc biệt.

### Ví dụ Java tối giản (Selenium 4)
~~~java
import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.chrome.ChromeDriver;

public class Demo {
    public static void main(String[] args) {
        // Selenium Manager tự lo driver nếu chưa cấu hình thủ công
        WebDriver driver = new ChromeDriver(); // mở phiên trình duyệt (POST /session)
        try {
            driver.get("https://example.com"); // điều hướng
            String title = driver.getTitle();  // truy vấn trạng thái qua W3C
            driver.findElement(By.id("login")).click(); // tìm + click
            System.out.println(title);
        } finally {
            driver.quit(); // đóng phiên, giải phóng tài nguyên
        }
    }
}
~~~

### Lỗi hay gặp
- Lệch phiên bản browser/driver (dù có Selenium Manager, môi trường CI bị chặn mạng tải driver) → lỗi khởi tạo session.
- Quên {{quit()}} → tiến trình browser/driver treo, tốn RAM trên máy CI.
- Nhầm lẫn: Selenium không "nhìn màn hình như người" mà gửi lệnh protocol; nếu phần tử bị che/animation, click có thể thất bại dù mắt người thấy.

### Trả lời phỏng vấn thế nào
Trình bày chuỗi: "Test Java → Selenium client → HTTP W3C WebDriver → driver binary (chromedriver/geckodriver) → browser". Nhấn mạnh Selenium 4 chuẩn hoá W3C (bỏ phụ thuộc JSON Wire) và Selenium Manager giải bài toán ghép phiên bản driver. Nêu một lỗi thực tế bạn từng gặp (version mismatch) và cách xử lý.

> Senior tip: Khi debug lỗi "intermittent" (thỉnh thoảng), hãy nhớ có nhiều lớp: test, client lib, driver, browser, mạng, app. Bật log driver (ví dụ chromedriver verbose) và hiểu lệnh W3C nào đang gửi giúp khoanh vùng nhanh hơn là chỉ nhìn stack trace test.`,
  follow: [
    'Khi nào bạn cần Selenium Grid 4, và các thành phần Router/Distributor/Node làm gì?',
    'Selenium Manager không tải được driver trong CI (mạng hạn chế): bạn xử lý thế nào?',
    'WebDriver BiDi khác W3C WebDriver "một chiều" ở điểm nào, và nó mở ra khả năng gì?'
  ],
  refs: [
    { type: 'doc', title: 'W3C WebDriver Specification', url: 'https://www.w3.org/TR/webdriver2/' },
    { type: 'doc', title: 'Selenium Manager (Selenium documentation)', url: 'https://www.selenium.dev/documentation/selenium_manager/' },
    { type: 'doc', title: 'Selenium WebDriver documentation', url: 'https://www.selenium.dev/documentation/webdriver/' }
  ]
},
{
  id: 'autotest-003',
  topic: 'autotest',
  level: 'senior',
  q: 'So sánh Selenium, Playwright và Cypress về kiến trúc, cơ chế auto-wait, hỗ trợ đa trình duyệt/đa ngôn ngữ, và khả năng chạy song song. Khi nào bạn chọn công cụ nào cho dự án Java enterprise?',
  a: `**Tóm tắt:** **Selenium** dùng giao thức W3C WebDriver qua driver binary (đa ngôn ngữ, đa trình duyệt rất rộng, hệ sinh thái lớn) nhưng auto-wait phải tự quản lý nhiều. **Playwright** (Microsoft) điều khiển trình duyệt qua giao thức gốc của browser, có **auto-wait** mạnh, tracing/debug tốt, hỗ trợ Chromium/Firefox/WebKit; có bản Java chính thức. **Cypress** chạy gắn với vòng lặp trình duyệt và chủ yếu JavaScript/TypeScript – ít phù hợp team Java thuần. Chọn theo stack team, cross-browser, độ ổn định/flaky, và CI.

### Bảng so sánh nhanh
| Khía cạnh | Selenium 4 | Playwright (Java) | Cypress |
|---|---|---|---|
| Kiến trúc | Client → HTTP W3C → driver → browser | Client → protocol native browser | Runner gắn event loop trình duyệt (JS) |
| Ngôn ngữ | Java, C#, Python, JS, Ruby… | JS/TS, Python, Java, .NET | JS/TS chính |
| Trình duyệt | Chrome, Firefox, Edge, Safari (driver) | Chromium, Firefox, WebKit | Chrome-family, Firefox, Edge |
| Auto-wait | Cần explicit/fluent wait | Tự đợi element actionable | Tự retry/wait trong nhiều lệnh |
| Đa tab/context | Qua window handle | Browser context/page cô lập tốt | Có hạn chế tuỳ kịch bản |
| Song song | Grid / runner parallel | Parallel worker tốt | Chia spec / dịch vụ bổ sung |
| Network mock/trace | Thêm lib/CDP | {{page.route()}}, trace viewer tích hợp | {{cy.intercept()}} |
| Phù hợp Java enterprise | Rất quen thuộc | Tốt dự án mới, giảm flaky | Hạn chế nếu Java-only |

### Auto-wait và flaky
- **Flaky** (lúc pass lúc fail do timing/môi trường): nguyên nhân lớn là thao tác khi phần tử chưa sẵn sàng.
- Selenium: {{findElement}} thấy DOM chưa chắc click được (bị che/animation) → cần **explicit wait**.
- Playwright: {{click()/fill()}} tự chờ actionable → giảm flaky timing. Vẫn phải chờ điều kiện nghiệp vụ (API xong).
- Cypress: retry/assertion giúp, nhưng mô hình bất đồng bộ khác.

### Khi nào chọn (Java enterprise)
- **Selenium:** framework lớn sẵn có, legacy, đa ngôn ngữ, Grid sẵn. Đầu tư chuẩn hoá wait/locator.
- **Playwright for Java:** dự án mới, cần giảm flaky, trace/network mock, test cô lập. Hợp web hiện đại.
- **Cypress:** khi frontend JS dẫn dắt; thường không ưu tiên cho team Java thuần.

### Lỗi hay gặp
- Chọn theo xu hướng, bỏ qua kỹ năng team/chi phí chuyển đổi.
- Tin auto-wait tuyệt đối: race condition vẫn có khi API chậm/websocket.
- Đánh giá chỉ bằng demo; hãy thử ca thật có auth, upload, bảng.

### Trả lời phỏng vấn thế nào
So sánh theo kiến trúc, auto-wait/flaky, cross-browser, team fit, debug/CI. Kết bằng quyết định có bối cảnh và trade-off.

> Senior tip: Công cụ chỉ giảm một phần flaky. Dữ liệu test cô lập, locator bền và chờ đúng điều kiện nghiệp vụ quyết định độ ổn định – đánh giá cách viết test, không chỉ công cụ.`,
  follow: [
    'Playwright browser context giúp cô lập test như thế nào?',
    'Nếu phải test trên Safari thật, Selenium và Playwright đáp ứng ra sao?',
    'Bạn migrate dần từ Selenium sang Playwright thế nào để không chặn release?'
  ],
  refs: [
    { type: 'doc', title: 'Playwright for Java', url: 'https://playwright.dev/java/' },
    { type: 'doc', title: 'Selenium Overview', url: 'https://www.selenium.dev/documentation/overview/' },
    { type: 'doc', title: 'Auto-waiting (Playwright)', url: 'https://playwright.dev/java/docs/actionability' }
  ]
},
{
  id: 'autotest-004',
  topic: 'autotest',
  level: 'mid',
  q: 'Làm thế nào để chọn locator (cách xác định phần tử trên trang) bền vững cho UI test? So sánh id, CSS selector, XPath, và data-testid; bạn phối hợp với developer để thêm data-testid như thế nào?',
  a: `**Tóm tắt:** Locator bền vững **ít thay đổi khi UI chỉnh layout** và phản ánh **ý định** phần tử (nút đăng nhập) thay vì cấu trúc mong manh (div thứ 3). Ưu tiên: {{data-testid}} (hoặc data-test) dành riêng cho test → id/name ổn định → CSS selector ngắn có ngữ nghĩa → tránh XPath dài phụ thuộc cấu trúc. Phối hợp dev: thống nhất quy ước đặt {{data-testid}}, thêm vào component, coi là "hợp đồng" cho test.

### Locator là gì
Automation (Selenium/Playwright) phải **tìm đúng phần tử** (element – nút, ô nhập) để thao tác. Locator là "địa chỉ": theo id, CSS (ngôn ngữ chọn phần tử web), XPath (ngôn ngữ truy vấn cây HTML), hoặc thuộc tính tuỳ chỉnh.

### So sánh
| Loại | Ví dụ | Ưu điểm | Nhược điểm | Độ bền |
|---|---|---|---|---|
| id | {{By.id("email")}} | Nhanh, rõ | Bền chỉ khi dev giữ ổn định; id sinh động sẽ đổi | Cao nếu ổn định |
| name | {{By.name("username")}} | Dễ hiểu form | Không phải lúc nào có | Trung bình |
| CSS selector | {{[data-testid='login-btn']}} | Linh hoạt, thường nhanh | Selector cấu trúc ({{div>div:nth-child(3)}}) giòn | Tuỳ cách viết |
| XPath | {{//button[text()='Login']}} | Mạnh (theo text/cây) | Dài, dễ phụ thuộc cấu trúc/text đổi | Thường giòn nếu lạm dụng |
| data-testid | {{[data-testid='submit-order']}} | Tách test khỏi style/layout; ý định rõ | Cần dev thêm/duy trì quy ước | Cao khi có quy ước |

### Giòn vs bền
- **Giòn:** {{//div[2]/form/div[3]/button[1]}} – thêm một {{div}} là hỏng; hoặc class CSS framework đổi khi nâng phiên bản.
- **Bền:** {{[data-testid='checkout-submit']}} – đổi layout/class trang trí, miễn giữ thuộc tính test.

### Phối hợp thêm data-testid
1. **Quy ước tên:** {{kebab-case}} theo hành vi: {{login-submit}}, {{cart-item-price}}. Tránh {{button-3}}.
2. **Vị trí:** phần tử tương tác hoặc có ý nghĩa nghiệp vụ (nút, input, thông báo lỗi).
3. **Ổn định:** đổi tên phải phối hợp (search usage trong test).
4. **Production:** thường giữ (thuộc tính HTML nhỏ). Nếu ẩn, dùng cơ chế build có chủ đích nhưng đảm bảo test chạy đúng môi trường.

~~~html
<input data-testid="search-input" type="text" />
<li data-testid="search-result-item">...</li>
~~~
~~~java
// Selenium
driver.findElement(By.cssSelector("[data-testid='search-input']")).sendKeys("phone");
~~~

### Chiến lược
- Có {{data-testid}}: dùng nó. Có id/name ổn định: dùng. Cần theo text: chấp nhận nhưng cẩn thận đa ngôn ngữ (Playwright có {{getByRole/getByText}} hỗ trợ accessibility). Tránh XPath tuyệt đối, {{nth-child}}, class sinh động.

### Lỗi hay gặp
- Copy XPath từ DevTools rồi dán → cực giòn.
- Dùng text hiển thị cho app đa ngôn ngữ không có chiến lược.
- {{data-testid}} trùng lặp trong trang → chọn sai phần tử.

### Trả lời phỏng vấn thế nào
Nêu thứ tự ưu tiên và lý do (độ bền, tách khỏi UI). Nhấn mạnh cộng tác dev và {{data-testid}} là hợp đồng. Đưa ví dụ locator giòn bạn từng sửa.

> Senior tip: Định vị theo **ý định người dùng** (vai trò, nhãn, test id) và chốt quy ước với team – tiết kiệm rất nhiều giờ sửa test vặt khi UI đổi.`,
  follow: [
    'Khi nào chấp nhận dùng XPath, và viết XPath tương đối bền hơn thế nào?',
    'Xử lý phần tử có id sinh động (random mỗi render) ra sao?',
    'Locator theo accessibility (getByRole) có lợi ích gì so với CSS thuần?'
  ],
  refs: [
    { type: 'doc', title: 'Locators (Selenium)', url: 'https://www.selenium.dev/documentation/webdriver/elements/locators/' },
    { type: 'doc', title: 'Locators (Playwright Java)', url: 'https://playwright.dev/java/docs/locators' }
  ]
},
{
  id: "autotest-005",
  topic: "autotest",
  level: "mid",
  q: "Giải thích các chiến lược wait trong Selenium: implicit wait, explicit wait, fluent wait. Vì sao không nên trộn implicit và explicit? StaleElementReferenceException là gì, nguyên nhân và cách xử lý an toàn?",
  a: `**Tóm tắt:** **Wait** (chờ) giúp test đợi trang/ phần tử sẵn sàng. **Implicit wait**: cấu hình toàn cục, WebDriver tự thử lại khi tìm phần tử – đơn giản nhưng khó kiểm soát. **Explicit wait**: chờ một **điều kiện cụ thể** (clickable, visible) với timeout rõ. **Fluent wait** là explicit linh hoạt hơn (polling interval, bỏ qua exception tạm thời). Không nên trộn implicit và explicit vì thời gian chờ có thể cộng dồn/khó đoán. **StaleElementReferenceException** xảy ra khi tham chiếu phần tử trỏ tới DOM đã bị thay thế/xoá (trang re-render); xử lý bằng cách tìm lại phần tử hoặc chờ trạng thái ổn định.

### Vì sao cần wait
Web hiện đại tải bất đồng bộ (AJAX/fetch – gọi dữ liệu nền), render lại DOM, có animation. Test chạy nhanh hơn người; nếu click khi nút chưa sẵn sàng → lỗi.

### Ba loại wait
| Loại | Cách dùng | Ưu | Nhược |
|---|---|---|---|
| Implicit wait | {{driver.manage().timeouts().implicitlyWait(Duration.ofSeconds(10))}} | Bật một lần | Áp dụng mọi {{findElement}}; không chờ điều kiện phức tạp; khó debug; xung đột với explicit |
| Explicit wait | {{new WebDriverWait(driver, Duration.ofSeconds(10)).until(ExpectedConditions.elementToBeClickable(...))}} | Chờ đúng điều kiện, timeout rõ | Phải viết ở điểm cần |
| Fluent wait | {{FluentWait}} + {{withTimeout/pollingEvery/ignoring}} | Tuỳ biến polling, bỏ qua exception tạm thời | Dài dòng hơn |

~~~java
import org.openqa.selenium.*;
import org.openqa.selenium.support.ui.*;
import java.time.Duration;

// Explicit: chờ nút clickable (hiện + enabled)
By pay = By.cssSelector("[data-testid='pay-btn']");
WebDriverWait wait = new WebDriverWait(driver, Duration.ofSeconds(10));
wait.until(ExpectedConditions.elementToBeClickable(pay)).click();

// Fluent: thử lại mỗi 500ms, bỏ qua not-found tạm thời
Wait<WebDriver> fluent = new FluentWait<>(driver)
    .withTimeout(Duration.ofSeconds(15))
    .pollingEvery(Duration.ofMillis(500))
    .ignoring(NoSuchElementException.class);
fluent.until(d -> d.findElement(By.id("result")).isDisplayed());
~~~

### Vì sao không trộn implicit và explicit
Selenium khuyến nghị không kết hợp. Hai cơ chế cùng can thiệp vào tìm/chờ; khi trộn, thời gian chờ thực tế có thể cộng dồn hoặc khó đoán tuỳ driver, gây test chậm bất ngờ hoặc timeout kỳ lạ. Thực hành tốt: implicit = 0 (hoặc không set) và dùng explicit/fluent có mục đích.

### StaleElementReferenceException
- **Stale** (tham chiếu hết hạn): bạn giữ {{WebElement btn}} lúc T1. Trang JS re-render/refresh vùng → node cũ bị thay. {{btn}} trỏ địa chỉ cũ → thao tác ném {{StaleElementReferenceException}}.
- Nguyên nhân hay gặp: lưu element rồi DOM đổi; lặp danh sách nhưng DOM thay giữa vòng; SPA (Single Page Application – ứng dụng một trang, render lại nhiều) re-render.

Xử lý an toàn:
1. **Tìm lại phần tử** ngay trước khi dùng (đừng giữ reference lâu).
2. **Chờ locator ổn định** (presence/clickable) thay vì dùng object cũ.
3. **Retry nhỏ có kiểm soát** khi hiểu nguyên nhân là re-render.

~~~java
// Luôn locate lại khi cần
wait.until(ExpectedConditions.elementToBeClickable(pay)).click();

// Retry nhỏ khi re-render (thận trọng)
for (int i = 0; i < 2; i++) {
    try {
        wait.until(ExpectedConditions.elementToBeClickable(pay)).click();
        break;
    } catch (StaleElementReferenceException e) {
        if (i == 1) throw e; // lần cuối vẫn lỗi thì báo thật
    }
}
~~~

### Lỗi hay gặp
- {{Thread.sleep(5000)}} thay cho wait điều kiện → chậm và vẫn flaky.
- Implicit wait lớn "cho chắc" → find sai locator cũng chờ lâu.
- Bắt {{Exception}} chung và nuốt stale → che lỗi thật.

### Trả lời phỏng vấn thế nào
Phân biệt 3 wait, khuyến nghị explicit và tránh trộn implicit. Giải thích stale là "DOM thay, reference cũ hết hạn" và nêu re-find/chờ ổn định. Đưa ví dụ stale trên bảng dữ liệu tự refresh.

> Senior tip: Chờ **điều kiện có ý nghĩa** (nút clickable, spinner biến mất, dữ liệu hiện) thay vì chờ "đủ lâu" – test vừa nhanh vừa ổn định.`,
  follow: ["Sự khác nhau giữa presenceOfElementLocated và visibilityOfElementLocated là gì?","Làm sao chờ một request mạng hoàn tất trong Selenium thuần, và khi nào cân nhắc Playwright?","Bạn chuẩn hoá wait trong framework để tránh mỗi người viết một kiểu thế nào?"],
  refs: [{"type":"doc","title":"Waiting Strategies (Selenium)","url":"https://www.selenium.dev/documentation/webdriver/waits/"},{"type":"doc","title":"Troubleshooting WebDriver errors (Selenium)","url":"https://www.selenium.dev/documentation/webdriver/troubleshooting/errors/"}]
},
{
  id: "autotest-006",
  topic: "autotest",
  level: "senior",
  q: "Page Object Model (POM) là gì và giải quyết vấn đề gì? Những lỗi thiết kế POM hay gặp (assert trong page, page khổng lồ) là gì? So sánh nhanh với Screenplay pattern.",
  a: `**Tóm tắt:** **Page Object Model (POM)** là mẫu thiết kế: mỗi trang/thành phần là một lớp chứa **locator** và **hành động** (login, submit), còn test gọi hành động và assert kết quả. POM giảm trùng lặp và cô lập thay đổi UI (đổi locator sửa một nơi). Lỗi hay gặp: nhét **assertion** vào page làm mờ trách nhiệm, tạo **God Page** khổng lồ, hoặc để test chạm trực tiếp locator. **Screenplay** (diễn viên–nhiệm vụ–tương tác, ví dụ Serenity) diễn đạt hành vi nghiệp vụ tốt hơn cho kịch bản phức tạp nhưng chi phí học/thiết lập cao hơn; đa số team Java dùng POM (+ component object) là đủ.

### Vấn đề POM giải quyết
Không có POM: mỗi test tự {{findElement(...)}}. UI đổi id nút → sửa hàng chục test. POM gom "biết trang thế nào" vào một nơi.

### POM cơ bản (Java + Selenium)
~~~java
import org.openqa.selenium.*;
import org.openqa.selenium.support.ui.*;
import java.time.Duration;

// Page Object: chỉ locator + hành động
public class LoginPage {
    private final WebDriver driver;
    private final WebDriverWait wait;
    private final By user = By.cssSelector("[data-testid='username']");
    private final By pass = By.cssSelector("[data-testid='password']");
    private final By submit = By.cssSelector("[data-testid='login-submit']");

    public LoginPage(WebDriver driver) {
        this.driver = driver;
        this.wait = new WebDriverWait(driver, Duration.ofSeconds(10));
    }

    // Hành động trả về trang tiếp theo (flow rõ ràng)
    public HomePage loginAs(String u, String p) {
        wait.until(ExpectedConditions.visibilityOfElementLocated(user)).sendKeys(u);
        driver.findElement(pass).sendKeys(p);
        driver.findElement(submit).click();
        return new HomePage(driver);
    }

    // Phơi bày dữ liệu để test assert (assert KHÔNG nằm trong page)
    public String errorMessage() {
        return wait.until(ExpectedConditions.visibilityOfElementLocated(
            By.cssSelector("[data-testid='login-error']"))).getText();
    }
}

// Test: đọc như kịch bản
// LoginPage login = new LoginPage(driver);
// login.loginAs("alice", "wrong");
// assertTrue(login.errorMessage().contains("Invalid"));
~~~

### Lỗi thiết kế hay gặp
| Lỗi | Biểu hiện | Hậu quả | Cách sửa |
|---|---|---|---|
| Assert trong Page | {{loginAs}} gọi {{assert}} | Page vừa điều hướng vừa kiểm tra, khó tái dùng (login để setup) | Page trả dữ liệu/trạng thái; assert ở test |
| God Page khổng lồ | Một class 2000 dòng cho cả app | Khó đọc, merge conflict | Tách trang/thành phần (Header, Modal, Table) |
| Lộ locator ra ngoài | Test gọi {{driver.findElement}} trực tiếp | Mất lợi ích POM | Chỉ phơi bày hành động/câu hỏi có ý nghĩa |
| Logic nghiệp vụ/DB trong Page | Tính toán, truy vấn DB | Trách nhiệm lẫn lộn | Page chỉ tương tác UI; phối hợp ở helper/service test |
| Wait lung tung/{{sleep}} | Chậm, flaky | Kém ổn định | Chuẩn hoá wait trong base/component |

### So sánh nhanh với Screenplay
- **POM:** "trang có hành động gì" – trực quan, dễ học. Đơn vị: Page/Component.
- **Screenplay:** "Actor thực hiện Task bằng Interaction và hỏi Question" (ví dụ {{Actor.attemptsTo(Login.with(...))}}; {{should(seeThat(...))}}). Kịch bản đọc như ngôn ngữ nghiệp vụ, tái dùng task tốt; nhưng boilerplate và cần kỷ luật. Gặp trong Serenity BDD.
- Lựa chọn: team nhỏ/vừa → POM + component. Kịch bản nghiệp vụ phức tạp, cần báo cáo "sống" → cân nhắc Screenplay.

### Trả lời phỏng vấn thế nào
Định nghĩa POM, lợi ích (giảm trùng lặp, cô lập thay đổi). Chủ động nêu 2 lỗi (assert trong page, God Page) và cách tránh. So sánh Screenplay ngắn gọn, kết theo quy mô team.

> Senior tip: POM không phải mục tiêu – **khả năng bảo trì** mới là mục tiêu. Nếu Page Object khó đọc hơn test thẳng, hãy đơn giản hoá: component nhỏ, hành động rõ, bỏ abstraction không tạo giá trị.`,
  follow: ["Bạn tổ chức BasePage/BaseTest (driver, wait, logging) thế nào mà không thành God class?","Page Factory ({{@FindBy}}) của Selenium còn nên dùng không, ưu/nhược điểm?","Với SPA có component tái dùng, bạn mô hình hoá theo \"Page\" hay \"Component\"?"],
  refs: [{"type":"doc","title":"Page object models (Selenium)","url":"https://www.selenium.dev/documentation/test_practices/encouraged/page_object_models/"},{"type":"article","title":"PageObject (Martin Fowler)","url":"https://martinfowler.com/bliki/PageObject.html"}]
},
{
  id: "autotest-007",
  topic: "autotest",
  level: "mid",
  q: "JUnit 5 và TestNG khác nhau thế nào trong bối cảnh automation test? Khi nào chọn cái nào? Nêu cách làm data-driven testing (chạy cùng test với nhiều bộ dữ liệu) với {{@ParameterizedTest}} hoặc {{@DataProvider}}.",
  a: `**Tóm tắt:** **JUnit 5** (Jupiter) là framework test chuẩn hiện đại cho Java (annotation {{@Test}}, lifecycle {{@BeforeEach}}, extension model linh hoạt) – thường là lựa chọn mặc định cho unit/integration và được nhiều thư viện hỗ trợ tốt. **TestNG** mạnh ở một số tính năng automation truyền thống: cấu hình suite XML, phụ thuộc giữa test ({{dependsOnMethods}} – thường không khuyến khích), parallel và **data-driven** qua {{@DataProvider}} rất linh hoạt. Data-driven (chạy cùng kịch bản với nhiều bộ dữ liệu) làm được ở cả hai: JUnit 5 dùng {{@ParameterizedTest}} + {{@MethodSource/@CsvSource}}. Với automation mới, JUnit 5 thường gọn và tích hợp Spring/CI tốt; TestNG vẫn hữu ích khi kế thừa suite lớn hoặc cần tính năng đặc thù.

### JUnit 5 vs TestNG: điểm chính
| Khía cạnh | JUnit 5 (Jupiter) | TestNG |
|---|---|---|
| Hệ sinh thái | Chuẩn de-facto, tích hợp Spring Boot, IDE/CI tốt | Phổ biến trong automation Selenium cũ, suite XML |
| Annotation cơ bản | {{@Test}}, {{@BeforeEach}}, {{@AfterEach}}, {{@Nested}} | {{@Test}}, {{@BeforeMethod}}, {{@AfterMethod}} |
| Mở rộng | {{@ExtendWith}} (extension model mạnh, composable) | Listener, annotation transformer |
| Data-driven | {{@ParameterizedTest}} + {{@ValueSource/@CsvSource/@MethodSource}} | {{@DataProvider}} (linh hoạt, trả mảng đối tượng) |
| Phụ thuộc test | Không khuyến khích (test nên độc lập) | {{dependsOnMethods/groups}} (dễ tạo chuỗi phụ thuộc giòn) |
| Parallel/suite | Hỗ trợ cấu hình; tuỳ runner | Cấu hình XML/suite mạnh, quen thuộc |
| Nhóm/tag | {{@Tag}} | {{groups}} |

### Data-driven là gì và ví dụ
Data-driven testing: cùng một logic kiểm thử chạy lặp với nhiều bộ dữ liệu (input/expected). Giúp phủ biên (boundary) mà không copy-paste test.

~~~java
// JUnit 5: ParameterizedTest
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import static org.junit.jupiter.api.Assertions.*;

class TaxTest {
    // Mỗi dòng CSV là một ca: income, expectedTax
    @ParameterizedTest
    @CsvSource({
        "1000, 0",
        "50000, 5000",
        "200000, 30000"
    })
    void calcTax_cases(long income, long expected) {
        assertEquals(expected, TaxCalculator.calc(income));
    }
}
~~~

~~~java
// TestNG: DataProvider (minh hoạ ý tưởng)
import org.testng.annotations.*;

public class TaxTestNG {
    @DataProvider(name = "cases")
    public Object[][] cases() {
        return new Object[][] { {1000L, 0L}, {50000L, 5000L} };
    }

    @Test(dataProvider = "cases")
    public void calcTax(long income, long expected) {
        // assert...
    }
}
~~~

### Chọn gì cho automation
- Dự án mới, Spring Boot, team quen JUnit: **JUnit 5** (đơn giản, extension tốt cho Selenium/REST Assured).
- Kế thừa bộ TestNG lớn, suite XML phức tạp, phụ thuộc hạ tầng sẵn có: có thể giữ **TestNG** nhưng tránh {{dependsOnMethods}} (làm test phụ thuộc nhau, khó chạy song song/debug).
- Dù dùng gì: test phải **độc lập**, dữ liệu tách biệt, có thể chạy song song.

### Lỗi hay gặp
- Dùng {{dependsOnMethods}} để "tiết kiệm setup" → một test fail kéo sập chuỗi, che nguyên nhân gốc.
- Data-driven nhưng dữ liệu chia sẻ/mutate chung → flaky khi parallel.
- Trộn phong cách JUnit 4/5/TestNG trong cùng module không cần thiết → cấu hình rối.

### Trả lời phỏng vấn thế nào
So sánh ngắn gọn (ecosystem, extension/DataProvider, phụ thuộc test). Nêu bạn ưu tiên JUnit 5 cho dự án mới và nguyên tắc: test độc lập, data-driven cho bộ ca lặp. Đưa ví dụ {{@ParameterizedTest}} hoặc {{@DataProvider}} bạn dùng.

> Senior tip: Đừng để framework quyết định chất lượng test. "Độc lập, lặp lại được, nhanh" quan trọng hơn chọn JUnit hay TestNG; data-driven là công cụ tốt nhưng dữ liệu test phải được quản lý như code (versioned, rõ nghĩa).`,
  follow: ["Tại sao {{dependsOnMethods}} trong TestNG thường bị coi là anti-pattern cho automation?","Làm sao chạy test song song an toàn khi mỗi ca dùng dữ liệu riêng?","JUnit 5 {{@Nested}} giúp tổ chức test UI/API như thế nào?"],
  refs: [{"type":"doc","title":"JUnit 5 User Guide","url":"https://junit.org/junit5/docs/current/user-guide/"},{"type":"doc","title":"TestNG Documentation","url":"https://testng.org/"}]
},
{
  id: "autotest-008",
  topic: "autotest",
  level: "senior",
  q: "Dùng REST Assured để test API end-to-end như thế nào (given/when/then, assert status/body/header)? Làm sao chain nhiều request (lấy token rồi gọi API tiếp) và kiểm tra JSON Schema?",
  a: `**Tóm tắt:** **REST Assured** là thư viện Java giúp viết test API theo phong cách **given/when/then** (chuẩn bị – thực hiện – kiểm tra): đặt header/body/auth, gửi HTTP, rồi assert status code, header, và nội dung JSON (dùng Hamcrest/JsonPath). Test API **end-to-end** ở mức HTTP nghĩa là gọi qua endpoint thật (hoặc môi trường tích hợp), kiểm tra hợp đồng phản hồi. Để **chain** request (ví dụ login lấy token → gọi API bảo vệ) bạn trích giá trị từ response ({{extract().path(...)}}) và truyền vào request sau. **JSON Schema validation** kiểm tra "hình dạng" dữ liệu (trường nào, kiểu gì, bắt buộc) giúp bắt breaking change cấu trúc.

### REST Assured là gì
REST Assured (thư viện Java) bọc việc gọi HTTP và assert, cho cú pháp đọc như mô tả hành vi. Nó phù hợp test tầng API (nhanh, ổn định hơn UI).

### Ví dụ given/when/then
~~~java
import static io.restassured.RestAssured.*;
import static org.hamcrest.Matchers.*;

class OrderApiTest {
    void getOrder_returns200() {
        given()
            .baseUri("https://api.example.test")
            .header("Accept", "application/json")
        .when()
            .get("/orders/123")           // HTTP GET
        .then()
            .statusCode(200)              // assert status
            .header("Content-Type", containsString("application/json"))
            .body("id", equalTo(123))     // JsonPath: field id = 123
            .body("items.size()", greaterThan(0));
    }
}
~~~
- {{body("items.size()", ...)}} dùng **JsonPath** (cú pháp trỏ vào JSON) để assert sâu trong cấu trúc.

### Chain request: login → dùng token
~~~java
// 1) Login lấy access token
String token =
    given()
        .contentType("application/json")
        .body("{"user":"alice","pass":"secret"}")
    .when()
        .post("/auth/login")
    .then()
        .statusCode(200)
        .extract().path("accessToken"); // trích trường từ JSON

// 2) Gọi API bảo vệ với Bearer token
given()
    .header("Authorization", "Bearer " + token)
.when()
    .get("/profile")
.then()
    .statusCode(200)
    .body("username", equalTo("alice"));
~~~
Lưu ý: không hardcode secret thật trong code repo; dùng biến môi trường/secret store trong CI.

### JSON Schema validation
Schema (lược đồ JSON) mô tả cấu trúc: kiểu, trường bắt buộc, enum. Kiểm tra schema giúp phát hiện response thêm/bớt/đổi kiểu ngoài ý muốn.

~~~java
import static io.restassured.module.jsv.JsonSchemaValidator.matchesJsonSchemaInClasspath;

given()
.when().get("/orders/123")
.then().statusCode(200)
      .body(matchesJsonSchemaInClasspath("schemas/order-schema.json"));
~~~
- Bạn cần thêm module {{json-schema-validator}} của REST Assured.
- Schema nên đặt trong {{src/test/resources}}.

### Lỗi hay gặp
- Assert chỉ status 200 mà không kiểm tra body → API trả sai dữ liệu vẫn pass.
- Chain phụ thuộc dữ liệu chung/môi trường bẩn → flaky. Tốt hơn: tự tạo dữ liệu qua API setup, dọn sau test.
- Gắn test vào môi trường chia sẻ không ổn định; hoặc quên timeout → test treo CI.
- Log token/PII (dữ liệu cá nhân) vào report.

### Trả lời phỏng vấn thế nào
Trình bày given/when/then, ví dụ assert body/header. Nêu chain token bằng {{extract()}} và schema validation cho hợp đồng. Nhấn mạnh quản lý dữ liệu test và bảo mật secret.

> Senior tip: Với API quan trọng, kết hợp **contract-style checks** (schema/field bắt buộc) và một vài assert nghiệp vụ có ý nghĩa. Đừng viết hàng trăm assert li ti vào field dễ đổi – test sẽ giòn và tốn bảo trì.`,
  follow: ["Khi nào dùng JSON Schema validation, khi nào dùng assert từng field bằng JsonPath?","Làm sao test API có upload file hoặc pagination bằng REST Assured?","Bạn tổ chức base URI, auth, logging chung cho suite REST Assured thế nào?"],
  refs: [{"type":"doc","title":"REST Assured Usage","url":"https://rest-assured.io/"},{"type":"doc","title":"REST Assured Getting Started (GitHub wiki)","url":"https://github.com/rest-assured/rest-assured/wiki/Usage"}]
},
{
  id: "autotest-009",
  topic: "autotest",
  level: "senior",
  q: "Làm sao quản lý test data cho automation: tạo dữ liệu qua API thay vì qua UI, dọn dẹp sau test, và đảm bảo các test chạy song song không đụng chạm dữ liệu của nhau?",
  a: `**Tóm tắt:** Test data (dữ liệu kiểm thử) phải **độc lập, lặp lại được, dễ dọn**. Ưu tiên **tạo dữ liệu qua API** (hoặc seed có kiểm soát) thay vì qua UI vì nhanh, ổn định, ít phụ thuộc giao diện. Mỗi test nên **sở hữu dữ liệu riêng** (tên/id duy nhất, namespace theo run) và **dọn dẹp** (teardown) hoặc cô lập (transaction rollback ở tầng integration). Khi chạy song song (parallel), tránh dùng chung bản ghi cố định (user "test1") – nếu không sẽ race condition (tranh chấp) và flaky.

### Tại sao không tạo data qua UI
- UI chậm (nhiều bước click, chờ trang) → suite phình.
- UI đổi làm hỏng bước setup dù bạn đang test tính năng khác.
- Khó đảm bảo trạng thái sạch. Ví dụ: để test "huỷ đơn" mà phải click 10 bước tạo đơn trước.

### Tạo dữ liệu qua API (khuyến nghị)
~~~java
// Setup nhanh qua REST Assured (pseudocode)
String suffix = java.util.UUID.randomUUID().toString().substring(0,8);
String email = "qa+" + suffix + "@example.test"; // duy nhất mỗi lần chạy

long orderId = given().header("Authorization","Bearer " + token)
    .contentType("application/json")
    .body("{\"customer\":\""+email+"\",\"items\":[{\"sku\":\"A1\",\"qty\":1}]}")
  .when().post("/orders")
  .then().statusCode(201).extract().path("id");

// ... chạy test với orderId ...
// Teardown (nếu hệ thống cho phép)
given().header("Authorization","Bearer " + adminToken)
  .when().delete("/orders/" + orderId).then().statusCode(204);
~~~

### Chiến lược cô lập khi parallel
| Chiến lược | Cách làm | Phù hợp | Lưu ý |
|---|---|---|---|
| Dữ liệu duy nhất | UUID/timestamp trong tên/email | Hầu hết API/UI e2e | DB phình nếu không dọn |
| Namespace theo worker | Mỗi thread/worker có prefix | Parallel cùng môi trường | Cần quy ước rõ |
| Tạo & xoá trong test | Setup + teardown mỗi ca | API test | Teardown có thể fail → cần cleanup job |
| Transaction rollback | {{@Transactional}} test, rollback sau | Integration cùng process (Spring) | Không áp dụng cho UI e2e qua HTTP app riêng |
| Môi trường cô lập | Mỗi run một DB/schema/container | Integration mạnh | Nặng hơn, thường backend |

### Dọn dẹp (teardown)
- Dọn trong {{@AfterEach}}/hook; chấp nhận teardown có thể không chạy nếu test crash.
- Bổ sung job dọn dữ liệu cũ theo pattern ({{qa+*@example.test}} > 24h) hoặc reset staging theo lịch. **Chỉ trên môi trường test.**
- Thiết kế idempotent (gọi lại an toàn).

### Lỗi hay gặp
- Dùng chung tài khoản {{admin}} cho mọi test parallel → session/đơn hàng lẫn.
- Teardown chỉ chạy khi test pass → rác còn lại làm fail ca sau.
- Hardcode id ({{orderId=123}}) chỉ tồn tại ở một môi trường.
- Tạo nhiều data không dọn → staging đầy, test chậm.

### Trả lời phỏng vấn thế nào
Nêu nguyên tắc: tạo qua API, unique per test, dọn/cô lập. Ví dụ UUID suffix + chain setup. Nói rõ xử lý parallel (worker prefix) và cleanup khi teardown fail.

> Senior tip: Coi test data là một phần kiến trúc test. Một "data factory" (hàm tạo user/order chuẩn) tiết kiệm nhiều giờ sửa flaky do va chạm dữ liệu – và giúp onboard nhanh hơn.`,
  follow: ["Khi hệ thống không có API tạo dữ liệu, bạn đàm phán với dev/architect thế nào?","Làm sao xử lý dữ liệu nhạy cảm (PII) trong môi trường test?","Song song ở mức class hay method ảnh hưởng gì tới chiến lược data?"],
  refs: [{"type":"article","title":"The Practical Test Pyramid (Ham Vocke)","url":"https://martinfowler.com/articles/practical-test-pyramid.html"},{"type":"doc","title":"REST Assured","url":"https://rest-assured.io/"}]
},
{
  id: "autotest-010",
  topic: "autotest",
  level: "mid",
  q: "Trong UI automation, bạn xử lý iframe, nhiều tab/cửa sổ, upload/download file, và alert/popup trình duyệt như thế nào (Selenium)? Nêu lưu ý quan trọng cho từng trường hợp.",
  a: `**Tóm tắt:** Các tình huống này là "bẫy" kinh điển vì phần tử nằm **ngoài ngữ cảnh** hiện tại của WebDriver. **iframe** (trang HTML lồng trong trang): phải {{switchTo().frame(...)}} trước khi tìm phần tử bên trong, rồi {{switchTo().defaultContent()}} để thoát. **Nhiều tab/cửa sổ**: quản lý **window handles** (định danh cửa sổ) và {{switchTo().window(handle)}}. **Upload file**: thường {{sendKeys(đường_dẫn_tuyệt_đối)}} vào {{input type="file"}} (không click hộp thoại OS). **Download**: cấu hình thư mục tải của browser profile và kiểm tra file xuất hiện (chờ với timeout). **Alert JS**: {{switchTo().alert()}} rồi {{accept()/dismiss()}}.

### iframe
- iframe (inline frame) có DOM riêng. {{findElement}} ở trang chính **không thấy** phần tử trong iframe.
~~~java
driver.switchTo().frame("payment-iframe"); // theo id/name, index, hoặc WebElement
driver.findElement(By.id("card-number")).sendKeys("4111111111111111");
driver.switchTo().defaultContent(); // quay lại trang chính
~~~
- Pitfall: iframe lồng nhau → switch tuần tự; quên {{defaultContent()}} làm bước sau fail.

### Nhiều tab/cửa sổ
~~~java
String main = driver.getWindowHandle();
driver.findElement(By.id("open-report")).click(); // mở tab mới
var wait = new org.openqa.selenium.support.ui.WebDriverWait(driver, java.time.Duration.ofSeconds(10));
wait.until(d -> d.getWindowHandles().size() > 1);
for (String h : driver.getWindowHandles()) {
    if (!h.equals(main)) { driver.switchTo().window(h); break; }
}
// ... thao tác tab mới ...
driver.close();
driver.switchTo().window(main); // quay lại tab chính (rất quan trọng)
~~~
- Pitfall: quên switch về main; popup bị chặn làm số handle không tăng.

### Upload file
- Ổn định nhất: gửi đường dẫn file tới {{input type="file"}} (kể cả ẩn, tuỳ app – cẩn thận).
~~~java
import java.nio.file.Path;
Path file = Path.of("src/test/resources/fixtures/invoice.pdf").toAbsolutePath();
driver.findElement(By.cssSelector("input[type='file']")).sendKeys(file.toString());
~~~
- Tránh click hộp thoại hệ điều hành (không ổn định, phụ thuộc OS/headless). Trên Grid/remote cần {{LocalFileDetector}}.

### Download file
- Selenium thuần không có API đọc file đã tải trực tiếp. Cách thường dùng: cấu hình Chrome prefs để tải vào thư mục cố định, tắt "Save as", rồi kiểm tra {{Files.exists()}} với timeout chờ.
- Headless/CI: thư mục có quyền ghi; xoá file cũ trước test để tránh nhầm. Playwright có API download tích hợp tiện hơn.

### Alert / confirm / prompt (JS native)
~~~java
var alert = wait.until(org.openqa.selenium.support.ui.ExpectedConditions.alertIsPresent());
alert.accept();   // OK (dismiss() cho Cancel, sendKeys() cho prompt)
~~~
- Phân biệt alert JS (native) với modal HTML (thẻ {{div}}) – modal HTML thì tìm element bình thường, không dùng {{switchTo().alert()}}.

### Lỗi hay gặp
- Tìm element trong iframe mà không switch → {{NoSuchElementException}}.
- Upload bằng click dialog OS trên CI headless → treo/fail.
- Assert download ngay lập tức → file chưa ghi xong; cần chờ timeout.

### Trả lời phỏng vấn thế nào
Nêu từng case với lệnh cốt lõi (switch frame/window, sendKeys path, alert accept) và 1 pitfall/case. Nhấn mạnh headless/CI (đường dẫn, thư mục download).

> Senior tip: Các ca "ngoài DOM thường" (iframe, upload, download) hay flaky. Cô lập vào helper có retry/timeout rõ và log chi tiết (handle count, frame name) để debug nhanh trên CI.`,
  follow: ["Upload file trên Selenium Grid (remote node) khác local thế nào?","Làm sao verify nội dung file PDF/Excel vừa download trong test?","Modal HTML giả lập alert khác alert JS ở điểm nào khi automation?"],
  refs: [{"type":"doc","title":"Working with windows and tabs (Selenium)","url":"https://www.selenium.dev/documentation/webdriver/interactions/windows/"},{"type":"doc","title":"Alerts (Selenium)","url":"https://www.selenium.dev/documentation/webdriver/interactions/alerts/"},{"type":"doc","title":"Remote WebDriver (file upload, Selenium)","url":"https://www.selenium.dev/documentation/webdriver/drivers/remote_webdriver/"}]
},
{
  id: "autotest-011",
  topic: "autotest",
  level: "senior",
  q: "Vì sao login qua UI cho mỗi test case lại chậm và dễ flaky? Bạn tăng tốc bằng cách tái dùng session/cookie hoặc storage state như thế nào (Selenium/Playwright)? Có những rủi ro bảo mật gì cần lưu ý?",
  a: `**Tóm tắt:** Login qua UI lặp lại cho từng test tốn thời gian (mở trang, nhập form, chờ redirect, đôi khi SSO/MFA) và thêm điểm gãy (flaky) không liên quan tính năng đang test. Tăng tốc bằng cách **đăng nhập một lần** rồi tái dùng trạng thái xác thực: **cookie/session** (Selenium: {{driver.manage().getCookies()/addCookie()}} sau khi đã mở đúng domain) hoặc **storage state** (Playwright: lưu cookies + localStorage vào file/context). Rủi ro: lộ credential/token trong artefact, dùng chung phiên gây phụ thuộc giữa test, và bỏ sót kiểm tra luồng login nếu không giữ smoke test riêng.

### Vấn đề của login UI mỗi test
- 50 test × 5 giây login = >4 phút chỉ cho setup.
- Login phụ thuộc mạng, SSO, CAPTCHA, rate limit → flaky.
- Test nên tập trung vào hành vi cần kiểm chứng.

### Cách 1: Tái dùng cookie/session (Selenium)
Login một lần (UI hoặc API), lưu cookie, inject vào browser mới trước khi vào trang bảo vệ.
~~~java
// 1) Login một lần (UI hoặc API) để có cookie hợp lệ
loginViaApi();
java.util.Set<org.openqa.selenium.Cookie> saved = driver.manage().getCookies();

// 2) Test khác: mở đúng domain trước (cookie gắn với domain)
 driver.get("https://app.example.test/404");
driver.manage().deleteAllCookies();
for (var c : saved) driver.manage().addCookie(c); // chèn cookie phiên
 driver.get("https://app.example.test/dashboard"); // vào thẳng trang cần test
~~~
- Phải {{get()}} tới domain trước khi {{addCookie()}}. Cookie {{HttpOnly/Secure/SameSite}} có thể ảnh hưởng hành vi.

### Cách 2: Storage state (Playwright – khái niệm)
Lưu trạng thái (cookies + localStorage) của {{BrowserContext}} và nạp cho context mới.
~~~java
// Playwright Java (ý tưởng)
BrowserContext ctx = browser.newContext();
Page page = ctx.newPage();
// ... login một lần ...
ctx.storageState(new BrowserContext.StorageStateOptions()
    .setPath(java.nio.file.Paths.get(auth.json)));
// Test khác
BrowserContext authed = browser.newContext(
    new Browser.NewContextOptions()
        .setStorageStatePath(java.nio.file.Paths.get(auth.json)));
~~~

### Cách 3: Login qua API lấy token
Nếu app dùng Bearer token: gọi {{/auth/login}} lấy token, set header cho request test. Nhanh, ổn định hơn UI; cần hiểu cơ chế auth app.

### Rủi ro & giảm thiểu
| Rủi ro | Mô tả | Giảm thiểu |
|---|---|---|
| Lộ credential/token | {{auth.json}}/cookie commit hoặc lộ artefact | Lưu thư mục tạm CI, {{.gitignore}}, dùng secret; hạn TTL |
| Phiên hết hạn | Token expire giữa run | Làm mới state; TTL phù hợp thời lượng suite |
| Phụ thuộc giữa test | Test A đổi trạng thái user làm B sai | Mỗi worker dùng user riêng; không chia sẻ tài khoản mutable |
| Bỏ sót kiểm tra login | Không ai test màn login | Giữ 1-2 smoke test login UI riêng |

### Trả lời phỏng vấn thế nào
Giải thích chi phí/flaky của login UI lặp. Nêu cookie injection (Selenium), storage state (Playwright) hoặc API token. Chủ động nêu rủi ro bảo mật và giữ smoke test cho luồng login.

> Senior tip: Tách rõ: smoke test xác minh **luồng đăng nhập** còn hoạt động; các test nghiệp vụ khác dùng **trạng thái đăng nhập đã chuẩn bị** – nhanh, cô lập, vẫn có lớp bảo vệ.`,
  follow: ["Làm sao xử lý khi ứng dụng dùng MFA (xác thực đa yếu tố) – có tự động hoá MFA không?","Storage state chia sẻ giữa test parallel có an toàn không nếu test thay đổi profile user?","Bạn lưu và làm mới auth state trong CI như thế nào để không lộ secret?"],
  refs: [{"type":"doc","title":"Authentication (Playwright Java)","url":"https://playwright.dev/java/docs/auth"},{"type":"doc","title":"Cookies (Selenium WebDriver)","url":"https://www.selenium.dev/documentation/webdriver/interactions/cookies/"}]
},
{
  id: "autotest-012",
  topic: "autotest",
  level: "senior",
  q: "BDD với Cucumber (Gherkin) mang lại giá trị gì và khi nào nó trở thành gánh nặng? Viết ví dụ kịch bản Gherkin tốt (ngắn, theo hành vi) và chỉ ra anti-pattern thường gặp.",
  a: `**Tóm tắt:** **BDD** (Behavior-Driven Development – phát triển hướng hành vi) dùng ngôn ngữ gần tự nhiên để mô tả hành vi, giúp dev/QA/BA có **hiểu biết chung**. **Cucumber** chạy kịch bản **Gherkin** (Given/When/Then) ánh xạ tới step definitions (code Java). Giá trị: tài liệu sống cho hành vi nghiệp vụ quan trọng, đồng thuận tiêu chí chấp nhận. Trở thành gánh nặng khi viết Gherkin như kịch bản click UI chi tiết, team không cùng duy trì, hoặc dùng BDD cho mọi ca kể cả kỹ thuật – tạo lớp "dịch" thừa và bảo trì nặng.

### Gherkin cơ bản
{{Feature}} nhóm tính năng. {{Scenario}} là một ca. {{Given}} (tiền điều kiện), {{When}} (hành động), {{Then}} (kết quả). Step definition (Java) thực thi từng bước.

### Kịch bản tốt (theo hành vi, không dính UI)
~~~gherkin
Feature: Áp dụng mã giảm giá
  Scenario: Mã hợp lệ giảm 10% cho đơn đủ điều kiện
    Given khách hàng có giỏ hàng trị giá 1,000,000 VND
    And mã giảm giá "SAVE10" còn hiệu lực cho đơn từ 500,000 VND
    When khách hàng áp dụng mã "SAVE10"
    Then tổng tiền sau giảm là 900,000 VND
    And mã "SAVE10" được ghi nhận đã sử dụng
~~~
Đọc được bởi BA/QA/dev; không mô tả "click nút id=btn-23".

### Anti-pattern (gánh nặng)
| Anti-pattern | Ví dụ | Vì sao xấu |
|---|---|---|
| Dính UI/implementation | "When click id=btn-23..." | Vỡ khi UI đổi; mất tính nghiệp vụ |
| Quá nhiều bước chi tiết | 20 bước/ca | Khó đọc, che ý định |
| Dùng cho mọi test | Unit/API kỹ thuật cũng Gherkin | Lớp dịch thừa; JUnit/REST Assured đủ rõ |
| Không ai đọc/duy trì | Viết xong "cho có BDD" | Không tạo shared understanding, chỉ thêm nợ |
| Step def mập/trùng | Logic phức tạp trong step | Nên gọi service/API/page helper |

### Khi nào có lợi / tránh
- **Có lợi:** quy tắc nghiệp vụ cần BA/PO đồng thuận; acceptance criteria quan trọng; domain phức tạp (tài chính).
- **Tránh:** team nhỏ toàn dev không có BA; ca kỹ thuật (contract, performance); UI đổi liên tục không kỷ luật tách lớp.

### Thực tế Java
Cucumber-JVM + JUnit Platform. Step def gọi **service/API layer** hoặc page object mỏng – giữ Gherkin ở mức hành vi.
~~~java
@When("khách hàng áp dụng mã {string}")
public void apDungMa(String code) {
    response = cartApi.applyVoucher(cartId, code); // gọi API, không click UI
}
~~~

### Trả lời phỏng vấn thế nào
Nêu giá trị (shared understanding, acceptance criteria sống) và điều kiện thành công. Chỉ ra anti-pattern (UI chi tiết, lạm dụng). Kết: dùng BDD **chọn lọc** cho ca nghiệp vụ giá trị cao; test kỹ thuật dùng JUnit/REST Assured trực tiếp.

> Senior tip: Gherkin tốt trả lời "hệ thống phải làm gì", không phải "test click ở đâu". Nếu feature file đọc như hướng dẫn bấm chuột, bạn đang viết script automation đội lốt BDD – kéo ngôn ngữ lên mức nghiệp vụ.`,
  follow: ["Làm sao tổ chức step definitions để tái dùng mà không tạo \"God steps\"?","Scenario Outline khác Scenario thế nào, dùng khi nào?","Bạn thuyết phục team bỏ Gherkin cho nhóm test không phù hợp ra sao?"],
  refs: [{"type":"doc","title":"Cucumber Documentation","url":"https://cucumber.io/docs/cucumber/"},{"type":"doc","title":"Gherkin Reference","url":"https://cucumber.io/docs/gherkin/reference/"},{"type":"article","title":"Given When Then (Martin Fowler)","url":"https://martinfowler.com/bliki/GivenWhenThen.html"}]
},
{
  id: "autotest-013",
  topic: "autotest",
  level: "mid",
  q: "Làm sao thiết kế báo cáo test tự động (ví dụ Allure) để khi fail có đủ thông tin debug? Bạn đính kèm screenshot, video/trace, log request-response như thế nào?",
  a: `**Tóm tắt:** Báo cáo test (test report) giúp team biết **đã chạy gì, pass/fail ở đâu, và vì sao fail**. **Allure** là framework báo cáo phổ biến: gắn {{@Step}}, {{@Description}}, {{@Attachment}} (screenshot, log, video, trace) vào test để khi fail có bằng chứng debug nhanh. Best practice: **đính kèm artefact tự động khi fail** (screenshot UI, page source, log request/response API, Playwright trace), lưu ở nơi CI thu thập được, và giữ báo cáo gọn (không log dữ liệu nhạy cảm). Báo cáo tốt rút ngắn thời gian phân tích flaky vs bug thật.

### Vì sao cần artefact khi fail
Test fail trên CI (môi trường headless, chạy song song) rất khó tái hiện nếu chỉ có stack trace. Screenshot cho thấy UI đang ở trạng thái nào; video/trace cho thấy chuỗi hành động; log API cho thấy request/response thực tế.

### Allure: khái niệm chính
- **Cài adapter** tương ứng runner (JUnit 5/TestNG). Cấu hình output {{allure-results}}.
- Annotation: {{@Epic/@Feature/@Story}} (phân loại), {{@Step}} (chia bước trong report), {{@Description}}, {{@Severity}}.
- Attachment: đính kèm bytes/String/file (ảnh PNG, text, JSON).

~~~java
import io.qameta.allure.*;

@Feature("Thanh toán")
class PaymentTest {

    @Test
    @Story("Thanh toán thẻ thất bại")
    @Description("Hiển thị lỗi khi thẻ bị từ chối")
    void cardDeclined_showsError() {
        openCheckout();
        payWithCard("4111-DECLINED");
        assertErrorVisible(); // nếu fail, hook sẽ chụp screenshot
    }

    @Step("Mở trang checkout")
    void openCheckout() { /* ... */ }

    @Attachment(value = "Screenshot", type = "image/png")
    public byte[] saveScreenshot(byte[] png) { return png; }
}
~~~

### Đính kèm tự động khi fail (JUnit 5 + Selenium, ý tưởng)
~~~java
import org.junit.jupiter.api.extension.*;
import org.openqa.selenium.*;

public class ScreenshotOnFailure implements TestWatcher {
    @Override
    public void testFailed(ExtensionContext ctx, Throwable cause) {
        WebDriver driver = /* lấy driver từ context/test instance */;
        if (driver instanceof TakesScreenshot ts) {
            byte[] png = ts.getScreenshotAs(OutputType.BYTES);
            // gọi method @Attachment hoặc Allure.addAttachment
            io.qameta.allure.Allure.addAttachment("Failure screenshot", "image/png",
                new java.io.ByteArrayInputStream(png), "png");
        }
    }
}
// Đăng ký: @ExtendWith(ScreenshotOnFailure.class)
~~~
- Với Playwright: có screenshot/video/trace tích hợp; attach file trace ({{.zip}}) vào report CI.

### Những gì nên đính kèm (chọn lọc)
| Artefact | Khi nào | Lưu ý |
|---|---|---|
| Screenshot | UI fail | Chụp ngay lúc fail; che/bỏ PII nếu có |
| Page source/DOM | UI khó chẩn đoán | Có thể lớn; chỉ khi cần |
| Request/response API | REST test fail | **Mask** token, mật khẩu, PII |
| Browser console/network log | Lỗi frontend | Tuỳ công cụ (CDP/Playwright trace) |
| Video/trace | Ca quan trọng/flaky | Tốn dung lượng; có thể chỉ bật khi retry/fail |

### Lỗi hay gặp
- Chỉ có stack trace, không screenshot/log → mất thời gian hỏi "CI thấy màn hình gì?".
- Đính kèm mọi thứ cho mọi test pass → báo cáo nặng, CI đầy ổ.
- Log secret/token/PII vào Allure → rủi ro bảo mật.

### Trả lời phỏng vấn thế nào
Nêu Allure giúp cấu trúc báo cáo + attachment. Nhấn mạnh "tự động attach khi fail" (screenshot, request/response có mask). Đưa ví dụ hook/listener bạn dùng và cách CI publish report.

> Senior tip: Báo cáo là **công cụ gỡ lỗi**, không phải hình thức. Một screenshot đúng thời điểm fail + request/response được mask thường giá trị hơn hàng trăm dòng log – tối ưu cho thời gian chẩn đoán.`,
  follow: ["Làm sao mask (che) dữ liệu nhạy cảm trong attachment/log mà vẫn đủ thông tin debug?","Khi nào nên bật video/trace cho mọi test, khi nào chỉ bật khi fail hoặc retry?","Bạn publish Allure report trong CI (GitHub Actions/Jenkins) thế nào để team xem dễ?"],
  refs: [{"type":"doc","title":"Allure Framework","url":"https://allurereport.org/docs/"},{"type":"doc","title":"Playwright Trace Viewer (tham khảo artefact trace)","url":"https://playwright.dev/java/docs/trace-viewer-intro"}]
},
{
  id: "autotest-014",
  topic: "autotest",
  level: "senior",
  q: "Làm thế nào để chạy automation test trong CI (GitHub Actions hoặc Jenkins)? Nêu các vấn đề: headless, cài browser/driver, lưu artifact (report/screenshot/log), tách smoke vs regression, và gate merge.",
  a: `**Tóm tắt:** Chạy automation trong CI (Continuous Integration – tự build/test khi đẩy code) cần môi trường **headless** (trình duyệt không mở cửa sổ đồ hoạ), cài đúng browser/driver, quản lý secret, và cấu hình **artifact** (lưu file kết quả: report, screenshot, log) để debug khi fail. CI thường dùng GitHub Actions hoặc Jenkins: checkout code → setup JDK → cài browser deps → chạy test (Maven/Gradle) → upload artefact → (tuỳ) gate merge/PR nếu test bắt buộc fail. Cần kiểm soát thời gian, độ ổn định (flaky), và tách suite (smoke vs regression).

### Headless và môi trường CI
- **Headless**: chạy browser không giao diện, phù hợp máy chủ CI (không có màn hình). Chrome/Firefox hỗ trợ headless; Selenium/Playwright có cấu hình tương ứng.
- Cài dependencies hệ thống (thư viện Linux cho Chrome) hoặc dùng container image có sẵn browser (Playwright image, Selenium image).
~~~yaml
# GitHub Actions (minh hoạ ý tưởng, rút gọn)
name: UI Tests
on: [pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
        with: { distribution: 'temurin', java-version: '17' }
      - name: Run tests
        run: mvn -B test -Dheadless=true
      - name: Upload Allure results
        if: always()              # vẫn upload kể cả fail để debug
        uses: actions/upload-artifact@v4
        with:
          name: allure-results
          path: target/allure-results
~~~
(Lưu ý: YAML thực tế cần canh lề chính xác; ví dụ chỉ minh hoạ cấu trúc.)

### Artifact và log
- **Artifact**: file giữ lại sau job (report, screenshot, surefire XML). Dùng {{if: always()}} để upload khi fail.
- Tránh upload secret; mask log.

### Gate merge
- Đặt job test là **required status check** trên PR → không merge nếu fail.
- Phân tầng: PR chạy smoke/API nhanh; nightly chạy regression UI đầy đủ. Tránh bắt PR chờ 60 phút UI dễ flaky.

### Jenkins (tương đương khái niệm)
- Pipeline (Jenkinsfile) các stage: Checkout, Build, Test, Archive artifacts ({{junit}}, {{allure}}). Chạy trên agent có browser/container.

### Ổn định trên CI
- Chờ có điều kiện, data cô lập, không phụ thuộc thứ tự.
- Retry có kiểm soát (rerun failed) chỉ để giảm nhiễu hạ tầng, nhưng phải theo dõi test hay flaky để sửa gốc.
- Giới hạn parallel phù hợp tài nguyên agent.

### Lỗi hay gặp
- Chạy headed (có GUI) trên agent không có display → fail khởi động browser (cần headless hoặc Xvfb).
- Thiếu {{if: always()}} khi upload artefact → fail xong không có screenshot để xem.
- Dùng chung một môi trường staging cho mọi PR parallel → data va chạm.
- Hardcode URL/credential trong repo.

### Trả lời phỏng vấn thế nào
Mô tả pipeline: trigger → setup → run headless → upload artefact → gate merge. Nêu khác biệt smoke (PR) vs regression (nightly). Đưa ví dụ bạn xử lý flaky trên CI (stabilize wait/data, không chỉ bật retry).

> Senior tip: CI chỉ có giá trị khi tín hiệu đáng tin. Một suite UI "đỏ ngẫu nhiên" bị team bỏ qua còn tệ hơn không có test – hãy đầu tư độ ổn định và phân tầng trước khi mở rộng số lượng ca.`,
  follow: ["Làm sao xử lý secret (mật khẩu, token) an toàn trong pipeline CI?","Khi test UI quá chậm cho PR, bạn thiết kế chiến lược chạy phân tầng thế nào?","Bạn dùng retry trong CI ra sao mà không che giấu test flaky thật?"],
  refs: [{"type":"doc","title":"GitHub Actions Documentation","url":"https://docs.github.com/en/actions"},{"type":"doc","title":"Jenkins Pipeline","url":"https://www.jenkins.io/doc/book/pipeline/"},{"type":"doc","title":"Selenium in CI (Selenium documentation)","url":"https://www.selenium.dev/documentation/grid/"}]
},
{
  id: "autotest-015",
  topic: "autotest",
  level: "lead",
  q: "Bạn là dev Java 4 năm muốn chuyển sang vai trò SDET/automation: cần bù kỹ năng gì, lộ trình 3–6 tháng ra sao, lợi ích và rủi ro nghề nghiệp? Nêu góc nhìn cân bằng về thị trường Việt Nam (không bịa số liệu lương cụ thể).",
  a: `**Tóm tắt:** Một dev Java ~4 năm chuyển sang **SDET/automation** (Software Development Engineer in Test – kỹ sư phát triển kiểm thử, viết code để kiểm thử tự động và xây công cụ chất lượng) có lợi thế nền tảng lập trình, OOP, Git, CI; cần bù: tư duy kiểm thử (risk-based, test design), công cụ UI/API automation (Selenium/Playwright, REST Assured), xử lý flaky, và kỹ năng giao tiếp chất lượng với team. Lộ trình 3–6 tháng nên đi theo dự án thật: API test → UI có POM/wait tốt → CI/report → hiểu pipeline chất lượng. Nghề nghiệp: gần kỹ thuật, ảnh hưởng chất lượng sản phẩm, nhưng cần chủ động tránh bị xem là "chỉ viết script" bằng cách đóng góp framework, chiến lược test, và mentoring. Thị trường Việt Nam có nhu cầu QA automation/SDET ở sản phẩm và outsourcing; mức độ/cơ hội khác nhau theo công ty, domain, tiếng Anh – **tránh bịa số liệu lương cụ thể**, nên tự khảo sát theo thời điểm.

### SDET khác gì dev và QA manual?
- **QA manual**: kiểm thử thủ công, khám phá, thiết kế ca. Có thể không viết code.
- **Dev**: xây tính năng sản phẩm.
- **SDET**: dùng kỹ năng dev để xây automation, framework, công cụ test, tích hợp CI, đôi khi tham gia thiết kế testability (khả năng kiểm thử) của hệ thống. Ranh giới tuỳ công ty.

### Kỹ năng cần bù (từ dev Java 4 năm)
| Nhóm | Bạn đã có thể có | Cần bù/thực hành |
|---|---|---|
| Lập trình | Java core, OOP, collections | Viết test sạch, abstraction cho framework, debug async/timing |
| Kiểm thử | Biết unit test cơ bản | Test design (equivalence, boundary), risk-based, exploratory mindset |
| UI automation | Ít hoặc chưa | Selenium 4/Playwright, locator bền, wait, POM, xử lý flaky |
| API automation | Biết REST | REST Assured, auth, schema, data setup |
| CI/CD | Biết Git | Pipeline test, headless, artefact, gate merge, Allure |
| Chất lượng & giao tiếp | Tuỳ | Nói chuyện với dev/PO về rủi ro, ưu tiên ROI automation |

### Lộ trình 3–6 tháng (thực dụng)
1. **Tháng 1:** Củng cố test design + JUnit 5; viết REST Assured cho API thật/mô phỏng (CRUD, auth, assert schema). Mục tiêu: suite API chạy trong CI.
2. **Tháng 2:** UI automation cơ bản (chọn Playwright hoặc Selenium) cho 3-5 luồng critical; học locator, wait, POM, xử lý upload/iframe cơ bản. Mục tiêu: test ổn định, ít flaky.
3. **Tháng 3:** Nâng chất lượng: data qua API, login state reuse, Allure + screenshot on fail, chạy headless trên GitHub Actions/Jenkins. Mục tiêu: report debug được.
4. **Tháng 4-6:** Mở rộng có chọn lọc (song song, Grid/parallel, contract/mock như WireMock nếu phù hợp), tham gia review testability, đóng góp framework/team guideline. Mục tiêu: tạo giá trị ngoài "viết thêm script".

~~~text
Dev Java (4y) --bo sung mindset test--> API automation --> UI + POM/wait
      --> CI/report/stability --> SDET đóng góp framework & chiến lược
~~~

### Lợi ích / rủi ro nghề nghiệp (cân bằng)
- **Lợi ích:** tận dụng nền code; vị trí kết nối dev–chất lượng; cơ hội học kiến trúc hệ thống qua góc kiểm thử; có thể phát triển sang SDET lead, quality platform, hoặc quay lại dev với tư duy quality tốt.
- **Rủi ro:** bị giao chỉ bảo trì script flaky; công ty đánh giá thấp nếu chỉ đo "số test case"; công nghệ UI đổi nhanh cần học liên tục. Giảm rủi ro bằng cách gắn automation với **giá trị** (giảm regression, rút ngắn feedback) và xây năng lực framework.

### Thị trường Việt Nam (cân bằng, không bịa số)
- Nhu cầu automation/SDET xuất hiện ở công ty sản phẩm, fintech, e-commerce, và outsourcing cho khách hàng quốc tế; yêu cầu thường gồm Java hoặc ngôn ngữ khác, Selenium/Playwright, API, CI, và đôi khi tiếng Anh giao tiếp.
- Mức đãi ngộ, seniority và cơ hội **khác nhau mạnh** theo công ty, domain, địa điểm, và thời điểm. Nên tự khảo sát qua mô tả công việc (JD), phỏng vấn thực tế, và nguồn thị trường cập nhật – **không dựa vào con số lương nghe truyền miệng trong câu trả lời phỏng vấn**.

### Trả lời phỏng vấn thế nào
Nêu lợi thế (Java 4 năm + lập trình) và khoảng trống (test design, tool automation, flaky/CI). Trình bày lộ trình 3-6 tháng có mốc đo được. Nói cân bằng lợi/hại và cách bạn tạo giá trị (ROI, ổn định). Với thị trường VN: trả lời thực tế, tránh bịa lương.

> Senior tip: Khi chuyển vai trò, đừng giới thiệu mình là "người biết Selenium". Hãy giới thiệu mình là "kỹ sư dùng code để giảm rủi ro phát hành" – cách nói này định hướng bạn học đúng thứ: chiến lược, độ ổn định, CI, và hợp tác với team.`,
  follow: ["Trong 30-60-90 ngày đầu làm SDET ở team mới, bạn ưu tiên làm gì?","Làm sao chứng minh giá trị automation với quản lý (không chỉ báo số test case)?","Nếu team muốn bạn chỉ viết script manual-case, bạn phản hồi và định hướng thế nào?"],
  refs: [{"type":"article","title":"The Practical Test Pyramid (Ham Vocke)","url":"https://martinfowler.com/articles/practical-test-pyramid.html"},{"type":"doc","title":"Selenium Documentation","url":"https://www.selenium.dev/documentation/"},{"type":"doc","title":"Playwright for Java","url":"https://playwright.dev/java/"}]
},

{
  id: 'autotest-016',
  topic: 'autotest',
  level: 'mid',
  q: 'Bạn tham gia nhóm 10 QA chưa có automation, được giao thiết kế framework từ đầu. Hãy trình bày các lớp chính, cách cấu hình, tại sao DriverFactory dùng ThreadLocal, và báo cáo như thế nào cho hữu ích?',
  a: `**Tóm tắt:** Automation framework (khung kiểm thử tự động) là tập hợp công cụ, quy ước và code giúp QA viết, chạy và bảo trì test hiệu quả, không phải mỗi người viết một kiểu. Với team 10 QA, cần chia thành các lớp tách rõ: config (cấu hình: trình duyệt, URL môi trường, thời gian chờ), DriverFactory (tạo và quản lý trình điều khiển trình duyệt, dùng ThreadLocal để mỗi luồng test có riêng trình duyệt), Page Object (lớp mô tả trang: locator và hành động), test (kịch bản kiểm chứng), reporting (báo cáo kết quả, ví dụ Allure). Mỗi lớp giải quyết một bài toán, tránh code lẫn lộn khó bảo trì khi team lớn.

### Config: tập trung cấu hình ở một nơi
Config là nơi đọc thông tin chạy test (trình duyệt Chrome hay Firefox, URL của môi trường test, timeout, tài khoản test). Thay vì hardcode (viết cứng) URL hoặc tên người dùng trực tiếp trong test, config đọc từ file properties hoặc biến môi trường. Điều này giúp chạy cùng suite trên máy dev, staging hay CI chỉ cần thay file cấu hình, không sửa code. Ví dụ: file config có key browser=chrome, baseUrl=https://staging.example.app.

### DriverFactory và ThreadLocal
DriverFactory là lớp duy nhất tạo trình điều khiển trình duyệt (driver). Trong Playwright hay Selenium, mỗi test nên dùng riêng một instance driver/BrowserContext để test không ảnh hưởng nhau. Khi chạy song song (nhiều test cùng lúc trên nhiều luồng), nếu chia sẻ driver static thì hai test cùng thao tác một trình duyệt → đơm halts. ThreadLocal là cơ chế Java lưu giá trị riêng cho từng luồng: mỗi luồng test lấy driver của riêng mình, không chia sẻ. Ví dụ: luồng A mở Chrome cho test đăng nhập, luồng B mở Chrome khác cho test thanh toán, hai luồng độc lập.

### Page Object (POM)
Page Object là lớp chứa locator (cách tìm phần tử) và hành động (nhập, click) của một trang, còn test chỉ gọi hành động và assert kết quả (kiểm tra kết quả khớp mong đợi). Khi nút login đổi id, chỉ sửa Page Object một chỗ, không sửa chục test. Test đọc như kịch bản: loginPage.login(user, pass); assert dashboard.isLoaded().

### Reporting
Reporting (báo cáo) dùng Allure để khi fail có screenshot, log, thời gian chạy, giúp team debug nhanh. Allure kết hợp annotation {{@Step}} chia bước và {{@Attachment}} đính kèm ảnh khi lỗi.

### Ví dụ cấu trúc DriverFactory (Java)
~~~java
public class DriverFactory {
    private static final ThreadLocal<BrowserContext> context = new ThreadLocal<>();
    public static BrowserContext get() { return context.get(); }
    public static void set(BrowserContext c) { context.set(c); }
}
~~~
BrowserContext (Playwright) là phiên làm việc cô lập như một cửa sổ trình duyệt mới, có cookies và localStorage riêng. ThreadLocal đảm bảo mỗi luồng test lấy context của mình.

### Lỗi hay gặp
- Hardcode URL/mật khẩu trong test → khó chạy nhiều môi trường, rủi ro bảo mật.
- Driver static chia sẻ cho mọi test → fail ngẫu nhiên khi chạy song song.
- Không có reporting → fail trên CI chỉ có stack trace, không biết màn hình thấy gì.

### Trả lời phỏng vấn thế nào
Nêu 5 lớp, giải thích ThreadLocal bảo vệ isolation (cô lập) khi chạy song song, config tách khỏi code, reporting giúp debug. Đưa ví dụ bạn từng thiết kế hoặc cải thiện. Kết: framework giá trị vì test viết nhanh, chạy ổn định, fail thì người khác hiểu ngay lý do.

> Senior tip: Đừng xây framework khổng lồ trước khi có test đầu tiên. Bắt đầu với 2-3 test critical, sau đó rút trùng lặp thành lớp reusable (dùng lại được) khi team cần.`,
  follow: [
    'Bạn tổ chức BasePage (driver, wait, logging) chung mà không thành God class thế nào?',
    'Page Factory (@FindBy) của Selenium có nên dùng không, ưu/nhược điểm?',
    'Config đọc từ biến môi trường hay file properties, chọn cái nào cho CI?'
  ],
  refs: [
    { type: 'doc', title: 'Page object models (Selenium)', url: 'https://www.selenium.dev/documentation/test_practices/encouraged/page_object_models/' },
    { type: 'doc', title: 'Playwright for Java', url: 'https://playwright.dev/java/' },
    { type: 'doc', title: 'Allure Framework', url: 'https://allurereport.org/docs/' }
  ]
},
{
  id: 'autotest-017',
  topic: 'autotest',
  level: 'senior',
  q: 'Chạy automation test song song với Playwright (Browser/Context/Page theo thread, Docker image, sharding CI) khác Selenium Grid 4 ở điểm nào? Tại sao test phải độc lập mới chạy song song được?',
  a: `**Tóm tắt:** Chạy song song là chạy nhiều test cùng lúc để rút thời gian suite. Playwright mô hình ba lớp: Browser (trình duyệt, khởi động nặng), BrowserContext (phiên làm việc cô lập như cửa sổ mới, nhẹ), Page (một tab). Mỗi test nên dùng một BrowserContext riêng, các context chạy trên luồng riêng (thread). Docker image của Playwright chứa trình duyệt đã cài sẵn, giúp CI giống máy dev. Sharding (chia mảnh) là chia suite thành các phần chạy trên nhiều job CI khác nhau. Selenium Grid 4 có kiến trúc Router/Distributor/Node phân phối test lên các node. Test phải độc lập (không chia sẻ dữ liệu, không dựa vào kết quả của test khác) mới chạy song song an toàn; nếu không, hai test cùng sửa một đơn hàng → fail ngẫu nhiên.

### Ba lớp Playwright
- **Browser**: instance trình duyệt (Chrome/Firefox/WebKit), khởi động tốn tài nguyên, thường khởi động một lần cho suite.
- **BrowserContext**: phiên làm việc cô lập, có cookies, localStorage, storage riêng. Nhẹ, tạo nhanh, đóng khi test xong. Mỗi test dùng một context.
- **Page**: một tab trong context, thao tác DOM.

Ví dụ mỗi test tự tạo context:
~~~java
BrowserContext ctx = browser.newContext();
Page page = ctx.newPage();
// ... chạy test ...
ctx.close(); // dọn sạch sau mỗi test
~~~

### ThreadLocal và chạy song song
Trong Java test runner (JUnit/TestNG), các test có thể chạy trên nhiều thread. Mỗi thread cần riêng một BrowserContext để không va chạm. Sử dụng ThreadLocal lưu context của thread hiện tại, mỗi test lấy context của mình. Nếu chia sẻ context static, hai test cùng nhấn nút trên cùng một trang → kết quả sai.

### Docker image và sharding
Playwright cung cấp Docker image đã cài trình duyệt và dependencies. CI pull image, chạy test trong container → môi trường nhất quán. Sharding: chia suite thành N mảnh (ví dụ --shard 1/3, 2/3, 3/3), chạy trên 3 job CI khác nhau, tổng thời gian giảm gần 3 lần.

### So sánh với Selenium Grid 4
Selenium Grid 4: Router nhận yêu cầu, Distributor chọn Node phù hợp, Node chạy trình duyệt. Hỗ trợ Docker, quan sát tốt. Phù hợp khi cần nhiều trình duyệt khác nhau, nhiều hệ điều hành. Playwright song song tốt trên web hiện đại, ít driver phức tạp, auto-wait mạnh. Chọn Grid nếu cần Safari thật hoặc hệ thống legacy; chọn Playwright nếu team Java muốn ít flaky và trace dễ debug.

### Tại sao test phải độc lập mới song song được
Nếu test A tạo đơn hàng và test B xóa cùng đơn hàng, chạy song song sẽ va chạm dữ liệu. Nguyên tắc: mỗi test tự tạo dữ liệu của mình (qua API), xóa sau khi xong (teardown), không dựa vào trạng thái từ test khác. Khi đó chạy 1 hay 100 test cùng lúc kết quả giống nhau.

### Lỗi hay gặp
- Chia sẻ driver/context static giữa test song song → fail lẫn vào nhau.
- Test dùng dữ liệu cứng (user test1 cố định) → race condition khi song song.
- Chia shard không cân bằng (một job có nhiều test chậm) → tổng thời gian không giảm.

### Trả lời phỏng vấn thế nào
Trình bày mô hình Browser/Context/Page, ThreadLocal isolation, Docker image, sharding, so sánh Grid 4. Nhấn mạnh độc lập dữ liệu là điều kiện tiên quyết. Đưa ví dụ flaky do chia sẻ dữ liệu bạn từng sửa.

> Senior tip: Song song hóa chỉ giúp khi test thực sự độc lập. Trước khi tăng worker, hãy sửa flaky và tách data; nếu không, bạn chỉ chạy nhanh hơn để fail nhanh hơn.`,
  follow: [
    'BrowserContext giúp cô lập test như thế nào so với mở lại trình duyệt mỗi test?',
    'Selenium Grid 4 Router/Distributor/Node mỗi vai trò làm gì?',
    'Khi nào chọn Playwright thay vì Selenium Grid 4 cho team Java?'
  ],
  refs: [
    { type: 'doc', title: 'Playwright for Java', url: 'https://playwright.dev/java/' },
    { type: 'doc', title: 'Selenium Grid', url: 'https://www.selenium.dev/documentation/grid/' },
    { type: 'doc', title: 'Test isolation', url: 'https://martinfowler.com/articles/practical-test-pyramid.html' }
  ]
},
{
  id: 'autotest-018',
  topic: 'autotest',
  level: 'senior',
  q: 'Flaky test là gì, bạn đo và cách ly như thế nào, sửa tận gốc ra sao, và tại sao retry tự động có thể nguy hiểm?',
  a: `**Tóm tắt:** Flaky test (test chập ch fluctuate) là test đôi khi pass đôi khi fail mà code sản phẩm không đổi, do timing, môi trường hoặc dữ liệu. Đo: flaky rate = số lần fail do flaky chia tổng số lần chạy. Cách ly: đánh dấu test flaky, cuar ra suite riêng, chạy lẻ để xác nhận. Sửa tận gốc: chờ đúng điều kiện (không sleep cứng), dữ liệu độc lập, locator bền, không chia sẻ trạng thái. Retry tự động (chạy lại test khi fail) nguy hiểm vì che lỗi thật, làm suite xanh giả, tốn thời gian và khiến defect leakage (lỗi lọt ra production) tăng mà không ai biết.

### Flaky test là gì
Test flaky là test không ổn định: cùng code, cùng môi trường, chạy lần này pass, lần sau fail. Nguyên nhân hay gặp: phần tử chưa xuất hiện nhưng test đã click (timing), chờ không đủ thì thử lại, dữ liệu cũ chưa xóa, mạng chậm, animation chưa dứt. Flaky làm team mất niềm tin vào automation: khi CI đỏ, ai đó nói có lẽ flaky, bỏ qua → lỗi thật lọt qua.

### Cách đo flaky rate
Flaky rate = (số lần test fail do flaky) / (tổng số lần chạy test) × 100%. Theo dõi trên CI: mỗi lần test fail, chạy lại nếu nghi ngờ flaky; nếu chạy lại pass → đánh dấu flaky. Liệt kê top test flaky nhất để ưu tiên sửa. Ví dụ: 1000 lần chạy, 20 lần fail flaky → flaky rate 2%.

### Cách ly flaky test
- Đánh dấu test flaky (tag flaky), cuar ra suite riêng không chặn merge.
- Chạy lẻ test đó nhiều lần trên máy dev để tái hiện.
- Nếu không sửa được ngay, tạm thời bỏ khỏi suite regression chính để không nhiễu tín hiệu.

### Sửa tận gốc
- Thay sleep cứng (Thread.sleep) bằng wait điều kiện (chờ nút clickable, spinner biến mất).
- Dữ liệu độc lập mỗi test, không dùng chung tài khoản cố định.
- Locator bền (data-testid), tránh XPath giòn.
- Không chia sẻ session/cookie giữa test.

### Tại sao retry tự động nguy hiểm
Retry tự động là cấu hình CI chạy lại test khi fail (ví dụ retry 3 lần). Nó làm test flaky vẫn pass trên CI, nhưng che giấu lỗi thật: một lần fail có thể do bug sản phẩm, retry lần sau pass do thời điểm khác, team tưởng ổn. Hậu quả: flaky rate thấp giả tạo, defect leakage tăng, equipo dành giờ debug "ghost bug". Chỉ dùng retry có kiểm soát cho lỗi hạ tầng rõ ràng (mạng ngắt), và phải theo dõi test nào hay retry để sửa gốc.

### Lỗi hay gặp
- Bật retry toàn suite để CI xanh, không điều tra flaky.
- Chỉ sửa triệu chứng (thêm sleep) không sửa gốc (đợi điều kiện sai).
- Bỏ qua test flaky vì "chạy lại pass".

### Trả lời phỏng vấn thế nào
Nêu định nghĩa, cách đo flaky rate, cách ly và sửa tận gốc. Chủ động chỉ ra rủi ro của retry tự động. Đưa ví dụ test flaky bạn từng sửa và kết quả (flaky rate giảm từ bao nhiêu xuống bao nhiêu).

> Senior tip: Flaky test tệ hơn không có test, vì nó dạy team bỏ qua tín hiệu đỏ. Ưu tiên sửa ít test flaky thật hơn bật retry toàn bộ suite.`,
  follow: [
    'Làm sao phân biệt flaky test và bug thật trên CI?',
    'Khi nào retry tự động là chấp nhận được, khi nào không?',
    'Bạn theo dõi flaky rate như thế nào và báo cáo cho team định kỳ?'
  ],
  refs: [
    { type: 'doc', title: 'Playwright for Java', url: 'https://playwright.dev/java/' },
    { type: 'doc', title: 'Test isolation', url: 'https://martinfowler.com/articles/practical-test-pyramid.html' },
    { type: 'doc', title: 'Selenium waits', url: 'https://www.selenium.dev/documentation/webdriver/waits/' }
  ]
},
{
  id: 'autotest-019',
  topic: 'autotest',
  level: 'senior',
  q: 'Suite UI chạy 2 giờ cần xuống dưới 20 phút. Bạn phân tích và lập kế hoạch thế nào? Nêu các bước cụ thể và ví dụ số liệu.',
  a: `**Tóm tắt:** Giảm thời gian suite UI từ 2 giờ xuống dưới 20 phút yêu cầu kết hợp cắt bớt test UI không cần thiết, chuyển phần lớn xuống API/unit, chạy song song, và sử dụng headless. Không thể chỉ bật nhiều worker mà giữ nguyên 120 phút test UI. Kế hoạch: đo thời gian từng test, tìm test chậm nhất, chuyển test nghiệp vụ không cần giao diện xuống API, chạy headless, setup dữ liệu qua API thay vì qua UI, chia shard CI, và xử lý test flaky. Mục tiêu: giữ test UI chỉ cho luồng quan trọng (đăng nhập, thanh toán), chạy nhanh và ổn định.

### Bước 1: đo và phân tích
Chạy suite, ghi thời gian từng test. Xác định 20% test chậm nhất h übernahm 80% thời gian (quy tắc Pareto). Ví dụ: 100 test UI, 10 test chậm nhất chiếm 90 phút. Tập trung vào những test này.

### Bước 2: chuyển test xuống tầng thấp hơn (test pyramid)
Không phải mọi kiểm thử đều cần UI. Test kiểm tra rule tính phí, kiểm tra dữ liệu trả về API nên chuyển xuống REST Assured (gọi API trực tiếp, nhanh, ổn định). UI chỉ giữ luồng end-to-end quan trọng. Ví dụ: 60 test kiểm tra tính toán giảm giá chuyển xuống API → tiết kiệm 50 phút.

### Bước 3: chạy song song và headless
Chạy trên nhiều worker (ví dụ 4 thread) và headless (trình duyệt không cửa sổ, phù hợp CI). 120 phút chia 4 worker → khoảng 30 phút, rồi kết hợp bước 2 → dưới 20 phút.

### Bước 4: setup dữ liệu qua API
Thay vì tạo đơn hàng qua UI (nhiều bước click, chậm), dùng API tạo dữ liệu trước, rồi UI chỉ kiểm tra hiển thị. Tiết kiệm thời gian setup mỗi test.

### Bước 5: sharding CI và xử lý flaky
Chia suite thành các mảnh chạy trên job CI khác nhau. Xoá hoặc cuar test flaky, không để test flaky làm suite chạy lại nhiều lần.

### Ví dụ số liệu
| Giai đoạn | Thời gian suite |
|---|---|
| Ban đầu | 120 phút |
| Chuyển 60 test xuống API | 70 phút |
| Chạy headless + 4 worker | 20 phút |
| Sau khi xử lý flaky | 18 phút |

### Lỗi hay gặp
- Chỉ tăng worker mà không chuyển test xuống API → giảm nhẹ, chưa đủ.
- Giữ mọi test UI vì "không muốn xóa" → suite vẫn chậm.
- Chạy headed (có cửa sổ) trên CI → khó khởi động, chậm.

### Trả lời phỏng vấn thế nào
Nêu 5 bước cụ thể, ví dụ số liệu, và nguyên tắc giữ UI chỉ cho luồng critical. Giải thích vì sao không chỉ dựa vào song song hóa. Đưa kinh nghiệm bạn từng tối giản suite thực tế.

> Senior tip: Mục tiêu không phải suite ngắn nhất, mà là suite nhanh và đáng tin. Một suite 20 phút chạy xanh mỗi ngày giá trị hơn suite 2 giờ đỏ ngắt mỗi tuần.`,
  follow: [
    'Bạn quyết định test nào chuyển từ UI xuống API dựa trên tiêu chí nào?',
    'Chạy song song có ảnh hưởng gì đến cách quản lý dữ liệu test?',
    'Sau khi giảm xuống 20 phút, bạn giữ Suite này chạy mỗi PR hay chỉ nightly?'
  ],
  refs: [
    { type: 'doc', title: 'Playwright for Java', url: 'https://playwright.dev/java/' },
    { type: 'doc', title: 'Practical test pyramid', url: 'https://martinfowler.com/articles/practical-test-pyramid.html' },
    { type: 'doc', title: 'REST Assured', url: 'https://rest-assured.io/' }
  ]
},
{
  id: 'autotest-020',
  topic: 'autotest',
  level: 'senior',
  q: 'Visual regression testing (kiểm thử hồi quy trực quan) hoạt động như thế nào, bạn chọn ngưỡng sai khác ra sao, và chi phí bảo trì là gì?',
  a: `**Tóm tắt:** Visual regression testing chụp ảnh màn hình (screenshot) của trang web, sau đó so sánh với ảnh cơ sở (baseline – ảnh được chấp nhận trước đó). Nếu có sai khác vượt ngưỡng cho phép (ví dụ phần trăm pixel khác hoặc số điểm sai khác), test bị đánh dấu fail. Giúp phát hiện lỗi giao diện không intended (thông lệ) như chữ bị che, màu đổi, layout bị vỡ. Nhược điểm là dễ flaky do font, anti-alias, nội dung động, và chi phí bảo trì cao khi baseline cần cập nhật thường xuyên.

### Cách hoạt động
1. Chạy test lần đầu, chụp ảnh màn hình của các trang quan trọng → lưu làm baseline.
2. Lần sau, chụp ảnh lại cùng điều kiện, so sánh pixel về pixel với baseline.
3. Nếu sai khác nhỏ hơn ngưỡng → pass. Nếu vượt ngưỡng → fail, báo cáo ảnh chênh lệch để QA xem xét.

Ví dụ: trang sản phẩm có 500.000 pixel, ngưỡng 0,1% = cho phép tối đa 500 pixel khác. Nếu một banner mới khiến 2.000 pixel khác → fail.

### Chọn ngưỡng sai khác
Ngưỡng quá chặt → flaky (font render khác trên máy, ảnh nén khác) → test fail liên tục dù giao diện đúng. Ngưỡng quá lỏng → bỏ lỗi thật (thiếu nút, chữ bị che) → giá trị thấp. Bắt đầu ngưỡng trung bình (ví dụ 0,1-0,5%), điều chỉnh theo từng trang. Trang có animation hoặc quảng cáo đổi liên tục nên loại trừ hoặc chụp sau khi ổn định.

### Chi phí bảo trì
- Cập nhật baseline khi giao diện thay đổi hợp lệ (ví dụ redesign nút) → QA phải duyệt và chấp nhận ảnh mới.
- Lưu trữ hàng nghìn ảnh baseline tốn dung lượng.
- False positive (báo sai) làm team mất niềm tin, bỏ qua alert visual.
- Chỉ hiệu quả trên giao diện ổn định; trang đổi liên tục không nên dùng visual regression nhiều.

### Khi dùng / không dùng
- Dùng: trang landing, trang thanh toán, thiết kế giao diện quan trọng ít thay đổi.
- Không dùng: trang có nội dung cá nhân hóa, quảng cáo đổi, hoặc test chức năng (dùng assert dữ liệu thay vì ảnh).

### Lỗi hay gặp
- Chụp ảnh trước khi trang load xong → sai khác do thiếu nội dung, không do lỗi giao diện.
- Không cập nhật baseline sau redesign → suite visual fail toàn bộ.
- Dùng visual cho mọi trang → bảo trì quá nặng, flaky cao.

### Trả lời phỏng vấn thế nào
Giải thích cơ chế chụp ảnh và so sánh baseline, cách chọn ngưỡng, và chi phí bảo trì. Nêu trường hợp dùng và không dùng. Đưa ví dụ sai gì phát hiện được (ví dụ nút thanh toán bị che bởi popup).

> Senior tip: Visual regression là lớp bổ trợ, không thay thế assert chức năng. Kết hợp cả hai: assert dữ liệu đúng (API/UI) và chụp ảnh các trang quan trọng ít thay đổi. Đừng để visual là lớp test chính vì chi phí bảo trì cao.`,
  follow: [
    'Làm sao giảm false positive do font và anti-alias trên các máy khác nhau?',
    'Khi redesign giao diện, bạn quy trình cập nhật baseline như thế nào?',
    'Bạn áp dụng visual regression cho trang nào, loại trừ trang nào?'
  ],
  refs: [
    { type: 'doc', title: 'Playwright for Java', url: 'https://playwright.dev/java/' },
    { type: 'doc', title: 'Practical test pyramid', url: 'https://martinfowler.com/articles/practical-test-pyramid.html' },
    { type: 'doc', title: 'Selenium documentation', url: 'https://www.selenium.dev/documentation/' }
  ]
},
{
  id: 'autotest-021',
  topic: 'autotest',
  level: 'senior',
  q: 'Contract testing (kiểm thử hợp đồng) khác E2E (end-to-end) giữa microservices từ góc nhìn QA ra sao? Liên kết với topic testing, không lặp lại nội dung đã có.',
  a: `**Tóm tắt:** Contract testing (kiểm thử hợp đồng, ví dụ Pact) xác nhận hai service hiểu chung về định dạng yêu cầu và phản hồi, mà không cần chạy cùng lúc toàn bộ hệ thống. Consumer (service gọi) ghi lại hợp đồng mong đợi, Provider (service được gọi) verify xem mình có đáp ứng đúng hợp đồng không. E2E chạy toàn bộ luồng qua nhiều service thật, chậm, cần môi trường đầy đủ. Từ góc QA: contract testing dùng để bắt lỗi tích hợp sớm và chạy liên tục trong CI; E2E dùng cho luồng kinh doanh critical ít chạy (nightly/trước release). Topic testing đã đề cập contract testing từ góc dev; ở đây tập trung vai trò QA và khi chọn cái nào.

### Contract testing là gì
Hai service giao tiếp qua API. Consumer viết contract: "Tôi gửi yêu cầu A, tôi mong nhận phản hồi B". Contract được lưu và gửi cho Provider. Provider chạy verify: nhận yêu cầu A, kiểm tra phản hồi có khớp B không. Hai phía có thể verify độc lập, không cần cùng khởi động.

Ví dụ: Order Service gọi Payment Service. Order viết contract: gửi POST /pay với amount, token; mong phản hồi 200 kèm transactionId. Payment verify xem mình trả đúng schema đó không.

### E2E là gì
E2E (end-to-end, kiểm tra từ đầu đến cuối) chạy luồng thực tế qua nhiều service: người dùng đặt hàng trên UI → Order Service → Payment Service → Email Service. Kiểm tra toàn hệ thống hoạt động cùng nhau, nhưng chậm, cần database, message broker, môi trường staging đầy đủ.

### So sánh từ góc QA
| Tiêu chí | Contract testing | E2E |
|---|---|---|
| Tốc độ | Nên (giây) | Chậm (phút) |
| Môi trường | Không cần full hệ thống | Cần staging đầy đủ |
| Lỗi bắt được | Lỗi định dạng dữ liệu giữa service | Lỗi luồng kinh doanh toàn diện |
| Chạy khi nào | Mỗi commit (CI) | Nightly, trước release |
| Ai chủ yếu | QA + dev cùng xác định contract | QA viết kịch bản kinh doanh |

### Liên kết với topic testing
Topic testing đã có phần contract testing và mutation test từ góc kỹ thuật. Ở đây nhấn mạnh: QA tham gia định nghĩa contract cho các luồng quan trọng, chủ động sync với dev khi API thay đổi, và dùng E2E chỉ cho handful số lượng ca critical để không làm chậm pipeline.

### Lỗi hay gặp
- Chỉ dùng E2E cho mọi kiểm tra tích hợp → pipeline chậm, fail khó chẩn đoán service nào.
- Không cập nhật contract khi API đổi → contract pass nhưng thực tế fail.
- Quên các trường tùy chọn trong contract → provider thêm trường, consumer hỏng.

### Trả lời phỏng vấn thế nào
Nêu khác biệt chính (tốc độ, môi trường, lỗi bắt được), khi dùng contract vs E2E, và vai trò QA trong định nghĩa contract. Ví dụ thực tế về service bạn từng test.

> Senior tip: Contract testing là lớp vững chắc giữa unit và E2E. Dùng contract cho hầu hết kiểm tra tích hợp, giữ E2E chỉ cho 5-10 luồng kinh doanh quan trọng nhất.`,
  follow: [
    'Khi API thay đổi, ai chịu trách nhiệm cập nhật contract, và quy trình ra sao?',
    'Contract testing bắt được loại lỗi nào mà E2E khó bắt, và ngược lại?',
    'Bạn quyết định contract hay E2E cho một tính năng mới dựa trên yếu tố nào?'
  ],
  refs: [
    { type: 'doc', title: 'Practical test pyramid', url: 'https://martinfowler.com/articles/practical-test-pyramid.html' },
    { type: 'doc', title: 'REST Assured', url: 'https://rest-assured.io/' },
    { type: 'doc', title: 'Cucumber documentation', url: 'https://cucumber.io/docs/cucumber/' }
  ]
},
{
  id: 'autotest-022',
  topic: 'autotest',
  level: 'senior',
  q: 'Performance test (kiểm thử hiệu năng) với k6, JMeter hay Gatling: mô hình tải (workload model), think time, ramp-up, và cách đọc p95/p99. Tập trung góc QA tooling, không trùng câu load test đã có trong topic testing.',
  a: `**Tóm tắt:** Performance test kiểm tra hệ thống chịu tải bao nhiêu, phản hồi nhanh bao nhiêu, khác automation chức năng (không chỉ pass/fail). k6 (viết JavaScript), JMeter (giao diện Java, phổ biến), Gatling (Scala, code như code) là công cụ phổ biến. Workload model (mô hình tải) mô tả số user ảo, thời gian, tỷ lệ từng hành động. Think time (thời gian nghĩ) là khoảng nghỉ giữa hai hành động của người dùng thật, giúp mô phỏng thực tế. Ramp-up (đẩy dần) là tăng số user từ 0 lên mục tiêu dần dần, tránh cho hệ thống sốc. p95/p99 là percentile: 95% request nhanh hơn X ms, 1% kém nhất nhanh hơn Y ms. Dùng để biết phần lớn user được phục vụ tốt, còn p99 là nhóm 1% user bị chậm nhất.

### Các công cụ
- **k6**: script JavaScript, chạy trong CLI, thích hợp CI và developer.
- **JMeter**: giao diện đồ họa, nhiều plugin, phổ biến trong doanh nghiệp VN.
- **Gatling**: viết script Scala/Java, báo cáo đẹp, thích hợp team thích code.

### Workload model
Mô hình tải định nghĩa: bao nhiêu user đồng thời, trong bao lâu, mỗi user làm gì. Ví dụ: 100 user đặt hàng, mỗi user 5 đơn/giờ, trong 30 phút. QA cần đồng ý với PM về mô hình này trước khi chạy.

### Think time
Người thật không nhấn nút liên tục mà nghĩ vài giây giữa các bước. Think time mô phỏng khoảng nghỉ đó (ví dụ uniform 3-5 giây). Nếu bỏ think time, hệ thống bị tấn công nhiều request hơn thực tế → kết quả sai lệch (thấp hơn thực tế).

### Ramp-up
Không nhích ngay 1000 user vào lúc 0 giây (có thể làm hệ thống sốc, kết quả không phản ánh thực tế). Ramp-up tăng dần: 0 đến 1000 user trong 10 phút, hệ thống ổn định mới đo.

### Đọc p95/p99
- **p95**: 95% request có thời gian phản hồi nhỏ hơn hoặc bằng giá trị này. Ví dụ p95 = 400 ms có nghĩa 95% user thấy trang tải trong 400 ms.
- **p99**: 1% request kém nhất. Ví dụ p99 = 2 giây có nghĩa 1% user chờ hơn 2 giây.
QA quan tâm p95/p99 vì trung bình có thể che các request cực chậm. Nếu p50 = 100 ms nhưng p99 = 5 giây, có thể hệ thống có vấn đề với một số user.

### Lỗi hay gặp
- Chỉ báo cáo trung bình (average) → che lỗi chậm hiếm.
- Không có think time → tải cao hơn thực tế, sai kết quả.
- Chạy performance trên môi trường khác production (cấu hình khác) → kết quả không tham khảo.
- Không quy định threshold (ngưỡng chấp nhận) trước khi chạy.

### Trả lời phỏng vấn thế nào
Nêu công cụ đã dùng, cách xây workload model, think time, ramp-up, và cách giải thích p95/p99 cho quản lý. Ví dụ số liệu thực tế bạn từng đọc (ví dụ p95 400 ms, p99 2 giây).

> Senior tip: Performance test không phải chạy một lần xong. Hãy thiết lập baseline (số liệu tham chiếu) và so sánh mỗi release: nếu p95 tăng từ 400 ms lên 800 ms, có thể có regression hiệu năng cần xử lý trước khi deploy.`,
  follow: [
    'Làm sao chọn số user ảo phù hợp cho load test đầu tiên?',
    'p95 ổn định nhưng p99 tăng cao, bạn xử lý ra sao?',
    'Bạn chạy performance test trong CI hay chỉ trên môi trường riêng, tại sao?'
  ],
  refs: [
    { type: 'doc', title: 'k6 documentation', url: 'https://k6.io/docs/' },
    { type: 'doc', title: 'Apache JMeter', url: 'https://jmeter.apache.org/' },
    { type: 'doc', title: 'Gatling documentation', url: 'https://gatling.io/docs/' }
  ]
},
{
  id: 'autotest-023',
  topic: 'autotest',
  level: 'senior',
  q: 'Dùng Playwright APIRequestContext để test API và kết hợp UI+API trong một test (setup dữ liệu bằng API, kiểm tra bằng UI). Network interception (page.route) dùng để mock backend như thế nào?',
  a: `**Tóm tắt:** APIRequestContext là đối tượng Playwright gọi HTTP trực tiếp mà không mở trình duyệt, nhanh và ổn định. Dùng để setup dữ liệu (ví dụ tạo user, đơn hàng qua API) rồi mở UI kiểm tra kết quả hiển thị. Kết hợp UI+API trong một test giúp test nhanh hơn và ít phụ thuộc giao diện. Network interception (page.route) chặn yêu cầu mạng từ trình duyệt và trả phản hồi giả lập (mock), dùng để kiểm tra xử lý lỗi (API trả 500, hết thời gian) mà không cần backend thật.

### APIRequestContext là gì
APIRequestContext cho phép gửi HTTP request (GET, POST...) từ code Java Playwright mà không khởi động trình duyệt. Nhanh, ổn định, không bị flaky do trang render. Dùng thường để chuẩn bị dữ liệu trước khi test UI.

### Kết hợp UI+API trong một test
Ví dụ test "xem đơn hàng sau khi đặt":
1. Dùng APIRequestContext gọi POST /orders tạo đơn hàng với trạng thái "đang giao".
2. Mở UI, vào trang "Đơn hàng của tôi".
3. Kiểm tra UI hiển thị đơn hàng vừa tạo với trạng thái đúng.

~~~java
// Setup dữ liệu qua API (không mở trình duyệt)
APIRequestContext request = APIRequestContext.create();
var createResp = request.post("https://api.example.test/orders",
    new APIRequestContextOptions().setData("{ \"customer\": \"alice\", \"items\": [...] }"));
int orderId = createResp.json().getInteger("id");

// Kiểm tra bằng UI
Page page = browser.newContext().newPage();
page.navigate("https://app.example.test/orders/" + orderId);
page.locator("[data-testid='order-status']").waitFor();
assertEquals("ĐANG_GIAO", page.locator("[data-testid='order-status']").innerText());
~~~

Lợi ích: tạo dữ liệu bằng API nhanh, không cần click tạo đơn qua UI; UI chỉ dùng để verify hiển thị.

### Network interception với page.route
page.route chặn mọi yêu cầu mạng của trang (gọi API, ảnh, script) và cho phép trả lời lại (fulfill) với dữ liệu giả. Dùng để:
- Giả lập API thanh toán thành công / thất bại mà không gọi thật.
- Kiểm tra UI hiển thị thông báo khi API trả lỗi 500.
- Tránh phụ thuộc backend không ổn định trong test UI.

Ví dụ (ý tưởng Java Playwright):
~~~java
page.route("**/api/payment", route -> {
    route.fulfill(new RouteFulfillOptions()
        .setStatus(200)
        .setContentType("application/json")
        .setBody("{ \"status\": \"success\", \"transactionId\": \"txn_123\" }"));
});
~~~
Sau khi route được thiết lập, mọi yêu cầu tới /api/payment từ trang sẽ nhận phản hồi giả này.

### Lỗi hay gặp
- Mock quá nhiều backend → test không kiểm tra sự kết hợp thật, có thể pass nhưng production lỗi.
- Route pattern không khớp (ví dụ sai đường dẫn) → request vẫn đi thật, test flaky.
- Quên bỏ route sau test → ảnh hưởng test khác chạy cùng trình duyệt.
- Chỉ testUI mà không verify API thật trong một số ca quan trọng.

### Trả lời phỏng vấn thế nào
Giải thích APIRequestContext dùng để setup dữ liệu nhanh, ví dụ kết hợp UI+API, và page.route mock backend để kiểm tra xử lý lỗi. Nhấn mạnh không lạm dụng mock, vẫn cần có ít nhất một ca gọi API thật.

> Senior tip: Dùng API setup để test UI chạy nhanh, nhưng hãy giữ một vài test gọi API thật (không mock) để đảm bảo hệ thống thực sự kết nối đúng. Mock chỉ dùng để kiểm tra trường hợp lỗi khó tái hiện (timeout, 500).`,
  follow: [
    'Làm sao APIRequestContext và Page dùng chung session/auth, nếu cần?',
    'Khi nào bạn chọn mock backend thay vì dùng sandbox thật?',
    'Bạn verify route pattern đã khớp đúng yêu cầu mạng nào không?'
  ],
  refs: [
    { type: 'doc', title: 'Playwright for Java', url: 'https://playwright.dev/java/' },
    { type: 'doc', title: 'REST Assured', url: 'https://rest-assured.io/' },
    { type: 'doc', title: 'API testing', url: 'https://martinfowler.com/articles/practical-test-pyramid.html' }
  ]
},
{
  id: 'autotest-024',
  topic: 'autotest',
  level: 'mid',
  q: 'Shift-left là gì, và automation test chạy ở mỗi giai đoạn nào trong pipeline (PR, nightly, trước release) như thế nào?',
  a: `**Tóm tắt:** Shift-left (dịch chuyển trái) là thực hiện kiểm thử sớm hơn trong vòng đời phát triển phần mềm, chờ đến cuối mới test. Automation test chia theo pipeline: PR (pull request – yêu cầu gộp mã) chạy unit và API smoke nhanh (dưới 10 phút); nightly (chạy mỗi đêm) chạy regression UI đầy đủ và performance nhẹ; trước release chạy smoke trên staging và E2E luồng critical. Mục tiêu là phát hiện lỗi sớm, chi phí sửa thấp, và không làm chậm việc đóng góp mã của dev.

### Shift-left là gì
Trong mô hình truyền thống, test xảy ra sau khi dev xong tính năng (phía phải của biểu đồ quá trình). Shift-left dời kiểm thử sang trái (sớm hơn): dev viết unit test, QA viết API test cùng lúc dev viết code. Lỗi phát hiện ở giai đoạn code thì sửa rẻ và nhanh hơn lỗi phát hiện sau khi deploy production.

### Test chạy ở mỗi giai đoạn
- **PR (mỗi khi gửi mã để review):** unit test, API smoke, lint. Chạy nhanh (dưới 10 phút), gate merge (không được gộp mã nếu fail).
- **Nightly (mỗi đêm):** regression UI đầy đủ, performance nhẹ, visual regression. Chạy sau giờ làm việc, không cản trở dev.
- **Trước release:** smoke test trên staging (môi trường gần production), E2E luồng critical (đăng nhập, thanh toán), kiểm tra dữ liệu thật gần production.

Ví dụ pipeline:
~~~text
PR push --> unit + API smoke (<10p) --> gate merge
Nightly --> regression UI + performance
Pre-release --> smoke staging + E2E critical
~~~

### Tại sao phân tầng
Nếu chạy toàn bộ UI regression trên mỗi PR, dev phải chờ 2 giờ trước khi biết mã có được gộp không → chậm phát triển, dev có thể bỏ qua test. Phân tầng giúp phản hồi nhanh ở PR, kiểm tra sâu hơn ở nightly/release.

### Lỗi hay gặp
- Chạy UI regression trên mọi PR → pipeline chậm, dev không tin test.
- Nightly fail không ai xử lý sáng hôm sau → lỗi lũy thành.
- Không có gate merge → mã lỗi có thể vào nhánh chính.

### Trả lời phỏng vấn thế nào
Nêu shift-left ý nghĩa, bảng test theo pipeline, và lý do phân tầng. Ví dụ pipeline bạn từng thiết kế hoặc cải thiện. Giải thích gate merge và trách nhiệm xử lý nightly fail.

> Senior tip: Pipeline chỉ có giá trị khi tín hiệu đáng tin. PR phải nhanh và ổn định để dev tin vào nó; nightly có thể chậm hơn nhưng phải xử lý fail kịp sáng hôm sau.`,
  follow: [
    'Làm sao quyết định test nào vào PR smoke, test nào vào nightly regression?',
    'Nightly test fail, ai chịu trách nhiệm xử lý sáng hôm sau?',
    'Gate merge là gì và tại là bắt buộc cho PR?'
  ],
  refs: [
    { type: 'doc', title: 'Practical test pyramid', url: 'https://martinfowler.com/articles/practical-test-pyramid.html' },
    { type: 'doc', title: 'GitHub Actions', url: 'https://docs.github.com/en/actions' },
    { type: 'doc', title: 'Jenkins pipeline', url: 'https://www.jenkins.io/doc/book/pipeline/' }
  ]
},
{
  id: 'autotest-025',
  topic: 'autotest',
  level: 'senior',
  q: 'Test phụ thuộc bên thứ ba (payment gateway, OTP, email) như thế nào để không gọi thật mỗi lần? Nêu WireMock, sandbox và test hook.',
  a: `**Tóm tắt:** Các dịch vụ bên thứ ba (thanh toán, gửi OTP qua SMS, gửi email) không nên gọi thật trong automation test vì tốn tiền, chậm, và không kiểm soát được trạng thái (ví dụ OTP ngẫu nhiên). Giải pháp: WireMock (máy chủ giả lập HTTP cục bộ), sandbox (môi trường test của nhà cung cấp), và test hook (điểm chèn code để bypass hoặc giả lập phản hồi). Mục tiêu là test luồng của mình mà không ảnh hưởng hay bị ảnh hưởng bởi dịch vụ bên ngoài.

### Vấn đề gọi thật bên thứ ba
- Payment gateway: mỗi giao dịch test tốn phí nhỏ, và cần thẻ thật/giả.
- OTP SMS: mỗi mã tốn tiền, nhà cung cấp chặn nếu gửi quá nhiều.
- Email: hộp thư test ngập tin, và mã xác thực thay đổi mỗi lần.

### WireMock
WireMock là một HTTP server giả lập chạy cục bộ hoặc trong test. Bạn cấu hình: khi nhận yêu cầu tới /payment, trả về phản hồi thành công hoặc thất bại kèm dữ liệu giả. Test gọi tới WireMock thay vì gateway thật, nhanh và dự đoán được.

Ví dụ cấu hình WireMock (ý tưởng):
~~~text
Khi yêu cầu POST /v1/charge với amount > 0
Trả về 200 kèm { "status": "succeeded", "transactionId": "test_txn_123" }
~~~

### Sandbox
Nhiều nhà cung cấp (payment, email, SMS) cung cấp môi trường sandbox riêng cho phát triển/test. Giao diện giống thật nhưng không trừ tiền thật, OTP luôn cố định (ví dụ 123456). Dùng sandbox khi cần kiểm tra tích hợp thực tế hơn WireMock.

### Test hook
Test hook là điểm chèn trong code để thay đổi hành vi khi chạy test. Ví dụ: hàm gửi OTP nhận tham số hook, trong test trả về mã cố định "123456" thay vì gọi SMS thật. Hook giúp kiểm tra luồng xác thực mà không cần điện thoại thật.

### Khi dùng cái nào
- **WireMock:** kiểm tra luồng của bạn với phản hồi contrôled, nhanh, CI friendly.
- **Sandbox:** kiểm tra tích hợp thực tế hơn, nhưng chậm hơn và có giới hạn lượt gọi.
- **Test hook:** khi không thể cấu hình WireMock/sandbox, hoặc cần kiểm tra logic nội bộ với dữ liệu giả.

### Lỗi hay gặp
- Gọi thật payment trong test CI → tốn tiền và fail khi mạng chậm.
- OTP thật trong test → không thể chạy tự động, tester phải đợi tin nhắn.
- Không dọn dữ liệu trong sandbox → dữ liệu cũ làm fail test sau.

### Trả lời phỏng vấn thế nào
Nêu ba giải pháp (WireMock, sandbox, test hook), ví dụ cụ thể cho payment/OTP/email, và khi chọn từng cái. Giải thích tại sao không gọi thật trong automation.

> Senior tip: Đừng tạo phụ thuộc cứng vào dịch vụ bên thứ ba trong suite automation. Mỗi service bên ngoài cần một lớp giả lập hoặc hook để test tự chủ, nhanh, và không tốn phí.`,
  follow: [
    'Làm sao giả lập phản hồi lỗi từ payment gateway (thẻ bị từ chối, hết hạn)?',
    'Sandbox có hạn chế gì so với production thật?',
    'Test hook có thể làm giảm độ tin cậy của test không, tại sao?'
  ],
  refs: [
    { type: 'doc', title: 'WireMock', url: 'https://wiremock.org/' },
    { type: 'doc', title: 'REST Assured', url: 'https://rest-assured.io/' },
    { type: 'doc', title: 'Testcontainers', url: 'https://www.testcontainers.org/' }
  ]
},
{
  id: 'autotest-026',
  topic: 'autotest',
  level: 'lead',
  q: 'Bảo mật cơ bản trong automation test (OWASP ZAP baseline trong CI) ở mức QA là gì? Bạn tích hợp như thế nào và lưu ý gì?',
  a: `**Tóm tắt:** Bảo mật trong automation ở mức QA không phải làm pentester (kiểm tra thâm nhập chuyên sâu), mà là chạy quét cơ bản (baseline scan) trong CI để phát hiện lỗi bảo mật phổ biến (thiếu header bảo mật, form dễ bị tấn công đơn giản...) và báo cáo để dev xử lý. OWASP ZAP là công cụ mã nguồn mở phổ biến, có thể chạy qua Docker trong CI. ZAP baseline scan kiểm tra các quy tắc cơ bản và xuất báo cáo. Lưu ý: chỉ quét môi trường test/staging, không quét production nếu không có phép, và không đánh lộ token/mật khẩu vào báo cáo.

### Bảo mật ở mức QA là gì
QA không cần là chuyên gia bảo mật, nhưng có thể thêm bước quét tự động vào pipeline test. Mục tiêu là phát hiện sớm các lỗi phổ biến (low-hanging fruit) trước khi code đến production, giảm burden cho đội bảo mật.

### OWASP ZAP baseline scan
ZAP (Zed Attack Proxy) là công cụ quét bảo mật web mã nguồn mở. Baseline scan là chế độ quét nhẹ, không tấn công mạnh, chỉ kiểm tra các quy tắc cơ bản (ví dụ header Strict-Transport-Security, Content-Security-Policy, cookie Secure/HttpOnly). Chạy qua Docker image zaproxy/zap-stable trong CI.

Ví dụ chạy ZAP baseline (ý tưởng):
~~~bash
docker run --network host -v $(pwd):/zap/wrk/:rw zaproxy/zap-stable \
    zap-baseline.py -t https://staging.example.app -r report.html
~~~
(Lệnh trên chỉ minh họa ý tưởng, tùy phiên bản ZAP.)

### Tích hợp vào CI
Thêm bước ZAP sau khi deploy ứng dụng lên staging trong pipeline. Nếu ZAP tìm thấy lỗi mức cao, có thể fail build hoặc chỉ báo cáo để dev xử lý tuỳ mức độ nghiêm trọng. Xuất báo cáo HTML làm artifact để team xem.

### Lưu ý quan trọng
- Chỉ quét staging/test, không quét production nếu không có bằng phép từ chủ sở hữu hệ thống.
- Không lưu token, mật khẩu, PII (dữ liệu nhận dạng cá nhân) vào báo cáo ZAP.
- ZAP baseline có thể báo lỗi giả (false positive), QA cần xem xét trước khi đưa dev xử lý.
- Bảo mật automation là bổ sung, không thay thế penetration testing định kỳ.

### Lỗi hay gặp
- Quét production mà không có phép → có thể bị coi là tấn công, vi phạm pháp lý.
- Báo cáo ZAP chứa token → rủi ro bảo mật mới.
- Xem ZAP baseline là đủ bảo mật → bỏ qua pentester chuyên sâu.

### Trả lời phỏng vấn thế nào
Nêu OWASP ZAP là công cụ quét cơ bản, cách chạy qua Docker trong CI, loại lỗi phát hiện (header, cookie), và lưu ý về môi trường và dữ liệu nhạy cảm. Khẳng định đây là mức QA, không thay thế pentester.

> Senior tip: Bảo mật automation giá trị khi kết hợp với quy trình xử lý: ZAP báo lỗi → dev sửa → re-quét pass. Nếu báo cáo ZAP được sinh ra rồi không ai xem, nó không có giá trị.`,
  follow: [
    'Lỗi phổ biến nào ZAP baseline thường phát hiện ở ứng dụng Java/Spring?',
    'Làm sao xử lý false positive từ ZAP mà không làm chậm CI?',
    'Bạn phân quyền ai xem và xử lý báo cáo bảo mật từ automation?'
  ],
  refs: [
    { type: 'doc', title: 'OWASP ZAP', url: 'https://owasp.org/www-project-zap/' },
    { type: 'doc', title: 'GitHub Actions', url: 'https://docs.github.com/en/actions' },
    { type: 'doc', title: 'Practical test pyramid', url: 'https://martinfowler.com/articles/practical-test-pyramid.html' }
  ]
},
{
  id: 'autotest-027',
  topic: 'autotest',
  level: 'lead',
  q: 'Đo chất lượng automation test: defect leakage, coverage theo requirement, flaky rate; và cách báo cáo cho quản lý. Ví dụ số liệu.',
  a: `**Tóm tắt:** Để quản lý biết automation test có giá trị, cần theo dõi các chỉ số: defect leakage (tỉ lệ lỗi bị automation bỏ qua, phát hiện sau khi đưa ra production), coverage theo requirement (phần trăm yêu cầu nghiệp vụ có ít nhất một test automation), và flaky rate (tỉ lệ test fail do lỗi test/môi trường). Báo cáo cho quản lý phải đơn giản, có xu hướng theo thời gian, và kèm hành động đề xuất, không chỉ là danh sách pass/fail.

### Defect leakage
Defect leakage = số lỗi được phát hiện trong production (sau release) chia tổng số lỗi (phát hiện trong test + production) × 100%. Ví dụ: trong một tháng, team tìm 40 lỗi trong test và 10 lỗi trong production → leakage = 10 / (40+10) = 20%. Mục tiêu là giảm leakage theo thời gian. Nếu leakage cao, automation không bắt đủ lỗi quan trọng.

### Coverage theo requirement
Khác với code coverage (tỉ lệ dòng code chạy khi test). Coverage theo requirement là phần trăm yêu cầu nghiệp vụ (user story, acceptance criteria) có ít nhất một test automation tương ứng. Ví dụ: 50 yêu cầu, 35 yêu cầu có test automation → coverage 70%. Tập trung vào yêu cầu quan trọng (rủi ro cao, doanh nghiệp).

### Flaky rate
Flaky rate = số lần test fail do lỗi test/môi trường (không do code sản phẩm) chia tổng số lần chạy. Ví dụ: 1000 lần chạy, 30 lần fail do flaky → flaky rate 3%. Mục tiêu là giảm flaky rate xuống dưới 1%.

### Báo cáo cho quản lý
Báo cáo đơn giản, hàng tuần/hàng tháng:
| Chỉ số | Tháng này | Tháng trước | Hành động |
|---|---|---|---|
| Defect leakage | 20% | 25% | Sửa test critical bị bỏ |
| Coverage requirement | 70% | 60% | Thêm test cho 5 yêu cầu mới |
| Flaky rate | 3% | 5% | Sửa 3 test flaky nhất |

Dùng biểu đồ xu hướng (leakage giảm, coverage tăng) thay vì bảng con số đơn lẻ.

### Lỗi hay gặp
- Chỉ báo số lượng test case (ví dụ "có 500 test") mà không nói giá trị.
- Báo code coverage thay vì requirement coverage, quản lý không hiểu ý nghĩa.
- Flaky rate thấp giả tạo vì bật retry toàn bộ suite.

### Trả lời phỏng vấn thế nào
Nêu ba chỉ số, công thức, ví dụ số liệu, và cách báo cáo đơn giản cho quản lý. Giải thích vì sao requirement coverage quan trọng hơn code coverage đối với QA.

> Senior tip: Chỉ số hữu ích là chỉ số dẫn đến hành động. Nếu báo cáo chỉ để lưu trữ, không ai đọc, hãy đơn giản hóa lại hoặc tập trung vào 1-2 chỉ số quan trọng nhất (ví dụ leakage và flaky rate).`,
  follow: [
    'Làm sao thu thập số lỗi production để tính defect leakage chính xác?',
    'Coverage theo requirement 100% có nghĩa automation đủ tốt không, tại sao?',
    'Bạn báo cáo cho quản lý định kỳ bao nhiêu lần, qua kênh nào?'
  ],
  refs: [
    { type: 'doc', title: 'Practical test pyramid', url: 'https://martinfowler.com/articles/practical-test-pyramid.html' },
    { type: 'doc', title: 'Allure Framework', url: 'https://allurereport.org/docs/' },
    { type: 'doc', title: 'Test metrics', url: 'https://martinfowler.com/articles/practical-test-pyramid.html' }
  ]
},
{
  id: 'autotest-028',
  topic: 'autotest',
  level: 'lead',
  q: 'AI trong testing (self-healing locator, sinh test case bằng LLM): lợi ích và rủi ro thật là gì? Bạn sử dụng AI thế nào trong automation một cách thận trọng?',
  a: `**Tóm tắt:** AI trong testing bao gồm self-healing locator (tự sửa lại locator khi giao diện thay đổi) và sinh test case bằng LLM (mô hình ngôn ngữ lớn) từ yêu cầu nghiệp vụ. Lợi ích: viết test nhanh hơn, giảm thời gian sửa locator flaky, giúp QA tập trung vào thiết kế test. Rủi ro: AI có thể sinh test sai nghiệp vụ (hallucination – tạo ra thông tin sai nhưng nghe convincingly), bảo trì code do AI viết khó hiểu, rủi ro bảo mật khi gửi code lên mô hình public, và chi phí gọi AI. Cách dùng thận trọng: AI gợi ý, con người review và chấp nhận trước khi đưa vào repo; không gửi code hoặc dữ liệu nhạy cảm lên AI public.

### Self-healing locator
Khi locator cũ hỏng (ví dụ nút đổi id), self-healing locator tự tìm locator thay thế dựa trên các thuộc tính khác (tên, văn bản, vị trí) và gợi ý cho QA chấp nhận. Giảm thời gian sửa test flaky do UI thay đổi nhẹ.

### Sinh test case bằng LLM
QA cung cấp user story, LLM sinh kịch bản Gherkin hoặc code Java test. Giúp khởi tạo bộ test nhanh, nhất là cho những người mới viết automation. Tuy nhiên, LLM có thể bỏ qua trường hợp cực đoan (edge case) hoặc viết test không khớp quy ước team.

### Rủi ro thật
- **Hallucination:** AI viết test pass trên máy nhưng kiểm tra sai logic nghiệp vụ → defect leakage tăng.
- **Bảo trì:** code do AI sinh thường thiếu comment, cấu trúc kỳ cục, sau này khó sửa.
- **Bảo mật:** gửi code repository, dữ liệu test, hoặc thông tin khách hàng lên AI public có thể rò rỉ.
- **Chi phí:** mỗi lần gọi AI tốn tiền, không nên gọi tự động cho mọi test.

### Cách dùng thận trọng
- AI chỉ gợi ý, con người review và chấp nhận trước khi commit.
- Không gửi mã nguồn chính thức, token, PII lên AI public.
- Dùng AI trong môi trường riêng/doanh nghiệp có chính sách bảo mật nếu có.
- Luôn chạy test sinh bằng AI và verify kết quả trước khi đưa vào suite.

### Lỗi hay gặp
- Chấp nhận test do AI viết mà không kiểm tra → test pass sai.
- Gửi dữ liệu thật của khách hàng vào LLM public → vi phạm bảo mật.
- Dùng AI viết tất cả test, QA không hiểu code → khó bảo trì sau này.

### Trả lời phỏng vấn thế nào
Nêu lợi ích (tốc độ, giảm sửa locator) và rủi ro (hallucination, bảo trì, bảo mật). Giải thích quy trình dùng AI thận trọng (gợi ý → review → verify → commit). Đưa ví dụ bạn từng dùng AI hoặc kế hoạch dùng.

> Senior tip: AI là trợ lý, không phải thay thế QA. Giá trị của QA là tư duy về rủi ro và thiết kế test, thứ AI chưa thể thay thế hoàn toàn. Dùng AI để tăng tốc, không để thay thế sự kiểm tra của con người.`,
  follow: [
    'Làm sao kiểm tra test do AI sinh trước khi đưa vào repo?',
    'Bạn có cho phép gửi code repository lên AI public không, tại sao?',
    'Self-healing locator có thể làm test ít chính xác hơn không, tại sao?'
  ],
  refs: [
    { type: 'doc', title: 'Playwright for Java', url: 'https://playwright.dev/java/' },
    { type: 'doc', title: 'Practical test pyramid', url: 'https://martinfowler.com/articles/practical-test-pyramid.html' },
    { type: 'doc', title: 'Cucumber documentation', url: 'https://cucumber.io/docs/cucumber/' }
  ]
},
{
  id: 'autotest-029',
  topic: 'autotest',
  level: 'lead',
  q: 'Bạn được giao xây dựng QA/automation strategy (chiến lược chất lượng và automation) cho sản phẩm fintech chưa có test. Hãy trình bày lộ trình, nguyên tắc, công cụ và chỉ số đo lường.',
  a: `**Tóm tắt:** QA/automation strategy là kế hoạch tổng thể về chất lượng và kiểm thử tự động cho sản phẩm. Với fintech (tài chính công nghệ) chưa có test, ưu tiên bảo mật, độ chính xác giao dịch tiền, và sẵn sàng theo quy định. Lộ trình: đánh giá rủi ro → xác định luồng critical → xây framework cơ bản → chạy trong CI → mở rộng có chọn lọc. Nguyên tắc: test độc lập, dữ liệu không thật, báo cáo rõ ràng. Công cụ: Java, JUnit 5, Playwright/REST Assured, Allure, GitHub Actions/Jenkins. Chỉ số: defect leakage, flaky rate, feedback time, coverage theo requirement.

### Fintech và rủi ro
Fintech xử lý tiền, dữ liệu khách hàng nhạy cảm, có quy định nghiêm ngặt. Lỗi có thể gây mất tiền, mất uy tín, vi phạm pháp luật. Automation strategy cần ưu tiên luồng thanh toán, tài khoản, và bảo mật.

### Lộ trình xây dựng (3-6 tháng)
Tháng 1: Đánh giá rủi ro, chọn 5-10 luồng critical (đăng nhập, xem số dư, chuyển tiền, thanh toán). Viết REST Assured cho API critical.
Tháng 2: Xây framework Playwright cơ bản (Page Object, wait, locator bền). Test UI cho luồng critical.
Tháng 3: Tích hợp CI (GitHub Actions/Jenkins), Allure báo cáo, chạy headless.
Tháng 4-6: Mở rộng test song song, contract testing cho microservices, đào tạo team, định nghĩa chỉ số.

### Nguyên tắc
- Test độc lập, không chia sẻ dữ liệu.
- Không dùng dữ liệu khách hàng thật trong test.
- Mỗi test có assert rõ ràng, báo cáo khi fail.

### Công cụ đề xuất
- Ngôn ngữ: Java (team đã biết).
- Test runner: JUnit 5.
- API automation: REST Assured.
- UI automation: Playwright (ít flaky, trace tốt) hoặc Selenium nếu hệ thống cũ.
- Báo cáo: Allure.
- CI: GitHub Actions hoặc Jenkins.

### Chỉ số đo lường
- Defect leakage: lỗi lọt production / tổng lỗi.
- Flaky rate: test fail do lỗi test / tổng chạy.
- Feedback time: thời gian từ khi dev gửi mã đến khi biết kết quả test.
- Coverage theo requirement: % yêu cầu quan trọng có test.

### Lỗi hay gặp
- Xây framework khổng lồ trước khi có test đầu tiên.
- Dùng dữ liệu thật hoặc thẻ thanh toán thật trong test.
- Chỉ đo số lượng test case, không đo giá trị.

### Trả lời phỏng vấn thế nào
Nêu lộ trình từng tháng, nguyên tắc, công cụ, và chỉ số. Giải thích vì sao fintech ưu tiên bảo mật và độ chính xác. Đưa ví dụ về quy trình bạn từng áp dụng hoặc sẽ áp dụng.

> Senior tip: Strategy không phải tài liệu cắm vào kệ mà phải thể hiện qua pipeline chạy mỗi ngày. Bắt đầu nhỏ với luồng critical, cho chạy ổn định trong CI, sau đó mới mở rộng. Quản lý quan tâm vào rủi ro giảm được, không phải số test case.`,
  follow: [
    'Trong 3 tháng đầu, bạn ưu tiên test luồng nào trong fintech, tại sao?',
    'Làm sao thuyết phục quản lý đầu tư automation khi sản phẩm chưa có test?',
    'Bạn định nghĩa "độ chính xác giao dịch" và kiểm tra ra sao trong automation?'
  ],
  refs: [
    { type: 'doc', title: 'Practical test pyramid', url: 'https://martinfowler.com/articles/practical-test-pyramid.html' },
    { type: 'doc', title: 'Playwright for Java', url: 'https://playwright.dev/java/' },
    { type: 'doc', title: 'GitHub Actions', url: 'https://docs.github.com/en/actions' }
  ]
},
{
  id: 'autotest-030',
  topic: 'autotest',
  level: 'lead',
  q: 'Bạn phỏng vấn ứng viên SDET: bạn hỏi gì, bài tập gì để đánh giá, và tiêu chí chọn người ra sao?',
  a: `**Tóm tắt:** Phỏng vấn tuyển SDET (Software Development Engineer in Test – kỹ sư dùng code để xây automation và công cụ chất lượng) cần đánh giá cả tư duy kiểm thử và khả năng lập trình. Hỏi về kinh nghiệm xây framework, xử lý flaky, thiết kế test cho luồng critical, cách tách dữ liệu giữa test. Bài tập: viết automation nhỏ (API hoặc UI) từ yêu cầu, code review một test flaky, hoặc thiết kế Page Object cho mô tả trang. Tiêu chí: code sạch, tư duy test (rủi ro, edge case), hiểu wait/locator/data isolation, và giao tiếp rõ ràng. Tránh chỉ hỏi công cụ hoặc bài tập quá dài làm ứng viên mệt.

### Câu hỏi phỏng vấn
- "Hãy mô tả một lần bạn xử lý test flaky. Bạn định lượng và sửa gốc ra sao?"
- "Thiết kế automation cho luồng thanh toán: bạn chọn API hay UI trước, tại sao?"
- "Làm sao đảm bảo các test chạy song song không va chạm dữ liệu?"
- "Bạn viết Page Object như thế nào để tránh assert trong page?"

### Bài tập đề xuất
1. **Viết automation nhỏ:** Yêu cầu mô tả trang đăng ký, ứng viên viết test API (REST Assured) hoặc UI (Playwright) kiểm tra đăng ký thành công và lỗi (email trùng). Đánh giá code sạch, assert, locator.
2. **Code review test flaky:** Cho một test fail ngẫu nhiên, ứng viên chỉ ra nguyên nhân (sleep cứng, dữ liệu chia sẻ) và cách sửa.
3. **Thiết kế Page Object:** Cho mô tả trang, ứng viên vẽ/lớp lớp Page Object tách locator và hành động.

### Tiêu chí chọn người
| Tiêu chí | Mô tả |
|---|---|
| Tư duy test | Nhận diện rủi ro, edge case, không chỉ test đường chính xác |
| Code sạch | Đặt tên rõ, tách lớp, không lặp code |
| Automation tool | Hiểu wait, locator, POM, API test |
| Data isolation | Biết tách dữ liệu, không chia sẻ trạng thái test |
| Giao tiếp | Giải thích lý do chọn công cụ, bản lỗi cho dev hiểu |

### Lỗi khi tuyển SDET
- Chỉ hỏi công cụ (Selenium hay Playwright) không hỏi tư duy test.
- Bài tập quá dài (4 giờ) làm ứng viên chọn tốt thoát.
- Không đánh giá khả năng làm việc với dev/PO (SDET cần giao tiếp nhiều).

### Trả lời phỏng vấn thế nào
Nêu cách bạn thiết lập phỏng vấn (câu hỏi, bài tập, tiêu chí) và lý do từng phần. Đưa ví dụ nếu bạn từng phỏng vấn hoặc được phỏng vấn vị trí SDET.

> Senior tip: SDET tốt không phải người viết nhiều script nhất, mà là người giúp team giảm rủi ro phát hành bằng code chất lượng. Tuy chọn người có tư duy test và khả năng hợp tác, không chỉ biết chạy công cụ.`,
  follow: [
    'Bạn đánh giá code sạch của ứng viên dựa trên tiêu chí nào trong bài tập?',
    'Làm sao bạn biết ứng viên có tư duy test, không chỉ biết viết code?',
    'Bài tập phỏng vấn nên bao lâu và đánh giá điểm gì trên code ứng viên nộp?'
  ],
  refs: [
    { type: 'doc', title: 'Playwright for Java', url: 'https://playwright.dev/java/' },
    { type: 'doc', title: 'Practical test pyramid', url: 'https://martinfowler.com/articles/practical-test-pyramid.html' },
    { type: 'doc', title: 'Selenium documentation', url: 'https://www.selenium.dev/documentation/' }
  ]
},

{
  id: 'autotest-031',
  topic: 'autotest',
  level: 'senior',
  q: 'Playwright for Java chạy bên trong như thế nào: từ code test Java đến trình duyệt thực sự đi qua những lớp nào (Playwright client, driver Node.js, Chromium/Firefox/WebKit)? BrowserContext là gì, vì sao cô lập tốt, và vì sao Playwright thường nhanh và ít flaky hơn Selenium WebDriver?',
  a: `**Tóm tắt:** **Playwright for Java** không nói chuyện trực tiếp với trình duyệt bằng HTTP như Selenium WebDriver. Code Java gọi **Playwright client** (thư viện {{com.microsoft.playwright}}) → client khởi chạy và giao tiếp với một **driver Node.js** (process đi kèm Playwright) → driver dùng **giao thức gốc của từng engine trình duyệt** (Chrome DevTools Protocol cho Chromium, giao thức riêng cho Firefox/WebKit) để điều khiển **Chromium/Firefox/WebKit** thật. **Browser** là tiến trình trình duyệt; **BrowserContext** là một "hồ sơ duyệt" cô lập (cookie, localStorage, cache, session) bên trong cùng Browser. Playwright thường nhanh/ít flaky vì chờ theo **actionability** (tự đợi phần tử sẵn sàng tương tác) và giữ kênh điều khiển gọn, nhưng flaky nghiệp vụ (dữ liệu, race API) vẫn có thể xảy ra.

### Vì sao cần hiểu kiến trúc bên trong
Khi test chậm, treo, hoặc "lúc pass lúc fail" (**flaky**: kết quả không ổn định dù code không đổi), bạn phải biết lỗi nằm ở lớp nào: code test, client, driver, trình duyệt, hay ứng dụng. Hiểu đường đi của lệnh cũng giúp giải thích vì sao Playwright và Selenium (xem {{autotest-002}}, {{autotest-003}}) hành xử khác nhau.

### Các lớp tham gia (từ trên xuống)
~~~text
[Test Java (JUnit 5)]
        |
        v  (gọi API: page.click, locator.fill, assertThat...)
[Playwright client - com.microsoft.playwright]
        |
        v  (pipe / WebSocket nội bộ tới process Node)
[Playwright driver (Node.js, đi kèm gói Playwright)]
        |
        v  (giao thức gốc browser: CDP cho Chromium, ...)
[Browser engine: Chromium | Firefox | WebKit]
        |
        v
[Trang web thật: DOM, JS, network, render]
~~~

~~~seq
title: Luồng một hành động Playwright (click)
actors: Test Java | Playwright Client | Driver Node | Browser
Test Java -> Playwright Client: page.getByTestId("login").click()
Playwright Client -> Driver Node: gửi lệnh click + selector
Driver Node -> Browser: kiểm tra actionability rồi click native
Browser --> Driver Node: sự kiện hoàn tất / lỗi
Driver Node --> Playwright Client: kết quả
Playwright Client --> Test Java: tiếp tục hoặc ném exception
~~~

- **Playwright client (Java)**: lớp bạn dùng trong code ({{Playwright}}, {{Browser}}, {{BrowserContext}}, {{Page}}, {{Locator}}). Nó tuần tự hoá lệnh và nhận kết quả.
- **Driver Node.js**: một tiến trình Node chạy nền do Playwright quản lý. Node.js ở đây là **runtime JavaScript** (môi trường chạy JS ngoài trình duyệt) – bạn không cần viết JS, nhưng máy chạy test cần môi trường tương thích mà gói Playwright cung cấp.
- **Giao thức gốc**: thay vì chuẩn HTTP chung như W3C WebDriver, driver nói "ngôn ngữ" tối ưu của engine. Với Chromium thường là **CDP** (Chrome DevTools Protocol – giao thức DevTools dùng để inspect/điều khiển). Cách này cho phép quan sát/điều khiển chi tiết (network, trace) hiệu quả.
- **Browser engine**: Chromium (nền tảng Chrome/Edge), Firefox, WebKit (nền tảng Safari). Playwright tải bản browser tương thích khi cài (hoặc dùng browser hệ thống tuỳ cấu hình).

### Browser, BrowserContext, Page – phân biệt rõ
| Khái niệm | Là gì (ví dụ đời thường) | Dữ liệu | Chi phí tạo |
|---|---|---|---|
| {{Browser}} | Ứng dụng trình duyệt đang chạy (mở Chrome) | Chia sẻ process engine | Tương đối nặng, nên dùng chung cho cả suite khi được |
| {{BrowserContext}} | Một "cửa sổ riêng tư" cô lập (cookie/storage tách biệt) | Cookie, localStorage, session, permission riêng | Nhẹ hơn Browser, tạo mới mỗi test rất hợp lý |
| {{Page}} | Một tab trong context | DOM của tab đó | Nhẹ |

~~~java
import com.microsoft.playwright.*;

public class Demo {
  public static void main(String[] args) {
    try (Playwright pw = Playwright.create()) {
      // Browser dùng chung (ví dụ @BeforeAll) - nặng, tạo 1 lần
      Browser browser = pw.chromium().launch(new BrowserType.LaunchOptions().setHeadless(true));
      // Context cô lập mỗi test - cookie/storage sạch
      BrowserContext context = browser.newContext();
      Page page = context.newPage();
      page.navigate("https://example.test/login");
      // ... thao tác và assert ...
      context.close(); // dọn context
      browser.close();
    }
  }
}
~~~

### Vì sao BrowserContext giúp ít flaky hơn
- **Cô lập trạng thái**: test A đăng nhập không để cookie/login rơi sang test B. Nhiều lỗi flaky đến từ "test phụ thuộc thứ tự" vì dùng chung profile.
- **Song song an toàn hơn**: mỗi worker có context riêng, giảm tranh chấp.
- So với Selenium: WebDriver thường gắn với một session trình duyệt; muốn cô lập sạch phải tạo session mới (tốn) hoặc tự xóa cookie/storage (dễ sót).

### Vì sao thường nhanh và ít flaky hơn Selenium (và giới hạn)
- **Auto-wait/actionability**: trước khi click/fill, Playwright chờ phần tử hiện, ổn định, nhận sự kiện (xem {{autotest-032}}) → giảm lỗi "chưa kịp render". Selenium truyền thống cần explicit wait thủ công ({{autotest-005}}).
- **Kênh điều khiển gọn**: giao thức gốc + driver quản lý tập trung giúp thao tác nhất quán.
- **Vẫn có thể flaky**: API backend chậm, dữ liệu test thay đổi, animation/layout shift, đồng hồ/múi giờ. Playwright **không** tự sửa test sai nghiệp vụ.

### Lỗi hay gặp
- Tạo {{Browser}} mới cho mỗi test → suite chậm; nên dùng chung Browser, tạo {{BrowserContext}}/ {{Page}} mỗi test.
- Quên {{close()}} context/page/browser → rò rỉ process, CI treo.
- Nghĩ "Playwright không cần chờ gì" → bỏ qua {{waitForResponse}}/{{waitForURL}} khi nghiệp vụ phụ thuộc mạng (xem {{autotest-032}}).
- Chạy headless trên CI khác headful local (font, viewport) → khác biệt nhỏ; hãy cố định viewport và dùng trace khi fail ({{autotest-035}}).

### Trả lời phỏng vấn thế nào
Nói rõ chuỗi: "Java test → Playwright client → driver Node → giao thức gốc (CDP/engine) → Chromium/Firefox/WebKit". Phân biệt {{Browser/BrowserContext/Page}} và nêu chiến lược: dùng chung Browser, **mỗi test một Context** để cô lập. So sánh ngắn với Selenium (HTTP W3C + driver binary, {{autotest-002}}) và nhấn mạnh auto-wait giúp giảm flaky timing, nhưng dữ liệu/điều kiện nghiệp vụ vẫn phải kiểm soát.

> Senior tip: Đừng tối ưu bằng cách dùng chung một {{BrowserContext}} cho cả suite để "tiết kiệm thời gian" – bạn sẽ mua lại thời gian đó gấp nhiều lần để săn bug do rò rỉ trạng thái giữa các test. Cô lập (context sạch) + trace khi fail là nền tảng ổn định trên CI.`,
  follow: [
    'Khi nào bạn chọn dùng chung Browser nhưng tạo mới BrowserContext, và khi nào cần nhiều Browser?',
    'Playwright dùng CDP cho Chromium – điều đó có nghĩa gì với Firefox/WebKit và cross-browser testing?',
    'Một test Playwright vẫn flaky dù có auto-wait: bạn khoanh vùng theo lớp kiến trúc nào?'
  ],
  refs: [
    { type: 'doc', title: 'Playwright for Java - Introduction', url: 'https://playwright.dev/java/docs/intro' },
    { type: 'doc', title: 'BrowserContexts (Playwright Java)', url: 'https://playwright.dev/java/docs/browser-contexts' },
    { type: 'doc', title: 'Browsers (Playwright Java)', url: 'https://playwright.dev/java/docs/browsers' }
  ]
},

{
  id: 'autotest-032',
  topic: 'autotest',
  level: 'senior',
  q: 'Playwright auto-wait, actionability checks và web-first assertions ({{assertThat(locator)}} tự retry) hoạt động thế nào? Timeout cấu hình ra sao, vì sao gần như không cần explicit wait, và khi nào vẫn cần {{waitForResponse}}/{{waitForURL}}?',
  a: `**Tóm tắt:** Playwright **auto-wait** (tự chờ) trước khi thao tác: {{click()}}, {{fill()}}, {{check()}}… chỉ thực hiện khi phần tử đạt **actionability** (có thể tương tác: gắn DOM, hiện, ổn định, nhận sự kiện, enabled…). **Web-first assertions** như {{assertThat(locator).hasText(...)/isVisible()}} thuộc {{PlaywrightAssertions}} **tự thử lại (retry)** đến khi điều kiện đúng hoặc hết timeout, thay vì đọc giá trị một lần rồi so sánh. Timeout có thể đặt toàn cục ({{setDefaultTimeout}}), cho assertion ({{setDefaultAssertionTimeout}}), hoặc từng thao tác. Nhờ vậy **gần như không cần explicit wait** kiểu "tìm rồi sleep/đợi tay" như Selenium ({{autotest-005}}), nhưng vẫn cần {{waitForResponse}}/{{waitForURL}}/{{waitForCondition}} khi bạn phải đồng bộ với **sự kiện nghiệp vụ/mạng** mà actionability không đại diện.

### Auto-wait là gì (giải thích từ gốc)
Trang web tải và render **bất đồng bộ** (async – việc xảy ra không theo thứ tự ngay lập tức): JS thêm nút sau 500ms, animation làm nút di chuyển, API trả dữ liệu rồi mới hiện bảng. Nếu tool bấm ngay lúc nút chưa sẵn sàng → fail. **Auto-wait** nghĩa là công cụ tự đợi đến khi thao tác an toàn, trong giới hạn thời gian (**timeout** – quá hạn thì báo lỗi).

### Actionability checks (kiểm tra "tương tác được")
Trước các hành động như {{click}}, Playwright kiểm tra (tuỳ action) các điều kiểu: phần tử **attached** (còn trong DOM), **visible** (hiện), **stable** (không đang chuyển động/animation gây lệch điểm click), **receives events** (không bị lớp khác che), **enabled** (không bị disabled), và với {{fill}} thì **editable**. Bạn không phải tự gọi chuỗi wait; hành động gộp kiểm tra + thực thi.

~~~java
import com.microsoft.playwright.*;
import static com.microsoft.playwright.assertions.PlaywrightAssertions.assertThat;

Page page = context.newPage();
page.navigate("https://shop.test");
// Không cần Thread.sleep: click tự chờ nút actionable
page.getByTestId("add-to-cart").click();
// fill tự chờ input editable
page.getByLabel("Email").fill("a@b.test");
~~~

### Web-first assertions vs assert thường
- **Assert thường** (kiểu JUnit {{assertEquals(text, "Xin chào")}}): bạn lấy text **một lần**; nếu UI cập nhật 200ms sau, test fail dù đúng – phải tự chờ.
- **Web-first assertion** ({{assertThat(locator)...}}): Playwright **lặp đọc/trial** cho đến khi khớp hoặc timeout. Nó "bám" theo DOM đang đổi.

~~~java
// Web-first: tự retry đến khi text đúng (mặc định ~5s cho assertion)
assertThat(page.getByTestId("status")).hasText("Đã thanh toán");
assertThat(page.getByRole(AriaRole.HEADING,
    new Page.GetByRoleOptions().setName("Giỏ hàng"))).isVisible();

// Cấu hình timeout assertion riêng (ms)
assertThat(page.getByTestId("slow-banner"))
    .isVisible(new LocatorAssertions.IsVisibleOptions().setTimeout(15000));
~~~

### Timeout: các mức cấu hình
| Mức | Cách đặt (ý tưởng) | Áp dụng |
|---|---|---|
| Mặc định hành động/điều hướng | {{page.setDefaultTimeout(ms)}} hoặc {{context.setDefaultTimeout(ms)}} | click/fill/waitForSelector… |
| Mặc định assertion | {{PlaywrightAssertions.setDefaultAssertionTimeout(ms)}} | {{assertThat(...)}} |
| Từng lời gọi | tuỳ chọn {{.setTimeout(...)}} trên action/assert/waitFor | Ca đặc biệt chậm |

~~~java
// Ví dụ: tăng timeout cho trang staging chậm
page.setDefaultTimeout(30_000);
PlaywrightAssertions.setDefaultAssertionTimeout(10_000);
~~~

### Vì sao gần như không cần explicit wait (so với Selenium)
Selenium thường: {{findElement}} + {{WebDriverWait.until(clickable/visible)}} + đôi khi {{Thread.sleep}} (xấu) để né race ({{autotest-005}}). Playwright gộp chờ vào **action** và **assertion**. Bạn vẫn viết ý định ("bấm nút này", "thấy chữ này"), không viết "chờ 3 giây".

### Khi nào VẪN cần {{waitForResponse}}/{{waitForURL}}/chờ nghiệp vụ
Actionability chỉ biết phần tử "bấm được"; nó **không** biết nghiệp vụ của bạn xong chưa.
- **{{page.waitForResponse(...)}}**: chờ một HTTP response khớp (URL/matcher) – dùng khi UI đổi sau khi API lưu đơn hàng trả 200.
- **{{page.waitForURL(...)}}**: chờ điều hướng sang URL/pattern (sau login redirect).
- **{{waitForCondition}}** / chờ locator trạng thái: điều kiện tuỳ chỉnh.

~~~java
// Chờ API tạo đơn hoàn tất rồi mới assert trang kết quả
Response resp = page.waitForResponse(
    r -> r.url().contains("/api/orders") && r.request().method().equals("POST"),
    () -> page.getByTestId("submit-order").click()); // chạy action trong lambda
if (resp.status() != 201) throw new AssertionError("Tạo đơn thất bại: " + resp.status());
page.waitForURL("**/orders/*/success");
assertThat(page.getByTestId("order-id")).isVisible();
~~~

### Lỗi hay gặp
- Dùng {{Thread.sleep}} "cho chắc" → test chậm và vẫn flaky; hãy dùng assertion/waitFor có điều kiện.
- Đặt timeout quá lớn toàn cục → test fail thật nhưng chờ rất lâu mới báo.
- Assert bằng {{page.locator(...).textContent()}} (đọc 1 lần) thay vì {{assertThat(...).hasText(...)}} → tự mất lợi ích retry.
- Quên rằng {{toBeVisible}} khác "có trong DOM": phần tử có thể tồn tại nhưng ẩn.

### Trả lời phỏng vấn thế nào
Giải thích 3 ý: (1) action chờ **actionability**, (2) {{assertThat}} **retry** (web-first), (3) timeout cấu hình nhiều mức. Nêu rõ "gần như không cần explicit wait" nhưng **vẫn cần** chờ response/URL cho điều kiện nghiệp vụ – và cho ví dụ {{waitForResponse}} bọc quanh click submit (so sánh với Selenium {{autotest-005}}).

> Senior tip: Khi viết test, hãy hỏi: "Tôi đang chờ **UI tương tác được** hay chờ **nghiệp vụ hoàn tất**?" Cái đầu để Playwright auto-wait lo; cái sau phải chờ đúng tín hiệu (response, URL, trạng thái dữ liệu) – đừng trộn hai thứ bằng một cái sleep.`,
  follow: [
    'Sự khác nhau giữa {{assertThat(locator).isVisible()}} và kiểm tra {{locator.isVisible()}} trả boolean là gì?',
    'Làm sao chọn matcher {{waitForResponse}} để không khớp nhầm request (polling, analytics)?',
    'Khi một action bị timeout, bạn dùng trace/screenshot thế nào để biết phần tử đang ở trạng thái nào?'
  ],
  refs: [
    { type: 'doc', title: 'Auto-waiting (Playwright Java)', url: 'https://playwright.dev/java/docs/actionability' },
    { type: 'doc', title: 'Assertions (Playwright Java)', url: 'https://playwright.dev/java/docs/test-assertions' },
    { type: 'doc', title: 'Page.waitForResponse (Playwright Java API)', url: 'https://playwright.dev/java/docs/api/class-page#page-wait-for-response' }
  ]
}
,

{
  id: 'autotest-033',
  topic: 'autotest',
  level: 'senior',
  q: 'Tổ chức test Playwright for Java với JUnit 5 như thế nào: dùng chung Browser, tạo mới BrowserContext/Page mỗi test (extension/fixture), viết Page Object với Locator, và dùng {{storageState}} để tái sử dụng trạng thái đăng nhập?',
  a: `**Tóm tắt:** Cấu trúc gọn: **{{Playwright}} + {{Browser}}** dùng chung (khởi tạo nặng, tạo một lần cho suite), còn **{{BrowserContext}} + {{Page}}** tạo mới **mỗi test** để cô lập ({{autotest-031}}). Với JUnit 5, đóng gói vòng đời này bằng **{{@BeforeAll/@AfterAll}}** (hoặc {{Extension}}) và **{{@BeforeEach/@AfterEach}}**; có thể dùng extension cộng đồng (ví dụ {{microsoft/playwright-junit}}) như "fixture" có sẵn. **Page Object** (POM, {{autotest-006}}) giữ {{Locator}} và hành động, test chỉ gọi nghiệp vụ và assert bằng web-first assertions. **{{storageState}}** lưu cookie/localStorage sau khi đăng nhập một lần và nạp vào context mới → bỏ qua bước login lặp lại, nhanh và bớt flaky.

### Mục tiêu tổ chức
- Test **độc lập**, chạy song song được (một ca fail không do "vết" ca khác).
- Chi phí hợp lý: không mở browser mới mỗi test, nhưng vẫn cô lập trạng thái.
- Code dễ bảo trì: UI đổi thì sửa Page Object, không sửa hàng chục test.

### Vòng đời đề xuất (JUnit 5)
~~~java
import com.microsoft.playwright.*;
import org.junit.jupiter.api.*;
import static com.microsoft.playwright.assertions.PlaywrightAssertions.assertThat;

@TestInstance(TestInstance.Lifecycle.PER_CLASS) // cho phép @BeforeAll không static
class CheckoutTests {
  Playwright pw;
  Browser browser;

  @BeforeAll
  void launch() {
    pw = Playwright.create();
    browser = pw.chromium().launch(new BrowserType.LaunchOptions().setHeadless(true));
  }

  BrowserContext context;
  Page page;

  @BeforeEach
  void createContext(TestInfo info) {
    // Mỗi test một context sạch; có thể set viewport/locale chung
    context = browser.newContext(new Browser.NewContextOptions()
        .setViewportSize(1280, 720));
    page = context.newPage();
  }

  @AfterEach
  void closeContext() {
    if (context != null) context.close(); // xóa cookie/storage của test
  }

  @AfterAll
  void closeAll() {
    if (browser != null) browser.close();
    if (pw != null) pw.close();
  }

  @Test
  void addItem_showsInCart() {
    page.navigate("https://shop.test");
    page.getByTestId("add-sku-1").click();
    assertThat(page.getByTestId("cart-count")).hasText("1");
  }
}
~~~
- **Fixture** (khái niệm chung): phần "chuẩn bị/dọn dẹp" dùng lại cho test. Ở đây {{createContext/closeContext}} là fixture mỗi test.

### Page Object với {{Locator}}
{{Locator}} là đối tượng đại diện cách tìm phần tử (lazy, tự auto-wait khi dùng) – phù hợp làm field của Page Object. Tránh nhét {{assert}} vào Page Object; trả dữ liệu hoặc trả Page Object tiếp theo, để test quyết định kiểm tra.

~~~java
class LoginPage {
  private final Page page;
  private final Locator user;
  private final Locator pass;
  private final Locator submit;

  LoginPage(Page page) {
    this.page = page;
    this.user = page.getByTestId("username");
    this.pass = page.getByTestId("password");
    this.submit = page.getByRole(AriaRole.BUTTON,
        new Page.GetByRoleOptions().setName("Đăng nhập"));
  }

  HomePage loginAs(String u, String p) {
    user.fill(u);
    pass.fill(p);
    submit.click();
    page.waitForURL("**/home"); // chờ điều hướng nghiệp vụ
    return new HomePage(page);
  }
}

// Test: gọi hành động, assert ở test
@Test
void login_ok() {
  page.navigate("https://shop.test/login");
  HomePage home = new LoginPage(page).loginAs("alice", "secret");
  assertThat(home.welcomeBanner()).containsText("alice");
}
~~~

### {{storageState}}: tái dùng đăng nhập
Đăng nhập UI mỗi test vừa chậm vừa hay flaky (CAPTCHA, rate limit, phụ thuộc IdP). **{{storageState}}** là "ảnh chụp" trạng thái xác thực (cookie + localStorage origin) lưu ra file JSON, sau đó nạp vào context mới.

~~~java
// BƯỚC 1: chạy một lần (setup) để tạo file trạng thái đăng nhập
void saveAuthState() {
  BrowserContext ctx = browser.newContext();
  Page p = ctx.newPage();
  p.navigate("https://shop.test/login");
  p.getByTestId("username").fill("alice");
  p.getByTestId("password").fill("secret");
  p.getByTestId("login-submit").click();
  p.waitForURL("**/home");
  // Lưu cookie/localStorage đã đăng nhập
  ctx.storageState(new BrowserContext.StorageStateOptions()
      .setPath(java.nio.file.Paths.get("auth.json")));
  ctx.close();
}

// BƯỚC 2: mỗi test nạp state -> đã đăng nhập sẵn
@BeforeEach
void createAuthedContext() {
  context = browser.newContext(new Browser.NewContextOptions()
      .setStorageStatePath(java.nio.file.Paths.get("auth.json")));
  page = context.newPage();
}
~~~

~~~seq
title: Tái dùng đăng nhập bằng storageState
actors: Setup | Auth File | Test Context | App
Setup -> App: login UI một lần
App --> Setup: session cookie
Setup -> Auth File: lưu storageState (auth.json)
Test Context -> Auth File: nạp state khi newContext
Test Context -> App: vào thẳng trang cần auth
~~~

### Lỗi hay gặp
- Dùng chung {{Page}}/Context giữa test → test ảnh hưởng nhau (rò rỉ login, giỏ hàng).
- {{storageState}} hết hạn (token timeout) → test fail hàng loạt; tạo lại state trong bước setup CI hoặc rút ngắn tuổi state.
- Nhét logic chờ/assert phức tạp vào Page Object → khó đọc; giữ Page Object là "bản đồ + hành động".
- Locator theo CSS giòn thay vì {{getByTestId/getByRole}} ổn định ({{autotest-004}} vẫn áp dụng).

### Trả lời phỏng vấn thế nào
Nêu rõ vòng đời: {{Browser}} chung, **Context/Page mỗi test** (JUnit 5 {{@BeforeEach/@AfterEach}} hoặc extension). Trình bày POM dùng {{Locator}} (liên hệ {{autotest-006}}) và lợi ích bảo trì. Giải thích {{storageState}} như "đăng nhập một lần, nạp phiên" để tăng tốc và giảm flaky – kèm lưu ý token hết hạn.

> Senior tip: Hãy coi "đăng nhập" là **precondition** (điều kiện tiên quyết) của test nghiệp vụ, không phải thứ phải kiểm tra lại ở mọi ca. Dùng {{storageState}} (hoặc seed phiên qua API) cho phần lớn test; chỉ giữ một ít test E2E đi qua đúng luồng login UI để vẫn phủ hành vi xác thực.`,
  follow: [
    'Khi nào nên seed phiên đăng nhập bằng API thay vì lưu {{storageState}} từ UI?',
    'Bạn cấu trúc BaseTest/Extension thế nào để thêm trace và screenshot khi test fail (liên hệ {{autotest-035}})?',
    'Page Object nên chia theo trang hay theo component (header, modal) trong app SPA?'
  ],
  refs: [
    { type: 'doc', title: 'Authentication (Playwright Java)', url: 'https://playwright.dev/java/docs/auth' },
    { type: 'doc', title: 'JUnit integration (Playwright Java)', url: 'https://playwright.dev/java/docs/test-runners' },
    { type: 'doc', title: 'Page object models (Playwright)', url: 'https://playwright.dev/java/docs/pom' }
  ]
},

{
  id: 'autotest-034',
  topic: 'autotest',
  level: 'senior',
  q: 'Trong Playwright for Java, bạn xử lý iframe ({{frameLocator}}), popup/tab mới ({{waitForPopup}}), download ({{waitForDownload}}), upload ({{setInputFiles}}), dialog, và network interception ({{page.route}}) để mock backend như thế nào?',
  a: `**Tóm tắt:** Web thật có nhiều tình huống "khó hơn click nút trên một trang": nội dung nhúng trong **iframe** (trang trong trang), mở **popup/tab mới**, tải **file xuống/lên**, hộp thoại native (**dialog** {{alert/confirm/prompt}}), và phụ thuộc **API chậm/lỗi**. Playwright for Java có API chuyên biệt: {{frameLocator()}} để thao tác trong iframe (tự chờ), {{page.waitForPopup()}} để bắt tab/cửa sổ mới, {{page.waitForDownload()}} + {{download.saveAs()}}, {{locator.setInputFiles()}} cho upload, {{page.onDialog()}} để xử lý dialog, và **{{page.route()}}** để chặn/sửa/mock request mạng. Dùng đúng công cụ giúp test ổn định và (khi mock hợp lý) giảm phụ thuộc môi trường.

### 1) iframe: dùng {{frameLocator}}
**iframe** (inline frame) là một tài liệu HTML nhúng trong trang cha – DOM bên trong tách biệt, {{page.locator}} thường không nhìn xuyên. {{frameLocator}} trỏ vào frame rồi tìm phần tử bên trong, vẫn hưởng auto-wait.

~~~java
// Trang cha có <iframe id="pay-frame" ...> chứa nút xác nhận
FrameLocator pay = page.frameLocator("#pay-frame");
pay.getByTestId("confirm-pay").click();
assertThat(pay.getByText("Thành công")).isVisible();
~~~
Pitfall: selector trỏ nhầm frame (nhiều iframe lồng nhau) → phải đi từng lớp {{frameLocator}}.

### 2) Popup / tab mới: {{waitForPopup}}
Click có thể mở cửa sổ/tab mới ({{window.open}} hoặc {{target=_blank}}). Bắt đối tượng {{Page}} mới bằng cách chờ popup **đồng thời** với hành động mở.

~~~java
Page popup = page.waitForPopup(() -> {
  page.getByRole(AriaRole.LINK,
      new Page.GetByRoleOptions().setName("Mở biên lai")).click();
});
popup.waitForLoadState();
assertThat(popup).hasURL(java.util.regex.Pattern.compile(".*receipt.*"));
popup.close();
~~~

~~~seq
title: Bắt popup khi click link
actors: Test | Page chính | Popup Page | Browser
Test -> Page chính: click "Mở biên lai"
Page chính -> Browser: window.open / tab mới
Browser --> Popup Page: tạo Page mới
Test -> Popup Page: waitForPopup nhận Page, assert URL
~~~

### 3) Download: {{waitForDownload}}
Bắt sự kiện tải file do hành động kích hoạt; lưu ra đường dẫn để kiểm tra (tên, tồn tại). Trên CI cần quyền ghi thư mục.

~~~java
Download download = page.waitForDownload(() -> page.getByTestId("export-csv").click());
String suggested = download.suggestedFilename();
download.saveAs(java.nio.file.Paths.get("build/test-downloads/" + suggested));
// Có thể assert file tồn tại / kích thước > 0
~~~

### 4) Upload: {{setInputFiles}}
Với {{<input type="file">}}, set đường dẫn file (hoặc payload). Không cần mở hộp thoại OS – Playwright thao tác trực tiếp input.

~~~java
page.getByTestId("avatar-upload").setInputFiles(
    java.nio.file.Paths.get("src/test/resources/avatar.png"));
assertThat(page.getByTestId("upload-ok")).isVisible();
~~~

### 5) Dialog: {{page.onDialog}}
**Dialog** native ({{alert}}, {{confirm}}, {{prompt}}) chặn trang nếu không xử lý. Đăng ký handler **trước** hành động gây dialog.

~~~java
page.onceDialog(dialog -> {
  // dialog.type(), dialog.message() để assert nếu cần
  dialog.accept("Lý do huỷ"); // hoặc dialog.dismiss()
});
page.getByTestId("delete-btn").click();
~~~

### 6) Network interception / mock backend: {{page.route}}
{{page.route(urlPattern, handler)}} chặn request khớp để: trả response giả (mock), sửa header/body, hoặc {{route.abort()}}. Hữu ích khi backend chưa sẵn sàng, muốn test lỗi 500, hoặc cô lập UI. **Cẩn trọng**: mock quá nhiều → test không còn là E2E thật.

~~~java
// Mock API danh sách sản phẩm trả về JSON cố định
page.route("**/api/products", route -> {
  String body = "[{\"id\":1,\"name\":\"SKU-1\"}]";
  route.fulfill(new Route.FulfillOptions()
      .setStatus(200)
      .setContentType("application/json")
      .setBody(body));
});
page.navigate("https://shop.test/products");
assertThat(page.getByText("SKU-1")).isVisible();
~~~

| Tình huống | API chính | Ghi nhớ |
|---|---|---|
| iframe | {{frameLocator}} | DOM tách biệt; có thể lồng |
| tab/popup mới | {{waitForPopup}} | Chờ đồng thời với click mở |
| download | {{waitForDownload}} | Lưu file, kiểm tra tồn tại |
| upload | {{setInputFiles}} | Gán thẳng input file |
| alert/confirm/prompt | {{onDialog}}/{{onceDialog}} | Đăng ký trước khi trigger |
| mock/chặn mạng | {{page.route}} | Chỉ mock khi có chủ đích |

### Lỗi hay gặp
- Tìm phần tử trong iframe bằng {{page.locator}} → không thấy; phải {{frameLocator}}.
- Gọi {{waitForPopup}} sau khi click xong → có thể lỡ event; luôn bọc action trong lambda của {{waitForPopup}}.
- {{route}} pattern quá rộng ({{**/*}}) → chặn luôn CSS/JS/font, trang vỡ.
- Quên {{removeRoute}}/dùng {{onceDialog}} không đúng ngữ cảnh → ảnh hưởng test sau nếu dùng chung context (tránh bằng context mỗi test).

### Trả lời phỏng vấn thế nào
Đi qua từng ca với API tương ứng và một lưu ý thực tế (iframe tách DOM, popup phải chờ kèm action, route đừng mock tràn). Nhấn mạnh: mock backend bằng {{route}} là **công cụ có chủ đích** (test UI cô lập/ca lỗi), còn luồng E2E quan trọng vẫn nên chạy chống môi trường tích hợp có kiểm soát.

> Senior tip: Với các ca "bất thường" (iframe, popup, download), hãy viết helper nhỏ có log/trace rõ ràng. Những ca này hay vỡ khác nhau giữa local và CI (quyền file, headless, chặn popup) – đừng đợi đến lúc pipeline đỏ mới tìm cách tái hiện.`,
  follow: [
    'Khi nào bạn mock bằng {{page.route}} và khi nào dùng WireMock/service giả ở tầng hạ tầng (liên hệ {{autotest-014}})?',
    'Làm sao xử lý upload nhiều file hoặc input file ẩn (không hiện nút browse)?',
    'Nếu popup bị chặn bởi chính sách trình duyệt trong môi trường test, bạn xử lý thế nào?'
  ],
  refs: [
    { type: 'doc', title: 'Frames (Playwright Java)', url: 'https://playwright.dev/java/docs/frames' },
    { type: 'doc', title: 'Pages (popup) (Playwright Java)', url: 'https://playwright.dev/java/docs/pages' },
    { type: 'doc', title: 'Downloads and uploads (Playwright Java)', url: 'https://playwright.dev/java/docs/downloads' },
    { type: 'doc', title: 'Network (route/mock) (Playwright Java)', url: 'https://playwright.dev/java/docs/network' }
  ]
},

{
  id: 'autotest-035',
  topic: 'autotest',
  level: 'lead',
  q: '(Lead) Debug test Playwright fail trên CI: dùng Trace Viewer ({{tracing.start/stop}}, {{show-trace}}), video, screenshot, codegen ra sao? Bạn thiết kế chiến lược artifact và quy trình triage flaky cho team như thế nào?',
  a: `**Tóm tắt:** Test fail trên **CI** (Continuous Integration – hệ thống chạy test tự động mỗi lần đẩy code) khó hơn local vì không có màn hình người ngồi xem. Playwright cung cấp **artifact** (tài liệu/vết để điều tra): **trace** (bản ghi tương tác, DOM snapshot, network, console) xem bằng **Trace Viewer** ({{tracing.start/stop}}, mở bằng {{npx playwright show-trace}} hoặc công cụ tương đương), **video**, **screenshot**. **codegen** giúp sinh locator/hành động mẫu để tái hiện hoặc viết lại bước mong manh. Ở mức lead: chuẩn hoá **khi nào thu artifact** (luôn trên failure, có thể sampling), **lưu ở đâu/bao lâu**, **quy ước đặt tên gắn build+test**, và **quy trình triage flaky** (phân loại, owner, sửa gốc, theo dõi tỉ lệ) để team không "rerun cho xanh".

### Vì sao CI fail khó debug
- Môi trường khác local: headless, CPU chậm, mạng khác, locale/timezone, dữ liệu test.
- Không có ai nhìn thấy lúc fail; log text thường thiếu ngữ cảnh UI/mạng.
- **Flaky** ({{autotest-003}}, {{autotest-015}}): cùng commit, chạy lại có thể pass → nếu chỉ bấm rerun, gốc rễ còn đó.

### Trace: "máy quay" cho test
**Trace** ghi lại dòng thời gian: hành động, ảnh chụp DOM, request/response, console. Bật theo context:

~~~java
BrowserContext context = browser.newContext();
context.tracing().start(new Tracing.StartOptions()
    .setScreenshots(true)   // ảnh trong trace
    .setSnapshots(true)     // DOM snapshot
    .setSources(true));     // đính kèm source (hữu ích khi debug)

try {
  // ... chạy test ...
} finally {
  // Chỉ lưu khi fail để tiết kiệm dung lượng (quyết định theo team)
  context.tracing().stop(new Tracing.StopOptions()
      .setPath(java.nio.file.Paths.get("build/traces/" + testName + ".zip")));
  context.close();
}
~~~

Mở trace (máy có Playwright tool): dùng CLI {{npx playwright show-trace path/to/trace.zip}} (Node toolchain của Playwright) hoặc tích hợp viewer trong CI report. Trace Viewer cho xem từng bước: locator nào, trang trông ra sao lúc đó, request nào chậm/lỗi.

### Video và screenshot
- **Video**: cấu hình {{recordVideo}} khi tạo context (ví dụ đặt thư mục {{dir}}) để quay cả phiên; hữu ích xem hành vi tổng thể nhưng nặng.
- **Screenshot**: chụp lúc fail ({{page.screenshot(...)}} trong {{@AfterEach}} khi test thất bại) – nhẹ, nhanh xem.
- Chiến lược thực dụng: **trace on failure** (giàu thông tin nhất) + screenshot on failure; video bật khi cần tái hiện ca hiếm hoặc trên nightly.

### Codegen
**Codegen** ({{npx playwright codegen <url>}}) mở browser có ghi thao tác và gợi ý locator/code. Dùng để: khám phá selector ổn định, tái hiện nhanh luồng báo lỗi, hoặc so sánh locator gợi ý với POM hiện tại. Không copy nguyên codegen vào suite mà không rà soát (locator có thể chưa bền, thiếu assert nghiệp vụ).

~~~bash
# Gợi ý lệnh (chạy thủ công khi cần điều tra), không dùng trong test code
# npx playwright codegen https://staging.example.test
~~~

### Chiến lược artifact cho team
| Quyết định | Gợi ý |
|---|---|
| Khi thu | Trace/screenshot **khi fail**; có thể trace "on-first-retry" nếu framework hỗ trợ retry có kiểm soát |
| Đặt tên | {{<build>-<suite>-<class>-<method>-<attempt>.zip/png}} để truy vết |
| Lưu trữ | Artifact của hệ CI (GitHub Actions artifacts, Jenkins stash…) + retention (7–30 ngày tuỳ chi phí) |
| Bảo mật | Trace có thể chứa cookie/token/PII; **lọc/không ghi** dữ liệu nhạy, hạn chế quyền xem |
| Liên kết | Đính link artifact vào ticket/Allure report ({{autotest-011}}) |

### Quy trình triage flaky (lead)
~~~seq
title: Quy trình triage test flaky
actors: CI | Dev/SDET | Tracker | Owner
CI -> Dev/SDET: fail + đính kèm trace/screenshot
Dev/SDET -> Tracker: phân loại (flaky môi trường|timing|dữ liệu|bug thật)
Tracker -> Owner: gán owner + mức ưu tiên
Owner -> CI: sửa gốc rễ (chờ điều kiện, cô lập data, mock)
CI --> Tracker: theo dõi tỉ lệ pass/flake theo thời gian
~~~

1. **Phát hiện**: fail kèm artifact; đánh dấu "flaky nghi ngờ" nếu rerun pass (nhưng vẫn mở ticket).
2. **Phân loại**: timing/auto-wait sai ({{autotest-032}}), rò rỉ state (thiếu context cô lập, {{autotest-033}}), dữ liệu chia sẻ, phụ thuộc dịch vụ ngoài, hoặc **bug sản phẩm thật**.
3. **Sửa gốc rễ**: chờ đúng tín hiệu ({{waitForResponse/URL}}), cô lập dữ liệu, ổn định locator, mock có chủ đích ({{autotest-034}}), sửa app nếu là bug.
4. **Ngưỡng**: đặt SLO (ví dụ suite chính < 1% flaky) và **không** chấp nhận "quarantine vô hạn" không owner.

### Lỗi hay gặp
- Bật trace+video cho mọi test mọi lần → tốn lưu trữ, CI chậm.
- Rerun tự động đến khi xanh mà không ghi nhận → che nợ chất lượng.
- Trace chứa token/secret → rò rỉ; dùng context sạch, tránh đăng nhập bằng tài khoản thật nhạy cảm, rà soát chính sách artifact.
- Chỉ nhìn screenshot cuối cùng mà bỏ trace timeline → bỏ lỡ request lỗi nguyên nhân.

### Trả lời phỏng vấn thế nào
Trình bày công cụ: trace ({{start/stop}}, Trace Viewer) là mạnh nhất, screenshot/video bổ trợ, codegen hỗ trợ tái hiện. Sau đó nói như lead: **chiến lược artifact** (on-failure, đặt tên, retention, bảo mật) và **quy trình triage** (phân loại → owner → sửa gốc → đo tỉ lệ), nhấn mạnh không dùng rerun thay cho sửa flaky.

> Senior tip: Một pipeline đáng tin cậy coi flaky là **sự cố chất lượng** có owner và thời hạn, không phải "đặc tính của UI test". Artifact tốt (trace) biến tranh luận "máy em chạy được" thành bằng chứng có thể xem lại từng bước.`,
  follow: [
    'Bạn bật tracing ở mức nào (BrowserContext vs global) khi chạy song song nhiều test?',
    'Khi trace lộ token/session trong request header, bạn giảm thiểu rủi ro thế nào?',
    'Làm sao phân biệt flaky do test với bug sản phẩm khi chỉ có artifact trên CI?'
  ],
  refs: [
    { type: 'doc', title: 'Trace viewer (Playwright Java)', url: 'https://playwright.dev/java/docs/trace-viewer-intro' },
    { type: 'doc', title: 'Videos (Playwright Java)', url: 'https://playwright.dev/java/docs/videos' },
    { type: 'doc', title: 'Test generator / codegen (Playwright Java)', url: 'https://playwright.dev/java/docs/codegen-intro' },
    { type: 'article', title: 'Eradicating Non-Determinism in Tests (Martin Fowler)', url: 'https://martinfowler.com/articles/nonDeterminism.html' }
  ]
}



);
