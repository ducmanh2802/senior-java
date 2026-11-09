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

### Ví dụ đời thực
Một team web Java có khoảng 200 test UI Selenium chạy trên Chrome khi gửi mã (pull request), mỗi lần mất 40 phút và thường có 5-8 test đỏ ngẫu nhiên vì phần tử bị che hoặc trang chưa tải xong. Dev quen bỏ qua CI đỏ và merge sau khi chạy lại, nên lỗi giao diện lọt ra production. Trưởng team ghi lại số liệu hai tuần: 150 test UI chiếm 35 phút, 40 test API REST Assured chạy 3 phút, 10 unit test chạy 20 giây; 6 trên 8 test flaky là UI. Họ quyết định: giữ 20 test UI quan trọng nhất (đăng nhập, thanh toán), viết lại 80 test quy tắc giảm giá và tồn kho thành API test, xóa 100 test UI trùng lặp hoặc ít giá trị. Sau một tháng: suite PR từ 40 xuống 8 phút, flaky rate từ 6% xuống dưới 1%, và team bắt được lỗi giao diện thật qua 20 test UI còn lại thay vì bỏ qua toàn bộ CI. Thời gian phản hồi giảm từ 40 phút xuống 8 phút.

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

### Ví dụ đời thực
Pipeline CI của team chạy trên GitHub Actions ubuntu-latest, cài Chrome và chromedriver bằng apt. Một sáng Chrome tự cập nhật lên phiên bản 126, nhưng apt repository vẫn chỉ có chromedriver 124. Toàn bộ 150 test UI Selenium fail ngay tại khởi tạo session với lỗi "session not created: ChromeDriver 124 chỉ hỗ trợ Chrome 124". Team mất 2 giờ điều tra: log CI chỉ hiện version mismatch, không gợi ý driver nào cần. Tạm thời khắc phục bằng cách pin Chrome version trong workflow (google-chrome-stable=124.0.6367.91-1) và chạy lại. Sau đó nâng cấp Selenium lên 4.18+ và bật Selenium Manager để CI tự tải driver khớp phiên bản Chrome thực tế; tuy nhiên môi trường CI chặn mạng ra ngoài nên Selenium Manager không tải được driver, team tự host driver trên artifact repository nội bộ và cấu hình CI dùng driver đó (bỏ qua tải về của Selenium Manager). Kết quả: các lần Chrome cập nhật sau đó không còn làm vỡ CI, thời gian khắc phục sự cố từ 2 giờ xuống còn 10 phút cập nhật mirror.

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


### Ví dụ đời thực
Team QA 6 người có suite Selenium 4 với 350 test, flaky rate khoảng 6%, phần lớn do click khi phần tử còn bị overlay che hoặc chưa enable. Thử nghiệm 4 tuần: viết lại 40 test luồng thanh toán bằng Playwright for Java, cùng dữ liệu và cùng môi trường. Kết quả: flaky rate của nhóm này còn 0,8%, thời gian chạy giảm 35% nhờ browser context cô lập (không phải mở trình duyệt mới cho mỗi test), và trace viewer giúp điều tra test đỏ trong khoảng 5 phút thay vì 30 phút đọc log. Nhưng team vẫn giữ Selenium cho 60 test chạy trên Safari thật qua Grid của đối tác, vì Playwright dùng WebKit build riêng chứ không phải Safari bản phát hành. Quyết định: test mới viết bằng Playwright, chuyển dần các test cũ hay đỏ, không viết lại toàn bộ cùng lúc.

### Trả lời mẫu khi phỏng vấn
"Selenium đi qua chuẩn W3C WebDriver: client gửi lệnh HTTP tới driver của từng trình duyệt, nên hỗ trợ rất rộng về ngôn ngữ và trình duyệt, có Grid, nhưng phải tự quản lý chờ bằng explicit wait. Playwright điều khiển trình duyệt qua giao thức gốc, tự chờ phần tử sẵn sàng trước khi thao tác, có browser context cô lập, mock network và trace viewer, và có bản Java chính thức. Cypress mạnh với team frontend JavaScript nhưng ít phù hợp team Java thuần. Với dự án Java enterprise mới, tôi thường chọn Playwright for Java vì giảm flaky và debug nhanh. Nếu đã có framework Selenium lớn và ổn định, hoặc cần Safari thật, tôi giữ Selenium và chỉ viết test mới bằng công cụ mới. Tôi quyết định bằng một thử nghiệm nhỏ trên luồng thật, đo flaky rate và thời gian chạy, chứ không theo xu hướng."

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


### Ví dụ đời thực
Frontend nâng cấp thư viện UI component, các class CSS sinh tự động đổi tên toàn bộ: 180 trên 420 test UI đỏ trong một đêm dù không có bug chức năng. 70% locator hỏng là XPath copy từ DevTools hoặc selector theo class. Team QA đề xuất với frontend: quy ước {{data-testid}} theo dạng {{khu-vực-hành-động}}, thêm vào component dùng chung (Button, Input, Table row) để mọi màn hình tự có, và một rule lint cảnh báo khi phần tử tương tác thiếu test id. Ưu tiên tiếp theo là {{getByRole}} với accessible name, nhờ đó test cũng phát hiện lỗi accessibility. Lần nâng cấp UI tiếp theo chỉ 9 test đỏ, đều do thay đổi luồng thật.

### Trả lời mẫu khi phỏng vấn
"Tôi chọn locator theo ý định của phần tử chứ không theo vị trí trong cây DOM. Thứ tự ưu tiên của tôi là data-testid dành riêng cho test, sau đó role và nhãn truy cập như getByRole, rồi id hay name ổn định, rồi CSS ngắn có ngữ nghĩa; XPath tuyệt đối, nth-child hay class sinh tự động thì tránh vì chỉ cần thêm một thẻ div hay đổi thư viện là hỏng. Với dev, tôi thống nhất quy ước đặt tên test id theo hành vi, thêm vào component dùng chung để mọi màn hình có sẵn, và coi test id là một hợp đồng: đổi hay xoá phải báo QA, có thể kiểm tra bằng lint. Kết quả là test chỉ đỏ khi hành vi thay đổi chứ không phải khi giao diện đổi kiểu dáng, giảm rất nhiều thời gian sửa test."

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
    .body("{"customer":""+email+"","items":[{"sku":"A1","qty":1}]}")
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


### Ví dụ đời thực
Suite 250 test E2E chạy song song 8 worker trên staging dùng chung 5 tài khoản cố định. Flaky rate khoảng 9%: hai test cùng thêm sản phẩm vào giỏ của một user, test này thấy hàng của test kia. Mỗi test lại tạo đơn qua UI mất khoảng 40 giây. Sửa: viết {{TestDataFactory}} gọi API nội bộ tạo user và đơn hàng với email dạng {{qa+run123-w3-UUID@example.test}} (gắn mã lần chạy và worker), trả về id để test dùng; teardown gọi API xoá trong {{@AfterEach}}; một job hằng đêm xoá dữ liệu có tiền tố {{qa+}} cũ hơn 24 giờ phòng khi teardown không chạy. Kết quả: thời gian setup mỗi test còn khoảng 2 giây, tổng suite giảm từ 55 xuống 21 phút, flaky rate còn dưới 1%.

### Trả lời mẫu khi phỏng vấn
"Nguyên tắc của tôi là mỗi test sở hữu dữ liệu riêng, tạo nhanh và dọn được. Tôi tạo dữ liệu qua API hoặc seed có kiểm soát thay vì qua UI, vì UI chậm và khi giao diện đổi thì bước setup hỏng dù tính năng đang test không liên quan. Dữ liệu có định danh duy nhất, gắn mã lần chạy và mã worker, nên các test song song không đụng nhau; tuyệt đối không dùng chung một tài khoản cố định. Sau test, teardown xoá dữ liệu, nhưng vì teardown có thể không chạy khi test crash, tôi thêm job dọn định kỳ theo tiền tố, chỉ trên môi trường test. Với integration test trong cùng process Spring, có thể dùng transaction rollback hoặc Testcontainers. Tôi gom các hàm tạo dữ liệu vào một data factory chung để cả team dùng thống nhất."

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


### Ví dụ đời thực
Một dự án bảo hiểm có 600 scenario Cucumber, 70% viết kiểu "When tôi click nút có id btn-submit"; BA không đọc, step definition trùng lặp hơn 300 hàm, mỗi lần đổi UI mất 2 ngày sửa feature file. Team giữ lại khoảng 80 scenario cho quy tắc nghiệp vụ mà BA thực sự cần duyệt (tính phí bảo hiểm theo tuổi, điều kiện từ chối bồi thường), viết lại ở mức hành vi, step definition gọi API thay vì UI; phần còn lại chuyển thành JUnit + REST Assured hoặc Playwright test thường. Thời gian chạy giảm từ 70 xuống 15 phút; BA bắt đầu review feature file trong buổi refinement và phát hiện 3 hiểu lầm về quy tắc trước khi code.

### Trả lời mẫu khi phỏng vấn
"Giá trị của BDD nằm ở việc dev, QA và BA cùng hiểu một quy tắc nghiệp vụ qua ví dụ cụ thể, và các ví dụ đó trở thành test chạy được, tức tài liệu sống. Cucumber chỉ là công cụ chạy Gherkin; nếu không có ai ngoài dev đọc feature file thì BDD chỉ thêm một lớp dịch. Kịch bản tốt ngắn, mô tả hành vi bằng ngôn ngữ nghiệp vụ, ví dụ: cho khách hàng có hạn mức 10 triệu, khi rút 12 triệu, thì giao dịch bị từ chối với lý do vượt hạn mức. Anti-pattern hay gặp là viết Gherkin như kịch bản click chuột, hai mươi bước một scenario, logic dày trong step definition, và dùng Gherkin cho cả test kỹ thuật. Tôi dùng BDD có chọn lọc cho quy tắc nghiệp vụ quan trọng, step definition gọi tầng API hoặc service, còn test kỹ thuật viết bằng JUnit trực tiếp."

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

### Ví dụ đời thực
Team 10 QA mới chuyển sang Playwright for Java, viết framework dùng BrowserContext static duy nhất cho toàn bộ suite để "tiết kiệm tài nguyên". Khi chạy sequential (một luồng) mọi test pass; bật parallel 4 worker thì flaky rate nhảy lên 18%: test đăng nhập thay đổi cookie làm test thanh toán bị logout, test tìm kiếm ghi đè localStorage làm test giỏ hàng mất dữ liệu. Điều tra bằng trace viewer thấy cả 4 worker cùng dùng một BrowserContext static, mọi thao tác lẫn vào nhau. Sửa: đưa DriverFactory dùng ThreadLocal<BrowserContext>, mỗi worker tạo context riêng, đóng trong @AfterEach; thêm base test class tự handle context lifecycle. Sau khi sửa, parallel 4 worker ổn định, flaky rate xuống 0,5%, thời gian suite từ 25 phút xuống 7 phút.

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
  a: `**Tóm tắt:** Flaky test (test chập chờn) là test đôi khi pass đôi khi fail mà code sản phẩm không đổi, do timing, môi trường hoặc dữ liệu. Đo: flaky rate = số lần fail do flaky chia tổng số lần chạy. Cách ly: đánh dấu test flaky, tách ra suite riêng, chạy lẻ để xác nhận. Sửa tận gốc: chờ đúng điều kiện (không sleep cứng), dữ liệu độc lập, locator bền, không chia sẻ trạng thái. Retry tự động (chạy lại test khi fail) nguy hiểm vì che lỗi thật, làm suite xanh giả, tốn thời gian và khiến defect leakage (lỗi lọt ra production) tăng mà không ai biết.

### Flaky test là gì
Test flaky là test không ổn định: cùng code, cùng môi trường, chạy lần này pass, lần sau fail. Nguyên nhân hay gặp: phần tử chưa xuất hiện nhưng test đã click (timing), chờ không đủ thì thử lại, dữ liệu cũ chưa xóa, mạng chậm, animation chưa dứt. Flaky làm team mất niềm tin vào automation: khi CI đỏ, ai đó nói có lẽ flaky, bỏ qua → lỗi thật lọt qua.

### Cách đo flaky rate
Flaky rate = (số lần test fail do flaky) / (tổng số lần chạy test) × 100%. Theo dõi trên CI: mỗi lần test fail, chạy lại nếu nghi ngờ flaky; nếu chạy lại pass → đánh dấu flaky. Liệt kê top test flaky nhất để ưu tiên sửa. Ví dụ: 1000 lần chạy, 20 lần fail flaky → flaky rate 2%.

### Cách ly flaky test
- Đánh dấu test flaky (tag flaky), tách ra suite riêng không chặn merge.
- Chạy lẻ test đó nhiều lần trên máy dev để tái hiện.
- Nếu không sửa được ngay, tạm thời bỏ khỏi suite regression chính để không nhiễu tín hiệu.

### Sửa tận gốc
- Thay sleep cứng (Thread.sleep) bằng wait điều kiện (chờ nút clickable, spinner biến mất).
- Dữ liệu độc lập mỗi test, không dùng chung tài khoản cố định.
- Locator bền (data-testid), tránh XPath giòn.
- Không chia sẻ session/cookie giữa test.

### Tại sao retry tự động nguy hiểm
Retry tự động là cấu hình CI chạy lại test khi fail (ví dụ retry 3 lần). Nó làm test flaky vẫn pass trên CI, nhưng che giấu lỗi thật: một lần fail có thể do bug sản phẩm, retry lần sau pass do thời điểm khác, team tưởng ổn. Hậu quả: flaky rate thấp giả tạo, defect leakage tăng, team mất hàng giờ debug "ghost bug". Chỉ dùng retry có kiểm soát cho lỗi hạ tầng rõ ràng (mạng ngắt), và phải theo dõi test nào hay retry để sửa gốc.

### Lỗi hay gặp
- Bật retry toàn suite để CI xanh, không điều tra flaky.
- Chỉ sửa triệu chứng (thêm sleep) không sửa gốc (đợi điều kiện sai).
- Bỏ qua test flaky vì "chạy lại pass".


### Ví dụ đời thực
CI của một team đỏ khoảng 1 trên 4 lần chạy; mọi người quen bấm chạy lại. Team bật thống kê: mỗi test fail rồi pass khi chạy lại trên cùng commit được ghi nhận là flaky. Sau 2 tuần có danh sách 23 test flaky, top 5 chiếm 60% số lần đỏ. Nguyên nhân: 9 test dùng {{Thread.sleep(2000)}} chờ toast thông báo, 8 test dùng chung một tài khoản, 4 test phụ thuộc giờ hệ thống, 2 test do dịch vụ email sandbox chậm. Sửa bằng chờ điều kiện (phần tử hiển thị, request hoàn tất), dữ liệu riêng mỗi test, {{Clock}} cố định, và WireMock thay sandbox. Trong lúc sửa, các test này được tag {{quarantine}} chạy ở job riêng không chặn merge, mỗi test có ticket và người chịu trách nhiệm. Đáng chú ý: một test trong danh sách thực ra bắt được race condition thật trong code thanh toán, nếu bật retry thì lỗi đó đã lọt. Sau 6 tuần flaky rate từ 7% còn 0,6%.

### Trả lời mẫu khi phỏng vấn
"Flaky test là test lúc pass lúc fail khi code không đổi, thường do chờ sai cách, dữ liệu dùng chung, phụ thuộc thời gian hoặc dịch vụ ngoài. Tôi đo bằng cách ghi lại mọi lần test fail rồi pass khi chạy lại trên cùng commit, tính flaky rate theo từng test và xếp hạng để sửa test gây nhiễu nhiều nhất trước. Test flaky được cách ly vào nhóm riêng không chặn merge, nhưng có ticket, người chịu trách nhiệm và hạn sửa, để không bị bỏ quên. Sửa tận gốc nghĩa là chờ theo điều kiện thay vì sleep, dữ liệu riêng mỗi test, cố định thời gian, giả lập dịch vụ ngoài. Tôi tránh bật retry tự động cho cả suite vì nó che lỗi thật, đặc biệt race condition trong code sản phẩm, vốn cũng biểu hiện lúc có lúc không. Nếu dùng retry thì chỉ cho lỗi hạ tầng rõ ràng và vẫn ghi nhận để theo dõi."

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
Chạy suite, ghi thời gian từng test. Xác định 20% test chậm nhất chiếm khoảng 80% thời gian (quy tắc Pareto). Ví dụ: 100 test UI, 10 test chậm nhất chiếm 90 phút. Tập trung vào những test này.

### Bước 2: chuyển test xuống tầng thấp hơn (test pyramid)
Không phải mọi kiểm thử đều cần UI. Test kiểm tra rule tính phí, kiểm tra dữ liệu trả về API nên chuyển xuống REST Assured (gọi API trực tiếp, nhanh, ổn định). UI chỉ giữ luồng end-to-end quan trọng. Ví dụ: 60 test kiểm tra tính toán giảm giá chuyển xuống API → tiết kiệm 50 phút.

### Bước 3: chạy song song và headless
Chạy trên nhiều worker (ví dụ 4 thread) và headless (trình duyệt không cửa sổ, phù hợp CI). 120 phút chia 4 worker → khoảng 30 phút, rồi kết hợp bước 2 → dưới 20 phút.

### Bước 4: setup dữ liệu qua API
Thay vì tạo đơn hàng qua UI (nhiều bước click, chậm), dùng API tạo dữ liệu trước, rồi UI chỉ kiểm tra hiển thị. Tiết kiệm thời gian setup mỗi test.

### Bước 5: sharding CI và xử lý flaky
Chia suite thành các mảnh chạy trên job CI khác nhau. Sửa hoặc cách ly test flaky, không để test flaky làm suite chạy lại nhiều lần.

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


### Ví dụ đời thực
Một dự án e-commerce có 120 test UI Selenium chạy sequential trên CI, tổng thời gian 120 phút. Phân tích thấy 60 test chỉ kiểm tra rule tính giá, kiểm tra dữ liệu giỏ hàng – không cần giao diện. Team chuyển 20 test ưu tiên nhất (kiểm tra giảm giá, phí ship, voucher) xuống REST Assured, chạy song song 4 worker trên GitHub Actions. Kết quả: 20 test API chạy trong 3 phút (trước đó 40 phút qua UI), 40 test UI còn lại chạy headless 4 worker trong 15 phút, tổng suite giảm từ 120 xuống 18 phút. Flaky rate từ 5% xuống 0,8% nhờ loại bỏ test UI giòn và dữ liệu độc lập mỗi test.

### Trả lời mẫu khi phỏng vấn
"Trước hết tôi đo: thời gian từng test, thời gian setup so với thời gian kiểm tra thật, test nào hay đỏ. Thường một nhóm nhỏ test chiếm phần lớn thời gian. Sau đó tôi xem mỗi test UI thực sự kiểm tra gì: những test kiểm tra quy tắc tính toán hay dữ liệu trả về thì chuyển xuống API hoặc unit test, nhanh hơn hàng chục lần; UI chỉ giữ các luồng end-to-end quan trọng. Tiếp theo, chuyển setup dữ liệu sang API, vì tạo đơn qua UI có thể mất cả phút mỗi test. Khi test đã độc lập về dữ liệu, tôi mới bật song song nhiều worker, chạy headless và chia shard trên nhiều job CI. Thứ tự này quan trọng: song song hoá khi test còn dùng chung dữ liệu chỉ làm tăng flaky. Cuối cùng sửa hoặc cách ly test flaky để không phải chạy lại. Tôi theo dõi thời gian suite như một chỉ số, có ngưỡng cảnh báo để nó không phình lại."

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
  a: `**Tóm tắt:** Visual regression testing chụp ảnh màn hình (screenshot) của trang web, sau đó so sánh với ảnh cơ sở (baseline – ảnh được chấp nhận trước đó). Nếu có sai khác vượt ngưỡng cho phép (ví dụ phần trăm pixel khác hoặc số điểm sai khác), test bị đánh dấu fail. Giúp phát hiện lỗi giao diện ngoài ý muốn như chữ bị che, màu đổi, layout bị vỡ. Nhược điểm là dễ flaky do font, anti-alias, nội dung động, và chi phí bảo trì cao khi baseline cần cập nhật thường xuyên.

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


