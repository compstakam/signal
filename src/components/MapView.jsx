import { useEffect, useRef, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import 'leaflet-draw';
import { milesToMeters } from '../utils/geoUtils';

// Fix default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const highlightIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function DrawControl({ onShapeDrawn }) {
  const map = useMap();
  const drawnItemsRef = useRef(null);

  useEffect(() => {
    const drawnItems = new L.FeatureGroup();
    drawnItemsRef.current = drawnItems;
    map.addLayer(drawnItems);

    const drawControl = new L.Control.Draw({
      draw: {
        polyline: false,
        circle: false,
        circlemarker: false,
        marker: false,
        polygon: { shapeOptions: { color: '#3b82f6', weight: 2 } },
        rectangle: { shapeOptions: { color: '#3b82f6', weight: 2 } },
      },
      edit: { featureGroup: drawnItems },
    });
    map.addControl(drawControl);

    map.on(L.Draw.Event.CREATED, (e) => {
      drawnItems.clearLayers();
      drawnItems.addLayer(e.layer);
      const layer = e.layer;

      if (e.layerType === 'rectangle') {
        onShapeDrawn({ type: 'bounds', bounds: layer.getBounds() });
      } else if (e.layerType === 'polygon') {
        onShapeDrawn({ type: 'polygon', latlngs: layer.getLatLngs()[0] });
      }
    });

    map.on(L.Draw.Event.DELETED, () => {
      onShapeDrawn(null);
    });

    return () => {
      map.removeControl(drawControl);
      map.removeLayer(drawnItems);
    };
  }, [map, onShapeDrawn]);

  return null;
}

function FitBounds({ leads }) {
  const map = useMap();
  const fitted = useRef(false);

  useEffect(() => {
    if (leads.length > 0 && !fitted.current) {
      const bounds = L.latLngBounds(leads.map(l => [l.lat, l.lng]));
      map.fitBounds(bounds, { padding: [30, 30] });
      fitted.current = true;
    }
  }, [leads, map]);

  return null;
}

function FlyToSelected({ lead }) {
  const map = useMap();
  useEffect(() => {
    if (lead) {
      map.flyTo([lead.lat, lead.lng], 16, { duration: 0.5 });
    }
  }, [lead, map]);
  return null;
}

export default function MapView({ leads, circle, selectedLead, onShapeDrawn }) {
  const markers = useMemo(() => {
    const maxMarkers = 500;
    const displayLeads = leads.length > maxMarkers ? leads.slice(0, maxMarkers) : leads;

    return displayLeads.map((lead, i) => (
      <Marker
        key={`${lead.lat}-${lead.lng}-${i}`}
        position={[lead.lat, lead.lng]}
        icon={selectedLead === lead ? highlightIcon : new L.Icon.Default()}
      >
        <Popup>
          <div className="text-sm">
            <strong>{lead.tenantName}</strong>
            <br />{lead.tenantIndustry}
            <br />{lead.address}, {lead.city}, {lead.state} {lead.zip}
            <br />{lead.sqft?.toLocaleString()} sq ft
            <br />Commenced: {lead.commencementDateStr}
            <br />Expires: {lead.expirationDateStr || 'N/A'}
          </div>
        </Popup>
      </Marker>
    ));
  }, [leads, selectedLead]);

  return (
    <MapContainer
      center={[40.75, -73.98]}
      zoom={13}
      className="w-full h-full rounded-lg"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitBounds leads={leads} />
      <DrawControl onShapeDrawn={onShapeDrawn} />
      {selectedLead && <FlyToSelected lead={selectedLead} />}
      {circle && (
        <Circle
          center={[circle.lat, circle.lng]}
          radius={milesToMeters(circle.radiusMiles)}
          pathOptions={{ color: '#3b82f6', weight: 2, fillOpacity: 0.1 }}
        />
      )}
      {markers}
    </MapContainer>
  );
}
