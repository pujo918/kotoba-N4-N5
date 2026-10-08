// Generator for 12 new N3 Horror & Urban Legend passages
const fs = require('fs');

const horrorN3 = [
  // === SERIES HOROR N3: Misteri Penjelajahan Hutan Aokigahara (5 Bab) ===
  {
    id: "n3-hor-s1-1",
    series: "Misteri Hutan Aokigahara",
    seriesPart: 1,
    nextId: "n3-hor-s1-2",
    prevId: null,
    level: "N3",
    title: "富士の裾野：緑の樹海へ踏み入る理由",
    titleArti: "Kaki Gunung Fuji: Alasan Melangkah Masuk ke Lautan Pohon Jukai",
    paragraphs: [
      "大学の地質学研究室に所属するケンとショウタは、富士山麓に広がる原生林「青木ヶ原樹海」の溶岩台地を調査するため、早朝に現地を訪れました。観光用の遊歩道には「命を大切に」と書かれた看板が立ち、どこか物々しい雰囲気が漂っていました。",
      "二人は遭難を防ぐため、黄色いビニールテープをリュックサックに結びつけ、木々に巻きながら道なき森の奥へと進みました。樹海の中は昼間でも薄暗く、複雑に絡み合った巨大な木の根がまるで生き物のように地面を覆い尽くしていました。",
      "「ここから先は磁場が乱れるエリアだ。コンパスだけに頼るなよ」とショウタが注意を促しました。しかし、二人が森の奥へ五百メートルほど踏み込んだ時、森の空気が急激に冷え込み、異様な圧迫感が二人を包み込みました。"
    ],
    translations: [
      "Ken dan Shota, dua mahasiswa geologi yang meneliti formasi bebatuan vulkanik di lereng Gunung Fuji, tiba di kawasan hutan belantara 'Aokigahara Jukai' pada pagi hari. Di tepi jalur setapak wisata berdiri papan peringatan bertuliskan 'Hargailah Nyawamu', menebarkan atmosfer yang mencekam.",
      "Demi mencegah tersesat, keduanya mengikatkan pita plastik berwarna kuning terang di tas ransel, lalu melilitkannya pada batang-batang pohon sebagai penanda jejak saat merambah masuk ke bagian terdalam hutan rimba. Bagian dalam hutan terasa temaram meski di siang bolong; jalinan akar raksasa yang saling berkelindan menutupi tanah laksana makhluk hidup.",
      "'Mulai dari titik ini medan magnet terganggu secara ekstrem. Jangan hanya mengandalkan kompas,' Shota mengingatkan. Namun, begitu mereka melangkah sekitar lima ratus meter ke dalam hutan, udara di sekitarnya mendadak dingin membeku dan tekanan misterius yang berat langsung menyelimuti mereka."
    ]
  },
  {
    id: "n3-hor-s1-2",
    series: "Misteri Hutan Aokigahara",
    seriesPart: 2,
    nextId: "n3-hor-s1-3",
    prevId: "n3-hor-s1-1",
    level: "N3",
    title: "沈黙の森：狂った羅針盤と消えたテープ",
    titleArti: "Hutan Sunyi Senyap: Kompas yang Rusak dan Pita Penanda yang Hilang",
    paragraphs: [
      "驚くべきことに、樹海の中では鳥のさえずりや虫の鳴き声が一切聞こえませんでした。風が吹いても葉が擦れ合う微かな音すら吸い込まれるようで、自分の心臓の鼓動と荒い呼吸音だけが頭蓋骨に響き渡りました。",
      "ケンが胸ポケットから方位磁針（コンパス）を取り出すと、針は北を指すどころか、まるで何かに操られるように高速で回転していました。「溶岩の磁気異常か……いや、それだけじゃない気がする」とケンは呟きました。",
      "不安に駆られた二人は調査を中断し、引き返すことを決断しました。しかし、木々に結びつけてきたはずの黄色いテープを辿ろうとした瞬間、二人は凍りつきました。テープは何者かの刃物によって一本残らず綺麗に切り落とされていたのです。"
    ],
    translations: [
      "Secara mengejutkan, di dalam hutan Jukai sama sekali tidak terdengar suara kicau burung maupun derik serangga. Seolah-olah hembusan angin pun diserap oleh kesunyian mutlak; hanya dentum detak jantung dan desah napas mereka sendiri yang terdengar memantul di dalam kepala.",
      "Ketika Ken mengeluarkan kompas saku dari sakunya, jarum magnetnya bukannya menunjuk arah utara melainkan berputar kencang tak beraturan seakan dikendalikan oleh sesuatu. 'Apakah ini gangguan magnet lahar... bukan, rasanya ada hal lain yang tidak beres,' bisik Ken cemas.",
      "Dikuasai rasa gelisah, keduanya memutuskan membatalkan ekspedisi dan berbalik pulang. Namun saat hendak menelusuri kembali pita kuning yang diikatkan di pepohonan, mereka terpaku ketakutan: pita-pita tersebut telah terpotong rapi seolah dipangkas dengan senjata tajam oleh seseorang."
    ]
  },
  {
    id: "n3-hor-s1-3",
    series: "Misteri Hutan Aokigahara",
    seriesPart: 3,
    nextId: "n3-hor-s1-4",
    prevId: "n3-hor-s1-2",
    level: "N3",
    title: "溶岩洞窟の冷気と忘れ去られた祠",
    titleArti: "Hawa Dingin Gua Lahar dan Altar Shinto Terlupakan",
    paragraphs: [
      "目印を失った二人は、方向感覚を失いながらも平坦な場所を探して歩き続けました。足元の溶岩に空いた暗い穴から、真夏とは思えない氷のような冷気が吹き上がっていました。樹海の地下には無数の氷穴（風穴）が網の目のように広がっているのです。",
      "苔むした巨木の根元に、朽ち果てた木造の小さな祠（ほこら）がひっそりと佇んでいるのを発見しました。何百年も前に山の神を鎮めるために建てられたと思われるその祭壇の上には、白く新しい紙垂（しで）が飾られ、誰かが最近供えたばかりのような瑞々しい酒器が置かれていました。",
      "「こんな人里離れた場所に、誰がお参りしているんだ……？」ショウタが後ずさりした時、祠の奥の暗闇から「カサリ」と衣擦れの音が響きました。"
    ],
    translations: [
      "Kehilangan penanda arah, keduanya terus melangkah mencari tanah datar sembari kehilangan orientasi ruang. Dari lubang-lubang lava gelap di bawah kaki mereka, berhembus hawa dingin menusuk tulang yang tak lazim untuk musim panas; di bawah tanah Jukai terbentang labirin gua es alami yang saling terhubung.",
      "Di sela akar raksasa berlumut, mereka menemukan sebuah altar kayu kuno Shinto (hokora) yang rapuh terlupakan. Altar yang diperkirakan dibangun ratusan tahun lalu untuk menenangkan roh penunggu gunung itu dihiasi lipatan kertas Shide putih bersih, dan di depannya tersaji cawan persembahan sake yang tampak masih sangat baru.",
      "'Di tengah belantara terpencil begini, siapa yang datang bersembahyang...?' Saat Shota melangkah mundur ketakutan, dari celah gelap di balik altar terdengar suara gesekan kain yang bergerak pelan."
    ]
  },
  {
    id: "n3-hor-s1-4",
    series: "Misteri Hutan Aokigahara",
    seriesPart: 4,
    nextId: "n3-hor-s1-5",
    prevId: "n3-hor-s1-3",
    level: "N3",
    title: "木霊する囁き声と背後の気配",
    titleArti: "Bisikan Menggema di Antara Pepohonan dan Hawa Dingin di Belakang",
    paragraphs: [
      "立ち込める濃い白霧が木々の間を覆い始め、視界はわずか数メートル先すら見えなくなりました。二人は互いの腕を強く掴み合い、必死に斜面を登ろうとしました。すると、霧の向こうから「おいで、こっちへおいで」と複数の人々の囁き声が重なり合って聞こえてきました。",
      "声は女性のようでもあり、老人のようでもありました。耳を塞いでも頭の中に直接響いてくるその声に、ケンは意識が遠のきそうになりました。「耳を貸すな！前だけを見て走れ！」とショウタが叫び、引きずるように前進しました。",
      "振り返ると、立ち並ぶ木々の影から無数の青白い手が伸び、二人を手招きしていました。樹海は単なる森ではなく、迷い込んだ者の魂を永遠に閉じ込めようとする巨大な生き物そのものでした。"
    ],
    translations: [
      "Kabut putih tebal mulai turun menyelimuti sela-sela pepohonan, membuat jarak pandang berkurang hingga hanya beberapa meter di depan mata. Keduanya saling mencengkeram lengan dengan erat dan berusaha mendaki lereng bebatuan. Tiba-tiba dari balik kabut terdengar bisikan sayup banyak orang bersahut-sahutan: 'Kemarilah... datanglah ke sini...'.",
      "Suara itu menyerupai bisikan wanita sekaligus rintihan orang tua. Walaupun telinga ditutup rapat, suara tersebut tetap berdengung langsung di dalam tempurung kepala, membuat kesadaran Ken nyaris hilang. 'Jangan dengarkan! Tatap ke depan dan lari!' teriak Shota seraya menyeret sahabatnya maju.",
      "Saat mereka menoleh, dari balik bayangan batang-batang pohon terjulur tangan-tangan pucat kebiruan yang melambai memanggil mereka. Hutan Jukai bukanlah sekadar belantara biasa, melainkan entitas hidup raksasa yang berupaya mengurung jiwa orang-orang yang tersesat di dalamnya untuk selamanya."
    ]
  },
  {
    id: "n3-hor-s1-5",
    series: "Misteri Hutan Aokigahara",
    seriesPart: 5,
    nextId: null,
    prevId: "n3-hor-s1-4",
    level: "N3",
    title: "朝霧の脱出：生還と森の警告",
    titleArti: "Keluar Menembus Kabut Fajar: Kembali Selamat dan Peringatan dari Hutan",
    paragraphs: [
      "恐怖で感覚が麻痺する中、遠くから微かに大型トラックの走行音が風に乗って届きました。二人はその音だけを頼りに、転びながら溶岩の岩肌を駆け抜けました。木の枝が頬を切り裂く痛みも気にせず、光を目指して走り続けました。",
      "突如として視界が開け、二人はガードレールを越えて国道の上に転がり出ました。通りかかったパトカーの警察官が駆け寄り、「君たち、よくあの深い場所から戻ってこられたな……」と青ざめた顔で保護してくれました。",
      "二人のリュックサックの底には、いつの間にか小さな黒い溶岩の欠片が入っており、そこには人の爪痕のような傷が無数に刻まれていました。樹海の聖域に無断で足を踏み入れてはならないという戒めを、二人は生涯胸に刻むことになりました。"
    ],
    translations: [
      "Di saat kesadaran nyaris lumpuh oleh rasa teror, dari kejauhan sayup-sayup terdengar deru mesin truk besar melaju terbawa hembusan angin. Mengandalkan suara jalan raya itu sebagai satu-satunya harapan, keduanya berlari terpeleset di atas bongkahan batu lava tajam. Mengabaikan ranting pohon yang menggores pipi, mereka berlari mengejar titik cahaya.",
      "Pandangan mendadak terbuka lapang, dan keduanya jatuh berguling melompati pagar pembatas jalan raya nasional. Petugas kepolisian yang berpatroli segera menghampiri dengan wajah pucat: 'Kalian... bagaimana bisa kembali hidup-hidup dari bagian terdalam itu...'.",
      "Di dasar tas ransel mereka berdua, tanpa disadari terselip sebongkah batu lava hitam kecil yang dipenuhi guratan cakar kuku manusia. Pelajaran berharga bahwa batas sakral alam liar Hutan Jukai tidak boleh diinjak sembarangan terukir abadi di sanubari mereka sepanjang hidup."
    ]
  },

  // === CERITA HOROR TEMATIK N3 (7 Bab) ===
  {
    id: "n3-hor-c1",
    series: "Urban Legend & Kaidan Populer",
    seriesPart: 6,
    nextId: null,
    prevId: null,
    level: "N3",
    title: "八尺様の足音：「ぽぽぽ」と笑う白い影",
    titleArti: "Langkah Hachishakusama: Bayangan Putih yang Tertawa 'Po... Po... Po...'",
    paragraphs: [
      "夏休みに祖父母が暮らす東北の田舎村を訪れた大学生が、縁側で休んでいると、裏庭の生垣の上から「ぽぽぽ、ぽぽぽ」という不気味な低い笑い声が聞こえてきました。見上げると、高さ二メートルを超える異様な長身の女性が立っていました。",
      "その女性は白いワンピースを着てつばの広い麦わら帽子を被り、生垣を軽々と跨いで見下ろしていました。その話を祖父に伝えた瞬間、祖父の顔色が一変し、近所の長老たちを緊急に呼び集めました。",
      "それは「八尺様（はちしゃくさま）」と呼ばれる村の凶悪な怪異であり、魅入られた者は数日以内に命を落とすとされていました。若者は四隅に盛り塩を置いた和室に一晩中閉じ込められ、夜通し窓を叩く「ぽぽぽ」という声に震えながら朝を待ちました。"
    ],
    translations: [
      "Seorang mahasiswa yang berlibur musim panas di desa kakek-neneknya di wilayah Tohoku sedang bersantai di teras engawa ketika mendengar suara tawa rendah yang ganjil dari balik pagar tanaman kebun: 'Po... po... po...'. Saat mendongak, berdiri seorang wanita jangkung dengan tinggi lebih dari dua meter.",
      "Wanita itu mengenakan gaun putih terusan dan topi jerami bertepi lebar, melangkah santai melompati pagar tanaman sambil menatap ke bawah. Begitu cerita itu disampaikan kepada sang kakek, raut wajah kakek langsung memucat seketika dan para tetua desa dipanggil secara darurat.",
      "Sosok itu adalah 'Hachishakusama', entitas jahat legendaris desa; siapa pun yang terpikat pandangannya diyakini akan kehilangan nyawa dalam beberapa hari. Pemuda itu dikurung semalaman di dalam kamar tatami dengan empat tumpukan garam penyucian di setiap sudutnya, menggigil menanti fajar sementara suara ketukan dan tawa 'po-po-po' mengguncang jendela kaca."
    ]
  },
  {
    id: "n3-hor-c2",
    series: "Urban Legend & Kaidan Populer",
    seriesPart: 7,
    nextId: null,
    prevId: null,
    level: "N3",
    title: "夏の田んぼの「くねくね」：見てはいけない白い影",
    titleArti: "Kunekune di Sawah Musim Panas: Bayangan Putih Menggeliat yang Tak Boleh Dilihat",
    paragraphs: [
      "真夏の炎天下、青々とした田んぼの遥か彼方に、白く細長い何かが激しく体を揺らしているのを見かけることがあります。まるで強風に煽られているようですが、周囲の稲穂は一本も揺れていません。",
      "日本のインターネット怪談として名高い「くねくね」は、田舎の田畑や川辺に現れる正体不明の存在です。遠くから眺めている分には実害はありませんが、双眼鏡などでその姿をはっきりと視認して正体を理解した瞬間、精神に異常をきたして発狂してしまうと言われています。",
      "「あれが何か分かってしまったら終わりだ」。村人たちは子供たちに、遠くで奇妙に蠢く白い影を見かけても、決して凝視せずすぐに目を逸らすよう厳しく言い聞かせています。"
    ],
    translations: [
      "Di bawah terik matahari musim panas, jauh di seberang hamparan sawah hijau membentang, terkadang terlihat bayangan putih ramping yang menggeliat-geliat dengan sangat cepat. Gerakannya seolah tertiup badai dahsyat, padahal bulir-bulir padi di sekitarnya tak bergeming sedikit pun.",
      "'Kunekune', legenda urban internet Jepang yang tersohor, merupakan entitas misterius tanpa wujud pasti yang kerap menampakkan diri di persawahan pedesaan maupun bantaran sungai. Memandangnya dari kejauhan tidak berbahaya, namun jika seseorang melihatnya dengan jelas menggunakan teropong dan memahami wujud aslinya, konon akal sehatnya akan runtuh seketika hingga kehilangan kewarasan.",
      "'Begitu kamu menyadari wujud aslinya, semuanya berakhir.' Para tetua desa selalu memperingatkan anak-anak dengan tegas agar langsung memalingkan pandangan dan jangan pernah menatap bayangan putih yang menggeliat di kejauhan."
    ]
  },
  {
    id: "n3-hor-c3",
    series: "Urban Legend & Kaidan Populer",
    seriesPart: 8,
    nextId: null,
    prevId: null,
    level: "N3",
    title: "旧犬鳴トンネルの封鎖：地図から消えた村の噂",
    titleArti: "Penutupan Terowongan Inunaki Lama: Rumor Desa yang Dihapus dari Peta",
    paragraphs: [
      "福岡県の山中に位置する旧犬鳴トンネルは、コンクリートブロックで頑丈に封鎖された日本有数の心霊スポットです。入口には有刺鉄線が張り巡らされ、立ち入り禁止の看板が錆びついています。",
      "都市伝説によると、このトンネルの先には日本の法律や憲法が通用しない「犬鳴村」という外部から孤立した集落が存在したと語られています。トンネルに近づくとカーナビゲーションの画面が乱れ、ラジオからノイズに混じって不気味な声が流れると言われています。",
      "興味本位で近づいた若者が事故に遭う事例が後を絶たず、現在では警察による厳重なパトロールが行われており、近代社会の中に残された暗黒の禁足地として恐れられています。"
    ],
    translations: [
      "Terowongan Inunaki Lama yang terletak di pedalaman pegunungan Prefektur Fukuoka adalah salah satu lokasi angker paling tersohor di Jepang yang telah ditutup rapat dengan tumpukan balok beton kokoh. Di depannya terlilit kawat berduri dan papan larangan melintas yang berkarat.",
      "Menurut legenda urban, di balik terowongan tersebut dulunya berdiri sebuah desa terisolasi bernama 'Desa Inunaki' di mana hukum dan konstitusi Jepang tidak berlaku. Konon saat mendekati terowongan, layar navigasi mobil akan mengalami gangguan sinyal dan radio mobil memancarkan desis suara ratapan di tengah gelombang statis.",
      "Banyaknya insiden yang menimpa para pemuda yang nekat uji nyali membuat kawasan ini dijaga ketat oleh patroli kepolisian, menjadikannya salah satu kawasan tabu paling terisolasi di era peradaban modern."
    ]
  },
  {
    id: "n3-hor-c4",
    series: "Urban Legend & Kaidan Populer",
    seriesPart: 9,
    nextId: null,
    prevId: null,
    level: "N3",
    title: "口裂け女の都市伝説：マスクを外す瞬間",
    titleArti: "Legenda Urban Kuchisake-onna: Saat Melepas Masker",
    paragraphs: [
      "昭和五十年代に日本全国の小中学生を恐怖のどん底に陥れた都市伝説が「口裂け女」です。日が暮れた通学路に、赤いコートを着て大きな白いマスクを着けた女性が突然現れます。",
      "彼女はすれ違う子供に「わたし、綺麗？」と尋ねてきます。「綺麗です」と答えると、彼女はゆっくりとマスクを外します。その口は耳元まで大きく裂けており、鋭いハサミを振りかざして襲いかかってくると言われています。",
      "「べっこう飴をあげる」と言ったり、「ポマード」と三回唱えることで隙を作って逃げられるという撃退法が子供たちの間で広まり、集団下校が行われるほどの社会現象となりました。"
    ],
    translations: [
      "Legenda urban yang menebar teror di kalangan siswa sekolah seantero Jepang pada era 1970-an adalah 'Kuchisake-onna' (Wanita Bermulut Robek). Saat senja menjelang di jalur pulang sekolah, seorang wanita berjas hujan merah mengenakan masker bedah putih besar mendadak menghadang jalan.",
      "Ia akan bertanya kepada anak yang berpapasan: 'Apakah aku cantik?'. Jika dijawab 'Cantik', ia perlahan melepas maskernya, menampakkan bibirnya yang robek lebar hingga ke telinga sembari mengacungkan gunting raksasa yang berkilau tajam.",
      "Rumor menyebar di kalangan siswa bahwa menawarkan permen Bekkou-ame atau meneriakkan kata 'Pomade' tiga kali dapat mengalihkan perhatiannya untuk melarikan diri, hingga memicu kepanikan sosial di mana siswa harus dipulangkan secara berkelompok."
    ]
  },
  {
    id: "n3-hor-c5",
    series: "Urban Legend & Kaidan Populer",
    seriesPart: 10,
    nextId: null,
    prevId: null,
    level: "N3",
    title: "呪われたコトリバコ：触れてはならない木箱の秘密",
    titleArti: "Kotori Bako Terkutuk: Rahasia Kotak Kayu Teka-teki yang Tak Boleh Disentuh",
    paragraphs: [
      "オカルト愛好家の間で「最凶の呪具」として恐れられているのが「コトリバコ（子取り箱）」です。精巧な寄木細工で作られた複雑な木箱で、パズルのように組み合わされており、容易に開けることはできません。",
      "その起源は江戸時代の過酷な迫害を受けた隠れ集落にあり、外敵への復讐のために恐ろしい呪詛の儀式を経て作られたと伝えられています。特に女性や子供に対して強力な災いをもたらすとされ、保管するだけでも家系を根絶やしにすると言われています。",
      "神社の神職ですら直接触れることを拒絶し、厳重な結界を張った神社のお札で幾重にも封印されて山奥に埋められるなど、現在でも決して詮索してはならないタブーとされています。"
    ],
    translations: [
      "Salah satu benda kutukan paling ditakuti di kalangan peminat okultisme Jepang adalah 'Kotori Bako' (Kotak Pengambil Anak). Kotak kayu puzzle yang dibuat dengan keterampilan pertukangan kayu Yosegi yang sangat rumit ini terkunci rapat sehingga mustahil dibuka dengan mudah.",
      "Asal-usulnya berakar dari permukiman tersembunyi yang mengalami persekusi kejam di era Edo, diciptakan melalui ritual kutukan mengerikan sebagai pembalasan dendam. Kotak ini diyakini mendatangkan petaka dahsyat khususnya bagi kaum perempuan dan anak-anak, bahkan sanggup memusnahkan garis keturunan suatu keluarga yang menyimpannya.",
      "Bahkan para pendeta kuil Shinto pun menolak menyentuhnya secara langsung; kotak tersebut disegel berlapis-lapis jimat suci lalu dikubur di kedalaman gunung, tetap menjadi pantangan sakral yang tak boleh diungkit hingga kini."
    ]
  },
  {
    id: "n3-hor-c6",
    series: "Urban Legend & Kaidan Populer",
    seriesPart: 11,
    nextId: null,
    prevId: null,
    level: "N3",
    title: "深夜のエレベーター：地下三階のボタン",
    titleArti: "Lift Tengah Malam: Tombol Lantai B3 di Gedung yang Hanya Punya 1 Lantai Bawah Tanah",
    paragraphs: [
      "残業で終電間際になった会社員が、古びた雑居ビルのエレベーターに乗りました。案内板には地下一階までしかないと書かれているにもかかわらず、パネルの最下部に誰かがいたずらで傷つけたような「B3」のボタンがありました。",
      "ふとした好奇心からそのボタンを押すと、エレベーターは不自然な重低音を響かせながら、どこまでも深く下降を始めました。表示盤の階数ランプが点滅し、通常のビルではありえない時間をかけて底へと沈んでいきます。",
      "扉が静かに開いた先に広がっていたのは、湿った土の匂いと、赤い鳥居が無数に並ぶ暗闇の通路でした。会社員は恐怖で閉ボタンを連打し、すんでのところで現実のオフィスへと生還しました。"
    ],
    translations: [
      "Seorang pekerja kantor yang lembur hingga larut malam naik ke dalam lift di gedung perkantoran tua. Meskipun papan denah menyebutkan gedung itu hanya memiliki satu lantai bawah tanah (B1), di bagian bawah tombol lantai terdapat tombol 'B3' yang tampak tergores kusam.",
      "Terdorong rasa penasaran sesaat, ia menekan tombol tersebut; seketika lift mengeluarkan deru getaran rendah yang tak wajar dan mulai turun ke kedalaman yang teramat jauh. Lampu indikator lantai berkedip liar, turun melampaui kedalaman bangunan normal.",
      "Saat pintu lift terbuka perlahan di dasar, yang terhampar di depannya adalah aroma tanah lembap dan lorong kegelapan tempat berjejer deretan gerbang torii merah tanpa ujung. Karyawan itu panik menekan tombol tutup berulang-ulang, berhasil lolos kembali ke lantai kantornya di detik-detik terakhir."
    ]
  },
  {
    id: "n3-hor-c7",
    series: "Urban Legend & Kaidan Populer",
    seriesPart: 12,
    nextId: null,
    prevId: null,
    level: "N3",
    title: "深夜放送の砂嵐：混線する謎の緊急警報",
    titleArti: "Layar Semut Siaran Tengah Malam: Sinyal Darurat Gelombang Radio Misterius",
    paragraphs: [
      "テレビの放送が終了した深夜の二時過ぎ、画面はモノクロの砂嵐（スノーノイズ）に切り替わります。不眠症の少年がぼんやりとその画面を眺めていると、サーという雑音の中に微かなオルゴールのメロディーが混ざり始めました。",
      "突然、画面が真っ赤に変色し、「緊急警報放送」という太いゴシック体のテロップが表示されました。スピーカーから流れてきた合成音声は、存在しない県名と町名を読み上げ、「今すぐ戸締りをして、鏡を布で覆ってください」と繰り返しました。",
      "少年が恐怖でテレビのコンセントを引き抜いた瞬間、消えたはずの画面に自分の部屋の後ろ姿がはっきりと映し出され、背後のクローゼットの扉がゆっくりと開き始めました。"
    ],
    translations: [
      "Lewat pukul dua dini hari setelah siaran televisi berakhir, layar berganti menjadi bintik-bintik semut monokrom (snow noise). Seorang anak muda yang mengidap insomnia memandangi layar tersebut ketika suara desis statis mendadak disusul oleh denting kotak musik yang samar.",
      "Tiba-tiba layar berubah warna menjadi merah pekat, dan teks peringatan 'Siaran Peringatan Darurat' muncul dengan huruf tebal. Suara sintesis mekanis terdengar membacakan nama prefektur dan kota yang tidak ada di peta, mengulang instruksi: 'Segera kunci seluruh pintu rumah Anda, dan tutuplah cermin dengan kain hitam'.",
      "Saat pemuda itu ketakutan mencabut kabel listrik televisi, di layar yang seharusnya mati justru terpantul jelas sudut kamarnya sendiri dari belakang, dan pintu lemari pakaian di belakangnya perlahan mulai bergeser terbuka."
    ]
  }
];

fs.writeFileSync('./scripts/new_horror_n3.json', JSON.stringify(horrorN3, null, 2), 'utf-8');
console.log('Successfully generated 12 N3 horror readings:', horrorN3.length);
