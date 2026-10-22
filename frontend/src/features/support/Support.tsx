import { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, allPages, post, patch } from '../../lib/apiClient';
import { customerApi } from '../customer/api';
import { useAuth } from '../../hooks/useAuth';
import { PageHeading, Panel, Button, Empty, Feedback } from '../../components/ui';
import { QueryBoundary } from '../../components/feedback/QueryBoundary';
import { date, orderCode } from '../../lib/constants';
interface Ticket {
  id: number;
  order_id: number;
  customer_id: number;
  subject: string;
  status: 'open' | 'resolved';
  created_at: string;
}
interface Message {
  id: number;
  author_id: number;
  author_name: string;
  author_role: string;
  body: string;
  created_at: string;
}
export default function Support() {
  const { user } = useAuth();
  const admin = user?.role === 'admin';
  const cache = useQueryClient();
  const [params, setParams] = useSearchParams();
  const selected = Number(params.get('ticket')) || 0;
  const [orderId, setOrderId] = useState(params.get('order') || '');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [reply, setReply] = useState('');
  const tickets = useQuery({
    queryKey: ['support', user?.id, 'tickets'],
    queryFn: () => allPages<Ticket>('/support/tickets'),
    refetchInterval: 10000,
  });
  const orders = useQuery({
    queryKey: ['customer', 'support-orders'],
    queryFn: customerApi.orders,
    enabled: !admin,
  });
  const detail = useQuery({
    queryKey: ['support', user?.id, selected],
    queryFn: () => api<Ticket>(`/support/tickets/${selected}`),
    enabled: !!selected,
    refetchInterval: 5000,
  });
  const messages = useQuery({
    queryKey: ['support', user?.id, selected, 'messages'],
    queryFn: () => allPages<Message>(`/support/tickets/${selected}/messages`),
    enabled: !!selected,
    refetchInterval: 5000,
  });
  const chat = useRef<HTMLDivElement>(null);
  const atBottom = useRef(true);
  const previousTicket = useRef(0);
  const messageCount = messages.data?.length ?? 0;
  useEffect(() => {
    const switched = previousTicket.current !== selected;
    if (switched || atBottom.current || messages.data?.at(-1)?.author_id === user?.id) {
      if (chat.current) chat.current.scrollTop = chat.current.scrollHeight;
    }
    previousTicket.current = selected;
  }, [selected, messageCount, messages.data, user?.id]);
  const create = useMutation({
    mutationFn: () =>
      post<Ticket>('/support/tickets', {
        order_id: Number(orderId),
        subject: subject.trim(),
        body: body.trim(),
      }),
    onSuccess: (ticket) => {
      setSubject('');
      setBody('');
      setParams({ ticket: String(ticket.id) });
      void cache.invalidateQueries({ queryKey: ['support'] });
    },
  });
  const send = useMutation({
    mutationFn: () => post(`/support/tickets/${selected}/messages`, { body: reply.trim() }),
    onSuccess: () => {
      setReply('');
      void cache.invalidateQueries({ queryKey: ['support'] });
    },
  });
  const status = useMutation({
    mutationFn: () =>
      patch(`/support/tickets/${selected}`, {
        status: detail.data?.status === 'open' ? 'resolved' : 'open',
      }),
    onSuccess: () => {
      void cache.invalidateQueries({ queryKey: ['support'] });
    },
  });
  return (
    <>
      <PageHeading
        title={admin ? 'Customer support' : 'Support tickets'}
        description="Talk to an administrator about a delivery, including missing or undelivered packages."
      />
      <div className="support-grid">
        <div>
          <Panel title="Tickets">
            <QueryBoundary query={tickets}>
              {!tickets.data?.length ? (
                <Empty
                  title="No tickets yet"
                  description="Order-related conversations will appear here."
                />
              ) : (
                <div className="support-ticket-list">
                  {tickets.data.map((t) => (
                    <button
                      key={t.id}
                      aria-pressed={selected === t.id}
                      className="support-ticket"
                      onClick={() => {
                        setParams({ ticket: String(t.id) });
                        setReply('');
                        send.reset();
                        status.reset();
                      }}
                    >
                      <strong>
                        #{t.id} · {t.subject}
                      </strong>
                      <span>
                        {orderCode(t.order_id)} · {t.status}
                      </span>
                      <small>{date(t.created_at)}</small>
                    </button>
                  ))}
                </div>
              )}
            </QueryBoundary>
          </Panel>
          {!admin && (
            <Panel title="Open a ticket">
              <form
                className="support-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  create.mutate();
                }}
              >
                <label>
                  Delivery
                  <select required value={orderId} onChange={(e) => setOrderId(e.target.value)}>
                    <option value="">Select your delivery</option>
                    {orders.data?.map((o) => (
                      <option key={o.id} value={o.id}>
                        {orderCode(o.id)} · {o.pickup_address} → {o.dropoff_address}
                      </option>
                    ))}
                  </select>
                </label>
                {orders.isLoading && <p role="status">Loading deliveries…</p>}
                <Feedback error={orders.error?.message} />
                <label>
                  Subject
                  <input
                    required
                    maxLength={160}
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Package not received"
                  />
                </label>
                <label>
                  What happened?
                  <textarea
                    required
                    maxLength={4000}
                    rows={4}
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                  />
                </label>
                <Feedback error={create.error?.message} />
                <Button disabled={create.isPending || !orderId || !subject.trim() || !body.trim()}>
                  {create.isPending ? 'Opening…' : 'Open ticket'}
                </Button>
              </form>
            </Panel>
          )}
        </div>
        <Panel title="Conversation">
          {!selected ? (
            <Empty title="Select a ticket" description="Read and reply to messages here." />
          ) : (
            <QueryBoundary query={detail}>
              {detail.data && (
                <>
                  <div className="support-conversation-heading">
                    <h2>{detail.data.subject}</h2>
                    <p>
                      Ticket #{selected} · {detail.data.status} ·{' '}
                      <Link to={`/${user?.role}/orders/${detail.data.order_id}`}>
                        View {orderCode(detail.data.order_id)}
                      </Link>
                    </p>
                  </div>
                  <QueryBoundary query={messages}>
                    <div
                      className="support-messages"
                      role="log"
                      aria-label="Ticket messages"
                      aria-live="polite"
                      ref={chat}
                      onScroll={() => {
                        if (chat.current)
                          atBottom.current =
                            chat.current.scrollHeight -
                              chat.current.scrollTop -
                              chat.current.clientHeight <
                            80;
                      }}
                    >
                      {messages.data?.map((m) => (
                        <article
                          className={`support-message ${m.author_id === user?.id ? 'support-message-own' : ''}`}
                          key={m.id}
                        >
                          <strong>
                            {m.author_id === user?.id ? 'You' : m.author_name} ·{' '}
                            {m.author_role === 'admin' ? 'Admin' : 'Customer'}
                          </strong>
                          <p>{m.body}</p>
                          <small>{date(m.created_at)}</small>
                        </article>
                      ))}
                    </div>
                  </QueryBoundary>
                  {detail.data.status === 'open' ? (
                    <form
                      className="support-form"
                      onSubmit={(e) => {
                        e.preventDefault();
                        send.mutate();
                      }}
                    >
                      <label>
                        Reply
                        <textarea
                          required
                          maxLength={4000}
                          rows={2}
                          onKeyDown={(e) => {
                            if (
                              e.key === 'Enter' &&
                              !e.shiftKey &&
                              !e.nativeEvent.isComposing &&
                              reply.trim() &&
                              !send.isPending
                            ) {
                              e.preventDefault();
                              e.currentTarget.form?.requestSubmit();
                            }
                          }}
                          value={reply}
                          onChange={(e) => setReply(e.target.value)}
                        />
                      </label>
                      <Feedback error={send.error?.message} />
                      <Button disabled={send.isPending || !reply.trim()}>
                        {send.isPending ? 'Sending…' : 'Send message'}
                      </Button>
                    </form>
                  ) : (
                    <p className="support-conversation-heading">
                      This ticket is resolved. An admin can reopen it.
                    </p>
                  )}
                  {admin && (
                    <div className="support-form">
                      <Feedback error={status.error?.message} />
                      <Button
                        variant="secondary"
                        disabled={status.isPending}
                        onClick={() => status.mutate()}
                      >
                        {detail.data.status === 'open' ? 'Mark resolved' : 'Reopen ticket'}
                      </Button>
                    </div>
                  )}
                </>
              )}
            </QueryBoundary>
          )}
        </Panel>
      </div>
    </>
  );
}
