<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Profession;
use Illuminate\Foundation\Auth\RegistersUsers;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Http\Request;


class RegisterController extends Controller
{
    /*
    |--------------------------------------------------------------------------
    | Register Controller
    |--------------------------------------------------------------------------
    |
    | This controller handles the registration of new users as well as their
    | validation and creation. By default this controller uses a trait to
    | provide this functionality without requiring any additional code.
    |
    */

    use RegistersUsers;

    /**
     * Where to redirect users after registration.
     *
     * @var string
     */
    protected $redirectTo = '/home';

    /**
     * Create a new controller instance.
     *
     * @return void
     */
    public function __construct()
    {
        $this->middleware('guest');
    }

    /**
     * Show the application registration form.
     *
     * @return \Illuminate\View\View
     */
    public function showRegistrationForm()
    {
        $professions = Profession::all();
        return view('auth.register', compact('professions'));
    }

    /**
     * Get a validator for an incoming registration request.
     *
     * @param  array  $data
     * @return \Illuminate\Contracts\Validation\Validator
     */
    protected function validator(array $data)
    {
        return Validator::make($data, [
            'name' => ['required', 'string', 'max:255', 'unique:users'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
            'profession_id' => ['required', 'exists:professions,id'],
            'status' => ['required', 'in:pns,non-pns'],
            'nip' => ['nullable', 'required_if:status,pns', 'string'],
            'phone' => ['nullable', 'string'],
            'photo' => ['nullable', 'image', 'max:2048'], // 2MB Max
        ]);
    }

    /**
     * Create a new user instance after a valid registration.
     *
     * @param  array  $data
     * @return \App\Models\User
     */
    protected function create(array $data)
    {
        $photoPath = null;
        if (isset($data['photo'])) {
            $photoPath = $data['photo']->store('photos', 'public');
        }

        $employee_id = null;
        if ($data['status'] == 'non-pns') {
            $lastEmployee = User::where('status', 'non-pns')->orderBy('employee_id', 'desc')->first();
            $employee_id = $lastEmployee ? (int)$lastEmployee->employee_id + 1 : 1;
        }

        return User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => Hash::make($data['password']),
            'profession_id' => $data['profession_id'],
            'status' => $data['status'],
            'nip' => $data['nip'] ?? null,
            'employee_id' => (string)$employee_id,
            'phone' => $data['phone'] ?? null,
            'photo' => $photoPath,
        ]);
    }
}
