import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Map,
  PlusCircle,
  Users,
  CheckCircle2,
  Clock,
  Sparkles,
  MapPin,
  Eye,
  ChefHat,
  Flame,
  Layers
} from 'lucide-react';
import { MapContainer, TileLayer, Circle, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import toast from 'react-hot-toast';
import { adminApi } from '../../api/adminApi';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Drawer } from '../../components/ui/Drawer';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { EmptyState } from '../../components/ui/EmptyState';
import { Skeleton } from '../../components/ui/Skeleton';
import { MapPicker } from '../../components/shared/MapPicker';
import { formatDate } from '../../utils/formatters';
import { DEFAULT_COORDINATES } from '../../utils/constants';

// Custom marker for Area Overview Map
const createAreaMarkerIcon = (isActive, name) => {
  const bg = isActive ? '#2E7D32' : '#D97706';
  return L.divIcon({
    className: 'custom-area-marker',
    html: `
      <div style="transform: translate(-50%, -100%); display: flex; flex-direction: column; align-items: center; pointer-events: auto;">
        <div style="background-color: ${bg}; color: white; padding: 3px 8px; border-radius: 9999px; font-size: 11px; font-weight: bold; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.3); white-space: nowrap; margin-bottom: 2px;">
          ${name}
        </div>
        <div style="width: 14px; height: 14px; background-color: ${bg}; border: 2px solid white; border-radius: 50%; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>
      </div>
    `,
    iconSize: [20, 20],
    iconAnchor: [0, 0]
  });
};

const MapBoundsController = ({ areas }) => {
  const map = useMap();
  useEffect(() => {
    if (areas && areas.length > 0) {
      const validPoints = areas
        .filter((a) => a.center?.coordinates?.length === 2)
        .map((a) => [a.center.coordinates[1], a.center.coordinates[0]]);

      if (validPoints.length > 0) {
        const bounds = L.latLngBounds(validPoints);
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
      }
    }
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 200);
    return () => clearTimeout(timer);
  }, [areas, map]);
  return null;
};

