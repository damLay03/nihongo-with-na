# Nihongo với Na

App học tiếng Nhật trên điện thoại: Hiragana, Katakana, Minna no Nihongo N5 (Bài 1–25), Kanji N5 (Unit 1–20).
Ôn thẻ theo đường cong quên (FSRS), tập viết theo thứ tự nét, game nhỏ, trang giáo viên.

## Cách hoạt động

- App tĩnh, chạy trên GitHub Pages, cài được lên màn hình chính (PWA) và dùng được khi mất mạng.
- **Nội dung bài học không nằm trong repo này.** App tải nội dung từ Firestore sau khi nhập đúng mã học.
- Tiến độ lưu trong máy và đồng bộ lên Firestore theo mã học (đăng nhập ẩn danh, không cần tài khoản).
- `firestore.rules`: chỉ đọc được đúng document khi biết mã; không liệt kê, không tạo mới; nội dung chỉ quản trị viên ghi.

## Ghi công

- Nét viết: [KanjiVG](https://kanjivg.tagaini.net/) (CC BY-SA 3.0).
- Thuật toán ôn tập: [ts-fsrs](https://github.com/open-spaced-repetition/ts-fsrs) (MIT).
- Sticker: tranh riêng của tác giả.
