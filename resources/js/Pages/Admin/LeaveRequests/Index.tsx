import { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Button } from "@/Components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/Components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/Components/ui/card";
import { Badge } from '@/Components/ui/badge';
import { Loader2, Check, X, MailQuestion } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from "@/hooks/use-toast";

interface LeaveRequest {
    id: number;
    user: { name: string };
    start_date: string;
    end_date: string;
    reason: string;
    status: 'pending' | 'approved' | 'rejected';
}

export default function AdminLeaveRequestsIndex({ requests }: { requests: LeaveRequest[] }) {
    const { toast } = useToast();
    const [processingId, setProcessingId] = useState<number | null>(null);

    const handleUpdateStatus = (id: number, status: 'approved' | 'rejected') => {
        setProcessingId(id);
        router.patch(`/admin/leave-requests/${id}`, { status }, {
            onFinish: () => setProcessingId(null),
            onSuccess: () => {
                toast({
                    title: "Berhasil",
                    description: `Pengajuan cuti berhasil ${status === 'approved' ? 'disetujui' : 'ditolak'}`
                });
            },
            onError: () => {
                toast({ variant: "destructive", title: "Gagal", description: "Gagal memperbarui status" });
            }
        });
    };

    const pendingRequests = requests.filter(r => r.status === 'pending');
    const processedRequests = requests.filter(r => r.status !== 'pending');

    return (
        <AdminLayout>
            <Head title="Manajemen Cuti" />
            <div className="space-y-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-blue-100 rounded-lg">
                        <MailQuestion className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Manajemen Cuti</h1>
                        <p className="text-muted-foreground">Tinjau dan proses pengajuan cuti karyawan.</p>
                    </div>
                </div>

                {/* Pending Requests */}
                <Card className="border-amber-200 bg-amber-50/30">
                    <CardHeader>
                        <CardTitle className='flex items-center gap-2 text-amber-800'>
                            <MailQuestion className='h-5 w-5' />
                            Permintaan Menunggu Persetujuan
                        </CardTitle>
                        <CardDescription className="text-amber-700/80">
                            Terdapat {pendingRequests.length} permintaan yang perlu ditinjau.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-amber-100/50 border-amber-200">
                                    <TableHead className="text-amber-900">Karyawan</TableHead>
                                    <TableHead className="text-amber-900">Tanggal</TableHead>
                                    <TableHead className="text-amber-900">Alasan</TableHead>
                                    <TableHead className='text-right text-amber-900'>Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {pendingRequests.length > 0 ? pendingRequests.map(req => (
                                    <TableRow key={req.id} className="hover:bg-amber-100/50 border-amber-200">
                                        <TableCell className="font-medium text-amber-900">{req.user.name}</TableCell>
                                        <TableCell className="text-amber-800">{`${format(new Date(req.start_date), 'dd MMM yyyy')} - ${format(new Date(req.end_date), 'dd MMM yyyy')}`}</TableCell>
                                        <TableCell className='text-amber-800'>{req.reason}</TableCell>
                                        <TableCell className='text-right space-x-2'>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className='bg-white text-green-600 border-green-200 hover:bg-green-50 hover:text-green-700 hover:border-green-300'
                                                onClick={() => handleUpdateStatus(req.id, 'approved')}
                                                disabled={processingId === req.id}
                                            >
                                                {processingId === req.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Check className="h-4 w-4 mr-1" /> Setujui</>}
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className='bg-white text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 hover:border-red-300'
                                                onClick={() => handleUpdateStatus(req.id, 'rejected')}
                                                disabled={processingId === req.id}
                                            >
                                                {processingId === req.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <><X className="h-4 w-4 mr-1" /> Tolak</>}
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow><TableCell colSpan={4} className="text-center h-24 text-amber-800/60">Tidak ada permintaan cuti yang menunggu.</TableCell></TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {/* Processed Requests */}
                <Card>
                    <CardHeader>
                        <CardTitle>Riwayat Permintaan Cuti</CardTitle>
                        <CardDescription>Daftar permintaan yang sudah diproses.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Karyawan</TableHead>
                                    <TableHead>Tanggal</TableHead>
                                    <TableHead>Alasan</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {processedRequests.length > 0 ? processedRequests.map(req => (
                                    <TableRow key={req.id}>
                                        <TableCell className="font-medium">{req.user.name}</TableCell>
                                        <TableCell>{`${format(new Date(req.start_date), 'dd MMM yyyy')} - ${format(new Date(req.end_date), 'dd MMM yyyy')}`}</TableCell>
                                        <TableCell className='text-muted-foreground'>{req.reason}</TableCell>
                                        <TableCell>
                                            <Badge
                                                variant={req.status === 'approved' ? 'default' : 'destructive'}
                                                className={req.status === 'approved' ? 'bg-green-100 text-green-700 hover:bg-green-100' : 'bg-red-100 text-red-700 hover:bg-red-100'}
                                            >
                                                {req.status === 'approved' ? 'Disetujui' : 'Ditolak'}
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow><TableCell colSpan={4} className="text-center h-24 text-muted-foreground">Tidak ada riwayat permintaan cuti.</TableCell></TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </AdminLayout>
    );
}
