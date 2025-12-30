import type React from "react"
import { useState } from "react"
import { Head, Link, useForm } from "@inertiajs/react"
import { Button } from "@/Components/ui/button"
import { Input } from "@/Components/ui/input"
import { Label } from "@/Components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/Components/ui/card"
import { Alert, AlertDescription } from "@/Components/ui/alert"
import { ArrowLeft, CheckCircle2, Loader2 } from "lucide-react"

export default function ForgotPasswordPage() {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
    });

    const [success, setSuccess] = useState(false)

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        post('/password/email', { // Adjust route as needed
            onSuccess: () => setSuccess(true),
        });
    }

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-50 p-4">
                <Head title="Permintaan Terkirim" />
                <Card className="w-full max-w-md shadow-xl border-0">
                    <CardContent className="pt-12 pb-8 text-center">
                        <div className="mb-6 flex justify-center">
                            <div className="rounded-full bg-green-100 p-3">
                                <CheckCircle2 className="h-12 w-12 text-green-600" />
                            </div>
                        </div>
                        <h2 className="text-2xl font-bold mb-3">Permintaan Terkirim!</h2>
                        <p className="text-muted-foreground mb-8 leading-relaxed">
                            Permintaan reset password Anda telah dikirim ke admin. Anda akan menerima notifikasi setelah admin
                            menyetujui permintaan Anda.
                        </p>
                        <Link href="/login">
                            <Button className="w-full h-11 bg-blue-600 hover:bg-blue-700">
                                Kembali ke Login
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-50 p-4">
            <Head title="Lupa Kata Sandi" />
            <Card className="w-full max-w-md shadow-xl border-0">
                <CardHeader className="space-y-1 pb-6">
                    <Link
                        href="/login"
                        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Kembali ke Login
                    </Link>
                    <CardTitle className="text-2xl font-bold">Lupa Kata Sandi</CardTitle>
                    <CardDescription className="text-base leading-relaxed">
                        Masukkan email Anda untuk mengajukan reset password. Admin akan meninjau permintaan Anda.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {errors.email && (
                            <Alert variant="destructive" className="bg-red-50 border-red-200">
                                <AlertDescription className="text-red-800">{errors.email}</AlertDescription>
                            </Alert>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-sm font-medium">
                                Email
                            </Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="nama@perusahaan.com"
                                value={data.email}
                                onChange={(e) => setData('email', e.target.value)}
                                disabled={processing}
                                className="h-11"
                                required
                            />
                        </div>

                        <Button
                            type="submit"
                            className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-medium"
                            disabled={processing}
                        >
                            {processing ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Mengirim Permintaan...
                                </>
                            ) : (
                                "Kirim Permintaan Reset"
                            )}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
