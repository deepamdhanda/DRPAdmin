import React from 'react';

const DashboardScreen: React.FC = () => {
  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      <h1 style={{ marginBottom: '1.5rem', color: '#000434' }}>
        Welcome to Admin Dashboard
      </h1>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit,minmax(250px,1fr))',
          gap: '1.5rem',
        }}
      >
        {/* Example stat card */}
        <div
          style={{
            backgroundColor: 'white',
            padding: '1.5rem',
            borderRadius: 8,
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            textAlign: 'center',
          }}
        >
          <h2 style={{ margin: 0, fontSize: '2.5rem', color: '#F5891E' }}>256</h2>
          <p style={{ margin: 0, fontWeight: 'bold', color: '#333' }}>New Orders</p>
        </div>

        <div
          style={{
            backgroundColor: 'white',
            padding: '1.5rem',
            borderRadius: 8,
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            textAlign: 'center',
          }}
        >
          <h2 style={{ margin: 0, fontSize: '2.5rem', color: '#F5891E' }}>89%</h2>
          <p style={{ margin: 0, fontWeight: 'bold', color: '#333' }}>
            Delivery Success
          </p>
        </div>

        <div
          style={{
            backgroundColor: 'white',
            padding: '1.5rem',
            borderRadius: 8,
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            textAlign: 'center',
          }}
        >
          <h2 style={{ margin: 0, fontSize: '2.5rem', color: '#F5891E' }}>12</h2>
          <p style={{ margin: 0, fontWeight: 'bold', color: '#333' }}>New Admins</p>
        </div>

        <div
          style={{
            backgroundColor: 'white',
            padding: '1.5rem',
            borderRadius: 8,
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            textAlign: 'center',
          }}
        >
          <h2 style={{ margin: 0, fontSize: '2.5rem', color: '#F5891E' }}>5</h2>
          <p style={{ margin: 0, fontWeight: 'bold', color: '#333' }}>Pending Tickets</p>
        </div>
      </div>

      {/* You can add charts, tables, etc. below */}
    </div>
  );
};

export default DashboardScreen;
