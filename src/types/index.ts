export type UserRole = 'SUPER_ADMIN' | 'LAB_ADMIN' | 'FACULTY' | 'LAB_TECHNICIAN' | 'STUDENT';

export interface User {
  _id: string;
  fullName: string;
  email: string;
  collegeId: string;
  role: UserRole;
  department: string;
  year?: string;
  phone?: string;
  avatarUrl?: string;
  isVerified: boolean;
  isActive: boolean;
  safetyAcknowledgedDocs?: string[];
  createdAt: string;
}

export type EquipmentCategory =
  | 'Robotic Arms'
  | 'Mobile Robots'
  | 'Drones'
  | 'Arduino'
  | 'Raspberry Pi'
  | 'ESP32'
  | 'Sensors'
  | 'Motors'
  | 'Motor Drivers'
  | 'PLC'
  | 'CNC'
  | '3D Printers'
  | 'Cameras'
  | 'LiDAR'
  | 'Batteries'
  | 'Controllers'
  | 'Microcontrollers'
  | 'Power Supplies'
  | 'Tools'
  | 'Other';

export type EquipmentStatus =
  | 'AVAILABLE'
  | 'RESERVED'
  | 'IN_USE'
  | 'UNDER_MAINTENANCE'
  | 'DAMAGED'
  | 'LOST'
  | 'RETIRED';

export type EquipmentCondition = 'EXCELLENT' | 'GOOD' | 'FAIR' | 'DAMAGED';

export interface Equipment {
  _id: string;
  equipmentCode: string;
  assetTag: string;
  name: string;
  category: EquipmentCategory;
  manufacturer: string;
  model: string;
  serialNumber: string;
  description: string;
  purchaseDate?: string;
  purchaseCost?: number;
  warrantyExpiry?: string;
  laboratory: { _id: string; name: string; code: string; building?: string };
  room?: { _id: string; roomNumber: string; name: string };
  status: EquipmentStatus;
  condition: EquipmentCondition;
  specifications: Record<string, string>;
  image?: string;
  maintenanceIntervalDays: number;
  lastMaintenanceDate?: string;
  nextMaintenanceDate?: string;
  qrCodeData?: string;
  safetyDocumentRequired?: { _id: string; code: string; title: string };
  createdAt: string;
}

export type ReservationStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'CANCELLED'
  | 'ACTIVE'
  | 'COMPLETED'
  | 'NO_SHOW';

export interface Reservation {
  _id: string;
  equipment: Equipment;
  user: User;
  date: string;
  startTime: string;
  endTime: string;
  startDateTime: string;
  endDateTime: string;
  purpose: string;
  status: ReservationStatus;
  approvedBy?: User;
  approvedAt?: string;
  rejectionReason?: string;
  notes?: string;
  createdAt: string;
}

export type CheckoutStatus = 'CHECKED_OUT' | 'RETURNED' | 'OVERDUE' | 'DAMAGED_RETURN';

export interface Checkout {
  _id: string;
  equipment: Equipment;
  user: User;
  reservation?: string;
  issuedBy: User;
  checkoutTime: string;
  expectedReturnTime: string;
  actualReturnTime?: string;
  receivedBy?: User;
  conditionBefore: EquipmentCondition;
  conditionAfter?: EquipmentCondition;
  damageReported?: boolean;
  damageNotes?: string;
  notes?: string;
  status: CheckoutStatus;
  createdAt: string;
}

export interface InventoryItem {
  _id: string;
  componentCode: string;
  name: string;
  category: string;
  partNumber: string;
  manufacturer: string;
  quantity: number;
  minimumStock: number;
  maximumStock: number;
  unit: string;
  storageLocation: string;
  cost?: number;
  condition: 'NEW' | 'REFURBISHED' | 'TESTED';
}

export type TransactionType =
  | 'STOCK_IN'
  | 'STOCK_OUT'
  | 'ADJUSTMENT'
  | 'TRANSFER'
  | 'DAMAGED'
  | 'RETURNED';

