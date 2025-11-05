import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

const DicomUploaderPage = () => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [dicomFile, setDicomFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [uploadMessage, setUploadMessage] = useState('');

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      const file = e.target.files[0];
      //validacion de tipo de archivo dicom
      if (file.type === 'application/dicom' || file.name.endsWith('.dcm') || file.name.endsWith('.DCM')) {
        setDicomFile(file);
        setError('');
      } else {
        setError('El archivo debe ser un formato DICOM (.dcm o application/dicom).');
        setDicomFile(null);
      }
    }
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
        .upload(storagePath, dicomFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (storageError) {
        throw storageError;
      }
      
      setUploadMessage('Archivo DICOM subido a Storage. Guardando metadatos...');

      const { data: dbData, error: dbError } = await supabase
        .from('dicom_studies')
        .insert([
          { 
            name: name, 
            description: description, 
            storage_path: storagePath,
            file_name: dicomFile.name
          },
        ])
        .select();

      if (dbError) {
        throw dbError;
      }

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

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: 'auto' }}>
      <h1>Agregar Nuevo Estudio DICOM (Supabase)</h1>
      <form onSubmit={handleSubmit}>
        
        <label>Nombre del Paciente/Estudio:</label>
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} required disabled={loading} style={{ width: '100%', padding: '8px', margin: '5px 0 15px 0' }} />

        <label>Descripción:</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} required disabled={loading} style={{ width: '100%', padding: '8px', margin: '5px 0 15px 0', minHeight: '100px' }} />

        <label>Archivo DICOM (.dcm):</label>
        <input type="file" onChange={handleFileChange} required disabled={loading} style={{ margin: '5px 0 20px 0' }} />

        {uploadMessage && <p style={{ color: 'blue' }}>{uploadMessage}</p>}
        {error && <p style={{ color: 'red' }}>Error: {error}</p>}
        
        <button type="submit" disabled={loading || !dicomFile} style={{ padding: '10px 20px', cursor: loading ? 'not-allowed' : 'pointer' }}>
          {loading ? 'Procesando...' : 'Guardar Estudio'}
        </button>

      </form>
    </div>
  );
};

export default DicomUploaderPage;