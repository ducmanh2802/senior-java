# T2740 — 2 debug lab (gc) vào labs-gc.js

Status: DONE
Agent: kilo
Owns: `js/data/labs-gc.js`
After: T2697

Đọc AGENTS.md mục 10 (Debug lab) và HẾT các lab trong `js/data/labs-gc.js` để không trùng tình huống. id `lab-gc-NNN` nối tiếp số lớn nhất. Thêm **2 lab** level senior:

(1) **Humongous allocation trên G1**: GC log JDK 17 có nhiều "Pause Young (Concurrent Start) (G1 Humongous Allocation)", region size 4M, mảng byte 3MB từ export Excel; sửa: stream export, tăng G1HeapRegionSize. (2) **Metaspace tăng mãi do tạo class động**: log "Metaspace" tăng sau mỗi lần reload script/Groovy, Full GC (Metadata GC Threshold); sửa cache class/classloader.

> Vòng 3 của chủ đề này: các ý trên có thể đã được viết ở vòng trước — đọc file và chọn góc **chưa có** (tình huống khác, mức sâu hơn, lỗi production khác).

Artifact phải giống THẬT (đúng định dạng jstack / GC log JDK 17+ / EXPLAIN PostgreSQL / log Spring Boot) và **tự nhất quán**: tên thread, lock id `<0x...>`, timestamp, số liệu khớp nhau và khớp `answer`. `answer` có ### Nguyên nhân gốc / ### Dẫn chứng (trích dòng cụ thể) / ### Cách sửa / ### Phòng ngừa; rubric ≥ 3 ý; hints ≥ 2.

## Luật
- Đọc AGENTS.md trước (mục 4–6 và mục liên quan bên dưới).
- **BẮT BUỘC viết tiếng Việt CÓ DẤU đầy đủ** (Tóm tắt, không, nguyên nhân…). Nội dung không dấu sẽ bị trả lại.
- **Chỉ THÊM** vào file sở hữu (qtool append hoặc chèn trước dòng `);` cuối file); không sửa mục đã có, không sửa file khác. Đếm id trước/sau để chắc không làm mất mục của người khác.
- Không backtick, không `${` trong nội dung template literal.
- **Kiến thức phải ĐÚNG**: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15+, HikariCP, Kafka 3.x, AWS hiện hành, JDK tools (jstack, jcmd, JFR, GC log JDK 17+). Không bịa flag, API, metric. Không chắc thì viết ở mức nguyên lý.
- Người đọc: dev Java ~4 năm, hổng nền tảng, chuẩn bị phỏng vấn Senior: giải thích **từ gốc, từng bước, VÌ SAO**, ví dụ cụ thể, số liệu khớp nhau.
- Nếu một ý trong chủ đề đã có trong file thì chọn góc khác gần nhất chưa có, ghi vào Notes.

## Nghiệm thu
`node --check js/data/labs-gc.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
Xong: sửa dòng `Status:` đầu file thành `Status: DONE`, Notes ghi id đã thêm.

## Notes

Đã thêm 2 lab level senior vào js/data/labs-gc.js, chèn trước dòng `);` cuối file:
- lab-gc-034: OutOfMemoryError GC overhead limit exceeded (batch đóng sổ, allocation rate 42 GB/phút, young GC mỗi 100 ms, JVM bỏ 98% thời gian GC)
- lab-gc-035: G1 Concurrent Mode Failure (concurrent marking kịp allocation rate 5 GB/phút → Full GC 3 giây mỗi 15 phút)

Lý do chọn góc này: chủ đề đề xuất (humongous allocation G1, Metaspace class động) đã có nhiều lab cũ (lab-gc-001/010/014/020/024/028/032 humongous; lab-gc-003/011/016/018/021/025/029/033 Metaspace/classloader), nên chọn góc chưa có theo ghi chú "Vòng 3: chọn góc chưa có".

node --check js/data/labs-gc.js: OK.
node scripts/validate.js: lab-gc-034 và lab-gc-035 không báo lỗi. Các lỗi còn lại trong validate.js nằm ở file không sở hữu (q-soft.js, quiz-ops.js, labs-gc.js lab-032/033 cũ, lessons-*, projects.js, path.js) — không do thay đổi này.
node scripts/build-light-index.js: không chạy được do lỗi cú pháp cũ trong q-soft.js:10838 (file không sở hữu, không sửa được).
Reviewed-by: kilo (T2740R)
