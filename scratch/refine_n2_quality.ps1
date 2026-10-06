[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$jsonPath = './data/vocabulary.json'
$jsPath = './data/vocabulary.js'

$words = Get-Content -Raw -Encoding UTF8 $jsonPath | ConvertFrom-Json

# 1. Loanwords katakana furigana harmonization
$loanwordMap = @{
    2511 = "リサイクル"
    2819 = "リハビリ"
    2831 = "アレルギー"
    3215 = "パンク"
    3582 = "インフレ"
    3583 = "デフレ"
    3584 = "バブル"
}

# 2. Arti refinement for duplicate adjacent words
$artiRefineMap = @{
    2936 = "sangat dahsyat menggelegar gempuran serbuan"
    3184 = "menaikkan mendongkrak tarif batas minimum upah"
    3187 = "berpura-pura berlagak menyamar bak penderma"
    3406 = "terhenti sejenak terputus jeda pembicaraan"
    3427 = "menjilat merayu bos demi memuluskan jalan karir"
    3649 = "buyar kacau tidak terarah konsentrasi fokus pikiran"
    3659 = "terbalik terbalikkan kapal perahu; runtuh tatanan lama"
    3768 = "basah kuyup sekujur tubuh dan pakaian akibat kehujanan"
    3778 = "berjalan-jalan santai tanpa tujuan mengitari pertokoan"
    3804 = "lampiran suplemen ekstra bonus buku panduan"
    3885 = "sok gengsi berlagak pamer demi menjaga martabat semu"
    3923 = "sangat bangga berbesar hati atas torehan prestasi anak"
}

$modifiedCount = 0

foreach ($item in $words) {
    $id = [int]$item.id
    if ($loanwordMap.ContainsKey($id)) {
        $oldF = $item.furigana
        $item.furigana = $loanwordMap[$id]
        Write-Host "[$id] Updated furigana: '$oldF' -> '$($item.furigana)'"
        $modifiedCount++
    }
    if ($artiRefineMap.ContainsKey($id)) {
        $oldA = $item.arti
        $item.arti = $artiRefineMap[$id]
        Write-Host "[$id] Updated arti: '$oldA' -> '$($item.arti)'"
        $modifiedCount++
    }
}

Write-Host "Total modifications applied: $modifiedCount"

# Save updated files
$utf8NoBom = [System.Text.UTF8Encoding]::new($false)
$newJson = ConvertTo-Json -InputObject $words -Depth 5
[System.IO.File]::WriteAllText((Resolve-Path $jsonPath).Path, $newJson, $utf8NoBom)

$jsHeader = "/* Auto-generated fallback so the app works even when opened via file:// (double-click). */`nwindow.VOCAB = "
$newJs = $jsHeader + $newJson + ";"
[System.IO.File]::WriteAllText((Resolve-Path $jsPath).Path, $newJs, $utf8NoBom)

Write-Host "SUCCESS: vocabulary.json and vocabulary.js updated!"
