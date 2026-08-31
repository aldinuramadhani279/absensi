import { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/ui/card';
import { Alert, AlertDescription } from '@/Components/ui/alert';
import { KeyRound, Eye, EyeOff, ShieldCheck, Loader2 } from 'lucide-react';

export default function ForceChangePassword({ user_name }: { user_name: string }) {
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const { data, setData, post, processing, errors } = useForm({
        password: '',
        password_confirmation: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/password/force-change');
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-100 to-blue-50 flex items-center justify-center p-4">
            <Head title="Ganti Password" />

            <div className="w-full max-w-md space-y-4">
                {/* Header */}
                <div className="text-center space-y-2">
                    <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-100 rounded-full mb-2">
                        <ShieldCheck className="h-7 w-7 text-blue-600" />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900">Password Baru Diperlukan</h1>
                    <p className="text-sm text-slate-500">
                        Halo, <span className="font-semibold text-slate-700">{user_name}</span>!
                    </p>
                </div>

                {/* Alert Info */}
                <Alert className="bg-amber-50 border-amber-200">
                    <KeyRound className="h-4 w-4 text-amber-600" />
                    <AlertDescription className="text-amber-800 text-sm">
                        Password Anda telah direset oleh administrator. Demi keamanan akun, Anda diwajibkan untuk mengganti password sebelum dapat mengakses sistem.
                    </AlertDescription>
                </Alert>

                {/* Form */}
                <Card className="shadow-md border-slate-200">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <KeyRound className="h-5 w-5 text-blue-600" />
                            Buat Password Baru
                        </CardTitle>
                        <CardDescription>Password minimal 8 karakter.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Password Baru */}
                            <div className="space-y-2">
                                <Label htmlFor="password">Password Baru</Label>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="Masukkan password baru"
                                        value={data.password}
                                        onChange={e => setData('password', e.target.value)}
                                        required
                                        className="pr-10"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                    >
                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                                {errors.password && (
                                    <p className="text-sm text-red-500">{errors.password}</p>
                                )}
                            </div>

                            {/* Konfirmasi Password */}
                            <div className="space-y-2">
                                <Label htmlFor="password_confirmation">Konfirmasi Password Baru</Label>
                                <div className="relative">
                                    <Input
                                        id="password_confirmation"
                                        type={showConfirm ? 'text' : 'password'}
                                        placeholder="Ulangi password baru"
                                        value={data.password_confirmation}
                                        onChange={e => setData('password_confirmation', e.target.value)}
                                        required
                                        className="pr-10"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirm(!showConfirm)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                    >
                                        {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                                {errors.password_confirmation && (
                                    <p className="text-sm text-red-500">{errors.password_confirmation}</p>
                                )}
                                {/* Client-side mismatch check */}
                                {data.password && data.password_confirmation && data.password !== data.password_confirmation && (
                                    <p className="text-sm text-red-500">Konfirmasi password tidak cocok.</p>
                                )}
                            </div>

                            <Button
                                type="submit"
                                className="w-full bg-blue-600 hover:bg-blue-700"
                                disabled={
                                    processing ||
                                    !data.password ||
                                    !data.password_confirmation ||
                                    data.password !== data.password_confirmation
                                }
                            >
                                {processing ? (
                                    <><Loader2 className="h-4 w-4 animate-spin mr-2" />Menyimpan...</>
                                ) : (
                                    <><ShieldCheck className="h-4 w-4 mr-2" />Simpan Password Baru</>
                                )}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                <p className="text-center text-xs text-slate-400">
                    Sistem Absensi • Password Anda terenkripsi aman
                </p>
            </div>
        </div>
    );
}
