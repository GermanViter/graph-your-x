
import "./Navbar.css"

export default function Navbar({ }) {
    return (
        <nav className="lp-nav">
            <div className="lp-nav-content">
                <div className="lp-logo">
                    <span className="logo-icon">💰</span> SpendSmart
                </div>
                <div className="lp-nav-links">
                    <a href="#features">Features</a>
                    <a href="#pricing">Pricing</a>
                    <a href="#faq">FAQ</a>
                    <button className="nav-btn">Launch App</button>
                </div>
            </div>
        </nav>
    );
}