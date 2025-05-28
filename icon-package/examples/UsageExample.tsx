import React from 'react';
import { SearchIcon, HomeIcon, SettingsIcon } from '../src';
import '../assets/icons.css';

const UsageExample: React.FC = () => {
  return (
    <div style={{ fontFamily: 'sans-serif', maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
      <h1>Fretebras Icons - Usage Examples</h1>
      
      <section style={{ marginBottom: '2rem' }}>
        <h2>Basic Usage</h2>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem' }}>
          <SearchIcon size={24} />
          <span>Search Icon (24px)</span>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem' }}>
          <HomeIcon size={32} variant="filled" color="#0070f3" />
          <span>Home Icon (32px, filled, blue)</span>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <SettingsIcon size={48} className="spin" style={{ animation: 'spin 2s linear infinite' }} />
          <span>Settings Icon (48px, with animation)</span>
        </div>
      </section>

      <section style={{ marginBottom: '2rem' }}>
        <h2>Using CSS Classes</h2>
        <p>You can also use the generated CSS classes directly:</p>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <span className="icon icon-search" style={{ fontSize: '24px' }}></span>
          <span>Search icon using CSS class</span>
        </div>
      </section>

      <section>
        <h2>Button with Icon</h2>
        <button 
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 1rem',
            backgroundColor: '#0070f3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '1rem',
          }}
        >
          <SearchIcon size={16} color="white" />
          Search
        </button>
      </section>

      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        .spin {
          animation: spin 2s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default UsageExample;
