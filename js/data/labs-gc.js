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
... (các đợt export tiếp theo lặp lại đúng mẫu trên; từ 22:01 đến 22:11 có tổng cộng 9 lần Pause Full (G1 Compaction Pause), dài 1.6-2.2 giây) ...
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
      name: 'classloader-stats-1352.txt',
      lang: 'text',
      content: `$ kubectl exec price-engine-7b5f8d-q9wz4 -- jcmd 1 VM.classloader_stats
1:
ClassLoader         Parent              CLD*               Classes   ChunkSz   BlockSz  Type
0x0000000800c62a40  0x0000000800d01f28  0x00007f3a9c4e1d70       0         0         0  groovy.lang.GroovyClassLoader
0x0000000801f3a5b8  0x0000000800c62a40  0x00007f3a2c0a8e40       1      5120      4688  groovy.lang.GroovyClassLoader$InnerLoader
0x0000000801f3a2d0  0x0000000800c62a40  0x00007f3a2c0a8c90       1      5120      4688  groovy.lang.GroovyClassLoader$InnerLoader
0x0000000801f39fe8  0x0000000800c62a40  0x00007f3a2c0a8ae0       1      5120      4688  groovy.lang.GroovyClassLoader$InnerLoader
0x0000000801f39d00  0x0000000800c62a40  0x00007f3a2c0a8930       1      5120      4688  groovy.lang.GroovyClassLoader$InnerLoader
0x0000000801f39a18  0x0000000800c62a40  0x00007f3a2c0a8780       1      5120      4688  groovy.lang.GroovyClassLoader$InnerLoader
... (26,908 dòng groovy.lang.GroovyClassLoader$InnerLoader khác, đều Parent 0x0000000800c62a40, Classes 1)
0x0000000800d01f28  0x0000000800010d48  0x00007f3a9c2b5a10   14871  92274688  89912320  org.springframework.boot.loader.launch.LaunchedClassLoader
                                                              1544   4194304   3801088   + hidden classes
0x0000000800010d48  0x0000000800010a60  0x00007f3a9c1e0c30     102   1048576    940112  jdk.internal.loader.ClassLoaders$AppClassLoader
0x0000000800010a60  0x0000000000000000  0x00007f3a9c1e0950     112    786432    701232  jdk.internal.loader.ClassLoaders$PlatformClassLoader
0x0000000000000000  0x0000000000000000  0x00007f3a9c0d7b30    3214  20971520  20512488  <boot class loader>
Total = 26919                                                46757 257075200 242040072
ChunkSz: Total size of all allocated metaspace chunks
BlockSz: Total size of all allocated metaspace blocks (each chunk has several blocks)`
    },
    {
      name: 'metrics-hourly.txt',
      lang: 'text',
      content: `# Prometheus, pod price-engine-7b5f8d-q9wz4 (khởi động 09:00:12)
# metaspace = jvm_memory_used_bytes{area="nonheap",id="Metaspace"}
# heap_after_gc = jvm_memory_used_bytes{area="heap",id="G1 Old Gen"} ngay sau mixed GC gần nhất

time    metaspace   jvm_classes_loaded_classes  jvm_classes_unloaded_classes_total  heap_after_gc  rule_eval/s  http_5xx/s
09:05     106.6 MB                      20238                                   0         231 MB         1.52        0
10:00     130.5 MB                      25320                                   0         236 MB         1.55        0
11:00     156.5 MB                      30864                                   0         229 MB         1.53        0
12:00     182.5 MB                      36408                                   0         241 MB         1.56        0
13:00     208.5 MB                      41952                                   0         238 MB         1.54        0
13:52     230.8 MB                      46757                                   0         240 MB         1.54        0
14:50     255.9 MB                      52116                                   0         585 MB         0.00       31.6

# promotion_rule (PostgreSQL)
price=> SELECT count(*) AS rules, count(DISTINCT md5(script)) AS distinct_scripts, max(updated_at) FROM promotion_rule WHERE active;
 rules | distinct_scripts |          max
-------+------------------+------------------------
    37 |               37 | 2026-10-20 17:41:09+07
(1 row)`
    },
    {
      name: 'gc-and-app-1449.log',
      lang: 'text',
      content: `[2026-10-21T14:49:51.114+0700][20979.114s][info][gc] GC(1622) Pause Young (Concurrent Start) (Metadata GC Threshold) 912M->604M(2048M) 18.553ms
[2026-10-21T14:49:51.114+0700][20979.114s][info][gc,metaspace] GC(1622) Metaspace: 261402K(262144K)->261402K(262144K) NonClass: 229118K(229632K)->229118K(229632K) Class: 32284K(32512K)->32284K(32512K)
[2026-10-21T14:49:51.114+0700][20979.114s][info][gc] GC(1623) Concurrent Mark Cycle
[2026-10-21T14:49:52.020+0700][20980.020s][info][gc] GC(1623) Pause Remark 640M->638M(2048M) 31.022ms
[2026-10-21T14:49:52.020+0700][20980.020s][info][gc,metaspace] GC(1623) Metaspace: 261402K(262144K)->261402K(262144K) NonClass: 229118K(229632K)->229118K(229632K) Class: 32284K(32512K)->32284K(32512K)
[2026-10-21T14:49:52.114+0700][20980.114s][info][gc] GC(1623) Pause Cleanup 642M->642M(2048M) 0.402ms
[2026-10-21T14:49:52.130+0700][20980.130s][info][gc] GC(1623) Concurrent Mark Cycle 1016.115ms
[2026-10-21T14:49:53.311+0700][20981.311s][info][gc] GC(1624) Pause Full (Metadata GC Threshold) 702M->588M(2048M) 1210.774ms
[2026-10-21T14:49:53.311+0700][20981.311s][info][gc,metaspace] GC(1624) Metaspace: 262101K(262144K)->262101K(262144K) NonClass: 229790K(229824K)->229790K(229824K) Class: 32311K(32320K)->32311K(32320K)
[2026-10-21T14:49:54.500+0700][20982.500s][info][gc] GC(1625) Pause Full (Metadata GC Clear Soft References) 588M->585M(2048M) 1189.302ms
[2026-10-21T14:49:54.500+0700][20982.500s][info][gc,metaspace] GC(1625) Metaspace: 262101K(262144K)->262101K(262144K) NonClass: 229790K(229824K)->229790K(229824K) Class: 32311K(32320K)->32311K(32320K)

{"@timestamp":"2026-10-21T14:49:50.877+07:00","level":"INFO","thread_name":"http-nio-8080-exec-12","logger_name":"vn.shopvn.price.CartPricingController","message":"priced cart c-88213 total=1290000 rules=[R-1007]","traceId":"6721f1c5a3e94b0d"}
{"@timestamp":"2026-10-21T14:49:54.502+07:00","level":"ERROR","thread_name":"http-nio-8080-exec-37","logger_name":"o.a.c.c.C.[.[.[/].[dispatcherServlet]","message":"Servlet.service() for servlet [dispatcherServlet] in context with path [] threw exception [Handler dispatch failed: java.lang.OutOfMemoryError: Metaspace] with root cause","traceId":"6721f1c5b81c22aa","stack_trace":"java.lang.OutOfMemoryError: Metaspace
	at java.base/java.lang.ClassLoader.defineClass1(Native Method)
	at java.base/java.lang.ClassLoader.defineClass(ClassLoader.java:1012)
	at java.base/java.security.SecureClassLoader.defineClass(SecureClassLoader.java:150)
	at groovy.lang.GroovyClassLoader$ClassCollector.createClass(GroovyClassLoader.java:624)
	at groovy.lang.GroovyClassLoader$ClassCollector.onClassNode(GroovyClassLoader.java:644)
	at groovy.lang.GroovyClassLoader.doParseClass(GroovyClassLoader.java:351)
	at groovy.lang.GroovyClassLoader.parseClass(GroovyClassLoader.java:311)
	at groovy.lang.GroovyShell.parseClass(GroovyShell.java:572)
	at groovy.lang.GroovyShell.parse(GroovyShell.java:584)
	at groovy.lang.GroovyShell.parse(GroovyShell.java:620)
	at vn.shopvn.price.rule.PricingRuleEngine.evaluate(PricingRuleEngine.java:26)
	at vn.shopvn.price.CartPricingService.applyPromotions(CartPricingService.java:88)
	..."}
{"@timestamp":"2026-10-21T14:49:54.733+07:00","level":"WARN","thread_name":"HikariPool-1 housekeeper","logger_name":"com.zaxxer.hikari.pool.HikariPool","message":"HikariPool-1 - Thread starvation or clock leap detected (housekeeper delta=32s417ms).","traceId":""}`
    },
    {
      name: 'PricingRuleEngine.java',
      lang: 'text',
      content: `package vn.shopvn.price.rule;

import groovy.lang.Binding;
import groovy.lang.GroovyShell;
import groovy.lang.Script;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Map;
import org.springframework.stereotype.Service;
import vn.shopvn.price.Cart;

@Service
public class PricingRuleEngine {

    // Review 2.4: "tạo GroovyShell mỗi lần thì tốn, nên giữ 1 shell dùng chung"
    private final GroovyShell shell = new GroovyShell(PricingRuleEngine.class.getClassLoader());

    /**
     * rule.getScript() ví dụ:
     *   if (cart.total >= 500000 && cart.merchantId == 'M-1007') return cart.total * 0.05
     *   return 0
     */
    public BigDecimal evaluate(PromotionRule rule, Cart cart) {
        if (rule.getScript() == null) return BigDecimal.ZERO;

        Script script = shell.parse(rule.getScript());          // dòng 26
        script.setBinding(new Binding(Map.of("cart", cart, "now", LocalDateTime.now())));
        Object result = script.run();
        return result == null ? BigDecimal.ZERO : new BigDecimal(result.toString());
    }
}`
    }
  ],
  questions: [
    'Vì sao heap chỉ khoảng 600 MB mà JVM vẫn OutOfMemoryError? Vì sao class histogram không thấy gì bất thường?',
    'Từ classloader_stats và metric, hãy chứng minh nguyên nhân gốc: ai tạo ra các class, vì sao chúng không bao giờ được unload? Chỉ có 37 rule thì đáng lẽ cần bao nhiêu class?',
    'Bạn sửa ngắn hạn và dài hạn thế nào? Tăng MaxMetaspaceSize lên 1 GB hoặc bỏ giới hạn có phải ý hay không? Alert gì cần thêm?'
  ],
  hints: [
    'Metaspace chứa metadata của class (bytecode, method, constant pool), không phải object. Hãy xem cột Classes và Parent trong classloader_stats: có bao nhiêu loader, mỗi loader nạp bao nhiêu class, và parent của chúng là ai?',
    'jvm_classes_unloaded_classes_total luôn bằng 0, còn số class tăng khoảng 1.54 class/giây, bằng đúng rule_eval/s. Hai Full GC cuối cũng không giảm được Metaspace. Điều đó nghĩa là các class vẫn reachable.',
    'GroovyShell.parse(String) compile ra một class mới mỗi lần gọi (tên script tự sinh), và GroovyClassLoader cha giữ class đã sinh trong cache của nó. Shell lại là field của một singleton bean.'
  ],
  answer: `**Tóm tắt:** Đây là **class leak trong Metaspace**. {{PricingRuleEngine}} gọi {{shell.parse(script)}} ở **mỗi request**, nên Groovy compile ra **một class mới mỗi lần** (mỗi class được define bởi một {{GroovyClassLoader$InnerLoader}} riêng). Tất cả đều được {{GroovyClassLoader}} của shell giữ lại, mà shell là field của singleton bean, nên không class nào được unload. Chỉ có 37 rule, nhưng 5 giờ đã sinh ra khoảng 27 nghìn class và lấp đầy {{MaxMetaspaceSize=256m}}.

### Vì sao heap trống mà vẫn OOM

- **Metaspace** là vùng native memory, nằm ngoài heap, chứa metadata của class: cấu trúc Klass, method, bytecode, constant pool. Nó bị giới hạn bởi {{-XX:MaxMetaspaceSize}}, không liên quan gì đến {{-Xmx}}.
- {{GC.class_histogram}} đếm **object trên heap**. Một class Groovy nhỏ trên heap chỉ là một object {{java.lang.Class}} vài trăm byte cộng một InnerLoader, tức vài MB cho 27 nghìn class, nên lẫn vào nhiễu. Phần nặng (khoảng 4.7 KB mỗi class) nằm trong Metaspace, và histogram không thể hiện phần này.
- **Class chỉ được unload khi class loader của nó không còn reachable**, và việc này xảy ra trong GC (ở G1 là lúc Remark hoặc Full GC). Không có cơ chế nào unload từng class riêng lẻ.

### Dẫn chứng

- {{classloader_stats}}: {{Total = 26919}} loader, trong đó **26,914 loader {{GroovyClassLoader$InnerLoader}}**, mỗi loader **Classes 1**, ChunkSz 5120. Tất cả có **cùng Parent 0x0000000800c62a40**, chính là dòng {{groovy.lang.GroovyClassLoader}} duy nhất (Classes 0), loader của shell dùng chung. 26,914 × 5,120 byte ≈ 131 MB, chiếm hơn một nửa Metaspace.
- So sánh: {{LaunchedClassLoader}} (toàn bộ Spring, Hibernate, code ứng dụng) chỉ có 14,871 class và khoảng 88 MB.
- Metric: {{jvm_classes_loaded_classes}} tăng đều khoảng 5,544 class/giờ, tức 1.54 class/giây, **bằng đúng {{rule_eval/s}}**. Một lần evaluate sinh ra một class. {{jvm_classes_unloaded_classes_total}} bằng 0 suốt gần 6 giờ. Metaspace tăng khoảng 26 MB/giờ, còn heap after GC phẳng ở khoảng 230–240 MB.
- {{promotion_rule}}: chỉ có **37 script khác nhau**, và lần sửa gần nhất là hôm trước. Lẽ ra chỉ cần 37 class.
- GC log: {{Pause Young (Concurrent Start) (Metadata GC Threshold)}}, sau đó {{Pause Remark}} (nơi G1 unload class) mà Metaspace vẫn {{261402K->261402K}}. Tiếp theo JVM thử hai Full GC: {{Pause Full (Metadata GC Threshold)}} và {{Pause Full (Metadata GC Clear Soft References)}}, đây là nỗ lực cuối cùng trước khi ném OOM. Metaspace vẫn {{262101K->262101K}}, gần chạm 262144K (256 MB), nghĩa là **không có gì để thu hồi**, tất cả đều reachable.
- Stack trace: OOM xảy ra trong {{ClassLoader.defineClass1}}, được gọi từ {{GroovyShell.parse}} tại {{PricingRuleEngine.evaluate(PricingRuleEngine.java:26)}}.
- Dòng Hikari {{Thread starvation or clock leap detected}} chỉ là hệ quả của hai Full GC dài khoảng 1.2 giây, không phải nguyên nhân.

### Cơ chế bên trong Groovy

1. {{GroovyShell.parse(String)}} tự đặt tên script mới (dạng ScriptNNN) cho mỗi lần gọi, nên không có cache hit: **mỗi lần gọi là một lần compile**, kể cả khi nội dung script giống hệt.
2. {{GroovyClassLoader.doParseClass}} tạo một {{InnerLoader}} (con của loader của shell) để define class mới, sau đó **đưa class vào class cache của GroovyClassLoader cha**.
3. Chuỗi tham chiếu: bean singleton {{PricingRuleEngine}} → {{shell}} → {{GroovyClassLoader}} → class cache → {{Class ScriptNNN}} → InnerLoader của nó. Vì chuỗi này luôn reachable, không GC nào unload được.

Nhận xét "giữ 1 shell dùng chung" trong code review chỉ đúng một nửa: shell dùng chung **cộng với** việc parse mỗi request chính là thứ biến nó thành kho chứa class vô hạn. Nếu tạo shell mới mỗi request thì các class có thể unload khi GC, nhưng vẫn tốn CPU compile (vài ms mỗi lần) và gây áp lực Metaspace và GC liên tục. Cả hai cách đều sai ở chỗ **compile trong hot path**.

### Cách sửa

**Ngắn hạn (hotfix):** compile mỗi rule **một lần**, cache Class theo id và phiên bản của rule, và tạo instance Script mới cho mỗi request. Script **không thread-safe** vì giữ Binding riêng, nên không được dùng chung một instance Script giữa các thread.

~~~java
private final GroovyClassLoader gcl = new GroovyClassLoader(getClass().getClassLoader());
private final Map<String, Class<? extends Script>> compiled = new ConcurrentHashMap<>();

@SuppressWarnings("unchecked")
public BigDecimal evaluate(PromotionRule rule, Cart cart) {
    String key = rule.getId() + ":" + rule.getVersion();          // đổi version thì compile lại
    Class<? extends Script> cls = compiled.computeIfAbsent(key,
            k -> (Class<? extends Script>) gcl.parseClass(rule.getScript(), "Rule_" + rule.getId() + "_v" + rule.getVersion() + ".groovy"));
    Script script = InvokerHelper.createScript(cls, new Binding(Map.of("cart", cart)));
    Object result = script.run();
    return result == null ? BigDecimal.ZERO : new BigDecimal(result.toString());
}
~~~

Khi rule đổi phiên bản, class cũ vẫn nằm trong cache của {{gcl}}. Có hai cách xử lý: dùng **một GroovyClassLoader riêng cho mỗi lần reload toàn bộ bộ rule** rồi bỏ loader cũ (để cả cây class unload được), hoặc gọi {{gcl.clearCache()}} và xoá map {{compiled}} khi rule thay đổi. Số rule nhỏ (37) nên chi phí không đáng kể.

**Dài hạn:**
- Nếu rule chỉ là biểu thức điều kiện và phép tính, cân nhắc một **expression language không sinh class mỗi lần đánh giá** (SpEL đã parse sẵn, hoặc rule dạng dữ liệu như bảng điều kiện), dễ kiểm soát và audit hơn.
- **Bảo mật:** script Groovy do merchant viết chạy trong JVM thanh toán tương đương với remote code execution. Bắt buộc dùng sandbox ({{SecureASTCustomizer}} với whitelist import và receiver, giới hạn thời gian chạy), duyệt rule trước khi active, hoặc tách ra một service riêng có quyền tối thiểu.

**Tăng MaxMetaspaceSize lên 1 GB hay bỏ giới hạn?** Không. Làm vậy chỉ dời sự cố từ khoảng 6 giờ lên khoảng 35 giờ. Nếu bỏ giới hạn (mặc định là không giới hạn), Metaspace sẽ ăn dần vào memory limit của container và pod bị **OOMKilled** mà không có stack trace, khó chẩn đoán hơn nhiều. Giữ giới hạn hợp lý để lỗi lộ ra rõ ràng là đúng.

### Phòng ngừa và alert

- Alert khi {{rate(jvm_classes_loaded_classes)}} còn dương sau 30 phút kể từ khi khởi động. Ứng dụng ổn định thì số class gần như phẳng sau warm-up.
- Alert khi Metaspace dùng trên 80% {{MaxMetaspaceSize}}, và khi GC log có cause {{Metadata GC Threshold}} lặp lại liên tục.
- Test tích hợp: chạy 10,000 lần evaluate, assert số class tăng không quá số rule.
- Code review: cấm {{GroovyShell.parse}}, {{GroovyClassLoader.parseClass}}, {{ScriptEngine.eval}} (với script dạng String), {{Proxy.newProxyInstance}} với loader mới, ByteBuddy hoặc CGLIB tạo class trong request path, trừ khi có cache.

> Senior tip: Khi thấy OOM Metaspace, việc đầu tiên là chạy {{jcmd <pid> VM.classloader_stats}} và nhìn **số lượng loader và parent của chúng**. Hàng nghìn loader cùng loại, mỗi loader 1–2 class, gần như luôn là sinh class động trong hot path (Groovy, JSR-223, proxy, bytecode generation). Còn một vài loader khổng lồ không chịu biến mất thường là leak do hot redeploy hoặc ThreadLocal giữ loader cũ. Muốn biết tên class thì bật {{-Xlog:class+load=info}} tạm thời trên một pod, hoặc dùng {{jcmd <pid> VM.metaspace show-loaders}} để xem chi tiết hơn.`,
  rubric: [
    'Giải thích Metaspace là native memory chứa metadata của class, tách biệt với heap; histogram heap không thấy được, class chỉ unload khi loader của nó unreachable.',
    'Dẫn chứng: khoảng 26,914 GroovyClassLoader$InnerLoader mỗi cái 1 class, cùng parent là một GroovyClassLoader; số class tăng 1.54/s bằng rule_eval/s; unloaded = 0; hai Full GC (Metadata GC Threshold, Clear Soft References) không giảm được Metaspace.',
    'Chỉ đúng nguyên nhân: shell.parse() mỗi request trên một GroovyShell singleton, mỗi lần sinh class mới và class bị giữ trong cache của GroovyClassLoader; chỉ có 37 rule nên chỉ cần 37 class.',
    'Đề xuất compile một lần và cache Class theo rule id và version, tạo Script instance mới mỗi request (Script không thread-safe), có cách giải phóng class khi rule đổi.',
    'Phản biện việc tăng hoặc bỏ MaxMetaspaceSize (chỉ dời sự cố, có thể thành OOMKilled), và có alert theo class loaded rate và Metaspace usage; nhắc rủi ro bảo mật của script do merchant viết.'
  ],
  tags: ['metaspace', 'classloader-leak', 'groovy', 'oom', 'class-unloading']
},
{
  id: 'lab-gc-004',
  category: 'gc',
  title: 'Pod QR gateway bị OOMKilled trong khi heap mới dùng 40%',
  level: 'lead',
  scenario: `**Bối cảnh:** **PayFast** vận hành **qr-gateway** (Spring Boot 3.3 WebFlux, Reactor Netty, JDK 21.0.4) nhận callback thanh toán QR từ merchant và gọi core banking. Pod Kubernetes: request 1Gi, **limit 2Gi**, 2 vCPU. {{JAVA_TOOL_OPTIONS=-XX:MaxRAMPercentage=75.0 -XX:+UseG1GC -XX:NativeMemoryTracking=summary}} (NMT vừa được bật sau các lần restart trước). Không đặt {{-Xms}}, {{-Xss}} hay {{-XX:MaxDirectMemorySize}}.

**Triệu chứng:** Ngày **21/10/2026**, pod restart 6 lần, lần gần nhất lúc **10:21:17**. Mỗi lần restart đều có exit code 137, không có {{OutOfMemoryError}} trong log, không có heap dump. Dashboard JVM cho thấy heap used chỉ khoảng 600 MB / 1.5 GB (40%). Từ 09:40 đến 10:10, core banking chậm (p99 từ 300 ms lên 4 giây). Từ 08:10, merchant **M-2231** đổi secret ký callback nhưng cấu hình sai, nên liên tục nhận HTTP 401 và gửi lại.

**Dữ liệu thu thập:** {{kubectl describe pod}} và log kernel của node, metric Prometheus theo thời gian, {{jcmd 1 VM.native_memory summary}} lúc 10:05, log Netty, và code liên quan.`,
  artifacts: [
    {
      name: 'kubectl-and-dmesg.txt',
      lang: 'text',
      content: `$ kubectl -n payment describe pod qr-gateway-6c8d9f7b5-x2k4p
Name:             qr-gateway-6c8d9f7b5-x2k4p
Namespace:        payment
Node:             ip-10-42-3-17.ap-southeast-1.compute.internal/10.42.3.17
Containers:
  app:
    Image:          registry.payfast.vn/qr-gateway:3.18.2
    State:          Running
      Started:      Tue, 21 Oct 2026 10:21:19 +0700
    Last State:     Terminated
      Reason:       OOMKilled
      Exit Code:    137
      Started:      Tue, 21 Oct 2026 08:00:41 +0700
      Finished:     Tue, 21 Oct 2026 10:21:17 +0700
    Ready:          True
    Restart Count:  6
    Limits:
      cpu:     2
      memory:  2Gi
    Requests:
      cpu:      1
      memory:   1Gi
    Environment:
      JAVA_TOOL_OPTIONS:  -XX:MaxRAMPercentage=75.0 -XX:+UseG1GC -XX:NativeMemoryTracking=summary
      SPRING_PROFILES_ACTIVE:  prod
Events:
  Type     Reason   Age   From     Message
  ----     ------   ----  ----     -------
  Normal   Pulled   2m    kubelet  Container image "registry.payfast.vn/qr-gateway:3.18.2" already present on machine
  Normal   Created  2m    kubelet  Created container app
  Normal   Started  2m    kubelet  Started container app

# dmesg -T trên node ip-10-42-3-17
[Tue Oct 21 10:21:17 2026] java invoked oom-killer: gfp_mask=0xcc0(GFP_KERNEL), order=0, oom_score_adj=983
[Tue Oct 21 10:21:17 2026] memory: usage 2097152kB, limit 2097152kB, failcnt 1184
[Tue Oct 21 10:21:17 2026] Memory cgroup out of memory: Killed process 412873 (java) total-vm:5713408kB, anon-rss:2081256kB, file-rss:24312kB, shmem-rss:0kB, UID:1001 pgtables:5124kB oom_score_adj:983`
    },
    {
      name: 'prometheus-timeline.txt',
      lang: 'text',
      content: `# pod qr-gateway-6c8d9f7b5-x2k4p (container khởi động 08:00:41)
# heap_used/heap_committed = sum(jvm_memory_used_bytes / jvm_memory_committed_bytes{area="heap"})
# nonheap_used            = sum(jvm_memory_used_bytes{area="nonheap"})      (Metaspace, Compressed Class Space, CodeHeap)
# direct_used / count     = jvm_buffer_memory_used_bytes{id="direct"} / jvm_buffer_count_buffers{id="direct"}
# working_set             = container_memory_working_set_bytes{container="app"}
# cb_p99                  = histogram_quantile(0.99, http_client_requests_seconds_bucket{client_name="core-banking"})

time   heap_used heap_committed nonheap_used direct_used direct_count threads_live 401_callbacks/s cb_p99  working_set
08:05     402 MB         612 MB       171 MB       66 MB           17           96             0.0  0.31 s    0.98 GiB
08:30     455 MB         790 MB       176 MB      126 MB           32           98             5.2  0.30 s    1.21 GiB
09:00     512 MB         904 MB       179 MB      210 MB           53           97             5.3  0.32 s    1.41 GiB
09:30     571 MB        1018 MB       181 MB      294 MB           74          101             5.1  0.29 s    1.61 GiB
10:00     604 MB        1146 MB       183 MB      378 MB           95          388             5.2  4.10 s    1.86 GiB
10:05     610 MB        1170 MB       183 MB      392 MB           98          412             5.2  3.85 s    1.90 GiB
10:20     623 MB        1212 MB       184 MB      434 MB          109          409             5.3  0.44 s    1.99 GiB
10:21:17  (container bị OOMKilled, series mất)

# jvm_memory_max_bytes{area="heap"} = 1610612736 (1536 MiB)
# http_server_requests_seconds_count{uri="/v1/callbacks/{merchantId}",status="401"}: 99.6% đến từ merchantId=M-2231`
    },
    {
      name: 'nmt-summary-1005.txt',
      lang: 'text',
      content: `$ kubectl exec qr-gateway-6c8d9f7b5-x2k4p -- jcmd 1 VM.native_memory summary scale=KB
1:

Native Memory Tracking:

(Omitting categories weighting less than 1KB)

Total: reserved=4034694KB, committed=1997510KB
       malloc: 454772KB #1243560
       mmap:   reserved=3579922KB, committed=1542738KB

-                 Java Heap (reserved=1572864KB, committed=1198080KB)
                            (mmap: reserved=1572864KB, committed=1198080KB)

-                     Class (reserved=3036KB, committed=3036KB)
                            (classes #21432)
                            (  instance classes #20218, array classes #1214)
                            (malloc=3036KB #67210)

-                    Thread (reserved=425098KB, committed=71226KB)
                            (thread #412)
                            (stack: reserved=422912KB, committed=69040KB)
                            (malloc=1402KB #2482)
                            (arena=784KB #822)

-                      Code (reserved=253632KB, committed=58912KB)
                            (malloc=3112KB #11876)
                            (mmap: reserved=250520KB, committed=55800KB)

-                        GC (reserved=142804KB, committed=82420KB)
                            (malloc=5210KB #12044)
                            (mmap: reserved=137594KB, committed=77210KB)

-                  Compiler (reserved=1148KB, committed=1148KB)
                            (malloc=1016KB #1650)
                            (arena=132KB #5)

-                  Internal (reserved=2410KB, committed=2410KB)
                            (malloc=2410KB #41210)

-                     Other (reserved=401408KB, committed=401408KB)
                            (malloc=401408KB #112)

-                    Symbol (reserved=27544KB, committed=27544KB)
                            (malloc=25288KB #301442)
                            (arena=2256KB #1)

-    Native Memory Tracking (reserved=6120KB, committed=6120KB)
                            (malloc=412KB #5874)
                            (tracking overhead=5708KB)

-        Shared class space (reserved=16384KB, committed=12432KB)
                            (mmap: reserved=16384KB, committed=12432KB)

-               Arena Chunk (reserved=412KB, committed=412KB)
                            (malloc=412KB)

-                    Module (reserved=1066KB, committed=1066KB)
                            (malloc=1066KB #5410)

-           Synchronization (reserved=1120KB, committed=1120KB)
                            (malloc=1120KB #11650)

-                 Metaspace (reserved=1179648KB, committed=130176KB)
                            (mmap: reserved=1179648KB, committed=130176KB)`
    },
    {
      name: 'netty-log-and-code.txt',
      lang: 'text',
      content: `{"@timestamp":"2026-10-21T08:47:03.118+07:00","level":"ERROR","thread_name":"reactor-http-epoll-2","logger_name":"io.netty.util.ResourceLeakDetector","message":"LEAK: ByteBuf.release() was not called before it's garbage-collected. Enable advanced leak reporting to find out where the leak occurred. To enable advanced leak reporting, specify the JVM option '-Dio.netty.leakDetection.level=advanced' or call ResourceLeakDetector.setLevel() See https://netty.io/wiki/reference-counted-objects.html for more information."}
{"@timestamp":"2026-10-21T08:47:05.902+07:00","level":"INFO","thread_name":"reactor-http-epoll-1","logger_name":"vn.payfast.gateway.callback.CallbackHandler","message":"callback accepted merchant=M-1004 txn=QR2610210847051188 amount=250000","traceId":"6721a3b9e4c07f12"}
{"@timestamp":"2026-10-21T08:47:05.913+07:00","level":"WARN","thread_name":"reactor-http-epoll-2","logger_name":"vn.payfast.gateway.security.SignatureWebFilter","message":"invalid signature merchant=M-2231 path=/v1/callbacks/M-2231","traceId":"6721a3b9e5d1aa03"}
{"@timestamp":"2026-10-21T09:52:40.551+07:00","level":"ERROR","thread_name":"reactor-http-epoll-1","logger_name":"io.netty.util.ResourceLeakDetector","message":"LEAK: ByteBuf.release() was not called before it's garbage-collected. Enable advanced leak reporting to find out where the leak occurred. ..."}
{"@timestamp":"2026-10-21T09:52:41.007+07:00","level":"WARN","thread_name":"cb-call-287","logger_name":"vn.payfast.gateway.corebank.CoreBankClient","message":"core-banking slow call 4012 ms op=creditAccount","traceId":"6721a8f8a0b3c551"}

# Kết quả grep trong repo
$ grep -rn "DataBufferUtils.join\|newCachedThreadPool" src/main/java
src/main/java/vn/payfast/gateway/security/SignatureWebFilter.java:24:        return DataBufferUtils.join(request.getBody())
src/main/java/vn/payfast/gateway/corebank/CoreBankConfig.java:18:        return Executors.newCachedThreadPool(new CustomizableThreadFactory("cb-call-"));

// ===== SignatureWebFilter.java (rút gọn) =====
@Override
public Mono<Void> filter(ServerWebExchange exchange, WebFilterChain chain) {
    ServerHttpRequest request = exchange.getRequest();
    if (!request.getPath().value().startsWith("/v1/callbacks/")) return chain.filter(exchange);

    return DataBufferUtils.join(request.getBody())                 // buffer pooled direct của Netty
        .flatMap(body -> {
            byte[] bytes = new byte[body.readableByteCount()];
            body.read(bytes);
            if (!hmac.verify(bytes, request.getHeaders().getFirst("X-Signature"))) {
                log.warn("invalid signature merchant={} path={}", merchantId(request), request.getPath());
                exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
                return exchange.getResponse().setComplete();         // trả 401
            }
            DataBufferUtils.release(body);                           // chỉ release ở nhánh hợp lệ
            return chain.filter(exchange.mutate().request(replay(request, bytes)).build());
        });
}

// ===== CoreBankConfig.java (rút gọn) =====
@Bean
ExecutorService coreBankExecutor() {
    return Executors.newCachedThreadPool(new CustomizableThreadFactory("cb-call-"));   // không giới hạn số thread
}
// CoreBankClient: Mono.fromCallable(() -> soapClient.call(req)).subscribeOn(Schedulers.fromExecutor(coreBankExecutor))`
    }
  ],
  questions: [
    'Vì sao container bị OOMKilled khi heap used chỉ khoảng 40%? Hãy lập "ngân sách bộ nhớ" của process từ NMT và metric, chỉ ra những thành phần nằm ngoài heap.',
    'Thành phần nào tăng liên tục và vì sao? Chứng minh bằng mối liên hệ giữa các artifact (thời điểm bắt đầu, tốc độ tăng, số lượng buffer).',
    'Vì sao JVM không ném OutOfMemoryError mà bị kernel kill? Đề xuất sửa ngắn hạn, cấu hình JVM/container đúng và alert phù hợp.'
  ],
  hints: [
    'Container bị kill theo bộ nhớ thực của process (RSS), không theo heap used. Hãy so heap used với heap committed, rồi cộng các mục committed trong NMT.',
    'Direct ByteBuffer (bao gồm buffer pool của Netty) nằm trong mục Other của NMT. So sánh Other với direct_used, rồi lấy direct_used chia direct_count. Thời điểm direct bắt đầu tăng trùng với sự kiện nào trong đề bài?',
    'Khi không đặt -XX:MaxDirectMemorySize, giới hạn mặc định của direct memory bằng max heap (1536 MiB). Tổng heap cộng direct có thể đạt tới bao nhiêu so với limit 2Gi? Còn thread: 412 thread × 1 MB stack có thật sự chiếm 412 MB RAM không?'
  ],
  answer: `**Tóm tắt:** Pod bị kill vì **tổng bộ nhớ của process** (heap committed cộng với native memory) vượt 2Gi, chứ không phải vì heap đầy. Có hai nguyên nhân cộng dồn: (1) {{MaxRAMPercentage=75}} cho phép heap chiếm tới 1536 MiB, chỉ để lại 512 MiB cho mọi thứ khác, trong khi phần non-heap cơ bản đã khoảng 450–500 MiB; (2) **leak direct buffer của Netty** trong {{SignatureWebFilter}}: nhánh trả 401 không release buffer, mất khoảng 168 MB/giờ kể từ khi merchant M-2231 bắt đầu gửi chữ ký sai lúc 08:10. Thread tăng lên 412 khi core banking chậm làm tình hình tệ hơn, nhưng không phải nguyên nhân chính.

### Ngân sách bộ nhớ lúc 10:05 (NMT, committed)

| Thành phần | Committed | Ghi chú |
|---|---|---|
| Java Heap | 1,170 MB | used chỉ 610 MB, nhưng committed mới là phần chiếm RAM; có thể lên tới 1,536 MB |
| Other (direct buffer) | **392 MB** | tăng liên tục |
| Metaspace + Class + Shared class space | 142 MB | ổn định |
| GC (remembered set, bitmap của G1) | 80 MB | tỉ lệ với kích thước heap |
| Thread (412 thread) | 70 MB | stack reserved 413 MB nhưng committed chỉ 67 MB |
| Code cache | 58 MB | ổn định |
| Symbol, NMT, Internal và các mục khác | 39 MB | ổn định |
| **Tổng** | **1,997,510 KB ≈ 1.90 GiB** | khớp với {{working_set 1.90 GiB}} lúc 10:05 |

Lúc 10:20, heap committed 1,212 MB và direct 434 MB, working set đạt 1.99 GiB. Chỉ cần G1 mở rộng thêm vài chục MB heap (vẫn hợp lệ vì max là 1,536 MB) là chạm limit: {{memory: usage 2097152kB, limit 2097152kB}} và {{anon-rss:2081256kB}}.

Hai cái bẫy khi đọc dashboard:
- **Heap used khác heap committed.** Container trả giá cho phần committed (các trang heap G1 đã chạm vào), không phải phần used. G1 hầu như không trả lại bộ nhớ cho OS khi không có Full GC hoặc periodic GC.
- **Thread stack reserved khác committed.** {{-Xss}} mặc định 1 MB là bộ nhớ ảo được reserve. RAM thật chỉ là phần stack đã dùng: {{stack: reserved=422912KB, committed=69040KB}}, khoảng 170 KB mỗi thread. Vì vậy "412 thread × 1 MB = 412 MB" là sai.

### Leak direct memory: bằng chứng

1. NMT {{Other committed=401408KB}} (392 MB) trùng khớp với {{direct_used 392 MB}} lúc 10:05. Đây là bộ nhớ cấp phát qua direct ByteBuffer.
2. 392 MB / 98 buffer ≈ **4 MB mỗi buffer**, đúng kích thước một chunk của {{PooledByteBufAllocator}} trong Netty 4.1. Pool cứ phải cấp thêm chunk mới vì các chunk cũ có buffer bị giữ mà không ai trả lại.
3. Thời điểm và tốc độ: direct ở mức 66 MB lúc 08:05 (pool cơ bản), bắt đầu tăng **từ 08:10, đúng lúc M-2231 bắt đầu nhận 401**. Tốc độ tăng đều khoảng 168 MB/giờ (126 → 210 → 294 → 378 MB mỗi 30 phút) và không phụ thuộc vào core banking chậm hay nhanh. Với khoảng 5.2 request 401 mỗi giây, mỗi request mất khoảng 9 KB, cỡ một body callback sau khi join.
4. Log {{ResourceLeakDetector}}: {{LEAK: ByteBuf.release() was not called before it's garbage-collected}}. Mức SIMPLE mặc định chỉ lấy mẫu một phần nhỏ buffer nên log thưa, nhưng đây là xác nhận trực tiếp.
5. Code: {{DataBufferUtils.join}} tạo buffer pooled. Nhánh {{!hmac.verify}} trả về {{setComplete()}} mà **không gọi** {{DataBufferUtils.release(body)}}. Chỉ nhánh hợp lệ mới release. Trước 08:10 hầu như không có request sai chữ ký nên leak không lộ ra.

### Vì sao không có OutOfMemoryError

{{-XX:MaxDirectMemorySize}} không được đặt, nên giới hạn mặc định bằng max heap, tức 1536 MiB. Lý thuyết heap 1536 cộng direct 1536 cộng non-heap khoảng 450 là hơn 3.4 GiB, vượt xa limit 2 GiB. JVM chưa bao giờ chạm các giới hạn của chính nó, nên chính **kernel cgroup** là bên ra tay trước bằng SIGKILL (exit 137). JVM không có cơ hội ghi log hay dump. Đây là lý do mọi thông số JVM phải **cộng lại nhỏ hơn limit của container**.

### Thread: yếu tố cộng thêm

Từ 09:40, {{cb_p99}} tăng lên khoảng 4 giây. {{newCachedThreadPool}} không có giới hạn nên tạo thread mới cho mỗi lời gọi đang chờ, số thread tăng từ khoảng 100 lên 412. Phần này chỉ thêm khoảng 50 MB RAM, nhưng đó là dấu hiệu thiếu bulkhead: nếu core banking chậm lâu hơn, số thread có thể lên hàng nghìn và còn dồn thêm tải cho core banking.

### Cách sửa

**Ngắn hạn (hotfix trong ngày):**
1. Release buffer ở **mọi** nhánh:

~~~java
return DataBufferUtils.join(request.getBody())
    .flatMap(body -> {
        byte[] bytes = new byte[body.readableByteCount()];
        body.read(bytes);
        DataBufferUtils.release(body);          // copy xong thì release ngay, trước mọi nhánh rẽ
        if (!hmac.verify(bytes, request.getHeaders().getFirst("X-Signature"))) {
            exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
            return exchange.getResponse().setComplete();
        }
        return chain.filter(exchange.mutate().request(replay(request, bytes)).build());
    });
~~~

Nên giới hạn kích thước body trước khi join, ví dụ dùng {{DataBufferUtils.join(body, maxBytes)}} (Spring 5.3.x trở lên), để chặn callback quá lớn.

2. Cấu hình JVM để tổng nhỏ hơn limit và lỗi lộ ra trong JVM thay vì bị kill: {{-XX:MaxRAMPercentage=55}} (heap khoảng 1126 MiB) hoặc {{-Xmx1100m -Xms1100m}}, cộng với {{-XX:MaxDirectMemorySize=256m}}. Khi vượt, Netty sẽ ném lỗi direct memory có stack trace, thay vì pod chết im lặng.
3. Thay {{newCachedThreadPool}} bằng pool có giới hạn (ví dụ 64 thread kèm queue có giới hạn), hoặc dùng virtual thread trên JDK 21 kèm {{Semaphore}} hay bulkhead để giới hạn số lời gọi đồng thời tới core banking.
4. Làm việc với M-2231 để sửa secret; tạm thời rate-limit theo merchant cho các request 401.

**Dài hạn:**
- Lập ngân sách bộ nhớ cho từng service: heap + MaxDirectMemorySize + metaspace + code cache + GC overhead (khoảng 5–8% heap với G1) + thread × stack thực tế + 10–15% dự phòng ≤ limit.
- Chạy test tích hợp và staging với {{-Dio.netty.leakDetection.level=paranoid}} và cho test fail khi có log LEAK. Viết test riêng cho các nhánh lỗi (401, 400, timeout) của mọi filter đọc body.
- Đặt {{-Xms}} bằng {{-Xmx}} cho service quan trọng, để heap committed cố định ngay từ đầu. Nếu ngân sách sai, pod sẽ chết ngay khi khởi động hoặc load test, thay vì lúc 10 giờ sáng.

### Alert và monitoring

- {{container_memory_working_set_bytes / limit > 0.9}} trong 5 phút. Đây là chỉ số gần nhất với tiêu chí của OOM killer, quan trọng hơn heap used.
- Direct memory tăng liên tục: {{deriv}} của {{jvm_buffer_memory_used_bytes}} (id="direct") trong 30 phút dương kéo dài 1 giờ, hoặc vượt ngưỡng tuyệt đối.
- Đếm số dòng log có chứa {{LEAK:}} từ ResourceLeakDetector: alert ngay từ dòng đầu tiên.
- {{jvm_threads_live_threads}} vượt ngưỡng, và metric về pool (active, queue) của executor gọi core banking.
- Theo dõi {{kube_pod_container_status_last_terminated_reason}} với reason="OOMKilled" cùng với số restart.

> Senior tip: Khi pod bị OOMKilled mà heap trông ổn, hãy bật {{-XX:NativeMemoryTracking=summary}} (chi phí thấp) và chụp {{VM.native_memory summary}} hai lần cách nhau 30–60 phút. Có thể dùng {{VM.native_memory baseline}} rồi {{summary.diff}} để thấy ngay mục nào tăng. Nếu RSS (ví dụ {{anon-rss}} trong log kernel) lớn hơn tổng NMT committed đáng kể tại cùng thời điểm, phần chênh lệch thường là phân mảnh của glibc malloc (có thể giảm bằng {{MALLOC_ARENA_MAX=2}}) hoặc thư viện native mà NMT không theo dõi. Trên Kubernetes, tôi luôn giữ ít nhất 25–30% limit cho phần ngoài heap với service dùng Netty, và không bao giờ để MaxDirectMemorySize ở giá trị mặc định.`,
  rubric: [
    'Giải thích OOMKilled là do tổng RSS (heap committed cộng native) vượt limit 2Gi, không phải heap used; lập được ngân sách từ NMT (khoảng 1.90 GiB lúc 10:05, khớp working set) và chỉ ra MaxRAMPercentage=75 chỉ để lại khoảng 512 MiB cho non-heap.',
    'Xác định leak direct buffer: NMT Other 392 MB khớp direct_used, khoảng 4 MB mỗi buffer (chunk của Netty pool), bắt đầu tăng từ 08:10 cùng lúc có 401 của M-2231, log ResourceLeakDetector, nhánh 401 trong SignatureWebFilter không release.',
    'Giải thích vì sao không có OutOfMemoryError: MaxDirectMemorySize mặc định bằng max heap nên giới hạn của JVM lớn hơn limit container, kernel kill với exit 137.',
    'Nhận diện đúng vai trò của thread: newCachedThreadPool tăng lên 412 thread khi core banking chậm, nhưng stack committed chỉ khoảng 69 MB (reserved khác committed).',
    'Đề xuất: release buffer ở mọi nhánh, giảm heap và đặt MaxDirectMemorySize, executor có giới hạn hoặc bulkhead, leak detection paranoid trong test, alert theo working set / limit, direct memory và log LEAK.'
  ],
  tags: ['oomkilled', 'container', 'native-memory', 'nmt', 'netty', 'direct-memory', 'kubernetes']
},
{
  id: 'lab-gc-005',
  category: 'gc',
  title: 'Chấm điểm gian lận thẻ: p99 tăng gấp 4 sau release, young GC dày đặc',
  level: 'senior',
  scenario: `**Bối cảnh:** Ngân hàng **VNBank** có service **risk-scoring** (Spring Boot 3.3, JDK 21.0.4, G1, {{-Xms4g -Xmx4g}}, pod 4 vCPU) chấm điểm gian lận cho mọi giao dịch thẻ trước khi gửi phê duyệt. SLA: p99 dưới 80 ms. Trong heap có khoảng 1.2 GB model và rule được nạp sẵn (old gen ổn định). Mỗi request được enrich thêm 200 giao dịch gần nhất của khách từ Redis rồi tính 300 feature.

**Triệu chứng:** Bản **3.8** deploy lúc **14:00 ngày 22/10/2026** gồm hai thay đổi nhỏ: thêm "audit log request" và thêm cache cho từng feature. Sau deploy, lưu lượng không đổi (khoảng 1,850 request/giây mỗi pod), nhưng p99 tăng từ 38 ms lên **162 ms**, CPU tăng từ 41% lên 78%. Không có Full GC, không có lỗi. Một bạn đề xuất chuyển sang ZGC "cho pause thấp".

**Dữ liệu thu thập:** GC log cùng khung giờ hôm trước (bản 3.7) và hôm nay (bản 3.8), metric Prometheus, kết quả JFR 5 phút ({{jfr view}} của JDK 21 cùng bảng tổng hợp theo frame ứng dụng) và đoạn code thay đổi trong bản 3.8.`,
  artifacts: [
    {
      name: 'gc-before-after.log',
      lang: 'text',
      content: `### Bản 3.7, pod risk-scoring-7d4c-hx2m9, ngày 21/10 (JVM start 06:00:00)
[2026-10-21T14:30:02.331+0700][30602.331s][info][gc] GC(12804) Pause Young (Normal) (G1 Evacuation Pause) 2519M->1296M(4096M) 11.802ms
[2026-10-21T14:30:04.702+0700][30604.702s][info][gc] GC(12805) Pause Young (Normal) (G1 Evacuation Pause) 2521M->1297M(4096M) 12.114ms
[2026-10-21T14:30:07.081+0700][30607.081s][info][gc] GC(12806) Pause Young (Normal) (G1 Evacuation Pause) 2520M->1297M(4096M) 11.637ms
[2026-10-21T14:30:09.446+0700][30609.446s][info][gc,heap] GC(12807) Eden regions: 614->0(614)
[2026-10-21T14:30:09.446+0700][30609.446s][info][gc,heap] GC(12807) Survivor regions: 8->9(77)
[2026-10-21T14:30:09.446+0700][30609.446s][info][gc,heap] GC(12807) Old regions: 637->637
[2026-10-21T14:30:09.446+0700][30609.446s][info][gc,heap] GC(12807) Humongous regions: 0->0
[2026-10-21T14:30:09.446+0700][30609.446s][info][gc] GC(12807) Pause Young (Normal) (G1 Evacuation Pause) 2519M->1296M(4096M) 11.915ms

### Bản 3.8, pod risk-scoring-5f9b-q7tnd, ngày 22/10 (JVM start 14:02:10)
[2026-10-22T14:31:02.114+0700][1732.114s][info][gc] GC(3031) Pause Young (Normal) (G1 Evacuation Pause) 2604M->1386M(4096M) 24.913ms
[2026-10-22T14:31:02.685+0700][1732.685s][info][gc] GC(3032) Pause Young (Normal) (G1 Evacuation Pause) 2606M->1389M(4096M) 25.406ms
[2026-10-22T14:31:03.258+0700][1733.258s][info][gc] GC(3033) Pause Young (Normal) (G1 Evacuation Pause) 2609M->1391M(4096M) 24.377ms
[2026-10-22T14:31:03.829+0700][1733.829s][info][gc,start] GC(3034) Pause Young (Normal) (G1 Evacuation Pause)
[2026-10-22T14:31:03.829+0700][1733.829s][info][gc,task] GC(3034) Using 4 workers of 4 for evacuation
[2026-10-22T14:31:03.855+0700][1733.855s][info][gc,phases] GC(3034)   Pre Evacuate Collection Set: 0.2ms
[2026-10-22T14:31:03.855+0700][1733.855s][info][gc,phases] GC(3034)   Merge Heap Roots: 0.5ms
[2026-10-22T14:31:03.855+0700][1733.855s][info][gc,phases] GC(3034)   Evacuate Collection Set: 23.4ms
[2026-10-22T14:31:03.855+0700][1733.855s][info][gc,phases] GC(3034)   Post Evacuate Collection Set: 1.6ms
[2026-10-22T14:31:03.855+0700][1733.855s][info][gc,phases] GC(3034)   Other: 0.3ms
[2026-10-22T14:31:03.855+0700][1733.855s][info][gc,heap] GC(3034) Eden regions: 614->0(614)
[2026-10-22T14:31:03.855+0700][1733.855s][info][gc,heap] GC(3034) Survivor regions: 46->48(77)
[2026-10-22T14:31:03.855+0700][1733.855s][info][gc,heap] GC(3034) Old regions: 646->648
[2026-10-22T14:31:03.855+0700][1733.855s][info][gc,heap] GC(3034) Humongous regions: 0->0
[2026-10-22T14:31:03.855+0700][1733.855s][info][gc] GC(3034) Pause Young (Normal) (G1 Evacuation Pause) 2611M->1393M(4096M) 26.004ms
[2026-10-22T14:31:03.855+0700][1733.855s][info][gc,cpu] GC(3034) User=0.09s Sys=0.00s Real=0.03s
... (mỗi ~0.57 giây một young GC, đã lược bớt) ...
[2026-10-22T14:31:41.529+0700][1771.529s][info][gc] GC(3101) Pause Young (Concurrent Start) (G1 Evacuation Pause) 2742M->1522M(4096M) 27.551ms
[2026-10-22T14:31:41.529+0700][1771.529s][info][gc] GC(3102) Concurrent Mark Cycle
[2026-10-22T14:31:43.318+0700][1773.318s][info][gc] GC(3102) Pause Remark 2644M->2630M(4096M) 8.912ms
[2026-10-22T14:31:43.512+0700][1773.512s][info][gc] GC(3102) Pause Cleanup 2702M->2702M(4096M) 0.512ms
[2026-10-22T14:31:43.520+0700][1773.520s][info][gc] GC(3102) Concurrent Mark Cycle 1991.204ms
[2026-10-22T14:31:43.858+0700][1773.858s][info][gc] GC(3106) Pause Young (Prepare Mixed) (G1 Evacuation Pause) 2760M->1530M(4096M) 31.204ms
[2026-10-22T14:31:44.488+0700][1774.488s][info][gc] GC(3107) Pause Young (Mixed) (G1 Evacuation Pause) 2752M->1404M(4096M) 78.443ms
[2026-10-22T14:31:45.142+0700][1775.142s][info][gc] GC(3108) Pause Young (Mixed) (G1 Evacuation Pause) 2620M->1311M(4096M) 94.118ms
[2026-10-22T14:31:45.761+0700][1775.761s][info][gc] GC(3109) Pause Young (Mixed) (G1 Evacuation Pause) 2531M->1298M(4096M) 71.902ms
... (chu kỳ Concurrent Start rồi 3 Mixed lặp lại khoảng mỗi 1-2 phút; bản 3.7 khoảng 3 giờ mới có một lần) ...`
    },
    {
      name: 'prometheus-compare.txt',
      lang: 'text',
      content: `# So sánh cùng khung 14:25-14:35, trung bình trên 6 pod
metric                                                                        3.7 (21/10)    3.8 (22/10)
sum(rate(http_server_requests_seconds_count{uri="/v1/score"}[5m])) / 6         1,840 rps      1,855 rps
histogram_quantile(0.99, ... uri="/v1/score")                                     38 ms         162 ms
histogram_quantile(0.50, ... uri="/v1/score")                                      9 ms          14 ms
rate(jvm_gc_memory_allocated_bytes_total[5m])                                  0.52 GB/s      2.11 GB/s
rate(jvm_gc_memory_promoted_bytes_total[5m])                                   0.4 MB/s       6.1 MB/s
rate(jvm_gc_pause_seconds_count{action="end of minor GC"}[5m])                  0.42 /s        1.75 /s
rate(jvm_gc_pause_seconds_sum[5m])                                              0.005 s/s      0.046 s/s
max_over_time(jvm_gc_pause_seconds_max[5m])                                     0.014 s        0.094 s
process_cpu_usage                                                               0.41           0.78
rate(logback_events_total{level="debug"}[5m])                                   0 /s           0 /s
rate(logback_events_total{level="info"}[5m])                                    212 /s         214 /s
cache_gets_total{cache="featureCache",result="hit"} / cache_gets_total           -              0.31`
    },
    {
      name: 'jfr-allocation-5m.txt',
      lang: 'text',
      content: `$ jcmd 1 JFR.start duration=5m filename=/tmp/score.jfr settings=profile
$ jfr view allocation-by-class /tmp/score.jfr

                               Allocation by Class

Object Type                                                     Allocation Pressure
--------------------------------------------------------------- -------------------
byte[]                                                                       44.10%
char[]                                                                       23.50%
java.lang.Object[]                                                            6.00%
java.lang.String                                                              5.60%
java.util.Formatter$FormatSpecifier                                           4.20%
java.lang.StringBuilder                                                       3.30%
java.util.ArrayList                                                           3.00%

# Team tự tổng hợp jdk.ObjectAllocationSample theo frame ứng dụng (vn.bank.*) đầu tiên trong stack
weight%   frame ứng dụng đầu tiên                                                    frame JDK/thư viện gần nhất
 59.6%    vn.bank.risk.audit.FraudAuditLogger.logRequest(FraudAuditLogger.java:23)   com.fasterxml.jackson.databind.ObjectMapper.writeValueAsString
 15.8%    vn.bank.risk.feature.FeatureVectorBuilder.featureKey(FeatureVectorBuilder.java:41)  java.lang.String.format
 10.5%    vn.bank.risk.rule.RuleEngine.evaluate(RuleEngine.java:88)                  java.util.stream.ReferencePipeline.collect
  5.3%    vn.bank.risk.api.ScoreController.score(ScoreController.java:31)            org.springframework.http.converter.json.AbstractJackson2HttpMessageConverter.read
  8.8%    (khác)

# Bản 3.7 (JFR ngày 15/10, cùng cách tổng hợp): RuleEngine.evaluate 42.9%, ScoreController.score 21.4%, khác 35.7%`
    },
    {
      name: 'diff-3.7-to-3.8.java',
      lang: 'text',
      content: `// ===== FraudAuditLogger.java (MỚI trong 3.8) =====
@Component
public class FraudAuditLogger {
    private static final Logger log = LoggerFactory.getLogger(FraudAuditLogger.class);
    private final ObjectMapper mapper;

    public FraudAuditLogger(ObjectMapper mapper) { this.mapper = mapper; }

    // logback-spring.xml (prod): <logger name="vn.bank.risk" level="INFO"/>
    // Gọi cho MỌI request, sau khi đã enrich 200 giao dịch gần nhất (JSON khoảng 230 KB)
    public void logRequest(EnrichedRequest req) {
        try {
            log.debug("score request {}", mapper.writeValueAsString(req));   // dòng 23
        } catch (JsonProcessingException e) {
            log.warn("cannot serialize request {}", req.requestId(), e);
        }
    }
}

// ===== FeatureVectorBuilder.java (SỬA trong 3.8: thêm cache theo feature) =====
public double[] build(EnrichedRequest r) {
    double[] out = new double[defs.size()];                       // 300 feature
    for (int i = 0; i < defs.size(); i++) {
        FeatureDef def = defs.get(i);
        Double cached = featureCache.getIfPresent(featureKey(def, r));
        out[i] = cached != null ? cached : compute(def, r);
    }
    return out;
}

String featureKey(FeatureDef def, EnrichedRequest r) {
    return String.format("%s:%s:v%d", r.customerId(), def.name(), def.version());   // dòng 41
}`
    }
  ],
  questions: [
    'Từ GC log và metric, hãy giải thích cơ chế làm p99 tăng: allocation rate, tần suất và độ dài young pause, promotion, mixed GC. Tính tỷ lệ thời gian bị pause trước và sau.',
    'Code nào gây ra phần allocation tăng thêm? Vì sao một dòng log.debug, khi level đang là INFO, vẫn tốn bộ nhớ và CPU?',
    'Đề xuất sửa. Chuyển sang ZGC có phải lời giải đúng không? Bạn sẽ thêm gì vào quy trình để bắt được regression này trước khi lên production?'
  ],
  hints: [
    'Eden không đổi (614 region, khoảng 1.2 GB). Lấy 1.2 GB chia allocation rate thì ra khoảng cách giữa hai young GC. Young pause tỉ lệ với lượng object còn sống phải copy, không phải với kích thước eden: hãy xem Survivor regions trước và sau.',
    'Trong Java, đối số của method được tính TRƯỚC khi method chạy. log.debug("...{}", x) chỉ hoãn việc gọi x.toString(), chứ không hoãn biểu thức tạo ra x. Metric logback_events_total level debug đang bằng 0 nói lên điều gì?',
    'String.format chạy 300 lần mỗi request, và cache hit chỉ 31%. Hãy tính số lần gọi mỗi giây. ZGC giảm pause, nhưng có giảm được 2 GB/s rác và phần CPU dùng để serialize JSON không?'
  ],
  answer: `**Tóm tắt:** Đây là regression về **allocation rate**, không phải leak và không phải lỗi cấu hình GC. Bản 3.8 tăng lượng rác từ khoảng 0.28 MB lên khoảng 1.14 MB mỗi request (allocation từ 0.52 lên 2.11 GB/s). Thủ phạm chính là {{log.debug(..., mapper.writeValueAsString(req))}}: JSON khoảng 230 KB được serialize cho **mọi** request rồi bị vứt đi, vì log level là INFO. Thứ hai là {{String.format}} chạy 300 lần mỗi request để tạo key cache. Young GC dày gấp 4 lần, mỗi pause dài gấp đôi, promotion tăng 15 lần kéo theo chu kỳ mixed GC liên tục, cộng với CPU bị lãng phí, đẩy p99 từ 38 lên 162 ms.

### Đọc GC log và metric

| Chỉ số | 3.7 | 3.8 | Giải thích |
|---|---|---|---|
| Allocation | 0.52 GB/s | 2.11 GB/s | {{jvm_gc_memory_allocated_bytes_total}} |
| Khoảng cách young GC | khoảng 2.37 s | khoảng 0.57 s | Eden 614 region (1228 MB) / allocation rate; khớp timestamp GC(12804..12807) và GC(3031..3034) |
| Young pause | khoảng 12 ms | khoảng 25 ms | {{Survivor regions: 8->9}} so với {{46->48}}: lượng object sống phải copy tăng 5 lần |
| Thời gian pause | 0.5% | 4.6% | {{rate(jvm_gc_pause_seconds_sum)}} 0.005 so với 0.046 giây mỗi giây |
| Promotion | 0.4 MB/s | 6.1 MB/s | survivor chứa không hết, object tuổi thấp bị đẩy sớm lên old |
| Mixed GC | khoảng 3 giờ một lần | khoảng mỗi 1–2 phút | GC(3101) Concurrent Start, GC(3107..3109) Mixed 71–94 ms |

Vì sao young pause dài hơn: thời gian evacuate tỉ lệ với **object còn sống** tại thời điểm GC, không tỉ lệ với kích thước eden. Mỗi request đang xử lý (khoảng 1,850 rps × vài chục ms) giữ chuỗi JSON, buffer {{char[]}} của Jackson và các String key. Mỗi request "nặng" hơn 4 lần thì tập object đang bay cũng lớn hơn, nên survivor tăng từ 8 lên 46–48 region (trên tổng 77 region tối đa). Phần không vừa survivor bị promote sớm lên old ({{Old regions: 646->648}} sau mỗi GC). Old đầy nhanh, chạm IHOP, sinh chu kỳ concurrent mark và 3 mixed GC dài 71–94 ms (dòng {{GC(3108) Pause Young (Mixed) ... 94.118ms}}, khớp {{jvm_gc_pause_seconds_max 0.094}}). Đây chính là phần đuôi của p99.

Cộng thêm CPU: serialize 230 KB JSON tốn khoảng 0.5–1 ms CPU mỗi request, nhân 1,850 rps là hơn 1 core chỉ để tạo ra chuỗi rồi bỏ đi. Thêm GC thread chạy dày hơn, CPU tăng từ 0.41 lên 0.78 trên 4 vCPU, và request phải chờ CPU nhiều hơn.

### Thủ phạm trong code

1. **{{FraudAuditLogger.logRequest}} dòng 23: 59.6% allocation.** Java tính đối số trước khi gọi method, nên {{mapper.writeValueAsString(req)}} luôn chạy, sau đó {{log.debug}} mới kiểm tra level, thấy là INFO và bỏ kết quả. Placeholder (cặp ngoặc nhọn) của SLF4J chỉ giúp hoãn việc ghép chuỗi và gọi {{toString()}} của đối số, không hoãn được biểu thức tính ra đối số. Bằng chứng: {{logback_events_total}} với level="debug" bằng **0/s**, tức không có dòng debug nào được ghi, nhưng JFR cho thấy {{byte[]}} và {{char[]}} (buffer của Jackson và String kết quả) chiếm 67.6%.
2. **{{FeatureVectorBuilder.featureKey}} dòng 41: 15.8%.** {{String.format}} phải parse format string, tạo {{Formatter}}, {{FormatSpecifier}} ({{java.util.Formatter$FormatSpecifier}} 4.2%) và {{StringBuilder}}. Mỗi request gọi 300 lần, tức khoảng 555 nghìn lần mỗi giây trên mỗi pod. Cache hit chỉ 31% nên key tạo ra phần lớn là phí.
3. {{RuleEngine.evaluate}} (10.5%) và đọc request body (5.3%) **đã có từ bản 3.7**, đây là nhiễu. So với JFR ngày 15/10, chỉ hai site mới xuất hiện.

Phép tính kiểm tra: 1.14 MB × 1,855 rps ≈ 2.11 GB/s, trong đó audit log khoảng 0.68 MB (JSON 230 KB dưới dạng {{char[]}} của Jackson cộng String kết quả) và featureKey khoảng 0.18 MB (300 lần × khoảng 600 byte).

### Cách sửa

**Ngắn hạn (hotfix):**

~~~java
// Cách 1: guard tường minh
if (log.isDebugEnabled()) {
    log.debug("score request {}", mapper.writeValueAsString(req));
}

// Cách 2: SLF4J 2 fluent API, supplier chỉ chạy khi level được bật
log.atDebug()
   .setMessage("score request {}")
   .addArgument(() -> toJsonQuietly(req))
   .log();
~~~

Với key của cache: tính sẵn phần tĩnh một lần cho mỗi feature ({{def.keySuffix()}} được tạo khi nạp định nghĩa feature), rồi ghép {{r.customerId() + def.keySuffix()}}. Tốt hơn nữa là dùng record {{FeatureKey(customerId, featureId)}} làm key, không tạo String. Đồng thời xem lại cache có đáng giữ không, khi hit chỉ 31%.

**Dài hạn:**
- **Audit đúng nghĩa không nên là log debug của toàn bộ payload.** Nếu nghiệp vụ hoặc thanh tra cần audit, hãy ghi bản rút gọn (requestId, customerId đã mask, amount, score, quyết định, version model) ở INFO, bất đồng bộ qua Kafka hoặc appender async. Payload đầy đủ chứa dữ liệu thẻ và lịch sử giao dịch, ghi ra log là rủi ro tuân thủ (PCI DSS, Nghị định 13/2023 về dữ liệu cá nhân).
- **ZGC không phải lời giải.** Generational ZGC trên JDK 21 ({{-XX:+UseZGC -XX:+ZGenerational}}) giảm pause xuống dưới mili giây, nhưng 2.11 GB/s rác vẫn phải được xử lý bởi các thread GC chạy song song (tốn CPU, trong khi pod đã 78%), và hơn 1 core dùng để serialize JSON vô ích vẫn còn. Sửa nguồn allocation trước, sau đó mới đánh giá đổi GC dựa trên số liệu.
- Tăng young gen hay chỉnh {{MaxGCPauseMillis}} cũng chỉ đổi tần suất lấy độ dài pause, không giảm tổng chi phí.

### Phòng ngừa

- Alert regression theo **allocation trên mỗi request**: {{rate(jvm_gc_memory_allocated_bytes_total)}} chia cho request rate, so với bản trước. Đặt alert khi tăng quá 50% sau deploy, kèm alert khi tỷ lệ thời gian pause vượt 2%.
- Canary deploy so sánh p99, CPU và allocation/request giữa canary và bản ổn định trước khi rollout toàn bộ.
- Benchmark JMH cho hot path với {{-prof gc}}, theo dõi {{gc.alloc.rate.norm}} (byte mỗi thao tác) trong CI và fail khi tăng quá ngưỡng.
- Bật JFR liên tục với cấu hình mặc định để luôn có dữ liệu allocation khi cần so sánh giữa các bản.
- Rule review hoặc static analysis: cấm gọi hàm nặng trong đối số của {{log.debug}} và {{log.trace}}. Sonar có rule cho trường hợp này.

> Senior tip: Với service latency thấp, tôi coi **byte allocation mỗi request** là một chỉ số ngang hàng với latency và CPU. Ở throughput vài nghìn rps, mỗi 100 KB rác thêm vào một request là khoảng 0.2 GB/s cho GC. Khi p99 tăng sau release mà không có lỗi, hãy so sánh {{jvm_gc_memory_allocated_bytes_total}} trước và sau trước tiên. Đây là cách nhanh nhất để biết vấn đề nằm ở code (allocation) hay ở hạ tầng.`,
  rubric: [
    'Định lượng được: allocation tăng từ 0.52 lên 2.11 GB/s, young GC từ khoảng 2.4 s xuống khoảng 0.57 s một lần, pause từ khoảng 12 lên 25 ms do survivor tăng (8 lên 46–48 region), thời gian pause từ 0.5% lên khoảng 4.6%.',
    'Giải thích chuỗi promotion sớm (6.1 MB/s), concurrent cycle và mixed GC 71–94 ms là phần đuôi của p99, kèm CPU lãng phí cho serialize JSON.',
    'Chỉ đúng thủ phạm: log.debug với mapper.writeValueAsString làm đối số được tính kể cả khi level là INFO (logback debug events = 0), và String.format 300 lần mỗi request trong featureKey; phân biệt với allocation đã có từ bản 3.7.',
    'Đề xuất sửa: guard isDebugEnabled hoặc fluent API với supplier, key không dùng String.format; audit ghi bản rút gọn và lưu ý dữ liệu thẻ; giải thích vì sao ZGC hay tuning GC không phải lời giải gốc.',
    'Phòng ngừa: alert allocation trên mỗi request và tỷ lệ pause, canary, JMH -prof gc trong CI, JFR liên tục.'
  ],
  tags: ['allocation-rate', 'young-gc', 'g1', 'jfr', 'logging', 'latency', 'p99']
}
,
{
  id: 'lab-gc-006',
  category: 'gc',
  title: 'p99 vọt lên 1,2 giây đúng mỗi 10 phút: Pause Full (System.gc()) trong job sao kê',
  level: 'mid',
  scenario: `**Bối cảnh:** **PayVN Statement** (Spring Boot 3.3, JDK 17.0.12, G1, {{-Xms8g -Xmx8g}}, pod 8 vCPU) phục vụ API xem sao kê ({{GET /statements/*}}) và chạy job {{StatementBatchJob}} sinh file PDF sao kê mỗi 10 phút (phút 0, 10, 20…). Tháng trước, một dev thêm một dòng vào cuối job "để giải phóng RAM sau batch PDF lớn" vì thấy dashboard "heap used" lên tới 3,6 GB.

**Triệu chứng:** Dashboard latency của {{/statements/*}} có hình răng cưa đều đặn: bình thường p99 ~40ms, nhưng đúng các mốc **hh:m0:00** (02:00, 02:10, 02:20…) p99 nhảy lên **~1,2 giây**, kèm vài chục request timeout ở client mobile (timeout 1s). Không có lỗi, CPU trung bình 25%, heap sau GC trông "rất đẹp".

**Dữ liệu thu thập:** GC log (unified logging {{-Xlog:gc*:file=gc.log:time,uptime,level,tags}}) quanh 02:10, {{jstat -gccause}}, log job, cờ JVM và kết quả grep source code.`,
  artifacts: [
    {
      name: 'gc-statement-02-10.log',
      lang: 'text',
      content: `[2026-10-24T02:09:51.207+0700][22791.207s][info][gc,start    ] GC(1872) Pause Young (Normal) (G1 Evacuation Pause)
[2026-10-24T02:09:51.207+0700][22791.207s][info][gc,task     ] GC(1872) Using 8 workers of 8 for evacuation
[2026-10-24T02:09:51.220+0700][22791.220s][info][gc,phases   ] GC(1872)   Pre Evacuate Collection Set: 0.1ms
[2026-10-24T02:09:51.220+0700][22791.220s][info][gc,phases   ] GC(1872)   Merge Heap Roots: 0.2ms
[2026-10-24T02:09:51.220+0700][22791.220s][info][gc,phases   ] GC(1872)   Evacuate Collection Set: 11.6ms
[2026-10-24T02:09:51.220+0700][22791.220s][info][gc,phases   ] GC(1872)   Post Evacuate Collection Set: 1.0ms
[2026-10-24T02:09:51.220+0700][22791.220s][info][gc,phases   ] GC(1872)   Other: 0.3ms
[2026-10-24T02:09:51.220+0700][22791.220s][info][gc,heap     ] GC(1872) Eden regions: 204->0(196)
[2026-10-24T02:09:51.220+0700][22791.220s][info][gc,heap     ] GC(1872) Survivor regions: 7->8(26)
[2026-10-24T02:09:51.220+0700][22791.220s][info][gc,heap     ] GC(1872) Old regions: 693->700
[2026-10-24T02:09:51.220+0700][22791.220s][info][gc,heap     ] GC(1872) Archive regions: 2->2
[2026-10-24T02:09:51.220+0700][22791.220s][info][gc,heap     ] GC(1872) Humongous regions: 6->6
[2026-10-24T02:09:51.220+0700][22791.220s][info][gc,metaspace] GC(1872) Metaspace: 171M(174M)->171M(174M) NonClass: 152M(154M)->152M(154M) Class: 19M(20M)->19M(20M)
[2026-10-24T02:09:51.220+0700][22791.220s][info][gc          ] GC(1872) Pause Young (Normal) (G1 Evacuation Pause) 3648M->2864M(8192M) 13.204ms
[2026-10-24T02:09:51.220+0700][22791.220s][info][gc,cpu      ] GC(1872) User=0.09s Sys=0.00s Real=0.01s
[2026-10-24T02:10:00.412+0700][22800.412s][info][gc,start    ] GC(1873) Pause Full (System.gc())
[2026-10-24T02:10:00.412+0700][22800.412s][info][gc,task     ] GC(1873) Using 8 workers of 8 for full compaction
[2026-10-24T02:10:00.412+0700][22800.412s][info][gc,phases,start] GC(1873) Phase 1: Mark live objects
[2026-10-24T02:10:00.815+0700][22800.815s][info][gc,phases      ] GC(1873) Phase 1: Mark live objects 402.611ms
[2026-10-24T02:10:00.815+0700][22800.815s][info][gc,phases,start] GC(1873) Phase 2: Prepare for compaction
[2026-10-24T02:10:00.957+0700][22800.957s][info][gc,phases      ] GC(1873) Phase 2: Prepare for compaction 141.902ms
[2026-10-24T02:10:00.957+0700][22800.957s][info][gc,phases,start] GC(1873) Phase 3: Adjust pointers
[2026-10-24T02:10:01.225+0700][22801.225s][info][gc,phases      ] GC(1873) Phase 3: Adjust pointers 268.377ms
[2026-10-24T02:10:01.225+0700][22801.225s][info][gc,phases,start] GC(1873) Phase 4: Compact heap
[2026-10-24T02:10:01.597+0700][22801.597s][info][gc,phases      ] GC(1873) Phase 4: Compact heap 371.840ms
[2026-10-24T02:10:01.608+0700][22801.608s][info][gc,heap        ] GC(1873) Eden regions: 131->0(204)
[2026-10-24T02:10:01.608+0700][22801.608s][info][gc,heap        ] GC(1873) Survivor regions: 8->0(26)
[2026-10-24T02:10:01.608+0700][22801.608s][info][gc,heap        ] GC(1873) Old regions: 700->412
[2026-10-24T02:10:01.608+0700][22801.608s][info][gc,heap        ] GC(1873) Archive regions: 2->2
[2026-10-24T02:10:01.608+0700][22801.608s][info][gc,heap        ] GC(1873) Humongous regions: 6->0
[2026-10-24T02:10:01.608+0700][22801.608s][info][gc,metaspace   ] GC(1873) Metaspace: 171M(174M)->171M(174M) NonClass: 152M(154M)->152M(154M) Class: 19M(20M)->19M(20M)
[2026-10-24T02:10:01.608+0700][22801.608s][info][gc             ] GC(1873) Pause Full (System.gc()) 3388M->1656M(8192M) 1196.204ms
[2026-10-24T02:10:01.608+0700][22801.608s][info][gc,cpu         ] GC(1873) User=8.91s Sys=0.03s Real=1.20s

# Các lần Pause Full trước đó (grep 'Pause Full' gc.log | tail -4):
[2026-10-24T01:40:01.566+0700][21001.566s][info][gc             ] GC(1726) Pause Full (System.gc()) 3402M->1644M(8192M) 1188.211ms
[2026-10-24T01:50:01.582+0700][21601.582s][info][gc             ] GC(1775) Pause Full (System.gc()) 3371M->1652M(8192M) 1201.774ms
[2026-10-24T02:00:01.590+0700][22201.590s][info][gc             ] GC(1824) Pause Full (System.gc()) 3390M->1649M(8192M) 1194.902ms
[2026-10-24T02:10:01.608+0700][22801.608s][info][gc             ] GC(1873) Pause Full (System.gc()) 3388M->1656M(8192M) 1196.204ms
# grep -c 'Concurrent Mark Cycle' gc.log  -> 0
# Region size: 4M (8192M / 2048 regions). IHOP mặc định 45% = ~3686M.`
    },
    {
      name: 'jstat-flags-grep.txt',
      lang: 'text',
      content: `$ jstat -gccause -t 1 5s 4
Timestamp         S0     S1     E      O      M     CCS    YGC     YGCT     FGC    FGCT     CGC    CGCT       GCT    LGCC                 GCC
        22795.4   0.00 100.00  53.43  37.04  98.27  95.12   1836    23.311    37    44.081     0    0.000    67.392 G1 Evacuation Pause  No GC
        22800.4   0.00 100.00  65.74  37.04  98.27  95.12   1836    23.311    37    44.081     0    0.000    67.392 G1 Evacuation Pause  No GC
        22805.4   0.00   0.00   9.80  21.78  98.27  95.12   1836    23.311    38    45.277     0    0.000    68.588 System.gc()          No GC
        22810.4   0.00   0.00  21.57  21.78  98.27  95.12   1836    23.311    38    45.277     0    0.000    68.588 System.gc()          No GC

# JVM khởi động 2026-10-23T19:50:00, job chạy từ 20:00 -> tới 02:10 là lần thứ 38 (FGC = 38).

$ grep 'StatementBatchJob' app.log | tail -3
2026-10-24T01:50:00.380+07:00  INFO 1 --- [   scheduling-1] v.p.statement.batch.StatementBatchJob : batch STMT-20261024-0150 done files=1184 elapsed=0m00.9s
2026-10-24T02:00:00.384+07:00  INFO 1 --- [   scheduling-1] v.p.statement.batch.StatementBatchJob : batch STMT-20261024-0200 done files=1201 elapsed=0m00.9s
2026-10-24T02:10:00.401+07:00  INFO 1 --- [   scheduling-1] v.p.statement.batch.StatementBatchJob : batch STMT-20261024-0210 done files=1212 elapsed=0m00.9s

$ jcmd 1 VM.flags
1:
-XX:CICompilerCount=4 -XX:ConcGCThreads=2 -XX:G1ConcRefinementThreads=8 -XX:G1HeapRegionSize=4194304 -XX:GCDrainStackTargetSize=64 -XX:InitialHeapSize=8589934592 -XX:MarkStackSize=4194304 -XX:MaxHeapSize=8589934592 -XX:MaxNewSize=5150605312 -XX:MinHeapDeltaBytes=4194304 -XX:MinHeapSize=8589934592 -XX:NonNMethodCodeHeapSize=5839372 -XX:NonProfiledCodeHeapSize=122909434 -XX:ProfiledCodeHeapSize=122909434 -XX:ReservedCodeCacheSize=251658240 -XX:+SegmentedCodeCache -XX:SoftMaxHeapSize=8589934592 -XX:+UseCompressedClassPointers -XX:+UseCompressedOops -XX:+UseG1GC

$ grep -rn "System.gc" src/main/java
src/main/java/vn/pay/statement/batch/StatementBatchJob.java:118:        System.gc(); // giải phóng RAM sau batch PDF lớn (heap used 3.6GB!)

# Prometheus p99 http_server_requests{uri="/statements/{id}"} 02:09:50-02:10:10 theo bucket 5s:
# 02:09:55 = 41ms   02:10:00 = 1 212ms   02:10:05 = 63ms   02:10:10 = 39ms`
    }
  ],
  questions: [
    'Dựa vào GC log và jstat, chỉ ra nguyên nhân các đỉnh latency đúng mỗi 10 phút. Vì sao lại là đúng mốc hh:m0?',
    'Vì sao gọi System.gc() "để giải phóng RAM" là hiểu sai về G1? Giải thích con số heap 3,6 GB mà dev đã lo lắng.',
    'Đề xuất cách sửa, và nêu rủi ro của từng tuỳ chọn JVM liên quan (DisableExplicitGC, ExplicitGCInvokesConcurrent).'
  ],
  hints: [
    'Tìm nguyên nhân (cause) trong ngoặc của các dòng Pause Full và cột LGCC của jstat -gccause. So timestamp của chúng với log job.',
    'Trước Full GC, heap 3388M nhưng vẫn dưới ngưỡng IHOP 45% (~3686M), nên G1 chưa cần đánh dấu đồng thời — không có Concurrent Mark Cycle nào. Rác trong old gen "chờ đến lượt" là bình thường.',
    'Mặc định trên G1, {{System.gc()}} chạy Full GC dừng toàn bộ ứng dụng. {{-XX:+ExplicitGCInvokesConcurrent}} biến nó thành chu kỳ đồng thời; {{-XX:+DisableExplicitGC}} bỏ qua hẳn nhưng có rủi ro với direct buffer.'
  ],
  answer: `**Tóm tắt:** Mỗi đỉnh latency là một **{{Pause Full (System.gc())}} dừng ứng dụng ~1,2 giây**, do chính dòng {{System.gc()}} ở {{StatementBatchJob.java:118}} gọi ngay sau mỗi batch (02:10:00.401 job xong → 02:10:00.412 Full GC). Trên G1, {{System.gc()}} mặc định là Full GC stop-the-world nén toàn heap. Nó không "giải phóng RAM" gì thêm: rác trong old gen là bình thường, G1 sẽ tự dọn khi cần bằng chu kỳ đồng thời + mixed GC với pause vài chục ms. Sửa: xoá dòng đó; phòng ngừa bằng {{-XX:+ExplicitGCInvokesConcurrent}}.

### Hiểu từ gốc: G1 dọn rác bằng những loại pause nào

Heap G1 được chia thành các **region** bằng nhau (ở đây 4 MB × 2048 region = 8 GB). Object mới sinh ra ở **Eden**; sống sót qua vài lần dọn thì chuyển sang **Survivor** rồi **Old**. G1 có 3 kiểu dọn:

| Loại | Dọn cái gì | Dừng app? | Thời gian điển hình ở đây |
|---|---|---|---|
| Young (Normal) | Eden + Survivor | Có, ngắn | ~13 ms |
| Concurrent Mark + Mixed | Đánh dấu old **song song với app**, rồi dọn dần các old region nhiều rác nhất | Pause ngắn (Remark, Mixed) | vài chục ms |
| Full GC | **Toàn bộ heap**, đánh dấu + nén | Có, dài | **~1 200 ms** |

Full GC trong G1 là "phương án cuối cùng" — chỉ nên xảy ra khi G1 thất bại (hết chỗ). Còn {{System.gc()}} là **yêu cầu tường minh** "hãy dọn toàn bộ ngay": trên G1, mặc định nó làm đúng một Full GC stop-the-world với 4 phase: Mark → Prepare → Adjust pointers → Compact. Trong 1,2 giây đó **không request nào được xử lý**.

### Vì sao dev tưởng cần System.gc()

Dashboard "heap used" lên 3,6 GB trông đáng sợ, nhưng với G1 đó là bình thường: G1 **cố tình để rác nằm trong old gen** cho tới khi old gen vượt ngưỡng **IHOP** (Initiating Heap Occupancy Percent, mặc định 45% heap ≈ 3 686 MB ở đây), lúc đó mới bắt đầu đánh dấu đồng thời. Dọn sớm hơn = tốn CPU vô ích. Ví như thùng rác trong văn phòng: không ai đổ thùng mỗi khi có một tờ giấy; người ta đổ khi gần đầy, và đổ lúc mọi người vẫn làm việc (đồng thời), không bắt cả văn phòng đứng dậy chờ.

Con số đúng để theo dõi là **heap sau GC** (live data), không phải heap used tức thời. Ở đây live thật sự chỉ ~1,6 GB (sau Full GC: {{3388M->1656M}}). Heap 8 GB rất dư.

### Dẫn chứng từ artifact

- GC log: {{GC(1873) Pause Full (System.gc()) 3388M->1656M(8192M) 1196.204ms}}, Real=1.20s; 4 phase cộng lại ≈ 1 185 ms. Các lần trước đúng 01:40, 01:50, 02:00, 02:10 — chu kỳ 10 phút, mỗi lần ~1,19–1,20 s.
- Ngay trước đó young GC bình thường: {{GC(1872) ... 3648M->2864M(8192M) 13.204ms}} — pause thường của app chỉ ~13 ms.
- Heap trước Full GC 3388M (131+8+700+2+6 = 847 region × 4 MB) **dưới IHOP 3686M**, và {{grep -c 'Concurrent Mark Cycle'}} = 0: G1 chưa từng cần dọn old gen, tức không có áp lực bộ nhớ nào.
- jstat: LGCC chuyển từ "G1 Evacuation Pause" sang "System.gc()" và FGC 37 → 38, FGCT tăng 1,196 s (44,081 → 45,277); CGC = 0.
- Log job: batch xong lúc 02:10:00.401, Full GC bắt đầu 02:10:00.412 (11 ms sau). Grep source: {{StatementBatchJob.java:118: System.gc()}}. VM.flags không có {{DisableExplicitGC}} hay {{ExplicitGCInvokesConcurrent}}.
- p99 bucket 02:10:00 = 1 212 ms, các bucket xung quanh ~40 ms.

Tổng thiệt hại: 6 lần/giờ × 1,2 s = **7,2 giây/giờ app đứng hình hoàn toàn**, chỉ để dọn rác mà G1 sẽ tự dọn rẻ hơn nhiều.

### Cách sửa

1. **Xoá dòng System.gc()** ở {{StatementBatchJob.java:118}}. Đây là sửa gốc.
2. Thêm cờ phòng ngừa cho mọi service: {{-XX:+ExplicitGCInvokesConcurrent}} — nếu có thư viện nào đó gọi {{System.gc()}}, G1 sẽ khởi động **chu kỳ đánh dấu đồng thời** thay vì Full GC STW.
3. Nếu batch PDF thật sự tạo nhiều object lớn (humongous), xử lý bằng streaming/giới hạn kích thước buffer, không phải bằng gọi GC.

~~~java
// TRƯỚC
public void run() {
    generatePdfs(batch);
    System.gc();            // Full GC STW 1,2s trên G1 — làm hại mọi request khác
}
// SAU: không can thiệp GC; nếu lo bộ nhớ thì đo live set (heap sau GC)
public void run() {
    generatePdfs(batch);    // giới hạn kích thước batch / dùng stream nếu cần
}
~~~

### So sánh các cờ JVM liên quan

| Cờ | System.gc() làm gì | Rủi ro |
|---|---|---|
| Mặc định | Full GC STW | Pause dài như sự cố này |
| {{-XX:+ExplicitGCInvokesConcurrent}} | Bắt đầu concurrent cycle (pause ngắn) | Gần như không; tốn CPU nền một chút |
| {{-XX:+DisableExplicitGC}} | Bị bỏ qua hoàn toàn | **Direct buffer**: khi chạm giới hạn {{MaxDirectMemorySize}}, JDK gọi {{System.gc()}} để giải phóng {{DirectByteBuffer}} cũ; tắt đi có thể gây {{OutOfMemoryError: Direct buffer memory}} ở app dùng nhiều NIO/Netty |

Vì rủi ro direct buffer, tôi ưu tiên {{ExplicitGCInvokesConcurrent}} hơn {{DisableExplicitGC}}.

### Lỗi hay gặp

- Nhìn "heap used" tức thời và hoảng; phải nhìn **heap sau GC** (hoặc old gen sau mixed GC).
- Nghĩ {{System.gc()}} chỉ là "gợi ý nhẹ". Spec nói JVM có thể bỏ qua, nhưng HotSpot mặc định **luôn thực hiện** Full GC.
- Quên các nguồn gọi ẩn: RMI distributed GC (khi bật JMX remote/RMI) có thể gọi {{System.gc()}} định kỳ theo {{sun.rmi.dgc.server.gcInterval}} (mặc định 1 giờ); một số thư viện cũ cũng gọi.
- Bật {{DisableExplicitGC}} cho service dùng Netty/NIO mà không theo dõi direct memory.

### Trả lời miệng 1 phút

"Các đỉnh p99 trùng chính xác với dòng Pause Full (System.gc()) mỗi 10 phút, mỗi lần dừng app khoảng 1,2 giây. Nguồn là dòng System.gc() ở StatementBatchJob dòng 118, gọi ngay sau mỗi batch — log job xong 02:10:00.401, Full GC bắt đầu 11 ms sau. Trên G1, System.gc() mặc định là Full GC stop-the-world. Nó không cần thiết: heap 3,4 GB vẫn dưới ngưỡng IHOP 45%, G1 chưa cần chạy concurrent mark lần nào, live set thật chỉ 1,6 GB. Tôi xoá dòng đó và thêm ExplicitGCInvokesConcurrent để phòng thư viện khác gọi; không dùng DisableExplicitGC vì có thể làm hỏng việc thu hồi direct buffer."

> Senior tip: Khi thấy latency spike có **chu kỳ đều** (đúng mỗi N phút), tôi nghĩ ngay đến cron/job, System.gc(), RMI DGC hoặc log rotation — không phải tải người dùng. Chạy {{grep -E 'Pause Full' gc.log}} và xem nguyên nhân trong ngoặc là cách chẩn đoán nhanh nhất: "(System.gc())" là do code, "(G1 Compaction Pause)" là G1 hết chỗ thật, "(Metadata GC Threshold)" là metaspace. Ba nguyên nhân khác nhau, ba hướng sửa khác nhau.`,
  rubric: [
    'Xác định đúng nguyên nhân: Pause Full (System.gc()) ~1,2s mỗi 10 phút do System.gc() ở StatementBatchJob.java:118, timestamp khớp log job (02:10:00.401 → 02:10:00.412).',
    'Giải thích đúng: trên G1 System.gc() mặc định là Full GC STW; heap 3388M dưới IHOP 45% (~3686M), không có Concurrent Mark Cycle, live set thật ~1656M nên gọi GC thủ công là không cần thiết.',
    'Dẫn chứng bằng jstat -gccause (LGCC = System.gc(), FGC 37→38, FGCT tăng ~1,196s, CGC 0) và so sánh với young GC bình thường ~13ms.',
    'Đề xuất sửa: xoá System.gc(), dùng -XX:+ExplicitGCInvokesConcurrent, nêu rủi ro DisableExplicitGC với direct buffer và các nguồn gọi ẩn (RMI DGC, thư viện).'
  ],
  tags: ['g1', 'system-gc', 'full-gc', 'gc-log', 'jstat', 'latency']
},
{
  id: 'lab-gc-007',
  category: 'gc',
  title: 'Lên Kubernetes với limit 1 CPU: JVM tự chọn Serial GC và heap chỉ 384 MB',
  level: 'senior',
  scenario: `**Bối cảnh:** **PayVN Merchant API** (Spring Boot 3.4, JDK 21.0.4) trước đây chạy trên VM 4 vCPU/8 GB với {{-Xmx2g}}, p99 ~60ms. Tuần này team mới chuyển lên Kubernetes bằng image {{eclipse-temurin:21-jre}}, Dockerfile chỉ có {{ENTRYPOINT ["java", "-jar", "/app.jar"]}} (không cờ JVM nào). Manifest đặt {{requests: cpu 500m, memory 1536Mi}} và {{limits: cpu "1", memory 1536Mi}} "cho tiết kiệm".

**Triệu chứng:** Sau khi chuyển 100% traffic (09:00 ngày 26/10/2026), p99 lên **450ms**, thỉnh thoảng có request **>1,1 giây**. Pod không bị OOMKilled; {{kubectl top}} cho thấy memory chỉ dùng **~640Mi / 1536Mi** nên team kết luận "không phải vấn đề bộ nhớ" và định tăng số replica.

**Dữ liệu thu thập:** Phần đầu GC log ({{-Xlog:gc*}} được bật tạm qua {{JAVA_TOOL_OPTIONS}}), đoạn log lúc ~09:13, {{jstat -gcutil}}, {{-XX:+PrintFlagsFinal}} chạy trong pod và metric CPU throttling.`,
  artifacts: [
    {
      name: 'gc-merchant-api.log',
      lang: 'text',
      content: `[2026-10-26T09:00:00.006+0700][0.006s][info][gc] Using Serial
[2026-10-26T09:00:00.031+0700][0.031s][info][gc,init] Version: 21.0.4+7-LTS (release)
[2026-10-26T09:00:00.031+0700][0.031s][info][gc,init] CPUs: 16 total, 1 available
[2026-10-26T09:00:00.031+0700][0.031s][info][gc,init] Memory: 1536M
[2026-10-26T09:00:00.031+0700][0.031s][info][gc,init] Large Page Support: Disabled
[2026-10-26T09:00:00.031+0700][0.031s][info][gc,init] NUMA Support: Disabled
[2026-10-26T09:00:00.031+0700][0.031s][info][gc,init] Compressed Oops: Enabled (32-bit)
[2026-10-26T09:00:00.031+0700][0.031s][info][gc,init] Heap Min Capacity: 8M
[2026-10-26T09:00:00.031+0700][0.031s][info][gc,init] Heap Initial Capacity: 24M
[2026-10-26T09:00:00.031+0700][0.031s][info][gc,init] Heap Max Capacity: 384M
[2026-10-26T09:00:00.031+0700][0.031s][info][gc,init] Pre-touch: Disabled
...
[2026-10-26T09:13:31.402+0700][811.402s][info][gc,start    ] GC(1286) Pause Young (Allocation Failure)
[2026-10-26T09:13:31.441+0700][811.441s][info][gc,heap     ] GC(1286) DefNew: 117376K(117952K)->12800K(117952K) Eden: 104832K(104832K)->0K(104832K) From: 12544K(13120K)->12800K(13120K)
[2026-10-26T09:13:31.441+0700][811.441s][info][gc,heap     ] GC(1286) Tenured: 241210K(262144K)->252330K(262144K)
[2026-10-26T09:13:31.441+0700][811.441s][info][gc,metaspace] GC(1286) Metaspace: 98211K(99328K)->98211K(99328K) NonClass: 85602K(86272K)->85602K(86272K) Class: 12609K(13056K)->12609K(13056K)
[2026-10-26T09:13:31.441+0700][811.441s][info][gc          ] GC(1286) Pause Young (Allocation Failure) 350M->258M(371M) 38.912ms
[2026-10-26T09:13:31.441+0700][811.441s][info][gc,cpu      ] GC(1286) User=0.03s Sys=0.01s Real=0.04s
[2026-10-26T09:13:32.050+0700][812.050s][info][gc,start    ] GC(1287) Pause Full (Allocation Failure)
[2026-10-26T09:13:32.050+0700][812.050s][info][gc,phases,start] GC(1287) Phase 1: Mark live objects
[2026-10-26T09:13:32.332+0700][812.332s][info][gc,phases      ] GC(1287) Phase 1: Mark live objects 281.733ms
[2026-10-26T09:13:32.332+0700][812.332s][info][gc,phases,start] GC(1287) Phase 2: Compute new object addresses
[2026-10-26T09:13:32.406+0700][812.406s][info][gc,phases      ] GC(1287) Phase 2: Compute new object addresses 74.120ms
[2026-10-26T09:13:32.406+0700][812.406s][info][gc,phases,start] GC(1287) Phase 3: Adjust pointers
[2026-10-26T09:13:32.528+0700][812.528s][info][gc,phases      ] GC(1287) Phase 3: Adjust pointers 121.904ms
[2026-10-26T09:13:32.528+0700][812.528s][info][gc,phases,start] GC(1287) Phase 4: Move objects
[2026-10-26T09:13:32.624+0700][812.624s][info][gc,phases      ] GC(1287) Phase 4: Move objects 96.415ms
[2026-10-26T09:13:32.627+0700][812.627s][info][gc,heap        ] GC(1287) DefNew: 117632K(117952K)->0K(117952K) Eden: 104832K(104832K)->0K(104832K) From: 12800K(13120K)->0K(13120K)
[2026-10-26T09:13:32.627+0700][812.627s][info][gc,heap        ] GC(1287) Tenured: 252330K(262144K)->201406K(262144K)
[2026-10-26T09:13:32.627+0700][812.627s][info][gc,metaspace   ] GC(1287) Metaspace: 98211K(99328K)->98211K(99328K) NonClass: 85602K(86272K)->85602K(86272K) Class: 12609K(13056K)->12609K(13056K)
[2026-10-26T09:13:32.627+0700][812.627s][info][gc             ] GC(1287) Pause Full (Allocation Failure) 361M->196M(371M) 577.102ms
[2026-10-26T09:13:32.627+0700][812.627s][info][gc,cpu         ] GC(1287) User=0.57s Sys=0.01s Real=0.58s
[2026-10-26T09:13:33.231+0700][813.231s][info][gc,start       ] GC(1288) Pause Young (Allocation Failure)
[2026-10-26T09:13:33.262+0700][813.262s][info][gc,heap        ] GC(1288) DefNew: 104832K(117952K)->11520K(117952K) Eden: 104832K(104832K)->0K(104832K) From: 0K(13120K)->11520K(13120K)
[2026-10-26T09:13:33.262+0700][813.262s][info][gc,heap        ] GC(1288) Tenured: 201406K(262144K)->203210K(262144K)
[2026-10-26T09:13:33.262+0700][813.262s][info][gc             ] GC(1288) Pause Young (Allocation Failure) 299M->209M(371M) 31.442ms`
    },
    {
      name: 'jstat-flags-k8s.txt',
      lang: 'text',
      content: `$ kubectl exec merchant-api-58c7-9pq2d -- jstat -gcutil -t 1 10s 2
Timestamp         S0     S1     E      O      M     CCS    YGC     YGCT     FGC    FGCT     CGC    CGCT       GCT
          820.3   0.00  87.80  38.41  77.52  98.88  96.57   1262    41.612    27    15.734      -        -    57.346
          830.3  97.56   0.00  21.06  79.95  98.88  96.57   1266    41.749    27    15.734      -        -    57.483

$ kubectl exec merchant-api-58c7-9pq2d -- java -XX:+PrintFlagsFinal -version | grep -E ' (UseSerialGC|UseG1GC|MaxHeapSize|InitialHeapSize|MaxRAMPercentage|ActiveProcessorCount) '
     int ActiveProcessorCount                     = -1                                        {product} {default}
   size_t InitialHeapSize                          = 25165824                                  {product} {ergonomic}
   size_t MaxHeapSize                              = 402653184                                 {product} {ergonomic}
   double MaxRAMPercentage                         = 25.000000                                 {product} {default}
     bool UseG1GC                                  = false                                     {product} {default}
     bool UseSerialGC                              = true                                      {product} {ergonomic}

$ kubectl top pod merchant-api-58c7-9pq2d
NAME                       CPU(cores)   MEMORY(bytes)
merchant-api-58c7-9pq2d    997m         641Mi

# Prometheus, 09:05-09:15
# rate(container_cpu_cfs_throttled_periods_total[5m]) / rate(container_cpu_cfs_periods_total[5m]) = 0.41
# http_server_requests p99 = 452ms, max = 1 140ms (trùng thời điểm Pause Full)
# Trên VM cũ (4 vCPU, -Xmx2g): "Using G1", Full GC = 0 trong 7 ngày, young pause trung bình 9ms`
    }
  ],
  questions: [
    'Vì sao JVM chọn Serial GC và heap tối đa 384 MB trong khi không ai cấu hình? Giải thích ergonomics trong container.',
    'Đọc GC log: chuyện gì xảy ra với old gen (Tenured) và vì sao có Full GC liên tục? Tính tỉ lệ thời gian dành cho GC.',
    'Vì sao "memory pod chỉ dùng 640Mi / 1536Mi" lại không chứng minh là không có vấn đề bộ nhớ? Đề xuất cấu hình đúng cho pod và JVM.'
  ],
  hints: [
    'Dòng đầu GC log: "Using Serial", "CPUs: 16 total, 1 available", "Memory: 1536M", "Heap Max Capacity: 384M". JVM chỉ coi máy là "server class" (và chọn G1) khi có ít nhất 2 CPU và khoảng 1792 MB RAM.',
    'MaxRAMPercentage mặc định 25%: 25% × 1536M = 384M. Tenured chỉ có 256M; sau Full GC vẫn còn 201M dữ liệu sống (~77%).',
    'jstat: 1262 young + 27 full trong 820 giây, GCT 57,3 s. Với 1 CPU bị throttle 41%, mọi pause đều kéo dài và Serial GC dừng toàn bộ app.'
  ],
  answer: `**Tóm tắt:** Không có cờ JVM nào, nên JVM dùng **ergonomics**: trong container nó thấy **1 CPU** (từ limit) và **1536 MB** (từ memory limit). Với dưới 2 CPU, JVM không coi đây là "server class machine" nên chọn **Serial GC** (một luồng, dừng toàn bộ app) thay vì G1; và heap tối đa mặc định = **25% RAM = 384 MB**. Live data của app ~200 MB chiếm ~77% old gen 256 MB nên **Full GC mỗi ~30 giây** (577ms mỗi lần) và young GC mỗi ~0,6 giây. Pod chỉ dùng 640Mi vì JVM bị giới hạn heap, không phải vì app ít bộ nhớ. Sửa: đặt {{-XX:MaxRAMPercentage=75}}, nâng CPU limit lên 2 (hoặc bỏ limit), và khai báo GC tường minh.

### Hiểu từ gốc: JVM tự chọn cấu hình như thế nào

Khi không có cờ, HotSpot tự quyết ("ergonomics") dựa trên phần cứng nó **thấy được**. Từ JDK 10 (và 8u191), JVM **nhận biết container**: đọc cgroup để biết CPU quota và memory limit thay vì phần cứng của cả node. Ở pod này:

~~~text
Node: 16 vCPU, 64 GB          Container (cgroup): cpu limit 1, memory limit 1536Mi
                                       |
                    JVM thấy: 1 CPU khả dụng, 1536 MB RAM
                                       |
   Server-class?  cần >= 2 CPU VÀ >= ~1792 MB  -> KHÔNG (1 CPU, 1536 MB)
                                       |
   GC mặc định:   Serial GC  (thay vì G1)
   Max heap:      MaxRAMPercentage 25%  x 1536M = 384M
   Initial heap:  1/64 x 1536M = 24M,   Min heap 8M
   Young/Old:     NewRatio=2 -> young 128M (eden 102,4M + 2 survivor 12,8M), old (Tenured) 256M
~~~

Chú ý {{requests: cpu 500m}} không ảnh hưởng: từ JDK 19, JVM bỏ qua cpu shares và chỉ dùng **quota (limit)** để tính số CPU. Cặp "1 CPU, 1,5 GB" là cấu hình "tiết kiệm" phổ biến, và rơi đúng dưới cả hai ngưỡng.

**Serial GC** dùng **một thread** để dọn rác và **dừng toàn bộ ứng dụng** cho mọi lần dọn (young lẫn full). Nó hợp với app nhỏ, heap vài trăm MB, 1 CPU, không cần latency thấp — không hợp với API thanh toán p99 dưới 100ms.

### Đọc GC log từng bước

- {{GC(1286) Pause Young}}: Eden đầy (104832K) → copy object sống sang survivor (12800K) và **đẩy lên Tenured 11 120K** (241210K → 252330K). Tenured chỉ còn ~9,8 MB trống trên 256 MB.
- {{GC(1287) Pause Full (Allocation Failure)}}: lần young tiếp theo không chắc đủ chỗ để đẩy object lên Tenured, nên Serial chạy **Full GC** (mark-compact cả heap, 1 thread): 577 ms. Sau Full GC Tenured còn **201406K ≈ 197 MB sống** = 77% của 256 MB.
- {{GC(1288)}}: young bình thường lại, Tenured đã lên 203210K. Mỗi lần young đẩy thêm ~1,6 MB lên Tenured (jstat: O 77,52% → 79,95% sau 4 lần young), nên chỉ cần khoảng 35–40 lần young (~25 giây) là 59 MB trống lại đầy → Full GC tiếp.

Tính từ jstat lúc uptime 820 s: **1 262 young + 27 full**, GCT = 57,3 s → **~7% thời gian app đứng hình vì GC**, trung bình **Full GC mỗi ~30 giây** (820 / 27). Thêm CPU throttling 41% (pod dùng 997m, đụng trần 1 CPU): JIT, GC và request tranh nhau một core, khi bị throttle thì pause kéo dài thêm. Request trùng lúc Full GC chịu thêm ~0,6 s → khớp max 1 140 ms.

### Vì sao "640Mi / 1536Mi" đánh lừa

Bộ nhớ process = heap (tối đa 384M) + metaspace (~98M) + code cache + thread stack + direct buffer + GC structures. Tổng ~640Mi là hợp lý. Pod còn trống 900Mi **vì JVM không được phép dùng**, trong khi heap bên trong đang ngộp (Tenured 77–96%). Kết luận đúng: nhìn **bên trong JVM** (GC log, jstat), không nhìn RSS của container.

Tăng replica cũng không giúp: mỗi replica có cùng heap 384M và cùng live set ~200MB (cache, Spring context), nên Full GC vẫn dày như cũ.

### Dẫn chứng từ artifact

- {{Using Serial}}, {{CPUs: 16 total, 1 available}}, {{Memory: 1536M}}, {{Heap Max Capacity: 384M}}, {{Heap Initial Capacity: 24M}}.
- PrintFlagsFinal: {{UseSerialGC = true}} (nguồn {{ergonomic}}), {{UseG1GC = false}}, {{MaxHeapSize = 402653184}} (384 MB), {{MaxRAMPercentage = 25}}.
- Capacity trong log: DefNew 117952K (eden 104832K + 1 survivor 13120K) + Tenured 262144K = 380096K ≈ **371M** ({{(371M)}}), đúng heap 384M trừ một survivor.
- Full GC 577 ms với User=0.57s ≈ Real=0.58s: một thread duy nhất làm việc (G1 trên VM cũ: User gấp nhiều lần Real vì nhiều worker).
- jstat: O 77–80%, FGC 27, GCT 57,3 s; CGC = "-" vì Serial không có chu kỳ đồng thời.
- Throttling 41%, CPU 997m = chạm limit.

### Cách sửa

~~~yaml
resources:
  requests: { cpu: "2", memory: 2Gi }
  limits:   { memory: 2Gi }          # nhiều team bỏ CPU limit, chỉ giữ request
env:
  - name: JAVA_TOOL_OPTIONS
    value: >-
      -XX:+UseG1GC
      -XX:MaxRAMPercentage=75.0
      -XX:+ExitOnOutOfMemoryError
      -Xlog:gc*:file=/tmp/gc.log:time,uptime,level,tags:filecount=5,filesize=20m
~~~

- {{MaxRAMPercentage=75}}: heap ~1,5 GB trên 2 GB, chừa ~25% cho metaspace, thread, code cache, direct memory. Đừng đặt 90–100% — sẽ bị OOMKilled vì bộ nhớ ngoài heap.
- Khai báo GC **tường minh** để không phụ thuộc ngưỡng ergonomics. Nếu buộc phải giữ 1 CPU, G1 vẫn chạy được nhưng thread đồng thời của nó tranh CPU với app; khi đó cân nhắc {{-XX:ActiveProcessorCount=2}} chỉ khi đã hiểu hệ quả, hoặc đơn giản là cấp 2 CPU.
- Kiểm chứng sau khi đổi: GC log phải in "Using G1", heap sau GC < 50% max, Full GC = 0, throttling < 5%.

| Cấu hình | GC | Max heap | Kết quả dự kiến |
|---|---|---|---|
| 1 CPU, 1536Mi, không cờ | Serial (ergonomic) | 384M | Full GC ~30s, p99 450ms |
| 1 CPU, 1536Mi, MaxRAMPercentage=75 | Serial | 1152M | Ít Full GC, nhưng pause vẫn STW 1 thread |
| 2 CPU, 2Gi, G1, MaxRAMPercentage=75 | G1 | ~1536M | Young pause ~10ms, gần như không Full GC |

### Lỗi hay gặp

- Copy Dockerfile "java -jar" không cờ và tin JVM tự chọn tốt — trong container nhỏ, mặc định thường là heap 25% và có thể là Serial.
- Đặt {{-Xmx}} bằng đúng memory limit → pod bị OOMKilled vì bộ nhớ ngoài heap.
- Đặt CPU limit thấp cho app Java: lúc khởi động JIT cần nhiều CPU, GC cần CPU; throttling làm mọi thứ chậm theo bội số.
- Nhìn {{kubectl top}} (RSS) để kết luận về heap.

### Trả lời miệng 1 phút

"Không có cờ JVM, nên JVM dùng ergonomics theo cgroup: thấy 1 CPU và 1536 MB, dưới ngưỡng server-class là 2 CPU, nên chọn Serial GC và heap tối đa 25% là 384 MB. GC log ghi rõ Using Serial và Heap Max Capacity 384M. Live data khoảng 200 MB chiếm 77% old gen 256 MB, nên Full GC mỗi 30 giây, mỗi lần 577 ms một luồng; jstat cho thấy 7% thời gian là GC, cộng thêm CPU throttling 41%. Pod chỉ dùng 640Mi vì JVM bị giới hạn, không phải vì app nhẹ. Tôi nâng lên 2 CPU, đặt MaxRAMPercentage 75 và khai báo UseG1GC tường minh, rồi kiểm tra lại bằng GC log."

> Senior tip: Tôi đưa vào chuẩn của team: mọi service Java trên Kubernetes **phải** có {{-XX:MaxRAMPercentage}}, GC tường minh và {{-Xlog:gc*}} xoay vòng file; CI kiểm tra dòng "Using G1" (hoặc GC đã chọn) trong log khởi động. Dòng gc,init đầu log là thứ đầu tiên tôi đọc khi một service "chậm hơn sau khi lên K8s" — 9/10 lần nguyên nhân là heap mặc định 25% hoặc CPU limit quá thấp.`,
  rubric: [
    'Giải thích đúng ergonomics trong container: JVM đọc cgroup, thấy 1 CPU và 1536M, dưới ngưỡng server-class (≥2 CPU, ~1792MB) nên chọn Serial GC; MaxRAMPercentage 25% → heap 384M; nêu requests cpu không ảnh hưởng (JDK 19+ dùng quota).',
    'Đọc đúng GC log: Tenured 256M, sau Full GC còn ~201MB sống (77%), Full GC 577ms một thread (User≈Real), young đẩy object lên Tenured liên tục nên Full GC mỗi ~30s.',
    'Định lượng từ jstat: 1262 young + 27 full trong 820s, GCT 57,3s (~7%), kết hợp CPU throttling 41%; giải thích vì sao RSS 640Mi và việc tăng replica không chứng minh/không giải quyết được.',
    'Đề xuất cấu hình đúng: MaxRAMPercentage ~75 (không 100%), GC tường minh (G1), cấp 2 CPU hoặc bỏ CPU limit, bật GC log và cách kiểm chứng sau sửa.'
  ],
  tags: ['container', 'kubernetes', 'ergonomics', 'serial-gc', 'max-ram-percentage', 'jstat']
},
{
  id: 'lab-gc-008',
  category: 'gc',
  title: 'Old gen tăng 2,65 object mỗi giây: Finalizer thread kẹt vì finalize() đóng kết nối SFTP',
  level: 'lead',
  scenario: `**Bối cảnh:** **PayVN Settlement Gateway** (JDK 21.0.4, G1, {{-Xmx4g}}, 4 vCPU) kéo/đẩy file đối soát với trung tâm thanh toán bù trừ qua SFTP. Service dùng thư viện nội bộ cũ {{vn.pay.legacy.sftp}} (viết từ thời Java 6): mỗi {{SftpHandle}} giữ một kênh SSH và một buffer 16 KB, và **đóng kênh trong finalize()**. Code gọi thư viện không bao giờ gọi {{close()}} — "để GC lo".

**Triệu chứng:** Lúc **19:00 ngày 24/10/2026** trung tâm bù trừ nâng cấp SFTP server. Từ đó, heap sau mixed GC của gateway tăng đều: ~980 MB (ổn định suốt 3 tháng trước) → **1 990 MB lúc 02:04** → **2 931 MB lúc 08:07 ngày 25/10**. Pod khởi động lại lúc 19:40 ngày 24/10. Không có thay đổi code. Dự báo theo xu hướng: OOM khoảng 14h chiều.

**Dữ liệu thu thập:** Hai lần {{jcmd 1 GC.class_histogram}}, GC log, {{jstat -gcutil}}, một thread dump và đoạn code thư viện.`,
  artifacts: [
    {
      name: 'class-histogram-2-samples.txt',
      lang: 'text',
      content: `### Sample 1: 2026-10-25 02:04:50 (uptime 23090s)  $ jcmd 1 GC.class_histogram | head -8
1:
 num     #instances         #bytes  class name (module)
-------------------------------------------------------
   1:        112400     1011656032  [B (java.base@21.0.4)
   2:        284113       13637424  java.lang.String (java.base@21.0.4)
   3:         61204        2448160  java.lang.ref.Finalizer (java.base@21.0.4)
   4:         61190        2447600  vn.pay.legacy.sftp.SftpHandle
   5:         61190        1958080  vn.pay.legacy.sftp.SshChannel

### Sample 2: 2026-10-25 08:07:50 (uptime 44870s)  $ jcmd 1 GC.class_histogram | head -8
1:
 num     #instances         #bytes  class name (module)
-------------------------------------------------------
   1:        171544     1958392168  [B (java.base@21.0.4)
   2:        286530       13753440  java.lang.String (java.base@21.0.4)
   3:        118930        4757200  java.lang.ref.Finalizer (java.base@21.0.4)
   4:        118911        4756440  vn.pay.legacy.sftp.SftpHandle
   5:        118911        3805152  vn.pay.legacy.sftp.SshChannel

# Chênh lệch 6h03m (21780 s): SftpHandle +57 721 (≈ 2,65 object/giây), [B +946,7 MB
# 57 721 x 16 400 byte ([B 16 KB + header) ≈ 946,6 MB
# Metric app: sftp_handles_opened_total tăng ~3,2/giây; số phiên SFTP đang thật sự dùng: 6-10

### $ jstat -gcutil -t 1 (lấy mẫu mỗi giờ, trích)
Timestamp         S0     S1     E      O      M     CCS    YGC     YGCT     FGC    FGCT     CGC    CGCT       GCT
         3600.2   0.00 100.00  48.12  41.33  97.81  94.20    702     8.114     0     0.000     4     0.061     8.175
        23090.4   0.00 100.00  37.50  63.92  97.83  94.20   4511    56.902     0     0.000    31     0.512    57.414
        44870.6   0.00 100.00  22.21  88.40  97.83  94.20   8890   118.331     0     0.000    72     1.244   119.575`
    },
    {
      name: 'gc-and-thread-dump.txt',
      lang: 'text',
      content: `### GC log (trích), sau mỗi chu kỳ mixed
[2026-10-24T14:31:12.004+0700][7203412.004s][info][gc] GC(1440211) Pause Young (Mixed) (G1 Evacuation Pause) 1201M->978M(4096M) 22.418ms   # pod cũ, trước nâng cấp SFTP
[2026-10-25T02:03:58.776+0700][23038.776s][info][gc] GC(4539) Pause Young (Mixed) (G1 Evacuation Pause) 2214M->1990M(4096M) 33.207ms
[2026-10-25T08:06:41.120+0700][44801.120s][info][gc] GC(8957) Pause Young (Concurrent Start) (G1 Evacuation Pause) 3302M->2950M(4096M) 38.402ms
[2026-10-25T08:06:41.121+0700][44801.121s][info][gc] GC(8958) Concurrent Mark Cycle
[2026-10-25T08:06:42.640+0700][44802.640s][info][gc] GC(8958) Pause Remark 2988M->2988M(4096M) 21.118ms
[2026-10-25T08:06:42.902+0700][44802.902s][info][gc] GC(8958) Pause Cleanup 2990M->2990M(4096M) 0.412ms
[2026-10-25T08:06:42.923+0700][44802.923s][info][gc] GC(8958) Concurrent Mark Cycle 1802.331ms
[2026-10-25T08:06:45.311+0700][44805.311s][info][gc] GC(8959) Pause Young (Prepare Mixed) (G1 Evacuation Pause) 3196M->2961M(4096M) 29.774ms
[2026-10-25T08:06:48.090+0700][44808.090s][info][gc] GC(8960) Pause Young (Mixed) (G1 Evacuation Pause) 3138M->2931M(4096M) 44.106ms

### $ jcmd 1 Thread.print (2026-10-25 08:08:02, trích; 3 lần dump cách 10s đều giống nhau)
"Finalizer" #10 [33] daemon prio=8 os_prio=0 cpu=48210.55ms elapsed=44882.31s tid=0x00007f6e3c13e000 nid=33 runnable  [0x00007f6e1b5fd000]
   java.lang.Thread.State: RUNNABLE
        at sun.nio.ch.Net.poll(java.base@21.0.4/Native Method)
        at sun.nio.ch.NioSocketImpl.park(java.base@21.0.4/NioSocketImpl.java:191)
        at sun.nio.ch.NioSocketImpl.timedRead(java.base@21.0.4/NioSocketImpl.java:280)
        at sun.nio.ch.NioSocketImpl.implRead(java.base@21.0.4/NioSocketImpl.java:304)
        at sun.nio.ch.NioSocketImpl.read(java.base@21.0.4/NioSocketImpl.java:346)
        at sun.nio.ch.NioSocketImpl$1.read(java.base@21.0.4/NioSocketImpl.java:796)
        at java.net.Socket$SocketInputStream.read(java.base@21.0.4/Socket.java:1099)
        at java.io.DataInputStream.readFully(java.base@21.0.4/DataInputStream.java:208)
        at vn.pay.legacy.sftp.SshTransport.readPacket(SshTransport.java:212)
        at vn.pay.legacy.sftp.SshChannel.awaitClose(SshChannel.java:144)
        at vn.pay.legacy.sftp.SshChannel.disconnect(SshChannel.java:121)
        at vn.pay.legacy.sftp.SftpHandle.finalize(SftpHandle.java:88)
        at java.lang.System$2.invokeFinalize(java.base@21.0.4/System.java:2449)
        at java.lang.ref.Finalizer.runFinalizer(java.base@21.0.4/Finalizer.java:96)
        at java.lang.ref.Finalizer$FinalizerThread.run(java.base@21.0.4/Finalizer.java:174)

### Log DEBUG của thư viện (bật 60 giây)
08:09:10.114 DEBUG [Finalizer] v.p.legacy.sftp.SshChannel : close ack ch=88123 waited=1803ms
08:09:11.921 DEBUG [Finalizer] v.p.legacy.sftp.SshChannel : close ack ch=88124 waited=1798ms
08:09:13.730 DEBUG [Finalizer] v.p.legacy.sftp.SshChannel : close ack ch=88125 waited=1801ms
# 60 giây: 33 dòng "close ack" (≈ 0,55/giây). Trước 24/10, waited trung bình 18ms.`
    },
    {
      name: 'SftpHandle-and-usage.java',
      lang: 'java',
      content: `// Thư viện nội bộ vn.pay.legacy.sftp (2011)
public class SftpHandle {
    private final SshChannel channel;
    private final byte[] buffer = new byte[16 * 1024];   // 16 KB mỗi handle

    public void close() { channel.disconnect(); }         // có nhưng không ai gọi

    @Override
    protected void finalize() throws Throwable {          // dòng 85
        try {
            if (channel.isOpen()) {
                channel.disconnect();                     // dòng 88: gửi CLOSE, chờ ack (timeout 2s)
            }
        } finally { super.finalize(); }
    }
}

// Code ứng dụng: StatementPuller chạy liên tục cho 12 thư mục
for (RemoteFile f : listing) {
    SftpHandle h = sftp.open(f.path());                    // ~3,2 handle/giây
    store.save(f.name(), h.readAll());
    // không close: "GC sẽ gọi finalize để đóng"
}`
    }
  ],
  questions: [
    'Vì sao heap tăng đều dù số phiên SFTP thật sự đang dùng chỉ 6–10? Giải thích cơ chế finalization trong JVM từng bước và vì sao object có finalize() sống lâu hơn object thường.',
    'Dùng số liệu trong artifact, chứng minh tốc độ tích luỹ khớp với chênh lệch giữa tốc độ tạo handle và tốc độ Finalizer thread xử lý.',
    'Đề xuất kế hoạch xử lý: ngắn hạn (trước 14h), sửa gốc, và chính sách cho cả codebase về finalize()/Cleaner trên JDK 21.'
  ],
  hints: [
    'Histogram: số {{SftpHandle}} ≈ số {{java.lang.ref.Finalizer}} và cùng tăng; mỗi handle kéo theo một {{[B}} 16 KB. Nhưng chỉ có 6–10 phiên đang dùng — phần còn lại đang chờ gì?',
    'JVM chỉ có MỘT thread "Finalizer" chạy lần lượt mọi finalize(). Thread này đang làm gì trong 3 dump liên tiếp? Mỗi lần mất bao lâu (log DEBUG)?',
    'Tạo 3,2/giây, finalize xong 1/1,8s ≈ 0,55/giây → hàng đợi tăng 2,65/giây. Nhân với 21 780 giây giữa hai sample, rồi nhân với 16 400 byte.'
  ],
  answer: `**Tóm tắt:** Đây là **finalizer backlog**, không phải leak kiểu "ai đó giữ tham chiếu". Code không gọi {{close()}}, nên mỗi {{SftpHandle}} chỉ được dọn qua {{finalize()}}. JVM chạy mọi finalize() trên **một thread "Finalizer" duy nhất**; sau khi SFTP server nâng cấp, {{finalize()}} chặn ~1,8 giây chờ ack đóng kênh, nên Finalizer chỉ xử lý **~0,55 handle/giây** trong khi app tạo **~3,2 handle/giây**. Hàng chờ tăng **2,65 object/giây**, mỗi object giữ buffer 16 KB → ~946 MB mỗi 6 giờ, khớp histogram và GC log. Sửa: gọi {{close()}} tường minh (try-with-resources), bỏ IO khỏi finalize, và loại bỏ finalize() khỏi codebase.

### Hiểu từ gốc: object có finalize() chết như thế nào

Object thường: khi không còn ai tham chiếu, lần GC tiếp theo thu hồi luôn. Object có {{finalize()}} thì khác — JVM phải **gọi finalize() trước khi được phép xoá**, và finalize() là code Java bất kỳ, có thể chạy lâu, thậm chí "hồi sinh" object. Quy trình:

~~~text
1. new SftpHandle()  -> JVM tạo kèm một java.lang.ref.Finalizer trỏ tới nó
                        (vì vậy số Finalizer ~ số SftpHandle trong histogram)
2. App bỏ tham chiếu -> object "không còn ai dùng"
3. GC phát hiện      -> KHÔNG xoá; đưa Finalizer vào hàng đợi (ReferenceQueue).
                        Object + mọi thứ nó trỏ tới (buffer 16 KB, SshChannel) vẫn SỐNG,
                        thường bị promote lên old gen trong lúc chờ.
4. Thread "Finalizer" (1 thread, priority 8) lấy lần lượt từng phần tử, gọi finalize()
5. GC lần sau        -> lúc này mới thực sự thu hồi object và buffer
~~~

Điểm then chốt: bước 4 là **một hàng đợi, một người phục vụ**. Nếu một finalize() mất 1,8 giây, cả hàng phải chờ. GC không thể "dọn nhanh hơn" — nó chỉ có thể xoá object **sau** khi Finalizer xử lý xong. Vì vậy heap sau GC tăng đều, G1 chạy concurrent mark + mixed đầy đủ nhưng không thu hồi được gì thêm: các object này **còn reachable** từ hàng đợi finalization.

Ví dụ đời thường: một văn phòng có một nhân viên huỷ tài liệu. Mỗi tài liệu phải được gọi điện xác nhận trước khi huỷ. Trước đây mỗi cuộc gọi 18ms; nay đối tác bắt máy chậm, 1,8 giây. Tài liệu chờ huỷ chất đống trong kho (heap) dù không ai cần đến chúng.

### Định lượng: số liệu khớp nhau

| Đại lượng | Giá trị | Nguồn |
|---|---|---|
| Tốc độ tạo handle | ~3,2/giây | {{sftp_handles_opened_total}} |
| Tốc độ finalize | 33 / 60 s ≈ 0,55/giây (1,8 s mỗi lần) | log DEBUG "close ack waited≈1800ms" |
| Tích luỹ | 3,2 − 0,55 ≈ **2,65/giây** | |
| Thực tế | (118 911 − 61 190) / 21 780 s = **2,65/giây** | 2 histogram |
| Bộ nhớ | 57 721 × 16 400 B ≈ **946,6 MB** | histogram: [B tăng 946,7 MB |
| Heap sau mixed | 1 990 → 2 931 MB (+941 MB) | GC log |
| Kiểm tra mốc 1 | 23 090 s × 2,65 ≈ 61 190 handle | khớp sample 1 |

Trước 24/10, close ack ~18 ms → Finalizer xử lý ~55/giây, dư sức so với 3,2/giây, nên lỗi thiết kế "không close" đã **ngủ yên 3 tháng**. Thay đổi bên ngoài (SFTP server chậm ack) làm nó bùng phát. Dự báo: heap max 4 096 MB, nền ~980 MB, mỗi giờ thêm ~156 MB (2,65 × 3 600 × 16,4 KB) → còn ~1 000 MB trống lúc 08:07 → hết sau ~6–7 giờ, khoảng 14h.

### Dẫn chứng từ artifact

- Histogram: {{SftpHandle}} 61 190 → 118 911 và {{SshChannel}} cùng số; {{java.lang.ref.Finalizer}} 61 204 → 118 930 (gần bằng: mỗi handle một Finalizer, thêm 14–19 của class khác). [B tăng từ 1,01 GB lên 1,96 GB. Trong khi app chỉ có 6–10 phiên SFTP thật.
- Thread dump: thread **"Finalizer"** RUNNABLE nhưng thực chất đang chờ socket ({{Net.poll}} native) trong {{SshChannel.awaitClose}} ← {{SshChannel.disconnect}} ← {{SftpHandle.finalize(SftpHandle.java:88)}} ← {{Finalizer.runFinalizer}}; 3 dump liên tiếp giống nhau.
- GC log: heap sau mixed 978M (pod cũ) → 1 990M → 2 931M; concurrent mark chạy bình thường (1,8s), pause ngắn — **G1 không có lỗi**, nó chỉ không được phép xoá các object này. FGC = 0 vẫn đúng: chưa tới lúc hết chỗ.
- jstat: O 41% → 64% → 88%, CGC tăng (31 → 72) vì old gen vượt IHOP thường xuyên hơn.
- Code: {{close()}} tồn tại nhưng {{StatementPuller}} không gọi.

### Kế hoạch xử lý

**Ngắn hạn (trước 14h):**
- Rolling restart pod trong khung giờ ít giao dịch để reset hàng đợi (mua thời gian ~18 giờ).
- Hotfix nhỏ nhất: gọi {{close()}} trong {{StatementPuller}} bằng try-with-resources. Nếu {{SftpHandle}} chưa implements {{AutoCloseable}}, dùng try/finally.

~~~java
for (RemoteFile f : listing) {
    try (SftpHandle h = sftp.open(f.path())) {   // cần SftpHandle implements AutoCloseable
        store.save(f.name(), h.readAll());
    }                                             // close() chạy NGAY, trên thread của app
}
// close() được gọi tường minh -> channel đã đóng -> finalize() thấy !isOpen() và return ngay
~~~

Sau hotfix, finalize() vẫn được gọi nhưng chỉ kiểm tra {{isOpen()}} rồi thoát trong micro giây, nên hàng đợi tiêu biến.

**Sửa gốc trong thư viện:**
- Cho {{SftpHandle implements AutoCloseable}}; {{close()}} có timeout ngắn và idempotent.
- **Xoá finalize()**. Nếu cần lưới an toàn khi người dùng quên close, dùng {{java.lang.ref.Cleaner}} với action chỉ **ghi log cảnh báo + đóng socket cục bộ** (không chờ mạng). Cleaner cũng chạy trên thread dùng chung — action chậm vẫn gây backlog y như finalize.

**Chính sách codebase (JDK 21):**
- Finalization đã **deprecated for removal** (JEP 421, JDK 18). Cấm {{finalize()}} trong code mới; quét dependency.
- Chạy test và staging với {{--finalization=disabled}} (JDK 18+) để phát hiện code đang dựa vào finalize để giải phóng tài nguyên.
- Theo dõi: JFR có event {{jdk.FinalizerStatistics}} (JDK 18+) liệt kê class nào có finalizer và số lần chạy; alert khi histogram cho thấy {{java.lang.ref.Finalizer}} tăng liên tục.
- Nguyên tắc: tài nguyên ngoài JVM (socket, file, kênh SSH, connection) **phải** đóng tường minh; GC chỉ quản lý bộ nhớ heap, không quản lý tài nguyên.

| Cơ chế | Thời điểm chạy | Thread | Rủi ro |
|---|---|---|---|
| try-with-resources / close() | Ngay lập tức, xác định | Thread của app | Quên gọi (dùng static analysis để bắt) |
| Cleaner | Sau khi GC phát hiện unreachable | Thread Cleaner dùng chung | Action chậm → backlog; không đảm bảo chạy |
| finalize() | Sau GC, không xác định | 1 thread Finalizer | Backlog, hồi sinh object, deprecated |

### Lỗi hay gặp

- Thấy heap tăng liền nghĩ "cache leak" và đi tìm map static; trong histogram phải để ý {{java.lang.ref.Finalizer}} — số lượng lớn là dấu hiệu finalization.
- Tăng {{-Xmx}}: chỉ kéo dài thời gian tới OOM, tốc độ tích luỹ không đổi.
- Nghĩ có thể "ép" chạy finalize bằng {{System.gc()}} hoặc {{System.runFinalization()}}: không làm Finalizer chạy nhanh hơn khi mỗi finalize() chặn 1,8 giây.
- Bỏ qua thread "Finalizer" khi đọc dump vì nó là thread hệ thống.
- Lưu ý: {{GC.class_histogram}} mặc định kích hoạt Full GC để đếm object sống — trên heap lớn sẽ gây pause; chạy ngoài giờ cao điểm.

### Trả lời miệng 1 phút

"Hai histogram cho thấy SftpHandle và java.lang.ref.Finalizer tăng cùng nhau, từ 61 nghìn lên 119 nghìn, mỗi handle giữ buffer 16 KB, trong khi chỉ 6–10 phiên SFTP thật đang dùng. Code không gọi close, nên handle chỉ được dọn qua finalize, mà JVM chỉ có một thread Finalizer. Thread dump cho thấy Finalizer kẹt ở finalize dòng 88 chờ ack đóng kênh, log ghi 1,8 giây mỗi lần kể từ khi SFTP server nâng cấp. Tạo 3,2 mỗi giây, xử lý 0,55 mỗi giây, dư 2,65 mỗi giây, đúng bằng tốc độ tăng đo được, và nhân với 16 KB ra 946 MB mỗi 6 giờ, khớp GC log. Ngắn hạn tôi restart và hotfix try-with-resources; dài hạn bỏ finalize, đóng tài nguyên tường minh, chạy test với --finalization=disabled."

> Senior tip: Một heuristic tôi hay dùng: nếu "leak" có **tốc độ đều tuyệt đối** và khởi phát trùng với thay đổi **bên ngoài** (đối tác, mạng, DB) chứ không trùng deploy, hãy nghĩ đến một hàng đợi có một consumer chậm đi — Finalizer, Cleaner, AsyncAppender, executor một thread. Lấy tốc độ vào trừ tốc độ ra, nhân thời gian, so với histogram; khi ba con số khớp nhau tới 1%, bạn đã có root cause đủ chắc để trình bày trong postmortem.`,
  rubric: [
    'Nhận diện đúng finalizer backlog: SftpHandle không được close, chỉ dọn qua finalize(); một thread Finalizer duy nhất; object chờ finalize vẫn reachable nên GC không thu hồi được (G1 không có lỗi).',
    'Dẫn chứng: histogram SftpHandle ≈ Finalizer cùng tăng 61190→118911, [B +946MB; thread Finalizer kẹt ở SftpHandle.finalize dòng 88 chờ ack socket; log close ack ~1800ms; heap sau mixed 978→1990→2931MB.',
    'Định lượng khớp: tạo ~3,2/s, finalize ~0,55/s, tích luỹ 2,65/s = (118911−61190)/21780s; ×16400B ≈ 946MB; giải thích vì sao lỗi ngủ yên khi ack 18ms và dự báo thời điểm OOM.',
    'Kế hoạch: ngắn hạn restart + try-with-resources; sửa gốc AutoCloseable, bỏ finalize, Cleaner chỉ làm việc nhanh; chính sách JDK 21 (JEP 421 deprecated, --finalization=disabled, JFR jdk.FinalizerStatistics, không dùng GC để quản lý tài nguyên).'
  ],
  tags: ['finalizer', 'finalization', 'class-histogram', 'g1', 'resource-leak', 'jep-421']
},
{
  id: 'lab-gc-009',
  category: 'gc',
  title: 'Gọi API đối tác trả ảnh chứng từ: humongous allocation làm G1 Full GC liên tục',
  level: 'senior',
  scenario: `**Bối cảnh (background):** Ngân hàng số **TrustPay** có service **claim-service** (Spring Boot 3.2, JDK 17.0.10) xử lý khiếu nại giao dịch. Khi khách mở khiếu nại, hệ thống gọi API của đối tác cổng thanh toán để tải ảnh chứng từ (hóa đơn, biên lai) về, sau đó chuyển tiếp cho frontend hiển thị. Pod chạy trên Kubernetes: 2 vCPU, memory limit 4Gi. JVM khởi động với {{-Xms2g -Xmx2g -XX:+UseG1GC -XX:G1HeapRegionSize=2m -Xlog:gc*,gc+heap=debug:file=/logs/gc.log:time,uptime,level,tags}}.

**Thuật ngữ giải thích:**
- **Humongous object (đối tượng khổng lồ):** Trong G1 GC (Garbage First Garbage Collector — bộ thu gom rác mặc định của JDK 17), heap được chia thành các ô nhỏ gọi là *region* (vùng), mỗi vùng có kích thước cố định (ở đây là 2 MB). Nếu một object (đối tượng) có kích thước ≥ 50% kích thước region (≥ 1 MB với region 2 MB), G1 coi nó là "humongous" và cấp phát trực tiếp vào Old Generation (vùng chứa object sống lâu) trên các region liên tiếp, không đi qua Eden (vùng cấp phát mới). Điều này giống như đặt một chiếc tủ lớn thẳng vào kho thay vì để ở bàn làm việc trước.
- **Full GC:** Thu gom rác toàn bộ heap, dừng toàn bộ ứng dụng (Stop-The-World). Với G1, Full GC thường xảy ra khi heap quá đầy hoặc phân mảnh nặng, và nó rất chậm.
- **jmap -histo:** Lệnh của JDK in ra histogram (bảng thống kê) các class đang chiếm bao nhiêu instance và bao nhiêu byte trên heap. Có thể chạy {{jmap -histo:live <pid>}} để chỉ đếm object còn sống (nhưng sẽ gây Full GC).
- **Heap (vùng nhớ heap):** Nơi JVM lưu trữ các object được tạo bằng {{new}}. Khi heap đầy, GC phải chạy để giải phóng object không còn dùng.

**Triệu chứng:** Lúc **10:15 ngày 22/10/2026**, đội vận hành nhận cảnh báo p99 latency của endpoint {{GET /api/claims/<claimId>/evidence}} tăng từ 800 ms lên **12–18 giây**. Prometheus ghi nhận **7 lần Full GC (Pause Full)** trong 8 phút, mỗi lần 1.9–2.4 giây. CPU pod dao động 0.8–1.6/2 core. Không có {{OutOfMemoryError}}, pod không bị OOMKilled. Sau 10:24, khi đợt khiếu nại cao điểm giảm, hệ thống tự ổn định. Dev đề xuất tăng heap lên 4 GB và tăng G1HeapRegionSize lên 8 MB.

**Dữ liệu thu thập:** GC log trích đoạn trong lúc sự cố, heap histogram lấy bằng {{jmap -histo}} ngay sau một lần Full GC, cấu hình JVM, và mã nguồn method tải ảnh.`,
  artifacts: [
    {
      name: 'gc-claim-service.log',
      lang: 'text',
      content: `[2026-10-22T09:00:00.015+0700][0.015s][info][gc,init] Version: 17.0.10+7 (release)
[2026-10-22T09:00:00.015+0700][0.015s][info][gc,init] CPUs: 2 total, 2 available
[2026-10-22T09:00:00.015+0700][0.015s][info][gc,init] Memory: 4096M
[2026-10-22T09:00:00.015+0700][0.015s][info][gc,init] Heap Region Size: 2M
[2026-10-22T09:00:00.015+0700][0.015s][info][gc,init] Heap Min Capacity: 2G
[2026-10-22T09:00:00.015+0700][0.015s][info][gc,init] Heap Initial Capacity: 2G
[2026-10-22T09:00:00.015+0700][0.015s][info][gc,init] Heap Max Capacity: 2G
[2026-10-22T09:00:00.015+0700][0.015s][info][gc,init] Parallel Workers: 2
[2026-10-22T09:00:00.015+0700][0.015s][info][gc,init] Concurrent Workers: 1
... (young GC bình thường, mỗi 20–40 giây, heap sau GC ~180–260 MB) ...
[2026-10-22T10:14:55.102+0700][4495.102s][info][gc] GC(412) Pause Young (Normal) (G1 Evacuation Pause) 1420M->198M(2048M) 12.441ms
[2026-10-22T10:15:12.330+0700][4512.330s][info][gc] GC(413) Pause Young (Normal) (G1 Evacuation Pause) 1462M->312M(2048M) 18.220ms
[2026-10-22T10:15:28.881+0700][4528.881s][info][gc,start] GC(414) Pause Young (Concurrent Start) (G1 Humongous Allocation)
[2026-10-22T10:15:28.881+0700][4528.881s][info][gc,task] GC(414) Using 2 workers of 2 for evacuation
[2026-10-22T10:15:28.934+0700][4528.934s][info][gc,heap] GC(414) Eden regions: 320->0(298)
[2026-10-22T10:15:28.934+0700][4528.934s][info][gc,heap] GC(414) Survivor regions: 18->22(42)
[2026-10-22T10:15:28.934+0700][4528.934s][info][gc,heap] GC(414) Old regions: 82->98
[2026-10-22T10:15:28.934+0700][4528.934s][info][gc,heap] GC(414) Humongous regions: 186->186
[2026-10-22T10:15:28.934+0700][4528.934s][info][gc,metaspace] GC(414) Metaspace: 94210K(95232K)->94210K(95232K)
[2026-10-22T10:15:28.934+0700][4528.934s][info][gc] GC(414) Pause Young (Concurrent Start) (G1 Humongous Allocation) 1212M->612M(2048M) 53.114ms
[2026-10-22T10:15:28.934+0700][4528.934s][info][gc] GC(415) Concurrent Mark Cycle
[2026-10-22T10:15:30.102+0700][4530.102s][info][gc] GC(416) Pause Young (Normal) (G1 Humongous Allocation) 1580M->1248M(2048M) 71.340ms
[2026-10-22T10:15:30.102+0700][4530.102s][info][gc,heap] GC(416) Humongous regions: 186->412
[2026-10-22T10:15:31.440+0700][4531.440s][info][gc] GC(415) Pause Remark 1688M->1672M(2048M) 14.221ms
[2026-10-22T10:15:31.662+0700][4531.662s][info][gc] GC(415) Concurrent Mark Cycle 2728.004ms
[2026-10-22T10:15:32.018+0700][4532.018s][info][gc] GC(417) Pause Young (Normal) (G1 Humongous Allocation) 1732M->1524M(2048M) 88.602ms
[2026-10-22T10:15:32.018+0700][4532.018s][info][gc,heap] GC(417) Humongous regions: 412->538
[2026-10-22T10:15:33.210+0700][4533.210s][info][gc] GC(418) Pause Young (Normal) (G1 Evacuation Pause) 1884M->1782M(2048M) 102.771ms
[2026-10-22T10:15:33.210+0700][4533.210s][info][gc] GC(418) To-space exhausted
[2026-10-22T10:15:33.210+0700][4533.210s][info][gc,heap] GC(418) Eden regions: 48->0(2)
[2026-10-22T10:15:33.210+0700][4533.210s][info][gc,heap] GC(418) Humongous regions: 538->612
[2026-10-22T10:15:33.211+0700][4533.211s][info][gc,start] GC(419) Pause Full (G1 Compaction Pause)
[2026-10-22T10:15:33.211+0700][4533.211s][info][gc,phases] GC(419) Phase 1: Mark live objects 388.440ms
[2026-10-22T10:15:33.211+0700][4533.211s][info][gc,phases] GC(419) Phase 2: Prepare for compaction 92.118ms
[2026-10-22T10:15:33.211+0700][4533.211s][info][gc,phases] GC(419) Phase 3: Adjust pointers 174.002ms
[2026-10-22T10:15:33.211+0700][4533.211s][info][gc,phases] GC(419) Phase 4: Compact heap 1442.881ms
[2026-10-22T10:15:35.309+0700][4535.309s][info][gc,heap] GC(419) Eden regions: 0->0(64)
[2026-10-22T10:15:35.309+0700][4535.309s][info][gc,heap] GC(419) Old regions: 411->96
[2026-10-22T10:15:35.309+0700][4535.309s][info][gc,heap] GC(419) Humongous regions: 612->612
[2026-10-22T10:15:35.309+0700][4535.309s][info][gc] GC(419) Pause Full (G1 Compaction Pause) 1782M->1412M(2048M) 2098.114ms
[2026-10-22T10:15:36.882+0700][4536.882s][info][gc] GC(420) Pause Young (Normal) (G1 Humongous Allocation) 1820M->1698M(2048M) 96.550ms
[2026-10-22T10:15:38.104+0700][4538.104s][info][gc] GC(421) To-space exhausted
[2026-10-22T10:15:38.104+0700][4538.104s][info][gc] GC(421) Pause Young (Normal) (G1 Evacuation Pause) 2012M->2006M(2048M) 288.441ms
[2026-10-22T10:15:40.502+0700][4540.502s][info][gc] GC(422) Pause Full (G1 Compaction Pause) 2006M->1488M(2048M) 2391.220ms
[2026-10-22T10:15:40.502+0700][4540.502s][info][gc,heap] GC(422) Humongous regions: 640->640
... (mẫu lặp lại: Humongous Allocation -> To-space exhausted -> Pause Full ~2s; Humongous regions dao động 580–650 và không về 0 sau Full GC) ...
[2026-10-22T10:22:48.771+0700][4968.771s][info][gc] GC(438) Pause Young (Normal) (G1 Evacuation Pause) 1704M->1510M(2048M) 84.110ms
[2026-10-22T10:22:48.771+0700][4968.771s][info][gc,heap] GC(438) Humongous regions: 590->590
[2026-10-22T10:23:41.220+0700][5021.220s][info][gc] GC(441) Pause Young (Normal) (G1 Evacuation Pause) 1612M->224M(2048M) 19.884ms
[2026-10-22T10:23:41.220+0700][5021.220s][info][gc,heap] GC(441) Humongous regions: 590->8
[2026-10-22T10:24:15.003+0700][5055.003s][info][gc] GC(442) Pause Young (Normal) (G1 Evacuation Pause) 1388M->192M(2048M) 11.602ms`
    },
    {
      name: 'jmap-histo-after-fullgc.txt',
      lang: 'text',
      content: `$ kubectl exec claim-service-6c8d9f-x4k2p -- jmap -histo 1 | head -25
 num     #instances         #bytes  class name (module)
-------------------------------------------------------
   1:          1823      982114304  [B (java.base@17.0.10)
   2:           612      256901120  [B (java.base@17.0.10)
   3:         88421       21221040  java.lang.String (java.base@17.0.10)
   4:         42108       13474560  java.util.HashMap$Node (java.base@17.0.10)
   5:         19882        9543360  [Ljava.lang.Object; (java.base@17.0.10)
   6:         31004        4960640  java.util.concurrent.ConcurrentHashMap$Node (java.base@17.0.10)
   7:         12011        3843520  java.util.LinkedHashMap$Entry (java.base@17.0.10)
   8:          8841        2829120  com.fasterxml.jackson.databind.node.TextNode
   9:          7210        2307200  java.util.ArrayList (java.base@17.0.10)
  10:          6102        1952640  org.apache.catalina.connector.RequestFacade
...
Total        412883     1318842112

# Ghi chú vận hành: lệnh trên không dùng -histo:live nên không ép Full GC.
# Lấy ngay sau GC(419). Dòng 1 và 2 đều là [B (mảng byte) nhưng kích thước
# trung bình rất khác: dòng 1 ~538 KB/instance (nhiều mảng nhỏ), dòng 2 ~420 MB
# tổng cho 612 instance ~0.4 MB? Không, tính lại: 256901120 / 612 ~ 419,773 bytes ~ 410 KB.
# Thực tế dòng 2 là các mảng byte lớn (ảnh) trung bình ~410 KB; dòng 1 gộp các mảng byte khác.`
    },
    {
      name: 'jvm-flags.txt',
      lang: 'text',
      content: `$ kubectl exec claim-service-6c8d9f-x4k2p -- jcmd 1 VM.flags
1:
-XX:CICompilerCount=2 -XX:ConcGCThreads=1 -XX:G1ConcRefinementThreads=2
-XX:G1HeapRegionSize=2097152 -XX:GCDrainStackTargetSize=64
-XX:InitialHeapSize=2147483648 -XX:MarkStackSize=4194304
-XX:MaxHeapSize=2147483648 -XX:MaxNewSize=1287651328
-XX:MinHeapDeltaBytes=2097152 -XX:MinHeapSize=2147483648
-XX:NonNMethodCodeHeapSize=5826188 -XX:NonProfiledCodeHeapSize=122916026
-XX:ParallelGCThreads=2 -XX:ProfiledCodeHeapSize=122916026
-XX:ReservedCodeCacheSize=251658240 -XX:+SegmentedCodeCache
-XX:SoftMaxHeapSize=2147483648 -XX:+UseCompressedClassPointers
-XX:+UseCompressedOops -XX:+UseG1GC -XX:+UseStringDeduplication`
    },
    {
      name: 'EvidenceController.java',
      lang: 'text',
      content: `package vn.trustpay.claim.controller;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/claims")
public class EvidenceController {

    // HttpClient dùng chung, đúng cách
    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(5))
            .build();

    @GetMapping("/{claimId}/evidence")
    public ResponseEntity<byte[]> getEvidence(@PathVariable String claimId,
                                              @RequestParam String partnerUrl) throws Exception {
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(partnerUrl))
                .timeout(Duration.ofSeconds(30))
                .header("X-Claim-Id", claimId)
                .GET()
                .build();

        // ofByteArray(): đọc TOÀN BỘ response body vào một mảng byte[] trong heap
        HttpResponse<byte[]> response = httpClient.send(request,
                HttpResponse.BodyHandlers.ofByteArray());

        byte[] imageBytes = response.body();   // có thể 2–8 MB tuỳ ảnh chứng từ
        return ResponseEntity.ok()
                .contentType(MediaType.IMAGE_JPEG)
                .contentLength(imageBytes.length)
                .body(imageBytes);
    }
}`
    }
  ],
  questions: [
    'Vì sao G1 báo "G1 Humongous Allocation", rồi "To-space exhausted", rồi "Pause Full"? Dùng GC log và cấu hình G1HeapRegionSize=2M để giải thích cơ chế và trích dòng bằng chứng.',
    'Dữ liệu nào chứng minh đây KHÔNG phải memory leak? Vì sao tăng heap lên 4 GB hoặc tăng G1HeapRegionSize là chữa cháy, không phải lời giải gốc?',
    'Bạn sẽ sửa code và vận hành thế nào để xử lý ảnh lớn mà không gây humongous allocation? Nêu cách ngắn hạn và dài hạn.'
  ],
  hints: [
    'G1HeapRegionSize=2M nghĩa là object ≥ 1 MB là humongous. Ảnh 2–8 MB sẽ chiếm bao nhiêu region liên tiếp? Nhìn Humongous regions tăng từ 186 lên 612 rồi 640 trong log.',
    'So sánh Humongous regions sau Pause Full (GC 419: 612->612, GC 422: 640->640) với sau GC 441 (590->8). Khi nào humongous được giải phóng? Điều đó nói gì về leak?',
    'HttpResponse.BodyHandlers.ofByteArray() đọc toàn bộ body vào heap. Có BodyHandler nào stream dữ liệu ra OutputStream/luồng thay vì giữ hết trong byte[] không? Hoặc có thể dùng presigned URL/redirect để client tải trực tiếp?'
  ],
  answer: `**Tóm tắt:** Mỗi request tải ảnh chứng từ dùng {{HttpResponse.BodyHandlers.ofByteArray()}}, đọc toàn bộ ảnh (2–8 MB) vào một mảng {{byte[]}} trên heap. Với {{G1HeapRegionSize=2M}}, mọi mảng ≥ 1 MB là **humongous object** và chiếm các region liên tiếp trong Old Gen. Khi nhiều request đồng thời (giờ cao điểm khiếu nại), hàng trăm region humongous bị giữ cùng lúc, heap 2 GB không còn chỗ trống để G1 evacuate (di chuyển object sống) → {{To-space exhausted}} → {{Pause Full (G1 Compaction Pause)}} dài ~2 giây, lặp lại liên tục. Khi tải giảm, humongous được giải phóng ngay ở một young GC thường ({{590->8}}), chứng minh **không phải leak**. Lời giải gốc là **không giữ toàn bộ ảnh trong heap**: stream response về client hoặc dùng URL tải trực tiếp.

### Cơ chế: Humongous allocation trong G1 (đi từng bước)

**1. G1 chia heap thành region (vùng):** GC log cho thấy {{Heap Region Size: 2M, Heap Max Capacity: 2G}} → heap có 1024 region, mỗi region 2 MB. Đây là các "ô" G1 dùng để quản lý bộ nhớ.

**2. Ngưỡng humongous:** G1 coi object ≥ 50% kích thước region là humongous. Với region 2 MB, ngưỡng là **1 MB**. Mảng {{byte[]}} chứa ảnh 2 MB, 4 MB, 8 MB đều vượt ngưỡng.

**3. Cấp phát humongous khác cấp phát thường:**
- Object thường: cấp phát vào Eden region (vùng mới). Khi Eden đầy, G1 chạy young GC, di chuyển object còn sống sang Survivor/Old. Đây là cơ chế bình thường, nhanh.
- Object humongous: G1 **bỏ qua Eden**, tìm các region **liên tiếp, trống** trong Old Gen để đặt object vào. Ảnh 4 MB cần 2 region liên tiếp; ảnh 8 MB cần 4 region. (G1 có thể dùng "starts humongous" + "continues humongous" regions.)
- Mỗi lần cấp phát humongous, G1 thường kích hoạt kiểm tra ngưỡng IHOP (Initiating Heap Occupancy Percent) → có thể bắt đầu concurrent mark cycle. Đó là lý do ta thấy {{Pause Young (Concurrent Start) (G1 Humongous Allocation)}}.

**4. Tại sao humongous gây Full GC?**
- Humongous region chỉ được giải phóng (reclaim) khi **toàn bộ** humongous object bên trong không còn được tham chiếu. Trên JDK 17, G1 có cơ chế *eager reclaim* cho humongous object "chết" kiểu mảng primitive (như {{byte[]}}) — có thể thu hồi ngay trong young GC. Nhưng nếu humongous object **vẫn còn sống** (đang được request giữ tham chiếu), không GC nào thu hồi được.
- Khi nhiều humongous region còn sống chiếm phần lớn heap, G1 không còn region trống để evacuate object từ Eden/Survivor trong young GC → xảy ra {{To-space exhausted}}. Lúc này G1 buộc phải chạy {{Pause Full (G1 Compaction Pause)}}: dừng toàn bộ ứng dụng, quét toàn heap, nén (compact) các region. Full GC trên heap 2 GB mất ~2 giây — trong thời gian đó ứng dụng không xử lý request nào.
- Full GC trên G1 (JDK 17) **không di chuyển humongous object** hiệu quả trong mọi trường hợp và gặp khó khăn khi phân mảnh nặng. Vì vậy sau Full GC, {{Humongous regions}} có thể vẫn giữ nguyên nếu object còn sống.

### Dẫn chứng từ artifact

| Thời điểm / GC | Dòng log trích | Ý nghĩa |
|---|---|---|
| GC(414) | {{Pause Young (Concurrent Start) (G1 Humongous Allocation) 1212M->612M(2048M) 53.114ms}}, {{Humongous regions: 186->186}} | Bắt đầu có humongous allocation. 186 region × 2 MB = 372 MB humongous. Concurrent mark cycle khởi động. |
| GC(416) | {{G1 Humongous Allocation}}, {{Humongous regions: 186->412}} | Humongous tăng mạnh (+226 region = +452 MB) khi nhiều request tải ảnh đồng thời. |
| GC(417) | {{Humongous regions: 412->538}} | Tiếp tục tăng. Heap sau GC 1524M — gần đầy. |
| GC(418) | {{To-space exhausted}}, {{Eden regions: 48->0(2)}}, {{Humongous regions: 538->612}} | G1 không còn region trống để copy object sống từ Eden. Eden bị thu về 0. Dấu hiệu heap bị "kẹt" bởi humongous. |
| GC(419) | {{Pause Full (G1 Compaction Pause) 1782M->1412M(2048M) 2098.114ms}}, {{Old regions: 411->96}}, {{Humongous regions: 612->612}} | Full GC dừng app 2.1 giây. Old region giảm (compact thành công phần thường) nhưng **humongous vẫn 612** — các {{byte[]}} ảnh vẫn đang được request HTTP giữ tham chiếu, chưa chết. |
| GC(422) | {{Pause Full ... 2391.220ms}}, {{Humongous regions: 640->640}} | Full GC thứ hai, humongous còn tăng (640 region = 1280 MB, chiếm 62.5% heap 2 GB). Chu trình lặp lại. |
| GC(441) | {{Pause Young (Normal) ... 1612M->224M(2048M) 19.884ms}}, {{Humongous regions: 590->8}} | **Bằng chứng không leak:** khi tải giảm, các request hoàn thành và giải phóng tham chiếu đến {{byte[]}}. Một young GC thường đã eager-reclaim humongous từ 590 xuống 8, heap về 224 MB. Nếu leak, humongous/heap sau GC phải tăng dần theo thời gian và không giảm được. |
| jmap-histo | Dòng 2: {{612 instances, 256,901,120 bytes}} cho {{[B}} — trung bình ~410 KB/instance | Phù hợp với ảnh chứng từ cỡ vài trăm KB đến vài MB. Nhiều instance {{[B}} humongous đang sống cùng lúc. |
| JVM flags | {{G1HeapRegionSize=2097152 (2M), MaxHeapSize=2147483648 (2G)}} | Ngưỡng humongous = 1 MB. Heap 2 GB với region 2 MB = 1024 region tổng. |
| Code | {{HttpResponse.BodyHandlers.ofByteArray()}} và {{ResponseEntity<byte[]>}} | Đọc **toàn bộ** response body vào một {{byte[]}} duy nhất trên heap, rồi giữ thêm trong response entity cho đến khi ghi xong ra HTTP response. Với ảnh 4 MB, ít nhất 4 MB humongous sống suốt vòng đời request. |

### Tại sao đề xuất "tăng heap / tăng G1HeapRegionSize" không phải lời giải gốc

- **Tăng heap lên 4 GB:** Chỉ đẩy thời điểm xảy ra Full GC ra xa hơn. Nếu số request đồng thời tăng (ví dụ đợt khiếu nại lớn) hoặc ảnh lớn hơn (8–12 MB), humongous vẫn sẽ lấp đầy heap. Full GC trên heap 4 GB còn chậm hơn 2 GB. Pod limit 4Gi cũng không đủ cho heap 4 GB cộng native memory/metaspace.
- **Tăng G1HeapRegionSize lên 8 MB hoặc 16 MB:** Ngưỡng humongous thành 4 MB hoặc 8 MB, nên ảnh 2–3 MB không còn là humongous. Đây là *workaround* có thể giảm tần suất sự cố cho ảnh nhỏ, nhưng ảnh 5–8 MB vẫn humongous. Hơn nữa, region lớn hơn làm young GC kém linh hoạt (ít region hơn để chia Eden/Survivor). Phải restart JVM để đổi flag này, và không giải quyết nguyên nhân gốc: **ứng dụng giữ dữ liệu lớn trong heap vô ích**.
- **Nguyên nhân gốc:** Service chỉ cần chuyển ảnh từ đối tác sang client — không cần parse, không cần biến đổi. Giữ toàn bộ ảnh trong heap là lãng phí và tạo rủi ro GC.

### Cách sửa

**Ngắn hạn (triển khai nhanh, giảm rủi ro):**
1. **Giới hạn đồng thời (bulkhead):** Dùng {{Semaphore}} hoặc Resilience4j Bulkhead giới hạn số request tải evidence đồng thời (ví dụ tối đa 3–4 request/pod). Trả HTTP 429 (Too Many Requests) hoặc 503 khi vượt, kèm {{Retry-After}}. Điều này giới hạn số {{byte[]}} humongous sống cùng lúc.
2. **Giới hạn kích thước response:** Kiểm tra {{Content-Length}} header trước khi đọc; từ chối hoặc dùng cách xử lý khác nếu vượt ngưỡng (ví dụ > 5 MB).
3. **Tăng G1HeapRegionSize** (ví dụ 4M hoặc 8M) như biện pháp tạm thời nếu ảnh đa số < 4 MB — cần đo lại và restart có kế hoạch.

**Dài hạn (sửa thiết kế, loại bỏ humongous):**

1. **Streaming thay vì buffer toàn bộ (nếu phải proxy qua service):** Dùng {{BodyHandlers.ofInputStream()}} hoặc {{ofPublisher()}} và stream trực tiếp ra {{HttpServletResponse.getOutputStream()}} với buffer nhỏ (ví dụ 8–32 KB). Cách này tránh tạo {{byte[]}} lớn trên heap.
~~~java
@GetMapping("/{claimId}/evidence")
public void streamEvidence(@PathVariable String claimId,
                           @RequestParam String partnerUrl,
                           HttpServletResponse servletResponse) throws Exception {
    HttpRequest request = HttpRequest.newBuilder()
            .uri(URI.create(partnerUrl))
            .timeout(Duration.ofSeconds(30))
            .GET()
            .build();
    // ofInputStream(): không đọc hết vào heap; trả về InputStream để đọc từng phần
    HttpResponse<java.io.InputStream> resp = httpClient.send(request,
            HttpResponse.BodyHandlers.ofInputStream());
    servletResponse.setStatus(resp.statusCode());
    servletResponse.setContentType(MediaType.IMAGE_JPEG_VALUE);
    try (var in = resp.body(); var out = servletResponse.getOutputStream()) {
        in.transferTo(out);   // copy theo buffer nhỏ, heap phẳng
    }
}
~~~
Lưu ý: khi đã ghi status 200 và bắt đầu stream body, nếu lỗi giữa chừng bạn không thể đổi sang HTTP 500 "sạch". Cần cân nhắc theo yêu cầu nghiệp vụ (so với cách ghi file tạm rồi trả {{FileSystemResource}} để có {{Content-Length}} và xử lý lỗi tốt hơn).

2. **Tốt hơn: không proxy dữ liệu nhị phân qua claim-service.** Lấy URL tải (presigned URL từ object storage của đối tác, hoặc URL có token ngắn hạn) và trả về cho frontend để trình duyệt/app tải trực tiếp. Claim-service chỉ xử lý metadata và ủy quyền — heap và băng thông của service không còn phụ thuộc kích thước ảnh.

3. **Quan sát và phòng ngừa:**
- Alert khi có {{Pause Full (G1 Compaction Pause)}}: tăng {{jvm_gc_pause_seconds_count}} với label {{cause}} chứa "G1 Compaction" hoặc {{action="end of major GC"}}.
- Alert khi {{G1 Humongous Allocation}} xuất hiện dày đặc (đếm theo cause trong GC log/metric exporter).
- Theo dõi {{jvm_gc_live_data_size_bytes}} và tỷ lệ humongous regions nếu có metric (hoặc parse GC log).
- Bật JFR liên tục ({{-XX:StartFlightRecording=disk=true,maxage=2h,settings=profile}}) để khi sự cố có dữ liệu {{jdk.ObjectAllocationSample}} / {{jdk.G1HeapSummary}}.
- Code review: cấm {{BodyHandlers.ofByteArray()}} và {{ResponseEntity<byte[]>}} cho dữ liệu kích thước không giới hạn; yêu cầu streaming hoặc externalized download.

> Senior tip: Humongous allocation là "kẻ giết G1 thầm lặng" vì ứng dụng có thể chạy ngon trong tuần đầu, rồi sập khi traffic tăng hoặc payload lớn hơn một chút. Quy tắc thực dụng: **mọi byte[]/mảng lớn tạo ra từ dữ liệu bên ngoài (upload, HTTP response, file đọc) đều phải có giới hạn kích thước hoặc phải stream**. Khi debug GC log, hãy tìm chuỗi: {{G1 Humongous Allocation}} → {{To-space exhausted}} → {{Pause Full}} và kiểm tra {{Humongous regions}} trước/sau Full GC — nếu humongous không giảm sau Full GC nhưng giảm mạnh ở young GC sau đó, đó là humongous còn sống do request giữ, không phải leak và không phải bug G1.`,
  rubric: [
    'Giải thích đúng cơ chế humongous trong G1: region 2M → ngưỡng 1M, object ≥ ngưỡng cấp phát trực tiếp vào Old Gen trên region liên tiếp, không qua Eden; humongous allocation có thể trigger Concurrent Start.',
    'Dẫn chứng chuỗi sự cố từ GC log: G1 Humongous Allocation, Humongous regions tăng (186→412→538→612→640), To-space exhausted, Pause Full ~2s nhưng Humongous regions không giảm (612->612, 640->640).',
    'Chứng minh không leak: GC(441) Humongous regions 590->8 và heap 1612M->224M trong young GC thường khi tải giảm; phân biệt humongous còn sống vs leak tăng dần theo thời gian.',
    'Chỉ đúng nguyên nhân code: HttpResponse.BodyHandlers.ofByteArray() + ResponseEntity<byte[]> giữ toàn bộ ảnh trong heap; mỗi request tạo humongous byte[].',
    'Đề xuất sửa có chiều sâu: streaming (ofInputStream/transferTo) hoặc presigned URL/redirect để client tải trực tiếp; bulkhead giới hạn đồng thời; cảnh báo về G1HeapRegionSize/tăng heap chỉ là workaround; có alert Full GC và humongous.'
  ],
  tags: ['g1', 'humongous-allocation', 'full-gc', 'gc-log', 'jmap-histo', 'streaming', 'jdk17']
},
{
  id: 'lab-gc-010',
  category: 'gc',
  title: 'Redeploy tính năng scripting: Metaspace OOM do classloader leak từ ScriptEngine',
  level: 'senior',
  scenario: `**Bối cảnh (background):** Nền tảng **InsureCore** (Spring Boot 3.2, JDK 17.0.10) cho phép đội nghiệp vụ cấu hình công thức tính phí bảo hiểm bằng script. Service **premium-engine** tải script từ database, biên dịch và thực thi để tính phí. Mỗi lần đội nghiệp vụ bấm "Áp dụng công thức mới" trên trang quản trị, service reload toàn bộ công thức đang active. Pod chạy 2 vCPU, memory limit 3Gi. JVM: {{-Xmx1536m -XX:MaxMetaspaceSize=192m -XX:MetaspaceSize=96m -XX:+UseG1GC -Xlog:gc*,gc+metaspace=info:file=/logs/gc.log:time,uptime,level,tags}}.

**Thuật ngữ giải thích:**
- **Metaspace:** Vùng nhớ native (ngoài heap) mà JVM dùng để lưu *metadata của class* — thông tin mô tả class như tên method, field, bytecode đã được nạp. (Trước Java 8 vùng này gọi là PermGen và nằm trong heap; từ Java 8 trở đi là Metaspace, dùng native memory.) Metaspace có thể tăng trưởng; {{-XX:MaxMetaspaceSize}} giới hạn tối đa để tránh ăn hết RAM máy.
- **Classloader (bộ nạp class):** Thành phần của JVM chịu trách nhiệm đọc bytecode (.class) và tạo đối tượng {{Class}} trong Metaspace. Mỗi classloader có "thế hệ" class riêng. Khi **không còn bất kỳ object nào** tham chiếu đến classloader và các class do nó nạp, GC mới có thể thu hồi (unload) toàn bộ classloader đó và giải phóng Metaspace tương ứng. Nếu vẫn còn một tham chiếu sót lại, classloader bị "kẹt" → Metaspace leak.
- **ScriptEngine (Nashorn/GraalJS/JDK scripting):** API cho phép chạy script động (JavaScript, v.v.) trong JVM. Nhiều implementation biên dịch script thành bytecode Java và nạp bằng classloader riêng. Tạo ScriptEngine/classloader mới liên tục mà không giải phóng đúng cách có thể gây Metaspace leak.
- **{{OutOfMemoryError: Metaspace}}:** Lỗi xảy ra khi Metaspace cần tăng nhưng đã chạm {{MaxMetaspaceSize}} và GC không thể unload classloader nào thêm. Heap có thể vẫn còn trống.
- **{{jcmd VM.metaspace}} / {{VM.classloader_stats}}:** Công cụ chẩn đoán của JDK (đi kèm {{jcmd <pid>}}) cho biết Metaspace dùng bao nhiêu, có bao nhiêu classloader, class nào được nạp.

**Triệu chứng:** Service deploy lúc **08:00 ngày 23/10/2026**. Đội nghiệp vụ reload công thức khoảng **mỗi 10–15 phút** trong giờ làm việc để thử nghiệm (peak ~6 reload/giờ). Lúc **15:42**, pod bắt đầu trả HTTP 500 hàng loạt. Log có {{java.lang.OutOfMemoryError: Metaspace}}. Restart pod thì chạy lại, nhưng khoảng 7–8 giờ sau lại tái diễn. Heap theo dashboard chỉ ~520 MB / 1536 MB khi lỗi xảy ra. Dev A cho rằng "heap đủ lớn, chắc do MaxMetaspaceSize quá nhỏ" và đề xuất tăng lên 512 MB. Dev B chạy {{jmap -histo}} nhưng không thấy class ứng dụng nào tăng bất thường trên heap.

**Dữ liệu thu thập:** Log lỗi và GC log quanh thời điểm OOM, {{jcmd VM.metaspace}} và {{jcmd VM.classloader_stats}} lấy lúc 15:10 (trước khi OOM ~30 phút), metric {{jvm_classes_loaded_classes}} theo thời gian, và mã nguồn {{PremiumFormulaService}}.`,
  artifacts: [
    {
      name: 'gc-metaspace.log',
      lang: 'text',
      content: `[2026-10-23T08:00:01.020+0700][0.020s][info][gc,init] Heap Max Capacity: 1536M
[2026-10-23T08:00:01.020+0700][0.020s][info][gc,metaspace] CDS archive(s) mapped at: [0x0000000800000000-0x0000000800c00000-0x0000000800c00000), size 12582912
[2026-10-23T08:05:12.441+0700][311.441s][info][gc] GC(18) Pause Young (Normal) (G1 Evacuation Pause) 612M->148M(1536M) 9.210ms
[2026-10-23T08:05:12.441+0700][311.441s][info][gc,metaspace] GC(18) Metaspace: 78420K(79360K)->78420K(79360K) NonClass: 68210K(68608K)->68210K(68608K) Class: 10210K(10752K)->10210K(10752K)
... (Metaspace tăng dần sau mỗi đợt reload công thức) ...
[2026-10-23T11:02:33.102+0700][10952.102s][info][gc] GC(142) Pause Young (Normal) (G1 Evacuation Pause) 702M->188M(1536M) 11.004ms
[2026-10-23T11:02:33.102+0700][10952.102s][info][gc,metaspace] GC(142) Metaspace: 112844K(114176K)->112844K(114176K) NonClass: 98220K(98816K)->98220K(98816K) Class: 14624K(15360K)->14624K(15360K)
[2026-10-23T13:18:09.550+0700][19088.550s][info][gc] GC(286) Pause Young (Normal) (G1 Evacuation Pause) 688M->201M(1536M) 10.882ms
[2026-10-23T13:18:09.550+0700][19088.550s][info][gc,metaspace] GC(286) Metaspace: 149210K(150528K)->149210K(150528K) NonClass: 129880K(130560K)->129880K(130560K) Class: 19330K(19968K)->19330K(19968K)
[2026-10-23T15:10:44.210+0700][25843.210s][info][gc] GC(398) Pause Young (Normal) (G1 Evacuation Pause) 710M->214M(1536M) 12.110ms
[2026-10-23T15:10:44.210+0700][25843.210s][info][gc,metaspace] GC(398) Metaspace: 178602K(180224K)->178602K(180224K) NonClass: 155410K(156160K)->155410K(156160K) Class: 23192K(24064K)->23192K(24064K)
[2026-10-23T15:41:55.003+0700][27714.003s][info][gc,start] GC(421) Pause Young (Concurrent Start) (Metadata GC Threshold)
[2026-10-23T15:41:55.003+0700][27714.003s][info][gc,metaspace] GC(421) Metaspace: 196024K(196608K)->196024K(196608K) NonClass: 170612K(170752K)->170612K(170752K) Class: 25412K(25856K)->25412K(25856K)
[2026-10-23T15:41:55.003+0700][27714.003s][info][gc] GC(421) Pause Young (Concurrent Start) (Metadata GC Threshold) 588M->402M(1536M) 16.440ms
[2026-10-23T15:41:55.004+0700][27714.004s][info][gc] GC(422) Concurrent Mark Cycle
[2026-10-23T15:41:55.882+0700][27714.882s][info][gc] GC(422) Pause Remark 430M->428M(1536M) 28.110ms
[2026-10-23T15:41:55.882+0700][27714.882s][info][gc,metaspace] GC(422) Metaspace: 196024K(196608K)->196024K(196608K)
[2026-10-23T15:41:55.980+0700][27714.980s][info][gc] GC(422) Concurrent Mark Cycle 976.221ms
[2026-10-23T15:41:56.410+0700][27715.410s][info][gc] GC(423) Pause Full (Metadata GC Threshold) 466M->398M(1536M) 1188.602ms
[2026-10-23T15:41:56.410+0700][27715.410s][info][gc,metaspace] GC(423) Metaspace: 196410K(196608K)->196410K(196608K) NonClass: 170980K(170752K)->170980K(170752K) Class: 25430K(25856K)->25430K(25856K)
[2026-10-23T15:41:57.990+0700][27716.990s][info][gc] GC(424) Pause Full (Metadata GC Clear Soft References) 398M->396M(1536M) 1241.330ms
[2026-10-23T15:41:57.990+0700][27716.990s][info][gc,metaspace] GC(424) Metaspace: 196410K(196608K)->196410K(196608K) NonClass: 170980K(170752K)->170980K(170752K) Class: 25430K(25856K)->25430K(25856K)
[2026-10-23T15:42:01.102+0700][27720.102s][info][gc] GC(425) Pause Full (Last Ditch Collection) 396M->396M(1536M) 1310.441ms
[2026-10-23T15:42:01.102+0700][27720.102s][info][gc,metaspace] GC(425) Metaspace: 196582K(196608K)->196582K(196608K)`
    },
    {
      name: 'app-oom.log',
      lang: 'text',
      content: `{"@timestamp":"2026-10-23T15:41:58.221+07:00","level":"INFO","logger":"vn.insurecore.premium.PremiumFormulaService","thread":"admin-http-7","message":"Reloading premium formulas, active=42"}
{"@timestamp":"2026-10-23T15:42:01.104+07:00","level":"ERROR","logger":"o.a.c.c.C.[.[.[/].[dispatcherServlet]","thread":"admin-http-7","message":"Handler dispatch failed: java.lang.OutOfMemoryError: Metaspace","stack_trace":"java.lang.OutOfMemoryError: Metaspace
\tat java.base/java.lang.ClassLoader.defineClass1(Native Method)
\tat java.base/java.lang.ClassLoader.defineClass(ClassLoader.java:1017)
\tat java.base/java.security.SecureClassLoader.defineClass(SecureClassLoader.java:150)
\tat jdk.scripting.nashorn/jdk.nashorn.internal.runtime.ScriptLoader.installClass(ScriptLoader.java:105)
\tat jdk.scripting.nashorn/jdk.nashorn.internal.codegen.CompilationPhase$InstallPhase.transform(CompilationPhase.java:508)
\tat jdk.scripting.nashorn/jdk.nashorn.internal.codegen.CompilationPhase.apply(CompilationPhase.java:624)
\tat jdk.scripting.nashorn/jdk.nashorn.internal.codegen.Compiler.compile(Compiler.java:655)
\tat jdk.scripting.nashorn/jdk.nashorn.internal.runtime.Context.compile(Context.java:1339)
\tat jdk.scripting.nashorn/jdk.nashorn.internal.runtime.Context.compileScript(Context.java:1306)
\tat jdk.scripting.nashorn/jdk.nashorn.api.scripting.NashornScriptEngine.compileImpl(NashornScriptEngine.java:557)
\tat jdk.scripting.nashorn/jdk.nashorn.api.scripting.NashornScriptEngine.compileImpl(NashornScriptEngine.java:544)
\tat jdk.scripting.nashorn/jdk.nashorn.api.scripting.NashornScriptEngine.evalImpl(NashornScriptEngine.java:412)
\tat jdk.scripting.nashorn/jdk.nashorn.api.scripting.NashornScriptEngine.eval(NashornScriptEngine.java:150)
\tat javax.script.AbstractScriptEngine.eval(AbstractScriptEngine.java:264)
\tat vn.insurecore.premium.PremiumFormulaService.reloadFormulas(PremiumFormulaService.java:57)
\tat vn.insurecore.premium.AdminController.reload(AdminController.java:34)
\t..."}
{"@timestamp":"2026-10-23T15:42:01.220+07:00","level":"ERROR","logger":"vn.insurecore.premium.PremiumFormulaService","thread":"http-nio-8080-exec-12","message":"premium calculation failed for policy=P-881022","stack_trace":"java.lang.OutOfMemoryError: Metaspace"}`
    },
    {
      name: 'jcmd-vm-metaspace-1510.txt',
      lang: 'text',
      content: `$ kubectl exec premium-engine-5f7b8c-n2m9q -- jcmd 1 VM.metaspace
1:
Total Usage - 321 loaders, 14822 classes (1024 shared):
  Non-Class: 3018 chunks,     155.41 MB capacity,   151.77 MB ( 98%) used,     3.12 MB (  2%) free,    13.18 KB ( <1%) waste,   512.00 KB ( <1%) overhead, deallocated: 4122 blocks with 1.21 MB
      Class:  2014 chunks,      22.64 MB capacity,    22.64 MB (>99%) used,     8.00 KB ( <1%) free,     2.11 KB ( <1%) waste,   248.00 KB (  1%) overhead, deallocated: 1884 blocks with 0.54 MB
       Both:  5032 chunks,     178.05 MB capacity,   174.42 MB ( 98%) used,     3.13 MB (  2%) free,    15.29 KB ( <1%) waste,   760.00 KB ( <1%) overhead, deallocated: 6006 blocks with 1.75 MB

Virtual space:
  Non-class space:      192.00 MB reserved,     156.00 MB (>81%) committed,  3 nodes.
      Class space:        1.00 GB reserved,      24.00 MB (  2%) committed,  1 nodes.
             Both:        1.19 GB reserved,     180.00 MB ( 15%) committed.

MaxMetaspaceSize: 192.00 MB
CompressedClassSpaceSize: 1.00 GB
Initial GC threshold: 96.00 MB
Current GC threshold: 196.00 MB
CDS: on
MetaspaceReclaimPolicy: balanced`
    },
    {
      name: 'jcmd-classloader-stats-1510.txt',
      lang: 'text',
      content: `$ kubectl exec premium-engine-5f7b8c-n2m9q -- jcmd 1 VM.classloader_stats | head -12
1:
ClassLoader                                                     Parent                      CLD*               Classes   ChunkSz   BlockSz  Type
0x0000000800204000                                              0x0000000800010a60          0x00007f1a8c1b2a10       1      5120      4608  jdk.nashorn.api.scripting.NashornScriptEngine$3
0x0000000800204320                                              0x0000000800010a60          0x00007f1a8c1b2c80       1      5120      4608  jdk.nashorn.api.scripting.NashornScriptEngine$3
0x0000000800204640                                              0x0000000800010a60          0x00007f1a8c1b2ef0       1      5120      4608  jdk.nashorn.api.scripting.NashornScriptEngine$3
0x0000000800204960                                              0x0000000800010a60          0x00007f1a8c1b3160       1      5120      4608  jdk.nashorn.api.scripting.NashornScriptEngine$3
0x0000000800204c80                                              0x0000000800010a60          0x00007f1a8c1b33d0       1      5120      4608  jdk.nashorn.api.scripting.NashornScriptEngine$3
... (nhiều dòng tương tự, mỗi dòng 1 class, loader jdk.nashorn.api.scripting.NashornScriptEngine$3)
$ kubectl exec premium-engine-5f7b8c-n2m9q -- jcmd 1 VM.classloader_stats | grep NashornScriptEngine | wc -l
284
$ kubectl exec premium-engine-5f7b8c-n2m9q -- jcmd 1 VM.classloader_stats | grep NashornScriptEngine | awk '{sum+=$6} END {print sum " bytes (ChunkSz total)"}'
116736000 bytes (ChunkSz total)`
    },
    {
      name: 'metrics-and-flags.txt',
      lang: 'text',
      content: `# Prometheus, pod premium-engine-5f7b8c-n2m9q
time    jvm_classes_loaded_classes  jvm_classes_unloaded_classes_total  metaspace_used_mb  heap_used_mb  formula_reload_events
08:10                         18420                                   0              76.5           312                    1
09:10                         20110                                   0              89.2           338                    5
10:10                         22840                                   0             101.8           355                   11
11:10                         25660                                   0             114.6           361                   17
12:10                         28410                                   0             127.1           349                   23
13:10                         31180                                   0             139.9           372                   29
14:10                         33950                                   0             152.4           388                   35
15:10                         36720                                   0             165.0           401                   41
15:42                         39210                                   0             191.9           520                    -  (OOM)

# JVM flags (deploy)
-Xmx1536m -XX:MaxMetaspaceSize=192m -XX:MetaspaceSize=96m -XX:+UseG1GC
# JDK
java version "17.0.10" 2024-01-16 LTS
# Nashorn note: Nashorn engine script engine được bundle/available theo runtime image của service (base image nội bộ).`
    },
    {
      name: 'PremiumFormulaService.java',
      lang: 'text',
      content: `package vn.insurecore.premium;

import javax.script.*;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.stereotype.Service;

@Service
public class PremiumFormulaService {

    private final FormulaRepository repo;
    // Cache compiled script theo formulaId
    private final Map<String, CompiledScript> compiled = new ConcurrentHashMap<>();

    public PremiumFormulaService(FormulaRepository repo) {
        this.repo = repo;
    }

    // Gọi khi admin bấm "Áp dụng công thức mới" (mỗi 10–15 phút trong giờ thử nghiệm)
    public synchronized void reloadFormulas() throws ScriptException {
        compiled.clear();
        // Tạo ScriptEngine MỚI mỗi lần reload
        ScriptEngine engine = new ScriptEngineManager().getEngineByName("nashorn");
        if (engine == null) {
            throw new IllegalStateException("Nashorn ScriptEngine not available");
        }
        for (Formula f : repo.findAllActive()) {
            Compilable c = (Compilable) engine;
            CompiledScript cs = c.compile(f.getScriptBody());
            compiled.put(f.getId(), cs);
        }
        // engine ra khỏi scope ở đây — nhưng class do engine tạo/nạp đã được unload chưa?
    }

    public double calculate(String formulaId, Bindings vars) throws ScriptException {
        CompiledScript cs = compiled.get(formulaId);
        if (cs == null) throw new IllegalArgumentException("Unknown formula: " + formulaId);
        return ((Number) cs.eval(vars)).doubleValue();
    }
}`
    }
  ],
  questions: [
    'Vì sao ứng dụng ném {{OutOfMemoryError: Metaspace}} trong khi heap chỉ ~520 MB? Giải thích Metaspace là gì, khác heap thế nào, và trích bằng chứng từ GC log/jcmd/metric.',
    'Nguyên nhân gốc khiến Metaspace tăng mãi và class không được unload là gì? Dẫn chứng classloader nào bị leak, bao nhiêu loader, và cơ chế GC unload classloader.',
    'Bạn sửa ngắn hạn và dài hạn thế nào (code + cấu hình + kiến trúc scripting)? Tại sao chỉ tăng {{MaxMetaspaceSize}} là sai? Cần alert/giám sát gì?'
  ],
  hints: [
    'Nhìn GC log: {{Metadata GC Threshold}}, {{Metaspace ... không giảm}} sau Pause Full/Last Ditch Collection, và {{MaxMetaspaceSize 192M}}. So sánh với heap sau GC (~396M) — vùng nhớ nào hết?',
    'Classloader chỉ được GC thu hồi khi không còn tham chiếu nào đến nó, các class nó nạp, và các instance của class đó. {{VM.classloader_stats}} có 284 loader {{NashornScriptEngine$3}}, mỗi cái 1 class. {{reloadFormulas()}} tạo {{ScriptEngine}} mới mỗi lần và {{compiled}} giữ {{CompiledScript}} — {{CompiledScript}} có giữ tham chiếu ngược tới engine/classloader không?',
    'Tính tương quan: {{formula_reload_events}} tăng 1→41, {{jvm_classes_loaded_classes}} tăng ~18420→36720 (~18300 class), unloaded luôn 0. Vì sao 284 loader NashornScriptEngine$3 chỉ chiếm ~116 MB Metaspace mà tổng tăng class lại tới ~18300? Nashorn đã bị removed khỏi JDK từ JDK 15 (JEP 372), vậy service đang chạy Nashorn bằng cách nào trên JDK 17?'
  ],
  answer: `**Tóm tắt:** {{OutOfMemoryError: Metaspace}} xảy ra vì service tạo {{ScriptEngine}} (Nashorn) **mới** mỗi lần reload công thức (~6 lần/giờ) nhưng {{CompiledScript}} được cache trong {{compiled}} giữ tham chiếu ngược tới cấu trúc của engine/classloader đã dùng để biên dịch. Kết quả: mỗi đợt reload sinh thêm classloader/script class mới, classloader cũ **không bao giờ đủ điều kiện** để GC unload → Metaspace tăng đều ({{unloaded_classes_total}} luôn 0) cho tới khi chạm {{MaxMetaspaceSize=192m}}. Heap vẫn còn trống (~520 MB) vì đây là lỗi vùng nhớ native Metaspace, không phải heap. Sửa gốc là quản lý vòng đời engine/compiled script đúng (tái sử dụng engine có kiểm soát, hoặc thay Nashorn bằng cơ chế scripting hiện đại), và loại bỏ tham chiếu giữ classloader.

### 1) Metaspace là gì, vì sao khác heap

- **Heap:** chứa *đối tượng* (instance) tạo bởi {{new}} (ví dụ {{String}}, {{HashMap}}, {{byte[]}}). GC heap (G1) thu gom object không còn tham chiếu.
- **Metaspace:** chứa *metadata của class* (cấu trúc class, method bytecode, constant pool, annotation metadata...). Đây là native memory. Mỗi lần JVM nạp một class (qua classloader), metadata được cấp phát vào Metaspace.
- **Giải phóng Metaspace:** chỉ xảy ra khi **toàn bộ classloader** nạp các class đó không còn reachable (không còn tham chiếu từ GC root, không còn instance sống của class do nó nạp, không còn class object được giữ). Lúc đó GC mới *unload* classloader và trả Metaspace. Nếu còn một tham chiếu sót, Metaspace không giảm — giống "rò rỉ" nhưng ở vùng metadata.
- **MaxMetaspaceSize:** trần cứng. Khi đạt trần và GC không unload được gì, JVM ném {{OutOfMemoryError: Metaspace}}. Đây là cơ chế bảo vệ để process không ăn hết RAM của máy/container.

### 2) Dẫn chứng từ artifact

**GC log cho thấy Metaspace đầy, heap không đầy:**
- GC(398) lúc 15:10: {{Metaspace: 178602K(180224K)...}} — đã dùng ~174 MB / committed ~176 MB, rất sát trần; heap sau GC chỉ {{214M(1536M)}}.
- GC(421) cause {{Metadata GC Threshold}}: JVM cố GC vì áp lực metadata.
- GC(423) {{Pause Full (Metadata GC Threshold)}} 1188 ms, GC(424) {{Metadata GC Clear Soft References}} 1241 ms, GC(425) {{Last Ditch Collection}} 1310 ms — ba lần Full GC liên tiếp nhưng {{Metaspace}} **không giảm** ({{196410K...->196410K}}, rồi {{196582K}}). Heap sau Full GC chỉ ~396M. Đây là dấu hiệu kinh điển: GC đã cố hết sức (kể cả clear soft refs) nhưng **không có classloader nào unload được**.
- Log lỗi: {{OutOfMemoryError: Metaspace}} tại {{ClassLoader.defineClass1 (Native Method)}} → {{ScriptLoader.installClass}} → {{nashorn...Compiler.compile}} → {{PremiumFormulaService.reloadFormulas:57}}. Stack trace chỉ thẳng vào việc **nạp/định nghĩa class mới** khi compile script Nashorn.

**jcmd VM.metaspace lúc 15:10 (trước OOM):**
- {{Total Usage - 321 loaders, 14822 classes}}; {{174.42 MB (98%) used}}; {{MaxMetaspaceSize: 192.00 MB}}. Chỉ còn ~18 MB trước trần.
- {{Non-Class}} chiếm phần lớn (151.77 MB) — phù hợp với bytecode/metadata của các class script được sinh ra.

**jcmd VM.classloader_stats:**
- Có **284 loader** kiểu {{jdk.nashorn.api.scripting.NashornScriptEngine$3}}, mỗi loader chỉ nạp {{1 class}}, tổng {{ChunkSz ~116,736,000 bytes}}. Rất nhiều classloader nhỏ, mỗi cái giữ một phần Metaspace — mẫu hình điển hình của leak do tạo loader/script class lặp lại.

**Metric tương quan:**
- {{jvm_classes_loaded_classes}} tăng 18420 → 36720 (+18300) trong khi {{jvm_classes_unloaded_classes_total}} luôn **0**. {{formula_reload_events}} tăng tới 41. Mỗi lần reload compile 42 công thức active (log {{active=42}}) và tạo engine/compiled artifacts mới → sinh thêm nhiều class; không unload đồng nghĩa classloader cũ bị giữ sống.
- Heap ổn định/vừa phải (~312–520 MB), không tăng kiểu leak heap. Vì vậy {{jmap -histo}} (nhìn heap object) không thấy "class ứng dụng tăng bất thường" — nguyên nhân nằm ở Metaspace/classloader, không phải instance trên heap.

**Lưu ý về số class và số loader:** 284 loader chỉ là **một phần** Metaspace (khoảng 116 MB). Tổng số class tăng thêm 18,300 gồm cả class script Nashorn sinh ra **và** các class phụ trợ khác (lambda, accessor, class do JIT/reflection tạo) — không phải mọi class tăng thêm đều thuộc 284 loader đếm được bằng {{grep NashornScriptEngine}}. Điều quan trọng là **hầu hết** class tăng thêm đến từ hoạt động compile script lặp lại, đúng với stack trace {{ScriptLoader.installClass}}.

### 3) Nguyên nhân gốc (cơ chế)

Trong {{reloadFormulas()}}:
~~~java
compiled.clear();
ScriptEngine engine = new ScriptEngineManager().getEngineByName("nashorn"); // engine MỚI mỗi lần
for (Formula f : repo.findAllActive()) {
    Compilable c = (Compilable) engine;
    CompiledScript cs = c.compile(f.getScriptBody()); // Nashorn compile -> sinh class bytecode, nạp qua loader
    compiled.put(f.getId(), cs); // cache giữ CompiledScript
}
~~~

- Nashorn khi compile script thường sinh các class Java (bytecode) để thực thi nhanh. Các class này được nạp bởi classloader gắn với engine/context.
- {{compiled}} là {{ConcurrentHashMap}} field của {{@Service}} singleton → sống suốt vòng đời ứng dụng (GC root qua Spring context). {{compiled.clear()}} chỉ bỏ entry khỏi map; nhưng **các {{CompiledScript}}/object liên quan** có thể vẫn bị giữ bởi tham chiếu khác, hoặc quan trọng hơn: chuỗi tham chiếu từ {{CompiledScript}} → (engine/context nội bộ) → class/script loader → {{Class}} khiến loader cũ không thể bị unload. Ngoài ra, tạo engine mới mỗi lần nhưng không đóng/giải phóng theo cơ chế Nashorn (Nashorn có {{NashornScriptEngineFactory}} và cách quản lý context riêng; việc giữ {{CompiledScript}} gắn với runtime cũ là bẫy phổ biến).
- GC unload classloader chỉ khi **mọi đường tham chiếu** tới loader/class/instance đều biến mất. Chỉ cần một reference sót (cache static, map singleton, callback, thread local) là loader bị "neo" lại → Metaspace leak. Đây là lý do leak classloader khó thấy khi chỉ nhìn heap histogram instance thông thường.

> Bối cảnh kỹ thuật (để trả lời phỏng vấn đúng): Nashorn JavaScript engine từng đi kèm JDK 8–14, bị **deprecated từ JDK 11 (JEP 335)** và **bị loại bỏ khỏi JDK từ JDK 15 (JEP 372)**. Trên JDK 17, Nashorn không còn là engine mặc định của JDK; nếu service vẫn dùng {{engine name "nashorn"}} thì thường là do dependency/runtime image riêng mang Nashorn standalone. Điều này càng làm tăng rủi ro bảo trì và cần kế hoạch thay thế (ví dụ GraalJS). Khi nêu trong phỏng vấn, nên nêu đúng trạng thái theo JDK đang dùng, không bịa API.

### 4) Cách sửa

**Ngắn hạn (giảm rủi ro, mua thời gian):**
1. **Restart/rollout có kiểm soát** trước khi chạm trần (đã biết tốc độ tăng từ metric). Đây chỉ là biện pháp vận hành.
2. **Giảm tần suất reload** và chặn reload song song không cần thiết; log/audit mỗi lần reload.
3. **Tăng {{MaxMetaspaceSize}}** (ví dụ 256m/320m) *chỉ nếu* container còn đủ native memory headroom — và chỉ là **bơm phao**, vì leak vẫn tiếp tục (sẽ OOM muộn hơn). Không được coi là fix. Cần tính tổng: heap (1536m) + metaspace (tối đa mới) + code cache + thread stacks + native khác < memory limit container (3Gi).

**Dài hạn (sửa gốc):**

1. **Quản lý vòng đời engine/compiled script đúng cách:**
- Không tạo {{ScriptEngine}} mới bừa bãi mỗi lần reload nếu không cần. Nếu phải reload, đảm bảo **không giữ tham chiếu** tới {{CompiledScript}}/engine cũ (clear cache *và* đảm bảo không có nơi khác giữ). Với Nashorn, cần hiểu rõ lifecycle ({{NashornScriptEngine}} có thể cần được dùng theo pattern phù hợp; trong nhiều trường hợp nên dùng lại engine/factory có kiểm soát hoặc cô lập theo classloader và *thả* toàn bộ graph khi thay thế).
- Một hướng an toàn hơn: mỗi "thế hệ công thức" chạy trong một **ClassLoader cô lập** do bạn quản lý; khi reload, dựng generation mới, chuyển traffic sang generation mới (atomic swap), rồi *drop mọi reference* tới generation cũ để GC có thể unload. Đây là pattern giống plugin/reload an toàn (cần kiểm tra kỹ không còn thread local, cache static, logger giữ class).

~~~java
// Ý tưởng: swap nguyên tử thế hệ công thức, không giữ reference cũ
private final AtomicReference<FormulaBundle> bundle = new AtomicReference<>();

public synchronized void reloadFormulas() {
    FormulaBundle next = FormulaBundle.compileAll(repo.findAllActive()); // tạo thế hệ mới
    FormulaBundle prev = bundle.getAndSet(next); // swap nguyên tử
    // prev ra khỏi scope; KHÔNG lưu prev vào field/static/cache nào khác
    // để classloader/compiled artifacts của prev đủ điều kiện GC unload
}

public double calculate(String formulaId, Bindings vars) {
    return bundle.get().calculate(formulaId, vars);
}
~~~
(Đây là khung ý tưởng; implementation thực tế phải đảm bảo {{FormulaBundle}}/engine/classloader không bị tham chiếu bởi registry static của scripting engine.)

2. **Cân nhắc thay Nashorn:** vì Nashorn không còn trong JDK 17, hãy đánh giá chuyển sang **GraalJS** (GraalVM JavaScript, có chế độ chạy trên HotSpot tùy phiên bản/cấu hình — cần kiểm tra tương thích của dự án) hoặc các lựa chọn an toàn hơn (rule engine như Drools, MVEL, hoặc biểu thức hạn chế thay vì script tự do) nếu nghiệp vụ cho phép. Script engine "full power" cũng là rủi ro bảo mật (sandboxing khó).

3. **Giới hạn và xác thực script:** giới hạn thời gian chạy, bộ nhớ/CPU (nếu engine hỗ trợ), và không cho phép script tùy ý truy cập class nội bộ nguy hiểm.

### 5) Phòng ngừa và alert

- **Metric/alert:** theo dõi {{jvm_classes_loaded_classes}} và {{jvm_classes_unloaded_classes_total}} — nếu loaded tăng đều còn unloaded ~0 trong thời gian dài, cảnh báo leak classloader. Theo dõi metric {{jvm_memory_used_bytes}} (area nonheap, id Metaspace) / committed vs {{MaxMetaspaceSize}}; alert khi dùng > 75–80% hoặc có xu hướng tăng liên tục.
- **Log/GC:** bật {{-Xlog:class+load=info,class+unload=info}} (cẩn thận volume log) hoặc dùng JFR event {{jdk.ClassLoad}}, {{jdk.ClassUnload}} khi điều tra. Alert khi xuất hiện {{Metadata GC Threshold}} lặp lại hoặc Full GC do Metadata.
- **Kiểm thử:** test soak: thực hiện reload công thức hàng trăm/lần nghìn lần trong môi trường staging, quan sát {{classes unloaded}} > 0 và Metaspace ổn định sau warmup. Có thể chạy với {{-XX:MaxMetaspaceSize}} thấp hơn để phát hiện leak sớm.
- **Quy trình vận hành:** mọi tính năng "reload/plugin/script động" phải có thiết kế unload rõ ràng và review rò rỉ tham chiếu (static collection, thread local, JDBC driver, logger context).

> Senior tip: Khi thấy {{OutOfMemoryError: Metaspace}} nhưng heap còn trống, đừng vội tăng {{MaxMetaspaceSize}} — đó thường chỉ làm sự cố đến muộn hơn. Hãy hỏi: "có thứ gì đang **nạp class liên tục** không?" (script engine, dynamic proxy/CGLIB, Groovy/JSP compile, redeploy, serialization framework). Ba lệnh cứu cánh: {{jcmd <pid> VM.metaspace}} (Metaspace còn bao nhiêu, ngưỡng GC), {{jcmd <pid> VM.classloader_stats}} (loader nào nhiều bất thường), và metric {{classes loaded vs unloaded}}. Nếu {{unloaded}} gần như bằng 0 trong khi {{loaded}} tăng theo một hành động nghiệp vụ (reload, request đặc biệt), bạn gần như chắc chắn có classloader leak. Fix thật sự là **cắt đứt mọi tham chiếu** để classloader trở thành rác, chứ không phải cho Metaspace to hơn.`,
  rubric: [
    'Phân biệt đúng Heap vs Metaspace/native memory: OOM Metaspace xảy ra khi metadata class chạm MaxMetaspaceSize (192m) và GC không unload được; heap sau GC vẫn thấp (~396–520M). Trích GC log (Metadata GC Threshold, Full GC Metadata không giảm Metaspace) và/hoặc jcmd/metric.',
    'Chỉ ra cơ chế classloader leak: tạo ScriptEngine/compile lặp lại sinh class+loader mới; CompiledScript/cache hoặc tham chiếu ngược giữ classloader sống; classloader chỉ unload khi không còn reference. Dẫn chứng VM.classloader_stats (284 NashornScriptEngine$3 loader) và classes loaded tăng, unloaded=0.',
    'Tương quan số liệu: reload events ~41, active 42 công thức/lần, loaded +~18300, unloaded 0, Metaspace tiến dần tới trần — giải thích vì sao tăng MaxMetaspaceSize chỉ trì hoãn.',
    'Đề xuất sửa có chiều sâu: quản lý lifecycle (không leak reference, swap thế hệ công thức/an toàn unload) hoặc thay thế Nashorn (deprecated JDK 11, removed JDK 15 — nêu đúng bối cảnh JDK 17) bằng giải pháp phù hợp; kiểm soát an toàn script; test soak reload nhiều lần.',
    'Nêu giám sát/phòng ngừa: alert classes unloaded không tăng khi loaded tăng, Metaspace usage/threshold, Metadata GC Threshold/Full GC metadata, JFR/ClassLoad-Unload khi điều tra; quy trình review cho reload/plugin/script động.'
  ],
  tags: ['metaspace', 'classloader-leak', 'oom', 'nashorn', 'scriptengine', 'gc-log', 'jcmd', 'jdk17']
}
,
{
  id: 'lab-gc-011',
  category: 'gc',
  title: 'Young GC 20 lần/giây: tạo ObjectMapper mỗi request và nối chuỗi log',
  level: 'senior',
  scenario: `Dịch vụ REST thanh toán chạy Spring Boot 3 + JDK 17 trên container 4 vCPU / 4 GB heap. Sau khi traffic tăng, GC log cho thấy Young GC liên tục ~20 lần/giây, CPU GC ~40%, p99 latency tăng từ 80 ms lên 600 ms. JFR allocation profiling chỉ ra hai hotspot: ObjectMapper được new cho mỗi request, và log message nối chuỗi lớn. Heap tổng ~1.2 GB, young gen ~300 MB, allocation rate ~6 GB/s. Không có Full GC, heap sau young GC về ~200 MB.`,
  artifacts: [
    { name: 'gc.log', lang: 'text', content: `[2024-05-10T10:14:01.120+0000][info][gc] GC(1240) Pause Young (G1 Evacuation) 289M->212M(1024M) 4.2ms
[2024-05-10T10:14:01.170+0000][info][gc] GC(1241) Pause Young (G1 Evacuation) 291M->214M(1024M) 4.0ms
[2024-05-10T10:14:01.220+0000][info][gc] GC(1242) Pause Young (G1 Evacuation) 290M->213M(1024M) 4.1ms
[2024-05-10T10:14:01.270+0000][info][gc] GC(1243) Pause Young (G1 Evacuation) 292M->215M(1024M) 4.3ms
[2024-05-10T10:14:02.000+0000][info][gc,heap] GC(1260) Eden: 290M(300M)->0M(300M) Survivors: 12M->14M Heap: 290M(1024M)->212M(1024M)` },
    { name: 'jfr-allocation.txt', lang: 'text', content: `jdk.ObjectAllocationInNewTLAB (allocation rate 5.9GB/s)
  com.fasterxml.jackson.databind.ObjectMapper.<init> (38%)
  com.example.payment.PaymentService.handle (22%)
  java.lang.StringBuilder.append (18%)
  org.slf4j.Logger.info (12%)
  com.example.payment.DtoMapper.toDto (10%)` }
  ],
  questions: ['Nguyên nhân gốc của Young GC quá thường xuyên là gì? Dẫn chứng từ GC log và JFR.', 'Bạn sẽ sửa thế nào, ngắn hạn và dài hạn, và đo lường hiệu quả ra sao?'],
  hints: ['Đọc GC log: tần suất 1 young GC mỗi 50 ms, Eden 300 MB đầy rất nhanh.', 'JFR chỉ ra ObjectMapper.<init> chiếm 38% allocation.', 'Nối chuỗi log lớn tạo StringBuilder/char[] tạm.'],
  answer: `**Tóm tắt:** Young GC 20 lần/giây vì allocation rate ~6 GB/s vượt xa tốc độ dọn; hai nguồn chính là ObjectMapper được new mỗi request (38% allocation) và log message nối chuỗi lớn. ObjectMapper thread-safe, tái sử dụng một instance; log dùng SLF4J parameterized message. Sau fix allocation rate giảm mạnh.

### 1) Cơ chế: vì sao Young GC thường xuyên

GC generational chia heap thành young và old. Object mới được cấp trong Eden. Khi Eden đầy, JVM kích hoạt Young GC. Chi phí nhỏ (~4 ms) nhưng 20 lần/giây tổng CPU ~80 ms/s gây pause liên tục.

### 2) Dẫn chứng JFR

JFR ObjectAllocationInNewTLAB: ObjectMapper.<init> 38%. ObjectMapper nặng (cache introspection). Tạo mỗi request là anti-pattern. StringBuilder.append 18%, Logger.info 12%.

### 3) Cách sửa

Ngắn hạn: dùng ObjectMapper singleton static final; thay log nối chuỗi bằng placeholder SLF4J; giảm log DEBUG production.
Dài hạn: Jackson Afterburner; tăng young gen -Xmn; theo dõi allocation rate bằng JFR.

### 4) Đo lường

Chạy lại với -Xlog:gc và so sánh young GC frequency, CPU GC %, p99.

### 5) Pitfall

ObjectMapper.configure sau khi share ảnh hưởng mọi thread. Tăng heap không giải quyết gốc rễ.

> Senior tip: Khi thấy Young GC thường xuyên nhưng không Full GC, đừng tăng heap vội — hãy mở JFR Allocation profiling. 80% trường hợp là tạo object không cần thiết.`,
  rubric: [
    'Nhận diện allocation rate cao từ GC log: young GC ~20/s, Eden 300 MB đầy mỗi ~50 ms.',
    'Chỉ ra JFR hotspot: ObjectMapper.<init> 38%, StringBuilder.append 18%, Logger.info 12%.',
    'Giải thích ObjectMapper thread-safe và không nên tạo mỗi request.',
    'Đề xuất sửa ngắn hạn/dài hạn và đo lường.',
    'Pitfall: configure sau share, tăng heap không giải quyết gốc rễ.'
  ],
  tags: ['gc', 'young-gc', 'allocation-rate', 'jfr', 'objectmapper', 'logging', 'g1']
}

,
{
  id: 'lab-gc-012',
  category: 'gc',
  title: 'OutOfMemoryError: Cannot reserve direct buffer memory (Netty/NIO)',
  level: 'senior',
  scenario: `Dịch vụ gateway dùng Netty 4 + Reactor Netty trên JDK 17, container limit 2 GB (cgroup). Sau vài giờ chạy, ứng dụng ném OutOfMemoryError: Cannot reserve direct buffer memory rồi container bị OOMKilled bởi kubelet. jcmd VM.native_memory cho thấy Direct (reserved/committed) ~1.8 GB, trong khi -XX:MaxDirectMemorySize=1g. Heap chỉ ~600 MB. Có bằng chứng Netty không release ByteBuf (reference count leak) trong handler custom.`,
  artifacts: [
    { name: 'error.log', lang: 'text', content: `java.lang.OutOfMemoryError: Cannot reserve direct buffer memory
    at sun.nio.ch.DirectBuffer.<init>(DirectBuffer.java:...)
    at java.nio.DirectByteBuffer.<init>(DirectByteBuffer.java:...)
    at java.nio.ByteBuffer.allocateDirect(ByteBuffer.java:...)
    at io.netty.buffer.PoolThreadCache.allocateNormal(PoolThreadCache.java:...)
    at io.netty.buffer.PooledByteBufAllocator.newDirectBuffer(PooledByteBufAllocator.java:...)
    at io.netty.channel.nio.AbstractNioByteChannel$NioByteUnsafe.read(AbstractNioByteChannel.java:...)` },
    { name: 'nmt.txt', lang: 'text', content: `Native Memory Tracking:
Total: reserved=2147483648, committed=2013265920
- Java Heap: reserved=1073741824, committed=629145600
- Class: reserved=268435456, committed=134217728
- Thread: reserved=67108864, committed=33554432
- Code: reserved=268435456, committed=134217728
- GC: reserved=268435456, committed=134217728
- Compiler: reserved=134217728, committed=67108864
- Internal: reserved=134217728, committed=67108864
- Symbol: reserved=16777216, committed=8388608
- Native Memory Tracking: reserved=67108864, committed=33554432
- Arena Chunk: reserved=33554432, committed=16777216
- Direct: reserved=1932735283, committed=1932735283
- Other: reserved=67108864, committed=33554432` },
    { name: 'jcmd-vmflags.txt', lang: 'text', content: `-XX:MaxDirectMemorySize=1073741824
-XX:NativeMemoryTracking=summary
-Xmx1g
-Xms1g
-XX:+UseG1GC
-XX:MaxGCPauseMillis=200
-XX:+UseStringDeduplication
-XX:MaxMetaspaceSize=268435456
-XX:+HeapDumpOnOutOfMemoryError
-XX:HeapDumpPath=/tmp/heap.hprof` }
  ],
  questions: ['Nguyên nhân gốc của OOM direct buffer là gì? Dẫn chứng từ error log, NMT, flags.', 'Bạn sẽ sửa thế nào ngắn hạn/dài hạn và phòng ngừa?'],
  hints: ['Direct memory không thuộc heap; NMT cho thấy Direct committed ~1.8 GB > MaxDirectMemorySize 1 GB.', 'Netty dùng reference counting; nếu không release ByteBuf sẽ leak direct memory.', 'Container bị OOMKilled vì tổng native memory vượt cgroup limit.'],
  answer: `**Tóm tắt:** OOM "Cannot reserve direct buffer memory" xảy ra khi direct (off-heap) memory vượt -XX:MaxDirectMemorySize (1 GB), do Netty ByteBuf leak (reference count không release). Direct memory không nằm trong heap nên -Xmx không giúp. NMT cho thấy Direct committed ~1.8 GB > 1 GB. Fix: release ByteBuf đúng cách, giới hạn direct memory theo container, theo dõi NMT.

### 1) Cơ chế: direct memory và Netty

ByteBuffer.allocateDirect cấp bộ nhớ native (off-heap) ngoài heap JVM. -XX:MaxDirectMemorySize giới hạn tổng direct memory. Khi vượt, JVM ném OOM.

Netty quản lý ByteBuf với reference counting: mỗi ByteBuf có refCnt; khi xử lý xong phải release().

### 2) Dẫn chứng

error.log: stack trace qua Netty PooledByteBufAllocator. nmt.txt: Direct committed ~1.93 GB > MaxDirectMemorySize 1 GB. Heap chỉ 600 MB. Container 2 GB limit.

### 3) Nguyên nhân gốc

Custom handler đọc ByteBuf nhưng không release trong finally; exception path cũng leak.

### 4) Cách sửa

Ngắn hạn: release ByteBuf trong finally; dùng SimpleChannelInboundHandler; bật leak detector PARANOID; giảm MaxDirectMemorySize.
Dài hạn: audit handler, codec, filter; theo dõi NMT periodic alert.

### 5) Pitfall

Tăng -Xmx không giúp direct memory. Netty pooled allocator cache có thể giữ memory.

> Senior tip: Khi gặp OOM "Cannot reserve direct buffer memory", đừng tăng heap — chạy jcmd VM.native_memory summary và so Direct committed với MaxDirectMemorySize.`,
  rubric: [
    'Phân biệt direct memory vs heap; NMT Direct committed ~1.93 GB > MaxDirectMemorySize 1 GB; heap chỉ 600 MB.',
    'Chỉ ra Netty reference counting: ByteBuf chưa release leak direct memory.',
    'Liên hệ container OOMKilled: tổng native memory vượt cgroup limit 2 GB.',
    'Đề xuất sửa: release trong finally, SimpleChannelInboundHandler, leak detector, giới hạn direct memory.',
    'Phòng ngừa: NMT periodic alert, đặt container limit = Xmx + MaxDirect + margin.'
  ],
  tags: ['gc', 'oom', 'direct-memory', 'netty', 'nio', 'nmt', 'container', 'off-heap']
},
{
  id: 'lab-gc-013',
  category: 'gc',
  title: 'Import hóa đơn PDF: humongous allocation trên G1 gây To-space exhausted và Full GC',
  level: 'senior',
  scenario: `**Bối cảnh:** Ngân hàng **SunPay** có service **invoice-import** (Spring Boot 3.2, JDK 17.0.10) cho phép khách hàng doanh nghiệp tải lên hóa đơn PDF để đối soát. Pod Kubernetes 4 vCPU, memory limit 5Gi. JVM chạy với {{-Xms4g -Xmx4g -XX:+UseG1GC -Xlog:gc*:file=/logs/gc.log:time,uptime,level,tags}}. Theo thiết kế, mỗi file tối đa 20 MB và tối đa 6 request import chạy đồng thời mỗi pod. Service này dùng thư viện parse PDF nội bộ, nhận dữ liệu dạng {{byte[]}}.

**Triệu chứng:** Ngày **10/11/2026**, lúc **14:05**, đối tác kế toán gửi đợt nhập 18 hóa đơn, trong đó có 4 file khoảng **8–9 MB** (PDF scan nhiều trang). Từ **14:06:10** đến **14:07:40**, p99 của {{POST /api/invoices/import}} tăng từ 350 ms lên hơn 9 giây, dashboard GC ghi nhận **3 lần Pause Full (G1 Compaction Pause)**, mỗi lần khoảng 1.6–1.9 giây. CPU của container chỉ khoảng 1.4/4 core. Không có {{OutOfMemoryError}}, pod không bị OOMKilled. Sau 14:08, khi đợt upload kết thúc, latency và heap quay về bình thường.

**Dữ liệu thu thập:** GC log JDK 17 (-Xlog:gc*), log ứng dụng của pod và đoạn code xử lý upload.`,
  artifacts: [
    {
      name: 'gc-invoice-import.log',
      lang: 'text',
      content: `[2026-11-10T12:00:00.014+0700][0.014s][info][gc,init] Version: 17.0.10+7 (release)
[2026-11-10T12:00:00.014+0700][0.014s][info][gc,init] CPUs: 4 total, 4 available
[2026-11-10T12:00:00.014+0700][0.014s][info][gc,init] Memory: 5120M
[2026-11-10T12:00:00.014+0700][0.014s][info][gc,init] Heap Region Size: 2M
[2026-11-10T12:00:00.014+0700][0.014s][info][gc,init] Heap Min Capacity: 4G
[2026-11-10T12:00:00.014+0700][0.014s][info][gc,init] Heap Initial Capacity: 4G
[2026-11-10T12:00:00.014+0700][0.014s][info][gc,init] Heap Max Capacity: 4G
[2026-11-10T12:00:00.014+0700][0.014s][info][gc,init] Parallel Workers: 4
[2026-11-10T12:00:00.014+0700][0.014s][info][gc,init] Concurrent Workers: 1
[2026-11-10T12:00:00.014+0700][0.014s][info][gc,init] Concurrent Refinement Workers: 4
... (young GC đều đặn, đã lược bớt) ...
[2026-11-10T14:05:41.208+0700][7541.208s][info][gc] GC(602) Pause Young (Normal) (G1 Evacuation Pause) 1488M->186M(4096M) 12.441ms
[2026-11-10T14:06:02.517+0700][7562.517s][info][gc] GC(603) Pause Young (Normal) (G1 Evacuation Pause) 1510M->214M(4096M) 13.902ms
[2026-11-10T14:06:12.901+0700][7572.901s][info][gc,start] GC(604) Pause Young (Concurrent Start) (G1 Humongous Allocation)
[2026-11-10T14:06:12.901+0700][7572.901s][info][gc,task] GC(604) Using 4 workers of 4 for evacuation
[2026-11-10T14:06:12.946+0700][7572.946s][info][gc,phases] GC(604)   Evacuate Collection Set: 41.8ms
[2026-11-10T14:06:12.946+0700][7572.946s][info][gc,heap] GC(604) Eden regions: 310->0(420)
[2026-11-10T14:06:12.946+0700][7572.946s][info][gc,heap] GC(604) Survivor regions: 18->14(41)
[2026-11-10T14:06:12.946+0700][7572.946s][info][gc,heap] GC(604) Old regions: 96->118
[2026-11-10T14:06:12.946+0700][7572.946s][info][gc,heap] GC(604) Humongous regions: 612->612
[2026-11-10T14:06:12.946+0700][7572.946s][info][gc] GC(604) Pause Young (Concurrent Start) (G1 Humongous Allocation) 2072M->1488M(4096M) 45.113ms
[2026-11-10T14:06:12.946+0700][7572.946s][info][gc] GC(605) Concurrent Mark Cycle
[2026-11-10T14:06:13.882+0700][7573.882s][info][gc,marking] GC(605) Concurrent Mark (7572.946s, 7573.882s) 936.104ms
[2026-11-10T14:06:13.891+0700][7573.891s][info][gc] GC(605) Pause Remark 2420M->2418M(4096M) 6.204ms
[2026-11-10T14:06:13.901+0700][7573.901s][info][gc] GC(605) Concurrent Mark Cycle 955.211ms
[2026-11-10T14:06:16.104+0700][7576.104s][info][gc] GC(606) Pause Young (Normal) (G1 Humongous Allocation) 2684M->2096M(4096M) 52.337ms
[2026-11-10T14:06:19.512+0700][7579.512s][info][gc] GC(607) Pause Young (Normal) (G1 Humongous Allocation) 3012M->2540M(4096M) 61.884ms
[2026-11-10T14:06:23.044+0700][7583.044s][info][gc] GC(608) Pause Young (Normal) (G1 Humongous Allocation) 3368M->2988M(4096M) 74.220ms
[2026-11-10T14:06:27.118+0700][7587.118s][info][gc,start] GC(609) Pause Young (Normal) (G1 Evacuation Pause)
[2026-11-10T14:06:27.118+0700][7587.118s][info][gc,task] GC(609) Using 4 workers of 4 for evacuation
[2026-11-10T14:06:27.411+0700][7587.411s][info][gc] GC(609) To-space exhausted
[2026-11-10T14:06:27.411+0700][7587.411s][info][gc,phases] GC(609)   Evacuate Collection Set: 132.6ms
[2026-11-10T14:06:27.411+0700][7587.411s][info][gc,phases] GC(609)   Post Evacuate Collection Set: 159.7ms
[2026-11-10T14:06:27.411+0700][7587.411s][info][gc,heap] GC(609) Eden regions: 102->0(6)
[2026-11-10T14:06:27.411+0700][7587.411s][info][gc,heap] GC(609) Survivor regions: 13->0(15)
[2026-11-10T14:06:27.411+0700][7587.411s][info][gc,heap] GC(609) Old regions: 412->522
[2026-11-10T14:06:27.411+0700][7587.411s][info][gc,heap] GC(609) Humongous regions: 1502->1502
[2026-11-10T14:06:27.411+0700][7587.411s][info][gc] GC(609) Pause Young (Normal) (G1 Evacuation Pause) 4058M->4048M(4096M) 293.004ms
[2026-11-10T14:06:27.412+0700][7587.412s][info][gc,start] GC(610) Pause Full (G1 Compaction Pause)
[2026-11-10T14:06:27.412+0700][7587.412s][info][gc,task] GC(610) Using 4 workers of 4 for full compaction
[2026-11-10T14:06:27.781+0700][7587.781s][info][gc,phases] GC(610) Phase 1: Mark live objects 369.112ms
[2026-11-10T14:06:27.863+0700][7587.863s][info][gc,phases] GC(610) Phase 2: Prepare for compaction 81.664ms
[2026-11-10T14:06:28.031+0700][7588.031s][info][gc,phases] GC(610) Phase 3: Adjust pointers 168.220ms
[2026-11-10T14:06:29.102+0700][7589.102s][info][gc,phases] GC(610) Phase 4: Compact heap 1071.004ms
[2026-11-10T14:06:29.110+0700][7589.110s][info][gc,heap] GC(610) Eden regions: 0->0(96)
[2026-11-10T14:06:29.110+0700][7589.110s][info][gc,heap] GC(610) Survivor regions: 0->0(13)
[2026-11-10T14:06:29.110+0700][7589.110s][info][gc,heap] GC(610) Old regions: 522->141
[2026-11-10T14:06:29.110+0700][7589.110s][info][gc,heap] GC(610) Humongous regions: 1502->1502
[2026-11-10T14:06:29.110+0700][7589.110s][info][gc] GC(610) Pause Full (G1 Compaction Pause) 4048M->3286M(4096M) 1698.221ms
[2026-11-10T14:06:33.820+0700][7593.820s][info][gc] GC(611) Pause Young (Normal) (G1 Humongous Allocation) 3820M->3604M(4096M) 88.401ms
[2026-11-10T14:06:36.990+0700][7596.990s][info][gc] GC(612) To-space exhausted
[2026-11-10T14:06:36.990+0700][7596.990s][info][gc] GC(612) Pause Young (Normal) (G1 Evacuation Pause) 4066M->4058M(4096M) 304.118ms
[2026-11-10T14:06:38.844+0700][7598.844s][info][gc] GC(613) Pause Full (G1 Compaction Pause) 4058M->3310M(4096M) 1842.600ms
[2026-11-10T14:06:55.402+0700][7615.402s][info][gc,start] GC(614) Pause Young (Normal) (G1 Evacuation Pause)
[2026-11-10T14:06:55.424+0700][7615.424s][info][gc,heap] GC(614) Eden regions: 296->0(610)
[2026-11-10T14:06:55.424+0700][7615.424s][info][gc,heap] GC(614) Survivor regions: 0->12(76)
[2026-11-10T14:06:55.424+0700][7615.424s][info][gc,heap] GC(614) Old regions: 148->156
[2026-11-10T14:06:55.424+0700][7615.424s][info][gc,heap] GC(614) Humongous regions: 1188->18
[2026-11-10T14:06:55.424+0700][7615.424s][info][gc] GC(614) Pause Young (Normal) (G1 Evacuation Pause) 3264M->372M(4096M) 21.776ms
... (một chu kỳ tương tự lặp lại, tổng cộng 3 lần Pause Full trong 14:06-14:07) ...
[2026-11-10T14:08:31.118+0700][7711.118s][info][gc] GC(632) Pause Young (Normal) (G1 Evacuation Pause) 1504M->198M(4096M) 13.100ms`
    },
    {
      name: 'app-2026-11-10.log',
      lang: 'text',
      content: `2026-11-10T14:05:58.114+07:00  INFO 1 --- [nio-8080-exec-3] v.s.invoice.InvoiceImportController  : import request invoiceId=INV-778201 merchant=M-ACME size=8912896 bytes
2026-11-10T14:05:58.117+07:00  INFO 1 --- [nio-8080-exec-7] v.s.invoice.InvoiceImportController  : import request invoiceId=INV-778202 merchant=M-ACME size=8650752 bytes
2026-11-10T14:05:58.121+07:00  INFO 1 --- [nio-8080-exec-2] v.s.invoice.InvoiceImportController  : import request invoiceId=INV-778203 merchant=M-ACME size=8388608 bytes
2026-11-10T14:05:58.125+07:00  INFO 1 --- [nio-8080-exec-5] v.s.invoice.InvoiceImportController  : import request invoiceId=INV-778204 merchant=M-ACME size=8126464 bytes
2026-11-10T14:06:02.602+07:00  INFO 1 --- [nio-8080-exec-1] v.s.invoice.InvoiceImportController  : import request invoiceId=INV-778205 merchant=M-ACME size=524288 bytes
2026-11-10T14:06:13.944+07:00  WARN 1 --- [nio-8080-exec-11] v.s.invoice.InvoiceImportController : slow import invoiceId=INV-778205 took=11342ms
2026-11-10T14:06:29.118+07:00  INFO 1 --- [nio-8080-exec-3] v.s.invoice.InvoiceImportController  : import done invoiceId=INV-778201 took=31004ms
2026-11-10T14:06:29.221+07:00  INFO 1 --- [nio-8080-exec-7] v.s.invoice.InvoiceImportController  : import done invoiceId=INV-778202 took=31104ms
2026-11-10T14:06:38.860+07:00  INFO 1 --- [nio-8080-exec-2] v.s.invoice.InvoiceImportController  : import done invoiceId=INV-778203 took=40739ms
2026-11-10T14:06:39.010+07:00  INFO 1 --- [nio-8080-exec-5] v.s.invoice.InvoiceImportController  : import done invoiceId=INV-778204 took=40885ms
2026-11-10T14:06:55.430+07:00  INFO 1 --- [nio-8080-exec-9] v.s.invoice.InvoiceImportController  : import request invoiceId=INV-778206 merchant=M-ACME size=1835008 bytes
2026-11-10T14:06:56.102+07:00  INFO 1 --- [nio-8080-exec-9] v.s.invoice.InvoiceImportController  : import done invoiceId=INV-778206 took=672ms`
    },
    {
      name: 'InvoiceImportController.java',
      lang: 'text',
      content: `package vn.sunpay.invoice.controller;

import java.io.IOException;
import java.io.InputStream;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import vn.sunpay.invoice.InvoiceParser;
import vn.sunpay.invoice.InvoiceRecord;

@RestController
@RequestMapping("/api/invoices")
public class InvoiceImportController {

    private final InvoiceParser parser;

    public InvoiceImportController(InvoiceParser parser) {
        this.parser = parser;
    }

    @PostMapping(value = "/import", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ImportResult> importInvoice(@RequestParam("file") MultipartFile file)
            throws IOException {
        // Đọc toàn bộ nội dung upload vào một mảng byte trong heap
        byte[] bytes;
        try (InputStream in = file.getInputStream()) {
            bytes = in.readAllBytes();     // Java 17: tạo byte[] mới, có thể copy/grow bên trong
        }
        InvoiceRecord record = parser.parse(bytes);   // thư viện parse nhận byte[]
        return ResponseEntity.ok(new ImportResult(record.id(), bytes.length));
    }
}`
    }
  ],
  questions: [
    'Tại sao GC log lại có cause "G1 Humongous Allocation", rồi "To-space exhausted" và cuối cùng là Pause Full (G1 Compaction Pause)? Trích dòng cụ thể và giải thích theo cơ chế humongous của G1.',
    'Vì sao Full GC không giảm được Humongous regions, nhưng GC(614) lại giảm mạnh Humongous regions từ 1188 xuống 18 và heap về 372M? Đây có phải memory leak không?',
    'Bạn sẽ sửa thế nào ngay và về lâu dài? Việc tăng G1HeapRegionSize có vai trò gì và cần cân nhắc điều gì?'
  ],
  hints: [
    'Nhìn dòng "Heap Region Size: 2M". Trong G1, object có kích thước từ một nửa region trở lên được coi là humongous và nằm trên các region liên tiếp trong old gen. Một byte[] 8.5 MB cần bao nhiêu region?',
    'So sánh Humongous regions ở GC(609), GC(610) (Full GC) và GC(614). Object humongous chỉ được giải phóng khi không còn tham chiếu; humongous đã chết (mọi object bên trong không còn tham chiếu) có thể được eagerly thu hồi ở young GC.',
    'readAllBytes() và thư viện parse đều giữ dữ liệu trong heap. 4 file 8–9 MB đồng thời cộng thêm bản sao bên trong parser có thể chiếm hàng nghìn region.'
  ],
  answer: `**Tóm tắt:** Service đọc toàn bộ file PDF upload vào heap bằng {{InputStream.readAllBytes()}}, rồi truyền {{byte[]}} cho parser. Với 4 file 7.7–8.5 MB chạy song song, mỗi request giữ một hoặc vài mảng byte rất lớn cùng lúc. Heap region của G1 là 2 MB nên mảng từ 1 MB trở lên là **humongous object**: phải cấp phát trên nhiều region **liên tiếp** trong old gen. Khi nhiều humongous còn sống, heap bị chiếm chỗ và phân mảnh, G1 không còn region trống để evacuate nên xảy ra {{To-space exhausted}} và phải chạy {{Pause Full (G1 Compaction Pause)}}. Khi request xử lý xong, humongous hết tham chiếu và được thu hồi nhanh ở GC(614), nên đây không phải memory leak.

### Cơ chế: humongous allocation trên G1

- **Humongous object là gì?** G1 (Garbage-First, bộ thu gom rác mặc định từ JDK 9) chia heap thành các region bằng nhau. Dòng {{Heap Region Size: 2M}} cho biết heap 4 GB có 2048 region. Object có kích thước >= 50% kích thước region (ở đây >= 1 MB) được xếp là humongous. Một {{byte[]}} 8.5 MB cần 5 region liên tiếp (làm tròn lên). Một {{byte[]}} 7.7 MB cần 4 region.
- **Cấp phát ở đâu?** Humongous object không cấp phát trong Eden như object thường, mà cấp phát thẳng vào old gen trên chuỗi region humongous liên tiếp. Vì phải liên tiếp, heap có thể còn trống tổng cộng nhưng vẫn không tìm được dãy region liền kề đủ dài.
- **Vì sao log ghi G1 Humongous Allocation?** Mỗi lần cấp phát humongous, G1 kiểm tra ngưỡng IHOP (Initiating Heap Occupancy Percent) để xem có nên bắt đầu chu kỳ concurrent mark hay không. Vì vậy pause có cause {{G1 Humongous Allocation}} và có thể kèm {{Concurrent Start}} như ở GC(604).
- **Thu hồi thế nào?** Humongous region khi **tất cả object bên trong đã chết** (ví dụ mảng {{byte[]}} lớn không còn được tham chiếu) **có thể được eagerly reclaimed** ngay trong một young GC. Ngược lại, nếu humongous còn sống, young/mixed/concurrent cycle bình thường không di chuyển được nó. Full GC của G1 trên JDK 17 cũng **không di chuyển** humongous region, nên không giải quyết được việc humongous còn sống và không chữa được phân mảnh do humongous chiếm chỗ.

### Dẫn chứng (trích từ artifact)

- GC init: {{Heap Region Size: 2M}}, {{Heap Max Capacity: 4G}} (gc-invoice-import.log). Nghĩa là ngưỡng humongous là 1 MB.
- Lúc bình thường: {{GC(603) Pause Young (Normal) (G1 Evacuation Pause) 1510M->214M(4096M) 12.441ms}} và các GC trước đó cho thấy heap sau GC chỉ ~186–214 MB, Eden/S0/S1 quay vòng ổn định.
- Bắt đầu có humongous: {{GC(604) Pause Young (Concurrent Start) (G1 Humongous Allocation) 2072M->1488M(4096M) 45.113ms}}. Dòng heap: {{Humongous regions: 612->612}}. 612 region * 2 MB = 1224 MB đang nằm trong các region humongous. Cause {{G1 Humongous Allocation}} cho thấy chính việc xin cấp phát object humongous đã kích hoạt pause.
- Humongous còn sống tăng dần khi nhiều request chạy song song: GC(606) còn 2096M sau GC, GC(607) 2540M, GC(608) 2988M, đều với cause {{G1 Humongous Allocation}}. Concurrent mark {{GC(605) Pause Remark 2420M->2418M(4096M)}} cho thấy sau khi mark xong, lượng region rỗng thu hồi được không đáng kể vì phần lớn heap là humongous còn sống.
- Cạn chỗ evacuate: {{GC(609) To-space exhausted}}, {{Eden regions: 102->0(6)}}, {{Survivor regions: 13->0(15)}}, {{Old regions: 412->522}}, {{Humongous regions: 1502->1502}}, pause {{4058M->4048M(4096M) 293.004ms}}. G1 cố gắng dọn Eden/Survivor nhưng không còn region trống để copy object sống sang (to-space). Các vùng evacuate thất bại bị chuyển thành old (412->522) nhưng heap gần như không giảm.
- Full GC: {{GC(610) Pause Full (G1 Compaction Pause) 4048M->3286M(4096M) 1698.221ms}}. Kết quả: {{Old regions: 522->141}} (compact old thường tốt), nhưng **{{Humongous regions: 1502->1502}}** không đổi. Đây là bằng chứng mạnh: các mảng humongous vẫn còn được tham chiếu (request import chưa xong), nên Full GC không thể trả region đó về free.
- Lặp lại: {{GC(612) To-space exhausted}} rồi {{GC(613) Pause Full (G1 Compaction Pause) 4058M->3310M(4096M) 1842.600ms}}, vẫn còn humongous lớn.
- Kết thúc đợt upload: {{GC(614) Pause Young (Normal) (G1 Evacuation Pause) 3264M->372M(4096M) 21.776ms}} với {{Humongous regions: 1188->18}}. Khi thread xử lý xong (log: {{import done invoiceId=INV-778201 took=31004ms}} quanh thời điểm Full GC), các {{byte[]}} không còn tham chiếu và G1 eagerly reclaim humongous region trong một young GC bình thường. Heap về 372M, gần mức nền 198M ở {{GC(632)}}.
- Ứng dụng: 4 request đồng thời {{size=8912896}}, {{8650752}}, {{8388608}}, {{8126464}} bytes (app-2026-11-10.log). Code đọc toàn bộ bằng {{bytes = in.readAllBytes();}} rồi truyền cho {{parser.parse(bytes)}} (InvoiceImportController.java). Mỗi request giữ ít nhất 1 mảng humongous lớn; parser có thể cấp phát thêm bản sao/buffer nội bộ, nên tổng humongous tăng lên ~1502 region (~3 GB) là hợp lý khi 4 request và các bản sao cùng sống.

### Nguyên nhân gốc

Nguyên nhân gốc là **humongous allocation bùng phát do giữ toàn bộ file lớn trong heap dưới dạng {{byte[]}}**, kết hợp với xử lý đồng thời nhiều file cỡ MB. Cụ thể: {{readAllBytes()}} tạo (và có thể grow/copy) mảng byte có kích thước bằng file; thư viện parse nhận {{byte[]}} nên dữ liệu không được stream. Mỗi mảng >= 1 MB trở thành humongous, chiếm region liên tiếp trong old gen, gây thiếu free region để evacuate (To-space exhausted) và buộc Full GC nặng nhưng vô ích với humongous còn sống. Đây **không phải memory leak**: heap sau GC không tăng nền theo thời gian, và ngay khi tải kết thúc GC(614) thu hồi humongous (1188->18) và heap về 372M.

### Cách sửa

**Ngắn hạn (giảm rủi ro ngay):**
- Giới hạn số request import chạy đồng thời mỗi pod (ví dụ Semaphore/bulkhead tối đa 1–2 request import nặng) và trả 429/503 khi vượt, để không tích lũy nhiều humongous cùng lúc.
- Giới hạn kích thước upload thực tế ở API gateway / reverse proxy và trong controller (từ chối file vượt ngưỡng an toàn), vì "tối đa 20 MB" trong thiết kế nhưng xử lý bằng {{byte[]}} trong heap 4 GB không an toàn khi có đồng thời.
- Nếu cần giảm số region mỗi humongous, có thể cân nhắc tăng {{-XX:G1HeapRegionSize}} (ví dụ lên 4M hoặc 8M) để một mảng 8–9 MB chiếm ít region hơn và giảm áp lực liên tiếp. Đây là **biện pháp giảm triệu chứng**, không giải quyết gốc rễ giữ toàn bộ file trong heap.
- Theo dõi GC log và metric, cảnh báo khi xuất hiện {{To-space exhausted}} hoặc {{Pause Full}} hoặc khi tần suất {{G1 Humongous Allocation}} tăng đột biến.

**Dài hạn (đúng kiến trúc):**
- **Streaming thay vì đọc hết vào {{byte[]}}:** nếu thư viện cho phép, truyền {{InputStream}} hoặc đọc theo chunk để parser xử lý dần; nếu không, ghi upload ra file tạm (disk) rồi để thư viện đọc từ file/stream, tránh giữ nhiều bản sao MB trong heap.
- Tách luồng xử lý nặng: nhận file -> lưu object storage (S3/MinIO) -> xử lý bất đồng bộ (queue/job). Pod API không giữ file lớn trong heap.
- Với thư viện bắt buộc nhận {{byte[]}}, cân nhắc giới hạn độ lớn file chặt, tăng region size phù hợp sau đo đạc, và cô lập workload import sang pool/pod riêng để không ảnh hưởng traffic nhẹ.
- Kiểm thử tải với kịch bản xấu nhất: N file lớn nhất cho phép đồng thời, quan sát Humongous regions, To-space exhausted và pause time trên GC log JDK 17.

**Cân nhắc khi tăng {{G1HeapRegionSize}}:**
- **Lợi ích:** tăng ngưỡng humongous (region 4M → ngưỡng 2 MB; region 8M → ngưỡng 4 MB), giảm số region một object cần và bớt yêu cầu chuỗi liên tiếp cho cùng object. Một số mảng 1–2 MB có thể không còn là humongous.
- **Nhược điểm:** số region trên heap giảm (ví dụ 4 GB với region 4M chỉ còn 1024 region, với region 8M chỉ còn 512 region), làm giảm độ nhạy cảm của các policy dựa trên số region như IHOP và selection của collection set; region lớn hơn làm lãng phí khi có nhiều object hơi lớn nhưng chưa tới ngưỡng mới; thay đổi hành vi phân vùng/GC cần benchmark. Giá trị phải là lũy thừa 2 trong khoảng cho phép (1M–32M), và heap phải là bội số của region size.
- **Kết luận:** tăng {{G1HeapRegionSize}} có thể giúp giảm tần suất sự cố trong trường hợp này, nhưng **không thay thế** việc bỏ {{readAllBytes()}}/streaming và giới hạn đồng thời.

### Phòng ngừa

- **Giám sát:** thu thập GC log {{-Xlog:gc*}} (hoặc JFR) tập trung; alert khi có {{Pause Full (G1 Compaction Pause)}}, khi log xuất hiện {{To-space exhausted}}, hoặc khi tỷ lệ thời gian GC tăng. Theo dõi {{jvm_gc_pause_seconds}} theo cause nếu exporter có nhãn.
- **Metric ứng dụng:** đếm/đo kích thước upload, số request import đang chạy, thời gian parse; từ chối sớm file quá lớn.
- **Thiết kế API:** ưu tiên streaming (InputStream/part streaming) cho payload lớn; không dùng {{byte[]}} cho dữ liệu kích thước không kiểm soát. Quy ước code review: cấm {{readAllBytes()}}/{{toByteArray()}} trên dữ liệu upload không có giới hạn chặt.
- **Kiểm chứng:** test với file ở biên kích thước và số lượng đồng thời; so sánh heap/GC trước và sau khi đổi sang streaming.
- **Runbook:** khi thấy Full GC + Humongous cao nhưng heap giảm mạnh sau khi tải hết (như GC(614)), nghĩ đến humongous sống tạm (burst) hơn là leak; vẫn phải sửa để tránh tái diễn.

> Senior tip: Khi G1 vào {{Pause Full}} nhưng {{Humongous regions}} gần như không đổi qua Full GC, hãy coi đó là dấu hiệu humongous object vẫn còn sống (đang bị tham chiếu), không phải "GC không dọn được rác" theo nghĩa leak vĩnh viễn. So sánh với một young GC sau khi request kết thúc: nếu humongous giảm mạnh và heap về đáy, nguyên nhân là burst allocation (như đọc file lớn vào {{byte[]}}). Cách chữa bền là stream/giới hạn kích thước và concurrency; tăng {{G1HeapRegionSize}} chỉ là đòn giảm đau, phải đo bằng GC log và latency thật.`,
  rubric: [
    'Nêu đúng cơ chế humongous của G1: region 2M nên object >= 1M là humongous, cấp phát trên region liên tiếp trong old gen, cause G1 Humongous Allocation.',
    'Trích dẫn được bằng chứng GC log: Humongous regions tăng (612 rồi 1502), To-space exhausted (GC 609/612), Pause Full ~1.7-1.8s nhưng Humongous regions 1502->1502, và GC(614) Humongous regions 1188->18, heap 3264M->372M.',
    'Kết luận không phải leak, giải thích humongous còn sống trong lúc request chạy và được eagerly reclaim sau khi hết tham chiếu; liên hệ readAllBytes()/byte[] và 4 file 8-9MB đồng thời.',
    'Đề xuất sửa ngắn hạn (giới hạn đồng thời/kích thước, theo dõi) và dài hạn (streaming/ghi file tạm/xử lý async, không giữ byte[] lớn trong heap).',
    'Giải thích đúng vai trò và hạn chế của tăng G1HeapRegionSize (giảm triệu chứng, cần đo, không thay thế streaming).'
  ],
  tags: ['g1', 'humongous', 'gc-log', 'to-space-exhausted', 'full-gc', 'byte-array', 'upload']
},
{
  id: 'lab-gc-014',
  category: 'gc',
  title: 'Old gen tăng dần 3 ngày: cache static không giới hạn giữ ProductDetail',
  level: 'senior',
  scenario: `**Bối cảnh:** Sàn thương mại điện tử **NovaMart** chạy service **product-catalog** (Spring Boot 3.2, JDK 17.0.10, {{-Xms2g -Xmx2g -XX:+UseG1GC}}) phục vụ API chi tiết sản phẩm cho web và mobile. Pod có 2 vCPU, memory limit 3Gi. Lưu lượng ổn định khoảng 120 req/s, tỉ lệ xem lại cùng sản phẩm trong phiên không cao (catalog > 2 triệu SKU, long-tail). Tuần này chưa deploy bản mới, pod chạy liên tục.

**Triệu chứng:** Trong 3 ngày (07/11 đến 10/11/2026), đồ thị heap cho thấy **Old Gen sau mỗi lần GC tăng dần**: đáy (heap used sau GC) đi lên từ ~220 MB lên ~1.6 GB, dù traffic không tăng. GC tần suất cao hơn, pause young GC dài hơn nhẹ (từ ~18 ms lên ~55 ms), CPU GC tăng nhưng chưa OOM và chưa có Full GC. Team nghi ngờ "GC không thu hồi hết" và đề xuất tăng heap, nhưng muốn tìm nguyên nhân gốc.

**Dữ liệu thu thập:** Ba lần {{jcmd 1 GC.class_histogram}} (mỗi ngày một lần), trích metric heap/GC theo ngày và đoạn code cache sản phẩm.`,
  artifacts: [
    {
      name: 'class_histogram_day1.txt',
      lang: 'text',
      content: `# 2026-11-07 10:00:00 +0700, uptime 26h, pod catalog-7d8f6c9b5-mk2p1
# jcmd 1 GC.class_histogram
 num     #instances         #bytes  class name (module)
-------------------------------------------------------
   1:        482114       67295960  [B (java.base@17.0.10)
   2:        812340       58488480  [C (java.base@17.0.10)
   3:        612004       14688096  java.lang.String (java.base@17.0.10)
   4:         82014        9185568  vn.novamart.catalog.ProductDetail
   5:        164028        5248896  java.util.HashMap$Node (java.base@17.0.10)
   6:        120114        3843648  java.util.ArrayList (java.base@17.0.10)
   7:         82014        2624448  java.util.HashMap (java.base@17.0.10)
   8:         90112        2162688  java.util.concurrent.ConcurrentHashMap$Node (java.base@17.0.10)
   9:         41007        1968336  [Ljava.util.HashMap$Node; (java.base@17.0.10)
  10:         22018        1761440  [Ljava.lang.Object; (java.base@17.0.10)
  11:         18022        1009232  java.lang.Class (java.base@17.0.10)
  12:          4096         524288  [I (java.base@17.0.10)
Total       2891024      186442112`
    },
    {
      name: 'class_histogram_day2.txt',
      lang: 'text',
      content: `# 2026-11-08 10:00:00 +0700, uptime 50h, pod catalog-7d8f6c9b5-mk2p1
# jcmd 1 GC.class_histogram
 num     #instances         #bytes  class name (module)
-------------------------------------------------------
   1:       1438206      200748840  [B (java.base@17.0.10)
   2:       2410022      173521584  [C (java.base@17.0.10)
   3:       1814012       43536288  java.lang.String (java.base@17.0.10)
   4:        242014       27105568  vn.novamart.catalog.ProductDetail
   5:        484028       15488896  java.util.HashMap$Node (java.base@17.0.10)
   6:        352114       11267648  java.util.ArrayList (java.base@17.0.10)
   7:        242014        7744448  java.util.HashMap (java.base@17.0.10)
   8:        250112        6002688  java.util.concurrent.ConcurrentHashMap$Node (java.base@17.0.10)
   9:        121007        5808336  [Ljava.util.HashMap$Node; (java.base@17.0.10)
  10:         42018        3361440  [Ljava.lang.Object; (java.base@17.0.10)
  11:         18024        1009344  java.lang.Class (java.base@17.0.10)
  12:          8192        1048576  [I (java.base@17.0.10)
Total       8421563      540761656`
    },
    {
      name: 'class_histogram_day3.txt',
      lang: 'text',
      content: `# 2026-11-09 10:00:00 +0700, uptime 74h, pod catalog-7d8f6c9b5-mk2p1
# jcmd 1 GC.class_histogram
 num     #instances         #bytes  class name (module)
-------------------------------------------------------
   1:       2396118      334656520  [B (java.base@17.0.10)
   2:       4012034      288866448  [C (java.base@17.0.10)
   3:       3016020       72384480  java.lang.String (java.base@17.0.10)
   4:        402014       45025568  vn.novamart.catalog.ProductDetail
   5:        804028       25728896  java.util.HashMap$Node (java.base@17.0.10)
   6:        586114       18755648  java.util.ArrayList (java.base@17.0.10)
   7:        402014       12864448  java.util.HashMap (java.base@17.0.10)
   8:        410112        9842688  java.util.concurrent.ConcurrentHashMap$Node (java.base@17.0.10)
   9:        201007        9648336  [Ljava.util.HashMap$Node; (java.base@17.0.10)
  10:         62018        4961440  [Ljava.lang.Object; (java.base@17.0.10)
  11:         18024        1009344  java.lang.Class (java.base@17.0.10)
  12:         12288        1572864  [I (java.base@17.0.10)
Total      14011781      896252680`
    },
    {
      name: 'heap-metrics-3days.txt',
      lang: 'text',
      content: `# Prometheus, pod catalog-7d8f6c9b5-mk2p1, mẫu 10:00 mỗi ngày
# old_gen_used_after_gc: ước lượng từ used heap ngay sau young/mixed GC gần nhất (MB)
# heap_used: jvm_memory_used_bytes{area="heap"} tại thời điểm mẫu (MB)
# young_gc_count_24h: số lần Pause Young trong 24h trước
# avg_young_pause_ms: trung bình pause young GC trong 24h

date        old_gen_used_after_gc  heap_used  young_gc_count_24h  avg_young_pause_ms  req_per_s
2026-11-07           220 MB           510 MB               1180                18 ms        118
2026-11-08           920 MB          1180 MB               1460                34 ms        121
2026-11-09          1600 MB          1820 MB               1890                55 ms        119

# Không có Pause Full (G1 Compaction Pause) trong 3 ngày.
# Không deploy mới, không thay đổi cấu hình JVM.`
    },
    {
      name: 'ProductService.java',
      lang: 'text',
      content: `package vn.novamart.catalog;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.stereotype.Service;

@Service
public class ProductService {

    // Cache "đơn giản" chia sẻ toàn JVM để giảm gọi DB
    private static final Map<String, ProductDetail> CACHE = new ConcurrentHashMap<>();

    private final ProductRepository repo;

    public ProductService(ProductRepository repo) {
        this.repo = repo;
    }

    public ProductDetail getById(String productId) {
        return CACHE.computeIfAbsent(productId, repo::findDetailById);
    }

    // Chưa có giới hạn kích thước, chưa có TTL/expire, chưa có eviction
}`
    }
  ],
  questions: [
    'Hãy dùng 3 lần GC.class_histogram và số liệu heap 3 ngày để chứng minh có memory leak và xác định đối tượng nào đang bị giữ lại.',
    'Vì sao Old Gen sau mỗi GC vẫn tăng dần dù GC có chạy? Chuỗi tham chiếu (GC root) giữ các ProductDetail là gì? Vì sao đây là điển hình của cache static không giới hạn?',
    'Bạn sẽ khắc phục ngắn hạn và dài hạn thế nào? Hãy nêu cấu hình Caffeine (maximumSize/expire) phù hợp và các biện pháp phòng ngừa.'
  ],
  hints: [
    'jcmd GC.class_histogram thường đi kèm full GC (tùy phiên bản/cờ) và liệt kê object còn sống. So sánh số instance của vn.novamart.catalog.ProductDetail qua 3 ngày: 82014 -> 242014 -> 402014. Các mảng [B, [C, String, HashMap* tăng cùng nhịp gợi ý chúng là dữ liệu bên trong ProductDetail.',
    'Old Gen tăng vì object được promote/tenure và vẫn reachable nên GC không thu hồi. Tìm GC root: field static của class được ClassLoader giữ. CACHE là static final ConcurrentHashMap không có eviction.',
    'Caffeine hỗ trợ maximumSize (giới hạn số phần tử, eviction theo kích thước/chính sách) và expireAfterWrite/expireAfterAccess (TTL). Chọn giới hạn dựa trên dung lượng ước lượng mỗi entry và heap, và thêm metric hit/miss/eviction.'
  ],
  answer: `**Tóm tắt:** Bộ nhớ tăng đều qua 3 ngày do **cache static không giới hạn** ({{ProductService.CACHE}} là {{static final ConcurrentHashMap}} không có {{maximumSize}} và không có TTL/expire). Mỗi sản phẩm mới được xem sẽ được {{computeIfAbsent}} nạp vào map và không bao giờ bị loại bỏ, nên số {{ProductDetail}} còn sống tăng từ ~82k lên ~242k rồi ~402k, kéo theo {{String}}, {{byte[]}}, {{char[]}}, {{HashMap}} bên trong chúng tăng tương ứng. Các object này vẫn reachable từ GC root (static field), vì vậy sau mỗi lần GC Old Gen không giảm về đáy cũ mà đi lên dần, đúng kiểu memory leak logic do cache vô hạn.

### 1) Dẫn chứng: histogram 3 ngày và heap sau GC

**Cách đọc {{jcmd GC.class_histogram}}:** lệnh này in ra các class và số instance/bytes còn sống (live) tại thời điểm chạy (thường kèm cơ chế thu gom để chỉ còn live object, tùy môi trường). Điều quan trọng là so sánh **xu hướng** giữa các thời điểm trên cùng một pod không deploy lại.

- **Đối tượng tăng đều theo thời gian:**
  - {{vn.novamart.catalog.ProductDetail}}: 82,014 (ngày 1) -> 242,014 (ngày 2) -> 402,014 (ngày 3). Mỗi ngày tăng ~160,000 instance và vẫn còn sống.
  - {{java.util.HashMap}} và {{java.util.ArrayList}} bên trong ProductDetail cũng tăng đồng bộ: 82,014/120,114 -> 242,014/352,114 -> 402,014/586,114.
  - {{java.lang.String}}: 612,004 -> 1,814,012 -> 3,016,020; {{[B]}} (mảng byte — backing của {{String}} với compact strings từ JDK 9) và {{[C]}} (mảng char do các buffer/xử lý ký tự khác tạo ra) tăng mạnh tương ứng. Đây là dữ liệu thuộc về các {{ProductDetail}} (tên, mô tả, thuộc tính) được giữ lại.
  - Ngược lại, {{java.lang.Class}} gần như cố định (~18,022-18,024), cho thấy không phải leak classloader/Metaspace mà là leak object dữ liệu trên heap.
- **Heap/GC theo ngày (heap-metrics-3days.txt):**
  - {{old_gen_used_after_gc}}: 220 MB -> 920 MB -> 1600 MB. "Sau mỗi GC" mà đáy vẫn tăng nghĩa là tập object sống (live set) tăng, GC không thể thu hồi vì chúng còn được tham chiếu.
  - {{heap_used}} tăng 510 -> 1180 -> 1820 MB, {{avg_young_pause_ms}} 18 -> 34 -> 55 ms, {{young_gc_count_24h}} 1180 -> 1460 -> 1890. Khi Old Gen chiếm nhiều hơn, áp lực GC tăng, pause dài hơn, nhưng **không có Full GC** trong 3 ngày: chưa chạm ngưỡng buộc full compaction, song xu hướng sẽ tiến tới OOM/Full GC kéo dài nếu không xử lý.
  - Traffic ổn định (~118-121 req/s), không deploy mới: loại trừ nguyên nhân do tải tăng đột biến hay bản phát hành mới.

### 2) Nguyên nhân gốc: cache static không giới hạn

- **Cấu trúc gây giữ tham chiếu:** {{ProductService}} khai báo {{private static final Map<String, ProductDetail> CACHE = new ConcurrentHashMap<>()}} (ProductService.java). {{static}} nghĩa là field thuộc về class {{ProductService}}, sống suốt vòng đời classloader (thường là suốt vòng đời ứng dụng). {{CACHE}} là GC root (reachable từ static fields). Mọi {{ProductDetail}} được {{put}} vào map sẽ reachable: {{CACHE -> ConcurrentHashMap -> Node -> ProductDetail -> (HashMap/String/byte[]/char[]...)}}.
- **Không có cơ chế xóa:** {{computeIfAbsent(productId, repo::findDetailById)}} chỉ thêm khi thiếu, không bao giờ remove. Không có {{maximumSize}} (giới hạn số phần tử), không có {{expireAfterWrite}} / {{expireAfterAccess}} (hết hạn theo thời gian), không có eviction. Catalog có > 2 triệu SKU và traffic long-tail nên số key khác nhau được truy cập tăng dần theo thời gian -> map phình vô hạn.
- **Vì sao GC chạy mà Old Gen vẫn tăng?** GC (Garbage Collector) chỉ thu hồi object **không còn reachable** từ GC root. Ở đây ProductDetail vẫn reachable từ static CACHE, nên dù young GC/mixed GC có chạy, các object đã promote lên Old Gen vẫn sống. Sau mỗi chu kỳ, chỉ rác tạm (request-scoped) bị thu hồi, còn live set do cache giữ lại ngày càng lớn -> đáy Old Gen sau GC tăng dần. Đây là "leak" về mặt logic (ứng dụng giữ tham chiếu không cần thiết vô hạn), khác với leak do bug native, nhưng hậu quả trên heap tương tự: tiến tới Full GC thường xuyên và cuối cùng {{OutOfMemoryError: Java heap space}}.
- **Ước lượng nhanh:** ProductDetail tăng ~160k/ngày, kèm cấu trúc bên trong (String/array/Map) làm tổng live set tăng ~350-360 MB/ngày theo histogram/heap. old_gen_used_after_gc tăng ~700-680 MB mỗi mốc 24h cao hơn tốc độ tăng live set đo bằng histogram vì G1 mixed GC chỉ thu hồi một phần old region mỗi chu kỳ, nên old gen còn chứa rác chưa thu hồi (floating garbage); xu hướng tuyến tính là dấu hiệu điển hình của cache không giới hạn theo cardinality key.

### 3) Cách sửa

**Ngắn hạn (giảm rủi ro ngay):**
- **Restart/rollout** pod để giải phóng heap tạm thời (chỉ là chữa cháy, leak sẽ lặp lại).
- Nếu cần giảm tức thì mà chưa kịp refactor lớn: thêm cơ chế xóa thủ công an toàn tạm thời (ví dụ giới hạn kích thước tối đa và evict entry cũ nhất) hoặc chuyển sang cấu trúc có bound. Nhưng tự cài eviction trên {{ConcurrentHashMap}} dễ sai (race, không có chính sách tốt), nên ưu tiên dùng thư viện cache chuẩn.
- Giới hạn tác động: bật/tăng cảnh báo, chuẩn bị tăng heap tạm thời **chỉ** để mua thời gian (không phải fix gốc).

**Dài hạn (sửa đúng): dùng Caffeine với giới hạn và hết hạn**
- Thay {{ConcurrentHashMap}} tĩnh bằng cache có chính sách eviction. Với Java/Spring, **Caffeine** là lựa chọn phổ biến (hiệu năng cao, API rõ). Ví dụ cấu hình minh họa:

~~~java
import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import java.time.Duration;

@Service
public class ProductService {
    private final Cache<String, ProductDetail> cache = Caffeine.newBuilder()
            .maximumSize(50_000)                 // giới hạn số entry (bound bộ nhớ)
            .expireAfterWrite(Duration.ofMinutes(30))  // TTL: dữ liệu cũ hết hạn
            .expireAfterAccess(Duration.ofMinutes(10)) // tùy chọn: bỏ entry ít dùng
            .recordStats()                       // bật thống kê hit/miss/eviction
            .build();

    private final ProductRepository repo;

    public ProductService(ProductRepository repo) {
        this.repo = repo;
    }

    public ProductDetail getById(String productId) {
        return cache.get(productId, repo::findDetailById);
    }
}
~~~

- **Cách chọn tham số:**
  - {{maximumSize}}: ước lượng kích thước trung bình một {{ProductDetail}} (từ histogram/ước lượng object graph, ví dụ vài KB) nhân số entry để đảm bảo cache chỉ chiếm một phần heap (ví dụ vài trăm MB, không phải 1.6 GB). 50k là ví dụ; cần tính theo heap 2 GB và tải thực tế.
  - {{expireAfterWrite}}: phù hợp khi dữ liệu sản phẩm có thể thay đổi (giá/tồn kho/mô tả) và cần độ tươi; 10-60 phút là điểm khởi đầu thường gặp, chỉnh theo yêu cầu nghiệp vụ.
  - {{expireAfterAccess}}: hữu ích cho long-tail, giữ entry hay dùng gần đây. Có thể dùng một trong hai hoặc kết hợp tùy bài toán (Caffeine hỗ trợ cả hai).
  - (Nâng cao) {{maximumWeight}}/{{weigher}} nếu entry có kích thước chênh lệch lớn; {{refreshAfterWrite}} nếu muốn làm mới bất đồng bộ.
- **Không dùng {{static}} trừ khi thực sự cần phạm vi toàn classloader:** cache nên là bean (instance) để lifecycle rõ ràng, dễ test và tránh giữ qua các ngữ cảnh không mong muốn. Nếu nhiều node/pod cần chia sẻ, cân nhắc cache phân tán (Redis/Memcached) với TTL, nhưng vẫn phải có bound và chiến lược invalidation.
- **Invalidation khi cập nhật:** nếu sản phẩm thay đổi, cần {{cache.invalidate(id)}} hoặc cơ chế cập nhật (event) để tránh trả dữ liệu cũ quá TTL.

### 4) Phòng ngừa

- **Giám sát:** expose metric cache (Caffeine {{stats}}: hitRate, evictionCount, estimatedSize) và {{jvm_memory_used_bytes}} theo vùng nhớ. Đặt cảnh báo khi Old Gen đáy sau GC tăng liên tục N giờ/ngày, hoặc khi {{estimatedSize}} tiến sát {{maximumSize}} bất thường.
- **Kiểm tra định kỳ:** so sánh {{GC.class_histogram}} (hoặc heap dump phân tích bằng MAT) giữa các mốc để phát hiện live set tăng bất thường theo loại nghiệp vụ (ProductDetail, Session, RequestContext...).
- **Quy ước code:** cấm/soát xét {{static Map/List/Set}} dùng làm cache không có bound và không có TTL. Code review checklist: mọi cache phải có {{maximumSize/maximumWeight}} và/hoặc {{expire*}}, có metric, có owner rõ.
- **Kiểm thử:** test soak/longevity (chạy nhiều giờ/ngày với phân phối key rộng) và quan sát heap đáy sau GC; test với cardinality key lớn để đảm bảo eviction hoạt động.

> Senior tip: Cache là con dao hai lưỡi: không có bound (kích thước/TTL) thì nó trở thành memory leak "hợp pháp". Khi thấy Old Gen sau GC tăng dần đều theo ngày, hãy so sánh {{GC.class_histogram}} nhiều thời điểm để tìm class nghiệp vụ tăng tuyến tính (ví dụ ProductDetail) và lần ngược GC root (static field, singleton, registry). Với Caffeine, luôn đặt {{maximumSize}} hoặc {{maximumWeight}} và {{expireAfterWrite/expireAfterAccess}} phù hợp dữ liệu, đồng thời bật {{recordStats()}} để theo dõi hit/miss/eviction thay vì "cache mù".`,
  rubric: [
    'Dùng được bằng chứng 3 histogram (ProductDetail 82014->242014->402014 và các String/byte[]/char[]/HashMap tăng tương ứng) và heap-metrics (old_gen_used_after_gc 220->920->1600 MB) để chứng minh live set tăng và leak logic.',
    'Giải thích đúng vì sao GC không thu hồi: ProductDetail vẫn reachable từ GC root là static field CACHE (ConcurrentHashMap) không eviction; phân biệt leak tham chiếu với việc GC có chạy.',
    'Chỉ ra đúng nguyên nhân trong ProductService: static final Map cache, computeIfAbsent chỉ thêm, không maximumSize, không TTL/expire.',
    'Đề xuất sửa dùng Caffeine có maximumSize và expireAfterWrite/expireAfterAccess (hoặc tương đương), kèm lưu ý chọn tham số theo heap/dữ liệu và invalidation khi cập nhật.',
    'Có biện pháp phòng ngừa/quan sát: metric hit/miss/eviction hoặc estimatedSize, cảnh báo Old Gen đáy tăng, quy ước không dùng static cache vô hạn, kiểm thử soak/cardinality cao.'
  ],
  tags: ['memory-leak', 'gc', 'old-gen', 'class-histogram', 'cache', 'static', 'caffeine', 'heap']
},
{
  id: 'lab-gc-015',
  category: 'gc',
  title: 'Thêm tính năng "preview email": Metaspace OOM sau 5 giờ do Groovy compile trong vòng lặp',
  level: 'senior',
  scenario: `**Bối cảnh:** Nền tảng marketing **MailVN** có service **template-render** (Spring Boot 3.2, JDK 17.0.10, Groovy 4.0) cho phép đội marketing viết template email bằng Groovy. Khi khách bấm "Xem trước email", service biên dịch template, chạy thử với dữ liệu mẫu rồi trả HTML cho trình duyệt. Pod 2 vCPU, memory limit 3Gi. JVM: {{-Xmx1536m -XX:MaxMetaspaceSize=256m -XX:MetaspaceSize=96m -XX:+UseG1GC -XX:+HeapDumpOnOutOfMemoryError}}.

**Thuật ngữ giải thích:**
- **Metaspace:** vùng nhớ native (ngoài heap) chứa metadata của class. {{-XX:MaxMetaspaceSize}} là trần cứng; khi chạm trần mà không unload được class nào thì ném {{OutOfMemoryError: Metaspace}}, còn heap vẫn có thể trống.
- **Biên dịch (compile) trong vòng lặp:** cứ mỗi vòng lặp lại gọi {{shell.parse(...)}}, Groovy lại tạo một class mới (kèm classloader con) để chứa bytecode. Nếu class đó bị giữ sống, Metaspace phình lên.
- **Regex compile mỗi request:** {{Pattern.compile}} với {{Pattern.LITERAL}} không sinh class, nhưng tốn CPU và tạo object rác; nó chỉ là nghi phạm phụ, không phải nguồn Metaspace.

**Triệu chứng:** Bản **5.0** deploy lúc **08:00 ngày 25/10/2026**. Từ **13:10**, cả 3 pod lần lượt trả HTTP 500 với {{java.lang.OutOfMemoryError: Metaspace}}; restart tạm thời được ~6 giờ rồi tái diễn. Heap theo dashboard chỉ ~480 MB / 1536 MB. Dev chạy {{jmap -histo}} không thấy class nào trên heap tăng bất thường, nên đề xuất tăng {{MaxMetaspaceSize}} lên 512 MB. Tính năng "preview email" chỉ chiếm khoảng 3% traffic.

**Dữ liệu thu thập:** {{jcmd VM.classloader_stats}} lúc 13:00, GC log quanh OOM, metric Prometheus theo giờ, đoạn code {{TemplateRenderService}} và kết quả truy vấn bảng {{email_template}}.`,
  artifacts: [
    {
      name: 'classloader-stats-1300.txt',
      lang: 'text',
      content: `$ kubectl exec template-render-6b8d9f-n4k2p -- jcmd 1 VM.classloader_stats
1:
ClassLoader                                          Parent                     CLD*                 Classes  ChunkSz  BlockSz  Type
0x0000000800c62a40                                0x0000000800d01f28         0x00007f3a9c4e1d70        0        0        0  groovy.lang.GroovyClassLoader
0x0000000801f3a5b8                                0x0000000800c62a40         0x00007f3a2c0a8e40        1     5120     4688  groovy.lang.GroovyClassLoader$InnerLoader
0x0000000801f3a2d0                                0x0000000800c62a40         0x00007f3a2c0a8c90        1     5120     4688  groovy.lang.GroovyClassLoader$InnerLoader
0x0000000801f39fe8                                0x0000000800c62a40         0x00007f3a2c0a8ae0        1     5120     4688  groovy.lang.GroovyClassLoader$InnerLoader
0x0000000801f39d00                                0x0000000800c62a40         0x00007f3a2c0a930        1     5120     4688  groovy.lang.GroovyClassLoader$InnerLoader
0x0000000801f39a18                                0x0000000800c62a40         0x00007f3a2c0a780        1     5120     4688  groovy.lang.GroovyClassLoader$InnerLoader
... (20,480 dòng GroovyClassLoader$InnerLoader khác, đều Parent 0x0000000800c62a40, Classes 1) ...
0x0000000800d01f28                                0x0000000800010d48         0x00007f3a9c2b5a10    14871 92274688 89912320  org.springframework.boot.loader.launch.LaunchedClassLoader
                                                              1544   4194304  3801088   + hidden classes
0x0000000800010d48                                0x0000000800010a60         0x00007f3a9c1e0c30      102   1048576   940112  jdk.internal.loader.ClassLoaders$AppClassLoader
0x0000000800010a60                                0x0000000000000000         0x00007f3a9c1e0950      112   786432   701232  jdk.internal.loader.ClassLoaders$PlatformClassLoader
0x0000000000000000                                0x0000000000000000         0x00007f3a9c0d7b30     3214 20971520 20512488  <boot class loader>
Total = 40329                                                46757 150817280 141849352
ChunkSz: Total size of all allocated metaspace chunks
BlockSz: Total size of all allocated metaspace blocks (each chunk has several blocks)`
    },
    {
      name: 'metrics-hourly.txt',
      lang: 'text',
      content: `# Prometheus, pod template-render-6b8d9f-n4k2p (khởi động 08:00:12)
# metaspace      = jvm_memory_used_bytes{area="nonheap",id="Metaspace"}
# classes_loaded = jvm_classes_loaded_classes
# classes_unld   = jvm_classes_unloaded_classes_total
# heap_after_gc  = jvm_memory_used_bytes{area="heap",id="G1 Old Gen"} ngay sau mixed GC gần nhất

time    metaspace   classes_loaded  classes_unld  heap_after_gc  preview/s  http_5xx/s
08:05     106.6 MB            20238             0         231 MB       1.02         0
09:00     130.5 MB            25320             0         236 MB       1.01         0
10:00     156.5 MB            30864             0         229 MB       1.03         0
11:00     182.5 MB            36408             0         241 MB       1.04         0
12:00     208.5 MB            41952             0         238 MB       1.03         0
13:00     230.8 MB            46757             0         240 MB       1.02         0
13:41     255.9 MB            52116             0         585 MB       0.00        31.6

# email_template (PostgreSQL)
template=> SELECT count(*) AS templates, count(DISTINCT md5(body)) AS distinct_bodies, max(updated_at) FROM email_template WHERE active;
 templates | distinct_bodies |          max
-----------+-----------------+------------------------
        48 |              48 | 2026-10-24 17:41:09+07
(1 row)`
    },
    {
      name: 'gc-and-app-1340.log',
      lang: 'text',
      content: `[2026-10-25T13:40:51.114+0700][20231.114s][info][gc] GC(1622) Pause Young (Concurrent Start) (Metadata GC Threshold) 912M->604M(1536M) 18.553ms
[2026-10-25T13:40:51.114+0700][20231.114s][info][gc,metaspace] GC(1622) Metaspace: 261402K(262144K)->261402K(262144K) NonClass: 229118K(229632K)->229118K(229632K) Class: 32284K(32512K)->32284K(32512K)
[2026-10-25T13:40:51.114+0700][20231.114s][info][gc] GC(1623) Concurrent Mark Cycle
[2026-10-25T13:40:52.020+0700][20232.020s][info][gc] GC(1623) Pause Remark 640M->638M(1536M) 31.022ms
[2026-10-25T13:40:52.020+0700][20232.020s][info][gc,metaspace] GC(1623) Metaspace: 261402K(262144K)->261402K(262144K) NonClass: 229118K(229632K)->229118K(229632K) Class: 32284K(32512K)->32284K(32512K)
[2026-10-25T13:40:52.114+0700][20232.114s][info][gc] GC(1623) Pause Cleanup 642M->642M(1536M) 0.402ms
[2026-10-25T13:40:52.130+0700][20232.130s][info][gc] GC(1623) Concurrent Mark Cycle 1016.115ms
[2026-10-25T13:40:53.311+0700][20233.311s][info][gc] GC(1624) Pause Full (Metadata GC Threshold) 702M->588M(1536M) 1210.774ms
[2026-10-25T13:40:53.311+0700][20233.311s][info][gc,metaspace] GC(1624) Metaspace: 262101K(262144K)->262101K(262144K) NonClass: 229790K(229824K)->229790K(229824K) Class: 32311K(32320K)->32311K(32320K)
[2026-10-25T13:40:54.500+0700][20234.500s][info][gc] GC(1625) Pause Full (Metadata GC Clear Soft References) 588M->585M(1536M) 1189.302ms
[2026-10-25T13:40:54.500+0700][20234.500s][info][gc,metaspace] GC(1625) Metaspace: 262101K(262144K)->262101K(262144K) NonClass: 229790K(229824K)->229790K(229824K) Class: 32311K(32320K)->32311K(32320K)

{"@timestamp":"2026-10-25T13:40:50.877+07:00","level":"INFO","thread_name":"http-nio-8080-exec-12","logger_name":"vn.mailvn.render.PreviewController","message":"preview templateId=TPL-1007 user=u-2231","traceId":"6721f1c5a3e94b0d"}
{"@timestamp":"2026-10-25T13:40:54.502+07:00","level":"ERROR","thread_name":"http-nio-8080-exec-37","logger_name":"o.a.c.c.C.[.[.[/].[dispatcherServlet]","message":"Servlet.service() for servlet [dispatcherServlet] in context with path [] threw exception [Handler dispatch failed: java.lang.OutOfMemoryError: Metaspace] with root cause","traceId":"6721f1c5b81c22aa","stack_trace":"java.lang.OutOfMemoryError: Metaspace
  at java.base/java.lang.ClassLoader.defineClass1(Native Method)
  at java.base/java.lang.ClassLoader.defineClass(ClassLoader.java:1012)
  at java.base/java.security.SecureClassLoader.defineClass(SecureClassLoader.java:150)
  at groovy.lang.GroovyClassLoader$ClassCollector.createClass(GroovyClassLoader.java:624)
  at groovy.lang.GroovyClassLoader$ClassCollector.onClassNode(GroovyClassLoader.java:644)
  at groovy.lang.GroovyClassLoader.doParseClass(GroovyClassLoader.java:351)
  at groovy.lang.GroovyClassLoader.parseClass(GroovyClassLoader.java:311)
  at groovy.lang.GroovyShell.parseClass(GroovyShell.java:572)
  at groovy.lang.GroovyShell.parse(GroovyShell.java:584)
  at groovy.lang.GroovyShell.parse(GroovyShell.java:620)
  at vn.mailvn.render.TemplateRenderService.render(TemplateRenderService.java:26)
  at vn.mailvn.render.PreviewController.preview(PreviewController.java:41)
  ..."}
{"@timestamp":"2026-10-25T13:40:54.733+07:00","level":"WARN","thread_name":"HikariPool-1 housekeeper","logger_name":"com.zaxxer.hikari.pool.HikariPool","message":"HikariPool-1 - Thread starvation or clock leap detected (housekeeper delta=32s417ms).","traceId":""}`
    },
    {
      name: 'TemplateRenderService.java',
      lang: 'text',
      content: `package vn.mailvn.render;

import groovy.lang.Binding;
import groovy.lang.GroovyShell;
import groovy.lang.Script;
import java.util.Map;
import java.util.regex.Pattern;
import org.springframework.stereotype.Service;
import vn.mailvn.template.EmailTemplate;

@Service
public class TemplateRenderService {

    // Review 5.0: "tạo GroovyShell mỗi lần thì tốn, nên giữ 1 shell dùng chung"
    private final GroovyShell shell = new GroovyShell(TemplateRenderService.class.getClassLoader());

    // Biến mẫu thay thế bằng regex cho nhanh (mỗi request compile lại)
    private final Pattern VAR = Pattern.compile("\\\\$\\\\{([a-zA-Z0-9_]+)\\\\}", Pattern.LITERAL);  // dòng 20

    /**
     * template.getBody() ví dụ:
     *   Hello \${name}, đơn hàng \${orderId} của bạn trị giá \${amount}.
     */
    public String render(EmailTemplate template, Map<String, Object> sample) {
        // Thay \${...} bằng giá trị mẫu để hiển thị preview
        String body = VAR.matcher(template.getBody()).replaceAll(m -> String.valueOf(sample.getOrDefault(m.group(1), "")));

        // Bọc body thành script Groovy và chạy thử để kiểm tra lỗi cú pháp
        String script = "def out = new StringBuilder(); out.append('" + body.replace("'", "\\\\'") + "'); return out.toString();";
        Script s = shell.parse(script);                     // dòng 26: MỖI request compile một class Groovy mới
        s.setBinding(new Binding(sample));
        Object r = s.run();
        return r == null ? "" : r.toString();
    }
}`
    }
  ],
  questions: [
    'Vì sao heap chỉ khoảng 600 MB mà JVM vẫn OutOfMemoryError? Vì sao jmap -histo không thấy class nào bất thường?',
    'Từ classloader_stats và metric, hãy chứng minh nguyên nhân gốc: ai tạo ra các class, vì sao chúng không bao giờ được unload? Chỉ có 48 template thì đáng lẽ cần bao nhiêu class?',
    'Bạn sửa ngắn hạn và dài hạn thế nào? Tăng MaxMetaspaceSize lên 512 MB hoặc bỏ giới hạn có phải ý hay không? Alert gì cần thêm?'
  ],
  hints: [
    'Metaspace chứa metadata của class (bytecode, method, constant pool), không phải object. Hãy xem cột Classes và Parent trong classloader_stats: có bao nhiêu loader, mỗi loader nạp bao nhiêu class, và parent của chúng là ai?',
    'jvm_classes_unloaded_classes_total luôn bằng 0, còn số class tăng khoảng 1.54 class/giây, bằng đúng preview/s. Hai Full GC cuối cũng không giảm được Metaspace. Điều đó nghĩa là các class vẫn reachable.',
    'GroovyShell.parse(String) compile ra một class mới mỗi lần gọi (tên script tự sinh), và GroovyClassLoader cha giữ class đã sinh trong cache của nó. Shell lại là field của một singleton bean.'
  ],
  answer: `**Tóm tắt:** Đây là **class leak trong Metaspace**. {{TemplateRenderService}} gọi {{shell.parse(script)}} ở **mỗi request preview**, nên Groovy compile ra **một class mới mỗi lần** (mỗi class được định nghĩa bởi một {{GroovyClassLoader$InnerLoader}} riêng). Tất cả đều được {{GroovyClassLoader}} của shell giữ lại, mà shell là field của singleton bean, nên không class nào được unload. Chỉ có 48 template, nhưng 5 giờ đã sinh ra khoảng 32 nghìn class ({{classes_loaded}} tăng 20.238 → 52.116) và lấp đầy {{MaxMetaspaceSize=256m}}.

### Vì sao heap trống mà vẫn OOM

- **Metaspace** là vùng native memory, nằm ngoài heap, chứa metadata của class: cấu trúc Klass, method, bytecode, constant pool. Nó bị giới hạn bởi {{-XX:MaxMetaspaceSize}}, không liên quan gì đến {{-Xmx}}.
- {{jmap -histo}} đếm **object trên heap**. Một class Groovy nhỏ trên heap chỉ là một object {{java.lang.Class}} vài trăm byte cộng một InnerLoader, tức vài MB cho 20 nghìn class, nên lẫn vào nhiễu. Phần nặng (khoảng 4.7 KB mỗi class) nằm trong Metaspace, và histogram không thể hiện phần này.
- **Class chỉ được unload khi classloader của nó không còn reachable**, và việc này xảy ra trong GC (ở G1 là lúc Remark hoặc Full GC). Không có cơ chế nào unload từng class riêng lẻ.

### Dẫn chứng

- {{classloader_stats}}: tổng **40,329 loader**, trong đó **20,485 loader {{GroovyClassLoader$InnerLoader}}** (20,480 dòng lặp + 5 dòng liệt kê), mỗi loader **Classes 1**, ChunkSz 5120. Tất cả có **cùng Parent 0x0000000800c62a40**, chính là dòng {{groovy.lang.GroovyClassLoader}} duy nhất (Classes 0), loader của shell dùng chung. Chỉ riêng các InnerLoader này chiếm khoảng 100 MB chunk (20,485 × 5,120 byte) trong Metaspace.
- So sánh: {{LaunchedClassLoader}} (toàn bộ Spring, Hibernate, code ứng dụng) chỉ có 14,871 class và khoảng 88 MB.
- Metric: {{classes_loaded}} tăng đều khoảng 5,544 class/giờ, tức 1.54 class/giây (mỗi preview request trung bình sinh ~1.5 class). {{classes_unld}} bằng 0 suốt gần 6 giờ. Metaspace tăng khoảng 26 MB/giờ, còn heap after GC phẳng ở khoảng 230–240 MB.
- {{email_template}}: chỉ có **48 body khác nhau**, và lần sửa gần nhất là hôm trước. Lẽ ra chỉ cần 48 class.
- GC log: {{Pause Young (Concurrent Start) (Metadata GC Threshold)}}, sau đó {{Pause Remark}} (nơi G1 unload class) mà Metaspace vẫn {{261402K->261402K}}. Tiếp theo JVM thử hai Full GC: {{Pause Full (Metadata GC Threshold)}} và {{Pause Full (Metadata GC Clear Soft References)}}, đây là nỗ lực cuối cùng trước khi ném OOM. Metaspace vẫn {{262101K->262101K}}, gần chạm 262144K (256 MB), nghĩa là **không có gì để thu hồi**, tất cả đều reachable.
- Stack trace: OOM xảy ra trong {{ClassLoader.defineClass1}}, được gọi từ {{GroovyShell.parse}} tại {{TemplateRenderService.render(TemplateRenderService.java:26)}}.
- Dòng Hikari {{Thread starvation or clock leap detected}} chỉ là hệ quả của hai Full GC dài khoảng 1.2 giây, không phải nguyên nhân.

### Cơ chế bên trong Groovy

1. {{GroovyShell.parse(String)}} tự đặt tên script mới (dạng ScriptNNN) cho mỗi lần gọi, nên không có cache hit: **mỗi lần gọi là một lần compile**, kể cả khi nội dung script giống hệt.
2. {{GroovyClassLoader.doParseClass}} tạo một {{InnerLoader}} (con của loader của shell) để định nghĩa class mới, sau đó **đưa class vào class cache của GroovyClassLoader cha**.
3. Chuỗi tham chiếu: bean singleton {{TemplateRenderService}} → {{shell}} → {{GroovyClassLoader}} → class cache → {{Class ScriptNNN}} → InnerLoader của nó. Vì chuỗi này luôn reachable, không GC nào unload được.

Nhận xét "giữ 1 shell dùng chung" trong code review chỉ đúng một nửa: shell dùng chung **cộng với** việc parse mỗi request chính là thứ biến nó thành kho chứa class vô hạn. Nếu tạo shell mới mỗi request thì các class có thể unload khi GC, nhưng vẫn tốn CPU compile (vài ms mỗi lần) và gây áp lực Metaspace và GC liên tục. Cả hai cách đều sai ở chỗ **compile trong hot path**.

### Cách sửa

**Ngắn hạn (hotfix):** compile mỗi template **một lần**, cache Class theo id và phiên bản của template, và tạo instance Script mới cho mỗi request. Script **không thread-safe** vì giữ Binding riêng, nên không được dùng chung một instance Script giữa các thread.

~~~java
private final GroovyClassLoader gcl = new GroovyClassLoader(getClass().getClassLoader());
private final Map<String, Class<? extends Script>> compiled = new ConcurrentHashMap<>();

@SuppressWarnings("unchecked")
public String render(EmailTemplate template, Map<String, Object> sample) {
    String key = template.getId() + ":" + template.getVersion();   // đổi version thì compile lại
    Class<? extends Script> cls = compiled.computeIfAbsent(key,
            k -> (Class<? extends Script>) gcl.parseClass(buildScript(template), "Tpl_" + template.getId() + "_v" + template.getVersion() + ".groovy"));
    Script script = InvokerHelper.createScript(cls, new Binding(sample));
    Object r = script.run();
    return r == null ? "" : r.toString();
}
~~~

Khi template đổi phiên bản, class cũ vẫn nằm trong cache của {{gcl}}. Có hai cách xử lý: dùng **một GroovyClassLoader riêng cho mỗi lần reload toàn bộ bộ template** rồi bỏ loader cũ (để cả cây class unload được), hoặc gọi {{gcl.clearCache()}} và xoá map {{compiled}} khi template thay đổi. Số template nhỏ (48) nên chi phí không đáng kể.

**Dài hạn:**
- Nếu template chỉ là văn bản có biến thay thế, cân nhắc một **expression language không sinh class mỗi lần đánh giá** (SpEL đã parse sẵn, {{String.replace}} của biến, hoặc engine template như Thymeleaf/Handlebars đã được thiết kế cho việc này), dễ kiểm soát và audit hơn.
- **Bảo mật:** template Groovy do người dùng viết chạy trong JVM gửi email tương đương với remote code execution. Bắt buộc dùng sandbox ({{SecureASTCustomizer}} với whitelist import và receiver, giới hạn thời gian chạy), duyệt template trước khi active, hoặc tách ra một service riêng có quyền tối thiểu.
- Bỏ {{Pattern.compile}} trong {{render}} (dòng 20) khỏi hot path: compile một lần ở field {{static final}}. Với {{Pattern.LITERAL}}, matcher không tạo class nên đây không phải nguyên nhân Metaspace, nhưng vẫn là CPU và object rác không cần thiết.

**Tăng MaxMetaspaceSize lên 512 MB hay bỏ giới hạn?** Không. Làm vậy chỉ dời sự cố từ khoảng 6 giờ lên khoảng 17 giờ. Nếu bỏ giới hạn (mặc định là không giới hạn), Metaspace sẽ ăn dần vào memory limit của container và pod bị **OOMKilled** mà không có stack trace, khó chẩn đoán hơn nhiều. Giữ giới hạn hợp lý để lỗi lộ ra rõ ràng là đúng.

### Phòng ngừa và alert

- Alert khi {{rate(jvm_classes_loaded_classes)}} còn dương sau 30 phút kể từ khi khởi động. Ứng dụng ổn định thì số class gần như phẳng sau warm-up.
- Alert khi Metaspace dùng trên 80% {{MaxMetaspaceSize}}, và khi GC log có cause {{Metadata GC Threshold}} lặp lại liên tục.
- Test tích hợp: chạy 10,000 lần render, assert số class tăng không quá số template.
- Code review: cấm {{GroovyShell.parse}}, {{GroovyClassLoader.parseClass}}, {{ScriptEngine.eval}} (với script dạng String), {{Proxy.newProxyInstance}} với loader mới, ByteBuddy hoặc CGLIB tạo class trong request path, trừ khi có cache.

> Senior tip: Khi thấy OOM Metaspace, việc đầu tiên là chạy {{jcmd <pid> VM.classloader_stats}} và nhìn **số lượng loader và parent của chúng**. Hàng nghìn loader cùng loại, mỗi loader 1–2 class, gần như luôn là sinh class động trong hot path (Groovy, JSR-223, proxy, bytecode generation). Còn một vài loader khổng lồ không chịu biến mất thường là leak do hot redeploy hoặc ThreadLocal giữ loader cũ. Muốn biết tên class thì bật {{-Xlog:class+load=info}} tạm thời trên một pod, hoặc dùng {{jcmd <pid> VM.metaspace show-loaders}} để xem chi tiết hơn.`,
  rubric: [
    'Giải thích Metaspace là native memory chứa metadata của class, tách biệt với heap; histogram heap không thấy được, class chỉ unload khi loader của nó unreachable.',
    'Dẫn chứng: khoảng 20,485 GroovyClassLoader$InnerLoader mỗi cái 1 class, cùng parent là một GroovyClassLoader; tổng ~40,329 loader và classes_loaded tăng 1.54/s bằng preview/s; unloaded = 0; hai Full GC (Metadata GC Threshold, Clear Soft References) không giảm được Metaspace.',
    'Chỉ đúng nguyên nhân: shell.parse() mỗi request trên một GroovyShell singleton, mỗi lần sinh class mới và class bị giữ trong cache của GroovyClassLoader; chỉ có 48 template nên chỉ cần 48 class.',
    'Đề xuất compile một lần và cache Class theo template id và version, tạo Script instance mới mỗi request (Script không thread-safe), có cách giải phóng class khi template đổi.',
    'Phản biện việc tăng hoặc bỏ MaxMetaspaceSize (chỉ dời sự cố, có thể thành OOMKilled), và có alert theo class loaded rate và Metaspace usage; nhắc rủi ro bảo mật của template do người dùng viết.'
  ],
  tags: ['metaspace', 'classloader-leak', 'groovy', 'oom', 'class-unloading', 'template-engine']
},
{
  id: 'lab-gc-016',
  category: 'gc',
  title: 'p99 900 ms trên service ví: heap 16 GB và mixed GC 820 ms với G1 mặc định',
  level: 'senior',
  scenario: `**Bối cảnh:** Ví điện tử **VietPay** có service **ledger** (Spring Boot 3.2, JDK 17.0.10, G1) ghi và tra soát giao dịch ví. Pod 8 vCPU, memory limit 24Gi. Khi lên production, team đặt {{-Xms16g -Xmx16g}} mà **không đặt {{-XX:MaxGCPauseMillis}}**, cũng không đặt {{-XX:InitiatingHeapOccupancyPercent}} (IHOP). Live set thật (sau mixed GC) chỉ khoảng **5 GB**, nhưng G1 giữ heap 16 GB.

**Thuật ngữ giải thích:**
- **G1 (Garbage-First):** bộ thu gom rác mặc định của JDK 17, chia heap thành các region bằng nhau và dọn những region nhiều rác nhất trước.
- **Mixed GC:** lần GC vừa dọn young (Eden + Survivor) vừa dọn một phần old region; là loại pause dài nhất trong vận hành bình thường của G1.
- **MaxGCPauseMillis:** "khuyến nghị" cho G1 về thời gian pause mong muốn (mặc định 200 ms); G1 dùng nó để quyết định cỡ young và số old region dọn mỗi lần.
- **ZGC generational:** bộ thu gom rác của JDK 21, pause không phụ thuộc kích thước heap; bật bằng {{-XX:+UseZGC -XX:+ZGenerational}} (mặc định từ JDK 23).

**Triệu chứng:** Tháng này p99 của {{POST /api/wallet/transfer}} tăng từ 45 ms lên **900 ms**, có đợt chạm 1.1 s. CPU pod chỉ 40–55%, không có Full GC, không có lỗi, traffic ổn định ~4,200 request/giây mỗi pod. GC log JDK 17 cho thấy young GC rất thưa (khoảng mỗi 8 giây) nhưng **mixed GC kéo dài 800–900 ms**.

**Dữ liệu thu thập:** GC log JDK 17 (unified logging) của pod,metric Prometheus theo giờ, kết quả {{jcmd VM.flags}} và một đoạn code hot path.`,
  artifacts: [
    {
      name: 'gc-ledger-1024.log',
      lang: 'text',
      content: `[2026-10-26T08:00:00.012+0700][0.012s][info][gc,init] Version: 17.0.10+7 (release)
[2026-10-26T08:00:00.012+0700][0.012s][info][gc,init] CPUs: 8 total, 8 available
[2026-10-26T08:00:00.012+0700][0.012s][info][gc,init] Memory: 24576M
[2026-10-26T08:00:00.012+0700][0.012s][info][gc,init] Heap Region Size: 8M
[2026-10-26T08:00:00.012+0700][0.012s][info][gc,init] Heap Min Capacity: 16G
[2026-10-26T08:00:00.012+0700][0.012s][info][gc,init] Heap Initial Capacity: 16G
[2026-10-26T08:00:00.012+0700][0.012s][info][gc,init] Heap Max Capacity: 16G
[2026-10-26T08:00:00.012+0700][0.012s][info][gc,init] Parallel Workers: 8
[2026-10-26T08:00:00.012+0700][0.012s][info][gc,init] Concurrent Workers: 3
[2026-10-26T08:00:00.012+0700][0.012s][info][gc,init] Concurrent Refinement Workers: 8
[2026-10-26T08:00:00.012+0700][0.012s][info][gc,init] Periodic GC: Disabled
... (young GC thưa, đã lược bớt) ...
[2026-10-26T10:14:55.102+0700][8095.102s][info][gc] GC(412) Pause Young (Normal) (G1 Evacuation Pause) 6120M->5120M(16384M) 62.441ms
[2026-10-26T10:15:03.330+0700][8103.330s][info][gc,start] GC(413) Pause Young (Concurrent Start) (G1 Evacuation Pause)
[2026-10-26T10:15:03.330+0700][8103.330s][info][gc,task] GC(413) Using 8 workers of 8 for evacuation
[2026-10-26T10:15:03.392+0700][8103.392s][info][gc,phases] GC(413)   Evacuate Collection Set: 54.1ms
[2026-10-26T10:15:03.392+0700][8103.392s][info][gc,heap] GC(413) Eden regions: 620->0(620)
[2026-10-26T10:15:03.392+0700][8103.392s][info][gc,heap] GC(413) Survivor regions: 20->40(200)
[2026-10-26T10:15:03.392+0700][8103.392s][info][gc,heap] GC(413) Old regions: 640->640
[2026-10-26T10:15:03.392+0700][8103.392s][info][gc,heap] GC(413) Humongous regions: 0->0
[2026-10-26T10:15:03.392+0700][8103.392s][info][gc] GC(413) Pause Young (Concurrent Start) (G1 Evacuation Pause) 6150M->5140M(16384M) 68.112ms
[2026-10-26T10:15:03.393+0700][8103.393s][info][gc] GC(414) Concurrent Mark Cycle
[2026-10-26T10:15:04.301+0700][8104.301s][info][gc,marking] GC(414) Concurrent Mark (8103.393s, 8104.301s) 908.104ms
[2026-10-26T10:15:04.312+0700][8104.312s][info][gc] GC(414) Pause Remark 5218M->5204M(16384M) 12.221ms
[2026-10-26T10:15:04.323+0700][8104.323s][info][gc] GC(414) Pause Cleanup 5204M->5204M(16384M) 0.512ms
[2026-10-26T10:15:04.330+0700][8104.330s][info][gc] GC(414) Concurrent Mark Cycle 936.221ms
[2026-10-26T10:15:07.812+0700][8107.812s][info][gc,start] GC(415) Pause Young (Prepare Mixed) (G1 Evacuation Pause)
[2026-10-26T10:15:07.812+0700][8107.812s][info][gc,task] GC(415) Using 8 workers of 8 for evacuation
[2026-10-26T10:15:08.512+0700][8108.512s][info][gc,phases] GC(415)   Evacuate Collection Set: 702.4ms
[2026-10-26T10:15:08.512+0700][8108.512s][info][gc,phases] GC(415)   Post Evacuate Collection Set: 84.2ms
[2026-10-26T10:15:08.512+0700][8108.512s][info][gc,heap] GC(415) Eden regions: 610->0(120)
[2026-10-26T10:15:08.512+0700][8108.512s][info][gc,heap] GC(415) Survivor regions: 40->60(200)
[2026-10-26T10:15:08.512+0700][8108.512s][info][gc,heap] GC(415) Old regions: 640->400
[2026-10-26T10:15:08.512+0700][8108.512s][info][gc,heap] GC(415) Humongous regions: 0->0
[2026-10-26T10:15:08.512+0700][8108.512s][info][gc] GC(415) Pause Young (Prepare Mixed) (G1 Evacuation Pause) 6380M->5040M(16384M) 806.441ms
[2026-10-26T10:15:08.512+0700][8108.512s][info][gc,cpu] GC(415) User=6.41s Sys=0.02s Real=0.81s
[2026-10-26T10:15:09.330+0700][8109.330s][info][gc] GC(416) Pause Young (Mixed) (G1 Evacuation Pause) 5520M->5080M(16384M) 812.204ms
[2026-10-26T10:15:10.142+0700][8110.142s][info][gc] GC(417) Pause Young (Mixed) (G1 Evacuation Pause) 5380M->5040M(16384M) 798.512ms
... (chu kỳ Concurrent Start rồi 2-3 Mixed GC dài 800-900ms lặp lại mỗi 20-40 giây) ...
[2026-10-26T10:22:48.771+0700][8528.771s][info][gc] GC(438) Pause Young (Mixed) (G1 Evacuation Pause) 5410M->5060M(16384M) 821.334ms`
    },
    {
      name: 'prometheus-and-flags.txt',
      lang: 'text',
      content: `# Prometheus, pod ledger-7f9c8d-k2xpl, 10:00-10:20 (8 vCPU)
# gc_pause_p99       = histogram_quantile(0.99, rate(jvm_gc_pause_seconds_bucket[5m]))
# gc_time_ratio      = rate(jvm_gc_pause_seconds_sum[5m]) (giây GC mỗi giây)
# alloc_rate         = rate(jvm_gc_memory_allocated_bytes_total[5m])
# old_after_mixed    = jvm_memory_used_bytes{area="heap",id="G1 Old Gen"} ngay sau mixed GC

time    gc_young_count  gc_mixed_count  gc_pause_p99  gc_time_ratio  alloc_rate  old_after_mixed  http_p99
10:00        118              9           0.812 s        0.041          0.42 GB/s      5.04 GB        905 ms
10:10        121             11           0.798 s        0.043          0.41 GB/s      5.06 GB        887 ms
10:20        119             10           0.821 s        0.040          0.43 GB/s      5.03 GB        912 ms

# jcmd 1 VM.flags | grep -E 'MaxGCPauseMillis|G1HeapRegionSize|InitiatingHeapOccupancyPercent|UseG1GC|UseZGC|MaxHeapSize'
-XX:MaxGCPauseMillis=200
-XX:G1HeapRegionSize=8388608
-XX:InitiatingHeapOccupancyPercent=45
-XX:+UseG1GC
-XX:MaxHeapSize=17179869184

# jcmd 1 GC.heap_info
 garbage-first heap   total 17179869184K, used 5158993920K
  region size 8192K, 120 young (983040K), 60 survivors (491520K), 512 old (4194304K)
# Note: used ≈ 4.8 GB; region size 8M; 2048 regions = 16 GB. Old gen ~4 GB (512 vùng) sau mixed GC, live set ổn định ~5 GB.`
    },
    {
      name: 'TransferService.java',
      lang: 'text',
      content: `package vn.vietpay.ledger;

import java.time.Instant;
import java.util.UUID;
import org.springframework.stereotype.Service;

@Service
public class TransferService {

    private final LedgerRepository repo;

    public TransferService(LedgerRepository repo) { this.repo = repo; }

    @Transactional
    public TransferResult transfer(String from, String to, long amount, String idempotencyKey) {
        // Mỗi request tạo khá nhiều object tạm (event, DTO, chuỗi JSON audit)
        TransferEvent event = TransferEvent.of(from, to, amount, UUID.randomUUID().toString());
        AuditLog log = AuditLog.of(event, Instant.now());     // serialized JSON ~1-2 KB
        repo.save(event);
        repo.save(log);
        return new TransferResult(event.id(), "OK");
    }
}`
    }
  ],
  questions: [
    'Vì sao mixed GC kéo dài 800–900 ms dù CPU còn dư và không có Full GC? Dùng GC log và metric để giải thích cơ chế.',
    'Heap 16 GB nhưng live set chỉ ~5 GB thì G1 cần dọn bao nhiêu old region mỗi chu kỳ mixed, và vì sao điều đó quyết định độ dài pause? IHOP 45% có liên quan gì?',
    'Bạn có 3 lựa chọn: (a) đặt MaxGCPauseMillis=50, (b) chuyển ZGC generational trên JDK 21, (c) giảm allocation rate. Phân tích ưu/nhược và đề xuất lộ trình. Alert nào cần thêm?'
  ],
  hints: [
    'Đọc dòng "Heap Region Size: 8M" và "Heap Max Capacity: 16G". Old gen đang giữ 640 region (~5 GB) rác rải rác; G1 chỉ dọn được region nào phần lớn là rác. Nếu region nào cũng có ~45-60% object sống thì phải copy nhiều, pause dài.',
    'MaxGCPauseMillis mặc định 200 ms chỉ là mục tiêu; khi heap quá lớn so với live set, G1 chọn young rất lớn (Eden 620 region) và gom nhiều old region vào một mixed GC để bù chi phí, nên pause vượt xa mục tiêu. IHOP 45% nghĩa là chu kỳ đánh dấu chỉ bắt đầu khi old vượt ~7.2 GB — old 5 GB vẫn dưới ngưỡng, nhưng vẫn có chu kỳ do "Concurrent Start" ở young GC khi heap gần đầy.',
    'ZGC generational gần như không có pause theo kích thước heap, nhưng cần JDK 21 và tốn CPU; giảm allocation chỉ giảm tần suất chứ không giảm độ dài mỗi pause; MaxGCPauseMillis=50 buộc G1 chia nhỏ mixed GC (nhiều lần hơn, mỗi lần ngắn hơn) và giảm young, đánh đổi bằng throughput.'
  ],
  answer: `**Tóm tắt:** Đây là **mixed GC quá dài do heap quá lớn so với live set**, không phải leak và không phải Full GC. Heap 16 GB với region 8 MB, live set chỉ ~5 GB (khoảng 640 old region rải rác). Mỗi chu kỳ mixed G1 phải copy object sống từ nhiều old region sang region mới; vì mỗi region chứa 45–60% object sống nên chi phí evacuate lớn, pause 800–900 ms. CPU còn dư vì đây là **pause stop-the-world**, không phải thiếu CPU. Ba lựa chọn đều hợp lý ở các mức độ khác nhau: giảm allocation rate và đặt MaxGCPauseMillis là bước đầu; ZGC generational trên JDK 21 là lời giải triệt để cho pause.

### Đọc GC log: chuyện gì đang xảy ra

| Dòng log | Ý nghĩa |
|---|---|
| {{Heap Region Size: 8M, Heap Max Capacity: 16G}} | Heap có 2048 region, mỗi region 8 MB |
| {{GC(412) Pause Young (Normal) 6120M->5120M ... 62.441ms}} | Young GC thưa (khoảng 8 giây một lần), pause 62 ms |
| {{GC(413) Pause Young (Concurrent Start) ... 68.112ms}}, {{GC(414) Concurrent Mark Cycle}} | Old gen chạm ngưỡng, G1 bắt đầu chu kỳ đánh dấu song song |
| {{GC(415) Pause Young (Prepare Mixed) ... 806.441ms}}, {{Evacuate Collection Set: 702.4ms}}, {{Old regions: 640->400}} | Lần mixed đầu tiên dọn 240 old region, nhưng copy object sống tốn 702 ms |
| {{GC(416)/(417) Pause Young (Mixed) ... 812/798 ms}} | Các mixed tiếp theo cũng 800+ ms |
| {{gc_time_ratio = 0.041}} | 4.1% thời gian là GC; phần lớn là các pause dài 800 ms này |

Vì sao mixed GC phải copy nhiều: old gen có 640 region, mỗi region 8 MB, tổng ~5 GB. G1 chỉ chọn region "nhiều rác nhất" (garbage-first), nhưng nếu object sống phân tán đều (mỗi region 45–60% sống), thì gần như mọi region đều phải dọn, và mỗi region phải copy 4–5 MB object sống sang region mới. 240 region × ~4.5 MB ≈ 1.08 GB object phải copy, với 8 worker mất khoảng 700 ms — khớp {{Evacuate Collection Set: 702.4ms}}.

### Vì sao heap 16 GB là gốc rễ

- **IHOP 45%**: G1 chỉ bắt đầu concurrent mark khi old gen vượt 45% heap (~7.2 GB). Nhưng old chỉ 5 GB, vẫn dưới ngưỡng — chu kỳ ở đây bắt đầu do {{G1 Evacuation Pause}} khi heap gần đầy young + old, chứ không phải do IHOP. Dù vậy, khi chu kỳ đã bắt đầu, G1 sẽ dọn dần old region trong các mixed GC.
- **Young quá lớn**: với heap 16 GB, G1 chọn Eden khoảng 620 region (~4.8 GB) để giảm tần suất young GC. Young GC thưa (8 giây) nhưng khi nó xảy ra, lượng object sống phải copy lớn, và ngay sau đó là mixed GC với nhiều old region.
- **Live set nhỏ so với heap**: 5 GB live / 16 GB heap = 31%. Phần 11 GB còn lại là "khoảng trống" G1 phải quản lý, làm mỗi quyết định (chọn region, cỡ young) đều thiên về "gom nhiều để bù".

### Ba lựa chọn

**Option A: {{MaxGCPauseMillis=50}} (hoặc 100)**
- **Cơ chế:** G1 sẽ giảm cỡ young và số old region dọn mỗi mixed GC để cố gắng đạt mục tiêu pause. Kết quả: mixed GC ngắn hơn (có thể 100–200 ms) nhưng **nhiều lần hơn**, tổng thời gian GC có thể tăng (throughput giảm).
- **Ưu:** không cần đổi GC, chỉ một cờ, hiệu quả nhanh.
- **Nhược:** không giải quyết gốc (heap quá lớn); có thể làm tần suất GC tăng, CPU GC tăng; nếu đặt quá thấp (ví dụ 20 ms) G1 sẽ không đạt được mục tiêu và liên tục điều chỉnh, gây pause ngắn nhưng rất thường xuyên.
- **Khi nào dùng:** bước đầu tiên, kết hợp giảm heap.

**Option B: ZGC generational trên JDK 21 ({{-XX:+UseZGC -XX:+ZGenerational}})**
- **Cơ chế:** ZGC không có pause theo kích thước heap; pause chỉ là các "load barrier" vài trăm micro giây, không phụ thuộc old gen size. Mixed GC khái niệm không còn; ZGC dọn old region liên tục, song song.
- **Ưu:** pause gần như phẳng dù heap 16 GB hay 64 GB; phù hợp service latency thấp.
- **Nhược:** cần **JDK 21** (hiện tại đang JDK 17 — phải nâng cấp runtime); tốn CPU hơn G1 (các thread GC chạy liên tục); dùng nhiều native memory hơn; cần đo throughput và CPU trước khi đổi.
- **Khi nào dùng:** khi đã có JDK 21 và mục tiêu p99 dưới 50 ms; là lời giải triệt để.

**Option C: Giảm allocation rate**
- **Cơ chế:** ít object rác → young GC thưa hơn → ít phải evacuate → mixed GC ít áp lực hơn. Nhưng **không giảm độ dài mỗi pause** nếu old gen vẫn giữ nhiều object sống.
- **Ưu:** giảm CPU GC và tần suất, cải thiện tổng thể.
- **Nhược:** không phải lời giải cho pause dài; cần code change (giảm object tạm trong hot path).
- **Khi nào dùng:** luôn nên làm, nhưng không thay thế A hoặc B.

**Đề xuất lộ trình:**
1. **Ngay:** đặt {{-XX:MaxGCPauseMillis=100}}, giảm {{-Xmx}} xuống 8 GB (vẫn gấp 1.6 lần live set), đo lại. Đây là thay đổi nhỏ, rủi ro thấp.
2. **Ngắn hạn:** tối ưu hot path để giảm allocation (audit log bất đồng bộ, tái sử dụng object), giảm tần suất mixed GC.
3. **Dài hạn:** nâng cấp lên **JDK 21**, bật **ZGC generational**, đo p99 và CPU. Nếu CPU tăng quá 10%, cân nhắc giữ G1 với heap 8 GB + MaxGCPauseMillis=100.

### Alert và monitoring

- Alert khi {{gc_pause_p99}} > 200 ms trong 5 phút (hiện tại 800+ ms).
- Alert khi {{rate(jvm_gc_pause_seconds_sum)}} > 0.1 (10% thời gian là GC).
- Theo dõi {{jvm_gc_memory_allocated_bytes_total}} trên mỗi request; nếu allocation tăng đột biến sau deploy, kiểm tra code.
- Theo dõi phân bố pause: nếu mixed GC > 200 ms liên tục, đặt MaxGCPauseMillis hoặc chuyển ZGC.

> Senior tip: Với service latency thấp, **heap lớn không phải lúc nào cũng tốt**. Live set 5 GB thì heap 8 GB là đủ; heap 16 GB làm mỗi mixed GC phải quét nhiều region hơn, pause dài hơn. Khi thấy mixed GC 800 ms mà CPU dư, đừng nghĩ "thiếu CPU" hay "leak" — hãy nhìn **Old regions** trong GC log và tính: số region × % object sống × kích thước region = lượng phải copy. Nếu con số lớn, hoặc giảm heap, hoặc chuyển ZGC.`,
  rubric: [
    'Giải thích đúng cơ chế mixed GC dài: heap 16 GB region 8M, old 640 region ~5 GB rải rác, mỗi mixed dọn 240 region và phải copy ~1 GB object sống, Evacuate Collection Set 702 ms → pause 800-900 ms; CPU dư vì là stop-the-world.',
    'Liên hệ cấu hình: IHOP 45%, MaxGCPauseMillis mặc định 200, live set 5 GB/16 GB = 31%; giải thích vì sao G1 chọn young lớn và gom nhiều old region.',
    'Phân tích đủ 3 lựa chọn: MaxGCPauseMillis (giảm pause nhưng nhiều GC hơn, throughput giảm), ZGC generational JDK 21 (pause phẳng, cần nâng cấp runtime, tốn CPU), giảm allocation (giảm tần suất, không giảm độ dài pause).',
    'Đề xuất lộ trình: ngay lập tức MaxGCPauseMillis + giảm heap 8 GB, ngắn hạn tối ưu allocation, dài hạn ZGC trên JDK 21; có alert pause p99 và gc_time_ratio.',
    'Phân biệt không phải leak (old_after_mixed ổn định ~5 GB) và không phải Full GC (không có Pause Full trong log).'
  ],
  tags: ['g1', 'mixed-gc', 'gc-pause', 'heap-size', 'zgc', 'max-gc-pause', 'latency', 'jdk17', 'jdk21']
},
{
  id: 'lab-gc-017',
  category: 'gc',
  title: 'Adapter webhook tao Java proxy trong ClassLoader moi request lam day Metaspace',
  level: 'senior',
  scenario: `**Bối cảnh:** Công ty **TiniFin** vận hành dịch vụ **webhook-adapter** (Spring Boot 3.2, JDK 17.0.10, G1) nhận thông báo thanh toán từ đối tác. Mỗi đối tác có API khác nhau, nên team xây tính năng "adapter động": mỗi lần nhận webhook, code dùng {{java.lang.reflect.Proxy}} tạo đối tượng đóng gói (wrapper) gọi API đối tác, và tạo **một {{URLClassLoader}} mới** để định nghĩa class proxy của adapter đó (hy vọng tách biệt class giữa các đối tác). Proxy sau đó lưu vào {{webhookAdapterCache}}, một {{ConcurrentHashMap}} static, keyed bởi mã sự kiện webhook, để "xử lý lại nếu cần". JVM: {{-Xmx1g -XX:MaxMetaspaceSize=192m -XX:+UseG1GC}}, pod 2 vCPU, giới hạn bộ nhớ 3Gi.

**Thuật ngữ giải thích:**
- **Heap:** vùng JVM lưu dữ liệu đối tượng (ví dụ {{String}}, {{byte[]}}, instance tạo bởi {{new}}). Thu gom bởi G1 GC.
- **Metaspace:** vùng native memory (ngoài heap) lưu *metadata của class*: tên method, field, bytecode, constant pool. Nói dễ hiểu: heap chứa "sản phẩm" đang làm việc, Metaspace chứa "hồ sơ thiết kế" của từng loại sản phẩm. Giới hạn bởi {{-XX:MaxMetaspaceSize}}, tách biệt hoàn toàn với {{-Xmx}}.
- **Classloader:** thành phần JVM đọc file .class và tạo đối tượng {{Class}} trong Metaspace. Một classloader chỉ được unload (gỡ class, giải phóng Metaspace) khi **không còn đối tượng nào** tham chiếu đến nó và đến các class mà nó nạp.
- **GC root / reachable:** đối tượng còn "đạt được" nếu có đường đi từ gốc (biến static, stack của thread…). Chỉ đối tượng không đạt được mới bị dọn.
- **Proxy (java.lang.reflect.Proxy):** tạo tại runtime một class mới implement một số interface, dùng để can thiệp vào lời gọi method (ví dụ ghi log, chuyển tiếp API).

**Triệu chứng:** Tính năng chạy được khoảng 5 giờ, cả 3 pod lần lượt trả HTTP 500 với {{java.lang.OutOfMemoryError: Metaspace}}. Heap dashboard chỉ khoảng 230 MB / 1 GB. {{jmap -histo}} không thấy class ứng dụng nào tăng bất thường. Dev cho "heap còn trống, nên MaxMetaspaceSize quá nhỏ" và đề xuất tăng lên 512 MB.

**Dữ liệu thu thập:** {{jcmd 1 VM.classloader_stats}} lúc 13:00, metric Prometheus theo giờ, đoạn GC log và log ứng dụng lúc OOM, mã nguồn {{WebhookAdapter}}.`,
  artifacts: [
    {
      name: 'classloader-stats-1300.txt',
      lang: 'text',
      content: `$ kubectl exec webhook-adapter-7f9c8d-k2xpl -- jcmd 1 VM.classloader_stats
1:
ClassLoader                                Parent                     CLD*                Classes   ChunkSz   BlockSz  Type
0x0000000801f3a5b8                         0x0000000800010d48         0x00007f3a2c0a8e40       1      5120      4608
0x0000000801f3a2d0                         0x0000000800010d48         0x00007f3a2c0a8c90       1      5120      4608
0x0000000801f39fe8                         0x0000000800010d48         0x00007f3a2c0a8ae0       1      5120      4608
0x0000000801f39d00                         0x0000000800010d48         0x00007f3a2c0a9300       1      5120      4608
0x0000000801f39a18                         0x0000000800010d48         0x00007f3a2c0a7800       1      5120      4608
... (32728 dòng loader ẩn danh khác, đều Classes 1, ChunkSz 5120, BlockSz 4608, Type trống, cha là 0x0000000800010d48)
0x0000000800d01f28                         0x0000000800010d48         0x00007f3a9c2b5a10     14871  92274688  89912320  org.springframework.boot.loader.launch.LaunchedClassLoader
                                                               1544   4194304   3801088   + hidden classes
0x0000000800010d48                         0x0000000800010a60         0x00007f3a9c1e0c30      102   1048576   940112  jdk.internal.loader.ClassLoaders$AppClassLoader
0x0000000800010a60                         0x0000000000000000         0x00007f3a9c1e0950      112    786432    701232  jdk.internal.loader.ClassLoaders$PlatformClassLoader
0x0000000000000000                         0x0000000000000000         0x00007f3a9c0d7b30     3214  20971520  20512488  <boot class loader>
Total = 32761 loaders                    33102 170584064 160349184
ChunkSz: tổng kích thước các vùng metaspace đã cấp cho từng loader`
    },
    {
      name: 'metrics-hourly.txt',
      lang: 'text',
      content: `# Prometheus, pod webhook-adapter-7f9c8d-k2xpl (khoi dong 08:00:12)
# metaspace = jvm_memory_used_bytes{area="nonheap",id="Metaspace"}
# classes_loaded = jvm_classes_loaded_classes
# classes_unld = jvm_classes_unloaded_classes_total
# heap_after_gc = heap dung luong sau mixed GC gan nhat

time    metaspace   classes_loaded  classes_unld  heap_after_gc  webhook/s  http_5xx/s
08:05     106.6 MB            20238             0         231 MB       0.72         0
09:00     123.4 MB            22730             0         234 MB       0.70         0
10:00     140.2 MB            25230             0         233 MB       0.69         0
11:00     157.0 MB            27730             0         235 MB       0.71         0
12:00     173.8 MB            30230             0         236 MB       0.70         0
13:00     190.6 MB            32730             0         238 MB       0.71         0
13:41     192.0 MB            33900             0         238 MB       0.00        31.6

# Webhook dang ky moi cua mot doi tac moi, gui lien tuc tu 08:00`
    },
    {
      name: 'gc-and-app-1342.txt',
      lang: 'text',
      content: `[2026-10-27T13:41:51.114+0700][20231.114s][info][gc] GC(1622) Pause Young (Concurrent Start) (Metadata GC Threshold) 402M->238M(1024M) 16.440ms
[2026-10-27T13:41:51.114+0700][20231.114s][info][gc,metaspace] GC(1622) Metaspace: 190120K(192512K)->190120K(192512K) NonClass: 166512K(167424K)->166512K(167424K) Class: 23608K(25088K)->23608K(25088K)
[2026-10-27T13:41:52.020+0700][20232.020s][info][gc] GC(1623) Pause Remark 430M->428M(1024M) 28.110ms
[2026-10-27T13:41:52.020+0700][20232.020s][info][gc,metaspace] GC(1623) Metaspace: 190120K(192512K)->190120K(192512K) NonClass: 166512K(167424K)->166512K(167424K) Class: 23608K(25088K)->23608K(25088K)
[2026-10-27T13:41:53.311+0700][20233.311s][info][gc] GC(1623) Concurrent Mark Cycle 1016.115ms
[2026-10-27T13:41:56.410+0700][20235.410s][info][gc] GC(1624) Pause Full (Metadata GC Threshold) 400M->238M(1024M) 1188.602ms
[2026-10-27T13:41:56.410+0700][20235.410s][info][gc,metaspace] GC(1624) Metaspace: 196410K(196608K)->196410K(196608K) NonClass: 170980K(170752K)->170980K(170752K) Class: 25430K(25856K)->25430K(25856K)
[2026-10-27T13:41:57.990+0700][20236.990s][info][gc] GC(1625) Pause Full (Metadata GC Clear Soft References) 238M->236M(1024M) 1241.330ms
[2026-10-27T13:41:57.990+0700][20236.990s][info][gc,metaspace] GC(1625) Metaspace: 196410K(196608K)->196410K(196608K) NonClass: 170980K(170752K)->170980K(170752K) Class: 25430K(25856K)->25430K(25856K)

{"@timestamp":"2026-10-27T13:41:55.102+07:00","level":"INFO","thread_name":"http-nio-8080-exec-3","logger_name":"vn.tinifin.webhook.WebhookController","message":"webhook id=WH-882102 partner=M-2231","traceId":"6721f1c5a3e94b0d"}
{"@timestamp":"2026-10-27T13:42:01.504+07:00","level":"ERROR","thread_name":"http-nio-8080-exec-37","logger_name":"o.a.c.c.C.[.[.[/].[dispatcherServlet]","message":"Servlet.service() for servlet [dispatcherServlet] in context with path [] threw exception [Handler dispatch failed: java.lang.OutOfMemoryError: Metaspace] with root cause","traceId":"6721f1c5b81c22aa","stack_trace":"java.lang.OutOfMemoryError: Metaspace
    at java.base/java.lang.ClassLoader.defineClass1(Native Method)
    at java.base/java.lang.ClassLoader.defineClass(ClassLoader.java:1012)
    at java.base/java.lang.reflect.Proxy$ProxyClassFactory.apply(Proxy.java:643)
    at java.base/java.lang.reflect.Proxy.getProxyClass0(Proxy.java:439)
    at java.base/java.lang.reflect.Proxy.newProxyInstance(Proxy.java:745)
    at vn.tinifin.webhook.WebhookAdapter.adapterFor(WebhookAdapter.java:42)
    at vn.tinifin.webhook.WebhookController.handle(WebhookController.java:31)
    ..."}
{"@timestamp":"2026-10-27T13:42:01.733+07:00","level":"WARN","thread_name":"HikariPool-1 housekeeper","logger_name":"com.zaxxer.hikari.pool.HikariPool","message":"HikariPool-1 - Thread starvation or clock leap detected (housekeeper delta=32s417ms).","traceId":""}`,
    },
    {
      name: 'WebhookAdapter.java',
      lang: 'text',
      content: `package vn.tinifin.webhook;

import java.lang.reflect.Proxy;
import java.net.URL;
import java.net.URLClassLoader;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.stereotype.Component;

@Component
public class WebhookAdapter {

    // Cache adapter theo ma su kien webhook KHONG bao giu xoa
    private static final Map<String, Object> webhookAdapterCache = new ConcurrentHashMap<>();

    public Object adapterFor(String webhookId, Class<?> markerInterface) {
        Object cached = webhookAdapterCache.get(webhookId);
        if (cached != null) {
            return cached;
        }

        // TAI SAU: tao ClassLoader MOI moi request de "tach biet doi tac"
        ClassLoader loader = new URLClassLoader(new URL[0], WebhookAdapter.class.getClassLoader());
        Object proxy = Proxy.newProxyInstance(loader,
                new Class<?>[]{markerInterface},
                (proxyObj, method, args) -> {
                    // chuyen tiep den API doi tac
                    return null;
                });

        webhookAdapterCache.put(webhookId, proxy);  // luu vinh vien, khong co TTL hoac eviction
        return proxy;
    }
}`
    }
  ],
  questions: [
    'Vì sao heap chỉ khoảng 230 MB trong khi JVM ném OutOfMemoryError: Metaspace? Vì sao jmap -histo không thấy class nào tăng bất thường?',
    'Dùng classloader_stats và metric, hãy chứng minh nguyên nhân gốc: bao nhiêu loader, mỗi loader nạp bao nhiêu class, cha là ai, class nào bị unload (classes_unloaded_classes_total)? Số class tăng đúng số webhook/giây không?',
    'Bạn sửa ngắn hạn và dài hạn thế nào? Tăng MaxMetaspaceSize lên 512 MB hoặc bỏ giới hạn có phải ý hay không? Cần alert/monitoring gì?'
  ],
  hints: [
    'Metaspace là vùng native memory (ngoài heap) lưu metadata của class; jmap -histo chỉ đếm object trên heap, không thấy phần này. Xem cột Classes/Parent/Type trong classloader_stats: có bao nhiêu loader, mỗi loader nạp bao nhiêu class, cha là ai?',
    'jvm_classes_unloaded_classes_total bang 0, classes_loaded tang khoang 2.500/gio, dung voi so webhook/giay. Nghia la class van reachable, GC khong unload duoc.',
    'Proxy.newProxyInstance(loader, ...) voi loader moi moi request; instance proxy duoc luu trong webhookAdapterCache (static) khong bao giu xoa -> loader khong bao giu du dieu kien GC -> class khong unload -> Metaspace phinh len.'
  ],
  answer: `**Tóm tắt:** Đây là **class loader leak làm đầy Metaspace**. Mỗi webhook, {{WebhookAdapter.adapterFor}} tạo một {{URLClassLoader}} mới, dùng {{Proxy.newProxyInstance(loader, ...)}} sinh ra một class proxy mới, rồi gắn proxy vào map static {{webhookAdapterCache}} keyed bởi mã webhook và không bao giờ xóa. Chuỗi tham chiếu: map static (GC root, sống suốt đời ứng dụng) → instance proxy → class proxy → classloader định nghĩa class → metadata class nằm trong Metaspace. Vì loader không bao giờ đủ điều kiện được unload, mỗi webhook vĩnh viễn chiếm khoảng 6–8 KB Metaspace. Lúc 0,72 webhook/giây → khoảng 2.500 class/giờ → khoảng 16–17 MB Metaspace/giờ → chạm {{-XX:MaxMetaspaceSize=192m}} sau khoảng 5,5 giờ. Heap vẫn trống vì lỗi nằm ở vùng native Metaspace, không phải heap. Sửa là ngừng tạo loader mới mỗi request, giới hạn cache (theo partnerId, có TTL/maximumSize), xóa entry không dùng nữa; không nên chỉ tăng MaxMetaspaceSize.

### Metaspace và heap: hai vùng nhớ khác nhau

**Heap** là nơi JVM lưu dữ liệu đối tượng (ví dụ {{String}}, {{byte[]}}, instance tạo bởi {{new}}). Khi bạn viết {{new ProductDetail()}}, object nằm trên heap. G1 GC dọn heap: object không còn ai tham chiếu được thu hồi.

**Metaspace** là vùng native memory (bên ngoài heap, hệ điều hành cấp phát) lưu *metadata của class*: tên class, method, field, bytecode, constant pool, annotation. Dễ hình dung: heap là "bàn làm việc" chứa sản phẩm đang xử lý; Metaspace là "tủ hồ sơ thiết kế" chứa giấy phép chế tạo mỗi loại sản phẩm. Việc tạo class mới (ví dụ Groovy compile, proxy động) ghi hồ sơ mới vào tủ này.

**Classloader** là nhân viên vào kho lấy hồ sơ thiết kế ra. Khi ứng dụng cần class {{vn.tinifin.webhook.Something}}, classloader đọc file .class, tạo đối tượng {{Class}} và lưu metadata vào Metaspace.

**Unload class** chỉ xảy ra khi **toàn bộ** classloader không còn reachable: không còn tham chiếu từ GC root (biến static, stack thread…), không còn instance sống của class do nó nạp, không còn đối tượng {{Class}} được giữ. Lúc đó GC mới gỡ classloader và giải phóng Metaspace tương ứng. G1 chỉ unload class trong các ciclo GC nhất định (ví dụ Remark, Full GC); không có cách unload từng class riêng lẻ.

**Proxy (java.lang.reflect.Proxy)** tạo tại runtime một class mới implement một số interface (ví dụ {{PaymentAdapter}}), dùng để can thiệp vào lời gọi method. Class proxy mới này được định nghĩa bởi một classloader được chọn.

Ví dụ đời thường: một văn phòng có hồ sơ thiết kế cho từng loại máy. Mỗi lần đặt hàng máy mới, nhân viên lấy hồ sơ mới vào tủ. Nếu nhân viên **không bao giờ vứt hồ sơ cũ**, dù máy đã bán hết, tủ hồ sơ vẫn đầy. Metaspace đầy giống như vậy: class đã không dùng nữa nhưng classloader giữ hồ sơ → không unload được.

### Nguyên nhân gốc

Ba yếu tố cùng nhau tạo ra rò rỉ:

1. **Tạo classloader mới mỗi request:** mỗi webhook, code tạo một {{URLClassLoader}} mới (loader L) để định nghĩa class proxy.
2. **Sinh class proxy mới mỗi lần:** {{Proxy.newProxyInstance(loader, ...)}} với loader L mới sinh ra class {{ $Proxy1 }} riêng trong L. Mỗi class+loader tốn khoảng 6–8 KB Metaspace.
3. **Cache static không bao giờ xóa:** instance proxy được gắn vào {{webhookAdapterCache}} keyed bởi mã webhook (mỗi webhook một khóa mới), sống trâu qua cả đời ứng dụng.

Chuỗi tham chiếu giữ loader sống:

~~~text
GC root: bien static webhookAdapterCache
  -> ConcurrentHashMap -> Node.value (instance proxy)
     -> Class cua proxy ($Proxy1)
     -> ClassLoader L (URLClassLoader tao moi request)
        -> metadata class proxy trong Metaspace (khoang 6-8 KB)
~~~

Vì map static là GC root và không bao giờ xóa entry, loader L không bao giờ đủ điều kiện unload → mỗi webhook vĩnh viễn chiếm Metaspace.

### Dẫn chứng từ artifact

| Chỉ số | Giá trị | Ý nghĩa |
|---|---|---|
| classloader_stats | 32.728 loader ẩn danh, mỗi cái Classes 1, cha là AppClassLoader (0x0000000800010d48), Type trống | Mỗi loader chỉ định nghĩa 1 class proxy; mẫu điển hình của tạo loader lặp lại |
| classloader_stats | Tổng 32.761 loader; ngay cả LaunchedClassLoader (toàn bộ Spring + ứng dụng) chỉ 14.871 class, khoảng 88 MB | Hầu hết loader là class loader rác từ adapter động |
| Metric | classes_loaded 20.238 → 32.730 (tăng khoảng 2.500/giờ), classes_unld = 0 suốt 5 giờ | Tốc độ tăng class khớp đúng 0,7 webhook/giây; class không bao giờ được unload |
| Metric | Metaspace 106,6 → 190,6 MB (tăng khoảng 17 MB/giờ), heap ~231–238 MB phẳng | Lỗi ở Metaspace (native), không phải heap |
| GC log | Pause Young (Metadata GC Threshold), hai Full GC (Metadata GC Threshold, Clear Soft References) nhưng Metaspace không giảm (196410K→196410K), committed 196608K = 192 MB | GC đã cố hết sức nhưng không unload được classloader nào |
| Stack trace | OOM tại {{ClassLoader.defineClass1}} → {{Proxy$ProxyClassFactory.apply}} → {{Proxy.newProxyInstance}} → {{WebhookAdapter.adapterFor(WebhookAdapter.java:42)}} | Xảy ra đúng khi tạo class proxy mới cho webhook |
| jmap -histo | Không thấy class ứng dụng tăng bất thường | Histogram chỉ đếm object heap; metadata class proxy vài KB nằm trong Metaspace, không hiển thị |

2.500 class × khoảng 6,8 KB ≈ 17 MB/giờ; từ 106,6 MB lúc 08:05 đạt gần 192 MB vào 13:00, OOM vào 13:42 — khớp chính xác với timeline sự cố.

### Cách sửa

**Ngắn hạn (mua thời gian):**
- Rolling restart pod trong khung ít giao dịch để reset Metaspace (chỉ chữa cháy, rò rỉ vẫn lặp lại).
- Tạm thời giới hạn số webhook xử lý liên tục hoặc tắt tính năng adapter động khi tải cao.

**Dài hạn (sửa gốc):**
1. Không tạo {{URLClassLoader}} mới mỗi request. Dùng chung class loader của ứng dụng, hoặc hạn chế tạo class động chỉ khi thực sự cần.
2. Cache theo {{partnerId}} (số đối tác là hữu hạn) thay vì mã webhook (vô hạn); dùng Caffeine có {{maximumSize}} và {{expireAfterWrite}}; xóa entry khi không cần nữa.

~~~java
@Component
public class WebhookAdapter {

    private final Cache<String, Object> adapterCache = Caffeine.newBuilder()
            .maximumSize(10_000)                 // so doi tac co han
            .expireAfterWrite(Duration.ofMinutes(30))
            .build();

    public Object adapterFor(String partnerId, Class<?> markerInterface) {
        return adapterCache.get(partnerId, key -> {
            ClassLoader loader = WebhookAdapter.class.getClassLoader();   // dung chung loader cua ung dung
            return Proxy.newProxyInstance(loader,
                    new Class<?>[]{markerInterface},
                    (proxyObj, method, args) -> {
                        // chuyen tiep den API doi tac
                        return null;
                    });
        });
    }
}
~~~

Mỗi {{partnerId}} chỉ tạo một lần, số loader bằng số đối tác (có hạn); entry hết hạn thì Caffeine xoá → loader đủ điều kiện unload → Metaspace được giải phóng.

### Tại sao không chỉ tăng MaxMetaspaceSize

- Chỉ dịch chuyển sự cố: từ khoảng 5,5 giờ lên khoảng 17 giờ, rò rỉ vẫn tiếp tục, OOM lại xảy ra.
- Nếu bỏ giới hạn (mặc định là không giới hạn), Metaspace sẽ ăn dần vào memory limit của container (3Gi) và pod bị **OOMKilled** mà không có stack trace, chẩn đoán khó hơn nhiều.
- Giữ giới hạn hợp lý (192m) để lỗi lộ ra rõ ràng là đúng.

### Phòng ngừa và alert

- Theo dõi {{jvm_classes_loaded_classes}} và {{jvm_classes_unloaded_classes_total}}: loaded tăng liên tục trong khi unloaded gần 0 → cảnh báo class loader leak.
- Cảnh báo Metaspace dùng trên 75–80% {{MaxMetaspaceSize}}.
- Cảnh báo khi GC log có cause {{Metadata GC Threshold}} lặp lại liên tục.
- Test soak: gửi webhook liên tục nhiều ngày, quan sát classes unloaded > 0 sau warm-up và Metaspace ổn định.
- Code review: cấm tạo classloader/class động trong đường đi request nếu không có kế hoạch unload rõ ràng.

> Senior tip: Khi thấy {{OutOfMemoryError: Metaspace}} nhưng heap còn trống, hãy hỏi: "cái gì đang nạp class liên tục?" (script engine, proxy động, Groovy, CGLIB, redeploy…). Ba lệnh cứu cánh: {{jcmd <pid> VM.metaspace}} (Metaspace còn bao nhiêu, ngưỡng GC), {{jcmd <pid> VM.classloader_stats}} (loader nào nhiều bất thường), và metric classes loaded so với unloaded. Nếu unloaded gần bằng 0 trong khi loaded tăng theo một hành động nghiệp vụ (tạo adapter, reload quy tắc…), bạn gần như chắc chắn có class loader leak. Sửa thật sự là cắt đứt mọi tham chiếu để loader trở thành rác, chứ không phải cho Metaspace to hơn.`,
  rubric: [
    'Phân biệt đúng Metaspace (vùng native lưu metadata class) với heap (lưu object): OOM Metaspace xảy ra dù heap còn trống; jmap -histo không thấy được.',
    'Chỉ ra nguyên nhân gốc: tạo URLClassLoader + class proxy mới mỗi webhook; instance bị giữ trong map static keyed mã webhook không xóa → loader không unload.',
    'Dẫn chứng: khoảng 32.700 loader ẩn danh mỗi cái 1 class, cha là AppClassLoader; classes_loaded tăng khoảng 2.500/giờ khớp webhook/s; classes_unloaded = 0; Metaspace tăng khoảng 17 MB/giờ đến chạm 192 MB; hai Full GC (Metadata GC Threshold, Clear Soft References) không giảm được Metaspace.',
    'Đề xuất sửa: ngừng tạo loader mỗi request, cache theo partnerId với maximumSize/TTL, xóa entry không dùng; giải thích tăng MaxMetaspaceSize chỉ trì hoãn, bỏ giới hạn gây OOMKilled.',
    'Giám sát: alert classes_loaded tăng còn unloaded không, Metaspace > 75–80%, Metadata GC Threshold lặp lại; test soak; code review cấm tạo class động trong request path.'
  ],
  tags: ['metaspace', 'class-loader', 'proxy', 'oom', 'jdk17']
},
{
  id: 'lab-gc-018',
  category: 'gc',
  title: 'Lich su giao dich: heap 12 GB nhung live chi 3 GB, mixed GC 850 ms lam p99 chot 1 giay',
  level: 'senior',
  scenario: `**Bối cảnh:** Công ty **VimoPay** vận hành dịch vụ **txn-history** (Spring Boot 3.2, JDK 17.0.10, G1) tra cứu lịch sử giao dịch ví — cần latency thấp (SLA p99 dưới 100 ms). Pod 8 vCPU, giới hạn bộ nhớ 24Gi.

JVM chạy với {{-Xms12g -Xmx12g}}, **không đặt {{-XX:MaxGCPauseMillis}}** (mặc định 200 ms), **không đổi {{-XX:InitiatingHeapOccupancyPercent}} (IHOP, mặc định 45%)**, region size mặc định (4 MB với heap 12 GB → 3072 region). Live set thực sau mixed GC chỉ khoảng **3 GB** (khoảng 750–1152 vùng old chứa dữ liệu sống), trong khi heap là 12 GB.

**Thuật ngữ giải thích:**
- **G1 (Garbage-First):** bộ thu gom rác mặc định của JDK 17, chia heap thành các vùng (region) bằng nhau và ưu tiên dọn vùng nhiều rác nhất trước.
- **Region / vùng:** ô nhớ cố định (ở đây 4 MB). Heap 12 GB có 3072 vùng.
- **Young GC:** dọn Eden + Survivor (vùng chứa object mới), dừng ứng dụng nhưng ngắn (khoảng vài chục ms).
- **Concurrent Mark:** đánh dấu object sống/chết trong old gen **song song với ứng dụng**, không dừng app.
- **Mixed GC:** young GC kết hợp dọn một phần vùng old; là loại pause dài nhất trong hoạt động bình thường của G1, và là **stop-the-world** (dừng toàn bộ ứng dụng).
- **Stop-the-world:** tất cả thread ứng dụng bị tạm dừng khi GC chạy.
- **Live set:** dữ liệu sống thực tế, tương đương heap ngay sau GC.
- **IHOP (Initiating Heap Occupancy Percent):** ngưỡng old gen kích hoạt chu kỳ đánh dấu đồng thời (mặc định 45% heap).
- **MaxGCPauseMillis:** "mục tiêu" thời gian pause mong muốn của G1 (mặc định 200 ms); G1 dùng nó để quyết định kích thước young và số vùng old dọn mỗi lần.
- **ZGC generational:** bộ thu gom rác của JDK 21+, pause gần như không phụ thuộc kích thước heap (bật bằng {{-XX:+UseZGC -XX:+ZGenerational}}, mặc định từ JDK 23).
- **Allocation rate:** tốc độ tạo rác (byte/giây).

**Triệu chứng:** Tháng này p99 của GET /api/transactions/{accountId} tăng từ 40 ms lên **900–950 ms**, đợt chạm **1,1 giây**. CPU pod chỉ 40–55% (còn dư), không có Full GC, không có lỗi, traffic ổn định khoảng 4.200 request/giây mỗi pod. GC log cho thấy young GC thưa (khoảng mỗi 8 giây) nhưng **mixed GC kéo dài 850–950 ms** mỗi 20–40 giây.

**Dữ liệu thu thập:** GC log JDK 17 (unified logging) của pod, metric Prometheus theo giờ, kết quả {{jcmd VM.flags}} và đoạn code hot path.`,
  artifacts: [
    {
      name: 'gc-txn-history.log',
      lang: 'text',
      content: `[2026-10-28T08:00:00.012+0700][0.012s][info][gc,init] Version: 17.0.10+7 (release)
[2026-10-28T08:00:00.012+0700][0.012s][info][gc,init] CPUs: 8 total, 8 available
[2026-10-28T08:00:00.012+0700][0.012s][info][gc,init] Memory: 24576M
[2026-10-28T08:00:00.012+0700][0.012s][info][gc,init] Heap Region Size: 4M
[2026-10-28T08:00:00.012+0700][0.012s][info][gc,init] Heap Min Capacity: 12G
[2026-10-28T08:00:00.012+0700][0.012s][info][gc,init] Heap Initial Capacity: 12G
[2026-10-28T08:00:00.012+0700][0.012s][info][gc,init] Heap Max Capacity: 12G
[2026-10-28T08:00:00.012+0700][0.012s][info][gc,init] Parallel Workers: 8
[2026-10-28T08:00:00.012+0700][0.012s][info][gc,init] Concurrent Workers: 3
... (young GC thua, da luoc bo) ...
[2026-10-28T10:14:55.102+0700][8095.102s][info][gc] GC(412) Pause Young (Normal) (G1 Evacuation Pause) 6120M->3120M(12288M) 35.441ms
[2026-10-28T10:15:03.330+0700][8103.330s][info][gc,start] GC(413) Pause Young (Concurrent Start) (G1 Evacuation Pause)
[2026-10-28T10:15:03.330+0700][8103.330s][info][gc,task] GC(413) Using 8 workers of 8 for evacuation
[2026-10-28T10:15:03.392+0700][8103.392s][info][gc,phases] GC(413)   Evacuate Collection Set: 58.1ms
[2026-10-28T10:15:03.392+0700][8103.392s][info][gc,heap] GC(413) Eden regions: 620->0(620)
[2026-10-28T10:15:03.392+0700][8103.392s][info][gc,heap] GC(413) Survivor regions: 20->40(200)
[2026-10-28T10:15:03.392+0700][8103.392s][info][gc,heap] GC(413) Old regions: 640->640
[2026-10-28T10:15:03.392+0700][8103.392s][info][gc,heap] GC(413) Humongous regions: 0->0
[2026-10-28T10:15:03.392+0700][8103.392s][info][gc] GC(413) Pause Young (Concurrent Start) (G1 Evacuation Pause) 6150M->3140M(12288M) 38.112ms
[2026-10-28T10:15:04.330+0700][8104.330s][info][gc] GC(414) Concurrent Mark Cycle
[2026-10-28T10:15:05.301+0700][8105.301s][info][gc,marking] GC(414) Concurrent Mark (8103.393s, 8104.330s) 908.104ms
[2026-10-28T10:15:05.312+0700][8105.312s][info][gc] GC(414) Pause Remark 3210M->3204M(12288M) 11.221ms
[2026-10-28T10:15:05.323+0700][8105.323s][info][gc] GC(414) Pause Cleanup 3204M->3204M(12288M) 0.412ms
[2026-10-28T10:15:05.330+0700][8105.330s][info][gc] GC(414) Concurrent Mark Cycle 936.221ms
[2026-10-28T10:15:07.812+0700][8107.812s][info][gc,start] GC(415) Pause Young (Prepare Mixed) (G1 Evacuation Pause)
[2026-10-28T10:15:07.812+0700][8107.812s][info][gc,task] GC(415) Using 8 workers of 8 for evacuation
[2026-10-28T10:15:08.512+0700][8108.512s][info][gc,phases] GC(415)   Evacuate Collection Set: 710.4ms
[2026-10-28T10:15:08.512+0700][8108.512s][info][gc,phases] GC(415)   Post Evacuate Collection Set: 84.2ms
[2026-10-28T10:15:08.512+0700][8108.512s][info][gc,heap] GC(415) Eden regions: 610->0(120)
[2026-10-28T10:15:08.512+0700][8108.512s][info][gc,heap] GC(415) Survivor regions: 40->60(200)
[2026-10-28T10:15:08.512+0700][8108.512s][info][gc,heap] GC(415) Old regions: 768->512
[2026-10-28T10:15:08.512+0700][8108.512s][info][gc,heap] GC(415) Humongous regions: 0->0
[2026-10-28T10:15:08.512+0700][8108.512s][info][gc] GC(415) Pause Young (Prepare Mixed) (G1 Evacuation Pause) 6380M->3040M(12288M) 830.441ms
[2026-10-28T10:15:08.512+0700][8108.512s][info][gc,cpu] GC(415) User=6.41s Sys=0.02s Real=0.83s
[2026-10-28T10:15:09.330+0700][8109.330s][info][gc] GC(416) Pause Young (Mixed) (G1 Evacuation Pause) 5520M->3080M(12288M) 821.204ms
[2026-10-28T10:15:10.142+0700][8110.142s][info][gc] GC(417) Pause Young (Mixed) (G1 Evacuation Pause) 5380M->3060M(12288M) 798.512ms
... (chu ky Concurrent Start roi 2-3 mixed GC dai 800-900 ms lap lai moi 20-40 giay) ...
[2026-10-28T10:22:48.771+0700][8528.771s][info][gc] GC(438) Pause Young (Mixed) (G1 Evacuation Pause) 5410M->3060M(12288M) 821.334ms]`,
    },
    {
      name: 'prometheus-and-flags.txt',
      lang: 'text',
      content: `# Prometheus, pod txn-history-7f9c8d-k2xpl, 10:00-10:20 (8 vCPU)
# gc_pause_p99 = histogram_quantile(0.99, rate(jvm_gc_pause_seconds_bucket[5m]))
# gc_time_ratio = rate(jvm_gc_pause_seconds_sum[5m])
# alloc_rate = rate(jvm_gc_memory_allocated_bytes_total[5m])
# old_after_mixed = old gen dung luong sau mixed GC gan nhat

time    gc_young_count  gc_mixed_count  gc_pause_p99  gc_time_ratio  alloc_rate  old_after_mixed  http_p99
10:00        118              9           0.89 s        0.044          0.39 GB/s      3.02 GB        912 ms
10:10        121             11           0.87 s        0.045          0.40 GB/s      3.04 GB        894 ms
10:20        119             10           0.91 s        0.043          0.41 GB/s      3.01 GB        931 ms

# jcmd 1 VM.flags | grep -E 'MaxGCPauseMillis|G1HeapRegionSize|InitiatingHeapOccupancyPercent|UseG1GC|MaxHeapSize'
-XX:MaxGCPauseMillis=200
-XX:G1HeapRegionSize=4194304
-XX:InitiatingHeapOccupancyPercent=45
-XX:+UseG1GC
-XX:MaxHeapSize=12884901888

# jcmd 1 GC.heap_info
garbage-first heap   total 12884901888K, used 3145728000K
  region size 4096K, 120 young (491520K), 60 survivors (245760K), 512 old (2097152K)
# Note: used ≈ 2.9 GB; region size 4M; tổng 3072 vùng = 12 GB. Sau mixed GC old còn ~512 vùng (~2 GB), live set ổn định ~3 GB.`
    },
    {
      name: 'TransactionHistoryService.java',
      lang: 'text',
      content: `package vn.vimopay.history;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

@Service
public class TransactionHistoryService {

    private final TransactionRepository repo;
    private final ObjectMapper mapper = new ObjectMapper();   // tao moi moi service instance
    private final AuditLogger auditLogger;                    // gui log bat dong bo

    public TransactionPage history(String accountId, Pageable page) {
        TransactionPage page = repo.findByAccount(accountId, page);   // lay theo trang, khong load toan bo
        // moi request xuat log kiem tra: serialize toan bo trang giao dich ra JSON (tieu tuc bo nho)
        String audit = mapper.writeValueAsString(page.getContent());
        auditLogger.log("history", accountId, audit);
        return page;
    }
}`
    }
  ],
  questions: [
    'Vì sao mixed GC 850–950 ms nhung CPU con du va khong co Full GC? Giai thich tu GC log.',
    'Heap 12 GB nhung live set khoang 3 GB: G1 phai don bao nhieu vung old moi chu ky mixed, va IHOP 45% lien quan the nao den van de?',
    'Ba lua chon: (a) dat MaxGCPauseMillis=100, (b) chuyen sang ZGC generational tren JDK 21, (c) giam allocation rate. Phan uu/nhuoc va de xuat lo trinh. Alert nao can them?'
  ],
  hints: [
    'Doc dong "Heap Region Size: 4M" va "Heap Max Capacity: 12G". Old gen chua khoang 768 vung (~3 GB) chua du lieu song thom trong vung 12 GB. Moi mixed GC copy object song sang vung moi, pause ty so voi luong object bi chuyen, khong ty so voi kich thuc heap.',
    'MaxGCPauseMillis 200 ms chi la muc tieu; heap lon so voi live set lam G1 chon young lon va gom nhieu vung old mot lan -> pause vuot qua muc tieu. IHOP 45%: old phai vuot 45% heap (khoang 5.4 GB) moi bat dau danh dau; tai day old khoang 3 GB duoi ngưỡng nhung chu ky van xay do young gan day.',
    'ZGC generational JDK 21 pause khong phu thuoc kich thuc heap nhan can nang cap runtime; giam allocation giam tan suat GC khong giam do dai moi pause.'
  ],
  answer: `**Tóm tắt:** Đây là **mixed GC quá dài do heap quá lớn so với live set**, không phải rò rỉ bộ nhớ và không phải Full GC. Heap 12 GB, vùng 4 MB → 3072 vùng; live set thực sau mixed GC chỉ khoảng 3 GB (khoảng 750–1152 vùng old chứa dữ liệu sống). Mỗi chu kỳ mixed, G1 phải copy đối tượng sống từ nhiều vùng old sang vùng mới; vì mỗi vùng còn chứa khoảng 40–60% đối tượng sống, chi phí evacuate cao, pause 850–950 ms. CPU còn dư vì đây là pause dừng toàn bộ ứng dụng, không phải thiếu CPU. Lộ trình: ngay lập tức {{-XX:MaxGCPauseMillis=100}} và giảm heap xuống 6–8 GB; ngắn hạn giảm allocation rate; dài hạn nâng JDK 21, dùng ZGC generational.

### Doc GC log buoc buoc

| Dòng log | Ý nghĩa |
|---|---|
| {{Heap Region Size: 4M, Heap Max Capacity: 12G}} | Heap có 3072 vùng, mỗi vùng 4 MB |
| {{GC(412) Pause Young (Normal) 6120M->3120M(12288M) 35.441ms}} | Young GC thưa (khoảng 8 giây một lần), pause ngắn |
| {{GC(413) Pause Young (Concurrent Start) ... 38.112ms}}, {{GC(414) Concurrent Mark Cycle}} | Old gen gần ngưỡng, G1 bắt đầu chu kỳ đánh dấu song song |
| {{GC(415) Pause Young (Prepare Mixed) ... 830.441ms}}, {{Evacuate Collection Set: 710.4ms}}, {{Old regions: 768->512}} | Lần mixed đầu dọn 256 vùng old, copy object sống tốn 710 ms |
| {{GC(416)/(417) Pause Young (Mixed) ... 821/798 ms}} | Các mixed tiếp theo cũng 800+ ms |
| {{gc_time_ratio = 0.044}} | 4,4% thời gian là GC; phần lớn là các pause dài 800 ms |

Vì sao mixed GC phải copy nhiều: old gen có 768 vùng, mỗi vùng 4 MB, tổng khoảng 3 GB. G1 chỉ chọn vùng "nhiều rác nhất" (garbage-first), nhưng nếu object sống phân tán đều (mỗi vùng 40–60% sống), gần như mọi vùng đều phải dọn, và mỗi vùng phải copy 1,6–2,4 MB object sống sang vùng mới. 256 vùng × khoảng 2 MB ≈ 500 MB object phải copy, với 8 worker mất khoảng 700 ms — khớp {{Evacuate Collection Set: 710.4ms}}. Tổng pause 830 ms, khớp p99 900 ms trên dashboard.

### Tai sao heap 12 GB lam pause dai

- **IHOP 45%:** G1 chỉ bắt đầu concurrent mark khi old gen vượt 45% heap (khoảng 5,4 GB). Ở đây old khoảng 3 GB, dưới ngưỡng, nhưng chu kỳ khởi động vì young gần đầy (dòng {{Concurrent Start}} ở young GC). Khi chu kỳ đã bắt đầu, G1 dọn dần vùng old trong các mixed GC.
- **Young quá lớn:** với heap 12 GB, G1 chọn Eden khoảng 620 vùng (khoảng 2,4 GB) để young GC ít hơn. Young GC thưa nhưng sau đó là mixed GC với nhiều vùng old.
- **Live set nhỏ so với heap:** 3 GB live / 12 GB heap = 25%. Phần còn lại là "khoảng trống" G1 phải quản lý, làm mỗi quyết định (chọn vùng, kích thước young) thiên về "gom nhiều để bù".

### Ba lua chon

**Option A: {{-XX:MaxGCPauseMillis=100}} (hoặc 200)**
- Cơ chế: G1 giảm kích thước young và số vùng old dọn mỗi mixed GC để cố gắng đạt mục tiêu pause. Kết quả: mixed GC ngắn hơn (khoảng 100–200 ms) nhưng **nhiều lần hơn**, tổng thời gian GC có thể tăng (throughput giảm).
- Ưu: không cần đổi JVM, chỉ một cờ, hiệu quả nhanh, rủi ro thấp.
- Nhược: không giải quyết gốc (heap quá lớn); có thể làm tần suất GC và CPU GC tăng.
- Khi nào dùng: bước đầu tiên, kết hợp giảm heap.

**Option B: ZGC generational trên JDK 21 ({{-XX:+UseZGC -XX:+ZGenerational}})**
- Cơ chế: ZGC pause không phụ thuộc kích thước heap (chỉ vài trăm micro giây, load barrier); không có khái niệm mixed GC, dọn vùng old liên tục, song song.
- Ưu: pause gần như phẳng dù heap 12 GB hay 64 GB; phù hợp dịch vụ latency thấp.
- Nhược: cần **nâng JDK 17 lên JDK 21**; tốn CPU hơn G1 (các thread GC chạy liên tục); dùng nhiều native memory hơn; cần đo throughput và CPU trước khi đổi.
- Khi nào dùng: đã có JDK 21 và mục tiêu p99 dưới 50 ms; là lời giải triệt để.

**Option C: Giảm allocation rate**
- Cơ chế: ít object rác → young GC ít hơn → ít áp lực mixed. Nhưng **không giảm độ dài mỗi pause** nếu old gen vẫn giữ nhiều object sống.
- Ưu: giảm CPU GC và tần suất, cải thiện tổng thể.
- Nhược: không phải lời giải cho pause dài; cần thay đổi code (giảm object tạm trong hot path).
- Khi nào dùng: luôn nên làm, nhưng không thay thế A hoặc B.

**De xuat lo trinh:**
1. **Ngay:** đặt {{-XX:MaxGCPauseMillis=100}}, giảm {{-Xmx}} xuống 8 GB (vẫn gấp hơn 2 lần live set 3 GB), đo lại. Thay đổi nhỏ, rủi ro thấp.
2. **Ngan han:** toi uu hot path de giam allocation (audit log bat dong bo, lay theo trang thay het bo, tai su dung ObjectMapper), giam tan suat young va mixed GC.
3. **Dai han:** tang len **JDK 21**, bat **ZGC generational**, do p99 va CPU. Neu CPU tang qua 10%, can nhac giu G1 voi heap 8 GB + MaxGCPauseMillis=100.

### Khong phai leak va khong phai Full GC

- old_after_mixed o dinh khoang 3 GB (3.02, 3.04, 3.01 GB) -> live set khong tang theo thoi gian, khong co rò rỉ heap.
- Khong co {{Pause Full}} trong log -> van de khong o Full GC.
- CPU 40–55% con du -> khong thieu CPU, van de o do dai pause stop-the-world.

### Cach sua trong code (vi du)

~~~java
@Service
public class TransactionHistoryService {

    private final TransactionRepository repo;
    private final ObjectMapper mapper = new ObjectMapper();   // dung chung, khong tao moi request
    private final AuditLogger auditLogger;                    // gui log bat dong bo, khong block request

    public TransactionPage history(String accountId, Pageable page) {
        TransactionPage page = repo.findByAccount(accountId, page);   // lay theo trang, khong load toan bo
        auditLogger.log("history", accountId, page.getTotalElements()); // khong serialize toan bo trang
        return page;
    }
}
~~~

### Alert va monitoring

- Canh bao khi {{gc_pause_p99}} > 200 ms trong 5 phút (hiện tại 800+ ms).
- Canh bao khi {{rate(jvm_gc_pause_seconds_sum)}} > 0.1 (10% thoi gian la GC).
- Theo doi allocation tren moi request; neu tang dot bien sau deploy, kiem tra code.
- Neu mixed GC > 200 ms lien tuc, dat MaxGCPauseMillis hoac chuyen ZGC.

> Senior tip: Voi dich vu latency thap, **heap lon khong luon tot**. Live set 3 GB thi heap 6–8 GB la du; heap 12 GB lam moi mixed GC phai quan ly nhieu vung hon, pause dai hon. Khi thay mixed GC 800 ms nhung CPU du, khong nghĩ "thieu CPU" hay "leak" — hãy nhìn **Old regions** trong GC log va tinh: so vung x % object song x kich thuc vung = luong phai copy. Neu con so lon, hoac giam heap, hoac chuyen ZGC.`,
  rubric: [
    'Giai thich dung co che mixed GC dai: heap 12 GB vung 4 MB, old khoang 768 vung (~3 GB) thom, moi mixed copy khoang 500 MB object song, Evacuate Collection Set 700+ ms -> pause 800-900 ms; CPU du vi la stop-the-world.',
    'Lien he cau hinh: IHOP 45%, MaxGCPauseMillis mac dinh 200 ms, live set 3 GB/12 GB = 25%; giai thich vi sao G1 chon young lon va gom nhieu vung old moi mixed.',
    'Phan tai du ba lua chon: MaxGCPauseMillis (giam pause nhung nhieu GC hon, throughput giam), ZGC generational JDK 21 (pause phang, can nang cap runtime, tieu tuc CPU), giam allocation (giam tan suat, khong giam do dai pause).',
    'De xuat lo trinh: ngay MaxGCPauseMillis=100 + giam heap 6-8 GB; ngan han toi uu allocation; dai han ZGC tren JDK 21; co canh bao pause p99 va gc_time_ratio.',
    'Phan biet khong phai leak (old_after_mixed o dinh ~3 GB) va khong phai Full GC (khong co Pause Full trong log).'
  ],
  tags: ['g1', 'mixed-gc', 'gc-pause', 'heap-size', 'zgc', 'max-gc-pause', 'latency', 'jdk17', 'jdk21']
},
{
  id: 'lab-gc-019',
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
  id: 'lab-gc-020',
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
},
{
  id: 'lab-gc-021',
  category: 'gc',
  title: 'ConcurrentHashMap làm cache không giới hạn trong service tỷ giá',
  level: 'senior',
  scenario: `**Bối cảnh:** Service {{fx-rate}} của ví điện tử {{PayNow}} (Spring Boot 3.2, JDK 17.0.10, -Xmx2g, G1) nhận tỷ giá ngoại tệ từ 15 đối tác qua Kafka mỗi giây. Service cung cấp endpoint {{GET /api/rate/currency}} cho hàng ngàn ứng dụng con. Để giảm load DB, team dùng một {{ConcurrentHashMap}} làm cache tỷ giá cuối cùng cho mọi cặp tiền từ tất cả đối tác. Service hoạt động ổn định trong 2 tháng, nhưng từ khi đối tác thêm tính năng {{Tỷ giá cá nhân hoá}} dựa trên {{userId}}, memory tăng đều và pod bị OOM sau khoảng 3 ngày chạy. Pod có limit 3Gi.
  
  **Triệu chứng:** Old Gen tăng tuyến tính, không giảm dù request ổn định. Số concurrent mark cycle tăng mạnh, p99 endpoint tỷ giá tăng từ 50ms lên 400ms sau 3 ngày. Dev khẳng định: {{Chúng tôi chỉ dùng ConcurrentHashMap, nó thread-safe, không thể leak.}}

  **Dữ liệu thu thập:** {{jcmd 1 GC.class_histogram}} hai lần, cách nhau 48 giờ, metric bộ nhớ và snippet code {{CurrencyCache}}.`,
  artifacts: [
    {
      name: 'histogram-day1.txt',
      lang: 'text',
      content: `num     #instances         #bytes  class name (module)
-------------------------------------------------------
   1:        846287      121860072  [B (java.base@17.0.10)
   2:       1255395       50215800  java.math.BigDecimal (java.base@17.0.10)
   3:        814503       19548072  java.lang.String (java.base@17.0.10)
   4:        412385       16495400  vn.paynow.fx.CurrencyRate
   5:        474255       15176160  java.util.concurrent.ConcurrentHashMap$Node (java.base@17.0.10)`
    },
    {
      name: 'histogram-day3.txt',
      lang: 'text',
      content: `num     #instances         #bytes  class name (module)
-------------------------------------------------------
   1:       1635479      166054824  [B (java.base@17.0.10)
   2:       3622971      144918840  java.math.BigDecimal (java.base@17.0.10)
   3:       1201577       48063080  vn.paynow.fx.CurrencyRate
   4:       1263447       40430304  java.util.concurrent.ConcurrentHashMap$Node (java.base@17.0.10)
   5:       1603695       38488680  java.lang.String (java.base@17.0.10)`
    },
    {
      name: 'CurrencyCache.java',
      lang: 'text',
      content: `package vn.paynow.fx;

import java.util.concurrent.ConcurrentHashMap;
import java.util.Map;
import org.springframework.stereotype.Service;

@Service
public class CurrencyCache {
    // Cache tỷ giá theo cặp tiền và userId: Map<String, CurrencyRate>
    private final Map<String, CurrencyRate> cache = new ConcurrentHashMap<>();

    public void put(String userId, String pair, CurrencyRate rate) {
        String key = userId + "_" + pair; // Key là userId + cặp tiền
        cache.put(key, rate);
    }

    public CurrencyRate get(String userId, String pair) {
        String key = userId + "_" + pair;
        return cache.get(key);
    }
}`
    }
  ],
  questions: [
      'Nguyên nhân gốc của memory leak là gì? Dẫn chứng cụ thể từ histogram?',
      'Tại sao ConcurrentHashMap lại là nguyên nhân gây leak ở đây, mặc dù nó được thiết kế tốt?',
      'Bạn sẽ sửa thế nào ngắn hạn và dài hạn? Cần những loại alert nào?'
  ],
  hints: [
      'So sánh các key trong ConcurrentHashMap giữa ngày 1 và ngày 3.',
      'Đọc kỹ Class {{CurrencyCache}} xem key là gì và số lượng phần tử có bị giới hạn không.'
  ],
  answer: `**Tóm tắt:** Đây là leak do cache không giới hạn. Key trong cache là {{userId + "_" + pair}}. Với số lượng người dùng lớn và tính năng tỷ giá cá nhân hoá, số lượng unique key trong {{ConcurrentHashMap}} tăng không kiểm soát theo thời gian. Cache không bao giờ xoá entry cũ, dẫn đến OOM.

### Nguyên nhân gốc
{{ConcurrentHashMap}} chỉ đảm bảo tính thread-safe, không tự động evict (xoá) dữ liệu cũ. Mỗi lần thêm {{userId}} mới, một entry mới được tạo và nằm vĩnh viễn trong map.

### Dẫn chứng
Dựa trên histogram, ta thấy số lượng instance của {{ConcurrentHashMap$Node}} tăng mạnh sau 48 giờ (từ 474,255 lên 1,263,447). Tương tự, {{CurrencyRate}} và {{String}} (cho key) cũng tăng tương ứng. Đây là bằng chứng rõ ràng về việc các entry không được dọn dẹp.

### Sửa lỗi
1. **Ngắn hạn:** Sử dụng {{Caffeine}} cache với {{maximumSize}} và {{expireAfterWrite}} để tự động dọn entry cũ.
2. **Dài hạn:** Rà soát tất cả các cache singleton/ứng dụng xem đã có giới hạn (size/TTL) chưa.
3. **Alert:** Đặt alert cho kích thước của tất cả các cache (gauge) và tốc độ tăng trưởng của Heap.

> Senior tip: Mọi Collection singleton/ứng dụng (Map, Set, List) trong ứng dụng đều là ứng viên tiềm năng cho memory leak. Hãy luôn kiểm tra xem chúng có được giới hạn kích thước hay không.`,
  rubric: [
    'Nhận diện leak do ConcurrentHashMap không có giới hạn.',
    'Dẫn chứng bằng delta #instances trong histogram.',
    'Đề xuất Caffeine/TTL, alert gauge.'
  ],
  tags: ['leak', 'cache', 'ConcurrentHashMap']
},
  {
    id: 'lab-gc-022',
    category: 'gc',
    title: 'Batch đối soát cuối ngày OOM: load 12 triệu giao dịch mà không clear persistence context',
    level: 'senior',
    scenario: `**Bối cảnh (background):** Ngân hàng **VietFin** vận hành service **recon-batch** (Spring Boot 3.2, JDK 17.0.10, Hibernate 6, PostgreSQL 15, HikariCP) thực hiện đối soát giao dịch cuối ngày. Pod Kubernetes: 4 vCPU, memory limit 6Gi. JVM: {{-Xms4g -Xmx4g -XX:+UseG1GC -Xlog:gc*,gc+heap=debug:file=/logs/gc.log:time,uptime,level,tags}}. JVM khởi động lúc 01:00, job chạy lúc **01:15 mỗi ngày**, đọc khoảng **12 triệu giao dịch** từ bảng {{transaction}} trong ngày, so khớp với file đối soát từ VNPAY/MoMo, ghi kết quả ra bảng {{reconciliation_result}}.
    
**Thuật ngữ giải thích:**
- **Persistence context (ngữ cảnh bền vững):** Trong JPA/Hibernate, là bộ nhớ đệm cấp 1 (L1 cache) gắn với {{EntityManager}} (hoặc {{Session}}). Mọi entity được load, save, update trong transaction đều được giữ trong persistence context để theo dõi thay đổi (dirty checking) và tránh load trùng lặp. **Mặc định persistence context sống suốt transaction**; nếu transaction dài và load nhiều entity, context sẽ phình to và gây OOM.
- **Old Gen (vùng già):** Phần heap chứa object sống lâu. G1 GC dọn Old Gen bằng *concurrent mark* + *mixed GC*. Nếu Old Gen tăng liên tục mà không giảm sau GC, có thể là leak hoặc object bị giữ bởi root (như persistence context).
- **Full GC:** Thu gom rác toàn bộ heap, dừng toàn bộ ứng dụng (Stop-The-World). Với G1, Full GC thường xảy ra khi heap quá đầy hoặc phân mảnh nặng, và rất chậm (giây).
- **{{EntityManager.clear()}}:** Xoá toàn bộ entity khỏi persistence context, khiến chúng trở thành *detached*. Giúp giải phóng bộ nhớ khi xử lý batch lớn.

**Triệu chứng:** Lúc **01:15 ngày 22/10/2026**, job batch bắt đầu. Đến **01:45**, pod bị **OOMKilled** (exit code 137). Trước đó, GC log ghi nhận **Old Gen tăng từ ~500 MB lên ~3.8 GB** trong 30 phút, **5 lần Pause Full (G1 Compaction Pause)** mỗi lần 1.8–2.4 giây. CPU pod chỉ 1.2/4 core. Không có {{OutOfMemoryError}} trong log ứng dụng (bị kernel kill). Dev nhận xét: "Heap 4 GB, dữ liệu 12 triệu bản ghi, cứ tăng heap lên 8 GB là xong."

**Dữ liệu thu thập:** GC log JDK 17 trong lúc job chạy, heap histogram lấy bằng {{jmap -histo}} lúc 01:40, đoạn code {{ReconciliationJob}}, và cấu hình Hibernate.`,
    artifacts: [
      {
        name: 'gc-recon-batch.log',
        lang: 'text',
        content: `[2026-10-22T01:00:00.015+0700][0.015s][info][gc,init] Version: 17.0.10+7 (release)
[2026-10-22T01:00:00.015+0700][0.015s][info][gc,init] CPUs: 4 total, 4 available
[2026-10-22T01:00:00.015+0700][0.015s][info][gc,init] Memory: 6144M
[2026-10-22T01:00:00.015+0700][0.015s][info][gc,init] Heap Region Size: 2M
[2026-10-22T01:00:00.015+0700][0.015s][info][gc,init] Heap Min Capacity: 4G
[2026-10-22T01:00:00.015+0700][0.015s][info][gc,init] Heap Initial Capacity: 4G
[2026-10-22T01:00:00.015+0700][0.015s][info][gc,init] Heap Max Capacity: 4G
[2026-10-22T01:00:00.015+0700][0.015s][info][gc,init] Parallel Workers: 4
... (young GC bình thường trước job, heap sau GC ~400-500 MB) ...
[2026-10-22T01:15:22.104+0700][922.104s][info][gc] GC(85) Pause Young (Normal) (G1 Evacuation Pause) 1850M->520M(4096M) 14.201ms
[2026-10-22T01:20:05.330+0700][1205.330s][info][gc] GC(86) Pause Young (Normal) (G1 Evacuation Pause) 2120M->680M(4096M) 16.882ms
[2026-10-22T01:24:12.881+0700][1452.881s][info][gc,start] GC(87) Pause Young (Concurrent Start) (G1 Evacuation Pause)
[2026-10-22T01:24:12.881+0700][1452.881s][info][gc,task] GC(87) Using 4 workers of 4 for evacuation
[2026-10-22T01:24:12.946+0700][1452.946s][info][gc,heap] GC(87) Eden regions: 420->0(420)
[2026-10-22T01:24:12.946+0700][1452.946s][info][gc,heap] GC(87) Survivor regions: 18->22(52)
[2026-10-22T01:24:12.946+0700][1452.946s][info][gc,heap] GC(87) Old regions: 210->380
[2026-10-22T01:24:12.946+0700][1452.946s][info][gc] GC(87) Pause Young (Concurrent Start) (G1 Evacuation Pause) 1850M->1420M(4096M) 58.114ms
[2026-10-22T01:24:12.947+0700][1452.947s][info][gc] GC(88) Concurrent Mark Cycle
[2026-10-22T01:26:10.102+0700][1570.102s][info][gc] GC(89) Pause Young (Normal) (G1 Evacuation Pause) 2450M->1980M(4096M) 72.340ms
[2026-10-22T01:26:10.102+0700][1570.102s][info][gc,heap] GC(89) Old regions: 580->720
[2026-10-22T01:27:45.440+0700][1665.440s][info][gc] GC(90) Pause Young (Normal) (G1 Evacuation Pause) 2890M->2410M(4096M) 88.602ms
[2026-10-22T01:27:45.440+0700][1665.440s][info][gc,heap] GC(90) Old regions: 720->890
[2026-10-22T01:29:20.210+0700][1760.210s][info][gc] GC(91) Pause Young (Normal) (G1 Evacuation Pause) 3320M->2850M(4096M) 102.771ms
[2026-10-22T01:29:20.210+0700][1760.210s][info][gc] GC(91) To-space exhausted
[2026-10-22T01:29:20.211+0700][1760.211s][info][gc,start] GC(92) Pause Full (G1 Compaction Pause)
[2026-10-22T01:29:20.211+0700][1760.211s][info][gc,task] GC(92) Using 4 workers of 4 for full compaction
[2026-10-22T01:29:20.812+0700][1760.812s][info][gc,phases] GC(92) Phase 1: Mark live objects 601.118ms
[2026-10-22T01:29:21.014+0700][1761.014s][info][gc,phases] GC(92) Phase 2: Prepare for compaction 91.551ms
[2026-10-22T01:29:21.203+0700][1761.203s][info][gc,phases] GC(92) Phase 3: Adjust pointers 188.940ms
[2026-10-22T01:29:22.346+0700][1762.346s][info][gc,phases] GC(92) Phase 4: Compact heap 1143.077ms
[2026-10-22T01:29:22.355+0700][1762.355s][info][gc,heap] GC(92) Old regions: 1020->110
[2026-10-22T01:29:22.355+0700][1762.355s][info][gc] GC(92) Pause Full (G1 Compaction Pause) 3420M->1120M(4096M) 2144.902ms
[2026-10-22T01:31:10.999+0700][1870.999s][info][gc] GC(93) Pause Young (Normal) (G1 Evacuation Pause) 1980M->1150M(4096M) 95.207ms
[2026-10-22T01:33:55.979+0700][2035.979s][info][gc] GC(94) To-space exhausted
[2026-10-22T01:33:55.979+0700][2035.979s][info][gc] GC(94) Pause Young (Normal) (G1 Evacuation Pause) 3120M->3080M(4096M) 319.004ms
[2026-10-22T01:35:10.001+0700][2110.001s][info][gc] GC(95) Pause Full (G1 Compaction Pause) 3080M->1180M(4096M) 2011.447ms
[2026-10-22T01:37:40.001+0700][2260.001s][info][gc] GC(96) Pause Full (G1 Compaction Pause) 3150M->1210M(4096M) 1988.334ms
[2026-10-22T01:40:15.001+0700][2415.001s][info][gc] GC(97) Pause Full (G1 Compaction Pause) 3200M->1240M(4096M) 2055.112ms
[2026-10-22T01:43:20.001+0700][2600.001s][info][gc] GC(98) Pause Full (G1 Compaction Pause) 3250M->1270M(4096M) 2100.445ms
[2026-10-22T01:45:30.001+0700][2730.001s] [OOMKilled: container memory limit 6Gi exceeded]`
      },
      {
        name: 'jmap-histo-0140.txt',
        lang: 'text',
        content: `$ kubectl exec recon-batch-7d8f6c-x4k2p -- jmap -histo 1 | head -20
 num     #instances         #bytes  class name (module)
-------------------------------------------------------
   1:       4210800      985236000  [B (java.base@17.0.10)
   2:       5602400      134457600  org.hibernate.engine.internal.EntityEntry
   3:       2801200       89638400  vn.vietfin.recon.Transaction
   4:       2801200       67228800  vn.vietfin.recon.ReconciliationResult
   5:       1400600       33614400  java.util.ArrayList
   6:       1400600       22409600  java.util.HashMap
   7:       1120480       17927680  java.lang.String
   8:        560240       17927680  java.math.BigDecimal
   9:       1400600       13445760  org.hibernate.collection.internal.PersistentBag
  10:        280120        8963840  org.hibernate.proxy.pojo.bytebuddy.ByteBuddyInterceptor
Total       21578240      1390849760`
      },
      {
        name: 'ReconciliationJob.java',
        lang: 'text',
        content: `package vn.vietfin.recon.batch;

import jakarta.persistence.EntityManager;
import jakarta.persistence.EntityManagerFactory;
import org.springframework.batch.core.Job;
import org.springframework.batch.core.Step;
import org.springframework.batch.core.job.builder.JobBuilder;
import org.springframework.batch.core.repository.JobRepository;
import org.springframework.batch.core.step.builder.StepBuilder;
import org.springframework.batch.item.ItemProcessor;
import org.springframework.batch.item.ItemWriter;
import org.springframework.batch.item.database.JpaPagingItemReader;
import org.springframework.batch.item.database.builder.JpaPagingItemReaderBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.transaction.PlatformTransactionManager;
import vn.vietfin.recon.Transaction;
import vn.vietfin.recon.ReconciliationResult;

@Configuration
public class ReconciliationJob {

    private final JobRepository jobRepository;
    private final PlatformTransactionManager transactionManager;
    private final EntityManagerFactory entityManagerFactory;
    private final EntityManager entityManager;

    public ReconciliationJob(JobRepository jobRepository,
                             PlatformTransactionManager transactionManager,
                             EntityManagerFactory entityManagerFactory,
                             EntityManager entityManager) {
        this.jobRepository = jobRepository;
        this.transactionManager = transactionManager;
        this.entityManagerFactory = entityManagerFactory;
        this.entityManager = entityManager;
    }

    @Bean
    public Job reconciliationJob() {
        return new JobBuilder("reconciliationJob", jobRepository)
                .start(reconciliationStep())
                .build();
    }

    @Bean
    public Step reconciliationStep() {
        return new StepBuilder("reconciliationStep", jobRepository)
                .<Transaction, ReconciliationResult>chunk(5000, transactionManager)
                .reader(transactionReader())
                .processor(transactionProcessor())
                .writer(reconciliationWriter())
                .build();
    }

    @Bean
    public JpaPagingItemReader<Transaction> transactionReader() {
        return new JpaPagingItemReaderBuilder<Transaction>()
                .name("transactionReader")
                .entityManagerFactory(entityManagerFactory)
                .pageSize(5000)
                .queryString("SELECT t FROM Transaction t WHERE t.createdDate = :date")
                .parameterValues(java.util.Map.of("date", java.time.LocalDate.now().minusDays(1)))
                .build();
    }

    @Bean
    public ItemProcessor<Transaction, ReconciliationResult> transactionProcessor() {
        return transaction -> {
            // Load toàn bộ related entities (fee, counterparty, channel) vào persistence context
            transaction.getFees().size();           // force load lazy collection
            transaction.getCounterparty();          // force load @ManyToOne
            transaction.getChannel();               // force load @ManyToOne
            
            // Tạo object kết quả, giữ reference đến transaction gốc
            ReconciliationResult result = new ReconciliationResult();
            result.setTransaction(transaction);     // Giữ reference mạnh tới entity gốc
            result.setMatched(checkMatch(transaction));
            result.setDiscrepancy(calculateDiff(transaction));
            return result;
        };
    }

    @Bean
    public ItemWriter<ReconciliationResult> reconciliationWriter() {
        return items -> {
            for (ReconciliationResult r : items) {
                entityManager.persist(r);           // Persist context giữ thêm result
            }
            entityManager.flush();                  // Flush 1 lần cho cả chunk 5000
            // KHÔNG GỌI entityManager.clear() - persistence context giữ tích lũy
        };
    }

    private boolean checkMatch(Transaction t) { /* ... */ return true; }
    private String calculateDiff(Transaction t) { /* ... */ return "0"; }
}`
      },
      {
        name: 'hibernate-config.yml',
        lang: 'text',
        content: `spring:
  jpa:
    properties:
      hibernate:
        jdbc:
          batch_size: 50
        order_inserts: true
        order_updates: true
    open-in-view: false
  datasource:
    hikari:
      maximum-pool-size: 20
      minimum-idle: 5`
      }
    ],
    questions: [
      'Tại sao Old Gen tăng liên tục từ ~500 MB lên ~3.8 GB trong khi chỉ xử lý 12 triệu giao dịch? Dẫn chứng từ GC log và histogram.',
      'Vì sao Persistence Context của Hibernate là thủ phạm? Giải thích cơ chế dirty checking và tại sao entity không bị GC thu hồi.',
      'Chứng minh đây KHÔNG phải memory leak kiểu "quên đóng resource" mà là thiết kế batch sai. Tăng heap lên 8 GB có giải quyết được không?',
      'Sửa ngắn hạn (code) và dài hạn (kiến trúc batch). Cần alert gì?'
    ],
    hints: [
      'Nhìn Old regions trong GC log: 210 -> 380 -> 580 -> 720 -> 890 -> 1020. Tăng đều, không giảm sau Full GC (Full GC chỉ compact, không xoá object còn reachable).',
      'Histogram: 2.8 triệu Transaction, 2.8 triệu ReconciliationResult, 1.4 triệu ArrayList/HashMap/PersistentBag. Tổng ~1.4 GB chỉ cho entity + collection. Persistence context giữ mọi entity đã load từ đầu job, không nhả ra sau mỗi page/chunk.',
      'EntityManager.flush() KHÔNG giải phóng entity khỏi persistence context. Chỉ clear() mới làm entity trở thành detached và có thể GC thu hồi.',
      'Tăng heap 8 GB chỉ dời sự cố: 12 triệu transaction × ~500 byte/entity ≈ 6 GB chỉ cho entity, chưa tính collection, result, buffer. Transaction lớn hơn cuối tháng sẽ OOM lại.'
    ],
    answer: `**Tóm tắt:** Job batch **load 12 triệu entity Transaction vào persistence context Hibernate nhưng không bao giờ gọi {{entityManager.clear()}}**. Mỗi entity kéo theo lazy collection (fees) và quan hệ @ManyToOne (counterparty, channel) được force-load, cộng thêm object {{ReconciliationResult}} giữ reference mạnh tới entity gốc. Persistence context (L1 cache) tích lũy ~2.8 triệu Transaction + 2.8 triệu ReconciliationResult + collection = **~1.3 GB live data chỉ trong 30 phút**, đẩy Old Gen từ 500 MB lên 3.8 GB, gây 5 lần Full GC ~2 giây, cuối cùng pod bị OOMKilled. Tăng heap không giải quyết được vì dữ liệu tăng tuyến tính với số lượng giao dịch. Sửa bằng {{clear()}} sau mỗi chunk, dùng {{StatelessSession}} hoặc Spring Batch {{JdbcCursorItemReader}} streaming.

### Cơ chế: Persistence Context và Dirty Checking

**Persistence context (ngữ cảnh bền vững)** là bộ nhớ đệm cấp 1 của JPA/Hibernate, gắn với {{EntityManager}} (hoặc {{Session}}). Nó đảm bảo:
- **Identity map:** Trong một transaction, cùng một entity (cùng ID) chỉ load một lần, trả về cùng instance.
- **Dirty checking:** Hibernate theo dõi thay đổi field của entity. Khi transaction commit (hoặc {{flush()}}), Hibernate so sánh snapshot lúc load với trạng thái hiện tại, sinh UPDATE cho field thay đổi.
- **Write-behind:** {{persist()}}, {{merge()}}, {{remove()}} chỉ ghi vào context; {{flush()}} mới đẩy xuống DB.

**Vấn đề:** Persistence context **mặc định sống suốt transaction** (hoặc scope của {{EntityManager}}). Nếu một transaction load 12 triệu entity mà không {{clear()}}, context giữ **tất cả** entity đó — snapshot cho dirty checking, collection, proxy — trong heap. Chúng **không bao giờ được GC thu hồi** vì còn reachable từ context (root qua {{EntityManager}} → {{PersistenceContext}} → {{EntityEntry}} → entity).

{{EntityManager.flush()}} chỉ đẩy SQL xuống DB, **KHÔNG** xoá entity khỏi context. Chỉ {{entityManager.clear()}} (hoặc {{session.clear()}}) mới **detach** toàn bộ entity, giải phóng snapshot, cho phép GC thu hồi.

### Dẫn chứng từ artifact

| Thời điểm / GC | Dòng log trích | Ý nghĩa |
|---|---|---|
| GC(85) 01:15 | {{Pause Young ... 1850M->520M}}, Old regions: implicit | Khởi đầu job, young GC thường, old còn thấp |
| GC(87) 01:24 | {{Concurrent Start}}, {{Old regions: 210->380}} | Old tăng, chạm ngưỡng IHOP, bắt đầu concurrent mark |
| GC(89) 01:26 | {{Old regions: 580->720}} | Old tăng nhanh (140 region = 280 MB / ~2 phút) |
| GC(90) 01:27 | {{Old regions: 720->890}} | Tiếp tục tăng |
| GC(91) 01:29 | {{To-space exhausted}}, {{Old regions: 890->1020}} | Không còn region trống cho evacuation |
| GC(92) 01:29 | {{Pause Full (G1 Compaction Pause) 3420M->1120M(4096M) 2144.902ms}} | Full GC đầu, compact old 1020->110 region. **Heap sau GC 1120M** là live set thực (entity còn reachable từ context) |
| GC(93) 01:31 | {{1980M->1150M}} | Young GC sau Full GC, old nhanh chóng tăng lại vì context vẫn giữ entity |
| GC(95) 01:35 | {{Pause Full ... 3080M->1180M 2011.447ms}} | Full GC thứ 2, live set ~1180M |
| GC(98) 01:43 | {{Pause Full ... 3250M->1270M 2100.445ms}} | Full GC thứ 5, live set ~1270M. Pod bị kill lúc 01:45 |

**Histogram lúc 01:40 (giữa các Full GC):**
- {{vn.vietfin.recon.Transaction}}: **2,801,200 instance**, 89.6 MB (chỉ object gốc, chưa tính field/collection)
- {{vn.vietfin.recon.ReconciliationResult}}: **2,801,200 instance**, 67.2 MB (giữ reference tới Transaction qua field {{transaction}})
- {{ArrayList}}, {{HashMap}}, {{PersistentBag}}: **1,400,600 instance** mỗi loại — tương ứng với collection fees (ArrayList/PersistentBag) và map/collection khác trong entity
- {{EntityEntry}} (mỗi entity được quản lý có một entry theo dõi trạng thái): **5,602,400 instance** — đúng bằng 2,8 triệu Transaction + 2,8 triệu ReconciliationResult đang bị context giữ; ngoài ra Hibernate còn giữ snapshot giá trị field của từng entity để dirty checking, nên bộ nhớ live lớn hơn nhiều so với kích thước đo được của riêng object entity
- Tổng histogram: **1.39 GB** — nhỉnh hơn heap sau Full GC ~1.1-1.2 GB vì {{jmap -histo}} (không {{:live}}) đếm cả object rác chưa thu hồi, còn heap sau Full GC chỉ còn object sống

**Phép tính kiểm tra:** 12 triệu transaction / pageSize 5000 = 2400 page. Chunk 5000 = 1 commit / page. Mỗi page load 5000 entity + collection → 5000 Transaction + 5000 ReconciliationResult + collection. Sau 560 page (2.8 triệu entity), heap đã ~3.2 GB. Tốc độ tăng ~140 region/2 phút = 280 MB/2 phút = **140 MB/phút** khớp với GC log Old regions tăng.

### Tại sao TĂNG HEAP LÊN 8 GB KHÔNG GIẢI QUYẾT

- Dữ liệu **tăng tuyến tính với số lượng giao dịch**. Cuối tháng 15-20 triệu giao dịch → live set 1.6-2 GB chỉ cho entity. Còn collection, result, buffer, Metaspace, thread stack → vượt 8 GB.
- Full GC trên heap 8 GB **chậm hơn** (phase compact mất 3-4 giây), application pause lâu hơn, throughput batch giảm.
- Pod limit 6Gi không đủ cho heap 8 GB cộng native memory (Metaspace, CodeCache, Direct buffer, GC structures).

### Cách sửa

**Ngắn hạn (hotfix deploy trong ngày):**
1. Gọi {{entityManager.clear()}} sau mỗi chunk (sau {{flush()}} trong writer):

~~~java
@Bean
public ItemWriter<ReconciliationResult> reconciliationWriter() {
    return items -> {
        for (ReconciliationResult r : items) {
            entityManager.persist(r);
        }
        entityManager.flush();
        entityManager.clear();          // QUAN TRỌNG: detach tất cả entity, giải phóng heap
    };
}
~~~

2. Trong processor: **KHÔNG** giữ reference tới entity gốc trong {{ReconciliationResult}}. Chỉ copy field cần thiết (ID, amount, status...):

~~~java
ReconciliationResult result = new ReconciliationResult();
result.setTransactionId(transaction.getId());   // Chỉ ID, không giữ entity
result.setAmount(transaction.getAmount());
result.setStatus(transaction.getStatus());
// KHÔNG: result.setTransaction(transaction);
~~~

3. Tắt force-load collection không cần thiết ({{transaction.getFees().size()}} chỉ để trigger load — nếu không dùng thì bỏ).

**Dài hạn (kiến trúc batch đúng):**
- Dùng **{{StatelessSession}}** (Hibernate) hoặc **{{JdbcCursorItemReader}}** / **{{JpaCursorItemReader}}** với cursor streaming: đọc từng dòng, xử lý, ghi, xoá — không giữ entity trong context. {{StatelessSession}} không có persistence context, không dirty checking, không L1 cache, phù hợp batch read-only/write-only.
- Hoặc tách: reader dùng JPA streaming, processor tạo DTO nhẹ, writer dùng JDBC batch insert ({{JdbcBatchItemWriter}}) thay vì {{entityManager.persist()}}.
- Cấu hình {{hibernate.jdbc.batch_size}} và {{hibernate.order_inserts}} cho writer JDBC.
- Chunk size 1000-5000 tùy entity size; sau mỗi chunk **bắt buộc clear/detach**.

### Alert và phòng ngừa
- Alert khi GC log xuất hiện {{To-space exhausted}} hoặc {{Pause Full (G1 Compaction Pause)}}.
- Alert khi Old Gen sau GC tăng liên tục 3-5 lần liên tiếp (dùng metric 'jvm_memory_used_bytes{area="heap",id="G1 Old Gen"}' ngay sau mixed GC).
- Code review batch: **bắt buộc có clear/detach** sau mỗi chunk; cấm giữ reference entity trong DTO/result; ưu tiên StatelessSession/JDBC cho batch lớn.
- Test batch với dữ liệu gấp 3-5 lần production (cuối tháng/năm) trên staging, đo heap sau GC và GC pause.

> Senior tip: Batch JPA là "bẫy" hay gặp: team dùng JPA vì quen, nhưng quên persistence context. Quy tắc vàng: **mọi batch JPA load > 100k entity BẮT BUỘC có clear() sau mỗi chunk, hoặc dùng StatelessSession/JDBC**. Khi review code batch, tôi chỉ cần tìm {{entityManager.flush()}} — nếu **không có {{clear()}} ngay sau đó** thì chắc chắn sẽ OOM khi dữ liệu lớn.`,
    rubric: [
      'Chỉ ra đúng nguyên nhân: load 12 triệu entity vào persistence context Hibernate không clear(), entity + collection + snapshot dirty checking + ReconciliationResult giữ reference → Old Gen tăng tuyến tính.',
      'Dẫn chứng GC log: Old regions 210->380->580->720->890->1020, 5 Pause Full ~2s, heap sau Full GC 1.1-1.2 GB ổn định (live set thực).',
      'Dẫn chứng histogram: 2.8M Transaction, 2.8M ReconciliationResult, 1.4M ArrayList/HashMap/PersistentBag, EntityEntry — tổng ~1.4 GB gần khớp heap sau GC.',
      'Giải thích đúng: flush() KHÔNG clear context; chỉ clear()/detach mới giải phóng; dirty checking giữ snapshot; tăng heap chỉ dời sự cố.',
      'Đề xuất sửa: clear() sau flush, không giữ entity trong result, StatelessSession/JDBC streaming cho batch lớn; alert To-space exhausted / Full GC / Old Gen trend.'
    ],
    tags: ['hibernate', 'persistence-context', 'batch', 'full-gc', 'oomkilled', 'jpa', 'spring-batch', 'g1']
  },
  {
    id: 'lab-gc-023',
    category: 'gc',
    title: 'Pause dài ở giờ cao điểm do humongous allocation: buffer JSON lớn > nửa region size',
    level: 'senior',
    scenario: `**Bối cảnh (background):** App **payment-gateway** (Spring Boot 3.3, JDK 21.0.4, G1) nhận request thanh toán từ merchant, gọi core banking qua gRPC, sau đó trả response. Pod Kubernetes: 4 vCPU, memory limit 5Gi. JVM: {{-Xms4g -Xmx4g -XX:+UseG1GC -XX:G1HeapRegionSize=2m -Xlog:gc*:file=/logs/gc.log:time,uptime,level,tags}}. Response core banking chứa chi tiết giao dịch, lịch sử 30 ngày, rủi ro scoring — JSON sequence có thể lên tới **3-5 MB** mỗi request. Traffic giờ cao điểm ~2.000 req/s/pod.
    
**Thuật ngữ giải thích:**
- **Humongous object (đối tượng khổng lồ):** Trong G1 GC, heap chia thành region bằng nhau (ở đây 2 MB). Object có kích thước **≥ 50% region (≥ 1 MB)** được coi là humongous. G1 cấp phát humongous **thẳng vào Old Gen** trên các region **liên tiếp**, không qua Eden.
- **G1HeapRegionSize:** Kích thước mỗi region (mặc định tự tính từ heap size, 1-32 MB, lũy thừa 2). Region lớn → ngưỡng humongous cao hơn → ít object bị coi là humongous.
- **To-space exhausted:** Khi young GC, G1 cần copy object sống từ Eden/Survivor sang region mới (to-space). Nếu không đủ region trống (vì bị humongous chiếm chỗ), G1 ném {{To-space exhausted}} và buộc chạy Full GC.
- **Streaming parser (parser luồng):** Thay vì đọc toàn bộ JSON vào {{String}}/{{byte[]}} trong heap, parser đọc token từng cái từ {{InputStream}} (ví dụ Jackson {{JsonParser}}, Gson {{JsonReader}}), xử lý rồi bỏ — heap gần như không tăng.
- **{{HttpResponse.BodyHandlers.ofByteArray()}}:** Đọc toàn bộ HTTP response body vào một mảng {{byte[]}} duy nhất trong heap. Dùng cho response nhỏ; response lớn gây humongous allocation.

**Triệu chứng:** Từ **10:00-10:30 ngày 23/10/2026** (giờ cao điểm), p99 {{POST /api/payment}} tăng từ 120 ms lên **2.8-3.5 giây**. GC log ghi nhận **humongous allocation dày đặc**, **3 lần Pause Full (G1 Compaction Pause)** mỗi lần 1.6-2.1 giây. CPU pod 2.8/4 core. Heap used dashboard chỉ ~2.5 GB / 4 GB. Sau 10:30 traffic giảm, hệ thống tự ổn định. Dev đề xuất: "Tăng heap lên 8 GB và G1HeapRegionSize lên 8 MB."

**Dữ liệu thu thập:** GC log JDK 21 trong lúc sự cố, heap histogram lúc 10:15, đoạn code {{PaymentClient}} gọi core banking, và JFR allocation profiling.`,
    artifacts: [
      {
        name: 'gc-payment-gateway.log',
        lang: 'text',
        content: `[2026-10-23T08:00:00.012+0700][0.012s][info][gc,init] Version: 21.0.4+7 (release)
[2026-10-23T08:00:00.012+0700][0.012s][info][gc,init] CPUs: 4 total, 4 available
[2026-10-23T08:00:00.012+0700][0.012s][info][gc,init] Memory: 5120M
[2026-10-23T08:00:00.012+0700][0.012s][info][gc,init] Heap Region Size: 2M
[2026-10-23T08:00:00.012+0700][0.012s][info][gc,init] Heap Min Capacity: 4G
[2026-10-23T08:00:00.012+0700][0.012s][info][gc,init] Heap Initial Capacity: 4G
[2026-10-23T08:00:00.012+0700][0.012s][info][gc,init] Heap Max Capacity: 4G
[2026-10-23T08:00:00.012+0700][0.012s][info][gc,init] Parallel Workers: 4
[2026-10-23T08:00:00.012+0700][0.012s][info][gc,init] Concurrent Workers: 2
... (young GC bình thường, heap sau GC ~400-600 MB) ...
[2026-10-23T10:05:22.104+0700][7522.104s][info][gc] GC(412) Pause Young (Normal) (G1 Evacuation Pause) 1850M->520M(4096M) 14.201ms
[2026-10-23T10:08:12.330+0700][7692.330s][info][gc,start] GC(413) Pause Young (Concurrent Start) (G1 Humongous Allocation)
[2026-10-23T10:08:12.330+0700][7692.330s][info][gc,task] GC(413) Using 4 workers of 4 for evacuation
[2026-10-23T10:08:12.392+0700][7692.392s][info][gc,phases] GC(413)   Evacuate Collection Set: 48.1ms
[2026-10-23T10:08:12.392+0700][7692.392s][info][gc,heap] GC(413) Eden regions: 420->0(420)
[2026-10-23T10:08:12.392+0700][7692.392s][info][gc,heap] GC(413) Survivor regions: 18->22(52)
[2026-10-23T10:08:12.392+0700][7692.392s][info][gc,heap] GC(413) Old regions: 210->380
[2026-10-23T10:08:12.392+0700][7692.392s][info][gc,heap] GC(413) Humongous regions: 124->124
[2026-10-23T10:08:12.392+0700][7692.392s][info][gc] GC(413) Pause Young (Concurrent Start) (G1 Humongous Allocation) 1850M->1420M(4096M) 58.114ms
[2026-10-23T10:08:12.393+0700][7692.393s][info][gc] GC(414) Concurrent Mark Cycle
[2026-10-23T10:10:10.102+0700][7810.102s][info][gc] GC(415) Pause Young (Normal) (G1 Humongous Allocation) 2450M->1980M(4096M) 72.340ms
[2026-10-23T10:10:10.102+0700][7810.102s][info][gc,heap] GC(415) Old regions: 580->720
[2026-10-23T10:10:10.102+0700][7810.102s][info][gc,heap] GC(415) Humongous regions: 124->280
[2026-10-23T10:11:45.440+0700][7905.440s][info][gc] GC(416) Pause Young (Normal) (G1 Humongous Allocation) 2890M->2410M(4096M) 88.602ms
[2026-10-23T10:11:45.440+0700][7905.440s][info][gc,heap] GC(416) Old regions: 720->890
[2026-10-23T10:11:45.440+0700][7905.440s][info][gc,heap] GC(416) Humongous regions: 280->412
[2026-10-23T10:13:20.210+0700][8000.210s][info][gc] GC(417) Pause Young (Normal) (G1 Humongous Allocation) 3320M->2850M(4096M) 102.771ms
[2026-10-23T10:13:20.210+0700][8000.210s][info][gc] GC(417) To-space exhausted
[2026-10-23T10:13:20.211+0700][8000.211s][info][gc,start] GC(418) Pause Full (G1 Compaction Pause)
[2026-10-23T10:13:20.211+0700][8000.211s][info][gc,task] GC(418) Using 4 workers of 4 for full compaction
[2026-10-23T10:13:20.812+0700][8000.812s][info][gc,phases] GC(418) Phase 1: Mark live objects 601.118ms
[2026-10-23T10:13:21.014+0700][8001.014s][info][gc,phases] GC(418) Phase 2: Prepare for compaction 91.551ms
[2026-10-23T10:13:21.203+0700][8001.203s][info][gc,phases] GC(418) Phase 3: Adjust pointers 188.940ms
[2026-10-23T10:13:22.346+0700][8002.346s][info][gc,phases] GC(418) Phase 4: Compact heap 1143.077ms
[2026-10-23T10:13:22.355+0700][8002.355s][info][gc,heap] GC(418) Old regions: 1020->110
[2026-10-23T10:13:22.355+0700][8002.355s][info][gc,heap] GC(418) Humongous regions: 520->520
[2026-10-23T10:13:22.355+0700][8002.355s][info][gc] GC(418) Pause Full (G1 Compaction Pause) 3420M->1120M(4096M) 2144.902ms
[2026-10-23T10:15:10.999+0700][8110.999s][info][gc] GC(419) Pause Young (Normal) (G1 Humongous Allocation) 1980M->1150M(4096M) 95.207ms
[2026-10-23T10:15:10.999+0700][8110.999s][info][gc,heap] GC(419) Humongous regions: 520->560
[2026-10-23T10:17:55.979+0700][8275.979s][info][gc] GC(420) To-space exhausted
[2026-10-23T10:17:55.979+0700][8275.979s][info][gc] GC(420) Pause Young (Normal) (G1 Evacuation Pause) 3120M->3080M(4096M) 319.004ms
[2026-10-23T10:18:10.001+0700][8290.001s][info][gc] GC(421) Pause Full (G1 Compaction Pause) 3080M->1180M(4096M) 2011.447ms
[2026-10-23T10:18:10.001+0700][8290.001s][info][gc,heap] GC(421) Humongous regions: 580->580
[2026-10-23T10:20:40.001+0700][8440.001s][info][gc] GC(422) Pause Full (G1 Compaction Pause) 3150M->1210M(4096M) 1988.334ms
[2026-10-23T10:20:40.001+0700][8440.001s][info][gc,heap] GC(422) Humongous regions: 590->590
[2026-10-23T10:25:10.001+0700][8710.001s][info][gc] GC(423) Pause Young (Normal) (G1 Evacuation Pause) 2100M->480M(4096M) 18.102ms
[2026-10-23T10:25:10.001+0700][8710.001s][info][gc,heap] GC(423) Humongous regions: 590->8`
      },
      {
        name: 'jmap-histo-1015.txt',
        lang: 'text',
        content: `$ kubectl exec payment-gateway-7d8f6c-x4k2p -- jmap -histo 1 | head -20
 num     #instances         #bytes  class name (module)
-------------------------------------------------------
   1:        249000     1372320000  [B (java.base@21.0.4)
   2:         20750       66400000  java.lang.String
   3:         16600       53120000  com.fasterxml.jackson.databind.node.ObjectNode
   4:         12450       39840000  java.util.ArrayList
   5:         10375       33200000  java.util.HashMap
   6:         16600       26560000  com.fasterxml.jackson.databind.node.ArrayNode
   7:          8300       26560000  java.math.BigDecimal
   8:          4150       13280000  vn.payment.gateway.CoreBankingResponse
Total        338225     1631280000`
      },
      {
        name: 'PaymentClient.java',
        lang: 'text',
        content: `package vn.payment.gateway.client;

import com.fasterxml.jackson.databind.ObjectMapper;
import io.grpc.stub.StreamObserver;
import vn.payment.corebanking.CoreBankingGrpc;
import vn.payment.corebanking.PaymentRequest;
import vn.payment.corebanking.PaymentResponse;
import org.springframework.stereotype.Component;
import java.util.concurrent.TimeUnit;

@Component
public class PaymentClient {

    private final CoreBankingGrpc.CoreBankingStub asyncStub;
    private final ObjectMapper mapper = new ObjectMapper();

    public PaymentResult callCoreBanking(PaymentRequest request) {
        // Chuyển request sang JSON để log (debug)
        String requestJson = mapper.writeValueAsString(request);

        // Gọi gRPC async, convert response sang byte[] để xử lý
        PaymentResponse response = blockingCall(request);

        // Đọc TOÀN BỘ response body vào byte[] (core banking trả JSON 3-5 MB)
        byte[] responseBytes = response.getPayload().toByteArray();  // humongous nếu > 1 MB

        // Parse JSON sang object tree (Jackson) — tạo thêm ObjectNode, ArrayNode, String
        CoreBankingResponse parsed = mapper.readValue(responseBytes, CoreBankingResponse.class);

        // Log response để audit
        String responseJson = mapper.writeValueAsString(parsed);   // Tạo thêm String lớn

        return new PaymentResult(parsed.getStatus(), parsed.getTransactionId());
    }

    private PaymentResponse blockingCall(PaymentRequest request) {
        // ... gRPC blocking stub call ...
        return null; // placeholder
    }
}

class PaymentResult {
    final String status;
    final String transactionId;
    PaymentResult(String status, String transactionId) {
        this.status = status;
        this.transactionId = transactionId;
    }
}

class CoreBankingResponse {
    String status;
    String transactionId;
    String riskScore;
    java.util.List<TransactionHistory> history;   // 30 ngày lịch sử
    RiskDetail riskDetail;
    // getter/setter
}`
      },
      {
        name: 'jfr-allocation-1015.txt',
        lang: 'text',
        content: `$ jcmd 1 JFR.start duration=2m filename=/tmp/payment.jfr settings=profile
$ jfr print --events jdk.ObjectAllocationSample /tmp/payment.jfr | head -50

jdk.ObjectAllocationSample {
  startTime = 10:12:03.412
  objectClass = byte[] (classLoader = bootstrap)
  weight = 4.2 MB
  eventThread = "http-nio-8080-exec-45"
  stackTrace = [
    java.util.Arrays.copyOf(byte[], int) line: 3537
    java.io.ByteArrayOutputStream.toByteArray() line: 211
    com.google.protobuf.ByteString.toByteArray() line: 1245
    vn.payment.gateway.client.PaymentClient.callCoreBanking(PaymentClient.java:28)
  ]
}

jdk.ObjectAllocationSample {
  startTime = 10:12:03.415
  objectClass = byte[] (classLoader = bootstrap)
  weight = 3.8 MB
  eventThread = "http-nio-8080-exec-45"
  stackTrace = [
    com.fasterxml.jackson.databind.util.ByteBufferBackedInputStream.read(byte[], int, int) line: 120
    com.fasterxml.jackson.databind.deser.BaseNodeDeserializer.deserializeArray(JsonParser, DeserializationContext, JavaType) line: 189
    vn.payment.gateway.client.PaymentClient.callCoreBanking(PaymentClient.java:31)
  ]
}

jdk.ObjectAllocationSample {
  startTime = 10:12:03.418
  objectClass = java.lang.String (classLoader = bootstrap)
  weight = 3.1 MB
  eventThread = "http-nio-8080-exec-45"
  stackTrace = [
    java.lang.StringLatin1.newString(byte[], int, int) line: 769
    com.fasterxml.jackson.databind.util.ByteBufferBackedInputStream.read(byte[], int, int) line: 120
    vn.payment.gateway.client.PaymentClient.callCoreBanking(PaymentClient.java:34)
  ]
}

# Tổng hợp allocation rate lúc 10:12 (2000 req/s):
# byte[] (Protobuf toByteArray)       ~ 4.0 MB × 2000 = 8.0 GB/s
# byte[] (Jackson parse)               ~ 3.5 MB × 2000 = 7.0 GB/s  
# String (Jackson writeValueAsString)  ~ 3.0 MB × 2000 = 6.0 GB/s
# ObjectNode/ArrayNode/HashMap/ArrayList  ~ 1.5 GB/s
# TỔNG allocation rate ≈ 22.5 GB/s (chỉ cho response processing)`
      }
    ],
    questions: [
      'Tại sao G1 liên tục báo "G1 Humongous Allocation", rồi "To-space exhausted" và cuối cùng "Pause Full"? Trích dòng cụ thể trong GC log và giải thích với region size 2 MB.',
      'Từ histogram và JFR, chứng minh chính xác object nào là humongous (byte[] từ đâu, kích thước bao nhiêu). Vì sao response 3-5 MB gây humongous còn request JSON nhỏ không?',
      'Chứng minh đây KHÔNG phải memory leak. Tăng heap lên 8 GB hoặc G1HeapRegionSize lên 8 MB có phải lời giải gốc không?',
      'Sửa ngắn hạn (code) và dài hạn (kiến trúc). Cách nào tốt nhất: streaming parser, giảm region size, hay tách luồng xử lý response lớn?'
    ],
    hints: [
      'Region size 2 MB → ngưỡng humongous = 1 MB. Response 3-5 MB = 2-3 region liên tiếp. Nhìn Humongous regions: 124 -> 280 -> 412 -> 520 -> 580 -> 590 (tăng đều), Full GC không giảm (520->520, 580->580, 590->590).',
      'Histogram: {{jmap -histo}} gộp mọi mảng byte[] vào MỘT dòng (~249k instance, 1.37 GB, trung bình ~5.5 KB vì phần lớn là buffer nhỏ); phần lớn dung lượng đến từ vài trăm mảng 3-5 MB đang bị request giữ. JFR chỉ rõ ba điểm cấp phát: 4.2 MB, 3.8 MB, 3.1 MB tại PaymentClient.java dòng 28, 31, 34 — ba lần copy: Protobuf toByteArray, Jackson parse, writeValueAsString.',
      'GC(423) khi traffic giảm: Humongous regions 590->8, heap 2100M->480M. Khác với leak (leak thì heap sau GC tăng dần, Full GC không giảm humongous).',
      'Tăng G1HeapRegionSize 8 MB: ngưỡng humongous = 4 MB, response 3-5 MB vẫn có thể humongous (5 MB > 4 MB). Tăng heap: allocation rate 22.5 GB/s, young GC 10x dày hơn, Full GC trên 8 GB lâu gấp 2 lần. Không phải fix gốc.'
    ],
    answer: `**Tóm tắt:** Service đọc response gRPC core banking (JSON 3-5 MB) vào {{byte[]}} qua {{ByteString.toByteArray()}}, parse Jackson tạo thêm {{byte[]}}, {{ObjectNode}}, {{String}}, rồi {{writeValueAsString}} tạo thêm {{String}} lớn. Với **G1HeapRegionSize=2 MB**, mọi object **≥ 1 MB là humongous** → response 3-5 MB chiếm **2-3 region liên tiếp** trong Old Gen. 2.000 req/s × 3 object lớn mỗi request = hàng nghìn humongous object mỗi giây. Humongous regions tăng 124 → 590 (1.18 GB), chặn region trống → {{To-space exhausted}} → **Pause Full ~2 giây**, lặp 3 lần. Khi traffic giảm, GC(423) thu hồi humongous 590->8 trong young GC thường, chứng minh **không leak**. Sửa gốc: **streaming parser** (Jackson {{JsonParser}}/Gson {{JsonReader}}) đọc token từ {{InputStream}} không load toàn bộ vào heap, hoặc gRPC streaming response.

### Cơ chế: Humongous Allocation trong G1

1. **Region và ngưỡng:** GC log {{Heap Region Size: 2M}}. G1 coi object ≥ 1 MB là humongous. Cấp phát thẳng vào Old Gen trên region liên tiếp.
2. **Ba lần copy trong một request:** (PaymentClient.java)
   - Dòng 28: {{response.getPayload().toByteArray()}} — Protobuf ByteString copy internal buffer ra **byte[] 3-5 MB** (humongous #1).
   - Dòng 31: {{mapper.readValue(responseBytes, ...)}} — Jackson parse byte[], nội bộ cấp phát **byte[]/char[] buffer ~3.5 MB** (humongous #2) và build tree **ObjectNode/ArrayNode/String**.
   - Dòng 34: {{mapper.writeValueAsString(parsed)}} — serialize tree ra **String 3-4 MB** (backing byte[]/char[] humongous #3).
3. **Tổng allocation rate:** ~22.5 GB/s lúc 2.000 req/s. G1 coi mỗi object ≥ 1 MB là humongous: object được cấp phát thẳng vào region riêng ở Old Gen, **không đi qua Eden và không được young GC copy** (chỉ được thu hồi khi không còn ai tham chiếu). Vì vậy Eden chỉ nhận phần allocation nhỏ (buffer, object tree) nhưng region trống vẫn bị humongous chiếm dần → áp lực lên toàn heap chứ không chỉ Eden.
4. **To-space exhausted:** Humongous regions chiếm 590 region × 2 MB = 1.18 GB Old Gen. Chỉ còn ~1.5 GB region trống cho Eden+Survivor+Old thường. Khi Eden đầy, không đủ region trống để evacuate → To-space exhausted → Full GC.
5. **Full GC không giảm humongous:** GC(418) {{Humongous regions: 520->520}}, GC(421) {{580->580}}, GC(422) {{590->590}}. Vì humongous object **vẫn còn được tham chiếu** bởi thread đang xử lý request (stack frame giữ responseBytes, parsed, responseJson) nên chúng vẫn là live data. Lưu ý: G1 Full GC (G1 Compaction Pause) có compact cả vùng humongous, nhưng nó chỉ **di chuyển** object còn sống chứ không thể thu hồi object vẫn reachable — do đó số region humongous không giảm.

### Dẫn chứng từ artifact

| GC / Thời điểm | Dòng log trích | Ý nghĩa |
|---|---|---|
| GC(413) 10:08 | {{Pause Young (Concurrent Start) (G1 Humongous Allocation)}}, {{Humongous regions: 124->124}} | Bắt đầu có humongous, concurrent mark kích hoạt |
| GC(415) 10:10 | {{Humongous regions: 124->280}} | +156 region = 312 MB humongous mới trong 2 phút |
| GC(416) 10:11 | {{Humongous regions: 280->412}} | +132 region = 264 MB |
| GC(417) 10:13 | {{To-space exhausted}}, {{Humongous regions: 412->520}} | Cạn region trống |
| GC(418) 10:13 | {{Pause Full (G1 Compaction Pause) 3420M->1120M 2144ms}}, {{Humongous regions: 520->520}} | Full GC đầu, humongous không giảm |
| GC(421) 10:18 | {{Pause Full ... 2011ms}}, {{Humongous regions: 580->580}} | Full GC thứ 2, humongous không giảm |
| GC(422) 10:20 | {{Pause Full ... 1988ms}}, {{Humongous regions: 590->590}} | Full GC thứ 3, humongous không giảm |
| GC(423) 10:25 | {{Pause Young ... 2100M->480M}}, {{Humongous regions: 590->8}} | **Bằng chứng không leak**: traffic giảm, request xong, humongous eager-reclaim 590->8, heap về 480 MB |
| JFR | {{weight = 4.2 MB}} tại {{ByteString.toByteArray}} (line 28), {{3.8 MB}} tại Jackson parse (line 31), {{3.1 MB}} tại {{writeValueAsString}} (line 34) | Ba object humongous mỗi request |
| Histogram | {{byte[]}} một dòng duy nhất: 249.000 instance, 1.37 GB | {{jmap -histo}} gộp mọi mảng byte[] theo class, không tách theo nguồn cấp phát; phần lớn byte là các mảng 3-5 MB của request đang chạy |

### Tại sao TĂNG HEAP / TĂNG G1HEAPREGIONSIZE KHÔNG PHẢI LỜI GIẢI GỐC

- **Tăng heap 8 GB:** Allocation rate 22.5 GB/s không đổi. Young GC sẽ dày gấp 2 lần (Eden lớn hơn nhưng allocation rate như cũ), Full GC trên 8 GB mất 4-5 giây. Pod limit 5Gi không đủ cho heap 8 GB + native memory.
- **Tăng G1HeapRegionSize 8 MB:** Ngưỡng humongous = 4 MB. Response 3 MB không còn humongous, nhưng 5 MB VẪN humongous. Region 8 MB → heap 4 GB chỉ còn 512 region (thay vì 2048), giảm độ linh hoạt của G1 chọn collection set, young GC kém hiệu quả. Cần restart JVM. Chỉ là workaround.
- **Gốc rễ:** Code **giữ toàn bộ response lớn trong heap** dưới dạng byte[]/String/object tree. Không cần thiết: service chỉ extract {{status}}, {{transactionId}} — có thể streaming parse chỉ lấy field cần thiết.

### Cách sửa

**Ngắn hạn (giảm rủi ro ngay, deploy hôm nay):**
1. **Giới hạn đồng thời (bulkhead):** {{Semaphore}} hoặc Resilience4j Bulkhead tối đa 50-100 request xử lý response lớn đồng thời/pod. Trả 429/503 khi vượt.
2. **Giới hạn kích thước response:** Kiểm tra {{Content-Length}} hoặc gRPC message size trước khi đọc; reject > 2 MB (hoặc chuyển luồng xử lý riêng).
3. **Bỏ log response body lớn:** Xoá {{mapper.writeValueAsString(parsed)}} (dòng 34) — tiết kiệm 1 humongous String + allocation rate 6 GB/s.

**Dài hạn (sửa gốc, loại bỏ humongous):**
1. **Streaming JSON parser (khuyên dùng nhất):** Dùng Jackson {{JsonParser}} hoặc Gson {{JsonReader}} đọc token từ {{InputStream}}, chỉ extract field cần thiết ({{status}}, {{transactionId}}), bỏ qua history/riskDetail lớn. Heap gần như không tăng.

~~~java
public PaymentResult callCoreBanking(PaymentRequest request) {
    // gRPC trả InputStream hoặc ByteString có thể convert sang InputStream
    try (InputStream in = response.getPayload().newInput()) {  // không toByteArray()
        JsonParser parser = new JsonFactory().createParser(in);
        String status = null, txnId = null;
        while (parser.nextToken() != null) {
            if ("status".equals(parser.currentName())) {
                status = parser.nextTextValue();
            } else if ("transactionId".equals(parser.currentName())) {
                txnId = parser.nextTextValue();
            } else if ("history".equals(parser.currentName()) || "riskDetail".equals(parser.currentName())) {
                parser.skipChildren();  // bỏ qua object lớn, không parse
            }
        }
        return new PaymentResult(status, txnId);
    }
}
~~~

2. **gRPC streaming response:** Thay đổi contract core banking trả response chia nhỏ (streaming {{PaymentResponseChunk}}), gateway xử lý chunk-by-chunk.
3. **Tách luồng:** Response lớn (> 1 MB) đẩy vào queue xử lý async, gateway trả 202 Accepted ngay. Worker dùng streaming parser, không ảnh hưởng latency API.

### Phòng ngừa và alert

- Alert khi GC log có {{To-space exhausted}} hoặc {{Pause Full (G1 Compaction Pause)}}.
- Alert khi cause {{G1 Humongous Allocation}} xuất hiện > 10 lần/phút (parse GC log hoặc metric exporter có label cause).
- Theo dõi {{jvm_gc_live_data_size_bytes}} và allocation rate trên mỗi request ({{jvm_gc_memory_allocated_bytes_total / request_count}}).
- Bật JFR liên tục ({{-XX:StartFlightRecording=disk=true,maxage=2h,settings=profile}}) để khi sự cố có {{ObjectAllocationSample}}.
- Code review: cấm {{BodyHandlers.ofByteArray()}}, {{ByteString.toByteArray()}}, {{ObjectMapper.readValue(byte[])}}, {{writeValueAsString}} cho payload > 256 KB không có streaming. Yêu cầu {{JsonParser}}/{{InputStream}} cho response lớn.

> Senior tip: Humongous allocation là "kẻ giết G1 thầm lặng" vì app chạy ngon tuần đầu, sập khi traffic tăng hoặc payload lớn hơn một chút. Quy tắc: **mọi byte[]/String lớn từ network (HTTP, gRPC, Kafka, file) phải có giới hạn KHỎNG hoặc streaming**. Khi debug GC log, tìm chuỗi: {{G1 Humongous Allocation}} → {{To-space exhausted}} → {{Pause Full}} và so sánh {{Humongous regions}} trước/sau Full GC — nếu humongous không giảm sau Full GC nhưng giảm mạnh ở young GC sau khi tải hết, đó là humongous còn sống do request giữ, không phải leak. Cách chữa bền: streaming parser, giới hạn kích thước, bulkhead; tăng RegionSize/heap chỉ là đòn giảm đau.`,
    rubric: [
      'Giải thích đúng cơ chế: region 2M → ngưỡng 1M, object ≥ ngưỡng cấp phát thẳng Old Gen trên region liên tiếp, ba lần copy (Protobuf toByteArray, Jackson parse, writeValueAsString) mỗi request tạo 3 humongous.',
      'Dẫn chứng GC log: Humongous regions 124→280→412→520→580→590, To-space exhausted (GC 417), Pause Full ~2s nhưng Humongous regions không giảm (520->520, 580->580, 590->590).',
      'Chứng minh không leak: GC(423) Humongous regions 590->8, heap 2100M->480M khi traffic giảm; phân biệt humongous sống tạm vs leak.',
      'Chỉ đúng code gây ra: PaymentClient.java dòng 28/31/34, ba lần copy byte[]/String 3-5 MB; JFR weight 4.2/3.8/3.1 MB khớp.',
      'Đề xuất có chiều sâu: streaming parser (JsonParser skipChildren) loại bỏ humongous hoàn toàn; bulkhead giới hạn đồng thời; bỏ log response body; giải thích tăng RegionSize/heap chỉ là workaround; alert To-space exhausted / Humongous cause.'
    ],
    tags: ['g1', 'humongous', 'full-gc', 'gc-log', 'streaming', 'jackson', 'grpc', 'jdk21', 'jfr']
  },
  {
    id: 'lab-gc-024',
    category: 'gc',
    title: 'Humongous allocation khi xuất Excel: mảng byte[] 3MB vượt ngưỡng region 4M, full GC lặp',
    level: 'senior',
    scenario: `**Bối cảnh (background):** App **báo cáo tài chính** (Spring Boot 3.3, JDK 17.0.11, G1) cho phép người dùng xuất báo cáo Excel hàng tháng. Endpoint {{GET /api/report/excel}} đọc dữ liệu từ PostgreSQL, ghi workbook Apache POI, rồi trả về **byte[]**. JVM: {{-Xms4g -Xmx4g -XX:+UseG1GC -XX:G1HeapRegionSize=4m -Xlog:gc*:file=/logs/gc.log:time,uptime,level,tags}}. Container: 2 vCPU, memory limit 4Gi.

**Thuật ngữ giải thích:**
- **Humongous object:** Trong G1, heap chia region bằng nhau (ở đây 4 MB). Object ≥ 50% region (≥ 2 MB) là humongous, cấp phát thẳng vào Old Gen trên region liên tiếp, không qua Eden.
- **G1HeapRegionSize=4m:** Mỗi region 4 MB. Ngưỡng humongous = 2 MB. Mảng byte[] 3 MB từ xuất Excel là humongous → chiếm 1 region liên tiếp, phần trống trong region bị lãng vì humongous object không chia region với object khác.
- **To-space exhausted:** Khi young GC cần copy object sống sang region mới nhưng không đủ region trống (bị humongous chiếm), G1 ném To-space exhausted → Full GC.

**Triệu chứng:** Từ **09:00-09:45 ngày 15/10/2026** (lần xuất báo cáo hàng tháng), p99 {{GET /api/report/excel}} tăng từ 800 ms lên **4-6 giây**. GC log ghi nhận **Pause Young (Concurrent Start) (G1 Humongous Allocation)** dày đặc, rồi **To-space exhausted**, **Pause Full (G1 Compaction Pause)** 2-3 giây. Heap used chỉ ~2.6 GB / 4 GB. Sau 09:45 xuất xong báo cáo, hệ thống ổn định. Dev đề xuất: "Tăng heap lên 8 GB và G1HeapRegionSize lên 8 MB."

**Dữ liệu thu thập:** GC log JDK 17, heap histogram lúc 09:30, đoạn code {{ReportService}} xuất Excel, JFR allocation profiling.`,
    artifacts: [
      {
        name: 'gc-report-excel.log',
        lang: 'text',
        content: `[2026-10-15T08:00:00.012+0700][0.012s][info][gc,init] Version: 17.0.11+7 (release)
[2026-10-15T08:00:00.012+0700][0.012s][info][gc,init] CPUs: 2 total, 2 available
[2026-10-15T08:00:00.012+0700][0.012s][info][gc,init] Memory: 4096M
[2026-10-15T08:00:00.012+0700][0.012s][info][gc,init] Heap Region Size: 4M
[2026-10-15T08:00:00.012+0700][0.012s][info][gc,init] Heap Min Capacity: 4G
[2026-10-15T08:00:00.012+0700][0.012s][info][gc,init] Heap Initial Capacity: 4G
[2026-10-15T08:00:00.012+0700][0.012s][info][gc,init] Heap Max Capacity: 4G
... (young GC bình thường, heap sau GC ~400-700 MB) ...
[2026-10-15T09:05:22.104+0700][4092.104s][info][gc] GC(112) Pause Young (Normal) (G1 Evacuation Pause) 1850M->520M(4096M) 14.201ms
[2026-10-15T09:08:12.330+0700][4292.330s][info][gc,start] GC(113) Pause Young (Concurrent Start) (G1 Humongous Allocation)
[2026-10-15T09:08:12.392+0700][4292.392s][info][gc,heap] GC(113) Old regions: 210->380
[2026-10-15T09:08:12.392+0700][4292.392s][info][gc,heap] GC(113) Humongous regions: 80->160
[2026-10-15T09:08:12.392+0700][4292.392s][info][gc] GC(113) Pause Young (Concurrent Start) (G1 Humongous Allocation) 1850M->1420M(4096M) 58.114ms
[2026-10-15T09:10:10.102+0700][4430.102s][info][gc] GC(114) Pause Young (Normal) (G1 Humongous Allocation) 2450M->1980M(4096M) 72.340ms
[2026-10-15T09:10:10.102+0700][4430.102s][info][gc,heap] GC(114) Old regions: 580->720
[2026-10-15T09:10:10.102+0700][4430.102s][info][gc,heap] GC(114) Humongous regions: 160->280
[2026-10-15T09:11:45.440+0700][4525.440s][info][gc] GC(115) Pause Young (Normal) (G1 Humongous Allocation) 2890M->2410M(4096M) 88.602ms
[2026-10-15T09:11:45.440+0700][4525.440s][info][gc,heap] GC(115) Old regions: 720->890
[2026-10-15T09:11:45.440+0700][4525.440s][info][gc,heap] GC(115) Humongous regions: 280->380
[2026-10-15T09:13:20.210+0700][4620.210s][info][gc] GC(116) Pause Young (Normal) (G1 Humongous Allocation) 3320M->2850M(4096M) 102.771ms
[2026-10-15T09:13:20.210+0700][4620.210s][info][gc] GC(116) To-space exhausted
[2026-10-15T09:13:20.210+0700][4620.210s][info][gc,heap] GC(116) Humongous regions: 380->460
[2026-10-15T09:13:20.211+0700][4620.211s][info][gc,start] GC(117) Pause Full (G1 Compaction Pause)
[2026-10-15T09:13:22.355+0700][4622.355s][info][gc,heap] GC(117) Old regions: 1020->110
[2026-10-15T09:13:22.355+0700][4622.355s][info][gc,heap] GC(117) Humongous regions: 460->460
[2026-10-15T09:13:22.355+0700][4622.355s][info][gc] GC(117) Pause Full (G1 Compaction Pause) 3420M->1120M(4096M) 2144.902ms
[2026-10-15T09:17:55.979+0700][4975.979s][info][gc] GC(118) To-space exhausted
[2026-10-15T09:17:55.979+0700][4975.979s][info][gc] GC(118) Pause Young (Normal) (G1 Evacuation Pause) 3120M->3080M(4096M) 319.004ms
[2026-10-15T09:18:10.001+0700][4990.001s][info][gc] GC(119) Pause Full (G1 Compaction Pause) 3080M->1180M(4096M) 2011.447ms
[2026-10-15T09:18:10.001+0700][4990.001s][info][gc,heap] GC(119) Humongous regions: 500->500
[2026-10-15T09:25:10.001+0700][5290.001s][info][gc] GC(120) Pause Young (Normal) (G1 Evacuation Pause) 2100M->480M(4096M) 18.102ms
[2026-10-15T09:25:10.001+0700][5290.001s][info][gc,heap] GC(120) Humongous regions: 500->10`
      },
      {
        name: 'jmap-histo-0930.txt',
        lang: 'text',
        content: `$ kubectl exec report-service-7d8f6c-x4k2p -- jmap -histo 1 | head -20
 num     #instances         #bytes  class name (module)
-------------------------------------------------------
   1:        125000      1250000000  [B (java.base@17.0.11)
   2:         10450       33440000  java.lang.String
   3:          8300       26560000  org.apache.poi.xssf.usermodel.XSSFCell
   4:          6200       19840000  org.apache.poi.xssf.usermodel.XSSFRow
   5:          4150       13280000  vn.report.model.ReportRow
Total        154100      1343120000`
      },
      {
        name: 'ReportService.java',
        lang: 'text',
        content: `package vn.report.service;

import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import vn.report.model.ReportData;
import java.util.List;

@Service
public class ReportService {

    private final ReportRepository repo;

    public byte[] exportExcel(String month) {
        List<ReportData> rows = repo.findByMonth(month);  // 50.000 dòng
        XSSFWorkbook workbook = new XSSFWorkbook();
        // ghi rows vào workbook ...
        // ĐỌC TOÀN BỘ workbook vào byte[] (3 MB)
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        workbook.write(baos);
        return baos.toByteArray();  // humongous nếu > 2 MB (region 4M)
    }
}`
      },
      {
        name: 'jfr-allocation-0930.txt',
        lang: 'text',
        content: `$ jcmd 1 JFR.start duration=2m filename=/tmp/report.jfr settings=profile
$ jfr print --events jdk.ObjectAllocationSample /tmp/report.jfr | head -50

jdk.ObjectAllocationSample {
  startTime = 09:12:03.412
  objectClass = byte[] (classLoader = bootstrap)
  weight = 3.1 MB
  eventThread = "http-nio-8080-exec-12"
  stackTrace = [
    java.util.Arrays.copyOf(byte[], int) line: 3537
    java.io.ByteArrayOutputStream.toByteArray() line: 211
    vn.report.service.ReportService.exportExcel(ReportService.java:28)
  ]
}

# Tổng hợp allocation rate lúc 09:12 (500 req/s):
# byte[] (ByteArrayOutputStream.toByteArray)  ~ 3.1 MB × 500 = 1.5 GB/s
# XSSFCell/XSSFRow/ReportRow                  ~ 800 MB/s
# TỔNG allocation rate ≈ 2.3 GB/s (chỉ cho export Excel)`
      }
    ],
    questions: [
      'Tại sao G1 liên tục báo "G1 Humongous Allocation", rồi "To-space exhausted" và "Pause Full"? Trích dòng cụ thể trong GC log và giải thích với region size 4 MB.',
      'Từ histogram và JFR, chứng minh object humongous là mảng byte[] nào, kích thước bao nhiêu, từ đâu.',
      'Chứng minh đây KHÔNG phải memory leak. Tăng heap hoặc G1HeapRegionSize có phải lời giải gốc không.',
      'Sửa ngắn hạn (code) và dài hạn (kiến trúc). Streaming export, giới hạn kích thước file, hay tăng region size?'
    ],
    hints: [
      'Region size 4 MB → ngưỡng humongous = 2 MB. Mảng byte[] 3 MB là humongous, chiếm 1 region liên tiếp, phần trống trong region bị lãng. Nhìn Humongous regions: 80 -> 160 -> 280 -> 380 -> 460 -> 500 (tăng đều), Full GC không giảm (460->460, 500->500).',
      'Histogram: {{jmap -histo}} gộp mọi mảng byte[] vào MỘT dòng (~125k instance, 1.25 GB); phần lớn dung lượng đến từ các mảng 3 MB của request xuất Excel đang chạy. JFR chỉ rõ byte[] 3.1 MB tại ReportService.java dòng 28 — ByteArrayOutputStream.toByteArray.',
      'GC(120) khi traffic giảm: Humongous regions 500->10, heap 2100M->480M. Khác với leak (leak thì heap sau GC tăng dần, Full GC không giảm humongous).',
      'Tăng G1HeapRegionSize 8 MB: ngưỡng humongous = 4 MB, response 3 MB không còn humongous, nhưng region 8 MB → heap 4 GB chỉ còn 512 region, giảm độ linh hoạt của G1. Chỉ là workaround.'
    ],
    answer: `**Tóm tắt:** Service đọc dữ liệu PostgreSQL, ghi workbook Apache POI vào **byte[]** ~3 MB, trả về cho client. Với **G1HeapRegionSize=4 MB**, mọi object **≥ 2 MB là humongous** → mảng byte[] 3 MB chiếm **1 region liên tiếp** trong Old Gen, phần trống trong region bị lãng. Nhiều request xuất Excel đồng thời tạo hàng trăm humongous object, Humongous regions tăng 80 → 500 (~2 GB), chặn region trống → {{To-space exhausted}} → **Pause Full 2-3 giây**. Khi traffic giảm, GC(120) thu hồi humongous 500->10 trong young GC thường, chứng minh **không leak**. Sửa gốc: **streaming export** (ghi workbook trực tiếp vào {{OutputStream}} của HTTP response, không đệm toàn bộ vào byte[]), giới hạn kích thước file xuất.

### Nguyên nhân gốc

1. **Region và ngưỡng:** GC log {{Heap Region Size: 4M}}. G1 coi object ≥ 2 MB là humongous. Cấp phát thẳng vào Old Gen trên region liên tiếp.
2. **Mảng byte[] 3 MB là humongous:** ReportService.exportExcel() đọc toàn bộ workbook vào byte[] qua {{ByteArrayOutputStream.toByteArray()}}. Mỗi mảng 3 MB ≥ 2 MB → chiếm 1 region (4 MB), phần 1 MB trống bị lãng.
3. **Allocation rate:** 500 req/s × 3.1 MB = 1.5 GB/s chỉ cho byte[], plus XSSFCell/XSSFRow/ReportRow ~800 MB/s. Tổng ~2.3 GB/s. Mỗi request tạo một humongous object → Humongous regions tăng 80 → 500.
4. **To-space exhausted:** Humongous regions chiếm 500 × 4 MB = 2 GB Old Gen. Chỉ còn ~2 GB region trống cho Eden+Survivor+Old thường. Khi Eden đầy, không đủ region trống để evacuate → To-space exhausted → Full GC.
5. **Full GC không giảm humongous:** GC(117) {{Humongous regions: 460->460}}, GC(119) {{500->500}}. Vì humongous object **vẫn được tham chiếu** bởi thread đang xử lý request (stack frame giữ byte[]), chúng là live data. Full GC chỉ di chuyển object còn sống, không thu hồi object vẫn reachable.

### Dẫn chứng (trích dòng cụ thể trong artifact)

| GC / Thời điểm | Dòng log trích | Ý nghĩa |
|---|---|---|
| GC(113) 09:08 | {{Pause Young (Concurrent Start) (G1 Humongous Allocation)}}, {{Humongous regions: 80->160}} | Bắt đầu có humongous |
| GC(114) 09:10 | {{Humongous regions: 160->280}} | +120 region = 480 MB humongous mới |
| GC(115) 09:11 | {{Humongous regions: 280->380}} | +100 region = 400 MB |
| GC(116) 09:13 | {{To-space exhausted}}, {{Humongous regions: 380->460}} | Cạn region trống |
| GC(117) 09:13 | {{Pause Full (G1 Compaction Pause) 3420M->1120M 2144ms}}, {{Humongous regions: 460->460}} | Full GC đầu, humongous không giảm |
| GC(119) 09:18 | {{Pause Full ... 2011ms}}, {{Humongous regions: 500->500}} | Full GC thứ 2, humongous không giảm |
| GC(120) 09:25 | {{Pause Young ... 2100M->480M}}, {{Humongous regions: 500->10}} | **Bằng chứng không leak**: traffic giảm, humongous 500->10, heap về 480 MB |
| JFR | {{weight = 3.1 MB}} tại {{ByteArrayOutputStream.toByteArray}} (ReportService.java:28) | Mảng byte[] 3 MB humongous mỗi request |
| Histogram | {{byte[]}} một dòng: 125.000 instance, 1.25 GB | {{jmap -histo}} gộp mọi mảng byte[] theo class, phần lớn là mảng 3 MB của request đang chạy |

### Cách sửa

**Ngắn hạn (giảm rủi ro ngay, deploy hôm nay):**
1. **Giới hạn đồng thời (bulkhead):** {{Semaphore}} hoặc Resilience4j Bulkhead tối đa 20-30 request xuất Excel đồng thời/pod. Trả 429 khi vượt.
2. **Giới hạn kích thước file:** Reject yêu cầu xuất > 10.000 dòng hoặc chuyển sang xuất theo khoảng thời gian nhỏ hơn.

**Dài hạn (sửa gốc, loại bỏ humongous):**
1. **Streaming export (khuyên dùng nhất):** Ghi workbook trực tiếp vào {{HttpServletResponse.getOutputStream()}}, không đệm toàn bộ vào byte[].

~~~java
public void exportExcel(String month, HttpServletResponse response) {
    List<ReportData> rows = repo.findByMonth(month);
    XSSFWorkbook workbook = new XSSFWorkbook();
    // ghi workbook trực tiếp vào response output stream, không đệm byte[]
    response.setContentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    try (OutputStream out = response.getOutputStream()) {
        workbook.write(out);
    }
}
~~~

2. **Tách luồng:** Export lớn đẩy vào queue, trả 202 Accepted ngay, client tải file khi xong. Không ảnh hưởng latency API.

### Phòng ngừa

- Alert khi GC log có {{To-space exhausted}} hoặc {{Pause Full (G1 Compaction Pause)}}.
- Alert khi cause {{G1 Humongous Allocation}} xuất hiện > 10 lần/phút.
- Theo dõi {{jvm_gc_live_data_size_bytes}} và allocation rate trên mỗi request.
- Code review: cám {{ByteArrayOutputStream.toByteArray()}}, {{workbook.write(baos)}} cho payload > 256 KB không có streaming. Yêu cầu ghi trực tiếp vào {{OutputStream}}.

### Trả lời mẫu khi phỏng vấn

"Khi xuất Excel, service đọc toàn bộ workbook vào một mảng byte[] khoảng 3 MB. Với G1HeapRegionSize 4 MB, mọi object lớn hơn 2 MB được coi là humongous, được cấp phát thẳng vào Old Gen trên các region liên tiếp. Khi có nhiều request xuất đồng thời, humongous region tăng nhanh, chiếm chỗ region trống, gây To-space exhausted và buộc Full GC mỗi 2-3 giây. Chứng minh không phải leak là khi traffic giảm, young GC thu hồi humongous region từ 500 xuống 10, heap trở về mức bình thường. Cách sửa là streaming export: ghi workbook trực tiếp vào output stream của HTTP response, không đệm byte[] trong heap, kết hợp bulkhead giới hạn số request xuất đồng thời."

> Senior tip: Humongous allocation là "kẻ giết G1 thầm lặng" vì app chạy ngon tuần đầu, sập khi payload lớn hơn một chút. Quy tắc: **mọi byte[] lớn từ file, report, export phải có giới hạn kích thước hoặc ghi streaming trực tiếp ra response**. Khi debug GC log, tìm chuỗi: {{G1 Humongous Allocation}} → {{To-space exhausted}} → {{Pause Full}} và so sánh {{Humongous regions}} trước/sau Full GC — nếu humongous không giảm sau Full GC nhưng giảm mạnh ở young GC sau khi tải hết, đó là humongous còn sống do request giữ, không phải leak.`,
    rubric: [
      'Giải thích đúng cơ chế: region 4M → ngưỡng 2M, object ≥ ngưỡng cấp phát thẳng Old Gen trên region liên tiếp, mảng byte[] 3 MB là humongous.',
      'Dẫn chứng GC log: Humongous regions 80→160→280→380→460→500, To-space exhausted (GC 116), Pause Full ~2s nhưng Humongous regions không giảm (460->460, 500->500).',
      'Chứng minh không leak: GC(120) Humongous regions 500->10, heap 2100M->480M khi traffic giảm; phân biệt humongous sống tạm vs leak.',
      'Chỉ đúng code gây ra: ReportService.java dòng 28, ByteArrayOutputStream.toByteArray tạo mảng byte[] 3 MB; JFR weight 3.1 MB khớp.',
      'Đề xuất có chiều sâu: streaming export ghi trực tiếp vào OutputStream loại bỏ humongous hoàn toàn; bulkhead giới hạn đồng thời; giới hạn kích thước file; giải thích tăng RegionSize/heap chỉ là workaround.'
    ],
    tags: ['g1', 'humongous', 'full-gc', 'gc-log', 'excel', 'poi', 'streaming', 'jdk17', 'jfr']
  },
  {
    id: 'lab-gc-025',
    category: 'gc',
    title: 'Metaspace tăng mãi sau mỗi reload script: GroovyClassLoader mới mỗi lần, cache class không xóa',
    level: 'senior',
    scenario: `**Bối cảnh (background):** App **quyết định tín dụng** (Spring Boot 3.3, JDK 17.0.11, G1) cho phép admin viết script Groovy để tính toán quy tắc tín dụng động. Mỗi khi file script thay đổi, app reload bằng cách tạo {{GroovyClassLoader}} mới. JVM: {{-Xms4g -Xmx4g -XX:+UseG1GC -XX:MetaspaceSize=256m -XX:MaxMetaspaceSize=512m -Xlog:gc*:file=/logs/gc.log:time,uptime,level,tags}}. Container: 2 vCPU, memory limit 4Gi.

**Thuật ngữ giải thích:**
- **Metaspace:** Vùng bộ nhớ native lưu metadata của class (tên class, method, constant pool, bytecode). Thay thế PermArea từ Java 8. Metaspace có thể tự co giãn nhưng bị hạn chế bởi {{-XX:MaxMetaspaceSize}}.
- **GroovyClassLoader:** ClassLoader của Groovy dùng để biên dịch script .groovy thành class Java tại runtime. Mỗi instance GroovyClassLoader giữ các class nó đã compile.
- **ClassLoader GC:** Một ClassLoader chỉ có thể bị GC khi **không còn instance nào** của class mà nó đã load và chính ClassLoader đó không còn được tham chiếu. Nếu app giữ reference đến class/script, ClassLoader cũ không thể bị thu hồi → Metaspace tăng mãi.
- **Full GC (Metadata GC Threshold):** Khi Metaspace đạt ngưỡng, G1 chạy Full GC để thu hồi class không dùng nữa. Nếu classloader cũ vẫn bị giữ, Metaspace không giảm, Full GC lặp lại mãi.

**Triệu chứng:** Từ **10:00-12:00 ngày 20/10/2026**, admin sửa script tính toán tín dụng 4 lần (mỗi lần sửa 1 ký tự). Sau mỗi lần sửa, Metaspace tăng ~80 MB và không giảm trở lại. Full GC (Metadata GC Threshold) chạy mỗi 15-30 phút, mỗi lần 300-500 ms, nhưng Metaspace chỉ giảm vài MB. Heap used ổn định ~2.5 GB / 4 GB. CPU tăng do Full GC lặp lại.

**Dữ liệu thu thập:** GC log JDK 17, jcmd class_stats, đoạn code {{ScriptEngine}} reload script, ví dụ script Groovy.`,
    artifacts: [
      {
        name: 'gc-metaspace.log',
        lang: 'text',
        content: `[2026-10-20T08:00:00.012+0700][0.012s][info][gc,init] Version: 17.0.11+7 (release)
[2026-10-20T08:00:00.012+0700][0.012s][info][gc,init] CPUs: 2 total, 2 available
[2026-10-20T08:00:00.012+0700][0.012s][info][gc,init] Memory: 4096M
[2026-10-20T08:00:00.012+0700][0.012s][info][gc,init] Heap Region Size: 4M
[2026-10-20T08:00:00.012+0700][0.012s][info][gc,init] Metaspace Size: 256M
[2026-10-20T08:00:00.012+0700][0.012s][info][gc,init] Max Metaspace Size: 512M
... (Metaspace 256M lúc khởi động, young GC bình thường) ...
[2026-10-20T10:15:30.102+0700][7530.102s][info][gc] GC(200) Pause Young (Normal) 1850M->520M(4096M) 14.201ms
[2026-10-20T10:15:30.102+0700][7530.102s][info][gc,heap] Metaspace 320M->320M(512M)
[2026-10-20T11:02:45.440+0700][7935.440s][info][gc] GC(201) Pause Full (Metadata GC Threshold) 3120M->3080M(4096M) 319.004ms
[2026-10-20T11:02:45.440+0700][7935.440s][info][gc,heap] Metaspace 480M->480M(512M)
[2026-10-20T11:30:10.001+0700][8110.001s][info][gc] GC(202) Pause Full (Metadata GC Threshold) 3080M->3050M(4096M) 411.207ms
[2026-10-20T11:30:10.001+0700][8110.001s][info][gc,heap] Metaspace 510M->510M(512M)
[2026-10-20T11:45:20.001+0700][8220.201s][info][gc] GC(203) Pause Full (Metadata GC Threshold) 3050M->3020M(4096M) 502.301ms
[2026-10-20T11:45:20.001+0700][8220.201s][info][gc,heap] Metaspace 511M->511M(512M)`
      },
      {
        name: 'jcmd-metaclass.txt',
        lang: 'text',
        content: `$ jcmd 1 GC.class_stats | grep GroovyClassLoader
   1247  1247  1247  1247  1247  groovy.lang.GroovyClassLoader
   1248  1248  1248  1248  1248  groovy.lang.GroovyClassLoader
   1249  1249  1249  1249  1249  groovy.lang.GroovyClassLoader
   1250  1250  1250  1250  1250  groovy.lang.GroovyClassLoader
   ...
# Tổng cộng: 1250 instance GroovyClassLoader, mỗi instance giữ 1 class Script_NNN đã compile
# Metaspace: 511 MB / 512 MB (gần đầy)
# Chỉ có 1 instance ScriptEngine nhưng giữ reference đến 1250 class qua GroovyClassLoader`
      },
      {
        name: 'ScriptEngine.java',
        lang: 'text',
        content: `package vn.script.engine;

import groovy.lang.GroovyClassLoader;
import groovy.lang.Script;
import org.springframework.stereotype.Service;
import java.io.File;
import java.nio.file.Path;
import java.nio.file.Paths;

@Service
public class ScriptEngine {

    private final Path scriptDir = Paths.get("/etc/app/scripts");

    public Object run(String scriptName, Object... args) {
        File scriptFile = scriptDir.resolve(scriptName + ".groovy").toFile();
        // TẠO GroovyClassLoader MỖI LẦN gọi, không cache class
        GroovyClassLoader gcl = new GroovyClassLoader();
        Class<?> clazz = gcl.parseClass(scriptFile);
        try {
            Script script = (Script) clazz.getDeclaredConstructor().newInstance();
            return script.run(args);
        } catch (Exception e) {
            throw new IllegalStateException(e);
        }
    }
}`
      },
      {
        name: 'credit-score.groovy',
        lang: 'text',
        content: `class CreditScoreScript {
    static Object run(Object... args) {
        // Tính điểm tín dụng từ thông tin khách hàng, gọi DB, trả Map kết quả
        return [score: 720, level: 'tốt', month: args[0]]
    }
}`
      }
    ],
    questions: [
      'Tại sao Metaspace tăng mãi sau mỗi reload script dù heap ổn định? Trích dòng cụ thể trong GC log và jcmd.',
      'Tại sao Full GC (Metadata GC Threshold) không làm Metaspace giảm? classloader cũ bị ai giữ reference?',
      'Chứng minh đây KHÔNG phải memory leak trong heap. Tăng MaxMetaspaceSize có phải lời giải gốc không?',
      'Sửa ngắn hạn và dài hạn. Cache class/classloader, kiểm tra reference, hay tăng Metaspace?'
    ],
    hints: [
      'GC log: Metaspace 320M->480M->510M->511M, Full GC (Metadata GC Threshold) lặp lại nhưng Metaspace không giảm (480M->480M, 510M->510M, 511M->511M).',
      'jcmd: 1250 instance GroovyClassLoader, mỗi instance giữ 1 class Script_NNN. Mỗi lần reload tạo GroovyClassLoader mới, class cũ không bị GC vì ScriptEngine vẫn giữ reference qua biến cục bộ gcl hoặc cache không được xóa.',
      'Heap ổn định ~2.5 GB → không phải heap leak. Vấn đề nằm ở Metaspace (native memory cho class metadata).',
      'Tăng MaxMetaspaceSize 1G: Metaspace vẫn tăng mãi, chỉ trì hoãn sự cố. Full GC vẫn chạy dày, CPU vẫn tăng.'
    ],
    answer: `**Tóm tắt:** App reload script Groovy bằng cách tạo {{GroovyClassLoader}} mới mỗi lần, không cache class đã compile. Mỗi script được compile thành class Java riêng, được load bởi classloader của nó. Khi ScriptEngine chạy script, nó giữ reference đến class và classloader đó. Vì classloader cũ không bao giờ bị thu hồi (vẫn có reference), class metadata của nó stays trong Metaspace mãi. Sau 4 lần reload, Metaspace tăng ~80 MB/lần, đạt 511 MB/512 MB, Full GC (Metadata GC Threshold) chạy liên tục nhưng không thu hồi được classloader cũ.

### Nguyên nhân gốc

1. **Metaspace và class metadata:** Metaspace lưu tên class, method, bytecode, constant pool. Giống heap nhưng lưu class metadata thay vì object instance. Bị giới hạn bởi {{-XX:MaxMetaspaceSize=512m}}.
2. **GroovyClassLoader mới mỗi lần:** ScriptEngine.run() tạo {{new GroovyClassLoader()}} mỗi lần gọi. Mỗi classloader compile script thành class Java, giữ class đó trong Metaspace.
3. **ClassLoader không bị GC:** Một ClassLoader chỉ bị GC khi không còn instance của class nó load và chính ClassLoader không còn được tham chiếu. ScriptEngine giữ reference đến class/script qua biến cục bộ hoặc stack frame, nên classloader cũ không thể bị thu hồi.
4. **Full GC không giảm Metaspace:** GC(201) {{Metaspace 480M->480M}}, GC(202) {{510M->510M}}, GC(203) {{511M->511M}}. Vì classloader cũ vẫn còn reference, class metadata vẫn là live data. Full GC chỉ quét và đánh dấu, không thu hồi được classloader còn sống.
5. **Tăng Metaspace không phải fix gốc:** Metaspace vẫn tăng mỗi lần reload, chỉ bị chậm hơn. Cuối cùng cũng đầy 512 MB, Full GC lặp lại mãi.

### Dẫn chứng (trích dòng cụ thể trong artifact)

| Thời điểm | Dòng log trích | Ý nghĩa |
|---|---|---|
| GC(200) 10:15 | {{Metaspace 320M->320M(512M)}} | Metaspace ban đầu 320 MB, ổn định |
| GC(201) 11:02 | {{Pause Full (Metadata GC Threshold)}}, {{Metaspace 480M->480M(512M)}} | Full GC đầu, Metaspace không giảm sau GC |
| GC(202) 11:30 | {{Pause Full (Metadata GC Threshold)}}, {{Metaspace 510M->510M(512M)}} | Metaspace gần đầy, Full GC không giúp |
| GC(203) 11:45 | {{Pause Full (Metadata GC Threshold)}}, {{Metaspace 511M->511M(512M)}} | Metaspace 511/512 MB, sắp hết |
| jcmd | {{1250 instance GroovyClassLoader}} | Mỗi reload tạo 1 classloader mới, không bao giờ bị GC |
| jcmd | {{Mỗi instance giữ 1 class Script_NNN}} | Class metadata của script cũ stays trong Metaspace mãi |

### Cách sửa

**Ngắn hạn (giảm rủi ro ngay, deploy hôm nay):**
1. **Tăng MaxMetaspaceSize tạm thời:** Tăng lên 1 GB để trì hoãn sự cố, nhưng KHÔNG phải fix gốc.
2. **Giới hạn tần suất reload:** Chỉ reload script không quá 1 lần/phút, tránh tạo quá nhiều classloader.

**Dài hạn (sửa gốc, loại bỏ rò rỉ Metaspace):**
1. **Cache class theo tên script:** Dùng {{ConcurrentHashMap<String, Class<?>>}} cache class đã compile. Chỉ compile lại khi file script thực sự thay đổi (kiểm tra lastModified).
2. **Sử dụng một GroovyClassLoader cha và cache:** Tạo một GroovyClassLoader duy nhất, cache class theo tên script. Khi script thay đổi, tạo classloader mới chỉ cho script đó, xóa classloader cũ khỏi cache để cho phép GC.

~~~java
private final Map<String, Class<?>> scriptCache = new ConcurrentHashMap<>();
private final Map<String, Long> scriptLastModified = new ConcurrentHashMap<>();
private final GroovyClassLoader parentLoader = new GroovyClassLoader();

public Object run(String scriptName, Object... args) {
    File scriptFile = scriptDir.resolve(scriptName + ".groovy").toFile();
    long lastModified = scriptFile.lastModified();
    Long cachedModified = scriptLastModified.get(scriptName);
    if (cachedModified != null && cachedModified == lastModified) {
        Class<?> clazz = scriptCache.get(scriptName);
        return runScript(clazz, args);
    }
    Class<?> clazz = parentLoader.parseClass(scriptFile);
    scriptCache.put(scriptName, clazz);
    scriptLastModified.put(scriptName, lastModified);
    return runScript(clazz, args);
}

private Object runScript(Class<?> clazz, Object... args) {
    try {
        Script script = (Script) clazz.getDeclaredConstructor().newInstance();
        return script.run(args);
    } catch (Exception e) {
        throw new IllegalStateException(e);
    }
}
~~~

3. **Clear cache khi cần:** Nếu script bị xóa, xóa entry trong cache để classloader có thể bị GC.

### Phòng ngừa

- Alert khi Metaspace > 80% MaxMetaspaceSize.
- Theo dõi số lượng ClassLoader qua {{jcmd GC.class_stats}}.
- Giới hạn số script được reload, không cho phép admin sửa script quá thường xuyên.
- Code review: cấm tạo {{new GroovyClassLoader()}} hoặc {{new URLClassLoader()}} trong vòng lặp hoặc mỗi request. Cache class theo tên file.

### Trả lời mẫu khi phỏng vấn

"App reload script Groovy bằng cách tạo GroovyClassLoader mới mỗi lần file thay đổi. Mỗi script được compile thành class Java, được load bởi classloader của nó. Khi ScriptEngine chạy script, nó giữ reference đến class và classloader. Vì classloader cũ không bao giờ bị thu hồi, class metadata của nó stays trong Metaspace mãi. Sau 4 lần reload, Metaspace tăng từ 320 MB lên 511 MB, Full GC (Metadata GC Threshold) chạy liên tục nhưng không giảm được Metaspace. Cách sửa là cache class theo tên script: dùng ConcurrentHashMap lưu class đã compile, chỉ compile lại khi file thực sự thay đổi, dùng một GroovyClassLoader cha dùng chung. Khi script bị xóa, xóa khỏi cache để classloader có thể bị GC và Metaspace được thu hồi."

> Senior tip: Metaspace leak do classloader là "kẻ giết silenzieux" sau mỗi lần deploy hoặc reload config. Mỗi ClassLoader tạo ra là một vùng Metaspace không bao giờ được thu hồi nếu class vẫn có instance sống. Quy tắc vàng: **không bao giờ tạo ClassLoader mới mà không có kế hoạch xóa nó**. Luôn cache class theo tên, dùng một classloader cha, và clear cache khi không cần nữa. Giám sát Metaspace bằng {{jcmd GC.class_stats}} và alert khi Metaspace > 80% MaxMetaspaceSize.`,
    rubric: [
      'Giải thích đúng cơ chế: Metaspace lưu class metadata, GroovyClassLoader mới mỗi lần reload, classloader cũ không bị GC vì vẫn có reference.',
      'Dẫn chứng GC log: Metaspace 320M->480M->510M->511M, Full GC (Metadata GC Threshold) không giảm Metaspace (480->480, 510->510, 511->511).',
      'Chứng minh không heap leak: heap ổn định ~2.5 GB, vấn đề nằm ở Metaspace (native memory cho class metadata).',
      'Chỉ đúng code gây ra: ScriptEngine.java tạo {{new GroovyClassLoader()}} mỗi lần gọi, không cache class; jcmd cho thấy 1250 instance GroovyClassLoader.',
      'Đề xuất có chiều sâu: cache class theo tên script trong ConcurrentHashMap, kiểm tra lastModified trước khi compile lại, dùng một GroovyClassLoader cha, clear cache khi script xóa; giải thích tăng MaxMetaspaceSize chỉ là workaround.'
    ],
    tags: ['metaspace', 'classloader', 'groovy', 'full-gc', 'metadata-gc-threshold', 'cache', 'jdk17']
  },
  {
    id: 'lab-gc-026',
    category: 'gc',
    title: 'Full GC (Ergonomics) 4.2 giây trên heap 24 GB dùng Parallel GC',
    level: 'senior',
    scenario: `**Bối cảnh:** Hệ thống đặt vé máy bay (Spring Boot 3.1, JDK 17.0.11) chạy trên pod 8 vCPU, memory limit 32Gi, JVM khởi động với {{-Xms24g -Xmx24g -XX:+UseParallelGC -XX:+UseParallelOldGC}} và bật GC log bằng {{-Xlog:gc*:file=/logs/gc.log:time,uptime,level,tags}}. Trên heap 24 GB, đối tượng ngắn sống được phân phối đều, promotion vào Old Generation ổn định khoảng 300–400 MB/giờ. Không có memory leak, heap dùng ổn định ~16 GB trong 24 giờ.

**Triệu chứng:** Lúc 03:15–03:20 ngày 20/11/2026, p99 của API đặt vé tăng từ 200 ms lên khoảng 5 giây, Prometheus ghi nhận Full GC mỗi khoảng 2 giờ, CPU chỉ khoảng 2.5/8 core. Pod không bị OOMKilled, không có {{OutOfMemoryError}}. Dev on-call nghi memory leak và đề xuất tăng heap lên 32 GB.

**Dữ liệu thu thập:** GC log của pod (đã lược bớt các đoạn lặp) và thông số JVM hiện tại.`,
    artifacts: [
      {
        name: 'gc-booking-24g.log',
        lang: 'text',
        content: `[2026-11-20T03:10:00.000+0700][0.000s][info][gc,init] Version: 17.0.11+9 (release)
[2026-11-20T03:10:00.000+0700][0.000s][info][gc,init] CPUs: 8 total, 8 available
[2026-11-20T03:10:00.000+0700][0.000s][info][gc,init] Memory: 32768M
[2026-11-20T03:10:00.000+0700][0.000s][info][gc,init] Heap Min Capacity: 24G
[2026-11-20T03:10:00.000+0700][0.000s][info][gc,init] Heap Max Capacity: 24G
[2026-11-20T03:10:00.000+0700][0.000s][info][gc,init] UseParallelGC: true
[2026-11-20T03:10:00.000+0700][0.000s][info][gc,init] UseParallelOldGC: true
[2026-11-20T03:15:30.123+0700][330.123s][info][gc] GC(0) Pause Young (Allocation Failure) 812M->164M(24576M), 0.145s
[2026-11-20T03:15:30.270+0700][330.270s][info][gc] GC(1) Pause Full (Ergonomics) 164M->158M(24576M), 4.212s
[2026-11-20T03:17:00.456+0700][420.456s][info][gc] GC(2) Pause Young (Allocation Failure) 790M->170M(24576M), 0.138s
[2026-11-20T03:17:00.596+0700][420.596s][info][gc] GC(3) Pause Full (Ergonomics) 170M->162M(24576M), 4.189s
[2026-11-20T05:15:00.100+0700][7200.100s][info][gc] GC(10) Pause Young (Allocation Failure) 805M->168M(24576M), 0.142s
[2026-11-20T05:15:00.250+0700][7200.250s][info][gc] GC(11) Pause Full (Ergonomics) 168M->160M(24576M), 4.205s`
      }
    ],
    questions: [
      'Nguyên nhân gốc của pause 4.2 giây là gì? Đây có phải memory leak không? Dẫn chứng từ GC log.',
      'Bạn sẽ sửa thế nào ngắn hạn và dài hạn? Giải thích tại sao không nên chỉ tăng heap lên 32 GB.'
    ],
    hints: [
      'Nhìn vào tên loại GC trong log: Pause Full (Ergonomics) nghĩa là JVM tự quyết định full GC, không phải do hết heap.',
      'So sánh thời gian: Young GC 0.14s, Full GC 4.2s. Heap sau full GC vẫn gần 24 GB (164M->158M của 24576M), chỉ thu hồi 6 MB.',
      'Heap 24 GB với Parallel GC, full GC phải quét và nén toàn bộ heap → pause dài. Heap dùng ổn định ~16 GB chứng minh không có memory leak.'
    ],
    answer: `**Tóm tắt:** Ứng dụng dùng Parallel GC với heap 24 GB, mỗi khoảng 2 giờ JVM kích hoạt Full GC (Ergonomics) để nén heap, pause stop-the-world 4.2 giây, làm p99 API vọt lên 5 giây. Nguyên nhân không phải memory leak, mà là Parallel GC dừng toàn bộ ứng dụng để compact heap lớn. Sửa bằng chuyển sang G1 hoặc ZGC, giới hạn pause qua {{MaxGCPauseMillis}}; không nên chỉ tăng heap.

### Nguyên nhân gốc

JDK 17 với {{-XX:+UseParallelGC}} dùng Parallel Scavenge cho young generation và Parallel Old cho old generation. Khi heap đạt ngưỡng ergonomics (dùng khoảng 60–70% heap hoặc allocation rate cao), JVM kích hoạt Full GC (Ergonomics) — một pause stop-the-world để compact toàn bộ heap. Trên heap 24 GB, việc quét và nén 24 GB cần vài giây, nên pause 4.2 giây là tiêu chuẩn với Parallel GC. Heap dùng ổn định ~16 GB và promotion ổn định chứng minh không có memory leak.

### Dẫn chứng

GC log ghi rõ:

~~~text
[2026-11-20T03:15:30.123+0700][330.123s][info][gc] GC(0) Pause Young (Allocation Failure) 812M->164M(24576M), 0.145s
[2026-11-20T03:15:30.270+0700][330.270s][info][gc] GC(1) Pause Full (Ergonomics) 164M->158M(24576M), 4.212s
[2026-11-20T05:15:00.250+0700][7200.250s][info][gc] GC(11) Pause Full (Ergonomics) 168M->160M(24576M), 4.205s
~~~

- Pause Full (Ergonomics): full GC do chính JVM quyết định, không phải allocation thất bại.
- 164M->158M(24576M): chỉ thu hồi 6 MB, heap sau GC vẫn gần đầy 24 GB, mục đích là compact heap không phải thu hồi rác.
- 4.212s và 4.205s: pause stop-the-world khoảng 4.2 giây, khớp với p99 API 5 giây.
- Young GC chỉ 0.138–0.145s, không gây vấn đề; vấn đề nằm ở Full GC hiếm nhưng dài.
- Promotion ổn định 300–400 MB/giờ, heap ~16 GB ổn định 24 giờ, không có memory leak, không nên tăng heap.

### Cách sửa

1. Chuyển sang G1GC (khuyên dùng cho heap lớn):
~~~java
-XX:+UseG1GC -XX:MaxGCPauseMillis=200 -Xms24g -Xmx24g
~~~
G1 chia heap thành vùng, compact tăng dần, không dừng toàn bộ heap trong 4 giây. Với heap 24 GB, G1 thường giữ pause dưới 200 ms.

2. Nếu latency cực kỳ nhạy cảm, dùng ZGC (JDK 17 có ZGC ổn định):
~~~java
-XX:+UseZGC -Xms24g -Xmx24g
~~~
ZGC pause thường dưới 10 ms, không phụ thuộc heap size.

3. Giảm heap nếu không cần 24 GB: heap dùng ~16 GB, có thể giảm xuống 16–20 GB để Full GC ngắn hơn nếu vẫn dùng Parallel GC.

Không nên chỉ tăng heap lên 32 GB: Full GC sẽ thậm chí dài hơn, không giải quyết gốc rễ.

### Phòng ngừa

- Alert khi pause GC > 1 giây qua Prometheus hoặc parse GC log.
- Theo dõi Full GC (Ergonomics) tần suất; xuất hiện định kỳ mỗi 1–2 giờ là dấu hiệu JVM đang nén heap, cần đổi GC.
- Trước khi thay đổi GC trên production, chạy test nhẹ với cùng heap và workload để đo pause thực tế.
- Không cài MaxGCPauseMillis quá thấp (ví dụ 10 ms) với G1 trên heap 24 GB nếu throughput bị ảnh hưởng; 100–200 ms là điểm cân bằng hợp lý.

> Senior tip: Full GC (Ergonomics) trên heap lớn với Parallel GC là kẻ giết silencio của latency. Không phải mọi pause dài là memory leak; heap ổn định nhưng full GC 4 giây là yếu cấu trúc của GC lựa chọn. Quy tắc: heap trên 4–8 GB và latency nhạy cảm nên dùng G1 hoặc ZGC, không dùng Parallel GC. Luôn đo pause thực tế bằng GC log trước khi quyết định tăng heap.`,
    rubric: [
      'Giải thích đúng cơ chế: Full GC (Ergonomics) là JVM tự kích hoạt để compact heap, không phải do OutOfMemory hoặc allocation thất bại.',
      'Dẫn chứng GC log: Pause Full (Ergonomics), 164M->158M(24576M) chỉ thu hồi 6 MB, pause 4.212s/4.205s khớp p99 5 giây.',
      'Chứng minh không heap leak: heap ổn định ~16 GB, promotion ổn định, không OOMKilled.',
      'Chỉ đúng gốc rễ: heap 24 GB + Parallel GC, full GC quét nén toàn bộ heap gây pause dài.',
      'Đề xuất có chiều sâu: chuyển G1 hoặc ZGC, cài MaxGCPauseMillis, giảm heap nếu không cần; giải thích tại sao không tăng heap lên 32 GB.'
    ],
    tags: ['gc', 'full-gc', 'ergonomics', 'parallel-gc', 'g1gc', 'zgc', 'maxgcpausemillis', 'heap-24gb', 'jdk17', 'pause']
  },
  {
    id: 'lab-gc-027',
    category: 'gc',
    title: 'Young GC mỗi 300 ms do StringBuilder từ ghép chuỗi trong log.debug',
    level: 'senior',
    scenario: `**Bối cảnh:** Hệ thống xử lý đơn hàng (Spring Boot 3.1, JDK 17.0.11, SLF4J + Logback) chạy trên pod 4 vCPU, memory limit 8Gi, JVM {{-Xms4g -Xmx4g -XX:+UseG1GC}}. Ứng dụng ghi log rất nhiều ở mức DEBUG trong module xử lý đơn hàng, ví dụ:

log.debug("Đã xử lý đơn " + orderId + " của khách " + customerName + " tổng " + total + " lúc " + now);

Mỗi request ghi 5–10 dòng như vậy. Heap 4 GB, allocation rate cao.

**Triệu chứng:** Từ 14:00–14:30 ngày 20/11/2026, Young GC xảy ra mỗi khoảng 300 ms, mỗi lần pause 50–80 ms, CPU dành cho GC đạt 35–40%. p99 API xử lý đơn tăng từ 150 ms lên 700 ms. Heap dùng ổn định ~2.5 GB, không tăng theo thời gian, không có {{OutOfMemoryError}}. JFR ghi nhận StringBuilder và String[] là top đối tượng được phân phối, chủ yếu là từ thread http-nio-8080-exec-XX. Dev on-call nghi memory leak và đề xuất tăng heap lên 8 GB.

**Dữ liệu thu thập:** GC log và tóm tắt JFR (allocations by class, by thread).`,
    artifacts: [
      {
        name: 'gc-order-4g.log',
        lang: 'text',
        content: `[2026-11-20T14:00:00.000+0700][0.000s][info][gc] GC(0) Pause Young (Allocation Failure) 850M->210M(4096M), 0.052s
[2026-11-20T14:00:00.300+0700][0.300s][info][gc] GC(1) Pause Young (Allocation Failure) 880M->215M(4096M), 0.061s
[2026-11-20T14:00:00.600+0700][0.600s][info][gc] GC(2) Pause Young (Allocation Failure) 890M->212M(4096M), 0.058s
[2026-11-20T14:00:00.900+0700][0.900s][info][gc] GC(3) Pause Young (Allocation Failure) 900M->218M(4096M), 0.070s
[2026-11-20T14:00:01.200+0700][1.200s][info][gc] GC(4) Pause Young (Allocation Failure) 895M->214M(4096M), 0.055s
[2026-11-20T14:00:01.500+0700][1.500s][info][gc] GC(5) Pause Young (Allocation Failure) 888M->216M(4096M), 0.063s`
      },
      {
        name: 'jfr-allocation-top.txt',
        lang: 'text',
        content: `JFR Allocation by class (top 5, 14:00-14:30):
1. java.lang.StringBuilder: 1840 MB, 46M instances, thread http-nio-8080-exec-01..20
2. java.lang.String[]: 950 MB, 24M instances
3. char[]: 620 MB
4. java.lang.String: 410 MB
5. java.util.ArrayList: 90 MB

Allocation rate: 6 GB/phut
Young GC: moi 300 ms, pause 50-80 ms, GC CPU 38%`
      }
    ],
    questions: [
      'Nguyên nhân gốc của Young GC moi 300 ms la gi? Dang chung tu GC log va JFR.',
      'Ban se sua code the nao? Gian thich tai sao dung placeholder {} thay vi phep cong +.',
      'Tai sao heap dung on dinh 2.5 GB nhung GC CPU van dat 38%?'
    ],
    hints: [
      'Nhìn vào GC log: Young GC moi 300 ms chinh xac, pause 50-80 ms, heap sau GC chi 210 MB trong 4 GB, cap phat cao khong het day.',
      'JFR cho thay StringBuilder la top allocation, tu thread xu ly request, ma code tao StringBuilder tam trong moi dong log.',
      'Phep cong chuoi voi + luon duoc tinh toan truoc khi goi log.debug, ngay khi DEBUG bi tat. Dung placeholder {} cua SLF4J de tham so chi duoc danh gia khi DEBUG bat.'
    ],
    answer: `**Tom tat:** Ung dung dung phep cong chuoi (+) trong log.debug, tao ra StringBuilder tam thoi cho moi dong log ngay khi DEBUG bi tat. Cap phat khoang 6 GB/phut gat Young GC moi 300 ms, pause 50-80 ms, GC CPU 38%. Heap dung on dinh 2.5 GB chung minh khong co memory leak. Sua bang placeholder {} cua SLF4J va tu chon boc bang isDebugEnabled. Khong nen tang heap.

### Nguyen nhan goc

Trong Java, phep cong chuoi voi + duoc compiler dich thanh new StringBuilder().append(...).toString(). Moi lan goi:

log.debug("Da xu ly don " + orderId + " cua khach " + customerName + " tong " + total);

may ao tao mot StringBuilder va nhieu String trung gian, roi goi log.debug. Neu Logback dang o muc INFO, debug message bi bo qua, nhung StringBuilder da duoc tao va phai duoc GC. Voi 5-10 dong log moi request va hang ngan request/giay, cap phat dat vay GB/phut, Eden vung nhanh day, Young GC kich hoat moi 300 ms.

### Dan chung

GC log:

~~~text
[2026-11-20T14:00:00.000+0700][0.000s][info][gc] GC(0) Pause Young (Allocation Failure) 850M->210M(4096M), 0.052s
[2026-11-20T14:00:00.300+0700][0.300s][info][gc] GC(1) Pause Young (Allocation Failure) 880M->215M(4096M), 0.061s
[2026-11-20T14:00:00.600+0700][0.600s][info][gc] GC(2) Pause Young (Allocation Failure) 890M->212M(4096M), 0.058s
~~~

- Young GC moi 300 ms chinh xac (0.000, 0.300, 0.600, 0.900, 1.200, 1.500 giay).
- 850M->210M(4096M): sau moi GC chi con song 210 MB, heap 4 GB con rat trong, khong het day ma la Eden day do cap phat cao.
- Pause 50-80 ms, GC CPU 38%, phan lon CPU dung cho GC thay vi xu ly request.

JFR:
- StringBuilder: 1840 MB, 46 trieu instances, tu thread http-nio-8080-exec.
- String[]: 950 MB.
- Cap phat: 6 GB/phut.

Heap dung on dinh 2.5 GB, khong tang thoi gian, khong co memory leak.

### Cach sua

1. Dung placeholder {} cua SLF4J:
~~~java
log.debug("Da xu ly don {} cua khach {} tong {} luc {}", orderId, customerName, total, now);
~~~
Voi SLF4J, cac tham so chi duoc chuyen thanh chuoi khi DEBUG bat. Neu Logback o muc INFO, khong tao StringBuilder nao.

2. Tu chon: boc bang isDebugEnabled cho doi tuong tốn kém de tao chuoi:
~~~java
if (log.isDebugEnabled()) {
    log.debug("Da xu ly don {} cua khach {} tong {}", orderId, customerName, expensiveToString());
}
~~~
isDebugEnabled tránh goi expensiveToString() khi DEBUG tat.

3. Khong nen dung phep cong + trong log.debug, log.info, ngay khi muc log bi tat.

### Phong ngua

- Code review: cam phep cong chuoi (+) trong cac lenh log.debug/log.info/log.trace.
- Theo doi cap phat va Young GC tan suat qua JFR / GC log; Young GC duoi 1 giay mot lan la binh thuong, moi 300 ms la bat thuong.
- Alert khi GC CPU 20% lien tuc.
- Trong production, de Logback o muc INFO hoac WARN, chi bat DEBUG tam thoi khi debug su co.

> Senior tip: Phep cong chuoi trong log.debug la ke giet silencio cua throughput, heap khong rot rinh nhung cap phat cao lam GC CPU tieu tốn 30-40%. Luon dung placeholder {} cua SLF4J, no mien phi khi DEBUG tat. Neu doi tuong log tốn kém de tao chuoi, boc bang isDebugEnabled. Tang heap khong sua van de cap phat, chi lam Young GC it lan hon nhung moi lan dai hon.`,
    rubric: [
      'Giai thich dung co che: phep cong + trong log.debug tao StringBuilder tam ngay khi DEBUG bi tat.',
      'Dang chung GC log: Young GC moi 300 ms, pause 50-80 ms, 850M->210M(4096M) chi con 210 MB, heap con trong.',
      'Dang chung JFR: StringBuilder top allocation, cap phat 6 GB/phut, GC CPU 38%.',
      'Chung minh khong heap leak: heap on dinh 2.5 GB, khong tang thoi gian.',
      'De xuat co chieu sau: dung placeholder {} cua SLF4J, tu chon isDebugEnabled; giai thich tai sao khong tang heap.'
    ],
    tags: ['gc', 'young-gc', 'allocation-rate', 'stringbuilder', 'slf4j', 'logback', 'log-debug', 'string-concatenation', 'jdk17', 'g1gc']
  },
  {
    id: 'lab-gc-028',
    category: 'gc',
    title: 'Xử lý ảnh tải lên: humongous allocation từ BufferedImage và byte[] > 1MB khiến G1 Full GC',
    level: 'senior',
    scenario: `**Bối cảnh (background):** App **chia sẻ ảnh** (Spring Boot 3.3, JDK 17.0.11, G1) cho phép người dùng tải lên ảnh, server tự động tạo thumbnail 3 kích thước (small 300x300, medium 800x800, large 1920x1080). Endpoint {{POST /api/images/upload}} nhận multipart file, dùng {{ImageIO.read}} đọc thành {{BufferedImage}}, dùng {{Graphics2D}} scale, rồi encode JPEG/PNG trả về. JVM: {{-Xms4g -Xmx4g -XX:+UseG1GC -XX:G1HeapRegionSize=2m -Xlog:gc*:file=/logs/gc.log:time,uptime,level,tags}}. Container: 2 vCPU, memory limit 4Gi.

**Thuật ngữ giải thích:**
- **Humongous object:** Trong G1, object ≥ 50% region size là humongous. Region 2 MB → ngưỡng = 1 MB. {{BufferedImage}} (kể cả TYPE_INT_RGB) và mảng {{byte[]}} từ {{ImageIO.write}} thường > 1 MB với ảnh HD.
- **BufferedImage memory layout:** {{BufferedImage}} chứa {{DataBuffer}} (thường là {{DataBufferInt}} cho TYPE_INT_RGB) giữ mảng {{int[]}} pixel. Ảnh 1920x1080 = ~2M pixel × 4 byte = **~8 MB int[]** → humongous chiếm 4 region liên tiếp.
- **To-space exhausted:** Khi young GC cần copy object sang region mới nhưng region trống bị humongous chiếm, G1 ném To-space exhausted → Full GC (G1 Compaction Pause).

**Triệu chứng:** Từ **14:00-14:20 ngày 25/10/2026**, user tải lên 50 ảnh HD đồng thời (batch upload). p99 {{POST /api/images/upload}} tăng từ 500 ms lên **6-8 giây**. GC log ghi **Pause Young (G1 Humongous Allocation)** dày đặc, rồi **To-space exhausted**, **Pause Full (G1 Compaction Pause)** 3-4 giây. Heap used ~2.8 GB / 4 GB. Sau 14:20 tải xong, hệ thống ổn định. Dev đề xuất: "Tăng heap 8 GB, G1HeapRegionSize 4 MB."

**Dữ liệu thu thập:** GC log JDK 17, heap histogram lúc 14:10, đoạn code {{ImageService}}, JFR allocation profiling.`,
    artifacts: [
      {
        name: 'gc-image-upload.log',
        lang: 'text',
        content: `[2026-10-25T13:00:00.012+0700][0.012s][info][gc,init] Version: 17.0.11+7 (release)
[2026-10-25T13:00:00.012+0700][0.012s][info][gc,init] CPUs: 2 total, 2 available
[2026-10-25T13:00:00.012+0700][0.012s][info][gc,init] Memory: 4096M
[2026-10-25T13:00:00.012+0700][0.012s][info][gc,init] Heap Region Size: 2M
[2026-10-25T13:00:00.012+0700][0.012s][info][gc,init] Heap Min Capacity: 4G
[2026-10-25T13:00:00.012+0700][0.012s][info][gc,init] Heap Initial Capacity: 4G
[2026-10-25T13:00:00.012+0700][0.012s][info][gc,init] Heap Max Capacity: 4G
... (young GC bình thường mỗi ~20s, heap sau GC ~300-500 MB) ...
[2026-10-25T14:02:10.104+0700][3730.104s][info][gc] GC(105) Pause Young (G1 Evacuation Pause) 1520M->410M(4096M) 12.301ms
[2026-10-25T14:02:30.220+0700][3750.220s][info][gc] GC(106) Pause Young (G1 Humongous Allocation) 1680M->1120M(4096M) 45.210ms
[2026-10-25T14:02:30.220+0700][3750.220s][info][gc,heap] GC(106) Humongous regions: 40->180
[2026-10-25T14:02:50.102+0700][3770.102s][info][gc] GC(107) Pause Young (G1 Humongous Allocation) 2450M->1980M(4096M) 68.440ms
[2026-10-25T14:02:50.102+0700][3770.102s][info][gc,heap] GC(107) Humongous regions: 180->320
[2026-10-25T14:03:15.440+0700][3795.440s][info][gc] GC(108) Pause Young (G1 Humongous Allocation) 3120M->2680M(4096M) 92.602ms
[2026-10-25T14:03:15.440+0700][3795.440s][info][gc,heap] GC(108) Humongous regions: 320->480
[2026-10-25T14:03:30.210+0700][3810.210s][info][gc] GC(109) Pause Young (G1 Humongous Allocation) 3680M->3250M(4096M) 115.771ms
[2026-10-25T14:03:30.210+0700][3810.210s][info][gc] GC(109) To-space exhausted
[2026-10-25T14:03:30.211+0700][3810.211s][info][gc,heap] GC(109) Humongous regions: 480->560
[2026-10-25T14:03:30.211+0700][3810.211s][info][gc,start] GC(110) Pause Full (G1 Compaction Pause)
[2026-10-25T14:03:33.355+0700][3813.355s][info][gc,heap] GC(110) Old regions: 1120->210
[2026-10-25T14:03:33.355+0700][3813.355s][info][gc,heap] GC(110) Humongous regions: 560->560
[2026-10-25T14:03:33.355+0700][3813.355s][info][gc] GC(110) Pause Full (G1 Compaction Pause) 3820M->1520M(4096M) 3144.902ms
[2026-10-25T14:05:55.979+0700][4155.979s][info][gc] GC(111) To-space exhausted
[2026-10-25T14:05:55.979+0700][4155.979s][info][gc] GC(111) Pause Young (Normal) (G1 Evacuation Pause) 3420M->3380M(4096M) 329.004ms
[2026-10-25T14:06:10.001+0700][4170.001s][info][gc] GC(112) Pause Full (G1 Compaction Pause) 3380M->1580M(4096M) 3011.447ms
[2026-10-25T14:12:10.001+0700][4570.001s][info][gc] GC(113) Pause Young (Normal) (G1 Evacuation Pause) 2200M->480M(4096M) 15.102ms
[2026-10-25T14:12:10.001+0700][4570.001s][info][gc,heap] GC(113) Humongous regions: 560->15`
      },
      {
        name: 'jmap-histo-1410.txt',
        lang: 'text',
        content: `$ kubectl exec image-service-7d8f6c-x4k2p -- jmap -histo 1 | head -20
  num     #instances         #bytes  class name (module)
-------------------------------------------------------
   1:         85000      850000000  [I (java.base@17.0.11)
   2:         62000      620000000  [B (java.base@17.0.11)
   3:          1250       40000000  java.awt.image.DataBufferInt
   4:          1250       32000000  java.awt.image.BufferedImage
   5:          1100       28160000  vn.image.model.ThumbnailResult
Total        150600      1550160000`
      },
      {
        name: 'ImageService.java',
        lang: 'text',
        content: `package vn.image.service;

import javax.imageio.ImageIO;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import vn.image.model.ThumbnailResult;

@Service
public class ImageService {

    public ThumbnailResult process(MultipartFile file) throws Exception {
        try (InputStream in = file.getInputStream()) {
            // 1. Đọc ảnh gốc thành BufferedImage (humongous nếu ảnh lớn)
            BufferedImage original = ImageIO.read(in);  // int[] pixel array ~8 MB cho 1920x1080

            // 2. Tạo 3 thumbnail, MỖI LẦN tạo BufferedImage mới + byte[]
            BufferedImage small = resize(original, 300, 300);
            BufferedImage medium = resize(original, 800, 800);
            BufferedImage large = resize(original, 1920, 1080);  // giữ nguyên kích thước, vẫn alloc mới

            // 3. Encode từng thumbnail thành byte[] (humongous thêm)
            byte[] smallBytes = encode(small);
            byte[] mediumBytes = encode(medium);
            byte[] largeBytes = encode(large);  // ~3-4 MB JPEG

            return new ThumbnailResult(smallBytes, mediumBytes, largeBytes);
        }
    }

    private BufferedImage resize(BufferedImage src, int w, int h) {
        BufferedImage dest = new BufferedImage(w, h, BufferedImage.TYPE_INT_RGB);
        Graphics2D g = dest.createGraphics();
        g.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BILINEAR);
        g.drawImage(src, 0, 0, w, h, null);
        g.dispose();
        return dest;
    }

    private byte[] encode(BufferedImage img) throws Exception {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        ImageIO.write(img, "jpg", baos);
        return baos.toByteArray();  // humongous nếu > 1 MB (region 2M)
    }
}`
      },
      {
        name: 'jfr-allocation-1410.txt',
        lang: 'text',
        content: `$ jcmd 1 JFR.start duration=2m filename=/tmp/image.jfr settings=profile
$ jfr print --events jdk.ObjectAllocationSample /tmp/image.jfr | head -60

jdk.ObjectAllocationSample {
  startTime = 14:03:12.412
  objectClass = int[] (classLoader = bootstrap)
  weight = 8.2 MB
  eventThread = "http-nio-8080-exec-7"
  stackTrace = [
    java.awt.image.DataBufferInt.<init>(int, int) line: 123
    java.awt.image.BufferedImage.<init>(int, int, int, ColorModel, ...) line: 456
    vn.image.service.ImageService.resize(ImageService.java:35)
  ]
}

jdk.ObjectAllocationSample {
  startTime = 14:03:12.415
  objectClass = byte[] (classLoader = bootstrap)
  weight = 3.8 MB
  eventThread = "http-nio-8080-exec-7"
  stackTrace = [
    java.io.ByteArrayOutputStream.toByteArray() line: 211
    vn.image.service.ImageService.encode(ImageService.java:52)
  ]
}

# Tổng hợp allocation rate lúc 14:03 (50 req/s, mỗi req 3 thumbnail: large 1920x1080, medium 800x800, small 300x300):
# int[] pixel data: large ~8.2 MB + medium ~2.6 MB + small ~0.36 MB ≈ 11.2 MB/request
# byte[] JPEG encode: large ~3.8 MB + medium ~1.5 MB + small ~0.1 MB ≈ 5.4 MB/request
# TỔNG allocation rate ≈ (11.2 + 5.4) MB × 50 req/s ≈ 830 MB/s (chỉ cho image processing)`
      }
    ],
    questions: [
      'Tại sao G1 báo "G1 Humongous Allocation", rồi "To-space exhausted" và "Pause Full" khi xử lý ảnh? Trích dòng cụ thể trong GC log và giải thích với region size 2 MB.',
      'Từ histogram và JFR, object humongous là mảng nào (int[] hay byte[]), kích thước bao nhiêu, do code dòng nào tạo ra.',
      'Chứng minh đây KHÔNG phải memory leak. Tăng heap hoặc G1HeapRegionSize có phải lời giải gốc không.',
      'Sửa ngắn hạn (code) và dài hạn (kiến trúc). Streaming encode, tái sử dụng buffer, hay off-heap?'
    ],
    hints: [
      'Region size 2 MB → ngưỡng humongous = 1 MB. BufferedImage TYPE_INT_RGB dùng int[] pixel: 1920x1080 = 2M pixel × 4 byte = 8 MB int[] → humongous chiếm 4 region. JPEG encode tạo byte[] 3-4 MB → humongous thêm.',
      'Histogram: [I (int[]) 85k instance 850 MB, [B (byte[]) 62k instance 620 MB. JFR: int[] 8.2 MB tại ImageService.resize (DataBufferInt), byte[] 3.8 MB tại ImageService.encode (ByteArrayOutputStream.toByteArray).',
      'GC(113) khi traffic giảm: Humongous regions 560->15, heap 2200M->480M. Khác với leak (leak thì heap sau GC tăng dần, Full GC không giảm humongous).',
      'Tăng G1HeapRegionSize 4 MB: ngưỡng humongous = 2 MB, int[] 8 MB VẪN humongous (chiếm 2 region), byte[] 3-4 MB vẫn humongous. Region 4 MB → heap 4 GB chỉ 1024 region, giảm độ linh hoạt G1. Chỉ là workaround.'
    ],
    answer: `**Tóm tắt:** Service đọc ảnh upload, tạo 3 thumbnail bằng {{BufferedImage.TYPE_INT_RGB}}, mỗi thumbnail alloc mới {{int[]}} pixel data (~8 MB cho 1920x1080) và {{byte[]}} JPEG encode (~3-4 MB). Với **G1HeapRegionSize=2 MB**, mọi object **≥ 1 MB là humongous** → int[] 8 MB chiếm **4 region liên tiếp**, byte[] 3-4 MB chiếm **2 region**. 50 request/s × 3 thumbnail tạo ~150 humongous object/giây, Humongous regions tăng 40 → 560 (~1.1 GB), chặn region trống → {{To-space exhausted}} → **Pause Full 3-4 giây**. Khi traffic giảm, GC(113) thu hồi humongous 560->15 trong young GC thường, chứng minh **không leak**. Sửa gốc: **streaming encode** (ghi JPEG trực tiếp vào {{OutputStream}} không đệm byte[]), **tái sử dụng BufferedImage** qua pool, hoặc **off-heap** (Netty ByteBuf, jemalloc).

### Nguyên nhân gốc

1. **Region và ngưỡng:** GC log {{Heap Region Size: 2M}}. G1 coi object ≥ 1 MB là humongous. Cấp phát thẳng vào Old Gen trên region liên tiếp.
2. **BufferedImage int[] 8 MB là humongous:** ImageService.resize() tạo {{BufferedImage.TYPE_INT_RGB}} mới cho từng thumbnail. TYPE_INT_RGB dùng {{DataBufferInt}} chứa {{int[]}} pixel. Ảnh 1920x1080 = ~2M pixel × 4 byte = **8 MB int[]** ≥ 1 MB → humongous chiếm 4 region (2M × 4 = 8M). Medium 800x800 = 2.5 MB int[] → humongous. Small 300x300 = 0.36 MB → KHÔNG humongous.
3. **JPEG encode byte[] 3-4 MB là humongous:** ImageService.encode() dùng {{ByteArrayOutputStream}} rồi {{toByteArray()}}. JPEG quality mặc định cho 1920x1080 ~3-4 MB → humongous chiếm 2 region.
4. **Allocation rate:** 50 req/s × (int[] ~11.2 MB + byte[] ~5.4 MB) ≈ 830 MB/s. Humongous regions tăng 40 → 180 → 320 → 480 → 560.
5. **To-space exhausted:** Humongous regions 560 × 2 MB = 1.12 GB Old Gen. Chỉ còn ~2.9 GB region trống. Khi Eden đầy, không đủ region trống evacuate → To-space exhausted → Full GC.
6. **Full GC không giảm humongous:** GC(110) {{Humongous regions: 560->560}}, GC(112) humongous không giảm. Vì object vẫn được tham chiếu bởi thread đang xử lý request (stack frame giữ BufferedImage/byte[]), chúng là live data.

### Dẫn chứng (trích dòng cụ thể trong artifact)

| GC / Thời điểm | Dòng log trích | Ý nghĩa |
|---|---|---|
| GC(106) 14:02 | {{Pause Young (G1 Humongous Allocation)}}, {{Humongous regions: 40->180}} | Bắt đầu có humongous, +140 region = 280 MB |
| GC(107) 14:02 | {{Humongous regions: 180->320}} | +140 region = 280 MB |
| GC(108) 14:03 | {{Humongous regions: 320->480}} | +160 region = 320 MB |
| GC(109) 14:03 | {{To-space exhausted}}, {{Humongous regions: 480->560}} | Cạn region trống |
| GC(110) 14:03 | {{Pause Full (G1 Compaction Pause) 3820M->1520M 3144ms}}, {{Humongous regions: 560->560}} | Full GC đầu, humongous không giảm |
| GC(112) 14:06 | {{Pause Full ... 3011ms}}, humongous không giảm | Full GC thứ 2, humongous không giảm |
| GC(113) 14:12 | {{Pause Young ... 2200M->480M}}, {{Humongous regions: 560->15}} | **Bằng chứng không leak**: traffic giảm, humongous 560->15, heap về 480 MB |
| JFR | {{weight = 8.2 MB}} int[] tại {{DataBufferInt.<init>}} (ImageService.java:35) | int[] pixel data 8 MB humongous mỗi thumbnail large |
| JFR | {{weight = 3.8 MB}} byte[] tại {{ByteArrayOutputStream.toByteArray}} (ImageService.java:52) | byte[] JPEG 3-4 MB humongous mỗi thumbnail large |
| Histogram | {{[I}} 85k instance 850 MB, {{[B}} 62k instance 620 MB | {{jmap -histo}} gộp mảng theo class, phần lớn là humongous của request đang chạy |

### Cách sửa

**Ngắn hạn (giảm rủi ro ngay, deploy hôm nay):**
1. **Giới hạn đồng thời (bulkhead):** {{Semaphore}} hoặc Resilience4j Bulkhead tối đa 10-15 request xử lý ảnh HD đồng thời/pod. Trả 429 khi vượt.
2. **Giới hạn kích thước ảnh:** Reject ảnh > 5 MB hoặc > 4000x4000 pixel trước khi xử lý.
3. **Giảm chất lượng JPEG:** {{ImageWriteParam}} set compression quality 0.7f thay vì mặc định 0.9f, giảm byte[] từ 4 MB xuống ~2 MB (dưới ngưỡng 1 MB humongous? Không, vẫn > 1 MB).

**Dài hạn (sửa gốc, loại bỏ humongous):**
1. **Streaming encode (khuyên dùng nhất):** Ghi JPEG trực tiếp vào {{OutputStream}} của HTTP response hoặc file, không đệm toàn bộ vào byte[].

~~~java
private void encodeStreaming(BufferedImage img, OutputStream out) throws Exception {
    ImageWriter writer = ImageIO.getImageWritersByFormatName("jpg").next();
    ImageWriteParam param = writer.getDefaultWriteParam();
    param.setCompressionMode(ImageWriteParam.MODE_EXPLICIT);
    param.setCompressionQuality(0.8f);
    try (ImageOutputStream ios = ImageIO.createImageOutputStream(out)) {
        writer.setOutput(ios);
        writer.write(null, new IIOImage(img, null, null), param);
    }
}
~~~

2. **Tái sử dụng BufferedImage qua pool:** Dùng {{ThreadLocal<BufferedImage>}} hoặc object pool ({{Commons Pool}}) cho BufferedImage kích thước cố định (1920x1080, 800x800, 300x300), tránh alloc mới mỗi request.

~~~java
private static final ThreadLocal<BufferedImage> LARGE_BUFFER = ThreadLocal.withInitial(
    () -> new BufferedImage(1920, 1080, BufferedImage.TYPE_INT_RGB)
);
// Trong resize: dùng LARGE_BUFFER.get() thay vì new BufferedImage(...)
~~~

3. **Off-heap image processing:** Dùng thư viện {{Twelvemonkeys ImageIO}} hoặc {{Apache Sanselan}} hỗ trợ off-heap, hoặc chuyển sang {{Netty ByteBuf}} / {{jemalloc}} cho pixel buffer, tránh humongous hoàn toàn.

4. **Async processing:** Ảnh lớn đẩy vào queue, trả 202 Accepted ngay, worker xử lý streaming encode off-heap, không ảnh hưởng latency API.

### Phòng ngừa và alert

- Alert khi GC log có {{To-space exhausted}} hoặc {{Pause Full (G1 Compaction Pause)}}.
- Alert khi cause {{G1 Humongous Allocation}} xuất hiện > 10 lần/phút.
- Theo dõi {{jvm_gc_live_data_size_bytes}} và allocation rate trên mỗi request.
- Code review: cấm {{ByteArrayOutputStream.toByteArray()}}, {{ImageIO.write(..., baos)}}, {{new BufferedImage(w,h,TYPE_INT_RGB)}} cho ảnh > 500x500 không có pooling/streaming. Yêu cầu streaming encode / object pool / off-heap.

### Trả lời mẫu khi phỏng vấn

"Khi user upload ảnh HD, service tạo 3 thumbnail bằng BufferedImage.TYPE_INT_RGB. Mỗi thumbnail alloc int[] pixel data: ảnh large 1920x1080 = 8 MB int[], medium 800x800 = 2.5 MB int[], plus JPEG encode byte[] 3-4 MB. Với G1HeapRegionSize 2 MB, ngưỡng humongous = 1 MB → int[] 8 MB chiếm 4 region liên tiếp, byte[] 3-4 MB chiếm 2 region. 50 request/s tạo hàng trăm humongous object/giây, Humongous regions tăng 40 -> 560, chặn region trống, gây To-space exhausted và Full GC 3-4 giây. Chứng minh không leak: khi traffic giảm, young GC thu hồi humongous 560 -> 15, heap về 480 MB. Cách sửa gốc là streaming encode ghi JPEG trực tiếp ra OutputStream, tái sử dụng BufferedImage qua ThreadLocal pool, hoặc off-heap processing. Tăng heap hay RegionSize chỉ là workaround."

> Senior tip: Xử lý ảnh/video là "cây núc humongous" vì pixel data (int[]/byte[]) lớn, dễ vượt ngưỡng region G1. Quy tắc: **mọi pixel buffer lớn phải có pooling hoặc streaming, không bao giờ alloc mới mỗi request**. Khi debug GC log, tìm chuỗi: {{G1 Humongous Allocation}} → {{To-space exhausted}} → {{Pause Full}} và so sánh {{Humongous regions}} trước/sau Full GC — nếu humongous không giảm sau Full GC nhưng giảm mạnh ở young GC sau khi tải hết, đó là humongous sống tạm do request giữ, không phải leak. Cách chữa bền: streaming encode, object pool, off-heap; tăng RegionSize/heap chỉ là đòn giảm đau.`,
    rubric: [
      'Giải thích đúng cơ chế: region 2M → ngưỡng 1M, object ≥ ngưỡng cấp phát thẳng Old Gen trên region liên tiếp, BufferedImage int[] 8 MB và JPEG byte[] 3-4 MB là humongous.',
      'Dẫn chứng GC log: Humongous regions 40→180→320→480→560, To-space exhausted (GC 109), Pause Full ~3s nhưng Humongous regions không giảm (560->560, 560->560).',
      'Chứng minh không leak: GC(113) Humongous regions 560->15, heap 2200M->480M khi traffic giảm; phân biệt humongous sống tạm vs leak.',
      'Chỉ đúng code gây ra: ImageService.java dòng 35 (new BufferedImage TYPE_INT_RGB tạo int[] 8 MB), dòng 52 (ByteArrayOutputStream.toByteArray tạo byte[] 3-4 MB); JFR weight 8.2/3.8 MB khớp.',
      'Đề xuất có chiều sâu: streaming encode ghi trực tiếp OutputStream loại bỏ byte[] humongous; BufferedImage pool tái sử dụng int[] pixel; off-heap processing; giải thích tăng RegionSize/heap chỉ là workaround.'
    ],
    tags: ['g1', 'humongous', 'full-gc', 'gc-log', 'image-processing', 'bufferedimage', 'jpeg', 'streaming', 'object-pool', 'off-heap', 'jdk17', 'jfr']
  },
  {
    id: 'lab-gc-029',
    category: 'gc',
    title: 'Metaspace tăng mãi do Spring AOP tạo CGLIB proxy mới mỗi request (@Transactional trên bean prototype)',
    level: 'senior',
    scenario: `**Bối cảnh (background):** App **thanh toán** (Spring Boot 3.3, JDK 17.0.11, G1) dùng @Transactional trên service. Dev vô tình khai báo service là **prototype scope** thay vì singleton. Mỗi lần inject, Spring tạo instance mới, và **CGLIB tạo subclass proxy mới** cho @Transactional. JVM: {{-Xms4g -Xmx4g -XX:+UseG1GC -XX:MetaspaceSize=256m -XX:MaxMetaspaceSize=512m -Xlog:gc*:file=/logs/gc.log:time,uptime,level,tags}}. Container: 2 vCPU, memory limit 4Gi.

**Thuật ngữ giải thích:**
- **Metaspace:** Vùng bộ nhớ native lưu metadata của class (tên class, method, constant pool, bytecode). Bị giới hạn bởi {{-XX:MaxMetaspaceSize}}.
- **CGLIB proxy:** Spring dùng CGLIB (Code Generation Library) tạo subclass tại runtime cho @Transactional trên class không implement interface. Mỗi proxy là một **class Java mới** được define vào Metaspace.
- **Prototype scope:** Bean prototype tạo instance mới mỗi lần getBean()/inject. Nếu bean có @Transactional, Spring tạo proxy mới cho **mỗi instance**.
- **Full GC (Metadata GC Threshold):** Khi Metaspace đạt ngưỡng, G1 chạy Full GC thu hồi class không dùng. Nếu proxy class vẫn được tham chiếu (bằng instance prototype), Metaspace không giảm.

**Triệu chứng:** Từ **09:00-11:00 ngày 28/10/2026**, traffic tăng dần. Metaspace tăng từ 280 MB lên **511 MB / 512 MB** sau 2 giờ. **Full GC (Metadata GC Threshold)** chạy mỗi 10-15 phút, mỗi lần 400-600 ms, Metaspace chỉ giảm vài MB. Heap used ổn định ~2.2 GB / 4 GB. CPU tăng do Full GC lặp. Dev on-call nghi "classloader leak" và đề xuất tăng MaxMetaspaceSize 1 GB.

**Dữ liệu thu thập:** GC log JDK 17, jcmd class_stats, config Spring bean, thread dump.`,
    artifacts: [
      {
        name: 'gc-payment-prototype.log',
        lang: 'text',
        content: `[2026-10-28T07:00:00.012+0700][0.012s][info][gc,init] Version: 17.0.11+7 (release)
[2026-10-28T07:00:00.012+0700][0.012s][info][gc,init] CPUs: 2 total, 2 available
[2026-10-28T07:00:00.012+0700][0.012s][info][gc,init] Memory: 4096M
[2026-10-28T07:00:00.012+0700][0.012s][info][gc,init] Heap Region Size: 4M
[2026-10-28T07:00:00.012+0700][0.012s][info][gc,init] Heap Min Capacity: 4G
[2026-10-28T07:00:00.012+0700][0.012s][info][gc,init] Heap Initial Capacity: 4G
[2026-10-28T07:00:00.012+0700][0.012s][info][gc,init] Heap Max Capacity: 4G
[2026-10-28T07:00:00.012+0700][0.012s][info][gc,init] Metaspace Size: 256M
[2026-10-28T07:00:00.012+0700][0.012s][info][gc,init] Max Metaspace Size: 512M
... (Metaspace 280M lúc khởi động, young GC bình thường) ...
[2026-10-28T09:15:30.102+0700][8130.102s][info][gc] GC(200) Pause Young (Normal) 1850M->520M(4096M) 14.201ms
[2026-10-28T09:15:30.102+0700][8130.102s][info][gc,heap] Metaspace 380M->380M(512M)
[2026-10-28T09:45:45.440+0700][9945.440s][info][gc] GC(201) Pause Full (Metadata GC Threshold) 3120M->3080M(4096M) 419.004ms
[2026-10-28T09:45:45.440+0700][9945.440s][info][gc,heap] Metaspace 460M->460M(512M)
[2026-10-28T10:05:10.001+0700][11110.001s][info][gc] GC(202) Pause Full (Metadata GC Threshold) 3080M->3050M(4096M) 511.207ms
[2026-10-28T10:05:10.001+0700][11110.001s][info][gc,heap] Metaspace 500M->500M(512M)
[2026-10-28T10:25:20.001+0700][12320.201s][info][gc] GC(203) Pause Full (Metadata GC Threshold) 3050M->3020M(4096M) 582.301ms
[2026-10-28T10:25:20.001+0700][12320.201s][info][gc,heap] Metaspace 511M->511M(512M)
[2026-10-28T10:40:30.001+0700][13230.001s][info][gc] GC(204) Pause Full (Metadata GC Threshold) 3020M->2990M(4096M) 595.447ms
[2026-10-28T10:40:30.001+0700][13230.001s][info][gc,heap] Metaspace 512M->512M(512M)`
      },
      {
        name: 'jcmd-payment-classstats.txt',
        lang: 'text',
        content: `$ jcmd 1 GC.class_stats | grep -E "(PaymentService|CGLIB|Enhancer)" | head -30
   1247  1247  2500  500000  2500  vn.payment.service.PaymentService
   1248  1247  1     180000  1     vn.payment.service.PaymentService$$EnhancerBySpringCGLIB$$a1b2c3d4
   1249  1247  1     182000  1     vn.payment.service.PaymentService$$EnhancerBySpringCGLIB$$e5f6g7h8
   1250  1247  1     178000  1     vn.payment.service.PaymentService$$EnhancerBySpringCGLIB$$i9j0k1l2
   1251  1247  1     185000  1     vn.payment.service.PaymentService$$EnhancerBySpringCGLIB$$m3n4o5p6
   ...
# Tổng cộng: 2500+ class PaymentService$$EnhancerBySpringCGLIB$$* (mỗi class ~150-200 KB metadata)
# Metaspace: 512 MB / 512 MB (đầy)
# Chỉ có 1 ApplicationContext nhưng bean prototype tạo instance mới mỗi request -> proxy mới mỗi request`
      },
      {
        name: 'PaymentService.java',
        lang: 'text',
        content: `package vn.payment.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.context.annotation.Scope;
import org.springframework.context.annotation.ScopedProxyMode;

@Service
// SAI: prototype scope thay vì singleton (mặc định)
@Scope("prototype")
public class PaymentService {

    private final PaymentRepository repo;

    public PaymentService(PaymentRepository repo) {
        this.repo = repo;
    }

    @Transactional
    public void processPayment(PaymentRequest request) {
        // logic xử lý thanh toán, save DB
        repo.save(new Payment(request));
    }

    @Transactional(readOnly = true)
    public Payment getPayment(String id) {
        return repo.findById(id).orElseThrow();
    }
}`
      },
      {
        name: 'thread-dump-prototype.txt',
        lang: 'text',
        content: `$ jstack 1 | grep -A5 "PaymentService" | head -40
"http-nio-8080-exec-15" #45 daemon prio=5 os_prio=0 cpu=12.34ms elapsed=120.50s tid=0x00007f8b1c000000 nid=0x1234 waiting on condition [0x00007f8b0e0fe000]
   java.lang.Thread.State: WAITING (parking)
   at jdk.internal.misc.Unsafe.park(java.base@17.0.11/Native Method)
   - parking to wait for  <0x00000000a1b2c3d4> (a java.util.concurrent.locks.AbstractQueuedSynchronizer$ConditionObject)
   at java.util.concurrent.linkedTransferQueue.TransferQueue.poll(TransferQueue.java:1234)
   at org.springframework.web.context.request.async.StandardServletAsyncWebRequest.waitForDispatch(StandardServletAsyncWebRequest.java:156)
   - locked <0x00000000a1b2c3d4> (a java.util.concurrent.locks.AbstractQueuedSynchronizer$ConditionObject)
   at org.springframework.web.context.request.async.WebAsyncManager.startCallableProcessing(WebAsyncManager.java:321)
   at org.springframework.web.servlet.DispatcherServlet.doDispatch(DispatcherServlet.java:1089)

# Nhiều thread http-nio-8080-exec-* đang giữ instance PaymentService$$EnhancerBySpringCGLIB$$*
# Mỗi instance là prototype bean, được inject vào controller/request scope -> không bị GC cho đến khi request kết thúc
# Nhưng request rate cao -> instance tích lũy -> proxy class tích lũy -> Metaspace đầy`
      }
    ],
    questions: [
      'Tại sao Metaspace tăng mãi dù heap ổn định? Trích dòng cụ thể trong GC log và jcmd class_stats.',
      'Tại sao Full GC (Metadata GC Threshold) không làm Metaspace giảm? Proxy class bị ai giữ reference?',
      'Chứng minh đây KHÔNG phải memory leak trong heap. Tăng MaxMetaspaceSize có phải lời giải gốc không?',
      'Sửa ngắn hạn và dài hạn. Đổi scope singleton, cache proxy, hay tăng Metaspace?'
    ],
    hints: [
      'GC log: Metaspace 380M->460M->500M->511M->512M, Full GC (Metadata GC Threshold) lặp lại nhưng Metaspace không giảm (460->460, 500->500, 511->511, 512->512).',
      'jcmd: 2500+ class PaymentService$$EnhancerBySpringCGLIB$$* (mỗi class ~150-200 KB). Mỗi request tạo instance prototype -> Spring tạo CGLIB proxy subclass mới -> class mới define vào Metaspace.',
      'Heap ổn định ~2.2 GB -> không phải heap leak. Vấn đề nằm ở Metaspace (native memory cho class metadata).',
      'Tăng MaxMetaspaceSize 1G: Metaspace vẫn tăng mỗi request, chỉ trì hoãn sự cố. Full GC vẫn chạy dày, CPU vẫn tăng.'
    ],
    answer: `**Tóm tắt:** PaymentService khai báo **@Scope("prototype")** thay vì singleton (mặc định). Mỗi request inject service, Spring tạo instance mới, và do @Transactional trên class không implement interface, Spring dùng **CGLIB tạo subclass proxy mới** cho mỗi instance. Mỗi proxy là một class Java mới (PaymentService$$EnhancerBySpringCGLIB$$xxxxxxxx) define vào Metaspace. 2500+ request tạo 2500+ proxy class, Metaspace tăng từ 280 MB lên 512 MB, Full GC (Metadata GC Threshold) chạy liên tục nhưng không thu hồi được vì instance prototype vẫn được thread request giữ reference. Sửa gốc: **bỏ @Scope("prototype")**, dùng singleton (mặc định) cho service stateless.

### Nguyên nhân gốc

1. **Metaspace và class metadata:** Metaspace lưu tên class, method, bytecode, constant pool. Giống heap nhưng lưu class metadata. Bị giới hạn bởi {{-XX:MaxMetaspaceSize=512m}}.
2. **Prototype scope + @Transactional = CGLIB proxy mới mỗi request:** @Service mặc định singleton. Khi thêm @Scope("prototype"), Spring tạo instance mới mỗi lần inject. @Transactional trên class không implement interface → Spring dùng CGLIB tạo **subclass proxy** cho instance đó. Mỗi instance prototype → **một proxy class mới**.
3. **Proxy class không bị GC:** Class chỉ bị GC khi ClassLoader của nó bị GC (thường là khi ứng dụng shutdown) HOẶC khi class không còn instance sống VÀ class không còn được tham chiếu. Ở đây, instance prototype được inject vào controller/request-scoped bean, thread request giữ reference cho đến khi request kết thúc. Với traffic cao, hàng nghìn instance prototype sống đồng thời → hàng nghìn proxy class sống trong Metaspace.
4. **Full GC không giảm Metaspace:** GC(201) {{Metaspace 460M->460M}}, GC(202) {{500M->500M}}, GC(203) {{511M->511M}}, GC(204) {{512M->512M}}. Vì proxy class vẫn có instance sống (thread request), class metadata vẫn là live data. Full GC chỉ quét, không thu hồi class còn reachable.
5. **Tăng MaxMetaspaceSize không phải fix gốc:** Metaspace vẫn tăng mỗi request, chỉ bị chậm hơn. Cuối cùng cũng đầy, Full GC lặp lại mãi.

### Dẫn chứng (trích dòng cụ thể trong artifact)

| Thời điểm | Dòng log trích | Ý nghĩa |
|---|---|---|
| GC(200) 09:15 | {{Metaspace 380M->380M(512M)}} | Metaspace ban đầu 380 MB |
| GC(201) 09:45 | {{Pause Full (Metadata GC Threshold)}}, {{Metaspace 460M->460M(512M)}} | Full GC đầu, Metaspace không giảm |
| GC(202) 10:05 | {{Pause Full (Metadata GC Threshold)}}, {{Metaspace 500M->500M(512M)}} | Metaspace gần đầy |
| GC(203) 10:25 | {{Pause Full (Metadata GC Threshold)}}, {{Metaspace 511M->511M(512M)}} | Metaspace 511/512 MB |
| GC(204) 10:40 | {{Pause Full (Metadata GC Threshold)}}, {{Metaspace 512M->512M(512M)}} | Metaspace đầy, Full GC liên tục |
| jcmd | {{2500+ class PaymentService\$\$EnhancerBySpringCGLIB\$\$*}} | Mỗi request tạo 1 proxy class mới, không bao giờ bị GC |
| jcmd | {{Mỗi class ~150-200 KB metadata}} | 2500 class × 180 KB ≈ 450 MB Metaspace cho proxy |
| Thread dump | {{Nhiều thread http-nio-8080-exec-* giữ instance PaymentService\$\$EnhancerBySpringCGLIB\$\$*}} | Instance prototype sống trong request, giữ proxy class alive |

### Cách sửa

**Ngắn hạn (giảm rủi ro ngay, deploy hôm nay):**
1. **Tăng MaxMetaspaceSize tạm thời:** Tăng lên 1 GB để trì hoãn sự cố, nhưng KHÔNG phải fix gốc.
2. **Giới hạn request rate:** Rate limit API thanh toán, giảm số instance prototype tạo đồng thời.

**Dài hạn (sửa gốc, loại bỏ rò rỉ Metaspace):**
1. **Bỏ @Scope("prototype") - KHUYẾN DÙNG:** Service stateless nên là **singleton** (mặc định của @Service). Chỉ cần xoá annotation @Scope("prototype").

~~~java
@Service
// XÓA @Scope("prototype") - dùng singleton mặc định
public class PaymentService {
    // ...
}
~~~

2. **Nếu BẮT BUỘC phải prototype (stateful service):** Dùng **scoped proxy** với interface, không dùng CGLIB subclass.

~~~java
@Service
@Scope(value = "prototype", proxyMode = ScopedProxyMode.INTERFACES)
public class PaymentService implements PaymentServiceInterface {
    // Spring tạo JDK dynamic proxy cho interface, KHÔNG tạo CGLIB subclass
    // JDK dynamic proxy class được cache/reuse, không tạo class mới mỗi instance
}
~~~

3. **Hoặc tách transaction logic:** Bỏ @Transactional khỏi prototype bean, dùng {{TransactionTemplate}} hoặc {{PlatformTransactionManager}} thủ công trong method.

### Phòng ngừa

- Alert khi Metaspace > 80% MaxMetaspaceSize.
- Theo dõi số lượng CGLIB proxy class qua {{jcmd GC.class_stats | grep EnhancerBySpringCGLIB}}.
- Code review: **cấm @Scope("prototype") trên bean có @Transactional** (trừ khi dùng proxyMode=INTERFACES). Service stateless phải là singleton.
- Spring Boot Actuator endpoint {{/actuator/beans}} kiểm tra scope bean.

### Trả lời mẫu khi phỏng vấn

"PaymentService bị khai báo @Scope('prototype') thay vì singleton. Mỗi request inject service, Spring tạo instance mới, và do @Transactional trên class không implement interface, Spring dùng CGLIB tạo subclass proxy mới cho mỗi instance. Mỗi proxy là class Java mới define vào Metaspace. 2500 request tạo 2500 proxy class, Metaspace tăng từ 280 MB lên 512 MB, Full GC (Metadata GC Threshold) chạy liên tục nhưng không giảm được vì instance prototype vẫn được thread request giữ. Sửa gốc là bỏ @Scope('prototype'), dùng singleton mặc định cho service stateless. Nếu bắt buộc prototype, phải dùng proxyMode=INTERFACES để Spring tạo JDK dynamic proxy (được cache) thay vì CGLIB subclass mới mỗi lần."

> Senior tip: Prototype + @Transactional là "cặp giết Metaspace" kinh điển. Mỗi instance prototype = một CGLIB proxy class mới = metadata mới trong Metaspace không bao giờ được thu hồi cho đến khi instance chết. Quy tắc vàng: **Service stateless KHÔNG BAO GIỜ dùng prototype**. Nếu cần stateful, dùng request/session scope với proxyMode=INTERFACES, hoặc tách state vào object riêng. Giám sát Metaspace bằng {{jcmd GC.class_stats}} và alert khi Metaspace > 80% MaxMetaspaceSize.`,
    rubric: [
      'Giải thích đúng cơ chế: Metaspace lưu class metadata, prototype scope + @Transactional → CGLIB tạo subclass proxy mới mỗi instance → proxy class define vào Metaspace.',
      'Dẫn chứng GC log: Metaspace 380M->460M->500M->511M->512M, Full GC (Metadata GC Threshold) không giảm Metaspace (460->460, 500->500, 511->511, 512->512).',
      'Chứng minh không heap leak: heap ổn định ~2.2 GB, vấn đề nằm ở Metaspace (native memory cho class metadata).',
      'Chỉ đúng code gây ra: PaymentService.java @Scope("prototype") + @Transactional → jcmd cho thấy 2500+ class PaymentService$$EnhancerBySpringCGLIB$$*.',
      'Đề xuất có chiều sâu: bỏ @Scope("prototype") dùng singleton mặc định; nếu bắt buộc prototype thì dùng proxyMode=INTERFACES (JDK dynamic proxy cache); giải thích tăng MaxMetaspaceSize chỉ là workaround.'
    ],
    tags: ['metaspace', 'cglib', 'proxy', 'prototype', 'spring', 'transactional', 'full-gc', 'metadata-gc-threshold', 'scoped-proxy', 'jdk17']
  },
  {
    id: 'lab-gc-030',
    category: 'gc',
    title: 'Parallel GC trên heap 24GB: "Pause Full (Ergonomics)" 4.2s, p99 5s do adaptive sizing sai',
    level: 'senior',
    scenario: `**Bối cảnh (background):** App **báo cáo tài chính** (Spring Boot 3.3, JDK 17.0.11, **Parallel GC**) chạy trên instance 32 vCPU, 32 GiB RAM. Heap: {{-Xms24g -Xmx24g -XX:+UseParallelGC -XX:ParallelGCThreads=16 -Xlog:gc*:file=/logs/gc.log:time,uptime,level,tags}}. Traffic: batch job đọc CSV 500k dòng, tính toán, ghi DB. Chạy 02:00-06:00 sáng.

**Thuật ngữ giải thích:**
- **Parallel GC (Throughput Collector):** Collector throughput-oriented, dùng nhiều thread song song cho young GC và old GC. Phù hợp batch, không phù hợp latency-sensitive.
- **Adaptive Size Policy (Ergonomics):** Parallel GC tự động điều chỉnh heap region (eden, survivor, old) để đạt mục tiêu throughput (mặc định 99%) và pause time (mặc định không set). Flag: {{-XX:+UseAdaptiveSizePolicy}} (mặc định bật).
- **Pause Full (Ergonomics):** Full GC do Ergonomics kích hoạt khi heap resize (expand/shrink old gen) hoặc khi policy quyết định cần compact. Không phải do heap đầy.

**Triệu chứng:** Từ **02:30-05:30 ngày 15/11/2026**, batch job chạy. p99 latency ghi DB tăng từ 200 ms lên **4-5 giây**. GC log ghi **Pause Full (Ergonomics)** nhiều lần, mỗi lần **3.8-4.5 giây**. Heap used lúc đó chỉ ~14 GB / 24 GB (58%). Young GC bình thường ~50-80 ms. Dev nghi "memory leak" và đề xuất tăng heap 32 GB.

**Dữ liệu thu thập:** GC log JDK 17, GC cause stats, heap usage trend, code batch job.`,
    artifacts: [
      {
        name: 'gc-report-batch.log',
        lang: 'text',
        content: `[2026-11-15T02:00:00.012+0700][0.012s][info][gc,init] Version: 17.0.11+7 (release)
[2026-11-15T02:00:00.012+0700][0.012s][info][gc,init] CPUs: 32 total, 32 available
[2026-11-15T02:00:00.012+0700][0.012s][info][gc,init] Memory: 32768M
[2026-11-15T02:00:00.012+0700][0.012s][info][gc,init] Heap Min Capacity: 24576M
[2026-11-15T02:00:00.012+0700][0.012s][info][gc,init] Heap Initial Capacity: 24576M
[2026-11-15T02:00:00.012+0700][0.012s][info][gc,init] Heap Max Capacity: 24576M
[2026-11-15T02:00:00.012+0700][0.012s][info][gc,init] ParallelGCThreads: 16
[2026-11-15T02:00:00.012+0700][0.012s][info][gc,init] UseAdaptiveSizePolicy: true
... (young GC bình thường mỗi ~2-3s, eden ~6GB, survivor ~500MB, old ~8GB, pause 50-80ms) ...
[2026-11-15T02:35:12.440+0700][2112.440s][info][gc] GC(145) Pause Young (Normal) 13200M->14200M(24576M) 62.301ms
[2026-11-15T02:35:12.440+0700][2112.440s][info][gc,heap] GC(145) PSYoungGen 12800M->600M(13400M) ParOldGen 400M->13600M(11176M)
[2026-11-15T02:35:12.440+0700][2112.440s][info][gc,ergo] GC(145) AdaptiveSizePolicy: Survivor size increased to 800M
[2026-11-15T02:38:45.102+0700][2325.102s][info][gc] GC(146) Pause Full (Ergonomics) 14200M->12800M(24576M) 4210.504ms
[2026-11-15T02:38:45.102+0700][2325.102s][info][gc,heap] GC(146) PSYoungGen 1400M->0M(13400M) ParOldGen 12800M->12800M(11176M)
[2026-11-15T02:38:45.102+0700][2325.102s][info][gc,ergo] GC(146) AdaptiveSizePolicy: Old gen expanded to 14200M
[2026-11-15T02:42:10.001+0700][2530.001s][info][gc] GC(147) Pause Young (Normal) 14200M->15800M(24576M) 78.102ms
[2026-11-15T02:45:30.001+0700][2730.001s][info][gc] GC(148) Pause Full (Ergonomics) 15800M->14200M(24576M) 3890.207ms
[2026-11-15T02:45:30.001+0700][2730.001s][info][gc,heap] GC(148) PSYoungGen 1800M->0M(13400M) ParOldGen 14000M->14200M(11176M)
[2026-11-15T02:45:30.001+0700][2730.001s][info][gc,ergo] GC(148) AdaptiveSizePolicy: Old gen expanded to 15800M
[2026-11-15T02:52:10.001+0700][3130.001s][info][gc] GC(149) Pause Full (Ergonomics) 16800M->15200M(24576M) 4450.112ms
[2026-11-15T02:52:10.001+0700][3130.001s][info][gc,heap] GC(149) PSYoungGen 2200M->0M(13400M) ParOldGen 14600M->15200M(11176M)
[2026-11-15T02:52:10.001+0700][3130.001s][info][gc,ergo] GC(149) AdaptiveSizePolicy: Old gen expanded to 17200M
[2026-11-15T03:10:10.001+0700][4210.001s][info][gc] GC(150) Pause Full (Ergonomics) 18200M->16800M(24576M) 4120.889ms
[2026-11-15T03:10:10.001+0700][4210.001s][info][gc,heap] GC(150) PSYoungGen 2600M->0M(13400M) ParOldGen 15600M->16800M(11176M)
[2026-11-15T03:10:10.001+0700][4210.001s][info][gc,ergo] GC(149) AdaptiveSizePolicy: Old gen expanded to 18800M
[2026-11-15T05:30:00.001+0700][12600.001s][info][gc] GC(151) Pause Young (Normal) 18800M->1200M(24576M) 85.440ms
[2026-11-15T05:30:00.001+0700][12600.001s][info][gc,heap] GC(151) PSYoungGen 17600M->1200M(13400M) ParOldGen 1200M->1200M(11176M)`
      },
      {
        name: 'BatchJob.java',
        lang: 'text',
        content: `package vn.report.batch;

import org.springframework.batch.core.Job;
import org.springframework.batch.core.Step;
import org.springframework.batch.core.configuration.annotation.EnableBatchProcessing;
import org.springframework.batch.core.configuration.annotation.JobBuilderFactory;
import org.springframework.batch.core.configuration.annotation.StepBuilderFactory;
import org.springframework.batch.item.file.FlatFileItemReader;
import org.springframework.batch.item.file.mapping.BeanWrapperFieldSetMapper;
import org.springframework.batch.item.file.mapping.DefaultLineMapper;
import org.springframework.batch.item.file.transform.DelimitedLineTokenizer;
import org.springframework.batch.item.database.JdbcBatchItemWriter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;
import org.springframework.jdbc.core.JdbcTemplate;
import vn.report.model.TransactionRecord;

import javax.sql.DataSource;

@Configuration
@EnableBatchProcessing
public class BatchJob {

    @Autowired
    private JobBuilderFactory jobBuilderFactory;

    @Autowired
    private StepBuilderFactory stepBuilderFactory;

    @Autowired
    private DataSource dataSource;

    @Bean
    public FlatFileItemReader<TransactionRecord> reader() {
        FlatFileItemReader<TransactionRecord> reader = new FlatFileItemReader<>();
        reader.setResource(new ClassPathResource("data/transactions-500k.csv"));
        reader.setLineMapper(new DefaultLineMapper<TransactionRecord>() {{
            setLineTokenizer(new DelimitedLineTokenizer() {{
                setNames("id", "account", "amount", "currency", "timestamp", "type");
            }});
            setFieldSetMapper(new BeanWrapperFieldSetMapper<TransactionRecord>() {{
                setTargetType(TransactionRecord.class);
            }});
        }});
        return reader;
    }

    @Bean
    public TransactionProcessor processor() {
        return new TransactionProcessor();
    }

    @Bean
    public JdbcBatchItemWriter<TransactionRecord> writer() {
        JdbcBatchItemWriter<TransactionRecord> writer = new JdbcBatchItemWriter<>();
        writer.setDataSource(dataSource);
        writer.setSql("INSERT INTO transactions (id, account, amount, currency, timestamp, type, fee) VALUES (?, ?, ?, ?, ?, ?, ?)");
        writer.setItemPreparedStatementSetter((item, ps) -> {
            ps.setString(1, item.getId());
            ps.setString(2, item.getAccount());
            ps.setBigDecimal(3, item.getAmount());
            ps.setString(4, item.getCurrency());
            ps.setTimestamp(5, item.getTimestamp());
            ps.setString(6, item.getType());
            ps.setBigDecimal(7, item.calculateFee());  // tính phí phức tạp, alloc BigDecimal mới
        });
        return writer;
    }

    @Bean
    public Step step1() {
        return stepBuilderFactory.get("step1")
            .<TransactionRecord, TransactionRecord>chunk(1000)
            .reader(reader())
            .processor(processor())
            .writer(writer())
            .build();
    }

    @Bean
    public Job job() {
        return jobBuilderFactory.get("transactionJob")
            .start(step1())
            .build();
    }
}

// TransactionProcessor.java
package vn.report.batch;

import org.springframework.batch.item.ItemProcessor;
import org.springframework.stereotype.Component;
import vn.report.model.TransactionRecord;

import java.math.BigDecimal;
import java.math.RoundingMode;

@Component
public class TransactionProcessor implements ItemProcessor<TransactionRecord, TransactionRecord> {

    @Override
    public TransactionRecord process(TransactionRecord item) {
        // Tính phí: 0.1% amount, min 1000, max 50000, làm tròn 2 chữ số
        BigDecimal fee = item.getAmount()
            .multiply(new BigDecimal("0.001"))
            .max(new BigDecimal("1000"))
            .min(new BigDecimal("50000"))
            .setScale(2, RoundingMode.HALF_UP);
        item.setFee(fee);
        return item;
    }
}`
      },
      {
        name: 'jstat-gcutil.txt',
        lang: 'text',
        content: `$ jstat -gcutil 1 5s 10
  S0     S1     E      O      M     CCS    YGC     YGCT    FGC    FGCT     GCT
  0.00   0.00  92.10  58.20  98.10  95.20    245    18.420     6   20.872   39.292
  0.00   0.00  95.30  62.40  98.10  95.20    248    18.650     6   20.872   39.522
  0.00   0.00  98.10  66.80  98.10  95.20    251    18.890     6   20.872   39.762
  0.00   0.00  12.40  71.20  98.10  95.20    254    19.120     7   25.322   44.442
  0.00   0.00  15.60  75.40  98.10  95.20    257    19.350     7   25.322   44.672
  0.00   0.00  18.90  79.80  98.10  95.20    260    19.580     7   25.322   44.902
  0.00   0.00  22.10  84.10  98.10  95.20    263    19.810     8   29.772   49.582
  0.00   0.00  25.30  88.50  98.10  95.20    266    20.040     8   29.772   49.812
  0.00   0.00  28.60  92.80  98.10  95.20    269    20.270     9   34.222   54.492
  0.00   0.00  31.80  97.10  98.10  95.20    272    20.500     9   34.222   54.722
# O (Old Gen) tăng dần 58% -> 97%, FGC tăng 6 -> 9, FGCT tăng 20s -> 34s (mỗi Full GC ~4.4s)`
      }
    ],
    questions: [
      'Tại sao Parallel GC chạy "Pause Full (Ergonomics)" khi heap mới chỉ 58-70% used? Trích dòng cụ thể trong GC log.',
      'AdaptiveSizePolicy quyết định expand Old Gen như thế nào? Tại sao survivor size cũng tăng?',
      'Chứng minh đây KHÔNG phải memory leak. Tăng heap 32 GB có giải quyết được không?',
      'So sánh 3 giải pháp: (1) tắt AdaptiveSizePolicy + fix heap region, (2) chuyển G1GC + MaxGCPauseMillis, (3) chuyển ZGC. Ưu/nhược điểm từng cái cho batch job này.'
    ],
    hints: [
      'GC log: GC(146) {{Pause Full (Ergonomics) 14200M->12800M 4210ms}}, {{AdaptiveSizePolicy: Old gen expanded to 14200M}}. Old gen expand từ 11G -> 14G -> 16G -> 17G -> 19G trong khi heap used chỉ ~14-18 GB.',
      'AdaptiveSizePolicy mục tiêu throughput 99% → nó expand Old Gen để giảm tần suất GC, nhưng mỗi lần expand Old Gen kích hoạt Full GC compact (Ergonomics). Survivor cũng tăng (600M -> 800M) vì policy thấy object sống lâu.',
      'jstat: Old Gen (O) tăng 58% -> 97% trong 30 phút, FGC 6 -> 9, FGCT 20s -> 34s. Batch job kết thúc 05:30, GC(151) young GC thu hồi Old Gen 17.6G -> 1.2G. Không leak.',
      'Tăng heap 32G: Old Gen vẫn expand, Full GC Ergonomics vẫn chạy, pause có thể lâu hơn vì Old Gen lớn hơn. Không fix gốc.'
    ],
    answer: `**Tóm tắt:** Batch job dùng **Parallel GC** trên heap 24GB. **AdaptiveSizePolicy (Ergonomics)** mặc định bật, mục tiêu throughput 99%. Khi batch alloc nhanh, policy thấy Old Gen đầy dần → tự động **expand Old Gen** (11G → 14G → 16G → 17G → 19G). Mỗi lần expand Old Gen, Parallel GC phải **compact** → **Pause Full (Ergonomics)** 3.8-4.5 giây. Heap used thực tế chỉ 58-70%, KHÔNG phải leak. Batch kết thúc 05:30, young GC thu hồi Old Gen 17.6G → 1.2G. Fix: (1) Tắt AdaptiveSizePolicy, fix {{-XX:NewRatio}}, {{-XX:SurvivorRatio}}; (2) Chuyển **G1GC** + {{-XX:MaxGCPauseMillis=200}} (khuyên dùng); (3) Chuyển **ZGC** (JDK 17+) pause < 10ms. G1/ZGC không có Ergonomics expand Old Gen kiểu Parallel.
 
### Nguyên nhân gốc
 
1. **Parallel GC + AdaptiveSizePolicy (Ergonomics):** Mặc định {{-XX:+UseAdaptiveSizePolicy}}. Policy theo dõi allocation rate, GC time, survivor occupancy. Mục tiêu: throughput ≥ 99% ({{-XX:GCTimeRatio=99}}), pause time không set mặc định.
2. **Batch alloc nhanh → Old Gen fill nhanh:** Batch đọc 500k CSV, chunk 1000, mỗi item alloc BigDecimal, TransactionRecord, PreparedStatement params. Allocation rate ~500-800 MB/s. Eden/survivor không kịp promote object đủ nhanh → object promote vào Old Gen sớm.
3. **Policy expand Old Gen:** GC(145) Old Gen 400M -> 13600M (promote nhiều). Policy thấy Old Gen occupancy cao → **expand Old Gen capacity** (ParOldGen 11176M -> 14200M -> 15800M -> 17200M -> 18800M). Mỗi lần expand Old Gen, Parallel GC phải **compact full heap** → **Pause Full (Ergonomics)**.
4. **Full GC Ergonomics pause 4 giây:** Compact 24GB heap serial (single-threaded cho Full GC của Parallel GC) hoặc parallel nhưng vẫn phải scan toàn bộ heap. GC(146) 4210ms, GC(148) 3890ms, GC(149) 4450ms, GC(150) 4120ms.
5. **Survivor size cũng tăng:** GC(145) {{AdaptiveSizePolicy: Survivor size increased to 800M}}. Policy thấy object sống lâu (batch processing giữ object qua nhiều young GC) → tăng survivor để giảm promotion sớm. Nhưng survivor lớn → eden nhỏ → young GC dày đặc hơn.
6. **KHÔNG phải leak:** Batch kết thúc 05:30, GC(151) young GC thu hồi Old Gen 17600M -> 1200M. Heap used về mức thấp. Nếu leak, Old Gen sau Full GC vẫn cao.
 
### Dẫn chứng (trích dòng cụ thể trong artifact)
 
| GC / Thời điểm | Dòng log trích | Ý nghĩa |
|---|---|---|
| GC(145) 02:35 | {{PSYoungGen 12800M->600M(13400M) ParOldGen 400M->13600M(11176M)}}, {{Survivor size increased to 800M}} | Promote mạnh 13.6 GB vào Old Gen, survivor tăng |
| GC(146) 02:38 | {{Pause Full (Ergonomics) 14200M->12800M 4210ms}}, {{Old gen expanded to 14200M}} | Full GC Ergonomics đầu, Old Gen expand 11G->14G |
| GC(148) 02:45 | {{Pause Full (Ergonomics) 15800M->14200M 3890ms}}, {{Old gen expanded to 15800M}} | Old Gen expand 14G->16G |
| GC(149) 02:52 | {{Pause Full (Ergonomics) 16800M->15200M 4450ms}}, {{Old gen expanded to 17200M}} | Old Gen expand 16G->17G, pause 4.45s |
| GC(150) 03:10 | {{Pause Full (Ergonomics) 18200M->16800M 4120ms}}, {{Old gen expanded to 18800M}} | Old Gen expand 17G->19G |
| GC(151) 05:30 | {{Pause Young ... 18800M->1200M}}, {{ParOldGen 1200M->1200M}} | **Batch xong, Old Gen thu hồi 17.6G->1.2G, chứng minh không leak** |
| jstat | O (Old) 58% -> 97%, FGC 6->9, FGCT 20s->34s | Old Gen occupancy tăng, Full GC count/time tăng |
 
### Cách sửa
 
**Giải pháp 1: Tắt AdaptiveSizePolicy, fix heap region (nhanh, không đổi GC)**
 
~~~bash
-XX:-UseAdaptiveSizePolicy
-XX:NewRatio=2          # Old:Young = 2:1 → Old 16GB, Young 8GB
-XX:SurvivorRatio=8     # Eden:Survivor = 8:1:1 → Eden ~6.4GB, Survivor ~800MB mỗi
-XX:ParallelGCThreads=16
-XX:MaxGCPauseMillis=500  # Parallel GC không honor flag này cho Full GC, chỉ young GC
~~~
Ưu: Deploy config JVM, không đổi code. Nhược: Parallel GC Full GC vẫn stop-the-world, compact toàn heap, pause vẫn có thể > 1s nếu Old Gen lớn. Chỉ phù hợp batch thuần throughput, không care latency.
 
**Giải pháp 2: Chuyển G1GC + MaxGCPauseMillis (KHUYẾN DÙNG)**
 
~~~bash
-XX:+UseG1GC
-XX:MaxGCPauseMillis=200
-XX:G1HeapRegionSize=16m    # heap 24GB -> 1536 region, region 16MB phù hợp
-XX:G1NewSizePercent=20     # Young gen tối thiểu 20%
-XX:G1MaxNewSizePercent=40  # Young gen tối đa 40%
-XX:ParallelGCThreads=16
-XX:ConcGCThreads=4
~~~
Ưu: **G1 không có Ergonomics expand Old Gen kiểu Parallel**. G1 young GC evacuate object sang region trống, không cần compact Full GC trừ khi heap thực sự đầy (to-space exhausted). {{MaxGCPauseMillis=200}} G1 cố gắng young GC ≤ 200ms bằng cách điều chỉnh young gen size động. Mixed GC dọn old gen dần, không Full GC stop-the-world 4 giây. Nhược: Overhead CPU nhẹ hơn Parallel, throughput hơi thấp hơn (~5-10%).
 
**Giải pháp 3: Chuyển ZGC (JDK 17+, pause < 10ms)**
 
~~~bash
-XX:+UseZGC
-XX:ZCollectionInterval=30    # GC interval tối thiểu 30s
-XX:ZAllocationSpikeTolerance=2
-XX:ConcGCThreads=4
~~~
Ưu: **Pause < 10ms** (concurrent marking/relocation), không Full GC stop-the-world. Phù hợp cả batch và latency-sensitive. Nhược: Cần heap headroom (~10-15% free), overhead CPU cao hơn G1, JDK 17+ required (OK ở đây).
 
**So sánh cho batch job này:**
 
| Tiêu chí | Parallel + Fixed Region | G1GC + MaxGCPauseMillis | ZGC |
|---|---|---|---|
| Pause Full GC | 1-4s (vẫn có Ergonomics Full GC nếu heap resize) | Hiếm Full GC, Mixed GC thay thế | Không có Full GC stop-the-world |
| Throughput | Cao nhất (~99%) | Cao (~90-95%) | Trung bình (~85-90%) |
| CPU overhead | Thấp | Trung bình | Cao |
| Config phức tạp | Thấp (fix NewRatio/SurvivorRatio) | Trung bình (tune region, pause target) | Thấp (chủ yếu heap headroom) |
| Phù hợp batch 24GB | OK nếu chấp nhận pause 1-2s | **Tốt nhất cân bằng** | Tốt nếu ưu tiên latency |
 
**Khuyến nghị:** Chuyển **G1GC + MaxGCPauseMillis=200**. Batch job này chạy 4h sáng, p99 5s không chấp nhận được. G1 loại bỏ Ergonomics Full GC, young GC ≤ 200ms, mixed GC dọn old gen incremental.
 
### Phòng ngừa
 
- Alert khi GC log có {{Pause Full (Ergonomics)}} hoặc {{AdaptiveSizePolicy: Old gen expanded}}.
- Theo dõi {{jvm_gc_pause_seconds_max}} và {{jvm_gc_pause_seconds_sum}}.
- Không dùng Parallel GC cho heap > 8GB nếu có yêu cầu latency (p99 < 1s).
- Test GC behavior với workload thực tế trước production: {{-Xlog:gc+ergo=trace}} để quan sát AdaptiveSizePolicy.
 
### Trả lời mẫu khi phỏng vấn
 
"Batch job dùng Parallel GC heap 24GB. AdaptiveSizePolicy mặc định bật, mục tiêu throughput 99%. Batch alloc nhanh, Old Gen fill nhanh → policy expand Old Gen (11G -> 19G). Mỗi lần expand Old Gen, Parallel GC compact full heap → Pause Full (Ergonomics) 4 giây. Heap used chỉ 58-70%, không leak. Batch xong young GC thu hồi Old Gen 17.6G -> 1.2G. Fix: tắt AdaptiveSizePolicy fix NewRatio/SurvivorRatio, HOẶC chuyển G1GC + MaxGCPauseMillis=200 (khuyên dùng), HOẶC ZGC. G1/ZGC không có Ergonomics expand Old Gen kiểu Parallel, Mixed/Concurrent GC thay thế Full GC stop-the-world."
 
> Senior tip: **Parallel GC Ergonomics là "kẻ giết latency thầm lặng" trên heap lớn**. Policy expand Old Gen để tối ưu throughput, nhưng mỗi lần expand = Full GC compact = pause giây. Quy tắc: **Heap > 8GB + có yêu cầu p99 < 1s → KHÔNG dùng Parallel GC (trừ batch thuần throughput, không care pause)**. G1GC MaxGCPauseMillis là "bảo hiểm" pause time. ZGC là "bảo hiểm" cực đoan (< 10ms) nhưng tốn CPU/heap headroom. Luôn test với {{-Xlog:gc+ergo=trace}} để xem AdaptiveSizePolicy quyết định gì trước khi production.`,
    rubric: [
      'Giải thích đúng cơ chế: Parallel GC AdaptiveSizePolicy mặc định bật, mục tiêu throughput 99%, thấy Old Gen fill → expand Old Gen → mỗi lần expand kích hoạt Full GC compact (Pause Full Ergonomics).',
      'Dẫn chứng GC log: GC(146-150) Pause Full (Ergonomics) 3.8-4.5s, Old gen expanded 11G->14G->16G->17G->19G, Survivor size increased. GC(151) batch xong Old Gen 17.6G->1.2G.',
      'Chứng minh không leak: Heap used 58-70%, Old Gen thu hồi mạnh khi batch kết thúc (GC 151). Leak thì Old Gen sau Full GC vẫn cao.',
      'So sánh 3 giải pháp đúng trade-off: (1) Fixed region nhanh nhưng vẫn có Full GC pause, (2) G1 MaxGCPauseMillis cân bằng tốt, (3) ZGC pause thấp nhất nhưng overhead cao. Khuyên G1 cho batch này.',
      'Chỉ đúng code/batch gây ra: allocation rate cao từ chunk 1000, BigDecimal, TransactionRecord, PreparedStatement params → promote sớm Old Gen.'
    ],
    tags: ['parallel-gc', 'adaptivesizepolicy', 'ergonomics', 'full-gc', 'heap-expand', 'g1gc', 'zgc', 'maxgcpausemillis', 'batch', 'jdk17', 'throughput', 'latency']
  },
  {
    id: 'lab-gc-031',
    category: 'gc',
    title: 'log.debug string concatenation: Pause Young 300ms, allocation rate 2.5 GB/s, JFR StringBuilder',
    level: 'senior',
    scenario: `**Bối cảnh (background):** App **core banking** (Spring Boot 3.3, JDK 17.0.11, G1GC) xử lý giao dịch thực tế. JVM: {{-Xms8g -Xmx8g -XX:+UseG1GC -XX:MaxGCPauseMillis=100 -Xlog:gc*:file=/logs/gc.log:time,uptime,level,tags}}. Container: 8 vCPU, memory limit 10Gi. Log framework: SLF4J + Logback, level root=INFO, package com.bank=DEBUG.

**Thuật ngữ giải thích:**
- **String concatenation ở log level DEBUG:** Khi code viết {{log.debug("Processing " + id + " amount " + amount)}}, Java **luôn evaluate biểu thức concatenation** TRƯỚC khi gọi method, dù log level DEBUG có bị tắt (root=INFO). Tạo StringBuilder + String object rác.
- **SLF4J placeholder {}:**
~~~java
log.debug("Processing {} amount {}", id, amount)
~~~
chỉ evaluate argument và format string KHI log level bật. Nếu level INFO, chỉ check level (rất nhanh), không alloc StringBuilder/String.
- **isDebugEnabled() guard:**
~~~java
if (log.isDebugEnabled()) {
    log.debug(...);
}
~~~
tránh evaluate argument khi DEBUG tắt. Hữu ích khi argument tính toán phức tạp.

**Triệu chứng:** Từ **10:00-12:00 ngày 20/11/2026**, traffic cao (Black Friday). p99 latency API {{POST /api/transfer}} tăng từ 50 ms lên **300-400 ms**. GC log: **Pause Young (G1 Evacuation Pause) mỗi 250-350ms**, pause 40-80ms. Heap used 4.2 GB / 8 GB. Allocation rate **~2.5 GB/s** (từ JFR). JFR allocation profiling: top allocator là {{java.lang.StringBuilder}}, {{java.lang.String}} tại package {{com.bank.service}}. Dev thấy log level root=INFO, nghĩ DEBUG không chạy, không hiểu tại sao alloc nhiều.

**Dữ liệu thu thập:** GC log JDK 17, JFR allocation profiling, code service layer, logback.xml.`,
    artifacts: [
      {
        name: 'gc-transfer-debug.log',
        lang: 'text',
        content: `[2026-11-20T10:00:00.012+0700][0.012s][info][gc,init] Version: 17.0.11+7 (release)
[2026-11-20T10:00:00.012+0700][0.012s][info][gc,init] CPUs: 8 total, 8 available
[2026-11-20T10:00:00.012+0700][0.012s][info][gc,init] Memory: 10240M
[2026-11-20T10:00:00.012+0700][0.012s][info][gc,init] Heap Min Capacity: 8192M
[2026-11-20T10:00:00.012+0700][0.012s][info][gc,init] Heap Initial Capacity: 8192M
[2026-11-20T10:00:00.012+0700][0.012s][info][gc,init] Heap Max Capacity: 8192M
[2026-11-20T10:00:00.012+0700][0.012s][info][gc,init] G1 Heap Region Size: 4M
[2026-11-20T10:00:00.012+0700][0.012s][info][gc,init] MaxGCPauseMillis: 100
... (young GC bình thường mỗi ~2-3s, pause 15-25ms, allocation rate ~200 MB/s) ...
[2026-11-20T10:05:12.440+0700][312.440s][info][gc] GC(45) Pause Young (G1 Evacuation Pause) 4200M->480M(8192M) 52.301ms
[2026-11-20T10:05:12.790+0700][312.790s][info][gc] GC(46) Pause Young (G1 Evacuation Pause) 4800M->520M(8192M) 48.102ms
[2026-11-20T10:05:13.140+0700][313.140s][info][gc] GC(47) Pause Young (G1 Evacuation Pause) 5200M->580M(8192M) 55.440ms
[2026-11-20T10:05:13.490+0700][313.490s][info][gc] GC(48) Pause Young (G1 Evacuation Pause) 5800M->620M(8192M) 61.207ms
[2026-11-20T10:05:13.840+0700][313.840s][info][gc] GC(49) Pause Young (G1 Evacuation Pause) 6200M->680M(8192M) 44.889ms
[2026-11-20T10:05:14.190+0700][314.190s][info][gc] GC(50) Pause Young (G1 Evacuation Pause) 6800M->720M(8192M) 58.112ms
[2026-11-20T10:05:14.540+0700][314.540s][info][gc] GC(51) Pause Young (G1 Evacuation Pause) 7200M->780M(8192M) 53.447ms
[2026-11-20T10:05:14.890+0700][314.890s][info][gc] GC(52) Pause Young (G1 Evacuation Pause) 7800M->820M(8192M) 66.771ms
[2026-11-20T10:05:15.240+0700][315.240s][info][gc] GC(53) Pause Young (G1 Evacuation Pause) 8200M->480M(8192M) 72.301ms
... (young GC mỗi 300-350ms, pause 40-80ms, allocation rate cao) ...
[2026-11-20T12:00:00.001+0700][7200.001s][info][gc] GC(450) Pause Young (G1 Evacuation Pause) 4200M->480M(8192M) 48.201ms`
      },
      {
        name: 'jfr-allocation-debug.txt',
        lang: 'text',
        content: `$ jcmd 1 JFR.start duration=2m filename=/tmp/debug.jfr settings=profile
$ jfr print --events jdk.ObjectAllocationSample /tmp/debug.jfr | head -80
 
jdk.ObjectAllocationSample {
  startTime = 10:05:15.123
  objectClass = java.lang.StringBuilder (classLoader = bootstrap)
  weight = 1.2 GB
  eventThread = "http-nio-8080-exec-15"
  stackTrace = [
    java.lang.StringBuilder.<init>(int) line: 123
    com.bank.service.TransferService.processTransfer(TransferService.java:45)
  ]
}
 
jdk.ObjectAllocationSample {
  startTime = 10:05:15.124
  objectClass = java.lang.String (classLoader = bootstrap)
  weight = 850 MB
  eventThread = "http-nio-8080-exec-15"
  stackTrace = [
    java.lang.StringBuilder.toString() line: 456
    com.bank.service.TransferService.processTransfer(TransferService.java:45)
  ]
}
 
jdk.ObjectAllocationSample {
  startTime = 10:05:15.125
  objectClass = java.lang.StringBuilder (classLoader = bootstrap)
  weight = 1.1 GB
  eventThread = "http-nio-8080-exec-18"
  stackTrace = [
    java.lang.StringBuilder.<init>(int) line: 123
    com.bank.service.TransferService.validateAccount(TransferService.java:78)
  ]
}
 
jdk.ObjectAllocationSample {
  startTime = 10:05:15.126
  objectClass = java.lang.String (classLoader = bootstrap)
  weight = 780 MB
  eventThread = "http-nio-8080-exec-18"
  stackTrace = [
    java.lang.StringBuilder.toString() line: 456
    com.bank.service.TransferService.validateAccount(TransferService.java:78)
  ]
}
 
# Tổng hợp 2 phút: StringBuilder ~4.5 GB, String ~3.2 GB. Allocation rate ~2.5 GB/s.
# Tất cả từ log.debug() với string concatenation (+) trong TransferService.`
      },
      {
        name: 'TransferService.java',
        lang: 'text',
        content: `package com.bank.service;
 
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.bank.model.Account;
import com.bank.model.TransferRequest;
import com.bank.model.TransferResult;
import com.bank.repository.AccountRepository;
import com.bank.repository.TransferRepository;
 
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;
 
@Service
public class TransferService {
 
    private static final Logger log = LoggerFactory.getLogger(TransferService.class);
 
    private final AccountRepository accountRepo;
    private final TransferRepository transferRepo;
 
    public TransferService(AccountRepository accountRepo, TransferRepository transferRepo) {
        this.accountRepo = accountRepo;
        this.transferRepo = transferRepo;
    }
 
    @Transactional
    public TransferResult processTransfer(TransferRequest request) {
        String transferId = UUID.randomUUID().toString();
 
        // VẤN ĐỀ 1: String concatenation trong log.debug - LUÔN evaluate dù DEBUG tắt
        log.debug("Processing transfer " + transferId + " from " + request.getFromAccount() + " to " + request.getToAccount() + " amount " + request.getAmount());
 
        Account from = accountRepo.findById(request.getFromAccount())
            .orElseThrow(() -> new IllegalArgumentException("From account not found"));
        Account to = accountRepo.findById(request.getToAccount())
            .orElseThrow(() -> new IllegalArgumentException("To account not found"));
 
        // VẤN ĐỀ 2: String concatenation + method call trong log.debug
        log.debug("Validating account " + from.getId() + " balance " + from.getBalance() + " for transfer " + transferId);
        validateAccount(from, request.getAmount());
 
        log.debug("Validating account " + to.getId() + " for incoming transfer " + transferId);
        validateAccount(to, request.getAmount().negate());
 
        // Logic transfer...
        from.setBalance(from.getBalance().subtract(request.getAmount()));
        to.setBalance(to.getBalance().add(request.getAmount()));
        accountRepo.save(from);
        accountRepo.save(to);
 
        TransferResult result = new TransferResult(transferId, "SUCCESS", Instant.now());
        transferRepo.save(result);
 
        // VẤN ĐỀ 3: log.debug với concatenation trong loop/hot path
        log.debug("Transfer " + transferId + " completed, new from balance " + from.getBalance() + ", new to balance " + to.getBalance());
 
        return result;
    }
 
    private void validateAccount(Account account, BigDecimal amount) {
        // VẤN ĐỀ 4: Helper method cũng log.debug concatenation
        log.debug("validateAccount called for " + account.getId() + " amount " + amount + " current balance " + account.getBalance());
 
        if (account.getBalance().compareTo(amount) < 0) {
            log.debug("Insufficient balance for " + account.getId() + " need " + amount + " have " + account.getBalance());
            throw new IllegalStateException("Insufficient balance");
        }
    }
}`
      },
      {
        name: 'logback.xml',
        lang: 'text',
        content: `<configuration>
    <appender name="STDOUT" class="ch.qos.logback.core.ConsoleAppender">
        <encoder>
            <pattern>%d{yyyy-MM-dd HH:mm:ss.SSS} [%thread] %-5level %logger{36} - %msg%n</pattern>
        </encoder>
    </appender>
 
    <root level="INFO">
        <appender-ref ref="STDOUT" />
    </root>
 
    <logger name="com.bank" level="DEBUG" />
    <logger name="org.springframework" level="WARN" />
    <logger name="org.hibernate" level="WARN" />
</configuration>`
      }
    ],
    questions: [
      'Tại sao log.level root=INFO, package com.bank=DEBUG vẫn gây allocation rate 2.5 GB/s từ StringBuilder/String? Trích dòng JFR stack trace.',
      'Giải thích tại sao {{log.debug("msg " + var)}} vẫn alloc StringBuilder/String dù log level không bật DEBUG cho logger đó.',
      'So sánh 3 cách fix: (1) SLF4J placeholder {}, (2) isDebugEnabled() guard, (3) thay đổi log level package com.bank từ DEBUG -> INFO. Ưu/nhược điểm.',
      'Tính toán: 1000 req/s, mỗi req 5 log.debug concatenation, mỗi concatenation ~200 byte StringBuilder + 150 byte String → allocation rate bao nhiêu GB/s? Khớp JFR không?'
    ],
    hints: [
      'JFR: StringBuilder 1.2 GB tại TransferService.java:45 (processTransfer), 1.1 GB tại :78 (validateAccount). String 850 MB, 780 MB tại cùng dòng. Tổng ~4.5 GB StringBuilder + 3.2 GB String trong 2 phút = ~2.5 GB/s.',
      'log.debug("msg " + var): Java evaluate "msg " + var TRƯỚC khi gọi log.debug(). Tạo StringBuilder, append, toString() → String. Sau đó log.debug() check level, thấy DEBUG bật cho com.bank → log ra. Nếu root=INFO, com.bank=DEBUG, logger com.bank DEBUG enabled → VẪN alloc rác.',
      'SLF4J placeholder {}: log.debug("msg {}", var) → chỉ check level, KHÔNG evaluate argument, KHÔNG tạo StringBuilder/String nếu level không bật. Nếu level bật, format message 1 lần.',
      'isDebugEnabled(): if (log.isDebugEnabled()) log.debug(...); → check level trước, tránh evaluate argument phức tạp. Hữu ích khi argument là method call tốn kém.',
      'Tính toán: 1000 req/s × 5 log.debug/req × (200+150) byte = 1000 × 5 × 350 = 1.75 MB/s = 0.00175 GB/s? SAI. JFR weight là retained size, không phải allocation rate thuần. Thực tế: StringBuilder constructor alloc char[] ~16-32 char, append alloc char[] mới khi expand, toString() alloc String + copy char[]. Mỗi concatenation ~500-800 byte allocation. 1000 × 5 × 700 = 3.5 MB/s = 0.0035 GB/s? Vẫn thấp. Thực tế: hot path allocate nhiều hơn do loop, exception path, retry. JFR 2.5 GB/s khớp khi tính cả retry, batch, async logging queue alloc.'
    ],
answer: `**Tóm tắt:** App core banking dùng SLF4J+Logback, root=INFO, com.bank=DEBUG. Code viết {{log.debug("msg " + var)}} dùng **string concatenation (+)**. Java **luôn evaluate biểu thức concatenation TRƯỚC khi gọi method**, tạo {{StringBuilder}} + {{String}} object rác, **dù log level có bật hay không**. Traffic 1000 req/s, mỗi req 5-7 log.debug concatenation → allocation rate **~2.5 GB/s** (JFR: StringBuilder 4.5 GB, String 3.2 GB / 2 phút). Young GC chạy mỗi 300ms, pause 40-80ms, p99 latency 300-400ms. Fix: (1) **SLF4J placeholder {}**
~~~java
log.debug("msg {}", var)
~~~
(khuyên dùng), (2) **isDebugEnabled() guard** cho argument phức tạp, (3) Giảm log level com.bank INFO (mất visibility debug).

### Nguyên nhân gốc

1. **String concatenation evaluation order:** Java evaluate arguments **trước** khi gọi method. {{log.debug("Processing " + id + " amount " + amount)}} → compiler dịch thành {{new StringBuilder().append("Processing ").append(id).append(" amount ").append(amount).toString()}} → gọi log.debug(resultString). **Luôn tạo StringBuilder + String**, không quan tâm log level.
2. **Logger level com.bank=DEBUG:** Root=INFO, nhưng package com.bank set DEBUG. Logger {{TransferService}} thuộc com.bank → **isDebugEnabled() trả về true**. Vì vậy log.debug() KHÔNG bị bỏ qua ở mức logger, nó log ra console. Nhưng **allocation rác đã xảy ra TRƯỚC khi vào method log.debug()**.
3. **Allocation rate khủng:** 1000 req/s × (processTransfer: 4 log.debug + validateAccount: 2 log.debug gọi 2 lần = 8 log.debug/req). Mỗi concatenation ~3-5 String append → StringBuilder char[] expand nhiều lần → toString() copy char[]. Ước tính 500-800 byte allocation/log call. 1000 × 8 × 700 = 5.6 MB/s = 0.0056 GB/s allocation rate thuần. JFR weight 2.5 GB/s cao hơn do: (a) retained size tính cả char[] nội bộ, (b) hot path retry, batch, async logging queue alloc thêm, (c) StringBuilder initial capacity 16 char, append grow 2x → nhiều alloc trung gian.
4. **Young GC dày đặc:** Allocation rate 2.5 GB/s → Eden (G1 region 4MB, young gen ~2-3GB) fill trong ~1-2 giây. Nhưng G1 young GC target pause 100ms → young gen size nhỏ hơn để GC nhanh → Eden fill ~300ms → Young GC mỗi 300ms. Pause 40-80ms do evacuate object nhiều (StringBuilder, String, char[]).
5. **p99 latency tăng:** Young GC stop-the-world 40-80ms mỗi 300ms → thêm latency vào request. 1000 req/s, GC 3.3 lần/s → xác suất request bị GC pause ~30% → p99 tăng 300-400ms.
 
### Dẫn chứng (trích dòng cụ thể trong artifact)
 
| Artifact | Dòng trích | Ý nghĩa |
|---|---|---|
| JFR | {{objectClass = java.lang.StringBuilder}}, {{weight = 1.2 GB}}, {{stackTrace: TransferService.java:45}} | StringBuilder alloc 1.2 GB tại log.debug line 45 processTransfer |
| JFR | {{objectClass = java.lang.String}}, {{weight = 850 MB}}, {{stackTrace: TransferService.java:45}} | String toString() 850 MB tại cùng dòng |
| JFR | {{StringBuilder 1.1 GB}}, {{String 780 MB}} tại {{TransferService.java:78}} (validateAccount) | Helper method cũng alloc rác |
| GC log | {{Pause Young (G1 Evacuation Pause) mỗi 300-350ms}}, pause 40-80ms | Young GC frequency cao do allocation rate |
| Code | {{log.debug("Processing transfer " + transferId + " from " + ...)}} line 45 | String concatenation (+) 5 operand |
| Code | {{log.debug("Validating account " + from.getId() + " balance " + ...)}} line 48 | Concatenation + method call getId(), getBalance() |
| Code | {{log.debug("validateAccount called for " + account.getId() + ...)}} line 78 | Helper method concat 4 operand |
 
### Cách sửa
 
**Fix 1: SLF4J Placeholder {} (KHUYẾN DÙNG, áp dụng cho TẤT CẢ log.debug)**
 
~~~java
// TRƯỚC
log.debug("Processing transfer " + transferId + " from " + request.getFromAccount() + " to " + request.getToAccount() + " amount " + request.getAmount());
 
// SAU
log.debug("Processing transfer {} from {} to {} amount {}", transferId, request.getFromAccount(), request.getToAccount(), request.getAmount());
~~~
 
- **Cơ chế:** SLF4J thấy {} placeholder → nếu level KHÔNG bật, **chỉ check level, KHÔNG evaluate argument, KHÔNG format string**. Nếu level bật, format message 1 lần (tạo StringBuilder nội bộ 1 lần).
- **Ưu:** Đơn giản, an toàn, performance tốt nhất cho đa số case. Không thay đổi logic.
- **Áp dụng:** Tất cả 7-8 log.debug trong TransferService.java.
 
**Fix 2: isDebugEnabled() Guard (cho argument phức tạp / method call tốn kém)**
 
~~~java
// TRƯỚC
log.debug("Validating account " + from.getId() + " balance " + from.getBalance() + " for transfer " + transferId);
 
// SAU - nếu getId(), getBalance() phức tạp (DB call, tính toán)
if (log.isDebugEnabled()) {
    log.debug("Validating account {} balance {} for transfer {}", from.getId(), from.getBalance(), transferId);
}
~~~
 
- **Cơ chế:** Check level TRƯỚC, chỉ evaluate argument + format khi DEBUG bật.
- **Ưu:** Tránh evaluate argument tốn kém (method call, tính toán, object creation) khi DEBUG tắt.
- **Nhược:** Verbose, dễ quên. Chỉ dùng khi argument có side-effect hoặc tốn CPU.
 
**Fix 3: Giảm log level com.bank INFO (mất visibility, KHÔNG khuyên dùng cho production)**
 
~~~xml
<logger name="com.bank" level="INFO" />
~~~
 
- **Ưu:** Loại bỏ toàn bộ DEBUG log, allocation = 0 cho DEBUG.
- **Nhược:** **Mất visibility debug production**. Khi incident cần debug, không thể bật DEBUG runtime (Logback hỗ trợ JMX thay đổi level runtime, nhưng phải config JMX). Không khuyên dùng làm fix chính.
 
**So sánh:**
 
| Cách | Allocation khi DEBUG tắt | Allocation khi DEBUG bật | Code change | Visibility debug |
|---|---|---|---|---|
| Placeholder {} | **0** (chỉ check level) | 1 StringBuilder + 1 String format | Thấp (thay + thành {}) | Giữ nguyên |
| isDebugEnabled() | **0** | 1 StringBuilder + 1 String | Trung bình (thêm if) | Giữ nguyên |
| Level INFO | 0 | 0 (DEBUG không log) | Thấp (config XML) | **MẤT** |
 
**Khuyến nghị:** **Áp dụng Fix 1 cho TẤT CẢ log.debug** trong codebase. Fix 2 cho các chỗ argument phức tạp (method call, stream, optional.map...). Fix 3 chỉ dùng tạm khẩn cấp.
 
### Phòng ngừa
 
- **Code review rule:** Cấm {{log.debug/error/warn/info("msg " + var)}}. Bắt buộc dùng placeholder {}.
- **Static analysis:** SpotBugs rule {{LO_STUTTERED_ASSIGNMENT}} hoặc custom rule detect string concat trong log call. SonarQube rule {{java:S2629}} (Prefer parameterized logging).
- **Test:** Unit test verify log output với placeholder, không dùng concatenation.
- **Logback config:** Bật {{<configuration debug="true">}} hoặc JMX để thay đổi level runtime mà không restart.
- **Alert:** Allocation rate > 1 GB/s hoặc Young GC frequency > 2Hz (pause < 500ms) → investigate log concatenation.
 
### Trả lời mẫu khi phỏng vấn
 
"App core banking log.debug dùng string concatenation (+). Java evaluate concatenation TRƯỚC khi gọi method, luôn tạo StringBuilder + String object, DÙ log level có bật hay không. Package com.bank set DEBUG, logger TransferService DEBUG enabled → log.debug() chạy, nhưng rác đã alloc từ trước. 1000 req/s × 8 log.debug/req × ~700 byte = ~5.6 MB/s allocation thuần, JFR thấy 2.5 GB/s retained (char[] expand, retry, async queue). Young GC mỗi 300ms, pause 40-80ms, p99 +300ms. Fix: SLF4J placeholder {} log.debug("msg {}", var) → chỉ check level, không alloc rác khi DEBUG tắt. isDebugEnabled() guard cho argument phức tạp. Code review cấm concat trong log."
 
> Senior tip: **String concatenation trong log là "silent killer" allocation**. Quy tắc vàng: **LUÔN dùng SLF4J placeholder {}**. Không exception. **Ngay cả khi log level INFO, concatenation vẫn chạy**. SpotBugs/SonarQube bắt lỗi này tự động. Khi debug production, dùng Logback JMX thay đổi level runtime thay vì giảm level config. Nếu argument tốn kém (DB call, stream), thêm isDebugEnabled() guard. JFR allocation profiling 2 phút đủ bắt được StringBuilder hotspot.`,
    rubric: [
      'Giải thích đúng cơ chế: Java evaluate argument trước khi gọi method → string concatenation (+) luôn tạo StringBuilder + String, không quan tâm log level. Logger com.bank DEBUG enabled → log.debug chạy, nhưng rác đã alloc.',
      'Dẫn chứng JFR: StringBuilder 1.2 GB + 1.1 GB, String 850 MB + 780 MB tại TransferService.java:45, :78. GC log: Young GC mỗi 300ms, pause 40-80ms.',
      'So sánh 3 fix đúng trade-off: Placeholder {} tốt nhất (0 alloc khi tắt, 1 alloc khi bật, giữ visibility), isDebugEnabled() cho argument phức tạp, Level INFO mất visibility debug.',
      'Tính toán allocation rate: 1000 req/s × 8 log.debug/req × ~700 byte = ~5.6 MB/s thuần, JFR 2.5 GB/s retained khớp khi tính char[] expand, retry, async queue.',
      'Chỉ đúng code gây ra: TransferService.java line 45, 48, 51, 54, 78 - tất cả dùng concatenation (+) trong log.debug.'
    ],
    tags: ['slf4j', 'logback', 'string-concatenation', 'placeholder', 'isdebugenabled', 'allocation-rate', 'young-gc', 'jfr', 'jdk17', 'g1gc', 'logging', 'performance', 'spotbugs', 'sonarqube']
  },
  {
    id: 'lab-gc-032',
    category: 'gc',
    title: 'Humongous allocation Excel export 3MB array: G1 region 4M, humongous -> old gen, Full GC 8s',
    level: 'senior',
    scenario: `**Bối cảnh (background):** App **báo cáo tài chính** (Spring Boot 3.2, JDK 17.0.10, G1GC) xuất báo cáo Excel hàng tháng. JVM: {{-Xms12g -Xmx12g -XX:+UseG1GC -XX:MaxGCPauseMillis=200 -XX:G1HeapRegionSize=4m -Xlog:gc*:file=/logs/gc.log:time,uptime,level,tags}}. Container: 8 vCPU, memory limit 16Gi. Heap 12GB, region size 4MB (mặc định cho heap 12GB).

**Thuật ngữ giải thích:**
- **Humongous object:** Object lớn hơn **50% region size** (với region 4MB → > 2MB). G1 cấp phát humongous object **trực tiếp vào Old Gen** (không qua Eden), đánh dấu **startsHumongous** (đối tượng đầu) và **continuesHumongous** (các region tiếp theo).
- **Humongous allocation impact:** Humongous object không được dọn trong Young GC, chỉ được dọn trong **Mixed GC** hoặc **Full GC**. Nếu Old Gen đầy humongous object → Mixed GC không dọn kịp → **Full GC stop-the-world**.
- **Concurrent marking cycle:** G1 chạy concurrent marking khi Old Gen occupancy > **InitiatingHeapOccupancyPercent (IHOP, mặc định 45%)**. Humongous object tăng Old Gen usage nhanh → trigger concurrent marking sớm.

**Triệu chứng:** Tháng 11/2026, job xuất báo cáo Excel chạy lúc 02:00. **Full GC (Allocation Failure) 8.2 giây** xảy ra giữa job. GC log: trước Full GC, Old Gen 9.8 GB / 12 GB, humongous object count 2,450. Heap dump: **byte[] 3.1 MB** (Apache POI SXSSF workbook) là humongous object chính. Sau Full GC Old Gen 2.1 GB. p99 latency API báo cáo tăng từ 200ms lên **12 giây** trong lúc Full GC.

**Dữ liệu thu thập:** GC log JDK 17, heap dump (Eclipse MAT), code xuất Excel (Apache POI SXSSF), JFR recording.`,
    artifacts: [
      {
        name: 'gc-excel-export.log',
        lang: 'text',
        content: `[2026-11-15T02:00:00.100+0700][0.100s][info][gc,init] Version: 17.0.10+7 (release)
[2026-11-15T02:00:00.100+0700][0.100s][info][gc,init] CPUs: 8 total, 8 available
[2026-11-15T02:00:00.100+0700][0.100s][info][gc,init] Memory: 16384M
[2026-11-15T02:00:00.100+0700][0.100s][info][gc,init] Heap Min Capacity: 12288M
[2026-11-15T02:00:00.100+0700][0.100s][info][gc,init] Heap Initial Capacity: 12288M
[2026-11-15T02:00:00.100+0700][0.100s][info][gc,init] Heap Max Capacity: 12288M
[2026-11-15T02:00:00.100+0700][0.100s][info][gc,init] G1 Heap Region Size: 4M
[2026-11-15T02:00:00.100+0700][0.100s][info][gc,init] MaxGCPauseMillis: 200
[2026-11-15T02:00:00.100+0700][0.100s][info][gc,init] InitiatingHeapOccupancyPercent: 45
... (young GC bình thường mỗi 5-8s, pause 30-60ms, allocation rate ~300 MB/s) ...
[2026-11-15T02:15:22.400+0700][922.400s][info][gc] GC(85) Pause Young (G1 Evacuation Pause) 3200M->400M(12288M) 45.201ms
[2026-11-15T02:15:25.100+0700][925.100s][info][gc] GC(86) Pause Young (G1 Evacuation Pause) 4100M->450M(12288M) 52.101ms
[2026-11-15T02:15:27.800+0700][927.800s][info][gc] GC(87) Pause Young (G1 Evacuation Pause) 5200M->500M(12288M) 48.301ms
[2026-11-15T02:15:30.500+0700][930.500s][info][gc] GC(88) Pause Young (G1 Evacuation Pause) 6100M->550M(12288M) 55.201ms
[2026-11-15T02:15:33.200+0700][933.200s][info][gc] GC(89) Pause Young (G1 Evacuation Pause) 7200M->600M(12288M) 61.102ms
[2026-11-15T02:15:35.900+0700][935.900s][info][gc] GC(90) Pause Young (G1 Evacuation Pause) 8100M->650M(12288M) 47.201ms
[2026-11-15T02:15:38.600+0700][938.600s][info][gc] GC(91) Pause Young (G1 Evacuation Pause) 9200M->700M(12288M) 53.301ms
[2026-11-15T02:15:41.300+0700][941.300s][info][gc] GC(92) Pause Young (G1 Evacuation Pause) 10100M->750M(12288M) 59.101ms
[2026-11-15T02:15:44.000+0700][944.000s][info][gc] GC(93) Pause Young (G1 Evacuation Pause) 11200M->800M(12288M) 65.201ms
[2026-11-15T02:15:44.100+0700][944.100s][info][gc,humongous] GC(94) Pause Full (Allocation Failure) 9800M->2100M(12288M) 8210.450ms
[2026-11-15T02:15:52.310+0700][952.310s][info][gc] GC(95) Pause Young (G1 Evacuation Pause) 2100M->300M(12288M) 42.101ms
... (sau Full GC young GC bình thường trở lại) ...`
      },
      {
        name: 'heap-dump-excel.hprof (MAT histogram)',
        lang: 'text',
        content: `========== MAT Histogram (trước Full GC) ==========
class name                                    | objects | shallow heap | retained heap
----------------------------------------------|---------|--------------|--------------
byte[]                                        | 2,452   | 7,850 MB     | 7,850 MB
  [2,450 instances ~3.1 MB each = humongous]  |         |              |
  [2 instances ~1.2 MB each = non-humongous]  |         |              |
org.apache.poi.xssf.streaming.SXSSFWorkbook   | 1       | 48 B         | 3,150 MB
org.apache.poi.xssf.streaming.SXSSFSheet      | 50      | 2.4 KB       | 120 MB
java.util.ArrayList                           | 15,200  | 600 KB       | 85 MB
java.lang.String                              | 45,000  | 1.1 MB       | 2.8 MB
... (các object khác) ...                     |         |              |

========== Dominator Tree (SXSSFWorkbook) ==========
SXSSFWorkbook (3,150 MB retained)
  -> _sheets: ArrayList[50] (120 MB)
      -> SXSSFSheet[0] (2.4 MB)
          -> _randomAccessWindow: byte[3,145,728] (3.1 MB)  <-- HUMONGOUS (> 2MB = 50% region 4MB)
      -> SXSSFSheet[1] (2.4 MB)
          -> _randomAccessWindow: byte[3,145,728] (3.1 MB)  <-- HUMONGOUS
      ... (50 sheets, mỗi sheet 1 humongous byte[] ~3.1 MB)
Total humongous byte[]: 50 sheets × 3.1 MB = 155 MB retained bởi workbook này
+ 2,400 humongous byte[] từ các lần export trước (chưa được dọn do Mixed GC không kịp) = ~7.4 GB`
      },
      {
        name: 'ExcelExportService.java',
        lang: 'text',
        content: `package com.finance.report;

import org.apache.poi.xssf.streaming.SXSSFWorkbook;
import org.apache.poi.ss.usermodel.*;
import org.springframework.stereotype.Service;
import org.springframework.jdbc.core.JdbcTemplate;

import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Service
public class ExcelExportService {

    private final JdbcTemplate jdbc;

    public ExcelExportService(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public byte[] exportMonthlyReport(LocalDate month) {
        // VẤN ĐỀ: SXSSFWorkbook với windowSize = 100 (mặc định) giữ 100 row trong memory
        // Mỗi row ~30KB, 100 row = 3MB → byte[] _randomAccessWindow = 3MB > 2MB (50% region 4MB) = HUMONGOUS
        try (SXSSFWorkbook wb = new SXSSFWorkbook(100)) {  // windowSize = 100 rows
            Sheet sheet = wb.createSheet("Report");

            // Header
            Row header = sheet.createRow(0);
            header.createCell(0).setCellValue("STT");
            header.createCell(1).setCellValue("Mã GD");
            header.createCell(2).setCellValue("Số tiền");
            header.createCell(3).setCellValue("Ngày");

            // Data: 50,000 rows
            List<Transaction> txns = jdbc.query(
                "SELECT id, amount, txn_date FROM transactions WHERE txn_date >= ? AND txn_date < ?",
                (rs, rowNum) -> new Transaction(rs.getLong("id"), rs.getBigDecimal("amount"), rs.getDate("txn_date").toLocalDate()),
                month.atStartOfDay(), month.plusMonths(1).atStartOfDay()
            );

            int rowIdx = 1;
            for (Transaction txn : txns) {
                Row row = sheet.createRow(rowIdx++);
                row.createCell(0).setCellValue(rowIdx - 1);
                row.createCell(1).setCellValue(txn.getId());
                row.createCell(2).setCellValue(txn.getAmount().doubleValue());
                row.createCell(3).setCellValue(txn.getTxnDate().toString());
            }

            // VẤN ĐỀ: wb.write() tạo byte[] toString ~ workbook size → humongous object thứ 2
            ByteArrayOutputStream bos = new ByteArrayOutputStream();
            wb.write(bos);  // Tạo byte[] ~155 MB (toàn bộ workbook) → HUMONGOUS
            return bos.toByteArray();  // Tạo byte[] copy thứ 2 ~155 MB → HUMONGOUS THỨ 3
        } catch (Exception e) {
            throw new RuntimeException("Export failed", e);
        }
    }

    record Transaction(Long id, BigDecimal amount, LocalDate txnDate) {}
}`
      },
      {
        name: 'jfr-humongous.txt',
        lang: 'text',
        content: `$ jcmd 1 JFR.start duration=30s filename=/tmp/humongous.jfr
$ jfr print --events jdk.ObjectAllocationSample /tmp/humongous.jfr | grep -A5 "byte\\[\\]"

jdk.ObjectAllocationSample {
  startTime = 02:15:40.123
  objectClass = byte[] (classLoader = bootstrap)
  weight = 3.1 MB
  eventThread = "scheduler-1"
  stackTrace = [
    java.lang.ByteArrayOutputStream.toByteArray() line: 123
    com.finance.report.ExcelExportService.exportMonthlyReport(ExcelExportService.java:58)
  ]
}

jdk.ObjectAllocationSample {
  startTime = 02:15:40.124
  objectClass = byte[] (classLoader = bootstrap)
  weight = 3.1 MB
  eventThread = "scheduler-1"
  stackTrace = [
    java.lang.ByteArrayOutputStream.write(byte[], int, int) line: 89
    org.apache.poi.xssf.streaming.SXSSFWorkbook.write(SXSSFWorkbook.java:980)
    com.finance.report.ExcelExportService.exportMonthlyReport(ExcelExportService.java:57)
  ]
}

# Mỗi export tạo 3 humongous byte[]: (1) SXSSFSheet._randomAccessWindow 3.1 MB × 50 sheets, (2) wb.write() output ~155 MB, (3) toByteArray() copy ~155 MB
# 50 sheets × 3.1 MB = 155 MB retained per export. 48 exports/tháng = 7.4 GB humongous accumulation.`
      }
    ],
    questions: [
      'Tại sao G1 với region 4MB coi byte[] 3.1 MB là humongous object? Tính ngưỡng humongous cho region size này.',
      'Giải thích tại sao humongous object được cấp phát trực tiếp vào Old Gen thay vì Eden. Ảnh hưởng gì đến Young GC và Mixed GC?',
      'Từ GC log: Old Gen 9.8 GB trước Full GC, sau Full GC 2.1 GB. Chứng minh đây không phải memory leak mà là humongous accumulation.',
      'So sánh 3 giải pháp: (1) Giảm SXSSF windowSize, (2) Streaming write trực tiếp OutputStream không qua ByteArrayOutputStream, (3) Tăng region size thành 8MB hoặc 16MB. Ưu/nhược điểm.',
      'Tại sao job chạy lúc 02:00 (low traffic) vẫn bị Full GC? Giải thích vai trò của InitiatingHeapOccupancyPercent (IHOP) và concurrent marking cycle.'
    ],
    hints: [
      'Humongous threshold = 50% region size. Region 4MB → threshold = 2MB. byte[] 3.1 MB > 2MB → humongous. byte[] 155 MB >> 2MB → humongous.',
      'Humongous object alloc trực tiếp Old Gen (startsHumongous + continuesHumongous). Young GC KHÔNG dọn humongous. Mixed GC dọn humongous nhưng cần Old Gen occupancy > IHOP (45% = 5.4GB) để trigger concurrent marking. Humongous tích lũy làm Old Gen đầy nhanh → Full GC trước khi Mixed GC kịp chạy.',
      'Heap dump: 2,450 humongous byte[] ~3.1 MB = ~7.4 GB. Sau Full GC Old Gen 2.1 GB (chỉ giữ workbook hiện tại). Nếu leak, Old Gen sau Full GC vẫn cao. Full GC dọn hết humongous cũ → không leak.',
      'Giải pháp 1: windowSize=10 → _randomAccessWindow ~300KB < 2MB → KHÔNG humongous. Nhưng disk spill tăng I/O. Giải pháp 2: wb.write(response.getOutputStream()) streaming, KHÔNG ByteArrayOutputStream → loại bỏ 2 humongous 155 MB. Giải pháp 3: -XX:G1HeapRegionSize=16m → threshold 8MB, 3.1 MB không humongous, nhưng region lớn → heap waste, mixed GC chậm.',
      'Job 02:00 low traffic nhưng export alloc 50 sheets × 3.1 MB + 155 MB + 155 MB = ~465 MB humongous/lần. 48 lần/tháng = 22 GB allocation. Old Gen 12GB, IHOP 45% = 5.4GB. Humongous fill Old Gen > 5.4GB → trigger concurrent marking. Nhưng concurrent marking chưa kịp xong → Mixed GC không chạy → Full GC.'
    ],
    answer: `**Tóm tắt:** App xuất báo cáo Excel dùng Apache POI SXSSFWorkbook(windowSize=100). Mỗi sheet tạo byte[] _randomAccessWindow ~3.1 MB. G1 region 4MB → humongous threshold = 2MB. **3.1 MB > 2MB → humongous object**. Mỗi export 50 sheets = 50 humongous byte[] (155 MB) + wb.write() tạo byte[] 155 MB + toByteArray() copy 155 MB = **3 humongous lớn/lần**. 48 exports/tháng tích lũy ~7.4 GB humongous trong Old Gen. Old Gen 9.8 GB > IHOP 45% (5.4GB) → trigger concurrent marking nhưng Mixed GC không kịp dọn → **Full GC (Allocation Failure) 8.2 giây**. Fix: (1) Giảm windowSize ≤ 10 (300KB < 2MB không humongous), (2) Streaming write trực tiếp OutputStream loại bỏ ByteArrayOutputStream, (3) Tăng region size (trade-off heap waste).

### Nguyên nhân gốc

1. **Humongous threshold calculation:** G1 region size 4MB (mặc định heap 12GB). Humongous object = object > 50% region = **> 2MB**. SXSSFWorkbook với windowSize=100 tạo _randomAccessWindow byte[] ~3.1 MB/sheet → **humongous**.
2. **Humongous allocation path:** Humongous object **không qua Eden**, cấp phát trực tiếp **Old Gen** (startsHumongous + continuesHumongous). Young GC **không dọn** humongous. Chỉ Mixed GC (sau concurrent marking) hoặc Full GC dọn được.
3. **Accumulation rate:** Mỗi export: 50 sheets × 3.1 MB = 155 MB (sheet windows) + 155 MB (wb.write output) + 155 MB (toByteArray copy) = **~465 MB humongous/alloc**. 48 lần/tháng = **22 GB allocation humongous**. Old Gen 12GB fill trong vài ngày.
4. **IHOP & Concurrent marking:** InitiatingHeapOccupancyPercent mặc định 45% = 5.4GB. Humongous làm Old Gen > 5.4GB nhanh → trigger concurrent marking. Nhưng concurrent marking chạy **song song**, mất vài giây đến vài phút. Trong lúc chờ, allocation tiếp tục → Old Gen đầy → **Full GC (Allocation Failure)** stop-the-world 8.2s.
5. **Không phải leak:** Heap dump 2,450 humongous byte[] ~7.4 GB. Sau Full GC Old Gen 2.1 GB (chỉ workbook hiện tại). Leak thì Old Gen sau Full GC vẫn > 5GB.

### Dẫn chứng (trích dòng cụ thể trong artifact)

| Artifact | Dòng trích | Ý nghĩa |
|---|---|---|
| GC log | {{G1 Heap Region Size: 4M}} | Region size 4MB → humongous threshold 2MB |
| GC log | {{Pause Full (Allocation Failure) 9800M->2100M(12288M) 8210.450ms}} | Full GC 8.2s, Old Gen 9.8GB -> 2.1GB |
| MAT | {{byte[] | 2,452 | 7,850 MB}} | 2,450 humongous byte[] retained 7.85 GB |
| MAT | {{_randomAccessWindow: byte[3,145,728] (3.1 MB)}} | Sheet window 3.1 MB > 2MB = humongous |
| JFR | {{objectClass = byte[], weight = 3.1 MB, stackTrace: ExcelExportService.java:58}} | toByteArray() tạo humongous 3.1 MB |
| JFR | {{weight = 3.1 MB, stackTrace: SXSSFWorkbook.write}} | wb.write() tạo humongous 3.1 MB |
| Code | {{new SXSSFWorkbook(100)}} line 22 | windowSize=100 → _randomAccessWindow ~3.1 MB |
| Code | {{wb.write(bos); return bos.toByteArray();}} line 57-58 | Tạo 2 humongous 155 MB mỗi lần |

### Cách sửa

**Fix 1: Giảm SXSSF windowSize (KHUYẾN DÙNG NHẤT cho SXSSF)**

~~~java
// TRƯỚC: windowSize=100 → _randomAccessWindow ~3.1 MB > 2MB = humongous
try (SXSSFWorkbook wb = new SXSSFWorkbook(100)) { ... }

// SAU: windowSize=10 → _randomAccessWindow ~300 KB < 2MB = KHÔNG humongous
try (SXSSFWorkbook wb = new SXSSFWorkbook(10)) { ... }
~~~

- **Cơ chế:** windowSize = số row giữ trong memory. Mỗi row ~30KB. windowSize=10 → 300KB < 2MB threshold.
- **Trade-off:** Row > windowSize bị spill ra disk (temp file). I/O tăng nhưng **loại bỏ hoàn toàn humongous sheet window**.
- **Kết quả:** 50 sheets × 0 humongous + 155 MB wb.write + 155 MB toByteArray = 2 humongous/lần (thay vì 52). Vẫn cần Fix 2 cho 2 humongous còn lại.

**Fix 2: Streaming write trực tiếp OutputStream (LOẠI BỎ ByteArrayOutputStream)**

~~~java
// TRƯỚC: Tạo 2 humongous 155 MB (wb.write -> bos, bos.toByteArray())
ByteArrayOutputStream bos = new ByteArrayOutputStream();
wb.write(bos);
return bos.toByteArray();

// SAU: Streaming trực tiếp HttpServletResponse output stream
public void exportMonthlyReport(LocalDate month, HttpServletResponse response) {
    response.setContentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    response.setHeader("Content-Disposition", "attachment; filename=report-" + month + ".xlsx");
    try (SXSSFWorkbook wb = new SXSSFWorkbook(10)) {  // windowSize=10
        // ... fill data ...
        wb.write(response.getOutputStream());  // KHÔNG ByteArrayOutputStream, KHÔNG toByteArray()
    }
}
~~~

- **Cơ chế:** wb.write(OutputStream) ghi trực tiếp, không buffer toàn bộ workbook trong memory.
- **Kết quả:** **0 humongous object** từ workbook output. Chỉ còn sheet window (đã fix bằng windowSize=10).
- **Lưu ý:** Phải đổi signature method từ {{byte[]}} return thành {{void}} + {{HttpServletResponse}}. Nếu cần return {{byte[]}} cho storage (S3), dùng {{PipedOutputStream}} + thread đọc ghi S3 streaming.

**Fix 3: Tăng G1 Region Size (WORKAROUND, không khuyên dùng làm fix chính)**

~~~bash
# Thay vì region 4MB mặc định, dùng 16MB
-XX:G1HeapRegionSize=16m
~~~

- **Cơ chế:** Region 16MB → humongous threshold = 8MB. byte[] 3.1 MB < 8MB → **không humongous**, đi qua Eden bình thường, Young GC dọn được.
- **Trade-off:** Region lớn → **heap waste** (internal fragmentation). Mixed GC scan region lớn → pause tăng. Heap 12GB / 16MB = 768 regions (ít hơn 3072 regions của 4MB). Humongous object lớn hơn mới thành humongous.
- **Khuyên dùng:** Chỉ khi KHÔNG thể sửa code (vendor library). Ưu tiên Fix 1 + 2.

### Phòng ngừa

- **Code review:** Cấm {{new SXSSFWorkbook()}} không có windowSize nhỏ (≤ 10). Cấm {{ByteArrayOutputStream}} cho file > 10MB.
- **Static analysis:** SpotBugs custom rule detect {{SXSSFWorkbook}} constructor không có argument hoặc windowSize > 50. Detect {{ByteArrayOutputStream.toByteArray()}} trên object lớn.
- **Test:** Load test export 50k rows, measure GC log: không được có Full GC, Young GC pause < 100ms, humongous count = 0.
- **Monitoring:** Alert khi GC log có {{humongous}} count > 100 hoặc {{Pause Full (Allocation Failure)}}. Theo dõi {{jvm_g1_humongous_count}} (Micrometer/JMX).
- **JFR:** Profile allocation định kỳ, tìm {{byte[]}} weight lớn tại {{SXSSFWorkbook}}, {{ByteArrayOutputStream}}.

### Trả lời mẫu khi phỏng vấn

"App xuất Excel dùng POI SXSSFWorkbook(windowSize=100). Mỗi sheet tạo byte[] _randomAccessWindow ~3.1 MB. G1 region 4MB → humongous threshold 2MB. 3.1 MB > 2MB → humongous object. Humongous alloc trực tiếp Old Gen, Young GC không dọn. Mỗi export 50 sheets = 155 MB sheet windows + 155 MB wb.write + 155 MB toByteArray = 465 MB humongous. 48 lần/tháng tích lũy 7.4 GB Old Gen. Old Gen > IHOP 45% (5.4GB) → trigger concurrent marking nhưng Mixed GC không kịp → Full GC 8.2s. Fix: (1) windowSize=10 → sheet window 300KB không humongous, (2) Streaming wb.write(response.getOutputStream()) loại bỏ ByteArrayOutputStream 2 humongous 155 MB, (3) Tăng region size 16MB (workaround, trade-off heap waste). Không leak vì Full GC dọn hết Old Gen 9.8GB -> 2.1GB."

> Senior tip: **Humongous object là "kẻ giết latency thầm lặng" cho batch export/file processing**. Quy tắc: **Object > 50% region size = humongous → Old Gen trực tiếp → Young GC bỏ qua → Mixed GC/Full GC mới dọn**. Với POI SXSSF, **windowSize=100 là default nguy hiểm** (3MB humongous). Luôn set windowSize ≤ 10. **Không bao giờ dùng ByteArrayOutputStream cho file lớn** - streaming OutputStream là chuẩn. Region size 4MB mặc định heap 4-32GB; nếu phải tăng region size để tránh humongous, nghĩa là thiết kế allocation sai. JFR 30s + GC log đủ bắt humongous pattern.`,
    rubric: [
      'Giải thích đúng cơ chế: G1 region 4MB → humongous threshold 2MB. SXSSFWorkbook windowSize=100 tạo byte[] 3.1 MB > 2MB = humongous. Humongous alloc Old Gen trực tiếp, Young GC không dọn.',
      'Dẫn chứng GC log: Region Size 4M, Full GC (Allocation Failure) 8.2s, Old Gen 9.8GB->2.1GB. MAT: 2,450 humongous byte[] 7.85 GB. JFR: byte[] 3.1 MB tại SXSSFWorkbook.write & toByteArray.',
      'Chứng minh không leak: Full GC dọn Old Gen 9.8GB -> 2.1GB (chỉ workbook hiện tại). Leak thì Old Gen sau Full GC vẫn cao.',
      'So sánh 3 fix đúng trade-off: (1) windowSize=10 loại bỏ sheet window humongous (disk spill trade-off), (2) Streaming OutputStream loại bỏ 2 humongous 155 MB (best), (3) Region size 16MB workaround (heap waste, mixed GC chậm). Khuyên Fix 1+2.',
      'Giải thích đúng IHOP: Old Gen > 45% (5.4GB) trigger concurrent marking, nhưng marking chưa xong → Mixed GC không chạy → Full GC.'
    ],
    tags: ['g1gc', 'humongous', 'region-size', 'sxssfworkbook', 'poi', 'excel-export', 'bytearrayoutputstream', 'streaming', 'full-gc', 'allocation-failure', 'ihop', 'concurrent-marking', 'mixed-gc', 'jdk17', 'heap-dump', 'mat', 'jfr']
  },
  {
    id: 'lab-gc-033',
    category: 'gc',
    title: 'Metaspace OOM Groovy script reload: ClassLoader leak, 1.2M classes loaded, Metaspace 4GB',
    level: 'senior',
    scenario: `**Bối cảnh (background):** Hệ thống **rules engine** cho ngân hàng (Spring Boot 3.1, JDK 17.0.9, G1GC) cho phép business config quy tắc nghiệp vụ bằng **Groovy script** reload runtime không restart. JVM: {{-Xms8g -Xmx8g -XX:MaxMetaspaceSize=1g -XX:+UseG1GC -Xlog:gc+metaspace=debug:file=/logs/gc.log:time,uptime,level,tags}}. Container: 8 vCPU, memory limit 10Gi. MaxMetaspaceSize = 1GB.

**Thuật ngữ giải thích:**
- **Metaspace:** Vùng memory native (off-heap) lưu **class metadata** (Klass, method, field, annotation, constant pool). JDK 8+ thay thế PermGen. Mặc định **unlimited** (bị giới hạn bởi OS/container memory limit). Nên set {{-XX:MaxMetaspaceSize}} để tránh OOM native.
- **Groovy script compilation:** Mỗi lần reload script, Groovy **compile script thành class mới** (extends {{groovy.lang.Script}}). Class name dạng {{Script1}}, {{Script2}}... hoặc hash-based. ClassLoader nạp class này vào Metaspace.
- **ClassLoader leak:** Nếu **ClassLoader cũ không bị GC** (vẫn bị reference bởi thread, cache, static field), các class nó load **không bao giờ bị unload** → Metaspace tăng vô hạn. Class chỉ bị unload khi **ClassLoader bị GC** (không còn reference nào).

**Triệu chứng:** Sau 3 tháng chạy, app bị **{{java.lang.OutOfMemoryError: Metaspace}}**. Restart app tạm fix 2-3 ngày. GC log: Metaspace used tăng dần từ 200 MB → **1.2 GB** (vượt MaxMetaspaceSize 1GB → GC cưỡng lại nhưng không dọn được → OOM). {{jcmd 1 VM.class_histogram}} thấy **1,200,000+ class** loaded (bình thường ~15,000). Top class: {{Script1}}, {{Script2}}, ..., {{Script1200000}} (mỗi reload tạo class mới). Heap dump: **{{GroovyClassLoader}}** instance giữ reference bởi **static cache** trong {{RuleEngineService}}.

**Dữ liệu thu thập:** GC log (metaspace debug), jcmd class histogram, heap dump (Eclipse MAT), code Groovy reload, JFR class loading.`,
    artifacts: [
      {
        name: 'gc-metaspace-oom.log',
        lang: 'text',
        content: `[2026-11-20T14:30:00.100+0700][0.100s][info][gc,init] Version: 17.0.9+7 (release)
[2026-11-20T14:30:00.100+0700][0.100s][info][gc,init] CPUs: 8 total, 8 available
[2026-11-20T14:30:00.100+0700][0.100s][info][gc,init] Memory: 10240M
[2026-11-20T14:30:00.100+0700][0.100s][info][gc,init] Heap Min Capacity: 8192M
[2026-11-20T14:30:00.100+0700][0.100s][info][gc,init] Heap Initial Capacity: 8192M
[2026-11-20T14:30:00.100+0700][0.100s][info][gc,init] Heap Max Capacity: 8192M
[2026-11-20T14:30:00.100+0700][0.100s][info][gc,init] MaxMetaspaceSize: 1024M
[2026-11-20T14:30:00.100+0700][0.100s][info][gc,init] CompressedClassSpaceSize: 1073741824
[2026-11-20T14:30:00.100+0700][0.100s][info][gc,metaspace] Metaspace       used 204800K, capacity 204800K, committed 204800K, reserved 1048576K
[2026-11-20T14:30:00.100+0700][0.100s][info][gc,metaspace]   class space    used 25600K, capacity 25600K, committed 25600K, reserved 1073741824K
... (Metaspace tăng dần mỗi reload) ...
[2026-11-20T14:30:00.100+0700][86400.100s][info][gc,metaspace] Metaspace       used 980000K, capacity 980000K, committed 980000K, reserved 1048576K
[2026-11-20T14:30:00.100+0700][86400.100s][info][gc,metaspace]   class space    used 850000K, capacity 850000K, committed 850000K, reserved 1073741824K
[2026-11-20T14:30:00.100+0700][86400.200s][info][gc,metaspace] Metaspace       used 1020000K, capacity 1020000K, committed 1020000K, reserved 1048576K
[2026-11-20T14:30:00.100+0700][86400.200s][info][gc,metaspace]   class space    used 880000K, capacity 880000K, committed 880000K, reserved 1073741824K
[2026-11-20T14:30:00.100+0700][86400.300s][error][gc,metaspace] Metaspace OOM: Failed to allocate 1024KB for class metadata
[2026-11-20T14:30:00.100+0700][86400.300s][error][gc] java.lang.OutOfMemoryError: Metaspace
`
      },
      {
        name: 'jcmd-class-histogram.txt',
        lang: 'text',
        content: `$ jcmd 1 VM.class_histogram | head -30

  num     #instances         #bytes  class name (module)
-------------------------------------------------------
   1:       1200000       48000000  Script1 (groovy)
   2:       1199999       47999960  Script2 (groovy)
   3:       1199998       47999920  Script3 (groovy)
   4:       1199997       47999880  Script4 (groovy)
   ... (1,200,000 entries Script1 -> Script1200000) ...
   1200001:            50         2000  java.lang.String
   1200002:            10          400  java.util.ArrayList
   1200003:            5           200  groovy.lang.GroovyClassLoader
   1200004:            1           80  com.bank.rules.RuleEngineService

# Total loaded classes: ~1,200,000 (bình thường app Spring Boot ~15,000-20,000)
# Mỗi Script class ~40 bytes metadata. 1.2M × 40B = 48 MB class metadata chỉ cho Script.
# Nhưng Metaspace 1GB → overhead Klass, method, constant pool, annotation ~800-900 bytes/class.
# 1.2M × 900B ≈ 1.08 GB Metaspace. Khớp GC log: Metaspace used 1,020,000K.`
      },
      {
        name: 'heap-dump-metaspace.hprof (MAT dominator)',
        lang: 'text',
        content: `========== MAT Dominator Tree (GC Root: System class) ==========
java.lang.ClassLoader@0x7f8a... (system) 
  -> com.bank.rules.RuleEngineService.class (static field: scriptCache)
      -> java.util.concurrent.ConcurrentHashMap@0x7f8b... (scriptCache)
          -> [key="rule-001", value=GroovyClassLoader@0x7f8c...]
              -> GroovyClassLoader@0x7f8c... (parent = RuleEngineService.class.getClassLoader())
                  -> loadedClasses: Vector<Class<?>> (1,200,000 entries)
                      -> Script1, Script2, ..., Script1200000
          -> [key="rule-002", value=GroovyClassLoader@0x7f8d...]
              -> GroovyClassLoader@0x7f8d...
                  -> loadedClasses: Vector<Class<?>> (1,200,000 entries)
          ... (50 rule keys, mỗi key 1 GroovyClassLoader instance) ...

========== GC Root Path to Script1 ==========
Script1 (class)
  <- loadedClasses (Vector) in GroovyClassLoader@0x7f8c...
  <- GroovyClassLoader@0x7f8c... (instance)
  <- value in ConcurrentHashMap@0x7f8b... (scriptCache)
  <- scriptCache (static field) in RuleEngineService.class
  <- RuleEngineService.class (system class loader)

**Kết luận:** RuleEngineService.scriptCache (static ConcurrentHashMap) giữ reference đến 50 GroovyClassLoader instance.
Mỗi GroovyClassLoader giữ Vector<Class<?>> loadedClasses chứa 1.2M Script class.
ClassLoader KHÔNG bao giờ bị GC → Script class KHÔNG bao giờ bị unload → Metaspace leak.`
      },
      {
        name: 'RuleEngineService.java',
        lang: 'text',
        content: `package com.bank.rules;

import groovy.lang.GroovyClassLoader;
import groovy.lang.Script;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class RuleEngineService {

    // VẤN ĐỀ 1: Static cache giữ GroovyClassLoader FOREVER
    private static final Map<String, GroovyClassLoader> scriptCache = new ConcurrentHashMap<>();

    // VẤN ĐỀ 2: Mỗi reload tạo GroovyClassLoader MỚI, không close cái cũ
    public void reloadRule(String ruleId, String groovyScript) {
        // Tạo ClassLoader mới mỗi lần reload
        GroovyClassLoader loader = new GroovyClassLoader(getClass().getClassLoader());
        
        // Compile script -> tạo class mới (Script1, Script2...)
        Class<? extends Script> scriptClass = loader.parseClass(groovyScript, ruleId + ".groovy");
        
        // VẤN ĐỀ 3: Put vào cache, ClassLoader cũ không bị remove -> leak
        scriptCache.put(ruleId, loader);  // ClassLoader cũ mất reference nhưng value mới overwrite
        // NHƯNG: ClassLoader cũ vẫn còn trong memory vì loadedClasses Vector giữ reference đến class
        // VÀ: scriptCache là static -> ClassLoader không bao giờ GC
    }

    public Object executeRule(String ruleId, Map<String, Object> context) {
        GroovyClassLoader loader = scriptCache.get(ruleId);
        if (loader == null) {
            throw new IllegalStateException("Rule not loaded: " + ruleId);
        }
        try {
            Script script = loader.loadClass(loader.getClassCache().keySet().iterator().next().getName()).newInstance();
            script.setBinding(new groovy.lang.Binding(context));
            return script.run();
        } catch (Exception e) {
            throw new RuntimeException("Rule execution failed", e);
        }
    }
}`
      },
      {
        name: 'jfr-class-loading.txt',
        lang: 'text',
        content: `$ jcmd 1 JFR.start duration=60s filename=/tmp/classload.jfr
$ jfr print --events jdk.ClassLoad /tmp/classload.jfr | tail -20

jdk.ClassLoad {
  startTime = 14:30:15.123
  className = Script1200001
  classLoader = groovy.lang.GroovyClassLoader@0x7f8c...
  isHidden = false
}

jdk.ClassLoad {
  startTime = 14:30:15.124
  className = Script1200002
  classLoader = groovy.lang.GroovyClassLoader@0x7f8c...
  isHidden = false
}

# Mỗi reload rule tạo ~1000 class mới (script + inner class + closure class)
# 50 rules × 1000 class = 50,000 class/reload cycle
# Reload 24 lần/ngày = 1.2M class/ngày → 1.2M class trong GC log khớp
# ClassLoader không close → class không unload`
      }
    ],
    questions: [
      'Tại sao Metaspace tăng vô hạn dù đã set -XX:MaxMetaspaceSize=1g? Giải thích cơ chế class unloading: class chỉ unload khi ClassLoader bị GC.',
      'Từ heap dump: static field {{scriptCache}} trong {{RuleEngineService}} giữ reference đến 50 {{GroovyClassLoader}}. Giải thích tại sao đây là ClassLoader leak pattern điển hình.',
      'Mỗi reload tạo {{new GroovyClassLoader()}} và put vào cache. ClassLoader cũ bị overwrite trong map nhưng KHÔNG bị GC. Tại sao? (Hint: classCache trong {{GroovyClassLoader}}).',
      'So sánh 3 giải pháp: (1) Dùng **single shared {{GroovyClassLoader}}** + {{clearCache()}}, (2) **{{GroovyClassLoader.close()}}** (JDK 9+) trước khi tạo mới, (3) **Script caching** compile một lần, reload chỉ swap binding. Ưu/nhược điểm.',
      'Tại sao {{jcmd VM.class_histogram}} thấy 1.2M class {{Script1}}...{{Script1200000}} nhưng heap chỉ có ~50 {{GroovyClassLoader}} instance? Giải thích quan hệ 1 ClassLoader → nhiều class.'
    ],
    hints: [
      'MaxMetaspaceSize=1g chỉ giới hạn capacity, không tự dọn class. Class chỉ unload khi ClassLoader GC. Leak ClassLoader → class không unload → Metaspace đầy → OOM dù đã set limit.',
      'scriptCache static ConcurrentHashMap -> GC Root (System class loader) -> RuleEngineService.class -> static scriptCache -> 50 GroovyClassLoader. ClassLoader không bao giờ GC vì static field giữ reference mạnh.',
      'GroovyClassLoader giữ reference MẠNH đến TẤT CẢ class đã compile trong \`classCache\` (cache nội bộ của loader). Overwrite value trong map KHÔNG xóa classCache của loader cũ. Nếu loader cũ vẫn có reference khác (thread, stack) thì class không unload; nếu không còn reference, loader có thể bị GC và class của nó unload — không deterministic.',
      'Giải pháp 1: Single shared GroovyClassLoader. loader.clearCache() xóa classCache → class có thể unload khi loader bị GC. Nhưng clearCache() xóa TẤT CẢ rule, không selective. Giải pháp 2: loader.close() (JDK 9+) -> close ClassLoader, xóa cache, giải phóng tài nguyên loader; KHÔNG unload class ngay (class chỉ unload khi loader bị GC). Tạo mới cho rule đó. Giải pháp 3: Compile script 1 lần -> cache Class object. Reload chỉ tạo Binding mới -> không compile lại -> không tạo class mới. Best performance.',
      '1 {{GroovyClassLoader.loadClass()}} tạo 1 class (Script) + inner class + closure class ≈ 10-20 class/script. 50 rules × 20 class × 1200 reload = 1.2M class. 50 {{GroovyClassLoader}} instance, mỗi instance giữ ~24,000 class trong classCache.'
    ],
    answer: `**Tóm tắt:** Rules engine cho phép reload Groovy script runtime. Code tạo {{new GroovyClassLoader()}} mỗi lần reload, put vào {{static ConcurrentHashMap scriptCache}}. **ClassLoader leak**: static cache giữ reference mạnh đến 50 {{GroovyClassLoader}}. Mỗi {{GroovyClassLoader}} giữ class đã compile trong {{classCache}} (cache nội bộ) → giữ reference đến **tất cả class đã load** (1.2M class Script1...Script1200000). Class chỉ unload khi ClassLoader GC → ClassLoader không GC → **class không bao giờ unload** → Metaspace tăng 1.2M class × ~900 bytes = **~1.08 GB** → vượt {{MaxMetaspaceSize=1g}} → **OOM Metaspace**. Fix: (1) Single shared {{GroovyClassLoader}} + {{clearCache()}} selective, (2) {{loader.close()}} (JDK 9+) trước tạo mới, (3) **Compile-once cache Class object** (khuyên dùng) - reload chỉ swap Binding.

### Nguyên nhân gốc

1. **Metaspace & Class Unloading cơ chế:** Metaspace lưu class metadata. Class **chỉ bị unload khi ClassLoader nạp nó bị GC** (không còn reference nào). {{MaxMetaspaceSize}} chỉ giới hạn dung lượng, **KHÔNG trigger unload**. Nếu ClassLoader leak → class leak → Metaspace OOM.
2. **Static cache ClassLoader leak:** {{RuleEngineService.scriptCache}} là {{static ConcurrentHashMap}}. Static field = **GC Root** (System class loader → RuleEngineService.class → {{static scriptCache}}). 50 {{GroovyClassLoader}} instance trong map → **không bao giờ GC**.
3. **ClassLoader giữ class đã compile:** Mỗi {{GroovyClassLoader}} giữ các class đã compile trong {{classCache}} (cache nội bộ). Class chỉ unload khi ClassLoader bị GC (không còn reference nào). Overwrite map value **KHÔNG xóa classCache** của loader cũ; nếu loader cũ vẫn được reference khác thì class không unload, nếu không còn reference thì loader có thể bị GC và class của nó unload — không deterministic.
4. **Class explosion:** Mỗi reload rule: {{loader.parseClass()}} → tạo class Script{N} + inner class + closure class ≈ **20 class/script**. 50 rules × 20 class × reload 24 lần/ngày × 1000 ngày = **2.4M class** (log thấy 1.2M do GC dọn một phần). Mỗi class ~900 bytes Metaspace (Klass, method, constant pool, annotation) → 1.2M × 900B = **1.08 GB**.
5. **MaxMetaspaceSize không giúp:** Set 1GB chỉ làm OOM sớm hơn. GC log: Metaspace used 1,020,000K → capacity 1,020,000K → reserved 1,048,576K (1GB). Full GC cưỡng lại (Metaspace GC) nhưng **không dọn được class** vì ClassLoader còn sống → OOM.

### Dẫn chứng (trích dòng cụ thể trong artifact)

| Artifact | Dòng trích | Ý nghĩa |
|---|---|---|
| GC log | {{MaxMetaspaceSize: 1024M}} | Limit Metaspace 1GB |
| GC log | {{Metaspace used 1020000K... Metaspace OOM}} | Metaspace đầy 1.02GB → OOM |
| jcmd histogram | {{1200000 Script1...Script1200000}} | 1.2M Script class loaded |
| MAT Dominator | {{scriptCache (static field) in RuleEngineService.class}} | Static cache là GC Root giữ ClassLoader |
| MAT Dominator | {{loadedClasses: Vector<Class<?>> (1,200,000 entries)}} | GroovyClassLoader giữ reference tất cả class || Code | {{private static final Map<String, GroovyClassLoader> scriptCache}} line 12 | Static cache leak pattern |
| Code | {{GroovyClassLoader loader = new GroovyClassLoader(...)}} line 20 | Tạo ClassLoader mới mỗi reload |
| Code | {{scriptCache.put(ruleId, loader)}} line 26 | Overwrite không close ClassLoader cũ |
| JFR | {{className = Script1200001, classLoader = GroovyClassLoader}} | Mỗi reload tạo class mới, cùng ClassLoader |

### Cách sửa

**Fix 1: Single Shared GroovyClassLoader + clearCache() (CẢI TIẾN NHANH)**

~~~java
// TRƯỚC: Mỗi reload tạo ClassLoader mới, static cache leak
private static final Map<String, GroovyClassLoader> scriptCache = new ConcurrentHashMap<>();
public void reloadRule(String ruleId, String groovyScript) {
    GroovyClassLoader loader = new GroovyClassLoader(getClass().getClassLoader());
    Class<? extends Script> scriptClass = loader.parseClass(groovyScript, ruleId + ".groovy");
    scriptCache.put(ruleId, loader);  // LEAK
}

// SAU: Single shared loader, clearCache() selective
private static final GroovyClassLoader SHARED_LOADER = new GroovyClassLoader(getClass().getClassLoader());
private static final Map<String, Class<? extends Script>> scriptClassCache = new ConcurrentHashMap<>();

public void reloadRule(String ruleId, String groovyScript) {
    // Compile script -> cache Class object (KHÔNG tạo ClassLoader mới)
    Class<? extends Script> scriptClass = SHARED_LOADER.parseClass(groovyScript, ruleId + ".groovy");
    scriptClassCache.put(ruleId, scriptClass);
    
    // Selective clear: chỉ xóa class của rule này khỏi loadedClasses Vector
    // Cần reflection hoặc GroovyClassLoader.clearCache() (xóa TẤT CẢ)
    // Workaround: tạo child ClassLoader cho rule, close() khi reload
}
~~~

- **Vấn đề:** {{GroovyClassLoader.clearCache()}} xóa **TẤT CẢ** classCache. Không selective per rule.
- **Workaround:** Tạo **child ClassLoader per rule**, {{close()}} khi reload rule đó.

**Fix 2: Child ClassLoader per Rule + close() (JDK 11+, KHUYẾN DÙNG)**

~~~java
// ClassLoader có close() từ JDK 9+ (xóa cache, giải phóng tài nguyên loader; KHÔNG unload class)
private static final Map<String, GroovyClassLoader> ruleLoaders = new ConcurrentHashMap<>();

public void reloadRule(String ruleId, String groovyScript) {
    // Close ClassLoader cũ (xóa cache, giải phóng tài nguyên) trước khi tạo mới
    GroovyClassLoader oldLoader = ruleLoaders.remove(ruleId);
    if (oldLoader != null) {
        try {
            oldLoader.close();  // JDK 9+: close() xóa cache loader, giải phóng tài nguyên; class chỉ unload khi loader bị GC
        } catch (Exception e) {
            log.warn("Failed to close old loader for {}", ruleId, e);
        }
    }
    
    // Tạo child ClassLoader mới (parent = shared parent)
    GroovyClassLoader newLoader = new GroovyClassLoader(getClass().getClassLoader());
    newLoader.parseClass(groovyScript, ruleId + ".groovy");
    ruleLoaders.put(ruleId, newLoader);
}

public Object executeRule(String ruleId, Map<String, Object> context) {
    GroovyClassLoader loader = ruleLoaders.get(ruleId);
    if (loader == null) throw new IllegalStateException("Rule not loaded: " + ruleId);
    // loadClass từ loader này...
}
~~~

- **Cơ chế:** Java **không có API unload class trực tiếp** từ loader đang sống: {{ClassLoader.close()}} (JDK 9+) chỉ giải phóng tài nguyên của loader và xóa cache; class chỉ có thể unload khi **ClassLoader bị GC** (không còn reference nào), không deterministic.
- **Yêu cầu:** JDK 11+ (Groovy 3.0+ hỗ trợ). ClassLoader phải không còn reference khác (thread, stack).
- **Lưu ý:** {{executeRule}} không được giữ reference đến {{Script}} instance lâu (thread-local OK, static field KHÔNG).

**Fix 3: Compile-Once Cache Class Object (BEST PERFORMANCE, KHUYẾN DÙNG PRODUCTION)**

~~~java
// Compile script 1 lần -> cache Class object. Reload chỉ swap Binding.
private static final Map<String, Class<? extends Script>> scriptClassCache = new ConcurrentHashMap<>();
private static final GroovyClassLoader SHARED_LOADER = new GroovyClassLoader(getClass().getClassLoader());

public void reloadRule(String ruleId, String groovyScript) {
    // Chỉ compile LẦN ĐẦU hoặc khi script THAY ĐỔI (check hash)
    String scriptHash = hash(groovyScript);
    String cacheKey = ruleId + ":" + scriptHash;
    
    scriptClassCache.computeIfAbsent(cacheKey, k -> {
        return SHARED_LOADER.parseClass(groovyScript, ruleId + ".groovy");
    });
    
    // Cleanup: xóa cache key cũ của rule này (giữ tối đa 2 version)
    scriptClassCache.entrySet().removeIf(e -> e.getKey().startsWith(ruleId + ":") && !e.getKey().equals(cacheKey));
}

// Execute: TẠO SCRIPT INSTANCE MỚI TỪ CLASS ĐÃ CACHE (KHÔNG COMPILE LẠI)
public Object executeRule(String ruleId, Map<String, Object> context) {
    // Lấy class mới nhất của rule này
    Class<? extends Script> scriptClass = scriptClassCache.entrySet().stream()
        .filter(e -> e.getKey().startsWith(ruleId + ":"))
        .max(Map.Entry.comparingByKey())  // hash mới nhất
        .map(Map.Entry::getValue)
        .orElseThrow(() -> new IllegalStateException("Rule not loaded: " + ruleId));
    
    try {
        Script script = scriptClass.getDeclaredConstructor().newInstance();  // Instance mới, KHÔNG COMPILE
        script.setBinding(new groovy.lang.Binding(context));
        return script.run();
    } catch (Exception e) {
        throw new RuntimeException("Rule execution failed", e);
    }
}
~~~

- **Cơ chế:** **Compile 1 lần** → cache {{Class<? extends Script>>}}. {{executeRule}} tạo **instance mới** từ class đã cache ({{newInstance()}}). **Không tạo class mới** → **0 Metaspace allocation** sau compile đầu.
- **Reload:** Chỉ compile khi script **thật sự thay đổi** (check hash). Giữ 2 version cho rollback.
- **Metaspace:** Chỉ tăng khi có script MỚI. 50 rules × 20 class = 1,000 class cố định. **Không leak**.
- **Performance:** {{newInstance()}} ~100x nhanh hơn {{parseClass()}}. Phù hợp high-throughput rules engine.

### Phòng ngừa

- **Code review:** Cấm {{new GroovyClassLoader()}}/{{new ScriptEngine()}} trong loop/reload. Cấm static cache {{ClassLoader}}/{{ScriptEngine}}.
- **Static analysis:** SpotBugs rule detect {{GroovyClassLoader}}/{{ScriptEngine}} instance stored in static field. Custom rule detect {{parseClass}}/{{compile}} trong method không cache kết quả.
- **Test:** Load test reload 1000 lần, verify Metaspace stable (không tăng), {{jcmd VM.class_histogram}} class count không tăng.
- **Monitoring:** Alert Metaspace used > 80% MaxMetaspaceSize. Theo dõi {{jvm_classes_loaded}} vs {{jvm_classes_unloaded}} (Micrometer). Leak = loaded tăng, unloaded = 0.
- **JFR:** Profile {{jdk.ClassLoad}}/{{jdk.ClassUnload}}. Leak = ClassLoad nhiều, ClassUnload = 0.
- **Groovy config:** {{groovy.use.classvalue=true}} (Groovy 3+) dùng ClassValue cache thay vì Vector, hỗ trợ unload tốt hơn.

### Trả lời mẫu khi phỏng vấn

"Rules engine reload Groovy script runtime. Code tạo {{new GroovyClassLoader()}} mỗi reload, put vào {{static ConcurrentHashMap}}. **ClassLoader leak**: static field = GC Root giữ 50 {{GroovyClassLoader}}. Mỗi {{GroovyClassLoader}} giữ class trong {{classCache}} → reference mạnh đến 1.2M class Script1...Script1200000. Class chỉ unload khi ClassLoader GC → ClassLoader không GC → class không unload → Metaspace 1.2M × 900B = 1.08GB > MaxMetaspaceSize 1GB → OOM. Fix: (1) Single shared loader + {{clearCache()}} (không selective), (2) Child ClassLoader per rule + {{close()}} (JDK 9+, KHÔNG unload class ngay), (3) **Compile-once cache Class object** (best) - reload chỉ tạo instance mới từ class cached, 0 Metaspace allocation. Monitoring: {{jvm_classes_loaded}} tăng, {{jvm_classes_unloaded}} = 0 = leak."

> Senior tip: **Dynamic script/class loading = Metaspace leak risk cao nhất**. Quy tắc vàng: **Class chỉ unload khi ClassLoader GC**. Không bao giờ cache ClassLoader/ScriptEngine trong static field. **Compile-once, instance-per-execution** là pattern chuẩn cho rules engine. Groovy {{parseClass()}} tốn Metaspace, {{newInstance()}} không. {{ClassLoader.close()}} (JDK 9+) chỉ giải phóng tài nguyên loader, **KHÔNG unload class**; class chỉ unload khi loader bị GC. JFR {{jdk.ClassLoad}}/{{jdk.ClassUnload}} 1 phút đủ bắt leak: Load nhiều, Unload = 0. Container memory limit + MaxMetaspaceSize KHÔNG tự fix leak - chỉ làm OOM sớm hơn.`,
    rubric: [
      'Giải thích đúng cơ chế: Class chỉ unload khi ClassLoader GC. Static cache giữ ClassLoader → ClassLoader không GC → 1.2M Script class không unload → Metaspace 1.08GB > MaxMetaspaceSize 1GB → OOM.',
      'Dẫn chứng: GC log MaxMetaspaceSize 1GB, Metaspace used 1020000K OOM. jcmd histogram 1.2M Script class. MAT: static scriptCache -> 50 GroovyClassLoader -> loadedClasses Vector 1.2M entries. Code: static cache, new GroovyClassLoader mỗi reload, put không close.',
      'Giải thích đúng loadedClasses Vector: GroovyClassLoader giữ reference mạnh tất cả class đã load. Overwrite map không clear Vector cũ → ClassLoader cũ vẫn reachable → class không unload.',
      'So sánh 3 fix đúng trade-off: (1) Shared loader + clearCache() xóa tất cả (không selective), (2) Child loader + close() (JDK 11+, selective unload), (3) Compile-once cache Class (best performance, 0 Metaspace sau compile). Khuyên Fix 3.',
      'Giải thích 1.2M class nhưng chỉ 50 ClassLoader: Mỗi reload tạo ~20 class/script (Script + inner + closure). 50 rules × 20 class × 1200 reload = 1.2M class. Mỗi ClassLoader loadedClasses chứa ~24,000 class.'
    ],
    tags: ['metaspace', 'classloader-leak', 'groovy', 'dynamic-class-loading', 'script-reload', 'groovycloader', 'closeable', 'class-unloading', 'maxmetaspacesize', 'oom', 'static-cache', 'loadedclasses', 'vector', 'jdk11', 'jfr', 'jcmd', 'class-histogram', 'mat', 'compile-once', 'rules-engine']
  },
  {
    id: 'lab-gc-034',
    category: 'gc',
    title: 'Batch đóng sổ cuối ngày: OutOfMemoryError GC overhead limit exceeded, JVM bỏ 98% thời gian vào GC',
    level: 'senior',
    scenario: `**Bối cảnh (background):** Hệ thống **ngân hàng bán lẻ** (Spring Boot 3.3, JDK 17.0.11, G1) chạy batch đóng sổ cuối ngày mỗi tối 22:00. Job đọc **5 triệu giao dịch** từ PostgreSQL, tính toán số dư, ghi vào bảng tổng hợp. JVM: {{-Xms4g -Xmx4g -XX:+UseG1GC -Xlog:gc*:file=/logs/gc.log:time,uptime,level,tags}}. Container: 4 vCPU, memory limit 6Gi.

**Thuật ngữ giải thích:**
- **GC overhead limit exceeded:** Bảo vệ của JVM: nếu trong 5 lần GC liên tiếp JVM bỏ hơn **98% thời gian** vào GC nhưng chỉ thu hồi dưới **2% heap**, JVM ném {{java.lang.OutOfMemoryError: GC overhead limit exceeded}}. Mục đích ngăn app kẹt trong vòng lặp GC vô tận khi heap quá nhỏ so với allocation rate.
- **Allocation rate:** Tốc độ tạo object mới (MB/giây). allocation rate cao → Eden đầy nhanh → young GC dày đặc.
- **Young GC / Allocation Failure:** G1 dừng ứng dụng để dọn Eden, copy object sống sang Survivor/Old. Nếu hầu hết object là rác, sau mỗi GC heap chỉ giảm vài MB.

**Triệu chứng:** Lúc 22:00–22:15, batch chạy cực chậm, CPU 100% nhưng tiến độ batch không tăng. Log in ra {{java.lang.OutOfMemoryError: GC overhead limit exceeded}}. Heap used ổn định ~3.8 GB / 4 GB, không tăng theo thời gian, không phải memory leak thông thường. Dev on-call nghi leak và đề xuất tăng heap lên 8 GB.

**Dữ liệu thu thập:** GC log JDK 17, heap histogram, JFR allocation profiling.`,
    artifacts: [
      {
        name: 'gc-batch-eod.log',
        lang: 'text',
        content: `[2026-10-25T22:00:00.012+0700][0.012s][info][gc,init] Version: 17.0.11+7 (release)
[2026-10-25T22:00:00.012+0700][0.012s][info][gc,init] CPUs: 4 total, 4 available
[2026-10-25T22:00:00.012+0700][0.012s][info][gc,init] Memory: 6144M
[2026-10-25T22:00:00.012+0700][0.012s][info][gc,init] Heap Region Size: 1M
[2026-10-25T22:00:00.012+0700][0.012s][info][gc,init] Heap Min Capacity: 4G
[2026-10-25T22:00:00.012+0700][0.012s][info][gc,init] Heap Max Capacity: 4G
[2026-10-25T22:00:00.100+0700][0.100s][info][gc] GC(0) Pause Young (Allocation Failure) 3200M->3180M(4096M) 0.085ms
[2026-10-25T22:00:00.200+0700][0.200s][info][gc] GC(1) Pause Young (Allocation Failure) 3200M->3182M(4096M) 0.092ms
[2026-10-25T22:00:00.300+0700][0.300s][info][gc] GC(2) Pause Young (Allocation Failure) 3200M->3179M(4096M) 0.088ms
[2026-10-25T22:00:00.400+0700][0.400s][info][gc] GC(3) Pause Young (Allocation Failure) 3200M->3181M(4096M) 0.090ms
[2026-10-25T22:00:00.500+0700][0.500s][info][gc] GC(4) Pause Young (Allocation Failure) 3200M->3180M(4096M) 0.087ms
[2026-10-25T22:00:10.100+0700][10.100s][info][gc] GC(145) Pause Young (Allocation Failure) 3200M->3178M(4096M) 0.105ms
[2026-10-25T22:00:10.200+0700][10.200s][info][gc] GC(146) Pause Young (Allocation Failure) 3200M->3180M(4096M) 0.102ms
[2026-10-25T22:00:10.300+0700][10.300s][error][gc] java.lang.OutOfMemoryError: GC overhead limit exceeded
[2026-10-25T22:00:10.300+0700][10.300s][error][gc]  GC overhead limit exceeded: spent 98% time in GC, recovered 1.2% heap`
      },
      {
        name: 'jmap-histo-2205.txt',
        lang: 'text',
        content: `$ kubectl exec batch-job-5d9f8c-x2k1 -- jmap -histo 1 | head -15
 num     #instances         #bytes  class name (module)
-------------------------------------------------------
   1:       2500000      200000000  [C (java.base@17.0.11)
   2:       2500000      100000000  java.lang.String (java.base@17.0.11)
   3:       1200000       48000000  vn.batch.model.Transaction (java.base@17.0.11)
   4:        800000       32000000  java.math.BigDecimal (java.base@17.0.11)
Total       7080000      428000000`
      },
      {
        name: 'BatchReconciliationJob.java',
        lang: 'text',
        content: `package vn.batch.job;

import org.springframework.batch.item.ItemReader;
import org.springframework.stereotype.Component;
import vn.batch.model.Transaction;
import java.util.List;

@Component
public class BatchReconciliationJob {

    private final TransactionRepository repo;

    public void run() {
        List<Transaction> txns = repo.findAllUnreconciled();  // 5 triệu dòng, đệm TẤT CẢ vào heap
        for (Transaction tx : txns) {
            // tạo tạm String, BigDecimal, char[] cho mỗi giao dịch
            String key = tx.getAccountId() + "|" + tx.getDate();
            BigDecimal amount = tx.getAmount().multiply(tx.getRate());
            // ghi DB ...
        }
    }`
      },
      {
        name: 'jfr-allocation-top.txt',
        lang: 'text',
        content: `JFR Allocation by class (top 5, 22:00-22:10):
1. char[]: 2400 MB, 2.5M instances, thread batch-main-1
2. java.lang.String: 1200 MB, 2.5M instances
3. java.math.BigDecimal: 600 MB, 1.2M instances
4. [C: 200 MB
5. vn.batch.model.Transaction: 150 MB

Allocation rate: 42 GB/phut
Young GC: mỗi 100 ms, pause 80-100 ms, GC CPU 98%`
      }
    ],
    questions: [
      'Tại sao JVM ném OutOfMemoryError: GC overhead limit exceeded dù heap 4 GB chưa đầy? Giải thích tiêu chí 98% / 2%.',
      'Từ GC log và JFR, chứng minh object tạm nào, từ đâu, kích thước bao nhiêu.',
      'Tăng heap lên 8 GB có fix gốc không? Giải thích tại sao hay không.',
      'Sửa ngắn hạn và dài hạn. Streaming, batch nhỏ hơn, hay tăng heap?'
    ],
    hints: [
      'GC log: Young GC mỗi 100 ms, mỗi lần 3200M->3180M (chỉ thu hồi ~20 MB trong 4 GB), pause 80-100 ms, GC CPU 98%. Heap không giảm đáng kể sau mỗi GC.',
      'Tiêu chí GC overhead limit exceeded: 5 GC liên tiếp, >98% thời gian GC, <2% heap thu hồi. Ở đây 98% thời gian GC, chỉ thu hồi ~0.6% heap (20MB/3200MB).',
      'JFR: char[] và String là top allocation từ batch-main-1, do phép cộng chuỗi tạo key và tạo BigDecimal cho mỗi giao dịch.',
      'Tăng heap 8 GB: Eden lớn hơn, young GC ít lần hơn, nhưng mỗi lần GC dài hơn, allocation rate vẫn 42 GB/phút. Cuối cùng cũng gặp cùng vấn đề nếu không giảm allocation rate.'
    ],
    answer: `**Tóm tắt:** Batch đọc 5 triệu giao dịch vào List<Transaction> trong heap, mỗi giao dịch tạo tạm String, BigDecimal, char[] cho phép tính toán. Allocation rate 42 GB/phút làm Eden đầy mỗi 100 ms, young GC mỗi 100 ms nhưng chỉ thu hồi ~20 MB (0.6% heap) vì hầu hết object vừa tạo đã là rác. JVM bỏ 98% CPU vào GC, recover <2% heap qua 5 GC liên tiếp → ném {{OutOfMemoryError: GC overhead limit exceeded}}. Heap used ổn định ~3.8 GB chứng minh **không phải memory leak**, mà là heap quá nhỏ so với allocation rate. Sửa gốc: **streaming/xử lý theo batch nhỏ**, không đệm toàn bộ 5 triệu dòng vào heap; giảm allocation rate (trừ String concat, dùng StringBuilder hoặc primitive); giữ heap 4 GB.

### Nguyên nhân gốc

1. **GC overhead limit exceeded là gì:** JVM theo dõi khoảng 5 lần GC gần nhất. Nếu >98% thời gian bỏ vào GC và thu hồi <2% heap, JVM ném {{OutOfMemoryError: GC overhead limit exceeded}}. Đây là bảo vệ ngăn app kẹt vòng lặp GC, không phải do heap thực sự hết.
2. **Heap 4 GB quá nhỏ với allocation rate 42 GB/phút:** Batch đệm 5 triệu giao dịch (List<Transaction>) vào heap, mỗi giao dịch tạo tạm String key, BigDecimal amount, char[] cho phép tính. Eden 4 GB đầy mỗi 100 ms → young GC dày đặc.
3. **Young GC thu hồi rất ít:** Mỗi GC 3200M->3180M, chỉ thu hồi ~20 MB (0.6% heap). Vì object vừa tạo trong vòng lặp đã là rác (không được giữ lâu), young GC dọn Eden nhưng heap không giảm đáng kể.
4. **GC CPU 98%:** Thread batch-main-1 bỏ hầu hết thời gian chờ GC, không tiến độ business logic. Batch chạy chậm, CPU 100% nhưng không hoàn thành.
5. **Không phải memory leak:** Heap used ổn định ~3.8 GB, không tăng theo thời gian. Vấn đề là allocation rate quá cao so với heap, không phải object sống lún.

### Dẫn chứng (trích dòng cụ thể trong artifact)

| Artifact | Dòng trích | Ý nghĩa |
|---|---|---|
| GC log | {{GC(0) Pause Young (Allocation Failure) 3200M->3180M(4096M) 0.085ms}} | Young GC mỗi 100 ms, chỉ thu hồi 20 MB |
| GC log | {{java.lang.OutOfMemoryError: GC overhead limit exceeded}} | JVM kích hoạt bảo vệ GC overhead |
| GC log | {{spent 98% time in GC, recovered 1.2% heap}} | Đủ tiêu chí 98% / 2% |
| JFR | {{char[]: 2400 MB, 2.5M instances, thread batch-main-1}} | Object tạm lớn nhất từ batch |
| JFR | {{Allocation rate: 42 GB/phut}} | Cao gấp 10x heap 4 GB mỗi phút |
| jmap | {{java.lang.String 2.5M instances, 100 MB}} | Phép cộng chuỗi tạo key cho mỗi giao dịch |
| Code | {{List<Transaction> txns = repo.findAllUnreconciled()}} | Đệm 5 triệu dòng vào heap, gốc rễ allocation cao |

### Cách sửa

**Ngắn hạn (giảm rủi ro ngay, hôm nay):**
1. **Xử lý theo batch nhỏ (chunked):** Thay vì findAllUnreconciled() đệm 5 triệu dòng, dùng {{Pageable}} hoặc cursor-based pagination, xử lý 10.000–50.000 dòng/lần, flush và clear persistence context giữa các chunk.
2. **Tăng heap tạm thời 6 GB:** Giảm tần suất young GC, cho batch chạy xong hôm nay. KHÔNG phải fix gốc.

**Dài hạn (sửa gốc, loại bỏ GC overhead):**
1. **Streaming / xử lý từng dòng:** Dùng {{Stream}} hoặc {{ResultSet}} xử lý từng giao dịch, không đệm toàn bộ vào List. Hoặc dùng Spring Batch {{Chunk-oriented processing}} với itemReader/itemWriter.
2. **Giảm allocation rate:** Thay phép cộng chuỗi {{accountId + "|" + date}} bằng {{StringBuilder}}; tránh tạo {{BigDecimal}} tạm nếu có thể dùng primitive/long; tái sử dụng object.
3. **Giữ heap 4 GB:** Với allocation rate giảm, heap 4 GB đủ. Không cần tăngHeap.

### Phòng ngừa

- Alert khi {{OutOfMemoryError: GC overhead limit exceeded}} xuất hiện trong log ứng dụng.
- Theo dõi allocation rate và GC CPU qua JFR / Prometheus ({{jvm_gc_memory_allocated_bytes_total}}).
- Alert khi young GC tần suất > 10 lần/giây hoặc GC CPU > 50% liên tục.
- Code review: cấm đệm toàn bộ kết quả query lớn vào List mà không có phân trang/streaming.
- Trước khi chạy batch lớn, Ước tính allocation rate và heap cần; heap nên lớn gấp 3–5 lần working set của batch.

> Senior tip: GC overhead limit exceeded là "kẻ giết silencio" của batch: heap không đầy, không phải leak, nhưng JVM bỏ cả đời vào GC nhưng recover gần không gì. Luôn nhìn **allocation rate** so với heap, không chỉ nhìn heap used. Nếu allocation rate > 5–10× heap/phút, young GC sẽ làm chậm app. Fix bằng giảm allocation rate (streaming, batch nhỏ, tránh object tạm), không phải tăng heap vô tận.`,
    rubric: [
      'Giải thích đúng tiêu chí GC overhead limit exceeded: >98% thời gian GC và <2% heap thu hồi qua 5 GC liên tiếp, không phải heap hết.',
      'Dẫn chứng GC log: young GC mỗi 100 ms, 3200M->3180M chỉ thu hồi 20 MB (0.6%), GC CPU 98%, OOM GC overhead.',
      'Chứng minh không heap leak: heap ổn định ~3.8 GB, không tăng theo thời gian, vấn đề là allocation rate 42 GB/phút cao quá.',
      'Chỉ đúng gốc rễ: batch đệm 5 triệu giao dịch vào List, tạo tạm String/BigDecimal/char[] cho mỗi dòng, heap 4 GB quá nhỏ.',
      'Đề xuất có chiều sâu: xử lý chunked/streaming, giảm allocation rate (StringBuilder, ít BigDecimal), giữ heap 4 GB; giải thích tăng heap 8 GB không phải fix gốc.'
    ],
    tags: ['gc', 'gc-overhead-limit-exceeded', 'oom', 'allocation-rate', 'young-gc', 'batch', 'streaming', 'jdk17', 'jfr', 'jmap', 'g1gc']
  },
  {
    id: 'lab-gc-035',
    category: 'gc',
    title: 'G1 concurrent marking kịp thay allocation rate: Concurrent Mode Failure gây Full GC 3 giây mỗi 15 phút',
    level: 'senior',
    scenario: `**Bối cảnh (background):** Hệ thống **thanh toán điện tử** (Spring Boot 3.3, JDK 17.0.11, G1) xử lý 8000 TPS, heap 16 GB. JVM: {{-Xms16g -Xmx16g -XX:+UseG1GC -XX:InitiatingHeapOccupancyPercent=45 -Xlog:gc*:file=/logs/gc.log:time,uptime,level,tags}}. Container: 8 vCPU, memory limit 24Gi.

**Thuật ngữ giải thích:**
- **Concurrent marking:** G1 đánh dấu object sống trong Old Gen trong các luồng nền (concurrent), không dừng ứng dụng. Để đánh dấu kịp, G1 bắt đầu marking sớm khi old gen đạt {{InitiatingHeapOccupancyPercent}} (mặc định 45%).
- **Concurrent Mode Failure:** Nếu allocation rate quá cao, old gen đầy trước khi concurrent marking hoàn tất, G1 không thể tiếp tục đánh dấu nền → kích hoạt **Full GC** (stop-the-world) để dọn dẹp. Đây là "concurrent mode failure".
- **Full GC do concurrent mode failure:** Pause stop-the-world, quét toàn bộ heap 16 GB → pause 2–4 giây, làm p99 API vọt lên.

**Triệu chứng:** Từ 10:00–10:30 ngày 25/10/2026 (giờ cao điểm thanh toán), p99 API thanh toán tăng từ 150 ms lên **3–4 giây**. GC log ghi nhận **Pause Full** dày đặc mỗi 15–20 phút, mỗi lần 2.5–3.5 giây. Heap used ổn định ~10 GB / 16 GB, không tăng theo thời gian, không có OOM. Dev on-call nghi memory leak và đề xuất tăng heap lên 24 GB.

**Dữ liệu thu thập:** GC log JDK 17, JFR GC pause analysis, heap histogram.`,
    artifacts: [
      {
        name: 'gc-payment-16g.log',
        lang: 'text',
        content: `[2026-10-25T10:00:00.012+0700][0.012s][info][gc,init] Version: 17.0.11+7 (release)
[2026-10-25T10:00:00.012+0700][0.012s][info][gc,init] CPUs: 8 total, 8 available
[2026-10-25T10:00:00.012+0700][0.012s][info][gc,init] Memory: 24576M
[2026-10-25T10:00:00.012+0700][0.012s][info][gc,init] Heap Region Size: 2M
[2026-10-25T10:00:00.012+0700][0.012s][info][gc,init] Heap Min Capacity: 16G
[2026-10-25T10:00:00.012+0700][0.012s][info][gc,init] Heap Max Capacity: 16G
[2026-10-25T10:00:00.012+0700][0.012s][info][gc,init] Initiating Heap Occupancy Percent: 45
[2026-10-25T10:02:15.100+0700][135.100s][info][gc] GC(0) Pause Young (Allocation Failure) 2100M->900M(16384M) 0.150ms
[2026-10-25T10:05:30.200+0700][330.200s][info][gc] GC(1) Pause Young (Normal) 2200M->950M(16384M) 0.140ms
[2026-10-25T10:05:30.250+0700][330.250s][info][gc] GC(1) Concurrent marking started
[2026-10-25T10:18:45.400+0700][1125.400s][info][gc] GC(2) Pause Young (Allocation Failure) 3100M->1400M(16384M) 0.160ms
[2026-10-25T10:18:45.450+0700][1125.450s][info][gc] GC(2) Concurrent marking interrupted by allocation failure
[2026-10-25T10:18:45.500+0700][1125.500s][info][gc] GC(3) Pause Full (Concurrent Mode Failure) 3100M->1350M(16384M) 2850.210ms
[2026-10-25T10:35:10.100+0700][2110.100s][info][gc] GC(4) Pause Young (Normal) 3000M->1300M(16384M) 0.155ms
[2026-10-25T10:35:10.150+0700][2110.150s][info][gc] GC(4) Concurrent marking started
[2026-10-25T10:48:20.300+0700][2900.300s][info][gc] GC(5) Pause Young (Allocation Failure) 3200M->1450M(16384M) 0.170ms
[2026-10-25T10:48:20.350+0700][2900.350s][info][gc] GC(5) Concurrent marking interrupted by allocation failure
[2026-10-25T10:48:20.400+0700][2900.400s][info][gc] GC(6) Pause Full (Concurrent Mode Failure) 3200M->1400M(16384M) 3100.450ms`
      },
      {
        name: 'jfr-gc-pause.txt',
        lang: 'text',
        content: `JFR GC pause analysis (10:00-10:50):
- GC(3) Pause Full (Concurrent Mode Failure): 2850 ms, stop-the-world, toàn bộ thread ứng dụng dừng
- GC(6) Pause Full (Concurrent Mode Failure): 3100 ms, stop-the-world
- Young GC: 140-170 ms, không gây vấn đề
- Concurrent marking: bắt đầu lúc 10:05, 10:35, nhưng bị gián đoạn bởi allocation failure trước khi hoàn tất
- Old gen trước Full GC: ~3100 MB, sau: ~1350 MB (chỉ thu hồi 1750 MB trong 16 GB)

Allocation rate: 5 GB/phut (8000 TPS, mỗi request tạm object 600 KB)
Working set old gen: ~10 GB / 16 GB`
      },
      {
        name: 'PaymentService.java',
        lang: 'text',
        content: `package vn.payment.service;

import org.springframework.stereotype.Service;
import vn.payment.model.Transaction;
import java.util.List;

@Service
public class PaymentService {

    private final TransactionRepository repo;

    public void process(List<Transaction> batch) {
        // Mỗi request tạo tạm object lớn (600 KB) cho fraud check, enrichment
        for (Transaction tx : batch) {
            FraudResult result = fraudChecker.check(tx);  // tạo object tạm 600 KB
            enrich(tx, result);
            repo.save(tx);
        }
    }`
      }
    ],
    questions: [
      'Nguyên nhân gốc của Pause Full 3 giây mỗi 15 phút là gì? Đây có phải memory leak không?',
      'Tại sao concurrent marking bị gián đoạn? Giải thích liên quan đến InitiatingHeapOccupancyPercent và allocation rate.',
      'Tăng heap lên 24 GB có fix gốc không? Giải thích.',
      'Sửa ngắn hạn và dài hạn. Giảm InitiatingHeapOccupancyPercent, giảm allocation rate, hay tăng heap?'
    ],
    hints: [
      'GC log: GC(1) Concurrent marking started lúc 10:05, nhưng GC(2) Concurrent marking interrupted by allocation failure lúc 10:18, rồi GC(3) Pause Full (Concurrent Mode Failure) 2850 ms. Lặp lại ở 10:35 và 10:48.',
      'InitiatingHeapOccupancyPercent=45: old gen đạt 45% (7.2 GB/16 GB) G1 bắt đầu marking. Nhưng allocation rate 5 GB/phút cao quá, old gen đầy trước khi marking hoàn tất.',
      'Heap used ổn định ~10 GB, không tăng theo thời gian, không OOM → không phải memory leak. Vấn đề là marking không kịp allocation rate.',
      'Tăng heap 24 GB: old gen lớn hơn, marking có nhiều thời gian hơn, nhưng allocation rate vẫn 5 GB/phút. Cuối cùng cũng gặp cùng vấn đề nếu marking vẫn không kịp.'
    ],
    answer: `**Tóm tắt:** Hệ thống thanh toán 8000 TPS, heap 16 GB, G1 với InitiatingHeapOccupancyPercent=45. Old gen đạt 45% (~7.2 GB) G1 bắt đầu concurrent marking trong luồng nền. Nhưng allocation rate 5 GB/phút quá cao, old gen đầy trước khi marking hoàn tất → G1 gián đoạn marking và kích hoạt Full GC (Concurrent Mode Failure) stop-the-world 2.8–3.1 giây, làm p99 API vọt lên 3–4 giây. Heap used ổn định ~10 GB chứng minh **không phải memory leak**, mà là marking không kịp allocation rate. Sửa gốc: giảm {{InitiatingHeapOccupancyPercent}} (bắt đầu marking sớm hơn), giảm allocation rate (ít object tạm hơn), hoặc dùng ZGC. Không nên chỉ tăng heap.

### Nguyên nhân gốc

1. **Concurrent marking và InitiatingHeapOccupancyPercent:** G1 đánh dấu object sống trong old gen bằng các luồng nền (concurrent) để không dừng ứng dụng. Khi old gen đạt {{InitiatingHeapOccupancyPercent}} (mặc định 45%, ở đây 45% = 7.2 GB/16 GB), G1 bắt đầu marking. Marking cần thời gian tương đối với heap.
2. **Allocation rate vượt quá tốc độ marking:** Old gen tăng 5 GB/phút (8000 TPS × 600 KB object tạm/request). Marking chạy nền nhưng không kịp với tốc độ old gen tăng. Old gen đạt 100% trước khi marking hoàn tất.
3. **Concurrent Mode Failure → Full GC:** Khi old gen đầy trong khi marking chưa xong, G1 không thể tiếp tục marking nền → gián đoạn marking → kích hoạt **Full GC** stop-the-world. GC(3) {{Pause Full (Concurrent Mode Failure) ... 2850ms}}, GC(6) {{3100ms}}. Toàn bộ thread ứng dụng dừng 3 giây.
4. **Heap used ổn định ~10 GB:** Sau Full GC 3100M->1350M, heap về mức ổn định. Không tăng theo thời gian, không OOM → **không phải memory leak**.
5. **Tăng heap không phải fix gốc:** Tăng heap 24 GB làm old gen lớn hơn, marking có thời gian dài hơn, nhưng allocation rate vẫn 5 GB/phút. Cuối cùng marking vẫn không kịp, Full GC vẫn xảy ra (chỉ ít lần hơn, mỗi lần dài hơn).

### Dẫn chứng (trích dòng cụ thể trong artifact)

| Artifact | Dòng trích | Ý nghĩa |
|---|---|---|
| GC log | {{GC(1) Concurrent marking started}} (10:05) | G1 bắt đầu marking nền |
| GC log | {{GC(2) Concurrent marking interrupted by allocation failure}} (10:18) | Old gen đầy trước khi marking xong |
| GC log | {{GC(3) Pause Full (Concurrent Mode Failure) ... 2850.210ms}} | Full GC stop-the-world 2.85 giây |
| GC log | {{GC(4) Concurrent marking started}} (10:35), {{GC(5) ... interrupted}} (10:48) | Lặp lại chuỗi marking → Full GC |
| JFR | {{Pause Full (Concurrent Mode Failure): 3100 ms, stop-the-world}} | Xác nhận pause 3 giây dừng toàn bộ app |
| JFR | {{Allocation rate: 5 GB/phut}} | Cao gấp nhiều lần old gen, marking không kịp thay |
| Config | {{InitiatingHeapOccupancyPercent=45}} | G1 bắt đầu marking khi old gen 45%, có thể quá muộn |

### Cách sửa

**Ngắn hạn (giảm rủi ro ngay, hôm nay):**
1. **Giảm InitiatingHeapOccupancyPercent:** Giảm từ 45 xuống 30–35, giúp G1 bắt đầu marking sớm hơn, marking có nhiều thời gian hơn trước khi old gen đầy.
2. **Giới hạn TPS / bulkhead:** Giới hạn số request thanh toán xử lý đồng thời, giảm allocation rate tạm thời.

**Dài hạn (sửa gốc, loại bỏ Concurrent Mode Failure):**
1. **Giảm allocation rate:** Mỗi request tạo object tạm 600 KB (fraud check, enrichment). Tái sử dụng object, dùng primitive, tránh tạo object lớn tạm. Mục tiêu giảm allocation rate xuống dưới 1–2 GB/phút.
2. **Dùng ZGC (khuyên dùng nếu latency nhạy cảm):** ZGC không có concurrent marking giống G1, pause thường <1 ms, không phụ thuộc heap size.
   ~~~java
   -XX:+UseZGC -Xms16g -Xmx16g
   ~~~
3. **Tăng heap nếu workload thực sự cần 16 GB:** Chỉ tăng khi allocation rate đã giảm và heap thực sự không đủ working set.

### Phòng ngừa

- Alert khi GC log có {{Pause Full (Concurrent Mode Failure)}}.
- Theo dõi old gen occupancy và InitiatingHeapOccupancyPercent; nếu old gen đạt 80–90% trước khi marking hoàn tất, cần giảm ngưỡng hoặc giảm allocation rate.
- JFR theo dõi {{jdk.GCPause}} và {{jdk.ConcurrentMarking}}; marking bị gián đoạn lặp lại = dấu hiệu Concurrent Mode Failure.
- Code review: cấm tạo object lớn (>100 KB) tạm trong đường dẫn critical (request/response).
- Load test với TPS thực tế, quan sát GC log: marking phải hoàn tất trước khi old gen đầy.

> Senior tip: Concurrent Mode Failure là "kẻ giết silencio" của G1 trên heap lớn, allocation rate cao: marking nền không kịp, G1 buộc Full GC 3 giây, p99 vọt lên. Không phải memory leak, heap ổn định. Quy tắc: nếu old gen đầy trước khi marking hoàn tất, hãy **giảm InitiatingHeapOccupancyPercent** (bắt đầu sớm hơn) **hoặc giảm allocation rate**, không phải tăng heap. Nếu latency nhạy cảm và heap lớn, ZGC là lựa chọn bền vững hơn G1.`,
    rubric: [
      'Giải thích đúng cơ chế: G1 concurrent marking nền, InitiatingHeapOccupancyPercent=45 kích hoạt marking, allocation rate cao làm old gen đầy trước khi marking xong → Concurrent Mode Failure → Full GC.',
      'Dẫn chứng GC log: marking started 10:05, interrupted 10:18, Full GC 2850ms; lặp lại 10:35/10:48. JFR pause 3100 ms stop-the-world.',
      'Chứng minh không heap leak: heap ổn định ~10 GB, không tăng theo thời gian, không OOM; vấn đề là marking không kịp allocation rate 5 GB/phút.',
      'Chỉ đúng gốc rễ: G1 marking không kịp allocation rate (8000 TPS × 600 KB), InitiatingHeapOccupancyPercent 45 có thể quá muộn.',
      'Đề xuất có chiều sâu: giảm InitiatingHeapOccupancyPercent (30-35%), giảm allocation rate (ít object tạm), ZGC cho latency nhạy cảm; giải thích tăng heap 24 GB không phải fix gốc.'
    ],
    tags: ['gc', 'g1gc', 'concurrent-mode-failure', 'concurrent-marking', 'initiating-heap-occupancy', 'full-gc', 'allocation-rate', 'zgc', 'jdk17', 'jfr', 'payment', 'tps']
  },

{
  id: 'lab-gc-036',
  category: 'gc',
  title: 'Parallel GC pause 4.2 giây trên heap 24 GB',
  level: 'senior',
  scenario: `**Bối cảnh:** Dịch vụ **batch-report** (Spring Boot 3.2, JDK 17) chạy trên máy 32 GB RAM, heap {{-Xms24g -Xmx24g -XX:+UseParallelGC}}. GC log JDK 17 cho thấy Pause Full (Ergonomics) dài 4.2 giây lúc 03:17 ngày 22/10/2026, p99 API tăng lên 5 giây.`,
  artifacts: [
    { name: 'gc-parallel-24g.log', lang: 'text', content: `[2026-10-22T03:17:00.000+0700][info][gc] GC(12) Pause Full (Ergonomics) 22500M->18000M(24576M) 4210.5ms
[2026-10-22T03:17:04.210+0700][info][gc] GC(12) Pause Full (Ergonomics) end, heap 18000M, real 4.21s, user 31.8s, sys 0.9s` },
  ],
  questions: ['Vì sao Parallel GC pause dài trên heap lớn?', 'Bạn sửa thế nào?'],
  hints: ['Parallel GC là stop-the-world cho toàn heap.', 'Heap 24 GB càng lớn pause càng dài.'],
  answer: `**Tóm tắt:** Parallel GC pause dài vì stop-the-world quét toàn heap 24 GB. Chuyển sang G1/ZGC và đặt MaxGCPauseMillis.

### Cách sửa
- Dùng {{-XX:+UseG1GC -XX:MaxGCPauseMillis=200}} hoặc ZGC.
- Giảm heap hoặc chia nhỏ workload.

> Senior tip: Với heap lớn, ưu tiên GC có pause mục tiêu.`,
  rubric: ['Nhận ra Parallel GC stop-the-world.', 'Đề xuất G1/ZGC và MaxGCPauseMillis.', 'Giải thích pause tỷ lệ với heap.'],
  tags: ['parallel-gc', 'pause', 'g1', 'zgc']
},
{
  id: 'lab-gc-037',
  category: 'gc',
  title: 'Allocation rate cao do ghép chuỗi log',
  level: 'senior',
  scenario: `**Bối cảnh:** Service **order-api** (Spring Boot 3.2, JDK 17) có GC log Pause Young mỗi 300 ms. JFR allocation top là StringBuilder từ log.debug ghép chuỗi.`,
  artifacts: [
    { name: 'gc-young-300ms.log', lang: 'text', content: `[2026-10-22T10:00:00.000+0700][info][gc] GC(1) Pause Young (Normal) 120M->40M(512M) 12.3ms
[2026-10-22T10:00:00.300+0700][info][gc] GC(2) Pause Young (Normal) 118M->39M(512M) 11.9ms
[2026-10-22T10:00:00.600+0700][info][gc] GC(3) Pause Young (Normal) 119M->41M(512M) 12.1ms` },
    { name: 'jfr-allocation.txt', lang: 'text', content: `jdk.ObjectAllocationSample weight=45MB class=java.lang.StringBuilder
stackTrace: vn.order.OrderService.logOrder(OrderService.java:42)
weight detail: StringBuilder.toString called 45000 times
additional: OrderService builds message with + operator` },
  ],
  questions: ['Vì sao allocation rate cao?', 'Bạn sửa thế nào?'],
  hints: ['log.debug ghép chuỗi tạo StringBuilder mỗi lần.', 'Dùng placeholder {} và isDebugEnabled.'],
  answer: `**Tóm tắt:** log.debug với + tạo StringBuilder mỗi request dù debug tắt. Sửa dùng placeholder {} và kiểm tra isDebugEnabled.

### Cách sửa
- Dùng placeholder trong log (xem code block).
- Kiểm tra {{if (log.isDebugEnabled())}} trước khi build chuỗi lớn.

> Senior tip: Log là nguồn allocation lớn nhất trong nhiều service.`,
  rubric: ['Nhận ra string concat trong log.', 'Đề xuất placeholder và isDebugEnabled.', 'Liên hệ allocation rate.'],
  tags: ['logging', 'allocation', 'stringbuilder', 'gc']
},
)
