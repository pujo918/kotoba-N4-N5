// Generator for 18 new N3 reading passages
const fs = require('fs');

const n3Readings = [
  // === SERIES 3: Misteri Kafe Buku di Gang Tua (5 Bab) ===
  {
    id: "n3-s3-1",
    series: "Misteri Kafe Buku di Gang Tua",
    seriesPart: 1,
    nextId: "n3-s3-2",
    prevId: null,
    level: "N3",
    title: "雨宿りと路地裏の古本カフェ",
    titleArti: "Berteduh dari Hujan dan Kafe Buku Tua di Gang Sempit",
    paragraphs: [
      "突然降り出した激しい夕立を避けるため、大学生のタクヤは神保町の迷路のような細い路地に飛び込みました。ビルの隙間にひっそりと佇む木造の引き戸の上に、「風待文庫」と書かれた小さな木製看板が掲げられていました。傘を持っていなかった彼は、促されるようにその扉を静かに開けました。",
      "店内に足を踏み入れると、古い紙の独特な香りと香ばしい珈琲の焙煎の香りが心地よく漂っていました。天井まで届く本棚には、年季の入った小説や詩集、美術書がびっしりと並んでおり、外の雨音だけが微かに響く別世界のような静けさに包まれていました。",
      "カウンターの奥から白髪の穏やかな店主が現れ、「濡れて大変でしたね。どうぞ温まってください」と温かいおしぼりと深煎りのブレンド珈琲を差し出してくれました。タクヤは手近な書架から一冊の古びた文芸誌を手に取り、雨宿りの読書を始めました。"
    ],
    translations: [
      "Demi menghindari hujan lebat yang mendadak mengguyur di sore hari, seorang mahasiswa bernama Takuya melompat masuk ke dalam gang sempit berliku di kawasan Jimbocho. Di celah antar-gedung bertengger pintu kayu geser sederhana dengan plang kecil bertuliskan 'Kazemachi Bunko'. Karena tidak membawa payung, ia seakan terdorong untuk membuka pintu tersebut secara perlahan.",
      "Saat melangkah masuk ke dalam toko, aroma khas kertas buku tua dan wangi seduhan biji kopi panggang berpadu lembut menenangkan hati. Pada rak-rak buku yang menjulang hingga ke langit-langit, tersusun padat aneka novel klasik, antologi puisi, hingga buku seni; seluruh ruangan diselimuti ketenangan laksana dunia lain di mana hanya gemericik air hujan di luar yang terdengar samar.",
      "Dari balik meja konter, sang pemilik kafe berambut perak yang ramah muncul seraya berkata, 'Pasti repot basah kuyup di luar sana. Silakan hangatkan tubuh Anda,' sambil menyuguhkan handuk hangat oshibori dan secangkir kopi hitam racikan khas. Takuya mengambil satu majalah sastra antik dari rak terdekat dan mulai membaca sembari berteduh."
    ]
  },
  {
    id: "n3-s3-2",
    series: "Misteri Kafe Buku di Gang Tua",
    seriesPart: 2,
    nextId: "n3-s3-3",
    prevId: "n3-s3-1",
    level: "N3",
    title: "挟まれた古い栞と謎のメッセージ",
    titleArti: "Pembatas Buku Kuno yang Terselip dan Pesan Misterius",
    paragraphs: [
      "熱い珈琲を飲みながら頁をめくっていたタクヤは、昭和時代の詩集の間に一枚の押し花の栞が挟まっていることに気づきました。丁寧に乾燥されたリンドウの青い花びらとともに、裏面には万年筆の達筆な文字で短いメッセージが記されていました。",
      "そこには「約束の銀杏の木の下で、私はずっと待っています。一九七八年秋」と書かれていました。四十年前の誰かの切実な思いが閉じ込められたその文字は、色褪せつつも強い意志と切なさを伝えていました。",
      "タクヤの様子を見ていた店主が近づき、その栞を見て深く息を呑みました。「この本……まさか、あの時の詩集ですか」と呟く店主の瞳には、過去の記憶を呼び起こすような驚きの光が宿っていました。"
    ],
    translations: [
      "Sambil menyeruput kopi panas dan membalik lembaran halaman, Takuya menyadari selembar pembatas buku berupa bunga kering terselip di antara buku puisi era Showa. Bersama kelopak biru bunga gentian (rindou) yang dikeringkan dengan rapi, di baliknya tertera pesan singkat yang ditulis menggunakan pena tinta dengan tulisan tangan yang sangat indah.",
      "Di sana tertulis: 'Di bawah pohon ginkgo tempat kita berjanji, aku akan selalu setia menunggumu. Musim Gugur 1978'. Perasaan tulus seseorang dari empat puluh tahun silam terkurung dalam goresan tinta tersebut, yang meski mulai memudar tetap memancarkan tekad kuat dan kerinduan mendalam.",
      "Melihat ekspresi Takuya, sang pemilik kafe mendekat lalu terperangah menahan napas saat menatap pembatas buku itu. 'Buku ini... mungkinkah antologi puisi tempo hari itu?' gumam sang pemilik dengan tatapan terkejut seakan membuka kembali memori masa lalu yang lama terkubur."
    ]
  },
  {
    id: "n3-s3-3",
    series: "Misteri Kafe Buku di Gang Tua",
    seriesPart: 3,
    nextId: "n3-s3-4",
    prevId: "n3-s3-2",
    level: "N3",
    title: "マスターの昔話と三十年前の約束",
    titleArti: "Kisah Masa Lalu Sang Pemilik Kafe dan Janji Tiga Puluh Tahun Lalu",
    paragraphs: [
      "店主の松田さんはゆっくりと椅子に腰掛け、重い口を開きました。「実はこの店は、私の亡き友人がかつて営んでいた古書店だったのです。その友人は若くして病に倒れましたが、最後に『いつか彼女がこの詩集を受け取りに来るかもしれない』と言い残しました。」",
      "松田さんによれば、手紙の差出人は当時美大生だった女性で、二人は文学を通じて深く心を通わせていました。しかし、家庭の事情による突然の引っ越しによって連絡が途絶え、誤解やすれ違いのまま再会を果たすことができなかったといいます。",
      "「彼女の連絡先も分からず、詩集もいつの間にか棚の奥に紛れ込んでしまっていた。君が今日この本を手に取ったのは、単なる偶然とは思えません」と松田さんは真剣な眼差しで語りました。"
    ],
    translations: [
      "Sang pemilik kafe, Tuan Matsuda, perlahan duduk di kursi dan mulai bercerita. 'Sebenarnya kedai ini dulunya adalah toko buku bekas yang dikelola oleh mendiang sahabat karib saya. Sahabat saya itu jatuh sakit dan wafat di usia muda, namun di saat-saat terakhirnya ia berpesan: Suatu saat nanti, wanita itu mungkin akan datang mengambil buku puisi ini.'",
      "Menurut penuturan Tuan Matsuda, pengirim pesan adalah seorang mahasiswi seni rupa saat itu, dan keduanya saling menjalin rasa yang mendalam melalui kecintaan pada literatur. Namun, kepindahan mendadak karena urusan keluarga memutus komunikasi mereka, berujung pada salah paham yang membuat mereka tak sempat bertemu kembali.",
      "'Saya tidak tahu kontak wanita itu, dan buku puisinya pun tanpa sengaja terselip di rak terdalam. Bertemunya kamu dengan buku ini hari ini jelas bukan sekadar kebetulan biasa,' tutur Tuan Matsuda dengan tatapan mata yang bersungguh-sungguh."
    ]
  },
  {
    id: "n3-s3-4",
    series: "Misteri Kafe Buku di Gang Tua",
    seriesPart: 4,
    nextId: "n3-s3-5",
    prevId: "n3-s3-3",
    level: "N3",
    title: "街の図書館での手掛かり探し",
    titleArti: "Mencari Petunjuk di Perpustakaan Kota",
    paragraphs: [
      "好奇心と胸の熱い衝動に突き動かされたタクヤは、その謎の女性の手掛かりを探す協力を申し出ました。二人は栞の裏に薄く記されていた「K. S.」というイニシャルと、挟まれていた美術館の展示会半券を手掛かりに調査を始めました。",
      "翌日、タクヤは区立図書館を訪れ、一九七〇年代後半の美術展覧会の目録や地域新聞のバックナンバーを調べました。マイクロフィルムの古い記録を何時間も閲覧し、ついに「佐藤和代」という画家の個展案内を見つけ出しました。",
      "記事には彼女の現在の画廊兼アトリエが、都内の郊外で今も活動を続けていることが記されていました。タクヤは胸の高鳴りを抑えながら、松田店主の待つカフェへと急いで電話をかけました。"
    ],
    translations: [
      "Didorong oleh rasa penasaran dan panggilan hati yang kuat, Takuya menawarkan diri untuk membantu melacak petunjuk mengenai wanita misterius tersebut. Keduanya mulai melakukan penelusuran berbekal inisial 'K. S.' yang tertera samar di balik pembatas buku serta selembar robekan tiket pameran seni rupa.",
      "Keesokan harinya, Takuya mendatangi perpustakaan distrik setempat dan meneliti arsip katalog pameran seni rupa era akhir 1970-an serta edisi lama koran lokal. Setelah berjam-jam memindai rekaman mikrofilm lawas, ia akhirnya menemukan pemberitahuan pameran tunggal seorang pelukis bernama Kazuyo Sato.",
      "Artikel tersebut mencantumkan bahwa galeri lukis sekaligus sanggar milik wanita itu masih aktif beroperasi di pinggiran kota Tokyo. Dengan dada berdebar kencang, Takuya segera memutar nomor telepon menuju kafe buku tempat Tuan Matsuda menunggu."
    ]
  },
  {
    id: "n3-s3-5",
    series: "Misteri Kafe Buku di Gang Tua",
    seriesPart: 5,
    nextId: null,
    prevId: "n3-s3-4",
    level: "N3",
    title: "奇跡の再会と心をつなぐ一冊の本",
    titleArti: "Reuni Penuh Keajaiban dan Sebuah Buku yang Menghubungkan Hati",
    paragraphs: [
      "週末、タクヤと松田店主はアトリエを訪れました。出迎えてくれた上品な白髪の女性、佐藤和代さんは、手渡された詩集と押し花を見るなり、目から大粒の涙をこぼしました。",
      "「あの約束の日、母が急病で倒れ、どうしても銀杏の木へ行くことができませんでした。ずっと彼に裏切られたと思い込んでいた自分が恥ずかしいです」と語る佐藤さんの胸元には、友人が愛用していた万年筆と同じものが光っていました。",
      "四十年の時を超えて、一冊の古本が誤解を解き、二人の純粋な魂を結び直しました。タクヤは人と人との巡り合わせの不思議さと、言葉が持つ力強さを生涯忘れないと確信しました。"
    ],
    translations: [
      "Pada akhir pekan, Takuya dan Tuan Matsuda mengunjungi sanggar seni tersebut. Wanita ramah berambut perak yang menyambut mereka, Kazuyo Sato, seketika meneteskan air mata haru begitu melihat buku antologi puisi serta pembatas bunga kering yang disodorkan.",
      "'Pada hari janji itu, ibu saya mendadak jatuh sakit parah sehingga saya sama sekali tidak dapat tiba di bawah pohon ginkgo. Saya merasa malu karena selama bertahun-tahun sempat mengira beliau telah melupakan saya,' ujar Kazuyo dengan suara tercekat, sementara di sakunya terselip pena tinta yang serupa dengan milik mendiang sang sahabat.",
      "Melompati rentang waktu empat puluh tahun, sebuah buku bekas berhasil meluruskan prasangka dan mempertemukan kembali ketulusan dua jiwa. Takuya meyakini dalam sanubarinya bahwa ia takkan pernah melupakan keajaiban takdir pertemuan manusia serta kekuatan magis dari untaian kata-kata."
    ]
  },

  // === SERIES 4: Magang di Perusahaan Desain Tokyo (5 Bab) ===
  {
    id: "n3-s4-1",
    series: "Magang di Perusahaan Desain Tokyo",
    seriesPart: 1,
    nextId: "n3-s4-2",
    prevId: null,
    level: "N3",
    title: "緊張の初出社とオリエンテーション",
    titleArti: "Hari Pertama Kerja yang Menegangkan dan Orientasi",
    paragraphs: [
      "都内のクリエイティブ系デザイン事務所「アトリエ・ノヴァ」のエントランスで、大学三年生のアミは深呼吸をしてスーツの襟を正しました。難関の選考を突破して勝ち取った二ヶ月間のサマーインターンシップ初日です。",
      "オフィス内は洗練されたコンクリート打ち放しの壁に囲まれ、壁面には最新のポスターやプロダクトの試作品がセンス良く展示されていました。先輩デザイナーたちは皆モニターに向かい、真剣な表情でマウスやペンタブレットを走らせていました。",
      "指導係のチーフデザイナー・高橋さんから業務の流れや社内ツールの説明を受け、アミは社会人としての第一歩に身が引き締まる思いでした。「学校の課題と商業デザインは全く違う。結果で価値を示そう」という言葉が胸に刺さりました。"
    ],
    translations: [
      "Di depan lobi kantor konsultan desain kreatif 'Atelier Nova' di pusat kota Tokyo, mahasiswi tingkat tiga bernama Ami menarik napas panjang dan merapikan kerah setelannya. Ini adalah hari pertama dari program magang musim panas dua bulan yang berhasil ia raih setelah lolos seleksi ketat.",
      "Bagian dalam kantor dikelilingi dinding beton terbuka nan elegan; karya poster terkini dan prototipe produk dipajang artistik di sepanjang dinding. Para desainer senior tampak fokus menatap monitor kerja sembari menggerakkan tetikus dan tablet grafis dengan ekspresi serius.",
      "Setelah menerima penjelasan alur kerja dan perangkat internal dari kepala desainer pembimbing, Tuan Takahashi, Ami merasakan ketegasan langkah pertamanya sebagai profesional. Perkataan 'Tugas kampus dan desain komersial itu berbeda total. Buktikan nilaimu lewat hasil nyata' terukir tajam di benaknya."
    ]
  },
  {
    id: "n3-s4-2",
    series: "Magang di Perusahaan Desain Tokyo",
    seriesPart: 2,
    nextId: "n3-s4-3",
    prevId: "n3-s4-1",
    level: "N3",
    title: "初めての企画提案と厳しいフィードバック",
    titleArti: "Usulan Proposal Pertama dan Umpan Balik yang Tegas",
    paragraphs: [
      "二週目に入り、アミに最初の実践課題が与えられました。地元老舗の菓子メーカーが発売する「次世代向け抹茶スイーツ」のパッケージデザインの企画案です。ターゲット層の心理を考え、アミは何十枚ものラフスケッチを描き上げました。",
      "迎えた社内レビュー会で、自信を持って自分のアイデアを発表したアミでしたが、先輩たちからの講評は予想以上に厳しいものでした。「見た目は可愛いが、店頭の棚で他の商品と並んだ時の視認性が考慮されていない」「コスト面で実現が難しい」と的確な指摘が飛び交いました。",
      "自分の視野の狭さとプロの基準の高さを痛感し、アミは悔しさで胸が締め付けられました。しかし同時に、妥協のないものづくりへの情熱に圧倒され、絶対に改善してみせると闘志を燃やしました。"
    ],
    translations: [
      "Memasuki minggu kedua, Ami diberikan tugas praktik pertamanya: merancang proposal kemasan untuk produk 'Dessert Matcha Generasi Baru' yang akan dirilis oleh produsen manisan lokal terkemuka. Mempertimbangkan psikologi target pasar, Ami menggambar puluhan lembar sketsa kasar.",
      "Pada sesi peninjauan internal, meski Ami mempresentasikan idenya dengan percaya diri, kritik dan masukan para senior jauh lebih tajam dari bayangannya. 'Tampilannya manis, tapi kamu belum memperhitungkan daya pandang saat bersanding di rak toko', 'Dari segi biaya cetak ini sulit direalisasikan', rentetan poin evaluasi tepat sasaran terlontar.",
      "Menyadari sempitnya sudut pandangnya dibanding standar tinggi para profesional, dada Ami sesak oleh rasa kecewa. Namun di saat yang sama, ia terkesima oleh dedikasi tanpa kompromi tersebut dan membakar semangat juangnya untuk menyempurnakan konsepnya."
    ]
  },
  {
    id: "n3-s4-3",
    series: "Magang di Perusahaan Desain Tokyo",
    seriesPart: 3,
    nextId: "n3-s4-4",
    prevId: "n3-s4-2",
    level: "N3",
    title: "クライアントとの打ち合わせとコミュニケーションの難しさ",
    titleArti: "Rapat Bersama Klien dan Tantangan Komunikasi",
    paragraphs: [
      "デザインの修正作業と並行して、アミは高橋チーフに同行して製菓会社の役員陣とのミーティングに出席する機会を得ました。会議室の重厚な雰囲気に、メモを取る手も汗ばむほどの緊張感を覚えました。",
      "クライアント側の要望は抽象的で、「もっと伝統を感じさせつつ、若い世代にも響く斬新さ」という相反する条件が出されました。素人目には曖昧に見える要求に対し、高橋さんは丁寧に質問を重ね、相手の潜在的な意図を言語化していきました。",
      "デザインとは単に絵を描くことではなく、クライアントの漠然とした悩みを解決するための「対話と翻訳の作業」であることにアミは気付きました。ビジネスにおけるコミュニケーションの本質を学んだ瞬間でした。"
    ],
    translations: [
      "Sembari merevisi desain, Ami mendapatkan kesempatan mendampingi Ketua Takahashi menghadiri pertemuan penting bersama jajaran eksekutif perusahaan makanan ringan tersebut. Suasana ruang rapat yang formal membuat tangannya berkeringat saat mencatat poin-poin diskusi.",
      "Permintaan pihak klien tergolong abstrak, seperti 'Lebih menonjolkan kesan tradisi namun tetap memiliki kebaruan yang memikat generasi muda', dua syarat yang tampak berlawanan. Menghadapi permintaan yang terkesan ambigu itu, Tuan Takahashi melontarkan pertanyaan demi pertanyaan secara taktis guna mengartikulasikan maksud terpendam klien.",
      "Ami menyadari bahwa mendesain bukanlah sekadar menggambar ilustrasi, melainkan proses 'dialog dan penerjemahan' untuk memecahkan persoalan klien yang samar. Itu adalah momen berharga saat ia memahami esensi komunikasi bisnis yang sebenarnya."
    ]
  },
  {
    id: "n3-s4-4",
    series: "Magang di Perusahaan Desain Tokyo",
    seriesPart: 4,
    nextId: "n3-s4-5",
    prevId: "n3-s4-3",
    level: "N3",
    title: "チームワークと徹夜のブレインストーミング",
    titleArti: "Kerja Sama Tim dan Curah Pendapat Semalaman",
    paragraphs: [
      "プレゼンテーションまで残り三日となり、事務所全体が活気と緊張感に包まれました。アミの企画案をベースに、素材の選定、フォントの微調整、パッケージの立体モックアップ作成まで、チーム総出の作業が深夜まで続きました。",
      "チームの仲間たちは疲れた顔を見せることなく、「ここの余白をあと一ミリ広げよう」「伝統的な和紙の手触りを再現しよう」と意見を出し合いました。アミが淹れた夜食の温かいお茶に、全員が笑顔を見せる瞬間もありました。",
      "個人の自己表現を超えて、一つの目標に向かって全員の力を結集させるチームワークの尊さを、アミは肌で体感しました。徹夜の疲労感よりも、素晴らしい作品を作り上げているという興奮が勝っていました。"
    ],
    translations: [
      "Tersisa tiga hari sebelum presentasi akhir, dan seisi kantor dilingkupi kegairahan serta ketegangan tinggi. Berangkat dari konsep dasar Ami, pemilihan bahan material, penyempurnaan tipografi fon, hingga pembuatan maket fisik tiga dimensi dikerjakan serempak oleh seluruh tim hingga larut malam.",
      "Rekan-rekan setim tak memperlihatkan raut letih, melainkan terus bertukar ide: 'Mari lebarkan margin ruang kosong ini satu milimeter lagi', 'Kita perlu mereplikasi tekstur kertas washi tradisional'. Ketika Ami menyeduhkan teh hangat untuk camilan malam, senyum kebersamaan merekah di wajah mereka.",
      "Melampaui ekspresi diri individu, Ami merasakan langsung betapa berharganya kerja sama tim dalam menyatukan kekuatan demi satu visi besar. Alih-alih rasa kantuk semalaman, antusiasme menghasilkan karya luar biasa jauh lebih mendominasi perasaannya."
    ]
  },
  {
    id: "n3-s4-5",
    series: "Magang di Perusahaan Desain Tokyo",
    seriesPart: 5,
    nextId: null,
    prevId: "n3-s4-4",
    level: "N3",
    title: "採用されたデザイン案とプロとしての自覚",
    titleArti: "Desain yang Terpilih dan Kesadaran Sebagai Profesional",
    paragraphs: [
      "最終コンペティションの当日、高橋チーフが見事なプレゼンを終えると、クライアント社長から「このパッケージなら、我が社の伝統を若い人たちに届けられる」と満面の笑みで正式採用の決定が下されました。",
      "インターンシップの修了式で、事務所の代表から「君の粘り強い探求心がこの成果を引き寄せた」と評価され、アミは熱い涙を流しました。学生気分の甘えを捨て、プロフェッショナルとして歩む決意が固まりました。",
      "数ヶ月後、街のコンビニや駅の売店で自分が関わった商品が並んでいるのを見たとき、アミは言葉にできない誇らしさを感じ、デザイナーとしての未来へ力強く踏み出しました。"
    ],
    translations: [
      "Pada hari presentasi kompetisi final, setelah Ketua Takahashi menuntaskan pemaparannya yang memukau, Direktur Utama klien tersenyum lebar dan menyatakan keputusan adopsi resmi: 'Dengan desain kemasan ini, kami yakin tradisi kami dapat tersampaikan kepada generasi penerus'.",
      "Pada upacara penutupan magang, pimpinan kantor memuji Ami: 'Ketekunan dan rasa ingin tahumu yang gigihlah yang melahirkan capaian gemilang ini', membuat air mata haru mengalir di pipinya. Ia membuang jauh-jauh rasa manja mahasiswa dan mantap melangkah sebagai desainer profesional.",
      "Beberapa bulan kemudian, saat melihat produk kemasan hasil karyanya dipajang di rak toserba dan toko stasiun kota, Ami merasakan kebanggaan tak terkatakan, siap menatap masa depan cemerlang di industri kreatif."
    ]
  },

  // === THEMATIC READINGS N3 (8 Bab: n3-c9 sampai n3-c16) ===
  {
    id: "n3-c9",
    series: "Fenomena Sosial Kontemporer",
    seriesPart: 9,
    nextId: null,
    prevId: null,
    level: "N3",
    title: "フードデリバリーの普及と変わる外食産業",
    titleArti: "Penyebaran Pesan Antar Makanan dan Perubahan Industri Restoran",
    paragraphs: [
      "スマートフォンの普及とライフスタイルの変化に伴い、日本でもフードデリバリーサービスが急速に日常の一部として定着しました。自転車や原付バイクで街中を駆け巡る配達員の姿は、今や見慣れた光景です。",
      "この変化は飲食店の経営形態にも大きな影響を与えています。客席を持たず、配達専門の厨房のみで営業する「ゴーストレストラン」が増加し、初期費用を抑えて新しい料理ビジネスに挑戦する若手料理人も増えています。",
      "一方で、過密な配達スケジュールによる交通事故のリスクや、プラスチック包装ゴミの増加といった課題も指摘されており、利便性と持続可能性の両立が求められています。"
    ],
    translations: [
      "Seiring dengan maraknya ponsel pintar dan perubahan gaya hidup, layanan pesan antar makanan (food delivery) di Jepang telah mengakar pesat menjadi bagian dari keseharian. Sosok pengantar makanan yang melesat menggunakan sepeda atau moped di sudut-sudut kota kini menjadi pemandangan yang lazim.",
      "Transformasi ini turut membawa pengaruh signifikan terhadap model operasional bisnis kuliner. Kemunculan 'ghost kitchen'—dapur khusus pesan antar tanpa kursi pengunjung—kian menjamur, memungkinkan juru masak muda merintis bisnis kuliner dengan biaya modal awal yang minim.",
      "Namun di sisi lain, risiko kecelakaan akibat jadwal pengiriman yang padat serta membengkaknya sampah plastik kemasan menjadi sorotan tajam, menuntut terwujudnya keseimbangan antara kemudahan praktis dan kelestarian lingkungan hidup."
    ]
  },
  {
    id: "n3-c10",
    series: "Budaya & Filosofi Hidup",
    seriesPart: 10,
    nextId: null,
    prevId: null,
    level: "N3",
    title: "日本の温泉街における地域活性化の取り組み",
    titleArti: "Upaya Revitalisasi Daerah di Kawasan Wisata Onsen Jepang",
    paragraphs: [
      "日本各地の温泉街は、古くから湯治（とうじ）と呼ばれる心身の療養地として繁栄してきました。しかし、人口減少や旅行スタイルの個人化により、かつて大型旅館で賑わった温泉街の中には衰退の危機に直面した地域もありました。",
      "近年、こうした危機を乗り越えるため、街並み全体を一つの大きな旅館に見立てる新しい街づくりが進められています。空き店舗をおしゃれなカフェやクラフトビールの工房に改装し、若い世代を惹きつける試みが成功を収めています。",
      "豊かな自然の恵みである温泉を核としながら、伝統の景観を守りつつ新しい文化を取り入れる柔軟な姿勢が、地方の活力を取り戻す鍵となっています。"
    ],
    translations: [
      "Kawasan wisata pemandian air panas (onsen) di berbagai penjuru Jepang telah lama makmur sebagai tujuan terapi fisik dan mental yang dikenal dengan istilah Toji. Namun, akibat penurunan populasi dan pergeseran gaya wisata yang lebih personal, sebagian kota onsen yang dulunya dipadati ryokan raksasa sempat menghadapi ancaman kelesuan.",
      "Dalam beberapa tahun terakhir, demi mengatasi krisis tersebut, dirintis pendekatan inovatif dengan mengonsepkan seisi kawasan desa laksana satu ryokan terpadu yang utuh. Bangunan toko kosong direnovasi menjadi kafe estetik atau pabrik bir kerajinan lokal, sebuah inisiatif yang terbukti berhasil memikat generasi muda.",
      "Dengan menjadikan sumber air panas berkah alam sebagai inti, serta sikap luwes memadukan pelestarian pemandangan bersejarah dengan budaya kontemporer, kawasan pedesaan kembali menemukan denyut vitalitasnya."
    ]
  },
  {
    id: "n3-c11",
    series: "Fenomena Sosial Kontemporer",
    seriesPart: 11,
    nextId: null,
    prevId: null,
    level: "N3",
    title: "ソロ活の流行：一人で楽しむ豊かな時間",
    titleArti: "Tren Solo Katsu: Menikmati Waktu Berkualitas Sendirian",
    paragraphs: [
      "かつて日本では「誰かと一緒に行動すること」が一般的とされ、一人で外食やレジャーを楽しむことに抵抗を感じる人も少なくありませんでした。しかし現在、積極的に一人の時間を楽しむ「ソロ活」が一大ブームとなっています。",
      "一人カラオケや一人焼肉、ソロキャンプに至るまで、個人客が気兼ねなく楽しめる専用のサービスや施設が急増しています。他人に合わせることなく、自分のペースで好きなことに没頭できる自由さが支持を集めている理由です。",
      "孤立ではなく、自分自身と丁寧に向き合う健全な自己充実の形として、ソロ活は現代人の精神的な豊かさを支える新しいライフスタイルとなっています。"
    ],
    translations: [
      "Dahulu di Jepang, beraktivitas bersama orang lain dianggap sebagai norma umum, dan tidak sedikit orang yang merasa canggung menikmati makan di luar atau berekreasi sendirian. Namun saat ini, 'Solo Katsu'—tren proaktif menikmati waktu berkualitas sendirian—telah menjadi fenomena luas yang digemari.",
      "Mulai dari karaoke solo, restoran yakiniku khusus satu orang, hingga kemping solo di alam bebas, berbagai fasilitas khusus individu kian menjamur pesat. Kebebasan mendalami hobi sesuai tempo pribadi tanpa perlu berkompromi dengan orang lain adalah faktor utama daya tariknya.",
      "Bukan bentuk pengasingan diri, melainkan sarana sehat untuk berdialog dengan batin secara utuh; Solo Katsu telah menjelma menjadi gaya hidup baru yang menopang kedamaian mental masyarakat modern."
    ]
  },
  {
    id: "n3-c12",
    series: "Budaya & Filosofi Hidup",
    seriesPart: 12,
    nextId: null,
    prevId: null,
    level: "N3",
    title: "日本の伝統的な色名と四季の感性",
    titleArti: "Nama-Nama Warna Tradisional Jepang dan Kepekaan Empat Musim",
    paragraphs: [
      "日本語には、千種類以上にも及ぶ「伝統色」の名前が存在します。それらの多くは、四季折々の植物、動物、天候の移り変わりなど、日本人の繊細な自然観察から名付けられました。",
      "例えば、「桜色」や「萌黄（もえぎ）色」は春の息吹を感じさせ、「藍（あい）色」や「撫子（なでしこ）色」は涼やかさや奥ゆかしさを表現します。単に赤や青と呼ぶのではなく、自然の機微を色名に込める美意識が息づいています。",
      "着物や和菓子、染め物などの工芸品を通じて受け継がれてきた伝統色は、現代のグラフィックデザインやファッションの世界でも新鮮なインスピレーションの源となっています。"
    ],
    translations: [
      "Dalam bahasa Jepang, tersimpan lebih dari seribu ragam nama 'warna tradisional' (Dentou-shoku). Sebagian besar di antaranya terlahir dari pengamatan alam yang begitu peka oleh orang Jepang, mencakup ragam flora, fauna, dan pergantian cuaca di empat musim.",
      "Sebagai contoh, warna 'Sakura-iro' atau 'Moegi-iro' (hijau tunas muda) menghembuskan nafas musim semi, sedangkan 'Ai-iro' (biru indigo) dan 'Nadeshiko-iro' (merah muda anggun) memancarkan kesejukan dan keanggunan. Alih-alih sekadar melabeli merah atau biru, estetika Jepang merangkum kehalusan alam ke dalam sebutan warna.",
      "Warna-warna tradisional yang diwariskan turun-temurun melalui kimono, wagashi, dan kain celup tenun kini menjadi sumber inspirasi segar bagi dunia desain grafis dan mode modern."
    ]
  },
  {
    id: "n3-c13",
    series: "Fenomena Sosial Kontemporer",
    seriesPart: 13,
    nextId: null,
    prevId: null,
    level: "N3",
    title: "ペット共生社会の課題と動物愛護意識",
    titleArti: "Tantangan Masyarakat Ramah Hewan Peliharaan dan Kesadaran Hak Hewan",
    paragraphs: [
      "日本国内では、犬や猫などのペットを単なる愛玩動物ではなく、「かけがえのない家族の一員」として大切にする家庭が年々増加しています。ペット同伴可能なカフェやホテル、医療保険など関連産業も大きく拡大しています。",
      "しかしその一方で、飼い主の高齢化によってペットの世話が続けられなくなる問題や、無責任な遺棄、過剰な繁殖による多頭飼育崩壊といった深刻な課題も顕在化しています。",
      "近年では保護シェルターの活動やマイクロチップ装着の義務化など、命への責任を明確にする制度づくりが進められており、人と動物が共に幸せに生きる社会の実現が目指されています。"
    ],
    translations: [
      "Di Jepang, keluarga yang menganggap hewan peliharaan seperti anjing dan kucing bukan sekadar piaraan biasa melainkan 'anggota keluarga yang tak tergantikan' terus bertambah setiap tahunnya. Berbagai sektor penunjang seperti kafe dan hotel ramah hewan hingga asuransi medis hewan berkembang amat pesat.",
      "Namun di balik fenomena itu, muncul problematika pelik ketika pemilik yang kian menua tak lagi mampu merawat peliharaannya, di samping kasus penelantaran tidak bertanggung jawab serta penumpukan hewan peliharaan melebihi kapasitas tempat tinggal.",
      "Dalam beberapa tahun terakhir, langkah konkret seperti operasional penampungan hewan adopsi dan kewajiban penanaman cip mikro untuk melacak kepemilikan digalakkan, demi mewujudkan masyarakat di mana manusia dan satwa dapat hidup berdampingan secara harmonis."
    ]
  },
  {
    id: "n3-c14",
    series: "Fenomena Sosial Kontemporer",
    seriesPart: 14,
    nextId: null,
    prevId: null,
    level: "N3",
    title: "シェアハウス生活がもたらす新しい価値観",
    titleArti: "Nilai-Nilai Baru yang Dihadirkan oleh Kehidupan di Share House",
    paragraphs: [
      "個人のプライベートな個室を確保しつつ、リビングやキッチン、浴室を共同で使用する「シェアハウス」が、都市部の若者を中心に定着しています。家賃や光熱費の負担を軽減できる経済的な利点だけが理由ではありません。",
      "異なる職業や国籍を持つ同世代と日常的に交流できる環境は、視野を広げる貴重な刺激となります。仕事で疲れて帰宅した際、「おかえり」と迎えてくれる誰かがいる安心感は、都市の孤独を和らげる大きな力となっています。",
      "プライバシーとコミュニティの心地よいバランスを模索するシェアハウスは、従来の家族の枠組みにとらわれない新しい共生のかたちを提案しています。"
    ],
    translations: [
      "Gaya tinggal 'Share House', di mana setiap penghuni memiliki kamar tidur pribadi namun berbagi ruang tengah, dapur, dan kamar mandi, telah menjadi pilihan populer di kalangan kaum muda perkotaan. Daya tariknya bukan melulu soal penghematan biaya sewa dan tagihan listrik.",
      "Lingkungan yang mempertemukan individu dari beragam latar profesi dan negara menjadi stimulasi intelektual berharga dalam memperluas cakrawala berpikir. Rasa aman saat pulang kerja dalam kondisi lelah dan disambut ucapan 'Selamat datang di rumah' mampu mengikis kesepian hidup di megapolitan.",
      "Dengan menjajaki keseimbangan ideal antara ruang privasi dan kehangatan komunal, share house menawarkan wujud kebersamaan baru yang melampaui sekat struktur keluarga tradisional."
    ]
  },
  {
    id: "n3-c15",
    series: "Budaya & Filosofi Hidup",
    seriesPart: 15,
    nextId: null,
    prevId: null,
    level: "N3",
    title: "デジタルデトックス：自然の中でデジタル機器を手放す旅",
    titleArti: "Detoks Digital: Perjalanan Melepaskan Gawai di Tengah Alam",
    paragraphs: [
      "常時インターネットに接続され、通知や情報に追われる現代社会において、意図的にスマートフォンやパソコンから離れる「デジタルデトックス」への関心が高まっています。",
      "山深い温泉宿や寺院での宿坊体験など、電波の届きにくい静かな環境に身を置き、読書や瞑想、森林浴に没頭するツアーが人気を呼んでいます。電子機器の光から目を解放することで、睡眠の質が向上し、思考が研ぎ澄まされる効果が報告されています。",
      "情報過多の時代だからこそ、意識的に「何もしない時間」を確保し、自らの五感を取り戻す試みが現代人のメンタルヘルスを保つ知恵として見直されています。"
    ],
    translations: [
      "Di tengah masyarakat modern yang terkoneksi tanpa henti dengan internet serta dibanjiri notifikasi informasi, minat terhadap 'Detoks Digital'—tindakan sengaja melepaskan diri dari ponsel pintar dan laptop—semakin meningkat.",
      "Paket wisata menginap di penginapan air panas pedalaman pegunungan atau wihara Buddha (shukubo), di mana sinyal telekomunikasi minim, kian digandrungi untuk membaca buku, meditasi, dan terapi mandi hutan (shinrin-yoku). Mengistirahatkan mata dari paparan layar terbukti meningkatkan mutu tidur dan menjernihkan daya pikir.",
      "Justru di era kelebihan informasi inilah, kebiasaan meluangkan 'waktu tanpa berbuat apa-apa' secara sadar demi memulihkan kepekaan panca indra dipandang kembali sebagai kearifan penting untuk menjaga kesehatan mental."
    ]
  },
  {
    id: "n3-c16",
    series: "Fenomena Sosial Kontemporer",
    seriesPart: 16,
    nextId: null,
    prevId: null,
    level: "N3",
    title: "日本の自動販売機文化：街角の便利さと技術の進化",
    titleArti: "Budaya Mesin Penjual Otomatis: Kepraktisan Sudut Kota dan Evolusi Teknologi",
    paragraphs: [
      "日本の街を歩くと、数メートルごとに並ぶ飲料の自動販売機（自販機）に誰もが目を奪われます。治安の良さと高い技術力を背景に、日本は世界で最も自販機が普及した国の一つです。",
      "同じ機械の中で「あたたかい」と「つめたい」飲み物が同時に販売されている技術は、高度な温度管理と省エネルギー設計によって実現されています。最近では災害時に無料で飲料を提供する緊急時支援型や、AIが利用者の顔や天候から好みの飲料を推薦する次世代機も登場しています。",
      "単なる物販の道具を超えて、街の安全インフラや技術革新のショーケースとして、自動販売機は日本の都市空間に深く溶け込んでいます。"
    ],
    translations: [
      "Saat menyusuri jalanan di Jepang, siapapun akan terkesima melihat deretan mesin penjual otomatis (jihanki) yang berdiri hampir di setiap sudut jalan. Berlandaskan tingkat keamanan publik yang luar biasa serta kecanggihan teknologi, Jepang menjadi salah satu negara dengan sebaran jihanki tertinggi di dunia.",
      "Kemampuan menyajikan minuman 'panas' dan 'dingin' secara bersamaan dari satu mesin dicapai berkat teknologi manajemen suhu presisi dan rancangan hemat energi. Belakangan ini, hadir inovasi jihanki pendukung tanggap bencana yang menyalurkan minuman gratis saat darurat, serta mesin pintar berbasis kecerdasan buatan yang mampu merekomendasikan minuman sesuai cuaca dan profil pengguna.",
      "Lebih dari sekadar mesin dagang, vending machine telah terintegrasi erat ke dalam lanskap urban Jepang sebagai infrastruktur keamanan publik dan etalase inovasi rekayasa teknologi."
    ]
  }
];

fs.writeFileSync('./scripts/new_n3.json', JSON.stringify(n3Readings, null, 2), 'utf-8');
console.log('Successfully generated 18 N3 readings:', n3Readings.length);
