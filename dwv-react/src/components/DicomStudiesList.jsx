import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const PRIMARY_COLOR = '#115e67';
const DELETE_COLOR = '#dc3545';
const DOWNLOAD_COLOR = '#28a745';
const TEXT_PRIMARY = '#333';

const tableHeaderStyle = {
    padding: '12px 15px',
    textAlign: 'left',
    color: '#333',
    fontWeight: '600',
    fontSize: '14px',
    borderBottom: '2px solid #e0e0e0', // Solo borde inferior
};
const tableCellStyle = {
    padding: '15px',
    fontSize: '14px',
    color: '#111111ff',
    borderBottom: '1px solid #f0f0f0',
};
const cardStyle = {
    background: 'white',
    borderRadius: '8px',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.05)',
    padding: '30px',
};


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

const DicomStudiesList = ({ onSelectStudy, setView, onEditStudy }) => {
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
            query = query.ilike('name', `%${searchTerm}%`);
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

    if (loading) return <div style={{ padding: '20px', textAlign: 'center' }}>Cargando estudios...</div>;
    if (error) return <p style={{ color: DELETE_COLOR, padding: '20px' }}>{error}</p>;

    const clickableCellStyle = {
        ...tableCellStyle,
        cursor: 'pointer',
        color: PRIMARY_COLOR, // Resaltar para indicar que es clicable
        fontWeight: '500',
    };

    return (
        <div style={{ marginTop: '0' }}>

            {/* Título Principal */}
            <h2 style={{ fontSize: '28px', fontWeight: 'bold', color: '#333', marginBottom: '30px' }}>
                Lista de pacientes
            </h2>

            <div style={{
                display: 'flex',
                marginBottom: '20px',
                alignItems: 'center',
                gap: '15px'
            }}>

                <span>Filtrar por fecha:</span>
                <select
                    value={timeFilter}
                    onChange={(e) => setTimeFilter(e.target.value)}
                    style={{
                        padding: '10px 15px',
                        border: '1px solid #ccc',
                        borderRadius: '6px',
                        background: 'white',
                        fontSize: '14px',
                        appearance: 'none', // Quita el estilo nativo para que se vea más limpio
                        paddingRight: '30px', // Espacio para el icono de flecha
                    }}
                >
                    <option value="all">Mostrar todos</option>
                    <option value="today">Hoy</option>
                    <option value="week">Última Semana</option>
                    <option value="month">Último Mes</option>
                </select>
                {/* Barra de Búsqueda */}
                <div style={{
                    display: 'flex',
                    marginLeft: 'auto',
                    flex: 1,
                    maxWidth: '400px',
                    border: '1px solid #ccc',
                    borderRadius: '6px',
                    overflow: 'hidden',
                    background: 'white'
                }}>
                    <input
                        type="text"
                        placeholder={'Buscar paciente...'}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onKeyDown={handleKeyDown}
                        style={{ padding: '10px 15px', border: 'none', flexGrow: 1, fontSize: '14px' }}
                    />
                    <button
                        onClick={handleSearch}
                        style={{ padding: '10px 12px', background: 'transparent', color: '#666', border: 'none', cursor: 'pointer' }}
                    >
                        <img
                            src="/src/assets/iconSearch.svg"
                            alt="Buscar"
                            style={{
                                verticalAlign: 'middle',
                                marginRight: '5px',
                                width: '16px',
                                height: '16px'
                            }}
                        />
                    </button>
                </div>


            </div>
            {/* ---------------------------------------------------- */}

            {studies.length === 0 ? (
                <p style={{ ...cardStyle, textAlign: 'center' }}>
                    No se encontraron estudios con los criterios de búsqueda/filtro actuales.
                </p>
            ) : (
                <div style={cardStyle}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: 'white' }}>
                                <th style={tableHeaderStyle}>Paciente</th>
                                <th style={tableHeaderStyle}>Descripción</th>
                                <th style={tableHeaderStyle}>Fecha</th>
                                <th style={tableHeaderStyle}>Acción</th>
                                {/* Eliminamos ID para simplificar la tabla visualmente, si quieres mantenerlo, agrégalo aquí */}
                            </tr>
                        </thead>
                        <tbody>
                            {studies.map((study) => (
                                <tr
                                    key={study.id}
                                    style={{ transition: 'background-color 0.2s', ':hover': { backgroundColor: '#2c5363ff' } }}
                                >
                                    <td style={{ ...clickableCellStyle, color: TEXT_PRIMARY, fontWeight: '600' }} onClick={() => onEditStudy(study)}>
                                        {study.name}
                                    </td>
                                    {/* Descripción (Clicable para edición) */}
                                    <td style={clickableCellStyle} onClick={() => onEditStudy(study)}>
                                        {study.description}
                                    </td>
                                    {/* Fecha */}
                                    <td style={{ tableCellStyle, cursor: 'pointer' }} onClick={() => onEditStudy(study)}>{formatDate(study.created_at)}</td>

                                    {/* Acciones */}
                                    <td style={tableCellStyle}>
                                        {/* Botón Descargar (Icono + Texto) */}
                                        <button
                                            onClick={() => handleDownload(study.storage_path, study.file_name)}
                                            style={{
                                                marginRight: '15px',
                                                background: 'transparent',
                                                color: PRIMARY_COLOR, // Icono de descarga visible
                                                border: 'none',
                                                fontSize: '14px',
                                                cursor: 'pointer',
                                            }}
                                        >
                                            <img
                                                src="/src/assets/iconDownload.svg"
                                                alt="Descargar"
                                                style={{
                                                    verticalAlign: 'middle',
                                                    marginRight: '5px',
                                                    width: '16px',
                                                    height: '16px'
                                                }}
                                            />
                                            Descargar
                                        </button>

                                        {/* Botón Eliminar */}
                                        <button
                                            onClick={() => handleDelete(study.id, study.storage_path)}
                                            style={{
                                                background: DELETE_COLOR,
                                                color: 'white',
                                                padding: '6px 12px',
                                                borderRadius: '4px',
                                                border: 'none',
                                                fontSize: '14px',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            Eliminar
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default DicomStudiesList;