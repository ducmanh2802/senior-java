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
Với HTTP/1.1, mọi request hay response đều là **text có cấu trúc**, truyền trên TCP dưới dạng byte (HTTP/2 và HTTP/3 mã hoá nhị phân nhưng giữ nguyên ý nghĩa: method, status, header, body). Phần đầu (head) gồm **request line** (hoặc status line) và các **header**, mỗi header một dòng dạng {{Tên: giá trị}}; sau đó là **một dòng trống**, rồi tới **body**. Dòng trống chính là ranh giới: mọi thứ sau nó thuộc về body, kể cả khi body rỗng.

~~~text
POST /accounts/42/transactions HTTP/1.1
Host: api.bank.vn
Content-Type: application/json
Content-Length: 29

{"amount":100000,"ccy":"VND"}
~~~

Bốn điểm dễ sai khi tự đọc message:
- Chuẩn (RFC 9112) quy định kết thúc dòng là {{CRLF}}, tức hai ký tự {{\\r\\n}} (carriage return + line feed). RFC 9112 cho phép bên nhận chấp nhận cả {{LF}} trần ({{\\n}}), và parser thực tế thường làm vậy; khi tự viết, hãy tách phần đầu theo {{CRLF CRLF}}, nếu không thấy mới thử {{LF LF}}.
- **Không được trim body.** Body có thể bắt đầu hoặc kết thúc bằng khoảng trắng, thậm chí chứa dòng trống. Body là dữ liệu nhị phân đối với HTTP; chỉ header mới được chuẩn hoá.
- Tên header **không phân biệt hoa thường** ({{Content-Type}} và {{content-type}} là một); giá trị thì **phân biệt**, trừ khi chuẩn riêng định nghĩa ngược lại. Nên {{X-Trace: Abc}} khác {{X-Trace: abc}}, nhưng type/subtype trong {{Content-Type}} là ngoại lệ: {{application/JSON}} vẫn chỉ đúng một media type. Tên header không được chứa khoảng trắng; giá trị được cắt khoảng trắng hai đầu.
- Header trùng tên: chuẩn chỉ cho phép lặp với header dạng **danh sách** (ví dụ {{Accept}}, {{Cache-Control}}), và khi đó các dòng tương đương một dòng gộp bằng dấu phẩy ({{Accept: a}} + {{Accept: b}} = {{Accept: a, b}}). {{Set-Cookie}} là ngoại lệ: phải giữ riêng từng dòng vì giá trị cookie có thể chứa dấu phẩy. Trong bài tập, quy ước giá trị sau ghi đè giá trị trước cho đơn giản.

Độ dài body do {{Content-Length}} khai báo, hoặc dùng {{Transfer-Encoding: chunked}} khi chưa biết trước. Nếu server nhận **cả hai** header này thì đó là dấu hiệu tấn công **request smuggling** (proxy phía trước hiểu độ dài theo một header, backend hiểu theo header kia, nên phần dư bị coi là request thứ hai do kẻ tấn công cài vào). RFC 9112 quy định: {{Transfer-Encoding}} được ưu tiên và {{Content-Length}} bị bỏ qua; server **được phép** từ chối hẳn (400), và nếu vẫn xử lý thì phải **đóng kết nối** sau response. Cách an toàn nhất trên production là từ chối.

### Method: safe, idempotent và hệ quả
- **Safe** (an toàn): theo ngữ nghĩa, method chỉ **đọc**; client không yêu cầu thay đổi trạng thái server. Vì vậy trình duyệt được prefetch link, crawler được gọi tuỳ ý. (Server vẫn có thể ghi log hay tăng bộ đếm, nhưng client không chịu trách nhiệm cho các tác dụng phụ đó.)
- **Idempotent** (bất biến với lặp): gọi một lần hay nhiều lần với cùng dữ liệu thì **trạng thái cuối** như nhau. Lưu ý: response có thể khác nhau giữa các lần gọi, HTTP không bắt response phải giống nhau.
- **Cacheable**: response có thể được cache. Trên thực tế chỉ GET và HEAD được cache; POST về lý thuyết cacheable khi có header tường minh nhưng gần như không cache nào hỗ trợ.

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
| 304 Not Modified | client gửi {{If-None-Match}} khớp {{ETag}} (hoặc {{If-Modified-Since}}), không có body; client dùng lại bản đã cache |
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
- {{Cache-Control}} quyết định ai được cache và bao lâu. {{public}} cho phép cả proxy dùng chung; {{private}} chỉ cho cache riêng của client (trình duyệt) lưu; {{no-store}} cấm **mọi** cache lưu response (cả RAM lẫn đĩa); {{no-cache}} thì ngược với tên gọi: vẫn được lưu nhưng phải hỏi lại server (revalidate) trước mỗi lần dùng; {{max-age}} tính bằng giây; {{s-maxage}} dành cho proxy dùng chung; {{stale-while-revalidate}} cho phép trả bản cũ trong lúc làm mới.
- {{ETag}} là dấu vân tay của phiên bản tài nguyên. Client gửi lại trong {{If-None-Match}} để nhận 304 (tiết kiệm băng thông), hoặc trong {{If-Match}} để chống ghi đè (nhận 412 nếu đã có người sửa trước).
- {{Vary}} cho cache biết response thay đổi theo header nào; thiếu {{Vary: Accept-Encoding}} có thể khiến proxy trả bản gzip cho client không hỗ trợ.

