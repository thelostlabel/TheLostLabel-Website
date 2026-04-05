export type BlockType =
  | 'header'
  | 'text'
  | 'button'
  | 'image'
  | 'divider'
  | 'spacer'
  | 'columns'
  | 'social'
  | 'footer'
  | 'quote'
  | 'list';

export interface EmailBlock {
  id: string;
  type: BlockType;
  data: Record<string, string>;
}

export interface HeaderBlockData {
  logoUrl: string;
  title: string;
  subtitle: string;
  bgColor: string;
  textColor: string;
}

export interface TextBlockData {
  content: string;
  align: 'left' | 'center' | 'right';
  fontSize: string;
}

export interface ButtonBlockData {
  text: string;
  url: string;
  bgColor: string;
  textColor: string;
  align: 'left' | 'center' | 'right';
}

export interface ImageBlockData {
  src: string;
  alt: string;
  width: string;
}

export interface SpacerBlockData {
  height: string;
}

export interface ColumnsBlockData {
  left: string;
  right: string;
}

export interface SocialBlockData {
  spotify: string;
  instagram: string;
  twitter: string;
  youtube: string;
  website: string;
  align: 'left' | 'center' | 'right';
}

export interface FooterBlockData {
  text: string;
  bgColor: string;
  textColor: string;
}

export interface QuoteBlockData {
  content: string;
  author: string;
  borderColor: string;
}

export interface ListBlockData {
  items: string;
  style: 'bullet' | 'number' | 'check';
}

export const BLOCK_DEFAULTS: Record<BlockType, Record<string, string>> = {
  header: {
    logoUrl: '',
    title: '{{brandName}}',
    subtitle: '',
    bgColor: '#111111',
    textColor: '#ffffff',
  },
  text: {
    content: 'Your email content here. Use {{variableName}} for dynamic values.',
    align: 'left',
    fontSize: '15',
  },
  button: {
    text: 'Click Here',
    url: '{{actionUrl}}',
    bgColor: '#111111',
    textColor: '#ffffff',
    align: 'center',
  },
  image: {
    src: '',
    alt: '',
    width: '100',
  },
  divider: {},
  spacer: {
    height: '24',
  },
  columns: {
    left: 'Left column content',
    right: 'Right column content',
  },
  social: {
    spotify: '',
    instagram: '',
    twitter: '',
    youtube: '',
    website: '',
    align: 'center',
  },
  footer: {
    text: '© 2026 {{brandName}}. All rights reserved.\nYou received this email because you are a member of our platform.',
    bgColor: '#f9fafb',
    textColor: '#6b7280',
  },
  quote: {
    content: 'This is a highlighted quote or callout text.',
    author: '',
    borderColor: '#111111',
  },
  list: {
    items: 'First item\nSecond item\nThird item',
    style: 'bullet',
  },
};

export const BLOCK_LABELS: Record<BlockType, string> = {
  header: 'Header',
  text: 'Text',
  button: 'Button',
  image: 'Image',
  divider: 'Divider',
  spacer: 'Spacer',
  columns: '2 Columns',
  social: 'Social Links',
  footer: 'Footer',
  quote: 'Quote',
  list: 'List',
};

export const BLOCK_ICONS: Record<BlockType, string> = {
  header: 'heading',
  text: 'type',
  button: 'mouse-pointer',
  image: 'image',
  divider: 'minus',
  spacer: 'space',
  columns: 'columns',
  social: 'share-2',
  footer: 'align-justify',
  quote: 'quote',
  list: 'list',
};
