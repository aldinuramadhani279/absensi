import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { Button } from "@/Components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/Components/ui/table";
import { Card, CardContent } from "@/Components/ui/card";
import { Loader2, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';

// Interfaces
interface Attendance {
    id: number;
    clock_in: string;
    clock_out: string | null;
    status: string;
    shift: { name: string };
    photo_in: string | null;
    photo_out: string | null;
}
interface PaginatedResponse {
    current_page: number;
    data: Attendance[];
    next_page_url: string | null;
    prev_page_url: string | null;
    path: string;
    per_page: number;
    total: number;
}

export default function HistoryPage({ history }: { history: PaginatedResponse }) {
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);

    // If using generic pagination links from Laravel
    const handleLoadMore = () => {
        if (history.next_page_url) {
            setIsLoadingMore(true);
            router.visit(history.next_page_url, {
                preserveScroll: true,
                preserveState: true,
                onFinish: () => setIsLoadingMore(false)
            });
        }
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Head title="Riwayat Absensi" />
            <header className="bg-white border-b sticky top-0 z-10">
                <div className="container mx-auto px-4 py-4 flex items-center gap-4">
                    <Link href="/home">
                        <Button variant="outline" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
                    </Link>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">Riwayat Absensi</h1>
                        <p className="text-sm text-muted-foreground">Lihat semua catatan kehadiran Anda.</p>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 py-6">
                <Card>
                    <CardContent className="pt-6">
                         <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Tanggal</TableHead>
                                    <TableHead>Shift</TableHead>
                                    <TableHead>Clock In</TableHead>
                                    <TableHead>Clock Out</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Foto</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {history.data.length > 0 ? history.data.map(att => (
                                    <TableRow key={att.id}>
                                        <TableCell>{format(new Date(att.clock_in), 'dd MMM yyyy')}</TableCell>
                                        <TableCell>{att.shift?.name || '-'}</TableCell>
                                        <TableCell>{format(new Date(att.clock_in), 'HH:mm:ss')}</TableCell>
                                        <TableCell>{att.clock_out ? format(new Date(att.clock_out), 'HH:mm:ss') : '-'}</TableCell>
                                        <TableCell>{att.status}</TableCell>
                                        <TableCell>
                                            <div className="flex gap-2">
                                                {att.photo_in ? (
                                                    <div 
                                                        onClick={() => setPreviewPhoto(`/storage/${att.photo_in}`)}
                                                        className="cursor-pointer border border-gray-200 rounded overflow-hidden w-10 h-10 bg-gray-50 flex items-center justify-center hover:opacity-80 transition-opacity"
                                                        title="Klik untuk lihat Foto Masuk"
                                                    >
                                                        <img src={`/storage/${att.photo_in}`} alt="Clock In" className="w-full h-full object-cover" />
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground italic">-</span>
                                                )}
                                                {att.photo_out ? (
                                                    <div 
                                                        onClick={() => setPreviewPhoto(`/storage/${att.photo_out}`)}
                                                        className="cursor-pointer border border-gray-200 rounded overflow-hidden w-10 h-10 bg-gray-50 flex items-center justify-center hover:opacity-80 transition-opacity"
                                                        title="Klik untuk lihat Foto Pulang"
                                                    >
                                                        <img src={`/storage/${att.photo_out}`} alt="Clock Out" className="w-full h-full object-cover" />
                                                    </div>
                                                ) : att.clock_out ? (
                                                    <span className="text-xs text-muted-foreground italic" title="Tidak ada foto">-</span>
                                                ) : null}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow><TableCell colSpan={6} className="text-center h-24">Tidak ada riwayat absensi.</TableCell></TableRow>
                                )}
                            </TableBody>
                        </Table>

                        <div className="mt-6 flex justify-between">
                            {history.prev_page_url && (
                                <Link href={history.prev_page_url} preserveScroll>
                                    <Button variant="outline">Sebelumnya</Button>
                                </Link>
                            )}
                            {history.next_page_url && (
                                <Link href={history.next_page_url} preserveScroll>
                                    <Button variant="outline">Selanjutnya</Button>
                                </Link>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </main>

            {/* Modal Preview Foto */}
            {previewPhoto && (
                <div 
                    className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-in fade-in"
                    onClick={() => setPreviewPhoto(null)}
                >
                    <div 
                        className="bg-white rounded-lg overflow-hidden max-w-md w-full relative shadow-xl border"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button 
                            className="absolute top-2 right-2 bg-black/50 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-black/75 transition-colors z-10 font-bold"
                            onClick={() => setPreviewPhoto(null)}
                        >
                            ✕
                        </button>
                        <div className="p-1 bg-black flex items-center justify-center min-h-[300px]">
                            <img 
                                src={previewPhoto} 
                                alt="Preview Absensi" 
                                className="max-h-[70vh] object-contain w-full"
                            />
                        </div>
                        <div className="p-4 flex justify-between items-center bg-gray-50 border-t">
                            <span className="font-semibold text-gray-900 text-sm">Foto Bukti Absensi</span>
                            <Button variant="outline" size="sm" onClick={() => setPreviewPhoto(null)}>
                                Tutup
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
