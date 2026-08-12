import { useState, useEffect } from "react"
import { Head, usePage, router } from "@inertiajs/react"
import { Button } from "@/Components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/Components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/Components/ui/table"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/Components/ui/dialog"
import { Badge } from "@/Components/ui/badge"
import { Alert, AlertDescription } from "@/Components/ui/alert"
import { CheckCircle2, Clock, Loader2, AlertCircle, ShieldAlert, ShieldCheck, Wifi, Eye, Image as ImageIcon, Users, FileText, Plane, Key } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import axios from "axios" // Using axios for API calls remaining within the page
import AdminLayout from "@/Layouts/AdminLayout"

interface PasswordResetRequest {
    id: number
    user_name: string
    user_email: string
    user_nip?: string
    user_employee_id?: string
    requested_at: string
    status: "pending" | "approved" | "rejected"
}

interface DuplicateIpUser {
    name: string
    time: string
    photo_in?: string | null
}

interface DuplicateIpAlert {
    ip_address: string
    total: number
    users: DuplicateIpUser[]
}

interface CustomShiftAlert {
    id: number
    user_name: string
    user_profession: string
    custom_shift_start: string
    custom_shift_end: string
    clock_in: string
    photo_in?: string | null
}

interface DashboardStats {
    total_employees: number
    today_attendances: number
    today_late: number
    pending_leaves: number
    pending_travels: number
    pending_password_resets: number
}

