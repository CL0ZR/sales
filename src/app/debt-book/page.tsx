"use client";

import React, { useState } from "react";
import { useApp } from "@/context/AppContext";
import { DebtCustomer, Debt } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { Plus, Edit, Trash2, DollarSign, Users, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useCurrency } from "@/context/CurrencyContext";

export default function DebtBookPage() {
  const { state } = useApp();
  const { formatCurrency } = useCurrency();
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState<Debt | null>(null);
  const [customerForm, setCustomerForm] = useState<Partial<DebtCustomer>>({
    name: "",
    phone: "",
    address: "",
  });
  const [paymentAmount, setPaymentAmount] = useState("");
  const [editingCustomer, setEditingCustomer] = useState<DebtCustomer | null>(null);

  // Calculate statistics
  const totalDebts = state.debts.length;
  const totalOwed = state.debts.reduce((sum, d) => sum + d.amountRemaining, 0);
  const totalDebtors = state.debtCustomers.length;
  const unpaidDebts = state.debts.filter(d => d.status === 'unpaid').length;

  const handleAddCustomer = async () => {
    try {
      const response = await fetch('/api/debt-customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customerForm),
      });

      if (response.ok) {
        const newCustomer = await response.json();
        toast.success("تمت إضافة العميل بنجاح");
        setIsCustomerModalOpen(false);
        setCustomerForm({ name: "", phone: "", address: "" });
        window.location.reload();
      }
    } catch (error) {
      toast.error("فشل في إضافة العميل");
    }
  };

  const handleEditCustomer = async () => {
    if (!editingCustomer) return;

    try {
      const response = await fetch('/api/debt-customers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...editingCustomer, ...customerForm }),
      });

      if (response.ok) {
        toast.success("تم تحديث العميل بنجاح");
        setIsCustomerModalOpen(false);
        setEditingCustomer(null);
        setCustomerForm({ name: "", phone: "", address: "" });
        window.location.reload();
      }
    } catch (error) {
      toast.error("فشل في تحديث العميل");
    }
  };

  const handleDeleteCustomer = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا العميل؟")) return;

    try {
      const response = await fetch(`/api/debt-customers?id=${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success("تم حذف العميل بنجاح");
        window.location.reload();
      } else {
        const error = await response.json();
        toast.error(error.error || "فشل في حذف العميل");
      }
    } catch (error) {
      toast.error("فشل في حذف العميل");
    }
  };

  const handleRecordPayment = async () => {
    if (!selectedDebt || !paymentAmount) return;

    const amount = parseFloat(paymentAmount);
    if (amount <= 0 || amount > selectedDebt.amountRemaining) {
      toast.error("المبلغ غير صحيح");
      return;
    }

    try {
      const response = await fetch('/api/debt-payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          debtId: selectedDebt.id,
          amount,
          paymentMethod: 'cash',
        }),
      });

      if (response.ok) {
        toast.success("تم تسجيل الدفعة بنجاح");
        setIsPaymentModalOpen(false);
        setPaymentAmount("");
        setSelectedDebt(null);
        window.location.reload();
      }
    } catch (error) {
      toast.error("فشل في تسجيل الدفعة");
    }
  };

  const openEditCustomer = (customer: DebtCustomer) => {
    setEditingCustomer(customer);
    setCustomerForm({
      name: customer.name,
      phone: customer.phone,
      address: customer.address,
    });
    setIsCustomerModalOpen(true);
  };

  const openAddCustomer = () => {
    setEditingCustomer(null);
    setCustomerForm({ name: "", phone: "", address: "" });
    setIsCustomerModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">دفتر الديون</h1>
        <p className="text-muted-foreground">إدارة العملاء والديون</p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الديون</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalDebts}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">المبلغ المستحق</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(totalOwed)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">عدد العملاء</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalDebtors}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ديون غير مدفوعة</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{unpaidDebts}</div>
          </CardContent>
        </Card>
      </div>

      {/* Customers Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>العملاء</CardTitle>
          <Button onClick={openAddCustomer}>
            <Plus className="h-4 w-4 mr-2" />
            إضافة عميل
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">الاسم</TableHead>
                <TableHead className="text-right">رقم الهاتف</TableHead>
                <TableHead className="text-right">العنوان</TableHead>
                <TableHead className="text-right">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {state.debtCustomers.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell className="font-medium">{customer.name}</TableCell>
                  <TableCell>{customer.phone}</TableCell>
                  <TableCell>{customer.address || "-"}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEditCustomer(customer)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteCustomer(customer.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {state.debtCustomers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    لا يوجد عملاء
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Debts Section */}
      <Card>
        <CardHeader>
          <CardTitle>الديون النشطة</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">العميل</TableHead>
                <TableHead className="text-right">المبلغ الإجمالي</TableHead>
                <TableHead className="text-right">المدفوع</TableHead>
                <TableHead className="text-right">المتبقي</TableHead>
                <TableHead className="text-right">الحالة</TableHead>
                <TableHead className="text-right">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {state.debts.filter(d => d.status !== 'paid').map((debt) => (
                <TableRow key={debt.id}>
                  <TableCell className="font-medium">
                    {debt.customer?.name || "غير معروف"}
                  </TableCell>
                  <TableCell>{formatCurrency(debt.totalAmount)}</TableCell>
                  <TableCell className="text-green-600">{formatCurrency(debt.amountPaid)}</TableCell>
                  <TableCell className="text-red-600 font-bold">{formatCurrency(debt.amountRemaining)}</TableCell>
                  <TableCell>
                    <Badge variant={debt.status === 'paid' ? 'default' : debt.status === 'partial' ? 'secondary' : 'destructive'}>
                      {debt.status === 'paid' ? 'مدفوع' : debt.status === 'partial' ? 'جزئي' : 'غير مدفوع'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      onClick={() => {
                        setSelectedDebt(debt);
                        setIsPaymentModalOpen(true);
                      }}
                      disabled={debt.status === 'paid'}
                    >
                      <DollarSign className="h-4 w-4 mr-2" />
                      تسجيل دفعة
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {state.debts.filter(d => d.status !== 'paid').length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    لا توجد ديون نشطة
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Customer Modal */}
      <Dialog open={isCustomerModalOpen} onOpenChange={setIsCustomerModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCustomer ? "تعديل عميل" : "إضافة عميل جديد"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>الاسم *</Label>
              <Input
                value={customerForm.name}
                onChange={(e) => setCustomerForm({ ...customerForm, name: e.target.value })}
                placeholder="اسم العميل"
              />
            </div>
            <div>
              <Label>رقم الهاتف *</Label>
              <Input
                value={customerForm.phone}
                onChange={(e) => setCustomerForm({ ...customerForm, phone: e.target.value })}
                placeholder="رقم الهاتف"
              />
            </div>
            <div>
              <Label>العنوان</Label>
              <Input
                value={customerForm.address}
                onChange={(e) => setCustomerForm({ ...customerForm, address: e.target.value })}
                placeholder="العنوان (اختياري)"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsCustomerModalOpen(false)}>
                إلغاء
              </Button>
              <Button onClick={editingCustomer ? handleEditCustomer : handleAddCustomer}>
                {editingCustomer ? "تحديث" : "إضافة"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Payment Modal */}
      <Dialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تسجيل دفعة</DialogTitle>
          </DialogHeader>
          {selectedDebt && (
            <div className="space-y-4">
              <div className="p-4 bg-secondary rounded-lg">
                <p className="text-sm text-muted-foreground">العميل</p>
                <p className="font-bold">{selectedDebt.customer?.name}</p>
                <p className="text-sm text-muted-foreground mt-2">المبلغ المتبقي</p>
                <p className="text-2xl font-bold text-red-600">{formatCurrency(selectedDebt.amountRemaining)}</p>
              </div>
              <div>
                <Label>المبلغ المدفوع *</Label>
                <Input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="أدخل المبلغ"
                  max={selectedDebt.amountRemaining}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsPaymentModalOpen(false)}>
                  إلغاء
                </Button>
                <Button onClick={handleRecordPayment}>
                  تسجيل الدفعة
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
