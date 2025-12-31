import { useState } from "react"
import { Head, router } from "@inertiajs/react"
import { Button } from "@/Components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/Components/ui/card"
import { Input } from "@/Components/ui/input"
import { Label } from "@/Components/ui/label"
import { Textarea } from "@/Components/ui/textarea"
import { Badge } from "@/Components/ui/badge"
import { ArrowLeft, Plus, Loader2, Calendar as CalendarIcon, FileText } from "lucide-react"

interface TravelRequest {
    id: number
    start_date: string
    end_date: string
    reason: string
    status: string
    created_at: string
}

interface TravelRequestsProps {
    requests: TravelRequest[]
}

export default function TravelRequestsIndex({ requests }: TravelRequestsProps) {
    const [isCreating, setIsCreating] = useState(false)
    const [startDate, setStartDate] = useState("")
    const [endDate, setEndDate] = useState("")
    const [reason, setReason] = useState("")
    const [attachment, setAttachment] = useState<File | null>(null)
    const [isLoading, setIsLoading] = useState(false)

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!attachment) {
            alert("Mohon lampirkan Surat Tugas");
            return;
        }

        setIsLoading(true)

        const formData = new FormData();
        formData.append('start_date', startDate);
        formData.append('end_date', endDate);
        formData.append('reason', reason);
        formData.append('attachment', attachment);

        router.post('/travel-requests', formData, {
            onSuccess: () => {
                setIsCreating(false)
                setIsLoading(false)
                setStartDate("")
                setEndDate("")
                setReason("")
                setAttachment(null)
            },
            onError: () => setIsLoading(false),
            forceFormData: true,
        })
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'approved': return <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Disetujui</Badge>
            case 'rejected': return <Badge className="bg-red-100 text-red-800 hover:bg-red-200">Ditolak</Badge>
            default: return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">Menunggu</Badge>
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-8">
            <Head title="Dinas Luar Kota" />

            <div className="max-w-4xl mx-auto space-y-6">
                <div className="flex items-center gap-4">
                    <a href="/home">
                        <Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button>
                    </a>
                    <h1 className="text-2xl font-bold text-gray-900">Perjalanan Dinas</h1>
                </div>

                {!isCreating ? (
                    <div className="space-y-6">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle>Riwayat Pengajuan</CardTitle>
                                    <CardDescription>Daftar pengajuan dinas luar kota Anda</CardDescription>
                                </div>
                                <Button onClick={() => setIsCreating(true)}><Plus className="mr-2 h-4 w-4" /> Buat Pengajuan</Button>
                            </CardHeader>
                            <CardContent>
                                {requests.length === 0 ? (
                                    <p className="text-center text-muted-foreground py-8">Belum ada pengajuan dinas.</p>
                                ) : (
                                    <div className="space-y-4">
                                        {requests.map((req) => (
                                            <div key={req.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg bg-white shadow-sm gap-4">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2 text-sm text-gray-500">
                                                        <CalendarIcon className="h-4 w-4" />
                                                        <span>{req.start_date} s/d {req.end_date}</span>
                                                    </div>
                                                    <p className="font-medium text-gray-900">{req.reason}</p>
                                                    <p className="text-xs text-gray-400">Diajukan pada {new Date(req.created_at).toLocaleDateString("id-ID")}</p>
                                                </div>
                                                <div>
                                                    {getStatusBadge(req.status)}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                ) : (
                    <Card>
                        <CardHeader>
                            <CardTitle>Form Pengajuan Dinas</CardTitle>
                            <CardDescription>Isi detail perjalanan dinas Anda</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="start_date">Tanggal Mulai</Label>
                                        <Input id="start_date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="end_date">Tanggal Selesai</Label>
                                        <Input id="end_date" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="reason">Tujuan & Alasan</Label>
                                    <Textarea id="reason" placeholder="Contoh: Kunjungan ke Client X di Surabaya" value={reason} onChange={(e) => setReason(e.target.value)} required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="attachment">Lampiran Surat Tugas (PDF/Gambar)</Label>
                                    <Input id="attachment" type="file" onChange={(e) => setAttachment(e.target.files ? e.target.files[0] : null)} required accept=".pdf,.jpg,.jpeg,.png" />
                                </div>
                                <div className="flex justify-end gap-2 pt-4">
                                    <Button type="button" variant="outline" onClick={() => setIsCreating(false)} disabled={isLoading}>Batal</Button>
                                    <Button type="submit" disabled={isLoading}>
                                        {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Mengirim...</> : "Kirim Pengajuan"}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    )
}
