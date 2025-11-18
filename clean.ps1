# SAFE CLEANUP – Kodlara dokunmadan sadece şişiren klasörleri siler

Write-Host "🚮 Removing unnecessary heavy folders..." -ForegroundColor Cyan

# Root node_modules & build artifacts
Remove-Item -Recurse -Force "node_modules" -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force "dist" -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force "build" -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force ".turbo" -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force ".vercel" -ErrorAction SilentlyContinue

# Blockchain dev folders
Remove-Item -Recurse -Force "blockchain\node_modules" -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force "blockchain\artifacts" -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force "blockchain\cache" -ErrorAction SilentlyContinue

# VSCode/OS junk
Remove-Item -Recurse -Force ".cache" -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force ".parcel-cache" -ErrorAction SilentlyContinue

Write-Host "✅ Cleanup complete. Project is now slim and ready for ZIP." -ForegroundColor Green

