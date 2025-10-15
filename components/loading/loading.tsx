import React, { useState } from "react";
import Image from "next/image";

export default function IsLoading({ loadstate }: { loadstate: boolean }) {
    const [loading] = useState(loadstate);
    
    return (
        <>
            {loading && (
                <div className="loading-overlay">
                    <div className="loading-container">
                        <Image 
                            src="/video/spinAnimation.gif" 
                            height={80} 
                            width={80} 
                            alt="loading animation"
                            unoptimized={true}
                        />
                    </div>
                </div>
            )}
        </>
    );
}