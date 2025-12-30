import { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import { Button } from "@/Components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/Components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/Components/ui/card";
import { Input } from '@/Components/ui/input';
import { Textarea } from '@/Components/ui/textarea';
import { Badge } from '@/Components/ui/badge';
import { Loader2, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';

interface LeaveRequest {
    id: number;
    start_date: string;
    end_date: string;
    reason: string;
    status: 'pending' | 'approved' | 'rejected';
}

export default function LeaveRequestPage({ requests }: { requests: LeaveRequest[] }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        start_date: '',
        end_date: '',
        reason: ''
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/leave-requests', {
            onSuccess: () => reset(),
        });
    };

    const getBadgeVariant = (status: string) => {
        switch (status) {
            case 'approved': return 'default';
            case 'rejected': return 'destructive';
            default: return 'outline';
        }
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Head title="Pengajuan Cuti" />
            <header className="bg-white border-b sticky top-0 z-10">
                <div className="container mx-auto px-4 py-4 flex items-center gap-4">
                    <Link href="/home">
                        <Button variant="outline" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
                    </Link>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">Pengajuan Cuti</h1>
                        <p className="text-sm text-muted-foreground">Isi formulir untuk mengajukan cuti dan lihat riwayatnya.</p>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 py-6 space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Formulir Pengajuan Cuti</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Input type="date" value={data.start_date} onChange={e => setData('start_date', e.target.value)} required />
                                    {errors.start_date && <p className="text-sm text-red-500 mt-1">{errors.start_date}</p>}
                                </div>
                                <div>
                                    <Input type="date" value={data.end_date} onChange={e => setData('end_date', e.target.value)} required />
                                    {errors.end_date && <p className="text-sm text-red-500 mt-1">{errors.end_date}</p>}
                                </div>
                            </div>
                            <div>
                                <Textarea placeholder="Tuliskan alasan cuti Anda..." value={data.reason} onChange={e => setData('reason', e.target.value)} required />
                                {errors.reason && <p className="text-sm text-red-500 mt-1">{errors.reason}</p>}
                            </div>
                            <Button type="submit" disabled={processing}>
                                {processing ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Mengirim...</> : "Kirim Permohonan"}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Riwayat Pengajuan Cuti</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Tanggal Mulai</TableHead>
                                    <TableHead>Tanggal Selesai</TableHead>
                                    <TableHead>Alasan</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {requests.length > 0 ? requests.map(req => (
                                    <TableRow key={req.id}>
                                        <TableCell>{format(new Date(req.start_date), 'dd MMM yyyy')}</TableCell>
                                        <TableCell>{format(new Date(req.end_date), 'dd MMM yyyy')}</TableCell>
                                        <TableCell>{req.reason}</TableCell>
                                        <TableCell><Badge variant={getBadgeVariant(req.status)}>{req.status}</Badge></TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow><TableCell colSpan={4} className="text-center h-24">Belum ada riwayat pengajuan cuti.</TableCell></TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
