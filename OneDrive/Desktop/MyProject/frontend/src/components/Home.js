import React from 'react';
import { Link } from 'react-router-dom';
import AuthDropdown from './AuthDropdown';

const Home = () => {
  return (
    <div className="home-container">
      <header className="home-header">
        <div className="header-content">
          <h1>Resource Inventory Management System</h1>
          <p>Efficiently manage and track your organization's resources</p>
          <AuthDropdown />
        </div>
      </header>
      
      <main className="home-main">
        <section className="hero-section">
          <div className="hero-content">
            <h2>Welcome to CISA Resource Management</h2>
            <p>Streamline your resource tracking, checkouts, and reporting with our comprehensive inventory management system.</p>
            
            <div className="cta-buttons">
              <Link to="/dashboard" className="btn btn-primary">
                Go to Dashboard
              </Link>
              <Link to="/login" className="btn btn-secondary">
                Login
              </Link>
            </div>
          </div>
        </section>
        
        <section className="features-section">
          <h3>Key Features</h3>
          <div className="features-grid">
            <div className="feature-card">
              <h4>Resource Management</h4>
              <p>Add, edit, and track resources with detailed information</p>
            </div>
            <div className="feature-card">
              <h4>Check-in/Check-out</h4>
              <p>Streamlined process for resource borrowing and returns</p>
            </div>
            <div className="feature-card">
              <h4>Activity Logging</h4>
              <p>Comprehensive audit trail of all resource activities</p>
            </div>
            <div className="feature-card">
              <h4>Reporting</h4>
              <p>Generate detailed reports and analytics</p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Home; 