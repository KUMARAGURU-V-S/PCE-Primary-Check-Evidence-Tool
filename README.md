# 🛡️ Evidence Automator

Automated security verification and compliance dashboard. This tool helps security teams verify SBOMs, Audit Logs, NTP Sync, and SSDLC compliance evidence.

---

## 🚀 Quick Start (Recommended for Local Use)

The easiest way to run this tool on **Windows, Mac, or Linux** without installing Tesseract, Syft, or Grype manually is using **Docker Desktop**.

1.  Install [Docker Desktop](https://www.docker.com/products/docker-desktop/).
2.  Open your terminal in the project root directory.
3.  Run the following command:
    ```bash
    docker-compose up --build
    ```
4.  Access the app at:
    *   **Frontend:** `http://localhost:5173`
    *   **Backend:** `http://localhost:3001`

---

## 💻 Manual Local Setup (Windows)

If you prefer not to use Docker, follow these steps to set up the engine on your Windows laptop.

### 1. Install System Dependencies
*   **Tesseract OCR:** Download and run the installer from [UB Mannheim](https://github.com/UB-Mannheim/tesseract/wiki). Install to `C:\Program Files\Tesseract-OCR`.
*   **Syft:** Run in PowerShell:
    ```powershell
    curl.exe -sSfL https://raw.githubusercontent.com/anchore/syft/main/install.sh | sh -s -- -b C:\bin
    ```
*   **Grype:** Run in PowerShell:
    ```powershell
    curl.exe -sSfL https://raw.githubusercontent.com/anchore/grype/main/install.sh | sh -s -- -b C:\bin
    ```
    *(Note: Ensure `C:\bin` and `C:\Program Files\Tesseract-OCR` are added to your System PATH).*

### 2. Start the Backend
```bash
cd backend
npm install
npm start
```

### 3. Start the Frontend
```bash
cd frontend
npm install
npm run dev
```

---

## ☁️ Cloud Deployment

### Backend (Render)
1.  Create a new **Web Service** on Render.
2.  Set **Root Directory** to `backend`.
3.  Change **Runtime** from `Node` to **`Docker`**.
4.  Render will automatically use the `backend/Dockerfile`.

### Frontend (Vercel)
1.  Deploy the `frontend` folder to Vercel.
2.  Add an **Environment Variable** in Vercel:
    *   `VITE_API_URL`: Your Render Backend URL (e.g., `https://pce-backend.onrender.com`)

---

## 🛠️ Evidence Types Supported

| Type | Verification Logic |
| :--- | :--- |
| **SBOM** | Analyzes components and vulnerabilities using Syft & Grype. |
| **Audit Logs** | Scans for 'access', 'monitor', and 'error' patterns. |
| **Retention** | Verifies 'rotate 180' archival settings in config/logs. |
| **Time Sync** | Validates sync with Samay (NIC) and NPL India NTP servers. |
| **SSDLC Audit** | Confirms security lifecycle markers in project documentation. |

---

## 📦 Project Structure
- `/frontend`: React + Vite (Dashboard)
- `/backend`: Node.js Express server + OCR/Security Engines
- `/backend/Dockerfile`: Deployment configuration for Render
