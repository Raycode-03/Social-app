import { get_db , connect_db} from "@/lib/mongodb";
import {sendmessage} from "@/components/auth/message";
import bcrypt from "bcrypt";
export async function signin_services(data){
    const {email , password} = data
    
        await connect_db();
        const db= get_db()
        const collection = db.collection("users");
        // chack for existing user 
        const existing_user = await collection.findOne({email})
        if(existing_user){
            return "User already in database"
        }
        // get a fallback name later the user could change it
        const fullname = email.split('@')[0];
        const salt = await bcrypt.genSalt(10);
        const hashed_password = await bcrypt.hash(password, salt);
        const result = await collection.insertOne({
            name:fullname,
            email,
            password:hashed_password,
            createdAt:new Date().toLocaleDateString('en-US',{
                month:"long",
                day:"2-digit",
                year:"numeric",
                hour:"2-digit",
                minute:"2-digit",
                second:"2-digit",
                hour12:true
            
            }),
            isAdmin:false,
            packageType:"free",
        })
            if (!result.acknowledged) {
        throw new Error("Failed to register user");
            }
    await sendmessage(email , fullname)
    return {_id:result.insertedId,...data,password:undefined};

}

export async function loginservices(data){
    const {email , password} = data

    await connect_db();
    const db= get_db()
    const collection = db.collection("users");

    // Check for existing user
    const existing_user = await collection.findOne({email})
    if(!existing_user){
        return "User not found"
    }
    if(!existing_user.password){
        return "This account was created using Google or GitHub. Please sign in with that provider."
    }
    // Validate password
    const isValid = await bcrypt.compare(password, existing_user.password)
    if(!isValid){
        return "Invalid password"
    }

    return {_id:existing_user._id,...existing_user,password:undefined};
}