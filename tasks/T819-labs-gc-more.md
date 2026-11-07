# T819 — 2 debug lab GC: humongous allocation và metaspace leak

Status: DONE
Agent: kilo
Owns: `js/data/labs-gc.js`

Đọc AGENTS.md mục 10 (Debug lab) và HẾT các lab hiện có trong `js/data/labs-gc.js` (đang có 8 lab) để không trùng tình huống. Artifact phải giống THẬT và tự nhất quán (tên thread, lock id, timestamp, số liệu khớp nhau và khớp answer). id tiếp nối số lớn nhất. Thêm 2 lab level senior:
1. G1 full GC liên tục do **humongous allocation** (byte[] lớn khi export file / đọc response lớn), artifact: GC log JDK 17 unified logging có "Humongous", heap histogram (jmap -histo), cấu hình -Xmx, G1HeapRegionSize.
2. **Metaspace OutOfMemoryError** do classloader leak (tạo proxy/script engine/redeploy liên tục), artifact: log lỗi, jcmd VM.metaspace, số class loaded tăng dần theo thời gian.

> **CẢNH BÁO GHI ĐÈ:** file này có thể đang chứa nội dung chưa commit của task khác. **Chỉ THÊM** bằng cách chèn object mới ngay trước dòng `);` cuối file, KHÔNG viết lại cả file, KHÔNG xoá/sửa object có sẵn. Trước khi đánh DONE: đếm số id trước và sau (`grep -c "id: '"`), số sau = số trước + số mục bạn thêm. Id luôn dùng nháy đơn.
> Đánh DONE bằng cách **sửa dòng `Status:` ở đầu file** (không thêm dòng Status mới ở cuối).
> Sơ đồ luồng nhiều bên (≥ 3 hệ thống): dùng khối `~~~seq` (cú pháp trong AGENTS.md mục 5).

## Quy tắc chung (bắt buộc)
- Đọc AGENTS.md mục 4, 5, 6 và docs/PLAN-v4-deep.md. Người đọc: dev Java 4 năm, ít va chạm thực tế, cần giải thích **từ gốc, rất chi tiết**.
- **Chỉ THÊM** câu mới vào cuối mảng trong `js/data/labs-gc.js`; id tiếp nối số lớn nhất hiện có của topic. Không sửa câu cũ.
- TRƯỚC khi viết, đọc hết câu cùng topic (grep "topic: '<id>'") để **không trùng ý**. Góc gợi ý nào đã có thì chọn góc khác cùng mảng.
- Mỗi đáp án: `**Tóm tắt:**` → các mục ### (cơ chế bên trong, ví dụ code/số liệu, bảng trade-off, pitfall production) → `> Senior tip:`. answer 2500–5000 ký tự.
- Đúng kỹ thuật với Java 17/21, Spring Boot 3.x. Không bịa flag/API; không chắc thì bỏ.
- Không backtick, không `${` trong template literal. Không chạy file .js trực tiếp, luôn dùng `node`.
- `refs` tuỳ chọn, chỉ link chính thức chắc chắn tồn tại; có refs thì chạy `node scripts/check-links.mjs js/data/labs-gc.js`.

## Nghiệm thu
`node --check js/data/labs-gc.js`, `node scripts/build-light-index.js` rồi `node scripts/validate.js` → OK. KHÔNG commit. Ghi Status: DONE + id lab mới vào Notes.

## Notes
- Trước: 8 lab (`lab-gc-001`..`lab-gc-008`). Sau: 10 lab (thêm 2).
- Thêm `lab-gc-009` (senior, humongous allocation): service claim tải ảnh chứng từ qua HTTP dùng `HttpResponse.BodyHandlers.ofByteArray()` + `ResponseEntity<byte[]>`; G1 region 2M → byte[] ảnh (2–8 MB) là humongous; artifact: GC log JDK 17 unified logging (G1 Humongous Allocation, To-space exhausted, Pause Full G1 Compaction Pause ~2s, Humongous regions không giảm sau Full GC nhưng giảm 590→8 ở young GC khi tải giảm — chứng minh không leak), `jmap -histo` sau Full GC, JVM flags (`G1HeapRegionSize=2097152`, `-Xmx2g`), mã nguồn controller. Giải thích cơ chế humongous/eager reclaim, phân biệt leak vs humongous còn sống, sửa bằng streaming/ofInputStream hoặc presigned URL/redirect, bulkhead.
- Thêm `lab-gc-010` (senior, Metaspace OOM/classloader leak): premium-engine reload công thức Nashorn mỗi 10–15 phút, tạo ScriptEngine mới, cache CompiledScript → 284 `NashornScriptEngine$3` classloader, `jvm_classes_loaded` tăng +18300, `unloaded=0`, Metaspace chạm `MaxMetaspaceSize=192m`; GC Metadata GC Threshold/Full GC/Last Ditch Collection không giảm Metaspace; heap chỉ ~520 MB. Artifact: GC log metaspace, app log OOM stack (ScriptLoader.installClass → Nashorn compile → reloadFormulas:57), `jcmd VM.metaspace`, `jcmd VM.classloader_stats`, metric loaded/unloaded, mã nguồn. Sửa: quản lý lifecycle/swap thế hệ công thức, tránh giữ reference, cân nhắc thay Nashorn (deprecated JDK 11, removed JDK 15; JDK 17 không bundle mặc định) bằng GraalJS/rule engine phù hợp; alert classes unloaded vs loaded, Metaspace usage.
- Không dùng backtick/`${` trong template literal; artifact dùng `{}` bình thường. `node --check js/data/labs-gc.js` OK; `node scripts/build-light-index.js` OK; `node scripts/validate.js` chạy và pass `labs-gc.js` (lỗi còn lại trong repo là `quiz.js` multi-answer check từ công việc khác, không thuộc file sở hữu).
Reviewed-by: kilo (T819R)
