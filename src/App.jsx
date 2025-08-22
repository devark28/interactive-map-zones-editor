import {useState} from 'react';
import InteractiveMap from './components/Map';

const tools = [
  { value: null, label: <><span className="text-lg">🖐️</span> Select</> },
  { value: 'rectangle', label: <><span className="text-lg">□</span> Rectangle</> },
  { value: 'circle', label: <><span className="text-lg">◯</span> Circle</> },
  { value: 'polygon', label: <><span className="text-lg">△</span> Triangle</> },
];

function App() {
  const [drawingMode, setDrawingMode] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const [features, setFeatures] = useState([]); // {id, kind, geometry}

  const handleButtonClick = (mode) => setDrawingMode(mode);

  const handleShapeChange = (payload) => {
    // payload: {id, kind, geometry}
    setFeatures((prev) => {
      const idx = prev.findIndex((f) => f.id === payload.id);
      if (idx === -1) {
        return [...prev, payload];
      }
      const copy = prev.slice();
      copy[idx] = {...prev[idx], ...payload};
      return copy;
    });
    // you can persist or inspect here
    console.log('shape change:', payload);
  };

  return (
    <div className="w-full h-screen flex flex-col p-4">
      <div className="z-10 bg-white p-3 rounded-lg shadow flex gap-2 items-center">
        <span className="mr-2 font-bold">Drawing Tools:</span>
        {tools.map((tool) => {
          const selected = drawingMode === tool.value;
          return (
            <button
              key={String(tool.value)}
              onClick={() => isReady && handleButtonClick(tool.value)}
              className={[
                'px-3 py-2 rounded border flex items-center gap-1',
                selected ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-black border-gray-300 hover:bg-gray-100'
              ].join(' ')}
            >
              {tool.label}
            </button>
          );
        })}
      </div>

      <InteractiveMap
        googleMapsApiKey="google-maps-api-key"
        drawingMode={drawingMode}
        onReady={() => setIsReady(true)}
        onChange={handleShapeChange}
        onDrawingModeChange={(mode) => setDrawingMode(mode)}
        mapContainerClassName="h-full w-full mt-4 rounded-lg overflow-hidden"
        center={{ lat: 34.052235, lng: -118.243683 }}
        features={features} // If this state starts with polygons, they render immediately
      />
    </div>
  );
}

export default App;