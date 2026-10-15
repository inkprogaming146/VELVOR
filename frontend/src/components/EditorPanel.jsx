import { useEffect, useState } from 'react';
import axios from 'axios';

export default function EditorPanel({ filePath, onFileSelect, mode }) {
  const [projectFiles, setProjectFiles] = useState([]);
  const [content, setContent] = useState('');
  const [currentPath, setCurrentPath] = useState(filePath || 'README.md');
  const [building, setBuilding] = useState(false);

  const loadTree = async () => {
    const { data } = await axios.get('/api/project/tree');
    const files = data.filter((entry) => entry.type === 'file').map((entry) => entry.path);
    setProjectFiles(files.slice(0, 30));
  };

  const loadFile = async (path) => {
    const { data } = await axios.get('/api/file', { params: { path } });
    setCurrentPath(path);
    setContent(data.content);
  };

  useEffect(() => {
    loadTree();
  }, []);

  useEffect(() => {
    if (filePath) {
      loadFile(filePath);
    }
  }, [filePath]);

  const save = async () => {
    await axios.post('/api/file', null, { params: { path: currentPath, content } });
  };

  const buildPreview = async () => {
    setBuilding(true);
    try {
      const { data } = await axios.post('/api/preview/build');
      // open preview in a new tab; add timestamp to bust cache
      window.open(`/preview/?ts=${Date.now()}`, '_blank');
    } catch (err) {
      alert('Preview build failed: ' + (err?.response?.data?.detail || err.message));
    } finally {
      setBuilding(false);
    }
  };

  return (
    <section className="editor-shell">
      <div className="file-toolbar">
        <strong>{currentPath}</strong>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="secondary-btn" onClick={() => loadTree()}>Refresh</button>
          <button className="secondary-btn" onClick={save}>Save</button>
          <button className="primary-btn" onClick={buildPreview} disabled={building}>{building ? 'Building…' : 'Preview'}</button>
        </div>
      </div>

      <div className="file-list">
        {projectFiles.map((path) => (
          <button key={path} className="file-chip" onClick={() => { onFileSelect(path); loadFile(path); }}>
            {path}
          </button>
        ))}
      </div>

      <div className="editor-wrap">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          spellCheck={false}
        />
      </div>
    </section>
  );
}
