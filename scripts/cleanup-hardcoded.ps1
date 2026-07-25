# scripts/cleanup-hardcoded.ps1
# Verification script to ensure no test user mocks or placeholder text remains in src/

Write-Output "Starting CronoBash Production Code Audit Scanner..."
Write-Output "====================================================="

$targets = @("Test User", "Lorem ipsum", "testuser", "example.com")
$hasErrors = $false

foreach ($term in $targets) {
    Write-Output "Searching for term: '$term'..."
    $results = Get-ChildItem -Path "src" -Recurse -File | Get-Content | Select-String -Pattern $term
    if ($results) {
        Write-Output "⚠️ FOUND occurrences for '$term':"
        $results | ForEach-Object { Write-Output "  $_" }
        $hasErrors = $true
    } else {
        Write-Output "✅ Clean - No instances of '$term' found."
    }
}

Write-Output "====================================================="
if ($hasErrors) {
    Write-Output "Audit status: FAIL. Please inspect the flagged occurrences above."
} else {
    Write-Output "Audit status: SUCCESS. The codebase is clean and ready for production launch! 🚀"
}
