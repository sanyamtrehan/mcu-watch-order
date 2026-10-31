export function validatePasswordReset(password: string, confirmation: string) {
  if (password.length < 6) return "Password must be at least 6 characters.";
  if (password !== confirmation) return "Passwords do not match.";
  return null;
}
