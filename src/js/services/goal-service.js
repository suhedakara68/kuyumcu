// ============================================
// NOVENTRA PWA — Savings Goal Service
// ============================================
import { saveData, loadData } from './firebase-service.js';

const STORAGE_KEY = 'noventra_goals';
let goals = [];

export async function initGoals() {
  try {
    const cloudData = await loadData('goals');
    if (cloudData && cloudData.items) {
      goals = cloudData.items;
      saveLocal();
    } else {
      const saved = localStorage.getItem(STORAGE_KEY);
      goals = saved ? JSON.parse(saved) : [];
    }
  } catch (e) {
    const saved = localStorage.getItem(STORAGE_KEY);
    goals = saved ? JSON.parse(saved) : [];
  }
}

export function getGoals() {
  return [...goals];
}

export function addGoal(goal) {
  const newGoal = {
    id: Date.now().toString(),
    title: goal.title,
    targetAmount: parseFloat(goal.targetAmount), // in grams
    currentAmount: 0,
    unit: 'gr',
    createdAt: new Date().toISOString()
  };
  goals.push(newGoal);
  saveGoals();
  return newGoal;
}

export function updateGoalProgress(currentAssets) {
  // Simple logic: total grams of gold in portfolio
  const totalGrams = currentAssets
    .filter(a => a.type === 'gold')
    .reduce((sum, a) => sum + (parseFloat(a.amount) || 0), 0);
  
  goals.forEach(g => {
    g.currentAmount = totalGrams;
  });
  
  saveLocal();
}

export function deleteGoal(id) {
  goals = goals.filter(g => g.id !== id);
  saveGoals();
}

function saveGoals() {
  saveLocal();
  saveData('goals', { items: goals, updatedAt: new Date() });
}

function saveLocal() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(goals));
}
