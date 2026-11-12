/* Kho của J.E.F.F ở Phòng Bếp: nguyên liệu để chọn trong tủ lạnh và các món nấu được.
   Đây là món cơm nhà quen thuộc, công thức viết lại ngắn gọn để gợi ý, nêm nếm theo khẩu vị.
   Thêm món: thêm một mục vào `recipes`. `need` là id nguyên liệu bắt buộc, lấy từ `groups`.
   `meals`: 'sang', 'trua', 'toi'. `minutes`: tổng thời gian nấu ước lượng.
   `qty`: lượng từng nguyên liệu cho `serves` người, tính theo `unit` của nguyên liệu đó. Lượng là số ước tính. */
window.KITCHEN = {
  /* Công thức viết cho bấy nhiêu người ăn */
  serves: 2,
  /* Gia vị coi như nhà nào cũng có, không cần chọn */
  pantry: 'muối, đường, nước mắm, nước tương, dầu ăn, tiêu, hành, tỏi, ớt',
  groups: [
    {
      title: 'Thịt, cá, trứng, đậu',
      items: [
        { id: 'trung', name: 'Trứng', unit: 'quả' }, { id: 'thit-heo', name: 'Thịt heo', unit: 'g' }, { id: 'thit-xay', name: 'Thịt xay', unit: 'g' }, { id: 'suon', name: 'Sườn heo', unit: 'g' },
        { id: 'thit-bo', name: 'Thịt bò', unit: 'g' }, { id: 'thit-ga', name: 'Thịt gà', unit: 'g' }, { id: 'ca', name: 'Cá', unit: 'g' }, { id: 'tom', name: 'Tôm', unit: 'g' }, { id: 'dau-hu', name: 'Đậu hũ', unit: 'miếng' }
      ]
    },
    {
      title: 'Rau củ',
      items: [
        { id: 'ca-chua', name: 'Cà chua', unit: 'quả' }, { id: 'rau-muong', name: 'Rau muống', unit: 'bó' }, { id: 'cai-xanh', name: 'Cải xanh', unit: 'bó' }, { id: 'rau-ngot', name: 'Rau ngót', unit: 'bó' },
        { id: 'bap-cai', name: 'Bắp cải', unit: 'g' }, { id: 'bi-do', name: 'Bí đỏ', unit: 'g' }, { id: 'khoai-tay', name: 'Khoai tây', unit: 'củ' }, { id: 'ca-rot', name: 'Cà rốt', unit: 'củ' },
        { id: 'kho-qua', name: 'Khổ qua', unit: 'quả' }, { id: 'ca-tim', name: 'Cà tím', unit: 'quả' }, { id: 'dau-que', name: 'Đậu que', unit: 'g' }, { id: 'hanh-tay', name: 'Hành tây', unit: 'củ' },
        { id: 'nam', name: 'Nấm', unit: 'g' }, { id: 'gia', name: 'Giá', unit: 'g' }, { id: 'dua-leo', name: 'Dưa leo', unit: 'quả' }, { id: 'thom', name: 'Thơm (dứa)', unit: 'quả' },
        { id: 'gung', name: 'Gừng', unit: 'nhánh' }, { id: 'sa', name: 'Sả', unit: 'cây' }
      ]
    },
    {
      title: 'Cơm, mì, bún',
      items: [
        { id: 'com', name: 'Cơm nguội', unit: 'chén' }, { id: 'gao', name: 'Gạo', unit: 'g' }, { id: 'mi-goi', name: 'Mì gói', unit: 'gói' }, { id: 'bun', name: 'Bún tươi', unit: 'g' }, { id: 'banh-mi', name: 'Bánh mì', unit: 'ổ' }
      ]
    }
  ],
  recipes: [
    {
      id: 'trung-chien', name: 'Trứng chiên hành', meals: ['sang', 'trua', 'toi'], minutes: 10, need: ['trung'], qty: { 'trung': 3 },
      steps: ['Đập trứng ra tô, thêm hành lá cắt nhỏ, chút nước mắm và tiêu, đánh tan.', 'Làm nóng dầu trong chảo, đổ trứng vào, để lửa vừa.', 'Mặt dưới vàng thì lật, chiên thêm khoảng một phút rồi lấy ra.']
    },
    {
      id: 'trung-sot-ca', name: 'Trứng sốt cà chua', meals: ['sang', 'trua', 'toi'], minutes: 15, need: ['trung', 'ca-chua'], qty: { 'trung': 3, 'ca-chua': 2 },
      steps: ['Cà chua cắt múi. Trứng đánh tan với chút muối.', 'Phi thơm hành tỏi, cho cà chua vào xào mềm, nêm nước mắm và chút đường.', 'Đổ trứng vào, khuấy nhẹ tới khi trứng vừa chín thì tắt bếp.']
    },
    {
      id: 'canh-ca-chua-trung', name: 'Canh cà chua trứng', meals: ['trua', 'toi'], minutes: 15, need: ['ca-chua', 'trung'], qty: { 'ca-chua': 2, 'trung': 2 },
      steps: ['Phi thơm hành, xào cà chua cắt múi cho ra màu.', 'Thêm nước, đun sôi, nêm muối và nước mắm.', 'Đổ trứng đã đánh tan vào từ từ, khuấy nhẹ cho trứng thành vân. Thêm hành lá rồi tắt bếp.']
    },
    {
      id: 'rau-muong-xao-toi', name: 'Rau muống xào tỏi', meals: ['trua', 'toi'], minutes: 10, need: ['rau-muong'], qty: { 'rau-muong': 1 },
      steps: ['Rau muống nhặt, rửa sạch, để ráo. Tỏi đập dập.', 'Đun dầu thật nóng, phi tỏi thơm rồi cho rau vào, xào lửa lớn.', 'Nêm nước mắm hoặc muối, đảo nhanh khoảng hai phút cho rau còn giòn.']
    },
    {
      id: 'canh-rau-ngot-thit-xay', name: 'Canh rau ngót thịt xay', meals: ['trua', 'toi'], minutes: 20, need: ['rau-ngot', 'thit-xay'], qty: { 'rau-ngot': 1, 'thit-xay': 100 },
      steps: ['Rau ngót tuốt lá, rửa sạch, vò nhẹ. Thịt xay ướp chút muối và tiêu.', 'Phi hành, xào thịt cho săn, thêm nước và đun sôi, hớt bọt.', 'Cho rau vào, nấu khoảng năm phút, nêm lại cho vừa ăn.']
    },
    {
      id: 'thit-kho-trung', name: 'Thịt kho trứng', meals: ['trua', 'toi'], minutes: 60, need: ['thit-heo', 'trung'], qty: { 'thit-heo': 300, 'trung': 4 },
      steps: ['Thịt cắt miếng vừa, ướp nước mắm, đường, hành tỏi băm khoảng 20 phút. Trứng luộc chín, bóc vỏ.', 'Thắng chút đường cho lên màu, cho thịt vào đảo săn.', 'Thêm nước (hoặc nước dừa nếu có) ngập thịt, cho trứng vào, kho lửa nhỏ tới khi thịt mềm.']
    },
    {
      id: 'thit-luoc', name: 'Thịt luộc chấm mắm', meals: ['trua', 'toi'], minutes: 30, need: ['thit-heo'], qty: { 'thit-heo': 300 },
      steps: ['Đun nước sôi với chút muối và vài lát hành, cho thịt nguyên miếng vào.', 'Luộc lửa vừa khoảng 20 đến 25 phút, xiên đũa không còn nước hồng là chín.', 'Vớt ra để nguội bớt, thái mỏng, chấm nước mắm tỏi ớt.']
    },
    {
      id: 'suon-ram-man', name: 'Sườn ram mặn', meals: ['trua', 'toi'], minutes: 40, need: ['suon'], qty: { 'suon': 400 },
      steps: ['Sườn chặt miếng, chần nước sôi rồi rửa lại. Ướp nước mắm, đường, tiêu, hành tỏi băm.', 'Cho sườn vào chảo với chút nước, đun lửa vừa tới khi sườn mềm và nước cạn.', 'Hạ lửa, đảo đều tới khi sườn vàng và nước sốt bám quanh miếng sườn.']
    },
    {
      id: 'canh-khoai-tay-ca-rot-suon', name: 'Canh sườn khoai tây cà rốt', meals: ['trua', 'toi'], minutes: 50, need: ['suon', 'khoai-tay', 'ca-rot'], qty: { 'suon': 300, 'khoai-tay': 2, 'ca-rot': 1 },
      steps: ['Sườn chần nước sôi, rửa sạch. Khoai tây và cà rốt gọt vỏ, cắt khúc.', 'Hầm sườn với nước khoảng 25 phút, hớt bọt.', 'Cho cà rốt rồi khoai tây vào, nấu tới khi mềm, nêm muối và nước mắm.']
    },
    {
      id: 'ga-kho-gung', name: 'Gà kho gừng', meals: ['trua', 'toi'], minutes: 35, need: ['thit-ga', 'gung'], qty: { 'thit-ga': 400, 'gung': 1 },
      steps: ['Gà chặt miếng, ướp nước mắm, đường, tiêu và nửa phần gừng thái sợi.', 'Phi thơm tỏi và gừng còn lại, cho gà vào đảo săn.', 'Thêm chút nước, kho lửa nhỏ tới khi gà chín mềm và nước sánh lại.']
    },
    {
      id: 'ga-xao-sa-ot', name: 'Gà xào sả ớt', meals: ['trua', 'toi'], minutes: 30, need: ['thit-ga', 'sa'], qty: { 'thit-ga': 400, 'sa': 3 },
      steps: ['Gà chặt miếng nhỏ, ướp nước mắm, đường và sả băm.', 'Phi thơm tỏi, sả và ớt băm, cho gà vào xào lửa lớn cho săn.', 'Hạ lửa, đậy nắp tới khi gà chín, mở nắp đảo cho ráo và thơm.']
    },
    {
      id: 'canh-ga-nam', name: 'Canh gà nấu nấm', meals: ['trua', 'toi'], minutes: 30, need: ['thit-ga', 'nam'], qty: { 'thit-ga': 300, 'nam': 150 },
      steps: ['Gà chặt miếng nhỏ, ướp chút muối. Nấm rửa sạch, cắt đôi.', 'Phi hành, xào gà cho săn, thêm nước, nấu khoảng 15 phút, hớt bọt.', 'Cho nấm vào nấu thêm năm phút, nêm lại, thêm hành lá.']
    },
    {
      id: 'bo-xao-hanh-tay', name: 'Bò xào hành tây', meals: ['trua', 'toi'], minutes: 15, need: ['thit-bo', 'hanh-tay'], qty: { 'thit-bo': 200, 'hanh-tay': 1 },
      steps: ['Thịt bò thái mỏng ngang thớ, ướp nước tương, tỏi băm, chút dầu ăn. Hành tây cắt múi.', 'Đun chảo thật nóng, xào bò nhanh tay tới khi vừa tái, lấy ra.', 'Xào hành tây gần chín, cho bò trở lại, đảo đều, rắc tiêu.']
    },
    {
      id: 'bo-xao-dau-que', name: 'Bò xào đậu que', meals: ['trua', 'toi'], minutes: 20, need: ['thit-bo', 'dau-que'], qty: { 'thit-bo': 150, 'dau-que': 200 },
      steps: ['Đậu que tước xơ, cắt khúc, chần sơ nước sôi. Bò thái mỏng, ướp nước tương và tỏi.', 'Xào bò lửa lớn cho vừa tái rồi lấy ra.', 'Xào đậu que với tỏi tới khi chín giòn, cho bò vào đảo đều, nêm lại.']
    },
    {
      id: 'nam-xao-bo', name: 'Nấm xào thịt bò', meals: ['trua', 'toi'], minutes: 15, need: ['nam', 'thit-bo'], qty: { 'nam': 200, 'thit-bo': 150 },
      steps: ['Bò thái mỏng, ướp nước tương và tỏi. Nấm rửa sạch, cắt miếng vừa ăn.', 'Xào bò lửa lớn cho vừa tái, lấy ra.', 'Xào nấm tới khi mềm và ráo nước, cho bò vào đảo đều, rắc tiêu.']
    },
    {
      id: 'ca-kho-to', name: 'Cá kho tộ', meals: ['trua', 'toi'], minutes: 45, need: ['ca'], qty: { 'ca': 400 },
      steps: ['Cá cắt khúc, ướp nước mắm, đường, tiêu, hành tỏi băm khoảng 20 phút.', 'Thắng chút đường cho lên màu, xếp cá vào, rưới nước ướp.', 'Thêm ít nước, kho lửa nhỏ tới khi nước sánh lại, thỉnh thoảng rưới nước lên mặt cá.']
    },
    {
      id: 'ca-chien-sot-ca', name: 'Cá chiên sốt cà chua', meals: ['trua', 'toi'], minutes: 30, need: ['ca', 'ca-chua'], qty: { 'ca': 400, 'ca-chua': 2 },
      steps: ['Cá lau thật khô, chiên vàng hai mặt rồi lấy ra.', 'Phi hành tỏi, xào cà chua băm tới khi nhuyễn, nêm nước mắm và đường, thêm chút nước.', 'Cho cá vào sốt, đun nhỏ lửa vài phút cho thấm.']
    },
    {
      id: 'canh-chua-ca', name: 'Canh chua cá', meals: ['trua', 'toi'], minutes: 35, need: ['ca', 'ca-chua', 'thom', 'gia'], qty: { 'ca': 300, 'ca-chua': 2, 'thom': 0.25, 'gia': 100 },
      steps: ['Đun sôi nước, cho cá vào nấu chín rồi vớt ra để cá không nát.', 'Cho thơm và cà chua vào nồi, nêm me hoặc nước cốt chanh, nước mắm, đường cho ra vị chua ngọt.', 'Cho cá trở lại, thêm giá, sôi lại thì tắt bếp.']
    },
    {
      id: 'tom-rim', name: 'Tôm rim', meals: ['trua', 'toi'], minutes: 20, need: ['tom'], qty: { 'tom': 300 },
      steps: ['Tôm cắt râu, rửa sạch, để ráo.', 'Phi tỏi, cho tôm vào đảo tới khi đổi màu.', 'Nêm nước mắm và đường, thêm chút nước, rim lửa nhỏ tới khi nước sánh và bám vào tôm.']
    },
    {
      id: 'bap-cai-xao-tom', name: 'Bắp cải xào tôm', meals: ['trua', 'toi'], minutes: 15, need: ['bap-cai', 'tom'], qty: { 'bap-cai': 300, 'tom': 150 },
      steps: ['Bắp cải thái sợi vừa. Tôm bóc vỏ, ướp chút muối và tiêu.', 'Phi tỏi, xào tôm chín rồi lấy ra.', 'Xào bắp cải lửa lớn tới khi chín giòn, cho tôm vào đảo đều, nêm lại.']
    },
    {
      id: 'bap-cai-luoc', name: 'Bắp cải luộc', meals: ['trua', 'toi'], minutes: 10, need: ['bap-cai'], qty: { 'bap-cai': 400 },
      steps: ['Bắp cải tách lá, cắt miếng vừa ăn, rửa sạch.', 'Đun nước sôi với chút muối, cho bắp cải vào luộc khoảng ba phút.', 'Vớt ra để ráo, chấm nước mắm. Nước luộc dùng làm canh.']
    },
    {
      id: 'canh-bi-do-thit-xay', name: 'Canh bí đỏ thịt xay', meals: ['trua', 'toi'], minutes: 25, need: ['bi-do', 'thit-xay'], qty: { 'bi-do': 300, 'thit-xay': 100 },
      steps: ['Bí đỏ gọt vỏ, cắt miếng vừa ăn. Thịt xay ướp chút muối và tiêu.', 'Phi hành, xào thịt cho săn, thêm nước và đun sôi.', 'Cho bí vào nấu tới khi mềm, nêm lại, thêm hành lá.']
    },
    {
      id: 'canh-kho-qua-nhoi-thit', name: 'Canh khổ qua nhồi thịt', meals: ['trua', 'toi'], minutes: 40, need: ['kho-qua', 'thit-xay'], qty: { 'kho-qua': 2, 'thit-xay': 200 },
      steps: ['Khổ qua cắt khúc, bỏ ruột. Thịt xay trộn hành băm, muối, tiêu.', 'Nhồi thịt vào từng khúc khổ qua.', 'Đun sôi nước, thả khổ qua vào, hầm lửa nhỏ khoảng 25 phút tới khi mềm, nêm lại.']
    },
    {
      id: 'kho-qua-xao-trung', name: 'Khổ qua xào trứng', meals: ['trua', 'toi'], minutes: 15, need: ['kho-qua', 'trung'], qty: { 'kho-qua': 1, 'trung': 2 },
      steps: ['Khổ qua bỏ ruột, thái lát mỏng. Trứng đánh tan với chút nước mắm.', 'Phi tỏi, xào khổ qua tới khi vừa chín.', 'Đổ trứng vào, đảo đều tới khi trứng chín và bám vào khổ qua.']
    },
    {
      id: 'dau-hu-sot-ca', name: 'Đậu hũ sốt cà chua', meals: ['trua', 'toi'], minutes: 20, need: ['dau-hu', 'ca-chua'], qty: { 'dau-hu': 3, 'ca-chua': 2 },
      steps: ['Đậu hũ cắt miếng, chiên vàng các mặt.', 'Phi hành, xào cà chua băm cho nhuyễn, nêm nước mắm và đường, thêm chút nước.', 'Cho đậu vào, đun nhỏ lửa vài phút cho thấm, rắc hành lá.']
    },
    {
      id: 'dau-hu-nhoi-thit', name: 'Đậu hũ nhồi thịt sốt cà', meals: ['trua', 'toi'], minutes: 35, need: ['dau-hu', 'thit-xay', 'ca-chua'], qty: { 'dau-hu': 4, 'thit-xay': 150, 'ca-chua': 2 },
      steps: ['Đậu hũ chiên vàng, rạch một đường ở cạnh. Thịt xay trộn hành băm, muối, tiêu rồi nhồi vào đậu.', 'Xào cà chua băm cho nhuyễn, nêm nước mắm và đường, thêm nước.', 'Xếp đậu vào sốt, đậy nắp, đun lửa nhỏ khoảng 15 phút cho thịt chín.']
    },
    {
      id: 'dau-hu-sot-nam', name: 'Đậu hũ sốt nấm', meals: ['trua', 'toi'], minutes: 20, need: ['dau-hu', 'nam'], qty: { 'dau-hu': 3, 'nam': 150 },
      steps: ['Đậu hũ cắt miếng, chiên vàng. Nấm rửa sạch, cắt miếng.', 'Phi tỏi, xào nấm tới khi mềm, nêm nước tương và chút đường, thêm ít nước.', 'Cho đậu vào, đun nhỏ lửa vài phút cho thấm.']
    },
    {
      id: 'canh-cai-xanh-thit-xay', name: 'Canh cải xanh thịt xay', meals: ['trua', 'toi'], minutes: 15, need: ['cai-xanh', 'thit-xay'], qty: { 'cai-xanh': 1, 'thit-xay': 100 },
      steps: ['Cải xanh rửa sạch, cắt khúc. Thịt xay ướp chút muối và tiêu.', 'Phi hành, xào thịt cho săn, thêm nước và đun sôi, hớt bọt.', 'Cho cải vào, sôi lại khoảng hai phút thì tắt bếp. Thêm vài lát gừng nếu có.']
    },
    {
      id: 'ca-tim-xao-thit-xay', name: 'Cà tím xào thịt xay', meals: ['trua', 'toi'], minutes: 20, need: ['ca-tim', 'thit-xay'], qty: { 'ca-tim': 2, 'thit-xay': 100 },
      steps: ['Cà tím cắt khúc, ngâm nước muối loãng vài phút rồi để ráo.', 'Phi tỏi, xào thịt xay cho săn.', 'Cho cà tím vào, nêm nước mắm và chút đường, thêm ít nước, đậy nắp tới khi cà mềm.']
    },
    {
      id: 'thit-heo-xao-dau-que', name: 'Thịt heo xào đậu que', meals: ['trua', 'toi'], minutes: 20, need: ['thit-heo', 'dau-que'], qty: { 'thit-heo': 150, 'dau-que': 200 },
      steps: ['Thịt thái mỏng, ướp nước mắm và tỏi. Đậu que tước xơ, cắt khúc.', 'Xào thịt tới khi chín, lấy ra.', 'Xào đậu que với chút nước tới khi chín giòn, cho thịt vào đảo đều, nêm lại.']
    },
    {
      id: 'com-chien-trung', name: 'Cơm chiên trứng', meals: ['sang', 'trua', 'toi'], minutes: 15, need: ['com', 'trung'], qty: { 'com': 3, 'trung': 2 },
      steps: ['Cơm nguội bóp tơi. Trứng đánh tan.', 'Phi tỏi, đổ trứng vào khuấy cho tơi rồi cho cơm vào, đảo lửa lớn.', 'Nêm nước mắm hoặc nước tương, đảo tới khi hạt cơm săn, rắc hành lá và tiêu.']
    },
    {
      id: 'chao-thit-trung', name: 'Cháo thịt xay trứng', meals: ['sang', 'toi'], minutes: 40, need: ['gao', 'thit-xay', 'trung'], qty: { 'gao': 100, 'thit-xay': 100, 'trung': 2 },
      steps: ['Gạo vo sạch, nấu với nhiều nước, lửa nhỏ, tới khi hạt gạo nở bung.', 'Xào thịt xay với hành cho săn rồi cho vào nồi cháo, nêm muối và nước mắm.', 'Đập trứng vào, khuấy đều cho trứng chín, rắc tiêu và hành lá.']
    },
    {
      id: 'mi-trung-ca-chua', name: 'Mì gói trứng cà chua', meals: ['sang', 'toi'], minutes: 10, need: ['mi-goi', 'trung', 'ca-chua'], qty: { 'mi-goi': 2, 'trung': 2, 'ca-chua': 1 },
      steps: ['Phi hành, xào cà chua cắt múi cho mềm, thêm nước và đun sôi.', 'Cho mì và nửa gói gia vị vào, nấu khoảng hai phút.', 'Đập trứng vào, để thêm một phút rồi tắt bếp.']
    },
    {
      id: 'mi-xao-bo-cai', name: 'Mì xào bò cải xanh', meals: ['trua', 'toi'], minutes: 15, need: ['mi-goi', 'thit-bo', 'cai-xanh'], qty: { 'mi-goi': 2, 'thit-bo': 150, 'cai-xanh': 1 },
      steps: ['Mì trụng nước sôi cho vừa mềm, để ráo. Bò thái mỏng, ướp nước tương và tỏi.', 'Xào bò lửa lớn cho vừa tái, lấy ra. Xào cải xanh tới khi vừa chín.', 'Cho mì và bò vào, nêm nước tương, đảo đều.']
    },
    {
      id: 'banh-mi-op-la', name: 'Bánh mì ốp la', meals: ['sang'], minutes: 10, need: ['banh-mi', 'trung'], qty: { 'banh-mi': 2, 'trung': 4 },
      steps: ['Làm nóng dầu trong chảo, đập trứng vào, để lửa vừa.', 'Chiên tới khi lòng trắng chín, lòng đỏ chín theo ý thích. Rắc muối và tiêu.', 'Ăn kèm bánh mì nóng, thêm dưa leo hoặc nước tương nếu thích.']
    },
    {
      id: 'bun-thit-xao', name: 'Bún thịt xào', meals: ['trua', 'toi'], minutes: 30, need: ['bun', 'thit-heo', 'dua-leo', 'gia'], qty: { 'bun': 400, 'thit-heo': 200, 'dua-leo': 1, 'gia': 100 },
      steps: ['Thịt thái mỏng, ướp nước mắm, đường, tỏi và sả băm nếu có, rồi xào chín.', 'Dưa leo thái sợi, giá chần sơ. Pha nước mắm chua ngọt với tỏi ớt.', 'Xếp bún vào tô, thêm rau, thịt xào, rưới nước mắm lên rồi trộn đều.']
    }
  ]
};
