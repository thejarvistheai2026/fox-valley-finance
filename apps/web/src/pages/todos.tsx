import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Plus,
  Trash2,
  Edit,
  Calendar,
  CheckCircle2,
  Target,
  ListTodo,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import type { Todo } from '@/types';
import { getTodos, createTodo, updateTodo, toggleTodoComplete, deleteTodo } from '@/lib/supabase';

// Group todos by month
function groupTodosByMonth(todos: Todo[]) {
  const undated: Todo[] = [];
  const byMonth: Map<string, Todo[]> = new Map();

  todos.forEach((todo) => {
    if (!todo.due_date) {
      undated.push(todo);
    } else {
      const monthKey = format(parseISO(todo.due_date), 'yyyy-MM');
      if (!byMonth.has(monthKey)) {
        byMonth.set(monthKey, []);
      }
      byMonth.get(monthKey)!.push(todo);
    }
  });

  // Sort months chronologically
  const sortedMonths = Array.from(byMonth.entries()).sort(([a], [b]) =>
    a.localeCompare(b)
  );

  return { undated, byMonth: sortedMonths };
}

// Get month label
function getMonthLabel(monthKey: string): string {
  const [year, month] = monthKey.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1);
  return format(date, 'MMMM yyyy');
}

export function TodosPage() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    due_date: '',
    is_milestone: false,
  });

  // Load todos from database on mount
  useEffect(() => {
    fetchTodos();
  }, []);

  const fetchTodos = async () => {
    setLoading(true);
    try {
      const data = await getTodos();
      setTodos(data);
    } catch (err) {
      console.error('Failed to fetch todos:', err);
    } finally {
      setLoading(false);
    }
  };

  const { undated, byMonth } = groupTodosByMonth(todos);

  const handleAdd = () => {
    setEditingTodo(null);
    setFormData({
      title: '',
      description: '',
      due_date: '',
      is_milestone: false,
    });
    setDialogOpen(true);
  };

  const handleEdit = (todo: Todo) => {
    setEditingTodo(todo);
    setFormData({
      title: todo.title,
      description: todo.description || '',
      due_date: todo.due_date || '',
      is_milestone: todo.is_milestone,
    });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    try {
      if (editingTodo) {
        const updated = await updateTodo(editingTodo.id, {
          title: formData.title,
          description: formData.description || undefined,
          due_date: formData.due_date || undefined,
          is_milestone: formData.is_milestone,
        });
        setTodos((prev) =>
          prev.map((t) => (t.id === updated.id ? updated : t))
        );
      } else {
        const newTodo = await createTodo({
          title: formData.title,
          description: formData.description || undefined,
          due_date: formData.due_date || undefined,
          is_milestone: formData.is_milestone,
          is_completed: false,
        });
        setTodos((prev) => [...prev, newTodo]);
      }
      setDialogOpen(false);
    } catch (err) {
      console.error('Failed to save todo:', err);
      alert('Failed to save todo');
    }
  };

  const handleToggleComplete = async (id: string, currentStatus: boolean) => {
    try {
      const updated = await toggleTodoComplete(id, !currentStatus);
      setTodos((prev) =>
        prev.map((t) => (t.id === updated.id ? updated : t))
      );
    } catch (err) {
      console.error('Failed to update todo:', err);
      alert('Failed to update todo');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteTodo(id);
      setTodos((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      console.error('Failed to delete todo:', err);
      alert('Failed to delete todo');
    }
  };

  const renderTodoItem = (todo: Todo) => (
    <div
      key={todo.id}
      className={`flex items-start gap-3 p-3 rounded-lg border transition-all ${
        todo.is_completed
          ? 'bg-muted/50 border-muted'
          : 'bg-card border-border hover:border-primary/50'
      }`}
    >
      <Checkbox
        checked={todo.is_completed}
        onCheckedChange={() => handleToggleComplete(todo.id, todo.is_completed)}
        className="mt-0.5"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span
            className={`font-medium ${
              todo.is_completed ? 'line-through text-muted-foreground' : ''
            }`}
          >
            {todo.title}
          </span>
          {todo.is_milestone && (
            <Badge variant="secondary" className="text-xs">
              <Target className="h-3 w-3 mr-1" />
              Milestone
            </Badge>
          )}
        </div>
        {todo.description && (
          <p
            className={`text-sm mt-1 ${
              todo.is_completed ? 'text-muted-foreground/60' : 'text-muted-foreground'
            }`}
          >
            {todo.description}
          </p>
        )}
      </div>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => handleEdit(todo)}
          title="Edit"
        >
          <Edit className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-destructive hover:text-destructive"
          onClick={() => handleDelete(todo.id)}
          title="Delete"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">To-dos & Milestones</h1>
          <p className="text-muted-foreground mt-1">
            Track tasks and upcoming milestones for your project
          </p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="h-4 w-4 mr-2" />
          Add To-do
        </Button>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-5 w-5 rounded" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-48 mb-2" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <>
          {/* General To-dos (No Date) */}
          {undated.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <ListTodo className="h-5 w-5 text-primary" />
                  General To-dos
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  {undated.map(renderTodoItem)}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Monthly Grouped To-dos */}
          {byMonth.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  Scheduled Items
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <Accordion type="multiple" className="w-full">
                  {byMonth.map(([monthKey, monthTodos]) => (
                    <AccordionItem key={monthKey} value={monthKey}>
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-3">
                          <span className="font-semibold">{getMonthLabel(monthKey)}</span>
                          <Badge variant="outline" className="text-xs">
                            {monthTodos.length} item{monthTodos.length !== 1 ? 's' : ''}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {monthTodos.filter((t) => t.is_completed).length} completed
                          </Badge>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-2 pt-2">
                          {monthTodos.map(renderTodoItem)}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          )}

          {/* Empty State */}
          {todos.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-1">No to-dos yet</h3>
                <p className="text-muted-foreground mb-4 max-w-md mx-auto">
                  Start tracking your tasks and milestones. Add general to-dos or schedule items for specific months.
                </p>
                <Button onClick={handleAdd}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add First To-do
                </Button>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingTodo ? 'Edit To-do' : 'Add To-do'}</DialogTitle>
            <DialogDescription>
              {editingTodo
                ? 'Update your to-do or milestone'
                : 'Create a new to-do or milestone'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Title *</label>
              <Input
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="e.g., Order windows"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Input
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Optional details..."
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Due Date</label>
              <Input
                type="date"
                value={formData.due_date}
                onChange={(e) =>
                  setFormData({ ...formData, due_date: e.target.value })
                }
              />
              <p className="text-xs text-muted-foreground">
                Leave blank for general to-dos (no specific month)
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="is-milestone"
                checked={formData.is_milestone}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, is_milestone: checked === true })
                }
              />
              <label htmlFor="is-milestone" className="text-sm font-medium">
                This is a milestone
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={!formData.title}>
              {editingTodo ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
