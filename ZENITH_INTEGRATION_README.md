# Zenith RAG Chatbot Integration - MLR-Hack

## ✅ What's Been Integrated

Your Zenith RAG chatbot backend has been successfully integrated into the MLR-Hack project:

### Backend Architecture
- **Zenith RAG Backend** (Port 8000): Your Python FastAPI backend with:
  - ✅ RAG Pipeline (Retrieval-Augmented Generation)
  - ✅ Pinecone Vector Database
  - ✅ Google Gemini AI (gemini-1.5-flash-latest)
  - ✅ Conversation History Support
  - ✅ Category Detection
  - ✅ Image & Source Citations

- **MLR-Hack Node Backend** (Port 5000): Original backend for other features
  - User authentication
  - Exams, events, placements data
  - All existing MLR-Hack functionality

### Frontend Integration
- **ChatBot Component Updated**: The existing `ChatBot.jsx` now connects to Zenith RAG API
- **No UI Changes**: Your teammates' design is preserved
- **Enhanced Functionality**: Now powered by RAG with conversation history

---

## 🚀 Setup Instructions

### 1. Install Zenith Backend Dependencies

```powershell
cd d:\Projects\Zenith\mlr-hack\zenith-backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
.\venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt
```

### 2. Configure Environment Variables

The `.env` file is already copied. Verify it has:

```env
# Pinecone Configuration
PINECONE_API_KEY=your_key_here
PINECONE_INDEX_NAME=mlrit-chatbot

# Google Gemini API
GOOGLE_API_KEY=your_key_here

# Server Configuration
BACKEND_PORT=8000
```

### 3. Start All Services

**Terminal 1 - Zenith RAG Backend:**
```powershell
cd d:\Projects\Zenith\mlr-hack\zenith-backend
.\venv\Scripts\Activate.ps1
uvicorn app.main:app --reload --port 8000
```

**Terminal 2 - MLR-Hack Node Backend:**
```powershell
cd d:\Projects\Zenith\mlr-hack\backend
npm install  # First time only
npm start    # Runs on port 5000
```

**Terminal 3 - Frontend:**
```powershell
cd d:\Projects\Zenith\mlr-hack\frontend
npm install  # First time only
npm run dev  # Runs on port 5173
```

---

## 🔧 What Was Changed

### Modified Files:

#### 1. `frontend/src/components/ChatBot.jsx`
**Changes:**
- Updated API endpoint: `http://localhost:8000/chat` → `http://localhost:8000/api/v1/chat/`
- Changed request format to match Zenith RAG API:
  ```javascript
  // OLD
  { message: text, conversation_id: id }
  
  // NEW
  { question: text, conversation_history: [...] }
  ```
- Updated response handling to use `data.answer` instead of `data.response`
- Added conversation history support (maintains context across messages)
- Added support for sources, images, and categories from RAG

### Added:

#### 2. `zenith-backend/` Directory
Contains your complete RAG pipeline:
- `app/` - FastAPI application
  - `api/v1/chat/` - Chat endpoints
  - `rag/` - RAG orchestration, LLM, vector store
  - `models/` - Pydantic models
  - `config/` - Settings & environment
- `scripts/` - Utility scripts
  - `cleanup_pinecone.py` - Delete all vectors
  - `check_namespaces.py` - Inspect database
- `requirements.txt` - Python dependencies
- `.env` - Environment configuration

---

## 🧪 Testing the Integration

### 1. Verify Zenith Backend is Running
```powershell
# In browser or curl
http://localhost:8000/docs
```
You should see FastAPI Swagger documentation.

### 2. Test RAG API Directly
```powershell
curl -X POST "http://localhost:8000/api/v1/chat/" `
  -H "Content-Type: application/json" `
  -d '{\"question\": \"What companies visited for placements?\", \"conversation_history\": []}'
```

### 3. Test Frontend Chatbot
1. Open `http://localhost:5173` in browser
2. Navigate to any page with chatbot (Onboarding, Placements, etc.)
3. Click chatbot button (bottom-right corner)
4. Ask: "What companies visited for placements?"
5. Should receive RAG-powered answer with sources

---

## 📊 API Comparison

