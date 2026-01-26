import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../api';
import Swal from 'sweetalert2';

const Login = () => {
    const navigate = useNavigate();
    const [isLoginOpen, setIsLoginOpen] = useState(false);
    const [credentials, setCredentials] = useState({ username: '', password: '' });
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = (e) => {
        setCredentials({ ...credentials, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const { data } = await login(credentials);
            if (data.success) {
                localStorage.setItem('user', JSON.stringify(data.user));
                Swal.fire({
                    icon: 'success',
                    title: 'ยินดีต้อนรับ',
                    text: `สวัสดีคุณ ${data.user.username}`,
                    showConfirmButton: false,
                    timer: 1500
                });
                navigate('/');
            } else {
                Swal.fire('ข้อผิดพลาด', data.message || 'เข้าสู่ระบบไม่สำเร็จ', 'error');
            }
        } catch (error) {
            console.error(error);
            Swal.fire('ข้อผิดพลาด', 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex flex-col justify-center items-center relative overflow-hidden font-sans">

            {/* Background Decoration */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-10 left-10 w-72 h-72 bg-white/20 rounded-full blur-3xl opacity-50 animate-pulse"></div>
                <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl opacity-50 animate-pulse" style={{ animationDuration: '4s' }}></div>
            </div>

            {/* Main Content: Big Maintenance Button */}
            <div className="z-10 text-center flex flex-col items-center">
                <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-10 tracking-tight drop-shadow-lg">
                    <span className="font-light opacity-80">ITSupport Service</span>
                </h1>

                <button
                    onClick={() => navigate('/report')}
                    className="
                        group relative flex flex-col items-center justify-center 
                        w-48 h-48 md:w-56 md:h-56
                        bg-white/95 hover:bg-white 
                        rounded-3xl shadow-2xl 
                        transition-all duration-300 transform hover:-translate-y-2 hover:shadow-cyan-500/50
                        border-4 border-white/50 backdrop-blur-sm
                    "
                >
                    <div className="absolute inset-0 bg-gradient-to-tr from-blue-100 to-transparent opacity-0 group-hover:opacity-100 rounded-3xl transition-opacity duration-300"></div>

                    <div className="relative z-10 bg-gradient-to-br from-red-500 to-pink-600 text-white p-5 rounded-2xl mb-3 shadow-lg group-hover:scale-110 transition-transform duration-300">
                        <i className="fa-solid fa-screwdriver-wrench text-4xl"></i>
                    </div>

                    <span className="relative z-10 text-xl font-bold text-gray-800 group-hover:text-blue-600 transition-colors">แจ้งซ่อม</span>
                    <span className="relative z-10 text-xs text-gray-500 mt-1 font-medium bg-gray-100 px-2 py-1 rounded-full group-hover:bg-white transition-colors">คลิกเพื่อเริ่ม</span>
                </button>

                <p className="mt-10 text-white/90 text-sm md:text-base font-medium bg-black/10 px-6 py-2 rounded-full backdrop-blur-sm">
                    ระบบแจ้งซ่อมอุปกรณ์ไอทีสำหรับพนักงาน
                </p>
            </div>

            {/* Bottom-Right Login Trigger */}
            <div className="fixed bottom-6 right-6 z-20">
                <button
                    onClick={() => setIsLoginOpen(true)}
                    className="
                        flex items-center gap-3 
                        bg-white/10 hover:bg-white/25 
                        text-white px-4 py-2 
                        rounded-full backdrop-blur-md 
                        border border-white/20 
                        transition-all shadow-lg hover:shadow-xl hover:border-white/40
                        group
                    "
                >
                    <span className="text-xs font-semibold opacity-70 group-hover:opacity-100 transition-opacity">Staff Login</span>
                    <div className="bg-white/20 p-2 rounded-full group-hover:bg-white/30 transition-colors">
                        <i className="fa-solid fa-arrow-right-to-bracket text-sm"></i>
                    </div>
                </button>
            </div>

            {/* Login Modal */}
            {isLoginOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                        {/* Modal Header */}
                        <div className="bg-gray-50 px-6 py-4 border-b flex justify-between items-center">
                            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
                                    <i className="fa-solid fa-shield-halved text-sm"></i>
                                </div>
                                เข้าสู่ระบบจัดการ
                            </h2>
                            <button
                                onClick={() => setIsLoginOpen(false)}
                                className="text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-lg w-8 h-8 flex items-center justify-center transition"
                            >
                                <i className="fa-solid fa-xmark"></i>
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-8">
                            <form onSubmit={handleSubmit} className="space-y-5">
                                <div>
                                    <label className="block text-gray-700 text-xs font-bold mb-1 uppercase tracking-wider">Username</label>
                                    <input
                                        type="text"
                                        name="username"
                                        value={credentials.username}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                                        placeholder="Enter your username"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-gray-700 text-xs font-bold mb-1 uppercase tracking-wider">Password</label>
                                    <input
                                        type="password"
                                        name="password"
                                        value={credentials.password}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                                        placeholder="Enter your password"
                                        required
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className={`w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-xl font-bold hover:shadow-lg hover:from-blue-700 hover:to-indigo-700 active:scale-95 transition-all mt-2 ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                                >
                                    {isLoading ? 'Checking...' : 'Sign In'}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Login;
