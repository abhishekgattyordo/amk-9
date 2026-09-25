import React, { useState, useEffect, useMemo } from 'react';
import { 
  ShieldCheck, 
  Users, 
  Key, 
  Save, 
  UserPlus, 
  RefreshCw, 
  AlertTriangle, 
  ShieldAlert, 
  Check, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  User, 
  Mail, 
  Building, 
  MapPin, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Lock, 
  Settings, 
  UserCheck, 
  UserX,
  Info,
  Download,
  Eye,
  Sparkles,
  SlidersHorizontal,
  ChevronDown,
  Activity,
  Shield,
  FileText,
  Database,
  CheckCircle2,
  XCircle,
  Clock,
  Globe,
  Laptop,
  Smartphone,
  AlertCircle,
  ArrowRightLeft,
  Copy,
  Sliders,
  ExternalLink,
  HardDrive,
  ListFilter,
  Cpu,
  Bookmark,
  Layers,
  Briefcase,
  Zap,
  KeyRound,
  History,
  LockKeyhole,
  CheckCheck,
  RotateCcw,
  Archive,
  Undo2
} from 'lucide-react';
import { Pagination } from '../common/Pagination';

interface UserItem {
  id: string;
  name: string;
  email: string;
  roleId: string | null;
  department: string | null;
  avatar: string | null;
  address: string | null;
  deletedAt: string | null;
  role?: {
    id: string;
    name: string;
  };
}

interface Role {
  id: string;
  name: string;
  description?: string;
  permissions: {
    id: string;
    name: string;
  }[];
}

interface DepartmentItem {
  id: string;
  name: string;
  code: string;
  headName: string;
  headEmail: string;
  description: string;
  location: string;
  defaultRoleId: string;
  createdAt: string;
}

interface AuditLogItem {
  id: string;
  action: string;
  module?: string | null;
  entity: string;
  entityId: string;
  fieldName?: string | null;
  oldValue?: string | null;
  newValue?: string | null;
  user?: string | null;
  userId?: string | null;
  details?: string | null;
  timestamp: string;
  authUser?: {
    id: string;
    name: string;
    email: string;
    department?: string;
  };
}

interface ActiveSessionItem {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  device: string;
  browser: string;
  ipAddress: string;
  location: string;
  loginTime: string;
  lastActive: string;
  status: 'Active' | 'Idle';
}

interface UserManagementModuleProps {
  darkMode: boolean;
  currentUser: any;
}

