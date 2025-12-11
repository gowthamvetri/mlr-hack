# 🤔 How Does the Chatbot Work? - Complete Explanation

## 🏗️ Architecture Overview

You're running **3 separate services** that work together:

```
┌─────────────────────────────────────────────────────────┐
│         USER OPENS http://localhost:5173                │
│              (React Frontend)                           │
└────────────────────┬────────────────────────────────────┘
                     │
                     │ User clicks chatbot button
                     │ User types: "What companies visited?"
                     │
                     ▼
         ┌───────────────────────┐
         │   ChatBot.jsx         │
         │   (React Component)   │
         └───────────┬───────────┘
                     │
           ┌─────────┴──────────┐
           │                    │
           ▼                    ▼
   ┌──────────────┐    ┌──────────────┐
   │ ZENITH RAG   │    │ MLR-Hack     │
   │ Backend      │    │ Node Backend │
   │ Port 8000    │    │ Port 5000    │
   │              │    │              │
   │ FOR CHATBOT  │    │ FOR OTHER    │
   │ ONLY         │    │ FEATURES     │
   └──────────────┘    └──────────────┘
```

---

## 📋 Step-by-Step: What Happens When User Asks a Question

### Step 1: User Interaction
```
User opens: http://localhost:5173
→ Sees the MLR-Hack website (your teammates' design)
→ Clicks chatbot button (bottom-right corner)
→ Types: "What companies visited for placements?"
```

### Step 2: Frontend Processing (ChatBot.jsx)
**Location:** `mlr-hack/frontend/src/components/ChatBot.jsx`

```javascript
// When user sends message:
const userMessage = {
  text: "What companies visited for placements?"
};

// Build conversation history
const conversationHistory = [
  { role: "user", content: "previous questions..." },
  { role: "assistant", content: "previous answers..." },
  { role: "user", content: "What companies visited for placements?" }
];

// Send to Zenith RAG Backend
fetch('http://localhost:8000/api/v1/chat/', {
  method: 'POST',
  body: JSON.stringify({
    question: "What companies visited for placements?",
    conversation_history: conversationHistory
  })
});
```

**Why this happens:** The ChatBot component sends the question to YOUR Zenith backend, not the MLR-Hack backend!

### Step 3: Zenith RAG Backend Processing
**Location:** `mlr-hack/zenith-backend/` (Port 8000)

```
┌──────────────────────────────────────────────────────┐
│  1. REQUEST ARRIVES at /api/v1/chat/                 │
│     Question: "What companies visited?"              │
│     History: [...previous conversation...]           │
└─────────────────┬────────────────────────────────────┘
                  │
                  ▼
┌──────────────────────────────────────────────────────┐
│  2. EMBEDDING SERVICE                                │
│     Converts question to vector embedding            │
│     Uses: Cohere API                                 │
│     Output: [0.123, -0.456, 0.789, ...]              │
└─────────────────┬────────────────────────────────────┘
                  │
                  ▼
┌──────────────────────────────────────────────────────┐
│  3. VECTOR SEARCH IN PINECONE                        │
│     Searches Pinecone database for similar vectors   │
│     Finds: "placements_2024.pdf"                     │
│            "companies_list.csv"                      │
│            "google_interview.txt"                    │
│     Returns: Top 5 most relevant chunks              │
└─────────────────┬────────────────────────────────────┘
                  │
                  ▼
┌──────────────────────────────────────────────────────┐
│  4. CONTEXT BUILDING                                 │
│     Combines:                                        │
│     • Retrieved documents from Pinecone              │
│     • Conversation history                           │
│     • User's current question                        │
└─────────────────┬────────────────────────────────────┘
                  │
                  ▼
┌──────────────────────────────────────────────────────┐
│  5. SEND TO GEMINI AI                                │
│     Model: gemini-1.5-flash-latest                   │
│     Prompt: "Based on this context: [documents]      │
│              And this history: [conversation]        │
│              Answer: What companies visited?"        │
└─────────────────┬────────────────────────────────────┘
                  │
                  ▼
┌──────────────────────────────────────────────────────┐
│  6. GEMINI GENERATES ANSWER                          │
│     "Based on the placement data, companies like     │
│      Google, Microsoft, Amazon, and TCS visited      │
│      MLRIT in 2024. Google offered packages up       │
│      to 45 LPA..."                                   │
└─────────────────┬────────────────────────────────────┘
                  │
                  ▼
┌──────────────────────────────────────────────────────┐
│  7. RESPONSE SENT BACK TO FRONTEND                   │
│     {                                                │
│       "answer": "Based on the placement data...",    │
│       "sources": ["placements_2024.pdf"],            │
│       "images": [...],                               │
│       "category": "placements"                       │
│     }                                                │
└──────────────────────────────────────────────────────┘
```

### Step 4: Frontend Displays Answer
```javascript
// ChatBot.jsx receives response
const botMessage = {
  text: data.answer,
  sources: data.sources,  // Shows which docs were used
  images: data.images,    // Any relevant images
  category: data.category // "placements"
};

// Displays in chat window with source citations
```

---

## 🔀 Why 3 Terminals? What Does Each Do?

### Terminal 1: Zenith RAG Backend (Port 8000)
```powershell
cd d:\Projects\Zenith\mlr-hack\zenith-backend
uvicorn app.main:app --reload --port 8000
```

**Purpose:** Handles ONLY the chatbot
**Does:**
- ✅ Receives chat questions from frontend
- ✅ Searches Pinecone vector database
- ✅ Calls Gemini AI for intelligent answers
- ✅ Returns answers with sources
- ✅ Maintains conversation context

