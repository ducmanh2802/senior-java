/* Bài học track "api": HTTP & REST nền tảng. Schema & markup: AGENTS.md mục 12. */
(window.LESSONS = window.LESSONS || []).push(
{
  id: 'lesson-api-001',
  track: 'api',
  order: 1,
  title: 'HTTP từ bên trong: method an toàn, status code và header',
  level: 'mid',
  minutes: 25,
  goals: [
    'Đọc được một HTTP message thô và phân biệt phần đầu với body',
    'Phân biệt **safe** với **idempotent** và biết method nào dùng cho việc gì',
    'Chọn đúng status code cho từng tình huống và giải thích được vì sao',
    'Hiểu {{Content-Type}}, {{Cache-Control}}, {{ETag}} ảnh hưởng gì tới client và proxy',
  ],
  body: `### Một HTTP message gồm hai phần
Mọi request hay response đều là **text có cấu trúc**, truyền trên TCP dưới dạng byte. Phần đầu (head) gồm **request line** (hoặc status line) và các **header**, cách nhau bởi dấu hai chấm; sau đó là **một dòng trống**, rồi tới **body**. Dòng trống chính là ranh giới: mọi thứ sau nó thuộc về body, kể cả khi body rỗng.

~~~text
POST /accounts/42/transactions HTTP/1.1
Host: api.bank.vn
Content-Type: application/json
Content-Length: 29

{"amount":100000,"ccy":"VND"}
~~~

Bốn điểm dễ sai khi tự đọc message:
- Chuẩn (RFC 9112) quy định {{CRLF}} (hai ký tự xuống dòng) để ngăn dòng, nhưng nhiều client gửi trần {{LF}}. Parser thực tế thường chấp nhận cả hai; khi tự viết, hãy tách phần đầu theo {{CRLF CRLF}}, nếu không thấy mới thử {{LF LF}}.
- **Không được trim body.** Body có thể bắt đầu hoặc kết thúc bằng khoảng trắng, thậm chí chứa dòng trống. Body là dữ liệu nhị phân đối với HTTP; chỉ header mới được chuẩn hoá.
- Tên header **không phân biệt hoa thường** ({{Content-Type}} và {{content-type}} là một); giá trị thì **phân biệt**, trừ khi chuẩn riêng định nghĩa ngược lại. Nên {{X-Trace: Abc}} khác {{X-Trace: abc}}, nhưng type/subtype trong {{Content-Type}} là ngoại lệ: {{application/JSON}} vẫn chỉ đúng một media type. Tên header không được chứa khoảng trắng; giá trị được cắt khoảng trắng hai đầu.
- Header trùng tên: với hầu hết header, các giá trị được gộp; với vài header đặc biệt ({{Set-Cookie}}) phải giữ riêng từng dòng. Trong bài tập, quy ước giá trị sau ghi đè giá trị trước cho đơn giản.

Độ dài body do {{Content-Length}} khai báo, hoặc dùng {{Transfer-Encoding: chunked}} khi chưa biết trước. Nếu server nhận **cả hai** header này thì đó là dấu hiệu tấn công **request smuggling**; RFC 9112 khuyến nghị coi đây là lỗi — thường từ chối với 400 và đóng kết nối — thay vì tự chọn một cái.

### Method: safe, idempotent và hệ quả
- **Safe** (an toàn): client được phép gọi mà không làm thay đổi trạng thái server. Trình duyệt, crawler, proxy được tự do gọi trước.
- **Idempotent** (bất biến với lặp): gọi một lần hay nhiều lần với cùng dữ liệu thì **trạng thái cuối** như nhau. Lưu ý: response có thể khác nhau giữa các lần gọi, HTTP không bắt response phải giống nhau.
- **Cacheable**: response có thể được cache khi có header phù hợp.

| Method | Safe | Idempotent | Thường dùng |
|---|---|---|---|
| GET | có | có | đọc tài nguyên; request không cần body |
| HEAD | có | có | như GET nhưng chỉ lấy header |
| OPTIONS | có | có | xem method được phép, CORS preflight |
| PUT | không | có | ghi đè toàn bộ tài nguyên tại một URI |
| DELETE | không | có | xoá tài nguyên |
| POST | không | **không** | tạo mới, hành động không tự nhiên idempotent |
| PATCH | không | thường không | sửa một phần; có thể idempotent nếu phép sửa là gán |

Ví dụ ngân hàng: {{PUT /accounts/42/beneficiary}} với body đầy đủ là idempotent — gửi lại 5 lần vẫn ra cùng một beneficiary. {{POST /payments}} thì không: mỗi lần gửi là một lệnh trừ tiền mới. Vì vậy khi mạng timeout sau {{POST}}, client **không được** tự retry mù; phải dùng idempotency key (bài 3 của track này).

Một chi tiết hay bị hỏi: DELETE idempotent nhưng lần thứ hai có thể trả 404. Trạng thái "tài nguyên không còn" vẫn giữ nguyên, nên method vẫn idempotent; chỉ response khác mà thôi.

### Status code: hợp đồng giữa server và client
Status code không phải trang trí. Client, load balancer, SDK và hệ thống alert đều ra quyết định dựa trên **nhóm** 2xx/4xx/5xx. Trả {{200}} kèm {{"success": false}} là lỗi thiết kế: retry tự động sẽ không chạy, dashboard không thấy lỗi, SDK không bắt được exception.

| Code | Khi nào |
|---|---|
| 200 OK | đọc hoặc cập nhật thành công, có body |
| 201 Created | tạo thành công, kèm {{Location}} trỏ tới tài nguyên mới |
| 202 Accepted | đã nhận việc, xử lý bất đồng bộ, trả về nơi theo dõi |
| 204 No Content | thành công, không có body (DELETE, PUT ghi đè) |
| 304 Not Modified | client gửi {{If-None-Match}} khớp {{ETag}}, không cần body |
| 400 Bad Request | message sai cú pháp, JSON hỏng, thiếu header bắt buộc |
| 401 Unauthorized | thiếu hoặc sai thông tin xác thực; kèm {{WWW-Authenticate}} |
| 403 Forbidden | đã xác thực nhưng không có quyền |
| 404 Not Found | không có tài nguyên tại URI đó |
| 405 Method Not Allowed | URI tồn tại nhưng method không hỗ trợ; **bắt buộc** kèm header {{Allow}} |
| 409 Conflict | xung đột trạng thái, ví dụ tạo trùng mã tài khoản |
| 412 Precondition Failed | {{If-Match}} không khớp, chống lost update |
| 422 Unprocessable Content | cú pháp đúng nhưng ngữ nghĩa sai, ví dụ số tiền âm |
| 429 Too Many Requests | vượt rate limit; kèm {{Retry-After}} |
| 500 Internal Server Error | lỗi không lường trước, không lộ chi tiết nội bộ |
| 502 / 503 / 504 | gateway nhận phản hồi hỏng / service quá tải / gateway timeout |

Phân biệt 401 và 403 là câu hỏi kinh điển. 401 nghĩa là "bạn là ai?" chưa trả lời được; 403 nghĩa là "biết bạn là ai rồi, nhưng bạn không được làm việc này". Không dùng 401 cho user đã đăng nhập nhưng thiếu role.

### Header định hình cách dữ liệu được hiểu
- {{Content-Type}} mô tả **định dạng body đang gửi**; {{Accept}} mô tả **định dạng client muốn nhận**. Thiếu {{Content-Type}} thì server phải đoán — đừng để server đoán.
- {{Content-Type: application/json; charset=utf-8}}: RFC 8259 **không** định nghĩa charset cho {{application/json}} vì JSON mặc định đã là UTF-8; ghi thêm {{charset=utf-8}} không phải bắt buộc nhưng vô hại và giúp vài client cũ khỏi đoán sai.
- {{Content-Length}} vs {{Transfer-Encoding: chunked}} đã nói ở trên; không gửi cả hai.
- {{Cache-Control}} quyết định ai được cache và bao lâu. {{public}} cho phép cả proxy dùng chung; {{private}} chỉ cache phía client; {{no-store}} cấm ghi xuống đĩa; {{max-age}} tính bằng giây; {{s-maxage}} dành cho proxy dùng chung; {{stale-while-revalidate}} cho phép trả bản cũ trong lúc làm mới.
- {{ETag}} là dấu vân tay của phiên bản tài nguyên. Client gửi lại trong {{If-None-Match}} để nhận 304 (tiết kiệm băng thông), hoặc trong {{If-Match}} để chống ghi đè (nhận 412 nếu đã có người sửa trước).
- {{Vary}} cho cache biết response thay đổi theo header nào; thiếu {{Vary: Accept-Encoding}} có thể khiến proxy trả bản gzip cho client không hỗ trợ.

Với dữ liệu ngân hàng như số dư hay lịch sử giao dịch, mặc định nên là {{Cache-Control: private, no-store}} và chỉ mở cache cho dữ liệu tham chiếu ít đổi (danh mục chi nhánh, tỉ giá có TTL ngắn). Một cấu hình cache sai ở đây không chỉ làm chậm; nó còn có thể để lộ dữ liệu của người này cho người khác qua proxy dùng chung.

### Liên hệ phỏng vấn
Interviewer thường đi từ "phân biệt PUT và POST" tới "vì sao DELETE idempotent mà vẫn trả 404", rồi hỏi tình huống thật: mobile retry sau timeout, CDN cache nhầm response có Authorization, gateway trả 504 trong khi backend vẫn đang xử lý. Trả lời tốt là gắn mỗi khái niệm với một quyết định vận hành: có được retry không, cache ở đâu, client phân biệt lỗi tạm thời với lỗi vĩnh viễn thế nào.`,
  exercises: [
    {
      title: 'Tự viết parser cho HTTP request thô',
      prompt: `Cho một HTTP request dưới dạng chuỗi thô. Hãy viết {{HttpParser.parse(raw)}} trả về {{HttpRequest}} gồm:
- {{method}}: token đầu tiên của request line, giữ nguyên như đã gửi.
- {{path}}: request target (phần thứ hai), **giữ cả query string**, ví dụ {{/accounts?limit=20}}.
- {{headers}}: map với **tên header viết thường**, giá trị đã trim khoảng trắng hai đầu. Header trùng tên thì giá trị sau thắng. Bỏ qua dòng header không có dấu hai chấm.
- {{body}}: toàn bộ phần sau dòng trống đầu tiên, **không trim**. Không có dòng trống thì body là chuỗi rỗng.

Chấp nhận cả kết thúc dòng {{CRLF}} và {{LF}}. Chỉ cần xử lý request hợp lệ; không cần validate {{Content-Length}}.`,
      starter: `record HttpRequest(String method, String path, Map<String, String> headers, String body) {}

class HttpParser {
    static HttpRequest parse(String raw) {
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
    public static void main(String[] args) {
        check("parses request line and body", () -> {
            String raw = "POST /accounts/42/transactions HTTP/1.1\\r\\n"
                + "Host: api.bank.vn\\r\\n"
                + "Content-Type: application/json\\r\\n"
                + "Content-Length: 18\\r\\n"
                + "\\r\\n"
                + "amount=100&ccy=VND";
            HttpRequest r = HttpParser.parse(raw);
            eq("POST", r.method());
            eq("/accounts/42/transactions", r.path());
            eq("amount=100&ccy=VND", r.body());
        });
        check("header names are case-insensitive", () -> {
            String raw = "GET /health HTTP/1.1\\r\\nContent-Type: application/json\\r\\nX-Trace:  abc:def  \\r\\n\\r\\n";
            HttpRequest r = HttpParser.parse(raw);
            eq("application/json", r.headers().get("content-type"));
            eq("abc:def", r.headers().get("x-trace"));
            eq("", r.body());
        });
        check("accepts LF only and keeps query", () -> {
            String raw = "GET /accounts?limit=20&page=2 HTTP/1.1\\nHost: localhost\\n\\n";
            HttpRequest r = HttpParser.parse(raw);
            eq("GET", r.method());
            eq("/accounts?limit=20&page=2", r.path());
            eq("localhost", r.headers().get("host"));
            eq("", r.body());
        });
        check("body is not trimmed and keeps blank lines", () -> {
            String raw = "PUT /notes/1 HTTP/1.1\\r\\n\\r\\n  line1\\r\\n\\r\\nline3  ";
            HttpRequest r = HttpParser.parse(raw);
            eq("  line1\\r\\n\\r\\nline3  ", r.body());
        });
        check("duplicate header: last one wins", () -> {
            String raw = "GET /x HTTP/1.1\\r\\nX-Env: dev\\r\\nX-Env: prod\\r\\n\\r\\n";
            eq("prod", HttpParser.parse(raw).headers().get("x-env"));
        });
        check("request without body separator", () -> {
            HttpRequest r = HttpParser.parse("GET /ping HTTP/1.1\\r\\nHost: a");
            eq("GET", r.method());
            eq("/ping", r.path());
            eq("a", r.headers().get("host"));
            eq("", r.body());
        });
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
      reference: `record HttpRequest(String method, String path, Map<String, String> headers, String body) {}

class HttpParser {
    static HttpRequest parse(String raw) {
        int sep = raw.indexOf("\\r\\n\\r\\n");
        int sepLen = 4;
        if (sep < 0) {                       // client chi gui LF
            sep = raw.indexOf("\\n\\n");
            sepLen = 2;
        }
        String head = sep < 0 ? raw : raw.substring(0, sep);
        String body = sep < 0 ? "" : raw.substring(sep + sepLen);

        String[] lines = head.replace("\\r\\n", "\\n").split("\\n", -1);
        String[] start = lines[0].trim().split(" ", 3);
        Map<String, String> headers = new LinkedHashMap<>();
        for (int i = 1; i < lines.length; i++) {
            String line = lines[i];
            int colon = line.indexOf(':');
            if (colon <= 0) continue;        // dong rong hoac header hong
            String name = line.substring(0, colon).trim().toLowerCase(Locale.ROOT);
            headers.put(name, line.substring(colon + 1).trim());
        }
        return new HttpRequest(start[0], start[1], headers, body);
    }
}`,
      hints: [
        'Tìm dòng trống đầu tiên bằng {{indexOf}} của bốn ký tự {{CRLF CRLF}}; không thấy thì thử hai ký tự {{LF LF}}.',
        'Phần đầu tách theo dòng, dòng 0 là request line (tách theo dấu cách, giới hạn 3 phần), các dòng sau tách tại dấu hai chấm **đầu tiên**.',
        'Đừng gọi {{trim()}} trên body; chỉ trim tên và giá trị header.',
      ],
      explain: `Điểm mấu chốt là **ranh giới head/body** và **không đụng vào body**. Nếu dùng {{split(":")}} không giới hạn, giá trị {{abc:def}} sẽ bị cắt sai; phải dùng {{indexOf(':')}} hoặc {{split(":", 2)}}. Nếu tìm separator bằng {{"\\n\\n"}} trước, request CRLF sẽ không khớp vì giữa hai dòng có {{"\\r\\n\\r\\n"}} chứa {{"\\n\\r"}} — thứ tự kiểm tra rất quan trọng.

Lỗi hay gặp khác: dùng {{trim()}} cho cả message làm mất khoảng trắng đầu/cuối của body; dùng {{equals}} cho tên header nên {{Content-Type}} không tìm thấy; và bỏ qua dòng trống cuối khi tách bằng {{split}} mặc định (Java bỏ trailing empty string, nên truyền {{-1}} nếu cần giữ). Trong production, parser thật còn phải giới hạn kích thước header (chống header bombing), từ chối {{obs-fold}} (header xuống dòng liên tục, đã bị deprecate), và xử lý cả {{Content-Length}} lẫn {{Transfer-Encoding}}.`,
    },
  ],
  check: [
    {
      q: 'Method nào **idempotent nhưng không safe**?',
      options: ['GET', 'PUT', 'POST', 'HEAD'],
      answer: 1,
      explain: `PUT ghi đè tài nguyên nên gửi lặp vẫn ra cùng trạng thái, nhưng nó **thay đổi** dữ liệu nên không safe. GET và HEAD vừa safe vừa idempotent. POST không safe và cũng không idempotent — đây là lý do cần idempotency key cho thanh toán.`,
    },
    {
      q: 'Client đã đăng nhập hợp lệ nhưng tài khoản không có role chuyển tiền. Server nên trả gì?',
      options: ['401 Unauthorized', '403 Forbidden', '404 Not Found', '422 Unprocessable Content'],
      answer: 1,
      explain: `401 dành cho trường hợp chưa xác thực được danh tính (thiếu/sai token). Đã biết là ai nhưng thiếu quyền thì là 403. 404 thường dùng để che giấu sự tồn tại của tài nguyên, không phản ánh đúng ngữ nghĩa ở đây. 422 là lỗi ngữ nghĩa của body, không phải lỗi phân quyền.`,
    },
    {
      q: 'Xoá tài nguyên thành công và không cần trả body. Status code phù hợp nhất?',
      options: ['200 OK', '201 Created', '202 Accepted', '204 No Content'],
      answer: 3,
      explain: `204 nghĩa là thành công và **không có body**, đúng cho DELETE. 200 cũng hợp lệ nếu trả body mô tả kết quả, nhưng ở đây không cần. 201 dành cho tạo mới; 202 dành cho xử lý bất đồng bộ.`,
    },
    {
      q: 'API trả số dư tài khoản. {{Cache-Control}} nào an toàn nhất?',
      options: ['public, max-age=60', 'private, max-age=60', 'no-store', 's-maxage=3600'],
      answer: 2,
      explain: `Số dư là dữ liệu nhạy cảm, không nên lưu ở bất kỳ cache nào (kể cả cache riêng của trình duyệt trên máy dùng chung), nên {{no-store}}. {{public}} cho phép proxy dùng chung cache và có thể lộ dữ liệu; {{s-maxage}} cũng là cache dùng chung; {{private}} giảm rủi ro hơn nhưng vẫn ghi xuống đĩa client.`,
    },
  ],
  related: ['api-001', 'api-002', 'api-009'],
  tags: ['HTTP', 'idempotency', 'status code', 'cache', 'parser'],
},
{
  id: 'lesson-api-002',
  track: 'api',
  order: 2,
  title: 'Thiết kế REST resource, validation và lỗi chuẩn Problem Details',
  level: 'mid',
  minutes: 30,
  goals: [
    'Đặt tên resource và chọn method/status code đúng cho API tài khoản',
    'Phân biệt 404 với 405 và luôn trả header {{Allow}} khi cần',
    'Tách lỗi cú pháp (400) khỏi lỗi ngữ nghĩa (422) và trả nhiều lỗi cùng lúc',
    'Viết error response theo RFC 9457 để client xử lý bằng máy, không phải parse chuỗi',
  ],
  body: `### Resource là danh từ, hành động là method
REST không phải "đặt tên URL cho đẹp". Ý tưởng cốt lõi: **tài nguyên là danh từ**, còn **method HTTP là động từ**. Vì vậy {{POST /accounts/42/transactions}} đúng hơn {{POST /createTransaction?accountId=42}}; {{DELETE /accounts/42/beneficiaries/7}} đúng hơn {{GET /deleteBeneficiary?id=7}}.

Vài quy ước giúp API dễ đoán:
- Dùng **số nhiều** cho collection: {{/accounts}}, {{/accounts/42/transactions}}. Đừng trộn {{/account}} với {{/accounts}}.
- **Nested** thể hiện quan hệ sở hữu, nhưng chỉ nên sâu 1–2 cấp: {{/accounts/42/transactions}} tốt; {{/customers/1/accounts/42/transactions/9/entries}} quá sâu, khó cache và khó phân quyền.
- Tài nguyên có thể truy cập độc lập thì đưa lên top-level: {{/transactions?accountId=42}} thay vì bắt client nhớ đường dẫn lồng.
- ID là **opaque** với client: đừng để client suy luận ID tuần tự rồi gọi từng số; cân nhắc UUID/ULID cho API công khai.
- Dùng **kebab-case** cho path ({{/beneficiary-accounts}}), camelCase cho field JSON nếu đó là quy ước của team, nhưng phải nhất quán.
- Filter/sort/pagination là query parameter, không phải segment mới: {{GET /transactions?status=POSTED&sort=-createdAt&limit=50&cursor=...}}.

### Bảng method và status cho một resource
| Thao tác | Request | Thành công |
|---|---|---|
| Liệt kê | {{GET /accounts}} | 200 + danh sách + metadata phân trang |
| Đọc một | {{GET /accounts/42}} | 200, hoặc 404 nếu không có |
| Tạo | {{POST /accounts}} | 201 + {{Location: /accounts/43}} |
| Ghi đè | {{PUT /accounts/42}} | 200 hoặc 204 |
| Sửa một phần | {{PATCH /accounts/42}} | 200 với tài nguyên sau khi sửa |
| Xoá | {{DELETE /accounts/42}} | 204, hoặc 202 nếu xoá bất đồng bộ |

Không dùng GET cho thao tác có side effect (gửi email, trừ tiền) chỉ vì "tiện gọi bằng trình duyệt". Proxy và crawler được phép gọi lại GET; hậu quả có thể rất đắt.

### 404, 405 và những lỗi hay bị gộp
- **404**: không có tài nguyên tại URI này. Nếu path khớp route nhưng thiếu dữ liệu (account 42 không tồn tại), vẫn là 404.
- **405**: path **tồn tại**, nhưng method không được hỗ trợ. Bắt buộc kèm header {{Allow: GET, PUT}} để client biết đường sửa. Đây là điểm rất hay bị làm ẩu: trả 404 cho mọi thứ khiến client tưởng sai URL.
- **409**: request đúng cú pháp, đúng quyền, nhưng xung đột với trạng thái hiện tại — tạo trùng số tài khoản, chuyển tiền khi tài khoản đang bị phong toả. Client có thể thử lại sau khi đổi dữ liệu.
- **410**: tài nguyên từng tồn tại và đã bị xoá vĩnh viễn; khác 404 ở chỗ nó nói "đừng tìm nữa".
- **412**: precondition ({{If-Match}}) không khớp; dùng cho optimistic concurrency.
- **422**: body đúng cú pháp nhưng vi phạm quy tắc nghiệp vụ: {{amount}} âm, ngày hiệu lực trong quá khứ, chuyển khoản vượt hạn mức.

Ranh giới 400 và 422 không tuyệt đối: nhiều team gộp cả hai vào 400. Điều quan trọng là **thống nhất trong toàn API** và ghi rõ trong tài liệu; đừng lúc thì 400, lúc thì 422 cho cùng một loại lỗi.

### Validation: báo đủ, báo đúng chỗ
Validation nên chạy **trước** khi chạm database và trước khi thực hiện side effect. Với Spring Boot 3, {{@Valid}} trên {{@RequestBody}} kích hoạt Bean Validation; lỗi ném ra {{MethodArgumentNotValidException}} với danh sách field lỗi. Đừng bắt exception rồi trả một chuỗi chung "Dữ liệu không hợp lệ" — client không biết sửa field nào.

Nguyên tắc:
- Trả **tất cả** lỗi của các field trong một response, không dừng ở lỗi đầu tiên. Người dùng sửa form một lần tốt hơn sửa năm lần.
- Chỉ rõ **vị trí**: {{/amount}}, hoặc {{/beneficiaries/0/accountNumber}} nếu lỗi nằm trong mảng.
- Mã lỗi **ổn định** cho máy: {{INSUFFICIENT_FUNDS}}, {{ACCOUNT_FROZEN}}. Đừng để client so sánh chuỗi tiếng Việt.
- Không trả stack trace, tên bảng, câu SQL hay thông tin nội bộ. Log đầy đủ ở server kèm traceId, trả cho client traceId đó.
- Lỗi xác thực (401) và phân quyền (403) không được tiết lộ tài nguyên có tồn tại hay không nếu đó là thông tin nhạy cảm; nhiều hệ thống ngân hàng trả 404 thay cho 403 trong trường hợp này.

### RFC 9457 Problem Details
RFC 9457 (kế thừa RFC 7807) định nghĩa một body lỗi chung, content type {{application/problem+json}}:

~~~json
{
  "type": "https://api.bank.vn/problems/insufficient-funds",
  "title": "Insufficient funds",
  "status": 422,
  "detail": "Số dư khả dụng 50.000 VND, cần 100.000 VND.",
  "instance": "/transfers/8f3c",
  "code": "INSUFFICIENT_FUNDS",
  "traceId": "b7d1c9e2",
  "errors": [
    { "pointer": "/amount", "code": "TOO_LARGE", "message": "Vượt hạn mức 500 triệu/ngày" }
  ]
}
~~~

- {{type}} là URI định danh **loại** lỗi, không nhất thiết phải mở được; hãy host tài liệu thật để dev đọc.
- {{title}} ngắn, ổn định, có thể dịch; {{detail}} dành cho con người và có thể thay đổi.
- {{status}} phải khớp status line, đừng để 200 ở HTTP nhưng 422 trong body.
- {{instance}} trỏ tới lần xảy ra cụ thể (request id/traceId).
- Các field mở rộng như {{code}}, {{errors}}, {{traceId}} được phép; client dựa vào {{code}} và {{pointer}} chứ đừng parse {{detail}}.
- Với lỗi 5xx, body càng ít càng tốt: mã lỗi chung + traceId. Không đưa thông điệp exception thật ra ngoài.

Trong Spring Boot 3, {{ProblemDetail}} và {{ErrorResponseException}} hỗ trợ sẵn; có thể bật {{spring.mvc.problemdetails.enabled=true}} để lỗi mặc định cũng theo format này, rồi viết {{@RestControllerAdvice}} để thêm {{code}}/{{errors}}.

### Liên hệ phỏng vấn
Câu hỏi thực tế không dừng ở "REST là gì" mà là: vì sao chọn 404 hay 403 khi user không có quyền xem tài khoản người khác, làm sao client phân biệt lỗi tạm thời để retry, và làm sao giữ error contract ổn định khi backend đổi framework. Trả lời bằng hợp đồng: status code + mã lỗi ổn định + Problem Details, kèm ví dụ client chỉ cần đọc {{code}} là xử lý được.`,
  exercises: [
    {
      title: 'Router nhỏ: path pattern, 404 và 405',
      prompt: `Viết {{Router}} để mô phỏng phần routing của một REST API:
- {{add(method, pattern, handler)}}: đăng ký route. {{pattern}} có thể chứa biến dạng /accounts/{id}/transactions/{txId}.
- {{dispatch(method, path)}}: tìm route khớp **method và path**, gọi handler với map tham số đường dẫn và trả kết quả của handler.
- Không khớp path nào → trả chuỗi {{404}}. Path khớp nhưng không có method đó → trả {{405}}.
- {{allowed(path)}} trả tập method được phép tại path đó (dùng để dựng header {{Allow}}).

Quy ước: bỏ query string (mọi thứ sau {{?}}) và bỏ dấu {{/}} cuối (trừ path gốc {{/}}). Segment literal phải khớp chính xác; biến {{...}} khớp đúng một segment không rỗng. Nếu nhiều route cùng khớp, route có **nhiều segment literal hơn** thắng, nên {{/accounts/me}} thắng /accounts/{id} dù đăng ký sau.`,
      starter: `class Router {
    void add(String method, String pattern, Function<Map<String, String>, String> handler) {
        throw new UnsupportedOperationException("TODO");
    }

    String dispatch(String method, String path) {
        throw new UnsupportedOperationException("TODO");
    }

    Set<String> allowed(String path) {
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
    public static void main(String[] args) {
        check("matches a literal route", () -> {
            Router r = new Router();
            r.add("GET", "/health", p -> "ok");
            eq("ok", r.dispatch("GET", "/health"));
        });
        check("extracts path variables", () -> {
            Router r = new Router();
            r.add("GET", "/accounts/{id}/transactions/{txId}",
                  p -> p.get("id") + "/" + p.get("txId"));
            eq("42/9", r.dispatch("GET", "/accounts/42/transactions/9"));
        });
        check("unknown path is 404", () -> {
            Router r = new Router();
            r.add("GET", "/accounts/{id}", p -> "get");
            eq("404", r.dispatch("GET", "/customers/42"));
        });
        check("known path wrong method is 405 with Allow", () -> {
            Router r = new Router();
            r.add("GET", "/accounts/{id}", p -> "get");
            r.add("PUT", "/accounts/{id}", p -> "put");
            eq("405", r.dispatch("DELETE", "/accounts/1"));
            eq(Set.of("GET", "PUT"), r.allowed("/accounts/1"));
        });
        check("literal segment beats a variable", () -> {
            Router r = new Router();
            r.add("GET", "/accounts/{id}", p -> "var");
            r.add("GET", "/accounts/me", p -> "me");
            eq("me", r.dispatch("GET", "/accounts/me"));
            eq("var", r.dispatch("GET", "/accounts/7"));
        });
        check("ignores query and trailing slash", () -> {
            Router r = new Router();
            r.add("GET", "/accounts/{id}", p -> "id=" + p.get("id"));
            eq("id=42", r.dispatch("GET", "/accounts/42/?limit=5"));
        });
        check("segment count must match", () -> {
            Router r = new Router();
            r.add("GET", "/accounts/{id}", p -> "get");
            eq("404", r.dispatch("GET", "/accounts/42/transactions"));
        });
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
      reference: `class Router {
    private static final class Route {
        final String method;
        final String[] segments;
        final Function<Map<String, String>, String> handler;

        Route(String method, String pattern, Function<Map<String, String>, String> handler) {
            this.method = method.toUpperCase(Locale.ROOT);
            this.segments = segments(pattern);
            this.handler = handler;
        }
    }

    private final List<Route> routes = new ArrayList<>();

    void add(String method, String pattern, Function<Map<String, String>, String> handler) {
        routes.add(new Route(method, pattern, handler));
    }

    String dispatch(String method, String path) {
        String[] parts = segments(stripQuery(path));
        Route best = null;
        Map<String, String> bestParams = null;
        int bestScore = -1;
        for (Route r : routes) {
            if (!r.method.equalsIgnoreCase(method)) continue;
            Map<String, String> params = match(r.segments, parts);
            if (params == null) continue;
            int score = literalCount(r.segments);   // nhieu literal hon = cu the hon
            if (score > bestScore) {
                best = r; bestScore = score; bestParams = params;
            }
        }
        if (best == null) return allowed(path).isEmpty() ? "404" : "405";
        return best.handler.apply(bestParams);
    }

    Set<String> allowed(String path) {
        String[] parts = segments(stripQuery(path));
        Set<String> out = new TreeSet<>();
        for (Route r : routes) {
            if (match(r.segments, parts) != null) out.add(r.method);
        }
        return out;
    }

    private static int literalCount(String[] segs) {
        int n = 0;
        for (String s : segs) if (!s.startsWith("{")) n++;
        return n;
    }

    private static Map<String, String> match(String[] pattern, String[] path) {
        if (pattern.length != path.length) return null;
        Map<String, String> params = new LinkedHashMap<>();
        for (int i = 0; i < pattern.length; i++) {
            String p = pattern[i];
            if (p.startsWith("{") && p.endsWith("}")) {
                if (path[i].isEmpty()) return null;
                params.put(p.substring(1, p.length() - 1), path[i]);
            } else if (!p.equals(path[i])) {
                return null;
            }
        }
        return params;
    }

    private static String stripQuery(String path) {
        int q = path.indexOf('?');
        return q < 0 ? path : path.substring(0, q);
    }

    private static String[] segments(String path) {
        String p = path;
        while (p.length() > 1 && p.endsWith("/")) p = p.substring(0, p.length() - 1);
        if (p.equals("/") || p.isEmpty()) return new String[0];
        if (p.startsWith("/")) p = p.substring(1);
        return p.split("/", -1);
    }
}`,
      hints: [
        'Chuẩn hoá path trước khi so: cắt query tại {{?}} và bỏ {{/}} cuối. Chia pattern và path thành mảng segment cùng độ dài rồi so từng vị trí.',
        'Segment dạng {{...}} là biến, bỏ dấu ngoặc để lấy tên và đưa vào {{LinkedHashMap}}. Không để biến khớp chuỗi rỗng.',
        'Để 405 đúng, phải kiểm tra path **bất kể method** trước: nếu có route khớp path thì trả 405, ngược lại 404. Tính điểm cụ thể bằng số segment literal.',
      ],
      explain: `Luồng đúng là: tách path thành segment, duyệt mọi route, mỗi route trả về hoặc null (không khớp) hoặc map tham số. Khi không route nào khớp **với method**, kiểm tra lại chỉ theo path để phân biệt 404 và 405 — đây là chỗ nhiều bạn trả 404 cho cả hai.

Ưu tiên route literal bằng {{literalCount}} mô phỏng hành vi của router thật (Spring, Express, Go chi-router): {{/accounts/me}} phải thắng /accounts/{id} vì nếu không, route tĩnh không bao giờ chạy được. Trong production còn nhiều thứ khác: regex constraint ({{id}} phải là số), wildcard, method OPTIONS tự sinh, và header {{Allow}} tính từ {{allowed()}}.

Lỗi hay gặp: so path bằng {{startsWith}} nên {{/accounts/42x}} khớp {{/accounts/42}}; quên bỏ query nên {{?limit=5}} làm hỏng segment cuối; và trả 405 mà không có {{Allow}} — client không biết cách sửa request.`,
    },
  ],
  check: [
    {
      q: 'Tạo tài khoản thành công. Response nào đúng nhất?',
      options: ['200 OK kèm body tài khoản', '201 Created kèm header Location', '202 Accepted kèm job id', '204 No Content'],
      answer: 1,
      explain: `201 nói rằng một tài nguyên **mới** đã được tạo; {{Location}} chỉ cho client URI của nó. 200 không sai về mặt kỹ thuật nhưng mất thông tin "mới được tạo". 202 dành cho xử lý bất đồng bộ, 204 dành khi không có body và thường cho update/delete.`,
    },
    {
      q: 'Path {{/accounts/42}} tồn tại nhưng chỉ hỗ trợ GET và PUT. Client gọi DELETE. Trả gì?',
      options: ['400 Bad Request', '404 Not Found', '405 Method Not Allowed + Allow: GET, PUT', '409 Conflict'],
      answer: 2,
      explain: `Path tồn tại nên không phải 404. Method không được hỗ trợ nên là 405, và chuẩn yêu cầu gửi kèm {{Allow}} để client biết method hợp lệ. 400 là lỗi cú pháp request; 409 là xung đột trạng thái nghiệp vụ.`,
    },
    {
      q: 'JSON đúng cú pháp nhưng {{amount}} là số âm. Trả 422 hay 400?',
      options: ['400 vì request sai', '422 vì cú pháp đúng nhưng ngữ nghĩa sai', '409 vì xung đột', '500 vì server không xử lý được'],
      answer: 1,
      explain: `422 dành cho body parse được nhưng vi phạm quy tắc nghiệp vụ. 400 thường dành cho JSON hỏng, thiếu field bắt buộc hoặc sai kiểu. Nhiều API gộp cả hai vào 400 — chấp nhận được nếu nhất quán — nhưng không được trả 409/500 cho lỗi validate.`,
    },
    {
      q: 'Field nào **không nên** xuất hiện trong Problem Details trả cho client production?',
      options: ['type', 'title', 'instance', 'stack_trace'],
      answer: 3,
      explain: `{{type}}, {{title}}, {{instance}} là các field chuẩn của RFC 9457 và an toàn. Stack trace lộ cấu trúc code, đường dẫn file, phiên bản thư viện — là món quà cho kẻ tấn công. Log stack trace ở server, chỉ trả traceId để đối chiếu.`,
    },
  ],
  related: ['api-003', 'api-006', 'api-018'],
  tags: ['REST', 'routing', 'Problem Details', 'validation', 'status code'],
},
{
  id: 'lesson-api-003',
  track: 'api',
  order: 3,
  title: 'Idempotency key cho POST: chống trừ tiền hai lần',
  level: 'senior',
  minutes: 35,
  goals: [
    'Giải thích được vì sao POST thanh toán cần idempotency key dù client đã retry đúng cách',
    'Thiết kế hợp đồng key: phạm vi, TTL, fingerprint body, response lưu lại',
    'Xử lý được hai request cùng key chạy song song mà không thực thi nghiệp vụ hai lần',
    'Biết lưu key ở đâu (DB vs Redis) và các pitfall khiến giải pháp vẫn trừ tiền hai lần',
  ],
  body: `### Vấn đề: timeout không có nghĩa là request thất bại
Client gửi {{POST /payments}} để trừ 100.000 VND. Server đã ghi giao dịch vào database, nhưng response bị mất trên đường về (mạng mobile chập chờn, load balancer restart, client timeout sau 30 giây). Client **không biết** giao dịch đã xảy ra hay chưa. Nếu nó retry, tiền có thể bị trừ hai lần; nếu không retry, có thể khách đã trả mà đơn hàng không được ghi nhận.

Đây là bài toán **exactly-once** kinh điển. Ở tầng mạng, ta chỉ có **at-least-once** (có thể gửi trùng) hoặc **at-most-once** (có thể mất). Cách duy nhất để đạt hiệu ứng "exactly once" là at-least-once **cộng với** server có khả năng nhận ra request trùng — chính là **idempotency key**.

Key là một token do **client** sinh ra, đại diện cho **một thao tác logic**, không phải cho một lần gửi. Client tạo UUID một lần khi người dùng bấm "Thanh toán", rồi gửi cùng key đó cho mọi lần retry của cùng thao tác. Nếu client sinh key mới mỗi lần retry thì server không có cách nào phân biệt retry với giao dịch mới.

### Hợp đồng tối thiểu
Header thường dùng: {{Idempotency-Key: 9f1c2e7a-...}}.

| Tình huống | Server làm gì |
|---|---|
| Key mới | Chạy nghiệp vụ, lưu kết quả (status + body) gắn với key |
| Key cũ, body giống hệt | **Không chạy lại**; trả nguyên status và body đã lưu |
| Key cũ, body khác | Từ chối, thường 409 hay 422 (Stripe trả lỗi {{idempotency_error}}), vì client đang tái sử dụng key sai |
| Key cũ, request đầu còn đang chạy | Trả 409 Conflict "request in progress" hoặc chờ ngắn rồi trả kết quả |
| Key thiếu ở endpoint bắt buộc | 400, kèm mô tả header cần gửi |
| Key hết TTL | Coi như key mới; vì vậy TTL phải dài hơn cửa sổ retry của client |

Phạm vi key rất quan trọng: key phải unique trong phạm vi **(merchant/tenant, endpoint, key)**. Nếu chỉ unique toàn hệ thống, hai merchant tình cờ dùng cùng UUID sẽ đụng nhau; nếu không gắn endpoint, cùng key dùng cho hai API khác nhau sẽ trả nhầm kết quả. TTL thường 24 giờ; hệ thống có retry 72 giờ như webhook ngân hàng phải để TTL dài hơn 72 giờ.

Body fingerprint nên là **hash của raw body** (SHA-256) cho đơn giản: client retry phải gửi **byte-identical body**, format lại JSON giữa các lần retry là lỗi của client. Cách thứ hai là canonicalize (sort key, chuẩn hoá số và unicode) rồi hash — như Stripe làm với parameters — để chấp nhận request khác byte nhưng cùng ngữ nghĩa; bù lại bạn phải định nghĩa canonicalization thật kỹ và ghi rõ trong tài liệu, nếu không hai request "giống nhau về ngữ nghĩa" sẽ bị coi là khác. Chọn một trong hai và nhất quán toàn API.

### Lưu ở đâu
Có hai lựa chọn chính:

**Database (khuyến nghị cho thanh toán).** Bảng {{idempotency_keys(key, scope, request_hash, status, response_body, created_at, expires_at)}} với unique index trên {{(scope, key)}}. Ưu điểm: bền qua restart, audit được, và có thể ghi key **cùng transaction** với nghiệp vụ — hoặc dùng unique constraint để đảm bảo chỉ một request thắng. Nhược điểm: mỗi request thêm một round trip DB; cần job dọn key hết hạn.

**Redis.** {{SET key value NX EX 86400}} để giành quyền xử lý, sau đó lưu kết quả. Nhanh, TTL tự động, phù hợp API throughput cao. Nhược điểm: Redis mất dữ liệu (nếu không bật persistence đúng cách) có thể khiến key biến mất và request retry bị chạy lại; cần cấu hình replica/backup phù hợp. Nhiều hệ thống dùng Redis để chặn trùng tức thời và DB để lưu kết quả bền.

Điểm tinh tế: nếu bạn lưu key ở DB **sau khi** gọi payment gateway, vẫn có cửa sổ crash giữa hai bước. Cách chắc hơn là mô hình **state machine**: ghi key với trạng thái {{IN_PROGRESS}} trước, gọi gateway, rồi cập nhật {{DONE}} + response. Khi request trùng đến lúc đang {{IN_PROGRESS}}, trả 409 hoặc chờ; khi crash, job đối soát xử lý các key treo. Với gateway bên ngoài, chính gateway cũng cần nhận idempotency key của bạn để chống trừ tiền hai lần ở phía họ.

### Xử lý request song song
Hai request cùng key đến cách nhau vài mili giây là chuyện bình thường khi client bắn song song hoặc load balancer retry. Nếu code là "check map rồi mới put", cả hai đều thấy key chưa có và cùng chạy nghiệp vụ — đúng lỗi ta muốn tránh.

Ba cách đúng:
1. **In-memory**: {{ConcurrentHashMap.computeIfAbsent}} đảm bảo hàm tính chỉ chạy một lần cho mỗi key trong một JVM. Chỉ dùng khi một instance; nhiều instance thì vô nghĩa.
2. **Database**: insert key với unique constraint; request thua nhận {{DuplicateKeyException}} rồi đọc kết quả của request thắng (poll ngắn nếu còn {{IN_PROGRESS}}).
3. **Distributed lock**: Redis {{SET NX}} hoặc lock theo key; nhớ TTL cho lock để không treo khi instance chết.

Lưu ý {{computeIfAbsent}} giữ lock của bin trong lúc chạy hàm, nên nếu nghiệp vụ chậm (gọi gateway 2 giây) các key khác rơi cùng bin có thể bị block. Với nghiệp vụ dài, dùng {{FutureTask}} đặt vào map trước rồi mới chạy, hoặc lock theo key ở tầng ngoài.

### Pitfall thực tế
- **Sinh key mỗi lần retry**: lỗi phổ biến nhất, đặc biệt khi dùng HTTP client tự retry. Key phải được tạo ở tầng nghiệp vụ, không phải trong interceptor retry.
- **Không lưu response**: request trùng trả 200 rỗng thay vì body gốc, client tưởng giao dịch mới. Phải lưu cả status code và body.
- **Chỉ lưu key, không kiểm tra body**: client dùng lại key cho giao dịch khác và nhận kết quả cũ — sai tiền, sai đơn.
- **TTL quá ngắn**: client retry sau 2 giờ nhưng key hết hạn sau 30 phút → trừ tiền lần hai.
- **Side effect ngoài transaction**: gửi email/SMS trong lúc xử lý; retry trả kết quả cũ nhưng email đã gửi hai lần nếu bạn không dedupe theo key.
- **Trả 500 khi nghiệp vụ đã thành công nhưng lưu key lỗi**: lần retry sẽ chạy lại. Thứ tự ghi key và ghi nghiệp vụ phải nằm trong cùng transaction hoặc có state machine + đối soát.
- **Log key ở mức INFO kèm toàn bộ body**: key không phải bí mật xác thực nhưng body chứa dữ liệu cá nhân; che PII khi log.

Idempotency key không biến API thành exactly-once một cách thần kỳ. Nó biến "có thể trùng" thành "trùng được phát hiện và trả kết quả cũ", miễn là key sống đủ lâu, được lưu bền, và việc kiểm tra key nằm cùng biên transaction với nghiệp vụ.

### Liên hệ phỏng vấn
Interviewer senior sẽ hỏi ngay: "Nếu hai request cùng key đến cùng lúc thì sao?", "Key lưu Redis mất thì sao?", "TTL bao lâu và vì sao?", "Làm sao chắc nghiệp vụ và key cùng thành công hoặc cùng thất bại?". Trả lời được bốn câu này là bạn đã chạm đúng phần khó: không phải thêm một header, mà là thiết kế **state machine + unique constraint + đối soát** quanh một thao tác không được phép lặp.`,
  exercises: [
    {
      title: 'Idempotency store trong bộ nhớ',
      prompt: `Viết {{IdempotencyStore}} mô phỏng tầng chống trùng của một API thanh toán:
- {{execute(key, body, action)}}: nếu key chưa có, chạy {{action}}, lưu kết quả và trả về. Nếu key đã có **cùng body**, trả lại kết quả đã lưu mà **không chạy action**. Nếu key đã có nhưng **body khác**, trả {{Stored(422, "IDEMPOTENCY_KEY_REUSED")}} và cũng không chạy action.
- Key null hoặc rỗng/toàn khoảng trắng → ném {{IllegalArgumentException}}.
- Phải an toàn khi nhiều thread gọi cùng key cùng lúc: action chỉ được chạy **đúng một lần**, mọi thread nhận cùng kết quả.

{{Stored}} là record có sẵn: {{status}} và {{body}} của response.`,
      starter: `record Stored(int status, String body) {}

class IdempotencyStore {
    Stored execute(String key, String body, Supplier<Stored> action) {
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
    static void expectThrows(Class<? extends Throwable> type, Runnable r) {
        try { r.run(); }
        catch (Throwable t) {
            if (type.isInstance(t)) return;
            throw new AssertionError("wrong exception: " + t);
        }
        throw new AssertionError("expected " + type.getSimpleName());
    }
    public static void main(String[] args) {
        check("first call runs the action", () -> {
            IdempotencyStore s = new IdempotencyStore();
            AtomicInteger runs = new AtomicInteger();
            Stored r = s.execute("k1", "a=1", () -> {
                runs.incrementAndGet();
                return new Stored(201, "created");
            });
            eq(201, r.status());
            eq("created", r.body());
            eq(1, runs.get());
        });
        check("same key and body replays the result", () -> {
            IdempotencyStore s = new IdempotencyStore();
            AtomicInteger runs = new AtomicInteger();
            Stored first = s.execute("k1", "a=1", () -> {
                runs.incrementAndGet();
                return new Stored(201, "first");
            });
            Stored second = s.execute("k1", "a=1", () -> {
                runs.incrementAndGet();
                return new Stored(500, "must not run");
            });
            eq(201, first.status());
            eq(201, second.status());
            eq("first", second.body());
            eq(1, runs.get());
        });
        check("same key with a different body is rejected", () -> {
            IdempotencyStore s = new IdempotencyStore();
            AtomicInteger runs = new AtomicInteger();
            s.execute("k1", "a=1", () -> {
                runs.incrementAndGet();
                return new Stored(201, "first");
            });
            Stored conflict = s.execute("k1", "a=2", () -> {
                runs.incrementAndGet();
                return new Stored(201, "wrong");
            });
            eq(422, conflict.status());
            eq(1, runs.get());
            eq("first", s.execute("k1", "a=1", () -> {
                runs.incrementAndGet();
                return new Stored(500, "must not run");
            }).body());
        });
        check("different keys are independent", () -> {
            IdempotencyStore s = new IdempotencyStore();
            AtomicInteger runs = new AtomicInteger();
            Stored a = s.execute("k1", "a=1", () -> {
                runs.incrementAndGet();
                return new Stored(201, "one");
            });
            Stored b = s.execute("k2", "a=1", () -> {
                runs.incrementAndGet();
                return new Stored(201, "two");
            });
            eq("one", a.body());
            eq("two", b.body());
            eq(2, runs.get());
        });
        check("blank key is rejected", () -> {
            IdempotencyStore s = new IdempotencyStore();
            expectThrows(IllegalArgumentException.class,
                () -> s.execute("  ", "a=1", () -> new Stored(201, "x")));
        });
        check("concurrent retries run the action once", () -> {
            IdempotencyStore s = new IdempotencyStore();
            AtomicInteger runs = new AtomicInteger();
            int n = 8;
            ExecutorService pool = Executors.newFixedThreadPool(n);
            CountDownLatch start = new CountDownLatch(1);
            List<Future<Stored>> futures = new ArrayList<>();
            try {
                for (int i = 0; i < n; i++) {
                    futures.add(pool.submit(() -> {
                        start.await();
                        return s.execute("pay-1", "amount=100", () -> {
                            runs.incrementAndGet();
                            try { Thread.sleep(30); } catch (InterruptedException e) {
                                Thread.currentThread().interrupt();
                            }
                            return new Stored(201, "charged");
                        });
                    }));
                }
                start.countDown();
                for (Future<Stored> f : futures) {
                    Stored r = f.get(5, TimeUnit.SECONDS);
                    eq(201, r.status());
                    eq("charged", r.body());
                }
            } catch (Exception e) {
                throw new AssertionError(e);
            } finally {
                pool.shutdownNow();
            }
            eq(1, runs.get());
        });
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
      reference: `record Stored(int status, String body) {}

class IdempotencyStore {
    private record Entry(String fingerprint, Stored result) {}

    private final Map<String, Entry> cache = new ConcurrentHashMap<>();

    Stored execute(String key, String body, Supplier<Stored> action) {
        if (key == null || key.isBlank()) {
            throw new IllegalArgumentException("idempotency key is required");
        }
        // computeIfAbsent chay mapping function dung MOT lan cho moi key,
        // ke ca khi nhieu thread goi cung luc.
        Entry entry = cache.computeIfAbsent(key, k -> new Entry(body, action.get()));
        if (!entry.fingerprint.equals(body)) {
            return new Stored(422, "IDEMPOTENCY_KEY_REUSED");
        }
        return entry.result;
    }
}`,
      hints: [
        'Dùng {{ConcurrentHashMap.computeIfAbsent(key, ...)}} để gộp "kiểm tra tồn tại" và "ghi kết quả" thành một thao tác nguyên tử; đừng viết {{if (map.containsKey(...))}} rồi {{map.put(...)}}.',
        'Lưu cả **body fingerprint** lẫn {{Stored}} để phân biệt request lặp hợp lệ với việc tái sử dụng key cho giao dịch khác.',
        'Kiểm tra key rỗng **trước** khi chạm map, và ném {{IllegalArgumentException}} đúng như hợp đồng.',
      ],
      explain: `Điều quan trọng nhất là tính nguyên tử. Cách sai kinh điển:
~~~java
if (!cache.containsKey(key)) { cache.put(key, run(action)); }
~~~
Hai thread cùng lúc đều thấy {{containsKey}} là false, cả hai cùng chạy {{action}} — trừ tiền hai lần. {{computeIfAbsent}} chỉ chạy mapping function một lần cho mỗi key và các thread khác chờ, nên hành vi đúng.

Sau khi lấy entry, phải so fingerprint **trước khi** trả kết quả. Nếu key có nhưng body khác, trả 422 và tuyệt đối không chạy action. Test "same key and body replays" còn kiểm tra action lần hai không được gọi — nếu bạn chỉ trả cached mà vẫn chạy action thì test đếm {{runs}} sẽ bắt được.

Khác biệt với production: {{computeIfAbsent}} giữ lock bin trong suốt thời gian chạy action. Nghiệp vụ thanh toán gọi gateway có thể mất vài giây, làm block các key khác cùng bin; khi đó dùng {{Map<String, FutureTask>}} hoặc lock theo key. Và bộ nhớ trong bài này chỉ đúng cho một JVM; nhiều instance phải dùng DB unique index hoặc Redis {{SET NX}} như phần lý thuyết.`,
    },
  ],
  check: [
    {
      q: 'Client timeout sau khi gửi POST thanh toán, không rõ server đã xử lý chưa. Retry đúng cách là gì?',
      options: [
        'Gửi lại POST với body mới',
        'Gửi lại POST với cùng Idempotency-Key và cùng body',
        'Đổi sang PUT để idempotent',
        'Không retry, coi như thất bại',
      ],
      answer: 1,
      explain: `Idempotency key đại diện cho **một thao tác logic**, nên retry phải giữ nguyên key và body để server nhận ra và trả kết quả cũ. Gửi body mới là giao dịch mới; PUT yêu cầu server ghi đè tại một URI cố định nên không hợp để tạo payment — nếu mỗi lần PUT lại sinh ID mới thì chính server đã vi phạm hợp đồng idempotent của PUT. Bỏ qua retry có thể khiến khách đã bị trừ tiền mà đơn không ghi nhận.`,
    },
    {
      q: 'Cùng key nhưng body khác body của lần đầu. Server nên trả gì?',
      options: ['200 với kết quả cũ', '422 (hoặc 409) vì key bị tái sử dụng sai', '400 vì JSON sai', '412 Precondition Failed'],
      answer: 1,
      explain: `Key đã gắn với một thao tác khác nên không thể trả kết quả cũ (sai tiền) cũng không thể chạy mới (phá hợp đồng idempotent). 400, 409 và 422 đều xuất hiện trong thực tế tuỳ hợp đồng từng API (Stripe dùng lỗi {{idempotency_error}}, có hệ thống dùng 409 Conflict); điểm cốt lõi là **từ chối**, không thực thi. 412 dành cho precondition như {{If-Match}}, không phải lỗi tái sử dụng key.`,
    },
    {
      q: 'Hệ thống chạy nhiều instance sau load balancer, cần idempotency bền qua restart và có audit. Nên lưu key ở đâu?',
      options: [
        'HashMap trong mỗi instance',
        'Chỉ Redis, không cần DB',
        'Bảng DB với unique index trên (scope, key), kèm trạng thái và response',
        'File log trên từng server',
      ],
      answer: 2,
      explain: `DB cho tính bền, audit và unique constraint đảm bảo chỉ một request thắng kể cả khi chạy nhiều instance. HashMap chỉ đúng trong một JVM và mất khi restart. Redis nhanh nhưng có thể mất dữ liệu nếu cấu hình không đúng, không phù hợp làm nguồn sự thật duy nhất cho tiền. File log không cho phép kiểm tra nguyên tử và rất khó truy vấn.`,
    },
    {
      q: 'TTL của idempotency key nên chọn thế nào?',
      options: [
        '1 phút để tiết kiệm bộ nhớ',
        'Dài hơn cửa sổ retry tối đa của client, ví dụ 24 giờ',
        'Không bao giờ hết hạn',
        'Bằng timeout của HTTP request, khoảng 30 giây',
      ],
      answer: 1,
      explain: `Key phải sống ít nhất bằng khoảng thời gian client còn có thể retry; nếu ngắn hơn, retry sẽ bị coi là thao tác mới và trừ tiền lần hai. 24 giờ là mức phổ biến; hệ thống có retry dài (webhook 72 giờ) phải để TTL dài hơn. Không hết hạn thì bảng phình vô hạn; 30 giây hoặc 1 phút quá ngắn so với retry thực tế.`,
    },
  ],
  related: ['api-015', 'api-011', 'api-002'],
  tags: ['idempotency', 'payment', 'concurrency', 'REST', 'retry'],
}
);
