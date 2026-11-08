<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RoleMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        // pastikan user sudah login
        if (!$request->user()) {
            return response()->json([
                'message' => 'Authenticasi diperlukan.'
            ], 401);
        }

        // cek apakah role user ada dalam daftar role yang diizinkan
        if (!in_array($request->user()->role, $roles)) {
            return response()->json([
                'message' => 'Anda tidak memiliki izin untuk mengakses resource ini.'
            ], 403);
        }

        return $next($request);
    }
}
