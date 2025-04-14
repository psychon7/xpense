"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";

const ALLOWED_USERS = [
  "mohan95", "vandana94", "sushruth93",  // Real users
  "test1", "test2", "test3"  // Test users
];

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!ALLOWED_USERS.includes(username)) {
      setError("You are not part of the flat. Access denied.");
      return;
    }

    localStorage.setItem("username", username);
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Welcome to Xpense</CardTitle>
          <p className="text-gray-500 mt-2">Split expenses with your flatmates</p>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                required
              />
              <p className="text-sm text-gray-500">
                Use your name followed by birth year (e.g., john95)
              </p>
            </div>
            <Button type="submit" className="w-full">
              Enter App
            </Button>
          </form>

          <div className="mt-8 space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-4">How it works 🚀</h3>
              <div className="space-y-4">
                <div className="flex items-start space-x-3 text-left">
                  <span className="text-2xl">👤</span>
                  <div>
                    <p className="font-medium">Simple Login</p>
                    <p className="text-sm text-gray-600">Just enter your username to get started (e.g., mohan95)</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 text-left">
                  <span className="text-2xl">💰</span>
                  <div>
                    <p className="font-medium">Add Expenses</p>
                    <p className="text-sm text-gray-600">Enter amount and description, or upload a bill photo for automatic detection</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 text-left">
                  <span className="text-2xl">⚖️</span>
                  <div>
                    <p className="font-medium">Auto Split</p>
                    <p className="text-sm text-gray-600">Expenses are automatically split equally between all flatmates</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 text-left">
                  <span className="text-2xl">📊</span>
                  <div>
                    <p className="font-medium">Track Balances</p>
                    <p className="text-sm text-gray-600">See who owes what and track expense history</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
