import { useState } from "react";
import { Head, useForm, router, Link } from "@inertiajs/react";
import AdminLayout from "@/Layouts/AdminLayout";
import { Button } from "@/Components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/Components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/Components/ui/dialog";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
import { Textarea } from "@/Components/ui/textarea";
import { Badge } from "@/Components/ui/badge";
import { Plus, Edit2, Trash2, DoorOpen, Users, Search, ChevronLeft, ChevronRight, Layers } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Room {
    id: number;
    name: string;
    code?: string;
    description?: string;
    users_count?: number;
    created_at?: string;
}

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface PaginatedRooms {
    data: Room[];
    current_page: number;
    last_page: number;
    total: number;
    per_page: number;
    links: PaginationLink[];
}

export default function RoomsIndex({ rooms, filters }: { rooms: PaginatedRooms; filters: { search?: string } }) {
    const { toast } = useToast();
    const [search, setSearch] = useState(filters.search || "");
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [editingRoom, setEditingRoom] = useState<Room | null>(null);
    const [deletingRoom, setDeletingRoom] = useState<Room | null>(null);

    const { data, setData, post, put, processing, errors, reset } = useForm({
        name: "",
        code: "",
        description: "",
    });

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/admin/rooms', { search }, { preserveState: true });
    };

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        post('/admin/rooms', {
            onSuccess: () => {
                setIsAddOpen(false);
                reset();
                toast({ title: "Berhasil", description: "Ruangan baru berhasil ditambahkan." });
            },
        });
    };

    const handleEditOpen = (room: Room) => {
        setEditingRoom(room);
        setData({
            name: room.name || "",
            code: room.code || "",
            description: room.description || "",
        });
    };

    const handleUpdate = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingRoom) return;
        put(`/admin/rooms/${editingRoom.id}`, {
            onSuccess: () => {
                setEditingRoom(null);
                reset();
                toast({ title: "Berhasil", description: "Data ruangan berhasil diperbarui." });
            },
        });
    };

    const handleDelete = () => {
        if (!deletingRoom) return;
        router.delete(`/admin/rooms/${deletingRoom.id}`, {
            onSuccess: () => {
                setDeletingRoom(null);
                toast({ title: "Berhasil", description: "Ruangan berhasil dihapus." });
            },
        });
    };

    return (
        <AdminLayout>
            <Head title="Manajemen Ruangan" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <DoorOpen className="h-7 w-7 text-blue-600" />
                            <h1 className="text-2xl font-bold text-slate-900">Manajemen Ruangan</h1>
                        </div>
                        <p className="text-sm text-slate-500 mt-1">
                            Kelola data master ruangan / unit kerja untuk ploting karyawan.
                        </p>
                    </div>
                    <Button onClick={() => { reset(); setIsAddOpen(true); }} className="bg-blue-600 hover:bg-blue-700 font-medium">
                        <Plus className="h-4 w-4 mr-2" />
                        Tambah Ruangan
                    </Button>
                </div>

                {/* Filter Search */}
                <Card className="border-slate-200 shadow-sm">
                    <CardContent className="pt-6">
                        <form onSubmit={handleSearch} className="flex gap-2">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                                <Input
                                    placeholder="Cari nama atau kode ruangan..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-9"
                                />
                            </div>
                            <Button type="submit" variant="secondary">Cari</Button>
                        </form>
                    </CardContent>
                </Card>

                {/* [KEBUTUHAN USER] Grid 3 Kolom x 3 Baris (9 Kartu per Halaman) */}
                {rooms.data.length === 0 ? (
                    <Card className="p-12 text-center border-dashed border-2 border-slate-200">
                        <DoorOpen className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                        <h3 className="text-base font-semibold text-slate-700">Belum Ada Ruangan</h3>
                        <p className="text-sm text-slate-500 mt-1">Silakan tambah ruangan baru untuk memploting unit kerja karyawan.</p>
                        <Button onClick={() => { reset(); setIsAddOpen(true); }} variant="outline" className="mt-4">
                            <Plus className="h-4 w-4 mr-2" /> Tambah Ruangan Pertama
                        </Button>
                    </Card>
                ) : (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {rooms.data.map((room) => (
                                <Card key={room.id} className="border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
                                    <CardHeader className="pb-3">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="space-y-1">
                                                <CardTitle className="text-lg font-bold text-slate-900 leading-tight">{room.name}</CardTitle>
                                                {room.code && (
                                                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 font-mono text-xs">
                                                        {room.code}
                                                    </Badge>
                                                )}
                                            </div>
                                            <div className="p-2 bg-slate-100 rounded-lg shrink-0">
                                                <DoorOpen className="h-5 w-5 text-slate-600" />
                                            </div>
                                        </div>
                                        {room.description && (
                                            <CardDescription className="text-xs text-slate-600 line-clamp-2 mt-2">
                                                {room.description}
                                            </CardDescription>
                                        )}
                                    </CardHeader>

                                    <CardFooter className="pt-2 border-t border-slate-100 flex items-center justify-between bg-slate-50/50 rounded-b-lg">
                                        <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
                                            <Users className="h-3.5 w-3.5 text-slate-500" />
                                            <span>{room.users_count || 0} Karyawan</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Button variant="ghost" size="icon" onClick={() => handleEditOpen(room)} className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                                                <Edit2 className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => setDeletingRoom(room)} className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50">
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </CardFooter>
                                </Card>
                            ))}
                        </div>

                        {/* Paginasi 3x3 Grid (9 per Halaman) */}
                        {rooms.last_page > 1 && (
                            <div className="flex items-center justify-between border-t pt-4">
                                <p className="text-sm text-slate-600">
                                    Menampilkan Halaman <span className="font-bold">{rooms.current_page}</span> dari <span className="font-bold">{rooms.last_page}</span> ({rooms.total} Total Ruangan)
                                </p>
                                <div className="flex gap-1">
                                    {rooms.links.map((link, idx) => {
                                        if (!link.url) {
                                            return (
                                                <Button key={idx} variant="outline" size="sm" disabled dangerouslySetInnerHTML={{ __html: link.label }} />
                                            );
                                        }
                                        return (
                                            <Link key={idx} href={link.url}>
                                                <Button
                                                    variant={link.active ? "default" : "outline"}
                                                    size="sm"
                                                    className={link.active ? "bg-blue-600 text-white" : ""}
                                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                                />
                                            </Link>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Modal Tambah Ruangan */}
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                <DialogContent>
                    <form onSubmit={handleCreate}>
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <Plus className="h-5 w-5 text-blue-600" /> Tambah Ruangan Baru
                            </DialogTitle>
                            <DialogDescription>Masukkan nama dan kode ruangan kerja / unit kerja.</DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Nama Ruangan <span className="text-red-500">*</span></Label>
                                <Input
                                    id="name"
                                    placeholder="Contoh: Poliklinik Dahlan, IGD, Rawat Inap A"
                                    value={data.name}
                                    onChange={(e) => setData("name", e.target.value)}
                                    required
                                />
                                {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="code">Kode Ruangan (Opsional)</Label>
                                <Input
                                    id="code"
                                    placeholder="Contoh: R-IGD, R-POLI-01"
                                    value={data.code}
                                    onChange={(e) => setData("code", e.target.value)}
                                />
                                {errors.code && <p className="text-xs text-red-500">{errors.code}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Deskripsi (Opsional)</Label>
                                <Textarea
                                    id="description"
                                    placeholder="Keterangan lokasi atau peruntukan ruangan..."
                                    value={data.description}
                                    onChange={(e) => setData("description", e.target.value)}
                                    rows={3}
                                />
                            </div>
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>Batal</Button>
                            <Button type="submit" disabled={processing} className="bg-blue-600 hover:bg-blue-700">Simpan</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Modal Edit Ruangan */}
            <Dialog open={!!editingRoom} onOpenChange={(open) => !open && setEditingRoom(null)}>
                <DialogContent>
                    <form onSubmit={handleUpdate}>
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <Edit2 className="h-5 w-5 text-blue-600" /> Edit Ruangan
                            </DialogTitle>
                            <DialogDescription>Perbarui data ruangan kerja.</DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="edit_name">Nama Ruangan <span className="text-red-500">*</span></Label>
                                <Input
                                    id="edit_name"
                                    value={data.name}
                                    onChange={(e) => setData("name", e.target.value)}
                                    required
                                />
                                {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="edit_code">Kode Ruangan</Label>
                                <Input
                                    id="edit_code"
                                    value={data.code}
                                    onChange={(e) => setData("code", e.target.value)}
                                />
                                {errors.code && <p className="text-xs text-red-500">{errors.code}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="edit_description">Deskripsi</Label>
                                <Textarea
                                    id="edit_description"
                                    value={data.description}
                                    onChange={(e) => setData("description", e.target.value)}
                                    rows={3}
                                />
                            </div>
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setEditingRoom(null)}>Batal</Button>
                            <Button type="submit" disabled={processing} className="bg-blue-600 hover:bg-blue-700">Simpan Perubahan</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Dialog Konfirmasi Hapus */}
            <Dialog open={!!deletingRoom} onOpenChange={(open) => !open && setDeletingRoom(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="text-red-600 flex items-center gap-2">
                            <Trash2 className="h-5 w-5" /> Hapus Ruangan
                        </DialogTitle>
                        <DialogDescription>
                            Apakah Anda yakin ingin menghapus ruangan <strong>{deletingRoom?.name}</strong>?
                            Karyawan yang ter-ploting di ruangan ini akan dikosongkan ploting ruangannya.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeletingRoom(null)}>Batal</Button>
                        <Button variant="destructive" onClick={handleDelete}>Hapus</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AdminLayout>
    );
}
