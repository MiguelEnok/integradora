import { useState } from 'react';
import { supabase } from '../supabaseClient';

const DicomFormPage = ({ studyToEdit, onComplete, setView }) => {

  const [id, setId] = useState(studyToEdit ? studyToEdit.id : null);
  const [name, setName] = useState(studyToEdit ? studyToEdit.name : '');
  const [description, setDescription] = useState(studyToEdit ? studyToEdit.description : '');
  const [dicomFile, setDicomFile] = useState(null); // Nuevo archivo a subir
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  
  const [oldStoragePath] = useState(studyToEdit ? studyToEdit.storage_path : null);

  if (!studyToEdit) {
      return <p style={{ color: 'red' }}>Error: No se ha seleccionado un estudio para editar.</p>;
  }

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      const file = e.target.files[0];

      if (file.type === 'application/dicom' || file.name.endsWith('.dcm') || file.name.endsWith('.DCM')) {
        setDicomFile(file);
        setError('');
      } else {
        setError('El archivo debe ser un formato DICOM (.dcm o application/dicom).');
        setDicomFile(null);
      }
    }
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

        if (storageUploadError) {
            throw new Error(`Error al subir el nuevo archivo: ${storageUploadError.message}`);
        }
        
        if (oldStoragePath && oldStoragePath !== newStoragePath) {
             const { error: storageDeleteError } = await supabase.storage
                .from('studies') 
                .remove([oldStoragePath]);

            if (storageDeleteError) {
                console.warn("Advertencia: No se pudo eliminar el archivo antiguo de Storage:", storageDeleteError);
            }
        }
    }

    setMessage('Actualizando metadatos en la base de datos...');
    
    const { error: dbError } = await supabase
      .from('dicom_studies')
      .update({
        name: name,
        description: description,
        storage_path: newStoragePath,
        file_name: newFileName,
      })
      .eq('id', id);

    if (dbError) {
        throw new Error(`Error al actualizar la base de datos: ${dbError.message}`);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name || !description) {
      setError('Por favor, completa Nombre y Descripción.');
      return;
    }

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

  const handleCancel = () => {
    setView('list');
    onComplete();
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: 'auto' }}>
      <h1>{`Editar Estudio: ${studyToEdit.name}`}</h1>

      <form onSubmit={handleSubmit}>

        <label>Nombre del Paciente/Estudio:</label>
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} required disabled={loading} style={{ width: '100%', padding: '8px', margin: '5px 0 15px 0' }} />

        <label>Descripción:</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} required disabled={loading} style={{ width: '100%', padding: '8px', margin: '5px 0 15px 0', minHeight: '100px' }} />

        <label>Archivo DICOM (.dcm):</label>
        <input 
            type="file" 
            onChange={handleFileChange} 
            disabled={loading} 
            style={{ margin: '5px 0 20px 0' }} 
        />
        {dicomFile && <p style={{ color: 'green' }}>**Nuevo archivo seleccionado:** {dicomFile.name}</p>}

        {message && <p style={{ color: 'blue' }}>{message}</p>}
        {error && <p style={{ color: 'red' }}>Error: {error}</p>}

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
          <button
            type="submit"
            disabled={loading}
            style={{ padding: '10px 20px', cursor: loading ? 'not-allowed' : 'pointer', background: '#007bff' }}
          >
            {loading ? 'Procesando...' : 'Guardar Cambios'}
          </button>
          <button
            type="button"
            onClick={handleCancel}
            style={{ padding: '10px 20px', background: '#dc3545', color: 'white', border: 'none' }}
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
};

export default DicomFormPage;