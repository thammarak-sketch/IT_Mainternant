import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAssets, createMaintenanceLog, getMaintenanceLogs } from '../api';
import Swal from 'sweetalert2';

const PublicReport = () => {
    const [assets, setAssets] = useState([]);
    const [filteredAssets, setFilteredAssets] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [serviceType, setServiceType] = useState('repair');
    const [todaysQueue, setTodaysQueue] = useState([]); // Queue state
    const [currentTime, setCurrentTime] = useState(new Date());

    const [formData, setFormData] = useState({
        asset_id: '',
        log_date: new Date().toISOString().split('T')[0],
        description: '',
        reporter_name: '',
        contact_info: '',
        department: '',
        location: '',
        cost: 0,
        // New Service Fields
        new_employee_name: '',
        asset_type: 'Laptop',
        email: '',
        is_pc: 0,
        is_mobile: 0
    });

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
                setFilteredAssets(data);
            } catch (error) {
                console.error("Failed to fetch assets", error);
            }
        };
        fetchAssets();
        fetchQueue();

        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const fetchQueue = async () => {
        try {
            const today = new Date().toISOString().split('T')[0];
            const { data } = await getMaintenanceLogs({ date: today });
            setTodaysQueue(data);
        } catch (error) {
            console.error("Failed to fetch queue", error);
        }
    };

    // Helper to mask name
    const maskName = (name) => {
        if (!name) return '-';
        const parts = name.split(' ');
        if (parts.length > 1) {
            return `${parts[0]} ${parts[1][0]}...`;
        }
        return name.length > 3 ? `${name.substring(0, 3)}...` : name;
    };

    useEffect(() => {
        const results = assets.filter(asset =>
            asset.asset_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
            asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (asset.assigned_to && asset.assigned_to.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (asset.serial_number && asset.serial_number.toLowerCase().includes(searchTerm.toLowerCase()))
        );
        setFilteredAssets(results);
    }, [searchTerm, assets]);

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
            await Swal.fire({
                icon: 'success',
                title: 'ส่งเรื่องเรียบร้อย ✅',
                text: 'เจ้าหน้าที่ได้รับเรื่องแล้ว กรุณารอการติดต่อกลับ',
                timer: 3000,
                showConfirmButton: true
            });
            // Reset form
            setFormData({
                asset_id: '',
                log_date: new Date().toISOString().split('T')[0],
                description: '',
                reporter_name: '',
                contact_info: '',
                department: '',
                location: '', // Reset location
                cost: 0,
                new_employee_name: '',
                asset_type: 'Laptop',
                email: '',
                is_pc: 0,
                is_mobile: 0
            });
            setSearchTerm('');
            setServiceType('repair');
            fetchQueue(); // Refresh queue after submit
        } catch (error) {
            console.error(error);
            Swal.fire('ข้อผิดพลาด', 'ไม่สามารถส่งข้อมูลได้', 'error');
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col justify-center items-center p-4">
            <div className="w-full max-w-7xl bg-white rounded-lg shadow-xl overflow-hidden">
                <div className="bg-blue-600 p-6 text-white text-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 text-blue-100 text-sm font-mono mt-1">
                        🕒 {currentTime.toLocaleTimeString('th-TH')}
                    </div>
                    <h1 className="text-3xl font-bold">ITAssist Service Request</h1>
                    <p className="opacity-90 mt-2">ระบบแจ้งซ่อม/บริการออนไลน์ (ไม่ต้องเข้าสู่ระบบ)</p>
                </div>

                <div className="flex flex-col lg:flex-row">
                    <div className="p-6 md:p-8 space-y-5 w-full lg:w-2/3">

                        {/* Service Type Selection */}
                        <div className="flex flex-col md:flex-row gap-4 mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                            <label className="flex items-center gap-2 cursor-pointer p-2 hover:bg-white rounded transition">
                                <input
                                    type="radio"
                                    name="serviceType"
                                    value="repair"
                                    checked={serviceType === 'repair'}
                                    onChange={(e) => setServiceType(e.target.value)}
                                    className="w-4 h-4 text-blue-600"
                                />
                                <span className="font-medium">🛠️ แจ้งซ่อม (Repair)</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer p-2 hover:bg-white rounded transition">
                                <input
                                    type="radio"
                                    name="serviceType"
                                    value="service"
                                    checked={serviceType === 'service'}
                                    onChange={(e) => setServiceType(e.target.value)}
                                    className="w-4 h-4 text-blue-600"
                                />
                                <span className="font-medium">🙋‍♂️ ขอใช้บริการ (Request)</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer p-2 hover:bg-white rounded transition">
                                <input
                                    type="radio"
                                    name="serviceType"
                                    value="new_setup"
                                    checked={serviceType === 'new_setup'}
                                    onChange={(e) => setServiceType(e.target.value)}
                                    className="w-4 h-4 text-blue-600"
                                />
                                <span className="font-medium">💻 ติดตั้งพนักงานใหม่ (New Setup)</span>
                            </label>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">

                            {/* Conditional Section */}
                            {serviceType === 'new_setup' ? (
                                <div className="bg-green-50 p-4 rounded-lg border border-green-100 animate-in fade-in slide-in-from-top-4 duration-300">
                                    <h3 className="font-bold text-green-800 mb-3"><i className="fa-solid fa-user-plus"></i> ข้อมูลสำหรับพนักงานใหม่</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-gray-700 font-bold mb-2">ชื่อ-นามสกุล พนักงานใหม่ *</label>
                                            <input
                                                type="text"
                                                name="new_employee_name"
                                                value={formData.new_employee_name}
                                                onChange={handleChange}
                                                required
                                                className="w-full border p-2 rounded focus:ring-2 focus:ring-green-500"
                                                placeholder="ระบุชื่อพนักงานใหม่"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-gray-700 font-bold mb-2">ประเภทเครื่อง *</label>
                                            <select
                                                name="asset_type"
                                                value={formData.asset_type}
                                                onChange={handleChange}
                                                required
                                                className="w-full border p-2 rounded focus:ring-2 focus:ring-green-500"
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
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                        <div>
                                            <label className="block text-gray-700 font-bold mb-2">อีเมล (Email)</label>
                                            <input
                                                type="email"
                                                name="email"
                                                value={formData.email}
                                                onChange={handleChange}
                                                className="w-full border p-2 rounded focus:ring-2 focus:ring-green-500"
                                                placeholder="example@email.com"
                                            />
                                        </div>
                                        <div className="flex items-center gap-6 pt-8">
                                            <label className="flex items-center gap-2 cursor-pointer group">
                                                <input
                                                    type="checkbox"
                                                    name="is_pc"
                                                    checked={formData.is_pc === 1}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, is_pc: e.target.checked ? 1 : 0 }))}
                                                    className="w-5 h-5 rounded text-green-600 focus:ring-green-500 cursor-pointer"
                                                />
                                                <span className="text-gray-700 font-medium group-hover:text-green-600 transition-colors">PC</span>
                                            </label>
                                            <label className="flex items-center gap-2 cursor-pointer group">
                                                <input
                                                    type="checkbox"
                                                    name="is_mobile"
                                                    checked={formData.is_mobile === 1}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, is_mobile: e.target.checked ? 1 : 0 }))}
                                                    className="w-5 h-5 rounded text-green-600 focus:ring-green-500 cursor-pointer"
                                                />
                                                <span className="text-gray-700 font-medium group-hover:text-green-600 transition-colors">Phone / Tablet</span>
                                            </label>
                                        </div>
                                    </div>
                                    <p className="text-xs text-green-600 mt-2">* ระบบจะทำการสร้างทะเบียนทรัพย์สินใหม่อัตโนมัติ</p>
                                </div>
                            ) : (
                                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                                    <label className="block text-gray-800 font-bold mb-2">
                                        {serviceType === 'repair' ? '1. ค้นหาทรัพย์สินที่ต้องการแจ้งซ่อม *' : '1. ระบุทรัพย์สิน (ถ้ามี)'}
                                    </label>
                                    <input
                                        type="text"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        placeholder="พิมพ์รหัสเครื่อง (Asset Code) หรือ ชื่อรุ่น..."
                                        className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 mb-2"
                                    />

                                    <select
                                        name="asset_id"
                                        value={formData.asset_id}
                                        onChange={handleChange}
                                        required={serviceType === 'repair'}
                                        size="4"
                                        className="w-full border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                    >
                                        <option value="" disabled>-- คลิกเลือกทรัพย์สินจากรายการ --</option>
                                        {filteredAssets.map(asset => (
                                            <option key={asset.id} value={asset.id} className="p-2 border-b cursor-pointer hover:bg-blue-100">
                                                {asset.asset_code} | {asset.assigned_to || 'ไม่ระบุชื่อ'} ({asset.name})
                                            </option>
                                        ))}
                                    </select>
                                    {formData.asset_id && (
                                        <p className="text-green-600 text-sm mt-1 font-semibold">
                                            <i className="fa-solid fa-check-circle mr-1"></i>
                                            เลือก: {assets.find(a => a.id == formData.asset_id)?.asset_code}
                                        </p>
                                    )}
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4"> {/* Changed to 3 columns */}
                                <div>
                                    <label className="block text-gray-700 font-bold mb-2">ชื่อผู้แจ้ง *</label>
                                    <input
                                        type="text"
                                        name="reporter_name"
                                        value={formData.reporter_name}
                                        onChange={handleChange}
                                        required
                                        placeholder="ชื่อ-นามสกุล"
                                        className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-gray-700 font-bold mb-2">แผนกที่แจ้ง *</label>
                                    <select
                                        name="department"
                                        value={formData.department}
                                        onChange={handleChange}
                                        required
                                        className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">เลือกแผนก</option>
                                        {departments.map(dept => (
                                            <option key={dept} value={dept}>{dept}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-gray-700 font-bold mb-2">สถานที่ / ชั้น *</label>
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
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-gray-700 font-bold mb-2">เบอร์ติดต่อ *</label>
                                    <input
                                        type="text"
                                        name="contact_info"
                                        value={formData.contact_info}
                                        onChange={handleChange}
                                        required
                                        placeholder="เบอร์โทรภายใน หรือ มือถือ"
                                        className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-gray-700 font-bold mb-2">วันที่แจ้ง *</label>
                                    <input
                                        type="date"
                                        name="log_date"
                                        value={formData.log_date}
                                        onChange={handleChange}
                                        required
                                        className="w-full border p-2 rounded"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-gray-700 font-bold mb-2">
                                    {serviceType === 'new_setup' ? 'โปรแกรมที่ต้องการ / หมายเหตุ *' : 'รายละเอียดอาการเสีย / สิ่งที่ต้องการ *'}
                                </label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    required
                                    className="w-full border p-2 rounded h-24 text-gray-700 focus:ring-2 focus:ring-blue-500"
                                    placeholder={serviceType === 'new_setup' ? "เช่น ต้องการลงโปรแกรม Adobe, Office หรือ รายละเอียดเพิ่มเติม..." : "อาการเป็นอย่างไร? เกิดขึ้นเมื่อไหร่?"}
                                ></textarea>
                            </div>

                            <div className="flex gap-4 pt-2">
                                <Link to="/login" className="flex-1 py-3 text-center text-gray-600 bg-gray-200 rounded hover:bg-gray-300 font-bold transition">
                                    กลับ
                                </Link>
                                <button
                                    type="submit"
                                    className={`flex-1 py-3 text-white rounded font-bold transition shadow-lg ${serviceType === 'new_setup' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
                                        }`}
                                >
                                    {serviceType === 'new_setup' ? 'ยืนยันการขอติดตั้ง' : 'ยืนยันการแจ้งเรื่อง'}
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Today's Queue Section - Right Side */}
                    <div className="bg-gray-50 border-t lg:border-t-0 lg:border-l border-gray-200 p-6 w-full lg:w-1/3">
                        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                            <i className="fa-solid fa-list-ol mr-2 text-blue-600"></i>
                            คิวงานวันนี้ (Today's Queue)
                        </h3>

                        {todaysQueue.length === 0 ? (
                            <p className="text-gray-500 text-center py-4 bg-white rounded border">ยังไม่มีคิวงานวันนี้</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full bg-white rounded-lg overflow-hidden shadow-sm">
                                    <thead className="bg-gray-100 text-gray-600 uppercase text-xs">
                                        <tr>
                                            <th className="py-3 px-4 text-left">เวลา</th>
                                            <th className="py-3 px-4 text-left">ประเภท</th>
                                            <th className="py-3 px-4 text-left">สถานที่</th> {/* Added Location Header */}
                                            <th className="py-3 px-4 text-left">สถานะ</th>
                                            <th className="py-3 px-4 text-left">ผู้แจ้ง</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-sm">
                                        {todaysQueue.map((log) => (
                                            <tr key={log.id} className="border-b hover:bg-gray-50">
                                                <td className="py-3 px-4">{new Date(log.created_at || log.log_date).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}</td>
                                                <td className="py-3 px-4">
                                                    <span className={`px-2 py-1 rounded text-xs font-bold ${log.service_type === 'new_setup' ? 'text-purple-700 bg-purple-50' :
                                                        log.service_type === 'service' ? 'text-blue-700 bg-blue-50' : 'text-orange-700 bg-orange-50'
                                                        }`}>
                                                        {log.service_type === 'new_setup' ? 'ติดตั้งใหม่' : log.service_type === 'service' ? 'บริการ' : 'ซ่อม'}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4 text-gray-600">{log.location || '-'}</td> {/* Added Location Data */}
                                                <td className="py-3 px-4">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${log.status === 'completed' ? 'bg-green-100 text-green-800' :
                                                        log.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                                                            'bg-gray-100 text-gray-800'
                                                        }`}>
                                                        {log.status === 'completed' ? 'เสร็จสิ้น' :
                                                            log.status === 'in_progress' ? 'กำลังดำเนินการ' : 'รอคิว'}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4 text-gray-500">{maskName(log.reporter_name)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>

                <p className="mb-8 mt-6 text-center text-gray-500 text-sm">&copy; 2024 ITAssist Management System</p>
            </div>
        </div>
    );
};

export default PublicReport;
