const fs = require('fs');
const path = require('path');

const newN3Readings = [
  // ==========================================
  // N3 SERIES 2: Klub Fotografi Kampus (5 Bab)
  // ==========================================
  {
    id: 'n3-s2-1',
    series: 'Kisah Klub Fotografi Kampus',
    seriesPart: 1,
    nextId: 'n3-s2-2',
    prevId: null,
    level: 'N3',
    title: '大学のサークル勧誘と運命の出会い',
    titleArti: 'Perekrutan Klub Kampus dan Pertemuan Takdir',
    paragraphs: [
      '桜の花びらが舞い散る四月、大学のキャンパスは新入生を迎え入れる歓迎ムードで活気に満ち溢れていました。並木道には各部活やサークルの勧誘ブースがずらりと並び、上級生たちが大きな声でチラシを配りながら熱心に勧誘活動を繰り広げていました。留学生のハルトは、異国のキャンパスの圧倒的な熱気に気圧されながら歩いていました。',
      '人混みから少し離れた静かな銀杏の木の下で、古い一眼レフカメラを首から下げた女性の先輩が、白黒の風景写真が貼られた看板の横に静かに立っていました。その写真に写る、光と影が織りなす下町の路地の情景に、ハルトは一瞬で目を奪われ、自然と足が止まりました。',
      '「写真に興味があるの？」と優しく微笑みかけてくれたのは、写真部部長の美咲先輩でした。先輩はカメラの構造や、瞬間を切り取ることの魅力を熱心に語り聞かせてくれました。ハルトは「言葉だけでは表現しきれない日本の美しさを、写真を通じて発見したい」と率直な想いを伝えました。',
      '美咲先輩は力強く頷き、「言葉の壁なんて関係ないよ。大切なのは、被写体に向ける真摯な視線と思いやりだから」と背中を押してくれました。その温かい言葉に導かれ、ハルトは迷わず写真部の扉を叩くことを決意したのです。'
    ],
    translations: [
      'Bulan April tatkala kelopak bunga sakura menari-nari ditiup angin, kampus universitas semarak oleh atmosfer penyambutan mahasiswa baru. Di sepanjang jalan setapak berjejer stan rekrutmen berbagai klub dan kegiatan mahasiswa, para senior membagikan pamflet seraya berseru lantang mempromosikan klub mereka. Haruto, seorang mahasiswa asing, melangkah seraya terpana oleh gelora semangat kampus asing tersebut.',
      'Di bawah rindangnya pohon ginkgo kuno yang agak terpisah dari kerumunan, seorang mahasiswi senior berkalung kamera SLR klasik berdiri tenang di samping papan pajangan foto lanskap hitam putih. Menatap jepretan gang sempit kota tua yang memadukan indahnya cahaya dan bayangan di foto itu, pandangan Haruto seketika terpaku dan langkahnya terhenti secara alami.',
      '\"Kamu tertarik dengan fotografi ya?\" sapa Misaki-senpai selaku ketua klub fotografi sambil tersenyum ramah. Sang senior bertutur penuh gairah mengenai mekanisme kamera dan pesona mengabadikan momentum sekilas. Haruto pun mengungkapkan isi hatinya secara tulus, \"Saya ingin menemukan keindahan Jepang yang tak sanggup diutarakan kata-kata semata melalui fotografi.\".',
      'Misaki-senpai mengangguk mantap, \"Sekat bahasa bukanlah halangan. Yang terpenting adalah tatapan tulus dan kepekaan rasa yang kautujukan pada objek foto.\". Terdorong oleh perkataan hangat itu, tanpa ragu Haruto memantapkan hati bergabung dengan klub fotografi.'
    ]
  },
  {
    id: 'n3-s2-2',
    series: 'Kisah Klub Fotografi Kampus',
    seriesPart: 2,
    nextId: 'n3-s2-3',
    prevId: 'n3-s2-1',
    level: 'N3',
    title: '初めての撮影合宿：富士山の麓へ',
    titleArti: 'Kemah Pemotretan Pertama: Menuju Kaki Gunung Fuji',
    paragraphs: [
      '初夏を告げる新緑の季節、写真部は伝統の撮影合宿を開催することになり、メンバー全員で山梨県の富士五湖へ向かいました。貸切バスの中では、構図の黄金比や光の角度の選び方について熱い議論が交わされ、ハルトはノートに熱心にメモを取りながら知識を吸収していきました。',
      '早朝四時、肌寒い霧が立ち込める河口湖の畔に三脚を立てて待機しました。徐々に東の空が白み始め、朝焼けの光が水面に映り込むと、雄大な富士山が茜色の空を背景にくっきりと姿を現しました。その息を呑むほど神々しい情景に、全員が無言でシャッターを切り続けました。',
      'ハルトは先輩のアドバイスを思い出しながら、露出と焦点を慎重に調整しました。単に風景を記録するのではなく、朝の静寂と冷たい空気の張り詰めた緊張感を一枚の写真に封じ込めるよう、全身の神経を集中させました。',
      '宿に戻った後のミーティングでは、各自が撮影したデータをプロジェクターに投影して講評し合いました。「ハルトの写真は、異国の地ならではの新鮮な驚きが素直に表現されていて素晴らしい」と全員から絶賛され、ハルトは大きな自信と達成感に包まれました。'
    ],
    translations: [
      'Memasuki musim semi menjelang musim panas yang berhias dedaunan hijau segar, klub fotografi menggelar kemah pemotretan tradisional dan seluruh anggota bertolak ke Danau Fuji Five Lakes di Prefektur Yamanashi. Di dalam bus carteran, perdebatan seru mengenai rasio emas komposisi dan sudut pencahayaan saling bertukar, Haruto pun tekun mencatat di buku catatan menyerap ilmu.',
      'Pukul empat subuh, mereka mendirikan tripod dan siaga di tepi Danau Kawaguchi yang diselimuti kabut dingin menusuk tulang. Perlahan langit timur merekah kemerahan, pantulan fajar membias di permukaan air dan Gunung Fuji yang megah menampakkan siluet gagahnya di bawah langit merah saga. Menatap panorama sakral yang menakjubkan itu, semua orang terus menekan tombol rana kamera dalam keheningan khusyuk.',
      'Mengingat petunjuk seniornya, Haruto menyetel eksposur dan titik fokus kamera secara saksama. Alih-alih sekadar mendokumentasikan pemandangan, ia memusatkan segenap rasa demi mengunci ketenangan fajar dan hawa dingin yang hening ke dalam selembar foto.',
      'Dalam pertemuan setelah kembali ke penginapan, hasil jepretan masing-masing diproyeksikan ke layar proyektor untuk saling dievaluasi. \"Foto Haruto mengekspresikan kekaguman polos yang segar dari sudut pandang pemuda rantau secara luar biasa,\" puji rekan-rekannya, membuat dada Haruto dipenuhi rasa percaya diri dan kepuasan yang mendalam.'
    ]
  },
  {
    id: 'n3-s2-3',
    series: 'Kisah Klub Fotografi Kampus',
    seriesPart: 3,
    nextId: 'n3-s2-4',
    prevId: 'n3-s2-2',
    level: 'N3',
    title: '暗室での現像作業と予期せぬトラブル',
    titleArti: 'Proses Cetak di Kamar Gelap dan Masalah Tak Terduga',
    paragraphs: [
      '合宿を終えた後、部員たちはフィルムカメラで撮影した作品を自分たちの手で現像するため、部室の奥にある暗室に集まりました。赤く薄暗いセーフライトが灯る空間で、薬品の独特のツンとした匂いが立ち込めていました。デジタルとは異なり、一度のミスが大切なフィルムを台無しにしてしまう極めて繊細な作業です。',
      'ハルトは先輩の作業を見よう見まねで、現像液の温度を測り、時間をストップウォッチで計りながらフィルムをタンクにセットしました。しかし、途中で緊張のあまり撹拌のタイミングを間違えてしまい、印画紙に現れた画像はコントラストが著しく乱れ、全体が黒ずんでしまいました。',
      '「大事な写真だったのに、僕の不注意で台無しにしてしまいました……」と激しく落ち込むハルトの肩を、美咲先輩が優しく叩きました。「落ち込む必要はないよ。薬品の希釈度や露光時間を調整すれば、この影を生かしたドラマチックな一枚に焼き直すことができるから。」',
      '先輩の指導の下で何度も試行錯誤を繰り返した結果、闇の中から浮かび上がったのは、朝露に濡れた富士山の圧倒的な陰影を強調した、息を呑むような一枚でした。失敗の中にこそ新たな表現の可能性が眠っているのだと、ハルトは暗室の暗闇の中で深く学んだのです。'
    ],
    translations: [
      'Usai kemah pemotretan, para anggota berkumpul di kamar gelap (darkroom) di sudut ruang klub demi mencetak karya film analog dengan tangan mereka sendiri. Di dalam ruangan temaram berhias lampu merah safelight, menguar aroma asam khas cairan kimiawi. Berbeda dari kamera digital, setitik kesalahan bisa memusnahkan gulungan film berharga dalam sekejap.',
      'Sambil mencontoh senior, Haruto mengukur suhu cairan pengembang dan menyetel waktu dengan stopwatch seraya memasang film ke tabung tangki. Namun karena terlalu gugup di tengah proses, ia keliru menentukan ritme pengadukan kimiawi; alhasil gambar yang muncul di kertas foto tampak gelap gosong dengan kontras yang rusak parah.',
      '\"Padahal ini foto yang sangat berharga, tapi karena kecerobohan saya semuanya hancur...\" ratap Haruto terpukul. Misaki-senpai menepuk pundaknya lembut, \"Tak perlu putus asa. Kalau kita atur konsentrasi kimiawi dan durasi eksposur cahayanya, bayangan pekat ini justru bisa dicetak ulang menjadi karya dramatis yang memukau.\".',
      'Melalui uji coba berulang kali di bawah bimbingan sang senior, gambar yang menyeruak dari kegelapan adalah foto fajar Gunung Fuji berbasuh embun yang menonjolkan bayangan mistis nan menakjubkan. Di pekatnya kamar gelap, Haruto memetik pelajaran bahwa justru di balik kegagalan tersembunyi peluang artistik yang baru.'
    ]
  },
  {
    id: 'n3-s2-4',
    series: 'Kisah Klub Fotografi Kampus',
    seriesPart: 4,
    nextId: 'n3-s2-5',
    prevId: 'n3-s2-3',
    level: 'N3',
    title: '学園祭の写真展と心を通わせる作品',
    titleArti: 'Pameran Foto Festival Kampus dan Karya yang Menyentuh Hati',
    paragraphs: [
      '秋晴れの心地よい十月、大学最大のイベントである学園祭が幕を開けました。写真部はメイン校舎の教室を貸し切り、「光と人の記憶」をテーマにした年次写真展を開催しました。黒い布で装飾された壁面には、部員たちが情熱を注ぎ込んだ力作が整然と展示され、朝から多くの学生や市民が足を運びました。',
      'ハルトが出品した作品は、暗室での苦闘の末に完成させた「朝露の富士山」と、下町の駄菓子屋で子どもたちと語り合うおばあちゃんの笑顔を捉えたスナップ写真の二点でした。展示スペースの前で足を止め、長い時間じっと作品を見つめる年配の男性の姿がありました。',
      'その男性はハルトに気づくと、目を潤ませながら語りかけてくれました。「この駄菓子屋の写真、私の生まれ故郷の風景にそっくりです。遠い昔の温かい思い出が鮮やかに蘇って、心が救われましたよ。」外国人の若者が日本の何気ない日常の美しさを捉えてくれたことに、心からの感謝を伝えてくれたのです。',
      '自分の写真が誰かの心の琴線に触れ、忘れかけていた大切な記憶を呼び起こす力を持っている。その確信を得た瞬間、ハルトの胸は言葉にできない感動で満たされ、写真を続けてきて本当によかったと心から実感しました。'
    ],
    translations: [
      'Bulan Oktober yang sejuk di bawah langit musim gugur cerah, hajatan akbar festival kampus (gakuensai) resmi dibuka. Klub fotografi menyewa ruang kelas di gedung utama dan menggelar pameran foto tahunan bertajuk \"Memori Cahaya dan Manusia\". Di dinding berbalut kain hitam, deretan karya penuh dedikasi para anggota tertata rapi, dikunjungi banyak mahasiswa dan masyarakat umum sejak pagi.',
      'Karya yang dipamerkan Haruto adalah foto \"Fajar Gunung Fuji Berembun\" hasil pergulatan di kamar gelap, serta foto candid yang menangkap tawa hangat seorang nenek penjual jajanan tradisional yang mengobrol bersama anak-anak di gang kota tua. Di depan bingkai fotonya, seorang pria paruh baya berdiri tertegun lama menatap karya tersebut.',
      'Menyadari keberadaan Haruto, pria itu berucap dengan mata berkaca-kaca, \"Foto kedai jajanan ini persis sekali dengan pemandangan di kampung halaman kelahiran saya. Kenangan manis masa lampau seketika hidup kembali dan menghibur jiwa saya.\" Ia menyampaikan rasa terima kasih mendalam karena pemuda asing mampu memotret keindahan keseharian Jepang secara begitu menyentuh.',
      'Menyadari bahwa karyanya sanggup menggetarkan sanubari orang lain dan membangkitkan memori berharga yang nyaris terlupakan, dada Haruto dipenuhi keharuan yang tak terlukiskan kata-kata; ia sungguh bersyukur menekuni seni fotografi.'
    ]
  },
  {
    id: 'n3-s2-5',
    series: 'Kisah Klub Fotografi Kampus',
    seriesPart: 5,
    nextId: null,
    prevId: 'n3-s2-4',
    level: 'N3',
    title: '先輩の卒業と受け継がれる情熱',
    titleArti: 'Kelulusan Senior dan Semangat yang Diwariskan',
    paragraphs: [
      '木枯らしが吹き抜ける二月、四年生の部員たちが旅立つ卒業の季節を迎えました。部室で行われた幹部交代式において、部長の美咲先輩から新部長としてハルトが指名されました。留学生である自分が伝統ある写真部の重責を担えるのかと戸惑うハルトに、美咲先輩は部室の鍵と一台の古いカメラを手渡しました。',
      '「ハルトだから頼むんだよ。君はこの一年間、国籍の違いを乗り越えて誰よりも真摯に写真と向き合い、部員みんなを温かく結びつけてくれた。君の視点があれば、この写真部はもっと素晴らしい場所になる。」全員から拍手と歓声が沸き起こり、ハルトは涙を堪えながら力強く頷きました。',
      '先輩たちを見送った後、ハルトは暗室に入り、壁に並ぶ歴代の部員たちの写真を静かに眺めました。そこには、時代を超えて受け継がれてきた情熱と友情の軌跡が克明に記録されていました。',
      '新しい春が来れば、また新しい新入生たちがこの扉を開けるでしょう。その時、かつて自分が先輩から受け取った温かい光と情熱を、次の世代へと全力で届けていこうと、ハルトは固く心に誓ったのでした。'
    ],
    translations: [
      'Bulan Februari tatkala angin dingin meniup ranting pepohonan, tiba musim kelulusan di mana para anggota angkatan empat bertolak meninggalkan kampus. Dalam upacara serah terima kepengurusan di ruang klub, Misaki-senpai mengumumkan penunjukan Haruto sebagai ketua klub fotografi yang baru. Di tengah rasa ragu apakah dirinya sebagai mahasiswa asing mampu memikul tanggung jawab sebesar itu, Misaki-senpai menyerahkan kunci ruang klub dan sebuah kamera klasik.',
      '\"Justru karena kamu adalah Haruto, makanya aku percaya. Selama satu tahun ini, melampaui perbedaan bangsa, kamu menekuni fotografi lebih tulus dari siapa pun dan menyatukan seluruh anggota dengan hangat. Bersama perspektifmu, klub ini akan berkembang jauh lebih hebat.\" Tepuk tangan dan sorak haru membahana, membuat Haruto mengangguk mantap seraya menahan haru.',
      'Usai melepas kepergian para senior, Haruto melangkah ke kamar gelap dan menatap deretan foto para anggota dari masa ke masa di dinding. Di sana terukir jejak gairah dan persahabatan yang diwariskan menembus batas zaman.',
      'Tatkala musim semi baru tiba kelak, mahasiswa-mahasiswa baru akan kembali membuka pintu ruangan ini. Pada saat itu, Haruto berikrar dalam hati akan meneruskan pendar cahaya hangat dan gairah yang dahulu ia terima dari senior kepada generasi berikutnya sekuat tenaga.'
    ]
  },

  // ==========================================
  // N3 THEMATIC READINGS (Tambahan 5 Judul)
  // ==========================================
  {
    id: 'n3-c4',
    series: 'Budaya & Filosofi Hidup',
    seriesPart: 1,
    nextId: 'n3-c5',
    prevId: null,
    level: 'N3',
    title: '日本の「もったいない」精神と環境保護の知恵',
    titleArti: 'Semangat \"Mottainai\" Jepang dan Kearifan Menjaga Lingkungan',
    paragraphs: [
      '日本語の「もったいない」という言葉は、物や資源を無駄にすることを惜しみ、その本来の価値を尊重する深い道徳的な概念を含んでいます。この言葉はかつて、ノーベル平和賞を受賞した環境活動家によって世界共通の標語として国際的に紹介され、地球規模の環境保護の合言葉として大きな注目を集めました。',
      '古くから資源の乏しい島国であった日本において、人々は限られた自然の恵みを最後まで使い切る工夫を重ねてきました。例えば、古い着物を解いて布団や雑巾に仕立て直したり、割れた陶器を漆と金粉で美しく修復する「金継ぎ」の技術など、傷ついた物に新たな命を吹き込む高度なリサイクルの知恵が発達しました。',
      '現代の消費社会において、安価で便利な大量生産品が溢れる一方で、私たちは物を簡単に捨ててしまう傾向にあります。しかし、壊れたものを直して長く愛用し、食べ残しを出さないように工夫する「もったいない」の精神は、持続可能な未来を築くための最も身近で強力な武器となります。',
      '物に対する感謝と敬意を忘れないこの日本の伝統的な哲学は、環境危機の時代を迎えた現代の地球社会において、改めて再評価されるべき貴重な人類の遺産なのです。'
    ],
    translations: [
      'Istilah \"Mottainai\" dalam bahasa Jepang memuat konsep moral mendalam yang menyayangkan terbuang sia-sianya benda atau sumber daya serta menghormati nilai hakikinya. Kata ini pernah diperkenalkan secara internasional oleh aktivis lingkungan peraih Nobel Perdamaian sebagai slogan universal global, menuai perhatian luas sebagai seruan pelestarian lingkungan hidup dunia.',
      'Di Jepang yang sedari dahulu merupakan negara kepulauan miskin sumber daya alam, warganya memeras otak memaksimalkan anugerah alam yang terbatas hingga titik penghabisan. Contohnya, mendaur ulang kain kimono usang menjadi selimut atau lap pembersih, serta seni \"Kintsugi\" yang merekatkan pecahan keramik menggunakan getah pernis dan serbuk emas; berkembang kearifan daur ulang tingkat tinggi yang memberi napas kehidupan baru pada benda yang rusak.',
      'Di tengah masyarakat konsumerisme modern yang dibanjiri produk massal murah nan praktis, manusia cenderung mudah membuang barang. Kendati demikian, filosofi \"Mottainai\" untuk memperbaiki barang rusak agar awet dipakai dan tidak menyisakan makanan adalah senjata terampuh paling membumi untuk membangun masa depan berkelanjutan.',
      'Kearifan tradisional Jepang yang tidak melupakan rasa syukur dan takzim pada materi benda ini merupakan warisan luhur kemanusiaan yang wajib ditinjau kembali di era krisis ekologi saat ini.'
    ]
  },
  {
    id: 'n3-c5',
    series: 'Budaya & Filosofi Hidup',
    seriesPart: 2,
    nextId: 'n3-c6',
    prevId: 'n3-c4',
    level: 'N3',
    title: '地震への備えと日本の防災訓練',
    titleArti: 'Kesiapsiagaan Menghadapi Gempa dan Simulasi Mitigasi Bencana Jepang',
    paragraphs: [
      '世界で発生するマグニチュード六以上の大地震の約二割が日本周辺で発生していると言われるほど、日本は常に自然災害の脅威と隣り合わせの環境にあります。それゆえ、日本社会においては「防災」という意識が国民一人ひとりの生活の中に極めて深く定着しています。',
      '学校や企業、地域自治体では、定期的に実践的な防災訓練が実施されます。緊急地震速報の警報音が鳴った瞬間に机の下に潜り込んで頭部を保護する訓練から、煙が充満した部屋からの避難体験、消火器の使い方やAEDを用いた救命処置の講習まで、具体的な行動マニュアルが徹底的に教育されます。',
      'さらに、多くの家庭では常に数日分の食料や飲料水、簡易トイレや携帯ラジオを備蓄した非常用持ち出し袋が玄関付近に準備されています。家具が倒れないように固定器具を取り付け、家族間で災害時の連絡方法や集合場所を事前に確認し合う習慣も広く普及しています。',
      '災害そのものを防ぐことは不可能ですが、徹底した日頃の準備と冷静な判断力によって被害を最小限に抑える「減災」の知恵こそが、危機から大切な命を守り抜く最大の防壁となるのです。'
    ],
    translations: [
      'Hingga dikatakan sekitar dua puluh persen gempa bumi berkekuatan magnitudo enam ke atas di dunia terjadi di sekitar perairan Jepang, negeri sakura ini senantiasa hidup berdampingan dengan ancaman bencana alam. Oleh karenanya, kesadaran mitigasi bencana (bousai) mengakar amat mendalam di dalam nadi kehidupan segenap warga Jepang.',
      'Di sekolah, korporasi, hingga komunitas rukun warga, simulasi mitigasi bencana berskala nyata digelar rutin. Mulai dari refleks berlindung di bawah kolong meja melindungi kepala saat sirene peringatan dini gempa meraung, simulasi evakuasi ruangan penuh asap, hingga pelatihan penggunaan alat pemadam api dan pertolongan pertama alat pacu jantung AED diajarkan secara disiplin.',
      'Terlebih lagi, mayoritas rumah tangga menyiagakan tas siaga darurat berisi persediaan makanan dan air minum untuk beberapa hari, toilet darurat, dan radio portabel di dekat pintu depan rumah. Memasang penahan furnitur agar tidak roboh serta menyepakati lokasi evakuasi dan kanal komunikasi darurat antaranggota keluarga pun telah menjadi kebiasaan luas.',
      'Mustahil menolak terjadinya bencana alam, namun kearifan \"Gensai\" (mereduksi dampak bencana) melalui kesiapsiagaan harian yang terukur serta ketenangan bertindak adalah benteng terkokoh untuk melindungi nyawa yang berharga dari marabahaya.'
    ]
  },
  {
    id: 'n3-c6',
    series: 'Budaya & Filosofi Hidup',
    seriesPart: 3,
    nextId: 'n3-c7',
    prevId: 'n3-c5',
    level: 'N3',
    title: '日本の漫画・アニメ文化が世界に与える影響',
    titleArti: 'Dampak Budaya Manga & Anime Jepang terhadap Dunia',
    paragraphs: [
      'かつて子どもの娯楽と見なされていた日本の漫画やアニメーションは、現在では世界的な影響力を持つ現代日本文化の代表格として国際的な地位を確立しました。国境や言語の壁を越え、何百万人ものファンが日本の作品に熱中し、国際的な文化交流の強力な架け橋となっています。',
      '日本のアニメや漫画が世界中の人々を惹きつける最大の魅力は、緻密に練られたストーリー展開と、単純な善悪二元論にとどまらない複雑で人間味あふれるキャラクター描写にあります。友情や努力、挫折からの成長、そして生きることの切なさといった普遍的なテーマが、美麗な作画と演出によって感動的に表現されています。',
      'さらに、アニメをきっかけに日本文化や歴史に関心を持ち、日本語の学習を始めたり、作品の舞台となった実在の聖地を訪れるインバウンド観光客も年々増加しています。アニメは世界の人々にとって、日本への親近感を醸成する最も身近な窓口となっているのです。',
      '豊かな想像力とクリエイターたちの飽くなき情熱から生まれるコンテンツは、異文化の相互理解を深め、世界中の人々の心をつなぐ素晴らしい文化的ソフトパワーを発揮し続けています。'
    ],
    translations: [
      'Manga dan anime Jepang yang dahulunya dipandang sebelah mata sekadar hiburan anak-anak, kini mengukuhkan posisinya di panggung internasional sebagai ikon budaya kontemporer Jepang berdaya pengaruh raksasa dunia. Menembus sekat batas negara dan bahasa, jutaan penggemar menggandrungi karya-karya Jepang, menjadikannya jembatan emas pertukaran budaya global.',
      'Daya tarik terbesar yang memikat masyarakat dunia terletak pada jalinan plot narasi yang dirajut apik dan karakterisasi manusiawi yang kompleks di luar sekadar hitam-putih kebaikan versus kejahatan. Tema-tema universal seperti persahabatan, ikhtiar keras, bangkit dari kegagalan, dan harunya eksistensi kehidupan diekspresikan secara menyentuh melalui tata visual yang indah.',
      'Terlebih lagi, bermula dari anime, minat pada kebudayaan dan sejarah Jepang terpicu, mendorong banyak orang belajar bahasa Jepang hingga bertamasya napak tilas (seichi junrei) ke lokasi nyata yang menjadi latar anime. Anime telah menjadi jendela terakrab yang memupuk rasa simpati dan kedekatan dunia terhadap Jepang.',
      'Kandungan karya yang lahir dari imajinasi subur dan gairah tanpa henti para kreator terus memancarkan kekuatan diplomasi budaya lunak (soft power) yang memukau dalam mempererat saling pengertian antarperadaban.'
    ]
  },
  {
    id: 'n3-c7',
    series: 'Budaya & Filosofi Hidup',
    seriesPart: 4,
    nextId: 'n3-c8',
    prevId: 'n3-c6',
    level: 'N3',
    title: '古民家カフェのブーム：伝統とモダンの融合',
    titleArti: 'Tren Kafe Rumah Tradisional Kominka: Perpaduan Warisan dan Modernitas',
    paragraphs: [
      '近年、日本各地で築五十年から百年以上の歴史を持つ古い民家を改装し、現代的なカフェや宿泊施設として再生させる「古民家リノベーション」が大流行しています。黒光りする太い梁や柱、土壁や格子戸といった日本建築の伝統的な趣を残しながら、最新の設備と洗練されたインテリアを導入した空間は、幅広い世代を魅了しています。',
      '無機質なコンクリートのビルに囲まれた都会の生活に疲れた人々にとって、木と畳の温もりに包まれた古民家カフェは、時間の流れがゆっくりと感じられる最高の隠れ家です。窓越しに季節の花が咲く日本庭園を眺めながら、地元産のオーガニック食材を使った料理や丁寧なハンドドリップコーヒーを味わう贅沢は格別です。',
      'このブームは、単なる観光スポットの創出にとどまらず、少子高齢化によって地方に増え続ける「空き家問題」を解決し、地域の歴史遺産を次の世代へ継承する有効な手段としても高く評価されています。若い起業家たちが地方へ移住して古民家を開業する動きも活発化しています。',
      '古いものの価値を見直し、新しい息吹を吹き込んで共存させる古民家再生の試みは、持続可能な地域社会の発展と文化の保存を結びつける素晴らしい現代の知恵なのです。'
    ],
    translations: [
      'Beberapa tahun belakangan, di berbagai penjuru Jepang tengah marak tren renovasi rumah tua tradisional (Kominka) berusia lima puluh hingga ratusan tahun menjadi kafe modern maupun penginapan elok. Menyuguhkan balok tiang kayu hitam pekat, dinding tanah liat, dan pintu kisi-kisi tradisional Jepang berdampingan dengan fasilitas mutakhir dan perabot interior trendi, ruang ini memikat lintas generasi.',
      'Bagi insan yang penat oleh hiruk-pikuk rimba beton perkotaan yang kaku, kafe rumah tradisional yang memeluk hangat dengan aroma kayu dan tatami adalah suaka terbaik di mana waktu terasa melambat. Memandang taman tradisional Jepang di balik jendela sambil menyesap kopi seduh manual dan hidangan bahan pangan organik lokal menghadirkan kemewahan relaksasi yang istimewa.',
      'Tren ini bukan sekadar melahirkan destinasi wisata, melainkan dinilai tinggi sebagai solusi ampuh menuntaskan krisis rumah kosong (akiya) di daerah akibat penuaan demografi serta mewariskan cagar budaya lokal ke generasi penerus. Semakin banyak wirausahawan muda yang hijrah ke pedesaan merintis kafe rumah tua ini.',
      'Ikhtiar meninjau ulang keluhuran masa silam dan menyuntikkan napas segar modernitas pada rumah pusaka ini adalah kearifan kontemporer gemilang yang menyatukan pelestarian budaya dengan kemajuan ekonomi lokal berkelanjutan.'
    ]
  },
  {
    id: 'n3-c8',
    series: 'Budaya & Filosofi Hidup',
    seriesPart: 5,
    nextId: null,
    prevId: 'n3-c7',
    level: 'N3',
    title: '日本のビジネスマナー：名刺交換とお辞儀の作法',
    titleArti: 'Etika Bisnis Jepang: Tata Cara Bertukar Kartu Nama dan Membungkuk',
    paragraphs: [
      '日本で社会人として働く際、最初に徹底的な指導を受けるのが「ビジネスマナー」の基本作法です。中でも初対面の相手と行う「名刺交換」と、状況に応じた「お辞儀（会釈・敬礼・最敬礼）」の使い分けは、相手に対する敬意と誠実さを可視化するための極めて重要なコミュニケーションの儀礼です。',
      '名刺交換において、名刺は単なる連絡先のメモではなく「相手の分身」として丁寧に扱われます。必ず立ち上がり、両手で名刺入れの上に名刺を載せて相手の胸の高さより低く差し出すこと、受け取った名刺をすぐにしまわず、商談中は机の左上に綺麗に並べて置くことなど、細やかなルールが厳格に守られます。',
      'また、お辞儀にも角度によって明確な意味の違いが存在します。すれ違い時の軽い挨拶である十五度の「会釈」、顧客を迎える標準的な三十度の「敬礼」、そして深い感謝や謝罪を表す四十五度の「最敬礼」と、背筋を伸ばして腰から曲げる美しい所作が求められます。',
      '外国人の目には形式的で厳格すぎるように映るかもしれませんが、これらのマナーは無駄な摩擦を防ぎ、お互いが心地よく信頼関係を築くための洗練された社会的な知恵なのです。'
    ],
    translations: [
      'Saat berkarier di lingkungan profesional di Jepang, hal pertama yang digembleng secara disiplin adalah etika tata krama bisnis (business manners). Di antaranya, pertukaran kartu nama (meishi koukan) tatkala bersua pertama kali serta klasifikasi membungkuk (ojigi: eshaku, keirei, saikeirei) sesuai situasi merupakan ritual komunikasi sakral untuk mengejawantahkan rasa hormat dan integritas.',
      'Dalam pertukaran kartu nama, kartu nama tidak dipandang sekadar catatan kontak, melainkan representasi jiwa lawan bicara. Wajib berdiri, menyodorkan kartu dengan kedua belah tangan di atas dompet kartu nama lebih rendah dari dada lawan bicara, serta tidak langsung menyimpannya melainkan menatanya rapi di sudut kiri meja selama perundingan bisnis adalah aturan tata krama yang ditaati ketat.',
      'Membungkuk pun memiliki gradasi sudut dengan signifikansi yang presisi: membungkuk 15 derajat (eshaku) untuk tegur sapa berpapasan, 30 derajat (keirei) untuk menyambut klien bisnis, hingga 45 derajat (saikeirei) untuk menyatakan rasa syukur atau permohonan maaf mendalam, dilakukan anggun dengan meluruskan punggung bertumpu pada pinggul.',
      'Meskipun di mata orang asing tampak sangat formal dan kaku, etika ini sesungguhnya adalah kearifan sosial yang terasah matang guna mencegah friksi dan merajut jalinan relasi saling percaya yang nyaman.'
    ]
  }
];

console.log('New N3 readings count:', newN3Readings.length);
fs.writeFileSync(path.join(__dirname, 'new_n3.json'), JSON.stringify(newN3Readings, null, 2));
