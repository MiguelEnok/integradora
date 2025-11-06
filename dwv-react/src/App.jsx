import React, { useState } from 'react';
import DwvComponent from './DwvComponent.jsx';
import DicomUploaderPage from './pages/DicomUploaderPage';
import DicomFormPage from './pages/DicomUpdateForm.jsx';
import DicomStudiesList from './components/DicomStudiesList.jsx';

function App() {
  const [currentView, setCurrentView] = useState('list');
  const [studyToEdit, setStudyToEdit] = useState(null);

  React.useEffect(() => {
    if (!currentView) {
      setCurrentView('list');
    }
  }, []);

  const setView = (view) => {
    setCurrentView(view);

    if (view !== 'uploader') {
      setStudyToEdit(null);
    }
  };

  const handleSelectStudy = (url) => {
    setView('viewer');
  };

  const startEditing = (study) => {
    setStudyToEdit(study);
    setCurrentView('update');
  };
  const onOperationComplete = () => {
    setStudyToEdit(null);
    setCurrentView('list');
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

        {currentView === 'update' && (
          <DicomFormPage
            studyToEdit={studyToEdit}
            onComplete={onOperationComplete}
            setView={setView}
          />
        )}

        {currentView === 'list' && (
          <DicomStudiesList
            onSelectStudy={handleSelectStudy}
            setView={setView}
            onEditStudy={startEditing}
          />
        )}

        {currentView === 'viewer' && (
          <DwvComponent />
        )}

      </main>

    </div>
  );
}


export default App;