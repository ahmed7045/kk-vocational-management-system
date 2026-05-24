import { Eye, Pencil, Trash2 } from "lucide-react";
import "./common.css";

const ActionButtons = ({
  onView,
  onEdit,
  onDelete,
  canView = true,
  canEdit = true,
  canDelete = true,
}) => {
  return (
    <div className="action-buttons">
      {canView && (
        <button type="button" className="action-btn action-view" onClick={onView} title="View">
          <Eye size={15} />
        </button>
      )}

      {canEdit && (
        <button type="button" className="action-btn action-edit" onClick={onEdit} title="Edit">
          <Pencil size={15} />
        </button>
      )}

      {canDelete && (
        <button type="button" className="action-btn action-delete" onClick={onDelete} title="Delete">
          <Trash2 size={15} />
        </button>
      )}
    </div>
  );
};

export default ActionButtons;