import { useState } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/Components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/Components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/Components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/ui/select';
import { useToast } from "@/hooks/use-toast";
import { Loader2, UserPlus, Trash2, KeyRound } from 'lucide-react';
import { Label } from "@/Components/ui/label";

interface Profession {
    id: number;
    name: string;
}

interface User {
    id: number;
    name: string;
    email: string;
    status: 'pns' | 'non-pns';
    nip?: string;
    employee_id?: string;
    profession: { id: number; name: string };
}

export default function EmployeesIndex({ employees, professions }: { employees: User[], professions: Profession[] }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        email: '',
        password: '',
        status: '',
        profession_id: '',
        nip: '',
        employee_id: ''
    });

    const { toast } = useToast();
    const [showAddDialog, setShowAddDialog] = useState(false);
    const [showConfirmDelete, setShowConfirmDelete] = useState<User | null>(null);
    const [showConfirmReset, setShowConfirmReset] = useState<User | null>(null);
    const [isProcessingAction, setIsProcessingAction] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/admin/employees', {
            onSuccess: () => {
                reset();
                setShowAddDialog(false);
                toast({ title: "Berhasil", description: "Karyawan berhasil ditambahkan" });
            },
            onError: () => {
                toast({ variant: "destructive", title: "Gagal", description: "Gagal menambahkan karyawan. Periksa inputan Anda." });
            }
        });
    };

    const handleDelete = (user: User) => {
        setIsProcessingAction(true);
        router.delete(`/admin/employees/${user.id}`, {
            onSuccess: () => {
                setShowConfirmDelete(null);
                toast({ title: "Berhasil", description: "Data karyawan dihapus" });
                setIsProcessingAction(false);
            },
            onError: () => setIsProcessingAction(false)
        });
    };

    const handleResetPassword = (user: User) => {
        setIsProcessingAction(true);
        router.post(`/admin/employees/${user.id}/reset-password`, {}, {
            onSuccess: () => {
                setShowConfirmReset(null);
                toast({ title: "Berhasil", description: "Password berhasil direset" });
                setIsProcessingAction(false);
            },
            onError: () => setIsProcessingAction(false)
        });
    };

    return (
        <AdminLayout>
            <Head title="Manajemen Karyawan" />
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <UserPlus className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900">Manajemen Karyawan</h1>
                            <p className="text-muted-foreground">Kelola data karyawan, akun, dan akses.</p>
                        </div>
                    </div>
                    <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                        <DialogTrigger asChild>
                            <Button><UserPlus className="h-4 w-4 mr-2" />Tambah Karyawan</Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[600px]">
                            <DialogHeader>
                                <DialogTitle>Form Karyawan Baru</DialogTitle>
                                <DialogDescription>Tambahkan data karyawan baru ke dalam sistem.</DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleSubmit} className="space-y-4 py-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Nama Lengkap</Label>
                                        <Input id="name" placeholder="Nama Lengkap" value={data.name} onChange={e => setData('name', e.target.value)} required />
                                        {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="email">Email</Label>
                                        <Input id="email" placeholder="Email" type="email" value={data.email} onChange={e => setData('email', e.target.value)} required />
                                        {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="password">Password</Label>
                                    <Input id="password" placeholder="Password (min 8 karakter)" type="password" value={data.password} onChange={e => setData('password', e.target.value)} required minLength={8} />
                                    {errors.password && <p className="text-sm text-red-500">{errors.password}</p>}
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="status">Status Pegawai</Label>
                                        <Select onValueChange={(v) => setData('status', v)} value={data.status}>
                                            <SelectTrigger id="status"><SelectValue placeholder="Pilih Status" /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="pns">PNS</SelectItem>
                                                <SelectItem value="non-pns">Non-PNS</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        {errors.status && <p className="text-sm text-red-500">{errors.status}</p>}
                                    </div>

                                    {data.status === 'pns' && (
                                        <div className="space-y-2">
                                            <Label htmlFor="nip">NIP</Label>
                                            <Input id="nip" placeholder="Nomor Induk Pegawai" value={data.nip} onChange={e => setData('nip', e.target.value)} required />
                                            {errors.nip && <p className="text-sm text-red-500">{errors.nip}</p>}
                                        </div>
                                    )}
                                    {data.status === 'non-pns' && (
                                        <div className="space-y-2">
                                            <Label htmlFor="employee_id">ID Karyawan</Label>
                                            <Input id="employee_id" placeholder="ID Karyawan (Opsional)" value={data.employee_id} onChange={e => setData('employee_id', e.target.value)} />
                                            {errors.employee_id && <p className="text-sm text-red-500">{errors.employee_id}</p>}
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="profession">Jabatan</Label>
                                    <Select onValueChange={(v) => setData('profession_id', v)} value={data.profession_id}>
                                        <SelectTrigger id="profession"><SelectValue placeholder="Pilih Jabatan" /></SelectTrigger>
                                        <SelectContent>
                                            {professions.map(p => <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                    {errors.profession_id && <p className="text-sm text-red-500">{errors.profession_id}</p>}
                                </div>

                                <DialogFooter className="mt-6">
                                    <Button type="submit" disabled={processing}>
                                        {processing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                        Simpan Karyawan
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Daftar Karyawan</CardTitle>
                        <CardDescription>Total {employees.length} karyawan terdaftar di sistem.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nama</TableHead>
                                    <TableHead>Status / ID</TableHead>
                                    <TableHead>Jabatan</TableHead>
                                    <TableHead className="text-right">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {employees.length > 0 ? employees.map(emp => (
                                    <TableRow key={emp.id}>
                                        <TableCell>
                                            <div className='font-medium'>{emp.name}</div>
                                            <div className='text-sm text-muted-foreground'>{emp.email}</div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <span className={`px-2 py-0.5 rounded text-xs font-semibold ${emp.status === 'pns' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-700'}`}>
                                                    {emp.status.toUpperCase()}
                                                </span>
                                                <span className="text-sm text-muted-foreground">{emp.nip || emp.employee_id || '-'}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>{emp.profession?.name || '-'}</TableCell>
                                        <TableCell className='text-right space-x-2'>
                                            <Button variant="outline" size="sm" onClick={() => setShowConfirmReset(emp)} title="Reset Password">
                                                <KeyRound className="h-3.5 w-3.5" />
                                            </Button>
                                            <Button variant="destructive" size="sm" onClick={() => setShowConfirmDelete(emp)} title="Hapus Karyawan">
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Tidak ada data karyawan.</TableCell></TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {/* Delete Confirmation */}
                <Dialog open={!!showConfirmDelete} onOpenChange={(open) => !open && setShowConfirmDelete(null)}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Konfirmasi Hapus</DialogTitle>
                            <DialogDescription>
                                Apakah Anda yakin ingin menghapus karyawan <strong>{showConfirmDelete?.name}</strong>? Tindakan ini tidak dapat dibatalkan.
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setShowConfirmDelete(null)} disabled={isProcessingAction}>Batal</Button>
                            <Button variant="destructive" onClick={() => showConfirmDelete && handleDelete(showConfirmDelete)} disabled={isProcessingAction}>
                                {isProcessingAction && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Ya, Hapus
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Reset Confirmation */}
                <Dialog open={!!showConfirmReset} onOpenChange={(open) => !open && setShowConfirmReset(null)}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Konfirmasi Reset Password</DialogTitle>
                            <DialogDescription>
                                Apakah Anda yakin ingin mereset password untuk <strong>{showConfirmReset?.name}</strong>? <br />
                                Password akan diatur ulang menjadi <span className="font-mono bg-slate-100 px-1 rounded">12345678</span>.
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setShowConfirmReset(null)} disabled={isProcessingAction}>Batal</Button>
                            <Button onClick={() => showConfirmReset && handleResetPassword(showConfirmReset)} disabled={isProcessingAction}>
                                {isProcessingAction && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Ya, Reset
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </AdminLayout>
    );
}
