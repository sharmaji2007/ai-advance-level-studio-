# 🚀 Deploy Your AI Studio NOW!

## ⚡ **One Command Deployment**

### **Choose Your Platform:**

---

## 🆓 **Option 1: Complete Free Setup (Recommended)**

### **Linux/Mac:**
```bash
./deploy-free-complete.sh
```

### **Windows:**
```powershell
.\deploy.ps1
```

**What you get:**
- ✅ API on Railway.app (Free)
- ✅ PostgreSQL database (Free)
- ✅ MongoDB Atlas (Free)
- ✅ Upstash Redis (Free)
- ✅ Cloudflare R2 Storage (Free)
- ✅ GPU service (Your computer)
- ✅ Ngrok tunnel (Free)

**Time: 10-15 minutes**
**Cost: $0/month**

---

## 🚂 **Option 2: Railway.app Only**

```bash
./deploy-railway.sh
```

**What you get:**
- ✅ API deployed
- ✅ PostgreSQL included
- ✅ Auto-configured

**Time: 5 minutes**
**Cost: Free (500 hours/month)**

---

## 🎨 **Option 3: Render.com**

```bash
./deploy-render.sh
```

**What you get:**
- ✅ API deployed
- ✅ PostgreSQL included
- ✅ Auto-configured

**Time: 5 minutes**
**Cost: Free**

---

## 📋 **Quick Start Steps**

### **1. Choose a script above**

### **2. Run it:**
```bash
# Make executable (Linux/Mac)
chmod +x deploy-free-complete.sh

# Run
./deploy-free-complete.sh
```

### **3. Follow the prompts**
The script will guide you through everything!

### **4. Done!**
Your API will be live in 10-15 minutes.

---

## 🎯 **What Happens Automatically:**

1. ✅ Installs required tools (Railway CLI, Ngrok)
2. ✅ Logs you into Railway
3. ✅ Creates new project
4. ✅ Adds PostgreSQL database
5. ✅ Generates secure JWT secret
6. ✅ Sets all environment variables
7. ✅ Deploys your API
8. ✅ Guides you through external services
9. ✅ Starts GPU service locally
10. ✅ Exposes GPU via Ngrok
11. ✅ Connects everything together
12. ✅ Gives you live URLs

---

## 🔗 **After Deployment:**

### **Your API will be live at:**
```
https://your-project.railway.app
```

### **Test it:**
```bash
curl https://your-project.railway.app/health
```

### **Register a user:**
```bash
curl -X POST https://your-project.railway.app/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!","fullName":"Test User"}'
```

### **Generate an image:**
```bash
curl -X POST https://your-project.railway.app/api/v1/jobs/image-generation \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"prompt":"A beautiful sunset","style":"cinematic"}'
```

---

## 💡 **Pro Tips:**

1. **Keep terminal open** - GPU service needs to run
2. **Save your URLs** - You'll need them
3. **Monitor free tier** - Check usage limits
4. **Use Cloudflare Tunnel** - More stable than Ngrok

---

## 🐛 **If Something Goes Wrong:**

### **Script won't run:**
```bash
# Make it executable
chmod +x deploy-free-complete.sh

# Or run with bash
bash deploy-free-complete.sh
```

### **Railway CLI not found:**
```bash
# Install manually
npm install -g @railway/cli
```

### **Need help?**
Check `AUTOMATED_DEPLOYMENT.md` for detailed troubleshooting.

---

## 🎉 **That's It!**

**Your complete AI Creative Studio will be deployed in 10-15 minutes!**

Just run the script and follow the prompts. Everything is automated! 🚀

---

## 📊 **What You'll Have:**

✅ **6 AI Features**:
- Image Generation
- Cloth Swap
- AI Influencer
- 3D Video
- Study Animation
- Story Video

✅ **Complete Backend**:
- REST API
- WebSocket updates
- Authentication
- Credit system
- Payment integration
- Job queue
- File storage

✅ **All Free Services**:
- Railway.app (API)
- MongoDB Atlas (Database)
- Upstash Redis (Queue)
- Cloudflare R2 (Storage)
- Ngrok (GPU tunnel)

**Total Cost: $0/month** 🎊

---

**Ready? Run the script now!** 🚀

```bash
./deploy-free-complete.sh
```
