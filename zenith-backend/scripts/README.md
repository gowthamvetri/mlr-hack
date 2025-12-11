# Backend Scripts

Utility scripts for managing the MLRIT chatbot backend.

---

## Available Scripts

### 1. `check_namespaces.py` ⭐ NEW
**Purpose:** See what namespaces (categories) exist in your Pinecone database

**Usage:**
```powershell
cd d:\Projects\Zenith\backend
python scripts\check_namespaces.py
```

**What it shows:**
- List of all namespaces (categories)
- Number of vectors (chunks) in each
- Helps debug "0 results found" issues

**When to use:**
- After uploading content
- To verify upload worked
- To see what categories exist

---

### 2. `cleanup_pinecone.py`
**Purpose:** Delete all embeddings/chunks from Pinecone vector database

**Usage:**
```powershell
cd d:\Projects\Zenith\backend
python scripts\cleanup_pinecone.py
```

**What it does:**
- Lists all namespaces and vector counts
- Asks for confirmation (type `YES`)
- Deletes all vectors from all namespaces
- Verifies cleanup succeeded

**When to use:**
- Start fresh with new content
- Remove old chunks after changing chunking strategy
- Clear database before re-uploading

---

### 2. `fresh_start.py`
**Purpose:** Quick reset - cleanup Pinecone and show restart instructions

**Usage:**
```powershell
cd d:\Projects\Zenith\backend
python scripts\fresh_start.py
```

**What it does:**
- Runs `cleanup_pinecone.py` automatically
- Shows instructions to restart backend
- Displays next steps for uploading content

**When to use:**
- Quick reset before testing
- After making code changes to chunking/embeddings

---

## Common Workflows

### Starting Fresh
```powershell
# 1. Clean database
python scripts\cleanup_pinecone.py

# 2. Restart backend
uvicorn app.main:app --reload

# 3. Re-upload content via Admin Panel
```

### After Code Changes
If you modified:
- `indexer.py` (chunking logic)
- `embeddings.py` (embedding model)
- Chunk size or overlap settings

You need to:
1. Run cleanup script
2. Restart backend
3. Re-upload all content

---

## Environment Requirements

Both scripts require:
- `.env` file with `PINECONE_API_KEY`
- `PINECONE_INDEX_NAME` (defaults to "smart-campus-rag")
- Pinecone package installed: `pip install pinecone`

---

## Troubleshooting

### Error: "PINECONE_API_KEY not found"
**Solution:**
```powershell
# Check .env file
cat .env | Select-String "PINECONE"

# Should show:
# PINECONE_API_KEY=your-api-key-here
```

### Error: "Import pinecone could not be resolved"
**Solution:**
```powershell
pip install pinecone-client
```

### Error: "Index not found"
**Solution:**
- Check `PINECONE_INDEX_NAME` in `.env`
- Verify index exists at https://app.pinecone.io/

---

## Notes

- Scripts are safe - they always ask for confirmation before deleting
- Cleanup is reversible - just re-upload your content
- Deleting vectors doesn't delete the index itself
- You can run cleanup multiple times without issues
