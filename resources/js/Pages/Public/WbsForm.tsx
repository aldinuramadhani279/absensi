import { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import { Button } from "@/Components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/Components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/Components/ui/select";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ShieldAlert, Loader2, CheckCircle2, AlertTriangle, FileText, Image as ImageIcon } from 'lucide-react';
import { Toaster } from "@/Components/ui/toaster";

export default function WbsForm({ hash }: { hash: string }) {
    const { toast } = useToast();
    const [submitted, setSubmitted] = useState(false);

    const { data, setData, post, processing, reset, errors } = useForm({
        type: 'Tindak Kecurangan / Korupsi',
        details: '',
        reported_name: '',
        photo_evidence: null as File | null,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!data.details.trim()) {
            toast({
                variant: "destructive",
                title: "Gagal",
                description: "Detail kejadian wajib diisi."
            });
            return;
        }

        // We use standard FormData since we upload files
        post(`/wbs-private/${hash}/submit`, {
            forceFormData: true,
            onSuccess: () => {
                setSubmitted(true);
                reset();
                toast({
                    title: "Berhasil",
                    description: "Laporan Anda telah berhasil terkirim secara anonim."
                });
            },
            onError: () => {
                toast({
                    variant: "destructive",
                    title: "Gagal",
                    description: "Terjadi kesalahan saat mengirim laporan. Silakan coba lagi."
                });
            }
        });
    };

    return (
        <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center p-4 sm:p-6 md:p-8 relative overflow-hidden">
            <Head title="Whistleblowing System - Laporan Anonim" />

            {/* Background Decorative Elements */}
            <div className="absolute w-96 h-96 bg-red-600/10 rounded-full blur-3xl -top-20 -left-20"></div>
            <div className="absolute w-96 h-96 bg-blue-600/10 rounded-full blur-3xl -bottom-20 -right-20"></div>

            <div className="w-full max-w-xl z-10">
                {/* Logo & Header */}
                <div className="flex flex-col items-center mb-6 text-center">
                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-2xl mb-3 shadow-lg shadow-red-500/5">
                        <ShieldAlert className="h-8 w-8 text-red-500" />
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Whistleblowing System</h1>
                    <p className="text-sm text-slate-400 mt-1.5">Kanal Pengaduan Pelanggaran Resmi & Rahasia</p>
                </div>

                {!submitted ? (
                    <Card className="border-slate-800 bg-slate-950/80 backdrop-blur-md shadow-2xl text-slate-200">
                        <CardHeader className="border-b border-slate-900 pb-5">
                            <CardTitle className="text-lg sm:text-xl text-white">Kirim Pengaduan Baru</CardTitle>
                            <CardDescription className="text-slate-400 text-xs sm:text-sm">
                                Laporan Anda akan dikirim langsung ke TUUD (Personalia) secara otomatis tanpa merekam informasi akun Anda.
                            </CardDescription>
                        </CardHeader>
                        
                        <CardContent className="pt-6 space-y-5">
                            {/* Privacy Guarantee Banner */}
                            <div className="flex gap-3 bg-red-950/30 border border-red-900/40 p-4 rounded-xl text-xs sm:text-sm text-red-200/90 shadow-inner">
                                <AlertTriangle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                                <div>
                                    <span className="font-bold text-red-400 block mb-0.5">Jaminan 100% Kerahasiaan</span>
                                    Sistem ini tidak mendeteksi atau menyimpan NIP, Nama, alamat IP, maupun data perangkat pengirim. Laporan bersifat sepenuhnya anonim.
                                </div>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                {/* Jenis Pelanggaran */}
                                <div className="space-y-2">
                                    <Label htmlFor="type" className="text-slate-300 text-sm font-semibold">Jenis Pelanggaran <span className="text-red-500">*</span></Label>
                                    <Select 
                                        value={data.type} 
                                        onValueChange={(val) => setData('type', val)}
                                    >
                                        <SelectTrigger id="type" className="bg-slate-900 border-slate-800 focus:ring-red-500 text-slate-200">
                                            <SelectValue placeholder="Pilih jenis pelanggaran" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-slate-950 border-slate-800 text-slate-200">
                                            <SelectItem value="Tindak Kecurangan / Korupsi">Tindak Kecurangan / Korupsi</SelectItem>
                                            <SelectItem value="Kejahatan / Pelanggaran Khusus">Kejahatan / Pelanggaran Khusus</SelectItem>
                                            <SelectItem value="Penyalahgunaan Wewenang">Penyalahgunaan Wewenang</SelectItem>
                                            <SelectItem value="Lainnya">Lainnya</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {errors.type && <p className="text-xs text-red-500">{errors.type}</p>}
                                </div>

                                {/* Detail Kejadian */}
                                <div className="space-y-2">
                                    <Label htmlFor="details" className="text-slate-300 text-sm font-semibold flex items-center gap-1.5">
                                        <FileText className="h-4 w-4 text-slate-400" />
                                        Detail Kejadian <span className="text-red-500">*</span>
                                    </Label>
                                    <textarea
                                        id="details"
                                        rows={5}
                                        className="flex w-full rounded-md border border-slate-800 bg-slate-900 px-3 py-2 text-sm ring-offset-background placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-slate-200"
                                        placeholder="Tuliskan kronologi kejadian secara lengkap (waktu, lokasi, alur kejadian)..."
                                        value={data.details}
                                        onChange={(e) => setData('details', e.target.value)}
                                        required
                                        disabled={processing}
                                    />
                                    {errors.details && <p className="text-xs text-red-500">{errors.details}</p>}
                                </div>

                                {/* Terduga Pelaku */}
                                <div className="space-y-2">
                                    <Label htmlFor="reported_name" className="text-slate-300 text-sm font-semibold">Nama Terlapor / Pelaku (Opsional)</Label>
                                    <Input
                                        id="reported_name"
                                        type="text"
                                        className="bg-slate-900 border-slate-800 focus:ring-red-500 text-slate-200"
                                        placeholder="Sebutkan nama terduga pelaku jika Anda mengetahuinya..."
                                        value={data.reported_name}
                                        onChange={(e) => setData('reported_name', e.target.value)}
                                        disabled={processing}
                                    />
                                    {errors.reported_name && <p className="text-xs text-red-500">{errors.reported_name}</p>}
                                </div>

                                {/* Foto Bukti */}
                                <div className="space-y-2">
                                    <Label htmlFor="photo" className="text-slate-300 text-sm font-semibold flex items-center gap-1.5">
                                        <ImageIcon className="h-4 w-4 text-slate-400" />
                                        Foto Bukti Kejadian (Opsional)
                                    </Label>
                                    <Input
                                        id="photo"
                                        type="file"
                                        accept="image/*"
                                        className="bg-slate-900 border-slate-800 focus:ring-red-500 text-slate-200 file:text-slate-200 file:bg-slate-800 hover:file:bg-slate-700 cursor-pointer"
                                        onChange={(e) => setData('photo_evidence', e.target.files?.[0] || null)}
                                        disabled={processing}
                                    />
                                    <p className="text-[10px] text-slate-500">Mendukung format gambar (JPG, PNG). Maksimal ukuran file 10MB.</p>
                                    {errors.photo_evidence && <p className="text-xs text-red-500">{errors.photo_evidence}</p>}
                                </div>

                                <CardFooter className="px-0 pt-4 flex gap-3">
                                    <Button
                                        type="submit"
                                        disabled={processing || !data.details.trim()}
                                        className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold transition-all shadow-lg shadow-red-600/20"
                                    >
                                        {processing ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Mengirim Laporan...
                                            </>
                                        ) : (
                                            "Kirim Laporan Rahasia"
                                        )}
                                    </Button>
                                </CardFooter>
                            </form>
                        </CardContent>
                    </Card>
                ) : (
                    <Card className="border-slate-800 bg-slate-950/80 backdrop-blur-md shadow-2xl text-slate-200 text-center py-8">
                        <CardHeader className="flex flex-col items-center">
                            <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-full mb-4 shadow-lg shadow-green-500/5 animate-pulse">
                                <CheckCircle2 className="h-16 w-16 text-green-500" />
                            </div>
                            <CardTitle className="text-2xl text-white font-bold">Laporan Berhasil Terkirim!</CardTitle>
                            <CardDescription className="text-slate-400 text-sm max-w-sm mt-2 mx-auto">
                                Laporan pelanggaran Anda telah diterima oleh unit TUUD (Personalia) secara rahasia dan aman.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4 py-4 text-xs sm:text-sm text-slate-300 max-w-md mx-auto px-6">
                            <p>
                                Terima kasih telah berpartisipasi menjaga nilai kejujuran dan profesionalisme dalam lingkungan kerja kita. Laporan Anda akan ditindaklanjuti secara teliti dan profesional.
                            </p>
                        </CardContent>
                        <CardFooter className="justify-center">
                            <Button 
                                onClick={() => setSubmitted(false)} 
                                variant="outline"
                                className="border-slate-800 text-slate-300 hover:bg-slate-900 hover:text-white"
                            >
                                Kirim Laporan Lainnya
                            </Button>
                        </CardFooter>
                    </Card>
                )}

                {/* Footer Credits */}
                <div className="text-center text-[10px] text-slate-600 mt-6">
                    © {new Date().getFullYear()} Absenku Whistleblowing Channel. All Rights Reserved.
                </div>
            </div>
            <Toaster />
        </div>
    );
}
