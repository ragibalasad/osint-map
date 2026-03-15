import { UserProfile } from "@/components/auth/user-profile";

export default function Home() {
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center p-8 sm:p-20 font-sans bg-background overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.1),transparent_50%)]" />
      <div className="absolute -top-[10%] -right-[10%] w-[30%] h-[30%] bg-blue-500/5 rounded-full blur-[120px]" />
      
      <header className="absolute top-0 w-full p-6 flex justify-between items-center z-10">
        <div className="flex items-center gap-2 group cursor-pointer">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center transition-transform group-hover:rotate-12">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              className="w-5 h-5 text-primary-foreground"
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
            </svg>
          </div>
          <span className="font-bold text-xl tracking-tight">OSINT MAP</span>
        </div>
        <UserProfile />
      </header>

      <main className="relative z-10 flex flex-col items-center gap-12 text-center sm:text-left max-w-4xl mx-auto w-full">
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium border border-primary/20 animate-in fade-in slide-in-from-bottom-3">
             <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              Security Infrastructure Ready
          </div>
          
          <h1 className="text-5xl sm:text-7xl font-bold tracking-tighter text-balance">
            Complete Visibility for your <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-600">Digital Assets</span>
          </h1>
          
          <p className="text-lg sm:text-xl text-muted-foreground text-balance max-w-2xl leading-relaxed">
            The ultimate OSINT mapping tool built with speed and security in mind.
            Manage sessions, track assets, and secure your perimeter.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <a
            className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-primary px-8 text-primary-foreground font-semibold transition-all hover:bg-primary/90 hover:scale-105 active:scale-95 shadow-lg shadow-primary/25"
            href="/auth/sign-in"
          >
            Get Started
          </a>
          <a
            className="flex h-14 items-center justify-center rounded-2xl border border-border bg-background px-8 font-semibold transition-all hover:bg-accent hover:border-accent-foreground/20"
            href="https://github.com/better-auth/better-auth"
            target="_blank"
            rel="noopener noreferrer"
          >
            Documentation
          </a>
        </div>
      </main>

      <footer className="absolute bottom-8 text-sm text-muted-foreground flex items-center gap-6">
        <a href="#" className="hover:text-primary transition-colors">Privacy</a>
        <a href="#" className="hover:text-primary transition-colors">Terms</a>
        <a href="#" className="hover:text-primary transition-colors">API Docs</a>
      </footer>
    </div>
  );
}

