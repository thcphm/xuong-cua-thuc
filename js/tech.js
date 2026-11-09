/* Phòng Công Nghệ: danh sách dự án và một terminal gõ lệnh được. */
window.Tech = (function () {
  var SITE = window.SITE;
  var $ = function (id) { return document.getElementById(id); };
  var output, input;

  function print(text, className) {
    var line = document.createElement('p');
    if (className) line.className = className;
    line.textContent = text;
    output.append(line);
    output.scrollTop = output.scrollHeight;
  }
  var ROOMS = { nhac: 'nhac', sach: 'sach', hoc: 'hoc', giaitri: 'game', 'giai-tri': 'game', congnghe: 'cong', sanh: '' };
  var COMMANDS = {
    help: function () {
      print('help          xem các lệnh');
      print('whoami        mình là ai');
      print('projects      các dự án');
      print('stack         công cụ mình dùng');
      print('open <số>     mở dự án trên GitHub');
      print('cd <phòng>    sang phòng: nhac, sach, hoc, giaitri, sanh');
      print('clear         xoá màn hình');
    },
    whoami: function () { print(SITE.tech.whoami); },
    stack: function () { SITE.tech.stack.forEach(function (s) { print(s); }); },
    projects: function () {
      SITE.tech.projects.forEach(function (p, i) { print((i + 1) + '  ' + p.name + ': ' + p.about); });
    },
    open: function (arg) {
      var project = SITE.tech.projects[Number(arg) - 1];
      if (!project) return print('Không có dự án số ' + (arg || '?') + '. Gõ projects để xem danh sách.', 'err');
      print('Đang mở ' + project.name);
      window.open(project.url, '_blank', 'noopener');
    },
    cd: function (arg) {
      if (!(arg in ROOMS)) return print('Không có phòng "' + (arg || '') + '". Thử: nhac, sach, hoc, giaitri, sanh.', 'err');
      location.hash = ROOMS[arg];
    },
    clear: function () { output.replaceChildren(); }
  };

  function run(raw) {
    var parts = raw.trim().split(/\s+/);
    if (!parts[0]) return;
    print('thuc@xuong:~$ ' + raw, 'cmd');
    var fn = Object.prototype.hasOwnProperty.call(COMMANDS, parts[0]) ? COMMANDS[parts[0]] : null;
    if (fn) fn(parts[1]);
    else print('Không có lệnh ' + parts[0] + '. Gõ help để xem lệnh.', 'err');
  }

  return {
    init: function () {
      output = $('termOutput');
      input = $('termInput');
      $('congIntro').textContent = SITE.tech.intro;
      print('Xưởng của Thức. Gõ help để bắt đầu.');
      $('termForm').addEventListener('submit', function (e) {
        e.preventDefault();
        run(input.value);
        input.value = '';
      });
      $('terminal').addEventListener('click', function () { input.focus(); });
      SITE.tech.projects.forEach(function (p) {
        var li = document.createElement('li');
        li.className = 'game-row';
        var a = document.createElement('a');
        a.href = p.url;
        a.target = '_blank';
        a.rel = 'noopener';
        a.textContent = p.name;
        var about = document.createElement('p');
        about.className = 'kind';
        about.textContent = p.about;
        li.append(a, about);
        $('projectList').append(li);
      });
      document.addEventListener('tp:terminal', function () { input.focus(); });
    }
  };
})();
