[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$words = Get-Content -Raw -Encoding UTF8 ./data/vocabulary.json | ConvertFrom-Json
$n2Words = $words | Where-Object { $_.level -eq 'N2' }

# Look at entries with short arti (< 15 chars) or long arti (> 60 chars)
$shortArti = $n2Words | Where-Object { $_.arti.Length -lt 15 }
$longArti = $n2Words | Where-Object { $_.arti.Length -gt 60 }

Write-Host "Short arti (<15 chars) count: $($shortArti.Count)"
$shortArti | ForEach-Object { Write-Host "[$($_.id)] $($_.kanji) ($($_.furigana)): $($_.arti)" }

Write-Host "`nLong arti (>60 chars) count: $($longArti.Count)"
$longArti | Select-Object -First 10 | ForEach-Object { Write-Host "[$($_.id)] $($_.kanji) ($($_.furigana)): $($_.arti)" }
