import React, { useState, useEffect } from 'react';
import { getPrompts, getCategories, createPrompt, updatePrompt, deletePrompt } from '../api';
import Swal from 'sweetalert2';
import { Link, useNavigate } from 'react-router-dom';

export default function AdminPrompts() {
    const [prompts, setPrompts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPrompt, setEditingPrompt] = useState(null);
    const navigate = useNavigate();

    // Form State
    const [formData, setFormData] = useState({
        title: '',
        content: '',
        category_id: '',
        cover_image: '',
        url: '',
        gallery: '' // TextArea for multiple URLs separated by newlines
    });

    useEffect(() => {
        if (!localStorage.getItem('adminAuth')) navigate('/');
        fetchData();
    }, []);

    const fetchData = async () => {
        const pRes = await getPrompts({ sort: 'newest' });
        const cRes = await getCategories();
        setPrompts(pRes.data);
        setCategories(cRes.data);
    };

    const handleOpenModal = (prompt = null) => {
        if (prompt) {
            setEditingPrompt(prompt);
            setFormData({
                title: prompt.title,
                content: prompt.content,
                category_id: prompt.category_id,
                cover_image: prompt.cover_image,
                url: prompt.url || '',
                gallery: '' // Gallery editing not fully implemented for simplicity in this view, or user can add new ones
            });
        } else {
            setEditingPrompt(null);
            setFormData({ title: '', content: '', category_id: categories[0]?.id || '', cover_image: '', url: '', gallery: '' });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = { ...formData };
            // Convert gallery textarea to array
            if (payload.gallery) {
                payload.gallery = payload.gallery.split('\n').filter(url => url.trim() !== '');
            } else {
                payload.gallery = [];
            }

            if (editingPrompt) {
                await updatePrompt(editingPrompt.id, payload);
                Swal.fire('Success', 'แก้ไขเรียบร้อย', 'success');
            } else {
                await createPrompt(payload);
                Swal.fire('Success', 'เพิ่มเรียบร้อย', 'success');
            }
            setIsModalOpen(false);
            fetchData();
        } catch (err) {
            Swal.fire('Error', 'บันทึกข้อมูลไม่สำเร็จ', 'error');
        }
    };

    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: 'ยืนยันการลบ?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            confirmButtonText: 'ลบเลย!'
        });

        if (result.isConfirmed) {
            await deletePrompt(id);
            Swal.fire('Deleted!', 'ลบเรียบร้อย', 'success');
            fetchData();
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 font-kanit p-6">
            <div className="container mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold">จัดการ Prompt</h2>
                    <div className="flex gap-2">
                        <Link to="/admin" className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600">กลับ Dashboard</Link>
                        <button onClick={() => handleOpenModal()} className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700">
                            <i className="fa-solid fa-plus"></i> เพิ่ม Prompt
                        </button>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <table className="min-w-full leading-normal">
                        <thead>
                            <tr>
                                <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">ภาพ</th>
                                <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">ชื่อเรื่อง</th>
                                <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">หมวดหมู่</th>
                                <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">จัดการ</th>
                            </tr>
                        </thead>
                        <tbody>
                            {prompts.map(p => (
                                <tr key={p.id}>
                                    <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                                        <img src={p.cover_image} alt="" className="h-10 w-10 rounded object-cover" />
                                    </td>
                                    <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">{p.title}</td>
                                    <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                                        <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs">{p.category_name}</span>
                                    </td>
                                    <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm space-x-2">
                                        <button onClick={() => handleOpenModal(p)} className="text-blue-600 hover:text-blue-900">แก้ไข</button>
                                        <button onClick={() => handleDelete(p.id)} className="text-red-600 hover:text-red-900">ลบ</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg w-full max-w-2xl p-6 relative max-h-[90vh] overflow-y-auto">
                        <h3 className="text-xl font-bold mb-4">{editingPrompt ? 'แก้ไข Prompt' : 'เพิ่ม Prompt ใหม่'}</h3>
                        <form onSubmit={handleSubmit}>
                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2">ชื่อเรื่อง</label>
                                <input type="text" className="w-full border rounded px-3 py-2" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} required />
                            </div>
                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="block text-gray-700 text-sm font-bold mb-2">หมวดหมู่</label>
                                    <select className="w-full border rounded px-3 py-2" value={formData.category_id} onChange={e => setFormData({ ...formData, category_id: e.target.value })} required>
                                        <option value="">เลือกหมวดหมู่</option>
                                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-gray-700 text-sm font-bold mb-2">ลิงก์ภาพปก (URL)</label>
                                    <input type="text" className="w-full border rounded px-3 py-2" value={formData.cover_image} onChange={e => setFormData({ ...formData, cover_image: e.target.value })} required placeholder="https://..." />
                                </div>
                            </div>
                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2">URL (ถ้ามี)</label>
                                <input type="text" className="w-full border rounded px-3 py-2" value={formData.url} onChange={e => setFormData({ ...formData, url: e.target.value })} placeholder="https://..." />
                            </div>
                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2">เนื้อหา Prompt</label>
                                <textarea className="w-full border rounded px-3 py-2 h-32 font-mono" value={formData.content} onChange={e => setFormData({ ...formData, content: e.target.value })} required></textarea>
                            </div>
                            {!editingPrompt && (
                                <div className="mb-4">
                                    <label className="block text-gray-700 text-sm font-bold mb-2">รูปภาพเพิ่มเติม (URL) - บรรทัดละ 1 รูป</label>
                                    <textarea className="w-full border rounded px-3 py-2 h-24" value={formData.gallery} onChange={e => setFormData({ ...formData, gallery: e.target.value })} placeholder="https://image1.jpg&#10;https://image2.jpg"></textarea>
                                </div>
                            )}
                            <div className="flex justify-end gap-2">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-gray-300 rounded text-gray-700">ยกเลิก</button>
                                <button type="submit" className="px-4 py-2 bg-purple-600 text-white rounded">บันทึก</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
