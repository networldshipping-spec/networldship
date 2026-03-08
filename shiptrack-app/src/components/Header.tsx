import React from 'react';

const Header: React.FC = () => {
    return (
        <header className="bg-blue-600 p-4 shadow-md">
            <div className="container mx-auto flex justify-between items-center">
                <h1 className="text-white text-2xl font-bold">ShipTrack</h1>
                <nav>
                    <ul className="flex space-x-4">
                        <li>
                            <a href="/" className="text-white hover:underline">Home</a>
                        </li>
                        <li>
                            <a href="/tracking" className="text-white hover:underline">Track Shipment</a>
                        </li>
                        <li>
                            <a href="/dashboard" className="text-white hover:underline">Dashboard</a>
                        </li>
                    </ul>
                </nav>
            </div>
        </header>
    );
};

export default Header;