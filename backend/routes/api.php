<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\TransactionController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\GoalController;

// Auth (public)
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// ✅ Biar preflight OPTIONS nggak ditolak JWT
Route::options('{any}', function () {
    return response()->json([], 200);
})->where('any', '.*');

// Protected routes (pakai JWT)
Route::group(['middleware' => ['jwt.auth']], function () {
    // Auth
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::post('/refresh', [AuthController::class, 'refresh']);
    Route::get('/me', [AuthController::class, 'me']);

    // Categories
    Route::get('/categories', [CategoryController::class, 'index']);
    Route::post('/categories', [CategoryController::class, 'store']); 
    Route::put('/categories/{id}', [CategoryController::class, 'update']);
    Route::delete('/categories/{id}', [CategoryController::class, 'destroy']);


    // Goals
    Route::apiResource('goals', GoalController::class);

    // Transactions - khusus route dulu
    Route::get('/transactions/summary', [TransactionController::class, 'summary']);
    Route::get('/transactions/summary-current', [TransactionController::class, 'summaryCurrent']);
    Route::get('/transactions/insight', [TransactionController::class, 'insight']);

    // Transactions - apiResource untuk CRUD biasa
    Route::apiResource('transactions', TransactionController::class)
         ->where(['transaction' => '[0-9]+']);
});
