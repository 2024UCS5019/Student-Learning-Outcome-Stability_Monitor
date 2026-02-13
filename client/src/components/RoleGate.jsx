import useAuth from "../hooks/useAuth";

const RoleGate = ({ roles = [], children }) => {
  const { user } = useAuth();
  if (!user || !roles.includes(user.role)) return null;
  return children;
};

export default RoleGate;
