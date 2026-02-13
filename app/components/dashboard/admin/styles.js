export const glassStyle = {
    background: 'linear-gradient(145deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.015) 100%)',
    backdropFilter: 'blur(26px)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '22px',
    overflow: 'hidden',
    boxShadow: '0 20px 50px rgba(0,0,0,0.45)'
};

export const statCardStyle = {
    ...glassStyle,
    padding: '28px',
    background: 'linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.01) 100%)',
    border: '1px solid rgba(255,255,255,0.06)',
    boxShadow: '0 18px 40px rgba(0,0,0,0.35)'
};

export const thStyle = {
    padding: '20px 25px',
    fontSize: '9px',
    letterSpacing: '3px',
    color: '#444',
    fontWeight: '900',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    background: 'rgba(255,255,255,0.03)',
    textTransform: 'uppercase'
};

export const tdStyle = {
    padding: '18px 25px',
    fontSize: '11px',
    color: '#888',
    borderBottom: '1px solid rgba(255,255,255,0.02)',
    fontWeight: '700'
};

export const btnStyle = {
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(255,255,255,0.05)',
    color: '#666',
    padding: '8px 16px',
    fontSize: '9px',
    cursor: 'pointer',
    fontWeight: '900',
    letterSpacing: '2px',
    textDecoration: 'none',
    borderRadius: '12px',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px'
};

export const inputStyle = {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    color: '#fff',
    padding: '10px 15px',
    borderRadius: '12px',
    fontSize: '11px',
    width: '100%',
    outline: 'none',
    transition: 'border-color 0.2s'
};
