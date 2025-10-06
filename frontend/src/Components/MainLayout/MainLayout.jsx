import React, { useState } from 'react';

import Dashboard from '../Dashboard/Dashboard';
import EmployeeManagement from '../EmployeeManagement/EmployeeManagement';
import FinanceManagement from '../FinanceManagement/FinanceManagement';
import InventoryManagement from '../InventoryManagement/InventoryManagement';
import OrderManagement from '../OrderManagement/OrderManagement';
import ProductionTracking from '../ProductionTracking/ProductionTracking';
import QR from '../QR/QR';
import Reports from '../Reports/Reports';
import Sidebar from '../Sidebar/Sidebar';
import SupplierManagement from '../SupplierManagement/SupplierManagement';
import TopBar from '../TopBar/TopBar';

const MainLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');

  const renderContent = () => {
    switch (activeTab) {
      case 'employees':
        return <EmployeeManagement />;
      case 'orders':
        return <OrderManagement />;
      case 'inventory':
        return <InventoryManagement />;
      case 'suppliers':
        return <SupplierManagement />;
      case 'qr':
        return <QR />;
      case 'production':
        return <ProductionTracking />;
      case 'finance':
        return <FinanceManagement />;
      case 'reports':
        return <Reports />;
      case 'dashboard':
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar 
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />
      
      <div className="flex-1 flex flex-col lg:ml-0">
        <TopBar setIsOpen={setSidebarOpen} />
        
        <main className="flex-1 overflow-y-auto p-6">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default MainLayout;