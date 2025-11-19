"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Users,
  Plus,
  Edit,
  Trash2,
  Shield,
  User as UserIcon,
  Eye,
  EyeOff,
  BookOpen,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { User, UserRole } from "@/types";
import { formatGregorianDateTime } from "@/utils/dateFormat";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import DatabaseMigration from "@/components/DatabaseMigration";

export default function UserManagement() {
  const { isAdmin } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    username: "",
    password: "",
    role: "user" as UserRole,
    fullName: "",
  });

  // تحميل المستخدمين
  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/users");
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin()) {
      fetchUsers();
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const url = editingUser ? "/api/users" : "/api/users";
      const method = editingUser ? "PUT" : "POST";

      const userData = editingUser ? { ...editingUser, ...formData } : formData;

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
      });

      const result = await response.json();

      if (result.success) {
        fetchUsers();
        resetForm();
        toast.success(
          editingUser ? "تم تحديث المستخدم بنجاح" : "تم إنشاء المستخدم بنجاح"
        );
      } else {
        toast.error(result.message || "حدث خطأ");
      }
    } catch (error) {
      console.error("Error saving user:", error);
      toast.error("حدث خطأ أثناء حفظ المستخدم");
    }
  };

  const resetForm = () => {
    setFormData({
      username: "",
      password: "",
      role: "user",
      fullName: "",
    });
    setEditingUser(null);
    setIsModalOpen(false);
    setShowPassword(false);
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      password: "", // لا نعرض كلمة المرور الحالية
      role: user.role,
      fullName: user.fullName || "",
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string, username: string) => {
    if (username === "admin" || username === "usar") {
      toast.error("لا يمكن حذف المستخدمين الافتراضيين");
      return;
    }

    if (confirm(`هل أنت متأكد من حذف المستخدم: ${username}؟`)) {
      try {
        const response = await fetch(`/api/users?id=${id}`, {
          method: "DELETE",
        });

        const result = await response.json();

        if (result.success) {
          fetchUsers();
          toast.success("تم حذف المستخدم بنجاح");
        } else {
          toast.error(result.message || "فشل في حذف المستخدم");
        }
      } catch (error) {
        console.error("Error deleting user:", error);
        toast.error("حدث خطأ أثناء حذف المستخدم");
      }
    }
  };


  if (!isAdmin()) {
    return (
      <Alert className="border-red-200 bg-red-50">
        <Shield className="h-4 w-4 text-red-600" />
        <AlertDescription className="text-red-800">
          هذه الصفحة متاحة للمديرين فقط
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Database Migration Notice */}
      <DatabaseMigration />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">إدارة المستخدمين</h2>
          <p className="text-gray-600">إنشاء وإدارة حسابات المستخدمين</p>
        </div>
        <div className="flex gap-2">
          <Link href="/debt-book">
            <Button variant="outline" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              إدارة دفتر الديون
            </Button>
          </Link>
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                إضافة مستخدم جديد
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>
                  {editingUser ? "تعديل المستخدم" : "إضافة مستخدم جديد"}
                </DialogTitle>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username">اسم المستخدم *</Label>
                  <Input
                    id="username"
                    required
                    value={formData.username}
                    onChange={(e) =>
                      setFormData({ ...formData, username: e.target.value })
                    }
                    disabled={
                      editingUser?.username === "admin" ||
                      editingUser?.username === "usar"
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">
                    {editingUser
                      ? "كلمة المرور الجديدة (اتركها فارغة للاحتفاظ بالحالية)"
                      : "كلمة المرور *"}
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      required={!editingUser}
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                      className="pl-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>نوع المستخدم *</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value) =>
                      setFormData({ ...formData, role: value as UserRole })
                    }
                    disabled={editingUser?.username === "admin"}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4 text-red-500" />
                          مدير النظام
                        </div>
                      </SelectItem>
                      <SelectItem value="assistant-admin">
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4 text-amber-500" />
                          مساعد مدير
                        </div>
                      </SelectItem>
                      <SelectItem value="user">
                        <div className="flex items-center gap-2">
                          <UserIcon className="h-4 w-4 text-blue-500" />
                          مستخدم عادي
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fullName">الاسم الكامل</Label>
                  <Input
                    id="fullName"
                    value={formData.fullName}
                    onChange={(e) =>
                      setFormData({ ...formData, fullName: e.target.value })
                    }
                  />
                </div>

                <div className="flex items-center justify-start gap-4 pt-6">
                  <Button type="submit">
                    {editingUser ? "حفظ التعديلات" : "إنشاء المستخدم"}
                  </Button>
                  <Button type="button" variant="outline" onClick={resetForm}>
                    إلغاء
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            قائمة المستخدمين ({users.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p>جاري تحميل المستخدمين...</p>
            </div>
          ) : (
            <div className="rounded-md border" dir="rtl">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">#</TableHead>
                    <TableHead className="text-right">المستخدم</TableHead>
                    <TableHead className="text-right">النوع</TableHead>
                    <TableHead className="text-right">الاسم الكامل</TableHead>
                    <TableHead className="text-right">آخر دخول</TableHead>
                    <TableHead className="text-right">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user, index) => (
                    <TableRow key={user.id}>
                      <TableCell className="text-right font-medium">
                        {index + 1}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center gap-2">
                          {user.role === "admin" ? (
                            <Shield className="h-4 w-4 text-red-500" />
                          ) : user.role === "assistant-admin" ? (
                            <Shield className="h-4 w-4 text-amber-500" />
                          ) : (
                            <UserIcon className="h-4 w-4 text-blue-500" />
                          )}
                          <span className="font-medium">{user.username}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge
                          variant={
                            user.role === "admin" ? "destructive" : user.role === "assistant-admin" ? "secondary" : "default"
                          }
                          className={
                            user.role === "admin"
                              ? "bg-red-100 text-red-700"
                              : user.role === "assistant-admin"
                                ? "bg-amber-100 text-amber-700"
                                : "bg-blue-100 text-blue-700"
                          }
                        >
                          {user.role === "admin"
                            ? "مدير النظام"
                            : user.role === "assistant-admin"
                              ? "مساعد مدير"
                              : "مستخدم عادي"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {user.fullName || "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        {user.lastLogin
                          ? formatGregorianDateTime(user.lastLogin)
                          : "لم يسجل دخول بعد"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center gap-2 justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(user)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>

                          {user.username !== "admin" && user.username !== "usar" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                handleDelete(user.id, user.username)
                              }
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {users.length === 0 && !loading && (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>لا توجد مستخدمين</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
