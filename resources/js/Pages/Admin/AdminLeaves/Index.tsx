import { useState } from "react"
import { Head, router } from "@inertiajs/react"
import AdminLayout from "@/Layouts/AdminLayout"
import { Button } from "@/Components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/Components/ui/card"
import { Input } from "@/Components/ui/input"
import { Label } from "@/Components/ui/label"
import { Badge } from "@/Components/ui/badge"
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/Components/ui/table"
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/Components/ui/select"
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/Components/ui/alert-dialog"
import { Shield, Plus, Trash2, Search, CalendarDays, User } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import axios from "axios"

interface UserOption {
    id: number
    name: string
    email: string
}

interface AdminLeave {
    id: number
    user: { id: number; name: string; email: string }
    granted_by_user?: { name: string }
    start_date: string
    end_date: string
    type: string
    type_label: string
    notes: string | null
    created_at: string
}

interface PaginatedAdminLeaves {
    data: AdminLeave[]
    current_page: number
    last_page: number
    total: number
}

interface Props {
    admin_leaves: PaginatedAdminLeaves
    users: UserOption[]
    filters: { search: string }
}

const TYPE_LABELS: Record<string, string> = {
    sakit: "Sakit",
    cuti: "Cuti",
    izin_resmi: "Izin Resmi",
    dinas_luar: "Dinas Luar",
    lainnya: "Lainnya",
}

const TYPE_COLORS: Record<string, string> = {
    sakit: "bg-red-100 text-red-700 border-red-200",
    cuti: "bg-blue-100 text-blue-700 border-blue-200",
    izin_resmi: "bg-green-100 text-green-700 border-green-200",
    dinas_luar: "bg-indigo-100 text-indigo-700 border-indigo-200",
    lainnya: "bg-gray-100 text-gray-700 border-gray-200",
}

