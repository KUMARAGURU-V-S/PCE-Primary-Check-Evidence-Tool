# 🛡️ Evidence Automator

Automated security verification and compliance dashboard. This tool helps security teams verify SBOMs, Audit Logs, NTP Sync, and SSDLC compliance evidence.

---

## 🚀 Quick Start (Recommended for Local Use)

### **Option 1: One-Click Start (Windows)**
If you are on Windows, simply double-click the **"Evidence Automator"** shortcut on your Desktop.
*   Alternatively, run the `start-app.bat` file in the project root.
*   This will automatically launch both the Backend (Port 3001) and Frontend (Port 5173).

### **Option 2: Docker Desktop**
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

#### **A. Tesseract OCR (For Evidence Verification)**
1.  Download the installer from [UB Mannheim (Tesseract for Windows)](https://github.com/UB-Mannheim/tesseract/wiki).
2.  Run the installer and note the installation path (default is `C:\Program Files\Tesseract-OCR`).
3.  **Add to PATH:**
    *   Open **Start Search**, type "env", and select **Edit the system environment variables**.
    *   Click **Environment Variables**, find **Path** under "System variables", and click **Edit**.
    *   Click **New** and paste: `C:\Program Files\Tesseract-OCR`.
    *   Click **OK** on all windows.

#### **B. Syft & Grype (For SBOM & Vulnerability Analysis)**
The easiest way to install these on Windows is via **WinGet** (included in Windows 10/11). Open PowerShell and run:

```powershell
# Install Syft
winget install Anchore.Syft

# Install Grype
winget install Anchore.Grype
```

*Note: After running these commands, close and reopen your PowerShell/Terminal window to refresh your environment variables.*

### 2. Verify Installations
Ensure everything is working correctly by running these commands in a **new** terminal:
```powershell
tesseract --version
syft --version
grype --version
```
*If any command fails, double-check that the installation directory was added to your System PATH.*

### 3. Start the Backend
```bash
cd backend
npm install
npm start
```

### 4. Start the Frontend
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
