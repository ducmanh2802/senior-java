# T313 — Luyện nói: phát âm từ vựng bằng audio thật + chọn giọng TTS tự nhiên

Status: TODO
Agent: opencode
Owns: `js/views/speak.js`, `css/views/speak.css`

Vấn đề: giọng đọc khó nghe. `speak()` trong `js/views/speak.js` (khoảng dòng 305) lấy giọng `en-US` **đầu tiên** tìm thấy. Trên Windows giọng đó thường là "Microsoft David", nghe rất máy.

Không dùng Oxford Learner's Dictionaries: Oxford không có API miễn phí, link audio của họ phải scrape HTML, bị chặn CORS và vi phạm điều khoản sử dụng.

1. **Audio thật cho từ / cụm ngắn** (nút "Hear the word", từ vựng ≤ 3 từ):
   - Gọi `https://api.dictionaryapi.dev/api/v2/entries/en/<word>` (miễn phí, không cần key, có CORS). Lấy `phonetics[].audio` khác rỗng, ưu tiên file `-us.mp3`, sau đó `-uk.mp3`.
   - Phát bằng `new Audio(url)`. Hiện phiên âm IPA (`phonetics[].text`) cạnh từ, kèm nhãn nguồn nhỏ "Wiktionary audio (CC BY-SA)".
   - Cache kết quả theo từ trong bộ nhớ và `localStorage` (bọc try/catch, kể cả kết quả "không có audio"), để không gọi lại.
   - Không có audio, lỗi mạng, hay từ là cụm kỹ thuật (ví dụ "dependency injection") thì fallback về TTS. Timeout 4 giây.
   - Chỉ gọi khi người dùng bấm nghe, không prefetch hàng loạt.
2. **Chọn giọng TTS tốt nhất** cho câu dài và fallback:
   - Chấm điểm danh sách `getVoices()` theo lang `en-US`/`en-GB`. Ưu tiên tên khớp `/Natural|Neural|Online|Google US English|Google UK English|Aria|Jenny|Guy|Ava|Andrew|Emma|Samantha|Daniel/i`. Phạt `/David|Zira|Mark|eSpeak/i`.
   - Lắng nghe `voiceschanged` vì Chrome nạp danh sách giọng bất đồng bộ.
3. **Cho người dùng chọn giọng:** ô select "Giọng đọc" liệt kê giọng tiếng Anh (giọng tốt xếp trước), nút nghe thử, lưu lựa chọn vào `localStorage`. Giữ thanh tốc độ hiện có; tốc độ mặc định 0.95.
4. Gợi ý nhỏ trong UI: "Giọng tự nhiên nhất: mở bằng Microsoft Edge (giọng Natural) hoặc Chrome (Google US English)".
5. i18n vi/en cho chuỗi mới, theo cách view đang làm. Ẩn mọi thứ liên quan TTS khi không có `speechSynthesis`.
6. `node --check js/views/speak.js`, `node scripts/validate.js` → OK. Ghi Notes, `Status: DONE`.

## Notes

