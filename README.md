# Say It Better

An AI-powered emotional translation tool that helps people clearly express how they feel - without diagnosing, advising, or replacing human care.

**[Live Demo](https://say-it-better-zeta.vercel.app/)**

![AI + Healthcare](https://img.shields.io/badge/AI-Healthcare%20%26%20Wellness-blue)
![React](https://img.shields.io/badge/React-18-61dafb)
![FastAPI](https://img.shields.io/badge/FastAPI-Python-009688)
![Groq](https://img.shields.io/badge/Groq-Llama%203.3-orange)
![License](https://img.shields.io/badge/License-Proprietary-red)

## Problem Statement

Many people struggle to communicate their internal experiences clearly - especially when emotions are involved. This creates problems in:
- Therapy sessions becoming inefficient
- Doctor visits missing important context
- Conversations with trusted people feeling frustrating or misunderstood

**We don't analyze your mind - we help you express it.**

## Features

### Core Capabilities
- **Raw Thought Input:** Write freely without worrying about structure.
- **Emotional Translation:** AI converts messy thoughts into clear, calm language.
- **Key Themes Detection:** Automatically identify recurring themes in your thoughts.
- **Share-Ready Output:** Get polished text suitable for sharing with professionals.
- **Tone Control:** Choose between neutral, personal, or clinical tones.

### Advanced Functionality
- **Voice Input:** Speak your thoughts using Web Speech API speech-to-text.
- **Guided Prompts:** Six categories of writing prompts to help overcome writer's block.
- **Theme Trends Chart:** Visual analytics showing recurring patterns over time (High Contrast supported).
- **PDF Export:** Download professionally formatted PDF summaries (Therapist-ready).
- **Email Draft:** Open pre-filled emails in your default mail client instantly.
- **Secure Sharing:** Generate temporary, privacy-first links (24h expiry).
- **Zero-Knowledge Architecture:** Data is encrypted on-device before sharing - the server never sees your content.
- **Accessibility Suite:** High Contrast mode, screen reader optimizations, and clear visual cues.
- **Local History:** All data is stored in IndexedDB on your device by default.
- **E2E Cloud Sync:** Optional encrypted sync across devices.

### Therapist Summary Generator
- **"Calm" Design:** A soothing, accessible interface for reviewing progress.
- **Entry Selection:** Choose specific entries to include.
- **Professional Export:** Create multi-page PDF summaries for healthcare providers.
- **Secure Link:** Share read-only summaries via encrypted, expiring links.
- **Date Filtering:** Filter by all time, past week, or past month.

## Safety & Ethics

This tool is **intentionally designed with strong boundaries**:

- **No therapy or counseling**
- **No diagnosis or labeling**
- **No advice or recommendations**
- **No crisis handling or risk scoring**

### Privacy First Architecture
- Text is processed only for the current request.
- No data is used for training models.
- All history is stored locally in your browser by default (IndexedDB).
- **Optional cloud sync uses end-to-end encryption (AES-256-GCM).**
- Zero-knowledge architecture - we cannot read your encrypted data.
- **Privacy-safe deletions** - deleted content is immediately removed; only minimal sync metadata is temporarily retained.
- **Automatic cleanup** - sync metadata is auto-purged after 7 days.
- Users can delete all data at any time.
- Clear disclaimer shown on first visit.

### Zero-Knowledge Secure Sharing
When you generate a secure link:
1.  **Client-Side Encryption:** Your browser generates a random AES-256 key.
2.  **Encryption:** Your summary is encrypted locally using this key.
3.  **Upload:** The encrypted "blob" (unreadable to the server) is uploaded with a 24h expiry.
4.  **Link Generation:** The link contains the ID *and* the decryption key in the hash (`#key=...`).
5.  **Privacy:** Browsers never send the hash to the server, ensuring we never see your key or data.

### End-to-End Encryption (Cloud Sync)
When you enable cloud sync:
- Your data is encrypted **before** leaving your device.
- Encryption uses **AES-256-GCM** with PBKDF2 key derivation (100,000 iterations).
- Your passphrase **never leaves your device** - only encrypted blobs are stored.
- Each user gets a unique storage key derived from their username + passphrase.
- Even if the server is compromised, your data remains undecryptable without your passphrase.
- **Multi-device sync** - entries sync automatically every 15 seconds across all your devices.
- **Persistent login** - stay connected across browser sessions (credentials stored locally).
- **Delete propagation** - deletions sync correctly across all devices.

## Quick Start

### Prerequisites

- Node.js 18+ 
- Python 3.9+
- **Groq API Key** (free): [console.groq.com](https://console.groq.com)
- **Hugging Face Token** (free, optional): [huggingface.co/settings/tokens](https://huggingface.co/settings/tokens)

### Backend Setup

```bash
cd say-it-better/backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment (REQUIRED)
copy .env.example .env   # Windows
# or: cp .env.example .env  # macOS/Linux

# Edit .env with your Groq API key

# Run the server
uvicorn app.main:app --reload --port 8000
```

### Frontend Setup

```bash
cd say-it-better/frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Open http://localhost:5173 in your browser.

## API Configuration

The backend uses **free AI APIs**. Configure in `backend/.env`:

```env
# Groq API (FREE) - Get key at https://console.groq.com
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=llama-3.3-70b-versatile

# Hugging Face (FREE, optional) - For embeddings
# Get token at https://huggingface.co/settings/tokens
HF_TOKEN=your_huggingface_token_here
```

> **Security Note:** Never commit `.env` to version control. It is already included in `.gitignore`.

> **Important:** Save API keys in Vercel exactly as raw values (no quotes, no extra spaces, no trailing newlines).

## Project Structure

```
say-it-better/
├── api/                    # Vercel Serverless Functions
│   ├── translate.py        # /api/translate endpoint
│   ├── analyze-themes.py   # /api/analyze-themes endpoint
│   ├── embeddings.py       # /api/embeddings endpoint
│   ├── disclaimer.py       # /api/disclaimer endpoint
│   ├── cloud.py            # /api/cloud E2E encrypted storage
│   ├── index.py            # /api health check
│   └── requirements.txt    # Python dependencies for Vercel
├── frontend/               # React app (built by vercel.json)
│   └── ...
├── backend/                # Local development only
│   └── ...
└── vercel.json             # Vercel configuration (handles build & routes)
```

## Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend** | React 18 | UI components |
| | Vite | Build tool & dev server |
| | Tailwind CSS | Styling |
| | Lucide React | Icons |
| | Recharts | Theme trend visualizations |
| | jsPDF | PDF generation |
| | qrcode.react | QR code generation |
| **Backend** | FastAPI | REST API framework |
| | Python 3.9+ | Runtime |
| | httpx | Async HTTP client |
| | pydantic | Data validation |
| **AI** | Groq (Llama 3.3 70B) | Text translation (FREE) |
| | Hugging Face | Embeddings (FREE) |
| **Storage** | IndexedDB | Local browser storage |
| | Redis Cloud | E2E encrypted cloud storage |

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Health check |
| `/health` | GET | Detailed health status |
| `/translate` | POST | Translate emotional text |
| `/disclaimer` | GET | Get safety disclaimer text |
| `/embeddings` | POST | Generate text embeddings |
| `/analyze-themes` | POST | Compare themes for patterns |
| `/cloud` | GET/POST/DELETE | E2E encrypted cloud storage operations |

### Translate Request Example

```bash
curl -X POST http://localhost:8000/translate \
  -H "Content-Type: application/json" \
  -d '{
    "raw_text": "I feel tired all the time and everything feels overwhelming",
    "tone": "neutral"
  }'
```

### Response Format

```json
{
  "summary": "Clear 2-4 sentence summary",
  "themes": [
    {"theme": "Fatigue", "description": "Ongoing tiredness"},
    {"theme": "Overwhelm", "description": "Feeling overloaded"}
  ],
  "share_ready": "Polished version for sharing",
  "original_length": 62,
  "translated_length": 45
}
```

## Deployment (Vercel)

This project is configured for deployment on **Vercel** with serverless functions for the backend API. This keeps your API keys secure while hosting everything on a single platform.

### Quick Deploy

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Deploy to Vercel**
   - Go to [vercel.com](https://vercel.com) and sign in with GitHub
   - Click "New Project" → Select your repository
   - **IMPORTANT:** Leave **Root Directory** empty (or set to `.`) - do NOT set it to `frontend`
   - Add **Environment Variables** in the Vercel dashboard:
     ```
     # LLM API (FREE)
     GROQ_API_KEY=your_groq_api_key_here
    GROQ_MODEL=llama-3.3-70b-versatile
     
     # Embeddings (FREE, optional)
     HF_TOKEN=your_huggingface_token_here
     
     # For E2E Encrypted Cloud Sync (Redis Cloud)
     REDIS_HOST=your_redis_host
     REDIS_PORT=6379
     REDIS_PASSWORD=your_redis_password
     ```
   - Click "Deploy"

### Project Structure for Vercel

```
say-it-better/
├── api/                    # Vercel Serverless Functions
│   ├── translate.py        # /api/translate endpoint
│   ├── analyze-themes.py   # /api/analyze-themes endpoint
│   ├── embeddings.py       # /api/embeddings endpoint
│   ├── disclaimer.py       # /api/disclaimer endpoint
│   ├── cloud.py            # /api/cloud E2E encrypted storage
│   ├── index.py            # /api health check
│   └── requirements.txt    # Python dependencies for Vercel
├── frontend/               # React app (built by vercel.json)
│   └── ...
├── backend/                # Local development only
│   └── ...
└── vercel.json             # Vercel configuration (handles build & routes)
```

### Environment Variables on Vercel

Your API keys are stored securely in Vercel's environment variables (Settings → Environment Variables). They are:
- **Never exposed** to the client/browser
- **Never committed** to your GitHub repository
- **Only accessible** by the serverless functions running on Vercel's servers

### Local vs Production

| Environment | Frontend | Backend |
|-------------|----------|---------|
| **Local Dev** | `localhost:5173` | `localhost:8000` (FastAPI) |
| **Vercel** | `your-app.vercel.app` | `/api/*` (Serverless Functions) |

The frontend automatically detects the environment and uses the correct API URL.

## License

**Copyright © 2026 Lishen M. Amaraweera. All Rights Reserved.**

This project is proprietary software. No part of this codebase may be used, studied, copied, modified, or distributed for any purpose (commercial or non-commercial) without explicit written permission from the owner.

See the [LICENSE](./LICENSE) file for details.
---

**Remember:** This tool helps humans talk to humans. It doesn't replace care - it enables better communication.
