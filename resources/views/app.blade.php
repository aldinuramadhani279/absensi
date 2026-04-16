<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" class="h-full bg-gray-100">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">

        <title inertia>{{ config('app.name', 'Laravel') }}</title>

        <!-- Fonts -->
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">

        <!-- Scripts -->
        @vite(['resources/js/app.tsx'])
        @inertiaHead
        <style>
            body::before {
                content: '';
                position: fixed;
                top: 0; 
                left: 0; 
                width: 100vw; 
                height: 100vh;
                background-image: url('/images/foto-rs.jpeg');
                background-size: cover;
                background-position: center;
                background-repeat: no-repeat;
                opacity: 0.15;
                z-index: -9999;
                pointer-events: none;
            }
        </style>
    </head>
    <body class="font-sans antialiased h-full relative bg-gray-50/50">
        @inertia

        <!-- Global Floating WhatsApp Widget -->
        <a href="https://wa.me/6286742088733" target="_blank" class="fixed bottom-6 right-6 z-50 bg-green-500 text-white rounded-2xl shadow-2xl hover:bg-green-600 hover:scale-105 transition-all flex items-center gap-3 p-3 group border border-white/20">
            <div class="hidden sm:block overflow-hidden max-w-0 group-hover:max-w-[200px] transition-all duration-300 whitespace-nowrap">
                <p class="text-xs font-semibold pl-2">Jika Anda kesulitan absen, <br/>hubungi kami Tim IT "ALDI"</p>
            </div>
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-message-circle"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg>
            <div class="absolute -top-2 -right-2 bg-red-500 rounded-full w-4 h-4 animate-ping"></div>
            <div class="absolute -top-2 -right-2 bg-red-500 rounded-full w-4 h-4 border-2 border-white"></div>
        </a>
    </body>
</html>
