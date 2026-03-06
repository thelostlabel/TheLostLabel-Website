/* ── Unified Glass Theme for Dashboard ── */

export const glassStyle = {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '16px',
    overflow: 'hidden',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    boxShadow: '0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)'
};

export const glassCardStyle = {
    ...glassStyle,
    padding: '24px',
    position: 'relative',
};

export const statCardStyle = {
    ...glassStyle,
    padding: '24px',
    position: 'relative',
};

export const glassSectionStyle = {
    ...glassStyle,
    padding: '32px',
    position: 'relative',
};

export const thStyle = {
    padding: '14px 16px',
    fontSize: '10px',
    letterSpacing: '1.5px',
    color: 'rgba(255,255,255,0.35)',
    fontWeight: '800',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    background: 'rgba(255,255,255,0.02)',
    textTransform: 'uppercase'
};

export const tdStyle = {
    padding: '14px 16px',
    fontSize: '12px',
    color: '#D1D5DB',
    borderBottom: '1px solid rgba(255,255,255,0.04)',
    fontWeight: '600'
};

export const btnStyle = {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    color: '#fff',
    padding: '10px 18px',
    fontSize: '10px',
    cursor: 'pointer',
    fontWeight: '800',
    letterSpacing: '1.5px',
    textDecoration: 'none',
    borderRadius: '12px',
    transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
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
    padding: '12px 16px',
    borderRadius: '12px',
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
    padding: '32px',
    maxWidth: '600px',
    width: '90%',
    maxHeight: '85vh',
    overflowY: 'auto',
};

export const tableContainerStyle = {
    ...glassStyle,
    padding: 0,
};
