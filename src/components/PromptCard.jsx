import React from 'react';
import { Link } from 'react-router-dom';

export default function PromptCard({ prompt }) {
    return (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition duration-300 border border-gray-100 group">
            <div className="h-48 overflow-hidden relative">
                <img
                    src={prompt.cover_image || 'https://via.placeholder.com/400x300?text=No+Image'}
                    alt="Cover"
                    className="w-full h-full object-cover transform group-hover:scale-110 transition duration-500"
                />
                <div className="absolute top-2 right-2 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded-full">
                    <i className="fa-solid fa-eye"></i> {Number(prompt.views).toLocaleString()}
                </div>
            </div>
            <div className="p-4">
                <span className="inline-block bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full mb-2">
                    {prompt.category_name}
                </span>
                <h3 className="text-lg font-bold text-gray-800 mb-2 truncate">{prompt.title}</h3>

                <Link to={`/detail/${prompt.id}`} className="block text-center w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-2 rounded-lg mt-2 hover:from-blue-600 hover:to-purple-700 transition">
                    ดูรายละเอียด
                </Link>
            </div>
        </div>
    );
}
