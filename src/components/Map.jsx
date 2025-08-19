import React, { useState, useCallback, useEffect } from 'react';
import {
    GoogleMap,
    LoadScript,
    DrawingManager,
} from '@react-google-maps/api';

const scriptLibraries = ['drawing', 'geometry', 'marker'];

function Map({ onChange, drawingMode, onDrawingModeChange, onReady, googleMapsApiKey, mapContainerStyle }) {
    const [internalDrawingMode, setInternalDrawingMode] = useState(null);
    const [googleMapsApi, setGoogleMapsApi] = useState(null);

    useEffect(() => {
        setInternalDrawingMode(drawingMode);
    }, [drawingMode])

    useEffect(() => {
        onDrawingModeChange(internalDrawingMode);
    }, [internalDrawingMode])

    useEffect(() => {
        googleMapsApi && onReady();
    }, [googleMapsApi])

    const handleApiLoaded = useCallback((map, maps) => {
        setGoogleMapsApi(maps)
    }, []);

    const logShapeData = (shape, type) => {
        if (type === 'polyline') {
            const coords = shape
                .getPath()
                .getArray()
                .map((p) => [p.lng(), p.lat()]);
            onChange({
                type: 'LineString',
                coordinates: coords,
            });
        } else if (type === 'polygon') {
            const coords = shape
                .getPath()
                .getArray()
                .map((p) => [p.lng(), p.lat()]);
            onChange({
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
            onChange(geojsonCircle);
        } else if (type === 'rectangle') {
            const bounds = shape.getBounds();
            const northEast = bounds.getNorthEast();
            const southWest = bounds.getSouthWest();
            onChange({
                type: 'Polygon',
                coordinates: [[
                    [southWest.lng(), northEast.lat()],
                    [northEast.lng(), northEast.lat()],
                    [northEast.lng(), southWest.lat()],
                    [southWest.lng(), southWest.lat()],
                    [southWest.lng(), northEast.lat()]
                ]],
            });
        }
    };

    const handleOverlayComplete = (e) => {
        const shape = e.overlay;
        const type = e.type;

        // Add an event listener to the shape for changes
        if (type === 'polygon' || type === 'polyline') {
            // For polylines and polygons, listen to path changes
            googleMapsApi.event.addListener(shape.getPath(), 'set_at', () => {
                logShapeData(shape, type);
            });
            googleMapsApi.event.addListener(shape.getPath(), 'insert_at', () => {
                logShapeData(shape, type);
            });
        } else if (type === 'circle' || type === 'rectangle') {
            // For circles and rectangles, listen to center and bounds changes
            googleMapsApi.event.addListener(shape, 'bounds_changed', () => {
                logShapeData(shape, type);
            });
            googleMapsApi.event.addListener(shape, 'radius_changed', () => {
                logShapeData(shape, type);
            });
        }

        logShapeData(shape, type);

        // Reset the drawing mode
        setInternalDrawingMode(null);
    };

    return (
        <LoadScript
            googleMapsApiKey={googleMapsApiKey}
            libraries={scriptLibraries}
        >
            <GoogleMap
                mapContainerStyle={mapContainerStyle}
                zoom={10}
                onLoad={(map) => {
                    handleApiLoaded(map, window.google.maps);
                }}
                options={{
                    mapId: "aPjEtS0by8",
                    fullscreenControl: false,
                    streetViewControl: false,
                    cameraControl: false,
                    mapTypeControl: false,
                }}
            >
                {googleMapsApi && (
                    <DrawingManager
                        drawingMode={internalDrawingMode} // CONTROL DRAWING MODE WITH STATE
                        onOverlayComplete={handleOverlayComplete}
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
                    />
                )}
            </GoogleMap>
        </LoadScript>
    );
}

export default React.memo(Map);