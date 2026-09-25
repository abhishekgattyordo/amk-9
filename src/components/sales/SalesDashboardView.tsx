'use client';

import React from 'react';
import {
  TrendingUp,
  Users,
  FileText,
  Clock,
  Plus,
  RefreshCw,
  Briefcase,
  Award,
  ShoppingBag,
  ArrowRight,
  Send,
  Loader2,
  CheckCircle2,
  Truck,
  Building2,
  DollarSign
} from 'lucide-react';

interface SalesDashboardViewProps {
  darkMode: boolean;
  dashboardData: any;
  loading: boolean;
  onRefresh: () => void;
  onNewLead: () => void;
  onSelectModule: (module: string) => void;
  onSelectLead: (lead: any) => void;
}

export const SalesDashboardView: React.FC<SalesDashboardViewProps> = ({
  darkMode,
  dashboardData,
  loading,
  onRefresh,
  onNewLead,
  onSelectModule,
  onSelectLead
}) => {
  if (loading && (!dashboardData || (!dashboardData.kpis && !dashboardData.recentLeads?.length))) {
    return (
      <div className={`p-16 rounded-2xl border flex flex-col items-center justify-center space-y-3 ${
        darkMode ? 'bg-slate-900/85 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
          Loading sales dashboard metrics, please wait...
        </p>
      </div>
    );
  }

  const kpis = dashboardData?.kpis || {};
  const totalLeads = Number(kpis.totalLeads ?? dashboardData?.totalLeads ?? 0);
  const costingPending = Number(kpis.costingPending ?? dashboardData?.costingPending ?? 0);
  const proposalsSent = Number(kpis.proposalsSent ?? dashboardData?.activeQuotes ?? 0);
  const salesOrders = Number(kpis.salesOrders ?? dashboardData?.totalOrders ?? 0);
  const totalRevenue = Number(dashboardData?.totalRevenue ?? 0);
  const pendingDispatchCount = Number(dashboardData?.pendingDispatchCount ?? 0);
  const totalDispatches = Number(dashboardData?.totalDispatches ?? 0);
  const conversionRate = dashboardData?.conversionRate ?? (totalLeads > 0 ? ((salesOrders / totalLeads) * 100).toFixed(1) : '0');

  const pipeline = Array.isArray(dashboardData?.pipeline) ? dashboardData.pipeline : [
    { stage: 'New Inquiry', count: 0, value: 0 },
    { stage: 'Costing', count: 0, value: 0 },
    { stage: 'Sample Sent', count: 0, value: 0 },
    { stage: 'Quotation Sent', count: 0, value: 0 },
    { stage: 'Negotiation', count: 0, value: 0 },
    { stage: 'Won', count: 0, value: 0 },
    { stage: 'Lost', count: 0, value: 0 }
  ];

  const recentLeads = Array.isArray(dashboardData?.recentLeads) ? dashboardData.recentLeads : [];
  const recentOrders = Array.isArray(dashboardData?.recentSalesOrders) 
    ? dashboardData.recentSalesOrders 
    : (Array.isArray(dashboardData?.recentOrders) ? dashboardData.recentOrders : []);
  const topCustomers = Array.isArray(dashboardData?.topCustomers) ? dashboardData.topCustomers : [];

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className={`text-2xl font-extrabold tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
            Sales Dashboard
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Real-time pipeline tracking, deal conversions, quotations, and confirmed sales orders.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={onRefresh}
            className={`px-3.5 py-2 rounded-xl border text-xs font-semibold flex items-center space-x-2 transition-colors cursor-pointer ${
              darkMode ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm'
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button
            type="button"
            onClick={onNewLead}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-lg shadow-emerald-600/20 flex items-center space-x-2 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Lead</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: 'Total Inquiries', val: totalLeads, detail: `${conversionRate}% win conversion`, icon: Briefcase, color: 'text-blue-500 bg-blue-500/10' },
          { title: 'Pending Costing', val: costingPending, detail: 'Cost estimation queue', icon: Clock, color: 'text-amber-500 bg-amber-500/10' },
          { title: 'Proposals Sent', val: proposalsSent, detail: 'Active customer quotations', icon: Send, color: 'text-purple-500 bg-purple-500/10' },
          { title: 'Orders Won', val: salesOrders, detail: `₹${(totalRevenue / 100000).toFixed(2)}L booked value`, icon: Award, color: 'text-emerald-500 bg-emerald-500/10' },
        ].map((kpi, idx) => (
          <div key={idx} className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-700 dark:text-slate-400 uppercase tracking-wider">{kpi.title}</span>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${kpi.color}`}>
                <kpi.icon className="w-4 h-4" />
              </div>
            </div>
            <div className={`text-2xl font-extrabold mt-1 ${darkMode ? 'text-white' : 'text-slate-950'}`}>{kpi.val}</div>
            <p className="text-[10px] text-slate-700 dark:text-slate-400 mt-1">{kpi.detail}</p>
          </div>
        ))}
      </div>

      {/* Sales Pipeline Funnel Overview */}
      <div className={`p-5 rounded-2xl border ${
        darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className={`text-sm font-bold ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>
              Sales Pipeline Flow & Deal Conversion Funnel
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Stage-by-stage distribution of active inquiries and expected box production volume</p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">Live Funnel</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3">
          {pipeline.map((stage: any, idx: number) => (
            <div key={stage.stage || idx} className={`p-3.5 rounded-xl border text-center transition-all ${
              darkMode ? 'bg-slate-800/50 border-slate-700/60 hover:bg-slate-800/80' : 'bg-slate-50 border-slate-200 hover:bg-slate-100/80'
            }`}>
              <div className="text-[10px] font-bold text-slate-700 dark:text-slate-400 uppercase tracking-wider mb-1 truncate">
                {stage.stage}
              </div>
              <div className={`text-xl font-extrabold mb-1 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                {Number(stage.count || 0)}
              </div>
              <div className="text-[10px] text-emerald-500 font-bold">
                Qty: {Number(stage.value || 0).toLocaleString()} Pcs
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Leads & Recent Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Leads */}
        <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className={`text-sm font-bold ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>Recent Inquiries & Leads</h3>
            <button 
              type="button"
              onClick={() => onSelectModule('sales_leads')} 
              className="text-xs font-bold text-emerald-500 hover:underline flex items-center gap-1 cursor-pointer"
            >
              View All <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="space-y-2.5">
            {recentLeads.length === 0 ? (
              <div className="py-8 text-center">
                <Briefcase className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-50" />
                <p className="text-xs text-slate-500">No leads recorded yet.</p>
              </div>
            ) : (
              recentLeads.map((lead: any, lIdx: number) => (
                <div 
                  key={lead.id || lead.leadNumber || lIdx} 
                  onClick={() => onSelectLead(lead)} 
                  className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                    darkMode ? 'bg-slate-800/40 border-slate-700/60 hover:bg-slate-800' : 'bg-slate-50 border-slate-200 hover:bg-slate-100/80'
                  }`}
                >
                  <div className="min-w-0 flex-1 mr-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-blue-400">{lead.leadNumber || 'LEAD-NEW'}</span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        lead.status === 'Won' ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/30' :
                        lead.status === 'Converted' ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30' :
                        lead.status === 'Costing' ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30' :
                        'bg-slate-500/15 text-slate-400 border border-slate-500/30'
                      }`}>
                        {lead.status || 'New Inquiry'}
                      </span>
                    </div>
                    <h4 className={`text-sm font-semibold mt-1 truncate ${darkMode ? 'text-white' : 'text-slate-900'}`}>{lead.customerName || 'Unknown Prospect'}</h4>
                    <p className="text-xs text-slate-400 mt-0.5 truncate">{lead.productRequirement || 'Packaging Product'} • {Number(lead.expectedQuantity || 0).toLocaleString()} Pcs</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Confirmed Orders */}
        <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className={`text-sm font-bold ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>Recent Confirmed Sales Orders</h3>
            <button 
              type="button"
              onClick={() => onSelectModule('sales_orders')} 
              className="text-xs font-bold text-emerald-500 hover:underline flex items-center gap-1 cursor-pointer"
            >
              View All <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="space-y-2.5">
            {recentOrders.length === 0 ? (
              <div className="py-8 text-center">
                <ShoppingBag className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-50" />
                <p className="text-xs text-slate-500">No sales orders created yet.</p>
              </div>
            ) : (
              recentOrders.map((ord: any, oIdx: number) => (
                <div 
                  key={ord.id || ord.soNumber || oIdx} 
                  className={`p-3 rounded-xl border flex items-center justify-between ${
                    darkMode ? 'bg-slate-800/40 border-slate-700/60' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="min-w-0 flex-1 mr-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-emerald-400">{ord.soNumber || 'SO-NEW'}</span>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">
                        {ord.status || 'Confirmed'}
                      </span>
                    </div>
                    <h4 className={`text-sm font-semibold mt-1 truncate ${darkMode ? 'text-white' : 'text-slate-900'}`}>{ord.customerName || ord.customer?.name || 'Customer Account'}</h4>
                    <p className="text-xs text-slate-400 mt-0.5 truncate">{ord.productName || ord.product?.name || 'Finished Product'} • ₹{Number(ord.totalValue || ord.grandTotal || 0).toLocaleString()}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs font-medium text-slate-400">
                      {typeof ord.orderDate === 'string' ? ord.orderDate : (ord.createdAt ? new Date(ord.createdAt).toISOString().split('T')[0] : '')}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { title: 'Leads & Inquiries', desc: `${totalLeads} active pipeline deals`, icon: Briefcase, mod: 'sales_leads', color: 'text-blue-500' },
          { title: 'Quotations', desc: 'Price proposals & revisions', icon: FileText, mod: 'sales_quotations', color: 'text-purple-500' },
          { title: 'Sales Orders', desc: 'Active customer orders', icon: ShoppingBag, mod: 'sales_orders', color: 'text-amber-500' },
          { title: 'Customer Master', desc: 'B2B client directories', icon: Users, mod: 'sales_customers', color: 'text-emerald-500' },
        ].map((item, idx) => (
          <div
            key={idx}
            onClick={() => onSelectModule(item.mod)}
            className={`p-4 rounded-2xl border cursor-pointer transition-all hover:scale-[1.01] ${
              darkMode ? 'bg-slate-900/80 border-slate-800 hover:border-slate-700' : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
            }`}
          >
            <item.icon className={`w-5 h-5 ${item.color} mb-2`} />
            <h4 className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{item.title}</h4>
            <p className="text-[11px] text-slate-500 mt-0.5">{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

