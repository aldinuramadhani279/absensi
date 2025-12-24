# Aplikasi Absensi Karyawan

Aplikasi ini adalah sistem manajemen absensi dan cuti karyawan berbasis web yang dibangun menggunakan framework Laravel. Sistem ini memungkinkan karyawan untuk melakukan absensi (clock-in & clock-out), mengajukan cuti, dan melihat riwayat absensi mereka. Di sisi lain, administrator memiliki dasbor khusus untuk mengelola data master seperti profesi, shift kerja, data karyawan, serta menyetujui atau menolak pengajuan cuti dan membuat laporan absensi.

## Fitur Utama

### Untuk Karyawan
- **Otentikasi:** Login dan logout.
- **Dasbor Utama:** Melihat status absensi hari ini, melakukan clock-in/clock-out, dan mengajukan pulang lebih awal.
- **Deteksi Keterlambatan:** Sistem secara otomatis menandai status absensi (`tepat waktu`, `terlambat`, `datang lebih awal`).
- **Riwayat Absensi:** Melihat seluruh catatan riwayat absensi yang telah terdata.
- **Pengajuan Cuti:** Membuat dan mengirim permohonan cuti.
- **Validasi Unik:** Mencegah satu alamat IP digunakan untuk clock-in pada shift yang sama di hari yang sama.

### Untuk Administrator
- **Dasbor Admin:** Halaman utama untuk navigasi fitur-fitur administratif.
- **Manajemen Profesi:** Menambah data profesi/jabatan baru di perusahaan.
- **Manajemen Shift:** Menambah data shift kerja yang bisa dikaitkan dengan profesi tertentu.
- **Manajemen Karyawan:** Menambah, melihat, dan menghapus data karyawan.
- **Reset Password:** Mereset password untuk akun karyawan.
- **Manajemen Cuti:** Meninjau dan mengubah status pengajuan cuti karyawan (`disetujui` atau `ditolak`).
- **Laporan Absensi:** Mengekspor data absensi ke dalam format Excel (.xlsx) dengan opsi filter berdasarkan rentang tanggal dan profesi.

---

## Panduan Instalasi

1.  **Clone Repositori**
    ```bash
    git clone [URL_REPOSITORI_ANDA]
    cd [NAMA_FOLDER_PROYEK]
    ```

2.  **Install Dependensi**
    ```bash
    composer install
    npm install
    ```

3.  **Konfigurasi Environment**
    Salin file `.env.example` menjadi `.env` dan sesuaikan konfigurasinya, terutama koneksi database.
    ```bash
    copy .env.example .env
    ```
    Generate application key:
    ```bash
    php artisan key:generate
    ```

4.  **Migrasi Database**
    Jalankan migrasi untuk membuat tabel-tabel yang dibutuhkan.
    ```bash
    php artisan migrate
    ```

5.  **Jalankan Server**
    ```bash
    php artisan serve
    npm run dev
    ```

---

## Dokumentasi Endpoint

Berikut adalah daftar endpoint yang tersedia dalam aplikasi.

### Endpoint Publik (Guest)

| Method | URI                 | Deskripsi                               |
|--------|---------------------|-----------------------------------------|
| `GET`  | `/`                 | Menampilkan halaman selamat datang.     |
| `GET`  | `/login`            | Menampilkan halaman login.              |
| `POST` | `/login`            | Memproses permintaan login.             |
| `POST` | `/logout`           | Memproses permintaan logout.            |
| `GET`  | `/register`         | Menampilkan halaman registrasi.         |
| `POST` | `/register`         | Memproses permintaan registrasi.        |

### Endpoint Karyawan (Telah Terotentikasi)

Membutuhkan `auth` middleware.

| Method | URI                     | Controller & Method                  | Deskripsi                                                                 |
|--------|-------------------------|--------------------------------------|---------------------------------------------------------------------------|
| `GET`  | `/home`                 | `HomeController@index`               | Menampilkan dasbor utama karyawan.                                        |
| `GET`  | `/history`              | `HomeController@history`             | Menampilkan riwayat absensi karyawan.                                     |
| `POST` | `/clockin`              | `AttendanceController@clockIn`       | Merekam waktu masuk (clock-in). Membutuhkan `shift_id`.                   |
| `POST` | `/clockout`             | `AttendanceController@clockOut`      | Merekam waktu keluar (clock-out).                                         |
| `POST` | `/early-departure`      | `AttendanceController@earlyDeparture`| Merekam waktu keluar lebih awal. Membutuhkan `notes`.                     |
| `GET`  | `/leave-requests`       | `LeaveRequestController@index`       | Menampilkan halaman dan daftar pengajuan cuti.                            |
| `POST` | `/leave-requests`       | `LeaveRequestController@store`       | Menyimpan pengajuan cuti baru. Membutuhkan `start_date`, `end_date`, `reason`. |

### Endpoint API (Telah Terotentikasi - Sanctum)

| Method | URI         | Controller & Method   | Deskripsi                                      |
|--------|-------------|-----------------------|------------------------------------------------|
| `GET`  | `/api/user` | (Closure)             | Mengambil data pengguna yang terotentikasi.    |

### Endpoint Administrator

Membutuhkan `auth` dan `is.admin` middleware. Semua URI diawali dengan `/admin`.

| Method | URI                                       | Controller & Method                        | Deskripsi                                                                            |
|--------|-------------------------------------------|--------------------------------------------|--------------------------------------------------------------------------------------|
| `GET`  | `/`                                       | (Closure)                                  | Menampilkan dasbor admin.                                                            |
| `GET`  | `/professions`                            | `ProfessionController@index`               | Menampilkan daftar semua profesi.                                                    |
| `GET`  | `/professions/create`                     | `ProfessionController@create`              | Menampilkan form untuk membuat profesi baru.                                         |
| `POST` | `/professions`                            | `ProfessionController@store`               | Menyimpan profesi baru. Membutuhkan `name`.                                          |
| `GET`  | `/shifts`                                 | `ShiftController@index`                    | Menampilkan daftar semua shift kerja.                                                |
| `GET`  | `/shifts/create`                          | `ShiftController@create`                   | Menampilkan form untuk membuat shift baru.                                           |
| `POST` | `/shifts`                                 | `ShiftController@store`                    | Menyimpan shift baru. Membutuhkan `name`, `profession_id`, `start_time`, `end_time`. |
| `GET`  | `/employees`                              | `EmployeeController@index`                 | Menampilkan daftar semua karyawan.                                                   |
| `GET`  | `/employees/create`                       | `EmployeeController@create`                | Menampilkan form untuk membuat karyawan baru.                                        |
| `POST` | `/employees`                              | `EmployeeController@store`                 | Menyimpan data karyawan baru.                                                        |
| `DELETE`| `/employees/{employee}`                   | `EmployeeController@destroy`               | Menghapus data karyawan.                                                             |
| `POST` | `/employees/{employee}/reset-password`    | `EmployeeController@resetPassword`         | Mereset password seorang karyawan.                                                   |
| `GET`  | `/reports`                                | `ReportController@index`                   | Menampilkan halaman untuk membuat laporan absensi.                                   |
| `POST` | `/reports/export`                         | `ReportController@export`                  | Mengekspor data absensi ke Excel. Parameter opsional: `profession_id`, `start_date`, `end_date`. |
| `GET`  | `/leave-requests`                         | `Admin\LeaveRequestController@index`       | Menampilkan daftar semua pengajuan cuti dari karyawan.                               |
#   a b s e n s i  
 