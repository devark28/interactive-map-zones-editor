import React, {useEffect, useRef, useCallback} from 'react';
import {APIProvider, Map as GoogleMap, useMap, useMapsLibrary} from '@vis.gl/react-google-maps';

const scriptLibraries = ['drawing', 'geometry', 'marker'];

function Map({onChange, drawingMode, onDrawingModeChange, onReady, googleMapsApiKey, mapContainerStyle, center}) {
  return (
    <APIProvider apiKey={googleMapsApiKey} libraries={scriptLibraries}>
      <div style={{overflow: "hidden", ...mapContainerStyle}}>
        <GoogleMap
          mapId="aPjEtS0by8"
          defaultCenter={center}
          defaultZoom={10}
          streetViewControl={false}
          mapTypeControl={false}
          fullscreenControl={false}
          style={{width: '100%', height: '100%'}}
        >
          <DrawingManagerBridge
            drawingMode={drawingMode}
            onChange={onChange}
            onDrawingModeChange={onDrawingModeChange}
            onReady={onReady}
          />
        </GoogleMap>
      </div>
    </APIProvider>
  );
}

function DrawingManagerBridge({drawingMode, onChange, onDrawingModeChange, onReady}) {
  const map = useMap();
  const drawing = useMapsLibrary('drawing');
  const geometry = useMapsLibrary('geometry');

  const managerRef = useRef(null);

  const logShapeData = useCallback((shape, type) => {
    if (type === 'polyline') {
      const coords = shape.getPath().getArray().map((p) => [p.lng(), p.lat()]);
      onChange && onChange({
        type: 'LineString',
        coordinates: coords,
      });
    } else if (type === 'polygon') {
      const coords = shape.getPath().getArray().map((p) => [p.lng(), p.lat()]);
      onChange && onChange({
        type: 'Polygon',
        coordinates: [coords],
      });
    } else if (type === 'circle' && geometry) {
      const center = shape.getCenter();
      const radius = shape.getRadius(); // in meters
      const steps = 64;
      const coords = [];
      for (let i = 0; i <= steps; i++) {
        const point = geometry.spherical.computeOffset(center, radius, (i * 360) / steps);
        coords.push([point.lng(), point.lat()]);
      }
      onChange && onChange({
        type: 'Polygon',
        coordinates: [coords],
      });
    } else if (type === 'rectangle') {
      const bounds = shape.getBounds();
      const northEast = bounds.getNorthEast();
      const southWest = bounds.getSouthWest();
      onChange && onChange({
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
  }, [geometry, onChange]);

  useEffect(() => {
    if (!map || !drawing) return;

    const manager = new drawing.DrawingManager({
      drawingMode: drawingMode ?? null,
      drawingControl: false,
      polylineOptions: {
        strokeColor: '#FF0000',
        strokeOpacity: 0.8,
        strokeWeight: 2,
        clickable: true,
        editable: true,
        zIndex: 1
      },
      polygonOptions: {
        fillColor: '#00FF00',
        fillOpacity: 0.35,
        strokeColor: '#00FF00',
        strokeOpacity: 0.8,
        strokeWeight: 2,
        clickable: true,
        editable: true,
        zIndex: 1
      },
      circleOptions: {
        fillColor: '#0000FF',
        fillOpacity: 0.35,
        strokeColor: '#0000FF',
        strokeOpacity: 0.8,
        strokeWeight: 2,
        clickable: true,
        editable: true,
        zIndex: 1
      },
      rectangleOptions: {
        fillColor: '#FFA500',
        fillOpacity: 0.35,
        strokeColor: '#FFA500',
        strokeOpacity: 0.8,
        strokeWeight: 2,
        clickable: true,
        editable: true,
        zIndex: 1
      }
    });

    manager.setMap(map);
    managerRef.current = manager;

    const overlayCompleteListener = manager.addListener('overlaycomplete', (e) => {
      const shape = e.overlay;
      const type = e.type;

      if (type === 'polygon' || type === 'polyline') {
        const path = shape.getPath();
        path.addListener('set_at', () => logShapeData(shape, type));
        path.addListener('insert_at', () => logShapeData(shape, type));
      } else if (type === 'circle') {
        shape.addListener('center_changed', () => logShapeData(shape, type));
        shape.addListener('radius_changed', () => logShapeData(shape, type));
      } else if (type === 'rectangle') {
        shape.addListener('bounds_changed', () => logShapeData(shape, type));
      }

      logShapeData(shape, type);
      onDrawingModeChange && onDrawingModeChange(null);
    });

    onReady && onReady();

    return () => {
      if (overlayCompleteListener) overlayCompleteListener.remove();
      manager.setMap(null);
      managerRef.current = null;
    };
  }, [map, drawing, logShapeData, onDrawingModeChange, onReady, drawingMode]);

  useEffect(() => {
    if (!managerRef.current) return;
    managerRef.current.setDrawingMode(drawingMode ?? null);
  }, [drawingMode]);

  return null;
}

export default React.memo(Map);