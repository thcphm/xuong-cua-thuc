/* Nội dung Phòng Công Nghệ: khóa học YouTube, bài tập, project và link HackerRank, Hack The Box.
   Thêm bài: chép một mục trong shared hoặc own rồi sửa. tests: mỗi test là [dữ liệu vào, kết quả đúng], test đầu là ví dụ. */
window.LAB = (function () {
  var HR = 'https://www.hackerrank.com/domains/';
  var HTB = 'https://academy.hackthebox.com/course/preview/';
  var hr = function (title, note, path) { return { title: title, note: note, url: path.indexOf('http') === 0 ? path : HR + path }; };
  var htb = function (title, note, slug) { return { title: title, note: note, url: slug.indexOf('http') === 0 ? slug : HTB + slug }; };
  var course = function (id, title, channel, count) { return { id: id, title: title, channel: channel, count: count }; };

  /* Làm được bằng mọi ngôn ngữ đọc bàn phím, in màn hình */
  var shared = [
    { id: 'tong-hai-so', title: 'Tổng hai số', level: 'Dễ',
      body: 'Đọc hai số nguyên `a` và `b` trên cùng một dòng. In ra tổng của chúng.',
      tests: [['3 5\n', '8'], ['-4 10\n', '6'], ['1000000 2000000\n', '3000000']] },
    { id: 'lon-nhat', title: 'Số lớn nhất', level: 'Dễ',
      body: 'Dòng đầu là `n`. Dòng sau có `n` số nguyên. In ra số lớn nhất.',
      tests: [['5\n3 9 2 7 4\n', '9'], ['1\n-8\n', '-8'], ['4\n-3 -1 -7 -2\n', '-1']] },
    { id: 'nguyen-am', title: 'Đếm nguyên âm', level: 'Dễ',
      body: 'Đọc một dòng chữ thường không dấu. Đếm số chữ `a`, `e`, `i`, `o`, `u`.',
      tests: [['xuong cua thuc\n', '5'], ['bcdfg\n', '0'], ['aeiou aeiou\n', '10']] },
    { id: 'ping-pong', title: 'Ping Pong', level: 'Dễ',
      body: 'Đọc `n`. In các số từ 1 đến `n`, mỗi số một dòng. Bội của 3 in `Ping`, bội của 5 in `Pong`, bội của cả 3 và 5 in `PingPong`.',
      tests: [['5\n', '1\n2\nPing\n4\nPong'], ['1\n', '1'], ['15\n', '1\n2\nPing\n4\nPong\nPing\n7\n8\nPing\nPong\n11\nPing\n13\n14\nPingPong']] },
    { id: 'nguyen-to', title: 'Số nguyên tố', level: 'Trung bình',
      body: 'Đọc `n` (1 ≤ n ≤ 1 000 000 007). In `YES` nếu `n` là số nguyên tố, ngược lại in `NO`.\n\nThử mọi số đến `n` sẽ quá chậm với số lớn.',
      tests: [['17\n', 'YES'], ['1\n', 'NO'], ['2\n', 'YES'], ['1000000007\n', 'YES'], ['999999999\n', 'NO']] },
    { id: 'dao-tu', title: 'Đảo thứ tự từ', level: 'Trung bình',
      body: 'Đọc một dòng gồm các từ cách nhau bởi một khoảng trắng. In các từ theo thứ tự ngược lại.',
      tests: [['toi yeu lap trinh\n', 'trinh lap yeu toi'], ['mot\n', 'mot'], ['a b c d e\n', 'e d c b a']] },
    { id: 'tu-nhieu-nhat', title: 'Từ xuất hiện nhiều nhất', level: 'Trung bình',
      body: 'Đọc một dòng gồm các từ. In từ xuất hiện nhiều nhất và số lần xuất hiện, cách nhau một khoảng trắng. Nếu nhiều từ bằng nhau, chọn từ nhỏ nhất theo bảng chữ cái.',
      tests: [['meo cho meo ga\n', 'meo 2'], ['b a\n', 'a 1'], ['x y y x z\n', 'x 2']] },
    { id: 'ngoac', title: 'Dãy ngoặc hợp lệ', level: 'Trung bình',
      body: 'Đọc một dòng chỉ gồm các ký tự `()[]{}`. In `YES` nếu các ngoặc đóng mở đúng cặp và đúng thứ tự, ngược lại in `NO`.',
      tests: [['([]{})\n', 'YES'], ['(]\n', 'NO'], ['([)]\n', 'NO'], ['((\n', 'NO'], ['{[()()]}\n', 'YES']] },
    { id: 'doan-con', title: 'Đoạn con có tổng lớn nhất', level: 'Khó',
      body: 'Dòng đầu là `n`. Dòng sau có `n` số nguyên. Tìm đoạn liên tiếp, có ít nhất một phần tử, sao cho tổng lớn nhất. In tổng đó.',
      tests: [['6\n-2 1 -3 4 -1 2\n', '5'], ['1\n-5\n', '-5'], ['5\n1 2 3 4 5\n', '15'], ['4\n-8 -3 -6 -2\n', '-2']] },
    { id: 'me-cung', title: 'Đường ngắn nhất trong mê cung', level: 'Khó',
      body: 'Dòng đầu là `n` và `m`. Tiếp theo là `n` dòng, mỗi dòng `m` ký tự, `.` là ô trống và `#` là tường. Đi từ ô trên cùng bên trái đến ô dưới cùng bên phải, mỗi bước sang một ô kề cạnh. In số bước ít nhất, không đi được thì in `-1`.',
      tests: [['3 3\n...\n.#.\n...\n', '4'], ['2 2\n.#\n#.\n', '-1'], ['1 1\n.\n', '0'], ['3 4\n..#.\n#...\n#.#.\n', '5']] }
  ];

  var tracks = [
    {
      id: 'web', name: 'HTML, CSS', runner: 'web', mode: 'htmlmixed',
      template: '<!doctype html>\n<html lang="vi">\n<head>\n  <meta charset="utf-8">\n  <style>\n    /* CSS của bạn */\n  </style>\n</head>\n<body>\n\n</body>\n</html>\n',
      courses: [
        course('PL_-VfJajZj0U9nEXa4qyfB4U5ZIYCMPlz', 'HTML, CSS từ Zero Tới Hero', 'F8 Official', 113),
        course('PL4-IK0AVhVjOJs_UjdQeyEZ_cmEV3uJvx', 'HTML & CSS for Absolute Beginners', 'Kevin Powell', 50)
      ],
      items: [
        { id: 'tieu-de', title: 'Tiêu đề và đoạn văn', level: 'Dễ',
          body: 'Tạo một thẻ `h1` có chữ `Xin chào`, và một thẻ `p` có nội dung bất kỳ.',
          checks: [['Có h1 với chữ Xin chào', "$('h1')&&$('h1').textContent.trim()==='Xin chào'"], ['Có đoạn văn không rỗng', "$('p')&&$('p').textContent.trim().length>0"]] },
        { id: 'lien-ket-anh', title: 'Liên kết và ảnh', level: 'Dễ',
          body: 'Tạo một liên kết `a` tới địa chỉ bắt đầu bằng `https://`, mở ở tab mới. Thêm một ảnh `img` có thuộc tính `alt` mô tả ảnh.',
          checks: [['Liên kết dùng https', "$('a')&&$('a').getAttribute('href').indexOf('https://')===0"], ['Liên kết mở tab mới', "$('a')&&$('a').target==='_blank'"], ['Ảnh có alt', "$('img')&&$('img').alt.trim().length>0"]] },
        { id: 'danh-sach', title: 'Danh sách việc', level: 'Dễ',
          body: 'Tạo danh sách `ul` có id `viec`, gồm đúng 3 thẻ `li`. Thẻ `li` thứ hai có class `xong`.',
          checks: [['Có ul#viec', "$('ul#viec')"], ['Có đúng 3 li', "$$('ul#viec > li').length===3"], ['li thứ hai có class xong', "$$('ul#viec > li')[1].classList.contains('xong')"]] },
        { id: 'bang', title: 'Bảng điểm', level: 'Dễ',
          body: 'Tạo `table` có `thead` với 3 cột, và `tbody` với 2 dòng. Mỗi dòng có 3 ô.',
          checks: [['thead có 3 cột', "$$('table thead th').length===3"], ['tbody có 2 dòng', "$$('table tbody tr').length===2"], ['Mỗi dòng có 3 ô', "$$('table tbody tr').length>0&&$$('table tbody tr').every(function(r){return r.children.length===3})"]] },
        { id: 'bieu-mau', title: 'Biểu mẫu đăng ký', level: 'Trung bình',
          body: 'Tạo `form` có ô nhập `email` với `id="mail"` và bắt buộc nhập. Thẻ `label` phải gắn với ô đó bằng thuộc tính `for`. Thêm nút gửi `button` kiểu `submit`.',
          checks: [['Ô nhập kiểu email', "$('form input#mail')&&$('#mail').type==='email'"], ['Ô nhập bắt buộc', "$('#mail')&&$('#mail').required"], ['label gắn với ô nhập', "$('label[for=mail]')"], ['Có nút submit', "$('form button[type=submit]')"]] },
        { id: 'the', title: 'Tạo kiểu cho thẻ', level: 'Trung bình',
          body: 'Tạo `div` class `the`. Dùng CSS đặt `padding` 16px, màu nền `rgb(10, 18, 32)`, màu chữ trắng và bo góc 8px.',
          checks: [['padding 16px', "cs($('.the'),'paddingTop')==='16px'"], ['Màu nền đúng', "cs($('.the'),'backgroundColor')==='rgb(10, 18, 32)'"], ['Chữ trắng', "cs($('.the'),'color')==='rgb(255, 255, 255)'"], ['Bo góc 8px', "cs($('.the'),'borderTopLeftRadius')==='8px'"]] },
        { id: 'flex', title: 'Hàng ngang bằng flexbox', level: 'Trung bình',
          body: 'Tạo `div` class `hang` chứa 3 `div` class `o`. Dùng flexbox để 3 ô nằm trên một hàng, cách đều bằng `justify-content: space-between`.',
          checks: [['hang dùng flex', "cs($('.hang'),'display')==='flex'"], ['Có 3 ô', "$$('.hang > .o').length===3"], ['Cách đều hai đầu', "cs($('.hang'),'justifyContent')==='space-between'"], ['Ba ô cùng một hàng', "$$('.hang > .o').length===3&&$$('.hang > .o').every(function(o){return o.offsetTop===$('.hang > .o').offsetTop})"]] },
        { id: 'grid', title: 'Lưới ba cột', level: 'Trung bình',
          body: 'Tạo `div` class `luoi` chứa 6 phần tử con. Dùng CSS grid chia 3 cột bằng nhau, khoảng cách 12px.',
          checks: [['luoi dùng grid', "cs($('.luoi'),'display')==='grid'"], ['Có 6 phần tử', "$('.luoi')&&$('.luoi').children.length===6"], ['Có 3 cột bằng nhau', "(function(){var c=cs($('.luoi'),'gridTemplateColumns').split(' ');return c.length===3&&c[0]===c[1]&&c[1]===c[2]})()"], ['Khoảng cách 12px', "cs($('.luoi'),'columnGap')==='12px'"]] },
        { id: 'responsive', title: 'Co giãn theo màn hình', level: 'Khó',
          body: 'Tạo `nav` dùng flexbox với 3 liên kết. Thêm `@media (max-width: 600px)` chuyển `nav` thành `flex-direction: column`.',
          checks: [['nav có 3 liên kết', "$$('nav a').length===3"], ['nav dùng flex', "cs($('nav'),'display')==='flex'"], ['Có quy tắc @media max-width 600px', "rules().some(function(r){return r.type===4&&/max-width:\\s*600px/.test(r.conditionText||r.media.mediaText)})"], ['Trong @media có flex-direction: column', "rules().some(function(r){return r.type===4&&/flex-direction:\\s*column/.test(r.cssText)})"]] }
      ],
      project: {
        title: 'Trang hồ sơ cá nhân',
        about: 'Dựng trang giới thiệu bản thân qua ba chặng. Mỗi chặng thêm vào cùng một file.',
        steps: [
          { title: 'Bộ khung', body: 'Tạo `header` có `h1`. Trong `header` có `nav` với 3 liên kết tới `#gioi-thieu`, `#du-an`, `#lien-he`. Tạo ba `section` có id tương ứng.',
            checks: [['header có h1', "$('header h1')"], ['nav có 3 liên kết', "$$('header nav a').length===3"], ['Đủ 3 section', "$('section#gioi-thieu')&&$('section#du-an')&&$('section#lien-he')"], ['Liên kết trỏ đúng section', "['gioi-thieu','du-an','lien-he'].every(function(i){return $('nav a[href=\"#'+i+'\"]')})"]] },
          { title: 'Thẻ dự án', body: 'Trong `#du-an`, thêm `div` class `luoi-du-an` dùng CSS grid, chứa ít nhất 3 `article`. Mỗi `article` có `h2` và `p`, viền 1px và bo góc.',
            checks: [['luoi-du-an dùng grid', "cs($('#du-an .luoi-du-an'),'display')==='grid'"], ['Có ít nhất 3 article', "$$('.luoi-du-an article').length>=3"], ['Mỗi article có h2 và p', "$$('.luoi-du-an article').length>0&&$$('.luoi-du-an article').every(function(a){return a.querySelector('h2')&&a.querySelector('p')})"], ['Article có viền và bo góc', "cs($('.luoi-du-an article'),'borderTopWidth')==='1px'&&parseFloat(cs($('.luoi-du-an article'),'borderTopLeftRadius'))>0"]] },
          { title: 'Hoàn thiện', body: 'Thêm `@media (max-width: 600px)` đưa `.luoi-du-an` về một cột. Thêm hiệu ứng `:hover` cho `article`. Trong `#lien-he`, thêm liên kết `mailto:`.',
            checks: [['Có @media max-width 600px', "rules().some(function(r){return r.type===4&&/max-width:\\s*600px/.test(r.conditionText||r.media.mediaText)})"], ['Có article:hover', "rules().some(function(r){return /article:hover/.test(r.selectorText||'')})"], ['Có liên kết mailto', "$('#lien-he a[href^=\"mailto:\"]')"]] }
        ]
      },
      hackerrank: [hr('Chứng chỉ Frontend và CSS', 'HackerRank không có track HTML, CSS riêng. Có bài kiểm tra kỹ năng lấy chứng chỉ.', 'https://www.hackerrank.com/skills-verification')],
      htb: [htb('Introduction to Web Applications', 'Trang web hoạt động thế nào', 'introduction-to-web-applications'), htb('Web Requests', 'HTTP từ góc nhìn bảo mật', 'web-requests'), htb('Cross-Site Scripting', 'Lỗi XSS trong HTML', 'cross-site-scripting-xss')]
    },
    {
      id: 'js', name: 'JavaScript', runner: 'stdio', engine: 'js', mode: 'javascript',
      template: '// readLine() trả về dòng tiếp theo, hết dữ liệu thì trả về null\nconst dong = readLine();\n\nconsole.log(dong);\n',
      courses: [
        course('PL_-VfJajZj0VgpFpEVFzS5Z-lkXtBe-x5', 'Javascript Cơ Bản', 'F8 Official', 117),
        course('PL_-VfJajZj0U1MSx1IMu13oLJq2nM97ac', 'Javascript Nâng Cao', 'F8 Official', 14),
        course('PL4cUxeGkcC9i9Ae2D9Ee1RvylH38dKuET', 'JavaScript Tutorials for Beginners', 'Net Ninja', 47)
      ],
      own: [
        { id: 'js-reduce', title: 'Tổng và lớn nhất bằng reduce', level: 'Trung bình', must: [['\\.reduce\\(', 'Bài này cần dùng reduce']],
          body: 'Dòng đầu là `n`. Dòng sau có `n` số nguyên. Dùng `reduce` để in tổng và số lớn nhất, cách nhau một khoảng trắng.',
          tests: [['4\n1 5 2 3\n', '11 5'], ['1\n-2\n', '-2 -2'], ['3\n-1 -9 -4\n', '-14 -1']] },
        { id: 'js-nhom', title: 'Nhóm theo loại', level: 'Trung bình', must: [['new Map|\\{\\s*\\}', 'Bài này cần dùng Map hoặc object']],
          body: 'Dòng đầu là `n`. Mỗi dòng sau có `loai ten`. Nhóm theo loại rồi in mỗi loại một dòng theo mẫu `loai: ten1, ten2`. Các loại xếp theo bảng chữ cái, tên trong loại giữ thứ tự nhập.',
          tests: [['3\nqua tao\nrau cai\nqua le\n', 'qua: tao, le\nrau: cai'], ['1\na b\n', 'a: b'], ['4\nz q\na w\nz e\na r\n', 'a: w, r\nz: q, e']] }
      ],
      project: {
        title: 'Danh sách việc cần làm',
        about: 'Dòng đầu là số lệnh `q`, mỗi dòng sau là một lệnh. Làm lần lượt ba chặng, chặng sau vẫn phải qua test của chặng trước.',
        steps: [
          { title: 'Thêm và xem', body: '`ADD <nội dung>` thêm việc mới, số thứ tự tăng dần từ 1. `LIST` in mỗi việc một dòng theo mẫu `1 [ ] nội dung`. Chưa có việc nào thì in `EMPTY`.',
            tests: [['3\nLIST\nADD hoc js\nLIST\n', 'EMPTY\n1 [ ] hoc js'], ['3\nADD a b c\nADD d\nLIST\n', '1 [ ] a b c\n2 [ ] d']] },
          { title: 'Đánh dấu xong', body: '`DONE <số>` đánh dấu việc đó là xong, khi `LIST` hiện `[x]`. Số không tồn tại thì in `NOT FOUND`.',
            tests: [['4\nADD a\nDONE 1\nDONE 2\nLIST\n', 'NOT FOUND\n1 [x] a']] },
          { title: 'Hoàn tác', body: '`UNDO` hủy lệnh `ADD` hoặc `DONE` thành công gần nhất. Không còn gì để hủy thì in `NOTHING`. Sau khi hủy `ADD`, số thứ tự đó được dùng lại.',
            tests: [['7\nUNDO\nADD a\nADD b\nDONE 2\nUNDO\nUNDO\nLIST\n', 'NOTHING\n1 [ ] a'], ['5\nADD a\nUNDO\nADD b\nLIST\nUNDO\n', '1 [ ] b']] }
        ]
      },
      hackerrank: [hr('Algorithms', 'HackerRank chưa có track JavaScript riêng. Chọn JavaScript trong ô ngôn ngữ để giải.', 'algorithms'), hr('Data Structures', 'Luyện cấu trúc dữ liệu bằng JavaScript', 'data-structures')],
      htb: [htb('JavaScript Deobfuscation', 'Đọc hiểu mã JavaScript bị làm rối', 'javascript-deobfuscation'), htb('Secure Coding 101: JavaScript', 'Viết JavaScript an toàn', 'secure-coding-101-javascript'), htb('Cross-Site Scripting', 'Lỗi XSS', 'cross-site-scripting-xss')]
    },
    {
      id: 'python', name: 'Python', runner: 'stdio', engine: 'python', mode: 'python',
      template: '# input() đọc một dòng từ bàn phím\ndong = input()\n\nprint(dong)\n',
      courses: [
        course('PL33lvabfss1xczCv2BA0SaNJHu_VXsFtg', 'Lập trình Python cơ bản', 'K team', 36),
        course('PLux-_phi0Rz0Ngc01o_GYe0JUGjL1yIAm', 'Python từ cơ bản tới nâng cao', '28tech', 18),
        course('PLZPZq0r_RZOOkUQbat8LyQii36cJf2SWT', 'Python tutorial for beginners', 'Bro Code', 93)
      ],
      own: [
        { id: 'py-binh-phuong', title: 'Bình phương số chẵn', level: 'Dễ', must: [['\\[[^\\]]*\\bfor\\b', 'Bài này cần dùng list comprehension']],
          body: 'Đọc một dòng các số nguyên. Dùng list comprehension để in bình phương của các số chẵn, cách nhau một khoảng trắng.',
          tests: [['1 2 3 4\n', '4 16'], ['1 3\n', ''], ['-2 0 7\n', '4 0']] },
        { id: 'py-tong-diem', title: 'Tổng điểm theo tên', level: 'Trung bình', must: [['dict\\(|\\{\\s*\\}|defaultdict|Counter', 'Bài này cần dùng dictionary']],
          body: 'Dòng đầu là `n`. Mỗi dòng sau có `ten diem`. Dùng dictionary cộng điểm theo từng tên. In mỗi tên và tổng điểm trên một dòng, xếp theo bảng chữ cái.',
          tests: [['3\nan 5\nbinh 7\nan 2\n', 'an 7\nbinh 7'], ['1\nz 0\n', 'z 0'], ['4\nc 1\nb 2\na 3\nb 4\n', 'a 3\nb 6\nc 1']] }
      ],
      project: {
        title: 'Sổ chi tiêu',
        about: 'Dòng đầu là số lệnh `q`, mỗi dòng sau là một lệnh. Làm lần lượt ba chặng, chặng sau vẫn phải qua test của chặng trước.',
        steps: [
          { title: 'Ghi khoản chi', body: '`ADD <tên> <số tiền>` ghi một khoản chi. `TOTAL` in tổng tiền hiện có.',
            tests: [['3\nADD an 100\nADD uong 50\nTOTAL\n', '150'], ['1\nTOTAL\n', '0']] },
          { title: 'Xóa khoản chi', body: '`REMOVE <tên>` xóa mọi khoản có tên đó. Không có khoản nào thì in `NOT FOUND`.',
            tests: [['5\nADD an 100\nADD an 20\nREMOVE an\nREMOVE an\nTOTAL\n', 'NOT FOUND\n0']] },
          { title: 'Khoản lớn nhất', body: '`TOP <k>` in tối đa `k` tên có tổng tiền lớn nhất theo mẫu `tên tổng`. Bằng tiền thì xếp theo bảng chữ cái.',
            tests: [['6\nADD a 10\nADD b 30\nADD c 30\nADD a 5\nTOP 2\nTOP 9\n', 'b 30\nc 30\nb 30\nc 30\na 15']] }
        ]
      },
      hackerrank: [hr('Track Python', 'Toàn bộ bài theo chủ đề Python', 'python'), hr('Algorithms', 'Giải thuật, chọn Python 3 để giải', 'algorithms'), hr('Data Structures', 'Cấu trúc dữ liệu', 'data-structures')],
      htb: [htb('Introduction to Python', 'Python cho công việc bảo mật', 'introduction-to-python'), htb('Python for Blue Team', 'Tự động hóa phân tích, phòng thủ', 'python-for-blue-team')]
    },
    {
      id: 'c', name: 'C', runner: 'stdio', engine: 'remote', compiler: 'gcc-13.2.0-c', mode: 'text/x-csrc',
      template: '#include <stdio.h>\n\nint main(void) {\n    int a;\n    scanf("%d", &a);\n    printf("%d\\n", a);\n    return 0;\n}\n',
      courses: [
        course('PLux-_phi0Rz2TB5D16sJzy3MgOht3IlND', 'Ngôn Ngữ Lập Trình C', '28tech', 158),
        course('PLyxSzL3F7487Nh-ib25lcLEzhL5mgZkFJ', 'Lập trình C', 'TITV', 95),
        course('PLZPZq0r_RZOOzY_vR4zJM32SqsSInGMwe', 'C tutorial for beginners', 'Bro Code', 46)
      ],
      own: [
        { id: 'c-con-tro', title: 'Hoán đổi bằng con trỏ', level: 'Dễ', must: [['void\\s+\\w+\\s*\\(\\s*int\\s*\\*', 'Bài này cần viết hàm void nhận tham số int *']],
          body: 'Viết hàm `void hoan_doi(int *a, int *b)`. Đọc hai số nguyên, gọi hàm rồi in hai số sau khi đổi chỗ.',
          tests: [['3 8\n', '8 3'], ['0 0\n', '0 0'], ['-1 7\n', '7 -1']] },
        { id: 'c-struct', title: 'Sinh viên điểm cao nhất', level: 'Trung bình', must: [['\\bstruct\\b', 'Bài này cần dùng struct']],
          body: 'Dòng đầu là `n`. Mỗi dòng sau có `ten toan van`, tên không có khoảng trắng. Dùng `struct` để lưu rồi in tên người có tổng điểm cao nhất. Bằng điểm thì lấy người nhập trước.',
          tests: [['3\nan 5 6\nbinh 8 8\nchi 7 2\n', 'binh'], ['2\nx 1 1\ny 2 0\n', 'x'], ['1\nz 0 0\n', 'z']] }
      ],
      project: {
        title: 'Danh bạ',
        about: 'Dòng đầu là số lệnh `q`, mỗi dòng sau là một lệnh. Tên và số không có khoảng trắng. Dùng mảng `struct`, tối đa 100 người.',
        steps: [
          { title: 'Thêm và tìm', body: '`ADD <tên> <số>` thêm người mới. `FIND <tên>` in số của người đó, không có thì in `NOT FOUND`.',
            tests: [['3\nADD an 090\nFIND an\nFIND binh\n', '090\nNOT FOUND']] },
          { title: 'Cập nhật và xóa', body: '`ADD` với tên đã có thì đổi sang số mới. `DELETE <tên>` xóa người đó, không có thì in `NOT FOUND`. `COUNT` in số người hiện có.',
            tests: [['6\nADD an 1\nADD an 2\nFIND an\nCOUNT\nDELETE an\nCOUNT\n', '2\n1\n0'], ['1\nDELETE x\n', 'NOT FOUND']] },
          { title: 'Liệt kê', body: '`LIST` in mỗi người một dòng theo mẫu `tên số`, xếp theo bảng chữ cái của tên. Danh bạ trống thì in `EMPTY`.',
            tests: [['5\nLIST\nADD c 3\nADD a 1\nADD b 2\nLIST\n', 'EMPTY\na 1\nb 2\nc 3']] }
        ]
      },
      hackerrank: [hr('Track C', 'Toàn bộ bài theo chủ đề C', 'c'), hr('Data Structures', 'Cấu trúc dữ liệu, chọn C để giải', 'data-structures')],
      htb: [htb('Stack-Based Buffer Overflows on Linux x86', 'Vì sao C cần cẩn thận với bộ nhớ', 'stack-based-buffer-overflows-on-linux-x86'), htb('Reverse Engineering', 'Đọc chương trình đã biên dịch', 'reverse-engineering')]
    },
    {
      id: 'cpp', name: 'C++', runner: 'stdio', engine: 'remote', compiler: 'gcc-13.2.0', options: '-std=c++17', mode: 'text/x-c++src',
      template: '#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    int a;\n    cin >> a;\n    cout << a << "\\n";\n    return 0;\n}\n',
      courses: [
        course('PLux-_phi0Rz0Hq9fDP4TlOulBl8APKp79', 'Ngôn Ngữ Lập trình C++', '28tech', 89),
        course('PL33lvabfss1xagFyyQPRcppjFKMQ7lvJM', 'Lập trình C++ cơ bản', 'K team', 58),
        course('PL_-VfJajZj0Uo72G_6tSY4NRLpmffeXSA', 'C++ từ cơ bản tới nâng cao', 'F8 Official', 55),
        course('PLlrATfBNZ98dudnM48yfGUldqGD0S4FFb', 'C++', 'The Cherno', 115)
      ],
      own: [
        { id: 'cpp-sort', title: 'Sắp xếp và bỏ trùng', level: 'Dễ', must: [['\\bvector\\s*<|\\bset\\s*<', 'Bài này cần dùng vector hoặc set']],
          body: 'Dòng đầu là `n`. Dòng sau có `n` số nguyên. In các số khác nhau theo thứ tự giảm dần, cách nhau một khoảng trắng.',
          tests: [['5\n3 1 3 2 1\n', '3 2 1'], ['1\n9\n', '9'], ['4\n-1 -1 -1 -1\n', '-1']] },
        { id: 'cpp-map', title: 'Đếm từ bằng map', level: 'Trung bình', must: [['\\bmap\\s*<', 'Bài này cần dùng map']],
          body: 'Đọc các từ đến hết dữ liệu. Dùng `map` để in mỗi từ và số lần xuất hiện trên một dòng, xếp theo bảng chữ cái.',
          tests: [['b a b\n', 'a 1\nb 2'], ['x\nx y\n', 'x 2\ny 1'], ['m\n', 'm 1']] }
      ],
      project: {
        title: 'Bộ nhớ đệm LRU',
        about: 'Dòng đầu là sức chứa `c` và số lệnh `q`, mỗi dòng sau là một lệnh. Khóa và giá trị là số nguyên.',
        steps: [
          { title: 'Lưu và đọc', body: '`SET <khóa> <giá trị>` lưu giá trị. `GET <khóa>` in giá trị, không có thì in `-1`. Chặng này chưa vượt sức chứa.',
            tests: [['2 3\nSET 1 10\nGET 1\nGET 2\n', '10\n-1'], ['1 3\nSET 1 5\nSET 1 6\nGET 1\n', '6']] },
          { title: 'Giới hạn sức chứa', body: 'Khi `SET` một khóa mới mà bộ nhớ đã đầy, xóa khóa ít được dùng gần đây nhất. `SET` và `GET` thành công đều tính là dùng khóa.',
            tests: [['2 6\nSET 1 1\nSET 2 2\nGET 1\nSET 3 3\nGET 2\nGET 1\n', '1\n-1\n1']] },
          { title: 'Thống kê', body: '`SIZE` in số khóa hiện có. `KEYS` in các khóa từ mới dùng nhất đến cũ nhất, cách nhau một khoảng trắng. `KEYS` không làm đổi thứ tự.',
            tests: [['3 7\nSET 1 1\nSET 2 2\nSET 3 3\nGET 1\nSET 4 4\nSIZE\nKEYS\n', '1\n3\n4 1 3']] }
        ]
      },
      hackerrank: [hr('Track C++', 'Toàn bộ bài theo chủ đề C++', 'cpp'), hr('Algorithms', 'Giải thuật, chọn C++ để giải', 'algorithms')],
      htb: [htb('Reverse Engineering 2', 'Assembly x86, thanh ghi, lệnh CPU', 'reverse-engineering-2'), htb('Stack-Based Buffer Overflows on Windows x86', 'Lỗi tràn bộ đệm trên Windows', 'stack-based-buffer-overflows-on-windows-x86')]
    },
    {
      id: 'csharp', name: 'C#', runner: 'stdio', engine: 'remote', compiler: 'mono-6.12.0.199', mode: 'text/x-csharp',
      template: 'using System;\nusing System.Linq;\nusing System.Collections.Generic;\n\nclass Program {\n    static void Main() {\n        string dong = Console.ReadLine();\n        Console.WriteLine(dong);\n    }\n}\n',
      courses: [
        course('PL33lvabfss1wUj15ea6W0A-TtDOrWWSRK', 'Lập trình C# cơ bản', 'K team', 28),
        course('PL33lvabfss1y5jmklzilr2W2LZiltk6bU', 'Lập trình C# nâng cao', 'K team', 17),
        course('PLdo4fOcmZ0oULFjxrOagaERVAMbmG20Xe', 'C# for Beginners', 'dotnet', 19)
      ],
      own: [
        { id: 'cs-linq', title: 'Lọc và cộng bằng LINQ', level: 'Dễ', must: [['\\.Where\\(', 'Bài này cần dùng Where của LINQ']],
          body: 'Đọc một dòng các số nguyên. Dùng LINQ để in tổng các số lớn hơn hoặc bằng 10.',
          tests: [['5 10 20\n', '30'], ['1 2\n', '0'], ['10\n', '10']] },
        { id: 'cs-class', title: 'Lớp hình chữ nhật', level: 'Dễ', must: [['class\\s+Rectangle', 'Bài này cần tạo class Rectangle']],
          body: 'Tạo `class Rectangle` có phương thức `Area()` và `Perimeter()`. Đọc chiều rộng và chiều dài trên một dòng, in diện tích và chu vi.',
          tests: [['2 3\n', '6 10'], ['1 1\n', '1 4'], ['10 5\n', '50 30']] }
      ],
      project: {
        title: 'Quản lý kho',
        about: 'Dòng đầu là số lệnh `q`, mỗi dòng sau là một lệnh. Làm lần lượt ba chặng, chặng sau vẫn phải qua test của chặng trước.',
        steps: [
          { title: 'Nhập và xem', body: '`IN <mặt hàng> <số lượng>` nhập thêm hàng. `STOCK <mặt hàng>` in số lượng hiện có, chưa từng nhập thì in `0`.',
            tests: [['4\nIN but 5\nIN but 2\nSTOCK but\nSTOCK vo\n', '7\n0']] },
          { title: 'Xuất hàng', body: '`OUT <mặt hàng> <số lượng>` xuất hàng. Không đủ hàng thì in `NOT ENOUGH` và giữ nguyên số lượng.',
            tests: [['4\nIN a 3\nOUT a 5\nOUT a 2\nSTOCK a\n', 'NOT ENOUGH\n1']] },
          { title: 'Báo cáo', body: '`REPORT` in các mặt hàng còn số lượng lớn hơn 0 theo mẫu `tên số`, số lượng giảm dần, bằng nhau thì theo bảng chữ cái. Không còn gì thì in `EMPTY`.',
            tests: [['6\nREPORT\nIN b 2\nIN a 2\nIN c 9\nOUT c 9\nREPORT\n', 'EMPTY\na 2\nb 2']] }
        ]
      },
      hackerrank: [hr('Algorithms', 'HackerRank chưa có track C# riêng. Chọn C# trong ô ngôn ngữ để giải.', 'algorithms'), hr('Data Structures', 'Cấu trúc dữ liệu, chọn C# để giải', 'data-structures')],
      htb: [htb('Getting Started', 'Hack The Box chưa có module C# riêng. Đây là điểm bắt đầu chung.', 'getting-started')]
    },
    {
      id: 'java', name: 'Java', runner: 'stdio', engine: 'remote', compiler: 'openjdk-jdk-22+36', mode: 'text/x-java',
      template: 'import java.util.*;\n\nclass Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        int a = sc.nextInt();\n        System.out.println(a);\n    }\n}\n',
      courses: [
        course('PL33lvabfss1yGrOutFR03OZoqm91TSsvs', 'Java cơ bản đến hướng đối tượng', 'K team', 28),
        course('PLyxSzL3F748401hWFgJ8gKMnN6MM8QQ7F', 'Lập trình Java', 'TITV', 105),
        course('PLZPZq0r_RZOOj_NOZYq_R2PECIMglLemc', 'Java tutorial for beginners', 'Bro Code', 71)
      ],
      own: [
        { id: 'java-list', title: 'Bỏ số âm khỏi danh sách', level: 'Dễ', must: [['ArrayList', 'Bài này cần dùng ArrayList']],
          body: 'Dòng đầu là `n`. Dòng sau có `n` số nguyên. Dùng `ArrayList`, bỏ các số âm rồi in phần còn lại, cách nhau một khoảng trắng. Không còn số nào thì in `EMPTY`.',
          tests: [['4\n1 -2 3 -4\n', '1 3'], ['1\n-1\n', 'EMPTY'], ['2\n0 5\n', '0 5']] },
        { id: 'java-hinh', title: 'Tổng diện tích các hình', level: 'Trung bình', must: [['\\binterface\\b', 'Bài này cần dùng interface']],
          body: 'Tạo `interface Shape` có phương thức `area()`. Dòng đầu là `n`. Mỗi dòng sau là `circle r` hoặc `square a`, số nguyên. Lấy pi bằng `3.14`. In tổng diện tích với 2 chữ số thập phân.',
          tests: [['2\ncircle 1\nsquare 2\n', '7.14'], ['1\nsquare 3\n', '9.00'], ['1\ncircle 10\n', '314.00']] }
      ],
      project: {
        title: 'Ngân hàng mini',
        about: 'Dòng đầu là số lệnh `q`, mỗi dòng sau là một lệnh. Tiền là số nguyên. Làm lần lượt ba chặng.',
        steps: [
          { title: 'Mở tài khoản', body: '`OPEN <mã>` mở tài khoản số dư 0. Mã đã có thì in `EXISTS`. `DEPOSIT <mã> <tiền>` nạp tiền. `BALANCE <mã>` in số dư. Mã chưa có thì in `NO ACCOUNT` ở cả hai lệnh này.',
            tests: [['5\nOPEN a\nOPEN a\nDEPOSIT a 50\nBALANCE a\nBALANCE b\n', 'EXISTS\n50\nNO ACCOUNT']] },
          { title: 'Rút tiền', body: '`WITHDRAW <mã> <tiền>` rút tiền. Không đủ tiền thì in `DENIED`. Mã chưa có thì in `NO ACCOUNT`.',
            tests: [['5\nOPEN a\nDEPOSIT a 5\nWITHDRAW a 9\nWITHDRAW a 3\nBALANCE a\n', 'DENIED\n2'], ['1\nWITHDRAW z 1\n', 'NO ACCOUNT']] },
          { title: 'Chuyển khoản', body: '`TRANSFER <từ> <đến> <tiền>` chuyển tiền. Một trong hai mã chưa có thì in `NO ACCOUNT`. Không đủ tiền thì in `DENIED`. Lỗi thì không thay đổi số dư.',
            tests: [['7\nOPEN a\nOPEN b\nDEPOSIT a 10\nTRANSFER a b 4\nTRANSFER a b 99\nBALANCE a\nBALANCE b\n', 'DENIED\n6\n4'], ['2\nOPEN a\nTRANSFER a x 1\n', 'NO ACCOUNT']] }
        ]
      },
      hackerrank: [hr('Track Java', 'Toàn bộ bài theo chủ đề Java', 'java'), hr('Algorithms', 'Giải thuật, chọn Java để giải', 'algorithms')],
      htb: [htb('Spring4Shell', 'Lỗ hổng thật trong ứng dụng Java', 'spring4shell'), htb('Text4Shell', 'Lỗ hổng trong thư viện Java', 'text4shell')]
    },
    {
      id: 'sql', name: 'SQL', runner: 'sql', mode: 'text/x-sql',
      template: 'SELECT *\nFROM san_pham;\n',
      courses: [
        course('PL01fPqVNMdrmtcb_Yui_Oh23X_3laoZoO', 'Tự Học SQL cùng Vịt', 'Vịt làm Data', 94),
        course('PLyxSzL3F7487f2BrlHKg87WlUEennWOKu', 'Học SQL (MySQL)', 'TITV', 25),
        course('PLNcg_FV9n7qZY_2eAtUzEUulNjTJREhQe', 'SQL Ultimate Course', 'Data with Baraa', 56)
      ],
      schemaText: 'khach(id, ten, tinh)\nsan_pham(id, ten, loai, gia)\ndon(id, khach_id, ngay)\nchi_tiet(don_id, san_pham_id, so_luong)',
      schema: "CREATE TABLE khach(id INTEGER PRIMARY KEY, ten TEXT, tinh TEXT);" +
        "INSERT INTO khach VALUES (1,'An','Hà Nội'),(2,'Bình','Huế'),(3,'Chi','Hà Nội'),(4,'Dũng','Đà Nẵng'),(5,'Lan Anh','Huế'),(6,'Minh','Cần Thơ');" +
        "CREATE TABLE san_pham(id INTEGER PRIMARY KEY, ten TEXT, loai TEXT, gia INTEGER);" +
        "INSERT INTO san_pham VALUES (1,'Bàn phím','Phụ kiện',450000),(2,'Chuột','Phụ kiện',250000),(3,'Màn hình','Thiết bị',3200000),(4,'Tai nghe','Âm thanh',900000),(5,'Loa','Âm thanh',1500000),(6,'Webcam','Thiết bị',700000),(7,'Lót chuột','Phụ kiện',90000);" +
        "CREATE TABLE don(id INTEGER PRIMARY KEY, khach_id INTEGER, ngay TEXT);" +
        "INSERT INTO don VALUES (1,1,'2026-01-05'),(2,2,'2026-01-18'),(3,1,'2026-02-03'),(4,3,'2026-02-20'),(5,4,'2026-03-02'),(6,2,'2026-03-15'),(7,1,'2026-03-28');" +
        "CREATE TABLE chi_tiet(don_id INTEGER, san_pham_id INTEGER, so_luong INTEGER);" +
        "INSERT INTO chi_tiet VALUES (1,1,1),(1,2,2),(2,3,1),(3,4,1),(3,7,3),(4,5,1),(4,2,1),(5,6,2),(6,1,2),(6,4,1),(7,3,1),(7,1,1);",
      items: [
        { id: 'loc-gia', title: 'Sản phẩm giá cao', level: 'Dễ',
          body: 'Lấy `ten`, `gia` của sản phẩm có giá từ 900000 trở lên. Xếp giá giảm dần.',
          answer: 'SELECT ten, gia FROM san_pham WHERE gia >= 900000 ORDER BY gia DESC', ordered: true },
        { id: 'distinct', title: 'Các loại sản phẩm', level: 'Dễ',
          body: 'Lấy các giá trị `loai` khác nhau, xếp theo bảng chữ cái.',
          answer: 'SELECT DISTINCT loai FROM san_pham ORDER BY loai', ordered: true },
        { id: 'like', title: 'Tìm khách theo tên', level: 'Dễ',
          body: 'Lấy `id`, `ten` của khách có tên chứa chữ `An`, không phân biệt hoa thường. Xếp theo `id`.',
          answer: "SELECT id, ten FROM khach WHERE ten LIKE '%an%' ORDER BY id", ordered: true },
        { id: 'group-tinh', title: 'Đếm khách theo tỉnh', level: 'Dễ',
          body: 'Lấy `tinh` và số khách ở tỉnh đó. Xếp số khách giảm dần, bằng nhau thì theo tên tỉnh.',
          answer: 'SELECT tinh, COUNT(*) FROM khach GROUP BY tinh ORDER BY COUNT(*) DESC, tinh', ordered: true },
        { id: 'avg', title: 'Giá trung bình theo loại', level: 'Trung bình',
          body: 'Lấy `loai` và giá trung bình làm tròn đến số nguyên bằng `ROUND`. Xếp theo `loai`.',
          answer: 'SELECT loai, ROUND(AVG(gia)) FROM san_pham GROUP BY loai ORDER BY loai', ordered: true },
        { id: 'join-don', title: 'Đơn hàng và tên khách', level: 'Trung bình',
          body: 'Lấy mã đơn, tên khách và ngày của từng đơn. Xếp theo mã đơn.',
          answer: 'SELECT d.id, k.ten, d.ngay FROM don d JOIN khach k ON k.id = d.khach_id ORDER BY d.id', ordered: true },
        { id: 'left-join', title: 'Khách chưa mua hàng', level: 'Trung bình',
          body: 'Lấy `ten` của khách chưa có đơn nào. Xếp theo `ten`.',
          answer: 'SELECT k.ten FROM khach k LEFT JOIN don d ON d.khach_id = k.id WHERE d.id IS NULL ORDER BY k.ten', ordered: true },
        { id: 'tien-don', title: 'Tiền của từng đơn', level: 'Trung bình',
          body: 'Lấy mã đơn và tổng tiền của đơn, tính bằng `gia * so_luong`. Xếp tổng tiền giảm dần, bằng nhau thì theo mã đơn.',
          answer: 'SELECT c.don_id, SUM(s.gia * c.so_luong) t FROM chi_tiet c JOIN san_pham s ON s.id = c.san_pham_id GROUP BY c.don_id ORDER BY t DESC, c.don_id', ordered: true },
        { id: 'having', title: 'Sản phẩm bán chạy', level: 'Khó',
          body: 'Lấy `ten` và tổng số lượng đã bán của sản phẩm bán được từ 3 cái trở lên. Xếp tổng số lượng giảm dần, bằng nhau thì theo `ten`.',
          answer: 'SELECT s.ten, SUM(c.so_luong) t FROM chi_tiet c JOIN san_pham s ON s.id = c.san_pham_id GROUP BY s.id HAVING t >= 3 ORDER BY t DESC, s.ten', ordered: true },
        { id: 'xep-hang', title: 'Khách chi nhiều nhất mỗi tỉnh', level: 'Khó',
          body: 'Với mỗi tỉnh có đơn hàng, lấy `tinh`, tên khách chi nhiều tiền nhất và số tiền đó. Xếp theo `tinh`. Có thể dùng hàm cửa sổ `RANK()`.',
          answer: 'SELECT tinh, ten, t FROM (SELECT k.tinh, k.ten, SUM(s.gia * c.so_luong) t, RANK() OVER (PARTITION BY k.tinh ORDER BY SUM(s.gia * c.so_luong) DESC) r FROM khach k JOIN don d ON d.khach_id = k.id JOIN chi_tiet c ON c.don_id = d.id JOIN san_pham s ON s.id = c.san_pham_id GROUP BY k.id) WHERE r = 1 ORDER BY tinh', ordered: true }
      ],
      project: {
        title: 'Báo cáo doanh thu',
        about: 'Viết ba truy vấn cho báo cáo cuối quý. Mỗi chặng là một truy vấn riêng.',
        steps: [
          { title: 'Doanh thu theo tháng', body: 'Lấy tháng dạng `YYYY-MM` và doanh thu của tháng. Xếp theo tháng tăng dần. Gợi ý: `substr(ngay, 1, 7)`.',
            answer: 'SELECT substr(d.ngay,1,7) m, SUM(s.gia*c.so_luong) FROM don d JOIN chi_tiet c ON c.don_id=d.id JOIN san_pham s ON s.id=c.san_pham_id GROUP BY m ORDER BY m', ordered: true },
          { title: 'Ba sản phẩm doanh thu cao nhất', body: 'Lấy `ten` và doanh thu của 3 sản phẩm cao nhất. Xếp doanh thu giảm dần, bằng nhau thì theo `ten`.',
            answer: 'SELECT s.ten, SUM(s.gia*c.so_luong) t FROM chi_tiet c JOIN san_pham s ON s.id=c.san_pham_id GROUP BY s.id ORDER BY t DESC, s.ten LIMIT 3', ordered: true },
          { title: 'Doanh thu cộng dồn', body: 'Lấy tháng, doanh thu tháng và doanh thu cộng dồn đến tháng đó. Xếp theo tháng. Dùng `SUM(...) OVER (ORDER BY ...)`.',
            answer: 'SELECT m, t, SUM(t) OVER (ORDER BY m) FROM (SELECT substr(d.ngay,1,7) m, SUM(s.gia*c.so_luong) t FROM don d JOIN chi_tiet c ON c.don_id=d.id JOIN san_pham s ON s.id=c.san_pham_id GROUP BY m) ORDER BY m', ordered: true }
        ]
      },
      hackerrank: [hr('Track SQL', 'Truy vấn từ dễ đến khó', 'sql'), hr('Databases', 'Thiết kế và lý thuyết cơ sở dữ liệu', 'databases')],
      htb: [htb('SQL Injection Fundamentals', 'Tấn công và phòng chống SQL injection', 'sql-injection-fundamentals'), htb('SQLMap Essentials', 'Công cụ kiểm tra SQL injection', 'sqlmap-essentials'), htb('Blind SQL Injection', 'Khai thác khi không thấy kết quả', 'blind-sql-injection')]
    },
    {
      id: 'security', name: 'Bảo mật', runner: 'flag',
      courses: [
        course('PLijX7E_0LDO_-v_UhGNujj_NBTysTwzkC', 'Nhập môn An toàn thông tin', 'CyberJutsuTV', 23),
        course('PLWKjhJtqVAbnklGh3FNRLECx_2D_vK3mu', 'Ethical Hacking', 'freeCodeCamp.org', 7)
      ],
      items: [
        { id: 'soi-nguon', title: 'Trang web giấu gì', level: 'Dễ',
          body: 'Trang này nói không có gì để xem. Hãy đọc mã nguồn của nó. Cờ có dạng `TP{...}`.',
          page: '<!doctype html><meta charset="utf-8"><style>body{font:16px sans-serif;background:#fff;color:#222;padding:24px}</style><h1>Kho lưu trữ</h1><p>Không có gì ở đây cả.</p><!-- ghi chú của dev: TP{xem_nguon_la_buoc_dau} -->',
          hash: '0177c7ab9225601a08b27181a87d2ab9cfb2f981a6af02d4a14e7c38c7b82ee5' },
        { id: 'base64', title: 'Chuỗi lạ', level: 'Dễ',
          body: 'Tìm được chuỗi này trong một tệp cấu hình. Đây là mã hóa thật, hay chỉ là một cách viết khác?',
          artifact: 'VFB7YmFzZTY0X2tob25nX3BoYWlfbWFfaG9hfQ==',
          hint: 'Dấu = ở cuối là đặc trưng của Base64. Python có base64.b64decode, JavaScript có atob.',
          hash: 'c74ce761b152da259a8f43c711aae8d02db65ecbda0b56c2e63a658d93de3bf2' },
        { id: 'caesar', title: 'Chữ bị dịch', level: 'Dễ',
          body: 'Mỗi chữ cái đã bị dịch đi cùng một số vị trí trong bảng chữ cái. Biết cờ luôn bắt đầu bằng `TP{`, hãy tìm số vị trí rồi giải.',
          artifact: 'AW{kpjo_job_jhlzhy}',
          hint: 'So sánh A với T. Viết một vòng lặp ở tab Python hoặc JavaScript.',
          hash: 'd0bceaa7d3a97bc20845904407e321777312c08de39d09f8fa89b450ff182222' },
        { id: 'js-roi', title: 'Đoạn mã bị làm rối', level: 'Trung bình',
          body: 'Đoạn JavaScript này chứa cờ nhưng hàm giải chưa bao giờ được gọi. Đọc hiểu hoặc chạy nó.',
          artifact: 'const k = 23;\nconst d = [67, 71, 108, 115, 120, 116, 72, 127, 126, 114, 98, 72, 122, 118, 72, 101, 120, 126, 106];\nfunction giai() {\n  return d.map(c => String.fromCharCode(c ^ k)).join("");\n}',
          hint: 'Dán vào tab JavaScript rồi thêm console.log(giai()).',
          hash: '7d7936fd28be287aba70ccbf667c430fbed967ce572059433c77cb98bf146d22' },
        { id: 'sqli', title: 'Đăng nhập không cần mật khẩu', level: 'Trung bình',
          body: 'Biểu mẫu giả lập này ghép thẳng dữ liệu bạn nhập vào câu SQL, và chỉ chạy trên một cơ sở dữ liệu nằm trong trình duyệt của bạn. Hãy đăng nhập thành tài khoản `admin` mà không biết mật khẩu. Sau đó xem cách sửa: dùng tham số hóa thay vì ghép chuỗi.',
          login: "CREATE TABLE users(username TEXT, password TEXT, secret TEXT);INSERT INTO users VALUES ('admin','x7#Qp!mZ2','TP{hoc_tham_so_hoa}'),('khach','123456','Tài khoản này không có gì đặc biệt');",
          hint: "Dấu nháy đơn kết thúc chuỗi trong SQL, còn -- biến phần sau thành chú thích.",
          hash: '17d8e7d910aecc6d42fbf0b25ba019a5d5998b79b938c838fd59e82d16290ae9' },
        { id: 'pin', title: 'Mã PIN bốn số', level: 'Khó',
          body: 'Đây là SHA-256 của một mã PIN gồm 4 chữ số. Băm không giải ngược được, nhưng chỉ có 10 000 khả năng. Cờ có dạng `TP{mã_pin}`.',
          artifact: 'e25f201f9014599e00073db598a2603a9c05766965336d9b9c68c3d4081ee9a3',
          hint: 'Ở tab Python: dùng hashlib.sha256 và vòng lặp từ 0000 đến 9999.',
          hash: '526d3fbb48fda5ab630e95ed46bf9fe395f68325753d11922d76d8228cc3578c' }
      ],
      project: {
        title: 'Điều tra vụ đột nhập',
        about: 'Một máy chủ giả định đã bị xâm nhập. Lần theo dấu vết qua ba chặng, mỗi chặng nộp một cờ.',
        steps: [
          { title: 'Tìm kẻ tấn công', body: 'Đọc nhật ký. Một địa chỉ IP đã dò mật khẩu nhiều lần rồi đăng nhập được. Cờ có dạng `TP{địa_chỉ_ip}`.',
            artifact: '09:01:12 198.51.100.4 POST /login 200\n09:02:40 203.0.113.77 POST /login 401\n09:02:41 203.0.113.77 POST /login 401\n09:02:42 203.0.113.77 POST /login 401\n09:02:44 192.0.2.15 GET /index 200\n09:02:45 203.0.113.77 POST /login 401\n09:02:46 203.0.113.77 POST /login 401\n09:03:10 198.51.100.4 POST /login 401\n09:03:18 203.0.113.77 POST /login 200\n09:03:40 203.0.113.77 GET /admin/backup 200',
            hash: '3dc24f08c2c1cce291db79d2de1d0b2ad05b1d6bd3cca341c6424fae5cf258c3' },
          { title: 'Giải mã mẩu tin', body: 'Kẻ tấn công để lại mẩu tin bọc hai lớp: Hex, rồi đến Base64.',
            artifact: '5646423761474670583278766346396962324e39',
            hint: 'Giải Hex trước để được chuỗi Base64, rồi giải tiếp.',
            hash: 'fd86c5cf36369baa9a8e384c4cb4cef7818bb396763c72cbd9243f97659e37ec' },
          { title: 'Mở tệp XOR', body: 'Tệp sao lưu bị XOR với khóa lặp lại `XUONG`. Dữ liệu viết ở dạng Hex.',
            artifact: '0c053436282a0a242628390a232f3725',
            hint: 'Với mỗi byte thứ i, lấy XOR với ký tự thứ i % 5 của khóa.',
            hash: '166813c80a72d7f68730edb2cef97126eb6389cd27f09b79a466827beb755d40' }
        ]
      },
      hackerrank: [hr('Security', 'Lý thuyết mật mã và bảo mật', 'security'), hr('Linux Shell', 'Dòng lệnh Linux, nền tảng của bảo mật', 'shell')],
      htb: [
        htb('Starting Point', 'Máy thực hành đầu tiên, cần tài khoản Hack The Box', 'https://app.hackthebox.com/starting-point'),
        htb('Linux Fundamentals', 'Làm quen Linux và shell', 'linux-fundamentals'),
        htb('Introduction to Networking', 'Mạng máy tính căn bản', 'introduction-to-networking'),
        htb('Getting Started', 'Bước đầu kiểm thử xâm nhập', 'getting-started'),
        htb('Toàn bộ module', 'Danh mục Hack The Box Academy', 'https://academy.hackthebox.com/catalogue')
      ]
    }
  ];

  return { shared: shared, tracks: tracks };
})();
