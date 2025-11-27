# 🚀 Automated Deployment Guide

## One-Command Deployment Scripts

I've created automated deployment scripts that handle everything for you!

---

## 🆓 **Option 1: Complete Free Deployment (Recommended)**

### **For Linux/Mac:**
```bash
chmod +x deploy-free-complete.sh
./deploy-free-complete.sh
```

### **For Windows:**
```powershell
.\deploy.ps1
```

### **What It Does Automatically:**
1. ✅ Installs Railway CLI
2. ✅ Installs Ngrok
3. ✅ Deploys API to Railway.app
4. ✅ Adds PostgreSQL database
5. ✅ Sets environment variables
6. ✅ Guides you through MongoDB Atlas setup
7. ✅ Guides you through Upstash Redis setup
8. ✅ Guides you through Cloudflare R2 setup
9. ✅ Starts GPU service locally
10. ✅ Exposes GPU via Ngrok tunnel
11. ✅ Connects everything together

**Total Time: 10-15 minutes**

---

## 🚂 **Option 2: Railway.app Only**

### **Quick Deploy:**
```bash
chmod +x deploy-railway.sh
./deploy-railway.sh
```

### **What It Does:**
- ✅ Installs Railway CLI
- ✅ Logs you in
- ✅ Creates new project
- ✅ Adds PostgreSQL
- ✅ Sets environment variables
- ✅ Deploys your API
- ✅ Gives you the live URL

**Total Time: 5 minutes**

---

## 🎨 **Option 3: Render.com**

### **Quick Deploy:**
```bash
chmod +x deploy-render.sh
./deploy-render.sh
```

### **What It Does:**
- ✅ Installs Render CLI
- ✅ Creates render.yaml config
- ✅ Deploys to Render
- ✅ Sets up PostgreSQL

**Total Time: 5 minutes**

---

## 📋 **Step-by-Step: Complete Free Deployment**

### **Prerequisites:**
- Git installed
- Node.js installed
- Python 3.10+ installed
- NVIDIA GPU (for local processing)

### **Step 1: Run the Script**

**Linux/Mac:**
```bash
chmod +x deploy-free-complete.sh
./deploy-free-complete.sh
```

**Windows:**
```powershell
# Run PowerShell as Administrator
Set-ExecutionPolicy Bypass -Scope Process
.\deploy.ps1
```

### **Step 2: Follow the Prompts**

The script will guide you through:

1. **Railway Login**
   - Opens browser
   - Login with GitHub/Email
   - Authorize CLI

2. **MongoDB Atlas**
   - Go to: https://mongodb.com/cloud/atlas
   - Create free account
   - Create M0 cluster (free)
   - Create database user
   - Get connection string
   - Paste when prompted

3. **Upstash Redis**
   - Go to: https://upstash.com
   - Create free account
   - Create Redis database
   - Copy connection details
   - Paste when prompted

4. **Cloudflare R2**
   - Go to: https://cloudflare.com
   - Create account
   - Go to R2 Storage
   - Create bucket
   - Generate API keys
   - Paste when prompted

### **Step 3: Done!**

The script will:
- Deploy your API to Railway
- Start GPU service locally
- Expose GPU via Ngrok
- Connect everything

---

## 🔧 **Manual Steps (If Script Fails)**

### **1. Deploy API to Railway:**
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Initialize project
railway init

# Add PostgreSQL
railway add --plugin postgresql

# Set variables
railway variables set NODE_ENV=production
railway variables set PORT=3000
railway variables set JWT_SECRET=$(openssl rand -base64 32)

# Deploy
railway up
```

### **2. Setup MongoDB Atlas:**
```bash
# 1. Go to mongodb.com/cloud/atlas
# 2. Create free M0 cluster
# 3. Create user
# 4. Get connection string
# 5. Add to Railway:
railway variables set MONGODB_URI="mongodb+srv://user:pass@cluster.mongodb.net/ai_studio"
```

### **3. Setup Upstash Redis:**
```bash
# 1. Go to upstash.com
# 2. Create Redis database
# 3. Get connection details
# 4. Add to Railway:
railway variables set REDIS_HOST="your-host.upstash.io"
railway variables set REDIS_PORT="6379"
railway variables set REDIS_PASSWORD="your-password"
```

### **4. Setup Cloudflare R2:**
```bash
# 1. Go to cloudflare.com
# 2. Create R2 bucket
# 3. Generate API keys
# 4. Add to Railway:
railway variables set S3_ENDPOINT="https://your-account.r2.cloudflarestorage.com"
railway variables set S3_ACCESS_KEY="your-access-key"
railway variables set S3_SECRET_KEY="your-secret-key"
railway variables set S3_BUCKET="ai-studio-media"
```

### **5. Start GPU Service:**
```bash
# Install dependencies
cd gpu-service
pip install -r requirements.txt

