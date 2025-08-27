import Layout from '../layouts/Layout';
import { Link } from 'react-router-dom';


export default function Home() {
 return (
   <Layout title="Home - Summer Tech Showcase">
     <div className="home-page" style={{ textAlign: "center", padding: "2rem" }}>
       <h1>Welcome to Summer Tech Showcase 2025</h1>
       <p>Explore our interactive algorithm visualizer and mock interview platform.</p>


       <div style={{ marginTop: "2rem", display: "flex", justifyContent: "center", gap: "2rem" }}>
         <Link
           to="/mockinterview"
           style={{
             background: "transparent",
             border: "2px solid var(--border)",
             color: "var(--text)",        // ✅ uses theme text color now
             padding: "1.5rem 3rem",
             borderRadius: "0.5rem",
             cursor: "pointer",
             fontSize: "1.25rem",
             textDecoration: "none",
             fontWeight: "bold"
           }}
         >
           Mock Interview
         </Link>


         <Link
           to="/algorithmvis"
           style={{
             background: "transparent",
             border: "2px solid var(--border)",
             color: "var(--text)",        // ✅ same fix here
             padding: "1.5rem 3rem",
             borderRadius: "0.5rem",
             cursor: "pointer",
             fontSize: "1.25rem",
             textDecoration: "none",
             fontWeight: "bold"
           }}
         >
           Algorithm Visualizer
         </Link>
       </div>
     </div>
   </Layout>
 );
}
