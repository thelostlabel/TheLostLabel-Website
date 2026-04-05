import { EmailBlock } from './types';

/** Convert blocks to responsive HTML email */
export function blocksToHtml(blocks: EmailBlock[], footerText?: string): string {
  const rows = blocks.map(renderBlock).join('\n');

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Email</title>
</head>
<body style="margin:0;padding:0;background-color:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f3f4f6;">
<tr><td align="center" style="padding:32px 16px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
${rows}
</table>
${footerText ? `<p style="text-align:center;font-size:12px;color:#9ca3af;margin-top:24px;">${footerText}</p>` : ''}
</td></tr>
</table>
</body>
</html>`;
}

function renderBlock(block: EmailBlock): string {
  const d = block.data;

  switch (block.type) {
    case 'header':
      return `<tr><td style="background-color:${d.bgColor || '#111111'};padding:36px 32px;text-align:center;">
${d.logoUrl ? `<img src="${d.logoUrl}" alt="Logo" style="max-height:48px;margin-bottom:16px;" />` : ''}
<h1 style="margin:0;font-size:22px;font-weight:800;letter-spacing:0.08em;color:${d.textColor || '#ffffff'};">${d.title || ''}</h1>
${d.subtitle ? `<p style="margin:8px 0 0;font-size:13px;color:${d.textColor || '#ffffff'};opacity:0.7;">${d.subtitle}</p>` : ''}
</td></tr>`;

    case 'text':
      return `<tr><td style="padding:20px 32px;text-align:${d.align || 'left'};">
<p style="margin:0;font-size:${d.fontSize || '15'}px;line-height:1.7;color:#374151;">${(d.content || '').replace(/\n/g, '<br>')}</p>
</td></tr>`;

    case 'button':
      return `<tr><td style="padding:12px 32px;text-align:${d.align || 'center'};">
<a href="${d.url || '#'}" style="display:inline-block;padding:14px 32px;background-color:${d.bgColor || '#111111'};color:${d.textColor || '#ffffff'};text-decoration:none;font-size:13px;font-weight:700;letter-spacing:0.06em;border-radius:8px;">${d.text || 'Click Here'}</a>
</td></tr>`;

    case 'image':
      return `<tr><td style="padding:16px 32px;text-align:center;">
<img src="${d.src || ''}" alt="${d.alt || ''}" style="max-width:${d.width || '100'}%;height:auto;border-radius:8px;" />
</td></tr>`;

    case 'divider':
      return `<tr><td style="padding:8px 32px;">
<hr style="border:none;border-top:1px solid #e5e7eb;margin:0;" />
</td></tr>`;

    case 'spacer':
      return `<tr><td style="height:${d.height || '24'}px;"></td></tr>`;

    case 'columns':
      return `<tr><td style="padding:16px 32px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
<tr>
<td width="48%" style="vertical-align:top;font-size:14px;line-height:1.6;color:#374151;">${(d.left || '').replace(/\n/g, '<br>')}</td>
<td width="4%"></td>
<td width="48%" style="vertical-align:top;font-size:14px;line-height:1.6;color:#374151;">${(d.right || '').replace(/\n/g, '<br>')}</td>
</tr>
</table>
</td></tr>`;

    case 'social': {
      const links: string[] = [];
      if (d.spotify) links.push(`<a href="${d.spotify}" style="display:inline-block;margin:0 8px;color:#374151;text-decoration:none;font-size:13px;font-weight:600;">Spotify</a>`);
      if (d.instagram) links.push(`<a href="${d.instagram}" style="display:inline-block;margin:0 8px;color:#374151;text-decoration:none;font-size:13px;font-weight:600;">Instagram</a>`);
      if (d.twitter) links.push(`<a href="${d.twitter}" style="display:inline-block;margin:0 8px;color:#374151;text-decoration:none;font-size:13px;font-weight:600;">Twitter/X</a>`);
      if (d.youtube) links.push(`<a href="${d.youtube}" style="display:inline-block;margin:0 8px;color:#374151;text-decoration:none;font-size:13px;font-weight:600;">YouTube</a>`);
      if (d.website) links.push(`<a href="${d.website}" style="display:inline-block;margin:0 8px;color:#374151;text-decoration:none;font-size:13px;font-weight:600;">Website</a>`);
      if (links.length === 0) return '';
      return `<tr><td style="padding:16px 32px;text-align:${d.align || 'center'};">
${links.join('\n')}
</td></tr>`;
    }

    case 'footer':
      return `<tr><td style="background-color:${d.bgColor || '#f9fafb'};padding:24px 32px;text-align:center;">
<p style="margin:0;font-size:12px;line-height:1.6;color:${d.textColor || '#6b7280'};">${(d.text || '').replace(/\n/g, '<br>')}</p>
</td></tr>`;

    case 'quote':
      return `<tr><td style="padding:16px 32px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
<tr>
<td style="width:4px;background-color:${d.borderColor || '#111111'};border-radius:2px;"></td>
<td style="padding:12px 20px;">
<p style="margin:0;font-size:15px;line-height:1.7;color:#374151;font-style:italic;">${(d.content || '').replace(/\n/g, '<br>')}</p>
${d.author ? `<p style="margin:8px 0 0;font-size:12px;color:#9ca3af;font-weight:600;">&mdash; ${d.author}</p>` : ''}
</td>
</tr>
</table>
</td></tr>`;

    case 'list': {
      const items = (d.items || '').split('\n').filter(Boolean);
      const style = d.style || 'bullet';
      const listItems = items.map((item, i) => {
        const marker =
          style === 'number' ? `${i + 1}.` :
          style === 'check' ? '&#10003;' :
          '&#8226;';
        return `<tr><td style="padding:3px 0;font-size:14px;line-height:1.6;color:#374151;">
<span style="display:inline-block;width:24px;color:#9ca3af;font-weight:600;">${marker}</span>${item}
</td></tr>`;
      }).join('\n');
      return `<tr><td style="padding:12px 32px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
${listItems}
</table>
</td></tr>`;
    }

    default:
      return '';
  }
}

/** Replace {{variables}} with values */
export function renderWithVariables(html: string, variables: Record<string, string>): string {
  let result = html;
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
  }
  return result;
}

/** Extract {{variable}} names from blocks */
export function extractVariables(blocks: EmailBlock[]): string[] {
  const vars = new Set<string>();
  for (const block of blocks) {
    for (const value of Object.values(block.data)) {
      const matches = value.matchAll(/\{\{(\w+)\}\}/g);
      for (const match of matches) {
        vars.add(match[1]);
      }
    }
  }
  return Array.from(vars).sort();
}