export default function AdminLeavesIndex({ admin_leaves, users, filters }: Props) {
    const { toast } = useToast()

    // Form state
    const [selectedUser, setSelectedUser] = useState<string>("")
    const [startDate, setStartDate] = useState<string>("")
    const [endDate, setEndDate] = useState<string>("")
    const [type, setType] = useState<string>("lainnya")
    const [notes, setNotes] = useState<string>("")
    const [userSearch, setUserSearch] = useState<string>("")
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Filter search
    const [filterSearch, setFilterSearch] = useState(filters.search || "")

    const filteredUsers = users.filter(u =>
        u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
        u.email.toLowerCase().includes(userSearch.toLowerCase())
    )

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedUser || !startDate || !endDate) {
            toast({ variant: "destructive", title: "Lengkapi semua field yang wajib diisi." })
            return
        }
        setIsSubmitting(true)
        try {
            await axios.post("/admin/admin-leaves", {
                user_id: selectedUser,
                start_date: startDate,
                end_date: endDate,
                type,
                notes: notes || null,
            })
            toast({ title: "✅ Izin berhasil diberikan" })
            // Reset form
            setSelectedUser("")
            setStartDate("")
            setEndDate("")
            setType("lainnya")
            setNotes("")
            setUserSearch("")
            router.reload({ only: ["admin_leaves"] })
        } catch (err: any) {
            toast({
                variant: "destructive",
                title: "Gagal",
                description: err.response?.data?.message || "Terjadi kesalahan."
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleDelete = async (id: number) => {
        try {
            await axios.delete(`/admin/admin-leaves/${id}`)
            toast({ title: "✅ Izin berhasil dibatalkan" })
            router.reload({ only: ["admin_leaves"] })
        } catch {
            toast({ variant: "destructive", title: "Gagal membatalkan izin." })
        }
    }

    const handleFilterSearch = (e: React.FormEvent) => {
        e.preventDefault()
        router.get("/admin/admin-leaves", { search: filterSearch }, { preserveState: true })
    }

    const formatDate = (dateStr: string) =>
        new Date(dateStr).toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" })

    return (
        <AdminLayout>
            <Head title="Izin Dadakan Karyawan" />
            <div className="p-6 space-y-6">
                <div className="flex items-center gap-3">
                    <Shield className="h-7 w-7 text-indigo-600" />
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">Izin Dadakan Karyawan</h1>
                        <p className="text-sm text-slate-500">Admin dapat memberikan izin langsung kepada karyawan tanpa perlu pengajuan.</p>
                    </div>
                </div>

                {/* Form Tambah Izin */}
                <Card className="border-indigo-200 shadow-md">
                    <CardHeader className="bg-indigo-50/60 rounded-t-lg">
                        <CardTitle className="flex items-center gap-2 text-indigo-800">
                            <Plus className="h-5 w-5" /> Berikan Izin Baru
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-5">
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Cari Karyawan */}
                            <div className="space-y-2">
                                <Label className="font-semibold">
                                    <User className="inline h-4 w-4 mr-1" />
                                    Karyawan <span className="text-red-500">*</span>
                                </Label>
                                {selectedUser ? (
                                    <div className="flex items-center justify-between p-3 bg-indigo-50 border border-indigo-200 rounded-lg">
                                        <div>
                                            <p className="font-semibold text-sm text-indigo-900">
                                                ✓ {users.find(u => String(u.id) === selectedUser)?.name}
                                            </p>
                                            <p className="text-xs text-indigo-600">
                                                {users.find(u => String(u.id) === selectedUser)?.email}
                                            </p>
                                        </div>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="text-slate-500 hover:text-red-600"
                                            onClick={() => { setSelectedUser(""); setUserSearch(""); }}
                                        >
                                            Ganti
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="relative">
                                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                                        <Input
                                            placeholder="Ketik nama atau email karyawan..."
                                            value={userSearch}
                                            onChange={e => setUserSearch(e.target.value)}
                                            className="pl-9"
                                        />
                                        {userSearch && (
                                            <div className="absolute z-20 left-0 right-0 top-full mt-1 border rounded-lg max-h-56 overflow-y-auto bg-white shadow-lg">
                                                {filteredUsers.length === 0 ? (
                                                    <p className="p-3 text-sm text-slate-400 text-center">Karyawan tidak ditemukan</p>
                                                ) : filteredUsers.map(u => (
                                                    <button
                                                        key={u.id}
                                                        type="button"
                                                        className="w-full text-left px-4 py-2.5 text-sm hover:bg-indigo-50 transition-colors border-b last:border-b-0 flex justify-between items-center"
                                                        onClick={() => {
                                                            setSelectedUser(String(u.id));
                                                            setUserSearch("");
                                                        }}
                                                    >
                                                        <span className="font-medium text-slate-800">{u.name}</span>
                                                        <span className="text-slate-400 text-xs">{u.email}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Tanggal & Tipe */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="start_date" className="font-semibold">
                                        <CalendarDays className="inline h-4 w-4 mr-1" />
                                        Dari Tanggal <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="start_date"
                                        type="date"
                                        value={startDate}
                                        onChange={e => setStartDate(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="end_date" className="font-semibold">
                                        <CalendarDays className="inline h-4 w-4 mr-1" />
                                        Sampai Tanggal <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="end_date"
                                        type="date"
                                        value={endDate}
                                        min={startDate}
                                        onChange={e => setEndDate(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="type" className="font-semibold">Tipe Izin <span className="text-red-500">*</span></Label>
                                    <Select value={type} onValueChange={setType}>
                                        <SelectTrigger id="type">
                                            <SelectValue placeholder="Pilih tipe..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="sakit">🏥 Sakit</SelectItem>
                                            <SelectItem value="cuti">🌴 Cuti</SelectItem>
                                            <SelectItem value="izin_resmi">📋 Izin Resmi</SelectItem>
                                            <SelectItem value="dinas_luar">✈️ Dinas Luar</SelectItem>
                                            <SelectItem value="lainnya">📝 Lainnya</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Catatan */}
                            <div className="space-y-2">
                                <Label htmlFor="notes" className="font-semibold">Catatan (opsional)</Label>
                                <Input
                                    id="notes"
                                    placeholder="Misal: Operasi, keperluan keluarga, dll."
                                    value={notes}
                                    onChange={e => setNotes(e.target.value)}
                                />
                            </div>

                            <Button
                                type="submit"
                                disabled={isSubmitting || !selectedUser || !startDate || !endDate}
                                className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
                            >
                                {isSubmitting ? "Menyimpan..." : "✅ Berikan Izin"}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* Daftar Izin */}
                <Card className="shadow-md">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle>Daftar Izin Aktif ({admin_leaves.total})</CardTitle>
                            <form onSubmit={handleFilterSearch} className="flex gap-2">
                                <Input
                                    placeholder="Cari karyawan..."
                                    value={filterSearch}
                                    onChange={e => setFilterSearch(e.target.value)}
                                    className="w-48"
                                />
                                <Button type="submit" variant="outline" size="sm">
                                    <Search className="h-4 w-4" />
                                </Button>
                            </form>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Karyawan</TableHead>
                                        <TableHead>Periode Izin</TableHead>
                                        <TableHead>Tipe</TableHead>
                                        <TableHead>Catatan</TableHead>
                                        <TableHead>Diberikan Oleh</TableHead>
                                        <TableHead className="text-right">Aksi</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {admin_leaves.data.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center text-slate-400 py-10">
                                                Belum ada izin dadakan yang diberikan.
                                            </TableCell>
                                        </TableRow>
                                    ) : admin_leaves.data.map(leave => (
                                        <TableRow key={leave.id}>
                                            <TableCell>
                                                <div>
                                                    <p className="font-semibold text-sm">{leave.user.name}</p>
                                                    <p className="text-xs text-slate-400">{leave.user.email}</p>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="text-sm">
                                                    <p className="font-medium">{formatDate(leave.start_date)}</p>
                                                    <p className="text-slate-400">s/d {formatDate(leave.end_date)}</p>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${TYPE_COLORS[leave.type] || TYPE_COLORS.lainnya}`}>
                                                    {TYPE_LABELS[leave.type] || "Lainnya"}
                                                </span>
                                            </TableCell>
                                            <TableCell className="max-w-[180px]">
                                                <p className="text-sm text-slate-600 truncate">{leave.notes || "-"}</p>
                                            </TableCell>
                                            <TableCell>
                                                <p className="text-xs text-slate-500">{leave.granted_by_user?.name || "Admin"}</p>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700 hover:bg-red-50">
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>Batalkan Izin?</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                Izin untuk <strong>{leave.user.name}</strong> ({formatDate(leave.start_date)} - {formatDate(leave.end_date)}) akan dihapus. Tindakan ini tidak dapat dibatalkan.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Batal</AlertDialogCancel>
                                                            <AlertDialogAction
                                                                className="bg-red-600 hover:bg-red-700"
                                                                onClick={() => handleDelete(leave.id)}
                                                            >
                                                                Ya, Batalkan Izin
                                                            </AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Pagination */}
                        {admin_leaves.last_page > 1 && (
                            <div className="flex justify-center gap-2 mt-4">
                                {Array.from({ length: admin_leaves.last_page }, (_, i) => i + 1).map(page => (
                                    <Button
                                        key={page}
                                        size="sm"
                                        variant={page === admin_leaves.current_page ? "default" : "outline"}
                                        onClick={() => router.get("/admin/admin-leaves", { page, search: filterSearch })}
                                    >
                                        {page}
                                    </Button>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AdminLayout>
    )
}
