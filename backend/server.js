const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const { exec } = require('child_process');
const fs = require('fs');
const ExcelJS = require('exceljs');
const tesseract = require('node-tesseract-ocr');
const { PDFParse } = require('pdf-parse');

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads';
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  },
});

const upload = multer({ storage });

const tesseractConfig = {
  lang: "eng",
  oem: 1,
  psm: 3,
};

// --- Utilities ---

function parseUploadedSbom(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(content);
    if (data.components && Array.isArray(data.components)) {
      return data.components.map(c => ({
        name: c.name, version: c.version, type: c.type,
        language: c.properties?.find(p => p.name === 'syft:package:language')?.value || 'N/A',
        licenses: c.licenses ? c.licenses.map(l => l.license?.name || l.license?.id).filter(Boolean) : []
      }));
    }
    if (data.artifacts && Array.isArray(data.artifacts)) {
      return data.artifacts.map(a => ({
        name: a.name, version: a.version, type: a.type, language: a.language || 'N/A', licenses: a.licenses || []
      }));
    }
  } catch (e) { return null; }
  return null;
}

async function createExcelReport(packages, grypeData, outputPath) {
  const workbook = new ExcelJS.Workbook();
  const vulnSheet = workbook.addWorksheet('Vulnerabilities');
  vulnSheet.columns = [
    { header: 'Severity', key: 'severity', width: 15 },
    { header: 'Package', key: 'package', width: 30 },
    { header: 'Version', key: 'version', width: 20 },
    { header: 'Vulnerability ID', key: 'id', width: 25 },
    { header: 'Fix State', key: 'fix', width: 15 },
  ];
  const severityOrder = { Critical: 0, High: 1, Medium: 2, Low: 3, Negligible: 4, Unknown: 5 };
  const matches = grypeData.matches || [];
  const sortedMatches = matches.sort((a, b) => (severityOrder[a.vulnerability.severity] ?? 99) - (severityOrder[b.vulnerability.severity] ?? 99));
  sortedMatches.forEach(match => {
    vulnSheet.addRow({
      severity: match.vulnerability.severity, package: match.artifact.name,
      version: match.artifact.version, id: match.vulnerability.id, fix: match.vulnerability.fix?.state || 'N/A'
    });
  });
  vulnSheet.getRow(1).font = { bold: true };
  const pkgSheet = workbook.addWorksheet('Packages');
  pkgSheet.columns = [
    { header: 'Name', key: 'name', width: 30 }, { header: 'Version', key: 'version', width: 20 },
    { header: 'Type', key: 'type', width: 15 }, { header: 'Language', key: 'language', width: 15 },
    { header: 'Licenses', key: 'licenses', width: 30 },
  ];
  packages.forEach(pkg => {
    pkgSheet.addRow({
      name: pkg.name, version: pkg.version, type: pkg.type, language: pkg.language,
      licenses: Array.isArray(pkg.licenses) ? pkg.licenses.join(', ') : pkg.licenses
    });
  });
  pkgSheet.getRow(1).font = { bold: true };
  await workbook.xlsx.writeFile(outputPath);
}

// --- Endpoints ---

// 1. SBOM Analysis
app.post('/api/analyze-sbom', upload.single('sbom'), (req, res) => {
  if (!req.file) return res.status(400).send('No file uploaded.');
  const filePath = req.file.path;
  let packages = parseUploadedSbom(filePath);
  const grypeCmd = `grype ${filePath} -o json`;

  exec(grypeCmd, (grypeError, grypeStdout, grypeStderr) => {
    if (grypeError) {
      console.error(`Grype error: ${grypeError}`);
      return res.status(500).json({ error: 'Grype analysis failed', details: grypeStderr });
    }
    const grypeData = JSON.parse(grypeStdout);
    if (!packages) {
      const syftCmd = `syft ${filePath} -o json`;
      exec(syftCmd, (syftError, syftStdout, syftStderr) => {
        if (syftError) {
          console.error(`Syft error: ${syftError}`);
          return res.status(500).json({ error: 'Syft failed', details: syftStderr });
        }
        const syftData = JSON.parse(syftStdout);
        packages = (syftData.artifacts || []).map(a => ({
          name: a.name, version: a.version, type: a.type, language: a.language || 'N/A', licenses: a.licenses || []
        }));
        finalizeSbomResponse(packages, grypeData, res);
      });
    } else {
      finalizeSbomResponse(packages, grypeData, res);
    }
  });
});

