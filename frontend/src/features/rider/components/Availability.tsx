import { useMutation } from '@tanstack/react-query';
import { Power } from 'lucide-react';
import { riderApi } from '../api';
import { useRiderProfile } from '../hooks/useRider';
import { queryClient } from '../../../lib/queryClient';
import { Feedback } from '../../../components/ui';
export function Availability() {
  const profile = useRiderProfile();
  const mutation = useMutation({
    mutationFn: () =>
      riderApi.availability(profile.data?.status === 'offline' ? 'available' : 'offline'),
    onSuccess: () => {
      void queryClient.invalidateQueries();
    },
  });
  const available = profile.data?.status === 'available';
  const busy = profile.data?.status === 'busy';
  return (
    <div>
      <button
        className={`availability-switch ${available || busy ? 'is-online' : ''}`}
        role="switch"
        aria-checked={available || busy}
        disabled={!profile.data || busy || mutation.isPending}
        onClick={() => mutation.mutate()}
        aria-label={busy ? 'On an active delivery' : available ? 'Go offline' : 'Go online'}
      >
        <Power size={15} />
        {busy ? 'On a delivery' : available ? 'You’re online' : 'You’re offline'}
        <span className="switch-track">
          <i />
        </span>
      </button>
      <Feedback error={mutation.error?.message} />
    </div>
  );
}
