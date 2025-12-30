import { useState } from "react"
import { Head, router, usePage } from "@inertiajs/react"
import { Button } from "@/Components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/Components/ui/card"
import { Alert, AlertDescription } from "@/Components/ui/alert"
import { Clock, LogOut, Clock3, Clock9, CheckCircle2, Loader2, History, FilePlus, Key, AlertCircle, XCircle, Frown, Smile, ThumbsUp } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/Components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Label } from "@/Components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/Components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/Components/ui/alert-dialog"
import axios from "axios"

// Interfaces
interface Shift {
    id: number
    name: string
    start_time: string
    end_time: string
}
interface Attendance {
    id: number
    shift_id: number
    clock_in: string
    clock_out: string | null
    status: string
}
interface User {
    id: number;
    name: string;
    email: string;
    profession?: {
        name: string;
    }
}

// Props passed from Laravel
interface DashboardProps {
    auth: { user: User };
    attendance: Attendance | null;
    shifts: Shift[];
    has_forgot_clock_out: boolean;
    flash?: {
        success?: string;
        error?: string;
    }
}

export default function EmployeeDashboard({ auth, attendance: initialAttendance, shifts, has_forgot_clock_out }: DashboardProps) {
    const { toast } = useToast()

    // Local state for interactive parts
    const [attendance, setAttendance] = useState<Attendance | null>(initialAttendance)
    const [selectedShift, setSelectedShift] = useState<string>("")
    const [isClockingIn, setIsClockingIn] = useState(false)
    const [isClockingOut, setIsClockingOut] = useState(false)
    const [isRequestingReset, setIsRequestingReset] = useState(false)

    // Status Dialog State
    const [showStatusDialog, setShowStatusDialog] = useState(false)
    const [statusResult, setStatusResult] = useState<{ label: string, status: string, status_code: string, time_diff: string } | null>(null)

    const user = auth.user;
    const hasClockOut = attendance?.clock_out !== null

    const handleClockIn = async () => {
        if (!selectedShift) {
            toast({ variant: "destructive", title: "Pilih Shift" });
            return;
        }
        setIsClockingIn(true)
        try {
            const response = await axios.post("/api/clockin", { shift_id: Number.parseInt(selectedShift) });
            // toast({ title: "Clock In Berhasil!" }); // Optional, since we have dialog now

            const newAttendance = response.data.attendance;
            const statusLabel = response.data.status_label;
            const statusCode = response.data.status_code;
            const timeDiff = response.data.time_diff;

            setStatusResult({
                label: statusLabel,
                status: newAttendance.status,
                status_code: statusCode,
                time_diff: timeDiff
            });
            setShowStatusDialog(true);

            // Update local state immediately
            setAttendance(newAttendance);

            // Reloading via Inertia ensures consistency with backend.
            router.reload({ only: ['attendance'] });

        } catch (error: any) {
            toast({ variant: "destructive", title: "Clock In Gagal", description: error.response?.data?.message || "Error" });
        } finally {
            setIsClockingIn(false)
        }
    }

    const handleClockOut = async () => {
        setIsClockingOut(true)
        try {
            const response = await axios.post("/api/clockout");
            toast({ title: "Clock Out Berhasil!" });

            router.reload({
                only: ['attendance'],
                onSuccess: (page) => {
                    setAttendance(page.props.attendance as Attendance);
                }
            });
        } catch (error: any) {
            toast({ variant: "destructive", title: "Clock Out Gagal", description: error.response?.data?.message || "Error" });
        } finally {
            setIsClockingOut(false)
        }
    }

    const handlePasswordResetRequest = async () => {
        setIsRequestingReset(true)
        try {
            const response = await axios.post("/api/password/request-from-profile");
            toast({ title: "Permintaan Terkirim!", description: response.data.message });
        } catch (error: any) {
            toast({ variant: "destructive", title: "Permintaan Gagal", description: error.response?.data?.message || "Error" });
        } finally {
            setIsRequestingReset(false)
        }
    }

    const handleLogout = () => {
        router.post('/logout'); // Inertia logout
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Head title="Dashboard Karyawan" />
            <header className="bg-white border-b sticky top-0 z-10">
                <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">Sistem Absensi</h1>
                        <p className="text-sm text-muted-foreground">Karyawan</p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-2"><LogOut className="h-4 w-4" />Keluar</Button>
                </div>
            </header>

            <main className="container mx-auto px-4 py-6 max-w-2xl">
                <Card className="mb-6 shadow-sm text-center">
                    <CardHeader>
                        <CardTitle className="text-2xl">Selamat Datang, {user.name} {user.profession?.name ? `- ${user.profession.name}` : ''}!</CardTitle>
                        <CardDescription>
                            {new Date().toLocaleDateString("id-ID", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                        </CardDescription>
                    </CardHeader>
                </Card>

                {has_forgot_clock_out && (
                    <Alert className="mb-6 border-yellow-300 bg-yellow-50 text-yellow-800">
                        <Clock className="h-4 w-4" />
                        <AlertDescription>Anda lupa melakukan clock out pada hari sebelumnya. Harap hubungi admin untuk penyesuaian.</AlertDescription>
                    </Alert>
                )}

                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Clock className="h-5 w-5" />Status Absensi Hari Ini</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {!attendance ? (
                            <div className="space-y-4">
                                <p className="text-center text-muted-foreground">Anda belum melakukan clock in hari ini.</p>
                                <div className="space-y-2">
                                    <Label htmlFor="shift">Pilih Shift</Label>
                                    <Select value={selectedShift} onValueChange={setSelectedShift}>
                                        <SelectTrigger id="shift"><SelectValue placeholder="Pilih shift kerja Anda" /></SelectTrigger>
                                        <SelectContent>
                                            {shifts.map((shift) => (
                                                <SelectItem key={shift.id} value={shift.id.toString()}>{shift.name} ({shift.start_time.substring(0, 5)} - {shift.end_time.substring(0, 5)})</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <Button onClick={handleClockIn} disabled={isClockingIn || !selectedShift} className="w-full">
                                    {isClockingIn ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Memproses...</> : <><Clock3 className="mr-2 h-4 w-4" />Clock In Sekarang</>}
                                </Button>
                            </div>
                        ) : hasClockOut ? (
                            <div className="text-center p-4 bg-green-50 rounded-lg">
                                <CheckCircle2 className="h-8 w-8 text-green-600 mx-auto mb-2" />
                                <p className="font-medium">Absensi Hari Ini Selesai</p>
                                <div className="grid grid-cols-2 gap-4 text-sm mt-2">
                                    <div><p className="text-muted-foreground">Clock In</p><p>{new Date(attendance.clock_in).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}</p></div>
                                    <div><p className="text-muted-foreground">Clock Out</p><p>{new Date(attendance.clock_out!).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}</p></div>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="text-center p-4 bg-blue-50 rounded-lg">
                                    <p className="text-sm text-muted-foreground">Waktu Masuk</p>
                                    <p className="text-2xl font-bold">{new Date(attendance.clock_in).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}</p>
                                    {/* Show status badge if available */}
                                    {attendance.status && (
                                        <div className={`mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${attendance.status === 'terlambat' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                                            }`}>
                                            {attendance.status === 'terlambat' ? 'Terlambat' : 'Tepat Waktu'}
                                        </div>
                                    )}
                                </div>
                                <Button onClick={handleClockOut} disabled={isClockingOut} className="w-full" variant="destructive">
                                    {isClockingOut ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Memproses...</> : <><Clock9 className="mr-2 h-4 w-4" />Clock Out Sekarang</>}
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <a href="/history"><Button variant="outline" className="w-full gap-2"><History className="h-4 w-4" />Riwayat Absensi</Button></a>
                    <a href="/leave-requests"><Button variant="outline" className="w-full gap-2"><FilePlus className="h-4 w-4" />Ajukan Cuti</Button></a>
                    <Dialog>
                        <DialogTrigger asChild><Button variant="outline" className="w-full gap-2"><Key className="h-4 w-4" />Reset Password</Button></DialogTrigger>
                        <DialogContent>
                            <DialogHeader><DialogTitle>Konfirmasi Permintaan Reset Password</DialogTitle></DialogHeader>
                            <p>Admin akan menerima permintaan Anda untuk mereset password. Lanjutkan?</p>
                            <DialogFooter>
                                <Button variant="outline">Batal</Button>
                                <Button onClick={handlePasswordResetRequest} disabled={isRequestingReset}>
                                    {isRequestingReset ? <Loader2 className="h-4 w-4 animate-spin" /> : "Ya, Kirim Permintaan"}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>

                {/* Status Popup Dialog */}
                <AlertDialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
                    <AlertDialogContent className="sm:max-w-md text-center">
                        <AlertDialogHeader className="flex flex-col items-center justify-center">
                            {statusResult?.status_code === 'late' && (
                                <Frown className="h-20 w-20 text-red-500 mb-4 animate-bounce" />
                            )}
                            {statusResult?.status_code === 'ontime' && (
                                <Smile className="h-20 w-20 text-green-500 mb-4 animate-pulse" />
                            )}
                            {statusResult?.status_code === 'early' && (
                                <div className="flex gap-2 mb-4">
                                    <Smile className="h-16 w-16 text-blue-500 animate-pulse" />
                                    <ThumbsUp className="h-16 w-16 text-blue-500 animate-bounce" />
                                </div>
                            )}

                            <AlertDialogTitle className={`text-2xl font-bold
                                ${statusResult?.status_code === 'late' ? 'text-red-600' :
                                    statusResult?.status_code === 'early' ? 'text-blue-600' : 'text-green-600'}
                            `}>
                                {statusResult?.label}
                            </AlertDialogTitle>

                            <AlertDialogDescription className="text-lg text-gray-700 mt-3 font-medium">
                                {statusResult?.status_code === 'late' ? (
                                    <span>Kamu terlambat <span className="font-bold text-red-600">{statusResult?.time_diff}</span></span>
                                ) : statusResult?.status_code === 'early' ? (
                                    <span>Kamu masuk lebih awal <span className="font-bold text-blue-600">{statusResult?.time_diff}</span></span>
                                ) : (
                                    <span>Terima kasih telah hadir tepat waktu!</span>
                                )}
                            </AlertDialogDescription>

                            {statusResult?.status_code === 'late' && (
                                <p className="text-sm text-muted-foreground mt-2 italic">"Jangan lupa atur waktu lebih baik besok ya!"</p>
                            )}
                            {statusResult?.status_code === 'early' && (
                                <p className="text-sm text-muted-foreground mt-2 italic">"Semangat pagi yang luar biasa!"</p>
                            )}
                        </AlertDialogHeader>
                        <AlertDialogFooter className="sm:justify-center mt-4">
                            <AlertDialogAction onClick={() => setShowStatusDialog(false)}
                                className={`w-full sm:w-auto min-w-[150px] font-bold shadow-lg
                                ${statusResult?.status_code === 'late' ? 'bg-red-600 hover:bg-red-700' :
                                        statusResult?.status_code === 'early' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-green-600 hover:bg-green-700'}
                                `}>
                                {statusResult?.status_code === 'late' ? 'Siap, saya mengerti' : 'Mantap!'}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </main>
        </div>
    )
}
