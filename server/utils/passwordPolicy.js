const PASSWORD_POLICY_MESSAGE =
  "Password must be at least 8 characters and include uppercase, lowercase, number, and special character.";

const STRONG_PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;

const isStrongPassword = (password = "") => STRONG_PASSWORD_REGEX.test(password);

module.exports = {
  PASSWORD_POLICY_MESSAGE,
  isStrongPassword
};
