<?php

namespace App\Http\Controllers;

use App\Models\Category;
use Illuminate\Http\Request;

class CategoryController extends Controller
{
    // Ambil semua kategori (shared)
    public function index()
    {
        return Category::all();
    }

    // Tambah kategori baru
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string',
            'type' => 'required|in:income,expense,saving',
        ]);

        return Category::create($request->all());
    }

    // Update kategori
    public function update(Request $request, $category)
{
    $cat = Category::findOrFail($category);
    $cat->update($request->all());
    return response()->json($cat);
}
    // Hapus kategori
    public function destroy($id)
    {
        return Category::destroy($id);
    }
}
