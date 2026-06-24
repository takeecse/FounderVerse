export const normalizeExternalUrl = (url) => {
  if (!url) {
    return "";
  }

  const value = url.trim();

  if (!value) {
    return "";
  }

  return /^https?:\/\//i.test(value)
    ? value
    : `https://${value}`;
};
