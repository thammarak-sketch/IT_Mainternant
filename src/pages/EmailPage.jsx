import React, { useState, useEffect } from 'react';
import { getRegistrationEmails, createRegistrationEmail, updateRegistrationEmail, deleteRegistrationEmail } from '../api';
import Swal from 'sweetalert2';

const EmailPage = () => {
    const [emails, setEmails] = useState([]);
    const [search, setSearch] = useState('');
    const [formData, setFormData] = useState({ email: '', fullname: '', position: '', department: '', is_pc: 0, is_mobile: 0, notes: '' });
    const [editingId, setEditingId] = useState(null);

    const departments = [
        'IT (ไอที)', 'HR (บุคคล)', 'Accounting (บัญชี)', 'Sales (การขาย)',
        'Marketing (การตลาด)', 'Admin (ธุรการ)', 'Production (ฝ่ายผลิต)',
        'Warehouse (คลังสินค้า)', 'Management (ผู้บริหาร)', 'Other (อื่นๆ)'
    ];

    const fetchEmails = async () => {
        try {
            const { data } = await getRegistrationEmails({ search });
            setEmails(data);
        } catch (error) {
            console.error('Failed to fetch emails', error);
        }
    };

    useEffect(() => {
        fetchEmails();
    }, [search]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? (checked ? 1 : 0) : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingId) {
                await updateRegistrationEmail(editingId, formData);
                Swal.fire('สำเร็จ', 'อัปเดตข้อมูลเมลเรียบร้อยแล้ว', 'success');
            } else {
                await createRegistrationEmail(formData);
                Swal.fire('สำเร็จ', 'เพิ่มทะเบียนเมลเรียบร้อยแล้ว', 'success');
            }
            setFormData({ email: '', fullname: '', position: '', department: '', is_pc: 0, is_mobile: 0, notes: '' });
            setEditingId(null);
            fetchEmails();
        } catch (error) {
            Swal.fire('ข้อผิดพลาด', error.response?.data?.error || 'ไม่สามารถบันทึกข้อมูลได้', 'error');
        }
    };

    const handleEdit = (item) => {
        setFormData({
            email: item.email,
            fullname: item.fullname || '',
            position: item.position || '',
            department: item.department || '',
            is_pc: item.is_pc,
            is_mobile: item.is_mobile,
            notes: item.notes || ''
        });
        setEditingId(item.id);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (id, email) => {
        const result = await Swal.fire({
            title: 'ยืนยันการลบ?',
            text: `คุณต้องการลบทะเบียนเมล ${email} หรือไม่?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'ลบ',
            cancelButtonText: 'ยกเลิก'
        });

        if (result.isConfirmed) {
            try {
                await deleteRegistrationEmail(id);
                Swal.fire('ลบสำเร็จ', 'ลบทะเบียนเมลเรียบร้อยแล้ว', 'success');
                fetchEmails();
            } catch (error) {
                Swal.fire('ข้อผิดพลาด', 'ไม่สามารถลบข้อมูลได้', 'error');
            }
        }
    };

    const cancelEdit = () => {
        setEditingId(null);
        setFormData({ email: '', fullname: '', position: '', department: '', is_pc: 0, is_mobile: 0, notes: '' });
    };

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-gray-800">ทะเบียนอีเมล (Email Registration)</h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Form Section */}
                <div className="lg:col-span-1">
                    <div className="bg-white p-6 rounded-xl shadow-md sticky top-6">
                        <h2 className="text-xl font-bold text-gray-700 mb-6">
                            {editingId ? 'แก้ไขข้อมูลเมล' : 'เพิ่มทะเบียนเมลใหม่'}
                        </h2>
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1 text-blue-800">อีเมล (Email) *</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2.5 border transition"
                                    placeholder="example@email.com"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">ชื่อ-นามสกุล (Full Name)</label>
                                <input
                                    type="text"
                                    name="fullname"
                                    value={formData.fullname}
                                    onChange={handleChange}
                                    className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2.5 border transition"
                                    placeholder="เช่น สมชาย ใจดี"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">ตำแหน่ง (Position)</label>
                                    <input
                                        type="text"
                                        name="position"
                                        value={formData.position}
                                        onChange={handleChange}
                                        className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2.5 border transition text-sm"
                                        placeholder="เช่น Manager"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">แผนก (Department)</label>
                                    <select
                                        name="department"
                                        value={formData.department}
                                        onChange={handleChange}
                                        className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2.5 border transition text-sm"
                                    >
                                        <option value="">เลือกแผนก...</option>
                                        {departments.map((dept) => (
                                            <option key={dept} value={dept}>{dept}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                                <label className="block text-sm font-bold text-blue-800 mb-3">เมลนี้ใช้กับ:</label>
                                <div className="flex gap-6">
                                    <label className="flex items-center gap-2 cursor-pointer group">
                                        <input
                                            type="checkbox"
                                            name="is_pc"
                                            checked={formData.is_pc === 1}
                                            onChange={handleChange}
                                            className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500"
                                        />
                                        <span className="text-gray-700 font-medium group-hover:text-blue-600 transition">PC</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer group">
                                        <input
                                            type="checkbox"
                                            name="is_mobile"
                                            checked={formData.is_mobile === 1}
                                            onChange={handleChange}
                                            className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500"
                                        />
                                        <span className="text-gray-700 font-medium group-hover:text-blue-600 transition">Phone / Tablet</span>
                                    </label>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">หมายเหตุ (Notes)</label>
                                <textarea
                                    name="notes"
                                    value={formData.notes}
                                    onChange={handleChange}
                                    rows="3"
                                    className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2.5 border transition"
                                    placeholder="ระบุรายละเอียดเพิ่มเติม..."
                                ></textarea>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="submit"
                                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-lg transition shadow-md"
                                >
                                    {editingId ? 'บันทึกการแก้ไข' : 'เพิ่มทะเบียนเมล'}
                                </button>
                                {editingId && (
                                    <button
                                        type="button"
                                        onClick={cancelEdit}
                                        className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-2.5 px-4 rounded-lg transition"
                                    >
                                        ยกเลิก
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>
                </div>

                {/* List Section */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-xl shadow-md overflow-hidden">
                        <div className="p-4 border-b">
                            <div className="relative">
                                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                                    <i className="fa-solid fa-search"></i>
                                </span>
                                <input
                                    type="text"
                                    placeholder="ค้นหาอีเมล, ชื่อ, ตำแหน่ง หรือแผนก..."
                                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition sm:text-sm"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">ชื่อ / อีเมล</th>
                                        <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">การใช้งาน</th>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">หมายเหตุ</th>
                                        <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">จัดการ</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {emails.length === 0 ? (
                                        <tr>
                                            <td colSpan="4" className="px-6 py-10 text-center text-gray-500 italic">ไม่พบข้อมูลทะเบียนเมล</td>
                                        </tr>
                                    ) : (
                                        emails.map((item) => (
                                            <tr key={item.id} className="hover:bg-blue-50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-bold text-gray-900">{item.fullname || '-'}</div>
                                                    <div className="text-xs text-blue-600 font-medium">{item.email}</div>
                                                    <div className="flex gap-2 mt-1">
                                                        <span className="text-[10px] bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">{item.position || 'ไม่ระบุตำแหน่ง'}</span>
                                                        <span className="text-[10px] bg-blue-50 px-1.5 py-0.5 rounded text-blue-600 font-medium">{item.department || 'ไม่ระบุแผนก'}</span>
                                                    </div>
                                                    <div className="text-[10px] text-gray-400 mt-1">{new Date(item.created_at).toLocaleDateString('th-TH')}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                                    <div className="flex justify-center gap-2">
                                                        {item.is_pc === 1 && (
                                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                                                                <i className="fa-solid fa-desktop mr-1"></i> PC
                                                            </span>
                                                        )}
                                                        {item.is_mobile === 1 && (
                                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                                                                <i className="fa-solid fa-mobile-screen mr-1"></i> Mobile
                                                            </span>
                                                        )}
                                                        {item.is_pc === 0 && item.is_mobile === 0 && (
                                                            <span className="text-xs text-gray-300">-</span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-sm text-gray-600 line-clamp-2" title={item.notes}>
                                                        {item.notes || '-'}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    <button
                                                        onClick={() => handleEdit(item)}
                                                        className="text-blue-600 hover:text-blue-900 bg-blue-50 p-2 rounded-full hover:bg-blue-100 transition mr-2"
                                                        title="แก้ไข"
                                                    >
                                                        <i className="fa-solid fa-pen-to-square"></i>
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(item.id, item.email)}
                                                        className="text-red-600 hover:text-red-900 bg-red-50 p-2 rounded-full hover:bg-red-100 transition"
                                                        title="ลบ"
                                                    >
                                                        <i className="fa-solid fa-trash"></i>
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EmailPage;
