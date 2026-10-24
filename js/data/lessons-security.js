/* Bài học track "security". Schema & markup: AGENTS.md mục 12. */
(window.LESSONS = window.LESSONS || []).push(
{
  id: 'lesson-security-001',
  track: 'security',
  order: 1,
  title: 'Lưu mật khẩu an toàn: salt ngẫu nhiên, PBKDF2 và so sánh không rò rỉ thời gian',
  level: 'mid',
  minutes: 25,
  goals: [
    'Giải thích được vì sao chỉ hash bằng SHA-256 hoặc mã hoá hai chiều đều sai khi lưu mật khẩu, và salt giải quyết được gì',
    'Dùng được {{SecretKeyFactory}} với {{PBKDF2WithHmacSHA256}} để sinh key theo đúng định dạng lưu trữ',
    'So sánh hai hash bằng {{MessageDigest.isEqual}} thay vì {{equals}} và giải thích cái bẫy timing',
  ],
  body: `### Vì sao lưu SHA-256 của mật khẩu vẫn là sai
Hãy đặt mình vào tình huống hệ thống bị lộ cơ sở dữ liệu: kẻ tấn công có sẵn hàng tỷ hash và muốn khôi phục mật khẩu. SHA-256 (cũng như MD5, SHA-1) được thiết kế để **nhanh** — một GPU chuyên dụng có thể thử hàng chục tỷ mật khẩu mỗi giây. Trong khi đó một lần PBKDF2 với vài trăm nghìn vòng lặp mất hàng trăm mili-giây. Độ an toàn của hàm hash mật khẩu nằm ở **tốc độ tính** của nó, không phải ở độ dài chuỗi kết quả.

Thứ hai là **rainbow table**: attacker precompute bảng tra ngược cho hàng triệu mật khẩu phổ biến. Cùng một mật khẩu "123456" luôn cho cùng một hash, nên một bảng là đủ để tra toàn bộ người dùng có mật khẩu yếu.

Còn mã hoá hai chiều (AES) thì đi ngược mục tiêu: lưu mật khẩu nghĩa là dữ liệu lưu trữ **không thể khôi phục** được mật khẩu. Dùng AES là bạn phải quản lý một key; key bị lộ thì mọi mật khẩu lộ sạch, và người có key đọc lại được mật khẩu của người dùng (kể cả khi họ dùng lại mật khẩu ở dịch vụ khác). Mật khẩu là **điểm bí mật cần chịu đựng được mất mát**, không phải dữ liệu cần đọc lại.

### Salt: mỗi người một muối ngẫu nhiên
Salt là chuỗi ngẫu nhiên **riêng cho từng người dùng**, sinh bằng {{SecureRandom}} (không dùng {{Random}} — seed của nó đoán được), từ 16 byte trở lên, và **lưu cùng** hash. Salt không phải secret: lộ salt cũng không giúp gì nếu mật khẩu yếu.

Với salt riêng, "123456" của hai người cho hai hash khác nhau nên:
- bảng tra ngược chung vô hiệu — phải precompute cho từng salt;
- hai người dùng cùng mật khẩu không lộ ra qua việc so hash;
- attacker không thể attack hàng loạt mọi người dùng trên cùng một phép tính.

Salt **không** làm mật khẩu mạnh hơn; nó chỉ phá tiền tố tính toán. Việc chống brute force vẫn nằm ở việc làm mỗi lần thử **chậm**.

### PBKDF2: tăng giá của một lần thử
PBKDF2 (Password-Based Key Derivation Function 2, RFC 2898) lặp lại HMAC nhiều lần trên mật khẩu và salt, còn gọi là key stretching:

~~~java
// JDK 17 — chỉ dùng thư viện chuẩn, không cần Bouncy Castle
PBEKeySpec spec = new PBEKeySpec(password.toCharArray(), salt, ITERATIONS, KEY_BITS);
SecretKeyFactory kf = SecretKeyFactory.getInstance("PBKDF2WithHmacSHA256");
byte[] key = kf.generateSecret(spec).getEncoded();   // 32 byte với KEY_BITS = 256
spec.clearPassword();                                // không giữ mật khẩu trên heap
~~~

- {{ITERATIONS}} là "giá của một lần thử". Tăng gấp đôi thì cả bạn và attacker đều chậm gấp đôi, nhưng attacker thử song song trên hàng nghìn GPU còn bạn chỉ hash khi đăng nhập — nên chi phí nghiêng về phía bạn. Đó là lý do các tổ chức chuyển sang Argon2id (tốn bộ nhớ, khó chạy song song trên GPU) hoặc bcrypt.
- {{KEY_BITS}} = 256: output dài hơn **không** làm attacker chậm lại, vì chi phí nằm ở vòng lặp HMAC.
- {{PBEKeySpec}} nhận {{char[]}} chứ không {{String}}: mảng char xoá được bằng {{clearPassword()}}, còn String nằm trên heap cho tới khi GC thu hồi.

| Thuật toán | Ưu điểm | Nhược điểm |
|---|---|---|
| PBKDF2-HMAC-SHA256 | có sẵn trong JDK, là chuẩn RFC, dễ cấu hình | chống GPU kém hơn Argon2 |
| bcrypt | chống GPU khá, phổ biến | cần thư viện ngoài, chỉ dùng 72 byte đầu của mật khẩu |
| Argon2id | chống GPU/ASIC tốt nhất vì tốn RAM | cần Bouncy Castle hoặc Spring Security 6.1+ |

Spring Boot cung cấp {{Pbkdf2PasswordEncoder}} và {{BCryptPasswordEncoder}} — hãy dùng encoder của Spring thay vì tự viết, nhưng vẫn phải hiểu bên trong để set tham số đúng và để trả lời phỏng vấn.

### So sánh không rò rỉ thời gian
Sau khi tính hash mới từ mật khẩu người dùng, ta phải so với hash đã lưu. {{String.equals}} **dừng sớm** khi gặp ký tự khác: nếu hai chuỗi khác ngay byte đầu tiên, nó trả về false gần như tức thì. Kẻ tấn công đo thời gian phản hồi theo từng ký tự có thể suy ra vị trí khác biệt — kỹ thuật timing attack này đã thực sự phá được cơ chế xác thực của một số hệ thống và thư viện.

{{MessageDigest.isEqual(a, b)}} so sánh **đúng số byte dài nhất** mà không thoát sớm khi nội dung khác, nên thời gian gần như không phụ thuộc vào vị trí khác biệt:

~~~java
byte[] expected = HexFormat.of().parseHex(storedHash);
byte[] actual   = HexFormat.of().parseHex(hashOf(password, salt));
return MessageDigest.isEqual(expected, actual);   // KHÔNG dùng expected.equals(actual)
~~~

Lưu ý nhỏ: {{isEqual}} vẫn xử lý khác biệt về **độ dài** nhanh hơn, nhưng hash luôn có cùng độ dài nên attacker không có kênh tin nào để lợi.

### Định dạng lưu trữ và con đường nâng cấp
Một format phổ biến là {{pbkdf2$600000$saltHex$hashHex}}. Khi người dùng đăng nhập thành công, bạn đọc {{iterations}} trong chuỗi đã lưu và so với giá trị hiện tại: nếu cũ hơn thì **hash lại ngay và ghi đè**. Đó là cách nâng cấp chi phí hash cho toàn hệ thống mà không phải chờ người dùng đổi mật khẩu.

Parse định dạng phải **thất bại an toàn**: chuỗi hỏng thì {{verify}} trả về false chứ không ném exception — đừng biến lỗi 500 thành kênh dò thông tin cho attacker.

### Bẫy production
- **Hash trong luồng xử lý request**: 600.000 vòng PBKDF2 mất vài trăm mili-giây; làm ngay trong request thread là bạn tự làm chậm hoặc tự DDoS chính mình ở giờ cao điểm. Đẩy sang worker riêng ({{@Async}}, hàng đợi) hoặc chấp nhận latency đó chỉ trên endpoint đăng nhập.
- **Mật khẩu lọt vào log**: interceptor log body, exception in ra tham số, APM chụp form. Mật khẩu không bao giờ được đi vào log; mask ngay ở tầng logging.
- Dùng {{Random}} thay {{SecureRandom}} cho salt, hoặc dùng một salt chung cho cả hệ thống — đều phá vỡ mục đích của salt.
- Hash một lần rồi không bao giờ nâng cấp tham số: đến lúc bị lộ thì bạn bất lực vì chi phí thử quá thấp.

### Liên hệ phỏng vấn
Interviewer hay hỏi: "bcrypt hay Argon2, khi nào chọn cái nào?", "vì sao salt không cần bí mật?", "hash một lần mất bao lâu và anh xử lý thế nào ở production?", "tại sao phải so bằng constant-time?". Làm xong bài tập dưới đây — tự sinh salt bằng {{SecureRandom}}, gọi {{PBKDF2WithHmacSHA256}}, so bằng {{MessageDigest.isEqual}} — là bạn trả lời được cả bốn câu.`,
  exercises: [
    {
      title: 'Viết PasswordHasher: sinh salt, PBKDF2 và verify không rò rỉ thời gian',
      prompt: `Hoàn thiện {{PasswordHasher}} để lưu và kiểm tra mật khẩu đúng chuẩn:

- {{create(password)}}: sinh salt 16 byte bằng {{SecureRandom}}, tính hash bằng {{PBKDF2WithHmacSHA256}} với {{ITERATIONS}} vòng và {{KEY_BITS}} bit, trả về chuỗi {{pbkdf2$ITERATIONS$saltHex$hashHex}} (hex viết thường bằng {{HexFormat}}).
- {{hash(password, salt)}}: tính hash cho một salt cho trước; đây là hàm tất định (cùng input luôn cho cùng output).
- {{verify(password, stored)}}: tách chuỗi đã lưu, tính lại hash từ mật khẩu và salt, so sánh bằng {{MessageDigest.isEqual}}. Trả về **false** (không ném exception) khi chuỗi định dạng sai, hex không hợp lệ hoặc mật khẩu sai.

Chỉ dùng JDK 17, không thư viện ngoài.`,
      starter: `import javax.crypto.SecretKeyFactory;
import javax.crypto.spec.PBEKeySpec;
import java.security.GeneralSecurityException;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.HexFormat;

final class PasswordHasher {
    static final int ITERATIONS = 6000;
    static final int SALT_BYTES = 16;
    static final int KEY_BITS = 256;

    static String create(String password) {
        throw new UnsupportedOperationException("TODO");
    }

    static String hash(String password, byte[] salt) {
        throw new UnsupportedOperationException("TODO");
    }

    static boolean verify(String password, String stored) {
        throw new UnsupportedOperationException("TODO");
    }
}`,
      tests: `import java.nio.charset.StandardCharsets;

public class Main {
    static int passed = 0, total = 0;
    static void check(String name, Runnable r) {
        total++;
        try { r.run(); passed++; System.out.println("PASS " + name); }
        catch (Throwable t) { System.out.println("FAIL " + name + ": " + t); }
    }
    static void eq(Object expected, Object actual) {
        if (!Objects.equals(expected, actual)) throw new AssertionError("expected " + expected + " got " + actual);
    }
    static String[] parts(String stored) {
        int a = stored.indexOf('$');
        int b = a < 0 ? -1 : stored.indexOf('$', a + 1);
        int c = b < 0 ? -1 : stored.indexOf('$', b + 1);
        if (a < 0 || b < 0 || c < 0) throw new AssertionError("sai dinh dang: " + stored);
        return new String[] { stored.substring(0, a), stored.substring(a + 1, b), stored.substring(b + 1, c), stored.substring(c + 1) };
    }
    public static void main(String[] args) {
        check("create follows pbkdf2 iters salt hash format", () -> {
            String[] p = parts(PasswordHasher.create("S3cret!"));
            eq("pbkdf2", p[0]);
            eq(String.valueOf(PasswordHasher.ITERATIONS), p[1]);
            eq(32, p[2].length());
            eq(64, p[3].length());
            if (!p[2].matches("[0-9a-f]+") || !p[3].matches("[0-9a-f]+")) throw new AssertionError("hex phai viet thuong");
        });
        check("verify accepts the right password", () -> {
            String stored = PasswordHasher.create("correct horse battery staple");
            if (!PasswordHasher.verify("correct horse battery staple", stored)) throw new AssertionError("mat khau dung ma verify false");
        });
        check("verify rejects a wrong password of the same length", () -> {
            String stored = PasswordHasher.create("correct horse battery stapla");
            if (PasswordHasher.verify("correct horse battery staple", stored)) throw new AssertionError("mat khau sai ma verify true");
        });
        check("verify rejects a wrong password of another length", () -> {
            String stored = PasswordHasher.create("abc");
            if (PasswordHasher.verify("abcdef", stored)) throw new AssertionError("khac do dai ma verify true");
        });
        check("salt changes the hash and hash is deterministic", () -> {
            byte[] s1 = new byte[16];
            byte[] s2 = new byte[16];
            Arrays.fill(s1, (byte) 1);
            Arrays.fill(s2, (byte) 2);
            String h1 = PasswordHasher.hash("pw", s1);
            String h2 = PasswordHasher.hash("pw", s2);
            if (h1.equals(h2)) throw new AssertionError("khac salt phai khac hash");
            eq(64, h1.length());
            eq(h1, PasswordHasher.hash("pw", s1));
        });
        check("verify fails cleanly on malformed storage", () -> {
            if (PasswordHasher.verify("x", "khong-phai-dinh-dang")) throw new AssertionError("chuoi rac ma verify true");
            if (PasswordHasher.verify("x", "pbkdf2$6000$zz$yy")) throw new AssertionError("hex rac ma verify true");
            if (PasswordHasher.verify("x", "pbkdf2$6000$aa")) throw new AssertionError("thieu phan ma verify true");
            if (PasswordHasher.verify("x", null)) throw new AssertionError("null ma verify true");
        });
        check("tampered hash is rejected", () -> {
            String stored = PasswordHasher.create("pw123456");
            String[] p = parts(stored);
            char last = p[3].charAt(63);
            char other = last == '0' ? '1' : '0';
            String tampered = p[0] + "$" + p[1] + "$" + p[2] + "$" + p[3].substring(0, 63) + other;
            if (PasswordHasher.verify("pw123456", tampered)) throw new AssertionError("hash bi sua ma verify true");
        });
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
      reference: `import javax.crypto.SecretKeyFactory;
import javax.crypto.spec.PBEKeySpec;
import java.security.GeneralSecurityException;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.HexFormat;

final class PasswordHasher {
    static final int ITERATIONS = 6000;
    static final int SALT_BYTES = 16;
    static final int KEY_BITS = 256;

    static String create(String password) {
        byte[] salt = new byte[SALT_BYTES];
        new SecureRandom().nextBytes(salt);                      // muoi rieng cho moi user
        return "pbkdf2$" + ITERATIONS + "$" + HexFormat.of().formatHex(salt) + "$" + hash(password, salt);
    }

    static String hash(String password, byte[] salt) {
        PBEKeySpec spec = new PBEKeySpec(password.toCharArray(), salt, ITERATIONS, KEY_BITS);
        try {
            SecretKeyFactory kf = SecretKeyFactory.getInstance("PBKDF2WithHmacSHA256");
            return HexFormat.of().formatHex(kf.generateSecret(spec).getEncoded());
        } catch (GeneralSecurityException e) {
            throw new IllegalStateException("PBKDF2WithHmacSHA256 khong co trong JVM nay", e);
        } finally {
            spec.clearPassword();                                // xoa mat khoau khoi heap
        }
    }

    static boolean verify(String password, String stored) {
        if (stored == null) return false;
        int a = stored.indexOf('$');
        int b = a < 0 ? -1 : stored.indexOf('$', a + 1);
        int c = b < 0 ? -1 : stored.indexOf('$', b + 1);
        if (a < 0 || b < 0 || c < 0 || c == stored.length() - 1) return false;
        if (!"pbkdf2".equals(stored.substring(0, a))) return false;
        try {
            byte[] salt = HexFormat.of().parseHex(stored.substring(b + 1, c));
            byte[] expected = HexFormat.of().parseHex(stored.substring(c + 1));
            byte[] actual = HexFormat.of().parseHex(hash(password, salt));
            return MessageDigest.isEqual(expected, actual);
        } catch (IllegalArgumentException e) {
            return false;
        }
    }
}`,
      hints: [
        'Sinh salt bằng {{new SecureRandom().nextBytes(salt)}}, mã hoá hex bằng {{HexFormat.of().formatHex(...)}}; cắt chuỗi lưu bằng {{indexOf}} chứ đừng dùng {{split}} vì ký tự $ là ký tự regex.',
        '{{PBEKeySpec}} nhận {{char[]}} — gọi {{clearPassword()}} trong {{finally}} sau khi đã sinh key.',
        '{{MessageDigest.isEqual}} nhận {{byte[]}}: parse hash đã lưu và hash tính lại sang byte rồi mới so; mọi đường lỗi đều trả về false.',
      ],
      explain: `Bẫy lớn nhất là so bằng {{expected.equals(actual)}}: {{equals}} thoát sớm ở byte khác biệt đầu tiên nên timing channel vẫn còn — đúng nghĩa "so sánh constant-time" là so đủ số byte rồi mới trả kết quả.

Bẫy thứ hai là {{split("$")}}: {{split}} nhận regex mà {{$}} là ký tự neo "cuối chuỗi", nên chuỗi bị cắt sai hoàn toàn. Dùng {{indexOf}} như trên, hoặc escape ký tự $ trước khi truyền vào regex.

Bẫy thứ ba là parse hỏng ném exception: attacker gửi chuỗi rác và đọc được khác biệt giữa 500 và 401. {{verify}} phải bọc mọi lỗi phân tích cú pháp và trả false. Bài dùng {{ITERATIONS = 6000}} để test chạy trong vài chục mili-giây; production theo khuyến nghị hiện hành của OWASP cho PBKDF2-HMAC-SHA256 (hàng trăm nghìn vòng, khoảng 600.000 theo bảng 2023) và cân nhắc Argon2id nếu attacker có GPU.`,
    },
  ],
  check: [
    {
      q: 'Vì sao chỉ lưu {{SHA-256(password)}} là không đủ cho mật khẩu?',
      options: [
        'Vì SHA-256 output chỉ 32 byte, quá ngắn để chứa mật khẩu',
        'Vì SHA-256 quá nhanh với phần cứng chuyên dụng, và cùng mật khẩu luôn cho cùng một hash nên attacker thử được hàng tỷ lần mỗi giây',
        'Vì SHA-256 đã bị bẻ gãy hoàn toàn nên không dùng được nữa',
        'Vì SHA-256 không xử lý được ký tự Unicode trong mật khẩu',
      ],
      answer: 1,
      explain: `Điểm yếu của hash mật khẩu là **tốc độ**: GPU thử được hàng chục tỷ SHA-256 mỗi giây, còn PBKDF2 với hàng trăm nghìn vòng thì chậm hơn hàng triệu lần. Output 32 byte là đủ dài (không liên quan đến việc lưu mật khẩu) — thứ quan trọng là chi phí mỗi lần thử. SHA-256 chưa bị bẻ gãy về mặt toán học nhưng sai khi dùng cho mật khẩu; và nó xử lý mọi byte kể cả Unicode, nên phương án "Unicode" cũng sai.`,
    },
    {
      q: 'Salt đúng chuẩn được sinh và lưu thế nào?',
      options: [
        'Sinh bằng {{Math.random}} một lần cho toàn hệ thống, giấu trong secret key',
        'Sinh bằng {{Random}} 16 byte cho mỗi người dùng, chỉ giữ ở RAM',
        'Sinh bằng {{SecureRandom}} ít nhất 16 byte cho mỗi người dùng và lưu cùng hash — không cần giữ bí mật',
        'Không cần salt nếu đã dùng HTTPS và đã hash mật khẩu',
      ],
      answer: 2,
      explain: `Salt phải **độc nhất cho mỗi người dùng** (để phá bảng tra ngược chung), sinh bằng {{SecureRandom}} (seed của {{Random}}/{{Math.random}} đoán được) và **lưu cùng** hash — bạn cần salt khi verify, nên nó không phải secret. Một salt chung cho cả hệ thống gần như không có tác dụng; salt không thay thế được HTTPS, và ngược lại HTTPS không thay thế được salt (bảo vệ dữ liệu khi đĩa bị đánh cắp).`,
    },
    {
      q: 'Hai hash khác nhau ở byte cuối; {{equals}} và {{MessageDigest.isEqual}} cho kết quả so sánh ra sao?',
      options: [
        '{{MessageDigest.isEqual}} so đủ số byte mà không thoát sớm, còn {{equals}} thoát ở byte khác biệt đầu tiên nên có thể rò rỉ vị trí khác biệt qua thời gian phản hồi',
        'Cả hai đều trả về false với độ phức tạp như nhau, không có khác biệt nào',
        '{{equals}} an toàn hơn vì JVM tối ưu hoá riêng cho String',
        '{{MessageDigest.isEqual}} tự hash lại hai chuỗi rồi mới so, nên chính xác hơn',
      ],
      answer: 0,
      explain: `Hai hàm đều trả false, nhưng **cách chúng tới false** khác nhau: {{equals}} dừng ngay khi gặp ký tự khác (thời gian phản hồi phụ thuộc vào vị trí khác biệt), còn {{MessageDigest.isEqual}} luôn đọc đủ số byte dài nhất trước khi trả kết quả. JVM không có "tối ưu an toàn" nào cho {{equals}}, và {{isEqual}} so sánh nguyên trạng hai mảng byte chứ không hash thêm.`,
    },
  ],
  related: ['security-005', 'security-009', 'security-001'],
  tags: ['password', 'PBKDF2', 'salt', 'timing attack'],
},
{
  id: 'lesson-security-002',
  track: 'security',
  order: 2,
  title: 'JWT tự ký và kiểm tra bằng HS256: chữ ký, exp và những cái bẫy của alg',
  level: 'senior',
  minutes: 30,
  goals: [
    'Mô tả được cấu trúc {{header.payload.signature}} và nói đúng đoạn nào được phủ bởi chữ ký',
    'Tự ký và verify token bằng {{javax.crypto.Mac}} với {{HmacSHA256}} và {{Base64}} URL-safe',
    'Chỉ ra được các bẫy production: không tin {{alg}} từ header, kiểm {{exp}}, và JWT không tự thu hồi được',
  ],
  body: `### Cấu trúc: header.payload.signature
JWT là ba chuỗi Base64URL nối bằng dấu chấm. Base64URL khác Base64 thường ở chỗ dùng {{-}} và {{_}} thay cho {{+}} và {{/}}, và **bỏ padding** {{=}}, để token nằm gọn trong URL, header HTTP hay cookie mà không phải escape. Base64URL **không phải mã hoá**: ai cũng decode và đọc được claim; toàn bộ bí mật nằm ở chữ ký.

~~~java
String headerB64 = Base64.getUrlEncoder().withoutPadding()
        .encodeToString(headerJson.getBytes(StandardCharsets.UTF_8));
String payloadB64 = Base64.getUrlEncoder().withoutPadding()
        .encodeToString(payloadJson.getBytes(StandardCharsets.UTF_8));
String signingInput = headerB64 + "." + payloadB64;   // đúng đoạn này được ký
String token = signingInput + "." + Base64.getUrlEncoder().withoutPadding().encodeToString(macBytes);
~~~

### Ký và verify bằng HMAC-SHA256
HS256 nghĩa là HMAC-SHA256 với **một secret dùng chung** cho cả bên ký và bên verify:

~~~java
Mac mac = Mac.getInstance("HmacSHA256");
mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
byte[] signature = mac.doFinal(signingInput.getBytes(StandardCharsets.UTF_8));
~~~

Bên verify tính lại HMAC trên đúng {{header.payload}} rồi so với chữ ký nhận được bằng {{MessageDigest.isEqual}}. Quy trình đầy đủ, đúng thứ tự:

1. Tách token thành đúng 3 phần với 2 dấu chấm; khác là rác, reject ngay.
2. Tính lại HMAC trên {{header.payload}} — **trước** khi tin bất kỳ claim nào.
3. So chữ ký bằng {{MessageDigest.isEqual}} (constant-time).
4. Decode payload, kiểm tra {{exp}}: chỉ chấp nhận khi {{now < exp}}.
5. Không chọn thuật toán theo header — thấy gì cũng verify bằng HS256.

### Bẫy production với JWT
- **{{alg=none}}**: token không có chữ ký; nếu thư viện verify "tin" header thì attacker gửi token rỗng chữ ký vẫn qua. Luôn từ chối {{none}}.
- **{{alg}} confusion**: attacker đổi header sang RS256 rồi để thư viện dùng **public key** làm HMAC secret — chữ ký do attacker tự ký được chấp nhận. Nguyên tắc: thuật toán do **bên verify quyết định**, không phải do token.
- **Secret yếu hoặc nằm trong repo**: HS256 an toàn bằng đúng secret đó. Đặt trong env hoặc Secrets Manager, xoay vòng định kỳ, độ dài từ 32 byte.
- **Không kiểm tra {{exp}}**, hoặc kiểm tra nhưng các service lệch giờ: cho phép skew vài chục giây và đồng bộ NTP cho mọi máy.
- **Đọc payload mà không verify**: lấy {{sub}}, {{role}} lung tung → trèo quyền ngay.
- **Tin rằng JWT giúp thu hồi**: token đã cấp sống tới {{exp}}. Muốn thu hồi ngay phải có danh sách thu hồi, refresh token rotation, hoặc chuyển sang opaque token tra tại server.

### HS256 hay RS256?
| Tiêu chí | HS256 (symmetric) | RS256 (asymmetric) |
|---|---|---|
| Key | một secret chung cho cả hai bên | private key ký, public key verify |
| Tốc độ | nhanh (chỉ HMAC) | chậm hơn một bậc |
| Phân phối | mọi nơi phải giữ secret — lộ một chỗ là hỏng hết | service verify chỉ cần public key |
| Phù hợp | service-to-service nội bộ, ít bên verify | nhiều bên verify, muốn tách quyền ký |

### Chống replay: timestamp nằm ngoài JWT
JWT có {{exp}} nhưng vẫn dùng lại được vô số lần trong cửa sổ hiệu lực. Với API ký theo request, chuẩn là đưa {{timestamp}} vào chuỗi ký và bên verify cho phép sai lệch tối đa {{tolerance}} (thường 300 giây); request vượt cửa sổ bị loại. Bài tập thứ hai bên dưới làm đúng việc đó.

### Liên hệ phỏng vấn
Interviewer hay hỏi: "em verify JWT theo những bước nào?", "vì sao không tin {{alg}} trong header?", "khách hàng yêu cầu logout tức thời thì làm thế nào với JWT?", "HS256 hay RS256, khi nào chọn cái nào?". Làm xong hai bài tập dưới đây — tự ký bằng {{javax.crypto.Mac}} và tự viết hàm verify có kiểm {{exp}} — là bạn trả lời được cả bốn câu bằng chính mã của mình.`,
  exercises: [
    {
      title: 'Tự viết Jwt: ký HS256, verify chữ ký và kiểm tra exp',
      prompt: `Hoàn thiện lớp {{Jwt}} — phiên bản tối giản của JWT ký bằng HS256, chỉ dùng JDK 17:

- {{sign(subject, secret, expiresAtSeconds)}}: header JSON cố định với {{alg}} = HS256 và {{typ}} = JWT; payload JSON gồm {{sub}} và {{exp}}. Trả về {{header.payload.signature}}.
- {{verify(token, secret, nowSeconds)}}: true đúng khi chữ ký khớp (tính lại HMAC-SHA256 trên đoạn {{header.payload}}, so bằng {{MessageDigest.isEqual}}) **và** {{nowSeconds < exp}}. Token rác, sai secret, hết hạn, chuỗi Base64 lỗi thì trả **false**, không ném exception.
- {{subject(token)}}: decode payload và trả về giá trị {{sub}} — tiện ích đọc claim, không kiểm tra chữ ký.

Bên verify luôn cố định HS256, không đọc {{alg}} từ token.`,
      starter: `import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.MessageDigest;
import java.util.Base64;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

final class Jwt {
    static String sign(String subject, String secret, long expiresAtSeconds) {
        throw new UnsupportedOperationException("TODO");
    }

    static boolean verify(String token, String secret, long nowSeconds) {
        throw new UnsupportedOperationException("TODO");
    }

    static String subject(String token) {
        throw new UnsupportedOperationException("TODO");
    }
}`,
      tests: `import java.nio.charset.StandardCharsets;

public class Main {
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
        check("token has three parts and header says HS256", () -> {
            String t = Jwt.sign("user-42", "top-secret", 2000);
            int p1 = t.indexOf('.');
            int p2 = t.indexOf('.', p1 + 1);
            if (p1 <= 0 || p2 <= p1 + 1) throw new AssertionError("phai co 3 phan: " + t);
            if (t.indexOf('.', p2 + 1) >= 0) throw new AssertionError("qua 2 dau cham");
            String header = new String(Base64.getUrlDecoder().decode(t.substring(0, p1)), StandardCharsets.UTF_8);
            if (!header.contains("HS256")) throw new AssertionError("header: " + header);
        });
        check("round trip keeps the subject", () -> {
            String t = Jwt.sign("user-42", "k", 5000);
            if (!Jwt.verify(t, "k", 4999)) throw new AssertionError("token hop le ma verify false");
            eq("user-42", Jwt.subject(t));
        });
        check("wrong secret is rejected", () -> {
            String t = Jwt.sign("u", "k1", 5000);
            if (Jwt.verify(t, "k2", 4000)) throw new AssertionError("sai secret ma verify true");
        });
        check("token expires exactly at exp", () -> {
            String t = Jwt.sign("u", "k", 1000);
            if (!Jwt.verify(t, "k", 999)) throw new AssertionError("con han ma verify false");
            if (Jwt.verify(t, "k", 1000)) throw new AssertionError("now bang exp phai het han");
            if (Jwt.verify(t, "k", 1001)) throw new AssertionError("het han ma verify true");
        });
        check("tampered payload breaks the signature", () -> {
            String t = Jwt.sign("alice", "k", 9000);
            int p1 = t.indexOf('.');
            String forged = t.substring(0, p1 + 1) + "A" + t.substring(p1 + 2);
            if (Jwt.verify(forged, "k", 8000)) throw new AssertionError("payload bi sua ma verify true");
        });
        check("malformed tokens are rejected", () -> {
            if (Jwt.verify(null, "k", 0)) throw new AssertionError("null phai false");
            if (Jwt.verify("", "k", 0)) throw new AssertionError("empty phai false");
            if (Jwt.verify("onlyonesegment", "k", 0)) throw new AssertionError("khong dau cham phai false");
            if (Jwt.verify("a.b", "k", 0)) throw new AssertionError("2 phan phai false");
            if (Jwt.verify("a.b.c.d", "k", 0)) throw new AssertionError("4 phan phai false");
            if (Jwt.verify("..", "k", 0)) throw new AssertionError("phan rong phai false");
        });
        check("signature is base64url without padding", () -> {
            String t = Jwt.sign("u", "k", 9999999999L);
            if (t.indexOf('+') >= 0 || t.indexOf('/') >= 0 || t.indexOf('=') >= 0) throw new AssertionError("co ky tu base64 thuong: " + t);
            if (!Jwt.verify(t, "k", 1)) throw new AssertionError("token moi phai hop le");
        });
        check("subject returns null on malformed input", () -> {
            eq(null, Jwt.subject("khong-phai-token"));
            eq(null, Jwt.subject(null));
        });
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
      reference: `import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.MessageDigest;
import java.util.Base64;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

final class Jwt {
    private static final char Q = '"';

    static String sign(String subject, String secret, long expiresAtSeconds) {
        String header = encode("{" + Q + "alg" + Q + ":" + Q + "HS256" + Q + "," + Q + "typ" + Q + ":" + Q + "JWT" + Q + "}");
        String payload = encode("{" + Q + "sub" + Q + ":" + Q + subject + Q + "," + Q + "exp" + Q + ":" + expiresAtSeconds + "}");
        String input = header + "." + payload;                    // chi doan truoc dau cham thu 2 duoc ky
        return input + "." + encode(hmac(input, secret));
    }

    static boolean verify(String token, String secret, long nowSeconds) {
        if (token == null) return false;
        int p1 = token.indexOf('.');
        int p2 = p1 <= 0 ? -1 : token.indexOf('.', p1 + 1);
        if (p2 <= p1 + 1 || token.indexOf('.', p2 + 1) >= 0) return false;   // dung 3 phan
        byte[] given = decode(token.substring(p2 + 1));
        if (given == null) return false;
        if (!MessageDigest.isEqual(hmac(token.substring(0, p2), secret), given)) return false;
        byte[] payloadBytes = decode(token.substring(p1 + 1, p2));
        if (payloadBytes == null) return false;
        long exp = claim(new String(payloadBytes, StandardCharsets.UTF_8), "exp");
        return exp >= 0 && nowSeconds < exp;                       // RFC 7519: now phai nho hon exp
    }

    static String subject(String token) {
        if (token == null) return null;
        int p1 = token.indexOf('.');
        int p2 = p1 <= 0 ? -1 : token.indexOf('.', p1 + 1);
        if (p2 <= p1 + 1) return null;
        byte[] payloadBytes = decode(token.substring(p1 + 1, p2));
        if (payloadBytes == null) return null;
        String payload = new String(payloadBytes, StandardCharsets.UTF_8);
        String key = Q + "sub" + Q + ":";
        int i = payload.indexOf(key);
        if (i < 0) return null;
        int start = i + key.length() + 1;                          // bo dau " mo cua gia tri
        int end = payload.indexOf(Q, start);
        return end < 0 ? null : payload.substring(start, end);
    }

    private static long claim(String payload, String name) {
        String key = Q + name + Q + ":";
        int i = payload.indexOf(key);
        if (i < 0) return -1;
        int start = i + key.length();
        int end = start;
        while (end < payload.length() && Character.isDigit(payload.charAt(end))) end++;
        if (end == start) return -1;
        try {
            return Long.parseLong(payload.substring(start, end));
        } catch (NumberFormatException e) {
            return -1;
        }
    }

    private static String encode(byte[] bytes) {
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private static String encode(String s) {
        return encode(s.getBytes(StandardCharsets.UTF_8));
    }

    private static byte[] decode(String s) {
        try {
            return Base64.getUrlDecoder().decode(s);
        } catch (IllegalArgumentException e) {
            return null;
        }
    }

    private static byte[] hmac(String data, String secret) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            return mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
        } catch (GeneralSecurityException e) {
            throw new IllegalStateException(e);
        }
    }
}`,
      hints: [
        'Chỉ ký đoạn trước dấu chấm thứ hai ({{header.payload}}); đổi một ký tự trong đó là chữ ký hỏng.',
        'Dùng {{Base64.getUrlEncoder().withoutPadding()}} và tách token bằng {{indexOf}} để chắc chắn đúng 3 phần trước khi làm gì khác.',
        'Sau khi chữ ký khớp, tìm {{exp}} trong payload rồi so {{nowSeconds < exp}}; mọi lỗi parse trả về false thay vì ném exception.',
      ],
      explain: `Thứ tự verify quyết định tất cả: kiểm chữ ký **trước**, rồi mới đọc {{exp}}. Đọc claim trước rồi mới so chữ ký nghĩa là bạn đã tin dữ liệu chưa xác thực.

Các bẫy hay gặp:
- Ký cả chuỗi token thay vì {{header.payload}}: tự khớp với chính mình nhưng không tương thích chuẩn và không phát hiện được thao tác với header.
- So chữ ký bằng {{String.equals}} → timing channel; phải decode sang byte rồi dùng {{MessageDigest.isEqual}}.
- Tin {{alg}} từ header → alg confusion (đổi sang none, hoặc dùng public key làm secret HMAC); thuật toán do bên verify cố định.
- Sai ranh giới hết hạn: RFC 7519 yêu cầu {{now}} phải **nhỏ hơn** {{exp}}, nên bằng {{exp}} là đã hết hạn; viết {{nowSeconds <= exp}} là sai.

{{subject}} cố ý không kiểm tra chữ ký: nó chỉ là tiện ích đọc claim, mọi quyết định quyền hạn phải đi qua {{verify}} trước. Khi production, đừng tự parse JSON kiểu này mà dùng Jackson hoặc Nimbus nhưng giữ nguyên đúng thứ tự các bước trên.`,
    },
    {
      title: 'Ký request HTTP bằng HMAC: chống giả mạo và chống replay',
      prompt: `Viết {{RequestSigner}} để service A ký request trước khi gửi đi, service B xác minh trước khi xử lý (mọi thứ chỉ dùng JDK 17, clock được truyền vào):

- {{sign(method, path, timestampSeconds, body, secret)}}: tạo chuỗi canonical gồm {{method}}, {{path}}, {{timestampSeconds}}, {{body}} cách nhau bằng một ký tự xuống dòng, ký bằng HMAC-SHA256, trả về chữ ký Base64URL không padding.
- {{verify(method, path, timestampSeconds, body, secret, signature, nowSeconds, toleranceSeconds)}}: true đúng khi {{|now - timestamp| <= tolerance}} **và** chữ ký khớp; chuỗi Base64 rác hoặc {{signature}} là null thì false.

Mục tiêu: request bị sửa (body, path) không qua được; request bị chụp lại sau {{tolerance}} giây cũng không qua được.`,
      starter: `import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.MessageDigest;
import java.util.Base64;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

final class RequestSigner {
    static String sign(String method, String path, long timestampSeconds, String body, String secret) {
        throw new UnsupportedOperationException("TODO");
    }

    static boolean verify(String method, String path, long timestampSeconds, String body,
                          String secret, String signature, long nowSeconds, long toleranceSeconds) {
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
    public static void main(String[] args) {
        check("round trip verifies inside the window", () -> {
            String sig = RequestSigner.sign("POST", "/v1/transfer", 1000, "amount=100", "s3cret");
            if (!RequestSigner.verify("POST", "/v1/transfer", 1000, "amount=100", "s3cret", sig, 1000, 300)) throw new AssertionError("phai hop le");
            if (!RequestSigner.verify("POST", "/v1/transfer", 1000, "amount=100", "s3cret", sig, 1300, 300)) throw new AssertionError("ranh gioi phai hop le");
        });
        check("wrong secret or wrong path is rejected", () -> {
            String sig = RequestSigner.sign("POST", "/v1/transfer", 1000, "amount=100", "s3cret");
            if (RequestSigner.verify("POST", "/v1/transfer", 1000, "amount=100", "other", sig, 1000, 300)) throw new AssertionError("sai secret ma van qua");
            if (RequestSigner.verify("POST", "/v1/withdraw", 1000, "amount=100", "s3cret", sig, 1000, 300)) throw new AssertionError("sai path ma van qua");
        });
        check("stale and far-future timestamps are rejected", () -> {
            String sig = RequestSigner.sign("GET", "/me", 1000, "", "k");
            if (RequestSigner.verify("GET", "/me", 1000, "", "k", sig, 1301, 300)) throw new AssertionError("quá hạn mà vẫn qua");
            if (!RequestSigner.verify("GET", "/me", 1000, "", "k", sig, 1300, 300)) throw new AssertionError("vừa hết cửa sổ phải còn hợp lệ");
            if (RequestSigner.verify("GET", "/me", 1000, "", "k", sig, 699, 300)) throw new AssertionError("quá xa trong tương lai mà vẫn qua");
            if (!RequestSigner.verify("GET", "/me", 1000, "", "k", sig, 700, 300)) throw new AssertionError("ranh gioi tuong lai phai hop le");
        });
        check("tampered body breaks the signature", () -> {
            String sig = RequestSigner.sign("POST", "/v1/transfer", 1000, "amount=100", "k");
            if (RequestSigner.verify("POST", "/v1/transfer", 1000, "amount=999", "k", sig, 1000, 300)) throw new AssertionError("body bi sua ma van qua");
        });
        check("garbage or missing signature is rejected", () -> {
            if (RequestSigner.verify("GET", "/me", 1000, "", "k", "khong-phai-base64!!", 1000, 300)) throw new AssertionError("chuoi rac ma van qua");
            if (RequestSigner.verify("GET", "/me", 1000, "", "k", null, 1000, 300)) throw new AssertionError("null ma van qua");
        });
        check("signature is base64url without padding", () -> {
            String sig = RequestSigner.sign("POST", "/v1/transfer", 1000, "amount=100", "s3cret");
            if (sig.indexOf('+') >= 0 || sig.indexOf('/') >= 0 || sig.indexOf('=') >= 0) throw new AssertionError("co ky tu base64 thuong: " + sig);
        });
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
      reference: `import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.MessageDigest;
import java.util.Base64;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

final class RequestSigner {
    static String sign(String method, String path, long timestampSeconds, String body, String secret) {
        return Base64.getUrlEncoder().withoutPadding()
                .encodeToString(hmac(canonical(method, path, timestampSeconds, body), secret));
    }

    static boolean verify(String method, String path, long timestampSeconds, String body,
                          String secret, String signature, long nowSeconds, long toleranceSeconds) {
        if (signature == null) return false;
        if (Math.abs(nowSeconds - timestampSeconds) > toleranceSeconds) return false;   // chong replay
        byte[] given;
        try {
            given = Base64.getUrlDecoder().decode(signature);
        } catch (IllegalArgumentException e) {
            return false;
        }
        byte[] expected = hmac(canonical(method, path, timestampSeconds, body), secret);
        return MessageDigest.isEqual(expected, given);   // constant-time
    }

    private static String canonical(String method, String path, long ts, String body) {
        return method + "\\n" + path + "\\n" + ts + "\\n" + body;
    }

    private static byte[] hmac(String data, String secret) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            return mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
        } catch (GeneralSecurityException e) {
            throw new IllegalStateException(e);
        }
    }
}`,
      hints: [
        'Chuỗi canonical phải được cả hai phía dựng **giống hệt nhau**: cùng phân cách, cùng thứ tự, cùng cách viết timestamp — nếu không chữ ký không bao giờ khớp.',
        'Chống replay: kiểm {{Math.abs(nowSeconds - timestampSeconds) > toleranceSeconds}} trước khi tính HMAC, để request quá hạn bị loại ngay.',
        'So chữ ký bằng {{MessageDigest.isEqual}} trên mảng byte đã decode; decode lỗi thì trả false chứ không ném exception.',
      ],
      explain: `Hai lớp phòng vệ nằm trong một hàm: **chính danh** (HMAC chứng minh request do người giữ secret tạo ra và chưa bị sửa) và **hợp lệ theo thời gian** (timestamp nằm trong {{tolerance}} nên request chụp lại chỉ dùng lại được tối đa khoảng đó).

Chuỗi canonical là chỗ dễ sai nhất: hai bên nối khác nhau một khoảng trắng hay đổi thứ tự trường là chữ ký không bao giờ khớp, và lỗi này hay bị đổ cho "thiếu quyền". Trong thực tế nên đưa cả {{timestamp}} và {{nonce}} vào chuỗi ký, đồng thời server nhớ nonce trong cửa sổ ngắn — vì ngay trong {{tolerance}} thì request cũ **vẫn hợp lệ**, nonce mới chặn được replay hoàn toàn.

{{tolerance}} quá lớn (1 giờ) thì cửa sổ tấn công rộng; quá nhỏ (1 giây) thì lệch giờ giữa hai máy làm request hợp lệ bị từ chối. 300 giây là mặc định phổ biến, kèm NTP cho mọi máy. Chữ ký Base64URL cho gọn: 43 ký tự thay vì 64 ký tự hex, và không cần escape khi đặt vào header.`,
    },
  ],
  check: [
    {
      q: 'Chữ ký HS256 của JWT phủ lên đoạn nào của token?',
      options: [
        'Chỉ phần payload',
        'Chỉ phần header',
        'Đoạn {{header.payload}} trước dấu chấm thứ hai — nên đổi một ký tự trong header là chữ ký hỏng ngay',
        'Toàn bộ token, kể cả chính chữ ký',
      ],
      answer: 2,
      explain: `Chữ ký là HMAC tính trên **chuỗi ký** {{header.payload}}, nên bất kỳ thao tác nào với header hay payload (kể cả đổi {{alg}}) đều làm chữ ký sai. Payload không được phủ riêng lẻ, và chữ ký không thể tự phủ lấy chính nó (điều đó sẽ vô nghĩa vì attacker tự ký lại được).`,
    },
    {
      q: 'Khi verify, có nên đọc {{alg}} từ header để chọn thuật toán không?',
      options: [
        'Có — theo đúng spec, header nói thuật toán nào thì verify theo thuật toán đó',
        'Không: bên verify phải cố định thuật toán (ví dụ HS256) để tránh alg confusion như đổi sang none hay dùng public key làm secret HMAC',
        'Chỉ lấy {{alg}} khi token đến từ service nội bộ',
        'Được lấy nhưng phải hash {{alg}} lại rồi mới dùng',
      ],
      answer: 1,
      explain: `Đọc {{alg}} từ token chính là lỗ hổng: attacker đổi header sang {{none}} thì bỏ qua chữ ký, hoặc đổi sang RS256 để thư viện dùng public key làm secret HMAC rồi tự ký. Spec mô tả cấu trúc, nhưng **quyết định thuật toán phải nằm ở bên verify**; hai phương án còn lại không có căn cứ trong RFC 7519 và không chặn được gì.`,
    },
    {
      q: 'Token đã có {{exp}}, làm sao thu hồi ngay khi người dùng đổi mật khẩu hoặc bị đánh cắp?',
      options: [
        'Không thể với JWT thuần — token vẫn hợp lệ tới {{exp}}; cần cơ chế ngoài như danh sách thu hồi, refresh token rotation, hoặc dùng opaque token tra tại server',
        'Tự động hết hạn vì đã có claim {{sub}} nhận diện người dùng',
        'Các service tự nhận thông báo qua broadcast rồi xoá token',
        'Đặt {{exp}} bằng 0 là token bị huỷ ngay lập tức',
      ],
      answer: 0,
      explain: `JWT là token self-contained: server cấp xong không còn trạng thái nào để xoá, nên tới trước {{exp}} vẫn verify hợp lệ. Claim {{sub}} chỉ nhận diện, không giúp thu hồi; broadcast không có kênh chuẩn và mọi instance vẫn verify token là hợp lệ; đổi {{exp}} đã ký thì chữ ký hỏng ngay. Giải pháp thật: blacklist có TTL, rotation refresh token khi phát hiện đánh cắp, hoặc opaque token tra tại server (đổi lấy độ trễ mỗi request).`,
    },
  ],
  related: ['security-003', 'security-011', 'security-017'],
  tags: ['JWT', 'HMAC', 'HS256', 'replay'],
},
{
  id: 'lesson-security-003',
  track: 'security',
  order: 3,
  title: 'Rate limiter bằng token bucket: burst, refill và đồng hồ truyền vào',
  level: 'lead',
  minutes: 30,
  goals: [
    'Giải thích được token bucket gồm capacity và refill rate, và chọn hai tham số đó theo yêu cầu SLA',
    'Triển khai được refill-on-demand với thời gian truyền vào để test tất định, không dùng thời gian thật',
    'So sánh token bucket với fixed window, sliding window log/counter và nêu cách phân tán bằng Redis',
  ],
  body: `### Token bucket: hai tham số thay cho một con số
Yêu cầu "tối đa 100 request/phút" không nói gì về việc 100 request đến trong 100 mili giây đầu tiên hay trải đều cả phút. Token bucket tách hai ý đó ra:

- **capacity** (còn gọi là burst): số token tối đa bucket có thể chứa — mức bùng phát bạn chấp nhận ngay lập tức.
- **refill rate**: số token thêm vào mỗi đơn vị thời gian — mức sustained bạn cho phép về dài hạn.

Mỗi request "rút" một token: đủ thì cho qua và trừ đi, không đủ thì từ chối (HTTP 429). Bucket đầy thì dừng nạp, vì nạp thêm cũng bị cắt lại ở {{capacity}}.

~~~java
// refill-on-demand: không timer, không thread riêng cho từng bucket
private void refill(long nowMs) {
    if (nowMs <= lastRefillMs) return;                 // đồng hồ lùi: không in thêm token
    tokens = Math.min(capacity, tokens + (nowMs - lastRefillMs) * refillPerMs);
    lastRefillMs = nowMs;
}
~~~

Mỗi lần thử là O(1) và chỉ tính nạp khi có người gọi. Đây là lý do refill-on-demand phổ biến hơn việc giữ một timer nạp token cho từng bucket.

### Đồng hồ được truyền vào, không phải đọc bên trong
Nếu {{tryAcquire}} tự gọi {{System.currentTimeMillis}}, bài kiểm tra phải {{Thread.sleep}} mới thấy token nạp lại: chậm, dễ fail trên CI, và không bao giờ tái lập được "đồng hồ lùi" hay "nhảy cóc" — hai tình huống thật sự xảy ra khi NTP hiệu chỉnh máy. Truyền {{nowMs}} vào (hoặc nhận một supplier thời gian trong constructor) khiến mọi tình huống là dữ liệu đầu vào:

~~~java
bucket.tryAcquire(0);        // đầy, dùng hết 5 token
bucket.tryAcquire(3);        // 3 ms sau với rate 1 token/ms: nạp đúng 3 token
bucket.tryAcquire(-500);     // đồng hồ lùi: không được in thêm token
~~~

Ở production bạn vẫn truyền thời gian thực, nhưng từ **một nguồn chung** cho mọi instance và cho phép sai lệch vài chục giây ở tầng phân tán.

### So sánh các thuật toán rate limit
| Thuật toán | Ưu điểm | Nhược điểm |
|---|---|---|
| Fixed window | đơn giản, bộ nhớ O(1) | gật gù ở ranh giới cửa sổ: cho qua gấp đôi khi vượt sang cửa sổ liền kề |
| Sliding window log | chính xác tuyệt đối | bộ nhớ O(số request trong cửa sổ) |
| Sliding window counter | cân bằng giữa chính xác và bộ nhớ | ước lượng, không chính xác tuyệt đối |
| Token bucket | burst có kiểm soát, O(1) | phải tune cả capacity lẫn rate |
| Leaky bucket | xuất đều, hợp lệ tắc | không cho phép burst |

### Ở production
- **Key**: theo IP, theo user hoặc cả hai, kèm **giới hạn số bucket** (LRU) để attacker tạo hàng triệu key không làm phình bộ nhớ.
- **Concurrency**: đọc-ghi {{tokens}} là read-modify-write; dùng {{synchronized}}, vòng CAS, hoặc mảng slot theo CPU để hai thread không cùng rút một token.
- **Phân tán**: bucket trong RAM của từng instance thì tổng cho phép gấp số instance. Dùng Redis với **Lua script** chạy nguyên tử (đọc, nạp, trừ, ghi về trong một script) hoặc gateway chuyên dụng.
- **Phản hồi**: trả {{429}} kèm {{Retry-After}} là số giây tới lần thử kế tiếp, và yêu cầu client đặt jitter khi retry để cả đám không dồn vào cùng một thời điểm.
- **Capacity với rate**: capacity = burst bạn thật sự chấp nhận (thường tương ứng vài trăm mili giây đầu), rate = SLA sustained. Đặt cả hai bằng 100 nghĩa là bạn cho phép burst tới 100 request (quá mức cần) và sustained 100 request mỗi giây — tức 6000/phút, vượt xa giới hạn.

### Bẫy thường gặp
- Gọi thời gian thật trong logic rồi test bằng {{Thread.sleep}}: test chậm, thi thoảng fail, và không tái lập được clock skew.
- Nạp token bằng một timer thread cho **mỗi** bucket: vài nghìn bucket là vài nghìn timer; refill-on-demand không cần tới.
- So {{tokens}} bằng {{==}} với số thực, hoặc nạp token mà quên cập nhật {{lastRefillMs}} — token bị nạp lặp lại nhiều lần.
- Không giới hạn số bucket (mỗi IP một object) → quét IP giả tạo thành memory leak.
- Confuse rate limit với quota: rate limit chặn tần suất, quota chặn tổng lượng trong kỳ.

### Liên hệ phỏng vấn
Interviewer hay hỏi: "em chọn thuật toán rate limit nào và tại sao?", "hệ thống nhiều instance thì làm sao vẫn đúng?", "xử lý sao khi đồng hồ lệch giữa các máy?", "trả {{429}} cho client thế nào cho đúng?". Làm xong hai bài tập dưới đây — token bucket với clock truyền vào và sliding window log — là bạn có đủ chất liệu để trả lời cả bốn câu bằng chính mã của mình.`,
  exercises: [
    {
      title: 'Viết TokenBucket: capacity, refill rate và clock truyền vào',
      prompt: `Hoàn thiện {{TokenBucket}} — bộ giới hạn tần suất theo token bucket, tất định hoàn toàn (thời gian do test truyền vào):

- {{TokenBucket(capacity, tokensPerSecond, nowMs)}}: bucket bắt đầu **đầy** {{capacity}} token; {{refillPerMs}} = {{tokensPerSecond / 1000.0}}. Capacity hoặc rate không hợp lệ thì ném {{IllegalArgumentException}}.
- {{tryAcquire(nowMs)}}: nạp token theo thời gian đã trôi (capped ở {{capacity}}), rồi trừ 1 nếu đủ; trả về false nếu thiếu. {{tryAcquire(nowMs, permits)}} giống vậy với số token lớn hơn.
- {{available(nowMs)}}: số token hiện có sau khi nạp; {{retryAfterMs(nowMs)}}: 0 nếu lấy được ngay, ngược lại số mili giây tới lần thử kế tiếp.
- Đồng hồ lùi ({{nowMs}} nhỏ hơn thời điểm đã thấy) **không** được in thêm token.

Chỉ dùng JDK, không dùng thời gian thật.`,
      starter: `final class TokenBucket {
    TokenBucket(long capacity, long tokensPerSecond, long nowMs) {
        throw new UnsupportedOperationException("TODO");
    }

    boolean tryAcquire(long nowMs) {
        throw new UnsupportedOperationException("TODO");
    }

    boolean tryAcquire(long nowMs, int permits) {
        throw new UnsupportedOperationException("TODO");
    }

    double available(long nowMs) {
        throw new UnsupportedOperationException("TODO");
    }

    long retryAfterMs(long nowMs) {
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
    static int drain(TokenBucket b, long nowMs, int attempts) {
        int ok = 0;
        for (int i = 0; i < attempts; i++) if (b.tryAcquire(nowMs)) ok++;
        return ok;
    }
    public static void main(String[] args) {
        check("full bucket allows exactly capacity requests", () -> {
            TokenBucket b = new TokenBucket(5, 1000, 0);
            eq(5, drain(b, 0, 6));
            if (b.tryAcquire(0)) throw new AssertionError("lan thu 6 phai bi chan");
        });
        check("refills at the configured rate", () -> {
            TokenBucket b = new TokenBucket(5, 1000, 0);      // 1 token moi ms
            drain(b, 0, 5);
            if (b.tryAcquire(0)) throw new AssertionError("chua du thoi gian ma van qua");
            eq(3, drain(b, 3, 5));                            // 3 ms sau co dung 3 token
        });
        check("refill is capped at capacity", () -> {
            TokenBucket b = new TokenBucket(5, 1000, 0);
            drain(b, 0, 5);
            eq(5, drain(b, 60_000, 10));
        });
        check("multi permit requests", () -> {
            TokenBucket b = new TokenBucket(5, 1000, 0);
            if (!b.tryAcquire(0, 3)) throw new AssertionError("3/5 phai qua");
            if (b.tryAcquire(0, 3)) throw new AssertionError("chi con 2 token ma van qua 3");
            if (!b.tryAcquire(0, 2)) throw new AssertionError("2 token con lai phai qua");
            if (b.tryAcquire(0, 6)) throw new AssertionError("permits lon hon capacity phai luon false");
        });
        check("backwards clock does not mint tokens", () -> {
            TokenBucket b = new TokenBucket(5, 1000, 1000);
            drain(b, 1000, 5);
            if (b.tryAcquire(500)) throw new AssertionError("dong ho lu ma van co token");
            eq(3, drain(b, 1003, 5));
        });
        check("available and retryAfter", () -> {
            TokenBucket b = new TokenBucket(5, 1000, 0);
            eq(0L, b.retryAfterMs(0));
            eq(5.0, b.available(0));
            drain(b, 0, 5);
            eq(0.0, b.available(0));
            eq(1L, b.retryAfterMs(0));
            if (b.retryAfterMs(2) != 0) throw new AssertionError("2 ms sau da co token");
        });
        check("invalid construction is rejected", () -> {
            try { new TokenBucket(0, 1000, 0); }
            catch (IllegalArgumentException e) { return; }
            throw new AssertionError("capacity 0 phai ném IllegalArgumentException");
        });
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
      reference: `final class TokenBucket {
    private final long capacity;
    private final double refillPerMs;
    private double tokens;
    private long lastRefillMs;

    TokenBucket(long capacity, long tokensPerSecond, long nowMs) {
        if (capacity < 1) throw new IllegalArgumentException("capacity phai >= 1");
        if (tokensPerSecond < 1) throw new IllegalArgumentException("tokensPerSecond phai >= 1");
        this.capacity = capacity;
        this.refillPerMs = tokensPerSecond / 1000.0;
        this.tokens = capacity;                 // khoi tao day
        this.lastRefillMs = nowMs;
    }

    boolean tryAcquire(long nowMs) {
        return tryAcquire(nowMs, 1);
    }

    boolean tryAcquire(long nowMs, int permits) {
        if (permits < 1) throw new IllegalArgumentException("permits phai >= 1");
        refill(nowMs);
        if (permits > capacity) return false;    // khong bao gio du
        if (tokens >= permits) {
            tokens -= permits;
            return true;
        }
        return false;
    }

    double available(long nowMs) {
        refill(nowMs);
        return tokens;
    }

    long retryAfterMs(long nowMs) {
        refill(nowMs);
        if (tokens >= 1) return 0;
        return (long) Math.ceil((1 - tokens) / refillPerMs);
    }

    private void refill(long nowMs) {
        if (nowMs <= lastRefillMs) return;       // dong ho lu: khong in them token
        tokens = Math.min(capacity, tokens + (nowMs - lastRefillMs) * refillPerMs);
        lastRefillMs = nowMs;
    }
}`,
      hints: [
        'Nạp lười (on-demand): mỗi lần gọi mới tính {{tokens += (nowMs - lastRefillMs) * refillPerMs}}, cắt ở {{capacity}} rồi mới ghi {{lastRefillMs = nowMs}}.',
        'Chỉ nạp khi {{nowMs > lastRefillMs}}; đồng hồ lùi thì bỏ qua hoàn toàn, đừng ghi {{lastRefillMs}} về giá trị nhỏ hơn.',
        '{{tryAcquire(nowMs, permits)}}: nếu {{permits > capacity}} thì luôn false (không bao giờ đủ token), còn lại so {{tokens >= permits}} rồi trừ một lần.',
      ],
      explain: `Refill-on-demand là điểm mấu chốt: không có timer nào nạp token, nên không có thread, không có race với "tiến trình nạp", và mọi hành vi phụ thuộc duy nhất vào cặp thời gian bạn truyền vào. {{lastRefillMs}} phải được cập nhật **sau** khi nạp, nếu không token sẽ bị nạp lại cho cùng một khoảng thời gian.

Sai lầm kinh điển là dùng {{System.currentTimeMillis}} bên trong: test phải {{Thread.sleep}} nên chậm và hay fail trên CI, đồng thời bạn không thể mô phỏng được clock nhảy cóc — mà NTP vẫn chỉnh đồng hồ về lùi trong thực tế. Xử lý đó bằng cách bỏ qua khi {{nowMs <= lastRefillMs}}: không tin đồng hồ đi ngược, bucket giữ nguyên số token.

Với số thực, mọi phép tính ở đây đều là bội số của {{refillPerMs}} nên kết quả tất định; nhưng đừng so {{tokens}} bằng {{==}} với một hằng số bạn tự tính bằng tay — hãy so bằng khoảng cách hoặc dùng {{retryAfterMs}}. Bài dùng rate 1000 token/giây cho test gọn; production thường từ vài chục tới vài nghìn, còn {{capacity}} lấy theo burst thật sự cần cho một lần gọi đầu.`,
    },
    {
      title: 'Viết SlidingWindow: giới hạn chính xác trong cửa sổ trượt',
      prompt: `Hoàn thiện {{SlidingWindow}} — giới hạn theo **cửa sổ trượt** (chính xác tuyệt đối, không gật gù ở ranh giới):

- {{SlidingWindow(windowMs, maxPermits, nowMs)}}: cửa sổ dài {{windowMs}} mili giây, tối đa {{maxPermits}} request trong cửa sổ. Tham số không hợp lệ thì ném {{IllegalArgumentException}}.
- {{tryAcquire(nowMs)}}: một request được tính tại thời điểm {{nowMs}} nếu sau khi loại các request đã hết cửa sổ thì còn dưới {{maxPermits}}; nếu qua được thì ghi nhận request đó.
- {{count(nowMs)}}: số request còn nằm trong cửa sổ tại {{nowMs}}.
- Một request tại {{t}} bị coi là hết hạn khi {{nowMs - t >= windowMs}}. Đồng hồ lùi thì đóng băng: cửa sổ không được nới ra.

Chỉ dùng JDK, không dùng thời gian thật.`,
      starter: `final class SlidingWindow {
    SlidingWindow(long windowMs, int maxPermits, long nowMs) {
        throw new UnsupportedOperationException("TODO");
    }

    boolean tryAcquire(long nowMs) {
        throw new UnsupportedOperationException("TODO");
    }

    int count(long nowMs) {
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
        check("allows up to maxPermits inside the window", () -> {
            SlidingWindow w = new SlidingWindow(1000, 3, 0);
            int ok = 0;
            for (int i = 0; i < 5; i++) if (w.tryAcquire(0)) ok++;
            eq(3, ok);
        });
        check("window slides and old hits expire", () -> {
            SlidingWindow w = new SlidingWindow(1000, 3, 0);
            for (int i = 0; i < 3; i++) w.tryAcquire(0);
            if (w.tryAcquire(999)) throw new AssertionError("999ms chua het cua so");
            if (!w.tryAcquire(1000)) throw new AssertionError("1000ms da het cua so");
            if (!w.tryAcquire(1000)) throw new AssertionError("hit cu da het, con cho phep 2 nua");
            if (!w.tryAcquire(1000)) throw new AssertionError("hit cu da het, van con cho phep 1");
            if (w.tryAcquire(1000)) throw new AssertionError("da day 3 hit moi trong cua so");
            eq(3, w.count(1000));
        });
        check("count reports the live window", () -> {
            SlidingWindow w = new SlidingWindow(1000, 5, 0);
            w.tryAcquire(0);
            w.tryAcquire(10);
            w.tryAcquire(20);
            eq(3, w.count(30));
            eq(2, w.count(1000));
            eq(0, w.count(5000));
        });
        check("backwards clock freezes the window", () -> {
            SlidingWindow w = new SlidingWindow(1000, 3, 0);
            for (int i = 0; i < 3; i++) w.tryAcquire(0);
            if (w.tryAcquire(-500)) throw new AssertionError("dong ho lu khong duoc noi cua so");
            eq(3, w.count(-500));
            if (!w.tryAcquire(1000)) throw new AssertionError("het cua so thi phai cho qua");
        });
        check("invalid construction is rejected", () -> {
            try { new SlidingWindow(0, 3, 0); }
            catch (IllegalArgumentException e) { return; }
            throw new AssertionError("windowMs 0 phai ném IllegalArgumentException");
        });
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
      reference: `import java.util.ArrayDeque;

final class SlidingWindow {
    private final long windowMs;
    private final int maxPermits;
    private final ArrayDeque<Long> hits = new ArrayDeque<>();
    private long clock;

    SlidingWindow(long windowMs, int maxPermits, long nowMs) {
        if (windowMs < 1) throw new IllegalArgumentException("windowMs phai >= 1");
        if (maxPermits < 1) throw new IllegalArgumentException("maxPermits phai >= 1");
        this.windowMs = windowMs;
        this.maxPermits = maxPermits;
        this.clock = nowMs;
    }

    boolean tryAcquire(long nowMs) {
        long t = freeze(nowMs);
        prune(t);
        if (hits.size() >= maxPermits) return false;
        hits.addLast(t);
        return true;
    }

    int count(long nowMs) {
        long t = freeze(nowMs);
        prune(t);
        return hits.size();
    }

    private long freeze(long nowMs) {
        clock = Math.max(nowMs, clock);      // dong ho lu: cua so dong bang
        return clock;
    }

    private void prune(long nowMs) {
        while (!hits.isEmpty() && nowMs - hits.peekFirst() >= windowMs) hits.pollFirst();
    }
}`,
      hints: [
        'Giữ các timestamp trong {{ArrayDeque}} theo thứ tự tăng dần; trước khi quyết định, bỏ ở đầu mọi timestamp có {{nowMs - t >= windowMs}}.',
        'Ghi nhớ {{clock = max(nowMs, clock)}} để đồng hồ đi ngược không làm cửa sổ nới ra; mọi thao tác đều dùng giá trị đã đóng băng này.',
        '{{hits.size() >= maxPermits}} thì từ chối, nếu không thì {{addLast}} timestamp vừa đóng băng rồi mới trả true.',
      ],
      explain: `Sliding window log chính xác tuyệt đối vì bạn giữ **mỗi** timestamp thay vì đếm theo khung cố định: không còn hiện tượng "100 request cuối cửa sổ trước + 100 request đầu cửa sổ sau" cùng đi qua trong 2 giây như fixed window. Đổi lại, bộ nhớ tỉ lệ với số request trong cửa sổ, nên phải prune đều tay — {{while}} ở đầu deque là O(1) amortised cho mỗi request vì mỗi timestamp chỉ bị xoá đúng một lần.

{{maxPermits}} quyết định hành vi ở ranh giới: cửa sổ đóng đúng tại {{nowMs - t >= windowMs}}, nghĩa là hit tại giây 0 hết hạn ngay khi đồng hồ chạm 1000 ms — chọn {{>}} hay {{>=}} phải nhất quán giữa hai phía, nếu không sẽ lệch một request ở ranh giới.

Đồng hồ lùi được xử lý bằng cách đóng băng: nếu NTP kéo giờ về sau, bạn **không** muốn các hit cũ sống lại hay cửa sổ mở ra — đó là lý do {{freeze}} lấy max với {{clock}} đã thấy. Bài tập dùng deque nên O(n) bộ nhớ; production với cửa sổ lớn (ví dụ 1 phút, 10 nghìn request) thường chuyển sang sliding window counter để giữ O(1), hoặc giới hạn kích thước deque để chống memory leak khi bị quét. Cần phân biệt với token bucket: bucket cho phép burst có kiểm soát, còn sliding window chính xác theo cửa sổ — hai thứ giải quyết hai bài toán khác nhau.`,
    },
  ],
  check: [
    {
      q: 'Bucket có {{capacity = 10}} và {{tokensPerSecond = 5}}; dùng sạch bucket đang đầy, 1 giây sau bucket có bao nhiêu token?',
      options: [
        '0 vì token chỉ được cấp ngay khi có request tới',
        '5 — rate quyết định mức nạp, capacity chỉ là mức trần',
        '10 vì capacity quyết định mức nạp lại',
        'Không xác định được vì phụ thuộc thời gian hệ thống',
      ],
      answer: 1,
      explain: `Sau 1 giây, bucket nạp {{5 × 1}} = 5 token và bị cắt ở mức 0 (chưa đầy 10). Capacity = 10 chỉ có nghĩa bucket **có thể** chứa tới 10 token nếu bạn chờ đủ lâu (2 giây để đầy); nó không phải tốc độ nạp. Nạp không phụ thuộc thời gian hệ thống vì refill dùng đúng thời gian bạn truyền vào, nên phương án "không xác định" sai.`,
    },
    {
      q: 'Vì sao truyền {{nowMs}} vào {{tryAcquire}} thay vì gọi {{System.currentTimeMillis}} bên trong?',
      options: [
        'Vì {{System.currentTimeMillis}} chậm hơn {{nanoTime}} nhiều lần',
        'Để logic tất định: test tái lập mọi tình huống (đồng hồ lùi, nhảy cóc) không cần sleep; production vẫn truyền thời gian thực từ một nguồn chung',
        'Vì JVM cấm gọi hàm thời gian trong mã bảo mật',
        'Vì đồng hồ hệ thống luôn sai đúng 1 giây',
      ],
      answer: 1,
      explain: `Lý do thật là **khả năng kiểm thử và tái lập**: với thời gian truyền vào, bạn mô phỏng được phút, giây và cả clock đi ngược chỉ bằng cách đổi tham số, còn test chạy trong mili giây. Nếu không, bạn phải {{Thread.sleep}} (chậm, hay fail trên CI) và không bao giờ tạo được tình huống đồng hồ lùi. {{System.currentTimeMillis}} không chậm tới mức đáng nói, JVM không cấm, và sai số của NTP không cố định 1 giây.`,
    },
    {
      q: 'Yêu cầu "mỗi user tối đa 100 request/phút, đồng thời cho burst ngay 20 request". Cấu hình nào phù hợp nhất?',
      options: [
        'Fixed window 60 giây với limit 100',
        'Sliding window log giữ 100 timestamp gần nhất',
        'Token bucket: {{capacity = 20}} cho burst, cùng mức nạp tương đương 100 request mỗi phút',
        'Token bucket: {{capacity = 100}} và {{tokensPerSecond = 100}}',
      ],
      answer: 2,
      explain: `Burst 20 chính là {{capacity}}, còn 100/phút là rate nạp — đúng hai tham số của token bucket. Fixed window 100 cho phép 100 request ngay đầu cửa sổ (vượt burst cho phép) và còn cho phép 100 request nữa ngay trước ranh giới; sliding log đạt yêu cầu nhưng tốn bộ nhớ bằng số timestamp trong cửa sổ; còn {{capacity = 100}} với {{tokensPerSecond = 100}} cho burst 100 (quá lớn) và sustained 6000/phút (vượt xa giới hạn).`,
    },
  ],
  related: ['security-015', 'security-001'],
  tags: ['rate limit', 'token bucket', 'sliding window', '429'],
}
);
