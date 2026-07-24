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
    destination_address?: string | null;
    status: 'pending' | 'approved' | 'rejected';
    admin_attachment_path?: string | null;
}

const formatLocalDate = (dateString: string) => {
    if (!dateString) return '';
    const parts = dateString.split('-');
    if (parts.length !== 3) return dateString;
    const year = parts[0];
    const monthIndex = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    
    const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
    return `${day} ${months[monthIndex]} ${year}`;
}

export default function LeaveRequestPage({ requests }: { requests: LeaveRequest[] }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        start_date: '',
        end_date: '',
        reason: '',
        destination_address: '',
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
                                <Input 
                                    type="text" 
                                    placeholder="Alamat Tujuan Cuti (misal: Kota / Kabupaten / Alamat Lengkap Tujuan)..." 
                                    value={data.destination_address} 
                                    onChange={e => setData('destination_address', e.target.value)} 
                                />
                                {errors.destination_address && <p className="text-sm text-red-500 mt-1">{errors.destination_address}</p>}
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
                                    <TableHead>Alamat Tujuan</TableHead>
                                    <TableHead>Alasan</TableHead>
                                    <TableHead>Surat Jalan</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {requests.length > 0 ? requests.map(req => (
                                    <TableRow key={req.id}>
                                        <TableCell>{formatLocalDate(req.start_date)}</TableCell>
                                        <TableCell>{formatLocalDate(req.end_date)}</TableCell>
                                        <TableCell>{req.destination_address || '-'}</TableCell>
                                        <TableCell>{req.reason}</TableCell>
                                        <TableCell>
                                            {req.admin_attachment_path ? (
                                                <a 
                                                    href={`/storage/${req.admin_attachment_path}`} 
                                                    target="_blank" 
                                                    rel="noreferrer"
                                                >
                                                    <Button size="sm" variant="outline" className="text-blue-600 border-blue-200 hover:bg-blue-50 h-8">
                                                        Unduh Surat Jalan
                                                    </Button>
                                                </a>
                                            ) : req.status === 'approved' ? (
                                                <span className="text-xs text-muted-foreground italic">Menunggu Surat Jalan</span>
                                            ) : '-'}
                                        </TableCell>
                                        <TableCell><Badge variant={getBadgeVariant(req.status)}>{req.status}</Badge></TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow><TableCell colSpan={6} className="text-center h-24">Belum ada riwayat pengajuan cuti.</TableCell></TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
