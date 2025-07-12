import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./pages/Home.jsx";
import MockInterview from "./pages/MockInterview.jsx";
import AlgorithmVis from "./pages/AlgorithmVis/AlgorithmVis.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route index element={<Home />} />
        <Route path="mockinterview" element={<MockInterview />} />
        <Route path="algorithmvis" element={<AlgorithmVis />} />
      </Routes>
    </BrowserRouter>  
  </React.StrictMode>
);
