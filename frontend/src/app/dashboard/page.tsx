"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";

interface Expense {
  id: number;
  amount: number;
  description: string;
  date: string;
  payer_id: number;
}

interface Balance {
  total_expenses: number;
  user_paid: number;
  share_per_user: number;
  balance: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [balance, setBalance] = useState<Balance | null>(null);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetchExpenses();
    fetchBalance();
  }, []);

  const fetchExpenses = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      const response = await fetch("http://localhost:8000/expenses/", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setExpenses(data);
      } else if (response.status === 401) {
        router.push("/login");
      }
    } catch (err) {
      setError("Failed to fetch expenses");
    }
  };

  const fetchBalance = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      const response = await fetch("http://localhost:8000/balance/", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setBalance(data);
      }
    } catch (err) {
      setError("Failed to fetch balance");
    }
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      const response = await fetch("http://localhost:8000/expenses/", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: parseFloat(amount),
          description,
        }),
      });

      if (response.ok) {
        setAmount("");
        setDescription("");
        fetchExpenses();
        fetchBalance();
      } else {
        const error = await response.json();
        setError(error.detail || "Failed to add expense");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col space-y-2 sm:flex-row sm:justify-between sm:items-center">
        <h1 className="text-2xl font-bold">Xpense</h1>
        <Button onClick={handleLogout} variant="outline" size="sm">
          Logout
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          {error}
        </Alert>
      )}

      <Card className="bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Your Balance</CardTitle>
        </CardHeader>
        <CardContent>
          {balance && (
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-gray-600">Total Expenses</p>
                <p className="font-semibold">${balance.total_expenses.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-gray-600">You Paid</p>
                <p className="font-semibold">${balance.user_paid.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-gray-600">Share Per User</p>
                <p className="font-semibold">${balance.share_per_user.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-gray-600">Balance</p>
                <p className={`font-semibold ${balance.balance >= 0 ? "text-green-600" : "text-red-600"}`}>
                  ${balance.balance.toFixed(2)}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Add Expense</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddExpense} className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="text-lg"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full">
              Add Expense
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Expenses</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {expenses.map((expense) => (
              <div
                key={expense.id}
                className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium truncate">{expense.description}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(expense.date).toLocaleDateString()}
                  </p>
                </div>
                <p className="font-bold text-right ml-4">
                  ${expense.amount.toFixed(2)}
                </p>
              </div>
            ))}
            {expenses.length === 0 && (
              <p className="text-center text-gray-500 py-4">
                No expenses yet
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
