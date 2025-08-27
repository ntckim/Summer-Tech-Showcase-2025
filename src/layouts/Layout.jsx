import { Link } from 'react-router-dom';
import './Layout.css';
import { useEffect, useState } from 'react';


const Layout = ({ children, title = "Summer Tech Showcase 2025" }) => {
 const [theme, setTheme] = useState(() => {
   return localStorage.getItem("theme") || "light";
 });


 useEffect(() => {
   document.documentElement.setAttribute("data-theme", theme);
   localStorage.setItem("theme", theme);
 }, [theme]);


 const toggleTheme = () => {
   setTheme(theme === "light" ? "dark" : "light");
 };


 return (
   <div className="app-layout">
     <header className="header">
       <nav className="nav">
         <div className="nav-brand">
           <h1>{title}</h1>
         </div>
         <div className="nav-links">
           <Link to="/" className="nav-link">Home</Link>
           <button
             onClick={toggleTheme}
             style={{
               background: "transparent",
               border: "1px solid var(--border)",
               color: "var(--header-text)",
               padding: "0.5rem 1rem",
               borderRadius: "0.375rem",
               cursor: "pointer",
               fontWeight: "600"
             }}
           >
             {theme === "light" ? " Dark Mode" : "Light Mode"}
           </button>
         </div>
       </nav>
     </header>


     <main className="main-content">
       {children}
     </main>


     <footer className="footer">
       <p>© 2025 Summer Tech Showcase</p>
     </footer>
   </div>
 );
};


export default Layout;
