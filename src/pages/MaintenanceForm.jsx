import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAssets, createMaintenanceLog } from '../api';
import Swal from 'sweetalert2';

const MaintenanceForm = () => {
    const navigate = useNavigate();
    const [assets, setAssets] = useState([]);
    const [serviceType, setServiceType] = useState('repair'); // repair, service, new_setup
    const [formData, setFormData] = useState({
        asset_id: '',
        log_date: new Date().toISOString().split('T')[0],
        description: '',
        cost: '',
        reporter_name: '',
        contact_info: '',
        department: '',
        // New Service Fields
        new_employee_name: '',
        asset_type: 'Laptop', // Default type for new setup
        repair_method: 'internal'
    });
    const [hasCost, setHasCost] = useState(false);

    useEffect(() => {
        const fetchAssets = async () => {
            try {
                const { data } = await getAssets({});
                setAssets(data);
            } catch (error) {
                console.error("Failed to fetch assets", error);
            }
        };
        fetchAssets();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await createMaintenanceLog({
                ...formData,
                service_type: serviceType
            });
            Swal.fire({
                icon: 'success',
                title: 'บันทึกสำเร็จ',
                text: 'เพิ่มรายการเรียบร้อยแล้ว',
                timer: 1500,
                showConfirmButton: false
            });
            navigate('/maintenance');
        } catch (error) {
            console.error(error);
            Swal.fire('ข้อผิดพลาด', 'ไม่สามารถบันทึกข้อมูลได้', 'error');
        }
    };

    return (
        <div className="min-h-screen bg-white dark:bg-slate-900 transition-colors duration-300">
            <div className="container mx-auto px-4 py-8">
                <div className="max-w-3xl mx-auto bg-white dark:bg-slate-800 rounded-xl shadow-lg dark:shadow-green-900/10 p-6 sm:p-8 transition-all border border-gray-200 dark:border-slate-700">
                    <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white border-b pb-4 dark:border-slate-700">
                        {serviceType === 'repair' ? 'แจ้งซ่อมอุปกรณ์' :
                            serviceType === 'service' ? 'ขอใช้บริการไอที' :
                                'ติดตั้งคอมพิวเตอร์พนักงานใหม่'}
                    </h2>

                    {/* Service Type Selection */}
                    <div className="flex flex-wrap gap-4 mb-8 p-4 bg-gray-50 dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-slate-700">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="radio"
                                name="serviceType"
                                value="repair"
                                checked={serviceType === 'repair'}
                                onChange={(e) => setServiceType(e.target.value)}
                                className="w-4 h-4 text-blue-600"
                            />
                            <span className="font-medium text-gray-700 dark:text-gray-300">แจ้งซ่อม (Repair)</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="radio"
                                name="serviceType"
                                value="service"
                                checked={serviceType === 'service'}
                                onChange={(e) => setServiceType(e.target.value)}
                                className="w-4 h-4 text-blue-600"
                            />
                            <span className="font-medium text-gray-700 dark:text-gray-300">ขอใช้บริการ (Service Request)</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="radio"
                                name="serviceType"
                                value="new_setup"
                                checked={serviceType === 'new_setup'}
                                onChange={(e) => setServiceType(e.target.value)}
                                className="w-4 h-4 text-blue-600"
                            />
                            <span className="font-medium text-gray-700 dark:text-gray-300">ติดตั้งพนักงานใหม่ (New Setup)</span>
                        </label>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">

                        {/* Common Fields: Date & Reporter */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">วันที่ *</label>
                                <input
                                    type="date"
                                    name="log_date"
                                    value={formData.log_date}
                                    onChange={handleChange}
                                    required
                                    className="w-full border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-white rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 dark:focus:ring-green-500 font-medium"
                                />
                            </div>
                            <div>
                                <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">ผู้แจ้ง / ผู้ติดต่อ *</label>
                                <input
                                    type="text"
                                    name="reporter_name"
                                    value={formData.reporter_name}
                                    onChange={handleChange}
                                    required
                                    className="w-full border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-white rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 dark:focus:ring-green-500 font-medium"
                                    placeholder="ชื่อผู้แจ้งเรื่อง"
                                />
                            </div>
                            <div>
                                <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">แผนก / ฝ่าย *</label>
                                <input
                                    type="text"
                                    name="department"
                                    value={formData.department}
                                    onChange={handleChange}
                                    required
                                    className="w-full border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-white rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 dark:focus:ring-green-500 font-medium"
                                    placeholder="IT, HR, Sales..."
                                />
                            </div>
                            <div>
                                <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">เบอร์โทร / Line ID</label>
                                <input
                                    type="text"
                                    name="contact_info"
                                    value={formData.contact_info}
                                    onChange={handleChange}
                                    className="w-full border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-white rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 dark:focus:ring-green-500 font-medium"
                                />
                            </div>
                        </div>

                        <hr className="my-4 border-gray-200 dark:border-slate-700" />

                        {/* Conditional Fields based on Type */}
                        {serviceType === 'new_setup' ? (
                            <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-xl border border-blue-200 dark:border-blue-800/50">
                                <h3 className="font-bold text-blue-800 dark:text-blue-300 mb-4 flex items-center gap-2"><i className="fa-solid fa-user-plus"></i> ข้อมูลพนักงานใหม่</h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">ชื่อ-นามสกุล พนักงานใหม่ *</label>
                                        <input
                                            type="text"
                                            name="new_employee_name"
                                            value={formData.new_employee_name}
                                            onChange={handleChange}
                                            required
                                            className="w-full border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-white rounded-lg p-2.5"
                                            placeholder="ตัวอย่าง: สมชาย ใจดี"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">ประเภทเครื่องที่ต้องการ *</label>
                                        <select
                                            name="asset_type"
                                            value={formData.asset_type}
                                            onChange={handleChange}
                                            required
                                            className="w-full border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-white rounded-lg p-2.5"
                                        >
                                            <option value="Laptop">Laptop (โน้ตบุ๊ก)</option>
                                            <option value="PC">PC (คอมพิวเตอร์ตั้งโต๊ะ)</option>
                                            <option value="Monitor">Monitor (จอภาพ)</option>
                                            <option value="Accessory">Accessory (อุปกรณ์เสริม)</option>
                                        </select>
                                    </div>
                                </div>
                                <p className="text-xs text-blue-600 dark:text-blue-400 mt-3">* ระบบจะสร้างทะเบียนทรัพย์สินใหม่อัตโนมัติในสถานะ 'Assigned'</p>
                            </div>
                        ) : (
                            <div>
                                <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">เลือกทรัพย์สินที่เกี่ยวข้อง {serviceType === 'repair' && '*'}</label>
                                <select
                                    name="asset_id"
                                    value={formData.asset_id}
                                    onChange={handleChange}
                                    required={serviceType === 'repair'}
                                    className="w-full border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-white rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-green-500"
                                >
                                    <option value="">-- {serviceType === 'repair' ? 'กรุณาเลือกทรัพย์สินที่เสีย' : 'เลือกทรัพย์สิน (ถ้ามี)'} --</option>
                                    {assets.map(asset => (
                                        <option key={asset.id} value={asset.id}>
                                            {asset.asset_code} - {asset.name} ({asset.status})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* Repair Method Selection (Only for Repair Service) */}
                        {serviceType === 'repair' && (
                            <div className="bg-gray-50 dark:bg-slate-900 p-4 rounded-xl border border-gray-200 dark:border-slate-700 mt-4">
                                <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">วิธีการซ่อม *</label>
                                <div className="flex gap-6">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="repair_method"
                                            value="internal"
                                            checked={formData.repair_method === 'internal' || !formData.repair_method}
                                            onChange={handleChange}
                                            className="w-4 h-4 text-green-600"
                                        />
                                        <span className="text-gray-700 dark:text-gray-300">ซ่อมเอง (Internal)</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="repair_method"
                                            value="external"
                                            checked={formData.repair_method === 'external'}
                                            onChange={handleChange}
                                            className="w-4 h-4 text-red-600"
                                        />
                                        <span className="text-gray-700 dark:text-gray-300">ส่งซ่อมข้างนอก (External)</span>
                                    </label>
                                </div>
                            </div>
                        )}

                        <div>
                            <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">รายละเอียด / อาการ *</label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                required
                                className="w-full border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-white rounded-lg p-3 h-32 focus:ring-2 focus:ring-blue-500 dark:focus:ring-green-500"
                                placeholder={serviceType === 'new_setup' ? "ระบุโปรแกรมที่ต้องการลงเพิ่ม หรือหมายเหตุอื่นๆ..." : "ระบุอาการเสีย หรือสิ่งที่ต้องซ่อม..."}
                            ></textarea>
                        </div>

                        <div className="bg-gray-50 dark:bg-slate-900 p-4 rounded-xl border border-gray-200 dark:border-slate-700">
                            <div className="flex items-center justify-between mb-2">
                                <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold">ค่าใช้จ่าย</label>
                                <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-600 dark:text-gray-400 select-none">
                                    <input
                                        type="checkbox"
                                        checked={hasCost}
                                        onChange={(e) => {
                                            setHasCost(e.target.checked);
                                            if (!e.target.checked) setFormData(prev => ({ ...prev, cost: '' }));
                                        }}
                                        className="w-4 h-4 rounded text-blue-600"
                                    />
                                    มีค่าใช้จ่าย
                                </label>
                            </div>

                            {hasCost && (
                                <input
                                    type="number"
                                    name="cost"
                                    value={formData.cost}
                                    onChange={handleChange}
                                    className="w-full border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-white rounded-lg p-2.5"
                                    placeholder="ระบุจำนวนเงิน (บาท)"
                                    min="0"
                                />
                            )}
                            {!hasCost && (
                                <div className="text-gray-400 dark:text-gray-500 text-sm italic py-2">ไม่มีค่าใช้จ่าย</div>
                            )}
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-slate-700">
                            <button
                                type="button"
                                onClick={() => navigate('/maintenance')}
                                className="px-5 py-2.5 text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-slate-700 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600 transition font-bold"
                            >
                                ยกเลิก
                            </button>
                            <button
                                type="submit"
                                className="px-6 py-2.5 bg-blue-600 dark:bg-green-600 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-green-500 transition font-bold shadow-lg"
                            >
                                บันทึกข้อมูล
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default MaintenanceForm;
