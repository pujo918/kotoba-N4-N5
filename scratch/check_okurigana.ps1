[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$jsonPath = './data/vocabulary.json'
$words = Get-Content -Raw -Encoding UTF8 $jsonPath | ConvertFrom-Json
$n2Words = $words | Where-Object { $_.level -eq 'N2' }

$okuriganaIssues = [System.Collections.Generic.List[string]]::new()

$hiraganaEndings = 'うくぐすずつぬふぶむゆるアイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲンぁぃぅぇぉっゃゅょ'

foreach ($item in $n2Words) {
    $k = $item.kanji.Trim()
    $f = $item.furigana.Trim()

    # If kanji ends with a hiragana character, check if furigana ends with that same hiragana character
    $lastCharK = $k[$k.Length - 1]
    # Check if lastCharK is Hiragana (U+3040 to U+309F)
    $charCode = [int][char]$lastCharK
    if ($charCode -ge 0x3041 -and $charCode -le 0x3096) {
        $lastCharF = $f[$f.Length - 1]
        if ($lastCharK -ne $lastCharF) {
            $okuriganaIssues.Add("[$($item.id)] Okurigana mismatch: kanji ends with '$lastCharK', furigana ends with '$lastCharF' ($k / $f)")
        }
    }
}

Write-Host "Okurigana issues found: $($okuriganaIssues.Count)"
$okuriganaIssues | ForEach-Object { Write-Host " - $_" }
