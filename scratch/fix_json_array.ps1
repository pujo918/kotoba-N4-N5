[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$jsonPath = './data/vocabulary.json'
$jsPath = './data/vocabulary.js'

$raw = Get-Content -Raw -Encoding UTF8 $jsonPath | ConvertFrom-Json

# If wrapped in .value, unwrap it
if ($raw.PSObject.Properties['value']) {
    $words = $raw.value
} else {
    $words = $raw
}

Write-Host "Unwrapped words count: $($words.Count)"

$utf8NoBom = [System.Text.UTF8Encoding]::new($false)
$newJson = $words | ConvertTo-Json -Depth 5
[System.IO.File]::WriteAllText((Resolve-Path $jsonPath).Path, $newJson, $utf8NoBom)

$jsHeader = "/* Auto-generated fallback so the app works even when opened via file:// (double-click). */`nwindow.VOCAB = "
$newJs = $jsHeader + $newJson + ";"
[System.IO.File]::WriteAllText((Resolve-Path $jsPath).Path, $newJs, $utf8NoBom)

Write-Host "Fixed: vocabulary.json and vocabulary.js are now proper top-level arrays with $($words.Count) elements!"
