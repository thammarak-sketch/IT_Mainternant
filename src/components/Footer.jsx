import React from 'react';

export default function Footer() {
    return (
        <footer className="bg-gray-800 text-gray-300 py-6 mt-8">
            <div className="container mx-auto px-4 text-center">
                <p>ระบบคลัง Prompt &copy; {new Date().getFullYear()} All Rights Reserved.</p>
            </div>
        </footer>
    );
}