# Start service
python main.py
# (Runs on http://localhost:8000)
```

### **6. Expose GPU with Ngrok:**
```bash
# Install Ngrok
# Download from: https://ngrok.com/download

# Start tunnel
ngrok http 8000

# Copy HTTPS URL and add to Railway:
railway variables set GPU_SERVICE_URL="https://your-ngrok-url.ngrok.io"
```

---

## 🎯 **Verification Steps**

### **1. Test API:**
```bash
# Get your Railway URL
RAILWAY_URL=$(railway domain)

# Test health endpoint
curl $RAILWAY_URL/health

# Should return: {"status":"ok","timestamp":"..."}
```

### **2. Test GPU Service:**
```bash
# Test locally
curl http://localhost:8000/health

# Test via Ngrok
curl https://your-ngrok-url.ngrok.io/health
```

### **3. Test Complete Flow:**
```bash
# Register user
curl -X POST $RAILWAY_URL/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!","fullName":"Test User"}'

# Should return token and user info
```

---

## 🐛 **Troubleshooting**

### **Script Fails to Install Railway CLI:**
```bash
# Manual installation:
# Mac:
brew install railway

# Linux:
curl -fsSL https://railway.app/install.sh | sh

# Windows:
npm install -g @railway/cli
```

### **Ngrok Tunnel Not Working:**
```bash
# Check if Ngrok is running:
curl http://localhost:4040/api/tunnels

# Restart Ngrok:
pkill ngrok
ngrok http 8000
```

### **GPU Service Not Starting:**
```bash
# Check Python version:
python --version  # Should be 3.10+

# Install dependencies:
cd gpu-service
pip install -r requirements.txt

# Check for errors:
python main.py
```

### **Railway Deployment Fails:**
```bash
# Check logs:
railway logs

# Redeploy:
railway up --detach
```

---

## 💡 **Pro Tips**

1. **Keep Terminal Open**: GPU service needs to run continuously
2. **Use Cloudflare Tunnel**: More stable than Ngrok for production
3. **Monitor Free Tier**: Check usage to avoid overages
4. **Backup Environment Variables**: Save them in a secure location
5. **Use Railway CLI**: Easier than web dashboard for updates

---

## 🔄 **Update Deployment**

### **Update API Code:**
```bash
# Make changes to code
git add .
git commit -m "Update API"
git push

# Redeploy to Railway
railway up
```

### **Update GPU Service:**
```bash
# Make changes to GPU service
cd gpu-service

# Restart service
pkill python
python main.py
```

### **Update Environment Variables:**
```bash
# Update any variable
railway variables set KEY=VALUE

# View all variables
railway variables
```

---

## 📊 **Cost Breakdown**

| Service | Free Tier | Cost After |
|---------|-----------|------------|
| Railway | 500 hours/month | $5/month |
| MongoDB Atlas | 512MB | $9/month |
| Upstash Redis | 10K commands/day | $10/month |
| Cloudflare R2 | 10GB | $0.015/GB |
| Ngrok | 1 tunnel | $8/month |
| **Total** | **$0/month** | **~$32/month** |

---

## 🎉 **Success!**

If everything worked, you should have:

✅ API running on Railway.app
✅ PostgreSQL database
✅ MongoDB Atlas connected
✅ Upstash Redis connected
✅ Cloudflare R2 storage
✅ GPU service running locally
✅ Ngrok tunnel exposing GPU
✅ All services connected

**Your AI Creative Studio is now live!** 🚀

---

## 🔗 **Useful Commands**

```bash
# View Railway logs
railway logs

# Open Railway dashboard
railway open

# Check deployment status
railway status

# View environment variables
railway variables

# Restart service
railway restart

# Get deployment URL
railway domain
```

---

## 📞 **Need Help?**

- Railway Docs: https://docs.railway.app
- Ngrok Docs: https://ngrok.com/docs
- MongoDB Atlas: https://docs.atlas.mongodb.com
- Upstash Docs: https://docs.upstash.com
- Cloudflare R2: https://developers.cloudflare.com/r2

---

**Happy Deploying! 🎊**
