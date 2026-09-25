import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Search, 
  Bell, 
  Moon, 
  Sun, 
  Building2, 
  ChevronDown, 
  User as UserIcon, 
  LogOut, 
  ShieldCheck, 
  Menu, 
  Settings, 
  Mail, 
  Check, 
  X, 
  Package, 
  Boxes, 
  Truck, 
  Layers, 
  ShoppingCart, 
  FileText, 
  Warehouse as WarehouseIcon, 
  Users, 
  ArrowLeftRight, 
  ShieldAlert,
  HelpCircle,
  Globe,
  RefreshCw,
  ClipboardList,
  Calculator,
  ArrowRight,
  CornerDownLeft,
  AlertCircle
} from 'lucide-react';
import { NotificationItem, User as UserType } from '../../types';
import { UserAvatar } from './UserAvatar';

export interface SearchResultItem {
  id: string;
  code: string;
  name: string;
  subtitle: string;
  module: string;
  moduleLabel: string;
  group?: string;
  route: string;
  iconName: string;
  relevance: number;
}

interface NavbarProps {
  currentUser: UserType | null;
  onLogout: () => void;
  notifications: NotificationItem[];
  onClearNotifications: () => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  activeCompany: string;
  onSelectCompany: (company: string) => void;
  globalSearchText: string;
  setGlobalSearchText: (text: string) => void;
  searchResults: SearchResultItem[];
  groupedResults?: Record<string, SearchResultItem[]>;
  isSearching: boolean;
  searchError?: string | null;
  onSelectResult: (item: SearchResultItem) => void;
  onToggleMobileSidebar?: () => void;
  onOpenNotificationSettings?: () => void;
  onMarkNotificationRead?: (id: string) => void;
  onNotificationClick?: (notif: NotificationItem) => void;
  onFetchNotifications?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  onLogout,
  notifications,
  onClearNotifications,
  darkMode,
  onToggleDarkMode,
  activeCompany,
  onSelectCompany,
  globalSearchText,
  setGlobalSearchText,
  searchResults,
  groupedResults: passedGroupedResults,
  isSearching,
  searchError,
  onSelectResult,
  onToggleMobileSidebar,
  onOpenNotificationSettings,
  onMarkNotificationRead,
  onNotificationClick,
  onFetchNotifications,
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showCompanyMenu, setShowCompanyMenu] = useState(false);
  const [filterTab, setFilterTab] = useState<'all' | 'unread' | 'procurement'>('all');
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const notificationMenuRef = useRef<HTMLDivElement>(null);
  const companyMenuRef = useRef<HTMLDivElement>(null);

  // Group results by moduleLabel if not provided
  const grouped = useMemo(() => {
    if (passedGroupedResults && Object.keys(passedGroupedResults).length > 0) {
      return passedGroupedResults;
    }
    const map: Record<string, SearchResultItem[]> = {};
    for (const item of searchResults) {
      const key = item.moduleLabel || 'Other';
      if (!map[key]) map[key] = [];
      map[key].push(item);
    }
    return map;
  }, [searchResults, passedGroupedResults]);

  // Flattened order of items for continuous index selection
  const flatItems = useMemo(() => {
    const list: SearchResultItem[] = [];
    for (const groupKey of Object.keys(grouped)) {
      list.push(...grouped[groupKey]);
    }
    return list;
  }, [grouped]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [searchResults]);

  // Global keyboard shortcut: Ctrl+K or Cmd+K or / to focus search
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
        setShowDropdown(true);
      } else if (e.key === '/' && document.activeElement !== searchInputRef.current && (document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA')) {
        e.preventDefault();
        searchInputRef.current?.focus();
        setShowDropdown(true);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setShowProfileMenu(false);
      }
      if (notificationMenuRef.current && !notificationMenuRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
      if (companyMenuRef.current && !companyMenuRef.current.contains(e.target as Node)) {
        setShowCompanyMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const filteredNotifications = notifications.filter(n => {
    if (filterTab === 'unread') return !n.read;
    if (filterTab === 'procurement') return n.module === 'Procurement';
    return true;
  });

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (flatItems.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % flatItems.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + flatItems.length) % flatItems.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (flatItems[selectedIndex]) {
        onSelectResult(flatItems[selectedIndex]);
        setShowDropdown(false);
      }
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
    }
  };

  const renderIcon = (iconName: string, className = 'w-3.5 h-3.5') => {
    switch (iconName) {
      case 'Package': return <Package className={`${className} text-emerald-500`} />;
      case 'Boxes': return <Boxes className={`${className} text-blue-500`} />;
      case 'Truck': return <Truck className={`${className} text-amber-500`} />;
      case 'Layers': return <Layers className={`${className} text-purple-500`} />;
      case 'Warehouse': return <WarehouseIcon className={`${className} text-teal-500`} />;
      case 'ShoppingCart': return <ShoppingCart className={`${className} text-rose-500`} />;
      case 'FileText': return <FileText className={`${className} text-cyan-500`} />;
      case 'ArrowLeftRight': return <ArrowLeftRight className={`${className} text-indigo-500`} />;
      case 'Users': return <Users className={`${className} text-sky-500`} />;
      case 'ShieldAlert': return <ShieldAlert className={`${className} text-orange-500`} />;
      case 'ClipboardList': return <ClipboardList className={`${className} text-indigo-500`} />;
      case 'Calculator': return <Calculator className={`${className} text-emerald-600`} />;
      default: return <Package className={`${className} text-emerald-500`} />;
    }
  };

  const highlightQuery = (text: string, q: string) => {
    if (!q || !text) return text;
    const cleanQ = q.trim();
    if (!cleanQ) return text;

    try {
      const parts = String(text).split(new RegExp(`(${cleanQ.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
      return (
        <span>
          {parts.map((part, i) =>
            part.toLowerCase() === cleanQ.toLowerCase() ? (
              <span key={i} className="text-emerald-500 font-extrabold underline decoration-emerald-500/40">{part}</span>
            ) : (
              part
            )
          )}
        </span>
      );
    } catch {
      return text;
    }
  };

  const companies = [
    'AMK Carton Mills Ltd - HQ',
    'AMK Corrugated Packaging Plant #2',
    'AMK Kraft Paper Division'
  ];

  return (
    <header className={`h-16 border-b px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 transition-colors gap-3 ${
      darkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'
    }`}>
      {/* Left: Hamburger (mobile) + Company Selector */}
      <div className="flex items-center space-x-3 shrink-0">
        {onToggleMobileSidebar && (
          <button
            onClick={onToggleMobileSidebar}
            className={`p-2 rounded-lg lg:hidden transition-colors ${
              darkMode ? 'bg-slate-800 text-slate-200 hover:bg-slate-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
            title="Open navigation menu"
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        {/* Company Dropdown */}
        <div ref={companyMenuRef} className="relative hidden xl:block">
          <button
            onClick={() => setShowCompanyMenu(!showCompanyMenu)}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors ${
              darkMode 
                ? 'bg-slate-800/80 border-slate-700 text-slate-200 hover:bg-slate-800' 
                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Building2 className="w-3.5 h-3.5 text-emerald-500" />
            <span className="truncate max-w-[160px]">{activeCompany}</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {showCompanyMenu && (
            <div className={`absolute left-0 mt-1.5 w-72 rounded-xl shadow-xl border py-1.5 z-50 divide-y divide-slate-100 dark:divide-slate-800 ${
              darkMode ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-800'
            }`}>
              <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Switch Operating Unit
              </div>
              <div className="py-1">
                {companies.map((comp) => (
                  <button
                    key={comp}
                    onClick={() => {
                      onSelectCompany(comp);
                      setShowCompanyMenu(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between transition-colors ${
                      comp === activeCompany
                        ? (darkMode ? 'bg-emerald-500/10 text-emerald-400 font-bold' : 'bg-emerald-50 text-emerald-700 font-bold')
                        : (darkMode ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-slate-50 text-slate-700')
                    }`}
                  >
                    <span className="truncate">{comp}</span>
                    {comp === activeCompany && <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 ml-2" />}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Middle: Full-width inline Central Search Bar */}
      <div ref={searchContainerRef} className="flex-1 max-w-3xl relative">
        <div className="relative flex items-center w-full">
          <div className="absolute left-3.5 flex items-center pointer-events-none text-slate-400">
            {isSearching ? (
              <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Search className="w-4 h-4 text-slate-400" />
            )}
          </div>
          <input
            ref={searchInputRef}
            type="text"
            value={globalSearchText}
            onChange={(e) => {
              setGlobalSearchText(e.target.value);
              setShowDropdown(true);
            }}
            onFocus={() => setShowDropdown(true)}
            onKeyDown={handleKeyDown}
            placeholder="Search by ID, Code, Name, Customer, Supplier, SO, PO, Work Order, Material..."
            className={`w-full pl-10 pr-20 py-2 rounded-xl border text-xs sm:text-sm font-medium transition-all shadow-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/40 ${
              darkMode 
                ? 'bg-slate-800/90 border-slate-700 text-white placeholder-slate-400 focus:bg-slate-800 focus:border-emerald-500' 
                : 'bg-slate-100/90 border-slate-200 text-slate-900 placeholder-slate-400 focus:bg-white focus:border-emerald-500'
            }`}
          />
          <div className="absolute right-2.5 flex items-center space-x-1.5">
            {globalSearchText ? (
              <button
                onClick={() => {
                  setGlobalSearchText('');
                  setShowDropdown(false);
                  searchInputRef.current?.focus();
                }}
                className="p-1 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            ) : (
              <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 bg-slate-200/60 dark:bg-slate-700/60 border border-slate-300 dark:border-slate-600 rounded">
                ⌘K
              </kbd>
            )}
          </div>
        </div>

        {/* Dropdown Results Grouped by Module/Type */}
        {showDropdown && globalSearchText.trim() && (
          <div className={`absolute top-full left-0 right-0 mt-2 rounded-2xl shadow-2xl border max-h-[75vh] overflow-y-auto z-50 divide-y divide-slate-100 dark:divide-slate-800/80 backdrop-blur-md ${
            darkMode ? 'bg-slate-900/95 border-slate-700 text-slate-100 shadow-black/50' : 'bg-white/95 border-slate-200 text-slate-800 shadow-slate-300/40'
          }`}>
            {isSearching ? (
              <div className="p-8 text-center text-xs text-slate-400 flex flex-col items-center justify-center space-y-3">
                <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                <div className="font-medium text-slate-500 dark:text-slate-400">
                  Searching AMK ERP database for &ldquo;<span className="text-emerald-500 font-bold">{globalSearchText}</span>&rdquo;...
                </div>
                <div className="text-[10px] text-slate-400">
                  Searching across Raw Materials, Products, Sales Orders, Work Orders, POs, Customers & More
                </div>
              </div>
            ) : searchError ? (
              <div className="p-6 text-center text-xs text-rose-500 flex flex-col items-center justify-center space-y-2">
                <AlertCircle className="w-5 h-5 text-rose-500" />
                <div className="font-semibold">{searchError}</div>
                <div className="text-[11px] text-slate-400">Please try a different search keyword</div>
              </div>
            ) : flatItems.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 flex flex-col items-center justify-center space-y-2">
                <div className="p-3 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400">
                  <Search className="w-5 h-5" />
                </div>
                <div className="font-bold text-slate-700 dark:text-slate-300 text-sm">
                  No results found for &ldquo;{globalSearchText}&rdquo;
                </div>
                <div className="text-[11px] text-slate-400 max-w-sm">
                  No matching database records found by ID, code, customer, supplier, sales order, purchase order, work order, or product.
                </div>
              </div>
            ) : (
              <div>
                {/* Search result summary header */}
                <div className={`px-4 py-2 text-[11px] font-semibold flex items-center justify-between border-b ${
                  darkMode ? 'bg-slate-800/50 text-slate-400 border-slate-800' : 'bg-slate-50 text-slate-500 border-slate-100'
                }`}>
                  <span>
                    Found <strong className="text-emerald-500">{flatItems.length}</strong> matching records across <strong className="text-slate-700 dark:text-slate-300">{Object.keys(grouped).length}</strong> modules
                  </span>
                  <span className="hidden sm:inline text-[10px] text-slate-400">
                    Use ↑ ↓ to navigate • ↵ Enter to select • Esc to dismiss
                  </span>
                </div>

                {/* Grouped sections */}
                <div className="p-2 space-y-3">
                  {Object.entries(grouped).map(([groupLabel, items]) => {
                    return (
                      <div key={groupLabel} className="space-y-1">
                        {/* Group Category Header */}
                        <div className="px-3 py-1 flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                          <div className="flex items-center space-x-1.5">
                            {items[0] && renderIcon(items[0].iconName, 'w-3 h-3')}
                            <span>{groupLabel}</span>
                          </div>
                          <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                            darkMode ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {items.length}
                          </span>
                        </div>

                        {/* Items under this group */}
                        <div className="space-y-0.5">
                          {items.map((item) => {
                            const currentOverallIndex = flatItems.findIndex(x => x.id === item.id && x.module === item.module);
                            const isSelected = currentOverallIndex === selectedIndex;

                            return (
                              <div
                                key={`${item.module}-${item.id}`}
                                onClick={() => {
                                  onSelectResult(item);
                                  setShowDropdown(false);
                                }}
                                onMouseEnter={() => {
                                  if (currentOverallIndex !== -1) {
                                    setSelectedIndex(currentOverallIndex);
                                  }
                                }}
                                className={`px-3 py-2 rounded-xl flex items-center justify-between cursor-pointer transition-all text-xs group ${
                                  isSelected 
                                    ? (darkMode ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 font-medium' : 'bg-emerald-50 text-emerald-900 border border-emerald-200 font-medium')
                                    : (darkMode ? 'hover:bg-slate-800/60 text-slate-200 border border-transparent' : 'hover:bg-slate-50 text-slate-700 border border-transparent')
                                }`}
                              >
                                <div className="flex items-center space-x-3 overflow-hidden min-w-0 pr-3">
                                  <div className={`p-1.5 rounded-lg shrink-0 ${
                                    isSelected 
                                      ? (darkMode ? 'bg-emerald-500/20' : 'bg-emerald-100')
                                      : (darkMode ? 'bg-slate-800' : 'bg-slate-100')
                                  }`}>
                                    {renderIcon(item.iconName, 'w-4 h-4')}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center space-x-2 truncate">
                                      {item.code && (
                                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-black tracking-tight font-mono shrink-0 ${
                                          isSelected
                                            ? (darkMode ? 'bg-emerald-500/30 text-emerald-300' : 'bg-emerald-200/80 text-emerald-900')
                                            : (darkMode ? 'bg-slate-800 text-slate-300 border border-slate-700' : 'bg-slate-100 text-slate-700 border border-slate-200')
                                        }`}>
                                          {highlightQuery(item.code, globalSearchText)}
                                        </span>
                                      )}
                                      <span className="font-bold truncate text-slate-900 dark:text-slate-100 text-xs sm:text-sm">
                                        {highlightQuery(item.name, globalSearchText)}
                                      </span>
                                    </div>
                                    {item.subtitle && (
                                      <div className={`text-[11px] truncate mt-0.5 ${
                                        isSelected 
                                          ? (darkMode ? 'text-emerald-300/80' : 'text-emerald-700/80')
                                          : 'text-slate-400 dark:text-slate-400'
                                      }`}>
                                        {highlightQuery(item.subtitle, globalSearchText)}
                                      </div>
                                    )}
                                  </div>
                                </div>

                                <div className="flex items-center space-x-2 shrink-0">
                                  <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${
                                    darkMode ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500'
                                  }`}>
                                    {item.moduleLabel}
                                  </span>
                                  {isSelected && (
                                    <div className="hidden sm:flex items-center text-[10px] text-emerald-500 font-bold space-x-0.5">
                                      <span>Open</span>
                                      <CornerDownLeft className="w-3 h-3 ml-0.5" />
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right Actions */}
      <div className="flex items-center space-x-3 shrink-0">
        {/* Theme Toggle */}
        <button
          onClick={onToggleDarkMode}
          className={`p-2 rounded-lg border transition-colors ${
            darkMode ? 'bg-slate-800 border-slate-700 text-amber-400 hover:bg-slate-700' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
          }`}
          title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Notifications Dropdown */}
        <div ref={notificationMenuRef} className="relative">
          <button
            onClick={() => {
              const nextState = !showNotifications;
              setShowNotifications(nextState);
              if (nextState && onFetchNotifications) {
                onFetchNotifications();
              }
            }}
            className={`p-2 rounded-lg border relative transition-colors ${
              darkMode ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white rounded-full text-xs flex items-center justify-center font-bold animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className={`absolute right-0 mt-2 w-80 sm:w-[420px] rounded-2xl shadow-2xl border py-3 z-50 ${
              darkMode ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-800'
            }`}>
              <div className="px-4 pb-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-sm">Notification Center</span>
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold rounded-full">
                      {unreadCount} Unread
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  {onFetchNotifications && (
                    <button
                      onClick={() => onFetchNotifications()}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-500 hover:bg-slate-800/50 transition-colors"
                      title="Refresh Notifications"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  )}
                  {onOpenNotificationSettings && (
                    <button
                      onClick={() => {
                        setShowNotifications(false);
                        onOpenNotificationSettings();
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-500 hover:bg-slate-800/50 transition-colors"
                      title="Procurement Notification Settings"
                    >
                      <Settings className="w-4 h-4" />
                    </button>
                  )}
                  {unreadCount > 0 && (
                    <button
                      onClick={onClearNotifications}
                      className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline font-semibold"
                    >
                      Mark all read
                    </button>
                  )}
                </div>
              </div>

              {/* Tabs */}
              <div className="flex items-center px-4 pt-2.5 pb-2 space-x-1 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold">
                <button
                  onClick={() => setFilterTab('all')}
                  className={`px-2.5 py-1 rounded-lg transition-all ${
                    filterTab === 'all'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                  }`}
                >
                  All ({notifications.length})
                </button>
                <button
                  onClick={() => setFilterTab('unread')}
                  className={`px-2.5 py-1 rounded-lg transition-all ${
                    filterTab === 'unread'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                  }`}
                >
                  Unread ({unreadCount})
                </button>
                <button
                  onClick={() => setFilterTab('procurement')}
                  className={`px-2.5 py-1 rounded-lg transition-all ${
                    filterTab === 'procurement'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                  }`}
                >
                  Procurement ({notifications.filter(n => n.module === 'Procurement').length})
                </button>
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
                {filteredNotifications.length === 0 ? (
                  <div className="py-10 text-center text-xs text-slate-400">
                    No notifications match current filter.
                  </div>
                ) : (
                  filteredNotifications.map(notif => {
                    const isProcurement = notif.module === 'Procurement';
                    return (
                      <div
                        key={notif.id}
                        onClick={() => {
                          if (onNotificationClick) {
                            onNotificationClick(notif);
                          }
                          if (onMarkNotificationRead && !notif.read) {
                            onMarkNotificationRead(notif.id);
                          }
                          setShowNotifications(false);
                        }}
                        className={`p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors relative group cursor-pointer ${
                          !notif.read ? (darkMode ? 'bg-slate-800/40' : 'bg-emerald-50/50') : ''
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center space-x-1.5 flex-wrap">
                            <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">{notif.title}</h4>
                            {notif.module && (
                              <span className={`px-1.5 py-0.2 rounded text-[9px] font-extrabold uppercase ${
                                isProcurement ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700/40 text-slate-400'
                              }`}>
                                {notif.module}
                              </span>
                            )}
                            {notif.priority && (
                              <span className={`px-1.5 py-0.2 rounded text-[9px] font-extrabold ${
                                notif.priority === 'Warning' ? 'bg-amber-500/20 text-amber-400' :
                                notif.priority === 'Success' ? 'bg-emerald-500/20 text-emerald-400' :
                                notif.priority === 'Error' ? 'bg-rose-500/20 text-rose-400' : 'bg-blue-500/20 text-blue-400'
                              }`}>
                                {notif.priority}
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400 shrink-0 font-medium">{notif.time}</span>
                        </div>

                        <p className="text-xs mt-1 text-slate-600 dark:text-slate-300 leading-relaxed">
                          {notif.message}
                        </p>

                        <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-100 dark:border-slate-800/50 pt-1.5">
                          {notif.emailSent ? (
                            <span className="inline-flex items-center text-blue-400 font-semibold">
                              <Mail className="w-3 h-3 mr-1" /> Email Sent ({notif.emailRecipient || 'Purchase Mgr'})
                            </span>
                          ) : (
                            <span className="text-slate-500">In-App Notification</span>
                          )}

                          {onMarkNotificationRead && !notif.read && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onMarkNotificationRead(notif.id);
                              }}
                              className="text-emerald-500 hover:underline font-bold flex items-center cursor-pointer"
                            >
                              <Check className="w-3 h-3 mr-0.5" /> Mark read
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Menu */}
        {currentUser && (
          <div ref={profileMenuRef} className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className={`flex items-center space-x-3 p-1.5 rounded-xl border transition-colors ${
                darkMode ? 'bg-slate-800 border-slate-700 hover:bg-slate-700' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <UserAvatar
                name={currentUser.name}
                src={currentUser.avatar}
                size="md"
              />
              <div className="hidden sm:block text-left pr-2">
                <div className="text-xs font-bold truncate max-w-[110px]">{currentUser.name}</div>
                <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                  {typeof currentUser.role === 'object' ? (currentUser.role as any).name : currentUser.role}
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
            </button>

            {showProfileMenu && (
              <div className={`absolute right-0 mt-2 w-64 rounded-2xl shadow-2xl border py-2 z-50 ${
                darkMode ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-800'
              }`}>
                <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700 flex items-center space-x-3">
                  <UserAvatar
                    name={currentUser.name}
                    src={currentUser.avatar}
                    size="lg"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold truncate">{currentUser.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{currentUser.email}</p>
                    <div className="mt-1 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                      <ShieldCheck className="w-3 h-3 mr-1 shrink-0" /> <span className="truncate">{currentUser.department}</span>
                    </div>
                  </div>
                </div>

                <div className="py-1">
                  <button
                    onClick={() => setShowProfileMenu(false)}
                    className={`w-full text-left px-4 py-2 text-xs flex items-center space-x-2 transition-colors ${
                      darkMode ? 'hover:bg-slate-700 text-slate-300' : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <UserIcon className="w-4 h-4 text-slate-400" />
                    <span>My Profile & Preferences</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      if (onOpenNotificationSettings) onOpenNotificationSettings();
                    }}
                    className={`w-full text-left px-4 py-2 text-xs flex items-center space-x-2 transition-colors ${
                      darkMode ? 'hover:bg-slate-700 text-slate-300' : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <Settings className="w-4 h-4 text-slate-400" />
                    <span>Notification Settings</span>
                  </button>
                </div>

                <div className="border-t border-slate-200 dark:border-slate-700 pt-1">
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      onLogout();
                    }}
                    className="w-full text-left px-4 py-2 text-xs flex items-center space-x-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors font-semibold"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
