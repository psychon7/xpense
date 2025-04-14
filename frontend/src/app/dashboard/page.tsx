"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/ui/icons";
import { API_URL } from "@/config/api";
import { ExpenseActions } from "@/components/expense-actions";
import { BalanceSummary } from "@/components/balance-summary";
import { AddExpense } from "@/components/add-expense";

const categories = [
  "Food",
  "Rent",
  "Utilities",
  "Transportation",
  "Entertainment",
  "Shopping",
  "Other",
] as const;

type Category = typeof categories[number];

interface Expense {
  id: number;
  title: string;
  amount: number;
  description: string;
  category: string;
  creator: string;
  bill_image_url?: string;
  participants: string[];
  created_at: string;
  is_settled: boolean;
}

interface Balance {
  amount: number;
  user: string;
}

interface BalanceData {
  owed_to_me: Balance[];
  i_owe: Balance[];
  net_balance: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [balance, setBalance] = useState<BalanceData>({
    owed_to_me: [],
    i_owe: [],
    net_balance: 0
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const username = localStorage.getItem("username");
    if (!username) {
      router.push("/login");
      return;
    }

    fetchExpenses();
    fetchBalance();
  }, [router]);

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

      if (response.ok) {
        const data = await response.json();
        setExpenses(data);
      } else if (response.status === 401) {
        router.push("/login");
      }
    } catch (err) {
      setError("Failed to fetch expenses");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchBalance = async () => {
    try {
      const username = localStorage.getItem("username");
      if (!username) {
        router.push("/login");
        return;
      }

      const response = await fetch(`${API_URL}/balance/`, {
        headers: {
          'X-Username': username
        }
      });

      if (response.ok) {
        const data = await response.json();
        setBalance(data);
      }
    } catch (err) {
      setError("Failed to fetch balance");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("username");
    router.push("/login");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="container py-8 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <Button variant="outline" onClick={handleLogout}>
          <Icons.logout className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          {error}
        </Alert>
      )}

      <BalanceSummary balances={balance} />

      <AddExpense
        onExpenseAdded={() => {
          fetchExpenses();
          fetchBalance();
        }}
        categories={categories}
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {expenses.map((expense) => (
          <Card key={expense.id} className="relative">
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
                  onUpdate={() => {
                    fetchExpenses();
                    fetchBalance();
                  }}
                  categories={categories}
                />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${expense.amount.toFixed(2)}</div>
              <div className="text-xs text-muted-foreground mt-1">
                <span className="inline-flex items-center">
                  <Icons.chart className="w-3 h-3 mr-1" />
                  {expense.category}
                </span>
                <span className="mx-2">•</span>
                <span className="inline-flex items-center">
                  <Icons.calendar className="w-3 h-3 mr-1" />
                  {new Date(expense.created_at).toLocaleDateString()}
                </span>
              </div>
              {expense.description && (
                <p className="text-sm mt-2 text-muted-foreground">{expense.description}</p>
              )}
              <div className="mt-4 space-y-2">
                <div className="flex items-center text-sm text-gray-500">
                  <Icons.users className="w-4 h-4 mr-1" />
                  <span>Paid by {expense.creator}</span>
                </div>
                <div className="text-xs text-gray-400">
                  Split with: {expense.participants.join(", ")}
                </div>
                {expense.bill_image_url && (
                  <div className="mt-2">
                    <a
                      href={expense.bill_image_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:underline flex items-center"
                    >
                      <Icons.upload className="w-3 h-3 mr-1" />
                      View Bill
                    </a>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {expenses.length === 0 && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No expenses found. Add your first expense!</p>
        </div>
      )}
    </div>
  );
}
