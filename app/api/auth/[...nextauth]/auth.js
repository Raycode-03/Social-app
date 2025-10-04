import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials";
import GitHub from "next-auth/providers/github"
import Google from "next-auth/providers/google"
import clientPromise from "@/lib/mongodb_auth"
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import { ObjectId } from "mongodb";
import { compare } from "bcrypt"
import { sendmessage } from "@/components/auth/message"

export const { auth, handlers, signIn, signOut } = NextAuth({
    adapter: MongoDBAdapter(clientPromise),
    session: { strategy: "jwt", maxAge: 7 * 24 * 60 * 60, updateAge: 3 * 24 * 60 * 60 }, // 7 days with 3 days reupdate
    providers: [GitHub, Google,
        Credentials({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                // Await the client promise to get the database connection
                const client = await clientPromise;
                const db = client.db();
                const user = await db.collection("users").findOne({ email: credentials.email });
                if (!user) {
                    throw new Error("No user found with this email")
                }
                const isValid = await compare(credentials.password, user.password)
                if (!isValid) throw new Error("Invalid password")
                return { 
                    id: user._id.toString(), 
                    email: user.email,
                    name: user.name, 
                    isAdmin: user.isAdmin, 
                    packageType: user.packageType 
                }
            }
        })
    ],
    events: {
        async createUser({ user }) {
            const client = await clientPromise;
            const db = client.db();
            // Add default custom fields to the new user
            await db.collection("users").updateOne(
                { _id: new ObjectId(user.id) },
                { 
                    $set: { 
                        isAdmin: false, 
                        packageType: "free", 
                        createdAt: new Date().toLocaleDateString("en-us", {
                            minute: "numeric",
                            second: "2-digit",
                            hour: "2-digit",
                            hour12: true,
                            month: "long",
                            year: "numeric",
                            day: "2-digit"
                        }) 
                    } 
                }
            )
            await sendmessage(user.email, user.name)
        }
    },
    callbacks: {
        async jwt({ token, user, trigger, session }) {
            // Always check expiry
            if (token.exp && Date.now() / 1000 > token.exp) {
                return {}; // clear token
            }

            // Initial sign in
            if (user) {
                token.id = user.id;
                token.name = user.name;
                token.email = user.email;
                token.isAdmin = user.isAdmin ?? false;
                token.packageType = user.packageType ?? "free";
                token.exp = Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60); // set expiry
            }

            // Refresh user data from database on each request
            if (token.sub) {
                const client = await clientPromise;
                const db = client.db();
                const dbUser = await db.collection("users").findOne({ _id: new ObjectId(token.sub) });
                if (dbUser) {
                    token.id = dbUser._id.toString();
                    token.name = dbUser.name;
                    token.email = dbUser.email;
                    token.isAdmin = dbUser.isAdmin ?? false;
                    token.packageType = dbUser.packageType ?? "free";
                }
            }

            // Handle session update (if needed)
            if (trigger === "update" && session) {
                token = { ...token, ...session }
            }

            return token;
        },
        async session({ session, token }) {
            if (token) {
                session.user.id = token.id 
                session.user.name = token.name 
                session.user.email = token.email
                session.user.isAdmin = token.isAdmin 
                session.user.packageType = token.packageType
            }
            return session;
        }
    }
})