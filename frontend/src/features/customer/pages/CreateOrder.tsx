import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, MapPin, Package, UserRound, CheckCircle2 } from 'lucide-react';
import { PageHeading, Panel, Button, Feedback } from '../../../components/ui';
import { Field, Input, Select, Textarea } from '../../../components/ui/Fields';
import { DispatchMap } from '../../../components/maps/DispatchMap';
import { useFeedback } from '../../../components/feedback/OverlayProvider';
import { PLACES } from '../../../lib/constants';
import { useAuth } from '../../../hooks/useAuth';
import { customerApi } from '../api';
import { queryClient } from '../../../lib/queryClient';
interface LocationDraft {
  address: string;
  latitude: number | string;
  longitude: number | string;
}
export default function CreateOrder() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const feedback = useFeedback();
  const [pickup, setPickup] = useState<LocationDraft>({
    address: user?.address ?? 'Old GRA, Port Harcourt',
    latitude: user?.latitude ?? 4.785,
    longitude: user?.longitude ?? 7.01,
  });
  const [dropoff, setDropoff] = useState<LocationDraft>({
    address: 'D-Line, Port Harcourt',
    latitude: 4.805,
    longitude: 7.005,
  });
  const [selected, setSelected] = useState<'pickup' | 'dropoff'>('pickup');
  const [recipient, setRecipient] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [kind, setKind] = useState('Parcel');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  function choose(kind: 'pickup' | 'dropoff', index: number) {
    const place = PLACES[index];
    const data = {
      address: `${place.label}, Port Harcourt`,
      latitude: place.latitude,
      longitude: place.longitude,
    };
    (kind === 'pickup' ? setPickup : setDropoff)(data);
  }
  async function submit(e: FormEvent) {
    e.preventDefault();
    setError('');
    const coordinates = [pickup.latitude, pickup.longitude, dropoff.latitude, dropoff.longitude];
    if (coordinates.some((value) => value === '' || !Number.isFinite(Number(value)))) {
      setError('Enter valid coordinates for both locations.');
      return;
    }
    if (
      Number(pickup.latitude) === Number(dropoff.latitude) &&
      Number(pickup.longitude) === Number(dropoff.longitude)
    ) {
      setError('Pickup and drop-off coordinates must be different.');
      return;
    }
    if (!pickup.address.trim() || !dropoff.address.trim() || !recipient.trim() || !phone.trim()) {
      setError('Complete all required delivery details.');
      return;
    }
    if (
      !(await feedback.confirm({
        title: 'Confirm delivery request',
        description: `Collect from ${pickup.address} and deliver to ${dropoff.address} for ${recipient}. Available nearby riders will be able to accept your request.`,
        action: 'Request delivery',
      }))
    )
      return;
    setBusy(true);
    try {
      const order = await customerApi.create({
        pickup_address: pickup.address.trim(),
        pickup_latitude: Number(pickup.latitude),
        pickup_longitude: Number(pickup.longitude),
        dropoff_address: dropoff.address.trim(),
        dropoff_latitude: Number(dropoff.latitude),
        dropoff_longitude: Number(dropoff.longitude),
        recipient_name: recipient.trim(),
        recipient_phone: phone.trim(),
        package_description: `${kind}${notes ? ': ' + notes.trim() : ''}`,
      });
      void queryClient.invalidateQueries();
      feedback.toast('Delivery requested. We’re waiting for a nearby rider.');
      navigate(`/customer/orders/${order.id}/tracking`);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const selectedLocation = selected === 'pickup' ? pickup : dropoff;
  const selectedPoint =
    selectedLocation.latitude !== '' &&
    selectedLocation.longitude !== '' &&
    Number.isFinite(Number(selectedLocation.latitude)) &&
    Number.isFinite(Number(selectedLocation.longitude))
      ? {
          latitude: Number(selectedLocation.latitude),
          longitude: Number(selectedLocation.longitude),
        }
      : undefined;

  return (
    <>
      <Link to="/customer" className="back-link">
        <ArrowLeft size={16} />
        Dashboard
      </Link>
      <PageHeading
        title="New delivery"
        description="Tell us where to collect your package and where it needs to go."
      />
      <div className="booking-grid">
        <Panel title="Delivery details" subtitle="Fields marked * are required.">
          <form className="padded-form" onSubmit={submit}>
            <div className="form-section-label">
              <MapPin size={18} />
              <span>01</span>Pickup & drop-off
            </div>
            {(['pickup', 'dropoff'] as const).map((key) => {
              const value = key === 'pickup' ? pickup : dropoff;
              const update = key === 'pickup' ? setPickup : setDropoff;
              return (
                <fieldset
                  className={`location-fieldset ${selected === key ? 'selected' : ''}`}
                  key={key}
                >
                  <legend>{key === 'pickup' ? 'Pickup' : 'Drop-off'} location</legend>
                  <Field label={`${key === 'pickup' ? 'Pickup' : 'Drop-off'} neighborhood`}>
                    <Select
                      value={PLACES.findIndex((p) => value.address.startsWith(p.label))}
                      onChange={(e) => choose(key, +e.target.value)}
                    >
                      <option value={-1} disabled>
                        Custom location
                      </option>
                      {PLACES.map((p, i) => (
                        <option value={i} key={p.label}>
                          {p.label}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field label={`${key === 'pickup' ? 'Pickup' : 'Drop-off'} address *`}>
                    <Input
                      required
                      maxLength={1000}
                      value={value.address}
                      onChange={(e) => update({ ...value, address: e.target.value })}
                    />
                  </Field>
                  <div className="form-row">
                    <Field label={`${key === 'pickup' ? 'Pickup' : 'Drop-off'} latitude *`}>
                      <Input
                        required
                        type="number"
                        step="any"
                        min={-90}
                        max={90}
                        value={value.latitude}
                        onChange={(e) => update({ ...value, latitude: e.target.value })}
                      />
                    </Field>
                    <Field label={`${key === 'pickup' ? 'Pickup' : 'Drop-off'} longitude *`}>
                      <Input
                        required
                        type="number"
                        step="any"
                        min={-180}
                        max={180}
                        value={value.longitude}
                        onChange={(e) => update({ ...value, longitude: e.target.value })}
                      />
                    </Field>
                  </div>
                  <Button type="button" variant="ghost" onClick={() => setSelected(key)}>
                    <MapPin size={15} />
                    Select {key === 'pickup' ? 'pickup' : 'drop-off'} on map
                  </Button>
                </fieldset>
              );
            })}
            <div className="form-section-label">
              <UserRound size={18} />
              <span>02</span>Recipient
            </div>
            <div className="form-row">
              <Field label="Recipient’s name *">
                <Input
                  required
                  maxLength={120}
                  autoComplete="name"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  placeholder="Full name"
                />
              </Field>
              <Field label="Recipient’s phone *">
                <Input
                  required
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  minLength={5}
                  maxLength={32}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Phone number"
                />
              </Field>
            </div>
            <div className="form-section-label">
              <Package size={18} />
              <span>03</span>Package
            </div>
            <Field label="Package type">
              <Select value={kind} onChange={(e) => setKind(e.target.value)}>
                {['Parcel', 'Documents', 'Food & groceries', 'Personal items', 'Other'].map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </Select>
            </Field>
            <Field
              label="Package description & notes"
              hint="Include handling instructions or helpful delivery details."
            >
              <Textarea
                value={notes}
                maxLength={1800}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="What are you sending?"
              />
            </Field>
            <Feedback error={error} />
            <Button disabled={busy} className="w-full" type="submit">
              {busy ? 'Requesting delivery…' : 'Review & request delivery'}
              <ArrowRight size={18} />
            </Button>
          </form>
        </Panel>
        <div className="booking-summary">
          <Panel
            title="Choose your delivery location"
            subtitle={`Map selection: ${selected === 'pickup' ? 'pickup' : 'drop-off'}. Addresses are entered manually.`}
          >
            <DispatchMap
              point={selectedPoint}
              onPick={(point) =>
                (selected === 'pickup' ? setPickup : setDropoff)((current) => ({
                  ...current,
                  ...point,
                }))
              }
            />
          </Panel>
          <Panel title="Delivery summary">
            <div className="summary-route">
              <div>
                <MapPin size={20} />
                <span>
                  <small>PICKUP</small>
                  <strong>{pickup.address}</strong>
                </span>
              </div>
              <div>
                <MapPin size={20} />
                <span>
                  <small>DROP-OFF</small>
                  <strong>{dropoff.address}</strong>
                </span>
              </div>
            </div>
            <div className="booking-check">
              <CheckCircle2 size={17} />
              <span>
                Riders accept requests themselves. You’ll see updates as soon as one accepts.
              </span>
            </div>
          </Panel>
          <div className="tip-card">
            <span>SIMULATION MODE</span>
            <p>
              Port Harcourt locations are fixed demo positions. No live GPS or road routing is used.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
