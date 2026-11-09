# Xưởng của Thức

Trang cá nhân dạng căn nhà 3D. HTML, CSS, JavaScript thuần với Three.js, không cần build.

## Chạy thử

```bash
python -m http.server 4173
```

Mở http://localhost:4173. Phải chạy qua server, mở thẳng file `index.html` thì 3D không tải được.

## Sửa nội dung

Mọi nội dung nằm trong `data/site.js`: tên trang, nhạc, sách, dự án, game, màu robot.

- Thêm sách: thêm một mục vào `books.list`.
- Thêm thể loại nhạc: thêm mục vào `music.genres`.
- Bật tìm nhạc theo tên: điền `music.apiKey`, xem mục bên dưới.
- Mở lại Phòng Công Nghệ: xoá `'cong'` khỏi `lockedRooms`.
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
- `js/tech.js`: terminal Phòng Công Nghệ
- `js/music.js`: trình phát và tìm kiếm YouTube
