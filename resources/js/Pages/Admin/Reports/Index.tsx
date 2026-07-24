import { useState, useEffect, useMemo } from 'react';
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
    const users = Array.isArray(props.users) ? props.users : [];
    const filters = props.filters || {};

    const [professionId, setProfessionId] = useState(filters.profession_id || '');
    const [startDate, setStartDate] = useState(filters.start_date || '');
    const [endDate, setEndDate] = useState(filters.end_date || '');
    const [isLoading, setIsLoading] = useState(false);
    const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const totalPages = Math.ceil(attendances.length / itemsPerPage);

    // Matrix View States & Logic
    const [viewMode, setViewMode] = useState<'detail' | 'matrix'>('detail');
    const [searchQuery, setSearchQuery] = useState('');
    const [matrixPage, setMatrixPage] = useState(1);

    useEffect(() => {
        setCurrentPage(1);
        setMatrixPage(1);
    }, [props.attendances, props.users]);

    const paginatedAttendances = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return attendances.slice(startIndex, startIndex + itemsPerPage);
    }, [attendances, currentPage]);

    // Calculate dates in range
    const dateList = useMemo(() => {
        if (!startDate || !endDate) return [];
        const dates = [];
        let current = new Date(startDate);
        const end = new Date(endDate);
        
        const maxDays = 100; // Safety limit
        let count = 0;
        
        while (current <= end && count < maxDays) {
            dates.push(current.toISOString().split('T')[0]);
            current.setDate(current.getDate() + 1);
            count++;
        }
        return dates;
    }, [startDate, endDate]);

    // Matrix Filter & Pagination
    const filteredUsers = useMemo(() => {
        if (!searchQuery) return users;
        return users.filter(u => u.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }, [users, searchQuery]);

    const totalMatrixPages = Math.ceil(filteredUsers.length / itemsPerPage);

    const paginatedUsers = useMemo(() => {
        const startIndex = (matrixPage - 1) * itemsPerPage;
        return filteredUsers.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredUsers, matrixPage]);

    // Format Matrix day/date headers
    const formatMatrixHeaderDate = (dateStr: string) => {
        const days = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];
        const d = new Date(dateStr);
        const dayName = days[d.getDay()];
        const dateNum = d.getDate();
        const monthName = months[d.getMonth()];
        return { day: dayName, date: `${dateNum} ${monthName}` };
    };

    // Calculate attendance status for cell
    const getAttendanceStatus = (userId: number, dateStr: string) => {
        const att = attendances.find(a => {
            if (a.user_id !== userId) return false;
            const clockInDate = a.clock_in && a.clock_in !== '-' ? a.clock_in.substring(0, 10) : null;
            const createdAtDate = a.created_at ? a.created_at.substring(0, 10) : null;
            return clockInDate === dateStr || createdAtDate === dateStr;
        });

        if (!att) {
            return { code: '-', label: 'Alpa (Tidak Hadir)', colorClass: 'text-slate-400 bg-slate-50 border-slate-100 hover:bg-slate-100 transition-colors' };
        }

        if (att.status === 'Dinas Luar Kota' || att.status === 'dinas luar kota' || att.status === 'Dinas Luar') {
            return { code: 'DL', label: 'Dinas Luar Kota', colorClass: 'text-purple-700 bg-purple-100 border-purple-200 font-bold hover:bg-purple-200 transition-colors shadow-sm' };
        }

        if (att.status === 'terlambat' || att.status === 'late') {
            return { code: 'T', label: 'Terlambat', colorClass: 'text-red-700 bg-red-100 border-red-200 font-bold hover:bg-red-200 transition-colors shadow-sm' };
        }

        // Check if early
        if (att.shift && att.clock_in && att.clock_in !== '-') {
            try {
                const clockInMatch = att.clock_in.match(/(\d{2}):(\d{2}):(\d{2})/);
                const shiftStartMatch = att.shift.start_time.match(/(\d{2}):(\d{2}):(\d{2})/);
                if (clockInMatch && shiftStartMatch) {
                    const clockInMins = parseInt(clockInMatch[1]) * 60 + parseInt(clockInMatch[2]);
                    const shiftStartMins = parseInt(shiftStartMatch[1]) * 60 + parseInt(shiftStartMatch[2]);
                    const diff = shiftStartMins - clockInMins;
                    if (diff > 10) {
                        return { code: 'E', label: 'Early (Masuk Awal)', colorClass: 'text-amber-700 bg-amber-100 border-amber-200 font-bold hover:bg-amber-200 transition-colors shadow-sm' };
                    }
                }
            } catch (e) {
                console.error(e);
            }
        }

        return { code: 'OT', label: 'Tepat Waktu', colorClass: 'text-green-700 bg-green-100 border-green-200 font-bold hover:bg-green-200 transition-colors shadow-sm' };
    };

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
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <CardTitle>Hasil Laporan</CardTitle>
                                <CardDescription className="mt-1">
                                    {viewMode === 'detail' 
                                        ? `Menampilkan ${attendances.length} log absensi.`
                                        : `Menampilkan kehadiran ${users.length} karyawan dalam rentang tanggal.`
                                    }
                                </CardDescription>
                            </div>
                            
                            <div className="flex flex-wrap items-center gap-3">
                                <div className="flex bg-slate-100 p-1 rounded-lg border">
                                    <button
                                        type="button"
                                        onClick={() => setViewMode('detail')}
                                        className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                                            viewMode === 'detail'
                                                ? 'bg-white text-slate-800 shadow-sm'
                                                : 'text-slate-500 hover:text-slate-800'
                                        }`}
                                    >
                                        Laporan Detail
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setViewMode('matrix')}
                                        className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                                            viewMode === 'matrix'
                                                ? 'bg-white text-slate-800 shadow-sm'
                                                : 'text-slate-500 hover:text-slate-800'
                                        }`}
                                    >
                                        Matriks Kehadiran
                                    </button>
                                </div>

                                {viewMode === 'matrix' && (
                                    <div className="w-52">
                                        <Input
                                            placeholder="Cari nama..."
                                            value={searchQuery}
                                            onChange={e => setSearchQuery(e.target.value)}
                                            className="h-8 text-xs bg-white"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {viewMode === 'matrix' && (
                            <div className="flex flex-wrap gap-3 items-center bg-slate-50 p-3 rounded-lg border text-xs">
                                <span className="font-semibold text-slate-500">Legend Status:</span>
                                <div className="flex items-center gap-1.5">
                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-700 border border-green-200 shadow-sm">OT</span>
                                    <span className="text-slate-600">Tepat Waktu (On Time)</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700 border border-red-200 shadow-sm">T</span>
                                    <span className="text-slate-600">Terlambat (Late)</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700 border border-amber-200 shadow-sm">E</span>
                                    <span className="text-slate-600">Early (Awal)</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-700 border border-purple-200 shadow-sm">DL</span>
                                    <span className="text-slate-600">Dinas Luar Kota</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <span className="px-2 py-0.5 rounded text-[10px] font-normal bg-slate-50 text-slate-400 border border-slate-100">-</span>
                                    <span className="text-slate-600">Alpa / Tidak Absen</span>
                                </div>
                            </div>
                        )}

                        {viewMode === 'matrix' && dateList.length > 31 && (
                            <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg text-xs font-medium">
                                Rentang tanggal terlalu panjang ({dateList.length} hari). Silakan batasi filter rentang tanggal hingga maksimal 31 hari untuk kenyamanan pembacaan Matriks Kehadiran.
                            </div>
                        )}

                        {viewMode === 'detail' ? (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Karyawan</TableHead>
                                            <TableHead>Jabatan</TableHead>
                                            <TableHead>Tanggal</TableHead>
                                            <TableHead>Jam Masuk</TableHead>
                                            <TableHead>IP Address</TableHead>
                                            <TableHead>Jam Keluar</TableHead>
                                            <TableHead>Foto</TableHead>
                                            <TableHead>Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {paginatedAttendances.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                                                    Tidak ada data untuk ditampilkan.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            paginatedAttendances.map((att: any) => (
                                                <TableRow key={att.id}>
                                                    <TableCell>
                                                        <div className="font-medium">{att.user?.name || 'Unknown'}</div>
                                                        {att.user && (
                                                            <div className="flex items-center gap-1.5 mt-1">
                                                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                                                                    att.user.status === 'pns' ? 'bg-blue-100 text-blue-700' :
                                                                    att.user.status === 'militer' ? 'bg-red-100 text-red-700' :
                                                                    att.user.status === 'pppk' ? 'bg-indigo-100 text-indigo-700' :
                                                                    att.user.status === 'pblu' ? 'bg-amber-100 text-amber-700' :
                                                                    'bg-slate-100 text-slate-700'
                                                                }`}>
                                                                    {att.user.status || 'NON-PNS'}
                                                                </span>
                                                                {(att.user.nip || att.user.employee_id) && (
                                                                    <span className="text-[11px] text-muted-foreground font-mono">
                                                                        {att.user.nip || att.user.employee_id}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>{att.user?.profession?.name || '-'}</TableCell>
                                                    <TableCell>
                                                        {format(new Date(att.clock_in && att.clock_in !== '-' ? att.clock_in : att.created_at || new Date()), 'dd MMM yyyy')}
                                                    </TableCell>
                                                    <TableCell>{att.clock_in}</TableCell>
                                                    <TableCell className="font-mono text-xs">
                                                        {att.ip_address || att.clock_in_ip || '-'}
                                                    </TableCell>
                                                    <TableCell>{att.clock_out || '-'}</TableCell>
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
                                                            ) : att.clock_out && att.clock_out !== '-' ? (
                                                                <span className="text-xs text-muted-foreground italic" title="Tidak ada foto">-</span>
                                                            ) : null}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold
                                                            ${att.status === 'tepat waktu' ? 'bg-green-100 text-green-700' :
                                                                att.status === 'terlambat' ? 'bg-red-100 text-red-700' :
                                                                att.status === 'Dinas Luar Kota' ? 'bg-purple-100 text-purple-700' :
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
                            </div>
                        ) : (
                            // Matrix View Table
                            <div className="overflow-x-auto border rounded-lg max-h-[600px] overflow-y-auto">
                                <Table className="relative w-full border-collapse">
                                    <TableHeader className="sticky top-0 bg-slate-100 z-10">
                                        <TableRow className="bg-slate-100">
                                            <TableHead className="sticky left-0 bg-slate-100 z-20 min-w-[180px] shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">Karyawan</TableHead>
                                            <TableHead className="min-w-[130px]">Jabatan</TableHead>
                                            {dateList.length === 0 ? (
                                                <TableHead>Tanggal</TableHead>
                                            ) : (
                                                dateList.map(dStr => {
                                                    const formatted = formatMatrixHeaderDate(dStr);
                                                    return (
                                                        <TableHead key={dStr} className="text-center py-2 px-3 min-w-[90px] border-l">
                                                            <div className="text-[10px] text-muted-foreground uppercase font-bold">{formatted.day}</div>
                                                            <div className="text-xs font-semibold text-slate-800">{formatted.date}</div>
                                                        </TableHead>
                                                    );
                                                })
                                            )}
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {paginatedUsers.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={3 + dateList.length} className="text-center py-8 text-muted-foreground">
                                                    Tidak ada data karyawan.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            paginatedUsers.map((user: any) => (
                                                <TableRow key={user.id} className="hover:bg-slate-50/80 transition-colors">
                                                    <TableCell className="sticky left-0 bg-white font-medium shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] z-10">
                                                        <div className="font-semibold text-slate-800">{user.name}</div>
                                                        <div className="flex items-center gap-1 mt-0.5">
                                                            <span className={`px-1 py-0.2 text-[8px] font-bold rounded uppercase ${
                                                                user.status === 'pns' ? 'bg-blue-50 text-blue-600' :
                                                                user.status === 'militer' ? 'bg-red-50 text-red-600' :
                                                                user.status === 'pppk' ? 'bg-indigo-50 text-indigo-600' :
                                                                user.status === 'pblu' ? 'bg-amber-50 text-amber-600' :
                                                                'bg-slate-50 text-slate-600'
                                                            }`}>
                                                                {user.status || 'NON-PNS'}
                                                            </span>
                                                            {(user.nip || user.employee_id) && (
                                                                <span className="text-[9px] text-muted-foreground font-mono">
                                                                    {user.nip || user.employee_id}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-sm text-slate-600">{user.profession?.name || '-'}</TableCell>
                                                    {dateList.length === 0 ? (
                                                        <TableCell className="text-center text-xs text-muted-foreground italic">-</TableCell>
                                                    ) : (
                                                        dateList.map(dStr => {
                                                            const status = getAttendanceStatus(user.id, dStr);
                                                            return (
                                                                <TableCell key={dStr} className="text-center border-l p-2">
                                                                    <div 
                                                                        title={`${user.name} - ${dStr}: ${status.label}`}
                                                                        className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-xs border transition-all shadow-sm select-none ${status.colorClass}`}
                                                                    >
                                                                        {status.code}
                                                                    </div>
                                                                </TableCell>
                                                            );
                                                        })
                                                    )}
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        )}

                        {/* Pagination Controls */}
                        {viewMode === 'detail' && totalPages > 1 && (
                            <div className="flex justify-between items-center mt-4 pt-4 border-t">
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                    disabled={currentPage === 1}
                                >
                                    Sebelumnya
                                </Button>
                                <span className="text-sm text-muted-foreground">
                                    Halaman {currentPage} dari {totalPages}
                                </span>
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                    disabled={currentPage === totalPages}
                                >
                                    Selanjutnya
                                </Button>
                            </div>
                        )}

                        {viewMode === 'matrix' && totalMatrixPages > 1 && (
                            <div className="flex justify-between items-center mt-4 pt-4 border-t">
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={() => setMatrixPage(prev => Math.max(prev - 1, 1))}
                                    disabled={matrixPage === 1}
                                >
                                    Sebelumnya
                                </Button>
                                <span className="text-sm text-muted-foreground">
                                    Halaman {matrixPage} dari {totalMatrixPages}
                                </span>
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={() => setMatrixPage(prev => Math.min(prev + 1, totalMatrixPages))}
                                    disabled={matrixPage === totalMatrixPages}
                                >
                                    Selanjutnya
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

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
                                className="max-w-full max-h-[80vh] object-contain mx-auto"
                            />
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
