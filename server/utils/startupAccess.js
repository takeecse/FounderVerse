const idString = (value) => value?._id?.toString() || value?.toString() || "";

const isStartupFounder = (startup, userId) =>
  idString(startup?.founder) === idString(userId);

const getStartupMembership = (startup, userId) =>
  startup?.teamMemberRoles?.find((membership) =>
    idString(membership.user) === idString(userId)
  ) || null;

const isStartupAdmin = (startup, userId) =>
  Boolean(getStartupMembership(startup, userId)?.isAdmin);

const canManageStartup = (startup, userId) =>
  isStartupFounder(startup, userId) || isStartupAdmin(startup, userId);

module.exports = {
  canManageStartup,
  getStartupMembership,
  isStartupAdmin,
  isStartupFounder,
};
