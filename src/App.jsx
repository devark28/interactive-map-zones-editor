import React, { useState, useCallback, useEffect } from 'react';
import {
    GoogleMap,
    LoadScript,
    DrawingManager,
} from '@react-google-maps/api';

const containerStyle = {
    height: '100%',
    marginTop: '1rem',
    marginBlock: '1rem',
    borderRadius: '8px',
};

const center = {
    lat: 34.052235,
    lng: -118.243683,
};

const scriptLibraries = ['drawing', 'geometry', 'marker'];

function App() {
    const [googleMapsApi, setGoogleMapsApi] = useState(null);
    const [drawingMode, setDrawingMode] = useState(null); // State to control drawing mode

    const handleApiLoaded = useCallback((map, maps) => {
        setGoogleMapsApi(maps);
    }, []);

    const handleOverlayComplete = (e) => {
        const shape = e.overlay;
        const type = e.type;

        console.log(`Drawn ${type}:`, shape);

        // After drawing, you might want to reset the drawing mode
        // to null (hand tool) so the user doesn't accidentally draw another shape.
        setDrawingMode(null);

        // ... (your existing logic for logging shape data)
        // if (type === 'marker') {
        //     console.log('Point:', {
        //         type: 'Point',
        //         coordinates: [
        //             shape.getPosition().lng(),
        //             shape.getPosition().lat(),
        //         ],
        //     });
        // } else 
        if (type === 'polyline') {
            const coords = shape
                .getPath()
                .getArray()
                .map((p) => [p.lng(), p.lat()]);
            console.log('LineString:', {
                type: 'LineString',
                coordinates: coords,
            });
        } else if (type === 'polygon') {
            const coords = shape
                .getPath()
                .getArray()
                .map((p) => [p.lng(), p.lat()]);
            console.log('Polygon:', {
                type: 'Polygon',
                coordinates: [coords],
            });
        } else if (type === 'circle') {
            const center = shape.getCenter();
            const radius = shape.getRadius(); // in meters

            const steps = 64; // the more steps, the smoother the circle

            const coords = [];

            for (let i = 0; i <= steps; i++) {
                const angle = (i / steps) * 2 * Math.PI;
                const dx = radius * Math.cos(angle);
                const dy = radius * Math.sin(angle);

                // Offset in degrees using ~111km per degree approximation
                const point = googleMapsApi.geometry.spherical.computeOffset(center, radius, (i * 360) / steps);
                coords.push([point.lng(), point.lat()]);
            }

            const geojsonCircle = {
                type: 'Polygon',
                coordinates: [coords],
            };

            console.log('Circle:', geojsonCircle);
        } else if (type === 'rectangle') {
            const bounds = shape.getBounds();
            const northEast = bounds.getNorthEast();
            const southWest = bounds.getSouthWest();
            console.log('Rectangle:', {
                type: 'Polygon',
                coordinates: [[
                    [southWest.lng(), northEast.lat()], // Top-left
                    [northEast.lng(), northEast.lat()], // Top-right
                    [northEast.lng(), southWest.lat()], // Bottom-right
                    [southWest.lng(), southWest.lat()], // Bottom-left
                    [southWest.lng(), northEast.lat()]  // Close the polygon
                ]],
            });
        }
    };

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
            }} disabled={!!googleMapsApi}>
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
            <LoadScript
                googleMapsApiKey="google-maps-api-key"
                libraries={scriptLibraries}
            >
                <GoogleMap
                    mapContainerStyle={containerStyle}
                    center={center}
                    zoom={10}
                    onLoad={(map) => {
                        handleApiLoaded(map, window.google.maps);
                    }}
                    options={{
                        mapId: "aPjEtS0by8",
                        fullscreenControl: false,
                        streetViewControl: false,
                    }}
                >
                    {googleMapsApi && (
                        <DrawingManager
                            options={{
                                drawingControl: false, // HIDE THE DEFAULT CONTROL
                                polylineOptions: {
                                    strokeColor: '#FF0000', // Red stroke for polylines
                                    strokeOpacity: 0.8,
                                    strokeWeight: 2,
                                    clickable: true,
                                    editable: true,
                                    zIndex: 1
                                },
                                polygonOptions: {
                                    fillColor: '#00FF00', // Green fill for polygons
                                    fillOpacity: 0.35,
                                    strokeColor: '#00FF00', // Green stroke for polygons
                                    strokeOpacity: 0.8,
                                    strokeWeight: 2,
                                    clickable: true,
                                    editable: true,
                                    zIndex: 1
                                },
                                circleOptions: {
                                    fillColor: '#0000FF', // Blue fill for circles
                                    fillOpacity: 0.35,
                                    strokeColor: '#0000FF', // Blue stroke for circles
                                    strokeOpacity: 0.8,
                                    strokeWeight: 2,
                                    clickable: true,
                                    editable: true,
                                    zIndex: 1
                                },
                                // ADD THIS FOR RECTANGLE STYLING
                                rectangleOptions: {
                                    fillColor: '#FFA500', // Orange fill for rectangles
                                    fillOpacity: 0.35,
                                    strokeColor: '#FFA500', // Orange stroke for rectangles
                                    strokeOpacity: 0.8,
                                    strokeWeight: 2,
                                    clickable: true,
                                    editable: true,
                                    zIndex: 1
                                }
                            }}
                            drawingMode={drawingMode} // CONTROL DRAWING MODE WITH STATE
                            onOverlayComplete={handleOverlayComplete}
                        />
                    )}
                </GoogleMap>
            </LoadScript>
        </div>
    );
}

export default App;