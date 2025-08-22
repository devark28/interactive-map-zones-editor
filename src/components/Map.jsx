import React, {useEffect, useRef, useCallback} from 'react';
import {APIProvider, Map as GoogleMap, useMap, useMapsLibrary} from '@vis.gl/react-google-maps';

function generateId(length = 7) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let id = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * chars.length);
    id += chars[randomIndex];
  }
  return id;
}

const scriptLibraries = ['drawing', 'geometry', 'marker'];

function InteractiveMap({
  onChange,
  drawingMode,
  onDrawingModeChange,
  onReady,
  googleMapsApiKey,
  mapContainerClassName,
  center,
  features = [],
}) {
  return (
    <APIProvider apiKey={googleMapsApiKey} libraries={scriptLibraries}>
      <div
        className={mapContainerClassName}
      >
        <GoogleMap
          mapId="aPjEtS0by8"
          defaultCenter={center}
          defaultZoom={10}
          streetViewControl={false}
          mapTypeControl={false}
          fullscreenControl={false}
          className="w-full h-full"
        >
          <DrawingManagerBridge
            drawingMode={drawingMode}
            onChange={onChange}
            onDrawingModeChange={onDrawingModeChange}
            onReady={onReady}
            features={features}
          />
        </GoogleMap>
      </div>
    </APIProvider>
  );
}

function DrawingManagerBridge({drawingMode, onChange, onDrawingModeChange, onReady, features}) {
  const map = useMap();
  const drawing = useMapsLibrary('drawing');
  const geometry = useMapsLibrary('geometry');

  const managerRef = useRef(null);
  const overlayByIdRef = useRef(new Map()); // id -> overlay
  const idByOverlayRef = useRef(new WeakMap()); // overlay -> id

  const toGeoJSON = useCallback((shape, type) => {
    if (type === 'polyline') {
      const coords = shape.getPath().getArray().map((p) => [p.lng(), p.lat()]);
      return {type: 'LineString', coordinates: coords};
    }
    if (type === 'polygon') {
      const coords = shape.getPath().getArray().map((p) => [p.lng(), p.lat()]);
      return {type: 'Polygon', coordinates: [coords]};
    }
    if (type === 'circle' && geometry) {
      const center = shape.getCenter();
      const radius = shape.getRadius();
      const steps = 64;
      const coords = [];
      for (let i = 0; i <= steps; i++) {
        const point = geometry.spherical.computeOffset(center, radius, (i * 360) / steps);
        coords.push([point.lng(), point.lat()]);
      }
      return {type: 'Polygon', coordinates: [coords]};
    }
    if (type === 'rectangle') {
      const bounds = shape.getBounds();
      const ne = bounds.getNorthEast();
      const sw = bounds.getSouthWest();
      return {
        type: 'Polygon',
        coordinates: [[
          [sw.lng(), ne.lat()],
          [ne.lng(), ne.lat()],
          [ne.lng(), sw.lat()],
          [sw.lng(), sw.lat()],
          [sw.lng(), ne.lat()]
        ]],
      };
    }
    return null;
  }, [geometry]);

  const emitChange = useCallback((overlay, type) => {
    const id = idByOverlayRef.current.get(overlay);
    if (!id) return;
    const geometryObj = toGeoJSON(overlay, type);
    if (!geometryObj) return;
    onChange && onChange({
      type: 'Feature',
      properties: {
        id,
        kind: type,
      }, // Required for some visualizers like https://geojson.io
      geometry: geometryObj
    });
  }, [onChange, toGeoJSON]);

  const wireOverlayListeners = useCallback((overlay, type, id) => {
    idByOverlayRef.current.set(overlay, id);
    if (type === 'polygon' || type === 'polyline') {
      const path = overlay.getPath();
      path.addListener('set_at', () => emitChange(overlay, type));
      path.addListener('insert_at', () => emitChange(overlay, type));
    } else if (type === 'circle') {
      overlay.addListener('center_changed', () => emitChange(overlay, type));
      overlay.addListener('radius_changed', () => emitChange(overlay, type));
    } else if (type === 'rectangle') {
      overlay.addListener('bounds_changed', () => emitChange(overlay, type));
    }
  }, [emitChange]);

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
      const overlay = e.overlay;
      const type = e.type;
      const id = generateId();

      overlayByIdRef.current.set(id, overlay);
      idByOverlayRef.current.set(overlay, id);

      wireOverlayListeners(overlay, type, id);
      emitChange(overlay, type);
      onDrawingModeChange && onDrawingModeChange(null);
    });

    onReady && onReady();

    return () => {
      if (overlayCompleteListener) overlayCompleteListener.remove();
      manager.setMap(null);
      managerRef.current = null;
    };
  }, [map, drawing, drawingMode, onDrawingModeChange, onReady, wireOverlayListeners, emitChange]);

  useEffect(() => {
    if (!managerRef.current) return;
    managerRef.current.setDrawingMode(drawingMode ?? null);
  }, [drawingMode]);

  // Render initial features (e.g., polygons/lines) when provided
  useEffect(() => {
    if (!map || !window.google) return;
    const gmaps = window.google.maps;

    features?.forEach((f) => {
      if (!f || !f.id || overlayByIdRef.current.has(f.id)) return;

      // Expecting f.geometry in GeoJSON-like shape: {type: 'Polygon'|'LineString', coordinates: [...]}
      const geom = f.geometry;
      if (!geom || !geom.type) return;

      if (geom.type === 'Polygon' && Array.isArray(geom.coordinates?.[0])) {
        const path = geom.coordinates[0].map(([lng, lat]) => ({lat, lng}));
        const polygon = new gmaps.Polygon({
          paths: path,
          map,
          fillColor: '#00FF00',
          fillOpacity: 0.35,
          strokeColor: '#00FF00',
          strokeOpacity: 0.8,
          strokeWeight: 2,
          editable: true,
          clickable: true,
          zIndex: 1
        });
        overlayByIdRef.current.set(f.id, polygon);
        idByOverlayRef.current.set(polygon, f.id);
        wireOverlayListeners(polygon, 'polygon', f.id);
      } else if (geom.type === 'LineString' && Array.isArray(geom.coordinates)) {
        const path = geom.coordinates.map(([lng, lat]) => ({lat, lng}));
        const polyline = new gmaps.Polyline({
          path,
          map,
          strokeColor: '#FF0000',
          strokeOpacity: 0.8,
          strokeWeight: 2,
          editable: true,
          clickable: true,
          zIndex: 1
        });
        overlayByIdRef.current.set(f.id, polyline);
        idByOverlayRef.current.set(polyline, f.id);
        wireOverlayListeners(polyline, 'polyline', f.id);
      }
      // Note: circles/rectangles could be supported if the state stores center / radius or bounds.
    });
  }, [features, map, wireOverlayListeners]);

  return null;
}

export default React.memo(InteractiveMap);