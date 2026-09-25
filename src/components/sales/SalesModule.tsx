'use client';

import React, { useState, useEffect } from 'react';
import { Product, Warehouse } from '../../types';
import { SalesDashboardView } from './SalesDashboardView';
import { SalesLeadsView } from './SalesLeadsView';
import { SalesQuotationsView } from './SalesQuotationsView';
import { SalesOrdersView } from './SalesOrdersView';
import { SalesDispatchView } from './SalesDispatchView';
import { SalesCustomersView } from './SalesCustomersView';
import { NewLeadPage } from './NewLeadPage';
import { NewQuotationPage } from './NewQuotationPage';
import { NewDeliveryChallanPage } from './NewDeliveryChallanPage';
import { NewCustomerPage } from './NewCustomerPage';
import { LeadWorkflowWorkspacePage } from './LeadWorkflowWorkspacePage';
import { LeadEditWorkspacePage } from './LeadEditWorkspacePage';
import { QuotationWorkspacePage } from './QuotationWorkspacePage';
import { QuotationEditWorkspacePage } from './QuotationEditWorkspacePage';
import { SalesOrderWorkspacePage } from './SalesOrderWorkspacePage';
import { SalesOrderEditWorkspacePage } from './SalesOrderEditWorkspacePage';
import { CustomerWorkspacePage } from './CustomerWorkspacePage';
import { CustomerEditWorkspacePage } from './CustomerEditWorkspacePage';

interface SalesModuleProps {
  darkMode: boolean;
  products: Product[];
  warehouses: Warehouse[];
  onAddTransaction?: any;
  onSelectProduct?: any;
  activeSubTab?: 'dashboard' | 'leads' | 'quotations' | 'orders' | 'dispatch' | 'customers';
  onSelectSubTab?: (tab: 'dashboard' | 'leads' | 'quotations' | 'orders' | 'dispatch' | 'customers') => void;
  onSelectModule?: (module: string) => void;
  onNavigateToCostingBom?: (leadId: string, customerId?: string) => void;
  onNavigateToQuotation?: (quotationId: string) => void;
  salesSubPage?: 'new_lead' | 'new_quotation' | 'new_delivery_challan' | 'new_customer' | 'lead_workspace' | 'lead_edit' | 'quotation_workspace' | 'quotation_edit' | 'sales_order_view' | 'sales_order_edit' | 'customer_view' | 'customer_edit' | null;
  onSetSalesSubPage?: (page: 'new_lead' | 'new_quotation' | 'new_delivery_challan' | 'new_customer' | 'lead_workspace' | 'lead_edit' | 'quotation_workspace' | 'quotation_edit' | 'sales_order_view' | 'sales_order_edit' | 'customer_view' | 'customer_edit' | null) => void;
  selectedLeadId?: string | null;
  selectedQuotationId?: string | null;
  selectedSalesOrderId?: string | null;
  selectedCustomerId?: string | null;
}

