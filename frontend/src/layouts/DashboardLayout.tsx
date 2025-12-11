import { Link, Outlet, useLocation } from 'react-router-dom';
import { Logo } from '../components/Logo';

/**
 * Main Layout Template for the Justiniano Platform.
 * Provides the persistent navigation rail and content area structure.
 */
export const DashboardLayout = () => {
    const location = useLocation();

    // Helper to determine active state
    const isActive = (path: string) => location.pathname === path;

    return (
        <div className="flex h-screen w-screen bg-gray-50 overflow-hidden">
            {/* --- Global Navigation Rail --- */}
            <nav className="w-20 bg-gray-900 flex flex-col items-center py-6 gap-8 z-50 shadow-xl">
                {/* Brand */}
                <div className="mb-2">
                    {/* Assuming Logo can take 'inverse' or just render cleanly */}
                    <div className="bg-white p-1 rounded-lg"><Logo size={32} /></div>
                </div>

                {/* Nav Items */}
                <div className="flex flex-col gap-4 w-full px-3">
                    <NavItem to="/" icon={<ChatIcon />} label="Chat" active={isActive('/')} />
                    <NavItem to="/developers" icon={<CodeIcon />} label="DevEx" active={isActive('/developers')} />
                </div>
            </nav>

            {/* --- Main Content Area --- */}
            {/* 'flex-1' makes it take remaining width. 'h-full' ensures full height. */}
            <main className="flex-1 h-full overflow-hidden relative">
                <Outlet />
            </main>
        </div>
    );
};

// --- Subcomponents for Cleanliness ---

const NavItem = ({ to, icon, label, active }: { to: string; icon: React.ReactNode; label: string; active: boolean }) => (
    <Link
        to={to}
        className={`
      group flex flex-col items-center justify-center p-3 rounded-xl transition-all duration-200
      ${active ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/20' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}
    `}
    >
        {icon}
        <span className="text-[10px] font-medium mt-1 opacity-80">{label}</span>
    </Link>
);

// Simple SVG Icons to avoid external deps for now
const ChatIcon = () => (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
    </svg>
);

const CodeIcon = () => (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
    </svg>
);