export const AreaManagementPage = () => {
  const queryClient = useQueryClient();
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedAreaWaitingList, setSelectedAreaWaitingList] = useState(null);

  // New Area Form State
  const [newArea, setNewArea] = useState({
    name: '',
    type: 'locality',
    radiusInMeters: 2500,
    activationThreshold: 3,
    lng: DEFAULT_COORDINATES[0],
    lat: DEFAULT_COORDINATES[1]
  });

  const { data: areasData, isLoading } = useQuery({
    queryKey: ['adminAreas'],
    queryFn: adminApi.getAreas
  });

  const areas = areasData?.data?.areas || [];

  // Waiting list query for selected area
  const { data: waitingData, isLoading: isWaitingLoading } = useQuery({
    queryKey: ['waitingList', selectedAreaWaitingList?._id],
    queryFn: () => adminApi.getWaitingLists({ areaId: selectedAreaWaitingList?._id }),
    enabled: !!selectedAreaWaitingList?._id
  });

  const waitingListEntries = waitingData?.data?.entries || [];

  // Activate Area Mutation
  const activateAreaMutation = useMutation({
    mutationFn: (id) => adminApi.activateArea(id),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['adminAreas'] });
      queryClient.invalidateQueries({ queryKey: ['adminAnalytics'] });
      toast.success(res.message || 'Area manually activated!');
    },
    onError: (err) => toast.error(err.message || 'Failed to activate area')
  });

  // Create Area Mutation
  const createAreaMutation = useMutation({
    mutationFn: (payload) =>
      adminApi.createArea({
        name: payload.name,
        type: payload.type,
        center: { type: 'Point', coordinates: [Number(payload.lng), Number(payload.lat)] },
        radiusInMeters: Number(payload.radiusInMeters),
        activationThreshold: Number(payload.activationThreshold)
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminAreas'] });
      setCreateModalOpen(false);
      setNewArea({
        name: '',
        type: 'locality',
        radiusInMeters: 2500,
        activationThreshold: 3,
        lng: DEFAULT_COORDINATES[0],
        lat: DEFAULT_COORDINATES[1]
      });
      toast.success('New zone created successfully!');
    },
    onError: (err) => toast.error(err.message || 'Failed to create area')
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-neutral-900">
            Geofence Area & Locality Management
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 mt-1">
            Configure hyperlocal zones, threshold rules, and inspect live neighbourhood demand and kitchen metrics.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          icon={PlusCircle}
          onClick={() => setCreateModalOpen(true)}
        >
          Add New Zone
        </Button>
      </div>

      {/* Multi-Area Leaflet Map Overview */}
      {areas.length > 0 && (
        <Card className="p-4 border-cream-300 shadow-warm space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-primary-800" />
              <h2 className="font-serif font-bold text-sm text-neutral-900">
                City Geofence Map Overview ({areas.length} zones)
              </h2>
            </div>

            <div className="flex items-center gap-4 text-xs font-medium">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-emerald-600 inline-block"></span>
                <span>Active Geofence</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-amber-500 inline-block"></span>
                <span>Waiting List / Inactive</span>
              </span>
            </div>
          </div>

          <div className="rounded-xl overflow-hidden border border-cream-300 h-80 relative z-0">
            <MapContainer
              center={[DEFAULT_COORDINATES[1], DEFAULT_COORDINATES[0]]}
              zoom={12}
              style={{ height: '100%', width: '100%' }}
              scrollWheelZoom={false}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <MapBoundsController areas={areas} />

              {areas.map((area) => {
                if (!area.center?.coordinates || area.center.coordinates.length < 2) return null;
                const lat = area.center.coordinates[1];
                const lng = area.center.coordinates[0];
                const isLive = area.isActive;

                return (
                  <React.Fragment key={area._id}>
                    {/* Geofence boundary circle */}
                    <Circle
                      center={[lat, lng]}
                      radius={area.radiusInMeters || 2500}
                      pathOptions={{
                        color: isLive ? '#2E7D32' : '#D97706',
                        fillColor: isLive ? '#4CAF50' : '#F59E0B',
                        fillOpacity: 0.18,
                        weight: 2
                      }}
                    />

                    {/* Zone center pin */}
                    <Marker
                      position={[lat, lng]}
                      icon={createAreaMarkerIcon(isLive, area.name)}
                    >
                      <Popup>
                        <div className="p-1 space-y-1.5 text-xs font-sans">
                          <p className="font-bold text-sm text-neutral-900">{area.name}</p>
                          <div className="flex items-center gap-1">
                            <Badge variant={isLive ? 'success' : 'warning'} size="sm">
                              {isLive ? 'Active Zone' : 'Waiting List Zone'}
                            </Badge>
                            <span className="text-neutral-500 text-[11px] capitalize">({area.type})</span>
                          </div>
                          <div className="pt-1 border-t border-neutral-200 grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
                            <span>Approved Chefs: <strong>{area.approvedChefsCount || 0}</strong></span>
                            <span>Open Kitchens: <strong>{area.openKitchensCount || 0}</strong></span>
                            <span>Waiting List: <strong>{area.waitingListSize || 0}</strong></span>
                            <span>Demand Counter: <strong>{area.demandCount || 0}</strong></span>
                            <span>Threshold: <strong>{area.activationThreshold || 3} chefs</strong></span>
                            <span>Radius: <strong>{area.radiusInMeters || 2500}m</strong></span>
                          </div>
                        </div>
                      </Popup>
                    </Marker>
                  </React.Fragment>
                );
              })}
            </MapContainer>
          </div>
        </Card>
      )}

      {isLoading ? (
        <Skeleton variant="card" count={3} />
      ) : areas.length === 0 ? (
        <EmptyState
          icon={Map}
          title="No Zones Configured"
          description="Create your first geofenced locality or sector to begin onboarding neighborhood kitchens."
          actionLabel="Create Area"
          onAction={() => setCreateModalOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {areas.map((area) => (
            <Card key={area._id} className="p-5 border-cream-300 space-y-4 shadow-warm">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-serif font-bold text-lg text-neutral-900">
                      {area.name}
                    </h3>
                    <Badge variant={area.isActive ? 'success' : 'warning'} size="sm" dot>
                      {area.isActive ? 'Live & Active' : 'Waiting List'}
                    </Badge>
                  </div>

                  <p className="text-xs text-neutral-500 capitalize mt-0.5">
                    Zone Type: {area.type} • Radius: {area.radiusInMeters} m
                  </p>
                </div>
              </div>

              {/* Dynamic Aggregated Metrics Grid */}
              <div className="grid grid-cols-4 gap-2 p-3 bg-cream-50 rounded-xl border border-cream-200 text-center text-xs">
                <div>
                  <span className="text-[10px] text-neutral-400 font-bold uppercase block">
                    Approved
                  </span>
                  <span className="text-base font-bold text-primary-800">
                    {area.approvedChefsCount || 0}
                  </span>
                  <span className="text-[10px] text-neutral-400 block">Chefs</span>
                </div>

                <div>
                  <span className="text-[10px] text-neutral-400 font-bold uppercase block">
                    Cooking
                  </span>
                  <span className="text-base font-bold text-emerald-700">
                    {area.openKitchensCount || 0}
                  </span>
                  <span className="text-[10px] text-neutral-400 block">Open Now</span>
                </div>

                <div>
                  <span className="text-[10px] text-neutral-400 font-bold uppercase block">
                    Waitlist
                  </span>
                  <span className="text-base font-bold text-amber-700">
                    {area.waitingListSize || 0}
                  </span>
                  <span className="text-[10px] text-neutral-400 block">Foodies</span>
                </div>

                <div>
                  <span className="text-[10px] text-neutral-400 font-bold uppercase block">
                    Demand
                  </span>
                  <span className="text-base font-bold text-neutral-800">
                    {area.demandCount || 0}
                  </span>
                  <span className="text-[10px] text-neutral-400 block">Goal: {area.activationThreshold || 3}</span>
                </div>
              </div>

              {/* Map Preview of Area Center */}
              {area.center?.coordinates && (
                <div className="rounded-xl overflow-hidden border border-cream-200">
                  <MapPicker
                    initialCoordinates={area.center.coordinates}
                    showRadius={true}
                    readOnly={true}
                    height="160px"
                  />
                </div>
              )}

              {/* Card Actions */}
              <div className="pt-2 border-t border-cream-200 flex items-center justify-between gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  icon={Eye}
                  onClick={() => setSelectedAreaWaitingList(area)}
                >
                  View Waiting List ({area.waitingListSize || area.demandCount || 0})
                </Button>

                {!area.isActive && (
                  <Button
                    variant="primary"
                    size="sm"
                    icon={CheckCircle2}
                    loading={activateAreaMutation.isPending}
                    onClick={() => activateAreaMutation.mutate(area._id)}
                  >
                    Manually Activate
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Waiting List Drawer */}
      {selectedAreaWaitingList && (
        <Drawer
          isOpen={!!selectedAreaWaitingList}
          onClose={() => setSelectedAreaWaitingList(null)}
          title={`Waiting List: ${selectedAreaWaitingList.name}`}
          subtitle={`${selectedAreaWaitingList.waitingListSize || selectedAreaWaitingList.demandCount || 0} prospective subscribers registered`}
          maxWidth="max-w-lg"
        >
          <div className="space-y-4">
            <div className="p-3 bg-saffron-50 border border-saffron-200 rounded-xl text-xs text-saffron-900">
              Subscribers registered in this zone are waiting for {selectedAreaWaitingList.activationThreshold} approved home chefs to begin ordering.
            </div>

            {isWaitingLoading ? (
              <Skeleton variant="card" count={3} />
            ) : waitingListEntries.length === 0 ? (
              <p className="text-xs text-neutral-400 text-center py-8">
                No individual customer records logged for this zone.
              </p>
            ) : (
              <div className="space-y-2">
                {waitingListEntries.map((entry) => (
                  <div
                    key={entry._id}
                    className="p-3 bg-white rounded-xl border border-cream-200 text-xs flex items-center justify-between"
                  >
                    <div>
                      <p className="font-bold text-neutral-900">{entry.customer?.name || 'Customer'}</p>
                      <p className="text-neutral-500 text-[11px]">{entry.customer?.email} • {entry.customer?.phone || 'No phone'}</p>
                    </div>
                    <span className="text-[10px] text-neutral-400">
                      Joined {formatDate(entry.joinedAt || entry.createdAt)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Drawer>
      )}

      {/* Add New Area Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Create New Hyperlocal Geofence Zone"
        description="Define a neighborhood zone with center coordinates, radius, and activation threshold."
        maxWidth="max-w-lg"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!newArea.name.trim()) {
              toast.error('Please enter area name');
              return;
            }
            createAreaMutation.mutate(newArea);
          }}
          className="space-y-4"
        >
          <Input
            label="Area / Locality Name"
            placeholder="e.g. Indiranagar 100ft Road Locality"
            required
            value={newArea.name}
            onChange={(e) => setNewArea({ ...newArea, name: e.target.value })}
          />

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Zone Type"
              value={newArea.type}
              onChange={(e) => setNewArea({ ...newArea, type: e.target.value })}
              options={[
                { value: 'locality', label: 'Locality' },
                { value: 'sector', label: 'Sector' },
                { value: 'society', label: 'Gated Society' },
                { value: 'campus', label: 'Tech Campus' }
              ]}
            />

            <Input
              label="Chefs to Auto-Activate"
              type="number"
              required
              value={newArea.activationThreshold}
              onChange={(e) => setNewArea({ ...newArea, activationThreshold: e.target.value })}
            />
          </div>

          <Input
            label="Radius (Meters)"
            type="number"
            required
            value={newArea.radiusInMeters}
            onChange={(e) => setNewArea({ ...newArea, radiusInMeters: e.target.value })}
          />

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1.5">
              Select Zone Center on Map
            </label>
            <MapPicker
              initialCoordinates={[Number(newArea.lng), Number(newArea.lat)]}
              onCoordinatesChange={(c) => setNewArea({ ...newArea, lng: c[0], lat: c[1] })}
              showRadius={true}
              height="200px"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              loading={createAreaMutation.isPending}
            >
              Create Zone
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
