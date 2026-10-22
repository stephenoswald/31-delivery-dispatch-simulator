import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import type { Role } from '../types/user';
import { Loading, ErrorState, Button, Brand } from '../components/ui';
import CustomerLayout from '../components/layout/CustomerLayout';
import RiderLayout from '../components/layout/RiderLayout';
import AdminLayout from '../components/layout/AdminLayout';
const Support = lazy(() => import('../features/support/Support'));
const Login = lazy(() => import('../features/auth/pages/Login'));
const Profile = lazy(() => import('../features/auth/pages/Profile'));
const CustomerDashboard = lazy(() => import('../features/customer/pages/Dashboard'));
const CreateOrder = lazy(() => import('../features/customer/pages/CreateOrder'));
const CustomerOrderDetails = lazy(() => import('../features/customer/pages/OrderDetails'));
const Tracking = lazy(() => import('../features/customer/pages/Tracking'));
const OrderHistory = lazy(() => import('../features/customer/pages/OrderHistory'));
const ReviewOrder = lazy(() => import('../features/customer/pages/ReviewOrder'));
const RiderDashboard = lazy(() => import('../features/rider/pages/Dashboard'));
const AvailableOrders = lazy(() => import('../features/rider/pages/AvailableOrders'));
const RiderOrderDetails = lazy(() => import('../features/rider/pages/OrderDetails'));
const ActiveDelivery = lazy(() => import('../features/rider/pages/ActiveDelivery'));
const DeliveryHistory = lazy(() => import('../features/rider/pages/DeliveryHistory'));
const AdminDashboard = lazy(() => import('../features/admin/pages/Dashboard'));
const Orders = lazy(() => import('../features/admin/pages/Orders'));
const AdminOrderDetails = lazy(() => import('../features/admin/pages/OrderDetails'));
const LiveTracking = lazy(() => import('../features/admin/pages/LiveTracking'));
const Riders = lazy(() => import('../features/admin/pages/Riders'));
const RiderDetails = lazy(() => import('../features/admin/pages/RiderDetails'));
const Customers = lazy(() => import('../features/admin/pages/Customers'));
const CustomerDetails = lazy(() => import('../features/admin/pages/CustomerDetails'));
const Analytics = lazy(() => import('../features/admin/pages/Analytics'));
const Reviews = lazy(() => import('../features/admin/pages/Reviews'));
const Reports = lazy(() => import('../features/admin/pages/Reports'));
function Guard({ role }: { role?: Role }) {
  const { user, loading, error, retry, logout } = useAuth();
  if (loading) return <Loading />;
  if (error)
    return (
      <div className="session-error">
        <Brand />
        <ErrorState error={error} retry={retry} />
        <Button variant="secondary" onClick={logout}>
          Return to sign in
        </Button>
      </div>
    );
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to={`/${user.role}`} replace />;
  return <Outlet />;
}
function Root() {
  const { user, loading } = useAuth();
  return loading ? <Loading /> : <Navigate to={user ? `/${user.role}` : '/login'} replace />;
}
function RoutesFrame() {
  return (
    <Suspense fallback={<Loading />}>
      <Outlet />
    </Suspense>
  );
}
export const router = createBrowserRouter([
  {
    element: <RoutesFrame />,
    children: [
      { path: '/', element: <Root /> },
      { path: '/login', element: <Login /> },

      {
        element: <Guard role="customer" />,
        children: [
          {
            path: '/customer',
            element: <CustomerLayout />,
            children: [
              { index: true, element: <CustomerDashboard /> },
              { path: 'support', element: <Support /> },
              { path: 'new', element: <CreateOrder /> },
              { path: 'orders', element: <OrderHistory /> },
              { path: 'orders/:id', element: <CustomerOrderDetails /> },
              { path: 'orders/:id/tracking', element: <Tracking /> },
              { path: 'orders/:id/review', element: <ReviewOrder /> },
              { path: 'history', element: <OrderHistory /> },
              { path: 'profile', element: <Profile /> },
            ],
          },
        ],
      },
      {
        element: <Guard role="rider" />,
        children: [
          {
            path: '/rider',
            element: <RiderLayout />,
            children: [
              { index: true, element: <RiderDashboard /> },
              { path: 'requests', element: <AvailableOrders /> },
              { path: 'offers', element: <Navigate to="/rider/requests" replace /> },
              { path: 'orders/:id', element: <RiderOrderDetails /> },
              { path: 'active', element: <ActiveDelivery /> },
              { path: 'history', element: <DeliveryHistory /> },
              { path: 'profile', element: <Profile /> },
            ],
          },
        ],
      },
      {
        element: <Guard role="admin" />,
        children: [
          {
            path: '/admin',
            element: <AdminLayout />,
            children: [
              { index: true, element: <AdminDashboard /> },
              { path: 'support', element: <Support /> },
              { path: 'orders', element: <Orders /> },
              { path: 'orders/:id', element: <AdminOrderDetails /> },
              { path: 'tracking', element: <LiveTracking /> },
              { path: 'riders', element: <Riders /> },
              { path: 'riders/:id', element: <RiderDetails /> },
              { path: 'customers', element: <Customers /> },
              { path: 'customers/:id', element: <CustomerDetails /> },
              { path: 'analytics', element: <Analytics /> },
              { path: 'reports', element: <Reports /> },
              { path: 'reviews', element: <Reviews /> },
              { path: 'profile', element: <Profile /> },
            ],
          },
        ],
      },
      {
        path: '*',
        element: (
          <div className="not-found">
            <Brand />
            <h1>This road doesn’t lead anywhere.</h1>
            <p>Let’s head back to your workspace.</p>
            <a href="/" className="button button-primary">
              Back home
            </a>
          </div>
        ),
      },
    ],
  },
]);
