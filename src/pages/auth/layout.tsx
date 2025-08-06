import * as React from "react";

type LayoutProps = {
  children: React.ReactNode;
};

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-muted">
      <header className="py-4 px-6 text-lg font-semibold">YourApp</header>
      <main className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-4xl bg-white rounded-2xl shadow-lg p-8">
          {children}
        </div>
      </main>
      <footer className="py-4 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} Your Company
      </footer>
    </div>
  );
}
