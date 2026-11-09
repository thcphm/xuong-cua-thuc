/* Toàn bộ nội dung của nhà nằm ở file này. Sửa ở đây, không cần đụng code. */
window.SITE = {
  siteName: 'Xưởng của Thức',
  tagline: 'Nơi Thức nghe nhạc, đọc sách, học, chơi và làm ra đồ công nghệ.',

  /* Robot trợ lí TP: màu vỏ và màu nhấn. */
  mascot: { shell: '#e6eaf1', accent: '#1fb5b0', mark: '#e6fbf9' },

  /* Phòng đang khóa. Xoá 'cong' khỏi danh sách này để mở lại Phòng Công Nghệ. */
  lockedRooms: ['cong'],

  music: {
    /* API key của YouTube Data API v3, xem README. Để trống thì vẫn chọn thể loại và dán link được. */
    apiKey: '',
    region: 'VN',
    /* query: từ khoá tìm khi có API key. seed: video có sẵn khi chưa có key hoặc khi tìm lỗi. */
    genres: [
      { name: 'Lofi', query: 'lofi chill', seed: [
        { id: 'DWcJFNfaw9c', title: 'lofi hip hop radio - beats to sleep/chill to', channel: 'Lofi Girl' },
        { id: '4xDzrJKXOOY', title: 'synthwave radio - beats to chill/game to', channel: 'Lofi Girl' }
      ] },
      { name: 'Nhạc Việt', query: 'nhạc việt hay nhất', seed: [
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

  tech: {
    intro: 'Terminal này gõ lệnh được. Bấm vào tủ máy chủ hoặc màn hình để bắt đầu.',
    whoami: 'Thức. Thích tự code game, làm trò chơi nhỏ và dựng mọi thứ từ đầu.',
    stack: ['Python + pygame: game pixel kể chuyện', 'Three.js: game 3D và chính căn nhà này', 'HTML, CSS, JavaScript: các trò chơi trên web'],
    projects: [
      { name: 'Đoán đi chờ chi', about: 'Trò diễn tả, đoán chữ cho cặp đôi', url: 'https://github.com/thcphm/doan-di-cho-chi' },
      { name: 'Thức, hay Ngân?', about: 'Trò đoán ý nhau cho cặp đôi', url: 'https://github.com/thcphm/thuc-hay-ngan' },
      { name: 'Hai Mình', about: '46 lá bài trò chuyện cho cặp đôi', url: 'https://github.com/thcphm/hai-minh' }
    ]
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
