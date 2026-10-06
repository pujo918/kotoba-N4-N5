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

# 2. Run the candidate pool script to get clean items
Get-Content -Raw -Encoding UTF8 './scratch/test_batch5_pool.ps1' | Invoke-Expression

if ($cleanBatch5.Count -lt 250) {
    Write-Error "Clean candidates count is $($cleanBatch5.Count), expected at least 250!"
    exit 1
}

# 3. Take exactly first 250 items
$selected250 = $cleanBatch5[0..249]

# Strict validation
$conflicts = @()
$internalCheck = [System.Collections.Generic.HashSet[string]]::new([System.StringComparer]::OrdinalIgnoreCase)
$startId = 3501
$n2Batch5Entries = [System.Collections.Generic.List[object]]::new()

for ($i = 0; $i -lt $selected250.Count; $i++) {
    $item = $selected250[$i]
    $k = $item.kanji.Trim()
    $f = $item.furigana.Trim()
    $a = $item.arti.Trim()

    if ($existingKanjiSet.Contains($k)) {
        $conflicts += "Conflict with existing database: $k"
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
    $n2Batch5Entries.Add($entry)
}

if ($conflicts.Count -gt 0) {
    Write-Error "Validation FAILED with $($conflicts.Count) errors:"
    $conflicts | ForEach-Object { Write-Error $_ }
    exit 1
}

Write-Host "Validation PASSED: Exactly $($n2Batch5Entries.Count) clean, verified N2 entries."
Write-Host "New ID range: $($n2Batch5Entries[0].id) to $($n2Batch5Entries[-1].id)"

# Combine existing 3500 + 250 N2 entries = 3750
$combinedList = [System.Collections.Generic.List[object]]::new()
foreach ($ex in $existing) {
    $combinedList.Add($ex)
}
foreach ($n2 in $n2Batch5Entries) {
    $combinedList.Add($n2)
}

Write-Host "New total vocabulary count: $($combinedList.Count)"

# Output to JSON
$jsonOut = ConvertTo-Json -InputObject $combinedList -Depth 10 -Compress
$jsonOutFormatted = ConvertTo-Json -InputObject $combinedList -Depth 10
[System.IO.File]::WriteAllText((Resolve-Path './data/vocabulary.json').Path, $jsonOutFormatted, [System.Text.Encoding]::UTF8)
Write-Host "Updated data/vocabulary.json successfully."

# Output to vocabulary.js
$jsContent = "/* Auto-generated fallback so the app works even when opened via file:// (double-click). */`nwindow.VOCAB = " + $jsonOut + ";`n"
[System.IO.File]::WriteAllText((Resolve-Path './data/vocabulary.js').Path, $jsContent, [System.Text.Encoding]::UTF8)
Write-Host "Updated data/vocabulary.js successfully."

# Post-update verification
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
Write-Host "Total duplicates across ALL $($recheck.Length) entries: $totalDupes"
