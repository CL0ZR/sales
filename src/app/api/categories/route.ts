import { NextResponse } from 'next/server';
import { getAllCategories, addCategory, updateCategory, deleteCategory } from '@/lib/queries/categories';

/**
 * GET /api/categories
 * Get all categories with their subcategories
 */
export async function GET() {
  try {
    const categories = getAllCategories();
    return NextResponse.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/categories
 * Add a new category
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const newCategory = addCategory(body);
    return NextResponse.json(newCategory, { status: 201 });
  } catch (error) {
    console.error('Error adding category:', error);
    return NextResponse.json(
      { error: 'Failed to add category', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/categories
 * Update an existing category
 */
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const updatedCategory = updateCategory(body);
    return NextResponse.json(updatedCategory);
  } catch (error) {
    console.error('Error updating category:', error);
    return NextResponse.json(
      { error: 'Failed to update category', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/categories
 * Delete a category by ID
 */
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Category ID is required' },
        { status: 400 }
      );
    }

    const success = deleteCategory(id);
    
    if (success) {
      return NextResponse.json({ success: true, message: 'Category deleted successfully' });
    } else {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error('Error deleting category:', error);
    return NextResponse.json(
      { error: 'Failed to delete category', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
