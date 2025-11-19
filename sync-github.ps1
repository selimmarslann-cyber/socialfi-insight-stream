Write-Host "🔄 Starting FULL GITHUB SYNC..." -ForegroundColor Cyan

# Stop on any error
$ErrorActionPreference = "Stop"

Write-Host "🧹 Cleaning previous remotes..." -ForegroundColor Yellow
git remote remove origin 2>$null
if ($LASTEXITCODE -ne 0) {
    # Ignore error if remote doesn't exist
}

Write-Host "🔗 Adding correct GitHub repo..." -ForegroundColor Yellow
git remote add origin https://github.com/selimmarslann-cyber/socialfi-insight-stream.git

Write-Host "📦 Staging ALL changes..." -ForegroundColor Yellow
git add -A

Write-Host "📝 Creating commit..." -ForegroundColor Yellow
git commit -m "FULL SYNC: latest UI fixes, blockchain deploy, contrib fixes, pool integration"

Write-Host "⬆️ Pushing to main branch..." -ForegroundColor Yellow
git branch -M main
git push -u origin main --force

Write-Host "✅ DONE — ALL CODE SUCCESSFULLY PUSHED TO GITHUB!" -ForegroundColor Green

