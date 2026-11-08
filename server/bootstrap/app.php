<?php

use App\Http\Middleware\ActiveUserMiddleware;
use App\Http\Middleware\RoleMiddleware;
use App\Models\ClassModel;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Support\Facades\Route;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__ . '/../routes/web.php',
        api: __DIR__ . '/../routes/api.php',
        commands: __DIR__ . '/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->alias([
            'role' => RoleMiddleware::class,
            'active' => ActiveUserMiddleware::class
        ]);
    })
    ->booted(function () {
        Route::bind('class', function ($value) {
            return ClassModel::where('id', $value)->firstOrFail();
        });
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })->create();