export interface InventoryTransaction {
  _id: string;
  inventoryItem: InventoryItem;
  quantity: number;
  type: TransactionType;
  reason: string;
  user: User;
  previousQuantity: number;
  newQuantity: number;
  timestamp: string;
}

export type ComponentRequestStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'PARTIALLY_APPROVED'
  | 'ISSUED'
  | 'RETURNED';

export interface ComponentRequest {
  _id: string;
  project?: { _id: string; projectName: string; projectCode: string };
  requester: User;
  component: InventoryItem;
  requestedQuantity: number;
  approvedQuantity?: number;
  reason: string;
  requiredDate: string;
  status: ComponentRequestStatus;
  processedBy?: User;
  processedAt?: string;
  rejectionReason?: string;
  createdAt: string;
}

export type ProjectStatus =
  | 'IDEA'
  | 'PROPOSED'
  | 'APPROVED'
  | 'IN_PROGRESS'
  | 'TESTING'
  | 'COMPLETED'
  | 'ARCHIVED';

export type TeamMemberRole =
  | 'TEAM_LEAD'
  | 'HARDWARE'
  | 'SOFTWARE'
  | 'MECHANICAL'
  | 'RESEARCH'
  | 'DOCUMENTATION';

export interface Project {
  _id: string;
  projectCode: string;
  projectName: string;
  problemStatement: string;
  description: string;
  objectives: string[];
  category: string;
  status: ProjectStatus;
  startDate: string;
  endDate?: string;
  facultyMentor?: User;
  teamMembers: { user: User; role: TeamMemberRole; joinedAt: string }[];
  budget: number;
  progress: number;
  repositoryUrl?: string;
  feedback?: { faculty: User; text: string; date: string }[];
  createdBy: User;
  createdAt: string;
}

export interface ProjectMilestone {
  _id: string;
  project: string;
  title: string;
  description: string;
  dueDate: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE';
  progress: number;
  assignedMembers: User[];
}

export type MaintenanceType =
  | 'PREVENTIVE'
  | 'CORRECTIVE'
  | 'INSPECTION'
  | 'CALIBRATION'
  | 'REPAIR';

export type MaintenanceStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface Maintenance {
  _id: string;
  equipment: Equipment;
  maintenanceType: MaintenanceType;
  description: string;
  technician?: User;
  startDate: string;
  completionDate?: string;
  cost: number;
  partsUsed: string[];
  notes?: string;
  status: MaintenanceStatus;
  createdAt: string;
}

export type IssueSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type IssueStatus = 'OPEN' | 'ACKNOWLEDGED' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';

export interface IssueReport {
  _id: string;
  equipment: Equipment;
  reporter: User;
  category: string;
  description: string;
  severity: IssueSeverity;
  status: IssueStatus;
  images: string[];
  assignedTechnician?: User;
  resolutionNotes?: string;
  resolvedAt?: string;
  createdAt: string;
}

export interface SafetyDocument {
  _id: string;
  code: string;
  title: string;
  category: string;
  version: string;
  summary: string;
  rules: string[];
  emergencyProcedures: string[];
  requiredForCategories: string[];
  isActive: boolean;
}

export interface SafetyAcknowledgement {
  _id: string;
  user: string;
  safetyDocument: SafetyDocument;
  version: string;
  acknowledgedAt: string;
}

export interface NotificationItem {
  _id: string;
  title: string;
  message: string;
  type: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
}

export interface AuditLog {
  _id: string;
  actor?: User;
  action: string;
  entity: string;
  entityId?: string;
  details?: string;
  before?: any;
  after?: any;
  ip?: string;
  userAgent?: string;
  createdAt: string;
}

export interface UserSession {
  _id: string;
  device: string;
  browser: string;
  ip: string;
  lastActiveAt: string;
  expiresAt: string;
  revoked: boolean;
  createdAt: string;
}
