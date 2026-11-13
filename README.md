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
- `js/mascot.js`: logo TP và bốn robot: X.M.A.S (eXtensible Multi-Agent System, trợ lí tổng của trang), T.O.M (Technical Operations Machine, agent quản lí ghi chú), J.E.F.F (Just Eat Food Forever, robot đầu bếp) và I.C.A.R.E (Intelligent Companion for Awareness, Rest and Energy, bạn đồng hành nhắc ngủ nghỉ)
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

## Phòng Kế Hoạch và Planner

Planner là chức năng chính của Phòng Kế Hoạch, gộp lịch, việc cần làm và nhắc giờ:

- Trang kế hoạch tuần theo kiểu sổ planner: tiêu đề kèm ngày giờ thật, Lịch hẹn (việc có giờ), bảy ngày thứ Hai đến Chủ Nhật, Việc cần làm (việc chưa gắn ngày), Ghi chú theo tuần.
- Ngày giờ lấy theo đồng hồ máy người xem: đồng hồ chạy từng giây, ô hôm nay tự đổi khi sang ngày mới, bảng lịch và đồng hồ treo tường trong phòng 3D cũng chạy theo.
- Lịch tháng, chấm màu theo mức ưu tiên, bấm một ngày để xem và thêm việc.
- Mỗi việc có ngày, giờ, mức ưu tiên, kiểu lặp (ngày, tuần, tháng) và kiểu nhắc (đúng giờ, trước 10 phút, 1 giờ, 1 ngày).
- Gõ nhanh: "mai 9h họp nhóm" tự hiểu ngày và giờ.
- Xem theo hôm nay (kèm việc quá hạn), theo tuần hoặc tất cả. Sửa, đánh dấu xong, xóa.
- Nhắc giờ: thẻ nhắc ở góc trang, tiếng chuông, thông báo của trình duyệt nếu được bật, X.M.A.S đọc lời nhắc. Nhắc chỉ chạy khi trang đang mở.

Việc lưu trong `localStorage` của trình duyệt, không gửi đi đâu. Giao diện ở `js/planner.js`.

## Phòng nghỉ và I.C.A.R.E

Phòng nghỉ là khối nối bên trái Phòng Học, nơi I.C.A.R.E ở. I.C.A.R.E nhắc bốn việc trong lúc bạn ngồi làm việc: nghỉ mắt, đứng dậy, uống nước, vận động.

- Bấm "Bắt đầu phiên" khi ngồi vào bàn. Tới mốc của việc nào thì hiện lời nhắc việc đó ở góc dưới bên trái, ở mọi phòng.
- Mỗi lời nhắc có hai nút: nút xong (đếm lại từ đầu, cộng một lần cho hôm nay) và "Nhắc lại sau 10 phút".
- Phiên và số lần trong ngày lưu trên trình duyệt (`localStorage`, khóa `xuong.nghi`), tải lại trang vẫn còn.
- Chỉ nhắc được khi thẻ trang còn mở. Nếu đã cho phép thông báo và thẻ đang bị che, trình duyệt hiện thêm thông báo của máy.
- Giờ đi ngủ: mỗi tối I.C.A.R.E nhắc lúc 22:30 và nhắc trước 1 giờ, 30 phút, 15 phút (21:30, 22:00, 22:15). Không cần bắt đầu phiên. Mỗi mốc nhắc một lần; mở trang muộn thì chỉ nhắc mốc gần nhất. Bật tắt bằng nút trong Phòng nghỉ. Sửa giờ và các mốc ở `rest.bedtime` trong `data/site.js`.
- Tiếng chuông: mỗi lời nhắc phát một tiếng chuông ngắn trên thẻ trang (nhắc việc ba nốt đi lên, giờ ngủ ba nốt đi xuống). Bật tắt và nghe thử trong Phòng nghỉ. Trình duyệt chỉ cho phát tiếng sau khi bạn đã bấm hoặc gõ gì đó trên trang kể từ lúc mở.
- I.C.A.R.E không chẩn đoán và không khuyên thuốc. Các mốc thời gian là mặc định phổ biến, không phải lời khuyên y khoa.

Sửa lời nhắc và mốc thời gian ở `rest` trong `data/site.js`. Code nhắc việc: `js/rest.js`. Căn phòng 3D: khối "Phòng nghỉ" trong `js/world.js`.

## Phòng Bếp và J.E.F.F

J.E.F.F gợi ý món ở Phòng Bếp: chọn nguyên liệu đang có trong tab Tủ lạnh, xem món nấu được, hoặc bấm "Hôm nay ăn gì?". Tab Thực đơn xếp món vào 7 ngày, chọn số người ăn, rồi cộng dồn nguyên liệu thành danh sách đi chợ (trừ thứ đã có trong tủ lạnh) và chép ra chữ. Không dùng AI, không gửi dữ liệu đi đâu; tủ lạnh và thực đơn lưu trong `localStorage` của trình duyệt.

- Nguyên liệu và công thức nằm trong `data/recipes.js`. Thêm món bằng cách thêm một mục vào `recipes`, kèm `qty` là lượng cho `serves` người.
- Giao diện ở `js/kitchen.js`.

## Trợ lí X.M.A.S

X.M.A.S là trợ lí tổng của trang. Các agent chuyên việc (T.O.M, J.E.F.F, I.C.A.R.E) được giới thiệu ở Trạm Agent dưới tầng hầm (bảng treo tường, ảnh đầu các bot nằm trong `img/agents/`), nội dung nằm ở `basement.agents` trong `data/site.js`.

Bấm vào X.M.A.S để mở menu: fact hôm nay, thời tiết hôm nay, đi tới phòng, mẹo.

- Fact nằm trong `data/facts.js`, mỗi ngày một câu, hết danh sách thì quay vòng.
- Thời tiết lấy từ [Open-Meteo](https://open-meteo.com/) (CC BY 4.0), không cần API key. Danh sách thành phố ở `CITIES` trong `js/guide.js`.

## Tài khoản và admin

- Tài khoản và tiến độ lưu trên Firebase (Authentication, Firestore), dùng được trên mọi máy. Mật khẩu không lấy lại được.
- Tên tài khoản được đổi thành địa chỉ nội bộ `<sha256>@xuong.example.com` vì Firebase cần dạng email. Không có thư nào được gửi đi.
- Admin là tài khoản có tên trùng `admin` trong `data/site.js`. Quyền thật nằm ở `firestore.rules`: đổi tên admin thì phải sửa email trong file đó và đăng lại luật trên Firebase console.
- Khách dùng được mọi phòng nhưng tiến độ mất khi tải lại trang.
- Bộ từ Flashcard ở `data/cards.js`, cây ở `data/garden.js`.
