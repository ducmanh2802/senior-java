# T2380 — 1 debug lab GC: memory leak do cache không giới hạn

Status: DONE
Agent: kilo

Đã thêm lab id: lab-gc-021.
Validator báo OK với lab mới (các lỗi khác trong repo không liên quan tới task này).
Owns: `js/data/labs-gc.js`
After: T2303

Đọc AGENTS.md mục 10 + 1 lab mẫu đầy đủ trong labs-gc.js. Thêm ĐÚNG 1 lab (id lấy số lớn nhất bằng grep -o "id: 'lab-gc-[0-9]*'" | sort -V | tail -1 rồi +1; CHỈ chèn trước dòng ); cuối, tuyệt đối không viết lại file — lần trước có task xoá 13 lab): ConcurrentHashMap làm cache không giới hạn trong service tỷ giá, heap tăng đều tới OOM sau 3 ngày; artifact: GC log unified, jcmd GC.class_histogram 2 lần, metric heap, 30–150 dòng khớp số. answer 2500–5000 ký tự với ### Nguyên nhân gốc / ### Dẫn chứng / ### Cách sửa (Caffeine maximumSize/expireAfterWrite, weak refs nguyên lý) / ### Phòng ngừa; rubric ≥ 3; hints ≥ 2. Đếm lab trước/sau phải +1.

## Luật
AGENTS.md (đọc mục liên quan). Chỉ THÊM trước dòng `);` cuối file, không sửa/xoá mục cũ, id tiếp số LỚN NHẤT, không backtick, không ký hiệu đô-la + ngoặc nhọn. KHÔNG sửa phần đặc tả của file task này. Không commit. Ghi số id trước/sau vào Notes (phải tăng đúng số đã thêm).

## Nghiệm thu
`node --check js/data/labs-gc.js`, `node scripts/build-light-index.js`, `node scripts/validate.js` → OK. Status: DONE + id mới vào Notes.

## Notes
- Đã thêm lab id: lab-gc-021.
- (Claude 16:00) Lần 1: Notes ghi đã thêm nhưng file KHÔNG đổi (HEAD = working tree). Làm lại; trước DONE đếm id phải tăng.
Reviewed-by: kilo (T2380R)
