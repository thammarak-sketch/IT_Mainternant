import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createAsset, getAsset, updateAsset, getMaintenanceLogs } from '../api';
import Swal from 'sweetalert2';

const AssetForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEditMode = !!id;

    const [formData, setFormData] = useState({
        asset_code: '',
        name: '',
        type: 'Laptop',
        brand: '',
        model: '',
        serial_number: '',
        purchase_date: '',
        price: '',
        status: 'available',
        location: '',
        notes: ''
    });
    const [image, setImage] = useState(null);
    const [preview, setPreview] = useState(null);
    const [maintenanceLogs, setMaintenanceLogs] = useState([]);

    useEffect(() => {
        if (isEditMode) {
            const fetchAsset = async () => {
                try {
                    const { data } = await getAsset(id);
                    // Format date for input
                    const formattedData = {
                        ...data,
                        purchase_date: data.purchase_date ? data.purchase_date.split('T')[0] : ''
                    };
                    setFormData(formattedData);
                    if (data.image_path) {
                        const baseURL = import.meta.env.MODE === 'production' ? '' : 'http://localhost:3000';
                        setPreview(baseURL + data.image_path);
                    }
                } catch (error) {
                    Swal.fire('Error', 'Failed to fetch asset details', 'error');
                    navigate('/');
                }
            };
            fetchAsset();
            fetchHistory();
        }
    }, [id, isEditMode, navigate]);

    const fetchHistory = async () => {
        try {
            const { data } = await getMaintenanceLogs({ asset_id: id });
            setMaintenanceLogs(data);
        } catch (error) {
            console.error("Failed to fetch history", error);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImage(file);
            setPreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Use FormData for file upload
        const data = new FormData();
        for (const key in formData) {
            // Convert null/undefined to empty string to avoid "null" string in backend
            const value = formData[key] === null || formData[key] === undefined ? '' : formData[key];
            data.append(key, value);
        }
        if (image) {
            data.append('image', image);
        }

        try {
            if (isEditMode) {
                await updateAsset(id, data);
                Swal.fire('สำเร็จ', 'บันทึกการแก้ไขเรียบร้อยแล้ว', 'success');
            } else {
                await createAsset(data);
                Swal.fire('สำเร็จ', 'เพิ่มทรัพย์สินใหม่เรียบร้อยแล้ว', 'success');
            }
            navigate('/');
        } catch (error) {
            console.error(error);
            const msg = error.response?.data?.error || error.response?.data?.details || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล';
            Swal.fire('ข้อผิดพลาด', msg, 'error');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="container mx-auto px-4 py-8">
                <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-2xl font-bold mb-6 text-gray-800">
                        {isEditMode ? 'ข้อมูลทรัพย์สิน' : 'เพิ่มทรัพย์สินใหม่'}
                    </h2>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Image Upload Section */}
                        <div className="flex flex-col items-center mb-6">
                            <div className="w-32 h-32 mb-4 bg-gray-200 rounded-lg overflow-hidden flex items-center justify-center border-2 border-dashed border-gray-400">
                                {preview ? (
                                    <img src={preview} alt="Asset Preview" className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-gray-500 text-sm">ไม่มีรูปภาพ</span>
                                )}
                            </div>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                                className="text-sm text-gray-500
                                file:mr-4 file:py-2 file:px-4
                                file:rounded-full file:border-0
                                file:text-sm file:font-semibold
                                file:bg-blue-50 file:text-blue-700
                                hover:file:bg-blue-100"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-gray-700 text-sm font-bold mb-2">รหัสทรัพย์สิน *</label>
                                <input
                                    required
                                    type="text"
                                    name="asset_code"
                                    value={formData.asset_code || ''}
                                    onChange={handleChange}
                                    className="w-full border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="เช่น IT-2024-XXX"
                                />
                            </div>
                            <div>
                                <label className="block text-gray-700 text-sm font-bold mb-2">ชื่อทรัพย์สิน *</label>
                                <input
                                    required
                                    type="text"
                                    name="name"
                                    value={formData.name || ''}
                                    onChange={handleChange}
                                    className="w-full border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="เช่น MacBook Pro, Dell Monitor"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-gray-700 text-sm font-bold mb-2">ประเภท *</label>
                                <select
                                    name="type"
                                    value={formData.type || 'Laptop'}
                                    onChange={handleChange}
                                    className="w-full border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="Laptop">Laptop (โน้ตบุ๊ก)</option>
                                    <option value="PC">PC (คอมพิวเตอร์ตั้งโต๊ะ)</option>
                                    <option value="Monitor">Monitor (จอภาพ)</option>
                                    <option value="Server">Server</option>
                                    <option value="Accessory">Accessory (อุปกรณ์เสริม)</option>
                                    <option value="Software">Software (ซอฟต์แวร์)</option>
                                    <option value="Other">Other (อื่นๆ)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-gray-700 text-sm font-bold mb-2">สถานะ</label>
                                <select
                                    name="status"
                                    value={formData.status || 'available'}
                                    onChange={handleChange}
                                    className="w-full border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="available">ว่าง (Available)</option>
                                    <option value="assigned">ใช้งานอยู่ (Assigned)</option>
                                    <option value="repair">ส่งซ่อม (Repair)</option>
                                    <option value="retired">ตัดจำหน่าย (Retired)</option>
                                    <option value="lost">สูญหาย (Lost)</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-gray-700 text-sm font-bold mb-2">ยี่ห้อ (Brand)</label>
                                <input
                                    type="text"
                                    name="brand"
                                    value={formData.brand || ''}
                                    onChange={handleChange}
                                    className="w-full border p-2 rounded"
                                />
                            </div>
                            <div>
                                <label className="block text-gray-700 text-sm font-bold mb-2">รุ่น (Model)</label>
                                <input
                                    type="text"
                                    name="model"
                                    value={formData.model || ''}
                                    onChange={handleChange}
                                    className="w-full border p-2 rounded"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-gray-700 text-sm font-bold mb-2">Serial Number</label>
                                <input
                                    type="text"
                                    name="serial_number"
                                    value={formData.serial_number || ''}
                                    onChange={handleChange}
                                    className="w-full border p-2 rounded"
                                />
                            </div>
                            <div>
                                <label className="block text-gray-700 text-sm font-bold mb-2">ราคา (บาท)</label>
                                <input
                                    type="number"
                                    name="price"
                                    value={formData.price || ''}
                                    onChange={handleChange}
                                    className="w-full border p-2 rounded"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-gray-700 text-sm font-bold mb-2">วันที่ซื้อ</label>
                                <input
                                    type="date"
                                    name="purchase_date"
                                    value={formData.purchase_date || ''}
                                    onChange={handleChange}
                                    className="w-full border p-2 rounded"
                                />
                            </div>
                            <div>
                                <label className="block text-gray-700 text-sm font-bold mb-2">สถานที่เก็บ / ใช้งาน</label>
                                <input
                                    type="text"
                                    name="location"
                                    value={formData.location || ''}
                                    onChange={handleChange}
                                    className="w-full border p-2 rounded"
                                    placeholder="เช่น แผนก IT, ห้อง Server"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-gray-700 text-sm font-bold mb-2">หมายเหตุ</label>
                            <textarea
                                name="notes"
                                value={formData.notes || ''}
                                onChange={handleChange}
                                className="w-full border p-2 rounded h-24"
                            ></textarea>
                        </div>

                        <div className="flex justify-end gap-3 pt-4">
                            <button
                                type="button"
                                onClick={() => navigate('/')}
                                className="px-4 py-2 text-gray-600 bg-gray-200 rounded hover:bg-gray-300 transition font-bold"
                            >
                                ยกเลิก
                            </button>
                            <button
                                type="submit"
                                className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition font-extrabold"
                            >
                                {isEditMode ? 'บันทึกการแก้ไข' : 'บันทึกข้อมูล'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Maintenance History Section */}
            {isEditMode && (
                <div className="max-w-6xl mx-auto mt-8 bg-white rounded-lg shadow-md p-6">
                    <h3 className="text-xl font-bold mb-4 text-gray-800 flex items-center">
                        <i className="fa-solid fa-clock-rotate-left mr-2 text-blue-600"></i>
                        ประวัติการซ่อมบำรุง
                    </h3>

                    <div className="overflow-x-auto">
                        <table className="min-w-full leading-normal">
                            <thead>
                                <tr>
                                    <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        วันที่
                                    </th>
                                    <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        ประเภท
                                    </th>
                                    <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        รายละเอียด
                                    </th>
                                    <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        สถานะ
                                    </th>
                                    <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        ค่าใช้จ่าย
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {maintenanceLogs.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="text-center py-4 text-gray-500">ไม่พบประวัติการซ่อม</td>
                                    </tr>
                                ) : (
                                    maintenanceLogs.map((log) => (
                                        <tr key={log.id}>
                                            <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                                                {new Date(log.created_at || log.log_date).toLocaleDateString('th-TH')}
                                            </td>
                                            <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                                                <span className={`px-2 py-1 rounded text-xs font-bold ${log.service_type === 'new_setup' ? 'text-purple-700 bg-purple-50' :
                                                    log.service_type === 'service' ? 'text-blue-700 bg-blue-50' : 'text-orange-700 bg-orange-50'
                                                    }`}>
                                                    {log.service_type === 'new_setup' ? 'ติดตั้งใหม่' : log.service_type === 'service' ? 'บริการ' : 'ซ่อม'}
                                                </span>
                                            </td>
                                            <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                                                <div className="max-w-xs truncate">{log.description}</div>
                                            </td>
                                            <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${log.status === 'completed' ? 'bg-green-100 text-green-800' :
                                                    log.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                                                        'bg-gray-100 text-gray-800'
                                                    }`}>
                                                    {log.status === 'completed' ? 'เสร็จสิ้น' :
                                                        log.status === 'in_progress' ? 'กำลังดำเนินการ' : 'รอคิว'}
                                                </span>
                                            </td>
                                            <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                                                {log.cost ? `฿${Number(log.cost).toLocaleString()}` : '-'}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AssetForm;
