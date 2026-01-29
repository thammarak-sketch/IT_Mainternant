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
    // Theme state to update charts on theme toggle
    const [isDark, setIsDark] = useState(localStorage.getItem('theme') === 'dark');

    useEffect(() => {
        const handleThemeChange = () => {
            setIsDark(localStorage.getItem('theme') === 'dark');
        };
        // Listen for standard storage events and custom events if you have them
        window.addEventListener('storage', handleThemeChange);
        // Polling or observer is overkill, assuming standard reload or user toggle triggers state
        // For dynamic charts, we might need a context, but local check on render works for now
        const interval = setInterval(() => {
            const currentTheme = localStorage.getItem('theme') === 'dark';
            if (currentTheme !== isDark) setIsDark(currentTheme);
        }, 1000); // Simple check for theme switch

        return () => {
            window.removeEventListener('storage', handleThemeChange);
            clearInterval(interval);
        };
    }, [isDark]);


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

        const labels = Object.keys(grouped).sort((a, b) => new Date(a) - new Date(b));
        const data = labels.map(label => grouped[label]);

        const statusCounts = {
            pending: logs.filter(l => l.status === 'pending').length,
            in_progress: logs.filter(l => l.status === 'in_progress').length,
            completed: logs.filter(l => l.status === 'completed').length
        };

        const avgDuration = completedCount > 0 ? (totalDurationMinutes / completedCount).toFixed(0) : 0;
        const avgDurationText = `${Math.floor(avgDuration / 60)} ชม. ${avgDuration % 60} นาที`;

        return { labels, data, statusCounts, avgDurationText, total: logs.length, completed: completedCount };
    }, [logs, filter]);

    const chartTextColor = isDark ? '#ffffff' : '#374151';
    const chartGridColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';

    const barChartData = {
        labels: processedData.labels,
        datasets: [
            {
                label: 'จำนวนงานซ่อม (Jobs)',
                data: processedData.data,
                backgroundColor: isDark ? 'rgba(34, 197, 94, 0.6)' : 'rgba(59, 130, 246, 0.6)',
                borderColor: isDark ? 'rgba(34, 197, 94, 1)' : 'rgba(59, 130, 246, 1)',
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

    const chartOptions = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top',
                labels: { color: chartTextColor }
            },
            title: {
                display: false,
                text: 'แนวโน้มงานซ่อม',
                color: chartTextColor
            }
        },
        scales: {
            x: {
                ticks: { color: chartTextColor },
                grid: { color: chartGridColor }
            },
            y: {
                ticks: { color: chartTextColor },
                grid: { color: chartGridColor }
            }
        }
    };

    return (
        <div className="bg-white dark:bg-slate-900 min-h-screen transition-colors duration-300">
            <div className="container mx-auto px-4 py-8">
                <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-white">สถิติงานซ่อม (Maintenance Statistics)</h1>
                    <div className="flex bg-gray-100 dark:bg-slate-800 rounded-lg p-1">
                        {['daily', 'monthly', 'yearly'].map(f => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-4 py-2 rounded-md transition font-medium ${filter === f
                                    ? 'bg-white dark:bg-slate-600 text-blue-600 dark:text-white shadow-sm'
                                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-700'}`}
                            >
                                {f === 'daily' ? 'รายวัน' : f === 'monthly' ? 'รายเดือน' : 'รายปี'}
                            </button>
                        ))}
                    </div>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow border-l-4 border-blue-500 dark:border-l-[6px] border-gray-100 dark:border-slate-700">
                        <div className="text-gray-500 dark:text-gray-400 text-sm uppercase font-semibold">งานซ่อมทั้งหมด (Total)</div>
                        <div className="text-4xl font-bold text-gray-800 dark:text-white mt-2">{processedData.total}</div>
                    </div>
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow border-l-4 border-green-500 dark:border-l-[6px] border-gray-100 dark:border-slate-700">
                        <div className="text-gray-500 dark:text-gray-400 text-sm uppercase font-semibold">งานที่เสร็จสิ้น (Completed)</div>
                        <div className="text-4xl font-bold text-gray-800 dark:text-white mt-2">{processedData.completed}</div>
                    </div>
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow border-l-4 border-indigo-500 dark:border-l-[6px] border-gray-100 dark:border-slate-700">
                        <div className="text-gray-500 dark:text-gray-400 text-sm uppercase font-semibold">เวลาเฉลี่ยต่องาน (Avg Duration)</div>
                        <div className="text-3xl font-bold text-gray-800 dark:text-white mt-2">{processedData.avgDurationText}</div>
                    </div>
                </div>

                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-xl shadow border border-gray-200 dark:border-slate-700">
                        <h2 className="text-xl font-bold text-gray-700 dark:text-white mb-4">แนวโน้มงานซ่อม ({filter})</h2>
                        <div className="h-[300px] flex items-center justify-center">
                            <Bar data={barChartData} options={chartOptions} />
                        </div>
                    </div>
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow border border-gray-200 dark:border-slate-700">
                        <h2 className="text-xl font-bold text-gray-700 dark:text-white mb-4">สถานะงาน (Status)</h2>
                        <div className="h-[300px] flex items-center justify-center">
                            <Pie data={pieChartData} options={chartOptions} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MaintenanceStats;