### Zenith RAG API (Port 8000)
```javascript
// Request
POST http://localhost:8000/api/v1/chat/
{
  "question": "What companies visited?",
  "conversation_history": [
    { "role": "user", "content": "Hello" },
    { "role": "assistant", "content": "Hi! How can I help?" }
  ]
}

// Response
{
  "answer": "Based on the data...",
  "sources": ["placements_2024.pdf", "companies_list.csv"],
  "images": [
    { "url": "http://...", "label": "Company logo" }
  ],
  "category": "placements"
}
```

### MLR-Hack Node API (Port 5000)
```javascript
// Still available for other features
POST http://localhost:5000/api/exams
POST http://localhost:5000/api/events
POST http://localhost:5000/api/placements
// etc.
```

---

## 🔍 Troubleshooting

### Problem: Chatbot says "connection error"
**Solution:** Make sure Zenith backend is running on port 8000
```powershell
cd d:\Projects\Zenith\mlr-hack\zenith-backend
uvicorn app.main:app --reload --port 8000
```

### Problem: "Pinecone index not found"
**Solution:** Your Pinecone data is still in the original Zenith backend. Either:
1. Use the same Pinecone API key in both places
2. Or re-upload your documents to the new backend

### Problem: "GOOGLE_API_KEY not found"
**Solution:** Copy your `.env` file properly:
```powershell
Copy-Item "d:\Projects\Zenith\backend\.env" "d:\Projects\Zenith\mlr-hack\zenith-backend\.env"
```

### Problem: Answers are not contextual
**Solution:** The conversation history is working! Each new question includes previous messages for context.

---

## 📁 File Structure After Integration

```
mlr-hack/
├── zenith-backend/           # 🆕 Your RAG backend (Port 8000)
│   ├── app/
│   │   ├── api/v1/          # Chat endpoints
│   │   ├── rag/             # RAG pipeline, Gemini, Pinecone
│   │   ├── models/          # Pydantic models
│   │   └── config/          # Settings
│   ├── scripts/             # Cleanup & check tools
│   ├── requirements.txt
│   └── .env
│
├── backend/                 # Original Node.js backend (Port 5000)
│   ├── server.js
│   ├── src/routes/          # MLR-Hack API routes
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   └── ChatBot.jsx  # ✏️ MODIFIED - Now connects to Zenith
│   │   ├── pages/           # Your teammates' pages (unchanged)
│   │   └── index.css        # Red theme (unchanged)
│   └── package.json
│
└── README.md
```

---

## ✨ Features Now Available

### From Zenith RAG Backend:
- ✅ **Context-Aware Responses**: Remembers conversation history
- ✅ **Semantic Search**: Uses Pinecone vector database
- ✅ **Source Citations**: Shows which documents were used
- ✅ **Category Detection**: Identifies query type (placements, events, etc.)
- ✅ **Image Support**: Can display relevant images
- ✅ **Smart Embeddings**: Cohere embeddings for better understanding
- ✅ **Gemini AI**: Powered by gemini-1.5-flash-latest

### From MLR-Hack (Preserved):
- ✅ All existing features (exams, events, placements, etc.)
- ✅ Your teammates' UI/UX design
- ✅ Authentication system
- ✅ Dashboard functionality

---

## 🗑️ Cleanup Old Zenith Folder

After verifying everything works, you can remove the old Zenith folder:

```powershell
# ⚠️ ONLY DO THIS AFTER TESTING EVERYTHING WORKS!
# This will delete the original Zenith backend folder
Remove-Item -Path "d:\Projects\Zenith\backend" -Recurse -Force
Remove-Item -Path "d:\Projects\Zenith\frontend" -Recurse -Force
Remove-Item -Path "d:\Projects\Zenith\mlrit-chatbot" -Recurse -Force

# Keep only mlr-hack folder with integrated backend
```

---

## 📝 Next Steps

1. ✅ **Test the integration** - Verify chatbot works with RAG
2. ✅ **Update data** - If needed, upload new documents to Pinecone
3. ✅ **Team demo** - Show your teammates the enhanced chatbot
4. ✅ **Cleanup** - Remove old Zenith folder after verification
5. ✅ **Deploy** - When ready, deploy both backends to production

---

## 🎯 Summary

**What You Have Now:**
- ✅ MLR-Hack with your teammates' beautiful UI (unchanged)
- ✅ Your powerful Zenith RAG backend integrated seamlessly
- ✅ Chatbot now uses RAG, Pinecone, and Gemini AI
- ✅ All existing MLR-Hack features still work
- ✅ Two backends running in harmony (Node + Python)

**Best of Both Worlds! 🚀**
