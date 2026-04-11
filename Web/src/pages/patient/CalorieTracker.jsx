import { useState, useEffect } from 'react';
import PatientLayout from '@/components/layout/PatientLayout';
import BorderGlow from '@/components/ui/BorderGlow';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { calorieService } from '@/services/calorie.service';
import { Calendar, Flame, TrendingUp, AlertCircle, Loader2 } from 'lucide-react';

export default function CalorieTracker() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [dailyData, setDailyData] = useState(null);
  const [monthlyData, setMonthlyData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const [mealInputs, setMealInputs] = useState({
    breakfast: '',
    lunch: '',
    dinner: ''
  });

  const CALORIE_LIMIT = 2000;

  useEffect(() => {
    loadDailyData();
  }, [selectedDate]);

  useEffect(() => {
    loadMonthlyData();
  }, [currentMonth]);

  const loadDailyData = async () => {
    try {
      setLoading(true);
      const dateStr = formatDate(selectedDate);
      const data = await calorieService.getDailyCalories(dateStr);
      setDailyData(data);
      
      // Populate inputs with existing data
      setMealInputs({
        breakfast: data?.breakfast?.foods || '',
        lunch: data?.lunch?.foods || '',
        dinner: data?.dinner?.foods || ''
      });
    } catch (error) {
      console.error('Error loading daily data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMonthlyData = async () => {
    try {
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth() + 1;
      const data = await calorieService.getMonthlyCalories(year, month);
      setMonthlyData(data);
    } catch (error) {
      console.error('Error loading monthly data:', error);
    }
  };

  const handleMealSubmit = async (mealType) => {
    if (!mealInputs[mealType].trim()) {
      alert('Please enter food items');
      return;
    }

    try {
      setSubmitting(true);
      const dateStr = formatDate(selectedDate);
      await calorieService.addMealEntry(dateStr, mealType, mealInputs[mealType]);
      await loadDailyData();
      await loadMonthlyData();
    } catch (error) {
      console.error('Error submitting meal:', error);
      alert('Failed to save meal entry');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    return { daysInMonth, startingDayOfWeek };
  };

  const getCalorieColor = (calories) => {
    if (calories === 0) return 'bg-gray-700';
    const intensity = Math.min(calories / CALORIE_LIMIT, 1);
    if (calories > CALORIE_LIMIT) {
      return 'bg-red-500';
    }
    if (intensity < 0.25) return 'bg-green-200';
    if (intensity < 0.5) return 'bg-green-300';
    if (intensity < 0.75) return 'bg-yellow-400';
    return 'bg-orange-400';
  };

  const renderCalendar = () => {
    const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentMonth);
    const days = [];
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    // Week day headers
    const headers = weekDays.map(day => (
      <div key={day} className="text-center text-sm font-semibold text-gray-400 py-2">
        {day}
      </div>
    ));

    // Empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(<div key={`empty-${i}`} className="aspect-square" />);
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
      date.setHours(0, 0, 0, 0);
      const dateStr = formatDate(date);
      const dayData = monthlyData?.daily_data?.find(d => d.date === dateStr);
      const isSelected = formatDate(selectedDate) === dateStr;
      const isToday = formatDate(today) === dateStr;
      const isFuture = date > today;
      const calories = dayData?.total_calories || 0;
      const exceeded = dayData?.exceeded_limit || false;

      days.push(
        <button
          key={day}
          onClick={() => !isFuture && setSelectedDate(date)}
          disabled={isFuture}
          className={`aspect-square relative rounded-lg transition-all ${
            isFuture 
              ? 'opacity-30 cursor-not-allowed' 
              : isSelected 
                ? 'ring-2 ring-blue-400 scale-105' 
                : 'hover:scale-105 hover:ring-1 hover:ring-white/30'
          } ${getCalorieColor(calories)}`}
        >
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-sm font-semibold ${
              isFuture 
                ? 'text-gray-600' 
                : calories > 0 
                  ? 'text-gray-900' 
                  : 'text-gray-400'
            }`}>
              {day}
            </span>
            {exceeded && !isFuture && (
              <div className="absolute top-1 right-1 w-2 h-2 bg-red-600 rounded-full" />
            )}
            {isToday && !isSelected && (
              <div className="absolute bottom-1 w-1 h-1 bg-blue-400 rounded-full" />
            )}
          </div>
        </button>
      );
    }

    return (
      <div className="grid grid-cols-7 gap-2">
        {headers}
        {days}
      </div>
    );
  };

  const renderHeatmapLegend = () => (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-gray-400">Less</span>
      <div className="w-4 h-4 bg-gray-700 rounded" />
      <div className="w-4 h-4 bg-green-200 rounded" />
      <div className="w-4 h-4 bg-green-300 rounded" />
      <div className="w-4 h-4 bg-yellow-400 rounded" />
      <div className="w-4 h-4 bg-orange-400 rounded" />
      <div className="w-4 h-4 bg-red-500 rounded" />
      <span className="text-gray-400">More</span>
    </div>
  );

  const totalCalories = dailyData?.total_calories || 0;
  const exceededLimit = dailyData?.exceeded_limit || false;

  return (
    <PatientLayout>
      <div className="space-y-6 animate-in fade-in duration-500">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Flame className="h-8 w-8 text-orange-400" />
            <div>
              <h1 className="text-3xl font-bold text-white">Calorie Tracker</h1>
              <p className="text-gray-300">Track your daily food intake</p>
            </div>
          </div>
        </div>

        {/* Daily Summary */}
        <BorderGlow glowColor="30 80 80">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const newDate = new Date(selectedDate);
                    newDate.setDate(newDate.getDate() - 1);
                    setSelectedDate(newDate);
                    // Update month if needed
                    if (newDate.getMonth() !== currentMonth.getMonth() || newDate.getFullYear() !== currentMonth.getFullYear()) {
                      setCurrentMonth(newDate);
                    }
                  }}
                  className="text-white hover:bg-white/10"
                  title="Previous day"
                >
                  ←
                </Button>
                <h2 className="text-xl font-semibold text-white">
                  {selectedDate.toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const newDate = new Date(selectedDate);
                    newDate.setDate(newDate.getDate() + 1);
                    setSelectedDate(newDate);
                    // Update month if needed
                    if (newDate.getMonth() !== currentMonth.getMonth() || newDate.getFullYear() !== currentMonth.getFullYear()) {
                      setCurrentMonth(newDate);
                    }
                  }}
                  disabled={formatDate(selectedDate) === formatDate(new Date())}
                  className="text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Next day"
                >
                  →
                </Button>
              </div>
              {exceededLimit && (
                <div className="flex items-center gap-2 text-red-400">
                  <AlertCircle className="h-5 w-5" />
                  <span className="text-sm font-medium">Limit Exceeded!</span>
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <p className="text-sm text-gray-400 mb-1">Total Calories</p>
                <p className={`text-3xl font-bold ${exceededLimit ? 'text-red-400' : 'text-emerald-400'}`}>
                  {totalCalories.toFixed(0)}
                </p>
              </div>
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <p className="text-sm text-gray-400 mb-1">Daily Limit</p>
                <p className="text-3xl font-bold text-blue-400">{CALORIE_LIMIT}</p>
              </div>
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <p className="text-sm text-gray-400 mb-1">Remaining</p>
                <p className={`text-3xl font-bold ${
                  CALORIE_LIMIT - totalCalories < 0 ? 'text-red-400' : 'text-gray-300'
                }`}>
                  {Math.max(0, CALORIE_LIMIT - totalCalories).toFixed(0)}
                </p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden">
              <div 
                className={`h-full transition-all duration-500 ${
                  exceededLimit ? 'bg-red-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.min((totalCalories / CALORIE_LIMIT) * 100, 100)}%` }}
              />
            </div>
          </div>
        </BorderGlow>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Meal Inputs */}
          <BorderGlow glowColor="200 60 40">
            <div className="p-6">
              <h3 className="text-xl font-semibold text-white mb-6">Log Your Meals</h3>
              
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 text-blue-400 animate-spin" />
                </div>
              ) : (
                <div className="space-y-6">
                  {['breakfast', 'lunch', 'dinner'].map((meal) => (
                    <div key={meal} className="space-y-2">
                      <label className="text-sm font-medium text-gray-300 capitalize flex items-center gap-2">
                        {meal}
                        {dailyData?.[meal] && (
                          <span className="text-xs text-emerald-400">
                            ({dailyData[meal].calories.toFixed(0)} cal)
                          </span>
                        )}
                      </label>
                      <div className="flex gap-2">
                        <Input
                          value={mealInputs[meal]}
                          onChange={(e) => setMealInputs({...mealInputs, [meal]: e.target.value})}
                          placeholder={`e.g., 2 eggs, toast, orange juice`}
                          className="flex-1"
                        />
                        <Button
                          onClick={() => handleMealSubmit(meal)}
                          disabled={submitting || !mealInputs[meal].trim()}
                          className="bg-blue-500 hover:bg-blue-600"
                        >
                          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}
                        </Button>
                      </div>
                      {dailyData?.[meal] && (
                        <p className="text-xs text-gray-400">
                          Logged: {dailyData[meal].foods}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </BorderGlow>

          {/* Calendar Heatmap */}
          <BorderGlow glowColor="280 60 40">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-white">Monthly Overview</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const today = new Date();
                    setSelectedDate(today);
                    setCurrentMonth(today);
                  }}
                  className="text-white border-white/20 hover:bg-white/10"
                >
                  Today
                </Button>
              </div>

              <div className="flex items-center justify-center gap-4 mb-6 bg-white/5 rounded-lg p-3 border border-white/10">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                  className="text-white hover:bg-white/10 px-4"
                >
                  ← Prev
                </Button>
                <span className="text-white font-semibold text-lg min-w-[180px] text-center">
                  {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                  disabled={
                    currentMonth.getMonth() === new Date().getMonth() && 
                    currentMonth.getFullYear() === new Date().getFullYear()
                  }
                  className="text-white hover:bg-white/10 px-4 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  Next →
                </Button>
              </div>

              {renderCalendar()}

              <div className="mt-6 flex justify-center">
                {renderHeatmapLegend()}
              </div>
            </div>
          </BorderGlow>
        </div>
      </div>
    </PatientLayout>
  );
}
