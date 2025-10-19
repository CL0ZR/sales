import { NextRequest, NextResponse } from 'next/server';
import { getAllCategories, addCategory, updateCategory, deleteCategory } from '@/lib/queries/categories';
import { Category } from '@/types';

export async function GET() {
  try {
    const categories = getAllCategories();
    return NextResponse.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const categoryData = await request.json();
    const newCategory = addCategory(categoryData);
    return NextResponse.json(newCategory, { status: 201 });
  } catch (error) {
    console.error('Error adding category:', error);
    return NextResponse.json({ error: 'Failed to add category' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const category: Category = await request.json();
    const updatedCategory = updateCategory(category);
    return NextResponse.json(updatedCategory);
  } catch (error) {
    console.error('Error updating category:', error);
    return NextResponse.json({ error: 'Failed to update category' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Category ID is required' }, { status: 400 });
    }
    
    const deleted = deleteCategory(id);
    if (deleted) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }
  } catch (error) {
    console.error('Error deleting category:', error);
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 });
  }
}
