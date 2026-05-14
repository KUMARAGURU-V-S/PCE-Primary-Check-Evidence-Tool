import React, { useState, useRef } from 'react';
import './App.css';

interface SeverityCounts {
  Critical: number; High: number; Medium: number; Low: number; Negligible: number; Unknown: number;
}

interface SbomResult {
  type: 'sbom';
  summary: { totalPackages: number; totalVulnerabilities: number; severityCounts: SeverityCounts; };
  excelReport: string;
}

interface VerificationResult {
  type: 'verification';
  success: boolean;
  message: string;
  findings?: string[];
  text?: string;
}

type Result = SbomResult | VerificationResult;

const App: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currentType, setCurrentType] = useState<string>('sbom');

  const evidenceTypes = [
    { id: 'sbom', label: 'SBOM Analysis', description: 'Deep security scan of software bills', icon: '🛡️', accept: '.json' },
    { id: 'logs', label: 'Audit Logs', description: 'Integrity check for system events', icon: '📝', accept: 'image/*,.pdf' },
    { id: 'retention', label: 'Retention Policy', description: '180-day archival verification', icon: '📁', accept: 'image/*,.pdf' },
    { id: 'ntp', label: 'Time Sync', description: 'NTP drift and stratum analysis', icon: '🕒', accept: 'image/*,.pdf' },
    { id: 'ssdlc', label: 'SSDLC Audit', description: 'Development lifecycle compliance', icon: '📄', accept: 'image/*,.pdf' },
  ];

  const handleBoxClick = (id: string) => {
    setCurrentType(id);
    fileInputRef.current?.click();
  };

  const uploadFile = async (file: File) => {
    setLoading(true);
    setResult(null);
    setError(null);
    const formData = new FormData();

    let endpoint = '';
    if (currentType === 'sbom') {
      formData.append('sbom', file);
      endpoint = 'analyze-sbom';
    } else {
      formData.append('file', file);
      formData.append('type', currentType);
      endpoint = 'verify-evidence';
    }

    try {
      const response = await fetch(`http://localhost:3001/api/${endpoint}`, {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) throw new Error('Analysis failed.');
      const data = await response.json();
      setResult({ ...data, type: currentType === 'sbom' ? 'sbom' : 'verification' });
    } catch (err: any) {
      setError(err.message || 'An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <header className="header">
        <div className="header-left">
          <h1>Evidence Automator</h1>
          <p>Automated security verification & compliance dashboard</p>
        </div>
        <div className="header-right">
          <span className="badge">SYSTEM v1.2.0 • ONLINE</span>
        </div>
      </header>
      
      <div className="drop-zones-grid">
        {evidenceTypes.map((type) => (
          <div
            key={type.id}
            className={`drop-zone ${currentType === type.id ? 'active' : ''}`}
            onClick={() => handleBoxClick(type.id)}
          >
            <div className="icon-box">{type.icon}</div>
            <div className="zone-info">
              <h3>{type.label}</h3>
              <p>{type.description}</p>
            </div>
          </div>
        ))}
      </div>

      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        accept={evidenceTypes.find(t => t.id === currentType)?.accept}
        onChange={(e) => e.target.files?.[0] && uploadFile(e.target.files[0])}
      />

      {loading && (
        <div className="loading-screen">
          <div className="spinner"></div>
          <p style={{ fontWeight: 700, letterSpacing: '0.1em', color: 'var(--primary)' }}>INITIALIZING SECURITY SCAN</p>
        </div>
      )}
      
      {error && <div style={{ color: 'var(--danger)', textAlign: 'center', marginBottom: '40px', fontWeight: 600 }}>Error: {error}</div>}

      {result && result.type === 'sbom' && (
        <div className="results-wrapper">
          <div className="results-card">
            <div className="dashboard-layout">
              <aside className="stats-panel">
                <div className="stat-item">
                  <label>Total Artifacts</label>
                  <div className="val">{(result as SbomResult).summary.totalPackages.toLocaleString()}</div>
                </div>
                <div className="stat-item">
                  <label>Vulnerabilities</label>
                  <div className="val" style={{ color: (result as SbomResult).summary.totalVulnerabilities > 0 ? 'var(--danger)' : 'var(--success)' }}>
                    {(result as SbomResult).summary.totalVulnerabilities}
                  </div>
                </div>
              </aside>
              <main className="severity-panel">
                <h3 className="severity-title">Security Posture Breakdown</h3>
                <div className="severity-grid">
                  {Object.entries((result as SbomResult).summary.severityCounts).map(([severity, count]) => (
                    <div key={severity} className={`v-card ${severity}`}>
                      <span className="num">{count}</span>
                      <span className="lbl">{severity}</span>
                    </div>
                  ))}
                </div>
                <div className="action-bar">
                  <a href={`http://localhost:3001${(result as SbomResult).excelReport}`} className="btn-primary" download>
                    Generate Detailed Security Audit (.xlsx)
                  </a>
                </div>
              </main>
            </div>
          </div>
        </div>
      )}

      {result && result.type === 'verification' && (
        <div className="results-wrapper">
          <div className="results-card">
            <div className="results-header" style={{ marginBottom: '30px' }}>
              <h2 style={{ color: (result as VerificationResult).success ? 'var(--success)' : 'var(--danger)' }}>
                {(result as VerificationResult).success ? '✅ Verification Successful' : '❌ Verification Failed'}
              </h2>
            </div>
            <p style={{ fontSize: '1.25rem', marginBottom: '20px' }}>{(result as VerificationResult).message}</p>
            {(result as VerificationResult).findings && (result as VerificationResult).findings!.length > 0 && (
              <div className="stat-item" style={{ marginTop: '20px' }}>
                <label>Evidence Findings</label>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '10px' }}>
                  {(result as VerificationResult).findings!.map(f => (
                    <span key={f} className="badge" style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)' }}>{f}</span>
                  ))}
                </div>
              </div>
            )}
            {(result as VerificationResult).text && (
              <div className="stat-item" style={{ marginTop: '30px', background: 'rgba(0,0,0,0.2)' }}>
                <label>Extracted Evidence Text</label>
                <pre style={{ whiteSpace: 'pre-wrap', fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '10px', maxHeight: '200px', overflow: 'auto' }}>
                  {(result as VerificationResult).text}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
