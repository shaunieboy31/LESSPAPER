import PropTypes from 'prop-types';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useStateContext } from './ContextProvider';

export default function RequireAuth({ allowedRoles }) {
  const { auth } = useStateContext();
  const location = useLocation();

  let hasAllowedRole = false;

  if (allowedRoles) {
    if (typeof allowedRoles === 'string') {
      hasAllowedRole = auth?.role?.includes(allowedRoles);
    } else if (Array.isArray(allowedRoles)) {
      // hasAllowedRole = allowedRoles.includes(auth?.role);
      hasAllowedRole = auth?.role?.some(role => allowedRoles.includes(role));
    }
  }

  // eslint-disable-next-line no-nested-ternary
  return hasAllowedRole ? (
    <Outlet />
  ) : auth?.username ? (
    <Navigate to="/unauthorized" state={{ from: location }} replace />
  ) : (
    <Navigate to="/login" state={{ from: location }} replace />
  );
}

RequireAuth.defaultProps = {
  allowedRoles: null
};

RequireAuth.propTypes = {
  allowedRoles: PropTypes.oneOfType([PropTypes.string, PropTypes.arrayOf(PropTypes.string)])
};
