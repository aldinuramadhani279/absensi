import { useState } from "react"
import { Head, router } from "@inertiajs/react"
import { Button } from "@/Components/ui/button"
import { Input } from "@/Components/ui/input"
import { Label } from "@/Components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/Components/ui/card"
import { Alert, AlertDescription } from "@/Components/ui/alert"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import type React from "react"

export default function RegisterPage() {
    const [name, setName] = useState("")
    const [username, setUsername] = useState("")
    const [password, setPassword] = useState("")
    const [passwordConfirmation, setPasswordConfirmation] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [errorLocal, setErrorLocal] = useState("")

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault()
        setErrorLocal("")

        if (password.length < 8) {
            setErrorLocal("Password minimal 8 karakter")
            return
        }

        if (password !== passwordConfirmation) {
            setErrorLocal("Konfirmasi password tidak cocok")
            return
        }

        setIsLoading(true)

        router.post('/register', {
            name,
            username,
            password,
            password_confirmation: passwordConfirmation
        }, {
            onError: (errors: any) => {
                setErrorLocal(Object.values(errors)[0] as string || "Registrasi gagal.");
                setIsLoading(false);
            },
            onFinish: () => setIsLoading(false)
        });
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-50 p-4">
            <Head title="Daftar Akun" />
            <Card className="w-full max-w-md shadow-xl border-0">
                <CardHeader className="space-y-1 pb-6">
                    <CardTitle className="text-2xl font-bold text-center">Buat Akun Baru</CardTitle>
                    <CardDescription className="text-center text-base">Silakan isi data diri Anda</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleRegister} className="space-y-4">
                        {errorLocal && (
                            <Alert variant="destructive" className="bg-red-50 border-red-200">
                                <AlertDescription className="text-red-800">{errorLocal}</AlertDescription>
                            </Alert>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="name" className="text-sm font-medium">
                                Nama Lengkap
                            </Label>
                            <Input
                                id="name"
                                type="text"
                                placeholder="Nama Lengkap"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                disabled={isLoading}
                                className="h-11"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="username" className="text-sm font-medium">
                                Username
                            </Label>
                            <Input
                                id="username"
                                type="text"
                                placeholder="Username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                disabled={isLoading}
                                className="h-11"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-sm font-medium">
                                Kata Sandi
                            </Label>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="minimal 8 karakter"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    disabled={isLoading}
                                    className="h-11 pr-10"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                    tabIndex={-1}
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password_confirmation" className="text-sm font-medium">
                                Konfirmasi Kata Sandi
                            </Label>
                            <Input
                                id="password_confirmation"
                                type="password"
                                placeholder="Ulangi kata sandi"
                                value={passwordConfirmation}
                                onChange={(e) => setPasswordConfirmation(e.target.value)}
                                disabled={isLoading}
                                className="h-11"
                                required
                            />
                        </div>

                        <Button
                            type="submit"
                            className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-medium"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Mendaftar...
                                </>
                            ) : (
                                "Daftar"
                            )}
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="flex justify-center">
                    <div className="text-sm text-gray-600">
                        Sudah punya akun? <a href="/login" className="text-blue-600 hover:text-blue-700 hover:underline font-medium">Masuk disini</a>
                    </div>
                </CardFooter>
            </Card>
        </div>
    )
}
