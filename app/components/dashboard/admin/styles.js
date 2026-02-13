export const glassStyle = {
    background: 'linear-gradient(145deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.015) 100%)',
    backdropFilter: 'blur(22px)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '16px',
    overflow: 'hidden',
    boxShadow: '0 14px 32px rgba(0,0,0,0.3)'
};

export const statCardStyle = {
    ...glassStyle,
    padding: '20px',
    background: 'linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.01) 100%)',
    border: '1px solid rgba(255,255,255,0.06)',
    boxShadow: '0 12px 24px rgba(0,0,0,0.28)'
};

export const thStyle = {
    padding: '14px 16px',
    fontSize: '9px',
    letterSpacing: '2px',
    color: '#444',
    fontWeight: '900',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    background: 'rgba(255,255,255,0.03)',
    textTransform: 'uppercase'
};

export const tdStyle = {
    padding: '12px 16px',
    fontSize: '11px',
    color: '#888',
    borderBottom: '1px solid rgba(255,255,255,0.02)',
    fontWeight: '700'
};

export const btnStyle = {
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(255,255,255,0.05)',
    color: '#666',
    padding: '7px 12px',
    fontSize: '9px',
    cursor: 'pointer',
    fontWeight: '900',
    letterSpacing: '2px',
    textDecoration: 'none',
    borderRadius: '10px',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px'
};

export const inputStyle = {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    color: '#fff',
    padding: '9px 12px',
    borderRadius: '10px',
    fontSize: '11px',
    width: '100%',
    outline: 'none',
    transition: 'border-color 0.2s'
};
