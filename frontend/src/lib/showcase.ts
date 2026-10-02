// Demo public (NEXT_PUBLIC_SHOWCASE=true): conturi demo pe pagina de autentificare si avertismente pentru vizitatori
export const SHOWCASE = process.env.NEXT_PUBLIC_SHOWCASE === "true";

export const DEMO_ACCOUNTS = [
  { key: "student", email: "demo.student@example.com", name: "Vlad Stoica" },
  { key: "professor", email: "prof@example.com", name: "Mihai Dobre" },
] as const;
export const DEMO_PASSWORD = "password123";

// Conturile demo sunt comune tuturor vizitatorilor: parola, PIN-ul si stergerea sunt blocate pe server
export const isSharedDemoAccount = (email?: string | null) => SHOWCASE && /@(student\.)?example\.com$/i.test(email ?? "");
