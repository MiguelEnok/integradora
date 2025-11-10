import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import LoginPage from './pages/LoginPage.jsx';
import DwvComponent from './DwvComponent.jsx';
import DicomUploaderPage from './pages/DicomUploadForm.jsx';
import DicomFormPage from './pages/DicomUpdateForm.jsx';
import DicomStudiesList from './components/DicomStudiesList.jsx';

function App() {

  const PRIMARY_DARK = '#115e67';
  const BG_LIGHT = 'white';
  const ACCENT_COLOR = '#e5e7eb'; // Gris claro para el hover/inactivo

  // Estilo para los botones de navegación (Tabs)
  const navButtonStyle = (viewName) => ({
    padding: '8px 15px',
    margin: '0 5px',
    border: 'none',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: currentView === viewName ? '600' : '500',
    backgroundColor: 'transparent',
    color: currentView === viewName ? PRIMARY_DARK : '#333',
    borderBottom: currentView === viewName ? `2px solid ${PRIMARY_DARK}` : '2px solid transparent',
    transition: 'all 0.2s ease-in-out',
  });

  const [session, setSession] = useState(null); // NUEVO: Estado de la sesión de Supabase
  const [loadingApp, setLoadingApp] = useState(true); // NUEVO: Para saber si la app está cargando la sesión

  const [currentView, setCurrentView] = useState('list');
  const [studyToEdit, setStudyToEdit] = useState(null);

  const [dwvKey, setDwvKey] = useState(0);

  const forceDwvReload = () => {
    setDwvKey(prevKey => prevKey + 1);
    setCurrentView('viewer');
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoadingApp(false);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setLoadingApp(false);
      }
    );

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  const setView = (view) => {
    setCurrentView(view);

    if (view !== 'uploader') {
      setStudyToEdit(null);
    }
  };

  const handleSelectStudy = () => {
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

  const handleLogout = async () => {
    console.log('Cerrando sesión...');
    await supabase.auth.signOut();
  };

  if (loadingApp) {
    return <p style={{ padding: '50px', textAlign: 'center' }}>Cargando aplicación...</p>;
  }

  if (!session) {
    return <LoginPage onLoginSuccess={(newSession) => setSession(newSession)} />;
  }

  return (
    <div className="App" style={{ fontFamily: 'Arial, sans-serif', background: '#f4f7f9', minHeight: '100vh' }}>

      <nav style={{
        background: BG_LIGHT,
        padding: '0 20px',
        borderBottom: '1px solid #e0e0e0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        height: '60px'
      }}>

        {/* Logo y Título */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '28px',
            height: '28px',
            backgroundColor: PRIMARY_DARK,
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 'bold',
            fontSize: '14px'
          }}>D</div>
          <h1 style={{ fontSize: '18px', fontWeight: 'bold', color: '#333' }}>DICOM Viewer</h1>
        </div>

        {/* Botones Centrales */}
        <div style={{ flexGrow: 1, display: 'flex', justifyContent: 'center' }}>
          <button onClick={() => setView('list')} style={navButtonStyle('list')}>
            Lista de estudios
          </button>
          <button onClick={() => setView('uploader')} style={navButtonStyle('uploader')}>
            Subir nuevo Archivo
          </button>
          <button onClick={() => setView('viewer')} style={navButtonStyle('viewer')}>
            Visor DICOM
          </button>
        </div>

        {/* Botón Salir */}
        <button
          onClick={handleLogout}
          style={{ padding: '8px 15px', background: 'transparent', color: '#dc3545', border: 'none', cursor: 'pointer', fontWeight: '500' }}
        >
          Salir
        </button>
      </nav>

      <main style={{ padding: '30px' }}>
        {currentView === 'uploader' && <DicomUploaderPage setView={setView} />}
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
          <div
            style={{
              width: '70%',
              margin: '0 auto',
              padding: '10px',
              boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
              borderRadius: '8px',
              overflow: 'hidden',
              background: 'white',
              maxHeight: '80vh',
            }}>

            <button
              onClick={forceDwvReload}
              style={{
                top: '80px',
                right: '40px',
                margin: '10px',
                padding: '10px 10px',
                background: PRIMARY_DARK,
                color: ACCENT_COLOR,
                border: 'none',
                borderRadius: '6px',
                fontWeight: '600',
                cursor: 'pointer',
              }}>
              <img
                src="/src/assets/iconReload.svg"
                alt="Subir Archivo"
                style={{
                  verticalAlign: 'middle',
                  marginRight: '5px',
                  width: '20px',
                  height: '20px',
                  color: 'white',
                  filter: 'invert(1)',
                }}
              />
              Recargar Visor
            </button>

            <DwvComponent
              key={dwvKey}
              onComponentReload={forceDwvReload}
            />
          </div>

        )}
      </main >
    </div >
  );
}


export default App;