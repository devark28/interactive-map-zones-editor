import {useState} from 'react';
import Map from './components/Map';

const tools = [
  {
    value: null, // 'Select' corresponds to null (pan tool)
    label: <><span className="material-icons" style={{fontSize: '18px'}}>🖐️</span> Select</>,
    style: {
      padding: '8px 12px',
      backgroundColor: 'white', // Darker for selected
      color: 'black', // White text for selected
      border: '1px solid #ccc',
      borderRadius: '4px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '5px'
    },
    styleSelected: {
      backgroundColor: '#343A40',
      color: 'white',
    }
  },
  {
    value: 'rectangle',
    label: <><span style={{fontSize: '18px'}}>□</span> Rectangle</>,
    style: {
      padding: '8px 12px',
      backgroundColor: 'white',
      border: '1px solid #ccc',
      borderRadius: '4px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '5px'
    },
    styleSelected: {
      backgroundColor: '#e0e0e0',
    }
  },
  {
    value: 'circle',
    label: <><span style={{fontSize: '18px'}}>◯</span> Circle</>,
    style: {
      padding: '8px 12px',
      backgroundColor: 'white',
      border: '1px solid #ccc',
      borderRadius: '4px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '5px'
    },
    styleSelected: {
      backgroundColor: '#e0e0e0',
    }
  },
  {
    value: 'polygon',
    label: <><span style={{fontSize: '18px'}}>△</span> Triangle</>,
    style: {
      padding: '8px 12px',
      backgroundColor: 'white',
      border: '1px solid #ccc',
      borderRadius: '4px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '5px'
    },
    styleSelected: {
      backgroundColor: '#e0e0e0',
    }
  },
];

function App() {
  const [drawingMode, setDrawingMode] = useState(null);
  const [isReady, setIsReady] = useState(false);

  const handleButtonClick = (mode) => {
    setDrawingMode(mode);
  };

  return (
    <div style={{width: '100%', height: '100vh', display: 'flex', flexDirection: 'column', padding: '1rem'}}>
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
      }}>
        <span style={{marginRight: '10px', fontWeight: 'bold'}}>Drawing Tools:</span>
        {tools.map(tool => {
          return (
            <button
              key={tool.value}
              onClick={() => isReady && handleButtonClick(tool.value)}
              style={(
                drawingMode === tool.value ? {
                  ...tool.style,
                  ...tool.styleSelected,
                } : {
                  ...tool.style,
                }
              )}
            >
              {tool.label}
            </button>
          );
        })}
      </div>
      <Map
        googleMapsApiKey="google-maps-api-key"
        drawingMode={drawingMode}
        onReady={() => setIsReady(true)}
        onChange={(shape) => console.log(shape)}
        onDrawingModeChange={(mode) => setDrawingMode(mode)}
        mapContainerStyle={{
          height: '100%',
          width: '100%',
          marginTop: '1rem',
          marginBlock: '1rem',
          borderRadius: '8px',
        }}
        center={{
          lat: 34.052235,
          lng: -118.243683,
        }}
      />
    </div>
  );
}

export default App;