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
Hãy đặt mình vào tình huống hệ thống bị lộ cơ sở dữ liệu: kẻ tấn công có trong tay bảng {{users}} với hash mật khẩu của hàng triệu người và muốn khôi phục mật khẩu gốc. Cách duy nhất là **đoán**: lấy từng mật khẩu ứng viên (từ điển, mật khẩu đã lộ ở vụ khác…), hash nó rồi so với hash đã lưu. SHA-256 (cũng như MD5, SHA-1) được thiết kế để **nhanh** — một GPU có thể tính hàng tỷ SHA-256 mỗi giây, nên mật khẩu 8 ký tự phổ thông bị dò ra trong vài giờ. Trong khi đó một lần PBKDF2 với vài trăm nghìn vòng lặp mất hàng trăm mili-giây trên CPU. Độ an toàn của hàm hash mật khẩu nằm ở chỗ nó **cố ý chậm** (mỗi lần đoán tốn kém), không phải ở độ dài chuỗi kết quả.

Thứ hai là **rainbow table**: attacker precompute bảng tra ngược cho hàng triệu mật khẩu phổ biến. Cùng một mật khẩu "123456" luôn cho cùng một hash, nên một bảng là đủ để tra toàn bộ người dùng có mật khẩu yếu.

Còn mã hoá hai chiều (AES) thì đi ngược mục tiêu: lưu mật khẩu nghĩa là dữ liệu lưu trữ **không thể khôi phục** được mật khẩu. Dùng AES là bạn phải quản lý một key; key bị lộ thì mọi mật khẩu lộ sạch, và người có key đọc lại được mật khẩu của người dùng (kể cả khi họ dùng lại mật khẩu ở dịch vụ khác). Hệ thống không bao giờ cần **đọc lại** mật khẩu: khi đăng nhập, chỉ cần hash mật khẩu người dùng vừa gõ rồi so với hash đã lưu. Vì vậy hàm một chiều (hash) là đúng công cụ, còn mã hoá hai chiều thì không.

### Salt: mỗi người một muối ngẫu nhiên
Salt là chuỗi ngẫu nhiên **riêng cho từng người dùng**, sinh bằng {{SecureRandom}} (không dùng {{Random}} — seed của nó đoán được), từ 16 byte trở lên, và **lưu cùng** hash. Salt không phải secret: lộ salt cũng không giúp gì nếu mật khẩu yếu.

Với salt riêng, "123456" của hai người cho hai hash khác nhau nên:
- bảng tra ngược chung vô hiệu — phải precompute cho từng salt;
- hai người dùng cùng mật khẩu không lộ ra qua việc so hash;
- attacker không thể dùng một phép hash để thử cùng lúc cho mọi người dùng: muốn đoán "123456" cho 1 triệu user thì phải tính 1 triệu hash khác nhau.

Salt **không** làm mật khẩu yếu trở nên mạnh hơn; nó chỉ chặn việc tính trước (precompute) và việc tấn công hàng loạt. Việc chống đoán từng mật khẩu vẫn nằm ở chỗ làm mỗi lần thử **chậm**.

### PBKDF2: tăng giá của một lần thử
PBKDF2 (Password-Based Key Derivation Function 2, RFC 2898) lặp lại HMAC nhiều lần trên mật khẩu và salt, còn gọi là key stretching:

~~~java
// JDK 17 — chỉ dùng thư viện chuẩn, không cần Bouncy Castle
PBEKeySpec spec = new PBEKeySpec(password.toCharArray(), salt, ITERATIONS, KEY_BITS);
SecretKeyFactory kf = SecretKeyFactory.getInstance("PBKDF2WithHmacSHA256");
byte[] key = kf.generateSecret(spec).getEncoded();   // 32 byte với KEY_BITS = 256
spec.clearPassword();                                // không giữ mật khẩu trên heap
~~~

- {{ITERATIONS}} là "giá của một lần thử". Tăng gấp đôi thì cả bạn và attacker đều chậm gấp đôi, nhưng hai bên chịu thiệt rất khác nhau: server chỉ hash **một lần** mỗi lần đăng nhập (thêm vài trăm mili-giây), còn attacker cần **hàng tỷ** lần thử, nên mỗi lần nhân đôi chi phí là nhân đôi số ngày (hoặc tiền thuê GPU) attacker phải bỏ ra. OWASP (Password Storage Cheat Sheet, 2023) khuyến nghị khoảng **600.000** vòng cho PBKDF2-HMAC-SHA256.
- Điểm yếu của PBKDF2: nó chỉ tốn CPU, không tốn RAM, nên GPU/ASIC chạy song song hàng nghìn phép thử rất rẻ. Argon2id (và ở mức thấp hơn là scrypt, bcrypt) buộc mỗi lần thử dùng nhiều bộ nhớ, khiến song song hoá trên GPU đắt hơn hẳn — đó là lý do OWASP xếp Argon2id là lựa chọn ưu tiên.
- {{KEY_BITS}} = 256: output dài hơn **không** làm attacker chậm lại, vì chi phí nằm ở vòng lặp HMAC.
- {{PBEKeySpec}} nhận {{char[]}} chứ không {{String}}: mảng char xoá được bằng {{clearPassword()}}, còn String nằm trên heap cho tới khi GC thu hồi.

| Thuật toán | Ưu điểm | Nhược điểm |
|---|---|---|
| PBKDF2-HMAC-SHA256 | có sẵn trong JDK, là chuẩn RFC, dễ cấu hình | chống GPU kém hơn Argon2 |
| bcrypt | chống GPU khá, phổ biến, Spring Security có sẵn | JDK không có; chỉ dùng 72 byte đầu của mật khẩu |
| Argon2id | chống GPU/ASIC tốt nhất vì tốn RAM | JDK không có; {{Argon2PasswordEncoder}} của Spring Security cần thêm Bouncy Castle trên classpath; tốn RAM server |

Trong dự án Spring, **Spring Security** (không phải Spring Boot) cung cấp {{BCryptPasswordEncoder}}, {{Pbkdf2PasswordEncoder}}, {{Argon2PasswordEncoder}}. Cách khuyến nghị là {{PasswordEncoderFactories.createDelegatingPasswordEncoder()}}: hash lưu kèm tiền tố tên thuật toán trong ngoặc nhọn (ví dụ tiền tố bcrypt đứng trước chuỗi {{$2a$10$...}}), nhờ đó bạn đổi thuật toán mặc định mà hash cũ vẫn verify được. Hãy dùng encoder có sẵn thay vì tự viết; bài này tự viết để bạn hiểu bên trong, đặt tham số đúng và trả lời được phỏng vấn.

### So sánh không rò rỉ thời gian
Sau khi tính hash mới từ mật khẩu người dùng, ta phải so với hash đã lưu. {{String.equals}} **dừng sớm** khi gặp ký tự khác: nếu hai chuỗi khác ngay byte đầu tiên, nó trả về false gần như tức thì. Kẻ tấn công đo thời gian phản hồi theo từng ký tự có thể suy ra vị trí khác biệt — kỹ thuật timing attack này đã thực sự phá được cơ chế xác thực của một số hệ thống và thư viện.

Với hash mật khẩu có salt, attacker khó khai thác kênh này (họ không điều khiển được byte hash), nhưng với token, chữ ký HMAC, API key thì đây là lỗ hổng thật. Thói quen đúng: **mọi phép so sánh bí mật đều dùng constant-time**.

{{MessageDigest.isEqual(a, b)}} (từ JDK 6u17) duyệt **hết độ dài mảng thứ nhất** và gộp mọi khác biệt bằng phép XOR/OR, không thoát sớm, nên thời gian không phụ thuộc vào vị trí khác biệt:

~~~java
byte[] expected = HexFormat.of().parseHex(storedHash);
byte[] actual   = HexFormat.of().parseHex(hashOf(password, salt));
return MessageDigest.isEqual(expected, actual);   // KHÔNG dùng expected.equals(actual)
~~~

Lưu ý nhỏ: thời gian chạy của {{isEqual}} chỉ phụ thuộc độ dài **tham số thứ nhất**, nên hãy đặt giá trị bạn giữ (hash đã lưu) làm tham số thứ nhất. Hai mảng khác độ dài thì luôn trả false, và hash ở đây luôn dài 32 byte nên độ dài cũng không lộ thông tin gì.

### Định dạng lưu trữ và con đường nâng cấp
Một format phổ biến là {{pbkdf2$600000$saltHex$hashHex}}: lưu **cả thuật toán và số vòng** cùng hash. Khi verify, phải tính lại bằng đúng số vòng **đọc từ chuỗi đã lưu** (không phải hằng số hiện tại), nếu không thì hash cũ tạo với 310.000 vòng sẽ không bao giờ khớp sau khi bạn nâng lên 600.000. Khi người dùng đăng nhập thành công (lúc này bạn đang có mật khẩu gốc trong tay), so số vòng đã lưu với giá trị hiện tại: nếu thấp hơn thì **hash lại và ghi đè**. Đó là cách nâng cấp chi phí hash cho toàn hệ thống mà không bắt người dùng đổi mật khẩu ({{DelegatingPasswordEncoder.upgradeEncoding}} của Spring làm đúng việc này).

Parse định dạng phải **thất bại an toàn**: dữ liệu hỏng thì {{verify}} trả về false chứ không ném exception làm request thành lỗi 500. Cũng nên giới hạn số vòng đọc ra (ví dụ không quá 10 triệu) để một bản ghi bị sửa không biến mỗi lần đăng nhập thành một vòng lặp vài phút.

