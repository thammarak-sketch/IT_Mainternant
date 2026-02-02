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
        email: '',
        is_pc: 0,
        is_mobile: 0,
        repair_method: 'internal',
        location: ''
    });
    const [hasCost, setHasCost] = useState(false);

    const departments = [
        'IT', 'จัดซื้อ', 'แอดมินขาย', 'ช่าง', 'QC', 'ผลิต', 'planning', 'ผู้บริหาร', 'HR', 'บัญชี', 'การเงิน', 'R&D', 'ผู้จัดการ', 'กราฟฟิก', 'การตลาด', 'คลังสินค้า'
    ];

    const locations = [
        '55/38ชั้น 1', '55/38ชั้น 2', '55/38ชั้น 3', '55/39ชั้น 1', '55/39ชั้น 2', '55/39ชั้น 3',
        '55/37ชั้น 1', '55/37ชั้น 2', '55/37ชั้น 3', '55/44ชั้น 1', '55/44ชั้น 2', '55/44ชั้น 3',
        '55/43ชั้น 1', '55/43ชั้น 2', '55/43ชั้น 3', '55/70 ชั้น 1', '55/70 ชั้น 2', '55/70 ชั้น 3',
        'CT-28', 'Dercos-28', '88-1', '88-2', '88-3', '88-4', '88-5', '88-6'
    ];

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
        <div className="">
            <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-md p-6">
                <h2 className="text-2xl font-bold mb-6 text-gray-800">
                    {serviceType === 'repair' ? 'แจ้งซ่อมอุปกรณ์' :
                        serviceType === 'service' ? 'ขอใช้บริการไอที' :
                            'ติดตั้งคอมพิวเตอร์พนักงานใหม่'}
                </h2>

                {/* Service Type Selection */}
                <div className="flex gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="radio"
                            name="serviceType"
                            value="repair"
                            checked={serviceType === 'repair'}
                            onChange={(e) => setServiceType(e.target.value)}
                            className="w-4 h-4 text-blue-600"
                        />
                        <span className="font-medium">แจ้งซ่อม (Repair)</span>
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
                        <span className="font-medium">ขอใช้บริการ (Service Request)</span>
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
                        <span className="font-medium">ติดตั้งพนักงานใหม่ (New Setup)</span>
                    </label>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">

                    {/* Common Fields: Date & Reporter */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-gray-700 text-sm font-bold mb-2">วันที่ *</label>
                            <input
                                type="date"
                                name="log_date"
                                value={formData.log_date}
                                onChange={handleChange}
                                required
                                className="w-full border p-2 rounded"
                            />
                        </div>
                        <div>
                            <label className="block text-gray-700 text-sm font-bold mb-2">ผู้แจ้ง / ผู้ติดต่อ *</label>
                            <input
                                type="text"
                                name="reporter_name"
                                value={formData.reporter_name}
                                onChange={handleChange}
                                required
                                className="w-full border p-2 rounded"
                                placeholder="ชื่อผู้แจ้งเรื่อง"
                            />
                        </div>
                        <div>
                            <label className="block text-gray-700 text-sm font-bold mb-2">แผนก / ฝ่าย *</label>
                            <select
                                name="department"
                                value={formData.department}
                                onChange={handleChange}
                                required
                                className="w-full border p-2 rounded"
                            >
                                <option value="">เลือกแผนก...</option>
                                {departments.map((dept) => (
                                    <option key={dept} value={dept}>{dept}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-gray-700 text-sm font-bold mb-2">สถานที่ / ชั้น *</label>
                            <select
                                name="location"
                                value={formData.location}
                                onChange={handleChange}
                                required
                                className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">เลือกสถานที่</option>
                                {locations.map(loc => (
                                    <option key={loc} value={loc}>{loc}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-gray-700 text-sm font-bold mb-2">เบอร์โทร / Line ID</label>
                            <input
                                type="text"
                                name="contact_info"
                                value={formData.contact_info}
                                onChange={handleChange}
                                className="w-full border p-2 rounded"
                            />
                        </div>
                    </div>

                    <hr className="my-4" />

                    {/* Conditional Fields based on Type */}
                    {serviceType === 'new_setup' ? (
                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                            <h3 className="font-bold text-blue-800 mb-3"><i className="fa-solid fa-user-plus"></i> ข้อมูลพนักงานใหม่</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-gray-700 text-sm font-bold mb-2">ชื่อ-นามสกุล พนักงานใหม่ *</label>
                                    <input
                                        type="text"
                                        name="new_employee_name"
                                        value={formData.new_employee_name}
                                        onChange={handleChange}
                                        required
                                        className="w-full border p-2 rounded"
                                        placeholder="ตัวอย่าง: สมชาย ใจดี"
                                    />
                                </div>
                                <div>
                                    <label className="block text-gray-700 text-sm font-bold mb-2">ประเภทเครื่องที่ต้องการ *</label>
                                    <select
                                        name="asset_type"
                                        value={formData.asset_type}
                                        onChange={handleChange}
                                        required
                                        className="w-full border p-2 rounded"
                                    >
                                        <option value="Laptop">Laptop (โน้ตบุ๊ก)</option>
                                        <option value="PC">PC (คอมพิวเตอร์ตั้งโต๊ะ)</option>
                                        <option value="AllInOne">All-in-One</option>
                                        <option value="Monitor">Monitor (จอภาพ)</option>
                                        <option value="Printer">Printer (เครื่องปริ้น)</option>
                                        <option value="Tablet">Tablet</option>
                                        <option value="Radio">วอร์ (Radio)</option>
                                        <option value="Accessory">Accessory (อุปกรณ์เสริม)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-gray-700 text-sm font-bold mb-2">อีเมล (Email)</label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500"
                                        placeholder="example@email.com"
                                    />
                                </div>
                                <div className="flex items-center gap-6 pt-2">
                                    <label className="flex items-center gap-2 cursor-pointer group">
                                        <input
                                            type="checkbox"
                                            name="is_pc"
                                            checked={formData.is_pc === 1}
                                            onChange={(e) => setFormData(prev => ({ ...prev, is_pc: e.target.checked ? 1 : 0 }))}
                                            className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                                        />
                                        <span className="text-gray-700 font-medium group-hover:text-blue-600 transition-colors">PC</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer group">
                                        <input
                                            type="checkbox"
                                            name="is_mobile"
                                            checked={formData.is_mobile === 1}
                                            onChange={(e) => setFormData(prev => ({ ...prev, is_mobile: e.target.checked ? 1 : 0 }))}
                                            className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                                        />
                                        <span className="text-gray-700 font-medium group-hover:text-blue-600 transition-colors">Phone / Tablet</span>
                                    </label>
                                </div>
                            </div>
                            <p className="text-xs text-blue-600 mt-2">* ระบบจะสร้างทะเบียนทรัพย์สินใหม่อัตโนมัติในสถานะ 'Assigned'</p>
                        </div>
                    ) : (
                        <div>
                            <label className="block text-gray-700 text-sm font-bold mb-2">เลือกทรัพย์สินที่เกี่ยวข้อง {serviceType === 'repair' && '*'}</label>
                            <select
                                name="asset_id"
                                value={formData.asset_id}
                                onChange={handleChange}
                                required={serviceType === 'repair'}
                                className="w-full border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mt-4">
                            <label className="block text-gray-700 text-sm font-bold mb-2">วิธีการซ่อม *</label>
                            <div className="flex gap-4">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="repair_method"
                                        value="internal"
                                        checked={formData.repair_method === 'internal' || !formData.repair_method}
                                        onChange={handleChange}
                                        className="w-4 h-4 text-green-600"
                                    />
                                    <span>ซ่อมเอง (Internal)</span>
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
                                    <span>ส่งซ่อมข้างนอก (External)</span>
                                </label>
                            </div>
                        </div>
                    )}

                    <div>
                        <label className="block text-gray-700 text-sm font-bold mb-2">รายละเอียด / อาการ *</label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            required
                            className="w-full border p-2 rounded h-24"
                            placeholder={serviceType === 'new_setup' ? "ระบุโปรแกรมที่ต้องการลงเพิ่ม หรือหมายเหตุอื่นๆ..." : "ระบุอาการเสีย หรือสิ่งที่ต้องซ่อม..."}
                        ></textarea>
                    </div>



                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <div className="flex items-center justify-between mb-2">
                            <label className="block text-gray-700 text-sm font-bold">ค่าใช้จ่าย</label>
                            <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-600 select-none">
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
                                className="w-full border p-2 rounded"
                                placeholder="ระบุจำนวนเงิน (บาท)"
                                min="0"
                            />
                        )}
                        {!hasCost && (
                            <div className="text-gray-400 text-sm italic py-2">ไม่มีค่าใช้จ่าย</div>
                        )}
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <button
                            type="button"
                            onClick={() => navigate('/maintenance')}
                            className="px-4 py-2 text-gray-600 bg-gray-200 rounded hover:bg-gray-300 transition"
                        >
                            ยกเลิก
                        </button>
                        <button
                            type="submit"
                            className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition font-bold"
                        >
                            บันทึกข้อมูล
                        </button>
                    </div>
                </form>
            </div >
        </div >
    );
};

export default MaintenanceForm;
