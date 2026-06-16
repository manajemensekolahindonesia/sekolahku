import { marked } from 'marked';
import DOMPurify from 'dompurify';

/**
 * Repairs markdown that has been collapsed into a single line by AI.
 * Adds newlines before headings and list items.
 */
export const repairMarkdown = (text: string | null | undefined): string => {
  if (!text) return '';
  return text
    // Pisahkan semua heading dengan baris baru ganda, bahkan jika tidak ada spasi
    .replace(/(#{1,6})\s*/g, '\n\n$1 ')
    // Pisahkan semua list angka dengan baris baru ganda
    .replace(/(\d+\.)\s*/g, '\n\n$1 ')
    // Pisahkan semua list bullet
    .replace(/-\s+/g, '\n\n- ')
    // Bersihkan multiple newlines berlebih menjadi maksimal 2 newline
    .replace(/\n{3,}/g, '\n\n')
    .trim();
};

/**
 * Parses markdown to HTML and sanitizes it to prevent XSS.
 */
export const parseMarkdown = (markdownText: string | null | undefined): string => {
  if (!markdownText) return '-';
  
  const repairedText = repairMarkdown(markdownText);
  
  try {
    // Parse markdown to HTML
    const rawHtml = marked.parse(repairedText) as string;
    // Sanitize the resulting HTML
    return DOMPurify.sanitize(rawHtml);
  } catch (error) {
    console.error('Error parsing markdown:', error);
    // Fallback to basic sanitization if parsing fails
    return DOMPurify.sanitize(markdownText);
  }
};
