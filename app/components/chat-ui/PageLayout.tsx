import * as React from "react";  
export function PageLayout({ children }: { children: React.ReactNode }) {  
  return (  
    <div className="min-h-screen bg-background">  
      <div className="flex flex-col flex-1">  
        {/* Add mobile header if needed */}  
        <main className="flex-1 flex flex-col relative">  
          {children}  
        </main>  
      </div>  
    </div>  
  );  
}  