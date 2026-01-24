# Say It Better

An AI-powered emotional translation tool that helps people clearly express how they feel — without diagnosing, advising, or replacing human care.

![Say It Better](https://img.shields.io/badge/TechNation-Hackathon%202026-brightgreen)
![AI + Healthcare](https://img.shields.io/badge/AI-Healthcare%20%26%20Wellness-blue)
![React](https://img.shields.io/badge/React-18-61dafb)
![FastAPI](https://img.shields.io/badge/FastAPI-Python-009688)

## 🎯 Problem Statement

Many people struggle to communicate their internal experiences clearly—especially when emotions are involved. This creates problems in:
- Therapy sessions becoming inefficient
- Doctor visits missing important context
- Conversations with trusted people feeling frustrating or misunderstood

**We don't analyze your mind — we help you express it.**

## ✨ Features

### Core Features
| Feature | Description |
|---------|-------------|
| 📝 **Raw Thought Input** | Write freely without worrying about structure |
| 🔄 **Emotional Translation** | AI converts messy thoughts into clear, calm language |
| 🏷️ **Key Themes Detection** | Automatically identify themes in your thoughts |
| 📤 **Share-Ready Output** | Get polished text suitable for sharing with professionals |
| 🎚️ **Tone Control** | Choose between neutral, personal, or clinical tones |

### Advanced Features
| Feature | Description |
|---------|-------------|
| 🎤 **Voice Input** | Speak your thoughts using speech-to-text (Web Speech API) |
| 💡 **Guided Prompts** | 6 categories of writing prompts to help get started |
| 📊 **Theme Trends Chart** | Visual bar/pie charts showing recurring patterns over time |
| 📄 **PDF Export** | Download professionally formatted PDF summaries |
| 📧 **Email Draft** | Open pre-filled email in your default mail client |
| 🔗 **Secure Sharing** | Generate temporary links with QR codes (24h expiry) |
| 💾 **Local History** | All data stored in IndexedDB on your device only |

### Therapist Summary Generator
| Feature | Description |
|---------|-------------|
| ✅ **Entry Selection** | Choose which entries to include in your summary |
| 📄 **PDF Export** | Professional multi-page PDF for healthcare providers |
| 📊 **Theme Analysis** | Automatic recurring theme detection across sessions |
| 🔗 **Secure Link** | Generate 24h expiring links with QR codes |
| 📧 **Email Draft** | Pre-filled email ready to send |
| 📅 **Date Filtering** | Filter by all time, past week, or past month |

## 🛡️ Safety & Ethics

This tool is **intentionally designed with strong boundaries**:

- ❌ **No therapy or counseling**
- ❌ **No diagnosis or labeling**
- ❌ **No advice or recommendations**
- ❌ **No crisis handling or risk scoring**

### Privacy First
- ✅ Text is processed only for the current request
- ✅ No long-term storage on servers
- ✅ No data used for training
- ✅ All history stored locally in your browser (IndexedDB)
- ✅ Users can delete all data at any time
- ✅ Clear disclaimer shown on first visit

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- Python 3.9+
- TELUS AI API credentials

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

# Edit .env with your TELUS AI credentials

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

## 🔧 API Configuration

The backend requires TELUS AI endpoints. Configure in `backend/.env`:

```env
# TELUS AI - Gemma 3 27B Model (for text translation)
GEMMA_ENDPOINT=https://your-gemma-endpoint.paas.ai.telus.com
GEMMA_TOKEN=your_gemma_api_token_here
GEMMA_MODEL=google/gemma-3-27b-it

# TELUS AI - Qwen Embedding Model (for theme analysis)
QWEN_EMB_ENDPOINT=https://your-qwen-endpoint.paas.ai.telus.com
QWEN_EMB_TOKEN=your_qwen_api_token_here
QWEN_EMB_MODEL=Qwen/Qwen3-Embedding-8B
```

> ⚠️ **Security**: Never commit `.env` to version control. It's already in `.gitignore`.

## 📁 Project Structure

```
say-it-better/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   └── main.py              # FastAPI application
│   ├── requirements.txt         # Python dependencies
│   ├── .env.example             # Environment template
│   └── test_api.py              # API testing script
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header.jsx           # App header
│   │   │   ├── Footer.jsx           # App footer
│   │   │   ├── DisclaimerModal.jsx  # Safety disclaimer popup
│   │   │   ├── InputSection.jsx     # Text input + voice + prompts
│   │   │   ├── OutputSection.jsx    # Translation results + export
│   │   │   ├── SessionSummary.jsx   # Therapist summary generator
│   │   │   ├── ThemeTrendsChart.jsx # Visual theme analytics
│   │   │   ├── GuidedPrompts.jsx    # Writing prompt suggestions
│   │   │   ├── VoiceInput.jsx       # Speech-to-text input
│   │   │   └── ShareModal.jsx       # Multi-option sharing modal
│   │   ├── hooks/
│   │   │   └── useAppState.js       # State management hook
│   │   ├── services/
│   │   │   └── storage.js           # IndexedDB storage service
│   │   ├── App.jsx                  # Main application
│   │   ├── main.jsx                 # Entry point
│   │   └── index.css                # Tailwind styles
│   ├── public/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── postcss.config.js
├── .env.example                 # Root environment template
├── .gitignore                   # Git ignore rules
└── README.md
```

## 🎨 Tech Stack

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
| **AI** | Gemma-3-27B | Text translation (TELUS AI) |
| | Qwen Embeddings | Theme similarity (TELUS AI) |
| **Storage** | IndexedDB | Local browser storage |

## 🔌 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Health check |
| `/health` | GET | Detailed health status |
| `/translate` | POST | Translate emotional text |
| `/disclaimer` | GET | Get safety disclaimer text |
| `/embeddings` | POST | Generate text embeddings |
| `/analyze-themes` | POST | Compare themes for patterns |

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

## 🔮 Future Extensions

- Multi-language emotional translation
- Integration with therapy platforms
- Accessibility-focused versions (larger text, high contrast)
- Offline/privacy-first mode with on-device AI
- Wearable integration for real-time emotion tracking

## 🌐 Deployment (Vercel)

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
   - Set the **Root Directory** to `frontend`
   - Add **Environment Variables** in the Vercel dashboard:
     ```
     GEMMA_ENDPOINT=https://your-gemma-endpoint.paas.ai.telus.com
     GEMMA_TOKEN=your_gemma_api_token_here
     QWEN_EMB_ENDPOINT=https://your-qwen-endpoint.paas.ai.telus.com
     QWEN_EMB_TOKEN=your_qwen_api_token_here
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
│   ├── index.py            # /api health check
│   └── requirements.txt    # Python dependencies for Vercel
├── frontend/               # React app (set as root directory)
│   └── ...
├── backend/                # Local development only
│   └── ...
└── vercel.json             # Vercel configuration
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

## 📄 License

MIT License - Built for TechNation Hackathon 2026

---

**Remember:** This tool helps humans talk to humans. It doesn't replace care — it enables better communication.
