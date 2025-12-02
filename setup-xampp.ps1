# Setup script to copy Local Issues Website to XAMPP htdocs
Write-Host "Setting up Local Issues Website for XAMPP..." -ForegroundColor Green

$sourceDir = "C:\Users\SUHA FATHIMA\Documents\LocalIssuesWebsite"
$targetDir = "C:\xampp\htdocs\LocalIssuesWebsite"

# Check if XAMPP exists
if (-not (Test-Path "C:\xampp\htdocs")) {
    Write-Host "❌ XAMPP not found at C:\xampp\" -ForegroundColor Red
    Write-Host "Please install XAMPP first." -ForegroundColor Yellow
    exit 1
}

# Create target directory if it doesn't exist
if (-not (Test-Path $targetDir)) {
    New-Item -ItemType Directory -Path $targetDir -Force
    Write-Host "✅ Created directory: $targetDir" -ForegroundColor Green
}

# Copy files to XAMPP htdocs
try {
    Write-Host "📁 Copying files to XAMPP htdocs..." -ForegroundColor Blue
    
    # Copy all files except .git, node_modules, and .vscode
    robocopy $sourceDir $targetDir /E /XD .git node_modules .vscode /XF *.log /NFL /NDL /NJH /NJS /NC /NS
    
    Write-Host "✅ Files copied successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🌐 Your website is now available at:" -ForegroundColor Cyan
    Write-Host "   http://localhost/LocalIssuesWebsite/" -ForegroundColor White
    Write-Host ""
    Write-Host "📋 Next steps:" -ForegroundColor Yellow
    Write-Host "   1. Start XAMPP (Apache + MySQL)" -ForegroundColor White
    Write-Host "   2. Open browser to http://localhost/LocalIssuesWebsite/" -ForegroundColor White
    Write-Host "   3. Test login with admin/admin123" -ForegroundColor White
    
} catch {
    Write-Host "❌ Error copying files: $($_.Exception.Message)" -ForegroundColor Red
}

# Check if we can start XAMPP
if (Test-Path "C:\xampp\xampp-control.exe") {
    Write-Host ""
    $startXampp = Read-Host "Start XAMPP Control Panel now? (y/n)"
    if ($startXampp -eq 'y' -or $startXampp -eq 'Y') {
        Start-Process "C:\xampp\xampp-control.exe"
        Write-Host "✅ XAMPP Control Panel started!" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "🎉 Setup complete!" -ForegroundColor Green