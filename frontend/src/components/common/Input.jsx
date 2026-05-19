import "./common.css";

const Input = ({
  label,
  name,
  type = "text",
  value = "",
  onChange,
  placeholder,
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

      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={error ? "input-error" : ""}
      />

      {error && <small className="error-text">{error}</small>}
    </div>
  );
};

export default Input;