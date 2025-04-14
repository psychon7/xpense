"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Icons } from "@/components/ui/icons";
import { API_URL } from "@/config/api";

const ALLOWED_USERS = ["mohan95", "vandana94", "sushruth93"];

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

interface FormData {
  title: string;
  amount: string;
  description: string;
  category: Category;
}

export default function AddExpensePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState<FormData>({
    title: "",
    amount: "",
    description: "",
    category: "Other",
  });
  
  const [billImage, setBillImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [ocrAmount, setOcrAmount] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const username = localStorage.getItem("username");
      if (!username) {
        router.push("/login");
        return;
      }

      const formDataToSend = new FormData();
      formDataToSend.append("title", formData.title);
      formDataToSend.append("amount", formData.amount);
      formDataToSend.append("description", formData.description);
      formDataToSend.append("category", formData.category);
      formDataToSend.append("participants", JSON.stringify(ALLOWED_USERS));
      if (billImage) {
        formDataToSend.append("bill_image", billImage);
      }

      const response = await fetch(`${API_URL}/expenses`, {
        method: "POST",
        headers: {
          'X-Username': username
        },
        body: formDataToSend,
      });

      if (!response.ok) {
        throw new Error("Failed to add expense");
      }

      router.push("/dashboard");
    } catch (err) {
      console.error("Error adding expense:", err);
      setError(err instanceof Error ? err.message : "Failed to add expense");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setBillImage(file);
    setPreviewUrl(URL.createObjectURL(file));

    // Process image for OCR
    try {
      const username = localStorage.getItem("username");
      if (!username) {
        router.push("/login");
        return;
      }

      const formData = new FormData();
      formData.append("image", file);

      const response = await fetch(`${API_URL}/process-bill`, {
        method: "POST",
        headers: {
          'X-Username': username
        },
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        if (data.amount) {
          setOcrAmount(data.amount.toString());
          setFormData(prev => ({
            ...prev,
            amount: data.amount.toString(),
            description: data.description || ""
          }));
        }
      }
    } catch (err) {
      console.error("Error processing image:", err);
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Add New Expense</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Amount ($)</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                required
              />
              {ocrAmount && (
                <p className="text-sm text-gray-500">
                  Amount detected from bill: ${ocrAmount}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category (Optional)</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bill_image">Bill Image</Label>
              <div className="flex flex-col items-center p-4 border-2 border-dashed rounded-lg hover:bg-gray-50 transition-colors">
                <input
                  id="bill_image"
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <label
                  htmlFor="bill_image"
                  className="flex flex-col items-center gap-2 cursor-pointer"
                >
                  <div className="p-3 rounded-full bg-primary/10">
                    <Icons.camera className="w-6 h-6 text-primary" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium">Take Photo or Upload Bill</p>
                    <p className="text-xs text-gray-500">
                      We'll automatically detect the amount
                    </p>
                  </div>
                </label>
                {previewUrl && (
                  <div className="mt-4 relative">
                    <img
                      src={previewUrl}
                      alt="Bill preview"
                      className="max-w-full h-auto rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setBillImage(null);
                        setPreviewUrl(null);
                      }}
                      className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                    >
                      <Icons.x className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? "Adding..." : "Add Expense"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
