import React, { useState } from 'react';
import DwvComponent from './DwvComponent.jsx';
import DicomUploaderPage from './pages/DicomUploaderPage';
import DicomStudiesList from './components/DicomStudiesList.jsx';

function App() {
  const [currentView, setCurrentView] = useState('list');

  React.useEffect(() => {
    setCurrentView('list');
  }, []);

  const setView = (view) => {
    setCurrentView(view);
  };

  return (
    <div className="App" style={{ fontFamily: 'Arial, sans-serif' }}>
      <header style={{ padding: '15px', background: '#333', color: 'white' }}>
        <h1>Visor DICOM</h1>
      </header>

      <nav style={{ background: '#f0f0f0', padding: '10px', borderBottom: '1px solid #ccc' }}>

        <button onClick={() => setView('list')} style={{ margin: '0 10px' }}>
          Lista de Estudios
        </button>

        <button onClick={() => setView('uploader')} style={{ margin: '0 10px' }}>
          Subir Nuevo Estudio (Create)
        </button>

        <button onClick={() => setView('viewer')} style={{ margin: '0 10px' }}>
          Visor DICOM
        </button>

      </nav>

      <main style={{ padding: '20px' }}>
        {currentView === 'uploader' && <DicomUploaderPage />}

        {currentView === 'viewer' && (
          <DwvComponent />
        )}

        {currentView === 'list' && (
          <DicomStudiesList />
        )}
      </main>

    </div>
  );
}


export default App;