import "./common.css";

const Badge = ({ children, type = "default" }) => {
  return <span className={`badge badge-${type}`}>{children}</span>;
};

export default Badge;