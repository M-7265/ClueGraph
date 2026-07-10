# 🕵️ ClueGraph — Agentic RAG Mystery Solver

An interactive AI detective game demonstrating **Agentic Retrieval-Augmented Generation (RAG)**. The AI autonomously searches through case files, forms hypotheses, and reasons step-by-step to solve mysteries — all visualized live on an animated evidence board.

---

## ✨ Features

- 🔍 **Agentic Multi-Hop RAG** — The AI loops through documents, issues its own follow-up queries, and accumulates evidence until it reaches a verdict
- ⚡ **Real-Time Evidence Board** — Clue cards animate onto a corkboard live as the agent discovers them (via SSE)
- 🗂️ **Custom Case Upload** — Upload your own mystery case files and watch the agent solve them
- 📊 **Naive vs. Agentic comparison** — See the difference between single-shot RAG and multi-hop reasoning side by side
- 🚀 **Groq-powered** — Blazing fast inference using `llama-3.1-8b-instant`

---

## 🏗️ Tech Stack

| Layer | Technology |
|---|---|
| Backend | FastAPI + Python 3.11 |
| LLM | Groq API (`llama-3.1-8b-instant`) |
| Vector Store | Custom in-memory Mock ChromaDB |
| Streaming | Server-Sent Events (SSE) |
| Frontend | Next.js 15 + TypeScript |
| Styling | Tailwind CSS |
| Animations | Framer Motion |

---

## 🚀 Getting Started

### Prerequisites
- Python 3.11+
- Node.js 18+
- A free [Groq API Key](https://console.groq.com)

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/ClueGraph.git
cd ClueGraph
```

### 2. Set up the Backend

```bash
cd backend

# Create and activate virtual environment
python -m venv .venv
.\.venv\Scripts\activate       # Windows
# source .venv/bin/activate    # Mac/Linux

# Install dependencies
pip install -r requirements.txt

# Create your .env file
copy .env.example .env
# Edit .env and add your GROQ_API_KEY
```

### 3. Start the Backend

```bash
python -m uvicorn main:app --port 8000 --reload
```

### 4. Set up the Frontend

```bash
cd ../frontend
npm install
npm run dev
```

### 5. Open in browser

Navigate to **http://localhost:3000**

---

## 📁 Project Structure

```
ClueGraph/
├── backend/
│   ├── main.py           # FastAPI app + startup
│   ├── rag.py            # Agentic RAG loop + SSE streaming
│   ├── mock_chroma.py    # In-memory document store
│   ├── seed.py           # Built-in mystery case files
│   ├── requirements.txt
│   └── .env.example
└── frontend/
    ├── app/
    │   └── page.tsx      # Main app page + SSE client
    ├── components/
    │   ├── ClueGraphBoard.tsx   # Evidence board
    │   └── ClueCard.tsx         # Animated clue card
    └── lib/
        └── api.ts        # API helper functions
```

---

## 🔑 Environment Variables

Create a `backend/.env` file with the following:

```env
GROQ_API_KEY=your_groq_api_key_here
SIMULATION_MODE=false
OLLAMA_BASE_URL=http://localhost:11434/v1/
OLLAMA_MODEL=llama-3.1-8b-instant
```

Get a free API key at [https://console.groq.com](https://console.groq.com)

---

## 📖 How It Works

1. Select a mystery (or upload your own case files)
2. Click **"Solve Case"** to start the Agentic RAG loop
3. Watch the AI pin clue cards to the evidence board in real-time
4. The agent issues its own follow-up queries, hop by hop
5. When it has undeniable proof, it delivers the **Verdict** 🔍

---

## 📄 License

MIT License — feel free to use, modify, and distribute.
