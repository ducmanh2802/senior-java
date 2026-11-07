/*
 * English translation of js/data/labs-gc.js — task T1007. Format: js/core/i18n.js (content overlay).
 * ids: lab-gc-009
 */
App.i18n.content({
  'lab-gc-009': {
    title: 'Calling a partner API to fetch evidence images: humongous allocation triggers continuous G1 Full GC',
    scenario: `**Context (background):** Digital bank **TrustPay** has service **claim-service** (Spring Boot 3.2, JDK 17.0.10) that handles transaction dispute claims. When a customer opens a claim, the system calls the payment gateway partner's API to download evidence images (invoices, receipts), then forwards them to the frontend for display. The pod runs on Kubernetes: 2 vCPU, memory limit 4Gi. JVM starts with {{-Xms2g -Xmx2g -XX:+UseG1GC -XX:G1HeapRegionSize=2m -Xlog:gc*,gc+heap=debug:file=/logs/gc.log:time,uptime,level,tags}}.

**Terminology explained:**
- **Humongous object:** In G1 GC (Garbage First Garbage Collector — the default garbage collector in JDK 17), the heap is divided into small cells called *regions*, each with a fixed size (2 MB here). If an object has size >= 50% of the region size (>= 1 MB with 2 MB regions), G1 treats it as "humongous" and allocates it directly into the Old Generation (the area for long-lived objects) across consecutive regions, bypassing Eden (the area for new allocations). This is like placing a large cabinet straight into the warehouse instead of putting it on the workbench first.
- **Full GC:** Garbage collection of the entire heap, stopping the whole application (Stop-The-World). With G1, Full GC typically occurs when the heap is too full or heavily fragmented, and it is very slow.
- **jmap -histo:** A JDK command that prints a histogram (statistics table) of which classes occupy how many instances and how many bytes on the heap. You can run {{jmap -histo:live <pid>}} to count only live objects (but this will trigger a Full GC).
- **Heap:** The memory area where the JVM stores objects created with {{new}}. When the heap is full, GC must run to free objects that are no longer used.

**Symptoms:** At **10:15 on 22/10/2026**, the operations team received an alert that p99 latency of endpoint {{GET /api/claims/<claimId>/evidence}} increased from 800 ms to **12–18 seconds**. Prometheus recorded **7 Full GC (Pause Full)** events in 8 minutes, each 1.9–2.4 seconds. Pod CPU fluctuated 0.8–1.6/2 cores. No {{OutOfMemoryError}}, the pod was not OOMKilled. After 10:24, when the peak claim volume subsided, the system stabilized on its own. The dev proposed increasing the heap to 4 GB and increasing G1HeapRegionSize to 8 MB.

**Data collected:** GC log excerpt during the incident, heap histogram taken with {{jmap -histo}} immediately after one Full GC, JVM configuration, and source code of the method that downloads images.`,
    questions: [
      'Why does G1 report "G1 Humongous Allocation", then "To-space exhausted", then "Pause Full"? Use the GC log and G1HeapRegionSize=2M configuration to explain the mechanism and quote lines as evidence.',
      'What data proves this is NOT a memory leak? Why is increasing the heap to 4 GB or increasing G1HeapRegionSize firefighting, not a root-cause solution?',
      'How would you fix the code and operations to handle large images without causing humongous allocation? Provide short-term and long-term approaches.'
    ],
    hints: [
      'G1HeapRegionSize=2M means objects >= 1 MB are humongous. A 2–8 MB image will occupy how many consecutive regions? Look at Humongous regions increasing from 186 to 612 then 640 in the log.',
      'Compare Humongous regions after Pause Full (GC 419: 612->612, GC 422: 640->640) with after GC 441 (590->8). When are humongous objects reclaimed? What does that say about a leak?',
      'HttpResponse.BodyHandlers.ofByteArray() reads the entire body into the heap. Is there a BodyHandler that streams data to an OutputStream/stream instead of holding everything in a byte[]? Or can you use a presigned URL/redirect so the client downloads directly?'
    ],
    answer: `**Summary:** Each request to fetch an evidence image uses {{HttpResponse.BodyHandlers.ofByteArray()}}, reading the entire image (2–8 MB) into a {{byte[]}} on the heap. With {{G1HeapRegionSize=2M}}, every array >= 1 MB is a **humongous object** and occupies consecutive regions in the Old Gen. When many concurrent requests arrive (peak claim hour), hundreds of humongous regions are held simultaneously, the 2 GB heap has no free space for G1 to evacuate (move live objects) → {{To-space exhausted}} → {{Pause Full (G1 Compaction Pause)}} lasting ~2 seconds, repeating continuously. When load decreases, humongous objects are reclaimed immediately in a normal young GC ({{590->8}}), proving this is **not a leak**. The root-cause solution is to **not hold the entire image in the heap**: stream the response to the client or use a direct download URL.

### Mechanism: Humongous allocation in G1 (step by step)

**1. G1 divides the heap into regions:** The GC log shows {{Heap Region Size: 2M, Heap Max Capacity: 2G}} → the heap has 1024 regions, each 2 MB. These are the "cells" G1 uses to manage memory.

**2. Humongous threshold:** G1 treats objects >= 50% of the region size as humongous. With 2 MB regions, the threshold is **1 MB**. A {{byte[]}} containing a 2 MB, 4 MB, or 8 MB image all exceed the threshold.

**3. Humongous allocation differs from normal allocation:**
- Normal objects: allocated into Eden regions (the new area). When Eden fills up, G1 runs a young GC, moving live objects to Survivor/Old. This is the normal, fast mechanism.
- Humongous objects: G1 **bypasses Eden**, finds **consecutive, empty** regions in the Old Gen to place the object. A 4 MB image needs 2 consecutive regions; an 8 MB image needs 4 regions. (G1 may use "starts humongous" + "continues humongous" regions.)
- Each humongous allocation typically triggers an IHOP (Initiating Heap Occupancy Percent) threshold check → it may start a concurrent mark cycle. That is why we see {{Pause Young (Concurrent Start) (G1 Humongous Allocation)}}.

**4. Why do humongous objects cause Full GC?**
- A humongous region is only reclaimed when the **entire** humongous object inside is no longer referenced. On JDK 17, G1 has an *eager reclaim* mechanism for "dead" humongous objects of primitive array type (like {{byte[]}}) — they can be reclaimed immediately during a young GC. But if the humongous object is **still live** (held by a request reference), no GC can reclaim it.
- When many live humongous regions occupy most of the heap, G1 has no free regions to evacuate objects from Eden/Survivor during a young GC → {{To-space exhausted}} occurs. At that point G1 is forced to run {{Pause Full (G1 Compaction Pause)}}: it stops the entire application, scans the whole heap, and compacts regions. A Full GC on a 2 GB heap takes ~2 seconds — during that time the application processes no requests.
- Full GC in G1 (JDK 17) **does not move humongous objects** efficiently in all cases and struggles when fragmentation is heavy. Therefore, after a Full GC, {{Humongous regions}} may remain unchanged if the objects are still live.

### Evidence from artifacts

| Time / GC | Log line excerpt | Meaning |
|---|---|---|
| GC(414) | {{Pause Young (Concurrent Start) (G1 Humongous Allocation) 1212M->612M(2048M) 53.114ms}}, {{Humongous regions: 186->186}} | Humongous allocation begins. 186 regions × 2 MB = 372 MB humongous. Concurrent mark cycle starts. |
| GC(416) | {{G1 Humongous Allocation}}, {{Humongous regions: 186->412}} | Humongous increases sharply (+226 regions = +452 MB) as many concurrent requests download images. |
| GC(417) | {{Humongous regions: 412->538}} | Continues to increase. Heap after GC 1524M — nearly full. |
| GC(418) | {{To-space exhausted}}, {{Eden regions: 48->0(2)}}, {{Humongous regions: 538->612}} | G1 has no free regions to copy live objects from Eden. Eden shrinks to 0. Sign that the heap is "stuck" due to humongous objects. |
| GC(419) | {{Pause Full (G1 Compaction Pause) 1782M->1412M(2048M) 2098.114ms}}, {{Old regions: 411->96}}, {{Humongous regions: 612->612}} | Full GC stops the app for 2.1 seconds. Old regions decrease (normal compaction succeeds) but **humongous remains 612** — the image {{byte[]}} arrays are still referenced by in-flight HTTP requests, not dead. |
| GC(422) | {{Pause Full ... 2391.220ms}}, {{Humongous regions: 640->640}} | Second Full GC, humongous increases further (640 regions = 1280 MB, 62.5% of the 2 GB heap). The cycle repeats. |
| GC(441) | {{Pause Young (Normal) ... 1612M->224M(2048M) 19.884ms}}, {{Humongous regions: 590->8}} | **Proof of no leak:** when load decreases, requests complete and release references to {{byte[]}}. A normal young GC eagerly reclaimed humongous from 590 down to 8, heap returns to 224 MB. If it were a leak, humongous/heap after GC would trend upward over time and not decrease. |
| jmap-histo | Row 2: {{612 instances, 256,901,120 bytes}} for {{[B}} — average ~410 KB/instance | Consistent with evidence images of a few hundred KB to a few MB. Many humongous {{[B}} instances are live simultaneously. |
| JVM flags | {{G1HeapRegionSize=2097152 (2M), MaxHeapSize=2147483648 (2G)}} | Humongous threshold = 1 MB. 2 GB heap with 2 MB regions = 1024 total regions. |
| Code | {{HttpResponse.BodyHandlers.ofByteArray()}} and {{ResponseEntity<byte[]>}} | Reads the **entire** response body into a single {{byte[]}} on the heap, then holds it in the response entity until it is fully written to the HTTP response. With a 4 MB image, at least 4 MB humongous lives for the entire request lifetime. |

### Why the proposals "increase heap / increase G1HeapRegionSize" are not root-cause solutions

- **Increase heap to 4 GB:** Only delays when Full GC occurs. If concurrent request count increases (e.g., a large claim wave) or images are larger (8–12 MB), humongous objects will still fill the heap. Full GC on a 4 GB heap is even slower than on 2 GB. The pod limit of 4Gi is also insufficient for a 4 GB heap plus native memory/metaspace.
- **Increase G1HeapRegionSize to 8 MB or 16 MB:** The humongous threshold becomes 4 MB or 8 MB, so 2–3 MB images are no longer humongous. This is a *workaround* that can reduce incident frequency for small images, but 5–8 MB images remain humongous. Moreover, larger regions make young GC less flexible (fewer regions to split into Eden/Survivor). Changing this flag requires a JVM restart, and it does not address the root cause: **the application holds large data in the heap unnecessarily**.
- **Root cause:** The service only needs to forward the image from the partner to the client — it does not need to parse or transform it. Holding the entire image in the heap is wasteful and creates GC risk.

### Fix

**Short-term (fast deployment, reduce risk):**
1. **Concurrency limit (bulkhead):** Use a {{Semaphore}} or Resilience4j Bulkhead to limit concurrent evidence download requests (e.g., max 3–4 requests/pod). Return HTTP 429 (Too Many Requests) or 503 when exceeded, with {{Retry-After}}. This caps how many humongous {{byte[]}} arrays can be live simultaneously.
2. **Response size limit:** Check the {{Content-Length}} header before reading; reject or use an alternative handling path if it exceeds a threshold (e.g., > 5 MB).
3. **Increase G1HeapRegionSize** (e.g., 4M or 8M) as a temporary measure if most images are < 4 MB — measure again and plan a restart.

**Long-term (fix the design, eliminate humongous):**

1. **Streaming instead of buffering everything (if the service must proxy):** Use {{BodyHandlers.ofInputStream()}} or {{ofPublisher()}} and stream directly to {{HttpServletResponse.getOutputStream()}} with a small buffer (e.g., 8–32 KB). This avoids creating large {{byte[]}} arrays on the heap.
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
    // ofInputStream(): does not read everything into the heap; returns an InputStream to read in chunks
    HttpResponse<java.io.InputStream> resp = httpClient.send(request,
            HttpResponse.BodyHandlers.ofInputStream());
    servletResponse.setStatus(resp.statusCode());
    servletResponse.setContentType(MediaType.IMAGE_JPEG_VALUE);
    try (var in = resp.body(); var out = servletResponse.getOutputStream()) {
        in.transferTo(out);   // copy in small buffers, flat heap
    }
}
~~~
Note: once you have written status 200 and started streaming the body, if an error occurs midway you cannot change to a clean HTTP 500. Consider this against business requirements (compared to writing to a temp file then returning {{FileSystemResource}} for {{Content-Length}} and better error handling).

2. **Better: do not proxy binary data through claim-service.** Obtain a download URL (a presigned URL from the partner's object storage, or a short-lived token URL) and return it to the frontend so the browser/app downloads directly. Claim-service only handles metadata and authorization — the service's heap and bandwidth no longer depend on image size.

3. **Observability and prevention:**
- Alert on {{Pause Full (G1 Compaction Pause)}}: increase {{jvm_gc_pause_seconds_count}} with label {{cause}} containing "G1 Compaction" or {{action="end of major GC"}}.
- Alert when {{G1 Humongous Allocation}} appears frequently (count by cause in GC log/metric exporter).
- Track {{jvm_gc_live_data_size_bytes}} and humongous region ratio if metrics are available (or parse GC logs).
- Enable continuous JFR ({{-XX:StartFlightRecording=disk=true,maxage=2h,settings=profile}}) so that during incidents you have {{jdk.ObjectAllocationSample}} / {{jdk.G1HeapSummary}} data.
- Code review: forbid {{BodyHandlers.ofByteArray()}} and {{ResponseEntity<byte[]>}} for unbounded-size data; require streaming or externalized download.

> Senior tip: Humongous allocation is a "silent G1 killer" because the application may run fine in the first week, then collapse when traffic increases or payloads become slightly larger. A practical rule: **every byte[]/large array created from external data (upload, HTTP response, file read) must have a size limit or must be streamed**. When debugging GC logs, look for the chain: {{G1 Humongous Allocation}} → {{To-space exhausted}} → {{Pause Full}} and check {{Humongous regions}} before/after Full GC — if humongous does not decrease after Full GC but drops sharply in a later young GC, that means the humongous objects were still live because requests held them, not a leak and not a G1 bug.`,
    rubric: [
      'Correctly explains the humongous mechanism in G1: 2M region → 1M threshold, objects >= threshold are allocated directly into Old Gen on consecutive regions, bypassing Eden; humongous allocation can trigger Concurrent Start.',
      'Cites the incident chain from the GC log: G1 Humongous Allocation, Humongous regions increase (186→412→538→612→640), To-space exhausted, Pause Full ~2s but Humongous regions do not decrease (612->612, 640->640).',
      'Proves no leak: GC(441) Humongous regions 590->8 and heap 1612M->224M in a normal young GC when load decreases; distinguishes live humongous objects from a leak that trends upward over time.',
      'Identifies the exact code cause: HttpResponse.BodyHandlers.ofByteArray() + ResponseEntity<byte[]> hold the entire image in the heap; each request creates a humongous byte[].',
      'Proposes in-depth fixes: streaming (ofInputStream/transferTo) or presigned URL/redirect for direct client download; bulkhead concurrency limit; warns that G1HeapRegionSize/increasing heap are only workarounds; includes alerts for Full GC and humongous allocation.'
    ]
  }
});
