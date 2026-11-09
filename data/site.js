/* Toàn bộ nội dung của nhà nằm ở file này. Sửa ở đây, không cần đụng code. */
window.SITE = {
  siteName: 'Xưởng của Thức',
  tagline: 'Nơi Thức nghe nhạc, đọc sách, học, chơi và làm ra đồ công nghệ.',

  /* Robot trợ lí TP: màu vỏ và màu nhấn. */
  mascot: { shell: '#e6eaf1', accent: '#1fb5b0', mark: '#e6fbf9' },

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
        status: 'Bản Windows sắp có',
        download: ''
      },
      { id: 'the-one', title: 'THE ONE', kind: 'Game pixel kể chuyện, 5 phần', status: 'Bản riêng, không phát hành' },
      { id: 'an-usual-day', title: 'An Usual Day', kind: 'Bản demo', status: 'Bản riêng, không phát hành' }
    ]
  }
};
