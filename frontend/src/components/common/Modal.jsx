import "./common.css";

const Modal = ({ open, title, children, onClose, size = "md" }) => {
  if (!open) return null;

  return (
    <div className="modal-backdrop">
      <div className={`modal modal-${size}`}>
        <div className="modal-header">
          <h3>{title}</h3>
          <button onClick={onClose}>×</button>
        </div>

        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
};

export default Modal;