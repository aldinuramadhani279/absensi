import { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/Components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/Components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/Components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Trash2, Clock } from 'lucide-react';
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
    const { data, setData, post, processing, errors, reset, delete: destroy } = useForm({
        name: '',
        profession_id: '',
        start_time: '',
        end_time: '',
    });
    const { toast } = useToast();
    const [deletingId, setDeletingId] = useState<number | null>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/admin/shifts', {
            onSuccess: () => {
                reset();
                toast({ title: "Berhasil", description: "Shift berhasil ditambahkan" });
            },
            onError: () => {
                toast({ variant: "destructive", title: "Gagal", description: "Gagal menambahkan shift" });
            }
        });
    };

    const handleDelete = (id: number) => {
        if (confirm('Apakah Anda yakin ingin menghapus shift ini?')) {
            setDeletingId(id);
            destroy(`/admin/shifts/${id}`, {
                onFinish: () => setDeletingId(null),
                onSuccess: () => toast({ title: "Berhasil", description: "Shift berhasil dihapus" }),
            });
        }
    };

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
                        <CardDescription>Buat jadwal shift baru dan kaitkan dengan jabatan.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                    <Label htmlFor="profession">Jabatan</Label>
                                    <Select onValueChange={(value) => setData('profession_id', value)} value={data.profession_id}>
                                        <SelectTrigger id="profession">
                                            <SelectValue placeholder="Pilih Jabatan" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {professions.map(p => (
                                                <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.profession_id && <p className="text-sm text-red-500">{errors.profession_id}</p>}
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
                            <Button type="submit" disabled={processing}>
                                {processing ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Memproses...</> : "Tambah Shift"}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Daftar Shift</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nama Shift</TableHead>
                                    <TableHead>Jabatan</TableHead>
                                    <TableHead>Jam Mulai</TableHead>
                                    <TableHead>Jam Selesai</TableHead>
                                    <TableHead className="text-right">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {shifts.length > 0 ? (
                                    shifts.map((shift) => (
                                        <TableRow key={shift.id}>
                                            <TableCell className='font-medium'>{shift.name}</TableCell>
                                            <TableCell>{shift.profession?.name || '-'}</TableCell>
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
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                            Tidak ada data shift.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </AdminLayout>
    );
}
