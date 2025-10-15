'use client';

import { useEffect, useState } from 'react';
import { useStore } from '@/lib/store';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, CheckSquare, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

export default function TasksPage() {
  const tasks = useStore((state) => state.tasks);
  const companies = useStore((state) => state.companies);
  const fetchCompanies = useStore((state) => state.fetchCompanies);
  const fetchIntakes = useStore((state) => state.fetchIntakes);
  
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        fetchCompanies(),
        fetchIntakes(),
      ]);
      setLoading(false);
    };
    
    loadData();
  }, [fetchCompanies, fetchIntakes]);

  const getCompanyName = (companyId: string) => {
    return companies?.find((c) => c.id === companyId)?.name || 'Unknown';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading tasks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Tasks</h1>
          <p className="text-slate-500 mt-1">Manage all tasks across companies</p>
        </div>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Add Task
        </Button>
      </div>

      <div className="grid gap-4">
        {tasks && tasks.length > 0 ? (
          tasks.map((task) => (
            <Card key={task.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  <CheckSquare className="w-5 h-5 text-slate-400 mt-1" />
                  <div className="flex-1">
                    <Link href={`/companies/${task.companyId}`} className="font-medium text-slate-900 hover:text-blue-600">
                      {task.title}
                    </Link>
                    {task.description && (
                      <p className="text-sm text-slate-500 mt-1">{task.description}</p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                      <span>{getCompanyName(task.companyId)}</span>
                      {task.dueAt && (
                        <span>Due: {format(new Date(task.dueAt), 'MMM d, yyyy')}</span>
                      )}
                      {task.assignedTo && <span>Assigned to: {task.assignedTo}</span>}
                    </div>
                  </div>
                </div>
                <Badge 
                  variant={task.status === 'done' ? 'default' : 'secondary'}
                  className="ml-4"
                >
                  {task.status.replace('_', ' ')}
                </Badge>
              </div>
            </Card>
          ))
        ) : (
          <Card className="p-12 text-center">
            <CheckSquare className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No tasks yet</h3>
            <p className="text-slate-500 mb-4">Create your first task to get started</p>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Task
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
}