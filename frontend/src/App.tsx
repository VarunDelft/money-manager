import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import TransactionListPage from './pages/TransactionListPage';
import AddTransactionPage from './pages/AddTransactionPage';
import EditTransactionPage from './pages/EditTransactionPage';
import ManageCategoriesPage from './pages/ManageCategoriesPage';
import StatisticsDashboardPage from './pages/StatisticsDashboardPage';
import RecurringRulesPage from './pages/RecurringRulesPage';

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <div className="app">
        <header className="app-header">
          <h1>Money Manager</h1>
          <nav>
            <a href="/transactions">Transactions</a>
            <a href="/transactions/new">Add</a>
            <a href="/categories">Categories</a>
            <a href="/statistics">Statistics</a>
            <a href="/recurring">Recurring</a>
          </nav>
        </header>
        <main>
          <Routes>
            <Route path="/" element={<Navigate to="/transactions" replace />} />
            <Route path="/transactions" element={<TransactionListPage />} />
            <Route path="/transactions/new" element={<AddTransactionPage />} />
            <Route path="/transactions/:id/edit" element={<EditTransactionPage />} />
            <Route path="/categories" element={<ManageCategoriesPage />} />
            <Route path="/statistics" element={<StatisticsDashboardPage />} />
            <Route path="/recurring" element={<RecurringRulesPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
};

export default App;
