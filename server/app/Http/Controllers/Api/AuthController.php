<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Services\AuthService;
use Illuminate\Http\Request;

class AuthController extends Controller
{
    public function  __construct(protected AuthService $authService) {}

    public function login(Request $request)
    {
        $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required']
        ]);

        $result = $this->authService->login(
            email: $request->input('email'),
            password: $request->input('password')
        );

        return response()->json([
            'message' => 'Login berhasil.',
            'data' => [
                'user' => new UserResource($result['user']),
                'token' => $result['token']
            ]
        ]);
    }

    public function logout(Request $request)
    {
        $user = $request->user();

        $this->authService->logout($user);

        return response()->json([
            'message' => 'Logout berhasil.',
        ]);
    }

    public function me(Request $request)
    {
        $user = $request->user();

        return response()->json([
            'data' => new UserResource($user)
        ]);
    }
}
