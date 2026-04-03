// Shared cinematic auth styles for all auth pages
export const cinematicAuthStyles = `
    .ca-root {
        background: #050507;
        color: #fff;
        min-height: 100vh;
        display: flex;
        position: relative;
        overflow: hidden;
    }
    .ca-centered {
        align-items: center;
        justify-content: center;
        background:
            linear-gradient(180deg, rgba(5,5,7,0.55) 0%, rgba(5,5,7,0.82) 100%),
            url('/lostbanner.png') center center / cover no-repeat;
        background-color: #050507;
    }

    /* ── Film grain ── */
    .ca-root::before {
        content: '';
        position: fixed;
        inset: 0;
        pointer-events: none;
        z-index: 50;
        opacity: 0.035;
        mix-blend-mode: overlay;
        background: url('data:image/svg+xml;utf8,<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" stitchTiles="stitch"/></filter><rect width="100%" height="100%" filter="url(%23n)"/></svg>');
    }

    /* ── Subtle grid ── */
    .ca-grid {
        position: fixed;
        inset: 0;
        pointer-events: none;
        z-index: 0;
        opacity: 0.25;
        background-size: 60px 60px;
        background-image:
            linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px);
        mask-image: radial-gradient(ellipse at center, black 0%, transparent 70%);
        -webkit-mask-image: radial-gradient(ellipse at center, black 0%, transparent 70%);
    }

    /* ── Left branding panel ── */
    .ca-left {
        flex: 1;
        position: relative;
        display: none;
        align-items: center;
        justify-content: center;
        padding: 80px;
        overflow: hidden;
    }
    .ca-left::before {
        content: '';
        position: absolute;
        inset: 0;
        background:
            linear-gradient(180deg, rgba(5,5,7,0.4) 0%, rgba(5,5,7,0.7) 100%),
            url('/banner.png') center center / cover no-repeat;
        transform: scale(1.05);
    }
    .ca-left::after {
        content: '';
        position: absolute;
        inset: 0;
        background: radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.6) 100%);
        z-index: 1;
    }
    .ca-left-content {
        position: relative;
        z-index: 2;
        max-width: 460px;
    }
    .ca-brand-logo {
        display: block;
        width: 220px;
        margin-bottom: 48px;
        opacity: 0.85;
    }
    .ca-headline {
        font-size: clamp(48px, 5vw, 80px);
        font-weight: 900;
        line-height: 0.9;
        letter-spacing: -0.04em;
        margin: 0 0 24px;
        background: linear-gradient(180deg, #ffffff 0%, rgba(255,255,255,0.35) 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
    }
    .ca-tagline {
        font-size: 13px;
        color: rgba(255,255,255,0.35);
        line-height: 1.8;
        max-width: 340px;
        margin: 0 0 40px;
        font-weight: 400;
    }
    .ca-divider {
        width: 40px;
        height: 1px;
        background: rgba(255,255,255,0.1);
        margin-bottom: 20px;
    }
    .ca-footnote {
        font-size: 12px;
        color: rgba(255,255,255,0.25);
        font-weight: 500;
    }
    .ca-footnote a {
        color: rgba(255,255,255,0.7);
        text-decoration: none;
        font-weight: 700;
        transition: color 0.2s;
    }
    .ca-footnote a:hover {
        color: #fff;
    }

    /* ── Feature list ── */
    .ca-features {
        list-style: none;
        padding: 0;
        margin: 0;
        display: flex;
        flex-direction: column;
        gap: 12px;
    }
    .ca-features li {
        display: flex;
        align-items: center;
        gap: 12px;
        font-size: 12px;
        color: rgba(255,255,255,0.45);
        font-weight: 500;
    }
    .ca-check {
        width: 18px;
        height: 18px;
        border-radius: 50%;
        background: rgba(255,255,255,0.06);
        border: 1px solid rgba(255,255,255,0.12);
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        font-size: 9px;
        color: rgba(255,255,255,0.6);
        font-weight: 900;
    }

    /* ── Right form panel ── */
    .ca-right {
        width: 100%;
        max-width: 520px;
        background: rgba(8,8,10,0.75);
        backdrop-filter: blur(40px) saturate(1.3);
        -webkit-backdrop-filter: blur(40px) saturate(1.3);
        border-left: 1px solid rgba(255,255,255,0.04);
        display: flex;
        flex-direction: column;
        justify-content: center;
        padding: 64px 52px;
        position: relative;
        z-index: 10;
    }

    /* ── Center panel (forgot/reset) ── */
    .ca-center {
        position: relative;
        z-index: 10;
        width: 100%;
        max-width: 420px;
        padding: 0 20px;
    }

    /* ── Header ── */
    .ca-header {
        margin-bottom: 40px;
    }
    .ca-back {
        display: inline-block;
        font-size: 9px;
        font-weight: 700;
        letter-spacing: 2px;
        color: rgba(255,255,255,0.2);
        text-decoration: none;
        margin-bottom: 32px;
        transition: color 0.2s;
    }
    .ca-back:hover {
        color: rgba(255,255,255,0.5);
    }
    .ca-header h2 {
        font-size: 28px;
        font-weight: 800;
        letter-spacing: -0.03em;
        margin: 0 0 8px;
        background: linear-gradient(180deg, #ffffff 0%, rgba(255,255,255,0.5) 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
    }
    .ca-header p {
        font-size: 11px;
        font-weight: 500;
        letter-spacing: 0.5px;
        color: rgba(255,255,255,0.25);
        margin: 0;
    }

    /* ── Form ── */
    .ca-form {
        display: flex;
        flex-direction: column;
        gap: 18px;
    }
    .ca-two-col {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 14px;
    }
    .ca-field {
        display: flex;
        flex-direction: column;
        gap: 7px;
    }
    .ca-field label {
        font-size: 9px;
        font-weight: 700;
        letter-spacing: 2px;
        text-transform: uppercase;
        color: rgba(255,255,255,0.3);
    }
    .ca-field input {
        width: 100%;
        padding: 13px 15px;
        background: rgba(255,255,255,0.03);
        border: 1px solid rgba(255,255,255,0.07);
        border-radius: 12px;
        color: #fff;
        font-family: inherit;
        font-size: 14px;
        font-weight: 400;
        outline: none;
        transition: border-color 0.25s, background 0.25s, box-shadow 0.25s;
        box-sizing: border-box;
    }
    .ca-field input::placeholder {
        color: rgba(255,255,255,0.12);
    }
    .ca-field input:hover {
        border-color: rgba(255,255,255,0.12);
        background: rgba(255,255,255,0.05);
    }
    .ca-field input:focus {
        border-color: rgba(255,255,255,0.3);
        background: rgba(255,255,255,0.04);
        box-shadow: 0 0 0 3px rgba(255,255,255,0.04), 0 0 20px rgba(255,255,255,0.02);
    }
    .ca-hint {
        font-size: 9px;
        font-weight: 500;
        color: rgba(255,255,255,0.18);
    }
    .ca-forgot {
        font-size: 9px;
        font-weight: 700;
        color: rgba(255,255,255,0.2);
        text-decoration: none;
        letter-spacing: 1.5px;
        transition: color 0.2s;
    }
    .ca-forgot:hover {
        color: rgba(255,255,255,0.5);
    }

    /* ── Error ── */
    .ca-error {
        padding: 13px 15px;
        background: rgba(255,60,60,0.06);
        border: 1px solid rgba(255,60,60,0.12);
        border-radius: 12px;
        color: rgba(255,120,120,0.9);
        font-size: 12px;
        font-weight: 600;
        display: flex;
        flex-direction: column;
        gap: 8px;
    }
    .ca-error-action {
        background: transparent;
        border: 1px solid rgba(255,120,120,0.2);
        border-radius: 8px;
        padding: 7px 12px;
        color: rgba(255,140,140,0.8);
        font-size: 10px;
        font-weight: 600;
        cursor: pointer;
        font-family: inherit;
        text-align: left;
        transition: background 0.15s;
    }
    .ca-error-action:hover {
        background: rgba(255,120,120,0.06);
    }

    /* ── Submit button ── */
    .ca-submit {
        margin-top: 6px;
        padding: 16px;
        width: 100%;
        border-radius: 14px;
        font-size: 12px;
        font-weight: 700;
        letter-spacing: 1.5px;
        min-height: 52px;
        background: #fff;
        color: #0a0a0a;
        border: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s;
        box-shadow: 0 4px 20px rgba(255,255,255,0.08);
    }
    .ca-submit:hover {
        transform: translateY(-1px);
        box-shadow: 0 8px 30px rgba(255,255,255,0.12);
    }
    .ca-submit:active {
        transform: translateY(0);
    }
    .ca-submit:disabled {
        opacity: 0.5;
        cursor: not-allowed;
        transform: none;
    }

    /* ── Spinner ── */
    .ca-spinner {
        width: 16px;
        height: 16px;
        border: 2px solid rgba(0,0,0,0.15);
        border-top-color: #000;
        border-radius: 50%;
        animation: caSpin 0.7s linear infinite;
        display: inline-block;
    }
    @keyframes caSpin {
        to { transform: rotate(360deg); }
    }

    /* ── Switch link ── */
    .ca-switch {
        margin-top: 24px;
        font-size: 11px;
        color: rgba(255,255,255,0.2);
        font-weight: 500;
        text-align: center;
    }
    .ca-switch a {
        color: rgba(255,255,255,0.6);
        text-decoration: none;
        font-weight: 700;
        transition: color 0.2s;
    }
    .ca-switch a:hover {
        color: #fff;
    }

    /* ── Success card ── */
    .ca-success {
        text-align: center;
        padding: 44px 36px;
        background: rgba(255,255,255,0.02);
        border: 1px solid rgba(255,255,255,0.06);
        border-radius: 20px;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 12px;
    }
    .ca-success-icon {
        width: 48px;
        height: 48px;
        border-radius: 50%;
        background: rgba(255,255,255,0.05);
        border: 1px solid rgba(255,255,255,0.1);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 20px;
        color: rgba(255,255,255,0.7);
        margin-bottom: 4px;
    }
    .ca-success h3 {
        font-size: 15px;
        font-weight: 800;
        letter-spacing: 3px;
        color: rgba(255,255,255,0.8);
        margin: 0;
    }
    .ca-success p {
        font-size: 12px;
        color: rgba(255,255,255,0.35);
        line-height: 1.7;
        margin: 0;
        max-width: 280px;
    }
    .ca-success-btn {
        display: inline-block;
        margin-top: 8px;
        padding: 12px 28px;
        border-radius: 12px;
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 1px;
        background: #fff;
        color: #0a0a0a;
        text-decoration: none;
        transition: transform 0.15s, box-shadow 0.15s;
    }
    .ca-success-btn:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 16px rgba(255,255,255,0.1);
    }

    /* ── Closed/Invalid cards ── */
    .ca-closed {
        position: relative;
        z-index: 10;
        text-align: center;
        padding: 52px 44px;
        background: rgba(255,255,255,0.02);
        border: 1px solid rgba(255,255,255,0.06);
        border-radius: 24px;
        backdrop-filter: blur(20px);
        max-width: 400px;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 10px;
    }
    .ca-closed-icon {
        font-size: 32px;
        margin-bottom: 4px;
        opacity: 0.5;
    }
    .ca-closed h2 {
        font-size: 16px;
        font-weight: 800;
        letter-spacing: 5px;
        color: rgba(255,255,255,0.7);
        margin: 0;
    }
    .ca-closed p {
        font-size: 12px;
        color: rgba(255,255,255,0.35);
        line-height: 1.65;
        margin: 0;
        max-width: 280px;
    }

    @media (min-width: 1024px) {
        .ca-left {
            display: flex !important;
        }
    }
    @media (max-width: 600px) {
        .ca-right {
            padding: 48px 24px;
        }
        .ca-two-col {
            grid-template-columns: 1fr;
        }
    }
`;
