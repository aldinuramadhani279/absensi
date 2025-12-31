import { Link, router, usePage } from "@inertiajs/react";
import { Button } from "@/Components/ui/button";
import { Bell, Home, Users, Briefcase, FileText, Settings, LogOut, Shield, Clock, MailQuestion, Plane } from "lucide-react";
import { PropsWithChildren } from "react";

export default function AdminLayout({ children }: PropsWithChildren) {
    const { url } = usePage();

    const handleLogout = () => {
        router.post('/logout');
    };

    const isActive = (path: string) => url.startsWith(path);

    const navItems = [
        { href: "/admin", label: "Dashboard", icon: Home, exact: true },
        { href: "/admin/professions", label: "Jabatan", icon: Briefcase },
        { href: "/admin/shifts", label: "Shift", icon: Clock },
        { href: "/admin/employees", label: "Karyawan", icon: Users },
        { href: "/admin/reports", label: "Laporan", icon: FileText },
        { href: "/admin/leave-requests", label: "Manajemen Cuti", icon: MailQuestion },
        { href: "/admin/travel-requests", label: "Dinas Luar Kota", icon: Plane },
    ];

    return (
        <div className="min-h-screen w-full flex bg-gray-50">
            {/* Sidebar */}
            <aside className="w-64 bg-slate-900 text-white flex-col flex-shrink-0 hidden md:flex">
                <div className="h-16 flex items-center px-6 border-b border-slate-800">
                    <div className="flex items-center gap-3">
                        <div className="p-1.5 bg-blue-600 rounded-lg">
                            <Shield className="h-5 w-5 text-white" />
                        </div>
                        <h1 className="text-lg font-bold tracking-tight">Admin Panel</h1>
                    </div>
                </div>
                <nav className="flex-1 px-4 py-6 space-y-1">
                    {navItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${(item.exact ? url === item.href : url.startsWith(item.href))
                                ? "bg-blue-600 text-white shadow-sm"
                                : "text-slate-400 hover:text-white hover:bg-slate-800"
                                }`}
                        >
                            <item.icon className="h-4 w-4" />
                            {item.label}
                        </Link>
                    ))}
                </nav>
                <div className="p-4 border-t border-slate-800">
                    <div className="flex items-center gap-3 px-3 py-2">
                        <div className="h-8 w-8 rounded-full bg-slate-700 flex items-center justify-center">
                            <span className="text-xs font-bold">AD</span>
                        </div>
                        <div>
                            <p className="text-sm font-medium">Administrator</p>
                            <p className="text-xs text-slate-500">admin@company.com</p>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0">
                <header className="bg-white border-b h-16 flex items-center justify-between px-6 sticky top-0 z-30 shadow-sm">
                    <div className="md:hidden">
                        {/* Mobile Menu Trigger would go here */}
                        <span className="font-bold text-slate-900">Admin Panel</span>
                    </div>
                    <div className="flex items-center justify-end w-full gap-4">
                        <Button variant="ghost" size="icon" className="text-slate-500 relative">
                            <Bell className="h-5 w-5" />
                            <span className="absolute top-2 right-2 h-2 w-2 bg-red-500 rounded-full"></span>
                        </Button>
                        <div className="h-8 w-px bg-slate-200 mx-2"></div>
                        <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-2 text-slate-700 hover:text-red-600 hover:bg-red-50">
                            <LogOut className="h-4 w-4" />
                            Keluar
                        </Button>
                    </div>
                </header>
                <main className="flex-1 p-6 overflow-y-auto">
                    <div className="max-w-7xl mx-auto">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
