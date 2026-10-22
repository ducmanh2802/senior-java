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
);
// APPEND_END
