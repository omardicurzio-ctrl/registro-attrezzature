import { Link, useLocation } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Layout({ children }) {
  const { user, signOut } = useAuth();
  const location = useLocation();

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="border-b border-stone-200 bg-white">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <span className="text-lg font-semibold text-bordeaux">Registro Attrezzature</span>
            <nav className="flex items-center gap-4 text-sm">
              <Link to="/attrezzature" className={navCls(location.pathname.startsWith('/attrezzature'))}>
                Registro
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-4 text-sm text-stone-500">
            <span className="hidden sm:inline">{user?.email}</span>
            <button onClick={signOut} className="flex items-center gap-1 text-stone-400 hover:text-stone-600">
              <LogOut size={14} /> Esci
            </button>
          </div>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}

function navCls(active) {
  return `pb-1 border-b-2 transition-colors ${
    active ? 'border-bordeaux text-bordeaux font-medium' : 'border-transparent text-stone-500 hover:text-stone-700'
  }`;
}
