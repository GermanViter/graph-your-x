import Header from './header/Header.tsx';
import Footer from './footer/Footer.tsx';
import { Outlet } from 'react-router-dom';
import './Layout.css';

function MainLayout() {
    return (
        <div className="app">
            <Header />

            <main className="main-content">
                <Outlet />
            </main>

            <Footer />
        </div>
    );
}

export default MainLayout;