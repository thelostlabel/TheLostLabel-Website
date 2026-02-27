export const glassStyle = {
    background: 'rgba(255,255,255,0.028)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: '12px',
    overflow: 'hidden',
    backdropFilter: 'blur(14px)',
    WebkitBackdropFilter: 'blur(14px)',
    boxShadow: '0 18px 40px rgba(0,0,0,0.36)'
};

export const statCardStyle = {
    ...glassStyle,
    padding: '20px',
};

export const thStyle = {
    padding: '16px',
    fontSize: '10px',
    letterSpacing: '1.2px',
    color: '#9CA3AF',
    fontWeight: '900',
    borderBottom: '1px solid var(--border)',
    background: '#141414',
    textTransform: 'uppercase'
};

export const tdStyle = {
    padding: '16px',
    fontSize: '12px',
    color: '#D1D5DB',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    fontWeight: '700'
};

export const btnStyle = {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid var(--border)',
    color: '#fff',
    padding: '8px 14px',
    fontSize: '11px',
    cursor: 'pointer',
    fontWeight: '900',
    letterSpacing: '1.2px',
    textDecoration: 'none',
    borderRadius: '10px',
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
    borderRadius: '10px',
    fontSize: '12px',
    width: '100%',
    outline: 'none',
    transition: 'border-color 0.2s'
};
