/* Debug labs — category gc. Format: AGENTS.md section 10 (LABS). */
(window.LABS = window.LABS || []).push(
{
  id: 'lab-gc-001',
  category: 'gc',
  title: 'Export đối soát cuối ngày: humongous allocation đẩy G1 vào Full GC',
  level: 'senior',
  scenario: `**Bối cảnh:** Ngân hàng số **TinBank**, service **recon-export** (Spring Boot 3.2, JDK 17.0.10) xuất file Excel đối soát ATM cho từng chi nhánh. Pod 4 vCPU, memory limit 5Gi, JVM {{-Xms4g -Xmx4g -XX:+UseG1GC}}, GC log bật bằng {{-Xlog:gc*:file=/logs/gc.log:time,uptime,level,tags}}. Workbook được dựng bằng {{SXSSFWorkbook}} (streaming, giữ 100 dòng trong RAM), file lớn nhất khoảng 110–120 MB.

**Triệu chứng:** Lúc **22:00:30 ngày 21/10/2026**, job **recon-orchestrator** gọi API {{GET /api/recon/atm/daily}} cho 41 chi nhánh, **10 request song song**. Từ 22:01 đến 22:11: p99 của mọi endpoint trên pod tăng từ 420 ms lên **khoảng 8 giây**, Prometheus ghi nhận **9 lần Full GC**, CPU chỉ khoảng 1.7/4 core. Pod không bị OOMKilled, không có {{OutOfMemoryError}}. Sau 22:12 mọi thứ tự trở lại bình thường. Dev on-call nghi "memory leak" và đề xuất tăng heap lên 8 GB.

**Dữ liệu thu thập:** GC log của pod (đã lược bớt các đoạn lặp), mã nguồn controller export và mẫu sự kiện JFR {{jdk.ObjectAllocationSample}} ghi trong lúc sự cố.`,
  artifacts: [
    {
      name: 'gc-recon-export-2bqzn.log',
      lang: 'text',
      content: `[2026-10-21T20:55:00.012+0700][0.012s][info][gc,init] Version: 17.0.10+7 (release)
[2026-10-21T20:55:00.012+0700][0.012s][info][gc,init] CPUs: 4 total, 4 available
[2026-10-21T20:55:00.012+0700][0.012s][info][gc,init] Memory: 5120M
[2026-10-21T20:55:00.012+0700][0.012s][info][gc,init] Large Page Support: Disabled
[2026-10-21T20:55:00.012+0700][0.012s][info][gc,init] NUMA Support: Disabled
[2026-10-21T20:55:00.012+0700][0.012s][info][gc,init] Compressed Oops: Enabled (Zero based)
[2026-10-21T20:55:00.012+0700][0.012s][info][gc,init] Heap Region Size: 2M
[2026-10-21T20:55:00.012+0700][0.012s][info][gc,init] Heap Min Capacity: 4G
[2026-10-21T20:55:00.012+0700][0.012s][info][gc,init] Heap Initial Capacity: 4G
[2026-10-21T20:55:00.012+0700][0.012s][info][gc,init] Heap Max Capacity: 4G
[2026-10-21T20:55:00.012+0700][0.012s][info][gc,init] Pre-touch: Disabled
[2026-10-21T20:55:00.012+0700][0.012s][info][gc,init] Parallel Workers: 4
[2026-10-21T20:55:00.012+0700][0.012s][info][gc,init] Concurrent Workers: 1
[2026-10-21T20:55:00.012+0700][0.012s][info][gc,init] Concurrent Refinement Workers: 4
[2026-10-21T20:55:00.012+0700][0.012s][info][gc,init] Periodic GC: Disabled
... (young GC đều đặn mỗi ~30 giây, đã lược bớt) ...
[2026-10-21T21:59:41.416+0700][3881.416s][info][gc] GC(835) Pause Young (Normal) (G1 Evacuation Pause) 1618M->212M(4096M) 13.871ms
[2026-10-21T22:00:11.218+0700][3911.218s][info][gc] GC(836) Pause Young (Normal) (G1 Evacuation Pause) 1622M->214M(4096M) 14.102ms
[2026-10-21T22:00:29.133+0700][3929.133s][info][gc] GC(837) Pause Young (Normal) (G1 Evacuation Pause) 1630M->236M(4096M) 15.004ms
[2026-10-21T22:00:41.701+0700][3941.701s][info][gc] GC(838) Pause Young (Normal) (G1 Evacuation Pause) 1702M->611M(4096M) 41.337ms
[2026-10-21T22:00:50.386+0700][3950.386s][info][gc] GC(839) Pause Young (Normal) (G1 Evacuation Pause) 1980M->1047M(4096M) 58.912ms
[2026-10-21T22:00:58.904+0700][3958.904s][info][gc,start] GC(840) Pause Young (Concurrent Start) (G1 Humongous Allocation)
[2026-10-21T22:00:58.904+0700][3958.904s][info][gc,task] GC(840) Using 4 workers of 4 for evacuation
[2026-10-21T22:00:58.952+0700][3958.952s][info][gc,phases] GC(840)   Pre Evacuate Collection Set: 0.4ms
[2026-10-21T22:00:58.952+0700][3958.952s][info][gc,phases] GC(840)   Merge Heap Roots: 0.6ms
[2026-10-21T22:00:58.952+0700][3958.952s][info][gc,phases] GC(840)   Evacuate Collection Set: 44.1ms
[2026-10-21T22:00:58.952+0700][3958.952s][info][gc,phases] GC(840)   Post Evacuate Collection Set: 2.3ms
[2026-10-21T22:00:58.952+0700][3958.952s][info][gc,phases] GC(840)   Other: 0.4ms
[2026-10-21T22:00:58.952+0700][3958.952s][info][gc,heap] GC(840) Eden regions: 402->0(398)
[2026-10-21T22:00:58.952+0700][3958.952s][info][gc,heap] GC(840) Survivor regions: 31->26(52)
[2026-10-21T22:00:58.952+0700][3958.952s][info][gc,heap] GC(840) Old regions: 121->170
[2026-10-21T22:00:58.952+0700][3958.952s][info][gc,heap] GC(840) Archive regions: 2->2
[2026-10-21T22:00:58.952+0700][3958.952s][info][gc,heap] GC(840) Humongous regions: 412->412
[2026-10-21T22:00:58.952+0700][3958.952s][info][gc,metaspace] GC(840) Metaspace: 98765K(99840K)->98765K(99840K) NonClass: 86512K(87040K)->86512K(87040K) Class: 12253K(12800K)->12253K(12800K)
[2026-10-21T22:00:58.952+0700][3958.952s][info][gc] GC(840) Pause Young (Concurrent Start) (G1 Humongous Allocation) 1931M->1214M(4096M) 47.802ms
[2026-10-21T22:00:58.952+0700][3958.952s][info][gc,cpu] GC(840) User=0.17s Sys=0.01s Real=0.05s
[2026-10-21T22:00:58.952+0700][3958.952s][info][gc] GC(841) Concurrent Mark Cycle
[2026-10-21T22:00:58.953+0700][3958.953s][info][gc,marking] GC(841) Concurrent Clear Claimed Marks
[2026-10-21T22:00:58.953+0700][3958.953s][info][gc,marking] GC(841) Concurrent Scan Root Regions
[2026-10-21T22:00:58.961+0700][3958.961s][info][gc,marking] GC(841) Concurrent Scan Root Regions 7.902ms
[2026-10-21T22:00:58.961+0700][3958.961s][info][gc,marking] GC(841) Concurrent Mark
[2026-10-21T22:01:00.115+0700][3960.115s][info][gc] GC(842) Pause Young (Normal) (G1 Humongous Allocation) 2950M->2318M(4096M) 52.418ms
[2026-10-21T22:01:01.873+0700][3961.873s][info][gc,marking] GC(841) Concurrent Mark (3958.961s, 3961.873s) 2912.044ms
[2026-10-21T22:01:01.889+0700][3961.889s][info][gc] GC(841) Pause Remark 3312M->3290M(4096M) 9.114ms
[2026-10-21T22:01:02.105+0700][3962.105s][info][gc] GC(841) Pause Cleanup 3342M->3342M(4096M) 0.611ms
[2026-10-21T22:01:02.110+0700][3962.110s][info][gc] GC(841) Concurrent Mark Cycle 3158.412ms
[2026-10-21T22:01:02.601+0700][3962.601s][info][gc] GC(843) Pause Young (Prepare Mixed) (G1 Humongous Allocation) 3388M->2902M(4096M) 61.208ms
[2026-10-21T22:01:04.069+0700][3964.069s][info][gc] GC(844) Pause Young (Mixed) (G1 Humongous Allocation) 3366M->3021M(4096M) 88.430ms
[2026-10-21T22:01:05.086+0700][3965.086s][info][gc] GC(845) Pause Young (Normal) (G1 Humongous Allocation) 3590M->3368M(4096M) 74.115ms
[2026-10-21T22:01:06.207+0700][3966.207s][info][gc,start] GC(846) Pause Young (Normal) (G1 Evacuation Pause)
[2026-10-21T22:01:06.207+0700][3966.207s][info][gc,task] GC(846) Using 4 workers of 4 for evacuation
[2026-10-21T22:01:06.519+0700][3966.519s][info][gc] GC(846) To-space exhausted
[2026-10-21T22:01:06.519+0700][3966.519s][info][gc,phases] GC(846)   Pre Evacuate Collection Set: 0.3ms
[2026-10-21T22:01:06.519+0700][3966.519s][info][gc,phases] GC(846)   Merge Heap Roots: 0.9ms
[2026-10-21T22:01:06.519+0700][3966.519s][info][gc,phases] GC(846)   Evacuate Collection Set: 141.7ms
[2026-10-21T22:01:06.519+0700][3966.519s][info][gc,phases] GC(846)   Post Evacuate Collection Set: 168.9ms
[2026-10-21T22:01:06.519+0700][3966.519s][info][gc,phases] GC(846)   Other: 0.8ms
[2026-10-21T22:01:06.519+0700][3966.519s][info][gc,heap] GC(846) Eden regions: 118->0(4)
[2026-10-21T22:01:06.519+0700][3966.519s][info][gc,heap] GC(846) Survivor regions: 22->0(15)
[2026-10-21T22:01:06.519+0700][3966.519s][info][gc,heap] GC(846) Old regions: 601->741
[2026-10-21T22:01:06.519+0700][3966.519s][info][gc,heap] GC(846) Archive regions: 2->2
[2026-10-21T22:01:06.519+0700][3966.519s][info][gc,heap] GC(846) Humongous regions: 1288->1288
[2026-10-21T22:01:06.519+0700][3966.519s][info][gc] GC(846) Pause Young (Normal) (G1 Evacuation Pause) 4058M->4050M(4096M) 312.660ms
[2026-10-21T22:01:06.519+0700][3966.519s][info][gc,cpu] GC(846) User=1.08s Sys=0.03s Real=0.31s
[2026-10-21T22:01:06.520+0700][3966.520s][info][gc,start] GC(847) Pause Full (G1 Compaction Pause)
[2026-10-21T22:01:06.520+0700][3966.520s][info][gc,task] GC(847) Using 4 workers of 4 for full compaction
[2026-10-21T22:01:06.922+0700][3966.922s][info][gc,phases] GC(847) Phase 1: Mark live objects 402.118ms
[2026-10-21T22:01:07.014+0700][3967.014s][info][gc,phases] GC(847) Phase 2: Prepare for compaction 91.551ms
[2026-10-21T22:01:07.203+0700][3967.203s][info][gc,phases] GC(847) Phase 3: Adjust pointers 188.940ms
[2026-10-21T22:01:08.346+0700][3968.346s][info][gc,phases] GC(847) Phase 4: Compact heap 1143.077ms
[2026-10-21T22:01:08.355+0700][3968.355s][info][gc,heap] GC(847) Eden regions: 0->0(102)
[2026-10-21T22:01:08.355+0700][3968.355s][info][gc,heap] GC(847) Survivor regions: 0->0(15)
[2026-10-21T22:01:08.355+0700][3968.355s][info][gc,heap] GC(847) Old regions: 741->141
[2026-10-21T22:01:08.355+0700][3968.355s][info][gc,heap] GC(847) Archive regions: 2->2
[2026-10-21T22:01:08.355+0700][3968.355s][info][gc,heap] GC(847) Humongous regions: 1288->1288
[2026-10-21T22:01:08.355+0700][3968.355s][info][gc] GC(847) Pause Full (G1 Compaction Pause) 4050M->2851M(4096M) 1834.902ms
[2026-10-21T22:01:08.355+0700][3968.355s][info][gc,cpu] GC(847) User=6.41s Sys=0.12s Real=1.83s
[2026-10-21T22:01:11.999+0700][3971.999s][info][gc] GC(848) Pause Young (Normal) (G1 Humongous Allocation) 3880M->3702M(4096M) 95.207ms
[2026-10-21T22:01:13.979+0700][3973.979s][info][gc] GC(849) To-space exhausted
[2026-10-21T22:01:13.979+0700][3973.979s][info][gc] GC(849) Pause Young (Normal) (G1 Evacuation Pause) 4080M->4072M(4096M) 319.004ms
[2026-10-21T22:01:16.001+0700][3976.001s][info][gc] GC(850) Pause Full (G1 Compaction Pause) 4072M->2913M(4096M) 2011.447ms
[2026-10-21T22:01:34.420+0700][3994.420s][info][gc,start] GC(851) Pause Young (Normal) (G1 Evacuation Pause)
[2026-10-21T22:01:34.442+0700][3994.442s][info][gc,heap] GC(851) Eden regions: 380->0(612)
[2026-10-21T22:01:34.442+0700][3994.442s][info][gc,heap] GC(851) Survivor regions: 0->14(77)
[2026-10-21T22:01:34.442+0700][3994.442s][info][gc,heap] GC(851) Old regions: 152->160
[2026-10-21T22:01:34.442+0700][3994.442s][info][gc,heap] GC(851) Archive regions: 2->2
[2026-10-21T22:01:34.442+0700][3994.442s][info][gc,heap] GC(851) Humongous regions: 1131->12
[2026-10-21T22:01:34.442+0700][3994.442s][info][gc] GC(851) Pause Young (Normal) (G1 Evacuation Pause) 3322M->371M(4096M) 21.904ms
[2026-10-21T22:12:07.311+0700][4627.311s][info][gc] GC(1003) Pause Young (Normal) (G1 Evacuation Pause) 1641M->229M(4096M) 14.660ms`
    },
    {
      name: 'ReportExportController.java',
      lang: 'text',
      content: `package vn.tinbank.recon.controller;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import org.apache.poi.xssf.streaming.SXSSFWorkbook;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import vn.tinbank.recon.excel.WorkbookBuilder;

@RestController
@RequestMapping("/api/recon/atm")
public class ReportExportController {

    private final WorkbookBuilder builder;

    public ReportExportController(WorkbookBuilder builder) {
        this.builder = builder;
    }

    @GetMapping("/daily")
    public ResponseEntity<byte[]> exportDaily(@RequestParam String date,
                                              @RequestParam String branch) throws IOException {
        // SXSSF: chỉ giữ 100 dòng trong RAM, phần còn lại flush ra file tạm (/tmp/poi-sxssf-*.xml)
        SXSSFWorkbook workbook = builder.buildAtmDaily(date, branch);

        // Buffer khởi tạo 16 MB, tự nhân đôi khi đầy: 16 -> 32 -> 64 -> 128 MB
        ByteArrayOutputStream bos = new ByteArrayOutputStream(16 * 1024 * 1024);
        workbook.write(bos);          // nén toàn bộ file .xlsx vào bộ nhớ heap
        workbook.dispose();

        byte[] data = bos.toByteArray();   // copy thêm một lần nữa, đúng bằng kích thước file
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .contentLength(data.length)
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=atm-" + branch + "-" + date + ".xlsx")
                .body(data);
    }
}`
    },
    {
      name: 'jfr-allocation-samples.txt',
      lang: 'text',
      content: `$ jfr print --events jdk.ObjectAllocationSample --stack-depth 3 recon-2026-10-21.jfr | (đã lọc, trích 5 sự kiện)

jdk.ObjectAllocationSample {
  startTime = 22:00:57.802 (2026-10-21)
  objectClass = byte[] (classLoader = bootstrap)
  weight = 128.0 MB
  eventThread = "http-nio-8080-exec-14" (javaThreadId = 71)
  stackTrace = [
    java.util.Arrays.copyOf(byte[], int) line: 3537
    java.io.ByteArrayOutputStream.ensureCapacity(int) line: 100
    java.io.ByteArrayOutputStream.write(byte[], int, int) line: 130
    ...
  ]
}

jdk.ObjectAllocationSample {
  startTime = 22:00:58.017 (2026-10-21)
  objectClass = java.lang.String (classLoader = bootstrap)
  weight = 1.9 MB
  eventThread = "http-nio-8080-exec-3" (javaThreadId = 60)
  stackTrace = [
    java.lang.StringLatin1.newString(byte[], int, int) line: 769
    java.lang.StringBuilder.toString() line: 453
    org.postgresql.jdbc.PgResultSet.getString(int) line: 2196
    ...
  ]
}

jdk.ObjectAllocationSample {
  startTime = 22:00:58.893 (2026-10-21)
  objectClass = byte[] (classLoader = bootstrap)
  weight = 118.4 MB
  eventThread = "http-nio-8080-exec-14" (javaThreadId = 71)
  stackTrace = [
    java.util.Arrays.copyOf(byte[], int) line: 3537
    java.io.ByteArrayOutputStream.toByteArray() line: 211
    vn.tinbank.recon.controller.ReportExportController.exportDaily(String, String) line: 31
    ...
  ]
}

jdk.ObjectAllocationSample {
  startTime = 22:00:59.240 (2026-10-21)
  objectClass = byte[] (classLoader = bootstrap)
  weight = 64.0 MB
  eventThread = "http-nio-8080-exec-9" (javaThreadId = 66)
  stackTrace = [
    java.util.Arrays.copyOf(byte[], int) line: 3537
    java.io.ByteArrayOutputStream.ensureCapacity(int) line: 100
    java.io.ByteArrayOutputStream.write(byte[], int, int) line: 130
    ...
  ]
}

jdk.ObjectAllocationSample {
  startTime = 22:01:00.031 (2026-10-21)
  objectClass = java.lang.Object[] (classLoader = bootstrap)
  weight = 412.5 kB
  eventThread = "http-nio-8080-exec-2" (javaThreadId = 59)
  stackTrace = [
    java.util.Arrays.copyOf(Object[], int) line: 3513
    java.util.ArrayList.grow(int) line: 238
    java.util.ArrayList.add(Object) line: 467
    ...
  ]
}

Tổng hợp (jfr view không có trên JDK 17, team tự cộng weight theo objectClass, 22:00:30 -> 22:11:40):
  byte[]               ~ 41.8 GB   (78%)   gần như toàn bộ từ ByteArrayOutputStream.ensureCapacity / toByteArray
  java.lang.String     ~  5.1 GB   ( 9%)
  java.lang.Object[]   ~  1.6 GB   ( 3%)
  khác                 ~  5.2 GB   (10%)`
    }
  ],
  questions: [
    'Vì sao G1 liên tục có pause với cause "G1 Humongous Allocation", rồi "To-space exhausted" và cuối cùng là Pause Full? Trích dòng cụ thể trong GC log làm bằng chứng.',
    'Đây có phải memory leak không? Dùng số liệu trong log để chứng minh, và giải thích vì sao tăng heap lên 8 GB không phải là lời giải đúng.',
    'Bạn sửa thế nào ngay hôm nay và về lâu dài? Cần alert/monitoring gì để phát hiện sớm?'
  ],
  hints: [
    'Đọc dòng "Heap Region Size: 2M". Với G1, object có kích thước từ nửa region trở lên là humongous. File 118 MB thì cần bao nhiêu region liên tiếp?',
    'So sánh "Humongous regions" ở GC(846), GC(847) (Full GC) và GC(851). Vì sao Full GC không giảm được humongous, nhưng một young GC 18 giây sau lại giảm từ 1131 xuống 12?',
    'Đếm số lần copy: ByteArrayOutputStream nhân đôi buffer khi đầy, rồi toByteArray() copy thêm một lần. Nhân với 10 request song song rồi so với heap 4 GB.'
  ],
  answer: `**Tóm tắt:** Không phải memory leak. Mỗi request export giữ **toàn bộ file .xlsx (khoảng 118 MB) trong heap hai lần** (buffer 128 MB của {{ByteArrayOutputStream}} và bản copy 118 MB từ {{toByteArray()}}). Với region 2 MB, đây đều là **humongous object**, phải nằm trên nhiều region liên tiếp. 10 request song song giữ khoảng 1288 region humongous (khoảng 2.5 GB) cùng lúc, khiến G1 không còn chỗ để evacuate: To-space exhausted, sau đó Full GC dài 1.8–2 giây. Khi các export kết thúc, humongous được giải phóng ngay ở một young GC thông thường.

### Cơ chế: humongous object trong G1

G1 chia heap 4 GB thành 2048 region 2 MB (dòng {{Heap Region Size: 2M}}). Object có kích thước **từ nửa region trở lên (ở đây là 1 MB)** được xem là humongous:
- Object được cấp phát **thẳng vào old gen**, trên một dãy region **liên tiếp** (128 MB cần 64 region, 118 MB cần 59 region). Nó không đi qua eden hay TLAB.
- Mỗi lần cấp phát humongous, G1 kiểm tra ngưỡng IHOP. Vì vậy cause của pause là {{G1 Humongous Allocation}} và có thể bắt đầu concurrent mark ({{Concurrent Start}}).
- Humongous **đã chết** là mảng primitive như {{byte[]}} được **eager reclaim** ngay ở young GC. Humongous **còn sống** thì không GC nào thu hồi được. G1 Full GC trên JDK 17 cũng không di chuyển humongous region, nên phân mảnh vẫn còn sau khi compact.

Phép tính cho một request với file 118 MB: buffer 16 MB, khi đầy thì nhân đôi thành 32, 64, rồi 128 MB. Mỗi lần nhân đôi, buffer cũ và mới cùng sống trong lúc copy. Sau đó {{toByteArray()}} cấp phát thêm 118 MB. Lúc đỉnh, mỗi request giữ khoảng 128 + 118 = 246 MB, tức 123 region, chưa kể buffer 64 MB đang chờ thu hồi. 10 request song song giữ khoảng 1230–1290 region, khớp với {{Humongous regions: 1288->1288}}. Lượng này chiếm 63% heap, phần còn lại không đủ cho eden, survivor và old.

### Dẫn chứng trong artifact

- {{GC(840) Pause Young (Concurrent Start) (G1 Humongous Allocation) 1931M->1214M}}: đây là pause đầu tiên do humongous, 28 giây sau khi orchestrator bắt đầu. Humongous lúc này là {{412->412}}.
- GC(842), (843), (844), (845) đều có cause {{G1 Humongous Allocation}}. Heap sau GC tăng dần: 2318M, 2902M, 3021M, 3368M. Mixed GC (844) gần như không giải phóng được gì vì phần lớn là humongous còn sống.
- {{GC(846) To-space exhausted}} và {{Eden regions: 118->0(4)}}: G1 thu eden xuống còn 4 region, không còn region trống để copy object sống. Pause kéo dài **312.660ms**, và {{Old regions: 601->741}} vì các region evacuate thất bại bị chuyển thành old.
- {{GC(847) Pause Full (G1 Compaction Pause) 4050M->2851M ... 1834.902ms}}: Full GC chỉ thu được old ({{741->141}}). **Humongous vẫn là 1288->1288**, chứng tỏ các mảng này đang được tham chiếu bởi các request còn chạy, không phải rác.
- GC(849) và GC(850) lặp lại đúng chu trình (2011.447ms).
- **Bằng chứng không phải leak:** GC(851) lúc 22:01:34, sau khi đợt export kết thúc, có {{Humongous regions: 1131->12}} và {{3322M->371M}} chỉ trong một young GC 21.904ms. Leak thì heap sau GC phải tăng dần theo ngày và Full GC không giảm được. Ở đây heap quay về khoảng 230–370 MB, như dòng cuối {{1641M->229M}} lúc 22:12.
- JFR: {{weight = 128.0 MB}} và {{64.0 MB}} tại {{ByteArrayOutputStream.ensureCapacity}}, {{118.4 MB}} tại {{toByteArray()}} gọi từ {{ReportExportController.exportDaily ... line: 31}}. {{byte[]}} chiếm 78% lượng allocation.
- Mẫu {{PgResultSet.getString}} và {{ArrayList.grow}} là nhiễu: chỉ vài trăm KB đến vài MB, không phải humongous.

Vì sao tăng heap lên 8 GB không giải quyết được: số region humongous cần dùng tăng tuyến tính theo **kích thước file × số request song song**. Cuối tháng file lớn hơn, hoặc orchestrator tăng lên 20 luồng, thì 8 GB cũng hết, và Full GC trên heap 8 GB còn dài hơn. Ngoài ra pod limit 5Gi không đủ cho heap 8 GB.

### Cách sửa

**Ngắn hạn (deploy trong ngày):**
1. Không giữ file trong heap. Ghi workbook ra **file tạm trên disk** rồi trả về {{FileSystemResource}}, hoặc stream thẳng ra response:

~~~java
@GetMapping("/daily")
public ResponseEntity<StreamingResponseBody> exportDaily(@RequestParam String date,
                                                         @RequestParam String branch) {
    SXSSFWorkbook wb = builder.buildAtmDaily(date, branch);
    StreamingResponseBody body = out -> {
        try (wb) {                 // close() giải phóng tài nguyên của workbook
            wb.write(out);         // ghi thẳng ra socket, buffer vài chục KB
        } finally {
            wb.dispose();          // xoá file tạm của SXSSF
        }
    };
    return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=atm-" + branch + ".xlsx")
            .body(body);
}
~~~

2. Giới hạn đồng thời: tạm thời giảm orchestrator xuống 3 luồng, và thêm {{Semaphore}} hoặc bulkhead (Resilience4j) với tối đa 2–3 export mỗi pod, trả 429 nếu vượt.
3. Có thể dùng thêm {{-XX:G1HeapRegionSize=16m}} để giảm số region mỗi object (128 MB còn 8 region) và giảm phân mảnh. Đây chỉ là workaround: object vẫn là humongous.

**Dài hạn:**
- Tách export khỏi service phục vụ API online: chạy job nền sinh file lên object storage (S3/MinIO), client tải bằng **presigned URL**. Heap của API không còn liên quan đến kích thước file.
- Với dữ liệu đối soát hàng triệu dòng, cân nhắc CSV nén gzip thay cho xlsx. Định dạng này nhẹ hơn nhiều và hệ thống đối soát tự động đọc dễ hơn.
- Load test với file cuối tháng và đúng mức song song của orchestrator.

### Phòng ngừa và alert

- Alert khi có Full GC: {{increase(jvm_gc_pause_seconds_count[5m])}} lọc theo label {{action="end of major GC"}} lớn hơn 0.
- Theo dõi tần suất pause theo {{cause="G1 Humongous Allocation"}}. Pause này tăng đột biến là cảnh báo sớm, trước khi xảy ra Full GC.
- Parse GC log (hoặc gửi lên hệ thống log) và alert khi xuất hiện dòng {{To-space exhausted}}.
- Bật JFR liên tục ({{-XX:StartFlightRecording}} với profile default, overhead khoảng 1%) để có sẵn dữ liệu allocation khi sự cố xảy ra.
- Code review: cấm {{ResponseEntity<byte[]>}} và {{ByteArrayOutputStream}} cho dữ liệu không giới hạn kích thước.

> Senior tip: Khi thấy Full GC, hãy luôn so sánh **heap sau GC** giữa các thời điểm trước khi kết luận là leak. Leak có đáy tăng dần qua nhiều giờ hoặc nhiều ngày; burst allocation thì đáy quay về như cũ ngay khi tải hết. Một lựa chọn thực dụng là ghi ra file tạm rồi trả {{FileSystemResource}}: heap phẳng, vẫn có {{Content-Length}}, và nếu lỗi giữa chừng thì vẫn trả được HTTP 500 vì chưa gửi byte nào. Stream thẳng ra socket thì sau khi đã gửi status 200, không thể đổi sang status lỗi nữa.`,
  rubric: [
    'Nhận ra humongous allocation: region 2M nên object từ 1 MB trở lên là humongous, file khoảng 118 MB chiếm 59–64 region liên tiếp, nhân với 10 request song song.',
    'Dẫn chứng chuỗi trong GC log: cause G1 Humongous Allocation, rồi To-space exhausted (GC 846), rồi Pause Full (G1 Compaction Pause) khoảng 1.8–2 s mà Humongous regions vẫn 1288->1288.',
    'Chứng minh không phải leak: GC(851) Humongous regions 1131->12 và heap về khoảng 371M ngay sau khi export xong; tăng heap không phải lời giải.',
    'Chỉ đúng code gây ra: ByteArrayOutputStream nhân đôi buffer cộng với toByteArray() copy thêm một lần, ResponseEntity<byte[]>.',
    'Đề xuất streaming hoặc ghi file tạm, giới hạn số export song song, dài hạn tách job nền và object storage; G1HeapRegionSize chỉ là workaround. Có alert theo Full GC, humongous và To-space exhausted.'
  ],
  tags: ['g1', 'humongous', 'full-gc', 'gc-log', 'jfr', 'streaming']
},
{
  id: 'lab-gc-002',
  category: 'gc',
  title: 'Heap của ví tăng đều mỗi ngày: hai lần class histogram lộ listener không được gỡ',
  level: 'senior',
  scenario: `**Bối cảnh:** Ví điện tử **MoPay** có service **wallet-fx** (Spring Boot 3.1, JDK 17.0.10, G1, {{-Xmx2g}}, pod 3 vCPU, limit 3Gi) báo giá quy đổi ngoại tệ cho thanh toán QR xuyên biên giới. Khách quét QR của merchant Thái Lan/Singapore, hệ thống trả báo giá giữ trong 60 giây, khách bấm "Thanh toán" để chốt. Khoảng 70% báo giá bị bỏ ngang (khách đóng app). Service vốn được deploy hằng tuần nên pod hiếm khi sống quá 7 ngày. Đợt này đang **đóng băng deploy** từ 18/10 đến hết đợt khuyến mãi, pod mới nhất khởi động lúc **08:00 ngày 18/10/2026**.

**Triệu chứng:** Dashboard cho thấy heap của Old Gen sau GC tăng đều mỗi ngày, không có dấu hiệu chững lại. Số concurrent mark cycle tăng mạnh, CPU tăng từ 17% lên 41%, p99 của {{POST /api/checkout/fx-quote}} tăng từ 95 ms lên 190 ms. Chưa có Full GC hay OOM. Dev giải thích: "Session báo giá đã nằm trong Caffeine cache có {{expireAfterWrite}} 2 phút, không thể leak được."

**Dữ liệu thu thập:** On-call chạy {{jcmd 1 GC.class_histogram}} hai lần, cách nhau 48 giờ, kèm số liệu Prometheus mỗi ngày, output {{top -H}} và mã nguồn liên quan.`,
  artifacts: [
    {
      name: 'class-histogram-2026-10-19-1000.txt',
      lang: 'text',
      content: `$ kubectl exec wallet-fx-5d7c9b-k2xpl -- jcmd 1 GC.class_histogram    # 19/10/2026 10:00, uptime 26h
1:
 num     #instances         #bytes  class name (module)
-------------------------------------------------------
   1:        846287      121860072  [B (java.base@17.0.10)
   2:       1255395       50215800  java.math.BigDecimal (java.base@17.0.10)
   3:        814503       19548072  java.lang.String (java.base@17.0.10)
   4:        412385       16495400  vn.mopay.fx.FxQuoteSession
   5:        474255       15176160  java.util.concurrent.ConcurrentHashMap$Node (java.base@17.0.10)
   6:        412385       13196320  vn.mopay.fx.FxQuote
   7:        301442        9646144  java.util.HashMap$Node (java.base@17.0.10)
   8:        120388        7911232  [Ljava.lang.Object; (java.base@17.0.10)
   9:          9812        6299200  [Ljava.util.concurrent.ConcurrentHashMap$Node; (java.base@17.0.10)
  10:         41233        5102144  [I (java.base@17.0.10)
  11:         88214        3528560  java.util.LinkedHashMap$Entry (java.base@17.0.10)
  12:         28114        3261224  java.lang.Class (java.base@17.0.10)
  13:         50000        2400000  vn.mopay.merchant.MerchantConfig
  14:         14212         454784  java.lang.ref.WeakReference (java.base@17.0.10)
  15:          1644          92064  org.apache.tomcat.util.buf.ByteChunk
  16:             2             64  vn.mopay.fx.FxRate
...
Total       5382611      336422120`
    },
    {
      name: 'class-histogram-2026-10-21-1000.txt',
      lang: 'text',
      content: `$ kubectl exec wallet-fx-5d7c9b-k2xpl -- jcmd 1 GC.class_histogram    # 21/10/2026 10:00, uptime 74h
1:
 num     #instances         #bytes  class name (module)
-------------------------------------------------------
   1:       1635479      166054824  [B (java.base@17.0.10)
   2:       3622971      144918840  java.math.BigDecimal (java.base@17.0.10)
   3:       1201577       48063080  vn.mopay.fx.FxQuoteSession
   4:       1263447       40430304  java.util.concurrent.ConcurrentHashMap$Node (java.base@17.0.10)
   5:       1603695       38488680  java.lang.String (java.base@17.0.10)
   6:       1201577       38450464  vn.mopay.fx.FxQuote
   7:          9812       10493504  [Ljava.util.concurrent.ConcurrentHashMap$Node; (java.base@17.0.10)
   8:        302016        9664512  java.util.HashMap$Node (java.base@17.0.10)
   9:        121005        7950720  [Ljava.lang.Object; (java.base@17.0.10)
  10:         41250        5104796  [I (java.base@17.0.10)
  11:         88230        3529200  java.util.LinkedHashMap$Entry (java.base@17.0.10)
  12:         28118        3261688  java.lang.Class (java.base@17.0.10)
  13:         50000        2400000  vn.mopay.merchant.MerchantConfig
  14:         14300         457600  java.lang.ref.WeakReference (java.base@17.0.10)
  15:          1644          92064  org.apache.tomcat.util.buf.ByteChunk
  16:             2             64  vn.mopay.fx.FxRate
...
Total      11698773      580647620`
    },
    {
      name: 'metrics-daily-and-top.txt',
      lang: 'text',
      content: `# Prometheus, pod wallet-fx-5d7c9b-k2xpl, lấy lúc 10:00 mỗi ngày
# old_floor = min_over_time(jvm_memory_used_bytes{area="heap",id="G1 Old Gen"}[24h])
# conc_cycles = số dòng "Concurrent Mark Cycle" (dòng kết thúc) trong gc.log 24h trước đó

ngày        uptime  old_floor  conc_cycles  young_gc/phút  process_cpu_usage  p99 fx-quote  fx-quote/phút  confirm/phút
18/10 10:00    2h     148 MB            0            1.4               0.17         95 ms            391           118
19/10 10:00   26h     318 MB            3            1.4               0.24        118 ms            402           121
20/10 10:00   50h     437 MB           11            1.5               0.33        151 ms            388           116
21/10 10:00   74h     552 MB           26            1.5               0.41        190 ms            395           119

# Caffeine cache "fxSessions" (CacheMetricsRegistrar), 21/10 10:00
cache_size{cache="fxSessions"}                                   812
cache_evictions_total{cache="fxSessions"}                    1181342

# top -H -p 1 (21/10 10:02), 5 thread dùng CPU nhiều nhất
    PID USER      PR  NI    VIRT    RES    SHR S  %CPU  %MEM     TIME+ COMMAND
    211 app       20   0 3961204   2.4g  21480 R  38.2  15.3   1062:41 fx-rate-feed-1
     19 app       20   0 3961204   2.4g  21480 S  11.0  15.3    301:12 G1 Conc#0
    188 app       20   0 3961204   2.4g  21480 S   3.1  15.3     61:09 http-nio-8080-e
    190 app       20   0 3961204   2.4g  21480 S   2.9  15.3     58:47 http-nio-8080-e
     12 app       20   0 3961204   2.4g  21480 S   1.2  15.3     22:30 GC Thread#0`
    },
    {
      name: 'fx-source.java',
      lang: 'text',
      content: `// ===== vn/mopay/fx/FxRateHub.java =====
public final class FxRateHub {
    public static final FxRateHub INSTANCE = new FxRateHub();   // static: sống suốt vòng đời JVM

    private final Set<FxRateListener> listeners = ConcurrentHashMap.newKeySet();

    public void subscribe(FxRateListener l)   { listeners.add(l); }
    public void unsubscribe(FxRateListener l) { listeners.remove(l); }

    // FxRateFeed (thread fx-rate-feed-1) gọi mỗi giây cho 3 cặp tiền USD, THB, SGD
    void publish(FxRate rate) {
        for (FxRateListener l : listeners) {
            l.onRate(rate);
        }
    }
}

// ===== vn/mopay/fx/FxQuoteSession.java =====
final class FxQuoteSession implements FxRateListener {
    final String checkoutId;          // UUID 36 ký tự
    final CurrencyPair pair;          // enum
    final BigDecimal amount;
    volatile FxQuote quote;           // FxQuote { BigDecimal rate; BigDecimal converted; long createdAt; }
    final long expiresAt;

    @Override
    public void onRate(FxRate r) {
        if (System.currentTimeMillis() > expiresAt) return;   // hết hạn thì bỏ qua
        if (r.pair() == pair) quote = FxQuote.of(r, amount);
    }
}

// ===== vn/mopay/checkout/CheckoutFxService.java =====
@Service
public class CheckoutFxService {
    private final Cache<String, FxQuoteSession> sessions = Caffeine.newBuilder()
            .expireAfterWrite(Duration.ofMinutes(2))
            .maximumSize(200_000)
            .recordStats()
            .build();

    public FxQuoteResponse createQuote(String checkoutId, CurrencyPair pair, BigDecimal amount) {
        FxQuoteSession s = new FxQuoteSession(checkoutId, pair, amount,
                pricing.quote(pair, amount), System.currentTimeMillis() + 60_000);
        FxRateHub.INSTANCE.subscribe(s);       // để báo giá tự cập nhật theo tỷ giá mới
        sessions.put(checkoutId, s);
        return FxQuoteResponse.from(s);
    }

    public PaymentResult confirm(String checkoutId) {
        FxQuoteSession s = sessions.getIfPresent(checkoutId);
        if (s == null) throw new QuoteExpiredException(checkoutId);
        FxRateHub.INSTANCE.unsubscribe(s);     // chỉ gỡ ở đây
        sessions.invalidate(checkoutId);
        return payment.pay(s);
    }
}`
    }
  ],
  questions: [
    'Class nào đang leak? Hãy chứng minh bằng phép trừ giữa hai histogram (không chỉ nhìn class chiếm nhiều byte nhất).',
    'Vì sao Caffeine cache đã có expireAfterWrite 2 phút mà object vẫn không được GC thu hồi? Chuỗi tham chiếu từ GC root là gì?',
    'Ước tính tốc độ leak và thời điểm sự cố trở nên nghiêm trọng. Bạn sửa ngắn hạn, dài hạn và đặt alert thế nào?'
  ],
  hints: [
    'Đừng nhìn [B đứng đầu bảng. Hãy lấy #instances ngày 21 trừ ngày 19 cho từng class, tìm những class có cùng một delta (hoặc bội số của nó).',
    'Mỗi FxQuoteSession kéo theo bao nhiêu String, byte[], BigDecimal, ConcurrentHashMap$Node? Mảng [Ljava.util.concurrent.ConcurrentHashMap$Node; tăng thêm đúng 4 MB nói lên điều gì về kích thước một map?',
    'Một object chỉ được thu hồi khi không còn đường đi nào từ GC root. Cache đã evict entry rồi, nhưng còn ai khác đang giữ session? Trường hợp nào thì unsubscribe không bao giờ được gọi?'
  ],
  answer: `**Tóm tắt:** Đây là leak kiểu **listener không được gỡ**. Mỗi báo giá đăng ký {{FxQuoteSession}} vào {{FxRateHub.INSTANCE}}, một singleton {{static}}. Session chỉ được unsubscribe khi khách bấm Thanh toán (khoảng 30%). 70% báo giá bị bỏ ngang nằm lại vĩnh viễn trong {{listeners}}, dù Caffeine đã evict chúng sau 2 phút. Tốc độ leak khoảng 395 nghìn session (khoảng 116 MB live) mỗi ngày.

### Cách đọc hai histogram: lấy delta, đừng nhìn top 1

{{[B}} luôn đứng đầu ở mọi ứng dụng Java, vì String, buffer và gần như mọi thứ đều chứa byte[]. Cách đúng là tính **delta #instances** trong 48 giờ:

| Class | 19/10 | 21/10 | Delta |
|---|---|---|---|
| vn.mopay.fx.FxQuoteSession | 412,385 | 1,201,577 | **+789,192** |
| vn.mopay.fx.FxQuote | 412,385 | 1,201,577 | **+789,192** |
| ConcurrentHashMap$Node | 474,255 | 1,263,447 | **+789,192** |
| java.lang.String | 814,503 | 1,603,695 | **+789,192** |
| [B | 846,287 | 1,635,479 | **+789,192** |
| java.math.BigDecimal | 1,255,395 | 3,622,971 | +2,367,576 = **3 × 789,192** |
| HashMap$Node, Class, MerchantConfig… | | | gần như không đổi (nhiễu) |

Sáu class có **cùng một delta** chứng tỏ chúng là một cụm object đi chung. Mỗi {{FxQuoteSession}} giữ: 1 {{String checkoutId}} (kèm 1 byte[] 36 ký tự), 1 {{FxQuote}}, 3 {{BigDecimal}} (amount, rate, converted), và 1 {{ConcurrentHashMap$Node}}, tức entry trong {{listeners}} được tạo bởi {{ConcurrentHashMap.newKeySet()}}. Mảng {{[Ljava.util.concurrent.ConcurrentHashMap$Node;}} giữ nguyên 9,812 instance nhưng tăng 6,299,200 → 10,493,504 byte, tức tăng đúng 4,194,304 byte. Đó là bảng băm của **một map duy nhất** đã resize từ 1,048,576 lên 2,097,152 slot. Map này chứa hơn 1.2 triệu phần tử, chỉ có thể là {{listeners}}. {{MerchantConfig}} cố định ở 50,000 là cache có giới hạn, không liên quan.

### Vì sao Caffeine evict rồi mà vẫn không thu hồi được

GC thu hồi object khi **không còn đường đi nào** từ GC root. Chuỗi tham chiếu ở đây:

~~~text
GC root: class FxRateHub (được AppClassLoader giữ)
  -> static INSTANCE : FxRateHub
     -> listeners : ConcurrentHashMap.KeySetView
        -> ConcurrentHashMap -> Node[] (2,097,152 slot) -> Node.key
           -> FxQuoteSession -> FxQuote, BigDecimal x3, String checkoutId
~~~

Caffeine chỉ xoá **tham chiếu của chính nó**. {{cache_evictions_total 1181342}} cho thấy cache vẫn hoạt động đúng, còn {{cache_size 812}} chỉ là số session đang hiệu lực. Nhưng {{CheckoutFxService.createQuote}} đã đăng ký session vào một nơi thứ hai sống lâu hơn, và chỉ {{confirm()}} mới gỡ. Báo giá bỏ ngang hay hết hạn thì không có code nào gọi {{unsubscribe}}. {{onRate}} có kiểm tra {{expiresAt}}, nhưng chỉ để **bỏ qua xử lý**, object vẫn nằm trong set.

Số liệu khớp: fx-quote khoảng 395/phút, confirm khoảng 119/phút, còn khoảng 276/phút không được gỡ. 276 × 1,440 phút ≈ 397 nghìn mỗi ngày, khớp với 789,192 / 2 ngày ≈ 394,596 mỗi ngày.

### Tác động phụ đang thấy

- {{old_floor}} tăng 148 → 318 → 437 → 552 MB. Histogram cho thấy live set tăng 336 MB → 581 MB, khoảng **116 MB mỗi ngày**.
- {{fx-rate-feed-1}} ăn **38.2% CPU** vì mỗi giây duyệt 3 lần qua hơn 1.2 triệu listener (3 cặp tiền), dù 99.9% trong số đó đã hết hạn. Đây là nguyên nhân chính khiến CPU tăng từ 0.17 lên 0.41.
- Old Gen đầy dần nên chạm ngưỡng IHOP thường xuyên hơn: concurrent cycle tăng 0 → 26 mỗi ngày, {{G1 Conc#0}} chiếm 11% CPU. Cộng thêm CPU của feed, p99 tăng từ 95 lên 190 ms. Young GC/phút gần như không đổi, nên vấn đề không nằm ở tốc độ allocation.
- Dự báo: còn khoảng 1.3 GB trước khi chạm heap 2 GB, ở tốc độ 116 MB/ngày thì khoảng 10–11 ngày nữa sẽ có Full GC liên tục rồi OOM. Đợt đóng băng deploy vẫn chưa kết thúc. Các tuần trước lỗi bị che vì deploy hằng tuần restart pod.

### Cách sửa

**Ngắn hạn:**
1. Lên lịch rolling restart trước khi old floor vượt khoảng 1.2 GB. Đây là cách mua thời gian, không phải giải pháp.
2. Hotfix gỡ listener ở mọi đường kết thúc của session, không chỉ ở confirm. Dùng chính sự kiện evict của Caffeine:

~~~java
Cache<String, FxQuoteSession> sessions = Caffeine.newBuilder()
        .expireAfterWrite(Duration.ofMinutes(2))
        .maximumSize(200_000)
        .removalListener((String id, FxQuoteSession s, RemovalCause cause) -> {
            if (s != null) FxRateHub.INSTANCE.unsubscribe(s);   // gỡ khi hết hạn/bị evict/invalidate
        })
        .build();
~~~

Lưu ý: Caffeine dọn entry hết hạn **khi có hoạt động** trên cache (hoặc khi có {{scheduler(Scheduler.systemScheduler())}}). Với traffic đều thì đủ, nhưng nên cấu hình scheduler để chắc chắn.

**Dài hạn (đổi thiết kế):**
- Đảo chiều phụ thuộc: session **không cần subscribe**. Lưu tỷ giá mới nhất theo cặp tiền trong một {{AtomicReference<FxRate>}} hoặc map 3 phần tử, và khi khách xem hoặc confirm thì tính lại báo giá từ tỷ giá hiện tại (pull thay vì push). Không còn registry nào phải dọn.
- Nếu bắt buộc dùng mô hình listener: registry phải trả về handle {{AutoCloseable}} để gỡ, hoặc tự dọn listener hết hạn mỗi lần publish. Tránh dùng {{WeakReference}} như cách chữa cháy, vì nó khiến hành vi phụ thuộc vào thời điểm GC chạy.
- Thêm metric {{fx_hub_listeners}} (Gauge) ngay trong registry. Mọi registry hoặc collection static đều phải có gauge kích thước.

### Phòng ngừa và alert

- Alert theo **xu hướng**: {{deriv}} của old floor (min_over_time 1 ngày) dương liên tục 3 ngày. Ngưỡng tĩnh như heap trên 80% chỉ báo khi đã quá muộn.
- Gauge cho kích thước của mọi registry, cache và map static, có alert khi vượt ngưỡng.
- Test soak 24–72 giờ trên staging với tỷ lệ bỏ ngang thật (70%), lấy histogram đầu và cuối rồi so sánh delta như trên.
- Code review: thấy {{subscribe}}, {{addListener}} hoặc {{register}} thì phải hỏi ngay: "unsubscribe ở đâu, kể cả nhánh lỗi, timeout và bỏ ngang?"

> Senior tip: {{GC.class_histogram}} (và {{jmap -histo:live}}) **ép một Full GC** để chỉ đếm object còn sống. Trên heap 2 GB, việc này dừng ứng dụng khoảng 1–2 giây, nên hãy rút pod khỏi load balancer hoặc chạy vào giờ thấp điểm. Muốn biết chính xác ai đang giữ object thì cần heap dump ({{jcmd 1 GC.heap_dump /dumps/x.hprof}}) rồi mở bằng Eclipse MAT, chọn "Path to GC Roots" và loại bỏ weak/soft reference. Khi phân tích nhanh trên production, phương pháp delta giữa hai histogram là đủ để khoanh vùng trong vài phút, mà file dump vài GB cũng không phải rời khỏi môi trường production (dump có thể chứa dữ liệu khách hàng).`,
  rubric: [
    'Dùng delta giữa hai histogram: FxQuoteSession, FxQuote, ConcurrentHashMap$Node, String, [B cùng tăng 789,192 và BigDecimal tăng gấp 3; không kết luận dựa vào [B đứng đầu.',
    'Chỉ ra GC root: FxRateHub.INSTANCE (static) giữ listeners set, session chỉ unsubscribe trong confirm(), khoảng 70% báo giá bỏ ngang không bao giờ được gỡ; Caffeine evict không giải phóng được vì còn tham chiếu thứ hai.',
    'Liên hệ triệu chứng: old floor tăng khoảng 116 MB/ngày, fx-rate-feed-1 tốn CPU do duyệt hơn 1.2 triệu listener, concurrent cycle tăng; ước tính thời gian còn lại trước OOM.',
    'Đề xuất sửa: gỡ listener ở mọi đường kết thúc (removalListener hoặc tương đương) và dài hạn đổi sang mô hình pull hoặc registry có giới hạn và handle để gỡ.',
    'Phòng ngừa: alert theo xu hướng old floor, gauge kích thước registry, soak test, lưu ý histogram:live và heap dump gây Full GC hoặc lộ dữ liệu trên production.'
  ],
  tags: ['memory-leak', 'class-histogram', 'listener', 'static', 'caffeine', 'g1']
},
{
  id: 'lab-gc-003',
  category: 'gc',
  title: 'OutOfMemoryError: Metaspace sau khi thêm rule khuyến mãi bằng Groovy',
  level: 'senior',
  scenario: `**Bối cảnh:** Sàn thương mại điện tử **ShopVN** có service **price-engine** (Spring Boot 3.2, JDK 17.0.10, Groovy 4.0) tính giá giỏ hàng. JVM: {{-Xmx2g -XX:MaxMetaspaceSize=256m -XX:+UseG1GC}}. Bản **2.4** deploy lúc **09:00 ngày 21/10/2026** thêm tính năng cho merchant tự viết rule khuyến mãi bằng Groovy, lưu trong bảng {{promotion_rule}}. Khoảng 3% request tính giá đi qua rule Groovy, tương đương 1.5 request/giây mỗi pod.

**Triệu chứng:** Lúc **14:50**, cả 4 pod lần lượt trả HTTP 500 với {{java.lang.OutOfMemoryError: Metaspace}}. Heap chỉ dùng khoảng 600 MB / 2 GB. Restart thì chạy được, nhưng theo dự báo khoảng 6 giờ sau sẽ lặp lại. Dev đã chạy {{GC.class_histogram}} nhưng không thấy class nào bất thường trên heap, nên đề xuất tăng {{MaxMetaspaceSize}} lên 1 GB.

**Dữ liệu thu thập:** {{jcmd 1 VM.classloader_stats}} lúc 13:52, metric Prometheus theo giờ, đoạn GC log và log ứng dụng lúc OOM, mã nguồn {{PricingRuleEngine}} và kết quả truy vấn bảng rule.`,
  artifacts: [
    {
      name: 'vm-classloader-stats.txt',
      lang: 'text',
      content: `ClassLoader         Parent              CLD*               Classes   ChunkSz   BlockSz  Type
0x0000000800c62a40  0x0000000800d01f28  0x00007f3a9c4e1d70       0         0         0  jdk.internal.reflect.DelegatingClassLoader
0x0000000801f3a5b8  0x0000000800c62a40  0x00007f3a2c0a8e40       1      5120      4688  jdk.internal.reflect.DelegatingClassLoader
0x0000000801f3a2d0  0x0000000800c62a40  0x00007f3a2c0a8c90       1      5120      4688  jdk.internal.reflect.DelegatingClassLoader
0x0000000801f39fe8  0x0000000800c62a40  0x00007f3a2c0a8ae0       1      5120      4688  jdk.internal.reflect.DelegatingClassLoader
0x0000000801f39d00  0x0000000800c62a40  0x00007f3a2c0a8930       1      5120      4688  jdk.internal.reflect.DelegatingClassLoader
0x0000000801f39a18  0x0000000800c62a40  0x00007f3a2c0a8780       1      5120      4688  jdk.internal.reflect.DelegatingClassLoader
... (hàng nghìn dòng DelegatingClassLoader khác do Groovy tạo ra cho mỗi script compile)
0x0000000800d01f28  0x0000000800010d48  0x00007f3a9c2b5a10   14871  92274688  89912320  org.springframework.boot.loader.launch.LaunchedClassLoader
0x0000000800010d48  0x0000000800010a60  0x00007f3a9c1e0c30     102   1048576    940112  jdk.internal.loader.ClassLoaders$AppClassLoader
Total = 5000                                                50000 257075200 242040072
ChunkSz: Total size of all allocated metaspace chunks
BlockSz: Total size of all allocated metaspace blocks (each chunk has several blocks)`
    },
    {
      name: 'PricingRuleEngine.java',
      lang: 'text',
      content: `package vn.shopvn.price;

import groovy.lang.GroovyShell;
import groovy.lang.Script;
import org.springframework.stereotype.Component;

@Component
public class PricingRuleEngine {

    private final GroovyShell shell = new GroovyShell();  // KHÔNG cache script

    public BigDecimal evaluate(String ruleScript, Cart cart) {
        // Mỗi lần eval: Groovy parse + compile script -> class mới -> Metaspace
        Script script = shell.parse(ruleScript);
        script.setVariable("cart", cart);
        return (BigDecimal) script.run();
    }
}`
    }
  ],
  questions: [
    'Vì sao Groovy script compilation lại tiêu thụ Metaspace?',
    'Cách khắc phục triệt để.'
  ],
  hints: [
    'Mỗi {{GroovyShell.parse}} compile script thành class mới, nạp bởi GroovyClassLoader con.',
    'GroovyClassLoader không unload class trừ khi chính nó bị GC (không bao giờ xảy ra nếu shell dùng chung).'
  ],
  answer: `**Tóm tắt:** Mỗi lần {{GroovyShell.parse}} biên dịch script Groovy thành một class mới, được nạp bởi một {{GroovyClassLoader}} con của shell. Class này vĩnh viễn nằm trong Metaspace vì shell (và classloader) sống suốt vòng đời ứng dụng. 1.5 request/giây × 3600 giây = 5.400 class/giờ, mỗi class ~2–5 KB Metaspace → chạm 256 MB sau vài giờ.

### Sửa lỗi
1. **Cache CompiledScript:** Dùng {{GroovyScriptEngine}} hoặc tự quản lý cache {{Map<String, Script>}} keyed bởi hash/script content. Chỉ compile một lần per rule.
2. **Hoặc: Compile-time:** Lưu rule đã compile ({{CompiledScript}} qua JSR-223 {{ScriptEngine}}) thay vì source. {{ScriptEngineManager}} + {{Compilable}} compile một lần, {{CompiledScript.eval}} chạy nhanh và không sinh class mới.
3. **Giới hạn Metaspace:** {{-XX:MaxMetaspaceSize}} 256 MB quá thấp cho dynamic language; tăng lên 512 MB–1 GB nếu phải compile nhiều rule độc lập.

> Senior tip: Groovy (và các JVM script engine khác: Nashorn, Rhino, Jython…) sinh class tại runtime. Luôn cache kết quả compile. Nếu không thể cache (script do user nhập tùy ý), cân nhắc **tách biệt**: chạy script engine trong process riêng (subprocess/gRPC) để Metaspace của process chính không bị ảnh hưởng.`,
  rubric: [
    'Hiểu GroovyShell.parse compile script thành class mới mỗi lần.',
    'Đề xuất cache CompiledScript / Script / dùng GroovyScriptEngine.',
    'Nhận ra classloader leak: GroovyClassLoader con không bao giờ unload class.'
  ],
  tags: ['metaspace', 'groovy', 'script-engine', 'classloader', 'memory-leak']
},
{
  id: 'lab-gc-004',
  category: 'gc',
  title: 'Kafka Consumer xử lý Protobuf message lớn: Humongous Allocation gây phân mảnh và Full GC',
  level: 'senior',
  scenario: `**Bối cảnh:** Sàn TMĐT **MegaCart**, service **order-processor** (Spring Boot 3.2, JDK 21, {{-Xmx4g -XX:+UseG1GC}}), pod 4 vCPU, 5Gi RAM. Service đọc message từ Kafka (cluster throughput rất cao), deserializer dùng {{Protobuf}} để ép kiểu message. Bản thân message trung bình 50 KB, nhưng thỉnh thoảng có các message đặc biệt chứa dữ liệu lịch sử hoặc log (lên đến 2-3 MB). Service xử lý 50-80 messages/giây mỗi pod.

**Triệu chứng:** Từ 09:00 sáng, pod liên tục có các Pause Full GC kéo dài 2–3 giây dù heap không đầy (chỉ dùng khoảng 2 GB). CPU spike theo mỗi đợt GC. Không có lỗi OOM. Dev kiểm tra thấy "humongous" xuất hiện dày đặc trong GC log.

**Dữ liệu thu thập:** Đoạn GC log unified {{-Xlog:gc*:file=/logs/gc.log}} (gồm G1 Humongous Allocation), đoạn code xử lý message, và kết quả {{jfr print --events jdk.ObjectAllocationSample}}.`,
  artifacts: [
    {
      name: 'gc-kafka-processor.log',
      lang: 'text',
      content: `[2026-10-22T09:00:00.000+0700] ... [info][gc] GC(100) Pause Young (Normal) (G1 Evacuation Pause) 500M->200M(4096M) 10ms
...
[2026-10-22T09:05:00.000+0700] ... [info][gc,start] GC(105) Pause Young (Concurrent Start) (G1 Humongous Allocation)
[2026-10-22T09:05:00.005+0700] ... [info][gc] GC(105) Pause Young (Concurrent Start) (G1 Humongous Allocation) 2000M->1500M(4096M) 50ms
[2026-10-22T09:05:05.000+0700] ... [info][gc] GC(106) Pause Young (Normal) (G1 Humongous Allocation) 2500M->2100M(4096M) 60ms
...
[2026-10-22T09:10:00.000+0700] ... [info][gc,start] GC(120) Pause Full (G1 Compaction Pause)
[2026-10-22T09:10:02.000+0700] ... [info][gc] GC(120) Pause Full (G1 Compaction Pause) 3500M->1500M(4096M) 2000ms`
    },
    {
      name: 'KafkaMessageProcessor.java',
      lang: 'text',
      content: `package vn.megacart.order.processor;

import vn.megacart.order.proto.OrderMessage;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
public class KafkaMessageProcessor {

    @KafkaListener(topics = "orders", groupId = "order-processor")
    public void process(ConsumerRecord<String, byte[]> record) {
        try {
            // record.value() là byte[] thô từ Kafka, kích thước = kích thước message trên wire
            // Message 2-3 MB -> byte[] > 1 MB (nửa region 2 MB) -> Humongous Allocation
            OrderMessage msg = OrderMessage.parseFrom(record.value());
            processMessage(msg);
        } catch (Exception e) {
            System.err.println("Failed to process order message: " + e.getMessage());
        }
    }

    private void processMessage(OrderMessage msg) {
        String orderId = msg.getOrderId();
        double amount = msg.getTotalAmount();
        System.out.println("Processing order: " + orderId + " with amount: " + amount);
    }
}`
    }
  ],
  questions: [
    'Vì sao G1 Humongous Allocation lại gây ra Full GC ngay cả khi heap còn dư?',
    'Làm thế nào để xác định chính xác kích thước message nào đang gây humongous allocation?',
    'Đề xuất giải pháp sửa lỗi này.'
  ],
  hints: [
    'G1 cần vùng nhớ liên tiếp (nhiều region 2MB) cho humongous object. Với heap 4GB, region mặc định 2MB, ngưỡng humongous = 1MB.',
    'Dùng JFR ObjectAllocationSample lọc theo objectClass=byte[] và weight > 1MB để thấy message nào lớn.',
    'byte[] đến từ Kafka consumer record.value(), không phải do Protobuf parse tạo ra.'
  ],
  answer: `**Tóm tắt:** Message Kafka lớn (2-3 MB) đến dưới dạng {{byte[]}} từ {{ConsumerRecord.value()}}. Với heap 4 GB, G1 region mặc định 2 MB, ngưỡng humongous = 1 MB. Mảng {{byte[]}} > 1 MB được cấp phát thẳng vào Old Gen trên các region **liên tiếp**. Sự tích tụ các humongous object này làm phân mảnh heap nghiêm trọng (không tìm thấy dãy region liên tiếp cho allocation mới), G1 buộc phải Full GC (G1 Compaction Pause) để nén heap — dù heap chỉ dùng 2/4 GB.

### Cơ chế và Phân mảnh

G1 chia heap thành các region bằng nhau. Object có kích thước từ nửa region trở lên (ở đây 1 MB) là **humongous**:
- Được cấp phát **thẳng vào Old Gen** trên một dãy region **liên tiếp** (2 MB cần 1 region, 3 MB cần 2 region liên tiếp).
- Không đi qua Eden, không được di chuyển bởi young GC (chỉ eager reclaim nếu đã chết).
- Full GC trên JDK 17/21 **không compact humongous region** — chúng giữ nguyên địa chỉ.

Khi nhiều message lớn đến liên tiếp, G1 cấp phát nhiều dãy region liên tiếp cho các {{byte[]}} humongous. Khi các message được xử lý xong, {{byte[]}} trở thành rác, nhưng region humongous bị **phân mảnh** (có region rác lẫn region sống). Lúc này G1 không tìm thấy đủ region liên tiếp cho humongous object mới → **Allocation Failure** → Full GC để compact heap và gom region rác thành dãy liên tiếp.

### Dẫn chứng trong artifact

- GC log: {{Pause Young (Concurrent Start) (G1 Humongous Allocation)}} xuất hiện dày đặc từ 09:05.
- {{Pause Full (G1 Compaction Pause)}} 2000 ms lúc 09:10, heap 3500M->1500M: Full GC dọn rác nhưng pause rất dài do phải compact.
- JFR {{ObjectAllocationSample}} sẽ cho thấy {{byte[]}} weight 2-3 MB từ thread Kafka consumer, stack trace qua {{ConsumerRecord.value()}} → deserializer.

### Sửa lỗi

1. **Tăng region size (giảm ngưỡng humongous):** {{-XX:G1HeapRegionSize=8m}} hoặc 16 MB. Với region 8 MB, ngưỡng humongous = 4 MB → message 2-3 MB không còn là humongous, cấp phát bình thường qua Eden, không gây phân mảnh. Đây là fix nhanh, không đổi code.
2. **Tách luồng xử lý message lớn:** Producer gửi message lớn sang topic riêng ({{orders-large}}), consumer riêng với JVM config khác (region size lớn hơn, hoặc dùng ZGC). Hot path {{orders}} chỉ xử lý message < 1 MB.
3. **Chunking ở producer:** Message > 1 MB được chia nhỏ (chunk) trước khi gửi, consumer gộp lại. Giảm kích thước message trên wire.
4. **Reject/Dead letter:** Consumer kiểm tra {{record.value().length > 1_000_000}} thì gửi DLQ, không xử lý inline.

> Senior tip: Humongous allocation từ network buffer (Kafka, gRPC, HTTP upload) là nguyên nhân phổ biến của Full GC "lạ" trên heap còn trống. Luôn kiểm tra {{record.value().length}} hoặc {{Content-Length}} trước khi deserialize. Tăng {{G1HeapRegionSize}} là fix 5 phút hiệu quả ngay; dài hạn hãy tách đường đi dữ liệu lớn.`,
  rubric: [
    'Nhận diện humongous allocation do byte[] từ Kafka record.value() > 1MB (region 2MB).',
    'Giải thích sự phân mảnh heap: humongous object cần region liên tiếp, rác lẫn sống khiến G1 không tìm được dãy liên tiếp -> Full GC.',
    'Đề xuất tăng G1HeapRegionSize (fix nhanh), tách topic/message lớn, hoặc chunking.',
    'Giải thích Full GC do phân mảnh, không phải do đầy heap; Protobuf parse không tạo byte[] mới.'
  ],
  tags: ['g1', 'humongous', 'kafka', 'protobuf', 'full-gc']
},
{
  id: 'lab-gc-005',
  category: 'gc',
  title: 'Metaspace OOM do tạo Dynamic Proxy cho từng API Path',
  level: 'senior',
  scenario: `**Bối cảnh:** Service **api-gateway** (Spring Boot 3.2, JDK 21) tạo dynamic proxy ({{java.lang.reflect.Proxy}}) cho mỗi endpoint mới được định nghĩa động từ DB. Số lượng endpoint không giới hạn. JVM: {{-XX:MaxMetaspaceSize=256m}}.

**Triệu chứng:** Metaspace tăng dần đều, sau 24h thì pod OOM (Metaspace).

**Dữ liệu thu thập:** {{jcmd 1 VM.classloader_stats}} cho thấy hàng nghìn classloader ẩn (proxy), log lỗi Metaspace.`,
  artifacts: [
    {
      name: 'vm-classloader-stats.txt',
      lang: 'text',
      content: `ClassLoader         Parent              CLD*               Classes   ChunkSz   BlockSz  Type
0x0000000800c62a40  0x0000000800d01f28  0x00007f3a9c4e1d70       0         0         0  jdk.internal.reflect.DelegatingClassLoader
0x0000000801f3a5b8  0x0000000800c62a40  0x00007f3a2c0a8e40       1      5120      4688  jdk.internal.reflect.DelegatingClassLoader
0x0000000801f3a2d0  0x0000000800c62a40  0x00007f3a2c0a8c90       1      5120      4688  jdk.internal.reflect.DelegatingClassLoader
0x0000000801f39fe8  0x0000000800c62a40  0x00007f3a2c0a8ae0       1      5120      4688  jdk.internal.reflect.DelegatingClassLoader
0x0000000801f39d00  0x0000000800c62a40  0x00007f3a2c0a8930       1      5120      4688  jdk.internal.reflect.DelegatingClassLoader
0x0000000801f39a18  0x0000000800c62a40  0x00007f3a2c0a8780       1      5120      4688  jdk.internal.reflect.DelegatingClassLoader
... (hàng nghìn dòng DelegatingClassLoader khác do Proxy tạo ra cho mỗi API Path mới)
0x0000000800d01f28  0x0000000800010d48  0x00007f3a9c2b5a10   14871  92274688  89912320  org.springframework.boot.loader.launch.LaunchedClassLoader
0x0000000800010d48  0x0000000800010a60  0x00007f3a9c1e0c30     102   1048576    940112  jdk.internal.loader.ClassLoaders$AppClassLoader
Total = 5000                                                50000 257075200 242040072
ChunkSz: Total size of all allocated metaspace chunks
BlockSz: Total size of all allocated metaspace blocks (each chunk has several blocks)`
    }
  ],
  questions: [
    'Vì sao dynamic proxy lại tiêu thụ Metaspace?',
    'Cách khắc phục triệt để.'
  ],
  hints: [
    'Mỗi proxy là một class mới được định nghĩa.',
    'Sử dụng caching cho proxy.'
  ],
  answer: `**Tóm tắt:** Mỗi {{Proxy.newProxyInstance}} tạo ra một class mới trong Metaspace. Nếu không cache proxy, hàng nghìn proxy sẽ làm đầy Metaspace.

### Sửa lỗi
1. **Cache Proxy:** Sử dụng một {{ConcurrentHashMap}} để lưu trữ proxy đã tạo theo key là interface và handler. Không bao giờ tạo mới proxy cho cùng một interface.
2. **Tuning:** Kiểm tra lại {{MaxMetaspaceSize}} (256MB là khá nhỏ cho ứng dụng có dynamic proxy).
3. **Giới hạn:** Cần có cơ chế evict các proxy không dùng nữa nếu số lượng endpoint quá lớn.

> Senior tip: Metaspace leak thường do các classloader không được giải phóng. Kiểm tra kỹ xem có classloader nào bị giữ không bằng heap dump.`,
  rubric: [
    'Hiểu mỗi proxy là 1 class.',
    'Đề xuất caching proxy.',
    'Đề xuất tune MaxMetaspaceSize.'
  ],
  tags: ['metaspace', 'dynamic-proxy', 'classloader', 'memory-leak']
}
);