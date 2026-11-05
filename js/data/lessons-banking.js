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
  }

);
