import validator from "validator";

// Step 1: Email validation
export function validate_verify_email(data) {
  const { email } = data;
  if (!email) return "Email is required";
  if (!validator.isEmail(email)) return "Invalid email format";
  return null;
}

// Step 2: Reset code validation
export function validate_reset_code(data) {
  const { email, resetcode } = data;
  if (!email || !resetcode) return "Email and reset code are required";
  if (!validator.isEmail(email)) return "Invalid email format";
  if (typeof resetcode !== "string" || resetcode.length !== 6) {
    return "Reset code must be a 6-digit string";
  }
  return null;
}

// Step 3: New password validation
export function validate_new_password(data) {
  const { email, resetcode, password } = data;
  if (!email || !resetcode || !password) return "All fields are required";
  if (!validator.isEmail(email)) return "Invalid email format";
  if (typeof resetcode !== "string" || resetcode.length !== 6) {
    return "Invalid reset code";
  }
  if (typeof password !== "string" || password.length < 6) {
    return "Password must be at least 6 characters";
  }
  return null;
}
