import { NextRequest, NextResponse } from 'next/server';
import { getAllUsers, getUserById, createUser, updateUser, deleteUser, changePassword } from '@/lib/queries/users';
import { hashPassword } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (id) {
      // جلب مستخدم محدد
      const user = getUserById(id);
      if (!user) {
        return NextResponse.json({
          success: false,
          message: 'المستخدم غير موجود'
        }, { status: 404 });
      }

      // إزالة كلمة المرور من البيانات المرتجعة
      const { password, ...userWithoutPassword } = user;
      return NextResponse.json(userWithoutPassword);
    }

    // جلب جميع المستخدمين
    const users = getAllUsers();
    // إزالة كلمات المرور من البيانات المرتجعة
    const usersWithoutPassword = users.map(({ password, ...user }) => user);

    return NextResponse.json(usersWithoutPassword);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({
      success: false,
      message: 'Failure to fetch users'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userData = await request.json();

    // التحقق من صحة البيانات
    if (!userData.username || !userData.password) {
      return NextResponse.json({
        success: false,
        message: 'Username and password are required'
      }, { status: 400 });
    }

    // التحقق من صلاحيات المستخدم (يجب أن يكون المدير)
    // في هذا المثال، نفترض أن التحقق من الصلاحيات تم في middleware (سيتم إضافته لاحقاً)

    const newUser = await createUser(userData);
    // إزالة كلمة المرور من البيانات المرتجعة
    const { password, ...userWithoutPassword } = newUser;

    return NextResponse.json({
      success: true,
      message: 'تم إنشاء المستخدم بنجاح',
      user: userWithoutPassword
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json({
      success: false,
      message: 'Failure to create user'
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const userData = await request.json();

    if (!userData.id) {
      return NextResponse.json({
        success: false,
        message: 'User ID is required'
      }, { status: 400 });
    }

    // Update user with the new updateUser function
    const updatedUser = await updateUser(userData);

    if (!updatedUser) {
      return NextResponse.json({
        success: false,
        message: 'Failed to update user'
      }, { status: 500 });
    }

    // Remove password from response
    const { password, ...userWithoutPassword } = updatedUser;

    return NextResponse.json({
      success: true,
      message: 'User updated successfully',
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to update user'
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({
        success: false,
        message: 'User ID is required'
      }, { status: 400 });
    }

    const success = deleteUser(id);
    if (!success) {
      return NextResponse.json({
        success: false,
        message: 'Failure to delete user'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json({
      success: false,
      message: 'Failure to delete user'
    }, { status: 500 });
  }
}