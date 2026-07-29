import { useState, useRef, useEffect } from "react"
import { Head, router } from "@inertiajs/react"
import { Button } from "@/Components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/Components/ui/card"
import { Alert, AlertDescription } from "@/Components/ui/alert"
import { Clock, LogOut, Clock3, Clock9, CheckCircle2, Loader2, History, FilePlus, Key, Frown, Smile, ThumbsUp, Camera, MapPin, AlertCircle, RefreshCw, UserCog } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/Components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Label } from "@/Components/ui/label"
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/Components/ui/dialog"
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
    has_duplicate_ip?: boolean;
    duplicate_ip_users?: string[];
    flash?: {
        success?: string;
        error?: string;
    }
}

// Utility functions (jika ada)

export default function EmployeeDashboard({ auth, attendance: initialAttendance, shifts, has_forgot_clock_out, has_duplicate_ip = false, duplicate_ip_users = [], flash }: DashboardProps) {
    const { toast } = useToast()

    // Local state
    const [attendance, setAttendance] = useState<Attendance | null>(initialAttendance)
    const [selectedShift, setSelectedShift] = useState<string>("")
    const [isCustomShift, setIsCustomShift] = useState(false)
    const [customShiftStart, setCustomShiftStart] = useState("")
    const [customShiftEnd, setCustomShiftEnd] = useState("")

    // [DOUBLE SHIFT] State untuk lanjut double shift (absen shift berikutnya tanpa hapus shift sebelumnya)
    const [isDoubleShiftMode, setIsDoubleShiftMode] = useState(false)
    const [submitProgressText, setSubmitProgressText] = useState<string>("")
    const [isForgotLoading, setIsForgotLoading] = useState(false)

    const [isClockingIn, setIsClockingIn] = useState(false)
    const [isClockingOut, setIsClockingOut] = useState(false)
    const [isRequestingReset, setIsRequestingReset] = useState(false)
    const [isMobileDevice, setIsMobileDevice] = useState(true)

    useEffect(() => {
        const checkMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        setIsMobileDevice(checkMobile);
    }, []);

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
    const fileInputRef = useRef<HTMLInputElement>(null)
    const actionTypeRef = useRef<"in" | "out" | null>(null)

    const user = auth?.user;
    const hasClockOut = Boolean(attendance && attendance.clock_out !== null);

    // Safe Date Parser (Safari / iOS Mobile Fix)
    // Safari di iPhone mengembalikan NaN jika string datetime mengandung spasi " " alih-alih ISO "T"
    const parseDate = (dateStr?: string | null) => {
        if (!dateStr) return null;
        const normalized = dateStr.includes('T') ? dateStr : dateStr.replace(' ', 'T');
        const parsed = new Date(normalized);
        return isNaN(parsed.getTime()) ? null : parsed;
    };

    // [DOUBLE SHIFT WINDOW] Tombol double shift hanya muncul dalam 1 jam setelah clock out
    // Catatan: Jika absensi di-auto-close (lupa clock out), jangan aktifkan double shift agar user langsung bisa Clock In fresh
    const clockOutDate = parseDate(attendance?.clock_out);
    const minutesSinceClockOut = clockOutDate
        ? (Date.now() - clockOutDate.getTime()) / (1000 * 60)
        : null;
    const isDoubleShiftAvailable = hasClockOut && !(attendance as any)?.is_auto_closed && minutesSinceClockOut !== null && minutesSinceClockOut >= 0 && minutesSinceClockOut <= 60;

    // Stop camera stream
    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
    }

    // Helper konversi canvas ke Blob yang aman & ultra-cepat untuk semua HP (HP modern + HP lama)
    const getCanvasBlob = (canvas: HTMLCanvasElement, quality = 0.65): Promise<Blob | null> => {
        return new Promise((resolve) => {
            if (typeof canvas.toBlob === 'function') {
                try {
                    canvas.toBlob((blob) => {
                        if (blob) {
                            resolve(blob);
                        } else {
                            // Fallback jika toBlob mengembalikan null
                            tryDataUrlFallback(canvas, quality, resolve);
                        }
                    }, 'image/jpeg', quality);
                    return;
                } catch (e) {
                    console.warn('canvas.toBlob threw error, trying dataURL fallback:', e);
                }
            }
            tryDataUrlFallback(canvas, quality, resolve);
        });
    };

    const tryDataUrlFallback = (canvas: HTMLCanvasElement, quality: number, resolve: (b: Blob | null) => void) => {
        try {
            const dataURL = canvas.toDataURL('image/jpeg', quality);
            // Gunakan native fetch jika didukung (sangat cepat & aman di C++)
            if (typeof fetch === 'function') {
                fetch(dataURL)
                    .then(res => res.blob())
                    .then(blob => resolve(blob))
                    .catch(() => manualBase64ToBlob(dataURL, resolve));
            } else {
                manualBase64ToBlob(dataURL, resolve);
            }
        } catch (e) {
            console.error('Canvas blob conversion error:', e);
            resolve(null);
        }
    };

    const manualBase64ToBlob = (dataURL: string, resolve: (b: Blob | null) => void) => {
        try {
            const parts = dataURL.split(',');
            const byteString = atob(parts[1]);
            const mimeString = parts[0].split(':')[1].split(';')[0];
            const ab = new ArrayBuffer(byteString.length);
            const ia = new Uint8Array(ab);
            for (let i = 0; i < byteString.length; i++) {
                ia[i] = byteString.charCodeAt(i);
            }
            resolve(new Blob([ab], { type: mimeString }));
        } catch (e) {
            console.error('manualBase64ToBlob error:', e);
            resolve(null);
        }
    };

    // Handle File Input Fallback (Kamera bawaan HP)
    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setSubmitProgressText("[1/2] Mengompresi Foto...");

        // Gunakan URL.createObjectURL (0 MB RAM overhead, cegah crash Out-Of-Memory di HP lama)
        const objectUrl = URL.createObjectURL(file);
        const img = new Image();

        img.onload = async () => {
            try {
                // Gunakan offscreen canvas independen agar tidak pernah terpengaruh unmount UI
                const canvas = document.createElement('canvas');
                
                const maxDim = 640;
                let width = img.width || 640;
                let height = img.height || 480;

                if (width > maxDim || height > maxDim) {
                    if (width > height) {
                        height = Math.round((height * maxDim) / width);
                        width = maxDim;
                    } else {
                        width = Math.round((width * maxDim) / height);
                        height = maxDim;
                    }
                }

                // Proteksi dimensi minimum
                canvas.width = Math.max(1, width);
                canvas.height = Math.max(1, height);
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

                    // Tambahkan Watermark
                    const dateStr = new Date().toLocaleString("id-ID");
                    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
                    ctx.fillRect(10, canvas.height - 35, Math.min(260, canvas.width - 20), 25);
                    ctx.font = "12px sans-serif";
                    ctx.fillStyle = "white";
                    ctx.fillText(`Waktu: ${dateStr}`, 15, canvas.height - 18);

                    // Reset input file agar bisa digunakan lagi
                    e.target.value = "";

                    const blob = await getCanvasBlob(canvas, 0.65);
                    if (!blob) {
                        toast({ variant: "destructive", title: "Gagal memproses foto", description: "Silakan coba lagi." });
                        setSubmitProgressText("");
                        return;
                    }
                    if (actionTypeRef.current === "in") {
                        await submitClockIn(blob, 0, 0);
                    } else if (actionTypeRef.current === "out") {
                        await submitClockOut(blob, 0, 0);
                    }
                }
            } catch (err) {
                console.error("Image processing error:", err);
                toast({ variant: "destructive", title: "Gagal memproses foto" });
                setSubmitProgressText("");
            } finally {
                URL.revokeObjectURL(objectUrl);
            }
        };

        img.onerror = () => {
            URL.revokeObjectURL(objectUrl);
            toast({ variant: "destructive", title: "Gagal membaca foto" });
            setSubmitProgressText("");
        };

        img.src = objectUrl;
    }

    // Open capture dialog — minta izin kamera dulu, baru buka dialog
    const openCaptureDialog = async (type: "in" | "out") => {
        if (type === "in") {
            if (!selectedShift) {
                toast({ variant: "destructive", title: "Pilih Shift" });
                return;
            }
            if (isCustomShift && (!customShiftStart || !customShiftEnd)) {
                toast({ variant: "destructive", title: "Isi waktu mulai dan selesai shift custom" });
                return;
            }
        }

        actionTypeRef.current = type;
        setActionType(type);

        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

        // Jika tidak mendukung mediaDevices (misal HTTP biasa), langsung fallback ke kamera bawaan HP (hanya untuk HP)
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            if (!isMobile) {
                toast({ variant: "destructive", title: "harap absen menggunakan HP" });
                return;
            }
            stopCamera();
            fileInputRef.current?.click();
            return;
        }

        try {
            // Minta izin stream kamera dengan batasan resolusi ideal 640x480 (enteng di HP lama)
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: "user",
                    width: { ideal: 640 },
                    height: { ideal: 480 }
                }
            });

            // Izin diberikan — buka dialog kamera
            setShowCameraDialog(true);
            streamRef.current = stream;

            setTimeout(() => {
                if (videoRef.current && streamRef.current) {
                    videoRef.current.srcObject = streamRef.current;
                    videoRef.current.play().catch(() => {});
                }
            }, 150);

        } catch (err: any) {
            console.error('Camera error, falling back to file input:', err);
            stopCamera(); // Pastikan hardware kamera dilepas dulu sebelum fallback
            if (!isMobile) {
                toast({ variant: "destructive", title: "harap absen menggunakan HP" });
                return;
            }
            fileInputRef.current?.click();
        }
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
        if (!video) return;

        setSubmitProgressText("[1/2] Mengompresi Foto...");

        try {
            // Gunakan offscreen canvas independen agar tidak pernah terpengaruh unmount UI modal
            const canvas = document.createElement('canvas');

            let width = video.videoWidth || 640;
            let height = video.videoHeight || 480;

            const maxDim = 640;
            if (width > maxDim || height > maxDim) {
                if (width > height) {
                    height = Math.round((height * maxDim) / width);
                    width = maxDim;
                } else {
                    width = Math.round((width * maxDim) / height);
                    height = maxDim;
                }
            }

            // Proteksi dimensi minimum
            canvas.width = Math.max(1, width);
            canvas.height = Math.max(1, height);
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                toast({ variant: "destructive", title: "Gagal memproses foto", description: "Browser tidak mendukung Canvas 2D." });
                setSubmitProgressText("");
                return;
            }

            // Draw video frame ke offscreen canvas
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

            // Add Watermark overlay
            const dateStr = new Date().toLocaleString("id-ID");
            ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
            ctx.fillRect(10, canvas.height - 35, Math.min(260, canvas.width - 20), 25);
            ctx.font = "12px sans-serif";
            ctx.fillStyle = "white";
            ctx.fillText(`Waktu: ${dateStr}`, 15, canvas.height - 18);

            // [PENTING] Buat file Blob TERLEBIH DAHULU saat canvas & stream masih utuh di memori!
            const blob = await getCanvasBlob(canvas, 0.65);

            // Setelah Blob berhasil dibuat, BARU stop kamera dan tutup dialog
            stopCamera();
            setShowCameraDialog(false);

            if (!blob) {
                toast({ variant: "destructive", title: "Gagal memproses foto", description: "Silakan coba lagi." });
                setSubmitProgressText("");
                return;
            }

            const currentAction = actionTypeRef.current || actionType;
            if (currentAction === "in") {
                await submitClockIn(blob, 0, 0);
            } else {
                await submitClockOut(blob, 0, 0);
            }
        } catch (err) {
            console.error("captureAndSubmit error:", err);
            stopCamera();
            setShowCameraDialog(false);
            toast({ variant: "destructive", title: "Gagal memproses foto", description: "Terjadi kesalahan sistem." });
            setSubmitProgressText("");
        }
    }

    const submitClockIn = async (photoBlob: Blob | File, lat: number, lng: number) => {
        setIsClockingIn(true);
        setSubmitProgressText("[2/2] Mengirim Foto...");
        try {
            const formData = new FormData();
            formData.append('shift_id', selectedShift);  // 'custom' jika shift custom
            formData.append('photo', photoBlob, 'clock_in.jpg');
            formData.append('latitude', lat.toString());
            formData.append('longitude', lng.toString());
            // Custom shift fields
            if (isCustomShift) {
                formData.append('custom_shift_start', customShiftStart);
                formData.append('custom_shift_end', customShiftEnd);
            }

            const response = await axios.post("/api/clockin", formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                timeout: 45000 // 45 seconds timeout safeguard
            });

            const newAttendance = response.data.attendance;
            setStatusResult({
                label: response.data.status_label,
                status: newAttendance.status,
                status_code: response.data.status_code,
                time_diff: response.data.time_diff
            });
            setShowStatusDialog(true);
            setAttendance(newAttendance);
            setIsDoubleShiftMode(false);
            router.reload({ only: ['attendance'] });
        } catch (error: any) {
            let errorMsg = "Terjadi kesalahan jaringan saat absensi.";
            if (error.code === 'ECONNABORTED') {
                errorMsg = "Koneksi jaringan sangat lambat. Silakan periksa sinyal HP Anda dan coba lagi.";
            } else if (error.response?.data?.message) {
                errorMsg = error.response.data.message;
            } else if (error.response?.status === 413) {
                errorMsg = "Ukuran foto terlalu besar untuk dikirim.";
            }
            toast({ variant: "destructive", title: "Clock In Gagal", description: errorMsg });
        } finally {
            setIsClockingIn(false);
            setSubmitProgressText("");
        }
    }

    // [FITUR LUPA CLOCK OUT] Auto-close absensi aktif agar bisa clock in fresh
    const handleForgotClockOut = async () => {
        setIsForgotLoading(true);
        try {
            await axios.post("/api/forgot-clockout");
            toast({ title: "✅ Sesi di-reset", description: "Sesi sebelumnya ditutup. Silakan Clock In kembali." });
            router.reload();
        } catch (err: any) {
            toast({
                variant: "destructive",
                title: "Gagal",
                description: err.response?.data?.message || "Gagal mereset sesi."
            });
        } finally {
            setIsForgotLoading(false);
        }
    }

    const submitClockOut = async (photoBlob: Blob | File, lat: number, lng: number) => {
        setIsClockingOut(true);
        setSubmitProgressText("[2/2] Mengirim Foto...");
        try {
            const formData = new FormData();
            formData.append('photo', photoBlob, 'clock_out.jpg');
            formData.append('latitude', lat.toString());
            formData.append('longitude', lng.toString());

            const response = await axios.post("/api/clockout", formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                timeout: 45000 // 45 seconds timeout safeguard
            });
            toast({ title: "Clock Out Berhasil!" });
            router.reload({
                only: ['attendance'],
                onSuccess: (page) => {
                    setAttendance(page.props.attendance as Attendance);
                }
            });
        } catch (error: any) {
            let errorMsg = "Terjadi kesalahan jaringan saat absensi.";
            if (error.code === 'ECONNABORTED') {
                errorMsg = "Koneksi jaringan sangat lambat. Silakan periksa sinyal HP Anda dan coba lagi.";
            } else if (error.response?.data?.message) {
                errorMsg = error.response.data.message;
            } else if (error.response?.status === 413) {
                errorMsg = "Ukuran foto terlalu besar untuk dikirim.";
            }
            toast({ variant: "destructive", title: "Clock Out Gagal", description: errorMsg });
        } finally {
            setIsClockingOut(false);
            setSubmitProgressText("");
        }
    }

    // [N-1] Handler ganti shift setelah clock out
    const handleChangeShift = async () => {
        if (!selectedNewShift) return
        setIsChangingShift(true)
        try {
            const response = await axios.post("/api/shift-change", { shift_id: Number.parseInt(selectedNewShift) })
            toast({ title: "Shift Berhasil Diganti!", description: response.data.message })
            setShowChangeShiftDialog(false)
            setSelectedNewShift("")
            router.reload({
                only: ['attendance'],
                onSuccess: (page) => {
                    setAttendance(page.props.attendance as Attendance)
                }
            })
        } catch (error: any) {
            toast({ variant: "destructive", title: "Gagal Ganti Shift", description: error.response?.data?.message || "Error" })
        } finally {
            setIsChangingShift(false)
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
                        <h1 className="text-xl font-bold text-gray-900">Sistem Presensi</h1>
                        <p className="text-sm text-muted-foreground">Karyawan</p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-2"><LogOut className="h-4 w-4" />Keluar</Button>
                </div>
            </header>

            <main className="container mx-auto px-4 py-6 max-w-2xl">
                {flash?.error && (
                    <Alert className="mb-6 border-red-300 bg-red-50 text-red-800">
                        <AlertCircle className="h-4 w-4 text-red-600" />
                        <AlertDescription className="font-medium">{flash.error}</AlertDescription>
                    </Alert>
                )}

                {flash?.success && (
                    <Alert className="mb-6 border-green-300 bg-green-50 text-green-800">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <AlertDescription className="font-medium">{flash.success}</AlertDescription>
                    </Alert>
                )}

                <Card className="mb-6 shadow-sm text-center">
                    <CardHeader>
                        <CardTitle className="text-2xl">Selamat Datang, {user?.name ?? ''} {user?.profession?.name ? `- ${user.profession.name}` : ''}!</CardTitle>
                        <CardDescription>
                            {new Date().toLocaleDateString("id-ID", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                        </CardDescription>
                    </CardHeader>
                </Card>

                {has_duplicate_ip && (
                    <Alert className="mb-6 border-amber-300 bg-amber-50 text-amber-800">
                        <AlertCircle className="h-4 w-4 text-amber-600" />
                        <AlertDescription>
                            <strong>Warning:</strong> Koneksi IP Anda terdeteksi sama dengan karyawan lain hari ini ({(duplicate_ip_users || []).join(', ')}). Harap pastikan Anda melakukan presensi secara mandiri.
                        </AlertDescription>
                    </Alert>
                )}

                {has_forgot_clock_out && (
                    <Alert className="mb-6 border-yellow-300 bg-yellow-50 text-yellow-800">
                        <Clock className="h-4 w-4" />
                        <AlertDescription>Anda lupa melakukan clock out pada hari sebelumnya. Harap hubungi admin untuk penyesuaian.</AlertDescription>
                    </Alert>
                )}

                <Card className="mb-6 border-blue-200 shadow-md">
                    <CardHeader className="bg-blue-50/50 rounded-t-lg">
                        <CardTitle className="flex items-center gap-2"><Clock className="h-5 w-5 text-blue-600" />Status Presensi Hari Ini</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                        {!attendance || (hasClockOut && isDoubleShiftMode) || (hasClockOut && !isDoubleShiftAvailable) ? (
                            <div className="space-y-4">
                                {isDoubleShiftMode && attendance && (
                                    <Alert className="border-indigo-300 bg-indigo-50 text-indigo-900 text-left">
                                        <RefreshCw className="h-4 w-4 text-indigo-600" />
                                        <AlertDescription>
                                            <strong>Mode Double Shift Active:</strong> Presensi <strong>{attendance.shift?.name}</strong> sebelumnya telah selesai dan tersimpan rapi di Riwayat. Silakan pilih shift baru di bawah ini untuk Clock In shift berikutnya.
                                        </AlertDescription>
                                    </Alert>
                                )}

                                {!isDoubleShiftMode && (
                                    <p className="text-center text-muted-foreground">Anda belum melakukan clock in hari ini.</p>
                                )}
                                
                                {!isMobileDevice && (
                                    <Alert className="border-red-300 bg-red-50 text-red-800 text-left">
                                        <AlertCircle className="h-4 w-4 text-red-600" />
                                        <AlertDescription>
                                            Silakan menggunakan HP untuk melakukan presensi / jangan menggunakan mode desktop.
                                        </AlertDescription>
                                    </Alert>
                                )}

                                <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                                    <Label htmlFor="shift" className="text-slate-700">
                                        {isDoubleShiftMode ? "1. Pilih Shift Berikutnya (Double Shift)" : "1. Pilih Shift Kerja"}
                                    </Label>
                                    <Select
                                        value={selectedShift}
                                        onValueChange={(val) => {
                                            setSelectedShift(val);
                                            setIsCustomShift(val === 'custom');
                                            if (val !== 'custom') {
                                                setCustomShiftStart("");
                                                setCustomShiftEnd("");
                                            }
                                        }}
                                    >
                                        <SelectTrigger id="shift" className="bg-white"><SelectValue placeholder="Pilih shift kerja Anda" /></SelectTrigger>
                                        <SelectContent>
                                            {(shifts || []).map((shift) => (
                                                <SelectItem key={shift.id} value={shift.id.toString()}>{shift.name} ({shift.start_time.substring(0, 5)} - {shift.end_time.substring(0, 5)})</SelectItem>
                                            ))}
                                            {/* [CUSTOM SHIFT] Opsi tambahan untuk shift di luar jadwal */}
                                            <SelectItem value="custom">⏰ Shift Custom (Tentukan Sendiri)</SelectItem>
                                        </SelectContent>
                                    </Select>

                                    {/* [CUSTOM SHIFT] Input waktu muncul saat pilih shift custom */}
                                    {isCustomShift && (
                                        <div className="grid grid-cols-2 gap-3 pt-2">
                                            <div className="space-y-1">
                                                <Label className="text-xs text-slate-600">Jam Mulai</Label>
                                                <input
                                                    type="time"
                                                    value={customShiftStart}
                                                    onChange={e => setCustomShiftStart(e.target.value)}
                                                    className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
                                                    required
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <Label className="text-xs text-slate-600">Jam Selesai</Label>
                                                <input
                                                    type="time"
                                                    value={customShiftEnd}
                                                    onChange={e => setCustomShiftEnd(e.target.value)}
                                                    className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
                                                    required
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <Button onClick={() => openCaptureDialog("in")} disabled={isClockingIn} className="w-full h-12 text-md font-medium bg-blue-600 hover:bg-blue-700" size="lg">
                                    {isClockingIn ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" />{submitProgressText || "Memproses..."}</> : <><Camera className="mr-2 h-5 w-5" />{isDoubleShiftMode ? "Ambil Foto & Clock In Double Shift" : "Ambil Foto & Clock In"}</>}
                                </Button>
                                {isDoubleShiftMode && (
                                    <Button variant="ghost" size="sm" onClick={() => setIsDoubleShiftMode(false)} className="w-full text-slate-500 hover:text-slate-700">
                                        Batal Double Shift
                                    </Button>
                                )}
                            </div>
                        ) : isDoubleShiftAvailable && attendance ? (
                            <div className="text-center p-6 bg-green-50 rounded-xl border border-green-100">
                                <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto mb-3" />
                                <h3 className="font-bold text-lg text-green-900">Presensi Selesai!</h3>
                                <p className="text-green-700 text-sm mb-4">Terima kasih atas kerja keras Anda di shift <strong>{attendance.shift?.name}</strong>.</p>
                                <div className="grid grid-cols-2 gap-4 text-sm mt-2 bg-white/60 p-4 rounded-lg">
                                    <div><p className="text-muted-foreground text-xs uppercase tracking-wider mb-1">Waktu Masuk</p><p className="font-bold text-lg">{parseDate(attendance.clock_in)?.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) ?? '-'}</p></div>
                                    <div><p className="text-muted-foreground text-xs uppercase tracking-wider mb-1">Waktu Pulang</p><p className="font-bold text-lg">{parseDate(attendance.clock_out)?.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) ?? '-'}</p></div>
                                </div>
                                {/* [DOUBLE SHIFT] Tombol Lanjut Double Shift */}
                                <Button
                                    variant="default"
                                    size="lg"
                                    className="mt-5 w-full gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-sm"
                                    onClick={() => { setSelectedShift(""); setIsDoubleShiftMode(true) }}
                                >
                                    <RefreshCw className="h-4 w-4" />
                                    ➕ Lanjut Double Shift
                                </Button>
                            </div>
                        ) : attendance ? (
                            <div className="space-y-6">
                                <div className="text-center p-6 bg-blue-50/80 rounded-xl border border-blue-100">
                                    <p className="text-sm text-blue-800/70 font-medium uppercase tracking-wider mb-1">Waktu Masuk</p>
                                    <p className="text-4xl font-black text-blue-900 tracking-tight">{parseDate(attendance.clock_in)?.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) ?? '-'}</p>
                                    {/* Show status badge if available */}
                                    {attendance.status && (
                                        <div className={`mt-3 inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${attendance.status === 'terlambat' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-green-50 text-green-700 border-green-200'
                                            }`}>
                                            {attendance.status === 'terlambat' ? 'TERLAMBAT' : 'TEPAT WAKTU'}
                                        </div>
                                    )}
                                </div>
                                <div className="space-y-2">
                                     {!isMobileDevice && (
                                         <Alert className="border-red-300 bg-red-50 text-red-800 text-left">
                                             <AlertCircle className="h-4 w-4 text-red-600" />
                                             <AlertDescription>
                                                 Silakan menggunakan HP untuk melakukan presensi / jangan menggunakan mode desktop.
                                             </AlertDescription>
                                         </Alert>
                                     )}
                                     <Button onClick={() => openCaptureDialog("out")} disabled={isClockingOut} className="w-full h-12 text-md font-medium" variant="destructive" size="lg">
                                        {isClockingOut ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" />{submitProgressText || "Memproses..."}</> : <><Camera className="mr-2 h-5 w-5" />Ambil Foto & Clock Out</>}
                                    </Button>
                                    <p className="text-xs text-center text-muted-foreground mt-2">Pastikan Anda berada di area Rumah Sakit untuk melakukan absen pulang.</p>

                                    {/* [FITUR LUPA CLOCK OUT] Tombol muncul saat ada sesi terlupakan */}
                                    {has_forgot_clock_out && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="w-full mt-1 border-amber-300 text-amber-700 hover:bg-amber-50 gap-2"
                                            onClick={handleForgotClockOut}
                                            disabled={isForgotLoading}
                                        >
                                            {isForgotLoading
                                                ? <><Loader2 className="h-4 w-4 animate-spin" /> Mereset sesi...</>
                                                : <>🕐 Lupa Clock Out? Klik di sini untuk reset & absen baru</>}
                                        </Button>
                                    )}
                                </div>
                            </div>
                        ) : null}
                    </CardContent>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <a href="/profile"><Button variant="outline" className="w-full gap-2 border-blue-200 text-blue-800 hover:bg-blue-50"><UserCog className="h-4 w-4" />Edit Profil</Button></a>
                    <a href="/history"><Button variant="outline" className="w-full gap-2"><History className="h-4 w-4" />Riwayat Presensi</Button></a>
                    <a href="/leave-requests"><Button variant="outline" className="w-full gap-2"><FilePlus className="h-4 w-4" />Ajukan Cuti</Button></a>
                    <a href="/travel-requests"><Button variant="outline" className="w-full gap-2"><FilePlus className="h-4 w-4" />Dinas Luar Kota</Button></a>
                    <Dialog>
                        <DialogTrigger asChild><Button variant="outline" className="w-full gap-2"><Key className="h-4 w-4" />Reset Password</Button></DialogTrigger>
                        <DialogContent>
                            <DialogHeader><DialogTitle>Konfirmasi Permintaan Reset Password</DialogTitle></DialogHeader>
                            <p>Admin akan menerima permintaan Anda untuk mereset password. Lanjutkan?</p>
                            <DialogFooter>
                                {/* [FIX M-2] Tambah DialogClose agar tombol Batal bisa menutup dialog */}
                                <DialogClose asChild>
                                    <Button variant="outline">Batal</Button>
                                </DialogClose>
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





                {/* Input File Fallback untuk Kamera Bawaan HP */}
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    accept="image/*" 
                    capture="user" 
                    className="hidden" 
                    onChange={handleFileInputChange} 
                />

                <Toaster />
            </main>

        </div>
    )
}
