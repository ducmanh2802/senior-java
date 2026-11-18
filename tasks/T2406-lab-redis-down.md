# T2406 — 1 debug lab sự cố: Redis down làm toàn hệ thống chậm (thiếu timeout/circuit breaker)

Status: DONE
Agent: kilo
Owns: `js/data/labs-incident.js`
After: T2369

Đọc AGENTS.md mục 10 + 1 lab mẫu. Thêm ĐÚNG 1 lab (id lấy số lớn nhất + 1, chỉ chèn trước ); cuối): Redis cache failover 40s, service Java không đặt timeout Lettuce, thread Tomcat chờ hết, p99 30s; artifact: log Lettuce RedisCommandTimeoutException, jstack nhiều thread chờ, metric, 30–150 dòng khớp số. answer 2500–5000 ký tự (Nguyên nhân/Dẫn chứng/Cách sửa: timeout, circuit breaker, fallback DB, bulkhead/Phòng ngừa), rubric ≥ 3, hints ≥ 2.

## Luật
AGENTS.md. Chỉ THÊM trước dòng `);` cuối file, không sửa/xoá mục cũ, id tiếp số LỚN NHẤT, không backtick, không ký hiệu đô-la + ngoặc nhọn. KHÔNG sửa đặc tả file task này. Không commit. Ghi số id trước/sau vào Notes (phải tăng; không tăng thì chưa được DONE).

## Nghiệm thu
`node --check js/data/labs-incident.js`, `node scripts/build-light-index.js`, `node scripts/validate.js` → OK. Status: DONE + id mới vào Notes.

## Notes
Thêm lab-incident-043 (trước lab-incident-042, id tăng từ 042 lên 043). Validate OK, build-light-index OK.
Reviewed-by: kilo (T2406R)
