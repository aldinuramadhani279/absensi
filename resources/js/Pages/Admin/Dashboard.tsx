import { useState, useEffect } from "react"
import { Head, usePage } from "@inertiajs/react"
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
import { CheckCircle2, Clock, Loader2, AlertCircle } from "lucide-react"
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

export default function AdminDashboard({ requests: initialRequests }: { requests: PasswordResetRequest[] }) {
    const { toast } = useToast()
    // Data passed from Laravel controller
    const [requests, setRequests] = useState<PasswordResetRequest[]>(initialRequests || [])
    const [selectedRequest, setSelectedRequest] = useState<PasswordResetRequest | null>(null)
    const [isApproving, setIsApproving] = useState(false)
    const [showConfirmDialog, setShowConfirmDialog] = useState(false)

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

    const pendingRequests = requests.filter((r) => r.status === "pending")
    const processedRequests = requests.filter((r) => r.status !== "pending")

    return (
        <AdminLayout>
            <Head title="Admin Dashboard" />
            <div>
                <h1 className="text-3xl font-bold mb-6 text-slate-900">Dashboard Overview</h1>
                {/* Stats Cards */}
                <div className="grid gap-4 md:grid-cols-3 mb-6">

                    <Card>
                        <CardHeader className="pb-3">
                            <CardDescription>Total Permintaan</CardDescription>
                            <CardTitle className="text-3xl font-bold">{requests.length}</CardTitle>
                        </CardHeader>
                    </Card>
                    <Card>
                        <CardHeader className="pb-3">
                            <CardDescription>Menunggu Persetujuan</CardDescription>
                            <CardTitle className="text-3xl font-bold text-amber-600">{pendingRequests.length}</CardTitle>
                        </CardHeader>
                    </Card>
                    <Card>
                        <CardHeader className="pb-3">
                            <CardDescription>Sudah Diproses</CardDescription>
                            <CardTitle className="text-3xl font-bold text-green-600">{processedRequests.length}</CardTitle>
                        </CardHeader>
                    </Card>
                </div>

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
