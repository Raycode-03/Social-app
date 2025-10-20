"use client"
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar"
import { useIsMobile } from "@/hooks/use-mobile"
import { Bell, CircleUserRound, MessagesSquare, Search, X , LogOut , User} from "lucide-react"
import Image from 'next/image'
import { useEffect, useRef, useState } from "react"
import { signOut } from "next-auth/react"

export default function Navbar() {
  const ismobile = useIsMobile()
  const [query, setQuery] = useState("");
  // const [result , setresult] = useState([])
  const [showSearchResults , setshowSearchResults] = useState(false);
  const [loading , setloading ] = useState(false)
  const [keywords , setkeywords] = useState([])
  const [showsearchmobile , setshowsearchmobile ] = useState(false)
  const { state, isMobile } = useSidebar() // 👈 get sidebar state
  const sidebarWidth = state === "expanded" ? "16rem" : "3rem" // matches your config
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef(null);

  // const [message, setMessage] = useState<string | null>(null);
  //  to close 
  const searchref = useRef(null)
  
  // Separate useEffect for search
  useEffect(() => {
    const closeSearch = (e: MouseEvent) => {
      if (searchref.current && !(searchref.current as HTMLElement).contains(e.target as Node)) {
        setshowSearchResults(false);
        setshowsearchmobile(false);
      }
    }
    document.addEventListener("mousedown", closeSearch);
    return () => document.removeEventListener("mousedown", closeSearch);
  }, []);

  // Separate useEffect for user menu
  useEffect(() => {
    const closeUserMenu = (e: MouseEvent) => {
      if (userMenuRef.current && !(userMenuRef.current as HTMLElement).contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    }
    document.addEventListener("mousedown", closeUserMenu);
    return () => document.removeEventListener("mousedown", closeUserMenu);
  }, []);
  //  for the keywords of the search
  useEffect(() => {
  if (!query.trim()) {
    setkeywords([]);
    return;
  }

  const handler = setTimeout(async () => {
    try {
      setloading(true);
      const baseUrl = process.env.NEXTAUTH_URL||'http://localhost:3000';
      const res = await fetch(`${baseUrl}/api/feeds/keywords?query=${encodeURIComponent(query)}`);
      if (!res.ok) throw new Error("Failed to fetch keywords");
      const data = await res.json();
      console.log("data",data)
      setkeywords(data);
    } catch (err) {
      console.error("Error fetching keywords:", err);
      setkeywords([]);
    } finally {
      setloading(false);
    }
  }, 500); // <-- wait 300ms after last keystroke

  // Cleanup if query changes before timeout
  return () => clearTimeout(handler);
}, [query]);

  // useEffect( () => {
  //   if (!query.trim()) {
  //     setresult([]);
  //     setshowSearchResults(false);
  //     setloading(false);
  //     return;
  // }
  // const controller = new AbortController();
  // const timeout = setTimeout(async() => {
  //   try{
  //     setloading(true)
  //     const baseUrl = process.env.NEXTAUTH_URL||'http://localhost:3000';
  //     const res = await fetch(`${baseUrl}/api/feeds/searches`,{
  //       method: "POST",
  //       headers: { "Content-type": "application/json" },
  //       body: JSON.stringify({query}),
  //       signal: controller.signal,
  //     })
  //     if (!res.ok) throw new Error("Failed to fetch");
  //     const data = await res.json()
  //     setresult(data)
  //     setshowSearchResults(true);
  //     console.log(data)
  // } catch (err) {
  //     if (err.name === "AbortError") {
  //       console.log("Search aborted:", query); // harmless
  //     } else {
  //       console.error(err);
  //     }
  //   } finally {
  //     setloading(false);
  //   }
  // }, 500);
  //   return () => {
  //   clearTimeout(timeout);
  //   controller.abort(); // cancel previous request
  //   } 
  // }, [query]);
  const SearchBar = (
    <div className="flex items-center w-full h-10 rounded-full px-3 bg-white focus-within:bg-gray-200 border border-gray-300 focus-within:border-gray-400 shadow-sm">
      <Search className="w-5 h-5 text-gray-500"/> 
      <input
        type="text"
        value={query ?? ""}
        onChange={(e) => {
          setQuery(e.target.value);
          if(e.target.value.trim()){
              setshowSearchResults(true);
            }else{setshowSearchResults(false)};
        }}
        placeholder="Search Posts..."
        className="flex-1 px-3 bg-transparent outline-none text-gray-700 placeholder-gray-400"
      />
      {query && (
        <button 
          onClick={() => {setQuery(""); setshowSearchResults(false);}} 
          className="p-1 rounded-full hover:bg-gray-300"
        >
          <X className="w-4 h-5 text-gray-500 hover:text-gray-700"/>
        </button>
      )}
    </div>
  )
  const Searchquerys = (
  <div
    className={`absolute top-12 left-0 w-full bg-white shadow-lg rounded-md p-4 px-6 z-30 ${
      showSearchResults ? "block" : "hidden"
    }`}
  >
    {loading && <p className="text-gray-500">Loading...</p>}

    {!loading && keywords.length === 0 && query.trim() && (
      <p className="text-gray-500">No results found</p>
    )}
    {!loading && keywords.length > 0 && (
      <ul className="space-y-2 overflow-auto max-h-[12rem] w-full break-words">
        {keywords.map((word: any, i: number) => (
          <li
            key={i}
            onClick={() => {
              setQuery(word.snippet);
              setshowSearchResults(false);
            }}
            className="cursor-pointer px-2 py-2 rounded-md hover:bg-gray-100">
            <p className="font-medium flex gap-4">
              <Search className="w-4 opacity-90" />
              {word.snippet}
            </p>
          </li>
        ))}
      </ul>
    )}
  </div>
);
const handleSignOut = async () => {
  try {
    console.log("🧹 Starting nuclear cleanup...");
    
    // 1. Clear ALL cookies
    const cookies = document.cookie.split(";");
    for (let cookie of cookies) {
      const eqPos = cookie.indexOf("=");
      const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
      
      // Clear every possible variation
      document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
      document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=" + window.location.hostname;
      document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=." + window.location.hostname;
    }

    // 2. Clear ALL storage
    localStorage.clear();
    sessionStorage.clear();

    console.log("✅ Cleanup complete, now signing out...");

    // 3. Now do the proper signOut
    await signOut({ 
      callbackUrl: "/auth/login",
      redirect: true 
    });

  } catch (error) {
    console.error("Sign out error:", error);
    // Still redirect to login even if error
    window.location.href = "/auth/login";
  }
};
  return (
    <>
      {/* Navbar */}
      <div
      className="fixed top-0 z-30 h-16 flex items-center justify-between px-4 shadow-md bg-white transition-all"
      style={{
        left: isMobile ? "0" : sidebarWidth,
        width: isMobile ? "100%" : `calc(100% - ${sidebarWidth})`,
      }}
    >
        {/* Logo */}
        <div className="flex items-center gap-">
          <SidebarTrigger />
          {!showsearchmobile && (
            
          <span className="flex items-center">
            <Image src={"/logos/flowline.svg"} alt="flowline logo" width={3} height={3}   className=" min-w-[23px] min-h-23 mr-3 object-contain" />

            {!ismobile && <p className="text-[1.0rem] text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">Flowline</p>}
          </span>
          )}
         {ismobile && (
          <button className= "p-2 flex flex-col items-center text-2xl text-gray-500 hover:text-gray-800" onClick={()=>setshowsearchmobile(true)}><Search /></button>
         )}
        {showsearchmobile && ismobile && ( 

      <div 
        className='absolute top-0 left-0 right-0 h-16 flex items-center px-4 z-40 bg-white shadow-md' 
        ref={searchref}
      >
      {SearchBar}
      {Searchquerys}
      
    <button 
      onClick={() => {
        setshowsearchmobile(false);
        setshowSearchResults(false);
        setQuery("");
      }}
      className="ml-2 p-1 rounded-full hover:bg-gray-200"
    >
    </button>
  </div>
)}      

        </div>

         {/* Desktop Search */}
          {!ismobile && (
          <div className="relative flex-1 gap-8 mx-8 max-w-md" ref={searchref}>
           {SearchBar}
           {Searchquerys}
          </div>
        )}
        
        {/* Icons */}
      {!showsearchmobile && (
          <div className="flex items-center gap-4">
          <button className="p-2 rounded-full  flex flex-col items-center group">
            <Bell className="text-center text-gray-500 group-hover:text-gray-800" />
            <span className="text-[0.7rem] text-gray-400 group-hover:text-gray-800">Notification</span>
        </button>

          <button className="p-2 rounded-full flex flex-col items-center group">
            <MessagesSquare className="text-center text-gray-500 group-hover:text-gray-800" />
            <span className="text-[0.7rem] text-gray-400 group-hover:text-gray-800">Messages</span>
          </button>
          

           {/* User Menu with Dropdown */}
            <div className="relative" ref={userMenuRef}>
              <button 
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="p-2 rounded-full group"
              >
                <CircleUserRound className="text-gray-500 group-hover:text-gray-800"/>
              </button>

              {/* Dropdown Menu */}
              {showUserMenu && (
                <div className="absolute right-0 top-12 w-48 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-50">
                  <button className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Profile
                  </button>
                  <button 
                    onClick={handleSignOut}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2 text-red-600"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
        </div>
        )}
      </div>

      
      
    </>
  )
}
