import { useEffect, useState } from "react";
import "../../style/ThemeSwitcher.css";

function ThemeSwitcher() {
    const [theme, setTheme] = useState("light");

    useEffect(() => {
        const savedTheme = localStorage.getItem("theme") || "light";
        setTheme(savedTheme);
        document.documentElement.setAttribute("data-theme", savedTheme);
    }, []);

    // change the theme
    const toggleTheme = () => {
        const newTheme = theme === "light" ? "dark" : "light";
        setTheme(newTheme);
        document.documentElement.setAttribute("data-theme", newTheme);
        localStorage.setItem("theme", newTheme);
    };

    return (
        // create the theme switcher
        <div className="theme-switcher" onClick={toggleTheme}>
            <div className={`slider ${theme === "light" ? "light" : "dark"}`}>
                <span className="emoji">
                    {theme === "light" ? "🎅🏻" : "🎅🏿" /* put icons by the chosen mode */}
                </span>
            </div>
        </div>
    );
}

export default ThemeSwitcher;
