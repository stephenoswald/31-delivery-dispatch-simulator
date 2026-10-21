import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, Search, Star } from 'lucide-react';
import { useWorkspace } from '../hooks/useWorkspace';
import { PageHeading, Panel, Stat, Empty, Button } from '../../../components/ui';
import { QueryBoundary } from '../../../components/feedback/QueryBoundary';
import { date, orderCode } from '../../../lib/constants';

export default function Reviews() {
  const query = useWorkspace();
  const [search, setSearch] = useState('');
  const [rating, setRating] = useState('all');
  const [page, setPage] = useState(0);
  const data = query.data;
  const reviews = data?.reviews ?? [];
  const customerName = (id: number) =>
    data?.users.find((u) => u.id === id)?.full_name ?? `Customer #${id}`;
  const riderName = (id: number) => {
    const rider = data?.riders.find((r) => r.id === id);
    return data?.users.find((u) => u.id === rider?.user_id)?.full_name ?? `Rider #${id}`;
  };
  const filtered = reviews
    .filter(
      (review) =>
        (rating === 'all' || review.rating === Number(rating)) &&
        `${customerName(review.customer_id)} ${riderName(review.rider_id)} ${orderCode(review.order_id)} ${review.comment ?? ''}`
          .toLowerCase()
          .includes(search.trim().toLowerCase()),
    )
    .sort((a, b) => b.created_at.localeCompare(a.created_at) || b.id - a.id);
  const pages = Math.max(1, Math.ceil(filtered.length / 8));
  const current = Math.min(page, pages - 1);
  return (
    <>
      <PageHeading
        title="Customer reviews"
        description="Read customer feedback and ratings for completed deliveries."
      />
      <QueryBoundary query={query}>
        <div className="stats-grid stats-three">
          <Stat
            label="Total reviews"
            value={reviews.length}
            icon={MessageSquare}
            tone="blue"
            detail="Submitted customer feedback"
          />
          <Stat
            label="Average rating"
            value={
              reviews.length
                ? `${(reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)} / 5`
                : '—'
            }
            icon={Star}
            tone="orange"
            detail="Across all customer reviews"
          />
          <Stat
            label="Five-star reviews"
            value={reviews.filter((r) => r.rating === 5).length}
            icon={Star}
            detail="Highest rated deliveries"
          />
        </div>
        <Panel>
          <div className="table-tools">
            <div className="input-icon search-input">
              <Search size={18} />
              <input
                aria-label="Search reviews"
                placeholder="Search customer, rider, order, or feedback…"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(0);
                }}
              />
            </div>
            <select
              aria-label="Filter reviews by rating"
              value={rating}
              onChange={(e) => {
                setRating(e.target.value);
                setPage(0);
              }}
            >
              <option value="all">All ratings</option>
              {[5, 4, 3, 2, 1].map((n) => (
                <option key={n} value={n}>
                  {n} {n === 1 ? 'star' : 'stars'}
                </option>
              ))}
            </select>
          </div>
          {!filtered.length ? (
            <Empty
              icon={MessageSquare}
              title={reviews.length ? 'No matching reviews' : 'No customer reviews yet'}
              description={
                reviews.length
                  ? 'Try another search or rating.'
                  : 'Reviews will appear after customers rate their completed deliveries.'
              }
            />
          ) : (
            <div className="admin-review-list">
              {filtered.slice(current * 8, current * 8 + 8).map((review) => (
                <article key={review.id} className="admin-review-card">
                  <div className="admin-review-heading">
                    <div>
                      <Link to={`/admin/customers/${review.customer_id}`}>
                        <strong>{customerName(review.customer_id)}</strong>
                      </Link>
                      <p className="muted small">{date(review.created_at)}</p>
                    </div>
                    <span
                      className="admin-review-stars"
                      aria-label={`${review.rating} out of 5 stars`}
                    >
                      {[1, 2, 3, 4, 5].map((n) => (
                        <Star
                          key={n}
                          size={16}
                          aria-hidden="true"
                          fill={n <= review.rating ? 'currentColor' : 'none'}
                        />
                      ))}
                    </span>
                  </div>
                  <p className="admin-review-comment">
                    {review.comment?.trim() || 'No written feedback provided.'}
                  </p>
                  <div className="admin-review-links">
                    <Link to={`/admin/orders/${review.order_id}`}>
                      Order {orderCode(review.order_id)}
                    </Link>
                    <Link to={`/admin/riders/${review.rider_id}`}>
                      Rider: {riderName(review.rider_id)}
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}
          {filtered.length > 0 && (
            <div className="pagination">
              <span>
                {filtered.length} reviews · Page {current + 1} of {pages}
              </span>
              <div>
                <Button
                  variant="secondary"
                  disabled={current === 0}
                  onClick={() => setPage(current - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="secondary"
                  disabled={current + 1 >= pages}
                  onClick={() => setPage(current + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </Panel>
      </QueryBoundary>
    </>
  );
}
