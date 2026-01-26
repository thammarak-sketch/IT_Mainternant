import React from 'react';
import { Link } from 'react-router-dom';

export default function PromptTable({ prompts }) {
    if (prompts.length === 0) {
        return (
            <div className="bg-white rounded-xl shadow-lg p-10 text-center text-gray-500">
                <i className="fa-regular fa-folder-open text-6xl mb-4"></i>
                <p>ไม่พบข้อมูล</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-100 border-b">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ปก</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ชื่อเรื่อง</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">หมวดหมู่</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ยอดดู</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">จัดการ</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {prompts.map(prompt => (
                            <tr key={prompt.id} className="hover:bg-gray-50 transition">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <img src={prompt.cover_image || 'https://via.placeholder.com/50'} className="w-12 h-12 rounded object-cover" />
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                                    {prompt.title}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                                    <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full">
                                        {prompt.category_name}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                                    <i className="fa-solid fa-eye mr-1"></i> {Number(prompt.views).toLocaleString()}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                    <Link to={`/detail/${prompt.id}`} className="text-blue-600 hover:text-blue-900 bg-blue-100 w-8 h-8 rounded-full inline-flex items-center justify-center transition">
                                        <i className="fa-solid fa-arrow-right"></i>
                                    </Link>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
