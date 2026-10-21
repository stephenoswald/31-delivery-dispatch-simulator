import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Star, ArrowLeft, CheckCheck } from 'lucide-react';
import { customerApi } from '../api';
import { useCustomerOrder } from '../hooks/useCustomer';
import { ApiError } from '../../../lib/apiClient';
import { queryClient } from '../../../lib/queryClient';
import { PageHeading, Panel, Button, Feedback, Empty } from '../../../components/ui';
import { QueryBoundary } from '../../../components/feedback/QueryBoundary';
import { orderCode, area } from '../../../lib/constants';
export default function ReviewOrder() {
  const { id } = useParams();
  const query = useCustomerOrder(Number(id));
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const review = useQuery({
    queryKey: ['customer', 'review', id],
    queryFn: async () => {
      try {
        return await customerApi.getReview(Number(id));
      } catch (e) {
        if (e instanceof ApiError && e.status === 404) return null;
        throw e;
      }
    },
    enabled: query.data?.status === 'delivered',
  });
  const mutation = useMutation({
    mutationFn: () => customerApi.review(Number(id), { rating, comment }),
    onSuccess: () => {
      void queryClient.invalidateQueries();
    },
  });
  const existing = mutation.data ?? review.data;
  return (
    <>
      <Link to={`/customer/orders/${id}`} className="back-link">
        <ArrowLeft size={15} />
        Delivery details
      </Link>
      <PageHeading
        eyebrow="A LITTLE THANK-YOU GOES A LONG WAY"
        title="How was your delivery?"
        description="Your feedback helps make the next journey even better."
      />
      <QueryBoundary query={query}>
        {query.data?.status !== 'delivered' ? (
          <Panel>
            <Empty
              title="A little early for a review"
              description="You can rate this delivery once it reaches its destination."
            />
          </Panel>
        ) : (
          <Panel className="review-panel">
            {existing ? (
              <Empty
                title="Thanks for sharing a little kindness."
                description={`You rated this delivery ${existing.rating} out of 5.${existing.comment ? ' “' + existing.comment + '”' : ''}`}
                icon={CheckCheck}
                action={
                  <Link className="button button-primary" to="/customer">
                    Back to your day
                  </Link>
                }
              />
            ) : (
              <QueryBoundary query={review}>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    mutation.mutate();
                  }}
                >
                  <span className="review-icon">
                    <CheckCheck size={30} />
                  </span>
                  <h2>Delivered with care.</h2>
                  <p className="muted">
                    #{orderCode(Number(id))} · {area(query.data!.pickup_address)} →{' '}
                    {area(query.data!.dropoff_address)}
                  </p>
                  <div className="star-picker" role="group" aria-label="Rating out of five">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        type="button"
                        aria-label={`${n} star${n > 1 ? 's' : ''}`}
                        aria-pressed={rating === n}
                        onClick={() => setRating(n)}
                      >
                        <Star
                          size={38}
                          fill={rating >= n ? '#eba640' : 'none'}
                          stroke={rating >= n ? '#eba640' : '#c9d3cd'}
                        />
                      </button>
                    ))}
                  </div>
                  <p className="rating-label">
                    {
                      [
                        'Pick a star to get started',
                        'Could be better',
                        'Room to improve',
                        'A good delivery',
                        'A great delivery',
                        'Made your day!',
                      ][rating]
                    }
                  </p>
                  <label>
                    Tell us a little more <span className="muted">(optional)</span>
                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      rows={4}
                      maxLength={2000}
                      placeholder="What made your delivery memorable?"
                    />
                  </label>
                  <Feedback error={mutation.error?.message} />
                  <Button className="w-full" disabled={!rating || mutation.isPending}>
                    {mutation.isPending ? 'Sharing your review…' : 'Share your review'}
                    <Star size={16} />
                  </Button>
                </form>
              </QueryBoundary>
            )}
          </Panel>
        )}
      </QueryBoundary>
    </>
  );
}
