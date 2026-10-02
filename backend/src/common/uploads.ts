import * as path from 'path';

// Tipuri de fisiere acceptate la incarcare (documente de proiect si atasamente de chat).
// Lipsesc intentionat executabilele si scripturile de sistem (.exe, .bat, .msi, .sh etc.), care ar pune
// in pericol calculatorul celui care descarca. Fisierele se servesc mereu ca descarcare, nu se deschid in pagina
// (in afara de imaginile raster), deci HTML/JS/SVG nu pot rula in browser.
const ALLOWED_EXTENSIONS = new Set([
  '.pdf', '.doc', '.docx', '.odt', '.rtf', '.txt', '.md', '.csv',
  '.xls', '.xlsx', '.ods', '.ppt', '.pptx', '.odp',
  '.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg',
  '.zip', '.7z', '.rar', '.tar', '.gz',
  '.json', '.xml', '.yml', '.yaml', '.sql', '.html', '.css', '.js', '.ts', '.tsx', '.jsx',
  '.py', '.java', '.c', '.cpp', '.h', '.cs', '.go', '.rs', '.php', '.ipynb',
]);

// Atasamentele din chat (numele fisierelor sunt generate aleator la incarcare)
export const CHAT_UPLOAD_DIR = './uploads/chat';

export const INLINE_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'];

export function isAllowedUpload(file: { originalname: string }): boolean {
  return ALLOWED_EXTENSIONS.has(path.extname(file.originalname || '').toLowerCase());
}