### Ví dụ đời thực
Team thêm visual regression cho 120 màn hình bằng ảnh chụp toàn trang. Tuần đầu 35% test đỏ: font render khác giữa máy dev macOS và CI Linux, đồng hồ trên header, banner khuyến mãi xoay vòng. Sửa: chỉ chụp và so sánh trong cùng một image Docker cố định (cùng trình duyệt, font, kích thước cửa sổ); che (mask) các vùng động như thời gian, avatar, quảng cáo; tắt animation; chờ font và ảnh tải xong trước khi chụp; giảm phạm vi còn 30 màn hình quan trọng và chụp theo component cho phần còn lại. Ngưỡng đặt khoảng 0,2% số pixel khác. Tỉ lệ đỏ giả còn dưới 2%. Ba tháng sau visual test bắt được lỗi CSS làm nút "Thanh toán" bị popup cookie che trên màn hình 1366px, lỗi mà test chức năng không phát hiện vì nút vẫn tồn tại trong DOM.

### Trả lời mẫu khi phỏng vấn
"Visual regression chụp ảnh màn hình hoặc component trong điều kiện cố định rồi so với ảnh baseline đã được duyệt; vượt ngưỡng khác biệt thì fail và sinh ảnh diff để người xem. Nó bắt các lỗi mà assert chức năng bỏ qua, như phần tử bị che, vỡ layout, sai màu, vì phần tử vẫn tồn tại trong DOM. Ngưỡng tôi chọn sau khi đã loại nguồn nhiễu: chạy trong cùng image Docker để font và trình duyệt giống nhau, che vùng động, tắt animation, chờ trang tải xong; khi đó ngưỡng có thể chặt, khoảng vài phần nghìn số pixel. Chi phí lớn nhất là duyệt và cập nhật baseline khi giao diện thay đổi có chủ đích, và xử lý báo sai. Vì vậy tôi chỉ dùng cho các màn hình quan trọng, ít thay đổi, và coi đây là lớp bổ sung cho test chức năng."

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
| Tốc độ | Nhanh (giây) | Chậm (phút) |
| Môi trường | Không cần full hệ thống | Cần staging đầy đủ |
| Lỗi bắt được | Lỗi định dạng dữ liệu giữa service | Lỗi luồng kinh doanh toàn diện |
| Chạy khi nào | Mỗi commit (CI) | Nightly, trước release |
| Ai chủ yếu | QA + dev cùng xác định contract | QA viết kịch bản kinh doanh |

### Liên kết với topic testing
Topic testing đã có phần contract testing và mutation test từ góc kỹ thuật. Ở đây nhấn mạnh: QA tham gia định nghĩa contract cho các luồng quan trọng, chủ động sync với dev khi API thay đổi, và chỉ dùng E2E cho một số ít luồng critical để không làm chậm pipeline.

### Lỗi hay gặp
- Chỉ dùng E2E cho mọi kiểm tra tích hợp → pipeline chậm, fail khó chẩn đoán service nào.
- Không cập nhật contract khi API đổi → contract pass nhưng thực tế fail.
- Contract quá chặt (so khớp giá trị cụ thể thay vì kiểu dữ liệu) → provider đổi dữ liệu hợp lệ cũng làm verify fail; nên dùng matcher theo kiểu và chỉ khai báo trường consumer thật sự dùng.


### Ví dụ đời thực
Hệ thống 12 microservice có bộ E2E 180 test chạy 90 phút trên staging, đỏ thường xuyên và mất nửa ngày để biết lỗi do service nào. Một lần Payment đổi trường {{transactionId}} thành {{txnId}}, E2E đỏ sau 2 ngày khi đã merge, Order Service lỗi trên staging. Team áp dụng Pact cho 8 cặp consumer/provider quan trọng: consumer sinh contract trong unit test, đẩy lên Pact Broker; pipeline của provider verify mọi contract trước khi merge; trước deploy chạy kiểm tra "có thể deploy phiên bản này không" dựa trên kết quả verify. E2E giảm còn 25 luồng nghiệp vụ critical chạy nightly. Lần đổi tên trường tiếp theo bị chặn ngay ở PR của provider sau 4 phút, kèm thông báo consumer nào đang dùng trường đó.

### Trả lời mẫu khi phỏng vấn
"Contract testing kiểm tra hai service có cùng hiểu về request và response không, mà không cần dựng cả hệ thống. Consumer ghi lại những gì nó gửi và những trường nó thực sự dùng trong response thành contract; provider chạy verify contract đó trong pipeline của mình. Vì chạy độc lập và nhanh, nó bắt lỗi tích hợp ngay ở PR và chỉ đúng service gây lỗi. E2E kiểm tra cả luồng nghiệp vụ qua nhiều service thật, có giá trị nhưng chậm, cần môi trường đầy đủ, và khi đỏ thì khó biết do đâu. Từ góc QA, tôi dùng contract cho hầu hết kiểm tra tích hợp giữa các service, giữ E2E cho một số ít luồng quan trọng nhất chạy nightly hoặc trước release. QA tham gia xác định contract cho các luồng quan trọng và giữ contract dùng matcher theo kiểu để không quá chặt."

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
  a: `**Tóm tắt:** Performance test kiểm tra hệ thống chịu tải bao nhiêu, phản hồi nhanh bao nhiêu, khác automation chức năng (không chỉ pass/fail). k6 (viết JavaScript), JMeter (giao diện Java, phổ biến), Gatling (DSL Java/Scala/Kotlin, test viết như code) là công cụ phổ biến. Workload model (mô hình tải) mô tả số user ảo, thời gian, tỷ lệ từng hành động. Think time (thời gian nghĩ) là khoảng nghỉ giữa hai hành động của người dùng thật, giúp mô phỏng thực tế. Ramp-up (đẩy dần) là tăng số user từ 0 lên mục tiêu dần dần, tránh cho hệ thống sốc. p95/p99 là percentile: 95% request nhanh hơn X ms, 1% kém nhất nhanh hơn Y ms. Dùng để biết phần lớn user được phục vụ tốt, còn p99 là nhóm 1% user bị chậm nhất.

### Các công cụ
- **k6**: script JavaScript, chạy trong CLI, thích hợp CI và developer.
- **JMeter**: giao diện đồ họa, nhiều plugin, phổ biến trong doanh nghiệp VN.
- **Gatling**: viết script Scala/Java, báo cáo đẹp, thích hợp team thích code.

### Workload model
Mô hình tải định nghĩa: bao nhiêu user đồng thời, trong bao lâu, mỗi user làm gì. Ví dụ: 100 user đặt hàng, mỗi user 5 đơn/giờ, trong 30 phút. QA cần đồng ý với PM về mô hình này trước khi chạy.

### Think time
Người thật không nhấn nút liên tục mà nghĩ vài giây giữa các bước. Think time mô phỏng khoảng nghỉ đó (ví dụ uniform 3-5 giây). Nếu bỏ think time, hệ thống bị tấn công nhiều request hơn thực tế → kết quả sai lệch (thấp hơn thực tế).

### Ramp-up
Không đẩy ngay 1000 user vào lúc 0 giây (có thể làm hệ thống sốc, kết quả không phản ánh thực tế). Ramp-up tăng dần: 0 đến 1000 user trong 10 phút, hệ thống ổn định mới đo.

### Đọc p95/p99
- **p95**: 95% request có thời gian phản hồi nhỏ hơn hoặc bằng giá trị này. Ví dụ p95 = 400 ms có nghĩa 95% user thấy trang tải trong 400 ms.
- **p99**: 99% request nhanh hơn hoặc bằng giá trị này; 1% chậm nhất vượt quá nó. Ví dụ p99 = 2 giây có nghĩa 1% user chờ hơn 2 giây.
QA quan tâm p95/p99 vì trung bình có thể che các request cực chậm. Nếu p50 = 100 ms nhưng p99 = 5 giây, có thể hệ thống có vấn đề với một số user.

### Lỗi hay gặp
- Chỉ báo cáo trung bình (average) → che lỗi chậm hiếm.
- Không có think time → tải cao hơn thực tế, sai kết quả.
- Chạy performance trên môi trường khác production (cấu hình khác) → kết quả không tham khảo.
- Không quy định threshold (ngưỡng chấp nhận) trước khi chạy.


### Ví dụ đời thực
Trước đợt khuyến mãi, QA chạy k6 với 2.000 virtual user không có think time, ramp-up 30 giây: p95 lên 6 giây, team định tăng gấp đôi số pod. Xem lại số liệu thật từ analytics: giờ cao điểm năm trước có khoảng 1.200 người dùng đồng thời, mỗi người trung bình 1 request mỗi 8 giây, tức khoảng 150 request/giây. Script trên lại tạo hơn 900 request/giây vì không có think time. Xây lại workload model: 60% xem sản phẩm, 25% tìm kiếm, 10% thêm giỏ, 5% thanh toán; think time ngẫu nhiên 3–10 giây; ramp-up 10 phút, giữ ổn định 30 phút, mục tiêu 300 request/giây (gấp 2 lần cao điểm). Kết quả p95 380 ms, p99 1,4 giây; p99 cao do API tìm kiếm thiếu index, sửa xong p99 còn 600 ms. Threshold được đưa vào script ({{p(95)<500}}) để CI fail khi vượt.

### Trả lời mẫu khi phỏng vấn
"Tôi bắt đầu từ workload model dựa trên số liệu thật: số người dùng đồng thời giờ cao điểm, tỉ lệ từng hành động, và tốc độ request mục tiêu, thường gấp một rưỡi đến hai lần cao điểm. Think time mô phỏng khoảng nghỉ giữa các thao tác; thiếu nó, mỗi user ảo tạo tải lớn hơn người thật nhiều lần và kết quả bị sai. Ramp-up tăng tải dần để hệ thống làm nóng cache và connection pool, sau đó giữ ổn định một khoảng rồi mới đo. Khi đọc kết quả, tôi không nhìn trung bình vì nó che các request chậm; p95 cho biết trải nghiệm của đa số, p99 cho biết phần đuôi, thường lộ ra lock, GC hay truy vấn thiếu index. Tôi đặt threshold trong script để CI fail khi vượt, so sánh với baseline mỗi release, và đọc kết quả cùng với metric phía server như CPU, pool DB, GC."

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

### Ví dụ đời thực
Team QA có 60 test UI Selenium từng test tạo đơn hàng qua giao diện: click thêm sản phẩm, điền form, bấm đặt hàng, chờ xác nhận – trung bình 45 giây/test, tổng suite 45 phút. Chuyển sang Playwright: dùng APIRequestContext tạo đơn hàng qua POST /orders (1,2 giây), sau đó chỉ mở UI verify hiển thị đơn hàng (8 giây). Kết hợp network interception mock API thanh toán để test case thất bại không cần sandbox thật. 60 test chạy song song 4 worker headless: tổng thời gian từ 45 phút xuống 5 phút, flaky rate từ 4% xuống 0,5%. Các test thanh toán lỗi (500, timeout) được cover bởi mock mà không cần môi trường sandbox.

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
  a: `**Tóm tắt:** Shift-left (dịch chuyển trái) là thực hiện kiểm thử sớm hơn trong vòng đời phát triển phần mềm thay vì chờ đến cuối mới test. Automation test chia theo pipeline: PR (pull request – yêu cầu gộp mã) chạy unit và API smoke nhanh (dưới 10 phút); nightly (chạy mỗi đêm) chạy regression UI đầy đủ và performance nhẹ; trước release chạy smoke trên staging và E2E luồng critical. Mục tiêu là phát hiện lỗi sớm, chi phí sửa thấp, và không làm chậm việc đóng góp mã của dev.

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
- Nightly fail không ai xử lý sáng hôm sau → lỗi dồn tích.
- Không có gate merge → mã lỗi có thể vào nhánh chính.


