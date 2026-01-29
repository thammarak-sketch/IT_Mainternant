import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getMaintenanceLogs, deleteMaintenanceLog, updateMaintenanceLog } from '../api';
import Swal from 'sweetalert2';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { loadThaiFont } from '../utils/thaiFont';

const Maintenance = () => {
    const [logs, setLogs] = useState([]);
    const [filterDeviceType, setFilterDeviceType] = useState('');

    const fetchLogs = async () => {
        try {
            const { data } = await getMaintenanceLogs();
            setLogs(data);
        } catch (error) {
            console.error('Failed to fetch maintenance logs', error);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, []);

    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: 'ยืนยันการลบ?',
            text: "คุณต้องการลบรายการนี้หรือไม่?",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'ลบ',
            cancelButtonText: 'ยกเลิก'
        });

        if (result.isConfirmed) {
            try {
                await deleteMaintenanceLog(id);
                fetchLogs();
                Swal.fire('ลบสำเร็จ', 'ลบรายการเรียบร้อยแล้ว', 'success');
            } catch (error) {
                Swal.fire('ข้อผิดพลาด', 'ไม่สามารถลบรายการได้', 'error');
            }
        }
    };

    const handleUpdateStatus = async (id, currentStatus) => {
        const { value: status } = await Swal.fire({
            title: 'อัพเดทสถานะ',
            input: 'select',
            inputOptions: {
                'pending': 'รอดำเนินการ',
                'in_progress': 'กำลังซ่อม',
                'completed': 'เสร็จสิ้น'
            },
            inputValue: currentStatus,
            showCancelButton: true,
        });

        if (status) {
            try {
                await updateMaintenanceLog(id, { status });
                fetchLogs();
                Swal.fire('สำเร็จ', 'อัพเดทสถานะเรียบร้อยแล้ว', 'success');
            } catch (error) {
                Swal.fire('ข้อผิดพลาด', 'ไม่สามารถอัพเดทสถานะได้', 'error');
            }
        }
    };

    // Export to Excel
    const exportToExcel = () => {
        const worksheet = XLSX.utils.json_to_sheet(logs.map(log => ({
            Date: new Date(log.log_date).toLocaleDateString(),
            Reporter: log.reporter_name,
            Department: log.department,
            Asset: log.Asset ? log.Asset.name : 'N/A',
            Description: log.description,
            Status: log.status,
            Cost: log.cost
        })));
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Maintenance Logs");
        XLSX.writeFile(workbook, "Maintenance_Logs.xlsx");
    };

    // Export to PDF
    const exportToPDF = async () => {
        const doc = new jsPDF();

        await loadThaiFont(doc);

        doc.setFont('Sarabun', 'normal');
        doc.setFontSize(18);
        doc.text("รายงานการซ่อมบำรุง", 14, 20);

        const tableColumn = ["วันที่", "ผู้แจ้ง", "แผนก", "ทรัพย์สิน", "อาการ", "สถานะ", "ค่าใช้จ่าย"];
        const tableRows = [];

        logs.forEach(log => {
            const maintenanceData = [
                new Date(log.log_date).toLocaleDateString(),
                log.reporter_name,
                log.department,
                log.Asset ? log.Asset.name : 'N/A',
                log.description,
                log.status,
                log.cost
            ];
            tableRows.push(maintenanceData);
        });

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 25,
            styles: { font: 'Sarabun', fontSize: 10 },
            headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' },
        });

        doc.save("Maintenance_Report.pdf");
    };

    return (
        <div className="min-h-screen bg-white dark:bg-slate-900 transition-colors duration-300">
            <div className="container mx-auto px-4 py-8">
                <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">แจ้งซ่อม / บำรุงรักษา</h1>
                        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Maintenance Request & Logs</p>
                    </div>
                    <div className="flex gap-2">
                        <Link to="/maintenance/stats" className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg shadow transition flex items-center gap-2">
                            <i className="fa-solid fa-chart-pie"></i> สถิติ
                        </Link>
                        <Link to="/maintenance/add" className="bg-blue-600 hover:bg-blue-700 dark:bg-green-600 dark:hover:bg-green-700 text-white px-4 py-2 rounded-lg shadow transition flex items-center gap-2">
                            <i className="fa-solid fa-plus"></i> แจ้งซ่อมใหม่
                        </Link>
                    </div>
                </div>

                {/* Filters & Export */}
                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 mb-6 flex flex-wrap gap-4 items-center justify-between">
                    <div className="flex gap-4">
                        <select
                            className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-green-500"
                            value={filterDeviceType}
                            onChange={(e) => setFilterDeviceType(e.target.value)}
                        >
                            <option value="">All Devices</option>
                            <option value="Laptop">Laptop</option>
                            <option value="PC">PC</option>
                            <option value="Printer">Printer</option>
                        </select>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={exportToExcel} className="text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 bg-green-50 dark:bg-green-900/20 px-3 py-1.5 rounded border border-green-200 dark:border-green-800/30 transition text-sm font-medium">
                            <i className="fa-solid fa-file-excel mr-1"></i> Excel
                        </button>
                        <button onClick={exportToPDF} className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 bg-red-50 dark:bg-red-900/20 px-3 py-1.5 rounded border border-red-200 dark:border-red-800/30 transition text-sm font-medium">
                            <i className="fa-solid fa-file-pdf mr-1"></i> PDF
                        </button>
                    </div>
                </div>

                {/* Maintenance List */}
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md overflow-hidden border border-gray-200 dark:border-slate-700">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gray-50 dark:bg-slate-700 border-b border-gray-200 dark:border-slate-600">
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-200 uppercase tracking-wider">Date</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-200 uppercase tracking-wider">Reporter</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-200 uppercase tracking-wider">Device</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-200 uppercase tracking-wider">Issue</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-200 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 dark:text-gray-200 uppercase tracking-wider">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                                {logs.filter(log => !filterDeviceType || (log.Asset && log.Asset.type === filterDeviceType)).map((log) => (
                                    <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-white whitespace-nowrap">
                                            {new Date(log.log_date).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-medium text-gray-900 dark:text-white">{log.reporter_name}</div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400">{log.department}</div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                                            {log.Asset ? (
                                                <div>
                                                    <span className="font-semibold block">{log.Asset.asset_code}</span>
                                                    <span className="text-xs text-gray-500 dark:text-gray-400">{log.Asset.name}</span>
                                                </div>
                                            ) : (
                                                <span className="text-gray-400 italic">No Asset</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300 max-w-xs truncate" title={log.description}>
                                            {log.description}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span
                                                onClick={() => handleUpdateStatus(log.id, log.status)}
                                                className={`cursor-pointer px-3 py-1 rounded-full text-xs font-bold capitalize inline-block text-center min-w-[100px]
                                                ${log.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
                                                        log.status === 'in_progress' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' :
                                                            'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'}`}
                                            >
                                                {log.status === 'pending' ? 'รอดำเนินการ' : log.status === 'in_progress' ? 'กำลังซ่อม' : 'เสร็จสิ้น'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right space-x-2">
                                            <button
                                                onClick={() => handleDelete(log.id)}
                                                className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition"
                                                title="Delete"
                                            >
                                                <i className="fa-solid fa-trash-can"></i>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {logs.length === 0 && (
                                    <tr>
                                        <td colSpan="6" className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                                            <i className="fa-solid fa-clipboard-list text-4xl mb-3 text-gray-300 dark:text-slate-600"></i>
                                            <p>ยังไม่มีรายการแจ้งซ่อม</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Maintenance;
