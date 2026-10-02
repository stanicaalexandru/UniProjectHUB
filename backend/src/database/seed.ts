/**
 * Script de populare a bazei de date — versiunea pentru susținere.
 * Contul de pe care se face demo-ul este demo.student@example.com
 * Rulare: npm run seed   (din folderul backend)
 */

import AppDataSource from './data-source';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config();

import { User, UserRole, UserStatus } from '../users/entities/user.entity';
import { Team } from '../teams/entities/team.entity';
import { TeamMember, TeamRole } from '../teams/entities/team-member.entity';
import { Project, ProjectStatus, ProjectType, ProjectPriority } from '../projects/entities/project.entity';
import { Milestone, MilestoneStatus } from '../projects/entities/milestone.entity';
import { Task, TaskStatus, TaskPriority } from '../tasks/entities/task.entity';
import { Evaluation, EvaluationStatus, EvaluationPhase } from '../evaluations/entities/evaluation.entity';
import { EvaluationCriteria } from '../evaluations/entities/evaluation-criteria.entity';
import { Comment } from '../projects/entities/comment.entity';
import { Activity } from '../projects/entities/activity.entity';
import { ChatRoom, RoomType } from '../chat/entities/chat-room.entity';
import { ChatMessage } from '../chat/entities/chat-message.entity';
import { Document, DocumentType } from '../documents/entities/document.entity';
import { DocumentVersion } from '../documents/entities/document-version.entity';
import { Notification, NotificationType } from '../notifications/entities/notification.entity';

// Aceeasi conexiune si aceleasi entitati ca linia de comanda TypeORM (data-source.ts)
const dataSource = AppDataSource;

function daysFromNow(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(10, 0, 0, 0);
  return d;
}

// Mesajele aceleiasi zile primesc minute diferite, ca ordinea din conversatie sa fie cea din scenariu
function messageTime(days: number, minute: number): Date {
  return new Date(daysFromNow(days).getTime() + minute * 60_000);
}

const UPLOAD_DIR = path.resolve(__dirname, '../../uploads');

