import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { getPrompt } from '../api';
import Swal from 'sweetalert2';

export default function Detail() {
    const { id } = useParams();
    const [prompt, setPrompt] = useState(null);
    const [loading, setLoading] = useState(true);
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    useEffect(() => {
        fetchPrompt();
    }, [id]);

    const fetchPrompt = async () => {
        try {
            const res = await getPrompt(id);
            setPrompt(res.data);
        } catch (err) {
            Swal.fire('Error', 'Prompt not found', 'error');
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(prompt.content);
        Swal.fire({
            icon: 'success',
            title: 'คัดลอกเรียบร้อย',
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 1500
        });
    };

    const openLightbox = (index) => {
        setCurrentImageIndex(index);
        setLightboxOpen(true);
    };

    const closeLightbox = () => setLightboxOpen(false);

    const nextImage = (e) => {
        e.stopPropagation();
        if (prompt.gallery) {
            setCurrentImageIndex((prev) => (prev + 1) % prompt.gallery.length);
        }
    };

    const prevImage = (e) => {
        e.stopPropagation();
        if (prompt.gallery) {
            setCurrentImageIndex((prev) => (prev - 1 + prompt.gallery.length) % prompt.gallery.length);
        }
    };

    if (loading) return <div className="text-center mt-20">Loading...</div>;
    if (!prompt) return <div className="text-center mt-20">Prompt not found</div>;

    return (
        <div className="flex flex-col min-h-screen">
            <Navbar />
            <main className="container mx-auto px-4 py-8 flex-grow">
                <div className="bg-white rounded-xl shadow-lg overflow-hidden max-w-5xl mx-auto">
                    <div className="md:flex">
                        <div className="md:w-1/3 h-64 md:h-auto relative">
                            <img src={prompt.cover_image || 'https://via.placeholder.com/600x800'} className="w-full h-full object-cover" alt="Cover" />
                        </div>
                        <div className="md:w-2/3 p-6 md:p-8">
                            <div className="flex flex-wrap items-center gap-2 mb-4">
                                <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-semibold">
                                    {prompt.category_name}
                                </span>
                                <span className="text-gray-500 text-sm">
                                    <i className="fa-solid fa-eye ml-2"></i> {Number(prompt.views).toLocaleString()} ครั้ง
                                </span>
                            </div>

                            <h2 className="text-3xl font-bold text-gray-800 mb-4">{prompt.title}</h2>

                            <div className="mb-6">
                                <label className="block text-gray-700 font-bold mb-2">
                                    Prompt Content
                                    <button onClick={copyToClipboard} className="ml-2 text-sm text-blue-600 hover:text-blue-800 focus:outline-none" title="คัดลอก">
                                        <i className="fa-regular fa-copy"></i> คัดลอก
                                    </button>
                                </label>
                                <div className="relative group">
                                    <textarea className="w-full h-40 p-4 rounded-lg bg-[#1e1e1e] text-[#d4d4d4] font-mono whitespace-pre-wrap focus:outline-none resize-none" readOnly value={prompt.content}></textarea>
                                </div>
                            </div>

                            <div className="flex gap-4 mb-8">
                                <Link to="/" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-800 transition">
                                    <i className="fa-solid fa-arrow-left"></i> ย้อนกลับ
                                </Link>
                                {prompt.url && (
                                    <a href={prompt.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-gradient-to-r from-green-500 to-teal-500 text-white px-6 py-2 rounded-lg shadow hover:shadow-lg transition">
                                        <i className="fa-solid fa-link"></i> เปิดลิงก์ URL
                                    </a>
                                )}
                            </div>

                            {/* Gallery Grid */}
                            {prompt.gallery && prompt.gallery.length > 0 && (
                                <div className="border-t border-gray-100 pt-6">
                                    <h3 className="text-xl font-bold text-gray-800 mb-4"><i className="fa-regular fa-images"></i> อัลบั้มรูปภาพ</h3>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        {prompt.gallery.map((img, index) => (
                                            <div key={img.id} onClick={() => openLightbox(index)} className="cursor-pointer rounded-lg overflow-hidden shadow-sm hover:shadow-md transition transform hover:scale-105 relative group h-32 bg-gray-100">
                                                <img src={img.image_path} className="w-full h-full object-cover" alt={`Gallery ${index + 1}`} />
                                                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition flex items-center justify-center">
                                                    <i className="fa-solid fa-magnifying-glass-plus text-white opacity-0 group-hover:opacity-100 font-bold text-2xl drop-shadow-lg"></i>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>

            {/* Lightbox Modal */}
            {lightboxOpen && prompt.gallery && (
                <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center animate-[fadeIn_0.2s_ease-out]" onClick={closeLightbox}>
                    <button onClick={closeLightbox} className="absolute top-4 right-4 text-white text-4xl hover:text-gray-300 focus:outline-none z-[60]">&times;</button>

                    <button onClick={prevImage} className="absolute left-4 text-white text-5xl hover:text-gray-300 focus:outline-none z-[60] p-2 md:p-4 bg-white/10 rounded-full hover:bg-white/20 transition backdrop-blur-sm">
                        <i className="fa-solid fa-chevron-left"></i>
                    </button>

                    <div className="relative w-full h-full p-4 flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
                        <img src={prompt.gallery[currentImageIndex].image_path} className="max-h-[85vh] max-w-[90vw] object-contain rounded-lg shadow-2xl" alt="Lightbox" />
                        <div className="absolute bottom-4 left-0 w-full text-center text-white/80 text-lg font-kanit">
                            {currentImageIndex + 1} / {prompt.gallery.length}
                        </div>
                    </div>

                    <button onClick={nextImage} className="absolute right-4 text-white text-5xl hover:text-gray-300 focus:outline-none z-[60] p-2 md:p-4 bg-white/10 rounded-full hover:bg-white/20 transition backdrop-blur-sm">
                        <i className="fa-solid fa-chevron-right"></i>
                    </button>
                </div>
            )}

            <Footer />
        </div>
    );
}
