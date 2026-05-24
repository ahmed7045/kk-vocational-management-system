// const Card = ({
//   children,
//   className = "",
//   title,
//   subtitle,
//   onClick,
// }) => {
//   return (
//     <div className={`card ${className}`} onClick={onClick}>
//       {(title || subtitle) && (
//         <div className="card-header">
//           <div>
//             {title && <h3>{title}</h3>}
//             {subtitle && <p>{subtitle}</p>}
//           </div>
//         </div>
//       )}

//       {children}
//     </div>
//   );
// };

// export default Card;

const Card = ({
  children,
  className = "",
  title,
  subtitle,
  action,
  onClick,
}) => {
  return (
    <div className={`card ${className}`} onClick={onClick}>
      {(title || subtitle || action) && (
        <div className="card-header">
          <div>
            {title && <h3>{title}</h3>}
            {subtitle && <p>{subtitle}</p>}
          </div>

          {action && (
            <div
              className="card-action"
              onClick={(event) => event.stopPropagation()}
            >
              {action}
            </div>
          )}
        </div>
      )}

      {children}
    </div>
  );
};

export default Card;