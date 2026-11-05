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

    private String randomToken() {                       // 256 bit, khong doan duoc
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
        Optional<Session> found = get(req.cookieSid, nowMs);        // khong co hoac het han (da xoa)
        if (found.isEmpty()) return fail(401, null);
        Session s = found.get();
        if (disabledTenants.contains(s.tenantId)) return fail(401, null);   // kiem tra truoc, khong NPE
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
    // chu cai dau cua cac action duoc phep, theo thu tu READ, WRITE, DELETE, GRANT
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

    // ma tran mac dinh: chi nhung gi liet ke o day moi duoc phep
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
AS --> App: man hinh dang nhap va dong y
AS --> App: redirect ?code&state
App -> AS: /token (code + code_verifier)
App -> App: kiem tra state khop
AS -> AS: SHA256(verifier) == challenge?
AS --> App: access token + refresh token
App -> RS: GET /api/orders (Bearer token)
RS --> App: du lieu don hang
note App..RS: code chi dung duoc 1 lan, TTL vai chuc giay
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
new SecureRandom().nextBytes(raw);                          // KHONG dung Math.random: seed doan duoc
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
        random.nextBytes(raw);                                  // entropy that, khong phai Math.random
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
        byte[] raw = new byte[16];                              // >= 128 bit de code khong doan duoc
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
vi du  = v2:Sjao9xkQ0m1QY3p0Y2V...
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
new SecureRandom().nextBytes(iv);                       // IV moi cho MOI lan
c.init(Cipher.ENCRYPT_MODE, key, new GCMParameterSpec(128, iv));
byte[] body = c.doFinal(plaintext.getBytes(StandardCharsets.UTF_8));   // ciphertext || tag

// khi decrypt: tag duoc kiem tra ben trong doFinal
Cipher d = Cipher.getInstance("AES/GCM/NoPadding");
d.init(Cipher.DECRYPT_MODE, oldKey, new GCMParameterSpec(128, ivFromStorage));
byte[] plain = d.doFinal(ctFromStorage, 12, ctFromStorage.length - 12);   // nem AEADBadTagException neu bi sua
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
        this.keys = new HashMap<>(keysByVersion);            // copy: map ben ngoai bi doi thi van giai ma duoc
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
        // doFinal KIEM TAG va nem AEADBadTagException neu ban ma bi sua — de nguyen, khong boc
        byte[] plain = c.doFinal(all, IV_BYTES, all.length - IV_BYTES);
        return new String(plain, StandardCharsets.UTF_8);
    }

    String rotate(String stored) throws GeneralSecurityException {
        int cut = colonIndex(stored);
        if (Integer.parseInt(stored.substring(1, cut)) == currentVersion) return stored;   // idempotent
        return encrypt(decrypt(stored));                     // doc bang khoa cu, ghi bang khoa moi
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
);

