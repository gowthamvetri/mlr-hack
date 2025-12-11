# 🚀 QUICK START - Zenith RAG + MLR-Hack

## Start Everything (3 Simple Steps)

### 1️⃣ Navigate to Project
```powershell
cd d:\Projects\Zenith\mlr-hack
```

### 2️⃣ Run Quick Start Script
```powershell
.\START_ALL.ps1
```

### 3️⃣ Open Browser
```
http://localhost:5173
```

**That's it! 🎉**

---

## 📊 Service URLs

| Service | URL | Purpose |
|---------|-----|---------|
| **Frontend** | http://localhost:5173 | Your app UI |
| **Zenith RAG API** | http://localhost:8000/docs | RAG backend (chatbot) |
| **MLR-Hack API** | http://localhost:5000 | Node backend (other features) |

---

## 🧪 Test Chatbot

1. Open http://localhost:5173
2. Click chatbot button (bottom-right corner)
3. Ask: **"What companies visited for placements?"**
4. Should get AI-powered answer with sources! ✨

---

## 🛠️ Manual Start (If Needed)

### Terminal 1: Zenith RAG Backend
```powershell
cd d:\Projects\Zenith\mlr-hack\zenith-backend
.\venv\Scripts\Activate.ps1
uvicorn app.main:app --reload --port 8000
```

### Terminal 2: MLR-Hack Backend
```powershell
cd d:\Projects\Zenith\mlr-hack\backend
npm start
```

### Terminal 3: Frontend
```powershell
cd d:\Projects\Zenith\mlr-hack\frontend
npm run dev
```

---

## 🔧 First Time Setup

### Install Zenith Backend Dependencies
```powershell
cd d:\Projects\Zenith\mlr-hack\zenith-backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

### Install Node Dependencies
```powershell
# MLR-Hack backend
cd d:\Projects\Zenith\mlr-hack\backend
npm install

# Frontend
cd d:\Projects\Zenith\mlr-hack\frontend
npm install
```

---

## ❌ Stop All Services

Press `Ctrl+C` in each terminal window.

---

## 📖 Full Documentation

- **INTEGRATION_COMPLETE.md** - What was done
- **ZENITH_INTEGRATION_README.md** - Detailed setup guide

---

## 🆘 Troubleshooting

### Chatbot says "connection error"
✅ Make sure Zenith backend is running (port 8000)

### "Port already in use"
✅ Stop other services using those ports:
- Port 8000 (Zenith backend)
- Port 5000 (MLR-Hack backend)  
- Port 5173 (Frontend)

### Answers don't include sources
✅ Check if data is in Pinecone database
✅ Verify `.env` file has correct API keys

---

## 🎯 What's Integrated

✅ Your Zenith RAG Backend → Chatbot  
✅ Pinecone Vector Database  
✅ Google Gemini AI  
✅ Conversation History  
✅ Source Citations  
✅ Your Teammates' UI (unchanged)  

**Everything works together! 🚀**
