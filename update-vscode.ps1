# VS Code Update Script - Volunteer Management System
Write-Host "🔄 Updating VS Code with Volunteer Management System..." -ForegroundColor Green

$sourceDir = "C:\Users\SUHA FATHIMA\Documents\LocalIssuesWebsite"
$xamppDir = "C:\xampp\htdocs\LocalIssuesWebsite"

# Check if running from correct directory
if (-not (Test-Path ".\includes\config.php")) {
    Write-Host "❌ Please run this script from the LocalIssuesWebsite directory" -ForegroundColor Red
    exit 1
}

Write-Host "📁 Current directory verified: $sourceDir" -ForegroundColor Cyan

# Step 1: Verify all new files exist
Write-Host "`n=== STEP 1: Verifying New Files ===" -ForegroundColor Yellow

$newFiles = @(
    "includes\admin_manage_volunteers.php",
    "VOLUNTEER_MANAGEMENT_GUIDE.md",
    "VS_CODE_SETUP_GUIDE.md",
    "WEBSITE_ACCESS_SOLUTION.md",
    "setup-xampp.ps1",
    "test_volunteer_system.php",
    ".vscode\settings.json",
    ".vscode\tasks.json",
    ".vscode\launch.json"
)

$missingFiles = @()
foreach ($file in $newFiles) {
    if (Test-Path $file) {
        Write-Host "✅ $file" -ForegroundColor Green
    } else {
        Write-Host "❌ $file (MISSING)" -ForegroundColor Red
        $missingFiles += $file
    }
}

if ($missingFiles.Count -gt 0) {
    Write-Host "`n⚠️  Some files are missing. The volunteer management system may not work correctly." -ForegroundColor Yellow
}

# Step 2: Update XAMPP directory if it exists
Write-Host "`n=== STEP 2: Syncing with XAMPP ===" -ForegroundColor Yellow

if (Test-Path "C:\xampp\htdocs") {
    if (Test-Path $xamppDir) {
        Write-Host "📋 Copying updated files to XAMPP..." -ForegroundColor Blue
        
        # Copy only the essential files for production
        $essentialFiles = @(
            "includes\admin_manage_volunteers.php",
            "admin\dashboard.html",
            "js\volunteers.js",
            "includes\register_volunteer.php"
        )
        
        foreach ($file in $essentialFiles) {
            if (Test-Path $file) {
                $targetPath = Join-Path $xamppDir $file
                $targetDir = Split-Path $targetPath -Parent
                
                if (-not (Test-Path $targetDir)) {
                    New-Item -ItemType Directory -Path $targetDir -Force | Out-Null
                }
                
                Copy-Item $file $targetPath -Force
                Write-Host "   Copied: $file" -ForegroundColor Green
            }
        }
        
        Write-Host "✅ XAMPP directory updated successfully!" -ForegroundColor Green
    } else {
        Write-Host "⚠️  XAMPP directory doesn't exist. Run setup-xampp.ps1 first." -ForegroundColor Yellow
    }
} else {
    Write-Host "⚠️  XAMPP not found. Using local development only." -ForegroundColor Yellow
}

# Step 3: VS Code workspace configuration
Write-Host "`n=== STEP 3: VS Code Configuration ===" -ForegroundColor Yellow

if (Test-Path ".vscode") {
    Write-Host "✅ VS Code workspace configured" -ForegroundColor Green
    
    # Check if VS Code is installed
    $vscodeExists = Get-Command "code" -ErrorAction SilentlyContinue
    if ($vscodeExists) {
        Write-Host "✅ VS Code command available" -ForegroundColor Green
        
        $openVSCode = Read-Host "Open project in VS Code now? (y/n)"
        if ($openVSCode -eq 'y' -or $openVSCode -eq 'Y') {
            Write-Host "🚀 Opening VS Code..." -ForegroundColor Blue
            & code .
        }
    } else {
        Write-Host "⚠️  VS Code command not in PATH. Open manually." -ForegroundColor Yellow
    }
} else {
    Write-Host "❌ VS Code workspace not configured" -ForegroundColor Red
}

