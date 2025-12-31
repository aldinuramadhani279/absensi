import { Head, router } from "@inertiajs/react";
import AdminLayout from "@/Layouts/AdminLayout";
import { Button } from "@/Components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/Components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/Components/ui/table";
import { Badge } from "@/Components/ui/badge";
import { Check, X, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface User {
    id: number;
    name: string;
}

interface TravelRequest {
    id: number;
    user: User;
    start_date: string;
    end_date: string;
    reason: string;
    attachment_path: string | null;
    status: string;
    created_at: string;
}

interface AdminTravelRequestsProps {
    requests: TravelRequest[];
}

export default function AdminTravelRequests({ requests }: AdminTravelRequestsProps) {
    const { toast } = useToast();

    const handleAction = (id: number, status: 'approved' | 'rejected') => {
        if (confirm(`Apakah Anda yakin ingin mengubah status menjadi ${status}?`)) {
            router.patch(`/admin/travel-requests/${id}`, { status }, {
                onSuccess: () => {
                    toast({ title: "Berhasil", description: `Status berhasil diubah menjadi ${status}` });
                },
                onError: () => {
                    toast({ variant: "destructive", title: "Gagal", description: "Terjadi kesalahan" });
                }
            });
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'approved': return <Badge className="bg-green-100 text-green-800">Disetujui</Badge>;
            case 'rejected': return <Badge className="bg-red-100 text-red-800">Ditolak</Badge>;
            default: return <Badge className="bg-yellow-100 text-yellow-800">Menunggu</Badge>;
        }
    };

    const getAttachmentUrl = (path: string) => {
        return `/storage/${path}`;
    };

    return (
        <AdminLayout>
            <Head title="Kelola Dinas Luar Kota" />

            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Dinas Luar Kota</h1>
                    <p className="text-muted-foreground">Kelola pengajuan dinas karyawan.</p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Daftar Pengajuan</CardTitle>
                        <CardDescription>Menampilkan semua pengajuan dinas terbaru.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Karyawan</TableHead>
                                    <TableHead>Tanggal</TableHead>
                                    <TableHead>Tujuan & Alasan</TableHead>
                                    <TableHead>Lampiran</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {requests.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                                            Tidak ada data.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    requests.map((req) => (
                                        <TableRow key={req.id}>
                                            <TableCell className="font-medium">{req.user.name}</TableCell>
                                            <TableCell>
                                                <div className="flex flex-col text-sm">
                                                    <span>{req.start_date}</span>
                                                    <span className="text-muted-foreground">s/d</span>
                                                    <span>{req.end_date}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="max-w-xs truncate" title={req.reason}>{req.reason}</TableCell>
                                            <TableCell>
                                                {req.attachment_path ? (
                                                    <a href={getAttachmentUrl(req.attachment_path)} target="_blank" rel="noreferrer">
                                                        <Button variant="outline" size="sm" className="gap-2">
                                                            <FileText className="h-4 w-4" /> Lihat
                                                        </Button>
                                                    </a>
                                                ) : '-'}
                                            </TableCell>
                                            <TableCell>{getStatusBadge(req.status)}</TableCell>
                                            <TableCell>
                                                {req.status === 'pending' && (
                                                    <div className="flex gap-2">
                                                        <Button
                                                            size="icon"
                                                            variant="default"
                                                            className="h-8 w-8 bg-green-600 hover:bg-green-700"
                                                            onClick={() => handleAction(req.id, 'approved')}
                                                            title="Setujui"
                                                        >
                                                            <Check className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            size="icon"
                                                            variant="destructive"
                                                            className="h-8 w-8"
                                                            onClick={() => handleAction(req.id, 'rejected')}
                                                            title="Tolak"
                                                        >
                                                            <X className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </AdminLayout>
    );
}
