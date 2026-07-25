"use client";

import React, { useState } from 'react';
import { TaskItem, useProductivityStore } from '@/lib/productivity-store';
import { CheckCircle2, Circle, Clock, Plus, Trash2, Tag, AlertCircle, Filter, LayoutGrid, List } from 'lucide-react';

export function TaskManager() {
  const { tasks, addTask, toggleTask, updateTaskStatus, deleteTask } = useProductivityStore();

  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [filterSubject, setFilterSubject] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');

  // Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('Engineering');
  const [plannedMinutes, setPlannedMinutes] = useState(45);
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [dueDate, setDueDate] = useState(new Date().toISOString().split('T')[0]);

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    addTask({
      title: title.trim(),
      subject,
      planned_minutes: plannedMinutes,
      completed: false,
      status: 'todo',
      priority,
      due_date: dueDate,
    });
    setTitle('');
    setIsModalOpen(false);
  };

  const filteredTasks = tasks.filter(t => {
    if (filterSubject !== 'all' && t.subject !== filterSubject) return false;
    if (filterPriority !== 'all' && t.priority !== filterPriority) return false;
    return true;
  });

  const todoTasks = filteredTasks.filter(t => t.status === 'todo' || (!t.status && !t.completed));
  const inProgressTasks = filteredTasks.filter(t => t.status === 'in_progress');
  const completedTasks = filteredTasks.filter(t => t.status === 'completed' || t.completed);

  const totalTasks = tasks.length;
  const completedCount = tasks.filter(t => t.completed || t.status === 'completed').length;
  const progressPercent = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

  const subjects = Array.from(new Set(tasks.map(t => t.subject).filter(Boolean)));

  const getPriorityBadge = (p: TaskItem['priority']) => {
    switch (p) {
      case 'high':
        return <span className="bg-red-500/20 text-red-400 border border-red-500/30 text-[10px] font-mono font-bold px-2 py-0.5 rounded">HIGH</span>;
      case 'medium':
        return <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-mono font-bold px-2 py-0.5 rounded">MED</span>;
      case 'low':
        return <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono font-bold px-2 py-0.5 rounded">LOW</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Stats Banner */}
      <div className="bg-surface-container-high border border-outline-variant/50 rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              <CheckCircle2 className="w-7 h-7 text-primary-fixed" />
              Task Manager
            </h2>
            <p className="text-on-surface-variant text-sm mt-1">
              Organize your study goals, track priority tasks, and hit daily milestones.
            </p>
          </div>
          
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-primary text-on-primary font-bold rounded-xl shadow-[0_0_20px_rgba(0,255,163,0.3)] hover:brightness-110 transition cursor-pointer shrink-0"
          >
            <Plus className="w-5 h-5" />
            Add New Task
          </button>
        </div>

        {/* Progress Bar */}
        <div className="mt-6 pt-4 border-t border-outline-variant/30">
          <div className="flex justify-between items-center text-xs font-mono mb-2">
            <span className="text-on-surface-variant">Overall Progress ({completedCount}/{totalTasks} Completed)</span>
            <span className="text-primary-fixed font-bold">{progressPercent}%</span>
          </div>
          <div className="h-2.5 bg-surface-variant rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-emerald-500 to-primary-fixed transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Controls & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-surface-container/60 p-3 rounded-xl border border-outline-variant/40">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Subject Filter */}
          <div className="flex items-center gap-2 text-xs text-on-surface-variant">
            <Filter className="w-4 h-4 text-primary-fixed" />
            <select
              value={filterSubject}
              onChange={e => setFilterSubject(e.target.value)}
              className="bg-surface-variant text-on-surface border border-outline-variant/40 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-primary"
            >
              <option value="all">All Subjects</option>
              {subjects.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Priority Filter */}
          <select
            value={filterPriority}
            onChange={e => setFilterPriority(e.target.value)}
            className="bg-surface-variant text-on-surface border border-outline-variant/40 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-primary"
          >
            <option value="all">All Priorities</option>
            <option value="high">High Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="low">Low Priority</option>
          </select>
        </div>

        {/* View mode toggle */}
        <div className="flex items-center gap-1 bg-surface-variant p-1 rounded-lg self-end sm:self-auto">
          <button
            onClick={() => setViewMode('kanban')}
            className={`p-1.5 rounded-md text-xs font-semibold flex items-center gap-1 transition ${
              viewMode === 'kanban' ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface-variant hover:text-white'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
            Kanban
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-1.5 rounded-md text-xs font-semibold flex items-center gap-1 transition ${
              viewMode === 'list' ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface-variant hover:text-white'
            }`}
          >
            <List className="w-4 h-4" />
            List
          </button>
        </div>
      </div>

      {/* Main View: Kanban or List */}
      {viewMode === 'kanban' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Column: To Do */}
          <KanbanColumn
            title="To Do"
            count={todoTasks.length}
            tasks={todoTasks}
            colorBorder="border-t-amber-500"
            statusTarget="todo"
            onToggle={toggleTask}
            onMoveStatus={updateTaskStatus}
            onDelete={deleteTask}
            getPriorityBadge={getPriorityBadge}
          />

          {/* Column: In Progress */}
          <KanbanColumn
            title="In Progress"
            count={inProgressTasks.length}
            tasks={inProgressTasks}
            colorBorder="border-t-blue-500"
            statusTarget="in_progress"
            onToggle={toggleTask}
            onMoveStatus={updateTaskStatus}
            onDelete={deleteTask}
            getPriorityBadge={getPriorityBadge}
          />

          {/* Column: Completed */}
          <KanbanColumn
            title="Completed"
            count={completedTasks.length}
            tasks={completedTasks}
            colorBorder="border-t-emerald-500"
            statusTarget="completed"
            onToggle={toggleTask}
            onMoveStatus={updateTaskStatus}
            onDelete={deleteTask}
            getPriorityBadge={getPriorityBadge}
          />
        </div>
      ) : (
        <div className="bg-surface-container rounded-2xl border border-outline-variant/50 p-4 space-y-3">
          {filteredTasks.length === 0 ? (
            <div className="text-center py-12 text-on-surface-variant italic font-mono">
              No tasks found. Click "Add New Task" to create one!
            </div>
          ) : (
            filteredTasks.map(task => (
              <div
                key={task.id}
                className="flex items-center justify-between p-4 bg-surface-container-high/60 hover:bg-surface-container-high rounded-xl border border-outline-variant/30 transition group"
              >
                <div className="flex items-center gap-3.5">
                  <button
                    onClick={() => toggleTask(task.id)}
                    className="text-on-surface-variant hover:text-primary-fixed transition cursor-pointer"
                  >
                    {task.completed || task.status === 'completed' ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <Circle className="w-5 h-5" />
                    )}
                  </button>

                  <div>
                    <h4 className={`font-semibold text-sm ${task.completed ? 'line-through text-on-surface-variant' : 'text-white'}`}>
                      {task.title}
                    </h4>
                    <div className="flex items-center gap-2 mt-1 text-xs text-on-surface-variant">
                      <span className="bg-surface-variant px-2 py-0.5 rounded text-[10px] font-mono">{task.subject}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{task.planned_minutes} mins</span>
                      <span>Due: {task.due_date}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {getPriorityBadge(task.priority)}
                  <select
                    value={task.status || (task.completed ? 'completed' : 'todo')}
                    onChange={e => updateTaskStatus(task.id, e.target.value as any)}
                    className="bg-surface-variant text-on-surface text-xs rounded border border-outline-variant/40 px-2 py-1 focus:outline-none"
                  >
                    <option value="todo">To Do</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                  <button
                    onClick={() => deleteTask(task.id)}
                    className="text-on-surface-variant hover:text-red-400 opacity-0 group-hover:opacity-100 transition cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Add Task Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-surface-container-high border border-outline-variant rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-xl font-bold text-white">Create New Task</h3>

            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-on-surface-variant mb-1">Task Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Solve LeetCode Problems"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full bg-surface-variant border border-outline-variant/60 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono text-on-surface-variant mb-1">Subject</label>
                  <input
                    type="text"
                    value={subject}
                    onChange={e => setSubject(e.target.value)}
                    className="w-full bg-surface-variant border border-outline-variant/60 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-on-surface-variant mb-1">Planned (Mins)</label>
                  <input
                    type="number"
                    min="5"
                    max="480"
                    value={plannedMinutes}
                    onChange={e => setPlannedMinutes(Number(e.target.value))}
                    className="w-full bg-surface-variant border border-outline-variant/60 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono text-on-surface-variant mb-1">Priority</label>
                  <select
                    value={priority}
                    onChange={e => setPriority(e.target.value as any)}
                    className="w-full bg-surface-variant border border-outline-variant/60 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-primary"
                  >
                    <option value="high">High Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="low">Low Priority</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono text-on-surface-variant mb-1">Due Date</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={e => setDueDate(e.target.value)}
                    className="w-full bg-surface-variant border border-outline-variant/60 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm rounded-xl text-on-surface-variant hover:bg-surface-variant transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-bold bg-primary text-on-primary rounded-xl shadow-[0_0_15px_rgba(0,255,163,0.3)] hover:brightness-110 transition"
                >
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function KanbanColumn({
  title,
  count,
  tasks,
  colorBorder,
  statusTarget,
  onToggle,
  onMoveStatus,
  onDelete,
  getPriorityBadge,
}: {
  title: string;
  count: number;
  tasks: TaskItem[];
  colorBorder: string;
  statusTarget: TaskItem['status'];
  onToggle: (id: string) => void;
  onMoveStatus: (id: string, status: TaskItem['status']) => void;
  onDelete: (id: string) => void;
  getPriorityBadge: (p: TaskItem['priority']) => React.ReactNode;
}) {
  return (
    <div className={`bg-surface-container rounded-2xl border border-outline-variant/40 border-t-4 ${colorBorder} p-4 flex flex-col h-full min-h-[350px]`}>
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-outline-variant/30">
        <h3 className="font-bold text-white text-sm tracking-wide">{title}</h3>
        <span className="bg-surface-variant text-on-surface-variant font-mono text-xs font-bold px-2 py-0.5 rounded-full">
          {count}
        </span>
      </div>

      <div className="space-y-3 flex-1 overflow-y-auto max-h-[500px] pr-1">
        {tasks.length === 0 ? (
          <div className="h-32 flex items-center justify-center text-xs text-on-surface-variant/50 italic font-mono border border-dashed border-outline-variant/30 rounded-xl">
            No tasks in {title.toLowerCase()}
          </div>
        ) : (
          tasks.map(t => (
            <div
              key={t.id}
              className="bg-surface-container-high/70 hover:bg-surface-container-high rounded-xl border border-outline-variant/40 p-3.5 space-y-2.5 transition shadow-sm group"
            >
              <div className="flex items-start justify-between gap-2">
                <button
                  onClick={() => onToggle(t.id)}
                  className="mt-0.5 text-on-surface-variant hover:text-primary-fixed transition cursor-pointer"
                >
                  {t.completed || t.status === 'completed' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Circle className="w-4 h-4" />
                  )}
                </button>
                <h4 className={`text-xs font-semibold flex-1 leading-snug ${t.completed ? 'line-through text-on-surface-variant' : 'text-white'}`}>
                  {t.title}
                </h4>
                <button
                  onClick={() => onDelete(t.id)}
                  className="text-on-surface-variant hover:text-red-400 opacity-0 group-hover:opacity-100 transition cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-outline-variant/20 text-[10px]">
                <div className="flex items-center gap-1.5">
                  {getPriorityBadge(t.priority)}
                  <span className="text-on-surface-variant font-mono bg-surface-variant px-1.5 py-0.5 rounded">{t.subject}</span>
                </div>

                <div className="flex items-center gap-1 text-on-surface-variant">
                  <Clock className="w-3 h-3" />
                  <span>{t.planned_minutes}m</span>
                </div>
              </div>

              {/* Status Move Quick Action */}
              <div className="flex justify-end gap-1 text-[10px] pt-1">
                {statusTarget !== 'todo' && (
                  <button
                    onClick={() => onMoveStatus(t.id, 'todo')}
                    className="text-on-surface-variant hover:text-white bg-surface-variant px-2 py-0.5 rounded transition"
                  >
                    ← To Do
                  </button>
                )}
                {statusTarget !== 'in_progress' && (
                  <button
                    onClick={() => onMoveStatus(t.id, 'in_progress')}
                    className="text-on-surface-variant hover:text-primary-fixed bg-surface-variant px-2 py-0.5 rounded transition"
                  >
                    In Progress
                  </button>
                )}
                {statusTarget !== 'completed' && (
                  <button
                    onClick={() => onMoveStatus(t.id, 'completed')}
                    className="text-emerald-400 hover:text-emerald-300 bg-surface-variant px-2 py-0.5 rounded transition"
                  >
                    Completed ✓
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
