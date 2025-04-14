"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { Icons } from "@/components/ui/icons";
import { API_URL } from "@/config/api";
import { ExpenseActions } from "@/components/expense-actions";

interface Expense {
  id: number;
  title: string;
  amount: number;
  description: string;
  category: string;
  date: string;
  bill_image_url?: string;
  is_settled: boolean;
  creator: string;
  participants: string[];
}

const categories = [
  "Food",
  "Rent",
  "Utilities",
  "Transportation",
  "Entertainment",
  "Shopping",
  "Other",
] as const;

export default function ExpensesPage() {
  const router = useRouter();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    try {
      const username = localStorage.getItem("username");
      if (!username) {
        router.push("/login");
        return;
      }

      const response = await fetch(`${API_URL}/expenses/`, {
        headers: {
          'X-Username': username
        }
      });

      if (!response.ok) {
        throw new Error("Failed to fetch expenses");
      }

      const data = await response.json();
      setExpenses(data);
    } catch (err) {
      console.error("Fetch error:", err);
      setError("Failed to load expenses");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSettleExpense = async (expenseId: number) => {
    try {
      const username = localStorage.getItem("username");
      if (!username) {
        router.push("/login");
        return;
      }

      const response = await fetch(`${API_URL}/expenses/${expenseId}/settle`, {
        method: "PUT",
        headers: {
          'X-Username': username
        }
      });

      if (!response.ok) {
        throw new Error("Failed to settle expense");
      }

      // Refresh expenses list
      fetchExpenses();
    } catch (err) {
      console.error("Settle error:", err);
      setError("Failed to settle expense");
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading expenses...</div>;
  }

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Expenses</h1>
        <Button onClick={() => router.push("/expenses/add")}>
          Add New Expense
        </Button>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4">
          {error}
        </Alert>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {expenses.map((expense) => (
          <Card key={expense.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {expense.title}
              </CardTitle>
              <div className="flex items-center gap-2">
                <div className={`px-2 py-1 rounded text-xs ${
                  expense.is_settled ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                }`}>
                  {expense.is_settled ? "Settled" : "Pending"}
                </div>
                <ExpenseActions 
                  expense={expense}
                  onUpdate={fetchExpenses}
                  categories={categories}
                />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-2xl font-bold">${expense.amount.toFixed(2)}</span>
                  <span className="text-sm text-gray-500">{expense.category}</span>
                </div>
                
                <p className="text-sm text-gray-600">{expense.description}</p>
                
                {expense.bill_image_url && (
                  <img
                    src={expense.bill_image_url}
                    alt="Bill"
                    className="w-full h-32 object-cover rounded-lg"
                  />
                )}
                
                <div className="flex flex-col space-y-1">
                  <div className="flex items-center text-sm text-gray-500">
                    <Icons.users className="w-4 h-4 mr-1" />
                    <span>Paid by {expense.creator}</span>
                  </div>
                  <div className="text-xs text-gray-400">
                    Split with: {expense.participants.join(", ")}
                  </div>
                </div>

                {!expense.is_settled && (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => handleSettleExpense(expense.id)}
                  >
                    Mark as Settled
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {expenses.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No expenses found. Add your first expense!
        </div>
      )}
    </div>
  );
}