### Ví dụ đời thực
Một team chạy toàn bộ 400 test UI trên mỗi PR, pipeline mất 75 phút; dev gộp nhiều thay đổi vào một PR lớn để đỡ chờ, và thường merge khi test "chắc là flaky". Lỗi được phát hiện trung bình 3 ngày sau khi viết code. Team phân tầng lại: PR chạy unit, API test và 15 smoke UI trong 9 phút, chặn merge khi fail; nightly chạy toàn bộ UI regression, visual và load test nhẹ, người trực QA xử lý kết quả trước 10 giờ sáng; trước release chạy smoke trên staging và E2E các luồng thanh toán. QA viết API test song song với dev ngay từ khi chốt contract API. Sau 2 tháng: thời gian phát hiện lỗi trung bình còn dưới 1 ngày, kích thước PR giảm một nửa.

### Trả lời mẫu khi phỏng vấn
"Shift-left là đưa kiểm thử lên sớm hơn trong vòng đời: QA tham gia từ lúc làm rõ yêu cầu và tiêu chí chấp nhận, dev viết unit test cùng code, QA viết API test song song với dev ngay khi có contract API, thay vì đợi tính năng xong mới test. Lỗi phát hiện càng sớm thì sửa càng rẻ. Trong pipeline tôi phân tầng theo tốc độ và độ tin cậy: mỗi PR chạy lint, unit, API test và vài smoke UI, dưới khoảng 10 phút, fail thì chặn merge; nightly chạy regression UI đầy đủ, visual và performance nhẹ, có người chịu trách nhiệm xử lý kết quả buổi sáng; trước release chạy smoke trên staging và E2E các luồng quan trọng. Lý do là PR phải phản hồi nhanh và đáng tin để dev không bỏ qua, còn các kiểm tra chậm, rộng thì chạy ở tầng sau."

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
- **WireMock:** kiểm tra luồng của bạn với phản hồi được kiểm soát, nhanh, CI friendly.
- **Sandbox:** kiểm tra tích hợp thực tế hơn, nhưng chậm hơn và có giới hạn lượt gọi.
- **Test hook:** khi không thể cấu hình WireMock/sandbox, hoặc cần kiểm tra logic nội bộ với dữ liệu giả.

### Lỗi hay gặp
- Gọi thật payment trong test CI → tốn tiền và fail khi mạng chậm.
- OTP thật trong test → không thể chạy tự động, tester phải đợi tin nhắn.
- Không dọn dữ liệu trong sandbox → dữ liệu cũ làm fail test sau.


### Ví dụ đời thực
Suite E2E gọi sandbox của cổng thanh toán và dịch vụ SMS: 12% số lần chạy đỏ do sandbox chậm hoặc bảo trì, và không có cách tạo tình huống "thẻ bị từ chối" hay "timeout" theo ý muốn. Team đưa WireMock vào môi trường test: stub trả thành công, từ chối, timeout 30 giây, và callback webhook đến chậm; OTP đi qua một {{OtpSender}} interface — profile test dùng bản ghi OTP vào bảng nội bộ để test đọc lại, profile production dùng nhà cung cấp SMS thật (bean test không tồn tại trong build production, được kiểm tra bằng một test kiến trúc). Sandbox thật chỉ dùng cho bộ contract nhỏ 10 test chạy hằng đêm để phát hiện khi nhà cung cấp đổi API. Flaky rate do bên thứ ba từ 12% còn gần 0, và test được thêm 6 tình huống lỗi trước đây không test được.

### Trả lời mẫu khi phỏng vấn
"Tôi không gọi dịch vụ bên thứ ba thật trong automation thường xuyên vì tốn tiền, chậm, không ổn định và không tạo được tình huống lỗi theo ý muốn. Tôi dùng ba lớp. WireMock giả lập HTTP của bên thứ ba ở môi trường test, cho phép tạo mọi tình huống: thành công, từ chối, timeout, webhook đến chậm hoặc trùng; đây là lớp chạy trên mỗi PR. Sandbox của nhà cung cấp dùng cho một bộ nhỏ chạy hằng đêm để phát hiện khi họ đổi API. Test hook như interface gửi OTP có bản cài đặt riêng cho môi trường test, để test đọc được mã mà không cần điện thoại; quan trọng là hook chỉ tồn tại ở profile test và có kiểm tra để không bao giờ bật trên production. Cuối cùng là vài kiểm tra thật trên production có kiểm soát nếu nghiệp vụ yêu cầu."

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
QA không cần là chuyên gia bảo mật, nhưng có thể thêm bước quét tự động vào pipeline test. Mục tiêu là phát hiện sớm các lỗi phổ biến (low-hanging fruit) trước khi code đến production, giảm tải cho đội bảo mật.

### OWASP ZAP baseline scan
ZAP (Zed Attack Proxy) là công cụ quét bảo mật web mã nguồn mở. Baseline scan là chế độ quét nhẹ, không tấn công mạnh, chỉ kiểm tra các quy tắc cơ bản (ví dụ header Strict-Transport-Security, Content-Security-Policy, cookie Secure/HttpOnly). Chạy qua Docker image zaproxy/zap-stable trong CI.

Ví dụ chạy ZAP baseline (ý tưởng):
~~~bash
docker run --network host -v $(pwd):/zap/wrk/:rw zaproxy/zap-stable     zap-baseline.py -t https://staging.example.app -r report.html
~~~
(Lệnh trên chỉ minh họa ý tưởng, tùy phiên bản ZAP.)

### Tích hợp vào CI
Thêm bước ZAP sau khi deploy ứng dụng lên staging trong pipeline. Nếu ZAP tìm thấy lỗi mức cao, có thể fail build hoặc chỉ báo cáo để dev xử lý tuỳ mức độ nghiêm trọng. Xuất báo cáo HTML làm artifact để team xem.

### Lưu ý quan trọng
- Chỉ quét staging/test, không quét production nếu không có sự cho phép bằng văn bản của chủ sở hữu hệ thống.
- Không lưu token, mật khẩu, PII (dữ liệu nhận dạng cá nhân) vào báo cáo ZAP.
- ZAP baseline có thể báo lỗi giả (false positive), QA cần xem xét trước khi đưa dev xử lý.
- Bảo mật automation là bổ sung, không thay thế penetration testing định kỳ.

### Lỗi hay gặp
- Quét production khi chưa được phép → có thể bị coi là tấn công, vi phạm pháp lý.
- Báo cáo ZAP chứa token → rủi ro bảo mật mới.
- Xem ZAP baseline là đủ bảo mật → bỏ qua pentester chuyên sâu.


### Ví dụ đời thực
Team thêm ZAP baseline vào pipeline sau bước deploy lên staging. Lần chạy đầu báo 47 cảnh báo; QA phân loại: 30 là header thiếu ({{Content-Security-Policy}}, {{X-Content-Type-Options}}), 6 cookie phiên thiếu {{Secure}}/{{HttpOnly}}, phần còn lại là báo sai hoặc mức thông tin. Team tạo file rule để bỏ qua các báo sai đã xác nhận (có ghi lý do), đặt chế độ chỉ fail build với cảnh báo mức cao (lúc đầu chỉ cảnh báo, sau 1 tháng mới chặn). Dev sửa header và cookie trong 2 sprint; báo cáo HTML lưu làm artifact của pipeline. Ba tháng sau, ZAP chặn một PR làm mất cờ {{HttpOnly}} trên cookie phiên khi đổi cấu hình Spring Session, trước khi lên production.

### Trả lời mẫu khi phỏng vấn
"Ở mức QA, bảo mật trong automation là chạy các quét tự động cơ bản để bắt lỗi phổ biến sớm, không phải làm pentest. Tôi dùng OWASP ZAP baseline: nó crawl ứng dụng và kiểm tra thụ động như header bảo mật, cờ cookie, lộ thông tin phiên bản, không tấn công chủ động nên an toàn để chạy thường xuyên. Tôi tích hợp vào pipeline sau khi deploy lên staging, chạy bằng image Docker, lưu báo cáo làm artifact. Lúc đầu chỉ báo cáo để team quen và loại báo sai bằng file rule có ghi lý do, sau đó mới chặn build với cảnh báo mức cao. Lưu ý: chỉ quét môi trường được phép, không để token hay dữ liệu thật trong báo cáo, và luôn có người xử lý kết quả. Đây chỉ là lớp nền; vẫn cần quét dependency, SAST và pentest định kỳ."

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


### Ví dụ đời thực
QA lead báo cáo hằng tháng "đã có 1.200 test, coverage 78%", nhưng quản lý vẫn hỏi vì sao khách gặp lỗi. Đổi cách báo cáo: defect leakage theo mức độ nghiêm trọng (tháng 3: 4 lỗi production trên tổng 31, khoảng 13%, trong đó 2 lỗi P1 đều ở luồng hoàn tiền chưa có test), coverage theo 40 luồng nghiệp vụ quan trọng (26 trên 40 có test tự động), flaky rate 4% và thời gian phản hồi của pipeline PR 22 phút. Mỗi chỉ số kèm một hành động và hạn. Sau 2 quý: 38 trên 40 luồng có test, leakage còn 5%, không còn lỗi P1 lọt ra production, flaky rate 0,8%. Quản lý duyệt thêm một SDET vì thấy mối liên hệ rõ giữa đầu tư test và lỗi production giảm.

### Trả lời mẫu khi phỏng vấn
"Tôi chọn ít chỉ số nhưng gắn với rủi ro. Defect leakage, tức tỉ lệ lỗi lọt ra production trên tổng số lỗi tìm được, chia theo mức độ nghiêm trọng, cho biết test có bắt lỗi quan trọng không. Coverage theo requirement, tức bao nhiêu luồng nghiệp vụ quan trọng có test tự động, dễ hiểu với quản lý hơn code coverage. Flaky rate cho biết tín hiệu của test có đáng tin không. Thêm thời gian phản hồi của pipeline vì test chậm thì dev né. Khi báo cáo, tôi trình bày xu hướng qua nhiều tháng, mỗi chỉ số đi kèm nguyên nhân và hành động cụ thể, và liên hệ với sự cố thật, ví dụ lỗi P1 lọt ra ở luồng nào chưa có test. Tôi tránh báo số lượng test case vì nó không nói lên giá trị, và cảnh giác khi flaky rate thấp nhờ retry."

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


### Ví dụ đời thực
Team thử sinh test API bằng LLM từ OpenAPI spec cho 40 endpoint: trong 2 ngày có 300 test, tất cả xanh. Review mẫu 50 test thấy 18 test chỉ assert status 200, 7 test assert theo response hiện tại của hệ thống — tức "đóng băng" cả một bug làm tròn tiền sai đang tồn tại. Team đổi cách dùng: LLM sinh danh sách tình huống (biên, lỗi, phân quyền) từ user story để QA chọn lọc; QA viết assert theo tiêu chí chấp nhận chứ không theo response hiện tại; code sinh ra đi qua review như mọi PR; chạy mutation testing cho phần service lõi để kiểm tra test có bắt lỗi thật không. Với self-healing locator, công cụ chỉ được đề xuất locator mới trong báo cáo, không tự sửa trong lúc chạy, vì một lần nó "tự chữa" bằng cách chọn nhầm nút Huỷ thay cho nút Xác nhận và test vẫn xanh.

### Trả lời mẫu khi phỏng vấn
"Tôi thấy AI có ích ở ba việc: gợi ý tình huống test từ user story, nhất là case biên và case lỗi; sinh khung code test và dữ liệu mẫu; và đề xuất locator thay thế khi UI đổi. Rủi ro thật là test trông đúng nhưng không kiểm tra điều quan trọng: chỉ assert status, hoặc assert theo hành vi hiện tại nên đóng băng cả bug. Self-healing tự sửa locator trong lúc chạy có thể chọn nhầm phần tử mà test vẫn xanh. Ngoài ra còn rủi ro gửi mã nguồn hay dữ liệu khách ra công cụ chưa được duyệt. Cách tôi dùng thận trọng: AI đề xuất, QA quyết định; assert viết theo tiêu chí chấp nhận; code AI sinh được review như mọi PR; self-healing chỉ đề xuất, không tự sửa; dùng công cụ được công ty duyệt; và đo chất lượng test bằng mutation testing hoặc lỗi lọt ra production."

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


### Ví dụ đời thực
Ví điện tử 30 dev, chưa có automation, mỗi release kiểm tra tay 3 ngày, tháng trước có lỗi trừ tiền hai lần khi khách bấm nút thanh toán hai lần. Tháng 1: workshop rủi ro với PO và dev, chọn 8 luồng quan trọng (nạp, rút, chuyển tiền, thanh toán QR, hoàn tiền, đăng nhập, OTP, đối soát cuối ngày); viết 60 test API với REST Assured, bao gồm test idempotency (gửi cùng request 2 lần, chỉ trừ tiền 1 lần) và test số tiền biên. Tháng 2: pipeline PR chạy API test trong 6 phút; 12 test UI Playwright cho luồng chính chạy nightly. Tháng 3–4: contract test giữa wallet và payment, test đối soát so sánh số dư với tổng giao dịch. Sau 6 tháng: kiểm tra tay trước release còn nửa ngày, defect leakage từ 30% xuống 8%, không còn lỗi P1 liên quan đến tiền.

### Trả lời mẫu khi phỏng vấn
"Với fintech chưa có test, tôi bắt đầu từ rủi ro chứ không phải công cụ. Tuần đầu tôi làm workshop với PO và dev để xác định các luồng chạm vào tiền và danh tính, như nạp, rút, chuyển tiền, hoàn tiền, đăng nhập, rồi xếp theo mức thiệt hại nếu lỗi. Giai đoạn đầu tập trung API test cho các luồng đó, vì nhanh và ổn định, với các tình huống đặc thù fintech: idempotency khi gửi trùng, số tiền biên, làm tròn, giao dịch đồng thời trên một tài khoản, và đối soát số dư. Sau đó đưa vào pipeline PR, thêm một ít UI test cho luồng chính, rồi contract test giữa các service. Nguyên tắc là không dùng dữ liệu thật, test độc lập, và mỗi lỗi production đều sinh ra test mới. Tôi đo bằng defect leakage, đặc biệt lỗi liên quan đến tiền, thời gian kiểm tra tay trước release, flaky rate và thời gian phản hồi của pipeline."

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
3. **Thiết kế Page Object:** Cho mô tả trang, ứng viên phác thảo các lớp Page Object tách locator và hành động.

### Tiêu chí chọn người
| Tiêu chí | Mô tả |
|---|---|
| Tư duy test | Nhận diện rủi ro, edge case, không chỉ test đường chính xác |
| Code sạch | Đặt tên rõ, tách lớp, không lặp code |
| Automation tool | Hiểu wait, locator, POM, API test |
| Data isolation | Biết tách dữ liệu, không chia sẻ trạng thái test |
| Giao tiếp | Giải thích lý do chọn công cụ, báo lỗi cho dev hiểu |

### Lỗi khi tuyển SDET
- Chỉ hỏi công cụ (Selenium hay Playwright) không hỏi tư duy test.
- Bài tập quá dài (4 giờ) làm ứng viên giỏi bỏ cuộc.
- Không đánh giá khả năng làm việc với dev/PO (SDET cần giao tiếp nhiều).