# Step 4: Database status check
Write-Host "`n=== STEP 4: Database Status ===" -ForegroundColor Yellow

if (Test-Path "C:\xampp\xampp-control.exe") {
    Write-Host "✅ XAMPP found" -ForegroundColor Green
    
    # Check if services are running
    $apacheRunning = Get-Process "httpd" -ErrorAction SilentlyContinue
    $mysqlRunning = Get-Process "mysqld" -ErrorAction SilentlyContinue
    
    Write-Host "   Apache: $(if ($apacheRunning) { '🟢 Running' } else { '🔴 Stopped' })" -NoNewline
    Write-Host "   MySQL: $(if ($mysqlRunning) { '🟢 Running' } else { '🔴 Stopped' })"
    
    if (-not $apacheRunning -or -not $mysqlRunning) {
        $startXampp = Read-Host "Start XAMPP services now? (y/n)"
        if ($startXampp -eq 'y' -or $startXampp -eq 'Y') {
            Start-Process "C:\xampp\xampp-control.exe"
            Write-Host "✅ XAMPP Control Panel opened" -ForegroundColor Green
        }
    }
} else {
    Write-Host "❌ XAMPP not found at C:\xampp\" -ForegroundColor Red
}

# Step 5: Test the system
Write-Host "`n=== STEP 5: System Test ===" -ForegroundColor Yellow

if (Test-Path "test_volunteer_system.php") {
    $runTest = Read-Host "Run system test now? (y/n)"
    if ($runTest -eq 'y' -or $runTest -eq 'Y') {
        Write-Host "🧪 Running system test..." -ForegroundColor Blue
        
        if (Test-Path "C:\xampp\php\php.exe") {
            & "C:\xampp\php\php.exe" test_volunteer_system.php
        } else {
            Write-Host "❌ PHP not found. Install XAMPP first." -ForegroundColor Red
        }
    }
}

# Summary
Write-Host "`n=== UPDATE SUMMARY ===" -ForegroundColor Cyan
Write-Host "📋 Files Status:" -ForegroundColor White
Write-Host "   New Files: $($newFiles.Count - $missingFiles.Count)/$($newFiles.Count) ready" -ForegroundColor $(if ($missingFiles.Count -eq 0) { 'Green' } else { 'Yellow' })
Write-Host "   XAMPP Sync: $(if (Test-Path $xamppDir) { 'Updated' } else { 'Pending' })" -ForegroundColor $(if (Test-Path $xamppDir) { 'Green' } else { 'Yellow' })
Write-Host "   VS Code: $(if (Test-Path '.vscode') { 'Configured' } else { 'Not configured' })" -ForegroundColor $(if (Test-Path '.vscode') { 'Green' } else { 'Red' })

Write-Host "`n🎯 NEXT STEPS:" -ForegroundColor Cyan
Write-Host "1. Open VS Code: code ." -ForegroundColor White
Write-Host "2. Start XAMPP (Apache + MySQL)" -ForegroundColor White
Write-Host "3. Test at: http://localhost/LocalIssuesWebsite/" -ForegroundColor White
Write-Host "4. Admin login: http://localhost/LocalIssuesWebsite/admin/login.html" -ForegroundColor White

Write-Host "`n✨ Volunteer Management System Ready!" -ForegroundColor Green
Write-Host "📖 See VOLUNTEER_MANAGEMENT_GUIDE.md for full documentation" -ForegroundColor Blue

# Clean up test files
if (Test-Path "test_volunteer_system.php") {
    $cleanup = Read-Host "`nClean up test files? (y/n)"
    if ($cleanup -eq 'y' -or $cleanup -eq 'Y') {
        Remove-Item "test_volunteer_system.php" -Force
        Write-Host "🧹 Test files cleaned up" -ForegroundColor Green
    }
}