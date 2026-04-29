// components/FileItem.jsx
import React, { useState } from 'react';
import axios from 'axios';

export default function FileItem({ file }) {
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState(null);

  async function summarizeExisting() {
    setLoading(true);
    try {
      const resp = await axios.post(`/api/ai/features/summarize/${file._id}`, { instruction: '' });
      if (resp.data.success) setSummary(resp.data.summary);
      else alert('Summarize error: ' + (resp.data.message || 'Unknown'));
    } catch (err) {
      alert('Request failed');
      console.error(err);
    } finally { setLoading(false); }
  }

  return (
    <div className="file-item">
      <div>{file.filename}</div>
      <button onClick={summarizeExisting} disabled={loading}>
        {loading ? 'Summarizing...' : 'Summarize'}
      </button>

      {summary && (
        <div className="summary-box">
          <h4>Summary</h4>
          <pre style={{ whiteSpace: 'pre-wrap' }}>{summary}</pre>
        </div>
      )}
    </div>
  );
}
