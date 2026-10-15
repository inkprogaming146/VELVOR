export default function SettingsModal({ settings, onClose, onSave }) {
  const [draft, setDraft] = settings || useState({});

  if (!settings) return null;

  const update = (key, value) => setDraft((prev) => ({ ...prev, [key]: value }));

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
        <h3>Settings</h3>

        <div className="field">
          <label>Display name</label>
          <input value={draft.username || ''} onChange={(e) => update('username', e.target.value)} />
        </div>

        <div className="modal-grid">
          <div className="field">
            <label>Theme mode</label>
            <select value={draft.mode || 'dark'} onChange={(e) => update('mode', e.target.value)}>
              <option value="dark">Dark</option>
              <option value="light">Light</option>
            </select>
          </div>
          <div className="field">
            <label>Primary color</label>
            <input type="color" value={draft.primaryColor || '#8b5cf6'} onChange={(e) => update('primaryColor', e.target.value)} />
          </div>
          <div className="field">
            <label>Secondary color</label>
            <input type="color" value={draft.secondaryColor || '#22c55e'} onChange={(e) => update('secondaryColor', e.target.value)} />
          </div>
          <div className="field">
            <label>Accent color</label>
            <input type="color" value={draft.accentColor || '#f59e0b'} onChange={(e) => update('accentColor', e.target.value)} />
          </div>
        </div>

        <div className="row-actions">
          <button className="secondary-btn" onClick={onClose}>Cancel</button>
          <button className="primary-btn" onClick={() => onSave(draft)}>Save</button>
        </div>
      </div>
    </div>
  );
}
