import { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/Components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/Components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Loader2, UserCheck } from 'lucide-react';

interface EmploymentStatus {
    id: number;
    name: string;
    code: string;
    created_at: string;
}

export default function EmploymentStatusesIndex({ statuses }: { statuses: EmploymentStatus[] }) {
    const { data, setData, post, processing, errors, reset, delete: destroy } = useForm({
        name: '',
    });
    const { toast } = useToast();
    const [deletingId, setDeletingId] = useState<number | null>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/admin/employment-statuses', {
            onSuccess: () => {
                reset();
                toast({ title: "Berhasil", description: "Status Kepegawaian berhasil ditambahkan" });
            },
            onError: () => {
                toast({ variant: "destructive", title: "Gagal", description: "Gagal menambahkan Status Kepegawaian" });
            }
        });
    };

    const handleDelete = (id: number) => {
        if (confirm('Apakah Anda yakin ingin menghapus status kepegawaian ini?')) {
            setDeletingId(id);
            destroy(`/admin/employment-statuses/${id}`, {
                onFinish: () => setDeletingId(null),
                onSuccess: () => toast({ title: "Berhasil", description: "Status Kepegawaian berhasil dihapus" }),
            });
        }
    };

    return (
        <AdminLayout>
            <Head title="Manajemen Status Kepegawaian" />
            <div className="space-y-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-indigo-100 rounded-lg">
                        <UserCheck className="h-6 w-6 text-indigo-600" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Manajemen Status Kepegawaian</h1>
                        <p className="text-muted-foreground">Kelola daftar status kepegawaian (PNS, Non-PNS, PPPK, dll).</p>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Tambah Status Kepegawaian Baru</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="flex items-start gap-4">
                            <div className="flex-grow space-y-2">
                                <Input
                                    type="text"
                                    placeholder="Nama Status (contoh: Honorer, Magang, Contract)"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    disabled={processing}
                                />
                                {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
                            </div>
                            <Button type="submit" disabled={processing} className="min-w-[100px] bg-indigo-600 hover:bg-indigo-700">
                                {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Tambah"}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Daftar Status Kepegawaian</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[100px]">ID</TableHead>
                                    <TableHead>Nama Status</TableHead>
                                    <TableHead>Kode / Slug</TableHead>
                                    <TableHead>Tanggal Dibuat</TableHead>
                                    <TableHead className="text-right">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {statuses.length > 0 ? (
                                    statuses.map((status) => (
                                        <TableRow key={status.id}>
                                            <TableCell className="font-medium">{status.id}</TableCell>
                                            <TableCell className="font-semibold text-slate-800">{status.name}</TableCell>
                                            <TableCell><code className="bg-slate-100 px-2 py-0.5 rounded text-xs text-slate-600">{status.code || '-'}</code></TableCell>
                                            <TableCell>{new Date(status.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                                    onClick={() => handleDelete(status.id)}
                                                    disabled={deletingId === status.id}
                                                >
                                                    {deletingId === status.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                            Belum ada data status kepegawaian. Silakan tambahkan status baru.
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
