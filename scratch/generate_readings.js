const fs = require('fs');
const path = require('path');

const readings = [
  // ==========================================
  // N4 SERIES: Kisah Kenji di Tokyo (5 Bab Bersambung)
  // ==========================================
  {
    id: 'n4-s1',
    series: 'Petualangan Kenji di Tokyo',
    seriesPart: 1,
    nextId: 'n4-s2',
    prevId: null,
    level: 'N4',
    title: '東京へようこそ：新しい町と小さな部屋',
    titleArti: 'Selamat Datang di Tokyo: Kota Baru dan Kamar Kecil',
    paragraphs: [
      '春の暖かい風が吹く日、ケンジは大きな荷物を持って東京の駅に到着しました。駅の中は会社へ急ぐ会社員や学生たちで溢れており、人の多さと歩く速さにとても驚きました。新しい生活がここから始まると思うと、少し緊張しましたが、心の中は期待でいっぱいでした。',
      '駅から歩いて十分ほどの静かな近所に、ケンジが住む新しいアパートの部屋がありました。部屋は広くありませんでしたが、窓から明るい光が差し込み、とても清潔で静かな場所でした。荷物を開けて、机の上に大好きな家族の写真を飾ると、少しだけ寂しい気持ちが消えました。',
      '夕方になると、近くのスーパーへ出かけて、生活に必要な石鹸やタオル、そして今晩の食事の材料を買いました。レジの店員さんが親切に袋を渡してくれて、東京の人々の温かさを感じました。部屋に戻った後、ケンジは国にいる家族に電話をかけ、笑顔で元気に話しました。',
      '「お母さん、無事に着いたよ。部屋も綺麗だし、町も便利だから安心してね。」電話を切った後、ケンジは明日から始まる日本語学校での勉強に向けて、目覚まし時計の時間をセットして眠りにつきました。'
    ],
    translations: [
      'Pada hari ketika angin musim semi yang hangat berhembus, Kenji tiba di stasiun Tokyo membawa barang bawaan yang besar. Di dalam stasiun dipenuhi oleh para pegawai kantor yang bergegas ke tempat kerja dan para pelajar; ia sangat terkejut dengan banyaknya orang serta cepatnya mereka melangkah. Memikirkan bahwa kehidupan barunya dimulai dari sini, ia merasa sedikit tegang, tetapi hatinya dipenuhi harapan.',
      'Di lingkungan tetangga yang tenang sekitar sepuluh menit berjalan kaki dari stasiun, terdapat kamar apartemen baru tempat Kenji akan tinggal. Kamarnya tidak luas, tetapi cahaya terang masuk dari jendela, tempat yang sangat bersih dan tenang. Saat ia membuka barang bawaannya dan memajang foto keluarga tercinta di atas meja, rasa sepinya perlahan memudar.',
      'Menjelang sore, ia pergi ke supermarket terdekat untuk membeli sabun, handuk, serta bahan masakan untuk makan malam yang diperlukan dalam kehidupan. Kasir toko dengan ramah memberikan kantong belanja, membuat Kenji merasakan kehangatan orang-orang Tokyo. Setelah kembali ke kamar, Kenji menelepon keluarganya di tanah air dan berbicara dengan ceria sambil tersenyum.',
      '\"Ibu, aku sudah sampai dengan selamat. Kamarnya bersih dan kotanya praktis, jadi jangan khawatir ya.\" Setelah mematikan telepon, Kenji menyetel jam alarm untuk persiapan belajar di sekolah bahasa Jepang mulai esok hari, lalu tertidur nyenyak.'
    ]
  },
  {
    id: 'n4-s2',
    series: 'Petualangan Kenji di Tokyo',
    seriesPart: 2,
    nextId: 'n4-s3',
    prevId: 'n4-s1',
    level: 'N4',
    title: '学校の初日：新しい友達と親切な先生',
    titleArti: 'Hari Pertama Sekolah: Teman Baru dan Guru yang Ramah',
    paragraphs: [
      '翌朝、ケンジは早起きをして朝食を食べ、緊張しながら日本語学校へ向かいました。春の晴れた空の下、通学路の桜の木には綺麗な花が咲いていました。学校の玄関に着くと、様々な国から来た留学生たちが集まっており、色々な言語が飛び交っていました。',
      '最初の授業では、担任の高橋先生が笑顔で自己紹介の時間を始めました。先生はとても親切で、発音が難しい漢字や新しい文法も、黒板に絵を描きながら分かりやすく説明してくれました。ケンジも緊張しながら前に立ち、「インドネシアから来ました。日本の文化やアニメが大好きです」と挨拶をしました。',
      '隣の席に座っていた韓国出身のミンス君が、「よろしくね、一緒に頑張ろう」と声をかけてくれました。休み時間には、お互いの国の言葉や好きな食べ物について楽しく話しました。外国語で会話をすることは難しかったですが、気持ちが通じ合えたことがとても嬉しかったです。',
      '午後の授業が終わると、先生から明日の宿題と漢字の小テストについての案内がありました。ケンジは辞書を片手に復習を始めることを決意し、仲間と一緒に図書館へ向かいました。学ぶことの楽しさを実感した、素晴らしい一日となりました。'
    ],
    translations: [
      'Keesokan paginya, Kenji bangun pagi-pagi, sarapan, dan menuju sekolah bahasa Jepang dengan perasaan tegang. Di bawah langit cerah musim semi, pohon-pohon sakura di sepanjang jalan menuju sekolah bermekaran dengan indahnya. Ketika tiba di pintu masuk sekolah, para mahasiswa asing dari berbagai negara telah berkumpul, dan berbagai macam bahasa terdengar bersahut-sahutan.',
      'Pada pelajaran pertama, wali kelas Takahashi-sensei memulai sesi perkenalan diri dengan senyuman. Guru sangat ramah, menjelaskan kanji dengan pelafalan sulit maupun tata bahasa baru secara mudah dipahami sambil menggambar di papan tulis. Kenji pun dengan gugup berdiri di depan kelas dan menyapa, \"Saya datang dari Indonesia. Saya sangat menyukai budaya dan anime Jepang.\"',
      'Min-soo yang duduk di sebelahnya dan berasal dari Korea Selatan menyapanya, \"Salam kenal ya, mari berjuang bersama.\" Di waktu istirahat, mereka mengobrol seru tentang bahasa masing-masing negara dan makanan kesukaan. Berbicara dalam bahasa asing memang sulit, tetapi Kenji sangat senang karena perasaan mereka bisa saling terhubung.',
      'Setelah pelajaran siang usai, guru memberikan pengumuman tentang PR untuk besok dan kuis kanji singkat. Kenji bertekad mulai mengulang pelajaran dengan kamus di tangannya, lalu menuju perpustakaan bersama kawan-kawannya. Itu adalah hari luar biasa di mana ia merasakan nikmatnya belajar.'
    ]
  },
  {
    id: 'n4-s3',
    series: 'Petualangan Kenji di Tokyo',
    seriesPart: 3,
    nextId: 'n4-s4',
    prevId: 'n4-s2',
    level: 'N4',
    title: '近所の探検：スーパーの買い物と美味しい料理',
    titleArti: 'Menjelajahi Lingkungan: Belanja di Supermarket dan Masakan Lezat',
    paragraphs: [
      '週末の土曜日、ケンジはアパートの周辺をもっとよく知るために散歩に出かけました。大通りから一本入った路地には、昔ながらの八百屋さんや魚屋さん、そして小さくて静かな神社がありました。道ですれ違った近所のお年寄りが「こんにちは、良い天気ですね」と優しく声をかけてくれました。',
      '散歩の途中で、ケンジは日本の家庭料理を自分で作ってみようと思い立ち、大きなスーパーに立ち寄りました。売り場には新鮮な野菜やお肉、様々な種類の味噌や醤油が綺麗に並んでいました。どれを買うべきか迷っていると、店員さんが「肉じゃがを作るなら、この牛肉と醤油がおすすめだよ」と教えてくれました。',
      '部屋に戻ると、エプロンをつけて料理を始めました。インターネットで調べた作り方を見ながら、じゃがいもや人参の皮を丁寧にむき、お肉と一緒に鍋でゆっくり煮込みました。台所いっぱいに甘辛い醤油とだしの良い香りが広がり、お腹が空いてきました。',
      '出来上がった料理をお皿に盛り付け、ご飯とお味噌汁と一緒に食べました。自分で作った日本の料理は驚くほど美味しく、どこか懐かしい味がしました。「今度はミンス君やクラスの友達を招待して、ご馳走しよう」と、ケンジは満足そうに微笑みました。'
    ],
    translations: [
      'Pada hari Sabtu di akhir pekan, Kenji pergi jalan-jalan santai untuk mengenal area sekitar apartemennya lebih baik. Di gang kecil di balik jalan raya, terdapat toko sayur tradisional, toko ikan, dan kuil kecil yang hening. Seorang lansia tetangga yang berpapasan di jalan menyapa dengan ramah, \"Halo, cuaca bagus ya.\"',
      'Di tengah jalan-jalan, Kenji terlintas ide untuk mencoba memasak masakan rumahan Jepang sendiri, lalu mampir ke supermarket besar. Di etalase tertata rapi sayuran segar, daging, serta berbagai jenis miso dan kecap asin shoyu. Saat bingung harus membeli yang mana, petugas toko memberitahu, \"Kalau mau bikin Nikujaga, daging sapi dan shoyu ini sangat saya rekomendasikan lho.\"',
      'Setelah kembali ke kamar, ia mengenakan celemek dan mulai memasak. Sambil melihat resep yang dicari di internet, ia mengupas kentang dan wortel dengan teliti, lalu merebusnya perlahan bersama daging di dalam panci. Aroma gurih manis shoyu dan dashi menyebar memenuhi dapur, membuatnya semakin lapar.',
      'Ia menyajikan hidangan yang sudah matang di atas piring, lalu menikmatinya bersama nasi putih dan sup miso. Masakan Jepang buatan sendiri ternyata luar biasa lezat dan rasanya memberi kehangatan tersendiri. \"Lain kali aku akan mengundang Min-soo dan teman-teman sekelas untuk makan bersama,\" gumam Kenji dengan senyum puas.'
    ]
  },
  {
    id: 'n4-s4',
    series: 'Petualangan Kenji di Tokyo',
    seriesPart: 4,
    nextId: 'n4-s5',
    prevId: 'n4-s3',
    level: 'N4',
    title: '電車の旅：週末の小旅行と切符の買い方',
    titleArti: 'Perjalanan Kereta: Liburan Akhir Pekan dan Cara Membeli Tiket',
    paragraphs: [
      '日本語学校の授業にも少しずつ慣れてきた頃、ケンジとミンス君は週末に電車に乗って鎌倉へ小旅行に行く計画を立てました。鎌倉は古いお寺や大仏で有名な歴史の町で、東京の駅から電車で一時間ほどで行くことができます。二人は朝早く駅で待ち合わせをしました。',
      '駅の券売機の前で、ケンジは切符の買い方に少し戸惑いました。複雑な路線図を見上げていると、駅員さんが「どちらまで行かれますか」と親切に声をかけてくれました。行き先を伝えると、お得な往復切符の買い方を丁寧に案内してくれて、無事に電車のホームへ向かうことができました。',
      '電車に乗り込むと、車窓からは都会のビル群から緑豊かな山や海へと景色が移り変わっていきました。二人は日本語で「あの看板の漢字は読める？」「うん、先週習った言葉だね」と会話を弾ませながら、楽しい移動の時間を過ごしました。',
      '鎌倉に到着すると、青空の下にそびえ立つ大きな大仏を見学し、古い町並みでお団子を食べました。電車の利用や旅の経験を通じて、教科書の中だけでは分からない本物の日本語を使う喜びを強く感じることができました。'
    ],
    translations: [
      'Ketika mulai terbiasa dengan pelajaran di sekolah bahasa Jepang, Kenji dan Min-soo merencanakan perjalanan singkat naik kereta ke Kamakura di akhir pekan. Kamakura adalah kota bersejarah yang terkenal dengan kuil kuno dan patung Buddha raksasa, yang dapat dicapai dalam waktu sekitar satu jam naik kereta dari stasiun Tokyo. Keduanya janjian bertemu pagi-pagi di stasiun.',
      'Di depan mesin tiket stasiun, Kenji sempat bingung cara membeli tiketnya. Saat menengadah menatap peta jalur kereta yang rumit, petugas stasiun dengan ramah menyapa, \"Mau bepergian ke mana?\". Setelah memberitahu tujuannya, petugas memandu cara membeli tiket pulang-pergi hemat dengan teliti, sehingga mereka bisa menuju peron kereta dengan aman.',
      'Begitu naik ke dalam kereta, pemandangan dari jendela berubah dari deretan gedung perkotaan menjadi bukit hijau dan lautan yang asri. Keduanya asyik mengobrol dalam bahasa Jepang, \"Kamu bisa baca kanji di papan nama itu?\", \"Iya, itu kata yang kita pelajari minggu lalu ya!\", menghabiskan waktu perjalanan dengan gembira.',
      'Setibanya di Kamakura, mereka melihat patung Buddha besar yang megah di bawah langit biru dan mencicipi dango di jalanan kuno. Melalui pengalaman naik kereta dan liburan ini, Kenji merasakan kepuasan mendalam karena dapat menggunakan bahasa Jepang nyata yang tidak ditemukan hanya di buku teks.'
    ]
  },
  {
    id: 'n4-s5',
    series: 'Petualangan Kenji di Tokyo',
    seriesPart: 5,
    nextId: null,
    prevId: 'n4-s4',
    level: 'N4',
    title: '春の訪れ：公園の桜とお花見の約束',
    titleArti: 'Tiba Musim Semi: Sakura di Taman dan Janji Hanami',
    paragraphs: [
      '日本に来て一ヶ月が過ぎ、東京の町は本格的な春を迎えました。街中の公園や川沿いの桜が一斉に満開になり、薄いピンク色の花びらが風に舞っていました。高橋先生から「週末にクラス全員でお花見をしましょう」と提案があり、みんな大喜びで賛同しました。',
      'お花見の当日、ケンジは朝から自分の部屋で特製のお弁当を準備しました。卵焼きやおにぎり、そして母から教わったインドネシアの伝統的な揚げ物を作って箱に詰めました。公園に着くと、大きな桜の木の下に青いシートが敷かれ、先生やクラスメイトが笑顔で手を振ってくれました。',
      'みんなが持ち寄った各国の料理を分け合いながら、歌を歌ったり写真を撮ったりして楽しい時間を過ごしました。「ケンジ君の料理、とても美味しいね！」と褒められて、ケンジは誇らしい気持ちになりました。桜の花を見上げながら、言葉や文化が違っても心を通わせることができる素晴らしさを噛みしめました。',
      '夕暮れ時、舞い落ちる花びらを見つめながら、ケンジは心の中で誓いました。「この町で、もっとたくさんの言葉を覚え、夢に向かって一歩ずつ進んでいこう。」東京はもう、彼にとって遠い外国ではなく、大切な第二の故郷になりつつありました。'
    ],
    translations: [
      'Satu bulan telah berlalu sejak tiba di Jepang, dan kota Tokyo menyambut musim semi sepenuhnya. Bunga sakura di taman kota dan sepanjang aliran sungai bermekaran serentak, kelopak merah muda lembut menari-nari ditiup angin. Takahashi-sensei mengusulkan, \"Akhir pekan ini mari kita berpesta Hanami bersama sekelas ya,\" dan semuanya setuju dengan gembira.',
      'Pada hari perayaan Hanami, Kenji bersiap sejak pagi di kamarnya membuat bento istimewa. Ia memasak tamagoyaki, onigiri, serta gorengan tradisional Indonesia yang diajarkan ibunya lalu menatanya ke dalam kotak makan. Setibanya di taman, terpal biru terbentang di bawah pohon sakura besar, dan guru serta teman sekelas melambaikan tangan dengan senyum lebar.',
      'Sambil saling berbagi masakan dari berbagai negara yang dibawa masing-masing, mereka bernyanyi dan berfoto ria menikmati waktu yang menyenangkan. \"Masakan Kenji enak sekali ya!\" puji mereka, membuat Kenji merasa bangga. Menatap bunga sakura, ia meresapi keindahan di mana orang-orang bisa saling mengerti dan terhubung mesra meski berbeda bahasa dan kebudayaan.',
      'Menjelang senja, sambil menatap kelopak bunga yang berguguran perlahan, Kenji berjanji dalam hatinya. \"Di kota ini, aku akan menghafal lebih banyak kosakata lagi, dan melangkah setapak demi setapak meraih impianku.\" Tokyo kini bukan lagi negeri asing yang jauh, melainkan berangsur-angsur menjadi rumah kedua yang sangat berharga baginya.'
    ]
  },

  // ==========================================
  // N4 THEMATIC READINGS (3 Judul)
  // ==========================================
  {
    id: 'n4-c1',
    series: 'Budaya & Tradisi',
    seriesPart: 1,
    nextId: 'n4-c2',
    prevId: null,
    level: 'N4',
    title: '日本の温泉文化：初めてのお風呂体験',
    titleArti: 'Budaya Onsen Jepang: Pengalaman Pertama Berendam Air Panas',
    paragraphs: [
      '日本には昔から、天然の温泉に入って心と体を休める独特の文化があります。火山が多い日本列島には、全国各地に有名な温泉地が存在し、毎週末多くの人々が旅行や保養のために訪れます。温かいお湯に浸かることは、一日の疲れを取り、健康を保つための最高の方法と考えられています。',
      '温泉に入る際には、いくつか守るべき大切なルールやマナーがあります。まず、お湯に入る前に、必ず洗い場で体を綺麗に洗って石鹸の泡を流さなければなりません。湯船の中にタオルを入れることは禁止されており、みんなが気持ちよく使えるように清潔を保つ配慮が求められます。',
      '最初は熱いお湯に驚くかもしれませんが、肩までゆっくり浸かると、全身の筋肉がほぐれて心地よい気分になります。お風呂から上がった後は、冷たい牛乳やお茶を飲みながら畳の部屋で休憩するのが定番の楽しみ方です。',
      '自然の景色を眺めながら入る露天風呂は特に格別で、季節の風や鳥の声を感じることができます。日本の温泉文化は、自然の恵みに感謝しながら日々の忙しさを忘れる、素晴らしい知恵なのです。'
    ],
    translations: [
      'Di Jepang sejak zaman dahulu, terdapat budaya khas berendam di pemandian air panas alami (onsen) untuk mengistirahatkan jiwa dan raga. Di kepulauan Jepang yang banyak memiliki gunung berapi, kawasan onsen terkenal tersebar di seluruh penjuru negeri, dan setiap akhir pekan dikunjungi banyak orang untuk berlibur atau memulihkan kesehatan. Berendam di air hangat dipandang sebagai cara terbaik untuk melepas lelah seharian dan menjaga kesehatan.',
      'Saat masuk ke onsen, terdapat beberapa aturan dan etika penting yang harus ditaati. Pertama, sebelum masuk ke kolam air panas, wajib mencuci tubuh hingga bersih di area bilas dan membasuh busa sabun. Memasukkan handuk ke dalam kolam pemandian dilarang, demi menjaga kebersihan agar semua orang dapat menggunakannya dengan nyaman.',
      'Awalnya mungkin terkejut dengan airnya yang panas, tetapi saat perlahan merendam tubuh hingga bahu, otot-otot di sekujur badan menjadi rileks dan suasana hati terasa sangat nyaman. Setelah selesai berendam, menikmati susu dingin atau teh sambil beristirahat di ruangan beralas tatami adalah cara klasik yang sangat digemari.',
      'Pemandian terbuka (rotenburo) yang dimasuki sambil memandang panorama alam terasa amat istimewa, di mana kita dapat merasakan semilir angin musiman dan kicauan burung. Budaya onsen Jepang adalah kearifan luar biasa untuk melupakan kesibukan harian sambil bersyukur atas anugerah alam.'
    ]
  },
  {
    id: 'n4-c2',
    series: 'Budaya & Tradisi',
    seriesPart: 2,
    nextId: 'n4-c3',
    prevId: 'n4-c1',
    level: 'N4',
    title: '日本のゴミ出しルールと美しい町づくり',
    titleArti: 'Aturan Pembuangan Sampah Jepang dan Menjaga Keindahan Kota',
    paragraphs: [
      '日本で生活を始めるとき、最初に覚えるべき重要な生活習慣の一つが「ごみの分別ルール」です。日本の多くの市町村では、ごみを細かく分類して決められた曜日の朝に出す規則が定められています。これを守らないと、ごみが回収されずに残ってしまうことがあります。',
      '基本的に、ごみは「燃えるごみ」「燃えないごみ」「プラスチック」「缶・ビン・ペットボトル」などに分けられます。例えば、ペットボトルを捨てる時は、キャップとラベルを外して中を水で軽く洗い、正しく専用の袋に入れて出す必要があります。',
      '最初は少し面倒で複雑に感じるかもしれませんが、慣れてくると自然に分別できるようになります。町の人々がこの規則をしっかり守ることで、道路や公園が常に綺麗に保たれ、資源をリサイクルして環境を守ることに大きく貢献しています。',
      '道にごみ箱が少ないにもかかわらず、日本の町が清潔な理由は、一人ひとりが自分の出したごみを持ち帰る高いマナー意識を持っているからです。美しい町を作るのは、住民みんなの小さな協力の積み重ねなのです。'
    ],
    translations: [
      'Saat memulai kehidupan di Jepang, salah satu kebiasaan hidup terpenting yang wajib dipelajari pertama kali adalah \"aturan pemilahan sampah\". Di banyak kota dan desa di Jepang, ditetapkan peraturan untuk memilah sampah secara rinci dan membuangnya pada pagi hari di hari yang telah ditentukan. Jika tidak mematuhinya, sampah bisa saja tidak diangkut dan ditinggalkan.',
      'Secara mendasar, sampah dibagi menjadi \"sampah mudah terbakar\", \"sampah tak mudah terbakar\", \"plastik\", \"kaleng, botol kaca, botol plastik PET\", dan sebagainya. Contohnya, saat membuang botol plastik PET, wajib melepas tutup dan labelnya, membilas bagian dalamnya dengan air, lalu membuangnya ke dalam kantong khusus yang tepat.',
      'Pada awalnya mungkin terasa sedikit merepotkan dan rumit, tetapi begitu terbiasa, kita bisa memilahnya secara alami. Karena warga kota mematuhi peraturan ini dengan disiplin, jalanan dan taman selalu terjaga kebersihannya, serta memberikan kontribusi besar dalam mendaur ulang sumber daya untuk melindungi lingkungan.',
      'Meskipun tempat sampah di jalanan sangat sedikit, alasan mengapa kota-kota di Jepang tetap bersih adalah karena setiap orang memiliki kesadaran etika tinggi untuk membawa pulang sampah milik mereka sendiri. Membangun kota yang indah berakar dari tumpukan kerja sama kecil seluruh warganya.'
    ]
  },
  {
    id: 'n4-c3',
    series: 'Budaya & Tradisi',
    seriesPart: 3,
    nextId: null,
    prevId: 'n4-c2',
    level: 'N4',
    title: 'お弁当の文化：母の愛情と毎日の楽しみ',
    titleArti: 'Budaya Obento: Kasih Sayang Ibu dan Kegembiraan Setiap Hari',
    paragraphs: [
      '日本では、学校や職場にお弁当を持参する習慣が深く根付いています。お弁当箱という小さな四角い空間の中に、ご飯とおかずを彩り豊かに詰め込む技術は、世界中でも注目される独自の食文化として愛されています。',
      'お弁当を作る際、栄養のバランスはもちろんのこと、見た目の美しさも非常に重視されます。赤のトマト、緑のブロッコリー、黄色の卵焼きなど、色鮮やかな食材を組み合わせることで、蓋を開けた瞬間に食べる人が笑顔になれる工夫が凝らされています。',
      '子どもの頃、母親が早起きして作ってくれたお弁当は、ただの食事ではなく温かい家族の愛情の象徴です。運動会や遠足などの特別な日には、普段より豪華なおかずが詰められ、友達と一緒に芝生の上で食べる時間は最高のかけがえのない思い出になります。',
      '最近では、自分で節約や健康のために手作り弁当を作る若い世代も増えています。お弁当箱を開ける小さな瞬間に、毎日の忙しい仕事や勉強を頑張るための新しいエネルギーが湧いてくるのです。'
    ],
    translations: [
      'Di Jepang, kebiasaan membawa bekal (obento) ke sekolah maupun tempat kerja berakar sangat kuat. Keterampilan menata nasi dan aneka lauk pauk secara penuh warna di dalam kotak kecil persegi tersebut dicintai luas sebagai budaya kuliner khas yang bahkan menarik perhatian dunia.',
      'Saat membuat bento, bukan hanya keseimbangan gizi yang diperhatikan, melainkan keindahan tampilannya pun amat diutamakan. Dengan memadukan bahan makanan berwarna cerah seperti merahnya tomat, hijaunya brokoli, dan kuningnya tamagoyaki, dipikirkan cara agar orang yang membuka tutup bento langsung tersenyum gembira.',
      'Semasa kecil, bento yang dibuatkan oleh ibu dengan bangun pagi-pagi bukan sekadar makanan, melainkan lambang kasih sayang keluarga yang hangat. Pada hari-hari istimewa seperti hari pekan olahraga (undokai) atau tamasya, diisikan lauk yang lebih istimewa dari biasanya, dan makan bersama kawan-kawan di atas rumput menjadi kenangan manis tak tergantikan.',
      'Akhir-akhir ini, semakin banyak generasi muda yang membuat bento sendiri demi berhemat dan menjaga kesehatan. Pada momen kecil saat membuka kotak bento, terpancar energi baru untuk kembali bersemangat menghadapi kesibukan kerja dan belajar harian.'
    ]
  },

  // ==========================================
  // N3 SERIES: Perjalanan Karier & Hubungan (5 Bab Bersambung)
  // ==========================================
  {
    id: 'n3-s1',
    series: 'Dinamika Kerja & Kedewasaan',
    seriesPart: 1,
    nextId: 'n3-s2',
    prevId: null,
    level: 'N3',
    title: '初めてのアルバイト面接と緊張の瞬間',
    titleArti: 'Wawancara Kerja Paruh Waktu Pertama dan Momen Ketegangan',
    paragraphs: [
      '日本での生活に少しずつ慣れてきた留学生のユキは、学費と生活費を補うため、そして生きた日本語を実践するためにアルバイトを探し始めました。求人情報を熱心に比較した結果、歴史ある下町の日本料理店でホールのスタッフ募集を見つけ、思い切って応募の電話をかけました。',
      '面接の当日、ユキは清潔な服装を心がけ、履歴書を丁寧に鞄に入れて店へ向かいました。約束の時間の十分前に到着し、店の引き戸を開けると、活気ある挨拶と美味しそうな出汁の香りが迎えてくれました。店長の厳しい表情を見た瞬間、心臓が激しく波打ち、強い緊張感が全身を包みました。',
      '面接では、志望理由だけでなく、日本で直面した苦労や将来の目標について質問されました。ユキは言葉を選びながら、たどたどしくも誠実な態度で一生懸命に自分の熱意を伝えました。「言葉に不安はありますが、お客様に対して丁寧な接客を心がけ、責任を持って努力します。」',
      '店長はユキの真剣な眼差しをじっと見つめた後、穏やかな笑顔を見せて言いました。「君の真面目な姿勢がとても気に入った。失敗を恐れずに、うちの店で一緒に成長していこう。」その一言に、ユキは安堵の息を漏らすとともに、胸の奥底から熱い希望が湧き上がるのを感じました。'
    ],
    translations: [
      'Yuki, seorang mahasiswa asing yang mulai terbiasa dengan kehidupan di Jepang, mulai mencari pekerjaan paruh waktu (arubaito) guna menambah biaya kuliah dan hidup, serta mempraktikkan bahasa Jepang nyata. Setelah membandingkan info lowongan kerja dengan teliti, ia menemukan lowongan staf pelayan di restoran tradisional Jepang bersejarah di kawasan kota tua, lalu memberanikan diri menelepon untuk melamar.',
      'Pada hari wawancara, Yuki memastikan berpakaian rapi dan membawa surat riwayat hidup (rirekisho) dengan hati-hati di tasnya. Tiba sepuluh menit sebelum waktu yang dijanjikan dan membuka pintu geser restoran, ia disambut oleh salam yang bersemangat dan aroma dashi yang menggugah selera. Melihat raut wajah manajer toko yang tegas, jantungnya berdegup kencang dan ketegangan mendalam menyelimuti seluruh tubuhnya.',
      'Dalam wawancara, ia ditanya bukan hanya tentang alasan melamar, melainkan kesulitan yang dihadapi selama di Jepang serta cita-citanya di masa depan. Sambil memilih kata-kata, dengan sikap tulus meski terbata-bata, Yuki menyampaikan antusiasmenya sekuat tenaga. \"Meski ada rasa khawatir dalam berbahasa, saya akan berusaha melayani pelanggan dengan sopan dan bertanggung jawab penuh.\"',
      'Manajer toko menatap tajam kesungguhan di mata Yuki, lalu tersenyum hangat dan berkata, \"Saya sangat menyukai sikapmu yang bersungguh-sungguh. Jangan takut berbuat salah, mari berkembang bersama di kedai kami.\" Mendengar perkataan itu, Yuki menghela napas lega seraya merasakan harapan berkobar dari lubuk hatinya.'
    ]
  },
  {
    id: 'n3-s2',
    series: 'Dinamika Kerja & Kedewasaan',
    seriesPart: 2,
    nextId: 'n3-s3',
    prevId: 'n3-s1',
    level: 'N3',
    title: '厨房での失敗と先輩の温かい指導',
    titleArti: 'Kesalahan di Dapur dan Bimbingan Hangat Senior',
    paragraphs: [
      '勤務が始まって二週間が過ぎた頃、店の忙しさは週末のピークを迎えました。満席の客席から次々と注文が入り、厨房の中は怒号のような掛け声と食器の音で騒然としていました。ユキは注文を厨房に伝える連絡係を担当していましたが、焦るあまり伝票のテーブル番号を誤って聞き取ってしまいました。',
      'その結果、別のテーブルへ違う高価な料理を運んでしまい、お客様から厳しい不満の声を浴びることになりました。頭が真っ白になり、申し訳なさと自分の未熟さに涙がこぼれそうになるユキの前に、店長と先輩の佐藤さんが静かに現れました。佐藤さんは深く頭を下げて丁寧にお客様に謝罪し、事態を迅速に収拾してくれました。',
      '閉店後の片付けの際、ひどく落ち込むユキに対して、佐藤さんは温かいお茶を差し出しながら語りかけました。「誰でも最初は失敗するものだよ。大切なのは、言い訳をせずに状況を正確に報告し、原因を分析して次にどう改善するか考えることなんだ。」',
      '先輩の冷静で思いやりのある指導に、ユキは深く納得し、自分の甘さを反省しました。失敗は決して無駄ではなく、自分の責任感を育て、より強い信頼関係を築くための貴重な教訓であると理解することができた夜でした。'
    ],
    translations: [
      'Sekitar dua minggu setelah mulai bekerja, kesibukan restoran mencapai puncaknya di akhir pekan. Pesanan masuk bertubi-tubi dari kursi pelanggan yang penuh sesak, dan bagian dalam dapur riuh oleh seruan aba-aba dan denting perabot makan. Yuki bertugas meneruskan pesanan ke dapur, tetapi karena terlalu terburu-buru dan panik, ia salah mendengar nomor meja pada nota pesanan.',
      'Akibatnya, ia mengantarkan hidangan mahal yang salah ke meja lain, dan menuai keluhan keras dari pelanggan. Pikirannya seketika membeku, dan di ambang air mata karena rasa bersalah serta ketidakmampuannya, manajer toko dan senior Sato-san muncul dengan tenang. Sato-san membungkuk dalam-dalam meminta maaf dengan santun kepada pelanggan dan meredakan situasi dengan cepat.',
      'Saat beres-beres setelah toko tutup, melihat Yuki yang sangat terpukul, Sato-san menyodorkan secangkir teh hangat sambil bertutur, \"Siapa pun pasti pernah berbuat salah di awal. Yang terpenting bukanlah mencari alasan, melainkan melaporkan situasi secara akurat, menganalisis penyebabnya, dan memikirkan perbaikan untuk berikutnya.\"',
      'Mendengar bimbingan senior yang tenang dan penuh pengertian, Yuki sangat mengerti dan merefleksikan kecerobohannya. Ia memahami bahwa kesalahan tidak pernah sia-sia, melainkan pelajaran berharga untuk memupuk rasa tanggung jawab dan membangun ikatan kepercayaan yang jauh lebih kuat.'
    ]
  },
  {
    id: 'n3-s3',
    series: 'Dinamika Kerja & Kedewasaan',
    seriesPart: 3,
    nextId: 'n3-s4',
    prevId: 'n3-s2',
    level: 'N3',
    title: '常連客との交流と深まる信頼感',
    titleArti: 'Interaksi dengan Pelanggan Tetap dan Kepercayaan yang Tumbuh',
    paragraphs: [
      '失敗を乗り越えて三ヶ月が経つと、ユキは業務の段取りをスムーズに把握できるようになり、周囲の状況を冷静に観察する余裕が生まれました。接客用語の表現や丁寧な敬語の使い方も自然になり、厨房との連携も完璧にこなせるようになっていました。',
      'この店には、毎週火曜日の夕方に必ず一人で訪れる田中さんという高齢の常連客がいました。田中さんは無口で少し気難しい印象でしたが、ユキはいつも「田中様、本日もご来店ありがとうございます。いつもの熱い緑茶をお持ちしましょうか」と笑顔で挨拶を続けました。',
      'ある雨の降る寒い日、田中さんが帰り際に傘を忘れて歩き出そうとしたところ、ユキは走って傘を届けました。「雨に濡れるとお風邪を引かれますので、どうぞお使いください。」田中さんは驚いた表情を見せた後、目を細めて「ユキさん、君は本当に気が利くね。いつも気持ちの良い時間をありがとう」と温かい言葉をかけてくれました。',
      '常連客から名前で呼ばれ、感謝されたその瞬間、ユキの胸は大きな喜びに満たされました。単なる労働ではなく、誠意を持ったコミュニケーションが人の心を動かし、かけがえのない信頼を生み出すのだと、仕事の本当の醍醐味を実感しました。'
    ],
    translations: [
      'Tiga bulan berlalu setelah mengatasi kegagalannya, Yuki kini mampu menguasai alur kerja dengan lancar dan memiliki ketenangan untuk mengamati keadaan di sekitarnya. Penggunaan kosakata pelayanan dan keigo yang santun telah menjadi alami, serta koordinasi dengan dapur pun dikerjakannya dengan sempurna.',
      'Di kedai ini, ada pelanggan setia lansia bernama Tanaka-san yang selalu datang sendirian setiap Selasa petang. Tanaka-san tampak pendiam dan berkesan agak sulit didekati, tetapi Yuki selalu menyapanya ramah, \"Tanaka-sama, terima kasih banyak atas kunjungannya hari ini. Bolehkah saya bawakan teh hijau panas seperti biasa?\".',
      'Pada suatu hari hujan yang dingin, saat Tanaka-san lupa membawa payungnya saat hendak melangkah pulang, Yuki berlari mengantarkan payung tersebut kepadanya. \"Jika kehujanan nanti Bapak bisa masuk angin, silakan gunakan ini.\" Tanaka-san tampak terkejut, lalu matanya berbinar dan berucap hangat, \"Yuki-san, kamu sungguh penuh perhatian ya. Terima kasih selalu memberi waktu yang menyenangkan.\"',
      'Dipanggil nama oleh pelanggan tetap dan diapresiasi secara tulus pada momen itu membuat dada Yuki dipenuhi kebahagiaan luar biasa. Ia menyadari bahwa bekerja bukan sekadar mencari nafkah, melainkan komunikasi dengan ketulusan hati yang mampu menyentuh orang lain dan melahirkan kepercayaan tak ternilai.'
    ]
  },
  {
    id: 'n3-s4',
    series: 'Dinamika Kerja & Kedewasaan',
    seriesPart: 4,
    nextId: 'n3-s5',
    prevId: 'n3-s3',
    level: 'N3',
    title: '伝統の夏祭りと仲間たちとの絆',
    titleArti: 'Festival Musim Panas Tradisional dan Ikatan Persahabatan',
    paragraphs: [
      '本格的な夏の暑さが訪れた七月、町内会で伝統的な夏祭りが開催されることになり、ユキの店も神社前の広場に屋台を出店することになりました。店長から「屋台の責任者補佐として、ユキにも仕込みや販売を手伝ってもらいたい」と頼まれ、ユキは重要な役目を任されたことに強い意欲を燃やしました。',
      '祭りの当日は、夕方になると太鼓の力強いリズムが鳴り響き、浴衣を着た大勢の家族連れや若者たちで境内が埋め尽くされました。ユキたちの屋台では特製の焼き鳥と冷たい飲み物を販売しましたが、予想を大幅に超える長蛇の列ができ、瞬く間に息をつく暇もない忙しさとなりました。',
      'しかし、以前の失敗から学んだユキは決して慌てませんでした。佐藤先輩と絶えず声を掛け合い、食材の補充状況を確認しながら、並んでいるお客様に「お待たせして申し訳ございません」と笑顔で対応しました。チーム全体が一つの目標に向かって団結し、互いを助け合う姿には強い連帯感が溢れていました。',
      '夜空に大輪の花火が打ち上がった時、用意していたすべての料理は見事に完売しました。汗だくになった仲間たちとハイタッチを交わした瞬間、ユキはこの店の一員として認められた誇らしさと、言葉の壁を越えた深い絆を心から実感していました。'
    ],
    translations: [
      'Bulan Juli ketika hawa panas musim panas yang terik melanda, sebuah festival musim panas tradisional digelar oleh asosiasi warga kota, dan kedai tempat Yuki bekerja pun memutuskan membuka stan di alun-alun depan kuil. Manajer memintanya, \"Sebagai asisten penanggung jawab stan, saya ingin Yuki membantu persiapan dan penjualan,\" membuat Yuki terpacu oleh tanggung jawab besar yang dipercayakan kepadanya.',
      'Pada hari festival, menjelang petang irama tabuhan drum taiko berkumandang dengan gagah, dan area kuil dipadati oleh kerumunan keluarga dan anak muda berbusana yukata. Di stan Yuki, mereka menjual yakitori istimewa dan minuman dingin, namun antrean panjang melampaui dugaan segera terbentuk, hingga tak ada sedetik pun waktu untuk beristirahat.',
      'Namun, berbekal pelajaran dari kegagalan sebelumnya, Yuki sama sekali tidak panik. Ia terus saling bersahut suara memberi aba-aba dengan Sato-senpai, memeriksa sisa persediaan bahan, sambil menyapa pelanggan yang mengantre dengan senyum, \"Mohon maaf telah membuat Anda menunggu lama.\" Seluruh tim bersatu menuju satu tujuan, dan rasa solidaritas terpancar kuat saat saling membantu.',
      'Ketika kembang api raksasa merekah menghiasi langit malam, semua hidangan yang disiapkan habis terjual tanpa sisa. Saat bertepuk tangan tos dengan rekan-rekan yang bersimbah peluh, Yuki sungguh-sungguh merasakan kebanggaan diakui sebagai bagian dari kedai ini serta ikatan batin mendalam yang melampaui sekat bahasa.'
    ]
  },
  {
    id: 'n3-s5',
    series: 'Dinamika Kerja & Kedewasaan',
    seriesPart: 5,
    nextId: null,
    prevId: 'n3-s4',
    level: 'N3',
    title: 'アルバイト修了と次なる夢への一歩',
    titleArti: 'Selesai Masa Kerja dan Langkah Menuju Impian Berikutnya',
    paragraphs: [
      '日本に来てから一年が経ち、ユキは大学進学の準備に専念するため、アルバイトを卒業する時期を迎えました。最後の勤務日、常連の田中さんが花束を抱えて店に現れ、「君がいなくなると寂しくなるけれど、新しい夢に向かって頑張りなさい」と力強く励ましてくれました。',
      '営業が終わった後、店長とスタッフ全員がサプライズで送別会を開いてくれました。テーブルの上にはユキの大好物が並び、店長から色紙が手渡されました。そこには仲間たちからの温かい感謝と応援のメッセージがびっしりと書かれており、ユキの目から大粒の涙が溢れ出しました。',
      '「一年間、たくさんの失敗をしてご迷惑をおかけしましたが、皆様のおかげで言葉だけでなく、人と心を通わせる本当の優しさを学びました。」ユキが感謝を述べると、店長は肩を優しく叩いて「君はもう立派な社会人の一歩を踏み出しているよ」と誇らしげに語りました。',
      '店を出て夜風に吹かれながら、ユキは夜空の星を見上げました。アルバイトを通じて得た経験、責任感、そして温かい人間関係は、これから先のどんな困難も乗り越えるための強い自信となっていました。ユキは確かな足取りで、未来へ向かって歩き出しました。'
    ],
    translations: [
      'Satu tahun telah berlalu sejak kedatangannya ke Jepang, dan tiba saatnya bagi Yuki mengakhiri kerja paruh waktunya guna berkonsentrasi mempersiapkan ujian masuk universitas. Pada hari kerja terakhirnya, pelanggan tetap Tanaka-san datang membawa sebuket bunga dan menyemangatinya, \"Pasti akan sepi tanpamu, tapi berjuanglah menggapai impian barumu ya!\"',
      'Setelah jam buka usai, manajer dan seluruh staf mengadakan pesta perpisahan kejutan untuknya. Makanan favorit Yuki tersaji di meja, dan manajer menyerahkan papan kenang-kenangan shikishi yang dipenuhi pesan terima kasih dan dukungan hangat dari rekan-rekannya, membuat air mata haru menetes membasahi pipi Yuki.',
      '\"Selama satu tahun ini, saya telah banyak berbuat salah dan merepotkan semuanya, namun berkat Anda sekalian, saya belajar bukan hanya bahasa, melainkan kebaikan tulus untuk saling menyatukan hati antarmanusia.\" Saat Yuki menyampaikan rasa terima kasihnya, sang manajer menepuk pundaknya lembut dan berkata bangga, \"Kamu sudah melangkah mantap menjadi pribadi dewasa yang tangguh.\"',
      'Melangkah keluar toko diterpa sejuknya angin malam, Yuki memandang bintang-bintang di angkasa. Pengalaman, rasa tanggung jawab, dan kehangatan persahabatan yang ia raih selama bekerja paruh waktu telah menjadi rasa percaya diri kokoh untuk mengatasi rintangan apa pun kelak. Dengan langkah pasti, Yuki melangkah maju menyongsong masa depan.'
    ]
  },

  // ==========================================
  // N3 THEMATIC READINGS (3 Judul)
  // ==========================================
  {
    id: 'n3-c1',
    series: 'Fenomena Sosial Jepang',
    seriesPart: 1,
    nextId: 'n3-c2',
    prevId: null,
    level: 'N3',
    title: '日本のコンビニエンスストア：生活を支える多機能空間',
    titleArti: 'Toko Serba Ada Jepang: Ruang Multifungsi Penopang Kehidupan',
    paragraphs: [
      '日本の町を歩くと、数分おきにコンビニエンスストアの看板を目にします。全国に五万軒以上存在するコンビニは、単なる食料品や日用品の販売店にとどまらず、現代社会における人々の生活基盤を支える極めて重要なインフラとしての役割を果たしています。',
      '店内に足を踏み入れると、出来立ての温かいお弁当や惣菜、淹れたてのコーヒーから最新の雑誌まで、消費者の需要に応じた豊富な商品が並んでいます。さらに、公共料金の支払いや銀行の入出金、宅配便の発送やコンサートのチケット発券など、多種多様なサービスが二十四時間いつでも利用可能です。',
      'また、地震や台風などの自然災害が発生した際には、被災地に食料や飲料水を供給する救援拠点としても機能します。多くの店舗が自家発電設備や災害支援の協定を結んでおり、地域社会の安全を守る防犯ステーションとしての価値も高く評価されています。',
      'このように、徹底した効率性と顧客目線のサービスによって発展を遂げた日本のコンビニは、世界からも注目を集める独自の生活文化の象徴となっているのです。'
    ],
    translations: [
      'Saat menyusuri jalanan kota di Jepang, setiap beberapa menit sekali kita akan menjumpai plang nama toko serba ada (konbini). Konbini yang jumlahnya melebihi lima puluh ribu gerai di seantero negeri bukan sekadar toko penjual bahan makanan dan kebutuhan sehari-hari, melainkan memegang peranan krusial sebagai infrastruktur vital penopang basis kehidupan masyarakat modern.',
      'Melangkahkan kaki ke dalam toko, tersaji produk melimpah sesuai kebutuhan konsumen, mulai dari bento hangat yang baru matang, aneka lauk siap saji, seduhan kopi segar, hingga majalah edisi terbaru. Terlebih lagi, aneka layanan beragam seperti pembayaran tagihan utilitas, setor tarik tunai perbankan, pengiriman paket ekspres, hingga pencetakan tiket konser dapat diakses dua puluh empat jam kapan pun.',
      'Tak hanya itu, tatkala terjadi bencana alam seperti gempa bumi atau badai taifun, gerai-gerai ini berfungsi sebagai posko bantuan untuk menyuplai makanan dan air bersih ke daerah terdampak. Banyak gerai memiliki fasilitas genset mandiri dan menjalin nota kesepakatan tanggap darurat, sehingga dinilai tinggi pula sebagai stasiun pemantau keamanan lingkungan warga.',
      'Dengan demikian, konbini Jepang yang berkembang berkat efisiensi menyeluruh dan pelayanan berorientasi pelanggan telah menjadi lambang budaya hidup unik yang memikat perhatian dunia.'
    ]
  },
  {
    id: 'n3-c2',
    series: 'Fenomena Sosial Jepang',
    seriesPart: 2,
    nextId: 'n3-c3',
    prevId: 'n3-c1',
    level: 'N3',
    title: '健康的な食生活と日本の長寿の秘密',
    titleArti: 'Pola Makan Sehat dan Rahasia Panjang Umur Masyarakat Jepang',
    paragraphs: [
      '日本は世界有数の長寿国として知られており、平均寿命の長さは常に国際的な統計で上位に位置しています。その健康と長寿を支える最も大きな要因の一つとして、日本人が古くから受け継いできた伝統的な食生活の知恵が挙げられます。',
      '「一汁三菜」を基本とする和食のスタイルは、主食のご飯に汁物と三種類の主菜・副菜を組み合わせることで、栄養のバランスを自然に整えます。特に魚や大豆製品、海藻や発酵食品を豊富に摂取する傾向があり、動物性脂肪や塩分の過剰摂取を抑える効果があります。',
      'さらに、昔からの教えである「腹八分目」という習慣も重要です。満腹になるまで食べ過ぎず、八割程度の食事量で抑えることは、胃腸への負担を軽減し、肥満や生活習慣病の予防に極めて効果的であると医学的にも証明されています。',
      '毎日の食事に感謝し、季節の新鮮な旬の食材を美味しく味わう姿勢こそが、健康で豊かな長寿社会を実現する基盤となっているのです。'
    ],
    translations: [
      'Jepang dikenal sebagai salah satu negara dengan tingkat harapan hidup tertinggi di dunia, dan rata-rata usianya selalu berada di peringkat teratas dalam statistik internasional. Salah satu faktor terbesar penopang kesehatan dan panjang umur tersebut adalah kearifan pola makan tradisional yang diwariskan turun-temurun oleh bangsa Jepang.',
      'Gaya santapan washoku yang berpegang pada konsep dasar \"Ichiju Sansai\" (satu sup tiga lauk) menyelaraskan keseimbangan nutrisi secara alami dengan memadukan nasi sebagai makanan pokok bersama semangkuk sup dan tiga macam lauk utama/pendamping. Khususnya, ada kecenderungan mengonsumsi banyak ikan, produk kedelai, rumput laut, dan makanan fermentasi, yang berkhasiat menekan asupan lemak hewani dan garam berlebih.',
      'Selain itu, ajaran lama bernama \"Hara Hachi Bunme\" (makan hingga 80 persen kenyang) pun memegang peranan krusial. Tidak makan berlebih hingga kekenyangan melainkan membatasi porsi di kisaran delapan puluh persen secara medis terbukti amat mangkus meringankan beban lambung serta mencegah obesitas dan penyakit metabolik.',
      'Sikap bersyukur atas santapan harian dan menikmati bahan pangan musiman segar yang lezat inilah yang menjadi pondasi kokoh terciptanya masyarakat yang sehat, makmur, dan berumur panjang.'
    ]
  },
  {
    id: 'n3-c3',
    series: 'Fenomena Sosial Jepang',
    seriesPart: 3,
    nextId: null,
    prevId: 'n3-c2',
    level: 'N3',
    title: '新幹線が誇る世界最高峰の定時運行と安全性',
    titleArti: 'Ketepatan Waktu Operasional Kelas Dunia dan Keselamatan Shinkansen',
    paragraphs: [
      '一九六四年の東京オリンピックに合わせて開業した東海道新幹線は、半世紀以上にわたって日本の大動脈として経済の発展を力強く牽引してきました。時速三百キロ近い高速で走りながらも、開業以来、乗客の死亡事故が一度も起きていないという驚異的な安全記録を維持しています。',
      '新幹線が世界から絶賛されるもう一つの理由は、秒単位で管理される驚くべき運行時間の正確さです。天候不良や自然災害などの不可抗力を除けば、年間の平均遅延時間はわずか数十秒程度にとどまり、この高い信頼性がビジネスや観光の利便性を大きく支えています。',
      'この正確さと安全性の背景には、高度な自動列車制御システムに加え、深夜に行われる線路や架線の徹底的な点検作業、そして清掃スタッフによるわずか七分間の奇跡的な車内清掃技術など、現場スタッフの職人技とも言える献身的な努力が存在します。',
      '最先端の科学技術と人の細やかな注意力が融合した新幹線システムは、現代の日本が世界に誇る技術力と安全への徹底したこだわりの結晶なのです。'
    ],
    translations: [
      'Tokaido Shinkansen yang mulai beroperasi bertepatan dengan Olimpiade Tokyo tahun 1964 telah menjadi urat nadi penggerak kuat pertumbuhan ekonomi Jepang selama lebih dari setengah abad. Meskipun melaju kencang mendekati kecepatan tiga ratus kilometer per jam, kereta ini mempertahankan rekor keselamatan luar biasa di mana sejak awal peluncurannya belum pernah sekalipun terjadi kecelakaan fatal yang merenggut nyawa penumpang.',
      'Alasan lain mengapa Shinkansen menuai pujian luas dunia adalah ketepatan jadwal operasinya yang dikelola hingga hitungan detik. Di luar keadaan kahar seperti cuaca ekstrem atau bencana alam, rata-rata keterlambatan tahunannya hanya berkisar puluhan detik saja, dan keandalan tinggi ini menjadi tulang punggung mobilitas bisnis dan pariwisata.',
      'Di balik ketepatan dan keselamatan ini, selain sistem kontrol kereta otomatis berteknologi tinggi, terdapat inspeksi rel dan kabel listrik yang teliti di larut malam, serta keterampilan luar biasa staf kebersihan yang menyulap kabin kereta bersih mengilap hanya dalam tempo tujuh menit. Itu semua adalah wujud dedikasi tinggi staf lapangan.',
      'Sistem Shinkansen yang memadukan teknologi mutakhir dengan ketelitian mendalam manusia adalah mahakarya kebanggaan Jepang di kancah global atas keunggulan teknologi dan dedikasi mutlak terhadap keselamatan.'
    ]
  },

  // ==========================================
  // N2 SERIES: Dinamika Dunia Kerja Modern (5 Bab Bersambung)
  // ==========================================
  {
    id: 'n2-s1',
    series: 'Dinamika Karier & Transformasi Modern',
    seriesPart: 1,
    nextId: 'n2-s2',
    prevId: null,
    level: 'N2',
    title: '就職活動の荒波と自己分析の苦悩',
    titleArti: 'Gelombang Terjal Berburu Kerja dan Pergulatan Analisis Diri',
    paragraphs: [
      '長引く景気の低迷と産業構造の急激な地殻変動を背景に、日本の就職活動は学生たちに極めて高度な適応能力を要求しています。大学四年生の秋山大樹は、リクルートスーツに身を包み、連日企業の会社説明会や適性検査の会場を駆け巡る過酷な日々に追われていました。周囲の同級生が次々と内定を獲得していく状況に焦燥感を募らせ、将来への不透明な見通しが重いプレッシャーとなってのしかかっていました。',
      '就職活動において最大の難関となったのは、自分自身の強みや潜在的な価値観を言語化する「自己分析」の作業でした。学生時代に注力した活動の実績や、予期せぬ困難を克服した経験を論理的に組み立て、志望動機と有機的に結びつけなければなりません。大樹は何度も履歴書を推敲し、自身のキャリアに対する根本的な願望と真摯に向き合いました。',
      '志望するIT総合商社の最終面接において、役員から「我が社の既存の枠組みにとらわれず、君自身はどのような付加価値を提供できるか」という鋭い質問を投げかけられました。大樹は一瞬息を呑みましたが、用意された模範解答を捨て、自らの率直な問題意識と、失敗を恐れずに新規事業へ挑戦したいという覚悟を堂々と語りました。',
      '数日後、スマートフォンに届いた一通の合格通知を凝視した瞬間、全身から緊張の糸が解け、熱い安堵の感情が込み上げました。激動の就職活動という荒波を乗り越えた経験は、大樹にとって単なる就職の内定にとどまらず、自立した職業人としての強固なアイデンティティを確立する貴重な転機となったのです。'
    ],
    translations: [
      'Dengan latar belakang stagnasi ekonomi berkepanjangan dan pergeseran tektonik pada struktur industri, perburuan kerja (shukatsu) di Jepang menuntut kapabilitas adaptasi yang sangat tinggi dari para mahasiswa. Akiyama Daiki, seorang mahasiswa tingkat akhir, berbalut setelan jas formal, disibukkan oleh hari-hari melelahkan menghadiri seminar perusahaan dan ujian bakat tanpa henti. Menyaksikan teman-teman seangkatannya satu demi satu meraih tawaran kerja (naitei), rasa cemasnya kian membuncah, dan prospek masa depan yang remang-remang menjadi tekanan berat di pundaknya.',
      'Tantangan terberat dalam berburu kerja adalah proses \"analisis diri\" (jiko bunseki) untuk mengartikulasikan keunggulan dan nilai-nilai esensial dalam diri secara verbal. Ia dituntut merangkai rekam jejak aktivitas masa kuliah dan pengalaman mengatasi rintangan tak terduga secara logis, lalu menautkannya secara organik dengan motivasi melamar. Daiki berulang kali merevisi berkas lamarannya, berhadapan secara jujur dengan aspirasi terdalam mengenai jalan kariernya.',
      'Dalam wawancara babak akhir di perusahaan konglomerasi IT incarannya, dewan direksi melontarkan pertanyaan tajam, \"Tanpa terbelenggu oleh kerangka kerja kami yang sudah ada, nilai tambah apa yang sanggup Anda kontribusikan?\". Daiki sempat tercekat, namun ia membuang contekan jawaban klise, dan dengan mantap mengutarakan pemikiran kritisnya yang lugas serta tekadnya untuk menantang bisnis rintisan baru tanpa takut gagal.',
      'Beberapa hari berselang, tatkala menatap layar ponsel yang memuat notifikasi kelulusan, ketegangan seketika luruh digantikan rasa lega yang membuncah. Pengalaman menaklukkan ombak terjal pencarian kerja bukan sekadar meraih status pekerjaan, melainkan momentum krusial yang mengokohkan identitas Daiki sebagai insan profesional yang mandiri.'
    ]
  },
  {
    id: 'n2-s2',
    series: 'Dinamika Karier & Transformasi Modern',
    seriesPart: 2,
    nextId: 'n2-s3',
    prevId: 'n2-s1',
    level: 'N2',
    title: '新入社員の試練：組織の論理と個人の価値観',
    titleArti: 'Ujian Karyawan Baru: Logika Organisasi vs Nilai-nilai Individu',
    paragraphs: [
      '晴れて希望の企業に入社した大樹を待ち受けていたのは、学生時代の自由な発想とは根本的に異なる「組織の論理」という分厚い壁でした。新入社員研修を経て営業開発部に配属されたものの、日々の業務は膨大な社内資料の作成や議事録の整理、複雑な根回しなど、地道かつ厳格な手続きの連続でした。自分の創意工夫を即座に反映できない現実に、大樹は苛立ちと焦燥感を抱き始めました。',
      'ある重要な顧客への提案資料の作成において、大樹は効率性を最優先し、社内規定の承認ルートを省略して直接クライアントへ送付してしまいました。結果として、取引先の役職者から記載事項の不備に関する厳重な指摘を受け、プロジェクト全体に深刻な遅延をもたらす危機を引き起こしてしまいました。直属の上司である佐伯課長は、激怒することなく冷静に事態の収拾に奔走してくれました。',
      'トラブルが解決した夜、佐伯課長は大樹を呼び止め、厳しくも温かい眼差しで諭しました。「個人の斬新なアイデアを形にするためには、まず組織全体を支える信頼の基盤を遵守しなければならない。ルールを軽視したスタンドプレーは、チーム全体の業績を崩壊させるリスクを孕んでいるんだ。」',
      '課長の言葉は大樹の胸に深く刺さり、自らの傲慢さを痛感させられました。独創性と組織規律は対立するものではなく、確固たる信頼関係の上に立脚して初めて最大の成果を発揮するのだと悟り、大樹は謙虚な姿勢で自らの職務を再定義することを誓いました。'
    ],
    translations: [
      'Menyambut masa kerja di perusahaan impiannya, yang telah menanti Daiki adalah tembok tebal bernama \"logika organisasi\", yang secara fundamental bertolak belakang dengan kebebasan berpikir semasa kuliah. Kendati telah menyelesaikan pelatihan dan ditempatkan di divisi pengembangan penjualan, kesehariannya berkutat pada penyusunan dokumen internal yang menumpuk, notulensi rapat, dan konsensus internal (nemawashi) yang sarat birokrasi ketat. Tak mampu segera menuangkan kreativitasnya, rasa frustrasi dan gelisah mulai merayap di hatinya.',
      'Dalam penyusunan dokumen proposal untuk klien krusial, Daiki memprioritaskan efisiensi sepihak dengan memotong jalur persetujuan regulasi internal dan langsung mengirimkannya ke klien. Alhasil, pihak pimpinan rekanan melayangkan teguran keras atas ketidaklengkapan klausul, memicu krisis keterlambatan serius bagi keseluruhan proyek. Kepala Seksi Saeki selaku atasan langsungnya tidak memarahinya secara membabi buta, melainkan dengan tenang berupaya memulihkan keadaan.',
      'Usai masalah teratasi malam itu, Kasi Saeki memanggil Daiki dan menasihati dengan tatapan tegas nan hangat, \"Guna mewujudkan gagasan baru yang segar, fondasi kepercayaan yang menopang seluruh organisasi wajib ditaati terlebih dahulu. Tindakan egois yang mengabaikan aturan menyimpan risiko meruntuhkan pencapaian seluruh tim.\".',
      'Kata-kata atasannya menghunjam relung kalbu Daiki, menyadarkannya akan arogansi dirinya. Ia menginsafi bahwa orisinalitas dan disiplin organisasi bukanlah hal yang bertentangan, melainkan baru sanggup membuahkan hasil optimal tatkala berpijak di atas kepercayaan yang kokoh; Daiki pun berikrar menata kembali tugasnya dengan kerendahan hati.'
    ]
  },
  {
    id: 'n2-s3',
    series: 'Dinamika Karier & Transformasi Modern',
    seriesPart: 3,
    nextId: 'n2-s4',
    prevId: 'n2-s2',
    level: 'N2',
    title: 'リモートワークの普及と人間関係の再構築',
    titleArti: 'Meluasnya Kerja Jarak Jauh dan Rekonstruksi Hubungan Antar Manusia',
    paragraphs: [
      '入社から三年が経過した頃、感染症の世界的な拡大とデジタル技術の急速な進化を機に、日本企業の労働環境は激変しました。大樹の部署でも週の大部分を在宅勤務とするリモートワーク制度が本格的に導入され、長時間の満員電車による通勤負担から解放されるとともに、個人の裁量で業務を進める効率性が大幅に向上しました。',
      'しかし、この働き方の柔軟性がもたらした恩恵の裏側で、新たな課題が浮き彫りになり始めました。対面での偶発的な雑談や意思疎通の機会が激減したことにより、同僚との心理的な距離感が広がり、業務上の些細なニュアンスの違いが原因で予期せぬ誤解や摩擦が生じる事態が頻発したのです。画面越しだけのやり取りでは、相手の表情や微妙な感情の機微を察知することが極めて困難でした。',
      'この閉塞感を打開するため、大樹は自発的に毎朝十五分間のオンラインカジュアルミーティングを提案しました。業務の進捗状況の確認にとどまらず、日々の些細な発見や健康状態を率直に共有し合える場を整えたことで、チーム内に再び活発な対話と協力関係が蘇りました。',
      '物理的な距離が隔てられた環境だからこそ、相手に対する積極的な配慮と丁寧なリスペクトが不可欠であると大樹は実感しました。テクノロジーがどれほど発達しようとも、強固な人間関係の維持には温かい感情の通い合いが欠かせないという普遍的な真理を学んだのです。'
    ],
    translations: [
      'Menjelang tahun ketiga masa kerjanya, dipicu oleh pandemi global dan lompatan pesat teknologi digital, lanskap lingkungan kerja di korporasi Jepang bermutasi drastis. Divisi Daiki mengadopsi sistem kerja jarak jauh (remote work) secara penuh untuk sebagian besar hari kerja, melepaskan pekerja dari keletihan komuter kereta berjejal serta meningkatkan efisiensi kerja mandiri secara signifikan.',
      'Namun di balik kemudahan fleksibilitas cara kerja ini, persoalan baru mulai mengemuka. Berkurangnya interaksi tatap muka dan obrolan spontan memperlebar jarak psikologis antarrekan kerja, hingga kerap memantik kesalahpahaman akibat distorsi nuansa pesan tertulis. Melalui layar monitor semata, amat sukar menangkap rona ekspresi wajah serta gejolak emosi lawan bicara secara peka.',
      'Guna mendobrak kebuntuan ini, Daiki berinisiatif mengusulkan pertemuan daring santai berdurasi lima belas menit setiap pagi. Bukan sekadar meninjau progres pekerjaan, melainkan menjadi wadah terbuka membagikan kabar kesehatan dan cerita harian, yang berhasil menghidupkan kembali dialog intensif dan kerja sama di dalam tim.',
      'Daiki menyadari bahwa di tengah sekat jarak fisik, kepedulian proaktif dan rasa hormat yang santun kepada sesama justru semakin mutlak diperlukan. Betapapun pesatnya lompatan teknologi, ia memetik kebenaran hakiki bahwa pemeliharaan relasi manusiawi yang erat senantiasa membutuhkan pertukaran empati yang hangat.'
    ]
  },
  {
    id: 'n2-s4',
    series: 'Dinamika Karier & Transformasi Modern',
    seriesPart: 4,
    nextId: 'n2-s5',
    prevId: 'n2-s3',
    level: 'N2',
    title: '転職という決断：終身雇用神話の終焉',
    titleArti: 'Keputusan Pindah Kerja: Runtuhnya Mitos Kerja Seumur Hidup',
    paragraphs: [
      '三十代を目前にした大樹は、社内でも実績を評価され、重要なプロジェクトリーダーを任される立場に成長していました。しかしその一方で、かつて日本企業の象徴であった年功序列や終身雇用の神話が崩壊しつつある現実を肌で感じていました。安定した組織の庇護の下で定年まで過ごすのではなく、自身の専門性を極限まで高め、市場価値のあるスキルを獲得することへの欲求が日増しに強くなっていきました。',
      'そんな折、環境技術を活用した新興のグリーンテック企業から、事業開発責任者としてのスカウトの打診を受けました。大企業のような手厚い福利厚生や盤石な給与体系は保証されないものの、自らの手で持続可能な社会基盤を構築するという挑戦的なビジョンに、大樹の心は強く揺さぶられました。家族や同僚からは「安定を捨てるのはリスクが高すぎる」と忠告されましたが、大樹の意志は揺らぎませんでした。',
      '退職を告げた際、かつて厳しく指導してくれた佐伯課長は、寂しさを滲ませながらも力強く背中を押してくれました。「自分の信じる道へ踏み出す勇気こそが、変化の激しい時代を生き抜く最大の武器だ。君の培ってきた実績なら、どこへ行っても必ず通用する。」',
      '大企業という居心地の良い巣を離れ、未知なる荒野へ飛び立つ決断は、大樹にとって計り知れない恐怖を伴うものでした。しかし、自らの意志で人生の舵を取り、不確実な未来を自力で切り拓いていく覚悟こそが、真の自由を手に入れる唯一の道であると確信していました。'
    ],
    translations: [
      'Menjelang usia kepala tiga, prestasi Daiki diapresiasi luas di perusahaan dan ia dipercaya memimpin proyek-proyek strategis. Kendati demikian, ia merasakan runtuhnya mitos senioritas dan kerja seumur hidup yang dahulu menjadi pilar korporasi Jepang. Alih-alih berlindung di bawah naungan organisasi yang mapan hingga pensiun, hasratnya kian membara untuk mengasah keahlian spesifik dan meraih kompetensi yang bernilai tinggi di pasar kerja.',
      'Pada momen itu, ia menerima tawaran rekrutmen dari sebuah perusahaan rintisan teknologi ramah lingkungan (greentech) untuk menduduki posisi pimpinan pengembangan bisnis. Walaupun tak ada jaminan tunjangan mewah dan kemapanan gaji seperti di korporasi raksasa, visi menantang untuk membangun infrastruktur sosial berkelanjutan menggetarkan jiwa Daiki. Kendati kerabat menasihati bahwa melepas kemapanan terlalu berisiko, tekadnya tak goyah.',
      'Saat menyampaikan pengunduran dirinya, Kasi Saeki yang dahulu membimbingnya dengan tegas, meski dirundung rasa kehilangan, memberi dorongan moril yang kuat, \"Keberanian melangkah di jalan yang kauyakini adalah senjata terampuh mengarungi zaman yang bergolak ini. Dengan rekam jejak yang telah kautempa, kaupasti sanggup bersaing di mana pun.\".',
      'Meninggalkan sarang nyaman korporasi besar dan melompat ke belantara ketidakpastian membawa kecemasan mendalam bagi Daiki. Namun, ia yakin seutuhnya bahwa memegang kemudi hidup dengan kehendak sendiri dan meretas masa depan mandiri adalah satu-satunya jalan menuju kebebasan sejati.'
    ]
  },
  {
    id: 'n2-s5',
    series: 'Dinamika Karier & Transformasi Modern',
    seriesPart: 5,
    nextId: null,
    prevId: 'n2-s4',
    level: 'N2',
    title: 'ワークライフバランスの実現と未来への展望',
    titleArti: 'Mewujudkan Keseimbangan Hidup dan Visi Masa Depan',
    paragraphs: [
      '転職から数年が経ち、大樹は新規事業を軌道に乗せることに成功し、多忙ながらも充実した日々を送っていました。スタートアップ特有の柔軟な組織風土の中で、成果主義と同時に重視されていたのが、個人の尊厳とワークライフバランスの調和でした。長時間の無駄な残業を廃止し、限られた時間の中で最大の効率性を追求する働き方が徹底されていました。',
      '大樹自身も、仕事の成功だけを追求するのではなく、家族との対話や趣味の時間、そして地域コミュニティへの積極的な参加を通じて、人生全体の豊かさを再定義するようになりました。休日に自然豊かな山へ足を運び、澄んだ空気の中で深呼吸をする時、かつて都会の喧騒の中で見失いかけていた心の平穏を取り戻すことができました。',
      '目まぐるしく変化する現代社会において、不変の正解などどこにも存在しません。しかし、失敗を恐れずに挑戦し続けたキャリアの軌跡を通じて、大樹は自分自身の内なる軸を確立していました。どのような不況や産業の激変が訪れようとも、柔軟に適応し、他者と協調しながら新たな価値を創造していけるという揺るぎない自信が備わっていたのです。',
      '夕暮れのオフィスから東京の街並みを見下ろしながら、大樹は静かに微笑みました。かつて不安に怯えながら上京したあの日から始まった長い旅路は、いま、未来への確固たる希望とともに、さらなる高みを目指す新たなステージへと続いていました。'
    ],
    translations: [
      'Beberapa tahun berselang pascapindah kerja, Daiki berhasil membawa bisnis barunya ke jalur sukses, menjalani hari-hari yang padat namun sarat kepuasan. Di tengah iklim organisasi yang fleksibel, selain meritokrasi hasil, yang dijunjung tinggi adalah harmoni antara martabat individu dan keseimbangan hidup-kerja (work-life balance). Lembur berkepanjangan ditiadakan, dan diupayakan efisiensi optimal dalam durasi kerja terukur.',
      'Daiki pun tak lagi semata mengejar capaian materiil, melainkan merekonstruksi kekayaan hidup melalui dialog hangat bersama keluarga, menekuni hobi, dan terlibat aktif di komunitas warga. Kala mendaki gunung yang asri di akhir pekan dan menghirup udara segar pegunungan, ia menemukan kembali ketenteraman batin yang sempat sirna di tengah hiruk-pikuk metropolitan.',
      'Di tengah laju masyarakat modern yang serba cepat, tiada jawaban mutlak yang abadi. Namun melalui lintasan karier yang ditempa keberanian menghadapi risiko, Daiki telah menegakkan poros jati dirinya. Apapun resesi ekonomi atau disrupsi industri yang menghadang kelak, ia memiliki keyakinan kokoh sanggup beradaptasi luwes dan berkolaborasi melahirkan faedah baru.',
      'Memandang panorama cakrawala Tokyo dari ruang kantor di kala senja, Daiki tersenyum teduh. Perjalanan panjang yang bermula dari pemuda cemas saat menginjakkan kaki di ibu kota dahulu, kini berlanjut menuju panggung masa depan yang gemilang dengan harapan yang tak kunjung padam.'
    ]
  },

  // ==========================================
  // N2 THEMATIC READINGS (3 Judul)
  // ==========================================
  {
    id: 'n2-c1',
    series: 'Isu Global & Kontemporer',
    seriesPart: 1,
    nextId: 'n2-c2',
    prevId: null,
    level: 'N2',
    title: '地球温暖化と持続可能な循環型社会の構築',
    titleArti: 'Pemanasan Global dan Membangun Masyarakat Berkelanjutan Berbasis Sirkular',
    paragraphs: [
      '地球温暖化に伴う気候変動の深刻化は、今や全人類の存亡を揺るがす最優先の課題として国際社会に突きつけられています。世界各地における記録的な猛暑や巨大台風の頻発、氷河の融解による海水面上昇など、観測される気象データは不可逆的な生態系の危機を如実に物語っています。これに対し、温室効果ガスの排出を実質ゼロにするカーボンニュートラルの実現に向けた規制が加速しています。',
      '持続可能な開発目標（SDGs）を達成するためには、従来の「大量生産・大量消費・大量廃棄」を前提とした一方通行の経済モデルから完全に脱却しなければなりません。資源の枯渇を防ぎ、廃棄物を最小限に抑えながら原材料を循環させ続ける「サーキュラーエコノミー（循環型経済）」への転換が急務となっています。',
      '産業界においても、再生可能エネルギーの導入や製品設計段階からのリサイクル性の確保、省エネルギー技術の応用など、環境負荷を低減させるイノベーションが企業の競争力と直接結びつく時代を迎えました。環境への配慮を怠る企業は、投資家や消費者から厳しい淘汰を受けるリスクに直面しています。',
      '真の環境保護を実現するためには、法制度の整備や技術革新にとどまらず、市民一人ひとりが自らの生活様式を見直し、将来世代に対する倫理的な責任を共有する持続可能な価値観を育むことが不可欠なのです。'
    ],
    translations: [
      'Pemanasan global yang memperparah perubahan iklim kini menjadi tantangan paling mendesak yang mengguncang eksistensi umat manusia di tataran internasional. Gelombang panas ekstrem yang memecahkan rekor di berbagai penjuru bumi, maraknya taifun raksasa, serta kenaikan permukaan air laut akibat mencairnya gletser adalah data observasi nyata dari krisis ekosistem yang tak dapat diputarbalikkan. Menghadapi ini, regulasi menuju karbon netral semakin diperketat.',
      'Demi mencapai Tujuan Pembangunan Berkelanjutan (SDGs), mutlak diperlukan pelepasan total dari model ekonomi konvensional searah yang bertumpu pada \"produksi massal, konsumsi massal, dan pembuangan massal\". Transisi menuju ekonomi sirkular yang menjaga bahan mentah terus berputar guna menekan limbah dan mencegah kelangkaan sumber daya telah menjadi keniscayaan mendesak.',
      'Di sektor industri pun, inovasi penurunan jejak karbon—seperti adopsi energi terbarukan, jaminan daur ulang sejak fase rancang bangun produk, serta aplikasi teknologi hemat energi—kini bertaut langsung dengan daya saing bisnis. Entitas korporat yang mengabaikan ekologi menghadapi risiko seleksi alam yang ketat dari para investor dan konsumen.',
      'Guna mewujudkan pelestarian alam sejati, selain pembenahan regulasi hukum dan inovasi teknologi, adalah mutlak bagi tiap individu masyarakat untuk meninjau ulang gaya hidup dan memupuk kesadaran etis demi memikul tanggung jawab moral kepada generasi penerus.'
    ]
  },
  {
    id: 'n2-c2',
    series: 'Isu Global & Kontemporer',
    seriesPart: 2,
    nextId: 'n2-c3',
    prevId: 'n2-c1',
    level: 'N2',
    title: '人工知能（AI）の急速な発展と人間の存在意義',
    titleArti: 'Perkembangan Pesat AI dan Makna Eksistensi Manusia',
    paragraphs: [
      '大規模言語モデルをはじめとする生成型人工知能（AI）の爆発的な進化は、知的労働の領域において従来の常識を根底から覆しつつあります。高度なプログラミングコードの生成や法的文書の分析、精緻な翻訳や画像作成に至るまで、人間が長年の訓練を経て獲得してきた専門技能を、機械がわずか数秒で模倣し実行する時代が到来しました。',
      'この劇的な生産性の向上は、少子高齢化に伴う労働力不足に悩む社会にとって強力な救世主となり得ます。定型業務の自動化により、人間は過酷な肉体労働や単純作業から解放され、より戦略的かつ創造的な領域に貴重な時間を配分することが可能になると期待されています。',
      'しかしその一方で、AIの普及に伴う雇用の喪失や著作権の侵害、偽情報の拡散といった倫理的な懸念も深刻視されています。さらに根源的な問いとして、知的能力において機械が人間を凌駕し始めた時、私たち人間自身の独自性や存在意義はどこに見出されるべきなのかという哲学的な課題が突きつけられています。',
      '感情を共有する共感能力、文脈の奥底にある温もりを察する倫理的直感、そして他者の痛みに寄り添う心こそが、決してアルゴリズムに置き換えることのできない人間の尊厳の核心であり、これからの時代に最も磨かれるべき資質であると言えるでしょう。'
    ],
    translations: [
      'Evolusi meledak dari kecerdasan buatan generatif (AI) yang dipelopori oleh model bahasa skala besar (LLM) tengah membalikkan paradigma konvensional di ranah kerja intelektual. Mulai dari perumusan kode pemrograman rumit, penelaahan dokumen yuridis, hingga penerjemahan presisi dan kreasi seni visual yang dahulunya membutuhkan pelatihan bertahun-tahun, kini mampu ditiru dan dieksekusi mesin dalam hitungan detik.',
      'Lompatan produktivitas yang dramatis ini berpotensi menjadi solusi pamungkas bagi krisis defisit tenaga kerja akibat fenomena penuaan demografi. Melalui otomatisasi tugas repetitif, manusia diharapkan terbebaskan dari beban kerja monoton, memungkinkan alokasi waktu berharga dialihkan ke ranah yang jauh lebih strategis dan kreatif.',
      'Namun di sisi lain, keprihatinan etis seperti disrupsi lapangan kerja, pelanggaran hak cipta, dan diseminasi disinformasi semakin dipandang gawat. Lebih mendasar lagi, mengemuka pertanyaan filosofis: tatkala mesin mulai melampaui kapasitas kognitif intelektual manusia, di manakah letak keunikan serta eksistensi martabat manusia itu sendiri?',
      'Kapasitas empati untuk berbagi rasa, intuisi etis dalam membaca kehangatan tersirat di balik konteks, serta kepekaan merengkuh kepedihan sesama adalah inti martabat manusia yang mustahil tergantikan oleh algoritma secanggih apa pun; itulah kapabilitas yang paling mendesak untuk diasah di masa depan.'
    ]
  },
  {
    id: 'n2-c3',
    series: 'Isu Global & Kontemporer',
    seriesPart: 3,
    nextId: null,
    prevId: 'n2-c2',
    level: 'N2',
    title: '超高齢社会における地域コミュニティの再生',
    titleArti: 'Revitalisasi Komunitas Lokal di Tengah Masyarakat Super Lansia',
    paragraphs: [
      '総人口に占める六十五歳以上の割合が三割に迫る日本は、世界に先駆けて未曾有の超高齢社会に突入しています。地方都市や過疎地域においては人口減少と若年層の流出が加速し、公共交通機関の維持困難や空き家の増加、地域防災機能の低下など、多面的な社会的課題が浮き彫りとなっています。',
      'こうした危機を克服するため、最新のデジタル技術と共助の精神を融合させた地域再生の取り組みが各地で始まっています。移動に困難を抱える高齢者のために自動運転バスやオンライン診療の導入が進められるとともに、見守りセンサーを活用した安全確認のネットワークが構築されています。',
      'さらに注目すべきは、都会の生活に違和感を覚えた若者たちが地方へ移住し、空き家を改修してカフェやコワーキングスペースを開設する動きです。地域の高齢者が培ってきた伝統工芸や農業の知恵を若者が学び、それをインターネットを活用して世界へ発信するなど、世代を超えた新たな協働が生まれています。',
      '高齢化を単なる負担として捉えるのではなく、経験豊かな知識人たちが地域を支える社会資源として活躍できる環境を整えることこそが、真に持続可能で温もりのある共生社会を築くための鍵となるのです。'
    ],
    translations: [
      'Dengan proporsi lansia berusia enam puluh lima tahun ke atas mendekati tiga puluh persen dari total populasi, Jepang telah mendahului dunia melangkah ke era masyarakat super lansia yang belum pernah ada tandingannya. Di kota-kota daerah dan kawasan pedesaan, percepatan depopulasi dan eksodus generasi muda kian kentara, memicu isu pelik mulai dari kendala pemeliharaan transportasi umum, maraknya rumah kosong, hingga merosotnya fungsi mitigasi bencana.',
      'Guna mengatasi krisis ini, prakarsa revitalisasi komunitas lokal yang memadukan teknologi digital mutakhir dengan semangat gotong-royong mulai digulirkan di berbagai wilayah. Demi menopang mobilitas kaum lansia, diujicobakan bus nirawak dan layanan telemedisin daring, berdampingan dengan jaringan pemantauan sensor cerdas untuk memastikan keselamatan warga.',
      'Yang lebih memikat lagi adalah fenomena generasi muda perkotaan yang hijrah ke pedesaan, merenovasi rumah tua menjadi kedai kopi dan ruang kerja bersama (coworking space). Mereka berguru kearifan agrikultur dan kerajinan tradisional dari para tetua lokal, lalu memasarkannya ke panggung global via internet, melahirkan sinergi lintas generasi yang segar.',
      'Tidak memandang penuaan demografi semata sebagai liabilitas, melainkan menata lingkungan di mana para lansia berpengalaman dapat berdaya sebagai modal sosial penopang warga adalah kunci emas membangun peradaban inklusif yang lestari dan sarat kehangatan.'
    ]
  }
];

const targetJson = path.join(__dirname, '..', 'data', 'readings.json');
const targetJs = path.join(__dirname, '..', 'data', 'readings.js');

fs.writeFileSync(targetJson, JSON.stringify(readings, null, 2), 'utf-8');
const jsCode = '/* Auto-generated fallback so readings work even on file:// */\nwindow.READINGS = ' + JSON.stringify(readings, null, 2) + ';\n';
fs.writeFileSync(targetJs, jsCode, 'utf-8');
console.log('SUCCESS: Written', readings.length, 'readings to data/readings.json and data/readings.js');
