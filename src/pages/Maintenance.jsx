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

        // Request Notification Permission
        if ('Notification' in window && Notification.permission !== 'granted') {
            Notification.requestPermission();
        }

        // Poll for new logs every 3 seconds
        const interval = setInterval(async () => {
            try {
                const { data } = await getMaintenanceLogs();
                setLogs(prevLogs => {
                    // Check if there are new logs by comparing length or latest ID
                    if (data.length > prevLogs.length && prevLogs.length > 0) {
                        // Find new logs
                        const newItems = data.filter(item => !prevLogs.some(prev => prev.id === item.id));
                        newItems.forEach(item => {
                            if (item.status === 'pending') {
                                // Trigger Notification
                                if (Notification.permission === 'granted') {
                                    new Notification(`มีการแจ้งซ่อมใหม่! (${item.asset_code})`, {
                                        body: `${item.description}\nโดย: ${item.reporter_name}`,
                                        icon: '/vite.svg' // Optional icon
                                    });
                                }
                                // Play sound
                                const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3'); // Simple beep
                                audio.play().catch(e => console.log('Audio play failed', e));

                                // Fire Swal toast
                                Swal.fire({
                                    title: 'มีรายการแจ้งซ่อมใหม่!',
                                    text: `${item.asset_code}: ${item.description}`,
                                    icon: 'info',
                                    toast: true,
                                    position: 'top-end',
                                    showConfirmButton: false,
                                    timer: 5000
                                });
                            }
                        });
                    }
                    return data;
                });
            } catch (error) {
                console.error('Polling error', error);
            }
        }, 3000);

        return () => clearInterval(interval);
    }, []);

    const handleStartRepair = async (id) => {
        // Get current user from localStorage
        const userStr = localStorage.getItem('user');
        const user = userStr ? JSON.parse(userStr) : null;
        const technicianName = user ? (user.fullname || user.username) : 'Unknown';

        const result = await Swal.fire({
            title: 'เริ่มการซ่อม',
            html: `
                <div class="text-left">
                    <p class="mb-4">ยืนยันการเริ่มงานซ่อมโดย: <strong>${technicianName}</strong></p>
                    <label class="block text-gray-700 text-sm font-bold mb-2">วิธีการซ่อม *</label>
                    <div class="flex gap-4">
                        <label class="flex items-center gap-2 cursor-pointer">
                            <input type="radio" name="swal_repair_method" value="internal" checked class="w-4 h-4 text-blue-600">
                            <span>ซ่อมเอง</span>
                        </label>
                        <label class="flex items-center gap-2 cursor-pointer">
                            <input type="radio" name="swal_repair_method" value="external" class="w-4 h-4 text-red-600">
                            <span>ส่งซ่อม</span>
                        </label>
                    </div>
                </div>
            `,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#3B82F6', // Blue
            cancelButtonColor: '#d33',
            confirmButtonText: 'ยืนยัน (เริ่มซ่อม)',
            cancelButtonText: 'ยกเลิก',
            preConfirm: () => {
                const internal = document.querySelector('input[name="swal_repair_method"][value="internal"]').checked;
                return internal ? 'internal' : 'external';
            }
        });

        if (result.isConfirmed) {
            try {
                await updateMaintenanceLog(id, {
                    status: 'in_progress',
                    technician_name: technicianName,
                    repair_method: result.value,
                    started_at: new Date().toISOString()
                });
                fetchLogs();
                Swal.fire('เริ่มการซ่อม', `บันทึกข้อมูลโดย ${technicianName} เรียบร้อยแล้ว`, 'success');
            } catch (error) {
                Swal.fire('ข้อผิดพลาด', 'ไม่สามารถบันทึกข้อมูลได้', 'error');
            }
        }
    };

    const handleCompleteRepair = async (log) => {
        const result = await Swal.fire({
            title: 'ปิดงานซ่อม',
            html: `
                <p class="mb-2">กรุณาลงชื่อและเซ็นชื่อเพื่อยืนยัน</p>
                <div class="text-left mb-4 px-4">
                    <label class="block text-gray-700 text-sm font-bold mb-2">ชื่อผู้แจ้งซ่อม (Signer Name)</label>
                    <input id="swal-signer-name" type="text" class="swal2-input m-0 w-full" placeholder="ระบุชื่อผู้แจ้งซ่อม">
                </div>
                <div class="border rounded p-2 bg-white flex justify-center mx-4">
                    <canvas id="signature-pad" width="350" height="180" class="border border-gray-300 bg-gray-50 touch-none"></canvas>
                </div>
                <div class="mt-2 text-right px-4">
                    <button id="clear-signature" class="text-sm text-red-500 hover:text-red-700 underline">ลบ/เซ็นใหม่</button>
                </div>
            `,
            didOpen: () => {
                const canvas = document.getElementById('signature-pad');
                const clearBtn = document.getElementById('clear-signature');
                if (!canvas) return;

                const ctx = canvas.getContext('2d');
                let painting = false;

                const startPosition = (e) => {
                    painting = true;
                    draw(e);
                };
                const finishPosition = () => {
                    painting = false;
                    ctx.beginPath();
                };
                const getPos = (e) => {
                    const rect = canvas.getBoundingClientRect();
                    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
                    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
                    return {
                        x: clientX - rect.left,
                        y: clientY - rect.top
                    };
                };
                const draw = (e) => {
                    if (!painting) return;
                    e.preventDefault(); // Prevent scrolling on touch
                    const { x, y } = getPos(e);
                    ctx.lineWidth = 3;
                    ctx.lineCap = 'round';
                    ctx.lineTo(x, y);
                    ctx.stroke();
                    ctx.beginPath();
                    ctx.moveTo(x, y);
                };

                // Mouse events
                canvas.addEventListener('mousedown', startPosition);
                canvas.addEventListener('mouseup', finishPosition);
                canvas.addEventListener('mousemove', draw);
                canvas.addEventListener('mouseleave', finishPosition);

                // Touch events
                canvas.addEventListener('touchstart', startPosition);
                canvas.addEventListener('touchend', finishPosition);
                canvas.addEventListener('touchmove', draw);

                // Clear button
                clearBtn.addEventListener('click', () => {
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                });
            },
            icon: 'info',
            showCancelButton: true,
            confirmButtonColor: '#10B981', // Green
            cancelButtonColor: '#d33',
            confirmButtonText: 'ยืนยัน (ปิดงาน)',
            cancelButtonText: 'ยกเลิก',
            preConfirm: () => {
                const canvas = document.getElementById('signature-pad');
                const signerName = document.getElementById('swal-signer-name').value;
                if (!signerName) {
                    Swal.showValidationMessage('กรุณาระบุชื่อผู้แจ้งซ่อม');
                    return false;
                }
                return {
                    signature: canvas.toDataURL(),
                    signerName: signerName
                };
            }
        });

        if (result.isConfirmed) {
            try {
                const now = new Date();
                const completedAt = now.toISOString();

                await updateMaintenanceLog(log.id, {
                    status: 'completed',
                    completed_at: completedAt,
                    signature: result.value.signature, // Base64 signature
                    signer_name: result.value.signerName
                });

                // Calculate for prompt
                const durationText = calculateDuration(log.started_at, completedAt);

                fetchLogs();
                Swal.fire('ปิดงานสำเร็จ', `บันทึกข้อมูลและลายเซ็นเรียบร้อยแล้ว\nใช้เวลาซ่อมรวม: ${durationText}`, 'success');
            } catch (error) {
                Swal.fire('ข้อผิดพลาด', 'ไม่สามารถปิดงานได้', 'error');
            }
        }
    };

    const handleEdit = async (log) => {
        const result = await Swal.fire({
            title: 'แก้ไขข้อมูลการซ่อม',
            html: `
                <div class="text-left">
                    <label class="block text-gray-700 text-sm font-bold mb-2">วิธีการซ่อม</label>
                    <div class="flex gap-4 mb-4">
                        <label class="flex items-center gap-2 cursor-pointer">
                            <input type="radio" name="swal_edit_method" value="internal" ${log.repair_method !== 'external' ? 'checked' : ''} class="w-4 h-4 text-blue-600">
                            <span>ซ่อมเอง</span>
                        </label>
                        <label class="flex items-center gap-2 cursor-pointer">
                            <input type="radio" name="swal_edit_method" value="external" ${log.repair_method === 'external' ? 'checked' : ''} class="w-4 h-4 text-red-600">
                            <span>ส่งซ่อม</span>
                        </label>
                    </div>
                    <label class="block text-gray-700 text-sm font-bold mb-2">ค่าใช้จ่าย (บาท)</label>
                    <input id="swal-edit-cost" type="number" class="swal2-input m-0 w-full" placeholder="0.00" value="${log.cost || 0}">
                </div>
            `,
            icon: 'info',
            showCancelButton: true,
            confirmButtonColor: '#F59E0B', // Amber/Yellow
            cancelButtonColor: '#d33',
            confirmButtonText: 'บันทึกแก้ไข',
            cancelButtonText: 'ยกเลิก',
            preConfirm: () => {
                const internal = document.querySelector('input[name="swal_edit_method"][value="internal"]').checked;
                const cost = document.getElementById('swal-edit-cost').value;
                return {
                    repair_method: internal ? 'internal' : 'external',
                    cost: cost ? cost : 0
                };
            }
        });

        if (result.isConfirmed) {
            try {
                await updateMaintenanceLog(log.id, result.value);
                fetchLogs();
                Swal.fire('แก้ไขสำเร็จ', 'บันทึกข้อมูลเรียบร้อยแล้ว', 'success');
            } catch (error) {
                Swal.fire('ข้อผิดพลาด', 'ไม่สามารถแก้ไขข้อมูลได้', 'error');
            }
        }
    };

    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: 'ยืนยันการลบ?',
            text: "คุณจะไม่สามารถกู้คืนข้อมูลนี้ได้!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'ลบรายการ',
            cancelButtonText: 'ยกเลิก'
        });

        if (result.isConfirmed) {
            try {
                await deleteMaintenanceLog(id);
                fetchLogs();
                Swal.fire('ลบเสร็จสิ้น', 'ลบรายการแจ้งซ่อมเรียบร้อยแล้ว', 'success');
            } catch (error) {
                Swal.fire('ข้อผิดพลาด', 'ไม่สามารถลบรายการได้', 'error');
            }
        }
    };

    const calculateDuration = (start, end) => {
        if (!start || !end) return '-';
        const diffMs = new Date(end) - new Date(start);
        if (diffMs < 0) return '-';

        const diffMins = Math.floor(diffMs / 60000);
        const hours = Math.floor(diffMins / 60);
        const minutes = diffMins % 60;

        const decimalHours = (diffMins / 60).toFixed(2);

        if (hours > 0) {
            return `${hours} ชม. ${minutes} นาที (${decimalHours} ชม.)`;
        }
        return `${minutes} นาที (${decimalHours} ชม.)`;
    };

    const handleExportExcel = () => {
        const worksheet = XLSX.utils.json_to_sheet(logs.map(log => ({
            Date: new Date(log.log_date).toLocaleDateString(),
            Status: log.status,
            AssetCode: log.asset_code,
            AssetName: log.asset_name,
            Description: log.description,
            Reporter: log.reporter_name,
            Department: log.department,
            Technician: log.technician_name,
            RepairMethod: log.repair_method === 'external' ? 'ส่งซ่อม' : 'ซ่อมเอง',
            Cost: log.cost || 0,

            StartedAt: log.started_at ? new Date(log.started_at).toLocaleString() : '-',
            CompletedAt: log.completed_at ? new Date(log.completed_at).toLocaleString() : '-',
            Duration: calculateDuration(log.started_at, log.completed_at)
        })));
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Maintenance Logs");
        XLSX.writeFile(workbook, "Maintenance_Report.xlsx");
    };

    const handleExportPDF = async () => {
        const doc = new jsPDF();

        try {
            await loadThaiFont(doc);
            doc.setFont('Sarabun'); // Set font after loading
        } catch (e) {
            console.error("Could not load Thai font, falling back", e);
        }

        doc.text("รายการแจ้งซ่อม (Maintenance Report)", 20, 10);

        const tableColumn = ["Date", "Status", "Asset", "Description", "Reporter", "Technician", "Method", "Cost", "Duration"];
        const tableRows = [];

        logs.forEach(log => {
            const maintenanceData = [
                new Date(log.log_date).toLocaleDateString(),
                log.status,
                log.asset_code,
                log.description,
                log.reporter_name || '-',
                log.technician_name || '-',
                log.repair_method === 'external' ? 'ส่งซ่อม' : 'ซ่อมเอง',
                log.cost || 0,
                calculateDuration(log.started_at, log.completed_at)
            ];
            tableRows.push(maintenanceData);
        });

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 20,
            styles: { font: 'Sarabun', fontSize: 10 }, // Use Sarabun
        });
        doc.save("Maintenance_Report.pdf");
    };

    const toBase64 = (url) => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);
                resolve(canvas.toDataURL('image/png'));
            };
            img.onerror = reject;
            img.src = url;
        });
    };

    const handleExportIndividualPDF = async (log) => {
        const doc = new jsPDF();
        try {
            await loadThaiFont(doc);
            doc.setFont('Sarabun');
        } catch (e) {
            console.error("Could not load Thai font", e);
        }

        // Header
        doc.setFontSize(18);
        doc.text("ใบแจ้งซ่อม / Job Card", 105, 20, { align: 'center' });

        doc.setFontSize(12);
        doc.text(`JOB NO.: ${log.id}`, 20, 35);
        doc.text(`วันที่แจ้ง: ${new Date(log.log_date).toLocaleDateString()}`, 140, 35);

        // Details
        const details = [
            ['ทรัพย์สิน', `${log.asset_code} - ${log.asset_name}`],
            ['อาการเสีย', log.description],
            ['ผู้แจ้ง', `${log.reporter_name} (${log.department || '-'})`],
            ['เบอร์ติดต่อ', log.contact_info || '-'],
            ['ผู้ดำเนินการ', log.technician_name || '-'],
            ['สถานะ', log.status],
            ['วิธีการซ่อม', log.repair_method === 'external' ? 'ส่งซ่อม' : 'ซ่อมเอง'],
            ['ค่าใช้จ่าย', log.cost ? `${Number(log.cost).toLocaleString()} บาท` : '-'],
            ['เริ่มดำเนินการ', log.started_at ? new Date(log.started_at).toLocaleString() : '-'],
            ['เสร็จสิ้น', log.completed_at ? new Date(log.completed_at).toLocaleString() : '-'],
            ['อีเมล', log.email || '-'],
            ['เมลล์ใช้กับ', `${log.is_pc === 1 ? '[✓] PC ' : ''}${log.is_mobile === 1 ? '[✓] Phone/Tablet' : ''}${!log.is_pc && !log.is_mobile ? '-' : ''}`],
            ['ระยะเวลา', calculateDuration(log.started_at, log.completed_at)]
        ];

        autoTable(doc, {
            startY: 45,
            body: details,
            theme: 'grid',
            styles: { font: 'Sarabun', fontSize: 12 },
            columnStyles: { 0: { fontStyle: 'normal', cellWidth: 50 } }
        });

        // Signature
        if (log.signature) {
            const finalY = doc.lastAutoTable.finalY + 10;
            doc.text("ลายเซ็นผู้แจ้งซ่อม:", 20, finalY);
            try {
                let sigData = log.signature;
                if (sigData.startsWith('http')) {
                    sigData = await toBase64(sigData);
                }
                doc.addImage(sigData, 'PNG', 20, finalY + 5, 50, 25);
                if (log.signer_name) {
                    doc.text(`(${log.signer_name})`, 20, finalY + 35);
                }
            } catch (err) {
                console.error("Error adding signature image", err);
                doc.text("(Error loading signature)", 20, finalY + 10);
            }
        }

        doc.save(`JobCard_${log.id}.pdf`);
    };

    const getStatusBadge = (log) => {
        if (log.status === 'completed') {
            return <span className="px-2 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800">เสร็จสิ้น</span>;
        } else if (log.status === 'in_progress') {
            return <span className="px-2 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 animate-pulse">กำลังซ่อม</span>;
        } else {
            return <span className="px-2 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-800">รอซ่อม</span>;
        }
    };

    return (
        <div className="">
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800">รายการแจ้งซ่อม (Maintenance)</h1>
                <div className="flex flex-wrap gap-2 justify-center">
                    <Link to="/maintenance/stats" className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-lg shadow transition flex items-center gap-2 text-sm">
                        <i className="fa-solid fa-chart-line"></i> <span className="hidden sm:inline">สถิติ</span>
                    </Link>
                    <button onClick={handleExportExcel} className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg shadow transition flex items-center gap-2 text-sm">
                        <i className="fa-solid fa-file-excel"></i> <span className="hidden sm:inline">Excel</span>
                    </button>
                    <button onClick={handleExportPDF} className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg shadow transition flex items-center gap-2 text-sm">
                        <i className="fa-solid fa-file-pdf"></i> <span className="hidden sm:inline">PDF</span>
                    </button>
                    <Link to="/maintenance/add" className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg shadow transition text-sm">
                        + แจ้งซ่อม
                    </Link>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-lg shadow mb-6 flex flex-wrap gap-4">
                <select
                    className="border p-2 rounded w-full md:w-auto"
                    value={filterDeviceType}
                    onChange={(e) => setFilterDeviceType(e.target.value)}
                >
                    <option value="">ทุกประเภทอุปกรณ์</option>
                    <option value="Laptop">Laptop</option>
                    <option value="PC">PC</option>
                    <option value="Monitor">Monitor</option>
                    <option value="Accessory">Accessory</option>
                </select>
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block bg-white rounded-lg shadow overflow-x-auto">
                <table className="min-w-full leading-normal">
                    <thead>
                        <tr>
                            <th className="px-3 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">วันที่</th>
                            <th className="px-3 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">รายละเอียด</th>
                            <th className="px-3 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">สถานะ</th>
                            <th className="px-3 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">ผู้แจ้ง / ติดต่อ</th>
                            <th className="px-3 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">สถานที่</th>
                            <th className="px-3 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">ผู้ซ่อม</th>
                            <th className="px-3 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">วิธีการ/ค่าใช้จ่าย</th>
                            <th className="px-3 py-3 border-b-2 border-gray-200 bg-gray-100 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">จัดการ</th>
                        </tr>
                    </thead>
                    <tbody>
                        {logs.length === 0 ? (
                            <tr>
                                <td colSpan="7" className="text-center py-4 text-gray-500">ไม่พบรายการแจ้งซ่อม</td>
                            </tr>
                        ) : (
                            logs.filter(log => !filterDeviceType || log.asset_type === filterDeviceType).map((log) => (
                                <tr key={log.id} className="hover:bg-gray-50">
                                    <td className="px-3 py-4 border-b border-gray-200 bg-white text-sm">
                                        <div className="font-bold">{new Date(log.log_date).toLocaleDateString()}</div>
                                        <div className="text-xs text-gray-500">{log.asset_code}</div>
                                    </td>
                                    <td className="px-3 py-4 border-b border-gray-200 bg-white text-sm">
                                        <div className="font-medium text-gray-900">{log.asset_name}</div>
                                        <div className="text-gray-500 text-xs">{log.description}</div>
                                    </td>
                                    <td className="px-3 py-4 border-b border-gray-200 bg-white text-sm">
                                        {getStatusBadge(log)}
                                    </td>
                                    <td className="px-3 py-4 border-b border-gray-200 bg-white text-sm">
                                        <div className="font-medium">{log.reporter_name}</div>
                                        <div className="text-xs text-blue-600">{log.contact_info || '-'}</div>
                                    </td>
                                    <td className="px-3 py-4 border-b border-gray-200 bg-white text-sm">
                                        <div className="text-xs">{log.location || '-'}</div>
                                    </td>
                                    <td className="px-3 py-4 border-b border-gray-200 bg-white text-sm">
                                        <div className="text-xs font-medium text-blue-600 italic">{log.technician_name || '-'}</div>
                                    </td>
                                    <td className="px-3 py-4 border-b border-gray-200 bg-white text-sm">
                                        <div className="text-xs">
                                            {log.repair_method === 'external' ? <span className="text-red-600">ส่งซ่อม</span> :
                                                log.repair_method === 'internal' ? <span className="text-blue-600">ซ่อมเอง</span> : '-'}
                                        </div>
                                        <div className="text-xs font-bold">{log.cost ? `${Number(log.cost).toLocaleString()} ฿` : '-'}</div>
                                    </td>
                                    <td className="px-3 py-4 border-b border-gray-200 bg-white text-sm text-right">
                                        <div className="flex justify-end gap-2">
                                            {log.status === 'pending' && (
                                                <button onClick={() => handleStartRepair(log.id)} className="text-blue-600 bg-blue-50 p-2 rounded-full hover:bg-blue-100" title="Start">
                                                    <i className="fa-solid fa-wrench"></i>
                                                </button>
                                            )}
                                            {log.status === 'in_progress' && (
                                                <button onClick={() => handleCompleteRepair(log)} className="text-green-600 bg-green-50 p-2 rounded-full hover:bg-green-100" title="Complete">
                                                    <i className="fa-solid fa-check"></i>
                                                </button>
                                            )}
                                            <button onClick={() => handleEdit(log)} className="text-amber-600 bg-amber-50 p-2 rounded-full hover:bg-amber-100" title="Edit">
                                                <i className="fa-solid fa-pen"></i>
                                            </button>
                                            <button onClick={() => handleExportIndividualPDF(log)} className="text-gray-600 bg-gray-50 p-2 rounded-full hover:bg-gray-100" title="Print">
                                                <i className="fa-solid fa-print"></i>
                                            </button>
                                            <button onClick={() => handleDelete(log.id)} className="text-red-600 bg-red-50 p-2 rounded-full hover:bg-red-100" title="Delete">
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

            {/* Mobile Card View */}
            <div className="md:hidden space-y-4">
                {logs.length === 0 ? (
                    <div className="text-center py-4 text-gray-500 bg-white rounded shadow">ไม่พบรายการแจ้งซ่อม</div>
                ) : (
                    logs.filter(log => !filterDeviceType || log.asset_type === filterDeviceType).map((log) => (
                        <div key={log.id} className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <div className="font-bold text-gray-800">{new Date(log.log_date).toLocaleDateString()}</div>
                                    <div className="text-xs text-gray-500">{log.asset_code}</div>
                                </div>
                                <div>{getStatusBadge(log)}</div>
                            </div>
                            <div className="mb-2">
                                <h3 className="font-medium text-gray-900">{log.asset_name}</h3>
                                <p className="text-sm text-gray-600">{log.description}</p>
                            </div>
                            <div className="text-xs text-gray-500 mb-2">
                                <div>ผู้แจ้ง: {log.reporter_name} ({log.contact_info || '-'})</div>
                                <div>สถานที่: {log.location || '-'}</div>
                                <div>ช่าง: {log.technician_name || '-'}</div>
                            </div>
                            <div className="flex justify-between items-center bg-gray-50 p-2 rounded mb-3 text-sm">
                                <div>
                                    {log.repair_method === 'external' ? <span className="text-red-600 font-bold">ส่งซ่อม</span> :
                                        log.repair_method === 'internal' ? <span className="text-blue-600 font-bold">ซ่อมเอง</span> : '-'}
                                </div>
                                <div className="font-bold">{log.cost ? `${Number(log.cost).toLocaleString()} ฿` : '-'}</div>
                            </div>
                            <div className="flex justify-end gap-3 pt-2 border-t mt-2">
                                {log.status === 'pending' && (
                                    <button onClick={() => handleStartRepair(log.id)} className="text-blue-600 bg-blue-50 p-2 rounded-full" title="Start">
                                        <i className="fa-solid fa-wrench"></i>
                                    </button>
                                )}
                                {log.status === 'in_progress' && (
                                    <button onClick={() => handleCompleteRepair(log)} className="text-green-600 bg-green-50 p-2 rounded-full" title="Complete">
                                        <i className="fa-solid fa-check"></i>
                                    </button>
                                )}
                                <button onClick={() => handleEdit(log)} className="text-amber-600 bg-amber-50 p-2 rounded-full" title="Edit">
                                    <i className="fa-solid fa-pen"></i>
                                </button>
                                <button onClick={() => handleExportIndividualPDF(log)} className="text-gray-600 bg-gray-50 p-2 rounded-full" title="Print">
                                    <i className="fa-solid fa-print"></i>
                                </button>
                                <button onClick={() => handleDelete(log.id)} className="text-red-600 bg-red-50 p-2 rounded-full" title="Delete">
                                    <i className="fa-solid fa-trash"></i>
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default Maintenance;
