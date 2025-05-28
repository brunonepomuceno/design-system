import React, { useState } from 'react';
import { SearchIcon, HomeIcon, SettingsIcon, BellIcon } from '../src';
import '../assets/icons.css';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [notifications, setNotifications] = useState([
    { id: 1, message: 'New message received', read: false },
    { id: 2, message: 'System update available', read: false },
  ]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (id: number) => {
    setNotifications(notifications.map(n => 
      n.id === id ? { ...n, read: true } : n
    ));
  };

  return (
    <div style={{
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      minHeight: '100vh',
      backgroundColor: '#f5f5f5',
    }}>
      {/* Header */}
      <header style={{
        backgroundColor: '#fff',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        padding: '1rem 2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 600 }}>Fretebras</h1>
        </div>
        
        <div style={{
          position: 'relative',
          flex: 1,
          maxWidth: '500px',
          margin: '0 2rem',
        }}>
          <div style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
          }}>
            <SearchIcon 
              size={20} 
              color="#666" 
              style={{
                position: 'absolute',
                left: '12px',
                pointerEvents: 'none',
              }} 
            />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem 1rem 0.5rem 40px',
                borderRadius: '20px',
                border: '1px solid #ddd',
                fontSize: '1rem',
                outline: 'none',
                transition: 'all 0.2s',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#0070f3';
                e.target.style.boxShadow = '0 0 0 2px rgba(0, 112, 243, 0.2)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#ddd';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>
        </div>
        
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1.5rem',
        }}>
          <button 
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              position: 'relative',
              padding: '0.5rem',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background-color 0.2s',
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.05)'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <BellIcon size={24} color="#333" />
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute',
                top: '4px',
                right: '4px',
                backgroundColor: '#ff3b30',
                color: 'white',
                borderRadius: '50%',
                width: '18px',
                height: '18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.7rem',
                fontWeight: 'bold',
              }}>
                {unreadCount}
              </span>
            )}
          </button>
          
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            backgroundColor: '#e0e0e0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            overflow: 'hidden',
          }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>U</span>
          </div>
        </div>
      </header>

      <div style={{
        display: 'flex',
        minHeight: 'calc(100vh - 72px)',
      }}>
        {/* Sidebar */}
        <nav style={{
          width: '240px',
          backgroundColor: '#fff',
          borderRight: '1px solid #eee',
          padding: '1.5rem 0',
        }}>
          <ul style={{
            listStyle: 'none',
            padding: 0,
            margin: 0,
          }}>
            {[
              { id: 'home', label: 'Home', icon: <HomeIcon size={20} /> },
              { id: 'search', label: 'Search', icon: <SearchIcon size={20} /> },
              { id: 'settings', label: 'Settings', icon: <SettingsIcon size={20} /> },
            ].map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => setActiveTab(item.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    width: '100%',
                    padding: '0.75rem 1.5rem',
                    background: activeTab === item.id ? '#f0f7ff' : 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                    color: activeTab === item.id ? '#0070f3' : '#333',
                    fontWeight: activeTab === item.id ? 500 : 400,
                    transition: 'all 0.2s',
                  }}
                  onMouseOver={(e) => {
                    if (activeTab !== item.id) {
                      e.currentTarget.style.backgroundColor = '#f9f9f9';
                    }
                  }}
                  onMouseOut={(e) => {
                    if (activeTab !== item.id) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  <span style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '24px',
                    height: '24px',
                  }}>
                    {React.cloneElement(item.icon, {
                      color: activeTab === item.id ? '#0070f3' : '#666',
                    })}
                  </span>
                  <span>{item.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Main content */}
        <main style={{
          flex: 1,
          padding: '2rem',
        }}>
          <div style={{
            backgroundColor: '#fff',
            borderRadius: '8px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            padding: '2rem',
          }}>
            <h2 style={{
              marginTop: 0,
              marginBottom: '1.5rem',
              color: '#333',
            }}>
              {activeTab === 'home' && 'Dashboard'}
              {activeTab === 'search' && 'Search Results'}
              {activeTab === 'settings' && 'Settings'}
            </h2>
            
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '300px',
              color: '#666',
              textAlign: 'center',
              border: '2px dashed #e0e0e0',
              borderRadius: '8px',
              padding: '2rem',
            }}>
              {activeTab === 'home' && (
                <>
                  <HomeIcon size={48} color="#e0e0e0" style={{ marginBottom: '1rem' }} />
                  <h3>Welcome to the Dashboard</h3>
                  <p>Select an option from the sidebar to get started.</p>
                </>
              )}
              
              {activeTab === 'search' && (
                <>
                  <SearchIcon size={48} color="#e0e0e0" style={{ marginBottom: '1rem' }} />
                  <h3>Search for something</h3>
                  <p>Use the search bar at the top to find what you're looking for.</p>
                </>
              )}
              
              {activeTab === 'settings' && (
                <>
                  <SettingsIcon size={48} color="#e0e0e0" style={{ marginBottom: '1rem' }} />
                  <h3>Settings</h3>
                  <p>Configure your application settings here.</p>
                </>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
