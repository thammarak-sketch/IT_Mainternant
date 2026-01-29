import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';

const Sidebar = ({ isOpen, setIsOpen }) => {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user'));

    const handleLogout = () => {
        Swal.fire({
            title: 'ยืนยันการออกจากระบบ?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'ออกจากระบบ',
            cancelButtonText: 'ยกเลิก',
            confirmButtonColor: '#d33'
        }).then((result) => {
            if (result.isConfirmed) {
                localStorage.removeItem('user');
                navigate('/login');
            }
        });
    };

    const getNavLinkClass = ({ isActive }) => {
        const baseClass = "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors duration-200 mt-2";
        return isActive
            ? `${baseClass} bg-blue-600 text-white shadow-md`
            : `${baseClass} text-slate-300 hover:bg-slate-700 hover:text-white`;
    };

    // Close sidebar on link click (mobile only)
    const handleLinkClick = () => {
        if (window.innerWidth < 768 && setIsOpen) {
            setIsOpen(false);
        }
    };

    return (
        <div className={`
            bg-slate-800 text-white w-64 min-h-screen flex flex-col fixed left-0 top-0 overflow-y-auto z-30 transition-transform duration-300 ease-in-out
            ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 md:static md:h-screen
        `}>
            {/* Logo / Header (Hidden on mobile inside sidebar as it's in top bar) */}
            <div className="hidden md:block p-6 border-b border-slate-700">
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <i className="fa-solid fa-laptop-code text-blue-400"></i>
                    ITAssist
                </h1>
                <p className="text-xs text-slate-400 mt-1">Asset Management System</p>
            </div>

            {/* Navigation Menu */}
            <nav className="flex-1 px-4 py-4">
                <div className="text-xs uppercase text-slate-500 font-semibold mb-2 px-2">เมนูหลัก</div>

                <NavLink to="/" className={getNavLinkClass} onClick={handleLinkClick}>
                    <i className="fa-solid fa-list w-5 text-center"></i>
                    <span>ทะเบียนทรัพย์สิน</span>
                </NavLink>

                <NavLink to="/emails" className={getNavLinkClass} onClick={handleLinkClick}>
                    <i className="fa-solid fa-at w-5 text-center"></i>
                    <span>ทะเบียนอีเมล (Email)</span>
                </NavLink>

                <NavLink to="/stock" className={getNavLinkClass} onClick={handleLinkClick}>
                    <i className="fa-solid fa-chart-pie w-5 text-center"></i>
                    <span>สรุปสต็อก (Stock)</span>
                </NavLink>

                <NavLink to="/maintenance" className={getNavLinkClass} onClick={handleLinkClick}>
                    <i className="fa-solid fa-wrench w-5 text-center"></i>
                    <span>แจ้งซ่อม / บำรุงรักษา</span>
                </NavLink>

                <NavLink to="/users" className={getNavLinkClass} onClick={handleLinkClick}>
                    <i className="fa-solid fa-users w-5 text-center"></i>
                    <span>จัดการผู้ใช้งาน</span>
                </NavLink>
            </nav>

            {/* User Profile / Logout */}
            <div className="p-4 border-t border-slate-700 bg-slate-900">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-lg">
                        {user?.username?.charAt(0).toUpperCase()}
                    </div>
                    <div className="overflow-hidden">
                        <p className="text-sm font-semibold truncate">{user?.username}</p>
                        <p className="text-xs text-slate-400 capitalize">{user?.role || 'Staff'}</p>
                    </div>
                </div>
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white py-2 rounded transition-colors text-sm"
                >
                    <i className="fa-solid fa-sign-out-alt"></i>
                    ออกจากระบบ
                </button>
            </div>
        </div>
    );
};

export default Sidebar;
