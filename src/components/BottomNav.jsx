import React from 'react';
import { NavLink } from 'react-router-dom';

const BottomNav = () => {
    const getNavLinkClass = ({ isActive }) => {
        const baseClass = "flex flex-col items-center justify-center w-full py-2 transition-colors duration-200 text-xs";
        return isActive
            ? `${baseClass} text-blue-600 bg-blue-50`
            : `${baseClass} text-slate-500 hover:text-blue-600 hover:bg-slate-50`;
    };

    return (
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-between items-center z-30 shadow-[0_-2px_10px_rgba(0,0,0,0.05)] pb-safe">
            <NavLink to="/" className={getNavLinkClass}>
                <i className="fa-solid fa-list text-lg mb-1"></i>
                <span>ทรัพย์สิน</span>
            </NavLink>

            <NavLink to="/stock" className={getNavLinkClass}>
                <i className="fa-solid fa-chart-pie text-lg mb-1"></i>
                <span>สต็อก</span>
            </NavLink>

            <NavLink to="/maintenance" className={getNavLinkClass}>
                <i className="fa-solid fa-wrench text-lg mb-1"></i>
                <span>แจ้งซ่อม</span>
            </NavLink>

            <NavLink to="/users" className={getNavLinkClass}>
                <i className="fa-solid fa-users text-lg mb-1"></i>
                <span>ผู้ใช้</span>
            </NavLink>
        </div>
    );
};

export default BottomNav;
