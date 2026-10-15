import { useState } from 'react';
import axios from 'axios';

export default function ToolsPanel({ onClose, onSelectFile }) {
  const [name, setName] = useState('Weather Tool');
  const [description, setDescription] = useState('Python helper script');
  const [code, setCode] = useState('print("Tool created by VELVOR")');
  const [tools, setTools] = useState([]);

  const refresh = async () => {
    const { data } = await axios.get('/api/tools');
    setTools(data);
  };

  useState(() => { refresh(); });

  const createTool = async () => {
    const form = new FormData();
    form.append('name', name);
    form.append('description', description);
    form.append('code', code);
    const { data } = await axios.post('/api/tools', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    setName('');
    setDescription('');
    setCode('print("Tool created by VELVOR")');
    onSelectFile(data.file_path);
    refresh();
  };

  const runTool = async (id) => {
    const { data } = await axios.post(`/api/tools/${id}/run`);
    alert(data.stdout || data.stderr || 'Tool ran');
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="tools-panel" onClick={(e) => e.stopPropagation()}>
        <h3>Tools</h3>

        <div className="field">
          <label>Tool name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} />
        </div>

        <div className="field">
          <label>Tool description</label>
          <input value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>

        <div className="field">
          <label>Python code</label>
          <textarea rows={8} value={code} onChange={(e) => setCode(e.target.value)} />
        </div>

        <div className="row-actions">
          <button className="secondary-btn" onClick={onClose}>Close</button>
          <button className="primary-btn" onClick={createTool}>Save Tool</button>
        </div>

        <div className="tool-list">
          {tools.map((tool) => (
            <div key={tool.id} className="tool-item">
              <div>
                <strong>{tool.name}</strong>
                <div style={{ color: 'var(--muted)' }}>{tool.description || 'No description'}</div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="secondary-btn" onClick={() => onSelectFile(tool.file_path)}>Open</button>
                <button className="primary-btn" onClick={() => runTool(tool.id)}>Run</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
