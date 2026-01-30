import React, { useState, useEffect, useRef } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { useNavigate, useParams } from 'react-router-dom';
import { createAsset, getAsset, updateAsset, getMaintenanceLogs } from '../api';
import Swal from 'sweetalert2';

const AssetForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEditMode = !!id;

    const [formData, setFormData] = useState({
        asset_code: '',
        name: '',
        type: 'Laptop',
        brand: '',
        model: '',
        serial_number: '',
        purchase_date: '',
        price: '',
        status: 'available',
        location: '',
        notes: '',
        spec: '',
        received_date: '',
        return_date: '',
        email: '',
        is_pc: 0,
        is_mobile: 0,
        software: '{}' // JSON string of installed software
    });
    const [image, setImage] = useState(null);
    const [preview, setPreview] = useState(null);
    const [maintenanceLogs, setMaintenanceLogs] = useState([]);

    useEffect(() => {
        if (isEditMode) {
            const fetchAsset = async () => {
                try {
                    const { data } = await getAsset(id);
                    // Format date for input
                    const formattedData = {
                        ...data,
                        purchase_date: data.purchase_date ? data.purchase_date.split('T')[0] : '',
                        received_date: data.received_date ? data.received_date.split('T')[0] : '',
                        return_date: data.return_date ? data.return_date.split('T')[0] : '',
                        is_pc: data.is_pc || 0,
                        is_mobile: data.is_mobile || 0
                    };
                    setFormData(formattedData);
                    if (data.image_path) {
                        const baseURL = import.meta.env.MODE === 'production' ? '' : 'http://localhost:3000';
                        setPreview(baseURL + data.image_path);
                    }
                    if (data.signature && sigPad.current) {
                        sigPad.current.fromDataURL(data.signature);
                    }
                } catch (error) {
                    Swal.fire('Error', 'Failed to fetch asset details', 'error');
                    navigate('/');
                }
            };
            fetchAsset();
            fetchHistory();
        }
    }, [id, isEditMode, navigate]);

    const fetchHistory = async () => {
        try {
            const { data } = await getMaintenanceLogs({ asset_id: id });
            setMaintenanceLogs(data);
        } catch (error) {
            console.error("Failed to fetch history", error);
        }
    };

    const sigPad = useRef(null);
    const printRef = useRef();
    const clearSignature = () => {
        if (sigPad.current) {
            sigPad.current.clear();
        }
        setFormData(prev => ({ ...prev, signature: '' }));
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? (checked ? 1 : 0) : value
        }));
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImage(file);
            setPreview(URL.createObjectURL(file));
        }
    };

    const softwareList = [
        "Windows 10", "Windows 11", "MS-Office", "Adobe Acrobat", "WinRAR", "ERP",
        "Photo Shop", "illustrator", "AutoCAD", "Canva", "Capcut", "Line PC",
        "MS-Team", "Zoom", "Chrome", "MS-Edge", "Google Drive", "AnyDesk",
        "Fire Fox", "Google Sheets", "Google Docs", "FastStone Capture", "Nitro", "PhotoScape"
    ];

    const handleSoftwareChange = (item) => {
        const currentSoftware = JSON.parse(formData.software || '{}');
        const updatedSoftware = { ...currentSoftware, [item]: !currentSoftware[item] };
        setFormData(prev => ({ ...prev, software: JSON.stringify(updatedSoftware) }));
    };

    const handleExportPDF = async () => {
        try {
            console.log("Generating PDF with html2canvas...");
            if (!printRef.current) {
                Swal.fire('Error', 'Print template not found', 'error');
                return;
            }

            // Temporarily set width to 210mm in pixels (approx 794px at 96dpi) for consistent capture
            const canvas = await html2canvas(printRef.current, {
                scale: 2,
                useCORS: true,
                logging: false,
                windowWidth: 794
            });
            const imgData = canvas.toDataURL('image/png');

            const doc = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = doc.internal.pageSize.getWidth();

            // Calculate height to maintain aspect ratio
            const imgWidth = canvas.width;
            const imgHeight = canvas.height;
            const pdfImageHeight = (pdfWidth * imgHeight) / imgWidth;

            doc.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfImageHeight);
            doc.save(`Asset_Handover_${formData.asset_code || 'New'}.pdf`);
            console.log("PDF Generated Successfully");
        } catch (error) {
            console.error("PDF Generation Error:", error);
            Swal.fire('Error', 'Could not generate PDF. Please check console.', 'error');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Use FormData for file upload
        const data = new FormData();
        for (const key in formData) {
            // Convert null/undefined to empty string to avoid "null" string in backend
            const value = formData[key] === null || formData[key] === undefined ? '' : formData[key];
            data.append(key, value);
        }

        // Append signature
        if (sigPad.current && !sigPad.current.isEmpty()) {
            data.append('signature', sigPad.current.toDataURL());
        } else if (isEditMode && formData.signature) {
            // If not edited/cleared, keep existing? 
            // Actually, backend update logic we wrote updates signature=? 
            // If user didn't touch pad, isEmpty() is true.
            // If we loaded signature via fromDataURL, isEmpty() is false? Check react-signature-canvas docs.
            // fromDataURL makes isEmpty() false. 
            // BUT if backend sends signature, we loaded it.
            // If we don't re-send, backend might overwrite with null?
            // Best to just always send current pad state.
            // Wait, if isEmpty() is true, maybe they cleared it?
            // If I clear, isEmpty is true.
            // So relying on pad state is correct.
            data.append('signature', ''); // If empty, clear it? Or ignore?
        }
        if (image) {
            data.append('image', image);
        }

        try {
            if (isEditMode) {
                await updateAsset(id, data);
                Swal.fire('สำเร็จ', 'บันทึกการแก้ไขเรียบร้อยแล้ว', 'success');
            } else {
                await createAsset(data);
                Swal.fire('สำเร็จ', 'เพิ่มทรัพย์สินใหม่เรียบร้อยแล้ว', 'success');
            }
            navigate('/');
        } catch (error) {
            console.error(error);
            const msg = error.response?.data?.error || error.response?.data?.details || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล';
            Swal.fire('ข้อผิดพลาด', msg, 'error');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="container mx-auto px-4 py-8">
                <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-2xl md:text-3xl font-extrabold mb-6 text-gray-800 border-b pb-4 flex items-center gap-3">
                        <i className={`fa-solid ${isEditMode ? 'fa-pen-to-square text-blue-600' : 'fa-plus-circle text-green-600'}`}></i>
                        {isEditMode ? 'ข้อมูลทรัพย์สิน' : 'เพิ่มทรัพย์สินใหม่'}
                    </h2>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Image Upload Section */}
                        <div className="flex flex-col items-center mb-6">
                            <div className="w-32 h-32 mb-4 bg-gray-200 rounded-lg overflow-hidden flex items-center justify-center border-2 border-dashed border-gray-400">
                                {preview ? (
                                    <img src={preview} alt="Asset Preview" className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-gray-500 text-sm">ไม่มีรูปภาพ</span>
                                )}
                            </div>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                                className="text-sm text-gray-500
                                file:mr-4 file:py-2 file:px-4
                                file:rounded-full file:border-0
                                file:text-sm file:font-semibold
                                file:bg-blue-50 file:text-blue-700
                                hover:file:bg-blue-100"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-gray-700 text-sm font-bold mb-2">รหัสทรัพย์สิน *</label>
                                <input
                                    required
                                    type="text"
                                    name="asset_code"
                                    value={formData.asset_code || ''}
                                    onChange={handleChange}
                                    className="w-full border p-3 md:p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 md:bg-white"
                                    placeholder="เช่น IT-2024-XXX"
                                />
                            </div>
                            <div>
                                <label className="block text-gray-700 text-sm font-bold mb-2">ชื่อทรัพย์สิน *</label>
                                <input
                                    required
                                    type="text"
                                    name="name"
                                    value={formData.name || ''}
                                    onChange={handleChange}
                                    className="w-full border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="เช่น MacBook Pro, Dell Monitor"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-gray-700 text-sm font-bold mb-2">ประเภท *</label>
                                <select
                                    name="type"
                                    value={formData.type || 'Laptop'}
                                    onChange={handleChange}
                                    className="w-full border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="Laptop">Laptop (โน้ตบุ๊ก)</option>
                                    <option value="PC">PC (คอมพิวเตอร์ตั้งโต๊ะ)</option>
                                    <option value="Monitor">Monitor (จอภาพ)</option>
                                    <option value="Server">Server</option>
                                    <option value="Accessory">Accessory (อุปกรณ์เสริม)</option>
                                    <option value="Software">Software (ซอฟต์แวร์)</option>
                                    <option value="Other">Other (อื่นๆ)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-gray-700 text-sm font-bold mb-2">สถานะ</label>
                                <select
                                    name="status"
                                    value={formData.status || 'available'}
                                    onChange={handleChange}
                                    className="w-full border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="available">ว่าง (Available)</option>
                                    <option value="assigned">ใช้งานอยู่ (Assigned)</option>
                                    <option value="repair">ส่งซ่อม (Repair)</option>
                                    <option value="retired">ตัดจำหน่าย (Retired)</option>
                                    <option value="lost">สูญหาย (Lost)</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-gray-700 text-sm font-bold mb-2">ยี่ห้อ (Brand)</label>
                                <input
                                    type="text"
                                    name="brand"
                                    value={formData.brand || ''}
                                    onChange={handleChange}
                                    className="w-full border p-2 rounded"
                                />
                            </div>
                            <div>
                                <label className="block text-gray-700 text-sm font-bold mb-2">รุ่น (Model)</label>
                                <input
                                    type="text"
                                    name="model"
                                    value={formData.model || ''}
                                    onChange={handleChange}
                                    className="w-full border p-2 rounded"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-gray-700 text-sm font-bold mb-2">Serial Number</label>
                                <input
                                    type="text"
                                    name="serial_number"
                                    value={formData.serial_number || ''}
                                    onChange={handleChange}
                                    className="w-full border p-2 rounded"
                                />
                            </div>
                            <div>
                                <label className="block text-gray-700 text-sm font-bold mb-2">ราคา (บาท)</label>
                                <input
                                    type="number"
                                    name="price"
                                    value={formData.price || ''}
                                    onChange={handleChange}
                                    className="w-full border p-2 rounded"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-gray-700 text-sm font-bold mb-2">วันที่ซื้อ</label>
                                <input
                                    type="date"
                                    name="purchase_date"
                                    value={formData.purchase_date || ''}
                                    onChange={handleChange}
                                    className="w-full border p-2 rounded"
                                />
                            </div>
                            <div>
                                <label className="block text-gray-700 text-sm font-bold mb-2">สถานที่เก็บ / ใช้งาน</label>
                                <input
                                    type="text"
                                    name="location"
                                    value={formData.location || ''}
                                    onChange={handleChange}
                                    className="w-full border p-2 rounded"
                                    placeholder="เช่น แผนก IT, ห้อง Server"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-gray-700 text-sm font-bold mb-2">ผู้ใช้งาน / ผู้รับผิดชอบ (Assigned To)</label>
                                <input
                                    type="text"
                                    name="assigned_to"
                                    value={formData.assigned_to || ''}
                                    onChange={handleChange}
                                    className="w-full border p-3 md:p-2 rounded focus:ring-2 focus:ring-blue-500"
                                    placeholder="ระบุชื่อผู้ใช้งาน"
                                />
                            </div>
                            <div>
                                <label className="block text-gray-700 text-sm font-bold mb-2">อีเมล (Email)</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email || ''}
                                    onChange={handleChange}
                                    className="w-full border p-3 md:p-2 rounded focus:ring-2 focus:ring-blue-500"
                                    placeholder="example@email.com"
                                />
                            </div>
                        </div>

                        <div className="bg-blue-50 p-4 rounded-lg flex flex-wrap gap-6 items-center border border-blue-100">
                            <label className="text-sm font-bold text-blue-800">เมลย์ที่ผูกกับเครื่อง:</label>
                            <label className="flex items-center gap-3 cursor-pointer group">
                                <input
                                    type="checkbox"
                                    name="is_pc"
                                    checked={formData.is_pc === 1}
                                    onChange={handleChange}
                                    className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                                />
                                <span className="text-gray-700 font-medium group-hover:text-blue-600 transition-colors">PC</span>
                            </label>
                            <label className="flex items-center gap-3 cursor-pointer group">
                                <input
                                    type="checkbox"
                                    name="is_mobile"
                                    checked={formData.is_mobile === 1}
                                    onChange={handleChange}
                                    className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                                />
                                <span className="text-gray-700 font-medium group-hover:text-blue-600 transition-colors">Phone / Tablet</span>
                            </label>
                        </div>

                        <div>
                            <label className="block text-gray-700 text-sm font-bold mb-2">ลายเซ็นผู้รับมอบ (Signature)</label>
                            <div className="border rounded-lg p-2 bg-gray-50 inline-block">
                                <SignatureCanvas
                                    ref={sigPad}
                                    penColor="black"
                                    canvasProps={{ width: 400, height: 150, className: 'sigCanvas border bg-white rounded' }}
                                />
                            </div>
                            <div className="mt-1">
                                <button type="button" onClick={clearSignature} className="text-red-500 text-sm underline">
                                    ลบ/เซ็นใหม่
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-gray-700 text-sm font-bold mb-2">สเปค / รายละเอียดเพิ่มเติม (Spec)</label>
                            <textarea
                                name="spec"
                                value={formData.spec || ''}
                                onChange={handleChange}
                                className="w-full border p-2 rounded h-20 mb-4"
                                placeholder="เช่น CPU i5, RAM 16GB, SSD 512GB"
                            ></textarea>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-gray-700 text-sm font-bold mb-2">วันที่รับเข้า (Received Date)</label>
                                <input
                                    type="date"
                                    name="received_date"
                                    value={formData.received_date || ''}
                                    onChange={handleChange}
                                    className="w-full border p-2 rounded"
                                />
                            </div>
                            <div>
                                <label className="block text-gray-700 text-sm font-bold mb-2">วันที่คืน (Return Date)</label>
                                <input
                                    type="date"
                                    name="return_date"
                                    value={formData.return_date || ''}
                                    onChange={handleChange}
                                    className="w-full border p-2 rounded"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-gray-700 text-sm font-bold mb-4">โปรแกรมที่ใช้งาน</label>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 bg-gray-50 p-4 rounded-lg border">
                                {softwareList.map(item => {
                                    const softwareObj = JSON.parse(formData.software || '{}');
                                    return (
                                        <label key={item} className="flex items-center gap-2 cursor-pointer hover:bg-white p-1 rounded transition">
                                            <input
                                                type="checkbox"
                                                checked={!!softwareObj[item]}
                                                onChange={() => handleSoftwareChange(item)}
                                                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                            />
                                            <span className="text-sm text-gray-700">{item}</span>
                                        </label>
                                    );
                                })}
                            </div>
                        </div>

                        <div>
                            <label className="block text-gray-700 text-sm font-bold mb-2">หมายเหตุ</label>
                            <textarea
                                name="notes"
                                value={formData.notes || ''}
                                onChange={handleChange}
                                className="w-full border p-2 rounded h-24"
                            ></textarea>
                        </div>

                        <div className="flex justify-end gap-3 pt-4">
                            {isEditMode && (
                                <button
                                    type="button"
                                    onClick={handleExportPDF}
                                    className="px-4 py-2 text-white bg-green-600 rounded hover:bg-green-700 transition font-bold"
                                >
                                    <i className="fa-solid fa-file-pdf mr-2"></i>
                                    Export PDF
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={() => navigate('/')}
                                className="px-4 py-2 text-gray-600 bg-gray-200 rounded hover:bg-gray-300 transition font-bold"
                            >
                                ยกเลิก
                            </button>
                            <button
                                type="submit"
                                className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition font-extrabold"
                            >
                                {isEditMode ? 'บันทึกการแก้ไข' : 'บันทึกข้อมูล'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Hidden Print Template */}
            <div style={{ position: 'absolute', top: -10000, left: -10000 }}>
                <div ref={printRef} className="w-[210mm] h-auto p-12 font-sans box-border relative" style={{ backgroundColor: '#ffffff', color: '#000000' }}>
                    {/* Header */}
                    <div className="text-center mb-8">
                        <h1 className="text-2xl font-bold mb-2">Asset Handover Form</h1>
                        <h2 className="text-xl">แบบฟอร์มส่งมอบทรัพย์สิน</h2>
                        <p className="mt-2" style={{ color: '#4b5563' }}>Date / วันที่: {new Date().toLocaleDateString('th-TH')}</p>
                    </div>

                    {/* Top Section: Image & Basic Info */}
                    <div className="flex gap-6 mb-8 items-start">
                        {preview ? (
                            <div className="w-40 h-40 flex-shrink-0 border rounded flex items-center justify-center overflow-hidden" style={{ borderColor: '#d1d5db', backgroundColor: '#f3f4f6' }}>
                                <img src={preview} alt="Asset" className="w-full h-full object-cover" />
                            </div>
                        ) : (
                            <div className="w-40 h-40 flex-shrink-0 border rounded flex items-center justify-center" style={{ borderColor: '#d1d5db', backgroundColor: '#f3f4f6', color: '#9ca3af' }}>
                                No Image
                            </div>
                        )}

                        <div className="flex-1 space-y-2">
                            <div className="grid grid-cols-2 gap-x-4">
                                <div><span className="font-bold">Code / รหัส:</span> {formData.asset_code}</div>
                                <div><span className="font-bold">Type / ประเภท:</span> {formData.type}</div>
                                <div><span className="font-bold">Brand / ยี่ห้อ:</span> {formData.brand}</div>
                                <div><span className="font-bold">Model / รุ่น:</span> {formData.model}</div>
                                <div className="col-span-2"><span className="font-bold">S/N:</span> {formData.serial_number}</div>
                            </div>
                        </div>
                    </div>

                    {/* Details Table */}
                    <table className="w-full border-collapse border mb-8 text-sm" style={{ borderColor: '#d1d5db' }}>
                        <tbody>
                            <tr style={{ backgroundColor: '#f3f4f6' }}>
                                <th className="border p-2 text-left w-1/3" style={{ borderColor: '#d1d5db' }}>Field / หัวข้อ</th>
                                <th className="border p-2 text-left" style={{ borderColor: '#d1d5db' }}>Detail / รายละเอียด</th>
                            </tr>
                            <tr>
                                <td className="border p-2 font-bold" style={{ borderColor: '#d1d5db' }}>Asset Name (ชื่อ)</td>
                                <td className="border p-2" style={{ borderColor: '#d1d5db' }}>{formData.name}</td>
                            </tr>
                            <tr>
                                <td className="border p-2 font-bold" style={{ borderColor: '#d1d5db' }}>Price (ราคา)</td>
                                <td className="border p-2" style={{ borderColor: '#d1d5db' }}>{formData.price ? Number(formData.price).toLocaleString() : '-'} THB</td>
                            </tr>
                            <tr>
                                <td className="border p-2 font-bold" style={{ borderColor: '#d1d5db' }}>Purchase Date (วันที่ซื้อ)</td>
                                <td className="border p-2" style={{ borderColor: '#d1d5db' }}>{formData.purchase_date}</td>
                            </tr>
                            <tr>
                                <td className="border p-2 font-bold" style={{ borderColor: '#d1d5db' }}>Location (สถานที่)</td>
                                <td className="border p-2" style={{ borderColor: '#d1d5db' }}>{formData.location}</td>
                            </tr>
                            <tr>
                                <td className="border p-2 font-bold" style={{ borderColor: '#d1d5db' }}>Spec (สเปค)</td>
                                <td className="border p-2 whitespace-pre-wrap" style={{ borderColor: '#d1d5db' }}>{formData.spec}</td>
                            </tr>
                            <tr>
                                <td className="border p-2 font-bold" style={{ borderColor: '#d1d5db' }}>Dates (รับ/คืน)</td>
                                <td className="border p-2" style={{ borderColor: '#d1d5db' }}>
                                    In: {formData.received_date} / Return: {formData.return_date}
                                </td>
                            </tr>
                            <tr>
                                <td className="border p-2 font-bold" style={{ borderColor: '#d1d5db' }}>Email (อีเมล)</td>
                                <td className="border p-2" style={{ borderColor: '#d1d5db' }}>{formData.email || '-'}</td>
                            </tr>
                            <tr>
                                <td className="border p-2 font-bold" style={{ borderColor: '#d1d5db' }}>Email used with (เมลล์ใช้กับ)</td>
                                <td className="border p-2" style={{ borderColor: '#d1d5db' }}>
                                    {formData.is_pc === 1 ? ' [✓] PC ' : ''}
                                    {formData.is_mobile === 1 ? ' [✓] Phone/Tablet ' : ''}
                                    {!formData.is_pc && !formData.is_mobile ? '-' : ''}
                                </td>
                            </tr>
                            <tr>
                                <td className="border p-2 font-bold" style={{ borderColor: '#d1d5db' }}>Status (สถานะ)</td>
                                <td className="border p-2 capitalize" style={{ borderColor: '#d1d5db' }}>{formData.status}</td>
                            </tr>
                            <tr>
                                <td className="border p-2 font-bold" style={{ borderColor: '#d1d5db' }}>Notes (หมายเหตุ)</td>
                                <td className="border p-2 whitespace-pre-wrap" style={{ borderColor: '#d1d5db' }}>{formData.notes}</td>
                            </tr>
                        </tbody>
                    </table>

                    {/* Software Checkboxes in PDF */}
                    <div className="mb-8">
                        <h3 className="font-bold mb-2 text-sm">Software Installed / โปรแกรมที่ใช้งาน:</h3>
                        <div className="grid grid-cols-4 gap-x-2 gap-y-1 text-[10px] border p-3 rounded" style={{ borderColor: '#d1d5db' }}>
                            {softwareList.map(item => {
                                const softwareObj = JSON.parse(formData.software || '{}');
                                return (
                                    <div key={item} className="flex items-center gap-1">
                                        <span className="inline-block w-3 h-3 border text-center leading-[10px]" style={{ borderColor: '#000' }}>
                                            {softwareObj[item] ? '✓' : ''}
                                        </span>
                                        <span>{item}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Signature Section */}
                    <div className="mt-12 border-t pt-8" style={{ borderColor: '#e5e7eb' }}>
                        <p className="font-bold mb-4">Examined & Received By / ผู้ตรวจสอบและรับมอบ</p>
                        <div className="flex items-end gap-4 mb-4">
                            <span>Name / ชื่อ:</span>
                            <span className="border-b flex-1 pb-1 px-2" style={{ borderColor: '#9ca3af' }}>{formData.assigned_to}</span>
                        </div>

                        <div className="mt-8 flex flex-col items-center w-64">
                            <div className="h-32 w-full border border-dashed flex items-center justify-center mb-2 overflow-hidden" style={{ borderColor: '#9ca3af' }}>
                                {formData.signature ? (
                                    <img src={formData.signature} alt="Signature" className="object-contain h-full w-full" />
                                ) : (sigPad.current && typeof sigPad.current.isEmpty === 'function' && !sigPad.current.isEmpty()) ? (
                                    <img src={sigPad.current.toDataURL()} alt="Current Sig" className="object-contain h-full w-full" />
                                ) : (
                                    <span className="text-sm" style={{ color: '#9ca3af' }}>Signature / ลายเซ็น</span>
                                )}
                            </div>
                            <div className="border-t w-full text-center py-1" style={{ borderColor: '#000000' }}>( Signed / ลงชื่อ )</div>
                        </div>
                    </div>
                </div>
            </div>


            {/* Maintenance History Section */}
            {
                isEditMode && (
                    <div className="max-w-6xl mx-auto mt-8 bg-white rounded-lg shadow-md p-6">
                        <h3 className="text-xl font-bold mb-4 text-gray-800 flex items-center">
                            <i className="fa-solid fa-clock-rotate-left mr-2 text-blue-600"></i>
                            ประวัติการซ่อมบำรุง
                        </h3>

                        {/* Desktop Table View */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="min-w-full leading-normal">
                                <thead>
                                    <tr>
                                        <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            วันที่
                                        </th>
                                        <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            ประเภท
                                        </th>
                                        <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            รายละเอียด
                                        </th>
                                        <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            สถานะ
                                        </th>
                                        <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            ค่าใช้จ่าย
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {maintenanceLogs.length === 0 ? (
                                        <tr>
                                            <td colSpan="5" className="text-center py-4 text-gray-500">ไม่พบประวัติการซ่อม</td>
                                        </tr>
                                    ) : (
                                        maintenanceLogs.map((log) => (
                                            <tr key={log.id}>
                                                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                                                    {new Date(log.created_at || log.log_date).toLocaleDateString('th-TH')}
                                                </td>
                                                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                                                    <span className={`px-2 py-1 rounded text-xs font-bold ${log.service_type === 'new_setup' ? 'text-purple-700 bg-purple-50' :
                                                        log.service_type === 'service' ? 'text-blue-700 bg-blue-50' : 'text-orange-700 bg-orange-50'
                                                        }`}>
                                                        {log.service_type === 'new_setup' ? 'ติดตั้งใหม่' : log.service_type === 'service' ? 'บริการ' : 'ซ่อม'}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                                                    <div className="max-w-xs truncate">{log.description}</div>
                                                </td>
                                                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${log.status === 'completed' ? 'bg-green-100 text-green-800' :
                                                        log.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                                                            'bg-gray-100 text-gray-800'
                                                        }`}>
                                                        {log.status === 'completed' ? 'เสร็จสิ้น' :
                                                            log.status === 'in_progress' ? 'กำลังดำเนินการ' : 'รอคิว'}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                                                    {log.cost ? `฿${Number(log.cost).toLocaleString()}` : '-'}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile Card View */}
                        <div className="md:hidden space-y-4">
                            {maintenanceLogs.length === 0 ? (
                                <div className="text-center py-4 text-gray-500">ไม่พบประวัติการซ่อม</div>
                            ) : (
                                maintenanceLogs.map((log) => (
                                    <div key={log.id} className="bg-gray-50 p-4 rounded-lg border border-gray-200 shadow-sm">
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="font-bold text-gray-800">
                                                {new Date(log.created_at || log.log_date).toLocaleDateString('th-TH')}
                                            </div>
                                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${log.status === 'completed' ? 'bg-green-100 text-green-800' :
                                                log.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-200 text-gray-800'}`}>
                                                {log.status === 'completed' ? 'เสร็จสิ้น' :
                                                    log.status === 'in_progress' ? 'กำลังดำเนินการ' : 'รอคิว'}
                                            </span>
                                        </div>
                                        <div className="mb-2">
                                            <span className={`inline-block px-2 py-1 rounded text-xs font-bold mb-1 ${log.service_type === 'new_setup' ? 'text-purple-700 bg-purple-50' :
                                                log.service_type === 'service' ? 'text-blue-700 bg-blue-50' : 'text-orange-700 bg-orange-50'}`}>
                                                {log.service_type === 'new_setup' ? 'ติดตั้งใหม่' : log.service_type === 'service' ? 'บริการ' : 'ซ่อม'}
                                            </span>
                                            <p className="text-sm text-gray-600">{log.description}</p>
                                        </div>
                                        <div className="text-right text-sm font-bold text-gray-700 border-t pt-2 mt-2">
                                            {log.cost ? `฿${Number(log.cost).toLocaleString()}` : 'ไม่มีค่าใช้จ่าย'}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default AssetForm;
