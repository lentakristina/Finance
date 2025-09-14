<?php

use App\Http\Controllers\TransactionController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\GoalController;
 

Route::get('/goals', [GoalController::class, 'index']);
Route::get('/transactions/summary', [TransactionController::class, 'summary']);
Route::get('/categories', [CategoryController::class, 'index']);
Route::get('/transactions', [TransactionController::class, 'index']);
Route::post('/transactions', [TransactionController::class, 'store']);
Route::put('/transactions/{id}', [TransactionController::class, 'update']);
Route::delete('/transactions/{id}', [TransactionController::class, 'destroy']);
// web.php atau api.php
Route::get('/transactions/summary-current', [TransactionController::class, 'summaryCurrent']);
Route::get('/transactions/insight', [TransactionController::class, 'insight']);
// routes/api.php
Route::apiResource('goals', GoalController::class);
Route::apiResource('transactions', TransactionController::class);

