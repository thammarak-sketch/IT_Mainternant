import React, { useEffect, useState } from 'react';
import { getAssets } from '../api';

const StockDashboard = () => {
    const [stats, setStats] = useState({
        totalAssets: 0,
        totalValue: 0,
        byStatus: {},
        byType: {}
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const { data } = await getAssets({}); // Fetch all assets

                const totalAssets = data.length;
                const totalValue = data.reduce((sum, asset) => sum + (Number(asset.price) || 0), 0);

                const byStatus = data.reduce((acc, asset) => {
                    acc[asset.status] = (acc[asset.status] || 0) + 1;
                    return acc;
                }, {});

                const byType = data.reduce((acc, asset) => {
                    acc[asset.type] = (acc[asset.type] || 0) + 1;
                    return acc;
                }, {});

                setStats({ totalAssets, totalValue, byStatus, byType });
            } catch (error) {
                console.error("Failed to fetch stock data", error);
            }
        };

        fetchData();
    }, []);

    const StatusCard = ({ title, count, color, icon }) => (
        <div className={`bg-white dark:bg-slate-800 p-4 rounded-xl shadow border-l-4 ${color} dark:border-l-[6px] flex items-center justify-between border-gray-100 dark:border-slate-700`}>
            <div>
                <p className="text-gray-500 dark:text-gray-400 text-sm font-semibold uppercase">{title}</p>
                <p className="text-2xl font-bold text-gray-800 dark:text-white mt-1">{count}</p>
            </div>
            <div className={`text-3xl opacity-20 dark:opacity-40 ${color.replace('border-', 'text-')}`}>
                <i className={`fa-solid ${icon}`}></i>
            </div>
        </div>
    );

    return (
        <div className="bg-white dark:bg-slate-900 min-h-screen transition-colors duration-300">
            <div className="container mx-auto px-4 py-8">
                <h1 className="text-3xl font-bold mb-6 text-gray-800 dark:text-white">สรุปภาพรวมสต็อก (Stock Dashboard)</h1>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <StatusCard
                        title="ทรัพย์สินทั้งหมด"
                        count={stats.totalAssets}
                        color="border-blue-500"
                        icon="fa-cubes"
                    />
                    <StatusCard
                        title="มูลค่ารวม (บาท)"
                        count={stats.totalValue.toLocaleString()}
                        color="border-green-500"
                        icon="fa-money-bill-wave"
                    />
                    <StatusCard
                        title="พร้อมใช้งาน"
                        count={stats.byStatus['available'] || 0}
                        color="border-teal-500"
                        icon="fa-check-circle"
                    />
                    <StatusCard
                        title="ส่งซ่อม"
                        count={stats.byStatus['repair'] || 0}
                        color="border-orange-500"
                        icon="fa-screwdriver-wrench"
                    />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Status Breakdown */}
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow border border-gray-200 dark:border-slate-700">
                        <h3 className="text-lg font-bold text-gray-700 dark:text-white mb-4 border-b dark:border-slate-700 pb-2">สถานะทรัพย์สิน</h3>
                        <div className="space-y-3">
                            {['available', 'assigned', 'repair', 'retired', 'lost'].map(status => (
                                <div key={status} className="flex justify-between items-center bg-gray-50 dark:bg-slate-700/50 p-3 rounded-lg">
                                    <span className="capitalize text-gray-600 dark:text-gray-300 font-medium">
                                        {status === 'available' ? 'ว่าง (Available)' :
                                            status === 'assigned' ? 'ใช้งานอยู่ (Assigned)' :
                                                status === 'repair' ? 'ส่งซ่อม (Repair)' :
                                                    status === 'retired' ? 'ตัดจำหน่าย (Retired)' :
                                                        status === 'lost' ? 'สูญหาย (Lost)' : status}
                                    </span>
                                    <span className={`font-bold px-3 py-1 rounded-full text-sm 
                                    ${status === 'available' ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300' :
                                            status === 'repair' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300' :
                                                'bg-gray-200 text-gray-700 dark:bg-slate-600 dark:text-gray-300'}`}>
                                        {stats.byStatus[status] || 0}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Type Breakdown */}
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow border border-gray-200 dark:border-slate-700">
                        <h3 className="text-lg font-bold text-gray-700 dark:text-white mb-4 border-b dark:border-slate-700 pb-2">แยกตามประเภท</h3>
                        <div className="grid grid-cols-2 gap-4">
                            {Object.entries(stats.byType).map(([type, count]) => (
                                <div key={type} className="bg-gray-50 dark:bg-slate-700/50 p-4 rounded-xl flex justify-between items-center border border-gray-100 dark:border-slate-600">
                                    <span className="text-gray-700 dark:text-gray-300 font-medium">{type}</span>
                                    <span className="bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 font-bold px-3 py-1 rounded-full text-sm">{count}</span>
                                </div>
                            ))}
                            {Object.keys(stats.byType).length === 0 && <p className="text-gray-400 dark:text-gray-500 italic">ยังไม่มีข้อมูล</p>}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StockDashboard;
