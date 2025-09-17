import { sendcode } from "@/components/auth/message";
import { connect_db, get_db } from "@/lib/mongodb";
import bcrypt from "bcrypt";

export async function verify_email(data) {
  const { email } = data;

  await connect_db();
  const db = get_db();
  const collection = db.collection("users");

  // Check for existing user
  const existing_user = await collection.findOne({ email });
  if (!existing_user) {
    return { message: "User not found", error: true };
  }

  // Generate reset code (6-digit number as string)
  const resetcode = Math.floor(100000 + Math.random() * 900000).toString();

  // Store reset code
  await collection.updateOne({ email }, { $set: { resetcode } });

  // Send reset code via email
  await sendcode(email, resetcode);

  return { message: "Reset code sent to your email." };
}

export async function verify_resetcode(data) {
  const { email, resetcode } = data;
  await connect_db();
  const db = get_db();
  const collection = db.collection("users");

  const existing_user = await collection.findOne({ email });
  if (!existing_user) {
    return { message: "User not found", error: true };
  }

  if (existing_user.resetcode !== resetcode.toString()) {
    return { message: "Invalid reset code", error: true };
  }

  return { message: "Reset code verified successfully." };
}

export async function reset_password(data) {
  const { email, resetcode, password } = data;

  await connect_db();
  const db = get_db();
  const collection = db.collection("users");

  const existing_user = await collection.findOne({ email });
  if (!existing_user) {
    return { message: "User not found", error: true };
  }

  if (!existing_user.resetcode || existing_user.resetcode !== resetcode.toString()) {
    return { message: "Invalid or expired reset code", error: true };
  }

  // Hash new password
  const salt = await bcrypt.genSalt(10);
  const hashed_password = await bcrypt.hash(password, salt);

  // Update password + clear reset code
  await collection.updateOne(
    { email },
    { $set: { password: hashed_password }, $unset: { resetcode: "" } }
  );

  return { message: "Password reset successfully." };
}
