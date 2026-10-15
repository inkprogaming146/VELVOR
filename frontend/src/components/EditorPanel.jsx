import { useEffect, useState } from 'react';
import axios from 'axios';

export default function EditorPanel({ filePath, onFileSelect, mode }) {
  const [projectFiles, setProjectFiles] = useState([]);
  const [content, setContent] = useState('');
  const [currentPath, setCurrentPath] = useState(filePath || 'README.md');

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

  return (
    <section className="editor-shell">
      <div className="file-toolbar">
        <strong>{currentPath}</strong>
        <button className="primary-btn" onClick={save}>Save</button>
      </div>

      <div className="file-list">
        {projectFiles.map((path) => (
          <button key={path} className="file-chip" onClick={() => {
            onFileSelect(path);
            loadFile(path);
          }}>
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
