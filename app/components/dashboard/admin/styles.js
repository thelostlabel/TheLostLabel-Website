export const glassStyle = {
    background: '#0E0E0E', // Neutral Deep Grey
    border: '1px solid var(--border)',
    borderRadius: '4px',
    overflow: 'hidden'
};

export const statCardStyle = {
    ...glassStyle,
    padding: '20px',
};

export const thStyle = {
    padding: '16px',
    fontSize: '9px',
    letterSpacing: '2px',
    color: '#444',
    fontWeight: '900',
    borderBottom: '1px solid rgba(255,255,255,0.05)',
    background: '#0E0E0E',
    textTransform: 'uppercase'
};

export const tdStyle = {
    padding: '16px',
    fontSize: '11px',
    color: '#888',
    borderBottom: '1px solid rgba(255,255,255,0.02)',
    fontWeight: '700'
};

export const btnStyle = {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid var(--border)',
    color: '#fff',
    padding: '8px 14px',
    fontSize: '9px',
    cursor: 'pointer',
    fontWeight: '900',
    letterSpacing: '2px',
    textDecoration: 'none',
    borderRadius: '2px',
    transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px'
};

export const inputStyle = {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid var(--border)',
    color: '#fff',
    padding: '10px 14px',
    borderRadius: '2px',
    fontSize: '11px',
    width: '100%',
    outline: 'none',
    transition: 'border-color 0.2s'
};
