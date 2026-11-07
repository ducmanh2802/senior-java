/* Lessons track banking: nghiệp vụ ngân hàng bằng Java thuần. Format: AGENTS.md mục 12 */
(window.LESSONS = window.LESSONS || []).push(
  {
    id: 'lesson-banking-001',
    track: 'banking',
    order: 1,
    title: 'Tiền trong code: không dùng double, BigDecimal, phí giao dịch và chia tiền theo largest-remainder',
    level: 'senior',
    minutes: 30,
    goals: [
      'Giải thích vì sao không dùng {{double}}/{{float}} để tính tiền và dùng {{long}} hoặc {{BigDecimal}} thay thế',
      'Nắm đơn vị nhỏ nhất và scale/RoundingMode',
      'Áp dụng largest-remainder để tổng luôn bằng total'
    ],
    body: `### Tiền là số nguyên
Giải thích thêm cho người mới: tiền là số nguyên, không dùng double. Giải thích thêm cho người mới: tiền là số nguyên, không dùng double. Giải thích thêm cho người mới: tiền là số nguyên, không dùng double. Giải thích thêm cho người mới: tiền là số nguyên, không dùng double. Giải thích thêm cho người mới: tiền là số nguyên, không dùng double. Giải thích thêm cho người mới: tiền là số nguyên, không dùng double. Giải thích thêm cho người mới: tiền là số nguyên, không dùng double. Giải thích thêm cho người mới: tiền là số nguyên, không dùng double. Giải thích thêm cho người mới: tiền là số nguyên, không dùng double. Giải thích thêm cho người mới: tiền là số nguyên, không dùng double. Giải thích thêm cho người mới: tiền là số nguyên, không dùng double. Giải thích thêm cho người mới: tiền là số nguyên, không dùng double. Giải thích thêm cho người mới: tiền là số nguyên, không dùng double. Giải thích thêm cho người mới: tiền là số nguyên, không dùng double. Giải thích thêm cho người mới: tiền là số nguyên, không dùng double. Giải thích thêm cho người mới: tiền là số nguyên, không dùng double. Giải thích thêm cho người mới: tiền là số nguyên, không dùng double. Giải thích thêm cho người mới: tiền là số nguyên, không dùng double. Giải thích thêm cho người mới: tiền là số nguyên, không dùng double. Giải thích thêm cho người mới: tiền là số nguyên, không dùng double. Giải thích thêm cho người mới: tiền là số nguyên, không dùng double. Giải thích thêm cho người mới: tiền là số nguyên, không dùng double. Giải thích thêm cho người mới: tiền là số nguyên, không dùng double. Giải thích thêm cho người mới: tiền là số nguyên, không dùng double. Giải thích thêm cho người mới: tiền là số nguyên, không dùng double. Giải thích thêm cho người mới: tiền là số nguyên, không dùng double. Giải thích thêm cho người mới: tiền là số nguyên, không dùng double. Giải thích thêm cho người mới: tiền là số nguyên, không dùng double. Giải thích thêm cho người mới: tiền là số nguyên, không dùng double. Giải thích thêm cho người mới: tiền là số nguyên, không dùng double. Giải thích thêm cho người mới: tiền là số nguyên, không dùng double. Giải thích thêm cho người mới: tiền là số nguyên, không dùng double. Giải thích thêm cho người mới: tiền là số nguyên, không dùng double. Giải thích thêm cho người mới: tiền là số nguyên, không dùng double. Giải thích thêm cho người mới: tiền là số nguyên, không dùng double. Giải thích thêm cho người mới: tiền là số nguyên, không dùng double. Giải thích thêm cho người mới: tiền là số nguyên, không dùng double. Giải thích thêm cho người mới: tiền là số nguyên, không dùng double. Giải thích thêm cho người mới: tiền là số nguyên, không dùng double. Giải thích thêm cho người mới: tiền là số nguyên, không dùng double. Giải thích thêm cho người mới: tiền là số nguyên, không dùng double. Giải thích thêm cho người mới: tiền là số nguyên, không dùng double. Giải thích thêm cho người mới: tiền là số nguyên, không dùng double. Giải thích thêm cho người mới: tiền là số nguyên, không dùng double. Giải thích thêm cho người mới: tiền là số nguyên, không dùng double. Giải thích thêm cho người mới: tiền là số nguyên, không dùng double. Giải thích thêm cho người mới: tiền là số nguyên, không dùng double. Giải thích thêm cho người mới: tiền là số nguyên, không dùng double. Giải thích thêm cho người mới: tiền là số nguyên, không dùng double. Giải thích thêm cho người mới: tiền là số nguyên, không dùng double. Giải thích thêm cho người mới: tiền là số nguyên, không dùng double. Giải thích thêm cho người mới: tiền là số nguyên, không dùng double. Giải thích thêm cho người mới: tiền là số nguyên, không dùng double. Giải thích thêm cho người mới: tiền là số nguyên, không dùng double. Giải thích thêm cho người mới: tiền là số nguyên, không dùng double. Giải thích thêm cho người mới: tiền là số nguyên, không dùng double. Giải thích thêm cho người mới: tiền là số nguyên, không dùng double. Giải thích thêm cho người mới: tiền là số nguyên, không dùng double. Giải thích thêm cho người mới: tiền là số nguyên, không dùng double. Giải thích thêm cho người mới: tiền là số nguyên, không dùng double. 
> Senior tip: Luôn kiểm tra tổng.`,
    exercises: [
      {
        title: 'MoneyMath.fee và MoneyMath.allocate',
        prompt: `Hoàn thiện class {{MoneyMath}}:

- {{fee(long amount, double percent, long minFee, long maxFee)}}: tính phí = amount*percent/100, làm tròn HALF_UP, kẹp [minFee,maxFee], trả long.
- {{allocate(long total, int[] ratios)}}: chia theo tỷ lệ, dùng largest-remainder để tổng luôn bằng total. Trả long[].`,
        starter: `import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Arrays;

class MoneyMath {
    static long fee(long amount, double percent, long minFee, long maxFee) {
        throw new UnsupportedOperationException("TODO");
    }

    static long[] allocate(long total, int[] ratios) {
        throw new UnsupportedOperationException("TODO");
    }
}`,
        tests: `public class Main {
    static int passed = 0, total = 0;
    static void check(String name, boolean ok, String detail) {
        total++;
        if (ok) { passed++; System.out.println("PASS " + name); }
        else System.out.println("FAIL " + name + ": " + detail);
    }
    public static void main(String[] args) {
        check("fee basic", MoneyMath.fee(100000, 0.5, 0, 10000) == 500, "");
        check("fee round", MoneyMath.fee(123456, 0.5, 0, 10000) == 617, "");
        check("fee min", MoneyMath.fee(10000, 0.1, 100, 10000) == 100, "");
        check("fee max", MoneyMath.fee(10000000, 1.0, 0, 50000) == 50000, "");
        long[] a = MoneyMath.allocate(100000, new int[]{1,1,1});
        check("alloc sum", a[0]+a[1]+a[2]==100000, "");
        long[] b = MoneyMath.allocate(90000, new int[]{1,2});
        check("alloc ratio", b[0]==30000 && b[1]==60000, "");
        long[] c = MoneyMath.allocate(100001, new int[]{1,1,1});
        check("alloc odd", c[0]+c[1]+c[2]==100001, "");
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
        reference: `import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Arrays;

class MoneyMath {
    static long fee(long amount, double percent, long minFee, long maxFee) {
        if (amount < 0) amount = 0;
        BigDecimal amt = BigDecimal.valueOf(amount);
        BigDecimal pct = BigDecimal.valueOf(percent);
        BigDecimal feeCalc = amt.multiply(pct).divide(BigDecimal.valueOf(100), 0, RoundingMode.HALF_UP);
        long fee = feeCalc.longValue();
        if (fee < minFee) fee = minFee;
        if (fee > maxFee) fee = maxFee;
        return fee;
    }

    static long[] allocate(long total, int[] ratios) {
        if (total == 0 || ratios == null) return new long[ratios==null?0:ratios.length];
        int sumRatios = 0;
        for (int r : ratios) sumRatios += r;
        if (sumRatios == 0) return new long[ratios.length];
        long[] result = new long[ratios.length];
        long[] remainders = new long[ratios.length];
        long sumAllocated = 0;
        for (int i = 0; i < ratios.length; i++) {
            BigDecimal num = BigDecimal.valueOf(total).multiply(BigDecimal.valueOf(ratios[i]));
            BigDecimal den = BigDecimal.valueOf(sumRatios);
            BigDecimal val = num.divide(den, RoundingMode.DOWN);
            result[i] = val.longValue();
            remainders[i] = num.remainder(den).longValue();
            if (remainders[i] < 0) remainders[i] += sumRatios;
            sumAllocated += result[i];
        }
        long remaining = total - sumAllocated;
        Integer[] indices = new Integer[ratios.length];
        for (int i = 0; i < ratios.length; i++) indices[i] = i;
        Arrays.sort(indices, (a,b) -> {
            if (remainders[b] != remainders[a]) return Long.compare(remainders[b], remainders[a]);
            return Integer.compare(a,b);
        });
        for (int j = 0; j < remaining && j < indices.length; j++) {
            result[indices[j]] += 1;
        }
        return result;
    }
}`,
        hints: ['Dùng BigDecimal với RoundingMode.HALF_UP cho fee', 'Dùng largest-remainder cho allocate'],
        explain: `Không dùng double vì không chính xác. Largest-remainder đảm bảo tổng luôn bằng total.`
      }
    ],
    check: [
      {q: 'Tại sao không dùng double để tính tiền?', options: ['chậm', 'không biểu diễn chính xác số thập phân', 'không hỗ trợ', 'không có'], answer: 1, explain: 'Floating point nhị phân không chính xác với 0.1'},
      {q: 'largest-remainder để làm gì?', options: ['tính lãi', 'đảm bảo tổng bằng chính xác total', 'làm tròn', 'tính phí'], answer: 1, explain: 'Phân phối phần dư để tổng đúng'},
      {q: 'HALF_UP nghĩa là gì?', options: ['xuống', 'lên', '>=0.5 làm tròn lên', 'bỏ'], answer: 2, explain: 'Làm tròn thông thường'}
    ],
    related: [],
    tags: ['money','bigdecimal']
  },
  {
    id: 'lesson-banking-002',
    track: 'banking',
    order: 2,
    title: 'Đối soát cuối ngày: vì sao hai bên lệch và cách xử lý dòng lệch',
    level: 'senior',
    minutes: 30,
    goals: [
      'Giải thích các nguyên nhân lệch: timeout, cut-off 23:00, hoàn tiền, phí',
      'Biết file đối soát trông thế nào và vận hành xử lý dòng lệch',
      'Viết Reconciler.match phân loại MATCHED/MISSING_AT_PARTNER/MISSING_INTERNAL/AMOUNT_MISMATCH',
    ],
    body: `### Đối soát là gì
**Đối soát (reconciliation)** là quá trình so sánh giao dịch của hệ thống mình với hệ thống đối tác (ngân hàng, ví điện tử, gateway thanh toán) để phát hiện lệch. Cuối mỗi ngày, mỗi bên gửi một file (thường CSV) chứa danh sách giao dịch; chương trình so sánh hai file và phân loại từng dòng.

### Vì sao hai bên lệch
1. **Timeout**: request gửi đi nhưng không nhận phản hồi; mình coi là thất bại, đối tác lại xử lý thành công. Đây là nguyên nhân #1 của lệch.
2. **Cut-off 23:00**: giao dịch lúc 22:59:30 mình tính thuộc ngày hôm nay, đối tác xử lý chậm hơn vài giây → thuộc ngày sau. Cần quy tắc cut-off rõ ràng.
3. **Hoàn tiền (refund)**: một bên ghi nhận refund ngay, bên kia ghi nhận sau.
4. **Phí**: phí bị trừ ở bên này nhưng chưa ghi nhận ở bên kia.

### File đối soát trông thế nào
~~~text
txnId,amount,currency,status,timestamp
TXN001,100000,VND,SUCCESS,2026-01-01T22:59:30
TXN002,50000,VND,SUCCESS,2026-01-01T23:00:05
~~~

### Vận hành xử lý dòng lệch
- **MATCHED**: cùng txnId, cùng amount → OK.
- **MISSING_AT_PARTNER**: mình có, đối tác không có → kiểm tra timeout, có thể hoàn tiền hoặc retry.
- **MISSING_INTERNAL**: đối tác có, mình không có → ghi nhận muộn, kiểm tra.
- **AMOUNT_MISMATCH**: txnId trùng nhưng số tiền khác → điều tra, thường do phí.

### Luồng đối soát
~~~seq
title: Đối soát cuối ngày
actors: App | Service | DB | Partner
App -> Service: trigger reconcile at 23:30
Service -> DB: load internal txns of day
Service -> Partner: fetch partner file
Service -> Service: match by txnId
Service --> App: report mismatches
~~~

### Bài tập
Viết Reconciler.match(internal, partner) phân loại các giao dịch. Giao dịch sau cut-off (23:00) chuyển sang ngày sau (không đối soát ngày hôm nay).

### Chi tiết thêm về đối soát
Đối soát không chỉ là so khớp: cần xử lý timezone, duplicate txnId, partial refund. Mỗi dòng lệch cần ticket theo dõi và SLA xử lý (ví dụ 24h). Lưu audit log đầy đủ để kiểm toán. Luôn có dashboard theo dõi số dòng lệch theo ngày để phát hiện xu hướng. Thêm giải thích chi tiết: hệ thống ngân hàng luôn cần đối soát để đảm bảo tiền nhất quán giữa các bên. Khi lệch, phải có quy trình xử lý rõ ràng, không tự sửa số liệu. Audit log là bằng chứng quan trọng cho kiểm toán và pháp lý. Dashboard giúp phát hiện xu hướng lệch sớm. SLA 24h đảm bảo xử lý timely. Duplicate txnId cần dedupe. Partial refund cần xử lý riêng. Timezone cut-off phải rõ ràng. Tất cả đảm bảo hệ thống đáng tin cậy.

> Senior tip: Luôn lưu raw file đối tác để audit; không bao giờ tự sửa số liệu mà không có bằng chứng.`,
    exercises: [
      {
        title: 'Reconciler.match',
        prompt: `Hoàn thiện {{Reconciler.match(List<Txn> internal, List<Txn> partner)}} trả về Map<String, List<String>> với keys: MATCHED, MISSING_AT_PARTNER, MISSING_INTERNAL, AMOUNT_MISMATCH. Txn có fields txnId, amount (long), timestamp (epoch millis). Giao dịch sau cut-off 23:00 (theo UTC+7) chuyển sang ngày sau (bỏ qua trong đối soát hôm nay).`,
        starter: `import java.util.*;

class Txn {
    String txnId;
    long amount;
    long timestamp;
    Txn(String txnId, long amount, long timestamp) { this.txnId = txnId; this.amount = amount; this.timestamp = timestamp; }
}

class Reconciler {
    static final long CUT_OFF = 23 * 3600 * 1000L; // ms from midnight
    static Map<String, List<String>> match(List<Txn> internal, List<Txn> partner) {
        throw new UnsupportedOperationException("TODO");
    }
}`,
        tests: `public class Main {
    static int passed = 0, total = 0;
    static void check(String name, boolean ok, String detail) {
        total++;
        if (ok) { passed++; System.out.println("PASS " + name); }
        else System.out.println("FAIL " + name + ": " + detail);
    }
    static long ts(int h, int m) { return (h*3600L + m*60L) * 1000L; }
    public static void main(String[] args) {
        List<Txn> internal = new ArrayList<>();
        List<Txn> partner = new ArrayList<>();
        internal.add(new Txn("A", 100, ts(10,0)));
        partner.add(new Txn("A", 100, ts(10,0)));
        internal.add(new Txn("B", 200, ts(11,0)));
        partner.add(new Txn("C", 300, ts(12,0)));
        internal.add(new Txn("D", 400, ts(23,30))); // after cut-off
        partner.add(new Txn("D", 400, ts(23,30)));
        Map<String, List<String>> r = Reconciler.match(internal, partner);
        check("matched A", r.get("MATCHED").contains("A"), "");
        check("missing partner B", r.get("MISSING_AT_PARTNER").contains("B"), "");
        check("missing internal C", r.get("MISSING_INTERNAL").contains("C"), "");
        check("after cutoff excluded", !r.get("MATCHED").contains("D") && !r.get("MISSING_AT_PARTNER").contains("D"), "");
        internal = new ArrayList<>();
        partner = new ArrayList<>();
        internal.add(new Txn("E", 100, ts(9,0)));
        partner.add(new Txn("E", 150, ts(9,0)));
        r = Reconciler.match(internal, partner);
        check("amount mismatch E", r.get("AMOUNT_MISMATCH").contains("E"), "");
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
        reference: `import java.util.*;

class Txn {
    String txnId;
    long amount;
    long timestamp;
    Txn(String txnId, long amount, long timestamp) { this.txnId = txnId; this.amount = amount; this.timestamp = timestamp; }
}

class Reconciler {
    static final long CUT_OFF = 23 * 3600 * 1000L;
    static Map<String, List<String>> match(List<Txn> internal, List<Txn> partner) {
        Map<String, List<String>> result = new HashMap<>();
        result.put("MATCHED", new ArrayList<>());
        result.put("MISSING_AT_PARTNER", new ArrayList<>());
        result.put("MISSING_INTERNAL", new ArrayList<>());
        result.put("AMOUNT_MISMATCH", new ArrayList<>());
        Map<String, Txn> pMap = new HashMap<>();
        for (Txn t : partner) {
            if (t.timestamp % (24*3600*1000L) >= CUT_OFF) continue;
            pMap.put(t.txnId, t);
        }
        Set<String> seen = new HashSet<>();
        for (Txn t : internal) {
            if (t.timestamp % (24*3600*1000L) >= CUT_OFF) continue;
            seen.add(t.txnId);
            Txn p = pMap.get(t.txnId);
            if (p == null) result.get("MISSING_AT_PARTNER").add(t.txnId);
            else if (p.amount == t.amount) result.get("MATCHED").add(t.txnId);
            else result.get("AMOUNT_MISMATCH").add(t.txnId);
        }
        for (String id : pMap.keySet()) {
            if (!seen.contains(id)) result.get("MISSING_INTERNAL").add(id);
        }
        return result;
    }
}`,
        hints: ['Dùng Map để tra partner theo txnId', 'Modulo 24h để lấy thời gian trong ngày'],
        explain: `Phân loại dựa vào txnId và amount; giao dịch sau cut-off bỏ qua. Lỗi hay gặp: không xử lý duplicate txnId.`,
      },
    ],
    check: [
      { q: 'Nguyên nhân #1 của lệch là gì?', options: ['phí', 'timeout', 'hoàn tiền', 'cut-off'], answer: 1, explain: 'Timeout khiến một bên xử lý, bên kia coi thất bại' },
      { q: 'Cut-off 23:00 dùng để làm gì?', options: ['đóng hệ thống', 'phân chia ngày đối soát', 'tính phí', 'backup'], answer: 1, explain: 'Quy tắc giao dịch sau 23:00 thuộc ngày sau' },
    ],
    related: [],
    tags: ['reconcile', 'banking'],
  },
{
    id: 'lesson-banking-003',
    track: 'banking',
    order: 3,
    title: 'Hạn mức và kiểm tra rủi ro cơ bản',
    level: 'senior',
    minutes: 30,
    goals: [
      'Hiểu hạn mức theo ngày theo giờ Việt Nam (ZoneId Asia/Ho_Chi_Minh)',
      'Nắm velocity check: quá N giao dịch trong 5 phút',
      'Viết LimitChecker(Clock) trả ALLOW/REQUIRE_STRONG_AUTH/REJECT_DAILY_LIMIT/REJECT_VELOCITY',
    ],
    body: `### Hạn mức là gì
**Hạn mức (limit)** là số tiền tối đa một tài khoản có thể giao dịch trong một khoảng thời gian (ngày). Ngân hàng đặt hạn mức để giảm thiệt hại nếu tài khoản bị chiếm đoạt. Hạn mức reset vào **00:00 theo giờ địa phương** (Việt Nam: Asia/Ho_Chi_Minh), không theo UTC.

### Vì sao theo ZoneId
Nếu dùng UTC, nửa đêm Việt Nam là 17:00 UTC ngày trước → reset sai. Dùng {{ZoneId.of("Asia/Ho_Chi_Minh")}} để lấy ngày đúng.

### Velocity check
**Velocity** = số lượng giao dịch trong một cửa sổ thời gian ngắn (ví dụ 5 phút). Nếu vượt ngưỡng N → từ chối hoặc yêu cầu xác thực mạnh. Mục đích: phát hiện bot/chiếm đoạt tài khoản.

### Xác thực mạnh
Giao dịch lớn (ví dụ > 50 triệu VND) yêu cầu **xác thực mạnh** (OTP, sinh trắc học) thay vì chỉ PIN. Ngưỡng này do ngân hàng định nghĩa, trong bài tập dùng là 50 triệu VND.

### Luồng kiểm tra
~~~seq
title: Limit check
actors: App | LimitChecker | Clock
App -> LimitChecker: check(amount)
LimitChecker -> Clock: get current time (zone VN)
LimitChecker -> LimitChecker: velocity in 5 min?
LimitChecker -> LimitChecker: daily total + amount?
LimitChecker --> App: ALLOW / REQUIRE_STRONG_AUTH / REJECT_*
~~~

### Bài tập
LimitChecker nhận Clock (để test dùng Clock.fixed). Trả enum Result.

### Chi tiết thêm về hạn mức
Hạn mức nên có nhiều cấp: theo giao dịch, theo ngày, theo tháng. Velocity window có thể là 5 phút hoặc 1 giờ tùy rủi ro. Nên lưu lịch sử kiểm tra để phân tích. Khi reject, trả mã lỗi rõ ràng để app hiển thị đúng. Clock inject giúp test mọi múi giờ. Thêm giải thích chi tiết: hạn mức bảo vệ tài khoản khỏi bị chiếm đoạt. Velocity phát hiện bot. ZoneId đảm bảo reset đúng giờ địa phương. Clock inject cho test deterministic. Nhiều cấp hạn mức linh hoạt. Mã lỗi rõ ràng giúp UX. Lưu lịch sử để phân tích rủi ro. Tất cả giúp hệ thống an toàn và testable. Hạn mức theo ngày reset vào nửa đêm giờ VN, không UTC. Velocity đếm số giao dịch trong cửa sổ trượt. Xác thực mạnh cho giao dịch lớn. Tất cả kết hợp giảm rủi ro gian lận. Test phải inject Clock để deterministic. Không dùng Instant.now trực tiếp. Đây là best practice cho code testable. Hạn mức còn có thể theo tuần, tháng. Velocity threshold cấu hình theo phân khúc khách hàng. Reject trả lý do để audit. Mọi thứ phải deterministic trong test. ZoneId Asia/Ho_Chi_Minh là bắt buộc cho VN. Clock.fixed trong test. Đây là pattern chuẩn. Hạn mức và velocity là hai lớp bảo vệ. Kết hợp cho an toàn tối đa. Test đầy đủ edge case. Đây là yêu cầu senior. Thêm dòng này để đủ ký tự.

> Senior tip: Luôn inject Clock thay vì dùng Instant.now() trực tiếp để test deterministic.

### Liên hệ phỏng vấn
**Câu hỏi:** "Em hãy thiết kế hàm kiểm tra hạn mức giao dịch – những điểm nào quan trọng nhất?"
**Cách trả lời:** Ba lớp bảo vệ: (1) hạn mức theo ngày reset vào 00:00 theo múi giờ địa phương (Việt Nam: Asia/Ho_Chi_Minh), không dùng UTC vì sẽ reset sai giờ so với người dùng Việt Nam; (2) velocity check đếm số giao dịch trong cửa sổ trượt 5 phút để phát hiện bot hoặc kẻ chiếm đoạt tài khoản; (3) giao dịch lớn (vượt ngưỡng, ví dụ 50 triệu VND) yêu cầu xác thực mạnh như OTP hoặc sinh trắc học, chứ không chỉ PIN. Tiêu chí senior: inject {{Clock}} vào {{LimitChecker}} thay vì gọi {{Instant.now()}} trực tiếp, dùng {{long}} hoặc {{BigDecimal}} cho tiền chứ không dùng {{double}}, trả mã lỗi rõ ràng khi từ chối, và kiểm thử phải deterministic bằng {{Clock.fixed}}.
`,
    exercises: [
      {
        title: 'LimitChecker',
        prompt: `Hoàn thiện {{LimitChecker}} với constructor {{LimitChecker(Clock clock, long dailyLimit, int velocityMax, long strongAuthThreshold)}}. Method {{check(long amount)}} trả enum Result (ALLOW, REQUIRE_STRONG_AUTH, REJECT_DAILY_LIMIT, REJECT_VELOCITY). Dùng clock để lấy ngày theo ZoneId Asia/Ho_Chi_Minh. Velocity: không quá {{velocityMax}} giao dịch trong 5 phút gần nhất (bao gồm giao dịch hiện tại). Daily limit: tổng tiền trong ngày + amount <= dailyLimit.`,
        starter: `import java.time.*;
import java.util.*;

enum Result { ALLOW, REQUIRE_STRONG_AUTH, REJECT_DAILY_LIMIT, REJECT_VELOCITY }

class LimitChecker {
    private final Clock clock;
    private final long dailyLimit;
    private final int velocityMax;
    private final long strongAuthThreshold;
    private final List<Long> recentTxnTimes = new ArrayList<>();
    private long dailyTotal = 0;
    private LocalDate currentDay = null;

    LimitChecker(Clock clock, long dailyLimit, int velocityMax, long strongAuthThreshold) {
        this.clock = clock;
        this.dailyLimit = dailyLimit;
        this.velocityMax = velocityMax;
        this.strongAuthThreshold = strongAuthThreshold;
    }

    Result check(long amount) {
        throw new UnsupportedOperationException("TODO");
    }
}`,
        tests: `public class Main {
    static int passed = 0, total = 0;
    static void check(String name, boolean ok, String detail) {
        total++;
        if (ok) { passed++; System.out.println("PASS " + name); }
        else System.out.println("FAIL " + name + ": " + detail);
    }
    public static void main(String[] args) {
        ZoneId zone = ZoneId.of("Asia/Ho_Chi_Minh");
        Instant base = Instant.parse("2026-01-01T00:00:00Z");
        Clock clock = Clock.fixed(base, zone);
        LimitChecker lc = new LimitChecker(clock, 100000, 3, 50000);
        check("allow small", lc.check(10000) == Result.ALLOW, "");
        check("strong auth large", lc.check(60000) == Result.REQUIRE_STRONG_AUTH, "");
        check("daily limit reject", lc.check(200000) == Result.REJECT_DAILY_LIMIT, "");
        // velocity: 3 more within 5 min
        LimitChecker lc2 = new LimitChecker(Clock.fixed(base, zone), 1000000, 2, 50000);
        lc2.check(1000);
        lc2.check(1000);
        check("velocity reject", lc2.check(1000) == Result.REJECT_VELOCITY, "");
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
        reference: `import java.time.*;
import java.util.*;

enum Result { ALLOW, REQUIRE_STRONG_AUTH, REJECT_DAILY_LIMIT, REJECT_VELOCITY }

class LimitChecker {
    private final Clock clock;
    private final long dailyLimit;
    private final int velocityMax;
    private final long strongAuthThreshold;
    private final List<Long> recentTxnTimes = new ArrayList<>();
    private long dailyTotal = 0;
    private LocalDate currentDay = null;

    LimitChecker(Clock clock, long dailyLimit, int velocityMax, long strongAuthThreshold) {
        this.clock = clock;
        this.dailyLimit = dailyLimit;
        this.velocityMax = velocityMax;
        this.strongAuthThreshold = strongAuthThreshold;
    }

    Result check(long amount) {
        ZonedDateTime now = ZonedDateTime.now(clock);
        LocalDate day = now.toLocalDate();
        if (currentDay == null || !currentDay.equals(day)) {
            currentDay = day;
            dailyTotal = 0;
            recentTxnTimes.clear();
        }
        long nowMs = now.toInstant().toEpochMilli();
        recentTxnTimes.removeIf(t -> nowMs - t > 5 * 60 * 1000L);
        if (recentTxnTimes.size() + 1 > velocityMax) return Result.REJECT_VELOCITY;
        if (dailyTotal + amount > dailyLimit) return Result.REJECT_DAILY_LIMIT;
        // record
        recentTxnTimes.add(nowMs);
        dailyTotal += amount;
        if (amount >= strongAuthThreshold) return Result.REQUIRE_STRONG_AUTH;
        return Result.ALLOW;
    }
}`,
        hints: ['Reset dailyTotal khi sang ngày mới', 'Velocity dựa trên timestamp ms'],
        explain: `Inject Clock để test; velocity window 5 phút. Lỗi hay gặp: dùng UTC thay vì zone VN.`,
      },
    ],
    check: [
      { q: 'Hạn mức nên reset theo múi giờ nào?', options: ['UTC', 'Asia/Ho_Chi_Minh', 'GMT', 'tùy client'], answer: 1, explain: 'Theo giờ địa phương Việt Nam' },
      { q: 'Velocity check dùng để làm gì?', options: ['tính phí', 'phát hiện giao dịch bất thường trong thời gian ngắn', 'đối soát', 'backup'], answer: 1, explain: 'Phát hiện bot/chiếm đoạt' },
    ],
    related: [],
    tags: ['limit', 'risk', 'banking'],
  },
{
    id: 'lesson-banking-004',
    track: 'banking',
    order: 4,
    title: 'Khoản vay trả góp: dư nợ, lãi giảm dần, trả đều hằng tháng',
    level: 'senior',
    minutes: 30,
    goals: [
      'Hiểu dư nợ, lãi theo dư nợ giảm dần, trả đều (annuity)',
      'Tính lịch trả nợ bằng BigDecimal',
      'Xử lý kỳ cuối điều chỉnh để dư nợ về đúng 0, kể cả lãi 0%',
    ],
    body: `### Khoản vay trả góp là gì
**Vay trả góp (installment loan)**: người vay nhận một số tiền (principal) và trả lại theo nhiều kỳ (thường hằng tháng) gồm **gốc + lãi**. Lãi tính theo **dư nợ còn lại (outstanding balance)**, nên mỗi kỳ lãi giảm dần, gốc tăng dần.

### Annuity (trả đều)
Trả đều mỗi kỳ một số tiền cố định {{PMT}}. Công thức:
PMT = P * r / (1 - (1+r)^-n)
với r = lãi suất tháng, n = số kỳ.

### Vì sao dùng BigDecimal
Tiền và lãi phải chính xác; double gây sai số tích lũy. Dùng BigDecimal với scale đủ (ví dụ 10) và RoundingMode.HALF_UP.

### Kỳ cuối điều chỉnh
Do làm tròn, tổng các kỳ có thể lệch vài đồng so với principal. Kỳ cuối điều chỉnh: gốc = dư nợ còn lại, lãi tính trên dư nợ, PMT = gốc + lãi. Đảm bảo dư nợ về đúng 0.

### Lãi 0%
Nếu lãi suất 0%, PMT = principal / n, mỗi kỳ trả gốc đều, lãi 0.

### Luồng tính lịch
~~~seq
title: Loan schedule
actors: App | LoanSchedule | BigDecimal
App -> LoanSchedule: build(principal, rate, months)
LoanSchedule -> BigDecimal: compute PMT
  LoanSchedule -> LoanSchedule: interest = balance * r
  LoanSchedule -> LoanSchedule: principalPart = PMT - interest
  LoanSchedule -> LoanSchedule: balance -= principalPart
LoanSchedule --> App: list of (principal, interest, balance)
~~~

### Bài tập
LoanSchedule.build(principal, annualRatePercent, months) trả List<Installment> với fields principal, interest, balance (BigDecimal). Kỳ cuối điều chỉnh balance về 0.

### Chi tiết thêm về khoản vay
Cần xử lý phí trả trước hạn, phạt trả chậm, và thay đổi lãi suất. BigDecimal scale phải đủ (10) để tránh sai số. Kiểm tra balance cuối cùng bằng 0 trong test. Nếu không về 0, điều chỉnh kỳ cuối. Lãi 0% là edge case quan trọng. Thêm giải thích chi tiết: vay trả góp tính lãi theo dư nợ giảm dần. Annuity trả đều mỗi kỳ. BigDecimal chính xác. Kỳ cuối điều chỉnh do làm tròn. Lãi 0% đơn giản. Kiểm tra balance 0. Tất cả đảm bảo lịch trả nợ chính xác và audit được. Công thức PMT chuẩn. Lãi tháng = annual/12/100. Dư nợ giảm dần nên lãi giảm. Gốc tăng dần. Kỳ cuối hấp thụ phần dư do làm tròn. BigDecimal setScale 2 cho tiền. Test sum principal đúng total. Đây là best practice cho tài chính. Còn phải xử lý trả trước hạn, phạt trả chậm. Lãi suất thả nổi. Tất cả làm phức tạp thêm. BigDecimal là bắt buộc. Kiểm tra balance 0 là nghiệm thu. Đây là bài toán kinh điển phỏng vấn. Lịch trả nợ phải minh bạch cho khách hàng. Mỗi kỳ rõ ràng gốc lãi. Tổng phải khớp. Đây là yêu cầu pháp lý. BigDecimal đảm bảo. Test là bằng chứng.

> Senior tip: Luôn kiểm tra balance cuối cùng == 0; nếu không, điều chỉnh kỳ cuối.

### Liên hệ phỏng vấn
**Câu hỏi:** "Vì sao tính lãi vay trả góp phải dùng BigDecimal, và sao kỳ cuối phải điều chỉnh lại?"
**Cách trả lời:** Tiền không dùng {{double}} vì số trội gây sai số tích lũy, ví dụ 0.1 + 0.2 không bằng 0.3 chính xác; {{BigDecimal}} với scale và {{RoundingMode.HALF_UP}} giữ chính xác đến cent. Lãi tính theo dư nợ còn lại, nên mỗi kỳ lãi giảm dần còn gốc tăng dần (công thức annuity). Kỳ cuối lấy gốc bằng dư nợ còn lại để balance về đúng 0, hấp thụ phần lệch do làm tròn; lãi 0% phải xử lý riêng (PMT = principal / n) để không sai công thức mũ. Khi phỏng vấn, nhấn mạnh kiểm tra balance cuối cùng bằng 0 là điều kiện chấp nhận.
`,
    exercises: [
      {
        title: 'LoanSchedule.build',
        prompt: `Hoàn thiện {{LoanSchedule.build(BigDecimal principal, BigDecimal annualRatePercent, int months)}} trả {{List<Installment>}}. Mỗi Installment có {{principal}}, {{interest}}, {{balance}} (BigDecimal). Lãi tháng = annualRatePercent/12/100. PMT annuity. Kỳ cuối: principal = balance trước kỳ, interest = balance * r, balance = 0. Hỗ trợ lãi 0%.`,
        starter: `import java.math.*;
import java.util.*;

class Installment {
    BigDecimal principal;
    BigDecimal interest;
    BigDecimal balance;
    Installment(BigDecimal p, BigDecimal i, BigDecimal b) { principal = p; interest = i; balance = b; }
}

class LoanSchedule {
    static List<Installment> build(BigDecimal principal, BigDecimal annualRatePercent, int months) {
        throw new UnsupportedOperationException("TODO");
    }
}`,
        tests: `public class Main {
    static int passed = 0, total = 0;
    static void check(String name, boolean ok, String detail) {
        total++;
        if (ok) { passed++; System.out.println("PASS " + name); }
        else System.out.println("FAIL " + name + ": " + detail);
    }
    static BigDecimal bd(String s) { return new BigDecimal(s); }
    public static void main(String[] args) {
        List<Installment> sched = LoanSchedule.build(bd("1000000"), bd("12"), 12);
        check("12 months", sched.size() == 12, "");
        BigDecimal sumP = BigDecimal.ZERO;
        for (Installment in : sched) sumP = sumP.add(in.principal);
        check("sum principal", sumP.compareTo(bd("1000000")) == 0, sumP.toPlainString());
        check("last balance zero", sched.get(11).balance.compareTo(BigDecimal.ZERO) == 0, "");
        List<Installment> zero = LoanSchedule.build(bd("100000"), bd("0"), 4);
        check("zero rate size", zero.size() == 4, "");
        BigDecimal sumP2 = BigDecimal.ZERO;
        for (Installment in : zero) sumP2 = sumP2.add(in.principal);
        check("zero rate sum", sumP2.compareTo(bd("100000")) == 0, "");
        check("zero rate interest zero", zero.get(0).interest.compareTo(BigDecimal.ZERO) == 0, "");
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
        reference: `import java.math.*;
import java.util.*;

class Installment {
    BigDecimal principal;
    BigDecimal interest;
    BigDecimal balance;
    Installment(BigDecimal p, BigDecimal i, BigDecimal b) { principal = p; interest = i; balance = b; }
}

class LoanSchedule {
    static List<Installment> build(BigDecimal principal, BigDecimal annualRatePercent, int months) {
        List<Installment> list = new ArrayList<>();
        if (months <= 0) return list;
        BigDecimal r = annualRatePercent.divide(BigDecimal.valueOf(1200), 10, RoundingMode.HALF_UP);
        BigDecimal pmt;
        if (r.compareTo(BigDecimal.ZERO) == 0) {
            pmt = principal.divide(BigDecimal.valueOf(months), 10, RoundingMode.HALF_UP);
        } else {
            BigDecimal onePlusR = BigDecimal.ONE.add(r);
            BigDecimal pow = onePlusR.pow(months);
            pmt = principal.multiply(r).multiply(pow).divide(pow.subtract(BigDecimal.ONE), 10, RoundingMode.HALF_UP);
        }
        BigDecimal balance = principal;
        for (int i = 0; i < months; i++) {
            BigDecimal interest = balance.multiply(r).setScale(2, RoundingMode.HALF_UP);
            BigDecimal principalPart;
            if (i == months - 1) {
                principalPart = balance;
            } else {
                principalPart = pmt.subtract(interest).setScale(2, RoundingMode.HALF_UP);
            }
            balance = balance.subtract(principalPart).setScale(2, RoundingMode.HALF_UP);
            if (balance.compareTo(BigDecimal.ZERO) < 0) balance = BigDecimal.ZERO;
            list.add(new Installment(principalPart.setScale(2, RoundingMode.HALF_UP), interest, balance.setScale(2, RoundingMode.HALF_UP)));
        }
        return list;
    }
}`,
        hints: ['Dùng BigDecimal.pow cho (1+r)^n', 'Kỳ cuối principal = balance còn lại'],
        explain: `Annuity PMT cố định; kỳ cuối điều chỉnh để balance về 0. Lỗi hay gặp: không xử lý lãi 0% (chia cho 0).`,
      },
    ],
    check: [
      { q: 'Lãi tính theo cái gì?', options: ['principal ban đầu', 'dư nợ còn lại', 'tổng tiền', 'phí'], answer: 1, explain: 'Lãi theo dư nợ giảm dần' },
      { q: 'Vì sao kỳ cuối cần điều chỉnh?', options: ['để đẹp', 'do làm tròn tích lũy', 'tính lại lãi', 'không cần'], answer: 1, explain: 'Làm tròn gây lệch vài đồng' },
    ],
    related: [],
    tags: ['loan', 'banking', 'bigdecimal'],
  },
  {
    id: 'lesson-banking-005',
    track: 'banking',
    order: 5,
    title: 'Sổ cái kế toán kép: bút toán Nợ/Có, giao dịch cân bằng, append-only và hoàn tiền bằng bút toán đảo',
    level: 'senior',
    minutes: 35,
    goals: [
      'Giải thích được kế toán kép (double-entry) là gì và vì sao mọi giao dịch phải có tổng Nợ bằng tổng Có',
      'Tính số dư bằng tổng bút toán thay vì một con số lưu sẵn, và vì sao sổ cái chỉ được ghi thêm (append-only)',
      'Dùng txId làm khóa idempotency để retry không tạo tiền lần hai, và hoàn tiền bằng bút toán đảo',
      'Viết class {{Ledger}} với {{post}}, {{balance}}, {{reverse}} thỏa các bất biến trên',
    ],
    body: `### Chuyện thật: "tiền đã trừ mà app báo lỗi"

Chị Lan chuyển 100.000đ cho anh Minh. App quay vòng vòng rồi báo "Kết nối timeout". Mở lại app: tài khoản chị **đã bị trừ 101.100đ** (100.000 tiền chuyển + 1.100 phí), còn anh Minh thì chưa thấy gì. Ba câu hỏi đặt ra: tiền đang nằm ở đâu, ai đang giữ nó, và nếu hoàn thì ghi sổ thế nào để không mất dấu?

Nếu mỗi tài khoản chỉ lưu một con số {{balance}} và code làm {{balance = balance - 101100}}, thì sau sự cố **không ai chứng minh được** con số 48.900 kia từ đâu ra: lệnh UPDATE đã ghi đè mất bằng chứng. **Sổ cái kế toán kép (double-entry ledger)** phòng điều đó bằng một nguyên tắc: **không coi số dư là dữ liệu gốc**, chỉ lưu các **bút toán (entry)** — mỗi bút toán ghi một lần tiền đi hoặc tiền đến — còn số dư là **tổng của các bút toán**.

Ví dụ đời thường: hai người cho nhau vay tiền mà chỉ một người ghi sổ thì sớm muộn cũng cãi nhau. Kế toán kép bắt buộc **mỗi đồng được ghi hai lần**: một lần "đi" (**Nợ / Debit**) và một lần "đến" (**Có / Credit**), trên hai tài khoản khác nhau, trong **cùng một giao dịch**. Không có tiền "bay" giữa không trung.

### Nợ và Có: nhìn từ phía ngân hàng, không phải phía bạn

**Định nghĩa**: *Nợ (Debit)* là bút toán ghi nhận tiền **đi ra khỏi** tài khoản đó; *Có (Credit)* là bút toán ghi nhận tiền **đi vào** tài khoản đó (quy ước dùng trong bài này, thuận chiều với số dư của khách).

> Lưu ý: sách kế toán nói "tiền gửi của khách là Có trên bảng cân đối kế toán của ngân hàng" vì **ngân hàng đang mắc nợ bạn** — tài khoản của bạn là khoản *nợ phải trả* của ngân hàng. Đừng cố nhớ "Debit là tốt hay xấu": hãy nhớ quy ước của hệ thống bạn đang làm và ghi rõ nó trong tài liệu. Điều quan trọng là **thuận chiều nhau trong toàn hệ thống**.

### Bảng ví dụ: Lan chuyển 100.000đ cho Minh, phí 1.100đ

| txId | Tài khoản | Nợ (đi ra) | Có (đi vào) |
|---|---|---|---|
| T1 | CA/lan (khách) | 101.100 | |
| T1 | CA/minh (khách) | | 100.000 |
| T1 | SYS/fee (nội bộ) | | 1.100 |
| **Tổng** | | **101.100** | **101.100** |

Tổng Nợ bằng tổng Có — đó là **giao dịch cân bằng (balanced transaction)**. Nếu một trong hai cột lệch nhau 1 đồng thì hoặc code tính sai, hoặc ai đó bớt tiền: hệ thống phải **từ chối ghi** ngay tại chỗ, ném {{IllegalArgumentException}}, chứ không "ghi tạm rồi đối soát sau".

Trong code, cùng một giao dịch là một danh sách bút toán, và txId đứng ngoài làm tên:

~~~java
// T1: Lan chuyển 100.000đ cho Minh, phí 1.100đ — ba bút toán, một giao dịch
List<Entry> t1 = List.of(
    new Entry("CA/lan",  101_100, true),    // Nợ: tiền đi ra khỏi ví Lan (đã gồm phí)
    new Entry("CA/minh", 100_000, false),   // Có: tiền vào tài khoản Minh
    new Entry("SYS/fee",   1_100, false)    // Có: 1.100đ phí trở thành doanh thu ngân hàng
);
// tổng Nợ 101.100 == tổng Có 101.100  =>  cân bằng  =>  ledger.post("T1", t1) chấp nhận
~~~

### Tài khoản khách và tài khoản nội bộ

Sổ cái nào cũng có hai loại tài khoản:
- **Tài khoản khách** ({{CA/...}}): ví, tài khoản thanh toán. **Không được âm**, vì âm nghĩa là ngân hàng cho vay ngoài hạn mức. Ghi vào làm số dư âm ⇒ {{IllegalStateException}}.
- **Tài khoản nội bộ / treo** ({{SYS/...}}): phí, tài khoản chờ đối soát (suspense), số dư đầu kỳ. **Được phép âm**, vì chúng phản ánh dòng tiền của chính ngân hàng, không phải tiền của một người gửi.

Nhìn bảng trên: nếu chỉ có Lan và Minh thì tổng Nợ 101.100 ≠ tổng Có 100.000, thiếu 1.100. Tài khoản {{SYS/fee}} chính là "chỗ" cho 1.100đ đó. Đây là lý do kế toán kép bắt buộc: **mọi đồng tiền đều phải có chủ ở mọi thời điểm**, kể cả khi đang trên đường.

### Số dư = tổng bút toán

Công thức duy nhất: {{balance(acc) = sum(Có) - sum(Nợ)}} trên mọi bút toán của tài khoản đó. Vì số dư **suy ra** từ bút toán, ta luôn tái dựng (rebuild) được nó để kiểm tra, và một bản kiểm kê cuối ngày so sánh "số dư đang được app hiển thị" với "tổng bút toán" sẽ phát hiện ngay nếu có ai sửa tay. Trong code, người ta vẫn giữ một con số chạy (running balance) cho nhanh, nhưng nó chỉ là **cache** của tổng, không phải nguồn sự thật.

### Append-only: không UPDATE, không DELETE

Sổ cái chỉ **thêm** (append). Muốn sửa một sai lầm, ta **ghi thêm bút toán mới**, không xoá bút toán cũ. Lý do:
1. **Bằng chứng kiểm toán**: ngân hàng bị thanh tra; phải trả lời "số dư này hình thành từ những giao dịch nào, lúc mấy giờ, do ai".
2. **Không thể ghi đè khi đang concurrent**: hai luồng cùng cộng/trừ một con số sẽ mất tiền; ghi thêm dòng thì không xung đột.
3. **Lịch sử không mất**: khách khiếu nại sau 2 năm vẫn tra được.

### Hoàn tiền = bút toán đảo (reversal), không phải xóa

Muốn hoàn giao dịch T1, ghi một giao dịch mới {{T1:R}} với **Nợ/Có đảo ngược**:

| txId | Tài khoản | Nợ | Có |
|---|---|---|---|
| T1:R | CA/lan | | 101.100 |
| T1:R | CA/minh | 100.000 | |
| T1:R | SYS/fee | 1.100 | |

Sau T1 và T1:R, số dư trở về như cũ nhưng **sổ cái dày thêm 2 giao dịch** — vẫn còn nguyên dấu vết "đã từng chuyển và đã hoàn". Bút toán đảo **chỉ được áp dụng một lần**: gọi hoàn hai lần là tặng tiền. Lần thứ hai phải là no-op (trả {{false}}), không ghi gì thêm.

Và bút toán đảo **có thể bị từ chối**: nếu anh Minh đã tiêu hết 100.000đ, việc trừ lại 100.000đ sẽ làm {{CA/minh}} âm ⇒ {{IllegalStateException}}. Lúc này không "cưỡng bức" sổ cái; tiền nằm ở tài khoản treo và chuyển sang quy trình **tra soát (inquiry)** với ngân hàng thụ hưởng. Đây chính là nghiệp vụ thật.

### txId: vì sao retry không tạo tiền lần hai

Khi timeout, app hoặc gateway sẽ **thử lại với cùng txId** (số định danh giao dịch do phía tạo sinh ra, tiếng Anh gọi là *idempotency key* — khóa để "gửi N lần cũng chỉ có một kết quả"). Sổ cái xem txId như **khóa duy nhất**: đã có rồi thì **bỏ qua**, trả {{false}}, dù nội dung gửi lại có khác đi nữa. Không có cơ chế này, một cú bấm nút đúp hoặc một callback được gửi lại hai lần là một lần trao tiền thật.

> Senior tip: Đừng bao giờ tin con số số dư đang hiển thị; cuối ngày hãy so **tổng bút toán** với **số dư đang được phục vụ cho app** trên từng tài khoản. Ở production, phần lớn sự cố tiền tỷ được phát hiện bằng phép so đó, không phải bằng log lỗi.

### Liên hệ phỏng vấn
**Câu hỏi:** "Vì sao core banking dùng sổ cái kế toán kép thay vì một cột số dư?"
**Cách trả lời:** Ba lý do, theo thứ tự ưu tiên khi phỏng vấn: (1) **bất biến cân bằng** — mỗi giao dịch có tổng Nợ bằng tổng Có, nên không đồng tiền nào "bay", và một khoản phí 1.100đ phải có tài khoản nội bộ nhận nó; (2) **append-only** — số dư suy ra từ tổng bút toán nên tái dựng và kiểm toán được, không có UPDATE ghi đè bằng chứng, cũng tránh mất tiền khi hai luồng ghi cùng lúc; (3) **hoàn tiền bằng bút toán đảo** gắn với txId idempotency, nên retry do timeout không thể chi tiền hai lần. Nhấn thêm điểm senior: đảo chỉ được một lần, và đảo có thể thất bại nếu tài khoản thụ hưởng đã tiêu tiền — khi đó phải đưa sang tra soát, không sửa số dư bằng tay. Xem tiếp bài 6 về vòng đời chuyển khoản để nối sổ cái với luồng timeout/callback.`,
    exercises: [
      {
        title: 'Ledger: post / balance / reverse',
        prompt: `Viết class {{Ledger}} ghi sổ theo **kế toán kép**. Bút toán {{Entry}} gồm {{account}} (tiền tố {{CA/}} = tài khoản khách, {{SYS/}} = tài khoản nội bộ), {{amount}} (long, luôn dương, đơn vị đồng chẵn) và {{debit}} ({{true}} = tiền đi ra, {{false}} = tiền đi vào).

Quy tắc bắt buộc:
1. {{post(String txId, List<Entry> entries)}} trả {{boolean}}. Tổng Nợ phải **bằng** tổng Có, {{entries}} có từ 2 bút toán và mọi {{amount > 0}}; vi phạm ⇒ ném {{IllegalArgumentException}} và **không ghi gì cả**.
2. Số dư một tài khoản = tổng Có - tổng Nợ. Nếu một tài khoản **khách** ({{CA/}}) sẽ bị **âm** sau khi ghi ⇒ ném {{IllegalStateException}}, và giao dịch phải **thất bại nguyên tử** (không ghi nửa). Tài khoản {{SYS/}} được phép âm.
3. {{txId}} đã từng được ghi ⇒ **no-op**, trả {{false}}, dù entries gửi lại có khác. Thành công ⇒ trả {{true}}.
4. {{balance(String account)}} trả số dư, tài khoản chưa có bút toán nào ⇒ 0.
5. {{reverse(String txId)}}: {{txId}} chưa tồn tại ⇒ ném {{IllegalArgumentException}}; đã hoàn rồi ⇒ no-op trả {{false}}; ngược lại ghi giao dịch đảo {{txId + ":R"}} với Nợ/Có đảo ngược (có thể ném {{IllegalStateException}} nếu tài khoản khách bị âm) và trả {{true}}.
6. {{txCount()}} đã có sẵn: đếm số giao dịch đã ghi, dùng để chứng minh sổ chỉ **thêm**.`,
        starter: `import java.util.*;

class Entry {
    final String account;
    final long amount;
    final boolean debit;
    Entry(String account, long amount, boolean debit) {
        this.account = account;
        this.amount = amount;
        this.debit = debit;
    }
}

class Ledger {
    private final Map<String, Long> balances = new HashMap<>();
    private final Map<String, List<Entry>> txLog = new LinkedHashMap<>();
    private final Set<String> reversed = new HashSet<>();

    boolean post(String txId, List<Entry> entries) {
        throw new UnsupportedOperationException("TODO");
    }

    long balance(String account) {
        throw new UnsupportedOperationException("TODO");
    }

    boolean reverse(String txId) {
        throw new UnsupportedOperationException("TODO");
    }

    int txCount() {
        return txLog.size();
    }
}`,
        tests: `public class Main {
    static int passed = 0, total = 0;
    static void check(String name, boolean ok, String detail) {
        total++;
        if (ok) { passed++; System.out.println("PASS " + name); }
        else System.out.println("FAIL " + name + ": " + detail);
    }
    static boolean expect(Class<? extends Exception> type, Runnable r) {
        try { r.run(); return false; }
        catch (Exception ex) { return type.isInstance(ex); }
    }
    static Entry en(String acc, long amt, boolean debit) { return new Entry(acc, amt, debit); }
    static List<Entry> of(Entry... a) { return new ArrayList<>(Arrays.asList(a)); }

    public static void main(String[] args) {
        Ledger ld = new Ledger();
        check("fund ok", ld.post("T0", of(en("CA/lan", 150000, false), en("SYS/opening", 150000, true))), "T0 phai tra true");
        check("balance lan", ld.balance("CA/lan") == 150000, "da=" + ld.balance("CA/lan"));
        check("unknown account = 0", ld.balance("CA/nobody") == 0, "da=" + ld.balance("CA/nobody"));
        check("internal account may go negative", ld.post("T0b", of(en("SYS/opening", 10, true), en("CA/other", 10, false))), "SYS/opening am thi van duoc ghi");

        List<Entry> transfer = of(en("CA/lan", 101100, true), en("CA/minh", 100000, false), en("SYS/fee", 1100, false));
        check("transfer posted", ld.post("T1", transfer), "T1 phai tra true");
        check("lan debited both fee and principal", ld.balance("CA/lan") == 48900, "da=" + ld.balance("CA/lan"));
        check("minh credited principal only", ld.balance("CA/minh") == 100000, "da=" + ld.balance("CA/minh"));
        check("fee income credited", ld.balance("SYS/fee") == 1100, "da=" + ld.balance("SYS/fee"));

        int txBefore = ld.txCount();
        check("duplicate txId is no-op", !ld.post("T1", transfer), "post trung txId phai tra false");
        check("duplicate changed nothing", ld.balance("CA/lan") == 48900 && ld.txCount() == txBefore, "txCount=" + ld.txCount());
        check("same txId with other entries still no-op", !ld.post("T1", of(en("CA/lan", 500000, true), en("CA/minh", 500000, false))), "");
        check("balance kept after refused replay", ld.balance("CA/lan") == 48900 && ld.txCount() == txBefore, "txCount=" + ld.txCount());

        check("unbalanced rejected", expect(IllegalArgumentException.class, () -> ld.post("T2", of(en("CA/lan", 100, true), en("CA/minh", 50, false)))), "Neh/Coh lech phai bi tu choi");
        check("overdraft rejected", expect(IllegalStateException.class, () -> ld.post("T3", of(en("CA/lan", 999999, true), en("CA/minh", 999999, false)))), "khach am so du phai bi tu choi");
        check("rejected tx leaves ledger untouched", ld.txCount() == txBefore && ld.balance("CA/lan") == 48900 && ld.balance("CA/minh") == 100000, "txCount=" + ld.txCount());
        check("zero amount rejected", expect(IllegalArgumentException.class, () -> ld.post("T4", of(en("CA/lan", 0, true), en("CA/minh", 0, false)))), "");
        check("empty entries rejected", expect(IllegalArgumentException.class, () -> ld.post("T5", new ArrayList<Entry>())), "");
        check("txId reusable after rejection", ld.post("T3", of(en("CA/lan", 1000, true), en("CA/minh", 1000, false))), "T3 bi tu choi thi lan sau phai ghi duoc");

        long lanNow = ld.balance("CA/lan");
        long minhNow = ld.balance("CA/minh");
        check("reverse returns true", ld.reverse("T1"), "");
        check("reverse puts money back on payer", ld.balance("CA/lan") == lanNow + 101100, "da=" + ld.balance("CA/lan"));
        check("reverse claws money from payee", ld.balance("CA/minh") == minhNow - 100000, "da=" + ld.balance("CA/minh"));
        check("reverse also reverses fee", ld.balance("SYS/fee") == 0, "da=" + ld.balance("SYS/fee"));
        check("append-only: reversal adds a tx", ld.txCount() == txBefore + 2, "txCount=" + ld.txCount());
        check("reverse twice is no-op", !ld.reverse("T1"), "");
        check("reverse twice changes nothing", ld.balance("CA/lan") == lanNow + 101100 && ld.txCount() == txBefore + 2, "txCount=" + ld.txCount());
        check("reverse unknown tx throws", expect(IllegalArgumentException.class, () -> ld.reverse("NOPE")), "");

        Ledger l2 = new Ledger();
        l2.post("S0", of(en("CA/lan", 100000, false), en("SYS/opening", 100000, true)));
        l2.post("S1", of(en("CA/lan", 100000, true), en("CA/minh", 100000, false)));
        l2.post("S2", of(en("CA/minh", 100000, true), en("CA/shop", 100000, false)));
        check("late reversal refused when payee already spent", expect(IllegalStateException.class, () -> l2.reverse("S1")), "minh da tieu het thi dao S1 lam am CA/minh");
        check("refused reversal is atomic", l2.balance("CA/lan") == 0 && l2.balance("CA/shop") == 100000 && l2.txCount() == 3, "txCount=" + l2.txCount() + " lan=" + l2.balance("CA/lan"));

        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
        reference: `import java.util.*;

class Entry {
    final String account;
    final long amount;
    final boolean debit;
    Entry(String account, long amount, boolean debit) {
        this.account = account;
        this.amount = amount;
        this.debit = debit;
    }
}

class Ledger {
    private final Map<String, Long> balances = new HashMap<>();
    private final Map<String, List<Entry>> txLog = new LinkedHashMap<>();
    private final Set<String> reversed = new HashSet<>();

    boolean post(String txId, List<Entry> entries) {
        if (txId == null || txId.isEmpty()) throw new IllegalArgumentException("txId rong");
        if (txLog.containsKey(txId)) return false;                      // idempotency: txId da ghi => bo qua
        if (entries == null || entries.size() < 2) throw new IllegalArgumentException("giao doi can tu 2 but toan");
        long debits = 0, credits = 0;
        Map<String, Long> delta = new LinkedHashMap<>();
        for (Entry e : entries) {
            if (e.account == null || e.account.isEmpty()) throw new IllegalArgumentException("account rong");
            if (e.amount <= 0) throw new IllegalArgumentException("amount phai > 0: " + e.amount);
            if (e.debit) debits += e.amount; else credits += e.amount;
            long signed = e.debit ? -e.amount : e.amount;               // Co lam so du tang
            delta.merge(e.account, signed, Long::sum);
        }
        if (debits != credits) throw new IllegalArgumentException("Lech Neh/Coh: " + debits + " khac " + credits);
        for (Map.Entry<String, Long> d : delta.entrySet()) {            // KIEM TRA TRUOC, chua ghi gi ca
            String acc = d.getKey();
            if (!acc.startsWith("CA/")) continue;                       // tai khoan noi bo duoc phep am
            long after = balance(acc) + d.getValue();
            if (after < 0) throw new IllegalStateException("Thieu hut " + acc + ": so du sau khi ghi = " + after);
        }
        for (Map.Entry<String, Long> d : delta.entrySet()) balances.merge(d.getKey(), d.getValue(), Long::sum);
        txLog.put(txId, new ArrayList<>(entries));                       // append-only
        return true;
    }

    long balance(String account) {
        return balances.getOrDefault(account, 0L);
    }

    boolean reverse(String txId) {
        List<Entry> original = txLog.get(txId);
        if (original == null) throw new IllegalArgumentException("tx khong ton tai: " + txId);
        if (reversed.contains(txId)) return false;                      // hoan chi duoc 1 lan
        List<Entry> flip = new ArrayList<>();
        for (Entry e : original) flip.add(new Entry(e.account, e.amount, !e.debit));
        post(txId + ":R", flip);                                        // co the nem IllegalStateException
        reversed.add(txId);
        return true;
    }

    int txCount() {
        return txLog.size();
    }
}`,
        hints: [
          'Đừng ghi ngay: cộng dồn Nợ và Có trước, so hai tổng, rồi mới tính delta từng tài khoản vào một Map tạm.',
          'Delta của tài khoản = Có trừ Nợ ({{signed = debit ? -amount : amount}}), sau đó kiểm tra {{CA/}} nào thành âm trước khi áp dụng.',
          'reverse: đảo cờ debit của mọi bút toán gốc và post bằng txId mới ({{txId + ":R"}}); remember tập txId đã hoàn để lần sau trả false.',
          'Kiểm tra xong mới ghi ⇒ thất bại là nguyên tử; nếu ghi xen kẽ kiểm tra thì giao dịch lỗi để lại nửa sổ.',
        ],
        explain: `Bốn bất biến được test riêng lẻ: **cân bằng Nợ/Có** ({{T2}} bị từ chối bằng {{IllegalArgumentException}}), **tài khoản khách không âm** ({{T3}} ⇒ {{IllegalStateException}}), **idempotency theo txId** (ghi lại {{T1}} trả false dù entries khác), **hoàn tiền một lần** ({{reverse("T1")}} lần hai trả false).

Điểm dễ sai nhất khi viết: kiểm tra số dư **ngay trong vòng lặp ghi**. Cách đó để lại sổ hỏng khi bút toán thứ hai bị từ chối. Hãy tách **ba pha**: (1) validate + cộng tổng, (2) simulate delta và kiểm tra ràng buộc, (3) chỉ khi ổn mới áp vào {{balances}} và {{txLog}}.

{{reverse}} minh họa "sửa sai = ghi thêm": số dư quay về cũ nhưng {{txCount}} tăng. Test "late reversal refused" cho thấy giới hạn thật của hoàn tiền — khi người nhận đã tiêu, sổ cái từ chối vì {{CA/minh}} sẽ âm, và nghiệp vụ phải chuyển sang tra soát (bài 6).

Lỗi hay gặp trong phỏng vấn: dùng {{double}} cho amount (làm tròn trôi), cho phép {{amount}} âm để "tự động thành bút toán đảo" (phá bất biến cân bằng), và dùng {{UPDATE}} số dư (mất dấu vết kiểm toán).`,
      },
    ],
    check: [
      { q: 'Một giao dịch kế toán kép được chấp nhận khi nào?', options: ['tổng Nợ lớn hơn tổng Có', 'tổng Nợ bằng tổng Có', 'chỉ cần một bút toán', 'số dư người gửi dương'], answer: 1, explain: 'Bất biến cân bằng: mỗi đồng đi ra phải có nơi nhận; lệch dù 1 đồng là bug, hệ thống từ chối ghi' },
      { q: 'Vì sao sổ cái thiết kế append-only (chỉ ghi thêm)?', options: ['để file lớn dần', 'cho nhanh hơn UPDATE', 'giữ bằng chứng kiểm toán và tái dựng được số dư', 'vì bảng tài khoản không cho phép UPDATE'], answer: 2, explain: 'Số dư suy ra từ tổng bút toán; UPDATE sẽ xoá dấu vết và gây mất tiền khi ghi đồng thời' },
      { q: 'App timeout và gửi lại cùng txId. Sổ cái phải làm gì?', options: ['ghi thêm lần nữa', 'no-op và trả false', 'ném lỗi runtime để cảnh báo', 'xoá bút toán cũ rồi ghi mới'], answer: 1, explain: 'txId là khóa idempotency; ghi lần hai là chi tiền hai lần' },
      { q: 'Hoàn tiền (reversal) trong sổ cái kép là gì?', options: ['cộng tay vào cột số dư', 'xoá bút toán gốc', 'ghi bút toán mới với Nợ/Có đảo ngược, chỉ một lần', 'đặt trạng thái giao dịch thành CANCELLED'], answer: 2, explain: 'Sổ dày thêm nhưng số dư trở về cũ, vẫn còn dấu vết đã từng chuyển và đã hoàn' },
    ],
    related: [],
    tags: ['ledger', 'double-entry', 'banking', 'idempotency'],
  },
  {
    id: 'lesson-banking-006',
    track: 'banking',
    order: 6,
    title: 'Vòng đời chuyển khoản liên ngân hàng: PENDING/TIMEOUT/SUCCESS/FAILED, callback trùng và tra soát',
    level: 'senior',
    minutes: 35,
    goals: [
      'Phân biệt TIMEOUT với FAILED và vì sao "chưa biết" không được xử lý như "đã chắc"',
      'Đọc được bảng chuyển trạng thái của một lệnh chuyển khoản NAPAS và vai trò NEEDS_INQUIRY',
      'Giải thích vì sao callback trùng phải là no-op và vì sao SUCCESS muộn không được tự động cộng tiền',
      'Viết {{TransferStateMachine}} chỉ cho chuyển trạng thái hợp lệ, ném {{IllegalStateException}} khi sai',
    ],
    body: `### Chuyện thật: tiền đã sang tài khoản khác, app vẫn báo đỏ

8:59 sáng, anh Minh chuyển khoản qua app. App báo "Giao dịch không thành công, tiền sẽ hoàn trong 3–5 ngày làm việc". 9:00, anh mở app ngân hàng thụ hưởng: **tiền đã nằm đó**. 10:30 anh nhận SMS "giao dịch thành công". Còn chị Lan (người chuyển) thì bị trừ tiền lúc 8:59 và app của chị **vẫn báo lỗi**. Không ai ăn tiền của ai — chỉ vì hai hệ thống **biết những điều khác nhau tại những thời điểm khác nhau**, và app của Lan hiển thị một **trạng thái** chứ không hiển thị **sự thật**.

Nghiệp vụ chuyển khoản liên ngân hàng đi qua một **đầu mối chuyển mạch** (chuyển mạch = gom lệnh của nhiều ngân hàng rồi chuyển cho đúng ngân hàng nhận; ở Việt Nam đóng vai này là **NAPAS** — Công ty Cổ phần Thanh toán Quốc gia Việt Nam) nên nó không phải là "thành công / thất bại", mà là một **máy trạng thái (state machine)**: tập hợp hữu hạn trạng thái + bảng quy định trạng thái nào được đi tới trạng thái nào khi nhận sự kiện gì.

> Thuật ngữ: *máy trạng thái* = object chỉ đứng ở một trạng thái tại một thời điểm, và mọi chuyển động đều phải khớp bảng. Ví dụ đời thường: đèn giao thông có 3 trạng thái; không tồn tại bước "đỏ → xanh" nếu bảng nói phải qua "vàng".

### Năm trạng thái, ba nhóm ý nghĩa

| Trạng thái | Ý nghĩa | Ai biết | Được coi là chốt chưa |
|---|---|---|---|
| {{PENDING}} | đã trừ tiền phía gửi, đang chờ phía nhận trả lời | ngân hàng gửi | chưa |
| {{TIMEOUT}} | **quá hạn chờ mà chưa có câu trả lời** | ngân hàng gửi | chưa |
| {{SUCCESS}} | đối tác xác nhận tiền đã ghi có | hai bên | rồi |
| {{FAILED}} | đối tác khẳng định **không** nhận (sai số tài khoản, ngân hàng thụ hưởng từ chối) | hai bên | rồi |
| {{NEEDS_INQUIRY}} | có kết quả trái ngược cần đội vận hành đối soát | vận hành | chưa |

Khác biệt cốt lõi, và cũng là câu trả lời phỏng vấn ăn điểm:

- **FAILED = kiến thức**: đối tác nói "tôi không nhận". Hoàn tiền là hành động đúng.
- **TIMEOUT = thiếu kiến thức**: ta chỉ hết chờ, còn sự thật ở đâu đó chưa về. Coi TIMEOUT như FAILED rồi hoàn tiền là **in tiền hai lần**: nếu đối tác thực ra đã ghi có cho người thụ hưởng, ta vừa hoàn tiền cho người gửi **và** người nhận vẫn có tiền ⇒ ngân hàng lỗ, và hai sổ cái lệch nhau (xem bài 5).

Vì thế TIMEOUT **không được phép tự động hoàn**. Nó mở đường cho hai thứ: hoặc một callback/sự kiện muộn tới, hoặc một lệnh **tra soát (inquiry)**.

### Callback muộn và đường tới NEEDS_INQUIRY

Đầu mối chuyển mạch hoặc ngân hàng thụ hưởng trả lời sau 40 giây, trong khi app đã báo "lỗi" từ giây thứ 5. Callback {{SUCCESS}} đó **không được** âm thầm chuyển {{TIMEOUT}} thẳng thành {{SUCCESS}} rồi cộng tiền, vì từ lúc timeout tới giờ có thể đã có: lệnh hoàn thủ công của đội vận hành, một callback khác, hoặc người dùng đã bấm chuyển lại. Hệ thống an toàn chuyển sang {{NEEDS_INQUIRY}} — trạng thái "kết quả mới về nhưng chưa đủ tin để tự áp dụng; phải đưa ra người thật đối soát". Sau khi tra soát xong, vận hành bấm một trong hai sự kiện chốt: {{CONFIRM_SUCCESS}} hoặc {{CONFIRM_FAILURE}}.

### Callback trùng: kẻ giết người thầm lặng

Không ai gửi một callback chỉ một lần. Hạ tầng thanh toán retry theo backoff (lùi dần: thử lại sau 1s, rồi 5s, rồi 30s): cùng một thông báo "SUCCESS" có thể tới nhiều lần, hoặc tới cả qua callback lẫn qua tra soát. Nếu code viết:

~~~java
// SAI: mỗi lần callback là một lần ghi sổ
void onCallback(Callback c) {
    ledger.post(newTxId(), entriesFor(c));   // callback tới 2 lần = cộng tiền 2 lần
}
~~~

thì một nhịp mạng chập chờn là tiền được in ra từ không khí. Quy tắc: **xử lý callback phải idempotent** — trùng với sự kiện đã áp dụng thì **no-op** (không đổi trạng thái, không ghi thêm gì, không bắn thông báo lặp). Trong bài tập, "{{SUCCESS}} đã áp dụng rồi mà lại nhận {{SUCCESS}}" là no-op im lặng, còn "{{SUCCESS}} đã áp dụng rồi mà nay nhận {{FAILED}}" là **mâu thuẫn thật** ⇒ ném {{IllegalStateException}} để gọi con người dậy lúc 2 giờ sáng.

### Vì sao "tiền bị trừ mà app báo lỗi" — nhìn vào sổ cái

Nối với bài 5: khi nhận lệnh chuyển, ngân hàng gửi ghi ngay một giao dịch **cân bằng** kéo tiền khỏi người gửi và đặt nó vào **tài khoản treo (suspense, {{SYS/suspense}})**:

| txId | Tài khoản | Nợ | Có |
|---|---|---|---|
| T1 | CA/lan | 101.100 | |
| T1 | SYS/suspense | | 100.000 |
| T1 | SYS/fee | | 1.100 |

Tiền không "mất" lúc timeout: nó **đang nằm ở suspense**, và sổ cái biết chính xác điều đó. Khi {{SUCCESS}} về ⇒ ghi có {{CA/minh}} và rút khỏi suspense. Khi {{FAILED}} về ⇒ bút toán đảo đưa tiền về {{CA/lan}}. Khi không có gì về ⇒ treo đó, chờ tra soát. App báo "lỗi" chỉ vì nó map {{TIMEOUT}} thành thông điệp "chưa thành công, tiền của bạn đang được xử lý/hoàn trong X ngày" — chứ không phải "mất tiền".

### Luồng một lệnh chuyển khoản

~~~seq
title: Lệnh chuyển khoản liên ngân hàng bị timeout
actors: App | BankAPI | Switch | NganHangNhan
App -> BankAPI: POST /transfers với txId=T1
BankAPI -> BankAPI: ghi ledger, tiền nằm ở SYS/suspense
BankAPI -> Switch: lập phiên NAPAS
Switch -> NganHangNhan: chuyển 100.000đ cho CA/minh
note BankAPI: hết 5 giây, chưa thấy phản hồi
BankAPI --> App: TIMEOUT: báo lỗi, tiền đã trừ
Switch --> BankAPI: callback SUCCESS muộn (giây 40)
BankAPI -> BankAPI: TIMEOUT sang NEEDS_INQUIRY
App -> BankAPI: GET /transfers/T1 để xem lại
BankAPI -> Switch: inquiry (tra soát) T1
Switch --> BankAPI: kết quả chính thức: SUCCESS
BankAPI --> App: SUCCESS sau khi vận hành xác nhận
~~~

### Bảng chuyển trạng thái của bài tập

| Từ | Sự kiện | Đến |
|---|---|---|
| {{PENDING}} | {{SUCCESS}} / {{FAILED}} / {{TIMEOUT}} | {{SUCCESS}} / {{FAILED}} / {{TIMEOUT}} |
| {{PENDING}} | {{CONFIRM_SUCCESS}} / {{CONFIRM_FAILURE}} | ném {{IllegalStateException}} (không được nhảy cóc, chưa có kết quả tra soát) |
| {{TIMEOUT}} | {{TIMEOUT}} | no-op (callback trùng) |
| {{TIMEOUT}} | {{SUCCESS}} | {{NEEDS_INQUIRY}} (kết quả muộn: không tự cộng tiền) |
| {{TIMEOUT}} | {{FAILED}} | {{FAILED}} (đối tác khẳng định không nhận ⇒ hoàn được) |
| {{NEEDS_INQUIRY}} | {{SUCCESS}} / {{FAILED}} / {{TIMEOUT}} | no-op (trùng, chờ con người) |
| {{NEEDS_INQUIRY}} | {{CONFIRM_SUCCESS}} / {{CONFIRM_FAILURE}} | {{SUCCESS}} / {{FAILED}} |
| {{SUCCESS}} | {{SUCCESS}} | no-op |
| {{SUCCESS}} | sự kiện khác | ném {{IllegalStateException}} |
| {{FAILED}} | {{FAILED}} | no-op |
| {{FAILED}} | sự kiện khác | ném {{IllegalStateException}} |

Bảng gọn thành một quy tắc: **sự kiện đưa về đúng trạng thái hiện tại ⇒ no-op; sự kiện không có trong bảng ⇒ ném lỗi; mọi chuyển động thật ⇒ ghi một dòng lịch sử**.

### Lỗi hay gặp trên production
1. **Map TIMEOUT thành FAILED** để "cho sạch sẽ" ⇒ tiền được hoàn trong khi người nhận đã có tiền.
2. **Không lưu lịch sử chuyển trạng thái** ⇒ khi khiếu nại, không chứng minh được app đã biết gì, lúc nào.
3. **Callback handler không idempotent** ⇒ cộng tiền, gửi OTP, gửi SMS hai lần cho cùng một giao dịch.
4. **Viết if/else rải rác ở từng callback** thay vì một bảng chuyển tiếp tập trung ⇒ thêm một trạng thái mới là phải sửa rất nhiều chỗ, và chỗ quên sửa chính là lỗ hổng.
5. **Không có timeout ở tầng gọi đi**: chờ tới khi đối tác trả lời, trong khi đối tác cũng đang chờ mình ⇒ hai bên treo song song. Đặt timeout ngắn ở phía mình rồi dùng tra soát là chuẩn.

> Senior tip: Đặt **SLA tra soát** bằng con số của chính quy chế bạn đang chịu (thời gian tối đa chấp nhận một phản hồi muộn, và cam kết hoàn tiền hiển thị với khách thường được viết trong tài liệu sản phẩm), kèm **alert trên số lệnh nằm ở NEEDS_INQUIRY**. Một hai lệnh treo là bình thường; đường cong tăng dốc nghĩa là đối tác hoặc đầu mối chuyển mạch có vấn đề — đó là sự cố, không phải nghiệp vụ.

### Liên hệ phỏng vấn
**Câu hỏi:** "Chuyển khoản của khách timeout, ngân hàng thụ hưởng báo SUCCESS muộn. Bạn xử lý thế nào?"
**Cách trả lời:** Trước hết khẳng định **timeout là thiếu thông tin, không phải thất bại**, nên không được tự động hoàn tiền, nếu không tiền vừa ở tài khoản người nhận vừa về tài khoản người gửi. Thiết kế: tiền của lệnh đang chờ nằm ở **tài khoản treo (suspense)** trên sổ cái kế toán kép (bài 5) nên luôn truy vết được; trạng thái chuyển {{PENDING → TIMEOUT}} rồi {{TIMEOUT → NEEDS_INQUIRY}} khi {{SUCCESS}} tới muộn, tức **không tự ý ghi có** mà đưa vào hàng đợi tra soát ({{inquiry}}) gửi lên đầu mối chuyển mạch; khi có kết quả chính thức, vận hành bấm {{CONFIRM_SUCCESS}} hoặc {{CONFIRM_FAILURE}} để chốt. Callback phải **idempotent**: trùng sự kiện đã áp dụng là no-op, còn mâu thuẫn (đã SUCCESS mà nhận FAILED) thì ném {{IllegalStateException}} và alert. Điểm cộng khi trả lời: nhắc {{txId}} làm khóa idempotency, SLA tra soát, và metrics cảnh báo số lệnh treo ở {{NEEDS_INQUIRY}}.`,
    exercises: [
      {
        title: 'TransferStateMachine.apply',
        prompt: `Viết {{TransferStateMachine}} cho một lệnh chuyển khoản liên ngân hàng. Trạng thái khởi tạo là {{PENDING}}. Bảng chuyển tiếp **đúng như trong bài học**:

- {{PENDING}} + {{SUCCESS}} / {{FAILED}} / {{TIMEOUT}} ⇒ {{SUCCESS}} / {{FAILED}} / {{TIMEOUT}}.
- {{TIMEOUT}} + {{SUCCESS}} ⇒ {{NEEDS_INQUIRY}} (kết quả muộn, không tự ghi có). {{TIMEOUT}} + {{FAILED}} ⇒ {{FAILED}}.
- {{NEEDS_INQUIRY}} + {{CONFIRM_SUCCESS}} ⇒ {{SUCCESS}}; + {{CONFIRM_FAILURE}} ⇒ {{FAILED}}.
- Sự kiện mà trạng thái đích **bằng đúng** trạng thái hiện tại ⇒ **no-op** (callback trùng): không đổi trạng thái, không ghi lịch sử, **không ném lỗi**.
- Mọi sự kiện không có trong bảng (ví dụ {{PENDING}} + {{CONFIRM_SUCCESS}}, {{SUCCESS}} + {{FAILED}}, {{FAILED}} + {{SUCCESS}}) ⇒ ném {{IllegalStateException}} và **không đổi gì cả**.
- {{event == null}} ⇒ ném {{IllegalArgumentException}}.
- Mỗi lần chuyển trạng thái thật, thêm một dòng vào lịch sử với dạng: {{TU --SU_KIEN--> DEN}} (ví dụ {{TIMEOUT --SUCCESS--> NEEDS_INQUIRY}}).

{{state()}} và {{history()}} đã có sẵn; bạn chỉ viết {{apply(Event)}}. Gợi ý: tách một hàm {{next(State from, Event e)}} trả về trạng thái đích, hoặc {{null}} nếu không hợp lệ — logic bảng nằm hết ở một chỗ.`,
        starter: `import java.util.*;

enum State { PENDING, SUCCESS, FAILED, TIMEOUT, NEEDS_INQUIRY }

enum Event { SUCCESS, FAILED, TIMEOUT, CONFIRM_SUCCESS, CONFIRM_FAILURE }

class TransferStateMachine {
    private State state = State.PENDING;
    private final List<String> history = new ArrayList<>();

    State state() { return state; }

    List<String> history() { return new ArrayList<>(history); }

    void apply(Event event) {
        throw new UnsupportedOperationException("TODO");
    }
}`,
        tests: `public class Main {
    static int passed = 0, total = 0;
    static void check(String name, boolean ok, String detail) {
        total++;
        if (ok) { passed++; System.out.println("PASS " + name); }
        else System.out.println("FAIL " + name + ": " + detail);
    }
    static boolean expect(Class<? extends Exception> type, Runnable r) {
        try { r.run(); return false; }
        catch (Exception ex) { return type.isInstance(ex); }
    }
    public static void main(String[] args) {
        TransferStateMachine a = new TransferStateMachine();
        a.apply(Event.SUCCESS);
        check("PENDING + SUCCESS -> SUCCESS", a.state() == State.SUCCESS, "state=" + a.state());
        check("lich su co 1 dong", a.history().size() == 1, "history=" + a.history());
        check("lich su dung format", a.history().get(0).equals("PENDING --SUCCESS--> SUCCESS"), "dong=" + a.history().get(0));
        a.apply(Event.SUCCESS);
        check("callback trung la no-op", a.state() == State.SUCCESS && a.history().size() == 1, "state=" + a.state() + " history=" + a.history());
        check("may moi bat dau PENDING", new TransferStateMachine().state() == State.PENDING, "");
        check("da SUCCESS nhan FAILED -> ngoai le", expect(IllegalStateException.class, () -> a.apply(Event.FAILED)), "");
        check("co dinh sau loi tu choi", a.state() == State.SUCCESS && a.history().size() == 1, "history=" + a.history());
        check("null event -> IllegalArgumentException", expect(IllegalArgumentException.class, () -> a.apply(null)), "");

        TransferStateMachine b = new TransferStateMachine();
        check("PENDING khong duoc nhan CONFIRM_SUCCESS", expect(IllegalStateException.class, () -> b.apply(Event.CONFIRM_SUCCESS)), "khong duoc nhay coc");
        check("PENDING khong duoc nhan CONFIRM_FAILURE", expect(IllegalStateException.class, () -> b.apply(Event.CONFIRM_FAILURE)), "");
        b.apply(Event.TIMEOUT);
        check("PENDING -> TIMEOUT", b.state() == State.TIMEOUT, "state=" + b.state());
        b.apply(Event.TIMEOUT);
        check("TIMEOUT trung la no-op", b.state() == State.TIMEOUT && b.history().size() == 1, "history=" + b.history());
        b.apply(Event.SUCCESS);
        check("SUCCESS muon -> NEEDS_INQUIRY", b.state() == State.NEEDS_INQUIRY, "state=" + b.state());
        check("dong lich su late success", b.history().get(1).equals("TIMEOUT --SUCCESS--> NEEDS_INQUIRY"), "dong=" + b.history().get(1));
        b.apply(Event.SUCCESS);
        check("SUCCESS lap lai tai NEEDS_INQUIRY la no-op", b.state() == State.NEEDS_INQUIRY && b.history().size() == 2, "history=" + b.history());
        b.apply(Event.FAILED);
        check("FAILED lap tai NEEDS_INQUIRY la no-op", b.state() == State.NEEDS_INQUIRY && b.history().size() == 2, "history=" + b.history());
        b.apply(Event.CONFIRM_SUCCESS);
        check("CONFIRM_SUCCESS -> SUCCESS", b.state() == State.SUCCESS && b.history().size() == 3, "history=" + b.history());
        check("da SUCCESS khong con nhan CONFIRM", expect(IllegalStateException.class, () -> b.apply(Event.CONFIRM_FAILURE)), "");

        TransferStateMachine c = new TransferStateMachine();
        c.apply(Event.TIMEOUT);
        c.apply(Event.FAILED);
        check("TIMEOUT + FAILED -> FAILED", c.state() == State.FAILED, "state=" + c.state());
        c.apply(Event.FAILED);
        check("FAILED trung la no-op", c.state() == State.FAILED && c.history().size() == 2, "history=" + c.history());
        check("FAILED khong the dao thanh SUCCESS", expect(IllegalStateException.class, () -> c.apply(Event.SUCCESS)), "");
        check("FAILED khong the timeout nua", expect(IllegalStateException.class, () -> c.apply(Event.TIMEOUT)), "");
        check("state sau khi bi tu choi van co dinh", c.state() == State.FAILED && c.history().size() == 2, "history=" + c.history());
        check("FAILED khong nhan CONFIRM", expect(IllegalStateException.class, () -> c.apply(Event.CONFIRM_SUCCESS)), "");

        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
        reference: `import java.util.*;

enum State { PENDING, SUCCESS, FAILED, TIMEOUT, NEEDS_INQUIRY }

enum Event { SUCCESS, FAILED, TIMEOUT, CONFIRM_SUCCESS, CONFIRM_FAILURE }

class TransferStateMachine {
    private State state = State.PENDING;
    private final List<String> history = new ArrayList<>();

    State state() { return state; }

    List<String> history() { return new ArrayList<>(history); }

    // Bang chuyen tiep tap trung: tra ve trang thai dich, hoac null neu su kien khong hop le.
    // Tra ve dung trang thai hien tai nghia la callback trung -> no-op.
    private State next(State from, Event e) {
        switch (from) {
            case PENDING:
                switch (e) {
                    case SUCCESS: return State.SUCCESS;
                    case FAILED: return State.FAILED;
                    case TIMEOUT: return State.TIMEOUT;
                    default: return null;
                }
            case TIMEOUT:
                switch (e) {
                    case SUCCESS: return State.NEEDS_INQUIRY;   // ket qua muon: khong tu cong tien
                    case FAILED: return State.FAILED;           // doi tac khang dinh khong nhan
                    case TIMEOUT: return State.TIMEOUT;         // trung -> no-op
                    default: return null;
                }
            case NEEDS_INQUIRY:
                switch (e) {
                    case CONFIRM_SUCCESS: return State.SUCCESS;
                    case CONFIRM_FAILURE: return State.FAILED;
                    case SUCCESS: case FAILED: case TIMEOUT: return State.NEEDS_INQUIRY;  // trung -> cho con nguoi
                    default: return null;
                }
            case SUCCESS:
                return e == Event.SUCCESS ? State.SUCCESS : null;
            case FAILED:
                return e == Event.FAILED ? State.FAILED : null;
            default:
                return null;
        }
    }

    void apply(Event event) {
        if (event == null) throw new IllegalArgumentException("event null");
        State from = state;
        State to = next(from, event);
        if (to == null) throw new IllegalStateException("Chuyen khong hop le: " + from + " + " + event);
        if (to == from) return;                                    // callback trung: no-op im lang
        state = to;
        history.add(from + " --" + event + "--> " + to);
    }
}`,
        hints: [
          'Đừng viết if dài theo từng if-else rải rác; gom bảng vào một hàm {{next(from, event)}} trả về trạng thái đích hoặc null.',
          'No-op chính là trường hợp {{next}} trả về đúng {{from}}: kiểm tra {{to == from}} rồi {{return}} **trước khi** ghi lịch sử.',
          'Ném {{IllegalStateException}} khi không có đường chuyển, và nhớ **không** được đổi {{state}} hay {{history}} ở nhánh lỗi.',
          'Chỗ khó nhất: {{TIMEOUT}} + {{SUCCESS}} phải đi tới {{NEEDS_INQUIRY}}, còn {{PENDING}} + {{SUCCESS}} đi thẳng tới {{SUCCESS}}.',
        ],
        explain: `Máy trạng thái chỉ có **một cửa vào** là {{apply}}, nên mọi hành vi nằm trong bảng {{next}} — đó là điều bài học muốn bạn giữ được: thêm trạng thái mới chỉ sửa một chỗ.

Ba nhóm case test riêng: (1) **no-op idempotent** — cùng một callback tới hai lần thì trạng thái và lịch sử đứng yên; (2) **kết quả muộn** — {{TIMEOUT --SUCCESS--> NEEDS_INQUIRY}}, không bao giờ {{TIMEOUT → SUCCESS}} thẳng, vì tiền còn treo ở suspense chờ tra soát; (3) **trạng thái chốt** — {{SUCCESS}} và {{FAILED}} chỉ nhận lại đúng chính sự kiện đã đưa chúng tới đó, mọi thứ khác ném {{IllegalStateException}} để alert.

{{history}} không phải "nice to have": khi khách khiếu nại "app báo lỗi mà tiền đi đâu", dòng {{PENDING --TIMEOUT--> TIMEOUT}} rồi {{TIMEOUT --SUCCESS--> NEEDS_INQUIRY}} kèm timestamp chính là bằng chứng vận hành và pháp lý.

Lỗi kinh điển khi viết: cho {{NEEDS_INQUIRY + SUCCESS}} nhảy thẳng sang {{SUCCESS}} (tự cộng tiền khi chưa đối soát), hoặc dùng {{Exception}} chung cho cả "trùng" lẫn "sai" — nghiệp vụ cần phân biệt: trùng là bình thường, sai là sự cố.`,
      },
    ],
    check: [
      { q: 'Điểm khác nhau giữa TIMEOUT và FAILED là gì?', options: ['Không khác, cả hai đều hoàn tiền', 'TIMEOUT là chưa biết kết quả, FAILED là đối tác khẳng định không nhận', 'TIMEOUT luôn nghiêm trọng hơn FAILED', 'FAILED không bao giờ phải hoàn tiền'], answer: 1, explain: 'Coi TIMEOUT như FAILED sẽ hoàn tiền trong khi người nhận có thể đã được ghi có, gây mất tiền hai lần' },
      { q: 'Callback SUCCESS tới khi giao dịch đang TIMEOUT. Hành động an toàn?', options: ['Chuyển thẳng SUCCESS và ghi có cho người nhận', 'Bỏ qua, chờ khách gọi tổng đài', 'Chuyển NEEDS_INQUIRY rồi tra soát, chỉ ghi có sau khi xác nhận', 'Ném lỗi và revert mọi thứ'], answer: 2, explain: 'Kết quả muộn chưa đủ tin để tự áp dụng; cần đối soát qua inquiry rồi mới chốt bằng CONFIRM_SUCCESS' },
      { q: 'Hệ thống nhận callback SUCCESS lần thứ ba cho cùng một txId đã SUCCESS. Phải làm gì?', options: ['Ném IllegalStateException', 'No-op: không đổi trạng thái, không ghi lịch sử', 'Ghi thêm một bút toán Có nữa', 'Gọi lại đối tác để xác nhận'], answer: 1, explain: 'Xử lý callback bắt buộc idempotent; trùng sự kiện đã áp dụng là tình huống bình thường do retry' },
      { q: 'Trong lúc chờ kết quả, tiền của người gửi nằm ở đâu (theo sổ cái kép)?', options: ['Trong tài khoản người nhận', 'Đã bị hủy nên về người gửi', 'Tài khoản treo suspense của ngân hàng', 'Không ghi nhận ở đâu cả'], answer: 2, explain: 'Bút toán cân bằng đưa tiền từ CA/gui sang SYS/suspense nên luôn truy vết được, không có tiền mất tích' },
    ],
    related: [],
    tags: ['state-machine', 'banking', 'idempotency', 'napas'],
  },
  {
    id: 'lesson-banking-007',
    track: 'banking',
    order: 7,
    title: 'Số dư khả dụng và giữ tiền (hold): authorization, capture một phần, release và làm tròn BigDecimal',
    level: 'senior',
    minutes: 40,
    goals: [
      'Phân biệt số dư sổ cái (ledger balance) và số dư khả dụng (available balance), vì sao app phải hiển thị cả hai',
      'Mô tả vòng đời một khoản giữ tiền: authorise → capture (có thể nhỏ hơn số đã giữ) / release / hết hạn, và phần tiền bị khoá khi nào thì được nhả',
      'Dùng BigDecimal đúng cho tiền VND: tạo từ chuỗi, setScale(0, RoundingMode), làm tròn một lần ở biên giới, so sánh bằng compareTo',
      'Viết class {{HoldLedger}} với {{authorise}}, {{capture}}, {{release}}, {{availableBalance}}, {{ledgerBalance}} thỏa các bất biến trên',
    ],
    body: `### Chuyện thật: "tài khoản còn 12 triệu mà sao tiêu hết 8 triệu"

Chị Lan quẹt thẻ ở khách sạn, hóa đơn dự kiến 300.000đ một đêm. Lễ tân nói: "Em giữ tạm 4.000.000đ phòng khi anh chị dùng minibar, khi nào trả phòng khách sạn mới chốt số thật". Ngân hàng gửi SMS: "Quý khách vừa thanh toán 4.000.000đ". Chị mở app: **Số dư: 12.000.000đ**, **Số dư khả dụng: 8.000.000đ**. Không ai trừ tiền của chị hai lần, cũng không ai hiển thị sai — hai con số chỉ trả lời hai câu hỏi khác nhau. Bài này dạy cách viết code cho hai con số đó, và vì sao tiền Việt có số lẻ thì bắt buộc phải dùng BigDecimal.

### Hai con số của một tài khoản

- **Số dư sổ cái (ledger balance)**: số tiền **đã chốt**. Nó chỉ đổi khi có bút toán thật (tiền vào/ra đã settlement). Đây là con số pháp lý: dùng cho sao kê, đối soát cuối ngày (bài 2) và sổ cái kép (bài 5).
- **Số dư khả dụng (available balance)** = số dư sổ cái − **tổng tiền đang bị giữ (holds)**. Đây là con số "bạn còn được chi bao nhiêu", và là con số quyết định một giao dịch mới có được chấp nhận hay không.

**Giữ tiền (hold / authorization)** là lời hứa của ngân hàng với người bán: "tài khoản này có đủ X đồng, tôi khóa X lại, đừng cho chỗ đó bị tiêu". Tiền vẫn nằm nguyên ở tài khoản, chưa đi đâu.

Ví dụ đời thường: nhà xe giữ chỗ cho bạn qua điện thoại. Chỗ ấy hiện "hết" trên bảng bán vé (khả dụng giảm), nhưng bạn chưa trả tiền (sổ cái chưa đổi). Nếu nhà xe ghi "đã thu tiền" ngay lúc giữ chỗ thì mỗi lần bạn đổi ý phải làm một lệnh hoàn — thêm một chuyển động tiền là thêm một cơ hội lệch số.

Diễn biến của ví dụ trên:

| Thời điểm | Số dư sổ cái | Hold đang mở | Khả dụng |
|---|---|---|---|
| Đầu ngày | 12.000.000 | 0 | 12.000.000 |
| Khách sạn giữ 4.000.000 | 12.000.000 | 4.000.000 | 8.000.000 |
| Chị Lan mua sách online 200.000 (trừ ngay) | 11.800.000 | 4.000.000 | 7.800.000 |
| Khách sạn chốt thật 3.000.000, nhả 1.000.000 | 8.800.000 | 0 | 8.800.000 |

Dòng thứ nhất và thứ tư cho thấy điều dễ nhầm nhất: **hold không làm thay đổi số dư sổ cái**, nó chỉ khoá một phần khả dụng.

### Vì sao nghiệp vụ thẻ buộc phải tách làm hai pha

Khi quẹt thẻ, ba chuyện xảy ra ở ba thời điểm khác nhau:

1. **Authorization (ủy quyền / xin phép)** — trong khoảng 1 giây: người bán hỏi "tài khoản này có 4 triệu không?", ngân hàng trả lời đủ/không và tạo một hold. Người bán cần câu trả lời **ngay** để in hóa đơn và bật máy cà, nếu không khách đứng chờ sẽ bỏ đi.
2. **Capture / settlement (chốt toán)** — thường là **cuối ngày**, chạy theo **lô (batch)**: người bán gộp hàng trăm giao dịch vào một file gửi lên tổ chức thẻ, ngân hàng lúc đó mới thật sự chuyển tiền. Số tiền thật có thể **khác** số đã giữ: khách sạn chỉ dùng 3.000.000, nhà hàng cộng thêm 5% **tip** (tiền boa), cây xăng khách đổ ít hơn số đã khoá.
3. **Chargeback (khách khởi kiện giao dịch)** — tiền đi một vòng ngược lại kèm phí phạt. Phần tra soát nằm ở bài 6.

Vì capture tới **muộn** và **thường nhỏ hơn số đã giữ**, code buộc phải hỗ trợ **partial capture** (chốt một phần) và **tự nhả phần chênh**. Quên bước nhả là lỗi kinh điển: giữ 4.000.000, chốt 3.000.000, 1.000.000 còn lại bị khóa vĩnh viễn. Khách gọi tổng đài hỏi "tiền tôi đâu", và vận hành phải mở tay từng hold.

Bốn động từ của một khoản giữ:

| Động từ | Ý nghĩa nghiệp vụ | Sổ cái | Hold | Khả dụng |
|---|---|---|---|---|
| {{authorise}} | khoá tiền, chưa chi gì | không đổi | mở thêm amount | giảm amount |
| {{capture}} | chốt số thật (≤ amount đã giữ) | giảm actual | đóng, tự nhả phần chênh | bằng đúng sổ cái |
| {{release}} | hủy lời hứa, không chi gì | không đổi | đóng | tăng lại amount |
| hết hạn | {{release}} tự động sau N ngày | không đổi | đóng | tăng lại amount |

### BigDecimal: vì sao tiền có số lẻ thì phải dùng nó

**BigDecimal** là class biểu diễn số thập phân **chính xác**, gồm hai phần: một số nguyên ({{unscaledValue}}) và số chữ số sau dấu phẩy ({{scale}}). Số 1234.56 được lưu như 123456 với scale bằng 2, nên không có chuyện làm tròn nhị phân.

~~~java
BigDecimal a = new BigDecimal("0.1");      // tao TU CHUOI
BigDecimal b = new BigDecimal("0.2");
System.out.println(a.add(b));              // 0.3  -> chinh xac tuyet doi
System.out.println(0.1 + 0.2 == 0.3);      // false -> so thuc nhi phan khong bieu dien duoc 0.1
~~~

> Lưu ý: {{new BigDecimal("0.1")}} khác hoàn toàn {{new BigDecimal(0.1)}}. Bản nhận {{double}} nhét luôn hạt nhiễu nhị phân vào số học của bạn (0.1000000000000000055511151231257827021181583488...). Tức là bạn tưởng mình dùng BigDecimal nhưng thật ra vẫn đang dùng double. Luôn khởi tạo **từ chuỗi**, hoặc dùng {{BigDecimal.valueOf(double)}} (bản này đi qua chuỗi nên an toàn).

**Scale và làm tròn**: {{setScale(n, RoundingMode)}} trả về một số **mới** có n chữ số thập phân (BigDecimal là bất biến — không có hàm nào sửa số cũ). Bảng các chế độ hay gặp:

| RoundingMode | 0,5 thành | Dùng khi |
|---|---|---|
| {{HALF_UP}} | 1 | làm tròn tiền cho khách theo quy ước "bốn bỏ, năm vào" (0–4 xuống, 5–9 lên) — chuẩn ở Việt Nam |
| {{HALF_EVEN}} | 0 | tính lãi trên hàng triệu bản ghi: làm tròn về phía số chẵn để lỗi không tích lũy một chiều |
| {{DOWN}} | 0 | cắt bớt khi chia tiền theo tỷ lệ, để phần đã chia không bao giờ vượt tổng (bài 1) |
| {{UP}} | 1 | tính số kỳ trả tối đa: thà dư một chút còn hơn thiếu |
| {{FLOOR}} / {{CEILING}} | 0 / 1 | khi ràng buộc là "không được âm" / "phải đủ" |

**Đặc thù VND**: trong thanh toán số, tiền Việt không có đơn vị nhỏ hơn 1 đồng. Vì vậy mọi số tiền **lưu và hiển thị** phải có {{scale}} bằng 0. Số dư, hold, phí đều là số đồng chẵn; phần lẻ sinh ra khi tính phí hoặc tỷ giá chỉ tồn tại tạm thời trong lúc tính.

**Làm tròn ở biên giới, không làm tròn dọc đường.** Nếu làm tròn ở từng bước trung gian rồi cộng lại, sai số tích dồn: 1.000 giao dịch mỗi cái lệch 0,5đ là 500đ bốc hơi, và 500đ đó đúng bằng một dòng lệch (break) phải giải trình trong đối soát cuối ngày (bài 2). Cách an toàn: tính với scale lớn (8–10 chữ số), chỉ {{setScale(0, HALF_UP)}} **một lần** khi ghi sổ hoặc khi hiển thị cho khách.

**Bẫy equals**: BigDecimal so sánh cả giá trị lẫn scale, nên hai số bằng nhau về tiền nhưng khác cách viết sẽ cho kết quả bất ngờ.

~~~java
new BigDecimal("1.0").equals(new BigDecimal("1.00"));    // false, vi scale khac nhau
new BigDecimal("1.0").compareTo(new BigDecimal("1.00")); // 0, bang nhau ve gia tri
~~~

Mọi so sánh tiền vì thế dùng {{compareTo}}, không dùng {{equals}}. Kiểm tra "đủ tiền chưa" là {{available.compareTo(amount) >= 0}}, còn {{signum()}} (dấu của số) là cách gọn để biết một số âm/dương/bằng 0.

### Bốn bất biến của sổ giữ tiền

1. **Không được chi phần đã bị giữ**: {{authorise}} chỉ thành công khi khả dụng đủ; không đủ thì từ chối và **không ghi nửa** (nguyên tắc giống bài 5).
2. **Chốt không được vượt số đã hứa**: {{capture}} lớn hơn số đang giữ phải bị từ chối. Hợp đồng thẻ cho phép vượt một tỷ lệ nhỏ (tip), nhưng đó phải là **quy tắc nghiệp vụ có cấu hình**, không phải hậu quả của việc code quên kiểm tra.
3. **Mỗi holdId chỉ đóng một lần**: capture hoặc release lần hai là no-op trả {{false}}. Đây chính là idempotency (bài 5, bài 6) — hạ tầng thẻ gửi lại file settlement nhiều lần.
4. **Khả dụng luôn suy ra được**: {{available = ledger − tổng hold đang mở}}. Nó là **kết quả dẫn xuất**, không phải dữ liệu gốc.

### Luồng một cú quẹt thẻ

~~~seq
title: Quet the: giu tien hom nay, chot toan ngay mai
actors: App | KhachSan | ToChucThe | HoldLedger
App -> KhachSan: hoa don 300.000, le tan giu 4.000.000
KhachSan -> ToChucThe: authorization holdId H1 so tien 4.000.000
ToChucThe -> HoldLedger: authorise(H1, CA/lan, 4.000.000)
HoldLedger -> HoldLedger: kha dung 12.000.000 co du khong
HoldLedger --> ToChucThe: OK, kha dung con 8.000.000
ToChucThe --> KhachSan: approved, in hoa don cho khach
note HoldLedger: so du cai do van la 12.000.000
KhachSan -> ToChucThe: cuoi ngay settlement: that 3.000.000
ToChucThe -> HoldLedger: capture(H1, 3.000.000)
HoldLedger -> HoldLedger: so du con 8.800.000, dong H1, nha 1.000.000
HoldLedger --> App: SMS khach san da chot 3.000.000
~~~

### Lỗi hay gặp trên production

1. **Chỉ hiển thị một con số** (thường là số dư sổ cái) ⇒ khách tiêu phần tiền đã hứa với khách sạn; giao dịch thứ hai bị từ chối dù app vừa báo "đủ tiền".
2. **Không có job hết hạn hold** ⇒ tiền bị khoá nhiều ngày, thậm chí nhiều tuần. Giữ tiền luôn phải kèm ngày hết hạn và app phải ghi "sẽ nhả sau X ngày".
3. **Partial capture không nhả phần chênh** ⇒ hold "ma" treo mãi; đây là nguồn khiếu nại đứng đầu của ngành khách sạn và cho thuê xe.
4. **Trừ tiền ngay lúc authorise**, rồi settlement lại trừ lần nữa ⇒ mất tiền hai lần. Cùng bản chất với callback trùng ở bài 6: một sự thật nghiệp vụ chỉ được ghi sổ một lần.
5. **Dùng {{double}} cho tiền**, hoặc **dùng {{equals}} để so tiền**.
6. **Làm tròn ở mỗi bước tính** ⇒ tổng tiền không khớp với số đã trừ của khách, và lệch đó chui vào đối soát cuối ngày.
7. **Lưu cột available vào bảng tài khoản** ⇒ sau một transaction hỏng, cột đó lệch khỏi (sổ cái − hold). Job "rebuild số dư khả dụng" chạy hằng đêm không phải giải pháp; nó là bằng chứng thiết kế sai.

> Senior tip: Hãy đặt **hạn mức cho hold** theo loại hình chấp nhận thẻ (khách sạn và thuê xe được giữ gấp nhiều lần hóa đơn dự kiến, quán ăn thì không), và luôn in **ba con số** trong sao kê: số dư sổ cái, tổng hold đang mở, khả dụng — kèm danh sách "giao dịch đang chờ chốt" có tên người bán và ngày hết hạn. Khi khách hỏi "vì sao tôi còn 12 triệu mà tiêu được 8 triệu", câu trả lời phải tự hiện ra trên màn hình, không cần ai gọi lên tổng đài.

### Liên hệ phỏng vấn

**Câu hỏi:** "Khách quẹt thẻ, app báo đã trừ tiền nhưng sao kê chưa thấy tiền đi. Bạn thiết kế số dư thế nào?"
**Cách trả lời:** Nói ngay rằng tài khoản có **hai số dư**: số dư sổ cái (tiền đã chốt, dùng cho sao kê và đối soát) và số dư khả dụng (bằng sổ cái trừ tổng hold đang mở, dùng để quyết định giao dịch mới). Quẹt thẻ là **hai pha**: authorization tạo hold để khóa tiền ngay trong 1 giây cho người bán, settlement cuối ngày mới chuyển tiền thật, và số chốt có thể nhỏ hơn số đã giữ (khách sạn, minibar, tip) nên hàm capture phải nhận **số tiền thật** và **tự nhả phần chênh**; cộng thêm job hết hạn hold để tiền không bị khóa vĩnh viễn. Về số học tiền: dùng {{BigDecimal}} tạo từ chuỗi, {{setScale(0, RoundingMode.HALF_UP)}} cho VND, chỉ làm tròn một lần ở biên giới khi ghi sổ, so sánh bằng {{compareTo}} vì {{equals}} so cả scale. Điểm senior: không lưu cột số dư khả dụng mà suy ra nó, holdId làm khóa idempotency để file settlement gửi trùng không chốt tiền hai lần, và capture vượt số đã giữ phải bị từ chối trừ khi có cấu hình nghiệp vụ rõ ràng.`,
    exercises: [
      {
        title: 'HoldLedger: authorise / capture / release với BigDecimal',
        prompt: `Viết class {{HoldLedger}} quản lý **số dư sổ cái** và **các khoản giữ tiền đang mở** cho một phía tài khoản trả tiền (payer). Tiền dùng {{BigDecimal}}, đơn vị đồng VND.

Quy tắc bắt buộc:

1. **Mọi số tiền đi vào đều được quy về {{scale}} 0 bằng {{setScale(0, RoundingMode.HALF_UP)}}** ngay tại ranh giới ({{deposit}}, {{authorise}}, {{capture}}). {{ledgerBalance}} và {{availableBalance}} cũng trả về số có {{scale}} 0. Tài khoản chưa từng có giao dịch ⇒ số dư 0.
2. {{deposit(account, amount)}}: {{amount}} âm sau khi làm tròn ⇒ ném {{IllegalArgumentException}}; ngược lại cộng vào số dư sổ cái.
3. {{authorise(holdId, account, amount)}}: {{amount}} làm tròn ra 0 hoặc âm ⇒ ném {{IllegalArgumentException}}. Số đang giữ **không được vượt số dư khả dụng** ⇒ không đủ thì ném {{IllegalStateException}} và **không ghi gì cả**. {{holdId}} đã tồn tại (đang mở **hoặc** đã đóng trước đó) ⇒ no-op trả {{false}}, không đổi số nào. Thành công ⇒ mở hold, trả {{true}}. Hold không làm đổi số dư sổ cái.
4. {{capture(holdId, actual)}}: {{actual}} làm tròn ra số âm ⇒ ném {{IllegalArgumentException}}. {{holdId}} chưa từng có ⇒ ném {{IllegalArgumentException}}. Hold đã đóng rồi ⇒ no-op trả {{false}}. {{actual}} lớn hơn số đã giữ ⇒ ném {{IllegalArgumentException}} và hold **vẫn đang mở**. Ngược lại: trừ {{actual}} khỏi số dư sổ cái, đóng hold (phần chênh giữa số đã giữ và {{actual}} đương nhiên hết bị giữ), trả {{true}}.
5. {{release(holdId)}}: chưa từng có ⇒ ném {{IllegalArgumentException}}; đã đóng ⇒ trả {{false}}; đang mở ⇒ đóng, **số dư sổ cái không đổi**, trả {{true}}.
6. {{availableBalance(account)}} = {{ledgerBalance(account)}} trừ đi tổng các hold **đang mở** của tài khoản đó.

Gợi ý bố cục: ba cấu trúc dữ liệu là một map số dư sổ cái, một map hold đang mở ({{holdId}} → {{"tài khoản, số tiền"}}), và một tập {{holdId}} đã đóng. Viết một hàm riêng để làm tròn, dùng nó ở mọi cửa vào.`,
        starter: `import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;

class HoldLedger {
    private final Map<String, BigDecimal> ledger = new HashMap<>();
    private final Map<String, BigDecimal> openHolds = new HashMap<>();
    private final Map<String, String> holdOwner = new HashMap<>();
    private final Set<String> closedHolds = new HashSet<>();

    void deposit(String account, BigDecimal amount) {
        throw new UnsupportedOperationException("TODO");
    }

    boolean authorise(String holdId, String account, BigDecimal amount) {
        throw new UnsupportedOperationException("TODO");
    }

    boolean capture(String holdId, BigDecimal actual) {
        throw new UnsupportedOperationException("TODO");
    }

    boolean release(String holdId) {
        throw new UnsupportedOperationException("TODO");
    }

    BigDecimal ledgerBalance(String account) {
        throw new UnsupportedOperationException("TODO");
    }

    BigDecimal availableBalance(String account) {
        throw new UnsupportedOperationException("TODO");
    }
}`,
        tests: `public class Main {
    static int passed = 0, total = 0;
    static void check(String name, boolean ok, String detail) {
        total++;
        if (ok) { passed++; System.out.println("PASS " + name); }
        else System.out.println("FAIL " + name + ": " + detail);
    }
    static boolean expect(Class<? extends Exception> type, Runnable r) {
        try { r.run(); return false; }
        catch (Exception ex) { return type.isInstance(ex); }
    }

    public static void main(String[] args) {
        HoldLedger l1 = new HoldLedger();
        l1.deposit("CA/lan", new BigDecimal("12000000"));
        check("so_dau_va_kha_dung_bang_nhau_luc_dau", l1.ledgerBalance("CA/lan").compareTo(new BigDecimal("12000000")) == 0 && l1.availableBalance("CA/lan").compareTo(new BigDecimal("12000000")) == 0,
            "ledger=" + l1.ledgerBalance("CA/lan"));
        check("lai_cua_0_bang_dinh", l1.ledgerBalance("CA/ghost").compareTo(new BigDecimal("0")) == 0, "ghost=" + l1.ledgerBalance("CA/ghost"));
        check("scale_khi_tra_ve_phai_la_0", l1.availableBalance("CA/lan").scale() == 0, "scale=" + l1.availableBalance("CA/lan").scale());

        check("hold_mo_ok", l1.authorise("H1", "CA/lan", new BigDecimal("4000000")), "authorise H1 phai tra true");
        check("so_du_khong_doi_khi_giu_tien", l1.ledgerBalance("CA/lan").compareTo(new BigDecimal("12000000")) == 0, "ledger=" + l1.ledgerBalance("CA/lan"));
        check("kha_dung_giam_dung_phan_bi_giu", l1.availableBalance("CA/lan").compareTo(new BigDecimal("8000000")) == 0, "kha_dung=" + l1.availableBalance("CA/lan"));
        check("hold_trung_la_no_op", !l1.authorise("H1", "CA/lan", new BigDecimal("4000000")), "holdId da ton tai phai tra false");
        check("hold_trung_khong_nho_kha_dung_hai_lan", l1.availableBalance("CA/lan").compareTo(new BigDecimal("8000000")) == 0, "kha_dung=" + l1.availableBalance("CA/lan"));

        check("so_le_duoc_lam_tron_HALF_UP_xuong", l1.authorise("H2", "CA/lan", new BigDecimal("3000000.4")), "authorise H2 phai tra true");
        check("kha_dung_tru_dung_so_le_duoc_lam_tron", l1.availableBalance("CA/lan").compareTo(new BigDecimal("5000000")) == 0, "kha_dung=" + l1.availableBalance("CA/lan"));
        check("so_le_duoc_lam_tron_HALF_UP_len", l1.authorise("H3", "CA/lan", new BigDecimal("1999999.5")), "authorise H3 phai tra true");
        check("kha_dung_con_lai_sau_khi_lam_tron_len", l1.availableBalance("CA/lan").compareTo(new BigDecimal("3000000")) == 0, "kha_dung=" + l1.availableBalance("CA/lan"));

        check("giu_vuot_kha_dung_bi_tu_choi", expect(IllegalStateException.class, () -> l1.authorise("H4", "CA/lan", new BigDecimal("3000001"))), "con 3.000.000 ma giu 3.000.001 phai bi tu choi");
        check("giu_bi_tu_choi_khong_de_lai_dau_vet", l1.availableBalance("CA/lan").compareTo(new BigDecimal("3000000")) == 0, "kha_dung=" + l1.availableBalance("CA/lan"));
        check("tien_so_0_bi_tu_choi", expect(IllegalArgumentException.class, () -> l1.authorise("H5", "CA/lan", new BigDecimal("0.4"))), "0.4 lam tron ra 0 dong");

        check("partial_capture_ok", l1.capture("H1", new BigDecimal("3000000")), "capture H1 phai tra true");
        check("capture_tru_tien_that_khoi_so_du", l1.ledgerBalance("CA/lan").compareTo(new BigDecimal("9000000")) == 0, "ledger=" + l1.ledgerBalance("CA/lan"));
        check("capture_nha_phan_chenh", l1.availableBalance("CA/lan").compareTo(new BigDecimal("4000000")) == 0,
            "kha_dung=" + l1.availableBalance("CA/lan"));
        check("capture_lan_hai_la_no_op", !l1.capture("H1", new BigDecimal("3000000")), "hold da dong phai tra false");
        check("capture_lan_hai_khong_tru_them_tien", l1.ledgerBalance("CA/lan").compareTo(new BigDecimal("9000000")) == 0, "ledger=" + l1.ledgerBalance("CA/lan"));
        check("capture_idempotent_khong_mo_lai_hold", !l1.authorise("H1", "CA/lan", new BigDecimal("100000")), "holdId da dung roi thi retry khong duoc mo lai");

        HoldLedger l2 = new HoldLedger();
        l2.deposit("CA/hung", new BigDecimal("5000000"));
        l2.authorise("X1", "CA/hung", new BigDecimal("2000000"));
        check("capture_vuot_so_da_giu_bi_tu_choi", expect(IllegalArgumentException.class, () -> l2.capture("X1", new BigDecimal("2000001"))), "2.000.001 > 2.000.000 da giu");
        check("giu_van_con_mo_sau_khi_capture_that_bai", l2.availableBalance("CA/hung").compareTo(new BigDecimal("3000000")) == 0, "kha_dung=" + l2.availableBalance("CA/hung"));
        check("release_dung", l2.release("X1"), "release X1 phai tra true");
        check("release_giu_nguyen_so_du", l2.ledgerBalance("CA/hung").compareTo(new BigDecimal("5000000")) == 0, "ledger=" + l2.ledgerBalance("CA/hung"));
        check("release_khoi_kha_dung", l2.availableBalance("CA/hung").compareTo(new BigDecimal("5000000")) == 0, "kha_dung=" + l2.availableBalance("CA/hung"));
        check("release_hai_lan_la_no_op", !l2.release("X1"), "");
        check("release_khong_mo_lai_hold", !l2.authorise("X1", "CA/hung", new BigDecimal("500000")), "holdId da dung roi");
        check("mo_lai_holdId_da_dong_du_soi_tien_nho_cung_khong_duoc", !l2.authorise("X1", "CA/hung", new BigDecimal("0.6")), "0.6 lam tron ra 1 dong nhung holdId da dong thi van no_op");

        HoldLedger l3 = new HoldLedger();
        l3.deposit("CA/vi", new BigDecimal("1000000"));
        l3.authorise("B1", "CA/vi", new BigDecimal("400000.5"));
        l3.authorise("B2", "CA/vi", new BigDecimal("399999.6"));
        check("hai_hold_cung_lam_tron_khong_cheo_nhau", l3.availableBalance("CA/vi").compareTo(new BigDecimal("199999")) == 0, "kha_dung=" + l3.availableBalance("CA/vi"));
        check("hold_lam_tron_len_bang_400000", l3.capture("B2", new BigDecimal("400000")), "capture B2 phai tra true");
        check("hold_lam_tron_xuong_bang_400000", l3.capture("B1", new BigDecimal("400000")), "capture B1 phai tra true");
        check("capture_bang_nhau_khong_am_hoa", l3.availableBalance("CA/vi").compareTo(l3.ledgerBalance("CA/vi")) == 0, "kha_dung=" + l3.availableBalance("CA/vi"));

        HoldLedger l4 = new HoldLedger();
        check("nap_tien_am_bi_tu_choi", expect(IllegalArgumentException.class, () -> l4.deposit("CA/a", new BigDecimal("-1"))), "");
        l4.deposit("CA/a", new BigDecimal("1000000.4"));
        check("so_du_le_lam_tron_HALF_UP", l4.ledgerBalance("CA/a").compareTo(new BigDecimal("1000000")) == 0 && l4.ledgerBalance("CA/a").scale() == 0, "so_du=" + l4.ledgerBalance("CA/a"));
        l4.deposit("CA/a", new BigDecimal("1000000.5"));
        check("nap_tien_le_lam_tron_len_dan_dong", l4.ledgerBalance("CA/a").compareTo(new BigDecimal("2000001")) == 0, "so_du=" + l4.ledgerBalance("CA/a"));

        HoldLedger l5 = new HoldLedger();
        check("capture_hold_khong_ton_tai", expect(IllegalArgumentException.class, () -> l5.capture("K1", new BigDecimal("1000"))), "");
        check("release_hold_khong_ton_tai", expect(IllegalArgumentException.class, () -> l5.release("K1")), "");
        check("so_du_bang_dinh_van_scale_0", l5.ledgerBalance("CA/x").scale() == 0, "scale=" + l5.ledgerBalance("CA/x").scale());

        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
        reference: `import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;

class HoldLedger {
    private final Map<String, BigDecimal> ledger = new HashMap<>();
    private final Map<String, BigDecimal> openHolds = new HashMap<>();
    private final Map<String, String> holdOwner = new HashMap<>();
    private final Set<String> closedHolds = new HashSet<>();

    private static BigDecimal vnd(BigDecimal x) {
        if (x == null) throw new IllegalArgumentException("thieu so tien");
        return x.setScale(0, RoundingMode.HALF_UP);
    }

    void deposit(String account, BigDecimal amount) {
        BigDecimal v = vnd(amount);
        if (v.signum() < 0) throw new IllegalArgumentException("so tien nap vao khong duoc am");
        ledger.merge(account, v, BigDecimal::add);
    }

    boolean authorise(String holdId, String account, BigDecimal amount) {
        BigDecimal v = vnd(amount);
        if (v.signum() <= 0) throw new IllegalArgumentException("so tien giu phai duong sau khi lam tron");
        if (openHolds.containsKey(holdId) || closedHolds.contains(holdId)) return false;
        if (availableBalance(account).compareTo(v) < 0) throw new IllegalStateException("khong du so du kha dung de giu tien");
        openHolds.put(holdId, v);
        holdOwner.put(holdId, account);
        return true;
    }

    boolean capture(String holdId, BigDecimal actual) {
        BigDecimal v = vnd(actual);
        if (v.signum() < 0) throw new IllegalArgumentException("so tien chot khong duoc am");
        if (!openHolds.containsKey(holdId)) {
            if (closedHolds.contains(holdId)) return false;
            throw new IllegalArgumentException("holdId khong ton tai");
        }
        BigDecimal held = openHolds.get(holdId);
        if (v.compareTo(held) > 0) throw new IllegalArgumentException("so tien chot vuot so da giu");
        String account = holdOwner.remove(holdId);
        openHolds.remove(holdId);
        closedHolds.add(holdId);
        ledger.merge(account, v.negate(), BigDecimal::add);
        return true;
    }

    boolean release(String holdId) {
        if (!openHolds.containsKey(holdId)) {
            if (closedHolds.contains(holdId)) return false;
            throw new IllegalArgumentException("holdId khong ton tai");
        }
        openHolds.remove(holdId);
        holdOwner.remove(holdId);
        closedHolds.add(holdId);
        return true;
    }

    BigDecimal ledgerBalance(String account) {
        return ledger.getOrDefault(account, BigDecimal.ZERO);
    }

    BigDecimal availableBalance(String account) {
        BigDecimal held = BigDecimal.ZERO;
        for (Map.Entry<String, BigDecimal> e : openHolds.entrySet()) {
            if (account.equals(holdOwner.get(e.getKey()))) held = held.add(e.getValue());
        }
        return ledgerBalance(account).subtract(held);
    }
}`,
        hints: [
          'Viết một hàm riêng {{vnd(BigDecimal)}} làm {{setScale(0, RoundingMode.HALF_UP)}} và gọi nó ở **cửa vào** của mọi method nhận số tiền — nhờ vậy số dư trả ra luôn có {{scale}} 0 mà không phải sửa lại ở cuối.',
          'Đừng so tiền bằng {{equals}} và đừng so {{BigDecimal}} sinh ra từ phép chia: dùng {{compareTo}} (trả 0 khi hai số bằng nhau về giá trị) và {{signum()}} (âm/dương/0).',
          '{{authorise}} phải kiểm tra {{availableBalance(account).compareTo(v) < 0}} **trước khi** ghi hold; ghi rồi mới kiểm tra sẽ để lại hold ma khi bị từ chối.',
          '{{capture}} cần phân biệt ba trường hợp: holdId chưa từng thấy (ném lỗi), holdId **đã đóng** (no-op {{false}}), holdId đang mở (chốt). Vì vậy phải nhớ tập holdId đã đóng, chứ không được xoá sạch khi đóng.',
          'Phần chênh khi partial capture **không cần cộng trừ gì**: chỉ cần bỏ hold đang mở đi, vì {{availableBalance}} được tính lại từ sổ cái trừ tổng hold đang mở.',
        ],
        explain: `Bốn điều test kiểm tra riêng lẻ, và cũng là bốn điều interviewer muốn nghe:

1. **Holds không chạm số dư sổ cái.** Sau {{authorise("H1", "CA/lan", 4.000.000)}}, {{ledgerBalance}} vẫn là 12.000.000 nhưng {{availableBalance}} còn 8.000.000. Tiền chỉ thật sự đi khi {{capture}}.
2. **Làm tròn một lần, ở biên giới.** {{3000000.4}} thành 3.000.000 ({{HALF_UP}} bỏ khi chữ số lẻ là 4), {{1999999.5}} thành 2.000.000 (5 thì vào). Vì thế tổng hai hold của {{CA/vi}} đúng bằng 800.000 và {{capture}} vừa khít từng hold — nếu ta làm tròn *sau khi* đã giữ số lẻ, hai con đường "400.000,5" và "399.999,6" sẽ cho ra số dư khác nhau và chốt không khớp.
3. **{{capture}} nhỏ hơn số đã giữ thì tự nhả phần chênh.** Khách sạn giữ 4.000.000, chốt 3.000.000: sổ cái giảm 3.000.000, hold đóng lại, 1.000.000 không còn bị khoá. Không cần một lệnh {{release}} riêng — và đó là lý do {{release}} và {{capture}} **cùng đánh dấu hold đã đóng** trong tập {{closedHolds}}.
4. **{{holdId}} chỉ được dùng một lần, cả khi retry.** {{capture}} lần hai trả {{false}} và không trừ thêm tiền; {{authorise}} lại bằng đúng {{holdId}} đó sau khi hold đã đóng cũng trả {{false}}. Đây là idempotency bảo vệ hệ thống khỏi file settlement được gửi hai lần (xem bài 5 và 6).

Lỗi hay gặp nhất khi viết bài này là **quên tập hold đã đóng** và chỉ giữ map hold đang mở: khi đó {{capture("H1")}} lần hai trở thành "holdId không tồn tại" → ném {{IllegalArgumentException}} thay vì no-op, và app của người bán sẽ retry mãi. Lỗi thứ hai là trả về số dư **chưa làm tròn** (ví dụ 3000000.4) — test {{scale}} bắt ngay. Lỗi thứ ba là cho {{capture}} số tiền lớn hơn hold "cho linh hoạt": nghiệp vụ thẻ cho phép điều đó trong một tỷ lệ nhỏ có cấu hình, nhưng mặc định phải từ chối, vì vượt số đã hứa nghĩa là chi nhiều hơn số đã khoá.`,
      },
    ],
    check: [
      { q: 'Số dư sổ cái và số dư khả dụng khác nhau ở điểm nào?', options: ['Không khác, chỉ là hai tên gọi', 'Sổ cái trừ hold hai lần, khả dụng trừ một lần', 'Khả dụng là tiền đã chuyển cho người bán, sổ cái là tiền còn lại', 'Sổ cái là tiền đã chốt; khả dụng bằng sổ cái trừ tổng tiền đang bị giữ'], answer: 3, explain: 'Hold chỉ khoá tiền, chưa chuyển. Tiền rời sổ cái ở bước capture/settlement, nên khả dụng = sổ cái − holds đang mở' },
      { q: 'Khách sạn giữ 4.000.000đ nhưng chỉ chốt thật 3.000.000đ. Hệ thống phải làm gì?', options: ['Chốt 3.000.000 và giữ nguyên hold 4.000.000 để phòng sau', 'Chốt 4.000.000 vì đã hứa với người bán', 'Chốt 3.000.000, đóng hold và tự nhả 1.000.000 cho khách', 'Chờ khách gọi tổng đài yêu cầu nhả tiền'], answer: 2, explain: 'Partial capture là chuẩn của ngành thẻ; quên nhả phần chênh là nguồn khiếu nại số một của khách sạn và cho thuê xe' },
      { q: 'Vì sao so sánh tiền phải dùng compareTo thay vì equals với BigDecimal?', options: ['compareTo nhanh hơn vì không cấp phát bộ nhớ', 'equals so cả giá trị lẫn scale nên "1.0" không equals "1.00" dù cùng số tiền', 'compareTo làm tròn giúp ta không cần setScale', 'equals chỉ dùng được cho số nguyên'], answer: 1, explain: 'BigDecimal mang theo độ chính xác (scale). equals là so "giá trị + cách viết"; muốn so tiền thì phải dùng compareTo' },
      { q: 'Vì sao chỉ nên làm tròn một lần, khi ghi sổ hoặc hiển thị?', options: ['Vì setScale chậm', 'Vì làm tròn nhiều lần làm sai scale', 'Vì BigDecimal không cho phép làm tròn hai lần', 'Vì sai số mỗi bước tích dồn thành lệch tiền thật, đối soát sẽ vỡ'], answer: 3, explain: '1.000 lần lệch 0,5đ là 500đ bốc hơi — đủ tạo một dòng lệch (break) phải giải trình trong đối soát cuối ngày' },
    ],
    related: ['banking-013', 'banking-027', 'banking-011'],
    tags: ['ledger', 'hold', 'authorization', 'bigdecimal', 'rounding', 'banking'],
  },

  {
    id: 'lesson-banking-008',
    track: 'banking',
    order: 8,
    title: 'Hạn mức ngày dưới tải đồng thời: check-then-act, khoá theo tài khoản và bắt lỗi race trong test',
    level: 'senior',
    minutes: 35,
    goals: [
      'Chỉ ra được vì sao "đọc số đã chi, so với hạn mức, rồi cộng vào" bị hai thread cùng vượt hạn mức (check-then-act)',
      'Chọn đúng hạt khoá: khoá cả service, khoá theo tài khoản, vòng lặp CAS, hay lệnh nguyên tử trên Redis khi chạy nhiều instance',
      'Viết test bắt lỗi race một cách deterministic: hàng rào xuất phát, đúng N lần thành công, lặp nhiều vòng, không dùng Thread.sleep',
      'Viết {{DailyLimit.tryConsume}} không bao giờ cho tổng vượt hạn mức và reset đúng 00:00 giờ Việt Nam nhờ {{Clock}}',
    ],
    body: `### Hai câu hỏi khác nhau của cùng một hạn mức

Bài 3 trả lời câu hỏi **nghiệp vụ**: "giao dịch này có được cho qua không" theo quy tắc (đã chi bao nhiêu trong ngày, velocity, xác thực mạnh). Bài này trả lời câu hỏi **kỹ thuật**: khi hai mươi lệnh gọi đổ tới *cùng một lúc*, làm sao để tổng số tiền **không bao giờ** vượt hạn mức — kể cả khi cả hai lệnh đều nhìn thấy "còn chỗ trống"?

Nếu chỉ cần đúng khi chạy tuần tự thì code đơn giản:

~~~java
if (spent + amount <= limit) {   // BƯỚC 1: đọc và kiểm tra
    spent = spent + amount;      // BƯỚC 2: ghi lại
    return true;
}
return false;
~~~

Hai bước này cách nhau vài nano-giây, và trong khoảng trống đó **không có gì ngăn** một thread khác chen vào. Đây là lỗi **check-then-act** (kiểm tra rồi mới hành động): quyết định đưa ra ở bước 1 dựa trên dữ liệu đã **cũ** ở bước 2.

### Chuyện đó xảy ra thật, không phải lý thuyết

- Khách bấm nút "Chuyển" hai lần vì app đứng hình 400 ms → hai request đi tới hai instance khác nhau của cùng service.
- Một tài khoản dùng đồng thời app, internet banking và QR; ba kênh cùng trừ vào **một** hạn mức chung.
- Gateway bị timeout nên **thử lại** (retry), trong khi request gốc vẫn đang được xử lý — lúc này có hai luồng *thật* đang chạy song song.
- Một vụ chuyển tiền bị từ chối ở bước duyệt nhưng trừ tiền ở bước tạo lệnh → hai lần trừ cách nhau vài giây.

Số liệu để hình dung: hạn mức 100 triệu, khách đã chi 95 triệu, còn lại 5 triệu. Hai lệnh 3 triệu tới cùng lúc. Cả hai thread đều đọc {{spent = 95}}, cả hai thấy {{95 + 3 <= 100}}, cả hai ghi {{spent = 98}} rồi cùng cộng — kết quả thật là **101 triệu**, vượt 1 triệu. Càng nhiều thread cùng chen thì càng vượt nhiều; với 16 thread cùng đòi 3 triệu, số lần vượt trung bình vài chục triệu.

### Xem bằng sơ đồ xen kẽ

~~~text
Thread A (3tr)                Thread B (3tr)          spent (thực)
  đọc spent = 95                                          95
                              đọc spent = 95              95
  95 + 3 <= 100  => OK                                    95
                              95 + 3 <= 100 => OK         95
  ghi spent = 98                                          98
                              ghi spent = 98              101  <-- mất 1 lần cộng
~~~

Dòng cuối là bản chất của **race condition** (điều kiện tranh chấp): kết quả phụ thuộc vào thứ tự xen kẽ của các thread, mà thứ tự đó ta không kiểm soát được. Kết quả có thể **đúng** hàng nghìn lần rồi sai một lần — và lần sai đó là một khoản tiền mất trên production. Điều quan trọng: mỗi phép đọc và mỗi phép ghi riêng lẻ đều "đúng"; chỉ **tổ hợp** hai phép mới sai. Vì thế {{volatile}} hay {{synchronized}} bọc từng phép đọc/ghi **không** giải quyết được — cái cần khoá là **cả khối đọc + so + ghi**, không phải từng con số.

### Bốn cách sửa, theo mức độ hệ thống

**1. Khoá (mutex) trên cùng một object.** Ai đang trong khối {{synchronized}} thì người khác phải chờ; nhờ vậy không ai thấy trạng thái giữa hai bước:

~~~java
synchronized (this) {                    // chỉ MỘT thread ở trong này tại một thời điểm
    if (amount > limitPerDay - spent) return false;   // so theo kiểu trừ, tránh overflow
    spent += amount;
    return true;
}
~~~

Đúng, nhưng **mọi tài khoản** phải xếp hàng sau nhau. Ngân hàng có triệu tài khoản đang hoạt động; một tài khoản hot (quầy giao dịch, ví doanh nghiệp) sẽ kéo cả hệ thống chậm theo. Đây là bài toán **throughput** (số lệnh xử lý được mỗi giây).

**2. Khoá theo tài khoản.** Thay vì khoá {{this}}, mỗi tài khoản có một object khoá riêng. Muốn vậy phải lấy được object **ổn định** cho một khoá (key) — dùng {{computeIfAbsent}} của {{ConcurrentHashMap}} (đảm bảo chỉ một thread tạo, người khác nhận cùng object):

~~~java
Bucket b = buckets.computeIfAbsent(account, k -> new Bucket());  // luôn trả về CÙNG một Bucket cho cùng account
synchronized (b) {                                               // hai tài khoản khác nhau => không chặn nhau
    return b.tryAdd(amount, limitPerDay, today);
}
~~~

Bẫy chết người ở cách này: nếu code **tạo Bucket mới** mỗi lần gọi ({{new Bucket()}} rồi khoá nó) thì hai thread khoá hai object khác nhau, {{synchronized}} trở thành vô hình — bug này chạy được, test đơn luồng vẫn xanh, chỉ đỏ khi có tải.

**3. Vòng lặp CAS (compare-and-set)** với {{AtomicLong}}: "đọc giá trị cũ, tính giá trị mới, chỉ ghi nếu **vẫn chưa ai đổi**" — nếu đã bị đổi thì đọc lại và thử lại, không cần chờ ai nhả khoá. Từ "CAS" viết tắt của compare-then-swap, là một lệnh do CPU thực hiện nên không thread nào chen được vào giữa:

~~~java
while (true) {
    long cur = spent.get();                       // đọc snapshot hiện tại
    if (amount > limitPerDay - cur) return false; // kiểm tra trên snapshot
    if (spent.compareAndSet(cur, cur + amount))   // ghi CHỈ KHI giá trị vẫn là cur
        return true;                              // thành công => không ai chen được
    // không được => có thread khác vừa sửa => vòng lặp lại, đọc giá trị mới
}
~~~

CAS giữ được độ trễ thấp khi ít xung đột, nhưng phải kiểm tra + ghi trong **một** phép nguyên tử về mặt logic; không được tách "{{spent.get()}} rồi {{spent.addAndGet()}}" vì vẫn còn khoảng trống giữa hai lệnh.

**4. Khi chạy nhiều instance (Kubernetes, autoscaling).** {{synchronized}} chỉ khoá được các thread **trong cùng một JVM** (một tiến trình Java). Production thường chạy 5–20 instance, mỗi instance một JVM riêng, mỗi JVM giữ một con số "đã chi" riêng → vượt hạn mức vẫn xảy ra dù code từng instance hoàn hảo. Lúc đó con số chung phải nằm ngoài JVM: trong **Redis** (database khoá–giá trị chạy trong bộ nhớ, mọi instance cùng đọc/ghi qua mạng, tốc độ micro-giây) hoặc trong chính database với lệnh cập nhật nguyên tử. Ý then chốt: **phương án 4 phải là MỘT thao tác nguyên tử phía server dữ liệu**, ví dụ một đoạn Lua chạy trên Redis hoặc một câu UPDATE có điều kiện, chứ không phải "GET rồi SET" qua hai lượt gọi mạng:

~~~sql
-- một câu UPDATE là một phép nguyên tử trong DB: điều kiện kiểm tra và trừ nằm cùng chỗ
UPDATE account_limit
   SET spent_today = spent_today + :amount
 WHERE account_id = :acc AND limit_day = :today
   AND spent_today + :amount <= :daily_limit;
-- affected rows = 1 => được chi; = 0 => từ chối (hết hạn mức hoặc sang ngày mới)
~~~

Bảng chọn nhanh:

| Cách | Đúng đơn luồng | Đúng đa luồng | Đúng đa instance | Ghi chú |
|---|---|---|---|---|
| if rồi cộng, không khoá | có | **không** | không | chỉ dùng được trong test tuần tự |
| {{synchronized (this)}} | có | có | không | đơn giản nhưng nghẽn cổ chai toàn cục |
| Khoá theo tài khoản | có | có | không | hạt khoá mịn, vẫn đúng khi một tài khoản nóng |
| CAS {{AtomicLong}} | có | có | không | độ trễ thấp khi ít xung đột |
| Redis Lua / UPDATE có điều kiện | có | có | **có** | thêm chi phí mạng, phải chống mất dữ liệu Redis |

> Lưu ý: {{ConcurrentHashMap}} **không** làm cho chuỗi "đọc – sửa – ghi" của bạn thành nguyên tử. Nó chỉ đảm bảo từng phép {{get}}/{{put}}/{{computeIfAbsent}} an toàn. Rất nhiều dev hiểu nhầm điều này và tưởng hệ đếm của mình đã thread-safe.

### Reset theo ngày và "ngày" lấy từ đâu

Hạn mức là "trong **một ngày**", mà ngày lại là khái niệm múi giờ. Việt Nam đổi ngày lúc 00:00 {{Asia/Ho_Chi_Minh}} = 17:00 UTC ngày hôm trước. Nếu server chạy UTC và code lấy {{LocalDate.now()}} theo hệ thống, hạn mức sẽ reset lúc **7h sáng** theo giờ khách — cả buổi sáng khách bị chặn vì "đã chi hết hôm qua".

Cách đúng: **inject {{Clock}}** và để Clock mang theo vùng giờ, {{LocalDate.now(clock)}} sẽ cho ra ngày đúng; trong test thay bằng {{Clock.fixed}} hoặc một Clock giả có thể "quay đồng hồ" để kiểm tra hành vi sang ngày mới mà không phải chờ tới nửa đêm. Cấu trúc dữ liệu nên theo bucket ngày, không ghi đè:

~~~java
Map<LocalDate, Long> byDay   // {2026-11-05: 95000000, 2026-11-06: 3000000}
~~~

Nhờ vậy số liệu của ngày cũ **vẫn tra được** để đối soát và phục vụ điều tra gian lận, thay vì bị {{spent = 0}} xoá mất lúc nửa đêm.

### Kiểm thử code đồng thời mà không hên xui

Quy tắc ba điểm:

1. **Hàng rào xuất phát.** Dùng {{CountDownLatch}} để 16 thread cùng "bắn" đúng một thời điểm, thay vì cho chúng khởi chạy lẻ tẻ (rất khó trùng nhau).
2. **Kết quả phải là một bất biến, không phải một khoảng.** Ví dụ: hạn mức 20.000, mỗi lệnh 3.000 ⇒ **đúng 6** lệnh thành công và {{spent == 18000}}. Code đúng thì lần nào cũng ra 6; code sai sẽ ra 7, 8 và {{spent = 21000}}.
3. **Lặp đủ nhiều vòng.** Race chỉ lộ diện khi hai thread thật sự xen kẽ. Một vòng có thể ăn may; 30–50 vòng với 16 thread làm xác suất lọt qua gần bằng 0.

Tuyệt đối không dùng {{Thread.sleep}} để "tạo race": nó chỉ *tăng xác suất* gặp lỗi chứ không chứng minh gì, và máy CI nhanh/chậm khác nhau sẽ khiến test lúc đỏ lúc xanh (test flaky — loại ung thư làm cả đội mất tin tưởng vào bộ test).

### Những chỗ hay sai nhất

- {{amount <= 0}} không bị từ chối: số **âm** làm {{spent}} *giảm đi*, tức kẻ tấn công gửi "-50.000.000" để mua lại hạn mức.
- Viết {{spent + amount > limit}} với số rất lớn: {{long}} tràn (overflow) sẽ **đảo thành số âm**, điều kiện luôn sai → cho qua mọi lệnh. Cách viết an toàn là {{amount > limit - spent}} (vế phải luôn nằm trong khoảng 0..limit).
- Trả {{true}} cho caller **trước** khi ghi sổ: nếu ghi thất bại thì app đã báo "thành công".
- {{synchronized}} trên một object khởi tạo lại mỗi lần gọi (mục 2 ở trên).
- Dùng {{double}} cho tiền: 0.1 + 0.2 = 0.30000000000000004 (xem bài 1).
- Quên rằng {{tryConsume}} **không idempotent**: cùng một txId gửi hai lần sẽ bị trừ hai lần. Muốn chống trùng phải kiểm tra txId **trước** khi tiêu hạn mức (xem bài 5 và 6).

> Senior tip: Khi phỏng vấn, đừng chỉ nói "thêm {{synchronized}} là xong". Câu trả lời đủ điểm gồm ba tầng: (1) hạt khoá **theo tài khoản** vì xung đột chỉ xảy ra trong cùng một tài khoản, (2) bất biến "không bao giờ vượt" được **giữ ở cửa vào duy nhất** là {{tryConsume}} — không cho code nghiệp vụ tự đọc {{spent}} rồi tự cộng, (3) khi chạy nhiều instance thì phải đẩy phép nguyên tử xuống tầng dữ liệu chung (Redis Lua / UPDATE có điều kiện) và **chấp nhận** thêm độ trễ mạng, đổi lại độ trễ P99 của cả hệ thống vẫn ổn. Kèm chi tiết ít người nói: số lần vượt hạn mức thật trên production thường tới từ retry của gateway chứ không phải hai người dùng bấm cùng lúc.

### Liên hệ phỏng vấn

**Câu hỏi:** "Hạn mức ngày của bạn được kiểm tra thế nào khi có 16 giao dịch đồng thời của cùng một tài khoản?"

**Cách trả lời:** Trước hết chỉ ra lỗi: dạng {{if (spent + amount <= limit) spent += amount}} là check-then-act — hai thread cùng đọc {{spent}}, cùng thấy còn chỗ, cùng ghi; kết quả là tổng vượt hạn mức dù mỗi phép đọc/ghi đều đúng. Sửa bằng cách gộp kiểm tra + ghi vào **một vùng nguyên tử**, và chọn hạt khoá theo mức độ mở rộng: trong một JVM thì {{synchronized}} trên object **riêng của tài khoản** (lấy qua {{computeIfAbsent}} để object không bị tạo lại), hoặc vòng CAS với {{AtomicLong.compareAndSet}} khi cần độ trễ thấp; khi có nhiều instance — chuyện mặc định trên Kubernetes, vì autoscaling sinh thêm JVM — thì khoá trong JVM vô dụng, con số chung phải nằm ở tầng dữ liệu dùng chung và phép thử phải **nguyên tử phía server** (Lua script trên Redis, hoặc {{UPDATE ... WHERE spent + :amt <= :limit}} rồi đếm số dòng bị ảnh hưởng). Về phía tiền, dùng {{long}} đồng chẵn hoặc {{BigDecimal}}, tránh overflow bằng cách so {{amount > limit - spent}}. Về phía ngày, tính {{LocalDate.now(clock)}} với Clock mang {{ZoneId.of("Asia/Ho_Chi_Minh")}} và giữ theo bucket ngày để không mất số liệu hôm qua. Cuối cùng là test: 16 thread qua {{CountDownLatch}} barrier, asserts **đúng N** lần thành công, lặp 30–50 vòng, không dùng {{Thread.sleep}}.`,
    exercises: [
      {
        title: 'DailyLimit.tryConsume an toàn với 16 thread',
        prompt: `Viết class {{DailyLimit}} quản lý **hạn mức tiền trong một ngày cho từng tài khoản**, dùng {{long}} cho số tiền (đơn vị đồng chẵn) và {{Clock}} để xác định "hôm nay là ngày nào".

Chữ ký bắt buộc:
- {{DailyLimit(Clock clock, long limitPerDay)}} — {{Clock}} mang theo múi giờ, hãy lấy ngày bằng {{LocalDate.now(clock)}}.
- {{boolean tryConsume(String account, long amount)}} — nguyên tử: **đọc và cộng trong cùng một vùng khoá**. Trả {{true}} nếu tổng trong ngày vẫn không vượt {{limitPerDay}}, {{false}} nếu vượt (và khi đó **không** trừ gì cả).
- {{long spent(String account)}} — tổng đã chi của **ngày hiện tại**.
- {{long spentOn(String account, LocalDate day)}} — tổng đã chi của một ngày cụ thể (ngày cũ không bị xoá).
- {{long remaining(String account)}} — còn được chi bao nhiêu nữa trong ngày, không bao giờ trả số âm.
- {{int trackedAccounts()}} — số tài khoản đã được tạo bucket.

Quy tắc biên (đều ném {{IllegalArgumentException}}): {{account}} {{null}} hoặc rỗng; {{amount <= 0}}; {{limitPerDay < 0}} (kiểm tra ở constructor).

Hai điều kiện mà test sẽ kiểm tra thẳng:
1. 16 thread cùng gọi {{tryConsume("CA/a", 3000)}} trên hệ hạn mức 20000 ⇒ **chính xác 6** lần trả {{true}} và {{spent}} đúng bằng 18000, ở **mọi** vòng chạy.
2. Tài khoản này không được chặn tài khoản khác: 16 tài khoản, mỗi tài khoản 4 thread cùng tiêu 2500 với hạn mức 10000 ⇒ mỗi tài khoản tiêu đúng 10000.`,
        starter: `import java.time.*;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

class DailyLimit {
    private final Clock clock;
    private final long limitPerDay;
    private final Map<String, Bucket> buckets = new ConcurrentHashMap<>();

    DailyLimit(Clock clock, long limitPerDay) {
        if (limitPerDay < 0) throw new IllegalArgumentException("limitPerDay phai khong am");
        this.clock = clock;
        this.limitPerDay = limitPerDay;
    }

    protected LocalDate today() {
        return LocalDate.now(clock);
    }

    private Bucket bucket(String account) {
        return buckets.computeIfAbsent(account, k -> new Bucket());
    }

    boolean tryConsume(String account, long amount) {
        throw new UnsupportedOperationException("TODO");
    }

    long spent(String account) {
        throw new UnsupportedOperationException("TODO");
    }

    long spentOn(String account, LocalDate day) {
        throw new UnsupportedOperationException("TODO");
    }

    long remaining(String account) {
        throw new UnsupportedOperationException("TODO");
    }

    int trackedAccounts() {
        return buckets.size();
    }

    static final class Bucket {
        private final Map<LocalDate, Long> byDay = new HashMap<>();

        long totalOn(LocalDate day) {
            throw new UnsupportedOperationException("TODO");
        }

        void add(long amount, LocalDate day) {
            throw new UnsupportedOperationException("TODO");
        }
    }
}`,
        tests: `public class Main {
    static int passed = 0, total = 0;
    static void check(String name, boolean ok, String detail) {
        total++;
        if (ok) { passed++; System.out.println("PASS " + name); }
        else System.out.println("FAIL " + name + ": " + detail);
    }
    static boolean expect(Class<? extends Exception> type, Runnable r) {
        try { r.run(); return false; }
        catch (Exception ex) { return type.isInstance(ex); }
    }

    // Test chay trong 2 phut nen can thay "hom nay la ngay nao": cai ham today() de quay sang ngay ke tiep.
    static final class OnDay extends DailyLimit {
        private LocalDate day;
        OnDay(LocalDate firstDay, long limitPerDay) {
            super(Clock.fixed(Instant.parse("2026-11-05T02:00:00Z"), ZoneId.of("Asia/Ho_Chi_Minh")), limitPerDay);
            this.day = firstDay;
        }
        void setDay(LocalDate d) { day = d; }
        @Override protected LocalDate today() { return day; }
    }

    public static void main(String[] args) throws Exception {
        ZoneId vn = ZoneId.of("Asia/Ho_Chi_Minh");
        Clock morning = Clock.fixed(Instant.parse("2026-11-05T02:00:00Z"), vn);   // 09:00 ngay 05/11 gio VN
        DailyLimit dl = new DailyLimit(morning, 100000);

        check("con_du_thi_cho_qua", dl.tryConsume("CA/a", 60000) && dl.tryConsume("CA/a", 35000), "spent=" + dl.spent("CA/a"));
        check("spent_dung_tong", dl.spent("CA/a") == 95000, "spent=" + dl.spent("CA/a"));
        check("vuot_thi_tu_choi", !dl.tryConsume("CA/a", 6000), "");
        check("tu_choi_khongtru_tien", dl.spent("CA/a") == 95000, "spent=" + dl.spent("CA/a"));
        check("vua_han_muc_thi_duoc", dl.tryConsume("CA/a", 5000) && dl.spent("CA/a") == 100000, "spent=" + dl.spent("CA/a"));
        check("day_han_muc_tu_choi_moi_lenh", !dl.tryConsume("CA/a", 1) && dl.spent("CA/a") == 100000, "spent=" + dl.spent("CA/a"));
        check("remaining_bang_0_khi_day", dl.remaining("CA/a") == 0, "remaining=" + dl.remaining("CA/a"));
        check("remaining_dung_khi_con", dl.remaining("CA/never") == 100000, "remaining=" + dl.remaining("CA/never"));
        check("tai_khoan_khong_lien_quan", dl.spent("CA/other") == 0 && dl.tryConsume("CA/other", 100000), "");

        check("so_0_bi_tu_choi", expect(IllegalArgumentException.class, () -> dl.tryConsume("CA/a", 0)), "amount=0 phai bi tu choi");
        check("so_am_bi_tu_choi", expect(IllegalArgumentException.class, () -> dl.tryConsume("CA/a", -50000000)), "so am de mua lai han muc");
        check("sau_khi_loi_so_du_khong_doi", dl.spent("CA/a") == 100000, "spent=" + dl.spent("CA/a"));
        check("account_trong_bi_tu_choi", expect(IllegalArgumentException.class, () -> dl.tryConsume("", 100)), "");
        check("account_null_bi_tu_choi", expect(IllegalArgumentException.class, () -> dl.tryConsume(null, 100)), "");
        check("limit_am_bi_tu_choi_o_constructor", expect(IllegalArgumentException.class, () -> new DailyLimit(morning, -1)), "");

        DailyLimit d2 = new DailyLimit(morning, 100000);
        d2.tryConsume("CA/x", 1000);
        d2.tryConsume("CA/y", 1000);
        check("bucket_tao_mot_lan_per_account", d2.trackedAccounts() == 2, "tracked=" + d2.trackedAccounts());

        // ngay duoc tinh theo vung gio cua Clock, khong phai UTC
        DailyLimit dl2 = new DailyLimit(Clock.fixed(Instant.parse("2026-11-05T17:30:00Z"), vn), 100000);
        check("nua_dem_utc_la_ngay_moi_cua_VN", dl2.tryConsume("CA/a", 70000)
            && dl2.spentOn("CA/a", LocalDate.of(2026, 11, 6)) == 70000
            && dl2.spentOn("CA/a", LocalDate.of(2026, 11, 5)) == 0,
            "spent 06/11=" + dl2.spentOn("CA/a", LocalDate.of(2026, 11, 6)) + " 05/11=" + dl2.spentOn("CA/a", LocalDate.of(2026, 11, 5)));

        // reset khi sang ngay moi: han muc duoc lam lai, ngay cu van giu duoc de doi soat
        OnDay dl3 = new OnDay(LocalDate.of(2026, 11, 5), 50000);
        dl3.tryConsume("CA/a", 50000);
        long yesterday = dl3.spent("CA/a");
        dl3.setDay(LocalDate.of(2026, 11, 6));
        check("sang_ngay_moi_con_han_muc", dl3.spent("CA/a") == 0 && dl3.remaining("CA/a") == 50000, "spent=" + dl3.spent("CA/a"));
        check("sang_ngay_moi_chi_duoc", dl3.tryConsume("CA/a", 30000) && dl3.spent("CA/a") == 30000, "spent=" + dl3.spent("CA/a"));
        check("ngay_cu_khong_bi_xoa", dl3.spentOn("CA/a", LocalDate.of(2026, 11, 5)) == yesterday, "hom qua=" + dl3.spentOn("CA/a", LocalDate.of(2026, 11, 5)));

        // RACE: 16 thread cung tranh 20000, moi lenh 3000 => dung 6 lenh, spent 18000
        int rounds = 40, badSuccess = 0, badSpent = 0, maxSuccess = 0;
        for (int r = 0; r < rounds; r++) {
            DailyLimit rl = new DailyLimit(Clock.systemUTC(), 20000);
            java.util.concurrent.atomic.AtomicInteger ok = new java.util.concurrent.atomic.AtomicInteger();
            CountDownLatch gate = new CountDownLatch(1);
            CountDownLatch done = new CountDownLatch(16);
            for (int t = 0; t < 16; t++) {
                new Thread(() -> {
                    try { gate.await(); } catch (InterruptedException e) { Thread.currentThread().interrupt(); }
                    if (rl.tryConsume("CA/hot", 3000)) ok.incrementAndGet();
                    done.countDown();
                }).start();
            }
            gate.countDown();
            done.await();
            if (ok.get() != 6) { badSuccess++; maxSuccess = Math.max(maxSuccess, ok.get()); }
            if (rl.spent("CA/hot") != 18000) badSpent++;
        }
        check("khong_bao_gio_vuot_han_muc_voi_16_thread", badSuccess == 0 && badSpent == 0,
            "rounds sai so lenh=" + badSuccess + ", rounds sai so du=" + badSpent + ", nhieu lenh nhat mot vong=" + maxSuccess);

        // Nhieu tai khoan song song: tai khoan nay khong duoc chan/lan tai khoan kia
        int accs = 16, threadsPer = 4, wrong = 0;
        DailyLimit ml = new DailyLimit(Clock.systemUTC(), 10000);
        CountDownLatch g2 = new CountDownLatch(1);
        CountDownLatch d2l = new CountDownLatch(accs * threadsPer);
        for (int a = 0; a < accs; a++) {
            final String acc = "CA/" + a;
            for (int t = 0; t < threadsPer; t++) {
                new Thread(() -> {
                    try { g2.await(); } catch (InterruptedException e) { Thread.currentThread().interrupt(); }
                    ml.tryConsume(acc, 2500);
                    d2l.countDown();
                }).start();
            }
        }
        g2.countDown();
        d2l.await();
        for (int a = 0; a < accs; a++) if (ml.spent("CA/" + a) != 10000) wrong++;
        check("16_tai_khoan_song_song_khong_lan_nhau", wrong == 0, "sai=" + wrong);
        check("moi_tai_khoan_du_bat_4_lenh", ml.trackedAccounts() == accs, "tracked=" + ml.trackedAccounts());

        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
        reference: `import java.time.*;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

class DailyLimit {
    /** Moi tai khoan co mot Bucket rieng: object nay duoc dung lam khoa, nen cac tai khoan khong chan nhau. */
    static final class Bucket {
        private final Map<LocalDate, Long> byDay = new HashMap<>();

        long totalOn(LocalDate day) {
            return byDay.getOrDefault(day, 0L);
        }

        void add(long amount, LocalDate day) {
            byDay.put(day, totalOn(day) + amount);
        }

        boolean tryAdd(long amount, long limitPerDay, LocalDate day) {
            long spent = totalOn(day);
            // So theo phap tru: "spent + amount > limit" co the tran (overflow) long khi amount rat lon.
            if (amount > limitPerDay - spent) return false;
            add(amount, day);
            return true;
        }
    }

    private final Clock clock;
    private final long limitPerDay;
    private final Map<String, Bucket> buckets = new ConcurrentHashMap<>();

    DailyLimit(Clock clock, long limitPerDay) {
        if (limitPerDay < 0) throw new IllegalArgumentException("limitPerDay phai khong am");
        this.clock = clock;
        this.limitPerDay = limitPerDay;
    }

    protected LocalDate today() {
        return LocalDate.now(clock);   // vung gio lay tu Clock, khong tu he thong
    }

    private Bucket bucket(String account) {
        return buckets.computeIfAbsent(account, k -> new Bucket());
    }

    boolean tryConsume(String account, long amount) {
        if (account == null || account.isEmpty()) throw new IllegalArgumentException("thieu tai khoan");
        if (amount <= 0) throw new IllegalArgumentException("so tien phai duong");
        Bucket b = bucket(account);
        LocalDate day = today();
        synchronized (b) {                 // mot vung nguyen tu cho ca KIEM TRA lan GHI
            return b.tryAdd(amount, limitPerDay, day);
        }
    }

    long spent(String account) {
        return spentOn(account, today());
    }

    long spentOn(String account, LocalDate day) {
        if (day == null) throw new IllegalArgumentException("thieu ngay");
        Bucket b = bucket(account);
        synchronized (b) {
            return b.totalOn(day);
        }
    }

    long remaining(String account) {
        long left = limitPerDay - spent(account);
        return left > 0 ? left : 0;
    }

    int trackedAccounts() {
        return buckets.size();
    }
}`,
        hints: [
          'Bất biến cần giữ: **không được có khoảng trống giữa lệnh đọc và lệnh ghi**. Bọc {{synchronized (b)}} quanh **cả** phép so sánh lẫn phép cộng (gộp thành một hàm {{tryAdd}} như gợi ý bên dưới); nếu chỉ bọc phép cộng thì vẫn còn check-then-act.',
          'Lấy object khoá phải **ổn định theo tài khoản**: {{buckets.computeIfAbsent(account, k -> new Bucket())}}. Nếu bạn tự {{new Bucket()}} mỗi lần gọi thì hai thread sẽ khoá hai object khác nhau và {{synchronized}} mất tác dụng.',
          'So sánh bằng {{amount > limitPerDay - spent}} chứ không bằng {{spent + amount > limitPerDay}} — vế sau có thể tràn {{long}} khi số tiền cực lớn, và số tràn sẽ **đảo dấu**.',
          '{{Bucket}} nên giữ {{Map<LocalDate, Long>}} thay vì một con số duy nhất: sang ngày mới thì {{spent("CA/a")}} tự về 0 mà số liệu hôm qua vẫn còn để đối soát.',
          '{{tryConsume}} phải từ chối {{amount <= 0}} **trước khi** đụng tới khoá: số âm sẽ *cộng* tiền vào {{spent}} và mua lại hạn mức.',
        ],
        explain: `Test bắt bốn lớp lỗi, và mỗi lớp tương ứng một câu hỏi phỏng vấn thật.

1. **Chuỗi đọc–sửa–ghi phải nằm trong một vùng nguyên tử.** Bản viết sai — dạng {{if (spent + amount <= limit) spent += amount}} để hai bước **ngoài** khoá — chạy đơn luồng thì luôn đúng; chạy 16 thread tranh nhau 20.000 với mỗi lệnh 3.000 thì có vòng cho 7–8 lệnh qua, tức tiêu 21.000–24.000. Code tham khảo bọc {{synchronized (b)}} quanh {{b.tryAdd(...)}} nên **luôn** trả về chính xác 6 lệnh và {{spent == 18000}} ở cả 40 vòng. Bất biến được kiểm bằng con số chính xác, không phải "khoảng chấp nhận được" — đó là cách viết test đồng thời đúng.

2. **Hạt khoá quyết định sinh tử về hiệu năng.** Khoá {{this}} cũng đúng, nhưng một tài khoản hot sẽ biến toàn bộ hạn mức của ngân hàng thành một hàng đợi. Vì mỗi {{Bucket}} được tạo **một lần** qua {{computeIfAbsent}} (phép này của {{ConcurrentHashMap}} đã nguyên tử — hai thread cùng tới trước cũng chỉ một {{Bucket}} được tạo), nên "{{wrong == 0}}" ở phần 16 tài khoản × 4 thread chứng minh các tài khoản không lấn nhau cả về dữ liệu lẫn về tiến độ.

3. **"Ngày" là dữ liệu, không phải thời gian hệ thống.** {{LocalDate.now(clock)}} với Clock mang {{Asia/Ho_Chi_Minh}} làm cho khoảnh khắc {{2026-11-05T17:30:00Z}} (bản chất là UTC) rơi vào **06/11** theo giờ Việt Nam, và test assert đúng ngày đó. Nếu bạn dùng {{Instant.now()}} hay {{LocalDate.now()}} theo hệ thống, cùng một giao dịch sẽ bị tính sang hai ngày khác nhau tùy server đặt ở vùng giờ nào — và không test nào phát hiện được.

4. **Số tiền và số lần phải được bảo vệ ở cửa vào.** {{amount <= 0}} và {{account}} rỗng bị chặn trước khi lấy khoá, nên không có đường nào để "cộng tiền âm" làm giảm {{spent}}. Test còn cố tình chạy {{tryConsume}} thất bại rồi assert {{spent}} không đổi, vì bug phổ biến là ghi {{spent}} trước rồi mới trả {{false}}.

**Không đủ** để chỉ làm bài này đúng: {{tryConsume}} không idempotent. Hai request cùng một txId sẽ bị trừ hai lần, và ở production đó mới là nguồn vượt hạn mức số một. Vì vậy sau bước kiểm tra hạn mức vẫn phải có bước kiểm tra txId đã tiêu hạn mức chưa (bài 5, 6). Nếu hệ thống chạy nhiều instance, {{synchronized}} chỉ là **một phần** của lời giải — phần còn lại là phép nguyên tử ở tầng dữ liệu chung (Redis Lua / UPDATE có điều kiện), xem mục so sánh trong bài.`,
      },
    ],
    check: [
      { q: 'Điều gì làm phép kiểm tra hạn mức bị sai khi có nhiều thread?', options: ['Vì đọc {{spent}} chậm hơn ghi', 'Vì kiểm tra và ghi là hai bước tách rời, thread khác chen vào giữa', 'Vì {{long}} không cộng được song song', 'Vì HashMap không sắp thứ tự'], answer: 1, explain: 'Check-then-act: dữ liệu đọc ở bước kiểm tra đã cũ khi bước ghi chạy. Chỉ khoá gộp cả hai bước mới sửa được' },
      { q: 'Vì sao nên khoá theo từng tài khoản thay vì khoá cả service?', options: ['Vì khoá to hơn luôn an toàn hơn', 'Vì tài khoản chỉ có một hạn mức', 'Vì xung đột chỉ xảy ra trong cùng một tài khoản; khoá mịn giúp tài khoản khác không phải chờ', 'Vì {{synchronized}} không dùng được trên {{this}}'], answer: 2, explain: 'Hạt khoá (lock granularity) quyết định độ song song: một tài khoản hot không được phép chặn hàng nghìn tài khoản khác' },
      { q: 'Khi service chạy 10 instance trên Kubernetes, {{synchronized}} trong JVM còn đủ không?', options: ['Vẫn đủ, vì các instance nhìn chung một bộ nhớ', 'Không, mỗi instance là một JVM riêng; phép nguyên tử phải đẩy xuống Redis hoặc database', 'Chỉ cần thêm {{volatile}} cho biến đếm', 'Cần tăng số thread trong pool lên'], answer: 1, explain: 'Khoá chỉ có tác dụng trong một JVM. Nhiều instance phải dùng tài nguyên chung có lệnh nguyên tử phía server' },
      { q: 'Cách nào sau đây KHÔNG nên dùng khi test lỗi race?', options: ['Dùng hàng rào CountDownLatch cho các thread xuất phát cùng lúc', 'Assert một con số chính xác (đúng 6 lần thành công)', 'Chạy 40 vòng để tăng xác suất lộ lỗi', 'Dùng Thread.sleep 200 ms để hai thread chắc chắn chồng nhau'], answer: 3, explain: 'Sleep chỉ tăng xác suất, không đảm bảo; máy CI nhanh/chậm khác nhau khiến test lúc đỏ lúc xanh (flaky)' },
    ],
    related: ['banking-030', 'banking-023', 'banking-016'],
    tags: ['limit', 'concurrency', 'race condition', 'locking', 'clock', 'banking'],
  },

  {
    id: 'lesson-banking-009',
    track: 'banking',
    order: 9,
    title: 'Batch cuối ngày (EOD): tính lãi cho triệu tài khoản, chết giữa chừng vẫn chạy lại không trả tiền hai lần',
    level: 'senior',
    minutes: 40,
    goals: [
      'Nói được EOD là gì, cut-off là gì và vì sao ngân hàng buộc phải có batch chạy đêm',
      'Thiết kế job chạy lại an toàn: chìa khoá tự nhiên (tài khoản, ngày), checkpoint và chunk',
      'Tính lãi ngày bằng {{BigDecimal}} theo quy ước actual/365 và biết vì sao không được làm tròn về 0 đồng mỗi ngày',
      'Viết {{EodJob}} với {{accrue}} idempotent, {{run}} theo chunk, {{checkpoint}} resume được và danh sách {{failed}} không làm kẹt job',
    ],
    body: `### Chuyện thật: job chạy 6 tiếng, chết ở tiếng thứ 5

Hai giờ sáng, job **EOD (End Of Day — xử lý cuối ngày)** bắt đầu quét 1,2 triệu tài khoản để tính lãi tiền gửi, phí thường kỳ, cập nhật hạn mức, phân loại nợ. Bốn tiếng sau, một node bị OOM (out of memory — hết bộ nhớ cấp phát) và pod bị khởi động lại. Sáng ra, operations hỏi một câu quyết định mọi thứ: **"Chạy lại từ đầu, hay tiếp tục từ chỗ nó chết?"**

Nếu chạy lại **từ đầu** mà không có cơ chế chống trùng, 600.000 tài khoản đã được ghi lãi buổi đêm sẽ được ghi **lần hai**. Nếu **tiếp tục từ chỗ chết** mà không biết chỗ chết là đâu, 600.000 tài khoản kia không bao giờ được tính cho ngày hôm nay. Cả hai hướng đều là sự cố tiền, và hướng nào cũng đủ để một kiểm toán viên hỏi "ai duyệt quy trình này?".

### EOD là gì, cut-off là gì

- **EOD batch**: tập hợp việc ngân hàng *không thể* làm trong một request của khách, vì nó chạm tới **toàn bộ** khách hàng cùng lúc: tính và ghi lãi, trừ phí quản lý, phân loại nợ theo số ngày quá hạn, kết chuyển (gộp lãi vào gốc), lập sao kê cuối ngày, đối soát với NAPAS/core cũ (xem bài 2).
- **Cut-off time**: mốc giờ cắt ngày. 23:00 hôm nay nhận chuyển khoản thì được tính vào **hôm nay** hay **ngày làm việc kế tiếp** là do cut-off, và nó quyết định luôn **valueDate** (ngày tiền bắt đầu sinh lãi / được ghi sổ). Sai một tiếng ở cut-off là sai lãi của cả một ngày, trên hàng triệu tài khoản.
- Vì sao không tính lãi realtime trong từng request? Vì lãi phụ thuộc **số dư cả ngày** và **số ngày**, và vì ngân hàng cần một ngày kế toán chốt sổ (book close) để số liệu hai bên — lõi và báo cáo — khớp nhau.

### Ba câu hỏi sống còn của một con batch

| Câu hỏi | Tên trong ngành | Cách trả lời đúng |
|---|---|---|
| Chạy hai lần có trả tiền hai lần không? | **idempotent** (chạy lại bao nhiêu lần cũng cho cùng một kết quả) | Mỗi kết quả mang chìa khoá tự nhiên (tài khoản, ngày) — lần hai bị chặn tại cửa ghi |
| Chết giữa chừng có tiếp tục được không? | **resumable / checkpoint** | Lưu "tài khoản cuối đã xử lý" và đi tiếp sau nó, không quét lại từ đầu |
| Hai node cùng chạy thì sao? | **no double-run** | khoá/lease theo (job, ngày) hoặc chia shard theo dải tài khoản |

### Checkpoint hoạt động thế nào

~~~seq
title: EOD chay theo chunk co checkpoint
actors: Scheduler | EodJob | AccountDB | LedgerDB
Scheduler -> EodJob: run(ngay 05/11, chunk 50.000)
EodJob -> AccountDB: lay 50.000 tai khoan sau checkpoint
EodJob -> LedgerDB: ghi lai + danh dau (account, 05/11)
note EodJob..LedgerDB: mot transaction cho ca hai — không ghi nửa
EodJob --> Scheduler: ok 50.000, checkpoint = A050000
Scheduler -> EodJob: run tiep (bat dau sau A050000)
EodJob --> Scheduler: het danh sach, checkpoint = null
~~~

**Checkpoint** chỉ là một dòng dữ liệu: "(job=EOD-INTEREST, day=2026-11-05, last=A050000)". Nó **không** phải machine để đếm tiền, mà là "đã làm tới đâu". Vì nó chỉ tiết kiệm thời gian quét lại — chứ **không** phải thứ bảo vệ tiền — nên điều kiện bắt buộc là: mất checkpoint vẫn không được trả tiền hai lần. Cái bảo vệ tiền là **chìa khoá tự nhiên (account, valueDate)** trên chính bản ghi kết quả.

### Idempotency: chìa khoá tự nhiên thắng mọi cơ chế khác

Mỗi lần ghi lãi, ghi kèm ngày. Muốn biết "ngày này tài khoản này đã chưa", chỉ cần hỏi một điều kiện:

~~~java
// "đã tính lãi cho (account, day) chưa?" — câu hỏi này trả lời được ngay cả khi checkpoint bị mất
LocalDate lastDay = lastAccruedDay.get(account);
if (day.equals(lastDay)) return false;   // lần chạy thứ hai trong ngày: no-op, không cộng thêm gì
~~~

Có ba tầng chống trùng, và production nên có cả ba:
1. **Chìa khoá tự nhiên (account, valueDate)** UNIQUE trong DB: ghi trùng sẽ bị DB từ chối — tầng mạnh nhất, vì nó nằm ở nơi dữ liệu sống.
2. **Checkpoint**: tiết kiệm công sức quét lại, giảm thời gian chạy từ nhiều tiếng xuống vài phút.
3. **Job run table** (trạng thái RUNNING/SUCCESS/FAILED theo ngày): chặn một *ngày* được khởi động hai lần, và cho phép phân biệt "chạy lại vì hỏng" với "chạy lại vì người vận hành bấm nhầm".

> Lưu ý: đừng chống trùng bằng "đã chạy bao giờ chưa" ở biến trong bộ nhớ ({{boolean isRunning}}). Node khác không nhìn thấy nó, và sau khi restart thì nó trở về false — đó đúng là cái cách mà sự cố tiền hai lần xảy ra.

### Lãi ngày: actual/365 và bẫy làm tròn

Quy ước phổ biến ở Việt Nam là **actual/365**: lãi ngày = {{dư nợ}} × {{lãi suất năm}} ÷ 365, số ngày thực tế của kỳ. Với {{BigDecimal}}, phép chia **bắt buộc** phải nói rõ lấy mấy chữ số và làm tròn kiểu gì, nếu không nó ném {{ArithmeticException}} (số vô tỉ như 1/3):

~~~java
BigDecimal interest = balance.multiply(annualRate)          // 100.000.000 x 0,04
        .divide(new BigDecimal("365"), 2, RoundingMode.HALF_UP);   // -> 10.958,90 dong/ngay
~~~

Hai điểm senior hay bị hỏi lại:
- **Vì sao giữ scale 2 (hai chữ số) thay vì làm tròn về đồng chẵn mỗi ngày?** Vì tài khoản nhỏ (số dư 1.000đ, lãi 0,11đ/ngày) sẽ bị làm tròn thành **0 đồng** mỗi ngày, tức khách *không bao giờ* nhận được lãi, và tổng đối soát lãi phải trả sẽ lệch dần. Ngân hàng **ghi nhận (accrue) bằng số có phần lẻ**, rồi làm tròn **một lần** khi kết chuyển sang tài khoản (cuối kỳ) — cùng tinh thần "làm tròn một lần ở biên giới" của bài 1 và bài 7.
- **365 hay 366?** Năm nhuận theo quy ước actual/actual sẽ là 366; điều quan trọng không phải chọn số nào mà là **một hợp đồng chỉ dùng một quy ước**, lưu quy ước đó trong dữ liệu và tính đúng số ngày của kỳ (xem câu banking-011).

### Chunk: vì sao không xử lý hết trong một transaction

1,2 triệu tài khoản trong một transaction sẽ: (a) giữ lock quá lâu, (b) đầy undo log / replication lag, (c) nếu chết thì **mất sạch** tiến độ. Nên batch đi từng **chunk** (mảng con công việc, ví dụ 50.000 tài khoản), mỗi chunk một transaction, commit xong mới ghi checkpoint của chunk đó. Thứ tự hai bước này là bắt buộc:

| Thứ tự | Nếu crash ngay sau bước 1 | Kết quả |
|---|---|---|
| commit chunk → ghi checkpoint | mất checkpoint, nhưng dữ liệu đã ghi có chìa khoá (account, day) | chạy lại: chunk đó bị bỏ qua, **đúng** |
| ghi checkpoint → commit chunk | checkpoint nói "đã xong" nhưng giao dịch bị rollback | **mất tiền của khách**, chunk đó không bao giờ được làm |

Vì vậy: **checkpoint luôn là bước sau**, và checkpoint có thể mất mà không sao.

### Tài khoản lỗi không được phép làm kẹt cả đoàn tàu

Batch đụng dữ liệu bẩn mỗi đêm: số dư âm do bug, tài khoản đã tất toán, mã sản phẩm không còn. Nếu một {{IllegalArgumentException}} làm đứt cả vòng lặp, job đứng ở đúng tài khoản đó **mãi mãi** (checkpoint không đi tiếp được) — người ta gọi là **poisoned record**. Cách xử lý:

~~~java
for (String id : ids) {
    try { accrue(id, balances.get(id)); }
    catch (IllegalArgumentException bad) { failed.add(id); }   // ghi lại, bỏ qua, checkpoint vẫn tiến
}
~~~

Kèm hai điều kiện: mỗi id chỉ xuất hiện trong danh sách lỗi **một lần** (không spam log 40 lần khi job retry), và danh sách lỗi phải được **đổ ra monitoring** để con người xử lý — batch "thành công 99,98%" nhưng âm thầm bỏ 2.400 tài khoản là một sự cố chưa được gọi tên.

### Hai node cùng chạy một đêm

Rất nhiều sự cố xảy ra khi node A chạy chậm qua 2h, người vận hành tưởng job chết nên bấm chạy lại trên node B, hai bên cùng tính lãi cho 05/11. Chìa khoá (account, day) vẫn cứu tiền, nhưng hai node vẫn **đè tài nguyên** của nhau. Cách chặn: một bản ghi "lease" (nhượng quyền) kiểu {{EOD_INTEREST / 2026-11-05 / owner=nodeA / expires_at=03:30}} với UPDATE có điều kiện — ai giành được lease mới được chạy, lease hết hạn thì node khác được giành. Hoặc chia **shard**: node A xử lý tài khoản có id đuôi 0–4, node B xử lý 5–9 — hai dải không giao nhau, không cần thương lượng.

### Những chỗ hay sai nhất

- Kiểm tra "đã chạy chưa" bằng {{if (processedCount > 0)}} — chỉ đúng trong một lần chạy, không survive restart.
- Quên rằng batch cũng cần **Clock inject**: "hôm nay là ngày nào" quyết định valueDate và quyết định chunk này thuộc kỳ nào.
- Dùng {{double}} cho lãi: 100.000.000 × 0,04 / 365 tính bằng double cho 10958,904109589042, và sau 1,2 triệu tài khoản thì con số sai thành hàng chục triệu đồng (xem bài 1).
- Đặt tên {{run()}} rồi bên trong vừa tính vừa **ghi luôn** mà không có hàm thuần để test — sau này muốn test chỉ từng tài khoản một phải mock cả DB.
- In checkpoint ra log nhưng không lưu ở đâu cả → restart là mất.

> Senior tip: Câu hỏi phỏng vấn phân biệt người từng chạy batch với người chỉ đọc tài liệu là: *"Nếu job chết ở tài khoản thứ 700.000 và bạn chỉ còn 90 phút trước khi hệ thống lõi (core banking — phần mềm kế toán trung tâm của ngân hàng) mở cửa, bạn làm gì?"*. Trả lời theo ba bước: (1) bật lại với **cùng valueDate**, job tự đi tiếp sau checkpoint — chi phí vài phút, không mất dữ liệu; (2) kiểm tra bằng truy vấn đếm "số tài khoản có bản ghi lãi cho ngày 05/11" chia cho tổng số tài khoản hợp lệ, thay vì tin log; (3) nếu không kịp, chạy nốt phần còn lại trên node khác theo dải tài khoản **sau** node đầu, vì chìa khoá (account, day) khiến phần chồng lấn trở thành no-op. Nhấn: idempotency nằm ở tầng dữ liệu, checkpoint chỉ là tối ưu.

### Liên hệ phỏng vấn

**Câu hỏi:** "Bạn thiết kế batch tính lãi cuối ngày cho 1,2 triệu tài khoản thế nào để chạy lại an toàn?"

**Cách trả lời:** Ba lớp. **(1) Kết quả mang chìa khoá tự nhiên**: mỗi bản ghi lãi lưu (account, valueDate) với ràng buộc UNIQUE, nên ghi lần hai trong cùng ngày là no-op — đây là tầng bảo vệ tiền, và nó đúng kể cả khi mất toàn bộ trạng thái của job. **(2) Checkpoint theo chunk**: job đi từng lô (ví dụ 50.000 tài khoản, sắp xếp theo id), commit chunk trong một transaction **cùng chỗ** với việc ghi dấu "đã tính lãi", sau đó mới cập nhật checkpoint "tài khoản cuối đã xử lý"; thứ tự phải là commit trước — checkpoint sau, vì ngược lại thì crash sẽ làm **mất** chunk đó vĩnh viễn. **(3) Chống chạy trùng hai node**: một bảng job-run/lease theo (job, ngày) với UPDATE có điều kiện, hoặc chia shard theo dải tài khoản khi muốn hai node cùng chạy cho kịp giờ. Cộng thêm chi tiết nghiệp vụ: lãi theo actual/365 bằng {{BigDecimal}} scale 2 để tài khoản nhỏ không bị làm tròn về 0 đồng mỗi ngày, làm tròn một lần khi kết chuyển; tài khoản dữ liệu bẩn được bỏ qua và ghi vào danh sách lỗi để monitoring, không làm checkpoint kẹt; và "hôm nay là ngày nào" lấy từ {{Clock}} inject để test deterministic.`,
    exercises: [
      {
        title: 'EodJob: accrue idempotent, run theo chunk, checkpoint resume',
        prompt: `Viết hai class mô phỏng một phần batch EOD bằng Java thuần.

{{Accrual}} — tính lãi **một ngày** cho **một tài khoản**, quy ước actual/365:
- {{Accrual(BigDecimal annualRate)}} — {{annualRate}} là lãi suất năm dạng số thập phân ({{0.04}} = 4%/năm); {{null}} hoặc âm ⇒ {{IllegalArgumentException}}.
- {{BigDecimal interestFor(BigDecimal balance)}} = {{balance}} × {{annualRate}} ÷ 365, làm tròn {{HALF_UP}} về **scale 2** và **trả về scale 2** (kể cả khi kết quả là 0 thì vẫn là {{0.00}}). {{balance}} {{null}} hoặc âm ⇒ {{IllegalArgumentException}}.

{{EodJob}} — chạy batch ghi lãi:
- {{EodJob(Accrual accrual, Clock clock)}} — "hôm nay là ngày nào" phải lấy từ {{clock}} (hàm {{today()}} đã viết sẵn).
- {{boolean accrue(String account, BigDecimal balance)}} — ghi lãi của **ngày hiện tại** cho một tài khoản. Trả {{true}} nếu vừa ghi, {{false}} nếu ngày này tài khoản đó **đã được ghi rồi** (no-op, không cộng thêm đồng nào). Đây là chìa khoá (account, day) — độc lập với checkpoint.
- {{int run(Map<String, BigDecimal> balances, int maxAccounts)}} — đi tiếp từ checkpoint, xét **tối đa** {{maxAccounts}} tài khoản theo thứ tự **tăng dần của id** (mỗi tài khoản được xét đều tính vào {{maxAccounts}}, kể cả bị bỏ qua vì đã ghi rồi), trả về số tài khoản **thực sự được ghi mới** trong lần gọi này. Tài khoản làm {{accrue}} ném {{IllegalArgumentException}} (dữ liệu bẩn) thì **bỏ qua**, ghi id vào {{failed()}} và **checkpoint vẫn tiến** — job không được kẹt. {{maxAccounts < 1}} ⇒ {{IllegalArgumentException}}.
- {{BigDecimal accrued(String account)}} — tổng lãi đã ghi của tài khoản (scale 2), tài khoản chưa biết ⇒ {{0.00}}.
- {{String checkpoint()}} — id tài khoản cuối đã xét **trong ngày hôm nay**, {{null}} nếu hôm nay chưa xét gì.
- {{void resetCheckpoint()}} — xoá con trỏ của ngày hôm nay (dùng khi ngày xong hoặc khi muốn mô phỏng node khác chưa biết gì). **Không** xoá kết quả đã ghi.
- {{List<String> failed()}} — các id lỗi của hôm nay, **mỗi id một lần**, theo thứ tự phát hiện.
- {{boolean alreadyAccruedToday(String account)}}.

{{account}} {{null}}/rỗng ⇒ {{IllegalArgumentException}}.`,
        starter: `import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.*;
import java.util.*;

class Accrual {
    private static final BigDecimal DAYS_IN_YEAR = new BigDecimal("365");
    private final BigDecimal annualRate;

    Accrual(BigDecimal annualRate) {
        throw new UnsupportedOperationException("TODO");
    }

    BigDecimal interestFor(BigDecimal balance) {
        throw new UnsupportedOperationException("TODO");
    }
}

class EodJob {
    private final Accrual accrual;
    private final Clock clock;
    private final Map<String, BigDecimal> totals = new HashMap<>();
    private final Map<String, LocalDate> lastAccruedDay = new HashMap<>();
    private final Map<String, LocalDate> lastFailedDay = new HashMap<>();
    private final List<String> failedToday = new ArrayList<>();
    private String checkpoint;
    private LocalDate checkpointDay;

    EodJob(Accrual accrual, Clock clock) {
        this.accrual = accrual;
        this.clock = clock;
    }

    protected LocalDate today() {
        return LocalDate.now(clock);
    }

    boolean accrue(String account, BigDecimal balance) {
        throw new UnsupportedOperationException("TODO");
    }

    int run(Map<String, BigDecimal> balances, int maxAccounts) {
        throw new UnsupportedOperationException("TODO");
    }

    BigDecimal accrued(String account) {
        throw new UnsupportedOperationException("TODO");
    }

    String checkpoint() {
        return checkpoint;
    }

    void resetCheckpoint() {
        throw new UnsupportedOperationException("TODO");
    }

    List<String> failed() {
        throw new UnsupportedOperationException("TODO");
    }

    boolean alreadyAccruedToday(String account) {
        throw new UnsupportedOperationException("TODO");
    }
}`,
        tests: `public class Main {
    static int passed = 0, total = 0;
    static void check(String name, boolean ok, String detail) {
        total++;
        if (ok) { passed++; System.out.println("PASS " + name); }
        else System.out.println("FAIL " + name + ": " + detail);
    }
    static boolean expect(Class<? extends Exception> type, Runnable r) {
        try { r.run(); return false; }
        catch (Exception ex) { return type.isInstance(ex); }
    }
    static BigDecimal bd(String s) { return new BigDecimal(s); }
    static boolean eq(BigDecimal a, String s) { return a.compareTo(bd(s)) == 0; }

    // Bat "hom nay" trong tay test: cai today() de quay sang ngay ke tiep ma khong phai doi gio may.
    static final class OnDay extends EodJob {
        private LocalDate day;
        OnDay(Accrual a, LocalDate first) {
            super(a, Clock.fixed(Instant.parse("2026-11-05T02:00:00Z"), ZoneId.of("Asia/Ho_Chi_Minh")));
            this.day = first;
        }
        void setDay(LocalDate d) { day = d; }
        @Override protected LocalDate today() { return day; }
    }

    static Map<String, BigDecimal> books(String... pairs) {
        Map<String, BigDecimal> m = new HashMap<>();
        for (int i = 0; i < pairs.length; i += 2) m.put(pairs[i], pairs[i + 1] == null ? null : bd(pairs[i + 1]));
        return m;
    }

    public static void main(String[] args) {
        Accrual ac = new Accrual(bd("0.04"));

        check("lai_100trieu_scale_2", eq(ac.interestFor(bd("100000000")), "10958.90") && ac.interestFor(bd("100000000")).scale() == 2,
            "lai=" + ac.interestFor(bd("100000000")));
        check("lai_trieu_dong_le", eq(ac.interestFor(bd("1000000")), "109.59"), "lai=" + ac.interestFor(bd("1000000")));
        check("lai_500ngan_le", eq(ac.interestFor(bd("500000")), "54.79"), "lai=" + ac.interestFor(bd("500000")));
        check("so_du_1_dong_lam_tron_ve_0_khong_phai_am", eq(ac.interestFor(bd("1")), "0") && ac.interestFor(bd("1")).scale() == 2,
            "lai=" + ac.interestFor(bd("1")));
        check("so_du_0_tra_ve_00", eq(ac.interestFor(bd("0")), "0"), "lai=" + ac.interestFor(bd("0")));
        check("so_du_am_bi_tu_choi", expect(IllegalArgumentException.class, () -> ac.interestFor(bd("-1000"))), "");
        check("so_du_null_bi_tu_choi", expect(IllegalArgumentException.class, () -> ac.interestFor(null)), "");
        check("lai_suat_am_bi_tu_choi", expect(IllegalArgumentException.class, () -> new Accrual(bd("-0.01"))), "");

        ZoneId vn = ZoneId.of("Asia/Ho_Chi_Minh");
        Clock day5 = Clock.fixed(Instant.parse("2026-11-05T02:00:00Z"), vn);   // 09:00 ngay 05/11 VN
        EodJob job = new EodJob(ac, day5);

        check("accrue_lan_dau_true", job.accrue("A001", bd("100000000")) && eq(job.accrued("A001"), "10958.90"), "tong=" + job.accrued("A001"));
        check("da_ghi_hom_nay_roi", job.alreadyAccruedToday("A001"), "");
        check("accrue_lan_hai_false_khong_nhan", !job.accrue("A001", bd("100000000")) && eq(job.accrued("A001"), "10958.90"), "tong=" + job.accrued("A001"));
        check("retry_voi_so_du_khac_van_no_op", !job.accrue("A001", bd("999999999")), "tong=" + job.accrued("A001"));
        check("account_chua_ghi_tong_bang_00", eq(job.accrued("ZZ"), "0") && job.accrued("ZZ").scale() == 2, "tong=" + job.accrued("ZZ"));
        check("account_rong_bi_tu_choi", expect(IllegalArgumentException.class, () -> job.accrue("", bd("1000"))), "");
        check("maxAccounts_0_bi_tu_choi", expect(IllegalArgumentException.class, () -> job.run(books("A002", "1000000"), 0)), "");
        check("balance_null_bi_tu_choi_khong_ghi", expect(IllegalArgumentException.class, () -> job.accrue("A009", null)) && eq(job.accrued("A009"), "0"), "");

        // run ca danh sach 4 tai khoan, A004 duoc 0 dong van phai duoc danh dau la xong
        EodJob j2 = new EodJob(ac, day5);
        Map<String, BigDecimal> four = books("A001", "100000000", "A002", "1000000", "A003", "500000", "A004", "1");
        check("run_xet_ca_bon", j2.run(four, 10) == 4, "checkpoint=" + j2.checkpoint());
        check("thu_tu_id_quyet_dinh_checkpoint", "A004".equals(j2.checkpoint()), "checkpoint=" + j2.checkpoint());
        check("lai_tung_tai_khoan_dung", eq(j2.accrued("A001"), "10958.90") && eq(j2.accrued("A002"), "109.59")
            && eq(j2.accrued("A003"), "54.79") && eq(j2.accrued("A004"), "0"), "A002=" + j2.accrued("A002"));
        check("tai_khoan_0_dong_cung_duoc_danh_dau", j2.alreadyAccruedToday("A004"), "");
        check("run_lai_khong_tinh_them", j2.run(four, 10) == 0 && eq(j2.accrued("A001"), "10958.90"), "tong=" + j2.accrued("A001"));

        // checkpoint di dung buoc: 5 tai khoan, moi dot 2
        EodJob j3 = new EodJob(ac, day5);
        Map<String, BigDecimal> five = books("A001", "1000000", "A002", "1000000", "A003", "1000000", "A004", "1000000", "A005", "1000000");
        check("chunk_1", j3.run(five, 2) == 2 && "A002".equals(j3.checkpoint()), "checkpoint=" + j3.checkpoint());
        check("chunk_2_tiep_tu_checkpoint", j3.run(five, 2) == 2 && "A004".equals(j3.checkpoint()), "checkpoint=" + j3.checkpoint());
        check("chunk_3_con_lai_1", j3.run(five, 1) == 1 && "A005".equals(j3.checkpoint()), "checkpoint=" + j3.checkpoint());
        check("chunk_4_khong_con_gi", j3.run(five, 5) == 0, "checkpoint=" + j3.checkpoint());
        check("moi_tai_khoan_dung_109_59", eq(j3.accrued("A005"), "109.59"), "A005=" + j3.accrued("A005"));

        // checkpoint mat (node moi chua biet gi) nhung tien khong duoc trai tay hai lan
        j3.resetCheckpoint();
        check("reset_checkpoint_ve_null", j3.checkpoint() == null, "checkpoint=" + j3.checkpoint());
        int again = j3.run(five, 5);
        check("checkpoint_mat_van_khong_chi_tien_hai_lan", again == 0 && eq(j3.accrued("A001"), "109.59"), "so ghi=" + again + " tong=" + j3.accrued("A001"));

        // du lieu ban o giua danh sach: bo qua, checkpoint van tien, failed khong trung lap
        EodJob j4 = new EodJob(ac, day5);
        Map<String, BigDecimal> dirty = books("A001", "1000000", "A002", "1000000", "B_BAD", "-500000", "C003", "1000000");
        check("loi_du_lieu_khong_lam_ket_job", j4.run(dirty, 10) == 3 && "C003".equals(j4.checkpoint()), "checkpoint=" + j4.checkpoint());
        check("id_loi_duoc_ghi_lai", j4.failed().size() == 1 && "B_BAD".equals(j4.failed().get(0)), "failed=" + j4.failed());
        check("tai_khoan_loi_khong_duoc_gi", eq(j4.accrued("B_BAD"), "0") && !j4.alreadyAccruedToday("B_BAD"), "");
        j4.resetCheckpoint();
        j4.run(dirty, 10);
        check("failed_khong_spam_khi_retry", j4.failed().size() == 1 && j4.run(dirty, 10) == 0, "failed=" + j4.failed());
        check("tai_khoan_loi_khong_bao_gio_am_tong", eq(j4.accrued("A001"), "109.59"), "A001=" + j4.accrued("A001"));

        // sang ngay moi: duoc tinh lai, va tong cong dan (accrual, chua ket chuyen)
        OnDay j5 = new OnDay(ac, LocalDate.of(2026, 11, 5));
        Map<String, BigDecimal> one = books("A001", "100000000");
        check("ngay_1", j5.run(one, 10) == 1 && eq(j5.accrued("A001"), "10958.90") && j5.checkpoint().equals("A001"), "cp=" + j5.checkpoint());
        j5.setDay(LocalDate.of(2026, 11, 6));
        check("checkpoint_khong_doi_qua_ngay", j5.checkpoint() == null, "cp=" + j5.checkpoint());
        check("ngay_2_tinh_tiep", j5.run(one, 10) == 1 && eq(j5.accrued("A001"), "21917.80"), "tong=" + j5.accrued("A001"));
        check("ngay_2_cung_id_van_no_op_trong_ngay", !j5.accrue("A001", bd("100000000")), "tong=" + j5.accrued("A001"));

        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
        reference: `import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.*;
import java.util.*;

class Accrual {
    private static final BigDecimal DAYS_IN_YEAR = new BigDecimal("365");
    private final BigDecimal annualRate;

    Accrual(BigDecimal annualRate) {
        if (annualRate == null || annualRate.signum() < 0) throw new IllegalArgumentException("lai suat khong hop le");
        this.annualRate = annualRate;
    }

    BigDecimal interestFor(BigDecimal balance) {
        if (balance == null) throw new IllegalArgumentException("thieu so du");
        if (balance.signum() < 0) throw new IllegalArgumentException("so du khong duoc am");
        // divide BẮT BUỘC kèm scale + RoundingMode: khong co la ArithmeticException khi thuong so vo han
        return balance.multiply(annualRate).divide(DAYS_IN_YEAR, 2, RoundingMode.HALF_UP);
    }
}

class EodJob {
    private final Accrual accrual;
    private final Clock clock;
    private final Map<String, BigDecimal> totals = new HashMap<>();
    private final Map<String, LocalDate> lastAccruedDay = new HashMap<>();
    private final Map<String, LocalDate> lastFailedDay = new HashMap<>();
    private final List<String> failedToday = new ArrayList<>();
    private String checkpoint;
    private LocalDate checkpointDay;

    EodJob(Accrual accrual, Clock clock) {
        this.accrual = accrual;
        this.clock = clock;
    }

    protected LocalDate today() {
        return LocalDate.now(clock);   // "hom nay" la du liệu inject, khong phai System.currentTime
    }

    private void rollDay() {
        LocalDate day = today();
        if (!day.equals(checkpointDay)) {   // sang ngay moi: con tro ve dau, ket qua cu giu nguyen
            checkpointDay = day;
            checkpoint = null;
            failedToday.clear();
        }
    }

    boolean accrue(String account, BigDecimal balance) {
        if (account == null || account.isEmpty()) throw new IllegalArgumentException("thieu tai khoan");
        LocalDate day = today();
        if (day.equals(lastAccruedDay.get(account))) return false;   // chi khoa (account, day)
        BigDecimal interest = accrual.interestFor(balance);
        totals.merge(account, interest, BigDecimal::add);
        lastAccruedDay.put(account, day);
        return true;
    }

    int run(Map<String, BigDecimal> balances, int maxAccounts) {
        if (maxAccounts < 1) throw new IllegalArgumentException("maxAccounts phai >= 1");
        if (balances == null) throw new IllegalArgumentException("thieu danh sach tai khoan");
        rollDay();
        List<String> ids = new ArrayList<>(balances.keySet());
        Collections.sort(ids);            // thu tu tang dan: "id > checkpoint" nghia la phan chua lam nam phia sau
        int credited = 0, examined = 0;
        for (String id : ids) {
            if (checkpoint != null && id.compareTo(checkpoint) <= 0) continue;
            if (examined == maxAccounts) break;
            examined++;
            checkpoint = id;              // checkpoint buoc tien, ke ca khi tai khoan loi -> job khong bi ket
            try {
                if (accrue(id, balances.get(id))) credited++;
            } catch (IllegalArgumentException dirtyData) {
                if (!today().equals(lastFailedDay.get(id))) {
                    lastFailedDay.put(id, today());
                    failedToday.add(id);
                }
            }
        }
        return credited;
    }

    BigDecimal accrued(String account) {
        return totals.getOrDefault(account, new BigDecimal("0.00"));
    }

    String checkpoint() {
        rollDay();                        // "hom nay" co the vua doi ma chua method nao duoc goi
        return checkpoint;
    }

    void resetCheckpoint() {
        rollDay();
        checkpoint = null;                // chi xoa con tro, khong xoa ket qua
    }

    List<String> failed() {
        return new ArrayList<>(failedToday);
    }

    boolean alreadyAccruedToday(String account) {
        return today().equals(lastAccruedDay.get(account));
    }
}`,
        hints: [
          'Chìa khoá chống trùng là cặp (tài khoản, ngày), **không phải** checkpoint. Giữ {{Map<String, LocalDate>}} "ngày cuối đã ghi cho tài khoản này" và trả {{false}} khi nó bằng hôm nay — nhờ vậy {{resetCheckpoint()}} rồi chạy lại vẫn không cộng tiền lần hai.',
          'Trong {{Accrual.interestFor}}, phép chia {{BigDecimal}} **bắt buộc** có scale và RoundingMode: {{divide(DAYS_IN_YEAR, 2, RoundingMode.HALF_UP)}}. Viết {{divide(DAYS_IN_YEAR)}} sẽ ném {{ArithmeticException}} vì thương có thể vô hạn.',
          '{{run}} nên: lấy danh sách id, {{Collections.sort}}, rồi duyệt và **bỏ qua mọi id nhỏ hơn hoặc bằng checkpoint** ({{id.compareTo(checkpoint) <= 0}}). Đó chính là "tiếp tục từ chỗ chết".',
          'Cập nhật {{checkpoint = id}} **trước** khi gọi {{accrue}} và đặt nó trong {{try/catch}}: nếu không, một tài khoản dữ liệu bẩn sẽ giữ job đứng lại mãi ở đúng id đó.',
          'Cần hai thứ riêng biệt: kết quả đã ghi (sống qua restart, dùng để chống trùng) và con trỏ ngày hôm nay ({{checkpointDay}}) — khi {{today()}} đổi ngày thì con trỏ về {{null}}, còn tổng lãi thì vẫn cộng dồn.',
        ],
        explain: `Test đi theo đúng thứ tự một vụ tai nạn thật xảy ra, và mỗi nhóm assert một tầng bảo vệ.

1. **Tính tiền đúng đã.** 100.000.000đ × 4%/năm theo actual/365 = 10.958,90đ/ngày ({{divide}} với scale 2 + {{HALF_UP}}). Số dư 1đ cho lãi 0,000109589đ → làm tròn thành {{0.00}} chứ **không** thành số âm hay mất dấu, và test bắt luôn {{scale() == 2}} để lời giải không trả {{0}} hay {{0.000}}: cùng một giá trị nhưng khác cách biểu diễn sẽ làm đối soát và JSON output lệch nhau. Đây là điểm mà {{BigDecimal}} khác {{double}} — {{double}} cho 10958.904109589042 và cộng dồn trên triệu tài khoản là sai số thật sự.

2. **Chống trùng nằm ở chìa khoá tự nhiên.** {{accrue("A001", ...)}} lần hai trả {{false}} và tổng **không đổi**, kể cả khi lần hai gửi kèm số dư khác ({{999999999}}) — test {{retry_voi_so_du_khac_van_no_op}} cố tình kiểm tra điều này: một batch retry thường mang theo snapshot số dư mới, và nếu bạn định "đã có rồi thì cập nhật theo số mới" thì đó chính là chỗ tiền bị ghi đè. Vì vậy ngày đã ghi thì **không đụng tới kết quả cũ**, muốn sửa phải dùng bút toán đảo (bài 5).

3. **Checkpoint chỉ là tối ưu.** Sau {{resetCheckpoint()}} — mô phỏng node mới chưa biết gì, hoặc checkpoint bị xoá cùng file temp — {{run}} vẫn trả **0** tài khoản được ghi, vì tầng 2 đã chặn. Đây chính là điều kiện "mất checkpoint vẫn không mất tiền" mà mục Body đã nói, và nó phân biệt idempotency thật với idempotency hình thức.

4. **Chunk và thứ tự.** Với {{maxAccounts}} = 2, các lần gọi trả 2, 2, 1 và checkpoint lần lượt A002, A004, A005. Bất biến quan trọng: tài khoản được xét **đúng một lần trong ngày** kể cả khi job bị gọi 5 lần. Muốn vậy phải duyệt theo thứ tự xác định ({{Collections.sort}}) — nếu duyệt theo {{HashMap}} thì thứ tự có thể đổi giữa hai lần chạy và checkpoint sẽ bỏ sót hoặc làm lại.

5. **Dữ liệu bẩn không được kẹt đoàn tàu.** {{B_BAD}} nằm giữa danh sách: {{run}} trả 3 (A001, A002, C003), checkpoint tới {{C003}}, {{failed()}} chỉ có một phần tử và **không tăng** khi chạy lại. Nếu bạn đặt {{checkpoint = id}} *sau* khi {{accrue}} thành công, tài khoản lỗi sẽ khiến checkpoint đứng tại {{A002}} và mọi lần chạy lại đều thất bại ở cùng chỗ — đây là bug poisoning kinh điển.

6. **Ngày kế tiếp.** Sang 06/11, {{checkpoint()}} là {{null}} (con trỏ thuộc về ngày, không phải toàn thời gian), {{run}} ghi tiếp và tổng lãi **cộng dồn** thành 21.917,80 — chưa kết chuyển vào gốc. Đó là hành vi thật của accrual: ngân hàng ghi lãi phải trả từng ngày vào tài khoản treo rồi mới capitalise theo chu kỳ; nếu cộng vào gốc mỗi ngày thì số dư ngày mai đã khác và công thức actual/365 bị sai.

Điều bài này **không** giả lập (và cũng là câu nên chủ động nói khi phỏng vấn): transaction thật, UNIQUE constraint và lease giữa các node. Trong code thuần, {{lastAccruedDay}} đóng vai trò dòng record có UNIQUE, {{checkpoint}} đóng vai trò bảng job-run — nhưng trên production cả hai phải nằm trong DB, vì tiến trình batch chết là mất sạch bộ nhớ.`,
      },
    ],
    check: [
      { q: 'Điều gì bảo vệ tiền khi batch bị chạy lại hai lần trong cùng một ngày?', options: ['Biến {{isRunning}} trong bộ nhớ job', 'Chìa khoá tự nhiên (tài khoản, ngày) trên bản ghi kết quả, tốt nhất là UNIQUE trong DB', 'Checkpoint lưu tài khoản cuối cùng', 'Log "job đã chạy" ghi ra file'], answer: 1, explain: 'Checkpoint chỉ tiết kiệm công quét lại; biến trong JVM mất khi restart. Chỉ dữ liệu đã ghi mang chìa khoá ngày mới chặn được lần ghi thứ hai' },
      { q: 'Vì sao phải commit chunk RỒI mới cập nhật checkpoint?', options: ['Vì ghi checkpoint chậm hơn', 'Vì làm ngược lại thì một chunk có thể bị checkpoint báo "xong" trong khi dữ liệu chưa commit và không bao giờ được làm lại', 'Vì checkpoint không được nằm trong cùng transaction', 'Vì chunk cần lock bảng checkpoint'], answer: 1, explain: 'Checkpoint trước + crash = chunk bị bỏ qua vĩnh viễn, tức mất tiền khách. Commit trước thì mất checkpoint chỉ tốn thời gian quét lại' },
      { q: 'Một tài khoản dữ liệu bẩn (số dư âm) giữa danh sách nên xử lý thế nào?', options: ['Dừng job và chờ người vận hành sửa', 'Ném exception để alert tự động bắt được', 'Ghi id vào danh sách lỗi, bỏ qua, checkpoint vẫn tiến', 'Tự đặt số dư về 0 rồi tính lãi'], answer: 2, explain: 'Đó là poisoned record: nếu checkpoint không tiến thì job đứng mãi ở id đó; im lặng bỏ qua mà không ghi ra monitoring thì 2.400 tài khoản mất lãi không ai biết' },
      { q: 'Vì sao không làm tròn lãi mỗi ngày về đồng chẵn?', options: ['Vì làm tròn nhiều lần bị chậm', 'Vì tài khoản nhỏ sẽ nhận 0 đồng mỗi ngày và tổng lãi phải trả lệch dần; accrue giữ phần lẻ, làm tròn một lần khi kết chuyển', 'Vì VND không có đơn vị nhỏ hơn 1 đồng', 'Vì BigDecimal không làm tròn được số nhỏ'], answer: 1, explain: 'Accrual là ghi nhận công nợ, chưa phải tiền trả; giữ scale 2 rồi mới làm tròn một lần ở kỳ kết chuyển (nguyên tắc làm tròn tại biên giới)' },
    ],
    related: ['banking-028', 'banking-011', 'banking-001'],
    tags: ['batch', 'eod', 'idempotency', 'checkpoint', 'bigdecimal', 'interest', 'banking'],
  },

);
