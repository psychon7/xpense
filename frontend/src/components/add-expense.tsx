import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/ui/icons";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { API_URL } from "@/config/api";

interface AddExpenseProps {
  onExpenseAdded: () => void;
  categories: readonly string[];
}

export function AddExpense({ onExpenseAdded, categories }: AddExpenseProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [billImage, setBillImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    amount: "",
    description: "",
    category: "Other"
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setBillImage(file);
    setPreviewUrl(URL.createObjectURL(file));

    try {
      const username = localStorage.getItem("username");
      if (!username) return;

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const username = localStorage.getItem("username");
      if (!username) throw new Error("Not authenticated");

      const formDataToSend = new FormData();
      formDataToSend.append("title", formData.title);
      formDataToSend.append("amount", formData.amount);
      formDataToSend.append("description", formData.description);
      formDataToSend.append("category", formData.category);
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

      if (!response.ok) throw new Error("Failed to add expense");

      // Reset form
      setFormData({
        title: "",
        amount: "",
        description: "",
        category: "Other"
      });
      setBillImage(null);
      setPreviewUrl(null);
      onExpenseAdded();
    } catch (err) {
      console.error("Error adding expense:", err);
      setError(err instanceof Error ? err.message : "Failed to add expense");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Add New Expense</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
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
                  onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
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
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Adding..." : "Add Expense"}
              </Button>

              {error && <div className="text-sm text-red-600">{error}</div>}
            </form>
          </div>

          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">Upload Bill</h3>
              <p className="text-sm text-gray-500 mb-4">Take a photo or upload your bill</p>
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById("bill_image")?.click()}
                className="w-full"
              >
                <Icons.camera className="mr-2 h-4 w-4" />
                Take Photo of Bill
              </Button>
              <input
                type="file"
                id="bill_image"
                className="hidden"
                accept="image/*"
                capture="environment"
                onChange={handleFileChange}
              />
            </div>
            {previewUrl && (
              <div className="w-full">
                <img
                  src={previewUrl}
                  alt="Bill preview"
                  className="max-w-full h-auto rounded-lg mx-auto"
                />
                <Button
                  type="button"
                  variant="ghost"
                  className="mt-2 w-full text-red-600 hover:text-red-700"
                  onClick={() => {
                    setBillImage(null);
                    setPreviewUrl(null);
                  }}
                >
                  <Icons.x className="mr-2 h-4 w-4" />
                  Remove Image
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
