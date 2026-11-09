# Xưởng của Thức

Trang cá nhân dạng căn nhà 3D. HTML, CSS, JavaScript thuần với Three.js, không cần build.

## Chạy thử

```bash
python -m http.server 4173
```

Mở http://localhost:4173. Phải chạy qua server, mở thẳng file `index.html` thì 3D không tải được.

## Sửa nội dung

Mọi nội dung nằm trong `data/site.js`: tên trang, nhạc, sách, dự án, game, màu robot.

- Thêm sách, tủ sách: sửa `library` trong `data/site.js`. Sách có trên Wikisource tiếng Việt thì thêm `page`.
- Sách Thức đang đọc: thêm vào `books.list`.
- Thêm thể loại nhạc: thêm mục vào `music.genres`.
- Bật tìm nhạc theo tên: điền `music.apiKey`, xem mục bên dưới.
- Khóa một phòng: thêm id phòng vào `lockedRooms`, ví dụ `'cong'`.
- Thêm bài tập, khóa học, link HackerRank và Hack The Box: sửa `data/lab.js`.
- Mở tải The Ticket: điền đường dẫn vào `download` của game đó.

## API key YouTube

1. Vào [Google Cloud Console](https://console.cloud.google.com/), tạo project, bật **YouTube Data API v3**.
2. Tạo API key.
3. Giới hạn key: **HTTP referrers** gồm `https://thcphm.github.io/*` và `http://localhost:4173/*`; **API restrictions** chỉ chọn YouTube Data API v3.
4. Dán key vào `music.apiKey` trong `data/site.js`.

Key nằm công khai trong trang, nên bắt buộc làm bước 3. Hạn mức mặc định 10.000 đơn vị mỗi ngày, mỗi lần tìm tốn 100 đơn vị (khoảng 100 lượt). Kết quả được lưu 12 giờ trên trình duyệt để tiết kiệm lượt.

## Cấu trúc

- `js/world.js`: căn nhà 3D, camera, đồ vật bấm được
- `js/mascot.js`: logo TP và robot TP
- `js/guide.js`: lời thoại, tour, phản ứng của robot
- `js/walk.js`: robot tự đi tới phòng được bấm
- `js/study.js`: Phòng Học
- Sửa CSS hoặc JS xong: đổi số `?v=` trong `index.html` để trình duyệt tải bản mới.
- `data/w3.js`: mục lục W3Schools, chỉ gồm tên chương và đường dẫn.
- `js/lab.js`: Phòng Công Nghệ, gồm khóa học, trình soạn mã và chấm bài
- `js/library.js`: thư viện Phòng Sách
- `js/music.js`: trình phát và tìm kiếm YouTube

## Âm thanh Phòng Học

Hai file trong `assets/sounds/` đều là CC0, lấy từ Freesound: `rain.mp3` là "Rain from Indoors - Perfect loop" của samesamesame, `lofi.mp3` là "Chill Lofi Melody Loop 95 BPM" của holizna.

## Tài khoản và admin

- Tài khoản và tiến độ lưu trên Firebase (Authentication, Firestore), dùng được trên mọi máy. Mật khẩu không lấy lại được.
- Tên tài khoản được đổi thành địa chỉ nội bộ `<sha256>@xuong.example.com` vì Firebase cần dạng email. Không có thư nào được gửi đi.
- Admin là tài khoản có tên trùng `admin` trong `data/site.js`. Quyền thật nằm ở `firestore.rules`: đổi tên admin thì phải sửa email trong file đó và đăng lại luật trên Firebase console.
- Khách dùng được mọi phòng nhưng tiến độ mất khi tải lại trang.
- Bộ từ Flashcard ở `data/cards.js`, cây ở `data/garden.js`.
