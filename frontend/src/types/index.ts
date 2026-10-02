export type UserRole = 'admin' | 'professor' | 'student';
export type UserStatus = 'active' | 'inactive' | 'suspended' | 'pending_verification' | 'pending_approval';

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  avatar?: string;
  phone?: string; // prezent doar pentru userul curent (login, /users/me)
  notificationPreferences?: Record<string, boolean>;
  isPinEnabled?: boolean;
  favoriteProjects?: string[];
  faculty?: string;
  department?: string;
  studyYear?: number;
  bio?: string;
  createdAt: string;
  updatedAt: string;
}

// Raspunsul login-ului: fie sesiunea completa, fie cererea pasului de PIN
export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  user: User;
}
export type LoginResponse = AuthSession | { pinRequired: true; pinToken: string };

export type ProjectStatus = 'draft' | 'proposed' | 'approved' | 'in_progress' | 'review' | 'completed' | 'archived' | 'rejected';
export type ProjectType = 'bachelor_thesis' | 'master_thesis' | 'research' | 'industrial' | 'open_source' | 'competition';
export type ProjectPriority = 'low' | 'medium' | 'high' | 'critical';

export interface Project {
  id: string;
  title: string;
  description: string;
  objectives?: string;
  type: ProjectType;
  status: ProjectStatus;
  priority: ProjectPriority;
  coordinatorId?: string;
  coordinator?: User;
  createdById: string;
  createdBy?: User;
  teamId?: string;
  team?: Team;
  rejectionReason?: string;
  startDate?: string;
  endDate?: string;
  repository?: string;
  demoUrl?: string;
  tags?: string[];
  technologies?: string[];
  faculty?: string;
  department?: string;
  academicYear?: number;
  finalGrade?: number;
  progressPercentage: number;
  isPublic: boolean;
  milestones?: Milestone[];
  tasks?: Task[];
  documents?: Document[];
  evaluations?: Evaluation[];
  createdAt: string;
  updatedAt: string;
}

export type MilestoneStatus = 'pending' | 'in_progress' | 'completed' | 'overdue';

export interface Milestone {
  id: string;
  title: string;
  description?: string;
  status: MilestoneStatus;
  dueDate: string;
  completedAt?: string;
  order: number;
  progressPercentage: number;
  deliverables?: string;
  projectId: string;
  tasks?: Task[];
  createdAt: string;
}

export type TaskStatus = 'todo' | 'in_progress' | 'in_review' | 'done' | 'blocked';
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  projectId?: string;
  project?: Project;
  milestoneId?: string;
  milestone?: Milestone;
  assigneeId?: string;
  assignee?: User;
  reporter: User;
  dueDate?: string;
  estimatedHours?: number;
  loggedHours?: number;
  order: number;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export type TeamRole = 'leader' | 'member';

export interface TeamMember {
  id: string;
  user: User;
  role: TeamRole;
  isActive: boolean;
  joinedAt: string;
}

export interface Team {
  id: string;
  name: string;
  description?: string;
  avatar?: string;
  maxMembers: number;
  isPublic: boolean;
  faculty?: string;
  department?: string;
  members: TeamMember[];
  createdAt: string;
}

export interface JoinRequest {
  id: string;
  teamId: string;
  userId?: string;
  user?: User;
  message?: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
}

export type DocumentType = 'thesis' | 'presentation' | 'report' | 'code' | 'media' | 'other';

export interface Document {
  id: string;
  name: string;
  description?: string;
  type: DocumentType;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  storagePath: string;
  uploadedById?: string;
  uploadedBy?: User;
  projectId?: string;
  milestoneId?: string;
  currentVersion: number;
  isPublic: boolean;
  tags?: string[];
  plagiarismScore?: number;
  versions?: DocumentVersion[];
  createdAt: string;
}

export interface DocumentVersion {
  id: string;
  version: number;
  filename: string;
  size: number;
  changelog?: string;
  uploadedBy: User;
  createdAt: string;
}

export type EvaluationStatus = 'draft' | 'in_progress' | 'completed';
export type EvaluationPhase = 'proposal' | 'midterm' | 'final' | 'defense';

export interface EvaluationCriteria {
  id: string;
  name: string;
  description?: string;
  score: number;
  maxScore: number;
  weight: number;
  feedback?: string;
}

export interface Evaluation {
  id: string;
  projectId: string;
  evaluatorId?: string;
  evaluator?: User | null;
  status: EvaluationStatus;
  phase: EvaluationPhase;
  totalScore?: number;
  maxScore?: number;
  generalFeedback?: string;
  strengths?: string;
  improvements?: string;
  completedAt?: string;
  criteria: EvaluationCriteria[];
  revisions?: EvaluationRevision[];
  project?: Project;
  createdAt: string;
}

// Corectura unei evaluari finalizate (scorurile vin ca text din coloanele decimal)
export interface EvaluationRevision {
  id: string;
  oldTotalScore: number | string;
  newTotalScore: number | string;
  reason: string;
  changedBy?: User | null;
  createdAt: string;
}

export type NotificationType = 'info' | 'success' | 'warning' | 'error' | 'deadline' | 'mention' | 'evaluation' | 'team' | 'system';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  actionUrl?: string;
  entityType?: string;
  entityId?: string;
  isRead: boolean;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  roomId: string;
  sender: User;
  content: string;
  type: string;
  isEdited: boolean;
  reactions?: Record<string, string[]>;
  createdAt: string;
}

export interface AiAnalysis {
  id: string;
  projectId: string;
  type: string;
  score?: number;
  result: Record<string, unknown>;
  summary?: string;
  recommendations?: string;
  createdAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
