/* Toàn bộ nội dung của nhà nằm ở file này. Sửa ở đây, không cần đụng code. */
window.SITE = {
  siteName: 'Xưởng của Thức',
  tagline: 'Nơi Thức nghe nhạc, đọc sách, học, chơi và làm ra đồ công nghệ.',

  /* Robot trợ lí của trang: X.M.A.S, trợ lí tổng. Màu vỏ, màu nhấn, màu phát sáng. */
  mascot: { kind: 'xmas', shell: '#f2f5f3', accent: '#1faf6b', glow: '#5cffb0', mark: '#e9fff3' },
  /* T.O.M, agent quản lí ghi chú. Chỉ đứng trong tủ trưng bày. */
  mascotTom: { kind: 'tom', shell: '#e6eaf1', accent: '#1fb5b0', mark: '#e6fbf9' },
  /* J.E.F.F, robot đầu bếp: trắng kem, đỏ cà chua, cam lửa. */
  mascotJeff: { kind: 'jeff', shell: '#f6f1e7', accent: '#d9482b', glow: '#ffb14a' },
  /* I.C.A.R.E, bạn đồng hành chăm sóc: trắng áo blouse, hồng san hô. */
  mascotIcare: { kind: 'icare', shell: '#f1f4f8', accent: '#ff8fa3', glow: '#ffb3c1' },

  /* Tên tài khoản của chủ Xưởng. Tài khoản đăng ký đúng tên này là admin. */
  admin: 'Thức',

  /* Phòng đang khóa, ví dụ: ['cong']. Admin vẫn vào được. */
  lockedRooms: [],

  music: {
    /* API key của YouTube Data API v3, xem README. Để trống thì vẫn chọn thể loại và dán link được. */
    apiKey: 'AIzaSyA601Sw0rzdW1UN55-gi8Ml9FjEPsKyWTM',
    region: 'VN',
    /* query: từ khoá tìm khi có API key. seed: video có sẵn khi chưa có key hoặc khi tìm lỗi. */
    genres: [
      { name: 'Lofi', query: 'lofi chill', seed: [
        { id: 'DWcJFNfaw9c', title: 'lofi hip hop radio - beats to sleep/chill to', channel: 'Lofi Girl' },
        { id: '4xDzrJKXOOY', title: 'synthwave radio - beats to chill/game to', channel: 'Lofi Girl' }
      ] },
      { name: 'Nhạc Việt', query: 'nhạc việt hay nhất', sub: [
        /* chart: true lấy bảng video phổ biến của YouTube Việt Nam, query dùng khi bảng lỗi */
        { name: 'Thịnh hành', chart: true, query: 'nhạc việt thịnh hành' },
        { name: 'Nhạc trẻ', query: 'nhạc trẻ hay nhất' },
        { name: 'Ballad', query: 'nhạc ballad việt' },
        { name: 'Remix', query: 'nhạc việt remix' },
        { name: 'Bolero', query: 'nhạc bolero trữ tình' },
        { name: 'Rap', query: 'rap việt' },
        { name: 'Indie', query: 'nhạc indie việt' },
        { name: 'Acoustic', query: 'nhạc acoustic việt' },
        { name: 'Lofi Việt', query: 'nhạc lofi việt' }
      ], seed: [
        { id: 'Llw9Q6akRo4', title: 'Lạc Trôi', channel: 'Sơn Tùng M-TP Official' },
        { id: 'FN7ALfpGxiI', title: 'Nơi Này Có Anh', channel: 'Sơn Tùng M-TP Official' },
        { id: 'knW7-x7Y7RE', title: 'Hãy Trao Cho Anh ft. Snoop Dogg', channel: 'Sơn Tùng M-TP Official' }
      ] },
      { name: 'Pop', query: 'pop hits official music video', seed: [
        { id: '4NRXx6U8ABQ', title: 'Blinding Lights', channel: 'The Weeknd' },
        { id: 'JGwWNGJdvx8', title: 'Shape of You', channel: 'Ed Sheeran' },
        { id: 'YQHsXMglC9A', title: 'Hello', channel: 'Adele' },
        { id: '09R8_2nJtjg', title: 'Sugar', channel: 'Maroon 5' },
        { id: 'RgKAFK5djSk', title: 'See You Again ft. Charlie Puth', channel: 'Wiz Khalifa' }
      ] },
      { name: 'Rock', query: 'rock official music video', seed: [
        { id: 'fJ9rUzIMcZQ', title: 'Bohemian Rhapsody', channel: 'Queen' },
        { id: 'hTWKbfoikeg', title: 'Smells Like Teen Spirit', channel: 'Nirvana' },
        { id: '1w7OgIMMRc4', title: "Sweet Child O' Mine", channel: "Guns N' Roses" },
        { id: 'v2AC41dglnM', title: 'Thunderstruck', channel: 'AC/DC' },
        { id: 'mWRsgZuwf_8', title: 'Demons', channel: 'Imagine Dragons' }
      ] },
      { name: 'Jazz', query: 'relaxing jazz', seed: [
        { id: 'Dx5qFachd3A', title: 'Relaxing Jazz Piano Radio', channel: 'Cafe Music BGM' },
        { id: 'neV3EPgvZ3g', title: 'Relaxing Jazz Music', channel: 'Cafe Music BGM' },
        { id: 'fEvM-OUbaKs', title: 'Coffee Jazz Music', channel: 'BGM channel' }
      ] },
      { name: 'EDM', query: 'edm official music video', seed: [
        { id: '60ItHLz5WEA', title: 'Faded', channel: 'Alan Walker' },
        { id: 'IcrbM1l_BoI', title: 'Wake Me Up', channel: 'Avicii' },
        { id: 'gCYcHz2k5x0', title: 'Animals', channel: 'Martin Garrix' }
      ] },
      { name: 'Không lời', query: 'piano không lời', seed: [
        { id: 'lCOF9LN_Zxs', title: 'Beautiful Piano Music, Vol. 1', channel: 'Soothing Relaxation' },
        { id: '4Tr0otuiQuU', title: 'Moonlight Sonata', channel: 'Beethoven' },
        { id: 'W-fFHeTX70Q', title: 'The Best of Beethoven', channel: 'HALIDONMUSIC' }
      ] }
    ]
  },

  /* Thư viện mở. page: tên trang trên vi.wikisource.org; không có page nghĩa là chưa có bản miễn phí. */
  library: {
    intro: 'Thư viện mở: chỉ dẫn tới sách được phép đọc và tải tự do. Sách còn bản quyền có link mua.',
    vietnam: [
      { name: 'Truyện thơ, ngâm khúc', items: [
        { title: 'Truyện Kiều', author: 'Nguyễn Du', page: true },
        { title: 'Lục Vân Tiên', author: 'Nguyễn Đình Chiểu', page: 'Lục Vân Tiên (bản Quốc ngữ 2082 câu)' },
        { title: 'Chinh phụ ngâm', author: 'Đặng Trần Côn', page: true },
        { title: 'Cung oán ngâm khúc', author: 'Nguyễn Gia Thiều', page: 'Cung oán ngâm khúc (bản phổ biến)' }
      ] },
      { name: 'Văn chương, sử cổ', items: [
        { title: 'Nam quốc sơn hà', author: 'Khuyết danh', page: true },
        { title: 'Hịch tướng sĩ', author: 'Trần Hưng Đạo', page: true },
        { title: 'Bình Ngô đại cáo', author: 'Nguyễn Trãi', page: true },
        { title: 'Truyền kỳ mạn lục', author: 'Nguyễn Dữ', page: true },
        { title: 'Hoàng Lê nhất thống chí', author: 'Ngô gia văn phái', page: true },
        { title: 'Đại Việt sử ký toàn thư', author: 'Ngô Sĩ Liên', page: true }
      ] },
      { name: 'Văn xuôi 1930 đến 1945', items: [
        { title: 'Tắt đèn', author: 'Ngô Tất Tố', page: true },
        { title: 'Chí Phèo', author: 'Nam Cao', page: true },
        { title: 'Lão Hạc', author: 'Nam Cao', page: true },
        { title: 'Hai đứa trẻ', author: 'Thạch Lam', page: true },
        { title: 'Số đỏ', author: 'Vũ Trọng Phụng' },
        { title: 'Giông tố', author: 'Vũ Trọng Phụng' }
      ] },
      { name: 'Hiện đại, đương đại', items: [
        { title: 'Dế Mèn phiêu lưu ký', author: 'Tô Hoài' },
        { title: 'Đất rừng phương Nam', author: 'Đoàn Giỏi' },
        { title: 'Tuổi thơ dữ dội', author: 'Phùng Quán' },
        { title: 'Nỗi buồn chiến tranh', author: 'Bảo Ninh' },
        { title: 'Mắt biếc', author: 'Nguyễn Nhật Ánh' },
        { title: 'Cho tôi xin một vé đi tuổi thơ', author: 'Nguyễn Nhật Ánh' }
      ] }
    ],
    /* Truyện tranh chọn tay: nhãn public domain trên Internet Archive không đáng tin nên không tìm tự động.
       origin khớp id trong origins. read/epub/pdf: chỉ thêm khi chắc chắn truyện được phát hành tự do. */
    comics: [
      { name: 'Đọc miễn phí', origin: 'us', items: [
        { title: 'Hạt Tiêu & Cà Rốt', author: 'David Revoy', note: 'Truyện mở CC BY, có bản tiếng Việt', source: 'Pepper&Carrot', read: 'https://www.peppercarrot.com/vi/webcomics/index.html' },
        { title: 'Little Nemo 1905-1914', author: 'Winsor McCay', source: 'Internet Archive', read: 'https://archive.org/details/LittleNemo1905-1914ByWinsorMccay', pdf: 'https://archive.org/download/LittleNemo1905-1914ByWinsorMccay/little-nemo.pdf' },
        { title: 'Buster Brown 1903', author: 'R. F. Outcault', source: 'Internet Archive', read: 'https://archive.org/details/BusterBrownnewspaperStrip-Year1903', epub: 'https://archive.org/download/BusterBrownnewspaperStrip-Year1903/Buster_Brown_1903.epub', pdf: 'https://archive.org/download/BusterBrownnewspaperStrip-Year1903/Buster_Brown_1903.pdf' }
      ] },
      { name: 'Truyện tranh Việt Nam', origin: 'vn', items: [
        { title: 'Thần đồng đất Việt', author: 'Lê Linh' },
        { title: 'Dũng sĩ Hesman', author: 'Hùng Lân' },
        { title: 'Long Thần Tướng', author: 'Nguyễn Thành Phong' }
      ] },
      { name: 'Manga Nhật Bản', origin: 'jp', items: [
        { title: 'Doraemon', author: 'Fujiko F. Fujio' },
        { title: 'Thám tử lừng danh Conan', author: 'Aoyama Gosho' },
        { title: 'Dragon Ball', author: 'Toriyama Akira' },
        { title: 'One Piece', author: 'Oda Eiichiro' },
        { title: 'Naruto', author: 'Kishimoto Masashi' },
        { title: 'Slam Dunk', author: 'Inoue Takehiko' }
      ] },
      { name: 'Comic Âu Mỹ', origin: 'us', items: [
        { title: 'Tintin', author: 'Hergé' },
        { title: 'Asterix', author: 'René Goscinny' },
        { title: 'Watchmen', author: 'Alan Moore' },
        { title: 'Batman: The Dark Knight Returns', author: 'Frank Miller' }
      ] }
    ],
    /* subject: chủ đề trên Open Library, sắp theo số người đọc nhiều nhất */
    foreign: [
      { name: 'Kinh điển', subject: 'Classic Literature' },
      { name: 'Trinh thám', subject: 'Detective and mystery stories' },
      { name: 'Khoa học viễn tưởng', subject: 'Science fiction' },
      { name: 'Giả tưởng', subject: 'Fantasy fiction' },
      { name: 'Lãng mạn', subject: 'Love stories' },
      { name: 'Phiêu lưu', subject: 'Adventure stories' },
      { name: 'Kinh dị', subject: 'Horror tales' },
      { name: 'Thiếu nhi', subject: "Children's fiction" },
      { name: 'Cổ tích', subject: 'Fairy tales' },
      { name: 'Thần thoại', subject: 'Mythology' },
      { name: 'Triết học', subject: 'Philosophy' }
    ],
    origins: [
      { id: 'vn', name: 'Việt Nam' },
      { id: 'en', name: 'Anh', subject: 'English fiction' },
      { id: 'us', name: 'Mỹ', subject: 'American fiction' },
      { id: 'fr', name: 'Pháp', subject: 'French fiction' },
      { id: 'ru', name: 'Nga', subject: 'Russian fiction' },
      { id: 'de', name: 'Đức', subject: 'German fiction' },
      { id: 'it', name: 'Ý', subject: 'Italian fiction' },
      { id: 'es', name: 'Tây Ban Nha', subject: 'Spanish fiction' },
      { id: 'gr', name: 'Hy Lạp', subject: 'Greek literature' },
      { id: 'jp', name: 'Nhật Bản', subject: 'Japanese fiction' },
      { id: 'cn', name: 'Trung Quốc', subject: 'Chinese fiction' }
    ]
  },

  books: {
    intro: 'Bấm vào cuốn sách nổi trên kệ để rút ra xem.',
    list: [
      {
        title: 'Mythology',
        author: 'Edith Hamilton',
        note: 'Những chuyện kể về thần và anh hùng. Cuốn này nằm trong thư mục dự án game về sinh vật thần thoại.',
        color: '#28405f', height: 88, width: 62
      },
      {
        title: 'Cho tôi xin một vé đi tuổi thơ',
        author: 'Nguyễn Nhật Ánh',
        note: 'Cảm hứng chủ đề cho The Ticket, game về một chuyến xe trở lại năm 2008.',
        color: '#5a4630', height: 74, width: 50
      }
    ],
    emptySlots: 0
  },

  /* Tủ trưng bày ở Phòng Thực Nghiệm. Dự án chia theo mảng (fields), mỗi mảng có một hay nhiều nhóm (groups).
     Mỗi nhóm là một tủ kính, cả phòng có sáu tủ. Mỗi tủ bày được bốn món.
     id của món quyết định mô hình trong tủ (xem MODELS trong js/world.js).
     images, features, tech, status, link đều là tùy chọn. Ảnh để trong img/showcase/. */
  showcase: {
    fields: [
      {
        title: 'Công nghệ',
        groups: [
          {
            title: 'Website',
            items: [
              {
                id: 'xuong', title: 'Xưởng của Thức', kind: 'Trang cá nhân dạng căn nhà 3D',
                about: 'Chính là căn nhà bạn đang đứng. Mỗi phòng là một việc Thức hay làm.',
                images: ['img/showcase/xuong-1.jpg', 'img/showcase/xuong-2.jpg', 'img/showcase/xuong-3.jpg', 'img/showcase/xuong-4.jpg'],
                features: [
                  'Căn nhà 3D xoay được, bấm vào phòng nào thì đi vào phòng đó',
                  'Phòng Nhạc: tìm và nghe nhạc từ YouTube',
                  'Phòng Sách: thư viện sách mở, đọc ngay trên trang',
                  'Phòng Học: đồng hồ hẹn giờ, flashcard, cảnh nền động, âm thanh mưa và lofi',
                  'Phòng Công Nghệ: học và chạy code ngay trong trình duyệt',
                  'Garage AI: mô hình AI chạy trên máy người dùng',
                  'Sân Thượng ngắm sao thật, Sân Vườn chăm cây',
                  'Tài khoản lưu tiến độ, dùng được trên nhiều máy'
                ],
                tech: 'HTML, CSS, JavaScript, Three.js, Firebase',
                status: 'Đang chạy'
              },
              {
                id: 'olivenow', title: 'OliveNow Ecosystem', kind: 'Bộ website giới thiệu hệ sinh thái Olive',
                about: 'Bộ trang giới thiệu các dịch vụ Olive cho nhà hàng và cửa hàng.',
                images: ['img/showcase/olivenow-1.jpg', 'img/showcase/olivenow-2.jpg', 'img/showcase/olivenow-3.jpg'],
                features: [
                  'Trang chủ gom mọi dịch vụ Olive về một nơi',
                  'Trang OlivePOS: tính năng, phần cứng, bảng giá, câu hỏi thường gặp',
                  'Trang Olive Online Ordering: cách hoạt động, bảng giá, so sánh chi phí với app giao hàng',
                  'Trang Olive Design',
                  'Biểu mẫu đăng ký dùng thử, yêu cầu gọi lại hoặc xem demo',
                  'Đổi ngôn ngữ ngay trên trang'
                ],
                link: { label: 'Mở olivenow.com', href: 'https://olivenow.com' }
              }
            ]
          },
          {
            title: 'Application',
            items: [
              {
                id: 'xmas', title: 'X.M.A.S', kind: 'Trợ lí tổng, eXtensible Multi-Agent System',
                about: 'Trợ lí ảo cá nhân của Thức và là robot dẫn đường của Xưởng. X.M.A.S đứng trên các agent chuyên việc như T.O.M và J.E.F.F.',
                images: ['img/showcase/xmas-1.jpg', 'img/showcase/xmas-2.jpg'],
                features: [
                  'Chào khách và dẫn tour căn nhà',
                  'Đi trước dẫn đường tới phòng được bấm',
                  'Chỉ cách dùng từng phòng',
                  'Fact hôm nay và thời tiết hôm nay ở ba thành phố',
                  'Nhìn theo con trỏ chuột, nhảy theo khi có nhạc'
                ],
                status: 'Đang phát triển'
              },
              {
                id: 'tom', title: 'T.O.M', kind: 'Agent quản lí ghi chú, Technical Operations Machine',
                about: 'Agent của X.M.A.S chỉ lo một việc: ghi chú. T.O.M làm việc trong app Thư viện môn học. Ảnh chụp dùng dữ liệu mẫu.',
                images: ['img/showcase/thuvien-3.jpg', 'img/showcase/thuvien-2.jpg'],
                features: [
                  'Trả lời câu hỏi chỉ từ nguồn trong thư viện, mỗi ý kèm nguồn để đối chiếu',
                  'Tạo tóm tắt, đề cương, thuật ngữ, câu hỏi và thẻ nhớ từ bài giảng',
                  'Liệt kê các bài chưa có ghi chú'
                ],
                status: 'Đang phát triển'
              },
              {
                id: 'olive-pos', title: 'Olive Mini POS Retail App', kind: 'Phần mềm bán hàng cho tiệm tạp hóa',
                about: 'Quét mã vạch, tính tiền, quản lí kho, báo cáo và in hóa đơn. Chạy không cần mạng trên một máy tính tại quầy.',
                images: ['img/showcase/pos-1.png', 'img/showcase/pos-2.png'],
                features: [
                  'Bán hàng: quét mã để thêm món, bàn phím cảm ứng, phím tiền nhanh, giữ đơn chờ và gọi lại',
                  'Thanh toán: tiền mặt có tính tiền thối, Interac, Visa, Mastercard',
                  'Kho: thêm sửa hàng bằng máy quét, lọc hàng sắp hết, nhập xuất CSV',
                  'Hóa đơn và báo cáo theo giờ, ngày, tuần, tháng, năm, nhóm hàng, hàng bán chạy',
                  'In hóa đơn khổ 80 mm và mở két tiền',
                  'Tự sao lưu mỗi ngày, giữ 30 ngày, có khôi phục',
                  'Giao diện tiếng Anh và tiếng Việt'
                ],
                tech: 'Python, Tkinter, SQLite',
                status: 'Đã phát hành bản 1.2.5'
              }
            ]
          },
          {
            title: 'Game',
            items: [
              {
                id: 'the-ticket', title: 'The Ticket', kind: 'Game pixel kể chuyện, 5 chương',
                about: 'Một anh IT lỡ chuyến xe về quê, nhận tấm vé từ một ông lão lạ và trở lại làng năm 2008.',
                images: ['img/showcase/ticket-1.jpg', 'img/showcase/ticket-2.jpg'],
                features: ['Câu chuyện chia 5 chương, chọn chương từ menu', 'Đồ họa pixel', 'Chơi ngay trên trình duyệt hoặc tải bản Windows'],
                tech: 'Python, pygame-ce, pygbag',
                status: 'Chơi được trên web và Windows',
                link: { label: 'Sang Phòng Giải Trí để chơi', href: '#game' }
              },
              {
                id: 'fluffy-frenzy', title: 'Fluffy Frenzy', kind: 'Đại chiến thú cưng 3D',
                about: 'Chọn một con thú, vào đấu trường với 3 đến 7 bot.',
                images: ['img/showcase/fluffy-1.jpg', 'img/showcase/fluffy-2.jpg'],
                features: ['Ba chế độ: Đấu trường, Chiếm cờ, Vua đồi', 'Ba bản đồ: Quảng Trường, Sân Thượng, Khu Vườn', 'Mỗi con thú có thiên phú riêng', 'Đấu với 3, 5 hoặc 7 bot'],
                tech: 'JavaScript, Three.js',
                status: 'Chơi được trên web',
                link: { label: 'Sang Phòng Giải Trí để chơi', href: '#game' }
              },
              { id: 'the-one', title: 'THE ONE', kind: 'Game pixel kể chuyện, 5 phần', status: 'Bản riêng, không phát hành' },
              { id: 'a-usual-day', title: 'A Usual Day', kind: 'Bản demo', status: 'Bản riêng, không phát hành' }
            ]
          }
        ]
      },
      { title: 'Văn thơ', groups: [{ title: 'Văn thơ', items: [] }] },
      { title: 'Hình ảnh và video', groups: [{ title: 'Hình ảnh và video', items: [] }] },
      { title: 'Học thuật', groups: [{ title: 'Học thuật', items: [] }] }
    ]
  },

  /* Các khu khác của Phòng Thực Nghiệm. */
  /* Phòng Kế Hoạch. Planner là chức năng chính của phòng: lịch, việc cần làm, nhắc giờ. */
  planning: {
    intro: 'Planner của Xưởng: lịch tháng, việc cần làm và nhắc giờ. Chọn một ngày, ghi việc, đặt giờ để được nhắc.',
    about: 'Planner gộp lịch, danh sách việc và nhắc giờ vào một chỗ. Mỗi việc có ngày, giờ, mức ưu tiên, kiểu lặp và kiểu nhắc. Việc chỉ lưu trên trình duyệt này, không gửi đi đâu. Lời nhắc chỉ chạy khi trang đang mở.'
  },

  /* Phòng Bếp, nơi J.E.F.F ở. Thông tin về J.E.F.F lấy từ basement.agents bên dưới. */
  /* Phòng nghỉ, nơi I.C.A.R.E ở. Mỗi lời nhắc: { id, name, every (phút), text, done (chữ trên nút xong) }.
     Các mốc thời gian là mặc định phổ biến, không phải chỉ định y khoa. */
  rest: {
    intro: 'Góc nghỉ của Xưởng, nơi I.C.A.R.E ở. Bắt đầu một phiên khi ngồi vào bàn, I.C.A.R.E sẽ nhắc bạn uống nước, nghỉ mắt, đứng dậy và vận động.',
    lead: 'Bấm Bắt đầu phiên khi bạn ngồi vào bàn. I.C.A.R.E đếm giờ và nhắc từng việc khi tới mốc.',
    note: 'I.C.A.R.E chỉ nhắc được khi thẻ trang này còn mở. Các mốc thời gian là mặc định phổ biến, không phải lời khuyên y khoa. Số lần trong ngày lưu trên trình duyệt của bạn.',
    snooze: 10,
    reminders: [
      { id: 'mat', name: 'Nghỉ ngơi', every: 25, text: 'Rời mắt khỏi màn hình, nhìn ra xa 20 giây.', done: 'Đã nghỉ mắt' },
      { id: 'dung', name: 'Không ngồi lâu', every: 45, text: 'Bạn ngồi khá lâu rồi. Đứng dậy đi vài bước.', done: 'Đã đứng dậy' },
      { id: 'nuoc', name: 'Uống nước', every: 60, text: 'Uống một ngụm nước nhé.', done: 'Đã uống' },
      { id: 'van', name: 'Vận động', every: 120, text: 'Vươn vai, xoay cổ, xoay vai trong một phút.', done: 'Đã vận động' }
    ]
  },

  kitchen: {
    intro: 'Căn bếp của Xưởng, nơi J.E.F.F ở. Chọn nguyên liệu bạn đang có, J.E.F.F gợi ý món, lên thực đơn tuần và danh sách đi chợ.',
    about: 'J.E.F.F là robot đầu bếp trong nhóm agent của X.M.A.S. Hiện J.E.F.F gợi ý món bằng cách so nguyên liệu bạn chọn với kho công thức có sẵn, rồi cộng dồn nguyên liệu của thực đơn tuần thành danh sách đi chợ. Chưa dùng AI. Tủ lạnh và thực đơn của bạn chỉ lưu trên trình duyệt này.'
  },

  basement: {
    /* Trạm Agent: cây phân cấp các bot agent. Mỗi agent: { id, name, full, role, avatar, status, color, note, tasks, go, children }
       go: nút "Đi đến" cạnh tên agent. href là "#mã phòng" hoặc một địa chỉ web, to là tên nơi đến. */
    agents: {
      title: 'Trạm Agent',
      about: 'Mọi bot agent trong dự án trợ lí ảo cá nhân của Thức, xếp theo phân cấp. X.M.A.S ở trên cùng, mỗi agent bên dưới lo một việc.',
      tree: {
        id: 'xmas', name: 'X.M.A.S', full: 'eXtensible Multi-Agent System', role: 'Trợ lí tổng', color: '#5cffb0', avatar: 'img/agents/xmas.png',
        status: 'Đang chạy trên trang này',
        tasks: ['Chào khách, dẫn tour và dẫn đường trong Xưởng', 'Fact hôm nay và thời tiết hôm nay', 'Đọc lời nhắc của Planner ở Phòng Kế Hoạch', 'Đứng trên các agent chuyên việc bên dưới'],
        children: [
          {
            id: 'tom', name: 'T.O.M', full: 'Technical Operations Machine', role: 'Quản lí ghi chú', color: '#4fdcff', avatar: 'img/agents/tom.png',
            status: 'Đang chạy trong app Thư viện môn học',
            tasks: ['Trả lời câu hỏi chỉ từ nguồn trong thư viện, mỗi ý kèm nguồn', 'Tạo tóm tắt, đề cương, thuật ngữ, câu hỏi và thẻ nhớ', 'Liệt kê các bài chưa có ghi chú'],
            go: { href: 'https://thcphm.github.io/quan-ly-ghi-chu-web/', to: 'trang Quản lí ghi chú' }
          },
          {
            id: 'jeff', name: 'J.E.F.F', full: 'Just Eat Food Forever', role: 'Bếp và món ăn', color: '#ffb14a', avatar: 'img/agents/jeff.png',
            note: 'Đọc giống "chef".',
            status: 'Đang dựng. Đã gợi ý món, lên thực đơn tuần và danh sách đi chợ',
            tasks: ['Lên ý tưởng và đề xuất món ăn', 'Quản lí và tổng hợp nguyên vật liệu'],
            go: { href: '#bep', to: 'Phòng Bếp' }
          },
          {
            id: 'icare', name: 'I.C.A.R.E', full: 'Intelligent Companion for Awareness, Rest and Energy', role: 'Ngủ, nghỉ và năng lượng', color: '#ff8fa3', avatar: 'img/agents/icare.png',
            note: 'Bạn đồng hành nhắc ngủ nghỉ, không phải bác sĩ: không chẩn đoán, không khuyên thuốc.',
            status: 'Đang dựng. Đã nhắc được bốn việc trong một phiên ngồi làm việc',
            tasks: ['Nhắc uống đủ nước', 'Nhắc nghỉ ngơi', 'Nhắc vận động', 'Nhắc đứng dậy, không ngồi lâu'],
            go: { href: '#nghi', to: 'Phòng nghỉ' }
          }
        ]
      }
    },
    /* Sản phẩm đang thử. Mỗi mục giống một sản phẩm trong tủ: { title, kind, about, images, features, tech, status, link } */
    lab: {
      title: 'Bàn thí nghiệm',
      about: 'Nơi bày các sản phẩm đang thử, chưa lên tủ trưng bày.',
      items: [
        {
          id: 'thu-vien-mon-hoc',
          title: 'Thư viện môn học',
          kind: 'App máy tính ghi chú theo môn học',
          about: 'App máy tính để ghi chú cá nhân theo từng môn học. Mỗi môn có bốn ngăn: Bài giảng, Bài tập và Lab, Ôn tập và Quiz, Tài liệu. Đây là bài Assignment phần 2 môn CNTT 4.0 (ITI102). Ảnh chụp dùng dữ liệu mẫu.',
          images: ['img/showcase/thuvien-1.jpg', 'img/showcase/thuvien-2.jpg', 'img/showcase/thuvien-3.jpg'],
          features: [
            'Kệ sách các môn học, mỗi môn bốn ngăn',
            'Mở một bài: nội dung slide bên trái, ghi chú của bài bên phải',
            'Ghi chú tự lưu, có bản sao lưu, xuất và nhập toàn bộ thư viện',
            'Tìm kiếm bằng Ctrl K, gõ không dấu vẫn tìm được',
            'Thêm file PDF, Word, TXT, MD và cả thư mục từ máy làm tài liệu chỉ đọc',
            'T.O.M trả lời câu hỏi chỉ từ nguồn trong thư viện, mỗi ý kèm nguồn để đối chiếu',
            'Xưởng: tạo tóm tắt, đề cương, thuật ngữ, câu hỏi và thẻ nhớ từ bài giảng'
          ],
          tech: 'Electron, JavaScript, Three.js, pdf.js, Gemini API',
          status: 'Đang phát triển, bản 0.1.0'
        }
      ]
    },
    /* Tối đa ba cột, mỗi cột bảy dòng. */
    roadmap: {
      title: 'Bảng lộ trình',
      columns: [
        { title: 'Đang làm', items: [{ title: 'Phòng Thực Nghiệm', about: 'Tầng hầm của Xưởng, dựng dần từng khu.' }, { title: 'X.M.A.S', about: 'Trợ lí tổng, đang dẫn tour Xưởng.' }, { title: 'T.O.M', about: 'Agent quản lí ghi chú trong Thư viện môn học.' }, { title: 'J.E.F.F', about: 'Robot đầu bếp: gợi ý món, thực đơn tuần, danh sách đi chợ.' }, { title: 'Planner', about: 'Lịch tháng, việc cần làm và nhắc giờ ở Phòng Kế Hoạch.' }, { title: 'Thư viện môn học', about: 'App máy tính ghi chú theo môn học, đang bày ở Bàn thí nghiệm.' }] },
        { title: 'Sắp làm', items: [{ title: 'J.E.F.F: hỏi đáp', about: 'Hỏi tự do, J.E.F.F chỉ trả lời từ kho công thức.' }] },
        { title: 'Đã xong', items: [{ title: 'Xưởng của Thức', about: 'Căn nhà 3D này, đang chạy.' }, { title: 'The Ticket', about: 'Game pixel kể chuyện, 5 chương.' }, { title: 'Fluffy Frenzy', about: 'Đại chiến thú cưng 3D.' }] }
      ]
    }
  },

  games: {
    intro: 'Tất cả đều tự viết bằng code. Bấm vào máy arcade để chơi.',
    list: [
      {
        id: 'fluffy-frenzy',
        title: 'Fluffy Frenzy',
        kind: 'Đại chiến thú cưng 3D',
        about: 'Chọn một con thú, vào đấu trường với 3 đến 7 bot. Có ba chế độ: Đấu trường, Chiếm cờ và Vua đồi.',
        controls: 'WASD để đi, Space để nhảy, J để đấm, K để đá',
        play: 'games/fluffy-frenzy/index.html'
      },
      {
        id: 'the-ticket',
        title: 'The Ticket',
        kind: 'Game pixel kể chuyện, 5 chương',
        about: 'Một anh IT lỡ chuyến xe về quê, nhận tấm vé từ một ông lão lạ và trở lại làng năm 2008.',
        status: 'Windows 10/11',
        web: 'games/the-ticket/index.html',
        download: 'https://github.com/thcphm/xuong-cua-thuc/releases/download/the-ticket-v1/THE_TICKET.exe'
      },
      { id: 'the-one', title: 'THE ONE', kind: 'Game pixel kể chuyện, 5 phần', status: 'Bản riêng, không phát hành' },
      { id: 'a-usual-day', title: 'A Usual Day', kind: 'Bản demo', status: 'Bản riêng, không phát hành' }
    ]
  }
};