export default function AdminDashboard({ 
    requests: initialRequests,
    duplicateIpAlerts = [],
    blockDuplicateIp = true,
    customShiftAlerts = [],
    lateToleranceMinutes = 10,
    stats = {
        total_employees: 0,
        today_attendances: 0,
        today_late: 0,
        pending_leaves: 0,
        pending_travels: 0,
        pending_password_resets: 0,
    }
}: { 
    requests: PasswordResetRequest[]
    duplicateIpAlerts?: DuplicateIpAlert[]
    blockDuplicateIp?: boolean
    customShiftAlerts?: CustomShiftAlert[]
    lateToleranceMinutes?: number
    stats?: DashboardStats
}) {
    const { toast } = useToast()
    // Data passed from Laravel controller
    const [requests, setRequests] = useState<PasswordResetRequest[]>(initialRequests || [])
    const [selectedRequest, setSelectedRequest] = useState<PasswordResetRequest | null>(null)
    const [isApproving, setIsApproving] = useState(false)
    const [showConfirmDialog, setShowConfirmDialog] = useState(false)
    const [isTogglingIp, setIsTogglingIp] = useState(false)
    const [selectedPhoto, setSelectedPhoto] = useState<{ name: string; time: string; ip: string; photo_in: string } | null>(null)

    // Toleransi keterlambatan state
    const [lateTolerance, setLateTolerance] = useState<number>(lateToleranceMinutes)
    const [isSavingTolerance, setIsSavingTolerance] = useState(false)

    useEffect(() => {
        setLateTolerance(lateToleranceMinutes)
    }, [lateToleranceMinutes])

    const handleSaveTolerance = (e: React.FormEvent) => {
        e.preventDefault()
        setIsSavingTolerance(true)
        router.post('/admin/update-late-tolerance', { minutes: lateTolerance }, {
            preserveScroll: true,
            onSuccess: () => {
                toast({
                    title: "Toleransi Diperbarui",
                    description: `Batas toleransi keterlambatan berhasil diatur menjadi ${lateTolerance} menit.`,
                })
            },
            onError: () => {
                toast({
                    variant: "destructive",
                    title: "Gagal Menyimpan",
                    description: "Pastikan input berupa angka antara 0 hingga 240 menit.",
                })
            },
            onFinish: () => setIsSavingTolerance(false)
        })
    }

    const handleToggleIp = (enabled: boolean) => {
        setIsTogglingIp(true)
        router.post('/admin/toggle-duplicate-ip', { enabled }, {
            preserveScroll: true,
            onSuccess: () => {
                toast({
                    title: enabled ? "Fitur Blokir IP Diaktifkan" : "Fitur Blokir IP Dinonaktifkan",
                    description: enabled 
                        ? "Absensi dengan IP yang sama kini DIBLOKIR." 
                        : "Absensi dengan IP yang sama kini DIIZINKAN (Bisa Double Absen).",
                })
            },
            onError: () => {
                toast({
                    variant: "destructive",
                    title: "Gagal Mengubah Pengaturan",
                    description: "Terjadi kesalahan saat memperbarui pengaturan.",
                })
            },
            onFinish: () => setIsTogglingIp(false)
        })
    }

    // No need for useEffect detailed data fetching if we pass data as props from Controller
    // However, for actions like Approve, we can keep using API calls OR Inertia visits.
    // Let's stick to axios for actions to avoid full page reloads for small updates, then update local state.

    const handleApproveClick = (request: PasswordResetRequest) => {
        setSelectedRequest(request)
        setShowConfirmDialog(true)
    }

    const handleApproveConfirm = async () => {
        if (!selectedRequest) return

        setIsApproving(true)
        try {
            await axios.post(`/api/admin/password-resets/${selectedRequest.id}/approve`);

            toast({
                title: "Permintaan Disetujui",
                description: `Password untuk ${selectedRequest.user_name} telah direset ke "12345678"`,
            })

            // Update local state instead of reloading everything
            setRequests(requests.map(r =>
                r.id === selectedRequest.id ? { ...r, status: 'approved' } : r
            ));

            setShowConfirmDialog(false)
            setSelectedRequest(null)
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Gagal Menyetujui",
                description: "Terjadi kesalahan saat menyetujui permintaan",
            })
        } finally {
            setIsApproving(false)
        }
    }

    const pendingRequests = (requests || []).filter((r) => r && r.status === "pending")
    const processedRequests = (requests || []).filter((r) => r && r.status !== "pending")

    return (
        <AdminLayout>
            <Head title="Admin Dashboard" />
            <div>
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold text-slate-900">Dashboard Overview</h1>
                    <Button 
                        onClick={async () => {
                            if(confirm('Anda yakin ingin menghapus semua foto absensi yang usianya lebih dari 24 jam?')) {
                                router.post('/admin/prune-photos');
                            }
                        }} 
                        variant="destructive" 
                        className="gap-2"
                    >
                        <AlertCircle className="h-4 w-4" />
                        Hapus Foto (+24 Jam)
                    </Button>
                </div>
                {/* Overview Stats Cards */}
                <div className="grid gap-4 grid-cols-2 md:grid-cols-4 mb-6">
                    <Card className="border-blue-100 bg-blue-50/20 shadow-sm">
                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                                <CardDescription className="font-semibold text-slate-600">Total Karyawan</CardDescription>
                                <Users className="h-5 w-5 text-blue-600" />
                            </div>
                            <CardTitle className="text-3xl font-bold text-slate-900">{stats.total_employees}</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0 text-xs text-slate-500">
                            Karyawan aktif terdaftar
                        </CardContent>
                    </Card>

                    <Card className="border-emerald-100 bg-emerald-50/20 shadow-sm">
                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                                <CardDescription className="font-semibold text-slate-600">Hadir Hari Ini</CardDescription>
                                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                            </div>
                            <CardTitle className="text-3xl font-bold text-emerald-700">{stats.today_attendances}</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0 text-xs text-slate-500 flex justify-between">
                            <span>Presensi terverifikasi</span>
                            {stats.today_late > 0 && (
                                <span className="text-red-600 font-bold">({stats.today_late} Terlambat)</span>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="border-amber-100 bg-amber-50/20 shadow-sm">
                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                                <CardDescription className="font-semibold text-slate-600">Cuti / Izin Pending</CardDescription>
                                <FileText className="h-5 w-5 text-amber-600" />
                            </div>
                            <CardTitle className="text-3xl font-bold text-amber-600">{stats.pending_leaves}</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0 text-xs text-slate-500">
                            Pengajuan menunggu persetujuan
                        </CardContent>
                    </Card>

                    <Card className="border-purple-100 bg-purple-50/20 shadow-sm">
                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                                <CardDescription className="font-semibold text-slate-600">Reset Password</CardDescription>
                                <Key className="h-5 w-5 text-purple-600" />
                            </div>
                            <CardTitle className="text-3xl font-bold text-purple-600">{stats.pending_password_resets}</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0 text-xs text-slate-500">
                            Permintaan pending
                        </CardContent>
                    </Card>
                </div>

                {/* Control Card for Duplicate IP Validation */}
                <Card className="mb-6 border-slate-200 shadow-sm">
                    <CardHeader className="pb-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <Wifi className="h-5 w-5 text-blue-600" />
                                    <CardTitle className="text-lg font-bold">Kontrol Keamanan IP Absensi</CardTitle>
                                    {blockDuplicateIp ? (
                                        <Badge variant="destructive" className="bg-red-600 hover:bg-red-700 text-white font-semibold">
                                            <ShieldAlert className="h-3.5 w-3.5 mr-1" />
                                            BLOKIR IP DUPLIKAT (ON)
                                        </Badge>
                                    ) : (
                                        <Badge variant="outline" className="border-emerald-600 text-emerald-700 bg-emerald-50 font-semibold">
                                            <ShieldCheck className="h-3.5 w-3.5 mr-1 text-emerald-600" />
                                            IZINKAN DOUBLE ABSEN IP (OFF)
                                        </Badge>
                                    )}
                                </div>
                                <CardDescription className="text-sm text-slate-600">
                                    {blockDuplicateIp ? (
                                        <span>Status saat ini: <strong>DIBLOKIR</strong>. Karyawan tidak dapat melakukan absensi lebih dari 1x menggunakan IP Wi-Fi/Jaringan yang sama pada hari yang sama.</span>
                                    ) : (
                                        <span>Status saat ini: <strong>DIIZINKAN</strong>. Beberapa karyawan diperbolehkan melakukan absensi menggunakan IP Wi-Fi/Jaringan yang sama pada hari yang sama.</span>
                                    )}
                                </CardDescription>
                            </div>
                            <div className="shrink-0">
                                {blockDuplicateIp ? (
                                    <Button 
                                        onClick={() => handleToggleIp(false)} 
                                        disabled={isTogglingIp}
                                        variant="outline"
                                        className="border-slate-300 text-slate-700 hover:bg-slate-100 hover:text-slate-900 font-medium"
                                    >
                                        {isTogglingIp && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Matikan Blokir (Izinkan Double Absen)
                                    </Button>
                                ) : (
                                    <Button 
                                        onClick={() => handleToggleIp(true)} 
                                        disabled={isTogglingIp}
                                        className="bg-red-600 hover:bg-red-700 text-white font-medium shadow-sm"
                                    >
                                        {isTogglingIp && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Aktifkan Blokir (Cegah Double Absen)
                                    </Button>
                                )}
                            </div>
                        </div>
                    </CardHeader>
                </Card>

                {/* Control Card for Late Tolerance Setting */}
                <Card className="mb-6 border-slate-200 shadow-sm">
                    <CardHeader className="pb-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <Clock className="h-5 w-5 text-indigo-600" />
                                    <CardTitle className="text-lg font-bold text-slate-900">Pengaturan Toleransi Keterlambatan</CardTitle>
                                    <Badge variant="outline" className="border-indigo-300 text-indigo-700 bg-indigo-50 font-bold">
                                        {lateTolerance} Menit
                                    </Badge>
                                </div>
                                <CardDescription className="text-sm text-slate-600">
                                    Batas waktu kompensasi keterlambatan setelah jam mulai shift. Karyawan yang absen lewat dari <strong>{lateTolerance} menit</strong> dari jam shift akan tercatat <span className="text-red-600 font-semibold">Terlambat</span>.
                                </CardDescription>
                            </div>
                            <form onSubmit={handleSaveTolerance} className="flex items-center gap-2 shrink-0">
                                <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1">
                                    <input
                                        type="number"
                                        min="0"
                                        max="240"
                                        value={lateTolerance}
                                        onChange={(e) => setLateTolerance(Math.max(0, parseInt(e.target.value) || 0))}
                                        className="w-16 bg-transparent text-center font-bold text-slate-900 focus:outline-none text-base"
                                        required
                                    />
                                    <span className="text-xs font-semibold text-slate-500">Menit</span>
                                </div>
                                <Button type="submit" disabled={isSavingTolerance} size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium">
                                    {isSavingTolerance ? <Loader2 className="h-4 w-4 animate-spin" /> : "Simpan"}
                                </Button>
                            </form>
                        </div>
                    </CardHeader>
                </Card>

                {/* [FITUR SHIFT CUSTOM NOTIFICATION] Card Notifikasi Shift Custom Hari Ini */}
                {customShiftAlerts && customShiftAlerts.length > 0 && (
                    <Card className="border-indigo-200 bg-indigo-50/30 mb-6 shadow-sm">
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Clock className="h-5 w-5 text-indigo-600 animate-pulse" />
                                    <CardTitle className="text-lg font-bold text-indigo-900">
                                        Notifikasi Shift Custom Hari Ini ({customShiftAlerts.length})
                                    </CardTitle>
                                </div>
                                <Badge className="bg-indigo-600 text-white font-semibold">
                                    {customShiftAlerts.length} Karyawan
                                </Badge>
                            </div>
                            <CardDescription className="text-indigo-700/80 text-sm">
                                Karyawan berikut melakukan absensi dengan menentukan jadwal jam kerja secara mandiri (Shift Custom).
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {customShiftAlerts.map(item => (
                                    <div key={item.id} className="p-3 bg-white border border-indigo-100 rounded-lg flex items-center justify-between shadow-xs">
                                        <div className="space-y-1">
                                            <p className="font-semibold text-sm text-slate-800">{item.user_name}</p>
                                            <p className="text-xs text-slate-400">{item.user_profession}</p>
                                            <div className="flex items-center gap-1.5 pt-1">
                                                <Badge variant="outline" className="text-xs border-indigo-300 text-indigo-700 bg-indigo-50 font-medium">
                                                    ⏰ {item.custom_shift_start} - {item.custom_shift_end}
                                                </Badge>
                                                <span className="text-xs text-slate-500">
                                                    Absen: {item.clock_in}
                                                </span>
                                            </div>
                                        </div>
                                        {item.photo_in && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 w-8 p-0 text-slate-500 hover:text-indigo-600"
                                                onClick={() => setSelectedPhoto({
                                                    name: item.user_name,
                                                    time: item.clock_in,
                                                    ip: 'Shift Custom',
                                                    photo_in: item.photo_in!
                                                })}
                                            >
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {duplicateIpAlerts && duplicateIpAlerts.length > 0 && (
                    <Card className="border-amber-200 bg-amber-50/20 mb-6">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-amber-800">
                                <AlertCircle className="h-5 w-5 text-amber-600 animate-pulse" />
                                Peringatan: Deteksi IP Absensi Duplikat Hari Ini
                            </CardTitle>
                            <CardDescription className="text-amber-700/80">
                                IP Address berikut digunakan oleh lebih dari satu karyawan untuk melakukan absensi hari ini.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-4 md:grid-cols-2">
                                {duplicateIpAlerts.map((alert) => (
                                    <div key={alert.ip_address} className="p-4 bg-white border border-amber-200 rounded-lg shadow-sm">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="font-mono text-sm font-semibold bg-amber-100 text-amber-800 px-2 py-0.5 rounded">
                                                IP: {alert.ip_address}
                                            </span>
                                            <span className="text-xs text-muted-foreground font-medium">
                                                {alert.total} Karyawan
                                            </span>
                                        </div>
                                        <ul className="text-sm space-y-2 divide-y divide-gray-100">
                                            {alert.users.map((u, i) => (
                                                <li key={i} className="pt-2 first:pt-0 flex items-center justify-between gap-2">
                                                    <div className="flex items-center gap-2.5 overflow-hidden">
                                                        {u.photo_in ? (
                                                            <img 
                                                                src={`/storage/${u.photo_in}`} 
                                                                alt={u.name} 
                                                                className="h-9 w-9 rounded-full object-cover border border-amber-300 shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                                                                onClick={() => setSelectedPhoto({ name: u.name, time: u.time, ip: alert.ip_address, photo_in: u.photo_in! })}
                                                            />
                                                        ) : (
                                                            <div className="h-9 w-9 rounded-full bg-slate-100 border flex items-center justify-center text-slate-400 shrink-0">
                                                                <ImageIcon className="h-4 w-4" />
                                                            </div>
                                                        )}
                                                        <div className="truncate">
                                                            <p className="font-medium text-slate-800 text-sm truncate">{u.name}</p>
                                                            <p className="text-[11px] text-slate-500">Jam: {u.time}</p>
                                                        </div>
                                                    </div>
                                                    {u.photo_in && (
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="h-7 text-xs px-2.5 border-amber-300 text-amber-900 hover:bg-amber-100 shrink-0 gap-1"
                                                            onClick={() => setSelectedPhoto({ name: u.name, time: u.time, ip: alert.ip_address, photo_in: u.photo_in! })}
                                                        >
                                                            <Eye className="h-3.5 w-3.5" />
                                                            Foto
                                                        </Button>
                                                    )}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Dialog Modal Preview Foto Absensi Duplikat IP */}
                <Dialog open={!!selectedPhoto} onOpenChange={(open) => !open && setSelectedPhoto(null)}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 text-slate-900">
                                <Eye className="h-5 w-5 text-blue-600" />
                                Peninjauan Foto Absensi IP Duplikat
                            </DialogTitle>
                            <DialogDescription>
                                Detail bukti foto absensi untuk verifikasi fisik karyawan.
                            </DialogDescription>
                        </DialogHeader>
                        {selectedPhoto && (
                            <div className="space-y-3 pt-2">
                                <div className="p-3 bg-slate-50 rounded-lg text-sm space-y-1 border">
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Nama Karyawan:</span>
                                        <span className="font-bold text-slate-800">{selectedPhoto.name}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Waktu Masuk:</span>
                                        <span className="font-mono font-semibold text-slate-700">{selectedPhoto.time}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">IP Jaringan:</span>
                                        <span className="font-mono font-semibold text-amber-700">{selectedPhoto.ip}</span>
                                    </div>
                                </div>
                                <div className="border rounded-lg overflow-hidden bg-slate-950 flex justify-center items-center p-1 shadow-inner">
                                    <img 
                                        src={`/storage/${selectedPhoto.photo_in}`} 
                                        alt={`Foto Absensi ${selectedPhoto.name}`} 
                                        className="max-h-96 w-full object-contain rounded"
                                    />
                                </div>
                            </div>
                        )}
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setSelectedPhoto(null)} className="w-full">
                                Tutup
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Pending Requests */}
                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Clock className="h-5 w-5 text-amber-600" />
                            Permintaan Reset Password - Menunggu Persetujuan
                        </CardTitle>
                        <CardDescription>Tinjau dan setujui permintaan reset password dari karyawan</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {pendingRequests.length === 0 ? (
                            <div className="py-12 text-center">
                                <div className="mb-4 flex justify-center">
                                    <div className="p-3 bg-green-100 rounded-full">
                                        <CheckCircle2 className="h-8 w-8 text-green-600" />
                                    </div>
                                </div>
                                <p className="text-muted-foreground">Tidak ada permintaan yang menunggu persetujuan</p>
                            </div>
                        ) : (
                            <div className="rounded-lg border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Nama Karyawan</TableHead>
                                            <TableHead>Email</TableHead>
                                            <TableHead>NIP / ID</TableHead>
                                            <TableHead>Waktu Permintaan</TableHead>
                                            <TableHead className="text-right">Aksi</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {pendingRequests.map((request) => (
                                            <TableRow key={request.id}>
                                                <TableCell className="font-medium">{request.user_name}</TableCell>
                                                <TableCell className="text-muted-foreground">{request.user_email}</TableCell>
                                                <TableCell className="text-muted-foreground">
                                                    {request.user_nip || request.user_employee_id || "-"}
                                                </TableCell>
                                                <TableCell className="text-muted-foreground">
                                                    {new Date(request.requested_at).toLocaleString("id-ID", {
                                                        year: "numeric",
                                                        month: "short",
                                                        day: "numeric",
                                                        hour: "2-digit",
                                                        minute: "2-digit",
                                                    })}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button
                                                        onClick={() => handleApproveClick(request)}
                                                        size="sm"
                                                        className="bg-blue-600 hover:bg-blue-700 gap-2"
                                                    >
                                                        <CheckCircle2 className="h-4 w-4" />
                                                        Setujui
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Processed Requests */}
                {processedRequests.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <CheckCircle2 className="h-5 w-5 text-green-600" />
                                Riwayat Permintaan - Sudah Diproses
                            </CardTitle>
                            <CardDescription>Daftar permintaan yang sudah disetujui atau ditolak</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-lg border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Nama Karyawan</TableHead>
                                            <TableHead>Email</TableHead>
                                            <TableHead>NIP / ID</TableHead>
                                            <TableHead>Waktu Permintaan</TableHead>
                                            <TableHead>Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {processedRequests.map((request) => (
                                            <TableRow key={request.id}>
                                                <TableCell className="font-medium">{request.user_name}</TableCell>
                                                <TableCell className="text-muted-foreground">{request.user_email}</TableCell>
                                                <TableCell className="text-muted-foreground">
                                                    {request.user_nip || request.user_employee_id || "-"}
                                                </TableCell>
                                                <TableCell className="text-muted-foreground">
                                                    {new Date(request.requested_at).toLocaleString("id-ID", {
                                                        year: "numeric",
                                                        month: "short",
                                                        day: "numeric",
                                                        hour: "2-digit",
                                                        minute: "2-digit",
                                                    })}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge
                                                        variant={request.status === "approved" ? "default" : "destructive"}
                                                        className={
                                                            request.status === "approved"
                                                                ? "bg-green-100 text-green-800"
                                                                : "bg-red-100 text-red-800"
                                                        }
                                                    >
                                                        {request.status === "approved" ? "Disetujui" : "Ditolak"}
                                                    </Badge>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Confirmation Dialog */}
                <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <AlertCircle className="h-5 w-5 text-amber-600" />
                                Konfirmasi Reset Password
                            </DialogTitle>
                            <DialogDescription className="pt-4 space-y-3">
                                <p>Apakah Anda yakin ingin mereset password untuk:</p>
                                {selectedRequest && (
                                    <div className="p-3 bg-gray-50 rounded-lg space-y-1">
                                        <p className="font-semibold text-foreground">{selectedRequest.user_name}</p>
                                        <p className="text-sm text-muted-foreground">{selectedRequest.user_email}</p>
                                        {(selectedRequest.user_nip || selectedRequest.user_employee_id) && (
                                            <p className="text-sm text-muted-foreground">
                                                {selectedRequest.user_nip || selectedRequest.user_employee_id}
                                            </p>
                                        )}
                                    </div>
                                )}
                                <Alert className="bg-amber-50 border-amber-200">
                                    <AlertDescription className="text-amber-800 text-sm">
                                        Password akan direset ke <span className="font-mono font-bold">12345678</span>. Pengguna harus
                                        mengubah password saat login berikutnya.
                                    </AlertDescription>
                                </Alert>
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setShowConfirmDialog(false)} disabled={isApproving}>
                                Batal
                            </Button>
                            <Button
                                onClick={handleApproveConfirm}
                                disabled={isApproving}
                                className="bg-blue-600 hover:bg-blue-700 gap-2"
                            >
                                {isApproving ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Memproses...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle2 className="h-4 w-4" />
                                        Ya, Setujui
                                    </>
                                )}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </AdminLayout>
    )
}
