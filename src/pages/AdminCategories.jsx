import React, { useState, useEffect } from 'react';
import { getCategories, createCategory, updateCategory, deleteCategory } from '../api';
import Swal from 'sweetalert2';
import { Link, useNavigate } from 'react-router-dom';

export default function AdminCategories() {
    const [categories, setCategories] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        if (!localStorage.getItem('adminAuth')) navigate('/');
        fetchData();
    }, []);

    const fetchData = async () => {
        const res = await getCategories();
        setCategories(res.data);
    };

    const handleAdd = async () => {
        const { value: name } = await Swal.fire({
            title: 'เพิ่มหมวดหมู่ใหม่',
            input: 'text',
            inputLabel: 'ชื่อหมวดหมู่',
            showCancelButton: true,
            inputValidator: (value) => {
                if (!value) return 'กรุณากรอกชื่อหมวดหมู่';
            }
        });

        if (name) {
            await createCategory({ name });
            Swal.fire('Success', 'เพิ่มเรียบร้อย', 'success');
            fetchData();
        }
    };

    const handleEdit = async (cat) => {
        const { value: name } = await Swal.fire({
            title: 'แก้ไขหมวดหมู่',
            input: 'text',
            inputValue: cat.name,
            showCancelButton: true,
        });

        if (name) {
            await updateCategory(cat.id, { name });
            Swal.fire('Success', 'แก้ไขเรียบร้อย', 'success');
            fetchData();
        }
    };

    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: 'ยืนยันการลบ?',
            text: "ข้อมูล Prompt ในหมวดหมู่นี้อาจได้รับผลกระทบ",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            confirmButtonText: 'ลบเลย!'
        });

        if (result.isConfirmed) {
            await deleteCategory(id);
            Swal.fire('Deleted!', 'ลบเรียบร้อย', 'success');
            fetchData();
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 font-kanit p-6">
            <div className="container mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold">จัดการหมวดหมู่</h2>
                    <div className="flex gap-2">
                        <Link to="/admin" className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600">กลับ Dashboard</Link>
                        <button onClick={handleAdd} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
                            <i className="fa-solid fa-plus"></i> เพิ่มหมวดหมู่
                        </button>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <table className="min-w-full leading-normal">
                        <thead>
                            <tr>
                                <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">ID</th>
                                <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">ชื่อหมวดหมู่</th>
                                <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">จัดการ</th>
                            </tr>
                        </thead>
                        <tbody>
                            {categories.map(cat => (
                                <tr key={cat.id}>
                                    <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">{cat.id}</td>
                                    <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">{cat.name}</td>
                                    <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm text-right space-x-2">
                                        <button onClick={() => handleEdit(cat)} className="text-blue-600 hover:text-blue-900">แก้ไข</button>
                                        <button onClick={() => handleDelete(cat.id)} className="text-red-600 hover:text-red-900">ลบ</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
