import { useState } from "react"
import { Head, router } from "@inertiajs/react" // Use Inertia router
import { Button } from "@/Components/ui/button"
import { Input } from "@/Components/ui/input"
import { Label } from "@/Components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/Components/ui/card"
import { Alert, AlertDescription } from "@/Components/ui/alert"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import type React from "react"

export default function LoginPage() {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [errorLocal, setErrorLocal] = useState("")

    const validateEmail = (email: string) => {
        return /[^@ \t\r\n]+@[^@ \t\r\n]+\.[^@ \t\r\n]+/.test(email)
    }

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setErrorLocal("")

        if (!validateEmail(email)) {
            setErrorLocal("Format email tidak valid")
            return
        }

        if (password.length < 8) {
            setErrorLocal("Password minimal 8 karakter")
            return
        }

        setIsLoading(true)

        // Using Inertia's router to prevent full page reload and handle redirection server-side
        router.post('/login', { email, password }, {
            onError: (errors: any) => {
                setErrorLocal(errors.email || errors.password || "Login gagal. Periksa kembali kredensial Anda.");
                setIsLoading(false);
            },
            onFinish: () => setIsLoading(false)
        });
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-50 p-4">
            <Head title="Login" />
            <Card className="w-full max-w-md shadow-xl border-0">
                <CardHeader className="space-y-1 pb-6">
                    <CardTitle className="text-2xl font-bold text-center">Selamat Datang</CardTitle>
                    <CardDescription className="text-center text-base">Masuk ke Sistem Absensi Karyawan</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleLogin} className="space-y-4">
                        {errorLocal && (
                            <Alert variant="destructive" className="bg-red-50 border-red-200">
                                <AlertDescription className="text-red-800">{errorLocal}</AlertDescription>
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
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
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
                                    placeholder="Masukkan kata sandi"
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

                        <Button
                            type="submit"
                            className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-medium"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Memproses...
                                </>
                            ) : (
                                "Masuk"
                            )}
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="flex justify-center">
                    <a href="/forgot-password" className="text-sm text-blue-600 hover:text-blue-700 hover:underline">
                        Lupa Kata Sandi Anda?
                    </a>
                </CardFooter>
            </Card>
        </div>
    )
}
