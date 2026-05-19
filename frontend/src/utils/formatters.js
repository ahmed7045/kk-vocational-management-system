export const formatCurrency = (amount) => {
  return `Rs ${Number(amount || 0).toLocaleString()}`;
};

export const formatDate = (date) => {
  if (!date) return "-";

  return new Date(date).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export const getSelectedBranchId = () => {
  return localStorage.getItem("selectedBranchId");
};

export const getSelectedBranchName = () => {
  return localStorage.getItem("selectedBranchName");
};