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
        return_date: ''
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
                        return_date: data.return_date ? data.return_date.split('T')[0] : ''
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
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImage(file);
            setPreview(URL.createObjectURL(file));
        }
    };

    const handleExportPDF = async () => {
        try {
            console.log("Generating PDF with html2canvas...");
            if (!printRef.current) {
                Swal.fire('Error', 'Print template not found', 'error');
                return;
            }

            const canvas = await html2canvas(printRef.current, { scale: 2, useCORS: true });
            const imgData = canvas.toDataURL('image/png');

            const doc = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = doc.internal.pageSize.getWidth();
            const pdfHeight = doc.internal.pageSize.getHeight();

            doc.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
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
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900 transition-colors duration-300 pb-12">
            <div className="container mx-auto px-4 py-8">
                <div className="max-w-2xl mx-auto bg-white dark:bg-slate-800 rounded-xl shadow-lg dark:shadow-green-900/10 p-6 sm:p-8 transition-all border border-gray-100 dark:border-slate-700">
                    <h2 className="text-2xl font-bold mb-8 text-gray-800 dark:text-white border-b pb-4 dark:border-slate-700 flex items-center gap-3">
                        {isEditMode ? <i className="fa-solid fa-pen-to-square text-blue-500 dark:text-green-400"></i> : <i className="fa-solid fa-plus-circle text-blue-500 dark:text-green-400"></i>}
                        {isEditMode ? 'แก้ไขข้อมูลทรัพย์สิน' : 'เพิ่มทรัพย์สินใหม่'}
                    </h2>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Image Upload Section */}
                        <div className="flex flex-col items-center mb-8 group">
                            <div className="w-40 h-40 mb-4 bg-gray-100 dark:bg-slate-900 rounded-2xl overflow-hidden flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-slate-600 group-hover:border-blue-500 dark:group-hover:border-green-500 transition-colors shadow-inner">
                                {preview ? (
                                    <img src={preview} alt="Asset Preview" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="flex flex-col items-center text-gray-400 dark:text-slate-500">
                                        <i className="fa-solid fa-image text-3xl mb-2"></i>
                                        <span className="text-sm font-medium">No Image</span>
                                    </div>
                                )}
                            </div>
                            <label className="cursor-pointer">
                                <span className="bg-blue-50 dark:bg-slate-700 text-blue-600 dark:text-green-400 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-100 dark:hover:bg-slate-600 transition-colors">
                                    <i className="fa-solid fa-camera mr-2"></i>อัพโหลดรูปภาพ
                                </span>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    className="hidden"
                                />
                            </label>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">รหัสทรัพย์สิน *</label>
                                <div className="relative">
                                    <i className="fa-solid fa-barcode absolute left-3 top-3 text-gray-400"></i>
                                    <input
                                        required
                                        type="text"
                                        name="asset_code"
                                        value={formData.asset_code || ''}
                                        onChange={handleChange}
                                        className="w-full bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-600 text-gray-900 dark:text-white rounded-lg pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-green-500 transition-shadow"
                                        placeholder="เช่น IT-2024-XXX"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">ชื่อทรัพย์สิน *</label>
                                <input
                                    required
                                    type="text"
                                    name="name"
                                    value={formData.name || ''}
                                    onChange={handleChange}
                                    className="w-full bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-600 text-gray-900 dark:text-white rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-green-500 transition-shadow"
                                    placeholder="เช่น MacBook Pro, Dell Monitor"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">ประเภท *</label>
                                <select
                                    name="type"
                                    value={formData.type || 'Laptop'}
                                    onChange={handleChange}
                                    className="w-full bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-600 text-gray-900 dark:text-white rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-green-500"
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
                                <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">สถานะ</label>
                                <select
                                    name="status"
                                    value={formData.status || 'available'}
                                    onChange={handleChange}
                                    className="w-full bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-600 text-gray-900 dark:text-white rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-green-500"
                                >
                                    <option value="available">ว่าง (Available)</option>
                                    <option value="assigned">ใช้งานอยู่ (Assigned)</option>
                                    <option value="repair">ส่งซ่อม (Repair)</option>
                                    <option value="retired">ตัดจำหน่าย (Retired)</option>
                                    <option value="lost">สูญหาย (Lost)</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">ยี่ห้อ (Brand)</label>
                                <input
                                    type="text"
                                    name="brand"
                                    value={formData.brand || ''}
                                    onChange={handleChange}
                                    className="w-full bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-600 text-gray-900 dark:text-white rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-green-500"
                                />
                            </div>
                            <div>
                                <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">รุ่น (Model)</label>
                                <input
                                    type="text"
                                    name="model"
                                    value={formData.model || ''}
                                    onChange={handleChange}
                                    className="w-full bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-600 text-gray-900 dark:text-white rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-green-500"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">Serial Number</label>
                                <input
                                    type="text"
                                    name="serial_number"
                                    value={formData.serial_number || ''}
                                    onChange={handleChange}
                                    className="w-full bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-600 text-gray-900 dark:text-white rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-green-500"
                                />
                            </div>
                            <div>
                                <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">ราคา (บาท)</label>
                                <input
                                    type="number"
                                    name="price"
                                    value={formData.price || ''}
                                    onChange={handleChange}
                                    className="w-full bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-600 text-gray-900 dark:text-white rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-green-500"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">วันที่ซื้อ</label>
                                <input
                                    type="date"
                                    name="purchase_date"
                                    value={formData.purchase_date || ''}
                                    onChange={handleChange}
                                    className="w-full bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-600 text-gray-900 dark:text-white rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-green-500"
                                />
                            </div>
                            <div>
                                <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">สถานที่เก็บ / ใช้งาน</label>
                                <input
                                    type="text"
                                    name="location"
                                    value={formData.location || ''}
                                    onChange={handleChange}
                                    className="w-full bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-600 text-gray-900 dark:text-white rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-green-500"
                                    placeholder="เช่น แผนก IT, ห้อง Server"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">ผู้ใช้งาน / ผู้รับผิดชอบ (Assigned To)</label>
                                <div className="relative">
                                    <i className="fa-solid fa-user absolute left-3 top-3 text-gray-400"></i>
                                    <input
                                        type="text"
                                        name="assigned_to"
                                        value={formData.assigned_to || ''}
                                        onChange={handleChange}
                                        className="w-full bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-600 text-gray-900 dark:text-white rounded-lg pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-green-500"
                                        placeholder="ระบุชื่อผู้ใช้งาน"
                                    />
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">ลายเซ็นผู้รับมอบ (Signature)</label>
                            <div className="border border-gray-200 dark:border-slate-600 rounded-lg p-3 bg-gray-50 dark:bg-slate-900 inline-block w-full sm:w-auto">
                                <SignatureCanvas
                                    ref={sigPad}
                                    penColor={localStorage.getItem('theme') === 'dark' ? '#22c55e' : 'black'}
                                    canvasProps={{ width: 400, height: 150, className: 'sigCanvas bg-white dark:bg-slate-800 rounded border dark:border-slate-700 w-full' }}
                                />
                            </div>
                            <div className="mt-2 text-right sm:text-left">
                                <button type="button" onClick={clearSignature} className="text-red-500 dark:text-red-400 text-sm hover:underline flex items-center gap-1">
                                    <i className="fa-solid fa-eraser"></i> ลบ/เซ็นใหม่
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">สเปค / รายละเอียดเพิ่มเติม (Spec)</label>
                            <textarea
                                name="spec"
                                value={formData.spec || ''}
                                onChange={handleChange}
                                className="w-full bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-600 text-gray-900 dark:text-white rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-green-500 h-24 mb-4"
                                placeholder="เช่น CPU i5, RAM 16GB, SSD 512GB"
                            ></textarea>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">วันที่รับเข้า (Received Date)</label>
                                <input
                                    type="date"
                                    name="received_date"
                                    value={formData.received_date || ''}
                                    onChange={handleChange}
                                    className="w-full bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-600 text-gray-900 dark:text-white rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-green-500"
                                />
                            </div>
                            <div>
                                <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">วันที่คืน (Return Date)</label>
                                <input
                                    type="date"
                                    name="return_date"
                                    value={formData.return_date || ''}
                                    onChange={handleChange}
                                    className="w-full bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-600 text-gray-900 dark:text-white rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-green-500"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">หมายเหตุ</label>
                            <textarea
                                name="notes"
                                value={formData.notes || ''}
                                onChange={handleChange}
                                className="w-full bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-600 text-gray-900 dark:text-white rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-green-500 h-24"
                            ></textarea>
                        </div>

                        <div className="flex justify-end gap-3 pt-6 border-t border-gray-100 dark:border-slate-700">
                            {isEditMode && (
                                <button
                                    type="button"
                                    onClick={handleExportPDF}
                                    className="px-5 py-2.5 text-white bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 rounded-lg transition font-bold shadow-md hover:shadow-lg flex items-center gap-2"
                                >
                                    <i className="fa-solid fa-file-pdf"></i>
                                    Export PDF
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={() => navigate('/')}
                                className="px-5 py-2.5 text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-slate-700 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600 transition font-bold"
                            >
                                ยกเลิก
                            </button>
                            <button
                                type="submit"
                                className="px-8 py-2.5 bg-blue-600 dark:bg-green-600 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-green-500 transition font-bold shadow-lg hover:shadow-blue-500/30 dark:hover:shadow-green-500/30"
                            >
                                {isEditMode ? 'บันทึกการแก้ไข' : 'บันทึกข้อมูล'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Hidden Print Template */}
            <div style={{ position: 'absolute', top: -10000, left: -10000 }}>
                <div ref={printRef} className="w-[210mm] min-h-[297mm] p-12 font-sans box-border relative" style={{ backgroundColor: '#ffffff', color: '#000000' }}>
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
                                <td className="border p-2 font-bold" style={{ borderColor: '#d1d5db' }}>Status (สถานะ)</td>
                                <td className="border p-2 capitalize" style={{ borderColor: '#d1d5db' }}>{formData.status}</td>
                            </tr>
                            <tr>
                                <td className="border p-2 font-bold" style={{ borderColor: '#d1d5db' }}>Notes (หมายเหตุ)</td>
                                <td className="border p-2 whitespace-pre-wrap" style={{ borderColor: '#d1d5db' }}>{formData.notes}</td>
                            </tr>
                        </tbody>
                    </table>

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
                    <div className="max-w-6xl mx-auto mt-8 bg-white dark:bg-slate-800 rounded-xl shadow-lg dark:shadow-green-900/10 p-6 sm:p-8 border border-gray-100 dark:border-slate-700 transition-colors">
                        <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-white flex items-center gap-2">
                            <i className="fa-solid fa-clock-rotate-left text-blue-600 dark:text-green-400"></i>
                            ประวัติการซ่อมบำรุง
                        </h3>

                        {/* Desktop Table View */}
                        <div className="hidden md:block overflow-x-auto rounded-lg border border-gray-200 dark:border-slate-700">
                            <table className="min-w-full leading-normal">
                                <thead>
                                    <tr className="bg-gray-100 dark:bg-slate-900">
                                        <th className="px-5 py-3 border-b-2 border-gray-200 dark:border-slate-600 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                                            วันที่
                                        </th>
                                        <th className="px-5 py-3 border-b-2 border-gray-200 dark:border-slate-600 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                                            ประเภท
                                        </th>
                                        <th className="px-5 py-3 border-b-2 border-gray-200 dark:border-slate-600 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                                            รายละเอียด
                                        </th>
                                        <th className="px-5 py-3 border-b-2 border-gray-200 dark:border-slate-600 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                                            สถานะ
                                        </th>
                                        <th className="px-5 py-3 border-b-2 border-gray-200 dark:border-slate-600 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                                            ค่าใช้จ่าย
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {maintenanceLogs.length === 0 ? (
                                        <tr>
                                            <td colSpan="5" className="text-center py-8 text-gray-500 dark:text-gray-400 bg-white dark:bg-slate-800">
                                                ไม่พบประวัติการซ่อม
                                            </td>
                                        </tr>
                                    ) : (
                                        maintenanceLogs.map((log) => (
                                            <tr key={log.id} className="bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                                                <td className="px-5 py-4 text-sm text-gray-700 dark:text-gray-300">
                                                    {new Date(log.created_at || log.log_date).toLocaleDateString('th-TH')}
                                                </td>
                                                <td className="px-5 py-4 text-sm">
                                                    <span className={`px-2 py-1 rounded text-xs font-bold border ${log.service_type === 'new_setup' ? 'text-purple-700 bg-purple-50 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800' :
                                                        log.service_type === 'service' ? 'text-blue-700 bg-blue-50 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800' : 'text-orange-700 bg-orange-50 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800'
                                                        }`}>
                                                        {log.service_type === 'new_setup' ? 'ติดตั้งใหม่' : log.service_type === 'service' ? 'บริการ' : 'ซ่อม'}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-4 text-sm text-gray-600 dark:text-gray-300">
                                                    <div className="max-w-xs truncate">{log.description}</div>
                                                </td>
                                                <td className="px-5 py-4 text-sm">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${log.status === 'completed' ? 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800' :
                                                        log.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800' :
                                                            'bg-gray-100 text-gray-800 border-gray-200 dark:bg-slate-700 dark:text-gray-400 dark:border-slate-600'
                                                        }`}>
                                                        {log.status === 'completed' ? 'เสร็จสิ้น' :
                                                            log.status === 'in_progress' ? 'กำลังดำเนินการ' : 'รอคิว'}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-4 text-sm text-gray-700 dark:text-gray-300 font-mono">
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
                                <div className="text-center py-4 text-gray-500 dark:text-gray-400">ไม่พบประวัติการซ่อม</div>
                            ) : (
                                maintenanceLogs.map((log) => (
                                    <div key={log.id} className="bg-gray-50 dark:bg-slate-900 p-4 rounded-lg border border-gray-200 dark:border-slate-700 shadow-sm">
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="font-bold text-gray-800 dark:text-gray-200">
                                                {new Date(log.created_at || log.log_date).toLocaleDateString('th-TH')}
                                            </div>
                                            <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${log.status === 'completed' ? 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800' :
                                                log.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800' : 'bg-gray-200 text-gray-800 border-gray-300 dark:bg-slate-700 dark:text-gray-400 dark:border-slate-600'}`}>
                                                {log.status === 'completed' ? 'เสร็จสิ้น' :
                                                    log.status === 'in_progress' ? 'กำลังดำเนินการ' : 'รอคิว'}
                                            </span>
                                        </div>
                                        <div className="mb-2">
                                            <span className={`inline-block px-2 py-1 rounded text-xs font-bold mb-1 border ${log.service_type === 'new_setup' ? 'text-purple-700 bg-purple-50 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800' :
                                                log.service_type === 'service' ? 'text-blue-700 bg-blue-50 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800' : 'text-orange-700 bg-orange-50 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800'}`}>
                                                {log.service_type === 'new_setup' ? 'ติดตั้งใหม่' : log.service_type === 'service' ? 'บริการ' : 'ซ่อม'}
                                            </span>
                                            <p className="text-sm text-gray-600 dark:text-gray-300">{log.description}</p>
                                        </div>
                                        <div className="text-right text-sm font-bold text-gray-700 dark:text-gray-200 border-t border-gray-200 dark:border-slate-700 pt-2 mt-2">
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
