import Modal from "./Modal";
import Button from "./Button";

const ConfirmDeleteModal = ({
  open,
  title = "Delete Record",
  message = "Are you sure you want to delete this record?",
  loading = false,
  onClose,
  onConfirm,
}) => {
  return (
    <Modal open={open} title={title} onClose={onClose} size="md">
      <p style={{ color: "var(--text-muted)", lineHeight: 1.7 }}>
        {message}
      </p>

      <div className="modal-actions">
        <Button type="button" variant="secondary" onClick={onClose}>
          Cancel
        </Button>

        <Button type="button" variant="danger" loading={loading} onClick={onConfirm}>
          Delete
        </Button>
      </div>
    </Modal>
  );
};

export default ConfirmDeleteModal;