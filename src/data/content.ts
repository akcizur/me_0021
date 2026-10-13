import rawContent from './content.json';

export interface ContentSection {
  number: string;
  title: string;
  description: string;
}

export interface SiteContent {
  meta: { title: string; contentVersion: string };
  nav: {
    ariaLabel: string;
    brand: string;
    links: { landing: string; gradient: string; fade: string };
  };
  hero: {
    eyebrow: string;
    title: { line1: string; line2: string; line3: string };
    description: string;
  };
  sections: { blur: ContentSection; gradient: ContentSection; fade: ContentSection };
  card: { label: string; value: string };
  footer: { primary: string; secondary: string };
}

const content: SiteContent = rawContent;
export default content;
