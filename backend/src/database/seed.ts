/**
 * Script de populare a bazei de date — versiunea pentru susținere.
 * Contul de pe care se face demo-ul este demo.student@example.com
 * Rulare: npm run seed   (din folderul backend)
 */

import AppDataSource from './data-source';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { randomBytes } from 'crypto';

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

function writeDummyFile(filename: string, content: string, dir = UPLOAD_DIR): { filename: string; path: string; size: number } {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}-${filename}`;
  const fullPath = path.join(dir, uniqueName);
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
  // Fisierele vechi (documente, atasamente) nu mai au corespondent in baza de date
  fs.rmSync(UPLOAD_DIR, { recursive: true, force: true });

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

  // In demo-ul public parola adminului nu e cea cunoscuta din cod: vine din SEED_ADMIN_PASSWORD sau e aleatoare
  const adminPassword = process.env.SEED_ADMIN_PASSWORD
    || (process.env.SHOWCASE_MODE === 'true' ? randomBytes(24).toString('hex') : 'password123');
  await userRepo.save(mkUser({
    password: adminPassword,
    firstName: 'Admin', lastName: 'Sistem', email: 'admin@example.com',
    role: UserRole.ADMIN, faculty: 'ACE', department: 'Administrare',
  }));

  const profMihai = await userRepo.save(mkUser({
    firstName: 'Mihai', lastName: 'Dobre', email: 'prof@example.com',
    role: UserRole.PROFESSOR, faculty: 'ACE', department: 'Calculatoare',
    bio: 'Coordonator de proiecte în domeniul sistemelor distribuite și al aplicațiilor web.',
  }));

  const profElena = await userRepo.save(mkUser({
    firstName: 'Elena', lastName: 'Marinescu', email: 'elena.marinescu@example.com',
    role: UserRole.PROFESSOR, faculty: 'ACE', department: 'Automatică',
  }));

  const profMaria = await userRepo.save(mkUser({
    firstName: 'Maria', lastName: 'Ionescu', email: 'maria.ionescu@example.com',
    role: UserRole.PROFESSOR, faculty: 'ACE', department: 'Calculatoare',
    bio: 'Coordonator de proiecte în domeniul aplicațiilor educaționale și al sistemelor de vot electronic.',
  }));

  // Contul de pe care se face demo-ul. Adresa example.com nu primeste emailuri;
  // pentru a testa emailurile reale local, pune-ti adresa in SEED_DEMO_EMAIL din .env.
  const vlad = await userRepo.save(mkUser({
    firstName: 'Vlad', lastName: 'Stoica',
    email: process.env.SEED_DEMO_EMAIL || 'demo.student@example.com',
    role: UserRole.STUDENT, faculty: 'ACE', department: 'Calculatoare', studyYear: 4,
    bio: 'Student în anul IV, coordonează echipa Alpha la proiectul de monitorizare energetică.',
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
    role: UserRole.STUDENT, faculty: 'ACE', department: 'Automatică', studyYear: 3,
    phone: '0745345678',
  }));

  const ioana = await userRepo.save(mkUser({
    firstName: 'Ioana', lastName: 'Vasile', email: 'ioana.vasile@student.example.com',
    role: UserRole.STUDENT, faculty: 'ACE', department: 'Calculatoare', studyYear: 4,
    phone: '0745456789', bio: 'Interesată de procesarea limbajului natural și analiza de text.',
  }));

  const cristian = await userRepo.save(mkUser({
    firstName: 'Cristian', lastName: 'Barbu', email: 'cristian.barbu@student.example.com',
    role: UserRole.STUDENT, faculty: 'ACE', department: 'Electronică', studyYear: 3,
    phone: '0745567890',
  }));

  console.log(`   10 utilizatori creati.`);

  // ECHIPE
  console.log('Creez echipele...');

  const echipaAlpha = await teamRepo.save(teamRepo.create({
    name: 'Echipa Alpha', description: 'Echipa care lucrează la sistemul de monitorizare energetică.',
    faculty: 'ACE', department: 'Calculatoare', maxMembers: 5,
  }));
  await teamMemberRepo.save([
    teamMemberRepo.create({ teamId: echipaAlpha.id, userId: vlad.id, role: TeamRole.LEADER }),
    teamMemberRepo.create({ teamId: echipaAlpha.id, userId: andrei.id, role: TeamRole.MEMBER }),
    teamMemberRepo.create({ teamId: echipaAlpha.id, userId: mariaPopa.id, role: TeamRole.MEMBER }),
  ]);

  const echipaBeta = await teamRepo.save(teamRepo.create({
    name: 'Echipa Beta', description: 'Echipa care lucrează la platforma de învățare colaborativă.',
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
    description: 'Platformă web care colectează date de la senzori inteligenți și afișează consumul energetic în timp real, cu alerte la depășirea pragurilor stabilite și rapoarte lunare comparative.',
    objectives: 'Reducerea consumului energetic prin vizibilitate în timp real și alertare automată.',
    type: ProjectType.BACHELOR_THESIS, status: ProjectStatus.IN_PROGRESS, priority: ProjectPriority.HIGH,
    coordinatorId: profMihai.id, createdById: vlad.id, teamId: echipaAlpha.id,
    startDate: daysFromNow(-90), endDate: daysFromNow(60),
    technologies: ['React', 'Node.js', 'PostgreSQL', 'MQTT'],
    tags: ['iot', 'energie', 'monitorizare'], faculty: 'ACE', department: 'Calculatoare',
    progressPercentage: 55,
  }));
  await logActivity(p1.id, vlad.id, 'PROJECT_CREATED', `Proiectul „${p1.title}” a fost creat`);

  // P2 — In progres, individual
  const p2 = await projectRepo.save(projectRepo.create({
    title: 'Aplicație mobilă pentru rezervări la cabinete medicale',
    description: 'Aplicație care permite pacienților să vadă disponibilitatea medicilor și să își rezerve consultații, cu notificări de reamintire.',
    type: ProjectType.BACHELOR_THESIS, status: ProjectStatus.IN_PROGRESS, priority: ProjectPriority.MEDIUM,
    coordinatorId: profElena.id, createdById: radu.id,
    startDate: daysFromNow(-60), endDate: daysFromNow(90),
    technologies: ['React Native', 'Firebase', 'TypeScript'],
    tags: ['mobil', 'sănătate'], faculty: 'ACE', department: 'Automatică',
    progressPercentage: 35,
  }));
  await logActivity(p2.id, radu.id, 'PROJECT_CREATED', `Proiectul „${p2.title}” a fost creat`);

  // P3 — Review, echipa Beta
  const p3 = await projectRepo.save(projectRepo.create({
    title: 'Platformă de învățare colaborativă',
    description: 'Spațiu online în care studenții pot crea grupuri de studiu, partaja materiale și urmări progresul comun la o disciplină.',
    type: ProjectType.BACHELOR_THESIS, status: ProjectStatus.REVIEW, priority: ProjectPriority.MEDIUM,
    coordinatorId: profMihai.id, createdById: radu.id, teamId: echipaBeta.id,
    startDate: daysFromNow(-150), endDate: daysFromNow(14),
    technologies: ['Next.js', 'NestJS', 'PostgreSQL'],
    tags: ['educație', 'colaborare'], faculty: 'ACE', department: 'Calculatoare',
    progressPercentage: 88,
  }));
  await logActivity(p3.id, radu.id, 'PROJECT_CREATED', `Proiectul „${p3.title}” a fost creat`);

  // P4 — Finalizat, cu evaluari complete
  const p4 = await projectRepo.save(projectRepo.create({
    title: 'Analiza automată a lucrărilor de licență',
    description: 'Instrument care verifică structura unei lucrări academice și semnalează secțiunile lipsă sau dezechilibrate ca dimensiune.',
    type: ProjectType.RESEARCH, status: ProjectStatus.COMPLETED, priority: ProjectPriority.HIGH,
    coordinatorId: profElena.id, createdById: ioana.id,
    startDate: daysFromNow(-240), endDate: daysFromNow(-30),
    technologies: ['Python', 'spaCy', 'Flask'],
    tags: ['cercetare', 'nlp'], faculty: 'ACE', department: 'Calculatoare',
    progressPercentage: 100,
  }));
  await logActivity(p4.id, ioana.id, 'PROJECT_CREATED', `Proiectul „${p4.title}” a fost creat`);

  // P5 — Propus
  const p5 = await projectRepo.save(projectRepo.create({
    title: 'Sistem de gestiune a laboratoarelor',
    description: 'Evidența echipamentelor din laboratoarele facultății, cu istoric al împrumuturilor și notificări la returnarea întârziată.',
    type: ProjectType.INDUSTRIAL, status: ProjectStatus.PROPOSED, priority: ProjectPriority.LOW,
    coordinatorId: profMihai.id, createdById: cristian.id,
    startDate: daysFromNow(-14), endDate: daysFromNow(120),
    technologies: ['Vue.js', 'Express', 'MySQL'],
    tags: ['industrial'], faculty: 'ACE', department: 'Electronică',
    progressPercentage: 5,
  }));
  await logActivity(p5.id, cristian.id, 'PROJECT_CREATED', `Proiectul „${p5.title}” a fost creat`);

  // P6 — Draft, fara coordonator si fara data de final (alerta in analiza)
  const p6 = await projectRepo.save(projectRepo.create({
    title: 'Chatbot pentru asistența studenților',
    description: 'Asistent conversațional care răspunde la întrebări frecvente despre orar, examene și proceduri administrative.',
    type: ProjectType.BACHELOR_THESIS, status: ProjectStatus.DRAFT, priority: ProjectPriority.MEDIUM,
    createdById: mariaPopa.id,
    startDate: daysFromNow(-5),
    technologies: ['Python', 'FastAPI'],
    tags: ['chatbot'], faculty: 'ACE', department: 'Calculatoare',
    progressPercentage: 0,
  }));
  await logActivity(p6.id, mariaPopa.id, 'PROJECT_CREATED', `Proiectul „${p6.title}” a fost creat`);

  // P7 — NOU — In progres, coordonat de Maria Ionescu
  const p7 = await projectRepo.save(projectRepo.create({
    title: 'Aplicație de gestionare a bibliotecii universitare',
    description: 'Platformă pentru evidența împrumuturilor de cărți, rezervări și notificări automate la apropierea termenului de restituire.',
    type: ProjectType.BACHELOR_THESIS, status: ProjectStatus.IN_PROGRESS, priority: ProjectPriority.MEDIUM,
    coordinatorId: profMaria.id, createdById: andrei.id,
    startDate: daysFromNow(-45), endDate: daysFromNow(75),
    technologies: ['Angular', 'Spring Boot', 'MySQL'],
    tags: ['biblioteca', 'evidenta'], faculty: 'ACE', department: 'Calculatoare',
    progressPercentage: 40,
  }));
  await logActivity(p7.id, andrei.id, 'PROJECT_CREATED', `Proiectul „${p7.title}” a fost creat`);

  // P8 — NOU — Aprobat, coordonat de Maria Ionescu
  const p8 = await projectRepo.save(projectRepo.create({
    title: 'Platformă de e-voting pentru consiliul studențesc',
    description: 'Sistem securizat de vot electronic pentru alegerile din consiliul studențesc, cu verificare a identității și numărare automată.',
    type: ProjectType.BACHELOR_THESIS, status: ProjectStatus.APPROVED, priority: ProjectPriority.HIGH,
    coordinatorId: profMaria.id, createdById: radu.id,
    startDate: daysFromNow(-10), endDate: daysFromNow(140),
    technologies: ['Next.js', 'NestJS', 'PostgreSQL'],
    tags: ['votare', 'securitate'], faculty: 'ACE', department: 'Automatică',
    progressPercentage: 8,
  }));
  await logActivity(p8.id, radu.id, 'PROJECT_CREATED', `Proiectul „${p8.title}” a fost creat`);

  // P9 — NOU — Finalizat, cu evaluare
  const p9 = await projectRepo.save(projectRepo.create({
    title: 'Sistem de recomandare a cursurilor opționale',
    description: 'Aplicație care sugerează cursuri opționale pe baza istoricului academic și a intereselor declarate de student.',
    type: ProjectType.RESEARCH, status: ProjectStatus.COMPLETED, priority: ProjectPriority.MEDIUM,
    coordinatorId: profMihai.id, createdById: cristian.id,
    startDate: daysFromNow(-200), endDate: daysFromNow(-20), finalGrade: 9,
    technologies: ['Python', 'scikit-learn', 'FastAPI'],
    tags: ['recomandare', 'cercetare'], faculty: 'ACE', department: 'Electronică',
    progressPercentage: 100,
  }));
  await logActivity(p9.id, cristian.id, 'PROJECT_CREATED', `Proiectul „${p9.title}” a fost creat`);

  // P10 — NOU — Respins, cu motiv
  const p10 = await projectRepo.save(projectRepo.create({
    title: 'Aplicație de car-sharing pentru campus',
    description: 'Platformă prin care studenții pot partaja deplasări cu mașina personală între campus și oraș.',
    type: ProjectType.BACHELOR_THESIS, status: ProjectStatus.REJECTED, priority: ProjectPriority.LOW,
    coordinatorId: profMihai.id, createdById: andrei.id,
    startDate: daysFromNow(-20),
    technologies: ['React Native', 'Firebase'],
    tags: ['mobilitate'], faculty: 'ACE', department: 'Calculatoare',
    progressPercentage: 0,
    rejectionReason: 'Tema se suprapune semnificativ cu un proiect deja în derulare din promoția anterioară.',
  }));
  await logActivity(p10.id, andrei.id, 'PROJECT_CREATED', `Proiectul „${p10.title}” a fost creat`);
  await logActivity(p10.id, profMihai.id, 'STATUS_CHANGED', 'Starea s-a schimbat din „Propus” în „Respins”');

  console.log('   10 proiecte create.');

  // MILESTONE-URI
  console.log('Creez milestone-urile...');

  await milestoneRepo.save([
    milestoneRepo.create({ projectId: p1.id, title: 'Studiu bibliografic și analiza cerințelor', dueDate: daysFromNow(-60), status: MilestoneStatus.COMPLETED, progressPercentage: 100, order: 0 }),
    milestoneRepo.create({ projectId: p1.id, title: 'Proiectarea arhitecturii și a bazei de date', dueDate: daysFromNow(-42), status: MilestoneStatus.COMPLETED, progressPercentage: 100, order: 1 }),
    milestoneRepo.create({ projectId: p1.id, title: 'Implementarea modulului de colectare date', dueDate: daysFromNow(-5), status: MilestoneStatus.OVERDUE, progressPercentage: 70, order: 2 }),
    milestoneRepo.create({ projectId: p1.id, title: 'Dezvoltarea interfeței de vizualizare', dueDate: daysFromNow(4), status: MilestoneStatus.IN_PROGRESS, progressPercentage: 40, order: 3 }),
    milestoneRepo.create({ projectId: p1.id, title: 'Testare și validare pe date reale', dueDate: daysFromNow(42), status: MilestoneStatus.PENDING, progressPercentage: 0, order: 4 }),
  ]);

  await milestoneRepo.save([
    milestoneRepo.create({ projectId: p2.id, title: 'Analiza și wireframes', dueDate: daysFromNow(-35), status: MilestoneStatus.COMPLETED, progressPercentage: 100, order: 0 }),
    milestoneRepo.create({ projectId: p2.id, title: 'Configurarea backend-ului', dueDate: daysFromNow(-21), status: MilestoneStatus.COMPLETED, progressPercentage: 100, order: 1 }),
    milestoneRepo.create({ projectId: p2.id, title: 'Ecranele principale ale aplicației', dueDate: daysFromNow(6), status: MilestoneStatus.IN_PROGRESS, progressPercentage: 50, order: 2 }),
    milestoneRepo.create({ projectId: p2.id, title: 'Integrarea notificărilor', dueDate: daysFromNow(35), status: MilestoneStatus.PENDING, progressPercentage: 0, order: 3 }),
  ]);

  await milestoneRepo.save([
    milestoneRepo.create({ projectId: p3.id, title: 'Definirea conceptului', dueDate: daysFromNow(-120), status: MilestoneStatus.COMPLETED, progressPercentage: 100, order: 0 }),
    milestoneRepo.create({ projectId: p3.id, title: 'Implementarea modulului de grupuri', dueDate: daysFromNow(-90), status: MilestoneStatus.COMPLETED, progressPercentage: 100, order: 1 }),
    milestoneRepo.create({ projectId: p3.id, title: 'Sistemul de partajare materiale', dueDate: daysFromNow(-42), status: MilestoneStatus.COMPLETED, progressPercentage: 100, order: 2 }),
    milestoneRepo.create({ projectId: p3.id, title: 'Testare finală și documentație', dueDate: daysFromNow(10), status: MilestoneStatus.IN_PROGRESS, progressPercentage: 75, order: 3 }),
  ]);

  await milestoneRepo.save([
    milestoneRepo.create({ projectId: p4.id, title: 'Studiul metodelor de procesare text', dueDate: daysFromNow(-210), status: MilestoneStatus.COMPLETED, progressPercentage: 100, order: 0 }),
    milestoneRepo.create({ projectId: p4.id, title: 'Implementarea analizorului', dueDate: daysFromNow(-120), status: MilestoneStatus.COMPLETED, progressPercentage: 100, order: 1 }),
    milestoneRepo.create({ projectId: p4.id, title: 'Evaluarea pe un corpus de lucrări', dueDate: daysFromNow(-60), status: MilestoneStatus.COMPLETED, progressPercentage: 100, order: 2 }),
    milestoneRepo.create({ projectId: p4.id, title: 'Redactarea articolului', dueDate: daysFromNow(-35), status: MilestoneStatus.COMPLETED, progressPercentage: 100, order: 3 }),
  ]);

  await milestoneRepo.save([
    milestoneRepo.create({ projectId: p5.id, title: 'Analiza cerințelor cu personalul tehnic', dueDate: daysFromNow(21), status: MilestoneStatus.PENDING, progressPercentage: 0, order: 0 }),
    milestoneRepo.create({ projectId: p5.id, title: 'Proiectarea modelului de date', dueDate: daysFromNow(49), status: MilestoneStatus.PENDING, progressPercentage: 0, order: 1 }),
  ]);

  await milestoneRepo.save([
    milestoneRepo.create({ projectId: p7.id, title: 'Analiza sistemului actual de evidență', dueDate: daysFromNow(-25), status: MilestoneStatus.COMPLETED, progressPercentage: 100, order: 0 }),
    milestoneRepo.create({ projectId: p7.id, title: 'Modulul de împrumuturi și rezervări', dueDate: daysFromNow(15), status: MilestoneStatus.IN_PROGRESS, progressPercentage: 45, order: 1 }),
    milestoneRepo.create({ projectId: p7.id, title: 'Notificări automate de restituire', dueDate: daysFromNow(55), status: MilestoneStatus.PENDING, progressPercentage: 0, order: 2 }),
  ]);

  await milestoneRepo.save([
    milestoneRepo.create({ projectId: p8.id, title: 'Specificarea cerințelor de securitate', dueDate: daysFromNow(30), status: MilestoneStatus.PENDING, progressPercentage: 0, order: 0 }),
  ]);

  await milestoneRepo.save([
    milestoneRepo.create({ projectId: p9.id, title: 'Colectarea datelor academice anonimizate', dueDate: daysFromNow(-180), status: MilestoneStatus.COMPLETED, progressPercentage: 100, order: 0 }),
    milestoneRepo.create({ projectId: p9.id, title: 'Antrenarea modelului de recomandare', dueDate: daysFromNow(-90), status: MilestoneStatus.COMPLETED, progressPercentage: 100, order: 1 }),
    milestoneRepo.create({ projectId: p9.id, title: 'Evaluarea acurateței recomandărilor', dueDate: daysFromNow(-25), status: MilestoneStatus.COMPLETED, progressPercentage: 100, order: 2 }),
  ]);

  console.log('   25 milestone-uri create.');

  // TASK-URI
  console.log('Creez task-urile...');

  await taskRepo.save([
    taskRepo.create({ projectId: p1.id, title: 'Configurarea brokerului MQTT', assigneeId: vlad.id, reporterId: vlad.id, priority: TaskPriority.HIGH, status: TaskStatus.DONE, dueDate: daysFromNow(-35) }),
    taskRepo.create({ projectId: p1.id, title: 'Schema tabelelor pentru măsurători', assigneeId: mariaPopa.id, reporterId: vlad.id, priority: TaskPriority.HIGH, status: TaskStatus.DONE, dueDate: daysFromNow(-30) }),
    taskRepo.create({ projectId: p1.id, title: 'Endpoint pentru recepția datelor', assigneeId: vlad.id, reporterId: vlad.id, priority: TaskPriority.CRITICAL, status: TaskStatus.DONE, dueDate: daysFromNow(-21) }),
    taskRepo.create({ projectId: p1.id, title: 'Graficul de consum pe intervale', assigneeId: andrei.id, reporterId: vlad.id, priority: TaskPriority.HIGH, status: TaskStatus.IN_PROGRESS, dueDate: daysFromNow(3) }),
    taskRepo.create({ projectId: p1.id, title: 'Configurarea pragurilor de alertă', assigneeId: mariaPopa.id, reporterId: vlad.id, priority: TaskPriority.MEDIUM, status: TaskStatus.IN_PROGRESS, dueDate: daysFromNow(8) }),
    taskRepo.create({ projectId: p1.id, title: 'Exportul rapoartelor lunare', reporterId: vlad.id, priority: TaskPriority.MEDIUM, status: TaskStatus.TODO, dueDate: daysFromNow(21) }),
    taskRepo.create({ projectId: p1.id, title: 'Documentația API-ului', reporterId: vlad.id, priority: TaskPriority.LOW, status: TaskStatus.TODO, dueDate: daysFromNow(35) }),
  ]);

  await taskRepo.save([
    taskRepo.create({ projectId: p2.id, title: 'Ecranul de autentificare', assigneeId: radu.id, reporterId: radu.id, priority: TaskPriority.HIGH, status: TaskStatus.DONE, dueDate: daysFromNow(-30) }),
    taskRepo.create({ projectId: p2.id, title: 'Lista medicilor disponibili', assigneeId: radu.id, reporterId: radu.id, priority: TaskPriority.HIGH, status: TaskStatus.IN_PROGRESS, dueDate: daysFromNow(4) }),
    taskRepo.create({ projectId: p2.id, title: 'Calendarul de rezervări', assigneeId: radu.id, reporterId: radu.id, priority: TaskPriority.CRITICAL, status: TaskStatus.IN_PROGRESS, dueDate: daysFromNow(9) }),
    taskRepo.create({ projectId: p2.id, title: 'Notificări push de reamintire', assigneeId: radu.id, reporterId: radu.id, priority: TaskPriority.MEDIUM, status: TaskStatus.TODO, dueDate: daysFromNow(30) }),
  ]);

  await taskRepo.save([
    taskRepo.create({ projectId: p3.id, title: 'Crearea și administrarea grupurilor', assigneeId: radu.id, reporterId: radu.id, priority: TaskPriority.HIGH, status: TaskStatus.DONE, dueDate: daysFromNow(-90) }),
    taskRepo.create({ projectId: p3.id, title: 'Încărcarea materialelor', assigneeId: cristian.id, reporterId: radu.id, priority: TaskPriority.HIGH, status: TaskStatus.DONE, dueDate: daysFromNow(-42) }),
    taskRepo.create({ projectId: p3.id, title: 'Comentarii pe materiale', assigneeId: cristian.id, reporterId: radu.id, priority: TaskPriority.MEDIUM, status: TaskStatus.DONE, dueDate: daysFromNow(-30) }),
    taskRepo.create({ projectId: p3.id, title: 'Redactarea manualului de utilizare', assigneeId: radu.id, reporterId: radu.id, priority: TaskPriority.MEDIUM, status: TaskStatus.IN_PROGRESS, dueDate: daysFromNow(8) }),
  ]);

  await taskRepo.save([
    taskRepo.create({ projectId: p4.id, title: 'Colectarea corpusului de lucrări', assigneeId: ioana.id, reporterId: ioana.id, priority: TaskPriority.HIGH, status: TaskStatus.DONE, dueDate: daysFromNow(-200) }),
    taskRepo.create({ projectId: p4.id, title: 'Implementarea segmentării pe capitole', assigneeId: ioana.id, reporterId: ioana.id, priority: TaskPriority.CRITICAL, status: TaskStatus.DONE, dueDate: daysFromNow(-150) }),
    taskRepo.create({ projectId: p4.id, title: 'Detectarea secțiunilor lipsă', assigneeId: ioana.id, reporterId: ioana.id, priority: TaskPriority.HIGH, status: TaskStatus.DONE, dueDate: daysFromNow(-90) }),
    taskRepo.create({ projectId: p4.id, title: 'Interfața web pentru încărcare', assigneeId: ioana.id, reporterId: ioana.id, priority: TaskPriority.MEDIUM, status: TaskStatus.DONE, dueDate: daysFromNow(-40) }),
  ]);

  await taskRepo.save([
    taskRepo.create({ projectId: p7.id, title: 'Modelarea bazei de date pentru cărți', assigneeId: andrei.id, reporterId: andrei.id, priority: TaskPriority.HIGH, status: TaskStatus.DONE, dueDate: daysFromNow(-20) }),
    taskRepo.create({ projectId: p7.id, title: 'Ecranul de căutare în catalog', assigneeId: andrei.id, reporterId: andrei.id, priority: TaskPriority.MEDIUM, status: TaskStatus.IN_PROGRESS, dueDate: daysFromNow(10) }),
    taskRepo.create({ projectId: p7.id, title: 'Fluxul de rezervare a unei cărți', reporterId: andrei.id, priority: TaskPriority.MEDIUM, status: TaskStatus.TODO, dueDate: daysFromNow(25) }),
  ]);

  await taskRepo.save([
    taskRepo.create({ projectId: p8.id, title: 'Documentarea cerințelor de securitate', assigneeId: radu.id, reporterId: radu.id, priority: TaskPriority.HIGH, status: TaskStatus.IN_PROGRESS, dueDate: daysFromNow(18) }),
  ]);

  await taskRepo.save([
    taskRepo.create({ projectId: p9.id, title: 'Preprocesarea datelor academice', assigneeId: cristian.id, reporterId: cristian.id, priority: TaskPriority.HIGH, status: TaskStatus.DONE, dueDate: daysFromNow(-170) }),
    taskRepo.create({ projectId: p9.id, title: 'Antrenarea și validarea modelului', assigneeId: cristian.id, reporterId: cristian.id, priority: TaskPriority.CRITICAL, status: TaskStatus.DONE, dueDate: daysFromNow(-95) }),
  ]);

  console.log('   24 task-uri create.');

  // EVALUARI
  console.log('Creez evaluarile...');

  // P4 — doua evaluari complete
  const evalP4Mid = await evaluationRepo.save(evaluationRepo.create({
    projectId: p4.id, evaluatorId: profElena.id, phase: EvaluationPhase.MIDTERM, status: EvaluationStatus.COMPLETED,
    totalScore: 85, maxScore: 100, completedAt: daysFromNow(-120),
    generalFeedback: 'Abordarea propusă este solidă, iar rezultatele preliminare sunt promițătoare. Recomand o analiză mai atentă a cazurilor în care structura lucrării se abate de la formatul standard.',
  }));
  await criteriaRepo.save([
    criteriaRepo.create({ evaluationId: evalP4Mid.id, name: 'Funcționalitate', score: 26, maxScore: 30, weight: 1 }),
    criteriaRepo.create({ evaluationId: evalP4Mid.id, name: 'Calitate cod', score: 21, maxScore: 25, weight: 1 }),
    criteriaRepo.create({ evaluationId: evalP4Mid.id, name: 'Documentație', score: 17, maxScore: 20, weight: 1 }),
    criteriaRepo.create({ evaluationId: evalP4Mid.id, name: 'Prezentare', score: 12, maxScore: 15, weight: 1 }),
    criteriaRepo.create({ evaluationId: evalP4Mid.id, name: 'Originalitate', score: 9, maxScore: 10, weight: 1 }),
  ]);

  const evalP4Final = await evaluationRepo.save(evaluationRepo.create({
    projectId: p4.id, evaluatorId: profElena.id, phase: EvaluationPhase.FINAL, status: EvaluationStatus.COMPLETED,
    totalScore: 90, maxScore: 100, completedAt: daysFromNow(-32),
    generalFeedback: 'Lucrare bine structurată, cu o implementare funcțională și o evaluare riguroasă pe un corpus real. Interfața web adaugă valoare practică.',
  }));
  await criteriaRepo.save([
    criteriaRepo.create({ evaluationId: evalP4Final.id, name: 'Funcționalitate', score: 28, maxScore: 30, weight: 1 }),
    criteriaRepo.create({ evaluationId: evalP4Final.id, name: 'Calitate cod', score: 22, maxScore: 25, weight: 1 }),
    criteriaRepo.create({ evaluationId: evalP4Final.id, name: 'Documentație', score: 18, maxScore: 20, weight: 1 }),
    criteriaRepo.create({ evaluationId: evalP4Final.id, name: 'Prezentare', score: 13, maxScore: 15, weight: 1 }),
    criteriaRepo.create({ evaluationId: evalP4Final.id, name: 'Originalitate', score: 9, maxScore: 10, weight: 1 }),
  ]);

  // P3 — o evaluare completa
  const evalP3 = await evaluationRepo.save(evaluationRepo.create({
    projectId: p3.id, evaluatorId: profMihai.id, phase: EvaluationPhase.MIDTERM, status: EvaluationStatus.COMPLETED,
    totalScore: 76, maxScore: 100, completedAt: daysFromNow(-40),
    generalFeedback: 'Modulele principale funcționează corect. Documentația are nevoie de completări, în special partea de instalare și configurare.',
  }));
  await criteriaRepo.save([
    criteriaRepo.create({ evaluationId: evalP3.id, name: 'Funcționalitate', score: 24, maxScore: 30, weight: 1 }),
    criteriaRepo.create({ evaluationId: evalP3.id, name: 'Calitate cod', score: 20, maxScore: 25, weight: 1 }),
    criteriaRepo.create({ evaluationId: evalP3.id, name: 'Documentație', score: 14, maxScore: 20, weight: 1 }),
    criteriaRepo.create({ evaluationId: evalP3.id, name: 'Prezentare', score: 11, maxScore: 15, weight: 1 }),
    criteriaRepo.create({ evaluationId: evalP3.id, name: 'Originalitate', score: 7, maxScore: 10, weight: 1 }),
  ]);

  // P9 — o evaluare completa (nou)
  const evalP9 = await evaluationRepo.save(evaluationRepo.create({
    projectId: p9.id, evaluatorId: profMihai.id, phase: EvaluationPhase.FINAL, status: EvaluationStatus.COMPLETED,
    totalScore: 81, maxScore: 100, completedAt: daysFromNow(-18),
    generalFeedback: 'Modelul de recomandare are o acuratețe bună pe setul de testare. Ar merita explorată și o comparație cu alte metode.',
  }));
  await criteriaRepo.save([
    criteriaRepo.create({ evaluationId: evalP9.id, name: 'Funcționalitate', score: 25, maxScore: 30, weight: 1 }),
    criteriaRepo.create({ evaluationId: evalP9.id, name: 'Calitate cod', score: 20, maxScore: 25, weight: 1 }),
    criteriaRepo.create({ evaluationId: evalP9.id, name: 'Documentație', score: 16, maxScore: 20, weight: 1 }),
    criteriaRepo.create({ evaluationId: evalP9.id, name: 'Prezentare', score: 12, maxScore: 15, weight: 1 }),
    criteriaRepo.create({ evaluationId: evalP9.id, name: 'Originalitate', score: 8, maxScore: 10, weight: 1 }),
  ]);

  // Criteriile standard, cu scor 0 — pregatite pentru evaluarile
  // ramase in asteptare, ca profesorul sa aiba ce completa la deschidere
  // (fara ele, pagina de evaluare arata 0/0 puncte, fara campuri de scor)
  const mkEmptyCriteria = (evaluationId: string) => ([
    criteriaRepo.create({ evaluationId, name: 'Funcționalitate', score: 0, maxScore: 30, weight: 1 }),
    criteriaRepo.create({ evaluationId, name: 'Calitate cod', score: 0, maxScore: 25, weight: 1 }),
    criteriaRepo.create({ evaluationId, name: 'Documentație', score: 0, maxScore: 20, weight: 1 }),
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
    await logActivity(projectId, uploadedById, 'DOCUMENT_UPLOADED', `Documentul „${name}” a fost încărcat`);
  };

  await mkDocument(p1.id, vlad.id, 'Analiza_cerintelor.pdf', 'Document de analiză a cerințelor pentru sistemul de monitorizare energetică.');
  await mkDocument(p1.id, mariaPopa.id, 'Schema_arhitecturii.pdf', 'Schema arhitecturii aplicației: frontend React, backend NestJS, baza de date PostgreSQL, comunicare prin MQTT.');
  await mkDocument(p1.id, vlad.id, 'Raport_intermediar.pdf', 'Raport intermediar privind stadiul implementarii.');
  await mkDocument(p3.id, radu.id, 'Manual_utilizare_draft.pdf', 'Manual de utilizare pentru platforma de învățare colaborativă. Varianta în lucru.');
  await mkDocument(p7.id, andrei.id, 'Specificatii_functionale.pdf', 'Specificațiile funcționale ale aplicației de gestionare a bibliotecii.');

  console.log('   5 documente create, cu fisiere reale pe disc.');

  // CONVERSATII DE CHAT
  console.log('Creez conversatiile...');

  const roomAlpha = await roomRepo.save(roomRepo.create({
    type: RoomType.TEAM, entityId: echipaAlpha.id,
    memberIds: [vlad.id, andrei.id, mariaPopa.id],
  }));

  await messageRepo.save(messageRepo.create({
    roomId: roomAlpha.id, senderId: andrei.id,
    content: 'Am terminat endpointul de recepție, datele intră corect în bază.',
    createdAt: messageTime(-2, 7),
  }));

  await messageRepo.save(messageRepo.create({
    roomId: roomAlpha.id, senderId: mariaPopa.id,
    content: `Perfect. @Vlad Stoica poți să începi graficul de consum, ai deja datele.`,
    createdAt: messageTime(-2, 14),
    reactions: { '👍': [andrei.id] },
  }));

  const msgVlad = await messageRepo.save(messageRepo.create({
    roomId: roomAlpha.id, senderId: vlad.id,
    content: 'Mă uit acum peste ele. Câte măsurători pe minut trimit senzorii?',
    createdAt: messageTime(-1, 21),
  }));

  await messageRepo.save(messageRepo.create({
    roomId: roomAlpha.id, senderId: andrei.id,
    content: 'Câte două pe minut, deocamdată.',
    parentId: msgVlad.id,
    createdAt: messageTime(-1, 28),
    reactions: { '✅': [mariaPopa.id, vlad.id] },
  }));

  // Atasamentele de chat stau in uploads/chat (acolo le cauta serverul la descarcare)
  const chatFile = writeDummyFile('Schema_tabelelor.txt', 'Schema tabelelor pentru măsurători:\n\n- sensor_readings(id, sensor_id, value, timestamp)\n- thresholds(id, project_id, min, max)', path.join(UPLOAD_DIR, 'chat'));
  await messageRepo.save(messageRepo.create({
    roomId: roomAlpha.id, senderId: mariaPopa.id,
    content: 'Am pus aici schema tabelelor, să fie la îndemână.',
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
    messageRepo.create({ roomId: roomBeta.id, senderId: radu.id, content: 'Manualul e pe jumătate scris, îl termin până vineri.', createdAt: messageTime(-3, 42) }),
    messageRepo.create({ roomId: roomBeta.id, senderId: cristian.id, content: 'Spune-mi dacă vrei să preiau partea de capturi de ecran.', createdAt: messageTime(-3, 49) }),
  ]);

  console.log('   2 camere de chat create, cu mentiuni, raspuns, reactii si atasament.');
  console.log('   ATENTIE: mentiunea catre Vlad din chat e doar vizuala (inserata direct in baza');
  console.log('   de date) — NU trimite email real. Pentru email real, trimite un mesaj NOU, cu @,');
  console.log('   din aplicatia pornita, autentificat cu alt cont decat al lui Vlad.');

  // COMENTARII
  console.log('Creez comentariile...');

  await commentRepo.save(commentRepo.create({
    projectId: p1.id, authorId: profMihai.id,
    content: 'Progresul arată bine. Aveți grijă să nu rămâneți în urmă cu modulul de vizualizare, e aproape de termen.',
  }));
  await logActivity(p1.id, profMihai.id, 'COMMENT_ADDED', 'A fost adăugat un comentariu');

  console.log('   1 comentariu creat.');

  // NOTIFICARI PRE-POPULATE
  // Inserate direct (nu trimit email)
  console.log('Creez notificarile...');

  const mkNotif = (data: Partial<Notification>) => notificationRepo.create({ isEmailSent: false, ...data });

  await notificationRepo.save([
    mkNotif({
      userId: vlad.id, type: NotificationType.MENTION,
      title: 'Ai fost menționat de Maria Popa',
      message: 'În Echipa Alpha: "Perfect. @Vlad Stoica poți să începi graficul de consum..."',
      actionUrl: '/chat', isRead: false, createdAt: daysFromNow(-2),
    }),
    mkNotif({
      userId: vlad.id, type: NotificationType.DEADLINE,
      title: 'Termen apropiat',
      message: `Etapa „Dezvoltarea interfeței de vizualizare” din proiectul „${p1.title}” are termen peste 4 zile.`,
      actionUrl: `/projects/${p1.id}`, entityType: 'project', entityId: p1.id,
      isRead: false, createdAt: daysFromNow(-1),
    }),
    mkNotif({
      userId: vlad.id, type: NotificationType.TEAM,
      title: 'Ai devenit liderul echipei Alpha',
      message: 'Ți-a fost atribuit rolul de lider pentru Echipa Alpha.',
      actionUrl: '/teams', isRead: true, createdAt: daysFromNow(-85),
    }),
    mkNotif({
      userId: vlad.id, type: NotificationType.SUCCESS,
      title: 'Proiect creat cu succes',
      message: `Proiectul „${p1.title}” a fost creat.`,
      actionUrl: `/projects/${p1.id}`, isRead: true, createdAt: daysFromNow(-90),
    }),
    mkNotif({
      userId: vlad.id, type: NotificationType.INFO,
      title: `Comentariu nou la „${p1.title}”`,
      message: 'Mihai Dobre: "Progresul arată bine. Aveți grijă să nu rămâneți în urmă..."',
      actionUrl: `/projects/${p1.id}`, entityType: 'project', entityId: p1.id,
      isRead: false, createdAt: daysFromNow(0),
    }),
  ]);

  await notificationRepo.save([
    mkNotif({
      userId: profMihai.id, type: NotificationType.EVALUATION,
      title: 'Evaluare în așteptare',
      message: `Proiectul „${p1.title}” are o evaluare de fază Propunere neîncepută.`,
      actionUrl: `/evaluations`, isRead: false, createdAt: daysFromNow(-3),
    }),
  ]);

  await notificationRepo.save([
    mkNotif({
      userId: profMaria.id, type: NotificationType.INFO,
      title: 'Proiect nou creat',
      message: `Andrei Ionescu a creat proiectul „${p7.title}”.`,
      actionUrl: `/projects/${p7.id}`, entityType: 'project', entityId: p7.id,
      isRead: false, createdAt: daysFromNow(-45),
    }),
    mkNotif({
      userId: profMaria.id, type: NotificationType.EVALUATION,
      title: 'Evaluare în așteptare',
      message: `Proiectul „${p7.title}” are o evaluare de fază Propunere neîncepută.`,
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