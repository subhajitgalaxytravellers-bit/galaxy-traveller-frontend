export const formatDate = (isoString) => {
  const date = new Date(isoString);

  const day = String(date.getDate()).padStart(2, "0");
  const month = date.toLocaleString("en-US", { month: "long" }); // e.g. November
  const year = date.getFullYear();

  return { day, month, year };
};
