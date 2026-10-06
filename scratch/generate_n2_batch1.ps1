[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$existing = Get-Content -Raw -Encoding UTF8 './data/vocabulary.json' | ConvertFrom-Json
$existingKanji = [System.Collections.Generic.HashSet[string]]::new([System.StringComparer]::OrdinalIgnoreCase)
foreach ($item in $existing) {
    if ($item.kanji) {
        $existingKanji.Add($item.kanji.Trim()) | Out-Null
    }
}
Write-Host "Total existing words (N4 & N3): $($existing.Length)"

# Load batch 1 candidates already identified as clean
$cand1 = Get-Content -Raw -Encoding UTF8 './scratch/n2_batch1_candidates.json' | ConvertFrom-Json
$cleanList = [System.Collections.Generic.List[object]]::new()
$seenCandidateKanji = [System.Collections.Generic.HashSet[string]]::new([System.StringComparer]::OrdinalIgnoreCase)

foreach ($c in $cand1) {
    $k = $c.kanji.Trim()
    if (-not $existingKanji.Contains($k) -and -not $seenCandidateKanji.Contains($k)) {
        $cleanList.Add($c)
        $seenCandidateKanji.Add($k) | Out-Null
    }
}
Write-Host "Clean candidates from pool 1: $($cleanList.Count)"

# Additional candidate pool 2 (authentic N2 vocabulary)
$extraCandidates = @(
    # N2 Business, Work & Legal
    @{kanji="措置"; furigana="そち"; arti="tindakan; langkah penanganan khusus"},
    @{kanji="処置"; furigana="しょち"; arti="penanganan medis; tindakan darurat"},
    @{kanji="是正"; furigana="ぜせい"; arti="koreksi pembenahan ketimpangan"},
    @{kanji="妥当"; furigana="だとう"; arti="layak; pantas; patut"},
    @{kanji="契機"; furigana="けいき"; arti="momentum; titik balik pemicu"},
    @{kanji="促進"; furigana="そくしん"; arti="pendorongan percepatan laju; akselerasi"},
    @{kanji="推進"; furigana="すいしん"; arti="penggerakan pelaksanaan program"},
    @{kanji="抑制"; furigana="よくせい"; arti="penekanan; pengendalian pembendungan laju"},
    @{kanji="制御"; furigana="せいぎょ"; arti="kontrol kendali sistematis"},
    @{kanji="懸念"; furigana="けねん"; arti="kekhawatiran mendalam; kecemasan risiko"},
    @{kanji="危機"; furigana="きき"; arti="krisis genting; kondisi bahaya"},
    @{kanji="破綻"; furigana="はたん"; arti="kebangkrutan; kegagalan total sistem"},
    @{kanji="摩擦"; furigana="まさつ"; arti="gesekan fisis; friksi perselisihan"},
    @{kanji="均衡"; furigana="きんこう"; arti="keseimbangan; ekuilibrium stabil"},
    @{kanji="偏見"; furigana="へんけん"; arti="prasangka subjektif; bias pemikiran"},
    @{kanji="採算"; furigana="さいさん"; arti="kelayakan profitabilitas usaha"},
    @{kanji="採択"; furigana="さいたく"; arti="adopsi usulan; penerimaan resolusi"},
    @{kanji="却下"; furigana="きゃっか"; arti="penolakan gugatan; dismissal berkas"},
    @{kanji="提携"; furigana="ていけい"; arti="kemitraan aliansi bisnis"},
    @{kanji="買収"; furigana="ばいしゅう"; arti="akuisisi kepemilikan; penyuapan"},
    @{kanji="合併"; furigana="がっぺい"; arti="merger penyatuan perusahaan"},
    @{kanji="融資"; furigana="ゆうし"; arti="fasilitas kredit pembiayaan bank"},
    @{kanji="負債"; furigana="ふさい"; arti="utang tanggungan kewajiban finansial"},
    @{kanji="弁償"; furigana="べんしょう"; arti="ganti rugi perbaikan barang rusak"},
    @{kanji="賠償"; furigana="ばいしょう"; arti="kompensasi ganti rugi yuridis"},
    @{kanji="免除"; furigana="めんじょ"; arti="dispensasi keringanan; pembebasan kewajiban"},
    @{kanji="控除"; furigana="こうじょ"; arti="pemotongan tarif pajak; deduksi"},
    @{kanji="滞納"; furigana="たいのう"; arti="tunggakan keterlambatan pembayaran"},
    @{kanji="人事"; furigana="じんじ"; arti="manajemen personalia; urusan kepegawaian"},
    @{kanji="待遇"; furigana="たいぐう"; arti="perlakuan hak fasilitas ketenagakerjaan"},
    @{kanji="昇進"; furigana="しょうしん"; arti="promosi kenaikan pangkat jabatan"},
    @{kanji="降格"; furigana="こうかく"; arti="demosi penurunan kedudukan struktural"},
    @{kanji="赴任"; furigana="ふにん"; arti="keberangkatan dinas ke pos penugasan baru"},
    @{kanji="左遷"; furigana="させん"; arti="pemindahan tugas ke pos terpencil; demosi"},
    @{kanji="斡旋"; furigana="あっせん"; arti="mediasi perantara penyalur kerja"},
    @{kanji="承諾"; furigana="しょうだく"; arti="pemberian persetujuan resmi; penerimaan deal"},
    @{kanji="辞退"; furigana="じたい"; arti="pengunduran diri nominasi; menolak halus"},
    @{kanji="専従"; furigana="せんじゅう"; arti="berdedikasi purna waktu pada tugas khusus"},
    @{kanji="兼任"; furigana="けんにん"; arti="merangkap jabatan ganda sekaligus"},
    @{kanji="就任"; furigana="しゅうにん"; arti="pelantikan memulai tugas kepemimpinan baru"},
    @{kanji="歴任"; furigana="れきにん"; arti="pengalaman menjabat aneka posisi penting"},
    @{kanji="重任"; furigana="じゅうにん"; arti="pengangkatan kembali menjabat amanah"},
    @{kanji="更迭"; furigana="こうてつ"; arti="pergantian pencopotan pejabat lama"},
    @{kanji="免職"; furigana="めんしょく"; arti="pemberhentian pemecatan dari kepegawaian"},
    @{kanji="罷免"; furigana="ひめん"; arti="pemakzulan pencopotan paksa amanah kekuasaan"},

    # N2 Compound Verbs
    @{kanji="引き止める"; furigana="ひきとめる"; arti="menahan orang agar tidak pergi pamit"},
    @{kanji="抱きしめる"; furigana="だきしめる"; arti="mendekap erat penuh kasih sayang"},
    @{kanji="打ち消す"; furigana="うちけす"; arti="menepis rumor; menyangkal tuduhan bohong"},
    @{kanji="取り外す"; furigana="とりはずす"; arti="mencopot melepas baut komponen mesin"},
    @{kanji="取り立てる"; furigana="とりたてる"; arti="menagih piutang; menonjolkan secara khusus"},
    @{kanji="見失う"; furigana="みうしなう"; arti="kehilangan jejak pandangan sasaran buronan"},
    @{kanji="立ち止まる"; furigana="たちどまる"; arti="berhenti melangkah sejenak merenung"},
    @{kanji="乗り切る"; furigana="のりきる"; arti="bertahan melewati krisis masa sukar"},
    @{kanji="割り当てる"; furigana="わりあてる"; arti="mengalokasikan pembagian tugas merata"},
    @{kanji="問い詰める"; furigana="といつめる"; arti="mencecar pertanyaan interogasi kebenaran"},
    @{kanji="駆けつける"; furigana="かけつける"; arti="segera bergegas tiba di lokasi kejadian"},
    @{kanji="追い越す"; furigana="おいこす"; arti="menyalip mendahului laju kendaraan di depan"},
    @{kanji="逃げ出す"; furigana="にげだす"; arti="melarikan diri kabur dari ancaman mara bahaya"},
    @{kanji="買い占める"; furigana="かいしめる"; arti="memborong habis seluruh stok pasokan"},
    @{kanji="売り切れる"; furigana="うりきれる"; arti="ludes terjual habis tiada bersisa"},
    @{kanji="呼び止める"; furigana="よびとめる"; arti="memanggil menyuruh berhenti orang melintas"},
    @{kanji="締め切る"; furigana="しめきる"; arti="menutup rapat pendaftaran; tenggat berakhir"},
    @{kanji="引き返す"; furigana="ひきかえす"; arti="berbalik arah kembali pulang ke asal"},
    @{kanji="差し引く"; furigana="さしひく"; arti="mengurangi memotong nominal dari total saldo"},
    @{kanji="見せびらかす"; furigana="みせびらかす"; arti="memamerkan barang mewah ke khalayak"},
    @{kanji="言い張る"; furigana="いいはる"; arti="bersikukuh mempertahankan dalih argumen"},
    @{kanji="打ち明ける"; furigana="うちあける"; arti="berterus terang mencurahkan rahasia batin"},
    @{kanji="思いつく"; furigana="おもいつく"; arti="terlintas mencetuskan ide brilian cemerlang"},
    @{kanji="思いやる"; furigana="おもいやる"; arti="berempati memikirkan kenyamanan sesama"},
    @{kanji="立ち寄る"; furigana="たちよる"; arti="mampir singgah sejenak di toserba"},
    @{kanji="寄り道"; furigana="よりみち"; arti="mampir singgah di tengah perjalanan"},
    @{kanji="擦れ違う"; furigana="すれちがう"; arti="berpapasan di jalan tanpa bersua kata"},
    @{kanji="横切る"; furigana="よこぎる"; arti="menyeberang memotong jalan melintas"},
    @{kanji="見つかる"; furigana="みつかる"; arti="ditemukan keberadaannya setelah raib"},
    @{kanji="見かける"; furigana="みかける"; arti="kebetulan melihat sepintas sosok di keramaian"},

    # N2 Advanced Adjectives (I-adj & Na-adj)
    @{kanji="著しい"; furigana="いちじるしい"; arti="sangat mencolok; lonjakan signifikan nyata"},
    @{kanji="甚だしい"; furigana="はなはだしい"; arti="amat sangat keterlaluan; ekstrem keadaannya"},
    @{kanji="夥しい"; furigana="おびただしい"; arti="teramat sangat berlimpah ruah jumlahnya"},
    @{kanji="紛らわしい"; furigana="まぎらわしい"; arti="membingungkan rawan rancu salah tafsir"},
    @{kanji="煩わしい"; furigana="わずらわしい"; arti="merepotkan membebani pikiran; ruwet berbelit"},
    @{kanji="ややこしい"; furigana="ややこしい"; arti="rumit pelik sukar diurai persoalannya"},
    @{kanji="乏しい"; furigana="とぼしい"; arti="miskin serba kekurangan sumber daya finansial"},
    @{kanji="慌ただしい"; furigana="あわただしい"; arti="serba terburu-buru grasak-grusuk sibuk"},
    @{kanji="たくましい"; furigana="たくましい"; arti="berotot kekar perkasa; pantang menyerah teguh"},
    @{kanji="頼もしい"; furigana="たのもしい"; arti="bisa diandalkan kredibilitasnya; menenangkan hati"},
    @{kanji="厚かましい"; furigana="あつかましい"; arti="tebal muka tak tahu malu bertingkah lancang"},
    @{kanji="図々しい"; furigana="ずうずうしい"; arti="lancang tidak tahu malu meminta kemewahan"},
    @{kanji="卑怯"; furigana="ひきょう"; arti="licik pengecut menggunakan cara curang"},
    @{kanji="謙虚"; furigana="けんきょ"; arti="rendah hati santun membumi tiada menyombong"},
    @{kanji="傲慢"; furigana="ごうまん"; arti="arogan tinggi hati menyepelekan orang lain"},
    @{kanji="頑丈"; furigana="がんじょう"; arti="kokoh kuat fisik bangunannya tahan guncangan"},
    @{kanji="柔軟"; furigana="じゅうなん"; arti="fleksibel elastis menyesuaikan kondisi medan"},
    @{kanji="敏捷"; furigana="びんしょう"; arti="tangkas gesit lincah gerak refleksnya"},
    @{kanji="迅速"; furigana="じんそく"; arti="cepat tanggap cekatan bertindak solutif"},
    @{kanji="厳正"; furigana="げんせい"; arti="ketat adil tanpa pandang bulu aturannya"},
    @{kanji="厳格"; furigana="げんかく"; arti="disiplin kaku keras menegakkan kepatuhan"},
    @{kanji="寛容"; furigana="かんよう"; arti="berlapang dada toleran memaafkan kekhilafan"},
    @{kanji="温厚な"; furigana="おんこうな"; arti="berperangai ramah tamah lembut bersahabat"},
    @{kanji="穏やか"; furigana="おだやか"; arti="tenang damai teduh suasana hatinya"},
    @{kanji="滑らか"; furigana="なめらか"; arti="halus licin mulus tanpa hambatan gelombang"},
    @{kanji="鮮やか"; furigana="あざやか"; arti="cerah mencolok memesona tajam warnanya"},
    @{kanji="爽やか"; furigana="さわやか"; arti="segar sejuk menyegarkan raga di fajar hari"},
    @{kanji="穏便"; furigana="おんびん"; arti="diselesaikan secara damai kekeluargaan"},
    @{kanji="円満"; furigana="えんまん"; arti="harmonis damai tanpa perselisihan tuntas"},
    @{kanji="円滑"; furigana="えんかつ"; arti="berjalan mulus lancar teratur tanpa kendala"},

    # N2 Adverbs & Functional Words
    @{kanji="うっすら"; furigana="うっすら"; arti="samar-samar tipis terlihat kabut fajar"},
    @{kanji="びっしり"; furigana="びっしり"; arti="rapat tertata rapi berderet tanpa sela"},
    @{kanji="くっきり"; furigana="くっきり"; arti="terpampang jelas tajam kontras di ufuk"},
    @{kanji="ぐっすり"; furigana="ぐっすり"; arti="tidur lelap pulas semalaman suntuk"},
    @{kanji="げっそり"; furigana="げっそり"; arti="tampak tirus kurus kuyu letih lesu"},
    @{kanji="うんざり"; furigana="うんざり"; arti="jemu muak bosan mendengar ocehan sama"},
    @{kanji="じっくり"; furigana="じっくり"; arti="dengan matang tenang menelaah argumen"},
    @{kanji="てっきり"; furigana="てっきり"; arti="dikira pasti demikian tebakannya meleset"},
    @{kanji="まさに"; furigana="まさに"; arti="tepat sekali; persis sebagaimana dimaksudkan"},
    @{kanji="もっぱら"; furigana="もっぱら"; arti="semata-mata berfokus murni pada kajian itu"},
    @{kanji="おのずと"; furigana="おのずと"; arti="secara wajar alamiah dengan sendirinya timbul"},
    @{kanji="あらかじめ"; furigana="あらかじめ"; arti="di muka; disiapkan terlebih dahulu sebelumnya"},
    @{kanji="かねて"; furigana="かねて"; arti="sudah sejak lama dahulu kala dipersiapkan"},
    @{kanji="いかに"; furigana="いかに"; arti="betapa sangat mendalam; bagaimana pun caranya"},
    @{kanji="さも"; furigana="さも"; arti="seolah-olah demikian lagaknya; bak pakar"},
    @{kanji="まして"; furigana="まして"; arti="terlebih lagi apalagi orang awam tak sanggup"},
    @{kanji="努めて"; furigana="つとめて"; arti="berikhtiar sekuat daya upaya semaksimal mungkin"},
    @{kanji="ひとまず"; furigana="ひとまず"; arti="untuk sementara waktu sembari menunggu kabar"},
    @{kanji="ことごとく"; furigana="ことごとく"; arti="seluruhnya tanpa kecuali satu pun gugur"},
    @{kanji="まるごと"; furigana="まるごと"; arti="secara utuh gelondongan tanpa dipotong-potong"},
    @{kanji="いっそ"; furigana="いっそ"; arti="sekalian saja lebih baik memilih langkah berani"},
    @{kanji="どうにか"; furigana="どうにか"; arti="dengan susah payah akhirnya teratasi tuntas"},
    @{kanji="どうせ"; furigana="どうせ"; arti="toh pada akhirnya sama saja takkan berubah"},
    @{kanji="案外"; furigana="あんがい"; arti="di luar perkiraan semula; tak disangka mudah"},
    @{kanji="思いのほか"; furigana="おもいのほか"; arti="jauh melampaui ekspektasi tak terduga"},
    @{kanji="今更"; furigana="いまさら"; arti="kini sudah telat terlambat untuk menyesal"},
    @{kanji="いまだに"; furigana="いまだに"; arti="hingga detik ini pun masih belum usai juga"},
    @{kanji="前もって"; furigana="まえもって"; arti="disampaikan di awal waktu sebelum hari H"},
    @{kanji="かねがね"; furigana="かねがね"; arti="sudah sering kali mendengar kabar reputasinya"},
    @{kanji="いよいよ"; furigana="いよいよ"; arti="saat yang dinanti-nanti kian kian tiba dekat"},

    # N2 Thought, Mind, Science & Society Nouns
    @{kanji="契機となる"; furigana="けいきとなる"; arti="menjadi titik balik pemicu perubahan besar"},
    @{kanji="思索"; furigana="しさく"; arti="kontemplasi pemikiran perenungan filosofis"},
    @{kanji="洞察"; furigana="どうさつ"; arti="wawasan pemahaman mendalam nan jeli"},
    @{kanji="見解"; furigana="けんかい"; arti="pandangan opini analitis perspektif pakar"},
    @{kanji="見地"; furigana="けんち"; arti="sudut pandang pijakan titik tolak kajian"},
    @{kanji="視点"; furigana="してん"; arti="sudut pandang optik sudut observasi"},
    @{kanji="着眼点"; furigana="ちゃくがんてん"; arti="fokus titik perhatian jeli yang disorot"},
    @{kanji="観点"; furigana="かんてん"; arti="perspektif paradigma acuan pengamatan"},
    @{kanji="要点"; furigana="ようてん"; arti="pokok sari pati inti masalah utama"},
    @{kanji="論点"; furigana="ろんてん"; arti="isu sentral pokok pembicaraan perdebatan"},
    @{kanji="争点"; furigana="そうてん"; arti="titik sengketa perselisihan perkara sidang"},
    @{kanji="焦点"; furigana="しょうてん"; arti="fokus sorotan lensa perhatian utama publik"},
    @{kanji="起点"; furigana="きてん"; arti="titik mula tolak pangkal perjalanan rute"},
    @{kanji="終点"; furigana="しゅうてん"; arti="titik pemberhentian terakhir terminus akhir"},
    @{kanji="拠点"; furigana="きょてん"; arti="markas pangkalan sentral basis operasional"},
    @{kanji="拠点化"; furigana="きょてんか"; arti="pengembangan sentralisasi basis logistik"},
    @{kanji="布石"; furigana="ふせき"; arti="langkah ancang-ancang strategi awal ke depan"},
    @{kanji="伏線"; furigana="ふくせん"; arti="petunjuk tersirat bayangan awal kisah alur"},
    @{kanji="構想"; furigana="こうそう"; arti="cetak biru konsep rancangan arsitektur ide"},
    @{kanji="骨子"; furigana="こっし"; arti="kerangka poin esensial draf kesepakatan"},
    @{kanji="概要"; furigana="がいよう"; arti="ringkasan garis besar ikhtisar dokumen"},
    @{kanji="要約"; furigana="ようやく"; arti="ikhtisar rangkuman sari pati teks panjang"},
    @{kanji="抜粋"; furigana="ばっすい"; arti="kutipan petikan nukilan bagian naskah"},
    @{kanji="推敲"; furigana="すいこう"; arti="penyempurnaan perbaikan draf karangan teks"},
    @{kanji="校正"; furigana="こうせい"; arti="pembacaan koreksi cetak pruf naskah typo"},
    @{kanji="吟味"; furigana="ぎんみ"; arti="pemeriksaan penyeleksian teliti mutu bahan"},
    @{kanji="精査"; furigana="せいさ"; arti="pemeriksaan cermat menyeluruh bukti laporan"},
    @{kanji="監査"; furigana="かんさ"; arti="audit kepatuhan keuangan independen"},
    @{kanji="検疫"; furigana="けんえき"; arti="karantina pencegahan wabah di bandara"},
    @{kanji="照合"; furigana="しょうごう"; arti="pencocokan verifikasi kecocokan dua data"},
    @{kanji="裏付け"; furigana="うらづけ"; arti="bukti pendukung penguat kebenaran alibi"},
    @{kanji="証言"; furigana="しょうげん"; arti="kesaksian pernyataan resmi saksi mata sidang"},
    @{kanji="供述"; furigana="きょうじゅつ"; arti="keterangan pengakuan berita acara tersangka"},
    @{kanji="陳述"; furigana="ちんじゅつ"; arti="pernyataan pembelaan lisan di hadapan hakim"},
    @{kanji="弁明"; furigana="べんめい"; arti="klarifikasi pembelaan diri atas kesalahpahaman"}
)

foreach ($c in $extraCandidates) {
    $k = $c.kanji.Trim()
    if (-not $existingKanji.Contains($k) -and -not $seenCandidateKanji.Contains($k)) {
        $cleanList.Add($c)
        $seenCandidateKanji.Add($k) | Out-Null
    }
}

Write-Host "Total clean unique candidates now: $($cleanList.Count)"
