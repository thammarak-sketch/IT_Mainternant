import React, { useState } from 'react';
import { login } from '../api';
import Swal from 'sweetalert2';

export default function AdminModal() {
    const [isOpen, setIsOpen] = useState(false);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const res = await login({ username, password });
            if (res.data.success) {
                Swal.fire({
                    icon: 'success',
                    title: 'เข้าสู่ระบบสำเร็จ',
                    showConfirmButton: false,
                    timer: 1500
                });
                setIsOpen(false);
                localStorage.setItem('adminAuth', 'true');
                window.location.href = '/admin'; // Force reload/redirect
            }
        } catch (err) {
            Swal.fire({
                icon: 'error',
                title: 'เข้าสู่ระบบไม่สำเร็จ',
                text: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง'
            });
        }
    };

    return (
        <>
            <button onClick={() => setIsOpen(true)} className="fixed bottom-6 right-6 bg-gradient-to-r from-pink-500 to-red-500 text-white p-4 rounded-full shadow-lg hover:shadow-2xl hover:scale-110 transition z-40">
                <i className="fa-solid fa-user-shield text-xl"></i>
            </button>

            {isOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-8 relative animate-[fadeIn_0.3s_ease-out]">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-gray-800">เข้าสู่ระบบ Admin</h2>
                            <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <i className="fa-solid fa-times text-xl"></i>
                            </button>
                        </div>
                        <form onSubmit={handleLogin}>
                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2">Username</label>
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    required
                                />
                            </div>
                            <div className="mb-6">
                                <label className="block text-gray-700 text-sm font-bold mb-2">Password</label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    required
                                />
                            </div>
                            <button type="submit" className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold py-2 px-4 rounded-lg hover:from-purple-700 hover:to-indigo-700 transition">
                                เข้าสู่ระบบ
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
