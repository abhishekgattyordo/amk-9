'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Building2,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Layers,
  FileText,
  CheckCircle2,
  AlertCircle,
  Clock,
  Truck,
  Edit3,
  RefreshCw,
  TrendingUp,
  ShoppingBag,
  ChevronRight,
  Plus,
  Trash2
} from 'lucide-react';

interface CustomerWorkspacePageProps {
  darkMode: boolean;
  customerId?: string;
  customerData?: any;
  onBack: () => void;
  onRefreshParent?: () => void;
  onSelectModule?: (module: string) => void;
}

export const CustomerWorkspacePage: React.FC<CustomerWorkspacePageProps> = ({
  darkMode,
  customerId,
  customerData: initialCustomerData,
  onBack,
  onRefreshParent,
  onSelectModule
}) => {
  const router = useRouter();
  const [customer, setCustomer] = useState<any>(initialCustomerData || null);
  const [loading, setLoading] = useState(!initialCustomerData && !!customerId);
  const [activeTab, setActiveTab] = useState<'profile' | 'leads' | 'orders' | 'dispatches'>('profile');

  const effectiveCustomerId = customer?.id || customerId || initialCustomerData?.id;

  const fetchCustomerDetails = async (idToFetch?: string) => {
    const id = idToFetch || effectiveCustomerId;
    if (!id) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/sales/customers/${id}`);
      const data = await res.json();
      if (data.success && data.data) {
        setCustomer(data.data);
      } else {
        const listRes = await fetch(`/api/sales/customers`);
        const listData = await listRes.json();
        if (listData.success && Array.isArray(listData.data)) {
          const found = listData.data.find((c: any) => c.id === id || c.code === id);
          if (found) setCustomer(found);
        }
      }
    } catch (err) {
      console.error('Failed to fetch customer:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (effectiveCustomerId) {
      fetchCustomerDetails(effectiveCustomerId);
    }
  }, [effectiveCustomerId]);

  const handleDeleteCustomer = async () => {
    if (!customer?.id) return;
    if (!confirm(`Are you sure you want to delete customer "${customer.name}" (${customer.code})? It will be moved to the Recycle Bin.`)) {
      return;
    }
    try {
      setLoading(true);
      const res = await fetch(`/api/sales/customers/${customer.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        alert('Customer deleted and moved to Recycle Bin');
        if (onBack) {
          onBack();
        } else {
          router.push('/sales/customers');
        }
      } else {
        alert(data.error || 'Failed to delete customer');
      }
    } catch (err: any) {
      console.error('Error deleting customer:', err);
      alert(err.message || 'Error deleting customer');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`p-12 text-center rounded-2xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
        <RefreshCw className="w-8 h-8 animate-spin text-emerald-500 mx-auto mb-3" />
        <p className="text-sm font-semibold text-slate-400">Loading Customer Profile...</p>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className={`p-8 rounded-2xl border text-center my-6 ${darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
        <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
        <h2 className="text-xl font-bold">Customer Account Not Found</h2>
        <p className="text-xs text-slate-500 mt-1 mb-6">The requested customer record could not be loaded.</p>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold cursor-pointer"
        >
          Return to Customer Directory
        </button>
      </div>
    );
  }

  return (
    <div className={`space-y-6 pb-20 max-w-7xl mx-auto ${darkMode ? 'text-white' : 'text-slate-900'}`}>
      {/* Top Header / Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center space-x-3">
          <button
            onClick={onBack}
            className={`p-2 rounded-xl border transition-all cursor-pointer flex items-center space-x-1.5 text-xs font-semibold ${
              darkMode ? 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white' : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-100 shadow-sm'
            }`}
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Directory</span>
          </button>

          <div className={`hidden sm:flex items-center space-x-2 text-xs ${darkMode ? 'text-slate-400' : 'text-slate-600 font-medium'}`}>
            <span className="cursor-pointer hover:underline" onClick={onBack}>Sales & CRM</span>
            <ChevronRight className="w-3 h-3 text-slate-400" />
            <span className="cursor-pointer hover:underline" onClick={onBack}>Customers</span>
            <ChevronRight className="w-3 h-3 text-slate-400" />
            <span className="font-semibold text-emerald-500">{customer.name}</span>
          </div>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={() => fetchCustomerDetails()}
            className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer ${
              darkMode ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700' : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50'
            }`}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            onClick={() => router.push(`/sales/customers/${customer.id}/edit`)}
            className={`px-3.5 py-1.5 rounded-xl border text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer ${
              darkMode ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700' : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5 text-blue-500" />
            <span>Edit Profile</span>
          </button>

          <button
            onClick={handleDeleteCustomer}
            className={`px-3.5 py-1.5 rounded-xl border text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer text-red-500 hover:bg-red-500/10 border-red-500/20`}
            title="Delete Customer (Move to Recycle Bin)"
          >
            <Trash2 className="w-3.5 h-3.5 text-red-500" />
            <span>Delete</span>
          </button>
        </div>
      </div>

      {/* Hero Header Card */}
      <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <span className="px-3 py-1 rounded-lg font-mono text-sm font-extrabold bg-blue-500/15 text-blue-400 border border-blue-500/30">
                {customer.code}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">
                Active Client
              </span>
            </div>
            <h1 className="text-xl font-extrabold tracking-tight">{customer.name}</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
              <span>Account Exec: <strong className="text-slate-800 dark:text-slate-200">{customer.salesExecutive || 'Rajesh Sharma'}</strong></span>
              {customer.gstin && (
                <>
                  <span>•</span>
                  <span>GSTIN: <strong className="font-mono text-emerald-500">{customer.gstin}</strong></span>
                </>
              )}
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400">Total Inquiries</p>
              <p className="text-sm font-extrabold text-slate-900 dark:text-white">{customer.leads?.length || 0}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400">Sales Orders</p>
              <p className="text-sm font-extrabold text-blue-500">{customer.salesOrders?.length || 0}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400">Credit Days</p>
              <p className="text-sm font-extrabold text-emerald-500">{customer.creditDays || 30} Days</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200 dark:border-slate-800 pb-px">
        <button
          onClick={() => setActiveTab('profile')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center space-x-1.5 ${
            activeTab === 'profile'
              ? 'border-emerald-500 text-emerald-500'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Profile & Commercials</span>
        </button>

        <button
          onClick={() => setActiveTab('leads')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center space-x-1.5 ${
            activeTab === 'leads'
              ? 'border-emerald-500 text-emerald-500'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Leads & Inquiries ({customer.leads?.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab('orders')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center space-x-1.5 ${
            activeTab === 'orders'
              ? 'border-emerald-500 text-emerald-500'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Sales Orders ({customer.salesOrders?.length || 0})</span>
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
            <h3 className="text-sm font-bold mb-4 pb-2 border-b border-slate-200 dark:border-slate-800 flex items-center space-x-2">
              <User className="w-4 h-4 text-blue-500" />
              <span>Contact & Dispatch Address</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <p className={darkMode ? 'text-slate-400 font-medium' : 'text-slate-700 font-bold'}>Primary Contact Person</p>
                <p className="font-semibold text-slate-900 dark:text-white mt-0.5">{customer.contactPerson || 'Not Provided'}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className={darkMode ? 'text-slate-400 font-medium' : 'text-slate-700 font-bold'}>Phone</p>
                  <p className="font-semibold text-slate-900 dark:text-white mt-0.5">{customer.phone || '-'}</p>
                </div>
                <div>
                  <p className={darkMode ? 'text-slate-400 font-medium' : 'text-slate-700 font-bold'}>Email</p>
                  <p className="font-semibold text-slate-900 dark:text-white mt-0.5">{customer.email || '-'}</p>
                </div>
              </div>
              <div>
                <p className={darkMode ? 'text-slate-400 font-medium' : 'text-slate-700 font-bold'}>Factory / Delivery Address</p>
                <p className="font-semibold text-slate-900 dark:text-white mt-0.5">{customer.address || 'Standard Plant Location'}</p>
              </div>
            </div>
          </div>

          <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
            <h3 className="text-sm font-bold mb-4 pb-2 border-b border-slate-200 dark:border-slate-800 flex items-center space-x-2">
              <FileText className="w-4 h-4 text-emerald-500" />
              <span>Credit Policy & Commercial Terms</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className={darkMode ? 'text-slate-400 font-medium' : 'text-slate-700 font-bold'}>Payment Terms</p>
                  <p className="font-semibold text-slate-900 dark:text-white mt-0.5">{customer.paymentTerms || '30 Days Net from Delivery'}</p>
                </div>
                <div>
                  <p className={darkMode ? 'text-slate-400 font-medium' : 'text-slate-700 font-bold'}>Approved Credit Limit</p>
                  <p className="font-extrabold text-emerald-500 mt-0.5">₹{(customer.creditLimit || 500000).toLocaleString()}</p>
                </div>
              </div>
              <div>
                <p className={darkMode ? 'text-slate-400 font-medium' : 'text-slate-700 font-bold'}>Assigned Sales Executive</p>
                <p className="font-semibold text-slate-900 dark:text-white mt-0.5">{customer.salesExecutive || 'Rajesh Sharma'}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'leads' && (
        <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
          <h3 className="text-sm font-bold mb-4">Associated Leads & Requirement Briefs</h3>
          {customer.leads && customer.leads.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 font-bold text-slate-400">
                    <th className="p-3">Requirement</th>
                    <th className="p-3">Expected Qty</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {customer.leads.map((l: any) => (
                    <tr key={l.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer" onClick={() => router.push(`/sales/leads/${l.id}`)}>
                      <td className="p-3 font-semibold">{l.productRequirement}</td>
                      <td className="p-3 font-bold">{l.expectedQuantity} Pcs</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-500">
                          {l.status}
                        </span>
                      </td>
                      <td className="p-3 text-slate-400">{new Date(l.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-xs text-slate-500">No active leads logged under this customer account.</p>
          )}
        </div>
      )}

      {activeTab === 'orders' && (
        <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
          <h3 className="text-sm font-bold mb-4">Confirmed Sales Orders</h3>
          {customer.salesOrders && customer.salesOrders.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 font-bold text-slate-400">
                    <th className="p-3">SO #</th>
                    <th className="p-3">Customer PO #</th>
                    <th className="p-3">Product</th>
                    <th className="p-3">Quantity</th>
                    <th className="p-3">Value</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {customer.salesOrders.map((o: any) => (
                    <tr key={o.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer" onClick={() => router.push(`/sales/sales-orders/${o.id}`)}>
                      <td className="p-3 font-mono font-bold text-emerald-500">{o.soNumber}</td>
                      <td className="p-3 font-mono text-blue-400">{o.customerPoNumber}</td>
                      <td className="p-3">{o.productName}</td>
                      <td className="p-3 font-bold">{o.quantity} Pcs</td>
                      <td className="p-3 font-extrabold text-emerald-500">₹{(o.totalValue || 0).toLocaleString()}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-500">
                          {o.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-xs text-slate-500">No sales orders found for this customer.</p>
          )}
        </div>
      )}
    </div>
  );
};
