import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import { fetchAllNodes } from '../services/api'
import NodePopup from '../components/map/NodePopup'
import { useTranslation } from 'react-i18next'

// Custom coloured circle markers based on status
const createIcon = (status) => {
  const color = status === 'Healthy' ? '#10B981' : status === 'Warning' ? '#F59E0B' : '#EF4444'
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="background-color:${color};width:16px;height:16px;border-radius:50%;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);"></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  })
}

const MapView = () => {
  const [nodes, setNodes] = useState([])
  const { t } = useTranslation()

  useEffect(() => { fetchAllNodes().then(setNodes) }, [])

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">{t('map.title')}</h2>
      <div className="rounded-3xl overflow-hidden shadow-soft h-[calc(100vh-10rem)]">
        <MapContainer center={[7.1365, 80.0415]} zoom={16} className="h-full w-full">
          <TileLayer
            attribution='&copy; <a href="https://www.esri.com/">Esri</a> contributors'
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          />
          {nodes.map(node => (
            <Marker key={node.id} position={[node.lat, node.lng]} icon={createIcon(node.status)}>
              <Popup>
                <NodePopup node={node} />
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  )
}

export default MapView