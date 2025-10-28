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
    session: { 
        strategy: "jwt", 
        maxAge: 7 * 24 * 60 * 60, // 7 days
        updateAge: 3 * 24 * 60 * 60 // 3 days
    },
    cookies:{
        sessionToken: {
            name: `next-auth.session-token`,
            options: {
                httpOnly: true,
                sameSite: 'lax',
                path: '/',
                secure: process.env.NODE_ENV === 'production',
                maxAge: 7 * 24 * 60 * 60, // 7 days
                updateAge: 3 * 24 * 60 * 60 // 3 days // ← Make this match! 10 seconds for cookie too
            },
        }
    },
    providers: [
        GitHub, 
        Google,
        Credentials({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                try {
                    // Await the client promise to get the database connection
                    const client = await clientPromise;
                    const db = client.db();
                    const user = await db.collection("users").findOne({ email: credentials.email });
                    
                    if (!user) {
                        throw new Error("No user found with this email")
                    }
                    
                    // Check if user has password (OAuth users might not have passwords)
                    if (!user.password) {
                        throw new Error("Please use your social login provider")
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
                } catch (error) {
                    console.error("Authorization error:", error);
                    throw new Error("Authentication failed")
                }
            }
        })
    ],
    events: {
        async createUser({ user }) {
            try {
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
                );
                await sendmessage(user.email, user.name);
            } catch (error) {
                console.error("Error in createUser event:", error);
            }
        }
    },
    callbacks: {
        async jwt({ token, user, trigger, session }) {
            // Always check expiry
            if (token.exp && Date.now() / 1000 > token.exp) {
                return {}; // clear token if expired
            }

            // Initial sign in
            if (user) {
                token.id = user.id;
                token.name = user.name;
                token.email = user.email;
                token.image = user.image;
                token.isAdmin = user.isAdmin ?? false;
                token.packageType = user.packageType ?? "free";
                token.exp = Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60); // set expiry
            }

            // Refresh user data from database on each request
            if (token.sub) {
                try {
                    const client = await clientPromise;
                    const db = client.db();
                    const dbUser = await db.collection("users").findOne({ _id: new ObjectId(token.sub) });
                    if (dbUser) {
                        token.id = dbUser._id.toString();
                        token.name = dbUser.name;
                        token.email = dbUser.email;
                        token.avatar = dbUser.avatar?? "";
                        token.isAdmin = dbUser.isAdmin ?? false;
                        token.packageType = dbUser.packageType ?? "free";
                    }
                } catch (error) {
                    console.error("Error refreshing user data:", error);
                }
            }

            // Handle session update
            if (trigger === "update" && session) {
                token = { ...token, ...session }
            }

            return token;
        },
        async session({ session, token }) {
            if (token && token.id) {
                session.user.id = token.id;
                session.user.name = token.name;
                session.user.email = token.email;
                session.user.avatar = token.avatar;
                session.user.isAdmin = token.isAdmin;
                session.user.packageType = token.packageType;
            }
            return session;
        },
        async redirect({ url }) {
            // Use the environment variable for base URL
            const redirectBaseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
            
            // Allows relative callback URLs
            if (url.startsWith("/")) return `${redirectBaseUrl}${url}`;
            // Allows callback URLs on the same origin
            else if (new URL(url).origin === redirectBaseUrl) return url;
            
            return redirectBaseUrl;
        }
    },
    pages: {
        signIn: '/auth/login',
        signUp: '/auth/register',
        // error: '/auth/error',
    },
    secret: process.env.NEXTAUTH_SECRET,
    debug: process.env.NODE_ENV === 'development',
})