import React from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const MainLayout = ({ children }) => {
    const location = useLocation();
    const isDashboard = location.pathname.startsWith('/employer') || location.pathname.startsWith('/employee');

    return (
        <div className="flex flex-col min-h-screen">
            <Navbar />
            <main className="flex-grow">
                {children}
            </main>
            {!isDashboard && <Footer />}
        </div>
    );
};

export default MainLayout;
