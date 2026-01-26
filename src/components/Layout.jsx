import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

const Layout = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <div className="flex min-h-screen bg-gray-100">
            {/* Mobile Header / Hamburger */}
            <div className="md:hidden fixed top-0 left-0 right-0 bg-slate-800 text-white p-4 z-20 flex justify-between items-center shadow-md">
                <div className="font-bold text-lg flex items-center gap-2">
                    <i className="fa-solid fa-laptop-code text-blue-400"></i> ITAssist
                </div>
                <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="text-white text-2xl focus:outline-none">
                    <i className={`fa-solid ${isSidebarOpen ? 'fa-times' : 'fa-bars'}`}></i>
                </button>
            </div>

            {/* Sidebar with mobile transition */}
            <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

            {/* Mobile Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                ></div>
            )}

            {/* Main Content */}
            <div className="flex-1 md:ml-64 p-4 md:p-8 pt-20 md:pt-8 transition-all duration-300">
                <main>
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default Layout;
