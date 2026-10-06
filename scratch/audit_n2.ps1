[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$jsonPath = './data/vocabulary.json'
$words = Get-Content -Raw -Encoding UTF8 $jsonPath | ConvertFrom-Json

$n2Words = $words | Where-Object { $_.level -eq 'N2' }
Write-Host "Total N2 words found: $($n2Words.Count)"

$issues = [System.Collections.Generic.List[string]]::new()

# Regex for valid Japanese Kana in furigana (Hiragana, Katakana, ー, ・)
$kanaRegex = '^[\u3040-\u309F\u30A0-\u30FF\u30FC\u30FB]+$'

$minArtiLength = 5
$maxArtiLength = 100

for ($i = 0; $i -lt $n2Words.Count; $i++) {
    $item = $n2Words[$i]
    $id = $item.id
    $kanji = $item.kanji
    $furigana = $item.furigana
    $arti = $item.arti

    # 1. Check ID sequence
    $expectedId = 2501 + $i
    if ($id -ne $expectedId) {
        $issues.Add("ID mismatch: index $i has id $id, expected $expectedId")
    }

    # 2. Check null or empty
    if ([string]::IsNullOrWhiteSpace($kanji)) {
        $issues.Add("[$id] Empty kanji")
    }
    if ([string]::IsNullOrWhiteSpace($furigana)) {
        $issues.Add("[$id] Empty furigana ($kanji)")
    }
    if ([string]::IsNullOrWhiteSpace($arti)) {
        $issues.Add("[$id] Empty arti ($kanji)")
    }

    # 3. Check leading/trailing whitespace
    if ($kanji -ne $kanji.Trim()) {
        $issues.Add("[$id] Kanji has leading/trailing whitespace: '$kanji'")
    }
    if ($furigana -ne $furigana.Trim()) {
        $issues.Add("[$id] Furigana has leading/trailing whitespace: '$furigana'")
    }
    if ($arti -ne $arti.Trim()) {
        $issues.Add("[$id] Arti has leading/trailing whitespace: '$arti'")
    }

    # 4. Furigana character check
    if (-not [string]::IsNullOrWhiteSpace($furigana)) {
        if (-not ($furigana -match $kanaRegex)) {
            $issues.Add("[$id] Furigana contains non-kana characters: '$furigana' ($kanji)")
        }
    }

    # 5. Arti length check
    if ($arti.Length -lt $minArtiLength) {
        $issues.Add("[$id] Arti too short ($($arti.Length) chars): '$arti' ($kanji)")
    }
    if ($arti.Length -gt $maxArtiLength) {
        $issues.Add("[$id] Arti unusually long ($($arti.Length) chars): '$arti' ($kanji)")
    }

    # 6. Check for consecutive double spaces in arti
    if ($arti -match '  +') {
        $issues.Add("[$id] Double space in arti: '$arti' ($kanji)")
    }

    # 7. Check for suspicious placeholder strings in arti
    if ($arti -match 'undefined|null|placeholder|TODO|xxx|test') {
        $issues.Add("[$id] Suspicious text in arti: '$arti' ($kanji)")
    }

    # 8. Check for repeated duplicate words in arti (e.g. 'mendesak mendesak')
    $wordsInArti = ($arti -split '\s+')
    for ($w = 0; $w -lt $wordsInArti.Length - 1; $w++) {
        $w1 = $wordsInArti[$w].Trim(',;.()')
        $w2 = $wordsInArti[$w+1].Trim(',;.()')
        if ($w1 -ne '' -and $w1.Length -gt 3 -and $w1 -eq $w2) {
            # Some Indonesian words are legitimately reduplicated, like 'hati-hati', 'tiba-tiba' or space-separated if not hyphenated, but let's check
            # e.g., 'santai santai', 'basah kuyup basah kuyup'
            $issues.Add("[$id] Potential duplicate adjacent word in arti: '$w1 $w2' in '$arti' ($kanji)")
        }
    }
}

Write-Host "Total issues detected: $($issues.Count)"
if ($issues.Count -gt 0) {
    Write-Host "Listing issues:"
    $issues | ForEach-Object { Write-Host " - $_" }
} else {
    Write-Host "ALL CHECKS PASSED PERFECTLY!"
}
