<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Laravel\Sanctum\PersonalAccessToken;

class AuthService
{
    public function login($email, $password)
    {
        $user = User::firstWhere('email', $email);

        // validasi kredensial
        if (!$user || !Hash::check($password, $user->password)) {
            throw new AuthenticationException('Email atau password salah.');
        }

        // cek status aktif
        if (!$user->is_active) {
            throw ValidationException::withMessages([
                'email' => ['Akun Anda telah dinonaktifkan. Hubungi administrator.']
            ]);
        }

        // create token
        $token = $user->createToken('school-payment-token', ['*'], now()->addDays(7))->plainTextToken;

        return [
            'user' => $user,
            'token' => $token
        ];
    }

    public function logout(User $user)
    {
        $token = $user->currentAccessToken();

        if ($token instanceof PersonalAccessToken) {
            $token->delete();
        }
    }
}
