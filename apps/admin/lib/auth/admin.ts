export function isAdminEmail(email: string | null | undefined) {
  const rawAllowlist = process.env.ADMIN_EMAIL_ALLOWLIST ?? "";
  const allowlist = rawAllowlist
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);

  // If no allowlist is configured, allow any authenticated user.
  if (allowlist.length === 0) {
    return true;
  }

  if (!email) {
    return false;
  }

  return allowlist.includes(email.toLowerCase());
}
