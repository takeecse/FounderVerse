const USER_ROLES = [
  "Founder",
  "Investor",
  "Mentor",
  "Collaborator",
];

const LEGACY_USER_ROLES = ["Collaborator/Seeker", "Seeker"];

const VERIFIABLE_ROLES = [
  "Founder",
  "Investor",
  "Mentor",
];

const VERIFICATION_STATUSES = [
  "pending",
  "verified",
  "rejected",
];

const SYSTEM_ROLES = [
  "user",
  "admin",
  "system",
];

const ADMIN_EMAILS = new Set(
  (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean)
);

const SYSTEM_EMAILS = new Set(
  (process.env.SYSTEM_EMAILS || "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean)
);

const normalizeRole = (value) => {
  const cleanValue =
    typeof value === "string" ? value.trim() : "";

  if (["collaborator/seeker", "seeker"].includes(cleanValue.toLowerCase())) {
    return "Collaborator";
  }

  return (
    USER_ROLES.find(
      (role) =>
        role.toLowerCase() === cleanValue.toLowerCase()
    ) || ""
  );
};

const normalizeRoles = (value) => {
  const source = Array.isArray(value)
    ? value
    : typeof value === "string"
      ? value.split(",")
      : [];

  return [
    ...new Set(
      source.map(normalizeRole).filter(Boolean)
    ),
  ];
};

const isVerifiableRole = (role) =>
  VERIFIABLE_ROLES.includes(normalizeRole(role));

const isConfiguredAdminEmail = (email) =>
  Boolean(email && ADMIN_EMAILS.has(email.toLowerCase()));

const isConfiguredSystemEmail = (email) =>
  Boolean(email && SYSTEM_EMAILS.has(email.toLowerCase()));

const getUserRoles = (user) => {
  if (user?.roles?.length) {
    return normalizeRoles(user.roles);
  }

  return normalizeRoles(user?.role);
};

const getPrimaryRole = (user) => {
  return getUserRoles(user)[0] || "Collaborator";
};

const getVerificationMap = (verification) => {
  if (!verification) {
    return {};
  }

  if (verification instanceof Map) {
    return Object.fromEntries(verification);
  }

  return verification;
};

const getVerificationStatus = (user, role) => {
  const normalizedRole = normalizeRole(role);
  const verification = getVerificationMap(user?.verification);

  return verification[normalizedRole] || "pending";
};

module.exports = {
  USER_ROLES,
  VERIFIABLE_ROLES,
  VERIFICATION_STATUSES,
  SYSTEM_ROLES,
  LEGACY_USER_ROLES,
  getUserRoles,
  getPrimaryRole,
  getVerificationMap,
  getVerificationStatus,
  isConfiguredAdminEmail,
  isConfiguredSystemEmail,
  isVerifiableRole,
  normalizeRole,
  normalizeRoles,
};