### Ví dụ đời thực
Một công ty tuyển SDET bằng câu hỏi lý thuyết Selenium và bài tập về nhà 6 tiếng: 40% ứng viên bỏ ở bước bài tập, hai người được tuyển đều viết test có sleep cứng và không biết cách cô lập dữ liệu. Quy trình mới: vòng 1 (60 phút) live coding viết 2–3 test API bằng REST Assured cho endpoint đăng ký có sẵn, gồm trường hợp email trùng; vòng 2 (45 phút) đọc một test flaky có thật (đã ẩn thông tin) và tìm nguyên nhân; vòng 3 thảo luận chiến lược test cho tính năng chuyển tiền và cách làm việc với dev. Chấm theo rubric 5 tiêu chí, mỗi tiêu chí 1–4 điểm, hai người phỏng vấn chấm độc lập rồi so sánh. Tỉ lệ ứng viên hoàn thành quy trình lên 85%; sau 1 năm, cả 3 người được tuyển đều đạt đánh giá tốt.

### Trả lời mẫu khi phỏng vấn
"Tôi đánh giá SDET ở ba mặt: tư duy kiểm thử, kỹ năng code và cách làm việc với dev. Về tư duy, tôi đưa một tính năng như chuyển tiền và hỏi họ sẽ test gì, ưu tiên gì, ở tầng nào; ứng viên tốt nghĩ ngay tới case biên, đồng thời, idempotency, không chỉ đường thành công. Về code, tôi cho live coding ngắn khoảng một giờ: viết vài test API cho một endpoint có sẵn, và đọc một test flaky có thật để tìm nguyên nhân; tôi xem cách họ assert, cô lập dữ liệu và chờ đúng cách. Tôi tránh bài tập về nhà quá dài vì làm mất ứng viên giỏi. Về hợp tác, tôi hỏi tình huống bất đồng với dev về một bug. Mỗi tiêu chí có rubric rõ ràng, hai người chấm độc lập để giảm thiên kiến. Tôi chọn người có tư duy rủi ro và biết hợp tác hơn người thuộc nhiều công cụ."

> Senior tip: SDET tốt không phải người viết nhiều script nhất, mà là người giúp team giảm rủi ro phát hành bằng code chất lượng. Hãy chọn người có tư duy test và khả năng hợp tác, không chỉ biết chạy công cụ.`,
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




,
{
  id: 'autotest-036',
  topic: 'autotest',
  level: 'mid',
  q: 'Trong kiến trúc microservices (nhiều dịch vụ nhỏ giao tiếp qua mạng), bạn test ở mức service nào? Môi trường ephemeral (tạm thời, tạo theo từng PR – Pull Request, yêu cầu gộp code) giúp gì và cần lưu ý gì?',
  a: `**Tóm tắt:** Microservices (kiến trúc chia ứng dụng thành nhiều dịch vụ nhỏ, độc lập, nói chuyện qua HTTP/gRPC hoặc message) làm cho "test cả hệ thống" tốn kém và mong manh. Cách thực dụng là phân tầng: **unit test** trong từng service, **integration test** gắn với DB/broker của service đó (thường dùng Testcontainers – thư viện tạo container tạm), **contract test** kiểm tra "hợp đồng" API/message giữa hai service mà không cần chạy cả hai, và chỉ giữ một số ít **E2E** xuyên nhiều service cho luồng quan trọng. **Môi trường ephemeral theo PR** là môi trường test được tạo tự động cho mỗi PR rồi huỷ khi PR đóng – giúp kiểm thử gần thật, cô lập thay đổi, nhưng cần kiểm soát chi phí, dữ liệu và thời gian khởi tạo.

### Bối cảnh thật: vì sao test "full stack" mãi không ổn
Một hệ thống thương mại có 6 service: gateway, user, catalog, order, payment, notification. Nếu mỗi lần PR ở order đều dựng đủ 6 service + 3 DB + Kafka (hệ thống hàng đợi thông điệp) + Redis (bộ nhớ đệm nhanh) trên một môi trường chung, bạn sẽ gặp: test chờ nhau, dữ liệu rác từ PR khác, một service khác đang deploy dở làm test bạn đỏ. Kết quả: đội ngũ mất niềm tin vào test.

### Test ở mức service nào
| Mức | Phạm vi | Mục tiêu | Công cụ gợi ý (Java) |
|---|---|---|---|
| Unit | 1 class/hàm trong service | Logic đúng, nhanh (ms) | JUnit 5, Mockito |
| Integration (trong service) | Service + DB/broker thật (cô lập) | Mapping, query, cấu hình chạy được | Spring Boot Test, Testcontainers (Postgres/Kafka container tạm) |
| Contract | Biên giao tiếp giữa consumer và provider | Thay đổi API/message không làm vỡ bên kia | Pact (consumer/provider), Spring Cloud Contract |
| Component/Service-in-isolation | 1 service chạy, phụ thuộc ngoài bị giả lập | Luồng HTTP của service đúng | WireMock/MockServer giả API ngoài, Testcontainers cho DB |
| E2E xuyên service | Vài service phối hợp (ít luồng) | Luồng nghiệp vụ quan trọng end-to-end | Playwright cho UI, RestAssured cho API, chạy trên môi trường tích hợp kiểm soát |

Quy tắc ngón tay cái (không tuyệt đối): càng nhiều test ở tầng thấp (nhanh, ổn định), càng ít ở tầng cao. Hình kim tự tháp: unit nhiều, integration vừa, E2E ít.

### Contract test là gì (giải thích gốc)
**Contract test** (kiểm thử hợp đồng) giống hai bên ký thoả thuận: "tôi (order service, consumer) sẽ gọi {{GET /users/:id}} và mong nhận các trường {{id, name, status}}". Contract test biến thoả thuận đó thành bài test tự động. Consumer sinh ra file contract từ kỳ vọng của mình; provider chạy verify contract đó mà **không cần** consumer chạy cùng lúc. Nhờ vậy, khi provider đổi response (ví dụ bỏ trường {{status}}), CI của provider đỏ ngay trước khi deploy – dù order service chưa được dựng lên.

~~~text
Consumer (order)                Provider (user)
  viết kỳ vọng  --sinh-->  contract.json  --verify-->  provider CI fail nếu vi phạm
  (không cần user chạy)                          (không cần order chạy)
~~~

### Môi trường ephemeral theo PR
**Ephemeral environment** (môi trường tạm): khi mở PR, pipeline (CI/CD – quy trình tự động build/test/deploy) tạo một bản triển khai cô lập (thường bằng Kubernetes namespace tạm hoặc docker-compose trên runner), chạy migration, seed dữ liệu tối thiểu, rồi chạy smoke/E2E nhắm vào URL tạm đó. PR merge/đóng thì huỷ.

