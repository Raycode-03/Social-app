import validator from "validator"

export function validateuser(data){
    const {email , password} = data  
      if (!email || !password) return "Please fill all the fields";
    if (!validator.isEmail(email)) {
        return "Invalid email format";
    }
    if (typeof password !== "string" || password.length < 6) return "Password must be at least 6 characters";
    return null;
}