function writeDummyFile(filename: string, content: string): { filename: string; path: string; size: number } {
  if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}-${filename}`;
  const fullPath = path.join(UPLOAD_DIR, uniqueName);
  fs.writeFileSync(fullPath, content, 'utf-8');
  const size = fs.statSync(fullPath).size;
  return { filename: uniqueName, path: fullPath, size };
}

async function seed() {
  await dataSource.initialize();
  console.log('Conectat la baza de date.');

  console.log('Sterg datele existente...');
  await dataSource.query(`
    TRUNCATE TABLE
      ai_analyses, evaluation_revisions, evaluation_criteria, evaluations, notifications,
      chat_messages, chat_rooms, document_versions, documents,
      comments, activities, tasks, milestones, team_members,
      invitations, team_join_requests, projects, teams, users
    RESTART IDENTITY CASCADE
  `);
  console.log('Baza de date a fost golita.');

  const userRepo = dataSource.getRepository(User);
  const teamRepo = dataSource.getRepository(Team);
  const teamMemberRepo = dataSource.getRepository(TeamMember);
  const projectRepo = dataSource.getRepository(Project);
  const milestoneRepo = dataSource.getRepository(Milestone);
  const taskRepo = dataSource.getRepository(Task);
  const evaluationRepo = dataSource.getRepository(Evaluation);
  const criteriaRepo = dataSource.getRepository(EvaluationCriteria);
  const commentRepo = dataSource.getRepository(Comment);
  const activityRepo = dataSource.getRepository(Activity);
  const roomRepo = dataSource.getRepository(ChatRoom);
  const messageRepo = dataSource.getRepository(ChatMessage);
  const documentRepo = dataSource.getRepository(Document);
  const versionRepo = dataSource.getRepository(DocumentVersion);
  const notificationRepo = dataSource.getRepository(Notification);

  // UTILIZATORI (10)
  console.log('Creez utilizatorii...');

  const mkUser = (data: Partial<User>) => userRepo.create({
    status: UserStatus.ACTIVE,
    password: 'password123',
    notificationPreferences: { push: true, risk: true, chat: true, evals: true, email: false },
    favoriteProjects: [],
    ...data,
  });

  await userRepo.save(mkUser({
    firstName: 'Admin', lastName: 'Sistem', email: 'admin@example.com',
    role: UserRole.ADMIN, faculty: 'ACE', department: 'Administrare',
  }));

  const profMihai = await userRepo.save(mkUser({
    firstName: 'Mihai', lastName: 'Dobre', email: 'prof@example.com',
    role: UserRole.PROFESSOR, faculty: 'ACE', department: 'Calculatoare',
    bio: 'Coordonator de proiecte in domeniul sistemelor distribuite si al aplicatiilor web.',
  }));

  const profElena = await userRepo.save(mkUser({
    firstName: 'Elena', lastName: 'Marinescu', email: 'elena.marinescu@example.com',
    role: UserRole.PROFESSOR, faculty: 'ACE', department: 'Automatica',
  }));

  const profMaria = await userRepo.save(mkUser({
    firstName: 'Maria', lastName: 'Ionescu', email: 'maria.ionescu@example.com',
    role: UserRole.PROFESSOR, faculty: 'ACE', department: 'Calculatoare',
    bio: 'Coordonator de proiecte in domeniul aplicatiilor educationale si al sistemelor de vot electronic.',
  }));

  // Contul de pe care se face demo-ul. Adresa example.com nu primeste emailuri;
  // pentru a testa emailurile reale local, pune-ti adresa in SEED_DEMO_EMAIL din .env.
  const vlad = await userRepo.save(mkUser({
    firstName: 'Vlad', lastName: 'Stoica',
    email: process.env.SEED_DEMO_EMAIL || 'demo.student@example.com',
    role: UserRole.STUDENT, faculty: 'ACE', department: 'Calculatoare', studyYear: 4,
    bio: 'Student in anul IV, coordoneaza echipa Alpha la proiectul de monitorizare energetica.',
    notificationPreferences: { push: true, risk: true, chat: true, evals: true, email: true },
  }));

  const andrei = await userRepo.save(mkUser({
    firstName: 'Andrei', lastName: 'Ionescu', email: 'andrei.ionescu@student.example.com',
    role: UserRole.STUDENT, faculty: 'ACE', department: 'Calculatoare', studyYear: 4,
    phone: '0745123456',
  }));

  const mariaPopa = await userRepo.save(mkUser({
    firstName: 'Maria', lastName: 'Popa', email: 'maria.popa@student.example.com',
    role: UserRole.STUDENT, faculty: 'ACE', department: 'Calculatoare', studyYear: 4,
    phone: '0745234567',
  }));

  const radu = await userRepo.save(mkUser({
    firstName: 'Radu', lastName: 'Constantin', email: 'radu.constantin@student.example.com',
    role: UserRole.STUDENT, faculty: 'ACE', department: 'Automatica', studyYear: 3,
    phone: '0745345678',
  }));

  const ioana = await userRepo.save(mkUser({
    firstName: 'Ioana', lastName: 'Vasile', email: 'ioana.vasile@student.example.com',
    role: UserRole.STUDENT, faculty: 'ACE', department: 'Calculatoare', studyYear: 4,
    phone: '0745456789', bio: 'Interesata de procesarea limbajului natural si analiza de text.',
  }));

  const cristian = await userRepo.save(mkUser({
    firstName: 'Cristian', lastName: 'Barbu', email: 'cristian.barbu@student.example.com',
    role: UserRole.STUDENT, faculty: 'ACE', department: 'Electronica', studyYear: 3,
    phone: '0745567890',
  }));

  console.log(`   10 utilizatori creati.`);

  // ECHIPE
  console.log('Creez echipele...');

  const echipaAlpha = await teamRepo.save(teamRepo.create({
    name: 'Echipa Alpha', description: 'Echipa care lucreaza la sistemul de monitorizare energetica.',
    faculty: 'ACE', department: 'Calculatoare', maxMembers: 5,
  }));
  await teamMemberRepo.save([
    teamMemberRepo.create({ teamId: echipaAlpha.id, userId: vlad.id, role: TeamRole.LEADER }),
    teamMemberRepo.create({ teamId: echipaAlpha.id, userId: andrei.id, role: TeamRole.MEMBER }),
    teamMemberRepo.create({ teamId: echipaAlpha.id, userId: mariaPopa.id, role: TeamRole.MEMBER }),
  ]);

  const echipaBeta = await teamRepo.save(teamRepo.create({
    name: 'Echipa Beta', description: 'Echipa care lucreaza la platforma de invatare colaborativa.',
    faculty: 'ACE', department: 'Calculatoare', maxMembers: 5,
  }));
  await teamMemberRepo.save([
    teamMemberRepo.create({ teamId: echipaBeta.id, userId: radu.id, role: TeamRole.LEADER }),
    teamMemberRepo.create({ teamId: echipaBeta.id, userId: cristian.id, role: TeamRole.MEMBER }),
  ]);

  console.log('   2 echipe create.');

  // ================== PROIECTE (10) ==================
  console.log('Creez proiectele...');

  const logActivity = async (projectId: string, userId: string, action: string, description: string) => {
    await activityRepo.save(activityRepo.create({ projectId, userId, action, description }));
  };

  // P1 — In progres, echipa Alpha condusa de Vlad — proiectul central al demo-ului
  const p1 = await projectRepo.save(projectRepo.create({
    title: 'Sistem de monitorizare a consumului energetic',
    description: 'Platforma web care colecteaza date de la senzori inteligenti si afiseaza consumul energetic in timp real, cu alerte la depasirea pragurilor stabilite si rapoarte lunare comparative.',
    objectives: 'Reducerea consumului energetic prin vizibilitate in timp real si alertare automata.',
    type: ProjectType.BACHELOR_THESIS, status: ProjectStatus.IN_PROGRESS, priority: ProjectPriority.HIGH,
    coordinatorId: profMihai.id, createdById: vlad.id, teamId: echipaAlpha.id,
    startDate: daysFromNow(-90), endDate: daysFromNow(60),
    technologies: ['React', 'Node.js', 'PostgreSQL', 'MQTT'],
    tags: ['iot', 'energie', 'monitorizare'], faculty: 'ACE', department: 'Calculatoare',
    progressPercentage: 55,
  }));
  await logActivity(p1.id, vlad.id, 'PROJECT_CREATED', `Proiectul "${p1.title}" a fost creat`);

  // P2 — In progres, individual
  const p2 = await projectRepo.save(projectRepo.create({
    title: 'Aplicatie mobila pentru rezervari la cabinete medicale',
    description: 'Aplicatie care permite pacientilor sa vada disponibilitatea medicilor si sa isi rezerve consultatii, cu notificari de reamintire.',
    type: ProjectType.BACHELOR_THESIS, status: ProjectStatus.IN_PROGRESS, priority: ProjectPriority.MEDIUM,
    coordinatorId: profElena.id, createdById: radu.id,
    startDate: daysFromNow(-60), endDate: daysFromNow(90),
    technologies: ['React Native', 'Firebase', 'TypeScript'],
    tags: ['mobil', 'sanatate'], faculty: 'ACE', department: 'Automatica',
    progressPercentage: 35,
  }));
  await logActivity(p2.id, radu.id, 'PROJECT_CREATED', `Proiectul "${p2.title}" a fost creat`);

  // P3 — Review, echipa Beta
  const p3 = await projectRepo.save(projectRepo.create({
    title: 'Platforma de invatare colaborativa',
    description: 'Spatiu online in care studentii pot crea grupuri de studiu, partaja materiale si urmari progresul comun la o disciplina.',
    type: ProjectType.BACHELOR_THESIS, status: ProjectStatus.REVIEW, priority: ProjectPriority.MEDIUM,
    coordinatorId: profMihai.id, createdById: radu.id, teamId: echipaBeta.id,
    startDate: daysFromNow(-150), endDate: daysFromNow(14),
    technologies: ['Next.js', 'NestJS', 'PostgreSQL'],
    tags: ['educatie', 'colaborare'], faculty: 'ACE', department: 'Calculatoare',
    progressPercentage: 88,
  }));
  await logActivity(p3.id, radu.id, 'PROJECT_CREATED', `Proiectul "${p3.title}" a fost creat`);

  // P4 — Finalizat, cu evaluari complete
  const p4 = await projectRepo.save(projectRepo.create({
    title: 'Analiza automata a lucrarilor de licenta',
    description: 'Instrument care verifica structura unei lucrari academice si semnaleaza sectiunile lipsa sau dezechilibrate ca dimensiune.',
    type: ProjectType.RESEARCH, status: ProjectStatus.COMPLETED, priority: ProjectPriority.HIGH,
    coordinatorId: profElena.id, createdById: ioana.id,
    startDate: daysFromNow(-240), endDate: daysFromNow(-30),
    technologies: ['Python', 'spaCy', 'Flask'],
    tags: ['cercetare', 'nlp'], faculty: 'ACE', department: 'Calculatoare',
    progressPercentage: 100,
  }));
  await logActivity(p4.id, ioana.id, 'PROJECT_CREATED', `Proiectul "${p4.title}" a fost creat`);

  // P5 — Propus
  const p5 = await projectRepo.save(projectRepo.create({
    title: 'Sistem de gestiune a laboratoarelor',
    description: 'Evidenta echipamentelor din laboratoarele facultatii, cu istoric al imprumuturilor si notificari la returnarea intarziata.',
    type: ProjectType.INDUSTRIAL, status: ProjectStatus.PROPOSED, priority: ProjectPriority.LOW,
    coordinatorId: profMihai.id, createdById: cristian.id,
    startDate: daysFromNow(-14), endDate: daysFromNow(120),
    technologies: ['Vue.js', 'Express', 'MySQL'],
    tags: ['industrial'], faculty: 'ACE', department: 'Electronica',
    progressPercentage: 5,
  }));
  await logActivity(p5.id, cristian.id, 'PROJECT_CREATED', `Proiectul "${p5.title}" a fost creat`);

  // P6 — Draft, fara coordonator si fara data de final (alerta in analiza)
  const p6 = await projectRepo.save(projectRepo.create({
    title: 'Chatbot pentru asistenta studentilor',
    description: 'Asistent conversational care raspunde la intrebari frecvente despre orar, examene si proceduri administrative.',
    type: ProjectType.BACHELOR_THESIS, status: ProjectStatus.DRAFT, priority: ProjectPriority.MEDIUM,
    createdById: mariaPopa.id,
    startDate: daysFromNow(-5),
    technologies: ['Python', 'FastAPI'],
    tags: ['chatbot'], faculty: 'ACE', department: 'Calculatoare',
    progressPercentage: 0,
  }));
  await logActivity(p6.id, mariaPopa.id, 'PROJECT_CREATED', `Proiectul "${p6.title}" a fost creat`);

  // P7 — NOU — In progres, coordonat de Maria Ionescu
  const p7 = await projectRepo.save(projectRepo.create({
    title: 'Aplicatie de gestionare a bibliotecii universitare',
    description: 'Platforma pentru evidenta imprumuturilor de carti, rezervari si notificari automate la apropierea termenului de restituire.',
    type: ProjectType.BACHELOR_THESIS, status: ProjectStatus.IN_PROGRESS, priority: ProjectPriority.MEDIUM,
    coordinatorId: profMaria.id, createdById: andrei.id,
    startDate: daysFromNow(-45), endDate: daysFromNow(75),
    technologies: ['Angular', 'Spring Boot', 'MySQL'],
    tags: ['biblioteca', 'evidenta'], faculty: 'ACE', department: 'Calculatoare',
    progressPercentage: 40,
  }));
  await logActivity(p7.id, andrei.id, 'PROJECT_CREATED', `Proiectul "${p7.title}" a fost creat`);

  // P8 — NOU — Aprobat, coordonat de Maria Ionescu
  const p8 = await projectRepo.save(projectRepo.create({
    title: 'Platforma de e-voting pentru consiliul studentesc',
    description: 'Sistem securizat de vot electronic pentru alegerile din consiliul studentesc, cu verificare a identitatii si numarare automata.',
    type: ProjectType.BACHELOR_THESIS, status: ProjectStatus.APPROVED, priority: ProjectPriority.HIGH,
    coordinatorId: profMaria.id, createdById: radu.id,
    startDate: daysFromNow(-10), endDate: daysFromNow(140),
    technologies: ['Next.js', 'NestJS', 'PostgreSQL'],
    tags: ['votare', 'securitate'], faculty: 'ACE', department: 'Automatica',
    progressPercentage: 8,
  }));
  await logActivity(p8.id, radu.id, 'PROJECT_CREATED', `Proiectul "${p8.title}" a fost creat`);

  // P9 — NOU — Finalizat, cu evaluare
  const p9 = await projectRepo.save(projectRepo.create({
    title: 'Sistem de recomandare a cursurilor optionale',
    description: 'Aplicatie care sugereaza cursuri optionale pe baza istoricului academic si a intereselor declarate de student.',
    type: ProjectType.RESEARCH, status: ProjectStatus.COMPLETED, priority: ProjectPriority.MEDIUM,
    coordinatorId: profElena.id, createdById: cristian.id,
    startDate: daysFromNow(-200), endDate: daysFromNow(-20),
    technologies: ['Python', 'scikit-learn', 'FastAPI'],
    tags: ['recomandare', 'cercetare'], faculty: 'ACE', department: 'Electronica',
    progressPercentage: 100,
  }));
  await logActivity(p9.id, cristian.id, 'PROJECT_CREATED', `Proiectul "${p9.title}" a fost creat`);

  // P10 — NOU — Respins, cu motiv
  const p10 = await projectRepo.save(projectRepo.create({
    title: 'Aplicatie de car-sharing pentru campus',
    description: 'Platforma prin care studentii pot partaja deplasari cu masina personala intre campus si oras.',
    type: ProjectType.BACHELOR_THESIS, status: ProjectStatus.REJECTED, priority: ProjectPriority.LOW,
    coordinatorId: profMihai.id, createdById: andrei.id,
    startDate: daysFromNow(-20),
    technologies: ['React Native', 'Firebase'],
    tags: ['mobilitate'], faculty: 'ACE', department: 'Calculatoare',
    progressPercentage: 0,
    rejectionReason: 'Tema se suprapune semnificativ cu un proiect deja in derulare din promotia anterioara.',
  }));
  await logActivity(p10.id, andrei.id, 'PROJECT_CREATED', `Proiectul "${p10.title}" a fost creat`);
  await logActivity(p10.id, profMihai.id, 'STATUS_CHANGED', 'Status schimbat din "Propus" in "Respins"');

  console.log('   10 proiecte create.');

  // MILESTONE-URI
  console.log('Creez milestone-urile...');

  await milestoneRepo.save([
    milestoneRepo.create({ projectId: p1.id, title: 'Studiu bibliografic si analiza cerintelor', dueDate: daysFromNow(-60), status: MilestoneStatus.COMPLETED, progressPercentage: 100, order: 0 }),
    milestoneRepo.create({ projectId: p1.id, title: 'Proiectarea arhitecturii si a bazei de date', dueDate: daysFromNow(-42), status: MilestoneStatus.COMPLETED, progressPercentage: 100, order: 1 }),
    milestoneRepo.create({ projectId: p1.id, title: 'Implementarea modulului de colectare date', dueDate: daysFromNow(-5), status: MilestoneStatus.OVERDUE, progressPercentage: 70, order: 2 }),
    milestoneRepo.create({ projectId: p1.id, title: 'Dezvoltarea interfetei de vizualizare', dueDate: daysFromNow(4), status: MilestoneStatus.IN_PROGRESS, progressPercentage: 40, order: 3 }),
    milestoneRepo.create({ projectId: p1.id, title: 'Testare si validare pe date reale', dueDate: daysFromNow(42), status: MilestoneStatus.PENDING, progressPercentage: 0, order: 4 }),
  ]);

  await milestoneRepo.save([
    milestoneRepo.create({ projectId: p2.id, title: 'Analiza si wireframes', dueDate: daysFromNow(-35), status: MilestoneStatus.COMPLETED, progressPercentage: 100, order: 0 }),
    milestoneRepo.create({ projectId: p2.id, title: 'Configurarea backend-ului', dueDate: daysFromNow(-21), status: MilestoneStatus.COMPLETED, progressPercentage: 100, order: 1 }),
    milestoneRepo.create({ projectId: p2.id, title: 'Ecranele principale ale aplicatiei', dueDate: daysFromNow(6), status: MilestoneStatus.IN_PROGRESS, progressPercentage: 50, order: 2 }),
    milestoneRepo.create({ projectId: p2.id, title: 'Integrarea notificarilor', dueDate: daysFromNow(35), status: MilestoneStatus.PENDING, progressPercentage: 0, order: 3 }),
  ]);

  await milestoneRepo.save([
    milestoneRepo.create({ projectId: p3.id, title: 'Definirea conceptului', dueDate: daysFromNow(-120), status: MilestoneStatus.COMPLETED, progressPercentage: 100, order: 0 }),
    milestoneRepo.create({ projectId: p3.id, title: 'Implementarea modulului de grupuri', dueDate: daysFromNow(-90), status: MilestoneStatus.COMPLETED, progressPercentage: 100, order: 1 }),
    milestoneRepo.create({ projectId: p3.id, title: 'Sistemul de partajare materiale', dueDate: daysFromNow(-42), status: MilestoneStatus.COMPLETED, progressPercentage: 100, order: 2 }),
    milestoneRepo.create({ projectId: p3.id, title: 'Testare finala si documentatie', dueDate: daysFromNow(10), status: MilestoneStatus.IN_PROGRESS, progressPercentage: 75, order: 3 }),
  ]);

  await milestoneRepo.save([
    milestoneRepo.create({ projectId: p4.id, title: 'Studiul metodelor de procesare text', dueDate: daysFromNow(-210), status: MilestoneStatus.COMPLETED, progressPercentage: 100, order: 0 }),
    milestoneRepo.create({ projectId: p4.id, title: 'Implementarea analizorului', dueDate: daysFromNow(-120), status: MilestoneStatus.COMPLETED, progressPercentage: 100, order: 1 }),
    milestoneRepo.create({ projectId: p4.id, title: 'Evaluarea pe un corpus de lucrari', dueDate: daysFromNow(-60), status: MilestoneStatus.COMPLETED, progressPercentage: 100, order: 2 }),
    milestoneRepo.create({ projectId: p4.id, title: 'Redactarea articolului', dueDate: daysFromNow(-35), status: MilestoneStatus.COMPLETED, progressPercentage: 100, order: 3 }),
  ]);

  await milestoneRepo.save([
    milestoneRepo.create({ projectId: p5.id, title: 'Analiza cerintelor cu personalul tehnic', dueDate: daysFromNow(21), status: MilestoneStatus.PENDING, progressPercentage: 0, order: 0 }),
    milestoneRepo.create({ projectId: p5.id, title: 'Proiectarea modelului de date', dueDate: daysFromNow(49), status: MilestoneStatus.PENDING, progressPercentage: 0, order: 1 }),
  ]);

  await milestoneRepo.save([
    milestoneRepo.create({ projectId: p7.id, title: 'Analiza sistemului actual de evidenta', dueDate: daysFromNow(-25), status: MilestoneStatus.COMPLETED, progressPercentage: 100, order: 0 }),
    milestoneRepo.create({ projectId: p7.id, title: 'Modulul de imprumuturi si rezervari', dueDate: daysFromNow(15), status: MilestoneStatus.IN_PROGRESS, progressPercentage: 45, order: 1 }),
    milestoneRepo.create({ projectId: p7.id, title: 'Notificari automate de restituire', dueDate: daysFromNow(55), status: MilestoneStatus.PENDING, progressPercentage: 0, order: 2 }),
  ]);

  await milestoneRepo.save([
    milestoneRepo.create({ projectId: p8.id, title: 'Specificarea cerintelor de securitate', dueDate: daysFromNow(30), status: MilestoneStatus.PENDING, progressPercentage: 0, order: 0 }),
  ]);

  await milestoneRepo.save([
    milestoneRepo.create({ projectId: p9.id, title: 'Colectarea datelor academice anonimizate', dueDate: daysFromNow(-180), status: MilestoneStatus.COMPLETED, progressPercentage: 100, order: 0 }),
    milestoneRepo.create({ projectId: p9.id, title: 'Antrenarea modelului de recomandare', dueDate: daysFromNow(-90), status: MilestoneStatus.COMPLETED, progressPercentage: 100, order: 1 }),
    milestoneRepo.create({ projectId: p9.id, title: 'Evaluarea acuratetei recomandarilor', dueDate: daysFromNow(-25), status: MilestoneStatus.COMPLETED, progressPercentage: 100, order: 2 }),
  ]);

  console.log('   25 milestone-uri create.');

  // TASK-URI
  console.log('Creez task-urile...');

  await taskRepo.save([
    taskRepo.create({ projectId: p1.id, title: 'Configurarea brokerului MQTT', assigneeId: vlad.id, reporterId: vlad.id, priority: TaskPriority.HIGH, status: TaskStatus.DONE, dueDate: daysFromNow(-35) }),
    taskRepo.create({ projectId: p1.id, title: 'Schema tabelelor pentru masuratori', assigneeId: mariaPopa.id, reporterId: vlad.id, priority: TaskPriority.HIGH, status: TaskStatus.DONE, dueDate: daysFromNow(-30) }),
    taskRepo.create({ projectId: p1.id, title: 'Endpoint pentru receptia datelor', assigneeId: vlad.id, reporterId: vlad.id, priority: TaskPriority.CRITICAL, status: TaskStatus.DONE, dueDate: daysFromNow(-21) }),
    taskRepo.create({ projectId: p1.id, title: 'Graficul de consum pe intervale', assigneeId: andrei.id, reporterId: vlad.id, priority: TaskPriority.HIGH, status: TaskStatus.IN_PROGRESS, dueDate: daysFromNow(3) }),
    taskRepo.create({ projectId: p1.id, title: 'Configurarea pragurilor de alerta', assigneeId: mariaPopa.id, reporterId: vlad.id, priority: TaskPriority.MEDIUM, status: TaskStatus.IN_PROGRESS, dueDate: daysFromNow(8) }),
    taskRepo.create({ projectId: p1.id, title: 'Exportul rapoartelor lunare', reporterId: vlad.id, priority: TaskPriority.MEDIUM, status: TaskStatus.TODO, dueDate: daysFromNow(21) }),
    taskRepo.create({ projectId: p1.id, title: 'Documentatia API-ului', reporterId: vlad.id, priority: TaskPriority.LOW, status: TaskStatus.TODO, dueDate: daysFromNow(35) }),
  ]);

  await taskRepo.save([
    taskRepo.create({ projectId: p2.id, title: 'Ecranul de autentificare', assigneeId: radu.id, reporterId: radu.id, priority: TaskPriority.HIGH, status: TaskStatus.DONE, dueDate: daysFromNow(-30) }),
    taskRepo.create({ projectId: p2.id, title: 'Lista medicilor disponibili', assigneeId: radu.id, reporterId: radu.id, priority: TaskPriority.HIGH, status: TaskStatus.IN_PROGRESS, dueDate: daysFromNow(4) }),
    taskRepo.create({ projectId: p2.id, title: 'Calendarul de rezervari', assigneeId: radu.id, reporterId: radu.id, priority: TaskPriority.CRITICAL, status: TaskStatus.IN_PROGRESS, dueDate: daysFromNow(9) }),
    taskRepo.create({ projectId: p2.id, title: 'Notificari push de reamintire', assigneeId: radu.id, reporterId: radu.id, priority: TaskPriority.MEDIUM, status: TaskStatus.TODO, dueDate: daysFromNow(30) }),
  ]);

  await taskRepo.save([
    taskRepo.create({ projectId: p3.id, title: 'Crearea si administrarea grupurilor', assigneeId: radu.id, reporterId: radu.id, priority: TaskPriority.HIGH, status: TaskStatus.DONE, dueDate: daysFromNow(-90) }),
    taskRepo.create({ projectId: p3.id, title: 'Incarcarea materialelor', assigneeId: cristian.id, reporterId: radu.id, priority: TaskPriority.HIGH, status: TaskStatus.DONE, dueDate: daysFromNow(-42) }),
    taskRepo.create({ projectId: p3.id, title: 'Comentarii pe materiale', assigneeId: cristian.id, reporterId: radu.id, priority: TaskPriority.MEDIUM, status: TaskStatus.DONE, dueDate: daysFromNow(-30) }),
    taskRepo.create({ projectId: p3.id, title: 'Redactarea manualului de utilizare', assigneeId: radu.id, reporterId: radu.id, priority: TaskPriority.MEDIUM, status: TaskStatus.IN_PROGRESS, dueDate: daysFromNow(8) }),
  ]);

  await taskRepo.save([
    taskRepo.create({ projectId: p4.id, title: 'Colectarea corpusului de lucrari', assigneeId: ioana.id, reporterId: ioana.id, priority: TaskPriority.HIGH, status: TaskStatus.DONE, dueDate: daysFromNow(-200) }),
    taskRepo.create({ projectId: p4.id, title: 'Implementarea segmentarii pe capitole', assigneeId: ioana.id, reporterId: ioana.id, priority: TaskPriority.CRITICAL, status: TaskStatus.DONE, dueDate: daysFromNow(-150) }),
    taskRepo.create({ projectId: p4.id, title: 'Detectarea sectiunilor lipsa', assigneeId: ioana.id, reporterId: ioana.id, priority: TaskPriority.HIGH, status: TaskStatus.DONE, dueDate: daysFromNow(-90) }),
    taskRepo.create({ projectId: p4.id, title: 'Interfata web pentru incarcare', assigneeId: ioana.id, reporterId: ioana.id, priority: TaskPriority.MEDIUM, status: TaskStatus.DONE, dueDate: daysFromNow(-40) }),
  ]);

  await taskRepo.save([
    taskRepo.create({ projectId: p7.id, title: 'Modelarea bazei de date pentru carti', assigneeId: andrei.id, reporterId: andrei.id, priority: TaskPriority.HIGH, status: TaskStatus.DONE, dueDate: daysFromNow(-20) }),
    taskRepo.create({ projectId: p7.id, title: 'Ecranul de cautare in catalog', assigneeId: andrei.id, reporterId: andrei.id, priority: TaskPriority.MEDIUM, status: TaskStatus.IN_PROGRESS, dueDate: daysFromNow(10) }),
    taskRepo.create({ projectId: p7.id, title: 'Fluxul de rezervare a unei carti', reporterId: andrei.id, priority: TaskPriority.MEDIUM, status: TaskStatus.TODO, dueDate: daysFromNow(25) }),
  ]);

  await taskRepo.save([
    taskRepo.create({ projectId: p8.id, title: 'Documentarea cerintelor de securitate', assigneeId: radu.id, reporterId: radu.id, priority: TaskPriority.HIGH, status: TaskStatus.IN_PROGRESS, dueDate: daysFromNow(18) }),
  ]);

  await taskRepo.save([
    taskRepo.create({ projectId: p9.id, title: 'Preprocesarea datelor academice', assigneeId: cristian.id, reporterId: cristian.id, priority: TaskPriority.HIGH, status: TaskStatus.DONE, dueDate: daysFromNow(-170) }),
    taskRepo.create({ projectId: p9.id, title: 'Antrenarea si validarea modelului', assigneeId: cristian.id, reporterId: cristian.id, priority: TaskPriority.CRITICAL, status: TaskStatus.DONE, dueDate: daysFromNow(-95) }),
  ]);

  console.log('   24 task-uri create.');

  // EVALUARI
  console.log('Creez evaluarile...');

  // P4 — doua evaluari complete
  const evalP4Mid = await evaluationRepo.save(evaluationRepo.create({
    projectId: p4.id, evaluatorId: profElena.id, phase: EvaluationPhase.MIDTERM, status: EvaluationStatus.COMPLETED,
    totalScore: 85, maxScore: 100, completedAt: daysFromNow(-120),
    generalFeedback: 'Abordarea propusa este solida, iar rezultatele preliminare sunt promitatoare. Recomand o analiza mai atenta a cazurilor in care structura lucrarii se abate de la formatul standard.',
  }));
  await criteriaRepo.save([
    criteriaRepo.create({ evaluationId: evalP4Mid.id, name: 'Functionalitate', score: 26, maxScore: 30, weight: 1 }),
    criteriaRepo.create({ evaluationId: evalP4Mid.id, name: 'Calitate cod', score: 21, maxScore: 25, weight: 1 }),
    criteriaRepo.create({ evaluationId: evalP4Mid.id, name: 'Documentatie', score: 17, maxScore: 20, weight: 1 }),
    criteriaRepo.create({ evaluationId: evalP4Mid.id, name: 'Prezentare', score: 12, maxScore: 15, weight: 1 }),
    criteriaRepo.create({ evaluationId: evalP4Mid.id, name: 'Originalitate', score: 9, maxScore: 10, weight: 1 }),
  ]);

  const evalP4Final = await evaluationRepo.save(evaluationRepo.create({
    projectId: p4.id, evaluatorId: profElena.id, phase: EvaluationPhase.FINAL, status: EvaluationStatus.COMPLETED,
    totalScore: 90, maxScore: 100, completedAt: daysFromNow(-32),
    generalFeedback: 'Lucrare bine structurata, cu o implementare functionala si o evaluare riguroasa pe un corpus real. Interfata web adauga valoare practica.',
  }));
  await criteriaRepo.save([
    criteriaRepo.create({ evaluationId: evalP4Final.id, name: 'Functionalitate', score: 28, maxScore: 30, weight: 1 }),
    criteriaRepo.create({ evaluationId: evalP4Final.id, name: 'Calitate cod', score: 22, maxScore: 25, weight: 1 }),
    criteriaRepo.create({ evaluationId: evalP4Final.id, name: 'Documentatie', score: 18, maxScore: 20, weight: 1 }),
    criteriaRepo.create({ evaluationId: evalP4Final.id, name: 'Prezentare', score: 13, maxScore: 15, weight: 1 }),
    criteriaRepo.create({ evaluationId: evalP4Final.id, name: 'Originalitate', score: 9, maxScore: 10, weight: 1 }),
  ]);

  // P3 — o evaluare completa
  const evalP3 = await evaluationRepo.save(evaluationRepo.create({
    projectId: p3.id, evaluatorId: profMihai.id, phase: EvaluationPhase.MIDTERM, status: EvaluationStatus.COMPLETED,
    totalScore: 76, maxScore: 100, completedAt: daysFromNow(-40),
    generalFeedback: 'Modulele principale functioneaza corect. Documentatia are nevoie de completari, in special partea de instalare si configurare.',
  }));
  await criteriaRepo.save([
    criteriaRepo.create({ evaluationId: evalP3.id, name: 'Functionalitate', score: 24, maxScore: 30, weight: 1 }),
    criteriaRepo.create({ evaluationId: evalP3.id, name: 'Calitate cod', score: 20, maxScore: 25, weight: 1 }),
    criteriaRepo.create({ evaluationId: evalP3.id, name: 'Documentatie', score: 14, maxScore: 20, weight: 1 }),
    criteriaRepo.create({ evaluationId: evalP3.id, name: 'Prezentare', score: 11, maxScore: 15, weight: 1 }),
    criteriaRepo.create({ evaluationId: evalP3.id, name: 'Originalitate', score: 7, maxScore: 10, weight: 1 }),
  ]);

  // P9 — o evaluare completa (nou)
  const evalP9 = await evaluationRepo.save(evaluationRepo.create({
    projectId: p9.id, evaluatorId: profElena.id, phase: EvaluationPhase.FINAL, status: EvaluationStatus.COMPLETED,
    totalScore: 81, maxScore: 100, completedAt: daysFromNow(-18),
    generalFeedback: 'Modelul de recomandare are o acuratete buna pe setul de testare. Ar merita explorata si o comparatie cu alte metode.',
  }));
  await criteriaRepo.save([
    criteriaRepo.create({ evaluationId: evalP9.id, name: 'Functionalitate', score: 25, maxScore: 30, weight: 1 }),
    criteriaRepo.create({ evaluationId: evalP9.id, name: 'Calitate cod', score: 20, maxScore: 25, weight: 1 }),
    criteriaRepo.create({ evaluationId: evalP9.id, name: 'Documentatie', score: 16, maxScore: 20, weight: 1 }),
    criteriaRepo.create({ evaluationId: evalP9.id, name: 'Prezentare', score: 12, maxScore: 15, weight: 1 }),
    criteriaRepo.create({ evaluationId: evalP9.id, name: 'Originalitate', score: 8, maxScore: 10, weight: 1 }),
  ]);

  // Criteriile standard, cu scor 0 — pregatite pentru evaluarile
  // ramase in asteptare, ca profesorul sa aiba ce completa la deschidere
  // (fara ele, pagina de evaluare arata 0/0 puncte, fara campuri de scor)
  const mkEmptyCriteria = (evaluationId: string) => ([
    criteriaRepo.create({ evaluationId, name: 'Functionalitate', score: 0, maxScore: 30, weight: 1 }),
    criteriaRepo.create({ evaluationId, name: 'Calitate cod', score: 0, maxScore: 25, weight: 1 }),
    criteriaRepo.create({ evaluationId, name: 'Documentatie', score: 0, maxScore: 20, weight: 1 }),
    criteriaRepo.create({ evaluationId, name: 'Prezentare', score: 0, maxScore: 15, weight: 1 }),
    criteriaRepo.create({ evaluationId, name: 'Originalitate', score: 0, maxScore: 10, weight: 1 }),
  ]);

  // P1 — o evaluare in asteptare (Mihai)
  const evalP1Pending = await evaluationRepo.save(evaluationRepo.create({
    projectId: p1.id, evaluatorId: profMihai.id, phase: EvaluationPhase.PROPOSAL, status: EvaluationStatus.DRAFT,
  }));
  await criteriaRepo.save(mkEmptyCriteria(evalP1Pending.id));

  // P7 — o evaluare in asteptare (Maria Ionescu, noua coordonatoare)
  const evalP7Pending = await evaluationRepo.save(evaluationRepo.create({
    projectId: p7.id, evaluatorId: profMaria.id, phase: EvaluationPhase.PROPOSAL, status: EvaluationStatus.DRAFT,
  }));
  await criteriaRepo.save(mkEmptyCriteria(evalP7Pending.id));

  console.log('   6 evaluari create (4 complete, 2 in asteptare, cu criterii goale gata de completat).');

  // DOCUMENTE
  console.log('Creez documentele...');

  const mkDocument = async (projectId: string, uploadedById: string, name: string, content: string) => {
    const file = writeDummyFile(name, content);
    const doc = await documentRepo.save(documentRepo.create({
      projectId, uploadedById, name, originalName: name,
      filename: file.filename, storagePath: file.path, mimeType: 'text/plain',
      size: file.size, type: DocumentType.REPORT, currentVersion: 1,
    }));
    await versionRepo.save(versionRepo.create({
      documentId: doc.id, version: 1, filename: file.filename, storagePath: file.path,
      size: file.size, uploadedById,
    }));
    await logActivity(projectId, uploadedById, 'DOCUMENT_UPLOADED', `Documentul "${name}" a fost incarcat`);
  };

  await mkDocument(p1.id, vlad.id, 'Analiza_cerintelor.pdf', 'Document de analiza a cerintelor pentru sistemul de monitorizare energetica.');
  await mkDocument(p1.id, mariaPopa.id, 'Schema_arhitecturii.pdf', 'Schema arhitecturii aplicatiei: frontend React, backend NestJS, baza de date PostgreSQL, comunicare prin MQTT.');
  await mkDocument(p1.id, vlad.id, 'Raport_intermediar.pdf', 'Raport intermediar privind stadiul implementarii.');
  await mkDocument(p3.id, radu.id, 'Manual_utilizare_draft.pdf', 'Manual de utilizare pentru platforma de invatare colaborativa. Varianta in lucru.');
  await mkDocument(p7.id, andrei.id, 'Specificatii_functionale.pdf', 'Specificatiile functionale ale aplicatiei de gestionare a bibliotecii.');

  console.log('   5 documente create, cu fisiere reale pe disc.');

  // CONVERSATII DE CHAT
  console.log('Creez conversatiile...');

  const roomAlpha = await roomRepo.save(roomRepo.create({
    type: RoomType.TEAM, entityId: echipaAlpha.id,
    memberIds: [vlad.id, andrei.id, mariaPopa.id],
  }));

  await messageRepo.save(messageRepo.create({
    roomId: roomAlpha.id, senderId: andrei.id,
    content: 'Am terminat endpointul de receptie, datele intra corect in baza.',
    createdAt: messageTime(-2, 7),
  }));

  await messageRepo.save(messageRepo.create({
    roomId: roomAlpha.id, senderId: mariaPopa.id,
    content: `Perfect. @Vlad Stoica poti sa incepi graficul de consum, ai deja datele.`,
    createdAt: messageTime(-2, 14),
    reactions: { '👍': [andrei.id] },
  }));

  const msgVlad = await messageRepo.save(messageRepo.create({
    roomId: roomAlpha.id, senderId: vlad.id,
    content: 'Ma uit acum peste ele. Cate masuratori pe minut trimit senzorii?',
    createdAt: messageTime(-1, 21),
  }));

  await messageRepo.save(messageRepo.create({
    roomId: roomAlpha.id, senderId: andrei.id,
    content: 'Cate doua pe minut, deocamdata.',
    parentId: msgVlad.id,
    createdAt: messageTime(-1, 28),
    reactions: { '✅': [mariaPopa.id, vlad.id] },
  }));

  const chatFile = writeDummyFile('Schema_tabelelor.txt', 'Schema tabelelor pentru masuratori:\n\n- sensor_readings(id, sensor_id, value, timestamp)\n- thresholds(id, project_id, min, max)');
  await messageRepo.save(messageRepo.create({
    roomId: roomAlpha.id, senderId: mariaPopa.id,
    content: 'Am pus aici schema tabelelor, sa fie la indemana.',
    createdAt: messageTime(-1, 35),
    reactions: { '👀': [andrei.id, vlad.id] },
    attachments: [{
      filename: chatFile.filename, originalName: 'Schema_tabelelor.txt',
      mimeType: 'text/plain', size: chatFile.size,
    }],
  }));

  const roomBeta = await roomRepo.save(roomRepo.create({
    type: RoomType.TEAM, entityId: echipaBeta.id,
    memberIds: [radu.id, cristian.id],
  }));
  await messageRepo.save([
    messageRepo.create({ roomId: roomBeta.id, senderId: radu.id, content: 'Manualul e pe jumatate scris, il termin pana vineri.', createdAt: messageTime(-3, 42) }),
    messageRepo.create({ roomId: roomBeta.id, senderId: cristian.id, content: 'Spune-mi daca vrei sa preiau partea de capturi de ecran.', createdAt: messageTime(-3, 49) }),
  ]);

  console.log('   2 camere de chat create, cu mentiuni, raspuns, reactii si atasament.');
  console.log('   ATENTIE: mentiunea catre Vlad din chat e doar vizuala (inserata direct in baza');
  console.log('   de date) — NU trimite email real. Pentru email real, trimite un mesaj NOU, cu @,');
  console.log('   din aplicatia pornita, autentificat cu alt cont decat al lui Vlad.');

  // COMENTARII
  console.log('Creez comentariile...');

  await commentRepo.save(commentRepo.create({
    projectId: p1.id, authorId: profMihai.id,
    content: 'Progresul arata bine. Aveti grija sa nu ramaneti in urma cu modulul de vizualizare, e aproape de termen.',
  }));
  await logActivity(p1.id, profMihai.id, 'COMMENT_ADDED', 'A fost adaugat un comentariu');

  console.log('   1 comentariu creat.');

  // NOTIFICARI PRE-POPULATE
  // Inserate direct (nu trimit email)
  console.log('Creez notificarile...');

  const mkNotif = (data: Partial<Notification>) => notificationRepo.create({ isEmailSent: false, ...data });

  await notificationRepo.save([
    mkNotif({
      userId: vlad.id, type: NotificationType.MENTION,
      title: 'Ai fost mentionat de Maria Popa',
      message: 'In Echipa Alpha: "Perfect. @Vlad Stoica poti sa incepi graficul de consum..."',
      actionUrl: '/chat', isRead: false, createdAt: daysFromNow(-2),
    }),
    mkNotif({
      userId: vlad.id, type: NotificationType.DEADLINE,
      title: 'Termen apropiat',
      message: `Milestone-ul "Dezvoltarea interfetei de vizualizare" din proiectul "${p1.title}" expira in 4 zile.`,
      actionUrl: `/projects/${p1.id}`, entityType: 'project', entityId: p1.id,
      isRead: false, createdAt: daysFromNow(-1),
    }),
    mkNotif({
      userId: vlad.id, type: NotificationType.TEAM,
      title: 'Ai devenit liderul echipei Alpha',
      message: 'Ti-a fost atribuit rolul de lider pentru Echipa Alpha.',
      actionUrl: '/teams', isRead: true, createdAt: daysFromNow(-85),
    }),
    mkNotif({
      userId: vlad.id, type: NotificationType.SUCCESS,
      title: 'Proiect creat cu succes',
      message: `Proiectul "${p1.title}" a fost creat cu succes!`,
      actionUrl: `/projects/${p1.id}`, isRead: true, createdAt: daysFromNow(-90),
    }),
    mkNotif({
      userId: vlad.id, type: NotificationType.INFO,
      title: `Comentariu nou pe "${p1.title}"`,
      message: 'Mihai Dobre: "Progresul arata bine. Aveti grija sa nu ramaneti in urma..."',
      actionUrl: `/projects/${p1.id}`, entityType: 'project', entityId: p1.id,
      isRead: false, createdAt: daysFromNow(0),
    }),
  ]);

  await notificationRepo.save([
    mkNotif({
      userId: profMihai.id, type: NotificationType.EVALUATION,
      title: 'Evaluare in asteptare',
      message: `Proiectul "${p1.title}" are o evaluare de faza Propunere neinceputa.`,
      actionUrl: `/evaluations`, isRead: false, createdAt: daysFromNow(-3),
    }),
  ]);

  await notificationRepo.save([
    mkNotif({
      userId: profMaria.id, type: NotificationType.INFO,
      title: 'Proiect nou creat',
      message: `Andrei Ionescu a creat proiectul "${p7.title}".`,
      actionUrl: `/projects/${p7.id}`, entityType: 'project', entityId: p7.id,
      isRead: false, createdAt: daysFromNow(-45),
    }),
    mkNotif({
      userId: profMaria.id, type: NotificationType.EVALUATION,
      title: 'Evaluare in asteptare',
      message: `Proiectul "${p7.title}" are o evaluare de faza Propunere neinceputa.`,
      actionUrl: `/evaluations`, isRead: false, createdAt: daysFromNow(-2),
    }),
  ]);

  console.log('   8 notificari create, gata de apasat in demo.');

  console.log('');
  console.log('Populare completa cu succes!');
  console.log('');
  console.log('Conturi disponibile (parola: password123 pentru toate):');
  console.log('  Admin:      admin@example.com');
  console.log('  Profesor:   prof@example.com (Mihai Dobre)');
  console.log('  Profesor:   elena.marinescu@example.com (Elena Marinescu)');
  console.log('  Profesor:   maria.ionescu@example.com (Maria Ionescu)');
  console.log(`  CONT DEMO:  ${process.env.SEED_DEMO_EMAIL || 'demo.student@example.com'} (Vlad Stoica)`);
  console.log('  Student:    andrei.ionescu@student.example.com');
  console.log('  Student:    maria.popa@student.example.com');
  console.log('  Student:    radu.constantin@student.example.com');
  console.log('  Student:    ioana.vasile@student.example.com');
  console.log('  Student:    cristian.barbu@student.example.com');

  await dataSource.destroy();
}

seed().catch((err) => {
  console.error('Eroare la populare:', err);
  process.exit(1);
});