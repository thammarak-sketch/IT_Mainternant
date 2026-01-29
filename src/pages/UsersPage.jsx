import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';

const UsersPage = () => {
    const [users, setUsers] = useState([]);
    const [newUser, setNewUser] = useState({ username: '', password: '', role: 'staff', fullname: '' });
    // Dynamically set API URL based on environment
    const API_URL = import.meta.env.VITE_API_URL || (window.location.hostname === 'localhost' ? 'http://localhost:3000/api' : '/api');

    const fetchUsers = async () => {
        try {
            const { data } = await axios.get(`${API_URL}/users`);
            setUsers(data);
        } catch (error) {
            console.error('Failed to fetch users', error);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`${API_URL}/users`, newUser);
            Swal.fire('สำเร็จ', 'เพิ่มผู้ใช้งานเรียบร้อยแล้ว', 'success');
            setNewUser({ username: '', password: '', role: 'staff', fullname: '' });
            fetchUsers();
        } catch (error) {
            Swal.fire('ข้อผิดพลาด', error.response?.data?.error || 'ไม่สามารถเพิ่มผู้ใช้งานได้', 'error');
        }
    };

    const handleDelete = async (id, username) => {
        const result = await Swal.fire({
            title: 'ยืนยันการลบ?',
            text: `คุณต้องการลบผู้ใช้ ${username} หรือไม่?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'ลบ',
            cancelButtonText: 'ยกเลิก'
        });

        if (result.isConfirmed) {
            try {
                await axios.delete(`${API_URL}/users/${id}`);
                Swal.fire('ลบสำเร็จ', 'ลบผู้ใช้งานเรียบร้อยแล้ว', 'success');
                fetchUsers();
            } catch (error) {
                Swal.fire('ข้อผิดพลาด', 'ไม่สามารถลบผู้ใช้งานได้', 'error');
            }
        }
    };

    const handleResetPassword = async (id, username) => {
        const { value: newPassword } = await Swal.fire({
            title: `เปลี่ยนรหัสผ่านสำหรับ ${username}`,
            input: 'password',
            inputLabel: 'รหัสผ่านใหม่',
            inputPlaceholder: 'กรอกรหัสผ่านใหม่',
            showCancelButton: true,
            confirmButtonText: 'บันทึก',
            cancelButtonText: 'ยกเลิก',
            inputValidator: (value) => {
                if (!value) {
                    return 'กรุณากรอกรหัสผ่าน!';
                }
            }
        });

        if (newPassword) {
            try {
                await axios.put(`${API_URL}/users/${id}`, { password: newPassword });
                Swal.fire('สำเร็จ', 'เปลี่ยนรหัสผ่านเรียบร้อยแล้ว', 'success');
            } catch (error) {
                Swal.fire('ข้อผิดพลาด', 'ไม่สามารถเปลี่ยนรหัสผ่านได้', 'error');
            }
        }
    };

    return (
        <div className="p-6 bg-white dark:bg-slate-900 min-h-screen transition-colors duration-300">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-8">จัดการผู้ใช้งาน (User Management)</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Form Section */}
                <div className="md:col-span-1">
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md border border-gray-200 dark:border-slate-700">
                        <h2 className="text-xl font-bold text-gray-700 dark:text-white mb-4">เพิ่มผู้ใช้งานใหม่</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">ชื่อผู้ใช้ (Username)</label>
                                <input
                                    type="text"
                                    value={newUser.username}
                                    onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                                    className="mt-1 block w-full rounded-lg border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:focus:ring-green-500 p-2.5 border"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">ชื่อ-นามสกุล (Full Name)</label>
                                <input
                                    type="text"
                                    value={newUser.fullname}
                                    onChange={(e) => setNewUser({ ...newUser, fullname: e.target.value })}
                                    className="mt-1 block w-full rounded-lg border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:focus:ring-green-500 p-2.5 border"
                                    placeholder="เช่น สมชาย ใจดี"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">รหัสผ่าน (Password)</label>
                                <input
                                    type="password"
                                    value={newUser.password}
                                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                                    className="mt-1 block w-full rounded-lg border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:focus:ring-green-500 p-2.5 border"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">บทบาท (Role)</label>
                                <select
                                    value={newUser.role}
                                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                                    className="mt-1 block w-full rounded-lg border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:focus:ring-green-500 p-2.5 border"
                                >
                                    <option value="staff">Staff (ช่างทั่วไป)</option>
                                    <option value="admin">Admin (ผู้ดูแลระบบ)</option>
                                </select>
                            </div>
                            <button
                                type="submit"
                                className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-green-600 dark:hover:bg-green-700 text-white font-bold py-2.5 px-4 rounded-lg transition shadow-md hover:shadow-lg"
                            >
                                เพิ่มผู้ใช้งาน
                            </button>
                        </form>
                    </div>
                </div>

                {/* List Section */}
                <div className="md:col-span-2">
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md overflow-hidden border border-gray-200 dark:border-slate-700">
                        <table className="min-w-full leading-normal">
                            <thead>
                                <tr>
                                    <th className="px-5 py-3 border-b-2 border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-left text-xs font-semibold text-gray-600 dark:text-gray-200 uppercase tracking-wider">Username</th>
                                    <th className="px-5 py-3 border-b-2 border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-left text-xs font-semibold text-gray-600 dark:text-gray-200 uppercase tracking-wider">Full Name</th>
                                    <th className="px-5 py-3 border-b-2 border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-left text-xs font-semibold text-gray-600 dark:text-gray-200 uppercase tracking-wider">Role</th>
                                    <th className="px-5 py-3 border-b-2 border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-left text-xs font-semibold text-gray-600 dark:text-gray-200 uppercase tracking-wider">Date Created</th>
                                    <th className="px-5 py-3 border-b-2 border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-right text-xs font-semibold text-gray-600 dark:text-gray-200 uppercase tracking-wider">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((user) => (
                                    <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                                        <td className="px-5 py-4 border-b border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium text-gray-900 dark:text-white">
                                            {user.username}
                                        </td>
                                        <td className="px-5 py-4 border-b border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-gray-700 dark:text-gray-300">
                                            {user.fullname || '-'}
                                        </td>
                                        <td className="px-5 py-4 border-b border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm">
                                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${user.role === 'admin' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' : 'bg-gray-100 text-gray-800 dark:bg-slate-700 dark:text-gray-300'}`}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4 border-b border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-gray-500 dark:text-gray-400">
                                            {new Date(user.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-5 py-4 border-b border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-right">
                                            <button
                                                onClick={() => handleResetPassword(user.id, user.username)}
                                                className="text-yellow-600 hover:text-yellow-900 dark:text-yellow-400 dark:hover:text-yellow-300 bg-yellow-50 dark:bg-yellow-900/20 p-2 rounded-lg hover:bg-yellow-100 dark:hover:bg-yellow-900/40 transition mr-2"
                                                title="เปลี่ยนรหัสผ่าน"
                                            >
                                                <i className="fa-solid fa-key"></i>
                                            </button>
                                            <button
                                                onClick={() => handleDelete(user.id, user.username)}
                                                className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 bg-red-50 dark:bg-red-900/20 p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 transition"
                                                disabled={user.username === 'admin'} // Prevent deleting main admin
                                            >
                                                <i className="fa-solid fa-trash"></i>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UsersPage;
