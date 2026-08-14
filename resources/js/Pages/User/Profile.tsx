import { useState } from "react"
import { Head, Link, router, usePage } from "@inertiajs/react"
import { Button } from "@/Components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/Components/ui/card"
import { Alert, AlertDescription } from "@/Components/ui/alert"
import { Badge } from "@/Components/ui/badge"
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/Components/ui/dialog"
import { Label } from "@/Components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/Components/ui/select"
import { Toaster } from "@/Components/ui/toaster"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, User, Briefcase, IdCard, Save, Lock, CheckCircle2, AlertCircle, Eye, EyeOff, Loader2, ShieldCheck, DoorOpen } from "lucide-react"
import axios from "axios"

interface Profession {
    id: number
    name: string
}

interface RoomItem {
    id: number
    name: string
    code?: string
}

interface UserProfile {
    id: number
    name: string
    email: string
    nip: string | null
    employee_id: string | null
    status: string | null
    must_change_password: boolean
    profession_id: number | null
    profession: Profession | null
    room_id: number | null
    room?: RoomItem | null
}

interface EmploymentStatusItem {
    id: number
    name: string
    code?: string
}

interface Props {
    user: UserProfile
    professions: Profession[]
    employmentStatuses?: EmploymentStatusItem[]
    rooms?: RoomItem[]
    flash?: { success?: string; error?: string }
}

const DEFAULT_STATUS_LABELS: Record<string, string> = {
    pns: "PNS",
    "non-pns": "Non-PNS",
    militer: "Militer / TNI-Polri",
    pppk: "PPPK",
    pblu: "PBLU",
}