export const SalesModule: React.FC<SalesModuleProps> = ({
  darkMode,
  products,
  warehouses,
  activeSubTab = 'dashboard',
  onSelectSubTab,
  onSelectModule,
  onNavigateToCostingBom,
  onNavigateToQuotation,
  salesSubPage,
  onSetSalesSubPage,
  selectedLeadId,
  selectedQuotationId,
  selectedSalesOrderId,
  selectedCustomerId
}) => {
  const currentTab = activeSubTab;
  
  // Data states
  const [dashboardData, setDashboardData] = useState<any>({
    kpis: { totalLeads: 0, costingPending: 0, proposalsSent: 0, salesOrders: 0 },
    pipeline: [],
    recentLeads: [],
    recentSalesOrders: [],
    totalRevenue: 0,
    pendingDispatchCount: 0,
    totalDispatches: 0,
    topCustomers: []
  });
  const [leads, setLeads] = useState<any[]>([]);
  const [quotations, setQuotations] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedLeadForWorkspace, setSelectedLeadForWorkspace] = useState<any>(selectedLeadId || null);
  const [selectedQuotationForWorkspace, setSelectedQuotationForWorkspace] = useState<any>(selectedQuotationId || null);
  const [selectedOrderForWorkspace, setSelectedOrderForWorkspace] = useState<any>(selectedSalesOrderId || null);
  const [selectedCustomerForWorkspace, setSelectedCustomerForWorkspace] = useState<any>(selectedCustomerId || null);

  useEffect(() => {
    if (selectedLeadId !== undefined) setSelectedLeadForWorkspace(selectedLeadId);
  }, [selectedLeadId]);

  useEffect(() => {
    if (selectedQuotationId !== undefined) setSelectedQuotationForWorkspace(selectedQuotationId);
  }, [selectedQuotationId]);

  useEffect(() => {
    if (selectedSalesOrderId !== undefined) setSelectedOrderForWorkspace(selectedSalesOrderId);
  }, [selectedSalesOrderId]);

  useEffect(() => {
    if (selectedCustomerId !== undefined) setSelectedCustomerForWorkspace(selectedCustomerId);
  }, [selectedCustomerId]);

  // Modals
  const [showAddLeadModal, setShowAddLeadModal] = useState(false);
  const [showLeadDetailModal, setShowLeadDetailModal] = useState<any>(null);
  const [showCustomerPoModal, setShowCustomerPoModal] = useState<any>(null);
  const [showAddQuoteModal, setShowAddQuoteModal] = useState(false);
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);

  // Form inputs
  const [leadForm, setLeadForm] = useState({
    customerName: '',
    contactPerson: '',
    phone: '',
    email: '',
    productRequirement: '',
    productDescription: '',
    expectedQuantity: 1000,
    requiredDeliveryDate: '',
    specifications: '',
    sampleRequired: false,
    sampleDetails: '',
    assignedSalesExecutive: 'Rajesh Sharma',
    leadSource: 'Direct Enquiry',
    followUpDate: new Date().toISOString().split('T')[0],
    remarks: ''
  });

  const [poForm, setPoForm] = useState({
    customerPoNumber: '',
    customerPoDate: new Date().toISOString().split('T')[0],
    remarks: ''
  });

  const [quoteForm, setQuoteForm] = useState({
    customerName: '',
    productName: '',
    amount: 50000,
    salesExecutive: 'Rajesh Sharma',
    validUntil: new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0],
    costingSummary: 'Standard B2B Box Pricing',
    remarks: ''
  });

  const [customerForm, setCustomerForm] = useState({
    name: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: '',
    salesExecutive: 'Rajesh Sharma'
  });

  const loadedTabsRef = React.useRef<Set<string>>(new Set());

  const fetchData = async (targetTab?: string, force = false) => {
    const tabToLoad = targetTab || currentTab;
    if (!force && loadedTabsRef.current.has(tabToLoad)) {
      return;
    }

    setLoading(true);
    try {
      if (tabToLoad === 'dashboard') {
        const dashRes = await fetch('/api/sales/dashboard').then(r => r.json()).catch(() => ({ success: false }));
        if (dashRes?.success && dashRes.data) {
          setDashboardData(dashRes.data);
          loadedTabsRef.current.add('dashboard');
        }
      } else if (tabToLoad === 'leads') {
        const [leadsRes, custRes] = await Promise.all([
          fetch('/api/sales/leads').then(r => r.json()).catch(() => ({ success: false })),
          fetch('/api/sales/customers').then(r => r.json()).catch(() => ({ success: false }))
        ]);
        if (leadsRes?.success) setLeads(leadsRes.data || []);
        if (custRes?.success) setCustomers(custRes.data || []);
        loadedTabsRef.current.add('leads');
      } else if (tabToLoad === 'quotations') {
        const [quotesRes, custRes] = await Promise.all([
          fetch('/api/sales/quotations').then(r => r.json()).catch(() => ({ success: false })),
          fetch('/api/sales/customers').then(r => r.json()).catch(() => ({ success: false }))
        ]);
        if (quotesRes?.success) setQuotations(quotesRes.data || []);
        if (custRes?.success) setCustomers(custRes.data || []);
        loadedTabsRef.current.add('quotations');
      } else if (tabToLoad === 'orders') {
        const ordersRes = await fetch('/api/sales/orders').then(r => r.json()).catch(() => ({ success: false }));
        if (ordersRes?.success) setOrders(ordersRes.data || []);
        loadedTabsRef.current.add('orders');
      } else if (tabToLoad === 'customers') {
        const custRes = await fetch('/api/sales/customers').then(r => r.json()).catch(() => ({ success: false }));
        if (custRes?.success) setCustomers(custRes.data || []);
        loadedTabsRef.current.add('customers');
      }
    } catch (err) {
      console.error('Error fetching sales data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(currentTab, true);
  }, [currentTab]);

  const handleRefresh = () => {
    fetchData(currentTab, true);
  };

  // Handlers
  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/sales/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(leadForm)
      });
      const data = await res.json();
      if (data.success) {
        setShowAddLeadModal(false);
        fetchData('leads', true);
        setLeadForm({
          customerName: '',
          contactPerson: '',
          phone: '',
          email: '',
          productRequirement: '',
          productDescription: '',
          expectedQuantity: 1000,
          requiredDeliveryDate: '',
          specifications: '',
          sampleRequired: false,
          sampleDetails: '',
          assignedSalesExecutive: 'Rajesh Sharma',
          leadSource: 'Direct Enquiry',
          followUpDate: new Date().toISOString().split('T')[0],
          remarks: ''
        });
      } else {
        alert(data.error || 'Failed to create lead');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendToCosting = async (leadId: string) => {
    try {
      const res = await fetch(`/api/sales/leads/${leadId}/send-to-costing`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        fetchData('leads', true);
        if (showLeadDetailModal) {
          const updatedRes = await fetch(`/api/sales/leads/${leadId}`).then(r => r.json());
          if (updatedRes.success) setShowLeadDetailModal(updatedRes.data);
        }
      } else {
        alert(data.error || 'Failed to send to costing');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAdvanceStage = async (leadId: string, nextStatus: string) => {
    try {
      const res = await fetch(`/api/sales/leads/${leadId}/stage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus })
      });
      const data = await res.json();
      if (data.success) {
        fetchData('leads', true);
        if (showLeadDetailModal) {
          const updatedRes = await fetch(`/api/sales/leads/${leadId}`).then(r => r.json());
          if (updatedRes.success) setShowLeadDetailModal(updatedRes.data);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCapturePo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showCustomerPoModal) return;
    try {
      const res = await fetch(`/api/sales/leads/${showCustomerPoModal.id}/customer-po`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(poForm)
      });
      const data = await res.json();
      if (data.success) {
        setShowCustomerPoModal(null);
        fetchData('leads', true);
        if (showLeadDetailModal) {
          const updatedRes = await fetch(`/api/sales/leads/${showCustomerPoModal.id}`).then(r => r.json());
          if (updatedRes.success) setShowLeadDetailModal(updatedRes.data);
        }
      } else {
        alert(data.error || 'Failed to capture PO');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleConvertToOrder = async (leadId: string) => {
    try {
      const res = await fetch(`/api/sales/leads/${leadId}/convert`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        fetchData('leads', true);
        if (showLeadDetailModal) {
          const updatedRes = await fetch(`/api/sales/leads/${leadId}`).then(r => r.json());
          if (updatedRes.success) setShowLeadDetailModal(updatedRes.data);
        }
        alert('Lead successfully converted to Sales Order!');
      } else {
        alert(data.error || 'Failed to convert lead');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateQuotation = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/sales/quotations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(quoteForm)
      });
      const data = await res.json();
      if (data.success) {
        setShowAddQuoteModal(false);
        fetchData('quotations', true);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/sales/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customerForm)
      });
      const data = await res.json();
      if (data.success) {
        setShowAddCustomerModal(false);
        fetchData('customers', true);
        setCustomerForm({ name: '', contactPerson: '', phone: '', email: '', address: '', salesExecutive: 'Rajesh Sharma' });
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Check if a full-page sub-view is active
  if (salesSubPage === 'lead_edit' && selectedLeadId) {
    return (
      <LeadEditWorkspacePage
        darkMode={darkMode}
        leadId={selectedLeadId}
        onBack={() => {
          if (onSetSalesSubPage) onSetSalesSubPage(null);
          if (onSelectSubTab) onSelectSubTab('leads');
        }}
        onSuccess={() => {
          if (onSetSalesSubPage) onSetSalesSubPage(null);
          if (onSelectSubTab) onSelectSubTab('leads');
          fetchData('leads', true);
        }}
      />
    );
  }

  if (selectedLeadForWorkspace) {
    return (
      <LeadWorkflowWorkspacePage
        darkMode={darkMode}
        leadData={typeof selectedLeadForWorkspace === 'object' ? selectedLeadForWorkspace : null}
        leadId={typeof selectedLeadForWorkspace === 'string' ? selectedLeadForWorkspace : selectedLeadForWorkspace?.id}
        onBack={() => {
          setSelectedLeadForWorkspace(null);
          if (onSetSalesSubPage) onSetSalesSubPage(null);
          fetchData('leads', true);
        }}
        onRefreshParent={() => fetchData('leads', true)}
        onSelectModule={onSelectModule}
        onNavigateToCostingBom={onNavigateToCostingBom}
        onNavigateToQuotation={onNavigateToQuotation}
      />
    );
  }

  if (salesSubPage === 'quotation_edit' && selectedQuotationId) {
    return (
      <QuotationEditWorkspacePage
        darkMode={darkMode}
        quotationId={selectedQuotationId}
        onBack={() => {
          if (onSetSalesSubPage) onSetSalesSubPage(null);
          if (onSelectSubTab) onSelectSubTab('quotations');
        }}
        onSuccess={() => {
          if (onSetSalesSubPage) onSetSalesSubPage(null);
          if (onSelectSubTab) onSelectSubTab('quotations');
          fetchData('quotations', true);
        }}
      />
    );
  }

  if (selectedQuotationForWorkspace || (salesSubPage === 'quotation_workspace' && selectedQuotationId)) {
    return (
      <QuotationWorkspacePage
        darkMode={darkMode}
        quotationData={typeof selectedQuotationForWorkspace === 'object' ? selectedQuotationForWorkspace : null}
        quotationId={typeof selectedQuotationForWorkspace === 'string' ? selectedQuotationForWorkspace : (selectedQuotationForWorkspace?.id || selectedQuotationId || undefined)}
        onBack={() => {
          setSelectedQuotationForWorkspace(null);
          if (onSetSalesSubPage) onSetSalesSubPage(null);
          if (onSelectSubTab) onSelectSubTab('quotations');
          fetchData('quotations', true);
        }}
        onRefreshParent={() => fetchData('quotations', true)}
        onSelectModule={onSelectModule}
      />
    );
  }

  if (salesSubPage === 'sales_order_edit' && selectedSalesOrderId) {
    return (
      <SalesOrderEditWorkspacePage
        darkMode={darkMode}
        orderId={selectedSalesOrderId}
        onBack={() => {
          if (onSetSalesSubPage) onSetSalesSubPage(null);
          if (onSelectSubTab) onSelectSubTab('orders');
        }}
        onSuccess={() => {
          if (onSetSalesSubPage) onSetSalesSubPage(null);
          if (onSelectSubTab) onSelectSubTab('orders');
          fetchData('orders', true);
        }}
      />
    );
  }

  if (selectedOrderForWorkspace || (salesSubPage === 'sales_order_view' && selectedSalesOrderId)) {
    return (
      <SalesOrderWorkspacePage
        darkMode={darkMode}
        orderData={typeof selectedOrderForWorkspace === 'object' ? selectedOrderForWorkspace : null}
        orderId={typeof selectedOrderForWorkspace === 'string' ? selectedOrderForWorkspace : (selectedOrderForWorkspace?.id || selectedSalesOrderId || undefined)}
        onBack={() => {
          setSelectedOrderForWorkspace(null);
          if (onSetSalesSubPage) onSetSalesSubPage(null);
          if (onSelectSubTab) onSelectSubTab('orders');
          fetchData('orders', true);
        }}
        onRefreshParent={() => fetchData('orders', true)}
        onSelectModule={onSelectModule}
      />
    );
  }

  if (salesSubPage === 'customer_edit' && selectedCustomerId) {
    return (
      <CustomerEditWorkspacePage
        darkMode={darkMode}
        customerId={selectedCustomerId}
        onBack={() => {
          if (onSetSalesSubPage) onSetSalesSubPage(null);
          if (onSelectSubTab) onSelectSubTab('customers');
        }}
        onSuccess={() => {
          if (onSetSalesSubPage) onSetSalesSubPage(null);
          if (onSelectSubTab) onSelectSubTab('customers');
          fetchData('customers', true);
        }}
      />
    );
  }

  if (selectedCustomerForWorkspace || (salesSubPage === 'customer_view' && selectedCustomerId)) {
    return (
      <CustomerWorkspacePage
        darkMode={darkMode}
        customerData={typeof selectedCustomerForWorkspace === 'object' ? selectedCustomerForWorkspace : null}
        customerId={typeof selectedCustomerForWorkspace === 'string' ? selectedCustomerForWorkspace : (selectedCustomerForWorkspace?.id || selectedCustomerId || undefined)}
        onBack={() => {
          setSelectedCustomerForWorkspace(null);
          if (onSetSalesSubPage) onSetSalesSubPage(null);
          if (onSelectSubTab) onSelectSubTab('customers');
          fetchData('customers', true);
        }}
        onRefreshParent={() => fetchData('customers', true)}
        onSelectModule={onSelectModule}
      />
    );
  }

  if (salesSubPage === 'new_lead') {
    return (
      <NewLeadPage
        darkMode={darkMode}
        onBack={() => {
          if (onSetSalesSubPage) onSetSalesSubPage(null);
          if (onSelectSubTab) onSelectSubTab('leads');
        }}
        onSuccess={() => {
          if (onSetSalesSubPage) onSetSalesSubPage(null);
          if (onSelectSubTab) onSelectSubTab('leads');
          fetchData('leads', true);
        }}
      />
    );
  }

  if (salesSubPage === 'new_quotation') {
    return (
      <NewQuotationPage
        darkMode={darkMode}
        onBack={() => {
          if (onSetSalesSubPage) onSetSalesSubPage(null);
          if (onSelectSubTab) onSelectSubTab('quotations');
        }}
        onSuccess={() => {
          if (onSetSalesSubPage) onSetSalesSubPage(null);
          if (onSelectSubTab) onSelectSubTab('quotations');
          fetchData('quotations', true);
        }}
      />
    );
  }

  if (salesSubPage === 'new_delivery_challan') {
    return (
      <NewDeliveryChallanPage
        darkMode={darkMode}
        onBack={() => {
          if (onSetSalesSubPage) onSetSalesSubPage(null);
          if (onSelectSubTab) onSelectSubTab('dispatch');
        }}
        onSuccess={() => {
          if (onSetSalesSubPage) onSetSalesSubPage(null);
          if (onSelectSubTab) onSelectSubTab('dispatch');
          fetchData('dispatch', true);
        }}
      />
    );
  }

  if (salesSubPage === 'new_customer') {
    return (
      <NewCustomerPage
        darkMode={darkMode}
        onBack={() => {
          if (onSetSalesSubPage) onSetSalesSubPage(null);
          if (onSelectSubTab) onSelectSubTab('customers');
        }}
        onSuccess={() => {
          if (onSetSalesSubPage) onSetSalesSubPage(null);
          if (onSelectSubTab) onSelectSubTab('customers');
          fetchData('customers', true);
        }}
      />
    );
  }

  return (
    <>
      {currentTab === 'dashboard' && (
        <SalesDashboardView
          darkMode={darkMode}
          dashboardData={dashboardData}
          loading={loading}
          onRefresh={handleRefresh}
          onNewLead={() => {
            if (onSetSalesSubPage) onSetSalesSubPage('new_lead');
            else if (onSelectSubTab) onSelectSubTab('leads');
          }}
          onSelectModule={onSelectModule || (() => {})}
          onSelectLead={(lead) => {
            if (onSelectSubTab) onSelectSubTab('leads');
            setSelectedLeadForWorkspace(lead);
          }}
        />
      )}

      {currentTab === 'leads' && (
        <SalesLeadsView
          darkMode={darkMode}
          leads={leads}
          loading={loading}
          onRefresh={handleRefresh}
          onNewLead={() => {
            if (onSetSalesSubPage) onSetSalesSubPage('new_lead');
          }}
          onSelectLead={(lead) => {
            setSelectedLeadForWorkspace(lead);
          }}
          showLeadDetailModal={showLeadDetailModal}
          setShowLeadDetailModal={setShowLeadDetailModal}
          showAddLeadModal={false}
          setShowAddLeadModal={() => {
            if (onSetSalesSubPage) onSetSalesSubPage('new_lead');
          }}
          leadForm={leadForm}
          setLeadForm={setLeadForm}
          handleCreateLead={handleCreateLead}
          handleAdvanceStage={handleAdvanceStage}
          handleSendToCosting={handleSendToCosting}
          handleConvertToOrder={handleConvertToOrder}
          showCustomerPoModal={showCustomerPoModal}
          setShowCustomerPoModal={setShowCustomerPoModal}
          poForm={poForm}
          setPoForm={setPoForm}
          handleCapturePo={handleCapturePo}
        />
      )}

      {currentTab === 'quotations' && (
        <SalesQuotationsView
          darkMode={darkMode}
          quotations={quotations}
          loading={loading}
          onRefresh={handleRefresh}
          onNewQuotation={() => {
            if (onSetSalesSubPage) onSetSalesSubPage('new_quotation');
          }}
          onSelectQuotation={(quotation) => {
            setSelectedQuotationForWorkspace(quotation);
          }}
          showAddQuoteModal={false}
          setShowAddQuoteModal={() => {
            if (onSetSalesSubPage) onSetSalesSubPage('new_quotation');
          }}
          quoteForm={quoteForm}
          setQuoteForm={setQuoteForm}
          handleCreateQuotation={handleCreateQuotation}
        />
      )}

      {currentTab === 'orders' && (
        <SalesOrdersView
          darkMode={darkMode}
          orders={orders}
          loading={loading}
          onRefresh={handleRefresh}
          onSelectSalesOrder={(order) => {
            setSelectedOrderForWorkspace(order);
          }}
          onGoToLeads={() => {
            if (onSelectSubTab) onSelectSubTab('leads');
          }}
          onGoToQuotations={() => {
            if (onSelectSubTab) onSelectSubTab('quotations');
          }}
        />
      )}

      {currentTab === 'dispatch' && (
        <SalesDispatchView
          darkMode={darkMode}
          loading={loading}
          onRefreshParent={handleRefresh}
          onSelectModule={onSelectModule}
          onNewDeliveryChallan={() => {
            if (onSetSalesSubPage) onSetSalesSubPage('new_delivery_challan');
          }}
        />
      )}

      {currentTab === 'customers' && (
        <SalesCustomersView
          darkMode={darkMode}
          customers={customers}
          loading={loading}
          onRefresh={handleRefresh}
          onSelectCustomer={(customer) => {
            setSelectedCustomerForWorkspace(customer);
          }}
          onAddCustomer={() => {
            if (onSetSalesSubPage) onSetSalesSubPage('new_customer');
          }}
          showAddCustomerModal={false}
          setShowAddCustomerModal={() => {
            if (onSetSalesSubPage) onSetSalesSubPage('new_customer');
          }}
          customerForm={customerForm}
          setCustomerForm={setCustomerForm}
          handleCreateCustomer={handleCreateCustomer}
        />
      )}
    </>
  );
};
