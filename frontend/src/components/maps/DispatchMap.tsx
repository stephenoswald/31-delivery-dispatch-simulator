import { useEffect, useRef, useState } from 'react';
import type * as Leaflet from 'leaflet';
import { MapPin, Maximize2 } from 'lucide-react';
import type { Rider } from '../../types/rider';
import type { Order } from '../../types/order';
import 'leaflet/dist/leaflet.css';
interface Point {
  latitude: number;
  longitude: number;
}
export function DispatchMap({
  riders = [],
  order,
  point,
  tall = false,
  onPick,
}: {
  riders?: Rider[];
  order?: Order;
  point?: Point;
  tall?: boolean;
  onPick?: (point: Point) => void;
}) {
  const host = useRef<HTMLDivElement>(null);
  const map = useRef<Leaflet.Map | null>(null);
  const lib = useRef<typeof Leaflet | null>(null);
  const markers = useRef<Leaflet.LayerGroup | null>(null);
  const pick = useRef(onPick);
  pick.current = onPick;
  const [ready, setReady] = useState(false);
  const [tilesFailed, setTilesFailed] = useState(false);
  const previous = useRef('');
  const input = useRef({ riders, order, point });
  input.current = { riders, order, point };
  const markerKey = JSON.stringify([
    riders.map((r) => [r.id, r.status, r.latitude, r.longitude]),
    order
      ? [
          order.id,
          order.pickup_address,
          order.pickup_latitude,
          order.pickup_longitude,
          order.dropoff_address,
          order.dropoff_latitude,
          order.dropoff_longitude,
        ]
      : null,
    point ? [point.latitude, point.longitude] : null,
  ]);
  useEffect(() => {
    let cancelled = false;
    let observer: ResizeObserver | undefined;
    void import('leaflet').then((L) => {
      if (cancelled || !host.current) return;
      lib.current = L;
      const instance = L.map(host.current, {
        scrollWheelZoom: false,
        attributionControl: true,
      }).setView([4.815, 7.025], 12);
      map.current = instance;
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      })
        .on('tileerror', () => setTilesFailed(true))
        .addTo(instance);
      markers.current = L.layerGroup().addTo(instance);
      instance.on('click', (event) =>
        pick.current?.({
          latitude: Number(event.latlng.lat.toFixed(6)),
          longitude: Number(event.latlng.lng.toFixed(6)),
        }),
      );
      if (typeof ResizeObserver !== 'undefined') {
        observer = new ResizeObserver(() => instance.invalidateSize());
        observer.observe(host.current);
      }
      setReady(true);
    });
    return () => {
      cancelled = true;
      observer?.disconnect();
      map.current?.remove();
      map.current = null;
      markers.current = null;
    };
  }, []);
  useEffect(() => {
    const { riders, order, point } = input.current;
    const L = lib.current,
      instance = map.current,
      group = markers.current;
    if (!ready || !L || !instance || !group) return;
    group.clearLayers();
    const bounds: Leaflet.LatLngTuple[] = [];
    const add = (p: Point, label: string, color: string, kind: string) => {
      const position: Leaflet.LatLngTuple = [p.latitude, p.longitude];
      bounds.push(position);
      const icon = L.divIcon({
        className: 'dispatch-pin',
        html: `<span class="pin-dot pin-${kind}" style="--pin-color:${color}">${kind === 'rider' ? '●' : kind === 'pickup' ? 'P' : 'D'}</span>`,
        iconSize: [30, 38],
        iconAnchor: [15, 34],
      });
      const marker = L.marker(position, { icon, alt: label }).addTo(group);
      const content = document.createElement('span');
      content.textContent = label;
      marker.bindPopup(content);
    };
    if (order) {
      const p = { latitude: order.pickup_latitude, longitude: order.pickup_longitude },
        d = { latitude: order.dropoff_latitude, longitude: order.dropoff_longitude };
      add(p, 'Pickup: ' + order.pickup_address, '#009e70', 'pickup');
      add(d, 'Drop-off: ' + order.dropoff_address, '#ed5664', 'dropoff');
      L.polyline(
        [
          [p.latitude, p.longitude],
          [d.latitude, d.longitude],
        ],
        { color: '#2377ef', weight: 4, dashArray: '8 7' },
      ).addTo(group);
    }
    riders
      .filter((r) => r.latitude !== null && r.longitude !== null)
      .forEach((r) =>
        add(
          { latitude: r.latitude!, longitude: r.longitude! },
          `Rider #${r.id} · ${r.status}`,
          r.status === 'available' ? '#009e70' : r.status === 'busy' ? '#2478ef' : '#7b899e',
          'rider',
        ),
      );
    if (point)
      add(
        point,
        order ? 'Assigned rider · simulated position' : 'Selected location',
        '#2478ef',
        'rider',
      );
    const key = JSON.stringify([
      order?.id,
      order?.pickup_latitude,
      order?.pickup_longitude,
      order?.dropoff_latitude,
      order?.dropoff_longitude,
      point?.latitude,
      point?.longitude,
      riders.map((r) => r.id),
    ]);
    if (bounds.length && key !== previous.current) {
      instance.fitBounds(L.latLngBounds(bounds), { padding: [45, 55], maxZoom: 14 });
      previous.current = key;
    }
  }, [ready, markerKey]);
  return (
    <div className={`dispatch-map ${tall ? 'map-tall' : ''} ${onPick ? 'map-selectable' : ''}`}>
      <div
        ref={host}
        className="leaflet-host"
        role="region"
        aria-label={onPick ? 'Choose a delivery point on the map' : 'Port Harcourt delivery map'}
      />
      <span className="map-mode">
        <i />
        Port Harcourt <span>· Simulated locations</span>
      </span>
      <button
        className="map-fit"
        aria-label="Reset map view"
        onClick={() => map.current?.setView([4.815, 7.025], 12)}
      >
        <Maximize2 size={17} />
      </button>
      <span className="map-caption">
        <MapPin size={12} />
        {onPick
          ? 'Click the map to select a location'
          : order
            ? 'Illustrative connection · not a road route'
            : 'Fixed demo positions'}
      </span>
      {tilesFailed && (
        <span className="map-offline" role="status">
          Street tiles unavailable. Location markers remain interactive.
        </span>
      )}
    </div>
  );
}
