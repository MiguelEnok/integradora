import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const tableHeaderStyle = { border: '1px solid #ddd', padding: '10px', textAlign: 'left' };
const tableCellStyle = { border: '1px solid #ddd', padding: '10px' };

const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    const isSameDay = (d1, d2) => 
        d1.getFullYear() === d2.getFullYear() &&
        d1.getMonth() === d2.getMonth() &&
        d1.getDate() === d2.getDate();

    const timeOptions = { hour: '2-digit', minute: '2-digit' };
    
    if (isSameDay(date, today)) {
        return "Hoy";
    }
    
    if (isSameDay(date, yesterday)) {
        return "Ayer";
    }

    const fullDateOptions = { year: 'numeric', month: 'short', day: 'numeric', ...timeOptions };
    return date.toLocaleDateString(undefined, fullDateOptions);
};

const DicomStudiesList = ({ onSelectStudy, setView }) => {
    const [studies, setStudies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    const [searchTerm, setSearchTerm] = useState('');
    const [timeFilter, setTimeFilter] = useState('all');

    const fetchStudies = async () => {
        setLoading(true);
        setError(null);

        let query = supabase
            .from('dicom_studies')
            .select('*')
            .order('created_at', { ascending: false });

        const now = new Date();
        
        if (timeFilter === 'today') {
            const startOfDay = new Date(now).setHours(0, 0, 0, 0);
            query = query.gte('created_at', new Date(startOfDay).toISOString());
        } else if (timeFilter === 'week') {
            const lastWeek = new Date(now);
            lastWeek.setDate(now.getDate() - 7);
            query = query.gte('created_at', lastWeek.toISOString());
        } else if (timeFilter === 'month') {
            const lastMonth = new Date(now);
            lastMonth.setMonth(now.getMonth() - 1);
            query = query.gte('created_at', lastMonth.toISOString());
        }

        if (searchTerm) {
            query = query.ilike( 'name', `%${searchTerm}%`);
        }
        
        const { data, error } = await query;

        if (error) {
            console.error("Error al obtener estudios:", error);
            setError('Error al cargar la lista de estudios.');
            setStudies([]);
        } else {
            setStudies(data);
        }
        setLoading(false);
    };

    const handleSearch = () => {
        fetchStudies();
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            fetchStudies();
        }
    };
    
    useEffect(() => {
        fetchStudies();
    }, [timeFilter]); 
    
    const handleDelete = async (id, storagePath) => {
        if (!window.confirm('¿Estás seguro de eliminar este estudio? Esto es permanente.')) {
             return;
        }
        
        const { error: storageError } = await supabase.storage.from('studies').remove([storagePath]);
        if (storageError) { setError('Error al eliminar archivo de Storage.'); return; }
        
        const { error: dbError } = await supabase.from('dicom_studies').delete().eq('id', id);
        if (dbError) { setError('Error al eliminar registro de la base de datos.'); return; }
        
        setStudies(studies.filter(study => study.id !== id));
        alert('Estudio eliminado con éxito.');
    };

    const handleDownload = (storagePath, fileName) => {
        const { data } = supabase.storage.from('studies').getPublicUrl(storagePath);
        window.open(data.publicUrl, '_blank');
        alert(`Iniciando descarga de ${fileName}.`);
    };
    
    if (loading) return <p>Cargando estudios...</p>;
    if (error) return <p style={{ color: 'red' }}>{error}</p>;

    return (
        <div style={{ marginTop: '20px' }}>
            <h2>Estudios Guardados ({studies.length})</h2>

            <div style={{ display: 'flex', gap: '20px', marginBottom: '20px', alignItems: 'center' }}>
                
                <label>Filtrar por Fecha:</label>
                <select 
                    value={timeFilter} 
                    onChange={(e) => setTimeFilter(e.target.value)} 
                    style={{ padding: '8px', border: '1px solid #ccc' }}
                >
                    <option value="all">Mostrar Todos</option>
                    <option value="today">Hoy</option>
                    <option value="week">Última Semana</option>
                    <option value="month">Último Mes</option>
                </select>

                <div style={{ display: 'flow', border: '1px solid #ccc', borderRadius: '4px', overflow: 'hidden' }}>
                    <input
                        type="text"
                        placeholder={'Buscar paciente'}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onKeyDown={handleKeyDown} 
                        style={{ padding: '8px', border: 'none', flexGrow: 1 }}
                    />
                    <button 
                        onClick={handleSearch} 
                        style={{ padding: '8px 12px', background: '#d3d3d3ff', color: 'white', border: 'none', cursor: 'pointer' }}
                    >
                        🔍
                    </button>
                </div>
            </div>

            {studies.length === 0 ? (
                 <p>No se encontraron estudios con los criterios de búsqueda/filtro actuales.</p>
            ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ background: '#f2f2f2' }}>
                            <th style={tableHeaderStyle}>ID</th>
                            <th style={tableHeaderStyle}>Paciente</th>
                            <th style={tableHeaderStyle}>Descripción</th>
                            <th style={tableHeaderStyle}>Acciones</th>
                            <th style={tableHeaderStyle}>Fecha de Carga</th> 
                        </tr>
                    </thead>
                    <tbody>
                        {studies.map((study) => (
                            <tr key={study.id}>
                                <td style={tableCellStyle}>{study.id}</td>
                                <td style={tableCellStyle}>{study.name}</td>
                                <td style={tableCellStyle}>{study.description}</td>
                                <td style={tableCellStyle}>
                                    <button
                                        onClick={() => handleDownload(study.storage_path, study.file_name)}
                                        style={{ marginRight: '10px', background: '#28a745', color: 'white' }}
                                    >
                                        Descargar Imagen
                                    </button>
                                    <button onClick={() => handleDelete(study.id, study.storage_path)} style={{ background: 'red', color: 'white' }}>
                                        Eliminar
                                    </button>
                                </td>
                                <td style={tableCellStyle}>{formatDate(study.created_at)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
};

export default DicomStudiesList;