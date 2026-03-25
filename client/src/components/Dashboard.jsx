export default function Dashboard() {
    
    const handleGoogleConnect = () => {

        window.location.href = '/api/auth/google';
    };

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px', fontFamily: 'sans-serif' }}>
            <h1>Smartsphere Dashboard</h1>
            <p style={{ color: '#555', marginBottom: '30px' }}>
                Connect your cloud storage providers to aggregate your files.
            </p>
            
            <div style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
                <h3 style={{ marginTop: 0 }}>Google Drive</h3>
                <p style={{ fontSize: '14px', color: '#666' }}>Status: Not Connected</p>
                <button 
                    onClick={handleGoogleConnect}
                    style={{
                        padding: '10px 20px',
                        backgroundColor: '#4285F4',
                        color: 'white',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        fontSize: '14px'
                    }}
                >
                    Connect Google Drive
                </button>
            </div>
        </div>
    );
}