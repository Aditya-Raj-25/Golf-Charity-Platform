import { Outlet, Link, useNavigate } from 'react-router-dom';
import { LogOut, Home, User, Trophy, Heart, Shield } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useEffect, useState } from 'react';

export default function Layout() {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single();
        setIsAdmin(data?.is_admin || false);
      }
    };
    checkAdmin();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 flex flex-col">
      <nav className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/dashboard" className="flex items-center gap-2 text-xl font-bold text-golf-600">
                <Trophy className="h-6 w-6" />
                Golf Charity
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link to="/dashboard" className="text-gray-600 hover:text-golf-600 px-3 py-2 rounded-md font-medium"><Home className="inline w-4 h-4 mr-1"/>Dashboard</Link>
              <Link to="/scores" className="text-gray-600 hover:text-golf-600 px-3 py-2 rounded-md font-medium"><User className="inline w-4 h-4 mr-1"/>Scores</Link>
              <Link to="/charity" className="text-gray-600 hover:text-golf-600 px-3 py-2 rounded-md font-medium"><Heart className="inline w-4 h-4 mr-1"/>Charity</Link>
              {isAdmin && (
                <Link to="/admin" className="text-red-600 hover:text-red-700 px-3 py-2 rounded-md font-medium"><Shield className="inline w-4 h-4 mr-1"/>Admin</Link>
              )}
              <button onClick={handleLogout} className="text-gray-500 hover:text-gray-700 p-2">
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <Outlet />
      </main>
      
      <footer className="bg-white border-t border-gray-200 mt-auto py-6">
        <div className="max-w-7xl mx-auto text-center text-gray-500 text-sm">
          &copy; {new Date().getFullYear()} Golf Charity Platform. All rights reserved. MVP.
        </div>
      </footer>
    </div>
  );
}
