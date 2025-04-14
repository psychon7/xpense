import { useState } from 'react';
import { Edit, Trash, MoreVertical, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { API_URL } from '@/config/api';
import { toast } from 'sonner';

interface Expense {
  id: number;
  title: string;
  amount: number;
  description: string;
  category: string;
  creator: string;
  participants: string[];
  created_at: string;
  is_settled: boolean;
  bill_image_url?: string;
}

interface ExpenseActionsProps {
  expense: Expense;
  onUpdate: () => void;
  categories: readonly string[];
}

export function ExpenseActions({ expense, onUpdate, categories }: ExpenseActionsProps) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: expense.title,
    amount: expense.amount.toString(),
    description: expense.description,
    category: expense.category
  });

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const username = localStorage.getItem("username");
      if (!username) return;

      const response = await fetch(`${API_URL}/expenses/${expense.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Username': username
        },
        body: JSON.stringify({
          ...formData,
          amount: parseFloat(formData.amount)
        })
      });

      if (!response.ok) throw new Error('Failed to update expense');

      setIsEditDialogOpen(false);
      onUpdate();
    } catch (error) {
      console.error('Error updating expense:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSettle = async () => {
    try {
      const loadingToast = toast.loading('Settling expense...');
      
      const response = await fetch(`/api/expenses/${expense.id}/settle`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to settle expense');
      }

      toast.dismiss(loadingToast);
      toast.success('Expense settled successfully! 🎉', {
        description: `${expense.title} has been marked as settled`,
      });

      // Refresh the page to update the UI
      // router.refresh();
    } catch (error) {
      console.error('Error settling expense:', error);
      toast.error('Failed to settle expense', {
        description: error instanceof Error ? error.message : 'Please try again',
      });
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this expense?')) {
      return;
    }

    try {
      const loadingToast = toast.loading('Deleting expense...');
      
      const response = await fetch(`/api/expenses/${expense.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete expense');
      }

      toast.dismiss(loadingToast);
      toast.success('Expense deleted successfully', {
        description: `${expense.title} has been removed`,
      });

      // Refresh the page to update the UI
      // router.refresh();
    } catch (error) {
      console.error('Error deleting expense:', error);
      toast.error('Failed to delete expense', {
        description: error instanceof Error ? error.message : 'Please try again',
      });
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setIsEditDialogOpen(true)}>
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleSettle}>
            <CheckCircle2 className="mr-2 h-4 w-4" />
            Settle
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleDelete}>
            <Trash className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Expense</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4">
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

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