export default function ProfilePage({ user, professions, employmentStatuses = [], rooms = [], flash }: Props) {
    const { toast } = useToast()

    // Form state
    const [name, setName] = useState(user?.name ?? "")
    const [professionId, setProfessionId] = useState(user?.profession_id?.toString() ?? "")
    const [roomId, setRoomId] = useState(user?.room_id?.toString() ?? "")
    const [nip, setNip] = useState(user?.nip ?? "")
    const [employeeId, setEmployeeId] = useState(user?.employee_id ?? "")
    const [status, setStatus] = useState(user?.status ?? "")
    const [isSaving, setIsSaving] = useState(false)

    // Password dialog state
    const [showPasswordDialog, setShowPasswordDialog] = useState(false)
    const [currentPassword, setCurrentPassword] = useState("")
    const [newPassword, setNewPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [showCurrentPw, setShowCurrentPw] = useState(false)
    const [showNewPw, setShowNewPw] = useState(false)
    const [showConfirmPw, setShowConfirmPw] = useState(false)
    const [isChangingPw, setIsChangingPw] = useState(false)
    const [pwError, setPwError] = useState("")

    const handleSaveProfile = (e: React.FormEvent) => {
        e.preventDefault()
        if (!name.trim()) {
            toast({ variant: "destructive", title: "Nama tidak boleh kosong." })
            return
        }
        setIsSaving(true)
        router.post("/profile", {
            name,
            profession_id: professionId,
            room_id: roomId || null,
            nip: nip || null,
            employee_id: employeeId || null,
            status,
        }, {
            onSuccess: () => {
                toast({ title: "✅ Profil Berhasil Disimpan!", description: "Data profil & ploting ruangan Anda telah diperbarui." });
            },
            onError: (errors) => {
                const msg = Object.values(errors).flat().join(", ");
                toast({ variant: "destructive", title: "Gagal menyimpan", description: msg || "Periksa kembali input Anda." });
            },
            onFinish: () => setIsSaving(false),
        });
    }

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault()
        setPwError("")
        if (newPassword !== confirmPassword) {
            setPwError("Konfirmasi password baru tidak cocok.")
            return
        }
        if (newPassword.length < 8) {
            setPwError("Password baru minimal 8 karakter.")
            return
        }
        setIsChangingPw(true)
        try {
            await axios.post("/api/profile/password", {
                current_password: currentPassword,
                password: newPassword,
                password_confirmation: confirmPassword,
            })
            toast({ title: "✅ Password Berhasil Diubah!", description: "Silakan gunakan password baru Anda untuk login berikutnya." })
            setShowPasswordDialog(false)
            setCurrentPassword("")
            setNewPassword("")
            setConfirmPassword("")
        } catch (err: any) {
            const msg = err.response?.data?.message || "Terjadi kesalahan."
            setPwError(msg)
        } finally {
            setIsChangingPw(false)
        }
    }

    const statusLabel = DEFAULT_STATUS_LABELS[user?.status ?? ""] ?? user?.status ?? "-"

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
            <Head title="Edit Profil" />

            {/* Header */}
            <header className="bg-white/80 backdrop-blur-sm border-b sticky top-0 z-10 shadow-sm">
                <div className="container mx-auto px-4 py-4 flex items-center gap-4 max-w-2xl">
                    <Link href="/home">
                        <Button variant="ghost" size="icon" className="rounded-full hover:bg-slate-100">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-lg font-bold text-slate-900">Edit Profil</h1>
                        <p className="text-xs text-slate-500">Kelola informasi akun Anda</p>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 py-6 max-w-2xl space-y-5">

                {/* Flash messages */}
                {flash?.success && (
                    <Alert className="border-green-300 bg-green-50 text-green-800">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <AlertDescription className="font-medium">{flash.success}</AlertDescription>
                    </Alert>
                )}

                {/* Avatar & Info Singkat */}
                <Card className="overflow-hidden shadow-sm">
                    <div className="h-20 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700" />
                    <CardContent className="pt-0 pb-5 px-6">
                        <div className="flex items-end gap-4 -mt-10 mb-4">
                            <div className="h-20 w-20 rounded-2xl bg-white border-4 border-white shadow-md flex items-center justify-center text-3xl font-black text-blue-700 select-none">
                                {name ? name.charAt(0).toUpperCase() : "U"}
                            </div>
                            <div className="pb-1">
                                <h2 className="font-bold text-lg text-slate-900 leading-tight">{user?.name ?? ""}</h2>
                                <p className="text-sm text-slate-500">{user?.email ?? ""}</p>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <Badge variant="secondary" className="gap-1.5 text-xs">
                                <Briefcase className="h-3 w-3" />
                                {user.profession?.name ?? "Belum diatur"}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                                {statusLabel}
                            </Badge>
                            {user.must_change_password && (
                                <Badge variant="destructive" className="gap-1.5 text-xs">
                                    <AlertCircle className="h-3 w-3" />
                                    Harus Ganti Password
                                </Badge>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Form Edit Profil */}
                <Card className="shadow-sm">
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <User className="h-4 w-4 text-blue-600" />
                            Informasi Pribadi
                        </CardTitle>
                        <CardDescription className="text-xs">Perbarui nama, profesi, dan nomor identitas Anda.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSaveProfile} className="space-y-4">

                            {/* Nama */}
                            <div className="space-y-1.5">
                                <Label htmlFor="name" className="text-sm font-medium text-slate-700">
                                    Nama Lengkap <span className="text-red-500">*</span>
                                </Label>
                                <input
                                    id="name"
                                    type="text"
                                    className="flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-slate-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                                    placeholder="Masukkan nama lengkap"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                />
                            </div>

                            {/* Email (read-only) */}
                            <div className="space-y-1.5">
                                <Label className="text-sm font-medium text-slate-700">Email</Label>
                                <div className="flex h-10 w-full rounded-lg border border-slate-100 bg-slate-50 px-3 items-center text-sm text-slate-500 select-none">
                                    {user?.email ?? ""}
                                    <span className="ml-auto text-xs text-slate-400 bg-slate-200 px-2 py-0.5 rounded">Tidak bisa diubah</span>
                                </div>
                            </div>

                            {/* Profesi */}
                            <div className="space-y-1.5">
                                <Label htmlFor="profession" className="text-sm font-medium text-slate-700">
                                    Jabatan / Profesi <span className="text-red-500">*</span>
                                </Label>
                                <Select value={professionId} onValueChange={setProfessionId}>
                                    <SelectTrigger id="profession" className="bg-white focus:ring-blue-100 focus:border-blue-400">
                                        <SelectValue placeholder="Pilih jabatan" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {professions.map((p) => (
                                            <SelectItem key={p.id} value={p.id.toString()}>
                                                {p.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Ruangan / Unit Kerja */}
                            <div className="space-y-1.5">
                                <Label htmlFor="room" className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
                                    <DoorOpen className="h-3.5 w-3.5 text-blue-600" />
                                    Ruangan / Unit Kerja (Ploting)
                                    <span className="text-xs text-slate-400 font-normal">(Opsional)</span>
                                </Label>
                                <Select value={roomId} onValueChange={setRoomId}>
                                    <SelectTrigger id="room" className="bg-white focus:ring-blue-100 focus:border-blue-400">
                                        <SelectValue placeholder="-- Pilih Ruangan / Unit Kerja --" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {rooms.map((r) => (
                                            <SelectItem key={r.id} value={r.id.toString()}>
                                                {r.name} {r.code ? `(${r.code})` : ''}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* NIP */}
                            <div className="space-y-1.5">
                                <Label htmlFor="nip" className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
                                    <IdCard className="h-3.5 w-3.5 text-slate-500" />
                                    NIP / NRP
                                    <span className="text-xs text-slate-400 font-normal">(Opsional)</span>
                                </Label>
                                <input
                                    id="nip"
                                    type="text"
                                    className="flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-slate-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                                    placeholder="Nomor Induk Pegawai / Nomor Registrasi Pokok"
                                    value={nip}
                                    onChange={(e) => setNip(e.target.value)}
                                />
                            </div>

                            {/* Employee ID */}
                            <div className="space-y-1.5">
                                <Label htmlFor="employee_id" className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
                                    <IdCard className="h-3.5 w-3.5 text-slate-500" />
                                    ID Karyawan
                                    <span className="text-xs text-slate-400 font-normal">(Opsional)</span>
                                </Label>
                                <input
                                    id="employee_id"
                                    type="text"
                                    className="flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-slate-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                                    placeholder="ID Karyawan internal"
                                    value={employeeId}
                                    onChange={(e) => setEmployeeId(e.target.value)}
                                />
                            </div>

                            {/* Status Kepegawaian */}
                            <div className="space-y-1.5">
                                <Label htmlFor="status" className="text-sm font-medium text-slate-700">
                                    Status Kepegawaian <span className="text-red-500">*</span>
                                </Label>
                                <Select value={status} onValueChange={setStatus}>
                                    <SelectTrigger id="status" className="bg-white focus:ring-blue-100 focus:border-blue-400">
                                        <SelectValue placeholder="Pilih status kepegawaian" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {employmentStatuses.length > 0 ? (
                                            employmentStatuses.map((st) => (
                                                <SelectItem key={st.id} value={st.code || st.name.toLowerCase()}>{st.name}</SelectItem>
                                            ))
                                        ) : (
                                            Object.entries(DEFAULT_STATUS_LABELS).map(([val, label]) => (
                                                <SelectItem key={val} value={val}>{label}</SelectItem>
                                            ))
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>

                            <Button
                                type="submit"
                                disabled={isSaving}
                                className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-semibold gap-2 shadow-sm"
                            >
                                {isSaving
                                    ? <><Loader2 className="h-4 w-4 animate-spin" />Menyimpan...</>
                                    : <><Save className="h-4 w-4" />Simpan Perubahan</>
                                }
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* Keamanan Akun */}
                <Card className="shadow-sm">
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <ShieldCheck className="h-4 w-4 text-emerald-600" />
                            Keamanan Akun
                        </CardTitle>
                        <CardDescription className="text-xs">Kelola kata sandi untuk menjaga keamanan akun.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                            <div>
                                <p className="text-sm font-semibold text-slate-800">Kata Sandi</p>
                                <p className="text-xs text-slate-500 mt-0.5">Terakhir diperbarui kapan saja</p>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                className="gap-2 border-emerald-200 text-emerald-800 hover:bg-emerald-50"
                                onClick={() => { setPwError(""); setShowPasswordDialog(true) }}
                            >
                                <Lock className="h-3.5 w-3.5" />
                                Ubah Password
                            </Button>
                        </div>
                    </CardContent>
                </Card>

            </main>

            {/* Dialog Ubah Password */}
            <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Lock className="h-5 w-5 text-emerald-600" />
                            Ubah Kata Sandi
                        </DialogTitle>
                        <DialogDescription>
                            Masukkan password lama dan password baru Anda.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleChangePassword} className="space-y-4 pt-2">
                        {pwError && (
                            <Alert className="border-red-300 bg-red-50 py-2.5">
                                <AlertCircle className="h-4 w-4 text-red-500" />
                                <AlertDescription className="text-red-700 text-sm">{pwError}</AlertDescription>
                            </Alert>
                        )}

                        {/* Password lama */}
                        <div className="space-y-1.5">
                            <Label className="text-sm font-medium">Password Saat Ini</Label>
                            <div className="relative">
                                <input
                                    type={showCurrentPw ? "text" : "password"}
                                    className="flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 pr-10 py-2 text-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                                    placeholder="Masukkan password lama"
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    required
                                />
                                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600" onClick={() => setShowCurrentPw(v => !v)}>
                                    {showCurrentPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>

                        {/* Password baru */}
                        <div className="space-y-1.5">
                            <Label className="text-sm font-medium">Password Baru</Label>
                            <div className="relative">
                                <input
                                    type={showNewPw ? "text" : "password"}
                                    className="flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 pr-10 py-2 text-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                                    placeholder="Minimal 8 karakter"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    required
                                    minLength={8}
                                />
                                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600" onClick={() => setShowNewPw(v => !v)}>
                                    {showNewPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                            {/* Password strength indicator */}
                            {newPassword.length > 0 && (
                                <div className="flex gap-1 mt-1">
                                    {[1,2,3,4].map(i => (
                                        <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${
                                            newPassword.length >= i * 3
                                                ? i <= 1 ? 'bg-red-400' : i <= 2 ? 'bg-amber-400' : i <= 3 ? 'bg-blue-400' : 'bg-emerald-500'
                                                : 'bg-slate-200'
                                        }`} />
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Konfirmasi password */}
                        <div className="space-y-1.5">
                            <Label className="text-sm font-medium">Konfirmasi Password Baru</Label>
                            <div className="relative">
                                <input
                                    type={showConfirmPw ? "text" : "password"}
                                    className={`flex h-10 w-full rounded-lg border bg-white px-3 pr-10 py-2 text-sm focus:outline-none focus:ring-2 transition-colors ${
                                        confirmPassword && confirmPassword !== newPassword
                                            ? 'border-red-300 focus:border-red-400 focus:ring-red-100'
                                            : confirmPassword && confirmPassword === newPassword
                                                ? 'border-emerald-300 focus:border-emerald-400 focus:ring-emerald-100'
                                                : 'border-slate-200 focus:border-emerald-400 focus:ring-emerald-100'
                                    }`}
                                    placeholder="Ulangi password baru"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                />
                                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600" onClick={() => setShowConfirmPw(v => !v)}>
                                    {showConfirmPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                            {confirmPassword && confirmPassword === newPassword && (
                                <p className="text-xs text-emerald-600 flex items-center gap-1"><CheckCircle2 className="h-3 w-3" />Password cocok</p>
                            )}
                        </div>

                        <DialogFooter className="pt-2 gap-2">
                            <DialogClose asChild>
                                <Button type="button" variant="outline" className="flex-1">Batal</Button>
                            </DialogClose>
                            <Button
                                type="submit"
                                disabled={isChangingPw || !currentPassword || !newPassword || !confirmPassword}
                                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
                            >
                                {isChangingPw
                                    ? <><Loader2 className="h-4 w-4 animate-spin" />Memperbarui...</>
                                    : <><Lock className="h-4 w-4" />Perbarui Password</>
                                }
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Toaster />
        </div>
    )
}
