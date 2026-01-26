import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function Navbar() {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user'));

    const [isMenuOpen, setIsMenuOpen] = React.useState(false);

    const handleLogout = () => {
        localStorage.removeItem('user');
        navigate('/login');
    };

    return (
        <header className="w-full bg-slate-900 text-white shadow-lg sticky top-0 z-50">
            <div className="container mx-auto px-4 py-4 flex justify-between items-center relative">
                <Link to="/" className="text-2xl font-bold flex items-center gap-2">
                    <i className="fa-solid fa-laptop-code"></i> ITAssist
                </Link>

                {user && (
                    <>
                        {/* Mobile Menu Button */}
                        <button
                            className="md:hidden text-2xl focus:outline-none"
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                        >
                            <i className={`fa-solid ${isMenuOpen ? 'fa-xmark' : 'fa-bars'}`}></i>
                        </button>

                        {/* Desktop Menu */}
                        <div className="hidden md:flex items-center gap-4">
                            <span className="text-sm text-gray-300">สวัสดี, {user.username}</span>
                            <button
                                onClick={handleLogout}
                                className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm transition"
                            >
                                <i className="fa-solid fa-sign-out-alt mr-1"></i> ออกจากระบบ
                            </button>
                        </div>

                        {/* Mobile Dropdown Menu */}
                        {isMenuOpen && (
                            <div className="absolute top-full left-0 w-full bg-slate-800 shadow-xl md:hidden flex flex-col p-4 border-t border-slate-700 animate-fade-in-down">
                                <div className="flex items-center gap-2 mb-4 text-gray-300 pb-2 border-b border-slate-700">
                                    <i className="fa-solid fa-user-circle text-xl"></i>
                                    <span>สวัสดี, {user.username}</span>
                                </div>
                                <button
                                    onClick={handleLogout}
                                    className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded text-center transition font-medium"
                                >
                                    ออกจากระบบ
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </header>
    );
}
