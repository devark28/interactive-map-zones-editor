import { useState } from 'react';
import Map from './components/Map';

function App() {
    const [drawingMode, setDrawingMode] = useState(null);
    const [isReady, setIsReady] = useState(false);

    const handleButtonClick = (mode) => {
        setDrawingMode(mode);
    };

    return (
        <div style={{ width: '100%', height: '100vh', display: 'flex', flexDirection: 'column', padding: '1rem' }}>
            {/* EXTERNAL BUTTONS FOR DRAWING MODES */}
            <div style={{
                bottom: '20px',
                right: '20px',
                zIndex: 10, // Ensure buttons are above the map
                backgroundColor: 'white',
                padding: '10px',
                borderRadius: '8px',
                boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                display: 'flex',
                gap: '10px',
            }} disabled={!isReady}>
                <span style={{ marginRight: '10px', fontWeight: 'bold' }}>Drawing Tools:</span>
                <button
                    onClick={() => handleButtonClick(null)} // 'Select' corresponds to null (pan tool)
                    style={{
                        padding: '8px 12px',
                        backgroundColor: drawingMode === null ? '#343A40' : 'white', // Darker for selected
                        color: drawingMode === null ? 'white' : 'black', // White text for selected
                        border: '1px solid #ccc',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px'
                    }}
                >
                    <span className="material-icons" style={{ fontSize: '18px' }}>🖐️</span> Select
                </button>
                <button
                    onClick={() => handleButtonClick('rectangle')}
                    style={{
                        padding: '8px 12px',
                        backgroundColor: drawingMode === 'rectangle' ? '#e0e0e0' : 'white',
                        border: '1px solid #ccc',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px'
                    }}
                >
                    <span style={{ fontSize: '18px' }}>◻️</span> Rectangle
                </button>
                <button
                    onClick={() => handleButtonClick('circle')}
                    style={{
                        padding: '8px 12px',
                        backgroundColor: drawingMode === 'circle' ? '#e0e0e0' : 'white',
                        border: '1px solid #ccc',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px'
                    }}
                >
                    <span style={{ fontSize: '18px' }}>◯</span> Circle
                </button>
                <button
                    onClick={() => handleButtonClick('polygon')} // 'Triangle' uses 'polygon' mode
                    style={{
                        padding: '8px 12px',
                        backgroundColor: drawingMode === 'polygon' ? '#e0e0e0' : 'white',
                        border: '1px solid #ccc',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px'
                    }}
                >
                    <span style={{ fontSize: '18px' }}>△</span> Triangle
                </button>
            </div>
            <Map
                googleMapsApiKey="google-maps-api-key"
                drawingMode={drawingMode}
                onReady={() => setIsReady(true)}
                onChange={(shape) => console.log(shape)}
                onDrawingModeChange={(mode) => setDrawingMode(mode)}
                mapContainerStyle={{
                    height: '100%',
                    marginTop: '1rem',
                    marginBlock: '1rem',
                    borderRadius: '8px',
                }}
            />
        </div>
    );
}

export default App;