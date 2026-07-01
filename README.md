# Waifu Sim

A waifu simulation project integrating **GPT-SoVITS** (TTS), a Python backend, and a modern frontend UI.

---

## Prerequisites

- **Python 3.10**
- **Node.js** + **npm**
- GPT-SoVITS installed separately (standalone TTS)
- Ollama (for running local LLM)
=======

---

## Installation & Setup


### 0. Install Ollama + Llama 3

1. Download and install Ollama from: https://ollama.com
2. Pull the Llama 3 model:
   ```bash
   ollama pull llama3:latest
   ```

=======

### 1. GPT-SoVITS (Standalone TTS)

GPT-SoVITS must be installed separately. Follow the official GPT-SoVITS installation guide.

1. Navigate to the GPT-SoVITS directory.
2. Create a virtual environment:
   ```bash
   python -m venv venv
   ```
3. Activate it:
   - **Linux / macOS**:
     ```bash
     source venv/bin/activate
     ```
   - **Windows**:
     ```bash
     venv\Scripts\activate
     ```
4. Install requirements:
   ```bash
   pip install -r extra-reqs.txt --no deps (smth like that)
   pip install -r requirements.txt
   ```

### 2. Backend Setup

1. Go to the backend folder:
   ```bash
   cd backend
   ```
2. Create a virtual environment (Python 3.10):
   ```bash
   python3.10 -m venv venv
   ```
3. Activate it (same commands as above).
4. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

### 3. Frontend Setup

1. Go to the frontend folder:
   ```bash
   cd frontend/waifu-ui
   ```
2. Install packages:
   ```bash
   npm install
   ```

---

## How to Run

1. **Start GPT-SoVITS API** (first terminal):
   - Navigate to GPT-SoVITS folder
   - Activate its venv
   - Run:
     ```bash
     python api_v2.py
     ```

2. **Start Backend** (second terminal):
   - Navigate to `backend` folder
   - Activate Python 3.10 venv
   - Run:
     ```bash
     python main.py
     ```

3. **Start Frontend** (third terminal):
   - Navigate to `frontend/waifu-ui`
   - Run:
     ```bash
     npm run dev
     ```

4. Open **Chrome**, hold **Ctrl** and left-click the link shown in the frontend terminal (usually `http://localhost:3000`).

---

**Congratulations!** Your Waifu should now be loaded. 🎉

**Note:** Always start GPT-SoVITS first, as the backend depends on its API. and it's api takes hella time to load up on my crappy pc.