**Does NOT:**
- ❌ Handle exams, events, placements pages
- ❌ Handle user authentication
- ❌ Handle any other MLR-Hack features

### Terminal 2: MLR-Hack Node Backend (Port 5000)
```powershell
cd d:\Projects\Zenith\mlr-hack\backend
npm start
```

**Purpose:** Handles ALL other MLR-Hack features
**Does:**
- ✅ User login/authentication
- ✅ Exams API (`/api/exams`)
- ✅ Events API (`/api/events`)
- ✅ Placements data API (`/api/placements`)
- ✅ Student progress, clubs, analytics
- ✅ Database operations (MongoDB)

**Does NOT:**
- ❌ Handle chatbot messages (that's Zenith's job!)

### Terminal 3: Frontend (Port 5173)
```powershell
cd d:\Projects\Zenith\mlr-hack\frontend
npm run dev
```

**Purpose:** The user interface (what users see)
**Does:**
- ✅ Renders all pages (Home, Exams, Events, etc.)
- ✅ Shows chatbot button
- ✅ Sends chatbot questions to Port 8000 (Zenith)
- ✅ Sends other requests to Port 5000 (MLR-Hack)
- ✅ Displays responses to user

---

## 🔄 Complete Flow Example

### Scenario 1: User Asks Chatbot Question
```
1. User types in chatbot: "What companies visited?"
   ↓
2. Frontend (5173) → POST http://localhost:8000/api/v1/chat/
   ↓
3. Zenith Backend (8000) processes:
   - Searches Pinecone database
   - Calls Gemini AI
   - Generates intelligent answer
   ↓
4. Zenith Backend (8000) → Returns JSON response
   ↓
5. Frontend (5173) displays answer in chatbot
```

### Scenario 2: User Views Exam Schedule
```
1. User clicks "Exams" page
   ↓
2. Frontend (5173) → GET http://localhost:5000/api/exams
   ↓
3. MLR-Hack Backend (5000) queries MongoDB
   ↓
4. MLR-Hack Backend (5000) → Returns exam data
   ↓
5. Frontend (5173) displays exam schedule
```

**Notice:** Different features use different backends!

---

## 🎯 Why This Architecture?

### ✅ Advantages:

1. **Separation of Concerns**
   - Chatbot logic isolated in Zenith backend
   - MLR-Hack features in Node backend
   - Easy to maintain and debug

2. **Your Teammates' Work Preserved**
   - Their UI design unchanged
   - Their backend features still work
   - Only chatbot enhanced with RAG

3. **Scalability**
   - Can deploy Zenith backend separately
   - Can update chatbot without touching other features
   - Can scale each service independently

4. **Technology Freedom**
   - Python for AI/ML (Zenith backend)
   - Node.js for web services (MLR-Hack backend)
   - React for UI (Frontend)

### 🔧 How They Connect:

```
Frontend knows:
- Chat questions → http://localhost:8000/api/v1/chat/
- Everything else → http://localhost:5000/api/...

ChatBot.jsx:
  apiEndpoint = 'http://localhost:8000/api/v1/chat/' ← Zenith

Other pages:
  VITE_API = 'http://localhost:5000' ← MLR-Hack
```

---

## 🧠 What is RAG? (Retrieval-Augmented Generation)

### Without RAG (Normal AI):
```
User: "What companies visited MLRIT?"
AI: "I don't have specific information about MLRIT."
```
❌ AI doesn't know your specific data

### With RAG (Your Zenith Backend):
```
User: "What companies visited MLRIT?"
  ↓
1. Search Pinecone for "companies" + "MLRIT" + "visited"
2. Find documents: placements_2024.pdf, companies_list.csv
3. Send to Gemini: "Based on THIS data: [docs], answer the question"
  ↓
AI: "Based on the placement data, Google, Microsoft,
     Amazon, and TCS visited MLRIT in 2024..."
```
✅ AI has context from YOUR documents!

---

## 📊 Data Flow Summary

```
┌──────────────┐
│   USER       │
│ (Browser)    │
└──────┬───────┘
       │
       ▼
┌──────────────────────────┐
│   Frontend               │
│   localhost:5173         │
│                          │
│   • Shows UI             │
│   • Has ChatBot.jsx      │
│   • Routes requests      │
└─────┬──────────┬─────────┘
      │          │
      │          │
      │          └──────────────────┐
      │                             │
      ▼                             ▼
┌─────────────────┐      ┌─────────────────┐
│ Zenith Backend  │      │ MLR-Hack Backend│
│ localhost:8000  │      │ localhost:5000  │
│                 │      │                 │
│ • RAG Pipeline  │      │ • Exams API     │
│ • Pinecone DB   │      │ • Events API    │
│ • Gemini AI     │      │ • Auth          │
│ • CHATBOT ONLY  │      │ • MongoDB       │
└─────────────────┘      └─────────────────┘
```

---

## 🎉 Summary

**3 Terminals = 3 Services:**

1. **Terminal 1 (Zenith - 8000):** Smart chatbot with RAG
2. **Terminal 2 (MLR-Hack - 5000):** All other features
3. **Terminal 3 (Frontend - 5173):** User interface

**When user asks chatbot:**
- Frontend → Zenith Backend → Pinecone → Gemini → Answer → Frontend

**When user uses other features:**
- Frontend → MLR-Hack Backend → MongoDB → Data → Frontend

**Best of both worlds!** 🚀
- Your teammates' UI (unchanged)
- Your powerful RAG chatbot (enhanced)
- All working together seamlessly!

---

Now let me start the Zenith backend with the fixed PyMuPDF! 🔧
