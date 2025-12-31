import { useState, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Button } from "@/Components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/Components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/Components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/Components/ui/select";
import { Input } from '@/Components/ui/input';
import { Loader2, FileDown, FileText, Filter } from 'lucide-react';
import { Label } from "@/Components/ui/label";
import { format } from 'date-fns';

export default function ReportsIndex(props: any) {
    // Paranoid safety checks
    const professions = Array.isArray(props.professions) ? props.professions : [];
    const attendances = Array.isArray(props.attendances) ? props.attendances : [];
    const filters = props.filters || {};

    const [professionId, setProfessionId] = useState(filters.profession_id || '');
    const [startDate, setStartDate] = useState(filters.start_date || '');
    const [endDate, setEndDate] = useState(filters.end_date || '');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        console.log('ReportsIndex Mounted. Props:', props);
    }, [props]);

    const handleFilter = () => {
        setIsLoading(true);
        router.get('/admin/reports', {
            profession_id: professionId,
            start_date: startDate,
            end_date: endDate
        }, {
            preserveState: true,
            preserveScroll: true,
            onFinish: () => setIsLoading(false)
        });
    };

    const handleExport = () => {
        const params = new URLSearchParams();
        if (professionId) params.append('profession_id', professionId);
        if (startDate) params.append('start_date', startDate);
        if (endDate) params.append('end_date', endDate);
        window.location.href = `/admin/reports/export?${params.toString()}`;
    }

    return (
        <AdminLayout>
            <Head title="Laporan Absensi" />
            <div className="space-y-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-blue-100 rounded-lg">
                        <FileText className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Laporan Absensi</h1>
                        <p className="text-muted-foreground">Lihat dan ekspor data absensi karyawan.</p>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Filter className="h-5 w-5" /> Filter Laporan</CardTitle>
                        <CardDescription>Pilih kriteria untuk menampilkan atau mengekspor laporan.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <Label>Jabatan</Label>
                                <Select onValueChange={setProfessionId} value={professionId}>
                                    <SelectTrigger><SelectValue placeholder="Semua Jabatan" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Semua Jabatan</SelectItem>
                                        {professions.map((p: any) => (
                                            <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Tanggal Mulai</Label>
                                <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label>Tanggal Akhir</Label>
                                <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
                            </div>
                        </div>
                        <div className='flex gap-2 justify-end'>
                            <Button onClick={handleFilter} disabled={isLoading}>
                                {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                                Tampilkan Data
                            </Button>
                            <Button onClick={handleExport} variant="outline" className="border-green-600 text-green-700 hover:bg-green-50">
                                <FileDown className="h-4 w-4 mr-2" />
                                Ekspor Excel
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Hasil Laporan</CardTitle>
                        <CardDescription>Menampilkan {attendances.length} data absensi.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Karyawan</TableHead>
                                    <TableHead>Jabatan</TableHead>
                                    <TableHead>Tanggal</TableHead>
                                    <TableHead>Jam Masuk</TableHead>
                                    <TableHead>IP Address</TableHead>
                                    <TableHead>Jam Keluar</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {attendances.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                            Tidak ada data untuk ditampilkan.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    attendances.map((att: any) => (
                                        <TableRow key={att.id}>
                                            <TableCell>
                                                <div className="font-medium">{att.user?.name || 'Unknown'}</div>
                                            </TableCell>
                                            <TableCell>{att.user?.profession?.name || '-'}</TableCell>
                                            <TableCell>
                                                {format(new Date(att.clock_in || att.created_at || new Date()), 'dd MMM yyyy')}
                                            </TableCell>
                                            <TableCell>{att.clock_in}</TableCell>
                                            <TableCell className="font-mono text-xs">
                                                {att.ip_address || att.clock_in_ip || '-'}
                                            </TableCell>
                                            <TableCell>{att.clock_out || '-'}</TableCell>
                                            <TableCell>
                                                <span className={`px-2 py-1 rounded-full text-xs font-semibold
                                                    ${att.status === 'tepat waktu' ? 'bg-green-100 text-green-700' :
                                                        att.status === 'terlambat' ? 'bg-red-100 text-red-700' :
                                                            'bg-blue-100 text-blue-700'}
                                                `}>
                                                    {att.status}
                                                </span>
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