### Bẫy production
- **Chi phí CPU khi đăng nhập**: 600.000 vòng PBKDF2 tốn vài trăm mili-giây CPU cho mỗi lần đăng nhập; 200 lần đăng nhập/giây là vài chục core chỉ để hash. Chuyển sang {{@Async}} không giảm được CPU (request vẫn phải chờ kết quả). Cách đúng: đo trên phần cứng thật rồi chọn tham số (mục tiêu thường dưới 1 giây), rate limit endpoint đăng nhập, và giới hạn số phép hash chạy đồng thời (bulkhead, ví dụ {{Semaphore}}) để bão đăng nhập không làm nghẽn các API khác.
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
- {{hash(password, salt)}}: tính hash (hex viết thường, 64 ký tự) cho một salt cho trước với {{ITERATIONS}} vòng; đây là hàm tất định (cùng input luôn cho cùng output). Nên viết thêm một overload private {{hash(password, salt, iterations)}} để {{verify}} dùng lại.
- {{verify(password, stored)}}: tách chuỗi đã lưu thành 4 phần, kiểm tra phần đầu là {{pbkdf2}}, **đọc số vòng từ phần thứ hai** (phải trong khoảng 1..10.000.000), tính lại hash từ mật khẩu, salt và số vòng đó, rồi so sánh bằng {{MessageDigest.isEqual}}. Trả về **false** (không ném exception) khi chuỗi null, sai định dạng, số vòng không hợp lệ, hex không hợp lệ hoặc mật khẩu sai.

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
import java.util.HexFormat;
import javax.crypto.SecretKeyFactory;
import javax.crypto.spec.PBEKeySpec;

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
    static String jdkHash(String pw, byte[] salt, int iterations) {
        try {
            PBEKeySpec spec = new PBEKeySpec(pw.toCharArray(), salt, iterations, 256);
            return HexFormat.of().formatHex(SecretKeyFactory.getInstance("PBKDF2WithHmacSHA256").generateSecret(spec).getEncoded());
        } catch (Exception e) { throw new IllegalStateException(e); }
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
        check("hash equals PBKDF2WithHmacSHA256 computed by the JDK", () -> {
            byte[] salt = new byte[16];
            for (int i = 0; i < salt.length; i++) salt[i] = (byte) i;
            eq(jdkHash("Mat-khau-123", salt, PasswordHasher.ITERATIONS), PasswordHasher.hash("Mat-khau-123", salt));
        });
        check("verify uses the iteration count stored in the string", () -> {
            byte[] salt = new byte[16];
            Arrays.fill(salt, (byte) 7);
            String saltHex = HexFormat.of().formatHex(salt);
            String old = "pbkdf2$1000$" + saltHex + "$" + jdkHash("pw-cu", salt, 1000);
            if (!PasswordHasher.verify("pw-cu", old)) throw new AssertionError("hash cu 1000 vong phai verify duoc");
            String[] p = parts(old);
            if (PasswordHasher.verify("pw-cu", p[0] + "$999$" + p[2] + "$" + p[3])) throw new AssertionError("sua so vong ma verify true");
            if (PasswordHasher.verify("pw-cu", p[0] + "$0$" + p[2] + "$" + p[3])) throw new AssertionError("0 vong ma verify true");
            if (PasswordHasher.verify("pw-cu", p[0] + "$abc$" + p[2] + "$" + p[3])) throw new AssertionError("so vong rac ma verify true");
            if (PasswordHasher.verify("pw-cu", p[0] + "$99999999$" + p[2] + "$" + p[3])) throw new AssertionError("so vong qua lon ma verify true");
            if (PasswordHasher.verify("pw-cu", "sha1$1000$" + p[2] + "$" + p[3])) throw new AssertionError("sai thuat toan ma verify true");
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
        return hash(password, salt, ITERATIONS);
    }

    private static String hash(String password, byte[] salt, int iterations) {
        PBEKeySpec spec = new PBEKeySpec(password.toCharArray(), salt, iterations, KEY_BITS);
        try {
            SecretKeyFactory kf = SecretKeyFactory.getInstance("PBKDF2WithHmacSHA256");
            return HexFormat.of().formatHex(kf.generateSecret(spec).getEncoded());
        } catch (GeneralSecurityException e) {
            throw new IllegalStateException("PBKDF2WithHmacSHA256 khong co trong JVM nay", e);
        } finally {
            spec.clearPassword();                                // xoa ban sao mat khau trong spec
        }
    }

    static boolean verify(String password, String stored) {
        if (password == null || stored == null) return false;
        int a = stored.indexOf('$');
        int b = a < 0 ? -1 : stored.indexOf('$', a + 1);
        int c = b < 0 ? -1 : stored.indexOf('$', b + 1);
        if (a < 0 || b < 0 || c < 0 || stored.indexOf('$', c + 1) >= 0) return false;   // dung 4 phan
        if (!"pbkdf2".equals(stored.substring(0, a))) return false;
        try {
            int iterations = Integer.parseInt(stored.substring(a + 1, b));             // so vong DA LUU
            if (iterations < 1 || iterations > 10_000_000) return false;               // chong ban ghi bi sua
            byte[] salt = HexFormat.of().parseHex(stored.substring(b + 1, c));
            byte[] expected = HexFormat.of().parseHex(stored.substring(c + 1));
            if (salt.length == 0 || expected.length == 0) return false;
            byte[] actual = HexFormat.of().parseHex(hash(password, salt, iterations));
            return MessageDigest.isEqual(expected, actual);                            // constant-time
        } catch (IllegalArgumentException e) {                                         // gom ca NumberFormatException
            return false;
        }
    }
}`,
      hints: [
        'Sinh salt bằng {{new SecureRandom().nextBytes(salt)}}, mã hoá hex bằng {{HexFormat.of().formatHex(...)}}; cắt chuỗi lưu bằng {{indexOf}} chứ đừng dùng {{split}} vì ký tự $ là ký tự regex.',
        '{{PBEKeySpec}} nhận {{char[]}} — gọi {{clearPassword()}} trong {{finally}} sau khi đã sinh key.',
        '{{MessageDigest.isEqual}} nhận {{byte[]}}: parse hash đã lưu và hash tính lại sang byte rồi mới so; mọi đường lỗi đều trả về false.',
        'Số vòng đọc bằng {{Integer.parseInt}} từ phần thứ hai; {{NumberFormatException}} là lớp con của {{IllegalArgumentException}}, nên một {{catch (IllegalArgumentException e)}} bắt được cả lỗi số lẫn lỗi hex.',
      ],
      explain: `Bẫy lớn nhất là so bằng {{Arrays.equals(expected, actual)}} hay so hai chuỗi hex bằng {{equals}}: cả hai thoát sớm ở byte khác biệt đầu tiên nên timing channel vẫn còn. (Lưu ý {{expected.equals(actual)}} trên hai {{byte[]}} còn sai nặng hơn: nó so **địa chỉ object**, luôn trả false.) Đúng nghĩa "so sánh constant-time" là duyệt đủ số byte rồi mới trả kết quả.

Bẫy thứ hai là {{split("$")}}: {{split}} nhận regex mà {{$}} là ký tự neo "cuối chuỗi", nên chuỗi không bị cắt chút nào. Dùng {{indexOf}} như trên, hoặc {{split("\\\\$")}}.

Bẫy thứ ba là verify bằng hằng số {{ITERATIONS}} thay vì số vòng đã lưu: ngày bạn tăng {{ITERATIONS}}, toàn bộ người dùng cũ không đăng nhập được nữa. Số vòng phải đi cùng hash.

Bẫy thứ tư là parse hỏng ném exception: một bản ghi lỗi trong DB biến đăng nhập thành lỗi 500 và lộ stack trace. {{verify}} phải bọc mọi lỗi phân tích cú pháp và trả false. Bài dùng {{ITERATIONS = 6000}} để test chạy trong vài chục mili-giây; production theo khuyến nghị hiện hành của OWASP cho PBKDF2-HMAC-SHA256 (hàng trăm nghìn vòng, khoảng 600.000 theo bảng 2023) và cân nhắc Argon2id nếu attacker có GPU.`,
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
      explain: `Điểm yếu của SHA-256 khi dùng cho mật khẩu là **tốc độ**: GPU thử được hàng tỷ SHA-256 mỗi giây, còn PBKDF2 với hàng trăm nghìn vòng thì mỗi lần thử đắt hơn hàng trăm nghìn lần; thêm vào đó, không có salt thì cùng mật khẩu luôn ra cùng hash nên rainbow table dùng được. Output 32 byte là đủ dài (không liên quan đến việc lưu mật khẩu) — thứ quan trọng là chi phí mỗi lần thử. SHA-256 chưa bị bẻ gãy về mặt toán học nhưng sai khi dùng cho mật khẩu; và nó xử lý mọi byte kể cả Unicode, nên phương án "Unicode" cũng sai.`,
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
      explain: `Hai hàm đều trả false, nhưng **cách chúng tới false** khác nhau: {{equals}} dừng ngay khi gặp ký tự khác (thời gian phản hồi phụ thuộc vào vị trí khác biệt), còn {{MessageDigest.isEqual}} luôn duyệt hết độ dài mảng thứ nhất trước khi trả kết quả. JVM không có "tối ưu an toàn" nào cho {{equals}}, và {{isEqual}} so sánh nguyên trạng hai mảng byte chứ không hash thêm.`,
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

0. Thuật toán do **cấu hình của bên verify** quyết định (ở đây cố định HS256), không đọc từ header để chọn.
1. Tách token thành đúng 3 phần với 2 dấu chấm; khác là rác, reject ngay.
2. Tính lại HMAC trên {{header.payload}} — **trước** khi tin bất kỳ claim nào.
3. So chữ ký bằng {{MessageDigest.isEqual}} (constant-time).
4. Decode payload, kiểm tra {{exp}}: chỉ chấp nhận khi {{now < exp}} (thực tế cho thêm leeway vài chục giây cho lệch đồng hồ).
5. Kiểm tra các claim còn lại theo nghiệp vụ: {{iss}} (ai cấp), {{aud}} (token cấp cho service mình), {{nbf}} nếu có.

Trong Spring Boot 3 bạn hiếm khi tự viết: {{spring-boot-starter-oauth2-resource-server}} với {{NimbusJwtDecoder}} làm đủ các bước trên (kiểm chữ ký, {{exp}}/{{nbf}} với leeway mặc định 60 giây, {{iss}} nếu cấu hình {{issuer-uri}}).

### Bẫy production với JWT
- **{{alg=none}}**: token không có chữ ký; nếu thư viện verify "tin" header thì attacker gửi token rỗng chữ ký vẫn qua. Luôn từ chối {{none}}.
- **{{alg}} confusion**: server dùng RS256 và giữ **public key** (công khai, ai cũng lấy được). Attacker đổi header thành {{HS256}} rồi tự ký HMAC bằng chính public key đó làm secret. Thư viện cũ đọc {{alg}} từ header nên verify HMAC với "key" đang có — tức public key — và chấp nhận chữ ký giả. Nguyên tắc: thuật toán do **bên verify quyết định**, không phải do token.
- **Secret yếu hoặc nằm trong repo**: HS256 an toàn bằng đúng secret đó. Đặt trong env hoặc Secrets Manager, xoay vòng định kỳ, độ dài từ 32 byte.
- **Không kiểm tra {{exp}}**, hoặc kiểm tra nhưng các service lệch giờ: cho phép skew vài chục giây và đồng bộ NTP cho mọi máy.
- **Đọc payload mà không verify**: lấy {{sub}}, {{role}} lung tung → trèo quyền ngay.
- **Tin rằng JWT giúp thu hồi**: token đã cấp sống tới {{exp}}. Muốn thu hồi ngay phải có danh sách thu hồi, refresh token rotation, hoặc chuyển sang opaque token tra tại server.

### HS256 hay RS256?
| Tiêu chí | HS256 (symmetric) | RS256 (asymmetric) |
|---|---|---|
| Key | một secret chung cho cả hai bên | private key ký, public key verify |
| Tốc độ | rất nhanh (chỉ HMAC) | ký chậm hơn nhiều; verify vẫn nhanh |
| Phân phối | mọi nơi verify đều giữ secret, mà ai giữ secret cũng **ký** được token — lộ một chỗ là hỏng hết | service verify chỉ cần public key (thường lấy qua endpoint JWKS của Identity Provider) |
| Phù hợp | một service vừa cấp vừa verify, hoặc rất ít bên verify | nhiều service verify, token do IdP (Keycloak, Cognito, Auth0…) cấp |

### Chống replay: ký từng request kèm timestamp
JWT có {{exp}} nhưng ai chụp được token thì dùng lại được vô số lần trong cửa sổ hiệu lực (vì vậy JWT chỉ được đi qua HTTPS và nên sống ngắn, 5–15 phút). Với API giữa hai hệ thống (ví dụ ngân hàng gọi đối tác), cách phổ biến là **ký từng request**: đưa {{timestamp}} vào chuỗi ký và bên verify cho phép sai lệch tối đa {{tolerance}} (thường 300 giây); request vượt cửa sổ bị loại. Bài tập thứ hai bên dưới làm đúng việc đó.

### Liên hệ phỏng vấn
Interviewer hay hỏi: "em verify JWT theo những bước nào?", "vì sao không tin {{alg}} trong header?", "khách hàng yêu cầu logout tức thời thì làm thế nào với JWT?", "HS256 hay RS256, khi nào chọn cái nào?". Làm xong hai bài tập dưới đây — tự ký bằng {{javax.crypto.Mac}} và tự viết hàm verify có kiểm {{exp}} — là bạn trả lời được cả bốn câu bằng chính mã của mình.`,
  exercises: [
    {
      title: 'Tự viết Jwt: ký HS256, verify chữ ký và kiểm tra exp',
      prompt: `Hoàn thiện lớp {{Jwt}} — phiên bản tối giản của JWT ký bằng HS256, chỉ dùng JDK 17:

- {{sign(subject, secret, expiresAtSeconds)}}: header JSON cố định với {{alg}} = HS256 và {{typ}} = JWT; payload JSON viết liền, không khoảng trắng, đúng thứ tự {{sub}} rồi {{exp}} (subject {{user-42}}, exp 2000 cho payload như khối bên dưới). Mỗi phần mã hoá Base64URL không padding; chữ ký là HMAC-SHA256 trên {{header.payload}}. Trả về {{header.payload.signature}}.
- {{verify(token, secret, nowSeconds)}}: true đúng khi chữ ký khớp (tính lại HMAC-SHA256 trên đoạn {{header.payload}}, so bằng {{MessageDigest.isEqual}}) **và** {{nowSeconds < exp}}. Token rác, sai secret, hết hạn, chuỗi Base64 lỗi thì trả **false**, không ném exception.
- {{subject(token)}}: decode payload và trả về giá trị {{sub}} — tiện ích đọc claim, không kiểm tra chữ ký. Token rác hoặc null thì trả {{null}}.

~~~json
{"sub":"user-42","exp":2000}
~~~

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
        check("payload and signature match the HS256 spec exactly", () -> {
            String t = Jwt.sign("user-42", "top-secret", 2000);
            int p1 = t.indexOf('.');
            int p2 = t.indexOf('.', p1 + 1);
            String payload = new String(Base64.getUrlDecoder().decode(t.substring(p1 + 1, p2)), StandardCharsets.UTF_8);
            String q = String.valueOf('"');
            eq("{" + q + "sub" + q + ":" + q + "user-42" + q + "," + q + "exp" + q + ":2000}", payload);
            try {
                javax.crypto.Mac mac = javax.crypto.Mac.getInstance("HmacSHA256");
                mac.init(new javax.crypto.spec.SecretKeySpec("top-secret".getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
                byte[] sig = mac.doFinal(t.substring(0, p2).getBytes(StandardCharsets.UTF_8));
                eq(Base64.getUrlEncoder().withoutPadding().encodeToString(sig), t.substring(p2 + 1));
            } catch (java.security.GeneralSecurityException e) { throw new IllegalStateException(e); }
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
        String input = header + "." + payload;                    // chỉ đoạn trước dấu chấm thứ 2 được ký
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
            if (!RequestSigner.verify("GET", "/me", 1000, "", "k", sig, 1300, 300)) throw new AssertionError("đúng biên cửa sổ vẫn phải hợp lệ");
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
      explain: `Đọc {{alg}} từ token chính là lỗ hổng: attacker đổi header sang {{none}} thì bỏ qua chữ ký, hoặc với server dùng RS256 thì đổi header sang HS256 và tự ký HMAC bằng public key (vốn công khai) — thư viện tin header sẽ dùng public key làm secret HMAC và chấp nhận. Spec mô tả cấu trúc, nhưng **quyết định thuật toán phải nằm ở bên verify**; hai phương án còn lại không có căn cứ trong RFC 7519 và không chặn được gì.`,
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

Ở production, trong một JVM bạn truyền thời gian từ một nguồn **đơn điệu** ({{System.nanoTime()}} chia cho 1.000.000, không bao giờ chạy lùi) thay vì {{currentTimeMillis}} (có thể lùi khi NTP chỉnh). Khi bucket nằm trên Redis cho nhiều instance, hãy dùng **đồng hồ của Redis** (lệnh {{TIME}} trong Lua script) làm nguồn duy nhất, để các máy lệch giờ nhau không làm sai phép tính nạp.

### So sánh các thuật toán rate limit
| Thuật toán | Ưu điểm | Nhược điểm |
|---|---|---|
| Fixed window | đơn giản, bộ nhớ O(1) | bùng nổ ở ranh giới: 100 request cuối phút 1 + 100 request đầu phút 2 = 200 request trong vài giây |
| Sliding window log | chính xác tuyệt đối | bộ nhớ O(số request trong cửa sổ) |
| Sliding window counter | cân bằng giữa chính xác và bộ nhớ | ước lượng, không chính xác tuyệt đối |
| Token bucket | burst có kiểm soát, O(1) | phải tune cả capacity lẫn rate |
| Leaky bucket | đầu ra đều đặn, làm mượt traffic cho downstream | không cho burst; request phải xếp hàng chờ |

### Ở production
- **Key**: theo IP, theo user hoặc cả hai, kèm **giới hạn số bucket** (LRU) để attacker tạo hàng triệu key không làm phình bộ nhớ.
- **Concurrency**: đọc-ghi {{tokens}} là read-modify-write; dùng {{synchronized}} (đủ nhanh vì đoạn găng rất ngắn) hoặc vòng CAS trên {{AtomicLong}} để hai thread không cùng rút một token. Thư viện Bucket4j làm sẵn việc này, kể cả bản phân tán.
- **Phân tán**: bucket trong RAM của từng instance thì tổng cho phép gấp số instance. Dùng Redis với **Lua script** chạy nguyên tử (đọc, nạp, trừ, ghi về trong một script) hoặc gateway chuyên dụng.
- **Phản hồi**: trả {{429}} kèm {{Retry-After}} là số giây tới lần thử kế tiếp, và yêu cầu client đặt jitter khi retry để cả đám không dồn vào cùng một thời điểm.
- **Capacity với rate**: capacity = burst bạn thật sự chấp nhận, rate = mức sustained trong hợp đồng. Ví dụ "100 request/phút, cho burst 20" → capacity 20, rate 100/60 ≈ 1,67 token/giây. Đặt capacity 100 và rate 100 token/giây nghĩa là cho burst tới 100 request và sustained 6000 request/phút — vượt xa giới hạn.

### Bẫy thường gặp
- Gọi thời gian thật trong logic rồi test bằng {{Thread.sleep}}: test chậm, thi thoảng fail, và không tái lập được clock skew.
- Nạp token bằng một timer thread cho **mỗi** bucket: vài nghìn bucket là vài nghìn timer; refill-on-demand không cần tới.
- So {{tokens}} bằng {{==}} với số thực, hoặc nạp token mà quên cập nhật {{lastRefillMs}} — token bị nạp lặp lại nhiều lần.
- Không giới hạn số bucket (mỗi IP một object) → quét IP giả tạo thành memory leak.
- Nhầm rate limit với quota: rate limit chặn tần suất, quota chặn tổng lượng trong kỳ (ví dụ 10.000 lượt gọi mỗi tháng).

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

Sai lầm kinh điển là dùng {{System.currentTimeMillis}} bên trong: test phải {{Thread.sleep}} nên chậm và hay fail trên CI, đồng thời bạn không thể mô phỏng được đồng hồ nhảy cóc hay chạy lùi — mà NTP thật sự có thể chỉnh lùi đồng hồ hệ thống. Xử lý bằng cách bỏ qua khi {{nowMs <= lastRefillMs}}: không tin đồng hồ đi ngược, bucket giữ nguyên số token.

Về số thực: test dùng rate 1000 token/giây nên {{refillPerMs = 1.0}} và mọi giá trị đều là số nguyên chính xác. Với rate như 3 token/giây ({{0.003}} mỗi ms), {{tokens}} sẽ có sai số làm tròn nhỏ, nên đừng so {{tokens}} bằng {{==}}; production hay lưu token theo đơn vị nguyên nhỏ hơn (ví dụ "milli-token" kiểu {{long}}) để tránh hẳn sai số. Lưu ý thêm: constructor nhận {{long tokensPerSecond}} nên không biểu diễn được "100 request/phút" (1,67 token/giây); bản thật nên nhận cặp {{(tokens, Duration)}} như Bucket4j.`,
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
        clock = Math.max(nowMs, clock);      // đồng hồ lùi: cửa sổ đóng băng
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
      explain: `Sliding window log chính xác tuyệt đối vì bạn giữ **mỗi** timestamp thay vì đếm theo khung cố định: không còn hiện tượng "100 request cuối cửa sổ trước + 100 request đầu cửa sổ sau" cùng lọt qua trong vài giây quanh ranh giới như fixed window. Đổi lại, bộ nhớ tỉ lệ với số request trong cửa sổ, nên phải prune đều tay — {{while}} ở đầu deque là O(1) amortised cho mỗi request vì mỗi timestamp chỉ bị xoá đúng một lần.

Điều kiện hết hạn quyết định hành vi ở ranh giới: với {{nowMs - t >= windowMs}}, hit tại mốc 0 ms hết hạn ngay khi đồng hồ chạm 1000 ms. Chọn {{>}} hay {{>=}} phải nhất quán ở mọi nơi (code, test, tài liệu cho client), nếu không sẽ lệch một request ở ranh giới.

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
      explain: `Sau 1 giây, bucket nạp {{5 × 1}} = 5 token, đi từ 0 lên 5 — chưa chạm trần 10 nên không bị cắt. Capacity = 10 chỉ có nghĩa bucket **có thể** chứa tới 10 token nếu bạn chờ đủ lâu (2 giây để đầy); nó không phải tốc độ nạp. Nạp không phụ thuộc thời gian hệ thống vì refill dùng đúng thời gian bạn truyền vào, nên phương án "không xác định" sai.`,
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
  related: ['security-014', 'security-001'],
  tags: ['rate limit', 'token bucket', 'sliding window', '429'],
},
{
  id: 'lesson-security-004',
  track: 'security',
  order: 4,
  title: 'Session phía server: cookie sid, CSRF token, session fixation và phiên anonymous',
  level: 'senior',
  minutes: 55,
  goals: [
    'Giải thích được session phía server hoạt động thế nào (cookie sid, store, TTL) và Spring Session đổi chỗ lưu sang Redis ra sao',
    'Tự viết được {{resolve}} cho mỗi request: hết hạn, tenant bị khoá, CSRF token, phiên anonymous — trả 401/403 đúng chỗ, không bao giờ NPE thành 500',
    'Giải thích và triển khai được chống session fixation bằng cách đổi sid sau đăng nhập',
    'Sinh sid và CSRF token đủ ngẫu nhiên bằng {{SecureRandom}} và so token bằng constant-time',
  ],
  body: `**Tóm tắt:** Session phía server = trình duyệt chỉ giữ một **sid ngẫu nhiên** trong cookie, còn dữ liệu phiên (ai đăng nhập, quyền gì, hết hạn lúc nào) nằm trong store của server. Mỗi request, server **resolve** sid thành phiên rồi kiểm tra: còn hạn không, tài khoản/tenant có bị khoá không, CSRF token có khớp không, đã đăng nhập chưa. Sau khi đăng nhập phải **đổi sid** (chống session fixation). Bài tập tự viết một {{SessionStore}} bằng Java thuần để thấy từng bước.

### Session phía server hoạt động thế nào
1. Người dùng mở trang lần đầu: server tạo phiên, sinh **sid** (session id) ngẫu nhiên, lưu {{sid -> dữ liệu phiên}} trong store, rồi gửi về {{Set-Cookie: SESSION=<sid>; HttpOnly; Secure; SameSite=Lax}}.
2. Mỗi request sau, trình duyệt **tự động** gửi kèm cookie đó. Server tra sid trong store để biết "đây là ai".
3. Phiên có hạn: **idle timeout** (không hoạt động 30 phút thì hết) và nên có thêm **absolute timeout** (tối đa 8–12 giờ kể từ lúc đăng nhập, dù vẫn hoạt động).

Vì sid là "chìa khoá" duy nhất, nó phải **không đoán được**: sinh từ {{SecureRandom}} với ít nhất 128 bit ngẫu nhiên. Một sid kiểu {{sid-1}}, {{sid-2}} (tăng dần) cho phép attacker đoán phiên của người khác.

Các cờ cookie quan trọng:
- {{HttpOnly}}: JavaScript không đọc được cookie → XSS khó lấy trộm sid.
- {{Secure}}: chỉ gửi qua HTTPS.
- {{SameSite=Lax}}: trình duyệt không gửi cookie trong request POST xuất phát từ site khác → chặn phần lớn CSRF ngay từ trình duyệt.

### Spring làm gì cho bạn
- Mặc định {{HttpSession}} nằm trong RAM của Tomcat. Chạy nhiều instance sau load balancer thì request sang instance khác sẽ "mất phiên". **Spring Session** ({{spring-session-data-redis}}) giải quyết **trong suốt**: một filter ({{SessionRepositoryFilter}}) bọc request để {{HttpSession}} đọc/ghi Redis, code của bạn vẫn dùng {{HttpSession}} như cũ.
- Spring Security lưu {{SecurityContext}} (thông tin đăng nhập) vào session qua {{HttpSessionSecurityContextRepository}}. Request chưa đăng nhập vẫn có một {{AnonymousAuthenticationToken}} do {{AnonymousAuthenticationFilter}} đặt vào, nên code không phải xử lý null — nhưng code tự viết (filter riêng, store riêng) thì phải tự lo.
- **Session fixation**: mặc định Spring Security gọi {{HttpServletRequest.changeSessionId()}} ngay sau khi đăng nhập thành công (chiến lược {{changeSessionId}}).
- **CSRF**: bật mặc định cho mọi request làm thay đổi trạng thái (POST/PUT/PATCH/DELETE); token lưu trong session ({{HttpSessionCsrfTokenRepository}}), từ Spring Security 6 token gửi xuống được "trộn" ngẫu nhiên ({{XorCsrfTokenRequestAttributeHandler}}) để chống tấn công BREACH. API thuần JWT không dùng cookie thì không cần CSRF.

Bài tập mô phỏng chính phần "store + resolve" đó bằng Java thuần, để bạn hiểu framework đang kiểm tra gì cho mình.

### resolve: thứ tự kiểm tra và mã lỗi
{{resolve(request, nowMs)}} chạy cho mỗi request, theo thứ tự:

| Bước | Điều kiện | Kết quả |
|---|---|---|
| 1 | không có cookie sid, hoặc sid không có trong store | 401 |
| 2 | phiên đã hết hạn ({{nowMs >= expiryMs}}) | xoá phiên, 401 |
| 3 | tenant (công ty/khách hàng sở hữu tài khoản) đã bị khoá | 401 |
| 4 | CSRF token gửi lên khác token của phiên | 403 |
| 5 | phiên chưa đăng nhập ({{securityContext == null}}) | 401 kèm mã {{ANON}} |
| 6 | mọi thứ hợp lệ | gia hạn phiên, trả phiên |

Vì sao tách 401 và 403? **401 Unauthorized** thực chất nghĩa là "chưa xác thực được bạn là ai" (cần đăng nhập lại); **403 Forbidden** là "biết bạn là ai nhưng không cho làm việc này". CSRF sai là 403 (Spring Security cũng trả 403 cho lỗi CSRF).

Lỗi hay gặp nhất là **không kiểm tra mà dereference luôn**: tenant bị khoá thì {{tenantRepo.find(id)}} trả null, gọi {{tenant.getPlan()}} ném {{NullPointerException}}, người dùng nhận **500**. 500 là sai vì: đây không phải lỗi server mà là trạng thái hợp lệ; client và gateway thường **retry** khi gặp 5xx; alert 5xx kêu liên tục làm đội trực mất tập trung; và trang lỗi mặc định có thể lộ stack trace.

### CSRF token: vì sao cookie thôi là chưa đủ
CSRF (Cross-Site Request Forgery): nạn nhân đang đăng nhập ngân hàng, mở trang độc {{evil.com}}; trang đó tự submit một form POST tới {{bank.com/transfer}}. Trình duyệt **tự gửi kèm cookie** của bank.com, nên server thấy sid hợp lệ. Cách chặn (synchronizer token pattern): mỗi phiên có một **CSRF token** ngẫu nhiên, trang thật nhúng token vào form hoặc header {{X-CSRF-TOKEN}}. evil.com không đọc được token (bị Same-Origin Policy chặn), nên request giả thiếu token → 403. Token là bí mật nên so bằng {{MessageDigest.isEqual}} (constant-time), không dùng {{equals}}.

Bài tập đơn giản hoá: coi mọi request là request làm thay đổi trạng thái nên luôn kiểm CSRF. Thực tế GET/HEAD/OPTIONS không kiểm CSRF (và vì vậy GET không bao giờ được làm thay đổi dữ liệu).

### Session fixation: đổi sid sau đăng nhập
Kịch bản: attacker mở trang đăng nhập, nhận sid {{abc}} (phiên anonymous). Bằng cách nào đó (link chứa sid, subdomain bị chiếm đặt cookie) attacker ép nạn nhân dùng sid {{abc}}. Nạn nhân đăng nhập; nếu server vẫn giữ sid {{abc}} và gắn thông tin đăng nhập vào đó, attacker — vốn biết {{abc}} — giờ có phiên đã đăng nhập của nạn nhân.

Phòng thủ: ngay sau khi đăng nhập thành công, {{afterLogin(oldSid, nowMs)}} tạo **sid mới** (và CSRF token mới), chép dữ liệu cần giữ (tenant, user, attributes), **xoá sid cũ**. Sid attacker biết trở thành vô dụng.

### Phiên anonymous: trạng thái bình thường, không phải lỗi
Phiên được tạo **trước** khi đăng nhập (ví dụ để giữ giỏ hàng, hoặc CSRF token cho form login), nên {{securityContext}} null là chuyện bình thường. Code phải coi đó là "chưa đăng nhập" → trả 401 mã {{ANON}} (thường kèm redirect tới trang login), không được gọi {{securityContext.getAuthorities()}} rồi NPE.

### TTL, gia hạn và đồng hồ truyền vào
Khi tạo: {{expiryMs = nowMs + ttlMs}}. Mỗi lần resolve thành công thì **gia hạn** (idle timeout trượt): {{expiryMs = max(expiryMs cũ, nowMs + ttlMs)}} — lấy max để đồng hồ chạy lùi không làm phiên ngắn lại hay dài ra bất thường. {{nowMs}} được truyền vào thay vì đọc {{System.currentTimeMillis()}} để test tái lập được mọi mốc. Redis làm việc này bằng TTL của key ({{EXPIRE}}); Spring Session gia hạn mỗi khi phiên được truy cập.

### Bẫy production
- Session trong RAM từng instance mà không có sticky session → người dùng bị "đá" ngẫu nhiên. Dùng Spring Session + Redis.
- Sid hoặc CSRF token sinh bằng {{Random}}, {{UUID}} tự ghép từ thời gian, hay số tăng dần → đoán được. Dùng {{SecureRandom}} (≥ 128 bit).
- Không đổi sid sau đăng nhập → session fixation; đổi nhưng không xoá sid cũ → attacker vẫn dùng được.
- Logout chỉ xoá cookie ở trình duyệt mà không xoá phiên trong store → ai đã chụp được sid vẫn dùng tiếp.
- Chỉ có idle timeout: phiên bị chiếm có thể sống mãi nếu attacker gửi request đều đặn; thêm absolute timeout.
- Lưu object lớn hoặc không serialize được vào session → Redis phình, lỗi khi deploy phiên bản mới đổi class.

> Senior tip: khi chuyển từ session trong RAM sang Spring Session Redis, hãy đo kích thước phiên ({{MEMORY USAGE}} trong Redis) và số lần ghi mỗi request — mặc định Spring Session ghi lại thời điểm truy cập mỗi request, với 5.000 request/giây là 5.000 lệnh ghi Redis/giây. Và luôn có một test tự động khẳng định "sid sau login khác sid trước login"; lỗi fixation thường quay lại khi ai đó tự viết endpoint đăng nhập riêng (ví dụ login qua OTP) mà quên gọi {{changeSessionId()}}.

### Liên hệ phỏng vấn
Interviewer hay hỏi: "session fixation là gì và Spring chặn thế nào?", "CSRF là gì, vì sao API dùng JWT trong header không cần CSRF?", "401 và 403 khác nhau thế nào?", "chạy nhiều instance thì session lưu ở đâu?". Làm xong bài tập dưới đây — tự viết {{SessionStore}} với sid ngẫu nhiên, CSRF check, đổi sid sau login — là bạn trả lời được cả bốn câu bằng chính mã của mình.`,
  exercises: [
    {
      title: 'Viết SessionStore: resolve, CSRF, đổi sid sau đăng nhập và phiên anonymous',
      prompt: `Hoàn thiện {{SessionStore}} — một session store trong bộ nhớ mô phỏng cách Spring Session/Spring Security xử lý phiên, chỉ dùng JDK 17. Các lớp {{Session}}, {{Status}}, {{ResolveResult}}, {{Request}} đã cho sẵn ({{Session}} là bất biến: muốn đổi thì tạo object mới và {{put}} lại vào map).

- {{SessionStore(ttlMs)}}: {{ttlMs < 1}} thì ném {{IllegalArgumentException}}.
- {{create(tenantId, userId, nowMs)}}: tạo phiên mới với sid và csrfToken **ngẫu nhiên**: mỗi cái là 32 byte từ {{SecureRandom}}, mã hoá Base64URL không padding (43 ký tự). {{securityContext = null}}, {{expiryMs = nowMs + ttlMs}}; lưu vào map và trả {{Optional.of(session)}}.
- {{get(sid, nowMs)}}: trả phiên nếu tồn tại và chưa hết hạn; hết hạn thì xoá khỏi map và trả {{Optional.empty()}}. Phiên **hết hạn khi {{nowMs >= expiryMs}}**.
- {{renew(sid, nowMs)}}: phiên còn hạn thì đặt {{expiryMs = max(expiryMs cũ, nowMs + ttlMs)}} và trả phiên mới; không có/hết hạn thì {{Optional.empty()}}.
- {{resolve(request, nowMs)}} kiểm tra theo đúng thứ tự trong bài học:
  1. request null, sid null hoặc không có trong store → {{Status(401)}};
  2. hết hạn → xoá phiên, {{Status(401)}};
  3. tenant bị khoá ({{disableTenant}}) → {{Status(401)}};
  4. CSRF token null hoặc khác token của phiên (so bằng {{MessageDigest.isEqual}}) → {{Status(403)}};
  5. {{securityContext == null}} → {{Status(401)}} với {{code = "ANON"}};
  6. hợp lệ → gia hạn như {{renew}}, trả {{ResolveResult(Optional.of(phiên đã gia hạn), null, null)}}.
  Mọi trường hợp lỗi trả {{session = Optional.empty()}}; không bao giờ ném exception.
- {{afterLogin(oldSid, nowMs)}}: nếu oldSid không tồn tại thì {{Optional.empty()}}; ngược lại tạo phiên với **sid mới và csrfToken mới**, giữ tenant/user/securityContext, chép attributes sang một {{HashMap}} mới, {{expiryMs = nowMs + ttlMs}}, xoá sid cũ.
- {{setSecurityContext(sid, ctx)}}: gắn context cho phiên (sau khi xác thực); sid không tồn tại thì bỏ qua.
- {{putAttribute(sid, key, value)}} / {{hasAttributes(sid, key)}}: ghi và kiểm tra thuộc tính phiên; {{hasAttributes}} chỉ đọc, gọi bao nhiêu lần cũng không đổi trạng thái.
- {{disableTenant(tenantId)}} / {{isTenantDisabled(tenantId)}}: khoá tenant và kiểm tra.

Bài coi mọi request là request làm thay đổi trạng thái, nên {{resolve}} luôn kiểm CSRF. Clock do test truyền vào, không dùng thời gian thật.`,
      starter: `import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

final class SessionStore {
    static final class Session {
        public final String sessionId;
        public final String tenantId;
        public final String userId;
        public final Map<String, String> attributes;
        public final long expiryMs;
        public final Object securityContext;
        public final String csrfToken;
        public Session(String sessionId, String tenantId, String userId,
                       Map<String, String> attributes, long expiryMs,
                       Object securityContext, String csrfToken) {
            this.sessionId = sessionId;
            this.tenantId = tenantId;
            this.userId = userId;
            this.attributes = attributes;
            this.expiryMs = expiryMs;
            this.securityContext = securityContext;
            this.csrfToken = csrfToken;
        }
    }
    static final class Status {
        public final int code;
        public Status(int code) { this.code = code; }
    }
    static final class ResolveResult {
        public final Optional<Session> session;
        public final Status status;
        public final String code;
        public ResolveResult(Optional<Session> session, Status status, String code) {
            this.session = session;
            this.status = status;
            this.code = code;
        }
        public boolean ok() { return session.isPresent() && status == null; }
    }
    static final class Request {
        public final String cookieSid;
        public final String csrfToken;
        public Request(String cookieSid, String csrfToken) {
            this.cookieSid = cookieSid;
            this.csrfToken = csrfToken;
        }
    }

    private final SecureRandom random = new SecureRandom();
    private final long ttlMs;
    private final Map<String, Session> sessions = new HashMap<>();
    private final Set<String> disabledTenants = new HashSet<>();

    SessionStore(long ttlMs) {
        this.ttlMs = ttlMs;
        throw new UnsupportedOperationException("TODO");
    }

    void disableTenant(String tenantId) {
        throw new UnsupportedOperationException("TODO");
    }

    boolean isTenantDisabled(String tenantId) {
        throw new UnsupportedOperationException("TODO");
    }

    Optional<Session> create(String tenantId, String userId, long nowMs) {
        throw new UnsupportedOperationException("TODO");
    }

    Optional<Session> get(String sid, long nowMs) {
        throw new UnsupportedOperationException("TODO");
    }

    Optional<Session> renew(String sid, long nowMs) {
        throw new UnsupportedOperationException("TODO");
    }

    ResolveResult resolve(Request req, long nowMs) {
        throw new UnsupportedOperationException("TODO");
    }

    Optional<Session> afterLogin(String oldSid, long nowMs) {
        throw new UnsupportedOperationException("TODO");
    }

    void setSecurityContext(String sid, Object ctx) {
        throw new UnsupportedOperationException("TODO");
    }

    void putAttribute(String sid, String key, String value) {
        throw new UnsupportedOperationException("TODO");
    }

    boolean hasAttributes(String sid, String key) {
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
        if (!java.util.Objects.equals(expected, actual)) throw new AssertionError("expected " + expected + " got " + actual);
    }
    static SessionStore.Session loggedIn(SessionStore store, long nowMs) {
        SessionStore.Session s = store.create("t1", "u1", nowMs).orElseThrow();
        store.setSecurityContext(s.sessionId, "ctx");
        return s;
    }
    public static void main(String[] args) {
        check("create returns session with csrf and ttl", () -> {
            SessionStore store = new SessionStore(1000);
            SessionStore.Session s = store.create("t1", "u1", 0).orElseThrow();
            if (s.sessionId == null || s.csrfToken == null) throw new AssertionError("sid/csrf null");
            eq(1000L, s.expiryMs);
            eq("u1", s.userId);
            if (s.securityContext != null) throw new AssertionError("context phai null khi tao");
        });
        check("sid and csrf are 32 random bytes in base64url", () -> {
            SessionStore store = new SessionStore(1000);
            Set<String> seen = new HashSet<>();
            for (int i = 0; i < 50; i++) {
                SessionStore.Session s = store.create("t1", "u" + i, 0).orElseThrow();
                for (String v : new String[] { s.sessionId, s.csrfToken }) {
                    if (!v.matches("[A-Za-z0-9_-]{43}")) throw new AssertionError("khong phai base64url 43 ky tu: " + v);
                    if (!seen.add(v)) throw new AssertionError("trung gia tri: " + v);
                }
            }
        });
        check("resolve valid session renews expiry exactly", () -> {
            SessionStore store = new SessionStore(1000);
            SessionStore.Session s = loggedIn(store, 0);
            SessionStore.ResolveResult r = store.resolve(new SessionStore.Request(s.sessionId, s.csrfToken), 100);
            if (!r.ok()) throw new AssertionError("resolve phai ok");
            eq(s.sessionId, r.session.get().sessionId);
            eq(1100L, r.session.get().expiryMs);
            SessionStore.ResolveResult back = store.resolve(new SessionStore.Request(s.sessionId, s.csrfToken), 50);
            eq(1100L, back.session.get().expiryMs);          // dong ho lui: khong rut ngan
        });
        check("tenant disabled returns 401 not 500", () -> {
            SessionStore store = new SessionStore(1000);
            SessionStore.Session s = loggedIn(store, 0);
            store.disableTenant("t1");
            eq(true, store.isTenantDisabled("t1"));
            SessionStore.ResolveResult r = store.resolve(new SessionStore.Request(s.sessionId, s.csrfToken), 10);
            if (r.session.isPresent()) throw new AssertionError("session phai rong");
            eq(401, r.status.code);
        });
        check("csrf mismatch or missing returns 403", () -> {
            SessionStore store = new SessionStore(1000);
            SessionStore.Session s = loggedIn(store, 0);
            SessionStore.ResolveResult r = store.resolve(new SessionStore.Request(s.sessionId, "wrong-csrf"), 10);
            if (r.session.isPresent()) throw new AssertionError("session phai rong");
            eq(403, r.status.code);
            eq(403, store.resolve(new SessionStore.Request(s.sessionId, null), 10).status.code);
        });
        check("unknown or missing sid returns 401", () -> {
            SessionStore store = new SessionStore(1000);
            eq(401, store.resolve(new SessionStore.Request("khong-co", "x"), 0).status.code);
            eq(401, store.resolve(new SessionStore.Request(null, "x"), 0).status.code);
            eq(401, store.resolve(null, 0).status.code);
        });
        check("session fixation: login rotates sid and csrf", () -> {
            SessionStore store = new SessionStore(1000);
            SessionStore.Session s = loggedIn(store, 0);
            store.putAttribute(s.sessionId, "cart", "3 items");
            SessionStore.Session rotated = store.afterLogin(s.sessionId, 5).orElseThrow();
            if (rotated.sessionId.equals(s.sessionId)) throw new AssertionError("sid phai doi");
            if (rotated.csrfToken.equals(s.csrfToken)) throw new AssertionError("csrf phai doi");
            eq(s.userId, rotated.userId);
            eq(1005L, rotated.expiryMs);
            eq(true, store.hasAttributes(rotated.sessionId, "cart"));
            SessionStore.ResolveResult oldResolve = store.resolve(new SessionStore.Request(s.sessionId, s.csrfToken), 5);
            if (oldResolve.session.isPresent()) throw new AssertionError("sid cu phai het hieu luc");
            eq(401, oldResolve.status.code);
            if (!store.resolve(new SessionStore.Request(rotated.sessionId, rotated.csrfToken), 5).ok()) throw new AssertionError("sid moi phai hop le");
            eq(false, store.afterLogin("khong-co", 5).isPresent());
        });
        check("anonymous session returns 401 ANON", () -> {
            SessionStore store = new SessionStore(1000);
            SessionStore.Session s = store.create("t1", "u1", 0).get();
            SessionStore.ResolveResult r = store.resolve(new SessionStore.Request(s.sessionId, s.csrfToken), 10);
            if (r.session.isPresent()) throw new AssertionError("session phai rong");
            eq(401, r.status.code);
            eq("ANON", r.code);
        });
        check("expiry boundary: nowMs == expiryMs is expired and removed", () -> {
            SessionStore store = new SessionStore(1000);
            SessionStore.Session s = loggedIn(store, 0);
            eq(true, store.get(s.sessionId, 999).isPresent());
            SessionStore.ResolveResult r = store.resolve(new SessionStore.Request(s.sessionId, s.csrfToken), 1000);
            if (r.session.isPresent()) throw new AssertionError("session phai rong");
            eq(401, r.status.code);
            eq(false, store.get(s.sessionId, 0).isPresent());   // da bi xoa khoi store
        });
        check("renew never shortens expiry", () -> {
            SessionStore store = new SessionStore(1000);
            SessionStore.Session s = store.create("t1", "u1", 0).get();
            eq(1500L, store.renew(s.sessionId, 500).orElseThrow().expiryMs);
            eq(1500L, store.renew(s.sessionId, 200).orElseThrow().expiryMs);
            eq(false, store.renew(s.sessionId, 1500).isPresent());
        });
        check("hasAttributes is read-only", () -> {
            SessionStore store = new SessionStore(1000);
            SessionStore.Session s = store.create("t1", "u1", 0).get();
            store.putAttribute(s.sessionId, "email", "a@b.com");
            eq(true, store.hasAttributes(s.sessionId, "email"));
            eq(true, store.hasAttributes(s.sessionId, "email"));
            eq(false, store.hasAttributes(s.sessionId, "nope"));
            eq(false, store.hasAttributes("khong-co", "email"));
        });
        check("invalid ttl is rejected", () -> {
            try { new SessionStore(0); }
            catch (IllegalArgumentException e) { return; }
            throw new AssertionError("ttl 0 phai nem IllegalArgumentException");
        });
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
      reference: `import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

final class SessionStore {
    static final class Session {
        public final String sessionId;
        public final String tenantId;
        public final String userId;
        public final Map<String, String> attributes;
        public final long expiryMs;
        public final Object securityContext;
        public final String csrfToken;
        public Session(String sessionId, String tenantId, String userId,
                       Map<String, String> attributes, long expiryMs,
                       Object securityContext, String csrfToken) {
            this.sessionId = sessionId;
            this.tenantId = tenantId;
            this.userId = userId;
            this.attributes = attributes;
            this.expiryMs = expiryMs;
            this.securityContext = securityContext;
            this.csrfToken = csrfToken;
        }
    }
    static final class Status {
        public final int code;
        public Status(int code) { this.code = code; }
    }
    static final class ResolveResult {
        public final Optional<Session> session;
        public final Status status;
        public final String code;
        public ResolveResult(Optional<Session> session, Status status, String code) {
            this.session = session;
            this.status = status;
            this.code = code;
        }
        public boolean ok() { return session.isPresent() && status == null; }
    }
    static final class Request {
        public final String cookieSid;
        public final String csrfToken;
        public Request(String cookieSid, String csrfToken) {
            this.cookieSid = cookieSid;
            this.csrfToken = csrfToken;
        }
    }

    private final SecureRandom random = new SecureRandom();
    private final long ttlMs;
    private final Map<String, Session> sessions = new HashMap<>();
    private final Set<String> disabledTenants = new HashSet<>();

    SessionStore(long ttlMs) {
        if (ttlMs < 1) throw new IllegalArgumentException("ttl phai >= 1");
        this.ttlMs = ttlMs;
    }

    void disableTenant(String tenantId) { disabledTenants.add(tenantId); }
    boolean isTenantDisabled(String tenantId) { return disabledTenants.contains(tenantId); }

    private String randomToken() {                       // 256 bit, không đoán được
        byte[] b = new byte[32];
        random.nextBytes(b);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(b);
    }

    private static boolean expired(Session s, long nowMs) { return nowMs >= s.expiryMs; }

    private Session withExpiry(Session s, long expiryMs) {
        return new Session(s.sessionId, s.tenantId, s.userId, s.attributes, expiryMs, s.securityContext, s.csrfToken);
    }

    Optional<Session> create(String tenantId, String userId, long nowMs) {
        Session s = new Session(randomToken(), tenantId, userId, new HashMap<>(), nowMs + ttlMs, null, randomToken());
        sessions.put(s.sessionId, s);
        return Optional.of(s);
    }

    Optional<Session> get(String sid, long nowMs) {
        Session s = sid == null ? null : sessions.get(sid);
        if (s == null) return Optional.empty();
        if (expired(s, nowMs)) { sessions.remove(sid); return Optional.empty(); }
        return Optional.of(s);
    }

    Optional<Session> renew(String sid, long nowMs) {
        return get(sid, nowMs).map(s -> {
            Session renewed = withExpiry(s, Math.max(s.expiryMs, nowMs + ttlMs));   // khong bao gio rut ngan
            sessions.put(sid, renewed);
            return renewed;
        });
    }

    ResolveResult resolve(Request req, long nowMs) {
        if (req == null || req.cookieSid == null) return fail(401, null);
        Optional<Session> found = get(req.cookieSid, nowMs);        // không có hoặc hết hạn (đã xóa)
        if (found.isEmpty()) return fail(401, null);
        Session s = found.get();
        if (disabledTenants.contains(s.tenantId)) return fail(401, null);   // kiểm tra trước, không NPE
        if (req.csrfToken == null || !MessageDigest.isEqual(
                s.csrfToken.getBytes(StandardCharsets.UTF_8), req.csrfToken.getBytes(StandardCharsets.UTF_8))) {
            return fail(403, null);                                  // constant-time
        }
        if (s.securityContext == null) return fail(401, "ANON");     // anonymous la binh thuong
        return new ResolveResult(renew(s.sessionId, nowMs), null, null);
    }

    private static ResolveResult fail(int status, String code) {
        return new ResolveResult(Optional.empty(), new Status(status), code);
    }

    Optional<Session> afterLogin(String oldSid, long nowMs) {
        Session old = oldSid == null ? null : sessions.remove(oldSid);   // xoa sid cu ngay
        if (old == null) return Optional.empty();
        Session rotated = new Session(randomToken(), old.tenantId, old.userId, new HashMap<>(old.attributes),
                nowMs + ttlMs, old.securityContext, randomToken());     // sid moi + csrf moi
        sessions.put(rotated.sessionId, rotated);
        return Optional.of(rotated);
    }

    void setSecurityContext(String sid, Object ctx) {
        Session s = sessions.get(sid);
        if (s == null) return;
        sessions.put(sid, new Session(s.sessionId, s.tenantId, s.userId, s.attributes, s.expiryMs, ctx, s.csrfToken));
    }

    void putAttribute(String sid, String key, String value) {
        Session s = sessions.get(sid);
        if (s != null) s.attributes.put(key, value);
    }

    boolean hasAttributes(String sid, String key) {
        Session s = sessions.get(sid);
        return s != null && s.attributes.containsKey(key);
    }
}`,
      hints: [
        'Sinh sid/token: {{byte[] b = new byte[32]; random.nextBytes(b);}} rồi {{Base64.getUrlEncoder().withoutPadding().encodeToString(b)}}. Đừng dùng số tăng dần — attacker đoán được phiên của người khác.',
        'Viết {{get}} trước (kiểm hết hạn bằng {{nowMs >= expiryMs}} và xoá), rồi để {{renew}} và {{resolve}} gọi lại {{get}}; một chỗ duy nhất định nghĩa "hết hạn" thì không lệch biên.',
        '{{resolve}}: kiểm tra tenant **trước** khi dùng tới nó; CSRF so bằng {{MessageDigest.isEqual}} trên {{getBytes(StandardCharsets.UTF_8)}} của hai chuỗi, nhớ chặn {{null}} trước.',
        '{{afterLogin}}: {{sessions.remove(oldSid)}} trả về phiên cũ (hoặc null) — vừa lấy dữ liệu vừa xoá sid cũ trong một bước; phiên mới cần cả sid mới lẫn csrfToken mới.',
        'Gia hạn bằng {{Math.max(s.expiryMs, nowMs + ttlMs)}} để đồng hồ chạy lùi không rút ngắn phiên.',
      ],
      explain: `Các điểm then chốt:
- **Sid không đoán được**: 32 byte {{SecureRandom}} = 256 bit; attacker không thể dò. Sid kiểu {{sid-1}}, {{sid-2}} thì chỉ cần thử vài số là chiếm được phiên người khác. Tomcat và Spring Session đều sinh sid từ {{SecureRandom}}.
- **Thứ tự kiểm tra**: hết hạn → tenant → CSRF → đăng nhập. Mọi nhánh lỗi trả 401/403 có chủ đích, không để exception rơi ra thành 500.
- **CSRF so constant-time**: token là bí mật, nên dùng {{MessageDigest.isEqual}}; {{equals}} thoát sớm ở ký tự khác đầu tiên.
- **Session fixation**: {{afterLogin}} xoá sid cũ và cấp sid + CSRF token mới. Nếu chỉ tạo sid mới mà quên xoá sid cũ thì attacker vẫn dùng được sid cũ — test "sid cu phai het hieu luc" bắt đúng lỗi này.
- **Một định nghĩa hết hạn**: dùng {{get}} làm cửa duy nhất; nếu {{get}} dùng {{>}} còn {{resolve}} dùng {{>=}} thì tại đúng mốc expiry hai hàm cho kết quả trái nhau.

Lỗi hay gặp: dùng số tăng dần, {{Random}} hay {{UUID.randomUUID().toString().substring(0, 8)}} (chỉ còn 32 bit) cho sid — đều dò được; renew bằng {{nowMs + ttlMs}} không lấy max nên đồng hồ lùi làm phiên ngắn lại; quên xoá phiên hết hạn khỏi map làm bộ nhớ phình dần. Trong Spring thật, bạn không viết lớp này — nhưng hiểu nó giúp bạn đọc đúng cấu hình {{sessionManagement()}}, {{csrf()}} và debug khi người dùng "tự dưng bị đăng xuất".`,
    },
  ],
  check: [
    {
      q: 'Tenant của người dùng vừa bị khoá. Request tiếp theo của họ nên nhận mã nào, và vì sao không để thành HTTP 500?',
      options: [
        '500, vì đó là lỗi bất thường cần báo động',
        '401 (hoặc 403): đây là trạng thái hợp lệ cần từ chối có chủ đích; 500 nghĩa là lỗi server, kích hoạt retry và alert sai, có thể lộ stack trace',
        '404, vì Spring Security luôn trả 404 cho tenant bị khoá',
        '200 với body rỗng để không lộ thông tin',
      ],
      answer: 1,
      explain: `Tài khoản/tenant bị khoá là tình huống nghiệp vụ đã biết trước, nên phải từ chối có chủ đích bằng 4xx (Spring Security ném {{DisabledException}} khi đăng nhập tài khoản bị khoá, kết quả là 401). 500 là sai: nó nói "server hỏng", khiến client/gateway retry, alert 5xx kêu sai và trang lỗi có thể lộ stack trace. Spring Security không có quy tắc trả 404 cho trường hợp này; còn trả 200 rỗng làm client tưởng thành công và che mất lỗi.`,
    },
    {
      q: 'Session fixation attack được chặn bằng cách nào?',
      options: [
        'Đặt cookie HttpOnly',
        'Cấp sid mới ngay sau khi đăng nhập thành công và huỷ sid cũ',
        'Mã hoá cookie bằng AES',
        'Tăng TTL của session',
      ],
      answer: 1,
      explain: `Trong fixation, attacker **biết trước** sid (vì chính họ ép nạn nhân dùng sid đó) rồi chờ nạn nhân đăng nhập trên sid ấy. Đổi sid sau đăng nhập và huỷ sid cũ làm sid attacker biết trở nên vô dụng — Spring Security làm việc này mặc định bằng {{changeSessionId()}}. HttpOnly chỉ chặn JavaScript đọc cookie (chống XSS lấy sid), không ngăn attacker đã biết sid từ trước; mã hoá cookie không giúp gì vì attacker dùng nguyên giá trị cookie đã mã hoá; tăng TTL còn làm cửa sổ tấn công dài hơn.`,
    },
    {
      q: 'Request tới với sid hợp lệ nhưng phiên chưa đăng nhập ({{securityContext}} null). Code nên xử lý thế nào?',
      options: [
        'Gọi {{securityContext.getAuthorities()}} như bình thường; nếu NPE thì framework sẽ trả 500',
        'Bỏ qua kiểm tra và cho request đi tiếp',
        'Coi đây là trạng thái anonymous bình thường: trả 401 (mã ANON, thường kèm chuyển tới trang đăng nhập) và dừng',
        'Tự tạo context mặc định với quyền ADMIN để tránh lỗi',
      ],
      answer: 2,
      explain: `Phiên được tạo trước khi đăng nhập (giỏ hàng, CSRF token của form login), nên context null là bình thường và phải được xử lý tường minh: trả 401/chuyển tới đăng nhập. Để NPE thành 500 là sai mã lỗi và gây alert giả; cho request đi tiếp là bỏ qua xác thực (lỗ hổng Broken Access Control); tự gán ADMIN là leo thang đặc quyền nghiêm trọng nhất có thể. Spring Security giải quyết bằng {{AnonymousAuthenticationToken}} để code không bao giờ gặp null.`,
    },
  ],
  related: ['security-006', 'security-023', 'security-015'],
  tags: ['session', 'CSRF', 'session fixation', 'security context'],
},
{
  id: 'lesson-security-005',
  track: 'security',
  order: 5,
  title: 'Phân quyền RBAC theo domain và theo đối tượng: deny-by-default, tách quyền grant, chống IDOR',
  level: 'senior',
  minutes: 45,
  goals: [
    'Thiết kế được ma trận quyền role × domain × action, mặc định từ chối (deny-by-default) và có ngoại lệ riêng cho domain nhạy cảm',
    'Giải thích được vì sao quyền grant/delete phải tách khỏi quyền write (separation of duties, chống leo thang quyền)',
    'Phân biệt kiểm tra quyền theo chức năng (role) với kiểm tra theo đối tượng (tenant, chủ sở hữu) và chặn được lỗi IDOR/BOLA',
    'Viết test **duyệt toàn bộ ma trận** để bắt lỗi copy-paste rule giữa các domain',
  ],
  body: `**Tóm tắt:** Broken Access Control đứng **số 1** trong OWASP Top 10 (2021). Kiểm tra quyền đúng gồm hai tầng: (1) **role được làm action này trên loại tài nguyên này không** (ma trận RBAC, mặc định từ chối), và (2) **người này có được đụng vào đúng bản ghi này không** (cùng tenant, là chủ sở hữu) — thiếu tầng 2 là lỗi IDOR. Quyền cấp quyền (grant) phải tách khỏi quyền sửa dữ liệu để không ai tự leo thang. Ma trận phải được test **từng ô một**.

### RBAC: role, action, domain
RBAC (Role-Based Access Control) gán quyền cho **role**, rồi gán role cho người dùng. Bài này dùng 4 role, 4 action và 3 domain (loại tài nguyên):

- Role: {{OWNER}} (chủ tổ chức), {{ADMIN}} (quản trị: quản lý người dùng, dọn dẹp), {{STEWARD}} (người nhập liệu/vận hành), {{USER}} (người dùng thường).
- Action: {{READ}}, {{WRITE}} (tạo/sửa dữ liệu nghiệp vụ), {{DELETE}}, {{GRANT}} (cấp/thu hồi role cho người khác).
- Domain: {{PROJECT}}, {{VM}}, {{BILLING}}.

Ma trận mặc định (áp cho PROJECT và VM):

| Role | READ | WRITE | DELETE | GRANT |
|---|---|---|---|---|
| OWNER | ✓ | ✓ | ✓ | ✓ |
| ADMIN | ✓ | ✗ | ✓ | ✓ |
| STEWARD | ✓ | ✓ | ✗ | ✗ |
| USER | ✓ | ✗ | ✗ | ✗ |

**BILLING** nhạy cảm hơn nên có ngoại lệ: chỉ OWNER được WRITE (STEWARD không), và USER không được READ. Đây chính là lý do ma trận phải là **role × domain × action** chứ không chỉ role × action.

### Deny-by-default
Mọi thứ không được cho phép tường minh thì bị từ chối: role null, action lạ, domain mới thêm mà chưa cấu hình — đều trả false. Viết ngược lại ("chặn ADMIN write billing, còn lại cho qua") thì mỗi domain/role mới thêm vào sẽ **mặc định có quyền**, và lỗ hổng xuất hiện mà không ai để ý. Trong Spring Security 6, cấu hình nên kết thúc bằng {{.anyRequest().denyAll()}} hoặc {{.anyRequest().authenticated()}}, không bao giờ {{permitAll()}}.

Cách cài đặt gọn: một {{EnumMap<Role, EnumSet<Action>>}} cho ma trận mặc định, cộng một vài dòng ngoại lệ cho BILLING. Dữ liệu dạng bảng dễ review hơn một rừng {{if}} lồng nhau.

### Tách quyền: grant và delete không đi kèm write
Vì sao ADMIN không được WRITE, còn STEWARD không được GRANT?
- Nếu STEWARD có GRANT, họ tự cấp ADMIN hoặc OWNER cho mình → **leo thang quyền** (privilege escalation).
- Nếu một người vừa sửa được dữ liệu vừa xoá được dấu vết và tự cấp quyền, thì không còn ai kiểm soát ai. Nguyên tắc **separation of duties** (phân tách nhiệm vụ) trong ngân hàng/kế toán: người nhập liệu không phải người duyệt/xoá.
- **Least privilege** (quyền tối thiểu): mỗi role chỉ có đúng quyền cần cho công việc.

### Kiểm tra theo đối tượng: tenant và chủ sở hữu (IDOR)
Ma trận chỉ trả lời "USER có được READ VM không" — có. Nhưng USER A có được đọc VM của USER B không? Ma trận không biết. Endpoint {{GET /vms/1042}} chỉ kiểm role mà không kiểm chủ sở hữu thì ai đổi id trên URL là đọc được VM người khác. Lỗi này gọi là **IDOR** (Insecure Direct Object Reference), trong OWASP API Security gọi là **BOLA** (Broken Object Level Authorization) — lỗi API phổ biến nhất.

Vì vậy hàm {{check(principal, resource, action)}} làm theo thứ tự:
1. Thiếu thông tin (null) → từ chối.
2. **Khác tenant** → từ chối, kể cả OWNER/ADMIN: OWNER công ty A không có quyền gì ở công ty B.
3. Ma trận role × domain × action không cho → từ chối.
4. Role USER chỉ được đụng tài nguyên **của chính mình** ({{ownerId}} bằng {{userId}}).

Trong Spring: tầng 1 là {{@PreAuthorize("hasRole('ADMIN')")}} hoặc {{authorizeHttpRequests}}; tầng 2 phải viết thêm, ví dụ {{@PreAuthorize("@vmAuthz.canRead(authentication, #id)")}} gọi một bean tự viết, hoặc lọc ngay trong query ({{WHERE tenant_id = :tenant AND owner_id = :user}}). Đổi ID tự tăng sang UUID **không** sửa được IDOR — chỉ làm khó đoán hơn.

### Test toàn bộ ma trận để bắt lỗi copy-paste
Lỗi kinh điển: viết rule cho PROJECT, copy sang BILLING rồi quên sửa một dòng — ví dụ STEWARD vẫn WRITE được BILLING. Test kiểu "OWNER write được" vài case sẽ không bắt được. Cách chắc chắn: viết **bảng kỳ vọng đầy đủ** (4 role × 3 domain × 4 action = 48 ô) ngay trong test, rồi duyệt hết và so từng ô. Bất kỳ ô nào lệch (do copy-paste, do thêm role mới) đều làm test đỏ, và message chỉ đúng ô sai.

~~~java
for (Role r : Role.values())
    for (Domain d : Domain.values()) {
        String actual = perms(r, d);              // ví dụ "RW" cho STEWARD + PROJECT
        assertEquals(EXPECTED.get(r + "/" + d), actual, r + " tren " + d);
    }
~~~

### Bẫy production
- Kiểm quyền chỉ ở frontend (ẩn nút) mà API không kiểm → gọi thẳng API là qua.
- Chỉ kiểm role, không kiểm tenant/chủ sở hữu → IDOR.
- Viết rule kiểu "chặn những gì sai" thay vì "chỉ cho những gì đúng" → role/domain mới mặc định có quyền.
- Cache quyền trong session/JWT mà không làm mới khi role bị thu hồi → người bị thu hồi vẫn dùng quyền cũ tới khi token hết hạn.
- Không ghi audit log khi grant/revoke → không truy vết được ai cấp quyền cho ai.

> Senior tip: với hệ thống nhiều tenant, hãy đặt điều kiện tenant ở **tầng truy vấn** (Hibernate filter, Postgres Row-Level Security hoặc repository luôn nhận tenantId) thay vì trông vào việc mọi lập trình viên nhớ kiểm tra trong service. Trong các đợt pentest, lỗi IDOR/BOLA gần như luôn nằm ở endpoint mới thêm sau cùng — nơi người viết quên gọi hàm check.

### Liên hệ phỏng vấn
Interviewer hay hỏi: "RBAC khác ABAC thế nào?", "làm sao chặn user A xem đơn hàng của user B?", "vì sao quyền grant phải tách riêng?", "bạn test phân quyền thế nào để không sót?". Làm xong bài tập dưới đây — tự viết {{AccessChecker}} với ma trận deny-by-default, ngoại lệ BILLING, kiểm tenant và chủ sở hữu — là bạn trả lời được cả bốn câu bằng chính mã của mình.`,
  exercises: [
    {
      title: 'Viết AccessChecker: ma trận role × domain × action, cô lập tenant và chống IDOR',
      prompt: `Hoàn thiện {{AccessChecker}} (chỉ dùng JDK 17). Các enum và record đã cho sẵn.

**1. {{allowed(role, domain, action)}}** — ma trận quyền, mặc định từ chối:
- Ma trận mặc định (PROJECT, VM): OWNER được READ, WRITE, DELETE, GRANT; ADMIN được READ, DELETE, GRANT; STEWARD được READ, WRITE; USER chỉ READ.
- Ngoại lệ BILLING: chỉ OWNER được WRITE; USER không được gì (kể cả READ). Các ô khác giống ma trận mặc định.
- Bất kỳ tham số nào null → false.

**2. {{check(principal, resource, action)}}** — kiểm tra đầy đủ cho một request:
- principal, resource hoặc action null → false;
- {{principal.tenantId()}} null hoặc khác {{resource.tenantId()}} → false (kể cả OWNER);
- {{allowed(principal.role(), resource.domain(), action)}} false → false;
- role USER: chỉ true khi {{resource.ownerId()}} bằng {{principal.userId()}} (khác null);
- còn lại → true.`,
      starter: `final class AccessChecker {
    enum Role { OWNER, STEWARD, ADMIN, USER }
    enum Action { READ, WRITE, DELETE, GRANT }
    enum Domain { PROJECT, BILLING, VM }
    record Principal(String userId, String tenantId, Role role) {}
    record Resource(Domain domain, String tenantId, String ownerId) {}

    static boolean allowed(Role role, Domain domain, Action action) {
        throw new UnsupportedOperationException("TODO");
    }

    static boolean check(Principal principal, Resource resource, Action action) {
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
    static void eq(Object expected, Object actual, String msg) {
        if (!Objects.equals(expected, actual)) throw new AssertionError(msg + ": expected " + expected + " got " + actual);
    }
    // chữ cái đầu của các action được phép, theo thứ tự READ, WRITE, DELETE, GRANT
    static String perms(AccessChecker.Role r, AccessChecker.Domain d) {
        StringBuilder sb = new StringBuilder();
        for (AccessChecker.Action a : AccessChecker.Action.values())
            if (AccessChecker.allowed(r, d, a)) sb.append(a.name().charAt(0));
        return sb.toString();
    }
    static final Map<String, String> EXPECTED = new HashMap<>();
    static {
        for (String d : new String[] { "PROJECT", "VM" }) {
            EXPECTED.put("OWNER/" + d, "RWDG");
            EXPECTED.put("ADMIN/" + d, "RDG");
            EXPECTED.put("STEWARD/" + d, "RW");
            EXPECTED.put("USER/" + d, "R");
        }
        EXPECTED.put("OWNER/BILLING", "RWDG");
        EXPECTED.put("ADMIN/BILLING", "RDG");
        EXPECTED.put("STEWARD/BILLING", "R");
        EXPECTED.put("USER/BILLING", "");
    }
    static AccessChecker.Principal p(String user, String tenant, AccessChecker.Role role) {
        return new AccessChecker.Principal(user, tenant, role);
    }
    static AccessChecker.Resource res(AccessChecker.Domain d, String tenant, String owner) {
        return new AccessChecker.Resource(d, tenant, owner);
    }
    public static void main(String[] args) {
        check("full matrix: all 48 cells match the expected table", () -> {
            for (AccessChecker.Role r : AccessChecker.Role.values())
                for (AccessChecker.Domain d : AccessChecker.Domain.values())
                    eq(EXPECTED.get(r + "/" + d), perms(r, d), r + " tren " + d);
        });
        check("billing is stricter than project (no copy-paste leak)", () -> {
            eq(true, AccessChecker.allowed(AccessChecker.Role.STEWARD, AccessChecker.Domain.PROJECT, AccessChecker.Action.WRITE), "STEWARD write PROJECT");
            eq(false, AccessChecker.allowed(AccessChecker.Role.STEWARD, AccessChecker.Domain.BILLING, AccessChecker.Action.WRITE), "STEWARD write BILLING");
            eq(false, AccessChecker.allowed(AccessChecker.Role.USER, AccessChecker.Domain.BILLING, AccessChecker.Action.READ), "USER read BILLING");
            eq(true, AccessChecker.allowed(AccessChecker.Role.OWNER, AccessChecker.Domain.BILLING, AccessChecker.Action.WRITE), "OWNER write BILLING");
        });
        check("grant is separate from write: nobody without GRANT can escalate", () -> {
            for (AccessChecker.Domain d : AccessChecker.Domain.values()) {
                eq(false, AccessChecker.allowed(AccessChecker.Role.STEWARD, d, AccessChecker.Action.GRANT), "STEWARD grant " + d);
                eq(true, AccessChecker.allowed(AccessChecker.Role.ADMIN, d, AccessChecker.Action.GRANT), "ADMIN grant " + d);
                eq(false, AccessChecker.allowed(AccessChecker.Role.ADMIN, d, AccessChecker.Action.WRITE), "ADMIN write " + d);
            }
        });
        check("deny by default on null input", () -> {
            eq(false, AccessChecker.allowed(null, AccessChecker.Domain.VM, AccessChecker.Action.READ), "role null");
            eq(false, AccessChecker.allowed(AccessChecker.Role.OWNER, null, AccessChecker.Action.READ), "domain null");
            eq(false, AccessChecker.allowed(AccessChecker.Role.OWNER, AccessChecker.Domain.VM, null), "action null");
            eq(false, AccessChecker.check(null, res(AccessChecker.Domain.VM, "t1", "u1"), AccessChecker.Action.READ), "principal null");
            eq(false, AccessChecker.check(p("u1", "t1", AccessChecker.Role.OWNER), null, AccessChecker.Action.READ), "resource null");
            eq(false, AccessChecker.check(p("u1", null, AccessChecker.Role.OWNER), res(AccessChecker.Domain.VM, null, "u1"), AccessChecker.Action.READ), "tenant null");
        });
        check("tenant isolation applies even to OWNER", () -> {
            AccessChecker.Principal owner = p("boss", "t1", AccessChecker.Role.OWNER);
            eq(true, AccessChecker.check(owner, res(AccessChecker.Domain.VM, "t1", "someone"), AccessChecker.Action.DELETE), "OWNER cung tenant");
            eq(false, AccessChecker.check(owner, res(AccessChecker.Domain.VM, "t2", "someone"), AccessChecker.Action.READ), "OWNER khac tenant");
        });
        check("IDOR: USER only reaches own resources", () -> {
            AccessChecker.Principal alice = p("alice", "t1", AccessChecker.Role.USER);
            eq(true, AccessChecker.check(alice, res(AccessChecker.Domain.VM, "t1", "alice"), AccessChecker.Action.READ), "alice doc VM cua minh");
            eq(false, AccessChecker.check(alice, res(AccessChecker.Domain.VM, "t1", "bob"), AccessChecker.Action.READ), "alice doc VM cua bob");
            eq(false, AccessChecker.check(alice, res(AccessChecker.Domain.VM, "t1", "alice"), AccessChecker.Action.WRITE), "alice write VM");
            eq(false, AccessChecker.check(alice, res(AccessChecker.Domain.BILLING, "t1", "alice"), AccessChecker.Action.READ), "alice doc BILLING");
            AccessChecker.Principal steward = p("sam", "t1", AccessChecker.Role.STEWARD);
            eq(true, AccessChecker.check(steward, res(AccessChecker.Domain.PROJECT, "t1", "bob"), AccessChecker.Action.WRITE), "STEWARD sua PROJECT cua nguoi khac");
            eq(false, AccessChecker.check(steward, res(AccessChecker.Domain.BILLING, "t1", "sam"), AccessChecker.Action.WRITE), "STEWARD sua BILLING");
        });
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
      reference: `import java.util.EnumMap;
import java.util.EnumSet;
import java.util.Map;
import java.util.Set;

final class AccessChecker {
    enum Role { OWNER, STEWARD, ADMIN, USER }
    enum Action { READ, WRITE, DELETE, GRANT }
    enum Domain { PROJECT, BILLING, VM }
    record Principal(String userId, String tenantId, Role role) {}
    record Resource(Domain domain, String tenantId, String ownerId) {}

    // ma trận mặc định: chỉ những gì liệt kê ở đây mới được phép
    private static final Map<Role, Set<Action>> BASE = new EnumMap<>(Role.class);
    static {
        BASE.put(Role.OWNER, EnumSet.allOf(Action.class));
        BASE.put(Role.ADMIN, EnumSet.of(Action.READ, Action.DELETE, Action.GRANT));
        BASE.put(Role.STEWARD, EnumSet.of(Action.READ, Action.WRITE));
        BASE.put(Role.USER, EnumSet.of(Action.READ));
    }

    static boolean allowed(Role role, Domain domain, Action action) {
        if (role == null || domain == null || action == null) return false;   // deny by default
        if (domain == Domain.BILLING) {
            if (role == Role.USER) return false;                              // USER khong thay billing
            if (action == Action.WRITE && role != Role.OWNER) return false;   // chi OWNER sua billing
        }
        return BASE.getOrDefault(role, Set.of()).contains(action);
    }

    static boolean check(Principal p, Resource r, Action action) {
        if (p == null || r == null || action == null) return false;
        if (p.tenantId() == null || !p.tenantId().equals(r.tenantId())) return false;   // co lap tenant
        if (!allowed(p.role(), r.domain(), action)) return false;                       // tang 1: role
        if (p.role() == Role.USER) {                                                    // tang 2: doi tuong
            return p.userId() != null && p.userId().equals(r.ownerId());
        }
        return true;
    }
}`,
      hints: [
        'Dùng {{EnumMap<Role, EnumSet<Action>>}} cho ma trận mặc định; {{EnumSet.allOf(Action.class)}} cho OWNER.',
        'Ngoại lệ BILLING đặt **trước** khi tra ma trận: USER → false; WRITE mà không phải OWNER → false.',
        '{{check}}: null → tenant → {{allowed}} → (nếu USER) so {{ownerId}} với {{userId}}. Viết {{p.userId().equals(r.ownerId())}} sau khi đã chặn {{p.userId()}} null.',
      ],
      explain: `Ba ý chính:
- **Deny-by-default**: hàm chỉ trả true khi quyền được liệt kê tường minh. Nếu viết kiểu "if ADMIN và WRITE thì false, còn lại true", thì ngày thêm role {{AUDITOR}} nó tự động có mọi quyền.
- **Hai tầng kiểm tra**: ma trận trả lời "role này có làm được action này trên loại tài nguyên này không"; tầng đối tượng (tenant, chủ sở hữu) trả lời "trên **bản ghi này** thì sao". Bỏ tầng 2 là IDOR: alice đổi id trên URL và đọc được VM của bob.
- **Test toàn bộ ma trận**: test đầu tiên so cả 48 ô với bảng kỳ vọng viết tay. Nếu bạn copy rule PROJECT sang BILLING mà quên ngoại lệ, ô {{STEWARD/BILLING}} sẽ ra {{RW}} thay vì {{R}} và test chỉ đúng ô đó.

Lỗi hay gặp: kiểm tenant **sau** khi đã trả true cho OWNER (OWNER công ty A xoá được VM công ty B); so {{userId == ownerId}} bằng {{==}} trên String (so địa chỉ, có lúc đúng có lúc sai); và quên chặn null khiến {{NullPointerException}} thành 500. Trong Spring, phần ma trận tương ứng {{@PreAuthorize}}/{{authorizeHttpRequests}}, phần tenant/chủ sở hữu thường là một bean {{AuthorizationManager}} hoặc điều kiện trong query.`,
    },
  ],
  check: [
    {
      q: 'Theo ma trận của bài, ai được WRITE dữ liệu domain BILLING?',
      options: ['OWNER và ADMIN', 'OWNER và STEWARD', 'Chỉ OWNER', 'OWNER, STEWARD và ADMIN'],
      answer: 2,
      explain: `BILLING có ngoại lệ: chỉ OWNER được WRITE. STEWARD được WRITE ở PROJECT/VM nhưng không ở BILLING — nên "OWNER và STEWARD" là câu trả lời của người copy ma trận mặc định mà quên ngoại lệ. ADMIN không bao giờ có WRITE (quyền quản trị tách khỏi quyền dữ liệu), nên hai phương án có ADMIN đều sai.`,
    },
    {
      q: 'Vì sao STEWARD (người được sửa dữ liệu) vẫn không được GRANT quyền cho người khác?',
      options: [
        'Vì GRANT chỉ áp dụng cho domain BILLING',
        'Vì GRANT là quyền quản trị riêng; nếu STEWARD grant được thì có thể tự cấp ADMIN/OWNER cho mình (leo thang quyền)',
        'Vì STEWARD đã có WRITE nên GRANT là thừa',
        'Vì Spring Security cấm role có quyền WRITE đồng thời có GRANT',
      ],
      answer: 1,
      explain: `Quyền cấp quyền là "chìa khoá của mọi chìa khoá": ai có nó có thể tự nâng mình lên bất kỳ role nào. Tách GRANT khỏi WRITE là áp dụng least privilege và separation of duties. GRANT trong bài áp dụng cho mọi domain chứ không riêng BILLING; WRITE và GRANT là hai năng lực khác nhau nên không có chuyện "thừa"; Spring Security không có quy tắc cấm nào như vậy — đó là quyết định thiết kế của bạn.`,
    },
    {
      q: 'Endpoint {{GET /vms/1042}} kiểm tra "người gọi có role USER và USER được READ VM" rồi trả VM theo id. Lỗ hổng là gì và sửa thế nào?',
      options: [
        'Không có lỗ hổng vì đã kiểm role',
        'IDOR/BOLA: phải kiểm thêm VM thuộc cùng tenant và thuộc chính người gọi (hoặc lọc ngay trong query)',
        'Phải đổi id tự tăng sang UUID là đủ',
        'Phải chuyển endpoint sang POST',
      ],
      answer: 1,
      explain: `Kiểm role chỉ trả lời "USER có được đọc VM nói chung không", không trả lời "có được đọc **VM này** không". Đổi {{id}} trên URL là đọc được VM người khác — IDOR, hay BOLA trong OWASP API Security Top 10. Sửa bằng kiểm tra theo đối tượng (tenant + chủ sở hữu) hoặc query có điều kiện {{owner_id}}. UUID chỉ làm id khó đoán hơn, id vẫn lộ qua log, link chia sẻ…; đổi sang POST không thay đổi gì về phân quyền.`,
    },
  ],
  related: ['security-008', 'security-024', 'security-020'],
  tags: ['authorization', 'RBAC', 'IDOR', 'BOLA', 'deny by default'],
},
{
  id: 'lesson-security-006',
  track: 'security',
  order: 6,
  title: 'OAuth2 Authorization Code + PKCE: vì sao app không giữ được client_secret và code_verifier bịt lỗ hổng thế nào',
  level: 'senior',
  minutes: 45,
  goals: [
    'Phân biệt confidential client và public client; giải thích được vì sao SPA và app mobile không thể giữ {{client_secret}}',
    'Sinh đúng {{code_verifier}} (43–128 ký tự) và {{code_challenge}} = BASE64URL(SHA-256(verifier)) không padding, chỉ bằng JDK thuần',
    'Viết phía authorization server: code chỉ dùng một lần, có hạn dùng, verifier sai thì bị từ chối và bị vô hiệu luôn',
    'Giải thích {{state}} chống gì, vì sao nó không thay được PKCE, và PKCE không chữa được những rủi ro nào',
  ],
  body: `### Bốn vai trong OAuth2 (định nghĩa từ đầu, vì mọi thứ sau phụ thuộc vào nó)
- **Resource Owner**: chính là người dùng — chủ nhân của dữ liệu.
- **Client**: ứng dụng muốn đọc dữ liệu **nhân danh** người dùng. Đó có thể là SPA viết bằng React/Vue chạy trong trình duyệt, app iOS/Android, hoặc một backend chạy job đêm.
- **Authorization Server (AS)**: nơi người ta thực sự đăng nhập và bấm "Đồng ý cho app". Ví dụ: Google, Keycloak, Spring Authorization Server, Auth0. AS phát **authorization code** (một tờ vé ngắn hạn) rồi đổi tờ vé đó lấy **access token**.
- **Resource Server (RS)**: API chứa dữ liệu — thường là chính Spring Boot app của bạn. RS không biết mật khẩu ai, chỉ kiểm tra access token gửi trong header **Authorization** rồi trả lời "token này có scope đọc được đơn hàng không".

Ví dụ đời thường: app "Tính calorie" muốn đọc thực đơn trong Google Calendar của bạn. Đưa mật khẩu Google cho app giống đưa chìa khoá nhà cho người lạ: họ giữ vĩnh viễn, mở được mọi phòng (mail, Drive, ảnh), và bạn không thu hồi riêng cái app đó được. OAuth giải quyết bằng cách để **Google tự tay** phát cho app một tấm vé chỉ mở được cửa calendar và hết hạn sau một giờ.

| Loại client | Chạy ở đâu | Giữ được secret? | Ví dụ |
|---|---|---|---|
| **Confidential client** | Server **của bạn** (backend, batch job) | Có — secret nằm trong môi trường do bạn kiểm soát | Spring Boot làm BFF, service-to-service |
| **Public client** | Máy **của người dùng** | **Không bao giờ** | SPA trong trình duyệt, app mobile, CLI, smart TV |

### Vì sao SPA và mobile không thể giữ client_secret
Với SPA, toàn bộ JavaScript đã được tải về máy người dùng để chạy. Nghĩa là chỉ cần F12 → tab Sources (hoặc Ctrl+U xem source) là đọc được mọi chuỗi trong bundle — kể cả chuỗi bạn gọi là "secret" và đã xoá khỏi repo từ đời nào. Với app mobile còn tệ hơn: file APK/IPA lấy được từ store, giải nén bằng công cụ phổ biến, chạy {{strings}} là thấy. Mã hoá obfuscate chỉ làm khó đọc, không làm khó **trích xuất**: thuật toán chạy trên máy kẻ tấn công thì kẻ tấn công đọc được thuật toán.

Vậy nên {{client_secret}} của public client không phải secret, và chuẩn OAuth hiện hành (RFC 9700, OAuth 2.1) **bỏ luôn** việc dùng secret ở đây; {{client_id}} chỉ là định danh công khai, giống tên miền, không chứng minh được thân phận người gọi. Hệ quả: khi app quay lại đổi code lấy token, AS không có cách nào biết "đây có phải đúng cái app đã bắt đầu luồng không". Đó chính là chỗ PKCE lấp vào.

### Từng bước của Authorization Code flow có PKCE
~~~seq
title: Authorization Code + PKCE cho SPA
actors: App | AS | RS
App -> App: tao code_verifier ngau nhien
App -> AS: /authorize?code_challenge&state
AS --> App: màn hình đăng nhập và đồng ý
AS --> App: redirect ?code&state
App -> AS: /token (code + code_verifier)
App -> App: kiểm tra state khớp
AS -> AS: SHA256(verifier) == challenge?
AS --> App: access token + refresh token
App -> RS: GET /api/orders (Bearer token)
RS --> App: dữ liệu đơn hàng
note App..RS: code chỉ dùng được 1 lần, TTL vài chục giây
~~~

**Bước 1.** App sinh {{code_verifier}} ngẫu nhiên, giữ trong bộ nhớ phiên làm việc ({{sessionStorage}}), rồi chuyển hướng trình duyệt tới AS:

~~~text
GET https://auth.example.com/authorize
  ?response_type=code
  &client_id=spa-calorie
  &redirect_uri=https://app.example.com/callback
  &scope=openid%20profile
  &state=7f3Aq0Kz9Xk2mQpR
  &code_challenge=E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM
  &code_challenge_method=S256
~~~

**Bước 2.** Người dùng đăng nhập **trên màn hình của AS**. App không bao giờ nhìn thấy mật khẩu — đó là toàn bộ ý nghĩa của "uỷ quyền thay vì trao khoá".
**Bước 3.** AS redirect về {{redirect_uri}} kèm {{?code=...&state=...}}. Chú ý: code đi qua **trình duyệt**, tức là qua địa chỉ, qua lịch sử, qua log.
**Bước 4.** App POST tới {{/token}} với {{code}}, {{code_verifier}}, {{client_id}} (không secret):

~~~text
POST /oauth2/token HTTP/1.1
Host: auth.example.com
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code
&code=SlaxwqT3vN9dLk2Yh
&redirect_uri=https://app.example.com/callback
&client_id=spa-calorie
&code_verifier=dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk
~~~

**Bước 5.** AS kiểm tra {{SHA-256(code_verifier)}} có đúng bằng {{code_challenge}} đã lưu ở Bước 1 không, rồi mới phát access token (+ refresh token).
**Bước 6.** App gọi RS với header **Authorization: Bearer**. RS không cần hỏi AS mỗi câu nếu token là JWT tự chứa (kiểm tra chữ ký + {{exp}} + {{aud}}); khi cần thu hồi tức thời thì dùng token opaque + introspection.

### Code bị đánh cắp bằng cách nào — bài học khiến PKCE ra đời
Kẻ tấn công chỉ cần nhìn thấy {{code}} là đổi được token, nếu không có PKCE:
- **Mobile, custom URL scheme**: app đăng ký {{myapp://oauth/callback}}. Hệ điều hành mở **app nào đăng ký scheme đó**, không quan tâm ai sở hữu. Một app độc hại cài cùng scheme nhận được code nguyên văn.
- **SPA**: code xuất hiện trên thanh địa chỉ → lọt vào lịch sử trình duyệt, vào header **Referer** nếu trang callback lập tức tải tài nguyên bên thứ ba, vào log của reverse proxy/CDN, vào extension đọc DOM, và vào cả screenshot khi ai đó "cho tôi xin cái link".
- Người dùng copy đường link "để gửi cho bộ phận hỗ trợ", hoặc trình duyệt tự điền lại URL cũ có chứa code.

Đây gọi là **authorization code interception attack**. Cũng vì kiểu rò này mà **Implicit flow** bị khai tử: nó trả thẳng access token qua phần sau dấu # của URL — token hiện nguyên trên thanh địa chỉ, nằm trong lịch sử, mọi script trên trang đọc được, và còn không có refresh token nên cứ 5 phút lại phải chạy lại luồng login.

### PKCE: một mật khẩu chỉ người tạo ra nó biết, và không đi qua kênh rò rỉ
Nguyên lý trong một câu: **bước lộ thì gửi hash, bước kín thì gửi nguyên bản**.
- {{code_verifier}} là chuỗi ngẫu nhiên 43–128 ký tự lấy từ bảng ký tự *unreserved* {{A-Za-z0-9-._~}} (tập ký tự an toàn trong URI, không cần escape). Thực tế người ta lấy đúng 32 byte ngẫu nhiên từ {{SecureRandom}} rồi mã base64url không padding → ra 43 ký tự, đủ chuẩn.
- {{code_challenge}} = BASE64URL(**không padding**) của SHA-256 tính trên byte ASCII của verifier.
- Challenge đi trong request {{/authorize}} (kênh rò rỉ): attacker thấy challenge cũng vô ích, vì SHA-256 một chiều — không suy ngược verifier được.
- Verifier đi trong **POST body** của {{/token}} qua TLS: không vào URL, không vào history, không vào log proxy, không vào Referer. Attacker có code trong tay vẫn thiếu mảnh cuối.

Test vector chính thức trong Phụ lục B của RFC 7636 — hãy tự tính lại một lần để tin:

| | Giá trị |
|---|---|
| {{code_verifier}} | dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk |
| {{code_challenge}} | E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM |

{{code_challenge_method=plain}} nghĩa là gửi verifier thô ngay ở {{/authorize}}: kẻ đứng giữa (hoặc log proxy) đọc verifier từ bước 1, PKCE vô dụng. Chuẩn mới chỉ cho {{S256}}; AS phải **từ chối** mọi request dùng {{plain}} hoặc thiếu {{code_challenge_method}}.

Điều PKCE chứng minh được chỉ là: "kẻ đang đổi code là kẻ đã bắt đầu phiên này". Nó **không** xác thực thân phận client, không chứng minh app là app thật.

### state: một lớp chống CSRF riêng, đừng nhầm với PKCE
Attacker tự login bằng **tài khoản của hắn**, lấy một code hợp lệ, rồi nhét URL callback chứa code đó vào trình duyệt nạn nhân (một link chat, một trang ảnh). Nạn nhân click → phiên của nạn nhân gắn với tài khoản của attacker → mọi thứ nạn nhân gõ (đơn hàng, ảnh, ghi chú) rơi vào tài khoản attacker, và attacker đọc được chúng. Đây là **login CSRF**, và PKCE không chống được vì code hoàn toàn hợp lệ, verifier cũng đúng.
Cách chống: app sinh {{state}} ngẫu nhiên, gắn với phiên làm việc hiện tại của chính trình duyệt đó, gửi lên AS, nhận về ở callback và so khớp với giá trị đã lưu. AS nên giữ state như một tham số opaque, không diễn giải nó.
({{nonce}} là người anh em cùng ý tưởng nhưng dùng cho {{id_token}} của OIDC, chống replay token.)

### PKCE không chữa được gì — và cái gì chữa
| Rủi ro | Biện pháp đúng |
|---|---|
| Code bị chặn trên đường về | PKCE (S256) + code TTL ngắn, dùng một lần |
| Code hợp lệ của người khác bị nhét vào trình duyệt của bạn | {{state}} |
| Token bị đọc bằng XSS (token nằm trong {{localStorage}}) | Mẫu **BFF**: backend giữ token, SPA chỉ nhận cookie {{HttpOnly}} {{SameSite}} |
| Token lọt ra ngoài rồi bị dùng lại | Refresh token **rotation** (dùng một lần, phát hiện tái sử dụng thì thu hồi cả chuỗi) + sender-constraining (DPoP, mTLS) |
| App giả mạo đứng tên {{client_id}} | App Attest / Play Integrity, và AS bắt buộc PKCE |
| id_token bị replay | {{nonce}} + kiểm tra {{aud}}, {{iss}}, {{exp}} |

### Viết bằng Java thuần
Chỉ cần ba class JDK: {{SecureRandom}}, {{MessageDigest}}, {{java.util.Base64}}:

~~~java
byte[] raw = new byte[32];                                  // 256 bit entropy
new SecureRandom().nextBytes(raw);                          // KHÔNG dùng Math.random: seed đoán được
String verifier = Base64.getUrlEncoder().withoutPadding().encodeToString(raw);   // 43 ky tu, A-Za-z0-9-_

MessageDigest md = MessageDigest.getInstance("SHA-256");
String challenge = Base64.getUrlEncoder().withoutPadding()  // withoutPadding loai bo dau "="
    .encodeToString(md.digest(verifier.getBytes(StandardCharsets.US_ASCII)));    // verifier la ASCII
~~~

Trong Spring, hai mảnh config hay bị hỏi:
- AS bắt buộc PKCE: {{ClientSettings.builder().requireProofKey(true).build()}} (Spring Authorization Server), hoặc đặt PKCE method {{S256}} cho client trong Keycloak.
- Spring Security **đóng vai client**: {{OAuth2AuthorizationRequestCustomizers.withPkce()}} gắn vào {{DefaultOAuth2AuthorizationRequestResolver}} để tự sinh verifier và gửi S256.

### Bẫy production
- {{redirect_uri}} kiểm bằng {{startsWith}} hay {{matches}}: attacker đăng ký {{https://app.example.com.callback.evil.tld}} và nhận code. Phải so **chính xác từng ký tự** với danh sách đã đăng ký.
- AS chỉ kiểm tra xem request có {{code_challenge}}, không đối chiếu verifier khi đổi code ("cho xong request") — PKCE biến thành trang trí.
- Dùng lại một verifier cho nhiều lần đăng nhập, hoặc ghi verifier vào log/URL: mất tác dụng ngay.
- Trả code qua GET tới {{/token}}, hoặc đặt verifier trong query string: verifier vào access log.
- Code TTL hàng phút tới hàng giờ, và đổi được nhiều lần: phải một lần dùng, TTL 15–60 giây, và gắn chặt với {{client_id}} + {{redirect_uri}} đã dùng ở bước authorize.
- Khi verifier **sai**, RFC khuyên vô hiệu mọi code đang chờ của client đó (chứng tỏ có kẻ đang đoán), chứ không cho thử tiếp.
- SPA để access token + refresh token trong JS storage: một XSS là mất tất cả; cân nhắc BFF thay vì cố "che" secret.

### Liên hệ phỏng vấn
Câu hỏi điển hình: "SPA đăng nhập Google thế nào mà không cần client_secret?", "PKCE chống attack cụ thể nào?", "state khác nonce ở chỗ nào?", "PKCE có thay được refresh token rotation không?". Trả lời được bốn câu đó với đúng tên cuộc tấn công (code interception, login CSRF) và đúng dải ký tự của verifier là đã hơn phần lớn ứng viên. Làm bài tập dưới đây để sở hữu luôn phần cơ chế: tự sinh verifier, tự tính challenge khớp test vector của RFC, và tự viết phía server từ chối code dùng rồi / hết hạn / verifier sai.`,
  exercises: [
    {
      title: 'Viết Pkce và AuthServerSim: sinh verifier, tính challenge, đổi code lấy token an toàn',
      prompt: `Hai class cần hoàn thiện ({{Exchange}} đã viết sẵn, chỉ dùng).

**{{Pkce}}**
- {{newVerifier(random)}}: lấy {{VERIFIER_BYTES}} (32) byte từ {{SecureRandom}} đã truyền vào, trả về base64url **không padding** của chúng → đúng 43 ký tự, thuộc bảng unreserved.
- {{challenge(verifier)}}: SHA-256 tính trên byte **US-ASCII** của verifier, trả base64url không padding của digest. {{NoSuchAlgorithmException}} bọc thành {{IllegalStateException}}.

**{{AuthServerSim}}** — phía authorization server, đồng hồ **truyền vào** để test tất định:
- {{issueCode(codeChallenge, issuedAtEpochSec)}}: sinh {{code}} từ 16 byte ngẫu nhiên base64url (không padding), lưu {{code -> (challenge, issuedAt, used=false)}} trong map, trả về {{code}}.
- {{exchange(code, codeVerifier, nowEpochSec)}} trả về {{Exchange}}, kiểm tra theo **đúng thứ tự** sau:
1. {{code}} null hoặc không có trong map → {{Exchange.failed("unknown_code")}}.
2. code đã từng được dùng → {{failed("redeemed")}}.
3. {{nowEpochSec - issuedAt >= CODE_TTL_SECONDS}} → {{failed("expired")}} (giây cuối cùng trước hạn vẫn **phải** thành công).
4. verifier hỏng bất kỳ kiểu nào → {{failed("invalid_grant")}} **và đánh dấu code đã dùng** (kẻ đang đoán verifier không được thử lần hai). Hỏng gồm: {{null}}, độ dài ngoài 43..128, có ký tự ngoài bảng {{A-Za-z0-9-._~}}, hoặc SHA-256(verifier) không khớp challenge đã lưu. So khớp phải dùng {{MessageDigest.isEqual}} trên byte, không dùng {{equals}}.
5. Mọi thứ ổn → đánh dấu {{used = true}}, trả {{Exchange.granted("at-" + code)}}.

Chỉ JDK 17, không thư viện ngoài, không dùng thời gian thực.`,
      starter: `import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;

final class Pkce {
    static final int VERIFIER_BYTES = 32;

    static String newVerifier(SecureRandom random) {
        throw new UnsupportedOperationException("TODO");
    }

    static String challenge(String verifier) {
        throw new UnsupportedOperationException("TODO");
    }
}

final class Exchange {
    final boolean ok;
    final String accessToken;
    final String error;

    private Exchange(boolean ok, String accessToken, String error) {
        this.ok = ok;
        this.accessToken = accessToken;
        this.error = error;
    }

    static Exchange granted(String accessToken) { return new Exchange(true, accessToken, null); }

    static Exchange failed(String error) { return new Exchange(false, null, error); }
}

final class AuthServerSim {
    static final int CODE_TTL_SECONDS = 600;
    static final String UNRESERVED =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";

    private static final class Pending {
        final String challenge;
        final long issuedAt;
        boolean used;

        Pending(String challenge, long issuedAt) {
            this.challenge = challenge;
            this.issuedAt = issuedAt;
        }
    }

    private final Map<String, Pending> codes = new HashMap<>();
    private final SecureRandom random;

    AuthServerSim(SecureRandom random) {
        this.random = random;
    }

    String issueCode(String codeChallenge, long issuedAtEpochSec) {
        throw new UnsupportedOperationException("TODO");
    }

    Exchange exchange(String code, String codeVerifier, long nowEpochSec) {
        throw new UnsupportedOperationException("TODO");
    }

    private static boolean wellFormed(String verifier) {
        throw new UnsupportedOperationException("TODO");
    }
}`,
      tests: `import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Base64;

public class Main {
    interface Case { void run() throws Exception; }
    static int passed = 0, total = 0;
    static void check(String name, Case c) {
        total++;
        try { c.run(); passed++; System.out.println("PASS " + name); }
        catch (Throwable t) { System.out.println("FAIL " + name + ": " + t); }
    }
    static void eq(Object expected, Object actual) {
        if (!Objects.equals(expected, actual)) throw new AssertionError("expected " + expected + " got " + actual);
    }
    static final String VERIFIER_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
    static final String URLSAFE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
    static boolean onlyIn(String s, String alphabet) {
        if (s.isEmpty()) return false;
        for (int i = 0; i < s.length(); i++) if (alphabet.indexOf(s.charAt(i)) < 0) return false;
        return true;
    }
    static String sha256url(String verifier) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            return Base64.getUrlEncoder().withoutPadding().encodeToString(md.digest(verifier.getBytes(StandardCharsets.US_ASCII)));
        } catch (Exception e) { throw new IllegalStateException(e); }
    }
    public static void main(String[] args) {
        check("newVerifier is 43 url-safe chars and varies", () -> {
            String v1 = Pkce.newVerifier(new SecureRandom());
            String v2 = Pkce.newVerifier(new SecureRandom());
            eq(43, v1.length());
            if (!onlyIn(v1, VERIFIER_CHARS)) throw new AssertionError("ky tu ngoai bang unreserved: " + v1);
            if (v1.equals(v2)) throw new AssertionError("hai verifier trung nhau");
        });
        check("challenge equals the RFC 7636 appendix B vector", () ->
            eq("E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM", Pkce.challenge("dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk")));
        check("challenge is base64url without padding and deterministic", () -> {
            String v = Pkce.newVerifier(new SecureRandom());
            String c1 = Pkce.challenge(v);
            eq(43, c1.length());
            if (c1.indexOf('=') >= 0) throw new AssertionError("challenge con padding: " + c1);
            eq(c1, Pkce.challenge(v));
            eq(c1, sha256url(v));
            if (c1.equals(Pkce.challenge(v + "x"))) throw new AssertionError("verifier khac ma challenge giong nhau");
        });
        check("issueCode returns distinct unguessable codes", () -> {
            AuthServerSim s = new AuthServerSim(new SecureRandom());
            String challenge = Pkce.challenge(Pkce.newVerifier(new SecureRandom()));
            String a = s.issueCode(challenge, 1000);
            String b = s.issueCode(challenge, 1000);
            if (a.length() < 22) throw new AssertionError("code qua ngan de doan: " + a.length());
            if (!onlyIn(a, URLSAFE_CHARS)) throw new AssertionError("code khong phai base64url: " + a);
            if (a.equals(b)) throw new AssertionError("hai code trung nhau");
            if (a.equals(challenge)) throw new AssertionError("code trong nhu challenge");
        });
        check("happy path redeems once with the matching verifier", () -> {
            SecureRandom rnd = new SecureRandom();
            AuthServerSim s = new AuthServerSim(rnd);
            String verifier = Pkce.newVerifier(rnd);
            String code = s.issueCode(Pkce.challenge(verifier), 1000);
            Exchange r = s.exchange(code, verifier, 1001);
            if (!r.ok) throw new AssertionError("dung verifier ma bi tu choi: " + r.error);
            eq("at-" + code, r.accessToken);
            eq(null, r.error);
        });
        check("code is single use", () -> {
            SecureRandom rnd = new SecureRandom();
            AuthServerSim s = new AuthServerSim(rnd);
            String verifier = Pkce.newVerifier(rnd);
            String code = s.issueCode(Pkce.challenge(verifier), 1000);
            if (!s.exchange(code, verifier, 1000).ok) throw new AssertionError("lan dau bi tu choi");
            Exchange again = s.exchange(code, verifier, 1001);
            if (again.ok) throw new AssertionError("code dung lan hai ma thanh cong");
            eq("redeemed", again.error);
        });
        check("wrong verifier is rejected and burns the code", () -> {
            SecureRandom rnd = new SecureRandom();
            AuthServerSim s = new AuthServerSim(rnd);
            String verifier = Pkce.newVerifier(rnd);
            String code = s.issueCode(Pkce.challenge(verifier), 1000);
            Exchange bad = s.exchange(code, Pkce.newVerifier(rnd), 1001);
            if (bad.ok) throw new AssertionError("verifier sai ma duoc cap token");
            eq("invalid_grant", bad.error);
            if (s.exchange(code, verifier, 1002).ok) throw new AssertionError("verifier sai ma code van dung duoc sau do");
        });
        check("expired code rejected, last second before TTL still works", () -> {
            SecureRandom rnd = new SecureRandom();
            AuthServerSim s = new AuthServerSim(rnd);
            String verifier = Pkce.newVerifier(rnd);
            String code = s.issueCode(Pkce.challenge(verifier), 1000);
            Exchange late = s.exchange(code, verifier, 1000 + AuthServerSim.CODE_TTL_SECONDS);
            if (late.ok) throw new AssertionError("code het han ma thanh cong");
            eq("expired", late.error);
            String code2 = s.issueCode(Pkce.challenge(verifier), 2000);
            if (!s.exchange(code2, verifier, 2000 + AuthServerSim.CODE_TTL_SECONDS - 1).ok) throw new AssertionError("giay cuoi cua TTL phai con dung duoc");
        });
        check("unknown or null code is rejected without touching storage", () -> {
            SecureRandom rnd = new SecureRandom();
            AuthServerSim s = new AuthServerSim(rnd);
            String verifier = Pkce.newVerifier(rnd);
            String code = s.issueCode(Pkce.challenge(verifier), 1000);
            eq("unknown_code", s.exchange("khong-ton-tai", verifier, 1001).error);
            eq("unknown_code", s.exchange(null, verifier, 1001).error);
            if (!s.exchange(code, verifier, 1002).ok) throw new AssertionError("exchange that fail lam code that bi an");
        });
        check("verifier must be well formed even if its hash matches", () -> {
            SecureRandom rnd = new SecureRandom();
            AuthServerSim s = new AuthServerSim(rnd);
            String tooShort = "abc123";
            Exchange shortR = s.exchange(s.issueCode(Pkce.challenge(tooShort), 1000), tooShort, 1001);
            if (shortR.ok) throw new AssertionError("verifier 6 ky tu ma van duoc cap token");
            eq("invalid_grant", shortR.error);
            String junk = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa ";
            Exchange r = s.exchange(s.issueCode(Pkce.challenge(junk), 1000), junk, 1001);
            if (r.ok) throw new AssertionError("verifier co dau cach bi chap nhan");
            eq("invalid_grant", r.error);
            eq("invalid_grant", s.exchange(s.issueCode(Pkce.challenge(tooShort), 1000), null, 1001).error);
            String longOk = "a".repeat(128);
            if (!s.exchange(s.issueCode(Pkce.challenge(longOk), 1000), longOk, 1001).ok) throw new AssertionError("verifier 128 ky tu hop le bi tu choi");
        });
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
      reference: `import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;

final class Pkce {
    static final int VERIFIER_BYTES = 32;

    static String newVerifier(SecureRandom random) {
        byte[] raw = new byte[VERIFIER_BYTES];
        random.nextBytes(raw);                                  // entropy thật, không phải Math.random
        return Base64.getUrlEncoder().withoutPadding().encodeToString(raw);   // 43 ky tu
    }

    static String challenge(String verifier) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            return Base64.getUrlEncoder().withoutPadding()      // base64url + bo padding = dung RFC 7636
                .encodeToString(md.digest(verifier.getBytes(StandardCharsets.US_ASCII)));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 phai co trong moi JVM", e);
        }
    }
}

final class Exchange {
    final boolean ok;
    final String accessToken;
    final String error;

    private Exchange(boolean ok, String accessToken, String error) {
        this.ok = ok;
        this.accessToken = accessToken;
        this.error = error;
    }

    static Exchange granted(String accessToken) { return new Exchange(true, accessToken, null); }

    static Exchange failed(String error) { return new Exchange(false, null, error); }
}

final class AuthServerSim {
    static final int CODE_TTL_SECONDS = 600;
    static final String UNRESERVED =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";

    private static final class Pending {
        final String challenge;
        final long issuedAt;
        boolean used;

        Pending(String challenge, long issuedAt) {
            this.challenge = challenge;
            this.issuedAt = issuedAt;
        }
    }

    private final Map<String, Pending> codes = new HashMap<>();
    private final SecureRandom random;

    AuthServerSim(SecureRandom random) {
        this.random = random;
    }

    String issueCode(String codeChallenge, long issuedAtEpochSec) {
        byte[] raw = new byte[16];                              // >= 128 bit để code không đoán được
        random.nextBytes(raw);
        String code = Base64.getUrlEncoder().withoutPadding().encodeToString(raw);
        codes.put(code, new Pending(codeChallenge, issuedAtEpochSec));
        return code;                                            // real server also binds client_id + redirect_uri
    }

    Exchange exchange(String code, String codeVerifier, long nowEpochSec) {
        Pending p = code == null ? null : codes.get(code);
        if (p == null) return Exchange.failed("unknown_code");
        if (p.used) return Exchange.failed("redeemed");
        if (nowEpochSec - p.issuedAt >= CODE_TTL_SECONDS) return Exchange.failed("expired");

        boolean valid = wellFormed(codeVerifier)
            && codeVerifier.length() >= 43 && codeVerifier.length() <= 128;
        if (valid) {
            byte[] expected = p.challenge == null ? new byte[0] : p.challenge.getBytes(StandardCharsets.US_ASCII);
            byte[] actual = Pkce.challenge(codeVerifier).getBytes(StandardCharsets.US_ASCII);
            valid = MessageDigest.isEqual(expected, actual);     // constant-time, nhu so sanh hash mat khau
        }
        if (!valid) {
            p.used = true;                                       // ke dang doan verifier: vo hieu hoa code ngay
            return Exchange.failed("invalid_grant");
        }
        p.used = true;                                           // code chi mot lan
        return Exchange.granted("at-" + code);
    }

    private static boolean wellFormed(String verifier) {
        if (verifier == null) return false;
        int n = verifier.length();
        if (n < 43 || n > 128) return false;                     // RFC 7636: 43..128 ky tu
        for (int i = 0; i < n; i++) {
            if (AuthServerSim.UNRESERVED.indexOf(verifier.charAt(i)) < 0) return false;
        }
        return true;
    }
}`,
      hints: [
        'Base64url **không padding** là {{Base64.getUrlEncoder().withoutPadding()}}; {{Base64.getEncoder()}} chuẩn sẽ thêm dấu = và dùng ký tự + / nên sai chuẩn PKCE.',
        '32 byte base64url ra đúng 43 ký tự (10 nhóm 3 byte = 40 ký tự, nhóm 2 byte dư cuối = 3 ký tự) — đó là lý do dải verifier bắt đầu từ 43.',
        'Trong {{exchange}}, đừng "sửa lỗi" bằng cách so chuỗi bằng {{equals}}; convert cả challenge đã lưu và challenge tính lại sang byte rồi dùng {{MessageDigest.isEqual}}.',
        'Đánh dấu {{used = true}} ở **cả nhánh verifier sai**: RFC 9700 khuyên vô hiệu code khi bằng chứng PKCE không khớp, vì đó là dấu hiệu đang bị đoán.',
      ],
      explain: `Ba chỗ dễ sai nhất khi viết tay.

**Một là base64 thường thay vì base64url.** Digest SHA-256 có 32 byte; mã hoá base64 chuẩn sinh ra các ký tự {{+}} và {{/}} và có thể thêm {{=}}. Cả ba đều là ký tự phải escape khi đi trong query string, nên thực tế client hay bị hỏng ở đây. Chuẩn RFC 7636 qui định base64url **không padding**; vì thế challenge luôn dài đúng 43 ký tự (SHA-256 32 byte không bao giờ cần padding hơn 1 ký tự và url-safe alphabet không có {{+}} {{/}}). Test vector trong RFC chính là "gương" để soi implementation của bạn.

**Hai là chỉ kiểm challenge mà quên kiểm verifier.** Nếu server chỉ so {{SHA-256(verifier)}} với challenge, một verifier 6 ký tự vẫn lọt, làm giảm entropy của cả cơ chế. Dải 43–128 và bảng ký tự unreserved là **một phần của chuẩn**, server phải kiểm — đó là lý do bài có case "verifier quá ngắn nhưng hash khớp vẫn phải bị từ chối".

**Ba là thứ tự kiểm tra và hậu quả của nó.** Nếu bạn kiểm hết hạn sau khi kiểm verifier, attacker dò verifier được trên code đã chết. Nếu bạn không đánh dấu code đã dùng khi verifier sai, cùng một code bị thử nghiệm hàng nghìn lần. Ngược lại, nếu bạn xoá hẳn entry khi thất bại, client chính chủ quay lại lần thứ hai sẽ nhận "unknown_code" thay vì "redeemed" và bạn mất luôn tín hiệu để cảnh báo. Bài này giữ entry + đánh dấu dùng, nên cả hai bên đều có thông tin đủ để xử lý.

Còn một điều nên nói rõ khi phỏng vấn: server thật **không phân biệt lý do từ chối với client** (RFC 6749 chỉ có {{invalid_grant}}); ta tách "unknown_code"/"expired"/"redeemed" trong bài để test và để ghi log nội bộ, nhưng response trả về cho app nên gộp lại để không cho attacker biết code có tồn tại hay không.`,
    },
  ],
  check: [
    {
      q: 'Vì sao SPA và app mobile dùng PKCE thay vì {{client_secret}}?',
      options: [
        'Vì PKCE mạnh hơn secret: verifier 43 ký tự dài hơn secret trung bình',
        'Vì code của SPA/mobile chạy trên máy người dùng, secret trích xuất được nên không còn là secret; PKCE thay thế bằng cách chứng minh client đã bắt đầu phiên, không cần bí mật chung',
        'Vì AS không nhận {{client_secret}} cho bất kỳ client nào',
        'Vì PKCE mã hoá access token nên secret trở nên thừa',
      ],
      answer: 1,
      explain: `Điểm mấu chốt là **nơi code chạy**: JS trong trình duyệt và APK/IPA đều trích xuất được chuỗi bên trong, nên secret không thể giữ bí mật. PKCE không "mạnh hơn" secret mà giải một bài toán khác: không cần bí mật chung vẫn buộc kẻ đổi code phải là kẻ đã tạo verifier. AS vẫn nhận secret với confidential client (backend), và PKCE không liên quan gì tới việc mã hoá token.`,
    },
    {
      q: 'Trong flow có PKCE, {{code_challenge}} và {{code_verifier}} được dùng ở bước nào?',
      options: [
        'Cả hai gửi ở {{/authorize}}, verifier bị bỏ qua',
        'Verifier gửi ở {{/authorize}}, challenge gửi ở {{/token}}',
        'Challenge (hash của verifier) gửi ở {{/authorize}}, verifier gốc gửi trong POST body ở {{/token}}; AS so SHA-256(verifier) với challenge đã lưu',
        'Verifier gửi kèm access token trong header mỗi lần gọi API',
      ],
      answer: 2,
      explain: `Nguyên tắc là "bước lộ thì gửi hash, bước kín thì gửi nguyên bản": {{/authorize}} đi qua trình duyệt nên chỉ gửi challenge (một chiều, không suy ngược được), còn verifier đi trong body của POST {{/token}} qua TLS. Nếu đổi chỗ (gửi verifier thô ở bước 1) thì đó là {{plain}}, bị attacker chặn mất; verifier không hề đi cùng access token khi gọi API.`,
    },
    {
      q: 'Attacker lấy một code **hợp lệ** do chính hắn đăng nhập bằng tài khoản của hắn, rồi đẩy victim mở URL callback chứa code đó. Đây là gì và chống bằng gì?',
      options: [
        'Authorization code interception; chống bằng PKCE với S256',
        'Login CSRF; chống bằng {{state}} ngẫu nhiên lưu ở phía app và so khớp khi callback về',
        'Replay của {{id_token}}; chống bằng cách tăng TTL access token',
        'Không phải tấn công, vì code thuộc về tài khoản của attacker',
      ],
      answer: 1,
      explain: `Code hợp lệ, verifier đúng (chính attacker tạo) nên PKCE hoàn toàn bất lực — đây là login CSRF: nạn nhân bị đăng nhập nhầm vào tài khoản của attacker và ghi dữ liệu vào đó. {{state}} binds request và browser session của nạn nhân lại nên app phát hiện code không phải của mình. {{nonce}} là cơ chế cho {{id_token}}, và tăng TTL thì chỉ làm tệ hơn; hậu quả là thật: dữ liệu nạn nhân rơi vào tài khoản attacker kiểm soát.`,
    },
  ],
  related: ['security-004', 'security-006', 'security-023'],
  tags: ['OAuth2', 'PKCE', 'code_verifier', 'state', 'SPA', 'mobile'],
},
{
  id: 'lesson-security-007',
  track: 'security',
  order: 7,
  title: 'Mã hoá trường dữ liệu nhạy cảm bằng AES-GCM: IV không được lặp, version khoá để xoay vòng, blind index để tìm kiếm',
  level: 'senior',
  minutes: 50,
  goals: [
    'Phân biệt khi nào phải {{hash}}, khi nào phải {{mã hoá}} hai chiều, và vì sao AES-{{ECB}} bị cấm còn {{AES/GCM/NoPadding}} là lựa chọn đúng',
    'Sinh {{IV}} 12 byte ngẫu nhiên cho **mỗi** lần encrypt, hiểu vì sao lặp IV với cùng khoá là thảm hoạ',
    'Thiết kế định dạng lưu {{v<version>:base64(iv + ciphertext + tag)}} và xoay vòng khoá mà vẫn đọc được dữ liệu cũ',
    'Viết {{blindIndex}} bằng {{HmacSHA256}} để tìm kiếm equality trên cột đã mã hoá, và biết trước nó rò rỉ gì',
  ],
  body: `### Ba thứ hay lẫn lộn: encoding, hash, mã hoá
| Công cụ | Đọc lại được không | Cần khoá không | Dùng cho |
|---|---|---|---|
| Encoding (Base64, hex, URL-encode) | Có, ai cũng đọc được | Không | Đổi **định dạng** byte, không bảo mật gì |
| Hash (SHA-256, bcrypt) | **Không** | Không (salt không bí mật) | Mật khẩu, kiểm toàn vẹn, so trùng |
| Mã hoá (AES-GCM) | Có, khi có khoá | **Có** | Dữ liệu nghiệp vụ phải **dùng lại**: số CCCD, số tài khoản |

Bài trước đã giải quyết mật khẩu: mật khẩu **không bao giờ cần đọc lại**, nên hash là đúng. Nhưng số CCCD thì khác: in ra hợp đồng, đối chiếu với dữ liệu của cơ quan dân cư, hiển thị 4 số cuối cho khách — nghĩa là ứng dụng **phải giải mã được**. Đây là lúc dùng mã hoá đối xứng. Và đây cũng là lúc phát sinh toàn bộ vấn đề của bài này: khoá quản lý thế nào, xoay khoá ra sao, và tìm kiếm trên dữ liệu đã mã hoá thế nào.

Một lưu ý pháp lý cho bối cảnh Việt Nam: CCCD, số tài khoản, số thẻ là dữ liệu cá nhân theo Nghị định 13/2023/NĐ-CP, và nhóm "dữ liệu cá nhân nhạy cảm" phải được mã hoá khi lưu chuyển và lưu trữ. Nói cách khác, cột {{cccd}} để plaintext trong DB không phải chuyện "nếu thấy thì sửa", mà là vi phạm.

### AES và "chế độ" (mode) — vì sao ECB bị cấm
{{AES}} là mã hoá **khối**: nó mã hoá từng blok 16 byte một với khoá 128/192/256 bit. Dữ liệu thật dài hơn 16 byte, nên cần một **chế độ** (mode) quyết định cách nối nhiều blok lại. Đây là chỗ mà {{Cipher.getInstance("AES/.../...")}} hỏi bạn.

{{ECB}} (Electronic CodeBook) là chế độ ngây thơ nhất: mỗi blok mã hoá độc lập. Hệ quả: **cùng một blok plaintext luôn cho cùng một blok ciphertext**, dù ở dòng nào, lúc nào. CCCD chỉ khác nhau vài chữ số cuối, vậy là phần đầu bản mã của hàng triệu người **giống hệt nhau**; attacker nhìn bảng là biết ai trùng 8 số đầu, gom được nhóm, đoán được quy tắc sinh số. Hình ảnh kinh điển: mã hoá ảnh con cá voi Tux bằng ECB vẫn thấy rõ hình con cá voi, vì các vùng cùng màu cho ra cùng một bản mã.

{{CBC}} (Cipher Block Chaining) khắc phục bằng cách XOR blok trước vào blok sau, nhưng cần padding và dính một họ lỗi rất nổi tiếng tên là **padding oracle**: nếu server trả về lỗi khác nhau khi "padding sai" và "MAC sai", attacker lặp lại hàng triệu request để giải mã từng byte mà không cần khoá — đây là lớp lỗi đã bị khai thác thực tế nhiều lần, từ cookie mã hoá của các nền tảng web cho tới BitLocker và SSH (CipherSuck, 2024). Bài học chung: **đừng tự ghép các mảnh bảo mật rời rạc**; dùng chế độ xác thực sẵn.

### GCM: một chế độ, hai tính năng
{{GCM}} (Galois/Counter Mode) = phần **mã hoá** chạy ở chế độ CTR + phần **xác thực** GHASH.
- CTR: từ IV (còn gọi là nonce) và một bộ đếm, AES sinh ra một **dòng keystream**, rồi XOR keystream với plaintext. Vì vậy ciphertext **dài đúng bằng** plaintext — đó là lý do tham số thứ ba trong {{Cipher.getInstance("AES/GCM/NoPadding")}} là {{NoPadding}} (không cần nhét thêm byte cho đủ blok).
- GHASH: tính một **tag** 16 byte phủ lên IV, ciphertext và (tuỳ chọn) phần dữ liệu thêm gọi là AAD. Khi decrypt, phần mềm tính lại tag và so; khác là ném {{AEADBadTagException}}.

Cặp mã hoá + xác thực như vậy gọi là **authenticated encryption** (AEAD). Nó chặn một tấn công rất thực tế: attacker không đọc được plaintext nhưng có toàn quyền sửa cột trong DB. Với {{ECB}} hoặc {{CBC}} không MAC, đổi vài byte là đổi được cả con số, tên người nhận. Với GCM, chỉ cần một bit bị sửa, {{decrypt}} fail ngay.

### IV 12 byte: vì sao lặp là chết
Với {{GCM}}, điều cấm kỵ tuyệt đối là **dùng lại IV dưới cùng một khoá**. Lý do, từng bước:
1. Cùng khoá + cùng IV → cùng một keystream (vì keystream chỉ sinh từ khoá và IV).
2. {{C1 = P1 xor K}} và {{C2 = P2 xor K}} → {{C1 xor C2 = P1 xor P2}}. Keystream bị triệt tiêu, attacker thu được **hiệu của hai plaintext**. Biết một trong hai số là suy ra số kia; và với các bản ghi có định dạng cố định (CCCD 12 chữ số) thì dò được cả hai.
3. Tệ hơn với GCM: lặp IV còn cho phép khôi phục khoá {{H}} của GHASH, tức là attacker **giả mạo được tag hợp lệ** mà không cần biết AES key.

Vì {{GCM}} hay dùng IV ngẫu nhiên, phải tính khả năng **va chạm** (birthday): chuẩn NIST SP 800-38D khuyến cáo không quá {{2^32}} bản mã sinh ra từ một khoá IV ngẫu nhiên. Con số này là lý do thật sự khiến bạn **phải** có xoay vòng khoá, chứ không phải vì "cho an toàn". Dùng IV 8 byte hoặc tự viết bộ đếm là tự chuốc rủi ro; 12 byte là độ dài chuẩn mà GCM xử lý nhanh nhất.

### Định dạng bản ghi và AAD
Định dạng được dùng phổ biến (và là định dạng bài tập này yêu cầu):

~~~text
lo luu = "v" + phienBanKhoa + ":" + base64( IV(12 byte) + ciphertext + tag(16 byte) )
ví dụ  = v2:Sjao9xkQ0m1QY3p0Y2V...
~~~

| Mảnh | Ai đọc được | Ghi chú |
|---|---|---|
| {{v2}} | Không cần khoá | Cho biết phải lấy khoá nào để giải mã; phải có trong keyring |
| {{IV}} 12 byte | Không cần khoá | Đi kèm bản mã, **không** bí mật, nhưng **không** được lặp |
| ciphertext | Chỉ người có khoá | Dài đúng bằng plaintext |
| tag 16 byte | Không cần khoá (chỉ để kiểm) | Bằng chứng bản mã chưa bị sửa |

{{tag}} đã nằm sẵn ở cuối mảng trả về của {{doFinal}}, bạn không phải tính riêng. Kích thước phần thêm: 12 + 16 = 28 byte, rồi base64 nhân ~1.37 lần. CCCD 12 ký tự → 40 byte → 56 ký tự base64 → cột {{varchar(96)}} là thừa chỗ cho cả tiền tố.

**AAD** (Additional Authenticated Data): những byte được đưa vào phép tính tag nhưng **không bị mã hoá** — thường là tên cột, tenant id, user id của dòng. Tác dụng: chặn tấn công **cắt–dán bản mã** giữa các dòng (lấy ciphertext CCCD của người A ghi vào dòng của người B: không đọc được gì, nhưng nếu không có AAD thì B bỗng mang CCCD của A). AAD cũng làm ciphertext của cùng một giá trị ở hai cột khác nhau trở nên khác nhau.

### Xoay vòng khoá bằng version
Không có khoá nào sống mãi: ai đó có quyền đọc đã nghỉ việc, dung lượng dữ liệu mã hoá bằng một key đã vượt giới hạn an toàn, hoặc nghi ngờ lộ key (kể cả lộ qua log). Xoay khoá nghĩa là: **thêm khoá mới, tăng "phiên bản hiện hành", không bao giờ sửa nội dung một khoá cũ**.

Chiến lược thực tế nhất ({{rotate}} trong bài tập):
- {{decrypt}}: đọc version từ tiền tố → lấy khoá tương ứng. Khoá cũ vẫn phải còn trong keyring, nếu không dữ liệu cũ **mất vĩnh viễn**.
- {{encrypt}}: luôn ghi bằng khoá hiện hành → dữ liệu tự "di cư" dần mỗi khi có một bản ghi được cập nhật.
- **Re-wrap khi đọc**: nếu giải mã thành công một blob version cũ, tiện thể ghi lại bằng version mới (idempotent, không có gì để ghi nếu đã là version hiện hành). Cách này rải đều chi phí, không cần một job khổng lồ khoá bảng cả đêm.
- **Batch job**: chạy offline khi cần "xoay gấp" vì lộ key, theo lô nhỏ và có đo lường tiến độ.
- Sau khi không còn bản ghi nào dùng khoá cũ → **huỷ** khoá. Xoá key chính là xoá dữ liệu ({{crypto-shredding}}, một cách tuân thủ yêu cầu "quên tôi đi"), và đó cũng là lý do bạn không được backup key ở nơi backup DB.

Trong production, đừng giữ key trong {{application.yml}} commit lên git. Mẫu chuẩn là **envelope encryption**: KMS (AWS KMS, GCP KMS) hoặc HashiCorp Vault giữ khoá **KEK**, app chỉ nhận về khoá **DEK** đã wrap và giải mã DEK trong bộ nhớ; app có thể đọc DEK hiện hành và các DEK cũ nhưng không tự ý lấy được KEK. Khi DB bị dump mà không kèm keyring, dữ liệu chỉ là rác.

### Blind index: tìm kiếm trên cột đã mã hoá
Mã hoá xong thì {{WHERE cccd = '0791234567890'}} hết tác dụng: giá trị trong DB là blob base64, và vì {{IV}} ngẫu nhiên nên mã hoá cùng số CCCD hai lần cho hai kết quả khác nhau → không so được.

Giải pháp là **blind index**: một cột phụ chứa {{HMAC-SHA256(khoá_index, giá_trị_đã_chuẩn_hoá)}} — deterministic, nên {{SELECT * FROM customers WHERE cccd_index = ?}} chạy được và dùng index B-tree bình thường. Ứng dụng tính HMAC của số vừa nhập rồi hỏi; DB không bao giờ thấy plaintext.

Vì sao HMAC có khoá mà không phải SHA-256 trần? CCCD chỉ gồm 12 chữ số, không gian giá trị đâu đó cỡ {{10^12}} (thực tế còn hẹp hơn vì có quy tắc sinh số) — một GPU băm hàng trăm triệu SHA-256 mỗi giây nên bảng tra dựng được trong vài giờ. Khoá HMAC làm bảng tra vô dụng và cho mỗi môi trường một chỉ mục khác nhau.

Ba điều phải trả giá, nên nói rõ khi thiết kế:
- **Chuẩn hoá** giá trị trước khi tạo index và trước khi truy vấn (bỏ khoảng trắng, bỏ số 0 đầu, cùng UTF-8 normalization) — hai bên lệch nhau một ký tự là tìm không thấy.
- Index **tiết lộ tính trùng**: hai dòng có cùng giá trị thì cùng {{blind_index}}. Với CCCD (vốn duy nhất) thì không sao; với cột ít giá trị (giới tính, loại giấy tờ) thì bạn vừa tự vẽ biểu đồ phân bố cho attacker.
- Không có {{LIKE}}, không có range search. Nếu nghiệp vụ thật sự cần "tìm 4 số cuối", hãy thiết kế cột riêng {{cccd_last4}} (vẫn nên kèm {{tenant_id}}) thay vì cố làm điều không thể.

### Java thuần: đủ dùng trong 8 dòng
~~~java
Cipher c = Cipher.getInstance("AES/GCM/NoPadding");
byte[] iv = new byte[12];
new SecureRandom().nextBytes(iv);                       // IV mới cho MỖI lần
c.init(Cipher.ENCRYPT_MODE, key, new GCMParameterSpec(128, iv));
byte[] body = c.doFinal(plaintext.getBytes(StandardCharsets.UTF_8));   // ciphertext || tag

// khi decrypt: tag được kiểm tra bên trong doFinal
Cipher d = Cipher.getInstance("AES/GCM/NoPadding");
d.init(Cipher.DECRYPT_MODE, oldKey, new GCMParameterSpec(128, ivFromStorage));
byte[] plain = d.doFinal(ctFromStorage, 12, ctFromStorage.length - 12);   // ném AEADBadTagException nếu bị sửa
~~~

### Cái giá phải trả
- AES chạy bằng {{AES-NI}} của CPU đạt cỡ vài GB/s, nên **hiệu suất không phải lý do** để sợ mã hoá; chi phí thật nằm ở chỗ mất khả năng truy vấn.
- Mất {{ORDER BY}}, {{GROUP BY}}, {{LIKE}}, aggregate trên cột đã mã hoá; báo cáo phải tính ở tầng ứng dụng hoặc từ một cột dẫn xuất.
- Khoá là **single point of failure**: KMS sập, key bị xoá, region mất — dữ liệu không đọc được. Phải có keyring nhiều bản, chạy thử quy trình restore thật định kỳ.
- Plaintext dễ rò qua kênh khác: log request, exception message, APM, audit log, API trả về DTO, clipboard của nhân viên vận hành. Mã hoá cột mà log ra {{cccd}} thì coi như không mã hoá.
- Migration: về sau thêm cột hoặc đổi định dạng phải có script và số liệu kiểm kê (bao nhiêu dòng mỗi version).

### Bẫy production
- IV cố định, IV = 0, hoặc dùng bộ đếm khởi động từ 0 mỗi lần app khởi động lại → lặp IV.
- "Mã hoá" bằng {{Base64}} rồi gọi là encrypted; hoặc tự chế {{AES-CBC}} + {{MD5}} kiểm toàn vẹn.
- Dùng **cùng một khoá** cho {{AES}} và cho {{HMAC}} index, hoặc dùng một khoá cho mọi cột và mọi môi trường → mất tính độc lập; hãy tách khoá, hoặc dẫn xuất từ một master key với nhãn riêng cho từng mục đích.
- Sửa {{AEADBadTagException}} thành {{IllegalArgumentException}}: caller không còn phân biệt được "dữ liệu hỏng format" và "dữ liệu bị can thiệp", và bạn mất luôn tín hiệu cảnh báo sớm.
- Đặt khoá vào biến môi trường rồi in biến môi trường ra log lúc khởi động để "debug".
- Quên rằng dữ liệu đã mã hoá vẫn phải **validate trước khi dùng** ({{decrypt}} xong vẫn kiểm định dạng CCCD), và vẫn phải chống SQL injection như mọi cột khác.
- Xoay khoá bằng cách ghi đè khoá cũ trong keyring: đúng ra phải thêm phiên bản mới; ghi đè làm mọi blob cũ không thể đọc được.

### Liên hệ phỏng vấn
Bộ câu hỏi hay gặp: "Bạn lưu số CCCD thế nào?", "IV và nonce khác gì salt?", "Vì sao không dùng ECB?", "Xoay khoá mà vẫn đọc được dữ liệu cũ thì làm kiểu gì?", "Mã hoá rồi thì tìm kiếm ra sao?", "AAD để làm gì?". Mỗi câu đã có câu trả lời ở trên; khi trả lời, hãy nói theo thứ tự **mối đe dọa → cơ chế → chi phí đánh đổi** (ví dụ: "ECB lộ mẫu hình nên dùng GCM; GCM cấm lặp IV nên mỗi lần encrypt một IV 12 byte ngẫu nhiên và xoay khoá trước khi chạm ngưỡng 2^32 bản mã; vì không query được nên thêm cột blind index HMAC"). Làm bài tập để cầm chắc phần cơ chế: viết {{encrypt}}, {{decrypt}}, {{rotate}}, {{blindIndex}} và thấy tận tay {{AEADBadTagException}} nổ ra khi ai đó sửa một byte.`,
  exercises: [
    {
      title: 'Viết FieldCipher: AES-GCM với IV ngẫu nhiên, version khoá, rotate và blind index',
      prompt: `Hoàn thiện class {{FieldCipher}}. Hai hằng {{IV_BYTES = 12}} và {{TAG_BITS = 128}} đã khai báo, **đừng đổi**.

- {{FieldCipher(keysByVersion, currentVersion, random)}}: lưu **bản copy** của map ({{new HashMap<>(...)}} để dữ liệu bên ngoài sửa không làm mất khả năng giải mã); {{currentVersion}} phải có key trong map, không thì ném {{IllegalArgumentException}}.
- {{encrypt(plaintext)}}: sinh {{IV_BYTES}} byte mới bằng {{SecureRandom}} đã truyền vào, mã {{AES/GCM/NoPadding}} với khoá hiện hành và {{GCMParameterSpec(TAG_BITS, iv)}}, trả về
  {{"v" + currentVersion + ":" + Base64.getEncoder().encodeToString(iv || ciphertext || tag)}}
  ({{doFinal}} đã trả ciphertext nối tiếp tag, chỉ cần ghép {{iv}} vào đầu). Không ném checked exception nào khác {{GeneralSecurityException}}.
- {{decrypt(stored)}}: tách version và phần base64, **lấy khoá theo version đọc từ chuỗi** (có thể là khoá cũ), giải mã và trả plaintext UTF-8. Quy ước lỗi: hỏng format (chuỗi {{null}}, thiếu tiền tố {{v}}, không có {{:}}, version không có trong map, base64 sai, hoặc độ dài decoded nhỏ hơn {{IV_BYTES + TAG_BITS / 8}}) → {{IllegalArgumentException}}; tag không hợp lệ → **để nguyên {{AEADBadTagException}} ném lên**, không được bọc thành loại khác (caller phải phân biệt được "hỏng format" và "bị can thiệp").
- {{rotate(stored)}}: nếu {{stored}} đã mang version hiện hành thì **trả lại đúng chuỗi đó** (idempotent, không ghi lại vô ích); ngược lại giải mã bằng khoá cũ và trả bản mã mới theo version hiện hành.
- {{blindIndex(plaintext, hmacKey)}} (static): HMAC-SHA256 trên byte UTF-8 của {{plaintext}}, trả hex **chữ thường** 64 ký tự ({{HexFormat.of().formatHex(...)}}). Đây là giá trị ghi vào cột {{cccd_index}} để query equality. Không ném checked exception.

Chỉ JDK 17. Không dùng {{ThreadLocal}} hay thời gian thực; {{Cipher}} tạo mới mỗi lần gọi (nó không thread-safe).`,
      starter: `import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;
import javax.crypto.Cipher;
import javax.crypto.Mac;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;

final class FieldCipher {
    static final int IV_BYTES = 12;
    static final int TAG_BITS = 128;

    private final Map<Integer, SecretKey> keys;
    private final int currentVersion;
    private final SecureRandom random;

    FieldCipher(Map<Integer, SecretKey> keysByVersion, int currentVersion, SecureRandom random) {
        throw new UnsupportedOperationException("TODO");
    }

    String encrypt(String plaintext) throws GeneralSecurityException {
        throw new UnsupportedOperationException("TODO");
    }

    String decrypt(String stored) throws GeneralSecurityException {
        throw new UnsupportedOperationException("TODO");
    }

    String rotate(String stored) throws GeneralSecurityException {
        throw new UnsupportedOperationException("TODO");
    }

    static String blindIndex(String plaintext, SecretKey hmacKey) {
        throw new UnsupportedOperationException("TODO");
    }

    private static int colonIndex(String stored) {
        throw new UnsupportedOperationException("TODO");
    }
}`,
      tests: `import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;
import javax.crypto.AEADBadTagException;
import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;

public class Main {
    interface Case { void run() throws Exception; }
    static int passed = 0, total = 0;
    static void check(String name, Case c) {
        total++;
        try { c.run(); passed++; System.out.println("PASS " + name); }
        catch (Throwable t) { System.out.println("FAIL " + name + ": " + t); }
    }
    static void eq(Object expected, Object actual) {
        if (!Objects.equals(expected, actual)) throw new AssertionError("expected " + expected + " got " + actual);
    }
    static void expect(Class<? extends Throwable> kind, Case c) {
        try { c.run(); }
        catch (Throwable t) {
            if (!kind.isInstance(t)) throw new AssertionError("mong " + kind.getSimpleName() + " nhung nhan " + t);
            return;
        }
        throw new AssertionError("mong " + kind.getSimpleName() + " nhung khong ném loi");
    }
    static SecretKey aes(int fill) {
        byte[] b = new byte[32];                                  // AES-256
        Arrays.fill(b, (byte) fill);
        return new SecretKeySpec(b, "AES");
    }
    static Map<Integer, SecretKey> keys() {
        Map<Integer, SecretKey> m = new HashMap<>();
        m.put(1, aes(1));
        m.put(2, aes(2));
        return m;
    }
    static FieldCipher cipher(int current) { return new FieldCipher(keys(), current, new SecureRandom()); }
    static String prefix(String stored) { return stored.substring(0, stored.indexOf(':')); }
    static byte[] payload(String stored) { return Base64.getDecoder().decode(stored.substring(stored.indexOf(':') + 1)); }
    static String flipped(String stored, int offset) {
        byte[] b = payload(stored);
        b[offset] = (byte) (b[offset] ^ 1);
        return prefix(stored) + ":" + Base64.getEncoder().encodeToString(b);
    }
    static final String CCCD = "0791234567890";
    static SecretKey indexKey() { return new SecretKeySpec("0123456789abcdef".getBytes(StandardCharsets.US_ASCII), "HmacSHA256"); }
    public static void main(String[] args) {
        FieldCipher c = cipher(2);
        check("encrypt stores vCURRENT and base64 of iv plus ciphertext plus tag", () -> {
            String stored = c.encrypt(CCCD);
            eq("v2", prefix(stored));
            int n = CCCD.getBytes(StandardCharsets.UTF_8).length;
            eq(FieldCipher.IV_BYTES + n + FieldCipher.TAG_BITS / 8, payload(stored).length);
            if (stored.indexOf('.') >= 0) throw new AssertionError("base64 chuan khong co dau cham");
        });
        check("round trip keeps the empty string and Vietnamese text", () -> {
            eq("", c.decrypt(c.encrypt("")));
            String vn = "Số CCCD 0791234567890 - Nguyễn Thị Bé, TP.HCM";
            eq(vn, c.decrypt(c.encrypt(vn)));
        });
        check("same value twice gives different blobs, both decryptable", () -> {
            String a = c.encrypt(CCCD);
            String b = c.encrypt(CCCD);
            if (a.equals(b)) throw new AssertionError("IV bi dung lai: hai blob giong het nhau");
            eq(CCCD, c.decrypt(a));
            eq(CCCD, c.decrypt(b));
        });
        check("flipping a ciphertext byte raises AEADBadTagException", () -> {
            String stored = c.encrypt(CCCD);
            expect(AEADBadTagException.class, () -> c.decrypt(flipped(stored, FieldCipher.IV_BYTES + 2)));
        });
        check("flipping an IV byte also raises AEADBadTagException", () -> {
            String stored = c.encrypt(CCCD);
            expect(AEADBadTagException.class, () -> c.decrypt(flipped(stored, 3)));
            expect(AEADBadTagException.class, () -> c.decrypt(flipped(stored, FieldCipher.IV_BYTES - 1)));
        });
        check("decrypt reads a blob written with the older key version", () -> {
            String v1 = cipher(1).encrypt(CCCD);
            eq("v1", prefix(v1));
            eq(CCCD, cipher(2).decrypt(v1));
        });
        check("rotate moves v1 to current and is idempotent", () -> {
            String v1 = cipher(1).encrypt(CCCD);
            String v2 = cipher(2).rotate(v1);
            eq("v2", prefix(v2));
            eq(CCCD, cipher(2).decrypt(v2));
            eq(v2, cipher(2).rotate(v2));
            if (v2.equals(v1)) throw new AssertionError("rotate khong doi duoc version");
        });
        check("malformed storage and unknown key version are IllegalArgumentException", () -> {
            expect(IllegalArgumentException.class, () -> cipher(2).decrypt("v9:" + Base64.getEncoder().encodeToString(new byte[40])));
            expect(IllegalArgumentException.class, () -> cipher(2).decrypt("khong phai ban ma"));
            expect(IllegalArgumentException.class, () -> cipher(2).decrypt("v2:" + Base64.getEncoder().encodeToString(new byte[20])));
            expect(IllegalArgumentException.class, () -> cipher(2).decrypt("abc:" + Base64.getEncoder().encodeToString(new byte[40])));
            expect(IllegalArgumentException.class, () -> cipher(2).decrypt(null));
        });
        check("constructor rejects a current version with no key", () -> {
            expect(IllegalArgumentException.class, () -> new FieldCipher(keys(), 7, new SecureRandom()));
        });
        check("blindIndex is HMAC-SHA256 lowercase hex", () -> {
            String idx = FieldCipher.blindIndex("987654321012345", indexKey());
            eq("4f04392005b677d67c17009aacb3093d36eeb8341aeba727b67f34ad784c6384", idx);
            eq(64, idx.length());
            if (!idx.matches("[0-9a-f]{64}")) throw new AssertionError("blindIndex khong phai hex thuong: " + idx);
        });
        check("blindIndex is deterministic and depends on value and key", () -> {
            eq(FieldCipher.blindIndex(CCCD, indexKey()), FieldCipher.blindIndex(CCCD, indexKey()));
            if (FieldCipher.blindIndex(CCCD, indexKey()).equals(FieldCipher.blindIndex("0791234567891", indexKey())))
                throw new AssertionError("hai gia tri khac nhau cung index");
            SecretKey other = new SecretKeySpec("fedcba9876543210".getBytes(StandardCharsets.US_ASCII), "HmacSHA256");
            if (FieldCipher.blindIndex(CCCD, indexKey()).equals(FieldCipher.blindIndex(CCCD, other)))
                throw new AssertionError("doi khoa ma index khong doi");
            if (FieldCipher.blindIndex(CCCD, indexKey()).equals(CCCD)) throw new AssertionError("blindIndex lo gia tri");
        });
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
      reference: `import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.HashMap;
import java.util.HexFormat;
import java.util.Map;
import javax.crypto.Cipher;
import javax.crypto.Mac;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;

final class FieldCipher {
    static final int IV_BYTES = 12;
    static final int TAG_BITS = 128;

    private final Map<Integer, SecretKey> keys;
    private final int currentVersion;
    private final SecureRandom random;

    FieldCipher(Map<Integer, SecretKey> keysByVersion, int currentVersion, SecureRandom random) {
        this.keys = new HashMap<>(keysByVersion);            // copy: map bên ngoài bị đổi thì vẫn giải mã được
        this.random = random;
        if (!keys.containsKey(currentVersion)) {
            throw new IllegalArgumentException("khong co key cho phien ban hien hanh: v" + currentVersion);
        }
        this.currentVersion = currentVersion;
    }

    String encrypt(String plaintext) throws GeneralSecurityException {
        byte[] iv = new byte[IV_BYTES];
        random.nextBytes(iv);                               // IV MOI 100% moi lan — GCM cam lap IV
        Cipher c = Cipher.getInstance("AES/GCM/NoPadding");  // GCM = CTR + GHASH, khong can padding
        c.init(Cipher.ENCRYPT_MODE, keys.get(currentVersion), new GCMParameterSpec(TAG_BITS, iv));
        byte[] body = c.doFinal(plaintext.getBytes(StandardCharsets.UTF_8));   // ciphertext || tag
        byte[] all = ByteBuffer.allocate(iv.length + body.length).put(iv).put(body).array();
        return "v" + currentVersion + ":" + Base64.getEncoder().encodeToString(all);
    }

    String decrypt(String stored) throws GeneralSecurityException {
        int cut = colonIndex(stored);
        int version = Integer.parseInt(stored.substring(1, cut));
        SecretKey key = keys.get(version);                   // co the la khoa cua phien ban cu
        if (key == null) throw new IllegalArgumentException("khong co key cho phien ban: v" + version);
        byte[] all = Base64.getDecoder().decode(stored.substring(cut + 1));
        if (all.length < IV_BYTES + TAG_BITS / 8) throw new IllegalArgumentException("ban ma qua ngan");
        Cipher c = Cipher.getInstance("AES/GCM/NoPadding");
        c.init(Cipher.DECRYPT_MODE, key, new GCMParameterSpec(TAG_BITS, all, 0, IV_BYTES));
        // doFinal KIỂM TAG và ném AEADBadTagException nếu bản mã bị sửa — để nguyên, không bọc
        byte[] plain = c.doFinal(all, IV_BYTES, all.length - IV_BYTES);
        return new String(plain, StandardCharsets.UTF_8);
    }

    String rotate(String stored) throws GeneralSecurityException {
        int cut = colonIndex(stored);
        if (Integer.parseInt(stored.substring(1, cut)) == currentVersion) return stored;   // idempotent
        return encrypt(decrypt(stored));                     // đọc bằng khóa cũ, ghi bằng khóa mới
    }

    static String blindIndex(String plaintext, SecretKey hmacKey) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(hmacKey);                               // khoa rieng, kh dung lai khoa AES
            return HexFormat.of().formatHex(mac.doFinal(plaintext.getBytes(StandardCharsets.UTF_8)));
        } catch (GeneralSecurityException e) {
            throw new IllegalStateException("HmacSHA256 phai co trong moi JVM", e);
        }
    }

    private static int colonIndex(String stored) {
        if (stored == null || stored.charAt(0) != 'v') throw new IllegalArgumentException("sai dinh dang ban ma");
        int cut = stored.indexOf(':');
        if (cut <= 1) throw new IllegalArgumentException("sai dinh dang ban ma");
        return cut;
    }
}`,
      hints: [
        'Ghép mảng bằng {{ByteBuffer.allocate(iv.length + body.length).put(iv).put(body).array()}}; khi tách ra thì {{Arrays.copyOfRange}} cho IV và {{doFinal(all, IV_BYTES, all.length - IV_BYTES)}} cho phần còn lại.',
        '{{GCMParameterSpec(TAG_BITS, all, 0, IV_BYTES)}} là overload đọc IV ngay trong mảng đã lưu — khỏi cần copy.',
        'Đừng bọc toàn bộ {{decrypt}} trong một {{catch}} bắt {{GeneralSecurityException}} rồi ném lại {{IllegalArgumentException}}: {{AEADBadTagException}} là lớp con của {{GeneralSecurityException}} nên nó sẽ bị nuốt mất.',
        '{{Integer.parseInt}} ném {{NumberFormatException}} (là con của {{IllegalArgumentException}}) và {{Base64.getDecoder().decode}} ném {{IllegalArgumentException}} — hai thứ đó đã đáp ứng đúng yêu cầu "hỏng format thì IllegalArgumentException".',
        'Với {{stored.charAt(0)}} khi {{stored}} rỗng: kiểm {{null}} và {{isEmpty}} trước khi đọc {{charAt}} để không ném {{IndexOutOfBoundsException}}.',
      ],
      explain: `Bốn chỗ quyết định bài này, và cũng là bốn thứ interviewer hay moi.

**Một là không bọc {{AEADBadTagException}}.** Nó là lớp con của {{GeneralSecurityException}}, nên một {{catch (GeneralSecurityException e)}} "cho sạch" sẽ nuốt nó và biến "có người đang sửa dữ liệu" thành "chuỗi lỗi format". Hai tình huống đó cần hai hành động rất khác: format sai là dữ liệu bẩn, tag sai là **toàn vẹn bị vi phạm** — phải ghi audit log và cảnh báo. Đây là lý do {{decrypt}} khai báo {{throws GeneralSecurityException}} rồi để exception đi lên tự nhiên.

**Hai là giới hạn độ dài tối thiểu.** {{GCM}} cần đủ chỗ cho IV 12 byte và tag 16 byte. Một blob 20 byte hợp lệ về base64 nhưng vô nghĩa về mật mã: nếu bạn không chặn mà đẩy thẳng vào {{doFinal}}, bạn nhận được {{InvalidAlgorithmParameterException}} hoặc kết quả khó đoán. Chặn bằng {{IllegalArgumentException}} ở tầng phân tích định dạng là đúng nơi, đúng loại lỗi.

**Ba là rotate phải idempotent.** Nếu {{rotate}} luôn giải mã rồi mã hoá lại, mỗi lần chạy là mỗi lần sinh IV mới → blob đổi liên tục, batch job ghi đè chính mình, binary diff của backup phình to, và bạn không bao giờ hội tụ. Kiểm version trước, đã là hiện hành thì trả nguyên văn — đó cũng là cách để job rotate chạy đi chạy lại nhiều lần mà không cần trạng thái.

**Bốn là khoá HMAC phải khác khoá AES.** Cùng một khoá dùng cho hai mục đích (mã hoá và chỉ mục) nghĩa là một chỗ lộ làm sập cả hai, và ở một số thuật toán còn mở đường tấn công kiểu "dùng chính oracle HMAC để dò bản mã". Tách khoá, hoặc dẫn xuất từ master key bằng HKDF với nhãn riêng cho từng mục đích.

Ngoài bài tập, hai điều nên nhớ vì chúng là câu hỏi "tại sao" hay bị chặn nhất: (1) {{blindIndex}} deterministic là **một sự rò rỉ có chủ đích** — nó cho biết "hai dòng có cùng giá trị", nên chỉ chấp nhận cho dữ liệu gần như duy nhất như CCCD, không dùng cho cột ít giá trị; (2) {{AAD}} không che dữ liệu mà **buộc** dữ liệu phụ thuộc (tenant id, tên cột) vào phép kiểm tag, chặn việc cắt–dán bản mã giữa các dòng. Thêm {{c.updateAAD}} trước {{doFinal}} và cho nó vào đúng chuỗi đó khi decrypt, nếu không tag sẽ không khớp.`,
    },
  ],
  check: [
    {
      q: 'Vì sao {{ECB}} bị cấm và {{GCM}} được chọn cho cột dữ liệu nhạy cảm?',
      options: [
        'ECB chậm hơn GCM nên chỉ dùng khi cần tốc độ',
        'ECB mã hoá từng blok độc lập nên cùng plaintext cho cùng ciphertext, lộ mẫu hình; GCM vừa mã hoá vừa gắn tag xác thực nên phát hiện bản mã bị sửa',
        'ECB chỉ làm việc với khoá 128 bit, GCM hỗ trợ 256 bit',
        'ECB không giải mã được ngược lại, nên phải dùng GCM',
      ],
      answer: 1,
      explain: `Vấn đề của {{ECB}} là **tính tất định theo blok**: hai dòng có 16 byte đầu giống nhau sẽ có 16 byte bản mã đầu giống nhau, đủ để gom nhóm và suy ra cấu trúc dữ liệu. {{GCM}} khắc phục bằng CTR (keystream khác nhau mỗi IV) và cộng thêm tag để kiểm toàn vẹn — tức là **authenticated encryption**. ECB và GCM đều chạy được với khoá 256 bit và cả hai đều giải mã được ngược lại; tốc độ không phải lý do.`,
    },
    {
      q: 'Hai lần {{encrypt}} cùng một số CCCD với cùng một khoá cho ra hai blob khác nhau. Điều gì xảy ra nếu hai lần đó **trùng IV**?',
      options: [
        'Không sao, vì ciphertext đã khác nhau do tag',
        'Cùng khoá và cùng IV sinh cùng keystream, nên C1 xor C2 bằng P1 xor P2: attacker bỏ được keystream và thu được hiệu hai plaintext, với GCM còn có thể khôi phục khoá GHASH để giả mạo tag',
        'Chỉ làm tăng dung lượng lưu trữ, không ảnh hưởng bảo mật',
        '{{decrypt}} sẽ fail, nên hệ thống tự phát hiện ra vấn đề',
      ],
      answer: 1,
      explain: `Đây là lỗi **nhận biết được (detectable) nhưng không phục hồi được (irrecoverable)**: {{decrypt}} vẫn trả ra plaintext đúng, nên log không báo gì, trong khi độ bí mật đã mất. Hai bản mã cùng IV → cùng keystream, XOR với nhau triệt tiêu keystream. Vì GCM hay dùng IV ngẫu nhiên nên chuẩn NIST đặt trần {{2^32}} bản mã cho một khoá, và đó chính là lý do phải xoay vòng khoá.`,
    },
    {
      q: 'Bạn cần {{WHERE cccd = ?}} trên cột đã mã hoá AES-GCM. Làm thế nào?',
      options: [
        'Mã hoá giá trị cần tìm bằng cùng hàm encrypt rồi so sánh, vì cùng đầu vào cho cùng bản mã',
        'Lưu thêm cột blind index là HMAC-SHA256 của giá trị đã chuẩn hoá với một khoá riêng, query bằng {{WHERE cccd_index = ?}}',
        'Chuyển cột sang AES-ECB để bản mã deterministic',
        'Không thể, phải giải mã toàn bộ bảng trong bộ nhớ',
      ],
      answer: 1,
      explain: `{{encrypt}} với GCM **không deterministic** (IV ngẫu nhiên), nên cách thứ nhất sai ngay từ giả định. {{blindIndex}} tạo giá trị deterministic mà vẫn không lộ nội dung; giải mã cả bảng thì sập về bộ nhớ và vi phạm cả nguyên tắc least privilege. ECB deterministic thật, nhưng đổi lại là lộ mẫu hình toàn bộ dữ liệu — một lỗ hổng, không phải một giải pháp.`,
    },
    {
      q: 'Xoay vòng khoá đúng cách là gì?',
      options: [
        'Sửa lại nội dung khoá cũ trong keyring thành khoá mới, dữ liệu cũ tự đọc được',
        'Thêm khoá mới với version cao hơn, decrypt chọn khoá theo version lưu trong blob, encrypt luôn ghi bằng khoá hiện hành, và huỷ khoá cũ sau khi không còn bản ghi nào dùng tới',
        'Giữ một khoá duy nhất và đổi IV mỗi ngày',
        'Mã hoá lại toàn bộ bảng trong một transaction lớn vào giờ thấp điểm',
      ],
      answer: 1,
      explain: `Ghi đè khoá cũ làm **mất khả năng đọc** mọi blob cũ — thảm hoạ thường gặp nhất. Version trong blob cho biết phải dùng khoá nào, nên keyring giữ nhiều khoá cùng lúc và tự "di cư" dữ liệu khi có lượt đọc/ghi. Đổi IV không liên quan tới khoá. Quét lại toàn bộ bảng trong một transaction thì khoá bảng hàng giờ và không xử lý được dòng hỏng giữa đường; chiến lược thật là kết hợp re-wrap khi đọc và batch job nhỏ theo lô.`,
    },
  ],
  related: ['security-009', 'security-019', 'security-025'],
  tags: ['AES-GCM', 'IV', 'field encryption', 'key rotation', 'blind index', 'AAD'],
},
{
  id: 'lesson-security-008',
  track: 'security',
  order: 8,
  title: 'SQL injection từ gốc: code và data đi chung một đường, PreparedStatement tách chúng ra, và ba chỗ phải tự canh',
  level: 'mid',
  minutes: 40,
  goals: [
    'Giải thích được vì sao DB không phân biệt nổi "giá trị" và "lệnh" khi ta nối chuỗi, còn placeholder {{?}} thì phân biệt được',
    'Dùng đúng truy vấn tham số trong JDBC, {{JdbcTemplate}} và JPQL, đồng thời biết chỗ nào vẫn còn nguy hiểm',
    'Xử lý đúng ba ca khó: {{ORDER BY}}/tên cột/tên bảng (whitelist), {{LIKE}} (escape {{%}} và {{_}}), second-order injection',
    'Viết test chứng minh câu SQL sinh ra không chứa input của người dùng',
  ],
  body: `**Tóm tắt:** SQL injection xảy ra khi **dữ liệu người dùng bị trộn vào câu lệnh SQL trước lúc DB parse**, nên DB không còn cách nào biết phần nào là "chữ để tìm" và phần nào là "lệnh phải làm". Chặn bằng **truy vấn tham số (parameterized query)**: gửi câu SQL có placeholder {{?}} để DB parse và lập kế hoạch trước, rồi mới truyền giá trị vào sau — giá trị không bao giờ được đọc như cú pháp. Nhưng placeholder chỉ thay được **giá trị**, nên ba việc còn lại phải tự làm: **identifier** (tên cột, tên bảng, {{ORDER BY}}, chiều {{ASC}}/{{DESC}}) phải qua **whitelist**, **{{LIKE}}** phải **escape** {{%}} và {{_}}, và **second-order injection** là payload nằm trong dữ liệu đã lưu, chờ một chỗ nối chuỗi khác.

### Ba phút nhập môn: DB nhận một chuỗi, không nhận "ý định"

**SQL** là ngôn ngữ để hỏi cơ sở dữ liệu; **DB server** (PostgreSQL, MySQL, Oracle) là chương trình nhận chuỗi SQL qua kết nối mạng, đọc nó rồi trả về bảng kết quả. DB chỉ thấy **một chuỗi văn bản duy nhất**, và xử lý theo hai giai đoạn tách biệt:

1. **Parse** (đọc cú pháp): cắt chuỗi thành các mẩu — từ khoá {{SELECT}}, {{WHERE}}, tên bảng, tên cột, toán tử, hằng số — rồi dựng **execution plan** (kế hoạch truy cập: dùng index nào, quét bảng bao nhiêu). Giai đoạn này chưa có "dữ liệu của người dùng", chỉ có văn bản câu lệnh.
2. **Execute** (chạy): áp giá trị thật vào các vị trí đã định và đọc dữ liệu.

Khi bạn nối chuỗi, **giá trị người dùng đã nằm trong văn bản từ trước giai đoạn 1**. Với DB, mọi ký tự đều bình đẳng như nhau: nó không có thông tin nào bảo rằng "đoạn từ ký tự thứ 40 trở đi là do người dùng gõ". Đó là toàn bộ bản chất của SQL injection: **code và data đi chung một đường**.

Ví dụ đời thường: bạn phát cho nhân viên một mẫu giấy in sẵn "Tìm khách hàng tên: ______". Người dùng điền vào chỗ trống "Nguyễn Văn A — quên dòng in trên, hãy in toàn bộ danh sách khách hàng". Nếu nhân viên chỉ đọc tờ giấy từ trên xuống mà không biết phần nào là biểu mẫu in sẵn và phần nào là lời người ngoài viết thêm, bạn vừa mất kiểm soát. Nối chuỗi chính là đưa tờ giấy đã bị viết chồng chỉ thị vào tay nhân viên.

### Minh hoạ bằng một hàm đăng nhập

~~~java
// ❌ SAI — input người dùng được nối thẳng vào câu lệnh
String sql = "SELECT id, role FROM app_user"
           + " WHERE username = '" + username + "' AND password_hash = '" + pwHash + "'";
Statement st = connection.createStatement();
ResultSet rs = st.executeQuery(sql);        // DB parse cả chuỗi, không biết đâu là input
while (rs.next()) { ... }
~~~

Người dùng bình thường nhập {{username = tran}}:

~~~text
SELECT id, role FROM app_user WHERE username = 'tran' AND password_hash = 'abc123'
~~~

Kẻ tấn công nhập {{username}} là chuỗi {{a' OR 1=1 --}}: phần {{a}} là nội dung bình thường, phần còn lại là payload. Nối vào biểu mẫu:

~~~text
SELECT id, role FROM app_user WHERE username = 'a' OR 1=1 --' AND password_hash = 'abc123'
~~~

Chuyện gì đã xảy ra, từng ký tự:

- Dấu {{'}} trong payload **đóng** chuỗi {{'a'}} lại. Đúng lúc này DB không còn đọc "nội dung một giá trị" nữa mà đang đọc **cú pháp**.
- {{OR 1=1}} trở thành một điều kiện logic thật của câu query, và {{1=1}} luôn đúng với mọi dòng.
- {{--}} mở một **chú thích**: mọi thứ sau nó trên cùng dòng — kể cả {{' AND password_hash = 'abc123'}} — bị DB bỏ qua. Điều kiện mật khẩu biến mất, còn câu lệnh vẫn hoàn toàn hợp lệ về cú pháp.

Kết quả: query trả về **toàn bộ 12.480 người dùng**, thường có cả role {{ADMIN}}. App chỉ lấy dòng đầu tiên để đăng nhập, nên kẻ tấn công vào được bằng tài khoản quyền cao nhất mà **không có lỗi nào được ném ra**.

Biến thể thứ hai hay gặp khi điểm injection là **giá trị cuối cùng** của {{WHERE}} (ví dụ {{AND device = '<input>'}}) — không cần {{--}} vì cặp nháy tự cân bằng:

~~~text
... WHERE username = 'tran' AND device = 'x' OR '1'='1'
~~~

Ở đây {{'1'='1'}} được parse là so sánh hai chuỗi hằng, luôn đúng. Điểm chung của cả hai kiểu: người dùng đã **đưa được ký tự nháy đơn ra khỏi vùng dữ liệu**, tức là sửa được cấu trúc câu lệnh.

Payload phá hoại dùng {{;}} để tách câu thứ hai — loại này chỉ chạy khi API và driver cho phép nhiều câu trong một lời gọi ({{Statement.execute}} với MySQL/SQL Server; JDBC driver của PostgreSQL thường chặn):

~~~text
username = x'); DROP TABLE app_user; --
-->  ... WHERE username = 'x'); DROP TABLE app_user; --' AND password_hash = '...'
~~~

Điều nên nhớ: **đọc trộm dữ liệu chỉ cần một câu {{SELECT}} hợp lệ**, không cần {{;}} và không cần driver cho phép nhiều câu — đó là dạng tấn công thực tế gặp nhiều nhất.

Và một cách nhìn khác về hậu quả: nếu màn hình chỉ hiển thị dòng đầu tiên thì người lập trình viên vẫn thấy "mọi thứ bình thường", trong khi toàn bộ bảng đã được đọc. Signal duy nhất là số dòng trả về, thứ mà chẳng ai log.

### PreparedStatement làm gì mà chặn được

{{PreparedStatement}} là đối tượng JDBC cho phép gửi câu SQL **có chỗ trống** (placeholder) tách biệt khỏi giá trị:

~~~java
// ✅ ĐÚNG — câu lệnh và giá trị đi hai lần khác nhau
String sql = "SELECT id, role FROM app_user WHERE username = ? AND password_hash = ?";
try (PreparedStatement ps = connection.prepareStatement(sql)) {
    ps.setString(1, username);      // giá trị, không phải cú pháp
    ps.setString(2, pwHash);
    try (ResultSet rs = ps.executeQuery()) {
        if (rs.next()) { ... }       // input độc hại -> 0 dòng, không phải "lách"
    }
}
~~~

Trên đường dây, thứ tự thay đổi hẳn:

~~~text
Nối chuỗi   : [ SELECT ... WHERE username = 'tran' OR '1'='1' AND ... ]  --> DB parse --> chạy
                                                     (giá trị bị parse làm cú pháp)

Bind param  : [ SELECT ... WHERE username = ? AND password_hash = ? ]   --> DB parse + plan
              (sau đó) [ $1 = "tran' OR '1'='1", $2 = "abc123" ]         --> chỉ nhét vào ô dữ liệu
~~~

Vì {{?}} đã được định vị từ giai đoạn parse, giá trị bind chỉ có thể rơi vào **ô dữ liệu**. DB tự làm việc quote và escape: chuỗi {{tran' OR '1'='1}} được so sánh **nguyên văn** với cột {{username}}, không có dòng nào tên như thế, kết quả là 0 dòng. Dấu {{'}} trong giá trị không còn là "đóng chuỗi" nữa, nó chỉ là một ký tự trong nội dung.

Hai hiểu lầm cần bỏ:

- **"Dùng ORM là miễn nhiễm."** Hibernate sinh SQL tham số cho {{findById}}, {{@Query}} có {{:param}}, Criteria API — phần đó an toàn. Nhưng bạn tự tay nối chuỗi trong JPQL, trong native query, hoặc truyền tên cột từ request thì vẫn là SQL injection, vì Hibernate parse **chuỗi cuối cùng**.
- **"PreparedStatement chậm hơn nên phải nối chuỗi cho nhanh."** Ngược lại: nhiều driver và DB có thể tái dùng plan/statement đã chuẩn bị (tùy driver, kết nối, cấu hình — ví dụ JDBC driver của PostgreSQL có tham số {{prepareThreshold}}). Dù có được lợi ích đó hay không, việc "phải ghép chuỗi động" cũng không bao giờ là lý do để bỏ tham số.

### PreparedStatement không cứu được mọi chỗ — vì placeholder chỉ thay được GIÁ TRỊ

Đây là điểm phân biệt quan trọng nhất mà interviewer chờ bạn nói tới: {{?}} chỉ đứng ở vị trí mà cú pháp SQL cho phép một **giá trị** (value), không đứng ở vị trí của một **identifier** (tên cột, tên bảng) hay **keyword** ({{ASC}}/{{DESC}}, tên phép toán).

| Vị trí trong câu SQL | Bind {{?}} được? | Cách xử lý đúng |
|---|---|---|
| {{WHERE email = ?}}, {{BETWEEN ? AND ?}}, {{INSERT VALUES (?)}} | Có | Tham số JDBC / {{:param}} JPQL |
| {{ORDER BY ?}} | Không (PostgreSQL/MySQL chỉ nhận value ở vị trí này; bind tên cột thành chuỗi thì mọi dòng sort theo chính chuỗi đó — không báo lỗi nhưng vô nghĩa) | **Whitelist** cột, map tên API → tên cột |
| chiều sort {{ASC}}/{{DESC}} | Không | Validate trong {{Set.of("ASC","DESC")}}, mặc định {{ASC}} |
| tên bảng / tên schema | Không | Enum hoặc map whitelist, không bao giờ dùng input |
| {{LIMIT ?}} / {{OFFSET ?}} | Có (PostgreSQL, MySQL; Oracle dùng {{FETCH FIRST ? ROWS ONLY}}) |Bind {{int}}, cộng trần tối đa |
| danh sách {{IN (?, ?, ?)}} | Số placeholder phải **động** theo độ dài danh sách | Sinh đúng n dấu {{?}}, bind n giá trị |
| {{LIKE}} value | Có, nhưng {{%}}/{{_}} trong value vẫn là ký tự đại diện | Escape + {{ESCAPE}} clause |

**Vì sao không dùng regex kiểm tra "chuỗi này an toàn" rồi nối vào?** Vì {{[a-z_]+}} chấp nhận {{password_hash}}. bộ lọc hình thức không biết **ngữ nghĩa** cột nào được phép lộ; chỉ một bảng ánh xạ tường minh mới trả lời được. Chuẩn công nghiệp: **map từ điển** giữa tên API công khai và tên cột nội bộ.

~~~java
// whitelist cho phần ORDER BY: API không bao giờ được đưa thẳng tên cột
private static final Map<String, String> SORTABLE = Map.of(   // key là tên API, value là cột thật
    "time",   "created_at",
    "amount", "amount_minor",
    "id",     "id");
private static final Set<String> DIRS = Set.of("ASC", "DESC");

static String orderBy(String sortField, String dirRaw) {
    String column = SORTABLE.get(sortField == null ? "" : sortField.toLowerCase(Locale.ROOT));
    if (column == null) throw new IllegalArgumentException("sort field không được phép");  // 400, không suy đoán
    String dir = (dirRaw == null ? "ASC" : dirRaw).toUpperCase(Locale.ROOT);               // Locale.ROOT: đổi hoa thường không phụ thuộc locale máy chủ
    if (!DIRS.contains(dir)) dir = "ASC";
    return " ORDER BY " + column + " " + dir;        // chuỗi này không chứa input thô
}
~~~

### LIKE: ký tự người dùng gõ không phải ký tự đại diện

{{LIKE}} so mẫu, trong đó {{%}} nghĩa là "bất kỳ bao nhiêu ký tự" và {{_}} là "đúng một ký tự". Nếu bạn bind nguyên input của người dùng vào {{LIKE}} thì:

- input {{%}} khớp **mọi dòng** — một ô tìm kiếm trở thành công cụ xuất cả bảng, đồng thời buộc DB quét toàn bộ bảng (slow query, DoS mềm).
- input {{100%}} (tìm sản phẩm "100% cotton") bị hiểu là "bắt đầu bằng 100 rồi gì cũng được" — kết quả sai mà không báo lỗi.
- input {{ab_c}} bị hiểu là "ab" + một ký tự bất kỳ + "c".

Fix: **escape các ký tự đặc biệt trong giá trị**, rồi chính bạn thêm {{%}} hai đầu (vì bạn mới là bên quyết định semantics "tìm chứa substring"):

~~~java
static String escapeLike(String raw) {
    StringBuilder sb = new StringBuilder();
    for (int i = 0; i < raw.length(); i++) {
        char c = raw.charAt(i);
        if (c == '\\\\' || c == '%' || c == '_') sb.append('\\\\');   // đặt escape char trước ký tự đặc biệt
        sb.append(c);
    }
    return sb.toString();
}

// String SQL trong Java: "... AND name LIKE ? ESCAPE '\\\\'" — hai ký tự backslash trong source Java = một backslash trong SQL
ps.setString(1, "%" + escapeLike(userQuery) + "%");
~~~

{{ESCAPE}} khai báo với DB ký tự nào là escape; hãy ghi tường minh thay vì dựa vào mặc định, vì mặc định khác nhau giữa DB và giữa các cấu hình (MySQL có {{NO_BACKSLASH_ESCAPES}}, PostgreSQL hành vi backslash phụ thuộc {{standard_conforming_strings}}). Escape **backslash trước**, rồi mới {{%}}/{{_}}, nếu không bạn escape chính ký tự escape vừa chèn vào.

Nếu sản phẩm chủ đích cho người dùng viết ký tự đại diện (tìm nâng cao), hãy nói rõ trong UI và tài liệu, và vẫn escape backslash — hai semantics lẫn nhau là nguồn bug rất khó lần.

### Second-order injection: payload ngủ trong database

Input được bind an toàn khi **ghi**, nên payload được lưu nguyên vẹn vào DB: {{username}} của một người dùng là {{x' UNION SELECT ...}}. Ba tháng sau, module báo cáo viết:

~~~java
// ❌ vẫn sai, dù dữ liệu lấy từ DB chứ không phải từ request
String sql = "SELECT * FROM audit_log WHERE username = '" + row.getUsername() + "'";
~~~

DB không phân biệt được chuỗi đến từ request hay từ bảng khác. Bài học: **mối nguy nằm ở chỗ nối chuỗi, không ở chỗ dữ liệu đến từ đâu**. Vì vậy không có khái niệm "escape sẵn rồi, lưu vào DB là an toàn" — chỉ có quy tắc "không nối chuỗi ở bất kỳ tầng nào". Trường hợp tương tự: cấu hình động (tên cột, tên bảng người dùng chọn) lưu trong DB rồi được ghép vào câu truy vấn.

### Năm lớp phòng thủ (parameterize chỉ là lớp 2)

1. **Validate input**: kiểu, độ dài, format (email là email, số là số), chặn {{null byte}}. Đây là lớp **giảm diện tích tấn công**, không phải lớp chống injection.
2. **Tham số hoá mọi giá trị; whitelist mọi identifier.** Kể cả tên bảng/cột động, kể cả sinh SQL từ metadata.
3. **Least privilege cho account DB**: app user không cần {{DROP}}, {{GRANT}}, {{FILE}}, không phải owner. Báo cáo đọc bằng read-only user. Lớp này giới hạn **hậu quả** khi lớp 2 có lỗ hổng.
4. **Không lộ lỗi DB**: đưa {{SQLException.getMessage()}} vào response là tặng attacker bản đồ schema. Log ở server, trả về mã lỗi chung + request id.
5. **Test + audit**: một unit test asserts câu SQL sinh ra **không chứa** input thô và không chứa dấu nháy đơn; integration test chạy payload kinh điển; static analysis (SpotBugs {{SQL_INJECTION_JDBC}}, Semgrep) quét chuỗi ghép.

| Cách viết | An toàn injection? | Ghi chú |
|---|---|---|
| {{Statement}} + nối chuỗi | ❌ | Chỉ dùng cho câu lệnh tĩnh, không chứa input |
| {{PreparedStatement}} + {{?}} | ✅ với value | Vẫn phải tự lo identifier và LIKE |
| {{JdbcTemplate.query(sql, mapper, args)}} | ✅ | Bản parameterized, không phải overload nối chuỗi |
| JPQL named parameter, Criteria API, QueryDSL | ✅ | Không sinh chuỗi từ input |
| Native query nối chuỗi | ❌ | Hibernate parse chuỗi cuối cùng |
| {{Sort.by(request.sort)}} với JPQL | ⚠️ | Hibernate kiểm property theo entity metamodel; native query thì không |

> Senior tip: trong pentest, thứ tự kiểm tra SQL injection luôn là (1) tham số {{sort}}/{{order}}/{{column}} của endpoint list, (2) bộ lọc {{LIKE}}, (3) {{IN}} sinh từ danh sách id, (4) report/export nhận tên bảng-cột từ người dùng — vì đó là những nơi lập trình viên "phải ghép chuỗi" và quên whitelist. ORM không phải áo giáp; bốn điểm chết kinh điển là: {{@Query(nativeQuery = true)}} ghép chuỗi, {{Sort}} lấy thẳng từ request đẩy vào native query, tham số động được nhúng nguyên văn vào chuỗi JPQL, và dynamic {{ORDER BY}} trong file cấu hình MyBatis dùng dạng nội suy chuỗi thay vì dạng bind tham số.

### Liên hệ phỏng vấn
Câu mở: "Vì sao {{PreparedStatement}} an toàn?" — trả lời bằng **hai giai đoạn parse/execute và vị trí của giá trị**, không nói "vì nó escape". Câu đào sâu: "Tôi dùng {{ORDER BY}} theo cột người dùng chọn thì sao?" — trả lời bằng whitelist/map và lý do placeholder không thay được identifier. Câu tình huống: "Chỗ nào trong hệ thống của bạn còn ghép chuỗi SQL?" — nêu được LIKE, {{IN}}, báo cáo động và second-order injection là đủ để thể hiện kinh nghiệm thật. Làm bài tập dưới đây — tự viết {{QueryBuilder}} — là bạn có mã nguồn để dẫn chứng cho cả ba câu.`,
  exercises: [
    {
      title: 'Viết QueryBuilder: sinh SQL với placeholder, whitelist cột và escape LIKE',
      prompt: `Hoàn thiện {{QueryBuilder}} (chỉ dùng JDK 17). Mục tiêu: người gọi **không có cách nào** đưa input của mình vào văn bản câu SQL — giá trị đi vào {{params()}}, identifier phải có trong whitelist.

**Constructor {{QueryBuilder(String table, Set<String> allowedColumns)}}**
- {{table}} phải là identifier hợp lệ: ký tự đầu là chữ cái hoặc dấu gạch dưới, các ký tự sau là chữ số/chữ cái/gạch dưới, tối đa 30 ký tự. Không hợp lệ (kể cả null) → ném {{IllegalArgumentException}}.
- {{allowedColumns}} là whitelist tên cột, mỗi tên cũng phải là identifier hợp lệ; null hoặc rỗng → ném {{IllegalArgumentException}}. Lưu bản so sánh **không phân biệt hoa thường**, nhưng SQL luôn dùng đúng tên cột như đã khai báo trong whitelist (không dùng chuỗi người gọi đưa vào).

**{{eq(column, value)}}** — thêm {{column = ?}}; {{value}} null → ném {{IllegalArgumentException}} (điều kiện {{col = NULL}} trong SQL không bao giờ đúng; muốn lọc null phải có predicate riêng).
**{{in(column, values)}}** — thêm {{column IN (?, ?, ...)}} với số dấu {{?}} đúng bằng {{values.size()}}; {{values}} null hoặc rỗng → ném {{IllegalArgumentException}}. Mọi phần tử được thêm vào {{params()}} theo thứ tự.
**{{like(column, raw)}}** — thêm predicate {{column LIKE ? ESCAPE}} với escape char là **một** ký tự backslash (khi viết trong chuỗi Java thì nguồn là {{ESCAPE '\\\\'}}), và thêm vào {{params()}} giá trị {{"%" + escape(raw) + "%"}}; {{raw}} null → ném {{IllegalArgumentException}}. Hàm escape đặt một backslash trước mỗi ký tự {{\\}}, {{%}}, {{_}} — và phải xử lý backslash **trước** hai ký tự kia.
**{{orderBy(column, direction)}}** — {{column}} phải ở trong whitelist (không → ném {{IllegalArgumentException}}); {{direction}} null/rỗng → {{ASC}}, ngược lại đổi sang hoa thường với {{Locale.ROOT}} và phải là {{ASC}} hoặc {{DESC}}, không → ném {{IllegalArgumentException}}. Chỉ giữ một ORDER BY: gọi nhiều lần thì lần sau ghi đè lần trước.
**{{sql()}}** — {{SELECT * FROM <table>}}, nối các predicate bằng {{ AND }} sau {{ WHERE }} (không predicate nào thì bỏ hẳn {{ WHERE }}), rồi nối {{ ORDER BY <col> <DIR> }} nếu có. Không bao giờ chứa một ký tự nào của giá trị người dùng.
**{{params()}}** — danh sách giá trị theo đúng thứ tự xuất hiện {{?}} trong {{sql()}}.

Mọi method {{eq/in/like/orderBy}} trả về {{this}} để gọi nối nhau. Gợi ý cài đặt: giữ ba thứ — {{List<String> predicates}}, {{List<Object> params}}, {{String orderByClause}}.`,
      starter: `final class QueryBuilder {
    private String table;
    private java.util.Map<String, String> columnWhitelist;   // key viết thường -> tên cột đúng như khai báo
    private final java.util.List<String> predicates = new java.util.ArrayList<>();
    private final java.util.List<Object> params = new java.util.ArrayList<>();
    private String orderByClause;

    QueryBuilder(String table, java.util.Set<String> allowedColumns) {
        throw new UnsupportedOperationException("TODO");
    }

    QueryBuilder eq(String column, Object value) {
        throw new UnsupportedOperationException("TODO");
    }

    QueryBuilder in(String column, java.util.List<?> values) {
        throw new UnsupportedOperationException("TODO");
    }

    QueryBuilder like(String column, String raw) {
        throw new UnsupportedOperationException("TODO");
    }

    QueryBuilder orderBy(String column, String direction) {
        throw new UnsupportedOperationException("TODO");
    }

    String sql() {
        throw new UnsupportedOperationException("TODO");
    }

    java.util.List<Object> params() {
        throw new UnsupportedOperationException("TODO");
    }
}`,
      tests: `public class Main {
    // B là MỘT ký tự backslash; dùng nó để ghép chữ ký dội chương mà không phải viết nhiều lớp escape
    static final String B = "\\\\";
    static int passed = 0, total = 0;
    static final Set<String> COLS = Set.of("id", "email", "status", "role", "name", "created_at", "amount_minor");

    static void check(String name, Runnable r) {
        total++;
        try { r.run(); passed++; System.out.println("PASS " + name); }
        catch (Throwable t) { System.out.println("FAIL " + name + ": " + t); }
    }
    static void eq(Object expected, Object actual, String msg) {
        if (!Objects.equals(expected, actual)) throw new AssertionError(msg + " | expected <" + expected + "> got <" + actual + ">");
    }
    static void mustReject(String what, Runnable r) {
        try { r.run(); }
        catch (IllegalArgumentException ok) { return; }
        catch (Throwable t) { throw new AssertionError(what + ": can IllegalArgumentException, got " + t); }
        throw new AssertionError(what + ": khong ném IllegalArgumentException");
    }
    static QueryBuilder qb(String table) { return new QueryBuilder(table, COLS); }

    public static void main(String[] args) {
        check("eq: value di vao params, khong len text cau lenh", () -> {
            QueryBuilder q = qb("app_user").eq("email", "a@b.com' OR '1'='1");
            eq("SELECT * FROM app_user WHERE email = ?", q.sql(), "sql");
            eq(1, q.params().size(), "so params");
            eq("a@b.com' OR '1'='1", q.params().get(0), "gia tri bind");
            if (q.sql().contains("'")) throw new AssertionError("sql chua dau nhay don: " + q.sql());
            if (q.sql().contains("OR")) throw new AssertionError("sql chua noi dung input: " + q.sql());
        });
        check("thu tu placeholder va params khop nhau khi dung 3 kieu predicate", () -> {
            QueryBuilder q = qb("orders")
                .eq("status", "PAID")
                .in("role", List.of("ADMIN", "MANAGER"))
                .like("name", "shoes")
                .orderBy("created_at", "desc");
            eq("SELECT * FROM orders WHERE status = ? AND role IN (?, ?) AND name LIKE ? ESCAPE '" + B + "' ORDER BY created_at DESC",
               q.sql(), "sql");
            eq(List.of("PAID", "ADMIN", "MANAGER", "%shoes%"), q.params(), "params");
        });
        check("LIKE: escape phan tram, gach duoi va backslash roi moi boc phan tram hai dau", () -> {
            eq("%100" + B + "%%", qb("products").like("name", "100%").params().get(0), "input 100 percent");
            eq("%a" + B + "_b%", qb("products").like("name", "a_b").params().get(0), "input a_b");
            eq("%" + B + B + "%", qb("products").like("name", B).params().get(0), "input one backslash");
            eq("%C:" + B + B + "x%", qb("products").like("name", "C:" + B + "x").params().get(0), "input C colon backslash x");
            if (qb("products").like("name", "shoes").sql().contains("shoes")) throw new AssertionError("sql chua gia tri: " + qb("products").sql());
            mustReject("like(null)", () -> qb("products").like("name", null));
        });
        check("ORDER BY: cot hop le trong whitelist duoc chap nhan, khong co WHERE khi khong co predicate", () -> {
            QueryBuilder q = qb("orders").orderBy("amount_minor", "DESC");
            eq("SELECT * FROM orders ORDER BY amount_minor DESC", q.sql(), "sql");
            eq(0, q.params().size(), "ORDER BY khong tao params");
        });
        check("ORDER BY: cot la / input doc hai / chieu la bi tu choi", () -> {
            mustReject("orderBy(password)", () -> qb("app_user").orderBy("password", "ASC"));
            mustReject("orderBy injection", () -> qb("app_user").orderBy("id) DESC, (SELECT password FROM app_user", "ASC"));
            mustReject("orderBy multi", () -> qb("app_user").orderBy("id, (SELECT 1)", "ASC"));
            mustReject("orderBy bad dir", () -> qb("app_user").orderBy("created_at", "DROP"));
            mustReject("orderBy null col", () -> qb("app_user").orderBy(null, "ASC"));
        });
        check("ORDER BY: chuan hoa hoa thuong va ghi de lan goi sau", () -> {
            QueryBuilder q = qb("orders").orderBy("id", "asc");
            eq("SELECT * FROM orders ORDER BY id ASC", q.sql(), "asc -> ASC");
            q.orderBy("AMOUNT_MINOR", null);
            eq("SELECT * FROM orders ORDER BY amount_minor ASC", q.sql(), "null dir -> ASC, hoa thuong khong phan biet");
            if (q.sql().contains("AMOUNT_MINOR")) throw new AssertionError("sql phai dung ten cot tu whitelist: " + q.sql());
        });
        check("identifier khong hop le bi tu choi o constructor va o predicate", () -> {
            mustReject("table injection", () -> qb("app_user; DROP TABLE x").eq("id", 1));
            mustReject("table empty", () -> qb(""));
            mustReject("table digit first", () -> qb("1user"));
            mustReject("eq column injection", () -> qb("app_user").eq("email = 1 OR 1", 1));
            mustReject("in column not whitelisted", () -> qb("app_user").in("password", List.of("x")));
            mustReject("like column not whitelisted", () -> qb("app_user").like("password", "x"));
            mustReject("empty allowedColumns", () -> new QueryBuilder("app_user", Set.of()));
        });
        check("IN: dung n placeholder, giu thu tu, tu choi danh sach rong", () -> {
            QueryBuilder q = qb("orders").in("id", List.of(7, 3, 5));
            eq("SELECT * FROM orders WHERE id IN (?, ?, ?)", q.sql(), "sql");
            eq(List.of(7, 3, 5), q.params(), "params");
            mustReject("in empty", () -> qb("orders").in("id", List.of()));
            mustReject("in null", () -> qb("orders").in("id", null));
        });
        check("eq value null bi tu choi; khong co WHERE khi khong co predicate", () -> {
            mustReject("eq null value", () -> qb("app_user").eq("email", null));
            eq("SELECT * FROM app_user", qb("app_user").sql(), "sql khong co WHERE");
            eq(0, qb("app_user").params().size(), "params rong");
        });
        check("payload trong IN cung chi nam trong params", () -> {
            QueryBuilder q = qb("orders").in("status", List.of("PAID') OR ('1'='1"));
            eq("SELECT * FROM orders WHERE status IN (?)", q.sql(), "sql");
            eq(1, q.params().size(), "params");
            if (q.sql().contains("PAID")) throw new AssertionError("sql chua gia tri: " + q.sql());
        });
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
      reference: `final class QueryBuilder {
    // identifier hop le: chu hoac _ dau, toi da 30 ky tu
    private static final java.util.regex.Pattern IDENT =
        java.util.regex.Pattern.compile("[A-Za-z_][A-Za-z0-9_]{0,29}");
    private static final Set<String> DIRS = Set.of("ASC", "DESC");

    private String table;
    private java.util.Map<String, String> columnWhitelist;
    private final java.util.List<String> predicates = new java.util.ArrayList<>();
    private final java.util.List<Object> params = new java.util.ArrayList<>();
    private String orderByClause;

    QueryBuilder(String table, Set<String> allowedColumns) {
        if (table == null || !IDENT.matcher(table).matches()) throw new IllegalArgumentException("bad table: " + table);
        if (allowedColumns == null || allowedColumns.isEmpty()) throw new IllegalArgumentException("empty whitelist");
        this.table = table;
        this.columnWhitelist = new java.util.TreeMap<>();          // so sánh theo key viết thường
        for (String c : allowedColumns) {
            if (c == null || !IDENT.matcher(c).matches()) throw new IllegalArgumentException("bad column: " + c);
            columnWhitelist.put(c.toLowerCase(Locale.ROOT), c);    // gia tri la dung ten cot da khai bao
        }
    }

    private String resolve(String column) {                       // trả về tên cột chuẩn hóa, không phải input
        if (column == null) throw new IllegalArgumentException("column null");
        String real = columnWhitelist.get(column.toLowerCase(Locale.ROOT));
        if (real == null) throw new IllegalArgumentException("column khong nam trong whitelist: " + column);
        return real;
    }

    QueryBuilder eq(String column, Object value) {
        if (value == null) throw new IllegalArgumentException("eq: value null, dung predicate IS NULL rieng");
        predicates.add(resolve(column) + " = ?");
        params.add(value);
        return this;
    }

    QueryBuilder in(String column, List<?> values) {
        if (values == null || values.isEmpty()) throw new IllegalArgumentException("in: danh sách rỗng");
        StringBuilder sb = new StringBuilder(resolve(column)).append(" IN (");
        for (int i = 0; i < values.size(); i++) sb.append(i == 0 ? "?" : ", ?");
        predicates.add(sb.append(")").toString());
        params.addAll(values);
        return this;
    }

    QueryBuilder like(String column, String raw) {
        if (raw == null) throw new IllegalArgumentException("like: raw null");
        predicates.add(resolve(column) + " LIKE ? ESCAPE '\\\\'");
        params.add("%" + escapeLike(raw) + "%");
        return this;
    }

    QueryBuilder orderBy(String column, String direction) {
        String real = resolve(column);
        String dir = (direction == null || direction.isEmpty()) ? "ASC" : direction.toUpperCase(Locale.ROOT);
        if (!DIRS.contains(dir)) throw new IllegalArgumentException("direction phai la ASC hoac DESC: " + direction);
        orderByClause = " ORDER BY " + real + " " + dir;           // goi nhieu lan: lan sau ghi de
        return this;
    }

    static String escapeLike(String raw) {
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < raw.length(); i++) {
            char c = raw.charAt(i);
            if (c == '\\\\' || c == '%' || c == '_') sb.append('\\\\');
            sb.append(c);
        }
        return sb.toString();
    }

    String sql() {
        StringBuilder sb = new StringBuilder("SELECT * FROM ").append(table);
        sb.append(predicates.isEmpty() ? "" : " WHERE " + String.join(" AND ", predicates));
        return sb.append(orderByClause == null ? "" : orderByClause).toString();
    }

    List<Object> params() { return new java.util.ArrayList<>(params); }
}`,
      hints: [
        'Validator identifier bằng {{java.util.regex.Pattern}}: chữ cái hoặc gạch dưới ở đầu, sau đó chữ số/chữ cái/gạch dưới, tối đa 30 ký tự; gọi {{matcher.matches()}}. Giữ **tên cột đã khai báo** trong whitelist, đừng trả về đúng chuỗi người gọi đưa vào.',
        'Với IN, đếm placeholder bằng vòng for chạy {{values.size()}} lần — không bao giờ {{String.join}} các giá trị vào câu lệnh.',
        'LIKE: với mỗi ký tự trong input, nếu nó là backslash, dấu phần trăm hoặc gạch dưới thì ghi thêm một backslash trước nó (xử lý backslash trước nhất), rồi mới bọc giá trị bằng hai dấu phần trăm. Mệnh đề SQL sinh ra là LIKE ? ESCAPE theo sau một dấu nháy đơn chứa đúng MỘT ký tự backslash — khi viết trong source Java thì cần hai ký tự backslash bên trong nháy kép.',
        '{{sql()}}: nếu {{predicates}} rỗng thì bỏ hẳn cụm WHERE; nối các predicate bằng {{ AND }} và đặt một khoảng trắng trước {{WHERE}}.',
      ],
      explain: `Ba quyết định thiết kế đáng nói trong phỏng vấn:

- **Giá trị và identifier đi hai đường khác nhau.** {{eq/in/like}} chỉ thêm dấu {{?}} rồi đẩy giá trị vào {{params}}; chuỗi SQL vì vậy không thể chứa {{'}} hay nội dung input. Test đầu tiên assert đúng điều đó bằng cách kiểm {{sql()}} không chứa "OR" và không chứa dấu nháy đơn — kiểu assert này mạnh hơn nhiều so với "chạy thử xem có bug không".
- **{{resolve(column)}} trả về tên cột từ whitelist, không phải từ input.** Nếu trả về đúng chuỗi người gọi đưa vào (chỉ khác hoa thường) thì {{orderBy("created_at; DROP TABLE x", ...)}} đã bị từ chối vì không có trong whitelist, nhưng kiểu viết "validate rồi dùng lại input" là chỗ hở kinh điển. Cùng logic với phần {{ORDER BY}}: tên cột được **chọn** từ bảng ánh xạ, không được **kiểm tra** rồi nối vào.
- **{{ORDER BY}} ghi đè chứ không nối thêm**, vì SQL chỉ có một {{ORDER BY}}; nếu bạn {{+=}} hai lần thì câu lệnh sai cú pháp và kẻ gọi API chỉ cần gọi hai lần là làm app 500.

Lỗi thường gặp: dùng {{String.format}} để "ghép cho sạch" rồi tự escape dấu nháy đơn thay vì placeholder (escape tay dễ sai ở charset và ở chính ký tự backslash), quên trường hợp danh sách rỗng, và để {{value}} null lọt vào {{eq}} tạo ra điều kiện {{col = NULL}} luôn cho kết quả rỗng. Trong Spring, bản thật của bài này chính là {{NamedParameterJdbcTemplate}} cộng một bảng whitelist cho phần sort, hoặc QueryDSL/jOOQ khi cần dựng câu truy vấn động.`,
    },
  ],
  check: [
    {
      q: 'Vì sao {{PreparedStatement}} chặn được SQL injection còn {{Statement}} + nối chuỗi thì không?',
      options: [
        'Vì PreparedStatement escape dấu nháy đơn hộ mình, còn Statement thì không',
        'Vì DB parse và lập kế hoạch câu SQL có {{?}} **trước** khi nhận giá trị, nên giá trị chỉ được đặt vào ô dữ liệu và không bao giờ được đọc như cú pháp',
        'Vì PreparedStatement chạy nhanh hơn nên attacker không kịp chèn lệnh',
        'Vì Statement chỉ dùng được cho INSERT/UPDATE',
      ],
      answer: 1,
      explain: 'Bản chất là **tách hai giai đoạn parse và bind**. Cách nói "nó escape hộ" là cách giải thích hay gặp nhưng sai trọng tâm: với một số driver thì giá trị được quote trên client, nhưng lý do an toàn là DB không bao giờ parse giá trị thành cú pháp. Tốc độ liên quan tới cache execution plan, không liên quan tới an toàn; Statement dùng được cho mọi câu lệnh.',
    },
    {
      q: 'Endpoint danh sách nhận {{?sort=}} là tên cột người dùng chọn. Cách xử lý đúng là gì?',
      options: [
        'Bind tên cột vào placeholder: {{ORDER BY ?}} với giá trị là sort',
        'Kiểm tra sort bằng regex {{[a-z_]+}} rồi nối vào câu SQL',
        'Map sort qua whitelist tên cột (và validate ASC/DESC), từ chối mọi giá trị khác bằng 400',
        'Đổi id tự tăng sang UUID thì hết lo',
      ],
      answer: 2,
      explain: 'Placeholder chỉ thay được **giá trị**, không thay được identifier — {{ORDER BY ?}} sẽ sort theo chính chuỗi đó cho mọi dòng. Regex {{[a-z_]+}} vẫn cho qua mọi cột thật, kể cả {{password_hash}}: kiểm tra hình thức không trả lời được câu hỏi "cột nào được phép lộ". Chỉ bảng ánh xạ tường minh (kết hợp chặn chiều sort ngoài {{ASC}}/{{DESC}}) là đủ; đổi kiểu id không liên quan gì tới {{ORDER BY}}.',
    },
    {
      q: 'Ô tìm kiếm chạy {{WHERE description LIKE ?}} và bind nguyên input người dùng. Rủi ro nào có thật?',
      options: [
        'Chỉ là lỗi giao diện, không có rủi ro gì',
        'Input {{%}} khớp mọi dòng và buộc quét toàn bảng: lộ dữ liệu ngoài phạm vi được tìm, cộng slow query/DoS mềm; phải escape {{%}}, {{_}} và {{\\}} rồi tự thêm {{%}} hai đầu',
        'Gây ra SQL injection, phải đổi sang {{Statement}}',
        'Làm hỏng index duy nhất của bảng',
      ],
      answer: 1,
      explain: '{{%}} và {{_}} là ký tự đại diện **của LIKE**, không phải của cú pháp SQL, nên bind tham số vẫn không vô hiệu hoá chúng — đây là chỗ PreparedStatement không tự lo. Input {{%}} biến một query có giới hạn thành toàn bảng (vừa rò rỉ thông tin vừa tốn tài nguyên). Vì vậy mới cần {{ESCAPE}} và quy tắc escape backslash trước. Câu này không phải injection nên đổi sang {{Statement}} là đi ngược hướng; index bị dùng kém đi chứ không bị hỏng.',
    },
  ],
  related: ['security-002', 'security-001'],
  tags: ['SQL injection', 'PreparedStatement', 'JdbcTemplate', 'ORDER BY', 'LIKE escape', 'second-order injection'],
},
{
  id: 'lesson-security-009',
  track: 'security',
  order: 9,
  title: 'SSRF: vì sao để server tự đi gọi một URL theo yêu cầu là nguy hiểm, và kiểm tra URL đúng cách ở tầng ứng dụng',
  level: 'senior',
  minutes: 45,
  goals: [
    'Giải thích SSRF bằng một feature rất đời thường (tải avatar theo URL) và liệt kê được attacker chạm vào những gì khi server gửi request thay họ',
    'Đọc hiểu CIDR và biết vì sao phải chặn 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16, 127.0.0.0/8, 169.254.169.254',
    'Liệt kê được các kiểu qua mặt: IP literal và dạng số thập phân/thập lục phân, DNS rebinding (TOCTOU), redirect, tên miền mã hoá IP',
    'Viết được routine kiểm tra URL theo thứ tự: parse, scheme allowlist, định dạng hostname, domain allowlist, resolve rồi kiểm tra từng IP',
  ],
  body: `**Tóm tắt:** **SSRF** (Server-Side Request Forgery) là lỗi để người dùng đưa vào **một URL mà chính server sẽ đi gọi**. Server đứng ở vị trí đặc quyền: nằm trong VPC, gần Redis/Adminer/Elasticsearch nội bộ, và thường có **IAM role gắn trên instance** để gọi AWS mà không cần mang key. Nên thứ tưởng như vô hại — "dán link ảnh avatar vào" — biến thành: quét cổng nội bộ, đọc {{http://169.254.169.254/...}} để lấy credential, đánh sập service nội bộ. Cách chặn: **allowlist scheme**, **từ chối IP literal và mọi dạng số**, **allowlist tên miền**, **resolve rồi kiểm tra từng IP** xem có thuộc dải nội bộ/link-local không, và **không để HTTP client tự follow redirect**.

### Feature nào mở cửa cho SSRF

Những chỗ này gần như luôn tồn tại trong app và đều nguy hiểm như nhau:

- "Tải ảnh đại diện từ URL" / image proxy / thumbnailer: app {{GET}} URL người dùng đưa, đọc response rồi trả về.
- Webhook và "test connection" cho integration (Stripe-like, Zapier-like): người dùng nhập URL đích, server bấm nút **Test** gọi thử.
- Nhập dữ liệu từ URL: import CSV/XML từ link, {{@Import(url)}}.
- Trình render PDF/HTML từ template có {{<img src="http://169.254.169.254/..."}}> — headless Chrome đi theo link và gửi kết quả về cho attacker qua lỗi hiển thị.
- Health check / crawler / preview link (hiện title và ảnh khi chia sẻ URL).

Điểm chung: **server là bên kết nối**, nên mục tiêu mà nó chạm tới không phải internet mà là mạng nội bộ của bạn.

### Vì sao nguy hiểm hơn một lỗi đọc dữ liệu thông thường

Ở cloud, mỗi EC2/GCE instance có một **metadata service** — một web server chỉ nghe trên địa chỉ link-local {{169.254.169.254}}, dùng để kể cho chính instance đó biết nó là ai, và cấp **credential tạm**. Trên AWS:

~~~text
GET http://169.254.169.254/latest/meta-data/iam/security-credentials/<role-name>
->  { "AccessKeyId": "ASIA...", "SecretAccessKey": "...", "Token": "...", "Expiration": "..." }
~~~

Nhiều application gán role rộng (S3 full, DynamoDB full) cho instance. SSRF đọc được JSON đó là attacker có **khoá hợp lệ**, thường còn hiệu lực vài giờ, và dùng được từ máy của họ. Đây là lý do một endpoint "tải ảnh" bị xếp vào nhóm nghiêm trọng nhất chứ không phải lỗi vặt.

Kẻ tấn công cũng dùng SSRF như một **máy quét cổng nội bộ**: gọi {{http://127.0.0.1:6379/}} (Redis), {{:9200}} (Elasticsearch), {{:8500}} (Consul), {{:2375}} (Docker daemon), và phân biệt "cổng mở/cổng đóng" qua độ trễ hoặc qua thông báo lỗi {{Connection refused}} mà app trả về. Với Redis, một request dạng text đơn giản đủ để ghi file và leo thang — đó là lý do các protocol text-based nội bộ không bao giờ được expose cho URL do người dùng chọn.

### CIDR trong 60 giây, và dải nào phải chặn

{{10.0.0.0/8}} đọc là "mọi địa chỉ có 8 bit đầu cố định", tức mọi IP bắt đầu bằng {{10.}} — dải private lớn nhất của mạng nội bộ. Số sau dấu {{/}} là số bit cố định. Bảng các dải **không phải internet**, cần chặn khi validate IP ({{a.b.c.d}} là bốn số 0–255):

| Dải | Ý nghĩa | Vì sao phải chặn |
|---|---|---|
| {{0.0.0.0/8}} | "địa chỉ này trên mạng này", {{0.0.0.0}} tự nó | Một số stack định tuyến về localhost; không phải địa chỉ công khai |
| {{10.0.0.0/8}} | private | Mạng nội bộ, DB, service |
| {{100.64.0.0/10}} | CGNAT (carrier-grade NAT) | dải hay bị quên nhất; overlay network và ISP đều dùng |
| {{127.0.0.0/8}} | loopback | chính máy đang chạy app — admin ports |
| {{169.254.0.0/16}} | link-local | **metadata cloud** ({{169.254.169.254}}) |
| {{172.16.0.0/12}} | private | DB subnets |
| {{192.0.0.0/24}}, {{192.0.2.0/24}} | IETF reserved / TEST-NET | không route được, chắc chắn không phải đích thật |
| {{192.168.0.0/16}} | private | mạng nội bộ phổ biến |
| {{198.18.0.0/15}} | benchmarking | không phải đích thật |
| {{224.0.0.0/4}} trở lên | multicast + reserved | không phải unicast |

> Lưu ý: **không có** dải {{192.168.0.0/16}} nào "an toàn để gọi" và cũng không có dải nào "chỉ để tham khảo". Chặn là chặn cả dải, không chặn từng địa chỉ hay gặp.

### Những kiểu qua mặt mà bộ lọc naive bỏ sót

Đây là phần interviewer thích đào sâu nhất. Giả sử code chỉ kiểm tra chuỗi URL có "{{localhost}}" hoặc "{{127.0.0.1}}" trong đó:

~~~text
http://127.1/                     rút gọn, vẫn là loopback
http://2130706433/                cùng 127.0.0.1 nhưng viết ở dạng số thập phân
http://0x7f000001/                dạng thập lục phân
http://017700000001/              dạng bát phân
http://0000:0000:0000:0000:0000:ffff:127.0.0.1/  IPv6 mapped IPv4
http://[::1]/                     IPv6 loopback literal
http://169.254.169.254.nip.io/    dịch vụ DNS công khai: tên miền chứa IP, trỏ về đúng IP đó
http://sub.example.com/           tên miền bình thường, nhưng zone trỏ về 10.0.0.5
~~~

Bài học: **đừng cố parse mọi biến thể của địa chỉ**, dễ sai hơn là chặn. Hai quy tắc làm gọn hết danh sách trên:

1. **Không chấp nhận IP literal và host dạng số.** Một hostname phải gồm các label chữ thường {{a-z0-9-}}, phân cách bằng dấu chấm, và **không được có mọi label toàn chữ số**. Mọi thứ như {{10.0.5.9}}, {{2130706433}}, {{017700000001}}, {{[::1]}} đều bị từ chối ngay — kể cả khi nó là IP công khai hợp lệ. Đây là lý do bài tập dưới đây trả về {{BAD_URL}} cho {{http://10.0.5.9/}} chứ không phải {{PRIVATE_IP}}. Tên một nhãn như {{localhost}} vẫn được đi tiếp, vì nó chỉ có nghĩa sau khi resolve — và chính bước resolve sẽ trả {{127.0.0.1}}.
2. **Với tên miền, phải resolve rồi kiểm tra địa chỉ nhận được**, vì tên miền là thứ người dùng (hoặc DNS của họ) kiểm soát.

{{0x7f000001}} là ví dụ hay: vì có chữ cái nên nó đi qua bước định dạng, nhưng resolver sẽ cho ra {{127.0.0.1}} và bị chặn ở bước kiểm IP — phòng thủ theo lớp, mỗi lớp bắt một phần.

### Redirect và DNS rebinding: hai lần kiểm tra có thể cho hai kết quả khác nhau

**Redirect**: bạn kiểm tra URL của người dùng là public, gửi request, server đích trả {{302}} với {{Location: http://169.254.169.254/...}}, và HTTP client **tự đi theo** — lần này không ai kiểm tra. {{java.net.http.HttpClient}} mặc định {{Redirect.NEVER}}, còn {{HttpURLConnection}} ({{URL.openConnection}}) tự follow trong cùng protocol theo mặc định. Cách xử lý: đặt {{followRedirects(NEVER)}}, tự đọc {{Location}}, và chạy **toàn bộ** routine kiểm tra cho mỗi bước nhảy, với số lần nhảy tối đa.

**DNS rebinding** nguy hiểm hơn vì nó phá đúng giả định "đã kiểm tra xong là xong":

~~~seq
title: DNS rebinding - hai lần resolve cho hai kết quả
actors: Attacker | App | DNS | Metadata
Attacker -> App: tải ảnh tại http://evil.com/a.png
App -> DNS: resolve evil.com
DNS --> App: 1.2.3.4 (public, hợp lệ)
note App..DNS: TOCTOU: kiểm tra xong, chưa kết nối
App -> DNS: resolve evil.com lần hai, lúc connect
DNS --> App: 169.254.169.254 (TTL = 0)
App -> Metadata: GET /latest/meta-data/iam/security-credentials
Metadata --> App: AccessKeyId, SecretAccessKey, Token
App --> Attacker: 200 OK (và ảnh đã nằm trong log/response)
~~~

Zone {{evil.com}} có TTL 0 nên lần resolve thứ hai trả địa chỉ khác: bạn kiểm tra một IP công khai, rồi kết nối tới IP nội bộ. Đây là lỗi **TOCTOU** (time-of-check to time-of-use). Không đóng được bằng cách "chỉ resolve một lần" nếu client tự resolve lại khi connect. Ba cách đóng, xếp theo độ tin cậy:

1. **Không cho app đi ra internet trực tiếp.** Routing/NetworkPolicy/egress proxy ở DMZ chỉ cho phép đúng một số đích. Đây là lớp duy nhất không phụ thuộc code.
2. **Pin IP**: resolve lấy địa chỉ, kiểm tra, rồi bảo client kết nối **đúng địa chỉ đã kiểm** và tự gửi header {{Host}}. Làm được với Apache HttpClient ({{HttpClientBuilder.setDnsResolver}}) hoặc OkHttp ({{Dns}}); {{java.net.http.HttpClient}} thì không có chỗ cắm, nên hoặc đổi client hoặc chấp nhận lớp 1.
3. **Allowlist tên miền chặt** ({{*.example.com}} do bạn quản lý zone) — khi đó attacker không có DNS của riêng họ để lật.

> Senior tip: trên AWS, bật **IMDSv2** ({{MetadataOptions.HttpTokens = required}}) để token phải xin bằng {{PUT}} có phiên và bị chặn bởi **hop limit** — request đi từ một proxy/ container thường không còn tới được metadata, kể cả khi có SSRF. Đồng thời đặt {{MetadataOptions.HttpPutResponseHopLimit = 1}} và hop limit thấp ở level instance. Đây là "giảm hậu quả", không phải "vá lỗi SSRF": vẫn còn {{user-data}} để đọc và vẫn còn cả mạng nội bộ để quét.

### Quy trình kiểm tra một URL, theo thứ tự

Viết theo đúng thứ tự và trả về **mã lỗi riêng cho từng bước**, vì nó cũng là thứ tự bạn giải thích trong phỏng vấn:

1. Parse bằng {{java.net.URI}}, bắt exception. Từ chối nếu không absolute, thiếu host, có {{userinfo}} ({{http://safe.com@evil.com/}} — phần trước {{@}} là userinfo, host thật là {{evil.com}}).
2. **Scheme allowlist**: thường chỉ {{http}}, {{https}}. {{file}} đọc filesystem, {{gopher}}/{{dict}} nói chuyện với Redis/memcached, {{jar}}/{{netdoc}} là các handler xưa của Java.
3. **Định dạng hostname**: chữ thường, label hợp lệ, không có label toàn chữ số, không IPv6 literal, không dấu cách/underscore/ký tự lạ.
4. **Domain allowlist** (nếu có): so trên host đã chuẩn hoá; chỉ cho {{host == d}} hoặc {{host.endsWith("." + d)}}. Kiểm ở đây **trước** khi resolve, vì đây là filter rẻ nhất.
5. **Resolve và kiểm tra từng địa chỉ**: không có bản ghi → fail; có bất kỳ địa chỉ nào rơi vào bảng dải ở trên → fail. Không chỉ kiểm IP đầu tiên.
6. Khi gọi: timeout kết nối và timeout đọc, số redirect tối đa và kiểm lại mỗi redirect, giới hạn kích thước response, và **thông báo lỗi chung** cho người dùng ({{Connection refused to 10.0.0.5:5432}} trong response là một máy quét cổng miễn phí).

| Cách kiểm tra | Chặn được gì | Lọt qua bởi |
|---|---|---|
| {{contains("localhost")}}, blacklist chuỗi | ít | mọi dạng IP, {{127.1}}, {{nip.io}}, {{.local}} |
| Regex "trông có vẻ là URL" | vài | IP literal, redirect, rebinding |
| Parse + scheme + hostname + resolve + kiểm IP | phần lớn | DNS rebinding (TOCTOU), redirect nếu client tự follow |
| Ở trên + allowlist domain do bạn quản lý zone | nhiều hơn | domain nội bộ bị DNS trỏ sai, redirect ra ngoài allowlist |
| Ở trên + egress kiểm soát ở network/proxy | **thật sự chặn** | không gì (đó là điểm mạnh) |

> Senior tip: trong hệ thống nhiều tenant, cho mỗi tenant dùng URL riêng phải đi qua một **egress proxy tập trung** (hoặc một service nhỏ chỉ có trách nhiệm fetch): họ khai {{webhook_url}}, bạn chỉ ghi log "{{host}} duoc goi", không cho app khác ra ngoài. Vừa sửa SSRF một lần cho mọi feature, vừa có dữ liệu để audit ai gọi cái gì, và chặn được cả feature "test connection" bị dùng làm máy quét.

### Liên hệ phỏng vấn
Câu mở: "App của bạn có chỗ nào để người dùng nhập URL không? Vì sao nguy hiểm?" — trả lời bằng chính danh sách feature ở trên, không nói chung chung. Câu đào sâu: "Tôi chặn {{localhost}} và {{127.0.0.1}} rồi, còn thiếu gì?" — kể được IP dạng số, {{nip.io}}, redirect, rebinding, metadata. Câu thiết kế: "Làm sao cho phép webhook của khách mà vẫn an toàn?" — trả lời theo lớp: allowlist + resolve-and-check + không tự follow redirect + egress control + IMDSv2, và nói thẳng phần nào code không tự đóng được. Làm xong bài tập {{UrlGuard}} dưới đây là bạn có mã nguồn để chứng minh cho cả ba câu.`,
  exercises: [
    {
      title: 'Viết UrlGuard: scheme allowlist, từ chối IP literal, domain allowlist và kiểm tra IP sau khi resolve',
      prompt: `Hoàn thiện {{UrlGuard}} (chỉ dùng JDK 17, **không gọi mạng** — DNS được truyền vào qua {{Resolver}} để test xác định). Hai kiểu sau đã có sẵn trong file và bạn không cần sửa:

~~~java
enum Verdict { OK, BAD_URL, BAD_SCHEME, DOMAIN_NOT_ALLOWED, PRIVATE_IP, DNS_FAIL }
interface Resolver { List<String> lookup(String host); }   // rỗng/null = không resolve được
~~~

**{{UrlGuard(Resolver resolver, Set<String> allowedSchemes, Set<String> allowedDomains)}}** lưu {{allowedSchemes}} và {{allowedDomains}} ở dạng chữ thường (so sánh không phân biệt hoa thường); {{allowedDomains}} null hoặc rỗng nghĩa là **không giới hạn tên miền**.

**{{Verdict check(String url)}}** áp theo **đúng thứ tự** này:

1. {{url}} null, chỉ có khoảng trắng, hoặc {{trim()}} của nó không parse được bằng {{new URI(...)}} → {{BAD_URL}}.
2. URL không absolute (thiếu scheme), hoặc {{getHost()}} null/rỗng → {{BAD_URL}}.
3. scheme (chữ thường) không có trong {{allowedSchemes}} → {{BAD_SCHEME}}.
4. {{getUserInfo()}} khác null → {{BAD_URL}} (chặn {{http://safe.com@evil.com/}}).
5. Kiểm **định dạng hostname**: đổi sang chữ thường với {{Locale.ROOT}}, bỏ **một** dấu chấm cuối nếu có. Sau đó:
   - rỗng, hoặc bắt đầu bằng {{[}} (IPv6 literal) → {{BAD_URL}};
   - tách theo dấu chấm, mỗi label phải dài 1–63 ký tự, chỉ gồm {{a-z}}, {{0-9}}, {{-}}, không bắt đầu và không kết thúc bằng {{-}}; có label rỗng → {{BAD_URL}};
   - nếu **mọi** label chỉ gồm chữ số ({{10.0.5.9}}, {{2130706433}}, {{017700000001}}) → {{BAD_URL}}. Đây là quy tắc "không chấp nhận IP literal và host dạng số".
6. Nếu {{allowedDomains}} không rỗng: host phải **bằng đúng** một domain trong danh sách hoặc **kết thúc** bằng dấu chấm cộng domain đó ({{cdn.example.com}} với {{example.com}} thì đạt; {{example.com.evil.net}} thì không). Không đạt → {{DOMAIN_NOT_ALLOWED}}.
7. Gọi {{resolver.lookup(host)}} với host đã chuẩn hoá. Null hoặc rỗng → {{DNS_FAIL}}. Với **mỗi** địa chỉ trả về: phải là bốn label số, mỗi label 1–3 chữ số và giá trị 0–255; không đúng dạng → {{BAD_URL}}. Nếu địa chỉ **không phải** unicast công khai → {{PRIVATE_IP}}.
8. Tất cả địa chỉ đều public → {{OK}}.

**{{PRIVATE_IP}}** được hiểu là một trong các dải: {{0.0.0.0/8}}, {{10.0.0.0/8}}, {{100.64.0.0/10}}, {{127.0.0.0/8}}, {{169.254.0.0/16}}, {{172.16.0.0/12}}, {{192.0.0.0/24}}, {{192.0.2.0/24}}, {{192.168.0.0/16}}, {{198.18.0.0/15}}, và mọi địa chỉ có octet đầu {{>= 224}}. Chỉ cần **một** địa chỉ vi phạm là {{PRIVATE_IP}}.

Gợi ý: tách thành ba hàm nhỏ — chuẩn hoá và kiểm hostname, kiểm {{allowedDomains}}, kiểm một địa chỉ IPv4 — để mỗi bước test được riêng.`,
      starter: `final class UrlGuard {
    enum Verdict { OK, BAD_URL, BAD_SCHEME, DOMAIN_NOT_ALLOWED, PRIVATE_IP, DNS_FAIL }

    interface Resolver {
        List<String> lookup(String host);
    }

    private UrlGuard.Resolver resolver;
    private java.util.Set<String> schemes;
    private java.util.Set<String> domains;

    UrlGuard(Resolver resolver, java.util.Set<String> allowedSchemes, java.util.Set<String> allowedDomains) {
        throw new UnsupportedOperationException("TODO");
    }

    Verdict check(String url) {
        throw new UnsupportedOperationException("TODO");
    }
}`,
      tests: `import java.net.URI;

public class Main {
    static int passed = 0, total = 0;
    static final Set<String> HTTP_HTTPS = Set.of("http", "https");

    // DNS gia lap: khong goi mang, ket qua xac dinh
    static class Dns implements UrlGuard.Resolver {
        final Map<String, List<String>> table = new HashMap<>();
        public List<String> lookup(String host) { return table.get(host); }
        Dns put(String host, String... ips) { table.put(host, List.of(ips)); return this; }
    }

    static void check(String name, Runnable r) {
        total++;
        try { r.run(); passed++; System.out.println("PASS " + name); }
        catch (Throwable t) { System.out.println("FAIL " + name + ": " + t); }
    }
    static void eq(Object expected, Object actual, String msg) {
        if (!Objects.equals(expected, actual)) throw new AssertionError(msg + " | expected " + expected + " got " + actual);
    }
    static UrlGuard build(Dns dns, Set<String> domains) { return new UrlGuard(dns, HTTP_HTTPS, domains); }

    public static void main(String[] args) {
        Dns dns = new Dns()
            .put("cdn.example.com", "93.184.216.34")
            .put("example.com", "93.184.216.34")
            .put("localhost", "127.0.0.1")
            .put("internal-db.corp", "10.0.0.5")
            .put("meta.internal", "169.254.169.254")
            .put("cg.example.com", "100.64.5.6")
            .put("dual.example.com", "93.184.216.34", "192.168.1.7")
            .put("hex.example.com", "127.0.0.1")
            .put("evil.net", "203.0.113.9")
            .put("rubbish.example.com", "999.1.1.1");

        check("URL public di qua duoc", () -> {
            UrlGuard g = build(dns, Set.of());
            eq(UrlGuard.Verdict.OK, g.check("http://cdn.example.com/img/avatar.png"), "http public");
            eq(UrlGuard.Verdict.OK, g.check("https://cdn.example.com/x"), "https public");
            eq(UrlGuard.Verdict.OK, g.check("http://cdn.example.com:8443/x"), "cong khong anh huong");
        });
        check("scheme chi duoc phep moi qua, file:// bi chan", () -> {
            UrlGuard g = build(dns, Set.of());
            eq(UrlGuard.Verdict.BAD_SCHEME, g.check("ftp://cdn.example.com/a"), "ftp");
            eq(UrlGuard.Verdict.BAD_URL, g.check("file:///etc/passwd"), "file khong co host -> BAD_URL");
            eq(UrlGuard.Verdict.BAD_URL, g.check("cdn.example.com/x"), "thieu scheme");
            eq(UrlGuard.Verdict.BAD_URL, g.check("http://"), "thieu host");
            eq(UrlGuard.Verdict.BAD_URL, g.check("not a url"), "chuoi ran");
            eq(UrlGuard.Verdict.BAD_URL, g.check(null), "null");
        });
        check("IP literal va moi dang so bi tu choi thuong", () -> {
            UrlGuard g = build(dns, Set.of());
            eq(UrlGuard.Verdict.BAD_URL, g.check("http://10.0.5.9/admin"), "IPv4 literal");
            eq(UrlGuard.Verdict.BAD_URL, g.check("http://2130706433/"), "thap phan");
            eq(UrlGuard.Verdict.BAD_URL, g.check("http://169.254.169.254/latest/meta-data/"), "metadata dang so");
            eq(UrlGuard.Verdict.BAD_URL, g.check("http://[::1]/"), "IPv6 literal");
            eq(UrlGuard.Verdict.BAD_URL, g.check("http://017700000001/"), "bat phan");
        });
        check("dinh dang hostname kieu RFC: underscore, label rong, dau -, ipv6", () -> {
            UrlGuard g = build(dns, Set.of());
            eq(UrlGuard.Verdict.BAD_URL, g.check("http://exa_mple.com/x"), "underscore");
            eq(UrlGuard.Verdict.BAD_URL, g.check("http://a..b.com/x"), "label rong");
            eq(UrlGuard.Verdict.BAD_URL, g.check("http://-bad.example.com/x"), "label bat dau dau -");
            eq(UrlGuard.Verdict.BAD_URL, g.check("http://bad-.example.com/x"), "label ket thuc dau -");
            eq(UrlGuard.Verdict.BAD_URL, g.check("http://exa mple.com/x"), "dau cach trong host");
        });
        check("resolve ra IP noi bo thi chan, kiem tat ca cac dia chi", () -> {
            UrlGuard g = build(dns, Set.of());
            eq(UrlGuard.Verdict.PRIVATE_IP, g.check("http://localhost:8080/admin"), "loopback");
            eq(UrlGuard.Verdict.PRIVATE_IP, g.check("http://internal-db.corp/x"), "10/8");
            eq(UrlGuard.Verdict.PRIVATE_IP, g.check("http://meta.internal/latest/meta-data/"), "169.254 link-local");
            eq(UrlGuard.Verdict.PRIVATE_IP, g.check("http://cg.example.com/x"), "100.64/10 CGNAT");
            eq(UrlGuard.Verdict.PRIVATE_IP, g.check("http://dual.example.com/x"), "mot cong mot noi bo");
            eq(UrlGuard.Verdict.PRIVATE_IP, g.check("http://hex.example.com/x"), "ten co chu van bi chan vi IP");
        });
        check("DNS khong co ket qua va data ran", () -> {
            UrlGuard g = build(dns, Set.of());
            eq(UrlGuard.Verdict.DNS_FAIL, g.check("http://missing.example.com/x"), "khong resolve duoc");
            eq(UrlGuard.Verdict.BAD_URL, g.check("http://rubbish.example.com/x"), "999.1.1.1 khong phai IP hop le");
        });
        check("domain allowlist: subdomain duoc, duoi-gian-ten-khong", () -> {
            UrlGuard g = build(dns, Set.of("example.com"));
            eq(UrlGuard.Verdict.OK, g.check("http://cdn.example.com/a"), "subdomain hop le");
            eq(UrlGuard.Verdict.OK, g.check("http://example.com/a"), " chinh domain cung duoc");
            eq(UrlGuard.Verdict.DOMAIN_NOT_ALLOWED, g.check("http://example.com.evil.net/a"), "vi duoi ten khong phai subdomain");
            eq(UrlGuard.Verdict.DOMAIN_NOT_ALLOWED, g.check("http://notexample.com/a"), "chua phai duoi .example.com");
            eq(UrlGuard.Verdict.DOMAIN_NOT_ALLOWED, g.check("http://evil.net/a"), "domain la");
        });
        check("userinfo bi tu choi truc tiep, ke ca khi host that ngoai allowlist", () -> {
            UrlGuard g = build(dns, Set.of("example.com"));
            eq(UrlGuard.Verdict.BAD_URL, g.check("http://admin:pass@cdn.example.com/a"), "co userinfo");
            eq(UrlGuard.Verdict.BAD_URL, g.check("http://cdn.example.com@evil.net/a"), "host that la evil.net + co userinfo");
            eq(UrlGuard.Verdict.DOMAIN_NOT_ALLOWED, g.check("http://evil.net/a"), "khong co userinfo thi bi chan boi allowlist");
        });
        check("thu tu uu tien: allowlist duoc kiem truoc khi resolve", () -> {
            UrlGuard g = build(dns, Set.of("example.com"));
            eq(UrlGuard.Verdict.DOMAIN_NOT_ALLOWED, g.check("http://internal-db.corp/x"), "khong mat cong resolve cho domain ngoai allowlist");
        });
        check("chuan hoa hoa thuong va dau cham cuoi", () -> {
            UrlGuard g = build(dns, Set.of("example.com"));
            eq(UrlGuard.Verdict.OK, g.check("HTTP://CDN.Example.COM./a"), "hoa thuong + dau cham cuoi");
            eq(UrlGuard.Verdict.OK, g.check("  https://cdn.example.com/a  "), "khoang trang hai dau");
        });
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
      reference: `import java.net.URI;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.TreeSet;

final class UrlGuard {
    enum Verdict { OK, BAD_URL, BAD_SCHEME, DOMAIN_NOT_ALLOWED, PRIVATE_IP, DNS_FAIL }

    interface Resolver {
        List<String> lookup(String host);
    }

    private final Resolver resolver;
    private final Set<String> schemes;   // dữ liệu giả lập trong test, không phải input người dùng
    private final Set<String> domains;   // rỗng = không giới hạn tên miền

    UrlGuard(Resolver resolver, Set<String> allowedSchemes, Set<String> allowedDomains) {
        this.resolver = resolver;
        this.schemes = lower(allowedSchemes);
        this.domains = lower(allowedDomains);
    }

    private static Set<String> lower(Set<String> in) {
        Set<String> out = new TreeSet<>(String.CASE_INSENSITIVE_ORDER);
        if (in != null) for (String s : in) if (s != null && !s.isBlank()) out.add(s.trim());
        return out;
    }

    Verdict check(String url) {
        if (url == null || url.trim().isEmpty()) return Verdict.BAD_URL;
        URI uri;
        try {
            uri = new URI(url.trim());                     // neu chua ky tu dac biet thi ném exception
        } catch (Exception e) {
            return Verdict.BAD_URL;
        }
        String scheme = uri.getScheme();
        if (scheme == null || !uri.isAbsolute()) return Verdict.BAD_URL;
        String rawHost = uri.getHost();
        if (rawHost == null || rawHost.isBlank()) return Verdict.BAD_URL;      // file:///... không có host
        if (!schemes.contains(scheme.toLowerCase(Locale.ROOT))) return Verdict.BAD_SCHEME;
        if (uri.getUserInfo() != null) return Verdict.BAD_URL;
        String host = normalizeHost(rawHost);
        if (host == null) return Verdict.BAD_URL;
        if (!domains.isEmpty() && !domainAllowed(host)) return Verdict.DOMAIN_NOT_ALLOWED;
        return resolveAndCheck(host);
    }

    // trả về null nếu hostname không đạt chuẩn; ngược lại là bản đã chuẩn hóa
    private static String normalizeHost(String raw) {
        if (raw == null) return null;
        String host = raw.toLowerCase(Locale.ROOT);
        if (host.endsWith(".")) host = host.substring(0, host.length() - 1);
        if (host.isEmpty() || host.startsWith("[")) return null;      // IPv6 literal
        String[] labels = host.split("\\\\.", -1);
        boolean allNumeric = true;
        for (String label : labels) {
            if (label.isEmpty() || label.length() > 63) return null;
            if (label.startsWith("-") || label.endsWith("-")) return null;
            boolean numeric = true;
            for (int i = 0; i < label.length(); i++) {
                char c = label.charAt(i);
                boolean ok = (c >= 'a' && c <= 'z') || (c >= '0' && c <= '9') || c == '-';
                if (!ok) return null;                                   // underscore, percent, unicode...
                if (c < '0' || c > '9') numeric = false;
            }
            if (!numeric) allNumeric = false;
        }
        return allNumeric ? null : host;                                 // IP literal / dang so
    }

    private boolean domainAllowed(String host) {
        for (String d : domains) {
            if (host.equals(d) || host.endsWith("." + d)) return true;
        }
        return false;
    }

    private Verdict resolveAndCheck(String host) {
        List<String> ips = resolver == null ? null : resolver.lookup(host);
        if (ips == null || ips.isEmpty()) return Verdict.DNS_FAIL;
        for (String ip : ips) {
            int[] o = parseIpv4(ip);
            if (o == null) return Verdict.BAD_URL;
            if (!isGlobalUnicast(o)) return Verdict.PRIVATE_IP;
        }
        return Verdict.OK;
    }

    // dung tay thay vi InetAddress.getByName: no se goi DNS that
    private static int[] parseIpv4(String ip) {
        if (ip == null) return null;
        String[] parts = ip.trim().split("\\\\.", -1);
        if (parts.length != 4) return null;
        int[] o = new int[4];
        for (int i = 0; i < 4; i++) {
            String p = parts[i];
            if (p.isEmpty() || p.length() > 3) return null;
            int v = 0;
            for (int k = 0; k < p.length(); k++) {
                char c = p.charAt(k);
                if (c < '0' || c > '9') return null;
                v = v * 10 + (c - '0');
            }
            if (v > 255) return null;
            o[i] = v;
        }
        return o;
    }

    private static boolean isGlobalUnicast(int[] o) {
        int a = o[0], b = o[1], c = o[2];
        if (a == 0) return false;                                   // 0.0.0.0/8
        if (a == 10) return false;                                  // 10.0.0.0/8
        if (a == 100 && b >= 64 && b <= 127) return false;          // 100.64.0.0/10
        if (a == 127) return false;                                 // loopback
        if (a == 169 && b == 254) return false;                     // link-local (metadata)
        if (a == 172 && b >= 16 && b <= 31) return false;           // 172.16.0.0/12
        if (a == 192 && b == 0 && (c == 0 || c == 2)) return false; // IETF reserved + TEST-NET
        if (a == 192 && b == 168) return false;
        if (a == 198 && (b == 18 || b == 19)) return false;         // benchmarking
        return a < 224;                                             // multicast va reserved
    }
}`,
      hints: [
        'Đừng dùng {{InetAddress.getByName}}: nó gọi DNS thật và có cache, làm test không còn xác định. Hãy gọi {{resolver.lookup(host)}} rồi tự parse bốn octet bằng tay.',
        'Chuẩn hoá hostname một lần duy nhất (chữ thường với {{Locale.ROOT}}, cắt một dấu chấm cuối) rồi dùng bản đó cho cả allowlist lẫn DNS — nếu không thì {{EXAMPLE.COM.}} và {{example.com}} thành hai kết quả khác nhau.',
        'Để từ chối IP literal, kiểm "mọi label chỉ gồm chữ số" sau khi tách dấu chấm; đừng cố nhận diện {{2130706433}} bằng cách sinh số rồi so dải.',
        'Phần label: dùng {{split}} với giới hạn {{-1}} để label rỗng không bị mất, nếu không {{a..b.com}} trông như hợp lệ.',
        'Cho {{0x7f000001}}: nó có chữ cái nên đi qua bước định dạng, rồi bị chặn ở bước kiểm IP — đó là ý của phòng thủ nhiều lớp.',
      ],
      explain: `Bốn điều nên nói được trong phỏng vấn sau khi viết xong {{UrlGuard}}:

- **Thứ tự các bước là một phần của thiết kế.** Filter rẻ (định dạng, allowlist tên miền) đứng trước, việc đắt (resolve) đứng sau, và vì thế {{http://internal-db.corp}} với allowlist {{example.com}} trả về {{DOMAIN_NOT_ALLOWED}} chứ không phải {{PRIVATE_IP}}. Kiểm tra quyền/ordering sai là nguồn bug "test xanh, production đỏ".
- **Từ chối IP literal là quyết định đúng chứ không phải lười.** Parse mọi biến thể của một địa chỉ ({{127.1}}, bát phân, IPv6-mapped) rất dễ sai; "không chấp nhận host dạng số" cắt hết danh sách bằng một dòng, và trong thực tế chẳng ai đưa IP literal vào webhook.
- **Resolver phải là dependency.** Đây là điểm làm bài tập test được: cùng một hostname có thể trả về hai địa chỉ khác nhau theo thời gian, nên nếu gọi thẳng {{InetAddress}} thì test vừa chậm vừa không xác định. Trong app thật, cùng lý do đó dẫn tới một quyết định kiến trúc: cho phép **pin** địa chỉ đã kiểm tra (OkHttp {{Dns}}, Apache {{setDnsResolver}}).
- **{{check}} trả mã lỗi, không trả exception về tay người dùng.** Message {{BAD_URL}} là để log/đo; còn response cho client nên là một lỗi chung ("URL không hợp lệ"), vì mỗi thông báo khác nhau tiết lộ một sự thật về hệ thống bên trong.

Lỗi còn lại mà bài này **không** đóng được — và bạn nên nói rõ trong phỏng vấn: DNS rebinding (kiểm tra lúc {{t0}}, kết nối lúc {{t1}}), và redirect. Cái thứ nhất cần pin IP hoặc egress control ở tầng network; cái thứ hai cần {{followRedirects = NEVER}} rồi chạy lại toàn bộ {{check}} cho mỗi {{Location}}.`,
    },
  ],
  check: [
    {
      q: 'Endpoint {{POST /avatar}} nhận về một trường {{url}}, server tải ảnh ở URL đó rồi lưu vào S3. Vì sao đây là lỗ hổng nghiêm trọng dù chỉ là đọc một tấm ảnh?',
      options: [
        'Vì tải ảnh tốn băng thông',
        'Vì server đứng trong mạng nội bộ và có vai trò IAM trên instance: nó có thể được dụ gọi các đích nội bộ như {{http://169.254.169.254/latest/meta-data/}} để lấy credential tạm',
        'Vì ảnh có thể chứa virus',
        'Vì {{HttpClient}} không hỗ trợ HTTPS',
      ],
      answer: 1,
      explain: 'Bản chất là **server gửi request từ vị trí đặc quyền thay cho người dùng**. Network nội bộ, admin ports và metadata endpoint đều chỉ reachable từ bên trong, nên attacker dùng app làm bàn đạp. Tốn băng thông là hệ quả nhỏ; virus là một bài toán khác; HTTPS thì luôn ổn. Trên AWS còn bật IMDSv2 và hop limit để giảm hậu quả, nhưng vẫn phải sửa SSRF.',
    },
    {
      q: 'Code hiện tại chặn nếu URL chứa chuỗi {{localhost}} hoặc {{127.0.0.1}}. Payload nào dưới đây **lọt** qua?',
      options: [
        'Chỉ {{http://localhost:8080}} mới lọt qua',
        '{{http://2130706433/}} (số thập phân của 127.0.0.1), {{http://127.1/}}, {{http://[::1]/}} và {{http://abc.127.0.0.1.nip.io/}}',
        'Không lọt được cái nào vì driver sẽ chuẩn hoá về {{127.0.0.1}} trước khi kết nối',
        'Chỉ {{http://[::1]/}} lọt qua, vì IPv6 không liên quan tới loopback',
      ],
      answer: 1,
      explain: 'Blacklist chuỗi chỉ chặn đúng hai dạng được viết ra. {{2130706433}}, {{0x7f000001}}, bát phân, {{127.1}}, IPv6 {{[::1]}} là cách viết khác của cùng một nơi, và {{nip.io}} là dịch vụ DNS công khai cho phép nhúng IP vào tên miền. Vì driver phân tích **sau** khi app đã quyết định cho qua, nên bộ lọc chuỗi không được chuẩn hoá hộ. Đúng là kiểm định dạng (không nhận host dạng số) rồi resolve và kiểm địa chỉ.',
    },
    {
      q: 'Bạn resolve {{evil.com}}, thấy {{1.2.3.4}} là public rồi cho kết nối — nhưng server lại đọc được metadata. Đây là lỗi gì và cách sửa đáng tin nhất?',
      options: [
        'Không có lỗi, chắc là log bị sai',
        'SQL injection trong truy vấn avatar',
        'DNS rebinding (TOCTOU): zone có TTL cực ngắn nên lần resolve lúc kết nối trả 169.254.169.254; đáng tin nhất là kiểm soát đường ra ở tầng network/egress proxy, cộng với pin đúng địa chỉ đã kiểm tra',
        'Lỗi nằm ở {{HttpClient}} và chỉ cần nâng cấp version mới nhất',
      ],
      answer: 2,
      explain: 'Kiểm tra và sử dụng là **hai thời điểm**, giữa hai thời điểm đó attacker đổi bản ghi DNS, nên kết quả kiểm tra không còn áp dụng. Nâng cấp client không đổi được điều đó. Sửa được bằng cách kết nối **đúng địa chỉ đã kiểm** (OkHttp {{Dns}}, Apache {{setDnsResolver}}) hoặc không cho app ra internet tuỳ ý — lớp network không phụ thuộc code nên đáng tin hơn.',
    },
  ],
  related: ['security-011', 'security-001'],
  tags: ['SSRF', 'metadata endpoint', 'DNS rebinding', 'allowlist', 'egress control', 'IMDSv2'],
},
{
  id: 'lesson-security-010',
  track: 'security',
  order: 10,
  title: 'Tự ký và kiểm JWT HS256',
  level: 'senior',
  minutes: 40,
  goals: ['Hiểu cấu trúc JWT và HMAC-SHA256', 'Tự ký/verify token trong Java', 'Phòng alg=none và chữ ký sai'],
  body: `**Tóm tắt:** JWT = base64url(header).base64url(payload).base64url(HMAC(header.payload, secret)); verify phải so sánh chữ ký thời gian hằng và kiểm exp/nbf/alg.

### JWT là gì
JWT (JSON Web Token) là chuỗi 3 phần cách nhau bởi dấu chấm: header.payload.signature. Mỗi phần là base64url (base64 biến thể an toàn cho URL, không padding =). **Lưu ý quan trọng:** JWT chỉ **ký** (signed JWS), không **mã hóa** (encrypted JWE) — payload ai cũng decode được. Dùng khi cần truyền claim giữa các bên tin nhau mà không cần giấu nội dung.

### Vì sao cần HMAC
HMAC-SHA256 đảm bảo payload không bị sửa; secret chia sẻ giữa issuer và verifier. HMAC là MAC (Message Authentication Code) dựa trên hàm băm: chỉ ai có secret mới tạo ra được MAC đúng, và thay đổi một bit nào của dữ liệu làm MAC sai hoàn toàn.

### Base64url trong Java
Base64url (biến thể Base64 an toàn cho URL: thay {{+}} thành {{-}}, {{/}} thành {{_}}, bỏ padding {{=}}) dùng để mỗi phần JWT đi được trong URL/header mà không bị encode hỏng. Dùng {{Base64.getUrlEncoder().withoutPadding()}} và {{getUrlDecoder()}}. **Không dùng** Base64 chuẩn vì {{+}}/{{/}}/{{=}} sẽ bị percent-encode khi ở query string hoặc header.

### Cơ chế từng bước (ký và xác minh)
1. **Chuẩn bị header**: JSON tối thiểu:
   ~~~json
   {"alg":"HS256","typ":"JWT"}
   ~~~
   **Vì sao phải có {{alg}}?** Để verifier biết thuật toán kỳ vọng; nếu không kiểm, attacker có thể đổi {{alg}} và lách chữ ký. **Vì sao {{typ}}?** Xác định đây là JWT, tránh nhầm lẫn với các định dạng khác.
2. **Chuẩn bị payload (claims)**: chứa dữ liệu như {{sub}} (subject - định danh người dùng), {{exp}} (expiration - thời điểm hết hạn, tính bằng epoch seconds, tức số giây từ 1970-01-01), {{nbf}} (not before - chưa có hiệu lực trước thời điểm này), {{iss}} (issuer - bên phát hành), {{aud}} (audience - bên nhận), {{iat}} (issued at - lúc cấp), {{jti}} (JWT ID - định danh duy nhất cho token, dùng cho denylist). **Vì sao dùng epoch seconds?** So sánh số nguyên nhanh, không phụ thuộc múi giờ, không parse phức tạp.
3. **Mã hóa 2 phần**: {{headerB64 = base64url(headerJson)}}, {{payloadB64 = base64url(payloadJson)}}. **Vì sao base64url mà không phải JSON thô?** JSON có dấu ngoặc/khoảng trắng/ký tự đặc biệt dễ hỏng khi đi qua HTTP header {{Authorization: Bearer ...}}.
4. **Tạo dữ liệu ký**: {{signingInput = headerB64 + "." + payloadB64}}. Chữ ký bao phủ cả header lẫn payload, nên sửa bất kỳ byte nào (kể cả đổi {{alg}}) cũng làm chữ ký sai.
5. **Tính HMAC-SHA256**: {{HMAC(secret, signingInput)}} dùng {{javax.crypto.Mac}}. HMAC cho ra chuỗi byte chứng minh: ai có {{secret}} mới tạo ra được chữ ký này, và dữ liệu không bị đổi. **HMAC không mã hóa** payload: ai cũng decode base64url được.
6. **Ghép token**: {{token = headerB64 + "." + payloadB64 + "." + base64url(signature)}}.
7. **Xác minh (verify)**: tách 3 phần → decode header, **kiểm {{alg}} trước** (chỉ chấp nhận {{HS256}}) → parse payload lấy {{exp}}/{{nbf}} → tính lại HMAC từ {{headerB64.payloadB64}} bằng cùng {{secret}} → so sánh chữ ký bằng {{MessageDigest.isEqual}} (constant-time) → kiểm tra thời gian ({{now < exp}}, {{now >= nbf}}, cho phép sai lệch đồng hồ nhỏ, clock skew, ví dụ 30-60 giây) → kiểm {{iss}}/{{aud}} nếu có.

~~~java
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.security.MessageDigest;
import java.util.Base64;
import java.nio.charset.StandardCharsets;

class JwtDemo {
  static String b64(byte[] b){ return Base64.getUrlEncoder().withoutPadding().encodeToString(b); }
  static String sign(String headerB64, String payloadB64, byte[] secret) throws Exception {
    String data = headerB64 + "." + payloadB64;           // signing input: header.payload
    Mac mac = Mac.getInstance("HmacSHA256");
    mac.init(new SecretKeySpec(secret, "HmacSHA256"));    // khóa bí mật >= 256 bit (32 byte)
    byte[] sig = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
    return data + "." + b64(sig);
  }
  static boolean verifySig(String headerB64, String payloadB64, String sigB64, byte[] secret) throws Exception {
    String expected = sign(headerB64, payloadB64, secret);
    byte[] a = expected.substring(expected.lastIndexOf('.') + 1).getBytes(StandardCharsets.UTF_8);
    byte[] b = sigB64.getBytes(StandardCharsets.UTF_8);
    return MessageDigest.isEqual(a, b); // constant-time: KHÔNG dùng String.equals
  }
}
~~~

| Thuộc tính | HMAC-SHA256 (HS256) | RSA/ECDSA (RS256/ES256) |
|---|---|---|
| Khóa | 1 secret chia sẻ (đối xứng) | Cặp private/public (bất đối xứng) |
| Ai verify được? | Bất kỳ ai có secret | Ai cũng verify được bằng public key |
| Dùng khi | Issuer và verifier là cùng hệ thống/tin nhau | Nhiều bên verify, issuer giữ private key |
| Rủi ro | Lộ secret = ai cũng ký được token giả | Quản lý key phức tạp hơn |

| Thuộc tính | JWS (Signed JWT) | JWE (Encrypted JWT) |
|---|---|---|
| Mục đích | Toàn vẹn (integrity) + xác thực (authenticity) | Bí mật (confidentiality) |
| Payload | Plaintext (base64url) | Ciphertext |
| Dùng khi | Claim công khai, chỉ cần biết không bị sửa | Claim nhạy cảm (PII, token nội bộ) |

### Ký: ví dụ đầy đủ xử lý lỗi
~~~java
String sign(String payloadJson, byte[] secret, long now) {
  String h = b64("{\"alg\":\"HS256\",\"typ\":\"JWT\"}".getBytes(StandardCharsets.UTF_8));
  String p = b64(payloadJson.getBytes(StandardCharsets.UTF_8));
  String data = h + "." + p;
  try {
    Mac mac = Mac.getInstance("HmacSHA256");
    mac.init(new SecretKeySpec(secret, "HmacSHA256"));
    return data + "." + b64(mac.doFinal(data.getBytes(StandardCharsets.UTF_8)));
  } catch (GeneralSecurityException e) {
    throw new IllegalStateException("JWT signing failed", e);
  }
}
~~~

### Verify: thứ tự kiểm tra quyết định an toàn
1. Tách đúng 3 phần bằng dấu chấm; khác 3 phần → reject.
2. Decode header, parse JSON, **bắt buộc {{alg == "HS256"}}**; khác → reject (chặn {{none}}, {{RS256}}...).
3. Decode payload, parse {{exp}}, {{nbf}}, {{iss}}, {{aud}}.
4. Kiểm tra thời gian: {{now < exp}} (RFC 7519: bằng {{exp}} là hết hạn), {{now >= nbf}}, cho clock skew 30-60s.
5. Tính lại HMAC trên {{header.payload}}, so bằng {{MessageDigest.isEqual}}.
6. Kiểm {{iss}}/{{aud}} khớp kỳ vọng (nếu có cấu hình).

### Đồng hồ giả
Truyền {{Clock}} hoặc {{Instant}} vào hàm verify thay vì {{System.currentTimeMillis()}} để test token hết hạn, đồng hồ lệch, clock skew. Production dùng {{Clock.systemUTC()}}.

### Tại sao alg phải kiểm trước HMAC (chống alg confusion)
Nếu attacker đổi header thành:
   ~~~json
   {"alg":"none"}
   ~~~
   và xóa signature, server "linh hoạt" có thể chấp nhận token không chữ ký. Hoặc attacker đổi {{HS256}} sang {{RS256}} (bất đối xứng - dùng public key để verify) và ký bằng HMAC dùng **public key** của server (public key thường công khai) — nếu server lại verify RSA bằng khóa đó như HMAC, token giả lọt qua. Đây gọi là **algorithm confusion**. **Cách chặn**: danh sách trắng thuật toán cố định (chỉ {{HS256}} cho luồng này), kiểm tra {{alg}} **trước** khi tính HMAC; không tin {{alg}} từ token để chọn thuật toán.

### Xoay khóa (key rotation) và kid
- **kid (Key ID)**: trường trong header chỉ định secret nào dùng để verify, hữu ích khi xoay khóa.
- **Rotation**: phát hành token mới bằng secret mới, nhưng vẫn giữ secret cũ một thời gian ân hạn (grace period) để token cũ chưa hết {{exp}} vẫn verify được; sau grace period mới bỏ secret cũ.
- **Lưu ý**: rotation không thu hồi token đã phát; muốn thu hồi ngay cần danh sách đen (denylist) theo {{jti}} hoặc dùng access token ngắn hạn (5-15 phút) + refresh token.

### Ví dụ đời thực: bypass xác thực do quên kiểm alg
**Triệu chứng:** Admin panel bị chiếm quyền mà không có password. **Điều tra:** Log thấy request có token {{alg=none}} được chấp nhận. **Nguyên nhân:** Code chỉ decode payload lấy {{sub}} mà không kiểm {{alg}}. Attacker tạo token:
   ~~~json
   {"alg":"none"}
   ~~~
   +
   ~~~json
   {"sub":"admin"}
   ~~~
   + rỗng chữ ký. **Xử lý:** Thêm whitelist {{alg}} trước khi verify; deploy patch trong 15 phút. **Kết quả:** Không còn bypass được; thêm test tự động cho {{alg=none}}.

### Lỗi hay gặp trên production
1. **So sánh chữ ký bằng {{String.equals}}**
   - Triệu chứng: không thấy lỗi chức năng, nhưng hệ thống có thể bị dò chữ ký qua thời gian phản hồi.
   - Nguyên nhân: {{equals}} thoát sớm tại byte khác đầu tiên (timing leak).
   - Cách sửa: luôn dùng {{MessageDigest.isEqual(expected, given)}} (constant-time).
2. **Không kiểm {{alg}} hoặc chấp nhận {{alg}} từ token**
   - Triệu chứng: token giả với {{alg=none}} hoặc chữ ký bịa được chấp nhận.
   - Nguyên nhân: code chỉ decode payload mà bỏ qua/ tin header.
   - Cách sửa: whitelist {{alg == "HS256"}} trước khi verify; từ chối mọi giá trị khác ({{none}}, {{RS256}}, {{HS512}}...).
3. **Không kiểm {{exp}}/{{nbf}} hoặc dùng đồng hồ hệ thống lung tung**
   - Triệu chứng: token hết hạn vẫn truy cập được; token bị từ chối sớm trên máy lệch giờ.
   - Nguyên nhân: quên parse claim; so sánh với {{System.currentTimeMillis()}} khiến test khó.
   - Cách sửa: kiểm {{exp}}/{{nbf}} bắt buộc; truyền {{Clock}}/thời điểm hiện tại vào hàm verify (dễ test); cho phép clock skew nhỏ (30-60s).
4. **Dùng Base64 thường hoặc secret yếu**
   - Triệu chứng: verify thất bại ngẫu nhiên với token đi qua URL/header; token dễ bị brute-force.
   - Nguyên nhân: Base64 chuẩn dùng {{+}}/{{/}}/{{=}} gây lỗi khi encode URL; secret ngắn/dễ đoán.
   - Cách sửa: dùng {{Base64.getUrlEncoder().withoutPadding()}} (base64url); secret HS256 >= 256 bit (32 byte) sinh từ {{SecureRandom}}, lưu trong secret manager, không hard-code.
5. **Không kiểm {{aud}}/{{iss}} khi hệ thống có nhiều service/tenant**
   - Triệu chứng: token cấp cho service A bị dùng truy cập service B; token tenant A truy cập tenant B.
   - Nguyên nhân: code chỉ kiểm {{exp}}/{{sub}}; {{aud}}/{{iss}} để trống.
   - Cách sửa: cấu hình {{expectedIssuer}}, {{expectedAudience}} và validate bắt buộc.
6. **Secret hard-code trong repo hoặc log ra console**
   - Triệu chứng: Secret lộ trên GitHub/GitLab; pentest tìm thấy secret trong log file.
   - Nguyên nhân: Dev copy secret vào code để test nhanh; logger in toàn bộ token/request.
   - Cách sửa: Dùng {{@Value}} từ env/Secret Manager; mask secret trong log; quét secret trong CI.

### Liên hệ phỏng vấn
- **Hỏi: "JWT có mã hóa dữ liệu không? HS256 hoạt động ra sao?"** — Trả lời: JWT chỉ ký (đảm bảo tính toàn vẹn - integrity, biết dữ liệu có bị sửa không), không mã hóa, nên ai có token cũng đọc được payload; HS256 dùng HMAC-SHA256 với một secret chia sẻ: tính {{base64url(header).base64url(payload)}}, ký bằng HMAC, verify bằng cách tính lại và so sánh constant-time. Muốn giấu nội dung phải dùng JWE.
- **Hỏi: "Làm sao ngăn tấn công {{alg=none}} và timing attack khi verify JWT?"** — Trả lời: whitelist thuật toán (chỉ chấp nhận {{HS256}}) và kiểm tra {{alg}} trước khi tin chữ ký; so sánh chữ ký bằng {{MessageDigest.isEqual}} để tránh timing leak; luôn kiểm {{exp}}/{{nbf}}/{{iss}}/{{aud}} phù hợp.
- **Hỏi: "Làm sao thu hồi JWT và xoay secret an toàn?"** — Trả lời: JWT tự chứa (stateless) nên khó thu hồi ngay; dùng access token ngắn hạn (5-15 phút) + refresh token có thể thu hồi, hoặc denylist theo {{jti}}; xoay key bằng {{kid}} và giữ secret cũ trong grace period đến khi token cũ hết hạn.
- **Hỏi: "HS256 hay RS256, khi nào chọn cái nào?"** — Trả lời: HS256 cho hệ thống đơn giản, issuer=verifier, hiệu năng cao; RS256 cho kiến trúc phân tán, nhiều resource server verify, IdP trung tâm cấp token, public key phân phối qua JWKS.`,
  exercises: [
    {
      title: 'JWT sign/verify',
      prompt: `Implement Jwt.sign(payloadJson, secret, nowEpochSec) và Jwt.verify(token, secret, nowEpochSec) trả boolean. Từ chối alg khác HS256, exp hết hạn, nbf chưa hiệu lực, chữ ký sai.`,
      starter: `import java.util.*;\nimport java.nio.charset.StandardCharsets;\nimport javax.crypto.Mac;\nimport javax.crypto.spec.SecretKeySpec;\nimport java.security.MessageDigest;\nimport java.util.Base64;\n\nclass Jwt {\n  static String sign(String payloadJson, byte[] secret, long now) {\n    throw new UnsupportedOperationException("TODO");\n  }\n  static boolean verify(String token, byte[] secret, long now) {\n    throw new UnsupportedOperationException("TODO");\n  }\n}\n`,
      tests: `public class Main {\n  static void eq(String a,String b){if(!a.equals(b))throw new AssertionError(a+" != "+b);}\n  static void t(boolean c,String m){if(!c)throw new AssertionError(m);}\n  public static void main(String[] a){\n    byte[] s="secretsecretsecretsecret".getBytes();\n    String tok=Jwt.sign("{\\"sub\\":\\"u1\\",\\"exp\\":200}",s,100);\n    t(Jwt.verify(tok,s,150),"valid");\n    t(!Jwt.verify(tok,s,250),"expired");\n    String bad=tok.substring(0,tok.lastIndexOf('.')+1)+"AAAA";\n    t(!Jwt.verify(bad,s,150),"bad sig");\n    String h=Base64.getUrlEncoder().withoutPadding().encodeToString("{\\"alg\\":\\"none\\",\\"typ\\":\\"JWT\\"}".getBytes());\n    String p=Base64.getUrlEncoder().withoutPadding().encodeToString("{\\"sub\\":\\"u1\\",\\"exp\\":200}".getBytes());\n    t(!Jwt.verify(h+"."+p+".",s,150),"alg none");\n    System.out.println("RESULT 4/4");\n  }\n}`,
      reference: `import java.util.*;\nimport java.nio.charset.StandardCharsets;\nimport javax.crypto.Mac;\nimport javax.crypto.spec.SecretKeySpec;\nimport java.security.MessageDigest;\nimport java.util.Base64;\n\nclass Jwt {\n  static String b64e(byte[] b){return Base64.getUrlEncoder().withoutPadding().encodeToString(b);}\n  static byte[] b64d(String s){return Base64.getUrlDecoder().decode(s);}\n  static String sign(String payloadJson, byte[] secret, long now){\n    String h=b64e("{\\"alg\\":\\"HS256\\",\\"typ\\":\\"JWT\\"}".getBytes(StandardCharsets.UTF_8));\n    String p=b64e(payloadJson.getBytes(StandardCharsets.UTF_8));\n    String data=h+"."+p;\n    try{Mac mac=Mac.getInstance("HmacSHA256");mac.init(new SecretKeySpec(secret,"HmacSHA256"));return data+"."+b64e(mac.doFinal(data.getBytes(StandardCharsets.UTF_8)));}\n    catch(Exception e){throw new RuntimeException(e);}\n  }\n  static boolean verify(String token, byte[] secret, long now){\n    String[] parts=token.split("\\\\.",-1);\n    if(parts.length!=3) return false;\n    try{\n      String hs=new String(b64d(parts[0]),StandardCharsets.UTF_8);\n      if(!hs.contains("\\"alg\\":\\"HS256\\"")) return false;\n      String ps=new String(b64d(parts[1]),StandardCharsets.UTF_8);\n      long exp=Long.MAX_VALUE,nbf=Long.MIN_VALUE;\n      int i=ps.indexOf("\\"exp\\""); if(i>=0){int c=ps.indexOf(':',i);int e=ps.indexOf(',',c); if(e<0)e=ps.indexOf('}',c); exp=Long.parseLong(ps.substring(c+1,e).trim());}\n      i=ps.indexOf("\\"nbf\\""); if(i>=0){int c=ps.indexOf(':',i);int e=ps.indexOf(',',c); if(e<0)e=ps.indexOf('}',c); nbf=Long.parseLong(ps.substring(c+1,e).trim());}\n      if(now>exp) return false;\n      if(now<nbf) return false;\n      Mac mac=Mac.getInstance("HmacSHA256");mac.init(new SecretKeySpec(secret,"HmacSHA256"));\n      byte[] calc=mac.doFinal((parts[0]+"."+parts[1]).getBytes(StandardCharsets.UTF_8));\n      byte[] given=b64d(parts[2]);\n      return MessageDigest.isEqual(calc,given);\n    }catch(Exception e){return false;}\n  }\n}\n`,
      hints: ['Dùng MessageDigest.isEqual', 'Kiểm alg trước khi tính HMAC'],
      explain: 'Lời giải ký bằng HMAC và verify với so sánh thời gian hằng; parse exp/nbf đơn giản.',
    },
  ],
  check: [
    { q: 'Vì sao dùng MessageDigest.isEqual thay vì String.equals khi so sánh chữ ký JWT?', options: ['Nhanh hơn vì so byte thô', 'So sánh thời gian hằng (constant-time), chống timing attack', 'Tự động kiểm tra thêm thuật toán HMAC', 'Hỗ trợ so sánh Base64url có padding'], answer: 1, explain: 'MessageDigest.isEqual so sánh mọi byte với thời gian không đổi, nên attacker không đoán được chữ ký qua thời gian phản hồi. String.equals thoát sớm khi gặp byte khác, gây timing leak. Nó không tự kiểm thuật toán hay xử lý padding.' },
    { q: 'Server chấp nhận header {"alg":"none"} và bỏ qua chữ ký. Rủi ro trực tiếp là gì?', options: ['Token bị hết hạn sớm hơn', 'Xung đột encoding giữa Base64 và Base64url', 'Attacker tự tạo payload tùy ý và bypass xác thực (chữ ký bị vô hiệu)', 'Server phải tính HMAC hai lần nên chậm hơn'], answer: 2, explain: 'alg=none nghĩa là "không ký"; nếu server không từ chối, attacker sửa payload (ví dụ đổi sub thành admin) mà không cần secret. Đây là bypass xác thực, không liên quan hết hạn, encoding hay hiệu năng.' },
    { q: 'Payload JWT HS256 có được xem là bí mật không? Vì sao?', options: ['Không, vì payload chỉ base64url-encode chứ không mã hóa; HMAC chỉ đảm bảo tính toàn vẹn', 'Có, vì chỉ ai có secret mới đọc được', 'Có, nếu dùng Base64url.withoutPadding thì payload được che giấu', 'Không, nhưng chỉ vì exp đã hết hạn'], answer: 0, explain: 'Base64url là mã hóa biểu diễn (encoding), decode được bởi bất kỳ ai. HS256 là chữ ký (MAC) chứng minh dữ liệu không bị sửa, không phải mã hóa (encryption). Muốn giấu nội dung phải dùng JWE (JSON Web Encryption). Secret dùng để ký/verify, không dùng để đọc payload.' },
    { q: 'Khi xoay secret HS256 bằng kid, cách nào giúp token cũ chưa hết hạn vẫn verify được?', options: ['Đặt alg=none cho token cũ', 'Tăng exp của token cũ lên thêm 30 ngày', 'Xóa luôn secret cũ ngay khi phát hành secret mới', 'Giữ secret cũ trong grace period và chọn secret theo kid trong header'], answer: 3, explain: 'kid chỉ định khóa dùng để verify; server tra cứu secret theo kid. Giữ secret cũ trong grace period (đến khi token cũ hết exp) cho phép verify token cũ mà không chấp nhận token giả. Đặt alg=none, tự ý gia hạn exp, hay xóa secret cũ ngay đều sai/không an toàn.' },
  ],
  related: [],
  tags: ['JWT', 'HMAC', 'base64url'],
},
{
  id: 'lesson-security-011',
  track: 'security',
  order: 11,
  title: 'PKCE S256 cho OAuth public client',
  level: 'senior',
  minutes: 40,
  goals: ['Hiểu PKCE và code_challenge S256', 'Mô phỏng authorize + token exchange', 'Chặn kẻ tấn công không có verifier'],
  body: `**Tóm tắt:** PKCE (Proof Key for Code Exchange - bằng chứng trao đổi mã ủy quyền) bảo vệ public client: client tạo {{code_verifier}} ngẫu nhiên, gửi {{code_challenge = BASE64URL(SHA-256(verifier))}} khi authorize; server lưu challenge theo code và chỉ cấp token khi nhận đúng {{code_verifier}}.

### Vấn đề PKCE giải quyết là gì?
- **Public client** (SPA - ứng dụng web chạy trên trình duyệt, hoặc app mobile): không thể giữ bí mật {{client_secret}} an toàn (code/mã cài có thể bị đọc), nên chỉ dựa vào secret là không đủ.
- **Authorization code interception** (đánh cắp mã ủy quyền): kẻ tấn công trên cùng thiết bị (ví dụ app độc hại đăng ký custom URL scheme, hoặc chặn redirect) có thể lấy được {{code}} khi trình duyệt redirect về. Trước PKCE, ai có {{code}} là có thể đổi lấy token.
- **PKCE ràng buộc**: {{code}} chỉ đổi được token khi kèm {{code_verifier}} mà chỉ client khởi đầu phiên mới biết. Kẻ tấn công lấy được {{code}} nhưng không có {{verifier}} → đổi token thất bại.

### Cơ chế từng bước (S256)
1. **Client sinh {{code_verifier}}**: chuỗi ngẫu nhiên, dài 43-128 ký tự, chỉ dùng các ký tự an toàn URL (unreserved): {{[A-Z a-z 0-9 - . _ ~]}}. **Vì sao phải ngẫu nhiên và đủ dài?** Để attacker không đoán được (entropy - độ ngẫu nhiên cao). Dùng {{SecureRandom}} (bộ sinh số ngẫu nhiên an toàn mật mã), không dùng {{Random}} thường. 32 byte ngẫu nhiên → 43 ký tự base64url là độ dài tối thiểu phổ biến.
2. **Client tính {{code_challenge}} (phương thức S256)**: {{code_challenge = BASE64URL(SHA-256(ASCII(code_verifier)))}}, không padding. **Vì sao băm SHA-256?** Challenge đi qua trình duyệt/redirect (có thể lộ), nhưng từ hash một chiều không suy ngược ra verifier.
3. **Authorize request**: client chuyển hướng người dùng đến Authorization Server kèm {{response_type=code}}, {{client_id}}, {{redirect_uri}}, {{state}} (chống CSRF - Cross-Site Request Forgery, giả mạo yêu cầu từ site khác), {{code_challenge}}, {{code_challenge_method=S256}}. **Vì sao cần {{state}}?** State là giá trị ngẫu nhiên client sinh, lưu trong session, đối chiếu khi nhận callback — ngăn attacker gắn code của họ vào phiên nạn nhân (login CSRF).
4. **Server xác thực người dùng và phát {{code}}**: server lưu cặp {{(code -> code_challenge, method, client_id, redirect_uri)}} với thời gian sống ngắn (thường 1-10 phút). **Vì sao lưu theo code?** Để đối chiếu ở bước đổi token; code là khóa tra cứu duy nhất.
5. **Token request**: client gửi {{grant_type=authorization_code}}, {{code}}, {{redirect_uri}}, **và {{code_verifier}}** (lúc này verifier mới rời client, đi qua kênh back-channel HTTPS tới token endpoint). **Lưu ý:** {{code_verifier}} không bao giờ đi qua trình duyệt/URL.
6. **Server kiểm tra**: tìm challenge theo {{code}} → tính {{BASE64URL(SHA-256(code_verifier))}} → so sánh **constant-time** ({{MessageDigest.isEqual}}) với challenge đã lưu → kiểm tra {{redirect_uri}} khớp chính xác → kiểm tra {{code}} chưa dùng (một lần). **Vì sao constant-time?** Tránh timing attack khi so sánh chuỗi bí mật.
7. **Cấp token và vô hiệu hóa {{code}}**: nếu hợp lệ, trả {{access_token}} (và có thể {{refresh_token}}), đánh dấu {{code}} đã dùng để chống replay (phát lại mã cũ).

~~~seq
title: PKCE S256
actors: Client | AuthServer | Resource
Client -> AuthServer: authorize + code_challenge(S256) + state
AuthServer -> Client: redirect ?code=... & state
Client -> AuthServer: token + code + code_verifier
AuthServer -> Client: access_token (nếu verifier khớp)
~~~

### Ví dụ Java: sinh challenge và kiểm tra
~~~java
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Base64;
import java.nio.charset.StandardCharsets;

class Pkce {
  static String newVerifier() {
    byte[] buf = new byte[32];                 // 32 byte -> 43 ký tự base64url (đủ entropy)
    new SecureRandom().nextBytes(buf);         // SecureRandom: ngẫu nhiên an toàn mật mã
    return Base64.getUrlEncoder().withoutPadding().encodeToString(buf);
  }
  static String challengeS256(String verifier) throws Exception {
    byte[] hash = MessageDigest.getInstance("SHA-256")
        .digest(verifier.getBytes(StandardCharsets.US_ASCII));
    return Base64.getUrlEncoder().withoutPadding().encodeToString(hash); // base64url, no padding
  }
  static boolean matches(String verifier, String storedChallenge) throws Exception {
    // so sánh constant-time để tránh timing attack
    return MessageDigest.isEqual(challengeS256(verifier).getBytes(StandardCharsets.US_ASCII),
                                 storedChallenge.getBytes(StandardCharsets.US_ASCII));
  }
}
~~~

### Ví dụ đầy đủ: AuthServer mô phỏng luồng PKCE
~~~java
import java.util.*;
import java.security.MessageDigest;
import java.util.Base64;

class AuthServer {
  private final Map<String, String> challenges = new HashMap<>();
  private final Set<String> usedCodes = new HashSet<>();
  private int counter = 0;

  String authorize(String clientId, String challenge) {
    String code = "code" + (++counter);
    challenges.put(code, challenge);
    return code;
  }

  String token(String code, String verifier) {
    String ch = challenges.get(code);
    if (ch == null) return null;                    // code không tồn tại
    if (usedCodes.contains(code)) return null;      // code đã dùng (replay)
    if (!MessageDigest.isEqual(ch.getBytes(), challengeOf(verifier).getBytes())) return null;
    usedCodes.add(code);                            // đánh dấu đã dùng
    return "token-" + code;
  }

  static String challengeOf(String verifier) {
    try {
      MessageDigest md = MessageDigest.getInstance("SHA-256");
      byte[] d = md.digest(verifier.getBytes(java.nio.charset.StandardCharsets.UTF_8));
      return Base64.getUrlEncoder().withoutPadding().encodeToString(d);
    } catch (Exception e) { throw new RuntimeException(e); }
  }
}
~~~

| Thuộc tính | {{plain}} | {{S256}} |
|---|---|---|
| Cách tính | challenge = verifier | challenge = BASE64URL(SHA-256(verifier)) |
| Nếu challenge lộ | Verifier lộ luôn → vô nghĩa | Không suy ngược được verifier |
| Khuyến nghị | Không dùng | Bắt buộc dùng; OAuth 2.1 yêu cầu PKCE |

| Đặc điểm | Confidential Client (Server-side) | Public Client (SPA/Mobile) |
|---|---|---|
| Chạy ở đâu | Server của bạn (backend) | Máy của người dùng (browser/app) |
| Giữ được secret? | Có (env, vault) | **Không bao giờ** |
| PKCE bắt buộc? | Khuyến nghị (OAuth 2.1) | **Bắt buộc** |
| Client auth ở /token | {{client_id}} + {{client_secret}} (Basic auth) | Chỉ {{client_id}} (no secret) |

### PKCE và state bổ sung cho nhau
- **PKCE**: chứng minh "đúng client đã bắt đầu flow mới đổi được code lấy token" (chống code interception).
- **state**: giá trị ngẫu nhiên client gửi đi và kiểm tra khi nhận redirect, chứng minh response thuộc về request của mình (chống CSRF). Thiếu state, attacker có thể gắn {{code}} của họ vào phiên nạn nhân.
- **Cả hai đều cần**: PKCE bảo vệ code, state bảo vệ luồng redirect. OAuth 2.1 yêu cầu PKCE cho mọi client; state luôn khuyến nghị.

### Ví dụ đời thực: app mobile bị đánh cắp code qua custom URL scheme
**Triệu chứng:** User báo tài khoản bị chiếm dù không phishing. **Điều tra:** App đăng ký scheme {{myapp://callback}}; app độc hại cùng scheme chặn redirect lấy {{code}}. **Nguyên nhân:** Không dùng PKCE, server chỉ kiểm tra {{code}} + {{client_id}} (public). **Xử lý:** Bật PKCE S256 bắt buộc trên Auth Server; cập nhật app sinh {{verifier}}, gửi {{challenge}}, kèm {{verifier}} khi đổi token. **Kết quả:** Code bị chặn không đổi được token vì thiếu verifier; attacker không sinh được verifier (chỉ client gốc biết).

### Lỗi hay gặp trên production
1. **Dùng phương thức {{plain}} hoặc không gửi {{code_challenge_method}} đúng**
   - Triệu chứng: trao đổi token vẫn thành công nhưng bảo vệ yếu; audit bảo mật fail.
   - Nguyên nhân: triển khai theo tài liệu cũ, nhầm lẫn method.
   - Cách sửa: luôn dùng {{S256}}; server từ chối {{plain}} (đặc biệt với public client) và từ chối request thiếu PKCE theo chính sách OAuth 2.1.
2. **Không kiểm tra {{code_verifier}} / không so sánh constant-time / không chống replay {{code}}**
   - Triệu chứng: code bị đánh cắp vẫn đổi được token; mã đã dùng đổi lại lần nữa.
   - Nguyên nhân: token endpoint bỏ qua bước đối chiếu challenge-verifier; không đánh dấu {{code}} đã tiêu thụ.
   - Cách sửa: tính {{S256(verifier)}} và so sánh bằng {{MessageDigest.isEqual}} với challenge đã lưu; {{code}} dùng một lần, hết hạn nhanh (vài phút).
3. **Verifier yếu hoặc bị lộ qua log/URL**
   - Triệu chứng: attacker đoán/đọc được verifier và đổi token.
   - Nguyên nhân: verifier < 43 ký tự, dùng {{Random}} dễ đoán; ghi {{code_verifier}} vào access log hoặc để lộ trong query string phía client.
   - Cách sửa: sinh verifier bằng {{SecureRandom}}, đủ dài (43-128); **không bao giờ log {{code_verifier}}**; verifier chỉ gửi trong body POST tới token endpoint (HTTPS).
4. **Không ràng buộc {{redirect_uri}} hoặc bỏ qua {{state}}**
   - Triệu chứng: code bị chuyển hướng sang URI lạ; phiên người dùng bị gắn mã của attacker (CSRF/login CSRF).
   - Nguyên nhân: server chấp nhận redirect_uri linh hoạt; client không sinh/kiểm tra {{state}}.
   - Cách sửa: đăng ký và so khớp {{redirect_uri}} chính xác tuyệt đối; luôn sinh {{state}} ngẫu nhiên, lưu (session/cookie) và đối chiếu khi nhận callback.
5. **Code TTL quá dài hoặc không xoá challenge sau khi dùng**
   - Triệu chứng: Code cũ (ngày hôm qua) vẫn đổi được token; bộ nhớ server phình do challenge tích lũy.
   - Nguyên nhân: Không đặt TTL cho code (hoặc TTL hàng giờ); không xoá entry sau khi exchange thành công.
   - Cách sửa: TTL 1-10 phút; xoá challenge khỏi store ngay sau exchange (thành công hoặc thất bại do verifier sai).
6. **Chấp nhận {{code_challenge_method}} không hợp lệ hoặc thiếu**
   - Triệu chứng: Client gửi {{method=S256}} nhưng server không validate; hoặc client không gửi method mà server vẫn xử lý.
   - Nguyên nhân: Server không whitelist method; chỉ đọc challenge mà không kiểm tra method.
   - Cách sửa: Whitelist chỉ {{S256}}; từ chối request thiếu {{code_challenge_method}} hoặc method lạ.

### Liên hệ phỏng vấn
- **Hỏi: "PKCE giải quyết vấn đề gì và {{S256}} hoạt động ra sao?"** — Trả lời: PKCE chống đánh cắp authorization code ở public client (SPA/mobile) không giữ được secret. Client sinh {{code_verifier}} ngẫu nhiên, gửi {{code_challenge = BASE64URL(SHA-256(verifier))}} khi authorize; khi đổi token gửi kèm verifier, server băm lại và so khớp, nên kẻ chỉ có {{code}} mà không có verifier không đổi được token.
- **Hỏi: "Vì sao không dùng {{plain}} và cần so sánh challenge thế nào?"** — Trả lời: {{plain}} đặt verifier ngay trong challenge, nếu challenge lộ thì vô nghĩa; {{S256}} dùng hash một chiều. Server phải so sánh bằng constant-time ({{MessageDigest.isEqual}}) để tránh timing attack, và {{code}} phải dùng một lần.
- **Hỏi: "PKCE có thay thế {{state}} hay {{client_secret}} không?"** — Trả lời: không. PKCE chống code interception; {{state}} chống CSRF — hai cơ chế bổ sung. Với confidential client (server-side, giữ được secret) vẫn nên dùng PKCE thêm (OAuth 2.1 khuyến nghị), còn {{client_secret}} vẫn dùng để xác thực client nếu có.
- **Hỏi: "Public client và confidential client khác nhau thế nào về OAuth flow?"** — Trả lời: Public client chạy trên máy user (browser/app) → không giữ được secret → bắt buộc PKCE, không gửi client_secret; Confidential client chạy trên server của bạn → giữ được secret → dùng client_secret xác thực ở /token, PKCE khuyến nghị thêm. Cả hai đều dùng authorization code flow.`,
  exercises: [
    {
      title: 'AuthServer PKCE',
      prompt: `Implement AuthServer với authorize(clientId, challenge) trả code, và token(code, verifier) trả token hoặc null nếu verifier sai.`,
      starter: `import java.util.*;\nimport java.security.MessageDigest;\nimport java.util.Base64;\n\nclass AuthServer {\n  private final Map<String,String> challenges=new HashMap<>();\n  private int counter=0;\n  String authorize(String clientId, String challenge){ throw new UnsupportedOperationException("TODO"); }\n  String token(String code, String verifier){ throw new UnsupportedOperationException("TODO"); }\n  static String challengeOf(String verifier){ throw new UnsupportedOperationException("TODO"); }\n}\n`,
      tests: `public class Main {\n  static void t(boolean c,String m){if(!c)throw new AssertionError(m);}\n  public static void main(String[] a){\n    AuthServer s=new AuthServer();\n    String v="abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-._~";\n    String ch=AuthServer.challengeOf(v);\n    String code=s.authorize("c1",ch);\n    t(s.token(code,v)!=null,"valid verifier");\n    t(s.token(code,"wrongverifier")==null,"wrong verifier");\n    t(s.token(code,"")==null,"empty verifier");\n    t(s.token(code,v)==null,"replay rejected");\n    System.out.println("RESULT 4/4");\n  }\n}`,
      reference: `import java.util.*;\nimport java.security.MessageDigest;\nimport java.util.Base64;\n\nclass AuthServer {\n  private final Map<String,String> challenges=new HashMap<>();\n  private final Set<String> used=new HashSet<>();\n  private int counter=0;\n  String authorize(String clientId, String challenge){ String code="code"+(++counter); challenges.put(code,challenge); return code; }\n  String token(String code, String verifier){\n    String ch=challenges.get(code);\n    if(ch==null) return null;\n    if(used.contains(code)) return null;\n    if(!MessageDigest.isEqual(ch.getBytes(), challengeOf(verifier).getBytes())) return null;\n    used.add(code);\n    return "token-"+code;\n  }\n  static String challengeOf(String verifier){\n    try{MessageDigest md=MessageDigest.getInstance("SHA-256");byte[] d=md.digest(verifier.getBytes(java.nio.charset.StandardCharsets.UTF_8));return Base64.getUrlEncoder().withoutPadding().encodeToString(d);}\n    catch(Exception e){throw new RuntimeException(e);}\n  }\n}\n`,
      hints: ['challenge = base64url(SHA256(verifier))', 'So sánh thời gian hằng'],
      explain: 'Lời giải lưu challenge theo code, kiểm verifier và chống replay.',
    },
  ],
  check: [
    { q: 'PKCE S256 chủ yếu bảo vệ kịch bản tấn công nào?', options: ['SQL injection vào token endpoint', 'CSRF khi người dùng submit form', 'Đánh cắp authorization code trên public client và đổi lấy token', 'Đọc trộm payload JWT vì payload không mã hóa'], answer: 2, explain: 'PKCE ràng buộc code với code_verifier chỉ client khởi đầu biết; kẻ cướp được code nhưng không có verifier sẽ bị token endpoint từ chối. CSRF do state xử lý; SQL injection và đọc payload JWT là vấn đề khác, không phải mục tiêu của PKCE.' },
    { q: 'Vì sao nên dùng method S256 thay vì plain cho code_challenge?', options: ['S256 cho token sống lâu hơn', 'S256 tính nhanh hơn SHA-1', 'plain giúp server không cần lưu challenge', 'S256 băm một chiều nên dù challenge lộ cũng không suy ra verifier; plain để lộ luôn verifier'], answer: 3, explain: 'Với plain, challenge == verifier nên chỉ cần nhìn thấy challenge (qua redirect/log) là đổi được token, PKCE trở nên vô nghĩa. S256 dùng SHA-256 (hash một chiều) nên không suy ngược. Tuổi thọ token và tốc độ/không cần lưu đều không phải lý do đúng.' },
    { q: 'Token endpoint nhận đúng code và code_verifier khớp, nhưng code này đã dùng để đổi token trước đó. Server nên làm gì?', options: ['Từ chối vì authorization code phải dùng một lần (chống replay)', 'Vẫn cấp token mới vì verifier khớp là đủ', 'Chỉ cấp token nếu client gửi thêm client_secret', 'Chuyển sang method plain để kiểm tra lại'], answer: 0, explain: 'Authorization code là one-time-use: tái sử dụng là dấu hiệu code bị đánh cắp/replay. Server phải từ chối và có thể thu hồi token đã cấp từ code đó. Verifier khớp không đủ nếu code đã tiêu thụ; client_secret hay chuyển plain đều sai.' },
    { q: 'Trong luồng PKCE, state và PKCE khác nhau thế nào?', options: ['Giống nhau, chỉ cần dùng một trong hai', 'state chống CSRF (đảm bảo redirect thuộc request của mình), PKCE chống đánh cắp code; hai cơ chế bổ sung', 'PKCE thay thế state vì cả hai đều dùng giá trị ngẫu nhiên', 'state dùng để băm verifier, PKCE dùng để xác thực người dùng'], answer: 1, explain: 'state là giá trị ngẫu nhiên đối chiếu khi nhận callback để chống CSRF/login CSRF. PKCE chứng minh bên đổi token chính là bên bắt đầu flow. Chúng giải quyết hai lớp tấn công khác nhau nên dùng cùng nhau; không thay thế nhau.' },
  ],
  related: [],
  tags: ['PKCE', 'OAuth', 'S256'],
},
);

