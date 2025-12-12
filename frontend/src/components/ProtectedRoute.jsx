import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectCurrentUser, selectAuthLoading } from '../store/slices/authSlice';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const user = useSelector(selectCurrentUser);
  // We can use the auth loading state or just rely on user presence if detailed loading isn't needed here
  // const loading = useSelector(selectAuthLoading); 

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />; // Or unauthorized page
  }

  return children;
};

export default ProtectedRoute;
