import { useState, useMemo } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/Components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/Components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/Components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Trash2, Clock, CheckSquare, Square, Users } from 'lucide-react';
import { Label } from "@/Components/ui/label";

interface Profession {
    id: number;
    name: string;
}

interface Shift {
    id: number;
    name: string;
    profession: Profession;
    start_time: string;
    end_time: string;
}

export default function ShiftsIndex({ shifts, professions }: { shifts: Shift[], professions: Profession[] }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        profession_ids: [] as string[],
        start_time: '',
        end_time: '',
    });
    const { toast } = useToast();
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [filterProfession, setFilterProfession] = useState<string>('all');

    // Toggle jabatan dalam multi-select
    const toggleProfession = (id: string) => {
        const current = data.profession_ids;
        if (current.includes(id)) {
            setData('profession_ids', current.filter((v) => v !== id));
        } else {
            setData('profession_ids', [...current, id]);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (data.profession_ids.length === 0) {
            toast({ variant: "destructive", title: "Gagal", description: "Pilih minimal 1 jabatan." });
            return;
        }
        post('/admin/shifts', {
            onSuccess: () => {
                reset();
                toast({ title: "Berhasil", description: `Shift berhasil ditambahkan ke ${data.profession_ids.length} jabatan.` });
            },
            onError: () => {
                toast({ variant: "destructive", title: "Gagal", description: "Gagal menambahkan shift" });
            }
        });
    };

    const handleDelete = (id: number) => {
        if (confirm('Apakah Anda yakin ingin menghapus shift ini?')) {
            setDeletingId(id);
            router.delete(`/admin/shifts/${id}`, {
                onFinish: () => setDeletingId(null),
                onSuccess: () => toast({ title: "Berhasil", description: "Shift berhasil dihapus" }),
            });
        }
    };

    // Filter shifts berdasarkan jabatan yang dipilih
    const filteredShifts = useMemo(() => {
        if (filterProfession === 'all') return shifts;
        return shifts.filter(s => String(s.profession?.id) === filterProfession);
    }, [shifts, filterProfession]);

    // Group shifts by profession for display
    const shiftsByProfession = useMemo(() => {
        const grouped: Record<string, { profession: Profession; shifts: Shift[] }> = {};
        filteredShifts.forEach(shift => {
            const key = String(shift.profession?.id || 'none');
            if (!grouped[key]) {
                grouped[key] = { profession: shift.profession, shifts: [] };
            }
            grouped[key].shifts.push(shift);
        });
        return Object.values(grouped);
    }, [filteredShifts]);

    return (
        <AdminLayout>
            <Head title="Manajemen Shift" />
            <div className="space-y-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-blue-100 rounded-lg">
                        <Clock className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Manajemen Shift</h1>
                        <p className="text-muted-foreground">Kelola jadwal shift kerja untuk setiap jabatan.</p>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Tambah Shift Baru</CardTitle>
                        <CardDescription>Buat jadwal shift baru dan kaitkan dengan satu atau lebih jabatan sekaligus.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Nama Shift</Label>
                                    <Input
                                        id="name"
                                        placeholder="Nama Shift (e.g., Pagi, Malam)"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        disabled={processing}
                                    />
                                    {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="start_time">Jam Mulai</Label>
                                    <Input
                                        id="start_time"
                                        type="time"
                                        value={data.start_time}
                                        onChange={(e) => setData('start_time', e.target.value)}
                                        disabled={processing}
                                    />
                                    {errors.start_time && <p className="text-sm text-red-500">{errors.start_time}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="end_time">Jam Selesai</Label>
                                    <Input
                                        id="end_time"
                                        type="time"
                                        value={data.end_time}
                                        onChange={(e) => setData('end_time', e.target.value)}
                                        disabled={processing}
                                    />
                                    {errors.end_time && <p className="text-sm text-red-500">{errors.end_time}</p>}
                                </div>
                            </div>

                            {/* Multi-select Jabatan */}
                            <div className="space-y-2">
                                <Label className="flex items-center gap-2">
                                    <Users className="h-4 w-4" />
                                    Pilih Jabatan
                                    {data.profession_ids.length > 0 && (
                                        <span className="ml-1 px-2 py-0.5 text-xs font-semibold bg-blue-100 text-blue-700 rounded-full">
                                            {data.profession_ids.length} dipilih
                                        </span>
                                    )}
                                </Label>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 p-3 border rounded-lg bg-slate-50">
                                    {professions.map(p => {
                                        const isSelected = data.profession_ids.includes(String(p.id));
                                        return (
                                            <button
                                                key={p.id}
                                                type="button"
                                                onClick={() => toggleProfession(String(p.id))}
                                                disabled={processing}
                                                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium border transition-all cursor-pointer
                                                    ${isSelected
                                                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                                                        : 'bg-white text-slate-700 border-slate-200 hover:bg-blue-50 hover:border-blue-300'
                                                    }`}
                                            >
                                                {isSelected
                                                    ? <CheckSquare className="h-4 w-4 shrink-0" />
                                                    : <Square className="h-4 w-4 shrink-0" />
                                                }
                                                <span className="truncate">{p.name}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                                {data.profession_ids.length === 0 && (
                                    <p className="text-xs text-muted-foreground">Klik jabatan untuk memilih. Bisa memilih lebih dari satu.</p>
                                )}
                            </div>

                            <Button type="submit" disabled={processing}>
                                {processing ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Memproses...</> : "Tambah Shift"}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>Daftar Shift</CardTitle>
                                <CardDescription className="mt-1">
                                    {filterProfession === 'all'
                                        ? `Total ${shifts.length} shift terdaftar.`
                                        : `Menampilkan ${filteredShifts.length} shift untuk jabatan yang dipilih.`
                                    }
                                </CardDescription>
                            </div>
                            {/* Filter per jabatan */}
                            <div className="w-52">
                                <Select value={filterProfession} onValueChange={setFilterProfession}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Filter Jabatan" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Semua Jabatan</SelectItem>
                                        {professions.map(p => (
                                            <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {shiftsByProfession.length > 0 ? (
                            shiftsByProfession.map(group => (
                                <div key={group.profession?.id || 'none'}>
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-semibold rounded">
                                            {group.profession?.name || 'Tanpa Jabatan'}
                                        </span>
                                        <span className="text-xs text-muted-foreground">{group.shifts.length} shift</span>
                                    </div>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Nama Shift</TableHead>
                                                <TableHead>Jam Mulai</TableHead>
                                                <TableHead>Jam Selesai</TableHead>
                                                <TableHead className="text-right">Aksi</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {group.shifts.map((shift) => (
                                                <TableRow key={shift.id}>
                                                    <TableCell className='font-medium'>{shift.name}</TableCell>
                                                    <TableCell>{shift.start_time}</TableCell>
                                                    <TableCell>{shift.end_time}</TableCell>
                                                    <TableCell className="text-right">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                                            onClick={() => handleDelete(shift.id)}
                                                            disabled={deletingId === shift.id}
                                                        >
                                                            {deletingId === shift.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-8 text-muted-foreground">
                                Tidak ada data shift.
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AdminLayout>
    );
}
