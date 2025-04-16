import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getApiUrl } from "@/config/api";
import { useToast } from "@/components/ui/use-toast";

interface AddExpenseProps {
  onExpenseAdded: () => void;
  categories: readonly string[];
}

export function AddExpense({ onExpenseAdded, categories }: AddExpenseProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [billImage, setBillImage] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    category: '',
    description: ''
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Only accept images
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file",
        variant: "destructive"
      });
      return;
    }

    setBillImage(file);
    setIsLoading(true);

    try {
      const username = localStorage.getItem("username");
      if (!username) throw new Error("No username found");

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${getApiUrl()}/analyze`, {
        method: 'POST',
        headers: {
          'X-Username': username
        },
        body: formData
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to analyze bill');
      }

      const data = await response.json();
      setFormData({
        title: data.title || '',
        amount: data.amount?.toString() || '',
        category: data.category || 'Other',
        description: data.description || ''
      });
    } catch (error) {
      toast({
        title: "Error analyzing bill",
        description: error instanceof Error ? error.message : "Failed to analyze bill",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);

    try {
      const username = localStorage.getItem("username");
      if (!username) throw new Error("No username found");

      const response = await fetch(`${getApiUrl()}/expenses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Username': username
        },
        body: JSON.stringify({
          title: formData.title,
          amount: parseFloat(formData.amount),
          category: formData.category,
          description: formData.description,
          date: new Date().toISOString()
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to add expense');
      }

      toast({
        title: "Success",
        description: "Expense added successfully",
      });

      // Reset form
      setFormData({
        title: '',
        amount: '',
        category: '',
        description: ''
      });
      setBillImage(null);

      // Notify parent
      onExpenseAdded();
    } catch (error) {
      toast({
        title: "Error adding expense",
        description: error instanceof Error ? error.message : "Failed to add expense",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="p-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="bill" className="block text-sm font-medium">
            Upload Bill (Optional)
          </label>
          <Input
            id="bill"
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            disabled={isLoading}
          />
          {billImage && (
            <div className="mt-2">
              <img
                src={URL.createObjectURL(billImage)}
                alt="Bill preview"
                className="max-w-xs rounded-lg shadow-sm"
              />
            </div>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor="title" className="block text-sm font-medium">
            Title
          </label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
            disabled={isLoading}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="amount" className="block text-sm font-medium">
            Amount
          </label>
          <Input
            id="amount"
            type="number"
            step="0.01"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            required
            disabled={isLoading}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="category" className="block text-sm font-medium">
            Category
          </label>
          <Select
            value={formData.category}
            onValueChange={(value) => setFormData({ ...formData, category: value })}
            required
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a category" />
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
          <label htmlFor="description" className="block text-sm font-medium">
            Description
          </label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            disabled={isLoading}
          />
        </div>

        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Adding..." : "Add Expense"}
        </Button>
      </form>
    </Card>
  );
}