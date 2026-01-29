import React, { useEffect, useState } from 'react';
import { getAssets, deleteAsset } from '../api';
import { Link } from 'react-router-dom';
import Swal from 'sweetalert2';

const Home = () => {
    const [assets, setAssets] = useState([]);
    const [search, setSearch] = useState('');
    const [filterType, setFilterType] = useState('');
    const [filterStatus, setFilterStatus] = useState('');

    const fetchAssets = async () => {
        try {
            const { data } = await getAssets({ search, type: filterType, status: filterStatus });
            setAssets(data);
        } catch (error) {
            console.error('Failed to fetch assets', error);
        }
    };

    useEffect(() => {
        fetchAssets();
    }, [search, filterType, filterStatus]);

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
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">ทะเบียนทรัพย์สิน</h1>
                        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Computer Asset Management System</p>
                    </div>
                    <Link to="/add" className="bg-blue-600 hover:bg-blue-700 dark:bg-green-600 dark:hover:bg-green-700 text-white px-4 py-2 rounded-lg shadow-lg hover:shadow-xl transition-all font-medium flex items-center gap-2">
                        <i className="fa-solid fa-plus"></i> เพิ่มทรัพย์สิน
                    </Link>
                </div>

                {/* Filters */}
                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 mb-6 flex flex-wrap gap-4 transition-colors duration-300">
                    <div className="relative w-full md:w-1/3">
                        <i className="fa-solid fa-search absolute left-3 top-3 text-gray-400 dark:text-gray-500"></i>
                        <input
                            type="text"
                            placeholder="Search asset..."
                            className="bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white rounded-lg pl-10 pr-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-green-500 transition-shadow"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <select
                        className="bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-green-500"
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                    >
                        <option value="">All Types</option>
                        <option value="Laptop">Laptop</option>
                        <option value="PC">PC</option>
                        <option value="Monitor">Monitor</option>
                        <option value="Server">Server</option>
                        <option value="Accessory">Accessory</option>
                        <option value="Software">Software</option>
                        <option value="Other">Other</option>
                    </select>
                    <select
                        className="bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-green-500"
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                    >
                        <option value="">All Status</option>
                        <option value="available">Available</option>
                        <option value="assigned">Assigned</option>
                        <option value="repair">In Repair</option>
                        <option value="retired">Retired</option>
                        <option value="lost">Lost</option>
                    </select>
                </div>

                {/* Desktop View (Table) */}
                <div className="hidden md:block bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden transition-colors duration-300">
                    <table className="min-w-full leading-normal">
                        <thead>
                            <tr className="bg-gray-50 dark:bg-slate-900/50 text-left">
                                <th className="px-5 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Image</th>
                                <th className="px-5 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Asset Code</th>
                                <th className="px-5 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Name / Model</th>
                                <th className="px-5 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Type</th>
                                <th className="px-5 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                                <th className="px-5 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Price</th>
                                <th className="px-5 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {assets.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="text-center py-8 text-gray-500 dark:text-gray-400">
                                        <div className="flex flex-col items-center">
                                            <i className="fa-solid fa-box-open text-4xl mb-2 opacity-30"></i>
                                            <p>No assets found</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                assets.map((asset) => (
                                    <tr key={asset.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                                        <td className="px-5 py-4">
                                            <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 dark:bg-slate-900 border dark:border-slate-600">
                                                {asset.image_path ? (
                                                    <img className="w-full h-full object-cover" src={getImageUrl(asset.image_path)} alt={asset.name} />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                        <i className="fa-solid fa-image"></i>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-5 py-4">
                                            <span className="font-mono text-xs bg-gray-100 dark:bg-slate-900 text-gray-600 dark:text-green-400 px-2 py-1 rounded border dark:border-green-900/30">
                                                {asset.asset_code}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="ml-1">
                                                <p className="text-gray-900 dark:text-white font-medium">{asset.name}</p>
                                                <p className="text-gray-500 dark:text-gray-400 text-xs">{asset.brand} {asset.model}</p>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4">
                                            <span className="text-sm text-gray-700 dark:text-gray-300">{asset.type}</span>
                                        </td>
                                        <td className="px-5 py-4">
                                            <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${asset.status === 'available' ? 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800' :
                                                asset.status === 'assigned' ? 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800' :
                                                    asset.status === 'repair' ? 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800' :
                                                        'bg-gray-100 text-gray-800 border-gray-200 dark:bg-slate-700 dark:text-gray-400 dark:border-slate-600'
                                                }`}>
                                                {asset.status}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4 text-gray-700 dark:text-gray-300 font-medium">
                                            ฿{Number(asset.price).toLocaleString()}
                                        </td>
                                        <td className="px-5 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <Link to={`/edit/${asset.id}`} className="w-8 h-8 flex items-center justify-center rounded-lg text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/30 transition-colors">
                                                    <i className="fa-solid fa-pen-to-square"></i>
                                                </Link>
                                                <button onClick={() => handleDelete(asset.id)} className="w-8 h-8 flex items-center justify-center rounded-lg text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30 transition-colors">
                                                    <i className="fa-solid fa-trash"></i>
                                                </button>
                                            </div>
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
                        <div className="text-center py-8 text-gray-500 dark:text-gray-400 bg-white dark:bg-slate-800 rounded-xl shadow-sm">No assets found</div>
                    ) : (
                        assets.map((asset) => (
                            <div key={asset.id} className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 flex gap-4 transition-colors">
                                <div className="flex-shrink-0 w-20 h-20">
                                    {asset.image_path ? (
                                        <img className="w-full h-full rounded-lg object-cover bg-gray-100 dark:bg-slate-900" src={getImageUrl(asset.image_path)} alt={asset.name} />
                                    ) : (
                                        <div className="w-full h-full bg-gray-100 dark:bg-slate-900 rounded-lg flex items-center justify-center text-gray-400">
                                            <i className="fa-solid fa-image text-xl"></i>
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="font-mono text-xs bg-gray-100 dark:bg-slate-900 text-gray-600 dark:text-green-400 px-2 py-0.5 rounded">
                                            {asset.asset_code}
                                        </span>
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full border ${asset.status === 'available' ? 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800' :
                                            asset.status === 'assigned' ? 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800' :
                                                asset.status === 'repair' ? 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800' :
                                                    'bg-gray-100 text-gray-800 border-gray-200 dark:bg-slate-700 dark:text-gray-400 dark:border-slate-600'
                                            }`}>
                                            {asset.status}
                                        </span>
                                    </div>
                                    <h3 className="font-bold text-gray-900 dark:text-white truncate">{asset.name}</h3>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 truncate">{asset.brand} - {asset.model}</p>

                                    <div className="flex justify-between items-center border-t border-gray-100 dark:border-gray-700 pt-2">
                                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-200">฿{Number(asset.price).toLocaleString()}</p>
                                        <div className="flex gap-2">
                                            <Link to={`/edit/${asset.id}`} className="text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-1 rounded hover:bg-blue-100 transition">
                                                Edit
                                            </Link>
                                            <button onClick={() => handleDelete(asset.id)} className="text-xs bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-2 py-1 rounded hover:bg-red-100 transition">
                                                Delete
                                            </button>
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
