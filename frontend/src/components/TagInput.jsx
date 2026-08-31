import { useState } from 'react';

export default function TagInput({ value = [], onChange }) {
  const [input, setInput] = useState('');

  function add(e) {
    if ((e.key === 'Enter' || e.key === ',') && input.trim()) {
      e.preventDefault();
      const tag = input.trim().replace(/^#/, '');
      if (tag && !(value || []).includes(tag)) {
        onChange([...(value || []), tag]);
      }
      setInput('');
    }
  }

  function remove(tag) {
    onChange((value || []).filter(t => t !== tag));
  }

  return (
    <div style={{ border: '1.5px solid #e5e7eb', borderRadius: 8, padding: '8px 12px', background: 'white', display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
      {(value || []).map(tag => (
        <span key={tag} style={{ background: '#f0fdf4', color: '#16a34a', padding: '2px 10px', borderRadius: 20, fontSize: 12, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4 }}>
          #{tag}
          <button onClick={() => remove(tag)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#16a34a', fontSize: 14, lineHeight: 1 }}>×</button>
        </span>
      ))}
      <input
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={add}
        placeholder={(value || []).length === 0 ? 'Etiket ekle (Enter ile)' : ''}
        style={{ border: 'none', outline: 'none', fontSize: 13, flex: 1, minWidth: 100, fontFamily: 'inherit' }}
      />
    </div>
  );
}
