import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';

const Sidebar = ({ isOpen, setIsOpen, theme, toggleTheme }) => {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    const handleLogout = () => {
        Swal.fire({
            title: 'ยืนยันการออกจากระบบ?',
            text: 'Are you sure you want to logout?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Logout',
            cancelButtonText: 'Cancel',
            confirmButtonColor: '#d33',
            background: theme === 'dark' ? '#1e293b' : '#fff',
            color: theme === 'dark' ? '#fff' : '#000',
        }).then((result) => {
            if (result.isConfirmed) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                navigate('/login');
            }
        });
    };

    const closeSidebar = () => {
        if (window.innerWidth < 768 && setIsOpen) {
            setIsOpen(false);
        }
    };

    return (
        <div className={`fixed inset-y-0 left-0 w-64 transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition-transform duration-300 ease-in-out z-30 flex flex-col shadow-2xl
            ${theme === 'dark' ? 'bg-slate-900 border-r border-slate-700' : 'bg-slate-800'} text-white`}>

            {/* Logo Area */}
            <div className="p-6 flex items-center gap-3 border-b border-white/10 bg-black/20">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shadow-lg ${theme === 'dark' ? 'bg-green-500 text-black' : 'bg-blue-500 text-white'}`}>
                    <i className="fa-solid fa-laptop-code text-xl"></i>
                </div>
                <div>
                    <h1 className="text-xl font-bold tracking-wide">IT Assist</h1>
                    <p className="text-xs text-gray-400 uppercase tracking-wider">Asset Manager</p>
                </div>
            </div>

            {/* Navigation Links */}
            <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-4 px-2">Menu</p>

                <NavLink to="/" onClick={closeSidebar}
                    className={({ isActive }) => `flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 group
                    ${isActive
                            ? (theme === 'dark' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-blue-600 shadow-md text-white')
                            : 'text-gray-400 hover:bg-white/5 hover:text-white'
                        }`}
                >
                    <i className="fa-solid fa-house w-6 text-center group-hover:scale-110 transition-transform"></i>
                    <span className="font-medium">Dashboard</span>
                </NavLink>

                <NavLink to="/add" onClick={closeSidebar}
                    className={({ isActive }) => `flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 group
                    ${isActive
                            ? (theme === 'dark' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-blue-600 shadow-md text-white')
                            : 'text-gray-400 hover:bg-white/5 hover:text-white'
                        }`}
                >
                    <i className="fa-solid fa-plus-circle w-6 text-center group-hover:scale-110 transition-transform"></i>
                    <span className="font-medium">Add Asset</span>
                </NavLink>

                <NavLink to="/maintenance" onClick={closeSidebar}
                    className={({ isActive }) => `flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 group
                     ${isActive
                            ? (theme === 'dark' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-blue-600 shadow-md text-white')
                            : 'text-gray-400 hover:bg-white/5 hover:text-white'
                        }`}
                >
                    <i className="fa-solid fa-screwdriver-wrench w-6 text-center group-hover:scale-110 transition-transform"></i>
                    <span className="font-medium">Maintenance</span>
                </NavLink>

                {user.role === 'admin' && (
                    <NavLink to="/register" onClick={closeSidebar}
                        className={({ isActive }) => `flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 group
                        ${isActive
                                ? (theme === 'dark' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-blue-600 shadow-md text-white')
                                : 'text-gray-400 hover:bg-white/5 hover:text-white'
                            }`}
                    >
                        <i className="fa-solid fa-users-gear w-6 text-center group-hover:scale-110 transition-transform"></i>
                        <span className="font-medium">Manage Users</span>
                    </NavLink>
                )}
            </nav>

            {/* Bottom Actions */}
            <div className="p-4 border-t border-white/10 bg-black/20 space-y-3">
                {/* Theme Toggle */}
                <button
                    onClick={toggleTheme}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-colors
                    ${theme === 'dark' ? 'bg-slate-800 text-yellow-400 hover:bg-slate-700' : 'bg-slate-700 text-yellow-300 hover:bg-slate-600'}`}
                >
                    <div className="flex items-center gap-3">
                        <i className={`fa-solid ${theme === 'dark' ? 'fa-moon' : 'fa-sun'} text-xl`}></i>
                        <span className="font-medium text-white text-sm">{theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</span>
                    </div>
                    <div className={`w-10 h-5 rounded-full relative transition-colors ${theme === 'dark' ? 'bg-green-500' : 'bg-gray-400'}`}>
                        <div className={`absolute top-1 left-1 bg-white w-3 h-3 rounded-full transition-transform ${theme === 'dark' ? 'translate-x-5' : ''}`}></div>
                    </div>
                </button>

                {/* Logout */}
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all group"
                >
                    <i className="fa-solid fa-right-from-bracket w-6 text-center group-hover:rotate-180 transition-transform duration-300"></i>
                    <span className="font-medium">Logout</span>
                </button>
            </div>
        </div>
    );
};

export default Sidebar;
