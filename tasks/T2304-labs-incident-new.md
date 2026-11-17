# T2304 — 2 debug lab sự cố mới: Kafka consumer rebalance liên tục, pod OOMKilled do container memory limit

Status: DONE
Agent: kilo
Owns: `js/data/labs-incident.js`
After: T2277

Đọc AGENTS.md mục 10 và HẾT tiêu đề các mục hiện có trong `js/data/labs-incident.js` để **không trùng tình huống**. Artifact phải giống THẬT và tự nhất quán (tên thread/service, id, timestamp, số liệu khớp nhau và khớp đáp án). id tiếp nối số lớn nhất hiện có. Thêm:
1. **Kafka consumer group rebalance liên tục** vì xử lý batch lâu hơn max.poll.interval.ms (log 'consumer poll timeout has expired', lag tăng, consumer-group describe); sửa: giảm max.poll.records, tách xử lý, cooperative-sticky.
2. **Pod OOMKilled dù heap chưa đầy** (kubectl describe pod: Last State OOMKilled exit 137; -Xmx bằng limit, thiếu chỗ cho metaspace/thread stack/direct buffer; NMT summary); sửa: MaxRAMPercentage, limit hợp lý.

> **CẢNH BÁO GHI ĐÈ:** chỉ THÊM bằng cách chèn object mới ngay trước dòng `);` cuối file, KHÔNG viết lại cả file, KHÔNG sửa object có sẵn. Đếm `grep -c "id: '"` trước/sau. Đánh DONE bằng cách sửa dòng `Status:` ở đầu file.
> Luồng nhiều bên (≥ 3 hệ thống): dùng khối `~~~seq` (AGENTS.md mục 5).
> **Tiêu chuẩn tối thiểu (lần trước bị trả lại vì sơ sài):** mỗi artifact 30–150 dòng; answer 2500–5000 ký tự với ### Nguyên nhân gốc / ### Dẫn chứng (trích dòng cụ thể) / ### Cách sửa (ngắn hạn + dài hạn) / ### Phòng ngừa; rubric ≥ 3 ý; hints ≥ 2 tăng dần.

## Quy tắc chung
- Người đọc: dev Java 4 năm, ít va chạm production, cần giải thích **từ gốc, rất chi tiết**.
- Đúng kỹ thuật Java 17/21, Spring Boot 3.x, PostgreSQL 16, Kubernetes hiện hành. Không bịa flag/API; không chắc thì bỏ.
- Không backtick, không `${` trong template literal.

## Nghiệm thu
`node --check js/data/labs-incident.js`, `node scripts/build-light-index.js`, `node scripts/validate.js` → OK. KHÔNG commit. Ghi Status: DONE + id mới vào Notes.

## Notes
Added 2 new incident labs:
- lab-incident-041: Kafka consumer reconciliation (billing-reconciliation service) rebalance livelock due to PayPro API slowdown (2.2s per record, 500 records = 1100s batch > max.poll.interval.ms 300s)
- lab-incident-042: report-generator OOMKilled (exit 137) despite heap 1.2/3GB due to Xmx=limit, Metaspace 1.06GB (JasperReports Groovy compile), Direct/Other ~1.1GB (PDF export), thread stack 200 threads. Fixed with MaxRAMPercentage=60, MaxMetaspaceSize, MaxDirectMemorySize, streaming PDF.
Both labs: artifacts 30-150 lines, answers 3000-5000+ chars, rubric ≥3 items, hints ≥2.
`node --check js/data/labs-incident.js` ✓, `node scripts/build-light-index.js` ✓, `node scripts/validate.js` ✓ (only pre-existing errors in other files).
