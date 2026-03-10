/* ── Unified Glass Theme for Dashboard ── */

export const glassStyle = {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '14px',
    overflow: 'hidden',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    boxShadow: '0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)'
};

export const glassCardStyle = {
    ...glassStyle,
    padding: '20px',
    position: 'relative',
};

export const statCardStyle = {
    ...glassStyle,
    padding: '20px',
    position: 'relative',
};

export const glassSectionStyle = {
    ...glassStyle,
    padding: '24px',
    position: 'relative',
};

export const thStyle = {
    padding: '12px 14px',
    fontSize: '10px',
    letterSpacing: '1.5px',
    color: 'rgba(255,255,255,0.35)',
    fontWeight: '800',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    background: 'rgba(255,255,255,0.02)',
    textTransform: 'uppercase'
};

export const tdStyle = {
    padding: '12px 14px',
    fontSize: '12px',
    color: '#D1D5DB',
    borderBottom: '1px solid rgba(255,255,255,0.04)',
    fontWeight: '600'
};

export const btnStyle = {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    color: '#fff',
    padding: '9px 16px',
    fontSize: '10px',
    cursor: 'pointer',
    fontWeight: '800',
    letterSpacing: '1.5px',
    textDecoration: 'none',
    borderRadius: '10px',
    transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
};

export const btnPrimaryStyle = {
    ...btnStyle,
    background: '#fff',
    color: '#000',
    border: 'none',
    fontWeight: '900',
};

export const inputStyle = {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.08)',
    color: '#fff',
    padding: '11px 14px',
    borderRadius: '10px',
    fontSize: '12px',
    width: '100%',
    outline: 'none',
    transition: 'all 0.2s ease',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
};

export const modalOverlayStyle = {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.8)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    zIndex: 50,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
};

export const modalStyle = {
    ...glassStyle,
    background: 'rgba(15,15,15,0.95)',
    border: '1px solid rgba(255,255,255,0.1)',
    padding: '24px',
    maxWidth: '600px',
    width: '90%',
    maxHeight: '85vh',
    overflowY: 'auto',
};

export const tableContainerStyle = {
    ...glassStyle,
    padding: 0,
};
