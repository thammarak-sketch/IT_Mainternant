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
        <div className={`bg-white p-4 rounded-lg shadow border-l-4 ${color} flex items-center justify-between`}>
            <div>
                <p className="text-gray-500 text-sm font-semibold uppercase">{title}</p>
                <p className="text-2xl font-bold text-gray-800">{count}</p>
            </div>
            <div className={`text-3xl opacity-20 ${color.replace('border-', 'text-')}`}>
                <i className={`fa-solid ${icon}`}></i>
            </div>
        </div>
    );

    return (
        <div className="">
            <h1 className="text-3xl font-bold mb-6 text-gray-800">สรุปภาพรวมสต็อก (Stock Dashboard)</h1>

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
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-bold text-gray-700 mb-4 border-b pb-2">สถานะทรัพย์สิน</h3>
                    <div className="space-y-3">
                        {['available', 'assigned', 'repair', 'retired', 'lost'].map(status => (
                            <div key={status} className="flex justify-between items-center">
                                <span className="capitalize text-gray-600">
                                    {status === 'available' ? 'ว่าง (Available)' :
                                        status === 'assigned' ? 'ใช้งานอยู่ (Assigned)' :
                                            status === 'repair' ? 'ส่งซ่อม (Repair)' :
                                                status === 'retired' ? 'ตัดจำหน่าย (Retired)' :
                                                    status === 'lost' ? 'สูญหาย (Lost)' : status}
                                </span>
                                <span className="font-bold bg-gray-100 px-2 py-1 rounded text-gray-700">
                                    {stats.byStatus[status] || 0}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Type Breakdown */}
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-bold text-gray-700 mb-4 border-b pb-2">แยกตามประเภท</h3>
                    <div className="grid grid-cols-2 gap-4">
                        {Object.entries(stats.byType).map(([type, count]) => (
                            <div key={type} className="bg-gray-50 p-3 rounded flex justify-between items-center">
                                <span className="text-gray-700 font-medium">{type}</span>
                                <span className="bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-full text-sm">{count}</span>
                            </div>
                        ))}
                        {Object.keys(stats.byType).length === 0 && <p className="text-gray-400">ยังไม่มีข้อมูล</p>}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StockDashboard;
