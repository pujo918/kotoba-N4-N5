[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$existingJsonRaw = Get-Content -Raw -Encoding UTF8 './data/vocabulary.json'
$existing = $existingJsonRaw | ConvertFrom-Json
Write-Host "Initial existing count: $($existing.Length)"

# 1. Collect all existing kanji
$existingKanjiSet = [System.Collections.Generic.HashSet[string]]::new([System.StringComparer]::OrdinalIgnoreCase)
foreach ($item in $existing) {
    if ($item.kanji) {
        $existingKanjiSet.Add($item.kanji.Trim()) | Out-Null
    }
}

# 2. Gather the 250 clean candidates from pool 1 and pool 2
$cand1 = Get-Content -Raw -Encoding UTF8 './scratch/n2_batch1_candidates.json' | ConvertFrom-Json
$n2List = [System.Collections.Generic.List[object]]::new()
$seenKanji = [System.Collections.Generic.HashSet[string]]::new([System.StringComparer]::OrdinalIgnoreCase)

foreach ($c in $cand1) {
    $k = $c.kanji.Trim()
    if (-not $existingKanjiSet.Contains($k) -and -not $seenKanji.Contains($k)) {
        $n2List.Add($c)
        $seenKanji.Add($k) | Out-Null
    }
}

# Load extra candidates
Get-Content -Raw -Encoding UTF8 './scratch/generate_n2_batch1.ps1' | Invoke-Expression

# Ensure we have precisely 250 items
if ($cleanList.Count -ne 250) {
    Write-Error "Candidate count is $($cleanList.Count), expected 250!"
    exit 1
}

# Strict duplicate check against existing 2500 entries
$conflicts = @()
$internalCheck = [System.Collections.Generic.HashSet[string]]::new([System.StringComparer]::OrdinalIgnoreCase)

$startId = 2501
$n2FinalEntries = [System.Collections.Generic.List[object]]::new()

for ($i = 0; $i -lt $cleanList.Count; $i++) {
    $item = $cleanList[$i]
    $k = $item.kanji.Trim()
    $f = $item.furigana.Trim()
    $a = $item.arti.Trim()

    if ($existingKanjiSet.Contains($k)) {
        $conflicts += "Conflict with existing: $k"
    }
    if ($internalCheck.Contains($k)) {
        $conflicts += "Internal duplicate: $k"
    } else {
        $internalCheck.Add($k) | Out-Null
    }

    if ([string]::IsNullOrWhiteSpace($k) -or [string]::IsNullOrWhiteSpace($f) -or [string]::IsNullOrWhiteSpace($a)) {
        $conflicts += "Blank field detected at index $($i): kanji='$k', furigana='$f', arti='$a'"
    }

    $entry = [ordered]@{
        id = $startId + $i
        level = "N2"
        kanji = $k
        furigana = $f
        arti = $a
    }
    $n2FinalEntries.Add($entry)
}

if ($conflicts.Count -gt 0) {
    Write-Error "Validation FAILED with $($conflicts.Count) errors:"
    $conflicts | ForEach-Object { Write-Error $_ }
    exit 1
}

Write-Host "Validation PASSED: Exactly $($n2FinalEntries.Count) clean, verified N2 entries."
Write-Host "New ID range: $($n2FinalEntries[0].id) to $($n2FinalEntries[-1].id)"

# Combine existing 2500 + 250 N2 entries
$combinedList = [System.Collections.Generic.List[object]]::new()
foreach ($ex in $existing) {
    $combinedList.Add($ex)
}
foreach ($n2 in $n2FinalEntries) {
    $combinedList.Add($n2)
}

Write-Host "New total vocabulary count: $($combinedList.Count)"

# Output to JSON
$jsonOut = ConvertTo-Json -InputObject $combinedList -Depth 10 -Compress
# Let's format nicely if possible, or compressed
# Notice original vocabulary.json was formatted:
$jsonOutFormatted = ConvertTo-Json -InputObject $combinedList -Depth 10
[System.IO.File]::WriteAllText((Resolve-Path './data/vocabulary.json').Path, $jsonOutFormatted, [System.Text.Encoding]::UTF8)
Write-Host "Updated data/vocabulary.json successfully."

# Output to vocabulary.js
$jsContent = "/* Auto-generated fallback so the app works even when opened via file:// (double-click). */`nwindow.VOCAB = " + $jsonOut + ";`n"
[System.IO.File]::WriteAllText((Resolve-Path './data/vocabulary.js').Path, $jsContent, [System.Text.Encoding]::UTF8)
Write-Host "Updated data/vocabulary.js successfully."

# Verification of output
$recheck = Get-Content -Raw -Encoding UTF8 './data/vocabulary.json' | ConvertFrom-Json
$groups = $recheck | Group-Object level
Write-Host "--- Post-Update Verification ---"
Write-Host "Total entries in vocabulary.json: $($recheck.Length)"
foreach ($g in $groups) {
    Write-Host "Level $($g.Name): $($g.Count)"
}

$recheckKanji = [System.Collections.Generic.HashSet[string]]::new([System.StringComparer]::OrdinalIgnoreCase)
$totalDupes = 0
foreach ($it in $recheck) {
    if (-not $recheckKanji.Add($it.kanji.Trim())) {
        $totalDupes++
        Write-Host "DUPLICATE FOUND: $($it.kanji)"
    }
}
Write-Host "Total duplicates across ALL 2,750 entries: $totalDupes"