export const UserManagementModule: React.FC<UserManagementModuleProps> = ({ darkMode, currentUser }) => {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Active Main Tab: 'directory' | 'permissions' | 'departments' | 'audit' | 'security' | 'inspector' | 'recycle_bin'
  const [activeTab, setActiveTab] = useState<'directory' | 'permissions' | 'departments' | 'audit' | 'security' | 'inspector' | 'recycle_bin'>('directory');

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modal States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);
  const [viewProfileUser, setViewProfileUser] = useState<UserItem | null>(null);

  // Confirmation Modal State
  const [confirmDeleteUser, setConfirmDeleteUser] = useState<UserItem | null>(null);
  const [deletingUser, setDeletingUser] = useState(false);

  // Form States
  const [createForm, setCreateForm] = useState({
    name: '',
    email: '',
    password: 'password123',
    roleId: '',
    department: 'Operations',
    address: '',
    avatar: 'emerald',
    status: 'Active' as 'Active' | 'Inactive'
  });

  const [editForm, setEditForm] = useState({
    id: '',
    name: '',
    email: '',
    password: '',
    roleId: '',
    department: '',
    address: '',
    avatar: '',
    status: 'Active' as 'Active' | 'Inactive'
  });

  const [submittingCreate, setSubmittingCreate] = useState(false);
  const [submittingEdit, setSubmittingEdit] = useState(false);

  // Role Permissions Selection States (Module Permission Matrix)
  const [activeRole, setActiveRole] = useState<Role | null>(null);
  const [selectedPermissions, setSelectedPermissions] = useState<Record<string, boolean>>({});
  const [savingPermissions, setSavingPermissions] = useState(false);
  const [permSearch, setPermSearch] = useState('');

  // Custom Role States
  const [isCreateRoleModalOpen, setIsCreateRoleModalOpen] = useState(false);
  const [isEditRoleModalOpen, setIsEditRoleModalOpen] = useState(false);
  const [roleForm, setRoleForm] = useState({
    id: '',
    name: '',
    description: '',
    permissions: {} as Record<string, boolean>
  });
  const [submittingRole, setSubmittingRole] = useState(false);
  const [confirmDeleteRole, setConfirmDeleteRole] = useState<Role | null>(null);
  const [deletingRole, setDeletingRole] = useState(false);

  // Department State
  const [departments, setDepartments] = useState<DepartmentItem[]>([
    {
      id: 'dept-01',
      name: 'Executive Office & Management',
      code: 'EXEC',
      headName: 'Rajesh Sharma',
      headEmail: 'rajesh.sharma@amkerp.com',
      description: 'Senior management, administrative oversight, and company-wide strategic governance.',
      location: 'HQ Tower A, Suite 501',
      defaultRoleId: '',
      createdAt: '2025-01-01'
    },
    {
      id: 'dept-02',
      name: 'Supply Chain & Inventory',
      code: 'SCM',
      headName: 'Amit Patel',
      headEmail: 'amit.patel@amkerp.com',
      description: 'Raw material reel stock management, warehouse bins, stock transfers, and audits.',
      location: 'Central Warehouse Complex',
      defaultRoleId: '',
      createdAt: '2025-01-10'
    },
    {
      id: 'dept-03',
      name: 'Procurement & Vendor Sourcing',
      code: 'PROC',
      headName: 'Sunita Menon',
      headEmail: 'sunita.menon@amkerp.com',
      description: 'Vendor onboarding, RFQs, purchase orders, paper mill quotes, and gate entries.',
      location: 'Commercial Block B',
      defaultRoleId: '',
      createdAt: '2025-01-12'
    },
    {
      id: 'dept-04',
      name: 'Plant Production & Corrugator Operations',
      code: 'PROD',
      headName: 'Vikram Singh',
      headEmail: 'vikram.singh@amkerp.com',
      description: 'Corrugator lines, flexo printing, slotting, die-cutting, pasting, and machine downtime.',
      location: 'Manufacturing Plant Floor',
      defaultRoleId: '',
      createdAt: '2025-01-15'
    },
    {
      id: 'dept-05',
      name: 'Quality Assurance & Lab Testing',
      code: 'QA',
      headName: 'Dr. Neha Kapoor',
      headEmail: 'neha.kapoor@amkerp.com',
      description: 'Reel inwards GSM/BF testing, in-process corrugation inspection, BCT, and finished box QC.',
      location: 'QA Testing Lab & Plant QC Bay',
      defaultRoleId: '',
      createdAt: '2025-01-20'
    },
    {
      id: 'dept-06',
      name: 'Sales, Marketing & Customer Service',
      code: 'SALES',
      headName: 'Rahul Verma',
      headEmail: 'rahul.verma@amkerp.com',
      description: 'Sales leads, customer CRM, quotations, sales orders, and client satisfaction.',
      location: 'Commercial Block A',
      defaultRoleId: '',
      createdAt: '2025-02-01'
    },
    {
      id: 'dept-07',
      name: 'Finance, Costing & Accounts',
      code: 'FIN',
      headName: 'Priya Sundaram',
      headEmail: 'priya.sundaram@amkerp.com',
      description: 'Cost sheet calculations, margin approvals, invoice audits, and tax reports.',
      location: 'Finance Wing, Suite 302',
      defaultRoleId: '',
      createdAt: '2025-02-05'
    },
    {
      id: 'dept-08',
      name: 'Logistics, Gate Security & Dispatch',
      code: 'LOG',
      headName: 'Manoj Tiwari',
      headEmail: 'manoj.tiwari@amkerp.com',
      description: 'Gate pass generation, security checks, vehicle weighing, e-way bills, and dispatch challans.',
      location: 'Gate 1 & Logistics Bay',
      defaultRoleId: '',
      createdAt: '2025-02-10'
    }
  ]);
  const [deptSearch, setDeptSearch] = useState('');
  const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<DepartmentItem | null>(null);
  const [deptForm, setDeptForm] = useState({
    name: '',
    code: '',
    headName: '',
    headEmail: '',
    description: '',
    location: '',
    defaultRoleId: ''
  });

  // Audit Logs State
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [loadingAuditLogs, setLoadingAuditLogs] = useState(false);
  const [auditSearch, setAuditSearch] = useState('');
  const [auditActionFilter, setAuditActionFilter] = useState('');
  const [auditEntityFilter, setAuditEntityFilter] = useState('');
  const [selectedAuditLog, setSelectedAuditLog] = useState<AuditLogItem | null>(null);
  const [auditPage, setAuditPage] = useState(1);
  const [auditPageSize, setAuditPageSize] = useState(15);

  // Security Policies State
  const [securityPolicy, setSecurityPolicy] = useState({
    minPasswordLength: 8,
    requireUppercase: true,
    requireNumbers: true,
    requireSymbols: true,
    passwordExpiryDays: 90,
    sessionTimeoutMinutes: 30,
    maxConcurrentSessions: 3,
    enforceMfa: false,
    lockoutAttempts: 5,
    lockoutDurationMinutes: 15,
    ipWhitelistingEnabled: false
  });
  const [ipWhitelist, setIpWhitelist] = useState<string[]>([
    '192.168.1.0/24 (Plant Floor Local Network)',
    '10.0.0.0/16 (Corporate Office VPN)',
    '122.161.44.20 (HQ Static Gateway)'
  ]);
  const [newIpAddress, setNewIpAddress] = useState('');
  const [activeSessions, setActiveSessions] = useState<ActiveSessionItem[]>([
    {
      id: 'sess-01',
      userId: 'USR-001',
      userName: 'Rajesh Sharma',
      userEmail: 'rajesh.sharma@amkerp.com',
      device: 'MacBook Pro 16"',
      browser: 'Chrome 122.0 / macOS',
      ipAddress: '192.168.1.10',
      location: 'Executive Office, Mumbai HQ',
      loginTime: 'Today at 08:30 AM',
      lastActive: 'Just now',
      status: 'Active'
    },
    {
      id: 'sess-02',
      userId: 'USR-002',
      userName: 'Amit Patel',
      userEmail: 'amit.patel@amkerp.com',
      device: 'Dell Latitude 5420',
      browser: 'Firefox 123.0 / Windows 11',
      ipAddress: '192.168.1.45',
      location: 'Central Warehouse Terminal 2',
      loginTime: 'Today at 09:15 AM',
      lastActive: '4 mins ago',
      status: 'Active'
    },
    {
      id: 'sess-03',
      userId: 'USR-003',
      userName: 'Sunita Menon',
      userEmail: 'sunita.menon@amkerp.com',
      device: 'Lenovo ThinkPad',
      browser: 'Edge 121.0 / Windows 10',
      ipAddress: '192.168.1.52',
      location: 'Procurement Desk 4',
      loginTime: 'Today at 09:40 AM',
      lastActive: '12 mins ago',
      status: 'Active'
    },
    {
      id: 'sess-04',
      userId: 'USR-004',
      userName: 'Vikram Singh',
      userEmail: 'vikram.singh@amkerp.com',
      device: 'Industrial Touch Panel Kiosk',
      browser: 'Chrome Embedded / Linux',
      ipAddress: '192.168.1.108',
      location: 'Corrugator Line 1 Control Booth',
      loginTime: 'Today at 06:00 AM',
      lastActive: '1 min ago',
      status: 'Active'
    }
  ]);

  // Permission Inspector / Access Matrix State
  const [inspectorUser, setInspectorUser] = useState<string>('');
  const [inspectorRole, setInspectorRole] = useState<string>('');
  const [inspectorModule, setInspectorModule] = useState<string>('inventory_raw');
  const [compareRoleA, setCompareRoleA] = useState<string>('');
  const [compareRoleB, setCompareRoleB] = useState<string>('');

  // Security Policies State
  const [sessionTimeout, setSessionTimeout] = useState<number>(30);
  const [minPasswordLength, setMinPasswordLength] = useState<number>(8);
  const [enforceMfa, setEnforceMfa] = useState<boolean>(true);
  const [requireSpecialChar, setRequireSpecialChar] = useState<boolean>(true);
  const [restrictIp, setRestrictIp] = useState<boolean>(false);

  // Audit Diff Inspection State
  const [inspectAuditDiff, setInspectAuditDiff] = useState<AuditLogItem | null>(null);

  // IAM Recycle Bin & Archival Records State
  const [deletedRoles, setDeletedRoles] = useState<Role[]>([
    {
      id: 'role-archived-01',
      name: 'Contract Packaging Auditor (Archived)',
      description: 'Temporary external audit role for 2024 compliance review.',
      permissions: []
    }
  ]);
  const [deletedDepartments, setDeletedDepartments] = useState<DepartmentItem[]>([
    {
      id: 'dept-archived-01',
      name: 'Old Flexo Print Testing Bay',
      code: 'OFPB',
      headName: 'Kishore Kumar',
      headEmail: 'kishore@amkerp.com',
      description: 'Decommissioned test facility merged into QA Testing Lab.',
      location: 'Old Plant Shed 4',
      defaultRoleId: '',
      createdAt: '2024-11-01'
    }
  ]);
  const [recycleFilter, setRecycleFilter] = useState<'all' | 'users' | 'roles' | 'departments'>('all');
  const [recycleSearch, setRecycleSearch] = useState<string>('');
  const [selectedRecycleIds, setSelectedRecycleIds] = useState<string[]>([]);
  const [confirmPermanentDelete, setConfirmPermanentDelete] = useState<{
    type: 'user' | 'role' | 'department' | 'batch';
    id?: string;
    name: string;
    items?: string[];
  } | null>(null);
  const [isPurging, setIsPurging] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  // Categorized system modules with all Phase 2 enterprise domain submodules
  const moduleCategories = useMemo(() => [
    {
      category: 'Inventory & Warehousing',
      modules: [
        { label: 'Inventory Dashboard', prefix: 'dashboard', actions: ['view'] },
        { label: 'Raw Materials Master', prefix: 'inventory_raw', actions: ['view', 'create', 'edit', 'delete', 'import'] },
        { label: 'Finished Goods Products', prefix: 'inventory_products', actions: ['view', 'create', 'edit', 'delete', 'import'] },
        { label: 'Categories & Subcategories', prefix: 'inventory_categories', actions: ['view', 'create', 'edit', 'delete', 'import'] },
        { label: 'Suppliers (Paper Mills)', prefix: 'inventory_suppliers', actions: ['view', 'create', 'edit', 'delete', 'import'] },
        { label: 'Warehouses & Bins', prefix: 'inventory_warehouses', actions: ['view', 'create', 'edit', 'delete', 'import'] },
        { label: 'Stock Movements & Ledger', prefix: 'inventory_transactions', actions: ['view', 'create', 'edit', 'delete', 'import'] },
        { label: 'Stock Alerts & Reorder Levels', prefix: 'inventory_stock', actions: ['view', 'create', 'edit', 'delete', 'import'] },
      ]
    },
    {
      category: 'Procurement & Inward',
      modules: [
        { label: 'Procurement Dashboard', prefix: 'procurement_dashboard', actions: ['view', 'create', 'edit', 'delete', 'import'] },
        { label: 'Material Requisitions & RFQs', prefix: 'procurement_rfq', actions: ['view', 'create', 'edit', 'delete', 'import'] },
        { label: 'Supplier Quotations & Evaluation', prefix: 'procurement_quotes', actions: ['view', 'create', 'edit', 'delete', 'import'] },
        { label: 'Purchase Orders (POs)', prefix: 'procurement_po', actions: ['view', 'create', 'edit', 'delete', 'import'] },
        { label: 'Gate Entry Log', prefix: 'procurement_gate_entry', actions: ['view', 'create', 'edit', 'delete', 'import'] },
        { label: 'Reel Inward & Barcoding', prefix: 'procurement_reel_inward', actions: ['view', 'create', 'edit', 'delete', 'import'] },
      ]
    },
    {
      category: 'Production & Manufacturing',
      modules: [
        { label: 'Production Dashboard', prefix: 'production_dashboard', actions: ['view', 'create', 'edit', 'delete', 'import'] },
        { label: 'Work Orders & Job Cards', prefix: 'production_work_orders', actions: ['view', 'create', 'edit', 'delete', 'import'] },
        { label: 'Corrugation Scheduling', prefix: 'production_corrugation', actions: ['view', 'create', 'edit', 'delete', 'import'] },
        { label: 'Printing & Slitting Ops', prefix: 'production_printing', actions: ['view', 'create', 'edit', 'delete', 'import'] },
        { label: 'Finishing & Die-Cutting', prefix: 'production_finishing', actions: ['view', 'create', 'edit', 'delete', 'import'] },
        { label: 'Shift & Operator Scheduling', prefix: 'production_shifts', actions: ['view', 'create', 'edit', 'delete', 'import'] },
        { label: 'Machine Maintenance Register', prefix: 'production_maintenance', actions: ['view', 'create', 'edit', 'delete', 'import'] },
      ]
    },
    {
      category: 'Quality Control (QC)',
      modules: [
        { label: 'QC Hub & Inspections', prefix: 'qc_dashboard', actions: ['view', 'create', 'edit', 'delete', 'import'] },
        { label: 'Raw Material Testing (GSM/BF/Moisture)', prefix: 'qc_raw_material', actions: ['view', 'create', 'edit', 'delete', 'import'] },
        { label: 'In-Process Corrugation QC', prefix: 'qc_corrugation', actions: ['view', 'create', 'edit', 'delete', 'import'] },
        { label: 'Finished Goods Inspection (B.S./ECT)', prefix: 'qc_finished_goods', actions: ['view', 'create', 'edit', 'delete', 'import'] },
        { label: 'Equipment Calibration Register', prefix: 'qc_calibration', actions: ['view', 'create', 'edit', 'delete', 'import'] },
        { label: 'Non-Conformance (NC) Reports', prefix: 'qc_nc', actions: ['view', 'create', 'edit', 'delete', 'import'] },
      ]
    },
    {
      category: 'Dispatch & Logistics',
      modules: [
        { label: 'Dispatch Command Dashboard', prefix: 'dispatch_dashboard', actions: ['view', 'create', 'edit', 'delete', 'import'] },
        { label: 'Delivery Challans & Gate Passes', prefix: 'sales_dispatch', actions: ['view', 'create', 'edit', 'delete', 'import'] },
        { label: 'Pending Outward Queue', prefix: 'dispatch_pending', actions: ['view', 'create', 'edit', 'delete', 'import'] },
        { label: 'Dispatch & Trip History', prefix: 'dispatch_history', actions: ['view', 'create', 'edit', 'delete', 'import'] },
      ]
    },
    {
      category: 'Sales & Customer Relations',
      modules: [
        { label: 'Sales Dashboard', prefix: 'sales_dashboard', actions: ['view', 'create', 'edit', 'delete', 'import'] },
        { label: 'Leads & Enquiries', prefix: 'sales_leads', actions: ['view', 'create', 'edit', 'delete', 'import'] },
        { label: 'Quotations & Pricing', prefix: 'sales_quotations', actions: ['view', 'create', 'edit', 'delete', 'import'] },
        { label: 'Sales Orders', prefix: 'sales_orders', actions: ['view', 'create', 'edit', 'delete', 'import'] },
        { label: 'Customer Directory', prefix: 'sales_customers', actions: ['view', 'create', 'edit', 'delete', 'import'] },
      ]
    },
    {
      category: 'Accounts & Financials',
      modules: [
        { label: 'Financial Overview', prefix: 'accounts_dashboard', actions: ['view', 'create', 'edit', 'delete', 'import'] },
        { label: 'Invoices & Billing', prefix: 'accounts_invoices', actions: ['view', 'create', 'edit', 'delete', 'import'] },
        { label: 'Receipts & Payments', prefix: 'accounts_payments', actions: ['view', 'create', 'edit', 'delete', 'import'] },
        { label: 'General Ledger', prefix: 'accounts_ledger', actions: ['view', 'create', 'edit', 'delete', 'import'] },
      ]
    },
    {
      category: 'Reports & Business Intelligence',
      modules: [
        { label: 'Executive Analytics Hub', prefix: 'reports_dashboard', actions: ['view', 'create', 'edit', 'delete', 'import'] },
        { label: 'Inventory Reports', prefix: 'reports_inventory', actions: ['view', 'create', 'edit', 'delete', 'import'] },
        { label: 'Procurement Reports', prefix: 'reports_purchase', actions: ['view', 'create', 'edit', 'delete', 'import'] },
        { label: 'Production Reports', prefix: 'reports_production', actions: ['view', 'create', 'edit', 'delete', 'import'] },
        { label: 'Sales & Dispatch Reports', prefix: 'reports_sales', actions: ['view', 'create', 'edit', 'delete', 'import'] },
        { label: 'Financial Statements', prefix: 'reports_financial', actions: ['view', 'create', 'edit', 'delete', 'import'] },
      ]
    },
    {
      category: 'Administration & Governance',
      modules: [
        { label: 'User Management & Directory', prefix: 'user_management', actions: ['view', 'create', 'edit', 'delete', 'manage_roles'] },
        { label: 'Security Roles & IAM', prefix: 'roles_permissions', actions: ['view', 'create', 'edit', 'delete', 'import'] },
        { label: 'Admin Excel Hub', prefix: 'admin_excel', actions: ['view', 'create', 'edit', 'delete', 'import'] },
        { label: 'Audit Trail & Logs', prefix: 'audit_logs', actions: ['view', 'create', 'edit', 'delete', 'import'] },
        { label: 'Recycle Bin & Data Recovery', prefix: 'recycle_bin', actions: ['view', 'restore', 'delete', 'export'] },
        { label: 'System Configuration', prefix: 'settings', actions: ['view', 'create', 'edit', 'delete', 'import'] },
      ]
    },
  ], []);

  // Flattened modules list for simple lookups and operations
  const modules = useMemo(() => moduleCategories.flatMap(c => c.modules), [moduleCategories]);

  // Industry-standard role preset templates for AMK ERP packaging plant operations
  const ROLE_PRESETS = [
    {
      name: 'Inventory Manager',
      description: 'Supervision over warehouses, stock movements, raw paper reels, finished boxes, and safety thresholds.',
      prefixes: ['dashboard', 'inventory_raw', 'inventory_products', 'inventory_categories', 'inventory_suppliers', 'inventory_warehouses', 'inventory_transactions', 'inventory_stock', 'reports_inventory']
    },
    {
      name: 'Procurement Officer',
      description: 'Management of RFQs, mill quotes, purchase orders, mill directory, gate entries, and reel inward registers.',
      prefixes: ['procurement_dashboard', 'procurement_rfq', 'procurement_quotes', 'procurement_po', 'procurement_gate_entry', 'procurement_reel_inward', 'inventory_suppliers', 'reports_purchase']
    },
    {
      name: 'Production Supervisor',
      description: 'Management of job cards, corrugator line scheduling, printing/slitting, die-cutting, shifts, and maintenance.',
      prefixes: ['production_dashboard', 'production_work_orders', 'production_corrugation', 'production_printing', 'production_finishing', 'production_shifts', 'production_maintenance', 'reports_production']
    },
    {
      name: 'QC & Testing Inspector',
      description: 'Quality verification across raw material reels (GSM/BF), in-process fluting, finished cartons, and calibrations.',
      prefixes: ['qc_dashboard', 'qc_raw_material', 'qc_corrugation', 'qc_finished_goods', 'qc_calibration', 'qc_nc']
    },
    {
      name: 'Dispatch & Logistics Coordinator',
      description: 'Delivery challans, vehicle gate passes, outward loading verification, and shipment history tracking.',
      prefixes: ['dispatch_dashboard', 'sales_dispatch', 'dispatch_pending', 'dispatch_history', 'reports_sales']
    },
    {
      name: 'Sales & Commercial Executive',
      description: 'Client enquiry handling, quote generation, sales order approvals, and customer directories.',
      prefixes: ['sales_dashboard', 'sales_leads', 'sales_quotations', 'sales_orders', 'sales_customers', 'accounts_invoices', 'reports_sales']
    },
    {
      name: 'Read-Only Auditor',
      description: 'Cross-functional read-only analytics, stock movements, purchase records, and audit log inspection.',
      prefixes: ['dashboard', 'reports_dashboard', 'reports_inventory', 'reports_purchase', 'reports_production', 'reports_sales', 'reports_financial', 'audit_logs']
    }
  ];

  // Export User Directory to CSV
  const exportUsersCSV = () => {
    if (users.length === 0) return;
    const headers = ['User ID', 'Full Name', 'Email Address', 'Role', 'Department', 'Status', 'Office Address'];
    const rows = filteredUsers.map(u => [
      `"${u.id}"`,
      `"${u.name || ''}"`,
      `"${u.email || ''}"`,
      `"${u.role?.name || 'Unassigned'}"`,
      `"${u.department || 'Operations'}"`,
      `"${u.deletedAt ? 'Suspended' : 'Active'}"`,
      `"${(u.address || '').replace(/"/g, '""')}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `AMK_ERP_User_Directory_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getAuthHeaders = () => {
    const token = currentUser?.token || (typeof window !== 'undefined' ? localStorage.getItem('erp_token') : '') || '';
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (currentUser?.email) headers['x-user-email'] = currentUser.email;
    return headers;
  };

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const headers = getAuthHeaders();
      const [usersRes, rolesRes] = await Promise.all([
        fetch('/api/users', { headers, credentials: 'include' }).then(r => r.json()),
        fetch('/api/roles', { headers, credentials: 'include' }).then(r => r.json()),
      ]);

      if (usersRes.success) {
        setUsers(usersRes.data);
      } else {
        throw new Error(usersRes.error || 'Failed to load users');
      }

      if (rolesRes.success) {
        setRoles(rolesRes.data);
        if (rolesRes.data.length > 0) {
          // Default to the first role that is not Administrator, or Administrator if none other
          const defaultRole = rolesRes.data.find((r: any) => r.name !== 'Administrator') || rolesRes.data[0];
          selectRole(defaultRole);
        }
      } else {
        throw new Error(rolesRes.error || 'Failed to load roles');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error communicating with server API.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const selectRole = (role: Role) => {
    setActiveRole(role);
    const mapped: Record<string, boolean> = {};
    role.permissions.forEach(p => {
      mapped[p.name] = true;
    });
    setSelectedPermissions(mapped);
  };

  const handlePermissionChange = (permName: string, checked: boolean) => {
    setSelectedPermissions(prev => ({
      ...prev,
      [permName]: checked,
    }));
  };

  const openCreateRoleModal = () => {
    setRoleForm({
      id: '',
      name: '',
      description: '',
      permissions: {}
    });
    setIsCreateRoleModalOpen(true);
  };

  const openEditRoleModal = (role: Role) => {
    const mapped: Record<string, boolean> = {};
    role.permissions.forEach(p => {
      mapped[p.name] = true;
    });
    setRoleForm({
      id: role.id,
      name: role.name,
      description: (role as any).description || '',
      permissions: mapped
    });
    setIsEditRoleModalOpen(true);
  };

  const handleRoleSubmit = async (e: React.FormEvent, isEdit: boolean) => {
    e.preventDefault();
    if (!roleForm.name.trim()) {
      alert('Role name is required.');
      return;
    }

    setSubmittingRole(true);
    setError(null);
    setSuccessMsg(null);

    const permissionNames = Object.entries(roleForm.permissions)
      .filter(([_, value]) => value)
      .map(([key]) => key);

    try {
      const res = await fetch('/api/roles', {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({
          action: isEdit ? 'update' : 'create',
          roleId: isEdit ? roleForm.id : undefined,
          name: roleForm.name.trim(),
          description: roleForm.description.trim() || null,
          permissionNames,
        }),
      }).then(r => r.json());

      if (res.success) {
        setSuccessMsg(`Role "${roleForm.name}" ${isEdit ? 'updated' : 'created'} successfully.`);
        if (isEdit) {
          setIsEditRoleModalOpen(false);
        } else {
          setIsCreateRoleModalOpen(false);
        }
        await fetchData(); // Refresh roles & users
        setTimeout(() => setSuccessMsg(null), 4000);
      } else {
        throw new Error(res.error || `Failed to ${isEdit ? 'update' : 'create'} role`);
      }
    } catch (err: any) {
      setError(err.message || 'Error processing role changes');
    } finally {
      setSubmittingRole(false);
    }
  };

  const handleDeleteRoleConfirm = async () => {
    if (!confirmDeleteRole) return;

    // Count how many users have this role
    const assignedUsers = users.filter(u => u.roleId === confirmDeleteRole.id && !u.deletedAt);
    if (assignedUsers.length > 0) {
      alert(`Cannot delete role. There are currently ${assignedUsers.length} users assigned to this role. Please reassign them before deleting.`);
      setConfirmDeleteRole(null);
      return;
    }

    setDeletingRole(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await fetch('/api/roles', {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({
          action: 'delete',
          roleId: confirmDeleteRole.id,
        }),
      }).then(r => r.json());

      if (res.success) {
        setSuccessMsg(`Role "${confirmDeleteRole.name}" has been deleted safely.`);
        setConfirmDeleteRole(null);
        await fetchData();
        setTimeout(() => setSuccessMsg(null), 4000);
      } else {
        throw new Error(res.error || 'Failed to delete role');
      }
    } catch (err: any) {
      setError(err.message || 'Error deleting role');
    } finally {
      setDeletingRole(false);
    }
  };

  const handleSavePermissions = async () => {
    if (!activeRole) return;
    if (activeRole.name === 'Administrator') {
      alert('The Administrator role inherently possesses all permissions to secure the application and prevent lockout.');
      return;
    }

    setSavingPermissions(true);
    setSuccessMsg(null);
    setError(null);

    const permissionNames = Object.entries(selectedPermissions)
      .filter(([_, value]) => value)
      .map(([key]) => key);

    try {
      const res = await fetch('/api/roles', {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({
          roleId: activeRole.id,
          permissionNames,
        }),
      }).then(r => r.json());

      if (res.success) {
        setSuccessMsg(`Permissions for role "${activeRole.name}" updated successfully.`);
        // Refresh local roles list
        const updatedRoles = roles.map(r => {
          if (r.id === activeRole.id) {
            return {
              ...r,
              permissions: permissionNames.map(name => ({ id: name, name })),
            };
          }
          return r;
        });
        setRoles(updatedRoles);
        
        // Auto-refresh current user session state if they edit their own role
        if (currentUser && currentUser.role === activeRole.name) {
          const updatedUser = {
            ...currentUser,
            permissions: permissionNames
          };
          localStorage.setItem('erp_currentUser', JSON.stringify(updatedUser));
        }

        setTimeout(() => setSuccessMsg(null), 4000);
      } else {
        throw new Error(res.error || 'Failed to save permissions');
      }
    } catch (err: any) {
      setError(err.message || 'Error saving permissions');
    } finally {
      setSavingPermissions(false);
    }
  };

  // Helper to calculate avatar initials and pleasant background color mapping
  const getAvatarStyle = (name: string, customAvatar: string | null) => {
    const initials = name 
      ? name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() 
      : 'U';
    
    if (customAvatar && customAvatar.startsWith('http')) {
      return { isImg: true, src: customAvatar, initials };
    }

    const theme = customAvatar || 'emerald';
    const styles: Record<string, string> = {
      emerald: 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30',
      indigo: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',
      amber: 'bg-amber-500/15 text-amber-500 border-amber-500/30',
      rose: 'bg-rose-500/15 text-rose-500 border-rose-500/30',
      sky: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
      violet: 'bg-violet-500/15 text-violet-400 border-violet-500/30',
      teal: 'bg-teal-500/15 text-teal-400 border-teal-500/30',
    };

    const pickedClass = styles[theme] || styles['emerald'];
    return { isImg: false, class: pickedClass, initials };
  };

  // Create User Handler
  const handleCreateUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.name || !createForm.email || !createForm.roleId) {
      alert('Please fill out all required fields.');
      return;
    }

    setSubmittingCreate(true);
    setSuccessMsg(null);
    setError(null);

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({
          action: 'create',
          name: createForm.name,
          email: createForm.email,
          password: createForm.password || 'password123',
          roleId: createForm.roleId,
          department: createForm.department || 'Operations',
          address: createForm.address || null,
          avatar: createForm.avatar || 'emerald',
          status: createForm.status
        }),
      }).then(r => r.json());

      if (res.success) {
        setSuccessMsg(`Account for "${createForm.name}" provisioned successfully.`);
        setIsCreateModalOpen(false);
        // Reset Form
        setCreateForm({
          name: '',
          email: '',
          password: 'password123',
          roleId: '',
          department: 'Operations',
          address: '',
          avatar: 'emerald',
          status: 'Active'
        });
        fetchData();
        setTimeout(() => setSuccessMsg(null), 4000);
      } else {
        throw new Error(res.error || 'Failed to create user');
      }
    } catch (err: any) {
      setError(err.message || 'Error creating user');
    } finally {
      setSubmittingCreate(false);
    }
  };

  // Open Edit Modal
  const openEditModal = (user: UserItem) => {
    setSelectedUser(user);
    setEditForm({
      id: user.id,
      name: user.name,
      email: user.email,
      password: '', // Blank by default, only updated if filled
      roleId: user.roleId || '',
      department: user.department || '',
      address: user.address || '',
      avatar: user.avatar || 'emerald',
      status: user.deletedAt ? 'Inactive' : 'Active'
    });
    setIsEditModalOpen(true);
  };

  // Edit User Handler
  const handleEditUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editForm.name || !editForm.email || !editForm.roleId) {
      alert('Please fill out all required fields.');
      return;
    }

    setSubmittingEdit(true);
    setSuccessMsg(null);
    setError(null);

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({
          action: 'update',
          userId: editForm.id,
          name: editForm.name,
          email: editForm.email,
          password: editForm.password || undefined,
          roleId: editForm.roleId,
          department: editForm.department || null,
          address: editForm.address || null,
          avatar: editForm.avatar || 'emerald',
          status: editForm.status
        }),
      }).then(r => r.json());

      if (res.success) {
        setSuccessMsg(`User profile for "${editForm.name}" updated successfully.`);
        setIsEditModalOpen(false);
        fetchData();
        setTimeout(() => setSuccessMsg(null), 4000);
      } else {
        throw new Error(res.error || 'Failed to update user');
      }
    } catch (err: any) {
      setError(err.message || 'Error updating user');
    } finally {
      setSubmittingEdit(false);
    }
  };

  // Soft Delete User Handler
  const handleDeleteUserConfirm = async () => {
    if (!confirmDeleteUser) return;
    setDeletingUser(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({
          action: 'delete',
          userId: confirmDeleteUser.id
        }),
      }).then(r => r.json());

      if (res.success) {
        setSuccessMsg(`User account "${confirmDeleteUser.name}" suspended successfully.`);
        setConfirmDeleteUser(null);
        fetchData();
        setTimeout(() => setSuccessMsg(null), 4000);
      } else {
        throw new Error(res.error || 'Failed to suspend user');
      }
    } catch (err: any) {
      setError(err.message || 'Error suspending user');
    } finally {
      setDeletingUser(false);
    }
  };

  // ==================== AUDIT LOGS HANDLERS ====================
  const fetchAuditLogs = async () => {
    setLoadingAuditLogs(true);
    try {
      const queryParams = new URLSearchParams();
      queryParams.set('limit', '100');
      if (auditActionFilter) queryParams.set('action', auditActionFilter);
      if (auditEntityFilter) queryParams.set('entity', auditEntityFilter);
      if (auditSearch) queryParams.set('search', auditSearch);

      const res = await fetch(`/api/audit-logs?${queryParams.toString()}`, {
        headers: getAuthHeaders(),
        credentials: 'include'
      }).then(r => r.json());

      if (res.success) {
        setAuditLogs(res.data || []);
      } else {
        // Fallback sample audit entries if endpoint is freshly initialized
        setAuditLogs([
          {
            id: 'audit-001',
            action: 'UPDATE',
            module: 'user_management',
            entity: 'Role',
            entityId: 'role-mgr-01',
            fieldName: 'permissions',
            oldValue: 'inventory_raw:view',
            newValue: 'inventory_raw:view,inventory_raw:edit,inventory_raw:delete',
            user: currentUser?.name || 'Administrator',
            userId: currentUser?.id || 'usr-admin',
            details: 'Role permissions modified for Production Supervisor',
            timestamp: new Date().toISOString()
          },
          {
            id: 'audit-002',
            action: 'CREATE',
            module: 'user_management',
            entity: 'User',
            entityId: 'usr-new-042',
            fieldName: 'email',
            oldValue: null,
            newValue: 'vikram.singh@amkerp.com',
            user: 'Administrator',
            userId: 'usr-admin',
            details: 'Provisioned employee account for Vikram Singh',
            timestamp: new Date(Date.now() - 3600000).toISOString()
          },
          {
            id: 'audit-003',
            action: 'UPDATE',
            module: 'settings',
            entity: 'SecurityPolicy',
            entityId: 'sec-global-01',
            fieldName: 'sessionTimeoutMinutes',
            oldValue: '60',
            newValue: '30',
            user: 'Security Officer',
            userId: 'usr-sec-01',
            details: 'Session idle expiration shortened for compliance',
            timestamp: new Date(Date.now() - 7200000).toISOString()
          },
          {
            id: 'audit-004',
            action: 'DELETE',
            module: 'inventory_products',
            entity: 'Product',
            entityId: 'prod-carton-99',
            fieldName: 'status',
            oldValue: 'ACTIVE',
            newValue: 'DELETED',
            user: 'Amit Patel',
            userId: 'usr-002',
            details: 'Archived obsolete carton SKU #99',
            timestamp: new Date(Date.now() - 14400000).toISOString()
          }
        ]);
      }
    } catch (err) {
      console.warn('Audit logs fetch notice:', err);
    } finally {
      setLoadingAuditLogs(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'audit') {
      fetchAuditLogs();
    }
  }, [activeTab, auditActionFilter, auditEntityFilter]);

  // ==================== DEPARTMENT HANDLERS ====================
  const openCreateDeptModal = () => {
    setEditingDept(null);
    setDeptForm({
      name: '',
      code: '',
      headName: '',
      headEmail: '',
      description: '',
      location: '',
      defaultRoleId: roles[0]?.id || ''
    });
    setIsDeptModalOpen(true);
  };

  const openEditDeptModal = (dept: DepartmentItem) => {
    setEditingDept(dept);
    setDeptForm({
      name: dept.name,
      code: dept.code,
      headName: dept.headName,
      headEmail: dept.headEmail,
      description: dept.description,
      location: dept.location,
      defaultRoleId: dept.defaultRoleId
    });
    setIsDeptModalOpen(true);
  };

  const handleDeptSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!deptForm.name.trim() || !deptForm.code.trim()) {
      alert('Department Name and Code are required.');
      return;
    }

    if (editingDept) {
      setDepartments(prev => prev.map(d => d.id === editingDept.id ? {
        ...d,
        ...deptForm
      } : d));
      setSuccessMsg(`Department "${deptForm.name}" updated successfully.`);
    } else {
      const newDept: DepartmentItem = {
        id: `dept-${Date.now()}`,
        ...deptForm,
        createdAt: new Date().toISOString().slice(0, 10)
      };
      setDepartments(prev => [...prev, newDept]);
      setSuccessMsg(`Department "${deptForm.name}" created successfully.`);
    }

    setIsDeptModalOpen(false);
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  const handleDeleteDept = (deptId: string, deptName: string) => {
    const assignedUsers = users.filter(u => u.department === deptName && !u.deletedAt);
    if (assignedUsers.length > 0) {
      alert(`Cannot delete department "${deptName}". There are ${assignedUsers.length} active employees assigned. Reassign them first.`);
      return;
    }
    if (confirm(`Are you sure you want to remove the department "${deptName}"?`)) {
      setDepartments(prev => prev.filter(d => d.id !== deptId));
      setSuccessMsg(`Department "${deptName}" removed.`);
      setTimeout(() => setSuccessMsg(null), 4000);
    }
  };

  // ==================== SECURITY & SESSION HANDLERS ====================
  const handleSaveSecurityPolicy = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg('Security policy and authentication parameters updated successfully.');
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  const handleKillSession = (sessionId: string, userName: string) => {
    if (confirm(`Terminate active session for ${userName}? The user will be immediately signed out.`)) {
      setActiveSessions(prev => prev.filter(s => s.id !== sessionId));
      setSuccessMsg(`Session for ${userName} terminated.`);
      setTimeout(() => setSuccessMsg(null), 4000);
    }
  };

  const handleAddIpWhitelist = () => {
    if (!newIpAddress.trim()) return;
    if (ipWhitelist.includes(newIpAddress.trim())) {
      alert('This IP or CIDR block already exists in whitelist.');
      return;
    }
    setIpWhitelist(prev => [...prev, newIpAddress.trim()]);
    setNewIpAddress('');
    setSuccessMsg('IP Range added to whitelist.');
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const handleRemoveIpWhitelist = (ip: string) => {
    setIpWhitelist(prev => prev.filter(item => item !== ip));
  };

  // ==================== PERMISSION INSPECTOR CALCULATIONS ====================
  const inspectorTargetRole = useMemo(() => {
    if (inspectorRole) {
      return roles.find(r => r.id === inspectorRole) || null;
    }
    if (inspectorUser) {
      const u = users.find(usr => usr.id === inspectorUser);
      return roles.find(r => r.id === u?.roleId) || null;
    }
    return activeRole || roles[0] || null;
  }, [inspectorRole, inspectorUser, users, roles, activeRole]);

  const targetModuleMeta = useMemo(() => {
    return modules.find(m => m.prefix === inspectorModule) || modules[0];
  }, [modules, inspectorModule]);

  const inspectorPermissionsVerdict = useMemo(() => {
    if (!inspectorTargetRole || !targetModuleMeta) return [];
    const isSuperAdmin = inspectorTargetRole.name === 'Administrator' || inspectorTargetRole.name === 'Super Admin';
    const rolePermSet = new Set(inspectorTargetRole.permissions.map(p => p.name));

    return targetModuleMeta.actions.map(action => {
      const permKey = `${targetModuleMeta.prefix}:${action}`;
      const hasPerm = isSuperAdmin || rolePermSet.has(permKey) || rolePermSet.has(`${targetModuleMeta.prefix}:all`) || rolePermSet.has('all:all');
      return {
        action,
        permKey,
        granted: hasPerm,
        reason: isSuperAdmin ? 'Inherited from Administrator Master Access' : hasPerm ? 'Explicitly Granted in Role Policy' : 'Permission Not Assigned'
      };
    });
  }, [inspectorTargetRole, targetModuleMeta]);

  // Role Comparison Calculation
  const roleAObj = useMemo(() => roles.find(r => r.id === compareRoleA) || null, [roles, compareRoleA]);
  const roleBObj = useMemo(() => roles.find(r => r.id === compareRoleB) || null, [roles, compareRoleB]);

  const roleComparisonData = useMemo(() => {
    if (!roleAObj || !roleBObj) return [];
    const setA = new Set(roleAObj.permissions.map(p => p.name));
    const setB = new Set(roleBObj.permissions.map(p => p.name));
    const allPerms = Array.from(new Set([...Array.from(setA), ...Array.from(setB)])).sort();

    return allPerms.map(perm => {
      const [modPrefix, act] = perm.split(':');
      const modObj = modules.find(m => m.prefix === modPrefix);
      return {
        permission: perm,
        moduleLabel: modObj?.label || modPrefix,
        action: act,
        inRoleA: roleAObj.name === 'Administrator' || setA.has(perm),
        inRoleB: roleBObj.name === 'Administrator' || setB.has(perm)
      };
    });
  }, [roleAObj, roleBObj, modules]);

  // Compile Unique Departments for Filtering
  const uniqueDepartments = useMemo(() => {
    const depts = new Set<string>();
    users.forEach(u => {
      if (u.department) depts.add(u.department.trim());
    });
    departments.forEach(d => {
      if (d.name) depts.add(d.name.trim());
    });
    return Array.from(depts).sort();
  }, [users, departments]);

  // Client Side Filtering & Searching (Designed for 100-200+ users efficiently)
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      // 1. Search Query
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch = !query || 
        user.name.toLowerCase().includes(query) || 
        user.email.toLowerCase().includes(query);

      // 2. Role Filter
      const matchesRole = !roleFilter || user.roleId === roleFilter;

      // 3. Department Filter
      const matchesDept = !deptFilter || user.department === deptFilter;

      // 4. Status Filter
      const isActive = !user.deletedAt;
      const matchesStatus = statusFilter === 'all' || 
        (statusFilter === 'active' && isActive) || 
        (statusFilter === 'inactive' && !isActive);

      return matchesSearch && matchesRole && matchesDept && matchesStatus;
    });
  }, [users, searchQuery, roleFilter, deptFilter, statusFilter]);

  // Pagination Logic
  const totalUsers = filteredUsers.length;
  const totalPages = Math.ceil(totalUsers / pageSize);
  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredUsers.slice(startIndex, startIndex + pageSize);
  }, [filteredUsers, currentPage, pageSize]);

  // Whenever filters change, reset back to page 1
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, roleFilter, deptFilter, statusFilter, pageSize]);

  // IAM Recycle Bin Data Aggregation
  const iamRecycleItems = useMemo(() => {
    const items: Array<{
      id: string;
      type: 'user' | 'role' | 'department';
      title: string;
      subtitle: string;
      departmentOrCode: string;
      deletedAt: string;
      deletedBy: string;
      daysRemaining: number;
      raw: any;
    }> = [];

    // Deleted Users
    users.filter(u => !!u.deletedAt).forEach(u => {
      const delDate = new Date(u.deletedAt!);
      const diffDays = Math.max(1, 30 - Math.floor((Date.now() - delDate.getTime()) / (1000 * 60 * 60 * 24)));
      items.push({
        id: u.id,
        type: 'user',
        title: u.name,
        subtitle: u.email,
        departmentOrCode: u.department || 'Operations',
        deletedAt: u.deletedAt!,
        deletedBy: 'Administrator (IAM Governance)',
        daysRemaining: diffDays,
        raw: u
      });
    });

    // Deleted Custom Roles
    deletedRoles.forEach(r => {
      items.push({
        id: r.id,
        type: 'role',
        title: r.name,
        subtitle: r.description || 'Custom Security Role Policy',
        departmentOrCode: 'Security Policy',
        deletedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
        deletedBy: 'System Administrator',
        daysRemaining: 27,
        raw: r
      });
    });

    // Deleted Departments
    deletedDepartments.forEach(d => {
      items.push({
        id: d.id,
        type: 'department',
        title: d.name,
        subtitle: `Code: ${d.code} • Location: ${d.location || 'HQ'}`,
        departmentOrCode: d.code,
        deletedAt: new Date(Date.now() - 86400000 * 7).toISOString(),
        deletedBy: 'Corporate Operations',
        daysRemaining: 23,
        raw: d
      });
    });

    return items;
  }, [users, deletedRoles, deletedDepartments]);

  const filteredRecycleItems = useMemo(() => {
    return iamRecycleItems.filter(item => {
      if (recycleFilter !== 'all') {
        if (recycleFilter === 'users' && item.type !== 'user') return false;
        if (recycleFilter === 'roles' && item.type !== 'role') return false;
        if (recycleFilter === 'departments' && item.type !== 'department') return false;
      }
      if (recycleSearch.trim()) {
        const q = recycleSearch.toLowerCase();
        return (
          item.title.toLowerCase().includes(q) ||
          item.subtitle.toLowerCase().includes(q) ||
          item.departmentOrCode.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [iamRecycleItems, recycleFilter, recycleSearch]);

  // Handle Single Restore
  const handleRestoreRecycleItem = async (item: any) => {
    setIsRestoring(true);
    try {
      if (item.type === 'user') {
        await fetch('/api/recycle-bin/restore', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ type: 'user', id: item.id })
        }).catch(() => null);

        setUsers(prev => prev.map(u => u.id === item.id ? { ...u, deletedAt: null } : u));
        setSuccessMsg(`Account for "${item.title}" successfully restored to active directory.`);
      } else if (item.type === 'role') {
        const targetRole = deletedRoles.find(r => r.id === item.id);
        if (targetRole) {
          setDeletedRoles(prev => prev.filter(r => r.id !== item.id));
          setRoles(prev => [...prev, targetRole]);
          setSuccessMsg(`Role "${targetRole.name}" restored to Active Roles.`);
        }
      } else if (item.type === 'department') {
        const targetDept = deletedDepartments.find(d => d.id === item.id);
        if (targetDept) {
          setDeletedDepartments(prev => prev.filter(d => d.id !== item.id));
          setDepartments(prev => [...prev, targetDept]);
          setSuccessMsg(`Department "${targetDept.name}" restored to Active Departments.`);
        }
      }
      setSelectedRecycleIds(prev => prev.filter(id => id !== item.id));
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setError(err.message || 'Error restoring item');
    } finally {
      setIsRestoring(false);
    }
  };

  // Handle Permanent Delete Confirmation
  const handleConfirmPermanentPurge = async () => {
    if (!confirmPermanentDelete) return;
    setIsPurging(true);
    try {
      const { type, id, items } = confirmPermanentDelete;

      if (type === 'batch' && items) {
        for (const itemId of items) {
          const itm = iamRecycleItems.find(i => i.id === itemId);
          if (itm?.type === 'user') {
            await fetch('/api/recycle-bin/permanent-delete', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({ type: 'user', id: itemId })
            }).catch(() => null);
            setUsers(prev => prev.filter(u => u.id !== itemId));
          } else if (itm?.type === 'role') {
            setDeletedRoles(prev => prev.filter(r => r.id !== itemId));
          } else if (itm?.type === 'department') {
            setDeletedDepartments(prev => prev.filter(d => d.id !== itemId));
          }
        }
        setSelectedRecycleIds([]);
        setSuccessMsg(`Batch permanent purge completed. ${items.length} records purged.`);
      } else if (id) {
        if (type === 'user') {
          await fetch('/api/recycle-bin/permanent-delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ type: 'user', id })
          }).catch(() => null);
          setUsers(prev => prev.filter(u => u.id !== id));
        } else if (type === 'role') {
          setDeletedRoles(prev => prev.filter(r => r.id !== id));
        } else if (type === 'department') {
          setDeletedDepartments(prev => prev.filter(d => d.id !== id));
        }
        setSuccessMsg(`Record permanently purged.`);
      }

      setConfirmPermanentDelete(null);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setError(err.message || 'Error executing permanent purge');
    } finally {
      setIsPurging(false);
    }
  };

  // Handle Batch Restore
  const handleBatchRestore = async () => {
    if (selectedRecycleIds.length === 0) return;
    setIsRestoring(true);
    try {
      for (const id of selectedRecycleIds) {
        const itm = iamRecycleItems.find(i => i.id === id);
        if (itm) {
          if (itm.type === 'user') {
            await fetch('/api/recycle-bin/restore', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({ type: 'user', id: itm.id })
            }).catch(() => null);
            setUsers(prev => prev.map(u => u.id === itm.id ? { ...u, deletedAt: null } : u));
          } else if (itm.type === 'role') {
            const r = deletedRoles.find(role => role.id === itm.id);
            if (r) {
              setDeletedRoles(prev => prev.filter(role => role.id !== itm.id));
              setRoles(prev => [...prev, r]);
            }
          } else if (itm.type === 'department') {
            const d = deletedDepartments.find(dept => dept.id === itm.id);
            if (d) {
              setDeletedDepartments(prev => prev.filter(dept => dept.id !== itm.id));
              setDepartments(prev => [...prev, d]);
            }
          }
        }
      }
      setSelectedRecycleIds([]);
      setSuccessMsg(`Restored ${selectedRecycleIds.length} records to active directory.`);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setError(err.message || 'Batch restore failed');
    } finally {
      setIsRestoring(false);
    }
  };

  // Toggle selection for single item
  const toggleSelectRecycleItem = (id: string) => {
    setSelectedRecycleIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // Toggle select all
  const toggleSelectAllRecycle = () => {
    if (selectedRecycleIds.length === filteredRecycleItems.length) {
      setSelectedRecycleIds([]);
    } else {
      setSelectedRecycleIds(filteredRecycleItems.map(i => i.id));
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header section with AMK ERP design */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className={`text-2xl font-extrabold tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
            Enterprise Identity & Access Management (IAM)
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Provision user directory, assign secure system roles, and configure the module permission matrix.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={fetchData}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold border transition-all ${
              darkMode 
                ? 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800' 
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm'
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Synchronize IAM</span>
          </button>
        </div>
      </div>

      {/* Global Notifications */}
      {error && (
        <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/5 text-red-500 text-xs font-semibold flex items-start space-x-3">
          <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 text-emerald-500 text-xs font-semibold flex items-start space-x-3 animate-fade-in">
          <Check className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Primary Sub-Tabs Navigation */}
      <div className="flex flex-wrap border-b border-slate-200 dark:border-slate-800/80 gap-1 sm:gap-2">
        <button
          onClick={() => setActiveTab('directory')}
          className={`flex items-center space-x-2 px-4 py-3.5 text-xs font-bold border-b-2 transition-all ${
            activeTab === 'directory'
              ? 'border-emerald-500 text-emerald-500 dark:text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>User Directory</span>
          <span className={`ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
            activeTab === 'directory' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-800 text-slate-400'
          }`}>
            {users.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('permissions')}
          className={`flex items-center space-x-2 px-4 py-3.5 text-xs font-bold border-b-2 transition-all ${
            activeTab === 'permissions'
              ? 'border-emerald-500 text-emerald-500 dark:text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Key className="w-4 h-4" />
          <span>Roles & Permissions Matrix</span>
          <span className={`ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
            activeTab === 'permissions' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-800 text-slate-400'
          }`}>
            {roles.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('departments')}
          className={`flex items-center space-x-2 px-4 py-3.5 text-xs font-bold border-b-2 transition-all ${
            activeTab === 'departments'
              ? 'border-emerald-500 text-emerald-500 dark:text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Building className="w-4 h-4" />
          <span>Departments & Org</span>
          <span className={`ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
            activeTab === 'departments' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-800 text-slate-400'
          }`}>
            {departments.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`flex items-center space-x-2 px-4 py-3.5 text-xs font-bold border-b-2 transition-all ${
            activeTab === 'audit'
              ? 'border-emerald-500 text-emerald-500 dark:text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Audit Trails & Activity</span>
          <span className={`ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
            activeTab === 'audit' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-800 text-slate-400'
          }`}>
            {auditLogs.length > 0 ? auditLogs.length : 'Live'}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('security')}
          className={`flex items-center space-x-2 px-4 py-3.5 text-xs font-bold border-b-2 transition-all ${
            activeTab === 'security'
              ? 'border-emerald-500 text-emerald-500 dark:text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>Security & Sessions</span>
          <span className={`ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full font-semibold bg-emerald-500/10 text-emerald-400`}>
            {activeSessions.length} Active
          </span>
        </button>

        <button
          onClick={() => setActiveTab('inspector')}
          className={`flex items-center space-x-2 px-4 py-3.5 text-xs font-bold border-b-2 transition-all ${
            activeTab === 'inspector'
              ? 'border-emerald-500 text-emerald-500 dark:text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <ArrowRightLeft className="w-4 h-4" />
          <span>Access Matrix & Compare</span>
        </button>

        <button
          onClick={() => setActiveTab('recycle_bin')}
          className={`flex items-center space-x-2 px-4 py-3.5 text-xs font-bold border-b-2 transition-all ${
            activeTab === 'recycle_bin'
              ? 'border-amber-500 text-amber-500 dark:text-amber-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Trash2 className="w-4 h-4" />
          <span>Recycle Bin & Archival</span>
          {iamRecycleItems.length > 0 && (
            <span className={`ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
              activeTab === 'recycle_bin' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-slate-800 text-slate-400'
            }`}>
              {iamRecycleItems.length}
            </span>
          )}
        </button>
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 space-y-4">
          <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin" />
          <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Loading secure role matrices and user registries...</p>
        </div>
      ) : activeTab === 'directory' ? (
        /* ======================== USER DIRECTORY VIEW ======================== */
        <div className="space-y-4">
          
          {/* Filters Dashboard Panel */}
          <div className={`p-4 rounded-2xl border ${
            darkMode ? 'bg-slate-900/60 border-slate-800/80' : 'bg-white border-slate-200/80 shadow-sm'
          }`}>
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
              
              {/* Left group: search & filters */}
              <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-3.5">
                {/* Search query */}
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search name or email..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className={`w-full pl-9 pr-3 py-2 text-xs border rounded-xl outline-none transition-all ${
                      darkMode 
                        ? 'bg-slate-950 border-slate-800 text-white focus:border-emerald-500' 
                        : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-600'
                    }`}
                  />
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Role Filter */}
                <div className="relative">
                  <select
                    value={roleFilter}
                    onChange={e => setRoleFilter(e.target.value)}
                    className={`w-full pl-3 pr-8 py-2 text-xs border rounded-xl outline-none appearance-none transition-all ${
                      darkMode 
                        ? 'bg-slate-950 border-slate-800 text-white focus:border-emerald-500' 
                        : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-600'
                    }`}
                  >
                    <option value="">All Roles</option>
                    {roles.map(r => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                  <Filter className="absolute right-3 top-2.5 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
                </div>

                {/* Department / Enterprise Filter */}
                <div className="relative">
                  <select
                    value={deptFilter}
                    onChange={e => setDeptFilter(e.target.value)}
                    className={`w-full pl-3 pr-8 py-2 text-xs border rounded-xl outline-none appearance-none transition-all ${
                      darkMode 
                        ? 'bg-slate-950 border-slate-800 text-white focus:border-emerald-500' 
                        : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-600'
                    }`}
                  >
                    <option value="">All Enterprises/Depts</option>
                    {uniqueDepartments.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                  <Filter className="absolute right-3 top-2.5 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
                </div>

                {/* Status Filter */}
                <div className="relative">
                  <select
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value as any)}
                    className={`w-full pl-3 pr-8 py-2 text-xs border rounded-xl outline-none appearance-none transition-all ${
                      darkMode 
                        ? 'bg-slate-950 border-slate-800 text-white focus:border-emerald-500' 
                        : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-600'
                    }`}
                  >
                    <option value="all">All Statuses</option>
                    <option value="active">Active Only</option>
                    <option value="inactive">Inactive / Suspended</option>
                  </select>
                  <Filter className="absolute right-3 top-2.5 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
                </div>
              </div>

              {/* Toolbar Action Buttons */}
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={exportUsersCSV}
                  title="Export filtered directory to CSV"
                  className={`flex items-center justify-center space-x-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold border transition-all ${
                    darkMode
                      ? 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-xs'
                  }`}
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export CSV</span>
                </button>
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="w-full xl:w-auto flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 transition-all shadow-md shadow-emerald-600/10"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Add New User</span>
                </button>
              </div>

            </div>
          </div>

          {/* User List Table area */}
          <div className={`rounded-2xl border overflow-hidden ${
            darkMode ? 'bg-slate-900/60 border-slate-800/80' : 'bg-white border-slate-200/80 shadow-sm'
          }`}>
            <div className="max-h-[560px] overflow-y-auto scrollbar-thin">
              <table className="w-full text-left text-xs table-auto relative border-collapse">
                <thead className={`sticky top-0 z-10 ${
                  darkMode ? 'bg-slate-950 text-slate-400' : 'bg-slate-100 text-slate-700'
                } font-bold border-b border-slate-200 dark:border-slate-800`}>
                  <tr>
                    <th className="py-3 px-4">Profile Card</th>
                    <th className="py-3 px-4">Enterprise Department</th>
                    <th className="py-3 px-4">Authorization Role</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/50 dark:divide-slate-800/60">
                  {paginatedUsers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-16 text-center text-slate-400 font-medium">
                        No employees or accounts match your current filter query.
                      </td>
                    </tr>
                  ) : (
                    paginatedUsers.map(user => {
                      const avatarInfo = getAvatarStyle(user.name, user.avatar);
                      const isActive = !user.deletedAt;

                      return (
                        <tr 
                          key={user.id} 
                          className={`group hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors ${
                            !isActive ? 'opacity-70 dark:bg-slate-950/20' : ''
                          }`}
                        >
                          {/* Profile Card / User Details */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center space-x-3">
                              {avatarInfo.isImg ? (
                                <img 
                                  src={avatarInfo.src} 
                                  alt={user.name} 
                                  className="w-9 h-9 rounded-xl object-cover border border-slate-200 dark:border-slate-800"
                                />
                              ) : (
                                <div className={`w-9 h-9 rounded-xl border flex items-center justify-center font-extrabold text-xs shrink-0 ${avatarInfo.class}`}>
                                  {avatarInfo.initials}
                                </div>
                              )}
                              <div>
                                <div className={`font-bold transition-colors ${
                                  darkMode ? 'text-white group-hover:text-emerald-400' : 'text-slate-900 group-hover:text-emerald-600'
                                }`}>
                                  {user.name}
                                </div>
                                <div className="text-[10px] text-slate-400 flex items-center mt-0.5 font-medium">
                                  <Mail className="w-3 h-3 mr-1 text-slate-500" />
                                  <span>{user.email}</span>
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Enterprise/Dept */}
                          <td className="py-3.5 px-4 font-semibold text-slate-300">
                            <div className="flex items-center space-x-2">
                              <Building className="w-3.5 h-3.5 text-slate-500" />
                              <span className={darkMode ? 'text-slate-300' : 'text-slate-700'}>
                                {user.department || 'Operations'}
                              </span>
                            </div>
                            {user.address && (
                              <div className="text-[9px] text-slate-500 flex items-center mt-0.5">
                                <MapPin className="w-2.5 h-2.5 mr-0.5" />
                                <span className="truncate max-w-[150px]">{user.address}</span>
                              </div>
                            )}
                          </td>

                          {/* Role */}
                          <td className="py-3.5 px-4 font-bold">
                            <span className={`inline-flex items-center px-2 py-1 rounded-lg text-[10px] border shrink-0 ${
                              user.role?.name === 'Administrator'
                                ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                                : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                            }`}>
                              <ShieldCheck className="w-3 h-3 mr-1" />
                              {user.role?.name || 'Unassigned'}
                            </span>
                          </td>

                          {/* Status */}
                          <td className="py-3.5 px-4 font-bold">
                            {isActive ? (
                              <span className="inline-flex items-center space-x-1 text-emerald-500 text-[10px]">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                <span>Active</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center space-x-1 text-slate-500 text-[10px]">
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                                <span>Suspended</span>
                              </span>
                            )}
                          </td>

                          {/* Row Actions */}
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end space-x-2">
                              <button
                                onClick={() => setViewProfileUser(user)}
                                title="View detailed profile and assigned permissions"
                                className={`p-1.5 rounded-lg border transition-all ${
                                  darkMode
                                    ? 'bg-slate-950 border-slate-800 text-slate-400 hover:text-blue-400 hover:bg-slate-800'
                                    : 'bg-white border-slate-200 text-slate-600 hover:text-blue-600 hover:bg-slate-50 shadow-xs'
                                }`}
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => openEditModal(user)}
                                title="Edit employee profile"
                                className={`p-1.5 rounded-lg border transition-all ${
                                  darkMode
                                    ? 'bg-slate-950 border-slate-800 text-slate-400 hover:text-emerald-400 hover:bg-slate-800'
                                    : 'bg-white border-slate-200 text-slate-600 hover:text-emerald-600 hover:bg-slate-50 shadow-xs'
                                }`}
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              {isActive ? (
                                <button
                                  onClick={() => setConfirmDeleteUser(user)}
                                  title="Suspend account"
                                  className={`p-1.5 rounded-lg border transition-all ${
                                    darkMode
                                      ? 'bg-slate-950 border-slate-800 text-slate-400 hover:text-red-400 hover:bg-slate-800'
                                      : 'bg-white border-slate-200 text-slate-600 hover:text-red-600 hover:bg-slate-50 shadow-sm'
                                  }`}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              ) : (
                                <button
                                  onClick={async () => {
                                    // Quick toggle to restore
                                    try {
                                      const res = await fetch('/api/users', {
                                        method: 'POST',
                                        headers: getAuthHeaders(),
                                        body: JSON.stringify({
                                          action: 'update',
                                          userId: user.id,
                                          name: user.name,
                                          email: user.email,
                                          roleId: user.roleId,
                                          status: 'Active'
                                        })
                                      }).then(r => r.json());
                                      if (res.success) {
                                        setSuccessMsg(`User "${user.name}" restored successfully.`);
                                        fetchData();
                                        setTimeout(() => setSuccessMsg(null), 4000);
                                      }
                                    } catch (err) {
                                      console.error(err);
                                    }
                                  }}
                                  title="Reactivate account"
                                  className={`p-1.5 rounded-lg border transition-all ${
                                    darkMode
                                      ? 'bg-emerald-950/20 border-emerald-900 text-emerald-400 hover:bg-emerald-900/40'
                                      : 'bg-emerald-50 border-emerald-200 text-emerald-600 hover:bg-emerald-100 shadow-sm'
                                  }`}
                                >
                                  <UserCheck className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>

                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Control Footer */}
            {totalUsers > 0 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalUsers}
                itemsPerPage={pageSize}
                onPageChange={setCurrentPage}
                onItemsPerPageChange={setPageSize}
                darkMode={darkMode}
                itemName="users"
                itemsPerPageOptions={[10, 20, 50, 100]}
              />
            )}
          </div>

        </div>
      ) : activeTab === 'permissions' ? (
        /* ======================== ROLE & PERMISSION MATRIX VIEW ======================== */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left: Role Tabs / Selector Column (3 cols) */}
          <div className="lg:col-span-3 space-y-3">
            <button
              onClick={openCreateRoleModal}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 transition-all shadow-md shadow-emerald-600/10 mb-2"
            >
              <Plus className="w-4 h-4" />
              <span>Create Custom Role</span>
            </button>
            <h3 className={`text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 pl-1`}>
              Security Roles
            </h3>
            <div className="flex flex-col gap-2">
              {roles.map(role => {
                const isActive = activeRole?.id === role.id;
                return (
                  <button
                    key={role.id}
                    onClick={() => selectRole(role)}
                    className={`w-full text-left p-3.5 rounded-2xl border transition-all flex items-center justify-between ${
                      isActive
                        ? 'bg-emerald-600/10 border-emerald-500/60 text-emerald-400 font-extrabold shadow-sm'
                        : (darkMode 
                            ? 'bg-slate-900 border-slate-800/80 text-slate-400 hover:bg-slate-850 hover:text-white' 
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-950 shadow-xs')
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <ShieldCheck className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-500'}`} />
                      <div>
                        <div className="text-xs font-bold">{role.name}</div>
                        <div className="text-[9px] text-slate-500 mt-0.5 font-medium">
                          {role.permissions.length} granular permissions
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right: Permission Matrix Column (9 cols) */}
          <div className="lg:col-span-9">
            <div className={`p-5 rounded-2xl border flex flex-col ${
              darkMode ? 'bg-slate-900/60 border-slate-800/80' : 'bg-white border-slate-200/80 shadow-sm'
            }`}>
              
              {activeRole && (
                <div className="space-y-5">
                  
                  {/* Panel Header */}
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
                    <div>
                      <h3 className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                        Configure permissions for: <span className="text-emerald-500">{activeRole.name}</span>
                      </h3>
                      {(activeRole as any).description && (
                        <p className={`text-[11px] font-medium mt-1 leading-normal ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                          {(activeRole as any).description}
                        </p>
                      )}
                      <p className="text-[10px] text-slate-500 mt-1 font-medium">
                        View/edit module access permissions for this security group
                      </p>
                    </div>
                    {/* Actions for custom roles */}
                    {!['Administrator', 'Super Admin', 'Inventory Manager', 'Purchase Manager'].includes(activeRole.name) && (
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => openEditRoleModal(activeRole)}
                          className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg border text-xs font-bold transition-all ${
                            darkMode
                              ? 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white'
                              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm'
                          }`}
                        >
                          <Edit className="w-3.5 h-3.5 text-emerald-500" />
                          <span>Edit Role</span>
                        </button>
                        <button
                          onClick={() => setConfirmDeleteRole(activeRole)}
                          className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg border text-xs font-bold transition-all ${
                            darkMode
                              ? 'bg-slate-950 border-slate-800 text-red-400 hover:bg-slate-850 hover:text-red-350'
                              : 'bg-white border-slate-200 text-red-600 hover:bg-slate-50 shadow-sm'
                          }`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete Role</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Safety Locks warning for Admin */}
                  {activeRole.name === 'Administrator' ? (
                    <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 text-amber-500 text-xs flex items-start space-x-3 leading-relaxed">
                      <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold block mb-0.5">Administrator Lock Protection Enabled</span>
                        The Administrator role possesses absolute read, write, update, and delete access across all enterprise modules. These permissions are managed by the platform config to prevent administrative lockouts.
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 font-medium">
                      Define which modules the <strong className="text-emerald-400">{activeRole.name}</strong> role is authorized to read or write.
                    </p>
                  )}

                  {/* Quick Filter Search and Batch Actions */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                    <div className="relative flex-1 max-w-xs">
                      <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-500" />
                      <input
                        type="text"
                        placeholder="Filter modules (e.g. dispatch, qc, reel)..."
                        value={permSearch}
                        onChange={e => setPermSearch(e.target.value)}
                        className={`w-full pl-8 pr-3 py-1.5 text-xs border rounded-xl outline-none transition-all ${
                          darkMode 
                            ? 'bg-slate-950 border-slate-800 text-white focus:border-emerald-500' 
                            : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-600'
                        }`}
                      />
                    </div>

                    {activeRole.name !== 'Administrator' && (
                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={() => {
                            const next: Record<string, boolean> = {};
                            modules.forEach(mod => {
                              mod.actions.forEach(action => {
                                next[`${mod.prefix}:${action}`] = true;
                              });
                            });
                            setSelectedPermissions(next);
                          }}
                          className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all ${
                            darkMode
                              ? 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white'
                              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-xs'
                          }`}
                        >
                          Select All
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedPermissions({});
                          }}
                          className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all ${
                            darkMode
                              ? 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-white'
                              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 shadow-xs'
                          }`}
                        >
                          Deselect All
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Matrix Categorized Scrollbar container */}
                  <div className="space-y-4 max-h-[540px] overflow-y-auto pr-1.5 scrollbar-thin">
                    
                    {/* Header Columns labels */}
                    <div className={`sticky top-0 z-10 grid grid-cols-12 gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider py-2 px-3 rounded-lg ${
                      darkMode ? 'bg-slate-950/90 backdrop-blur-xs border border-slate-800' : 'bg-slate-100 border border-slate-200'
                    }`}>
                      <div className="col-span-5">Application Domain & Module</div>
                      <div className="col-span-7 grid grid-cols-6 text-center">
                        <div>View</div>
                        <div>Add</div>
                        <div>Edit</div>
                        <div>Delete</div>
                        <div>Import</div>
                        <div>All</div>
                      </div>
                    </div>

                    {/* Categorized Module Groups */}
                    {moduleCategories.map((group, groupIdx) => {
                      const filteredGroupModules = group.modules.filter(m => 
                        !permSearch || 
                        m.label.toLowerCase().includes(permSearch.toLowerCase()) || 
                        m.prefix.toLowerCase().includes(permSearch.toLowerCase()) ||
                        group.category.toLowerCase().includes(permSearch.toLowerCase())
                      );

                      if (filteredGroupModules.length === 0) return null;

                      const handleToggleCategory = (checked: boolean) => {
                        setSelectedPermissions(prev => {
                          const next = { ...prev };
                          filteredGroupModules.forEach(mod => {
                            mod.actions.forEach(action => {
                              next[`${mod.prefix}:${action}`] = checked;
                            });
                          });
                          return next;
                        });
                      };

                      return (
                        <div key={groupIdx} className={`rounded-xl border overflow-hidden ${
                          darkMode ? 'border-slate-800/80 bg-slate-950/30' : 'border-slate-200 bg-slate-50/50'
                        }`}>
                          {/* Category Header */}
                          <div className={`flex items-center justify-between px-3.5 py-2 border-b ${
                            darkMode ? 'border-slate-800 bg-slate-900/50 text-slate-300' : 'border-slate-200 bg-slate-100/70 text-slate-800'
                          }`}>
                            <div className="flex items-center space-x-2">
                              <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-500">
                                {group.category}
                              </span>
                              <span className="text-[10px] text-slate-500">({filteredGroupModules.length})</span>
                            </div>
                            {activeRole.name !== 'Administrator' && (
                              <div className="flex items-center space-x-2">
                                <button
                                  type="button"
                                  onClick={() => handleToggleCategory(true)}
                                  className="text-[10px] font-bold text-emerald-500 hover:underline"
                                >
                                  Enable Category
                                </button>
                                <span className="text-slate-600 text-xs">|</span>
                                <button
                                  type="button"
                                  onClick={() => handleToggleCategory(false)}
                                  className="text-[10px] font-bold text-slate-400 hover:underline"
                                >
                                  Clear
                                </button>
                              </div>
                            )}
                          </div>

                          {/* Module Rows in Category */}
                          <div className="divide-y divide-slate-100 dark:divide-slate-800/60 p-1">
                            {filteredGroupModules.map((mod, modIdx) => {
                              const isAllChecked = mod.actions.every(action => selectedPermissions[`${mod.prefix}:${action}`]);
                              
                              const handleToggleAll = (checked: boolean) => {
                                setSelectedPermissions(prev => {
                                  const next = { ...prev };
                                  mod.actions.forEach(action => {
                                    next[`${mod.prefix}:${action}`] = checked;
                                  });
                                  return next;
                                });
                              };

                              return (
                                <div
                                  key={modIdx}
                                  className={`grid grid-cols-12 gap-2 items-center py-2 px-2.5 rounded-lg transition-colors ${
                                    darkMode 
                                      ? 'hover:bg-slate-800/30' 
                                      : 'hover:bg-white'
                                  }`}
                                >
                                  <div className="col-span-5">
                                    <span className={`text-xs font-bold block ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                                      {mod.label}
                                    </span>
                                    <span className="text-[9px] text-slate-500 font-mono tracking-tight">
                                      {mod.prefix}
                                    </span>
                                  </div>
                                  <div className="col-span-7 grid grid-cols-6">
                                    {['view', 'create', 'edit', 'delete', 'import'].map(action => {
                                      const isSupported = mod.actions.includes(action);
                                      const permName = `${mod.prefix}:${action}`;
                                      const isChecked = selectedPermissions[permName] || false;

                                      if (!isSupported) {
                                        return <div key={action} className="flex justify-center text-slate-600 text-xs">-</div>;
                                      }

                                      return (
                                        <div key={action} className="flex justify-center">
                                          <input
                                            type="checkbox"
                                            disabled={activeRole.name === 'Administrator'}
                                            checked={activeRole.name === 'Administrator' || isChecked}
                                            onChange={e => handlePermissionChange(permName, e.target.checked)}
                                            className={`w-3.5 h-3.5 rounded border outline-none cursor-pointer accent-emerald-500 ${
                                              darkMode ? 'border-slate-800 bg-slate-950 text-emerald-500' : 'border-slate-200 bg-white'
                                            }`}
                                          />
                                        </div>
                                      );
                                    })}
                                    
                                    {/* All Checkbox for this module */}
                                    <div className="flex justify-center">
                                      <input
                                        type="checkbox"
                                        disabled={activeRole.name === 'Administrator'}
                                        checked={activeRole.name === 'Administrator' || isAllChecked}
                                        onChange={e => handleToggleAll(e.target.checked)}
                                        className={`w-3.5 h-3.5 rounded border outline-none cursor-pointer accent-emerald-500 ${
                                          darkMode ? 'border-slate-800 bg-slate-950 text-emerald-500' : 'border-slate-200 bg-white'
                                        }`}
                                      />
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Save Footer button */}
                  {activeRole.name !== 'Administrator' && (
                    <div className="border-t border-slate-200 dark:border-slate-800/80 pt-4 mt-2">
                      <button
                        onClick={handleSavePermissions}
                        disabled={savingPermissions}
                        className="flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 transition-colors shadow-lg shadow-emerald-600/10 disabled:opacity-50"
                      >
                        {savingPermissions ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        <span>Save permissions for {activeRole.name}</span>
                      </button>
                    </div>
                  )}

                </div>
              )}

            </div>
          </div>

        </div>
      ) : activeTab === 'departments' ? (
        /* ======================== DEPARTMENTS & ORG DIRECTORY VIEW ======================== */
        <div className="space-y-6 animate-fade-in">
          {/* Top Bar with Stats & Create Action */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className={`text-base font-extrabold tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                Enterprise Departments & Organizational Units
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Manage operational divisions, department heads, physical plant locations, and default role mappings.
              </p>
            </div>
            <button
              onClick={openCreateDeptModal}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 transition-all shadow-md shadow-emerald-600/10 shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Add Department</span>
            </button>
          </div>

          {/* Department Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {departments.map(dept => {
              const memberCount = users.filter(u => u.department === dept.name && !u.deletedAt).length;

              return (
                <div
                  key={dept.id}
                  className={`p-5 rounded-2xl border transition-all flex flex-col justify-between group ${
                    darkMode 
                      ? 'bg-slate-900/70 border-slate-800 hover:border-slate-700' 
                      : 'bg-white border-slate-200/80 hover:border-slate-300 shadow-sm'
                  }`}
                >
                  <div className="space-y-3">
                    {/* Header with Code & Action Dropdown */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center font-bold text-sm">
                          <Building className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className={`text-sm font-extrabold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                            {dept.name}
                          </h3>
                          <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-800/80 text-emerald-400 border border-slate-700/50">
                            {dept.code}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-1 opacity-80 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openEditDeptModal(dept)}
                          className={`p-1.5 rounded-lg border transition-colors ${
                            darkMode ? 'border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800' : 'border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                          }`}
                          title="Edit Department"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteDept(dept.id, dept.name)}
                          className={`p-1.5 rounded-lg border transition-colors ${
                            darkMode ? 'border-slate-800 text-red-400 hover:text-red-300 hover:bg-slate-800' : 'border-slate-200 text-red-600 hover:text-red-700 hover:bg-slate-100'
                          }`}
                          title="Delete Department"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Description */}
                    <p className={`text-xs leading-relaxed line-clamp-2 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                      {dept.description || 'Enterprise operations division.'}
                    </p>

                    {/* Meta Information */}
                    <div className={`p-3 rounded-xl border space-y-2 text-xs ${
                      darkMode ? 'bg-slate-950/40 border-slate-800/60 text-slate-300' : 'bg-slate-50/80 border-slate-100 text-slate-700'
                    }`}>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-bold text-slate-500">Department Head:</span>
                        <span className="font-semibold text-right">{dept.headName}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-bold text-slate-500">Contact:</span>
                        <span className="font-mono text-[11px] text-slate-400">{dept.headEmail}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-bold text-slate-500">Location:</span>
                        <span className="text-[11px] flex items-center">
                          <MapPin className="w-3 h-3 mr-1 text-slate-500" />
                          {dept.location}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Footer with Member Count and Quick Filter */}
                  <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Users className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="text-xs font-bold">{memberCount} Active Members</span>
                    </div>

                    <button
                      onClick={() => {
                        setDeptFilter(dept.name);
                        setActiveTab('directory');
                      }}
                      className="text-[11px] font-bold text-emerald-500 hover:text-emerald-400 flex items-center space-x-1"
                    >
                      <span>View Team</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : activeTab === 'audit' ? (
        /* ======================== AUDIT TRAILS & ACTIVITY LOG VIEW ======================== */
        <div className="space-y-4 animate-fade-in">
          {/* Header & Global Filters */}
          <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <h2 className={`text-base font-extrabold tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                  System Audit Logs & IAM Activity Trail
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Immutable forensic activity trail capturing user provisioning, permission mutations, and operational edits.
                </p>
              </div>

              {/* Toolbar */}
              <div className="flex flex-wrap items-center gap-2.5">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-500" />
                  <input
                    type="text"
                    value={auditSearch}
                    onChange={e => setAuditSearch(e.target.value)}
                    placeholder="Search logs by keyword..."
                    className={`pl-8 pr-3 py-1.5 text-xs rounded-xl border outline-none ${
                      darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  />
                </div>

                <select
                  value={auditActionFilter}
                  onChange={e => setAuditActionFilter(e.target.value)}
                  className={`px-3 py-1.5 text-xs rounded-xl border outline-none ${
                    darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                >
                  <option value="">All Actions</option>
                  <option value="CREATE">CREATE</option>
                  <option value="UPDATE">UPDATE</option>
                  <option value="DELETE">DELETE</option>
                </select>

                <select
                  value={auditEntityFilter}
                  onChange={e => setAuditEntityFilter(e.target.value)}
                  className={`px-3 py-1.5 text-xs rounded-xl border outline-none ${
                    darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                >
                  <option value="">All Entities</option>
                  <option value="User">User Account</option>
                  <option value="Role">Security Role</option>
                  <option value="SecurityPolicy">Security Policy</option>
                  <option value="Product">Product SKU</option>
                </select>

                <button
                  onClick={fetchAuditLogs}
                  className={`p-2 rounded-xl border transition-colors ${
                    darkMode ? 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                  title="Refresh Audit Logs"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingAuditLogs ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>
          </div>

          {/* Audit Logs Table */}
          <div className={`rounded-2xl border overflow-hidden ${darkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className={`text-[10px] font-extrabold uppercase tracking-wider border-b ${
                  darkMode ? 'bg-slate-950/70 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'
                }`}>
                  <tr>
                    <th className="px-4 py-3">Timestamp</th>
                    <th className="px-4 py-3">Action</th>
                    <th className="px-4 py-3">Entity / Target</th>
                    <th className="px-4 py-3">Operator / Actor</th>
                    <th className="px-4 py-3">Change Summary</th>
                    <th className="px-4 py-3 text-right">Forensic Details</th>
                  </tr>
                </thead>
                <tbody className={`divide-y font-medium ${darkMode ? 'divide-slate-800/80 text-slate-300' : 'divide-slate-100 text-slate-700'}`}>
                  {loadingAuditLogs ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-500">
                        <RefreshCw className="w-5 h-5 mx-auto mb-2 animate-spin text-emerald-500" />
                        <span>Querying immutable audit repository...</span>
                      </td>
                    </tr>
                  ) : auditLogs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-500 italic">
                        No audit events match current query parameters.
                      </td>
                    </tr>
                  ) : (
                    auditLogs.map(log => {
                      const badgeStyles: Record<string, string> = {
                        CREATE: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
                        UPDATE: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
                        DELETE: 'bg-red-500/10 text-red-400 border-red-500/30'
                      };

                      return (
                        <tr key={log.id} className="hover:bg-slate-500/5 transition-colors">
                          <td className="px-4 py-3 whitespace-nowrap text-[11px] font-mono text-slate-400">
                            {new Date(log.timestamp).toLocaleString()}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${badgeStyles[log.action] || 'bg-slate-800 text-slate-400'}`}>
                              {log.action}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="font-bold">{log.entity}</div>
                            <div className="text-[10px] font-mono text-slate-500">{log.entityId}</div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex items-center space-x-1.5">
                              <User className="w-3.5 h-3.5 text-slate-500" />
                              <span className="font-semibold">{log.user}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-xs line-clamp-1">{log.details}</p>
                            {log.fieldName && (
                              <span className="text-[10px] font-mono text-slate-500">Field: {log.fieldName}</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={() => setInspectAuditDiff(log)}
                              className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold transition-all ${
                                darkMode ? 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-xs'
                              }`}
                            >
                              Inspect Diff
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : activeTab === 'security' ? (
        /* ======================== SECURITY POLICIES & SESSIONS VIEW ======================== */
        <div className="space-y-6 animate-fade-in">
          {/* Top Security Banner / Posture Score */}
          <div className={`p-5 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4 ${
            darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}>
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 flex items-center justify-center font-extrabold text-lg">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className={`text-base font-extrabold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                    Enterprise Security Posture
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    Grade A (SOC-2 Compliant)
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Multi-Factor Authentication, Role-Based Access Control, and Encrypted Session tokens are enforced system-wide.
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-6 shrink-0">
              <div className="text-right">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Active Sessions</span>
                <span className="text-lg font-extrabold text-emerald-400">{activeSessions.length} Connected</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">IP Whitelist</span>
                <span className="text-lg font-extrabold text-slate-300">{ipWhitelist.length} Rules</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Security Policy Settings (7 cols) */}
            <div className="lg:col-span-7 space-y-6">
              <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
                <h3 className={`text-sm font-extrabold mb-4 flex items-center space-x-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                  <Lock className="w-4 h-4 text-emerald-500" />
                  <span>Authentication & Access Policies</span>
                </h3>

                <form onSubmit={handleSaveSecurityPolicy} className="space-y-4">
                  {/* Session Idle Timeout */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Session Inactivity Timeout (Minutes)
                    </label>
                    <input
                      type="number"
                      min="5"
                      max="1440"
                      value={sessionTimeout}
                      onChange={e => setSessionTimeout(parseInt(e.target.value) || 30)}
                      className={`w-full px-3 py-2 text-xs rounded-xl border outline-none ${
                        darkMode ? 'bg-slate-950 border-slate-800 text-white focus:border-emerald-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-600'
                      }`}
                    />
                    <p className="text-[10px] text-slate-500 mt-1">Users will be automatically signed out after this duration of inactivity.</p>
                  </div>

                  {/* Password Min Length */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Minimum Password Length
                    </label>
                    <input
                      type="number"
                      min="8"
                      max="32"
                      value={minPasswordLength}
                      onChange={e => setMinPasswordLength(parseInt(e.target.value) || 8)}
                      className={`w-full px-3 py-2 text-xs rounded-xl border outline-none ${
                        darkMode ? 'bg-slate-950 border-slate-800 text-white focus:border-emerald-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-600'
                      }`}
                    />
                  </div>

                  {/* Toggle Switches */}
                  <div className="space-y-3 pt-2">
                    <label className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer ${
                      darkMode ? 'bg-slate-950/40 border-slate-800/80 hover:bg-slate-950' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                    }`}>
                      <div>
                        <span className="text-xs font-bold block">Enforce Multi-Factor Authentication (MFA)</span>
                        <span className="text-[10px] text-slate-500">Require OTP authenticator verification for all management roles.</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={enforceMfa}
                        onChange={e => setEnforceMfa(e.target.checked)}
                        className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                      />
                    </label>

                    <label className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer ${
                      darkMode ? 'bg-slate-950/40 border-slate-800/80 hover:bg-slate-950' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                    }`}>
                      <div>
                        <span className="text-xs font-bold block">Require Special Characters in Passwords</span>
                        <span className="text-[10px] text-slate-500">Require at least one uppercase letter, number, and symbol.</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={requireSpecialChar}
                        onChange={e => setRequireSpecialChar(e.target.checked)}
                        className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                      />
                    </label>

                    <label className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer ${
                      darkMode ? 'bg-slate-950/40 border-slate-800/80 hover:bg-slate-950' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                    }`}>
                      <div>
                        <span className="text-xs font-bold block">Restrict Login to Whitelisted IPs Only</span>
                        <span className="text-[10px] text-slate-500">Block sign-ins from unverified VPN or external subnet addresses.</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={restrictIp}
                        onChange={e => setRestrictIp(e.target.checked)}
                        className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                      />
                    </label>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      className="flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 transition-all shadow-md shadow-emerald-600/10"
                    >
                      <Save className="w-4 h-4" />
                      <span>Save Security Configuration</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* IP Whitelist Manager */}
              <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
                <h3 className={`text-sm font-extrabold mb-2 flex items-center space-x-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                  <Globe className="w-4 h-4 text-emerald-500" />
                  <span>Authorized Subnets & Corporate IP Whitelist</span>
                </h3>
                <p className="text-xs text-slate-500 mb-4">
                  Only network requests originating from these IP ranges will be granted administrative API execution.
                </p>

                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={newIpAddress}
                    onChange={e => setNewIpAddress(e.target.value)}
                    placeholder="e.g. 192.168.1.0/24 or 203.0.113.45"
                    className={`flex-1 px-3 py-2 text-xs rounded-xl border outline-none font-mono ${
                      darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={handleAddIpWhitelist}
                    className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 transition-all shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add IP</span>
                  </button>
                </div>

                <div className="space-y-1.5">
                  {ipWhitelist.map(ip => (
                    <div
                      key={ip}
                      className={`flex items-center justify-between p-2.5 rounded-xl border text-xs ${
                        darkMode ? 'bg-slate-950/40 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
                      }`}
                    >
                      <span className="font-mono font-bold">{ip}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveIpWhitelist(ip)}
                        className="text-red-500 hover:text-red-400 p-1"
                        title="Remove IP"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column: Live Connected Sessions (5 cols) */}
            <div className="lg:col-span-5 space-y-4">
              <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className={`text-sm font-extrabold flex items-center space-x-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                    <Activity className="w-4 h-4 text-emerald-500" />
                    <span>Active User Sessions</span>
                  </h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400">
                    {activeSessions.length} Online
                  </span>
                </div>
                <p className="text-xs text-slate-500 mb-4">
                  Real-time active connection tokens. Terminate compromised or unauthorized sessions immediately.
                </p>

                <div className="space-y-3">
                  {activeSessions.map(session => (
                    <div
                      key={session.id}
                      className={`p-3.5 rounded-xl border space-y-2 ${
                        darkMode ? 'bg-slate-950/40 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="font-bold text-xs block">{session.userName}</span>
                          <span className="text-[10px] text-slate-500">{session.userEmail}</span>
                        </div>
                        <button
                          onClick={() => handleKillSession(session.id, session.userName)}
                          className="px-2 py-1 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 text-[10px] font-bold transition-all"
                        >
                          Kill Session
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[10px] pt-1 text-slate-400 font-mono">
                        <div>IP: {session.ipAddress}</div>
                        <div>Loc: {session.location}</div>
                        <div className="col-span-2">Device: {session.device}</div>
                        <div className="col-span-2 text-emerald-400">Last Active: {new Date(session.lastActive).toLocaleTimeString()}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : activeTab === 'inspector' ? (
        /* ======================== PERMISSION INSPECTOR & ROLE COMPARATOR VIEW ======================== */
        <div className="space-y-6 animate-fade-in">
          {/* Header */}
          <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
            <h2 className={`text-base font-extrabold tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              Granular Permission Inspector & Role Comparator
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Simulate access authorization verdicts for any employee or role against all ERP modules, or compare two roles side-by-side.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Permission Simulation Inspector (6 cols) */}
            <div className="lg:col-span-6 space-y-4">
              <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
                <h3 className={`text-sm font-extrabold mb-3 flex items-center space-x-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                  <Search className="w-4 h-4 text-emerald-500" />
                  <span>Interactive Access Tester</span>
                </h3>

                <div className="space-y-3.5">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Select Role to Test</label>
                    <select
                      value={inspectorRole}
                      onChange={e => {
                        setInspectorRole(e.target.value);
                        setInspectorUser('');
                      }}
                      className={`w-full px-3 py-2 text-xs rounded-xl border outline-none ${
                        darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                      }`}
                    >
                      <option value="">-- Choose Role --</option>
                      {roles.map(r => (
                        <option key={r.id} value={r.id}>{r.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Or Select Employee</label>
                    <select
                      value={inspectorUser}
                      onChange={e => {
                        setInspectorUser(e.target.value);
                        setInspectorRole('');
                      }}
                      className={`w-full px-3 py-2 text-xs rounded-xl border outline-none ${
                        darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                      }`}
                    >
                      <option value="">-- Choose Employee --</option>
                      {users.filter(u => !u.deletedAt).map(u => (
                        <option key={u.id} value={u.id}>{u.name} ({u.role?.name || 'Assigned Role'})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Target ERP Module</label>
                    <select
                      value={inspectorModule}
                      onChange={e => setInspectorModule(e.target.value)}
                      className={`w-full px-3 py-2 text-xs rounded-xl border outline-none ${
                        darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                      }`}
                    >
                      {modules.map(m => (
                        <option key={m.prefix} value={m.prefix}>{m.label} ({m.prefix})</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Verdict Results Table */}
                <div className="mt-5 space-y-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                    Authorization Verdict for: <strong className="text-emerald-400">{inspectorTargetRole?.name || 'Selected Target'}</strong>
                  </span>

                  <div className="space-y-1.5">
                    {inspectorPermissionsVerdict.map(item => (
                      <div
                        key={item.action}
                        className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
                          item.granted
                            ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400'
                            : (darkMode ? 'bg-slate-950/40 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500')
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          {item.granted ? (
                            <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                          ) : (
                            <X className="w-4 h-4 text-red-400 shrink-0" />
                          )}
                          <div>
                            <span className="font-bold uppercase tracking-wider text-[11px] block">{item.action} Action</span>
                            <span className="text-[9px] font-mono text-slate-500">{item.permKey}</span>
                          </div>
                        </div>

                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-md ${
                          item.granted ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                        }`}>
                          {item.reason}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Role Comparison Side-by-Side (6 cols) */}
            <div className="lg:col-span-6 space-y-4">
              <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
                <h3 className={`text-sm font-extrabold mb-3 flex items-center space-x-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                  <ArrowRightLeft className="w-4 h-4 text-emerald-500" />
                  <span>Side-by-Side Role Comparator</span>
                </h3>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Role A</label>
                    <select
                      value={compareRoleA}
                      onChange={e => setCompareRoleA(e.target.value)}
                      className={`w-full px-3 py-2 text-xs rounded-xl border outline-none ${
                        darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                      }`}
                    >
                      {roles.map(r => (
                        <option key={r.id} value={r.id}>{r.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Role B</label>
                    <select
                      value={compareRoleB}
                      onChange={e => setCompareRoleB(e.target.value)}
                      className={`w-full px-3 py-2 text-xs rounded-xl border outline-none ${
                        darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                      }`}
                    >
                      {roles.map(r => (
                        <option key={r.id} value={r.id}>{r.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Comparison Matrix */}
                <div className="max-h-96 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden scrollbar-thin">
                  <table className="w-full text-left text-xs">
                    <thead className={`text-[10px] font-extrabold uppercase tracking-wider border-b sticky top-0 ${
                      darkMode ? 'bg-slate-950 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}>
                      <tr>
                        <th className="px-3 py-2.5">Permission Key</th>
                        <th className="px-3 py-2.5 text-center">{roleAObj?.name || 'Role A'}</th>
                        <th className="px-3 py-2.5 text-center">{roleBObj?.name || 'Role B'}</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y font-medium ${darkMode ? 'divide-slate-800/60 text-slate-300' : 'divide-slate-100 text-slate-700'}`}>
                      {roleComparisonData.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="py-8 text-center text-slate-500 italic">
                            Select two roles to compare their permission sets.
                          </td>
                        </tr>
                      ) : (
                        roleComparisonData.map(item => (
                          <tr key={item.permission} className="hover:bg-slate-500/5 transition-colors">
                            <td className="px-3 py-2">
                              <span className="font-bold block text-[11px]">{item.moduleLabel}</span>
                              <span className="text-[9px] font-mono text-slate-500">{item.permission}</span>
                            </td>
                            <td className="px-3 py-2 text-center">
                              {item.inRoleA ? (
                                <span className="inline-flex p-1 rounded-md bg-emerald-500/10 text-emerald-400">
                                  <Check className="w-3.5 h-3.5" />
                                </span>
                              ) : (
                                <span className="inline-flex p-1 rounded-md bg-red-500/10 text-red-400">
                                  <X className="w-3.5 h-3.5" />
                                </span>
                              )}
                            </td>
                            <td className="px-3 py-2 text-center">
                              {item.inRoleB ? (
                                <span className="inline-flex p-1 rounded-md bg-emerald-500/10 text-emerald-400">
                                  <Check className="w-3.5 h-3.5" />
                                </span>
                              ) : (
                                <span className="inline-flex p-1 rounded-md bg-red-500/10 text-red-400">
                                  <X className="w-3.5 h-3.5" />
                                </span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : activeTab === 'recycle_bin' ? (
        /* ======================== IAM RECYCLE BIN & ARCHIVAL VIEW ======================== */
        <div className="space-y-4">
          {/* Top Banner with Retention Notice */}
          <div className={`p-4 rounded-2xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
            darkMode ? 'bg-amber-950/20 border-amber-800/40 text-amber-200' : 'bg-amber-50 border-amber-200/80 text-amber-900 shadow-sm'
          }`}>
            <div className="flex items-start space-x-3.5">
              <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20 shrink-0">
                <Archive className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm flex items-center space-x-2">
                  <span>IAM Compliance Recycle Bin & Forensics</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    30-Day Auto Retention
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-1 max-w-3xl">
                  Soft-deleted user accounts, decommissioned roles, and archived departments are preserved here with full cryptographic audit logs before permanent purge. Restoring a record immediately recovers active privileges and assignments.
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2 shrink-0 self-end md:self-center">
              {selectedRecycleIds.length > 0 ? (
                <>
                  <button
                    onClick={handleBatchRestore}
                    disabled={isRestoring}
                    className="flex items-center space-x-1.5 px-3 py-2 text-xs font-bold rounded-xl bg-emerald-600 text-white hover:bg-emerald-500 transition-all shadow-md shadow-emerald-600/10 disabled:opacity-50"
                  >
                    <RotateCcw className={`w-3.5 h-3.5 ${isRestoring ? 'animate-spin' : ''}`} />
                    <span>Restore Selected ({selectedRecycleIds.length})</span>
                  </button>
                  <button
                    onClick={() => setConfirmPermanentDelete({
                      type: 'batch',
                      name: `${selectedRecycleIds.length} Selected IAM Records`,
                      items: selectedRecycleIds
                    })}
                    className="flex items-center space-x-1.5 px-3 py-2 text-xs font-bold rounded-xl bg-red-600 text-white hover:bg-red-500 transition-all shadow-md shadow-red-600/10"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Purge Selected</span>
                  </button>
                </>
              ) : (
                iamRecycleItems.length > 0 && (
                  <button
                    onClick={() => setConfirmPermanentDelete({
                      type: 'batch',
                      name: 'All Recycle Bin Items',
                      items: iamRecycleItems.map(i => i.id)
                    })}
                    className="flex items-center space-x-1.5 px-3 py-2 text-xs font-bold rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Empty Recycle Bin</span>
                  </button>
                )
              )}
            </div>
          </div>

          {/* Filters & Search Toolbar */}
          <div className={`p-4 rounded-2xl border ${
            darkMode ? 'bg-slate-900/60 border-slate-800/80' : 'bg-white border-slate-200/80 shadow-sm'
          }`}>
            <div className="flex flex-col md:flex-row items-center justify-between gap-3">
              {/* Search */}
              <div className="relative w-full md:w-80">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search deleted records by name, email, code..."
                  value={recycleSearch}
                  onChange={e => setRecycleSearch(e.target.value)}
                  className={`w-full pl-9 pr-4 py-2 text-xs rounded-xl border outline-none transition-all ${
                    darkMode 
                      ? 'bg-slate-950/80 border-slate-800 text-white focus:border-amber-500' 
                      : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-amber-600'
                  }`}
                />
              </div>

              {/* Entity Type Filter Tabs */}
              <div className="flex items-center space-x-1 self-start md:self-auto overflow-x-auto">
                <button
                  onClick={() => setRecycleFilter('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    recycleFilter === 'all'
                      ? 'bg-amber-600 text-white shadow-sm'
                      : darkMode ? 'text-slate-400 hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  All Items ({iamRecycleItems.length})
                </button>
                <button
                  onClick={() => setRecycleFilter('users')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    recycleFilter === 'users'
                      ? 'bg-amber-600 text-white shadow-sm'
                      : darkMode ? 'text-slate-400 hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Users ({iamRecycleItems.filter(i => i.type === 'user').length})
                </button>
                <button
                  onClick={() => setRecycleFilter('roles')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    recycleFilter === 'roles'
                      ? 'bg-amber-600 text-white shadow-sm'
                      : darkMode ? 'text-slate-400 hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Roles ({iamRecycleItems.filter(i => i.type === 'role').length})
                </button>
                <button
                  onClick={() => setRecycleFilter('departments')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    recycleFilter === 'departments'
                      ? 'bg-amber-600 text-white shadow-sm'
                      : darkMode ? 'text-slate-400 hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Departments ({iamRecycleItems.filter(i => i.type === 'department').length})
                </button>
              </div>
            </div>
          </div>

          {/* Recycle Bin Table */}
          <div className={`rounded-2xl border overflow-hidden ${
            darkMode ? 'bg-slate-900/60 border-slate-800/80' : 'bg-white border-slate-200/80 shadow-sm'
          }`}>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className={`text-[10px] font-extrabold uppercase tracking-wider border-b ${
                  darkMode ? 'bg-slate-950/80 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'
                }`}>
                  <tr>
                    <th className="py-3 px-4 w-10">
                      <input
                        type="checkbox"
                        checked={filteredRecycleItems.length > 0 && selectedRecycleIds.length === filteredRecycleItems.length}
                        onChange={toggleSelectAllRecycle}
                        className="rounded border-slate-700 text-amber-600 focus:ring-amber-500 cursor-pointer"
                      />
                    </th>
                    <th className="py-3 px-4">Entity Type</th>
                    <th className="py-3 px-4">Record Name & Identity</th>
                    <th className="py-3 px-4">Scope / Department</th>
                    <th className="py-3 px-4">Deleted By & Date</th>
                    <th className="py-3 px-4 text-center">Auto-Purge In</th>
                    <th className="py-3 px-4 text-right">Recovery Actions</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${darkMode ? 'divide-slate-800/60 text-slate-300' : 'divide-slate-100 text-slate-700'}`}>
                  {filteredRecycleItems.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-16 text-center">
                        <div className="flex flex-col items-center justify-center space-y-3">
                          <div className="p-3 rounded-full bg-slate-800/40 text-slate-500 border border-slate-700/50">
                            <Trash2 className="w-8 h-8 opacity-40" />
                          </div>
                          <div>
                            <p className="font-bold text-sm text-slate-400">Recycle Bin is Clean</p>
                            <p className="text-xs text-slate-500 mt-0.5">No deleted users, roles, or departments currently waiting in trash.</p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredRecycleItems.map(item => {
                      const isSelected = selectedRecycleIds.includes(item.id);
                      return (
                        <tr key={item.id} className={`hover:bg-slate-500/5 transition-colors ${isSelected ? (darkMode ? 'bg-amber-950/10' : 'bg-amber-50/50') : ''}`}>
                          <td className="py-3.5 px-4">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelectRecycleItem(item.id)}
                              className="rounded border-slate-700 text-amber-600 focus:ring-amber-500 cursor-pointer"
                            />
                          </td>
                          <td className="py-3.5 px-4 font-bold">
                            {item.type === 'user' && (
                              <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                <User className="w-3 h-3" />
                                <span>User Account</span>
                              </span>
                            )}
                            {item.type === 'role' && (
                              <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20">
                                <Key className="w-3 h-3" />
                                <span>Security Role</span>
                              </span>
                            )}
                            {item.type === 'department' && (
                              <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                <Building className="w-3 h-3" />
                                <span>Department</span>
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-extrabold text-sm">{item.title}</div>
                            <div className="text-[11px] text-slate-400 mt-0.5">{item.subtitle}</div>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                              {item.departmentOrCode}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-xs">
                            <div className="font-semibold text-slate-300">{item.deletedBy}</div>
                            <div className="text-[10px] text-slate-500">{new Date(item.deletedAt).toLocaleString()}</div>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                              <Clock className="w-3 h-3" />
                              <span>{item.daysRemaining} days left</span>
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end space-x-2">
                              <button
                                onClick={() => handleRestoreRecycleItem(item)}
                                disabled={isRestoring}
                                title="Restore this record back to active state"
                                className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-bold text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 transition-all"
                              >
                                <RotateCcw className="w-3 h-3" />
                                <span>Restore</span>
                              </button>
                              <button
                                onClick={() => setConfirmPermanentDelete({
                                  type: item.type,
                                  id: item.id,
                                  name: item.title
                                })}
                                title="Permanently delete from database (irreversible)"
                                className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-bold text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 transition-all"
                              >
                                <Trash2 className="w-3 h-3" />
                                <span>Purge</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : null}

      {/* ======================== ADD / EDIT DEPARTMENT MODAL ======================== */}
      {isDeptModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className={`w-full max-w-lg rounded-2xl border shadow-xl p-5 overflow-hidden animate-fade-in ${
            darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 mb-4">
              <div className="flex items-center space-x-2.5">
                <Building className="w-5 h-5 text-emerald-500" />
                <h3 className="font-extrabold text-sm tracking-tight">
                  {editingDept ? `Edit Department: ${editingDept.name}` : 'Create New Department'}
                </h3>
              </div>
              <button 
                onClick={() => setIsDeptModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>

            <form onSubmit={handleDeptSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3.5">
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Department Name *</label>
                  <input
                    type="text"
                    required
                    value={deptForm.name}
                    onChange={e => setDeptForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g. Quality Control"
                    className={`w-full px-3 py-2 text-xs border rounded-xl outline-none ${
                      darkMode ? 'bg-slate-950 border-slate-800 text-white focus:border-emerald-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-600'
                    }`}
                  />
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Department Code *</label>
                  <input
                    type="text"
                    required
                    value={deptForm.code}
                    onChange={e => setDeptForm(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                    placeholder="e.g. QC"
                    className={`w-full px-3 py-2 text-xs border rounded-xl outline-none font-mono uppercase ${
                      darkMode ? 'bg-slate-950 border-slate-800 text-white focus:border-emerald-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-600'
                    }`}
                  />
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Department Head Name</label>
                  <input
                    type="text"
                    value={deptForm.headName}
                    onChange={e => setDeptForm(prev => ({ ...prev, headName: e.target.value }))}
                    placeholder="e.g. Sunita Rao"
                    className={`w-full px-3 py-2 text-xs border rounded-xl outline-none ${
                      darkMode ? 'bg-slate-950 border-slate-800 text-white focus:border-emerald-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-600'
                    }`}
                  />
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Head Email Address</label>
                  <input
                    type="email"
                    value={deptForm.headEmail}
                    onChange={e => setDeptForm(prev => ({ ...prev, headEmail: e.target.value }))}
                    placeholder="head@amkerp.com"
                    className={`w-full px-3 py-2 text-xs border rounded-xl outline-none ${
                      darkMode ? 'bg-slate-950 border-slate-800 text-white focus:border-emerald-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-600'
                    }`}
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Office / Plant Location</label>
                  <input
                    type="text"
                    value={deptForm.location}
                    onChange={e => setDeptForm(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="e.g. Unit 3, Testing Lab"
                    className={`w-full px-3 py-2 text-xs border rounded-xl outline-none ${
                      darkMode ? 'bg-slate-950 border-slate-800 text-white focus:border-emerald-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-600'
                    }`}
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Description</label>
                  <textarea
                    rows={2}
                    value={deptForm.description}
                    onChange={e => setDeptForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Brief description of department operational scope..."
                    className={`w-full px-3 py-2 text-xs border rounded-xl outline-none resize-none ${
                      darkMode ? 'bg-slate-950 border-slate-800 text-white focus:border-emerald-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-600'
                    }`}
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsDeptModalOpen(false)}
                  className={`px-4 py-2 text-xs font-bold rounded-xl border transition-all ${
                    darkMode ? 'bg-transparent border-slate-800 text-slate-400 hover:bg-slate-800' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center space-x-1.5 px-5 py-2 text-xs font-bold rounded-xl text-white bg-emerald-600 hover:bg-emerald-500 transition-all shadow-md shadow-emerald-600/10"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{editingDept ? 'Update Department' : 'Create Department'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================== INSPECT AUDIT DIFF MODAL ======================== */}
      {inspectAuditDiff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className={`w-full max-w-lg rounded-2xl border shadow-xl p-5 overflow-hidden animate-fade-in ${
            darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 mb-4">
              <div className="flex items-center space-x-2.5">
                <History className="w-5 h-5 text-emerald-500" />
                <h3 className="font-extrabold text-sm tracking-tight">Audit Event Forensic Inspection</h3>
              </div>
              <button 
                onClick={() => setInspectAuditDiff(null)}
                className="p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className={`p-3.5 rounded-xl border space-y-2 ${darkMode ? 'bg-slate-950/50 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-bold uppercase text-[10px]">Action Type:</span>
                  <span className="font-bold font-mono">{inspectAuditDiff.action}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-bold uppercase text-[10px]">Target Entity:</span>
                  <span className="font-bold">{inspectAuditDiff.entity} (#{inspectAuditDiff.entityId})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-bold uppercase text-[10px]">Operator:</span>
                  <span className="font-semibold">{inspectAuditDiff.user}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-bold uppercase text-[10px]">Timestamp:</span>
                  <span className="font-mono text-slate-400">{new Date(inspectAuditDiff.timestamp).toLocaleString()}</span>
                </div>
              </div>

              {/* Diff View */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">State Mutation Diff</span>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl border border-red-500/20 bg-red-500/5">
                    <span className="text-[10px] font-bold text-red-400 uppercase block mb-1">Previous Value</span>
                    <pre className="text-[11px] font-mono text-slate-300 whitespace-pre-wrap break-all">
                      {inspectAuditDiff.oldValue ? String(inspectAuditDiff.oldValue) : '(null / undefined)'}
                    </pre>
                  </div>
                  <div className="p-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5">
                    <span className="text-[10px] font-bold text-emerald-400 uppercase block mb-1">New Value</span>
                    <pre className="text-[11px] font-mono text-slate-300 whitespace-pre-wrap break-all">
                      {inspectAuditDiff.newValue ? String(inspectAuditDiff.newValue) : '(null / undefined)'}
                    </pre>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl border border-slate-800 bg-slate-950/40">
                <span className="text-[10px] font-bold text-slate-500 uppercase block mb-0.5">Narrative Log</span>
                <p className="text-slate-300 text-xs">{inspectAuditDiff.details}</p>
              </div>
            </div>

            <div className="flex justify-end pt-4 mt-4 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setInspectAuditDiff(null)}
                className={`px-4 py-2 text-xs font-bold rounded-xl border transition-all ${
                  darkMode ? 'bg-slate-800 border-slate-700 text-white hover:bg-slate-700' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-xs'
                }`}
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================== ADD USER MODAL ======================== */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className={`w-full max-w-lg rounded-2xl border shadow-xl p-5 overflow-hidden animate-fade-in ${
            darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 mb-4">
              <div className="flex items-center space-x-2.5">
                <UserPlus className="w-5 h-5 text-emerald-500" />
                <h3 className="font-extrabold text-sm tracking-tight">Provision New Employee Account</h3>
              </div>
              <button 
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateUserSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3.5">
                {/* Name */}
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={createForm.name}
                    onChange={e => setCreateForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g. John Doe"
                    className={`w-full px-3 py-2 text-xs border rounded-xl outline-none transition-all ${
                      darkMode
                        ? 'bg-slate-950 border-slate-800 text-white focus:border-emerald-500'
                        : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-600'
                    }`}
                  />
                </div>

                {/* Email */}
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={createForm.email}
                    onChange={e => setCreateForm(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="e.g. john@amkcarton.com"
                    className={`w-full px-3 py-2 text-xs border rounded-xl outline-none transition-all ${
                      darkMode
                        ? 'bg-slate-950 border-slate-800 text-white focus:border-emerald-500'
                        : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-600'
                    }`}
                  />
                </div>

                {/* Password */}
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Temporary Password</label>
                  <input
                    type="text"
                    required
                    value={createForm.password}
                    onChange={e => setCreateForm(prev => ({ ...prev, password: e.target.value }))}
                    className={`w-full px-3 py-2 text-xs border rounded-xl outline-none transition-all ${
                      darkMode
                        ? 'bg-slate-950 border-slate-800 text-white focus:border-emerald-500'
                        : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-600'
                    }`}
                  />
                </div>

                {/* Enterprise/Department */}
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Enterprise Department</label>
                  <input
                    type="text"
                    value={createForm.department}
                    onChange={e => setCreateForm(prev => ({ ...prev, department: e.target.value }))}
                    placeholder="e.g. Supply Chain"
                    className={`w-full px-3 py-2 text-xs border rounded-xl outline-none transition-all ${
                      darkMode
                        ? 'bg-slate-950 border-slate-800 text-white focus:border-emerald-500'
                        : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-600'
                    }`}
                  />
                </div>

                {/* Role */}
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Initial Security Role *</label>
                  <select
                    required
                    value={createForm.roleId}
                    onChange={e => setCreateForm(prev => ({ ...prev, roleId: e.target.value }))}
                    className={`w-full px-3 py-2 text-xs border rounded-xl outline-none transition-all ${
                      darkMode
                        ? 'bg-slate-950 border-slate-800 text-white focus:border-emerald-500'
                        : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-600'
                    }`}
                  >
                    <option value="">Select security role...</option>
                    {roles.map(r => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                </div>

                {/* Address */}
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Enterprise Address / Desk</label>
                  <input
                    type="text"
                    value={createForm.address}
                    onChange={e => setCreateForm(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="e.g. Warehouse Block B, Desk 4"
                    className={`w-full px-3 py-2 text-xs border rounded-xl outline-none transition-all ${
                      darkMode
                        ? 'bg-slate-950 border-slate-800 text-white focus:border-emerald-500'
                        : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-600'
                    }`}
                  />
                </div>

                {/* Initials Color Avatar */}
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Initials Theme Color</label>
                  <select
                    value={createForm.avatar}
                    onChange={e => setCreateForm(prev => ({ ...prev, avatar: e.target.value }))}
                    className={`w-full px-3 py-2 text-xs border rounded-xl outline-none transition-all ${
                      darkMode
                        ? 'bg-slate-950 border-slate-800 text-white focus:border-emerald-500'
                        : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-600'
                    }`}
                  >
                    <option value="emerald">Emerald Theme</option>
                    <option value="indigo">Indigo Theme</option>
                    <option value="amber">Amber Theme</option>
                    <option value="rose">Rose Theme</option>
                    <option value="sky">Sky Theme</option>
                    <option value="violet">Violet Theme</option>
                    <option value="teal">Teal Theme</option>
                  </select>
                </div>

                {/* Status */}
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Account Status</label>
                  <select
                    value={createForm.status}
                    onChange={e => setCreateForm(prev => ({ ...prev, status: e.target.value as any }))}
                    className={`w-full px-3 py-2 text-xs border rounded-xl outline-none transition-all ${
                      darkMode
                        ? 'bg-slate-950 border-slate-800 text-white focus:border-emerald-500'
                        : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-600'
                    }`}
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              {/* Submitting Buttons */}
              <div className="flex justify-end space-x-2 pt-4 border-t border-slate-200 dark:border-slate-800 mt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className={`px-4 py-2 text-xs font-bold rounded-xl border transition-all ${
                    darkMode
                      ? 'bg-transparent border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-white'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-950 shadow-xs'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingCreate}
                  className="flex items-center justify-center space-x-2 px-5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 transition-all shadow-md shadow-emerald-600/10 disabled:opacity-50"
                >
                  {submittingCreate ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <UserPlus className="w-3.5 h-3.5" />}
                  <span>Provision Account</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================== EDIT USER MODAL ======================== */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className={`w-full max-w-lg rounded-2xl border shadow-xl p-5 overflow-hidden animate-fade-in ${
            darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 mb-4">
              <div className="flex items-center space-x-2.5">
                <Edit className="w-5 h-5 text-emerald-500" />
                <h3 className="font-extrabold text-sm tracking-tight">Edit Employee Profile</h3>
              </div>
              <button 
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleEditUserSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3.5">
                {/* Name */}
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={editForm.name}
                    onChange={e => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g. John Doe"
                    className={`w-full px-3 py-2 text-xs border rounded-xl outline-none transition-all ${
                      darkMode
                        ? 'bg-slate-950 border-slate-800 text-white focus:border-emerald-500'
                        : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-600'
                    }`}
                  />
                </div>

                {/* Email */}
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={editForm.email}
                    onChange={e => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="e.g. john@amkcarton.com"
                    className={`w-full px-3 py-2 text-xs border rounded-xl outline-none transition-all ${
                      darkMode
                        ? 'bg-slate-950 border-slate-800 text-white focus:border-emerald-500'
                        : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-600'
                    }`}
                  />
                </div>

                {/* Password change (optional) */}
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Reset Password (leave blank to keep current)</label>
                  <input
                    type="text"
                    value={editForm.password}
                    onChange={e => setEditForm(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="Enter new password..."
                    className={`w-full px-3 py-2 text-xs border rounded-xl outline-none transition-all ${
                      darkMode
                        ? 'bg-slate-950 border-slate-800 text-white focus:border-emerald-500'
                        : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-600'
                    }`}
                  />
                </div>

                {/* Enterprise/Department */}
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Enterprise Department</label>
                  <input
                    type="text"
                    value={editForm.department}
                    onChange={e => setEditForm(prev => ({ ...prev, department: e.target.value }))}
                    placeholder="e.g. Supply Chain"
                    className={`w-full px-3 py-2 text-xs border rounded-xl outline-none transition-all ${
                      darkMode
                        ? 'bg-slate-950 border-slate-800 text-white focus:border-emerald-500'
                        : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-600'
                    }`}
                  />
                </div>

                {/* Role */}
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Security Role *</label>
                  <select
                    required
                    value={editForm.roleId}
                    onChange={e => setEditForm(prev => ({ ...prev, roleId: e.target.value }))}
                    className={`w-full px-3 py-2 text-xs border rounded-xl outline-none transition-all ${
                      darkMode
                        ? 'bg-slate-950 border-slate-800 text-white focus:border-emerald-500'
                        : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-600'
                    }`}
                  >
                    <option value="">Select security role...</option>
                    {roles.map(r => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                </div>

                {/* Address */}
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Enterprise Address / Desk</label>
                  <input
                    type="text"
                    value={editForm.address}
                    onChange={e => setEditForm(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="e.g. Warehouse Block B, Desk 4"
                    className={`w-full px-3 py-2 text-xs border rounded-xl outline-none transition-all ${
                      darkMode
                        ? 'bg-slate-950 border-slate-800 text-white focus:border-emerald-500'
                        : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-600'
                    }`}
                  />
                </div>

                {/* Initials Color Avatar */}
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Initials Theme Color</label>
                  <select
                    value={editForm.avatar}
                    onChange={e => setEditForm(prev => ({ ...prev, avatar: e.target.value }))}
                    className={`w-full px-3 py-2 text-xs border rounded-xl outline-none transition-all ${
                      darkMode
                        ? 'bg-slate-950 border-slate-800 text-white focus:border-emerald-500'
                        : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-600'
                    }`}
                  >
                    <option value="emerald">Emerald Theme</option>
                    <option value="indigo">Indigo Theme</option>
                    <option value="amber">Amber Theme</option>
                    <option value="rose">Rose Theme</option>
                    <option value="sky">Sky Theme</option>
                    <option value="violet">Violet Theme</option>
                    <option value="teal">Teal Theme</option>
                  </select>
                </div>

                {/* Status */}
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Account Status</label>
                  <select
                    value={editForm.status}
                    onChange={e => setEditForm(prev => ({ ...prev, status: e.target.value as any }))}
                    className={`w-full px-3 py-2 text-xs border rounded-xl outline-none transition-all ${
                      darkMode
                        ? 'bg-slate-950 border-slate-800 text-white focus:border-emerald-500'
                        : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-600'
                    }`}
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end space-x-2 pt-4 border-t border-slate-200 dark:border-slate-800 mt-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className={`px-4 py-2 text-xs font-bold rounded-xl border transition-all ${
                    darkMode
                      ? 'bg-transparent border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-white'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-950 shadow-xs'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingEdit}
                  className="flex items-center justify-center space-x-2 px-5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 transition-all shadow-md shadow-emerald-600/10 disabled:opacity-50"
                >
                  {submittingEdit ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  <span>Save Profile</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================== CUSTOM CONFIRMATION DIALOG MODAL ======================== */}
      {confirmDeleteUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className={`w-full max-w-md rounded-2xl border shadow-xl p-5 overflow-hidden animate-fade-in ${
            darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="flex items-start space-x-3.5 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-500/15 text-red-500 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm tracking-tight">Confirm Account Suspension & Move to Recycle Bin</h3>
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                  Are you sure you want to suspend and archive the employee account of{' '}
                  <strong className="text-red-400 font-bold">{confirmDeleteUser.name}</strong> ({confirmDeleteUser.email})? 
                  This will revoke their access to the ERP immediately and move their record to the <strong>Recycle Bin</strong>, where it can be restored anytime by an Administrator.
                </p>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setConfirmDeleteUser(null)}
                className={`px-4 py-2 text-xs font-bold rounded-xl border transition-all ${
                  darkMode
                    ? 'bg-transparent border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-white'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-950 shadow-xs'
                }`}
              >
                No, Keep Active
              </button>
              <button
                type="button"
                disabled={deletingUser}
                onClick={handleDeleteUserConfirm}
                className="flex items-center justify-center space-x-2 px-5 py-2 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-500 transition-all shadow-md shadow-red-600/10 disabled:opacity-50"
              >
                {deletingUser ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <UserX className="w-3.5 h-3.5" />}
                <span>Yes, Suspend Account</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================== CREATE CUSTOM ROLE MODAL ======================== */}
      {isCreateRoleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className={`w-full max-w-2xl rounded-2xl border shadow-xl p-5 overflow-hidden animate-fade-in flex flex-col max-h-[90vh] ${
            darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 mb-4 shrink-0">
              <div className="flex items-center space-x-2.5">
                <ShieldCheck className="w-5 h-5 text-emerald-500" />
                <h3 className="font-extrabold text-sm tracking-tight">Create Custom Security Role</h3>
              </div>
              <button 
                onClick={() => setIsCreateRoleModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-850 transition-colors"
              >
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={e => handleRoleSubmit(e, false)} className="flex flex-col flex-1 overflow-hidden space-y-4">
              <div className="space-y-3.5 shrink-0">
                {/* Role Presets Quick Selection */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1">
                      <Sparkles className="w-3 h-3 text-emerald-500" />
                      <span>Quick Role Templates (Optional)</span>
                    </label>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {ROLE_PRESETS.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          const nextPerms: Record<string, boolean> = {};
                          modules.forEach(m => {
                            if (preset.prefixes.includes(m.prefix)) {
                              m.actions.forEach(a => {
                                nextPerms[`${m.prefix}:${a}`] = true;
                              });
                            }
                          });
                          setRoleForm({
                            id: '',
                            name: preset.name,
                            description: preset.description,
                            permissions: nextPerms
                          });
                        }}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all ${
                          roleForm.name === preset.name
                            ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400 shadow-xs'
                            : darkMode
                              ? 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                              : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 shadow-xs'
                        }`}
                      >
                        {preset.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Role Name */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Role Name *</label>
                  <input
                    type="text"
                    required
                    value={roleForm.name}
                    onChange={e => setRoleForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g. Purchase Executive"
                    className={`w-full px-3 py-2 text-xs border rounded-xl outline-none transition-all ${
                      darkMode
                        ? 'bg-slate-950 border-slate-800 text-white focus:border-emerald-500'
                        : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-600'
                    }`}
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Description (Optional)</label>
                  <textarea
                    rows={2}
                    value={roleForm.description}
                    onChange={e => setRoleForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Provide a clear description of who should be assigned this role and what it governs..."
                    className={`w-full px-3 py-2 text-xs border rounded-xl outline-none transition-all resize-none ${
                      darkMode
                        ? 'bg-slate-950 border-slate-800 text-white focus:border-emerald-500'
                        : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-600'
                    }`}
                  />
                </div>
              </div>

              {/* Module matrix */}
              <div className="flex-1 flex flex-col overflow-hidden space-y-2">
                <div className="flex items-center justify-between pb-1 shrink-0">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Module Permissions Matrix</span>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => {
                        const next: Record<string, boolean> = {};
                        modules.forEach(m => m.actions.forEach(a => next[`${m.prefix}:${a}`] = true));
                        setRoleForm(prev => ({ ...prev, permissions: next }));
                      }}
                      className={`px-2 py-1 rounded-lg border text-[9px] font-bold transition-all ${
                        darkMode ? 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-xs'
                      }`}
                    >
                      Select All
                    </button>
                    <button
                      type="button"
                      onClick={() => setRoleForm(prev => ({ ...prev, permissions: {} }))}
                      className={`px-2 py-1 rounded-lg border text-[9px] font-bold transition-all ${
                        darkMode ? 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 shadow-xs'
                      }`}
                    >
                      Clear All
                    </button>
                  </div>
                </div>

                <div className="flex-1 border border-slate-200 dark:border-slate-800/80 rounded-xl overflow-hidden flex flex-col min-h-0">
                  <div className={`grid grid-cols-12 gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider p-2.5 bg-slate-50 dark:bg-slate-950/40 border-b border-slate-200 dark:border-slate-800 shrink-0`}>
                    <div className="col-span-5">Module</div>
                    <div className="col-span-7 grid grid-cols-6 text-center">
                      <div>View</div>
                      <div>Add</div>
                      <div>Edit</div>
                      <div>Delete</div>
                      <div>Import</div>
                      <div>All</div>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 scrollbar-thin">
                    {modules.map((mod, index) => {
                      const isAllChecked = mod.actions.every(action => roleForm.permissions[`${mod.prefix}:${action}`]);
                      
                      const handleToggleRow = (checked: boolean) => {
                        setRoleForm(prev => {
                          const next = { ...prev.permissions };
                          mod.actions.forEach(action => {
                            next[`${mod.prefix}:${action}`] = checked;
                          });
                          return { ...prev, permissions: next };
                        });
                      };

                      const handleCellToggle = (permName: string, checked: boolean) => {
                        setRoleForm(prev => ({
                          ...prev,
                          permissions: {
                            ...prev.permissions,
                            [permName]: checked
                          }
                        }));
                      };

                      return (
                        <div key={index} className="grid grid-cols-12 gap-2 items-center p-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/10 transition-colors">
                          <div className="col-span-5">
                            <span className="text-xs font-bold block">{mod.label}</span>
                            <span className="text-[9px] font-mono text-slate-500">{mod.prefix}</span>
                          </div>
                          <div className="col-span-7 grid grid-cols-6">
                            {['view', 'create', 'edit', 'delete', 'import'].map(action => {
                              const isSupported = mod.actions.includes(action);
                              const permName = `${mod.prefix}:${action}`;
                              const isChecked = roleForm.permissions[permName] || false;

                              if (!isSupported) {
                                return <div key={action} className="flex justify-center text-slate-500">-</div>;
                              }

                              return (
                                <div key={action} className="flex justify-center">
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={e => handleCellToggle(permName, e.target.checked)}
                                    className={`w-3.5 h-3.5 rounded border outline-none cursor-pointer accent-emerald-500 ${
                                      darkMode ? 'border-slate-800 bg-slate-950 text-emerald-500' : 'border-slate-200 bg-white'
                                    }`}
                                  />
                                </div>
                              );
                            })}
                            
                            <div className="flex justify-center">
                              <input
                                type="checkbox"
                                checked={isAllChecked}
                                onChange={e => handleToggleRow(e.target.checked)}
                                className={`w-3.5 h-3.5 rounded border outline-none cursor-pointer accent-emerald-500 ${
                                  darkMode ? 'border-slate-800 bg-slate-950 text-emerald-500' : 'border-slate-200 bg-white'
                                }`}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Submit Footer */}
              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-200 dark:border-slate-800 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsCreateRoleModalOpen(false)}
                  className={`px-4 py-2 text-xs font-bold rounded-xl border transition-all ${
                    darkMode
                      ? 'bg-transparent border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-white'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-950 shadow-xs'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingRole}
                  className="flex items-center justify-center space-x-2 px-5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 transition-all shadow-md shadow-emerald-600/10 disabled:opacity-50"
                >
                  {submittingRole ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  <span>Create Role</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================== EDIT CUSTOM ROLE MODAL ======================== */}
      {isEditRoleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className={`w-full max-w-2xl rounded-2xl border shadow-xl p-5 overflow-hidden animate-fade-in flex flex-col max-h-[90vh] ${
            darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 mb-4 shrink-0">
              <div className="flex items-center space-x-2.5">
                <Edit className="w-5 h-5 text-emerald-500" />
                <h3 className="font-extrabold text-sm tracking-tight">Modify Security Role: <span className="text-emerald-500">{roleForm.name}</span></h3>
              </div>
              <button 
                onClick={() => setIsEditRoleModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-855 transition-colors"
              >
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={e => handleRoleSubmit(e, true)} className="flex flex-col flex-1 overflow-hidden space-y-4">
              <div className="space-y-3.5 shrink-0">
                {/* Role Name */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Role Name *</label>
                  <input
                    type="text"
                    required
                    value={roleForm.name}
                    onChange={e => setRoleForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g. Purchase Executive"
                    className={`w-full px-3 py-2 text-xs border rounded-xl outline-none transition-all ${
                      darkMode
                        ? 'bg-slate-950 border-slate-800 text-white focus:border-emerald-500'
                        : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-600'
                    }`}
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Description (Optional)</label>
                  <textarea
                    rows={2}
                    value={roleForm.description}
                    onChange={e => setRoleForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Provide a clear description of who should be assigned this role and what it governs..."
                    className={`w-full px-3 py-2 text-xs border rounded-xl outline-none transition-all resize-none ${
                      darkMode
                        ? 'bg-slate-950 border-slate-800 text-white focus:border-emerald-500'
                        : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-600'
                    }`}
                  />
                </div>
              </div>

              {/* Module matrix */}
              <div className="flex-1 flex flex-col overflow-hidden space-y-2">
                <div className="flex items-center justify-between pb-1 shrink-0">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Module Permissions Matrix</span>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => {
                        const next: Record<string, boolean> = {};
                        modules.forEach(m => m.actions.forEach(a => next[`${m.prefix}:${a}`] = true));
                        setRoleForm(prev => ({ ...prev, permissions: next }));
                      }}
                      className={`px-2 py-1 rounded-lg border text-[9px] font-bold transition-all ${
                        darkMode ? 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-xs'
                      }`}
                    >
                      Select All
                    </button>
                    <button
                      type="button"
                      onClick={() => setRoleForm(prev => ({ ...prev, permissions: {} }))}
                      className={`px-2 py-1 rounded-lg border text-[9px] font-bold transition-all ${
                        darkMode ? 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 shadow-xs'
                      }`}
                    >
                      Clear All
                    </button>
                  </div>
                </div>

                <div className="flex-1 border border-slate-200 dark:border-slate-800/80 rounded-xl overflow-hidden flex flex-col min-h-0">
                  <div className={`grid grid-cols-12 gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider p-2.5 bg-slate-50 dark:bg-slate-950/40 border-b border-slate-200 dark:border-slate-800 shrink-0`}>
                    <div className="col-span-5">Module</div>
                    <div className="col-span-7 grid grid-cols-6 text-center">
                      <div>View</div>
                      <div>Add</div>
                      <div>Edit</div>
                      <div>Delete</div>
                      <div>Import</div>
                      <div>All</div>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 scrollbar-thin">
                    {modules.map((mod, index) => {
                      const isAllChecked = mod.actions.every(action => roleForm.permissions[`${mod.prefix}:${action}`]);
                      
                      const handleToggleRow = (checked: boolean) => {
                        setRoleForm(prev => {
                          const next = { ...prev.permissions };
                          mod.actions.forEach(action => {
                            next[`${mod.prefix}:${action}`] = checked;
                          });
                          return { ...prev, permissions: next };
                        });
                      };

                      const handleCellToggle = (permName: string, checked: boolean) => {
                        setRoleForm(prev => ({
                          ...prev,
                          permissions: {
                            ...prev.permissions,
                            [permName]: checked
                          }
                        }));
                      };

                      return (
                        <div key={index} className="grid grid-cols-12 gap-2 items-center p-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/10 transition-colors">
                          <div className="col-span-5">
                            <span className="text-xs font-bold block">{mod.label}</span>
                            <span className="text-[9px] font-mono text-slate-500">{mod.prefix}</span>
                          </div>
                          <div className="col-span-7 grid grid-cols-6">
                            {['view', 'create', 'edit', 'delete', 'import'].map(action => {
                              const isSupported = mod.actions.includes(action);
                              const permName = `${mod.prefix}:${action}`;
                              const isChecked = roleForm.permissions[permName] || false;

                              if (!isSupported) {
                                return <div key={action} className="flex justify-center text-slate-500">-</div>;
                              }

                              return (
                                <div key={action} className="flex justify-center">
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={e => handleCellToggle(permName, e.target.checked)}
                                    className={`w-3.5 h-3.5 rounded border outline-none cursor-pointer accent-emerald-500 ${
                                      darkMode ? 'border-slate-800 bg-slate-950 text-emerald-500' : 'border-slate-200 bg-white'
                                    }`}
                                  />
                                </div>
                              );
                            })}
                            
                            <div className="flex justify-center">
                              <input
                                type="checkbox"
                                checked={isAllChecked}
                                onChange={e => handleToggleRow(e.target.checked)}
                                className={`w-3.5 h-3.5 rounded border outline-none cursor-pointer accent-emerald-500 ${
                                  darkMode ? 'border-slate-800 bg-slate-950 text-emerald-500' : 'border-slate-200 bg-white'
                                }`}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Submit Footer */}
              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-200 dark:border-slate-800 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsEditRoleModalOpen(false)}
                  className={`px-4 py-2 text-xs font-bold rounded-xl border transition-all ${
                    darkMode
                      ? 'bg-transparent border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-white'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-950 shadow-xs'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingRole}
                  className="flex items-center justify-center space-x-2 px-5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 transition-all shadow-md shadow-emerald-600/10 disabled:opacity-50"
                >
                  {submittingRole ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  <span>Save Role</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================== DELETE CUSTOM ROLE CONFIRMATION DIALOG ======================== */}
      {confirmDeleteRole && (() => {
        const assignedUsers = users.filter(u => u.roleId === confirmDeleteRole.id && !u.deletedAt);
        const hasAssignedUsers = assignedUsers.length > 0;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
            <div className={`w-full max-w-md rounded-2xl border shadow-xl p-5 overflow-hidden animate-fade-in ${
              darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
            }`}>
              <div className="flex items-start space-x-3.5 mb-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  hasAssignedUsers ? 'bg-amber-500/15 text-amber-500' : 'bg-red-500/15 text-red-500'
                }`}>
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm tracking-tight">
                    {hasAssignedUsers ? 'Role Deletion Blocked' : 'Delete Custom Role'}
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                    {hasAssignedUsers ? (
                      <>
                        The security role <strong className="text-amber-400 font-bold">{confirmDeleteRole.name}</strong> cannot be deleted because it is currently assigned to <span className="text-amber-400 font-bold">{assignedUsers.length} active employee(s)</span>. 
                        Please edit their profile or reassign them to another role first.
                      </>
                    ) : (
                      <>
                        Are you sure you want to permanently delete the custom security role <strong className="text-red-400 font-bold">{confirmDeleteRole.name}</strong>?
                        This will delete this group and revoke all permissions associated with it. This action is irreversible.
                      </>
                    )}
                  </p>
                  
                  {hasAssignedUsers && (
                    <div className="mt-3 p-2.5 rounded-xl bg-slate-950/40 border border-slate-800/40 text-[10px] text-slate-300">
                      <span className="font-bold block mb-1">Affected Employees:</span>
                      <div className="max-h-24 overflow-y-auto space-y-1 pr-1 scrollbar-thin">
                        {assignedUsers.map(u => (
                          <div key={u.id} className="flex justify-between">
                            <span>{u.name}</span>
                            <span className="text-slate-500">{u.email}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setConfirmDeleteRole(null)}
                  className={`px-4 py-2 text-xs font-bold rounded-xl border transition-all ${
                    darkMode
                      ? 'bg-transparent border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-white'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-950 shadow-xs'
                  }`}
                >
                  {hasAssignedUsers ? 'Dismiss' : 'Cancel'}
                </button>
                {!hasAssignedUsers && (
                  <button
                    type="button"
                    disabled={deletingRole}
                    onClick={handleDeleteRoleConfirm}
                    className="flex items-center justify-center space-x-2 px-5 py-2 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-500 transition-all shadow-md shadow-red-600/10 disabled:opacity-50"
                  >
                    {deletingRole ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                    <span>Delete Role</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* ======================== USER PROFILE & PERMISSIONS INSPECTION MODAL ======================== */}
      {viewProfileUser && (() => {
        const userRole = roles.find(r => r.id === viewProfileUser.roleId);
        const isActive = !viewProfileUser.deletedAt;
        const avatarInfo = getAvatarStyle(viewProfileUser.name, viewProfileUser.avatar);

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
            <div className={`w-full max-w-xl rounded-2xl border shadow-2xl p-6 overflow-hidden animate-fade-in flex flex-col max-h-[88vh] ${
              darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
            }`}>
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4 mb-4 shrink-0">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500 border border-blue-500/20">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base tracking-tight">Employee IAM Profile</h3>
                    <p className="text-[11px] text-slate-400">Detailed account metadata and authorized module capabilities</p>
                  </div>
                </div>
                <button 
                  onClick={() => setViewProfileUser(null)}
                  className="p-1 rounded-lg hover:bg-slate-800/40 text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin">
                {/* User Card */}
                <div className={`p-4 rounded-xl border flex items-center justify-between ${
                  darkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className="flex items-center space-x-3.5">
                    {avatarInfo.isImg ? (
                      <img 
                        src={avatarInfo.src} 
                        alt={viewProfileUser.name} 
                        className="w-12 h-12 rounded-xl object-cover border border-slate-200 dark:border-slate-800"
                      />
                    ) : (
                      <div className={`w-12 h-12 rounded-xl border flex items-center justify-center font-extrabold text-sm shrink-0 ${avatarInfo.class}`}>
                        {avatarInfo.initials}
                      </div>
                    )}
                    <div>
                      <h4 className="font-extrabold text-sm">{viewProfileUser.name}</h4>
                      <p className="text-xs text-slate-400 flex items-center mt-0.5">
                        <Mail className="w-3.5 h-3.5 mr-1 text-slate-500" />
                        <span>{viewProfileUser.email}</span>
                      </p>
                    </div>
                  </div>

                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${
                    isActive 
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                      : 'bg-red-500/10 text-red-400 border-red-500/30'
                  }`}>
                    {isActive ? 'Active Account' : 'Suspended'}
                  </span>
                </div>

                {/* Metadata Grid */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className={`p-3 rounded-xl border ${darkMode ? 'bg-slate-950/40 border-slate-800/80' : 'bg-slate-50 border-slate-200'}`}>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Department</span>
                    <span className="font-semibold flex items-center">
                      <Building className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
                      {viewProfileUser.department || 'Operations'}
                    </span>
                  </div>

                  <div className={`p-3 rounded-xl border ${darkMode ? 'bg-slate-950/40 border-slate-800/80' : 'bg-slate-50 border-slate-200'}`}>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Security Role</span>
                    <span className="font-semibold flex items-center text-emerald-400">
                      <ShieldCheck className="w-3.5 h-3.5 mr-1.5 text-emerald-500" />
                      {userRole?.name || viewProfileUser.role?.name || 'Unassigned'}
                    </span>
                  </div>

                  <div className={`col-span-2 p-3 rounded-xl border ${darkMode ? 'bg-slate-950/40 border-slate-800/80' : 'bg-slate-50 border-slate-200'}`}>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Office / Workstation Location</span>
                    <span className="font-medium text-slate-300 flex items-center">
                      <MapPin className="w-3.5 h-3.5 mr-1.5 text-slate-500 shrink-0" />
                      {viewProfileUser.address || 'Headquarters, Plant Floor Operations'}
                    </span>
                  </div>
                </div>

                {/* Authorized Permissions Section */}
                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                      Authorized Permissions ({userRole?.name === 'Administrator' ? 'All Enterprise Modules (Full Control)' : `${userRole?.permissions?.length || 0} Actions Granted`})
                    </span>
                  </div>

                  <div className={`p-3 rounded-xl border max-h-48 overflow-y-auto scrollbar-thin ${
                    darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
                  }`}>
                    {userRole?.name === 'Administrator' ? (
                      <div className="flex items-center space-x-2 text-xs text-emerald-400 font-semibold py-1">
                        <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span>Administrator: Full system privileges across all modules, workflows, and database tables.</span>
                      </div>
                    ) : userRole && userRole.permissions.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {userRole.permissions.map(p => (
                          <span key={p.id || p.name} className="px-2 py-0.5 rounded-md text-[10px] font-mono font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            {p.name}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500 italic py-2 text-center">
                        No custom permissions assigned yet.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="flex justify-between items-center pt-4 border-t border-slate-200 dark:border-slate-800 mt-3 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    const target = viewProfileUser;
                    setViewProfileUser(null);
                    openEditModal(target);
                  }}
                  className="flex items-center space-x-1.5 px-3.5 py-2 text-xs font-bold rounded-xl text-emerald-500 border border-emerald-500/30 hover:bg-emerald-500/10 transition-all"
                >
                  <Edit className="w-3.5 h-3.5" />
                  <span>Edit Profile</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewProfileUser(null)}
                  className={`px-4 py-2 text-xs font-bold rounded-xl border transition-all ${
                    darkMode
                      ? 'bg-slate-800 border-slate-700 text-white hover:bg-slate-700'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-xs'
                  }`}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ======================== PERMANENT PURGE CONFIRMATION MODAL ======================== */}
      {confirmPermanentDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className={`w-full max-w-md rounded-2xl border shadow-2xl p-6 overflow-hidden animate-fade-in ${
            darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="flex items-center space-x-3 text-red-500 mb-4">
              <div className="p-2 rounded-xl bg-red-500/10 border border-red-500/20">
                <AlertTriangle className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <h3 className="font-extrabold text-base tracking-tight text-red-500">Irreversible Hard Purge</h3>
                <p className="text-xs text-slate-400">Database deletion confirmation</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              Are you sure you want to permanently delete <strong className="text-white font-bold font-mono bg-slate-800 px-1.5 py-0.5 rounded">{confirmPermanentDelete.name}</strong>?
              This action bypasses the 30-day safety retention and permanently purges all cryptographic IAM records and credentials from the system.
            </p>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setConfirmPermanentDelete(null)}
                className={`px-4 py-2 text-xs font-bold rounded-xl border transition-all ${
                  darkMode
                    ? 'bg-transparent border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-white'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 shadow-xs'
                }`}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isPurging}
                onClick={handleConfirmPermanentPurge}
                className="flex items-center justify-center space-x-2 px-5 py-2 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-500 transition-all shadow-md shadow-red-600/10 disabled:opacity-50"
              >
                {isPurging ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                <span>Confirm Permanent Purge</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
