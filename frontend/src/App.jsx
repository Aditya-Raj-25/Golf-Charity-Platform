import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Landing from './pages/Landing';

// Imports
import Dashboard from './pages/Dashboard';
import Scores from './pages/Scores';
import Draws from './pages/Draws';
import Charity from './pages/Charity';
import Winnings from './pages/Winnings';
import Admin from './pages/Admin';
import Checkout from './pages/Checkout';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        
        <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/scores" element={<Scores />} />
          <Route path="/draws" element={<Draws />} />
          <Route path="/charity" element={<Charity />} />
          <Route path="/winnings" element={<Winnings />} />
          <Route path="/checkout" element={<Checkout />} />
        </Route>

        <Route element={<ProtectedRoute requireAdmin={true}><Layout /></ProtectedRoute>}>
          <Route path="/admin" element={<Admin />} />
        </Route>

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
