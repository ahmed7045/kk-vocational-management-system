import "./common.css";

const Card = ({ children, title, subtitle, action }) => {
  return (
    <div className="card">
      {(title || action) && (
        <div className="card-header">
          <div>
            {title && <h3>{title}</h3>}
            {subtitle && <p>{subtitle}</p>}
          </div>

          {action && <div>{action}</div>}
        </div>
      )}

      <div className="card-body">{children}</div>
    </div>
  );
};

export default Card;