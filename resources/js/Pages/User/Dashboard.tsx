import { useState, useRef, useEffect } from "react"
import { Head, router } from "@inertiajs/react"
import { Button } from "@/Components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/Components/ui/card"
import { Alert, AlertDescription } from "@/Components/ui/alert"
import { Clock, LogOut, Clock3, Clock9, CheckCircle2, Loader2, History, FilePlus, Key, Frown, Smile, ThumbsUp, Camera, MapPin, AlertCircle } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/Components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Label } from "@/Components/ui/label"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/Components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/Components/ui/alert-dialog"
import { Toaster } from "@/Components/ui/toaster"
import axios from "axios"

// Constants
// Geofencing dihapus

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

// Utility functions (jika ada)

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

    // Whistleblowing State
    const [showWhistleblowing, setShowWhistleblowing] = useState(false);
    const [wbType, setWbType] = useState<string>("Tindak Kecurangan / Korupsi");
    const [wbDetails, setWbDetails] = useState<string>("");
    const [wbName, setWbName] = useState<string>("");
    const [wbPhoto, setWbPhoto] = useState<File | null>(null);
    const [isSubmittingWb, setIsSubmittingWb] = useState(false);

    // Camera State
    const [showCameraDialog, setShowCameraDialog] = useState(false)
    const [actionType, setActionType] = useState<"in" | "out" | null>(null)
    
    const videoRef = useRef<HTMLVideoElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const streamRef = useRef<MediaStream | null>(null)

    const user = auth.user;
    const hasClockOut = attendance?.clock_out !== null

    // Stop camera stream
    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
    }

    // Start camera stream 
    const initCameraAndLocation = () => {

        // Start Camera
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } })
                .then(stream => {
                    streamRef.current = stream;
                    if (videoRef.current) {
                        videoRef.current.srcObject = stream;
                    }
                })
                .catch(err => {
                    console.error(err);
                    if (err.name === 'NotAllowedError') {
                        toast({ variant: "destructive", title: "Kamera Diblokir", description: "Izinkan akses kamera di pengaturan browser." });
                    } else {
                        toast({ variant: "destructive", title: "Kamera Error", description: "Gagal mengakses kamera." });
                    }
                    setShowCameraDialog(false);
                });
        } else {
            toast({ 
                variant: "destructive", 
                title: "Akses Diblokir Browser", 
                description: "Kamera tidak bisa diakses dari koneksi tidak aman (HTTP). Silakan gunakan trik Chrome Flags jika Anda mengetes lewat HP." 
            });
            setShowCameraDialog(false);
        }
    }

    // Open capture dialog
    const openCaptureDialog = (type: "in" | "out") => {
        if (type === "in" && !selectedShift) {
            toast({ variant: "destructive", title: "Pilih Shift" });
            return;
        }
        setActionType(type);
        setShowCameraDialog(true);
        initCameraAndLocation();
    }

    // Handle Close Capture Dialog
    const handleCloseCapture = (open: boolean) => {
        if (!open) {
            stopCamera();
            setShowCameraDialog(false);
        }
    }

    // Capture Photo, Add Watermark & Submit
    const captureAndSubmit = async () => {

        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (!video || !canvas) return;

        // Set canvas size to video size
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Draw image
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Add Watermark overlay
        const dateStr = new Date().toLocaleString("id-ID");
        
        ctx.fillStyle = "rgba(0, 0, 0, 0.5)"; // Semi-transparent black background
        ctx.fillRect(10, canvas.height - 40, 300, 30);

        ctx.font = "16px sans-serif";
        ctx.fillStyle = "white"; // White text
        ctx.fillText(`Waktu: ${dateStr}`, 20, canvas.height - 20);

        // Convert to base64
        const photoBase64 = canvas.toDataURL('image/png');

        // Stop camera
        stopCamera();
        setShowCameraDialog(false);

        // Submit to API
        if (actionType === "in") {
            await submitClockIn(photoBase64, 0, 0);
        } else {
            await submitClockOut(photoBase64, 0, 0);
        }
    }

    const submitClockIn = async (photo: string, lat: number, lng: number) => {
        setIsClockingIn(true)
        try {
            const response = await axios.post("/api/clockin", { 
                shift_id: Number.parseInt(selectedShift),
                photo: photo,
                latitude: lat,
                longitude: lng
            });

            const newAttendance = response.data.attendance;
            // setStatusResult using vars...
            setStatusResult({
                label: response.data.status_label,
                status: newAttendance.status,
                status_code: response.data.status_code,
                time_diff: response.data.time_diff
            });
            setShowStatusDialog(true);
            setAttendance(newAttendance);
            router.reload({ only: ['attendance'] });
        } catch (error: any) {
            toast({ variant: "destructive", title: "Clock In Gagal", description: error.response?.data?.message || "Error" });
        } finally {
            setIsClockingIn(false)
        }
    }

    const submitClockOut = async (photo: string, lat: number, lng: number) => {
        setIsClockingOut(true)
        try {
            const response = await axios.post("/api/clockout", {
                photo: photo,
                latitude: lat,
                longitude: lng
            });
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

    const handleSubmitWb = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmittingWb(true);
        const formData = new FormData();
        formData.append("type", wbType);
        formData.append("details", wbDetails);
        if (wbName) formData.append("reported_name", wbName);
        if (wbPhoto) formData.append("photo_evidence", wbPhoto);

        try {
            const response = await axios.post("/whistleblowing", formData, {
                headers: { "Content-Type": "multipart/form-data" }
            });
            setShowWhistleblowing(false);
            setWbDetails("");
            setWbName("");
            setWbPhoto(null);
            toast({ title: "Laporan Terkirim", description: "Laporan Anda telah berhasil dikirim dengan status Anonim dan rahasia." });
        } catch (error: any) {
            toast({ variant: "destructive", title: "Gagal Mengirim", description: error.response?.data?.message || "Terjadi kesalahan." });
        } finally {
            setIsSubmittingWb(false);
        }
    }

    const handleLogout = () => {
        router.post('/logout'); // Inertia logout
    }

    return (
        <div className="min-h-screen">
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

                <Card className="mb-6 border-blue-200 shadow-md">
                    <CardHeader className="bg-blue-50/50 rounded-t-lg">
                        <CardTitle className="flex items-center gap-2"><Clock className="h-5 w-5 text-blue-600" />Status Absensi Hari Ini</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                        {!attendance ? (
                            <div className="space-y-4">
                                <p className="text-center text-muted-foreground">Anda belum melakukan clock in hari ini.</p>
                                <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                                    <Label htmlFor="shift" className="text-slate-700">1. Pilih Shift Kerja</Label>
                                    <Select value={selectedShift} onValueChange={setSelectedShift}>
                                        <SelectTrigger id="shift" className="bg-white"><SelectValue placeholder="Pilih shift kerja Anda" /></SelectTrigger>
                                        <SelectContent>
                                            {shifts.map((shift) => (
                                                <SelectItem key={shift.id} value={shift.id.toString()}>{shift.name} ({shift.start_time.substring(0, 5)} - {shift.end_time.substring(0, 5)})</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <Button onClick={() => openCaptureDialog("in")} disabled={isClockingIn} className="w-full h-12 text-md font-medium" size="lg">
                                    {isClockingIn ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" />Memproses...</> : <><Camera className="mr-2 h-5 w-5" />Ambil Foto & Clock In</>}
                                </Button>
                            </div>
                        ) : hasClockOut ? (
                            <div className="text-center p-6 bg-green-50 rounded-xl border border-green-100">
                                <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto mb-3" />
                                <h3 className="font-bold text-lg text-green-900">Absensi Selesai!</h3>
                                <p className="text-green-700 text-sm mb-4">Terima kasih atas kerja keras Anda hari ini.</p>
                                <div className="grid grid-cols-2 gap-4 text-sm mt-2 bg-white/60 p-4 rounded-lg">
                                    <div><p className="text-muted-foreground text-xs uppercase tracking-wider mb-1">Waktu Masuk</p><p className="font-bold text-lg">{new Date(attendance.clock_in).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}</p></div>
                                    <div><p className="text-muted-foreground text-xs uppercase tracking-wider mb-1">Waktu Pulang</p><p className="font-bold text-lg">{new Date(attendance.clock_out!).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}</p></div>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <div className="text-center p-6 bg-blue-50/80 rounded-xl border border-blue-100">
                                    <p className="text-sm text-blue-800/70 font-medium uppercase tracking-wider mb-1">Waktu Masuk</p>
                                    <p className="text-4xl font-black text-blue-900 tracking-tight">{new Date(attendance.clock_in).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}</p>
                                    {/* Show status badge if available */}
                                    {attendance.status && (
                                        <div className={`mt-3 inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${attendance.status === 'terlambat' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-green-50 text-green-700 border-green-200'
                                            }`}>
                                            {attendance.status === 'terlambat' ? 'TERLAMBAT' : 'TEPAT WAKTU'}
                                        </div>
                                    )}
                                </div>
                                <div className="space-y-2">
                                     <Button onClick={() => openCaptureDialog("out")} disabled={isClockingOut} className="w-full h-12 text-md font-medium" variant="destructive" size="lg">
                                        {isClockingOut ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" />Memproses...</> : <><Camera className="mr-2 h-5 w-5" />Ambil Foto & Clock Out</>}
                                    </Button>
                                    <p className="text-xs text-center text-muted-foreground mt-2">Pastikan Anda berada di area Rumah Sakit untuk melakukan absen pulang.</p>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <a href="/history"><Button variant="outline" className="w-full gap-2"><History className="h-4 w-4" />Riwayat Absensi</Button></a>
                    <a href="/leave-requests"><Button variant="outline" className="w-full gap-2"><FilePlus className="h-4 w-4" />Ajukan Cuti</Button></a>
                    <a href="/travel-requests"><Button variant="outline" className="w-full gap-2"><FilePlus className="h-4 w-4" />Dinas Luar Kota</Button></a>
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
                    
                    <Button onClick={() => setShowWhistleblowing(true)} className="w-full gap-2 bg-red-600 hover:bg-red-700 text-white relative overflow-hidden group">
                        <AlertCircle className="h-5 w-5 animate-pulse text-yellow-300" />
                        Whistleblowing System
                        <div className="absolute top-0 right-0 p-1">
                            <span className="flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                            </span>
                        </div>
                    </Button>
                </div>

                {/* Camera Capture Dialog */}
                <Dialog open={showCameraDialog} onOpenChange={handleCloseCapture}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>Verifikasi Lokasi & Wajah</DialogTitle>
                            <DialogDescription>
                                Silakan arahkan wajah Anda ke kamera. Pastikan pencahayaan cukup.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="flex flex-col items-center gap-4 py-2">
                            {/* Camera Feed */}
                            <div className="relative w-full aspect-[3/4] max-h-[60vh] bg-black rounded-lg overflow-hidden flex items-center justify-center">
                                <video ref={videoRef} autoPlay playsInline className="absolute top-0 left-0 w-full h-full object-cover"></video>
                                <canvas ref={canvasRef} className="hidden"></canvas>
                            </div>
                        </div>

                        <DialogFooter className="sm:justify-between">
                            <Button variant="outline" onClick={() => handleCloseCapture(false)}>Batal</Button>
                            <Button 
                                onClick={captureAndSubmit} 
                                className={actionType === "out" ? "bg-red-600 hover:bg-red-700" : "bg-blue-600 hover:bg-blue-700"}
                            >
                                <Camera className="mr-2 h-4 w-4" /> 
                                {actionType === "in" ? "Clock In Sekarang" : "Clock Out Sekarang"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Status Popup Dialog (unchanged) */}
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

                {/* Whistleblowing Dialog */}
                <Dialog open={showWhistleblowing} onOpenChange={setShowWhistleblowing}>
                    <DialogContent className="sm:max-w-xl">
                        <DialogHeader>
                            <DialogTitle className="text-red-700 flex items-center gap-2">
                                <AlertCircle className="h-6 w-6" />
                                Form Whistleblowing System
                            </DialogTitle>
                            <DialogDescription>
                                Form pelaporan pelanggaran atau kecurangan.
                            </DialogDescription>
                        </DialogHeader>

                        <Alert className="bg-yellow-50 border-yellow-300 mb-4">
                            <AlertCircle className="h-4 w-4 text-yellow-600" />
                            <AlertDescription className="text-yellow-800 font-semibold text-xs sm:text-sm">
                                Pesan ini akan dikirim ke TUUD (PERSONALIA) SECARA ANONIM DAN RAHASIA. Nama Anda tidak akan diekspose.
                            </AlertDescription>
                        </Alert>

                        <form onSubmit={handleSubmitWb} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="wb_type">Jenis Pelanggaran <span className="text-red-500">*</span></Label>
                                <Select value={wbType} onValueChange={setWbType}>
                                    <SelectTrigger id="wb_type">
                                        <SelectValue placeholder="Pilih jenis pelanggaran" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Tindak Kecurangan / Korupsi">Tindak Kecurangan / Korupsi</SelectItem>
                                        <SelectItem value="Kejahatan / Pelanggaran Khusus">Kejahatan / Pelanggaran Khusus</SelectItem>
                                        <SelectItem value="Lainnya">Lainnya</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="wb_details">Detail Kejadian <span className="text-red-500">*</span></Label>
                                <textarea 
                                    id="wb_details"
                                    className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 min-h-[100px]" 
                                    placeholder="Ceritakan sedetail mungkin kronologi kejadiannya..."
                                    value={wbDetails}
                                    onChange={(e) => setWbDetails(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="wb_name">Nama Pelaku (Jika Tahu)</Label>
                                <input 
                                    type="text" 
                                    id="wb_name"
                                    className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    placeholder="Opsional, sebutkan terduga pelaku jika Anda tahu."
                                    value={wbName}
                                    onChange={(e) => setWbName(e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="wb_photo">Foto Bukti Kejadian (Opsional)</Label>
                                <input 
                                    type="file" 
                                    id="wb_photo"
                                    accept="image/*"
                                    className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    onChange={(e) => setWbPhoto(e.target.files?.[0] || null)}
                                />
                            </div>

                            <DialogFooter className="mt-6">
                                <Button type="button" variant="outline" onClick={() => setShowWhistleblowing(false)}>Batal</Button>
                                <Button type="submit" disabled={isSubmittingWb || !wbDetails} className="bg-red-600 hover:bg-red-700 text-white">
                                    {isSubmittingWb ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Kirim Laporan Rahasia"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                <Toaster />
            </main>
        </div>
    )
}
