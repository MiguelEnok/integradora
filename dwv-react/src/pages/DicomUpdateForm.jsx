import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

const DicomFormPage = ({ studyToEdit, onComplete, setView }) => {

  // Colores y estilos
  const PRIMARY_COLOR = '#4a90a4'; // Color de Guardar Cambios
  const CANCEL_COLOR = '#dc3545';
  const CARD_BG = 'white';
  const BORDER_COLOR = '#e0e0e0';
  const PRIMARY_DARK = '#115e67';
  const TEXT_PRIMARY = '#333';


  const [id, setId] = useState(studyToEdit ? studyToEdit.id : null);
  const [name, setName] = useState(studyToEdit ? studyToEdit.name : '');
  const [description, setDescription] = useState(studyToEdit ? studyToEdit.description : '');
  const [dicomFile, setDicomFile] = useState(null); // Nuevo archivo a subir
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [oldStoragePath] = useState(studyToEdit ? studyToEdit.storage_path : null);
  const [isDragging, setIsDragging] = useState(false); // Estado para drag and drop

  if (!studyToEdit) {
    return <p style={{ color: CANCEL_COLOR }}>Error: No se ha seleccionado un estudio para editar.</p>;
  }

  
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
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    handleFileChange(e);
  };

  const handleUpdate = async () => {
    let newStoragePath = oldStoragePath;
    let newFileName = studyToEdit.file_name;

    if (dicomFile) {
      setMessage('Subiendo nueva imagen y eliminando la anterior...');
      newStoragePath = `dicom_files/${name.replace(/\s/g, '_')}-${Date.now()}/${dicomFile.name}`;
      newFileName = dicomFile.name;

      const { error: storageUploadError } = await supabase.storage
        .from('studies')
        .upload(newStoragePath, dicomFile, { cacheControl: '3600', upsert: false });

      if (storageUploadError) { throw new Error(`Error al subir el nuevo archivo: ${storageUploadError.message}`); }

      if (oldStoragePath && oldStoragePath !== newStoragePath) {
        const { error: storageDeleteError } = await supabase.storage.from('studies').remove([oldStoragePath]);
        if (storageDeleteError) { console.warn("Advertencia: No se pudo eliminar el archivo antiguo:", storageDeleteError); }
      }
    }

    setMessage('Actualizando metadatos en la base de datos...');
    const { error: dbError } = await supabase
      .from('dicom_studies')
      .update({ name: name, description: description, storage_path: newStoragePath, file_name: newFileName })
      .eq('id', id);

    if (dbError) { throw new Error(`Error al actualizar la base de datos: ${dbError.message}`); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!name || !description) { setError('Por favor, completa Nombre y Descripción.'); return; }
    setLoading(true);
    setMessage('Iniciando proceso de actualización...');

    try {
      await handleUpdate();
      setMessage('¡Estudio actualizado con éxito!');
      setTimeout(onComplete, 1500);
    } catch (err) {
      console.error("Error completo:", err);
      setError(`Error: ${err.message || 'Error desconocido al actualizar el estudio.'}`);
      setMessage('');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => { setView('list'); onComplete(); };

  // Estilos internos
  const inputStyle = { padding: '12px 15px', border: `1px solid ${BORDER_COLOR}`, borderRadius: '6px', width: '100%', fontSize: '15px' };
  const labelStyle = { display: 'block', marginBottom: '10px', fontSize: '15px', fontWeight: '600', color: TEXT_PRIMARY };
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

      <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: TEXT_PRIMARY, marginBottom: '30px' }}>
        {`Editar Estudio: ${studyToEdit.name}`}
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
            <label style={labelStyle}>Sobrescribir Archivo DICOM (Opcional)</label>
            <div
              style={dragZoneStyle}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => document.getElementById('dicom-file-update').click()}
            >
              <input
                type="file"
                id="dicom-file-update"
                onChange={handleFileChange}
                disabled={loading}
                style={{ display: 'none' }}
              />
              <p style={{ color: PRIMARY_DARK, fontSize: '30px', margin: '0 0 10px 0' }}>
                <img
                  src="/assets/iconCloud.svg"
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
                Arrastra el nuevo archivo aquí <br /> o haz clic para sobrescribir (Actualmente: {studyToEdit.file_name})
              </p>
              {dicomFile && <p style={{ color: PRIMARY_DARK, marginTop: '15px', fontWeight: 'bold' }}>{dicomFile.name} será el nuevo archivo.</p>}
            </div>
          </div>

          {/* Mensajes */}
          {message && <p style={{ color: PRIMARY_DARK, textAlign: 'center' }}>{message}</p>}
          {error && <p style={{ color: CANCEL_COLOR, textAlign: 'center' }}>Error: {error}</p>}

          {/* Botones de Envío */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '10px' }}>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '12px 25px',
                cursor: loading ? 'not-allowed' : 'pointer',
                background: PRIMARY_COLOR,
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontWeight: '600',
                transition: 'background-color 0.2s',
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? 'Procesando...' : 'Guardar Cambios'}
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

export default DicomFormPage;