<?php

namespace App\Http\Controllers;

use App\Models\Goal;
use Illuminate\Http\Request;

class GoalController extends Controller
{
    public function index()
    {
        // Ambil goals + relasi kategori
        return Goal::with('category')->get();
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string',
            'target_amount' => 'required|numeric',
            'category_id' => 'required|exists:categories,id',
        ]);

        return Goal::create([
            'name' => $request->name,
            'target_amount' => $request->target_amount,
            'category_id' => $request->category_id,
            'current_amount' => 0,
        ]);
    }

    public function update(Request $request, $id)
    {
        $goal = Goal::findOrFail($id);
        $goal->update($request->all());
        return $goal;
    }

    public function destroy($id)
    {
        $deleted = Goal::destroy($id);

        if ($deleted) {
            return response()->json(['message' => 'Goal deleted successfully']);
        } else {
            return response()->json(['message' => 'Goal not found'], 404);
        }
    }

    // ✅ Update progress otomatis dari transaksi saving
    public function updateProgress($categoryId, $amount)
    {
        $goal = Goal::where('category_id', $categoryId)->first();
        if ($goal) {
            $goal->increment('current_amount', $amount);
        }
    }
}
