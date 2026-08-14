<?php

namespace App\Http\Controllers;

use App\Models\Room;
use Illuminate\Http\Request;
use Inertia\Inertia;

class RoomController extends Controller
{
    /**
     * Display a listing of rooms in a 3x3 grid format (9 per page).
     */
    public function index(Request $request)
    {
        $query = Room::withCount('users')->with(['users.profession'])->orderBy('name', 'asc');

        if ($request->search) {
            $query->where(function ($q) use ($request) {
                $q->where('name', 'like', '%' . $request->search . '%')
                  ->orWhere('code', 'like', '%' . $request->search . '%');
            });
        }

        // [Kebutuhan User] Grid 3x3 (9 ruangan per halaman)
        $rooms = $query->paginate(9)->withQueryString();

        return Inertia::render('Admin/Rooms/Index', [
            'rooms'   => $rooms,
            'filters' => [
                'search' => $request->search ?? '',
            ],
        ]);
    }

    /**
     * Store a newly created room.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'        => 'required|string|max:255',
            'code'        => 'nullable|string|max:50|unique:rooms,code',
            'description' => 'nullable|string',
        ]);

        Room::create($validated);

        return redirect()->back()->with('message', 'Ruangan berhasil ditambahkan.');
    }

    /**
     * Update the specified room.
     */
    public function update(Request $request, Room $room)
    {
        $validated = $request->validate([
            'name'        => 'required|string|max:255',
            'code'        => 'nullable|string|max:50|unique:rooms,code,' . $room->id,
            'description' => 'nullable|string',
        ]);

        $room->update($validated);

        return redirect()->back()->with('message', 'Ruangan berhasil diperbarui.');
    }

    /**
     * Remove the specified room.
     */
    public function destroy(Room $room)
    {
        // Unplot users before deleting room
        $room->users()->update(['room_id' => null]);
        $room->delete();

        return redirect()->back()->with('message', 'Ruangan berhasil dihapus.');
    }
}
