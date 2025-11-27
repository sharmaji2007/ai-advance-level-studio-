# 🚀 Windows PowerShell Deployment Script
# Complete automated deployment for Windows users

Write-Host "🚀 AI Creative Studio - Automated Deployment (Windows)" -ForegroundColor Cyan
Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host ""

# Check if Railway CLI is installed
if (!(Get-Command railway -ErrorAction SilentlyContinue)) {
    Write-Host "Installing Railway CLI..." -ForegroundColor Yellow
    npm install -g @railway/cli
    Write-Host "✓ Railway CLI installed" -ForegroundColor Green
}

# Check if Ngrok is installed
if (!(Get-Command ngrok -ErrorAction SilentlyContinue)) {
    Write-Host "Installing Ngrok..." -ForegroundColor Yellow
    choco install ngrok -y
    Write-Host "✓ Ngrok installed" -ForegroundColor Green
}

# Login to Railway
Write-Host ""
Write-Host "Step 1/7: Logging into Railway..." -ForegroundColor Blue
railway login

# Create new project
Write-Host ""
Write-Host "Step 2/7: Creating Railway project..." -ForegroundColor Blue
railway init

# Add PostgreSQL
Write-Host ""
Write-Host "Step 3/7: Adding PostgreSQL..." -ForegroundColor Blue
railway add --plugin postgresql

# Generate JWT secret
$JWT_SECRET = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | ForEach-Object {[char]$_})

# Set environment variables
Write-Host ""
Write-Host "Step 4/7: Setting environment variables..." -ForegroundColor Blue
railway variables set NODE_ENV=production
railway variables set PORT=3000
railway variables set JWT_SECRET=$JWT_SECRET
railway variables set API_VERSION=v1

# Deploy API
Write-Host ""
Write-Host "Step 5/7: Deploying API to Railway..." -ForegroundColor Blue
railway up

$RAILWAY_URL = railway domain

Write-Host "✓ API deployed: $RAILWAY_URL" -ForegroundColor Green

# Setup external services
Write-Host ""
Write-Host "Step 6/7: External Services Setup" -ForegroundColor Blue
Write-Host "Please complete these steps:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. MongoDB Atlas (https://mongodb.com/cloud/atlas)"
Write-Host "   - Create free M0 cluster"
Write-Host "   - Get connection string"
Write-Host ""
$MONGODB_URI = Read-Host "Enter MongoDB connection string"
railway variables set MONGODB_URI=$MONGODB_URI

Write-Host ""
Write-Host "2. Upstash Redis (https://upstash.com)"
Write-Host "   - Create free Redis database"
Write-Host "   - Get connection details"
Write-Host ""
$REDIS_HOST = Read-Host "Enter Redis host"
$REDIS_PORT = Read-Host "Enter Redis port (default 6379)"
if ([string]::IsNullOrEmpty($REDIS_PORT)) { $REDIS_PORT = "6379" }
$REDIS_PASSWORD = Read-Host "Enter Redis password"
railway variables set REDIS_HOST=$REDIS_HOST
railway variables set REDIS_PORT=$REDIS_PORT
railway variables set REDIS_PASSWORD=$REDIS_PASSWORD

Write-Host ""
Write-Host "3. Cloudflare R2 (https://cloudflare.com)"
Write-Host "   - Create R2 bucket"
Write-Host "   - Get API credentials"
Write-Host ""
$S3_ENDPOINT = Read-Host "Enter R2 endpoint"
$S3_ACCESS_KEY = Read-Host "Enter R2 access key"
$S3_SECRET_KEY = Read-Host "Enter R2 secret key"
$S3_BUCKET = Read-Host "Enter R2 bucket name"
railway variables set S3_ENDPOINT=$S3_ENDPOINT
railway variables set S3_ACCESS_KEY=$S3_ACCESS_KEY
railway variables set S3_SECRET_KEY=$S3_SECRET_KEY
railway variables set S3_BUCKET=$S3_BUCKET

# Start GPU service
Write-Host ""
Write-Host "Step 7/7: Starting GPU Service..." -ForegroundColor Blue
Write-Host "Installing Python dependencies..." -ForegroundColor Yellow
Set-Location gpu-service
pip install -r requirements.txt

Write-Host "Starting GPU service on port 8000..." -ForegroundColor Yellow
Start-Process python -ArgumentList "main.py" -NoNewWindow

Start-Sleep -Seconds 5

# Start Ngrok
Write-Host "Starting Ngrok tunnel..." -ForegroundColor Yellow
Start-Process ngrok -ArgumentList "http 8000" -NoNewWindow

Start-Sleep -Seconds 3

# Get Ngrok URL
try {
    $ngrokApi = Invoke-RestMethod -Uri "http://localhost:4040/api/tunnels"
    $NGROK_URL = $ngrokApi.tunnels[0].public_url
    Write-Host "✓ GPU service exposed at: $NGROK_URL" -ForegroundColor Green
    
    railway variables set GPU_SERVICE_URL=$NGROK_URL
} catch {
    Write-Host "⚠ Could not get Ngrok URL automatically" -ForegroundColor Yellow
    Write-Host "Please get URL from: http://localhost:4040" -ForegroundColor Yellow
}

# Final Summary
Write-Host ""
Write-Host "======================================" -ForegroundColor Green
Write-Host "✅ Deployment Complete!" -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Green
Write-Host ""
Write-Host "📊 Deployment Summary:" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
Write-Host "API Server:     $RAILWAY_URL"
Write-Host "GPU Service:    $NGROK_URL"
Write-Host "Database:       MongoDB Atlas (Free)"
Write-Host "Queue:          Upstash Redis (Free)"
Write-Host "Storage:        Cloudflare R2 (Free)"
Write-Host ""
Write-Host "🎯 Next Steps:" -ForegroundColor Cyan
Write-Host "1. Test API: curl $RAILWAY_URL/health"
Write-Host "2. View logs: railway logs"
Write-Host "3. Keep PowerShell open (GPU service running)"
Write-Host ""
Write-Host "🔗 Useful Links:" -ForegroundColor Cyan
Write-Host "- Railway Dashboard: https://railway.app/dashboard"
Write-Host "- Ngrok Dashboard: http://localhost:4040"
Write-Host ""
