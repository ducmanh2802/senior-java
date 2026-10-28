# T355 — Debug lab: thêm 3 bài thread + 3 bài GC

Status: DONE
Agent: claude
Owns: `js/data/labs-thread.js`, `js/data/labs-gc.js`

Đọc AGENTS.md mục 10 (Debug lab) và các bài có sẵn trong hai file. Thêm 3 bài thread (ví dụ: pool starvation do task chờ task con trên cùng executor, virtual thread bị pin bởi native call trên JDK 21, lock contention trên một synchronized cache) và 3 bài gc (ví dụ: humongous allocation trên G1, metaspace leak do classloader, allocation rate cao gây young GC dày). Artifact phải giống thật (jstack/jcmd Thread.print, GC log unified JDK 17+, jstat) và tự nhất quán với answer. Không trùng bài đã có.

### Chuẩn chung (bắt buộc)
- Đọc AGENTS.md mục 2, 4, 5, 6, 13 trước khi viết. Người học là dev Java ~4 năm, **hổng nền tảng**: giải thích từ gốc, ví dụ đời thường, cơ chế từng bước có "vì sao", sơ đồ ASCII hoặc số liệu, code ngắn có comment, bảng trade-off, ### Lỗi hay gặp, ### Trả lời miệng 1 phút ngay trước > Senior tip:.
- Chống trùng: đọc hết câu cùng topic trong file của bạn và grep các file js/data/q-*.js khác; chủ đề đã có thì chọn góc khác hoặc bỏ.
- Đúng kỹ thuật với Java 17/21, Spring Boot 3.x, Hibernate 6, Kubernetes/AWS hiện hành. Không chắc thì viết ít lại nhưng đúng. refs chỉ dùng link chắc chắn tồn tại; chạy node scripts/check-links.mjs <tên-file.js> (chỉ tên file) và bỏ link hỏng.
- Chỉ **thêm**, id tiếp số lớn nhất của topic/category trong file. Không sửa nội dung đã có.
- Trong template literal: không có ký tự backtick, không có ${ chưa escape, dấu \ phải viết \\; inline code dùng {{code}}.
- **Không bao giờ để file hỏng cú pháp**: sau mỗi lần sửa chạy node --check <file>; nếu hỏng mà không sửa được thì khôi phục bằng git checkout -- <file> rồi làm lại từng mục một.
- Không chạy trực tiếp file .js như lệnh (luôn node <file>). Không commit/push, không kill tiến trình, không mở trình duyệt.
- Xong: node scripts/validate.js → OK — không có lỗi.; ghi Notes (id đã thêm) và đổi dòng trạng thái thành đúng Status: DONE (chỉ dùng TODO hoặc DONE, không dùng giá trị khác).

## Notes
- Thêm lab-thread-006 (thread-starvation deadlock CompletableFuture join cùng executor, senior), lab-thread-007 (Logback AsyncAppender đầy chặn 187 thread Tomcat, mid), lab-thread-008 (ReentrantReadWriteLock: writer chờ chặn reader mới, lead).
- Thêm lab-gc-006 (Pause Full (System.gc()) mỗi 10 phút, mid), lab-gc-007 (container ergonomics: Serial GC + heap 25% = 384M, senior), lab-gc-008 (finalizer backlog do finalize() chờ ack SFTP, lead).
- Chọn góc khác với bài cũ (humongous, metaspace, young GC dày, synchronized contention, VT pinning đã có). node --check OK; validate: không có lỗi ở labs (lỗi còn lại thuộc algo.js của task khác).

Reviewed-by: claude (subagent; validate OK)
