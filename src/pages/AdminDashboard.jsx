import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';

export default function AdminDashboard() {
    const navigate = useNavigate();

    useEffect(() => {
        const isAuth = localStorage.getItem('adminAuth');
        if (!isAuth) {
            navigate('/');
            Swal.fire('Access Denied', 'กรุณาเข้าสู่ระบบก่อน', 'warning');
        }
    }, []);

    const logout = () => {
        localStorage.removeItem('adminAuth');
        navigate('/');
    };

    return (
        <div className="min-h-screen bg-gray-100 font-kanit">
            <nav className="bg-white shadow">
                <div className="container mx-auto px-6 py-4 flex justify-between items-center">
                    <h1 className="text-xl font-bold text-indigo-600">Admin Dashboard</h1>
                    <button onClick={logout} className="text-red-500 hover:text-red-700">ออกจากระบบ</button>
                </div>
            </nav>

            <div className="container mx-auto px-6 py-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">จัดการระบบ</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Link to="/admin/prompts" className="block bg-white p-6 rounded-lg shadow hover:shadow-lg transition border-l-4 border-purple-500 group">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-xl font-bold text-gray-800 group-hover:text-purple-600">จัดการ Prompt</h3>
                                <p className="text-gray-500 mt-1">เพิ่ม ลบ แก้ไข ข้อมูล Prompt</p>
                            </div>
                            <i className="fa-solid fa-layer-group text-4xl text-gray-300 group-hover:text-purple-500 transition"></i>
                        </div>
                    </Link>

                    <Link to="/admin/categories" className="block bg-white p-6 rounded-lg shadow hover:shadow-lg transition border-l-4 border-green-500 group">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-xl font-bold text-gray-800 group-hover:text-green-600">จัดการหมวดหมู่</h3>
                                <p className="text-gray-500 mt-1">เพิ่ม ลบ แก้ไข หมวดหมู่</p>
                            </div>
                            <i className="fa-solid fa-tags text-4xl text-gray-300 group-hover:text-green-500 transition"></i>
                        </div>
                    </Link>
                </div>

                <div className="mt-8">
                    <Link to="/" className="inline-flex items-center text-gray-600 hover:text-indigo-600">
                        <i className="fa-solid fa-house mr-2"></i> กลับหน้าหน้าเว็บหลัก
                    </Link>
                </div>
            </div>
        </div>
    );
}
