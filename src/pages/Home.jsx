import React, { useEffect, useState } from 'react';
import { getAssets, deleteAsset } from '../api';
import { Link } from 'react-router-dom';
import Swal from 'sweetalert2';

const Home = () => {
    const [assets, setAssets] = useState([]);
    const [search, setSearch] = useState('');
    const [filterType, setFilterType] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [filterDept, setFilterDept] = useState('');

    const departments = [
        'IT', 'จัดซื้อ', 'แอดมินขาย', 'ช่าง', 'QC', 'ผลิต', 'planning', 'ผู้บริหาร', 'HR', 'บัญชี', 'การเงิน', 'R&D', 'ผู้จัดการ', 'กราฟฟิก', 'การตลาด', 'คลังสินค้า', 'รปภ', 'จป', 'ขนส่ง'
    ];

    const fetchAssets = async () => {
        try {
            const { data } = await getAssets({
                search,
                type: filterType,
                status: filterStatus,
                name: filterDept
            });
            setAssets(data);
        } catch (error) {
            console.error('Failed to fetch assets', error);
        }
    };

    useEffect(() => {
        fetchAssets();
    }, [search, filterType, filterStatus, filterDept]);

    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: 'ยืนยันการลบ?',
            text: "คุณจะไม่สามารถกู้คืนข้อมูลนี้ได้!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'ใช่, ลบเลย!',
            cancelButtonText: 'ยกเลิก'
        });

        if (result.isConfirmed) {
            try {
                await deleteAsset(id);
                fetchAssets();
                Swal.fire('ลบเสร็จสิ้น!', 'ลบข้อมูลทรัพย์สินเรียบร้อยแล้ว.', 'success');
            } catch (error) {
                Swal.fire('ผิดพลาด', 'ไม่สามารถลบข้อมูลได้', 'error');
            }
        }
    };

    // Helper to get image URL
    const getImageUrl = (path) => {
        if (!path) return null;
        if (path.startsWith('http')) return path;
        const baseURL = import.meta.env.MODE === 'production' ? '' : 'http://localhost:3000';
        return baseURL + path;
    };

    return (
        <div className="">
            <div className="container mx-auto px-4 py-8">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold text-gray-800">ทะเบียนทรัพย์สินคอมพิวเตอร์</h1>
                    <Link to="/add" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow transition">
                        + เพิ่มทรัพย์สินใหม่
                    </Link>
                </div>

                {/* Filters */}
                <div className="bg-white p-4 rounded-lg shadow mb-6 flex flex-wrap gap-4">
                    <input
                        type="text"
                        placeholder="ค้นหา (ชื่อ, รหัส, Serial)..."
                        className="border p-2 rounded w-full md:w-1/3"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    <select
                        className="border p-2 rounded"
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                    >
                        <option value="">ทุกประเภท</option>
                        <option value="Laptop">Laptop (โน้ตบุ๊ก)</option>
                        <option value="PC">PC (คอมพิวเตอร์ตั้งโต๊ะ)</option>
                        <option value="AllInOne">All-in-One</option>
                        <option value="Monitor">Monitor (จอภาพ)</option>
                        <option value="Printer">Printer</option>
                        <option value="Tablet">Tablet</option>
                        <option value="Radio">วอร์ (Radio)</option>
                        <option value="Server">Server</option>
                        <option value="Accessory">Accessory (อุปกรณ์เสริม)</option>
                        <option value="Software">Software (ซอฟต์แวร์)</option>
                    </select>
                    <select
                        className="border p-2 rounded"
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                    >
                        <option value="">ทุกสถานะ</option>
                        <option value="available">ว่าง (Available)</option>
                        <option value="assigned">ใช้งานอยู่ (Assigned)</option>
                        <option value="repair">ส่งซ่อม (Repair)</option>
                        <option value="retired">ตัดจำหน่าย (Retired)</option>
                        <option value="lost">สูญหาย (Lost)</option>
                    </select>
                    <select
                        className="border p-2 rounded"
                        value={filterDept}
                        onChange={(e) => setFilterDept(e.target.value)}
                    >
                        <option value="">ทุกแผนก</option>
                        {departments.map(dept => (
                            <option key={dept} value={dept}>{dept}</option>
                        ))}
                    </select>
                </div>

                {/* Desktop View (Table) */}
                <div className="hidden md:block bg-white rounded-lg shadow overflow-x-auto">
                    <table className="min-w-full leading-normal">
                        <thead>
                            <tr>
                                <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                    รูปภาพ
                                </th>
                                <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                    รหัสทรัพย์สิน
                                </th>
                                <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                    ชื่อผู้ใช้งาน / แผนก
                                </th>
                                <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                    ประเภท
                                </th>
                                <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                    สถานะ
                                </th>
                                <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                    ราคา
                                </th>
                                <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                    จัดการ
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {assets.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="text-center py-4 text-gray-500">ไม่พบข้อมูลทรัพย์สิน</td>
                                </tr>
                            ) : (
                                assets.map((asset) => (
                                    <tr key={asset.id} className="hover:bg-gray-50">
                                        <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                                            <div className="flex-shrink-0 w-16 h-16">
                                                {asset.image_path ? (
                                                    <img className="w-full h-full rounded object-cover" src={getImageUrl(asset.image_path)} alt={asset.name} />
                                                ) : (
                                                    <div className="w-full h-full bg-gray-200 rounded flex items-center justify-center text-gray-400">
                                                        <i className="fa-solid fa-image"></i>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                                            <span className="font-mono bg-gray-100 px-2 py-1 rounded">{asset.asset_code}</span>
                                        </td>
                                        <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                                            <div className="flex items-center">
                                                <div className="ml-3">
                                                    <p className="text-gray-900 whitespace-no-wrap font-semibold">
                                                        {asset.assigned_to || 'ไม่ระบุชื่อ'}
                                                    </p>
                                                    <p className="text-gray-600 whitespace-no-wrap text-xs">{asset.name}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                                            <p className="text-gray-900 whitespace-no-wrap">{asset.type}</p>
                                        </td>
                                        <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                                            <span className={`relative inline-block px-3 py-1 font-semibold leading-tight rounded-full ${asset.status === 'available' ? 'bg-green-100 text-green-900' :
                                                asset.status === 'assigned' ? 'bg-blue-100 text-blue-900' :
                                                    asset.status === 'repair' ? 'bg-yellow-100 text-yellow-900' :
                                                        'bg-gray-100 text-gray-900'
                                                }`}>
                                                <span aria-hidden className="absolute inset-0 opacity-50 rounded-full"></span>
                                                <span className="relative capitalize">
                                                    {asset.status === 'available' ? 'ว่าง' :
                                                        asset.status === 'assigned' ? 'ใช้งานอยู่' :
                                                            asset.status === 'repair' ? 'ส่งซ่อม' :
                                                                asset.status === 'retired' ? 'ตัดจำหน่าย' :
                                                                    asset.status === 'lost' ? 'สูญหาย' : asset.status}
                                                </span>
                                            </span>
                                        </td>
                                        <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                                            <p className="text-gray-900 whitespace-no-wrap">
                                                ฿{Number(asset.price).toLocaleString()}
                                            </p>
                                        </td>
                                        <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm text-right">
                                            <Link to={`/edit/${asset.id}`} className="text-blue-600 hover:text-blue-900 mr-3">แก้ไข</Link>
                                            <button onClick={() => handleDelete(asset.id)} className="text-red-600 hover:text-red-900">ลบ</button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Mobile View (Card List) */}
                <div className="md:hidden grid grid-cols-1 gap-4">
                    {assets.length === 0 ? (
                        <div className="text-center py-8 text-gray-500 bg-white rounded-lg shadow">ไม่พบข้อมูลทรัพย์สิน</div>
                    ) : (
                        assets.map((asset) => (
                            <div key={asset.id} className="bg-white p-4 rounded-lg shadow flex gap-4">
                                <div className="flex-shrink-0 w-24 h-24">
                                    {asset.image_path ? (
                                        <img className="w-full h-full rounded-lg object-cover" src={getImageUrl(asset.image_path)} alt={asset.name} />
                                    ) : (
                                        <div className="w-full h-full bg-gray-200 rounded-lg flex items-center justify-center text-gray-400">
                                            <i className="fa-solid fa-image text-2xl"></i>
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start mb-1">
                                        <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-600">{asset.asset_code}</span>
                                        <span className={`text-xs px-2 py-0.5 rounded-full ${asset.status === 'available' ? 'bg-green-100 text-green-800' :
                                            asset.status === 'assigned' ? 'bg-blue-100 text-blue-800' :
                                                asset.status === 'repair' ? 'bg-yellow-100 text-yellow-800' :
                                                    'bg-gray-100 text-gray-800'
                                            }`}>
                                            {asset.status === 'available' ? 'ว่าง' :
                                                asset.status === 'assigned' ? 'ใช้งาน' :
                                                    asset.status === 'repair' ? 'ส่งซ่อม' :
                                                        asset.status === 'retired' ? 'ตัดจำหน่าย' : 'สูญหาย'}
                                        </span>
                                    </div>
                                    <h3 className="font-bold text-gray-900 truncate mb-1">{asset.assigned_to || 'ไม่ระบุชื่อ'}</h3>
                                    <p className="text-xs text-gray-500 mb-2 truncate">{asset.name}</p>

                                    <div className="flex justify-between items-center mt-auto">
                                        <p className="text-sm font-semibold text-gray-900">฿{Number(asset.price).toLocaleString()}</p>
                                        <div className="flex gap-3">
                                            <Link to={`/edit/${asset.id}`} className="text-blue-600 text-sm">แก้ไข</Link>
                                            <button onClick={() => handleDelete(asset.id)} className="text-red-600 text-sm">ลบ</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default Home;
