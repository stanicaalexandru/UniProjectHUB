// Catalogul erorilor aplicatiei: fiecare eroare are un cod stabil (pe care frontend-ul il poate traduce)
// si un mesaj prietenos in romana. Se folosesc asa: throw new NotFoundException(appError('PROJECT_NOT_FOUND')).
export const ERROR_MESSAGES = {
  // Autentificare si cont
  INVALID_CREDENTIALS: 'Email sau parolă incorectă.',
  ACCOUNT_SUSPENDED: 'Contul tău este suspendat. Contactează un administrator.',
  ACCOUNT_PENDING_APPROVAL: 'Contul tău de profesor așteaptă aprobarea unui administrator. Vei primi un email când este activat.',
  ACCOUNT_LOCKED: 'Prea multe încercări greșite. Poți încerca din nou peste {minutes} minute.',
  EMAIL_NOT_VERIFIED: 'Confirmă-ți adresa de email înainte să te autentifici. Codul a fost trimis pe email.',
  EMAIL_TAKEN: 'Există deja un cont cu acest email. Te poți autentifica sau îți poți reseta parola.',
  EMAIL_INVALID: 'Adresa de email nu este validă.',
  VERIFICATION_CODE_INVALID: 'Codul introdus nu este corect.',
  VERIFICATION_CODE_EXPIRED: 'Codul a expirat sau a fost introdus greșit de prea multe ori. Cere un cod nou.',
  RESET_CODE_INVALID: 'Codul este greșit sau a expirat. Cere un cod nou.',
  SESSION_EXPIRED: 'Sesiunea a expirat. Autentifică-te din nou.',
  LOGIN_STEP_EXPIRED: 'Pasul de autentificare a expirat. Introdu din nou emailul și parola.',
  PIN_INVALID: 'PIN-ul nu este corect.',
  PASSWORD_WRONG: 'Parola curentă nu este corectă.',
  PASSWORD_TOO_SHORT: 'Parola nouă trebuie să aibă cel puțin 8 caractere.',
  UNAUTHENTICATED: 'Trebuie să fii autentificat.',
  OWN_ACCOUNT_ONLY: 'Poți modifica doar propriul cont.',
  LAST_ADMIN: 'Ești singurul administrator. Numește alt administrator înainte să îți ștergi contul.',
  USER_NOT_FOUND: 'Utilizatorul nu există.',
  AVATAR_INVALID_TYPE: 'Poza de profil trebuie să fie o imagine PNG, JPEG, WEBP sau GIF.',
  AVATAR_TOO_LARGE: 'Poza de profil poate avea cel mult 2 MB.',
  // Permisiuni
  FORBIDDEN: 'Nu ai permisiunea pentru această acțiune.',
  PROJECT_FORBIDDEN: 'Rolul tău în acest proiect nu permite această acțiune.',
  // Proiecte, milestone-uri, task-uri
  PROJECT_NOT_FOUND: 'Proiectul nu există sau nu ai acces la el.',
  PROJECT_LOCKED_FOR_TEAM: 'După aprobare, detaliile proiectului pot fi modificate doar de coordonator.',
  PROJECT_STATUS_TEAM_ONLY_PROPOSE: 'Echipa poate doar să trimită proiectul spre aprobare; celelalte statusuri le stabilește coordonatorul.',
  PROJECT_DELETE_DRAFT_ONLY: 'Echipa poate șterge proiectul doar cât timp este ciornă.',
  COORDINATOR_NOT_PROFESSOR: 'Coordonatorul proiectului trebuie să fie un profesor.',
  TEAM_NOT_MEMBER_FOR_PROJECT: 'Poți asocia proiectul doar unei echipe din care faci parte.',
  COMMENT_EMPTY: 'Scrie ceva înainte să trimiți comentariul.',
  MILESTONE_NOT_FOUND: 'Milestone-ul nu există sau a fost șters.',
  MILESTONE_OTHER_PROJECT: 'Milestone-ul ales aparține altui proiect.',
  TASK_NOT_FOUND: 'Task-ul nu există sau a fost șters.',
  ASSIGNEE_NOT_IN_PROJECT: 'Poți atribui task-ul doar unui membru al proiectului.',
  STATUS_INVALID: 'Statusul ales nu este valid.',
  // Documente si fisiere
  DOCUMENT_NOT_FOUND: 'Documentul nu există sau a fost șters.',
  DOCUMENT_DELETE_OWN_ONLY: 'Poți șterge doar documentele încărcate de tine.',
  FILE_NOT_FOUND: 'Fișierul nu mai este disponibil pe server.',
  FILE_TYPE_NOT_ALLOWED: 'Tipul acestui fișier nu este acceptat (de exemplu executabilele). Încearcă PDF, Office, imagini sau o arhivă.',
  PAYLOAD_TOO_LARGE: 'Fișierul sau datele trimise sunt prea mari.',
  // Evaluari
  EVALUATION_NOT_FOUND: 'Evaluarea nu există sau nu ai acces la ea.',
  EVALUATION_PHASE_INVALID: 'Faza evaluării nu este validă.',
  CORRECTION_REASON_REQUIRED: 'Evaluarea este deja finalizată: scrie motivul corecturii (cel puțin 5 caractere).',
  // Echipe
  TEAM_NOT_FOUND: 'Echipa nu există sau a fost ștearsă.',
  TEAM_NAME_REQUIRED: 'Dă un nume echipei.',
  TEAM_FULL: 'Echipa a atins numărul maxim de membri.',
  TEAM_MANAGER_ONLY: 'Doar liderul echipei sau un profesor poate face această modificare.',
  TEAM_MEMBER_NOT_FOUND: 'Această persoană nu face parte din echipă.',
  TEAM_LEADER_CANNOT_LEAVE: 'Liderul nu poate fi scos din echipă.',
  ALREADY_TEAM_MEMBER: 'Faci deja parte din această echipă.',
  JOIN_REQUEST_NOT_FOUND: 'Cererea de înscriere nu mai există.',
  JOIN_REQUEST_ALREADY_HANDLED: 'Cererea a fost deja procesată.',
  INVITE_INVALID: 'Invitația nu mai este valabilă.',
  // Chat
  CHAT_ROOM_NOT_FOUND: 'Conversația nu există sau nu faci parte din ea.',
  CHAT_ROOM_TYPE_INVALID: 'Acest tip de conversație nu este disponibil.',
  MESSAGE_NOT_FOUND: 'Mesajul nu mai există.',
  MESSAGE_EMPTY: 'Scrie un mesaj sau atașează un fișier.',
  MESSAGE_OWN_ONLY: 'Poți modifica doar propriile mesaje.',
  ATTACHMENT_INVALID: 'Atașamentul nu mai este disponibil. Încarcă fișierul din nou.',
  REACTION_INVALID: 'Reacția nu este validă.',
  TOO_MANY_REACTIONS: 'Mesajul are deja prea multe reacții.',
  // Generice (folosite de filtrul global cand eroarea nu are un cod propriu)
  VALIDATION_FAILED: 'Unele câmpuri nu sunt completate corect.',
  BAD_REQUEST: 'Cererea nu este validă.',
  NOT_FOUND: 'Resursa căutată nu există.',
  CONFLICT: 'Există deja o înregistrare cu aceste date.',
  TOO_MANY_REQUESTS: 'Prea multe cereri într-un timp scurt. Așteaptă un minut și încearcă din nou.',
  INTERNAL: 'A apărut o eroare neașteptată. Încearcă din nou în câteva momente.',
} as const;

export type ErrorCode = keyof typeof ERROR_MESSAGES;

export function appError(code: ErrorCode, params?: Record<string, string | number>) {
  const message = ERROR_MESSAGES[code].replace(/\{(\w+)\}/g, (_, k) => String(params?.[k] ?? ''));
  return { code, message, ...(params ? { params } : {}) };
}
