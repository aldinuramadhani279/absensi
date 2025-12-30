import { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/Components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/Components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Loader2, Briefcase } from 'lucide-react';
import { Alert, AlertDescription } from "@/Components/ui/alert";

interface Profession {
    id: number;
    name: string;
    created_at: string;
}

export default function ProfessionsIndex({ professions }: { professions: Profession[] }) {
    const { data, setData, post, processing, errors, reset, delete: destroy } = useForm({
        name: '',
    });
    const { toast } = useToast();
    const [deletingId, setDeletingId] = useState<number | null>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/admin/professions', {
            onSuccess: () => {
                reset();
                toast({ title: "Berhasil", description: "Jabatan berhasil ditambahkan" });
            },
            onError: () => {
                toast({ variant: "destructive", title: "Gagal", description: "Gagal menambahkan jabatan" });
            }
        });
    };

    const handleDelete = (id: number) => {
        if (confirm('Apakah Anda yakin ingin menghapus jabatan ini?')) {
            setDeletingId(id);
            destroy(`/admin/professions/${id}`, {
                onFinish: () => setDeletingId(null),
                onSuccess: () => toast({ title: "Berhasil", description: "Jabatan berhasil dihapus" }),
            });
        }
    };

    return (
        <AdminLayout>
            <Head title="Manajemen Jabatan" />
            <div className="space-y-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-blue-100 rounded-lg">
                        <Briefcase className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Manajemen Jabatan</h1>
                        <p className="text-muted-foreground">Kelola daftar jabatan/profesi di perusahaan.</p>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Tambah Jabatan Baru</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="flex items-start gap-4">
                            <div className="flex-grow space-y-2">
                                <Input
                                    type="text"
                                    placeholder="Nama Jabatan (contoh: Staff IT, HRD)"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    disabled={processing}
                                />
                                {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
                            </div>
                            <Button type="submit" disabled={processing} className="min-w-[100px]">
                                {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Tambah"}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Daftar Jabatan</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[100px]">ID</TableHead>
                                    <TableHead>Nama Jabatan</TableHead>
                                    <TableHead>Tanggal Dibuat</TableHead>
                                    <TableHead className="text-right">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {professions.length > 0 ? (
                                    professions.map((profession) => (
                                        <TableRow key={profession.id}>
                                            <TableCell className="font-medium">{profession.id}</TableCell>
                                            <TableCell>{profession.name}</TableCell>
                                            <TableCell>{new Date(profession.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                                    onClick={() => handleDelete(profession.id)}
                                                    disabled={deletingId === profession.id}
                                                >
                                                    {deletingId === profession.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                                            Belum ada data jabatan. Silakan tambahkan jabatan baru.
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
