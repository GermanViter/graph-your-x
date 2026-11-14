import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";

import "./Header.css";

/** Small prerequisite graph: two courses feeding into a third. */
function LogoMark() {
    return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
                d="M6 7 C12 7 11 12 18 12 M6 17 C12 17 11 12 18 12"
                stroke="#ffffff"
                strokeWidth="1.8"
                strokeLinecap="round"
            />
            <circle cx="6" cy="7" r="2.6" fill="#ffffff" />
            <circle cx="6" cy="17" r="2.6" fill="#ffffff" />
            <circle cx="18" cy="12" r="3.2" fill="#ffffff" />
        </svg>
    );
}

export default function Header() {
    const { pathname } = useLocation();
    const onLanding = pathname === "/";
    const [scrolled, setScrolled] = useState(false);

    // Add a border and shadow once the page has scrolled
    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 4);
        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    return (
        <header className={scrolled ? "header scrolled" : "header"}>

            <Link to="/" className="header-brand" aria-label="Prereq home">
                <span className="header-logo">
                    <LogoMark />
                </span>
                <span className="header-brand-title">Prereq</span>
            </Link>

            <nav className="header-nav" aria-label="Main">

                <NavLink
                    to="/"
                    end
                    className={({ isActive }) =>
                        isActive ? "header-link active" : "header-link"
                    }
                >
                    Home
                </NavLink>

                {/* These sections only exist on the landing page */}
                {onLanding && (
                    <>
                        <a className="header-link section" href="#how">
                            How it works
                        </a>

                        <a className="header-link section" href="#build">
                            Build your own
                        </a>
                    </>
                )}

                <Link className="header-cta" to="/graph">
                    Open graph
                </Link>

            </nav>

        </header>
    );
}