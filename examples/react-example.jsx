// Example React component using the ecoinvent-interface package

import React, { useState, useEffect } from 'react';
import { Settings, EcoinventRelease, ReleaseType } from 'ecoinvent-interface';

function EcoinventBrowser() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [versions, setVersions] = useState([]);
  const [selectedVersion, setSelectedVersion] = useState('');
  const [systemModels, setSystemModels] = useState([]);
  const [selectedSystemModel, setSelectedSystemModel] = useState('');
  const [reports, setReports] = useState([]);
  const [extraFiles, setExtraFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  // Create ecoinvent instance
  const [ecoinvent, setEcoinvent] = useState(null);
  
  // Handle login
  const handleLogin = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Create settings with credentials
      const settings = new Settings({
        username,
        password,
      });
      
      // Create EcoinventRelease instance
      const ei = new EcoinventRelease(settings);
      setEcoinvent(ei);
      
      // Login
      await ei.login();
      setIsLoggedIn(true);
      
      // Load versions
      const versionList = await ei.listVersions();
      setVersions(versionList);
      
      // Load reports
      const reportList = await ei.listReportFiles();
      setReports(Object.keys(reportList));
    } catch (error) {
      setError(`Login failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Handle version selection
  const handleVersionChange = async (event) => {
    const version = event.target.value;
    setSelectedVersion(version);
    setLoading(true);
    
    try {
      // Load system models for selected version
      const modelList = await ecoinvent.listSystemModels(version);
      setSystemModels(modelList);
      
      // Load extra files for selected version
      const extraList = await ecoinvent.listExtraFiles(version);
      setExtraFiles(Object.keys(extraList));
    } catch (error) {
      setError(`Failed to load data for version ${version}: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Handle system model selection
  const handleSystemModelChange = (event) => {
    setSelectedSystemModel(event.target.value);
  };
  
  // Download a report
  const downloadReport = async (reportName) => {
    setLoading(true);
    
    try {
      const path = await ecoinvent.getReport(reportName);
      alert(`Report downloaded to: ${path}`);
    } catch (error) {
      setError(`Failed to download report: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Download an extra file
  const downloadExtraFile = async (fileName) => {
    setLoading(true);
    
    try {
      const path = await ecoinvent.getExtra(selectedVersion, fileName);
      alert(`Extra file downloaded to: ${path}`);
    } catch (error) {
      setError(`Failed to download extra file: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Download a release file
  const downloadRelease = async () => {
    if (!selectedVersion || !selectedSystemModel) {
      setError('Please select a version and system model');
      return;
    }
    
    setLoading(true);
    
    try {
      const path = await ecoinvent.getRelease(
        selectedVersion,
        selectedSystemModel,
        ReleaseType.ECOSPOLD
      );
      alert(`Release file downloaded to: ${path}`);
    } catch (error) {
      setError(`Failed to download release: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="ecoinvent-browser">
      <h1>Ecoinvent Browser</h1>
      
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
      
      {loading && (
        <div className="loading-indicator">
          Loading...
        </div>
      )}
      
      {!isLoggedIn ? (
        <div className="login-form">
          <h2>Login</h2>
          <div>
            <label>
              Username:
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </label>
          </div>
          <div>
            <label>
              Password:
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>
          </div>
          <button onClick={handleLogin} disabled={loading}>
            Login
          </button>
        </div>
      ) : (
        <div className="browser-content">
          <h2>Browse Ecoinvent Data</h2>
          
          <div className="section">
            <h3>Versions</h3>
            <select value={selectedVersion} onChange={handleVersionChange}>
              <option value="">Select a version</option>
              {versions.map((version) => (
                <option key={version} value={version}>
                  {version}
                </option>
              ))}
            </select>
          </div>
          
          {selectedVersion && (
            <div className="section">
              <h3>System Models</h3>
              <select value={selectedSystemModel} onChange={handleSystemModelChange}>
                <option value="">Select a system model</option>
                {systemModels.map((model) => (
                  <option key={model} value={model}>
                    {model}
                  </option>
                ))}
              </select>
              
              {selectedSystemModel && (
                <div>
                  <button onClick={downloadRelease} disabled={loading}>
                    Download Release
                  </button>
                </div>
              )}
            </div>
          )}
          
          <div className="section">
            <h3>Reports</h3>
            <ul>
              {reports.map((report) => (
                <li key={report}>
                  {report}
                  <button onClick={() => downloadReport(report)} disabled={loading}>
                    Download
                  </button>
                </li>
              ))}
            </ul>
          </div>
          
          {selectedVersion && (
            <div className="section">
              <h3>Extra Files for {selectedVersion}</h3>
              <ul>
                {extraFiles.map((file) => (
                  <li key={file}>
                    {file}
                    <button onClick={() => downloadExtraFile(file)} disabled={loading}>
                      Download
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default EcoinventBrowser;
