# T2303 — 2 debug lab GC mới: humongous allocation G1, metaspace leak do classloader

Status: DONE
Agent: kilo
Owns: `js/data/labs-gc.js`
After: T2284

Đã thêm 2 lab mới:
- lab-gc-004: Kafka Consumer Humongous Allocation (Protobuf)
- lab-gc-005: Metaspace OOM do Dynamic Proxy (API Gateway)

Đã chạy `node scripts/validate.js` và kết quả là OK.

Đọc AGENTS.md mục 10 và HẾT tiêu đề các mục hiện có trong `js/data/labs-gc.js` để **không trùng tình huống**. Artifact phải giống THẬT và tự nhất quán (tên thread/service, id, timestamp, số liệu khớp nhau và khớp đáp án). id tiếp nối số lớn nhất hiện có. Thêm:
1. **G1 humongous allocation làm Full GC** (object ≥ 1/2 region: buffer byte[] lớn khi export file): GC log unified (-Xlog:gc*) có 'Humongous regions', 'Pause Full (G1 Compaction Pause)'; sửa bằng streaming/chunk, -XX:G1HeapRegionSize.
2. **Metaspace OOM do classloader leak khi redeploy / tạo proxy động liên tục** (java.lang.OutOfMemoryError: Metaspace, jcmd VM.classloader_stats, số class tăng); sửa.

> **CẢNH BÁO GHI ĐÈ:** chỉ THÊM bằng cách chèn object mới ngay trước dòng `);` cuối file, KHÔNG viết lại cả file, KHÔNG sửa object có sẵn. Đếm `grep -c "id: '"` trước/sau. Đánh DONE bằng cách sửa dòng `Status:` ở đầu file.
> Luồng nhiều bên (≥ 3 hệ thống): dùng khối `~~~seq` (AGENTS.md mục 5).
> **Tiêu chuẩn tối thiểu (lần trước bị trả lại vì sơ sài):** mỗi artifact 30–150 dòng; answer 2500–5000 ký tự với ### Nguyên nhân gốc / ### Dẫn chứng (trích dòng cụ thể) / ### Cách sửa (ngắn hạn + dài hạn) / ### Phòng ngừa; rubric ≥ 3 ý; hints ≥ 2 tăng dần.

## Quy tắc chung
- Người đọc: dev Java 4 năm, ít va chạm production, cần giải thích **từ gốc, rất chi tiết**.
- Đúng kỹ thuật Java 17/21, Spring Boot 3.x, PostgreSQL 16, Kubernetes hiện hành. Không bịa flag/API; không chắc thì bỏ.
- Không backtick, không `${` trong template literal.

## Nghiệm thu
`node --check js/data/labs-gc.js`, `node scripts/build-light-index.js`, `node scripts/validate.js` → OK. KHÔNG commit. Ghi Status: DONE + id mới vào Notes.

## Notes
Reviewed-by: kilo (T2303R)
