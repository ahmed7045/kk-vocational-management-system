import "./common.css";

const Loader = ({ text = "Loading...", fullPage = false }) => {
  return (
    <div className={fullPage ? "loader-page" : "loader-box"}>
      <div className="spinner" />
      <p>{text}</p>
    </div>
  );
};

export default Loader;