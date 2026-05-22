import "./common.css";

const Select = ({
  label,
  name,
  value = "",
  onChange,
  options = [],
  placeholder = "Select option",
  error,
  required = false,
}) => {
  return (
    <div className="form-group">
      {label && (
        <label htmlFor={name}>
          {label} {required && <span>*</span>}
        </label>
      )}

      <select
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        className={error ? "input-error" : ""}
      >
        <option value="">{placeholder}</option>

        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      {error && <small className="error-text">{error}</small>}
    </div>
  );
};

export default Select;