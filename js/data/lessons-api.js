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
}
);
