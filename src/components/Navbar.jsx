import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function Navbar() {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user'));

    const handleLogout = () => {
        localStorage.removeItem('user');
        navigate('/login');
    };

    return (
        <header className="w-full bg-slate-900 text-white shadow-lg sticky top-0 z-50">
            <div className="container mx-auto px-4 py-4 flex justify-between items-center">
                <Link to="/" className="text-2xl font-bold flex items-center gap-2">
                    <i className="fa-solid fa-laptop-code"></i> ITAssist
                </Link>
                {user && (
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-300 hidden md:inline">สวัสดี, {user.username}</span>
                        <button
                            onClick={handleLogout}
                            className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm transition"
                        >
                            ออกจากระบบ
                        </button>
                    </div>
                )}
            </div>
        </header>
    );
}
