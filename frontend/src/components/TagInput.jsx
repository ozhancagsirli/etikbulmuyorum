import { useState } from 'react';

export default function TagInput({ tags, onChange }) {
  const [input, setInput] = useState('');

  function addTag(raw) {
    const tag = raw.replace(/^#+/, '').trim().toLowerCase().replace(/\s+/g, '');
    if (!tag || tags.includes(tag) || tags.length >= 5) return;
    onChange([...tags, tag]);
  }

  function handleKey(e) {
    if (e.key === 'Enter' || e.key === ',' || e.key === ' ') {
      e.preventDefault();
      addTag(input);
      setInput('');
    } else if (e.key === 'Backspace' && !input && tags.length > 0) {
      onChange(tags.slice(0, -1));
    }
  }

  function removeTag(tag) {
    onChange(tags.filter(t => t !== tag));
  }

  return (
    <div>
      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: 6, padding: '8px 10px',
        border: '1.5px solid #e0e0e0', borderRadius: 8, background: 'white',
        minHeight: 44, alignItems: 'center', cursor: 'text',
      }}
        onClick={() => document.getElementById('tag-input').focus()}
      >
        {tags.map(tag => (
          <span key={tag} style={{
            display: 'flex', alignItems: 'center', gap: 4,
            background: '#e8f4fd', color: '#378ADD', fontSize: 13,
            padding: '3px 10px', borderRadius: 20, fontWeight: 500,
          }}>
            #{tag}
            <button type="button" onClick={() => removeTag(tag)} style={{
              background: 'none', border: 'none', color: '#378ADD',
              cursor: 'pointer', fontSize: 15, lineHeight: 1, padding: 0, marginLeft: 2,
            }}>×</button>
          </span>
        ))}
        <input
          id="tag-input"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
          onBlur={() => { if (input) { addTag(input); setInput(''); } }}
          placeholder={tags.length === 0 ? 'Etiket ekle (ör: işyeri, haksızlık)' : tags.length < 5 ? '+ etiket' : ''}
          disabled={tags.length >= 5}
          style={{
            border: 'none', outline: 'none', fontSize: 13, background: 'transparent',
            flex: 1, minWidth: 100, color: '#333',
          }}
        />
      </div>
      <div style={{ fontSize: 11, color: '#aaa', marginTop: 4 }}>
        Enter veya virgül ile ekle · Max 5 etiket · {tags.length}/5
      </div>
    </div>
  );
}
