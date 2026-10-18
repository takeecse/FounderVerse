export const USER_ROLES = [
  "Founder",
  "Investor",
  "Mentor",
  "Collaborator",
];

const normalizeRole = (role) => {
  const cleanRole = String(role || "").trim();

  if (["seeker", "collaborator/seeker"].includes(cleanRole.toLowerCase())) {
    return "Collaborator";
  }

  return USER_ROLES.find(
    (userRole) => userRole.toLowerCase() === cleanRole.toLowerCase()
  ) || "";
};

export const VERIFIABLE_ROLES = [
  "Founder",
  "Investor",
  "Mentor",
];

export const normalizeRoles = (user = {}) => {
  user = user || {};
  const roles = Array.isArray(user)
    ? user
    : Array.isArray(user.roles) && user.roles.length > 0
      ? user.roles
      : user.role
        ? [user.role]
        : [];

  return [...new Set(roles.map(normalizeRole).filter(Boolean))];
};

export const getPrimaryRole = (user = {}) =>
  normalizeRoles(user)[0] || "Collaborator";

export const getVerificationStatus = (user = {}, role) =>
  user?.verification?.[role] || "pending";

export const isVerifiedForRole = (user = {}, role) =>
  getVerificationStatus(user, role) === "verified";

export const getRoleLabel = (user = {}) =>
  normalizeRoles(user).join(" + ") || getPrimaryRole(user);
