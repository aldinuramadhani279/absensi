import { Head, usePage } from "@inertiajs/react";
import AdminLayout from "@/Layouts/AdminLayout";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/Components/ui/table";
import { AlertTriangle, Download, Image as ImageIcon } from "lucide-react";
import { Badge } from "@/Components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/Components/ui/dialog";
import { Button } from "@/Components/ui/button";

interface Whistleblowing {
    id: number;
    type: string;
    details: string;
    reported_name: string | null;
    photo_evidence: string | null;
    created_at: string;
}

export default function WhistleblowingIndex() {
    const { reports } = usePage<{ reports: Whistleblowing[] }>().props;

    return (
        <AdminLayout>
            <Head title="Laporan Whistleblowing" />

            <div className="mb-6">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                    <AlertTriangle className="h-6 w-6 text-red-600" /> 
                    Laporan Whistleblowing Rahasia
                </h1>
                <p className="text-slate-500 mt-1">Daftar laporan tindak pelanggaran / kecurangan dari anonim.</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <Table>
                    <TableHeader className="bg-slate-50">
                        <TableRow>
                            <TableHead className="w-[150px]">Tanggal Upload</TableHead>
                            <TableHead>Kategori</TableHead>
                            <TableHead>Nama Terduga</TableHead>
                            <TableHead>Rincian Kejahatan</TableHead>
                            <TableHead className="text-right">Bukti Foto</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {reports.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-8 text-slate-500">
                                    Belum ada laporan masuk.
                                </TableCell>
                            </TableRow>
                        ) : (
                            reports.map((report) => (
                                <TableRow key={report.id}>
                                    <TableCell className="font-medium whitespace-nowrap">
                                        {new Date(report.created_at).toLocaleDateString("id-ID", {
                                            day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit"
                                        })}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                                            {report.type}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {report.reported_name ? (
                                            <span className="font-semibold">{report.reported_name}</span>
                                        ) : (
                                            <span className="text-slate-400 italic">Anonim/Tidak Tahu</span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Dialog>
                                            <DialogTrigger asChild>
                                                <Button variant="link" className="p-0 h-auto text-blue-600">Lihat Kronologi</Button>
                                            </DialogTrigger>
                                            <DialogContent className="max-w-xl">
                                                <DialogHeader>
                                                    <DialogTitle>Rincian Kejadian</DialogTitle>
                                                    <DialogDescription>Dilaporkan: {new Date(report.created_at).toLocaleString('id-ID')}</DialogDescription>
                                                </DialogHeader>
                                                <div className="bg-slate-50 p-4 border rounded-md whitespace-pre-wrap text-sm leading-relaxed mt-2">
                                                    {report.details}
                                                </div>
                                            </DialogContent>
                                        </Dialog>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {report.photo_evidence ? (
                                            <Dialog>
                                                <DialogTrigger asChild>
                                                    <Button variant="outline" size="sm" className="gap-2">
                                                        <ImageIcon className="h-4 w-4" /> Buka Foto
                                                    </Button>
                                                </DialogTrigger>
                                                <DialogContent className="max-w-3xl">
                                                    <DialogHeader>
                                                        <DialogTitle>Bukti Kejadian</DialogTitle>
                                                    </DialogHeader>
                                                    <div className="flex justify-center mt-4">
                                                        <img 
                                                            src={`/storage/${report.photo_evidence}`} 
                                                            alt="Bukti" 
                                                            className="max-w-full max-h-[70vh] rounded-lg shadow-sm border"
                                                        />
                                                    </div>
                                                </DialogContent>
                                            </Dialog>
                                        ) : (
                                            <span className="text-slate-400 italic text-sm">Tidak Ada</span>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </AdminLayout>
    );
}