~~~seq
title: Môi trường ephemeral cho mỗi PR
actors: Dev | CI | Cluster | Test Runner
Dev -> CI: mở/cập nhật PR
CI -> Cluster: tạo namespace pr-123, deploy service thay đổi
Cluster --> CI: trả URL tạm (https://pr-123.example.test)
CI -> Test Runner: chạy smoke/API/E2E nhắm URL tạm
Test Runner --> CI: kết quả (pass/fail + artifact)
CI -> Cluster: huỷ namespace pr-123 khi PR đóng
~~~

Lợi ích: cô lập giữa các PR, test gần production hơn mock thuần, reviewer có link để thử tay. Lưu ý thực tế:
- **Chi phí và quota**: mỗi PR tốn CPU/RAM/cluster; đặt giới hạn số PR song song, tự động huỷ khi nhàn, dùng image nhẹ.
- **Thời gian khởi tạo**: dựng DB, chạy migration, chờ service healthy có thể mất vài phút; cân nhắc chỉ chạy smoke trên PR, full E2E chạy nightly.
- **Dữ liệu**: seed bộ dữ liệu tối thiểu, xác định (không dùng dữ liệu production thật chưa che – xem {{autotest-037}}); reset sạch mỗi lần.
- **Phụ thuộc ngoài**: payment gateway, email bên thứ ba – thường mock/stub ở biên, nếu không ephemeral vẫn mong manh.
- **Bảo mật**: URL tạm không lộ ra public không kiểm soát; secret dùng giá trị test, không secret production.

### Lỗi hay gặp
- Coi contract test là "optional" rồi chỉ dựa E2E xuyên 6 service → feedback chậm, flaky cao.
- Ephemeral dựng "gần đủ" nhưng dùng chung một DB với PR khác → dữ liệu đụng nhau, test ngẫu nhiên đỏ.
- Không đặt thời gian sống (TTL) cho namespace tạm → cụm đầy tài nguyên sau vài tuần.

### Trả lời phỏng vấn thế nào
Nêu kim tự tháp theo mức service, giải thích contract test giải quyết bài toán phối hợp giữa team mà không cần tích hợp toàn bộ. Với ephemeral: mô tả luồng PR → dựng → test → huỷ, rồi nêu 3 lưu ý: chi phí/TTL, dữ liệu seed cô lập, phụ thuộc ngoài cần mock.

> Senior tip: Đừng nhắm "100% E2E". Với microservices, mục tiêu là mỗi service tự tin deploy độc lập: contract test giữ biên ổn, integration trong service giữ lõi đúng, còn E2E chỉ canh vài hành trình tiền/doanh thu. Ephemeral là đòn bẩy tốt nếu bạn kiểm soát được chi phí và dữ liệu.`,
  follow: [
    'Phân biệt contract test (Pact/Spring Cloud Contract) với integration test dùng WireMock, mỗi loại bắt được lỗi gì?',
    'Khi một PR chỉ sửa UI, bạn có dựng ephemeral cho cả backend không? Cân nhắc thế nào?',
    'Làm sao seed dữ liệu cho ephemeral mà vẫn nhanh và lặp lại được (deterministic)?'
  ],
  refs: [
    { type: 'article', title: 'The Practical Test Pyramid (Ham Vocke / Martin Fowler site)', url: 'https://martinfowler.com/articles/practical-test-pyramid.html' },
    { type: 'article', title: 'Consumer-Driven Contracts (Martin Fowler)', url: 'https://martinfowler.com/articles/consumerDrivenContracts.html' },
    { type: 'doc', title: 'Pact - Introduction', url: 'https://docs.pact.io/' },
    { type: 'doc', title: 'Testcontainers for Java', url: 'https://java.testcontainers.org/' }
  ]
}


,
{
  id: 'autotest-037',
  topic: 'autotest',
  level: 'mid',
  q: 'Làm sao test tự động làm việc với dữ liệu nhạy cảm (PII – thông tin định danh cá nhân, mật khẩu, token)? Khi staging (môi trường tiền production) dùng dữ liệu giống production, bạn áp dụng masking (che/ẩn) như thế nào?',
  a: `**Tóm tắt:** Dữ liệu nhạy cảm (PII như tên, email, số điện thoại, CMND; bí mật như mật khẩu, token, khóa API) **không được** để lộ trong code test, repo, log, screenshot hay artifact CI. Nguyên tắc: dùng **dữ liệu giả (synthetic)** cho phần lớn test; khi bắt buộc dùng dữ liệu "giống production" trên staging, phải **masking/ẩn danh** (biến đổi để không còn nhận dạng người thật) và kiểm soát truy cập. Automation cần được thiết kế để không vô tình in/ghi bí mật (lọc log, tắt ghi header nhạy trong trace, dùng secret manager).

### Thuật ngữ gốc
- **PII** (Personally Identifiable Information): dữ liệu có thể nhận ra một người cụ thể (họ tên, email cá nhân, SĐT, địa chỉ, số giấy tờ). Ví dụ đời thường: danh bạ điện thoại là PII.
- **Staging**: môi trường gần giống production để kiểm thử trước khi phát hành thật.
- **Masking/ẩn danh**: thay giá trị thật bằng giá trị giả nhưng vẫn giữ hình dạng/hành vi dữ liệu (email vẫn có dạng email, số vẫn đúng độ dài) để test chạy được mà không lộ người thật.
- **Secret**: mật khẩu, token, API key – nếu lộ có thể truy cập hệ thống.

### Phân loại dữ liệu dùng trong test
| Loại | Ví dụ | Dùng ở đâu | Rủi ro |
|---|---|---|---|
| Synthetic (giả) | {{user+uuid@example.test}}, tên "Nguyen Van A Test" | Unit, integration, đa số E2E | Thấp nếu sinh đúng format |
| Masked từ prod | Email hash + domain test, SĐT thay số | Staging khi cần phân bố dữ liệu thật | Còn rủi ro nếu masking yếu |
| Prod thật (chưa che) | Bản sao DB production nguyên bản | **Tránh** cho automation thường ngày | Cao: lộ PII, vi phạm chính sách/pháp lý |

### Masking dữ liệu giống production: cách làm từng bước
1. **Xác định trường nhạy** (data classification): email, phone, địa chỉ, số tài khoản, ghi chú tự do (có thể chứa PII), token.
2. **Chọn chiến lược che** theo từng trường:
   - Thay thế cố định theo format: {{090xxxx123}} → {{090000000}} (giữ độ dài) hoặc sinh số giả hợp lệ.
   - Băm một chiều có muối (salted hash) cho định danh cần ổn định giữa các bảng (cùng user_id giả khớp FK) nhưng không đảo ngược ra người thật.
   - Null/giá trị mẫu cho trường không cần trong test.
   - Giữ nguyên dữ liệu **không nhạy** nhưng quan trọng cho logic (trạng thái đơn, phân bố số tiền) để test còn ý nghĩa.
3. **Thực hiện ngoài môi trường dev cá nhân**: quy trình tạo bản staging từ prod chạy trong vùng kiểm soát, chỉ vai trò được phép mới truy cập nguồn; kết quả là DB staging đã che.
4. **Kiểm chứng**: quét mẫu (regex email/SĐT/CMND), đếm tỉ lệ trường còn giá trị dạng thật; test tự động **không** được assert vào PII thật.

~~~java
// Ví dụ sinh dữ liệu giả trong test (không lấy từ prod)
String email = "qa+" + java.util.UUID.randomUUID() + "@example.test";
String phone = "0900000" + (100 + new java.util.Random().nextInt(900));
~~~

### Bảo vệ bí mật trong automation
- **Không hard-code** mật khẩu/token trong source. Lấy từ **secret manager** hoặc biến môi trường do CI cấp. Trong code chỉ đọc {{System.getenv("TEST_USER_PASS")}}.
- **Log**: không in token; logger phải cấu hình che mẫu nhạy.
- **Artifact** (trace/video/screenshot – {{autotest-035}}): có thể chứa form đã điền PII hoặc header {{Authorization}}. Giảm thiểu: dùng tài khoản test chuyên dụng, hạn chế ghi header nhạy, rà soát trước khi chia sẻ artifact.
- **Repo**: bật quét secret (gitleaks/git-secrets) trong CI để chặn commit lộ khóa.

### Bảng trade-off
| Cách | Ưu | Nhược | Khi dùng |
|---|---|---|---|
| Synthetic hoàn toàn | An toàn, lặp lại được | Có thể lệch phân bố dữ liệu thật | Mặc định cho hầu hết test |
| Masked từ prod | Phân bố/ca hiếm giống thật | Quy trình che phức tạp, vẫn có rủi ro sót | Staging cho một số luồng cần độ thật |
| Subset prod có kiểm soát chặt | Rất sát thật | Rủi ro pháp lý/riêng tư cao | Hạn chế tối đa, cần phê duyệt rõ |

### Lỗi hay gặp
- Dùng email/SĐT thật của đồng nghiệp trong data test "cho tiện" → PII lọt vào repo/log.
- In toàn bộ response body có chứa token vào báo cáo test.
- Nghĩ staging "nội bộ nên không sao" rồi restore prod chưa che – staging thường có nhiều người truy cập hơn bạn tưởng.

### Trả lời phỏng vấn thế nào
Nêu nguyên tắc: synthetic by default, masked khi cần giống prod. Giải thích masking giữ format/quan hệ (FK) nhưng bỏ khả năng nhận dạng. Liệt kê điểm rò rỉ đặc thù của automation: code, log, trace/screenshot, biến môi trường – và cách chặn từng điểm.

> Senior tip: Hãy coi "dữ liệu test" là tài sản cần vòng đời như code: ai tạo, ai được đọc, lưu bao lâu, huỷ thế nào. Một ca lộ PII qua artifact CI có thể nghiêm trọng hơn một test đỏ. Tự động hoá kiểm tra (quét secret, quét mẫu PII trong log) rẻ hơn nhiều so với xử lý sự cố.`,
  follow: [
    'Bạn phân biệt masking, pseudonymization (giả danh có thể ánh xạ lại có kiểm soát) và anonymization (ẩn danh không đảo ngược) trong ngữ cảnh test thế nào?',
    'Làm sao để trace Playwright không ghi lại giá trị ô mật khẩu hoặc header Authorization?',
    'Khi test cần xác minh email/SMS OTP, bạn thiết kế mà không dùng hộp thư/SĐT thật của người dùng ra sao?'
  ],
  refs: [
    { type: 'doc', title: 'OWASP - Logging Cheat Sheet (tránh lộ dữ liệu nhạy)', url: 'https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html' },
    { type: 'doc', title: 'OWASP - Secrets Management Cheat Sheet', url: 'https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html' },
    { type: 'article', title: 'Object Mother (Martin Fowler bliki - liên quan test data)', url: 'https://martinfowler.com/bliki/ObjectMother.html' }
  ]
},
{
  id: 'autotest-038',
  topic: 'autotest',
  level: 'mid',
  q: 'Playwright hỗ trợ component testing và API testing bên cạnh E2E. Bạn kết hợp chúng thế nào và mock backend để test frontend (FE) độc lập ra sao?',
  a: `**Tóm tắt:** Không phải kiểm thử giao diện nào cũng cần mở cả trình duyệt chạy qua toàn bộ hệ thống. **Component testing** (kiểm thử thành phần) dựng và kiểm tra một mảnh UI trong môi trường cô lập; **API testing** gọi trực tiếp endpoint HTTP để kiểm tra hợp đồng/phản hồi mà không cần UI; **E2E** (end-to-end) đi qua luồng thật từ UI xuống backend. Để test FE độc lập, bạn **mock backend** (giả lập phản hồi API) bằng {{page.route()}} (chặn request trong trình duyệt) hoặc chạy FE chống một API giả. Cách kết hợp tốt: logic hiển thị/tương tác nhỏ → component/API-level, luồng nghiệp vụ quan trọng xuyên lớp → E2E có chọn lọc.

### Ba mức (giải thích gốc)
- **Component**: giống kiểm tra "một linh kiện" (ví dụ form đăng nhập) rời khỏi chiếc máy. Bạn truyền props/trạng thái, xác nhận render và hành vi. Chạy nhanh hơn E2E vì không cần toàn app + backend thật.
- **API testing**: gửi request HTTP (GET/POST/...) và assert status/body/header. Kiểm tra backend hoặc hợp đồng mà không vẽ UI. Playwright có {{APIRequestContext}} để gọi API.
- **E2E UI**: mở trang thật, thao tác như người dùng, có thể đi qua FE + BE + DB.

### So sánh nhanh
| Mức | Tốc độ | Độ tin cậy | Bắt lỗi gì | Phụ thuộc backend thật |
|---|---|---|---|---|
| Component | Nhanh | Cao (cô lập) | Render, tương tác cục bộ, trạng thái UI | Không (mock props/callback) |
| API | Nhanh-vừa | Cao | Status, schema, lỗi nghiệp vụ API | Có thể có (hoặc mock server) |
| E2E UI | Chậm hơn | Dễ flaky hơn | Luồng xuyên lớp, tích hợp thật | Thường có |

### Kết hợp trong thực tế (chiến lược)
Ví dụ tính năng "đặt hàng":
- Component: bộ chọn địa chỉ hiển thị đúng, validate form, nút disable khi thiếu trường.
- API: {{POST /orders}} trả 201 với body hợp lệ, trả 400 khi thiếu {{itemId}}, trả 409 khi hết hàng.
- E2E: một luồng "chọn sản phẩm → thanh toán → thấy xác nhận" trên môi trường tích hợp (ít ca, dữ liệu kiểm soát).

~~~seq
title: Phân tầng kiểm thử FE và API
actors: Dev | Component test | API test | E2E (Playwright UI)
Dev -> Component test: kiểm tra render/tương tác cô lập
Dev -> API test: kiểm tra endpoint và hợp đồng
Dev -> E2E (Playwright UI): kiểm tra luồng quan trọng xuyên lớp
Component test --> Dev: feedback rất nhanh
API test --> Dev: feedback nhanh
E2E (Playwright UI) --> Dev: feedback chậm hơn nhưng sát thật
~~~

### Mock backend để test FE độc lập
Cách 1: **{{page.route()}}** trong Playwright – chặn request từ trình duyệt và trả response giả. Phù hợp khi test UI cần kịch bản lỗi (500), hoặc khi backend chưa xong.

~~~java
page.route("**/api/profile", route -> route.fulfill(
    new com.microsoft.playwright.Route.FulfillOptions()
        .setStatus(500)
        .setContentType("application/json")
        .setBody("{\"message\":\"Loi tam\"}")
));
page.navigate("https://app.test/account");
com.microsoft.playwright.assertions.PlaywrightAssertions
    .assertThat(page.getByTestId("error-banner")).isVisible();
~~~

Cách 2: FE trỏ {{baseURL}} API tới một **mock server** (WireMock/MockServer). Ưu điểm: tái dùng stub cho nhiều loại test.

Cách 3: API testing bằng {{playwright.request()}} ({{APIRequestContext}}) để gọi thẳng backend.

~~~java
com.microsoft.playwright.APIRequestContext api = playwright.request().newContext();
com.microsoft.playwright.APIResponse res = api.get("https://staging.test/api/health");
org.junit.jupiter.api.Assertions.assertEquals(200, res.status());
~~~

### Lưu ý với Playwright component testing
Playwright có khả năng component testing (phổ biến trong hệ Node/JS). Với **Playwright for Java**, trọng tâm thực hành thường là E2E UI + {{APIRequestContext}} + {{page.route}}; component test của framework FE (React/Vue) thường chạy bằng công cụ của hệ sinh thái đó. Khi trả lời, nêu rõ: chọn công cụ component test phù hợp stack FE, còn Playwright (Java) mạnh ở E2E và kiểm thử tích hợp trình duyệt.

### Lỗi hay gặp
- Mock mọi API trong E2E rồi tuyên bố "hệ thống hoạt động" – thực ra chỉ chứng minh FE render theo JSON giả.
- Pattern {{route("**/*")}} chặn luôn tài nguyên tĩnh → trang trắng; chỉ chặn endpoint cần thiết.
- Dùng API test thay hoàn toàn UI test cho luồng có logic trình duyệt (redirect, cookie, CORS hiển thị).

### Trả lời phỏng vấn thế nào
Giải thích mục đích từng mức và tiêu chí chọn. Nêu {{page.route}} để mock có chủ đích (ca lỗi, backend chưa sẵn sàng) và nhấn mạnh giữ một tập E2E nhỏ chạy tích hợp thật. Thể hiện bạn hiểu trade-off: cô lập nhanh nhưng có thể lệch thực tế.

> Senior tip: Hãy đặt câu hỏi "lỗi này tầng nào bắt rẻ nhất?" trước khi viết E2E. Một bug validate hiển thị bắt ở component test mất giây; bắt ở E2E tốn phút và hay flaky. E2E dành cho niềm tin tích hợp, không dành cho mọi nhánh if của UI.`,
  follow: [
    'Khi mock bằng {{page.route}}, làm sao tránh test "xanh" nhưng contract thực tế giữa FE và BE đã đổi?',
    'Bạn tổ chức test API ({{APIRequestContext}}) và test UI trong cùng project Playwright Java thế nào?',
    'Trường hợp nào bạn chấp nhận E2E phụ thuộc backend thật dù chậm hơn?'
  ],
  refs: [
    { type: 'doc', title: 'API testing (Playwright Java)', url: 'https://playwright.dev/java/docs/api-testing' },
    { type: 'doc', title: 'Mock APIs (network) (Playwright Java)', url: 'https://playwright.dev/java/docs/mock' },
    { type: 'doc', title: 'Component testing (Playwright - khái niệm)', url: 'https://playwright.dev/docs/test-components' },
    { type: 'article', title: 'The Practical Test Pyramid (Ham Vocke)', url: 'https://martinfowler.com/articles/practical-test-pyramid.html' }
  ]
}


,
{
  id: 'autotest-039',
  topic: 'autotest',
  level: 'senior',
  q: 'Accessibility testing (kiểm thử khả năng tiếp cận, ví dụ cho người dùng trình đọc màn hình) tự động với axe-core và Playwright: bạn làm ở mức cơ bản thế nào, tích hợp ra sao, và giới hạn là gì?',
  a: `**Tóm tắt:** **Accessibility** (a11y – khả năng tiếp cận) nghĩa là giao diện dùng được bởi nhiều người hơn, kể cả người dùng bàn phím, trình đọc màn hình (screen reader) hoặc thị lực hạn chế (ví dụ: nút có nhãn, đủ tương phản màu, cấu trúc heading hợp lý). **axe-core** là thư viện quy tắc tự động phát hiện một số vi phạm a11y phổ biến. Kết hợp với Playwright, bạn tiêm axe vào trang rồi chạy quét để lấy danh sách vi phạm. Mức cơ bản: quét trang/trạng thái chính trong CI, chặn lỗi nghiêm trọng, tạo báo cáo. **Giới hạn quan trọng**: tự động chỉ bắt được một phần (thường chưa tới một nửa vấn đề thực); trải nghiệm thật vẫn cần đánh giá thủ công và kiểm thử với công nghệ hỗ trợ.

### Bối cảnh thật
Sản phẩm có form đăng ký: ô nhập không gắn {{<label>}}, nút icon không có tên truy cập, màu chữ xám nhạt trên nền trắng. Người dùng chuột vẫn dùng được; người dùng trình đọc màn hình có thể không biết ô đó là gì. Automation với axe giúp phát hiện sớm các lỗi dạng này mỗi lần PR, thay vì chờ phản hồi muộn.

### Cách tích hợp ở mức cơ bản (ý tưởng)
1. Thêm phụ thuộc tích hợp axe cho Playwright (trong hệ Java thường dùng thư viện cầu nối để chạy script axe trong ngữ cảnh trang; nguyên lý chung giống nhau).
2. Ở các trang/trạng thái quan trọng (trang chủ, form chính, bước checkout), sau khi trang ổn định: tiêm axe → chạy analyze → lấy violations.
3. Lọc theo mức độ (serious/critical) để quyết định fail build hay chỉ cảnh báo.
4. Lưu báo cáo (JSON/HTML) làm artifact CI.

~~~java
// Pseudocode ý tưởng (API cụ thể phụ thuộc thư viện tích hợp bạn chọn)
page.navigate("https://app.test/signup");
// 1) inject axe-core script vào page
// 2) chạy axe.run() trong page context
// 3) đọc violations và assert không có lỗi nghiêm trọng
// if (!criticalViolations.isEmpty()) fail("A11y issues: " + criticalViolations);
~~~

~~~seq
title: Quét a11y tự động trong test
actors: Playwright test | Page (browser) | axe-core
Playwright test -> Page (browser): navigate tới trạng thái cần kiểm tra
Playwright test -> axe-core: tiêm và chạy analyze trên DOM
axe-core --> Playwright test: danh sách violations (rule, impact, node)
Playwright test -> Playwright test: fail nếu có critical/serious (tuỳ ngưỡng)
~~~

### Những gì tự động bắt khá tốt (ví dụ điển hình)
- Thiếu {{alt}} cho ảnh có ý nghĩa, thiếu nhãn cho input.
- Vi phạm tương phản màu (một số trường hợp đo được).
- Cấu trúc ARIA/role sai cơ bản, id trùng gây nhầm tham chiếu.
- Một số vấn đề heading/landmark.

### Giới hạn (bắt buộc phải nói khi phỏng vấn)
- **Không chứng minh trang "đạt chuẩn đầy đủ"** (ví dụ WCAG). Tự động chỉ kiểm một tập quy tắc hữu hạn.
- Không đánh giá được **chất lượng nội dung** nhãn (nhãn có đúng nghĩa không), **thứ tự đọc** có hợp lý trong ngữ cảnh, hay **trải nghiệm bàn phím** mượt trên luồng phức tạp.
- Kết quả phụ thuộc **trạng thái trang** lúc quét: modal chưa mở, lỗi chưa hiện → vi phạm tiềm ẩn không bị thấy. Cần quét nhiều trạng thái.
- Có thể có false positive/negative; cần review, không tắt rule bừa.

### Chiến lược thực dụng
| Bước | Hành động |
|---|---|
| Chọn phạm vi | 5–10 trang/luồng quan trọng (đăng nhập, form chính, checkout) |
| Chọn ngưỡng | Fail CI với {{critical/serious}}; {{moderate/minor}} ghi cảnh báo/ticket |
| Nhiều trạng thái | Quét sau khi mở modal, sau khi hiện lỗi validate, ở viewport mobile nếu cần |
| Kết hợp thủ công | Checklist bàn phím, thử 1–2 luồng với screen reader định kỳ |

### Lỗi hay gặp
- Chỉ quét trang chủ đã đăng xuất → bỏ lỡ form quan trọng sau đăng nhập.
- Thấy violations nhiều quá rồi tắt toàn bộ kiểm tra → mất lưới an toàn; nên xử lý dần theo mức ưu tiên.
- Tin rằng "axe pass = accessible" → hiểu sai giới hạn.

### Trả lời phỏng vấn thế nào
Giải thích a11y là cho người dùng thật (kể cả công nghệ hỗ trợ). Mô tả cách gắn axe vào Playwright flow: navigate → inject/analyze → assert theo impact. Nhấn mạnh giới hạn tự động và nêu bổ sung thủ công/đa trạng thái. Thể hiện thái độ thực tế: cải thiện dần, ưu tiên lỗi nghiêm trọng.

> Senior tip: Đưa a11y vào cùng pipeline với functional test, nhưng bắt đầu nhỏ (vài trang, chỉ serious/critical). Thành công đo bằng "ít hồi quy a11y nghiêm trọng" và phản hồi người dùng, không phải con số violations về 0 bằng cách nới rule.`,
  follow: [
    'Bạn chọn trạng thái nào của trang để quét (sau login, modal mở, lỗi hiển thị) để tránh bỏ sót?',
    'Khác nhau giữa role/name của phần tử (trình đọc màn hình dùng) và CSS selector (test dùng) là gì?',
    'Khi axe báo false positive, quy trình team bạn xử lý (sửa, annotate, hay ngoại lệ có chủ đích) ra sao?'
  ],
  refs: [
    { type: 'doc', title: 'axe-core (Deque) - Accessibility testing engine', url: 'https://github.com/dequelabs/axe-core' },
    { type: 'doc', title: 'W3C - WCAG Overview', url: 'https://www.w3.org/WAI/standards-guidelines/wcag/' },
    { type: 'doc', title: 'Playwright - Accessibility testing', url: 'https://playwright.dev/docs/accessibility-testing' }
  ]
},
{
  id: 'autotest-040',
  topic: 'autotest',
  level: 'senior',
  q: 'Làm sao tự động test i18n (đa ngôn ngữ), múi giờ (timezone) và định dạng tiền tệ trong ứng dụng? Những ca nào dễ vỡ và bạn thiết kế test ra sao?',
  a: `**Tóm tắt:** Ứng dụng phục vụ nhiều vùng dễ sai ở những chỗ "trông nhỏ": chuỗi dịch thiếu/không khớp placeholder, ngày giờ hiển thị lệch múi giờ hoặc đổi ngày sai, số tiền format sai dấu phân tách/thập phân/ký hiệu. Để test tự động: (1) **i18n** – kiểm tra key dịch tồn tại, UI hiển thị đúng locale, placeholder được thay thế, độ dài không làm vỡ layout; (2) **timezone** – cố định timezone của dữ liệu đầu vào (lưu UTC) và assert hiển thị theo locale/múi giờ mục tiêu, chọn ca biên (chuyển ngày, DST); (3) **tiền tệ** – dùng kiểu tiền chuẩn (tránh float), assert format theo locale (ví dụ {{1.234,56 ₫}} vs {{$1,234.56}}) và giá trị làm tròn đúng. Thiết kế test phải tách "dữ liệu chuẩn" khỏi "hiển thị theo locale".

### Thuật ngữ gốc
- **i18n** (internationalization): thiết kế hệ thống để hỗ trợ nhiều ngôn ngữ/vùng mà không sửa code lõi. **l10n** (localization) là nội dung/bản dịch cụ thể cho từng vùng.
- **Locale**: định danh vùng + ngôn ngữ (ví dụ {{vi-VN}}, {{en-US}}) ảnh hưởng cách format ngày, số, tiền.
- **Timezone** (múi giờ): ví dụ {{Asia/Ho_Chi_Minh}} (UTC+7). **UTC** là mốc thời gian chuẩn; dữ liệu thường lưu UTC, hiển thị theo múi giờ người dùng.
- **DST** (Daylight Saving Time – giờ mùa hè): một số vùng dịch đồng hồ theo mùa, tạo ca "giờ không tồn tại" hoặc "lặp giờ".

### 1) Test i18n (đa ngôn ngữ)
Bối cảnh: trang checkout có nhãn "Thanh toán", thông báo lỗi "Vui lòng nhập {field}". Khi thêm locale {{en-US}} mà quên key, UI hiện {{checkout.pay.button}} (key thô) – xấu và gây nhầm.

Cách test:
- **Kiểm tra bộ key**: (thường là unit test phía resource) đảm bảo mọi key trong locale mặc định có mặt ở locale khác, placeholder ({{field}}) khớp.
- **Kiểm tra UI theo locale**: với Playwright, mở app với locale mong muốn (cấu hình context {{locale}}) và assert text hiển thị.

~~~java
// Playwright Java: tạo context với locale cụ thể
com.microsoft.playwright.BrowserContext ctx = browser.newContext(
    new com.microsoft.playwright.Browser.NewContextOptions().setLocale("en-US"));
com.microsoft.playwright.Page page = ctx.newPage();
page.navigate("https://app.test/checkout");
com.microsoft.playwright.assertions.PlaywrightAssertions
    .assertThat(page.getByTestId("pay-btn")).hasText("Pay now");
ctx.close();
~~~

Ca dễ vỡ: text dài hơn (tiếng Đức thường dài hơn tiếng Anh) làm tràn nút; số nhiều (pluralization: 1 item vs 2 items); chuỗi ghép nối sai ngữ pháp.

### 2) Test múi giờ (timezone)
Nguyên tắc: backend lưu thời điểm ở **UTC** (hoặc kiểu có offset), UI chuyển sang múi giờ hiển thị. Bug kinh điển: cộng trừ giờ thủ công bằng số nguyên → sai khi qua nửa đêm hoặc DST.

Cách test:
- Chọn một thời điểm UTC cố định làm input (ví dụ {{2026-01-01T17:30:00Z}}).
- Với người dùng ở {{Asia/Ho_Chi_Minh}} (UTC+7) → kỳ vọng hiển thị {{02/01/2026 00:30}} (đã sang ngày mới).
- Với {{America/New_York}} → kỳ vọng theo EST/EDT tương ứng.
- Ca biên: ngay trước/sau nửa đêm; ngày chuyển DST (nếu sản phẩm phục vụ vùng có DST).

~~~java
// Ý tưởng: seed dữ liệu với timestamp UTC cố định, assert UI theo locale/timezone
// 2026-01-01T17:30:00Z -> ở VN (UTC+7) là 00:30 ngày 02/01/2026
String utcInstant = "2026-01-01T17:30:00Z";
// ... tạo bản ghi dùng utcInstant, mở UI với timezone VN, assert text ngày/giờ ...
~~~

Trong Playwright có thể set {{timezoneId}} trong context để trình duyệt render theo múi giờ mong muốn.

~~~java
com.microsoft.playwright.BrowserContext ctx = browser.newContext(
    new com.microsoft.playwright.Browser.NewContextOptions()
        .setLocale("vi-VN")
        .setTimezoneId("Asia/Ho_Chi_Minh"));
~~~

### 3) Test định dạng tiền
Nguyên tắc dữ liệu: tiền dùng số nguyên (đơn vị nhỏ nhất, ví dụ xu/cents) hoặc {{BigDecimal}} – **không dùng {{float/double}}** vì lỗi làm tròn nhị phân.

Hiển thị theo locale:
| Locale | Ví dụ (cùng giá trị 1234567 VND hoặc 1234.56 USD) | Ghi chú |
|---|---|---|
| {{vi-VN}} | {{1.234.567 ₫}} | dấu chấm nhóm nghìn, {{₫}} |
| {{en-US}} | {{$1,234.56}} | dấu phẩy nhóm nghìn, chấm thập phân |

Test: cung cấp giá trị chuẩn (số), assert chuỗi hiển thị đúng theo locale. Ca biên: 0, số âm, số rất lớn, làm tròn (2 chữ số thập phân hay 0 tuỳ tiền tệ).

### Thiết kế test tổng hợp
- **Tách lớp**: unit test format tiền/ngày (hàm thuần) với nhiều locale; E2E chỉ kiểm vài màn hình đại diện với locale chính.
- **Dữ liệu cố định**: timestamp/số tiền cố định, không dùng "giờ hiện tại" (gây flaky).
- **Ma trận tối thiểu**: chọn 2–3 locale chiến lược (vi-VN, en-US, và 1 locale có DST nếu liên quan) thay vì mọi locale trên mọi test.

### Lỗi hay gặp
- So sánh chuỗi ngày giờ hard-code mà không set {{timezoneId/locale}} của context → pass trên máy dev (VN) nhưng fail trên CI (UTC).
- Assert tiền bằng {{double}} ({{0.1 + 0.2}}) → sai lẻ; dùng {{BigDecimal}} hoặc integer cents.
- Chỉ test locale mặc định → bản dịch thiếu/placeholder vỡ ở locale khác không bị phát hiện.

### Trả lời phỏng vấn thế nào
Trình bày 3 trục (i18n, timezone, tiền) với nguyên tắc: dữ liệu chuẩn (UTC, kiểu tiền chính xác) tách khỏi hiển thị (locale/timezone). Nêu công cụ: Playwright {{locale/timezoneId}}, test hàm format ở unit level, chọn ca biên (qua ngày, DST, làm tròn). Nhấn mạnh tránh phụ thuộc thời gian/môi trường hiện tại.

> Senior tip: Hãy có một "bộ ca biên thời gian/tiền" dùng chung (cross-midnight, DST transition, 0/âm/lớn, làm tròn) và chạy nó như unit test nhanh. E2E chỉ cần chứng minh wiring locale trên vài trang. Đừng nhân ma trận (mọi locale × mọi trang) nếu không có rủi ro tương ứng.`,
  follow: [
    'Tại sao lưu thời gian ở UTC còn hiển thị theo timezone người dùng, thay vì lưu giờ địa phương?',
    'Làm sao test pluralization (1 sản phẩm / 2 sản phẩm) và chuỗi có biến (placeholder) cho nhiều ngôn ngữ?',
    'Nếu app dùng thư viện format (ICU/MessageFormat), bạn test ở mức thư viện hay mức UI?'
  ],
  refs: [
    { type: 'doc', title: 'Playwright - Emulation (locale, timezone)', url: 'https://playwright.dev/java/docs/emulation' },
    { type: 'doc', title: 'ICU - Formatting Dates and Times', url: 'https://unicode-org.github.io/icu/userguide/format_parse/datetime/' },
    { type: 'doc', title: 'Java - BigDecimal (tránh lỗi làm tròn tiền)', url: 'https://docs.oracle.com/en/java/javase/17/docs/api/java.base/java/math/BigDecimal.html' }
  ]
},
{
  id: 'autotest-041',
  topic: 'autotest',
  level: 'senior',
  q: 'Làm sao đo và giảm thời gian chạy suite API (bộ test gọi API)? Bạn dùng song song (parallel), tái dùng token (auth) và tối ưu dữ liệu test như thế nào mà vẫn giữ độ tin cậy?',
  a: `**Tóm tắt:** Suite API chậm làm feedback CI muộn, đội ngũ bỏ chạy test. Muốn giảm thời gian mà vẫn tin cậy: (1) **đo trước** (thời gian từng test/suite, tỉ lệ chờ mạng) để biết nút thắt; (2) **song song hoá** các test độc lập (nhưng cô lập dữ liệu để không đua nhau); (3) **tái dùng xác thực** (token/session) hợp lý thay vì đăng nhập lại mỗi test khi an toàn; (4) **tối ưu dữ liệu** (seed tối thiểu, tái dùng fixture bất biến, dọn có mục tiêu). Nguyên tắc: nhanh không được đổi lấy flaky – test phải độc lập, xác định.

### Bối cảnh thật
Suite API có 400 test, chạy tuần tự mất 35 phút trên CI. Phân tích cho thấy: 40% thời gian là bước login lấy token lặp lại, 30% là tạo dữ liệu nặng (mỗi test tạo 20 bản ghi), phần còn lại là gọi API thật. Mục tiêu: giảm xuống ~10 phút mà không tăng flaky.

### Bước 1: Đo (không đo thì tối ưu mù)
- Ghi thời gian mỗi test (JUnit 5 extension, report Surefire/Failsafe, Allure).
- Tìm test chậm nhất (top 10 thường chiếm phần lớn thời gian).
- Phân loại: chậm do CPU/assert, do I/O mạng, do chờ (sleep/poll), do setup dữ liệu.
Chỉ số hữu ích: tổng thời gian, p50/p95 thời gian test, số lần gọi login, số query/record tạo mới.

### Bước 2: Song song (parallel)
Chạy nhiều test cùng lúc trên nhiều worker/thread. Yêu cầu tiên quyết: **test độc lập** (một test không dựa vào trạng thái test khác để lại).

~~~java
// JUnit 5: bật chạy song song qua cấu hình (junit-platform.properties)
// junit.jupiter.execution.parallel.enabled = true
// junit.jupiter.execution.parallel.mode.default = concurrent
// (Cấu hình thực tế tuỳ dự án; ví dụ minh hoạ ý tưởng)
~~~

Rủi ro khi song song:
- **Đụng dữ liệu**: hai test cùng sửa một bản ghi "user-1" → kết quả ngẫu nhiên. Cách chữa: mỗi test dùng dữ liệu riêng (id ngẫu nhiên/namespace theo test), hoặc dùng DB cô lập/transaction rollback.
- **Giới hạn tài nguyên**: song song quá mức làm quá tải API/DB, phản hồi chậm ngược lại. Đặt số worker phù hợp (ví dụ 4–8) và đo.

### Bước 3: Tái dùng token (auth) hợp lý
Login lặp lại tốn thời gian (hash mật khẩu, gọi IdP). Cách tối ưu:
- **Lấy token một lần cho nhóm test** (ví dụ {{@BeforeAll}} trong class, hoặc fixture suite-level) nếu các test dùng cùng quyền và token còn hạn trong suốt lần chạy.
- **Cache theo "profile" quyền**: token cho role admin, token cho role user – tái dùng trong worker nếu an toàn.
- **Không chia sẻ trạng thái mutable** gắn với token (ví dụ test A đổi mật khẩu của tài khoản dùng chung → test B fail).

~~~java
// Ý tưởng: lấy token một lần, tái dùng cho các request trong cùng phạm vi an toàn
static String token;
@BeforeAll
static void authOnce(com.microsoft.playwright.APIRequestContext api) {
  // Gọi /login một lần, lưu token
  var res = api.post("https://api.test/login",
      com.microsoft.playwright.options.RequestOptions.create()
          .setData(java.util.Map.of("u","test","p", System.getenv("TEST_PASS"))));
  token = res.json().get("token").asText();
}
~~~

Lưu ý bảo mật: token là secret trong runtime – không ghi log (liên hệ {{autotest-037}}). Nếu hệ thống có token ngắn hạn, cân nhắc refresh hoặc phạm vi BeforeAll đủ ngắn.

### Bước 4: Tối ưu dữ liệu
- **Seed tối thiểu**: chỉ tạo trường/bản ghi cần cho assert, không dựng cả "thế giới".
- **Fixture bất biến dùng chung**: dữ liệu chỉ đọc (danh mục quốc gia) seed một lần cho suite; dữ liệu bị ghi thì tách riêng mỗi test.
- **Dựng qua API/DB trực tiếp** tùy mục tiêu: setup bằng gọi API nghiệp vụ nhiều bước thì chậm; nếu test đang kiểm "sửa đơn hàng", có thể tạo đơn qua helper/DB seed nhanh (nhưng chấp nhận lệch một lớp so với luồng thật – ghi rõ).
- **Dọn có mục tiêu**: dọn dữ liệu test tạo ra (theo prefix/id) để không phình DB qua nhiều lần chạy, nhưng tránh {{TRUNCATE}} toàn bộ gây tranh chấp khi song song.

### Bảng trade-off
| Kỹ thuật | Giảm thời gian | Rủi ro | Cách giữ tin cậy |
|---|---|---|---|
| Song song | Cao | Đua dữ liệu, quá tải | Cô lập dữ liệu, giới hạn worker |
| Tái dùng token | Vừa-cao (nếu login đắt) | Chia sẻ state, token hết hạn | Token read-only scope, profile rõ |
| Seed tối thiểu | Vừa | Setup sai lệch thực tế | Helper chuẩn, review định kỳ |
| Bỏ E2E API trùng | Vừa | Mất phủ ca | Kiểm tra overlap với tầng khác |

### Lỗi hay gặp
- Bật parallel khi test đang dùng chung {{static}} mutable state → flaky khó tìm.
- Cache một token admin cho mọi test kể cả test phân quyền → test phân quyền trở nên vô nghĩa.
- Tối ưu bằng cách xoá assert "cho nhanh" → nhanh nhưng vô dụng.

### Trả lời phỏng vấn thế nào
Nêu trình tự: đo → tìm nút thắt → song song (kèm cô lập) → tái dùng auth an toàn → tối ưu data. Đưa ví dụ con số (như case 35 phút → ~10 phút) và nhấn mạnh ràng buộc: độc lập, xác định, không làm yếu kiểm tra phân quyền/bảo mật.

> Senior tip: Theo dõi thời gian suite như một chỉ số sức khoẻ (budget thời gian CI). Mỗi PR thêm test chậm đều có "chi phí lãi". Ưu tiên dọn top test chậm nhất và ổn định hoá trước khi tăng độ song song mù quáng.`,
  follow: [
    'Làm sao cô lập dữ liệu khi chạy API test song song trên cùng một DB dùng chung?',
    'Khi nào bạn KHÔNG nên tái dùng token (ví dụ test logout, test đổi mật khẩu, test phân quyền)?',
    'Bạn phân biệt thời gian tiết kiệm được "thật" với việc chỉ dời chi phí sang bước setup hạ tầng thế nào?'
  ],
  refs: [
    { type: 'doc', title: 'JUnit 5 - Parallel Execution', url: 'https://junit.org/junit5/docs/current/user-guide/#writing-tests-parallel-execution' },
    { type: 'doc', title: 'Playwright - APIRequestContext', url: 'https://playwright.dev/java/docs/api-testing' },
    { type: 'article', title: 'Eradicating Non-Determinism in Tests (Martin Fowler)', url: 'https://martinfowler.com/articles/nonDeterminism.html' }
  ]
}


,
{
  id: 'autotest-042',
  topic: 'autotest',
  level: 'senior',
  q: 'Khi review code test (E2E/API), bạn nhận ra test kém chất lượng bằng những dấu hiệu nào? Hãy nói về assert yếu, dùng sleep, phụ thuộc thứ tự chạy, và cách sửa.',
  a: `**Tóm tắt:** Test kém chất lượng tốn thời gian chạy nhưng cho ít niềm tin: có thể **xanh giả** (pass dù tính năng hỏng) hoặc **đỏ giả** (flaky). Dấu hiệu thường gặp: **assert yếu** (không kiểm đúng điều quan trọng), **{{Thread.sleep}}/chờ cố định** (chậm và mong manh), **phụ thuộc thứ tự** (test B chỉ pass nếu test A chạy trước), cùng với locator mong manh, chia sẻ state, và test làm quá nhiều việc. Review code test cần hỏi: "nếu bug thật xuất hiện, test này có đỏ không?" và "nó có tự giải thích khi đỏ không?".

### Bối cảnh thật
PR thêm 15 test UI: pipeline lúc xanh lúc đỏ. Khi đọc code: nhiều chỗ {{Thread.sleep(5000)}}, assert chỉ kiểm trang "không lỗi 500" mà không kiểm nội dung nghiệp vụ, và test {{testCreateOrder}} đặt trạng thái mà {{testPayOrder}} dựa vào. Kết quả: suite vừa chậm, vừa không bắt được hồi quy thực.

### Dấu hiệu 1: Assert yếu (weak assertion)
Assert yếu là khẳng định quá chung, không gắn với kết quả nghiệp vụ cần bảo vệ.

Ví dụ yếu:
~~~java
// Chỉ biết trang có load, không biết đơn hàng tạo đúng
String title = page.title();
org.junit.jupiter.api.Assertions.assertNotNull(title);

// Hoặc chỉ check HTTP 200 nhưng không check body
org.junit.jupiter.api.Assertions.assertEquals(200, res.status());
~~~

Cách mạnh hơn:
~~~java
// Kiểm đúng tín hiệu nghiệp vụ
com.microsoft.playwright.assertions.PlaywrightAssertions
    .assertThat(page.getByTestId("order-status")).hasText("CREATED");
org.junit.jupiter.api.Assertions.assertEquals("SKU-123",
    res.json().get("items").get(0).get("sku").asText());
~~~

Nguyên tắc: assert vào **giá trị nghiệp vụ cụ thể** (id/trạng thái/số tiền/thông báo đúng) tại điểm quan sát ổn định.

### Dấu hiệu 2: Dùng {{sleep}}/chờ cố định
{{Thread.sleep(3000)}} giả định "sau 3 giây chắc xong". Máy chậm/CI tải cao → chưa xong → đỏ; máy nhanh → lãng phí 2.9 giây. Với Playwright, ưu tiên auto-wait và chờ theo điều kiện/tín hiệu (liên hệ {{autotest-032}}).

~~~java
// Yếu: chờ mù
Thread.sleep(3000);
page.locator("#status").textContent();

// Tốt hơn: chờ điều kiện rõ (ví dụ URL hoặc phần tử trạng thái)
page.waitForURL("**/orders/*");
com.microsoft.playwright.assertions.PlaywrightAssertions
    .assertThat(page.getByTestId("order-status")).hasText("CREATED");
~~~

Ngoại lệ hiếm: một số ca tích hợp đặc thù không có tín hiệu quan sát được – nhưng phải ghi chú lý do và giữ thời gian tối thiểu; ưu tiên tìm tín hiệu thay thế.

### Dấu hiệu 3: Phụ thuộc thứ tự chạy
Test phụ thuộc thứ tự (order-dependent) nghĩa là test sau chỉ đúng khi test trước đã tạo/sửa dữ liệu. JUnit có thể chạy khác thứ tự, chạy song song, hoặc chạy một test lẻ → vỡ.

~~~java
// Yếu: chia sẻ trạng thái ngầm qua field/static
static String createdOrderId;
@Test void t1_create() { createdOrderId = createOrder(); }
@Test void t2_pay() { pay(createdOrderId); } // fail nếu chạy một mình
~~~

Cách sửa: mỗi test tự thiết lập điều kiện cần (arrange) trong phạm vi của nó (setup/fixture/helper), hoặc gom thành một kịch bản duy nhất nếu bản chất là các bước của cùng một luồng.

### Các dấu hiệu kém chất lượng khác
| Dấu hiệu | Vì sao xấu | Hướng sửa |
|---|---|---|
| Một test kiểm 10 thứ không liên quan | Khó biết đỏ vì đâu, khó bảo trì | Tách theo hành vi; mỗi test có mục tiêu rõ |
| Bắt mọi exception rồi pass | Che lỗi thật | Chỉ bắt ngoại lệ mong đợi, assert cụ thể |
| Dùng {{Thread.sleep}} thay wait có điều kiện | Chậm + flaky | Chờ URL/response/locator state |
| Dữ liệu hard-code đụng người khác | Đỏ khi chạy song song/CI chung | Dữ liệu cô lập, id duy nhất |
| Locator gắn CSS mong manh | Vỡ khi đổi UI | Role/test id ({{autotest-032}}) |
| Copy-paste khối lớn giữa test | Khó sửa đồng bộ | Helper/POM/builders có chủ đích ({{autotest-031}}) |

### Checklist review nhanh
1. Test này **bảo vệ hành vi nào**? Assert có chứng minh hành vi đó không?
2. Có **sleep** hay chờ mù không? Có thay bằng điều kiện được không?
3. Chạy test **một mình** (và chạy song song) có ổn không?
4. Khi test đỏ, thông điệp/trace có giúp tìm nguyên nhân không?
5. Có lộ bí mật/PII trong log hay dữ liệu không ({{autotest-037}})?

### Trả lời phỏng vấn thế nào
Nêu 3 dấu hiệu trọng tâm (assert yếu, sleep, phụ thuộc thứ tự), mỗi cái kèm ví dụ ngắn "yếu → tốt hơn" và lý do. Mở rộng thêm 2–3 dấu hiệu khác (chia sẻ state, test quá lớn) và chốt bằng checklist review. Thể hiện tư duy: test là tài sản cần bảo trì, chất lượng test ảnh hưởng trực tiếp niềm tin phát hành.

> Senior tip: Đoán chất lượng suite bằng một câu hỏi: "bao nhiêu test đỏ là bug thật, bao nhiêu là do test?" Nếu tỉ lệ đỏ giả cao, đội ngũ sẽ ngừng tin – lúc đó thêm test mới chỉ làm nợ xấu nhiều hơn. Ưu tiên sửa assert yếu và chờ mù trước khi tăng số lượng test.`,
  follow: [
    'Bạn phân biệt "một test nhiều assert" (nhiều kiểm chứng của cùng một hành vi) với "một test làm nhiều việc" (nhiều hành vi) thế nào?',
    'Khi phát hiện test phụ thuộc thứ tự trong suite lớn, bạn lên kế hoạch gỡ phụ thuộc ra sao để giảm rủi ro?',
    'Làm sao viết thông điệp assert/log đủ rõ để người on-call đọc kết quả CI hiểu nhanh?'
  ],
  refs: [
    { type: 'article', title: 'Eradicating Non-Determinism in Tests (Martin Fowler)', url: 'https://martinfowler.com/articles/nonDeterminism.html' },
    { type: 'article', title: 'Test Pyramid (khái niệm) - Ham Vocke', url: 'https://martinfowler.com/articles/practical-test-pyramid.html' }
  ]
},
{
  id: 'autotest-043',
  topic: 'autotest',
  level: 'senior',
  q: 'Bạn quản lý version (phiên bản/lịch sử thay đổi) của code test cùng code ứng dụng như thế nào? So sánh monorepo (một repo chung) và repo test riêng, chọn khi nào?',
  a: `**Tóm tắt:** Code test tự động là mã nguồn: cần version control (Git), review, CI, và gắn với phiên bản ứng dụng nó kiểm tra. Hai mô hình phổ biến: **monorepo** (test nằm cùng repository với code ứng dụng) hoặc **repo test riêng**. Monorepo giúp thay đổi API + cập nhật test đi cùng một PR, dễ đồng bộ; repo riêng có thể tách quyền/chu kỳ nhưng dễ lệch phiên bản ("test repo vẫn test API cũ"). Lựa chọn phụ thuộc cấu trúc team, ranh giới service, và khả năng giữ đồng bộ. Dù mô hình nào, cần quy ước: test nào chạy trên phiên bản nào, ai sở hữu, và pipeline nào chặn merge.

### Thuật ngữ gốc
- **Version control**: hệ thống quản lý lịch sử thay đổi (Git). "Version của test cùng code" nghĩa là biết tại commit/tag nào thì test tương thích với ứng dụng nào.
- **Monorepo** (mono repository): một kho Git chứa nhiều module/dự án (ví dụ {{services/order}}, {{services/user}}, {{e2e-tests}} cùng repo).
- **Repo riêng**: code ứng dụng ở repo A, code automation (đặc biệt E2E xuyên hệ thống) ở repo B.

### Monorepo: test đi cùng code
~~~text
repo/
  services/order/        (code + unit/integration test của order)
  services/user/
  e2e/                   (Playwright/RestAssured cho luồng xuyên service)
  .github/workflows/     (CI chạy phần liên quan)
~~~

Ưu điểm:
- **Thay đổi đồng bộ trong 1 PR**: đổi {{POST /orders}} response → cập nhật contract/test trong cùng PR → CI kiểm tra cùng lúc, tránh giai đoạn "app mới, test cũ".
- **Tái dùng code**: chia sẻ model/builders/helper dễ hơn (vẫn cần quản lý ranh giới).
- **Lịch sử gắn nhau**: {{git blame/bisect}} liên kết thay đổi app và test.

Nhược: repo lớn, CI cần thông minh (chỉ chạy phần bị ảnh hưởng) để không chậm; quyền truy cập đồng nhất hơn.

### Repo test riêng
~~~text
repo-app-order/    (unit/integration trong service)
repo-app-user/
repo-e2e/          (test E2E xuyên nhiều service, chạy theo lịch/trigger)
~~~

Ưu điểm:
- Tách rõ ownership (đội QA/SDET quản repo E2E), tách quyền truy cập.
- Có thể chạy E2E theo nhịp riêng (nightly) chống môi trường tích hợp.

Nhược (lớn nhất):
- **Lệch phiên bản**: app deploy thay đổi nhưng repo E2E chưa cập nhật → đỏ ồ ạt hoặc (tệ hơn) xanh giả vì test không còn kiểm đúng.
- Phối hợp PR chéo repo khó: cần quy ước trigger (chạy E2E repo B với image/commit của app repo A).

~~~seq
title: Rủi ro lệch phiên bản khi test ở repo riêng
actors: App repo | Deploy | E2E repo | CI
App repo -> Deploy: merge thay đổi API /order
Deploy -> CI: triển khai phiên bản mới
CI -> E2E repo: chạy bộ E2E (vẫn theo code test cũ)
E2E repo --> CI: fail do lệch contract hoặc xanh giả do assert yếu
~~~

### Tiêu chí chọn
| Tiêu chí | Nghiêng monorepo | Nghiêng repo riêng (có kỷ luật) |
|---|---|---|
| Unit/integration của 1 service | Luôn cùng repo service | Hiếm khi tách |
| E2E trong cùng sản phẩm/team | Thuận lợi | Cần cơ chế pin phiên bản |
| E2E xuyên nhiều sản phẩm/đội độc lập | Có thể module riêng trong monorepo lớn | Có thể repo riêng + hợp đồng rõ |
| Yêu cầu tách quyền nghiêm ngặt | Khó hơn | Dễ hơn |
| Khả năng CI chọn lọc (affected) | Cần đầu tư | Mỗi repo CI riêng |

### Thực hành giữ đồng bộ (dù mô hình nào)
- **Unit/integration**: luôn nằm cạnh code service, chạy trong CI của service đó, chặn merge khi fail.
- **Contract test**: lưu/verify gắn với phiên bản consumer/provider (Pact broker hoặc artifact versioned) để biết tương thích phiên bản nào.
- **E2E xuyên service**: gắn test với **version/tag** môi trường được test (chạy E2E như "đối chiếu" với bản deploy cụ thể), ghi rõ {{appVersion}} trong báo cáo.
- **Branch/tag**: phát hành thì tag; test chạy lại trên tag để tái lập.
- **Quyền sở hữu**: ai phá test thì người đó (hoặc team sở hữu module) chịu trách nhiệm sửa – tránh "repo E2E của ai đó" không ai chăm.

### Lỗi hay gặp
- Để E2E ở repo riêng nhưng không có cơ chế chạy E2E theo phiên bản app vừa deploy → lệch âm thầm.
- Monorepo nhưng CI chạy toàn bộ 2 giờ mỗi PR vì không có affected-test → đội ngũ tắt test.
- Không ai sở hữu test: đỏ kéo dài, cuối cùng bị bỏ qua.

### Trả lời phỏng vấn thế nào
So sánh hai mô hình theo trục: đồng bộ thay đổi, ownership, chi phí CI, rủi ro lệch phiên bản. Đưa khuyến nghị thực dụng: unit/integration luôn đi cùng service; E2E ưu tiên gần code (monorepo hoặc module kỷ luật) và phải gắn phiên bản được test. Nhấn mạnh cơ chế (CI gate, contract, tag) hơn là giáo điều mô hình.

> Senior tip: Câu hỏi không chỉ là "để test ở repo nào" mà là "làm sao một thay đổi phá hợp đồng bị chặn trước khi deploy". Nếu repo riêng mà CI app bắt buộc chạy đúng bộ E2E versioned tương thích, bạn vẫn đạt mục tiêu; nếu monorepo mà E2E luôn bị skip, bạn thất bại. Cơ chế đồng bộ quan trọng hơn địa chỉ repo.`,
  follow: [
    'Với contract test (Pact), bạn lưu trữ và chọn phiên bản contract để verify thế nào giữa các service?',
    'Làm sao thiết kế CI monorepo để chỉ chạy test liên quan đến phần code thay đổi (affected)?',
    'Khi E2E repo riêng phải test một hotfix gấp của app, quy trình phối hợp phiên bản ra sao?'
  ],
  refs: [
    { type: 'article', title: 'Consumer-Driven Contracts (Martin Fowler)', url: 'https://martinfowler.com/articles/consumerDrivenContracts.html' },
    { type: 'doc', title: 'Pact Broker (quản lý phiên bản contract)', url: 'https://docs.pact.io/pact_broker' }
  ]
}


,
{
  id: 'autotest-044',
  topic: 'autotest',
  level: 'lead',
  q: '(Lead) Bạn thuyết phục team dev viết test và chia trách nhiệm chất lượng giữa dev và QA như thế nào? Khi team bận release, bạn giữ cam kết này ra sao?',
  a: `**Tóm tắt:** Thuyết phục team dev viết test không phải "bắt làm thêm việc" mà là thay đổi cách làm để **giảm chi phí sửa bug muộn** và tăng tốc độ phát hành bền vững. Ở vai trò lead, bạn dùng dữ liệu (bug rò rỉ, thời gian sửa, incident), bắt đầu nhỏ (test cho code mới/bug vừa sửa), làm cho việc viết test **dễ** (template, ví dụ, CI nhanh), và chia trách nhiệm rõ: **dev sở hữu unit/integration của phần mình** (chất lượng dựng vào code), **QA/SDET** tập trung vào chiến lược kiểm thử, rủi ro sản phẩm, E2E/contract có chọn lọc, tooling và coaching – không phải "cổng kiểm duy nhất" cuối sprint. Khi bận release, giữ cam kết bằng quy tắc tối thiểu không thương lượng (test cho bug fix, CI không tắt), cắt phạm vi hợp lý thay vì cắt chất lượng vô hình.

### Bối cảnh thật
Team 8 dev, 2 QA. Mỗi sprint dồn tính năng, test tay cuối kỳ, production rò rỉ 5–8 bug/tháng, hotfix chiếm 30% thời gian. QA quá tải, dev nói "không kịp viết test". Mục tiêu lead: chuyển dần sang "chất lượng là trách nhiệm chung" mà không làm tê liệt delivery.

### Vì sao dev nên viết test (lập luận dùng dữ liệu)
- **Phản hồi nhanh**: unit/integration chạy trong phút cho biết thay đổi có phá logic không, nhanh hơn chờ QA vòng tay.
- **Chi phí bug tăng theo thời gian**: bug tìm thấy ở local/CI rẻ hơn nhiều so với staging/production (phải điều tra, hotfix, ảnh hưởng người dùng). Dẫn số nội bộ: thời gian hotfix/tháng, số incident, thời gian rollback.
- **Tái cấu trúc an toàn**: có test, dev dám refactor; không có test, code "đóng băng" vì sợ chạm.
- **Tài liệu sống**: test mô tả hành vi mong đợi (đặc biệt với ca biên) rõ hơn comment cũ.

Khung nói chuyện: không đổ lỗi ("QA bắt thiếu"), mà nói về **hệ thống** ("chúng ta đang trả phí trễ cho bug; test là cách trả phí sớm, rẻ hơn").

### Chia trách nhiệm dev / QA (RACI tinh thần, không giáo điều)
| Hạng mục | Dev | QA/SDET | Ghi chú |
|---|---|---|---|
| Unit test logic nghiệp vụ | **Sở hữu, viết** | Review/coaching | Gắn với code, chạy nhanh |
| Integration test trong service (DB, mapping) | **Sở hữu** | Hỗ trợ pattern/tool | Thường dùng Testcontainers |
| Contract test biên service | Đồng sở hữu (consumer/provider) | Điều phối quy ước | Ngăn vỡ tích hợp |
| E2E luồng quan trọng | Đóng góp | **Dẫn chiến lược**, giữ bộ nhỏ ổn định | Tránh QA ôm hết E2E |
| Test plan rủi ro, exploratory | Tham gia | **Dẫn** | Cái máy khó thay thế |
| CI, flakiness, tooling | Hỗ trợ | **Dẫn** (SDET) | Nền tảng cho cả team |
| Quyết định release go/no-go | Đồng trách nhiệm | Đồng trách nhiệm | Dựa trên tín hiệu, không cảm tính |

Nguyên tắc: QA không phải "người bấm nút thay dev", mà là **chuyên gia rủi ro và kỹ thuật kiểm thử** nâng năng lực cả đội.

### Cách thuyết phục và triển khai (bắt đầu nhỏ)
1. **Chọn điểm đau có số liệu**: 3 loại bug lặp lại gần đây → đề xuất "mỗi bug fix kèm 1 test tái hiện".
2. **Quy ước tối thiểu rõ**: ví dụ "PR có thay đổi logic phải có/điều chỉnh test; bug fix phải có test regression". Đưa vào Definition of Done.
3. **Làm cho dễ**: template test, ví dụ trong repo, helper/builders, CI chạy nhanh phần liên quan. Giảm ma sát còn hơn ra lệnh.
4. **Đôi (pairing/coaching)**: SDET pair 30–60 phút với dev khi thêm test đầu tiên cho module khó.
5. **Ăn mừng tiến bộ**: theo dõi bug rò rỉ giảm, thời gian hotfix giảm; chia sẻ cụ thể, không biến thành cuộc săn "coverage %".

~~~seq
title: Vòng thay đổi thực dụng
actors: Lead | Dev | QA/SDET | CI
Lead -> Dev: quy ước tối thiểu + ví dụ + mục tiêu (bug fix kèm test)
Dev -> CI: PR kèm test (unit/integration)
QA/SDET -> Dev: coaching/pairing, review chiến lược test
CI --> Lead: tín hiệu (pass/flaky/thời gian, bug rò rỉ theo dõi)
~~~

### Khi bận release: giữ cam kết thế nào
- **Không thương lượng thứ tối thiểu**: test cho bug fix/hotfix (ngăn lặp lại), CI gate hiện có không bị tắt "tạm". "Tạm" thường thành vĩnh viễn.
- **Cắt phạm vi, không cắt chất lượng vô hình**: giảm số tính năng trong release, hoặc giảm độ sâu E2E cho tính năng rủi ro thấp – nhưng không bỏ hết test của phần ship.
- **Bộ kiểm tra theo tầng rủi ro**: smoke + test của vùng thay đổi + contract liên quan bắt buộc; full regression dài chạy nightly/parallel, không chặn hotfix nếu đã có bằng chứng tầng dưới.
- **Timebox nợ test**: nếu buộc phải nợ (hiếm), tạo ticket có owner + hạn chót ngay trong/ sau release, không để trôi.
- **Minh bạch rủi ro**: quyết định ship khi thiếu phủ test phải là quyết định có chủ đích (ghi nhận rủi ro), không phải quên.

### Lỗi hay gặp
- Đặt mục tiêu {{coverage 80%}} từ trên xuống → dev viết test hình thức, assert yếu ({{autotest-042}}).
- QA vẫn là "cổng duy nhất" → dev không học, bottleneck không đổi.
- Khi release gấp thì tắt CI đỏ "cho qua" → phá vỡ kỷ luật, tín hiệu mất giá trị.

### Trả lời phỏng vấn thế nào
Nêu lập luận bằng chi phí/phản hồi (có số liệu), mô hình trách nhiệm chia sẻ (dev sở hữu tầng thấp, QA/SDET dẫn chiến lược/rủi ro/tooling), và cách triển khai tăng dần (bắt đầu từ bug fix/regression). Với áp lực release: giữ tối thiểu không thương lượng, cắt phạm vi, dùng tầng rủi ro, và quản lý nợ test minh bạch.

> Senior tip: Mục tiêu của lead không phải "ép dev viết nhiều test" mà là làm cho **phát hành an toàn trở thành đường mặc định dễ đi nhất**. Khi CI nhanh, template sẵn, và quy ước nhỏ nhưng được giữ nhất quán, hành vi đúng sẽ bền hơn mọi bài diễn văn về chất lượng.`,
  follow: [
    'Bạn phản hồi thế nào khi một dev nói "code của tôi đơn giản, không cần test"?',
    'Làm sao đo tiến bộ văn hoá chất lượng mà không dựa vào coverage đơn thuần?',
    'Trong khủng hoảng production, bạn cân bằng giữa hotfix nhanh và giữ kỷ luật test ra sao?'
  ],
  refs: [
    { type: 'article', title: 'The Practical Test Pyramid (Ham Vocke)', url: 'https://martinfowler.com/articles/practical-test-pyramid.html' },
    { type: 'book', title: 'Accelerate (Forsgren, Humble, Kim) - nghiên cứu về năng lực delivery', url: 'https://itrevolution.com/product/accelerate/' },
    { type: 'article', title: 'TestCoverage (Martin Fowler bliki - cảnh báo dùng coverage)', url: 'https://martinfowler.com/bliki/TestCoverage.html' }
  ]
},
{
  id: 'autotest-045',
  topic: 'autotest',
  level: 'lead',
  q: '(Lead) Lập lộ trình 6 tháng đưa tỉ lệ regression (hồi quy – lỗi cũ quay lại) được kiểm thử tự động từ 10% lên 70%. Bạn chia giai đoạn, đo lường, và quản lý rủi ro thế nào?',
  a: `**Tóm tắt:** Tăng tự động hoá regression từ 10% lên 70% trong 6 tháng là mục tiêu **có thể đạt nếu phạm vi rõ và đo đúng**. Lead cần: (1) định nghĩa "regression được tự động" theo danh mục ca/rủi ro (không phải đếm test mù), (2) lập baseline và chọn bộ ca ưu tiên (theo tần suất lỗi, tác động tiền/doanh thu, tần suất dùng), (3) chia lộ trình theo giai đoạn (nền tảng → mở phủ có ưu tiên → ổn định/scale) với mục tiêu tháng, (4) đầu tư chống flaky và CI đủ nhanh, (5) theo dõi chỉ số dẫn đường (flaky rate, thời gian CI, defect leakage) chứ không chỉ % phủ. Rủi ro lớn: đo sai, tự động hoá ca giá trị thấp, suite chậm/flaky làm team mất tin.

### Bối cảnh thật
Sản phẩm web (Java backend, UI web). Hiện có ~300 ca regression thủ công, ~30 ca tự động (ước lượng ~10% theo bộ ca regression đã định nghĩa), chạy mất 2 ngày/người mỗi release. Mục tiêu 6 tháng: ~70% ca regression quan trọng được tự động, chạy trong pipeline với tín hiệu đáng tin.

### Bước 0: Định nghĩa và baseline (trước khi hứa 70%)
- **Regression test** (kiểm thử hồi quy): kiểm tra tính năng đã có vẫn đúng sau thay đổi. "Được tự động" = có test tự động chạy được, ổn định, nằm trong CI/lịch rõ, và assert có ý nghĩa (không phải script xanh giả).
- **Khoanh phạm vi**: lập danh sách ca regression (hoặc nhóm hành vi) có chủ đích: tách "khói (smoke)", "regression lõi", "edge hiếm". 70% nên tính trên **regression lõi/có giá trị**, không ép ca thủ công exploratory hiếm thành tự động kém.
- **Baseline**: số ca tự động ổn định / tổng ca mục tiêu; thời gian chạy; tỉ lệ flaky; số bug rò rỉ sau release gần nhất.

### Lộ trình 6 tháng (gợi ý theo giai đoạn)
| Giai đoạn | Thời gian | Mục tiêu chính | Sản phẩm bàn giao |
|---|---|---|---|
| 1. Nền tảng | Tháng 1 | Chọn công cụ (Playwright Java cho UI, RestAssured/Testcontainers cho API/integration), khung project, chuẩn POM/data, CI chạy smoke | Repo test, pipeline, 10–15 ca smoke ổn định, quy ước review ({{autotest-042}}) |
| 2. Phủ ca ưu tiên cao | Tháng 2–3 | Tự động hoá luồng doanh thu/rủi ro cao (login, đặt hàng, thanh toán, phân quyền), theo test pyramid (ưu tiên API/integration) | +40–60% ca lõi, báo cáo (Allure) + artifact debug ({{autotest-035}}) |
| 3. Mở rộng có kiểm soát | Tháng 4–5 | Bổ sung ca hạng trung, xử lý i18n/ca biên chọn lọc, song song hoá và tối ưu thời gian ({{autotest-041}}) | Đạt ~60–70% ca lõi, thời gian CI trong ngân sách |
| 4. Ổn định và bàn giao | Tháng 6 | Giảm flaky < ngưỡng, tài liệu hoá, chuyển quyền sở hữu cho team ({{autotest-044}}), chốt cách đo | 70% bền vững, quy trình bảo trì, backlog ca còn lại có chủ đích |

(Các con số %/ca là khung minh hoạ; lead cần hiệu chỉnh theo quy mô thực.)

~~~seq
title: Lộ trình 6 tháng (tóm tắt)
actors: Lead | Team | CI
Lead -> Team: Tháng 1 nền tảng + smoke + quy ước
Team -> CI: Tháng 2-3 tự động ca ưu tiên cao (API/UI)
Team -> CI: Tháng 4-5 mở rộng + song song + tối ưu
Lead -> Team: Tháng 6 ổn định flaky + bàn giao ownership
CI --> Lead: đo lường liên tục (phủ, flaky, thời gian, leakage)
~~~

### Đo lường (tránh "70% ảo")
- **Tỉ lệ phủ regression mục tiêu**: % ca trong danh mục regression lõi có tự động ổn định. (Báo cáo cả số tuyệt đối: 210/300 ca lõi.)
- **Chất lượng tín hiệu**: flaky rate (tỉ lệ fail không do bug sản phẩm), thời gian từ merge đến có kết quả.
- **Kết quả thực**: defect leakage (bug lọt production ở vùng đã tự động vs chưa), thời gian regression cycle mỗi release.
- **Sức khoẻ suite**: thời gian chạy, tỉ lệ test bị quarantine (nên gần 0).

Không dùng: "số lượng test" tăng mà không gắn ca; coverage dòng code như đại diện regression nghiệp vụ.

### Quản lý rủi ro
| Rủi ro | Dấu hiệu | Giảm thiểu |
|---|---|---|
| Tự động hoá sai ưu tiên | Nhiều test nhưng bug vẫn lọt luồng tiền | Chọn ca theo rủi ro/tác động, review với PO/QA |
| Suite flaky, CI chậm | Team rerun/bỏ qua | Chống flaky từ đầu ({{autotest-032}}, {{autotest-035}}), ngân sách thời gian, song song có kiểm soát |
| Nợ bảo trì | Test gãy hàng loạt khi UI đổi | POM/locator bền, review chất lượng, ownership rõ |
| Thiếu năng lực | Tiến độ chậm, test kém | Pairing, template, đào tạo Playwright/Testcontainers, chia nhỏ mục tiêu tháng |
| Cam kết 70% trên phạm vi sai | Đạt số nhưng vô ích | Khóa định nghĩa baseline + danh mục ca ngay tháng 1 |

### Phân bổ nguồn lực (thực tế)
- Dành năng lực cố định mỗi sprint (ví dụ 20–30% hoặc 1 cặp dev+SDET) thay vì "làm khi rảnh".
- Gắn với công việc tính năng: tính năng mới/rủi ro cao đi kèm tự động hoá ca regression liên quan.

### Trả lời phỏng vấn thế nào
Bắt đầu bằng định nghĩa + baseline (đo đúng). Trình bày lộ trình 4 giai đoạn với mốc tháng, nhấn mạnh nền tảng và ổn định (không lao vào viết test ồ ạt). Nêu chỉ số (phủ mục tiêu, flaky, thời gian CI, leakage) và 2–3 rủi ro chính với cách giảm thiểu. Thể hiện tư duy lead: kết quả kinh doanh (rò rỉ bug, tốc độ release) quan trọng hơn con số % đơn lẻ.

> Senior tip: "70%" chỉ có ý nghĩa khi gắn với **danh mục ca đã thống nhất** và test đó **đáng tin**. Một suite 70% nhưng flaky 15% tệ hơn 40% ổn định. Hãy đặt ngưỡng dừng mở rộng: nếu flaky vượt ngưỡng, chuyển sprint sang ổn định trước khi thêm ca mới.`,
  follow: [
    'Bạn ưu tiên tự động hoá ca UI E2E hay ca API/integration trước để đạt 70% an toàn? Vì sao?',
    'Khi business đổi ưu tiên giữa chừng (tháng 3), bạn điều chỉnh lộ trình và mục tiêu 70% thế nào?',
    'Những ca regression nào bạn chủ đích KHÔNG tự động hoá và vẫn giữ thủ công/exploratory?'
  ],
  refs: [
    { type: 'article', title: 'The Practical Test Pyramid (Ham Vocke)', url: 'https://martinfowler.com/articles/practical-test-pyramid.html' },
    { type: 'article', title: 'TestCoverage (Martin Fowler bliki - dùng thước đo đúng)', url: 'https://martinfowler.com/bliki/TestCoverage.html' },
    { type: 'book', title: 'Accelerate (Forsgren, Humble, Kim) - đo năng lực delivery', url: 'https://itrevolution.com/product/accelerate/' },
  ]
}

);