async function finalizeSbomResponse(packages, grypeData, res) {
  try {
    const totalPackages = packages.length;
    const vulnerabilities = grypeData.matches ? grypeData.matches.length : 0;
    const severityCounts = { Critical: 0, High: 0, Medium: 0, Low: 0, Negligible: 0, Unknown: 0 };
    if (grypeData.matches) {
      grypeData.matches.forEach(match => {
        const s = match.vulnerability.severity;
        if (severityCounts[s] !== undefined) severityCounts[s]++;
        else severityCounts.Unknown++;
      });
    }
    const reportFilename = `report-${Date.now()}.xlsx`;
    const reportPath = path.join('uploads', reportFilename);
    await createExcelReport(packages, grypeData, reportPath);
    res.json({
      summary: { totalPackages, totalVulnerabilities: vulnerabilities, severityCounts },
      excelReport: `/reports/${reportFilename}`
    });
  } catch (err) {
    res.status(500).json({ error: 'Report generation failed' });
  }
}

// 2. Multi-Format Evidence Verification (Logs, Retention, NTP, SSDLC)
app.post('/api/verify-evidence', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).send('No file uploaded.');
  const { type } = req.body;
  const filePath = req.file.path;
  const isPdf = req.file.mimetype === 'application/pdf' || filePath.toLowerCase().endsWith('.pdf');
  
  try {
    let text = '';
    if (isPdf) {
      const dataBuffer = fs.readFileSync(filePath);
      const parser = new PDFParse({ data: dataBuffer });
      const pdfData = await parser.getText();
      text = pdfData.text;
    } else {
      text = await tesseract.recognize(filePath, tesseractConfig);
    }

    const result = { success: false, message: '', findings: [] };

    if (type === 'logs') {
      const keywords = ['access', 'monitor', 'error'];
      const found = keywords.filter(k => text.toLowerCase().includes(k));
      result.success = found.length > 0;
      result.message = result.success ? `Verified ${found.join(', ')} log availability.` : 'No standard log patterns found.';
      result.findings = found;
    } else if (type === 'retention') {
      result.success = text.toLowerCase().includes('rotate 180');
      result.message = result.success ? 'Confirmed "rotate 180" archival setting.' : 'Could not find 180-day rotation requirement.';
    } else if (type === 'ntp') {
      const hosts = ['samay1.nic.in', 'samay2.nic.in', 'time.nplindia.org'];
      const found = hosts.filter(h => text.toLowerCase().includes(h.toLowerCase()));
      result.success = found.length > 0;
      result.message = result.success ? `Verified NTP sync with: ${found.join(', ')}` : 'No valid NTP hostnames identified.';
      result.findings = found;
    } else if (type === 'ssdlc') {
      const keywords = ['ssdlc', 'security', 'lifecycle', 'vulnerability', 'testing'];
      const found = keywords.filter(k => text.toLowerCase().includes(k));
      result.success = found.length >= 2;
      result.message = result.success ? 'Evidence verified as SSDLC compliant.' : 'Evidence lacks sufficient SSDLC compliance markers.';
      result.findings = found;
    }

    res.json({ text, ...result });
  } catch (err) {
    console.error(`Verification Error: ${err}`);
    res.status(500).json({ error: 'Processing failed', details: err.message });
  }
});

app.use('/reports', express.static('uploads'));
app.listen(port, () => console.log(`Server running at http://localhost:${port}`));
