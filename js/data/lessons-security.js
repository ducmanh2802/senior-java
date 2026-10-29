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
);

