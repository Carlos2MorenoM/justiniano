import { Link, Outlet, useLocation } from 'react-router-dom';
import { Logo } from '../components/Logo';
import { MessageSquare, Code2 } from 'lucide-react';

/**
 * Main Layout Template for the Justiniano Platform.
 * Responsive design:
 * - Desktop/Tablet: Left Sidebar
 * - Mobile: Top Header + Bottom Navigation
 */
export const DashboardLayout = () => {
    const location = useLocation();
    const isActive = (path: string) => location.pathname === path;

    const navItems = [
        { to: '/', icon: MessageSquare, label: 'Chat' },
        { to: '/developers', icon: Code2, label: 'DevEx' },
    ];

    return (
        <div className="flex flex-col md:flex-row h-screen w-screen bg-gray-50 overflow-hidden">

            {/* --- Mobile Header (< md) --- */}
            <header className="md:hidden h-14 bg-white border-b border-gray-200 flex items-center justify-center px-4 flex-shrink-0 relative z-30">
                <Logo size={24} />
            </header>

            {/* --- Desktop Sidebar (>= md) --- */}
            <nav className="hidden md:flex w-20 bg-gray-900 flex-col items-center py-6 gap-8 z-50 shadow-xl flex-shrink-0">
                <div className="mb-2">
                    <div className="bg-white p-1 rounded-lg">
                        <Logo size={32} />
                    </div>
                </div>
                <div className="flex flex-col gap-4 w-full px-3">
                    {navItems.map((item) => (
                        <NavItem
                            key={item.to}
                            to={item.to}
                            icon={<item.icon size={24} />}
                            label={item.label}
                            active={isActive(item.to)}
                        />
                    ))}
                </div>
            </nav>

            {/* --- Main Content Area --- */}
            <main className="flex-1 overflow-hidden relative h-full">
                <Outlet />
            </main>

            {/* --- Mobile Bottom Nav (< md) --- */}
            <nav className="md:hidden h-16 bg-white border-t border-gray-200 flex items-center justify-around px-2 pb-safe flex-shrink-0 z-50">
                {navItems.map((item) => (
                    <MobileNavItem
                        key={item.to}
                        to={item.to}
                        icon={<item.icon size={24} />}
                        label={item.label}
                        active={isActive(item.to)}
                    />
                ))}
            </nav>
        </div>
    );
};

// --- Subcomponents ---

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

const MobileNavItem = ({ to, icon, label, active }: { to: string; icon: React.ReactNode; label: string; active: boolean }) => (
    <Link
        to={to}
        className={`
      flex flex-col items-center justify-center w-full h-full space-y-1
      ${active ? 'text-indigo-600' : 'text-gray-400'}
    `}
    >
        <div className={`
            p-1 rounded-lg transition-colors
            ${active ? 'bg-indigo-50' : ''}
        `}>
            {icon}
        </div>
        <span className="text-[10px] font-medium">{label}</span>
    </Link>
);