Với dữ liệu ngân hàng như số dư hay lịch sử giao dịch, mặc định nên là {{Cache-Control: no-store}} (nhiều team ghi thêm {{private}} cho chắc với cache cũ) và chỉ mở cache cho dữ liệu tham chiếu ít đổi (danh mục chi nhánh, tỉ giá có TTL ngắn). Một cấu hình cache sai ở đây không chỉ làm chậm; nó còn có thể để lộ dữ liệu của người này cho người khác qua proxy dùng chung.

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
      explain: `Điểm mấu chốt là **ranh giới head/body** và **không đụng vào body**. Nếu dùng {{split(":")}} không giới hạn, giá trị {{abc:def}} sẽ bị cắt sai; phải dùng {{indexOf(':')}} hoặc {{split(":", 2)}}. Thứ tự tìm separator rất quan trọng: chuỗi {{"\\r\\n\\r\\n"}} **không** chứa {{"\\n\\n"}} (giữa hai ký tự {{\\n}} có một {{\\r}}). Nên nếu tìm {{"\\n\\n"}} trước trên request CRLF, bạn hoặc không thấy ranh giới thật, hoặc tệ hơn là khớp nhầm một {{"\\n\\n"}} nằm sâu trong body và cắt sai cả message.

Lỗi hay gặp khác: dùng {{trim()}} cho cả message làm mất khoảng trắng đầu/cuối của body; không đưa tên header về chữ thường nên tra {{"content-type"}} không thấy khi client gửi {{Content-Type}}; và tách request line bằng {{split(" ")}} không giới hạn rồi lấy sai phần tử. Lưu ý {{String.split}} mặc định bỏ các chuỗi rỗng ở cuối mảng; truyền {{-1}} nếu cần giữ. Trong production, parser thật còn phải giới hạn kích thước header (chống tấn công gửi header khổng lồ làm cạn bộ nhớ), từ chối {{obs-fold}} (giá trị header kéo sang dòng sau bằng cách thụt đầu dòng, đã bị RFC 9112 loại bỏ), và xử lý đúng {{Content-Length}} / {{Transfer-Encoding}} như phần lý thuyết.`,
    },
  ],
  check: [
    {
      q: 'Method nào **idempotent nhưng không safe**?',
      options: ['GET', 'PUT', 'POST', 'HEAD'],
      answer: 1,
      explain: `**PUT đúng**: PUT ghi đè tài nguyên nên gửi lặp vẫn ra cùng trạng thái (idempotent), nhưng nó **thay đổi** dữ liệu nên không safe. **GET** và **HEAD** sai vì chúng vừa safe vừa idempotent (câu hỏi cần method không safe). **POST** sai vì nó không safe và cũng không idempotent — đây là lý do cần idempotency key cho thanh toán.`,
    },
    {
      q: 'Client đã đăng nhập hợp lệ nhưng tài khoản không có role chuyển tiền. Server nên trả gì?',
      options: ['401 Unauthorized', '403 Forbidden', '404 Not Found', '422 Unprocessable Content'],
      answer: 1,
      explain: `401 dành cho trường hợp chưa xác thực được danh tính (thiếu/sai token). Đã biết là ai nhưng thiếu quyền thì là 403. 404 chỉ nên dùng khi muốn **che giấu** việc tài nguyên có tồn tại hay không (RFC 9110 cho phép); ở đây đó là một chức năng (chuyển tiền) mà user biết là có, nên 404 gây hiểu nhầm. 422 là lỗi ngữ nghĩa của body, không phải lỗi phân quyền.`,
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
      explain: `Số dư là dữ liệu nhạy cảm, không nên lưu ở bất kỳ cache nào (kể cả cache riêng của trình duyệt trên máy dùng chung), nên {{no-store}}. {{public}} cho phép proxy dùng chung cache và có thể lộ dữ liệu; {{s-maxage}} cũng là cache dùng chung; {{private, max-age=60}} chặn proxy dùng chung nhưng vẫn cho trình duyệt lưu 60 giây, nên người dùng sau trên cùng máy có thể thấy số dư cũ của người trước.`,
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
| Ghi đè | {{PUT /accounts/42}} | 200 hoặc 204; 201 nếu PUT tạo mới tài nguyên tại URI đó |
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
Validation nên chạy **trước** khi chạm database và trước khi thực hiện side effect. Với Spring Boot 3, {{@Valid}} trên {{@RequestBody}} kích hoạt Bean Validation; lỗi ném ra {{MethodArgumentNotValidException}} chứa **toàn bộ** field lỗi (qua {{getBindingResult().getFieldErrors()}}). Spring mặc định trả **400** cho exception này; muốn dùng 422 cho lỗi nghiệp vụ thì tự map trong {{@RestControllerAdvice}}. (Từ Spring Framework 6.1, ràng buộc đặt trực tiếp trên {{@PathVariable}}/{{@RequestParam}} có thể ném {{HandlerMethodValidationException}} — cũng cần xử lý.) Đừng bắt exception rồi trả một chuỗi chung "Dữ liệu không hợp lệ" — client không biết sửa field nào.

Nguyên tắc:
- Trả **tất cả** lỗi của các field trong một response, không dừng ở lỗi đầu tiên. Người dùng sửa form một lần tốt hơn sửa năm lần.
- Chỉ rõ **vị trí**: {{/amount}}, hoặc {{/beneficiaries/0/accountNumber}} nếu lỗi nằm trong mảng.
- Mã lỗi **ổn định** cho máy: {{INSUFFICIENT_FUNDS}}, {{ACCOUNT_FROZEN}}. Đừng để client so sánh chuỗi tiếng Việt.
- Không trả stack trace, tên bảng, câu SQL hay thông tin nội bộ. Log đầy đủ ở server kèm traceId, trả cho client traceId đó.
- Cẩn thận khi chính việc "tài nguyên có tồn tại" là thông tin nhạy cảm: user A gọi {{GET /accounts/99}} của user B mà nhận 403 thì A biết tài khoản 99 **có tồn tại**. RFC 9110 cho phép trả **404** thay cho 403 để che giấu điều này, và nhiều hệ thống ngân hàng làm vậy.

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

- {{type}} là URI định danh **loại** lỗi, không bắt buộc phải mở được (nhưng RFC khuyến nghị nếu mở được thì phải là tài liệu cho người đọc, nên hãy host tài liệu thật). Không có {{type}} thì mặc định là {{about:blank}}, nghĩa là "không có gì thêm ngoài ý nghĩa của status code".
- {{title}} là tóm tắt ngắn của **loại** lỗi, giống nhau giữa các lần xảy ra (chỉ khác khi dịch sang ngôn ngữ khác); {{detail}} mô tả **lần** xảy ra này cho con người đọc, có thể chứa số liệu cụ thể.
- {{status}} chỉ mang tính thông tin và phải khớp status code thật của response; đừng để 200 ở HTTP nhưng 422 trong body.
- {{instance}} là URI định danh lần xảy ra cụ thể (ví dụ đường dẫn chứa request id), để đối chiếu với log.
- Các field mở rộng như {{code}}, {{errors}}, {{traceId}} được phép; client dựa vào {{code}} và {{pointer}} chứ đừng parse {{detail}}.
- Với lỗi 5xx, body càng ít càng tốt: mã lỗi chung + traceId. Không đưa thông điệp exception thật ra ngoài.

Trong Spring Boot 3 (Spring Framework 6), {{ProblemDetail}} và {{ErrorResponseException}} có sẵn; bật {{spring.mvc.problemdetails.enabled=true}} để các lỗi Spring MVC mặc định (405, 415, lỗi validate…) cũng trả {{application/problem+json}}. Muốn thêm {{code}}/{{errors}} thì viết {{@RestControllerAdvice}} (thường kế thừa {{ResponseEntityExceptionHandler}}) và gọi {{problem.setProperty("code", "INSUFFICIENT_FUNDS")}}.

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

Ưu tiên route literal bằng {{literalCount}} mô phỏng hành vi của Spring MVC (so sánh độ cụ thể của {{PathPattern}}) và nhiều router dạng cây như Go chi: {{/accounts/me}} phải thắng /accounts/{id} vì nếu không, route tĩnh không bao giờ chạy được. Lưu ý không phải router nào cũng vậy: Express (Node.js) khớp theo **thứ tự đăng ký**, nên ở đó phải khai báo /accounts/me trước. Trong production còn nhiều thứ khác: regex constraint ({{id}} phải là số), wildcard, method OPTIONS tự sinh, và header {{Allow}} tính từ {{allowed()}}.

Lỗi hay gặp: so path bằng {{startsWith}} nên {{/accounts/42x}} khớp {{/accounts/42}}; quên bỏ query nên {{?limit=5}} làm hỏng segment cuối; và trả 405 mà không có {{Allow}} — client không biết cách sửa request.`,
    },
  ],
  check: [
    {
      q: 'Tạo tài khoản thành công. Response nào đúng nhất?',
      options: ['200 OK kèm body tài khoản', '201 Created kèm header Location', '202 Accepted kèm job id', '204 No Content'],
      answer: 1,
      explain: `**201 + Location đúng**: 201 nói rằng một tài nguyên **mới** đã được tạo; {{Location}} chỉ cho client URI của nó. **200** không sai về mặt kỹ thuật nhưng mất thông tin "mới được tạo". **202** sai vì nó dành cho việc mới được nhận và sẽ xử lý bất đồng bộ, trong khi ở đây tài khoản đã tạo xong. **204** sai vì nó báo không có body và thường dùng cho update/delete, không nói gì về tài nguyên mới.`,
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
      explain: `**422 đúng** theo quy ước của bài: body parse được nhưng vi phạm quy tắc nghiệp vụ. **400** dành cho JSON hỏng hoặc sai kiểu dữ liệu; nhiều API (và mặc định của Spring) gộp cả lỗi validate vào 400 — chấp nhận được nếu nhất quán toàn API, nhưng phương án này nói "request sai" một cách chung chung. **409** sai vì không có xung đột với trạng thái tài nguyên trên server. **500** sai vì lỗi nằm ở dữ liệu client gửi, không phải lỗi server; trả 5xx còn khiến client retry vô ích và làm nhiễu alert.`,
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
| Key cũ, body khác | Từ chối, **không** chạy nghiệp vụ. Bản nháp chuẩn IETF {{Idempotency-Key}} đề xuất 422; Stripe trả lỗi loại {{idempotency_error}} |
| Key cũ, request đầu còn đang chạy | Trả 409 Conflict "request in progress" (theo bản nháp IETF) hoặc chờ ngắn rồi trả kết quả |
| Key thiếu ở endpoint bắt buộc | 400, kèm mô tả header cần gửi |
| Key hết TTL | Coi như key mới; vì vậy TTL phải dài hơn cửa sổ retry của client |

Phạm vi key rất quan trọng: key phải unique trong phạm vi **(merchant/tenant, endpoint, key)**. Nếu chỉ unique toàn hệ thống, hai merchant tình cờ dùng cùng UUID sẽ đụng nhau; nếu không gắn endpoint, cùng key dùng cho hai API khác nhau sẽ trả nhầm kết quả. TTL thường 24 giờ (Stripe giữ key ít nhất 24 giờ); nếu client có thể retry trong 72 giờ (ví dụ job đối soát chạy lại các lệnh treo) thì TTL phải dài hơn 72 giờ.

Body fingerprint nên là **hash của raw body** (SHA-256) cho đơn giản: client retry phải gửi **byte-identical body**, format lại JSON giữa các lần retry là lỗi của client. Cách thứ hai là canonicalize (sắp xếp key JSON, chuẩn hoá số và unicode) rồi hash — gần với cách Stripe so sánh **tham số** thay vì từng byte — để chấp nhận request khác byte nhưng cùng ngữ nghĩa; bù lại bạn phải định nghĩa canonicalization thật kỹ và ghi rõ trong tài liệu, nếu không hai request "giống nhau về ngữ nghĩa" sẽ bị coi là khác. Chọn một trong hai và nhất quán toàn API.

### Lưu ở đâu
Có hai lựa chọn chính:

**Database (khuyến nghị cho thanh toán).** Bảng {{idempotency_keys(key, scope, request_hash, status, response_body, created_at, expires_at)}} với unique index trên {{(scope, key)}}. Ưu điểm: bền qua restart, audit được, và có thể ghi key **cùng transaction** với nghiệp vụ — hoặc dùng unique constraint để đảm bảo chỉ một request thắng. Nhược điểm: mỗi request thêm một round trip DB; cần job dọn key hết hạn.

**Redis.** {{SET key value NX EX 86400}} để giành quyền xử lý, sau đó lưu kết quả. Nhanh, TTL tự động, phù hợp API throughput cao. Nhược điểm: Redis mất dữ liệu (nếu không bật persistence đúng cách) có thể khiến key biến mất và request retry bị chạy lại; cần cấu hình replica/backup phù hợp. Nhiều hệ thống dùng Redis để chặn trùng tức thời và DB để lưu kết quả bền.

Điểm tinh tế: nếu bạn lưu key ở DB **sau khi** gọi payment gateway, vẫn có cửa sổ crash giữa hai bước. Cách chắc hơn là mô hình **state machine**: ghi key với trạng thái {{IN_PROGRESS}} trước, gọi gateway, rồi cập nhật {{DONE}} + response. Khi request trùng đến lúc đang {{IN_PROGRESS}}, trả 409 hoặc chờ; khi crash, job đối soát xử lý các key treo. Với gateway bên ngoài, chính gateway cũng cần nhận idempotency key của bạn để chống trừ tiền hai lần ở phía họ.

### Xử lý request song song
Hai request cùng key đến cách nhau vài mili giây là chuyện bình thường khi client bắn song song hoặc load balancer retry. Nếu code là "check map rồi mới put", cả hai đều thấy key chưa có và cùng chạy nghiệp vụ — đúng lỗi ta muốn tránh.

Ba cách đúng:
1. **In-memory**: {{ConcurrentHashMap.computeIfAbsent}} đảm bảo hàm tính chỉ chạy một lần cho mỗi key trong một JVM. Chỉ dùng khi một instance; nhiều instance thì vô nghĩa.
2. **Database**: insert key với unique constraint; request thua bị DB từ chối (Spring dịch thành {{DuplicateKeyException}}; trên PostgreSQL có thể dùng {{INSERT ... ON CONFLICT DO NOTHING}} rồi xem số dòng được insert) và đọc kết quả của request thắng (poll ngắn nếu còn {{IN_PROGRESS}}).
3. **Distributed lock**: Redis {{SET NX}} hoặc lock theo key; nhớ TTL cho lock để không treo khi instance chết.

Lưu ý {{ConcurrentHashMap.computeIfAbsent}} giữ lock của bin (một ô trong bảng băm) trong lúc chạy hàm, nên nếu nghiệp vụ chậm (gọi gateway 2 giây) các key khác rơi cùng bin cũng bị block; và hàm bên trong tuyệt đối không được sửa chính map đó. Với nghiệp vụ dài, dùng {{FutureTask}} đặt vào map trước rồi mới chạy, hoặc lock theo key ở tầng ngoài.

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
      explain: `Key đã gắn với một thao tác khác nên không thể trả kết quả cũ (sai tiền) cũng không thể chạy mới (phá hợp đồng idempotent). Bản nháp chuẩn IETF {{Idempotency-Key}} đề xuất 422; một số API dùng 409 hoặc 400 (Stripe trả lỗi loại {{idempotency_error}}); điểm cốt lõi là **từ chối**, không thực thi. **200 với kết quả cũ** sai vì client sẽ tưởng giao dịch mới (khác số tiền) đã thành công. **400 vì JSON sai** sai vì JSON hoàn toàn hợp lệ, vấn đề nằm ở việc dùng lại key. **412** dành cho precondition như {{If-Match}}, không phải lỗi tái sử dụng key.`,
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
},

{
  id: 'lesson-api-004',
  track: 'api',
  order: 4,
  title: 'Idempotency-Key: chống trừ tiền 2 lần khi client retry POST',
  level: 'senior',
  minutes: 35,
  goals: [
    'Giải thích được vì sao POST không idempotent gây trừ tiền/đặt hàng 2 lần khi mạng lỗi và client retry',
    'Thiết kế được luồng Idempotency-Key: lưu key + hash request + trạng thái + response; xử lý key trùng, body khác (422), và request đang xử lý (409)',
    'Viết được IdempotencyStore trong Java thuần, an toàn với 2 thread cùng key (chỉ chạy nghiệp vụ 1 lần)',
  ],
  body: `### Cái gì: POST không tự an toàn khi retry
**Tóm tắt:** {{Idempotency-Key}} là một chuỗi do client sinh (thường UUID) gửi kèm header mỗi request tạo tài nguyên/thanh toán. Server dùng key đó để nhận ra "request này đã xử lý rồi" và trả lại đúng response cũ thay vì chạy nghiệp vụ lần hai.

**Thuật ngữ lần đầu gặp:**
- **Idempotent (bất biến theo lần lặp)**: gọi 1 lần hay 10 lần với cùng đầu vào thì kết quả cuối trên server giống nhau. Ví dụ đời thường: bấm nút tầng 5 trong thang máy nhiều lần vẫn chỉ tới tầng 5.
- **Retry (thử lại)**: client tự gửi lại request khi nghi ngờ lỗi (timeout, mất mạng). Mobile app, API gateway, SDK đều hay retry.
- **Race condition (đua nhau)**: 2 thread/request cùng chạy và cùng đọc/ghi một trạng thái, dẫn đến kết quả sai (ở đây: chạy nghiệp vụ 2 lần).
- **TTL (Time To Live)**: thời gian sống của một bản ghi; hết TTL thì xoá để bảng không phình vô hạn.

HTTP định nghĩa {{GET}}, {{PUT}}, {{DELETE}} là idempotent, còn {{POST}} (tạo mới/thanh toán) thì **không**. Vì vậy {{POST /payments}} retry có thể tạo 2 giao dịch.

### Vì sao cần: câu chuyện trừ tiền 2 lần
Giả sử người dùng bấm "Thanh toán 500.000đ":
1. Client gửi {{POST /payments}} kèm {{Idempotency-Key: 7f3a-...}}.
2. Server trừ tiền, ghi DB, nhưng response bị mất trên đường về (mạng chập chờn).
3. Client thấy timeout, SDK tự retry cùng request, **cùng key**.
4. Nếu server không nhớ key: trừ tiền lần 2. Khách mất 1.000.000đ.

Idempotency-Key biến retry thành "hãy cho tôi kết quả của lần đầu".

### Hoạt động thế nào: luồng nhiều bên
~~~seq
title: POST thanh toán với Idempotency-Key (retry an toàn)
actors: Client | Payment API | Idempotency Store | Core Banking
Client -> Payment API: POST /payments, Idempotency-Key=K1, body={500k}
Payment API -> Idempotency Store: lookup(K1, hash(body))
Idempotency Store --> Payment API: MISS (chưa có)
Payment API -> Idempotency Store: claim(K1, IN_PROGRESS)
Payment API -> Core Banking: debit(500k)
Core Banking --> Payment API: OK, txn=TX99
Payment API -> Idempotency Store: save(K1, hash, 201, response)
Payment API --> Client: 201 Created (bị mất do mạng)
Client -> Payment API: RETRY POST, cùng K1, cùng body
Payment API -> Idempotency Store: lookup(K1, hash(body))
Idempotency Store --> Payment API: HIT (201, response cũ)
Payment API --> Client: 201 Created (response cũ, KHÔNG trừ tiền lại)
~~~

Các tình huống server phải xử lý:

| Tình huống | Cách xử lý | HTTP gợi ý |
|---|---|---|
| Key mới | Claim {{IN_PROGRESS}}, chạy nghiệp vụ, lưu response | 201/200 như bình thường |
| Key trùng, **cùng** hash body, đã có response | Trả lại response cũ, **không** chạy nghiệp vụ | Trả lại đúng status/body cũ |
| Key trùng, **khác** hash body | Từ chối (client dùng lại key cho request khác là bug) | 422 Unprocessable Entity |
| Key trùng, đang {{IN_PROGRESS}} | Request đầu chưa xong; tránh chạy song song | 409 Conflict (+ Retry-After) |

**Vì sao phải lưu hash của body?** Nếu client vô tình dùng lại cùng key cho một đơn hàng khác (body khác), trả response cũ sẽ sai nghiệp vụ (trả kết quả đơn A cho đơn B). So hash giúp phát hiện lỗi này.

**Vì sao cần "claim" IN_PROGRESS?** Hai retry đến gần như cùng lúc: cả hai cùng thấy MISS rồi cùng gọi Core Banking → trừ tiền 2 lần. Claim phải là thao tác **atomic** (nguyên tử: chỉ một bên thắng).

### Ví dụ cụ thể (Java thuần, mô phỏng cơ chế)
~~~java
import java.util.*; import java.util.concurrent.*; import java.util.function.*;

class Response { final int status; final String body;
    Response(int status, String body){ this.status=status; this.body=body; } }

class IdempotencyStore {
    enum State { IN_PROGRESS, DONE }
    static final class Entry {
        final State state; final String hash; final Response resp;
        Entry(State s, String h, Response r){ state=s; hash=h; resp=r; }
    }
    // ConcurrentHashMap: ghi/đọc an toàn giữa nhiều thread
    private final ConcurrentHashMap<String, Entry> map = new ConcurrentHashMap<>();

    Response execute(String key, String requestHash, Supplier<Response> work) {
        // putIfAbsent là atomic: chỉ thread đầu tiên đặt IN_PROGRESS
        Entry first = map.putIfAbsent(key, new Entry(State.IN_PROGRESS, requestHash, null));
        if (first == null) {
            try {
                Response r = work.get();                 // chỉ thread thắng mới chạy
                map.put(key, new Entry(State.DONE, requestHash, r));
                return r;
            } catch (RuntimeException e) {
                map.remove(key);                         // lỗi: cho phép retry thật sự
                throw e;
            }
        }
        // đã có entry từ trước
        if (!Objects.equals(first.hash, requestHash)) {
            return new Response(422, "key reused with different body");
        }
        if (first.state == State.IN_PROGRESS) {
            return new Response(409, "request in progress");
        }
        return first.resp;                               // HIT: trả response cũ
    }
}
~~~

### Lỗi hay gặp
- **Chỉ lưu key, không lưu hash body**: dùng lại key cho request khác → trả nhầm response. Luôn so hash.
- **Không atomic khi claim**: check-then-act ({{if (!map.containsKey(k)) map.put(...)}}) không an toàn đa luồng. Dùng {{putIfAbsent}}/ràng buộc unique ở DB ({{INSERT ... ON CONFLICT}}).
- **TTL quá ngắn**: ngắn hơn cửa sổ retry của client → retry muộn bị coi là request mới, trừ tiền 2 lần. TTL thường 24 giờ; webhook retry dài thì dài hơn.
- **Không lưu response, chỉ lưu "đã xử lý"**: retry thành công phía server nhưng client không nhận lại được body (mã giao dịch) để hiển thị/đối soát.
- **Áp dụng cho GET**: GET vốn idempotent, không cần key; thêm key gây phức tạp vô ích.

### Liên hệ phỏng vấn
Câu hay hỏi: "Làm sao chống double charge khi retry?" Trả lời theo khung: (1) client sinh {{Idempotency-Key}} per thao tác, (2) server lưu (key, hash body, trạng thái, response) với unique constraint, (3) claim IN_PROGRESS atomic để tránh race, (4) hit thì trả response cũ, body khác thì 422, đang xử lý thì 409, (5) TTL ≥ cửa sổ retry. Nhấn mạnh: **atomic claim** là điểm quyết định; chỉ "check rồi insert" sẽ hỏng dưới concurrency. Nêu ví dụ thanh toán/đặt hàng để chứng minh bạn từng gặp bài toán thật.

> **Senior tip:** Trong production, key sống ở DB (Postgres unique index) hoặc Redis, không chỉ in-memory; response lưu đủ để tái lập chính xác. Với luồng "chạy lâu" (phê duyệt, chuyển tiền xuyên ngân hàng), tách {{IN_PROGRESS}} có timeout/heartbeat để tránh kẹt vĩnh viễn khi process chết giữa chừng.`,
  exercises: [
    {
      title: 'IdempotencyStore: execute chỉ chạy nghiệp vụ 1 lần kể cả khi 2 thread cùng key',
      prompt: `Viết {{class IdempotencyStore}} với method:
{{Response execute(String key, String requestHash, Supplier<Response> work)}}

Quy tắc:
- Key **mới**: chạy {{work.get()}} đúng 1 lần, lưu (key, requestHash, response), trả response.
- Key **trùng, cùng** {{requestHash}}, đã có response: trả lại response cũ, **không** chạy {{work}}.
- Key **trùng, khác** {{requestHash}}: trả {{new Response(422, "key reused with different body")}}.
- Key **trùng**, request đầu **đang xử lý** (chưa có response): trả {{new Response(409, "request in progress")}}.

Class {{Response}} đã cho: {{final int status; final String body;}} và constructor {{Response(int status, String body)}}.
Yêu cầu an toàn đa luồng: nếu 2 thread gọi {{execute}} **cùng lúc** với cùng key mới, {{work}} chỉ được chạy **đúng 1 lần**.`,
      starter: `class Response {
    final int status;
    final String body;
    Response(int status, String body) { this.status = status; this.body = body; }
}

class IdempotencyStore {
    // TODO: lưu trạng thái theo key, an toàn đa luồng

    Response execute(String key, String requestHash, java.util.function.Supplier<Response> work) {
        throw new UnsupportedOperationException("TODO");
    }
}`,
      tests: `import java.util.concurrent.*; import java.util.concurrent.atomic.*; import java.util.function.*;
public class Main {
    static int passed = 0, total = 0;
    static void check(String name, boolean ok, String detail) {
        total++;
        if (ok) { passed++; System.out.println("PASS " + name); }
        else System.out.println("FAIL " + name + ": " + detail);
    }
    static boolean eq(Response r, int st, String body) {
        return r != null && r.status == st && body.equals(r.body);
    }
    public static void main(String[] args) throws Exception {
        // 1. key mới chạy work và trả response
        IdempotencyStore s1 = new IdempotencyStore();
        AtomicInteger calls = new AtomicInteger(0);
        Response r1 = s1.execute("k1", "hA", () -> { calls.incrementAndGet(); return new Response(201, "ok"); });
        check("new key runs work", eq(r1, 201, "ok") && calls.get() == 1, "status/body/calls=" + (r1==null?"null":r1.status+","+r1.body) + "/" + calls.get());

        // 2. retry cùng key + cùng hash trả response cũ, không chạy work
        Response r2 = s1.execute("k1", "hA", () -> { calls.incrementAndGet(); return new Response(201, "again"); });
        check("same key+hash returns cached", eq(r2, 201, "ok") && calls.get() == 1, "calls=" + calls.get() + " body=" + (r2==null?"null":r2.body));

        // 3. cùng key nhưng hash khác -> 422
        Response r3 = s1.execute("k1", "hB", () -> { calls.incrementAndGet(); return new Response(201, "x"); });
        check("same key different hash -> 422", eq(r3, 422, "key reused with different body") && calls.get() == 1, "got " + (r3==null?"null":r3.status+","+r3.body));

        // 4. key khác chạy độc lập
        Response r4 = s1.execute("k2", "hA", () -> { calls.incrementAndGet(); return new Response(200, "two"); });
        check("different key independent", eq(r4, 200, "two") && calls.get() == 2, "calls=" + calls.get());

        // 5. request đang xử lý -> 409
        IdempotencyStore s2 = new IdempotencyStore();
        CountDownLatch started = new CountDownLatch(1);
        CountDownLatch release = new CountDownLatch(1);
        Thread t = new Thread(() -> s2.execute("slow", "hs", () -> {
            started.countDown();
            try { release.await(2, TimeUnit.SECONDS); } catch (InterruptedException e) { Thread.currentThread().interrupt(); }
            return new Response(201, "done");
        }));
        t.start();
        started.await(2, TimeUnit.SECONDS);
        Response r5 = s2.execute("slow", "hs", () -> new Response(201, "nope"));
        release.countDown();
        t.join(2000);
        check("in progress -> 409", eq(r5, 409, "request in progress"), "got " + (r5==null?"null":r5.status+","+r5.body));

        // 6. 2 thread cùng key mới: work chỉ chạy 1 lần
        IdempotencyStore s3 = new IdempotencyStore();
        AtomicInteger workCalls = new AtomicInteger(0);
        CountDownLatch go = new CountDownLatch(1);
        CountDownLatch both = new CountDownLatch(2);
        Callable<Response> task = () -> {
            go.await(2, TimeUnit.SECONDS);
            Response r = s3.execute("race", "hr", () -> { workCalls.incrementAndGet(); return new Response(201, "race-ok"); });
            both.countDown();
            return r;
        };
        ExecutorService ex = Executors.newFixedThreadPool(2);
        Future<Response> f1 = ex.submit(task); Future<Response> f2 = ex.submit(task);
        go.countDown();
        both.await(3, TimeUnit.SECONDS);
        Response a = f1.get(2, TimeUnit.SECONDS); Response b = f2.get(2, TimeUnit.SECONDS);
        ex.shutdownNow();
        boolean bothOk = (eq(a, 201, "race-ok") || eq(a, 409, "request in progress"))
                      && (eq(b, 201, "race-ok") || eq(b, 409, "request in progress"));
        check("2 threads same key: work once", workCalls.get() == 1 && bothOk, "workCalls=" + workCalls.get() + " a=" + (a==null?"n":a.status) + " b=" + (b==null?"n":b.status));

        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
      reference: `class Response {
    final int status;
    final String body;
    Response(int status, String body) { this.status = status; this.body = body; }
}

class IdempotencyStore {
    enum State { IN_PROGRESS, DONE }
    static final class Entry {
        final State state; final String hash; final Response resp;
        Entry(State s, String h, Response r) { state = s; hash = h; resp = r; }
    }
    private final java.util.concurrent.ConcurrentHashMap<String, Entry> map = new java.util.concurrent.ConcurrentHashMap<>();

    Response execute(String key, String requestHash, java.util.function.Supplier<Response> work) {
        Entry first = map.putIfAbsent(key, new Entry(State.IN_PROGRESS, requestHash, null));
        if (first == null) {
            try {
                Response r = work.get();
                map.put(key, new Entry(State.DONE, requestHash, r));
                return r;
            } catch (RuntimeException e) {
                map.remove(key);
                throw e;
            }
        }
        if (!java.util.Objects.equals(first.hash, requestHash)) {
            return new Response(422, "key reused with different body");
        }
        if (first.state == State.IN_PROGRESS) {
            return new Response(409, "request in progress");
        }
        return first.resp;
    }
}`,
      hints: [
        'Dùng {{ConcurrentHashMap}} và {{putIfAbsent}} để claim key một cách atomic: chỉ thread nhận về {{null}} (mình là người đặt đầu tiên) mới được chạy {{work}}.',
        'Lưu một Entry gồm {{state}} (IN_PROGRESS/DONE), {{hash}}, và {{resp}}. Với entry đã có: so hash trước, rồi xét state.',
      ],
      explain: `Điểm mấu chốt là **atomic claim**: {{putIfAbsent}} vừa kiểm tra vừa đặt trong một bước, nên dù 2 thread cùng vào, chỉ 1 thread nhận {{null}} và chạy {{work.get()}}. Thread kia thấy entry {{IN_PROGRESS}} và trả 409 (hoặc, nếu chạy sau khi DONE, trả response cũ).

Nếu dùng {{if (!map.containsKey(k)) map.put(k, ...)}} (check-then-act tách rời), cả hai thread có thể cùng vượt qua {{if}} rồi cùng chạy nghiệp vụ: đây chính là race condition gây trừ tiền 2 lần.

Khi {{work}} ném lỗi, ta {{remove(key)}} để lần retry sau có thể thử lại thật sự (nếu giữ IN_PROGRESS mãi, mọi retry sẽ bị 409 vĩnh viễn). Trong production, phần "claim" thường là câu {{INSERT}} với unique key ở DB để atomic ngay cả khi chạy nhiều instance server.`,
    },
  ],
  check: [
    {
      q: 'Client gửi lại POST thanh toán với CÙNG Idempotency-Key nhưng body KHÁC (số tiền khác). Server nên làm gì?',
      options: [
        'Chạy nghiệp vụ với body mới vì đó là ý định mới nhất',
        'Trả response cũ của lần đầu',
        'Từ chối với lỗi 422 vì key bị dùng lại cho request khác',
        'Xoá key cũ rồi xử lý như request mới',
      ],
      answer: 2,
      explain: `Đáp án đúng là 422. Cùng key nhưng hash body khác cho thấy client dùng lại key sai (bug phía client) hoặc cố gửi request khác; trả response cũ sẽ trả kết quả của giao dịch A cho giao dịch B (sai nghiệp vụ), còn chạy body mới sẽ phá cam kết idempotency của key. So hash body và từ chối rõ ràng là an toàn nhất.`,
    },
    {
      q: 'Vì sao bước "claim" key IN_PROGRESS phải là thao tác atomic (như putIfAbsent hoặc unique constraint ở DB)?',
      options: [
        'Để tiết kiệm bộ nhớ',
        'Để hai request retry đến cùng lúc không cùng chạy nghiệp vụ, tránh trừ tiền 2 lần',
        'Để response trả về nhanh hơn',
        'Vì HTTP bắt buộc mọi header phải xử lý atomic',
      ],
      answer: 1,
      explain: `Nếu check và ghi tách rời, hai thread/request có thể cùng thấy "chưa có key" rồi cùng chạy nghiệp vụ: race condition gây double charge. Thao tác atomic đảm bảo chỉ một bên thắng quyền chạy; bên còn lại nhận biết request đang xử lý (409) hoặc đã xong (trả response cũ).`,
    },
    {
      q: 'Retry cùng key đến khi request đầu tiên VẪN đang xử lý (chưa có response). Phản hồi phù hợp nhất là gì?',
      options: [
        '200 OK với body rỗng',
        '409 Conflict (đang xử lý), kèm gợi ý thử lại sau',
        '500 Internal Server Error',
        'Chạy một bản sao nghiệp vụ thứ hai cho chắc',
      ],
      answer: 1,
      explain: `409 báo request trùng đang được xử lý; client nên chờ rồi hỏi lại (hoặc server hỗ trợ long-poll). Chạy bản sao thứ hai phá idempotency (trừ tiền 2 lần). 200 rỗng nói dối rằng đã xong. 500 ám chỉ lỗi server trong khi thực ra chỉ là đang bận xử lý.`,
    },
    {
      q: 'TTL (thời gian sống) của bản ghi idempotency nên chọn thế nào?',
      options: [
        'Càng ngắn càng tốt, ví dụ 30 giây, để tiết kiệm bộ nhớ',
        'Dài hơn cửa sổ retry của client (thường ≥ 24 giờ); quá ngắn thì retry muộn bị coi là request mới',
        'Không bao giờ hết hạn để an toàn tuyệt đối',
        'Bằng đúng thời gian xử lý trung bình của request',
      ],
      answer: 1,
      explain: `Key phải sống ít nhất bằng khoảng thời gian client còn có thể retry; nếu ngắn hơn, retry muộn sẽ tạo giao dịch mới. 24 giờ là mức phổ biến. Không hết hạn thì bảng phình vô hạn. 30 giây hoặc bằng thời gian xử lý đều quá ngắn so với retry thực tế (client có thể retry sau phút, giờ khi mạng hồi phục).`,
    },
  ],
  related: ['api-015', 'api-011', 'api-002'],
  tags: ['idempotency', 'payment', 'concurrency', 'REST', 'retry'],
},

{
  id: 'lesson-api-005',
  track: 'api',
  order: 5,
  title: 'Phân trang API: cursor (keyset) vs offset/limit',
  level: 'senior',
  minutes: 35,
  goals: [
    'Giải thích được vì sao OFFSET lớn chậm và vì sao offset gây trùng/sót bản ghi khi dữ liệu bị chèn/xoá giữa các trang',
    'Hiểu cơ chế cursor (keyset pagination): mã hoá vị trí (createdAt, id), truy vấn "sau mốc này", sort ổn định',
    'Cài được CursorPager trong Java thuần trả items + nextCursor (Base64 của "createdAt|id") không trùng không sót khi có chèn thêm',
  ],
  body: `### Cái gì: phân trang là gì
**Tóm tắt:** Phân trang (pagination) chia một danh sách lớn thành nhiều trang nhỏ để API không trả hàng triệu bản ghi một lúc. Hai cách phổ biến: **offset/limit** ("bỏ qua N bản ghi đầu") và **cursor/keyset** ("lấy các bản ghi sau mốc X").

**Thuật ngữ lần đầu gặp:**
- **Offset**: số bản ghi cần bỏ qua tính từ đầu. Ví dụ đời thường: đọc sách từ trang 101 nghĩa là bỏ qua 100 trang đầu.
- **Cursor (con trỏ vị trí)**: một mốc đánh dấu "tôi đang ở đây". Ví dụ đời thường: cái kẹp sách đánh dấu trang bạn đọc dở, dù ai có rút thêm trang ở trước thì kẹp vẫn chỉ đúng chỗ bạn dở.
- **Keyset pagination**: dùng giá trị của (các) cột đã sắp xếp làm cursor, thay vì đếm vị trí. "Keyset" = tập khoá định vị.
- **Ổn định (stable sort)**: thứ tự sắp xếp không đổi khi có phần tử bằng nhau; thường đạt bằng cách thêm một cột duy nhất (như {{id}}) làm tiêu chí phụ.
- **Base64**: cách mã hoá dữ liệu nhị phân/chuỗi thành chuỗi ký tự an toàn để đặt trong URL; không phải mã hoá bí mật.

### Vì sao cần: offset chậm và sai khi dữ liệu thay đổi
**Offset chậm ở trang sâu:** {{SELECT * FROM orders ORDER BY created_at DESC LIMIT 20 OFFSET 100000}} buộc DB vẫn phải duyệt và bỏ qua 100.000 dòng đầu rồi mới lấy 20 dòng. Trang càng sâu càng chậm (O(offset + limit)).

**Offset trùng/sót khi có chèn/xoá:** Bạn đang xem trang 1 (bản ghi A, B). Trước khi bạn sang trang 2 (OFFSET 2), có bản ghi mới X được chèn lên đầu. Danh sách giờ là X, A, B. Trang 2 với OFFSET 2 sẽ trả B lần nữa (trùng), còn nếu có bản ghi bị xoá bạn có thể bị sót. Đây là lỗi rất hay gặp ở feed/thông báo realtime.

| | Offset/limit | Cursor/keyset |
|---|---|---|
| Cú pháp | {{?page=5001}} hoặc {{?offset=100000&limit=20}} | {{?cursor=abc&limit=20}} |
| Trang sâu | Chậm (quét bỏ offset dòng) | Nhanh đều (đi thẳng tới mốc nhờ index) |
| Chèn/xoá giữa chừng | Dễ trùng/sót | Không trùng, không sót (bám theo mốc) |
| Nhảy tới trang N tuỳ ý | Được | Không trực tiếp (chỉ đi tiếp/lùi) |
| Triển khai | Đơn giản | Cần sort ổn định + mã hoá cursor |

### Hoạt động thế nào: cursor mã hoá (createdAt, id)
Chọn cột sắp xếp có thứ tự ổn định, ví dụ {{(createdAt DESC, id DESC)}} (id làm tiêu chí phụ để phá vỡ trường hợp cùng thời gian). Trang đầu:
- Query: lấy 20 bản ghi mới nhất (không cần WHERE theo cursor).
- {{nextCursor}} = Base64 của "{{createdAt}}|{{id}}" của **bản ghi cuối** trang.

Trang sau, client gửi lại {{cursor}}:
- Giải mã ra {{(t, i)}}.
- Query: {{WHERE (createdAt < t) OR (createdAt = t AND id < i) ORDER BY createdAt DESC, id DESC LIMIT 20}}.
- DB dùng index trên {{(createdAt, id)}} để nhảy thẳng tới mốc, không quét bỏ.

Vì ta bám theo giá trị mốc chứ không đếm vị trí, một bản ghi mới chèn "phía trên" (mới hơn mốc) không làm đổi tập bản ghi "sau mốc". Không trùng, không sót.

### Ví dụ cụ thể (Java thuần, mô phỏng)
~~~java
import java.util.*;

class Item {
    final long createdAt; final long id; final String name;
    Item(long createdAt, long id, String name){ this.createdAt=createdAt; this.id=id; this.name=name; }
}

class PageResult { final List<Item> items; final String nextCursor;
    PageResult(List<Item> items, String nextCursor){ this.items=items; this.nextCursor=nextCursor; } }

class CursorPager {
    static PageResult page(List<Item> sortedData, String cursor, int size) {
        long ct = Long.MAX_VALUE, ci = Long.MAX_VALUE;          // trang đầu: không chặn
        if (cursor != null && !cursor.isEmpty()) {
            String dec = new String(Base64.getUrlDecoder().decode(cursor));
            String[] p = dec.split("[|]");                     // "createdAt|id"
            ct = Long.parseLong(p[0]); ci = Long.parseLong(p[1]);
        }
        List<Item> out = new ArrayList<>();
        for (Item it : sortedData) {                              // sortedData: DESC (createdAt,id)
            boolean after = (it.createdAt < ct) || (it.createdAt == ct && it.id < ci);
            if (after) { out.add(it); if (out.size() == size) break; }
        }
        String next = null;
        if (out.size() == size) {
            Item last = out.get(out.size() - 1);
            next = Base64.getUrlEncoder().withoutPadding()
                    .encodeToString((last.createdAt + "|" + last.id).getBytes());
        }
        return new PageResult(out, next);
    }
}
~~~

**Minh hoạ không trùng/sót:** trang 1 trả [A, B], cursor trỏ sau B. Có bản ghi X mới chèn lên đầu danh sách. Trang 2 hỏi "sau B" → vẫn trả [C, D], không lặp A/B và không sót C/D, dù X chen ngang.

### Lỗi hay gặp
- **Sort không ổn định**: chỉ {{ORDER BY createdAt}} mà nhiều bản ghi cùng {{createdAt}} → thứ tự giữa chúng không xác định, cursor có thể bỏ sót/lặp. Luôn thêm cột duy nhất ({{id}}) làm tie-breaker.
- **Cursor lộ thông tin nội bộ nhạy cảm**: cursor chỉ là vị trí, nhưng đừng nhét dữ liệu bí mật; có thể ký (HMAC) nếu sợ client sửa cursor để dò dữ liệu.
- **Dùng offset cho feed vô hạn**: feed thêm liên tục + người dùng cuộn sâu → vừa chậm vừa trùng. Feed/notification gần như luôn nên dùng cursor.
- **Quên index (createdAt, id)**: không có index thì truy vấn cursor vẫn quét bảng, mất lợi thế tốc độ.

### Liên hệ phỏng vấn
Câu hay hỏi: "Thiết kế API phân trang cho feed 10 triệu bản ghi?" Trả lời: (1) dùng cursor (keyset) trên {{(createdAt, id)}} để tránh quét offset và tránh trùng/sót khi có bài mới; (2) cursor là Base64 (tuỳ chọn ký HMAC) của mốc cuối trang; (3) index kép {{(createdAt DESC, id DESC)}}; (4) so sánh offset chỉ phù hợp màn hình admin cần nhảy trang và dữ liệu ít biến động. Nêu được ví dụ "chèn bản ghi mới giữa hai lần tải trang" là cộng điểm thực tế.

> **Senior tip:** Trả {{nextCursor: null}} (hoặc bỏ field) ở trang cuối để client biết dừng, tránh vòng lặp vô hạn. Với dữ liệu cho phép "nhảy trang" (bảng quản trị), có thể dùng offset nhưng vẫn nên đặt trần offset tối đa; với API public/volume lớn, cursor gần như luôn là lựa chọn đúng.`,
  exercises: [
    {
      title: 'CursorPager.page: phân trang cursor không trùng không sót',
      prompt: `Viết {{class CursorPager}} với method:
{{static PageResult page(List<Item> sortedData, String cursor, int size)}}

- {{Item}} có {{final long createdAt; final long id; final String name;}} và constructor {{Item(long createdAt, long id, String name)}}.
- {{PageResult}} có {{final List<Item> items; final String nextCursor;}} và constructor {{PageResult(List<Item> items, String nextCursor)}}.
- {{sortedData}} đã sắp xếp **giảm dần** theo {{(createdAt, id)}} (mới nhất trước). Danh sách này có thể được thêm phần tử mới ở đầu giữa các lần gọi {{page}} (mô phỏng dữ liệu mới chèn vào).
- {{cursor == null}} hoặc rỗng: trả trang đầu tiên (tối đa {{size}} phần tử đầu danh sách).
- Ngược lại: giải mã cursor (Base64 của chuỗi {{"createdAt|id"}}) và trả tối đa {{size}} phần tử **đứng sau** mốc đó theo đúng thứ tự giảm dần.
- {{nextCursor}} là Base64 của {{"createdAt|id"}} của **phần tử cuối** trong {{items}} trả về; nếu không còn phần tử phía sau thì {{nextCursor = null}}.
- Yêu cầu: khi có phần tử mới chèn vào đầu {{sortedData}} giữa trang 1 và trang 2, việc dùng {{nextCursor}} của trang 1 vẫn cho kết quả **không trùng, không sót** so với tập phần tử cũ.`,
      starter: `import java.util.*;

class Item {
    final long createdAt;
    final long id;
    final String name;
    Item(long createdAt, long id, String name) { this.createdAt = createdAt; this.id = id; this.name = name; }
}

class PageResult {
    final List<Item> items;
    final String nextCursor;
    PageResult(List<Item> items, String nextCursor) { this.items = items; this.nextCursor = nextCursor; }
}

class CursorPager {
    static PageResult page(List<Item> sortedData, String cursor, int size) {
        throw new UnsupportedOperationException("TODO");
    }
}`,
      tests: `import java.util.*;
public class Main {
    static int passed = 0, total = 0;
    static void check(String name, boolean ok, String detail) {
        total++;
        if (ok) { passed++; System.out.println("PASS " + name); }
        else System.out.println("FAIL " + name + ": " + detail);
    }
    static String ids(List<Item> items) {
        StringBuilder b = new StringBuilder();
        for (Item it : items) { if (b.length() > 0) b.append(','); b.append(it.id); }
        return b.toString();
    }
    static List<Item> base() {
        List<Item> a = new ArrayList<>();
        a.add(new Item(100, 5, "E")); a.add(new Item(90, 4, "D"));
        a.add(new Item(80, 3, "C")); a.add(new Item(70, 2, "B")); a.add(new Item(60, 1, "A"));
        return a; // DESC by (createdAt,id)
    }
    public static void main(String[] args) {
        // 1. trang đầu
        PageResult p1 = CursorPager.page(base(), null, 2);
        check("first page items", "5,4".equals(ids(p1.items)), "ids=" + ids(p1.items));
        check("first page has next", p1.nextCursor != null && !p1.nextCursor.isEmpty(), "next=" + p1.nextCursor);

        // 2. trang hai dùng cursor trang một
        PageResult p2 = CursorPager.page(base(), p1.nextCursor, 2);
        check("second page items", "3,2".equals(ids(p2.items)), "ids=" + ids(p2.items));

        // 3. trang cuối nextCursor null
        PageResult p3 = CursorPager.page(base(), p2.nextCursor, 2);
        check("last page items", "1".equals(ids(p3.items)), "ids=" + ids(p3.items));
        check("last page next null", p3.nextCursor == null, "next=" + p3.nextCursor);

        // 4. chèn bản ghi mới ở đầu giữa trang 1 và trang 2: không trùng, không sót
        List<Item> changed = base();
        changed.add(0, new Item(110, 6, "F")); // phần tử mới nhất, chen đầu
        PageResult p2b = CursorPager.page(changed, p1.nextCursor, 2); // dùng cursor cũ (trỏ sau id=4)
        check("insert at head: no dup/gap", "3,2".equals(ids(p2b.items)), "ids=" + ids(p2b.items));

        // 5. size >= tổng số phần tử: trả hết, next null
        PageResult all = CursorPager.page(base(), null, 10);
        check("all items one page", "5,4,3,2,1".equals(ids(all.items)) && all.nextCursor == null, "ids=" + ids(all.items) + " next=" + all.nextCursor);

        // 6. tie-breaker theo id khi createdAt bằng nhau
        List<Item> tie = new ArrayList<>();
        tie.add(new Item(100, 9, "X")); tie.add(new Item(100, 8, "Y")); tie.add(new Item(100, 7, "Z"));
        PageResult t1 = CursorPager.page(tie, null, 1);
        PageResult t2 = CursorPager.page(tie, t1.nextCursor, 2);
        check("stable with tie-breaker", "9".equals(ids(t1.items)) && "8,7".equals(ids(t2.items)), "t1=" + ids(t1.items) + " t2=" + ids(t2.items));

        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
      reference: `import java.util.*;

class Item {
    final long createdAt;
    final long id;
    final String name;
    Item(long createdAt, long id, String name) { this.createdAt = createdAt; this.id = id; this.name = name; }
}

class PageResult {
    final List<Item> items;
    final String nextCursor;
    PageResult(List<Item> items, String nextCursor) { this.items = items; this.nextCursor = nextCursor; }
}

class CursorPager {
    static PageResult page(List<Item> sortedData, String cursor, int size) {
        long ct = Long.MAX_VALUE, ci = Long.MAX_VALUE;
        if (cursor != null && !cursor.isEmpty()) {
            String dec = new String(Base64.getUrlDecoder().decode(cursor));
            String[] p = dec.split("[|]");
            ct = Long.parseLong(p[0]);
            ci = Long.parseLong(p[1]);
        }
        List<Item> out = new ArrayList<>();
        for (Item it : sortedData) {
            boolean after = (it.createdAt < ct) || (it.createdAt == ct && it.id < ci);
            if (after) {
                out.add(it);
                if (out.size() == size) break;
            }
        }
        String next = null;
        if (out.size() == size) {
            Item last = out.get(out.size() - 1);
            next = Base64.getUrlEncoder().withoutPadding().encodeToString((last.createdAt + "|" + last.id).getBytes());
        }
        return new PageResult(out, next);
    }
}`,
      hints: [
        'Giải mã cursor: {{new String(Base64.getUrlDecoder().decode(cursor))}} cho chuỗi {{"createdAt|id"}}, rồi {{split("\\\\|")}} (trong Java string cần escape dấu | cho regex, và trong template literal cần thêm một lớp \\).',
        'Phần tử "đứng sau" mốc (ct, ci) theo thứ tự giảm dần (createdAt, id) khi {{createdAt < ct || (createdAt == ct && id < ci)}}. Trang đầu thì coi mốc là vô cực để lấy từ đầu.',
        'Chỉ đặt {{nextCursor}} khi trang đầy ({{items.size() == size}}); trang cuối trả {{null}}.',
      ],
      explain: `Cursor là "cái kẹp sách": ta so sánh giá trị (createdAt, id) thay vì đếm vị trí. Khi có phần tử mới chèn vào đầu danh sách, các phần tử cũ vẫn giữ nguyên giá trị (createdAt, id), nên điều kiện "sau mốc" vẫn chọn đúng tập phần tử kế tiếp: không trùng, không sót.

Hai điểm dễ sai: (1) quên tie-breaker {{id}} khi {{createdAt}} bằng nhau khiến phần tử cùng mốc bị lặp/bỏ sót; (2) luôn trả {{nextCursor}} kể cả trang cuối làm client lặp vô hạn. Kiểm tra {{out.size() == size}} là cách đơn giản (chấp nhận một lần gọi thừa ở biên); cách chặt hơn là lấy thêm 1 phần tử để biết còn hay không.

Ở API thật, thay vì duyệt list trong bộ nhớ, ta đưa điều kiện "sau mốc" vào câu SQL với index {{(createdAt DESC, id DESC)}} để DB nhảy thẳng tới mốc.`,
    },
  ],
  check: [
    {
      q: 'Vì sao {{SELECT ... LIMIT 20 OFFSET 100000}} thường chậm hơn nhiều so với truy vấn dùng cursor ở trang tương đương?',
      options: [
        'Vì LIMIT không hoạt động khi có OFFSET',
        'Vì DB vẫn phải duyệt/bỏ qua 100000 dòng trước khi lấy 20 dòng, trong khi cursor dùng mốc + index để đi thẳng tới vị trí',
        'Vì cursor không cần ORDER BY',
        'Vì OFFSET bắt buộc trả về toàn bộ bảng',
      ],
      answer: 1,
      explain: `Offset không "nhảy cóc": DB phải thực hiện công việc tạo ra 100000 dòng đầu rồi loại bỏ. Cursor/keyset đặt điều kiện {{WHERE (createdAt, id) < (t, i)}} khớp index, nên chỉ đọc vùng cần thiết. Trang càng sâu, offset càng chậm tuyến tính; cursor gần như đều.`,
    },
    {
      q: 'Người dùng đang xem trang 1 (offset) của feed. Trước khi họ tải trang 2, một bài viết mới được đăng lên đầu feed. Hệ quả thường gặp là gì?',
      options: [
        'Trang 2 trả đúng như cũ, không ảnh hưởng',
        'Trang 2 có thể lặp lại một mục đã thấy ở trang 1 và/hoặc bỏ sót một mục (do các phần tử bị đẩy dịch)',
        'Server tự động chuyển sang cursor',
        'Trang 1 bị xoá khỏi DB',
      ],
      answer: 1,
      explain: `Offset đếm theo vị trí: chèn 1 phần tử lên đầu làm mọi phần tử cũ dịch xuống 1 bậc. Trang 2 (bỏ qua N) giờ bỏ qua cả phần tử mới, nên phần tử cuối trang 1 cũ rơi vào trang 2 (trùng) và chuỗi bị lệch. Cursor bám theo giá trị mốc nên không bị hiệu ứng này.`,
    },
    {
      q: 'Khi thiết kế cursor cho danh sách sắp xếp theo {{createdAt DESC}}, vì sao nên thêm {{id}} làm tiêu chí phụ (ORDER BY createdAt DESC, id DESC)?',
      options: [
        'Để truy vấn trông phức tạp hơn',
        'Để sort ổn định khi nhiều bản ghi cùng createdAt, tránh bỏ sót/lặp phần tử có cùng mốc thời gian',
        'Vì Base64 chỉ mã hoá được số nguyên',
        'Vì index không hoạt động trên cột thời gian',
      ],
      answer: 1,
      explain: `Nếu chỉ sort theo {{createdAt}} và nhiều bản ghi cùng giá trị, thứ tự tương đối giữa chúng không xác định giữa các truy vấn; cursor đặt tại một mốc thời gian đó có thể bỏ sót hoặc lặp các bản ghi "đồng hạng". Thêm {{id}} (duy nhất) làm tie-breaker tạo thứ tự toàn phần, ổn định, và cursor {{(createdAt, id)}} định vị chính xác.`,
    },
    {
      q: 'Khi nào offset/limit vẫn là lựa chọn chấp nhận được so với cursor?',
      options: [
        'Khi làm feed mạng xã hội vô hạn cho hàng triệu người dùng',
        'Khi cần "nhảy tới trang 50" trong màn hình quản trị, tập dữ liệu nhỏ/ít biến động và trang sâu hiếm',
        'Khi dữ liệu thay đổi liên tục từng giây',
        'Offset luôn tốt hơn cursor trong mọi trường hợp',
      ],
      answer: 1,
      explain: `Offset cho phép nhảy trang tuỳ ý và triển khai đơn giản, phù hợp màn hình admin nội bộ với dữ liệu tương đối ổn định, ít bản ghi, không cuộn sâu vô hạn. Với feed realtime, API public volume lớn, hoặc dữ liệu biến động, cursor tránh được cả vấn đề hiệu năng trang sâu lẫn trùng/sót khi chèn/xoá.`,
    },
  ],
  related: ['api-001', 'api-014', 'api-015'],
  tags: ['pagination', 'cursor', 'keyset', 'offset', 'REST', 'performance'],
},
{
  id: 'lesson-api-006',
  track: 'api',
  order: 6,
  title: '429 Too Many Requests: Retry-After, RateLimit-* và client tôn trọng giới hạn',
  level: 'senior',
  minutes: 40,
  goals: [
    'Giải thích được 429 khác 403 và khác 503 ở đâu, và vì sao client cần {{Retry-After}} thay vì tự đoán',
    'Đọc và viết đúng các header {{Retry-After}}, {{RateLimit-Limit}}, {{RateLimit-Remaining}}, {{RateLimit-Reset}}',
    'Viết client retry đúng: backoff tăng dần + jitter xác định, tôn trọng Retry-After, không retry POST thiếu {{Idempotency-Key}}',
    'Chọn được thuật toán rate limit (fixed window, sliding window, token bucket) và nơi đặt bộ đếm khi chạy nhiều instance',
  ],
  body: `### Cái gì: 429 là lời từ chối "có hẹn giờ quay lại"
**Tóm tắt:** {{429 Too Many Requests}} nghĩa là request hoàn toàn hợp lệ (đúng token, đúng cú pháp) nhưng client đang gọi **quá nhanh** nên server tạm từ chối. Nó khác {{401}}/{{403}} (vấn đề danh tính/quyền, retry vô ích) và khác {{503}} (server quá tải hoặc đang bảo trì, không phải do client). Điểm làm 429 hữu ích: header {{Retry-After}} — server nói luôn **bao lâu nữa thì quay lại**, client không phải đoán.

Thuật ngữ xuất hiện lần đầu, đọc chậm vì mọi ví dụ dưới đây dùng lại:
- **Rate limit (giới hạn tốc độ)**: trần số request một client được gửi trong một đơn vị thời gian, ví dụ 100 request/phút cho mỗi API key. Giống đèn tín hiệu cho phép tối đa 600 xe mỗi giờ qua một ngã tư.
- **Quota (hạn mức theo kỳ)**: tổng lượng được dùng trong kỳ dài hơn, ví dụ 1 triệu request/tháng. Rate limit bảo vệ CPU và pool kết nối; quota bảo vệ năng lực vận hành và hoá đơn.
- **Throttle (bóp lưu lượng)**: làm client chậm lại thay vì chặn hẳn, ví dụ xếp hàng đợi hoặc cắt băng thông.
- **Backoff (lùi)**: nghỉ mỗi lúc một lâu hơn giữa các lần thử lại: 100ms, 200ms, 400ms…
- **Jitter (nhiễu ngẫu nhiên)**: cộng thêm một phần ngẫu nhiên vào thời gian nghỉ. Hình dung 5.000 client cùng nhận 429 lúc 10:00:00 và cùng hẹn retry đúng 10 giây sau — nếu không có jitter, cả 5.000 request ập tới trong cùng một giây và làm hệ thống vừa hồi phục gục lần nữa. Jitter dàn trải chúng ra nhiều giây khác nhau.
- **Retry storm (bão thử lại)**: chính hiện tượng vừa mô tả.
- **Retry budget (ngân sách retry)**: trần tỷ lệ request được phép là retry, ví dụ "không quá 20% request trong 10 giây gần nhất". Vượt ngân sách thì coi như lỗi thật, dừng retry và **báo động** thay vì tiếp tục tự đào hố.
- **Idempotent**: gọi một hay nhiều lần với cùng dữ liệu thì trạng thái cuối như nhau (GET, PUT, DELETE). POST thì không, nên retry POST mù có thể trừ tiền hai lần.

### Vì sao cần chặn, và chặn ở đâu
Mỗi request đều chiếm tài nguyên hữu hạn: một thread (Java 21 có thể dùng **virtual thread** — luồng siêu nhẹ do JVM tự quản, tạo hàng triệu cái không tốn RAM như thread hệ điều hành), một slot trong **connection pool** (nhóm kết nối DB được mở sẵn để dùng lại, vì mở kết nối DB mới tốn vài chục ms), vài KB RAM. Không có giới hạn, một client buggy (vòng lặp gọi API không dừng) hoặc một cú sốc traffic (flash sale) sẽ chiếm hết mọi thứ và **tất cả** khách hàng cùng chết — đây là hiệu ứng "một con hư làm hỏng cả đàn".

Chặn phải đặt **trước** tầng nghiệp vụ: tầng gateway/API edge, hoặc một filter/interceptor sớm trong ứng dụng. Nếu request đã vào tới service rồi mới bị từ chối thì DB và pool kết nối đã hứng trọn cú đánh, tức là ta chặn để… bảo vệ cảm giác của lập trình viên chứ không phải bảo vệ hệ thống.

### Các thuật toán đếm request
| Thuật toán | Cách hoạt động | Ưu | Nhược |
|---|---|---|---|
| **Fixed window** (cửa sổ cố định) | Đếm trong ô "phút hiện tại", vượt trần thì chặn, quay số 0 vào đầu phút sau | 1 bộ đếm, cực rẻ | Cho phép lách kiểu burst kép: 100 request lúc 10:00:59 + 100 request lúc 10:01:01 = 200 request trong 2 giây nhưng không lần nào vượt "100/phút" |
| **Sliding window log** (nhật ký cửa sổ trượt) | Lưu timestamp **từng** request, đếm số phần tử trong 60 giây gần nhất | Chính xác tuyệt đối | Tốn nhớ theo số request |
| **Sliding window counter** | Đếm theo cửa sổ hiện tại + tỉ lệ phần đã trôi qua của cửa sổ trước | Rẻ, xấp xỉ đúng | Chỉ là ước lượng |
| **Token bucket** (lọ token) | Lọ sức chứa B, được nạp r token/giây. Mỗi request lấy 1 token; lọ cạn thì 429. Hết tốc lực rồi vẫn "burst" được B request liên tiếp | Cho phép burst tự nhiên, chỉ cần 2 số (tokens, lastRefill) để mô tả **một client**, nên mới chạy được ở **API edge** (tầng cửa ngõ, nơi request đầu tiên chạm hệ thống bạn — thường là gateway) | Tính đúng hơn fixed window một chút; cần xử lý đồng bộ khi nhiều thread cùng lấy token |

Token bucket là lựa chọn phổ biến nhất cho API công khai vì nó mô tả đúng ý "trung bình 100/phút, vẫn được burst ngắn trong giới hạn".

~~~java
// Mot lo token thu thuan JDK: suc chua 100 token, nap day 100 token moi 60 giay.
class TokenBucket {
    private static final double CAPACITY = 100;
    private static final long REFILL_NANOS = 60_000_000_000L;   // 60 giay
    private double tokens = CAPACITY;
    private long last = System.nanoTime();

    synchronized boolean tryConsume() {
        long now = System.nanoTime();
        tokens = Math.min(CAPACITY, tokens + (now - last) / (double) REFILL_NANOS * CAPACITY);
        last = now;
        if (tokens < 1) return false;
        tokens -= 1;
        return true;
    }

    // Con bao nhieu giay thi co lai du 1 token? Day chinh la gia tri cho Retry-After.
    synchronized long retryAfterSeconds() {
        double missing = Math.max(0, 1 - tokens);
        return (long) Math.ceil(missing / CAPACITY * 60);
    }
}
~~~

### Header phía server: hai nhóm, đừng nhầm
**Nhóm 1 — {{Retry-After}}** (đi kèm 429 và 503; RFC 9110 định nghĩa nó cho 503 và 3xx, các hãng API dùng cả cho 429). Chỉ có **hai** định dạng:
- Số giây: {{Retry-After: 12}} — "đợi 12 giây". Dễ nhất cho client.
- HTTP-date: {{Retry-After: Wed, 21 Oct 2026 07:28:00 GMT}} — "đợi tới thời điểm này". **Phụ thuộc đồng hồ hai bên**: lệch giờ là lệch thời gian chờ, nên ưu tiên dạng số giây.

**Nhóm 2 — {{RateLimit-*}}** cho client biết **còn bao nhiêu** để tự điều tiết trước khi bị chặn:
- {{RateLimit-Limit}}: hạn mức của cửa sổ (100).
- {{RateLimit-Remaining}}: còn lại bao nhiêu request trong cửa sổ.
- {{RateLimit-Reset}}: **số giây nữa** cửa sổ hồi tokens (bản draft IETF cũ định nghĩa là epoch timestamp; bản draft mới dùng số giây — vì vậy khi đọc API của đối tác, phải tra tài liệu của họ chứ đừng đoán).

Bản draft IETF hiện hành gộp thành một header kiểu structured field, ví dụ {{RateLimit: "account";r=49;t=12}}, cho phép nhiều hạn mức cùng lúc (theo tài khoản, theo IP). Trên thực tế phần lớn API vẫn trả ba header rời, và SDK nào cũng đọc được cả hai nếu bạn viết client tử tế.

Nguyên tắc vàng: **{{RateLimit-Remaining}} là thông tin, {{Retry-After}} là lệnh.** Server vẫn có quyền trả 429 sớm hơn (đang scale-down), nên client chỉ được tin tuyệt đối vào Retry-After.

### Luồng đầy đủ khi có nhiều tầng
~~~seq
title: Client tôn trọng 429 + Retry-After
actors: App | Gateway | Redis | Service
App -> Gateway: GET /orders (ke kem API key)
Gateway -> Redis: tryConsume key=ratelimit:acct42
Redis --> Gateway: OK, con 48 token
Gateway -> Service: forward request
Service --> Gateway: 200 OK, danh sach lenh
Gateway --> App: 200 + RateLimit-Remaining: 47
App -> Gateway: request thu 101 trong cung phut
Gateway -> Redis: tryConsume
Redis --> Gateway: EMPTY, lọ da can
note Gateway: khong forward; sinh 429 tai edge
Gateway --> App: 429 + Retry-After: 12
note App: cho 12s + jitter, chi retry vi GET
App -> Gateway: GET /orders sau 12 giay
Gateway --> App: 200 OK
~~~

Vì sao bộ đếm phải ở **Redis** (Redis = kho lưu giá trị trong RAM, truy cập bằng tên khoá, dùng chung cho mọi instance) mà không ở biến trong JVM? Vì ứng dụng chạy 6 instance sau load balancer: mỗi instance giữ bộ đếm riêng thì hạn mức thực tế thành 600/phút dù bạn công bố 100/phút. Đây là lỗi kinh điển khi scale-out. Đổi lại, mỗi request thêm một round-trip Redis (vài ms), nên người ta thường đếm **cục bộ + tổng** (mỗi instance giữ hạn mức nháp, định kỳ báo về Redis để trừ dần) hoặc dùng Redis với lệnh nguyên tử {{EVAL}} một lượt.

### Client đúng cách: viết một lần, mọi SDK dùng chung
~~~java
Response send(Request req) {
    int attempt = 0;
    while (true) {
        attempt++;
        Response r = http.execute(req);
        boolean retryable = (r.status() == 429 || r.status() == 503);
        boolean safe = !req.method().equals("POST") || req.header("Idempotency-Key") != null;
        if (!retryable || !safe || attempt >= MAX_ATTEMPTS) return r;
        sleep(backoff(r, attempt));        // chi cho phep ngat giua chung khi caller het tong thoi gian cho
    }
}

long backoff(Response r, int attempt) {
    String ra = r.header("Retry-After");
    if (ra != null) return retryAfterMillis(ra);          // 1) server noi gì thì nghe cái đó
    long d = Math.min(MAX_DELAY, BASE_DELAY << (attempt - 1));  // 2) exponential: 100, 200, 400...
    return d / 2 + random.nextLong(d / 2 + 1);            // 3) "equal jitter": [d/2, d]
}
~~~
Bốn quyết định thiết kế cần nói được khi phỏng vấn:
1. **Nghe {{Retry-After}} trước**, chỉ tự tính khi server không nói. Server biết lọ token của bạn bao giờ hồi phục, client thì không.
2. **Backoff luỹ thừa** (mỗi lần thử nhân đôi) để dàn tải, **chặn trần** (cap) ở ví dụ 10–30 giây để không chờ tới hết deadline người dùng.
3. **Jitter** để hàng nghìn client không retry cùng một instant. Hai biến thể hay nhắc: *full jitter* ({{random(0, d)}}) và *equal jitter* ({{d/2 + random(0, d/2)}} — vẫn đảm bảo nghỉ đủ lâu, ít dồn hơn).
4. **Không retry request không idempotent.** POST không có {{Idempotency-Key}} thì 429 là "hãy gọi lại sau khi tạo key mới", không phải "gửi lại y như cũ". Nếu bắt buộc retry POST, phải gửi lại **cùng một** key (bài 3 và 4 của track này).

Ngoài ra cần một **tổng deadline**: 5 lần retry với backoff có thể tiêu tốn hơn 30 giây, trong khi người dùng đã rời màn hình từ giây thứ 3. SDK tốt luôn nhận {{timeout}} từ caller và huỷ giữa chừng khi hết thời gian.

### Lỗi hay gặp
- **Trả 429 mà không có {{Retry-After}}**: client buộc phải đoán, đa số đoán "ngay lập tức" → tự sinh ra retry storm.
- **Đếm theo IP** với khách hàng đi qua proxy công ty: 200 nhân viên dùng chung một IP, cả công ty bị chặn vì một người. Phải đếm theo API key/user, IP chỉ là lớp phụ.
- **Mỗi instance một hạn mức** như đã nói ở trên.
- **Retry sập nguồn lỗi**: retry chỉ dành cho lỗi **tạm thời** (429, 503, timeout mạng). Retry khi nhận {{400}}/{{401}}/{{403}}/{{422}} chỉ làm chậm người dùng và che mất bug thật.
- **Quên ngân sách retry và cảnh báo**: nếu 429 kéo dài thì đó là sự cố, không phải thứ để SDK âm thầm xử lý. Đếm số lần retry và đẩy lên metrics.
- **Để retry phá deadline của caller** hoặc retry mãi không dừng (thiếu {{maxAttempts}}) — vòng lặp vô hạn khi server lỗi dai dẳng.
- **Bỏ sót cảnh báo ở client**: 429 nên được log với nhãn riêng; nếu gộp chung vào "lỗi mạng" thì sáng hôm sau không ai biết mình đã bị đối tác chặn.

### Liên hệ phỏng vấn
Câu điển hình: "API công khai của bạn chạy 8 instance sau load balancer, đối tác phàn nàn bị 429 oan. Điều tra và sửa thế nào?" Cấu trúc trả lời ăn điểm:
1. **Xác định chỗ đếm**: 8 instance mỗi cái một bộ đếm trong JVM → hạn mức thực tế gấp 8 và không ổn định theo định tuyến; chuyển bộ đếm ra Redis (lệnh nguyên tử) hoặc xuống API gateway.
2. **Kiểm tra đơn vị tính**: đếm theo IP hay theo API key? Sau NAT công ty thì IP là đơn vị sai.
3. **Chất lượng response**: 429 có {{Retry-After}} và {{RateLimit-Remaining}} chưa; có {{Request-Id}} để đối chiếu log hai bên không.
4. **Phía client**: SDK có backoff + jitter, có maxAttempts, có tôn trọng tính idempotent không.
5. **Chính sách**: hạn mức theo khách hàng (tier), theo endpoint ({{POST /payments}} đắt hơn {{GET /health}}), và cần cả **công cụ tự phục vụ** để khách thấy mức dùng của họ.

Điểm cộng: nói được rằng rate limit là một phần của **graceful degradation** (hệ thống chủ động hy sinh một phần dịch vụ để phần còn lại sống) — chặn đúng đối tượng để 99% khách hàng tốt vẫn chạy, thay vì để hệ thống chết chung.

> **Senior tip:** Ba chi tiết phân biệt người từng vận hành API công khai. (1) Luôn trả {{Retry-After}} cho 429 **và** 503, kể cả khi bạn chỉ ước lượng "1 giây" — con số sai vẫn tốt hơn không có gì. (2) Trả 429 **càng sớm càng tốt**: ở edge, trước khi giải JWT và trước khi chạm DB; nếu filter rate limit chạy sau filter auth thì kẻ tấn công vẫn làm bạn tốn tài nguyên xác thực. (3) Cân nhắc 429 **trước cả request**: nếu {{RateLimit-Remaining}} = 0 thì chủ động chờ 150ms thay vì gọi và nhận 429 — bạn giảm được một vòng round-trip cho cả hai bên, và đối tác không bị tính là "khách hàng có lỗi".`,
  exercises: [
    {
      title: 'RetryClient: đọc Retry-After, backoff + jitter xác định, không retry POST thiếu Idempotency-Key',
      prompt: `Viết {{class RetryClient}} gọi một server giả theo đúng hợp đồng dưới đây. Mọi thứ đều **xác định** (deterministic): có đồng hồ giả, không được dùng {{Thread.sleep}}, không dùng thời gian thực.

Các loại có sẵn (đừng đổi chữ ký):
- {{FakeServer}} — interface có đúng một method, {{Response handle(Request req)}}, server giả trả về một {{Response}} cho mỗi lần được gọi.
- {{record Request(String method, String path, Map<String, String> headers)}} — {{header(name)}} tra cứu **không phân biệt hoa thường**.
- {{record Response(int status, Map<String, String> headers)}} — khoá header trong map này đã là chữ thường; {{header(name)}} lấy theo tên.
- {{class FakeClock}} — {{long now()}}, {{void advance(long deltaMillis)}}.
- {{class RetryPolicy}} — {{int maxAttempts}} (tổng số lần gọi server, tính cả lần đầu, >= 1), {{long baseDelayMs}}, {{long maxDelayMs}} (trần của bước lùi), {{long seed}}.

Chữ ký phải cài: {{Response send(Request req)}}.

Luật xử lý, áp dụng theo thứ tự:
1. Gọi {{server.handle(req)}}. Đếm số lần đã gọi là {{attempt}} (lần đầu là 1).
2. Trả ngay {{resp}} (không chờ) nếu **ít nhất một** điều kiện sau đúng:
   - {{resp.status()}} không phải 429 và không phải 503.
   - {{attempt >= policy.maxAttempts}} (hết ngân sách thử — trả về chính response cuối cùng nhận được).
   - {{req.method()}} là {{POST}} và request **không** có header {{Idempotency-Key}}. Lý do: retry một request không idempotent có thể tạo bản ghi trùng, an toàn còn hơn lịch sự.
3. Ngược lại, tính thời gian chờ {{wait}} rồi gọi {{clock.advance(wait)}} và quay lại bước 1:
   - Nếu {{resp}} có header {{retry-after}} không rỗng thì **dùng nó**, bỏ qua backoff và jitter. {{retry-after}} là số nguyên giây (ví dụ {{"7"}} nghĩa là 7000 ms) **hoặc** một HTTP-date theo RFC 1123 (ví dụ {{"Tue, 14 Nov 2023 22:13:50 GMT"}}); với HTTP-date, {{wait}} = thời điểm đó trừ {{clock.now()}}, tối thiểu 0. Giá trị giây âm được coi là 0.
   - Nếu không có {{retry-after}}: {{d = min(maxDelayMs, baseDelayMs * 2^(attempt-1))}}, sau đó áp jitter nửa-và-nửa: {{wait = d/2 + jitter}} với {{jitter}} nằm trong {{[0, d/2]}}.
   - {{jitter}} phải **xác định**: mỗi lần gọi {{send}}, tạo đúng một {{SplittableRandom}} với seed {{policy.seed ^ (req.method() + " " + req.path()).hashCode()}}, rồi mỗi lần retry lấy {{rnd.nextLong(d / 2 + 1)}}. Cùng một request, cùng seed thì phải ra cùng một dãy thời gian chờ.
4. Response cuối cùng nhận được là kết quả trả về (kể cả khi vẫn là 429).`,
      starter: `import java.time.*;
import java.time.format.DateTimeFormatter;

interface FakeServer {
    Response handle(Request req);
}

record Request(String method, String path, Map<String, String> headers) {
    Request {
        Map<String, String> norm = new LinkedHashMap<>();
        for (Map.Entry<String, String> e : headers.entrySet()) norm.put(e.getKey().toLowerCase(Locale.ROOT), e.getValue());
        headers = norm;
    }
    Request(String method, String path) { this(method, path, Map.of()); }
    String header(String name) { return headers.get(name.toLowerCase(Locale.ROOT)); }
}

record Response(int status, Map<String, String> headers) {
    Response(int status) { this(status, Map.of()); }
    String header(String name) { return headers.get(name); }
}

class FakeClock {
    private long ms;
    FakeClock(long startMillis) { this.ms = startMillis; }
    long now() { return ms; }
    void advance(long deltaMillis) { this.ms += deltaMillis; }
}

class RetryPolicy {
    final int maxAttempts;
    final long baseDelayMs;
    final long maxDelayMs;
    final long seed;
    RetryPolicy(int maxAttempts, long baseDelayMs, long maxDelayMs, long seed) {
        this.maxAttempts = maxAttempts;
        this.baseDelayMs = baseDelayMs;
        this.maxDelayMs = maxDelayMs;
        this.seed = seed;
    }
}

class RetryClient {
    private final FakeServer server;
    private final FakeClock clock;
    private final RetryPolicy policy;

    RetryClient(FakeServer server, FakeClock clock, RetryPolicy policy) {
        this.server = server;
        this.clock = clock;
        this.policy = policy;
    }

    Response send(Request req) {
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
    static void inRange(long lo, long hi, long v) {
        if (v < lo || v > hi) throw new AssertionError("expected in [" + lo + "," + hi + "] got " + v);
    }
    static Map<String, String> h(String... kv) {
        Map<String, String> m = new LinkedHashMap<>();
        for (int i = 0; i < kv.length; i += 2) m.put(kv[i], kv[i + 1]);
        return m;
    }
    static class Recorder {
        final List<Long> at = new ArrayList<>();
        final List<Request> seen = new ArrayList<>();
        int calls() { return at.size(); }
        List<Long> gaps() {
            List<Long> d = new ArrayList<>();
            for (int i = 1; i < at.size(); i++) d.add(at.get(i) - at.get(i - 1));
            return d;
        }
    }
    static FakeServer script(FakeClock clock, Recorder rec, Response... responses) {
        return req -> {
            rec.at.add(clock.now());
            rec.seen.add(req);
            int i = rec.calls() - 1;
            return i < responses.length ? responses[i] : responses[responses.length - 1];
        };
    }
    public static void main(String[] args) {
        check("429 roi 200: chi retry dung 1 lan, cho trong khoang backoff", () -> {
            FakeClock clock = new FakeClock(1_000_000L);
            Recorder rec = new Recorder();
            RetryPolicy p = new RetryPolicy(5, 100, 2000, 7L);
            RetryClient c = new RetryClient(script(clock, rec, new Response(429), new Response(200)), clock, p);
            Response r = c.send(new Request("GET", "/orders"));
            eq(200, Integer.valueOf(r.status()));
            eq(2, Integer.valueOf(rec.calls()));
            List<Long> g = rec.gaps();
            eq(1, Integer.valueOf(g.size()));
            inRange(50, 100, g.get(0));
        });
        check("retry-after giay duoc ton that tuyet doi, bang qua jitter", () -> {
            FakeClock clock = new FakeClock(1_000_000L);
            Recorder rec = new Recorder();
            RetryClient c = new RetryClient(
                script(clock, rec, new Response(429, h("retry-after", "7")), new Response(200)), clock, new RetryPolicy(5, 100, 2000, 7L));
            eq(200, Integer.valueOf(c.send(new Request("GET", "/orders")).status()));
            List<Long> g = rec.gaps();
            eq(1, Integer.valueOf(g.size()));
            eq(7000L, g.get(0).longValue());
        });
        check("retry-after kieu HTTP-date tinh theo dong ho gia", () -> {
            FakeClock clock = new FakeClock(1_700_000_000_000L);
            String when = DateTimeFormatter.RFC_1123_DATE_TIME
                .format(ZonedDateTime.ofInstant(Instant.ofEpochMilli(clock.now() + 30_000L), ZoneOffset.UTC));
            Recorder rec = new Recorder();
            RetryClient c = new RetryClient(
                script(clock, rec, new Response(429, h("retry-after", when)), new Response(200)), clock, new RetryPolicy(5, 100, 2000, 3L));
            eq(200, Integer.valueOf(c.send(new Request("GET", "/orders")).status()));
            eq(30000L, rec.gaps().get(0).longValue());
        });
        check("retry-after am duoc coi la 0", () -> {
            FakeClock clock = new FakeClock(500L);
            Recorder rec = new Recorder();
            RetryClient c = new RetryClient(
                script(clock, rec, new Response(429, h("retry-after", "-5")), new Response(200)), clock, new RetryPolicy(5, 100, 2000, 1L));
            eq(200, Integer.valueOf(c.send(new Request("GET", "/orders")).status()));
            eq(500L, clock.now());
            eq(2, Integer.valueOf(rec.calls()));
        });
        check("POST thieu Idempotency-Key: khong bao gio retry du co retry-after", () -> {
            FakeClock clock = new FakeClock(1_000_000L);
            Recorder rec = new Recorder();
            RetryClient c = new RetryClient(
                script(clock, rec, new Response(429, h("retry-after", "1")), new Response(200)), clock, new RetryPolicy(5, 100, 2000, 2L));
            Response r = c.send(new Request("POST", "/payments"));
            eq(429, Integer.valueOf(r.status()));
            eq(1, Integer.valueOf(rec.calls()));
            eq(1_000_000L, clock.now());
        });
        check("POST co Idempotency-Key: duoc retry, gi nguyen header qua moi lan", () -> {
            FakeClock clock = new FakeClock(0L);
            Recorder rec = new Recorder();
            RetryClient c = new RetryClient(
                script(clock, rec, new Response(503), new Response(503), new Response(201)), clock, new RetryPolicy(3, 20, 500, 5L));
            Response r = c.send(new Request("POST", "/payments", h("idempotency-key", "k-1")));
            eq(201, Integer.valueOf(r.status()));
            eq(3, Integer.valueOf(rec.calls()));
            List<Long> g = rec.gaps();
            eq(2, Integer.valueOf(g.size()));
            inRange(10, 20, g.get(0));
            inRange(20, 40, g.get(1));
            for (Request seen : rec.seen) eq("k-1", seen.header("Idempotency-Key"));
        });
        check("ket ngan o maxAttempts va tra nguyen response cuoi", () -> {
            FakeClock clock = new FakeClock(0L);
            Recorder rec = new Recorder();
            RetryClient c = new RetryClient(
                script(clock, rec, new Response(429, h("retry-after", "3"))), clock, new RetryPolicy(3, 100, 5000, 9L));
            Response r = c.send(new Request("GET", "/orders"));
            eq(429, Integer.valueOf(r.status()));
            eq(3, Integer.valueOf(rec.calls()));
            eq(List.of(3000L, 3000L), rec.gaps());
        });
        check("maxAttempts = 1 nghia la khong retry lan nao", () -> {
            FakeClock clock = new FakeClock(0L);
            Recorder rec = new Recorder();
            RetryClient c = new RetryClient(script(clock, rec, new Response(503)), clock, new RetryPolicy(1, 100, 500, 4L));
            eq(503, Integer.valueOf(c.send(new Request("DELETE", "/orders/9")).status()));
            eq(1, Integer.valueOf(rec.calls()));
            eq(0L, clock.now());
        });
        check("mau khong retry duoc (500, 403) tra ve ngay lap tuc", () -> {
            FakeClock clock = new FakeClock(77L);
            Recorder rec = new Recorder();
            RetryClient c = new RetryClient(script(clock, rec, new Response(500), new Response(200)), clock, new RetryPolicy(4, 100, 900, 8L));
            eq(500, Integer.valueOf(c.send(new Request("GET", "/orders")).status()));
            eq(1, Integer.valueOf(rec.calls()));
            eq(77L, clock.now());
        });
        check("backoff tang day nhung bi chan o maxDelayMs", () -> {
            FakeClock clock = new FakeClock(0L);
            Recorder rec = new Recorder();
            RetryClient c = new RetryClient(script(clock, rec,
                new Response(429), new Response(429), new Response(429), new Response(429), new Response(429), new Response(200)),
                clock, new RetryPolicy(6, 100, 400, 3L));
            eq(200, Integer.valueOf(c.send(new Request("GET", "/orders")).status()));
            List<Long> g = rec.gaps();
            eq(5, Integer.valueOf(g.size()));
            inRange(50, 100, g.get(0));
            inRange(100, 200, g.get(1));
            inRange(200, 400, g.get(2));
            inRange(200, 400, g.get(3));
            inRange(200, 400, g.get(4));
        });
        check("cung seed thi cho cung day thoi gian cho (jitter xac dinh)", () -> {
            long start = 10_000L;
            List<Long> first, second;
            {
                FakeClock clock = new FakeClock(start);
                Recorder rec = new Recorder();
                RetryClient c = new RetryClient(script(clock, rec, new Response(429), new Response(429), new Response(429), new Response(200)),
                    clock, new RetryPolicy(5, 100, 5000, 11L));
                c.send(new Request("GET", "/accounts/7"));
                first = rec.gaps();
            }
            {
                FakeClock clock = new FakeClock(start);
                Recorder rec = new Recorder();
                RetryClient c = new RetryClient(script(clock, rec, new Response(429), new Response(429), new Response(429), new Response(200)),
                    clock, new RetryPolicy(5, 100, 5000, 11L));
                c.send(new Request("GET", "/accounts/7"));
                second = rec.gaps();
            }
            eq(3, Integer.valueOf(first.size()));
            eq(first, second);
        });
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
      reference: `import java.time.*;
import java.time.format.DateTimeFormatter;

interface FakeServer {
    Response handle(Request req);
}

record Request(String method, String path, Map<String, String> headers) {
    Request {
        Map<String, String> norm = new LinkedHashMap<>();
        for (Map.Entry<String, String> e : headers.entrySet()) norm.put(e.getKey().toLowerCase(Locale.ROOT), e.getValue());
        headers = norm;
    }
    Request(String method, String path) { this(method, path, Map.of()); }
    String header(String name) { return headers.get(name.toLowerCase(Locale.ROOT)); }
}

record Response(int status, Map<String, String> headers) {
    Response(int status) { this(status, Map.of()); }
    String header(String name) { return headers.get(name); }
}

class FakeClock {
    private long ms;
    FakeClock(long startMillis) { this.ms = startMillis; }
    long now() { return ms; }
    void advance(long deltaMillis) { this.ms += deltaMillis; }
}

class RetryPolicy {
    final int maxAttempts;
    final long baseDelayMs;
    final long maxDelayMs;
    final long seed;
    RetryPolicy(int maxAttempts, long baseDelayMs, long maxDelayMs, long seed) {
        this.maxAttempts = maxAttempts;
        this.baseDelayMs = baseDelayMs;
        this.maxDelayMs = maxDelayMs;
        this.seed = seed;
    }
}

class RetryClient {
    private final FakeServer server;
    private final FakeClock clock;
    private final RetryPolicy policy;

    RetryClient(FakeServer server, FakeClock clock, RetryPolicy policy) {
        this.server = server;
        this.clock = clock;
        this.policy = policy;
    }

    Response send(Request req) {
        SplittableRandom rnd = new SplittableRandom(policy.seed ^ (req.method() + " " + req.path()).hashCode());
        int attempt = 0;
        while (true) {
            attempt++;
            Response resp = server.handle(req);
            boolean retryable = resp.status() == 429 || resp.status() == 503;
            boolean safeToRepeat = !"POST".equals(req.method()) || req.header("Idempotency-Key") != null;
            if (!retryable || !safeToRepeat || attempt >= policy.maxAttempts) return resp;
            clock.advance(waitMillis(resp, attempt, rnd));
        }
    }

    private long waitMillis(Response resp, int attempt, SplittableRandom rnd) {
        Long serverSaid = retryAfterMillis(resp.header("retry-after"), clock.now());
        if (serverSaid != null) return serverSaid;        // server da biet, khong can doan
        long d = policy.baseDelayMs;
        for (int i = 1; i < attempt; i++) d = Math.min(policy.maxDelayMs, d * 2);
        return d / 2 + rnd.nextLong(d / 2 + 1);           // "equal jitter": nua co dinh, nua ngau nhien
    }

    // tra ve null neu header vang hoac khong parse duoc (coi nhu server khong noi gi)
    static Long retryAfterMillis(String value, long nowMillis) {
        if (value == null || value.isBlank()) return null;
        String v = value.trim();
        try {
            return Math.max(0L, Long.parseLong(v) * 1000L);       // dang so giay
        } catch (NumberFormatException notSeconds) {
            // lang xuong thu dang HTTP-date
        }
        try {
            long at = Instant.from(DateTimeFormatter.RFC_1123_DATE_TIME.parse(v)).toEpochMilli();
            return Math.max(0L, at - nowMillis);                  // dang moc thoi gian tuyet doi
        } catch (RuntimeException badDate) {
            return null;
        }
    }
}`,
      hints: [
        'Vòng lặp {{while(true)}} với bộ đếm {{attempt}} tăng ở **đầu** mỗi vòng: gọi server trước, rồi mới quyết định có chờ và quay vòng nữa không.',
        'Chưa {{retry-after}} bằng {{Long.parseLong}}; ném {{NumberFormatException}} thì mới thử {{DateTimeFormatter.RFC_1123_DATE_TIME}} và trừ {{clock.now()}}.',
        'Đừng nhân đôi tràn bộ nhớ: thay vì shift {{baseDelayMs << (attempt-1)}}, lặp {{attempt-1}} lần {{d = Math.min(maxDelayMs, d * 2)}}, hoặc tạo {{SplittableRandom}} một lần duy nhất đầu hàm send.',
      ],
      explain: `Ba điều bài tập này dạy, cũng là ba lỗi phổ biến trong SDK thật.

**Một — thứ tự kiểm tra quyết định tính an toàn.** Điều kiện "POST không có {{Idempotency-Key}}" phải chặn retry **trước khi** chờ. Nếu để sau, client vẫn lịch sự chờ 12 giây rồi mới gửi lại một lệnh chuyển tiền có thể đã thành công ở phía server (request timeout ≠ request thất bại — server có thể đã trừ tiền rồi mới chết ở đường về). Đây chính là lý do {{Idempotency-Key}} tồn tại: nó biến một POST không idempotent thành một POST **có thể phát lại**, và đó cũng là lý do client không được tự sinh key mới cho mỗi lần retry — phải giữ nguyên key, như test {{gi nguyen header qua moi lan}} kiểm tra.

**Hai — {{Retry-After}} là lệnh, backoff là phương án dự phòng.** Server giữ lọ token nên biết chính xác khi nào bạn hồi phục; client chỉ đoán. Vì vậy khi có header thì dùng thẳng, không cộng thêm jitter (test {{retry-after giay}} đòi đúng 7000 ms). Khi phải tự tính, công thức an toàn là {{min(cap, base * 2^(attempt-1))}} rồi cắt về nửa trên + nửa ngẫu nhiên — biến thể *equal jitter*. Nếu dùng {{new Random()}} trần, các test của bạn sẽ chạy không xác định; nếu dùng **cùng một** giá cố định cho mọi request thì tất cả client lại retry cùng một nhịp, đúng cái jitter sinh ra để tránh. Mẹo: seed theo {{policy.seed ^ request.hashCode()}} — xác định theo từng request, khác nhau giữa các request.

**Ba — đồng hồ giả biến logic chờ thành logic kiểm chứng được.** Nếu client gọi {{Thread.sleep}}, test mất 30 giây thật và vẫn không chứng minh được client chờ **đúng bao lâu**. Với {{FakeClock}}, mỗi lần chờ là một {{advance}} và bạn chỉ việc so hiệu thời điểm giữa hai lần gọi server. Đây là khuôn mẫu đáng học: bất kỳ code nào phụ thuộc thời gian (SRS, phiên hết hạn, cache TTL) đều nên nhận đồng hồ qua tham số để test được.

Lỗi hay gặp khi viết bài này: dùng {{<=}} thay {{<}} khiến số lần gọi nhiều hơn {{maxAttempts}}; quên {{attempt >= maxAttempts}} khi {{maxAttempts == 1}} nên vẫn retry; coi mọi header {{retry-after}} là số nên ném exception khi gặp HTTP-date; parse HTTP-date bằng {{Date}} cũ phụ thuộc múi giờ máy chạy test (mốc 1970-01-01T00:00:00Z) thay vì {{Instant}}; và trả về response **đầu tiên** thay vì response cuối khi cạn ngân sách, làm mất {{retry-after}} mới nhất mà client gọi cấp trên cần.`,
    },
  ],
  check: [
    {
      q: 'Server trả {{429}} kèm {{Retry-After: 30}}. Client nên làm gì?',
      options: [
        'Retry ngay lập tức vì 429 là lỗi mạng tạm thời',
        'Chờ 30 giây (có thể cộng jitter) rồi retry, nếu request là idempotent',
        'Dừng hẳn và báo lỗi cho người dùng vì 429 nghĩa là bị cấm vĩnh viễn',
        'Retry ngay nhưng tăng {{RateLimit-Limit}} lên 30',
      ],
      answer: 1,
      explain: '{{Retry-After}} cho biết thời điểm server kỳ vọng bạn quay lại, nên chờ theo nó. Cộng thêm jitter là tốt để dàn tải khi có hàng nghìn client cùng bị chặn. Chờ chỉ áp dụng cho request idempotent. 429 không phải cấm vĩnh viễn (đó là 403 hoặc khoá tài khoản), và {{RateLimit-Limit}} là header **server gửi**, client gửi lên không có ý nghĩa gì.',
    },
    {
      q: 'Vì sao không nên tự retry một {{POST /payments}} nhận về 503?',
      options: [
        'Vì 503 không phải lỗi có thể retry',
        'Vì POST chưa chắc idempotent: retry có thể tạo thêm một giao dịch thứ hai, trừ tiền hai lần',
        'Vì POST luôn nhanh hơn GET nên retry là lãng phí',
        'Vì client không được phép retry bất kỳ method nào',
      ],
      answer: 1,
      explain: '503 là lỗi tạm thời và **có thể** retry, nhưng chỉ với request mà gọi lại không gây tác dụng phụ. POST không idempotent: lệnh có thể đã thành công ở server rồi mới mất trên đường về, retry sẽ tạo bản ghi thứ hai.Lối ra duy nhất là làm cho nó idempotent bằng {{Idempotency-Key}} và gửi lại **cùng key** — khi đó retry là an toàn.',
    },
    {
      q: 'Ứng dụng chạy 8 instance sau load balancer, mỗi instance giữ bộ đếm request trong một biến của JVM. Hệ quả là gì?',
      options: [
        'Không sao, load balancer tự chia đều nên hạn mức vẫn đúng',
        'Hạn mức thực tế thành gấp ~8 lần công bố và phụ thuộc định tuyến, phải chuyển bộ đếm ra Redis hoặc gateway',
        'Hiệu năng giảm vì Redis không được dùng',
        'Chỉ sai khi có hơn 100 client',
      ],
      answer: 1,
      explain: 'Mỗi JVM đếm độc lập nên "100 request/phút" nhân theo số instance; client có session affinity (load balancer luôn đẩy cùng một khách về một instance) còn thấy hạn mức "ảo" khác client bị phân tán. Bộ đếm phải ở nơi **dùng chung** (Redis với lệnh nguyên tử, hoặc tầng gateway). Load balancer chia đều chỉ làm sai số ít hơn, không làm nó đúng.',
    },
    {
      q: 'Hiện tượng "nhiều client cùng nhận 429 rồi cùng retry đúng một giây sau, làm hệ thống vừa hồi phục gục lần nữa" gọi là gì và khắc phục bằng cách nào?',
      options: [
        'Thundering herd — chỉ có thể khắc phục bằng cách tăng hạn mức',
        'Retry storm — dùng backoff luỹ thừa cộng jitter, và đặt retry budget',
        'Split-brain — dùng thêm một Redis replica',
        'Poison pill — xoá message khỏi hàng đợi',
      ],
      answer: 1,
      explain: 'Đây là retry storm (một dạng của thundering herd). Backoff luỹ thừa làm tổng tải giảm theo thời gian, jitter dàn trải các mốc retry thay vì dồn vào một giây, retry budget ngăn việc biến mọi request thành retry. Tăng hạn mức chỉ là chữa cháy, không loại bỏ hiện tượng.',
    },
  ],
  related: ['api-019', 'api-002', 'api-011'],
  tags: ['429', 'Retry-After', 'rate limit', 'backoff', 'jitter', 'retry', 'client'],
},
{
  id: 'lesson-api-007',
  track: 'api',
  order: 7,
  title: 'Tiến hoá API mà không làm hỏng client: breaking change, tolerant reader, versioning, Sunset',
  level: 'senior',
  minutes: 40,
  goals: [
    'Phân loại một thay đổi schema thành an toàn / rủi ro / phá vỡ, và giải thích được vì sao nằm ở nhóm đó',
    'Cấu hình **tolerant reader** trong Jackson để client cũ không crash khi server thêm field hoặc thêm giá trị enum',
    'Chọn cách versioning (URI, header, media type) và biện minh bằng đánh đổi về cache, debug, CORS',
    'Viết lộ trình deprecation đúng: {{Deprecation}}, {{Sunset}}, {{Link}} và đo lường trước khi tắt bản cũ',
  ],
  body: `### Cái gì: API là hợp đồng, không phải hàm nội bộ
**Tóm tắt:** Khi đổi một hàm trong service của bạn, bạn sửa luôn 20 chỗ gọi nó trong cùng một commit. Khi đổi API, bạn không biết ai đang gọi: app mobile phiên bản 2.3 đã phát hành từ năm ngoái và nằm trên máy khách hàng, đối tác đã tích hợp từ hai năm trước, cùng một scripts nội bộ của team khác. Bạn **không thể** sửa phía họ, nên chỉ có ba lựa chọn: đổi theo cách họ chịu được (tương thích ngược), chạy song song hai phiên bản (versioning), hoặc báo trước rồi tắt dần (deprecation + {{Sunset}}).

Thuật ngữ xuất hiện lần đầu:
- **Tương thích ngược (backward compatible)**: phiên bản server mới vẫn phục vụ đúng kỳ vọng của client **cũ**. Ví dụ đời thường: ổ cắm điện mới vẫn cắm được phích cũ.
- **Tương thích tiến (forward compatible)**: client **mới** sống được khi gặp server **cũ** (field nó cần chưa tồn tại). Cả hai chiều này là lý do API nên được thiết kế "thêm dễ, bỏ khó".
- **Breaking change (thay đổi phá vỡ)**: khiến client đang chạy bị lỗi — crash, đọc sai dữ liệu, hoặc nhận response nó không parse được.
- **Non-breaking / additive change**: client cũ bỏ qua được mà không hỏng.
- **Tolerant reader**: cách viết client **chấp nhận cái lạ** — field lạ thì bỏ qua, giá trị enum lạ thì coi như "không biết" thay vì ném exception. Đây là phòng tuyến quan trọng nhất, vì nó biến nhiều thay đổi "phá vỡ" thành "an toàn".
- **Contract (hợp đồng)**: mô tả máy-đọc-được của API (OpenAPI/Swagger, protobuf, AVRO schema). **Contract test** là test tự động chứng minh client và server vẫn khớp nhau.
- **Semantic versioning cho API**: {{v1}}, {{v2}} — chỉ tăng số lớn (major) khi có breaking change.
- **Deprecation**: đánh dấu "still dùng được nhưng đừng dùng nữa". **Sunset**: ngày chính thức ngừng phục vụ.

### Vì sao "thêm một field cho có" lại có thể làm sập app
Vì đa số client sinh mã tự động (generated client) và các parser nghiêm khắc. Jackson của Spring Boot **mặc định đã tắt** việc fail khi gặp field lạ, nhưng nhiều đội bật lại {{FAIL_ON_UNKNOWN_PROPERTIES = true}} để "phát hiện lỗi sớm", hoặc dùng XML/JSON mapper kiểu cũ, hoặc dùng parser ở ngôn ngữ khác: {{System.Text.Json}} của .NET **mặc định ném lỗi** khi JSON có property không tồn tại trong class. Khi đó một field thêm vào = app crash trên toàn bộ người dùng cũ. Bài học: **luôn hỏi đối tác xem reader của họ có dung thứ (tolerant) không trước khi "thêm field cho có"**.

### Bảng phân loại thay đổi
Xét theo hướng: bạn đổi **server**, client cũ vẫn còn sống.

| Thay đổi | Phân loại | Vì sao |
|---|---|---|
| Thêm field **optional** vào response | An toàn (với tolerant reader) | Client cũ không biết tới field thì bỏ qua |
| Thêm field **bắt buộc** vào request body | **Phá vỡ** | Client cũ không gửi field đó, server mới trả 400 |
| Xoá field khỏi response | **Phá vỡ** | Client đang đọc field đó nhận null → NPE hoặc hiển thị trống |
| Xoá field khỏi request (server chấp nhận rồi bỏ qua) | Rủi ro thấp | Client vẫn gửi được, chỉ là dữ liệu bị bỏ qua — nên báo trước |
| Đổi kiểu field: {{int}} → {{String}} | **Phá vỡ** | Parser và ép kiểu (cast) phía client cũ thất bại |
| Nới rộng kiểu số: {{int}} → {{long}} | **Rủi ro** | JSON vẫn là số nên parse được, nhưng client nhét vào biến {{int}} sẽ tràn số khi giá trị lớn hơn 2 tỷ |
| Đổi **ý nghĩa** field: {{status: "PENDING"}} nghĩa mới | **Phá vỡ ngầm** | Không lỗi kỹ thuật nào, client chỉ làm ra quyết định sai. Đây là loại nguy hiểm nhất |
| Thêm giá trị enum vào response ({{status: "REFUNDED"}}) | **Phá vỡ** nếu reader nghiêm khắc | {{switch}} không có nhánh default → ném exception hoặc rơi vào nhánh "impossible" |
| Bỏ một giá trị enum | **Phá vỡ** | Client gặp dữ liệu lịch sử vẫn còn giá trị đó |
| Đổi tên field | **Phá vỡ** | Với client cũ đó là field cũ bị xoá cộng một field vô nghĩa |
| Đổi đơn vị (tiền: VND cent → VND) / đổi múi giờ ngày tháng | **Phá vỡ ngầm** | Như đổi ý nghĩa |
| Thêm {{Link}}/{{Deprecation}} header | An toàn | Header lạ bị bỏ theo chuẩn HTTP |

### Tolerant reader: viết client để lần sau khỏi phải nâng cấp gấp
~~~java
// 1) Bỏ qua field lạ thay vì ném UnrecognizedPropertyException
@JsonIgnoreProperties(ignoreUnknown = true)
class AccountView {
    public String id;
    public Money amount;

    // 2) Enum: khai bao mot gia tri mac dinh de gia tri moi cua server khong lam do app
    @JsonEnumDefaultValue
    public enum Status { NEW, PAID, VOID, UNKNOWN }
}

ObjectMapper mapper = new ObjectMapper()
    .configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false)
    .enable(DeserializationFeature.READ_UNKNOWN_ENUM_VALUES_USING_DEFAULT_VALUE);
~~~
Ba quy tắc còn lại không nằm trong code cấu hình:
- **Không bao giờ giả định field luôn có mặt**: đọc bằng {{Optional}}, kiểm tra null, và có giá trị mặc định hợp lý.
- **Không dựa vào thứ tự phần tử** của mảng nếu tài liệu không hứa thứ tự; không đếm số field để suy ra phiên bản.
- **Không "mượn" field có sẵn cho mục đích mới** (dùng {{note}} để truyền mã lỗi). Đó là breaking-âm: client cũ hiển thị thứ vô nghĩa mà không ai báo lỗi.

### Versioning: ba cách đặt số phiên bản
| Cách | Ví dụ | Ưu | Nhược |
|---|---|---|---|
| **URI path** | {{GET /v2/accounts/9}} | Rõ ràng, log/dashboard tách theo version được, cache-friendly, dễ route ở gateway | URI là "danh tính" tài nguyên nhưng mang chi tiết triển khai; khó A/B hai version trên cùng một URL |
| **Header tuỳ biến** | {{X-API-Version: 2}} | URI sạch | CORS: header lạ làm phát sinh **preflight** (request OPTIONS trước request thật) cho client trình duyệt; khó debug bằng tay |
| **Media type (content negotiation)** | {{Accept: application/vnd.bank.v2+json}} | "Chuẩn" nhất về mặt REST; một URI, nhiều hình dung | Khó nhìn, khó cache theo biến thể (cần {{Vary}}), tooling ít thân thiện |

Với API công khai, URI path phổ biến vì dễ vận hành và dễ giải thích cho đối tác. Đừng version mọi thứ: nếu thay đổi là additive thì client không cần biết có version mới.

### Báo trước rồi tắt: {{Deprecation}} và {{Sunset}}
- {{Deprecation}} (draft IETF): nói "API này sẽ bị loại". Dạng mới dùng HTTP-date, có cờ hiệu: {{Deprecation: @1735689600}} (epoch seconds dạng @) hoặc {{Deprecation: true}} ở bản cũ.
- {{Sunset}} (RFC 8594): **ngày giờ cụ thể** bản này ngừng phục vụ, dạng HTTP-date: {{Sunset: Tue, 01 Dec 2026 00:00:00 GMT}}.
- {{Link}} để chỉ đường tới tài liệu bản mới: {{Link: <https://docs.bank.vn/migrate-v1-to-v2>; rel="deprecation"}}, và {{rel="alternate"}} trỏ tới chính URL của phiên bản thay thế.
- {{Warning: 299 - "API v1 is deprecated, see docs/..."}}: kiểu cũ, các chuẩn mới đã bỏ {{Warning}}, dùng ba header trên.
- Sau Sunset: trả {{410 Gone}} (mất vĩnh viễn, đừng trả {{404}} vì client sẽ tưởng tài nguyên bị xoá) kèm message chỉ tới bản mới.

Kỹ thuật triển khai thật: mỗi response của v1 đều mang {{Deprecation}}/{{Sunset}} + log **{{User-Agent}}/API key** nào còn gọi v1. Sau đó gửi email đúng chủ key đó, và chỉ tắt khi đường cong traffic về gần 0.

### Chiến lược expand → migrate → contract (đổi mà không phá)
~~~seq
title: Doi ten amount(int) thanh amountMinor(int64) khong gay hong client cu
actors: App cu | App moi | Gateway | Service | DB
note Gateway: giai doan EXPAND, ca hai version song song
App cu -> Gateway: GET /v1/accounts/9
Gateway -> Service: route v1
Service -> DB: doc amount_minor
Service --> Gateway: amount (int) + amountMinor (int64)
Gateway --> App cu: 200, v1 van co field cu
App moi -> Gateway: GET /v2/accounts/9
Gateway -> Service: route v2
Service --> Gateway: chi co amountMinor
Gateway --> App moi: 200
note Service: giai doan MIGRATE, dam du 100% traffic da sang v2
note Service: giai doan CONTRACT, xoa field cu khoi v1 roi tat v1 bang Sunset
~~~
Ba bước đó là toàn bộ bí mật của việc đổi API lớn: **thêm trước** (cả hai cùng tồn tại), **dọn khách hàng** (đo và ép di cư), **bỏ sau**. Ai muốn làm tắt một bước sẽ phải gọi điện xin lỗi.

### Kiểm chứng tự động thay vì tin nhau
- **Chẩn diff OpenAPI trong CI**: sinh file OpenAPI từ code (springdoc), so với bản của {{main}}, chặn nếu có breaking change — fail build ngay khi ai đó xoá field.
- **Contract test / consumer-driven contract** (Pact, Spring Cloud Contract): mỗi client công bố kỳ vọng của mình, server chạy bộ kỳ vọng đó trong CI. Đổi schema mà làm hỏng kỳ vọng thì không merge được.
- **Feature flag + canary**: bật response kiểu mới cho 1% traffic, theo dõi tỷ lệ 4xx/5xx và lỗi parse phía client (từ log client gửi về) trước khi bật hết.
- **Version endpoint ngay trong schema**: nếu client không đọc được {{apiVersion}}/khả năng thì chưa sẵn sàng cho thay đổi nào.

### Lỗi hay gặp
- **"Chỉ là thêm field có gì đâu"** rồi làm sập đối tác dùng reader nghiêm khắc; không hỏi, không đo.
- **Nuôi {{v1}} và {{v2}} vĩnh viễn**: mỗi version là thêm chi phí sửa lỗi, vá bảo mật và chạy test; hai version lệch nhau tính năng là nơi sinh ra bug. Luôn có ngày Sunset và giữ lời.
- **Version trong payload** ({{"apiVersion": 2}} trong body của cùng một URL): gateway không route được, phải giải mã body mới biết phiên bản.
- **Quên {{Vary}}** khi cùng một URL trả nội dung khác nhau theo header version → CDN trả nhầm bản cho khách khác.
- **Đổi ý nghĩa field mà không tăng version** — tệ nhất trong các loại, vì không có tín hiệu nào để client phát hiện.
- **Tắt version theo đồng hồ, không theo dữ liệu**: tắt v1 khi còn 3% traffic từ một khách hàng enterprise trả tiền nhiều nhất.

### Liên hệ phỏng vấn
Câu hay gặp: "Bạn phải đổi kiểu tiền từ {{int}} thành {{String}} cho 50 đối tác, làm thế nào?" Hướng trả lời được chấm cao:
1. **Phân loại**: đây là breaking change (đổi kiểu), không thể làm âm thầm.
2. **Thêm cái mới song song**: field {{amountMinor}} (int64) và {{amountText}} được thêm vào cả v1 — additive, không phá ai.
3. **Contract test + OpenAPI diff trong CI** để mọi thay đổi sau đó được chứng minh tự động.
4. **Di cư có số liệu**: log API key nào còn dùng field cũ, dashboard đếm theo tuần, chủ động liên hệ nhóm còn lại.
5. **{{Deprecation}}/{{Sunset}} trên mọi response của v1**, rồi {{410 Gone}} sau ngày đó.
6. Nói được **tolerant reader** và Jackson {{READ_UNKNOWN_ENUM_VALUES_USING_DEFAULT_VALUE}}: phòng tuyến để lần sau không lặp lại cảnh này.

Điểm cộng cho vai trò Lead/Architect: nêu **chi phí vận hành** của việc nuôi nhiều version và đề xuất giới hạn (tối đa 2 version public, thời gian overlap có trần, tỷ lệ traffic là điều kiện tắt chứ không phải ngày hẹn).

> **Senior tip:** Quy tắc tôi dùng khi review thay đổi schema: *cái gì server thêm thì server chịu, cái gì client cần thì client tự bảo vệ mình*. Nghĩa là: không bao giờ bỏ field/enum value nếu chưa đo, không bao giờ đổi kiểu hay đổi nghĩa tại chỗ, luôn gửi kèm một trường mô tả bằng chuỗi cho giá trị enum ({{statusLabel}} dạng chữ dễ đọc) để khách hàng có thể chuyển sang hiển thị trường đó thay vì {{switch}} trên mã enum. Và một điều ít ai nói: **tài liệu là một phần của hợp đồng** — thêm field mà không cập nhật tài liệu/OpenAPI thì 6 tháng sau chính team bạn sẽ phá vỡ nó vì "không ai biết field này dùng để làm gì".`,
  exercises: [
    {
      title: 'CompatChecker.diff: so sánh 2 schema và xếp loại thay đổi (breaking / risky / safe)',
      prompt: `Viết {{class CompatChecker}} với method tĩnh:

{{static CompatReport diff(Map<String, Field> before, Map<String, Field> after)}}

Các loại có sẵn (đừng đổi chữ ký):
- {{record Field(String type, boolean required, Set<String> values)}} — {{type}} là một trong {{string}}, {{int}}, {{long}}, {{float}}, {{double}}, {{boolean}}, {{enum}}, {{object}}, {{array}}. {{values}} **chỉ có nghĩa** khi {{type}} là {{enum}} (tập giá trị hợp lệ); constructor {{Field(String type, boolean required)}} tạo field không phải enum.
- {{record CompatReport(List<String> breaking, List<String> risky, List<String> safe)}} — ba danh sách nhãn thay đổi, **mỗi danh sách sắp xếp tăng dần theo thứ tự từ điển**.

Quy tắc xếp loại, áp dụng cho từng field:
1. Field có trong {{before}}, mất trong {{after}}: {{breaking}} — nhãn {{"removed:<tên field>"}}.
2. Field mới xuất hiện trong {{after}}: nếu {{required}} thì {{breaking}} — {{"added-required:<tên>"}}; nếu không thì {{safe}} — {{"added-optional:<tên>"}}.
3. Field có ở cả hai mà {{required}} đổi: {{false -> true}} là {{breaking}} {{"now-required:<tên>"}} (bắt buộc cái trước đó tuỳ chọn); {{true -> false}} là {{safe}} {{"now-optional:<tên>"}}.
4. {{type}} đổi:
   - Nếu cặp kiểu nằm trong danh sách nới rộng số học an toàn (bốn cặp: {{int->long}}, {{int->double}}, {{long->double}}, {{float->double}}) thì {{risky}} — {{"widened:<tên>:<kiểu cũ>-><kiểu mới>"}} (client nhét vào biến kiểu cũ sẽ tràn số).
   - Mọi trường hợp đổi kiểu khác là {{breaking}} — {{"retyped:<tên>:<kiểu cũ>-><kiểu mới>"}}.
5. Hai bên **đều là {{enum}}** (kiểu giống nhau): so {{values}}.
   - Mỗi giá trị bị bỏ: {{breaking}} — {{"enum-value-removed:<tên>:<giá trị>"}}.
   - Mỗi giá trị được thêm: {{risky}} — reader nghiêm khắc sẽ fail khi gặp giá trị mới, nhưng tolerant reader thì sống, nên không xếp vào breaking.
   - Khi {{type}} đổi (ví dụ {{enum}} sang {{string}}) thì **chỉ** áp dụng quy tắc 4, không sinh nhãn enum.
6. Một field có thể rơi vào nhiều quy tắc cùng lúc (ví dụ vừa đổi kiểu vừa thành bắt buộc) — emit đủ các nhãn tương ứng.
7. Không có thay đổi nào thì danh sách tương ứng rỗng. Không được phát sinh nhãn thừa.`,
      starter: `record Field(String type, boolean required, Set<String> values) {
    Field(String type, boolean required) { this(type, required, Set.of()); }
}

record CompatReport(List<String> breaking, List<String> risky, List<String> safe) {
}

class CompatChecker {
    static CompatReport diff(Map<String, Field> before, Map<String, Field> after) {
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
    static Set<String> ev(String... v) { return new LinkedHashSet<>(Arrays.asList(v)); }
    static Map<String, Field> s(Object... kv) {
        Map<String, Field> m = new LinkedHashMap<>();
        for (int i = 0; i < kv.length; i += 2) m.put((String) kv[i], (Field) kv[i + 1]);
        return m;
    }
    public static void main(String[] args) {
        check("schema khong doi -> ba danh sach rong", () -> {
            Map<String, Field> a = s("id", new Field("string", true), "note", new Field("string", false));
            CompatReport r = CompatChecker.diff(a, s("id", new Field("string", true), "note", new Field("string", false)));
            eq(List.of(), r.breaking());
            eq(List.of(), r.risky());
            eq(List.of(), r.safe());
        });
        check("them field optional la safe, khong phai breaking", () -> {
            CompatReport r = CompatChecker.diff(s("id", new Field("string", true)),
                s("id", new Field("string", true), "nickname", new Field("string", false)));
            eq(List.of(), r.breaking());
            eq(List.of(), r.risky());
            eq(List.of("added-optional:nickname"), r.safe());
        });
        check("them field bat buoc pha vo client cu", () -> {
            CompatReport r = CompatChecker.diff(s("id", new Field("string", true)),
                s("id", new Field("string", true), "taxId", new Field("string", true)));
            eq(List.of("added-required:taxId"), r.breaking());
            eq(List.of(), r.safe());
        });
        check("xoa field khoi response la breaking", () -> {
            CompatReport r = CompatChecker.diff(s("id", new Field("string", true), "balance", new Field("long", true)),
                s("id", new Field("string", true)));
            eq(List.of("removed:balance"), r.breaking());
        });
        check("doi kieu khong tu nhien la breaking, doi enum sang string khong sinh nhan enum", () -> {
            CompatReport r = CompatChecker.diff(s("amount", new Field("string", true)),
                s("amount", new Field("int", true)));
            eq(List.of("retyped:amount:string->int"), r.breaking());
            eq(List.of(), r.risky());
            CompatReport e = CompatChecker.diff(s("status", new Field("enum", true, ev("NEW", "PAID"))),
                s("status", new Field("string", true, ev("NEW", "PAID"))));
            eq(List.of("retyped:status:enum->string"), e.breaking());
        });
        check("noi rong kieu so: van parse duoc nhung quy vao nhom rui ro", () -> {
            CompatReport r = CompatChecker.diff(
                s("amount", new Field("int", true), "rate", new Field("float", false), "big", new Field("long", false)),
                s("amount", new Field("long", true), "rate", new Field("double", false), "big", new Field("string", false)));
            eq(List.of("retyped:big:long->string"), r.breaking());
            eq(List.of("widened:amount:int->long", "widened:rate:float->double"), r.risky());
            eq(List.of(), r.safe());
        });
        check("optional -> required la pha vo; required -> optional thi an toan", () -> {
            CompatReport r1 = CompatChecker.diff(s("email", new Field("string", false)), s("email", new Field("string", true)));
            eq(List.of("now-required:email"), r1.breaking());
            CompatReport r2 = CompatChecker.diff(s("email", new Field("string", true)), s("email", new Field("string", false)));
            eq(List.of(), r2.breaking());
            eq(List.of("now-optional:email"), r2.safe());
        });
        check("enum: gia tri bi bo la breaking, gia tri them la risky", () -> {
            CompatReport r = CompatChecker.diff(s("status", new Field("enum", true, ev("NEW", "PAID", "VOID"))),
                s("status", new Field("enum", true, ev("NEW", "PAID", "REFUNDED", "DISPUTED"))));
            eq(List.of("enum-value-removed:status:VOID"), r.breaking());
            eq(List.of("enum-value-added:status:DISPUTED", "enum-value-added:status:REFUNDED"), r.risky());
            eq(List.of(), r.safe());
        });
        check("nhieu thay doi: moi danh sach sap xep tang dan va phan loai dung", () -> {
            Map<String, Field> before = s(
                "id", new Field("string", true),
                "age", new Field("int", false),
                "kind", new Field("enum", true, ev("A", "B")),
                "legacy", new Field("string", true));
            Map<String, Field> after = s(
                "id", new Field("string", true),
                "age", new Field("int", true),
                "kind", new Field("enum", true, ev("A", "B", "C")),
                "channel", new Field("string", false),
                "ownerId", new Field("string", true));
            CompatReport r = CompatChecker.diff(before, after);
            eq(List.of("added-required:ownerId", "now-required:age", "removed:legacy"), r.breaking());
            eq(List.of("enum-value-added:kind:C"), r.risky());
            eq(List.of("added-optional:channel"), r.safe());
        });
        check("mot field vua doi kieu vua thanh bat buoc: emit ca hai nhan", () -> {
            CompatReport r = CompatChecker.diff(s("count", new Field("int", false)), s("count", new Field("long", true)));
            eq(List.of("now-required:count"), r.breaking());
            eq(List.of("widened:count:int->long"), r.risky());
            eq(List.of(), r.safe());
        });
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
      reference: `record Field(String type, boolean required, Set<String> values) {
    Field(String type, boolean required) { this(type, required, Set.of()); }
}

record CompatReport(List<String> breaking, List<String> risky, List<String> safe) {
}

class CompatChecker {
    // Cặp kiểu "đọc được bằng parser cũ, chỉ rủi ro khi giá trị vượt khoảng cũ"
    private static final Set<String> WIDENING = Set.of("int->long", "int->double", "long->double", "float->double");

    static CompatReport diff(Map<String, Field> before, Map<String, Field> after) {
        List<String> breaking = new ArrayList<>();
        List<String> risky = new ArrayList<>();
        List<String> safe = new ArrayList<>();

        for (Map.Entry<String, Field> e : before.entrySet()) {
            String name = e.getKey();
            Field b = e.getValue();
            Field a = after.get(name);
            if (a == null) {
                breaking.add("removed:" + name);
                continue;
            }
            if (!b.type().equals(a.type())) {
                String pair = b.type() + "->" + a.type();
                if (WIDENING.contains(pair)) risky.add("widened:" + name + ":" + pair);
                else breaking.add("retyped:" + name + ":" + pair);
            } else if ("enum".equals(b.type())) {
                for (String v : b.values()) if (!a.values().contains(v)) breaking.add("enum-value-removed:" + name + ":" + v);
                for (String v : a.values()) if (!b.values().contains(v)) risky.add("enum-value-added:" + name + ":" + v);
            }
            if (!b.required() && a.required()) breaking.add("now-required:" + name);
            else if (b.required() && !a.required()) safe.add("now-optional:" + name);
        }
        for (Map.Entry<String, Field> e : after.entrySet()) {
            if (before.containsKey(e.getKey())) continue;
            if (e.getValue().required()) breaking.add("added-required:" + e.getKey());
            else safe.add("added-optional:" + e.getKey());
        }
        Collections.sort(breaking);
        Collections.sort(risky);
        Collections.sort(safe);
        return new CompatReport(breaking, risky, safe);
    }
}`,
      hints: [
        'Duyệt {{before}} để bắt {{removed}}, {{retyped}}, {{widened}}, {{now-required}}, {{now-optional}}, nhãn enum; sau đó duyệt {{after}} và bỏ qua field đã có trong {{before}} để bắt {{added-required}}/{{added-optional}}.',
        'So sánh kiểu bằng {{equals}}, ghép nhãn bằng chuỗi {{"<kiểu cũ>-><kiểu mới>"}} — dùng cùng một biến {{pair}} cho cả {{widened}} lẫn {{retyped}} để không lệch nhãn.',
        'Với enum, chỉ so {{values}} khi {{type}} của hai bên **đều** là "enum". Set không giữ thứ tự, nên sort cả ba danh sách trước khi trả để kết quả xác định.',
      ],
      explain: `Bài này mô phỏng đúng thứ CI phải làm mỗi khi ai đó sửa schema: sinh danh sách thay đổi, **dựa vào danh sách đó để quyết định** có được merge hay không, có phải tăng version hay không.

Ba chỗ dễ sai nhất về mặt **ý nghĩa**, không phải cú pháp:

**Một — "{{enum-value-added}}" là risky chứ không phải safe.** Trực giác nói "thêm giá trị mới thì client cũ có đụng tới đâu". Nhưng client cũ thường có {{switch (status)}} với các nhánh {{NEW}}, {{PAID}}; gặp {{REFUNDED}} nó hoặc ném exception (switch biểu thức không có default), hoặc đi vào nhánh "lẽ ra không thể xảy ra" và gửi tiền hoàn cho bộ phận sai. Đây là lý do Jackson cần {{@JsonEnumDefaultValue}} + {{READ_UNKNOWN_ENUM_VALUES_USING_DEFAULT_VALUE}}, protobuf cần giá trị {{UNKNOWN = 0}}, và AVRO/protobuf được gọi là cơ chế **forward/backward compatible** có điều kiện.

**Hai — nới rộng số học để ở {{risky}}, không phải {{safe}}.** JSON nhét {{1234567890123}} vào một field mà client khai là {{int}} sẽ gây tràn số hoặc lỗi chuyển kiểu ({{InputCoercionException}} của Jackson). Nếu field là số dư tính bằng cent thì nó chỉ vỡ khi khách hàng đủ lớn — nghĩa là test của bạn không thấy, còn phòng kế toán thì thấy. Vậy nên vẫn cho qua nhưng phải gắn cờ để người review quyết định.

**Ba — "đổi ý nghĩa" không nằm trong danh sách vì máy không phát hiện được.** {{status: "PENDING"}} đổi từ "chờ thanh toán" sang "chờ duyệt hồ sơ" là breaking change hoàn toàn mà {{CompatChecker}} nào cũng trả về "không thay đổi". Đấy là lý do quy trình phải có **người review diff schema**, và là lý do tốt nhất để tăng version.

Về kỹ thuật Java: dùng {{Collections.sort}} (so sánh {{String.compareTo}}) để đầu ra xác định — nếu quên, thứ tự duyệt {{Set}}/{{HashMap}} thay đổi giữa các lần chạy và test đỏ lúc có lúc không mà không giải thích được; dùng {{LinkedHashMap}}/{{LinkedHashSet}} khi dựng dữ liệu test cũng giúp đọc lỗi dễ hơn. Điều kiện {{required}} nên kiểm tra **độc lập** với điều kiện kiểu, vì một field có thể vừa đổi kiểu vừa thành bắt buộc (test cuối).

Trong dự án thật, bạn gần như không tự viết cái này: {{oasdiff}}, {{schemastore}}, {{buf breaking --against}} (protobuf), hoặc Apache {{Avro}} {{CompatibilityChecker}} làm việc đó trên toàn bộ OpenAPI/Avro/protobuf schema và fail build khi phát sinh breaking. Nhưng hiểu bảng phân loại ở trên mới là thứ được hỏi trong phỏng vấn.`,
    },
  ],
  check: [
    {
      q: 'Thay đổi nào sau đây là **breaking change** với client cũ?',
      options: [
        'Thêm một field optional vào response',
        'Xoá một field khỏi response mà client đang đọc',
        'Thêm header {{Deprecation}} vào response',
        'Thêm một giá trị mới vào tài liệu mô tả API',
      ],
      answer: 1,
      explain: 'Xoá field khiến client đang đọc nó nhận null hoặc lỗi parse → phá vỡ. Thêm field optional thường an toàn (điều kiện: reader dung thứ), header lạ thì chuẩn HTTP cho phép bỏ qua, tài liệu không ảnh hưởng runtime. Lưu ý thêm **giá trị enum** vào response thì khác — nó nằm ở nhóm rủi ro vì {{switch}} của client cũ có thể không có nhánh default.',
    },
    {
      q: 'Client nên làm gì để "thêm field" thật sự luôn an toàn cho chính nó?',
      options: [
        'Kiểm tra {{Content-Length}} trước khi parse',
        'Tắt fail-on-unknown-field, dùng {{@JsonEnumDefaultValue}} cho enum, và không giả định field luôn tồn tại',
        'Khoá chặt schema và ném lỗi khi gặp bất kỳ key lạ nào',
        'Gửi header {{X-API-Version}} trong mọi request',
      ],
      answer: 1,
      explain: 'Đó chính là **tolerant reader**: bỏ qua field lạ ({{FAIL_ON_UNKNOWN_PROPERTIES = false}}), map giá trị enum lạ về một giá trị mặc định, đọc field như thể nó có thể vắng mặt. Ngược lại, khoá chặt schema và ném lỗi khi gặp key lạ là cách biến mỗi lần server thêm field thành một sự cố.',
    },
    {
      q: 'Vì sao nhiều đội chọn versioning theo URI ({{/v2/...}}) thay vì theo header?',
      options: [
        'Vì header không truyền được dữ liệu',
        'Vì URI dễ nhìn, dễ log, dễ route ở gateway, cache được; header version buộc trình duyệt gửi preflight CORS',
        'Vì URI là bắt buộc theo chuẩn HTTP',
        'Vì version trong URI làm giảm số lượng API',
      ],
      answer: 1,
      explain: 'Version trong URI tự mô tả, tách được traffic theo version trong log và dashboard, cấu hình route/cache đơn giản. Header version ({{X-API-Version}}) giữ URI sạch nhưng với client trình duyệt nó là header tuỳ biến → mỗi request phát sinh thêm một lượt OPTIONS preflight, và debug bằng tay khó hơn.',
    },
    {
      q: 'Header {{Sunset}} dùng để làm gì?',
      options: [
        'Thông báo server sắp tắt vào cuối ngày',
        'Cho biết ngày giờ cụ thể một phiên bản API ngừng được phục vụ',
        'Yêu cầu client xoá cache',
        'Đánh dấu response bị cắt ngắn',
      ],
      answer: 1,
      explain: '{{Sunset}} (RFC 8594) là mốc thời gian tuyệt đối mà sau đó endpoint không còn phục vụ, đi cùng {{Deprecation}} và {{Link}} có {{rel="deprecation"}} để client biết đường di cư. Nó là lời hứa với khách hàng, không phải tín hiệu hạ tầng hay cache.',
    },
  ],
  related: ['api-016', 'api-030', 'api-014'],
  tags: ['API versioning', 'breaking change', 'tolerant reader', 'deprecation', 'Sunset', 'contract test'],
},
{
  id: 'lesson-api-008',
  track: 'api',
  order: 8,
  title: 'Rate limiter phân tán: sliding window counter vs token bucket, burst ở ranh giới',
  level: 'senior',
  minutes: 45,
  goals: [
    'Giải thích được vì sao fixed window bị double-burst ở ranh giới và sliding window counter xấp xỉ khắc phục ra sao',
    'So sánh token bucket và sliding window counter về độ chính xác, chi phí, khả năng chịu burst và nơi dùng phù hợp',
    'Mô tả được cơ chế rate limit phân tán thật (Redis INCR/EXPIRE, Lua script nguyên tử, gateway) và điểm đơn giản hoá trong mô phỏng',
    'Tự cài cả hai thuật toán với đồng hồ giả, xác định retryAfter và chặn burst ở ranh giới cửa sổ',
  ],
  body: `### Tóm tắt
Hai thuật toán rate limit phổ biến nhất là **sliding window counter** (cửa sổ trượt bằng bộ đếm) và **token bucket** (lọ token). Cả hai đều trả lời câu hỏi "request này có được phép đi tiếp không?" nhưng đánh đổi khác nhau: sliding window counter rẻ và dễ hiểu, token bucket cho phép burst tự nhiên và cho biết chính xác khi nào có token lại. Ở cấp senior, bạn phải nói được cả công thức, cả lỗi ở ranh giới cửa sổ, và cả cách triển khai nguyên tử khi hệ thống chạy nhiều instance.

### Nhắc lại các thuật ngữ (giải thích lần đầu trong ngữ cảnh bài này)
- **Rate limiter (bộ giới hạn tốc độ)**: thành phần đứng trước nghiệp vụ, quyết định cho qua hay trả 429. Hình dung như nhân viên soát vé ở cổng: mỗi phút chỉ cho 100 người vào, người thứ 101 phải đợi lượt sau.
- **Cửa sổ thời gian (time window)**: một khoảng thời gian cố định dùng để đếm, ví dụ 60 giây.
- **Burst (bùng nổ ngắn)**: một loạt request dồn tới rất nhanh trong thời gian ngắn. Ứng dụng mobile hay burst khi vừa mở (gọi song song 5 API).
- **Nguyên tử (atomic)**: một thao tác diễn ra trọn vẹn, không bị chen ngang bởi thao tác khác. Nếu "đọc rồi cộng rồi ghi" không nguyên tử, hai thread có thể cùng đọc 99, cùng cộng thành 100 và cùng cho qua, vượt hạn mức.
- **Redis**: kho dữ liệu trong RAM, truy cập theo key, dùng chung cho nhiều instance ứng dụng. Lệnh {{INCR}} tăng số nguyên theo key và trả giá trị mới; {{EXPIRE}} đặt thời gian sống.
- **Lua script trong Redis**: một đoạn mã nhỏ chạy bên trong Redis như một thao tác nguyên tử, dùng khi bạn cần "đọc - tính - ghi" liền mạch (ví dụ token bucket).
- **Phân tán (distributed)**: nhiều instance ứng dụng cùng phục vụ; nếu mỗi instance giữ bộ đếm riêng thì hạn mức thực tế nhân lên theo số instance, nên bộ đếm phải đặt ở nơi dùng chung (Redis) hoặc ở gateway.

### 1) Fixed window và lỗi double-burst ở ranh giới
**Cái gì:** Fixed window chia thời gian thành các ô cố định (00:00-00:59, 01:00-01:59...) và đếm trong ô hiện tại. Hết ô thì đếm lại từ 0.

**Vì sao bị lỗi ở ranh giới:** Hạn mức 100/phút. Ở giây 00:59 có 100 request được cho qua (ô thứ nhất). Sang 01:00 ô mới bắt đầu, thêm 100 request nữa được cho qua. Kết quả: 200 request trong 2 giây quanh ranh giới, dù mỗi ô riêng lẻ đều "đúng" 100/phút. Đây là **boundary burst** (bùng nổ ranh giới) - một lỗi kinh điển.

~~~text
Ô 1 [00:00 -------- 00:59]  100 req (dồn cuối ô)
Ô 2 [01:00 -------- 01:59]  100 req (dồn đầu ô)
                    ^^^
            200 req trong ~2 giây quanh ranh giới
~~~

### 2) Sliding window counter: công thức xấp xỉ
**Cái gì:** Thay vì chỉ nhìn ô hiện tại, ta kết hợp ô hiện tại với **tỉ lệ phần đã trôi qua** của ô trước.

Giả sử cửa sổ 60 giây, đang ở giây thứ {{elapsed}} của ô hiện tại (0 ≤ elapsed < 60), ô trước có {{prevCount}} request, ô hiện tại có {{currCount}} request:
- Tỉ lệ ô trước còn "chồng" lên cửa sổ trượt: {{weight = (60 - elapsed) / 60}}
- Ước lượng số request trong 60 giây gần nhất: {{estimate = prevCount * weight + currCount}}
- Cho qua nếu {{estimate < limit}}.

**Ví dụ số:** limit 100, ô trước 100 request, đang ở giây 6 của ô mới (elapsed=6, weight=0.9), ô mới đã có 15 request. {{estimate = 100*0.9 + 15 = 105}} → từ chối. Nhờ vậy burst dồn ở đầu ô mới bị chặn bởi "vết" của ô trước.

**Vì sao chỉ là xấp xỉ:** Ta giả định request của ô trước phân bố đều trong ô đó. Thực tế chúng có thể dồn cuối ô (chính là boundary burst) - công thức dùng {{prevCount * weight}} sẽ hơi "tha" hoặc hơi "chặt" tuỳ phân bố, nhưng sai số nhỏ và chi phí cực thấp (chỉ 2 bộ đếm + 1 phép nhân).

**Triển khai thật (Redis, đơn giản hoá):** hai key theo mẫu {{rate:ID:prevWindow}} và {{rate:ID:currWindow}} (ID là định danh client, còn prevWindow/currWindow là chỉ số ô trước và ô hiện tại), mỗi key {{INCR}} khi có request và {{EXPIRE}} sau 2 cửa sổ để tự dọn rác. Đọc hai key, áp công thức. Để "đọc + quyết định" nhất quán khi nhiều instance cùng chạy, người ta dùng một Lua script (chạy nguyên tử trong Redis). Ở production lớn, gateway như NGINX, Kong, Envoy thường có sẵn bộ đếm kiểu này.

### 3) Token bucket: lọ token và burst tự nhiên
**Cái gì:** Một "lọ" có sức chứa {{capacity}} token. Lọ được nạp {{refillRate}} token mỗi giây (không vượt capacity). Mỗi request lấy 1 token; lọ cạn thì 429. Token không dùng hết được giữ lại đến tối đa capacity.

**Vì sao cho phép burst tự nhiên:** Nếu hệ thống im 30 giây, lọ đầy; 10 request ập tới cùng lúc thì 10 request đầu lấy được token ngay (burst hợp lệ), request thứ 11 mới phải chờ lọ nạp. Điều này khớp hành vi thật: người dùng không nên bị phạt vì "để dành" quota.

**Trạng thái tối thiểu:** chỉ cần {{tokens}} (số token hiện có, số thực) và {{lastRefillTime}} (mốc lần nạp gần nhất). Khi có request: nạp bù {{(now - lastRefillTime) * refillRate}} (giới hạn bởi capacity), cập nhật mốc, rồi thử trừ 1.

**Tính retryAfter:** nếu thiếu {{missing}} token, thời gian chờ = {{missing / refillRate}}. Đây là giá trị chính xác cho header {{Retry-After}}.

**Triển khai thật (Redis):** token bucket cần cập nhật {{tokens}} và {{lastRefillTime}} cùng lúc theo thời gian hiện tại - tức là "đọc, tính theo now, ghi" phải nguyên tử. Thực tế dùng Lua script trong Redis (hoặc Redis module chuyên dụng) và **truyền {{now}} từ client vào script làm tham số** để mọi instance tính trên cùng một mốc (script Lua trong Redis không nên tự gọi lệnh lấy giờ vì tính không xác định/khó tái lập; truyền thời gian vào giúp logic xác định hơn).

~~~seq
title: Token bucket phan tan bang Redis Lua (don gian hoa)
actors: Client | App Instance A | App Instance B | Redis
Client -> App Instance A: GET /orders (API key K)
App Instance A -> Redis: EVAL token_bucket.lua key=rl:K now=t1
note Redis: nap bu theo (t1-last), tru 1 token, ghi lai - nguyen tu
Redis --> App Instance A: OK, con 9 token
App Instance A --> Client: 200 OK
Client -> App Instance B: GET /orders (API key K, cung luc)
App Instance B -> Redis: EVAL token_bucket.lua key=rl:K now=t1
Redis --> App Instance B: OK, con 8 token (thay A thay doi)
App Instance B --> Client: 200 OK
~~~

### 4) So sánh nhanh
| Tiêu chí | Sliding window counter | Token bucket |
|---|---|---|
| Bộ nhớ mỗi client | 2 bộ đếm + mốc cửa sổ | 2 số (tokens, lastRefill) |
| Burst | Bị "kéo" bởi ô trước (chặn boundary burst khá tốt) | Cho phép burst tự nhiên tới capacity |
| Độ chính xác | Xấp xỉ (giả định phân bố đều trong ô trước) | Chính xác theo thời gian thực |
| retryAfter | Ước lượng (đến hết phần cửa sổ cần chờ) | Chính xác (thiếu bao nhiêu token / tốc độ nạp) |
| Nguyên tử phân tán | 2 key, có thể dùng Lua; đôi khi chấp nhận sai số nhỏ | Cần Lua/script để đọc-tính-ghi liền mạch |
| Hay dùng ở | Gateway cấu hình đơn giản, quota theo phút/giờ | API public, SDK, chỗ cần burst hợp lệ và Retry-After chính xác |

### 5) Bản mô phỏng trong bài tập đơn giản hoá ở đâu
- **Đồng hồ giả (fake clock):** bài tập truyền {{nowMillis}} vào từng lần gọi, không dùng {{System.nanoTime()}} hay {{Thread.sleep()}} để test xác định. Hệ thống thật dùng thời gian thực; hệ thống phân tán còn phải chấp nhận lệch đồng hồ nhỏ giữa các máy (dùng thời gian Redis hoặc chấp nhận sai số).
- **Một tiến trình, một luồng quyết định:** bài tập không cần {{synchronized}}/Lua; mục tiêu là hiểu công thức. Hệ thống thật phải bảo đảm nguyên tử (Lua script, {{synchronized}}, hoặc cổng đơn tuyến).
- **Key duy nhất:** bài tập mô phỏng một limiter; hệ thống thật có một bộ đếm/lọ cho mỗi API key (hoặc IP, hoặc cặp user+endpoint) và có TTL tự dọn key cũ.

### Lỗi hay gặp
- **Dùng fixed window mà tưởng đã an toàn:** boundary burst vẫn vượt gấp đôi hạn mức trong tích tắc.
- **Token bucket không giới hạn capacity:** để {{tokens}} tăng vô hạn khi im lặng → sau đó burst khổng lồ, phá vỡ mục đích bảo vệ.
- **Bộ đếm đặt trong bộ nhớ từng instance:** 8 instance → hạn mức thực tế gấp 8.
- **Quên nguyên tử khi phân tán:** đọc-ghi tách rời gây vượt hạn mức dưới tải cao (race condition).
- **Không trả {{Retry-After}}:** client đoán bừa, dễ tạo retry storm - bão gửi lại (nhiều client cùng retry ngay lập tức, làm quá tải nặng thêm; đã học ở bài 006).

### Liên hệ phỏng vấn
Câu hay gặp: "Thiết kế rate limiter cho API public chạy nhiều instance, 100 request/phút mỗi API key, cho phép burst ngắn." Trả lời có cấu trúc: (1) chọn thuật toán (token bucket vì cho burst hợp lệ + retryAfter chính xác, hoặc sliding window counter nếu chấp nhận xấp xỉ và muốn cực rẻ); (2) đặt bộ đếm ở Redis/gateway, dùng Lua script để nguyên tử; (3) key theo API key, TTL tự dọn; (4) trả 429 kèm {{Retry-After}} và {{RateLimit-*}}; (5) nói rõ đánh đổi (thêm ~1 round-trip Redis mỗi request, lệch đồng hồ nhỏ chấp nhận được). Nhắc được boundary burst của fixed window là điểm cộng lớn.

> Senior tip: Thuật toán chỉ là nửa bài toán. Nửa còn lại là **vận hành**: giới hạn phải phân tầng (theo IP để chặn bot, theo API key để công bằng, theo endpoint vì {{POST /payments}} đắt hơn {{GET /health}}), phải có dashboard cho khách tự xem mức dùng, và phải đo được "bao nhiêu request bị chặn" để phân biệt khách xấu với khách tốt đang bị oan (dấu hiệu hạn mức đặt sai).`,
  exercises: [
    {
      title: 'Cài SlidingWindowCounter và TokenBucket với đồng hồ giả, chặn boundary burst',
      prompt: `Hoàn thiện hai class giới hạn tốc độ, cả hai dùng **đồng hồ giả** (tham số {{nowMillis}}, đơn vị mili-giây, không bao giờ đi lùi giữa các lần gọi trên cùng một instance). Không dùng {{Thread.sleep}}, không dùng {{System.nanoTime()}}, không I/O.

1) {{class SlidingWindowCounter}}
- Constructor: {{SlidingWindowCounter(int limit, long windowMillis)}} với {{limit > 0}}, {{windowMillis > 0}}.
- {{boolean tryAcquire(long nowMillis)}}: trả về {{true}} nếu request được phép (và ghi nhận nó), {{false}} nếu vượt hạn mức.
- {{long retryAfterMillis(long nowMillis)}}: số mili-giây cần chờ (làm tròn **lên** tới mili-giây) để ước lượng có thể được phép; trả 0 nếu hiện tại được phép.
- Thuật toán: chia thời gian thành các ô cố định độ dài {{windowMillis}}. Ô hiện tại có chỉ số {{currIdx = floor(nowMillis / windowMillis)}}, thời gian đã trôi trong ô {{elapsed = nowMillis - currIdx*windowMillis}}. Gọi {{prev}} là số request đã ghi nhận của ô ngay trước ({{currIdx-1}}), {{curr}} là của ô hiện tại. Trọng số ô trước: {{weight = (windowMillis - elapsed) / (double) windowMillis}}. Ước lượng: {{estimate = prev*weight + curr}}.
  - Cho phép (và tăng {{curr}}) khi {{estimate < limit}}. So sánh dùng {{<}} trên giá trị double.
  - {{retryAfterMillis}}: nếu {{estimate < limit}} trả 0. Ngược lại, tìm thời gian chờ tối thiểu {{d >= 0}} (mili-giây) sao cho tại {{t = nowMillis + d}}, ước lượng < {{limit}}; nếu phải sang ô mới thì tính theo trạng thái ô tại {{t}}. Kết quả làm tròn lên ({{ceil}}). Không ghi nhận request.
  - Khi chuyển sang ô mới, ô "hiện tại" cũ trở thành ô "trước"; nếu nhảy qua hơn 1 ô thì ô trước coi như 0.

2) {{class TokenBucket}}
- Constructor: {{TokenBucket(double capacity, double refillPerSecond)}} với {{capacity > 0}}, {{refillPerSecond > 0}}. Bắt đầu **đầy** ({{capacity}} token) tại thời điểm lần gọi đầu tiên.
- {{boolean tryAcquire(long nowMillis)}}: nạp bù token theo thời gian trôi (không vượt {{capacity}}), cập nhật mốc thời gian, rồi nếu có >= 1 token thì trừ 1 và trả {{true}}, ngược lại {{false}}.
- {{long retryAfterMillis(long nowMillis)}}: nếu đủ >= 1 token sau khi nạp bù (tính trên trạng thái giả định, **không** làm thay đổi state) thì 0; ngược lại trả thời gian chờ (làm tròn lên) để có đủ 1 token.

Cả hai class phải hoạt động đúng khi {{nowMillis}} đứng yên (nhiều request cùng một mốc) và khi nhảy xa về phía trước.`,
      starter: `class SlidingWindowCounter {
    private final int limit;
    private final long windowMillis;
    // TODO: them cac truong can thiet (prevCount, currCount, currWindowIndex)

    SlidingWindowCounter(int limit, long windowMillis) {
        this.limit = limit;
        this.windowMillis = windowMillis;
        throw new UnsupportedOperationException("TODO");
    }

    boolean tryAcquire(long nowMillis) {
        throw new UnsupportedOperationException("TODO");
    }

    long retryAfterMillis(long nowMillis) {
        throw new UnsupportedOperationException("TODO");
    }
}

class TokenBucket {
    private final double capacity;
    private final double refillPerSecond;
    // TODO: them cac truong can thiet (tokens, lastMillis, da khoi tao)

    TokenBucket(double capacity, double refillPerSecond) {
        this.capacity = capacity;
        this.refillPerSecond = refillPerSecond;
        throw new UnsupportedOperationException("TODO");
    }

    boolean tryAcquire(long nowMillis) {
        throw new UnsupportedOperationException("TODO");
    }

    long retryAfterMillis(long nowMillis) {
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
    static void inRange(long lo, long hi, long v) {
        if (v < lo || v > hi) throw new AssertionError("expected in [" + lo + "," + hi + "] got " + v);
    }
    public static void main(String[] args) {
        check("sliding: duoi han muc va vuot han muc trong cung cua so", () -> {
            SlidingWindowCounter sw = new SlidingWindowCounter(3, 1000);
            eq(true, sw.tryAcquire(0));
            eq(true, sw.tryAcquire(100));
            eq(true, sw.tryAcquire(200));
            eq(false, sw.tryAcquire(300));
            eq(false, sw.tryAcquire(300));
        });
        check("sliding: boundary burst bi chan boi cua so truoc", () -> {
            SlidingWindowCounter sw = new SlidingWindowCounter(100, 1000);
            for (int i = 0; i < 100; i++) eq(true, sw.tryAcquire(990));
            eq(true, sw.tryAcquire(1006));
            eq(false, sw.tryAcquire(1006));
        });
        check("sliding: cua so truoc troi dan va reset khi sang xa", () -> {
            SlidingWindowCounter sw = new SlidingWindowCounter(10, 1000);
            for (int i = 0; i < 10; i++) sw.tryAcquire(0);
            eq(false, sw.tryAcquire(0));
            // tat ca req nam o cua so hien tai (prev=0, curr=10) nen phai sang qua ranh gioi
            // tai 1001ms: prev tro thanh 10, weight gan 0 -> estimate ~9.99 < 10
            inRange(1001, 1100, sw.retryAfterMillis(0));
            // van trong cua so 0: prev=0, curr=10 -> bi chan
            eq(false, sw.tryAcquire(500));
            SlidingWindowCounter sw2 = new SlidingWindowCounter(2, 1000);
            sw2.tryAcquire(0); sw2.tryAcquire(0);
            eq(false, sw2.tryAcquire(0));
            // sang cua so ke tiep (adjacent): prev van dem day du tai ranh gioi -> co the bi chan
            eq(false, sw2.tryAcquire(1000));
            // nhay xa hon 1 cua so: du lieu cu duoc bo, duoc phep lai
            eq(true, sw2.tryAcquire(2500));
        });
        check("token: day luc dau, burst hop le toi capacity roi can", () -> {
            TokenBucket tb = new TokenBucket(5, 1.0);
            eq(true, tb.tryAcquire(0));
            eq(true, tb.tryAcquire(0));
            eq(true, tb.tryAcquire(0));
            eq(true, tb.tryAcquire(0));
            eq(true, tb.tryAcquire(0));
            eq(false, tb.tryAcquire(0));
            inRange(900, 1100, tb.retryAfterMillis(0));
            eq(true, tb.tryAcquire(1000));
        });
        check("token: nap bu khong vuot capacity, retryAfter chinh xac", () -> {
            TokenBucket tb = new TokenBucket(3, 2.0);
            eq(true, tb.tryAcquire(0)); eq(true, tb.tryAcquire(0)); eq(true, tb.tryAcquire(0));
            eq(false, tb.tryAcquire(0));
            eq(true, tb.tryAcquire(10000)); eq(true, tb.tryAcquire(10000)); eq(true, tb.tryAcquire(10000));
            eq(false, tb.tryAcquire(10000));
            inRange(450, 550, tb.retryAfterMillis(10000));
        });
        check("token: retryAfterMillis khong lam thay doi state", () -> {
            TokenBucket tb = new TokenBucket(2, 1.0);
            eq(true, tb.tryAcquire(0)); eq(true, tb.tryAcquire(0));
            eq(false, tb.tryAcquire(0));
            long r1 = tb.retryAfterMillis(0);
            long r2 = tb.retryAfterMillis(0);
            eq(r1, r2);
            eq(false, tb.tryAcquire(0));
            eq(true, tb.tryAcquire(1000));
        });
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
      reference: `class SlidingWindowCounter {
    private final int limit;
    private final long windowMillis;
    private long currWindowIndex = -1;
    private long prevCount = 0;
    private long currCount = 0;

    SlidingWindowCounter(int limit, long windowMillis) {
        this.limit = limit;
        this.windowMillis = windowMillis;
    }

    private void rotate(long nowMillis) {
        long idx = Math.floorDiv(nowMillis, windowMillis);
        if (idx == currWindowIndex) return;
        if (idx == currWindowIndex + 1) {
            prevCount = currCount;
        } else {
            prevCount = 0;
        }
        currCount = 0;
        currWindowIndex = idx;
    }

    private double estimate(long nowMillis) {
        rotate(nowMillis);
        long elapsed = nowMillis - currWindowIndex * windowMillis;
        double weight = (windowMillis - elapsed) / (double) windowMillis;
        return prevCount * weight + currCount;
    }

    boolean tryAcquire(long nowMillis) {
        double est = estimate(nowMillis);
        if (est < limit) {
            currCount++;
            return true;
        }
        return false;
    }

    long retryAfterMillis(long nowMillis) {
        if (estimate(nowMillis) < limit) return 0;
        for (long d = 1; d <= windowMillis * 2; d++) {
            if (estimateAt(nowMillis + d) < limit) return d;
        }
        return windowMillis * 2;
    }

    private double estimateAt(long t) {
        long idx = Math.floorDiv(t, windowMillis);
        long p, c;
        if (idx == currWindowIndex) { p = prevCount; c = currCount; }
        else if (idx == currWindowIndex + 1) { p = currCount; c = 0; }
        else { p = 0; c = 0; }
        long elapsed = t - idx * windowMillis;
        double weight = (windowMillis - elapsed) / (double) windowMillis;
        return p * weight + c;
    }
}

class TokenBucket {
    private final double capacity;
    private final double refillPerSecond;
    private double tokens;
    private long lastMillis;
    private boolean initialized = false;

    TokenBucket(double capacity, double refillPerSecond) {
        this.capacity = capacity;
        this.refillPerSecond = refillPerSecond;
        this.tokens = capacity;
    }

    private void init(long nowMillis) {
        if (!initialized) { lastMillis = nowMillis; initialized = true; }
    }

    private double refilled(long nowMillis) {
        init(nowMillis);
        long delta = nowMillis - lastMillis;
        if (delta <= 0) return tokens;
        double t = tokens + (delta / 1000.0) * refillPerSecond;
        return t > capacity ? capacity : t;
    }

    boolean tryAcquire(long nowMillis) {
        double t = refilled(nowMillis);
        lastMillis = nowMillis;
        if (t >= 1.0) { tokens = t - 1.0; return true; }
        tokens = t;
        return false;
    }

    long retryAfterMillis(long nowMillis) {
        double t = refilled(nowMillis);
        if (t >= 1.0) return 0;
        double missing = 1.0 - t;
        double seconds = missing / refillPerSecond;
        return (long) Math.ceil(seconds * 1000.0);
    }
}`,
      hints: [
        'Sliding window: dùng {{Math.floorDiv(nowMillis, windowMillis)}} để lấy chỉ số ô. Khi {{idx}} nhảy quá 1 ô, đặt {{prevCount = 0}} vì ô liền trước không có dữ liệu.',
        'Token bucket: tách hàm "nạp bù trả về số token giả định" dùng chung cho cả {{tryAcquire}} và {{retryAfterMillis}}; chỉ {{tryAcquire}} mới ghi {{lastMillis}} và {{tokens}}. Khởi tạo {{lastMillis}} ở lần gọi đầu tiên để bucket bắt đầu đầy đúng tại mốc đó.',
        'Boundary burst: tại elapsed=6ms, window=1000ms, prev=100, curr=0, limit=100 thì estimate = 99.4, request đầu được chấp nhận nhưng request thứ hai (curr thành 1) phải bị chặn.',
      ],
      explain: `### Sliding window counter
Điểm mấu chốt là {{rotate/estimate}}: khi sang ô kế tiếp thì đẩy {{currCount}} xuống {{prevCount}}; nếu nhảy xa hơn (im lặng lâu) thì {{prevCount}} phải về 0. Công thức {{prev * (windowMillis - elapsed) / windowMillis + curr}} là nội suy tuyến tính: ô trước càng xa (elapsed lớn, weight nhỏ) thì càng ít ảnh hưởng.

### Token bucket
Tách {{refilled(nowMillis)}} (tính thuần) giúp {{retryAfterMillis}} không làm bẩn trạng thái - lỗi hay gặp là hàm "xem trước" lại cập nhật {{lastMillis}} khiến {{tryAcquire}} sau tính sai. Giới hạn bởi {{capacity}} là bắt buộc: không có nó, sau thời gian im lặng {{tokens}} tăng vô hạn và một burst khổng lồ sẽ lọt qua.

### Vì sao dùng {{nowMillis}} giả
Test phải xác định (deterministic): cùng đầu vào cho cùng kết quả. Truyền đồng hồ giả cho phép dựng chính xác tình huống boundary (990ms rồi 1006ms). Hệ thống thật dùng thời gian thực/Redis và phải chấp nhận lệch đồng hồ nhỏ.`,
    },
  ],
  check: [
    {
      q: 'Vì sao fixed window (100 request/phút) vẫn có thể cho qua 200 request trong khoảng 2 giây?',
      options: [
        'Vì bộ đếm bị tràn số nguyên ở ranh giới phút',
        'Vì 100 request dồn cuối ô trước và 100 request dồn đầu ô sau đều hợp lệ trong từng ô riêng lẻ (boundary burst)',
        'Vì fixed window không bao giờ reset bộ đếm',
        'Vì client có thể gửi song song nhiều kết nối',
      ],
      answer: 1,
      explain: 'Fixed window reset bộ đếm theo từng ô cố định độc lập. 100 request hợp lệ lúc 00:59 (ô 1) và 100 request hợp lệ lúc 01:00 (ô 2) cộng lại thành 200 request trong ~2 giây quanh ranh giới. Sliding window counter khắc phục bằng cách nhân tỉ lệ ô trước.',
    },
    {
      q: 'Trong sliding window counter, {{estimate = prevCount * weight + currCount}} đang giả định điều gì?',
      options: [
        'Mọi request của ô hiện tại đều đến ở cuối ô',
        'Request của ô trước phân bố đều trong ô đó (nên phần còn chồng lên cửa sổ trượt tỉ lệ với weight)',
        'Mỗi client chỉ gửi đúng 1 request mỗi ô',
        'Đồng hồ các server luôn khớp tuyệt đối',
      ],
      answer: 1,
      explain: 'Công thức ngầm giả định request ô trước rải đều, nên chỉ là xấp xỉ (sai số nhỏ), đổi lại chi phí cực thấp: chỉ 2 bộ đếm.',
    },
    {
      q: 'Ưu điểm nổi bật của token bucket so với sliding window counter là gì?',
      options: [
        'Không bao giờ cần lưu trạng thái',
        'Cho phép burst tự nhiên tới capacity (quota "để dành") và tính retryAfter chính xác theo tốc độ nạp',
        'Luôn chính xác tuyệt đối mà không cần thao tác nguyên tử khi phân tán',
        'Không thể bị vượt hạn mức trong mọi trường hợp',
      ],
      answer: 1,
      explain: 'Token bucket giữ lại token chưa dùng (tối đa capacity) nên chấp nhận burst hợp lệ, và retryAfter = token thiếu / tốc độ nạp là chính xác. Khi phân tán nó vẫn cần cập nhật nguyên tử (Lua script).',
    },
    {
      q: 'Khi triển khai rate limiter cho ứng dụng chạy 6 instance, vì sao bộ đếm trong biến JVM là sai?',
      options: [
        'Vì JVM không hỗ trợ số nguyên đủ lớn',
        'Vì mỗi instance giữ bộ đếm riêng nên hạn mức thực tế nhân lên và còn phụ thuộc cách load balancer phân phối',
        'Vì biến JVM không thread-safe',
        'Vì chỉ gateway mới đọc được HTTP header',
      ],
      answer: 1,
      explain: 'Trạng thái giới hạn tốc độ phải dùng chung (Redis/gateway). Bộ đếm cục bộ từng instance làm vỡ hạn mức tổng; thao tác cập nhật còn phải nguyên tử để tránh race condition.',
    },
  ],
  related: ['api-014', 'api-036', 'api-038'],
  tags: ['rate limiting', 'sliding window', 'token bucket', 'Redis', 'distributed', '429', 'Retry-After'],
},
{
  id: 'lesson-api-009',
  track: 'api',
  order: 9,
  title: 'ETag + If-Match: conditional GET/PUT và chặn lost update (412/428)',
  level: 'senior',
  minutes: 45,
  goals: [
    'Giải thích được ETag (strong/weak), If-None-Match cho cache 304 và If-Match cho optimistic concurrency 412',
    'Phân biệt 412 Precondition Failed, 428 Precondition Required, 409 Conflict và 404 Not Found trong luồng cập nhật',
    'Mô tả được cơ chế thật (Spring ResponseEntity.eTag/WebRequest.checkNotModified, JPA @Version, header ETag) và điểm đơn giản hoá',
    'Cài ResourceStore xử lý GET/PUT có điều kiện, đảm bảo lost update bị chặn bằng kiểm tra version nguyên tử theo ngữ nghĩa',
  ],
  body: `### Tóm tắt
**ETag** (entity tag) là "dấu vân tay phiên bản" của một tài nguyên HTTP. Kết hợp với header điều kiện, nó giải quyết hai bài toán: (1) {{If-None-Match}} cho phép client dùng lại bản cache và nhận **304 Not Modified** (tiết kiệm băng thông); (2) {{If-Match}} cho phép server từ chối ghi đè khi dữ liệu đã bị người khác sửa, trả **412 Precondition Failed** - đây là **optimistic concurrency control** (điều khiển đồng thời lạc quan: cứ cho sửa, nhưng kiểm tra phiên bản lúc ghi). Bài này giải thích cơ chế thật rồi cho bạn tự mô phỏng một {{ResourceStore}} thuần JDK.

### Thuật ngữ (giải thích lần đầu)
- **Tài nguyên (resource)**: thứ được định danh bởi URL, ví dụ {{/accounts/42}} là tài khoản 42.
- **ETag (Entity Tag)**: chuỗi do server sinh ra, gắn với **nội dung/phiên bản** hiện tại của tài nguyên. Strong ETag: {{"v5"}} (khớp byte-for-byte). Weak ETag: {{W/"v5"}} (tương đương về ngữ nghĩa). ETag phải nằm trong dấu nháy kép theo chuẩn HTTP.
- **Conditional request (request có điều kiện)**: request kèm header "chỉ thực hiện nếu điều kiện về phiên bản đúng", ví dụ {{If-Match: "v5"}}.
- **Lost update (mất cập nhật)**: A đọc bản 5, B đọc bản 5, A ghi bản 6, B ghi đè lên bản 6 bằng dữ liệu tính từ bản 5 → thay đổi của A biến mất. Giống hai người cùng sửa một file rồi người lưu sau đè người lưu trước.
- **Optimistic concurrency (đồng thời lạc quan)**: giả định xung đột hiếm, không khoá khi đọc; chỉ kiểm tra phiên bản khi ghi. Ngược lại là pessimistic (khoá từ lúc đọc).
- **412 Precondition Failed**: điều kiện tiên quyết ({{If-Match}}/{{If-None-Match}} với ngữ nghĩa ghi) không thoả.
- **428 Precondition Required**: server yêu cầu client phải gửi điều kiện (ví dụ bắt buộc {{If-Match}}) nhưng client không gửi.
- **409 Conflict**: xung đột **nghiệp vụ/trạng thái** (trùng mã, đơn đã huỷ không cho sửa) - khác 412 (xung đột **phiên bản**).

### 1) Cơ chế thật: ETag sinh ra và dùng thế nào
**Sinh ETag:** thường là số phiên bản tăng đơn điệu ({{"v7"}}, hoặc giá trị cột {{@Version}}), hoặc hash ổn định của nội dung. **Không** dùng timestamp độ chính xác giây (hai lần sửa trong cùng giây → cùng ETag → mất cập nhật) và **không** dùng {{hashCode()}}/thứ tự field ngẫu nhiên.

**GET có điều kiện (cache):** client gửi {{If-None-Match: "v7"}}. Server so khớp với phiên bản hiện tại: giống → **304 Not Modified**, không có body; khác → **200 OK** kèm body mới và {{ETag}} mới.

**PUT/PATCH có điều kiện (chống lost update):** client gửi {{If-Match: "v7"}}. Server chỉ ghi nếu phiên bản hiện tại đúng là "v7", rồi tăng phiên bản và trả {{ETag}} mới. Nếu đã thành "v8" → **412 Precondition Failed** (kèm {{ETag}} hiện tại). Nếu client quên gửi {{If-Match}} trên endpoint bắt buộc → **428 Precondition Required**.

~~~seq
title: Chống lost update bằng ETag + If-Match
actors: Client A | Client B | API Server | DB
Client A -> API Server: GET /accounts/42
API Server -> DB: doc account 42 (version 5)
API Server --> Client A: 200 + ETag: "v5" + body
Client B -> API Server: GET /accounts/42
API Server --> Client B: 200 + ETag: "v5" + body
Client A -> API Server: PUT /accounts/42 + If-Match: "v5"
API Server -> DB: UPDATE ... WHERE id=42 AND version=5
API Server --> Client A: 200 + ETag: "v6"
Client B -> API Server: PUT /accounts/42 + If-Match: "v5"
API Server -> DB: UPDATE ... WHERE id=42 AND version=5 (0 row)
API Server --> Client B: 412 Precondition Failed + ETag: "v6"
note Client B: GET lai, merge thay doi, PUT voi If-Match: "v6"
~~~

### 2) Tên class/cấu hình thật (Java/Spring) và cách chúng hoạt động
- **JPA {{@Version}}** ({{jakarta.persistence.Version}}): đánh dấu cột phiên bản (thường {{long}} hoặc {{Integer}}). Hibernate tự thêm {{WHERE version = ?}} vào câu UPDATE và tăng version; nếu số dòng ảnh hưởng = 0 thì ném {{OptimisticLockException}}. Đây là chốt chặn ở tầng DB - nguyên tử giữa nhiều instance.
- **{{ResponseEntity.eTag(String)}}** (Spring Web): gắn header {{ETag}} vào response. Ví dụ {{ResponseEntity.ok().eTag("\"" + version + "\"").body(dto)}} (tự thêm dấu nháy kép).
- **{{WebRequest.checkNotModified(String etag)}}**: tiện ích so khớp {{If-None-Match}}; trả {{true}} nếu nên trả 304 (Spring tự xử lý response).
- **{{ShallowEtagHeaderFilter}}** (Spring): tự tính ETag bằng mã băm (hash) của response body và tự trả 304 cho GET. Nó **chỉ tiết kiệm băng thông** (server vẫn chạy controller và serialize đầy đủ) và **không** xử lý {{If-Match}} cho PUT/PATCH để chống lost update - nên với optimistic concurrency khi ghi, phải dùng ETag gắn với version nghiệp vụ/DB.
- **So sánh strong vs weak:** {{If-Match}} dùng **so sánh mạnh** theo RFC 9110; ETag yếu {{W/"5"}} không khớp strong comparison, nên đừng dùng weak ETag cho {{If-Match}}.

### 3) Phân biệt các mã lỗi hay nhầm
| Tình huống | Mã | Lý do |
|---|---|---|
| GET + {{If-None-Match}} khớp phiên bản hiện tại | 304 | Dùng lại cache, không body |
| PUT/PATCH + {{If-Match}} **không** khớp phiên bản hiện tại | 412 | Version lệch, client phải GET lại và merge/retry |
| PUT/PATCH tới endpoint bắt buộc điều kiện nhưng **thiếu** {{If-Match}} | 428 | Server yêu cầu precondition, client bổ sung rồi gọi lại |
| Tài nguyên không tồn tại | 404 | Không có gì để so khớp phiên bản |
| Xung đột nghiệp vụ (đơn đã {{PAID}} không cho huỷ), version vẫn khớp | 409 | Không phải lỗi phiên bản; là quy tắc trạng thái |

### 4) Bản mô phỏng đơn giản hoá ở đâu
Bài tập cài {{ResourceStore}} thuần JDK (lưu trong {{Map}}), không HTTP framework, không DB, không JSON.
- **ETag = version số dạng chuỗi** (ví dụ {{"v1"}}, {{"v2"}}) tăng đơn điệu mỗi lần PUT thành công. Hệ thống thật có thể dùng giá trị {{@Version}} của JPA hoặc hash nội dung.
- **"Nguyên tử" ở mức ngữ nghĩa trong một tiến trình:** logic phải là "kiểm tra version và ghi dựa trên cùng trạng thái hiện tại" (đọc version hiện tại rồi mới quyết định). Hệ thống thật chốt bằng {{WHERE version=?}} ở DB để nguyên tử giữa nhiều instance.
- **Chỉ mô phỏng GET/PUT và các mã 200/304/404/412/428**. Hệ thống thật còn 204, 409 nghiệp vụ, {{If-None-Match: *}}, Vary, cache-control...

### Lỗi hay gặp
- **Bỏ qua {{If-Match}} và luôn ghi đè:** lost update quay lại.
- **Dùng weak ETag cho {{If-Match}}:** strong comparison không khớp → client luôn nhận 412.
- **Sinh ETag từ {{hashCode()}} hoặc timestamp giây:** không ổn định/không đủ độ phân giải.
- **Không trả {{ETag}} sau PUT:** client không có version mới cho lần sửa tiếp theo.
- **Nhầm 412 với 409:** 412 = lệch phiên bản (hãy GET lại), 409 = vi phạm quy tắc nghiệp vụ.
- **So sánh version bằng "đọc rồi if trong Java" trên nhiều instance:** race condition; phải chốt ở DB.

### Liên hệ phỏng vấn
Câu kinh điển: "Hai người cùng sửa hồ sơ khách hàng, làm sao tránh mất dữ liệu?" Trả lời: optimistic concurrency bằng version/ETag. GET trả {{ETag}}; client PUT kèm {{If-Match}}; server từ chối 412 nếu lệch, client GET lại rồi merge. Tầng DB dùng {{@Version}} (JPA) hoặc {{UPDATE ... WHERE id=? AND version=?}} để nguyên tử. Phân biệt rõ 412 (version) với 409 (nghiệp vụ) và 428 (thiếu precondition).

> Senior tip: Với dữ liệu nhạy cảm (số dư, hạn mức), coi **thiếu {{If-Match}} là lỗi** (428) thay vì "cho qua cho tiện". Và luôn trả kèm {{ETag}} hiện tại trong response 412/428 để client không phải đoán mình đang lệch phiên bản nào.`,
  exercises: [
    {
      title: 'ResourceStore: GET/PUT có điều kiện với ETag, chặn lost update',
      prompt: `Cài {{class ResourceStore}} quản lý tài nguyên dạng key-value (key là id chuỗi, value là nội dung chuỗi) kèm **version tăng đơn điệu** cho từng key. Không dùng HTTP framework, không DB, không I/O.

Các loại hỗ trợ (đã khai báo sẵn, dùng lại):
- {{record Resource(String id, String body, String etag)}} — {{etag}} là chuỗi dạng {{"v" + version}} (ví dụ {{"v1"}}).
- {{record StoreResponse(int status, Resource resource)}} — {{resource}} có thể {{null}} với 304/404/412/428.

Yêu cầu method:

1) {{StoreResponse get(String id, String ifNoneMatch)}}
- Nếu {{id}} không tồn tại: trả {{(404, null)}}.
- Nếu {{ifNoneMatch}} khác {{null}} và **bằng đúng** {{etag}} hiện tại: trả {{(304, null)}}.
- Ngược lại: trả {{(200, Resource(id, body, etag))}}.

2) {{StoreResponse put(String id, String body, String ifMatch)}}
- Nếu {{id}} không tồn tại: trả {{(404, null)}} (bài này không xử lý tạo mới).
- Nếu {{ifMatch}} là {{null}}: trả {{(428, Resource(id, bodyHienTai, etagHienTai))}}.
- Nếu {{ifMatch}} **không bằng** {{etag}} hiện tại: trả {{(412, Resource(id, bodyHienTai, etagHienTai))}}.
- Nếu khớp: cập nhật {{body}}, tăng version thêm 1, trả {{(200, Resource(id, bodyMoi, etagMoi))}}.

3) {{void seed(String id, String body)}} — tạo tài nguyên mới với version 1 (etag {{"v1"}}). Nếu id đã tồn tại, đặt lại về v1.

So khớp ETag là so khớp chuỗi **bằng đúng** (strong). Không dùng thời gian thực, không ngủ.`,
      starter: `record Resource(String id, String body, String etag) {}
record StoreResponse(int status, Resource resource) {}

class ResourceStore {
    // TODO: luu trang thai theo id (body + version)

    void seed(String id, String body) {
        throw new UnsupportedOperationException("TODO");
    }

    StoreResponse get(String id, String ifNoneMatch) {
        throw new UnsupportedOperationException("TODO");
    }

    StoreResponse put(String id, String body, String ifMatch) {
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
        check("get tra 200 kem etag, va 304 khi If-None-Match khop", () -> {
            ResourceStore s = new ResourceStore();
            s.seed("acc1", "balance=100");
            StoreResponse r1 = s.get("acc1", null);
            eq(200, r1.status());
            eq("v1", r1.resource().etag());
            eq("balance=100", r1.resource().body());
            StoreResponse r2 = s.get("acc1", "v1");
            eq(304, r2.status());
            eq(null, r2.resource());
            StoreResponse r3 = s.get("acc1", "v0");
            eq(200, r3.status());
            eq("v1", r3.resource().etag());
        });
        check("get/put tren id khong ton tai tra 404", () -> {
            ResourceStore s = new ResourceStore();
            eq(404, s.get("none", null).status());
            eq(404, s.put("none", "x", "v1").status());
        });
        check("put thieu If-Match tra 428 va khong doi du lieu", () -> {
            ResourceStore s = new ResourceStore();
            s.seed("acc2", "A");
            StoreResponse r = s.put("acc2", "B", null);
            eq(428, r.status());
            eq("v1", r.resource().etag());
            eq("A", r.resource().body());
            eq("A", s.get("acc2", null).resource().body());
            eq("v1", s.get("acc2", null).resource().etag());
        });
        check("put voi If-Match khop thi cap nhat va tang version", () -> {
            ResourceStore s = new ResourceStore();
            s.seed("acc3", "A");
            StoreResponse r = s.put("acc3", "B", "v1");
            eq(200, r.status());
            eq("v2", r.resource().etag());
            eq("B", r.resource().body());
            StoreResponse r2 = s.put("acc3", "C", "v2");
            eq(200, r2.status());
            eq("v3", r2.resource().etag());
        });
        check("lost update bi chan: put voi etag cu tra 412, du lieu giu nguyen", () -> {
            ResourceStore s = new ResourceStore();
            s.seed("acc4", "balance=100");
            eq("v1", s.get("acc4", null).resource().etag());
            eq("v1", s.get("acc4", null).resource().etag());
            StoreResponse a = s.put("acc4", "balance=80", "v1");
            eq(200, a.status());
            eq("v2", a.resource().etag());
            StoreResponse b = s.put("acc4", "balance=70", "v1");
            eq(412, b.status());
            eq("v2", b.resource().etag());
            eq("balance=80", b.resource().body());
            eq("balance=80", s.get("acc4", null).resource().body());
            eq("v2", s.get("acc4", null).resource().etag());
        });
        check("sau 412, client doc lai va put voi etag moi thi thanh cong", () -> {
            ResourceStore s = new ResourceStore();
            s.seed("acc5", "v1data");
            eq(200, s.put("acc5", "v2data", "v1").status());
            eq(412, s.put("acc5", "stale", "v1").status());
            StoreResponse fresh = s.get("acc5", null);
            eq("v2", fresh.resource().etag());
            StoreResponse retry = s.put("acc5", "v3data", fresh.resource().etag());
            eq(200, retry.status());
            eq("v3", retry.resource().etag());
            eq("v3data", s.get("acc5", null).resource().body());
        });
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
      reference: `record Resource(String id, String body, String etag) {}
record StoreResponse(int status, Resource resource) {}

class ResourceStore {
    private static class Entry {
        String body;
        int version;
        Entry(String body, int version) { this.body = body; this.version = version; }
    }

    private final Map<String, Entry> data = new HashMap<>();

    private String etagOf(Entry e) { return "v" + e.version; }

    void seed(String id, String body) {
        data.put(id, new Entry(body, 1));
    }

    StoreResponse get(String id, String ifNoneMatch) {
        Entry e = data.get(id);
        if (e == null) return new StoreResponse(404, null);
        String etag = etagOf(e);
        if (ifNoneMatch != null && ifNoneMatch.equals(etag)) {
            return new StoreResponse(304, null);
        }
        return new StoreResponse(200, new Resource(id, e.body, etag));
    }

    StoreResponse put(String id, String body, String ifMatch) {
        Entry e = data.get(id);
        if (e == null) return new StoreResponse(404, null);
        String etag = etagOf(e);
        if (ifMatch == null) {
            return new StoreResponse(428, new Resource(id, e.body, etag));
        }
        if (!ifMatch.equals(etag)) {
            return new StoreResponse(412, new Resource(id, e.body, etag));
        }
        e.version += 1;
        e.body = body;
        String newEtag = etagOf(e);
        return new StoreResponse(200, new Resource(id, e.body, newEtag));
    }
}`,
      hints: [
        'Lưu mỗi tài nguyên là (body, version). {{etag}} luôn dẫn xuất từ version ({{"v" + version}}). Tăng version chỉ khi PUT thành công với {{If-Match}} khớp.',
        'PUT: kiểm tra theo thứ tự - 404, thiếu {{If-Match}} (428, kèm trạng thái hiện tại), lệch etag (412, kèm trạng thái hiện tại), rồi mới cập nhật.',
        'GET với {{If-None-Match}} khớp trả 304 và {{resource}} là {{null}}. So khớp bằng {{String.equals}} (strong comparison).',
      ],
      explain: `### Kiểm tra và ghi là một quyết định liền mạch
Trong {{put}}, đọc {{etag}} hiện tại, so với {{ifMatch}}, rồi mới tăng version/đổi body. Nếu tách rời thì giữa hai bước luồng khác có thể chen vào (race condition). Bài tập đơn tiến trình nên tuần tự là đủ; hệ thống thật chốt bằng {{UPDATE ... WHERE id=? AND version=?}} (DB trả 0 row → 412) hoặc JPA {{@Version}}.

### Dẫn xuất ETag từ version
ETag là {{"v" + version}} nên luôn đồng bộ với trạng thái, không thể "quên cập nhật". Tương đương dùng cột {{@Version}} làm nguồn sự thật. Sinh ETag từ timestamp giây hoặc {{hashCode()}} là bẫy.

### 304 vs 412
304 (GET + {{If-None-Match}} khớp) = "bạn đang cầm bản mới nhất, đừng tải lại" (tối ưu băng thông). 412 (PUT + {{If-Match}} lệch) = "bạn đang sửa trên bản cũ, tôi từ chối ghi đè" (bảo toàn dữ liệu). Cùng cơ chế ETag nhưng hai mục tiêu khác nhau.`,
    },
  ],
  check: [
    {
      q: 'Client PUT kèm {{If-Match: "v5"}} nhưng tài nguyên hiện tại là {{v6}}. Server nên trả mã nào?',
      options: [
        '409 Conflict',
        '412 Precondition Failed',
        '304 Not Modified',
        '428 Precondition Required',
      ],
      answer: 1,
      explain: '412 Precondition Failed nghĩa là điều kiện phiên bản (If-Match) không thoả - client đang sửa trên bản cũ. 409 dành cho xung đột nghiệp vụ/trạng thái, 304 cho GET có điều kiện khớp, 428 khi thiếu precondition.',
    },
    {
      q: 'Vì sao {{ShallowEtagHeaderFilter}} của Spring KHÔNG thay thế được optimistic concurrency cho PUT/PATCH?',
      options: [
        'Vì filter này chỉ hỗ trợ JSON, không hỗ trợ XML',
        'Vì nó tính ETag từ hash body để tiết kiệm băng thông GET/304, nhưng không kiểm tra {{If-Match}} theo version nghiệp vụ khi ghi',
        'Vì filter này tự động khoá database',
        'Vì ETag do filter sinh ra luôn là weak ETag',
      ],
      answer: 1,
      explain: 'ShallowEtagHeaderFilter giúp cache GET (trả 304) nhưng không gắn với version nghiệp vụ/DB và không chặn ghi đè. Optimistic concurrency (điều khiển đồng thời lạc quan) khi ghi cần ETag gắn với {{@Version}}/phiên bản dữ liệu và kiểm tra {{If-Match}} (hoặc {{WHERE version=?}}).',
    },
    {
      q: 'Trường hợp nào nên trả **428 Precondition Required** thay vì chấp nhận cập nhật?',
      options: [
        'Khi {{If-Match}} khớp phiên bản hiện tại',
        'Khi endpoint bắt buộc điều kiện phiên bản để tránh lost update nhưng client không gửi {{If-Match}}',
        'Khi tài nguyên không tồn tại',
        'Khi body JSON sai cú pháp',
      ],
      answer: 1,
      explain: '428 báo client phải kèm precondition ({{If-Match}}) rồi gọi lại. Với dữ liệu nhạy cảm, chấp nhận PUT không điều kiện đồng nghĩa chấp nhận rủi ro ghi đè mất dữ liệu.',
    },
    {
      q: 'Cách sinh ETag nào **dễ gây lỗi** cho optimistic concurrency?',
      options: [
        'Dùng giá trị cột {{@Version}} tăng đơn điệu của JPA',
        'Dùng hash ổn định của nội dung tài nguyên',
        'Dùng {{updated_at}} chỉ chính xác tới giây, hoặc dùng {{hashCode()}}/thứ tự field không ổn định',
        'Dùng chuỗi phiên bản {{"v" + version}} tăng mỗi lần ghi thành công',
      ],
      answer: 2,
      explain: 'Timestamp độ phân giải giây có thể trùng khi hai lần sửa trong cùng giây (mất cập nhật), còn {{hashCode()}}/thứ tự không ổn định làm ETag đổi vô cớ hoặc không phản ánh phiên bản thật. Version tăng đơn điệu hoặc hash nội dung ổn định mới an toàn.',
    },
  ],
  related: ['api-014', 'api-037', 'api-038'],
  tags: ['ETag', 'If-Match', 'If-None-Match', 'optimistic concurrency', '412', '428', '304', 'lost update'],
}

);
