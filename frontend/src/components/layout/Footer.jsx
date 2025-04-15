import React from "react";

const Footer = () => {
  return (
    <footer 
      className="footer mt-auto bg-dark text-white" 
      style={{
        height: '20px', 
        padding: 0, 
        lineHeight: '20px', 
        fontSize: '0.7rem'
      }}
    >
      <div className="container text-center">
        <span className="text-muted">© {new Date().getFullYear()} Gestion des Stocks</span>
      </div>
    </footer>
  );
};

export default Footer;