import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

const DicomUploaderPage = ({ setView }) => {
  // Colores y estilos basados en el diseño
  const PRIMARY_COLOR = '#4a90a4'; // Color del botón "Guardar estudio" (verde/azul suave)
  const CANCEL_COLOR = '#dc3545'; // Rojo del botón "Cancelar"
  const TEXT_PRIMARY = '#333';
  const CARD_BG = 'white';
  const BG_COLOR = '#f4f7f9';
  const BORDER_COLOR = '#e0e0e0';
  const PRIMARY_DARK = '#115e67'; // Color de logo/texto principal

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [dicomFile, setDicomFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [uploadMessage, setUploadMessage] = useState('');
  const [isDragging, setIsDragging] = useState(false); // Estado para drag and drop

  const handleFileChange = (e) => {
    const files = e.target.files || (e.dataTransfer && e.dataTransfer.files);
    if (files && files[0]) {
      const file = files[0];
      if (file.type === 'application/dicom' || file.name.endsWith('.dcm') || file.name.endsWith('.DCM')) {
        setDicomFile(file);
        setError('');
      } else {
        setError('El archivo debe ser un formato DICOM (.dcm o application/dicom).');
        setDicomFile(null);
      }
    }
    setIsDragging(false); // Resetear después de soltar/seleccionar
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    handleFileChange(e);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !description || !dicomFile) {
      setError('Por favor, completa todos los campos y sube un archivo.');
      return;
    }

    setLoading(true);
    setError('');
    setUploadMessage('Iniciando subida...');

    try {
      const storagePath = `dicom_files/${name.replace(/\s/g, '_')}-${Date.now()}/${dicomFile.name}`;

      const { data: storageData, error: storageError } = await supabase.storage
        .from('studies')
        .upload(storagePath, dicomFile, { cacheControl: '3600', upsert: false });

      if (storageError) { throw storageError; }

      setUploadMessage('Archivo DICOM subido a Storage. Guardando metadatos...');

      const { data: dbData, error: dbError } = await supabase
        .from('dicom_studies')
        .insert([{ name: name, description: description, storage_path: storagePath, file_name: dicomFile.name }])
        .select();

      if (dbError) { throw dbError; }

      setName('');
      setDescription('');
      setDicomFile(null);
      setUploadMessage('¡Estudio DICOM agregado con éxito!');
    } catch (err) {
      console.error("Error completo:", err);
      setError(`Error: ${err.message || 'Error desconocido al subir el estudio.'}`);
      setUploadMessage('');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setView('list');
  };

  const inputStyle = {
    padding: '12px 15px',
    border: `1px solid ${BORDER_COLOR}`,
    borderRadius: '6px',
    width: '100%',
    fontSize: '15px',
  };

  const labelStyle = {
    display: 'block',
    marginBottom: '10px',
    fontSize: '15px',
    fontWeight: '600',
    color: TEXT_PRIMARY,
  };

  const dragZoneStyle = {
    border: `2px dashed ${isDragging ? PRIMARY_DARK : BORDER_COLOR}`,
    backgroundColor: isDragging ? '#f0f8ff' : '#fafafa',
    padding: '40px 20px',
    textAlign: 'center',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    position: 'relative',
  };


  return (
    <div style={{ padding: '0', maxWidth: '700px', margin: 'auto' }}>

      {/* Título Principal */}
      <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#333', marginBottom: '30px' }}>
        Agregar Nuevo Estudio DICOM
      </h1>

      <div style={{ background: CARD_BG, borderRadius: '8px', boxShadow: '0 4px 8px rgba(0, 0, 0, 0.05)', padding: '30px' }}>
        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '25px' }}>

          {/* Nombre del Paciente */}
          <div>
            <label style={labelStyle}>Nombre de paciente</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required disabled={loading} style={inputStyle} 
            placeholder="Nombre del paciente" />
          </div>

          {/* Descripción */}
          <div>
            <label style={labelStyle}>Descripción</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} required disabled={loading} style={{ ...inputStyle, minHeight: '120px', resize: 'vertical' }} 
            placeholder="Descripción o nombre de la radiografia" />
          </div>

          {/* Archivo DICOM (Drop Zone) */}
          <div>
            <label style={labelStyle}>Archivo DICOM</label>
            <div
              style={dragZoneStyle}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => document.getElementById('dicom-file-upload').click()}
            >
              <input
                type="file"
                id="dicom-file-upload"
                name="dicomFile"
                onChange={handleFileChange}
                required
                disabled={loading}
                style={{ display: 'none' }}
              />
              <p style={{ color: PRIMARY_DARK, fontSize: '30px', margin: '0 0 10px 0' }}>
                <img
                  src="/src/assets/iconCloud.svg"
                  alt="Subir Archivo"
                  style={{
                    verticalAlign: 'middle',
                    marginRight: '5px',
                    width: '40px',
                    height: '40px'
                  }}
                />
              </p>
              <p style={{ color: '#666', fontSize: '15px', margin: '0' }}>
                Arrastra tu archivo aquí <br /> o haz clic para seleccionar
              </p>
              {dicomFile && <p style={{ color: PRIMARY_DARK, marginTop: '15px', fontWeight: 'bold' }}>{dicomFile.name} seleccionado.</p>}
            </div>
          </div>

          {/* Mensajes */}
          {uploadMessage && <p style={{ color: PRIMARY_DARK, textAlign: 'center' }}>{uploadMessage}</p>}
          {error && <p style={{ color: CANCEL_COLOR, textAlign: 'center' }}>Error: {error}</p>}

          {/* Botones de Envío */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '10px' }}>
            <button
              type="submit"
              disabled={loading || !dicomFile}
              style={{
                padding: '12px 25px',
                cursor: loading || !dicomFile ? 'not-allowed' : 'pointer',
                background: PRIMARY_COLOR,
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontWeight: '600',
                transition: 'background-color 0.2s',
                opacity: loading || !dicomFile ? 0.7 : 1,
              }}
            >
              {loading ? 'Procesando...' : 'Guardar estudio'}
            </button>

            <button
              type="button"
              onClick={handleCancel}
              style={{
                padding: '12px 25px',
                background: CANCEL_COLOR,
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'background-color 0.2s',
              }}
            >
              Cancelar
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default DicomUploaderPage;