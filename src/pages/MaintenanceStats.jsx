import React, { useEffect, useState, useMemo } from 'react';
import { getMaintenanceLogs } from '../api';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement
} from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement
);

const MaintenanceStats = () => {
    const [logs, setLogs] = useState([]);
    const [filter, setFilter] = useState('monthly'); // daily, monthly, yearly

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                const { data } = await getMaintenanceLogs();
                setLogs(data);
            } catch (error) {
                console.error('Failed to fetch logs', error);
            }
        };
        fetchLogs();
    }, []);

    // Process Data based on Filter
    const processedData = useMemo(() => {
        const grouped = {};
        let totalDurationMinutes = 0;
        let completedCount = 0;

        logs.forEach(log => {
            const date = new Date(log.log_date);
            let key;

            if (filter === 'daily') {
                key = date.toLocaleDateString(); // DD/MM/YYYY
            } else if (filter === 'monthly') {
                key = `${date.getMonth() + 1}/${date.getFullYear()}`; // MM/YYYY
            } else {
                key = `${date.getFullYear()}`; // YYYY
            }

            if (!grouped[key]) grouped[key] = 0;
            grouped[key]++;

            if (log.status === 'completed' && log.started_at && log.completed_at) {
                completedCount++;
                const diff = new Date(log.completed_at) - new Date(log.started_at);
                if (diff > 0) totalDurationMinutes += diff / 60000;
            }
        });

        // Sort keys
        const labels = Object.keys(grouped).sort((a, b) => {
            // Simple string sort works for YYYY and usually MM/YYYY if zero-padded, 
            // but for robust sorting we might need date parsing. 
            // For MVP, relying on simple sort or assumes data is relatively sequential.
            return new Date(a) - new Date(b);
        });

        const data = labels.map(label => grouped[label]);

        // Status Counts for Pie Chart
        const statusCounts = {
            pending: logs.filter(l => l.status === 'pending').length,
            in_progress: logs.filter(l => l.status === 'in_progress').length,
            completed: logs.filter(l => l.status === 'completed').length
        };

        const avgDuration = completedCount > 0 ? (totalDurationMinutes / completedCount).toFixed(0) : 0;
        const avgDurationText = `${Math.floor(avgDuration / 60)} ชม. ${avgDuration % 60} นาที`;

        return { labels, data, statusCounts, avgDurationText, total: logs.length, completed: completedCount };
    }, [logs, filter]);

    const barChartData = {
        labels: processedData.labels,
        datasets: [
            {
                label: 'จำนวนงานซ่อม (Jobs)',
                data: processedData.data,
                backgroundColor: 'rgba(59, 130, 246, 0.6)',
                borderColor: 'rgba(59, 130, 246, 1)',
                borderWidth: 1,
            },
        ],
    };

    const pieChartData = {
        labels: ['รอดำเนินการ (Pending)', 'กำลังซ่อม (In Progress)', 'เสร็จสิ้น (Completed)'],
        datasets: [
            {
                data: [processedData.statusCounts.pending, processedData.statusCounts.in_progress, processedData.statusCounts.completed],
                backgroundColor: [
                    'rgba(251, 191, 36, 0.6)', // Yellow
                    'rgba(59, 130, 246, 0.6)', // Blue
                    'rgba(16, 185, 129, 0.6)', // Green
                ],
                borderColor: [
                    'rgba(251, 191, 36, 1)',
                    'rgba(59, 130, 246, 1)',
                    'rgba(16, 185, 129, 1)',
                ],
                borderWidth: 1,
            },
        ],
    };

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-gray-800">สถิติงานซ่อม (Maintenance Statistics)</h1>
                <div className="flex bg-white rounded-lg shadow p-1">
                    {['daily', 'monthly', 'yearly'].map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-2 rounded-md transition ${filter === f ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'}`}
                        >
                            {f === 'daily' ? 'รายวัน' : f === 'monthly' ? 'รายเดือน' : 'รายปี'}
                        </button>
                    ))}
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-blue-500">
                    <div className="text-gray-500 text-sm uppercase font-semibold">งานซ่อมทั้งหมด (Total)</div>
                    <div className="text-4xl font-bold text-gray-800 mt-2">{processedData.total}</div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-green-500">
                    <div className="text-gray-500 text-sm uppercase font-semibold">งานที่เสร็จสิ้น (Completed)</div>
                    <div className="text-4xl font-bold text-gray-800 mt-2">{processedData.completed}</div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-indigo-500">
                    <div className="text-gray-500 text-sm uppercase font-semibold">เวลาเฉลี่ยต่องาน (Avg Duration)</div>
                    <div className="text-3xl font-bold text-gray-800 mt-2">{processedData.avgDurationText}</div>
                </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-md">
                    <h2 className="text-xl font-bold text-gray-700 mb-4">แนวโน้มงานซ่อม ({filter})</h2>
                    <Bar data={barChartData} options={{ responsive: true, plugins: { legend: { position: 'top' } } }} />
                </div>
                <div className="bg-white p-6 rounded-xl shadow-md">
                    <h2 className="text-xl font-bold text-gray-700 mb-4">สถานะงาน (Status)</h2>
                    <Pie data={pieChartData} />
                </div>
            </div>
        </div>
    );
};

export default MaintenanceStats;
