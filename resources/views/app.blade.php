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


    </body>
</html>
